import { Dataset, ChartSpecification } from '../../types';

const formatTitle = (col: string): string =>
  col
    .replace(/[_\-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

/**
 * Automatically inspects dataset semantic roles, cardinality, and data types to
 * recommend an optimal suite of 3 to 5 executive business charts.
 */
export const recommendChartsForDataset = (dataset: Dataset): ChartSpecification[] => {
  const columns = dataset.columns;
  if (!columns || columns.length === 0) return [];

  const mappings = dataset.semanticMappings || {};
  const profiles = dataset.profiles || {};

  const primaryMetricCols: string[] = [];
  const secondaryMetricCols: string[] = [];
  const categoryCols: string[] = [];
  let timestampCol: string | undefined;
  let statusCol: string | undefined;
  let geoCol: string | undefined;

  for (const col of columns) {
    const role = mappings[col]?.role || profiles[col]?.semanticRole;
    if (role === 'primary_metric') primaryMetricCols.push(col);
    else if (role === 'secondary_metric') secondaryMetricCols.push(col);
    else if (role === 'category' || role === 'dimension') categoryCols.push(col);
    else if (role === 'timestamp' && !timestampCol) timestampCol = col;
    else if (role === 'status' && !statusCol) statusCol = col;
    else if (role === 'geo' && !geoCol) geoCol = col;
  }

  // Fallbacks if roles not explicitly assigned
  if (primaryMetricCols.length === 0) {
    for (const col of columns) {
      if (['numeric', 'currency'].includes(profiles[col]?.inferredType)) {
        primaryMetricCols.push(col);
      }
    }
  }

  if (categoryCols.length === 0) {
    for (const col of columns) {
      if (profiles[col]?.inferredType === 'categorical' || profiles[col]?.inferredType === 'text') {
        categoryCols.push(col);
      }
    }
  }

  const primaryY = primaryMetricCols[0] || secondaryMetricCols[0] || '';
  const secondaryY = primaryMetricCols[1] || secondaryMetricCols[0] || '';
  const charts: ChartSpecification[] = [];

  // 1. Multiple metrics over time = Multi-line chart
  if (timestampCol && primaryMetricCols.length >= 1 && secondaryY && secondaryY !== primaryY) {
    charts.push({
      id: `chart-multiline-${timestampCol}`,
      title: `${formatTitle(primaryY)} & ${formatTitle(secondaryY)} Over Time`,
      subtitle: `Comparative multi-metric tracking by ${formatTitle(timestampCol)}`,
      chartType: 'line',
      xAxisColumn: timestampCol,
      yAxisColumns: [primaryY, secondaryY],
      aggregation: 'sum',
      colorScheme: ['#7c3aed', '#06b6d4', '#f59e0b'],
      isSmooth: true,
      showLegend: true,
      importance: 'primary',
      description: `Synchronized multi-line comparison between ${formatTitle(primaryY)} and ${formatTitle(secondaryY)}.`,
    });
  } 
  // 2. Date + Revenue = Line / Area chart
  else if (timestampCol && primaryY) {
    charts.push({
      id: `chart-trend-${timestampCol}-${primaryY}`,
      title: `${formatTitle(primaryY)} Trajectory Over Time`,
      subtitle: `Chronological aggregation of ${formatTitle(primaryY)} by ${formatTitle(timestampCol)}`,
      chartType: 'line',
      xAxisColumn: timestampCol,
      yAxisColumns: [primaryY],
      aggregation: 'sum',
      colorScheme: ['#7c3aed', '#6366f1'],
      isSmooth: true,
      showLegend: false,
      importance: 'primary',
      description: 'Historical performance progression over sequential date intervals.',
    });
  }

  // 3. Category + Revenue = Bar chart
  if (categoryCols.length > 0 && primaryY) {
    const mainCat = categoryCols[0];
    charts.push({
      id: `chart-cat-${mainCat}-${primaryY}`,
      title: `${formatTitle(primaryY)} by ${formatTitle(mainCat)}`,
      subtitle: `Distribution share across top ${formatTitle(mainCat)} categories`,
      chartType: 'bar',
      xAxisColumn: mainCat,
      yAxisColumns: [primaryY],
      aggregation: 'sum',
      colorScheme: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      showLegend: false,
      importance: 'secondary',
      description: `Comparative breakdown highlighting highest grossing ${formatTitle(mainCat)} segments.`,
    });
  }

  // 4. Status + Count = Donut chart
  if (statusCol) {
    charts.push({
      id: `chart-status-${statusCol}`,
      title: `Workflow Volume by ${formatTitle(statusCol)}`,
      subtitle: `Distribution share across ${formatTitle(statusCol)} states`,
      chartType: 'donut',
      xAxisColumn: statusCol,
      yAxisColumns: [primaryY || 'count'],
      aggregation: 'count',
      colorScheme: ['#10b981', '#f59e0b', '#ec4899', '#6366f1', '#64748b'],
      showLegend: true,
      importance: 'secondary',
      description: `Proportional volume distribution across discrete ${formatTitle(statusCol)} lifecycle stages.`,
    });
  }

  // 5. Two numerical columns = Scatter plot
  if (primaryMetricCols.length >= 2 || (primaryMetricCols.length >= 1 && secondaryMetricCols.length >= 1)) {
    const metricA = primaryMetricCols[0];
    const metricB = primaryMetricCols[1] || secondaryMetricCols[0];

    if (metricA !== metricB && charts.length < 4) {
      charts.push({
        id: `chart-scatter-${metricA}-${metricB}`,
        title: `${formatTitle(metricA)} vs. ${formatTitle(metricB)} Correlation`,
        subtitle: `Bivariate dispersion and correlation analysis`,
        chartType: 'scatter',
        xAxisColumn: metricA,
        yAxisColumns: [metricB],
        colorScheme: ['#a855f7'],
        showLegend: false,
        importance: 'supplementary',
        description: `Evaluation of covariance and outlier density between ${formatTitle(metricA)} and ${formatTitle(metricB)}.`,
      });
    }
  }

  // Fallback: If no charts were generated, generate a simple bar chart of first column
  if (charts.length === 0 && columns.length >= 2) {
    charts.push({
      id: 'chart-fallback-bar',
      title: `${formatTitle(columns[1])} Distribution by ${formatTitle(columns[0])}`,
      chartType: 'bar',
      xAxisColumn: columns[0],
      yAxisColumns: [columns[1]],
      aggregation: 'sum',
      colorScheme: ['#7c3aed'],
      importance: 'primary',
    });
  }

  return charts.slice(0, 4);
};
