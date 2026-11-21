import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { extractFinancialReportData } from '../core/analytics/moduleAdapters';
import { checkReportsAvailability } from '../core/analytics/moduleAvailability';
import { ModuleUnavailableState } from '../components/ui/ModuleUnavailableState';
import { ExportModal } from '../components/export/ExportModal';
import { exportToCSV, downloadBlob, sanitizeFilename } from '../core/export/exportEngine';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  Trophy, 
  GitCompare, 
  Download, 
  FileText, 
  Printer, 
  Share2
} from 'lucide-react';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { getFilteredDataset } from '../core/filters/filterEngine';

export interface ReportsPageProps {
  onOpenImport?: () => void;
  onNavigateTab?: (tab: string) => void;
}

type ReportTab = 'trend' | 'distribution' | 'ranking' | 'correlation' | 'comparative';

export const ReportsPage: React.FC<ReportsPageProps> = ({
  onOpenImport,
  onNavigateTab,
}) => {
  const { datasets, activeDatasetId, filters } = useAppStore();
  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];

  const filteredDataset = useMemo(() => {
    if (!activeDataset) return null;
    return getFilteredDataset(activeDataset, filters);
  }, [activeDataset, filters]);

  const availability = useMemo(
    () => checkReportsAvailability(activeDataset || null),
    [activeDataset]
  );

  const financialData = useMemo(() => {
    if (!availability.isAvailable) return null;
    return extractFinancialReportData(filteredDataset || activeDataset);
  }, [filteredDataset, activeDataset, availability.isAvailable]);

  const [activeTab, setActiveTab] = useState<ReportTab>('trend');

  // Compute correlation between first two numeric columns if available
  const correlationData = useMemo(() => {
    const target = filteredDataset || activeDataset;
    if (!target || !target.data || target.data.length < 2) return null;
    const numCols = target.columns.filter((c) =>
      ['numeric', 'currency', 'percentage'].includes(target.profiles[c]?.inferredType)
    );
    if (numCols.length < 2) return null;

    const colX = numCols[0];
    const colY = numCols[1];

    const parseNum = (v: any) => Number(String(v || '0').replace(/[$€£¥,%\s]/g, '')) || 0;

    const pairs = target.data.slice(0, 100).map((r) => ({
      x: parseNum(r[colX]),
      y: parseNum(r[colY]),
    }));

    // Pearson Correlation coefficient
    const n = pairs.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (const p of pairs) {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
      sumY2 += p.y * p.y;
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const r = denominator !== 0 ? Number((numerator / denominator).toFixed(3)) : 0;

    return { colX, colY, pairs, r };
  }, [activeDataset]);

  // Compute comparative analysis between top 2 categories
  const comparativeData = useMemo(() => {
    if (!financialData || financialData.categoryBreakdown.length < 2) return null;
    const catA = financialData.categoryBreakdown[0];
    const catB = financialData.categoryBreakdown[1];
    const delta = catA.total - catB.total;
    const deltaPct = catB.total > 0 ? Number(((delta / catB.total) * 100).toFixed(1)) : 0;
    return { catA, catB, delta, deltaPct };
  }, [financialData]);

  if (!availability.isAvailable || !financialData) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in pb-12">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated trend, distribution, ranking, correlation, and comparative business intelligence.
          </p>
        </div>
        <ModuleUnavailableState
          availability={availability}
          datasetName={activeDataset?.name}
          columns={activeDataset?.columns}
          onOpenImport={onOpenImport}
          onNavigateTab={onNavigateTab}
        />
      </div>
    );
  }

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExportCSV = () => {
    if (!financialData.categoryBreakdown.length) return;
    const blob = exportToCSV(
      financialData.categoryBreakdown,
      ['category', 'total', 'mean', 'count', 'sharePct'],
      { preventFormulaInjection: true }
    );
    downloadBlob(blob, sanitizeFilename(`executive_report_${activeDataset?.name || 'report'}`, 'csv'));
  };

  const handleExportJSON = () => {
    const jsonBlob = new Blob([JSON.stringify(financialData, null, 2)], { type: 'application/json' });
    downloadBlob(jsonBlob, sanitizeFilename(`executive_report_${activeDataset?.name || 'data'}`, 'json'));
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Deep analytical reports synthesized from "{activeDataset.name}".
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportJSON}
            leftIcon={<FileText className="w-3.5 h-3.5" />}
          >
            Export JSON
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsExportModalOpen(true)}
            leftIcon={<Download className="w-3.5 h-3.5 text-purple-600" />}
          >
            Export Center
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => window.print()}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print / PDF
          </Button>
        </div>
      </div>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />

      {/* Global Dynamic Filter Bar */}
      {activeDataset && (
        <GlobalFilterBar />
      )}

      {/* Analytical Sub-View Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('trend')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'trend' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          Trend Analysis
        </button>
        <button
          onClick={() => setActiveTab('distribution')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'distribution' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PieIcon className="w-3.5 h-3.5 text-purple-500" />
          Distribution Analysis
        </button>
        <button
          onClick={() => setActiveTab('ranking')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'ranking' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          Ranking Analysis
        </button>
        <button
          onClick={() => setActiveTab('correlation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'correlation' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-500" />
          Correlation Analysis
        </button>
        <button
          onClick={() => setActiveTab('comparative')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'comparative' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5 text-rose-500" />
          Comparative Analysis
        </button>
      </div>

      {/* TAB 1: TREND ANALYSIS */}
      {activeTab === 'trend' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Temporal Performance Trajectory</h3>
              <p className="text-xs text-slate-400">Progression of {financialData.primaryMetricName} across sequential records</p>
            </div>
            <Badge variant="purple" size="sm">Trend Trajectory</Badge>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={financialData.categoryBreakdown}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fill="url(#reportGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 2: DISTRIBUTION ANALYSIS */}
      {activeTab === 'distribution' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Categorical Share & Volume Distribution</h3>
              <p className="text-xs text-slate-400">Share of total {financialData.primaryMetricName} by segment</p>
            </div>
            <Badge variant="brand" size="sm">Distribution Breakdown</Badge>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={financialData.categoryBreakdown}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Total Volume ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 3: RANKING ANALYSIS */}
      {activeTab === 'ranking' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Executive Leaderboard Ranking</h3>
              <p className="text-xs text-slate-400">Ordinal ranking sorted by contribution to {financialData.primaryMetricName}</p>
            </div>
            <Badge variant="warning" size="sm">Leaderboard</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Category / Segment</th>
                  <th className="py-3 px-4 text-right">Transactions</th>
                  <th className="py-3 px-4 text-right">Mean</th>
                  <th className="py-3 px-4 text-right">Total Aggregate</th>
                  <th className="py-3 px-4 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {financialData.categoryBreakdown.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[11px] ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">{row.category}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{row.count.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-slate-700">${row.mean.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">${row.total.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-semibold text-purple-700">{row.sharePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CORRELATION ANALYSIS */}
      {activeTab === 'correlation' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Bivariate Correlation & Scatter Dispersion</h3>
              <p className="text-xs text-slate-400">
                {correlationData
                  ? `Pearson r = ${correlationData.r} between "${correlationData.colX}" and "${correlationData.colY}"`
                  : 'Requires at least two numerical metrics in dataset.'}
              </p>
            </div>
            {correlationData && (
              <Badge variant={Math.abs(correlationData.r) > 0.5 ? 'success' : 'neutral'} size="sm">
                r = {correlationData.r} ({Math.abs(correlationData.r) > 0.7 ? 'Strong' : Math.abs(correlationData.r) > 0.4 ? 'Moderate' : 'Weak'})
              </Badge>
            )}
          </div>

          {correlationData ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="x" name={correlationData.colX} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis type="number" dataKey="y" name={correlationData.colY} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Data Records" data={correlationData.pairs} fill="#6366f1" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              Dataset does not contain two distinct numerical columns for bivariate correlation.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COMPARATIVE ANALYSIS */}
      {activeTab === 'comparative' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Side-by-Side Segment Comparison</h3>
              <p className="text-xs text-slate-400">Variance and ratio between top business categories</p>
            </div>
            <Badge variant="purple" size="sm">Variance Differential</Badge>
          </div>

          {comparativeData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Baseline Leader</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">{comparativeData.catA.category}</h4>
                <p className="text-2xl font-black text-slate-900 font-mono mt-2">
                  ${comparativeData.catA.total.toLocaleString()}
                </p>
                <span className="text-xs text-purple-700 font-semibold">{comparativeData.catA.sharePct}% total share</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Challenger Segment</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">{comparativeData.catB.category}</h4>
                <p className="text-2xl font-black text-slate-900 font-mono mt-2">
                  ${comparativeData.catB.total.toLocaleString()}
                </p>
                <span className="text-xs text-slate-500 font-semibold">
                  Variance: +${comparativeData.delta.toLocaleString()} ({comparativeData.deltaPct}% ahead)
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              At least two distinct categories are required for comparative variance.
            </div>
          )}
        </div>
      )}

      {/* Statement of Operations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Statement of Operations ({financialData.categoryColumnName} Breakdown)
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated distribution of {financialData.primaryMetricName} across active schema
            </p>
          </div>
          <Badge variant="purple" size="sm">
            {financialData.categoryBreakdown.length} Categories
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Line of Business / Category</th>
                <th className="py-3 px-4 text-right">Records</th>
                <th className="py-3 px-4 text-right">Mean Transaction</th>
                <th className="py-3 px-4 text-right">Aggregate Total</th>
                <th className="py-3 px-4 text-right">Share of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {financialData.categoryBreakdown.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                    {row.category}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {row.count.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    ${row.mean.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ${row.total.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                      {row.sharePct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900 font-mono">
                <td className="py-3 px-4 font-sans">Total Consolidated</td>
                <td className="py-3 px-4 text-right">{financialData.totalRecords.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">
                  ${(financialData.totalRecords > 0 ? (financialData.grossTotal / financialData.totalRecords).toFixed(0) : '0')}
                </td>
                <td className="py-3 px-4 text-right">${financialData.grossTotal.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">100.0%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
