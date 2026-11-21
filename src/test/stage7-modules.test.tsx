import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  extractPipelineData, 
  extractCampaignData, 
  extractFinancialReportData, 
  extractContactsData, 
  extractGoalsData 
} from '../core/analytics/moduleAdapters';
import {
  checkDealManagementAvailability,
  checkCampaignManagementAvailability,
  checkPipelineAvailability,
  checkContactsAvailability,
  checkCalendarAvailability,
  checkReportsAvailability
} from '../core/analytics/moduleAvailability';
import { Dataset, ColumnProfile } from '../types';
import { useAppStore } from '../store/useAppStore';
import { DealManagementPage } from '../pages/DealManagementPage';
import { SalesPipelinePage } from '../pages/SalesPipelinePage';
import { CampaignManagementPage } from '../pages/CampaignManagementPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ContactsPage } from '../pages/ContactsPage';
import { GoalsPage } from '../pages/GoalsPage';
import { CalendarPage } from '../pages/CalendarPage';
import { DataExplorerPage } from '../pages/DataExplorerPage';

describe('Stage 7: Advanced Business Intelligence Modules Tests', () => {
  beforeEach(() => {
    useAppStore.setState({
      datasets: [],
      activeDatasetId: null,
      charts: [],
      kpis: [],
    });
  });

  const createTestDataset = (
    name: string,
    domain: any,
    data: Record<string, any>[],
    columns: string[]
  ): Dataset => {
    const profiles: Record<string, ColumnProfile> = {};
    columns.forEach((col) => {
      const isNum = data.some((r) => typeof r[col] === 'number');
      profiles[col] = {
        name: col,
        inferredType: isNum ? 'numeric' : 'categorical',
        totalCount: data.length,
        nullCount: 0,
        distinctCount: new Set(data.map((r) => r[col])).size,
        uniqueRatio: 0.5,
        nullRatio: 0,
        sampleValues: data.slice(0, 5).map((r) => r[col]),
        semanticRole: isNum ? 'primary_metric' : 'category',
      };
    });

    return {
      id: `ds-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      fileName: `${name.toLowerCase()}.csv`,
      fileFormat: 'csv',
      fileSize: 1024,
      uploadedAt: new Date().toISOString(),
      rowCount: data.length,
      columnCount: columns.length,
      columns,
      data,
      availableSheets: ['Sheet1'],
      processingStatus: 'ready',
      profiles,
      quality: {
        overallScore: 95,
        totalRows: data.length,
        totalColumns: columns.length,
        duplicateRowsCount: 0,
        missingCellsCount: 0,
        missingDataPercentage: 0,
        anomaliesDetected: [],
      },
      detectedDomain: {
        domain,
        confidence: 0.95,
        reasoning: ['Test fixtures'],
        domainLabel: domain.toUpperCase(),
      },
      semanticMappings: {},
    };
  };

  describe('1. Sales Pipeline & Deal Management Adapter', () => {
    it('extracts deals, stages, win rate, and total pipeline from Sales dataset', () => {
      const salesData = [
        { deal: 'Alpha Deal', stage: 'Proposal', amount: 10000, rep: 'Alice', date: '2026-12-01' },
        { deal: 'Beta Deal', stage: 'Closed Won', amount: 30000, rep: 'Bob', date: '2026-12-05' },
        { deal: 'Gamma Deal', stage: 'Negotiation', amount: 20000, rep: 'Charlie', date: '2026-12-10' },
        { deal: 'Delta Deal', stage: 'Closed Won', amount: 40000, rep: 'Alice', date: '2026-12-15' },
      ];
      const ds = createTestDataset('Enterprise CRM', 'sales', salesData, ['deal', 'stage', 'amount', 'rep', 'date']);

      const pipeline = extractPipelineData(ds);
      expect(pipeline.isDemo).toBe(false);
      expect(pipeline.isAdapted).toBe(false);
      expect(pipeline.totalPipeline).toBe(100000);
      expect(pipeline.wonValue).toBe(70000);
      expect(pipeline.wonDeals).toBe(2);
      expect(pipeline.winRate).toBe(50);
      expect(pipeline.avgDealSize).toBe(25000);
      expect(pipeline.stages.length).toBeGreaterThanOrEqual(3);
      expect(pipeline.deals.length).toBe(4);
    });

    it('gracefully adapts when active dataset is not sales (e.g. HR dataset)', () => {
      const hrData = [
        { employee: 'John Doe', department: 'Engineering', salary: 120000, status: 'Active' },
        { employee: 'Jane Smith', department: 'Design', salary: 110000, status: 'Closed' },
      ];
      const ds = createTestDataset('HR Roster', 'hr', hrData, ['employee', 'department', 'salary', 'status']);

      const pipeline = extractPipelineData(ds);
      expect(pipeline.isDemo).toBe(false);
      expect(pipeline.isAdapted).toBe(true);
      expect(pipeline.totalPipeline).toBe(230000);
      expect(pipeline.deals.length).toBe(2);
    });

    it('falls back to demo dataset when dataset is null without errors', () => {
      const pipeline = extractPipelineData(null);
      expect(pipeline.isDemo).toBe(true);
      expect(pipeline.deals.length).toBeGreaterThan(0);
      expect(pipeline.totalPipeline).toBeGreaterThan(0);
      expect(pipeline.stages.length).toBe(4);
    });
  });

  describe('2. Campaign Management Adapter', () => {
    it('extracts marketing KPIs, channel performance, and ROI from Marketing dataset', () => {
      const mktgData = [
        { campaign: 'Search Q4', channel: 'Google Ads', spend: 2000, impressions: 50000, clicks: 2500, conversions: 250, revenue: 10000 },
        { campaign: 'Social Fall', channel: 'Meta Ads', spend: 1000, impressions: 30000, clicks: 1200, conversions: 60, revenue: 3000 },
      ];
      const ds = createTestDataset('Ad Spend', 'marketing', mktgData, ['campaign', 'channel', 'spend', 'impressions', 'clicks', 'conversions', 'revenue']);

      const campaigns = extractCampaignData(ds);
      expect(campaigns.isDemo).toBe(false);
      expect(campaigns.isAdapted).toBe(false);
      expect(campaigns.totalSpend).toBe(3000);
      expect(campaigns.totalImpressions).toBe(80000);
      expect(campaigns.totalClicks).toBe(3700);
      expect(campaigns.totalConversions).toBe(310);
      expect(campaigns.overallCtr).toBe(4.63); // (3700 / 80000) * 100
      expect(campaigns.overallRoas).toBe(4.33); // 13000 / 3000
      expect(campaigns.channelPerformance.length).toBe(2);
    });

    it('falls back to demo marketing data when dataset is null', () => {
      const campaigns = extractCampaignData(null);
      expect(campaigns.isDemo).toBe(true);
      expect(campaigns.campaigns.length).toBeGreaterThan(0);
      expect(campaigns.totalSpend).toBeGreaterThan(0);
      expect(campaigns.overallCtr).toBeGreaterThan(0);
    });
  });

  describe('3. Financial & Operational Reports Adapter', () => {
    it('aggregates category breakdown with totals, means, and percentage shares', () => {
      const finData = [
        { business_unit: 'Cloud Infra', revenue: 60000 },
        { business_unit: 'Cloud Infra', revenue: 40000 },
        { business_unit: 'Consulting', revenue: 50000 },
      ];
      const ds = createTestDataset('Financials', 'finance', finData, ['business_unit', 'revenue']);

      const report = extractFinancialReportData(ds);
      expect(report.isDemo).toBe(false);
      expect(report.grossTotal).toBe(150000);
      expect(report.totalRecords).toBe(3);
      expect(report.categoryBreakdown.length).toBe(2);

      const cloud = report.categoryBreakdown.find((c) => c.category === 'Cloud Infra');
      expect(cloud).toBeDefined();
      expect(cloud?.total).toBe(100000);
      expect(cloud?.mean).toBe(50000);
      expect(cloud?.sharePct).toBe(66.7);
    });

    it('falls back to demo financial statement when dataset is null', () => {
      const report = extractFinancialReportData(null);
      expect(report.isDemo).toBe(true);
      expect(report.categoryBreakdown.length).toBe(4);
      expect(report.grossTotal).toBe(1000000);
    });
  });

  describe('4. Contacts & Stakeholders Adapter', () => {
    it('extracts contacts directory and cumulative financial attribution', () => {
      const contactData = [
        { customer: 'Alice Johnson', email: 'alice@corp.com', role: 'VP Sales', company: 'Corp X', value: 50000 },
        { customer: 'Bob Smith', email: 'bob@tech.com', role: 'CTO', company: 'Tech Y', value: 75000 },
      ];
      const ds = createTestDataset('Customer CRM', 'sales', contactData, ['customer', 'email', 'role', 'company', 'value']);

      const contacts = extractContactsData(ds);
      expect(contacts.isDemo).toBe(false);
      expect(contacts.totalContacts).toBe(2);
      expect(contacts.totalValue).toBe(125000);
      expect(contacts.contacts[0].name).toBe('Alice Johnson');
    });

    it('falls back to demo directory when dataset is null', () => {
      const contacts = extractContactsData(null);
      expect(contacts.isDemo).toBe(true);
      expect(contacts.totalContacts).toBeGreaterThan(0);
    });
  });

  describe('5. Goals & Quota Attainment Adapter', () => {
    it('derives dynamic strategic targets and progress percentages from active dataset', () => {
      const salesData = [
        { deal: 'Deal A', amount: 50000 },
        { deal: 'Deal B', amount: 50000 },
      ];
      const ds = createTestDataset('Q4 Revenue', 'sales', salesData, ['deal', 'amount']);

      const goalsData = extractGoalsData(ds);
      expect(goalsData.isDemo).toBe(false);
      expect(goalsData.goals.length).toBe(4);

      const revenueGoal = goalsData.goals.find((g) => g.id === 'goal-primary-target');
      expect(revenueGoal).toBeDefined();
      expect(revenueGoal?.current).toBe(100000);
      expect(revenueGoal?.target).toBe(125000);
      expect(revenueGoal?.progressPercent).toBe(80);
    });

    it('falls back to demo targets when dataset is null', () => {
      const goalsData = extractGoalsData(null);
      expect(goalsData.isDemo).toBe(true);
      expect(goalsData.goals.length).toBeGreaterThan(0);
    });
  });

  describe('6. Module UI Page Rendering Tests', () => {
    it('renders DealManagementPage with active dataset telemetry', () => {
      const salesData = [
        { deal: 'Acme Big Deal', stage: 'Closed Won', amount: 50000, rep: 'Alice', date: '2026-12-01' },
      ];
      const ds = createTestDataset('Active CRM', 'sales', salesData, ['deal', 'stage', 'amount', 'rep', 'date']);
      useAppStore.setState({ datasets: [ds], activeDatasetId: ds.id });

      render(<DealManagementPage />);
      expect(screen.getByText('Deal Management')).toBeInTheDocument();
      expect(screen.getAllByText('Acme Big Deal').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('$50,000').length).toBeGreaterThanOrEqual(1);
    });

    it('renders SalesPipelinePage with active dataset Kanban board', () => {
      const salesData = [
        { deal: 'Cloud Migration', stage: 'Proposal', amount: 80000, rep: 'Bob', date: '2026-12-01' },
      ];
      const ds = createTestDataset('Cloud Pipeline', 'sales', salesData, ['deal', 'stage', 'amount', 'rep', 'date']);
      useAppStore.setState({ datasets: [ds], activeDatasetId: ds.id });

      render(<SalesPipelinePage />);
      expect(screen.getByText('Sales Pipeline')).toBeInTheDocument();
      expect(screen.getAllByText('Cloud Migration').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('$80,000').length).toBeGreaterThanOrEqual(1);
    });

    it('renders CampaignManagementPage with dynamic marketing metrics', () => {
      const mktgData = [
        { campaign: 'Growth Ad', channel: 'LinkedIn', spend: 5000, impressions: 20000, clicks: 1000, conversions: 100 },
      ];
      const ds = createTestDataset('Paid Media', 'marketing', mktgData, ['campaign', 'channel', 'spend', 'impressions', 'clicks', 'conversions']);
      useAppStore.setState({ datasets: [ds], activeDatasetId: ds.id });

      render(<CampaignManagementPage />);
      expect(screen.getByText('Campaign Management')).toBeInTheDocument();
      expect(screen.getAllByText('Growth Ad').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('$5,000').length).toBeGreaterThanOrEqual(1);
    });

    it('renders ReportsPage with financial statement breakdown and export triggers', () => {
      const finData = [
        { category: 'Subscriptions', revenue: 75000 },
      ];
      const ds = createTestDataset('SaaS Books', 'finance', finData, ['category', 'revenue']);
      useAppStore.setState({ datasets: [ds], activeDatasetId: ds.id });

      render(<ReportsPage />);
      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      expect(screen.getAllByText('Subscriptions').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('$75,000').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('renders ContactsPage with directory and cumulative commercial attribution', () => {
      const contactData = [
        { customer: 'Sarah Connor', email: 'sarah@skynet.com', role: 'Director', company: 'Cyberdyne', value: 95000 },
      ];
      const ds = createTestDataset('Enterprise Contacts', 'sales', contactData, ['customer', 'email', 'role', 'company', 'value']);
      useAppStore.setState({ datasets: [ds], activeDatasetId: ds.id });

      render(<ContactsPage />);
      expect(screen.getByText('Key Stakeholders & Contacts')).toBeInTheDocument();
      expect(screen.getAllByText('Sarah Connor').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('sarah@skynet.com').length).toBeGreaterThanOrEqual(1);
    });

    it('renders GoalsPage with dynamic target benchmark cards', () => {
      const salesData = [
        { deal: 'Big Renewal', amount: 150000 },
      ];
      const ds = createTestDataset('Quota Sheet', 'sales', salesData, ['deal', 'amount']);
      useAppStore.setState({ datasets: [ds], activeDatasetId: ds.id });

      render(<GoalsPage />);
      expect(screen.getByText('Goals & Quota Attainment')).toBeInTheDocument();
      expect(screen.getByText('Define Target')).toBeInTheDocument();
      expect(screen.getAllByText(`$${(150000).toLocaleString()}`).length).toBeGreaterThanOrEqual(1);
    });

    it('renders CalendarPage with both Source Records and User Events clearly distinguished', () => {
      const timelineData = [
        { title: 'Project Kickoff Milestone', date: '2026-12-10', cost: 12000 },
      ];
      const ds = createTestDataset('Milestones', 'general', timelineData, ['title', 'date', 'cost']);
      useAppStore.setState({ datasets: [ds], activeDatasetId: ds.id });

      render(<CalendarPage />);
      expect(screen.getByText('Calendar & Milestones')).toBeInTheDocument();
      expect(screen.getByText('Schedule Custom Event')).toBeInTheDocument();
      // Verifies explicit distinction badges
      expect(screen.getAllByText('Source Record').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('User Event').length).toBeGreaterThanOrEqual(1);
    });

    it('renders DataExplorerPage with tabular view and column inspection', () => {
      const exploreData = [
        { sku: 'SKU-001', inventory: 500, price: 29.99 },
      ];
      const ds = createTestDataset('Warehouse Explorer', 'inventory', exploreData, ['sku', 'inventory', 'price']);
      useAppStore.setState({ datasets: [ds], activeDatasetId: ds.id });

      render(<DataExplorerPage />);
      expect(screen.getByText('Data Explorer')).toBeInTheDocument();
      expect(screen.getByText('Table View')).toBeInTheDocument();
      expect(screen.getByText('Columns Inspection')).toBeInTheDocument();
      expect(screen.getByText('Distributions')).toBeInTheDocument();
      expect(screen.getByText('Relationships')).toBeInTheDocument();
    });
  });

  describe('7. Module Availability Across Unrelated Datasets & Zero Fabrication', () => {
    it('detects Deal Management as available for Sales, but unavailable for Weather/Sensors dataset', () => {
      const salesDs = createTestDataset('Sales CRM', 'sales', [{ deal: 'Deal A', amount: 1000 }], ['deal', 'amount']);
      const weatherDs = createTestDataset('Weather Station', 'general', [{ station: 'North', temp: 22.5, humidity: 65 }], ['station', 'temp', 'humidity']);

      expect(checkDealManagementAvailability(salesDs).isAvailable).toBe(true);
      const weatherAvail = checkDealManagementAvailability(weatherDs);
      expect(weatherAvail.isAvailable).toBe(false);
      expect(weatherAvail.missingRequirements.length).toBeGreaterThan(0);
    });

    it('detects Campaign Management as available for Marketing, but unavailable for HR dataset', () => {
      const mktgDs = createTestDataset('Adwords', 'marketing', [{ campaign: 'Brand Search', clicks: 500, spend: 200 }], ['campaign', 'clicks', 'spend']);
      const hrDs = createTestDataset('Payroll', 'hr', [{ empId: 1, salary: 80000, department: 'Finance' }], ['empId', 'salary', 'department']);

      expect(checkCampaignManagementAvailability(mktgDs).isAvailable).toBe(true);
      const hrAvail = checkCampaignManagementAvailability(hrDs);
      expect(hrAvail.isAvailable).toBe(false);
      expect(hrAvail.missingRequirements.length).toBeGreaterThan(0);
    });

    it('detects Sales Pipeline as available when stage exists, and unavailable when absent', () => {
      const pipelineDs = createTestDataset('Pipeline CRM', 'sales', [{ deal: 'Alpha', stage: 'Proposal', amount: 5000 }], ['deal', 'stage', 'amount']);
      const logDs = createTestDataset('Server Logs', 'operations', [{ timestamp: '2026-11-20', status_code: 200 }], ['timestamp', 'status_code']);

      expect(checkPipelineAvailability(pipelineDs).isAvailable).toBe(true);
      expect(checkPipelineAvailability(logDs).isAvailable).toBe(false);
    });

    it('detects Calendar availability based on presence of date columns', () => {
      const dateDs = createTestDataset('Dated Events', 'sales', [{ date: '2026-12-01', revenue: 500 }], ['date', 'revenue']);
      const datelessDs = createTestDataset('No Dates Sheet', 'general', [{ item: 'Widget', qty: 10 }], ['item', 'qty']);

      expect(checkCalendarAvailability(dateDs).isAvailable).toBe(true);
      expect(checkCalendarAvailability(datelessDs).isAvailable).toBe(false);
    });

    it('DealManagementPage renders ModuleUnavailableState without fabricating data when dataset is incompatible', () => {
      const weatherDs = createTestDataset('Weather Sensors', 'general', [{ temp: 24, humidity: 70 }], ['temp', 'humidity']);
      useAppStore.setState({ datasets: [weatherDs], activeDatasetId: weatherDs.id });

      render(<DealManagementPage />);
      expect(screen.getByText('Module Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Deal Management is Not Available')).toBeInTheDocument();
      expect(screen.getByText(/Missing Required Schema Fields/i)).toBeInTheDocument();
      expect(screen.queryByText('Total Pipeline Value')).not.toBeInTheDocument();
    });

    it('CampaignManagementPage renders ModuleUnavailableState without fabricating data when dataset is incompatible', () => {
      const hrDs = createTestDataset('HR Payroll', 'hr', [{ employee: 'John', salary: 90000 }], ['employee', 'salary']);
      useAppStore.setState({ datasets: [hrDs], activeDatasetId: hrDs.id });

      render(<CampaignManagementPage />);
      expect(screen.getByText('Module Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Campaign Management is Not Available')).toBeInTheDocument();
      expect(screen.getByText(/Missing Required Schema Fields/i)).toBeInTheDocument();
      expect(screen.queryByText('Paid media budget')).not.toBeInTheDocument();
    });
    it('detects Contact Management and Reports availability accurately', () => {
      const contactDs = createTestDataset('Contacts', 'sales', [{ customer: 'Jane Doe', email: 'jane@corp.com', value: 5000 }], ['customer', 'email', 'value']);
      const numericDs = createTestDataset('Financials', 'finance', [{ category: 'Ops', amount: 2000 }], ['category', 'amount']);
      const emptyTextDs = createTestDataset('Text Only', 'general', [{ note: 'meeting summary' }], ['note']);

      expect(checkContactsAvailability(contactDs).isAvailable).toBe(true);
      expect(checkReportsAvailability(numericDs).isAvailable).toBe(true);
      expect(checkReportsAvailability(emptyTextDs).isAvailable).toBe(false);
    });
  });
});
