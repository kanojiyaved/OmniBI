// ==========================================
// UNIVERSAL AI BI PLATFORM - TYPE DEFINITIONS
// ==========================================

export type DataType = 
  | 'numeric' 
  | 'date' 
  | 'boolean' 
  | 'categorical' 
  | 'text' 
  | 'id' 
  | 'currency' 
  | 'percentage' 
  | 'geographic';

export type BusinessDomain = 
  | 'sales'
  | 'marketing'
  | 'finance'
  | 'ecommerce'
  | 'customer_analytics'
  | 'hr'
  | 'inventory'
  | 'operations'
  | 'saas'
  | 'financial'
  | 'healthcare'
  | 'supply_chain'
  | 'general';

export type SemanticRole = 
  | 'timestamp' 
  | 'primary_metric' 
  | 'secondary_metric' 
  | 'dimension' 
  | 'entity_id' 
  | 'category' 
  | 'status' 
  | 'geo' 
  | 'attribute';

export interface ColumnProfile {
  name: string;
  inferredType: DataType;
  semanticRole: SemanticRole;
  totalCount: number;
  nullCount: number;
  distinctCount: number;
  uniqueRatio: number;
  nullRatio: number;
  sampleValues: any[];
  // Numeric metrics (undefined for non-numeric)
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  sum?: number;
  q25?: number;
  q75?: number;
  iqr?: number;
  outlierCount?: number;
  // Categorical metrics
  topFrequencies?: { value: string; count: number; percentage: number }[];
  // Date metrics
  minDate?: string;
  maxDate?: string;
  dateGranularity?: 'year' | 'month' | 'day' | 'hour';
}

export interface DatasetQualityReport {
  overallScore: number; // 0 to 100
  healthScore?: number; // Alias for overallScore (0 to 100)
  outliersCount?: number; // Count of detected outliers
  totalRows: number;
  totalColumns: number;
  duplicateRowsCount: number;
  missingCellsCount: number;
  missingDataPercentage: number;
  anomaliesDetected: {
    column: string;
    type: 'outliers' | 'mixed_types' | 'high_nulls' | 'constant_value' | 'suspicious_id' | 'invalid_dates';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
}

export interface CleaningHistoryItem {
  id: string;
  timestamp: string;
  action: 'drop_duplicates' | 'impute_missing' | 'standardize_categories' | 'convert_type';
  columnName?: string;
  summary: string;
  affectedRows: number;
  previousRows: Record<string, any>[];
}

export interface ColumnSemanticMapping {
  column: string;
  role: SemanticRole;
  suggestedMeaning: string;
  confidence: number; // 0 to 1
  requiresConfirmation: boolean;
  confirmed?: boolean;
  description: string;
}

export interface DatasetUnderstandingReport {
  datasetRepresentation: string;
  calculatedMetricsAvailable: string[];
  availableModules: { name: string; description: string; status: 'available' }[];
  unavailableModules: { name: string; reason: string; status: 'unavailable' }[];
  columnsRequiringConfirmation: {
    column: string;
    suggestedMeaning: string;
    confidence: number;
    reason: string;
  }[];
}

export interface Dataset {
  id: string;
  name: string;
  fileName: string;
  fileFormat: 'csv' | 'xlsx' | 'xls';
  fileSize: number;
  uploadedAt: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  data: Record<string, any>[];
  rawRows?: Record<string, any>[];
  cleaningHistory?: CleaningHistoryItem[];
  availableSheets: string[];
  activeSheet?: string;
  processingStatus: 'ready' | 'processing' | 'error';
  errorMessage?: string;
  profiles: Record<string, ColumnProfile>;
  quality: DatasetQualityReport;
  detectedDomain: {
    domain: BusinessDomain;
    confidence: number; // 0 to 1
    reasoning: string[];
    domainLabel: string;
  };
  semanticMappings: Record<string, ColumnSemanticMapping>;
  understandingReport?: DatasetUnderstandingReport;
  tenantId?: string;
  ownerId?: string;
}

// Metrics & KPIs
export type AggregationType = 'sum' | 'avg' | 'count' | 'unique_count' | 'min' | 'max' | 'median' | 'growth_mom';

export type AggregationMethod = 
  | 'SUM' 
  | 'COUNT' 
  | 'DISTINCT_COUNT' 
  | 'AVERAGE' 
  | 'MEDIAN' 
  | 'MIN' 
  | 'MAX' 
  | 'RATIO' 
  | 'PERCENTAGE' 
  | 'GROWTH';

export interface ComparisonPeriod {
  previousValue: number;
  currentValue: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'neutral';
}

export type MetricAvailabilityStatus = 'available' | 'unavailable' | 'insufficient_data';

export interface RegistryMetricDefinition {
  metricId: string;
  metricName: string;
  domain: BusinessDomain;
  formula: string;
  requiredColumns: string[];
  matchedColumns: Record<string, string>;
  aggregationMethod: AggregationMethod;
  calculatedValue: number | null;
  formattedValue: string;
  dataProvenance: string;
  comparisonPeriod?: ComparisonPeriod;
  confidence: number;
  availabilityStatus: MetricAvailabilityStatus;
  unavailabilityReason?: string;
  isPositiveGood: boolean;
  sparklineData?: number[];
  category: string;
}

export interface DynamicKPIRegistry {
  datasetId: string;
  domain: BusinessDomain;
  totalMetricsCount: number;
  availableMetricsCount: number;
  metrics: RegistryMetricDefinition[];
  activeKPIs: RegistryMetricDefinition[];
}

export interface KPIDefinition {
  id: string;
  label: string;
  description: string;
  columnName?: string;
  aggregation: AggregationType;
  format: 'currency' | 'number' | 'percentage' | 'compact';
  value: number;
  previousValue?: number;
  changePercentage?: number;
  trend: 'up' | 'down' | 'neutral';
  isPositiveGood: boolean;
  benchmark?: number;
  sparklineData?: number[];
  category: string;
  // Optional Registry Metadata
  metricId?: string;
  formula?: string;
  dataProvenance?: string;
  availabilityStatus?: MetricAvailabilityStatus;
}

// Chart Definitions
export type ChartType = 
  | 'line' 
  | 'area' 
  | 'bar' 
  | 'horizontal_bar' 
  | 'donut' 
  | 'scatter' 
  | 'treemap' 
  | 'heatmap' 
  | 'funnel' 
  | 'radar';

export interface ChartSpecification {
  id: string;
  title: string;
  subtitle?: string;
  chartType: ChartType;
  xAxisColumn: string;
  yAxisColumns: string[];
  aggregation?: AggregationType;
  colorScheme?: string[];
  isStacked?: boolean;
  isSmooth?: boolean;
  showLegend?: boolean;
  description?: string;
  importance: 'primary' | 'secondary' | 'supplementary';
  data?: any[];
}

// Global Filtering
export type FilterOperator = 'equals' | 'in' | 'between' | 'greaterThan' | 'lessThan' | 'contains';

export interface FilterCondition {
  id: string;
  columnName: string;
  operator: FilterOperator;
  value: any;
  enabled: boolean;
}

export interface GlobalFilterState {
  dateRange: { start: string | null; end: string | null };
  categoricalFilters: Record<string, string[]>;
  numericRanges: Record<string, { min?: number; max?: number }>;
  activeCrossFilter: { column: string; value: any } | null;
  searchQuery: string;
}

export interface SavedFilterCombination {
  id: string;
  name: string;
  datasetId?: string;
  filters: GlobalFilterState;
  createdAt: string;
}

// AI Data Analyst
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  insights?: {
    summary: string;
    metricsHighlighted?: { label: string; value: string }[];
    chartSuggestion?: ChartSpecification;
    rootCauses?: string[];
    nextQuestions?: string[];
  };
  sqlOrQueryRepresentation?: string;
  pandasCodeRepresentation?: string;
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
}

