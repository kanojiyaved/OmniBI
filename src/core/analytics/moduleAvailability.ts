import { Dataset } from '../../types';

export interface ModuleAvailabilityResult {
  isAvailable: boolean;
  moduleName: string;
  missingRequirements: string[];
  detectedColumns: Record<string, string>;
  reason: string;
}

/**
 * Determines whether Deal Management analytics can be generated from the dataset.
 * Requires: Deal title/name/entity AND amount/value metric.
 */
export const checkDealManagementAvailability = (dataset: Dataset | null): ModuleAvailabilityResult => {
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    return {
      isAvailable: false,
      moduleName: 'Deal Management',
      missingRequirements: ['Active dataset with records', 'Deal/Opportunity entity column', 'Deal Amount/Value column'],
      detectedColumns: {},
      reason: 'No dataset is currently uploaded or mounted.',
    };
  }

  const { columns, profiles = {}, semanticMappings = {}, detectedDomain } = dataset;
  const detectedCols: Record<string, string> = {};
  const missing: string[] = [];

  // Deal Name / Opportunity Entity
  const dealCol = columns.find((c) => {
    const role = semanticMappings[c]?.role || profiles[c]?.semanticRole;
    return role === 'entity_id' || /deal|opportunity|lead|contract|account|company|client/i.test(c);
  });
  if (dealCol) detectedCols['Deal / Entity'] = dealCol;
  else missing.push('Deal / Account name column');

  // Amount / Value
  const amountCol = columns.find((c) => {
    const role = semanticMappings[c]?.role || profiles[c]?.semanticRole;
    return role === 'primary_metric' || /amount|deal_size|value|revenue|price/i.test(c);
  }) || columns.find((c) => ['currency', 'numeric'].includes(profiles[c]?.inferredType));
  if (amountCol) detectedCols['Deal Amount'] = amountCol;
  else missing.push('Deal value/amount numerical column');

  // Stage / Status (Optional but desirable)
  const stageCol = columns.find((c) => {
    const role = semanticMappings[c]?.role || profiles[c]?.semanticRole;
    return role === 'status' || /stage|status|pipeline|phase/i.test(c);
  });
  if (stageCol) detectedCols['Pipeline Stage'] = stageCol;

  const isAvailable = Boolean(dealCol && amountCol);

  return {
    isAvailable,
    moduleName: 'Deal Management',
    missingRequirements: missing,
    detectedColumns: detectedCols,
    reason: isAvailable
      ? `Deal analytics derived from ${dealCol} and ${amountCol}.`
      : `Dataset is classified as ${detectedDomain?.domain || 'general'}. Deal management requires deal/opportunity names and deal values.`,
  };
};

/**
 * Determines whether Campaign Management can be generated from the dataset.
 * Requires: Campaign / Channel / Ad dimension AND marketing metric (impressions, clicks, spend, conversions).
 */
export const checkCampaignManagementAvailability = (dataset: Dataset | null): ModuleAvailabilityResult => {
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    return {
      isAvailable: false,
      moduleName: 'Campaign Management',
      missingRequirements: ['Active dataset with records', 'Campaign/Channel column', 'Marketing metric column'],
      detectedColumns: {},
      reason: 'No dataset is currently uploaded or mounted.',
    };
  }

  const { columns, profiles = {}, semanticMappings = {}, detectedDomain } = dataset;
  const detectedCols: Record<string, string> = {};
  const missing: string[] = [];

  const campaignCol = columns.find((c) => {
    const role = semanticMappings[c]?.role || profiles[c]?.semanticRole;
    return role === 'dimension' || role === 'category' || /campaign|ad|channel|medium|source|platform/i.test(c);
  });
  if (campaignCol && /campaign|ad|channel|medium|source|platform/i.test(campaignCol)) {
    detectedCols['Campaign / Channel'] = campaignCol;
  } else {
    missing.push('Campaign name or acquisition channel column');
  }

  const marketingMetric = columns.find((c) => {
    return /spend|cost|impression|click|conversion|cpc|cpa|roas|ctr/i.test(c);
  });
  if (marketingMetric) {
    detectedCols['Marketing Metric'] = marketingMetric;
  } else {
    missing.push('Marketing performance metric (spend, clicks, impressions, or conversions)');
  }

  const isAvailable = Boolean(detectedCols['Campaign / Channel'] && detectedCols['Marketing Metric']);

  return {
    isAvailable,
    moduleName: 'Campaign Management',
    missingRequirements: missing,
    detectedColumns: detectedCols,
    reason: isAvailable
      ? `Campaign analytics derived from ${detectedCols['Campaign / Channel']} and ${detectedCols['Marketing Metric']}.`
      : `Dataset is classified as ${detectedDomain?.domain || 'general'}. Campaign management requires marketing dimensions and performance metrics.`,
  };
};

/**
 * Determines whether Sales Pipeline can be generated from the dataset.
 * Requires: Stage / Status column AND Entity / Value.
 */
