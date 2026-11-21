import React, { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { parseUploadedFile } from '../../core/parser/universalParser';
import { parseCSVContent } from '../../core/parser/csvParser';
import { SAMPLE_DATASETS, SampleDatasetEntry } from '../../data/sampleDatasets';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  UploadCloud, 
  Sparkles, 
  AlertCircle, 
  Layers, 
  ArrowRight,
  Table
} from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';
import { Dataset } from '../../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded?: (datasetId: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
}) => {
  const { addDataset, setLoading, isLoading } = useAppStore();

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{ columns: string[]; rows: any[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setError(null);
    setExcelSheets([]);
    setSelectedSheet('');
    setStagedFile(null);
    setPreviewData(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    setError(null);
    setStagedFile(file);
    try {
      setLoading(true);
      const res = await parseUploadedFile(file);

      if (res.isExcel && res.sheetNames && res.sheetNames.length > 1) {
        setExcelSheets(res.sheetNames);
        setSelectedSheet(res.activeSheet || res.sheetNames[0]);
      }

      if (res.parseResult.data.length === 0) {
        setError('The file contains no readable data rows.');
        setPreviewData(null);
        return;
      }

      setPreviewData({
        columns: res.parseResult.columns,
        rows: res.parseResult.data.slice(0, 5),
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to parse file. Please verify CSV or Excel structure.');
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!stagedFile) return;
    setSelectedSheet(sheetName);
    try {
      setLoading(true);
      const res = await parseUploadedFile(stagedFile, sheetName);
      setPreviewData({
        columns: res.parseResult.columns,
        rows: res.parseResult.data.slice(0, 5),
      });
    } catch (err: any) {
      setError(`Failed to read sheet "${sheetName}": ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const commitDataset = async (
    name: string,
    columns: string[],
    data: Record<string, any>[],
    fileSize: number
  ) => {
    const datasetId = `ds-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const ext = name.split('.').pop()?.toLowerCase() || '';
    const format = ext === 'xls' ? 'xls' : ext === 'xlsx' ? 'xlsx' : 'csv';

    const newDataset: Dataset = {
      id: datasetId,
      name,
      fileName: name,
      fileFormat: format,
      fileSize,
      uploadedAt: new Date().toISOString(),
      rowCount: data.length,
      columnCount: columns.length,
      columns,
      data,
      availableSheets: excelSheets.length > 0 ? excelSheets : ['Sheet1'],
      activeSheet: selectedSheet || 'Sheet1',
      processingStatus: 'ready',
      profiles: {},
      quality: {
        overallScore: 95,
        totalRows: data.length,
        totalColumns: columns.length,
        duplicateRowsCount: 0,
        missingCellsCount: 0,
        missingDataPercentage: 0,
        anomaliesDetected: [],
      },
      detectedDomain: {
        domain: 'general' as any,
        confidence: 0.90,
        reasoning: ['Universal file ingested successfully'],
        domainLabel: 'General Enterprise Tabular',
      },
      semanticMappings: {},
    };

    addDataset(newDataset);
    if (onDatasetLoaded) {
      onDatasetLoaded(datasetId);
    }
    handleClose();
  };

  const handleConfirmUpload = async () => {
    if (!stagedFile) return;
    try {
      setLoading(true);
      const res = await parseUploadedFile(stagedFile, selectedSheet || undefined);
      await commitDataset(
        stagedFile.name,
        res.parseResult.columns,
        res.parseResult.data,
        stagedFile.size
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to process dataset.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (sample: SampleDatasetEntry) => {
    try {
      setLoading(true);
      const parseRes = parseCSVContent(sample.csvContent);
      commitDataset(
        sample.name,
        parseRes.columns,
        parseRes.data,
        sample.csvContent.length
      );
    } catch (err: any) {
      setError(`Failed to load sample dataset: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Universal Data Ingestion Engine"
      description="Select CSV, TSV, or Excel spreadsheets to mount into the analytics engine."
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-6">
        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
            dragActive
              ? 'border-purple-500 bg-purple-50 scale-[1.01]'
              : 'border-slate-200 hover:border-purple-400 bg-slate-50/70 hover:bg-purple-50/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />

          <div className="w-14 h-14 rounded-2xl bg-white border border-purple-100 flex items-center justify-center mb-3 text-purple-600 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <p className="text-sm font-bold text-slate-900">
            {stagedFile ? stagedFile.name : 'Click to select or drag and drop your file'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {stagedFile
              ? `${formatFileSize(stagedFile.size)} • Ready to mount`
              : 'Supports CSV, TSV, and Multi-Sheet Excel (.xlsx, .xls) up to 50MB'}
          </p>

          <div className="flex items-center gap-2 mt-4">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs">
              CSV / TSV
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs">
              Excel (.XLSX)
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Auto-Delimiter
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Multi-Sheet Selector for Excel */}
        {excelSheets.length > 1 && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Select Excel Worksheet:</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {excelSheets.map((sheet) => (
                <button
                  key={sheet}
                  type="button"
                  onClick={() => handleSheetChange(sheet)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedSheet === sheet
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sheet}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live File Preview Table */}
        {previewData && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-purple-600" />
                <span>Data Ingestion Preview ({previewData.columns.length} columns detected)</span>
              </span>
              <span className="text-[11px] text-slate-400">First 5 rows</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-48 bg-white text-xs shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold sticky top-0">
                    {previewData.columns.map((col) => (
                      <th key={col} className="px-3 py-2 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
                  {previewData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {previewData.columns.map((col) => (
                        <td key={col} className="px-3 py-1.5 whitespace-nowrap truncate max-w-[150px]">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-2">
              <Button
                variant="primary"
                onClick={handleConfirmUpload}
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Mount & Ingest Dataset
              </Button>
            </div>
          </div>
        )}

        {/* Instant Enterprise Benchmarks */}
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Or Load Instant Benchmark Dataset</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_DATASETS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                      {sample.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {sample.description}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={sample.domain === 'saas' ? 'purple' : sample.domain === 'ecommerce' ? 'brand' : 'success'} size="sm">
                    {sample.domain.toUpperCase()}
                  </Badge>
                  <span className="text-[11px] text-purple-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Load <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
