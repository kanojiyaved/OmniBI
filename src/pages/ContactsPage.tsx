import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { extractContactsData, DynamicContact } from '../core/analytics/moduleAdapters';
import { checkContactsAvailability } from '../core/analytics/moduleAvailability';
import { ModuleUnavailableState } from '../components/ui/ModuleUnavailableState';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { getFilteredDataset } from '../core/filters/filterEngine';
import { Plus, Users, DollarSign } from 'lucide-react';

export interface ContactsPageProps {
  onOpenImport?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ContactsPage: React.FC<ContactsPageProps> = ({
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
    () => checkContactsAvailability(activeDataset || null),
    [activeDataset]
  );

  const contactsData = useMemo(() => {
    if (!availability.isAvailable) return null;
    return extractContactsData(filteredDataset || activeDataset);
  }, [filteredDataset, activeDataset, availability.isAvailable]);

  if (!availability.isAvailable || !contactsData) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in pb-12">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Key Stakeholders & Contacts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Account executives, champions, customers, and organizational directory.
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
      header: 'Contact / Entity Name',
      render: (c: DynamicContact) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
            {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'EN'}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{c.name}</p>
            <p className="text-[11px] text-slate-400">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role / Designation',
      render: (c: DynamicContact) => (
        <div>
          <p className="font-medium text-slate-800 text-xs">{c.role}</p>
          <p className="text-[11px] text-slate-400">{c.company}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status / Tier',
      render: (c: DynamicContact) => {
        const isCust = /customer|active|client|paid|senior/i.test(c.status);
        const isLead = /lead|trial|prospect|junior/i.test(c.status);
        return (
          <Badge variant={isCust ? 'success' : isLead ? 'purple' : 'neutral'} size="sm">
            {c.status}
          </Badge>
        );
      },
    },
    {
      key: 'valueContribution',
      header: 'Value Contribution',
      render: (c: DynamicContact) => (
        <span className="text-slate-900 font-mono font-bold text-xs">
          ${c.valueContribution.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'lastActivity',
      header: 'Last Touchpoint',
      render: (c: DynamicContact) => <span className="text-slate-400 font-mono text-xs">{c.lastActivity}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Key Stakeholders & Contacts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Stakeholder and customer relationships derived from "{activeDataset.name}".
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenImport && (
            <Button variant="outline" size="sm" onClick={onOpenImport}>
              Switch Dataset
            </Button>
          )}
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Contact
          </Button>
        </div>
      </div>

      {/* Global Dynamic Filter Bar */}
      {activeDataset && (
        <GlobalFilterBar />
      )}

      {/* Stakeholder Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Total Tracked Stakeholders
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {contactsData.totalContacts.toLocaleString()}
            </p>
            <span className="text-xs text-purple-600 font-semibold mt-1 inline-block">
              Active directory entities
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Cumulative Commercial Value
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              ${contactsData.totalValue.toLocaleString()}
            </p>
            <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
              Tracked financial attribution
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <DataTable data={contactsData.contacts} columns={columns} searchKey="name" pageSize={10} />
    </div>
  );
};
