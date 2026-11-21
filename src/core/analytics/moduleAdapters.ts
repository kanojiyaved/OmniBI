import { Dataset } from '../../types';
import { 
  MOCK_DEALS, 
  MOCK_CAMPAIGNS, 
  MOCK_CONTACTS, 
  MOCK_GOALS
} from '../../data/mockDesignData';

// ==========================================
// 1. PIPELINE & DEAL MANAGEMENT
// ==========================================

export interface DynamicDeal {
  id: string;
  title: string;
  company: string;
  amount: number;
  stage: string;
  probability: number;
  owner: string;
  closeDate: string;
}

export interface DynamicPipelineData {
  deals: DynamicDeal[];
  stages: string[];
  totalPipeline: number;
  wonDeals: number;
  wonValue: number;
  winRate: number; // 0 to 100
  avgDealSize: number;
  dealsByStage: Record<string, DynamicDeal[]>;
  isDemo: boolean;
  isAdapted: boolean;
  sourceDatasetName?: string;
  detectedDomain?: string;
}

export const extractPipelineData = (dataset: Dataset | null): DynamicPipelineData => {
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    const stageGroups: Record<string, DynamicDeal[]> = {};
    const stages = ['Qualified', 'Proposal', 'Negotiation', 'Closed Won'];
    stages.forEach((s) => { stageGroups[s] = []; });
    
    MOCK_DEALS.forEach((d) => {
      if (!stageGroups[d.stage]) stageGroups[d.stage] = [];
      stageGroups[d.stage].push(d);
    });

    const totalPipeline = MOCK_DEALS.reduce((acc, d) => acc + d.amount, 0);
    const won = MOCK_DEALS.filter((d) => d.stage === 'Closed Won');
    const wonValue = won.reduce((acc, d) => acc + d.amount, 0);

    return {
      deals: MOCK_DEALS,
      stages,
      totalPipeline,
      wonDeals: won.length,
      wonValue,
      winRate: MOCK_DEALS.length > 0 ? Math.round((won.length / MOCK_DEALS.length) * 100) : 0,
      avgDealSize: Math.round(totalPipeline / MOCK_DEALS.length),
      dealsByStage: stageGroups,
      isDemo: true,
      isAdapted: false,
    };
  }

  const { data, columns, profiles = {}, semanticMappings = {}, detectedDomain } = dataset;
  const domain = detectedDomain?.domain || 'general';

  // 1. Find Stage / Status Column
  const stageCol = columns.find((c) => {
    const role = semanticMappings[c]?.role || profiles[c]?.semanticRole;
    return role === 'status' || /stage|status|pipeline|phase|state/i.test(c);
  }) || columns.find((c) => profiles[c]?.inferredType === 'categorical');

  // 2. Find Deal Amount / Value Column
  const amountCol = columns.find((c) => {
    const role = semanticMappings[c]?.role || profiles[c]?.semanticRole;
    return role === 'primary_metric' || /amount|value|revenue|deal_size|price|total|sales/i.test(c);
  }) || columns.find((c) => ['currency', 'numeric'].includes(profiles[c]?.inferredType));

  // 3. Find Title / Company / Entity Column
  const titleCol = columns.find((c) => {
    const role = semanticMappings[c]?.role || profiles[c]?.semanticRole;
    return role === 'entity_id' || role === 'dimension' || /deal|opportunity|title|account|client|customer|company|name/i.test(c);
  }) || columns[0];

  // 4. Find Owner / Rep Column
  const ownerCol = columns.find((c) => /owner|rep|lead|manager|salesperson|agent|assignee/i.test(c));

  // 5. Find Close Date Column
  const dateCol = columns.find((c) => {
    const role = semanticMappings[c]?.role || profiles[c]?.semanticRole;
    return role === 'timestamp' || /date|close|target|deadline|time/i.test(c) || profiles[c]?.inferredType === 'date';
  });

  const isAdapted = domain !== 'sales';

  // Build Dynamic Deals
  const deals: DynamicDeal[] = data.map((row, index) => {
    const rawAmount = amountCol ? row[amountCol] : 1000;
    const cleanAmount = typeof rawAmount === 'number' 
      ? rawAmount 
      : Number(String(rawAmount || '0').replace(/[$€£¥,%\s]/g, '')) || 0;

    let rawStage = stageCol ? String(row[stageCol] || 'Active').trim() : 'Active';
    if (!rawStage) rawStage = 'Active';

    const title = titleCol ? String(row[titleCol] || `Opportunity #${index + 1}`) : `Opportunity #${index + 1}`;
    const owner = ownerCol ? String(row[ownerCol]) : 'Account Exec';
    const closeDate = dateCol ? String(row[dateCol]).slice(0, 10) : '2026-12-31';

    // Heuristic probability based on stage
    let prob = 50;
    if (/won|closed|completed|signed|active/i.test(rawStage)) prob = 100;
    else if (/negotiat|review|final/i.test(rawStage)) prob = 75;
    else if (/proposal|pitch|demo/i.test(rawStage)) prob = 50;
    else if (/qualif|lead|new|prospect/i.test(rawStage)) prob = 25;
    else if (/lost|churn|cancel/i.test(rawStage)) prob = 0;

    return {
      id: `deal-${index + 1}`,
      title,
      company: title,
      amount: cleanAmount,
      stage: rawStage,
      probability: prob,
      owner,
      closeDate,
    };
  });

  // Extract unique stages in dataset
  const uniqueStages = Array.from(new Set(deals.map((d) => d.stage)));
  const stageOrder = uniqueStages.slice(0, 6); // Max 6 columns for clean Kanban

  const dealsByStage: Record<string, DynamicDeal[]> = {};
  stageOrder.forEach((s) => { dealsByStage[s] = []; });
  deals.forEach((d) => {
    if (dealsByStage[d.stage]) {
      dealsByStage[d.stage].push(d);
    } else if (stageOrder.length > 0) {
      dealsByStage[stageOrder[0]].push(d);
    }
  });

  const totalPipeline = deals.reduce((acc, d) => acc + d.amount, 0);
  const wonDealsList = deals.filter((d) => /won|closed|completed|signed|paid|success/i.test(d.stage));
  const wonValue = wonDealsList.reduce((acc, d) => acc + d.amount, 0);
  const winRate = deals.length > 0 ? Math.round((wonDealsList.length / deals.length) * 100) : 0;
  const avgDealSize = deals.length > 0 ? Math.round(totalPipeline / deals.length) : 0;

  return {
    deals,
    stages: stageOrder,
    totalPipeline,
    wonDeals: wonDealsList.length,
    wonValue,
    winRate,
    avgDealSize,
    dealsByStage,
    isDemo: false,
    isAdapted,
    sourceDatasetName: dataset.name,
    detectedDomain: domain,
  };
};

