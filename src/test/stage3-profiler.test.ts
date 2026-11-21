import { describe, it, expect, beforeEach } from 'vitest';
import { inferColumnType } from '../core/profiler/typeInference';
import { calculateColumnProfile } from '../core/profiler/statisticalEngine';
import { profileEntireDataset } from '../core/profiler/profilePipeline';
import { 
  dropDuplicateRows, 
  imputeMissingValues, 
  standardizeCategories, 
  convertColumnType 
} from '../core/cleaner/dataCleaner';
import { useAppStore } from '../store/useAppStore';
import { Dataset } from '../types';

describe('Stage 3 - Data Profiling, Cleaning and Validation Engine', () => {
  // Test Data
  const sampleData = [
    { id: 'REC-001', region: '  north america ', revenue: 100, churn: 'false', date: '2025-01-01', rate: '5%' },
    { id: 'REC-002', region: 'europe', revenue: 200, churn: 'true', date: '2025-01-02', rate: '10%' },
    { id: 'REC-003', region: 'NORTH AMERICA', revenue: 300, churn: 'false', date: '2025-01-03', rate: '15%' },
    { id: 'REC-004', region: 'asia', revenue: 10000, churn: 'false', date: '2025-01-04', rate: '20%' }, // 10000 is an outlier
    { id: 'REC-004', region: 'asia', revenue: 10000, churn: 'false', date: '2025-01-04', rate: '20%' }, // duplicate
    { id: 'REC-005', region: null, revenue: null, churn: 'true', date: '2025-01-05', rate: null }, // missing
  ];
  const columns = ['id', 'region', 'revenue', 'churn', 'date', 'rate'];

  beforeEach(() => {
    useAppStore.setState({
      datasets: [],
      activeDatasetId: null,
    });
  });

  describe('1. Semantic Type Inference', () => {
    it('infers numeric, date, boolean, id, currency and percentage correctly', () => {
      expect(inferColumnType('revenue', [100, 200, 300, 400])).toBe('numeric');
      expect(inferColumnType('price', ['$100', '$250.50', '$80'])).toBe('currency');
      expect(inferColumnType('discount', ['5%', '10.5%', '20%'])).toBe('percentage');
      expect(inferColumnType('timestamp', ['2025-01-01', '2025-02-15', '2025-03-30'])).toBe('date');
      expect(inferColumnType('is_active', ['true', 'false', 'true'])).toBe('boolean');
      expect(inferColumnType('user_id', ['USR-1', 'USR-2', 'USR-3', 'USR-4'])).toBe('id');
      expect(inferColumnType('status', ['Pending', 'Completed', 'Failed'])).toBe('categorical');
    });
  });

  describe('2. Statistical Calculations & Distribution', () => {
    it('accurately computes min, max, mean, median, stdDev, quartiles, and IQR outliers', () => {
      const numbersData = [
        { val: 10 },
        { val: 20 },
        { val: 30 },
        { val: 40 },
        { val: 50 },
        { val: 500 }, // Outlier
      ];

      const profile = calculateColumnProfile('val', numbersData);

      expect(profile.inferredType).toBe('numeric');
      expect(profile.totalCount).toBe(6);
      expect(profile.nullCount).toBe(0);
      expect(profile.min).toBe(10);
      expect(profile.max).toBe(500);
      expect(profile.mean).toBe(108.33);
      expect(profile.median).toBe(35);
      expect(profile.outlierCount).toBe(1); // 500 is detected as outlier
    });

    it('calculates frequency distributions for categorical columns', () => {
      const catData = [
        { status: 'Won' },
        { status: 'Won' },
        { status: 'Won' },
        { status: 'Lost' },
        { status: 'Pending' },
      ];

      const profile = calculateColumnProfile('status', catData);
      expect(profile.distinctCount).toBe(3);
      expect(profile.topFrequencies).toBeDefined();
      expect(profile.topFrequencies![0].value).toBe('Won');
      expect(profile.topFrequencies![0].count).toBe(3);
      expect(profile.topFrequencies![0].percentage).toBe(60);
    });
  });

  describe('3. Data Quality & Anomaly Assessment', () => {
    it('detects duplicate rows, missing cells, and generates overall quality report', () => {
      const { quality } = profileEntireDataset(sampleData, columns);

      expect(quality.totalRows).toBe(6);
      expect(quality.totalColumns).toBe(6);
      expect(quality.duplicateRowsCount).toBe(1); // Row 5 is duplicate of Row 4
      expect(quality.missingCellsCount).toBeGreaterThanOrEqual(3);
      expect(quality.anomaliesDetected.length).toBeGreaterThan(0);
      expect(quality.overallScore).toBeLessThan(100);
      expect(quality.overallScore).toBeGreaterThanOrEqual(20);
    });
  });

  describe('4. Data Cleaning Operations', () => {
    it('removes exact duplicate rows', () => {
      const result = dropDuplicateRows(sampleData);
      expect(result.affectedRows).toBe(1);
      expect(result.cleanedData.length).toBe(5);
    });

    it('imputes missing values with mean', () => {
      const result = imputeMissingValues(sampleData, 'revenue', 'mean');
      expect(result.affectedRows).toBe(1);
      const imputedRow = result.cleanedData.find((r) => r.id === 'REC-005');
      expect(imputedRow?.revenue).toBeGreaterThan(0);
    });

    it('imputes missing values with median', () => {
      const result = imputeMissingValues(sampleData, 'revenue', 'median');
      expect(result.affectedRows).toBe(1);
      const imputedRow = result.cleanedData.find((r) => r.id === 'REC-005');
      expect(imputedRow?.revenue).toBeDefined();
    });

    it('imputes missing values with constant', () => {
      const result = imputeMissingValues(sampleData, 'region', 'constant', 'Unknown Region');
      expect(result.affectedRows).toBe(1);
      const imputedRow = result.cleanedData.find((r) => r.id === 'REC-005');
      expect(imputedRow?.region).toBe('Unknown Region');
    });

    it('drops rows with missing values', () => {
      const result = imputeMissingValues(sampleData, 'revenue', 'drop_rows');
      expect(result.affectedRows).toBe(1);
      expect(result.cleanedData.length).toBe(5);
      expect(result.cleanedData.find((r) => r.id === 'REC-005')).toBeUndefined();
    });

    it('standardizes categories by trimming and title-casing', () => {
      const result = standardizeCategories(sampleData, 'region', 'title');
      expect(result.affectedRows).toBeGreaterThanOrEqual(2);
      expect(result.cleanedData[0].region).toBe('North America');
      expect(result.cleanedData[2].region).toBe('North America');
    });

    it('converts / casts column types', () => {
      const dataToConvert = [
        { price: '$1,250.00', active: '1' },
        { price: '$450.50', active: '0' },
      ];
      const numResult = convertColumnType(dataToConvert, 'price', 'numeric');
      expect(numResult.cleanedData[0].price).toBe(1250);
      expect(numResult.cleanedData[1].price).toBe(450.5);

      const boolResult = convertColumnType(dataToConvert, 'active', 'boolean');
      expect(boolResult.cleanedData[0].active).toBe(true);
      expect(boolResult.cleanedData[1].active).toBe(false);
    });
  });

  describe('5. Store State Integration, History and Recoverability', () => {
    it('applies cleaning action, updates profiles, tracks history, and undos cleanly', () => {
      const { profiles, quality } = profileEntireDataset(sampleData, columns);
      const testDataset: Dataset = {
        id: 'ds-test-cleaning',
        name: 'Test Cleaning Dataset',
        fileName: 'test.csv',
        fileFormat: 'csv',
        fileSize: 1024,
        uploadedAt: new Date().toISOString(),
        rowCount: sampleData.length,
        columnCount: columns.length,
        columns,
        data: sampleData,
        rawRows: [...sampleData],
        cleaningHistory: [],
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles,
        quality,
        detectedDomain: {
          domain: 'general',
          confidence: 0.9,
          reasoning: ['Test'],
          domainLabel: 'Test',
        },
        semanticMappings: {},
      };

      const store = useAppStore.getState();
      store.addDataset(testDataset);

      // Step 1: Drop duplicates
      const dupResult = dropDuplicateRows(sampleData);
      store.applyCleaningAction(
        'ds-test-cleaning',
        {
          action: 'drop_duplicates',
          summary: dupResult.summary,
          affectedRows: dupResult.affectedRows,
        },
        dupResult.cleanedData
      );

      let current = useAppStore.getState().datasets.find((d) => d.id === 'ds-test-cleaning')!;
      expect(current.rowCount).toBe(5);
      expect(current.cleaningHistory?.length).toBe(1);
      expect(current.quality.duplicateRowsCount).toBe(0);

      // Step 2: Impute missing
      const imputeResult = imputeMissingValues(current.data, 'region', 'constant', 'Global');
      store.applyCleaningAction(
        'ds-test-cleaning',
        {
          action: 'impute_missing',
          columnName: 'region',
          summary: imputeResult.summary,
          affectedRows: imputeResult.affectedRows,
        },
        imputeResult.cleanedData
      );

      current = useAppStore.getState().datasets.find((d) => d.id === 'ds-test-cleaning')!;
      expect(current.cleaningHistory?.length).toBe(2);

      // Step 3: Undo Impute
      store.undoCleaningAction('ds-test-cleaning');
      current = useAppStore.getState().datasets.find((d) => d.id === 'ds-test-cleaning')!;
      expect(current.cleaningHistory?.length).toBe(1);

      // Step 4: Reset to Raw Data
      store.resetDatasetToRaw('ds-test-cleaning');
      current = useAppStore.getState().datasets.find((d) => d.id === 'ds-test-cleaning')!;
      expect(current.rowCount).toBe(6);
      expect(current.cleaningHistory?.length).toBe(0);
      expect(current.rawRows?.length).toBe(6);
    });
  });
});
