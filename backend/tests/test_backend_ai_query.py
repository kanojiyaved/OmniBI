import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from backend.api.routes.ai_analyst import (
    api_ai_query,
    api_suggest_questions,
    AiQueryRequest,
    SuggestQuestionsRequest
)

def run_sync(coro):
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value

@pytest.fixture
def sample_sales_records():
    return [
        {"customer": "Acme Corp", "region": "North America", "revenue": 10000.0, "deals": 2},
        {"customer": "Globex", "region": "Europe", "revenue": 25000.0, "deals": 5},
        {"customer": "Soylent", "region": "North America", "revenue": 5000.0, "deals": 1},
        {"customer": "Initech", "region": "APAC", "revenue": 15000.0, "deals": 3},
        {"customer": "Umbrella", "region": "Europe", "revenue": 30000.0, "deals": 6},
    ]

def test_ai_query_summary(sample_sales_records):
    req = AiQueryRequest(
        query="Summarize this dataset",
        records=sample_sales_records,
        dataset_name="Sales Performance"
    )
    res = run_sync(api_ai_query(req))

    assert res.query_type == "SUMMARY"
    assert "5" in res.answer_text
    assert len(res.metrics_highlighted) >= 2
    assert "df.info()" in res.pandas_code
    assert res.table_data is not None
    assert len(res.table_data.rows) == 4

def test_ai_query_aggregation_sum(sample_sales_records):
    req = AiQueryRequest(
        query="What is the total revenue?",
        records=sample_sales_records,
        dataset_name="Sales Performance"
    )
    res = run_sync(api_ai_query(req))

    assert res.query_type == "AGGREGATION"
    assert res.target_metric == "revenue"
    # Total revenue = 10000 + 25000 + 5000 + 15000 + 30000 = 85000
    assert "85,000.00" in res.metrics_highlighted[0].value
    assert "df['revenue'].sum()" in res.pandas_code

def test_ai_query_aggregation_avg(sample_sales_records):
    req = AiQueryRequest(
        query="What is the average revenue?",
        records=sample_sales_records,
        dataset_name="Sales Performance"
    )
    res = run_sync(api_ai_query(req))

    assert res.query_type == "AGGREGATION"
    assert "17,000.00" in res.metrics_highlighted[0].value
    assert "df['revenue'].mean()" in res.pandas_code

def test_ai_query_ranking_top(sample_sales_records):
    req = AiQueryRequest(
        query="Top 3 customers by revenue",
        records=sample_sales_records,
        dataset_name="Sales Performance"
    )
    res = run_sync(api_ai_query(req))

    assert res.query_type == "RANKING"
    assert res.chart_suggestion is not None
    assert res.chart_suggestion.chartType == "bar"
    # Umbrella has highest (30,000)
    assert res.metrics_highlighted[0].value == "Umbrella"
    assert res.table_data is not None
    assert len(res.table_data.rows) == 5 or len(res.table_data.rows) == 3

def test_ai_query_breakdown(sample_sales_records):
    req = AiQueryRequest(
        query="Breakdown of revenue across region",
        records=sample_sales_records,
        dataset_name="Sales Performance"
    )
    res = run_sync(api_ai_query(req))

    assert res.query_type == "BREAKDOWN"
    assert res.group_dimension == "region"
    assert res.chart_suggestion is not None
    assert res.table_data is not None
    # Europe has 25k + 30k = 55k total
    assert "55,000.00" in res.table_data.rows[0][1] or "55,000" in str(res.table_data.rows)

def test_ai_query_correlation(sample_sales_records):
    req = AiQueryRequest(
        query="What is the correlation between revenue and deals?",
        records=sample_sales_records,
        dataset_name="Sales Performance"
    )
    res = run_sync(api_ai_query(req))

    assert res.query_type == "CORRELATION"
    assert res.chart_suggestion is not None
    assert res.chart_suggestion.chartType == "scatter"
    assert "corr()" in res.pandas_code

def test_ai_query_unsupported_column_graceful_fallback(sample_sales_records):
    req = AiQueryRequest(
        query="What is the churn rate for each region?",
        records=sample_sales_records,
        dataset_name="Sales Performance"
    )
    res = run_sync(api_ai_query(req))

    assert res.query_type == "UNKNOWN"
    assert "does not contain fields for 'churn'" in res.answer_text
    assert "customer, region, revenue, deals" in res.answer_text

def test_ai_query_executive_summary(sample_sales_records):
    req = AiQueryRequest(
        query="Generate an executive summary",
        records=sample_sales_records,
        dataset_name="Sales Performance"
    )
    res = run_sync(api_ai_query(req))

    assert res.query_type == "EXECUTIVE_SUMMARY"
    assert "Executive Briefing" in res.answer_text
    assert "85,000.00" in str(res.metrics_highlighted)

def test_ai_query_business_risks(sample_sales_records):
    req = AiQueryRequest(
        query="What are the biggest business risks?",
        records=sample_sales_records,
        dataset_name="Sales Performance"
    )
    res = run_sync(api_ai_query(req))

    assert res.query_type == "BUSINESS_RISKS"
    assert "Risk" in res.answer_text
    assert res.table_data is not None

def test_ai_query_anomaly_patterns(sample_sales_records):
    req = AiQueryRequest(
        query="Find unusual patterns",
        records=sample_sales_records,
        dataset_name="Sales Performance"
    )
    res = run_sync(api_ai_query(req))

    assert res.query_type == "ANOMALY_PATTERNS"
    assert "Anomaly" in res.answer_text

def test_ai_query_campaign_roi_unsupported(sample_sales_records):
    req = AiQueryRequest(
        query="Which campaign has the highest ROI?",
        records=sample_sales_records,
        dataset_name="Sales Performance"
    )
    res = run_sync(api_ai_query(req))

    assert res.query_type == "UNKNOWN"
    assert "does not contain campaign or advertising spend fields" in res.answer_text

def test_suggest_questions():
    req = SuggestQuestionsRequest(
        columns=["Product", "Region", "Sales", "Units"],
        domain="sales",
        dataset_name="Global Sales"
    )
    res = run_sync(api_suggest_questions(req))

    assert len(res.suggested_questions) >= 3
    assert any("Product" in q for q in res.suggested_questions)
