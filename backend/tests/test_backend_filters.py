import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from backend.api.routes.analytics import (
    api_filter_records,
    FilterRecordsRequest,
    FilterCriteria
)

def run_sync(coro):
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value

MOCK_RECORDS = [
    {"id": 1, "date": "2026-01-15", "region": "North America", "category": "Software", "amount": 1500, "stage": "Closed Won"},
    {"id": 2, "date": "2026-02-20", "region": "Europe", "category": "Hardware", "amount": 800, "stage": "Proposal"},
    {"id": 3, "date": "2026-03-10", "region": "Asia", "category": "Software", "amount": 2500, "stage": "Negotiation"},
    {"id": 4, "date": "2026-04-05", "region": "Europe", "category": "Services", "amount": 350, "stage": "Qualified"},
    {"id": 5, "date": "2026-05-18", "region": "North America", "category": "Hardware", "amount": 4200, "stage": "Closed Won"},
]

def test_filter_search_query():
    req = FilterRecordsRequest(
        records=MOCK_RECORDS,
        filters=FilterCriteria(search_query="hardware")
    )
    res = run_sync(api_filter_records(req))
    assert res["total_records"] == 5
    assert res["filtered_records"] == 2
    assert all("Hardware" in r["category"] for r in res["records"])

def test_filter_date_range():
    req = FilterRecordsRequest(
        records=MOCK_RECORDS,
        filters=FilterCriteria(
            date_col="date",
            start_date="2026-02-01",
            end_date="2026-04-01"
        )
    )
    res = run_sync(api_filter_records(req))
    assert res["filtered_records"] == 2  # Feb 20 and Mar 10

def test_filter_categorical():
    req = FilterRecordsRequest(
        records=MOCK_RECORDS,
        filters=FilterCriteria(
            categorical_filters={"region": ["Europe", "Asia"]}
        )
    )
    res = run_sync(api_filter_records(req))
    assert res["filtered_records"] == 3
    regions = [r["region"] for r in res["records"]]
    assert "North America" not in regions

def test_filter_numeric_range():
    req = FilterRecordsRequest(
        records=MOCK_RECORDS,
        filters=FilterCriteria(
            numeric_ranges={"amount": {"min": 1000, "max": 3000}}
        )
    )
    res = run_sync(api_filter_records(req))
    assert res["filtered_records"] == 2  # 1500 and 2500
    amounts = [r["amount"] for r in res["records"]]
    assert 1500 in amounts
    assert 2500 in amounts

def test_filter_cross_filter():
    req = FilterRecordsRequest(
        records=MOCK_RECORDS,
        filters=FilterCriteria(
            cross_filter_col="stage",
            cross_filter_val="Closed Won"
        )
    )
    res = run_sync(api_filter_records(req))
    assert res["filtered_records"] == 2
    assert all(r["stage"] == "Closed Won" for r in res["records"])

def test_filter_combined_multi_dimensional():
    req = FilterRecordsRequest(
        records=MOCK_RECORDS,
        filters=FilterCriteria(
            categorical_filters={"region": ["North America"]},
            numeric_ranges={"amount": {"min": 2000}},
            cross_filter_col="stage",
            cross_filter_val="Closed Won"
        )
    )
    res = run_sync(api_filter_records(req))
    assert res["filtered_records"] == 1
    assert res["records"][0]["amount"] == 4200

def test_filter_empty_records():
    req = FilterRecordsRequest(
        records=[],
        filters=FilterCriteria(search_query="test")
    )
    res = run_sync(api_filter_records(req))
    assert res["total_records"] == 0
    assert res["filtered_records"] == 0
    assert res["records"] == []
