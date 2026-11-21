import pytest
from backend.core.chart_recommender import recommend_charts

def test_recommend_charts_unit():
    cols = ["order_id", "order_date", "revenue", "product_category"]
    charts = recommend_charts(cols)
    assert len(charts) >= 2
    types = [c["chart_type"] for c in charts]
    assert "area" in types
    assert "bar" in types
