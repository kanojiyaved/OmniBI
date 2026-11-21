import React from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { AlertCircle, Upload, Layers } from 'lucide-react';
import { ModuleAvailabilityResult } from '../../core/analytics/moduleAvailability';

export interface ModuleUnavailableStateProps {
  availability: ModuleAvailabilityResult;
  datasetName?: string;
  columns?: string[];
  onOpenImport?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ModuleUnavailableState: React.FC<ModuleUnavailableStateProps> = ({
  availability,
  datasetName = 'Active Dataset',
  columns = [],
  onOpenImport,
  onNavigateTab,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center max-w-2xl mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Badge variant="warning" size="sm">Module Unavailable</Badge>
        <span className="text-xs text-slate-400 font-mono">{datasetName}</span>
      </div>

      <h2 className="text-xl font-black text-slate-900 tracking-tight">
        {availability.moduleName} is Not Available
      </h2>

      <p className="text-xs text-slate-600 mt-2 max-w-lg leading-relaxed">
        {availability.reason}
      </p>

      {/* Missing Requirements List */}
      {availability.missingRequirements.length > 0 && (
        <div className="w-full mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-left">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
            Missing Required Schema Fields:
          </span>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {availability.missingRequirements.map((req, idx) => (
              <li key={idx} className="flex items-center gap-2 text-rose-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Available Columns in Current Dataset */}
      {columns.length > 0 && (
        <div className="w-full mt-4 text-left">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Fields Available in "{datasetName}":
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
            {columns.map((col) => (
              <span
                key={col}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200/60"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        {onOpenImport && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenImport}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Upload Compatible Dataset
          </Button>
        )}
        {onNavigateTab && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('overview')}
            leftIcon={<Layers className="w-3.5 h-3.5" />}
          >
            Back to Executive Overview
          </Button>
        )}
      </div>
    </div>
  );
};
