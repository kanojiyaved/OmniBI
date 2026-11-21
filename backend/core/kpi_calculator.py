"""
OmniBI Backend - Dynamic KPI & Metric Engine with Pandas & NumPy.
Computes domain-aware KPI registries with zero-division guards and provenance tracking.
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

def compute_safe_ratio(numerator: Optional[float], denominator: Optional[float], multiplier: float = 1.0) -> float:
    """Computes ratio or percentage with division-by-zero protection."""
    if numerator is None or denominator is None or pd.isna(numerator) or pd.isna(denominator):
        return 0.0
    if denominator == 0:
        return 0.0
    return round(float((numerator / denominator) * multiplier), 2)

def calculate_kpis(
    records: List[Dict[str, Any]], 
    primary_col: Optional[str] = None,
    secondary_col: Optional[str] = None,
    date_col: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Calculates executive KPI metrics and sparklines from tabular records."""
    if not records:
        return []

    df = pd.DataFrame(records)
    kpis = []

    # If primary column is not specified, auto-detect first numeric column
    if not primary_col or primary_col not in df.columns:
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if numeric_cols:
            primary_col = numeric_cols[0]

    if primary_col and primary_col in df.columns:
        # Clean numeric series
        series = pd.to_numeric(
            df[primary_col].astype(str).str.replace(r"[$€£¥,%\s]", "", regex=True),
            errors='coerce'
        ).dropna()

        if len(series) > 0:
            total_sum = round(float(series.sum()), 2)
            avg_val = round(float(series.mean()), 2)

            # Period-over-period growth
            growth_pct = 0.0
            trend = "neutral"
            if len(series) >= 2:
                mid = len(series) // 2
                prev_sum = float(series.iloc[:mid].sum())
                curr_sum = float(series.iloc[mid:].sum())
                if prev_sum > 0:
                    growth_pct = round(((curr_sum - prev_sum) / prev_sum) * 100, 1)
                    trend = "up" if growth_pct > 0 else "down"

            # Sparkline points (7 buckets)
            chunk_size = max(1, len(series) // 7)
            sparkline = [
                round(float(series.iloc[i * chunk_size : (i + 1) * chunk_size].sum()), 2)
                for i in range(7)
            ]

            kpis.append({
                "id": f"kpi-sum-{primary_col}",
                "label": f"Total {primary_col.replace('_', ' ').title()}",
                "aggregation": "sum",
                "format": "currency" if any(k in primary_col.lower() for k in ["revenue", "sales", "price", "amount"]) else "number",
                "value": total_sum,
                "change_percentage": growth_pct,
                "trend": trend,
                "sparkline_data": sparkline
            })

            kpis.append({
                "id": f"kpi-avg-{primary_col}",
                "label": f"Average {primary_col.replace('_', ' ').title()}",
                "aggregation": "avg",
                "format": "currency" if any(k in primary_col.lower() for k in ["revenue", "sales", "price", "amount"]) else "number",
                "value": avg_val,
                "trend": "neutral"
            })

    # Total row count
    kpis.append({
        "id": "kpi-record-count",
        "label": "Total Record Count",
        "aggregation": "count",
        "format": "compact",
        "value": len(df),
        "trend": "neutral"
    })

    return kpis

def calculate_kpi_registry(
    records: List[Dict[str, Any]], 
    domain: str = "general"
) -> Dict[str, Any]:
    """Generates complete Dynamic KPI Registry supporting Sales, Marketing, Finance, and HR metrics."""
    if not records:
        return {"total_count": 0, "available_count": 0, "metrics": []}

    df = pd.DataFrame(records)
    cols = {c.lower().strip(): c for c in df.columns}
    metrics = []

    def find_col(*patterns):
        for pat in patterns:
            for c_low, orig in cols.items():
                if pat in c_low:
                    return orig
        return None

    # Helper to clean numeric
    def clean_num(col_name):
        return pd.to_numeric(
            df[col_name].astype(str).str.replace(r"[$€£¥,%\s]", "", regex=True),
            errors='coerce'
        ).dropna()

    rev_col = find_col("revenue", "net_sales", "sales", "income", "deal_value", "amount")
    profit_col = find_col("profit", "net_profit", "net_income", "ebitda")
    cust_col = find_col("customer", "client", "buyer", "user_id")
    order_col = find_col("order_id", "order_no", "txn_id")
    impressions_col = find_col("impressions", "views")
    clicks_col = find_col("clicks")
    conv_col = find_col("conversions", "leads")
    spend_col = find_col("ad_spend", "marketing_spend", "spend")
    salary_col = find_col("salary", "pay", "compensation")
    dept_col = find_col("department", "dept", "team")
    turnover_col = find_col("turnover", "attrition")
    date_col = find_col("date", "dt", "timestamp", "period")

    # 1. SALES METRICS
    if rev_col:
        s = clean_num(rev_col)
        rev_sum = round(float(s.sum()), 2)
        metrics.append({
            "metric_id": "sales_revenue",
            "metric_name": "Revenue",
            "formula": "SUM(revenue)",
            "required_columns": [rev_col],
            "aggregation_method": "SUM",
            "calculated_value": rev_sum,
            "data_provenance": f"Sum of '{rev_col}' across {len(df)} records",
            "confidence": 0.95,
            "availability_status": "available"
        })

        # Average Order Value
        cnt = len(df)
        aov = compute_safe_ratio(rev_sum, cnt)
        metrics.append({
            "metric_id": "sales_aov",
            "metric_name": "Average Order Value",
            "formula": "SUM(revenue) / COUNT(orders)",
            "required_columns": [rev_col],
            "aggregation_method": "RATIO",
            "calculated_value": aov,
            "data_provenance": f"Revenue ({rev_sum}) / Order Count ({cnt})",
            "confidence": 0.92,
            "availability_status": "available"
        })

        # Revenue Growth
        if len(s) >= 2:
            mid = len(s) // 2
            prev_sum = float(s.iloc[:mid].sum())
            curr_sum = float(s.iloc[mid:].sum())
            growth = compute_safe_ratio(curr_sum - prev_sum, prev_sum, 100.0) if prev_sum > 0 else 0.0
            metrics.append({
                "metric_id": "sales_growth",
                "metric_name": "Revenue Growth",
                "formula": "((Current - Previous) / Previous) * 100",
                "required_columns": [rev_col],
                "aggregation_method": "GROWTH",
                "calculated_value": growth,
                "data_provenance": f"Period-over-period growth of '{rev_col}'",
                "confidence": 0.90,
                "availability_status": "available"
            })
    else:
        metrics.append({
            "metric_id": "sales_revenue",
            "metric_name": "Revenue",
            "formula": "SUM(revenue)",
            "required_columns": ["revenue"],
            "aggregation_method": "SUM",
            "calculated_value": None,
            "data_provenance": "Missing revenue column",
            "confidence": 0.0,
            "availability_status": "unavailable"
        })

    # Orders
    metrics.append({
        "metric_id": "sales_orders",
        "metric_name": "Orders",
        "formula": "COUNT(records)",
        "required_columns": [order_col] if order_col else [],
        "aggregation_method": "COUNT",
        "calculated_value": len(df),
        "data_provenance": f"Total transaction count ({len(df)} rows)",
        "confidence": 0.95,
        "availability_status": "available"
    })

    # Profit & Profit Margin
    if profit_col:
        p_s = clean_num(profit_col)
        p_sum = round(float(p_s.sum()), 2)
        metrics.append({
            "metric_id": "sales_profit",
            "metric_name": "Profit",
            "formula": "SUM(profit)",
            "required_columns": [profit_col],
            "aggregation_method": "SUM",
            "calculated_value": p_sum,
            "data_provenance": f"Sum of profit column '{profit_col}'",
            "confidence": 0.94,
            "availability_status": "available"
        })
        if rev_col:
            margin = compute_safe_ratio(p_sum, rev_sum, 100.0)
            metrics.append({
                "metric_id": "sales_profit_margin",
                "metric_name": "Profit Margin",
                "formula": "(Profit / Revenue) * 100",
                "required_columns": [profit_col, rev_col],
                "aggregation_method": "PERCENTAGE",
                "calculated_value": margin,
                "data_provenance": f"Profit ({p_sum}) / Revenue ({rev_sum}) * 100",
                "confidence": 0.92,
                "availability_status": "available"
            })
    else:
        metrics.append({
            "metric_id": "sales_profit",
            "metric_name": "Profit",
            "formula": "SUM(profit)",
            "required_columns": ["profit"],
            "aggregation_method": "SUM",
            "calculated_value": None,
            "data_provenance": "Missing profit column",
            "confidence": 0.0,
            "availability_status": "unavailable"
        })

    # Customer Count
    if cust_col:
        c_count = int(df[cust_col].nunique())
        metrics.append({
            "metric_id": "sales_customer_count",
            "metric_name": "Customer Count",
            "formula": "DISTINCT_COUNT(customer)",
            "required_columns": [cust_col],
            "aggregation_method": "DISTINCT_COUNT",
            "calculated_value": c_count,
            "data_provenance": f"Unique count of distinct '{cust_col}'",
            "confidence": 0.93,
            "availability_status": "available"
        })

    # 2. MARKETING METRICS (CTR, ROAS, Conversions)
    if impressions_col and clicks_col:
        i_s = clean_num(impressions_col).sum()
        c_s = clean_num(clicks_col).sum()
        ctr = compute_safe_ratio(c_s, i_s, 100.0)
        metrics.append({
            "metric_id": "mktg_ctr",
            "metric_name": "CTR",
            "formula": "(Clicks / Impressions) * 100",
            "required_columns": [clicks_col, impressions_col],
            "aggregation_method": "PERCENTAGE",
            "calculated_value": ctr,
            "data_provenance": f"Clicks ({c_s}) / Impressions ({i_s}) * 100",
            "confidence": 0.95,
            "availability_status": "available"
        })
    else:
        metrics.append({
            "metric_id": "mktg_ctr",
            "metric_name": "CTR",
            "formula": "(Clicks / Impressions) * 100",
            "required_columns": ["clicks", "impressions"],
            "aggregation_method": "PERCENTAGE",
            "calculated_value": None,
            "data_provenance": "Missing clicks or impressions",
            "confidence": 0.0,
            "availability_status": "unavailable"
        })

    # 3. HR METRICS (Employees, Average Salary, Turnover)
    if salary_col:
        sal_s = clean_num(salary_col)
        metrics.append({
            "metric_id": "hr_avg_salary",
            "metric_name": "Average Salary",
            "formula": "AVERAGE(salary)",
            "required_columns": [salary_col],
            "aggregation_method": "AVERAGE",
            "calculated_value": round(float(sal_s.mean()), 2),
            "data_provenance": f"Arithmetic mean of '{salary_col}'",
            "confidence": 0.95,
            "availability_status": "available"
        })

    # 4. Statistical Median
    if rev_col:
        s = clean_num(rev_col)
        metrics.append({
            "metric_id": "gen_median",
            "metric_name": "Median Revenue",
            "formula": "MEDIAN(revenue)",
            "required_columns": [rev_col],
            "aggregation_method": "MEDIAN",
            "calculated_value": round(float(s.median()), 2),
            "data_provenance": f"50th percentile of '{rev_col}'",
            "confidence": 0.90,
            "availability_status": "available"
        })

    avail = [m for m in metrics if m["availability_status"] == "available"]
    return {
        "total_count": len(metrics),
        "available_count": len(avail),
        "metrics": metrics
    }
