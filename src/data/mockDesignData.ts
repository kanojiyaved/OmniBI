export interface MockKPI {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  timeframe: string;
  iconName: string;
}

export interface MockChartDataPoint {
  month: string;
  revenue: number;
  target: number;
  leads: number;
  deals: number;
}

export interface MockDeal {
  id: string;
  title: string;
  company: string;
  amount: number;
  stage: 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  probability: number;
  owner: string;
  closeDate: string;
}

export interface MockCampaign {
  id: string;
  name: string;
  channel: 'Google Ads' | 'LinkedIn' | 'Email' | 'Webinar' | 'Meta';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
  status: 'Active' | 'Paused' | 'Completed';
}

export interface MockContact {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  status: 'Lead' | 'Customer' | 'Partner';
  lastActivity: string;
  phone: string;
}

export interface MockGoal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  category: 'Revenue' | 'Sales' | 'Retention' | 'Marketing';
  dueDate: string;
  progressPercent: number;
}

export interface MockNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export const MOCK_KPIS: MockKPI[] = [
  {
    id: 'kpi-1',
    title: 'Total Revenue',
    value: '$2,845,900',
    change: '+14.2%',
    isPositive: true,
    timeframe: 'vs. last quarter',
    iconName: 'DollarSign',
  },
  {
    id: 'kpi-2',
    title: 'Active Subscriptions',
    value: '1,429',
    change: '+8.4%',
    isPositive: true,
    timeframe: 'vs. last month',
    iconName: 'Users',
  },
  {
    id: 'kpi-3',
    title: 'Average Deal Value',
    value: '$34,800',
    change: '+3.1%',
    isPositive: true,
    timeframe: 'trailing 30 days',
    iconName: 'TrendingUp',
  },
  {
    id: 'kpi-4',
    title: 'Churn Rate',
    value: '1.85%',
    change: '-0.4%',
    isPositive: true,
    timeframe: 'vs. annual baseline',
    iconName: 'ShieldCheck',
  },
];

export const MOCK_CHART_DATA: MockChartDataPoint[] = [
  { month: 'Jan', revenue: 185000, target: 170000, leads: 420, deals: 34 },
  { month: 'Feb', revenue: 210000, target: 190000, leads: 510, deals: 42 },
  { month: 'Mar', revenue: 245000, target: 220000, leads: 620, deals: 48 },
  { month: 'Apr', revenue: 230000, target: 235000, leads: 580, deals: 45 },
  { month: 'May', revenue: 280000, target: 250000, leads: 710, deals: 56 },
  { month: 'Jun', revenue: 310000, target: 275000, leads: 830, deals: 64 },
  { month: 'Jul', revenue: 295000, target: 290000, leads: 760, deals: 60 },
  { month: 'Aug', revenue: 340000, target: 310000, leads: 910, deals: 72 },
  { month: 'Sep', revenue: 365000, target: 330000, leads: 980, deals: 78 },
  { month: 'Oct', revenue: 390000, target: 350000, leads: 1040, deals: 84 },
  { month: 'Nov', revenue: 425000, target: 380000, leads: 1120, deals: 92 },
  { month: 'Dec', revenue: 480000, target: 410000, leads: 1250, deals: 105 },
];

export const MOCK_DEALS: MockDeal[] = [
  {
    id: 'deal-101',
    title: 'Enterprise Analytics Suite',
    company: 'Starlight Global',
    amount: 145000,
    stage: 'Negotiation',
    probability: 85,
    owner: 'Sarah Jenkins',
    closeDate: '2026-12-15',
  },
  {
    id: 'deal-102',
    title: 'Cloud Infrastructure Migration',
    company: 'NextGen Financial',
    amount: 98000,
    stage: 'Proposal',
    probability: 60,
    owner: 'Alex Rivera',
    closeDate: '2026-12-20',
  },
  {
    id: 'deal-103',
    title: 'Security Compliance Engine',
    company: 'Apex Health Systems',
    amount: 210000,
    stage: 'Closed Won',
    probability: 100,
    owner: 'Marcus Vance',
    closeDate: '2026-11-18',
  },
  {
    id: 'deal-104',
    title: 'Customer Data Platform (CDP)',
    company: 'Vanguard Retail',
    amount: 85000,
    stage: 'Qualified',
    probability: 40,
    owner: 'Sarah Jenkins',
    closeDate: '2027-01-10',
  },
  {
    id: 'deal-105',
    title: 'Autonomous BI Expansion',
    company: 'Quantum Logistics',
    amount: 165000,
    stage: 'Negotiation',
    probability: 80,
    owner: 'Alex Rivera',
    closeDate: '2026-12-28',
  },
];

