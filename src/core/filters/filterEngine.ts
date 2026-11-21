import { Dataset, GlobalFilterState } from '../../types';

export interface FilterTagItem {
  id: string;
  category: string;
  value: string;
  type: 'search' | 'date' | 'category' | 'numeric' | 'cross';
  column?: string;
  rawKey?: string;
}

/**
 * Pure engine that filters dataset records based on active GlobalFilterState.
 */
export const applyGlobalFilters = (
  rows: Record<string, any>[],
  filters: GlobalFilterState,
  dataset?: Dataset
): Record<string, any>[] => {
  if (!rows || rows.length === 0) return [];
  if (!filters) return rows;

  // Identify date column if dateRange filter is active
  let dateCol: string | undefined;
  if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
    if (dataset) {
      dateCol = dataset.columns.find(
        (c) =>
          dataset.semanticMappings[c]?.role === 'timestamp' ||
          dataset.profiles[c]?.inferredType === 'date'
      );
    }
    if (!dateCol && rows.length > 0) {
      dateCol = Object.keys(rows[0]).find((k) => /date|time|dt/i.test(k));
    }
  }

  // Helper to parse date to comparable millisecond timestamp
  const parseDateMs = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    if (val instanceof Date) return val.getTime();
    const str = String(val).trim();
    // For YYYY-MM-DD or standard strings
    const ms = Date.parse(str);
    if (!isNaN(ms)) return ms;
    // Alternative parsing for DD/MM/YYYY or similar if needed
    const parts = str.split(/[-/]/);
    if (parts.length === 3) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    return null;
  };

  const startTimeMs = filters.dateRange?.start ? parseDateMs(filters.dateRange.start) : null;
  // If end date is YYYY-MM-DD, set to end of that day (23:59:59.999)
  let endTimeMs = filters.dateRange?.end ? parseDateMs(filters.dateRange.end) : null;
  if (endTimeMs !== null && filters.dateRange?.end && !filters.dateRange.end.includes('T')) {
    // End of day offset
    endTimeMs += 24 * 60 * 60 * 1000 - 1;
  }

  return rows.filter((row) => {
    // 1. Search Query filter (matches any string/numeric cell)
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchesSearch = Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      });
      if (!matchesSearch) return false;
    }

    // 2. Date Range filter
    if (dateCol && (startTimeMs !== null || endTimeMs !== null)) {
      const val = row[dateCol];
      const rowTime = parseDateMs(val);
      if (rowTime !== null) {
        if (startTimeMs !== null && rowTime < startTimeMs) return false;
        if (endTimeMs !== null && rowTime > endTimeMs) return false;
      }
    }

    // 3. Categorical Filters
    if (filters.categoricalFilters) {
      for (const [col, selectedVals] of Object.entries(filters.categoricalFilters)) {
        if (selectedVals && selectedVals.length > 0) {
          const cellVal = String(row[col] ?? '');
          if (!selectedVals.includes(cellVal)) {
            return false;
          }
        }
      }
    }

    // 4. Numeric Range Filters
    if (filters.numericRanges) {
      for (const [col, range] of Object.entries(filters.numericRanges)) {
        if (range) {
          const rawCell = row[col];
          const numVal = typeof rawCell === 'number'
            ? rawCell
            : Number(String(rawCell ?? '').replace(/[$€£¥,%\s]/g, ''));

          if (!isNaN(numVal)) {
            if (range.min !== undefined && numVal < range.min) return false;
            if (range.max !== undefined && numVal > range.max) return false;
          }
        }
      }
    }

    // 5. Active Cross-Filter
    if (filters.activeCrossFilter) {
      const { column, value } = filters.activeCrossFilter;
      const cellVal = row[column];
      if (cellVal === undefined || String(cellVal) !== String(value)) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Returns a shallow copy of a Dataset with filtered records and updated rowCount.
 */
export const getFilteredDataset = (
  dataset: Dataset,
  filters: GlobalFilterState
): Dataset => {
  if (!dataset) return dataset;
  if (!isFilterActive(filters)) return dataset;

  const filteredData = applyGlobalFilters(dataset.data, filters, dataset);
  return {
    ...dataset,
    data: filteredData,
    rowCount: filteredData.length,
  };
};

/**
 * Returns whether any filter condition is actively applied.
 */
export const isFilterActive = (filters: GlobalFilterState): boolean => {
  if (!filters) return false;
  if (filters.searchQuery && filters.searchQuery.trim() !== '') return true;
  if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) return true;
  if (filters.activeCrossFilter) return true;
  if (
    filters.categoricalFilters &&
    Object.values(filters.categoricalFilters).some((vals) => vals && vals.length > 0)
  ) {
    return true;
  }
  if (
    filters.numericRanges &&
    Object.values(filters.numericRanges).some((r) => r && (r.min !== undefined || r.max !== undefined))
  ) {
    return true;
  }
  return false;
};

/**
 * Calculates the total count of active filter dimensions.
 */
