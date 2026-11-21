import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  XCircle, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SemanticRole } from '../../types';
import { DOMAIN_ONTOLOGIES } from '../../core/semantic/domainOntology';
import { generateDatasetUnderstandingReport } from '../../core/semantic/datasetUnderstandingReport';

export const InteractiveSemanticMapping: React.FC = () => {
  const { datasets, activeDatasetId, overrideColumnRole } = useAppStore();
  const activeDataset = datasets.find((d) => d.id === activeDatasetId);

  const [isReportOpen, setIsReportOpen] = useState(true);
  const [confirmedColumns, setConfirmedColumns] = useState<Record<string, boolean>>({});

  if (!activeDataset) {
    return (
      <div className="p-8 text-center text-slate-400 border border-slate-800 rounded-xl bg-slate-900/30">
        <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <p className="text-sm">No dataset active. Ingest a dataset to inspect AI semantic mapping.</p>
      </div>
    );
  }

  const columns = activeDataset.columns;
  const mappings = activeDataset.semanticMappings || {};
  const report = generateDatasetUnderstandingReport(activeDataset);

  const handleConfirmColumn = (col: string) => {
    setConfirmedColumns((prev) => ({ ...prev, [col]: true }));
  };

  const handleConfirmAllHighConfidence = () => {
    const updated = { ...confirmedColumns };
    columns.forEach((col) => {
      const conf = mappings[col]?.confidence ?? 0;
      if (conf >= 0.70) {
        updated[col] = true;
      }
    });
    setConfirmedColumns(updated);
  };

  const handleRoleChange = (col: string, newRole: SemanticRole) => {
    overrideColumnRole(activeDataset.id, col, newRole);
    setConfirmedColumns((prev) => ({ ...prev, [col]: true }));
  };

  const domain = activeDataset.detectedDomain?.domain || 'general';
  const ontology = DOMAIN_ONTOLOGIES[domain] || DOMAIN_ONTOLOGIES.general;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top AI Understanding Report Banner */}
      <Card glass className="border border-indigo-500/30 bg-gradient-to-r from-slate-900/90 via-indigo-950/20 to-slate-900/90">
        <CardHeader className="border-b border-slate-800/80 py-3.5 px-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <CardTitle className="text-sm font-bold text-white tracking-tight">
              AI Dataset Understanding Report
            </CardTitle>
            <Badge variant="purple" size="sm">
              {ontology.label} ({Math.round((activeDataset.detectedDomain?.confidence || 0.8) * 100)}% Match)
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsReportOpen(!isReportOpen)}
            className="text-slate-400 hover:text-white"
          >
            {isReportOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardHeader>

        {isReportOpen && (
          <CardContent className="p-5 space-y-4 text-xs">
            {/* Narrative Explanation */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 leading-relaxed">
              <strong className="text-white block mb-1">Dataset Representation:</strong>
              {report.datasetRepresentation}
            </div>

            {/* Calculated Metrics Available */}
            <div>
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Business Metrics Derivable from Schema
              </h4>
              <div className="flex flex-wrap gap-2">
                {report.calculatedMetricsAvailable.map((metric, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 font-medium"
                  >
                    ✓ {metric}
                  </span>
                ))}
              </div>
            </div>

            {/* Modules Available vs Unavailable */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Available */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-emerald-900/30">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Available Analytics Modules
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {report.availableModules.map((m, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <div>
                        <strong className="text-white">{m.name}:</strong> {m.description}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Unavailable */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                  Unavailable Analytics Modules
                </span>
                <ul className="space-y-1.5 text-slate-400">
                  {report.unavailableModules.map((m, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-slate-500 font-bold">•</span>
                      <div>
                        <strong className="text-slate-300">{m.name}:</strong> {m.reason}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pending Confirmations Alert */}
            {report.columnsRequiringConfirmation.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center justify-between gap-3 text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>{report.columnsRequiringConfirmation.length} column(s)</strong> have lower confidence and require user verification below.
                  </span>
                </div>
                <Button variant="secondary" size="sm" onClick={handleConfirmAllHighConfidence}>
                  Approve High-Confidence Mappings
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Interactive Semantic Mapping Table */}
      <Card glass>
        <CardHeader className="py-3.5 px-5 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white">Semantic Column Mapping</CardTitle>
            <p className="text-[11px] text-slate-400">
              Deterministic schema interpretation for unfamiliar column naming patterns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleConfirmAllHighConfidence}>
              Confirm All High Confidence
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-300 font-semibold">
                <th className="py-3.5 px-5">Original Column</th>
                <th className="py-3.5 px-5">Suggested Meaning</th>
                <th className="py-3.5 px-5">Confidence</th>
                <th className="py-3.5 px-5 text-right">User Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {columns.map((col) => {
                const map = mappings[col];
                const confidence = map?.confidence ?? 0.70;
                const requiresConf = map?.requiresConfirmation || confidence < 0.70;
                const isConfirmed = confirmedColumns[col] || map?.confirmed;
                const role = map?.role || activeDataset.profiles[col]?.semanticRole || 'attribute';
                const meaning = map?.suggestedMeaning || map?.description || 'Descriptive Attribute';

                return (
                  <tr 
                    key={col} 
                    className={`hover:bg-slate-900/40 transition-colors ${
                      requiresConf && !isConfirmed ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    {/* 1. Original Column */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white font-mono">{col}</span>
                        <Badge variant="neutral" size="sm">
                          {activeDataset.profiles[col]?.inferredType || 'text'}
                        </Badge>
                      </div>
                    </td>

                    {/* 2. Suggested Meaning */}
                    <td className="py-3 px-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-200">{meaning}</span>
                        <span className="text-[11px] text-slate-400">{map?.description}</span>
                      </div>
                    </td>

                    {/* 3. Confidence */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            confidence >= 0.85 
                              ? 'success' 
                              : confidence >= 0.70 
                              ? 'warning' 
                              : 'danger'
                          }
                          size="sm"
                        >
                          {Math.round(confidence * 100)}%
                        </Badge>
                        {requiresConf && !isConfirmed && (
                          <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Requires Confirmation
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. User Action */}
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Role Selector */}
                        <select
                          value={role}
                          onChange={(e) => handleRoleChange(col, e.target.value as SemanticRole)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                        >
                          <option value="primary_metric">Primary Metric (Revenue / Sales)</option>
                          <option value="secondary_metric">Secondary Metric (Cost / Rate)</option>
                          <option value="entity_id">Entity ID (Customer / Key)</option>
                          <option value="timestamp">Date / Timestamp</option>
                          <option value="category">Category / Segment</option>
                          <option value="status">Status / State</option>
                          <option value="geo">Geographic Location</option>
                          <option value="dimension">Breakdown Dimension</option>
                          <option value="attribute">Attribute (General)</option>
                        </select>

                        {/* Confirmation Button */}
                        {isConfirmed ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Confirmed
                          </Badge>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleConfirmColumn(col)}
                          >
                            Confirm
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
