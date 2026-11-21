import { 
  Dataset, 
  BusinessDomain, 
  RegistryMetricDefinition, 
  DynamicKPIRegistry,
  KPIDefinition,
  AggregationMethod
} from '../../types';
import { 
  computeSum, 
  computeAverage, 
  computeMedian,
  computeCount, 
  computeUniqueCount, 
  computeMin, 
  computeMax, 
  computeMoMGrowth, 
  computeSparkline,
  computeRatio,
  computePercentage 
} from './metricEngine';
import { formatMetricValue } from './kpiGenerator';

interface MetricTemplate {
  metricId: string;
  metricName: string;
  domain: BusinessDomain;
  formula: string;
  aggregationMethod: AggregationMethod;
  requiredFields: string[]; // Logical keys: 'revenue', 'profit', 'expenses', 'clicks', 'impressions', 'conversions', 'spend', 'customer', 'employee', 'salary', 'department', 'turnover', 'date'
  isPositiveGood: boolean;
  format: 'currency' | 'number' | 'percentage' | 'compact';
  category: string;
  compute: (
    data: Record<string, any>[], 
    matchedCols: Record<string, string>, 
    dateCol?: string
  ) => { value: number | null; provenance: string; comparison?: any; sparkline?: number[] };
}

/**
 * Normalizes field name for pattern matching.
 */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '_').trim();

/**
 * Finds the best dataset column matching a logical metric requirement.
 */
export const findMatchingColumn = (
  dataset: Dataset, 
  logicalKey: string
): string | undefined => {
  const { columns, semanticMappings = {}, profiles = {} } = dataset;

  switch (logicalKey) {
    case 'revenue':
    case 'income': {
      // 1. Look for explicit revenue/sales column
      const namedRev = columns.find((c) => /(?:^|_)(revenue|sales|net_sales|income|order_value|deal_value|gmv|arr|mrr|total_amount)(?:_|$)/i.test(norm(c)));
      if (namedRev) return namedRev;
      // 2. Check primary_metric excluding non-financial metrics (like conversions or churn)
      const pm = columns.find((c) => (semanticMappings[c]?.role === 'primary_metric' || profiles[c]?.semanticRole === 'primary_metric') && !/conversion|click|impression|lead|churn/i.test(norm(c)));
      if (pm) return pm;
      return columns.find((c) => /(?:^|_)(amount|val)(?:_|$)/i.test(norm(c)));
    }

    case 'profit':
    case 'net_profit': {
      return columns.find((c) => /(?:^|_)(net_profit|profit|net_income|operating_profit|margin_amt|ebitda)(?:_|$)/i.test(norm(c)));
    }

    case 'expenses':
    case 'cost': {
      // Check secondary_metric with cost/expense
      const sm = columns.find((c) => 
        (semanticMappings[c]?.role === 'secondary_metric' || profiles[c]?.semanticRole === 'secondary_metric') &&
        /(?:^|_)(cogs|opex|expense|expenses|cost|total_?cost|discount|actual_?spend)(?:_|$)/i.test(norm(c))
      );
      if (sm) return sm;
      return columns.find((c) => /(?:^|_)(opex|capex|cogs|expense|expenses|cost|item_?cost|unit_?cost|spend|actual_?spend)(?:_|$)/i.test(norm(c)));
    }

    case 'customer': {
      // Check entity_id with customer/client/buyer
      const ent = columns.find((c) => 
        (semanticMappings[c]?.role === 'entity_id' || profiles[c]?.semanticRole === 'entity_id') &&
        /(?:^|_)(customer|client|buyer|account|user)(?:_|$)/i.test(norm(c))
      );
      if (ent) return ent;
      return columns.find((c) => /(?:^|_)(customer|client|buyer|customer_?name|cust_?name|account_?name|user_?id|cust_?id)(?:_|$)/i.test(norm(c)));
    }

    case 'orders': {
      return columns.find((c) => /(?:^|_)(order_?id|order_?no|order_?num|transaction_?id|txn_?id|deal_?id)(?:_|$)/i.test(norm(c)));
    }

    case 'impressions': {
      return columns.find((c) => /(?:^|_)(impressions?|views|ad_?views|ad_?impressions)(?:_|$)/i.test(norm(c)));
    }

    case 'clicks': {
      return columns.find((c) => /(?:^|_)(clicks?|ad_?clicks|link_?clicks)(?:_|$)/i.test(norm(c)));
    }

    case 'conversions': {
      return columns.find((c) => /(?:^|_)(conversions?|leads|mql|sql|subscribers|purchases)(?:_|$)/i.test(norm(c)));
    }

    case 'marketing_spend': {
      return columns.find((c) => /(?:^|_)(ad_?spend|spend|marketing_?spend|ad_?cost|campaign_?cost)(?:_|$)/i.test(norm(c)));
    }

    case 'salary': {
      return columns.find((c) => /(?:^|_)(salary|base_?salary|avg_?salary|compensation|annual_?salary|pay)(?:_|$)/i.test(norm(c)));
    }

    case 'department': {
      return columns.find((c) => /(?:^|_)(department|dept|division|team|business_?unit)(?:_|$)/i.test(norm(c)));
    }

    case 'employee': {
      const ent = columns.find((c) => 
        (semanticMappings[c]?.role === 'entity_id' || profiles[c]?.semanticRole === 'entity_id') &&
        /(?:^|_)(employee|worker|staff|emp)(?:_|$)/i.test(norm(c))
      );
      if (ent) return ent;
      return columns.find((c) => /(?:^|_)(employee_?id|emp_?id|badge_?number|staff_?id|worker_?id|employee)(?:_|$)/i.test(norm(c)));
    }

    case 'turnover': {
      return columns.find((c) => /(?:^|_)(turnover|attrition|turnover_rate|attrition_rate|terminated|churn)(?:_|$)/i.test(norm(c)));
    }

    case 'date': {
      return columns.find((c) => 
        semanticMappings[c]?.role === 'timestamp' || 
        profiles[c]?.inferredType === 'date' || 
        /(?:^|_)(date|dt|timestamp|time|created_at|period|signup_date|close_date)(?:_|$)/i.test(norm(c))
      );
    }

    default:
      return columns.find((c) => norm(c) === norm(logicalKey));
  }
};

