import { Dataset, ChartSpecification } from '../../types';
import { parseQueryIntent, matchColumnForTerm } from './queryIntentParser';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

export interface ExecutionResult {
  answerText: string;
  queryType: string;
  metricsHighlighted?: { label: string; value: string }[];
  chartSuggestion?: ChartSpecification;
  pandasCode?: string;
  sqlCode?: string;
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
  nextQuestions: string[];
}

/**
 * Calculates Pearson correlation coefficient between two numeric fields.
 */
function calculatePearsonR(xVals: number[], yVals: number[]): number {
  const n = Math.min(xVals.length, yVals.length);
  if (n < 2) return 0;

  const meanX = xVals.reduce((a, b) => a + b, 0) / n;
  const meanY = yVals.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xVals[i] - meanX;
    const dy = yVals[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return Number((num / den).toFixed(3));
}

/**
 * Format helper for numbers based on column semantic role.
 */
function formatValue(value: number, columnName: string, dataset: Dataset): string {
  const role = (dataset.semanticMappings?.[columnName]?.role || '') as string;
  const colLower = columnName.toLowerCase();

  if (
    role === 'revenue' ||
    role === 'monetary_amount' ||
    role === 'sales' ||
    role === 'profit' ||
    role === 'cost' ||
    role === 'expense' ||
    role === 'spend' ||
    role === 'salary' ||
    role === 'deal_value' ||
    colLower.includes('revenue') ||
    colLower.includes('sales') ||
    colLower.includes('amount') ||
    colLower.includes('profit') ||
    colLower.includes('spend') ||
    colLower.includes('cost') ||
    colLower.includes('salary') ||
    colLower.includes('price')
  ) {
    return formatCurrency(value);
  }

  if (
    role === 'percentage' ||
    role === 'rate' ||
    colLower.includes('rate') ||
    colLower.includes('margin') ||
    colLower.includes('ratio') ||
    colLower.includes('pct') ||
    colLower.includes('percentage')
  ) {
    return formatPercentage(value);
  }

  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
}

/**
 * Executes a natural language query deterministically against the active dataset.
 */
export function executeNaturalLanguageQuery(query: string, dataset?: Dataset | null): ExecutionResult {
  // 1. Guard: No dataset loaded
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    return {
      answerText:
        'No active dataset is currently loaded in the system. Please upload a CSV/Excel file in the Data Import tab or load one of our verified sample datasets to initiate autonomous conversational analysis.',
      queryType: 'UNKNOWN',
      metricsHighlighted: [{ label: 'Dataset Status', value: 'None Active' }],
      nextQuestions: [
        'Load Sales & Revenue sample dataset',
        'Load SaaS Subscriptions sample dataset',
        'How do I upload custom CSV or XLSX files?',
      ],
    };
  }

  const parsed = parseQueryIntent(query, dataset);
  const rows = dataset.data;
  const columns = dataset.columns;
  const profiles = dataset.profiles || {};
  const queryLower = query.toLowerCase();

  const numericCols = columns.filter((c) => profiles[c]?.inferredType === 'numeric');
  const categoricalCols = columns.filter(
    (c) => profiles[c]?.inferredType === 'categorical' || profiles[c]?.inferredType === 'text'
  );
  const dateCols = columns.filter((c) => profiles[c]?.inferredType === 'date');
  const primaryNum = numericCols[0] || columns[0];
  const primaryCat = categoricalCols[0] || columns[1] || columns[0];

  // 2. HELP intent
  if (parsed.intentType === 'HELP') {
    return {
      answerText: `I am your Autonomous AI Data Analyst for "${dataset.name}". I perform deterministic, mathematically verified calculations on your data without hallucinations. You can ask me for:
• **Metric Aggregations**: e.g., "What is my total revenue?", "Average transaction size"
• **Top Performers & Extremes**: e.g., "Which product performs best?", "Which region generates the highest sales?", "Who are my top 10 customers?"
• **Trends & Momentum**: e.g., "Identify revenue trends", "Compare the last two months"
• **Anomalies & Risks**: e.g., "Find unusual patterns", "What are the biggest business risks?"
• **Executive Synthesis**: e.g., "Generate an executive summary"`,
      queryType: 'HELP',
      metricsHighlighted: [
        { label: 'Active Schema', value: `${columns.length} columns` },
        { label: 'Total Records', value: `${rows.length.toLocaleString()} rows` },
      ],
      pandasCode: '# Inspect active schema and descriptive stats\nprint(df.columns.tolist())\nprint(df.describe())',
      sqlCode: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${dataset.name}';`,
      nextQuestions: [
        `What is my total ${primaryNum}?`,
        `Which ${primaryCat} performs best?`,
        `Generate an executive summary`,
      ],
    };
  }

  // 3. AMBIGUOUS / UNDERSPECIFIED QUERIES
  if (parsed.intentType === 'AMBIGUOUS') {
    return {
      answerText: `Your query "${query}" is ambiguous or broad. In active dataset **${dataset.name}** (${rows.length.toLocaleString()} records across ${columns.length} fields), I can compute targeted aggregations, categorical distributions, rankings, or anomaly evaluations.`,
      queryType: 'AMBIGUOUS',
      metricsHighlighted: [
        { label: 'Dataset', value: dataset.name },
        { label: 'Available Fields', value: `${columns.length} columns` },
      ],
      nextQuestions: [
        `What is my total ${primaryNum}?`,
        `Breakdown of ${primaryNum} by ${primaryCat}`,
        `Generate an executive summary`,
      ],
    };
  }

  // 4. CHECK FOR EXPLICITLY UNSUPPORTED CONCEPT / MISSING ATTRIBUTES
  // Check marketing/campaign on non-marketing dataset
  if ((queryLower.includes('roi') || queryLower.includes('campaign')) && !columns.some(c => c.toLowerCase().includes('campaign') || c.toLowerCase().includes('channel') || c.toLowerCase().includes('spend'))) {
    return {
      answerText: `The current dataset "${dataset.name}" does not contain campaign or advertising spend fields required to determine campaign ROI. Available columns are: **${columns.join(', ')}**. You can ask about sales performance, top customers, or regional breakdowns instead.`,
      queryType: 'UNKNOWN',
      metricsHighlighted: [
        { label: 'Missing Dimension', value: 'Campaign / Marketing' },
        { label: 'Available Columns', value: `${columns.length} fields` },
      ],
      nextQuestions: [
        `What is my total ${primaryNum}?`,
        `Which ${primaryCat} performs best?`,
        `Who are my top 5 ${primaryCat}?`,
      ],
    };
  }

  // Other unresolvable concepts
  const unknownConcepts = ['churn', 'ebitda', 'nps', 'temperature', 'humidity', 'bounce_rate'];
  for (const concept of unknownConcepts) {
    if (queryLower.includes(concept)) {
      const match = matchColumnForTerm(concept, dataset);
      if (!match) {
        return {
          answerText: `The current dataset "${dataset.name}" does not contain fields or semantic mappings for "${concept}". Available columns are: **${columns.join(', ')}**. Please formulate a query using existing dimensions or update your semantic mappings.`,
          queryType: 'UNKNOWN',
          metricsHighlighted: [
            { label: 'Missing Attribute', value: concept },
            { label: 'Available Columns', value: `${columns.length} fields` },
          ],
          nextQuestions: [
            `What metrics are available in this dataset?`,
            `Generate an executive summary`,
            `Show top 5 records`,
          ],
        };
      }
    }
  }

  // 5. EXECUTIVE SUMMARY
  if (parsed.intentType === 'EXECUTIVE_SUMMARY') {
    const totalVal = rows.reduce((acc, r) => acc + (Number(r[primaryNum]) || 0), 0);
    const meanVal = rows.length > 0 ? totalVal / rows.length : 0;
    const qualityScore = dataset.quality?.overallScore || 95;

    // Leading segment
    const groupSums: Record<string, number> = {};
    rows.forEach((r) => {
      const g = String(r[primaryCat] ?? 'Unknown');
      groupSums[g] = (groupSums[g] || 0) + (Number(r[primaryNum]) || 0);
    });
    const sorted = Object.entries(groupSums).sort((a, b) => b[1] - a[1]);
    const leader = sorted[0] || ['None', 0];
    const leaderShare = totalVal > 0 ? ((leader[1] / totalVal) * 100).toFixed(1) : '0';

    const chartData = sorted.slice(0, 5).map(([name, val]) => ({
      name,
      [primaryNum]: Number(val.toFixed(2)),
    }));

    return {
      answerText: `**Executive Summary for ${dataset.name}:**\n• Total cumulative volume of **${primaryNum}** reached **${formatValue(totalVal, primaryNum, dataset)}** across **${rows.length.toLocaleString()} transactions** (avg **${formatValue(meanVal, primaryNum, dataset)}** per record).\n• **${leader[0]}** is the dominant ${primaryCat}, generating **${formatValue(leader[1], primaryNum, dataset)}** (**${leaderShare}%** of aggregate volume).\n• Data Hygiene rating is **${qualityScore}%** with ${dataset.quality?.missingCellsCount || 0} missing cells detected across ${columns.length} tracked attributes.`,
      queryType: 'EXECUTIVE_SUMMARY',
      metricsHighlighted: [
        { label: `Total ${primaryNum}`, value: formatValue(totalVal, primaryNum, dataset) },
        { label: `Avg ${primaryNum}`, value: formatValue(meanVal, primaryNum, dataset) },
        { label: `Top ${primaryCat}`, value: `${leader[0]} (${leaderShare}%)` },
        { label: 'Data Quality', value: `${qualityScore}%` },
      ],
      chartSuggestion: {
        id: `chart-exec-${Date.now()}`,
        title: `Top ${primaryCat} Distribution`,
        chartType: 'bar',
        xAxisColumn: 'name',
        yAxisColumns: [primaryNum],
        importance: 'primary',
        data: chartData,
        description: `Executive distribution breakdown across ${primaryCat}`,
      },
      tableData: {
        headers: ['Executive KPI', 'Telemetry Value', 'Status'],
        rows: [
          [`Total ${primaryNum}`, formatValue(totalVal, primaryNum, dataset), 'Verified'],
          [`Average ${primaryNum}`, formatValue(meanVal, primaryNum, dataset), 'Verified'],
          [`Leading ${primaryCat}`, `${leader[0]} (${leaderShare}%)`, 'Dominant'],
          ['Data Health Score', `${qualityScore}%`, qualityScore >= 90 ? 'Healthy' : 'Needs Review'],
        ],
      },
      pandasCode: `# Executive Summary Synthesis\nprint(f"Total: {df['${primaryNum}'].sum():,.2f}")\nprint(f"Mean: {df['${primaryNum}'].mean():,.2f}")\nprint(df.groupby('${primaryCat}')['${primaryNum}'].sum().nlargest(5))`,
      sqlCode: `SELECT SUM(${primaryNum}) AS total_${primaryNum}, AVG(${primaryNum}) AS avg_${primaryNum} FROM "${dataset.name}";`,
      nextQuestions: [
        `What are the biggest business risks?`,
        `Find unusual patterns`,
        `Identify revenue trends`,
      ],
    };
  }

  // 6. BUSINESS RISKS ANALYSIS
  if (parsed.intentType === 'BUSINESS_RISKS') {
    const totalVal = rows.reduce((acc, r) => acc + (Number(r[primaryNum]) || 0), 0);
    const groupSums: Record<string, number> = {};
    rows.forEach((r) => {
      const g = String(r[primaryCat] ?? 'Unknown');
      groupSums[g] = (groupSums[g] || 0) + (Number(r[primaryNum]) || 0);
    });
    const sorted = Object.entries(groupSums).sort((a, b) => b[1] - a[1]);
    const leader = sorted[0] || ['None', 0];
    const leaderShare = totalVal > 0 ? (leader[1] / totalVal) * 100 : 0;

    const isHighConcentration = leaderShare > 35;
    const missingCells = dataset.quality?.missingCellsCount || 0;
    const anomaliesCount = dataset.quality?.anomaliesDetected?.length || 0;

    return {
      answerText: `**Business Risk Assessment for ${dataset.name}:**\n• **Concentration Risk:** ${
        isHighConcentration
          ? `**HIGH RISK** — Top ${primaryCat} "**${leader[0]}**" commands **${leaderShare.toFixed(1)}%** of all ${primaryNum}. Revenue is heavily dependent on this single entity.`
          : `**LOW RISK** — Top ${primaryCat} "**${leader[0]}**" accounts for ${leaderShare.toFixed(1)}% of volume, indicating healthy portfolio diversification.`
      }\n• **Data Hygiene Risk:** ${missingCells > 0 ? `**MEDIUM RISK** — ${missingCells} missing values detected across fields.` : `**NEGLIGIBLE** — Zero missing cells.`}\n• **Operational Volatility:** ${anomaliesCount > 0 ? `${anomaliesCount} statistical outliers identified that may skew forecasting models.` : `Variance is within expected statistical boundaries.`}`,
      queryType: 'BUSINESS_RISKS',
      metricsHighlighted: [
        { label: 'Concentration Severity', value: isHighConcentration ? 'HIGH' : 'LOW' },
        { label: `Top ${primaryCat} Share`, value: `${leaderShare.toFixed(1)}%` },
        { label: 'Missing Data Cells', value: String(missingCells) },
      ],
      tableData: {
        headers: ['Risk Vector', 'Severity', 'Observed Finding', 'Mitigation Recommendation'],
        rows: [
          [
            'Client Concentration',
            isHighConcentration ? 'HIGH' : 'LOW',
            `${leader[0]} commands ${leaderShare.toFixed(1)}% of ${primaryNum}`,
            isHighConcentration ? `Accelerate acquisition outside ${leader[0]}` : 'Maintain current diversification',
          ],
          [
            'Data Integrity',
            missingCells > 0 ? 'MEDIUM' : 'LOW',
            `${missingCells} missing cells detected in dataset`,
            missingCells > 0 ? 'Apply imputation in Data Profiler toolbar' : 'No cleaning required',
          ],
          [
            'Forecast Outlier Risk',
            anomaliesCount > 0 ? 'MEDIUM' : 'LOW',
            `${anomaliesCount} statistical outliers identified`,
            'Inspect extreme transactions in Data Explorer',
          ],
        ],
      },
      pandasCode: `# Portfolio Concentration Analysis\nshare = (df.groupby('${primaryCat}')['${primaryNum}'].sum() / df['${primaryNum}'].sum()) * 100\nprint(share.sort_values(ascending=False))`,
      sqlCode: `SELECT ${primaryCat}, SUM(${primaryNum}) * 100.0 / SUM(SUM(${primaryNum})) OVER () AS pct_share FROM "${dataset.name}" GROUP BY ${primaryCat} ORDER BY pct_share DESC LIMIT 3;`,
      nextQuestions: [
        `Find unusual patterns`,
        `Who are my top 10 ${primaryCat}?`,
        `Generate an executive summary`,
      ],
    };
  }

  // 7. ANOMALY & UNUSUAL PATTERNS
  if (parsed.intentType === 'ANOMALY_PATTERNS') {
    const numVals = rows.map((r) => Number(r[primaryNum]) || 0).sort((a, b) => a - b);
    const n = numVals.length;
    const q1 = numVals[Math.floor(n * 0.25)] || 0;
    const q3 = numVals[Math.floor(n * 0.75)] || 0;
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers: { rowIdx: number; entity: string; val: number }[] = [];
    rows.forEach((r, idx) => {
      const v = Number(r[primaryNum]);
      if (!isNaN(v) && (v < lowerBound || v > upperBound)) {
        outliers.push({
          rowIdx: idx + 1,
          entity: String(r[primaryCat] || `Record #${idx + 1}`),
          val: v,
        });
      }
    });

    return {
      answerText: `**Anomaly Detection for ${dataset.name}:**\nIdentified **${outliers.length} statistical outliers** in **${primaryNum}** exceeding the 1.5×IQR boundary (${formatValue(lowerBound, primaryNum, dataset)} to ${formatValue(upperBound, primaryNum, dataset)}). ${
        outliers.length > 0
          ? `Most prominent outlier is **${outliers[0].entity}** at **${formatValue(outliers[0].val, primaryNum, dataset)}**.`
          : 'No extreme values were detected outside statistical tolerance limits.'
      }`,
      queryType: 'ANOMALY_PATTERNS',
      metricsHighlighted: [
        { label: 'Outliers Detected', value: String(outliers.length) },
        { label: 'IQR Upper Bound', value: formatValue(upperBound, primaryNum, dataset) },
        { label: 'IQR Lower Bound', value: formatValue(lowerBound, primaryNum, dataset) },
      ],
      tableData: {
        headers: ['Row #', primaryCat, primaryNum, 'Anomaly Status'],
        rows: (outliers.length > 0
          ? outliers.slice(0, 6).map((o) => [
              `#${o.rowIdx}`,
              o.entity,
              formatValue(o.val, primaryNum, dataset),
              o.val > upperBound ? 'Extreme High Outlier' : 'Extreme Low Outlier',
            ])
          : [[1, 'Dataset Median', formatValue(numVals[Math.floor(n / 2)] || 0, primaryNum, dataset), 'Normal']]
        ),
      },
      pandasCode: `# Statistical IQR Outlier Detection\nq1 = df['${primaryNum}'].quantile(0.25)\nq3 = df['${primaryNum}'].quantile(0.75)\niqr = q3 - q1\noutliers = df[(df['${primaryNum}'] < q1 - 1.5*iqr) | (df['${primaryNum}'] > q3 + 1.5*iqr)]\nprint(outliers[['${primaryCat}', '${primaryNum}']])`,
      sqlCode: `WITH stats AS (\n  SELECT percentile_cont(0.25) WITHIN GROUP (ORDER BY ${primaryNum}) AS q1,\n         percentile_cont(0.75) WITHIN GROUP (ORDER BY ${primaryNum}) AS q3\n  FROM "${dataset.name}"\n)\nSELECT * FROM "${dataset.name}", stats WHERE ${primaryNum} > q3 + 1.5*(q3-q1) OR ${primaryNum} < q1 - 1.5*(q3-q1);`,
      nextQuestions: [
        `What are the biggest business risks?`,
        `Which ${primaryCat} generates the highest ${primaryNum}?`,
        `What is the average ${primaryNum}?`,
      ],
    };
  }

  // 8. TEMPORAL TRENDS
  if (parsed.intentType === 'TREND') {
    if (dateCols.length === 0) {
      return {
        answerText: `Dataset "${dataset.name}" does not contain date or timestamp fields required to compute temporal trends. Available columns are: **${columns.join(', ')}**. You can explore categorical breakdowns or rankings instead.`,
        queryType: 'UNKNOWN',
        metricsHighlighted: [
          { label: 'Missing Dimension', value: 'Date / Timestamp' },
          { label: 'Available Columns', value: `${columns.length} columns` },
        ],
        nextQuestions: [
          `Breakdown of ${primaryNum} by ${primaryCat}`,
          `Top 5 ${primaryCat} by ${primaryNum}`,
          `Generate an executive summary`,
        ],
      };
    }

    const dateCol = dateCols[0];
    const timeAgg: Record<string, number> = {};
    rows.forEach((r) => {
      const rawDate = r[dateCol];
      if (rawDate) {
        const key = String(rawDate).substring(0, 10);
        timeAgg[key] = (timeAgg[key] || 0) + (Number(r[primaryNum]) || 0);
      }
    });

    const sortedDates = Object.entries(timeAgg).sort((a, b) => a[0].localeCompare(b[0]));
    const firstPeriod = sortedDates[0];
    const lastPeriod = sortedDates[sortedDates.length - 1];
    const growth = firstPeriod && firstPeriod[1] > 0
      ? (((lastPeriod[1] - firstPeriod[1]) / firstPeriod[1]) * 100).toFixed(1)
      : '0.0';

    const chartData = sortedDates.slice(0, 20).map(([date, val]) => ({
      date,
      [primaryNum]: Number(val.toFixed(2)),
    }));

    return {
      answerText: `**Temporal Trend for ${primaryNum} across ${dateCol}:**\nSequential momentum from **${firstPeriod ? firstPeriod[0] : 'Start'}** (${formatValue(firstPeriod ? firstPeriod[1] : 0, primaryNum, dataset)}) to **${lastPeriod ? lastPeriod[0] : 'End'}** (${formatValue(lastPeriod ? lastPeriod[1] : 0, primaryNum, dataset)}) represents a **${Number(growth) >= 0 ? '+' : ''}${growth}% ${Number(growth) >= 0 ? 'expansion' : 'contraction'}**.`,
      queryType: 'TREND',
      metricsHighlighted: [
        { label: 'Net Period Growth', value: `${Number(growth) >= 0 ? '+' : ''}${growth}%` },
        { label: 'Starting Run-Rate', value: formatValue(firstPeriod ? firstPeriod[1] : 0, primaryNum, dataset) },
        { label: 'Latest Run-Rate', value: formatValue(lastPeriod ? lastPeriod[1] : 0, primaryNum, dataset) },
      ],
      chartSuggestion: {
        id: `chart-trend-${Date.now()}`,
        title: `${primaryNum} Trend over ${dateCol}`,
        chartType: 'line',
        xAxisColumn: 'date',
        yAxisColumns: [primaryNum],
        importance: 'primary',
        data: chartData,
        description: `Temporal evolution of ${primaryNum}`,
      },
      tableData: {
        headers: [dateCol, `Total ${primaryNum}`],
        rows: sortedDates.slice(0, 8).map(([d, val]) => [d, formatValue(val, primaryNum, dataset)]),
      },
      pandasCode: `# Time Series Aggregation\ndf['${dateCol}'] = pd.to_datetime(df['${dateCol}'])\ntrend = df.groupby(df['${dateCol}'].dt.to_period('M'))['${primaryNum}'].sum()\nprint(trend)`,
      sqlCode: `SELECT DATE_TRUNC('month', ${dateCol}) AS period, SUM(${primaryNum}) AS total FROM "${dataset.name}" GROUP BY period ORDER BY period ASC;`,
      nextQuestions: [
        `Compare the last two months`,
        `Which ${primaryCat} performs best?`,
        `What is my total ${primaryNum}?`,
      ],
    };
  }

  // 9. COMPARE PERIODS (e.g. "Compare the last two months")
  if (parsed.intentType === 'COMPARE_PERIODS') {
    if (dateCols.length === 0) {
      return {
        answerText: `Dataset "${dataset.name}" does not contain date fields required to compare months or historical periods. Available columns are: **${columns.join(', ')}**.`,
        queryType: 'UNKNOWN',
        metricsHighlighted: [
          { label: 'Missing Dimension', value: 'Date Field' },
          { label: 'Available Columns', value: `${columns.length} columns` },
        ],
        nextQuestions: [
          `Breakdown of ${primaryNum} by ${primaryCat}`,
          `Top 5 ${primaryCat} by ${primaryNum}`,
        ],
      };
    }

    const dateCol = dateCols[0];
    const monthAgg: Record<string, number> = {};
    rows.forEach((r) => {
      const d = String(r[dateCol]).substring(0, 7); // YYYY-MM
      monthAgg[d] = (monthAgg[d] || 0) + (Number(r[primaryNum]) || 0);
    });

    const sortedMonths = Object.entries(monthAgg).sort((a, b) => a[0].localeCompare(b[0]));
    if (sortedMonths.length < 2) {
      return {
        answerText: `Dataset contains only 1 recorded time period (${sortedMonths[0]?.[0] || 'Unknown'}), so month-over-month comparison cannot be calculated.`,
        queryType: 'COMPARE_PERIODS',
        metricsHighlighted: [{ label: 'Recorded Periods', value: '1 period only' }],
        nextQuestions: [`What is my total ${primaryNum}?`, `Which ${primaryCat} performs best?`],
      };
    }

    const p1 = sortedMonths[sortedMonths.length - 2];
    const p2 = sortedMonths[sortedMonths.length - 1];
    const diff = p2[1] - p1[1];
    const pctChange = p1[1] > 0 ? ((diff / p1[1]) * 100).toFixed(1) : '0.0';

    return {
      answerText: `**Comparative Analysis (${p1[0]} vs ${p2[0]}):**\n• **${p1[0]}**: ${formatValue(p1[1], primaryNum, dataset)}\n• **${p2[0]}**: ${formatValue(p2[1], primaryNum, dataset)}\n• **Variance**: **${diff >= 0 ? '+' : ''}${formatValue(diff, primaryNum, dataset)}** (**${diff >= 0 ? '+' : ''}${pctChange}%** month-over-month change).`,
      queryType: 'COMPARE_PERIODS',
      metricsHighlighted: [
        { label: `Previous (${p1[0]})`, value: formatValue(p1[1], primaryNum, dataset) },
        { label: `Current (${p2[0]})`, value: formatValue(p2[1], primaryNum, dataset) },
        { label: 'Growth %', value: `${diff >= 0 ? '+' : ''}${pctChange}%` },
      ],
      chartSuggestion: {
        id: `chart-compare-${Date.now()}`,
        title: `Period Comparison: ${p1[0]} vs ${p2[0]}`,
        chartType: 'bar',
        xAxisColumn: 'period',
        yAxisColumns: [primaryNum],
        importance: 'primary',
        data: [
          { period: p1[0], [primaryNum]: Number(p1[1].toFixed(2)) },
          { period: p2[0], [primaryNum]: Number(p2[1].toFixed(2)) },
        ],
        description: `Month-over-month comparative trajectory for ${primaryNum}`,
      },
      tableData: {
        headers: ['Period', `Total ${primaryNum}`, 'Delta vs Prior', 'Growth Rate'],
        rows: [
          [p1[0], formatValue(p1[1], primaryNum, dataset), 'Baseline', '—'],
          [p2[0], formatValue(p2[1], primaryNum, dataset), `${diff >= 0 ? '+' : ''}${formatValue(diff, primaryNum, dataset)}`, `${diff >= 0 ? '+' : ''}${pctChange}%`],
        ],
      },
      pandasCode: `# Month-over-Month Comparison\np1 = df[df['period'] == '${p1[0]}']['${primaryNum}'].sum()\np2 = df[df['period'] == '${p2[0]}']['${primaryNum}'].sum()\ngrowth = ((p2 - p1) / p1) * 100\nprint(f"Growth: {growth:.1f}%")`,
      sqlCode: `SELECT period, SUM(${primaryNum}) AS total, SUM(${primaryNum}) - LAG(SUM(${primaryNum})) OVER (ORDER BY period) AS delta FROM (SELECT DATE_TRUNC('month', ${dateCol}) AS period, ${primaryNum} FROM "${dataset.name}") t GROUP BY period;`,
      nextQuestions: [
        `Identify revenue trends`,
        `What are the biggest business risks?`,
        `Which ${primaryCat} performs best?`,
      ],
    };
  }

  // 10. CORRELATION
  if (parsed.intentType === 'CORRELATION' && parsed.targetMetric && parsed.secondaryMetric) {
    const m1 = parsed.targetMetric;
    const m2 = parsed.secondaryMetric;

    const xVals: number[] = [];
    const yVals: number[] = [];

    rows.forEach((r) => {
      const v1 = Number(r[m1]);
      const v2 = Number(r[m2]);
      if (!isNaN(v1) && !isNaN(v2)) {
        xVals.push(v1);
        yVals.push(v2);
      }
    });

    const r = calculatePearsonR(xVals, yVals);
    let strength = 'negligible';
    if (Math.abs(r) >= 0.7) strength = 'strong';
    else if (Math.abs(r) >= 0.4) strength = 'moderate';
    else if (Math.abs(r) >= 0.2) strength = 'weak';

    const direction = r > 0 ? 'positive' : r < 0 ? 'negative' : 'neutral';

    // Build scatter chart sample data (up to 30 points)
    const scatterData = rows.slice(0, 30).map((r, i) => ({
      id: i + 1,
      [m1]: Number(r[m1]) || 0,
      [m2]: Number(r[m2]) || 0,
    }));

    return {
      answerText: `The Pearson correlation coefficient between **${m1}** and **${m2}** is **r = ${r}**, representing a **${strength} ${direction} correlation**. ${
        strength === 'strong'
          ? `Changes in ${m1} are strongly co-linear with changes in ${m2}.`
          : strength === 'moderate'
          ? `There is a discernible statistical relationship between ${m1} and ${m2}.`
          : `There is little to no linear association between these two variables.`
      }`,
      queryType: 'CORRELATION',
      metricsHighlighted: [
        { label: 'Pearson r', value: String(r) },
        { label: 'Relationship', value: `${strength.toUpperCase()} ${direction.toUpperCase()}` },
        { label: 'Data Points Sampled', value: `${xVals.length} pairs` },
      ],
      chartSuggestion: {
        id: `chart-corr-${Date.now()}`,
        title: `Correlation: ${m1} vs ${m2} (r=${r})`,
        chartType: 'scatter',
        xAxisColumn: m1,
        yAxisColumns: [m2],
        importance: 'primary',
        data: scatterData,
        description: `Bivariate dispersion analysis showing r=${r}`,
      },
      pandasCode: `# Pearson Correlation Matrix\nr = df[['${m1}', '${m2}']].corr().iloc[0, 1]\nprint(f"Pearson r: {r:.3f}")`,
      sqlCode: `SELECT CORR(${m1}, ${m2}) AS pearson_r FROM "${dataset.name}";`,
      nextQuestions: [
        `What is the distribution of ${m1}?`,
        `What is the distribution of ${m2}?`,
        `Show top 5 records by ${m1}`,
      ],
    };
  }

  // 11. RANKINGS (Top N or Bottom N, "Which performs best?", "Who are top 10")
  if (parsed.intentType === 'RANKING' && parsed.targetMetric && parsed.groupDimension) {
    const metric = parsed.targetMetric;
    const dim = parsed.groupDimension;
    const limit = parsed.limit || 5;
    const isAsc = parsed.sortDirection === 'asc';

    // Group rows and sum metric
    const groupSums: Record<string, number> = {};
    let totalAll = 0;
    rows.forEach((r) => {
      const g = String(r[dim] ?? 'Unknown');
      const val = Number(r[metric]) || 0;
      groupSums[g] = (groupSums[g] || 0) + val;
      totalAll += val;
    });

    const sortedGroups = Object.entries(groupSums)
      .sort((a, b) => (isAsc ? a[1] - b[1] : b[1] - a[1]))
      .slice(0, limit);

    const leader = sortedGroups[0] || ['None', 0];
    const leaderValFormatted = formatValue(leader[1], metric, dataset);
    const leaderShare = totalAll > 0 ? ((leader[1] / totalAll) * 100).toFixed(1) : '0';

    const chartData = sortedGroups.map(([name, val]) => ({
      name,
      [metric]: Number(val.toFixed(2)),
    }));

    // Natural custom phrasing depending on query formulation
    let answerText = '';
    if (queryLower.includes('which product') || queryLower.includes('product performs best')) {
      answerText = `The best performing **Product** is **${leader[0]}**, generating **${leaderValFormatted}** (**${leaderShare}%** of aggregate ${metric}).`;
    } else if (queryLower.includes('which region') || queryLower.includes('highest sales')) {
      answerText = `The region generating the highest sales is **${leader[0]}** with **${leaderValFormatted}** (**${leaderShare}%** of total sales volume).`;
    } else if (queryLower.includes('who are my top') || queryLower.includes('top 10 customers') || queryLower.includes('top customers')) {
      answerText = `Your top ${limit} **${dim}** leaders are ranked below, led by **${leader[0]}** generating **${leaderValFormatted}** (${leaderShare}% of total).`;
    } else if (queryLower.includes('highest roi') || queryLower.includes('roi')) {
      answerText = `The campaign/channel with the highest performance is **${leader[0]}** generating **${leaderValFormatted}**.`;
    } else {
      answerText = `The ${isAsc ? 'bottom' : 'top'} ${limit} **${dim}** entities ranked by **${metric}** are led by **${leader[0]}** with **${leaderValFormatted}**.`;
    }

    return {
      answerText,
      queryType: 'RANKING',
      metricsHighlighted: [
        { label: `#1 ${isAsc ? 'Lowest' : 'Leader'}`, value: leader[0] },
        { label: `${metric}`, value: leaderValFormatted },
        { label: 'Leader Share', value: `${leaderShare}%` },
      ],
      chartSuggestion: {
        id: `chart-rank-${Date.now()}`,
        title: `${isAsc ? 'Bottom' : 'Top'} ${limit} ${dim} by ${metric}`,
        chartType: 'bar',
        xAxisColumn: 'name',
        yAxisColumns: [metric],
        importance: 'primary',
        data: chartData,
        description: `Leaderboard ranking of ${dim} by aggregate ${metric}`,
      },
      tableData: {
        headers: ['Rank', dim, `Total ${metric}`, 'Share of Total'],
        rows: sortedGroups.map(([name, val], idx) => [
          `#${idx + 1}`,
          name,
          formatValue(val, metric, dataset),
          totalAll > 0 ? `${((val / totalAll) * 100).toFixed(1)}%` : '0%',
        ]),
      },
      pandasCode: `# Top/Bottom Ranking\ndf.groupby('${dim}')['${metric}'].sum().${
        isAsc ? 'nsmallest' : 'nlargest'
      }(${limit}).reset_index()`,
      sqlCode: `SELECT ${dim}, SUM(${metric}) AS total_${metric} FROM "${dataset.name}" GROUP BY ${dim} ORDER BY total_${metric} ${
        isAsc ? 'ASC' : 'DESC'
      } LIMIT ${limit};`,
      nextQuestions: [
        `What is my total ${metric}?`,
        `Show complete breakdown of ${metric} by ${dim}`,
        `What are the biggest business risks?`,
      ],
    };
  }

  // 12. BREAKDOWN / GROUP BY
  if (parsed.intentType === 'BREAKDOWN' && parsed.targetMetric && parsed.groupDimension) {
    const metric = parsed.targetMetric;
    const dim = parsed.groupDimension;

    const groupSums: Record<string, number> = {};
    let totalAll = 0;

    rows.forEach((r) => {
      const g = String(r[dim] ?? 'Unknown');
      const val = Number(r[metric]) || 0;
      groupSums[g] = (groupSums[g] || 0) + val;
      totalAll += val;
    });

    const entries = Object.entries(groupSums).sort((a, b) => b[1] - a[1]);
    const topEntry = entries[0] || ['None', 0];
    const topShare = totalAll > 0 ? ((topEntry[1] / totalAll) * 100).toFixed(1) : '0';

    const isDateDim = profiles[dim]?.inferredType === 'date';
    const chartType = isDateDim ? 'line' : entries.length <= 5 ? 'donut' : 'bar';

    const chartData = entries.slice(0, 10).map(([name, val]) => ({
      name,
      [metric]: Number(val.toFixed(2)),
      share: totalAll > 0 ? Number(((val / totalAll) * 100).toFixed(1)) : 0,
    }));

    return {
      answerText: `Breakdown of **${metric}** across **${dim}** reveals that **${topEntry[0]}** accounts for **${topShare}%** of the total (${formatValue(
        topEntry[1],
        metric,
        dataset
      )} out of ${formatValue(totalAll, metric, dataset)} total across ${entries.length} segments).`,
      queryType: 'BREAKDOWN',
      metricsHighlighted: [
        { label: 'Total ' + metric, value: formatValue(totalAll, metric, dataset) },
        { label: 'Leading Segment', value: topEntry[0] },
        { label: 'Top Share', value: `${topShare}%` },
      ],
      chartSuggestion: {
        id: `chart-breakdown-${Date.now()}`,
        title: `${metric} by ${dim}`,
        chartType: chartType as any,
        xAxisColumn: 'name',
        yAxisColumns: [metric],
        importance: 'primary',
        data: chartData,
        description: `Distribution of ${metric} across ${dim} segments`,
      },
      tableData: {
        headers: [dim, `Total ${metric}`, 'Proportion'],
        rows: entries.slice(0, 8).map(([name, val]) => [
          name,
          formatValue(val, metric, dataset),
          totalAll > 0 ? `${((val / totalAll) * 100).toFixed(1)}%` : '0%',
        ]),
      },
      pandasCode: `# Grouped aggregation\nres = df.groupby('${dim}')['${metric}'].sum().reset_index().sort_values(by='${metric}', ascending=False)\nprint(res)`,
      sqlCode: `SELECT ${dim}, SUM(${metric}) AS total_${metric}, ROUND(100.0 * SUM(${metric}) / SUM(SUM(${metric})) OVER (), 2) AS pct_share FROM "${dataset.name}" GROUP BY ${dim} ORDER BY total_${metric} DESC;`,
      nextQuestions: [
        `Show top 5 ${dim} by ${metric}`,
        `What is the average ${metric} per ${dim}?`,
        `What are the biggest business risks?`,
      ],
    };
  }

  // 13. METRIC AGGREGATION (Sum, Average, Min, Max, Count, Distinct)
  const metric = parsed.targetMetric || columns.find((c) => profiles[c]?.inferredType === 'numeric') || columns[0];
  const agg = parsed.aggFunc;
  const numVals: number[] = [];

  rows.forEach((r) => {
    const val = Number(r[metric]);
    if (!isNaN(val)) numVals.push(val);
  });

  let calculatedResult = 0;
  let formulaDesc = '';

  if (agg === 'avg') {
    calculatedResult = numVals.length > 0 ? numVals.reduce((a, b) => a + b, 0) / numVals.length : 0;
    formulaDesc = `Average of ${metric}`;
  } else if (agg === 'max') {
    calculatedResult = numVals.length > 0 ? Math.max(...numVals) : 0;
    formulaDesc = `Maximum of ${metric}`;
  } else if (agg === 'min') {
    calculatedResult = numVals.length > 0 ? Math.min(...numVals) : 0;
    formulaDesc = `Minimum of ${metric}`;
  } else if (agg === 'count') {
    calculatedResult = numVals.length;
    formulaDesc = `Total Record Count`;
  } else if (agg === 'distinct') {
    const unique = new Set(rows.map((r) => r[metric]));
    calculatedResult = unique.size;
    formulaDesc = `Distinct Count of ${metric}`;
  } else {
    // Default sum
    calculatedResult = numVals.reduce((a, b) => a + b, 0);
    formulaDesc = `Total Sum of ${metric}`;
  }

  const formattedCalculated =
    agg === 'count' || agg === 'distinct'
      ? calculatedResult.toLocaleString()
      : formatValue(calculatedResult, metric, dataset);

  return {
    answerText: `The calculated **${formulaDesc}** for dataset **${dataset.name}** is **${formattedCalculated}** across **${numVals.length.toLocaleString()} evaluated data points**.`,
    queryType: 'AGGREGATION',
    metricsHighlighted: [
      { label: formulaDesc, value: formattedCalculated },
      { label: 'Sample Count', value: numVals.length.toLocaleString() },
      { label: 'Dataset Field', value: metric },
    ],
    pandasCode: `# Calculate ${agg.toUpperCase()}\nresult = df['${metric}'].${
      agg === 'avg' ? 'mean' : agg === 'distinct' ? 'nunique' : agg
    }()\nprint(f"{result}")`,
    sqlCode: `SELECT ${
      agg === 'avg'
        ? 'AVG'
        : agg === 'distinct'
        ? 'COUNT(DISTINCT '
        : agg === 'count'
        ? 'COUNT'
        : agg.toUpperCase()
    }(${metric}${agg === 'distinct' ? ')' : ''}) AS ${agg}_${metric} FROM "${dataset.name}";`,
    nextQuestions: [
      `What is the breakdown of ${metric} by category?`,
      `Who are the top 5 performers by ${metric}?`,
      `Generate an executive summary`,
    ],
  };
}
