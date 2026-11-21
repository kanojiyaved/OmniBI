import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { KPICard } from '../components/ui/KPICard';
import { ChartCard } from '../components/ui/ChartCard';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { UniversalChartRenderer } from '../components/charts/UniversalChartRenderer';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { getFilteredDataset } from '../core/filters/filterEngine';
import { recommendChartsForDataset } from '../core/charts/chartRecommender';
import { formatMetricValue, generateDynamicKPIs } from '../core/metrics/kpiGenerator';
import { generateDatasetInsights } from '../core/analytics/insightGenerator';
import { computeTopPerformers } from '../core/analytics/leaderboard';
import { DynamicKPIRegistryModal } from '../components/metrics/DynamicKPIRegistryModal';
import { ChartType } from '../types';
import { 
  MOCK_KPIS, 
  MOCK_CHART_DATA, 
  MOCK_DEALS, 
  MockDeal 
} from '../data/mockDesignData';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  Sparkles, 
  Calculator, 
  Trophy, 
  Lightbulb, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export interface OverviewPageProps {
  onOpenImport?: () => void;
  onOpenAi?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ 
  onOpenImport, 
  onOpenAi,
  onNavigateTab 
}) => {
  const { datasets, activeDatasetId, kpis, charts, filters, setCrossFilter } = useAppStore();
  const activeDataset = datasets.find((d) => d.id === activeDatasetId);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [chartTypeOverrides, setChartTypeOverrides] = useState<Record<string, ChartType>>({});

  // Dynamically compute filtered dataset based on active GlobalFilterState
  const filteredDataset = useMemo(() => {
    if (!activeDataset) return null;
    return getFilteredDataset(activeDataset, filters);
  }, [activeDataset, filters]);

  // 1. Dynamic KPIs (calculated reactively on filtered dataset)
  const activeKPIs = filteredDataset 
    ? generateDynamicKPIs(filteredDataset)
    : (activeDataset ? (kpis.length > 0 ? kpis : generateDynamicKPIs(activeDataset)) : null);

  // 2. Dynamic Charts
  const baseCharts = activeDataset
    ? (charts.length > 0 ? charts : recommendChartsForDataset(activeDataset))
    : [];

  const handleChartTypeChange = (chartId: string, newType: ChartType) => {
    setChartTypeOverrides((prev) => ({ ...prev, [chartId]: newType }));
  };

  // 3. Top Performers (calculated reactively on filtered dataset)
  const topPerformers = filteredDataset 
    ? computeTopPerformers(filteredDataset, 5) 
    : (activeDataset ? computeTopPerformers(activeDataset, 5) : null);

  // 4. Data Insights (calculated reactively on filtered dataset)
  const datasetInsights = filteredDataset 
    ? generateDatasetInsights(filteredDataset) 
    : (activeDataset ? generateDatasetInsights(activeDataset) : []);

  // Helper for dynamic recent records columns
  const getDynamicTableColumns = () => {
    if (!activeDataset || !activeDataset.columns) return [];
    const displayCols = activeDataset.columns.slice(0, 6);

    return displayCols.map((col) => {
      const isDate = activeDataset.profiles[col]?.inferredType === 'date' || /date|time|dt/i.test(col);
      const isCurrency = activeDataset.profiles[col]?.inferredType === 'currency' || /revenue|sales|price|amount|profit|spend|salary/i.test(col);
      const isNum = activeDataset.profiles[col]?.inferredType === 'numeric';

      return {
        key: col,
        header: col.replace(/[_\-]/g, ' ').toUpperCase(),
        render: (row: Record<string, any>) => {
          const val = row[col];
          if (val === null || val === undefined || val === '') {
            return <span className="text-slate-400 italic text-[11px]">—</span>;
          }
          if (isCurrency && typeof val === 'number') {
            return <span className="font-bold text-slate-900 font-mono">${val.toLocaleString()}</span>;
          }
          if (isDate) {
            return <span className="text-slate-600 font-mono text-xs">{String(val).split('T')[0]}</span>;
          }
          if (isNum && typeof val === 'number') {
            return <span className="font-medium text-slate-800 font-mono">{val.toLocaleString()}</span>;
          }
          return <span className="text-slate-700 font-medium">{String(val)}</span>;
        },
      };
    });
  };

  // Mock deal columns fallback
  const mockDealColumns = [
    {
      key: 'title',
      header: 'Deal Name',
      render: (d: MockDeal) => (
        <div>
          <p className="font-semibold text-slate-900">{d.title}</p>
          <p className="text-[11px] text-slate-400">{d.company}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (d: MockDeal) => {
        const variantMap: Record<string, 'success' | 'brand' | 'warning' | 'purple'> = {
          'Closed Won': 'success',
          Negotiation: 'purple',
          Proposal: 'brand',
          Qualified: 'warning',
        };
        return <Badge variant={variantMap[d.stage] || 'neutral'} size="sm">{d.stage}</Badge>;
      },
    },
    {
      key: 'amount',
      header: 'Value',
      render: (d: MockDeal) => (
        <span className="font-bold text-slate-900 font-mono">${d.amount.toLocaleString()}</span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (d: MockDeal) => <span className="text-slate-600">{d.owner}</span>,
    },
    {
      key: 'probability',
      header: 'Win Prob.',
      render: (d: MockDeal) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="font-semibold text-slate-700">{d.probability}%</span>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* 1. Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Overview</h1>
            {activeDataset && (
              <Badge variant="purple" size="sm">
                {activeDataset.detectedDomain?.domainLabel || activeDataset.detectedDomain?.domain?.toUpperCase()}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeDataset 
              ? `Real-time analytics synthesized from "${activeDataset.name}" (${activeDataset.rowCount.toLocaleString()} records).`
              : 'Real-time business performance analytics and pipeline intelligence.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeDataset && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRegistryOpen(true)}
              leftIcon={<Calculator className="w-3.5 h-3.5 text-indigo-500" />}
            >
              KPI Registry
            </Button>
          )}
          {onOpenImport && (
            <Button variant="outline" size="sm" onClick={onOpenImport}>
              Import Dataset
            </Button>
          )}
          {onOpenAi && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAi}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            >
              Analyze with Copilot
            </Button>
          )}
        </div>
      </div>

      {/* Global Dynamic Filter Bar */}
      {activeDataset && (
        <GlobalFilterBar />
      )}

      {/* 2. SECTION 1: Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeKPIs && activeKPIs.length > 0 ? (
          activeKPIs.map((kpi) => (
            <KPICard
              key={kpi.id}
              title={kpi.label}
              value={formatMetricValue(kpi.value, kpi.format)}
              change={
                kpi.changePercentage !== undefined
                  ? `${kpi.changePercentage > 0 ? '+' : ''}${kpi.changePercentage}%`
                  : undefined
              }
              isPositive={
                kpi.trend === 'up'
                  ? kpi.isPositiveGood
                  : kpi.trend === 'down'
                  ? !kpi.isPositiveGood
                  : true
              }
              timeframe={kpi.previousValue !== undefined ? 'vs. previous period' : 'all-time cumulative'}
              tooltip={kpi.description}
              sparklineData={kpi.sparklineData}
            />
          ))
        ) : (
          MOCK_KPIS.map((kpi) => (
            <KPICard
              key={kpi.id}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              isPositive={kpi.isPositive}
              timeframe={kpi.timeframe}
              iconName={kpi.iconName}
            />
          ))
        )}
      </div>

      {/* 3. SECTION 2, 3 & 4: Visual Performance, Primary Analytics & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeDataset && baseCharts.length > 0 ? (
          <>
            {/* Primary Recommended Chart (2 Columns) */}
            {baseCharts[0] && (
              <ChartCard
                title={baseCharts[0].title}
                subtitle={baseCharts[0].subtitle}
                className={baseCharts.length > 1 ? 'lg:col-span-2' : 'lg:col-span-3'}
                actionNode={
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                    {(['line', 'area', 'bar', 'donut'] as ChartType[]).map((t) => {
                      const curType = chartTypeOverrides[baseCharts[0].id] || baseCharts[0].chartType;
                      return (
                        <button
                          key={t}
                          onClick={() => handleChartTypeChange(baseCharts[0].id, t)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-all ${
                            curType === t
                              ? 'bg-white shadow-xs text-indigo-600 font-bold'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                }
              >
                <UniversalChartRenderer
                  spec={{
                    ...baseCharts[0],
                    chartType: chartTypeOverrides[baseCharts[0].id] || baseCharts[0].chartType,
                  }}
                  data={filteredDataset ? filteredDataset.data : activeDataset.data}
                  height={280}
                  activeCrossFilter={filters.activeCrossFilter}
                  onCrossFilter={(col, val) => setCrossFilter(col, val)}
                />
              </ChartCard>
            )}

            {/* Secondary Distribution / Categorical Chart (1 Column) */}
            {baseCharts[1] && (
              <ChartCard
                title={baseCharts[1].title}
                subtitle={baseCharts[1].subtitle}
                actionNode={
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                    {(['bar', 'donut', 'line', 'area'] as ChartType[]).map((t) => {
                      const curType = chartTypeOverrides[baseCharts[1].id] || baseCharts[1].chartType;
                      return (
                        <button
                          key={t}
                          onClick={() => handleChartTypeChange(baseCharts[1].id, t)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-all ${
                            curType === t
                              ? 'bg-white shadow-xs text-indigo-600 font-bold'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                }
              >
                <UniversalChartRenderer
                  spec={{
                    ...baseCharts[1],
                    chartType: chartTypeOverrides[baseCharts[1].id] || baseCharts[1].chartType,
                  }}
                  data={filteredDataset ? filteredDataset.data : activeDataset.data}
                  height={280}
                  activeCrossFilter={filters.activeCrossFilter}
                  onCrossFilter={(col, val) => setCrossFilter(col, val)}
                />
              </ChartCard>
            )}

            {/* Tertiary & Quaternary Charts (e.g. Scatter or Additional Distribution) */}
            {baseCharts.slice(2, 4).map((chartSpec) => {
              const curType = chartTypeOverrides[chartSpec.id] || chartSpec.chartType;
              return (
                <ChartCard
                  key={chartSpec.id}
                  title={chartSpec.title}
                  subtitle={chartSpec.subtitle}
                  className="lg:col-span-3"
                  actionNode={
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                      {(['bar', 'line', 'area', 'scatter'] as ChartType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => handleChartTypeChange(chartSpec.id, t)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-all ${
                            curType === t
                              ? 'bg-white shadow-xs text-indigo-600 font-bold'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <UniversalChartRenderer
                    spec={{
                      ...chartSpec,
                      chartType: curType,
                    }}
                    data={filteredDataset ? filteredDataset.data : activeDataset.data}
                    height={260}
                    activeCrossFilter={filters.activeCrossFilter}
                    onCrossFilter={(col, val) => setCrossFilter(col, val)}
                  />
                </ChartCard>
              );
            })}
          </>
        ) : (
          <>
            {/* Mock Charts Fallback */}
            <ChartCard
              title="Revenue Growth & Target Projections"
              subtitle="Monthly actual revenue vs. targeted quarterly milestones"
              className="lg:col-span-2"
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="revenue" name="Actual Revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Lead Volume & Closed Deals"
              subtitle="Monthly qualified leads conversion"
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_CHART_DATA.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Bar dataKey="deals" name="Won Deals" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </>
        )}
      </div>

      {/* 4. SECTION 6, 7 & 8: Top Performers, Data Insights & Quality Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 6: Top Performers Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Top Performers</h3>
              </div>
              {topPerformers && (
                <span className="text-[10px] text-slate-400 font-mono">
                  by {topPerformers.metricColumn.replace(/_/g, ' ').toUpperCase()}
                </span>
              )}
            </div>

            {topPerformers && topPerformers.items.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.items.map((item) => (
                  <div key={item.rank} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        item.rank === 1 
                          ? 'bg-amber-100 text-amber-700' 
                          : item.rank === 2 
                          ? 'bg-slate-200 text-slate-700' 
                          : item.rank === 3 
                          ? 'bg-amber-50 text-amber-800' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.rank}
                      </span>
                      <span className="font-semibold text-slate-800 truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-900 font-mono">{item.formattedValue}</span>
                      <span className="text-[10px] text-slate-400 font-mono w-10 text-right">
                        {item.sharePercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                Ingest a dataset with an entity and numeric column to calculate top rankings.
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Rankings calculated dynamically</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>

        {/* SECTION 7: Executive Data Insights */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Executive Data Insights</h3>
              </div>
              <Badge variant="purple" size="sm">AI Derived</Badge>
            </div>

            {datasetInsights.length > 0 ? (
              <div className="space-y-2.5">
                {datasetInsights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-slate-800 font-semibold">{insight.title}</strong>
                      {insight.metricHighlight && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {insight.metricHighlight}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{insight.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                Upload a dataset to extract automated pattern and performance insights.
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Deterministic multi-signal synthesis</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </div>

        {/* SECTION 8: Data Quality Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Data Health & Quality</h3>
              </div>
              {activeDataset?.quality ? (
                <Badge
                  variant={(activeDataset.quality.overallScore ?? (activeDataset.quality as any).healthScore ?? 100) >= 80 ? 'success' : 'warning'}
                  size="sm"
                >
                  {activeDataset.quality.overallScore ?? (activeDataset.quality as any).healthScore ?? 100}/100 Health
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">No Data</Badge>
              )}
            </div>

            {activeDataset?.quality ? (
              <div className="space-y-3 text-xs">
                {/* Score Bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Overall Hygiene Score</span>
                    <strong className="text-slate-800">{activeDataset.quality.overallScore ?? (activeDataset.quality as any).healthScore ?? 100}%</strong>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        (activeDataset.quality.overallScore ?? (activeDataset.quality as any).healthScore ?? 100) >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${activeDataset.quality.overallScore ?? (activeDataset.quality as any).healthScore ?? 100}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Clean Records</span>
                    <strong className="text-slate-800 font-mono font-bold">
                      {activeDataset.rowCount.toLocaleString()}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Duplicate Rows</span>
                    <strong className="text-slate-800 font-mono font-bold">
                      {activeDataset.quality.duplicateRowsCount}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Missing Cells</span>
                    <strong className="text-slate-800 font-mono font-bold">
                      {activeDataset.quality.missingCellsCount}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Outliers Detected</span>
                    <strong className="text-slate-800 font-mono font-bold">
                      {activeDataset.quality.outliersCount ?? activeDataset.quality.anomaliesDetected?.filter(a => a.type === 'outliers').length ?? 0}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                No active dataset profile available.
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            {onNavigateTab ? (
              <button
                onClick={() => onNavigateTab('profiler')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                Inspect Profiler Diagnostics <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">Non-destructive cleaning verified</span>
            )}
          </div>
        </div>
      </div>

      {/* 5. SECTION 5: Recent Records (Actual Uploaded Records) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Records</h3>
              <p className="text-xs text-slate-500">
                {activeDataset 
                  ? `Live transactional entries from active dataset "${activeDataset.name}".`
                  : 'Pipeline progression across key accounts.'}
              </p>
            </div>
          </div>
          {onNavigateTab && (
            <Button 
              variant="ghost" 
              size="sm" 
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => onNavigateTab('datatable')}
            >
              View Full Table
            </Button>
          )}
        </div>

        {activeDataset ? (
          <DataTable 
            data={filteredDataset ? filteredDataset.data.slice(0, 10) : activeDataset.data.slice(0, 10)} 
            columns={getDynamicTableColumns()} 
            pageSize={5} 
          />
        ) : (
          <DataTable 
            data={MOCK_DEALS} 
            columns={mockDealColumns} 
            searchKey="company" 
            pageSize={5} 
          />
        )}
      </div>

      {/* KPI Registry Modal */}
      <DynamicKPIRegistryModal
        isOpen={isRegistryOpen}
        onClose={() => setIsRegistryOpen(false)}
      />
    </div>
  );
};
