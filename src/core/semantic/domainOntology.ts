import { BusinessDomain } from '../../types';

export interface DomainKeywordRule {
  primaryMetrics: string[];
  secondaryMetrics: string[];
  dimensions: string[];
  statusValues: string[];
  entities: string[];
  indicators: string[];
  label: string;
  description: string;
}

export const DOMAIN_ONTOLOGIES: Record<BusinessDomain, DomainKeywordRule> = {
  sales: {
    label: 'Sales Pipeline & Deals',
    description: 'B2B deal pipeline, sales quotas, opportunity stages, and deal velocity',
    primaryMetrics: [
      'deal_value', 'deal_amount', 'pipeline_value', 'sales', 'sales_amount', 'revenue',
      'quota', 'won_amount', 'contract_value', 'acv', 'tcv', 'net_sales'
    ],
    secondaryMetrics: [
      'win_rate', 'close_rate', 'deal_size', 'cycle_days', 'activities_count', 'calls',
      'meetings', 'proposals_sent', 'discount_pct', 'margin'
    ],
    dimensions: [
      'stage', 'pipeline', 'territory', 'sales_rep', 'rep', 'lead_source', 'deal_type',
      'industry', 'tier', 'region', 'priority'
    ],
    statusValues: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'won', 'lost'],
    entities: ['deal_id', 'opportunity_id', 'lead_id', 'account_id', 'rep_id', 'buyer_id'],
    indicators: ['deal', 'pipeline', 'sales', 'quota', 'opportunity', 'won', 'lost', 'stage', 'rep']
  },
  marketing: {
    label: 'Marketing & Digital Ads',
    description: 'Ad campaign attribution, impressions, clicks, conversion funnels, and ROAS',
    primaryMetrics: [
      'spend', 'ad_spend', 'conversions', 'conversion_rate', 'roas', 'roi', 'cpc', 'cpa',
      'cpm', 'leads', 'mql', 'sql', 'pipeline_value', 'revenue_generated', 'ctr'
    ],
    secondaryMetrics: [
      'impressions', 'clicks', 'visits', 'pageviews', 'bounce_rate', 'cost_per_lead',
      'cost_per_click', 'frequency', 'reach', 'engaged_sessions', 'video_views'
    ],
    dimensions: [
      'campaign', 'campaign_name', 'channel', 'platform', 'ad_group', 'creative',
      'placement', 'keyword', 'audience', 'utm_source', 'utm_medium', 'device'
    ],
    statusValues: ['active', 'paused', 'completed', 'scheduled', 'archived', 'draft'],
    entities: ['campaign_id', 'lead_id', 'ad_id', 'creative_id', 'visitor_id'],
    indicators: ['campaign', 'ad_spend', 'cpc', 'ctr', 'roas', 'cpa', 'impression', 'click', 'utm', 'lead']
  },
  finance: {
    label: 'Corporate Finance & Banking',
    description: 'General ledger, EBITDA, profit & loss, operating expenses, and cash flow',
    primaryMetrics: [
      'revenue', 'net_income', 'operating_income', 'ebitda', 'gross_profit', 'net_profit',
      'cash_flow', 'free_cash_flow', 'operating_cash_flow', 'total_assets', 'net_worth'
    ],
    secondaryMetrics: [
      'opex', 'capex', 'cogs', 'expenses', 'interest_expense', 'tax_expense', 'debt',
      'liabilities', 'receivables', 'payables', 'working_capital', 'budget', 'variance'
    ],
    dimensions: [
      'cost_center', 'department', 'gl_account', 'ledger', 'entity', 'subsidiary',
      'currency', 'fiscal_quarter', 'fiscal_year', 'expense_type', 'asset_class'
    ],
    statusValues: ['approved', 'reconciled', 'pending_approval', 'posted', 'audited', 'rejected'],
    entities: ['transaction_id', 'invoice_id', 'account_number', 'ledger_id', 'voucher_id'],
    indicators: ['ebitda', 'cogs', 'opex', 'capex', 'gl_account', 'ledger', 'balance', 'fiscal', 'receivable']
  },
  ecommerce: {
    label: 'E-Commerce & Retail',
    description: 'Online store transactions, SKU catalogs, basket size, and fulfillment',
    primaryMetrics: [
      'revenue', 'sales', 'gmv', 'gross_merchandise_value', 'total_amount', 'order_value',
      'aov', 'average_order_value', 'units_sold', 'profit', 'margin', 'gross_margin'
    ],
    secondaryMetrics: [
      'discount', 'shipping_cost', 'tax', 'tax_amount', 'refund_amount', 'return_rate',
      'cart_abandonment_rate', 'quantity', 'items_count', 'weight_kg', 'price', 'unit_price'
    ],
    dimensions: [
      'product_category', 'category', 'subcategory', 'brand', 'collection', 'payment_method',
      'shipping_method', 'channel', 'store_id', 'fulfillment_center', 'device_category'
    ],
    statusValues: ['delivered', 'shipped', 'processing', 'returned', 'refunded', 'canceled', 'pending'],
    entities: ['order_id', 'sku', 'product_id', 'customer_id', 'tracking_number', 'item_id'],
    indicators: ['sku', 'order', 'cart', 'checkout', 'product', 'shipping', 'gmv', 'refund', 'aov']
  },
  customer_analytics: {
    label: 'Customer Analytics & Retention',
    description: 'Customer churn, LTV, cohorts, NPS, retention, and lifetime engagement',
    primaryMetrics: [
      'ltv', 'customer_lifetime_value', 'churn_rate', 'churn', 'retention_rate', 'nps',
      'net_promoter_score', 'csat', 'arpu', 'average_revenue_per_user', 'repeat_purchase_rate'
    ],
    secondaryMetrics: [
      'tenure_months', 'days_active', 'session_count', 'support_tickets_count',
      'satisfaction_score', 'order_frequency', 'clv', 'referral_count'
    ],
    dimensions: [
      'cohort', 'customer_segment', 'segment', 'tier', 'plan', 'lifecycle_stage',
      'persona', 'signup_channel', 'geography', 'age_group'
    ],
    statusValues: ['active', 'at_risk', 'churned', 'dormant', 'advocate', 'new'],
    entities: ['customer_id', 'client_id', 'buyer_id', 'user_id', 'account_id', 'contact_id'],
    indicators: ['customer', 'client', 'buyer', 'churn', 'retention', 'nps', 'cohort', 'ltv', 'csat']
  },
  hr: {
    label: 'Human Resources & Workforce',
    description: 'Employee headcount, salary compensation, attrition, and performance reviews',
    primaryMetrics: [
      'headcount', 'turnover_rate', 'attrition_rate', 'retention_rate', 'average_salary',
      'total_payroll', 'tenure_years', 'employee_satisfaction_score', 'enps', 'time_to_hire'
    ],
    secondaryMetrics: [
      'base_salary', 'bonus', 'overtime_hours', 'pto_days_taken', 'training_hours',
      'performance_rating', 'cost_per_hire', 'benefits_cost', 'sick_leave_days'
    ],
    dimensions: [
      'department', 'division', 'role', 'job_title', 'location', 'office', 'employment_type',
      'level', 'grade', 'manager', 'education_level', 'gender', 'generation'
    ],
    statusValues: ['active', 'on_leave', 'terminated', 'probation', 'resigned', 'retired'],
    entities: ['employee_id', 'emp_id', 'worker_id', 'badge_number', 'requisition_id'],
    indicators: ['employee', 'headcount', 'salary', 'payroll', 'attrition', 'turnover', 'tenure', 'hr', 'hire']
  },
  inventory: {
    label: 'Inventory & Supply Chain',
    description: 'Warehouse stock levels, reorder points, inventory turnover, and freight lead time',
    primaryMetrics: [
      'stock_on_hand', 'inventory_level', 'turnover_ratio', 'lead_time_days', 'otif_rate',
      'fill_rate', 'backorder_rate', 'carrying_cost', 'reorder_point', 'freight_cost'
    ],
    secondaryMetrics: [
      'safety_stock', 'shrinkage_rate', 'dock_to_stock_hours', 'pallets_stored',
      'warehouse_utilization', 'order_cycle_time', 'days_of_supply'
    ],
    dimensions: [
      'warehouse', 'facility', 'supplier', 'carrier', 'shipping_mode', 'origin_port',
      'destination_port', 'stock_category', 'bin_location', 'lot_number'
    ],
    statusValues: ['in_stock', 'low_stock', 'out_of_stock', 'in_transit', 'received', 'staged'],
    entities: ['sku', 'item_id', 'po_number', 'shipment_id', 'supplier_id', 'pallet_id'],
    indicators: ['inventory', 'stock', 'warehouse', 'supplier', 'sku', 'backorder', 'lead_time', 'reorder']
  },
  operations: {
    label: 'Operations & Process Analytics',
    description: 'Operational throughput, cycle times, SLA compliance, incidents, and uptime',
    primaryMetrics: [
      'cycle_time', 'throughput', 'sla_compliance_rate', 'uptime_percentage', 'incident_count',
      'mttr', 'mean_time_to_resolve', 'error_rate', 'efficiency_score', 'capacity_utilization'
    ],
    secondaryMetrics: [
      'processing_time', 'wait_time', 'queue_length', 'ticket_volume', 'first_response_time',
      'downtime_minutes', 'resolved_count', 'escalation_rate'
    ],
    dimensions: [
      'process_name', 'workflow', 'team', 'shift', 'service', 'severity', 'priority',
      'system', 'node', 'station', 'operator'
    ],
    statusValues: ['operational', 'degraded', 'outage', 'open', 'in_progress', 'resolved', 'escalated'],
    entities: ['incident_id', 'ticket_id', 'job_id', 'task_id', 'batch_id', 'case_id'],
    indicators: ['sla', 'incident', 'ticket', 'uptime', 'downtime', 'throughput', 'mttr', 'cycle_time', 'process']
  },
  saas: {
    label: 'B2B SaaS & Subscriptions',
    description: 'Monthly/Annual recurring revenue, user licenses, churn, and plan tiers',
    primaryMetrics: [
      'mrr', 'arr', 'churn_rate', 'churn', 'arpu', 'ltv', 'cac', 'nrr', 'net_retention',
      'renewal_rate', 'monthly_recurring_revenue', 'annual_recurring_revenue', 'subscribers'
    ],
    secondaryMetrics: [
      'seats', 'licenses', 'active_users', 'dau', 'wau', 'mau', 'usage_hours', 'api_calls',
      'storage_gb', 'plan_amount', 'discount_amount', 'expansion_revenue', 'contraction_revenue'
    ],
    dimensions: [
      'plan', 'plan_tier', 'tier', 'subscription_type', 'billing_cycle', 'cadence',
      'channel', 'acquisition_channel', 'cohort', 'industry', 'organization', 'company_size'
    ],
    statusValues: ['active', 'churned', 'trial', 'past_due', 'canceled', 'paused', 'expired', 'upgraded'],
    entities: ['account_id', 'subscription_id', 'tenant_id', 'user_id', 'org_id', 'customer_id'],
    indicators: ['mrr', 'arr', 'churn', 'subscri', 'tenant', 'license', 'dau', 'mau', 'seat']
  },
  financial: {
    // Alias to finance
    label: 'Corporate Finance & Banking',
    description: 'General ledger, EBITDA, profit & loss, operating expenses, and cash flow',
    primaryMetrics: [
      'revenue', 'net_income', 'operating_income', 'ebitda', 'gross_profit', 'net_profit',
      'cash_flow', 'free_cash_flow', 'operating_cash_flow', 'total_assets', 'net_worth'
    ],
    secondaryMetrics: [
      'opex', 'capex', 'cogs', 'expenses', 'interest_expense', 'tax_expense', 'debt',
      'liabilities', 'receivables', 'payables', 'working_capital', 'budget', 'variance'
    ],
    dimensions: [
      'cost_center', 'department', 'gl_account', 'ledger', 'entity', 'subsidiary',
      'currency', 'fiscal_quarter', 'fiscal_year', 'expense_type', 'asset_class'
    ],
    statusValues: ['approved', 'reconciled', 'pending_approval', 'posted', 'audited', 'rejected'],
    entities: ['transaction_id', 'invoice_id', 'account_number', 'ledger_id', 'voucher_id'],
    indicators: ['ebitda', 'cogs', 'opex', 'capex', 'gl_account', 'ledger', 'balance', 'fiscal', 'receivable']
  },
  supply_chain: {
    // Alias to inventory
    label: 'Inventory & Supply Chain',
    description: 'Warehouse stock levels, reorder points, inventory turnover, and freight lead time',
    primaryMetrics: [
      'stock_on_hand', 'inventory_level', 'turnover_ratio', 'lead_time_days', 'otif_rate',
      'fill_rate', 'backorder_rate', 'carrying_cost', 'reorder_point', 'freight_cost'
    ],
    secondaryMetrics: [
      'safety_stock', 'shrinkage_rate', 'dock_to_stock_hours', 'pallets_stored',
      'warehouse_utilization', 'order_cycle_time', 'days_of_supply'
    ],
    dimensions: [
      'warehouse', 'facility', 'supplier', 'carrier', 'shipping_mode', 'origin_port',
      'destination_port', 'stock_category', 'bin_location', 'lot_number'
    ],
    statusValues: ['in_stock', 'low_stock', 'out_of_stock', 'in_transit', 'received', 'staged'],
    entities: ['sku', 'item_id', 'po_number', 'shipment_id', 'supplier_id', 'pallet_id'],
    indicators: ['inventory', 'stock', 'warehouse', 'supplier', 'sku', 'backorder', 'lead_time', 'reorder']
  },
  healthcare: {
    label: 'Healthcare & Clinical Analytics',
    description: 'Hospital patient admissions, clinical outcomes, lengths of stay, and readmissions',
    primaryMetrics: [
      'admissions', 'patient_count', 'length_of_stay', 'los', 'readmission_rate', 'mortality_rate',
      'bed_occupancy_rate', 'treatment_cost', 'icu_days', 'wait_time_minutes', 'er_visits'
    ],
    secondaryMetrics: [
      'age', 'dosage', 'nurse_to_patient_ratio', 'billing_amount', 'insurance_coverage',
      'copay', 'lab_tests_count', 'procedure_count', 'vital_bp_systolic', 'vital_bp_diastolic'
    ],
    dimensions: [
      'diagnosis', 'icd10', 'drg', 'department', 'ward', 'specialty', 'physician',
      'admission_type', 'insurance_provider', 'patient_gender', 'triage_acuity', 'facility'
    ],
    statusValues: ['admitted', 'discharged', 'transferred', 'in_treatment', 'critical', 'stable'],
    entities: ['patient_id', 'encounter_id', 'mrn', 'physician_id', 'claim_id', 'visit_id'],
    indicators: ['patient', 'admission', 'diagnosis', 'icd', 'clinical', 'hospital', 'doctor', 'treatment', 'nurse']
  },
  general: {
    label: 'General Enterprise Analytics',
    description: 'Universal cross-functional tabular metrics and reporting',
    primaryMetrics: ['total', 'value', 'amount', 'score', 'count', 'sum', 'target'],
    secondaryMetrics: ['weight', 'index', 'ratio', 'percent', 'diff', 'estimate'],
    dimensions: ['type', 'category', 'group', 'name', 'code', 'segment', 'class'],
    statusValues: ['active', 'inactive', 'open', 'closed', 'flagged'],
    entities: ['id', 'uuid', 'code', 'key', 'index'],
    indicators: ['data', 'record', 'row', 'item', 'entry']
  }
};
