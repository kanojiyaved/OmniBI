import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { BarChart3, TrendingUp, Layers, Zap } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { datasets, activeDatasetId, kpis } = useAppStore();
  const activeDataset = datasets.find((d) => d.id === activeDatasetId);

  if (!activeDataset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <BarChart3 className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-200">No Dataset Active</h3>
        <p className="text-xs text-slate-500 mt-1">Upload a dataset to generate executive KPI summaries.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Dashboard</h2>
          <p className="text-xs text-slate-400">
            Real-time dynamic telemetry synthesized for {activeDataset.name}
          </p>
        </div>
        <Badge variant="brand" hasDot>
          {activeDataset.detectedDomain.domainLabel}
        </Badge>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.length > 0 ? (
          kpis.map((kpi) => (
            <Card key={kpi.id} glass hoverable>
              <CardHeader className="py-3">
                <span className="text-xs font-semibold text-slate-400">{kpi.label}</span>
                <Badge variant={kpi.trend === 'up' ? 'success' : 'neutral'} size="sm">
                  {kpi.trend === 'up' ? '↑' : '↓'}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-black text-white font-mono">{kpi.value}</div>
                <p className="text-[11px] text-slate-500 mt-1">{kpi.description}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card glass hoverable>
              <CardHeader className="py-3">
                <span className="text-xs font-semibold text-slate-400">Total Observations</span>
                <Layers className="w-4 h-4 text-brand-400" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-black text-white font-mono">
                  {activeDataset.rowCount.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Processed Tabular Records</p>
              </CardContent>
            </Card>

            <Card glass hoverable>
              <CardHeader className="py-3">
                <span className="text-xs font-semibold text-slate-400">Attribute Dimensions</span>
                <Zap className="w-4 h-4 text-purple-400" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-black text-white font-mono">
                  {activeDataset.columnCount}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Validated Schema Columns</p>
              </CardContent>
            </Card>

            <Card glass hoverable>
              <CardHeader className="py-3">
                <span className="text-xs font-semibold text-slate-400">Data Integrity</span>
                <Badge variant="success" size="sm">Passed</Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {activeDataset.quality.overallScore}%
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Quality Health Score</p>
              </CardContent>
            </Card>

            <Card glass hoverable>
              <CardHeader className="py-3">
                <span className="text-xs font-semibold text-slate-400">Analytics Domain</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-bold text-amber-300 truncate">
                  {activeDataset.detectedDomain.domainLabel}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Inferred Semantic Role</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
