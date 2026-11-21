"""
Stage 11: End-to-End Application Audit & Multi-Dataset Verification Suite
========================================================================
Comprehensive audit of all 10 target business dataset schemas and core platform subsystems:
1. Sales dataset
2. Marketing dataset
3. Financial dataset
4. Customer dataset
5. HR dataset
6. Inventory dataset
7. Unfamiliar column names dataset
8. Missing values dataset
9. Duplicate records dataset
10. Multi-sheet Excel workbook

Verifies backend profiling, semantic mapping, domain detection, dynamic KPIs,
specialized BI modules, AI Data Analyst, vectorized filtering, and multi-format exports.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import io
import time
import pytest
import pandas as pd
import openpyxl

from backend.core.profiler import infer_column_type, profile_dataframe
from backend.core.cleaner import clean_dataframe
from backend.core.semantic_mapper import (
    detect_business_domain,
    map_column_roles,
    generate_understanding_report,
)
from backend.core.kpi_calculator import (
    calculate_kpis,
    calculate_kpi_registry,
    compute_safe_ratio,
)
from backend.core.exporter import (
    sanitize_formula_injection,
    mask_pii_value,
    export_dataframe_to_csv,
    export_dataframe_to_excel,
)
from backend.api.routes.analytics import (
    api_filter_records,
    api_pipeline_analytics,
    api_campaign_analytics,
    api_report_summary,
    FilterRecordsRequest,
    FilterCriteria,
    PipelineAnalyticsRequest,
    CampaignAnalyticsRequest,
    ReportSummaryRequest,
)
from backend.api.routes.ai_analyst import (
    api_ai_query,
    api_suggest_questions,
    AiQueryRequest,
    SuggestQuestionsRequest,
)
from backend.api.routes.export import (
    api_export_csv,
    api_export_excel,
    api_export_report_summary,
    ExportCSVRequest,
    ExportExcelRequest,
    ExportReportRequest,
)


def run_sync(coro):
    """Synchronous generator driver for async FastAPI route functions in pytest."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value


# ==============================================================================
# AUDIT MATRIX: 10 DISTINCT BUSINESS DATASETS
# ==============================================================================

SALES_RECORDS = [
    {"OrderID": "ORD-101", "OrderDate": "2024-01-05", "Customer": "Acme", "Category": "Electronics", "Revenue": 1500.0, "Profit": 400.0, "Quantity": 3, "Region": "North America"},
    {"OrderID": "ORD-102", "OrderDate": "2024-01-12", "Customer": "Globex", "Category": "Office", "Revenue": 800.0, "Profit": 180.0, "Quantity": 10, "Region": "Europe"},
    {"OrderID": "ORD-103", "OrderDate": "2024-02-01", "Customer": "Initech", "Category": "Electronics", "Revenue": 2400.0, "Profit": 650.0, "Quantity": 5, "Region": "North America"},
    {"OrderID": "ORD-104", "OrderDate": "2024-02-15", "Customer": "Umbrella", "Category": "Furniture", "Revenue": 1200.0, "Profit": 250.0, "Quantity": 2, "Region": "Asia Pacific"},
]

MARKETING_RECORDS = [
    {"CampaignID": "CMP-01", "CampaignName": "Spring Search", "Channel": "Search", "AdSpend": 3000.0, "Impressions": 200000, "Clicks": 10000, "Conversions": 500, "RevenueGenerated": 15000.0},
    {"CampaignID": "CMP-02", "CampaignName": "Social Retargeting", "Channel": "Social", "AdSpend": 2500.0, "Impressions": 150000, "Clicks": 7500, "Conversions": 400, "RevenueGenerated": 12000.0},
    {"CampaignID": "CMP-03", "CampaignName": "Email Newsletter", "Channel": "Email", "AdSpend": 500.0, "Impressions": 80000, "Clicks": 6000, "Conversions": 350, "RevenueGenerated": 9500.0},
]

FINANCIAL_RECORDS = [
    {"Department": "Engineering", "FiscalQuarter": "2024-Q1", "BudgetAllocated": 1200000.0, "ActualSpend": 1140000.0, "RevenueGenerated": 0.0, "BudgetVariance": 60000.0},
    {"Department": "Sales & Marketing", "FiscalQuarter": "2024-Q1", "BudgetAllocated": 850000.0, "ActualSpend": 920000.0, "RevenueGenerated": 2850000.0, "BudgetVariance": -70000.0},
    {"Department": "Customer Success", "FiscalQuarter": "2024-Q1", "BudgetAllocated": 320000.0, "ActualSpend": 310000.0, "RevenueGenerated": 620000.0, "BudgetVariance": 10000.0},
]