// ==========================================
// 2. CAMPAIGN MANAGEMENT
// ==========================================

export interface DynamicCampaignItem {
  id: string;
  name: string;
  channel: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // percentage
  cvr: number; // percentage
  roas: number; // multiplier
  roi: number; // multiplier
  status: string;
}

export interface DynamicCampaignData {
  campaigns: DynamicCampaignItem[];
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  overallCtr: number;
  overallCvr: number;
  overallRoas: number;
  channelPerformance: { channel: string; spend: number; conversions: number; clicks: number }[];
  isDemo: boolean;
  isAdapted: boolean;
  sourceDatasetName?: string;
  detectedDomain?: string;
}

export const extractCampaignData = (dataset: Dataset | null): DynamicCampaignData => {
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    const totalSpend = MOCK_CAMPAIGNS.reduce((acc, c) => acc + c.spent, 0);
    const totalImpressions = MOCK_CAMPAIGNS.reduce((acc, c) => acc + c.impressions, 0);
    const totalClicks = MOCK_CAMPAIGNS.reduce((acc, c) => acc + c.clicks, 0);
    const totalConversions = MOCK_CAMPAIGNS.reduce((acc, c) => acc + c.conversions, 0);

    const overallCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
    const overallCvr = totalClicks > 0 ? Number(((totalConversions / totalClicks) * 100).toFixed(2)) : 0;
    const overallRoas = 3.6;

    const channelMap: Record<string, { spend: number; conversions: number; clicks: number }> = {};
    MOCK_CAMPAIGNS.forEach((c) => {
      if (!channelMap[c.channel]) channelMap[c.channel] = { spend: 0, conversions: 0, clicks: 0 };
      channelMap[c.channel].spend += c.spent;
      channelMap[c.channel].conversions += c.conversions;
      channelMap[c.channel].clicks += c.clicks;
    });

    const channelPerformance = Object.entries(channelMap).map(([channel, metrics]) => ({
      channel,
      ...metrics,
    }));

    const campaigns: DynamicCampaignItem[] = MOCK_CAMPAIGNS.map((c) => ({
      id: c.id,
      name: c.name,
      channel: c.channel,
      budget: c.budget,
      spent: c.spent,
      impressions: c.impressions,
      clicks: c.clicks,
      conversions: c.conversions,
      ctr: c.impressions > 0 ? Number(((c.clicks / c.impressions) * 100).toFixed(2)) : 0,
      cvr: c.clicks > 0 ? Number(((c.conversions / c.clicks) * 100).toFixed(2)) : 0,
      roas: c.roi,
      roi: c.roi,
      status: c.status,
    }));

    return {
      campaigns,
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      overallCtr,
      overallCvr,
      overallRoas,
      channelPerformance,
      isDemo: true,
      isAdapted: false,
    };
  }

  const { data, columns, profiles = {}, semanticMappings = {}, detectedDomain } = dataset;
  const domain = detectedDomain?.domain || 'general';

  // Identify marketing columns
  const nameCol = columns.find((c) => /campaign|ad|initiative|program|name|title/i.test(c)) || columns[0];
  const channelCol = columns.find((c) => /channel|source|platform|medium|network/i.test(c)) || columns.find((c) => profiles[c]?.inferredType === 'categorical');
  const spendCol = columns.find((c) => semanticMappings[c]?.role === 'primary_metric' || /spend|cost|budget|expense|investment/i.test(c)) || columns.find((c) => profiles[c]?.inferredType === 'currency');
  const impressionsCol = columns.find((c) => /impression|views|reach|exposures/i.test(c));
  const clicksCol = columns.find((c) => /clicks|visitors|visits|traffic|sessions/i.test(c));
  const conversionsCol = columns.find((c) => /conversion|orders|leads|acquisitions|signups/i.test(c));
  const revenueCol = columns.find((c) => /revenue|sales|income|value|amount/i.test(c));
  const statusCol = columns.find((c) => /status|state|active/i.test(c));

  const isAdapted = domain !== 'marketing';

  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalRevenue = 0;

  const channelMap: Record<string, { spend: number; conversions: number; clicks: number }> = {};

  const campaigns: DynamicCampaignItem[] = data.map((row, index) => {
    const parseNum = (val: any) => {
      if (typeof val === 'number') return val;
      return Number(String(val || '0').replace(/[$€£¥,%\s]/g, '')) || 0;
    };

    const spent = spendCol ? parseNum(row[spendCol]) : 1000;
    const impressions = impressionsCol ? parseNum(row[impressionsCol]) : (clicksCol ? parseNum(row[clicksCol]) * 20 : 10000);
    const clicks = clicksCol ? parseNum(row[clicksCol]) : (conversionsCol ? parseNum(row[conversionsCol]) * 10 : 500);
    const conversions = conversionsCol ? parseNum(row[conversionsCol]) : Math.round(clicks * 0.05);
    const revenue = revenueCol ? parseNum(row[revenueCol]) : conversions * 50;

    totalSpend += spent;
    totalImpressions += impressions;
    totalClicks += clicks;
    totalConversions += conversions;
    totalRevenue += revenue;

    const channel = channelCol ? String(row[channelCol] || 'Direct').trim() : 'Direct';
    if (!channelMap[channel]) channelMap[channel] = { spend: 0, conversions: 0, clicks: 0 };
    channelMap[channel].spend += spent;
    channelMap[channel].conversions += conversions;
    channelMap[channel].clicks += clicks;

    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
    const cvr = clicks > 0 ? Number(((conversions / clicks) * 100).toFixed(2)) : 0;
    const roas = spent > 0 ? Number((revenue / spent).toFixed(2)) : 0;

    const name = nameCol ? String(row[nameCol] || `Campaign ${index + 1}`) : `Campaign ${index + 1}`;
    const status = statusCol ? String(row[statusCol] || 'Active') : 'Active';

    return {
      id: `camp-${index + 1}`,
      name,
      channel,
      budget: Math.round(spent * 1.2),
      spent,
      impressions,
      clicks,
      conversions,
      ctr,
      cvr,
      roas,
      roi: roas,
      status,
    };
  });

  const overallCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
  const overallCvr = totalClicks > 0 ? Number(((totalConversions / totalClicks) * 100).toFixed(2)) : 0;
  const overallRoas = totalSpend > 0 ? Number((totalRevenue / totalSpend).toFixed(2)) : 0;

  const channelPerformance = Object.entries(channelMap).map(([channel, metrics]) => ({
    channel,
    ...metrics,
  }));

  return {
    campaigns,
    totalSpend,
    totalImpressions,
    totalClicks,
    totalConversions,
    overallCtr,
    overallCvr,
    overallRoas,
    channelPerformance,
    isDemo: false,
    isAdapted,
    sourceDatasetName: dataset.name,
    detectedDomain: domain,
  };
};

