import pytest
from backend.core.kpi_calculator import (
    calculate_kpis, 
    calculate_kpi_registry,
    compute_safe_ratio
)

def test_calculate_kpis_unit():
    data = [
        {"revenue": 100, "date": "2025-01-01"},
        {"revenue": 200, "date": "2025-01-02"},
        {"revenue": 300, "date": "2025-01-03"},
        {"revenue": 400, "date": "2025-01-04"},
    ]
    kpis = calculate_kpis(data, primary_col="revenue")
    assert len(kpis) >= 3
    
    # Check sum
    sum_kpi = next(k for k in kpis if k["aggregation"] == "sum")
    assert sum_kpi["value"] == 1000.0
    assert len(sum_kpi["sparkline_data"]) == 7

    # Check avg
    avg_kpi = next(k for k in kpis if k["aggregation"] == "avg")
    assert avg_kpi["value"] == 250.0

    # Check count
    count_kpi = next(k for k in kpis if k["aggregation"] == "count")
    assert count_kpi["value"] == 4

def test_division_by_zero_prevention():
    # Numerator with zero denominator must safely yield 0.0, never crash, Infinity or NaN
    assert compute_safe_ratio(100.0, 0.0) == 0.0
    assert compute_safe_ratio(0.0, 0.0) == 0.0
    assert compute_safe_ratio(None, 10.0) == 0.0
    assert compute_safe_ratio(50.0, None) == 0.0
    assert compute_safe_ratio(25.0, 100.0, 100.0) == 25.0

def test_sales_kpi_registry_calculations():
    sales_data = [
        {"order_id": "O1", "customer": "Acme", "revenue": 1000, "profit": 300, "date": "2025-01-01"},
        {"order_id": "O2", "customer": "Globex", "revenue": 2000, "profit": 500, "date": "2025-01-02"},
        {"order_id": "O3", "customer": "Acme", "revenue": 3000, "profit": 1200, "date": "2025-01-03"},
    ]
    res = calculate_kpi_registry(sales_data, domain="sales")
    assert res["total_count"] > 0
    metrics_by_id = {m["metric_id"]: m for m in res["metrics"]}

    # 1. Revenue
    assert metrics_by_id["sales_revenue"]["calculated_value"] == 6000.0
    assert metrics_by_id["sales_revenue"]["availability_status"] == "available"

    # 2. Orders
    assert metrics_by_id["sales_orders"]["calculated_value"] == 3

    # 3. Average Order Value
    assert metrics_by_id["sales_aov"]["calculated_value"] == 2000.0

    # 4. Profit
    assert metrics_by_id["sales_profit"]["calculated_value"] == 2000.0

    # 5. Profit Margin (2000 / 6000 * 100 = 33.33%)
    assert metrics_by_id["sales_profit_margin"]["calculated_value"] == 33.33

    # 6. Customer Count (Acme, Globex = 2)
    assert metrics_by_id["sales_customer_count"]["calculated_value"] == 2

    # 7. Unavailable metric (e.g. CTR missing impressions/clicks)
    assert metrics_by_id["mktg_ctr"]["availability_status"] == "unavailable"
    assert metrics_by_id["mktg_ctr"]["calculated_value"] is None

def test_marketing_and_hr_kpi_registry():
    mktg_data = [
        {"campaign": "C1", "impressions": 10000, "clicks": 500, "spend": 250},
        {"campaign": "C2", "impressions": 20000, "clicks": 1500, "spend": 750},
    ]
    res = calculate_kpi_registry(mktg_data, domain="marketing")
    metrics_by_id = {m["metric_id"]: m for m in res["metrics"]}

    # CTR = (2000 / 30000) * 100 = 6.67%
    assert metrics_by_id["mktg_ctr"]["calculated_value"] == 6.67
    assert metrics_by_id["mktg_ctr"]["availability_status"] == "available"
