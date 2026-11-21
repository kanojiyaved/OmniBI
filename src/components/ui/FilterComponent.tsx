import React from 'react';
import { Filter, X } from 'lucide-react';
import { Badge } from './Badge';

export interface FilterTag {
  id: string;
  category: string;
  value: string;
}

export interface FilterComponentProps {
  activeFilters: FilterTag[];
  onRemoveFilter: (id: string) => void;
  onClearAll: () => void;
  onOpenFilterDrawer?: () => void;
}

export const FilterComponent: React.FC<FilterComponentProps> = ({
  activeFilters,
  onRemoveFilter,
  onClearAll,
  onOpenFilterDrawer,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-sm text-xs">
      <button
        onClick={onOpenFilterDrawer}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
      >
        <Filter className="w-3.5 h-3.5 text-purple-600" />
        <span>Filter</span>
        {activeFilters.length > 0 && (
          <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
            {activeFilters.length}
          </span>
        )}
      </button>

      {activeFilters.length === 0 ? (
        <span className="text-slate-400 italic text-[11px] pl-1">No active filters applied</span>
      ) : (
        <>
          {activeFilters.map((f) => (
            <Badge key={f.id} variant="purple" size="sm" className="gap-1 pl-2 pr-1">
              <span className="font-medium text-purple-900">{f.category}:</span>
              <span>{f.value}</span>
              <button
                onClick={() => onRemoveFilter(f.id)}
                className="hover:bg-purple-200/60 rounded-full p-0.5 text-purple-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={onClearAll}
            className="text-[11px] text-purple-600 hover:text-purple-800 font-semibold pl-1 underline"
          >
            Clear all
          </button>
        </>
      )}
    </div>
  );
};
