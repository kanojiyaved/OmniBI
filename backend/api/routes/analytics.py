from fastapi import APIRouter
from pydantic import BaseModel
import pandas as pd
from typing import List, Dict, Any, Optional
from backend.core.kpi_calculator import calculate_kpis, calculate_kpi_registry
from backend.core.chart_recommender import recommend_charts

router = APIRouter()

class KPIRequest(BaseModel):
    records: List[Dict[str, Any]]
    primary_col: Optional[str] = None
    secondary_col: Optional[str] = None
    date_col: Optional[str] = None

class ChartRecommendRequest(BaseModel):
    columns: List[str]
    profiles: Optional[Dict[str, Any]] = None

class ChartAggregateRequest(BaseModel):
    records: List[Dict[str, Any]]
    x_axis_column: str
    y_axis_column: str
    aggregation: Optional[str] = "sum"

@router.get("/status")
async def analytics_status():
    """Status endpoint for the backend statistical aggregation engine."""
    return {
        "engine": "Pandas/NumPy Aggregation Pipeline",
        "status": "initialized",
        "supported_aggregations": ["sum", "avg", "count", "unique_count", "min", "max", "growth_mom"]
    }

@router.post("/kpis")
async def api_calculate_kpis(payload: KPIRequest):
    """Calculates executive dynamic KPIs using Pandas vectorized operations."""
    kpis = calculate_kpis(
        records=payload.records,
        primary_col=payload.primary_col,
        secondary_col=payload.secondary_col,
        date_col=payload.date_col
    )
    return {"kpis": kpis}

@router.post("/kpis/registry")
async def api_calculate_kpi_registry(payload: KPIRequest):
    """Calculates complete dynamic KPI registry with availability and provenance."""
    registry = calculate_kpi_registry(
        records=payload.records,
        domain="general"
    )
    return registry

@router.post("/charts/recommend")
async def api_recommend_charts(payload: ChartRecommendRequest):
    """Recommends chart specifications based on column list and profiles."""
    charts = recommend_charts(payload.columns, payload.profiles)
    return {"charts": charts}

@router.post("/charts/aggregate")
async def api_aggregate_chart_data(payload: ChartAggregateRequest):
    """Aggregates data for chart rendering using Pandas groupby."""
    if not payload.records:
        return {"data": []}

    df = pd.DataFrame(payload.records)
    if payload.x_axis_column not in df.columns or payload.y_axis_column not in df.columns:
        return {"data": []}

    df[payload.y_axis_column] = pd.to_numeric(
        df[payload.y_axis_column].astype(str).str.replace(r"[$€£¥,%\s]", "", regex=True),
        errors='coerce'
    ).fillna(0)

    if payload.aggregation == "avg":
        grouped = df.groupby(payload.x_axis_column)[payload.y_axis_column].mean().reset_index()
    else:
        grouped = df.groupby(payload.x_axis_column)[payload.y_axis_column].sum().reset_index()

    result = grouped.rename(columns={payload.y_axis_column: "value"}).to_dict(orient="records")
    return {"data": result}

class PipelineAnalyticsRequest(BaseModel):
    records: List[Dict[str, Any]]
    stage_col: Optional[str] = "stage"
    amount_col: Optional[str] = "amount"

