import { AggregationType } from '../../types';

/**
 * Computes pure mathematical and statistical aggregations across tabular records.
 */
export const computeSum = (data: Record<string, any>[], column: string): number => {
  let sum = 0;
  for (const row of data) {
    const val = row[column];
    if (val !== null && val !== undefined && val !== '') {
      const clean = typeof val === 'number' ? val : Number(String(val).replace(/[$€£¥,%\s]/g, ''));
      if (!isNaN(clean)) {
        sum += clean;
      }
    }
  }
  return Number(sum.toFixed(2));
};

export const computeAverage = (data: Record<string, any>[], column: string): number => {
  let sum = 0;
  let count = 0;
  for (const row of data) {
    const val = row[column];
    if (val !== null && val !== undefined && val !== '') {
      const clean = typeof val === 'number' ? val : Number(String(val).replace(/[$€£¥,%\s]/g, ''));
      if (!isNaN(clean)) {
        sum += clean;
        count++;
      }
    }
  }
  return count > 0 ? Number((sum / count).toFixed(2)) : 0;
};

export const computeCount = (data: Record<string, any>[]): number => {
  return data.length;
};

export const computeUniqueCount = (data: Record<string, any>[], column: string): number => {
  const uniqueSet = new Set<string>();
  for (const row of data) {
    const val = row[column];
    if (val !== null && val !== undefined && val !== '') {
      uniqueSet.add(String(val));
    }
  }
  return uniqueSet.size;
};

export const computeMin = (data: Record<string, any>[], column: string): number => {
  let min: number | null = null;
  for (const row of data) {
    const val = row[column];
    if (val !== null && val !== undefined && val !== '') {
      const clean = typeof val === 'number' ? val : Number(String(val).replace(/[$€£¥,%\s]/g, ''));
      if (!isNaN(clean)) {
        if (min === null || clean < min) min = clean;
      }
    }
  }
  return min !== null ? Number(min.toFixed(2)) : 0;
};

export const computeMax = (data: Record<string, any>[], column: string): number => {
  let max: number | null = null;
  for (const row of data) {
    const val = row[column];
    if (val !== null && val !== undefined && val !== '') {
      const clean = typeof val === 'number' ? val : Number(String(val).replace(/[$€£¥,%\s]/g, ''));
      if (!isNaN(clean)) {
        if (max === null || clean > max) max = clean;
      }
    }
  }
  return max !== null ? Number(max.toFixed(2)) : 0;
};

/**
 * Computes the statistical median of a numeric column.
 */
export const computeMedian = (data: Record<string, any>[], column: string): number => {
  const values: number[] = [];
  for (const row of data) {
    const val = row[column];
    if (val !== null && val !== undefined && val !== '') {
      const clean = typeof val === 'number' ? val : Number(String(val).replace(/[$€£¥,%\s]/g, ''));
      if (!isNaN(clean)) {
        values.push(clean);
      }
    }
  }

  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  if (values.length % 2 !== 0) {
    return Number(values[mid].toFixed(2));
  }
  return Number(((values[mid - 1] + values[mid]) / 2).toFixed(2));
};

/**
 * Safely computes ratio (numerator / denominator) with division-by-zero protection.
 */
export const computeRatio = (
  numerator: number | null | undefined,
  denominator: number | null | undefined,
  multiplier: number = 1
): number | null => {
  if (
    numerator === null ||
    numerator === undefined ||
    isNaN(numerator) ||
    denominator === null ||
    denominator === undefined ||
    isNaN(denominator) ||
    denominator === 0
  ) {
    return 0; // Safe default preventing Infinity or NaN
  }
  return Number(((numerator / denominator) * multiplier).toFixed(2));
};

/**
 * Safely computes percentage (part / whole * 100) with division-by-zero protection.
 */
export const computePercentage = (
  part: number | null | undefined,
  whole: number | null | undefined
): number | null => {
  return computeRatio(part, whole, 100);
};

/**
 * Computes period-over-period growth by splitting chronological records.
 */
export const computeMoMGrowth = (
  data: Record<string, any>[],
  metricColumn: string,
  dateColumn?: string
): { currentPeriod: number; previousPeriod: number; growthPct: number; trend: 'up' | 'down' | 'neutral' } => {
  if (data.length < 2) {
    const current = computeSum(data, metricColumn);
    return { currentPeriod: current, previousPeriod: current, growthPct: 0, trend: 'neutral' };
  }

  let sortedData = [...data];
  if (dateColumn) {
    sortedData.sort((a, b) => {
      const tA = Date.parse(String(a[dateColumn])) || 0;
      const tB = Date.parse(String(b[dateColumn])) || 0;
      return tA - tB;
    });
  }

  const mid = Math.floor(sortedData.length / 2);
  const prevSlice = sortedData.slice(0, mid);
  const currSlice = sortedData.slice(mid);

  const prevSum = computeSum(prevSlice, metricColumn);
  const currSum = computeSum(currSlice, metricColumn);

  let growthPct = 0;
  if (prevSum > 0) {
    growthPct = Number((((currSum - prevSum) / prevSum) * 100).toFixed(1));
  } else if (currSum > 0) {
    growthPct = 100;
  }

  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (growthPct > 0.1) trend = 'up';
  else if (growthPct < -0.1) trend = 'down';

  return {
    currentPeriod: currSum,
    previousPeriod: prevSum,
    growthPct,
    trend,
  };
};

/**
 * Computes sparkline trajectory values (5 to 10 points) across a metric time series.
 */
export const computeSparkline = (
  data: Record<string, any>[],
  metricColumn: string,
  dateColumn?: string,
  buckets: number = 7
): number[] => {
  if (data.length === 0) return [0, 0, 0, 0, 0, 0, 0];

  let sortedData = [...data];
  if (dateColumn) {
    sortedData.sort((a, b) => {
      const tA = Date.parse(String(a[dateColumn])) || 0;
      const tB = Date.parse(String(b[dateColumn])) || 0;
      return tA - tB;
    });
  }

  const total = sortedData.length;
  const chunkSize = Math.max(1, Math.floor(total / buckets));
  const points: number[] = [];

  for (let i = 0; i < buckets; i++) {
    const start = i * chunkSize;
    const end = i === buckets - 1 ? total : (i + 1) * chunkSize;
    const slice = sortedData.slice(start, end);
    const sum = computeSum(slice, metricColumn);
    points.push(sum);
  }

  return points;
};

/**
 * Generic aggregation router.
 */
export const executeAggregation = (
  data: Record<string, any>[],
  column: string,
  aggregation: AggregationType
): number => {
  switch (aggregation) {
    case 'sum':
      return computeSum(data, column);
    case 'avg':
      return computeAverage(data, column);
    case 'count':
      return computeCount(data);
    case 'unique_count':
      return computeUniqueCount(data, column);
    case 'min':
      return computeMin(data, column);
    case 'max':
      return computeMax(data, column);
    case 'median':
      return computeMedian(data, column);
    case 'growth_mom':
      return computeMoMGrowth(data, column).growthPct;
    default:
      return computeSum(data, column);
  }
};
