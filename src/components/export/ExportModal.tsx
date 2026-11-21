/**
 * ============================================================================
 * Universal AI Business Intelligence Platform - Universal Export Dialog Modal
 * ============================================================================
 * 
 * Provides an interactive modal to configure and trigger data exports:
 * - Format selection: CSV, XLSX (Multi-Sheet), JSON, PDF.
 * - Scope selection: Current filtered view vs complete original dataset.
 * - Security & Sanitization: Formula injection prevention, PII masking.
 * - Delimiter and sheet configuration.
 */

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Code, 
  FileCheck, 
  ShieldCheck, 
  Check 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ExportFormat, ExportOptions } from '../../types';
import { executeUniversalExport } from '../../core/export/exportEngine';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { datasets, activeDatasetId, kpis, getFilteredData } = useAppStore();

  const activeDataset = datasets.find((d) => d.id === activeDatasetId);
  const filteredData = getFilteredData();

  const [format, setFormat] = useState<ExportFormat>('csv');
  const [scope, setScope] = useState<'filtered' | 'full'>('filtered');
  const [filename, setFilename] = useState('');
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t'>(',');
  const [includeBOM, setIncludeBOM] = useState(true);
  const [preventFormulaInjection, setPreventFormulaInjection] = useState(true);
  const [maskPII, setMaskPII] = useState(false);

  // Excel sheet options
  const [includeDataSheet, setIncludeDataSheet] = useState(true);
  const [includeKPISheet, setIncludeKPISheet] = useState(true);
  const [includeProfileSheet, setIncludeProfileSheet] = useState(true);

  // PDF options
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Status
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen || !activeDataset) return null;

  const rowCountToExport = scope === 'filtered' ? filteredData.length : activeDataset.rowCount;

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const options: ExportOptions = {
        format,
        scope,
        filename: filename.trim() || undefined,
        delimiter,
        includeBOM,
        preventFormulaInjection,
        maskPII,
        excelSheets: {
          includeData: includeDataSheet,
          includeKPIs: includeKPISheet,
          includeProfiling: includeProfileSheet,
        },
        pdfOptions: {
          pageOrientation: pdfOrientation,
          includeKPIs: true,
          includeCharts: true,
        },
      };

      await executeUniversalExport(activeDataset, filteredData, kpis, options);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Export Analytics & Dataset</h2>
              <p className="text-xs text-slate-500">
                Generate authenticated export from "{activeDataset.name}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Format Tabs */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Export Format</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  format === 'csv'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-5 h-5 mb-1 text-emerald-600" />
                <span>CSV</span>
                <span className="text-[10px] text-slate-400 font-normal">Delimited</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  format === 'xlsx'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 mb-1 text-green-600" />
                <span>Excel (.xlsx)</span>
                <span className="text-[10px] text-slate-400 font-normal">Multi-Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  format === 'json'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Code className="w-5 h-5 mb-1 text-amber-600" />
                <span>JSON</span>
                <span className="text-[10px] text-slate-400 font-normal">Full Schema</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  format === 'pdf'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileCheck className="w-5 h-5 mb-1 text-rose-600" />
                <span>PDF Report</span>
                <span className="text-[10px] text-slate-400 font-normal">Executive</span>
              </button>
            </div>
          </div>

          {/* Scope Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Data Scope</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  scope === 'filtered'
                    ? 'border-purple-500 bg-purple-50/50 text-purple-950 font-medium'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="export-scope"
                  checked={scope === 'filtered'}
                  onChange={() => setScope('filtered')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div className="text-xs">
                  <span className="block font-semibold">Active Filtered Slice</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {filteredData.length} records matching current filters
                  </span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  scope === 'full'
                    ? 'border-purple-500 bg-purple-50/50 text-purple-950 font-medium'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="export-scope"
                  checked={scope === 'full'}
                  onChange={() => setScope('full')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div className="text-xs">
                  <span className="block font-semibold">Full Dataset</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    All {activeDataset.rowCount} records in dataset
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Format Specific Config */}
          {format === 'csv' && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Delimiter</span>
                <div className="flex gap-2">
                  {[
                    { label: 'Comma (,)', val: ',' as const },
                    { label: 'Semicolon (;)', val: ';' as const },
                    { label: 'Tab (\\t)', val: '\t' as const },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setDelimiter(opt.val)}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-mono transition-colors ${
                        delimiter === opt.val
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={includeBOM}
                  onChange={(e) => setIncludeBOM(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Include UTF-8 BOM (Recommended for Microsoft Excel character display)</span>
              </label>
            </div>
          )}

          {format === 'xlsx' && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-semibold text-slate-700 block mb-1">Include Workbook Sheets:</span>
              <div className="space-y-1.5 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDataSheet}
                    onChange={(e) => setIncludeDataSheet(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Sheet 1: Dataset Tabular Records ({rowCountToExport} rows)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeKPISheet}
                    onChange={(e) => setIncludeKPISheet(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Sheet 2: Executive KPI Summary ({kpis.length} metrics)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeProfileSheet}
                    onChange={(e) => setIncludeProfileSheet(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Sheet 3: Column Profiling & Statistical Distribution</span>
                </label>
              </div>
            </div>
          )}

          {format === 'pdf' && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">Page Orientation</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPdfOrientation('portrait')}
                  className={`px-3 py-1.5 text-xs rounded-lg border font-medium ${
                    pdfOrientation === 'portrait'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Portrait (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setPdfOrientation('landscape')}
                  className={`px-3 py-1.5 text-xs rounded-lg border font-medium ${
                    pdfOrientation === 'landscape'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Landscape (Wide tables)
                </button>
              </div>
            </div>
          )}

          {/* Security & Sanitization Controls */}
          <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Enterprise Data Security Controls</span>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={preventFormulaInjection}
                onChange={(e) => setPreventFormulaInjection(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-900 block">Spreadsheet Formula Sanitization (CWE-1236)</span>
                <span className="text-[11px] text-slate-500 leading-tight block">
                  Neutralizes potential CSV injection attacks by prepending a quote (') to values starting with =, +, -, @.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={maskPII}
                onChange={(e) => setMaskPII(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-900 block">Mask Sensitive PII</span>
                <span className="text-[11px] text-slate-500 leading-tight block">
                  Automatically masks email addresses, phone numbers, and payment cards in exported records.
                </span>
              </div>
            </label>
          </div>

          {/* Filename Customization */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Custom Filename (Optional)</label>
            <input
              type="text"
              placeholder={`${activeDataset.name.toLowerCase().replace(/\s+/g, '_')}_export`}
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Exporting <strong className="text-slate-800">{rowCountToExport}</strong> records (
            <strong className="text-slate-800">{activeDataset.columns.length}</strong> columns)
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || rowCountToExport === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Exported!</span>
                </>
              ) : isExporting ? (
                <span>Generating...</span>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {format.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
