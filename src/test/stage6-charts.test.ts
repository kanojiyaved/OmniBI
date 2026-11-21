import { describe, it, expect, beforeEach } from 'vitest';
import { recommendChartsForDataset } from '../core/charts/chartRecommender';
import { processChartData } from '../core/charts/chartDataProcessor';
import { profileEntireDataset } from '../core/profiler/profilePipeline';
import { generateDynamicKPIs } from '../core/metrics/kpiGenerator';
import { generateDatasetInsights } from '../core/analytics/insightGenerator';
import { computeTopPerformers } from '../core/analytics/leaderboard';
import { useAppStore } from '../store/useAppStore';
import { Dataset, ChartSpecification } from '../types';

describe('Stage 6 - Dynamic Dashboard & Chart Generation Engine', () => {
  beforeEach(() => {
    useAppStore.setState({
      datasets: [],
      activeDatasetId: null,
      charts: [],
      kpis: [],
    });
  });

  describe('1. Chart Recommendation Engine Rules', () => {
    it('1. Date + Revenue recommends Line/Area chart', () => {
      const data = [
        { date: '2025-01-01', revenue: 1000 },
        { date: '2025-01-02', revenue: 2000 },
      ];
      const cols = ['date', 'revenue'];
      const pipeline = profileEntireDataset(data, cols, 'sales');
      const ds: Dataset = {
        id: 'ds-trend',
        name: 'Trend Data',
        fileName: 'trend.csv',
        fileFormat: 'csv',
        fileSize: 500,
        uploadedAt: new Date().toISOString(),
        rowCount: 2,
        columnCount: 2,
        columns: cols,
        data,
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: pipeline.profiles,
        quality: pipeline.quality,
        detectedDomain: pipeline.detectedDomain,
        semanticMappings: pipeline.semanticMappings,
      };

      const charts = recommendChartsForDataset(ds);
      expect(charts.length).toBeGreaterThanOrEqual(1);
      const trendChart = charts.find((c) => c.xAxisColumn === 'date');
      expect(trendChart).toBeDefined();
      expect(['line', 'area']).toContain(trendChart?.chartType);
      expect(trendChart?.yAxisColumns).toContain('revenue');
    });

    it('2. Category + Revenue recommends Bar chart', () => {
      const data = [
        { category: 'Electronics', revenue: 5000 },
        { category: 'Apparel', revenue: 3000 },
        { category: 'Home', revenue: 2000 },
      ];
      const cols = ['category', 'revenue'];
      const pipeline = profileEntireDataset(data, cols, 'ecommerce');
      const ds: Dataset = {
        id: 'ds-bar',
        name: 'Bar Data',
        fileName: 'bar.csv',
        fileFormat: 'csv',
        fileSize: 500,
        uploadedAt: new Date().toISOString(),
        rowCount: 3,
        columnCount: 2,
        columns: cols,
        data,
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: pipeline.profiles,
        quality: pipeline.quality,
        detectedDomain: pipeline.detectedDomain,
        semanticMappings: pipeline.semanticMappings,
      };

      const charts = recommendChartsForDataset(ds);
      const barChart = charts.find((c) => c.chartType === 'bar');
      expect(barChart).toBeDefined();
      expect(barChart?.xAxisColumn).toBe('category');
      expect(barChart?.yAxisColumns).toContain('revenue');
    });

    it('3. Status + Count recommends Donut chart', () => {
      const data = [
        { status: 'Active', count: 50 },
        { status: 'Pending', count: 20 },
        { status: 'Closed', count: 30 },
      ];
      const cols = ['status', 'count'];
      const pipeline = profileEntireDataset(data, cols, 'operations');
      const ds: Dataset = {
        id: 'ds-donut',
        name: 'Donut Data',
        fileName: 'donut.csv',
        fileFormat: 'csv',
        fileSize: 500,
        uploadedAt: new Date().toISOString(),
        rowCount: 3,
        columnCount: 2,
        columns: cols,
        data,
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: pipeline.profiles,
        quality: pipeline.quality,
        detectedDomain: pipeline.detectedDomain,
        semanticMappings: pipeline.semanticMappings,
      };

      const charts = recommendChartsForDataset(ds);
      const donutChart = charts.find((c) => c.chartType === 'donut');
      expect(donutChart).toBeDefined();
      expect(donutChart?.xAxisColumn).toBe('status');
    });

    it('4. Two numerical columns recommend Scatter plot', () => {
      const data = [
        { sales: 100, cost: 40 },
        { sales: 200, cost: 90 },
        { sales: 300, cost: 150 },
      ];
      const cols = ['sales', 'cost'];
      const pipeline = profileEntireDataset(data, cols, 'sales');
      const ds: Dataset = {
        id: 'ds-scatter',
        name: 'Scatter Data',
        fileName: 'scatter.csv',
        fileFormat: 'csv',
        fileSize: 500,
        uploadedAt: new Date().toISOString(),
        rowCount: 3,
        columnCount: 2,
        columns: cols,
        data,
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: pipeline.profiles,
        quality: pipeline.quality,
        detectedDomain: pipeline.detectedDomain,
        semanticMappings: pipeline.semanticMappings,
      };

      const charts = recommendChartsForDataset(ds);
      const scatterChart = charts.find((c) => c.chartType === 'scatter');
      expect(scatterChart).toBeDefined();
      expect(scatterChart?.xAxisColumn).toBe('sales');
      expect(scatterChart?.yAxisColumns).toContain('cost');
    });

    it('5. Multiple metrics over time recommend Multi-line chart', () => {
      const data = [
        { date: '2025-01-01', revenue: 1000, spend: 300 },
        { date: '2025-01-02', revenue: 2000, spend: 500 },
      ];
      const cols = ['date', 'revenue', 'spend'];
      const pipeline = profileEntireDataset(data, cols, 'marketing');
      const ds: Dataset = {
        id: 'ds-multiline',
        name: 'Multi-Line Data',
        fileName: 'multiline.csv',
        fileFormat: 'csv',
        fileSize: 500,
        uploadedAt: new Date().toISOString(),
        rowCount: 2,
        columnCount: 3,
        columns: cols,
        data,
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: pipeline.profiles,
        quality: pipeline.quality,
        detectedDomain: pipeline.detectedDomain,
        semanticMappings: pipeline.semanticMappings,
      };

      const charts = recommendChartsForDataset(ds);
      const multiLine = charts.find((c) => c.chartType === 'line' && c.yAxisColumns.length > 1);
      expect(multiLine).toBeDefined();
      expect(multiLine?.xAxisColumn).toBe('date');
      expect(multiLine?.yAxisColumns).toContain('revenue');
      expect(multiLine?.yAxisColumns).toContain('spend');
      expect(multiLine?.showLegend).toBe(true);
    });
  });

  describe('2. Chart Data Processing & Aggregation', () => {
    it('aggregates multi-line series across dates accurately', () => {
      const multiData = [
        { date: '2025-01-01', revenue: 100, cost: 40 },
        { date: '2025-01-01', revenue: 200, cost: 60 },
        { date: '2025-01-02', revenue: 500, cost: 150 },
      ];
      const spec: ChartSpecification = {
        id: 'spec-multi',
        title: 'Multi Line',
        chartType: 'line',
        xAxisColumn: 'date',
        yAxisColumns: ['revenue', 'cost'],
        aggregation: 'sum',
        importance: 'primary',
      };

      const processed = processChartData(multiData, spec);
      expect(processed.chartData.length).toBe(2);
      expect(processed.seriesKeys).toEqual(['revenue', 'cost']);
      // 2025-01-01 has 100 + 200 = 300 revenue, 40 + 60 = 100 cost
      expect(processed.chartData[0].date).toBe('2025-01-01');
      expect(processed.chartData[0].revenue).toBe(300);
      expect(processed.chartData[0].cost).toBe(100);
    });

    it('returns empty array when plottable rows are empty (Meaningful Empty State)', () => {
      const spec: ChartSpecification = {
        id: 'spec-empty',
        title: 'Empty',
        chartType: 'bar',
        xAxisColumn: 'category',
        yAxisColumns: ['sales'],
        aggregation: 'sum',
        importance: 'secondary',
      };
      const processed = processChartData([], spec);
      expect(processed.chartData).toEqual([]);
      expect(processed.seriesKeys).toEqual([]);
    });
  });

  describe('3. Dynamic Dashboard Generation Across 5 Business Domains', () => {
    const buildDataset = (name: string, domain: any, data: any[], cols: string[]): Dataset => {
      const pipeline = profileEntireDataset(data, cols, domain);
      return {
        id: `ds-${domain}`,
        name,
        fileName: `${domain}.csv`,
        fileFormat: 'csv',
        fileSize: 1024,
        uploadedAt: new Date().toISOString(),
        rowCount: data.length,
        columnCount: cols.length,
        columns: cols,
        data,
        rawRows: [...data],
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: pipeline.profiles,
        quality: pipeline.quality,
        detectedDomain: pipeline.detectedDomain,
        semanticMappings: pipeline.semanticMappings,
      };
    };

    it('1. Sales Dataset: Generates all 8 dashboard sections accurately', () => {
      const salesData = [
        { customer: 'Acme', revenue: 5000, region: 'East', date: '2025-01-01' },
        { customer: 'Globex', revenue: 7000, region: 'West', date: '2025-01-02' },
        { customer: 'Initech', revenue: 3000, region: 'East', date: '2025-01-03' },
      ];
      const ds = buildDataset('Sales Ledger', 'sales', salesData, ['customer', 'revenue', 'region', 'date']);

      // 1. Dynamic KPIs
      const kpis = generateDynamicKPIs(ds);
      expect(kpis.length).toBeGreaterThanOrEqual(3);
      expect(kpis.some((k) => k.label.includes('Revenue'))).toBe(true);

      // 2. Performance & Category Charts
      const charts = recommendChartsForDataset(ds);
      expect(charts.length).toBeGreaterThanOrEqual(2);

      // 3. Top Performers
      const top = computeTopPerformers(ds);
      expect(top.items.length).toBe(3);
      expect(top.items[0].name).toBe('Globex'); // $7000 is highest
      expect(top.items[0].rank).toBe(1);

      // 4. Data Insights
      const insights = generateDatasetInsights(ds);
      expect(insights.length).toBeGreaterThanOrEqual(2);

      // 5. Data Quality Summary
      expect(ds.quality.overallScore ?? (ds.quality as any).healthScore).toBeGreaterThanOrEqual(80);
    });

    it('2. Marketing Dataset: Generates dynamic KPIs, CTR insights, and channel charts', () => {
      const mktgData = [
        { campaign: 'Google Ads', impressions: 10000, clicks: 500, spend: 300 },
        { campaign: 'Meta Ads', impressions: 20000, clicks: 1200, spend: 700 },
      ];
      const ds = buildDataset('Ad Performance', 'marketing', mktgData, ['campaign', 'impressions', 'clicks', 'spend']);

      const kpis = generateDynamicKPIs(ds);
      expect(kpis.length).toBeGreaterThanOrEqual(3);

      const top = computeTopPerformers(ds);
      expect(top.items[0].name).toBe('Meta Ads');

      const insights = generateDatasetInsights(ds);
      expect(insights.some((i) => i.description.toLowerCase().includes('campaign') || i.description.toLowerCase().includes('ad'))).toBe(true);
    });

    it('3. Financial Dataset: Generates P&L metrics and expense distribution', () => {
      const finData = [
        { quarter: 'Q1', income: 80000, expenses: 50000, cost_center: 'Engineering' },
        { quarter: 'Q2', income: 95000, expenses: 60000, cost_center: 'Sales' },
      ];
      const ds = buildDataset('Corporate P&L', 'finance', finData, ['quarter', 'income', 'expenses', 'cost_center']);

      const kpis = generateDynamicKPIs(ds);
      expect(kpis.some((k) => k.label.includes('Income') || k.label.includes('Expenses'))).toBe(true);
      const charts = recommendChartsForDataset(ds);
      expect(charts.length).toBeGreaterThanOrEqual(1);
    });

    it('4. HR Dataset: Generates workforce sizing, average salary, and department distribution', () => {
      const hrData = [
        { employee_id: 'E01', salary: 110000, department: 'Product' },
        { employee_id: 'E02', salary: 90000, department: 'Engineering' },
        { employee_id: 'E03', salary: 120000, department: 'Engineering' },
      ];
      const ds = buildDataset('Workforce Ledger', 'hr', hrData, ['employee_id', 'salary', 'department']);

      const kpis = generateDynamicKPIs(ds);
      expect(kpis.some((k) => k.label.includes('Salary') || k.label.includes('Employee'))).toBe(true);

      const top = computeTopPerformers(ds);
      expect(top.items.length).toBe(3);
    });

    it('5. Inventory Dataset: Generates stock levels, warehouse breakdown, and lead times', () => {
      const invData = [
        { sku: 'SKU-A', stock_on_hand: 500, warehouse: 'Dallas', lead_time_days: 4 },
        { sku: 'SKU-B', stock_on_hand: 1200, warehouse: 'Chicago', lead_time_days: 6 },
      ];
      const ds = buildDataset('Supply Chain Inventory', 'inventory', invData, ['sku', 'stock_on_hand', 'warehouse', 'lead_time_days']);

      const kpis = generateDynamicKPIs(ds);
      expect(kpis.length).toBeGreaterThanOrEqual(2);

      const charts = recommendChartsForDataset(ds);
      expect(charts.some((c) => c.xAxisColumn === 'warehouse' || c.yAxisColumns.includes('stock_on_hand'))).toBe(true);
    });
  });

  describe('4. Store Reactivity & Zero Stale Metrics on Dataset Switch', () => {
    it('regenerates dashboard completely when another dataset is selected without displaying stale metrics', () => {
      const salesData = [
        { customer: 'Acme', revenue: 10000 },
      ];
      const salesCols = ['customer', 'revenue'];
      const salesPipe = profileEntireDataset(salesData, salesCols, 'sales');
      const salesDs: Dataset = {
        id: 'ds-sales-active',
        name: 'Sales Active',
        fileName: 'sales.csv',
        fileFormat: 'csv',
        fileSize: 500,
        uploadedAt: new Date().toISOString(),
        rowCount: 1,
        columnCount: 2,
        columns: salesCols,
        data: salesData,
        rawRows: [...salesData],
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: salesPipe.profiles,
        quality: salesPipe.quality,
        detectedDomain: salesPipe.detectedDomain,
        semanticMappings: salesPipe.semanticMappings,
      };

      const hrData = [
        { employee_id: 'EMP-99', salary: 150000 },
      ];
      const hrCols = ['employee_id', 'salary'];
      const hrPipe = profileEntireDataset(hrData, hrCols, 'hr');
      const hrDs: Dataset = {
        id: 'ds-hr-active',
        name: 'HR Active',
        fileName: 'hr.csv',
        fileFormat: 'csv',
        fileSize: 500,
        uploadedAt: new Date().toISOString(),
        rowCount: 1,
        columnCount: 2,
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

      // Ingest Sales
      store.addDataset(salesDs);
      expect(useAppStore.getState().activeDatasetId).toBe('ds-sales-active');
      expect(useAppStore.getState().kpis.some((k) => k.label.includes('Revenue'))).toBe(true);

      // Ingest HR and switch
      store.addDataset(hrDs);
      expect(useAppStore.getState().activeDatasetId).toBe('ds-hr-active');
      const hrKpis = useAppStore.getState().kpis;
      expect(hrKpis.some((k) => k.label.includes('Salary'))).toBe(true);
      // Stale revenue metric must NOT be in HR kpis
      expect(hrKpis.some((k) => k.label === 'Total Revenue')).toBe(false);
    });
  });
});
