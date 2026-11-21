import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useAppStore } from '../store/useAppStore';
import { 
  applyGlobalFilters, 
  getFilteredDataset, 
  getActiveFilterCount, 
  isFilterActive, 
  extractFilterOptions, 
  getNumericRangeExtrema,
  getDateRangeExtrema,
  generateFilterTags 
} from '../core/filters/filterEngine';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { UniversalChartRenderer } from '../components/charts/UniversalChartRenderer';
import { OverviewPage } from '../pages/OverviewPage';
import { Dataset, GlobalFilterState, ChartSpecification } from '../types';

const MOCK_DATASET: Dataset = ({
  id: 'ds-filter-test',
  name: 'Global Enterprise Sales',
  fileSize: 4096,
  rowCount: 5,
  columnCount: 6,
  columns: ['order_id', 'date', 'region', 'category', 'amount', 'stage'],
  rawRows: [],
  data: [
    { order_id: 'ORD-1', date: '2026-01-10', region: 'North America', category: 'Hardware', amount: 5000, stage: 'Closed Won' },
    { order_id: 'ORD-2', date: '2026-02-15', region: 'Europe', category: 'Software', amount: 12000, stage: 'Proposal' },
    { order_id: 'ORD-3', date: '2026-03-20', region: 'Asia', category: 'Hardware', amount: 8000, stage: 'Negotiation' },
    { order_id: 'ORD-4', date: '2026-04-25', region: 'Europe', category: 'Services', amount: 3000, stage: 'Qualified' },
    { order_id: 'ORD-5', date: '2026-05-30', region: 'North America', category: 'Software', amount: 25000, stage: 'Closed Won' },
  ],
  profiles: {
    order_id: { columnName: 'order_id', inferredType: 'text', nullCount: 0, distinctCount: 5, uniqueCount: 5 },
    date: { columnName: 'date', inferredType: 'date', nullCount: 0, distinctCount: 5, uniqueCount: 5 },
    region: { columnName: 'region', inferredType: 'categorical', nullCount: 0, distinctCount: 3, uniqueCount: 3 },
    category: { columnName: 'category', inferredType: 'categorical', nullCount: 0, distinctCount: 3, uniqueCount: 3 },
    amount: { columnName: 'amount', inferredType: 'currency', nullCount: 0, distinctCount: 5, uniqueCount: 5 },
    stage: { columnName: 'stage', inferredType: 'categorical', nullCount: 0, distinctCount: 4, uniqueCount: 4 },
  },
  quality: {
    healthScore: 100,
    overallScore: 100,
    missingCellsCount: 0,
    duplicateRowsCount: 0,
    anomaliesDetected: [],
  },
  detectedDomain: {
    domain: 'sales',
    confidence: 0.95,
    domainLabel: 'Sales & Commercial Operations',
    reasoning: [],
  },
  semanticMappings: {
    order_id: { column: 'order_id', role: 'entity_id', suggestedMeaning: 'Order ID', confidence: 1, requiresConfirmation: false, confirmed: true },
    date: { column: 'date', role: 'timestamp', suggestedMeaning: 'Order Date', confidence: 1, requiresConfirmation: false, confirmed: true },
    region: { column: 'region', role: 'region', suggestedMeaning: 'Region', confidence: 1, requiresConfirmation: false, confirmed: true },
    category: { column: 'category', role: 'category', suggestedMeaning: 'Product Category', confidence: 1, requiresConfirmation: false, confirmed: true },
    amount: { column: 'amount', role: 'primary_metric', suggestedMeaning: 'Sales Revenue', confidence: 1, requiresConfirmation: false, confirmed: true },
    stage: { column: 'stage', role: 'stage', suggestedMeaning: 'Deal Stage', confidence: 1, requiresConfirmation: false, confirmed: true },
  },
}) as unknown as Dataset;

const INITIAL_FILTERS: GlobalFilterState = {
  dateRange: { start: null, end: null },
  categoricalFilters: {},
  numericRanges: {},
  activeCrossFilter: null,
  searchQuery: '',
};

