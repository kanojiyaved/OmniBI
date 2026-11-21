"""
OmniBI Backend - AI Semantic Column Mapping & Business Domain Detection Engine.
"""
import re
from typing import List, Dict, Any, Optional

DOMAIN_ONTOLOGY: Dict[str, Dict[str, Any]] = {
    "sales": {
        "label": "Sales Pipeline & Deals",
        "primary_metrics": ["deal_value", "deal_amount", "pipeline_value", "sales", "sales_amount", "revenue", "net_sales", "acv", "quota"],
        "secondary_metrics": ["win_rate", "close_rate", "deal_size", "cycle_days", "calls", "meetings", "margin"],
        "dimensions": ["stage", "pipeline", "territory", "sales_rep", "rep", "lead_source", "deal_type", "region"],
        "status_values": ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost", "won", "lost"],
        "entities": ["deal_id", "opportunity_id", "lead_id", "account_id", "rep_id", "buyer_id", "customer_id"],
        "indicators": ["deal", "pipeline", "sales", "quota", "opportunity", "won", "lost", "stage", "rep"]
    },
    "marketing": {
        "label": "Marketing & Digital Advertising",
        "primary_metrics": ["spend", "ad_spend", "conversions", "conversion_rate", "roas", "roi", "cpc", "cpa", "leads", "mql", "sql", "ctr"],
        "secondary_metrics": ["impressions", "clicks", "visits", "pageviews", "bounce_rate", "cost_per_lead", "frequency", "reach"],
        "dimensions": ["campaign", "campaign_name", "channel", "platform", "ad_group", "creative", "placement", "keyword", "utm_source"],
        "status_values": ["active", "paused", "completed", "scheduled", "archived", "draft"],
        "entities": ["campaign_id", "lead_id", "ad_id", "creative_id", "visitor_id"],
        "indicators": ["campaign", "ad_spend", "cpc", "ctr", "roas", "cpa", "impression", "click", "utm", "lead"]
    },
    "finance": {
        "label": "Corporate Finance & Banking",
        "primary_metrics": ["revenue", "net_income", "operating_income", "ebitda", "gross_profit", "net_profit", "cash_flow", "total_assets"],
        "secondary_metrics": ["opex", "capex", "cogs", "expenses", "interest_expense", "tax_expense", "debt", "liabilities", "receivables"],
        "dimensions": ["cost_center", "department", "gl_account", "ledger", "entity", "subsidiary", "currency", "fiscal_quarter"],
        "status_values": ["approved", "reconciled", "pending_approval", "posted", "audited", "rejected"],
        "entities": ["transaction_id", "invoice_id", "account_number", "ledger_id", "voucher_id"],
        "indicators": ["ebitda", "cogs", "opex", "capex", "gl_account", "ledger", "balance", "fiscal", "receivable"]
    },
    "ecommerce": {
        "label": "E-Commerce & Retail",
        "primary_metrics": ["revenue", "sales", "gmv", "gross_merchandise_value", "total_amount", "order_value", "aov", "units_sold", "profit", "net_sales"],
        "secondary_metrics": ["discount", "shipping_cost", "tax", "tax_amount", "refund_amount", "return_rate", "quantity", "price"],
        "dimensions": ["product_category", "category", "subcategory", "brand", "collection", "payment_method", "shipping_method", "channel"],
        "status_values": ["delivered", "shipped", "processing", "returned", "refunded", "canceled", "pending"],
        "entities": ["order_id", "sku", "product_id", "customer_id", "tracking_number", "item_id", "buyer_id"],
        "indicators": ["sku", "order", "cart", "checkout", "product", "shipping", "gmv", "refund", "aov"]
    },
    "customer_analytics": {
        "label": "Customer Analytics & Retention",
        "primary_metrics": ["ltv", "customer_lifetime_value", "churn_rate", "churn", "retention_rate", "nps", "csat", "arpu"],
        "secondary_metrics": ["tenure_months", "days_active", "session_count", "support_tickets_count", "order_frequency"],
        "dimensions": ["cohort", "customer_segment", "segment", "tier", "plan", "lifecycle_stage", "persona"],
        "status_values": ["active", "at_risk", "churned", "dormant", "advocate", "new"],
        "entities": ["customer_id", "client_id", "buyer_id", "user_id", "account_id"],
        "indicators": ["customer", "client", "buyer", "churn", "retention", "nps", "cohort", "ltv", "csat"]
    },
    "hr": {
        "label": "Human Resources & Workforce",
        "primary_metrics": ["headcount", "turnover_rate", "attrition_rate", "retention_rate", "average_salary", "total_payroll", "tenure_years"],
        "secondary_metrics": ["base_salary", "bonus", "overtime_hours", "pto_days_taken", "training_hours", "performance_rating"],
        "dimensions": ["department", "division", "role", "job_title", "location", "office", "employment_type", "level", "manager"],
        "status_values": ["active", "on_leave", "terminated", "probation", "resigned", "retired"],
        "entities": ["employee_id", "emp_id", "worker_id", "badge_number", "requisition_id"],
        "indicators": ["employee", "headcount", "salary", "payroll", "attrition", "turnover", "tenure", "hr", "hire"]
    },
    "inventory": {
        "label": "Inventory & Supply Chain",
        "primary_metrics": ["stock_on_hand", "inventory_level", "turnover_ratio", "lead_time_days", "otif_rate", "backorder_rate", "carrying_cost"],
        "secondary_metrics": ["safety_stock", "reorder_point", "shrinkage_rate", "dock_to_stock_hours", "pallets_stored"],
        "dimensions": ["warehouse", "facility", "supplier", "carrier", "shipping_mode", "origin_port", "destination_port"],
        "status_values": ["in_stock", "low_stock", "out_of_stock", "in_transit", "received", "staged"],
        "entities": ["sku", "item_id", "po_number", "shipment_id", "supplier_id", "pallet_id"],
        "indicators": ["inventory", "stock", "warehouse", "supplier", "sku", "backorder", "lead_time", "reorder"]
    },
    "operations": {
        "label": "Operations & Process Analytics",
        "primary_metrics": ["cycle_time", "throughput", "sla_compliance_rate", "uptime_percentage", "incident_count", "mttr", "error_rate"],
        "secondary_metrics": ["processing_time", "wait_time", "queue_length", "ticket_volume", "downtime_minutes"],
        "dimensions": ["process_name", "workflow", "team", "shift", "service", "severity", "priority", "system"],
        "status_values": ["operational", "degraded", "outage", "open", "in_progress", "resolved", "escalated"],
        "entities": ["incident_id", "ticket_id", "job_id", "task_id", "batch_id"],
        "indicators": ["sla", "incident", "ticket", "uptime", "downtime", "throughput", "mttr", "cycle_time", "process"]
    },
    "saas": {
        "label": "B2B SaaS & Subscriptions",
        "primary_metrics": ["mrr", "arr", "churn", "churn_rate", "arpu", "ltv", "cac", "nrr", "subscribers"],
        "secondary_metrics": ["seats", "licenses", "active_users", "dau", "wau", "mau", "usage_hours", "plan_amount"],
        "dimensions": ["plan", "plan_tier", "tier", "subscription_type", "billing_cycle", "channel", "cohort", "industry"],
        "status_values": ["active", "churned", "trial", "past_due", "canceled", "paused", "expired"],
        "entities": ["account_id", "subscription_id", "tenant_id", "user_id", "org_id", "customer_id"],
        "indicators": ["mrr", "arr", "churn", "subscri", "tenant", "license", "dau", "mau", "seat"]
    },
    "general": {
        "label": "General Enterprise Analytics",
        "primary_metrics": ["total", "value", "amount", "score", "count", "sum", "target"],
        "secondary_metrics": ["weight", "index", "ratio", "percent", "diff", "estimate"],
        "dimensions": ["type", "category", "group", "name", "code", "segment", "class"],
        "status_values": ["active", "inactive", "open", "closed", "flagged"],
        "entities": ["id", "uuid", "code", "key", "index"],
        "indicators": ["data", "record", "row", "item", "entry"]
    }
}

