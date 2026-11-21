import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export interface DateRange {
  label: string;
  startDate: string;
  endDate: string;
}

export interface DatePickerProps {
  selectedRange?: string;
  onChange?: (range: DateRange) => void;
  className?: string;
}

const PRESET_RANGES: DateRange[] = [
  { label: 'Today', startDate: '2026-11-21', endDate: '2026-11-21' },
  { label: 'Last 7 Days', startDate: '2026-11-14', endDate: '2026-11-21' },
  { label: 'Last 30 Days', startDate: '2026-10-22', endDate: '2026-11-21' },
  { label: 'This Quarter (Q4)', startDate: '2026-10-01', endDate: '2026-12-31' },
  { label: 'Year to Date (YTD)', startDate: '2026-01-01', endDate: '2026-11-21' },
];

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedRange = 'Last 30 Days',
  onChange,
  className = '',
}) => {
  const [current, setCurrent] = useState(selectedRange);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 text-purple-600" />
        <span>{current}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-slide-up">
          {PRESET_RANGES.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setCurrent(preset.label);
                setIsOpen(false);
                if (onChange) onChange(preset);
              }}
              className={`w-full px-3.5 py-2 text-xs text-left transition-colors flex items-center justify-between ${
                current === preset.label
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
