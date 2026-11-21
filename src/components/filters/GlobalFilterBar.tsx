import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  Check, 
  ChevronDown,
  Bookmark,
  Plus,
  Trash2
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { 
  applyGlobalFilters, 
  generateFilterTags, 
  extractFilterOptions, 
  getNumericRangeExtrema,
  getActiveFilterCount,
  isFilterActive,
  FilterTagItem 
} from '../../core/filters/filterEngine';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface GlobalFilterBarProps {
  className?: string;
  onFilterChange?: () => void;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({ 
  className = '',
  onFilterChange 
}) => {
  const { 
    datasets, 
    activeDatasetId, 
    filters, 
    savedFilterPresets,
    setSearchQuery,
    setDateRangeFilter,
    setCategoricalFilter,
    setNumericRangeFilter,
    clearCrossFilter,
    removeFilterTag,
    resetFilters,
    saveCurrentFilterCombination,
    applySavedFilterCombination,
    deleteSavedFilterCombination
  } = useAppStore();

  const activeDataset = datasets.find((d) => d.id === activeDatasetId);

  // Popover toggle states
  const [openDropdown, setOpenDropdown] = useState<'date' | 'category' | 'numeric' | 'saved' | null>(null);

  // Category popover internal state
  const [selectedCatCol, setSelectedCatCol] = useState<string>('');
  const [catSearchTerm, setCatSearchTerm] = useState<string>('');
  const [catSelectionMode, setCatSelectionMode] = useState<'multi' | 'single'>('multi');

  // Numeric popover internal state
  const [selectedNumCol, setSelectedNumCol] = useState<string>('');
  const [minNumInput, setMinNumInput] = useState<string>('');
  const [maxNumInput, setMaxNumInput] = useState<string>('');

  // Date custom inputs
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Saved preset input state
  const [newPresetName, setNewPresetName] = useState<string>('');

  // Close dropdown on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Compute active filtered counts
  const totalCount = activeDataset ? activeDataset.data.length : 0;
  const filteredRows = useMemo(() => {
    if (!activeDataset) return [];
    return applyGlobalFilters(activeDataset.data, filters, activeDataset);
  }, [activeDataset, filters]);

  const filteredCount = filteredRows.length;
  const activeCount = getActiveFilterCount(filters);
  const hasActiveFilters = isFilterActive(filters);
  const filterTags: FilterTagItem[] = useMemo(() => generateFilterTags(filters), [filters]);

  // Identify eligible categorical columns
  const categoricalColumns = useMemo(() => {
    if (!activeDataset) return [];
    return activeDataset.columns.filter((c) => {
      const type = activeDataset.profiles[c]?.inferredType;
      const role = activeDataset.semanticMappings[c]?.role;
      return (
        type === 'categorical' ||
        role === 'category' ||
        role === 'status' ||
        (role as string) === 'stage' ||
        (role as string) === 'region' ||
        (role as string) === 'department' ||
        (role as string) === 'campaign' ||
        (role as string) === 'product' ||
        (role as string) === 'customer' ||
        (type === 'text' && (activeDataset.profiles[c]?.distinctCount || 0) <= 50)
      );
    });
  }, [activeDataset]);

  // Identify eligible numeric columns
  const numericColumns = useMemo(() => {
    if (!activeDataset) return [];
    return activeDataset.columns.filter((c) => {
      const type = activeDataset.profiles[c]?.inferredType;
      const role = activeDataset.semanticMappings[c]?.role;
      return (
        type === 'numeric' ||
        type === 'currency' ||
        type === 'percentage' ||
        role === 'primary_metric' ||
        role === 'secondary_metric'
      );
    });
  }, [activeDataset]);

  // Initialize selected columns when dropdown opens
  useEffect(() => {
    if (categoricalColumns.length > 0 && !selectedCatCol) {
      setSelectedCatCol(categoricalColumns[0]);
    }
    if (numericColumns.length > 0 && !selectedNumCol) {
      setSelectedNumCol(numericColumns[0]);
    }
  }, [categoricalColumns, numericColumns, selectedCatCol, selectedNumCol]);

  // Update min/max input defaults when numeric column changes
  useEffect(() => {
    if (activeDataset && selectedNumCol) {
      const existing = filters.numericRanges[selectedNumCol];
      if (existing) {
        setMinNumInput(existing.min !== undefined ? String(existing.min) : '');
        setMaxNumInput(existing.max !== undefined ? String(existing.max) : '');
      } else {
        const extrema = getNumericRangeExtrema(activeDataset.data, selectedNumCol);
        setMinNumInput(String(extrema.min));
        setMaxNumInput(String(extrema.max));
      }
    }
  }, [selectedNumCol, activeDataset, filters.numericRanges]);

  // Categorical options for current selected category column
  const catOptions = useMemo(() => {
    if (!activeDataset || !selectedCatCol) return [];
    const all = extractFilterOptions(activeDataset.data, selectedCatCol);
    if (!catSearchTerm.trim()) return all;
    const q = catSearchTerm.toLowerCase().trim();
    return all.filter((opt) => opt.value.toLowerCase().includes(q));
  }, [activeDataset, selectedCatCol, catSearchTerm]);

  // Preset Date Ranges Handler
  const handleApplyDatePreset = (preset: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setDateRangeFilter(null, null);
    } else if (preset === 'today') {
      setDateRangeFilter(todayStr, todayStr);
    } else if (preset === '7d') {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      setDateRangeFilter(start.toISOString().split('T')[0], todayStr);
    } else if (preset === '30d') {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      setDateRangeFilter(start.toISOString().split('T')[0], todayStr);
    } else if (preset === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateRangeFilter(start.toISOString().split('T')[0], todayStr);
    } else if (preset === 'quarter') {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), currentQuarter * 3, 1);
      setDateRangeFilter(start.toISOString().split('T')[0], todayStr);
    } else if (preset === 'ytd') {
      const start = new Date(today.getFullYear(), 0, 1);
      setDateRangeFilter(start.toISOString().split('T')[0], todayStr);
    }
    setOpenDropdown(null);
    if (onFilterChange) onFilterChange();
  };

  const handleApplyCustomDate = () => {
    if (customStart || customEnd) {
      setDateRangeFilter(customStart || null, customEnd || null);
    }
    setOpenDropdown(null);
    if (onFilterChange) onFilterChange();
  };

  // Categorical Option Selection (supports Single and Multi select)
  const handleToggleCatOption = (val: string) => {
    if (!selectedCatCol) return;
    const currentSelected = filters.categoricalFilters[selectedCatCol] || [];

    if (catSelectionMode === 'single') {
      if (currentSelected.includes(val)) {
        setCategoricalFilter(selectedCatCol, []);
      } else {
        setCategoricalFilter(selectedCatCol, [val]);
      }
    } else {
      const nextSelected = currentSelected.includes(val)
        ? currentSelected.filter((v) => v !== val)
        : [...currentSelected, val];
      setCategoricalFilter(selectedCatCol, nextSelected);
    }
    if (onFilterChange) onFilterChange();
  };

  const handleSelectAllCatOptions = () => {
    if (!selectedCatCol || !activeDataset) return;
    const allVals = extractFilterOptions(activeDataset.data, selectedCatCol).map((o) => o.value);
    setCategoricalFilter(selectedCatCol, allVals);
    if (onFilterChange) onFilterChange();
  };

  const handleClearCatOptions = () => {
    if (!selectedCatCol) return;
    setCategoricalFilter(selectedCatCol, []);
    if (onFilterChange) onFilterChange();
  };

  // Numeric Apply
  const handleApplyNumericRange = () => {
    if (!selectedNumCol) return;
    const minVal = minNumInput.trim() !== '' ? Number(minNumInput) : undefined;
    const maxVal = maxNumInput.trim() !== '' ? Number(maxNumInput) : undefined;
    setNumericRangeFilter(selectedNumCol, minVal, maxVal);
    setOpenDropdown(null);
    if (onFilterChange) onFilterChange();
  };

  const handleClearNumericRange = () => {
    if (!selectedNumCol) return;
    setNumericRangeFilter(selectedNumCol, undefined, undefined);
    setMinNumInput('');
    setMaxNumInput('');
    setOpenDropdown(null);
    if (onFilterChange) onFilterChange();
  };

  // Saved Filter Preset Handler
  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    saveCurrentFilterCombination(newPresetName.trim());
    setNewPresetName('');
  };

  if (!activeDataset) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`bg-white border border-slate-200/90 rounded-2xl shadow-sm p-3.5 transition-all ${className}`}
    >
      {/* Upper Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Global Live Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search across records..."
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-800 placeholder-slate-400"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 2. Date Range Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-colors ${
                filters.dateRange.start || filters.dateRange.end
                  ? 'border-purple-300 bg-purple-50 text-purple-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>
                {filters.dateRange.start || filters.dateRange.end
                  ? `${filters.dateRange.start || 'Start'} to ${filters.dateRange.end || 'End'}`
                  : 'Date Range'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Date Popover */}
            {openDropdown === 'date' && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 animate-slide-up">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Preset Horizons</p>
                <div className="grid grid-cols-2 gap-1 mb-3">
                  {[
                    { label: 'All Time', id: 'all' },
                    { label: 'Today', id: 'today' },
                    { label: 'Last 7 Days', id: '7d' },
                    { label: 'Last 30 Days', id: '30d' },
                    { label: 'This Month', id: 'month' },
                    { label: 'This Quarter', id: 'quarter' },
                    { label: 'Year to Date', id: 'ytd' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleApplyDatePreset(p.id)}
                      className="px-2 py-1 text-xs text-left rounded-lg text-slate-700 hover:bg-purple-50 hover:text-purple-700 font-medium transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Custom Range</p>
                  <div className="flex flex-col gap-1.5 mb-2">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-700"
                    />
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-700"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setDateRangeFilter(null, null);
                        setCustomStart('');
                        setCustomEnd('');
                        setOpenDropdown(null);
                      }}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleApplyCustomDate}
                      className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Categorical Filters Dropdown */}
          {categoricalColumns.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-colors ${
                  Object.keys(filters.categoricalFilters).length > 0
                    ? 'border-purple-300 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-purple-600" />
                <span>Categories</span>
                {Object.keys(filters.categoricalFilters).length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {Object.keys(filters.categoricalFilters).length}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Categorical Popover */}
              {openDropdown === 'category' && (
                <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 animate-slide-up">
                  {/* Select Target Column & Mode */}
                  <div className="mb-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Target Column
                      </label>
                      {/* Single vs Multi Select Toggle */}
                      <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setCatSelectionMode('multi')}
                          className={`px-1.5 py-0.5 rounded font-semibold transition-all ${
                            catSelectionMode === 'multi' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Multi
                        </button>
                        <button
                          type="button"
                          onClick={() => setCatSelectionMode('single')}
                          className={`px-1.5 py-0.5 rounded font-semibold transition-all ${
                            catSelectionMode === 'single' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Single
                        </button>
                      </div>
                    </div>
                    <select
                      value={selectedCatCol}
                      onChange={(e) => {
                        setSelectedCatCol(e.target.value);
                        setCatSearchTerm('');
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none"
                    >
                      {categoricalColumns.map((col) => (
                        <option key={col} value={col}>
                          {col.replace(/[_\-]/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search options */}
                  <div className="relative mb-2">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter values..."
                      value={catSearchTerm}
                      onChange={(e) => setCatSearchTerm(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                    />
                  </div>

                  {/* Options List */}
                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1 mb-2.5">
                    {catOptions.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-3 italic">No matching values</p>
                    ) : (
                      catOptions.map((opt) => {
                        const isChecked = (filters.categoricalFilters[selectedCatCol] || []).includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleToggleCatOption(opt.value)}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                              isChecked
                                ? 'bg-purple-50 text-purple-900 font-semibold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? 'bg-purple-600 border-purple-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span className="truncate max-w-[150px]">{opt.value}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">({opt.count})</span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                    <div className="flex gap-2">
                      <button
                        onClick={handleSelectAllCatOptions}
                        className="text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Select All
                      </button>
                      <button
                        onClick={handleClearCatOptions}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        Clear
                      </button>
                    </div>
                    <button
                      onClick={() => setOpenDropdown(null)}
                      className="px-2 py-0.5 bg-slate-900 text-white rounded text-xs font-medium"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Numeric Range Filter Dropdown */}
          {numericColumns.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'numeric' ? null : 'numeric')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-colors ${
                  Object.keys(filters.numericRanges).length > 0
                    ? 'border-purple-300 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                <span>Range</span>
                {Object.keys(filters.numericRanges).length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {Object.keys(filters.numericRanges).length}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Numeric Popover */}
              {openDropdown === 'numeric' && (
                <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 animate-slide-up">
                  <div className="mb-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Target Metric
                    </label>
                    <select
                      value={selectedNumCol}
                      onChange={(e) => setSelectedNumCol(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none"
                    >
                      {numericColumns.map((col) => (
                        <option key={col} value={col}>
                          {col.replace(/[_\-]/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Min Value</label>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minNumInput}
                        onChange={(e) => setMinNumInput(e.target.value)}
                        className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Max Value</label>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxNumInput}
                        onChange={(e) => setMaxNumInput(e.target.value)}
                        className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                    <button
                      onClick={handleClearNumericRange}
                      className="text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleApplyNumericRange}
                      className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700"
                    >
                      Apply Range
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Saved Filter Presets Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'saved' ? null : 'saved')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-colors ${
                savedFilterPresets.length > 0
                  ? 'border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-50'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
              <span>Saved Filters</span>
              {savedFilterPresets.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {savedFilterPresets.length}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Saved Filters Popover */}
            {openDropdown === 'saved' && (
              <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 animate-slide-up">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Saved Filter Presets
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{savedFilterPresets.length} saved</span>
                </div>

                {/* Presets List */}
                <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
                  {savedFilterPresets.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2.5 italic">
                      No saved filter combinations yet.
                    </p>
                  ) : (
                    savedFilterPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-purple-50/60 transition-colors group"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            applySavedFilterCombination(preset.id);
                            setOpenDropdown(null);
                            if (onFilterChange) onFilterChange();
                          }}
                          className="text-left text-xs font-semibold text-slate-800 hover:text-purple-700 flex-1 truncate pr-2"
                        >
                          {preset.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedFilterCombination(preset.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity"
                          title="Delete saved preset"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Save Current Filters Form */}
                <form onSubmit={handleSavePreset} className="border-t border-slate-100 pt-2.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Save Active View
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Q4 Europe Enterprise"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newPresetName.trim()}
                      className="px-2.5 py-1 bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Save
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right: Record Counter & Clear All */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800">
              {filteredCount.toLocaleString()} <span className="text-slate-400 font-normal">/ {totalCount.toLocaleString()} rows</span>
            </p>
            {hasActiveFilters && (
              <p className="text-[10px] text-purple-600 font-semibold">
                {Math.round((filteredCount / (totalCount || 1)) * 100)}% match
              </p>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              leftIcon={<RotateCcw className="w-3 h-3 text-slate-500" />}
              className="text-xs h-7 px-2.5"
            >
              Reset All
            </Button>
          )}
        </div>
      </div>

      {/* Lower Active Filter Chips Bar (Shown when any filters are active) */}
      {filterTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Active Filters ({activeCount}):
          </span>

          {filterTags.map((tag) => (
            <Badge
              key={tag.id}
              variant={tag.type === 'cross' ? 'brand' : 'purple'}
              size="sm"
              className="gap-1 pl-2 pr-1 font-normal"
            >
              <span className="font-semibold text-purple-900">{tag.category}:</span>
              <span>{tag.value}</span>
              <button
                type="button"
                onClick={() => {
                  if (tag.type === 'cross') {
                    clearCrossFilter();
                  } else {
                    removeFilterTag(tag.id);
                  }
                  if (onFilterChange) onFilterChange();
                }}
                className="hover:bg-purple-200/80 rounded-full p-0.5 text-purple-700 transition-colors"
                title={`Remove ${tag.category} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          <button
            onClick={resetFilters}
            className="text-[11px] text-purple-600 hover:text-purple-800 font-semibold ml-1.5 underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
