import pytest
from backend.core.semantic_mapper import (
    detect_business_domain,
    map_column_roles,
    generate_understanding_report,
    DOMAIN_ONTOLOGY
)

def test_detect_all_business_domains():
    domain_tests = {
        "sales": ["deal_value", "pipeline_stage", "sales_rep", "win_rate", "close_date"],
        "marketing": ["campaign_id", "ad_spend", "cpc", "roas", "impressions", "clicks"],
        "finance": ["ebitda", "cogs", "opex", "gl_account", "operating_income"],
        "ecommerce": ["order_id", "sku", "product_category", "sales_amount", "discount"],
        "customer_analytics": ["customer_id", "ltv", "churn_rate", "cohort", "nps"],
        "hr": ["employee_id", "headcount", "salary", "turnover_rate", "department"],
        "inventory": ["warehouse", "stock_on_hand", "lead_time_days", "reorder_point", "supplier_id"],
        "operations": ["cycle_time", "throughput", "sla_compliance_rate", "incident_id", "mttr"],
        "saas": ["account_id", "mrr", "arr", "churn_rate", "plan_tier", "signup_date"]
    }

    for expected_domain, cols in domain_tests.items():
        res = detect_business_domain(cols)
        assert res["domain"] in [expected_domain, "supply_chain" if expected_domain == "inventory" else expected_domain]
        assert res["confidence"] >= 0.70
        assert len(res["reasoning"]) > 0

def test_unfamiliar_column_names_resolution():
    revenue_variations = ["Sales", "Revenue", "Amount", "Net_Sales", "Order_Value", "gross_amt", "deal_value"]
    rev_mappings = map_column_roles(revenue_variations, domain="sales")
    for col in revenue_variations:
        assert rev_mappings[col]["role"] == "primary_metric", f"Failed for {col}"
        assert rev_mappings[col]["confidence"] >= 0.85

    customer_variations = ["Customer", "Client", "Buyer", "Customer_Name", "Cust_Name", "client_name"]
    cust_mappings = map_column_roles(customer_variations, domain="sales")
    for col in customer_variations:
        assert cust_mappings[col]["role"] == "entity_id", f"Failed for {col}"
        assert cust_mappings[col]["confidence"] >= 0.85

    date_variations = ["Order_Date", "Transaction_Date", "Invoice_Date", "Txn_Dt", "Order_Dt"]
    date_mappings = map_column_roles(date_variations, domain="sales")
    for col in date_variations:
        assert date_mappings[col]["role"] == "timestamp", f"Failed for {col}"
        assert date_mappings[col]["confidence"] >= 0.85

def test_low_confidence_requires_confirmation():
    cols = ["xyz_unknown_column_123", "random_unmapped_header"]
    mappings = map_column_roles(cols, domain="general")
    for col in cols:
        assert mappings[col]["requires_confirmation"] is True
        assert mappings[col]["confidence"] < 0.70

def test_generate_understanding_report():
    cols = ["cust_id", "net_sales", "order_date", "memo_notes"]
    mappings = map_column_roles(cols, domain="sales")
    report = generate_understanding_report(cols, domain="sales", mappings=mappings, row_count=2500)

    assert "operational ledger" in report["dataset_representation"].lower()
    assert len(report["calculated_metrics_available"]) > 0
    assert len(report["available_modules"]) >= 2
    assert len(report["unavailable_modules"]) > 0
    assert len(report["columns_requiring_confirmation"]) >= 1
