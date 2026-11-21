import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from backend.api.routes.analytics import (
    api_pipeline_analytics,
    api_campaign_analytics,
    api_report_summary,
    PipelineAnalyticsRequest,
    CampaignAnalyticsRequest,
    ReportSummaryRequest
)

def run_sync(coro):
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value

def test_pipeline_analytics():
    records = [
        {"deal": "Acme Corp", "stage": "Proposal", "amount": 10000},
        {"deal": "Globex", "stage": "Closed Won", "amount": 25000},
        {"deal": "Soylent", "stage": "Qualified", "amount": 5000},
        {"deal": "Initech", "stage": "Closed Won", "amount": 15000},
    ]
    req = PipelineAnalyticsRequest(records=records, stage_col="stage", amount_col="amount")
    res = run_sync(api_pipeline_analytics(req))

    assert res["total_pipeline"] == 55000.0
    assert res["won_value"] == 40000.0
    assert res["won_count"] == 2
    assert res["win_rate"] == 50.0
    assert len(res["stages"]) == 3

def test_campaign_analytics():
    records = [
        {"channel": "Google Ads", "spend": 1000, "impressions": 20000, "clicks": 800, "conversions": 80},
        {"channel": "Meta Ads", "spend": 500, "impressions": 10000, "clicks": 200, "conversions": 10},
    ]
    req = CampaignAnalyticsRequest(
        records=records,
        channel_col="channel",
        spend_col="spend",
        impressions_col="impressions",
        clicks_col="clicks",
        conversions_col="conversions"
    )
    res = run_sync(api_campaign_analytics(req))

    assert res["total_spend"] == 1500.0
    assert res["total_clicks"] == 1000
    assert res["total_impressions"] == 30000
    assert res["total_conversions"] == 90
    assert res["overall_ctr"] == 3.33
    assert res["overall_cvr"] == 9.0
    assert len(res["channels"]) == 2

def test_report_summary_analytics():
    records = [
        {"department": "Engineering", "expense": 50000},
        {"department": "Engineering", "expense": 30000},
        {"department": "Marketing", "expense": 20000},
    ]
    req = ReportSummaryRequest(records=records, category_col="department", metric_col="expense")
    res = run_sync(api_report_summary(req))

    assert res["grand_total"] == 100000.0
    assert res["total_records"] == 3
    assert len(res["categories"]) == 2
    assert res["categories"][0]["category"] == "Engineering"
    assert res["categories"][0]["total"] == 80000.0
    assert res["categories"][0]["share_pct"] == 80.0
