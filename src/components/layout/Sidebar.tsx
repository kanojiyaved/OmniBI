import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  BarChart3, 
  Layers, 
  FileSpreadsheet, 
  Sparkles, 
  Filter, 
  Activity, 
  Database,
  CheckCircle2,
  FolderGit2
} from 'lucide-react';
import { DataHealthMeter } from '../ui/DataHealthMeter';

export const Sidebar: React.FC = () => {
  const { 
    datasets, 
    activeDatasetId, 
    activeTab, 
    setActiveTab,
    filters,
    resetFilters 
  } = useAppStore();

  const activeDataset = datasets.find((d) => d.id === activeDatasetId);

  // Count active filters
  const activeFiltersCount = 
    (filters.dateRange.start ? 1 : 0) +
    Object.keys(filters.categoricalFilters).reduce((acc, k) => acc + (filters.categoricalFilters[k]?.length || 0), 0) +
    Object.keys(filters.numericRanges).length +
    (filters.activeCrossFilter ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-900/40 flex flex-col justify-between shrink-0 hidden lg:flex select-none">
      <div className="p-4 flex flex-col gap-6">
        {/* Dataset Summary Pill */}
        {activeDataset ? (
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-brand-400" />
                Active Dataset
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-medium">
                Live
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-white truncate">{activeDataset.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeDataset.rowCount.toLocaleString()} rows • {activeDataset.columnCount} columns
              </p>
            </div>
            <DataHealthMeter score={activeDataset.quality.overallScore} size="sm" showLabel={false} />
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center">
            <FolderGit2 className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-400">No Dataset Loaded</p>
            <p className="text-[11px] text-slate-500 mt-1">Upload a CSV or Excel file to activate telemetry.</p>
          </div>
        )}

        {/* Navigation Section */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1">
            Workspaces
          </span>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Executive Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('profiler')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'profiler'
                ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Data Health & Profiler</span>
          </button>

          <button
            onClick={() => setActiveTab('datatable')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'datatable'
                ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Data Vault & Types</span>
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'insights'
                ? 'bg-purple-600/15 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Automated Insights</span>
          </button>
        </div>

        {/* Global Filter Telemetry */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Active Filters
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-brand-400 hover:underline font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span>Filter Status:</span>
              <span className="font-semibold text-slate-200">
                {activeFiltersCount === 0 ? 'No Filters Active' : `${activeFiltersCount} Active Filter(s)`}
              </span>
            </div>
            {filters.activeCrossFilter && (
              <div className="p-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] flex items-center gap-1.5">
                <Activity className="w-3 h-3 shrink-0" />
                <span className="truncate">Cross-brush: {filters.activeCrossFilter.column}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30 text-xs text-slate-500 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Client Analytics Engine</span>
          </span>
          <span className="font-mono text-[10px] text-slate-400">100% Offline</span>
        </div>
      </div>
    </aside>
  );
};