/**
 * Standard registry templates covering Sales, Marketing, Finance, HR, and General domains.
 */
export const METRIC_REGISTRY_TEMPLATES: MetricTemplate[] = [
  // =========================================================================
  // 1. SALES DOMAIN METRICS
  // =========================================================================
  {
    metricId: 'sales_revenue',
    metricName: 'Total Revenue',
    domain: 'sales',
    formula: 'SUM(revenue)',
    aggregationMethod: 'SUM',
    requiredFields: ['revenue'],
    isPositiveGood: true,
    format: 'currency',
    category: 'Financial Performance',
    compute: (data, matched, dateCol) => {
      const col = matched['revenue'];
      const val = computeSum(data, col);
      const growth = computeMoMGrowth(data, col, dateCol);
      const sparkline = computeSparkline(data, col, dateCol);
      return {
        value: val,
        provenance: `Sum of "${col}" across ${data.length} records`,
        comparison: {
          previousValue: growth.previousPeriod,
          currentValue: growth.currentPeriod,
          changePercentage: growth.growthPct,
          trend: growth.trend,
        },
        sparkline,
      };
    },
  },
  {
    metricId: 'sales_orders',
    metricName: 'Total Orders',
    domain: 'sales',
    formula: 'COUNT(records)',
    aggregationMethod: 'COUNT',
    requiredFields: [], // Available on any tabular dataset
    isPositiveGood: true,
    format: 'compact',
    category: 'Sales Volume',
    compute: (data) => ({
      value: computeCount(data),
      provenance: `Count of total order/transaction records (${data.length} rows)`,
    }),
  },
  {
    metricId: 'sales_aov',
    metricName: 'Average Order Value (AOV)',
    domain: 'sales',
    formula: 'SUM(revenue) / COUNT(orders)',
    aggregationMethod: 'RATIO',
    requiredFields: ['revenue'],
    isPositiveGood: true,
    format: 'currency',
    category: 'Unit Economics',
    compute: (data, matched) => {
      const col = matched['revenue'];
      const rev = computeSum(data, col);
      const cnt = computeCount(data);
      const val = computeRatio(rev, cnt);
      return {
        value: val,
        provenance: `Total revenue (${rev}) divided by order volume (${cnt})`,
      };
    },
  },
  {
    metricId: 'sales_profit',
    metricName: 'Total Profit',
    domain: 'sales',
    formula: 'SUM(profit)',
    aggregationMethod: 'SUM',
    requiredFields: ['profit'],
    isPositiveGood: true,
    format: 'currency',
    category: 'Profitability',
    compute: (data, matched, dateCol) => {
      const col = matched['profit'];
      const val = computeSum(data, col);
      const growth = computeMoMGrowth(data, col, dateCol);
      const sparkline = computeSparkline(data, col, dateCol);
      return {
        value: val,
        provenance: `Sum of profit column "${col}" across ${data.length} records`,
        comparison: {
          previousValue: growth.previousPeriod,
          currentValue: growth.currentPeriod,
          changePercentage: growth.growthPct,
          trend: growth.trend,
        },
        sparkline,
      };
    },
  },
  {
    metricId: 'sales_profit_margin',
    metricName: 'Profit Margin',
    domain: 'sales',
    formula: '(SUM(profit) / SUM(revenue)) * 100',
    aggregationMethod: 'PERCENTAGE',
    requiredFields: ['profit', 'revenue'],
    isPositiveGood: true,
    format: 'percentage',
    category: 'Profitability',
    compute: (data, matched) => {
      const pCol = matched['profit'];
      const rCol = matched['revenue'];
      const profit = computeSum(data, pCol);
      const revenue = computeSum(data, rCol);
      const val = computePercentage(profit, revenue);
      return {
        value: val,
        provenance: `Total profit from "${pCol}" (${profit}) / Total revenue from "${rCol}" (${revenue}) * 100`,
      };
    },
  },
  {
    metricId: 'sales_customer_count',
    metricName: 'Customer Count',
    domain: 'sales',
    formula: 'DISTINCT_COUNT(customer)',
    aggregationMethod: 'DISTINCT_COUNT',
    requiredFields: ['customer'],
    isPositiveGood: true,
    format: 'compact',
    category: 'Audience & Cohort',
    compute: (data, matched) => {
      const col = matched['customer'];
      const val = computeUniqueCount(data, col);
      return {
        value: val,
        provenance: `Distinct unique customer identifiers in "${col}"`,
      };
    },
  },
  {
    metricId: 'sales_revenue_growth',
    metricName: 'Revenue Growth Rate',
    domain: 'sales',
    formula: '((Current_Revenue - Previous_Revenue) / Previous_Revenue) * 100',
    aggregationMethod: 'GROWTH',
    requiredFields: ['revenue', 'date'],
    isPositiveGood: true,
    format: 'percentage',
    category: 'Growth Dynamics',
    compute: (data, matched) => {
      const rCol = matched['revenue'];
      const dCol = matched['date'];
      const growth = computeMoMGrowth(data, rCol, dCol);
      return {
        value: growth.growthPct,
        provenance: `Period-over-period growth of "${rCol}" partitioned chronologically by "${dCol}"`,
        comparison: {
          previousValue: growth.previousPeriod,
          currentValue: growth.currentPeriod,
          changePercentage: growth.growthPct,
          trend: growth.trend,
        },
      };
    },
  },

  // =========================================================================
  // 2. MARKETING DOMAIN METRICS
  // =========================================================================
  {
    metricId: 'mktg_impressions',
    metricName: 'Total Impressions',
    domain: 'marketing',
    formula: 'SUM(impressions)',
    aggregationMethod: 'SUM',
    requiredFields: ['impressions'],
    isPositiveGood: true,
    format: 'compact',
    category: 'Campaign Reach',
    compute: (data, matched, dateCol) => {
      const col = matched['impressions'];
      const val = computeSum(data, col);
      const sparkline = computeSparkline(data, col, dateCol);
      return {
        value: val,
        provenance: `Sum of ad impressions from "${col}"`,
        sparkline,
      };
    },
  },
  {
    metricId: 'mktg_clicks',
    metricName: 'Total Clicks',
    domain: 'marketing',
    formula: 'SUM(clicks)',
    aggregationMethod: 'SUM',
    requiredFields: ['clicks'],
    isPositiveGood: true,
    format: 'compact',
    category: 'Engagement',
    compute: (data, matched, dateCol) => {
      const col = matched['clicks'];
      const val = computeSum(data, col);
      const sparkline = computeSparkline(data, col, dateCol);
      return {
        value: val,
        provenance: `Sum of user clicks from "${col}"`,
        sparkline,
      };
    },
  },
  {
    metricId: 'mktg_ctr',
    metricName: 'Click-Through Rate (CTR)',
    domain: 'marketing',
    formula: '(SUM(clicks) / SUM(impressions)) * 100',
    aggregationMethod: 'PERCENTAGE',
    requiredFields: ['clicks', 'impressions'],
    isPositiveGood: true,
    format: 'percentage',
    category: 'Engagement',
    compute: (data, matched) => {
      const cCol = matched['clicks'];
      const iCol = matched['impressions'];
      const clicks = computeSum(data, cCol);
      const imps = computeSum(data, iCol);
      const val = computePercentage(clicks, imps);
      return {
        value: val,
        provenance: `Clicks (${clicks}) / Impressions (${imps}) * 100`,
      };
    },
  },
  {
    metricId: 'mktg_conversions',
    metricName: 'Total Conversions',
    domain: 'marketing',
    formula: 'SUM(conversions)',
    aggregationMethod: 'SUM',
    requiredFields: ['conversions'],
    isPositiveGood: true,
    format: 'compact',
    category: 'Conversion Performance',
    compute: (data, matched, dateCol) => {
      const col = matched['conversions'];
      const val = computeSum(data, col);
      const sparkline = computeSparkline(data, col, dateCol);
      return {
        value: val,
        provenance: `Sum of conversions from "${col}"`,
        sparkline,
      };
    },
  },
  {
    metricId: 'mktg_conversion_rate',
    metricName: 'Conversion Rate',
    domain: 'marketing',
    formula: '(SUM(conversions) / SUM(clicks)) * 100',
    aggregationMethod: 'PERCENTAGE',
    requiredFields: ['conversions', 'clicks'],
    isPositiveGood: true,
    format: 'percentage',
    category: 'Conversion Performance',
    compute: (data, matched) => {
      const convCol = matched['conversions'];
      const clickCol = matched['clicks'];
      const conv = computeSum(data, convCol);
      const clicks = computeSum(data, clickCol);
      const val = computePercentage(conv, clicks);
      return {
        value: val,
        provenance: `Conversions (${conv}) / Clicks (${clicks}) * 100`,
      };
    },
  },
  {
    metricId: 'mktg_spend',
    metricName: 'Marketing Spend',
    domain: 'marketing',
    formula: 'SUM(marketing_spend)',
    aggregationMethod: 'SUM',
    requiredFields: ['marketing_spend'],
    isPositiveGood: false, // Higher spend is a cost
    format: 'currency',
    category: 'Cost & Efficiency',
    compute: (data, matched, dateCol) => {
      const col = matched['marketing_spend'];
      const val = computeSum(data, col);
      const sparkline = computeSparkline(data, col, dateCol);
      return {
        value: val,
        provenance: `Sum of marketing and ad spend from "${col}"`,
        sparkline,
      };
    },
  },
  {
    metricId: 'mktg_roas',
    metricName: 'Return on Ad Spend (ROAS)',
    domain: 'marketing',
    formula: 'SUM(revenue) / SUM(marketing_spend)',
    aggregationMethod: 'RATIO',
    requiredFields: ['revenue', 'marketing_spend'],
    isPositiveGood: true,
    format: 'number',
    category: 'Cost & Efficiency',
    compute: (data, matched) => {
      const rCol = matched['revenue'];
      const sCol = matched['marketing_spend'];
      const rev = computeSum(data, rCol);
      const spend = computeSum(data, sCol);
      const val = computeRatio(rev, spend);
      return {
        value: val,
        provenance: `Attributed revenue (${rev}) divided by total ad spend (${spend})`,
      };
    },
  },

  // =========================================================================
  // 3. FINANCIAL DOMAIN METRICS
  // =========================================================================
  {
    metricId: 'fin_income',
    metricName: 'Total Operating Income',
    domain: 'finance',
    formula: 'SUM(income)',
    aggregationMethod: 'SUM',
    requiredFields: ['income'],
    isPositiveGood: true,
    format: 'currency',
    category: 'P&L Statement',
    compute: (data, matched, dateCol) => {
      const col = matched['income'];
      const val = computeSum(data, col);
      const growth = computeMoMGrowth(data, col, dateCol);
      const sparkline = computeSparkline(data, col, dateCol);
      return {
        value: val,
        provenance: `Sum of gross income / revenue from "${col}"`,
        comparison: {
          previousValue: growth.previousPeriod,
          currentValue: growth.currentPeriod,
          changePercentage: growth.growthPct,
          trend: growth.trend,
        },
        sparkline,
      };
    },
  },
  {
    metricId: 'fin_expenses',
    metricName: 'Total Operating Expenses',
    domain: 'finance',
    formula: 'SUM(expenses)',
    aggregationMethod: 'SUM',
    requiredFields: ['expenses'],
    isPositiveGood: false,
    format: 'currency',
    category: 'P&L Statement',
    compute: (data, matched, dateCol) => {
      const col = matched['expenses'];
      const val = computeSum(data, col);
      const sparkline = computeSparkline(data, col, dateCol);
      return {
        value: val,
        provenance: `Sum of corporate expenses from "${col}"`,
        sparkline,
      };
    },
  },
  {
    metricId: 'fin_net_profit',
    metricName: 'Net Profit',
    domain: 'finance',
    formula: 'SUM(profit) OR (Income - Expenses)',
    aggregationMethod: 'SUM',
    requiredFields: ['profit'], // Alternatively fallback to income - expenses if both present
    isPositiveGood: true,
    format: 'currency',
    category: 'Profitability',
    compute: (data, matched, dateCol) => {
      const col = matched['profit'];
      const val = computeSum(data, col);
      const sparkline = computeSparkline(data, col, dateCol);
      return {
        value: val,
        provenance: `Net profit ledger entries aggregated from "${col}"`,
        sparkline,
      };
    },
  },
  {
    metricId: 'fin_profit_margin',
    metricName: 'Corporate Profit Margin',
    domain: 'finance',
    formula: '(Net_Profit / Income) * 100',
    aggregationMethod: 'PERCENTAGE',
    requiredFields: ['profit', 'income'],
    isPositiveGood: true,
    format: 'percentage',
    category: 'Profitability',
    compute: (data, matched) => {
      const pCol = matched['profit'];
      const iCol = matched['income'];
      const p = computeSum(data, pCol);
      const i = computeSum(data, iCol);
      const val = computePercentage(p, i);
      return {
        value: val,
        provenance: `Net profit (${p}) / Total income (${i}) * 100`,
      };
    },
  },

  // =========================================================================
  // 4. HUMAN RESOURCES (HR) DOMAIN METRICS
  // =========================================================================
  {
    metricId: 'hr_employees',
    metricName: 'Total Headcount (Employees)',
    domain: 'hr',
    formula: 'DISTINCT_COUNT(employee_id)',
    aggregationMethod: 'DISTINCT_COUNT',
    requiredFields: ['employee'],
    isPositiveGood: true,
    format: 'compact',
    category: 'Workforce Sizing',
    compute: (data, matched) => {
      const col = matched['employee'];
      const val = computeUniqueCount(data, col);
      return {
        value: val,
        provenance: `Distinct active employee identifiers in "${col}"`,
      };
    },
  },
  {
    metricId: 'hr_avg_salary',
    metricName: 'Average Salary',
    domain: 'hr',
    formula: 'AVERAGE(salary)',
    aggregationMethod: 'AVERAGE',
    requiredFields: ['salary'],
    isPositiveGood: true,
    format: 'currency',
    category: 'Compensation',
    compute: (data, matched) => {
      const col = matched['salary'];
      const val = computeAverage(data, col);
      return {
        value: val,
        provenance: `Arithmetic mean of compensation column "${col}"`,
      };
    },
  },
  {
    metricId: 'hr_dept_dist',
    metricName: 'Department Count',
    domain: 'hr',
    formula: 'DISTINCT_COUNT(department)',
    aggregationMethod: 'DISTINCT_COUNT',
    requiredFields: ['department'],
    isPositiveGood: true,
    format: 'compact',
    category: 'Organizational Structure',
    compute: (data, matched) => {
      const col = matched['department'];
      const val = computeUniqueCount(data, col);
      return {
        value: val,
        provenance: `Number of unique organizational departments in "${col}"`,
      };
    },
  },
  {
    metricId: 'hr_turnover_rate',
    metricName: 'Turnover Rate',
    domain: 'hr',
    formula: 'AVERAGE(turnover_rate) OR (Terminations / Headcount * 100)',
    aggregationMethod: 'PERCENTAGE',
    requiredFields: ['turnover'],
    isPositiveGood: false, // Lower turnover is better
    format: 'percentage',
    category: 'Workforce Retention',
    compute: (data, matched) => {
      const col = matched['turnover'];
      const val = computeAverage(data, col);
      return {
        value: val,
        provenance: `Average turnover rate derived from "${col}"`,
      };
    },
  },

  // =========================================================================
  // 5. GENERAL & STATISTICAL METRICS (Universal Fallbacks)
  // =========================================================================
  {
    metricId: 'gen_median',
    metricName: 'Median Primary Metric',
    domain: 'general',
    formula: 'MEDIAN(primary_metric)',
    aggregationMethod: 'MEDIAN',
    requiredFields: ['revenue'],
    isPositiveGood: true,
    format: 'currency',
    category: 'Statistical Distribution',
    compute: (data, matched) => {
      const col = matched['revenue'];
      const val = computeMedian(data, col);
      return {
        value: val,
        provenance: `Statistical 50th percentile (median) of "${col}"`,
      };
    },
  },
  {
    metricId: 'gen_min_max',
    metricName: 'Metric Range (Min - Max)',
    domain: 'general',
    formula: 'MAX(primary_metric) - MIN(primary_metric)',
    aggregationMethod: 'MAX',
    requiredFields: ['revenue'],
    isPositiveGood: true,
    format: 'currency',
    category: 'Statistical Dispersion',
    compute: (data, matched) => {
      const col = matched['revenue'];
      const minVal = computeMin(data, col);
      const maxVal = computeMax(data, col);
      return {
        value: maxVal - minVal,
        provenance: `Dispersion range from minimum (${minVal}) to maximum (${maxVal}) in "${col}"`,
      };
    },
  },
];