CUSTOMER_RECORDS = [
    {"CustomerID": "CUST-01", "CustomerName": "Acme Corp", "Email": "contact@acme.com", "LifetimeValue": 45000.0, "TotalOrders": 22, "NPSScore": 9, "AccountStatus": "Active"},
    {"CustomerID": "CUST-02", "CustomerName": "Globex Inc", "Email": "ops@globex.com", "LifetimeValue": 68000.0, "TotalOrders": 35, "NPSScore": 10, "AccountStatus": "Active"},
    {"CustomerID": "CUST-03", "CustomerName": "Initech LLC", "Email": "info@initech.com", "LifetimeValue": 12000.0, "TotalOrders": 8, "NPSScore": 6, "AccountStatus": "At Risk"},
]

HR_RECORDS = [
    {"EmployeeID": "EMP-01", "EmployeeName": "Alice Smith", "Department": "Engineering", "JobRole": "Lead Architect", "AnnualSalary": 160000.0, "PerformanceRating": 5},
    {"EmployeeID": "EMP-02", "EmployeeName": "Bob Jones", "Department": "Sales", "JobRole": "Account Executive", "AnnualSalary": 115000.0, "PerformanceRating": 4},
    {"EmployeeID": "EMP-03", "EmployeeName": "Carol Danvers", "Department": "HR", "JobRole": "HR Specialist", "AnnualSalary": 85000.0, "PerformanceRating": 4},
]

INVENTORY_RECORDS = [
    {"SKU": "SKU-101", "ItemName": "Ergonomic Keyboard", "Category": "Electronics", "StockQuantity": 350, "ReorderLevel": 80, "UnitCost": 45.00, "WarehouseLocation": "Warehouse East"},
    {"SKU": "SKU-102", "ItemName": "UltraWide Monitor", "Category": "Electronics", "StockQuantity": 40, "ReorderLevel": 50, "UnitCost": 280.00, "WarehouseLocation": "Warehouse West"},
    {"SKU": "SKU-103", "ItemName": "Standing Desk", "Category": "Furniture", "StockQuantity": 110, "ReorderLevel": 30, "UnitCost": 120.00, "WarehouseLocation": "Warehouse Central"},
]

UNFAMILIAR_RECORDS = [
    {"Txn_Id": "TX-1", "Txn_Dt": "2024-01-08", "Buyer_Nm": "Alpha Corp", "Prod_Cat": "Hardware", "Item_Qty": 5, "Net_Sales": 4500.0, "Cost_Basis": 3100.0},
    {"Txn_Id": "TX-2", "Txn_Dt": "2024-01-15", "Buyer_Nm": "Beta LLC", "Prod_Cat": "Software", "Item_Qty": 2, "Net_Sales": 2200.0, "Cost_Basis": 600.0},
]

MISSING_VALUES_RECORDS = [
    {"RecordID": "R-1", "TxnDate": "2024-01-10", "Category": "Retail", "Amount": 500.0, "Score": 8},
    {"RecordID": "R-2", "TxnDate": None, "Category": "Retail", "Amount": None, "Score": 9},
    {"RecordID": "R-3", "TxnDate": "2024-01-15", "Category": None, "Amount": 750.0, "Score": None},
]

DUPLICATE_RECORDS = [
    {"OrderID": "ORD-701", "Date": "2024-03-01", "Store": "Downtown", "Amount": 125.50},
    {"OrderID": "ORD-701", "Date": "2024-03-01", "Store": "Downtown", "Amount": 125.50},  # Duplicate
    {"OrderID": "ORD-702", "Date": "2024-03-02", "Store": "Uptown", "Amount": 89.00},
    {"OrderID": "ORD-702", "Date": "2024-03-02", "Store": "Uptown", "Amount": 89.00},    # Duplicate
    {"OrderID": "ORD-703", "Date": "2024-03-03", "Store": "Suburbs", "Amount": 210.00},
]


# ==============================================================================
# 1. SALES DATASET AUDIT
# ==============================================================================

def test_audit_dataset_1_sales():
    df = pd.DataFrame(SALES_RECORDS)
    assert infer_column_type(df["Revenue"]) == "numeric"
    assert infer_column_type(df["OrderDate"]) == "date"
    assert infer_column_type(df["Customer"]) in ["text", "id"]

    profile = profile_dataframe(df)
    assert profile["quality"]["totalRows"] == 4
    assert profile["profiles"]["Revenue"]["mean"] == 1475.0
    assert profile["profiles"]["Revenue"]["min"] == 800.0
    assert profile["quality"]["overallScore"] > 80

    domain_info = detect_business_domain(list(df.columns))
    assert domain_info["domain"] in ["sales", "ecommerce"]

    kpis = calculate_kpis(SALES_RECORDS, primary_col="Revenue")
    sum_kpi = next(k for k in kpis if k["aggregation"] == "sum")
    assert sum_kpi["value"] == 5900.0

    registry = calculate_kpi_registry(SALES_RECORDS, domain="sales")
    assert registry["total_count"] > 0
    rev_kpi = next(m for m in registry["metrics"] if m["metric_id"] == "sales_revenue")
    assert rev_kpi["calculated_value"] == 5900.0


