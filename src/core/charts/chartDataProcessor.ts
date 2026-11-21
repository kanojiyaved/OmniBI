import { ChartSpecification } from '../../types';

export interface ProcessedChartData {
  chartData: Record<string, any>[];
  seriesKeys: string[];
}

/**
 * Aggregates raw tabular rows into formatted data arrays ready for Recharts visualization.
 */
export const processChartData = (
  rawData: Record<string, any>[],
  spec: ChartSpecification
): ProcessedChartData => {
  if (!rawData || rawData.length === 0) {
    return { chartData: [], seriesKeys: [] };
  }

  const { xAxisColumn, yAxisColumns, chartType, aggregation = 'sum' } = spec;
  const primaryY = yAxisColumns[0] || '';

  // 1. Scatter Plot (Point-by-point values, no group-by)
  if (chartType === 'scatter') {
    const points: Record<string, any>[] = [];
    const secondaryY = yAxisColumns[1] || '';

    for (const row of rawData.slice(0, 150)) {
      const xVal = Number(String(row[xAxisColumn]).replace(/[$€£¥,%\s]/g, ''));
      const yVal = Number(String(row[primaryY || secondaryY]).replace(/[$€£¥,%\s]/g, ''));

      if (!isNaN(xVal) && !isNaN(yVal)) {
        points.push({
          x: xVal,
          y: yVal,
          name: row.id || row.name || `Point ${points.length + 1}`,
        });
      }
    }

    return { chartData: points, seriesKeys: ['y'] };
  }

  // 2. Multi-Metric Group-By (Multi-line or Multi-bar charts)
  if (yAxisColumns.length > 1) {
    const multiGroups: Record<string, Record<string, { sum: number; count: number }>> = {};

    for (const row of rawData) {
      const rawX = row[xAxisColumn];
      const groupKey = rawX !== null && rawX !== undefined && rawX !== '' ? String(rawX).trim() : 'Unknown';

      if (!multiGroups[groupKey]) {
        multiGroups[groupKey] = {};
        for (const yCol of yAxisColumns) {
          multiGroups[groupKey][yCol] = { sum: 0, count: 0 };
        }
      }

      for (const yCol of yAxisColumns) {
        const yVal = row[yCol];
        if (yVal !== null && yVal !== undefined && yVal !== '') {
          const cleanY = typeof yVal === 'number' ? yVal : Number(String(yVal).replace(/[$€£¥,%\s]/g, ''));
          if (!isNaN(cleanY)) {
            multiGroups[groupKey][yCol].sum += cleanY;
            multiGroups[groupKey][yCol].count++;
          }
        }
      }
    }

    let aggregatedRows = Object.entries(multiGroups).map(([groupKey, metrics]) => {
      const rowObj: Record<string, any> = { [xAxisColumn]: groupKey };
      for (const [yCol, stats] of Object.entries(metrics)) {
        rowObj[yCol] = aggregation === 'avg' && stats.count > 0 
          ? Number((stats.sum / stats.count).toFixed(2)) 
          : Number(stats.sum.toFixed(2));
      }
      return rowObj;
    });

    if (/date|time|created|updated|period|month|year/i.test(xAxisColumn)) {
      aggregatedRows.sort((a, b) => (Date.parse(String(a[xAxisColumn])) || 0) - (Date.parse(String(b[xAxisColumn])) || 0));
    }

    return {
      chartData: aggregatedRows,
      seriesKeys: yAxisColumns,
    };
  }

  // 3. Single Metric Group-By Aggregation (Area, Line, Bar, Horizontal Bar, Donut)
  const groups: Record<string, { sum: number; count: number; rawKey: string }> = {};

  for (const row of rawData) {
    const rawX = row[xAxisColumn];
    const groupKey = rawX !== null && rawX !== undefined && rawX !== '' ? String(rawX).trim() : 'Unknown';

    if (!groups[groupKey]) {
      groups[groupKey] = { sum: 0, count: 0, rawKey: groupKey };
    }

    const yVal = row[primaryY];
    if (yVal !== null && yVal !== undefined && yVal !== '') {
      const cleanY = typeof yVal === 'number' ? yVal : Number(String(yVal).replace(/[$€£¥,%\s]/g, ''));
      if (!isNaN(cleanY)) {
        groups[groupKey].sum += cleanY;
        groups[groupKey].count++;
      }
    } else {
      // If no primary Y or null, count rows
      groups[groupKey].sum += 1;
      groups[groupKey].count++;
    }
  }

  // Build rows
  let aggregatedRows = Object.entries(groups).map(([groupKey, stats]) => {
    const computedVal = aggregation === 'avg' && stats.count > 0 
      ? Number((stats.sum / stats.count).toFixed(2)) 
      : Number(stats.sum.toFixed(2));

    return {
      [xAxisColumn]: groupKey,
      [primaryY || 'value']: computedVal,
    };
  });

  // Sort rows logically
  const isDateColumn = /date|time|created|updated|period|month|year/i.test(xAxisColumn);

  if (isDateColumn) {
    // Sort chronologically for temporal charts
    aggregatedRows.sort((a, b) => {
      const tA = Date.parse(String(a[xAxisColumn])) || 0;
      const tB = Date.parse(String(b[xAxisColumn])) || 0;
      return tA - tB;
    });
  } else {
    // Sort by value descending for categories
    const valueKey = primaryY || 'value';
    aggregatedRows.sort((a, b) => (Number(b[valueKey]) || 0) - (Number(a[valueKey]) || 0));

    // For Donut or Bar, take top 8 items and group the rest as "Other" if there are many
    if (aggregatedRows.length > 8 && (chartType === 'donut' || chartType === 'bar' || chartType === 'horizontal_bar')) {
      const topItems = aggregatedRows.slice(0, 7);
      const otherItems = aggregatedRows.slice(7);
      const otherSum = otherItems.reduce((acc, item) => acc + (Number(item[valueKey]) || 0), 0);

      topItems.push({
        [xAxisColumn]: 'Other',
        [valueKey]: Number(otherSum.toFixed(2)),
      });
      aggregatedRows = topItems;
    }
  }

  return {
    chartData: aggregatedRows,
    seriesKeys: [primaryY || 'value'],
  };
};
