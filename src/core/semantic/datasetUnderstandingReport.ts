import { Dataset, DatasetUnderstandingReport } from '../../types';
import { DOMAIN_ONTOLOGIES } from './domainOntology';

/**
 * Deterministically generates an AI Dataset Understanding Report analyzing schema capabilities,
 * derived business metrics, available analytics views, and columns requiring user confirmation.
 */
export const generateDatasetUnderstandingReport = (
  dataset: Dataset
): DatasetUnderstandingReport => {
  const { columns, detectedDomain, semanticMappings = {}, rowCount, columnCount } = dataset;
  const domainKey = detectedDomain?.domain || 'general';
  const ontology = DOMAIN_ONTOLOGIES[domainKey] || DOMAIN_ONTOLOGIES.general;

  // 1. What the dataset represents
  const datasetRepresentation = 
    `This dataset represents an enterprise ${ontology.label} operational ledger containing ` +
    `${rowCount.toLocaleString()} records across ${columnCount} structured attributes. ` +
    `Automated schema diagnostics have classified this data with ` +
    `${Math.round((detectedDomain?.confidence || 0.8) * 100)}% confidence into the ` +
    `"${ontology.label}" domain (${ontology.description}).`;

  // 2. What business metrics can be calculated
  const calculatedMetricsAvailable: string[] = [];
  const primaryMetrics = Object.values(semanticMappings).filter((m) => m.role === 'primary_metric');
  const secondaryMetrics = Object.values(semanticMappings).filter((m) => m.role === 'secondary_metric');
  const entities = Object.values(semanticMappings).filter((m) => m.role === 'entity_id');
  const timestamps = Object.values(semanticMappings).filter((m) => m.role === 'timestamp');

  if (primaryMetrics.length > 0) {
    calculatedMetricsAvailable.push(`Total ${primaryMetrics[0].column.replace(/_/g, ' ').toUpperCase()} (Cumulative Financial / Volume Aggregation)`);
    calculatedMetricsAvailable.push(`Average ${primaryMetrics[0].column.replace(/_/g, ' ').toUpperCase()} per Record (Unit Economics)`);
  }

  if (entities.length > 0) {
    calculatedMetricsAvailable.push(`Distinct ${entities[0].column.replace(/_/g, ' ').toUpperCase()} Count (Unique Audience / Cohort Size)`);
  }

  if (secondaryMetrics.length > 0) {
    calculatedMetricsAvailable.push(`Total ${secondaryMetrics[0].column.replace(/_/g, ' ').toUpperCase()} & Secondary Rate Allocations`);
  }

  if (timestamps.length > 0) {
    calculatedMetricsAvailable.push(`Period-over-Period (MoM) Growth Rate & Sequential Sparkline Trajectory`);
  }

  calculatedMetricsAvailable.push(`Total Transaction Volume & Throughput Velocity (${rowCount.toLocaleString()} Total Records)`);

  // 3. Which analytics modules are available & unavailable
  const availableModules: DatasetUnderstandingReport['availableModules'] = [
    {
      name: 'Executive Overview & KPI Cards',
      description: 'High-level executive metrics, historical sparklines, and macro business indicators.',
      status: 'available',
    },
    {
      name: 'Data Profiling & Quality Diagnostics',
      description: 'Column statistical dispersion, IQR outlier detection, and non-destructive data cleaning.',
      status: 'available',
    },
  ];

  const unavailableModules: DatasetUnderstandingReport['unavailableModules'] = [];

  // Check Sales Pipeline
  const hasStage = Object.values(semanticMappings).some((m) => m.role === 'status' || /stage|deal/i.test(m.column));
  if (hasStage || domainKey === 'sales') {
    availableModules.push({
      name: 'Sales Pipeline & Deal Management',
      description: 'Stage-by-stage opportunity tracking, deal velocity, and win/loss conversion rates.',
      status: 'available',
    });
  } else {
    unavailableModules.push({
      name: 'Sales Pipeline & Deal Management',
      reason: 'No sales opportunity stage or deal status column identified in this dataset.',
      status: 'unavailable',
    });
  }

  // Check Campaign Management
  const hasCampaign = Object.values(semanticMappings).some((m) => /campaign|ad_spend|cpc|impression|click|utm/i.test(m.column));
  if (hasCampaign || domainKey === 'marketing') {
    availableModules.push({
      name: 'Marketing Campaign Performance',
      description: 'Ad spend tracking, cost per acquisition (CPA/CPC), and multichannel attribution.',
      status: 'available',
    });
  } else {
    unavailableModules.push({
      name: 'Marketing Campaign Performance',
      reason: 'No ad spend, CPC, or marketing campaign attribution columns detected in dataset.',
      status: 'unavailable',
    });
  }

  // Check Customer Retention / Cohorts
  const hasCustomer = Object.values(semanticMappings).some((m) => /customer|client|buyer|user_id/i.test(m.column));
  if (hasCustomer || domainKey === 'customer_analytics' || domainKey === 'saas') {
    availableModules.push({
      name: 'Customer Analytics & Retention',
      description: 'Cohort repeat purchase rates, customer lifetime value (LTV), and account segmentation.',
      status: 'available',
    });
  } else {
    unavailableModules.push({
      name: 'Customer Analytics & Retention',
      reason: 'No distinct customer, client, or user entity identifier recognized.',
      status: 'unavailable',
    });
  }

  // 4. Columns requiring user confirmation (confidence < 0.70 or explicit flag)
  const columnsRequiringConfirmation = columns
    .filter((col) => semanticMappings[col]?.requiresConfirmation || (semanticMappings[col]?.confidence ?? 1) < 0.70)
    .map((col) => ({
      column: col,
      suggestedMeaning: semanticMappings[col]?.suggestedMeaning || 'Ambiguous Attribute',
      confidence: semanticMappings[col]?.confidence || 0.55,
      reason: semanticMappings[col]?.description || 'Confidence below 70% threshold; please review suggested role.',
    }));

  return {
    datasetRepresentation,
    calculatedMetricsAvailable,
    availableModules,
    unavailableModules,
    columnsRequiringConfirmation,
  };
};
