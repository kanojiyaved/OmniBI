import React from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Database, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export interface DomainAdaptationBannerProps {
  moduleName: string;
  sourceDatasetName?: string;
  detectedDomain?: string;
  isDemo?: boolean;
  isAdapted?: boolean;
  onOpenImport?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const DomainAdaptationBanner: React.FC<DomainAdaptationBannerProps> = ({
  moduleName,
  sourceDatasetName,
  detectedDomain = 'General',
  isDemo,
  isAdapted,
  onOpenImport,
  onNavigateTab,
}) => {
  if (isDemo) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Synthetic Preview Mode: </span>
            <span className="text-amber-800">
              No active dataset uploaded. Showing realistic enterprise data to demonstrate {moduleName} functionality.
            </span>
          </div>
        </div>
        {onOpenImport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenImport}
            className="border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs shrink-0 self-start sm:self-auto"
          >
            Import Real Dataset
          </Button>
        )}
      </div>
    );
  }

  if (isAdapted) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 text-purple-950 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <div>
            <span className="font-bold">Domain-Adapted Telemetry: </span>
            <span className="text-purple-800">
              "{sourceDatasetName}" is classified as <strong>{detectedDomain.toUpperCase()}</strong>. {moduleName} has dynamically adapted its dimensions to your active schema.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Badge variant="purple" size="sm">{detectedDomain.toUpperCase()}</Badge>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('overview')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 ml-1"
            >
              Executive Overview <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs">
      <div className="flex items-center gap-2">
        <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          Live Telemetry from <strong>{sourceDatasetName}</strong> ({detectedDomain.toUpperCase()})
        </span>
      </div>
      <Badge variant="success" size="sm">Active Dataset Connected</Badge>
    </div>
  );
};