export const checkPipelineAvailability = (dataset: Dataset | null): ModuleAvailabilityResult => {
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    return {
      isAvailable: false,
      moduleName: 'Sales Pipeline',
      missingRequirements: ['Active dataset with records', 'Stage/Status column'],
      detectedColumns: {},
      reason: 'No dataset is currently uploaded or mounted.',
    };
  }

  const { columns, profiles = {}, semanticMappings = {}, detectedDomain } = dataset;
  const detectedCols: Record<string, string> = {};
  const missing: string[] = [];

  const stageCol = columns.find((c) => {
    const role = semanticMappings[c]?.role || profiles[c]?.semanticRole;
    return role === 'status' || /stage|pipeline|phase|deal_status/i.test(c);
  });
  if (stageCol) {
    detectedCols['Stage / Status'] = stageCol;
  } else {
    missing.push('Pipeline stage or status column');
  }

  const amountCol = columns.find((c) => {
    const role = semanticMappings[c]?.role || profiles[c]?.semanticRole;
    return role === 'primary_metric' || /amount|value|revenue|deal_size|price|sales/i.test(c);
  }) || columns.find((c) => ['currency', 'numeric'].includes(profiles[c]?.inferredType));
  if (amountCol) detectedCols['Value'] = amountCol;

  const isAvailable = Boolean(stageCol);

  return {
    isAvailable,
    moduleName: 'Sales Pipeline',
    missingRequirements: missing,
    detectedColumns: detectedCols,
    reason: isAvailable
      ? `Pipeline progression generated from ${stageCol}.`
      : `Dataset is classified as ${detectedDomain?.domain || 'general'}. Sales pipeline requires a progression stage or status column.`,
  };
};

/**
 * Determines whether Contact / Customer Management can be generated from the dataset.
 * Requires: Customer, Contact, Client, Lead, or Employee column.
 */
export const checkContactsAvailability = (dataset: Dataset | null): ModuleAvailabilityResult => {
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    return {
      isAvailable: false,
      moduleName: 'Contact Management',
      missingRequirements: ['Active dataset with records', 'Contact / Stakeholder entity column'],
      detectedColumns: {},
      reason: 'No dataset is currently uploaded or mounted.',
    };
  }

  const { columns, profiles = {}, semanticMappings = {}, detectedDomain } = dataset;
  const detectedCols: Record<string, string> = {};
  const missing: string[] = [];

  const contactCol = columns.find((c) => {
    const role = semanticMappings[c]?.role || profiles[c]?.semanticRole;
    return role === 'entity_id' || /name|contact|customer|client|lead|employee|rep|person|member|stakeholder/i.test(c);
  });
  if (contactCol) {
    detectedCols['Stakeholder / Contact'] = contactCol;
  } else {
    missing.push('Customer, contact, client, or employee name column');
  }

  const isAvailable = Boolean(contactCol);

  return {
    isAvailable,
    moduleName: 'Contact Management',
    missingRequirements: missing,
    detectedColumns: detectedCols,
    reason: isAvailable
      ? `Stakeholder directory generated from ${contactCol}.`
      : `Dataset is classified as ${detectedDomain?.domain || 'general'}. Contact management requires stakeholder/customer identifier columns.`,
  };
};

/**
 * Determines whether Calendar can display date-based events.
 * Requires: At least one date or timestamp column.
 */
export const checkCalendarAvailability = (dataset: Dataset | null): ModuleAvailabilityResult => {
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    return {
      isAvailable: false,
      moduleName: 'Calendar & Milestones',
      missingRequirements: ['Active dataset with records', 'Date / Timestamp column'],
      detectedColumns: {},
      reason: 'No dataset is currently uploaded or mounted.',
    };
  }

  const { columns, profiles = {}, semanticMappings = {} } = dataset;
  const detectedCols: Record<string, string> = {};
  const missing: string[] = [];

  const dateCol = columns.find((c) => {
    const role = semanticMappings[c]?.role || profiles[c]?.semanticRole;
    return role === 'timestamp' || profiles[c]?.inferredType === 'date' || /date|time|timestamp|day|month|year|period/i.test(c);
  });
  if (dateCol) {
    detectedCols['Timestamp'] = dateCol;
  } else {
    missing.push('Date or timestamp column');
  }

  const isAvailable = Boolean(dateCol);

  return {
    isAvailable,
    moduleName: 'Calendar & Milestones',
    missingRequirements: missing,
    detectedColumns: detectedCols,
    reason: isAvailable
      ? `Calendar timeline generated from date column "${dateCol}".`
      : 'No date or timestamp column detected in this dataset.',
  };
};

/**
 * Reports & Analytics availability:
 * Requires at least one numeric column (for aggregations, correlations, distributions)
 * and at least one categorical column (for comparisons, distributions).
 */
export const checkReportsAvailability = (dataset: Dataset | null): ModuleAvailabilityResult => {
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    return {
      isAvailable: false,
      moduleName: 'Reports & Analytics',
      missingRequirements: ['Active dataset with records'],
      detectedColumns: {},
      reason: 'No dataset is currently uploaded or mounted.',
    };
  }

  const { columns, profiles = {} } = dataset;
  const numericCols = columns.filter((c) => ['numeric', 'currency', 'percentage'].includes(profiles[c]?.inferredType));
  const catCols = columns.filter((c) => profiles[c]?.inferredType === 'categorical');

  const isAvailable = numericCols.length > 0;

  return {
    isAvailable,
    moduleName: 'Reports & Analytics',
    missingRequirements: isAvailable ? [] : ['At least one numerical metric column'],
    detectedColumns: {
      'Numeric Metrics': numericCols.join(', '),
      'Categories': catCols.join(', '),
    },
    reason: isAvailable
      ? `Full reporting engine available across ${numericCols.length} numerical and ${catCols.length} categorical columns.`
      : 'Reports engine requires at least one numerical column to compute trends, distributions, rankings, or correlations.',
  };
};