/**
 * Builds the complete Dynamic KPI Registry for any active dataset.
 * Evaluates field requirements, performs safe calculations with zero-division guards,
 * and tracks provenance and availability status.
 */
export const buildDynamicKPIRegistry = (
  dataset: Dataset,
  filteredRows?: Record<string, any>[]
): DynamicKPIRegistry => {
  const data = filteredRows !== undefined ? filteredRows : dataset.data;
  const domain = dataset.detectedDomain?.domain || 'general';
  const dateCol = findMatchingColumn(dataset, 'date');

  const registryMetrics: RegistryMetricDefinition[] = [];

  for (const template of METRIC_REGISTRY_TEMPLATES) {
    // 1. Resolve required fields to actual dataset columns
    const matchedCols: Record<string, string> = {};
    const missingFields: string[] = [];

    for (const req of template.requiredFields) {
      const matched = findMatchingColumn(dataset, req);
      if (matched) {
        matchedCols[req] = matched;
      } else {
        missingFields.push(req);
      }
    }

    // 2. Check availability
    if (missingFields.length > 0) {
      registryMetrics.push({
        metricId: template.metricId,
        metricName: template.metricName,
        domain: template.domain,
        formula: template.formula,
        requiredColumns: template.requiredFields,
        matchedColumns: matchedCols,
        aggregationMethod: template.aggregationMethod,
        calculatedValue: null,
        formattedValue: 'N/A',
        dataProvenance: `Unavailable: Missing required semantic field(s) [${missingFields.join(', ')}].`,
        confidence: 0.0,
        availabilityStatus: 'unavailable',
        unavailabilityReason: `Requires field(s) "${missingFields.join(', ')}" which could not be mapped from dataset columns.`,
        isPositiveGood: template.isPositiveGood,
        category: template.category,
      });
      continue;
    }

    // 3. Compute metric safely
    if (!data || data.length === 0) {
      registryMetrics.push({
        metricId: template.metricId,
        metricName: template.metricName,
        domain: template.domain,
        formula: template.formula,
        requiredColumns: template.requiredFields,
        matchedColumns: matchedCols,
        aggregationMethod: template.aggregationMethod,
        calculatedValue: 0,
        formattedValue: '0',
        dataProvenance: `Active dataset has 0 records.`,
        confidence: 0.5,
        availabilityStatus: 'insufficient_data',
        unavailabilityReason: 'Dataset contains no records to compute metric.',
        isPositiveGood: template.isPositiveGood,
        category: template.category,
      });
      continue;
    }

    try {
      const result = template.compute(data, matchedCols, dateCol);
      const calcVal = result.value !== null ? Number(result.value) : 0;
      const formatted = formatMetricValue(calcVal, template.format);

      registryMetrics.push({
        metricId: template.metricId,
        metricName: template.metricName,
        domain: template.domain,
        formula: template.formula,
        requiredColumns: template.requiredFields,
        matchedColumns: matchedCols,
        aggregationMethod: template.aggregationMethod,
        calculatedValue: calcVal,
        formattedValue: formatted,
        dataProvenance: result.provenance,
        comparisonPeriod: result.comparison,
        confidence: 0.95,
        availabilityStatus: 'available',
        isPositiveGood: template.isPositiveGood,
        sparklineData: result.sparkline,
        category: template.category,
      });
    } catch (err: any) {
      registryMetrics.push({
        metricId: template.metricId,
        metricName: template.metricName,
        domain: template.domain,
        formula: template.formula,
        requiredColumns: template.requiredFields,
        matchedColumns: matchedCols,
        aggregationMethod: template.aggregationMethod,
        calculatedValue: null,
        formattedValue: 'Error',
        dataProvenance: `Calculation error: ${err.message}`,
        confidence: 0.0,
        availabilityStatus: 'unavailable',
        unavailabilityReason: `Encountered error during calculation: ${err.message}`,
        isPositiveGood: template.isPositiveGood,
        category: template.category,
      });
    }
  }

  // Filter available metrics
  const availableMetrics = registryMetrics.filter((m) => m.availabilityStatus === 'available');

  // Select top 4 to 6 active KPIs aligned with dataset domain
  const domainSpecific = availableMetrics.filter((m) => m.domain === domain);
  const generalAvailable = availableMetrics.filter((m) => m.domain !== domain);
  const activeKPIs = [...domainSpecific, ...generalAvailable].slice(0, 6);

  return {
    datasetId: dataset.id,
    domain,
    totalMetricsCount: registryMetrics.length,
    availableMetricsCount: availableMetrics.length,
    metrics: registryMetrics,
    activeKPIs,
  };
};

