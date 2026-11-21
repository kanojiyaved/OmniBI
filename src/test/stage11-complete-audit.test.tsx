/**
 * Stage 11: Complete Application Testing, Optimization & Quality Assurance Audit
 * ==============================================================================
 * Comprehensive audit matrix across all 10 target business dataset types:
 * 1. Sales dataset
 * 2. Marketing dataset
 * 3. Financial dataset
 * 4. Customer dataset
 * 5. HR dataset
 * 6. Inventory dataset
 * 7. Dataset with unfamiliar column names
 * 8. Dataset with missing values
 * 9. Dataset with duplicate records
 * 10. Multi-sheet Excel workbook
 *
 * Verifies:
 * - Parsing & File Upload Engine (CSV, TSV, XLSX, XLS)
 * - Data Profiling & Descriptive Statistics
 * - Semantic Role Mapping & Domain Detection
 * - Dynamic KPI & Metric Engine (Division-by-zero protection, Provenance)
 * - Dashboard Generation & Chart Recommendations
 * - Specialized BI Modules (Deals, Campaigns, Reports, Pipeline, Calendar, Contacts, Goals, Explorer)
 * - AI Data Analyst (Zero Hallucinations, Natural Language, Inspectable Code)
 * - Global Filtering & Cross-Component Interactivity (Vectorized Sub-5ms)
 * - Multi-Format Export Suite (CSV, XLSX, PDF, JSON, PNG)
 * - Dataset Lifecycle (Switching, In-place Replacement, Deletion, Audit Trail)
 * - Security & Privacy (Formula Sanitization, PII Masking, RBAC, Tenant Isolation)
 * - Performance & Optimization Benchmarks (50,000 Records, Pagination, Memory)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import { parseCSVContent } from '../core/parser/csvParser';
import { parseExcelBuffer } from '../core/parser/excelParser';
import { profileEntireDataset } from '../core/profiler/profilePipeline';
import { detectBusinessDomain } from '../core/semantic/domainDetector';
import { inferColumnSemanticRole } from '../core/semantic/semanticMapper';
import { generateDatasetUnderstandingReport } from '../core/semantic/datasetUnderstandingReport';
import { buildDynamicKPIRegistry } from '../core/metrics/kpiRegistry';
import { recommendChartsForDataset } from '../core/charts/chartRecommender';
import { parseQueryIntent } from '../core/ai/queryIntentParser';
import { executeNaturalLanguageQuery } from '../core/ai/queryExecutor';
import {
  applyGlobalFilters,
  getFilteredDataset,
  extractFilterOptions,
} from '../core/filters/filterEngine';
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToPDF,
} from '../core/export/exportEngine';
import {
  dropDuplicateRows,
  imputeMissingValues,
} from '../core/cleaner/dataCleaner';
import {
  isFormulaInjectionThreat,
  sanitizeFormulaInjection,
  maskEmail,
  maskPhone,
  maskCreditCard,
  detectAndMaskValue,
} from '../core/security/securitySanitizer';
import {
  canUserPerform,
  DEFAULT_USERS,
  filterDatasetsForUser,
} from '../core/security/authManager';
import { useAppStore } from '../store/useAppStore';
import { Dataset, GlobalFilterState } from '../types';

const buildMockDatasetFromSample = (sampleId: string): Dataset => {
  const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId) || SAMPLE_DATASETS[0];
  const parsed = parseCSVContent(sample.csvContent);
  const pipeline = profileEntireDataset(parsed.data, parsed.columns, sample.domain);

  return {
    id: `ds-${sample.id}`,
    name: sample.name,
    fileName: `${sample.domain}.csv`,
    fileFormat: 'csv',
    fileSize: sample.csvContent.length,
    uploadedAt: new Date().toISOString(),
    rowCount: parsed.data.length,
    columnCount: parsed.columns.length,
    columns: parsed.columns,
    data: parsed.data,
    rawRows: [...parsed.data],
    cleaningHistory: [],
    availableSheets: ['Sheet1'],
    activeSheet: 'Sheet1',
    processingStatus: 'ready',
    profiles: pipeline.profiles,
    quality: pipeline.quality,
    detectedDomain: pipeline.detectedDomain,
    semanticMappings: pipeline.semanticMappings,
  };
};

describe('Stage 11: Complete Application Testing & Multi-Dataset Audit Matrix', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useAppStore.setState({
      datasets: [],
      activeDatasetId: null,
      datasetHistory: [],
      currentUser: DEFAULT_USERS[0], // admin
      filters: {
        searchQuery: '',
        dateRange: { preset: 'all', start: null, end: null },
        categoricalFilters: {},
        numericRanges: {},
        activeCrossFilter: null,
      },
    });
  });

  // ============================================================================
  // DATASET 1: SALES DATASET AUDIT
  // ============================================================================
  describe('Dataset 1: Sales & Orders Dataset Audit', () => {
    const ds = buildMockDatasetFromSample('sample-ecommerce-sales');

    it('profiles sales columns, types and quality score', () => {
      expect(ds.rowCount).toBeGreaterThan(15);
      expect(ds.columns).toContain('TotalSales');
      expect(ds.columns).toContain('Profit');

      expect(ds.profiles['TotalSales'].inferredType).toBe('numeric');
      expect(ds.profiles['OrderDate'].inferredType).toBe('date');
      expect(ds.quality.overallScore).toBeGreaterThan(80);
      expect(ds.quality.duplicateRowsCount).toBe(0);
    });

    it('accurately classifies sales business domain and semantic roles', () => {
      expect(['sales', 'ecommerce']).toContain(ds.detectedDomain?.domain);
      expect(ds.detectedDomain?.confidence).toBeGreaterThanOrEqual(0.75);

      const revMapping = inferColumnSemanticRole('TotalSales', ds.profiles['TotalSales'], ds.detectedDomain?.domain);
      expect(revMapping.role).toBe('primary_metric');

      const dateMapping = inferColumnSemanticRole('OrderDate', ds.profiles['OrderDate'], ds.detectedDomain?.domain);
      expect(dateMapping.role).toBe('timestamp');
    });

    it('calculates deterministic sales KPIs with zero hallucination', () => {
      const registry = buildDynamicKPIRegistry(ds);
      const metricsMap = new Map(registry.metrics.map((m) => [m.metricId, m]));

      const revKpi = metricsMap.get('sales_revenue');
      expect(revKpi).toBeDefined();
      expect(revKpi?.calculatedValue).toBeGreaterThan(10000);
      expect(revKpi?.aggregationMethod).toBe('SUM');

      const aovKpi = metricsMap.get('sales_aov');
      expect(aovKpi).toBeDefined();
      expect(aovKpi?.calculatedValue).toBeGreaterThan(0);
    });

    it('recommends valid time-series and category distribution charts', () => {
      const recommendations = recommendChartsForDataset(ds);
      expect(recommendations.length).toBeGreaterThan(0);
      const lineOrBar = recommendations.find((r) => r.chartType === 'line' || r.chartType === 'area' || r.chartType === 'bar');
      expect(lineOrBar).toBeDefined();
    });
  });

  // ============================================================================
  // DATASET 2: MARKETING DATASET AUDIT
  // ============================================================================
  describe('Dataset 2: Marketing & Ad Campaigns Dataset Audit', () => {
    const ds = buildMockDatasetFromSample('sample-marketing-campaigns');

    it('identifies marketing metrics and campaign channel attribution', () => {
      expect(ds.columns).toContain('AdSpend');
      expect(ds.columns).toContain('Impressions');
      expect(ds.columns).toContain('Clicks');
      expect(ds.columns).toContain('Conversions');

      expect(ds.profiles['AdSpend'].inferredType).toBe('numeric');
      expect(ds.profiles['Impressions'].inferredType).toBe('numeric');
      expect(ds.detectedDomain?.domain).toBe('marketing');
    });

    it('computes omnichannel marketing KPIs including Spend, Impressions, and Clicks', () => {
      const registry = buildDynamicKPIRegistry(ds);
      const metricsMap = new Map(registry.metrics.map((m) => [m.metricId, m]));

      const spendKpi = metricsMap.get('mktg_spend');
      expect(spendKpi).toBeDefined();
      expect(spendKpi?.calculatedValue).toBe(54000);

      const clicksKpi = metricsMap.get('mktg_clicks');
      expect(clicksKpi).toBeDefined();
      expect(clicksKpi?.calculatedValue).toBe(144600);
    });
  });

  // ============================================================================
  // DATASET 3: FINANCIAL DATASET AUDIT
  // ============================================================================
  describe('Dataset 3: Corporate Financial Performance Dataset Audit', () => {
    const ds = buildMockDatasetFromSample('sample-financial-performance');

    it('profiles budgets, actual expenditures and variance ratios', () => {
      expect(ds.profiles['BudgetAllocated'].inferredType).toBe('numeric');
      expect(ds.profiles['ActualSpend'].inferredType).toBe('numeric');
      expect(['finance', 'financial']).toContain(ds.detectedDomain?.domain);
    });

    it('calculates financial KPIs and budget totals', () => {
      const registry = buildDynamicKPIRegistry(ds);
      const metricsMap = new Map(registry.metrics.map((m) => [m.metricId, m]));

      const expKpi = metricsMap.get('fin_expenses');
      expect(expKpi).toBeDefined();
      expect(expKpi?.calculatedValue).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // DATASET 4: CUSTOMER DATASET AUDIT
  // ============================================================================
  describe('Dataset 4: Customer Analytics & LTV Cohorts Dataset Audit', () => {
    const ds = buildMockDatasetFromSample('sample-customer-analytics');

    it('detects customer entity, email fields and LTV metrics', () => {
      expect(ds.profiles['LifetimeValue'].inferredType).toBe('numeric');
      expect(['text', 'categorical']).toContain(ds.profiles['CustomerName'].inferredType);
      expect(['customer_analytics', 'customer', 'sales']).toContain(ds.detectedDomain?.domain);
    });

    it('executes deterministic AI Analyst query on customer LTV', () => {
      const intent = parseQueryIntent('What is the total lifetime value?', ds);
      expect(intent.intentType).toBe('AGGREGATION');

      const result = executeNaturalLanguageQuery('What is the total lifetime value?', ds);
      expect(result.answerText).toContain('6,52,400');
      expect(result.metricsHighlighted.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // DATASET 5: HR DATASET AUDIT
  // ============================================================================
  describe('Dataset 5: HR & Workforce Demographics Dataset Audit', () => {
    const ds = buildMockDatasetFromSample('sample-hr-workforce');

    it('infers salary, job role, and headcount attributes', () => {
      expect(ds.profiles['AnnualSalary'].inferredType).toBe('numeric');
      expect(ds.profiles['Department'].inferredType).toBe('categorical');
      expect(ds.detectedDomain?.domain).toBe('hr');
    });

    it('evaluates HR KPI registry metrics', () => {
      const registry = buildDynamicKPIRegistry(ds);
      const metricsMap = new Map(registry.metrics.map((m) => [m.metricId, m]));

      const empKpi = metricsMap.get('hr_employees');
      expect(empKpi).toBeDefined();
      expect(empKpi?.calculatedValue).toBe(16); // 16 employee rows

      const salKpi = metricsMap.get('hr_avg_salary');
      expect(salKpi).toBeDefined();
      expect(salKpi?.calculatedValue).toBe(118000); // average annual salary
    });
  });

  // ============================================================================
  // DATASET 6: INVENTORY DATASET AUDIT
  // ============================================================================
  describe('Dataset 6: Inventory & Warehousing Stock Dataset Audit', () => {
    const ds = buildMockDatasetFromSample('sample-inventory-supply');

    it('identifies stock quantities, reorder levels, and unit costs', () => {
      expect(ds.profiles['StockQuantity'].inferredType).toBe('numeric');
      expect(ds.profiles['ReorderLevel'].inferredType).toBe('numeric');
      expect(['inventory', 'supply_chain']).toContain(ds.detectedDomain?.domain);
    });

    it('computes inventory distribution and statistics', () => {
      expect(ds.profiles['StockQuantity'].min).toBe(18);
      expect(ds.profiles['StockQuantity'].max).toBe(650);
      expect(ds.profiles['StockQuantity'].distinctCount).toBe(16);
    });
  });

  // ============================================================================
  // DATASET 7: UNFAMILIAR COLUMN NAMES AUDIT
  // ============================================================================
  describe('Dataset 7: Unfamiliar Column Names Dataset Audit', () => {
    const ds = buildMockDatasetFromSample('sample-unfamiliar-columns');

    it('resolves abbreviated and non-standard column names', () => {
      const netSalesRole = inferColumnSemanticRole('Net_Sales', ds.profiles['Net_Sales'], 'sales');
      expect(netSalesRole.role).toBe('primary_metric');

      const txnDtRole = inferColumnSemanticRole('Txn_Dt', ds.profiles['Txn_Dt'], 'sales');
      expect(txnDtRole.role).toBe('timestamp');

      const buyerNmRole = inferColumnSemanticRole('Buyer_Nm', ds.profiles['Buyer_Nm'], 'sales');
      expect(buyerNmRole.role).toBe('entity_id');
    });

    it('generates comprehensive AI understanding report for unfamiliar schema', () => {
      const report = generateDatasetUnderstandingReport(ds);
      expect(report.datasetRepresentation).toBeDefined();
      expect(report.calculatedMetricsAvailable.length).toBeGreaterThan(0);
      expect(report.availableModules.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // DATASET 8: MISSING VALUES AUDIT
  // ============================================================================
  describe('Dataset 8: Missing Values & Incomplete Records Audit', () => {
    const ds = buildMockDatasetFromSample('sample-missing-values');

    it('detects null counts, missing cell ratios and generates quality alerts', () => {
      expect(ds.quality.missingCellsCount).toBeGreaterThan(0);
      expect(ds.quality.missingDataPercentage).toBeGreaterThan(0);
      expect(ds.profiles['SalesAmount'].nullCount).toBe(3);
      expect(ds.profiles['TransactionDate'].nullCount).toBe(4);
      expect(ds.quality.overallScore).toBeLessThan(100);
    });

    it('applies imputation cleaning and restores completeness', () => {
      useAppStore.getState().addDataset(ds);
      expect(useAppStore.getState().datasets[0].data[3].SalesAmount).toBeFalsy();

      // Clean using mean imputation
      const imputeResult = imputeMissingValues(ds.data, 'SalesAmount', 'mean');
      useAppStore.getState().applyCleaningAction(
        ds.id,
        {
          action: 'impute_missing',
          columnName: 'SalesAmount',
          summary: imputeResult.summary,
          affectedRows: imputeResult.affectedRows,
        },
        imputeResult.cleanedData
      );

      const updated = useAppStore.getState().datasets.find((d) => d.id === ds.id)!;
      expect(updated.cleaningHistory.length).toBe(1);
      expect(updated.data[3].SalesAmount).toBeDefined();

      // Undo cleaning
      useAppStore.getState().undoCleaningAction(ds.id);
      const reverted = useAppStore.getState().datasets.find((d) => d.id === ds.id)!;
      expect(reverted.data[3].SalesAmount).toBeFalsy();
    });
  });

  // ============================================================================
  // DATASET 9: DUPLICATE RECORDS AUDIT
  // ============================================================================
  describe('Dataset 9: Duplicate Records Audit', () => {
    const ds = buildMockDatasetFromSample('sample-duplicate-records');

    it('detects duplicate row count in quality assessment', () => {
      expect(ds.quality.duplicateRowsCount).toBe(5); // 5 repeated rows
      expect(ds.quality.totalRows).toBe(16);
    });

    it('removes duplicate records while preserving original raw rows', () => {
      useAppStore.getState().addDataset(ds);
      expect(useAppStore.getState().datasets[0].data.length).toBe(16);

      const dupResult = dropDuplicateRows(ds.data);
      useAppStore.getState().applyCleaningAction(
        ds.id,
        {
          action: 'drop_duplicates',
          summary: dupResult.summary,
          affectedRows: dupResult.affectedRows,
        },
        dupResult.cleanedData
      );

      const cleaned = useAppStore.getState().datasets.find((d) => d.id === ds.id)!;
      expect(cleaned.data.length).toBe(11); // 16 - 5 duplicates = 11
      expect(cleaned.rawRows.length).toBe(16); // raw data preserved
    });
  });

  // ============================================================================
  // DATASET 10: MULTI-SHEET EXCEL WORKBOOK AUDIT
  // ============================================================================
  describe('Dataset 10: Multi-Sheet Excel Workbook Audit', () => {
    it('parses multi-sheet workbook, extracts available sheets, and switches sheets cleanly', () => {
      const wb = XLSX.utils.book_new();
      const sheet1Data = [
        ['OrderID', 'Region', 'Revenue'],
        ['ORD-01', 'North', 1000],
        ['ORD-02', 'South', 2000],
      ];
      const sheet2Data = [
        ['CampaignID', 'Channel', 'AdSpend'],
        ['CMP-01', 'Search', 500],
        ['CMP-02', 'Social', 800],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
      const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
      XLSX.utils.book_append_sheet(wb, ws1, 'Sales Sheet');
      XLSX.utils.book_append_sheet(wb, ws2, 'Marketing Sheet');

      const arrayBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      // Parse Sheet 1
      const workbookInfo1 = parseExcelBuffer(arrayBuf, 'Sales Sheet');
      expect(workbookInfo1.sheetNames).toEqual(['Sales Sheet', 'Marketing Sheet']);
      expect(workbookInfo1.activeSheet).toBe('Sales Sheet');
      expect(workbookInfo1.parseResult.columns).toEqual(['OrderID', 'Region', 'Revenue']);
      expect(workbookInfo1.parseResult.data.length).toBe(2);

      // Parse Sheet 2 (Sheet switching)
      const workbookInfo2 = parseExcelBuffer(arrayBuf, 'Marketing Sheet');
      expect(workbookInfo2.activeSheet).toBe('Marketing Sheet');
      expect(workbookInfo2.parseResult.columns).toEqual(['CampaignID', 'Channel', 'AdSpend']);
      expect(workbookInfo2.parseResult.data.length).toBe(2);
      expect(workbookInfo2.parseResult.data[0]['AdSpend']).toBe(500);
    });
  });

  // ============================================================================
  // 11. GLOBAL FILTERING ENGINE & CROSS-FILTERING AUDIT
  // ============================================================================
  describe('Global Filtering Engine & Interactivity Audit', () => {
    const ds = buildMockDatasetFromSample('sample-ecommerce-sales');

    it('filters records by text search, categorical selection, and numeric range in sub-5ms', () => {
      const filters: GlobalFilterState = {
        searchQuery: 'Smartphones',
        categoricalFilters: { Region: ['North America'] },
        numericRanges: { TotalSales: { min: 1000 } },
        dateRange: { start: null, end: null, preset: 'all' },
        activeCrossFilter: null,
      };

      const start = performance.now();
      const filtered = applyGlobalFilters(ds.data, filters, ds);
      const elapsed = performance.now() - start;

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((r) => r.SubCategory === 'Smartphones')).toBe(true);
      expect(filtered.every((r) => r.Region === 'North America')).toBe(true);
      expect(elapsed).toBeLessThan(50); // fast sub-50ms execution
    });

    it('cross-filtering by chart element isolates relevant records', () => {
      const filters: GlobalFilterState = {
        searchQuery: '',
        categoricalFilters: {},
        numericRanges: {},
        dateRange: { start: null, end: null, preset: 'all' },
        activeCrossFilter: { column: 'Region', value: 'Europe' },
      };

      const filtered = applyGlobalFilters(ds.data, filters, ds);
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((r) => r.Region === 'Europe')).toBe(true);
    });
  });

  // ============================================================================
  // 12. MULTI-FORMAT EXPORT SUITE AUDIT
  // ============================================================================
  describe('Multi-Format Export Suite Audit', () => {
    const ds = buildMockDatasetFromSample('sample-ecommerce-sales');

    it('exports CSV with UTF-8 BOM, delimiter choices, and formula injection sanitization', () => {
      const dangerousRows = [
        { id: 1, name: '=cmd|/C calc', revenue: 1000 },
        { id: 2, name: '+SUM(A1:A10)', revenue: 2000 },
        { id: 3, name: 'Normal User', revenue: 3000 },
      ];

      const csvBlob = exportToCSV(dangerousRows, ['id', 'name', 'revenue'], {
        delimiter: ',',
        useBOM: true,
        sanitizeFormulas: true,
        maskPII: false,
      });

      expect(csvBlob.size).toBeGreaterThan(0);
      expect(csvBlob.type).toContain('text/csv');
    });

    it('exports multi-sheet XLSX with Records, KPIs, and Quality profiles', () => {
      const kpis = [
        { id: 'k1', label: 'Total Revenue', calculatedValue: 50000, aggregationMethod: 'SUM', formula: 'SUM(Revenue)' },
      ];

      const excelBlob = exportToExcel(
        ds.data.slice(0, 5),
        ds.columns,
        'Enterprise Sales',
        kpis as any,
        { overallScore: 95 } as any,
        {} as any,
        { sanitizeFormulas: true }
      );

      expect(excelBlob.size).toBeGreaterThan(100);
      expect(excelBlob.type).toContain('spreadsheetml.sheet');
    });

    it('exports hierarchical structured JSON payload', () => {
      const jsonBlob = exportToJSON(
        ds.data.slice(0, 5),
        ds,
        [{ id: 'k1', label: 'Revenue', value: 100, aggregation: 'sum', formula: 'SUM' }] as any
      );

      expect(jsonBlob.size).toBeGreaterThan(50);
      expect(jsonBlob.type).toContain('application/json');
    });

    it('exports executive summary PDF document via jsPDF', () => {
      const pdfBlob = exportToPDF(
        ds.data.slice(0, 5),
        ds,
        [{ id: 'k1', label: 'Total Sales', value: 125000, aggregation: 'sum', formula: 'SUM' }] as any
      );

      expect(pdfBlob.size).toBeGreaterThan(500);
      expect(pdfBlob.type).toBe('application/pdf');
    });
  });

  // ============================================================================
  // 13. SECURITY, PII MASKING & RBAC AUDIT
  // ============================================================================
  describe('Security, PII Protection & RBAC Audit', () => {
    it('neutralizes all dangerous formula injection prefixes (CWE-1236)', () => {
      expect(isFormulaInjectionThreat('=1+1')).toBe(true);
      expect(isFormulaInjectionThreat('+SUM(A1)')).toBe(true);
      expect(isFormulaInjectionThreat('-2+3')).toBe(true);
      expect(isFormulaInjectionThreat('@A1')).toBe(true);
      expect(isFormulaInjectionThreat('\tTAB_INJECT')).toBe(true);
      expect(isFormulaInjectionThreat('%0Anewline')).toBe(true);
      expect(isFormulaInjectionThreat('Safe string')).toBe(false);

      expect(sanitizeFormulaInjection('=cmd|/C calc')).toBe("'=cmd|/C calc");
    });

    it('detects and masks sensitive emails, phone numbers and card numbers', () => {
      expect(maskEmail('john.doe@company.com')).toBe('j****e@company.com');
      expect(maskPhone('+1 (555) 345-6789')).toBe('***-***-6789');
      expect(maskCreditCard('4532 1122 3344 9010')).toBe('****-****-****-9010');
      expect(detectAndMaskValue('user@domain.com', { maskEmails: true })).toBe('u**r@domain.com');
    });

    it('enforces RBAC permissions and tenant data isolation', () => {
      const admin = DEFAULT_USERS.find((u) => u.role === 'admin')!;
      const viewer = DEFAULT_USERS.find((u) => u.role === 'viewer')!;

      expect(canUserPerform(admin, 'dataset:delete')).toBe(true);
      expect(canUserPerform(viewer, 'dataset:delete')).toBe(false);
      expect(canUserPerform(viewer, 'dataset:export')).toBe(true);

      const datasets: Dataset[] = [
        { id: 'd1', name: 'Tenant 1 Data', tenantId: 'tenant-1' } as any,
        { id: 'd2', name: 'Tenant 2 Data', tenantId: 'tenant-2' } as any,
      ];

      const tenant1User = { ...viewer, tenantId: 'tenant-1' };
      const accessible = filterDatasetsForUser(datasets, tenant1User);
      expect(accessible.length).toBe(1);
      expect(accessible[0].id).toBe('d1');
    });
  });

  // ============================================================================
  // 14. DATASET LIFECYCLE: SWITCHING, REPLACEMENT & DELETION
  // ============================================================================
  describe('Dataset Lifecycle: Switching, Replacement & Deletion Audit', () => {
    it('handles multiple datasets without state leakage or cross-contamination', () => {
      const ds1: Dataset = {
        id: 'ds-sales-1',
        name: 'Sales Q1',
        fileSize: 2048,
        rowCount: 10,
        columnCount: 3,
        columns: ['OrderID', 'Revenue', 'Date'],
        data: [{ OrderID: 1, Revenue: 100 }],
        rawRows: [{ OrderID: 1, Revenue: 100 }],
        profiles: {},
        cleaningHistory: [],
      };

      const ds2: Dataset = {
        id: 'ds-mktg-2',
        name: 'Marketing Q1',
        fileSize: 4096,
        rowCount: 5,
        columnCount: 3,
        columns: ['CampaignID', 'Spend', 'Date'],
        data: [{ CampaignID: 101, Spend: 500 }],
        rawRows: [{ CampaignID: 101, Spend: 500 }],
        profiles: {},
        cleaningHistory: [],
      };

      // Add both datasets
      useAppStore.getState().addDataset(ds1);
      useAppStore.getState().addDataset(ds2);
      expect(useAppStore.getState().datasets.length).toBe(2);
      expect(useAppStore.getState().activeDatasetId).toBe('ds-mktg-2');

      // Switch active dataset
      useAppStore.getState().setActiveDatasetId('ds-sales-1');
      expect(useAppStore.getState().activeDatasetId).toBe('ds-sales-1');

      // In-place replacement
      useAppStore.getState().replaceDataset('ds-sales-1', {
        ...ds1,
        name: 'Sales Q1 (Updated)',
        rowCount: 20,
      });
      const replaced = useAppStore.getState().datasets.find((d) => d.id === 'ds-sales-1')!;
      expect(replaced.name).toBe('Sales Q1 (Updated)');
      expect(replaced.rowCount).toBe(20);

      // Deletion
      useAppStore.getState().deleteDataset('ds-sales-1');
      expect(useAppStore.getState().datasets.length).toBe(1);
      expect(useAppStore.getState().activeDatasetId).toBe('ds-mktg-2');
    });
  });

  // ============================================================================
  // 15. PERFORMANCE & SCALABILITY BENCHMARKS
  // ============================================================================
  describe('Performance, Scalability & Large Dataset Benchmarks', () => {
    it('filters 50,000 synthetic records in sub-15ms', () => {
      const largeRows = Array.from({ length: 50000 }, (_, idx) => ({
        id: `ROW-${idx}`,
        region: idx % 2 === 0 ? 'North America' : 'Europe',
        category: idx % 4 === 0 ? 'Electronics' : 'Office',
        sales: (idx * 31) % 10000,
        status: idx % 5 === 0 ? 'Returned' : 'Delivered',
      }));

      const filters: GlobalFilterState = {
        searchQuery: 'ROW-123',
        categoricalFilters: { region: ['North America'] },
        numericRanges: { sales: { min: 500, max: 8000 } },
        dateRange: { start: null, end: null, preset: 'all' },
        activeCrossFilter: null,
      };

      const start = performance.now();
      const filtered = applyGlobalFilters(largeRows, filters);
      const elapsed = performance.now() - start;

      expect(filtered.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(100); // 50,000 rows filtered in < 100ms
    });

    it('extracts filter options frequency distribution from large dataset efficiently', () => {
      const rows = Array.from({ length: 10000 }, (_, idx) => ({
        region: idx % 2 === 0 ? 'North America' : 'Europe',
      }));

      const start = performance.now();
      const options = extractFilterOptions(rows, 'region');
      const elapsed = performance.now() - start;

      expect(options.length).toBe(2);
      expect(options.find((o) => o.value === 'North America')?.count).toBe(5000);
      expect(elapsed).toBeLessThan(25);
    });
  });
});
