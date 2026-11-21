import { Dataset } from '../../types';
import { formatMetricValue } from '../metrics/kpiGenerator';

export interface TopPerformerItem {
  rank: number;
  name: string;
  metricLabel: string;
  metricValue: number;
  formattedValue: string;
  sharePercentage: number;
}

/**
 * Deterministically computes the top 5 performers (e.g. top customers, products, campaigns, reps)
 * based on primary quantitative metric contributions.
 */
export const computeTopPerformers = (
  dataset: Dataset,
  limit: number = 5
): { entityColumn: string; metricColumn: string; items: TopPerformerItem[] } => {
  const { data, columns, profiles = {}, semanticMappings = {} } = dataset;
  if (!data || data.length === 0) {
    return { entityColumn: 'Entity', metricColumn: 'Value', items: [] };
  }

  // 1. Identify entity/dimension column
  const entityCol = 
    columns.find((c) => semanticMappings[c]?.role === 'entity_id') ||
    columns.find((c) => semanticMappings[c]?.role === 'category') ||
    columns.find((c) => /(?:^|_)(customer|client|company|account|name|rep|sales_rep|product|sku|campaign|department|employee)(?:_|$)/i.test(c)) ||
    columns.find((c) => profiles[c]?.inferredType === 'text') ||
    columns[0];

  // 2. Identify metric column
  const metricCol =
    columns.find((c) => semanticMappings[c]?.role === 'primary_metric') ||
    columns.find((c) => semanticMappings[c]?.role === 'secondary_metric') ||
    columns.find((c) => ['numeric', 'currency'].includes(profiles[c]?.inferredType)) ||
    columns.find((c) => /(?:^|_)(sales|revenue|amount|profit|value|mrr|spend|salary)(?:_|$)/i.test(c));

  const format = metricCol && profiles[metricCol]?.inferredType === 'currency' ? 'currency' : 'compact';

  // 3. Aggregate values by entity
  const entityTotals: Record<string, number> = {};
  let totalMetricSum = 0;

  for (const row of data) {
    const rawEntity = row[entityCol];
    const name = rawEntity !== null && rawEntity !== undefined && String(rawEntity).trim() !== ''
      ? String(rawEntity).trim()
      : 'Unknown';

    let val = 1; // Default to count if no metric column
    if (metricCol) {
      const rawVal = row[metricCol];
      if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
        const clean = typeof rawVal === 'number' ? rawVal : Number(String(rawVal).replace(/[$€£¥,%\s]/g, ''));
        val = !isNaN(clean) ? clean : 0;
      } else {
        val = 0;
      }
    }

    entityTotals[name] = (entityTotals[name] || 0) + val;
    totalMetricSum += val;
  }

  // 4. Sort descending and build TopPerformer items
  const sorted = Object.entries(entityTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const items: TopPerformerItem[] = sorted.map(([name, val], index) => {
    const share = totalMetricSum > 0 ? Number(((val / totalMetricSum) * 100).toFixed(1)) : 0;
    return {
      rank: index + 1,
      name,
      metricLabel: metricCol ? metricCol.replace(/[_\-]/g, ' ').toUpperCase() : 'COUNT',
      metricValue: val,
      formattedValue: formatMetricValue(val, format),
      sharePercentage: share,
    };
  });

  return {
    entityColumn: entityCol,
    metricColumn: metricCol || 'Count',
    items,
  };
};
