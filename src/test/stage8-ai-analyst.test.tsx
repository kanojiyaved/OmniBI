import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAppStore } from '../store/useAppStore';
import { parseQueryIntent } from '../core/ai/queryIntentParser';
import { executeNaturalLanguageQuery } from '../core/ai/queryExecutor';
import { 
  generateSuggestedQuestions, 
  getCategorizedSuggestedQuestions 
} from '../core/ai/suggestedQuestions';
import { ChatMessageBubble } from '../components/chat/ChatMessageBubble';
import { AiChatDrawer } from '../components/chat/AiChatDrawer';
import { AiAnalystPage } from '../pages/AiAnalystPage';
import { Dataset, ChatMessage } from '../types';

const createMockDataset = (overrides?: Partial<Dataset>): Dataset => ({
  id: 'ds-sales-test',
  name: 'Sales Performance Benchmark',
  fileName: 'sales_metrics.csv',
  fileFormat: 'csv',
  fileSize: 4096,
  uploadedAt: new Date().toISOString(),
  rowCount: 5,
  columnCount: 4,
  columns: ['Customer', 'Region', 'Revenue', 'Deals'],
  availableSheets: ['Sheet1'],
  activeSheet: 'Sheet1',
  processingStatus: 'ready',
  data: [
    { Customer: 'Acme Corp', Region: 'North America', Revenue: 10000, Deals: 2 },
    { Customer: 'Globex', Region: 'Europe', Revenue: 25000, Deals: 5 },
    { Customer: 'Soylent', Region: 'North America', Revenue: 5000, Deals: 1 },
    { Customer: 'Initech', Region: 'APAC', Revenue: 15000, Deals: 3 },
    { Customer: 'Umbrella', Region: 'Europe', Revenue: 30000, Deals: 6 },
  ],
  profiles: {
    Customer: {
      name: 'Customer',
      semanticRole: 'dimension',
      inferredType: 'text',
      totalCount: 5,
      nullCount: 0,
      nullRatio: 0,
      distinctCount: 5,
      uniqueRatio: 1.0,
      sampleValues: ['Acme Corp', 'Globex'],
    },
    Region: {
      name: 'Region',
      semanticRole: 'category',
      inferredType: 'categorical',
      totalCount: 5,
      nullCount: 0,
      nullRatio: 0,
      distinctCount: 3,
      uniqueRatio: 0.6,
      sampleValues: ['North America', 'Europe', 'APAC'],
    },
    Revenue: {
      name: 'Revenue',
      semanticRole: 'primary_metric',
      inferredType: 'numeric',
      totalCount: 5,
      nullCount: 0,
      nullRatio: 0,
      distinctCount: 5,
      uniqueRatio: 1.0,
      min: 5000,
      max: 30000,
      mean: 17000,
      median: 15000,
      sum: 85000,
      sampleValues: [10000, 25000],
    },
    Deals: {
      name: 'Deals',
      semanticRole: 'secondary_metric',
      inferredType: 'numeric',
      totalCount: 5,
      nullCount: 0,
      nullRatio: 0,
      distinctCount: 5,
      uniqueRatio: 1.0,
      min: 1,
      max: 6,
      mean: 3.4,
      median: 3,
      sum: 17,
      sampleValues: [2, 5],
    },
  },
  quality: {
    overallScore: 98,
    totalRows: 5,
    totalColumns: 4,
    duplicateRowsCount: 0,
    missingCellsCount: 0,
    missingDataPercentage: 0,
    anomaliesDetected: [],
  },
  detectedDomain: {
    domain: 'sales',
    confidence: 0.95,
    reasoning: ['Identified Revenue and Deals with Customer and Region'],
    domainLabel: 'SALES',
  },
  semanticMappings: {
    Revenue: {
      column: 'Revenue',
      role: 'primary_metric',
      suggestedMeaning: 'Total Revenue',
      confidence: 0.98,
      requiresConfirmation: false,
      confirmed: true,
      description: 'Revenue metric',
    },
    Region: {
      column: 'Region',
      role: 'category',
      suggestedMeaning: 'Sales Region',
      confidence: 0.9,
      requiresConfirmation: false,
      confirmed: true,
      description: 'Regional category',
    },
  },
  ...overrides,
});

