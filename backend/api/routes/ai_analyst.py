from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

router = APIRouter()

class MetricHighlight(BaseModel):
    label: str
    value: str

class TableDataPayload(BaseModel):
    headers: List[str]
    rows: List[List[Any]]

class ChartSuggestionPayload(BaseModel):
    id: str
    title: str
    chartType: str
    xAxisKey: str
    series: List[Dict[str, str]]
    data: List[Dict[str, Any]]
    description: str

class AiQueryRequest(BaseModel):
    query: str
    records: List[Dict[str, Any]]
    dataset_name: Optional[str] = "Dataset"
    columns: Optional[List[str]] = None

class AiQueryResponse(BaseModel):
    answer_text: str
    query_type: str
    target_metric: Optional[str] = None
    group_dimension: Optional[str] = None
    metrics_highlighted: List[MetricHighlight] = []
    pandas_code: str
    sql_code: str
    table_data: Optional[TableDataPayload] = None
    chart_suggestion: Optional[ChartSuggestionPayload] = None
    follow_ups: List[str] = []

class SuggestQuestionsRequest(BaseModel):
    columns: List[str]
    domain: Optional[str] = "general"
    dataset_name: Optional[str] = "Dataset"

class SuggestQuestionsResponse(BaseModel):
    suggested_questions: List[str]