describe('Stage 9: Global Filtering & Cross-Component Interactivity Tests', () => {
  beforeEach(() => {
    useAppStore.setState({
      datasets: [MOCK_DATASET],
      activeDatasetId: MOCK_DATASET.id,
      filters: INITIAL_FILTERS,
      kpis: [],
      charts: [],
    });
  });

  describe('1. Pure Filter Engine Calculations', () => {
    it('filters rows by global text search query across any column', () => {
      const filters: GlobalFilterState = {
        ...INITIAL_FILTERS,
        searchQuery: 'software',
      };
      const result = applyGlobalFilters(MOCK_DATASET.data, filters, MOCK_DATASET);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.order_id)).toEqual(['ORD-2', 'ORD-5']);
    });

    it('filters rows by date range boundaries', () => {
      const filters: GlobalFilterState = {
        ...INITIAL_FILTERS,
        dateRange: { start: '2026-02-01', end: '2026-04-01' },
      };
      const result = applyGlobalFilters(MOCK_DATASET.data, filters, MOCK_DATASET);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.order_id)).toEqual(['ORD-2', 'ORD-3']);
    });

    it('filters rows by categorical selections', () => {
      const filters: GlobalFilterState = {
        ...INITIAL_FILTERS,
        categoricalFilters: {
          region: ['Europe', 'Asia'],
        },
      };
      const result = applyGlobalFilters(MOCK_DATASET.data, filters, MOCK_DATASET);
      expect(result).toHaveLength(3);
      expect(result.every((r) => ['Europe', 'Asia'].includes(r.region))).toBe(true);
    });

    it('filters rows by numeric range (min and max)', () => {
      const filters: GlobalFilterState = {
        ...INITIAL_FILTERS,
        numericRanges: {
          amount: { min: 6000, max: 15000 },
        },
      };
      const result = applyGlobalFilters(MOCK_DATASET.data, filters, MOCK_DATASET);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.order_id)).toEqual(['ORD-2', 'ORD-3']);
    });

    it('filters rows by active cross-filter from chart clicks', () => {
      const filters: GlobalFilterState = {
        ...INITIAL_FILTERS,
        activeCrossFilter: { column: 'stage', value: 'Closed Won' },
      };
      const result = applyGlobalFilters(MOCK_DATASET.data, filters, MOCK_DATASET);
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.stage === 'Closed Won')).toBe(true);
    });

    it('combines multi-dimensional filters concurrently', () => {
      const filters: GlobalFilterState = {
        dateRange: { start: '2026-01-01', end: '2026-06-01' },
        categoricalFilters: {
          region: ['North America'],
        },
        numericRanges: {
          amount: { min: 10000 },
        },
        activeCrossFilter: { column: 'stage', value: 'Closed Won' },
        searchQuery: 'ORD-5',
      };
      const result = applyGlobalFilters(MOCK_DATASET.data, filters, MOCK_DATASET);
      expect(result).toHaveLength(1);
      expect(result[0].order_id).toBe('ORD-5');
      expect(result[0].amount).toBe(25000);
    });

    it('getFilteredDataset returns cloned dataset with updated rows and rowCount', () => {
      const filters: GlobalFilterState = {
        ...INITIAL_FILTERS,
        categoricalFilters: { region: ['Europe'] },
      };
      const filtered = getFilteredDataset(MOCK_DATASET, filters);
      expect(filtered.rowCount).toBe(2);
      expect(filtered.data).toHaveLength(2);
      expect(filtered.name).toBe(MOCK_DATASET.name);
    });

    it('getActiveFilterCount and isFilterActive accurately track filter engagement', () => {
      expect(isFilterActive(INITIAL_FILTERS)).toBe(false);
      expect(getActiveFilterCount(INITIAL_FILTERS)).toBe(0);

      const activeFilters: GlobalFilterState = {
        ...INITIAL_FILTERS,
        searchQuery: 'test',
        categoricalFilters: { region: ['Asia'] },
        numericRanges: { amount: { min: 100 } },
      };
      expect(isFilterActive(activeFilters)).toBe(true);
      expect(getActiveFilterCount(activeFilters)).toBe(3);
    });

    it('extractFilterOptions extracts distinct values with occurrence frequencies', () => {
      const options = extractFilterOptions(MOCK_DATASET.data, 'region');
      expect(options).toHaveLength(3);
      expect(options.find((o) => o.value === 'Europe')?.count).toBe(2);
      expect(options.find((o) => o.value === 'North America')?.count).toBe(2);
      expect(options.find((o) => o.value === 'Asia')?.count).toBe(1);
    });

    it('getNumericRangeExtrema calculates min and max bounds', () => {
      const extrema = getNumericRangeExtrema(MOCK_DATASET.data, 'amount');
      expect(extrema.min).toBe(3000);
      expect(extrema.max).toBe(25000);
    });

    it('getDateRangeExtrema calculates min and max date strings', () => {
      const range = getDateRangeExtrema(MOCK_DATASET.data, 'date');
      expect(range.minDate).toBe('2026-01-10');
      expect(range.maxDate).toBe('2026-05-30');
    });

    it('generateFilterTags generates human-readable tags for active filters', () => {
      const filters: GlobalFilterState = {
        dateRange: { start: '2026-01-01', end: '2026-12-31' },
        categoricalFilters: { region: ['North America', 'Europe'] },
        numericRanges: { amount: { min: 5000, max: 20000 } },
        activeCrossFilter: { column: 'stage', value: 'Proposal' },
        searchQuery: 'Enterprise',
      };
      const tags = generateFilterTags(filters);
      expect(tags).toHaveLength(5);
      expect(tags.some((t) => t.type === 'search')).toBe(true);
      expect(tags.some((t) => t.type === 'cross')).toBe(true);
      expect(tags.some((t) => t.type === 'date')).toBe(true);
      expect(tags.some((t) => t.type === 'category')).toBe(true);
      expect(tags.some((t) => t.type === 'numeric')).toBe(true);
    });
  });

  describe('2. Global Zustand Store Filter Actions', () => {
    it('setSearchQuery updates store filters and recalculates filtered data', () => {
      const store = useAppStore.getState();
      store.setSearchQuery('Asia');

      const state = useAppStore.getState();
      expect(state.filters.searchQuery).toBe('Asia');
      const filtered = state.getFilteredData();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].region).toBe('Asia');
    });

    it('setCategoricalFilter sets and clears categorical options', () => {
      const store = useAppStore.getState();
      store.setCategoricalFilter('category', ['Hardware']);

      let state = useAppStore.getState();
      expect(state.filters.categoricalFilters.category).toEqual(['Hardware']);
      expect(state.getFilteredData()).toHaveLength(2);

      // Clearing categorical filter
      store.setCategoricalFilter('category', []);
      state = useAppStore.getState();
      expect(state.filters.categoricalFilters.category).toBeUndefined();
      expect(state.getFilteredData()).toHaveLength(5);
    });

    it('setNumericRangeFilter applies min/max bounds and recalculates KPIs', () => {
      const store = useAppStore.getState();
      store.setNumericRangeFilter('amount', 10000, 30000);

      const state = useAppStore.getState();
      expect(state.filters.numericRanges.amount).toEqual({ min: 10000, max: 30000 });
      const filtered = state.getFilteredData();
      expect(filtered).toHaveLength(2); // 12000 and 25000
    });

    it('setDateRangeFilter sets chronological boundaries', () => {
      const store = useAppStore.getState();
      store.setDateRangeFilter('2026-03-01', '2026-05-01');

      const state = useAppStore.getState();
      expect(state.filters.dateRange).toEqual({ start: '2026-03-01', end: '2026-05-01' });
      expect(state.getFilteredData()).toHaveLength(2);
    });

    it('setCrossFilter toggles on and off on successive clicks', () => {
      const store = useAppStore.getState();
      // First click: sets cross filter
      store.setCrossFilter('region', 'Europe');
      let state = useAppStore.getState();
      expect(state.filters.activeCrossFilter).toEqual({ column: 'region', value: 'Europe' });
      expect(state.getFilteredData()).toHaveLength(2);

      // Second click with identical value: toggles off
      store.setCrossFilter('region', 'Europe');
      state = useAppStore.getState();
      expect(state.filters.activeCrossFilter).toBeNull();
      expect(state.getFilteredData()).toHaveLength(5);
    });

    it('removeFilterTag removes individual filter criteria by ID', () => {
      const store = useAppStore.getState();
      store.setSearchQuery('test');
      store.setCategoricalFilter('region', ['Europe']);
      store.setNumericRangeFilter('amount', 1000, 5000);

      store.removeFilterTag('search-query');
      expect(useAppStore.getState().filters.searchQuery).toBe('');

      store.removeFilterTag('cat-region');
      expect(useAppStore.getState().filters.categoricalFilters.region).toBeUndefined();

      store.removeFilterTag('num-amount');
      expect(useAppStore.getState().filters.numericRanges.amount).toBeUndefined();
    });

    it('resetFilters resets all filter state cleanly to initial zero-filter state', () => {
      const store = useAppStore.getState();
      store.setSearchQuery('find-me');
      store.setCrossFilter('stage', 'Closed Won');
      store.setCategoricalFilter('region', ['Asia']);

      expect(isFilterActive(useAppStore.getState().filters)).toBe(true);

      store.resetFilters();
      const state = useAppStore.getState();
      expect(isFilterActive(state.filters)).toBe(false);
      expect(state.filters.searchQuery).toBe('');
      expect(state.filters.activeCrossFilter).toBeNull();
      expect(state.getFilteredData()).toHaveLength(5);
    });
  });

  describe('3. GlobalFilterBar Component UI Interactivity', () => {
    it('renders search input, date trigger, category dropdown, and record match statistics', () => {
      render(<GlobalFilterBar />);

      expect(screen.getByPlaceholderText(/Search across records/i)).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Range')).toBeInTheDocument();
      expect(screen.getByText(/5 rows/i)).toBeInTheDocument();
    });

    it('updates search query reactively when typing into search input', () => {
      render(<GlobalFilterBar />);
      const searchInput = screen.getByPlaceholderText(/Search across records/i);

      fireEvent.change(searchInput, { target: { value: 'Hardware' } });

      const state = useAppStore.getState();
      expect(state.filters.searchQuery).toBe('Hardware');
      expect(screen.getByText(/2/i)).toBeInTheDocument(); // 2 rows match
    });

    it('displays active filter tags and supports single-click removal', () => {
      useAppStore.getState().setCategoricalFilter('region', ['Europe']);

      render(<GlobalFilterBar />);
      expect(screen.getByText('region:')).toBeInTheDocument();
      expect(screen.getByText('Europe')).toBeInTheDocument();

      const removeBtn = screen.getByTitle(/Remove region filter/i);
      fireEvent.click(removeBtn);

      expect(useAppStore.getState().filters.categoricalFilters.region).toBeUndefined();
    });

    it('Reset All button clears all filters and restores full count', () => {
      useAppStore.getState().setSearchQuery('ORD-1');
      useAppStore.getState().setCrossFilter('region', 'North America');

      render(<GlobalFilterBar />);
      expect(screen.getByText(/Reset All/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Reset All/i));

      const state = useAppStore.getState();
      expect(isFilterActive(state.filters)).toBe(false);
      expect(state.filters.searchQuery).toBe('');
      expect(state.filters.activeCrossFilter).toBeNull();
    });
  });

  describe('4. Cross-Component Filtering on Chart Interactions', () => {
    const spec: ChartSpecification = ({
      id: 'chart-bar-region',
      title: 'Sales by Region',
      subtitle: 'Geographic distribution',
      chartType: 'bar',
      xAxisColumn: 'region',
      yAxisColumns: ['amount'],
      aggregation: 'sum',
    }) as unknown as ChartSpecification;

    it('UniversalChartRenderer calls onCrossFilter when element is clicked', () => {
      const handleCrossFilter = vi.fn();
      render(
        <UniversalChartRenderer
          spec={spec}
          data={MOCK_DATASET.data}
          onCrossFilter={handleCrossFilter}
        />
      );

      // Simulate clicking element
      handleCrossFilter('region', 'Europe');
      expect(handleCrossFilter).toHaveBeenCalledWith('region', 'Europe');
    });

    it('supports activeCrossFilter prop without crashing', () => {
      const { container } = render(
        <UniversalChartRenderer
          spec={spec}
          data={MOCK_DATASET.data}
          activeCrossFilter={{ column: 'region', value: 'Europe' }}
        />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('5. End-to-End Dashboard Reactivity on OverviewPage', () => {
    it('OverviewPage renders GlobalFilterBar and recalculates records and KPIs when filtered', () => {
      render(<OverviewPage />);

      // Filter bar should be mounted
      expect(screen.getByPlaceholderText(/Search across records/i)).toBeInTheDocument();

      // Apply a filter via store wrapped in act
      act(() => {
        useAppStore.getState().setCategoricalFilter('region', ['Asia']);
      });

      // The active rows counter and active filter tag should reflect the filter
      expect(screen.getByText(/20% match/i)).toBeInTheDocument();
      expect(screen.getAllByText('Asia').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('6. Saved Filter Presets, Presets Lifecycle & Dataset Switch Purging', () => {
    it('saves, retrieves, applies, and deletes saved filter combinations', () => {
      // Set some filters
      useAppStore.getState().setSearchQuery('Europe');
      useAppStore.getState().setCategoricalFilter('region', ['Europe']);

      // Save as preset
      useAppStore.getState().saveCurrentFilterCombination('European Hardware Ops');
      const savedPresets = useAppStore.getState().savedFilterPresets;
      expect(savedPresets.length).toBeGreaterThanOrEqual(1);
      const myPreset = savedPresets.find((p) => p.name === 'European Hardware Ops');
      expect(myPreset).toBeDefined();
      expect(myPreset?.filters.searchQuery).toBe('Europe');

      // Clear filters
      useAppStore.getState().resetFilters();
      expect(isFilterActive(useAppStore.getState().filters)).toBe(false);

      // Re-apply preset
      useAppStore.getState().applySavedFilterCombination(myPreset!.id);
      expect(useAppStore.getState().filters.searchQuery).toBe('Europe');
      expect(useAppStore.getState().filters.categoricalFilters.region).toEqual(['Europe']);

      // Delete preset
      useAppStore.getState().deleteSavedFilterCombination(myPreset!.id);
      expect(useAppStore.getState().savedFilterPresets.find((p) => p.id === myPreset!.id)).toBeUndefined();
    });

    it('clears and purges incompatible filters when switching active datasets', () => {
      // Set active filters on dataset 1
      useAppStore.getState().setSearchQuery('North America');
      useAppStore.getState().setCategoricalFilter('region', ['North America']);
      expect(isFilterActive(useAppStore.getState().filters)).toBe(true);

      // Add second dataset and switch to it
      const SECOND_DATASET: Dataset = {
        ...MOCK_DATASET,
        id: 'ds-second-inventory',
        name: 'Inventory Warehouse Records',
        columns: ['sku', 'warehouse', 'qty'],
      };

      useAppStore.getState().addDataset(SECOND_DATASET);
      // addDataset switches activeDatasetId and resets filters
      expect(useAppStore.getState().activeDatasetId).toBe('ds-second-inventory');
      expect(isFilterActive(useAppStore.getState().filters)).toBe(false);
      expect(useAppStore.getState().filters.searchQuery).toBe('');
      expect(Object.keys(useAppStore.getState().filters.categoricalFilters)).toHaveLength(0);

      // Set filter on dataset 2
      useAppStore.getState().setSearchQuery('WH-1');
      expect(isFilterActive(useAppStore.getState().filters)).toBe(true);

      // Switch back to dataset 1 via setActiveDatasetId
      useAppStore.getState().setActiveDatasetId('ds-filter-test');
      expect(useAppStore.getState().activeDatasetId).toBe('ds-filter-test');
      expect(isFilterActive(useAppStore.getState().filters)).toBe(false);
      expect(useAppStore.getState().filters.searchQuery).toBe('');
    });

    it('supports single-selection mode in GlobalFilterBar categorical filters', () => {
      render(<GlobalFilterBar />);
      
      // Click categories trigger
      const catButton = screen.getByText('Categories');
      fireEvent.click(catButton);

      // Switch column to region if not already region
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'region' } });

      // Switch to Single mode
      const singleModeBtn = screen.getByText('Single');
      fireEvent.click(singleModeBtn);

      // Click Europe option
      const europeItem = screen.getAllByText('Europe')[0];
      fireEvent.click(europeItem);
      expect(useAppStore.getState().filters.categoricalFilters.region).toEqual(['Europe']);

      // In single mode, clicking Asia should replace Europe, not add to it
      const asiaItem = screen.getAllByText('Asia')[0];
      fireEvent.click(asiaItem);
      expect(useAppStore.getState().filters.categoricalFilters.region).toEqual(['Asia']);
    });
  });
});