export const MOCK_CAMPAIGNS: MockCampaign[] = [
  {
    id: 'cmp-01',
    name: 'Q4 Enterprise Inbound Google Search',
    channel: 'Google Ads',
    budget: 45000,
    spent: 38400,
    impressions: 480000,
    clicks: 14200,
    conversions: 840,
    roi: 3.8,
    status: 'Active',
  },
  {
    id: 'cmp-02',
    name: 'Executive Leadership Webinar 2026',
    channel: 'LinkedIn',
    budget: 25000,
    spent: 24500,
    impressions: 210000,
    clicks: 6800,
    conversions: 490,
    roi: 4.2,
    status: 'Completed',
  },
  {
    id: 'cmp-03',
    name: 'Product-Led Growth Email Drip',
    channel: 'Email',
    budget: 12000,
    spent: 8900,
    impressions: 95000,
    clicks: 12400,
    conversions: 1150,
    roi: 5.6,
    status: 'Active',
  },
  {
    id: 'cmp-04',
    name: 'Financial Services Account-Based Ads',
    channel: 'LinkedIn',
    budget: 35000,
    spent: 19800,
    impressions: 165000,
    clicks: 4100,
    conversions: 210,
    roi: 2.9,
    status: 'Active',
  },
];

export const MOCK_CONTACTS: MockContact[] = [
  {
    id: 'cnt-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@starlight.io',
    role: 'VP of Analytics',
    company: 'Starlight Global',
    status: 'Customer',
    lastActivity: 'Yesterday, 4:15 PM',
    phone: '+1 (555) 382-9012',
  },
  {
    id: 'cnt-2',
    name: 'David Chen',
    email: 'dchen@nextgenfin.com',
    role: 'Chief Technology Officer',
    company: 'NextGen Financial',
    status: 'Lead',
    lastActivity: '3 days ago',
    phone: '+1 (555) 749-2184',
  },
  {
    id: 'cnt-3',
    name: 'Miranda Brooks',
    email: 'm.brooks@apexhealth.org',
    role: 'Director of Operations',
    company: 'Apex Health Systems',
    status: 'Customer',
    lastActivity: '2 hours ago',
    phone: '+1 (555) 912-4401',
  },
  {
    id: 'cnt-4',
    name: 'Julian Sterling',
    email: 'julian@quantumlogistics.com',
    role: 'Head of Supply Chain',
    company: 'Quantum Logistics',
    status: 'Lead',
    lastActivity: '5 days ago',
    phone: '+1 (555) 438-1920',
  },
];

export const MOCK_GOALS: MockGoal[] = [
  {
    id: 'goal-1',
    title: 'Annual Recurring Revenue (ARR)',
    current: 12400000,
    target: 15000000,
    unit: '$',
    category: 'Revenue',
    dueDate: 'Dec 31, 2026',
    progressPercent: 82.6,
  },
  {
    id: 'goal-2',
    title: 'Enterprise Customer Acquisition',
    current: 48,
    target: 60,
    unit: 'clients',
    category: 'Sales',
    dueDate: 'Dec 31, 2026',
    progressPercent: 80.0,
  },
  {
    id: 'goal-3',
    title: 'Net Revenue Retention (NRR)',
    current: 118,
    target: 125,
    unit: '%',
    category: 'Retention',
    dueDate: 'Dec 31, 2026',
    progressPercent: 94.4,
  },
  {
    id: 'goal-4',
    title: 'Inbound MQL Generation',
    current: 3850,
    target: 4500,
    unit: 'leads',
    category: 'Marketing',
    dueDate: 'Dec 31, 2026',
    progressPercent: 85.5,
  },
];

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'notif-1',
    title: 'Deal Stage Advanced',
    description: 'Quantum Logistics moved to Negotiation stage ($165k).',
    time: '12m ago',
    read: false,
    type: 'success',
  },
  {
    id: 'notif-2',
    title: 'Monthly Analytics Report Ready',
    description: 'Executive Performance Summary for November generated.',
    time: '1h ago',
    read: false,
    type: 'info',
  },
  {
    id: 'notif-3',
    title: 'Budget Alert',
    description: 'LinkedIn ABM campaign reached 85% of allocated spend.',
    time: '4h ago',
    read: true,
    type: 'warning',
  },
];
