import { Dataset } from '../../types';

export interface SuggestedQuestionCategory {
  category: string;
  questions: string[];
}

/**
 * Dynamically generates relevant questions based on the dataset schema and domain.
 */
export function generateSuggestedQuestions(dataset?: Dataset | null): string[] {
  if (!dataset || !dataset.columns || dataset.columns.length === 0) {
    return [
      'Upload a CSV or Excel file to get started',
      'What types of datasets are supported?',
      'How does the AI semantic column mapping work?',
      'What metrics can be automatically calculated?',
    ];
  }

  const columns = dataset.columns;
  const profiles = dataset.profiles || {};
  const domain = dataset.detectedDomain?.domain || 'general';

  const numericCols = columns.filter((c) => profiles[c]?.inferredType === 'numeric');
  const categoricalCols = columns.filter(
    (c) => profiles[c]?.inferredType === 'categorical' || profiles[c]?.inferredType === 'text'
  );
  const dateCols = columns.filter((c) => profiles[c]?.inferredType === 'date');

  const questions: string[] = [];

  const primaryNum = numericCols[0];
  const secondaryNum = numericCols[1];
  const primaryCat = categoricalCols[0];
  const primaryDate = dateCols[0];

  // 1. Domain-specific tailored prompts
  if (domain === 'sales' || domain === 'ecommerce') {
    if (primaryNum) questions.push(`What is the total ${primaryNum.toLowerCase()}?`);
    if (primaryNum && primaryCat) questions.push(`Show ${primaryNum.toLowerCase()} breakdown by ${primaryCat.toLowerCase()}`);
    if (primaryCat && primaryNum) questions.push(`Who are the top 5 ${primaryCat.toLowerCase()} by ${primaryNum.toLowerCase()}?`);
    if (primaryNum) questions.push(`What is the average ${primaryNum.toLowerCase()}?`);
  } else if (domain === 'marketing') {
    if (primaryNum) questions.push(`What is the total ${primaryNum.toLowerCase()}?`);
    if (primaryNum && primaryCat) questions.push(`Compare ${primaryNum.toLowerCase()} across ${primaryCat.toLowerCase()}`);
    if (primaryCat && primaryNum) questions.push(`Top 5 ${primaryCat.toLowerCase()} ranked by performance`);
    if (numericCols.length >= 2) questions.push(`What is the correlation between ${numericCols[0]} and ${numericCols[1]}?`);
  } else if (domain === 'finance') {
    if (primaryNum) questions.push(`What is the net total ${primaryNum.toLowerCase()}?`);
    if (primaryNum && primaryCat) questions.push(`Breakdown of ${primaryNum.toLowerCase()} by ${primaryCat.toLowerCase()}`);
    if (secondaryNum && primaryNum) questions.push(`Compare ${primaryNum} versus ${secondaryNum}`);
    if (primaryDate && primaryNum) questions.push(`What is the trend of ${primaryNum.toLowerCase()} over time?`);
  } else if (domain === 'hr') {
    questions.push('What is the total employee count?');
    if (primaryNum && primaryCat) questions.push(`What is the average ${primaryNum.toLowerCase()} by ${primaryCat.toLowerCase()}?`);
    if (primaryCat) questions.push(`Show headcount distribution across ${primaryCat.toLowerCase()}`);
  } else {
    // Dynamic composition for any schema
    if (primaryNum) questions.push(`What is the total ${primaryNum}?`);
    if (primaryNum && primaryCat) questions.push(`Breakdown of ${primaryNum} by ${primaryCat}`);
    if (primaryCat && primaryNum) questions.push(`Top 5 ${primaryCat} by ${primaryNum}`);
    if (primaryNum) questions.push(`What is the average and range of ${primaryNum}?`);
  }

  // Add general exploration questions
  if (primaryDate && primaryNum && !questions.some(q => q.includes('trend'))) {
    questions.push(`Show temporal trend of ${primaryNum} by ${primaryDate}`);
  }
  if (numericCols.length >= 2 && !questions.some(q => q.includes('correlation'))) {
    questions.push(`Is there a correlation between ${numericCols[0]} and ${numericCols[1]}?`);
  }

  return questions.slice(0, 6);
}

/**
 * Returns categorized exploration questions for the AI Analyst page sidebar.
 */
export function getCategorizedSuggestedQuestions(dataset?: Dataset | null): SuggestedQuestionCategory[] {
  if (!dataset || !dataset.columns || dataset.columns.length === 0) {
    return [
      {
        category: 'Getting Started',
        questions: [
          'What features does OmniBI offer?',
          'How do I import a CSV or Excel dataset?',
          'What are the automated KPI capabilities?',
        ],
      },
    ];
  }

  const columns = dataset.columns;
  const profiles = dataset.profiles || {};
  const numericCols = columns.filter((c) => profiles[c]?.inferredType === 'numeric');
  const categoricalCols = columns.filter(
    (c) => profiles[c]?.inferredType === 'categorical' || profiles[c]?.inferredType === 'text'
  );
  const dateCols = columns.filter((c) => profiles[c]?.inferredType === 'date');

  const categories: SuggestedQuestionCategory[] = [];

  const num1 = numericCols[0] || 'Metric';
  const num2 = numericCols[1] || 'Value';
  const cat1 = categoricalCols[0] || 'Category';
  const cat2 = categoricalCols[1] || 'Segment';
  const date1 = dateCols[0] || 'Date';

  // 1. Metric Aggregations
  if (numericCols.length > 0) {
    categories.push({
      category: 'Key Aggregations',
      questions: [
        `What is the total ${num1}?`,
        `What is the average ${num1}?`,
        `What is the maximum and minimum ${num1}?`,
      ],
    });
  }

  // 2. Dimensional Breakdowns
  if (numericCols.length > 0 && categoricalCols.length > 0) {
    categories.push({
      category: 'Dimensional Breakdowns',
      questions: [
        `Breakdown of ${num1} by ${cat1}`,
        `Which ${cat1} has the highest share of ${num1}?`,
        cat2 ? `Compare ${num1} across ${cat2}` : `Summarize ${num1} per ${cat1}`,
      ],
    });
  }

  // 3. Rankings & Top Performers
  if (categoricalCols.length > 0 && numericCols.length > 0) {
    categories.push({
      category: 'Rankings & Extremes',
      questions: [
        `Top 5 ${cat1} by ${num1}`,
        `Bottom 3 ${cat1} by ${num1}`,
        `Rank all ${cat1} descending`,
      ],
    });
  }

  // 4. Trends & Relationships
  const advancedQuestions: string[] = [];
  if (dateCols.length > 0 && numericCols.length > 0) {
    advancedQuestions.push(`Show trend of ${num1} over ${date1}`);
  }
  if (numericCols.length >= 2) {
    advancedQuestions.push(`Calculate correlation between ${num1} and ${num2}`);
  }
  advancedQuestions.push('Summarize key patterns and anomalies in this dataset');

  categories.push({
    category: 'Trends & Statistical Correlation',
    questions: advancedQuestions,
  });

  return categories;
}