// ==========================================
// 3. REPORTS & FINANCIAL / OPERATIONAL STATEMENTS
// ==========================================

export interface DynamicCategoryBreakdownItem {
  category: string;
  total: number;
  mean: number;
  count: number;
  sharePct: number;
}

export interface DynamicFinancialReport {
  categoryBreakdown: DynamicCategoryBreakdownItem[];
  grossTotal: number;
  netTotal: number;
  totalRecords: number;
  primaryMetricName: string;
  categoryColumnName: string;
  isDemo: boolean;
  isAdapted: boolean;
  sourceDatasetName?: string;
  detectedDomain?: string;
}

export const extractFinancialReportData = (dataset: Dataset | null): DynamicFinancialReport => {
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    const demoItems = [
      { category: 'Enterprise SaaS', total: 450000, mean: 45000, count: 10, sharePct: 45 },
      { category: 'Mid-Market Solutions', total: 300000, mean: 20000, count: 15, sharePct: 30 },
      { category: 'Professional Services', total: 150000, mean: 15000, count: 10, sharePct: 15 },
      { category: 'Maintenance & Support', total: 100000, mean: 5000, count: 20, sharePct: 10 },
    ];
    return {
      categoryBreakdown: demoItems,
      grossTotal: 1000000,
      netTotal: 720000,
      totalRecords: 55,
      primaryMetricName: 'Revenue',
      categoryColumnName: 'Line of Business',
      isDemo: true,
      isAdapted: false,
    };
  }

  const { data, columns, profiles = {}, semanticMappings = {}, detectedDomain } = dataset;
  const domain = detectedDomain?.domain || 'general';

  // Primary numerical metric
  const primaryCol = columns.find(
    (c) => semanticMappings[c]?.role === 'primary_metric' || profiles[c]?.semanticRole === 'primary_metric'
  ) || columns.find((c) => ['currency', 'numeric'].includes(profiles[c]?.inferredType));

  // Category column
  const catCol = columns.find(
    (c) => semanticMappings[c]?.role === 'category' || profiles[c]?.semanticRole === 'category'
  ) || columns.find((c) => profiles[c]?.inferredType === 'categorical') || columns[0];

  const parseNum = (val: any) => {
    if (typeof val === 'number') return val;
    return Number(String(val || '0').replace(/[$€£¥,%\s]/g, '')) || 0;
  };

  const groupData: Record<string, { total: number; count: number }> = {};
  let grossTotal = 0;

  for (const row of data) {
    const cat = catCol ? String(row[catCol] || 'Other').trim() : 'General';
    const val = primaryCol ? parseNum(row[primaryCol]) : 1;

    if (!groupData[cat]) groupData[cat] = { total: 0, count: 0 };
    groupData[cat].total += val;
    groupData[cat].count += 1;
    grossTotal += val;
  }

  const categoryBreakdown: DynamicCategoryBreakdownItem[] = Object.entries(groupData)
    .map(([category, stats]) => ({
      category,
      total: stats.total,
      mean: stats.count > 0 ? Number((stats.total / stats.count).toFixed(2)) : 0,
      count: stats.count,
      sharePct: grossTotal > 0 ? Number(((stats.total / grossTotal) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    categoryBreakdown,
    grossTotal,
    netTotal: Number((grossTotal * 0.78).toFixed(2)), // Operational standard after simulated overhead
    totalRecords: data.length,
    primaryMetricName: primaryCol || 'Total',
    categoryColumnName: catCol || 'Category',
    isDemo: false,
    isAdapted: domain !== 'finance',
    sourceDatasetName: dataset.name,
    detectedDomain: domain,
  };
};

// ==========================================
// 4. CONTACTS & KEY STAKEHOLDERS
// ==========================================

export interface DynamicContact {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  status: string;
  valueContribution: number;
  lastActivity: string;
}

export interface DynamicContactsData {
  contacts: DynamicContact[];
  totalContacts: number;
  totalValue: number;
  isDemo: boolean;
  isAdapted: boolean;
  sourceDatasetName?: string;
  detectedDomain?: string;
}

export const extractContactsData = (dataset: Dataset | null): DynamicContactsData => {
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    const contacts: DynamicContact[] = MOCK_CONTACTS.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.role,
      company: c.company,
      status: c.status,
      valueContribution: 125000,
      lastActivity: c.lastActivity,
    }));

    return {
      contacts,
      totalContacts: contacts.length,
      totalValue: 750000,
      isDemo: true,
      isAdapted: false,
    };
  }

  const { data, columns, profiles = {}, semanticMappings = {}, detectedDomain } = dataset;
  const domain = detectedDomain?.domain || 'general';

  // Identify contact / stakeholder fields
  const nameCol = columns.find((c) => /name|contact|customer|client|employee|lead|person/i.test(c)) || columns[0];
  const emailCol = columns.find((c) => /email|mail/i.test(c));
  const roleCol = columns.find((c) => /role|title|position|department|job/i.test(c));
  const companyCol = columns.find((c) => /company|account|organization|client|org/i.test(c));
  const statusCol = columns.find((c) => /status|stage|relationship|type|tier/i.test(c));
  const valueCol = columns.find(
    (c) => semanticMappings[c]?.role === 'primary_metric' || /revenue|amount|value|salary|spend/i.test(c)
  );
  const dateCol = columns.find((c) => /date|last|time|activity|touch/i.test(c) || profiles[c]?.inferredType === 'date');

  const parseNum = (val: any) => {
    if (typeof val === 'number') return val;
    return Number(String(val || '0').replace(/[$€£¥,%\s]/g, '')) || 0;
  };

  let totalValue = 0;

  const contacts: DynamicContact[] = data.map((row, index) => {
    const name = nameCol ? String(row[nameCol] || `Stakeholder #${index + 1}`) : `Stakeholder #${index + 1}`;
    const email = emailCol 
      ? String(row[emailCol]) 
      : `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@enterprise.com`;
    const role = roleCol ? String(row[roleCol] || 'Key Contact') : 'Key Contact';
    const company = companyCol ? String(row[companyCol] || dataset.name) : dataset.name;
    const status = statusCol ? String(row[statusCol] || 'Customer') : 'Customer';
    const val = valueCol ? parseNum(row[valueCol]) : 25000;
    const lastActivity = dateCol ? String(row[dateCol]).slice(0, 10) : '2026-11-20';

    totalValue += val;

    return {
      id: `contact-${index + 1}`,
      name,
      email,
      role,
      company,
      status,
      valueContribution: val,
      lastActivity,
    };
  });

  return {
    contacts,
    totalContacts: contacts.length,
    totalValue,
    isDemo: false,
    isAdapted: !['sales', 'customer_analytics', 'hr'].includes(domain),
    sourceDatasetName: dataset.name,
    detectedDomain: domain,
  };
};

