import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { extractPipelineData, DynamicDeal } from '../core/analytics/moduleAdapters';
import { checkDealManagementAvailability } from '../core/analytics/moduleAvailability';
import { ModuleUnavailableState } from '../components/ui/ModuleUnavailableState';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { getFilteredDataset } from '../core/filters/filterEngine';
import { Plus, DollarSign, Trophy, TrendingUp, Filter } from 'lucide-react';

export interface DealManagementPageProps {
  onOpenImport?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const DealManagementPage: React.FC<DealManagementPageProps> = ({
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
    () => checkDealManagementAvailability(activeDataset || null),
    [activeDataset]
  );

  const pipelineData = useMemo(() => {
    if (!availability.isAvailable) return null;
    return extractPipelineData(filteredDataset || activeDataset);
  }, [filteredDataset, activeDataset, availability.isAvailable]);

  const [selectedStage, setSelectedStage] = useState<string>('all');

  // If module is unavailable based on actual dataset fields, display strict unavailable state
  if (!availability.isAvailable || !pipelineData) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in pb-12">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Deal Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track enterprise commercial engagements and forecast conversion velocity.
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

  const filteredDeals = selectedStage === 'all'
    ? pipelineData.deals
    : pipelineData.deals.filter((d) => d.stage === selectedStage);

  const columns = [
    {
      key: 'title',
      header: 'Deal Title',
      render: (d: DynamicDeal) => (
        <div>
          <p className="font-semibold text-slate-900">{d.title}</p>
          <p className="text-[11px] text-slate-400">{d.company}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Pipeline Stage',
      render: (d: DynamicDeal) => {
        const isWon = /won|closed|completed|success/i.test(d.stage);
        const isProposal = /proposal|pitch|demo/i.test(d.stage);
        const isNeg = /negotiat|review/i.test(d.stage);
        const variant = isWon ? 'success' : isNeg ? 'purple' : isProposal ? 'brand' : 'warning';
        return <Badge variant={variant} size="sm">{d.stage}</Badge>;
      },
    },
    {
      key: 'amount',
      header: 'Deal Value',
      render: (d: DynamicDeal) => (
        <span className="font-bold text-slate-900 font-mono">
          ${d.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'owner',
      header: 'Deal Lead',
      render: (d: DynamicDeal) => <span className="text-slate-700 text-xs">{d.owner}</span>,
    },
    {
      key: 'probability',
      header: 'Win Likelihood',
      render: (d: DynamicDeal) => (
        <span className="font-mono font-semibold text-slate-800 text-xs">{d.probability}%</span>
      ),
    },
    {
      key: 'closeDate',
      header: 'Target Close',
      render: (d: DynamicDeal) => <span className="text-slate-500 font-mono text-xs">{d.closeDate}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Deal Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time commercial analytics derived from "{activeDataset.name}".
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenImport && (
            <Button variant="outline" size="sm" onClick={onOpenImport}>
              Switch Dataset
            </Button>
          )}
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Deal
          </Button>
        </div>
      </div>

      {/* Global Dynamic Filter Bar */}
      {activeDataset && (
        <GlobalFilterBar />
      )}

      {/* Pipeline Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pipeline Value
            </span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ${pipelineData.totalPipeline.toLocaleString()}
          </p>
          <span className="text-xs text-purple-600 font-semibold mt-1 inline-block">
            {pipelineData.deals.length} Active Opportunities
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Closed / Won Value
            </span>
            <Trophy className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ${pipelineData.wonValue.toLocaleString()}
          </p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
            {pipelineData.wonDeals} Deals Closed
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Win Rate
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {pipelineData.winRate}%
          </p>
          <span className="text-xs text-slate-400 mt-1 inline-block">
            Conversion efficacy
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Average Deal Size
            </span>
            <Filter className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ${pipelineData.avgDealSize.toLocaleString()}
          </p>
          <span className="text-xs text-slate-400 mt-1 inline-block">
            Per active opportunity
          </span>
        </div>
      </div>

      {/* Stage Filter Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold mr-1">Filter Stage:</span>
        <button
          onClick={() => setSelectedStage('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            selectedStage === 'all' 
              ? 'bg-purple-600 text-white shadow-xs' 
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Stages ({pipelineData.deals.length})
        </button>
        {pipelineData.stages.map((stage) => {
          const count = pipelineData.dealsByStage[stage]?.length || 0;
          return (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                selectedStage === stage 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {stage} ({count})
            </button>
          );
        })}
      </div>

      {/* Deal Table */}
      <DataTable data={filteredDeals} columns={columns} searchKey="title" pageSize={10} />
    </div>
  );
};