# ==============================================================================
# 2. MARKETING DATASET AUDIT
# ==============================================================================

def test_audit_dataset_2_marketing():
    cols = ["campaign_id", "ad_spend", "impressions", "clicks", "conversions", "roas"]
    domain_info = detect_business_domain(cols)
    assert domain_info["domain"] == "marketing"

    req = CampaignAnalyticsRequest(
        records=MARKETING_RECORDS,
        channel_col="Channel",
        spend_col="AdSpend",
        impressions_col="Impressions",
        clicks_col="Clicks",
        conversions_col="Conversions"
    )
    camp_analytics = run_sync(api_campaign_analytics(req))
    assert camp_analytics["total_spend"] == 6000.0
    assert camp_analytics["total_impressions"] == 430000
    assert camp_analytics["total_clicks"] == 23500
    assert camp_analytics["total_conversions"] == 1250
    assert camp_analytics["overall_ctr"] > 0
    assert len(camp_analytics["channels"]) == 3


# ==============================================================================
# 3. FINANCIAL DATASET AUDIT
# ==============================================================================

def test_audit_dataset_3_financial():
    cols = ["ebitda", "cogs", "opex", "gl_account", "operating_income"]
    domain_info = detect_business_domain(cols)
    assert domain_info["domain"] in ["finance", "financial"]

    req = ReportSummaryRequest(
        records=FINANCIAL_RECORDS,
        category_col="Department",
        metric_col="ActualSpend"
    )
    report_summary = run_sync(api_report_summary(req))
    assert report_summary["total_records"] == 3
    assert report_summary["grand_total"] == 2370000.0
    assert len(report_summary["categories"]) == 3


# ==============================================================================
# 4. CUSTOMER DATASET AUDIT
# ==============================================================================

def test_audit_dataset_4_customer():
    cols = ["customer_id", "ltv", "churn_rate", "cohort", "nps"]
    domain_info = detect_business_domain(cols)
    assert domain_info["domain"] == "customer_analytics"

    req = AiQueryRequest(
        query="What is the total lifetime value?",
        records=CUSTOMER_RECORDS
    )
    ai_res = run_sync(api_ai_query(req))
    assert ai_res.query_type in ["AGGREGATION", "SUMMARY"]
    assert len(ai_res.metrics_highlighted) > 0


# ==============================================================================
# 5. HR DATASET AUDIT
# ==============================================================================

def test_audit_dataset_5_hr():
    cols = ["employee_id", "headcount", "salary", "turnover_rate", "department"]
    domain_info = detect_business_domain(cols)
    assert domain_info["domain"] == "hr"

    req = AiQueryRequest(
        query="What is the total salary?",
        records=HR_RECORDS
    )
    ai_res = run_sync(api_ai_query(req))
    assert ai_res.query_type in ["AGGREGATION", "SUMMARY"]
    assert any("360,000" in str(m.value) for m in ai_res.metrics_highlighted)


# ==============================================================================
# 6. INVENTORY DATASET AUDIT
# ==============================================================================

def test_audit_dataset_6_inventory():
    cols = ["warehouse", "stock_on_hand", "lead_time_days", "reorder_point", "supplier_id"]
    domain_info = detect_business_domain(cols)
    assert domain_info["domain"] in ["inventory", "supply_chain"]

    df = pd.DataFrame(INVENTORY_RECORDS)
    profile = profile_dataframe(df)
    assert profile["profiles"]["StockQuantity"]["min"] == 40.0
    assert profile["profiles"]["StockQuantity"]["max"] == 350.0


# ==============================================================================
# 7. UNFAMILIAR COLUMN NAMES AUDIT
# ==============================================================================

def test_audit_dataset_7_unfamiliar_columns():
    unfamiliar_cols = ["Txn_Id", "Txn_Dt", "Buyer_Nm", "Net_Sales", "Cost_Basis"]
    mappings = map_column_roles(unfamiliar_cols, domain="sales")
    
    assert mappings["Net_Sales"]["role"] == "primary_metric"
    assert mappings["Txn_Dt"]["role"] == "timestamp"
    assert mappings["Buyer_Nm"]["role"] == "entity_id"


# ==============================================================================
# 8. MISSING VALUES AUDIT
# ==============================================================================

def test_audit_dataset_8_missing_values():
    df = pd.DataFrame(MISSING_VALUES_RECORDS)
    profile = profile_dataframe(df)
    assert profile["quality"]["missingCellsCount"] > 0
    assert profile["profiles"]["Amount"]["nullCount"] == 1

    clean_res = clean_dataframe(df, action_type="impute_missing", params={"column": "Amount", "strategy": "mean"})
    assert clean_res["cleaned_data"][1]["Amount"] == 625.0


