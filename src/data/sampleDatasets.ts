import { BusinessDomain } from '../types';

export interface SampleDatasetEntry {
  id: string;
  name: string;
  domain: BusinessDomain;
  description: string;
  csvContent: string;
}

export const SAMPLE_DATASETS: SampleDatasetEntry[] = [
  // 1. Sales Dataset
  {
    id: 'sample-ecommerce-sales',
    name: 'Global Omnichannel Sales & Orders',
    domain: 'sales',
    description: 'Enterprise order records with customer segments, product categories, quantities, unit prices, discounts, and order regions.',
    csvContent: `OrderID,OrderDate,CustomerSegment,ProductCategory,SubCategory,Region,UnitPrice,Quantity,Discount,TotalSales,Profit,ReturnStatus
ORD-2024-1001,2024-01-05,Consumer,Electronics,Smartphones,North America,699,2,0.05,1328.10,312.40,Completed
ORD-2024-1002,2024-01-08,Corporate,Office Supplies,Binders,Europe,14.50,15,0.00,217.50,78.30,Completed
ORD-2024-1003,2024-01-12,Home Office,Furniture,Chairs,North America,249.99,3,0.10,674.97,142.50,Completed
ORD-2024-1004,2024-01-15,Consumer,Electronics,Accessories,Asia Pacific,49.99,5,0.00,249.95,95.00,Completed
ORD-2024-1005,2024-01-19,Corporate,Technology,Laptops,Europe,1199.00,4,0.15,4076.60,890.20,Completed
ORD-2024-1006,2024-01-22,Consumer,Office Supplies,Paper,North America,8.50,20,0.00,170.00,45.20,Returned
ORD-2024-1007,2024-01-26,Home Office,Electronics,Monitors,Latin America,299.00,2,0.05,568.10,140.00,Completed
ORD-2024-1008,2024-02-02,Corporate,Furniture,Desks,North America,450.00,2,0.10,810.00,195.00,Completed
ORD-2024-1009,2024-02-07,Consumer,Technology,Audio,Europe,129.50,4,0.00,518.00,180.50,Completed
ORD-2024-1010,2024-02-14,Home Office,Office Supplies,Storage,Asia Pacific,65.00,6,0.08,358.80,92.00,Completed
ORD-2024-1011,2024-02-18,Consumer,Electronics,Smartphones,North America,799.00,1,0.00,799.00,210.00,Completed
ORD-2024-1012,2024-02-23,Corporate,Technology,Accessories,Europe,35.00,12,0.10,378.00,110.00,Completed
ORD-2024-1013,2024-03-01,Home Office,Furniture,Chairs,Europe,249.99,4,0.12,879.96,215.00,Completed
ORD-2024-1014,2024-03-06,Consumer,Technology,Laptops,North America,1299.00,2,0.05,2468.10,580.00,Completed
ORD-2024-1015,2024-03-12,Corporate,Office Supplies,Binders,Latin America,14.50,25,0.15,308.12,85.00,Returned
ORD-2024-1016,2024-03-18,Consumer,Electronics,Audio,Asia Pacific,159.00,3,0.00,477.00,165.00,Completed
ORD-2024-1017,2024-03-24,Home Office,Office Supplies,Paper,North America,8.50,40,0.10,306.00,72.00,Completed
ORD-2024-1018,2024-04-02,Corporate,Furniture,Desks,Europe,499.00,3,0.05,1422.15,330.00,Completed
ORD-2024-1019,2024-04-08,Consumer,Electronics,Monitors,North America,329.00,2,0.00,658.00,195.00,Completed
ORD-2024-1020,2024-04-15,Home Office,Technology,Smartphones,Asia Pacific,749.00,2,0.08,1378.16,340.00,Completed`,
  },

  // 2. Marketing Dataset
  {
    id: 'sample-marketing-campaigns',
    name: 'Omnichannel Digital Marketing Performance',
    domain: 'marketing',
    description: 'Ad campaign telemetry covering impressions, clicks, conversions, ad spend, channel attribution, and ROAS.',
    csvContent: `CampaignID,CampaignName,Channel,LaunchDate,AdSpend,Impressions,Clicks,Conversions,RevenueGenerated,CampaignStatus
CMP-01,Spring Brand Awareness,Search,2024-01-10,4500,250000,12500,620,18600,Active
CMP-02,Retargeting High Intent,Social,2024-01-15,3200,180000,9400,510,15300,Active
CMP-03,Email Loyalty Newsletter,Email,2024-02-01,800,95000,7600,420,12600,Completed
CMP-04,Influencer Spring Spotlight,Influencer,2024-02-14,6000,320000,14200,710,21300,Completed
CMP-05,Display Prospecting Banner,Display,2024-03-01,2800,410000,8200,280,7800,Active
CMP-06,Affiliate Referral Network,Affiliate,2024-03-15,1500,110000,5500,330,9900,Active
CMP-07,YouTube Video In-Stream,Video,2024-04-01,5200,290000,11600,580,17400,Active
CMP-08,LinkedIn B2B Lead Gen,Social,2024-04-10,3800,140000,7000,390,13650,Active
CMP-09,Google Search Brand Core,Search,2024-04-15,4000,210000,10500,530,15900,Active
CMP-10,Instagram Reels Showcase,Social,2024-04-20,2500,160000,6800,340,10200,Active
CMP-11,Customer Reactivation Drip,Email,2024-05-01,1200,75000,4500,290,8700,Completed
CMP-12,TikTok Creator Challenge,Influencer,2024-05-10,5500,380000,13000,650,19500,Active
CMP-13,Programmatic Retargeting,Display,2024-05-15,3100,240000,7900,310,9300,Active
CMP-14,Partner Marketplace Leads,Affiliate,2024-05-20,1800,125000,5200,280,8400,Active
CMP-15,Webinar Series Mid-Funnel,Video,2024-06-01,4600,195000,11000,520,15600,Active
CMP-16,Executive Roundtable Ads,Social,2024-06-10,3500,130000,9700,480,14400,Active`,
  },

  // 3. Financial Dataset
  {
    id: 'sample-financial-performance',
    name: 'Corporate Financial Performance & Budget Variance',
    domain: 'finance',
    description: 'Quarterly department budgets, actual expenditures, recognized revenue, headcounts, and variance ratios.',
    csvContent: `Department,FiscalQuarter,BudgetAllocated,ActualSpend,RevenueGenerated,Headcount,BudgetVariance,SpendStatus
Engineering,2024-Q1,1200000,1140000,0,45,60000,Under Budget
Sales & Marketing,2024-Q1,850000,920000,2850000,28,-70000,Over Budget
Product Development,2024-Q1,450000,435000,0,16,15000,Under Budget
Customer Success,2024-Q1,320000,310000,620000,14,10000,Under Budget
General & Administrative,2024-Q1,280000,275000,0,9,5000,Under Budget
Engineering,2024-Q2,1300000,1280000,0,48,20000,Under Budget
Sales & Marketing,2024-Q2,950000,1020000,3400000,32,-70000,Over Budget
Product Development,2024-Q2,480000,470000,0,18,10000,Under Budget
Customer Success,2024-Q2,350000,345000,740000,15,5000,Under Budget
General & Administrative,2024-Q2,290000,285000,0,10,5000,Under Budget
Engineering,2024-Q3,1400000,1390000,0,52,10000,Under Budget
Sales & Marketing,2024-Q3,1100000,1180000,4100000,36,-80000,Over Budget
Product Development,2024-Q3,520000,510000,0,20,10000,Under Budget
Customer Success,2024-Q3,380000,370000,890000,16,10000,Under Budget
General & Administrative,2024-Q3,300000,295000,0,10,5000,Under Budget`,
  },

  // 4. Customer Dataset
  {
    id: 'sample-customer-analytics',
    name: 'Customer Cohorts, Retention & LTV',
    domain: 'customer_analytics',
    description: 'Customer directory tracking acquisition channels, contract tiers, lifetime values, NPS, and support cases.',
    csvContent: `CustomerID,CustomerName,Email,AccountTier,LifetimeValue,TotalOrders,FirstOrderDate,LastOrderDate,NPSScore,AccountStatus
CUST-001,Acme Corporation,contact@acme.com,Enterprise,48500,24,2022-03-15,2024-04-10,9,Active
CUST-002,Global Logistics Ltd,ops@globallog.com,Enterprise,62000,38,2021-08-20,2024-04-12,10,Active
CUST-003,Starlight Media,billing@starlight.com,Growth,18200,12,2023-01-10,2024-03-25,8,Active
CUST-004,Vanguard Retail,procure@vanguard.com,Growth,24500,15,2022-11-05,2024-04-01,7,Active
CUST-005,Pinnacle Systems,admin@pinnacle.com,Starter,6400,5,2023-06-18,2024-01-14,5,At Risk
CUST-006,Horizon Biotech,info@horizonbio.com,Enterprise,84000,42,2021-02-14,2024-04-15,10,Active
CUST-007,Apex Financial,support@apexfin.com,Growth,31000,19,2022-09-01,2024-03-30,8,Active
CUST-008,Solaria Energy,team@solaria.com,Starter,4200,3,2023-10-22,2024-02-18,4,Churned
CUST-009,Beacon Software,sales@beaconsoft.io,Growth,27500,17,2022-05-12,2024-04-02,9,Active
CUST-010,Crestline Transport,dispatch@crestline.net,Enterprise,54000,31,2021-12-01,2024-04-11,8,Active
CUST-011,Driftwood Publishing,ed@driftwood.org,Starter,7800,6,2023-04-15,2024-02-28,6,At Risk
CUST-012,Element Analytics,contact@element.ai,Enterprise,72000,36,2021-06-19,2024-04-14,10,Active
CUST-013,Frontier Robotics,info@frontierrobotics.com,Growth,33500,21,2022-08-25,2024-03-18,8,Active
CUST-014,Granite Capital,admin@granitecap.com,Enterprise,91000,45,2020-11-10,2024-04-16,9,Active
CUST-015,Haven Hospitality,ops@havenhotels.com,Growth,19800,13,2023-02-04,2024-03-22,7,Active
CUST-016,Ironclad Cyber,security@ironclad.tech,Enterprise,68000,29,2022-01-30,2024-04-08,10,Active`,
  },

  // 5. HR Dataset
  {
    id: 'sample-hr-workforce',
    name: 'Workforce Demographics & Compensation',
    domain: 'hr',
    description: 'Human resources headcount directory tracking departments, job roles, salary bands, hire dates, and performance scores.',
    csvContent: `EmployeeID,EmployeeName,Department,JobRole,AnnualSalary,HireDate,PerformanceRating,EmploymentStatus
EMP-101,Sarah Jenkins,Engineering,Lead Software Architect,165000,2020-03-15,5,Active
EMP-102,David Chen,Engineering,Senior Backend Engineer,135000,2021-06-10,4,Active
EMP-103,Elena Rodriguez,Sales,Enterprise Account Exec,125000,2021-09-01,5,Active
EMP-104,Marcus Vance,Marketing,Content Marketing Manager,92000,2022-02-15,4,Active
EMP-105,Chloe Dubois,Product,Principal Product Manager,150000,2020-11-20,5,Active
EMP-106,Amir Patel,Finance,Senior Financial Analyst,105000,2022-05-08,4,Active
EMP-107,Grace Kim,HR,People Operations Specialist,78000,2023-01-16,4,Active
EMP-108,Liam Gallagher,Engineering,Fullstack Developer,115000,2022-08-22,3,Active
EMP-109,Sophia Martinez,Customer Success,Technical Support Lead,88000,2021-04-12,4,Active
EMP-110,Noah Taylor,Sales,Sales Development Rep,65000,2023-07-01,3,Active
EMP-111,Rachel Green,Marketing,Growth Marketing Lead,118000,2021-03-10,5,Active
EMP-112,Oliver Queen,Engineering,DevOps Infrastructure Engineer,132000,2021-10-05,4,Active
EMP-113,Maya Lin,Product,UX Research Director,142000,2020-08-15,5,Active
EMP-114,Lucas Scott,Finance,Financial Controller,128000,2021-01-20,4,Active
EMP-115,Hannah Abbott,HR,Recruiting Manager,95000,2022-04-18,4,Active
EMP-116,Ethan Hunt,Sales,Regional Sales Director,155000,2020-05-12,5,Active`,
  },

  // 6. Inventory Dataset
  {
    id: 'sample-inventory-supply',
    name: 'Inventory Levels, Stock Valuation & Warehousing',
    domain: 'inventory',
    description: 'Warehouse stock tracking SKUs, category classifications, quantities on hand, reorder points, unit costs, and warehouse locations.',
    csvContent: `SKU,ItemName,Category,StockQuantity,ReorderLevel,UnitCost,UnitRetailPrice,WarehouseLocation,RestockStatus
SKU-501,Ergonomic Mechanical Keyboard,Electronics,420,100,45.00,89.99,Warehouse East,Adequate
SKU-502,UltraWide 34-Inch Monitor,Electronics,85,50,280.00,499.99,Warehouse West,Adequate
SKU-503,Wireless Noise-Canceling Headset,Electronics,45,60,65.00,129.99,Warehouse East,Reorder Needed
SKU-504,Standing Desk Converter,Furniture,120,40,110.00,199.99,Warehouse Central,Adequate
SKU-505,Mesh Lumbar Office Chair,Furniture,28,30,85.00,159.99,Warehouse Central,Reorder Needed
SKU-506,USB-C Multiport Docking Station,Accessories,650,150,22.00,49.99,Warehouse East,Adequate
SKU-507,Anti-Glare Desk Lamp,Accessories,310,80,18.50,39.99,Warehouse West,Adequate
SKU-508,Vertical Wireless Mouse,Accessories,18,50,14.00,29.99,Warehouse West,Critical Low
SKU-509,Dual Monitor Aluminum Arm,Furniture,95,35,55.00,99.99,Warehouse East,Adequate
SKU-510,External NVMe SSD 2TB,Electronics,210,75,95.00,169.99,Warehouse West,Adequate
SKU-511,Noise-Isolating Desk Divider,Furniture,60,25,48.00,89.99,Warehouse Central,Adequate
SKU-512,Smart Cable Management Spine,Accessories,480,120,12.00,24.99,Warehouse East,Adequate
SKU-513,4K UHD Streaming Webcam,Electronics,140,50,68.00,119.99,Warehouse West,Adequate
SKU-514,Adjustable Footrest Platform,Furniture,190,60,25.00,49.99,Warehouse Central,Adequate
SKU-515,High-Speed Wireless Charger,Accessories,520,100,16.50,34.99,Warehouse East,Adequate
SKU-516,Leather Executive Desk Pad,Accessories,340,80,21.00,44.99,Warehouse West,Adequate`,
  },

  // 7. Dataset with Unfamiliar Column Names
  {
    id: 'sample-unfamiliar-columns',
    name: 'Legacy ERP Export (Unfamiliar Column Mappings)',
    domain: 'sales',
    description: 'Raw transactional dump using non-standard, abbreviated column names (Txn_Dt, Net_Sales, Buyer_Nm, Item_Qty, Cost_Basis).',
    csvContent: `Txn_Id,Txn_Dt,Buyer_Nm,Prod_Cat,Item_Qty,Net_Sales,Cost_Basis,Ord_Stat
TXN-901,2024-01-08,Alpha Corp,Hardware,5,4500.00,3100.00,Shipped
TXN-902,2024-01-14,Beta LLC,Services,1,1200.00,600.00,Delivered
TXN-903,2024-01-22,Gamma Ind,Hardware,12,9800.00,6400.00,Shipped
TXN-904,2024-02-05,Delta Tech,Software,3,3600.00,900.00,Delivered
TXN-905,2024-02-18,Epsilon Co,Hardware,8,6400.00,4100.00,Shipped
TXN-906,2024-03-02,Zeta Global,Services,2,2400.00,1100.00,Delivered
TXN-907,2024-03-15,Eta Partners,Software,6,7200.00,1800.00,Pending
TXN-908,2024-03-29,Theta Group,Hardware,15,11500.00,7500.00,Delivered
TXN-909,2024-04-05,Iota Systems,Services,4,4800.00,2200.00,Shipped
TXN-910,2024-04-12,Kappa Corp,Software,5,6000.00,1500.00,Delivered
TXN-911,2024-04-20,Lambda LLC,Hardware,7,5600.00,3500.00,Shipped
TXN-912,2024-04-28,Mu Dynamics,Services,3,3600.00,1800.00,Delivered
TXN-913,2024-05-06,Nu Technologies,Software,8,9600.00,2400.00,Shipped
TXN-914,2024-05-15,Xi Ventures,Hardware,10,8000.00,5200.00,Delivered
TXN-915,2024-05-22,Omicron Labs,Services,2,2400.00,1200.00,Delivered
TXN-916,2024-05-30,Pi Solutions,Hardware,14,11200.00,7000.00,Shipped`,
  },

  // 8. Dataset with Missing Values
  {
    id: 'sample-missing-values',
    name: 'Transactional Log with Incomplete Data & Nulls',
    domain: 'general',
    description: 'Real-world noisy dataset featuring null cells, missing dates, unclassified categories, and blank metric values.',
    csvContent: `RecordID,TransactionDate,CustomerGroup,Channel,SalesAmount,DiscountRate,SatisfactionScore
REC-01,2024-01-10,Enterprise,Direct,4500,0.05,9
REC-02,,SMB,Partner,1200,,8
REC-03,2024-01-18,,Direct,2800,0.10,
REC-04,2024-01-25,Enterprise,Online,,0.00,10
REC-05,2024-02-02,Consumer,,850,0.15,7
REC-06,,Enterprise,Direct,5200,,9
REC-07,2024-02-15,SMB,,1400,0.05,
REC-08,2024-02-22,,Partner,,0.20,6
REC-09,2024-03-01,Enterprise,Online,3900,0.05,9
REC-10,2024-03-08,SMB,Direct,1800,,8
REC-11,,Consumer,Partner,950,0.10,7
REC-12,2024-03-22,Enterprise,,6100,0.00,10
REC-13,2024-03-29,,Online,,0.15,
REC-14,2024-04-05,SMB,Direct,2200,0.05,8
REC-15,,Enterprise,Partner,4700,,9
REC-16,2024-04-18,Consumer,Online,1100,0.20,7`,
  },

  // 9. Dataset with Duplicate Records
  {
    id: 'sample-duplicate-records',
    name: 'Retail Transaction Log with Redundant Duplicates',
    domain: 'sales',
    description: 'Dataset containing accidental double-entries, duplicate order IDs, and identical rows requiring automated cleaning.',
    csvContent: `OrderID,TransactionDate,StoreBranch,CashierID,SaleAmount,PaymentMethod
ORD-701,2024-03-01,Downtown Metro,CSH-12,125.50,Credit Card
ORD-701,2024-03-01,Downtown Metro,CSH-12,125.50,Credit Card
ORD-702,2024-03-01,Westside Mall,CSH-08,45.00,Cash
ORD-703,2024-03-02,Airport Terminal,CSH-19,89.20,Apple Pay
ORD-703,2024-03-02,Airport Terminal,CSH-19,89.20,Apple Pay
ORD-704,2024-03-03,Downtown Metro,CSH-12,210.00,Credit Card
ORD-705,2024-03-04,Westside Mall,CSH-05,64.80,Debit Card
ORD-705,2024-03-04,Westside Mall,CSH-05,64.80,Debit Card
ORD-706,2024-03-05,Airport Terminal,CSH-19,150.00,Credit Card
ORD-707,2024-03-06,Downtown Metro,CSH-14,78.50,Cash
ORD-707,2024-03-06,Downtown Metro,CSH-14,78.50,Cash
ORD-708,2024-03-07,Westside Mall,CSH-08,135.00,Credit Card
ORD-709,2024-03-08,Airport Terminal,CSH-21,95.20,Debit Card
ORD-710,2024-03-09,Downtown Metro,CSH-12,180.00,Apple Pay
ORD-710,2024-03-09,Downtown Metro,CSH-12,180.00,Apple Pay
ORD-711,2024-03-10,Westside Mall,CSH-05,52.00,Cash`,
  },

  // 10. SaaS Growth & Subscription Metrics
  {
    id: 'sample-saas-metrics',
    name: 'B2B SaaS Growth & Churn Metrics',
    domain: 'saas',
    description: 'B2B subscription telemetry covering PlanTier, MonthlyRecurringRevenue (MRR), ChurnStatus, SignupDate, NPSScore, and SupportTickets.',
    csvContent: `CompanyID,CompanyName,PlanTier,MonthlyRecurringRevenue,SeatsCount,SignupDate,ContractTerm,ChurnStatus,NPSScore,SupportTicketsCount
CMP-101,Apex Digital,Enterprise,4500,120,2023-01-15,Annual,Active,9,2
CMP-102,BlueWave Technologies,Growth,1200,35,2023-02-10,Monthly,Active,8,5
CMP-103,CloudScale Inc,Starter,350,8,2023-03-01,Monthly,Churned,4,12
CMP-104,Dynamo Analytics,Enterprise,5800,180,2023-03-18,Annual,Active,10,1
CMP-105,Echo Logistics,Growth,1500,45,2023-04-05,Annual,Active,8,3
CMP-106,Fusion Health,Enterprise,7200,250,2023-04-20,Annual,Active,9,4
CMP-107,GreenLight Media,Starter,400,10,2023-05-11,Monthly,Churned,5,8
CMP-108,Hyperion Labs,Growth,1800,50,2023-06-02,Annual,Active,7,6
CMP-109,Infinite Systems,Enterprise,6400,210,2023-06-19,Annual,Active,10,2
CMP-110,Jupiter Retail,Growth,1350,40,2023-07-04,Monthly,Active,6,9
CMP-111,Krypton Security,Enterprise,8500,310,2023-07-22,Annual,Active,9,3
CMP-112,Lumina Design,Starter,350,6,2023-08-14,Monthly,Active,7,4
CMP-113,Matrix Robotics,Enterprise,9100,340,2023-09-01,Annual,Active,10,1
CMP-114,Nexus Financial,Growth,2100,60,2023-09-20,Annual,Active,8,4
CMP-115,Orbit AI,Growth,1650,48,2023-10-05,Monthly,Churned,3,14`,
  },
];
