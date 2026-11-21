import { Dataset, KPIDefinition } from '../../types';
import { 
  computeSum, 
  computeAverage, 
  computeUniqueCount, 
  computeMoMGrowth, 
  computeSparkline 
} from './metricEngine';
import { buildDynamicKPIRegistry, registryKPIsToDefinitions } from './kpiRegistry';

/**
 * Formats numeric metrics cleanly for enterprise executive presentation.
 */
export const formatMetricValue = (
  val: number,
  format: 'currency' | 'number' | 'percentage' | 'compact' = 'number'
): string => {
  if (val === null || val === undefined || isNaN(val)) return '0';

  if (format === 'percentage') {
    return `${val.toFixed(1)}%`;
  }

  if (format === 'currency') {
    if (Math.abs(val) >= 1_000_000_000) {
      return `$${(val / 1_000_000_000).toFixed(2)}B`;
    }
    if (Math.abs(val) >= 1_000_000) {
      return `$${(val / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(val) >= 1_000) {
      return `$${(val / 1_000).toFixed(1)}K`;
    }
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (format === 'compact') {
    if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return val.toLocaleString();
  }

  return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatColumnTitle = (col: string): string =>
  col
    .replace(/[_\-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

/**
 * Automatically inspects dataset semantic roles and computes 4 to 6 top executive KPIs.
 * Can compute against full dataset or filtered rows.
 */
export const generateDynamicKPIs = (
  dataset: Dataset,
  filteredRows?: Record<string, any>[]
): KPIDefinition[] => {
  const data = filteredRows !== undefined ? filteredRows : dataset.data;
  if (!data || data.length === 0) return [];

  // 1. First consult Dynamic KPI Registry
  const registry = buildDynamicKPIRegistry(dataset, filteredRows);
  if (registry.activeKPIs.length >= 3) {
    return registryKPIsToDefinitions(registry.activeKPIs);
  }

  const columns = dataset.columns;
  const mappings = dataset.semanticMappings || {};
  const profiles = dataset.profiles || {};

  // Find designated roles
  const primaryMetricCols: string[] = [];
  const secondaryMetricCols: string[] = [];
  const entityIdCols: string[] = [];
  let timestampCol: string | undefined;

  for (const col of columns) {
    const role = mappings[col]?.role || profiles[col]?.semanticRole;
    if (role === 'primary_metric') primaryMetricCols.push(col);
    else if (role === 'secondary_metric') secondaryMetricCols.push(col);
    else if (role === 'entity_id') entityIdCols.push(col);
    else if (role === 'timestamp' && !timestampCol) timestampCol = col;
  }

  // Fallback: If no primary metric identified, find any numeric column
  if (primaryMetricCols.length === 0) {
    for (const col of columns) {
      if (['numeric', 'currency'].includes(profiles[col]?.inferredType)) {
        primaryMetricCols.push(col);
        break;
      }
    }
  }

  const kpis: KPIDefinition[] = [];

  // Helper to determine whether higher is better
  const isPositiveMetric = (name: string): boolean => {
    return !/churn|cost|spend|expense|loss|tax|fee|attrition|turnover|mortality|backorder|lead_time|wait_time/i.test(name);
  };

  // Helper to detect format
  const inferFormat = (col: string): 'currency' | 'number' | 'percentage' => {
    const type = profiles[col]?.inferredType;
    if (type === 'currency' || /revenue|sales|profit|amount|price|cost|spend|val/i.test(col)) {
      return 'currency';
    }
    if (type === 'percentage' || /rate|ratio|pct|percent|growth/i.test(col)) {
      return 'percentage';
    }
    return 'number';
  };

  // 1. Primary Metrics - Total Aggregation (SUM)
  for (const mainCol of primaryMetricCols) {
    const sumVal = computeSum(data, mainCol);
    const growth = computeMoMGrowth(data, mainCol, timestampCol);
    const sparkline = computeSparkline(data, mainCol, timestampCol);
    const format = inferFormat(mainCol);

    kpis.push({
      id: `kpi-sum-${mainCol}`,
      label: `Total ${formatColumnTitle(mainCol)}`,
      description: `Cumulative sum of ${mainCol} across ${data.length.toLocaleString()} records`,
      columnName: mainCol,
      aggregation: 'sum',
      format,
      value: sumVal,
      previousValue: growth.previousPeriod,
      changePercentage: growth.growthPct,
      trend: growth.trend,
      isPositiveGood: isPositiveMetric(mainCol),
      sparklineData: sparkline,
      category: 'Primary Financial / Volume',
    });
  }

  // 2. Primary Metric - Average Aggregation (AVG)
  if (primaryMetricCols.length > 0) {
    const mainCol = primaryMetricCols[0];
    const avgVal = computeAverage(data, mainCol);
    const format = inferFormat(mainCol);

    kpis.push({
      id: `kpi-avg-${mainCol}`,
      label: `Average ${formatColumnTitle(mainCol)}`,
      description: `Mean ${mainCol} per record or transaction`,
      columnName: mainCol,
      aggregation: 'avg',
      format,
      value: avgVal,
      trend: 'neutral',
      isPositiveGood: isPositiveMetric(mainCol),
      category: 'Unit Economics',
    });
  }

  // 3. Unique Entity Count (e.g. Unique Customers, Accounts, Users)
  if (entityIdCols.length > 0) {
    const entityCol = entityIdCols[0];
    const uniqueCount = computeUniqueCount(data, entityCol);

    kpis.push({
      id: `kpi-unique-${entityCol}`,
      label: `Distinct ${formatColumnTitle(entityCol).replace(/\bId\b/i, '').trim() || 'Entities'}`,
      description: `Unique count of distinct identifiers in ${entityCol}`,
      columnName: entityCol,
      aggregation: 'unique_count',
      format: 'compact',
      value: uniqueCount,
      trend: 'neutral',
      isPositiveGood: true,
      category: 'Audience & Cohort',
    });
  }

  // 4. Secondary Metric (e.g. Total Units, Discount, Quantity)
  if (secondaryMetricCols.length > 0) {
    const secCol = secondaryMetricCols[0];
    const sumSec = computeSum(data, secCol);
    const format = inferFormat(secCol);
    const growth = computeMoMGrowth(data, secCol, timestampCol);
    const sparkline = computeSparkline(data, secCol, timestampCol);

    kpis.push({
      id: `kpi-sec-${secCol}`,
      label: `Total ${formatColumnTitle(secCol)}`,
      description: `Cumulative aggregation of secondary measure ${secCol}`,
      columnName: secCol,
      aggregation: 'sum',
      format,
      value: sumSec,
      previousValue: growth.previousPeriod,
      changePercentage: growth.growthPct,
      trend: growth.trend,
      isPositiveGood: isPositiveMetric(secCol),
      sparklineData: sparkline,
      category: 'Operational Metric',
    });
  }

  // 5. Total Activity Volume (COUNT)
  kpis.push({
    id: 'kpi-total-volume',
    label: 'Total Record Volume',
    description: `Total parsed transactions and rows in dataset`,
    aggregation: 'count',
    format: 'compact',
    value: data.length,
    trend: 'neutral',
    isPositiveGood: true,
    category: 'Activity Throughput',
  });

  return kpis.slice(0, 6);
};