export const getActiveFilterCount = (filters: GlobalFilterState): number => {
  if (!filters) return 0;
  let count = 0;
  if (filters.searchQuery && filters.searchQuery.trim() !== '') count++;
  if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) count++;
  if (filters.activeCrossFilter) count++;
  if (filters.categoricalFilters) {
    for (const vals of Object.values(filters.categoricalFilters)) {
      if (vals && vals.length > 0) count++;
    }
  }
  if (filters.numericRanges) {
    for (const r of Object.values(filters.numericRanges)) {
      if (r && (r.min !== undefined || r.max !== undefined)) count++;
    }
  }
  return count;
};

/**
 * Generates human-readable tag items for active filters (used in FilterComponent / GlobalFilterBar chips).
 */
export const generateFilterTags = (filters: GlobalFilterState): FilterTagItem[] => {
  const tags: FilterTagItem[] = [];

  // Search query
  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    tags.push({
      id: 'search-query',
      category: 'Search',
      value: `"${filters.searchQuery.trim()}"`,
      type: 'search',
    });
  }

  // Cross-Filter
  if (filters.activeCrossFilter) {
    tags.push({
      id: `cross-${filters.activeCrossFilter.column}`,
      category: `🎯 ${filters.activeCrossFilter.column}`,
      value: String(filters.activeCrossFilter.value),
      type: 'cross',
      column: filters.activeCrossFilter.column,
    });
  }

  // Date range
  if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
    const startStr = filters.dateRange.start || 'Start';
    const endStr = filters.dateRange.end || 'End';
    tags.push({
      id: 'date-range',
      category: 'Date',
      value: `${startStr} to ${endStr}`,
      type: 'date',
    });
  }

  // Categorical filters
  if (filters.categoricalFilters) {
    for (const [col, vals] of Object.entries(filters.categoricalFilters)) {
      if (vals && vals.length > 0) {
        tags.push({
          id: `cat-${col}`,
          category: col,
          value: vals.length <= 2 ? vals.join(', ') : `${vals[0]}, ${vals[1]} +${vals.length - 2} more`,
          type: 'category',
          column: col,
        });
      }
    }
  }

  // Numeric ranges
  if (filters.numericRanges) {
    for (const [col, r] of Object.entries(filters.numericRanges)) {
      if (r && (r.min !== undefined || r.max !== undefined)) {
        let valDesc = '';
        if (r.min !== undefined && r.max !== undefined) {
          valDesc = `${r.min.toLocaleString()} – ${r.max.toLocaleString()}`;
        } else if (r.min !== undefined) {
          valDesc = `≥ ${r.min.toLocaleString()}`;
        } else if (r.max !== undefined) {
          valDesc = `≤ ${r.max.toLocaleString()}`;
        }
        tags.push({
          id: `num-${col}`,
          category: col,
          value: valDesc,
          type: 'numeric',
          column: col,
        });
      }
    }
  }

  return tags;
};

/**
 * Extracts distinct categorical options with frequency counts from a dataset column.
 */
export const extractFilterOptions = (
  rows: Record<string, any>[],
  column: string,
  maxOptions: number = 60
): { value: string; count: number }[] => {
  if (!rows || rows.length === 0 || !column) return [];

  const counts: Record<string, number> = {};
  for (const row of rows) {
    const rawVal = row[column];
    const val = rawVal === null || rawVal === undefined || String(rawVal).trim() === ''
      ? '(Empty)'
      : String(rawVal).trim();
    counts[val] = (counts[val] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxOptions);
};

/**
 * Computes min and max values for a numeric column across records.
 */
export const getNumericRangeExtrema = (
  rows: Record<string, any>[],
  column: string
): { min: number; max: number } => {
  if (!rows || rows.length === 0 || !column) return { min: 0, max: 100 };

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    const rawVal = row[column];
    if (rawVal === null || rawVal === undefined) continue;
    const num = typeof rawVal === 'number'
      ? rawVal
      : Number(String(rawVal).replace(/[$€£¥,%\s]/g, ''));
    if (!isNaN(num)) {
      if (num < min) min = num;
      if (num > max) max = num;
    }
  }

  if (min === Number.POSITIVE_INFINITY || max === Number.NEGATIVE_INFINITY) {
    return { min: 0, max: 100 };
  }

  return { min: Math.floor(min), max: Math.ceil(max) };
};

/**
 * Computes min and max date strings for a date column across records.
 */
export const getDateRangeExtrema = (
  rows: Record<string, any>[],
  column: string
): { minDate: string; maxDate: string } => {
  if (!rows || rows.length === 0 || !column) return { minDate: '', maxDate: '' };

  let minTime = Number.POSITIVE_INFINITY;
  let maxTime = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    const rawVal = row[column];
    if (!rawVal) continue;
    const time = new Date(rawVal).getTime();
    if (!isNaN(time)) {
      if (time < minTime) minTime = time;
      if (time > maxTime) maxTime = time;
    }
  }

  if (minTime === Number.POSITIVE_INFINITY || maxTime === Number.NEGATIVE_INFINITY) {
    return { minDate: '', maxDate: '' };
  }

  return {
    minDate: new Date(minTime).toISOString().split('T')[0],
    maxDate: new Date(maxTime).toISOString().split('T')[0],
  };
};