@router.post("/pipeline")
async def api_pipeline_analytics(payload: PipelineAnalyticsRequest):
    """Calculates sales pipeline stage distribution, win rate, and deal velocity."""
    if not payload.records:
        return {"total_pipeline": 0, "won_value": 0, "win_rate": 0, "stages": []}

    df = pd.DataFrame(payload.records)
    stage_col = payload.stage_col if payload.stage_col in df.columns else df.columns[0]
    amount_col = payload.amount_col if payload.amount_col in df.columns else None

    if amount_col:
        df["_amount"] = pd.to_numeric(
            df[amount_col].astype(str).str.replace(r"[$€£¥,%\s]", "", regex=True),
            errors='coerce'
        ).fillna(0)
    else:
        df["_amount"] = 1000

    total_pipeline = float(df["_amount"].sum())
    won_mask = df[stage_col].astype(str).str.contains(r"won|closed|completed|success", case=False, na=False)
    won_value = float(df.loc[won_mask, "_amount"].sum())
    won_count = int(won_mask.sum())
    win_rate = round((won_count / len(df)) * 100, 1) if len(df) > 0 else 0.0

    grouped = df.groupby(stage_col).agg(
        deal_count=("_amount", "count"),
        total_amount=("_amount", "sum")
    ).reset_index()

    stages = [
        {
            "stage": str(row[stage_col]),
            "deal_count": int(row["deal_count"]),
            "total_amount": float(round(row["total_amount"], 2))
        }
        for _, row in grouped.iterrows()
    ]

    return {
        "total_pipeline": round(total_pipeline, 2),
        "won_value": round(won_value, 2),
        "won_count": won_count,
        "total_deals": len(df),
        "win_rate": win_rate,
        "stages": stages
    }

class CampaignAnalyticsRequest(BaseModel):
    records: List[Dict[str, Any]]
    channel_col: Optional[str] = "channel"
    spend_col: Optional[str] = "spend"
    clicks_col: Optional[str] = "clicks"
    impressions_col: Optional[str] = "impressions"
    conversions_col: Optional[str] = "conversions"

@router.post("/campaigns")
async def api_campaign_analytics(payload: CampaignAnalyticsRequest):
    """Calculates marketing campaign performance metrics by channel."""
    if not payload.records:
        return {"total_spend": 0, "total_clicks": 0, "overall_ctr": 0, "channels": []}

    df = pd.DataFrame(payload.records)
    channel_col = payload.channel_col if payload.channel_col in df.columns else df.columns[0]

    for col, name in [
        (payload.spend_col, "_spend"),
        (payload.clicks_col, "_clicks"),
        (payload.impressions_col, "_impressions"),
        (payload.conversions_col, "_conversions")
    ]:
        if col and col in df.columns:
            df[name] = pd.to_numeric(
                df[col].astype(str).str.replace(r"[$€£¥,%\s]", "", regex=True),
                errors='coerce'
            ).fillna(0)
        else:
            df[name] = 0

    total_spend = float(df["_spend"].sum())
    total_clicks = float(df["_clicks"].sum())
    total_impressions = float(df["_impressions"].sum())
    total_conversions = float(df["_conversions"].sum())

    overall_ctr = round((total_clicks / total_impressions) * 100, 2) if total_impressions > 0 else 0.0
    overall_cvr = round((total_conversions / total_clicks) * 100, 2) if total_clicks > 0 else 0.0
    overall_roas = round((total_conversions * 50 / total_spend), 2) if total_spend > 0 else 0.0

    grouped = df.groupby(channel_col).agg(
        spend=("_spend", "sum"),
        clicks=("_clicks", "sum"),
        conversions=("_conversions", "sum")
    ).reset_index()

    channels = [
        {
            "channel": str(row[channel_col]),
            "spend": float(round(row["spend"], 2)),
            "clicks": int(row["clicks"]),
            "conversions": int(row["conversions"])
        }
        for _, row in grouped.iterrows()
    ]

    return {
        "total_spend": round(total_spend, 2),
        "total_clicks": int(total_clicks),
        "total_impressions": int(total_impressions),
        "total_conversions": int(total_conversions),
        "overall_ctr": overall_ctr,
        "overall_cvr": overall_cvr,
        "overall_roas": overall_roas,
        "channels": channels
    }

class ReportSummaryRequest(BaseModel):
    records: List[Dict[str, Any]]
    category_col: str
    metric_col: str