// ==========================================
// 5. GOALS & TARGET ATTAINMENT
// ==========================================

export interface DynamicGoal {
  id: string;
  title: string;
  category: string;
  current: number;
  target: number;
  unit: string;
  progressPercent: number;
  dueDate: string;
  status: 'ahead' | 'on_track' | 'at_risk';
}

export interface DynamicGoalsData {
  goals: DynamicGoal[];
  isDemo: boolean;
  sourceDatasetName?: string;
  detectedDomain?: string;
}

export const extractGoalsData = (dataset: Dataset | null): DynamicGoalsData => {
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    const goals: DynamicGoal[] = MOCK_GOALS.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      current: g.current,
      target: g.target,
      unit: g.unit,
      progressPercent: g.progressPercent,
      dueDate: g.dueDate,
      status: g.progressPercent >= 90 ? 'ahead' : g.progressPercent >= 70 ? 'on_track' : 'at_risk',
    }));

    return {
      goals,
      isDemo: true,
    };
  }

  const { data, columns, profiles = {}, semanticMappings = {}, detectedDomain } = dataset;
  const domain = detectedDomain?.domain || 'general';

  // Primary metric
  const primaryCol = columns.find(
    (c) => semanticMappings[c]?.role === 'primary_metric' || profiles[c]?.semanticRole === 'primary_metric'
  ) || columns.find((c) => ['currency', 'numeric'].includes(profiles[c]?.inferredType));

  const parseNum = (val: any) => {
    if (typeof val === 'number') return val;
    return Number(String(val || '0').replace(/[$€£¥,%\s]/g, '')) || 0;
  };

  let primarySum = 0;
  if (primaryCol) {
    for (const row of data) {
      primarySum += parseNum(row[primaryCol]);
    }
  }

  const rowCount = data.length;
  const isCurrency = primaryCol && (profiles[primaryCol]?.inferredType === 'currency' || /revenue|amount|spend|sales/i.test(primaryCol));
  const unit = isCurrency ? '$' : '';

  const goals: DynamicGoal[] = [
    {
      id: 'goal-primary-target',
      title: primaryCol ? `Fiscal ${primaryCol} Target` : 'Volume Target',
      category: domain.toUpperCase(),
      current: Math.round(primarySum || rowCount),
      target: Math.round((primarySum || rowCount) * 1.25),
      unit,
      progressPercent: 80,
      dueDate: 'Q4 2026',
      status: 'on_track',
    },
    {
      id: 'goal-volume-attainment',
      title: 'Operational Velocity & Record Count',
      category: 'Operations',
      current: rowCount,
      target: Math.round(rowCount * 1.15),
      unit: 'records',
      progressPercent: 87,
      dueDate: 'End of Year',
      status: 'ahead',
    },
    {
      id: 'goal-quality-hygiene',
      title: 'Data Integrity & Quality Standard',
      category: 'Governance',
      current: dataset.quality?.overallScore ?? 95,
      target: 100,
      unit: '% score',
      progressPercent: dataset.quality?.overallScore ?? 95,
      dueDate: 'Continuous',
      status: (dataset.quality?.overallScore ?? 95) >= 80 ? 'ahead' : 'at_risk',
    },
    {
      id: 'goal-expansion-rate',
      title: 'Strategic Expansion Multiplier',
      category: 'Strategy',
      current: Math.round((primarySum || rowCount) * 0.4),
      target: Math.round((primarySum || rowCount) * 0.5),
      unit,
      progressPercent: 80,
      dueDate: 'Annual 2027',
      status: 'on_track',
    },
  ];

  return {
    goals,
    isDemo: false,
    sourceDatasetName: dataset.name,
    detectedDomain: domain,
  };
};
