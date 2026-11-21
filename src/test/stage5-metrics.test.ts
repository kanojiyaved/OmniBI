import { describe, it, expect, beforeEach } from 'vitest';
import { 
  computeSum, 
  computeAverage, 
  computeMedian,
  computeCount, 
  computeUniqueCount, 
  computeMin, 
  computeMax, 
  computeMoMGrowth, 
  computeSparkline, 
  computeRatio,
  computePercentage,
  executeAggregation 
} from '../core/metrics/metricEngine';
import { buildDynamicKPIRegistry, METRIC_REGISTRY_TEMPLATES } from '../core/metrics/kpiRegistry';
import { profileEntireDataset } from '../core/profiler/profilePipeline';
import { useAppStore } from '../store/useAppStore';
import { Dataset } from '../types';

describe('Stage 5 - Dynamic KPI & Metric Engine', () => {
  const sampleSalesData = [
    { order_id: 'ORD-1', customer: 'Acme Corp', revenue: 1000, profit: 300, date: '2025-01-01', region: 'North' },
    { order_id: 'ORD-2', customer: 'Globex Inc', revenue: 2000, profit: 500, date: '2025-01-02', region: 'South' },
    { order_id: 'ORD-3', customer: 'Acme Corp', revenue: 3000, profit: 1200, date: '2025-01-03', region: 'North' },
    { order_id: 'ORD-4', customer: 'Initech LLC', revenue: 4000, profit: 1000, date: '2025-01-04', region: 'South' },
  ];

  beforeEach(() => {
    useAppStore.setState({
      datasets: [],
      activeDatasetId: null,
      kpis: [],
    });
  });

  describe('1. Pure Mathematical Aggregations & Formulas', () => {
    it('1. Computes SUM accurately across numeric records', () => {
      expect(computeSum(sampleSalesData, 'revenue')).toBe(10000);
      expect(computeSum(sampleSalesData, 'profit')).toBe(3000);
    });

    it('2. Computes AVERAGE (mean) accurately', () => {
      // (1000 + 2000 + 3000 + 4000) / 4 = 2500
      expect(computeAverage(sampleSalesData, 'revenue')).toBe(2500);
      expect(computeAverage(sampleSalesData, 'profit')).toBe(750);
    });

    it('3. Computes MEDIAN accurately for both odd and even length series', () => {
      // Even length: [1000, 2000, 3000, 4000] -> mid average (2000 + 3000) / 2 = 2500
      expect(computeMedian(sampleSalesData, 'revenue')).toBe(2500);

      // Odd length: [100, 300, 900] -> 300
      const oddData = [{ val: 100 }, { val: 900 }, { val: 300 }];
      expect(computeMedian(oddData, 'val')).toBe(300);
    });

    it('4. Computes COUNT and DISTINCT COUNT accurately', () => {
      expect(computeCount(sampleSalesData)).toBe(4);
      // Distinct customers: Acme Corp, Globex Inc, Initech LLC = 3
      expect(computeUniqueCount(sampleSalesData, 'customer')).toBe(3);
      expect(computeUniqueCount(sampleSalesData, 'order_id')).toBe(4);
    });

    it('5. Computes MIN and MAX accurately', () => {
      expect(computeMin(sampleSalesData, 'revenue')).toBe(1000);
      expect(computeMax(sampleSalesData, 'revenue')).toBe(4000);
      expect(computeMin(sampleSalesData, 'profit')).toBe(300);
      expect(computeMax(sampleSalesData, 'profit')).toBe(1200);
    });

    it('6. Computes RATIOS and PERCENTAGES accurately', () => {
      // 3000 profit / 10000 revenue = 0.3
      expect(computeRatio(3000, 10000)).toBe(0.3);
      // 3000 / 10000 * 100 = 30%
      expect(computePercentage(3000, 10000)).toBe(30);
    });

    it('7. Computes Period-over-Period (MoM) growth trajectory', () => {
      // First half (1000 + 2000 = 3000), Second half (3000 + 4000 = 7000) -> Growth = ((7000 - 3000) / 3000) * 100 = 133.3%
      const growth = computeMoMGrowth(sampleSalesData, 'revenue', 'date');
      expect(growth.previousPeriod).toBe(3000);
      expect(growth.currentPeriod).toBe(7000);
      expect(growth.growthPct).toBe(133.3);
      expect(growth.trend).toBe('up');
    });

    it('8. Computes 7-point sparklines across timeseries', () => {
      const sparkline = computeSparkline(sampleSalesData, 'revenue', 'date', 7);
      expect(sparkline.length).toBe(7);
      expect(sparkline.every((val) => typeof val === 'number')).toBe(true);
    });

    it('9. Executes dynamic aggregations via executeAggregation router', () => {
      expect(executeAggregation(sampleSalesData, 'revenue', 'sum')).toBe(10000);
      expect(executeAggregation(sampleSalesData, 'revenue', 'avg')).toBe(2500);
      expect(executeAggregation(sampleSalesData, 'revenue', 'median')).toBe(2500);
      expect(executeAggregation(sampleSalesData, 'revenue', 'min')).toBe(1000);
      expect(executeAggregation(sampleSalesData, 'revenue', 'max')).toBe(4000);
      expect(executeAggregation(sampleSalesData, 'customer', 'unique_count')).toBe(3);
    });
  });

  describe('2. Division by Zero and Invalid Calculation Protection', () => {
    it('prevents division by zero in computeRatio and computePercentage', () => {
      expect(computeRatio(500, 0)).toBe(0);
      expect(computePercentage(500, 0)).toBe(0);
      expect(computeRatio(0, 0)).toBe(0);
      expect(computePercentage(0, 0)).toBe(0);
      expect(computeRatio(null as any, 100)).toBe(0);
      expect(computeRatio(100, undefined as any)).toBe(0);
    });

    it('gracefully handles empty records without crashing', () => {
      expect(computeSum([], 'revenue')).toBe(0);
      expect(computeAverage([], 'revenue')).toBe(0);
      expect(computeMedian([], 'revenue')).toBe(0);
      expect(computeCount([])).toBe(0);
      expect(computeUniqueCount([], 'customer')).toBe(0);
      expect(computeMin([], 'revenue')).toBe(0);
      expect(computeMax([], 'revenue')).toBe(0);
    });
  });

  describe('3. Dynamic KPI Registry & Domain-Specific Metric Templates', () => {
    it('1. Sales Metrics: computes Revenue, Orders, AOV, Profit, Profit Margin, Customer Count, and Growth', () => {
      const columns = ['order_id', 'customer', 'revenue', 'profit', 'date', 'region'];
      const pipeline = profileEntireDataset(sampleSalesData, columns);
      const dataset: Dataset = {
        id: 'ds-sales-test',
        name: 'Sales Dataset',
        fileName: 'sales.csv',
        fileFormat: 'csv',
        fileSize: 1024,
        uploadedAt: new Date().toISOString(),
        rowCount: sampleSalesData.length,
        columnCount: columns.length,
        columns,
        data: sampleSalesData,
        rawRows: [...sampleSalesData],
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: pipeline.profiles,
        quality: pipeline.quality,
        detectedDomain: pipeline.detectedDomain,
        semanticMappings: pipeline.semanticMappings,
      };

      const registry = buildDynamicKPIRegistry(dataset);
      expect(registry.metrics.length).toBe(METRIC_REGISTRY_TEMPLATES.length);

      const metricsMap = new Map(registry.metrics.map((m) => [m.metricId, m]));

      // Revenue: SUM(revenue) = 10000
      const rev = metricsMap.get('sales_revenue')!;
      expect(rev.availabilityStatus).toBe('available');
      expect(rev.calculatedValue).toBe(10000);
      expect(rev.formula).toBe('SUM(revenue)');
      expect(rev.dataProvenance).toContain('revenue');

      // Orders: COUNT = 4
      const orders = metricsMap.get('sales_orders')!;
      expect(orders.availabilityStatus).toBe('available');
      expect(orders.calculatedValue).toBe(4);

      // Average Order Value: 10000 / 4 = 2500
      const aov = metricsMap.get('sales_aov')!;
      expect(aov.availabilityStatus).toBe('available');
      expect(aov.calculatedValue).toBe(2500);

      // Profit: SUM(profit) = 3000
      const profit = metricsMap.get('sales_profit')!;
      expect(profit.availabilityStatus).toBe('available');
      expect(profit.calculatedValue).toBe(3000);

      // Profit Margin: (3000 / 10000) * 100 = 30%
      const margin = metricsMap.get('sales_profit_margin')!;
      expect(margin.availabilityStatus).toBe('available');
      expect(margin.calculatedValue).toBe(30);

      // Customer Count: DISTINCT COUNT = 3
      const custCount = metricsMap.get('sales_customer_count')!;
      expect(custCount.availabilityStatus).toBe('available');
      expect(custCount.calculatedValue).toBe(3);

      // Revenue Growth: 133.3%
      const growth = metricsMap.get('sales_revenue_growth')!;
      expect(growth.availabilityStatus).toBe('available');
      expect(growth.calculatedValue).toBe(133.3);
    });

    it('2. Marketing Metrics: computes Impressions, Clicks, CTR, Conversions, Conversion Rate, Spend, and ROAS', () => {
      const mktgData = [
        { campaign_id: 'CMP-1', impressions: 10000, clicks: 500, conversions: 50, marketing_spend: 250, revenue: 1000 },
        { campaign_id: 'CMP-2', impressions: 20000, clicks: 1500, conversions: 150, marketing_spend: 750, revenue: 3000 },
      ];
      const columns = ['campaign_id', 'impressions', 'clicks', 'conversions', 'marketing_spend', 'revenue'];
      const pipeline = profileEntireDataset(mktgData, columns);
      const dataset: Dataset = {
        id: 'ds-mktg-test',
        name: 'Marketing Campaign Data',
        fileName: 'campaigns.csv',
        fileFormat: 'csv',
        fileSize: 1024,
        uploadedAt: new Date().toISOString(),
        rowCount: mktgData.length,
        columnCount: columns.length,
        columns,
        data: mktgData,
        rawRows: [...mktgData],
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: pipeline.profiles,
        quality: pipeline.quality,
        detectedDomain: pipeline.detectedDomain,
        semanticMappings: pipeline.semanticMappings,
      };

      const registry = buildDynamicKPIRegistry(dataset);
      const metricsMap = new Map(registry.metrics.map((m) => [m.metricId, m]));

      // Impressions: 10000 + 20000 = 30000
      expect(metricsMap.get('mktg_impressions')?.calculatedValue).toBe(30000);

      // Clicks: 500 + 1500 = 2000
      expect(metricsMap.get('mktg_clicks')?.calculatedValue).toBe(2000);

      // CTR: (2000 clicks / 30000 impressions) * 100 = 6.67%
      expect(metricsMap.get('mktg_ctr')?.calculatedValue).toBe(6.67);

      // Conversions: 50 + 150 = 200
      expect(metricsMap.get('mktg_conversions')?.calculatedValue).toBe(200);

      // Conversion Rate: (200 conversions / 2000 clicks) * 100 = 10%
      expect(metricsMap.get('mktg_conversion_rate')?.calculatedValue).toBe(10);

      // Marketing Spend: 250 + 750 = 1000
      expect(metricsMap.get('mktg_spend')?.calculatedValue).toBe(1000);

      // ROAS: 4000 revenue / 1000 spend = 4.0
      expect(metricsMap.get('mktg_roas')?.calculatedValue).toBe(4);
    });

    it('3. Financial Metrics: computes Income, Expenses, Net Profit, and Profit Margin', () => {
      const finData = [
        { income: 50000, expenses: 35000, profit: 15000, quarter: 'Q1' },
        { income: 60000, expenses: 40000, profit: 20000, quarter: 'Q2' },
      ];
      const columns = ['income', 'expenses', 'profit', 'quarter'];
      const pipeline = profileEntireDataset(finData, columns);
      const dataset: Dataset = {
        id: 'ds-fin-test',
        name: 'Financial Ledger',
        fileName: 'financials.csv',
        fileFormat: 'csv',
        fileSize: 1024,
        uploadedAt: new Date().toISOString(),
        rowCount: finData.length,
        columnCount: columns.length,
        columns,
        data: finData,
        rawRows: [...finData],
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: pipeline.profiles,
        quality: pipeline.quality,
        detectedDomain: pipeline.detectedDomain,
        semanticMappings: pipeline.semanticMappings,
      };

      const registry = buildDynamicKPIRegistry(dataset);
      const metricsMap = new Map(registry.metrics.map((m) => [m.metricId, m]));

      // Income: 50000 + 60000 = 110000
      expect(metricsMap.get('fin_income')?.calculatedValue).toBe(110000);

      // Expenses: 35000 + 40000 = 75000
      expect(metricsMap.get('fin_expenses')?.calculatedValue).toBe(75000);

      // Net Profit: 15000 + 20000 = 35000
      expect(metricsMap.get('fin_net_profit')?.calculatedValue).toBe(35000);

      // Profit Margin: (35000 / 110000) * 100 = 31.82%
      expect(metricsMap.get('fin_profit_margin')?.calculatedValue).toBe(31.82);
    });

    it('4. HR Metrics: computes Employees, Average Salary, Department Count, and Turnover Rate', () => {
      const hrData = [
        { employee_id: 'E01', salary: 80000, department: 'Engineering', turnover: 5 },
        { employee_id: 'E02', salary: 120000, department: 'Engineering', turnover: 5 },
        { employee_id: 'E03', salary: 100000, department: 'Product', turnover: 10 },
      ];
      const columns = ['employee_id', 'salary', 'department', 'turnover'];
      const pipeline = profileEntireDataset(hrData, columns);
      const dataset: Dataset = {
        id: 'ds-hr-test',
        name: 'HR Workforce Data',
        fileName: 'employees.csv',
        fileFormat: 'csv',
        fileSize: 1024,
        uploadedAt: new Date().toISOString(),
        rowCount: hrData.length,
        columnCount: columns.length,
        columns,
        data: hrData,
        rawRows: [...hrData],
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: pipeline.profiles,
        quality: pipeline.quality,
        detectedDomain: pipeline.detectedDomain,
        semanticMappings: pipeline.semanticMappings,
      };

      const registry = buildDynamicKPIRegistry(dataset);
      const metricsMap = new Map(registry.metrics.map((m) => [m.metricId, m]));

      // Employees: 3 unique employees
      expect(metricsMap.get('hr_employees')?.calculatedValue).toBe(3);

      // Average Salary: (80000 + 120000 + 100000) / 3 = 100000
      expect(metricsMap.get('hr_avg_salary')?.calculatedValue).toBe(100000);

      // Department Count: 2 (Engineering, Product)
      expect(metricsMap.get('hr_dept_dist')?.calculatedValue).toBe(2);

      // Turnover: (5 + 5 + 10) / 3 = 6.67%
      expect(metricsMap.get('hr_turnover_rate')?.calculatedValue).toBe(6.67);
    });

    it('5. Never assumes every dataset supports every KPI: marks missing metrics as unavailable with reasoning', () => {
      // HR dataset does not have clicks or impressions
      const hrData = [
        { employee_id: 'E01', salary: 80000, department: 'Engineering' },
      ];
      const columns = ['employee_id', 'salary', 'department'];
      const pipeline = profileEntireDataset(hrData, columns);
      const dataset: Dataset = {
        id: 'ds-hr-sparse',
        name: 'HR Sparse Data',
        fileName: 'employees.csv',
        fileFormat: 'csv',
        fileSize: 500,
        uploadedAt: new Date().toISOString(),
        rowCount: 1,
        columnCount: 3,
        columns,
        data: hrData,
        rawRows: [...hrData],
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: pipeline.profiles,
        quality: pipeline.quality,
        detectedDomain: pipeline.detectedDomain,
        semanticMappings: pipeline.semanticMappings,
      };

      const registry = buildDynamicKPIRegistry(dataset);
      const ctrMetric = registry.metrics.find((m) => m.metricId === 'mktg_ctr')!;

      expect(ctrMetric.availabilityStatus).toBe('unavailable');
      expect(ctrMetric.calculatedValue).toBeNull();
      expect(ctrMetric.unavailabilityReason).toBeDefined();
      expect(ctrMetric.unavailabilityReason).toContain('clicks');
    });
  });

  describe('4. Store Synchronization & Dataset Switching Recalculation', () => {
    it('recalculates KPIs dynamically when switching between datasets with completely different structures', () => {
      // Dataset A: Sales
      const salesCols = ['order_id', 'customer', 'revenue', 'profit', 'date'];
      const salesPipe = profileEntireDataset(sampleSalesData, salesCols);
      const salesDataset: Dataset = {
        id: 'ds-sales-switch',
        name: 'Sales Dataset',
        fileName: 'sales.csv',
        fileFormat: 'csv',
        fileSize: 1000,
        uploadedAt: new Date().toISOString(),
        rowCount: sampleSalesData.length,
        columnCount: salesCols.length,
        columns: salesCols,
        data: sampleSalesData,
        rawRows: [...sampleSalesData],
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: salesPipe.profiles,
        quality: salesPipe.quality,
        detectedDomain: salesPipe.detectedDomain,
        semanticMappings: salesPipe.semanticMappings,
      };

      // Dataset B: HR
      const hrData = [
        { employee_id: 'E01', salary: 90000, department: 'Sales' },
        { employee_id: 'E02', salary: 110000, department: 'Engineering' },
      ];
      const hrCols = ['employee_id', 'salary', 'department'];
      const hrPipe = profileEntireDataset(hrData, hrCols);
      const hrDataset: Dataset = {
        id: 'ds-hr-switch',
        name: 'HR Dataset',
        fileName: 'hr.csv',
        fileFormat: 'csv',
        fileSize: 500,
        uploadedAt: new Date().toISOString(),
        rowCount: 2,
        columnCount: 3,
        columns: hrCols,
        data: hrData,
        rawRows: [...hrData],
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: hrPipe.profiles,
        quality: hrPipe.quality,
        detectedDomain: hrPipe.detectedDomain,
        semanticMappings: hrPipe.semanticMappings,
      };

      const store = useAppStore.getState();

      // 1. Ingest Sales dataset
      store.addDataset(salesDataset);
      let kpis = useAppStore.getState().kpis;
      expect(kpis.some((k) => k.label.includes('Revenue'))).toBe(true);
      const salesRev = kpis.find((k) => k.label.includes('Revenue'));
      expect(salesRev?.value).toBe(10000);

      // 2. Ingest HR dataset and switch active dataset
      store.addDataset(hrDataset);
      kpis = useAppStore.getState().kpis;
      expect(kpis.some((k) => k.label.includes('Salary') || k.label.includes('Employee'))).toBe(true);

      // 3. Switch back to Sales dataset
      store.setActiveDatasetId('ds-sales-switch');
      kpis = useAppStore.getState().kpis;
      expect(kpis.some((k) => k.label.includes('Revenue'))).toBe(true);
      const restoredRev = kpis.find((k) => k.label.includes('Revenue'));
      expect(restoredRev?.value).toBe(10000);
    });
  });
});