@router.post("/reports/summary")
async def api_report_summary(payload: ReportSummaryRequest):
    """Calculates categorical breakdown statement with totals, means, and shares."""
    if not payload.records:
        return {"total": 0, "categories": []}

    df = pd.DataFrame(payload.records)
    if payload.category_col not in df.columns or payload.metric_col not in df.columns:
        return {"total": 0, "categories": []}

    df["_val"] = pd.to_numeric(
        df[payload.metric_col].astype(str).str.replace(r"[$€£¥,%\s]", "", regex=True),
        errors='coerce'
    ).fillna(0)

    grand_total = float(df["_val"].sum())

    grouped = df.groupby(payload.category_col).agg(
        count=("_val", "count"),
        total=("_val", "sum"),
        mean=("_val", "mean")
    ).reset_index().sort_values("total", ascending=False)

    categories = [
        {
            "category": str(row[payload.category_col]),
            "count": int(row["count"]),
            "total": float(round(row["total"], 2)),
            "mean": float(round(row["mean"], 2)),
            "share_pct": round((row["total"] / grand_total) * 100, 1) if grand_total > 0 else 0.0
        }
        for _, row in grouped.iterrows()
    ]

    return {
        "grand_total": round(grand_total, 2),
        "total_records": len(df),
        "categories": categories
    }

class FilterCriteria(BaseModel):
    search_query: Optional[str] = None
    date_col: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    categorical_filters: Optional[Dict[str, List[str]]] = None
    numeric_ranges: Optional[Dict[str, Dict[str, Optional[float]]]] = None
    cross_filter_col: Optional[str] = None
    cross_filter_val: Optional[Any] = None

class FilterRecordsRequest(BaseModel):
    records: List[Dict[str, Any]]
    filters: FilterCriteria

@router.post("/filter")
async def api_filter_records(payload: FilterRecordsRequest):
    """Filters dataset records deterministically based on active global filter criteria using Pandas."""
    if not payload.records:
        return {"total_records": 0, "filtered_records": 0, "records": []}

    df = pd.DataFrame(payload.records)
    total_count = len(df)
    f = payload.filters

    # 1. Search Query (matches across all columns)
    if f.search_query and f.search_query.strip():
        q = f.search_query.strip().lower()
        search_mask = df.astype(str).apply(
            lambda col_series: col_series.str.lower().str.contains(q, regex=False, na=False)
        ).any(axis=1)
        df = df[search_mask]

    # 2. Date Range
    if f.date_col and f.date_col in df.columns and (f.start_date or f.end_date):
        dt_series = pd.to_datetime(df[f.date_col].astype(str), errors='coerce')
        if f.start_date:
            start_dt = pd.to_datetime(f.start_date)
            df = df[dt_series >= start_dt]
            dt_series = pd.to_datetime(df[f.date_col].astype(str), errors='coerce')
        if f.end_date:
            end_dt = pd.to_datetime(f.end_date)
            if "T" not in f.end_date:
                end_dt = end_dt + pd.Timedelta(days=1) - pd.Timedelta(nanoseconds=1)
            df = df[dt_series <= end_dt]

    # 3. Categorical Filters
    if f.categorical_filters:
        for col, selected_vals in f.categorical_filters.items():
            if col in df.columns and selected_vals:
                df = df[df[col].astype(str).isin([str(v) for v in selected_vals])]

    # 4. Numeric Ranges
    if f.numeric_ranges:
        for col, r in f.numeric_ranges.items():
            if col in df.columns and r:
                clean_num = pd.to_numeric(
                    df[col].astype(str).str.replace(r"[$€£¥,%\s]", "", regex=True),
                    errors='coerce'
                )
                min_val = r.get("min")
                max_val = r.get("max")
                if min_val is not None:
                    df = df[clean_num >= min_val]
                    clean_num = pd.to_numeric(
                        df[col].astype(str).str.replace(r"[$€£¥,%\s]", "", regex=True),
                        errors='coerce'
                    )
                if max_val is not None:
                    df = df[clean_num <= max_val]

    # 5. Cross-Filter
    if f.cross_filter_col and f.cross_filter_col in df.columns and f.cross_filter_val is not None:
        df = df[df[f.cross_filter_col].astype(str) == str(f.cross_filter_val)]

    filtered_data = df.to_dict(orient="records")
    return {
        "total_records": total_count,
        "filtered_records": len(filtered_data),
        "records": filtered_data
    }

