import { describe, it, expect, beforeEach } from 'vitest';
import { detectBusinessDomain } from '../core/semantic/domainDetector';
import { inferColumnSemanticRole } from '../core/semantic/semanticMapper';
import { DOMAIN_ONTOLOGIES } from '../core/semantic/domainOntology';
import { profileEntireDataset } from '../core/profiler/profilePipeline';
import { generateDatasetUnderstandingReport } from '../core/semantic/datasetUnderstandingReport';
import { useAppStore } from '../store/useAppStore';
import { Dataset } from '../types';

describe('Stage 4 - AI Semantic Column Mapping & Business Domain Detection Engine', () => {
  beforeEach(() => {
    useAppStore.setState({
      datasets: [],
      activeDatasetId: null,
    });
  });

  describe('1. Business Domain Classification (All 8 Domains Supported)', () => {
    it('classifies Sales Pipeline & Deals domain accurately', () => {
      const salesCols = ['opportunity_id', 'deal_value', 'sales_rep', 'pipeline_stage', 'win_rate', 'close_date'];
      const result = detectBusinessDomain(salesCols);
      expect(result.domain).toBe('sales');
      expect(result.confidence).toBeGreaterThanOrEqual(0.70);
      expect(result.domainLabel).toBe(DOMAIN_ONTOLOGIES.sales.label);
    });

    it('classifies Marketing & Digital Advertising domain accurately', () => {
      const mktgCols = ['campaign_id', 'ad_spend', 'cpc', 'impressions', 'clicks', 'roas', 'utm_source'];
      const result = detectBusinessDomain(mktgCols);
      expect(result.domain).toBe('marketing');
      expect(result.confidence).toBeGreaterThanOrEqual(0.70);
      expect(result.domainLabel).toBe(DOMAIN_ONTOLOGIES.marketing.label);
    });

    it('classifies Corporate Finance domain accurately', () => {
      const finCols = ['transaction_id', 'revenue', 'ebitda', 'opex', 'cogs', 'gl_account'];
      const result = detectBusinessDomain(finCols);
      expect(['finance', 'financial']).toContain(result.domain);
      expect(result.confidence).toBeGreaterThanOrEqual(0.70);
    });

    it('classifies E-Commerce & Retail domain accurately', () => {
      const ecomCols = ['order_id', 'sku', 'product_category', 'sales_amount', 'discount', 'units_sold'];
      const result = detectBusinessDomain(ecomCols);
      expect(result.domain).toBe('ecommerce');
      expect(result.confidence).toBeGreaterThanOrEqual(0.70);
      expect(result.domainLabel).toBe(DOMAIN_ONTOLOGIES.ecommerce.label);
    });

    it('classifies Customer Analytics & Retention domain accurately', () => {
      const custCols = ['customer_id', 'ltv', 'churn_rate', 'cohort', 'nps', 'tenure_months'];
      const result = detectBusinessDomain(custCols);
      expect(result.domain).toBe('customer_analytics');
      expect(result.confidence).toBeGreaterThanOrEqual(0.70);
      expect(result.domainLabel).toBe(DOMAIN_ONTOLOGIES.customer_analytics.label);
    });

    it('classifies Human Resources & Workforce domain accurately', () => {
      const hrCols = ['employee_id', 'headcount', 'salary', 'turnover_rate', 'department', 'hire_date'];
      const result = detectBusinessDomain(hrCols);
      expect(result.domain).toBe('hr');
      expect(result.confidence).toBeGreaterThanOrEqual(0.70);
      expect(result.domainLabel).toBe(DOMAIN_ONTOLOGIES.hr.label);
    });

    it('classifies Inventory & Supply Chain domain accurately', () => {
      const invCols = ['sku', 'warehouse', 'stock_on_hand', 'lead_time_days', 'reorder_point', 'supplier_id'];
      const result = detectBusinessDomain(invCols);
      expect(['inventory', 'supply_chain']).toContain(result.domain);
      expect(result.confidence).toBeGreaterThanOrEqual(0.70);
    });

    it('classifies Operations & Process Analytics domain accurately', () => {
      const opsCols = ['incident_id', 'cycle_time', 'throughput', 'sla_compliance_rate', 'mttr', 'workflow'];
      const result = detectBusinessDomain(opsCols);
      expect(result.domain).toBe('operations');
      expect(result.confidence).toBeGreaterThanOrEqual(0.70);
      expect(result.domainLabel).toBe(DOMAIN_ONTOLOGIES.operations.label);
    });

    it('falls back cleanly to General for non-specific schemas', () => {
      const genCols = ['id', 'item_name', 'score', 'notes'];
      const result = detectBusinessDomain(genCols);
      expect(result.domain).toBe('general');
      expect(result.confidence).toBeGreaterThanOrEqual(0.50);
    });
  });

  describe('2. Column Semantic Role Inference & Unfamiliar Naming Resolution', () => {
    it('resolves unfamiliar revenue & sales metric variations to primary_metric', () => {
      // Direct examples from prompt: Sales, Revenue, Amount, Net_Sales, Order_Value
      const variations = ['Sales', 'Revenue', 'Amount', 'Net_Sales', 'Order_Value', 'Gross_Amt', 'deal_value'];
      for (const col of variations) {
        const mapping = inferColumnSemanticRole(col, { inferredType: 'numeric' } as any, 'sales');
        expect(mapping.role).toBe('primary_metric');
        expect(mapping.confidence).toBeGreaterThanOrEqual(0.80);
      }
    });

    it('resolves customer & buyer variations to entity_id', () => {
      // Direct examples from prompt: Customer, Client, Buyer, Customer_Name
      const variations = ['Customer', 'Client', 'Buyer', 'Customer_Name', 'Cust_Name', 'Buyer_Id'];
      for (const col of variations) {
        const mapping = inferColumnSemanticRole(col, { inferredType: 'text' } as any);
        expect(mapping.role).toBe('entity_id');
        expect(mapping.confidence).toBeGreaterThanOrEqual(0.80);
      }
    });

    it('resolves unfamiliar date & transaction timestamp variations to timestamp', () => {
      // Direct examples from prompt: Order_Date, Transaction_Date, Invoice_Date
      const variations = ['Order_Date', 'Transaction_Date', 'Invoice_Date', 'Txn_Dt', 'Order_Dt', 'Inv_Date'];
      for (const col of variations) {
        const mapping = inferColumnSemanticRole(col, { inferredType: 'date' } as any);
        expect(mapping.role).toBe('timestamp');
        expect(mapping.confidence).toBeGreaterThanOrEqual(0.80);
      }
    });

    it('distinguishes secondary metrics (deductions, costs, rates) from primary revenue', () => {
      const costMapping = inferColumnSemanticRole('discount_amount', { inferredType: 'numeric' } as any, 'ecommerce');
      expect(costMapping.role).toBe('secondary_metric');

      const taxMapping = inferColumnSemanticRole('tax_amount', { inferredType: 'numeric' } as any, 'ecommerce');
      expect(taxMapping.role).toBe('secondary_metric');

      const qtyMapping = inferColumnSemanticRole('units_sold', { inferredType: 'numeric' } as any, 'ecommerce');
      expect(qtyMapping.role).toBe('secondary_metric');
    });

    it('flags low-confidence or unfamiliar columns as requiring confirmation', () => {
      // High cardinality text column with no keyword matches
      const ambiguousMapping = inferColumnSemanticRole('misc_memo_notes_field', {
        inferredType: 'text',
        distinctCount: 500,
        totalCount: 500,
        uniqueRatio: 1.0,
      } as any);

      expect(ambiguousMapping.confidence).toBeLessThan(0.70);
      expect(ambiguousMapping.requiresConfirmation).toBe(true);
      expect(ambiguousMapping.role).toBe('attribute');
    });
  });

  describe('3. AI Dataset Understanding Report Generation', () => {
    it('produces structured report with representation, metrics, module availability, and confirmation items', () => {
      const sampleData = [
        { cust_id: 'C01', net_sales: 500, region: 'North', txn_dt: '2025-01-01', memo: 'Note 1' },
        { cust_id: 'C02', net_sales: 800, region: 'South', txn_dt: '2025-01-02', memo: 'Note 2' },
      ];
      const columns = ['cust_id', 'net_sales', 'region', 'txn_dt', 'memo'];

      const pipelineResult = profileEntireDataset(sampleData, columns);
      const dataset: Dataset = {
        id: 'ds-report-test',
        name: 'Report Test Dataset',
        fileName: 'sales_q1.csv',
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
        profiles: pipelineResult.profiles,
        quality: pipelineResult.quality,
        detectedDomain: pipelineResult.detectedDomain,
        semanticMappings: pipelineResult.semanticMappings,
      };

      const report = generateDatasetUnderstandingReport(dataset);

      // 1. Dataset representation narrative
      expect(report.datasetRepresentation).toBeDefined();
      expect(typeof report.datasetRepresentation).toBe('string');
      expect(report.datasetRepresentation).toContain('records');

      // 2. Business metrics available
      expect(report.calculatedMetricsAvailable.length).toBeGreaterThan(0);
      expect(report.calculatedMetricsAvailable.some((m) => m.toLowerCase().includes('total'))).toBe(true);

      // 3. Modules available
      expect(report.availableModules.length).toBeGreaterThan(0);
      expect(report.availableModules.some((m) => m.name.includes('Executive Overview'))).toBe(true);

      // 4. Modules unavailable with clear reasoning
      expect(report.unavailableModules).toBeDefined();
      expect(report.unavailableModules.length).toBeGreaterThan(0);
      const campaignModule = report.unavailableModules.find((m) => m.name.includes('Marketing Campaign'));
      expect(campaignModule).toBeDefined();
      expect(campaignModule?.reason).toBeDefined();

      // 5. Columns requiring confirmation
      expect(Array.isArray(report.columnsRequiringConfirmation)).toBe(true);
    });
  });

  describe('4. Store Overrides and Interactive User Actions', () => {
    it('allows user to override column roles and business domains dynamically', () => {
      const sampleData = [
        { id: '1', mrr: 500, region: 'East', date: '2025-01-01' },
        { id: '2', mrr: 1000, region: 'West', date: '2025-01-02' },
      ];
      const columns = ['id', 'mrr', 'region', 'date'];

      const pipelineResult = profileEntireDataset(sampleData, columns);
      const dataset: Dataset = {
        id: 'ds-semantic-test',
        name: 'Semantic Test Dataset',
        fileName: 'test.csv',
        fileFormat: 'csv',
        fileSize: 500,
        uploadedAt: new Date().toISOString(),
        rowCount: sampleData.length,
        columnCount: columns.length,
        columns,
        data: sampleData,
        rawRows: [...sampleData],
        cleaningHistory: [],
        availableSheets: ['Sheet1'],
        processingStatus: 'ready',
        profiles: pipelineResult.profiles,
        quality: pipelineResult.quality,
        detectedDomain: pipelineResult.detectedDomain,
        semanticMappings: pipelineResult.semanticMappings,
      };

      const store = useAppStore.getState();
      store.addDataset(dataset);

      // 1. Initial automatic detection
      let active = useAppStore.getState().datasets.find((d) => d.id === 'ds-semantic-test')!;
      expect(active.detectedDomain.domain).toBe('saas');
      expect(active.profiles['mrr'].semanticRole).toBe('primary_metric');

      // 2. Override column role
      store.overrideColumnRole('ds-semantic-test', 'region', 'geo');
      active = useAppStore.getState().datasets.find((d) => d.id === 'ds-semantic-test')!;
      expect(active.profiles['region'].semanticRole).toBe('geo');
      expect(active.semanticMappings['region'].role).toBe('geo');

      // 3. Override business domain
      store.overrideBusinessDomain('ds-semantic-test', 'financial');
      active = useAppStore.getState().datasets.find((d) => d.id === 'ds-semantic-test')!;
      expect(active.detectedDomain.domain).toBe('financial');
      expect(active.detectedDomain.domainLabel).toBe(DOMAIN_ONTOLOGIES.financial.label);
    });
  });
});