/**
 * Converts active registry KPIs into standard KPIDefinition objects for the UI cards.
 */
export const registryKPIsToDefinitions = (
  registryMetrics: RegistryMetricDefinition[]
): KPIDefinition[] => {
  return registryMetrics.map((rm) => {
    let aggType: KPIDefinition['aggregation'] = 'sum';
    switch (rm.aggregationMethod) {
      case 'AVERAGE': aggType = 'avg'; break;
      case 'COUNT': aggType = 'count'; break;
      case 'DISTINCT_COUNT': aggType = 'unique_count'; break;
      case 'MIN': aggType = 'min'; break;
      case 'MAX': aggType = 'max'; break;
      case 'MEDIAN': aggType = 'median'; break;
      case 'GROWTH': aggType = 'growth_mom'; break;
      default: aggType = 'sum';
    }

    return {
      id: rm.metricId,
      label: rm.metricName,
      description: rm.dataProvenance,
      columnName: Object.values(rm.matchedColumns)[0] || '',
      aggregation: aggType,
      format: rm.formattedValue.includes('$')
        ? 'currency'
        : rm.formattedValue.includes('%')
        ? 'percentage'
        : 'number',
      value: rm.calculatedValue || 0,
      previousValue: rm.comparisonPeriod?.previousValue,
      changePercentage: rm.comparisonPeriod?.changePercentage,
      trend: rm.comparisonPeriod?.trend || 'neutral',
      isPositiveGood: rm.isPositiveGood,
      sparklineData: rm.sparklineData,
      category: rm.category,
      metricId: rm.metricId,
      formula: rm.formula,
      dataProvenance: rm.dataProvenance,
      availabilityStatus: rm.availabilityStatus,
    };
  });
};