// ==========================================
// STAGE 10: STORAGE, EXPORT & SECURITY TYPES
// ==========================================

export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf' | 'png';

export interface ExportOptions {
  format: ExportFormat;
  scope: 'filtered' | 'full';
  filename?: string;
  delimiter?: ',' | ';' | '\t';
  includeBOM?: boolean;
  maskPII?: boolean;
  preventFormulaInjection?: boolean;
  excelSheets?: {
    includeData?: boolean;
    includeKPIs?: boolean;
    includeProfiling?: boolean;
  };
  pdfOptions?: {
    title?: string;
    includeKPIs?: boolean;
    includeCharts?: boolean;
    includeInsights?: boolean;
    pageOrientation?: 'portrait' | 'landscape';
  };
}

export interface StorageMetadata {
  datasetId: string;
  datasetName: string;
  rowCount: number;
  columnCount: number;
  byteSize: number;
  savedAt: string;
  version: number;
  tenantId?: string;
}

export interface StorageQuotaInfo {
  usageBytes: number;
  usageFormatted: string;
  persistedCount: number;
  backendSupported: boolean;
  indexedDbAvailable: boolean;
}

export interface SecurityPolicyConfig {
  preventFormulaInjection: boolean;
  maskEmails: boolean;
  maskPhoneNumbers: boolean;
  maskCreditCards: boolean;
  encryptLocalStorage: boolean;
}

// User Roles & Access Control (RBAC)
export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  avatarUrl?: string;
  createdAt: string;
}

export type ActionPermission =
  | 'dataset:upload'
  | 'dataset:replace'
  | 'dataset:delete'
  | 'dataset:clean'
  | 'dataset:export'
  | 'ai:query'
  | 'storage:purge'
  | 'security:configure';

export interface DatasetHistoryItem {
  id: string;
  datasetId: string;
  action: 'uploaded' | 'switched' | 'cleaned' | 'replaced' | 'exported' | 'deleted';
  timestamp: string;
  details: string;
  userId?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultExportFormat: ExportFormat;
  defaultCsvDelimiter: ',' | ';' | '\t';
  preventFormulaInjection: boolean;
  maskPII: boolean;
  localProcessingOnly: boolean;
  cloudAiConsent: boolean;
  dataRetentionPolicy: 'session_only' | '7_days' | '30_days' | 'indefinite';
}