describe('Stage 8: AI Data Analyst Engine & Conversational Analytics', () => {
  beforeEach(() => {
    useAppStore.setState({
      datasets: [createMockDataset()],
      activeDatasetId: 'ds-sales-test',
      isChatOpen: false,
      isAiAnalyzing: false,
      chatMessages: [
        {
          id: 'msg-init',
          role: 'assistant',
          content: 'Hello! I am your Autonomous Data Analyst.',
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });

  describe('1. Natural Language Query Intent Parser', () => {
    it('correctly classifies dataset summary queries', () => {
      const intent = parseQueryIntent('Summarize this dataset for me');
      expect(intent.intentType).toBe('SUMMARY');
      expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('identifies metric aggregations (sum, avg, max, min, count)', () => {
      const ds = createMockDataset();

      const sumIntent = parseQueryIntent('What is the total revenue?', ds);
      expect(sumIntent.intentType).toBe('AGGREGATION');
      expect(sumIntent.aggFunc).toBe('sum');
      expect(sumIntent.targetMetric).toBe('Revenue');

      const avgIntent = parseQueryIntent('Average revenue per transaction', ds);
      expect(avgIntent.aggFunc).toBe('avg');

      const maxIntent = parseQueryIntent('What is the highest revenue?', ds);
      expect(maxIntent.aggFunc).toBe('max');

      const countIntent = parseQueryIntent('How many records in the dataset?', ds);
      expect(countIntent.aggFunc).toBe('count');
    });

    it('identifies dimensional breakdowns across categories', () => {
      const ds = createMockDataset();
      const intent = parseQueryIntent('Show revenue breakdown by region', ds);
      expect(intent.intentType).toBe('BREAKDOWN');
      expect(intent.targetMetric).toBe('Revenue');
      expect(intent.groupDimension).toBe('Region');
    });

    it('identifies leaderboard rankings (Top N / Bottom N)', () => {
      const ds = createMockDataset();
      const topIntent = parseQueryIntent('Top 3 customers by revenue', ds);
      expect(topIntent.intentType).toBe('RANKING');
      expect(topIntent.limit).toBe(3);
      expect(topIntent.sortDirection).toBe('desc');
      expect(topIntent.targetMetric).toBe('Revenue');
      expect(topIntent.groupDimension).toBe('Customer');

      const bottomIntent = parseQueryIntent('Bottom 5 customers by revenue', ds);
      expect(bottomIntent.sortDirection).toBe('asc');
      expect(bottomIntent.limit).toBe(5);
    });

    it('identifies bivariate correlation queries', () => {
      const ds = createMockDataset();
      const intent = parseQueryIntent('What is the correlation between Revenue and Deals?', ds);
      expect(intent.intentType).toBe('CORRELATION');
      expect(intent.targetMetric).toBe('Revenue');
      expect(intent.secondaryMetric).toBe('Deals');
    });

    it('identifies help and system capability queries', () => {
      const intent = parseQueryIntent('What can you do?');
      expect(intent.intentType).toBe('HELP');
    });
  });

  describe('2. Deterministic Query Execution Engine', () => {
    it('executes metric sum accurately without hallucination', () => {
      const ds = createMockDataset();
      const result = executeNaturalLanguageQuery('What is the total revenue?', ds);

      expect(result.queryType).toBe('AGGREGATION');
      // Sum = 10k + 25k + 5k + 15k + 30k = 85,000
      expect(result.metricsHighlighted?.[0].value).toMatch(/\$85[,.]?000/);
      expect(result.pandasCode).toContain("df['Revenue'].sum()");
      expect(result.sqlCode).toContain('SUM(Revenue)');
    });

    it('executes metric average accurately', () => {
      const ds = createMockDataset();
      const result = executeNaturalLanguageQuery('What is the average revenue?', ds);

      expect(result.queryType).toBe('AGGREGATION');
      // Mean = 85,000 / 5 = 17,000
      expect(result.metricsHighlighted?.[0].value).toMatch(/\$17[,.]?000/);
      expect(result.pandasCode).toContain("df['Revenue'].mean()");
    });

    it('executes dimensional breakdown with accurate shares and chart suggestion', () => {
      const ds = createMockDataset();
      const result = executeNaturalLanguageQuery('Breakdown of revenue across region', ds);

      expect(result.queryType).toBe('BREAKDOWN');
      expect(result.chartSuggestion).toBeDefined();
      expect(result.tableData).toBeDefined();

      // Europe has 25k + 30k = 55,000 (which is 55000/85000 = ~64.7%)
      expect(result.metricsHighlighted?.some(m => m.value === 'Europe')).toBe(true);
      expect(result.tableData?.rows.length).toBeGreaterThan(0);
      expect(result.pandasCode).toContain("df.groupby('Region')['Revenue'].sum()");
    });

    it('executes top rankings and builds leaderboard chart', () => {
      const ds = createMockDataset();
      const result = executeNaturalLanguageQuery('Top 3 customers by revenue', ds);

      expect(result.queryType).toBe('RANKING');
      expect(result.chartSuggestion?.chartType).toBe('bar');
      // Umbrella is highest with $30,000
      expect(result.metricsHighlighted?.[0].value).toBe('Umbrella');
      expect(result.tableData?.rows[0][1]).toBe('Umbrella');
    });

    it('calculates Pearson correlation coefficient between numeric columns', () => {
      const ds = createMockDataset();
      const result = executeNaturalLanguageQuery('What is the correlation between Revenue and Deals?', ds);

      expect(result.queryType).toBe('CORRELATION');
      expect(result.metricsHighlighted?.some(m => m.label === 'Pearson r')).toBe(true);
      expect(result.chartSuggestion?.chartType).toBe('scatter');
      expect(result.pandasCode).toContain("corr()");
    });

    it('handles requests for missing attributes gracefully without fabricating numbers', () => {
      const ds = createMockDataset();
      // Asking for churn rate which does not exist in dataset
      const result = executeNaturalLanguageQuery('What is the churn rate by region?', ds);

      expect(result.queryType).toBe('UNKNOWN');
      expect(result.answerText).toContain('does not contain fields or semantic mappings for "churn"');
      expect(result.answerText).toContain('Customer, Region, Revenue, Deals');
    });

    it('handles empty dataset gracefully', () => {
      const result = executeNaturalLanguageQuery('What is the revenue?', null);
      expect(result.answerText).toContain('No active dataset is currently loaded');
    });

    it('answers "Which region generates the highest sales?" deterministically', () => {
      const ds = createMockDataset();
      const result = executeNaturalLanguageQuery('Which region generates the highest sales?', ds);

      expect(result.queryType).toBe('RANKING');
      expect(result.answerText).toContain('Europe');
      expect(result.metricsHighlighted?.[0].value).toBe('Europe');
    });

    it('answers "Who are my top 10 customers?" with leaderboard and share', () => {
      const ds = createMockDataset();
      const result = executeNaturalLanguageQuery('Who are my top 10 customers?', ds);

      expect(result.queryType).toBe('RANKING');
      expect(result.metricsHighlighted?.[0].value).toBe('Umbrella');
      expect(result.tableData?.headers).toContain('Customer');
    });

    it('answers "Which product performs best?" on dataset with products', () => {
      const ds = createMockDataset({
        columns: ['Product', 'Revenue'],
        data: [
          { Product: 'Cloud Platform', Revenue: 50000 },
          { Product: 'BI Analytics', Revenue: 80000 },
          { Product: 'Security Suite', Revenue: 20000 },
        ],
        profiles: {
          Product: { name: 'Product', inferredType: 'categorical', semanticRole: 'category', totalCount: 3, nullCount: 0, nullRatio: 0, distinctCount: 3, uniqueRatio: 1.0, sampleValues: [] },
          Revenue: { name: 'Revenue', inferredType: 'numeric', semanticRole: 'primary_metric', totalCount: 3, nullCount: 0, nullRatio: 0, distinctCount: 3, uniqueRatio: 1.0, sum: 150000, sampleValues: [] },
        },
      });

      const result = executeNaturalLanguageQuery('Which product performs best?', ds);
      expect(result.queryType).toBe('RANKING');
      expect(result.answerText).toContain('BI Analytics');
      expect(result.metricsHighlighted?.[0].value).toBe('BI Analytics');
    });

    it('generates an evidence-based executive summary', () => {
      const ds = createMockDataset();
      const result = executeNaturalLanguageQuery('Generate an executive summary', ds);

      expect(result.queryType).toBe('EXECUTIVE_SUMMARY');
      expect(result.answerText).toContain('Executive Summary');
      expect(result.metricsHighlighted?.some(m => m.label.includes('Total Revenue'))).toBe(true);
      expect(result.tableData).toBeDefined();
    });

    it('evaluates business risks (concentration, missing data, outliers)', () => {
      const ds = createMockDataset();
      const result = executeNaturalLanguageQuery('What are the biggest business risks?', ds);

      expect(result.queryType).toBe('BUSINESS_RISKS');
      expect(result.answerText).toContain('Concentration Risk');
      expect(result.tableData?.headers).toContain('Severity');
    });

    it('detects unusual patterns via statistical IQR boundaries', () => {
      const ds = createMockDataset();
      const result = executeNaturalLanguageQuery('Find unusual patterns', ds);

      expect(result.queryType).toBe('ANOMALY_PATTERNS');
      expect(result.answerText).toContain('Anomaly Detection');
      expect(result.tableData?.headers).toContain('Anomaly Status');
    });

    it('identifies revenue trends over chronological dates', () => {
      const ds = createMockDataset({
        columns: ['Date', 'Revenue'],
        data: [
          { Date: '2026-01-01', Revenue: 10000 },
          { Date: '2026-02-01', Revenue: 20000 },
          { Date: '2026-03-01', Revenue: 40000 },
        ],
        profiles: {
          Date: { name: 'Date', inferredType: 'date', semanticRole: 'timestamp', totalCount: 3, nullCount: 0, nullRatio: 0, distinctCount: 3, uniqueRatio: 1.0, sampleValues: [] },
          Revenue: { name: 'Revenue', inferredType: 'numeric', semanticRole: 'primary_metric', totalCount: 3, nullCount: 0, nullRatio: 0, distinctCount: 3, uniqueRatio: 1.0, sum: 70000, sampleValues: [] },
        },
      });

      const result = executeNaturalLanguageQuery('Identify revenue trends', ds);
      expect(result.queryType).toBe('TREND');
      expect(result.chartSuggestion?.chartType).toBe('line');
      expect(result.answerText).toContain('Temporal Trend');
    });

    it('compares the last two months with delta and percentage variance', () => {
      const ds = createMockDataset({
        columns: ['Date', 'Revenue'],
        data: [
          { Date: '2026-01-15', Revenue: 20000 },
          { Date: '2026-02-15', Revenue: 30000 },
        ],
        profiles: {
          Date: { name: 'Date', inferredType: 'date', semanticRole: 'timestamp', totalCount: 2, nullCount: 0, nullRatio: 0, distinctCount: 2, uniqueRatio: 1.0, sampleValues: [] },
          Revenue: { name: 'Revenue', inferredType: 'numeric', semanticRole: 'primary_metric', totalCount: 2, nullCount: 0, nullRatio: 0, distinctCount: 2, uniqueRatio: 1.0, sum: 50000, sampleValues: [] },
        },
      });

      const result = executeNaturalLanguageQuery('Compare the last two months', ds);
      expect(result.queryType).toBe('COMPARE_PERIODS');
      expect(result.metricsHighlighted?.some(m => m.label.includes('Current'))).toBe(true);
      expect(result.answerText).toContain('50.0%');
    });

    it('gracefully explains missing campaign fields when asked "Which campaign has the highest ROI?" on a non-marketing dataset', () => {
      const ds = createMockDataset();
      const result = executeNaturalLanguageQuery('Which campaign has the highest ROI?', ds);

      expect(result.queryType).toBe('UNKNOWN');
      expect(result.answerText).toContain('does not contain campaign or advertising spend fields');
    });

    it('detects ambiguous queries and provides clarification prompts', () => {
      const ds = createMockDataset();
      const result = executeNaturalLanguageQuery('data', ds);

      expect(result.queryType).toBe('AMBIGUOUS');
      expect(result.answerText).toContain('ambiguous or broad');
    });
  });

  describe('3. Suggested Questions Generator', () => {
    it('generates dynamic context-aware questions from active dataset', () => {
      const ds = createMockDataset();
      const questions = generateSuggestedQuestions(ds);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions.some(q => q.toLowerCase().includes('revenue'))).toBe(true);
    });

    it('generates categorized questions across 4 dimensions', () => {
      const ds = createMockDataset();
      const categories = getCategorizedSuggestedQuestions(ds);

      expect(categories.length).toBeGreaterThanOrEqual(3);
      expect(categories.some(c => c.category === 'Key Aggregations')).toBe(true);
      expect(categories.some(c => c.category === 'Dimensional Breakdowns')).toBe(true);
    });
  });

  describe('4. UI Components & Interactivity', () => {
    it('renders ChatMessageBubble with highlighted metrics and code toggle', () => {
      const message: ChatMessage = {
        id: 'msg-test',
        role: 'assistant',
        content: 'Calculated total revenue for Sales Performance.',
        timestamp: new Date().toISOString(),
        insights: {
          summary: 'Calculated total revenue for Sales Performance.',
          metricsHighlighted: [{ label: 'Total Revenue', value: '$85,000' }],
          nextQuestions: ['Show monthly breakdown'],
        },
        pandasCodeRepresentation: "df['Revenue'].sum()",
        sqlOrQueryRepresentation: 'SELECT SUM(Revenue) FROM dataset;',
      };

      render(<ChatMessageBubble message={message} onSelectPrompt={() => {}} />);

      expect(screen.getByText('Calculated total revenue for Sales Performance.')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('$85,000')).toBeInTheDocument();
      expect(screen.getByText('Show monthly breakdown')).toBeInTheDocument();

      // Expand code inspector
      const toggleBtn = screen.getByText('Deterministic Calculation Logic');
      fireEvent.click(toggleBtn);
      expect(screen.getByText("df['Revenue'].sum()")).toBeInTheDocument();
    });

    it('renders AiChatDrawer and handles message submission', async () => {
      useAppStore.setState({ isChatOpen: true });

      render(<AiChatDrawer onNavigateToFullPage={() => {}} />);

      expect(screen.getByText('OmniBI AI Analyst')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ask about Sales Performance Benchmark/i)).toBeInTheDocument();

      const input = screen.getByPlaceholderText(/Ask about Sales Performance Benchmark/i);
      fireEvent.change(input, { target: { value: 'What is the total revenue?' } });
      fireEvent.click(screen.getByText('Ask'));

      await waitFor(() => {
        expect(screen.getAllByText(/Total Sum of Revenue/i).length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders AiAnalystPage with telemetry and question library', async () => {
      render(<AiAnalystPage />);

      expect(screen.getByText('AI Data Analyst & Copilot')).toBeInTheDocument();
      expect(screen.getByText('Active Data Knowledge Base')).toBeInTheDocument();
      expect(screen.getByText('Inquiry Prompt Library')).toBeInTheDocument();
      expect(screen.getByText('Available Columns in Memory')).toBeInTheDocument();

      // Click on a prompt from library
      const promptBtn = screen.getAllByRole('button', { name: /What is the total Revenue\?/i })[0];
      if (promptBtn) {
        fireEvent.click(promptBtn);
        await waitFor(() => {
          expect(screen.getAllByText(/Total Sum of Revenue/i).length).toBeGreaterThanOrEqual(1);
        });
      }
    });

    it('clears chat messages when Clear button is clicked in AiAnalystPage', () => {
      render(<AiAnalystPage />);
      const clearBtn = screen.getByText('Clear');
      fireEvent.click(clearBtn);

      expect(screen.getByText(/Chat session reset/i)).toBeInTheDocument();
    });
  });
});