@router.post("/query", response_model=AiQueryResponse)
async def api_ai_query(req: AiQueryRequest):
    if not req.records:
        raise HTTPException(status_code=400, detail="Cannot process query against empty records list.")

    df = pd.DataFrame(req.records)
    query_lower = req.query.lower().strip()
    col_names = df.columns.tolist()

    # Identify numeric and categorical columns
    numeric_cols = [c for c in col_names if pd.api.types.is_numeric_dtype(df[c])]
    categorical_cols = [c for c in col_names if c not in numeric_cols]

    # Check for requested missing attributes
    if ("roi" in query_lower or "campaign" in query_lower) and not any(k in [c.lower() for c in col_names] for k in ["campaign", "channel", "spend"]):
        return AiQueryResponse(
            answer_text=f"The dataset '{req.dataset_name}' does not contain campaign or advertising spend fields required to determine campaign ROI. Available columns are: {', '.join(col_names)}.",
            query_type="UNKNOWN",
            metrics_highlighted=[MetricHighlight(label="Missing Dimension", value="Campaign / Marketing")],
            pandas_code="# Campaign columns not detected in DataFrame",
            sql_code=f"SELECT * FROM \"{req.dataset_name}\" LIMIT 0;",
            follow_ups=["Summarize available metrics", "Show top 5 rows"]
        )

    unknown_concepts = ['churn', 'ebitda', 'nps', 'temperature', 'humidity', 'bounce_rate']
    for concept in unknown_concepts:
        if concept in query_lower and concept not in [c.lower() for c in col_names]:
            return AiQueryResponse(
                answer_text=f"The dataset '{req.dataset_name}' does not contain fields for '{concept}'. Available fields are: {', '.join(col_names)}.",
                query_type="UNKNOWN",
                metrics_highlighted=[MetricHighlight(label="Missing Attribute", value=concept)],
                pandas_code=f"# Available columns\nprint(df.columns.tolist())",
                sql_code=f"SELECT * FROM \"{req.dataset_name}\" LIMIT 0;",
                follow_ups=["Summarize available metrics", "Show top 5 rows"]
            )

    # 1. EXECUTIVE SUMMARY
    if "executive summary" in query_lower or "briefing" in query_lower:
        row_count = len(df)
        col_count = len(col_names)
        primary_num = numeric_cols[0] if numeric_cols else col_names[0]
        primary_cat = categorical_cols[0] if categorical_cols else col_names[0]
        total_val = float(df[primary_num].sum()) if primary_num in numeric_cols else 0.0
        mean_val = float(df[primary_num].mean()) if primary_num in numeric_cols else 0.0

        grouped = df.groupby(primary_cat)[primary_num].sum().reset_index().sort_values(by=primary_num, ascending=False)
        leader = grouped.iloc[0][primary_cat] if len(grouped) > 0 else "None"
        leader_val = float(grouped.iloc[0][primary_num]) if len(grouped) > 0 else 0.0
        leader_share = (leader_val / total_val * 100) if total_val > 0 else 0.0

        chart_data = [{"name": str(r[primary_cat]), primary_num: float(r[primary_num])} for _, r in grouped.head(5).iterrows()]
        tbl = TableDataPayload(
            headers=["Executive Metric", "Telemetry Value", "Status"],
            rows=[
                [f"Total {primary_num}", f"{total_val:,.2f}", "Verified"],
                [f"Average {primary_num}", f"{mean_val:,.2f}", "Verified"],
                [f"Leading {primary_cat}", f"{leader} ({leader_share:.1f}%)", "Dominant"],
                ["Total Record Count", f"{row_count:,}", "Clean"],
            ]
        )

        return AiQueryResponse(
            answer_text=f"Executive Briefing for {req.dataset_name}: Total {primary_num} is {total_val:,.2f} across {row_count:,} records. Leading {primary_cat} is {leader} generating {leader_val:,.2f} ({leader_share:.1f}% of total).",
            query_type="EXECUTIVE_SUMMARY",
            target_metric=primary_num,
            group_dimension=primary_cat,
            metrics_highlighted=[
                MetricHighlight(label=f"Total {primary_num}", value=f"{total_val:,.2f}"),
                MetricHighlight(label=f"Leading {primary_cat}", value=f"{leader} ({leader_share:.1f}%)"),
                MetricHighlight(label="Total Records", value=f"{row_count:,}"),
            ],
            chart_suggestion=ChartSuggestionPayload(
                id=f"chart-exec-{primary_num}",
                title=f"Top {primary_cat} Distribution",
                chartType="bar",
                xAxisKey="name",
                series=[{"key": primary_num, "label": primary_num, "color": "#8b5cf6"}],
                data=chart_data,
                description=f"Executive distribution breakdown across {primary_cat}"
            ),
            table_data=tbl,
            pandas_code=f"print(df['{primary_num}'].sum())\nprint(df.groupby('{primary_cat}')['{primary_num}'].sum().nlargest(5))",
            sql_code=f"SELECT SUM({primary_num}) AS total_{primary_num} FROM \"{req.dataset_name}\";",
            follow_ups=["What are the biggest business risks?", "Find unusual patterns", "Identify revenue trends"]
        )

    # 2. BUSINESS RISKS
    if any(k in query_lower for k in ["risk", "vulnerabilit", "threat"]):
        primary_num = numeric_cols[0] if numeric_cols else col_names[0]
        primary_cat = categorical_cols[0] if categorical_cols else col_names[0]
        total_val = float(df[primary_num].sum()) if primary_num in numeric_cols else 1.0

        grouped = df.groupby(primary_cat)[primary_num].sum().reset_index().sort_values(by=primary_num, ascending=False)
        leader = grouped.iloc[0][primary_cat] if len(grouped) > 0 else "None"
        leader_share = (float(grouped.iloc[0][primary_num]) / total_val * 100) if total_val > 0 and len(grouped) > 0 else 0.0

        is_high_risk = leader_share > 35
        missing_count = int(df.isna().sum().sum())

        tbl = TableDataPayload(
            headers=["Risk Category", "Severity", "Observed Finding", "Mitigation"],
            rows=[
                ["Portfolio Concentration", "HIGH" if is_high_risk else "LOW", f"Top {primary_cat} '{leader}' commands {leader_share:.1f}% of volume", "Diversify customer base" if is_high_risk else "Maintain diversification"],
                ["Data Integrity", "MEDIUM" if missing_count > 0 else "LOW", f"{missing_count} missing cells detected in data", "Apply imputation" if missing_count > 0 else "No action required"],
            ]
        )

        return AiQueryResponse(
            answer_text=f"Business Risk Assessment for {req.dataset_name}: Concentration risk is {'HIGH' if is_high_risk else 'LOW'} (top {primary_cat} '{leader}' represents {leader_share:.1f}% of all {primary_num}). Total missing cells: {missing_count}.",
            query_type="BUSINESS_RISKS",
            metrics_highlighted=[
                MetricHighlight(label="Concentration Severity", value="HIGH" if is_high_risk else "LOW"),
                MetricHighlight(label=f"Top {primary_cat} Share", value=f"{leader_share:.1f}%"),
                MetricHighlight(label="Missing Cells", value=str(missing_count)),
            ],
            table_data=tbl,
            pandas_code=f"share = (df.groupby('{primary_cat}')['{primary_num}'].sum() / df['{primary_num}'].sum()) * 100\nprint(share.sort_values(ascending=False))",
            sql_code=f"SELECT {primary_cat}, SUM({primary_num}) * 100.0 / SUM(SUM({primary_num})) OVER () AS share FROM \"{req.dataset_name}\" GROUP BY {primary_cat} ORDER BY share DESC;",
            follow_ups=["Find unusual patterns", f"Who are my top 10 {primary_cat}?", "Generate an executive summary"]
        )

    # 3. ANOMALY PATTERNS
    if any(k in query_lower for k in ["unusual", "anomal", "outlier", "irregular"]):
        primary_num = numeric_cols[0] if numeric_cols else col_names[0]
        primary_cat = categorical_cols[0] if categorical_cols else col_names[0]

        q1 = float(df[primary_num].quantile(0.25))
        q3 = float(df[primary_num].quantile(0.75))
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr

        outliers = df[(df[primary_num] < lower) | (df[primary_num] > upper)]
        outlier_count = len(outliers)

        tbl = TableDataPayload(
            headers=["Row", primary_cat, primary_num, "Anomaly Type"],
            rows=[[f"#{idx+1}", str(row[primary_cat]), f"{float(row[primary_num]):,.2f}", "High Outlier" if float(row[primary_num]) > upper else "Low Outlier"] for idx, row in outliers.head(5).iterrows()] if outlier_count > 0 else [[1, "Dataset Median", f"{float(df[primary_num].median()):,.2f}", "Normal"]]
        )

        return AiQueryResponse(
            answer_text=f"Anomaly Analysis for {req.dataset_name}: Detected {outlier_count} statistical outliers in {primary_num} outside 1.5×IQR boundary ({lower:,.2f} to {upper:,.2f}).",
            query_type="ANOMALY_PATTERNS",
            metrics_highlighted=[
                MetricHighlight(label="Outliers Detected", value=str(outlier_count)),
                MetricHighlight(label="Upper IQR Bound", value=f"{upper:,.2f}"),
                MetricHighlight(label="Lower IQR Bound", value=f"{lower:,.2f}"),
            ],
            table_data=tbl,
            pandas_code=f"q1 = df['{primary_num}'].quantile(0.25)\nq3 = df['{primary_num}'].quantile(0.75)\noutliers = df[(df['{primary_num}'] < q1 - 1.5*(q3-q1)) | (df['{primary_num}'] > q3 + 1.5*(q3-q1))]",
            sql_code=f"SELECT * FROM \"{req.dataset_name}\" WHERE {primary_num} > {upper:.2f} OR {primary_num} < {lower:.2f};",
            follow_ups=["What are the biggest business risks?", "Generate an executive summary"]
        )

    # 1. SUMMARY
    if any(k in query_lower for k in ["summary", "summarize", "overview", "describe"]):
        row_count = len(df)
        col_count = len(col_names)
        primary_num = numeric_cols[0] if numeric_cols else None
        total_val = float(df[primary_num].sum()) if primary_num else 0.0

        highlights = [
            MetricHighlight(label="Total Records", value=f"{row_count:,}"),
            MetricHighlight(label="Attributes", value=f"{col_count}"),
        ]
        if primary_num:
            highlights.append(MetricHighlight(label=f"Total {primary_num}", value=f"{total_val:,.2f}"))

        tbl = TableDataPayload(
            headers=["Attribute", "Data Type", "Non-Null Count", "Unique Values"],
            rows=[[col, str(df[col].dtype), int(df[col].count()), int(df[col].nunique())] for col in col_names[:8]]
        )

        return AiQueryResponse(
            answer_text=f"Dataset '{req.dataset_name}' contains {row_count:,} rows across {col_count} attributes. Primary numerical metrics include {', '.join(numeric_cols[:3]) or 'None'}.",
            query_type="SUMMARY",
            metrics_highlighted=highlights,
            pandas_code=f"df.info()\ndf.describe()",
            sql_code=f"SELECT COUNT(*) AS total_rows FROM \"{req.dataset_name}\";",
            table_data=tbl,
            follow_ups=[f"What is total {primary_num}?" if primary_num else "List all columns", "Show top 5 rows"]
        )

    # 2. CORRELATION
    if any(k in query_lower for k in ["correlation", "correlate", "vs", "versus", "relationship"]):
        if len(numeric_cols) >= 2:
            m1, m2 = numeric_cols[0], numeric_cols[1]
            # Try to match names in query
            matched = [c for c in numeric_cols if c.lower() in query_lower]
            if len(matched) >= 2:
                m1, m2 = matched[0], matched[1]

            corr = float(df[[m1, m2]].corr().iloc[0, 1])
            if np.isnan(corr):
                corr = 0.0

            chart_data = [{"id": i+1, m1: float(row[m1]), m2: float(row[m2])} for i, row in df.head(30).iterrows()]

            return AiQueryResponse(
                answer_text=f"The Pearson correlation coefficient between {m1} and {m2} is r = {corr:.3f}.",
                query_type="CORRELATION",
                target_metric=m1,
                metrics_highlighted=[
                    MetricHighlight(label="Pearson r", value=f"{corr:.3f}"),
                    MetricHighlight(label="Variables", value=f"{m1} & {m2}")
                ],
                chart_suggestion=ChartSuggestionPayload(
                    id=f"chart-corr-{m1}-{m2}",
                    title=f"Correlation: {m1} vs {m2} (r={corr:.2f})",
                    chartType="scatter",
                    xAxisKey=m1,
                    series=[{"key": m2, "label": m2, "color": "#8b5cf6"}],
                    data=chart_data,
                    description=f"Scatter dispersion between {m1} and {m2}"
                ),
                pandas_code=f"r = df[['{m1}', '{m2}']].corr().iloc[0, 1]\nprint(f'Pearson r: {{r:.3f}}')",
                sql_code=f"SELECT CORR({m1}, {m2}) FROM \"{req.dataset_name}\";",
                follow_ups=[f"Average {m1}", f"Average {m2}", f"Distribution of {m1}"]
            )

    # 3. RANKING (Top N / Bottom N)
    is_top = any(k in query_lower for k in ["top", "highest", "best", "leading"])
    is_bottom = any(k in query_lower for k in ["bottom", "lowest", "worst"])

    if (is_top or is_bottom) and categorical_cols and numeric_cols:
        dim = categorical_cols[0]
        metric = numeric_cols[0]
        limit = 5

        for c in categorical_cols:
            if c.lower() in query_lower:
                dim = c
                break
        for m in numeric_cols:
            if m.lower() in query_lower:
                metric = m
                break

        grouped = df.groupby(dim)[metric].sum().reset_index()
        sorted_df = grouped.sort_values(by=metric, ascending=is_bottom).head(limit)

        leader = sorted_df.iloc[0][dim] if len(sorted_df) > 0 else "None"
        leader_val = float(sorted_df.iloc[0][metric]) if len(sorted_df) > 0 else 0.0

        chart_data = [{"name": str(r[dim]), metric: float(r[metric])} for _, r in sorted_df.iterrows()]
        tbl = TableDataPayload(
            headers=["Rank", dim, f"Total {metric}"],
            rows=[[f"#{i+1}", str(r[dim]), f"{float(r[metric]):,.2f}"] for i, (_, r) in enumerate(sorted_df.iterrows())]
        )

        return AiQueryResponse(
            answer_text=f"The {'bottom' if is_bottom else 'top'} {limit} {dim} entities by {metric} are led by {leader} with {leader_val:,.2f}.",
            query_type="RANKING",
            target_metric=metric,
            group_dimension=dim,
            metrics_highlighted=[
                MetricHighlight(label=f"#1 {'Lowest' if is_bottom else 'Leader'}", value=str(leader)),
                MetricHighlight(label=f"Total {metric}", value=f"{leader_val:,.2f}")
            ],
            chart_suggestion=ChartSuggestionPayload(
                id=f"chart-rank-{dim}-{metric}",
                title=f"{'Bottom' if is_bottom else 'Top'} {limit} {dim} by {metric}",
                chartType="bar",
                xAxisKey="name",
                series=[{"key": metric, "label": metric, "color": "#f43f5e" if is_bottom else "#8b5cf6"}],
                data=chart_data,
                description=f"Leaderboard ranking of {dim} by aggregate {metric}"
            ),
            table_data=tbl,
            pandas_code=f"df.groupby('{dim}')['{metric}'].sum().{'nsmallest' if is_bottom else 'nlargest'}({limit}).reset_index()",
            sql_code=f"SELECT {dim}, SUM({metric}) AS total_{metric} FROM \"{req.dataset_name}\" GROUP BY {dim} ORDER BY total_{metric} {'ASC' if is_bottom else 'DESC'} LIMIT {limit};",
            follow_ups=[f"Show breakdown across all {dim}", f"What is total {metric}?"]
        )

    # 4. BREAKDOWN / GROUP BY
    is_breakdown = any(k in query_lower for k in ["breakdown", "by", "per", "across", "split"])
    if is_breakdown and categorical_cols and numeric_cols:
        dim = categorical_cols[0]
        metric = numeric_cols[0]

        for c in categorical_cols:
            if c.lower() in query_lower:
                dim = c
                break
        for m in numeric_cols:
            if m.lower() in query_lower:
                metric = m
                break

        grouped = df.groupby(dim)[metric].sum().reset_index().sort_values(by=metric, ascending=False)
        total_sum = float(grouped[metric].sum()) if len(grouped) > 0 else 1.0

        chart_data = [{"name": str(r[dim]), metric: float(r[metric])} for _, r in grouped.head(10).iterrows()]
        tbl = TableDataPayload(
            headers=[dim, f"Total {metric}", "Share (%)"],
            rows=[[str(r[dim]), f"{float(r[metric]):,.2f}", f"{(float(r[metric])/total_sum*100):.1f}%"] for _, r in grouped.head(8).iterrows()]
        )

        return AiQueryResponse(
            answer_text=f"Breakdown of {metric} across {dim} calculated across {len(grouped)} distinct categories.",
            query_type="BREAKDOWN",
            target_metric=metric,
            group_dimension=dim,
            metrics_highlighted=[
                MetricHighlight(label=f"Total {metric}", value=f"{total_sum:,.2f}"),
                MetricHighlight(label="Top Segment", value=str(grouped.iloc[0][dim]) if len(grouped) > 0 else "None")
            ],
            chart_suggestion=ChartSuggestionPayload(
                id=f"chart-bd-{dim}-{metric}",
                title=f"{metric} by {dim}",
                chartType="bar",
                xAxisKey="name",
                series=[{"key": metric, "label": metric, "color": "#6366f1"}],
                data=chart_data,
                description=f"Distribution of {metric} across {dim}"
            ),
            table_data=tbl,
            pandas_code=f"df.groupby('{dim}')['{metric}'].sum().reset_index().sort_values(by='{metric}', ascending=False)",
            sql_code=f"SELECT {dim}, SUM({metric}) AS total_{metric} FROM \"{req.dataset_name}\" GROUP BY {dim} ORDER BY total_{metric} DESC;",
            follow_ups=[f"Top 5 {dim} by {metric}", f"Average {metric} per {dim}"]
        )

    # 5. AGGREGATIONS (Default fallback to single metric)
    target_col = numeric_cols[0] if numeric_cols else col_names[0]
    for c in numeric_cols:
        if c.lower() in query_lower:
            target_col = c
            break

    agg_func = "sum"
    if any(k in query_lower for k in ["average", "avg", "mean"]):
        agg_func = "avg"
        val = float(df[target_col].mean())
    elif any(k in query_lower for k in ["max", "highest", "peak"]):
        agg_func = "max"
        val = float(df[target_col].max())
    elif any(k in query_lower for k in ["min", "lowest"]):
        agg_func = "min"
        val = float(df[target_col].min())
    elif any(k in query_lower for k in ["count", "how many"]):
        agg_func = "count"
        val = float(len(df))
    else:
        val = float(df[target_col].sum())

    return AiQueryResponse(
        answer_text=f"The {agg_func.upper()} of {target_col} in {req.dataset_name} is {val:,.2f}.",
        query_type="AGGREGATION",
        target_metric=target_col,
        metrics_highlighted=[
            MetricHighlight(label=f"{agg_func.upper()} {target_col}", value=f"{val:,.2f}"),
            MetricHighlight(label="Data Points", value=f"{len(df):,}")
        ],
        pandas_code=f"result = df['{target_col}'].{'mean' if agg_func == 'avg' else agg_func}()\nprint(result)",
        sql_code=f"SELECT {'AVG' if agg_func == 'avg' else agg_func.upper()}({target_col}) FROM \"{req.dataset_name}\";",
        follow_ups=[f"Show breakdown of {target_col}", f"Top 5 records by {target_col}"]
    )


@router.post("/suggest", response_model=SuggestQuestionsResponse)
async def api_suggest_questions(req: SuggestQuestionsRequest):
    cols = req.columns
    if not cols:
        return SuggestQuestionsResponse(suggested_questions=[
            "What datasets are loaded?",
            "How do I upload data?"
        ])

    questions = [
        f"Summarize the {req.dataset_name} dataset",
        f"What is the total of {cols[0]}?" if cols else "Overview of key metrics"
    ]
    if len(cols) >= 2:
        questions.append(f"Breakdown of {cols[0]} by {cols[1]}")
        questions.append(f"Top 5 {cols[1]} by {cols[0]}")
    if len(cols) >= 3:
        questions.append(f"Calculate correlation between {cols[0]} and {cols[2]}")

    return SuggestQuestionsResponse(suggested_questions=questions[:5])
