"""
OmniBI Backend - Intelligent Chart Recommendation and Aggregation Engine.
"""
import re
from typing import List, Dict, Any, Optional

def recommend_charts(columns: List[str], profiles: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Recommends executive charts based on column data types and semantics."""
    if not columns:
        return []

    date_col = next((c for c in columns if re.search(r"date|time|created|updated|period|day|month|year", c, re.I)), None)
    
    primary_metric = next(
        (c for c in columns if re.search(r"revenue|sales|profit|margin|amount|total|gmv|mrr|arr|ebitda", c, re.I)), 
        None
    )
    
    category_col = next(
        (c for c in columns if re.search(r"category|segment|type|tier|channel|department|country|region|status", c, re.I)),
        None
    )

    # Fallbacks
    if not primary_metric and len(columns) > 1:
        primary_metric = columns[1]
    if not category_col and len(columns) > 0:
        category_col = columns[0]

    charts = []

    # 1. Temporal Area Chart
    if date_col and primary_metric:
        charts.append({
            "id": f"chart-trend-{date_col}",
            "title": f"{primary_metric.replace('_', ' ').title()} Over Time",
            "chart_type": "area",
            "x_axis_column": date_col,
            "y_axis_columns": [primary_metric],
            "aggregation": "sum",
            "importance": "primary"
        })

    # 2. Categorical Distribution
    if category_col and primary_metric:
        charts.append({
            "id": f"chart-cat-{category_col}",
            "title": f"{primary_metric.replace('_', ' ').title()} by {category_col.replace('_', ' ').title()}",
            "chart_type": "bar",
            "x_axis_column": category_col,
            "y_axis_columns": [primary_metric],
            "aggregation": "sum",
            "importance": "secondary"
        })

    return charts
