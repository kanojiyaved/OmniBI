import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { InteractiveSemanticMapping } from '../components/semantic/InteractiveSemanticMapping';
import { ExportModal } from '../components/export/ExportModal';
import { exportToCSV, downloadBlob, sanitizeFilename } from '../core/export/exportEngine';
import { 
  ResponsiveContainer, 
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
  Download, 
  TableProperties, 
  Sparkles, 
  Database, 
  BarChart2, 
  Share2, 
  SlidersHorizontal 
} from 'lucide-react';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { getFilteredDataset } from '../core/filters/filterEngine';
import { formatFileSize } from '../utils/formatters';

type ExplorerViewMode = 'grid' | 'columns' | 'distributions' | 'relationships' | 'semantic';

export const DataExplorerPage: React.FC = () => {
  const { datasets, activeDatasetId, filters } = useAppStore();
  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];

  const filteredDataset = useMemo(() => {
    if (!activeDataset) return null;
    return getFilteredDataset(activeDataset, filters);
  }, [activeDataset, filters]);

  const [activeTab, setActiveTab] = useState<ExplorerViewMode>('grid');

  // Selected column for distribution inspection
  const [selectedDistCol, setSelectedDistCol] = useState<string>('');

  // Selected columns for relationship / scatter inspection
  const [relColX, setRelColX] = useState<string>('');
  const [relColY, setRelColY] = useState<string>('');

  // Auto-select initial columns
  React.useEffect(() => {
    if (activeDataset && activeDataset.columns.length > 0) {
      if (!selectedDistCol) setSelectedDistCol(activeDataset.columns[0]);
      const numCols = activeDataset.columns.filter((c) =>
        ['numeric', 'currency', 'percentage'].includes(activeDataset.profiles[c]?.inferredType)
      );
      if (numCols.length >= 2) {
        if (!relColX) setRelColX(numCols[0]);
        if (!relColY) setRelColY(numCols[1]);
      } else if (activeDataset.columns.length >= 2) {
        if (!relColX) setRelColX(activeDataset.columns[0]);
        if (!relColY) setRelColY(activeDataset.columns[1]);
      }
    }
  }, [activeDataset]);

  if (!activeDataset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
        <TableProperties className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Dataset Active</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Please upload or mount a dataset from the Data Import section to explore its columns and rows.
        </p>
      </div>
    );
  }

  const columns = activeDataset.columns.map((col) => ({
    key: col,
    header: col,
    sortable: true,
  }));

  // Distribution data for selected column
  const distributionData = useMemo(() => {
    const dataRows = (filteredDataset || activeDataset).data;
    if (!selectedDistCol || !dataRows) return [];
    const counts: Record<string, number> = {};
    dataRows.slice(0, 500).forEach((row) => {
      const val = String(row[selectedDistCol] || 'null');
      counts[val] = (counts[val] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [selectedDistCol, filteredDataset, activeDataset]);

  // Relationship scatter data & Pearson r
  const relationshipData = useMemo(() => {
    const dataRows = (filteredDataset || activeDataset).data;
    if (!relColX || !relColY || !dataRows) return null;

    const parseNum = (v: any) => Number(String(v || '0').replace(/[$€£¥,%\s]/g, '')) || 0;

    const pairs = dataRows.slice(0, 200).map((r) => ({
      x: parseNum(r[relColX]),
      y: parseNum(r[relColY]),
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

    return { pairs, r };
  }, [relColX, relColY, filteredDataset, activeDataset]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExportCSV = () => {
    const targetData = (filteredDataset || activeDataset).data;
    if (!targetData.length) return;
    const blob = exportToCSV(targetData, activeDataset.columns, { preventFormulaInjection: true });
    downloadBlob(blob, sanitizeFilename(activeDataset.name, 'csv'));
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Data Explorer</h1>
          <p className="text-xs text-slate-500 mt-1">
            {activeDataset.name} • {formatFileSize(activeDataset.fileSize)} • {activeDataset.rowCount.toLocaleString()} rows • {activeDataset.columnCount} columns
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-view switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Table View
            </button>
            <button
              onClick={() => setActiveTab('columns')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'columns' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Columns Inspection
            </button>
            <button
              onClick={() => setActiveTab('distributions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'distributions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Distributions
            </button>
            <button
              onClick={() => setActiveTab('relationships')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'relationships' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              Relationships
            </button>
            <button
              onClick={() => setActiveTab('semantic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'semantic' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              AI Semantic Mapping
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Center
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

      {/* VIEW 1: DATA TABLE */}
      {activeTab === 'grid' && (
        <DataTable
          data={(filteredDataset || activeDataset).data}
          columns={columns}
          pageSize={10}
          emptyMessage="No rows found in this dataset."
        />
      )}

      {/* VIEW 2: COLUMN STATISTICAL INSPECTION */}
      {activeTab === 'columns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeDataset.columns.map((col) => {
            const prof = activeDataset.profiles[col];
            return (
              <div
                key={col}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 font-mono">{col}</span>
                    <Badge variant="purple" size="sm">{prof?.inferredType || 'text'}</Badge>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Role:</span>
                      <strong>{prof?.semanticRole || 'dimension'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Distinct Values:</span>
                      <span>{prof?.distinctCount?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Missing Values:</span>
                      <span>{prof?.nullCount || 0}</span>
                    </div>
                    {prof?.mean !== undefined && (
                      <div className="flex justify-between text-indigo-600">
                        <span className="text-slate-400 font-sans">Mean:</span>
                        <span>{prof.mean.toLocaleString()}</span>
                      </div>
                    )}
                    {prof?.min !== undefined && prof?.max !== undefined && (
                      <div className="flex justify-between text-slate-500">
                        <span className="text-slate-400 font-sans">Range:</span>
                        <span>{prof.min} → {prof.max}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: DISTRIBUTIONS */}
      {activeTab === 'distributions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Value Frequency Distribution</h3>
              <p className="text-xs text-slate-400">Inspecting occurrences across "{selectedDistCol}"</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Select Field:</span>
              <select
                value={selectedDistCol}
                onChange={(e) => setSelectedDistCol(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 font-mono bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {activeDataset.columns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Frequency Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 4: RELATIONSHIPS & BIVARIATE CORRELATION */}
      {activeTab === 'relationships' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Bivariate Relationship & Scatter Dispersion</h3>
              <p className="text-xs text-slate-400">
                {relationshipData
                  ? `Pearson Correlation r = ${relationshipData.r} between "${relColX}" and "${relColY}"`
                  : 'Select two numerical fields to evaluate correlation.'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <select
                value={relColX}
                onChange={(e) => setRelColX(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 font-mono bg-white"
              >
                {activeDataset.columns.map((c) => (
                  <option key={c} value={c}>X: {c}</option>
                ))}
              </select>
              <span className="text-slate-400 font-bold">vs</span>
              <select
                value={relColY}
                onChange={(e) => setRelColY(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 font-mono bg-white"
              >
                {activeDataset.columns.map((c) => (
                  <option key={c} value={c}>Y: {c}</option>
                ))}
              </select>
              {relationshipData && (
                <Badge variant={Math.abs(relationshipData.r) > 0.5 ? 'success' : 'neutral'} size="sm">
                  r = {relationshipData.r}
                </Badge>
              )}
            </div>
          </div>

          {relationshipData && (
            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="x" name={relColX} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis type="number" dataKey="y" name={relColY} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Data Records" data={relationshipData.pairs} fill="#8b5cf6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: AI SEMANTIC MAPPING */}
      {activeTab === 'semantic' && (
        <InteractiveSemanticMapping />
      )}
    </div>
  );
};
