import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { buildDynamicKPIRegistry } from '../../core/metrics/kpiRegistry';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Calculator, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Search,
  Filter
} from 'lucide-react';

interface DynamicKPIRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DynamicKPIRegistryModal: React.FC<DynamicKPIRegistryModalProps> = ({ isOpen, onClose }) => {
  const { datasets, activeDatasetId } = useAppStore();
  const activeDataset = datasets.find((d) => d.id === activeDatasetId);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'unavailable'>('all');
  const [search, setSearch] = useState('');

  if (!activeDataset) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Dynamic KPI Registry">
        <div className="p-8 text-center text-slate-400">
          <Calculator className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p>No active dataset available. Ingest a dataset to inspect calculated KPIs.</p>
        </div>
      </Modal>
    );
  }

  const registry = buildDynamicKPIRegistry(activeDataset);
  const filteredMetrics = registry.metrics.filter((m) => {
    if (filterStatus === 'available' && m.availabilityStatus !== 'available') return false;
    if (filterStatus === 'unavailable' && m.availabilityStatus === 'available') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.metricName.toLowerCase().includes(q) ||
        m.formula.toLowerCase().includes(q) ||
        m.metricId.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dynamic KPI & Metric Calculation Registry" maxWidth="4xl">
      <div className="flex flex-col gap-4 text-xs">
        {/* Registry Summary Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              Dynamic Schema Metric Audit
            </h4>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Active Dataset: <strong className="text-white">{activeDataset.name}</strong> • Domain: <span className="uppercase text-indigo-300 font-semibold">{registry.domain}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              {registry.availableMetricsCount} Available
            </Badge>
            <Badge variant="neutral" size="sm">
              {registry.totalMetricsCount - registry.availableMetricsCount} Unavailable
            </Badge>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search metrics by name, formula, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({registry.metrics.length})
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterStatus === 'available' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Available ({registry.availableMetricsCount})
            </button>
            <button
              onClick={() => setFilterStatus('unavailable')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterStatus === 'unavailable' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unavailable
            </button>
          </div>
        </div>

        {/* Metric Registry Table */}
        <div className="max-h-[480px] overflow-y-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300 font-semibold sticky top-0 backdrop-blur-sm">
                <th className="py-2.5 px-4">Metric & Formula</th>
                <th className="py-2.5 px-4">Required Columns</th>
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4">Calculated Value</th>
                <th className="py-2.5 px-4">Provenance & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredMetrics.map((m) => {
                const isAvail = m.availabilityStatus === 'available';

                return (
                  <tr key={m.metricId} className={`hover:bg-slate-900/40 transition-colors ${!isAvail ? 'opacity-70 bg-slate-950/30' : ''}`}>
                    {/* Metric Name & Formula */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-white font-medium">{m.metricName}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">({m.metricId})</span>
                        </div>
                        <code className="text-[10px] text-indigo-300 font-mono">{m.formula}</code>
                      </div>
                    </td>

                    {/* Required Columns */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {m.requiredColumns.length > 0 ? (
                          m.requiredColumns.map((col) => {
                            const matched = m.matchedColumns[col];
                            return (
                              <span
                                key={col}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                  matched 
                                    ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300' 
                                    : 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
                                }`}
                                title={matched ? `Mapped to column "${matched}"` : `Required field "${col}" not found`}
                              >
                                {matched ? `${col} ➔ ${matched}` : col}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-slate-500">Universal</span>
                        )}
                      </div>
                    </td>

                    {/* Aggregation Method */}
                    <td className="py-3 px-4">
                      <Badge variant="purple" size="sm">
                        {m.aggregationMethod}
                      </Badge>
                    </td>

                    {/* Calculated Value */}
                    <td className="py-3 px-4">
                      {isAvail ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm font-mono">{m.formattedValue}</span>
                          {m.comparisonPeriod && (
                            <span className={`text-[10px] ${m.comparisonPeriod.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {m.comparisonPeriod.changePercentage > 0 ? '+' : ''}{m.comparisonPeriod.changePercentage}% MoM
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">N/A</span>
                      )}
                    </td>

                    {/* Provenance & Status */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          {isAvail ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Available
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                              <XCircle className="w-3.5 h-3.5" />
                              Unavailable
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 leading-snug">
                          {isAvail ? m.dataProvenance : m.unavailabilityReason}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Metrics are computed deterministically from uploaded records without AI hallucination.</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
