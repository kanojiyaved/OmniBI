import { ColumnProfile, BusinessDomain, ColumnSemanticMapping } from '../../types';
import { DOMAIN_ONTOLOGIES } from './domainOntology';

const normalize = (str: string): string =>
  str.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').trim();

/**
 * Intelligent semantic mapper that infers semantic meaning, role, and confidence
 * for familiar and unfamiliar column names across disparate business domains.
 */
export const inferColumnSemanticRole = (
  columnName: string,
  profile?: ColumnProfile,
  domain: BusinessDomain = 'general'
): ColumnSemanticMapping => {
  const norm = normalize(columnName);
  const inferredType = profile?.inferredType || 'text';
  const ontology = DOMAIN_ONTOLOGIES[domain] || DOMAIN_ONTOLOGIES.general;
  const sampleValues = profile?.sampleValues || [];
  const stringSamples = sampleValues.map((v) => String(v).trim().toLowerCase());
  const uniqueRatio = profile?.uniqueRatio ?? 0;
  const distinctCount = profile?.distinctCount ?? 0;
  const totalCount = profile?.totalCount ?? 0;

  // =========================================================================
  // 1. TEMPORAL DATES & TIMESTAMPS
  // e.g. Order_Date, Transaction_Date, Invoice_Date, Txn_Dt, Order_Dt, Created_At
  // =========================================================================
  const isDateName = /(?:^|_)(date|dt|timestamp|time|created|updated|period|day|month|year|fiscal|quarter|inv_date|txn_dt|order_dt|signup_dt)(?:_|$)/i.test(norm);
  const isDateType = inferredType === 'date';

  if (isDateType || isDateName) {
    let confidence = 0.95;
    if (isDateType && isDateName) confidence = 0.98;
    else if (!isDateType && isDateName) confidence = 0.82;
    else if (isDateType && !isDateName) confidence = 0.78;

    return {
      column: columnName,
      role: 'timestamp',
      suggestedMeaning: 'Temporal Transaction / Event Date',
      confidence,
      requiresConfirmation: confidence < 0.70,
      description: isDateType 
        ? `Validated ISO temporal date values found in "${columnName}".`
        : `Temporal date pattern recognized from column header "${columnName}".`,
    };
  }

  // =========================================================================
  // 2. CUSTOMER & ENTITY IDENTIFIERS
  // e.g. Customer, Client, Buyer, Customer_Name, Cust_Name, User_Id, Account_No
  // =========================================================================
  const isCustomerEntity = /(?:^|_)(customer|client|buyer|customer_name|cust_name|client_name|buyer_name|account_name)(?:_|$)/i.test(norm);
  const isGenericId = /(?:^|_)(id|uuid|guid|code|sku|key|number|ref|token|acc_no|deal_id|emp_id|order_no)(?:_|$)/i.test(norm);
  const isHighUniqueness = totalCount > 5 && uniqueRatio >= 0.85;

  if (isCustomerEntity) {
    const confidence = isHighUniqueness || inferredType === 'id' || inferredType === 'text' ? 0.94 : 0.84;
    return {
      column: columnName,
      role: 'entity_id',
      suggestedMeaning: 'Customer / Buyer Entity Identifier',
      confidence,
      requiresConfirmation: confidence < 0.70,
      description: `Identifies unique customer, buyer, or client entity from "${columnName}".`,
    };
  }

  if (inferredType === 'id' || isGenericId || (isHighUniqueness && /code|num|key|id/i.test(norm))) {
    const confidence = inferredType === 'id' ? 0.95 : 0.88;
    return {
      column: columnName,
      role: 'entity_id',
      suggestedMeaning: 'Unique Entity / Transaction Key',
      confidence,
      requiresConfirmation: confidence < 0.70,
      description: `Unique alphanumeric identifier or primary key for "${columnName}".`,
    };
  }

  // =========================================================================
  // 3. GEOGRAPHIC LOCATIONS
  // e.g. Country, State, City, Region, Zip, Territory, Continent, Postal
  // =========================================================================
  if (/(?:^|_)(country|state|city|region|province|postal|zip|zipcode|lat|lng|latitude|longitude|territory|continent|loc_state)(?:_|$)/i.test(norm)) {
    return {
      column: columnName,
      role: 'geo',
      suggestedMeaning: 'Geographic Location / Territory',
      confidence: 0.92,
      requiresConfirmation: false,
      description: `Geographic location attribute detected from header "${columnName}".`,
    };
  }

  // =========================================================================
  // 4. WORKFLOW STATUS & LIFECYCLE STATES
  // e.g. Stage, Status, Outcome, State, Won/Lost, Active/Inactive
  // =========================================================================
  const matchesStatusValues = ontology.statusValues.some((sv) =>
    stringSamples.some((val) => val === sv || val.includes(sv))
  );
  const isStatusHeader = /(?:^|_)(status|state|stage|outcome|phase|condition|step|pipeline_stage)(?:_|$)/i.test(norm);

  if (isStatusHeader || matchesStatusValues) {
    const confidence = matchesStatusValues && isStatusHeader ? 0.96 : matchesStatusValues ? 0.90 : 0.84;
    return {
      column: columnName,
      role: 'status',
      suggestedMeaning: 'Workflow State / Lifecycle Status',
      confidence,
      requiresConfirmation: confidence < 0.70,
      description: `Discrete operational status or workflow stage recognized from "${columnName}".`,
    };
  }

  // =========================================================================
  // 5. SECONDARY QUANTITATIVE METRICS (Deductions, Costs, Quantities, Rates)
  // e.g. Cost, Discount, Item_Cost, Unit_Cost, Spend, Tax, Quantity, Qty, Rate
  // =========================================================================
  const isNumeric = ['numeric', 'currency', 'percentage'].includes(inferredType);
  const isSecondaryIndicator = /(?:^|_)(discount|cost|item_cost|unit_cost|spend|expense|tax|fee|refund|shipping|loss|rate|ratio|percent|pct|qty|quantity|units|count|seats|hours|days|cogs|opex|capex)(?:_|$)/i.test(norm);
  const isDomainSecondary = ontology.secondaryMetrics.some((sm) => norm === sm || norm.includes(sm) || sm.includes(norm));

  if (isNumeric && (isDomainSecondary || isSecondaryIndicator || inferredType === 'percentage')) {
    const confidence = isDomainSecondary ? 0.94 : 0.88;
    return {
      column: columnName,
      role: 'secondary_metric',
      suggestedMeaning: 'Secondary Supporting Metric / Rate / Cost',
      confidence,
      requiresConfirmation: confidence < 0.70,
      description: isDomainSecondary
        ? `Secondary metric aligned with ${ontology.label} domain ontology.`
        : `Supporting quantitative measure, cost deduction, or rate for "${columnName}".`,
    };
  }

  // =========================================================================
  // 6. PRIMARY QUANTITATIVE REVENUE & FINANCIAL METRICS
  // e.g. Sales, Revenue, Amount, Net_Sales, Order_Value, Gross_Amt, Net_Amt, MRR, ARR, GMV
  // =========================================================================
  const isRevenueWord = /(?:^|_)(sales|revenue|amount|net_sales|order_value|gross_amt|net_amt|gross_sales|total_amount|deal_value|deal_amount|gmv|mrr|arr|acv|tcv|profit|margin|income|ebitda|val)(?:_|$)/i.test(norm);
  const isDomainPrimary = ontology.primaryMetrics.some((pm) => norm === pm || norm.includes(pm) || pm.includes(norm));

  if (isNumeric && (isRevenueWord || isDomainPrimary || inferredType === 'currency')) {
    let confidence = 0.94;
    if (isRevenueWord && isDomainPrimary) confidence = 0.98;
    else if (inferredType === 'currency') confidence = 0.95;

    return {
      column: columnName,
      role: 'primary_metric',
      suggestedMeaning: 'Primary Revenue / Sales / Executive Metric',
      confidence,
      requiresConfirmation: false,
      description: `Primary executive quantitative target metric derived from "${columnName}".`,
    };
  }

  // Generic fallback for numeric columns without strong primary/secondary keyword matches
  if (isNumeric) {
    const isLikelyScore = /score|rating|index|rank/i.test(norm);
    const confidence = isLikelyScore ? 0.75 : 0.62; // Low confidence -> flags for confirmation
    return {
      column: columnName,
      role: 'secondary_metric',
      suggestedMeaning: isLikelyScore ? 'Quantitative Index / Score' : 'Unspecified Numeric Measure',
      confidence,
      requiresConfirmation: confidence < 0.70,
      description: `Numeric column "${columnName}" suitable for mathematical aggregation.`,
    };
  }

  // =========================================================================
  // 7. CATEGORICAL DIMENSIONS & SEGMENTS
  // e.g. Category, Segment, Type, Brand, Plan, Department, Channel
  // =========================================================================
  const isCategoryHeader = /(?:^|_)(category|prod_cat|type|segment|tier|class|group|brand|department|dept|channel|model|plan)(?:_|$)/i.test(norm);
  const isDomainDimension = ontology.dimensions.some((d) => norm === d || norm.includes(d) || d.includes(norm));

  if (inferredType === 'categorical' || isCategoryHeader || isDomainDimension) {
    const confidence = isDomainDimension ? 0.92 : isCategoryHeader ? 0.88 : 0.80;
    return {
      column: columnName,
      role: 'category',
      suggestedMeaning: 'Categorical Slice / Segmentation Attribute',
      confidence,
      requiresConfirmation: confidence < 0.70,
      description: `Categorical dimension for group-by filtering and drill-down analysis.`,
    };
  }

  // =========================================================================
  // 8. GENERAL DIMENSIONS OR AMBIGUOUS ATTRIBUTES
  // =========================================================================
  if (distinctCount <= 40 && totalCount > 0) {
    return {
      column: columnName,
      role: 'dimension',
      suggestedMeaning: 'General Analytical Dimension',
      confidence: 0.78,
      requiresConfirmation: false,
      description: `Low-cardinality dimension with ${distinctCount} distinct values.`,
    };
  }

  // Ambiguous text attribute - low confidence requires confirmation
  return {
    column: columnName,
    role: 'attribute',
    suggestedMeaning: 'Descriptive Textual Attribute',
    confidence: 0.58,
    requiresConfirmation: true, // Under 0.70 -> requires confirmation
    description: `High-cardinality textual column with unfamiliar header "${columnName}".`,
  };
};