# Domain Aliases
DOMAIN_ONTOLOGY["financial"] = DOMAIN_ONTOLOGY["finance"]
DOMAIN_ONTOLOGY["supply_chain"] = DOMAIN_ONTOLOGY["inventory"]

def normalize_string(val: str) -> str:
    return re.sub(r"[^a-z0-9]", "_", val.lower()).strip("_")

def detect_business_domain(columns: List[str], sample_data: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Detects business domain from column semantics and ontology weights."""
    scores = {d: 0.0 for d in DOMAIN_ONTOLOGY}
    scores["general"] = 0.2
    matches = {d: [] for d in DOMAIN_ONTOLOGY}

    normalized = [normalize_string(c) for c in columns]

    for domain, ontology in DOMAIN_ONTOLOGY.items():
        if domain in ["general", "financial", "supply_chain"]:
            continue

        for orig_col, norm in zip(columns, normalized):
            # Check Primary Metrics (+3.0)
            for pm in ontology["primary_metrics"]:
                if norm == pm or norm.endswith(f"_{pm}") or norm.startswith(f"{pm}_"):
                    scores[domain] += 3.0
                    matches[domain].append(f'Primary KPI "{orig_col}" matches {pm}')
                    break

            # Check Secondary Metrics (+1.5)
            for sm in ontology["secondary_metrics"]:
                if norm == sm or sm in norm:
                    scores[domain] += 1.5
                    matches[domain].append(f'Secondary Metric "{orig_col}" matches {sm}')
                    break

            # Check Dimensions (+1.5)
            for dim in ontology["dimensions"]:
                if norm == dim or dim in norm:
                    scores[domain] += 1.5
                    matches[domain].append(f'Dimension "{orig_col}" matches {dim}')
                    break

            # Check Indicators (+1.0)
            for ind in ontology["indicators"]:
                if ind in norm:
                    scores[domain] += 1.0
                    break

            # Check Entities (+1.2)
            for ent in ontology["entities"]:
                if norm == ent or ent in norm:
                    scores[domain] += 1.2
                    matches[domain].append(f'Entity "{orig_col}" matches {ent}')
                    break

    # Determine highest scoring domain
    best_domain = max(scores, key=scores.get)
    highest_score = scores[best_domain]

    if highest_score >= 3.0:
        confidence = min(0.98, round(0.65 + (highest_score / (len(columns) * 2.5)), 2))
        reasoning = [f"Detected {DOMAIN_ONTOLOGY[best_domain]['label']} ontology (score: {highest_score:.1f})."]
        reasoning.extend(matches[best_domain][:4])
    else:
        best_domain = "general"
        confidence = 0.70
        reasoning = ["Universal tabular dataset with general business structure."]

    return {
        "domain": best_domain,
        "confidence": confidence,
        "reasoning": reasoning,
        "domain_label": DOMAIN_ONTOLOGY[best_domain]["label"],
        "all_scores": scores
    }

def map_column_roles(
    columns: List[str], 
    sample_data: Optional[List[Dict[str, Any]]] = None, 
    domain: str = "general"
) -> Dict[str, Dict[str, Any]]:
    """Maps each column to a semantic role within a business domain with confidence and confirmation status."""
    ontology = DOMAIN_ONTOLOGY.get(domain, DOMAIN_ONTOLOGY["general"])
    results = {}

    for col in columns:
        norm = normalize_string(col)
        
        # 1. Temporal Dates & Timestamps (e.g. Order_Date, Transaction_Date, Invoice_Date, Txn_Dt, Order_Dt)
        if re.search(r"(?:^|_)(date|dt|timestamp|time|created|updated|period|day|month|year|fiscal|quarter|inv_date|txn_dt|order_dt)(?:_|$)", norm):
            results[col] = {
                "column": col,
                "role": "timestamp",
                "suggested_meaning": "Temporal Transaction / Event Date",
                "confidence": 0.95,
                "requires_confirmation": False,
                "description": f'Temporal date/time dimension for "{col}".'
            }
            continue

        # 2. Customer & Entity Identifiers (e.g. Customer, Client, Buyer, Customer_Name, Cust_Name, User_Id)
        if re.search(r"(?:^|_)(customer|client|buyer|customer_name|cust_name|client_name|buyer_name)(?:_|$)", norm):
            results[col] = {
                "column": col,
                "role": "entity_id",
                "suggested_meaning": "Customer / Buyer Entity Identifier",
                "confidence": 0.94,
                "requires_confirmation": False,
                "description": f'Unique customer or client entity for "{col}".'
            }
            continue

        if re.search(r"(?:^|_)(id|uuid|guid|code|sku|key|number|ref|token|acc_no|deal_id|emp_id|order_no)(?:_|$)", norm):
            results[col] = {
                "column": col,
                "role": "entity_id",
                "suggested_meaning": "Unique Entity / Transaction Key",
                "confidence": 0.92,
                "requires_confirmation": False,
                "description": f'Entity identifier for "{col}".'
            }
            continue

        # 3. Geographic
        if re.search(r"(?:^|_)(country|state|city|region|province|postal|zip|latitude|longitude|territory|loc_state)(?:_|$)", norm):
            results[col] = {
                "column": col,
                "role": "geo",
                "suggested_meaning": "Geographic Location / Territory",
                "confidence": 0.92,
                "requires_confirmation": False,
                "description": f'Geographic attribute for "{col}".'
            }
            continue

        # 4. Status
        if re.search(r"(?:^|_)(status|state|stage|outcome|phase|condition|pipeline_stage)(?:_|$)", norm):
            results[col] = {
                "column": col,
                "role": "status",
                "suggested_meaning": "Workflow State / Lifecycle Status",
                "confidence": 0.90,
                "requires_confirmation": False,
                "description": f'Workflow state or status for "{col}".'
            }
            continue

        # 5. Secondary Metric (e.g. costs, discounts, deductions, quantities)
        if any(sm in norm for sm in ontology["secondary_metrics"]) or re.search(r"cost|item_cost|unit_cost|spend|discount|tax|fee|refund|shipping|quantity|qty|units|count|ratio|rate|hours", norm):
            results[col] = {
                "column": col,
                "role": "secondary_metric",
                "suggested_meaning": "Secondary Supporting Metric / Rate / Cost",
                "confidence": 0.90,
                "requires_confirmation": False,
                "description": f'Supporting quantitative measure for "{col}".'
            }
            continue

        # 6. Primary Revenue / Sales Metric (e.g. Sales, Revenue, Amount, Net_Sales, Order_Value, Gross_Amt)
        if any(pm in norm for pm in ontology["primary_metrics"]) or re.search(r"sales|revenue|amount|net_sales|order_value|gross_amt|net_amt|deal_value|gmv|arr|mrr|ebitda", norm):
            results[col] = {
                "column": col,
                "role": "primary_metric",
                "suggested_meaning": "Primary Revenue / Sales Metric",
                "confidence": 0.95,
                "requires_confirmation": False,
                "description": f'Primary quantitative target metric for "{col}".'
            }
            continue

        # 7. Category / Dimension
        if any(d in norm for d in ontology["dimensions"]) or re.search(r"type|category|group|segment|tier|class|department", norm):
            results[col] = {
                "column": col,
                "role": "category",
                "suggested_meaning": "Categorical Slice / Segmentation Attribute",
                "confidence": 0.86,
                "requires_confirmation": False,
                "description": f'Categorical segmentation dimension for "{col}".'
            }
            continue

        # Ambiguous / Unfamiliar Column -> Requires Confirmation
        results[col] = {
            "column": col,
            "role": "attribute",
            "suggested_meaning": "Descriptive Textual Attribute",
            "confidence": 0.58,
            "requires_confirmation": True,
            "description": f'Unfamiliar column header "{col}" requiring user confirmation.'
        }

    return results

def generate_understanding_report(
    columns: List[str],
    domain: str,
    mappings: Dict[str, Dict[str, Any]],
    row_count: int = 1000
) -> Dict[str, Any]:
    """Generates comprehensive Dataset Understanding Report."""
    ontology = DOMAIN_ONTOLOGY.get(domain, DOMAIN_ONTOLOGY["general"])
    
    representation = (
        f"This dataset represents an enterprise {ontology['label']} operational ledger containing "
        f"{row_count} records across {len(columns)} attributes."
    )

    metrics_available = [
        "Executive Financial & Operational Volume Aggregations (SUM)",
        "Mean Unit Economics & Average Metrics (AVG)",
        "Unique Entity Counts & Active Cohort Sizing",
        "Activity Throughput & Transaction Frequency"
    ]

    available_modules = [
        {"name": "Executive Overview & KPI Cards", "status": "available"},
        {"name": "Data Profiling & Quality Diagnostics", "status": "available"},
    ]

    unavailable_modules = []
    if not any("stage" in c.lower() or "deal" in c.lower() for c in columns):
        unavailable_modules.append({
            "name": "Sales Pipeline & Deal Management",
            "reason": "No sales opportunity stage or pipeline status column detected."
        })

    if not any("campaign" in c.lower() or "ad_spend" in c.lower() for c in columns):
        unavailable_modules.append({
            "name": "Marketing Campaign Performance",
            "reason": "No ad spend or campaign attribution columns detected."
        })

    confirmation_required = [
        {"column": col, "confidence": info["confidence"], "suggested_meaning": info["suggested_meaning"]}
        for col, info in mappings.items()
        if info.get("requires_confirmation", False) or info.get("confidence", 1.0) < 0.70
    ]

    return {
        "dataset_representation": representation,
        "calculated_metrics_available": metrics_available,
        "available_modules": available_modules,
        "unavailable_modules": unavailable_modules,
        "columns_requiring_confirmation": confirmation_required
    }
