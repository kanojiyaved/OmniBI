import { DatasetQualityReport, ColumnProfile } from '../../types';

/**
 * Calculates complete dataset quality report and detects anomalies.
 */
export const generateDatasetQualityReport = (
  data: Record<string, any>[],
  columns: string[],
  profiles: Record<string, ColumnProfile>
): DatasetQualityReport => {
  const totalRows = data.length;
  const totalColumns = columns.length;

  if (totalRows === 0 || totalColumns === 0) {
    return {
      overallScore: 0,
      totalRows: 0,
      totalColumns: 0,
      duplicateRowsCount: 0,
      missingCellsCount: 0,
      missingDataPercentage: 0,
      anomaliesDetected: [],
    };
  }

  // Count duplicate rows
  const rowSignatures = new Set<string>();
  let duplicateRowsCount = 0;

  for (const row of data) {
    const sig = JSON.stringify(row);
    if (rowSignatures.has(sig)) {
      duplicateRowsCount++;
    } else {
      rowSignatures.add(sig);
    }
  }

  // Count missing cells across all columns
  let missingCellsCount = 0;
  const anomalies: DatasetQualityReport['anomaliesDetected'] = [];

  if (duplicateRowsCount > 0) {
    anomalies.push({
      column: 'Multiple Columns',
      type: 'suspicious_id',
      severity: duplicateRowsCount > 10 ? 'high' : 'medium',
      description: `Detected ${duplicateRowsCount} duplicate row(s) in dataset.`,
    });
  }

  for (const col of columns) {
    const prof = profiles[col];
    if (prof) {
      missingCellsCount += prof.nullCount;

      if (prof.nullCount > 0) {
        anomalies.push({
          column: col,
          type: 'high_nulls',
          severity: prof.nullRatio > 0.4 ? 'high' : 'low',
          description: `Column "${col}" has ${prof.nullCount} missing value(s) (${(prof.nullRatio * 100).toFixed(1)}%).`,
        });
      }

      if (prof.outlierCount && prof.outlierCount > 0) {
        anomalies.push({
          column: col,
          type: 'outliers',
          severity: 'medium',
          description: `Detected ${prof.outlierCount} statistical outlier(s) using IQR boundaries.`,
        });
      }

      if (prof.distinctCount === 1 && totalRows > 1) {
        anomalies.push({
          column: col,
          type: 'constant_value',
          severity: 'low',
          description: `Column "${col}" has only 1 distinct constant value.`,
        });
      }
    }
  }

  const totalCells = totalRows * totalColumns;
  const missingDataPercentage = Number(((missingCellsCount / totalCells) * 100).toFixed(2));

  // Compute Overall Score (0 to 100)
  let score = 100;
  score -= Math.min(30, (duplicateRowsCount / totalRows) * 100 * 2);
  score -= Math.min(35, missingDataPercentage * 1.5);
  score -= Math.min(25, anomalies.length * 4);

  const overallScore = Math.max(20, Math.min(100, Math.round(score)));

  return {
    overallScore,
    totalRows,
    totalColumns,
    duplicateRowsCount,
    missingCellsCount,
    missingDataPercentage,
    anomaliesDetected: anomalies,
  };
};
