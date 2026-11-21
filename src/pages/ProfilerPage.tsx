import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { DataHealthMeter } from '../components/ui/DataHealthMeter';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  TableProperties, 
  Sparkles, 
  RotateCcw, 
  Trash2, 
  Wand2, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart2, 
  Layers, 
  ArrowRight,
  History,
  FileCheck2,
  Type,
  Briefcase,
  Tag
} from 'lucide-react';
import { BusinessDomain, SemanticRole } from '../types';
import { DOMAIN_ONTOLOGIES } from '../core/semantic/domainOntology';
import { 
  dropDuplicateRows, 
  imputeMissingValues, 
  standardizeCategories, 
  convertColumnType,
  ImputeStrategy 
} from '../core/cleaner/dataCleaner';

export const ProfilerPage: React.FC = () => {
  const { 
    datasets, 
    activeDatasetId, 
    applyCleaningAction, 
    undoCleaningAction, 
    resetDatasetToRaw,
    overrideColumnRole,
    overrideBusinessDomain
  } = useAppStore();

  const activeDataset = datasets.find((d) => d.id === activeDatasetId);

  // Selected column for deep dive inspection
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // Modals for cleaning actions
  const [isImputeModalOpen, setIsImputeModalOpen] = useState(false);
  const [imputeCol, setImputeCol] = useState<string>('');
  const [imputeStrategy, setImputeStrategy] = useState<ImputeStrategy>('mean');
  const [imputeConstant, setImputeConstant] = useState<string>('');

  const [isStandardizeModalOpen, setIsStandardizeModalOpen] = useState(false);
  const [standardizeCol, setStandardizeCol] = useState<string>('');
  const [standardizeMode, setStandardizeMode] = useState<'title' | 'lower' | 'upper'>('title');

  const [isCastModalOpen, setIsCastModalOpen] = useState(false);
  const [castCol, setCastCol] = useState<string>('');
  const [castType, setCastType] = useState<'numeric' | 'date' | 'string' | 'boolean'>('numeric');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  if (!activeDataset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
        <TableProperties className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-200">No Dataset Active</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md">
          Please upload or select an enterprise dataset in the Data Import tab to inspect automated statistical profiling and data quality diagnostics.
        </p>
      </div>
    );
  }

  const columns = activeDataset.columns;
  const currentSelectedCol = selectedColumn && columns.includes(selectedColumn) 
    ? selectedColumn 
    : columns[0] || null;

  const currentProfile = currentSelectedCol ? activeDataset.profiles[currentSelectedCol] : null;
  const quality = activeDataset.quality;
  const history = activeDataset.cleaningHistory || [];

  // Handlers
  const handleDropDuplicates = () => {
    const result = dropDuplicateRows(activeDataset.data);
    applyCleaningAction(
      activeDataset.id,
      {
        action: 'drop_duplicates',
        summary: result.summary,
        affectedRows: result.affectedRows,
      },
      result.cleanedData
    );
    showNotification(result.summary);
  };

  const handleApplyImpute = () => {
    if (!imputeCol) return;
    const result = imputeMissingValues(activeDataset.data, imputeCol, imputeStrategy, imputeConstant);
    applyCleaningAction(
      activeDataset.id,
      {
        action: 'impute_missing',
        columnName: imputeCol,
        summary: result.summary,
        affectedRows: result.affectedRows,
      },
      result.cleanedData
    );
    setIsImputeModalOpen(false);
    showNotification(result.summary);
  };

  const handleApplyStandardize = () => {
    if (!standardizeCol) return;
    const result = standardizeCategories(activeDataset.data, standardizeCol, standardizeMode);
    applyCleaningAction(
      activeDataset.id,
      {
        action: 'standardize_categories',
        columnName: standardizeCol,
        summary: result.summary,
        affectedRows: result.affectedRows,
      },
      result.cleanedData
    );
    setIsStandardizeModalOpen(false);
    showNotification(result.summary);
  };

  const handleApplyCast = () => {
    if (!castCol) return;
    const result = convertColumnType(activeDataset.data, castCol, castType);
    applyCleaningAction(
      activeDataset.id,
      {
        action: 'convert_type',
        columnName: castCol,
        summary: result.summary,
        affectedRows: result.affectedRows,
      },
      result.cleanedData
    );
    setIsCastModalOpen(false);
    showNotification(result.summary);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      undoCleaningAction(activeDataset.id);
      showNotification('Undid previous cleaning operation.', 'info');
    }
  };

  const handleResetToRaw = () => {
    resetDatasetToRaw(activeDataset.id);
    showNotification('Dataset restored to original raw state.', 'info');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Top Header & Health Score */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Data Profiling & Quality Engine</h2>
            <Badge variant="purple" size="sm">Automated Diagnostics</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Active Dataset: <span className="font-semibold text-slate-200">{activeDataset.name}</span> ({activeDataset.rowCount.toLocaleString()} rows, {activeDataset.columnCount} columns)
          </p>
        </div>

        <div className="min-w-[260px] p-3 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <DataHealthMeter score={quality.overallScore} size="md" />
        </div>
      </div>

      {/* AI Business Domain Detection & Ontology Banner */}
      <Card glass className="border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-purple-950/30">
        <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detected Domain:</span>
                <span className="text-sm font-bold text-white">
                  {DOMAIN_ONTOLOGIES[activeDataset.detectedDomain?.domain || 'general']?.label || activeDataset.detectedDomain?.domain}
                </span>
                <Badge variant="purple" size="sm">
                  {Math.round((activeDataset.detectedDomain?.confidence || 0.8) * 100)}% Confidence
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {activeDataset.detectedDomain?.reasoning?.[0] || 'Domain ontology matching enterprise tabular structure.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <span className="text-xs text-slate-400">Override Domain:</span>
            <select
              value={activeDataset.detectedDomain?.domain || 'general'}
              onChange={(e) => {
                overrideBusinessDomain(activeDataset.id, e.target.value as BusinessDomain);
                showNotification(`Reclassified dataset ontology to ${e.target.value.toUpperCase()}.`);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="saas">B2B SaaS & Subscriptions</option>
              <option value="ecommerce">E-Commerce & Retail</option>
              <option value="financial">Corporate Finance & Banking</option>
              <option value="healthcare">Healthcare & Clinical</option>
              <option value="supply_chain">Supply Chain & Logistics</option>
              <option value="marketing">Marketing & Digital Ads</option>
              <option value="hr">Human Resources & Workforce</option>
              <option value="general">General Enterprise Tabular</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60' 
            : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Key Diagnostic Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Rows</span>
          <span className="text-lg font-bold text-white font-mono mt-1">{activeDataset.rowCount.toLocaleString()}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Columns</span>
          <span className="text-lg font-bold text-white font-mono mt-1">{activeDataset.columnCount}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Duplicate Rows</span>
          <span className={`text-lg font-bold font-mono mt-1 ${quality.duplicateRowsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {quality.duplicateRowsCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Missing Cells</span>
          <span className={`text-lg font-bold font-mono mt-1 ${quality.missingCellsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {quality.missingCellsCount} ({quality.missingDataPercentage}%)
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Detected Outliers</span>
          <span className="text-lg font-bold text-indigo-400 font-mono mt-1">
            {Object.values(activeDataset.profiles).reduce((acc, p) => acc + (p.outlierCount || 0), 0)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Anomalies</span>
          <span className={`text-lg font-bold font-mono mt-1 ${quality.anomaliesDetected.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {quality.anomaliesDetected.length}
          </span>
        </div>
      </div>

      {/* Interactive Data Cleaning Toolbar */}
      <Card glass className="border border-indigo-500/20 bg-indigo-950/10">
        <div className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-white">Data Quality Cleaning Tools:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDropDuplicates}
              disabled={quality.duplicateRowsCount === 0}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Drop Duplicates ({quality.duplicateRowsCount})
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setImputeCol(columns[0] || '');
                setIsImputeModalOpen(true);
              }}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              Impute Missing Values
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setStandardizeCol(columns[0] || '');
                setIsStandardizeModalOpen(true);
              }}
            >
              <Layers className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Standardize Categories
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setCastCol(columns[0] || '');
                setIsCastModalOpen(true);
              }}
            >
              <Type className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Cast Data Type
            </Button>

            <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={history.length === 0}
              title="Undo last cleaning step"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Undo ({history.length})
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToRaw}
              disabled={history.length === 0}
              className="text-rose-400 hover:text-rose-300"
            >
              Reset to Raw
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Analysis Grid: Column List & Deep Column Profile Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Column Profiling Explorer */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card glass>
            <CardHeader className="py-3.5 px-4 border-b border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Column Profiles</CardTitle>
                <p className="text-[11px] text-slate-400">Select any column for deep statistical distribution</p>
              </div>
              <Badge variant="neutral" size="sm">{columns.length} Total</Badge>
            </CardHeader>
            <CardContent className="p-0 max-h-[520px] overflow-y-auto divide-y divide-slate-800/60">
              {columns.map((col) => {
                const prof = activeDataset.profiles[col];
                const isSelected = col === currentSelectedCol;
                const isNumeric = prof && ['numeric', 'currency', 'percentage'].includes(prof.inferredType);

                return (
                  <div
                    key={col}
                    onClick={() => setSelectedColumn(col)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-indigo-600/10 border-l-2 border-indigo-500' 
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex flex-col gap-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                          {col}
                        </span>
                        {prof?.inferredType && (
                          <Badge 
                            variant={
                              isNumeric 
                                ? 'purple' 
                                : prof.inferredType === 'date' 
                                ? 'brand' 
                                : 'neutral'
                            } 
                            size="sm"
                          >
                            {prof.inferredType}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Distinct: <strong className="text-slate-300">{prof?.distinctCount ?? 0}</strong></span>
                        <span>•</span>
                        <span className={prof?.nullCount ? 'text-amber-400' : 'text-slate-400'}>
                          Nulls: {prof?.nullCount ?? 0} ({prof ? (prof.nullRatio * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>

                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'text-indigo-400 translate-x-0.5' : 'text-slate-600'}`} />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Cleaning Audit Trail */}
          <Card glass>
            <CardHeader className="py-3 px-4 border-b border-slate-800 flex flex-row items-center justify-between">
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <CardTitle className="text-xs">Cleaning Audit Trail</CardTitle>
              </div>
              <Badge variant="neutral" size="sm">{history.length} Action(s)</Badge>
            </CardHeader>
            <CardContent className="p-3 text-xs">
              {history.length === 0 ? (
                <p className="text-slate-500 italic py-2">No cleaning actions applied. Original raw data active.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {history.map((item, idx) => (
                    <div key={item.id} className="p-2 rounded bg-slate-900/50 border border-slate-800 flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">
                          #{idx + 1}: {item.summary}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(item.timestamp).toLocaleTimeString()} • {item.affectedRows} row(s) updated
                        </span>
                      </div>
                      <Badge variant="brand" size="sm">{item.action}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Deep Column Statistical Inspector & Anomalies */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {currentProfile ? (
            <Card glass>
              <CardHeader className="border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base text-white">{currentProfile.name}</CardTitle>
                    <Badge variant="purple">{currentProfile.inferredType}</Badge>
                    <Badge variant="brand">Role: {currentProfile.semanticRole}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeDataset.semanticMappings?.[currentProfile.name]?.description || 'Statistical dispersion, outliers, and distribution frequency'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">Semantic Role:</span>
                  <select
                    value={currentProfile.semanticRole}
                    onChange={(e) => {
                      overrideColumnRole(activeDataset.id, currentProfile.name, e.target.value as SemanticRole);
                      showNotification(`Updated "${currentProfile.name}" role to ${e.target.value}.`);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="primary_metric">Primary Metric (Target KPI)</option>
                    <option value="secondary_metric">Secondary Metric (Measure)</option>
                    <option value="dimension">Dimension (Breakdown)</option>
                    <option value="category">Category (Slice)</option>
                    <option value="timestamp">Timestamp (Temporal)</option>
                    <option value="entity_id">Entity Identifier (Key)</option>
                    <option value="status">Status (Workflow State)</option>
                    <option value="geo">Geographic (Location)</option>
                    <option value="attribute">Attribute (Descriptive)</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-5">
                {/* Statistical Overview Grid (For Numeric / Currency / Percentage) */}
                {['numeric', 'currency', 'percentage'].includes(currentProfile.inferredType) && currentProfile.min !== undefined ? (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                      Descriptive Statistical Measures
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">Min</span>
                        <p className="text-sm font-bold text-white font-mono mt-0.5">{currentProfile.min}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">Max</span>
                        <p className="text-sm font-bold text-white font-mono mt-0.5">{currentProfile.max}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">Mean (Average)</span>
                        <p className="text-sm font-bold text-white font-mono mt-0.5">{currentProfile.mean}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">Median (Q2)</span>
                        <p className="text-sm font-bold text-white font-mono mt-0.5">{currentProfile.median}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">Std Deviation</span>
                        <p className="text-sm font-bold text-white font-mono mt-0.5">{currentProfile.stdDev}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">Interquartile (IQR)</span>
                        <p className="text-sm font-bold text-white font-mono mt-0.5">{currentProfile.iqr}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">25th / 75th %ile</span>
                        <p className="text-sm font-bold text-white font-mono mt-0.5">
                          {currentProfile.q25} / {currentProfile.q75}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">IQR Outliers</span>
                        <p className={`text-sm font-bold font-mono mt-0.5 ${currentProfile.outlierCount ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {currentProfile.outlierCount ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                    <FileCheck2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span>
                      Categorical or textual attribute with <strong className="text-slate-200">{currentProfile.distinctCount}</strong> unique values across <strong className="text-slate-200">{currentProfile.totalCount}</strong> total rows.
                    </span>
                  </div>
                )}

                {/* Top Frequency Distribution */}
                {currentProfile.topFrequencies && currentProfile.topFrequencies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                      Top Value Frequencies
                    </h4>
                    <div className="space-y-2 border border-slate-800/80 rounded-xl p-3 bg-slate-900/30">
                      {currentProfile.topFrequencies.map((freq, i) => (
                        <div key={i} className="flex flex-col gap-1 text-xs">
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="font-mono truncate max-w-[280px]">{freq.value || '(Empty / Null)'}</span>
                            <span className="font-semibold text-slate-400 font-mono">
                              {freq.count.toLocaleString()} ({freq.percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(2, freq.percentage))}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Values */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Sample Raw Values
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentProfile.sampleValues.map((val, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                        {String(val)}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-xl">
              Select a column to inspect its statistical profile.
            </div>
          )}

          {/* Dataset Quality Anomalies Section */}
          <Card glass>
            <CardHeader className="py-3.5 px-4 border-b border-slate-800 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <CardTitle className="text-sm">Detected Anomalies & Data Issues</CardTitle>
              </div>
              <Badge variant={quality.anomaliesDetected.length === 0 ? 'success' : 'warning'} size="sm">
                {quality.anomaliesDetected.length} Issue(s)
              </Badge>
            </CardHeader>
            <CardContent className="p-4">
              {quality.anomaliesDetected.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No severe anomalies detected in this dataset. Ready for analytical modeling.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {quality.anomaliesDetected.map((anom, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                        anom.severity === 'high' 
                          ? 'bg-rose-950/20 border-rose-800/50 text-rose-300' 
                          : anom.severity === 'medium'
                          ? 'bg-amber-950/20 border-amber-800/50 text-amber-300'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-white">{anom.column}</strong>
                          <Badge 
                            variant={anom.severity === 'high' ? 'danger' : anom.severity === 'medium' ? 'warning' : 'neutral'} 
                            size="sm"
                          >
                            {anom.type}
                          </Badge>
                        </div>
                        <p className="text-slate-400 mt-1">{anom.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Impute Missing Values */}
      <Modal
        isOpen={isImputeModalOpen}
        onClose={() => setIsImputeModalOpen(false)}
        title="Impute Missing Values"
        description="Choose a statistical strategy to replace null, empty, or missing values."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsImputeModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleApplyImpute}>Apply Cleaning</Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Column</label>
            <select
              value={imputeCol}
              onChange={(e) => setImputeCol(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              {columns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Imputation Strategy</label>
            <select
              value={imputeStrategy}
              onChange={(e) => setImputeStrategy(e.target.value as ImputeStrategy)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="mean">Mean (Average - for numeric)</option>
              <option value="median">Median (50th percentile - robust against outliers)</option>
              <option value="mode">Mode (Most frequent value)</option>
              <option value="constant">Custom Constant Value</option>
              <option value="drop_rows">Drop Rows with Missing Values</option>
            </select>
          </div>

          {imputeStrategy === 'constant' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Constant Replacement Value</label>
              <input
                type="text"
                value={imputeConstant}
                onChange={(e) => setImputeConstant(e.target.value)}
                placeholder="e.g. 0 or N/A"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: Standardize Categories */}
      <Modal
        isOpen={isStandardizeModalOpen}
        onClose={() => setIsStandardizeModalOpen(false)}
        title="Standardize Categorical Text"
        description="Clean strings by trimming whitespace and formatting text casing consistently."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsStandardizeModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleApplyStandardize}>Standardize Column</Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Column</label>
            <select
              value={standardizeCol}
              onChange={(e) => setStandardizeCol(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              {columns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Casing Mode</label>
            <select
              value={standardizeMode}
              onChange={(e) => setStandardizeMode(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="title">Title Case (e.g. "North America")</option>
              <option value="lower">lower case (e.g. "north america")</option>
              <option value="upper">UPPER CASE (e.g. "NORTH AMERICA")</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal: Cast Data Type */}
      <Modal
        isOpen={isCastModalOpen}
        onClose={() => setIsCastModalOpen(false)}
        title="Cast Column Data Type"
        description="Convert values in a column to a specific data format."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsCastModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleApplyCast}>Cast Column</Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Column</label>
            <select
              value={castCol}
              onChange={(e) => setCastCol(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              {columns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Data Type</label>
            <select
              value={castType}
              onChange={(e) => setCastType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="numeric">Numeric (Strip $, %, commas)</option>
              <option value="date">Date (Standardize to YYYY-MM-DD)</option>
              <option value="boolean">Boolean (true / false)</option>
              <option value="string">String (Text)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
