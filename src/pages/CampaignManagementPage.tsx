import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { extractCampaignData, DynamicCampaignItem } from '../core/analytics/moduleAdapters';
import { checkCampaignManagementAvailability } from '../core/analytics/moduleAvailability';
import { ModuleUnavailableState } from '../components/ui/ModuleUnavailableState';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { getFilteredDataset } from '../core/filters/filterEngine';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Plus } from 'lucide-react';

export interface CampaignManagementPageProps {
  onOpenImport?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const CampaignManagementPage: React.FC<CampaignManagementPageProps> = ({
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
    () => checkCampaignManagementAvailability(activeDataset || null),
    [activeDataset]
  );

  const campaignData = useMemo(() => {
    if (!availability.isAvailable) return null;
    return extractCampaignData(filteredDataset || activeDataset);
  }, [filteredDataset, activeDataset, availability.isAvailable]);

  if (!availability.isAvailable || !campaignData) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in pb-12">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Campaign Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Omnichannel acquisition performance, conversion telemetry, and marketing ROI.
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

  const columns = [
    {
      key: 'name',
      header: 'Campaign Name',
      render: (c: DynamicCampaignItem) => (
        <div>
          <p className="font-semibold text-slate-900">{c.name}</p>
          <span className="text-[11px] text-slate-400 font-medium">{c.channel}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: DynamicCampaignItem) => {
        const isAct = /active|live|running/i.test(c.status);
        const isComp = /complete|finished|done/i.test(c.status);
        return (
          <Badge variant={isAct ? 'success' : isComp ? 'purple' : 'neutral'} size="sm">
            {c.status}
          </Badge>
        );
      },
    },
    {
      key: 'spent',
      header: 'Spend / Budget',
      render: (c: DynamicCampaignItem) => (
        <div className="font-mono text-xs">
          <span className="font-bold text-slate-900">${c.spent.toLocaleString()}</span>
          <span className="text-slate-400 text-[11px]"> / ${c.budget.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'impressions',
      header: 'Impressions',
      render: (c: DynamicCampaignItem) => (
        <span className="font-mono text-slate-600 text-xs">{c.impressions.toLocaleString()}</span>
      ),
    },
    {
      key: 'clicks',
      header: 'Clicks (CTR)',
      render: (c: DynamicCampaignItem) => (
        <div className="font-mono text-xs">
          <span className="font-semibold text-slate-800">{c.clicks.toLocaleString()}</span>
          <span className="text-indigo-600 ml-1 text-[11px]">({c.ctr}%)</span>
        </div>
      ),
    },
    {
      key: 'conversions',
      header: 'Conversions',
      render: (c: DynamicCampaignItem) => (
        <span className="font-mono font-bold text-purple-700 text-xs">{c.conversions.toLocaleString()}</span>
      ),
    },
    {
      key: 'roas',
      header: 'ROAS / ROI',
      render: (c: DynamicCampaignItem) => (
        <span className="font-mono font-extrabold text-emerald-600 text-xs">{c.roas}x</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Campaign Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Omnichannel acquisition performance and conversion telemetry derived from "{activeDataset.name}".
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenImport && (
            <Button variant="outline" size="sm" onClick={onOpenImport}>
              Switch Dataset
            </Button>
          )}
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Launch Campaign
          </Button>
        </div>
      </div>

      {/* Global Dynamic Filter Bar */}
      {activeDataset && (
        <GlobalFilterBar />
      )}

      {/* Marketing KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Spend
          </span>
          <p className="text-xl font-black text-slate-900 font-mono">
            ${campaignData.totalSpend.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Paid media budget</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Impressions
          </span>
          <p className="text-xl font-black text-slate-900 font-mono">
            {campaignData.totalImpressions.toLocaleString()}
          </p>
          <span className="text-[10px] text-purple-600 mt-1 block font-semibold">Total audience reach</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Clicks
          </span>
          <p className="text-xl font-black text-slate-900 font-mono">
            {campaignData.totalClicks.toLocaleString()}
          </p>
          <span className="text-[10px] text-indigo-600 mt-1 block font-semibold">Total inbound traffic</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            CTR
          </span>
          <p className="text-xl font-black text-indigo-600 font-mono">
            {campaignData.overallCtr}%
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Click-through rate</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Conversions
          </span>
          <p className="text-xl font-black text-purple-700 font-mono">
            {campaignData.totalConversions.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">CVR: {campaignData.overallCvr}%</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Overall ROAS
          </span>
          <p className="text-xl font-black text-emerald-600 font-mono">
            {campaignData.overallRoas}x
          </p>
          <span className="text-[10px] text-emerald-600 mt-1 block font-semibold">Return on ad spend</span>
        </div>
      </div>

      {/* Channel Performance Chart */}
      {campaignData.channelPerformance.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Channel Acquisition Breakdown</h3>
              <p className="text-xs text-slate-400">Marketing spend vs conversion volume by acquisition channel</p>
            </div>
            <Badge variant="purple" size="sm">Channel Telemetry</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignData.channelPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="channel" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} 
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="spend" name="Spend ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" name="Conversions" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <DataTable data={campaignData.campaigns} columns={columns} searchKey="name" pageSize={5} />
    </div>
  );
};