# ==============================================================================
# 9. DUPLICATE RECORDS AUDIT
# ==============================================================================

def test_audit_dataset_9_duplicate_records():
    df = pd.DataFrame(DUPLICATE_RECORDS)
    assert len(df) == 5

    clean_res = clean_dataframe(df, action_type="drop_duplicates", params={})
    cleaned_rows = clean_res["cleaned_data"]
    assert len(cleaned_rows) == 3


# ==============================================================================
# 10. MULTI-SHEET EXCEL WORKBOOK AUDIT
# ==============================================================================

def test_audit_dataset_10_multi_sheet_excel():
    excel_buf = io.BytesIO()
    with pd.ExcelWriter(excel_buf, engine="openpyxl") as writer:
        pd.DataFrame(SALES_RECORDS).to_excel(writer, sheet_name="Sales Orders", index=False)
        pd.DataFrame(MARKETING_RECORDS).to_excel(writer, sheet_name="Ad Campaigns", index=False)
        pd.DataFrame(FINANCIAL_RECORDS).to_excel(writer, sheet_name="Financial Budgets", index=False)
    
    excel_buf.seek(0)
    wb = openpyxl.load_workbook(excel_buf, data_only=True)
    assert wb.sheetnames == ["Sales Orders", "Ad Campaigns", "Financial Budgets"]

    excel_buf.seek(0)
    df_sales = pd.read_excel(excel_buf, sheet_name="Sales Orders")
    assert len(df_sales) == 4
    assert "Revenue" in df_sales.columns

    excel_buf.seek(0)
    df_marketing = pd.read_excel(excel_buf, sheet_name="Ad Campaigns")
    assert len(df_marketing) == 3
    assert "AdSpend" in df_marketing.columns


# ==============================================================================
# 11. VECTORIZED FILTERING & PERFORMANCE BENCHMARK
# ==============================================================================

def test_vectorized_filtering_and_performance_benchmark():
    large_data = [
        {
            "id": f"ROW-{i}",
            "region": "North America" if i % 2 == 0 else "Europe",
            "category": "Electronics" if i % 3 == 0 else "Furniture",
            "revenue": (i * 17) % 5000 + 10,
            "date": f"2024-0{((i % 6) + 1):02d}-15",
        }
        for i in range(10000)
    ]

    start_time = time.perf_counter()
    req = FilterRecordsRequest(
        records=large_data,
        filters=FilterCriteria(
            search_query="ROW-5",
            categorical_filters={"region": ["North America"]},
            numeric_ranges={"revenue": {"min": 100, "max": 4000}}
        )
    )
    res = run_sync(api_filter_records(req))
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    assert res["filtered_records"] > 0
    assert elapsed_ms < 100.0, f"Vectorized filtering took {elapsed_ms:.2f}ms"


# ==============================================================================
# 12. FULL FASTAPI ROUTE PIPELINE AUDIT (IN-PROCESS)
# ==============================================================================

def test_fastapi_route_pipeline_audit():
    # 1. Pipeline Analytics route
    pipe_records = [
        {"deal": "Deal A", "stage": "Closed Won", "amount": 10000},
        {"deal": "Deal B", "stage": "Proposal", "amount": 5000},
    ]
    pipe_req = PipelineAnalyticsRequest(records=pipe_records, stage_col="stage", amount_col="amount")
    pipe_res = run_sync(api_pipeline_analytics(pipe_req))
    assert pipe_res["total_pipeline"] == 15000.0
    assert pipe_res["won_value"] == 10000.0

    # 2. Filter route
    filter_req = FilterRecordsRequest(
        records=SALES_RECORDS,
        filters=FilterCriteria(categorical_filters={"Category": ["Electronics"]})
    )
    filter_resp = run_sync(api_filter_records(filter_req))
    assert filter_resp["filtered_records"] == 2

    # 3. AI Query route
    ai_req = AiQueryRequest(
        query="What is total revenue?",
        records=SALES_RECORDS
    )
    ai_resp = run_sync(api_ai_query(ai_req))
    assert ai_resp.query_type in ["AGGREGATION", "SUMMARY"]
    assert any("5,900" in str(m.value) for m in ai_resp.metrics_highlighted)

    # 4. Multi-format Export routes
    csv_req = ExportCSVRequest(records=SALES_RECORDS, sanitize_formulas=True)
    csv_resp = run_sync(api_export_csv(csv_req))
    assert "ORD-101" in csv_resp.body.decode("utf-8")

    excel_req = ExportExcelRequest(records=SALES_RECORDS)
    excel_resp = run_sync(api_export_excel(excel_req))
    assert excel_resp.media_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert "filename=" in excel_resp.headers["Content-Disposition"]
