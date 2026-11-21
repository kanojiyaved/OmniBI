import React, { useRef, useState } from 'react';
import { Download, Check } from 'lucide-react';
import { exportChartAsPNG } from '../../core/export/exportEngine';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  actionNode?: React.ReactNode;
  onExport?: () => void;
  children: React.ReactNode;
  className?: string;
  enablePngExport?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  actionNode,
  onExport,
  children,
  className = '',
  enablePngExport = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exported, setExported] = useState(false);

  const handleExportPng = async () => {
    if (onExport) {
      onExport();
      return;
    }
    if (cardRef.current) {
      try {
        await exportChartAsPNG(cardRef.current, title);
        setExported(true);
        setTimeout(() => setExported(false), 2000);
      } catch {}
    }
  };

  return (
    <div 
      ref={cardRef}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {actionNode}
          {(onExport || enablePngExport) && (
            <button
              onClick={handleExportPng}
              title={onExport ? 'Export Chart' : 'Export Chart as PNG Image'}
              aria-label={onExport ? 'Export Chart' : 'Export Chart as PNG Image'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {exported ? <Check className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="w-full flex-1 min-h-[260px] flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
};
