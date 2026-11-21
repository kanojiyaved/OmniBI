import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { parseMultipleFiles } from '../core/parser/universalParser';
import { parseCSVContent } from '../core/parser/csvParser';
import { profileEntireDataset } from '../core/profiler/profilePipeline';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ProgressIndicator } from '../components/ui/ProgressIndicator';
import { 
  UploadCloud, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Eye
} from 'lucide-react';
import { Dataset } from '../types';

export interface DataImportPageProps {
  onOpenUploadModal?: () => void;
  onLoadSample?: (sampleId: string) => void;
}

export const DataImportPage: React.FC<DataImportPageProps> = () => {
  const { 
    datasets, 
    activeDatasetId, 
    addDataset, 
    deleteDataset, 
    replaceDataset, 
    setActiveDatasetId 
  } = useAppStore();

  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Preview & Sheet Selection State
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null);
  const [replacingDatasetId, setReplacingDatasetId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    setErrorNotification(null);
    setSuccessNotification(null);
    setUploadProgress(20);

    try {
      const timer = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 25, 90));
      }, 100);

      const parsedResults = await parseMultipleFiles(files);
      clearInterval(timer);
      setUploadProgress(100);

      parsedResults.forEach((parsed) => {
        if (parsed.parseResult.data.length === 0) {
          throw new Error(`File "${parsed.fileName}" contains no data rows or is empty.`);
        }

        const newId = replacingDatasetId || `ds-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const { profiles, quality } = profileEntireDataset(parsed.parseResult.data, parsed.parseResult.columns);

        const datasetObj: Dataset = {
          id: newId,
          name: parsed.fileName.replace(/\.[^/.]+$/, ''),
          fileName: parsed.fileName,
          fileFormat: parsed.fileFormat,
          fileSize: parsed.fileSize,
          uploadedAt: new Date().toISOString(),
          rowCount: parsed.parseResult.rowCount,
          columnCount: parsed.parseResult.columnCount,
          columns: parsed.parseResult.columns,
          data: parsed.parseResult.data,
          rawRows: [...parsed.parseResult.data],
          cleaningHistory: [],
          availableSheets: parsed.sheetNames,
          activeSheet: parsed.activeSheet,
          processingStatus: 'ready',
          profiles,
          quality,
          detectedDomain: {
            domain: 'general',
            confidence: 0.9,
            reasoning: ['File parsed without errors'],
            domainLabel: 'Enterprise Tabular',
          },
          semanticMappings: {},
        };

        if (replacingDatasetId) {
          replaceDataset(replacingDatasetId, datasetObj);
          setSuccessNotification(`Dataset "${datasetObj.name}" successfully replaced.`);
          setReplacingDatasetId(null);
        } else {
          addDataset(datasetObj);
          setSuccessNotification(`Mounted ${parsedResults.length} dataset(s) successfully.`);
        }
      });
    } catch (err: any) {
      setErrorNotification(err?.message || 'Failed to ingest file.');
    } finally {
      setTimeout(() => setUploadProgress(0), 1000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId) || SAMPLE_DATASETS[0];
    const parsed = parseCSVContent(sample.csvContent);

    const { profiles, quality } = profileEntireDataset(parsed.data, parsed.columns);

    const datasetObj: Dataset = {
      id: `ds-sample-${Date.now()}`,
      name: sample.name,
      fileName: `${sample.domain}-metrics.csv`,
      fileFormat: 'csv',
      fileSize: sample.csvContent.length,
      uploadedAt: new Date().toISOString(),
      rowCount: parsed.data.length,
      columnCount: parsed.columns.length,
      columns: parsed.columns,
      data: parsed.data,
      rawRows: [...parsed.data],
      cleaningHistory: [],
      availableSheets: ['Sheet1'],
      activeSheet: 'Sheet1',
      processingStatus: 'ready',
      profiles,
      quality,
      detectedDomain: {
        domain: sample.domain,
        confidence: 0.95,
        reasoning: ['Pre-verified enterprise benchmark'],
        domainLabel: sample.domain.toUpperCase(),
      },
      semanticMappings: {},
    };

    addDataset(datasetObj);
    setSuccessNotification(`Mounted benchmark dataset: "${sample.name}".`);
  };

  const startReplacement = (datasetId: string) => {
    setReplacingDatasetId(datasetId);
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Data Import & Ingestion Hub</h1>
        <p className="text-xs text-slate-500 mt-1">
          Universal support for CSV, XLSX, and XLS with multi-file queueing, sheet selection, and isolation management.
        </p>
      </div>

      {/* Notifications */}
      {errorNotification && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorNotification}</span>
          </div>
          <button onClick={() => setErrorNotification(null)} className="text-rose-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {successNotification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successNotification}</span>
          </div>
          <button onClick={() => setSuccessNotification(null)} className="text-emerald-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Container */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
          dragActive
            ? 'border-purple-500 bg-purple-50 scale-[1.01]'
            : 'border-purple-200 hover:border-purple-400 bg-purple-50/20 hover:bg-purple-50/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.xlsx,.xls"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(Array.from(e.target.files));
            }
          }}
        />

        <div className="w-14 h-14 rounded-2xl bg-white border border-purple-100 flex items-center justify-center text-purple-600 mb-3 shadow-sm">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold text-slate-900">
          {replacingDatasetId ? 'Select New File to Replace Dataset' : 'Drag & Drop Multiple Files or Browse'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
          Supports CSV, TSV, and Multi-Sheet Excel (.xlsx, .xls) up to 50MB per file. High-throughput client-side parsing with formula sanitization.
        </p>

        <div className="flex items-center gap-2 mt-4">
          <Badge variant="purple" size="sm">CSV & TSV</Badge>
          <Badge variant="brand" size="sm">Excel .XLSX & .XLS</Badge>
          <Badge variant="success" size="sm">Zero Macro Execution</Badge>
        </div>

        {uploadProgress > 0 && (
          <div className="w-full max-w-xs mt-5">
            <ProgressIndicator value={uploadProgress} label="Ingestion Progress" size="sm" />
          </div>
        )}
      </div>

      {/* Dataset Manager & Recent Upload History */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Mounted Dataset History</h3>
            <p className="text-xs text-slate-500">
              Manage mounted datasets, switch active views, inspect metadata, or replace files.
            </p>
          </div>
          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
            {datasets.length} Total Dataset{datasets.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Dataset Name & ID</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Dimensions</th>
                  <th className="px-4 py-3">Sheets</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datasets.length > 0 ? (
                  datasets.map((d) => {
                    const isActive = d.id === activeDatasetId;
                    return (
                      <tr key={d.id} className={`hover:bg-slate-50 transition-colors ${isActive ? 'bg-purple-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isActive && (
                              <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" title="Active Dataset" />
                            )}
                            <div>
                              <p className="font-bold text-slate-900">{d.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">{d.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={d.fileFormat === 'xlsx' || d.fileFormat === 'xls' ? 'brand' : 'purple'} size="sm">
                            {d.fileFormat.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {d.rowCount.toLocaleString()} rows × {d.columnCount} cols
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {d.availableSheets && d.availableSheets.length > 1 ? (
                            <span className="font-semibold text-purple-700">
                              {d.availableSheets.length} sheets
                            </span>
                          ) : (
                            '1 sheet'
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(d.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="success" size="sm">Ready</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewDataset(d)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                              title="Preview data table"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => startReplacement(d.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50"
                              title="Replace with updated file"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteDataset(d.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete dataset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {!isActive ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActiveDatasetId(d.id)}
                                className="ml-1 text-[11px] py-1 px-2.5 h-7"
                              >
                                Switch to
                              </Button>
                            ) : (
                              <span className="ml-1 text-[11px] font-bold text-purple-700 px-2.5 py-1 bg-purple-50 rounded-lg border border-purple-200">
                                Active
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No datasets uploaded yet. Drag & drop CSV or Excel files above or load a benchmark dataset below.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pre-loaded Enterprise Benchmark Datasets */}
      <div className="flex flex-col gap-3 pt-2">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Enterprise Sample Benchmarks
        </h3>
        <p className="text-xs text-slate-500">
          Mount pre-configured business datasets with zero manual configuration.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_DATASETS.map((sample) => (
            <div
              key={sample.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="purple" size="sm">{sample.domain.toUpperCase()}</Badge>
                  <span className="text-[11px] text-slate-400 font-mono">Benchmark</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{sample.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sample.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                <Button size="sm" variant="primary" onClick={() => handleLoadSample(sample.id)}>
                  Mount Dataset
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dataset Preview Modal */}
      {previewDataset && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewDataset(null)}
          title={`Preview: ${previewDataset.name}`}
          description={`Showing first 10 rows of ${previewDataset.rowCount.toLocaleString()} records across ${previewDataset.columnCount} columns.`}
          maxWidth="2xl"
        >
          <div className="flex flex-col gap-4">
            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-72 bg-white text-xs shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold sticky top-0">
                    <th className="px-3 py-2 text-slate-400 font-mono">#</th>
                    {previewDataset.columns.map((col) => (
                      <th key={col} className="px-3 py-2 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
                  {previewDataset.data.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 text-slate-400">{idx + 1}</td>
                      {previewDataset.columns.map((col) => (
                        <td key={col} className="px-3 py-1.5 whitespace-nowrap truncate max-w-[180px]">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setPreviewDataset(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
