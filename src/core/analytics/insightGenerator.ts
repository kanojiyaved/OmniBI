import { Dataset } from '../../types';
import { computeSum } from '../metrics/metricEngine';
import { formatMetricValue } from '../metrics/kpiGenerator';

export interface DataInsightItem {
  id: string;
  type: 'trend' | 'concentration' | 'anomaly' | 'performance' | 'recommendation';
  title: string;
  description: string;
  severity: 'positive' | 'neutral' | 'warning' | 'purple';
  metricHighlight?: string;
}

/**
 * Automatically extracts deterministic, executive business insights
 * from active dataset records and statistical profiles.
 */
export const generateDatasetInsights = (dataset: Dataset): DataInsightItem[] => {
  const { data, columns, profiles = {}, quality, detectedDomain, semanticMappings = {} } = dataset;
  if (!data || data.length === 0) return [];

  const insights: DataInsightItem[] = [];
  const domain = detectedDomain?.domain || 'general';

  // 1. Identify primary metric & primary category
  const primaryMetricCol = columns.find(
    (c) => semanticMappings[c]?.role === 'primary_metric' || profiles[c]?.semanticRole === 'primary_metric'
  ) || columns.find((c) => ['numeric', 'currency'].includes(profiles[c]?.inferredType));

  const categoryCol = columns.find(
    (c) => semanticMappings[c]?.role === 'category' || profiles[c]?.semanticRole === 'category'
  ) || columns.find((c) => profiles[c]?.inferredType === 'categorical');

  const timestampCol = columns.find(
    (c) => semanticMappings[c]?.role === 'timestamp' || profiles[c]?.inferredType === 'date'
  );

  // 1. Top Category Concentration Insight
  if (primaryMetricCol && categoryCol) {
    const groupSums: Record<string, number> = {};
    let totalSum = 0;

    for (const row of data) {
      const cat = String(row[categoryCol] || 'Other').trim();
      const num = Number(String(row[primaryMetricCol]).replace(/[$€£¥,%\s]/g, '')) || 0;
      groupSums[cat] = (groupSums[cat] || 0) + num;
      totalSum += num;
    }

    const sortedCats = Object.entries(groupSums).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0 && totalSum > 0) {
      const [topCat, topVal] = sortedCats[0];
      const sharePct = Number(((topVal / totalSum) * 100).toFixed(1));

      insights.push({
        id: 'insight-concentration',
        type: 'concentration',
        title: `Dominant ${categoryCol.replace(/_/g, ' ').toUpperCase()} Share`,
        description: `"${topCat}" represents the highest volume driver, accounting for ${sharePct}% (${formatMetricValue(topVal, 'currency')}) of all aggregated ${primaryMetricCol}.`,
        severity: sharePct > 50 ? 'purple' : 'positive',
        metricHighlight: `${sharePct}% Share`,
      });
    }
  }

  // 2. Data Health & Anomaly Warning
  if (quality) {
    const outliersCount = (quality as any).outliersCount ?? quality.anomaliesDetected?.filter(a => a.type === 'outliers').length ?? 0;
    const score = quality.overallScore ?? (quality as any).healthScore ?? 100;
    
    if (outliersCount > 0) {
      insights.push({
        id: 'insight-anomaly',
        type: 'anomaly',
        title: 'Statistical Outliers Detected',
        description: `Found ${outliersCount.toLocaleString()} outlier values using Tukey's IQR rule. Consider inspecting these in Data Profiling to verify data entry accuracy.`,
        severity: outliersCount > 10 ? 'warning' : 'neutral',
        metricHighlight: `${outliersCount} Outliers`,
      });
    }

    if (score >= 80) {
      insights.push({
        id: 'insight-quality-high',
        type: 'performance',
        title: 'Enterprise Data Integrity',
        description: `Schema achieves an exceptional data quality score of ${score}/100 with only ${quality.missingCellsCount || 0} missing values across ${data.length.toLocaleString()} rows.`,
        severity: 'positive',
        metricHighlight: `${score}/100 Health`,
      });
    }
  }

  // 3. Temporal Momentum
  if (primaryMetricCol && timestampCol && data.length >= 2) {
    const totalSum = computeSum(data, primaryMetricCol);
    const avgVal = totalSum / data.length;

    insights.push({
      id: 'insight-unit-economics',
      type: 'trend',
      title: 'Unit Economic Baseline',
      description: `Mean transactional volume across the dataset is ${formatMetricValue(avgVal, 'currency')} per row across ${data.length.toLocaleString()} events.`,
      severity: 'positive',
      metricHighlight: formatMetricValue(avgVal, 'currency'),
    });
  }

  // 4. Domain-Specific Strategic Recommendations
  const domainRecommendations: Record<string, string> = {
    sales: 'Focus pipeline acceleration on high-velocity stages to reduce cycle time.',
    marketing: 'Reallocate budget from underperforming ad channels toward top-CTR campaigns.',
    finance: 'Monitor operating expense variance to maintain target EBITDA margins.',
    hr: 'Address retention within departments showing higher-than-average attrition.',
    ecommerce: 'Optimize product bundling for top-selling SKUs to increase Average Order Value.',
    general: 'Leverage cross-filtering on top dimensions to reveal hidden micro-segments.',
  };

  insights.push({
    id: 'insight-strategic',
    type: 'recommendation',
    title: 'Executive Strategic Opportunity',
    description: domainRecommendations[domain] || domainRecommendations.general,
    severity: 'purple',
  });

  return insights;
};
