import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Database, FileSpreadsheet } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';

export const DataVaultPage: React.FC = () => {
  const { datasets, activeDatasetId } = useAppStore();
  const activeDataset = datasets.find((d) => d.id === activeDatasetId);

  if (!activeDataset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <Database className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-200">No Dataset Active</h3>
        <p className="text-xs text-slate-500 mt-1">Upload a CSV or Excel file to inspect tabular data.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Raw Data Vault</h2>
          <p className="text-xs text-slate-400">
            {activeDataset.fileName} • {formatFileSize(activeDataset.fileSize)} • {activeDataset.rowCount.toLocaleString()} rows
          </p>
        </div>
        <Badge variant="brand">{activeDataset.columns.length} Columns</Badge>
      </div>

      <Card glass>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-brand-400" />
            <span>Tabular Ingestion Inspector</span>
          </CardTitle>
          <span className="text-xs text-slate-400">Showing first 15 records</span>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-[500px] text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300 font-semibold sticky top-0">
                  <th className="px-3 py-2.5 text-slate-500 font-mono">#</th>
                  {activeDataset.columns.map((col) => (
                    <th key={col} className="px-3 py-2.5 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-400">
                {activeDataset.data.slice(0, 15).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50">
                    <td className="px-3 py-2 text-slate-600">{idx + 1}</td>
                    {activeDataset.columns.map((col) => (
                      <td key={col} className="px-3 py-2 whitespace-nowrap truncate max-w-[200px] text-slate-300">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
