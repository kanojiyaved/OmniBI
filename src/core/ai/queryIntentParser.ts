import { Dataset } from '../../types';

export type QueryIntentType = 
  | 'SUMMARY'
  | 'EXECUTIVE_SUMMARY'
  | 'AGGREGATION'
  | 'BREAKDOWN'
  | 'RANKING'
  | 'CORRELATION'
  | 'TREND'
  | 'COMPARE_PERIODS'
  | 'ANOMALY_PATTERNS'
  | 'BUSINESS_RISKS'
  | 'FILTER'
  | 'HELP'
  | 'AMBIGUOUS'
  | 'UNKNOWN';

export type AggregationFunction = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';

export interface FilterCondition {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface ParsedQueryIntent {
  rawQuery: string;
  intentType: QueryIntentType;
  targetMetric?: string;
  secondaryMetric?: string; // For correlation
  groupDimension?: string;
  aggFunc: AggregationFunction;
  limit?: number;
  sortDirection?: 'asc' | 'desc';
  filterConditions: FilterCondition[];
  confidence: number;
  unresolvedEntity?: string;
}

/**
 * Normalizes text for keyword matching: removes punctuation, trims, and converts to lowercase.
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9_\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Helper to find the best matching column in a dataset for a target term.
 * Checks exact match, partial match, and semantic mappings.
 */
export function matchColumnForTerm(
  term: string,
  dataset: Dataset,
  preferredType?: 'numeric' | 'categorical' | 'date'
): string | undefined {
  const normTerm = normalizeText(term);
  if (!normTerm) return undefined;

  const singular = normTerm.endsWith('ies')
    ? normTerm.slice(0, -3) + 'y'
    : normTerm.endsWith('s')
    ? normTerm.slice(0, -1)
    : normTerm;

  const columns = dataset.columns || [];
  const profiles = dataset.profiles || {};
  const semantic = dataset.semanticMappings || {};

  // 1. Direct case-insensitive equality (with singular support)
  const directMatch = columns.find(c => {
    const normCol = normalizeText(c);
    return normCol === normTerm || normCol === singular;
  });
  if (directMatch) return directMatch;

  // 2. Check if normTerm matches any SemanticRole or role synonym
  const roleSynonyms: Record<string, string[]> = {
    revenue: ['primary_metric', 'revenue', 'sales', 'monetary_amount', 'deal_value'],
    sales: ['primary_metric', 'revenue', 'sales', 'monetary_amount', 'deal_value'],
    income: ['primary_metric', 'revenue', 'sales'],
    profit: ['primary_metric', 'profit'],
    margin: ['secondary_metric', 'margin', 'profit_margin'],
    cost: ['secondary_metric', 'cost', 'expense', 'spend', 'ad_spend'],
    spend: ['secondary_metric', 'cost', 'expense', 'spend', 'ad_spend'],
    expense: ['secondary_metric', 'cost', 'expense', 'spend'],
    orders: ['primary_metric', 'secondary_metric', 'order_id', 'quantity', 'units_sold'],
    deals: ['primary_metric', 'deal_name', 'deal_value', 'stage'],
    customers: ['entity_id', 'dimension', 'customer_name', 'customer_id', 'entity_name'],
    clients: ['entity_id', 'dimension', 'customer_name', 'customer_id', 'entity_name'],
    employees: ['entity_id', 'dimension', 'entity_name', 'employee_id'],
    salary: ['primary_metric', 'salary', 'compensation', 'monetary_amount'],
    clicks: ['secondary_metric', 'clicks'],
    impressions: ['secondary_metric', 'impressions'],
    conversions: ['primary_metric', 'conversions'],
    rate: ['secondary_metric', 'rate', 'ratio', 'percentage'],
    price: ['secondary_metric', 'price', 'unit_price', 'monetary_amount'],
    units: ['secondary_metric', 'quantity', 'units_sold'],
    quantity: ['secondary_metric', 'quantity', 'units_sold'],
    date: ['timestamp', 'date', 'transaction_date'],
    time: ['timestamp', 'date', 'transaction_date'],
    region: ['geo', 'category', 'dimension', 'location'],
    country: ['geo', 'category', 'dimension', 'location'],
    category: ['category', 'dimension'],
    product: ['dimension', 'category', 'entity_id', 'product', 'item', 'sku'],
    campaign: ['dimension', 'category', 'campaign', 'channel', 'source'],
    roi: ['secondary_metric', 'primary_metric', 'roas', 'roi', 'return_on_investment'],
    roas: ['secondary_metric', 'primary_metric', 'roas', 'roi'],
    status: ['status', 'stage'],
    stage: ['status', 'stage'],
  };

  // Find if semantic mapping matches any of the synonyms
  for (const [key, synonyms] of Object.entries(roleSynonyms)) {
    if (normTerm.includes(key)) {
      for (const col of columns) {
        const mapping = semantic[col];
        if (mapping && synonyms.includes(mapping.role)) {
          return col;
        }
      }
    }
  }

  // 3. Substring matching in column names
  // If preferredType is provided, prioritize columns of that type
  const matchingCols = columns.filter(c => {
    const colNorm = normalizeText(c);
    const colSingular = colNorm.endsWith('s') ? colNorm.slice(0, -1) : colNorm;
    return (
      colNorm.includes(normTerm) ||
      normTerm.includes(colNorm) ||
      colSingular.includes(singular) ||
      singular.includes(colSingular)
    );
  });

  if (matchingCols.length > 0) {
    if (preferredType) {
      const typeMatch = matchingCols.find(c => {
        const prof = profiles[c];
        if (preferredType === 'categorical') {
          return prof && (prof.inferredType === 'categorical' || prof.inferredType === 'text');
        }
        return prof && prof.inferredType === preferredType;
      });
      if (typeMatch) return typeMatch;
    }
    return matchingCols[0];
  }

  // 4. Word boundary check
  const words = normTerm.split(' ');
  for (const col of columns) {
    const colWords = normalizeText(col).split(' ');
    const shared = words.filter(w => w.length > 2 && colWords.includes(w));
    if (shared.length > 0) {
      return col;
    }
  }

  return undefined;
}

/**
 * Parses user natural language query into a structured query intent.
 */
export function parseQueryIntent(query: string, dataset?: Dataset): ParsedQueryIntent {
  const normQuery = normalizeText(query);

  // Default intent
  let intentType: QueryIntentType = 'UNKNOWN';
  let aggFunc: AggregationFunction = 'sum';
  let targetMetric: string | undefined = undefined;
  let secondaryMetric: string | undefined = undefined;
  let groupDimension: string | undefined = undefined;
  let groupCandidate: string | undefined = undefined;
  let limit: number | undefined = undefined;
  let sortDirection: 'asc' | 'desc' = 'desc';
  const filterConditions: FilterCondition[] = [];
  let confidence = 0.5;

  // 1. HELP / CAPABILITY INTENTS
  if (
    normQuery.includes('what can you do') ||
    normQuery.includes('help') ||
    normQuery.includes('what questions can i ask') ||
    normQuery.includes('capabilities') ||
    normQuery.includes('how does this work')
  ) {
    return {
      rawQuery: query,
      intentType: 'HELP',
      aggFunc: 'count',
      filterConditions: [],
      confidence: 0.95,
    };
  }

  // 2. EXECUTIVE SUMMARY INTENTS
  if (
    normQuery.includes('executive summary') ||
    normQuery.includes('generate an executive summary') ||
    normQuery.includes('executive brief') ||
    normQuery.includes('leadership summary')
  ) {
    return {
      rawQuery: query,
      intentType: 'EXECUTIVE_SUMMARY',
      aggFunc: 'count',
      filterConditions: [],
      confidence: 0.95,
    };
  }

  // 3. BUSINESS RISKS INTENTS
  if (
    normQuery.includes('risk') ||
    normQuery.includes('biggest business risks') ||
    normQuery.includes('vulnerabilities') ||
    normQuery.includes('threats')
  ) {
    return {
      rawQuery: query,
      intentType: 'BUSINESS_RISKS',
      aggFunc: 'count',
      filterConditions: [],
      confidence: 0.92,
    };
  }

  // 4. ANOMALY / UNUSUAL PATTERNS INTENTS
  if (
    normQuery.includes('unusual pattern') ||
    normQuery.includes('unusual') ||
    normQuery.includes('anomal') ||
    normQuery.includes('outlier') ||
    normQuery.includes('irregular')
  ) {
    return {
      rawQuery: query,
      intentType: 'ANOMALY_PATTERNS',
      aggFunc: 'count',
      filterConditions: [],
      confidence: 0.92,
    };
  }

  // 5. PERIOD COMPARISON INTENTS (e.g. "Compare the last two months")
  if (
    normQuery.includes('compare the last two') ||
    normQuery.includes('compare last two months') ||
    normQuery.includes('compare months') ||
    normQuery.includes('month over month') ||
    normQuery.includes('compare period')
  ) {
    return {
      rawQuery: query,
      intentType: 'COMPARE_PERIODS',
      aggFunc: 'sum',
      filterConditions: [],
      confidence: 0.9,
    };
  }

  // 6. TEMPORAL TREND INTENTS (e.g. "Identify revenue trends", "sales over time")
  if (
    normQuery.includes('trend') ||
    normQuery.includes('identify revenue trends') ||
    normQuery.includes('trends') ||
    normQuery.includes('trajectory') ||
    normQuery.includes('over time')
  ) {
    return {
      rawQuery: query,
      intentType: 'TREND',
      aggFunc: 'sum',
      filterConditions: [],
      confidence: 0.9,
    };
  }

  // 7. DATASET SUMMARY INTENTS
  if (
    normQuery.includes('summarize') ||
    normQuery.includes('summary') ||
    normQuery.includes('overview of data') ||
    normQuery.includes('tell me about this dataset') ||
    normQuery.includes('what is this dataset') ||
    normQuery.includes('describe dataset') ||
    normQuery.includes('dataset overview')
  ) {
    return {
      rawQuery: query,
      intentType: 'SUMMARY',
      aggFunc: 'count',
      filterConditions: [],
      confidence: 0.9,
    };
  }

  // 3. DETECT AGGREGATION FUNCTION KEYWORDS
  if (normQuery.includes('average') || normQuery.includes('avg') || normQuery.includes('mean')) {
    aggFunc = 'avg';
  } else if (normQuery.includes('highest') || normQuery.includes('maximum') || normQuery.includes('max') || normQuery.includes('peak')) {
    aggFunc = 'max';
  } else if (normQuery.includes('lowest') || normQuery.includes('minimum') || normQuery.includes('min')) {
    aggFunc = 'min';
  } else if (
    normQuery.includes('count of') || 
    normQuery.includes('how many') || 
    normQuery.includes('number of') || 
    normQuery.includes('total count')
  ) {
    aggFunc = 'count';
  } else if (normQuery.includes('distinct') || normQuery.includes('unique count')) {
    aggFunc = 'distinct';
  } else {
    aggFunc = 'sum';
  }

  // 4. DETECT CORRELATION INTENTS
  if (
    normQuery.includes('correlation') ||
    normQuery.includes('correlate') ||
    normQuery.includes('relationship between') ||
    normQuery.includes('vs') ||
    normQuery.includes('versus')
  ) {
    intentType = 'CORRELATION';
    confidence = 0.85;

    if (dataset) {
      // Find two numerical columns mentioned in query
      const numericCols = dataset.columns.filter(c => {
        const p = dataset.profiles?.[c];
        return p?.inferredType === 'numeric';
      });

      const matched: string[] = [];
      for (const col of numericCols) {
        if (normQuery.includes(normalizeText(col))) {
          matched.push(col);
        }
      }

      if (matched.length >= 2) {
        targetMetric = matched[0];
        secondaryMetric = matched[1];
      } else if (numericCols.length >= 2) {
        // Fallback to first two numeric columns if matched is incomplete
        targetMetric = matched[0] || numericCols[0];
        secondaryMetric = numericCols.find(c => c !== targetMetric) || numericCols[1];
      }
    }

    return {
      rawQuery: query,
      intentType,
      targetMetric,
      secondaryMetric,
      aggFunc,
      filterConditions,
      confidence,
    };
  }

  // 5. DETECT RANKING / TOP / BOTTOM INTENTS
  // Check for explicit ranking pattern: "top/bottom [N] <entity> by/in <metric>"
  const rankingPattern = /\b(top|bottom|highest|lowest|best|worst|leading)\s+(\d+)?\s*([a-z0-9_]+)\s+(?:by|in|with)\s+([a-z0-9_]+)/i;
  const rankMatch = normQuery.match(rankingPattern);

  if (rankMatch) {
    intentType = 'RANKING';
    sortDirection = ['bottom', 'lowest', 'worst'].includes(rankMatch[1].toLowerCase()) ? 'asc' : 'desc';
    limit = rankMatch[2] ? parseInt(rankMatch[2], 10) : 5;
    const entityCandidate = rankMatch[3];
    const metricCandidate = rankMatch[4];
    confidence = 0.92;

    if (dataset) {
      groupDimension = matchColumnForTerm(entityCandidate, dataset, 'categorical');
      targetMetric = matchColumnForTerm(metricCandidate, dataset, 'numeric');
    }
  } else {
    const topMatch = normQuery.match(/\b(top|highest|best|leading|first)\s+(\d+)?/i);
    const bottomMatch = normQuery.match(/\b(bottom|lowest|worst|trailing|last)\s+(\d+)?/i);

    if (topMatch || bottomMatch) {
      intentType = 'RANKING';
      sortDirection = topMatch ? 'desc' : 'asc';
      const num = (topMatch ? topMatch[2] : bottomMatch ? bottomMatch[2] : null);
      limit = num ? parseInt(num, 10) : 5;
      confidence = 0.88;
    } else {
      // Pattern: "which <entity> (generates/has)? (highest/best) <metric>?"
      const whichPattern = /\bwhich\s+([a-z0-9_]+)\s+(?:generates|has|drives|produces|accounts for)?\s*(?:the)?\s*(highest|best|most|greatest|lowest|worst|top)?\s*([a-z0-9_]+)?/i;
      const whichMatch = normQuery.match(whichPattern);

      if (whichMatch) {
        intentType = 'RANKING';
        limit = 1;
        const entityCand = whichMatch[1];
        const superCand = whichMatch[2] || 'best';
        const metricCand = whichMatch[3];
        sortDirection = ['lowest', 'worst'].includes(superCand.toLowerCase()) ? 'asc' : 'desc';
        confidence = 0.9;

        if (dataset) {
          groupDimension = matchColumnForTerm(entityCand, dataset, 'categorical');
          if (metricCand) {
            targetMetric = matchColumnForTerm(metricCand, dataset, 'numeric');
          }
        }
      } else {
        // Pattern: "who are (my)? (top/bottom) (\d+)? <entity>"
        const whoPattern = /\bwho\s+are\s*(?:my|the)?\s*(top|bottom|best|leading|worst)?\s*(\d+)?\s*([a-z0-9_]+)/i;
        const whoMatch = normQuery.match(whoPattern);

        if (whoMatch) {
          intentType = 'RANKING';
          const superCand = whoMatch[1] || 'top';
          limit = whoMatch[2] ? parseInt(whoMatch[2], 10) : 10;
          const entityCand = whoMatch[3];
          sortDirection = ['bottom', 'worst'].includes(superCand.toLowerCase()) ? 'asc' : 'desc';
          confidence = 0.92;

          if (dataset) {
            groupDimension = matchColumnForTerm(entityCand, dataset, 'categorical');
          }
        }
      }
    }
  }

  // 6. DETECT BREAKDOWN / GROUP BY INTENTS (only if not already resolved by ranking)
  if (!groupDimension) {
    const groupByKeywords = ['by', 'per', 'across', 'breakdown by', 'grouped by', 'split by', 'categorized by'];
    groupCandidate = undefined;

    for (const kw of groupByKeywords) {
      const pattern = new RegExp(`\\b${kw}\\s+([a-z0-9_]+)`, 'i');
      const match = normQuery.match(pattern);
      if (match && match[1]) {
        groupCandidate = match[1];
        if (intentType !== 'RANKING') {
          intentType = 'BREAKDOWN';
        }
        break;
      }
    }

    if (groupCandidate && dataset) {
      groupDimension = matchColumnForTerm(groupCandidate, dataset, 'categorical') || 
                       matchColumnForTerm(groupCandidate, dataset, 'date');
    }
  }

  // 7. RESOLVE COLUMNS IF DATASET PROVIDED
  if (dataset) {
    const columns = dataset.columns;
    const profiles = dataset.profiles || {};

    const numericCols = columns.filter(c => profiles[c]?.inferredType === 'numeric');
    const categoricalCols = columns.filter(c => profiles[c]?.inferredType === 'categorical' || profiles[c]?.inferredType === 'text');
    const dateCols = columns.filter(c => profiles[c]?.inferredType === 'date');

    // Resolve group dimension
    if (!groupDimension && groupCandidate) {
      groupDimension = matchColumnForTerm(groupCandidate, dataset, 'categorical') || 
                       matchColumnForTerm(groupCandidate, dataset, 'date');
    }

    // If no explicit group keyword was found, but a categorical column is mentioned in query
    if (!groupDimension && (intentType === 'RANKING' || intentType === 'BREAKDOWN')) {
      for (const col of [...categoricalCols, ...dateCols]) {
        if (normQuery.includes(normalizeText(col))) {
          groupDimension = col;
          break;
        }
      }
    }

    // Resolve target metric
    if (!targetMetric) {
      for (const col of numericCols) {
        if (normQuery.includes(normalizeText(col))) {
          targetMetric = col;
          break;
        }
      }
    }

    // Try common business terms for target metric
    if (!targetMetric) {
      const metricTerms = ['revenue', 'sales', 'profit', 'spend', 'cost', 'amount', 'clicks', 'impressions', 'conversions', 'salary', 'units', 'margin', 'price', 'value'];
      for (const term of metricTerms) {
        if (normQuery.includes(term)) {
          const match = matchColumnForTerm(term, dataset, 'numeric');
          if (match) {
            targetMetric = match;
            break;
          }
        }
      }
    }

    // If still not found and in ranking/breakdown, default to primary numeric column
    if (!targetMetric && numericCols.length > 0 && (intentType === 'RANKING' || intentType === 'BREAKDOWN')) {
      targetMetric = numericCols[0];
    }

    // If still no groupDimension for ranking/breakdown, find the most sensible categorical dimension
    if (!groupDimension && (intentType === 'RANKING' || intentType === 'BREAKDOWN')) {
      groupDimension = categoricalCols[0] || columns.find(c => c !== targetMetric);
    }
  }

  // 8. FINAL INTENT CLASSIFICATION IF STILL UNKNOWN
  if (intentType === 'UNKNOWN') {
    const words = normQuery.split(' ').filter(Boolean);
    // Check if query is ambiguous or vague (fewer than 3 words and no explicit dimension/metric mentioned)
    if (words.length <= 2 && !groupDimension && !targetMetric) {
      intentType = 'AMBIGUOUS';
      confidence = 0.4;
    } else if (groupDimension && targetMetric) {
      intentType = 'BREAKDOWN';
      confidence = 0.85;
    } else if (targetMetric || aggFunc !== 'sum' || normQuery.includes('total') || normQuery.includes('how much') || normQuery.includes('what is the')) {
      intentType = 'AGGREGATION';
      confidence = 0.8;
      if (!targetMetric && dataset) {
        const numericCols = dataset.columns.filter(c => dataset.profiles?.[c]?.inferredType === 'numeric');
        targetMetric = numericCols[0] || dataset.columns[0];
      }
    } else {
      intentType = 'SUMMARY';
      confidence = 0.6;
    }
  }

  return {
    rawQuery: query,
    intentType,
    targetMetric,
    secondaryMetric,
    groupDimension,
    aggFunc,
    limit,
    sortDirection,
    filterConditions,
    confidence,
  };
}
