import { ColumnProfile, SemanticRole } from '../../types';
import { inferColumnType } from './typeInference';

/**
 * Calculates accurate statistical measures for a dataset column.
 */
export const calculateColumnProfile = (
  columnName: string,
  data: Record<string, any>[]
): ColumnProfile => {
  const totalCount = data.length;
  const rawValues = data.map((r) => r[columnName]);

  const nonNullValues = rawValues.filter(
    (v) => v !== null && v !== undefined && v !== '' && v !== 'null' && v !== 'undefined'
  );

  const nullCount = totalCount - nonNullValues.length;
  const nullRatio = totalCount > 0 ? nullCount / totalCount : 0;

  const distinctSet = new Set(nonNullValues.map((v) => String(v)));
  const distinctCount = distinctSet.size;
  const uniqueRatio = totalCount > 0 ? distinctCount / totalCount : 0;

  const inferredType = inferColumnType(columnName, nonNullValues);

  // Inferred semantic role baseline
  let semanticRole: SemanticRole = 'attribute';
  if (inferredType === 'date') semanticRole = 'timestamp';
  else if (inferredType === 'id') semanticRole = 'entity_id';
  else if (inferredType === 'currency' || (inferredType === 'numeric' && /revenue|sales|profit|amount|cost|spend|price/i.test(columnName))) {
    semanticRole = 'primary_metric';
  } else if (inferredType === 'categorical') semanticRole = 'category';

  const baseProfile: ColumnProfile = {
    name: columnName,
    inferredType,
    semanticRole,
    totalCount,
    nullCount,
    distinctCount,
    uniqueRatio,
    nullRatio,
    sampleValues: nonNullValues.slice(0, 5),
  };

  // Frequency distribution for top values
  const counts: Record<string, number> = {};
  nonNullValues.forEach((val) => {
    const key = String(val);
    counts[key] = (counts[key] || 0) + 1;
  });

  const sortedFrequencies = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([val, count]) => ({
      value: val,
      count,
      percentage: totalCount > 0 ? Number(((count / totalCount) * 100).toFixed(1)) : 0,
    }));

  baseProfile.topFrequencies = sortedFrequencies;

  // Numeric statistics
  if (inferredType === 'numeric' || inferredType === 'currency' || inferredType === 'percentage') {
    const numbers = nonNullValues
      .map((v) => {
        const clean = String(v).replace(/[$,%]/g, '').trim();
        return Number(clean);
      })
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);

    if (numbers.length > 0) {
      const min = numbers[0];
      const max = numbers[numbers.length - 1];
      const sum = numbers.reduce((acc, n) => acc + n, 0);
      const mean = Number((sum / numbers.length).toFixed(2));

      // Median
      const mid = Math.floor(numbers.length / 2);
      const median =
        numbers.length % 2 === 0
          ? Number(((numbers[mid - 1] + numbers[mid]) / 2).toFixed(2))
          : numbers[mid];

      // Sample Standard Deviation
      let stdDev = 0;
      if (numbers.length > 1) {
        const variance =
          numbers.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) /
          (numbers.length - 1);
        stdDev = Number(Math.sqrt(variance).toFixed(2));
      }

      // Quartiles & IQR
      const q25Index = Math.floor(numbers.length * 0.25);
      const q75Index = Math.floor(numbers.length * 0.75);
      const q25 = numbers[q25Index];
      const q75 = numbers[q75Index];
      const iqr = q75 - q25;

      // IQR Outlier Detection
      const lowerBound = q25 - 1.5 * iqr;
      const upperBound = q75 + 1.5 * iqr;
      const outliers = numbers.filter((n) => n < lowerBound || n > upperBound);

      baseProfile.min = min;
      baseProfile.max = max;
      baseProfile.sum = sum;
      baseProfile.mean = mean;
      baseProfile.median = median;
      baseProfile.stdDev = stdDev;
      baseProfile.q25 = q25;
      baseProfile.q75 = q75;
      baseProfile.iqr = iqr;
      baseProfile.outlierCount = outliers.length;
    }
  }

  return baseProfile;
};
