import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Calendar, Clock, Plus, Database, UserCheck, Filter } from 'lucide-react';

export interface CalendarEventItem {
  id: string;
  title: string;
  dateStr: string;
  category: string;
  isUserCreated: boolean;
  sourceDataset?: string;
  metricHighlight?: string;
}

export const CalendarPage: React.FC = () => {
  const activeDataset = useAppStore(
    (state) => state.datasets.find((d) => d.id === state.activeDatasetId) || state.datasets[0]
  );

  // User-created events local store
  const [userEvents, setUserEvents] = useState<CalendarEventItem[]>([
    {
      id: 'usr-evt-1',
      title: 'Executive Stakeholder Quarterly Strategy Briefing',
      dateStr: '2026-12-15 10:00 AM',
      category: 'Executive Sync',
      isUserCreated: true,
    },
    {
      id: 'usr-evt-2',
      title: 'Automated Ingestion Pipeline Schema Review',
      dateStr: '2026-12-18 02:00 PM',
      category: 'Data Governance',
      isUserCreated: true,
    },
  ]);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-12-20');
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'dataset' | 'user'>('all');

  // Extract date-based records from active dataset
  const datasetEvents = useMemo<CalendarEventItem[]>(() => {
    if (!activeDataset || !activeDataset.data || activeDataset.data.length === 0) return [];

    const dateCol = activeDataset.columns.find((c) =>
      activeDataset.profiles[c]?.inferredType === 'date' || /date|time|timestamp|day/i.test(c)
    );
    if (!dateCol) return [];

    const titleCol = activeDataset.columns.find((c) =>
      /deal|name|customer|campaign|employee|title|id/i.test(c)
    ) || activeDataset.columns[0];

    const metricCol = activeDataset.columns.find((c) =>
      ['currency', 'numeric'].includes(activeDataset.profiles[c]?.inferredType)
    );

    return activeDataset.data.slice(0, 30).map((row, idx) => {
      const rawDate = String(row[dateCol] || '2026-12-01').trim();
      const title = String(row[titleCol] || `Dataset Record #${idx + 1}`);
      const metricVal = metricCol && row[metricCol] !== undefined
        ? `$${Number(row[metricCol]).toLocaleString()}`
        : undefined;

      return {
        id: `ds-evt-${idx + 1}`,
        title: `${title} (${dateCol}: ${rawDate})`,
        dateStr: rawDate,
        category: activeDataset.detectedDomain?.domainLabel || 'Dataset Record',
        isUserCreated: false,
        sourceDataset: activeDataset.name,
        metricHighlight: metricVal,
      };
    });
  }, [activeDataset]);

  const handleAddUserEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEvt: CalendarEventItem = {
      id: `usr-evt-${Date.now()}`,
      title: newEventTitle.trim(),
      dateStr: newEventDate,
      category: 'User Scheduled',
      isUserCreated: true,
    };

    setUserEvents((prev) => [newEvt, ...prev]);
    setNewEventTitle('');
    setIsAddingEvent(false);
  };

  const allEvents = useMemo(() => {
    const combined = [...userEvents, ...datasetEvents];
    if (filterType === 'user') return combined.filter((e) => e.isUserCreated);
    if (filterType === 'dataset') return combined.filter((e) => !e.isUserCreated);
    return combined;
  }, [userEvents, datasetEvents, filterType]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Calendar & Milestones</h1>
          <p className="text-xs text-slate-500 mt-1">
            Date-based dataset records and scheduled user operational milestones.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddingEvent(!isAddingEvent)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          {isAddingEvent ? 'Cancel' : 'Schedule Custom Event'}
        </Button>
      </div>

      {/* Add Custom Event Inline Modal / Form */}
      {isAddingEvent && (
        <form onSubmit={handleAddUserEvent} className="p-4 rounded-2xl bg-white border border-purple-200 shadow-sm flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Event Title</label>
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="e.g. Executive Quarterly Forecast Review"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Date</label>
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              required
            />
          </div>
          <Button type="submit" variant="primary" size="sm" className="w-full sm:w-auto">
            Save Event
          </Button>
        </form>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Milestones
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {allEvents.length}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 inline-block">Combined calendar entries</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Source Dataset Records
            </span>
            <p className="text-2xl font-black text-emerald-600 font-mono">
              {datasetEvents.length}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 inline-block">
              Derived from {activeDataset?.name || 'No Dataset'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              User-Created Events
            </span>
            <p className="text-2xl font-black text-indigo-600 font-mono">
              {userEvents.length}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 inline-block">Custom scheduled meetings</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Origin Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter Origin:
        </span>
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            filterType === 'all'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All ({userEvents.length + datasetEvents.length})
        </button>
        <button
          onClick={() => setFilterType('dataset')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            filterType === 'dataset'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Source Records Only ({datasetEvents.length})
        </button>
        <button
          onClick={() => setFilterType('user')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            filterType === 'user'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          User Events Only ({userEvents.length})
        </button>
      </div>

      {/* Events Timeline List */}
      <div className="flex flex-col gap-3">
        {allEvents.map((evt) => (
          <Card key={evt.id} hoverable>
            <CardContent className="p-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  evt.isUserCreated 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {evt.isUserCreated ? <UserCheck className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{evt.title}</h4>
                    {evt.metricHighlight && (
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {evt.metricHighlight}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evt.dateStr}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {evt.isUserCreated ? 'User-Created Schedule Entry' : `Extracted from "${evt.sourceDataset}"`}
                  </p>
                </div>
              </div>

              {/* Explicit Origin Badge */}
              <Badge
                variant={evt.isUserCreated ? 'purple' : 'success'}
                size="sm"
              >
                {evt.isUserCreated ? 'User Event' : 'Source Record'}
              </Badge>
            </CardContent>
          </Card>
        ))}

        {allEvents.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs italic bg-white rounded-2xl border border-slate-200">
            No events match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
