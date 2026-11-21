import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { extractPipelineData } from '../core/analytics/moduleAdapters';
import { checkPipelineAvailability } from '../core/analytics/moduleAvailability';
import { ModuleUnavailableState } from '../components/ui/ModuleUnavailableState';
import { Button } from '../components/ui/Button';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { getFilteredDataset } from '../core/filters/filterEngine';
import { Plus } from 'lucide-react';

export interface SalesPipelinePageProps {
  onOpenImport?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const SalesPipelinePage: React.FC<SalesPipelinePageProps> = ({
  onOpenImport,
  onNavigateTab,
}) => {
  const { datasets, activeDatasetId, filters, setCrossFilter } = useAppStore();
  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];

  const filteredDataset = useMemo(() => {
    if (!activeDataset) return null;
    return getFilteredDataset(activeDataset, filters);
  }, [activeDataset, filters]);

  const availability = useMemo(
    () => checkPipelineAvailability(activeDataset || null),
    [activeDataset]
  );

  const pipelineData = useMemo(() => {
    if (!availability.isAvailable) return null;
    return extractPipelineData(filteredDataset || activeDataset);
  }, [filteredDataset, activeDataset, availability.isAvailable]);

  if (!availability.isAvailable || !pipelineData) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in pb-12">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Pipeline</h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual stage progression, deal velocity, and conversion probability.
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

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Pipeline</h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual stage progression and deal velocity derived from "{activeDataset.name}".
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenImport && (
            <Button variant="outline" size="sm" onClick={onOpenImport}>
              Switch Dataset
            </Button>
          )}
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Opportunity
          </Button>
        </div>
      </div>

      {/* Global Dynamic Filter Bar */}
      {activeDataset && (
        <GlobalFilterBar />
      )}

      {/* Dynamic Kanban Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {pipelineData.stages.map((stage) => {
          const stageDeals = pipelineData.dealsByStage[stage] || [];
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.amount, 0);

          return (
            <div
              key={stage}
              className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 flex flex-col gap-3 min-h-[420px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setCrossFilter('stage', stage)}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity text-left"
                  title={`Click to filter by stage: ${stage}`}
                >
                  <span className="font-bold text-xs text-slate-800">{stage}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                    {stageDeals.length}
                  </span>
                </button>
                <span className="font-mono text-xs font-bold text-slate-600">
                  ${(stageTotal / 1000).toFixed(0)}k
                </span>
              </div>

              {/* Deal Cards */}
              <div className="flex flex-col gap-2.5">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-2"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-snug">{deal.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{deal.company}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-mono font-bold text-xs text-purple-700">
                        ${deal.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {deal.probability}% Prob.
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{deal.owner}</span>
                      <span>{deal.closeDate}</span>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-xs italic">
                    No active deals in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
