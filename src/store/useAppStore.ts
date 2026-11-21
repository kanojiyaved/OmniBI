import { create } from 'zustand';
import { 
  Dataset, 
  GlobalFilterState, 
  SavedFilterCombination,
  KPIDefinition, 
  ChartSpecification, 
  ChatMessage, 
  CleaningHistoryItem,
  SemanticRole,
  BusinessDomain,
  UserProfile,
  UserPreferences,
  DatasetHistoryItem
} from '../types';
import { profileEntireDataset } from '../core/profiler/profilePipeline';
import { DOMAIN_ONTOLOGIES } from '../core/semantic/domainOntology';
import { generateDynamicKPIs } from '../core/metrics/kpiGenerator';
import { recommendChartsForDataset } from '../core/charts/chartRecommender';
import { applyGlobalFilters } from '../core/filters/filterEngine';
import { executeNaturalLanguageQuery } from '../core/ai/queryExecutor';
import { saveDatasetToStorage, deleteDatasetFromStorage } from '../core/storage/indexedDbStorage';
import { DEFAULT_USERS, canUserPerform, createDatasetHistoryRecord } from '../core/security/authManager';

interface AppState {
  // Datasets
  datasets: Dataset[];
  activeDatasetId: string | null;
  isLoading: boolean;
  error: string | null;

  // Active Dataset computed state
  kpis: KPIDefinition[];
  charts: ChartSpecification[];

  // Global Interactivity & Filtering
  filters: GlobalFilterState;
  savedFilterPresets: SavedFilterCombination[];

  // AI Chat & Insights
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  isAiAnalyzing: boolean;

  // UI Viewport / Active Tab
  activeTab: 'dashboard' | 'profiler' | 'datatable' | 'insights';
  theme: 'dark' | 'light';

  // Actions
  setDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  deleteDataset: (id: string) => void;
  replaceDataset: (id: string, updatedDataset: Dataset) => void;
  setActiveDatasetId: (id: string) => void;
  setKPIs: (kpis: KPIDefinition[]) => void;
  setCharts: (charts: ChartSpecification[]) => void;
  updateFilter: (updater: (prev: GlobalFilterState) => GlobalFilterState) => void;
  resetFilters: () => void;
  setCategoricalFilter: (column: string, values: string[]) => void;
  setNumericRangeFilter: (column: string, min?: number, max?: number) => void;
  setDateRangeFilter: (start: string | null, end: string | null) => void;
  setSearchQuery: (query: string) => void;
  setCrossFilter: (column: string, value: any) => void;
  clearCrossFilter: () => void;
  removeFilterTag: (filterId: string) => void;
  saveCurrentFilterCombination: (name: string) => void;
  applySavedFilterCombination: (id: string) => void;
  deleteSavedFilterCombination: (id: string) => void;
  getFilteredData: () => Record<string, any>[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  executeAiQuery: (query: string) => Promise<void>;
  setChatOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: 'dashboard' | 'profiler' | 'datatable' | 'insights') => void;
  toggleTheme: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;

  // Data Quality & Cleaning Actions
  applyCleaningAction: (
    datasetId: string,
    actionItem: Omit<CleaningHistoryItem, 'id' | 'timestamp' | 'previousRows'>,
    newRows: Record<string, any>[]
  ) => void;
  undoCleaningAction: (datasetId: string) => void;
  resetDatasetToRaw: (datasetId: string) => void;

  // Semantic Mapping & Domain Overrides
  overrideColumnRole: (datasetId: string, column: string, role: SemanticRole) => void;
  overrideBusinessDomain: (datasetId: string, domain: BusinessDomain) => void;
  refreshKPIs: (datasetId?: string) => void;
  refreshCharts: (datasetId?: string) => void;

  // Security, Access Control (RBAC) & Preferences
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  datasetHistory: DatasetHistoryItem[];
  userPreferences: UserPreferences;
  setUserPreferences: (prefs: Partial<UserPreferences>) => void;
}

const initialFilters: GlobalFilterState = {
  dateRange: { start: null, end: null },
  categoricalFilters: {},
  numericRanges: {},
  activeCrossFilter: null,
  searchQuery: '',
};

export const useAppStore = create<AppState>((set, get) => ({
  datasets: [],
  activeDatasetId: null,
  isLoading: false,
  error: null,

  kpis: [],
  charts: [],

  filters: initialFilters,
  savedFilterPresets: [],

  chatMessages: [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: 'Welcome to your Universal AI Data Analyst. Upload any CSV or Excel file to automatically generate dynamic executive KPIs, deep statistical profiling, and interactive visualizations. How can I assist you with your data today?',
      timestamp: new Date().toISOString(),
    },
  ],
  isChatOpen: false,
  isAiAnalyzing: false,

  activeTab: 'dashboard',
  theme: 'dark',

  currentUser: DEFAULT_USERS[0],
  setCurrentUser: (user) => set({ currentUser: user }),
  datasetHistory: [],

  userPreferences: {
    theme: 'dark',
    defaultExportFormat: 'csv',
    defaultCsvDelimiter: ',',
    preventFormulaInjection: true,
    maskPII: false,
    localProcessingOnly: true,
    cloudAiConsent: false,
    dataRetentionPolicy: '30_days',
  },
  setUserPreferences: (prefs) =>
    set((state) => {
      const updated = { ...state.userPreferences, ...prefs };
      try {
        localStorage.setItem('omnibi_user_prefs', JSON.stringify(updated));
      } catch {}
      return { userPreferences: updated };
    }),

  setDatasets: (datasets) => set({ datasets }),
  addDataset: (dataset) =>
    set((state) => {
      if (state.currentUser && !canUserPerform(state.currentUser, 'dataset:upload')) {
        return { error: `Access Denied: Role "${state.currentUser.role}" is not authorized to upload datasets.` };
      }

      const initialDataset: Dataset = {
        ...dataset,
        rawRows: dataset.rawRows || [...dataset.data],
        cleaningHistory: dataset.cleaningHistory || [],
        tenantId: dataset.tenantId || state.currentUser?.tenantId,
        ownerId: dataset.ownerId || state.currentUser?.id,
      };
      const computedKPIs = generateDynamicKPIs(initialDataset);
      const computedCharts = recommendChartsForDataset(initialDataset);

      // Asynchronously persist to IndexedDB
      saveDatasetToStorage(initialDataset).catch(() => {});

      const historyItem = createDatasetHistoryRecord(
        initialDataset.id,
        'uploaded',
        `Uploaded "${initialDataset.name}" (${initialDataset.rowCount} records)`,
        state.currentUser
      );

      return {
        datasets: [...state.datasets.filter((d) => d.id !== dataset.id), initialDataset],
        activeDatasetId: dataset.id,
        kpis: computedKPIs,
        charts: computedCharts,
        error: null,
        filters: initialFilters, // Reset filters to ensure zero cross-contamination
        datasetHistory: [historyItem, ...state.datasetHistory],
      };
    }),
  deleteDataset: (id) =>
    set((state) => {
      if (state.currentUser && !canUserPerform(state.currentUser, 'dataset:delete')) {
        return { error: `Access Denied: Role "${state.currentUser.role}" is not authorized to delete datasets.` };
      }

      const remaining = state.datasets.filter((d) => d.id !== id);
      const nextActiveId = state.activeDatasetId === id
        ? (remaining.length > 0 ? remaining[0].id : null)
        : state.activeDatasetId;

      // Remove from IndexedDB
      deleteDatasetFromStorage(id).catch(() => {});

      const historyItem = createDatasetHistoryRecord(
        id,
        'deleted',
        `Deleted dataset "${id}"`,
        state.currentUser
      );

      return {
        datasets: remaining,
        activeDatasetId: nextActiveId,
        filters: initialFilters,
        datasetHistory: [historyItem, ...state.datasetHistory],
      };
    }),
  replaceDataset: (id, updatedDataset) =>
    set((state) => {
      if (state.currentUser && !canUserPerform(state.currentUser, 'dataset:replace')) {
        return { error: `Access Denied: Role "${state.currentUser.role}" is not authorized to replace datasets.` };
      }

      saveDatasetToStorage(updatedDataset).catch(() => {});

      const historyItem = createDatasetHistoryRecord(
        updatedDataset.id,
        'replaced',
        `Replaced dataset "${updatedDataset.name}" (${updatedDataset.rowCount} records)`,
        state.currentUser
      );

      return {
        datasets: state.datasets.map((d) => (d.id === id ? updatedDataset : d)),
        activeDatasetId: updatedDataset.id,
        error: null,
        filters: initialFilters,
        datasetHistory: [historyItem, ...state.datasetHistory],
      };
    }),
  setActiveDatasetId: (id) =>
    set((state) => {
      const active = state.datasets.find((d) => d.id === id);
      const historyItem = createDatasetHistoryRecord(
        id,
        'switched',
        `Switched active view to "${active?.name || id}"`,
        state.currentUser
      );

      return {
        activeDatasetId: id,
        kpis: active ? generateDynamicKPIs(active) : state.kpis,
        charts: active ? recommendChartsForDataset(active) : state.charts,
        filters: initialFilters, // Reset filters on dataset switch
        datasetHistory: [historyItem, ...state.datasetHistory],
      };
    }),
  setKPIs: (kpis) => set({ kpis }),
  setCharts: (charts) => set({ charts }),
  updateFilter: (updater) =>
    set((state) => {
      const nextFilters = updater(state.filters);
      const active = state.datasets.find((d) => d.id === state.activeDatasetId);
      const filteredData = active ? applyGlobalFilters(active.data, nextFilters, active) : [];
      const updatedKPIs = active ? generateDynamicKPIs(active, filteredData) : state.kpis;

      return {
        filters: nextFilters,
        kpis: updatedKPIs,
      };
    }),
  resetFilters: () =>
    set((state) => {
      const active = state.datasets.find((d) => d.id === state.activeDatasetId);
      return {
        filters: initialFilters,
        kpis: active ? generateDynamicKPIs(active) : state.kpis,
      };
    }),
  setCategoricalFilter: (column, values) =>
    set((state) => {
      const nextFilters: GlobalFilterState = {
        ...state.filters,
        categoricalFilters: {
          ...state.filters.categoricalFilters,
          [column]: values,
        },
      };
      if (!values || values.length === 0) {
        delete nextFilters.categoricalFilters[column];
      }
      const active = state.datasets.find((d) => d.id === state.activeDatasetId);
      const filteredData = active ? applyGlobalFilters(active.data, nextFilters, active) : [];
      return {
        filters: nextFilters,
        kpis: active ? generateDynamicKPIs(active, filteredData) : state.kpis,
      };
    }),
  setNumericRangeFilter: (column, min, max) =>
    set((state) => {
      const nextFilters: GlobalFilterState = {
        ...state.filters,
        numericRanges: {
          ...state.filters.numericRanges,
          [column]: { min, max },
        },
      };
      if (min === undefined && max === undefined) {
        delete nextFilters.numericRanges[column];
      }
      const active = state.datasets.find((d) => d.id === state.activeDatasetId);
      const filteredData = active ? applyGlobalFilters(active.data, nextFilters, active) : [];
      return {
        filters: nextFilters,
        kpis: active ? generateDynamicKPIs(active, filteredData) : state.kpis,
      };
    }),
  setDateRangeFilter: (start, end) =>
    set((state) => {
      const nextFilters: GlobalFilterState = {
        ...state.filters,
        dateRange: { start, end },
      };
      const active = state.datasets.find((d) => d.id === state.activeDatasetId);
      const filteredData = active ? applyGlobalFilters(active.data, nextFilters, active) : [];
      return {
        filters: nextFilters,
        kpis: active ? generateDynamicKPIs(active, filteredData) : state.kpis,
      };
    }),
  setSearchQuery: (searchQuery) =>
    set((state) => {
      const nextFilters: GlobalFilterState = {
        ...state.filters,
        searchQuery,
      };
      const active = state.datasets.find((d) => d.id === state.activeDatasetId);
      const filteredData = active ? applyGlobalFilters(active.data, nextFilters, active) : [];
      return {
        filters: nextFilters,
        kpis: active ? generateDynamicKPIs(active, filteredData) : state.kpis,
      };
    }),
  setCrossFilter: (column, value) =>
    set((state) => {
      const isSame =
        state.filters.activeCrossFilter?.column === column &&
        String(state.filters.activeCrossFilter?.value) === String(value);

      const nextFilters: GlobalFilterState = {
        ...state.filters,
        activeCrossFilter: isSame ? null : { column, value },
      };
      const active = state.datasets.find((d) => d.id === state.activeDatasetId);
      const filteredData = active ? applyGlobalFilters(active.data, nextFilters, active) : [];
      return {
        filters: nextFilters,
        kpis: active ? generateDynamicKPIs(active, filteredData) : state.kpis,
      };
    }),
  clearCrossFilter: () =>
    set((state) => {
      const nextFilters: GlobalFilterState = {
        ...state.filters,
        activeCrossFilter: null,
      };
      const active = state.datasets.find((d) => d.id === state.activeDatasetId);
      const filteredData = active ? applyGlobalFilters(active.data, nextFilters, active) : [];
      return {
        filters: nextFilters,
        kpis: active ? generateDynamicKPIs(active, filteredData) : state.kpis,
      };
    }),
  removeFilterTag: (filterId) =>
    set((state) => {
      const nextFilters: GlobalFilterState = {
        ...state.filters,
        categoricalFilters: { ...state.filters.categoricalFilters },
        numericRanges: { ...state.filters.numericRanges },
      };

      if (filterId === 'search-query') {
        nextFilters.searchQuery = '';
      } else if (filterId === 'date-range') {
        nextFilters.dateRange = { start: null, end: null };
      } else if (filterId.startsWith('cross-')) {
        nextFilters.activeCrossFilter = null;
      } else if (filterId.startsWith('cat-')) {
        const col = filterId.replace('cat-', '');
        delete nextFilters.categoricalFilters[col];
      } else if (filterId.startsWith('num-')) {
        const col = filterId.replace('num-', '');
        delete nextFilters.numericRanges[col];
      }

      const active = state.datasets.find((d) => d.id === state.activeDatasetId);
      const filteredData = active ? applyGlobalFilters(active.data, nextFilters, active) : [];
      return {
        filters: nextFilters,
        kpis: active ? generateDynamicKPIs(active, filteredData) : state.kpis,
      };
    }),
  saveCurrentFilterCombination: (name: string) =>
    set((state) => {
      const newPreset: SavedFilterCombination = {
        id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim() || `Filter ${state.savedFilterPresets.length + 1}`,
        datasetId: state.activeDatasetId || undefined,
        filters: JSON.parse(JSON.stringify(state.filters)),
        createdAt: new Date().toISOString(),
      };
      const updated = [...state.savedFilterPresets, newPreset];
      try {
        localStorage.setItem('omnibi_saved_filters', JSON.stringify(updated));
      } catch {}
      return { savedFilterPresets: updated };
    }),
  applySavedFilterCombination: (id: string) =>
    set((state) => {
      const preset = state.savedFilterPresets.find((p) => p.id === id);
      if (!preset) return state;

      const active = state.datasets.find((d) => d.id === state.activeDatasetId);
      const filteredData = active ? applyGlobalFilters(active.data, preset.filters, active) : [];
      return {
        filters: JSON.parse(JSON.stringify(preset.filters)),
        kpis: active ? generateDynamicKPIs(active, filteredData) : state.kpis,
      };
    }),
  deleteSavedFilterCombination: (id: string) =>
    set((state) => {
      const updated = state.savedFilterPresets.filter((p) => p.id !== id);
      try {
        localStorage.setItem('omnibi_saved_filters', JSON.stringify(updated));
      } catch {}
      return { savedFilterPresets: updated };
    }),
  getFilteredData: (): Record<string, any>[] => {
    const state = get();
    const active = state.datasets.find((d) => d.id === state.activeDatasetId);
    if (!active) return [];
    return applyGlobalFilters(active.data, state.filters, active);
  },
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  clearChatMessages: () =>
    set({
      chatMessages: [
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: 'Chat session reset. Ask any question about your active dataset, request aggregations, rankings, breakdowns, or statistical correlations.',
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  executeAiQuery: async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMessage],
      isAiAnalyzing: true,
    }));

    try {
      const state = get();
      const active = state.datasets.find((d) => d.id === state.activeDatasetId) || state.datasets[0];
      const result = executeNaturalLanguageQuery(trimmed, active);

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.answerText,
        timestamp: new Date().toISOString(),
        insights: {
          summary: result.answerText,
          metricsHighlighted: result.metricsHighlighted,
          chartSuggestion: result.chartSuggestion,
          nextQuestions: result.nextQuestions,
        },
        pandasCodeRepresentation: result.pandasCode,
        sqlOrQueryRepresentation: result.sqlCode,
        tableData: result.tableData,
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, aiMessage],
        isAiAnalyzing: false,
      }));
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: `Error executing query analysis: ${err?.message || 'Unknown processing error'}`,
        timestamp: new Date().toISOString(),
      };
      set((state) => ({
        chatMessages: [...state.chatMessages, errorMessage],
        isAiAnalyzing: false,
      }));
    }
  },
  setChatOpen: (isChatOpen) => set({ isChatOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  applyCleaningAction: (datasetId, actionItem, newRows) =>
    set((state) => {
      const dataset = state.datasets.find((d) => d.id === datasetId);
      if (!dataset) return state;

      const historyItem: CleaningHistoryItem = {
        id: `clean-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        action: actionItem.action,
        columnName: actionItem.columnName,
        summary: actionItem.summary,
        affectedRows: actionItem.affectedRows,
        previousRows: [...dataset.data],
      };

      const { profiles, quality, detectedDomain, semanticMappings, understandingReport } = profileEntireDataset(
        newRows,
        dataset.columns,
        dataset.detectedDomain?.domain
      );

      const updatedDataset: Dataset = {
        ...dataset,
        data: newRows,
        rowCount: newRows.length,
        rawRows: dataset.rawRows || [...dataset.data],
        cleaningHistory: [...(dataset.cleaningHistory || []), historyItem],
        profiles,
        quality,
        detectedDomain,
        semanticMappings,
        understandingReport,
      };

      const computedKPIs = state.activeDatasetId === datasetId ? generateDynamicKPIs(updatedDataset) : state.kpis;
      const computedCharts = state.activeDatasetId === datasetId ? recommendChartsForDataset(updatedDataset) : state.charts;

      return {
        datasets: state.datasets.map((d) => (d.id === datasetId ? updatedDataset : d)),
        kpis: computedKPIs,
        charts: computedCharts,
      };
    }),

  undoCleaningAction: (datasetId) =>
    set((state) => {
      const dataset = state.datasets.find((d) => d.id === datasetId);
      if (!dataset || !dataset.cleaningHistory || dataset.cleaningHistory.length === 0) {
        return state;
      }

      const history = [...dataset.cleaningHistory];
      const lastItem = history.pop()!;
      const previousRows = lastItem.previousRows;

      const { profiles, quality, detectedDomain, semanticMappings, understandingReport } = profileEntireDataset(
        previousRows,
        dataset.columns,
        dataset.detectedDomain?.domain
      );

      const updatedDataset: Dataset = {
        ...dataset,
        data: previousRows,
        rowCount: previousRows.length,
        cleaningHistory: history,
        profiles,
        quality,
        detectedDomain,
        semanticMappings,
        understandingReport,
      };

      const computedKPIs = state.activeDatasetId === datasetId ? generateDynamicKPIs(updatedDataset) : state.kpis;
      const computedCharts = state.activeDatasetId === datasetId ? recommendChartsForDataset(updatedDataset) : state.charts;

      return {
        datasets: state.datasets.map((d) => (d.id === datasetId ? updatedDataset : d)),
        kpis: computedKPIs,
        charts: computedCharts,
      };
    }),

  resetDatasetToRaw: (datasetId) =>
    set((state) => {
      const dataset = state.datasets.find((d) => d.id === datasetId);
      if (!dataset || !dataset.rawRows) return state;

      const rawRows = [...dataset.rawRows];
      const { profiles, quality, detectedDomain, semanticMappings, understandingReport } = profileEntireDataset(
        rawRows,
        dataset.columns,
        dataset.detectedDomain?.domain
      );

      const updatedDataset: Dataset = {
        ...dataset,
        data: rawRows,
        rowCount: rawRows.length,
        cleaningHistory: [],
        profiles,
        quality,
        detectedDomain,
        semanticMappings,
        understandingReport,
      };

      const computedKPIs = state.activeDatasetId === datasetId ? generateDynamicKPIs(updatedDataset) : state.kpis;
      const computedCharts = state.activeDatasetId === datasetId ? recommendChartsForDataset(updatedDataset) : state.charts;

      return {
        datasets: state.datasets.map((d) => (d.id === datasetId ? updatedDataset : d)),
        kpis: computedKPIs,
        charts: computedCharts,
      };
    }),

  overrideColumnRole: (datasetId, column, role) =>
    set((state) => {
      const dataset = state.datasets.find((d) => d.id === datasetId);
      if (!dataset) return state;

      const updatedProfiles = { ...dataset.profiles };
      if (updatedProfiles[column]) {
        updatedProfiles[column] = { ...updatedProfiles[column], semanticRole: role };
      }

      const updatedMappings = {
        ...dataset.semanticMappings,
        [column]: {
          column,
          role,
          suggestedMeaning: `User manual override: ${role}`,
          confidence: 1.0,
          requiresConfirmation: false,
          confirmed: true,
          description: `User manual override assigned role: "${role}".`,
        },
      };

      const updatedDataset: Dataset = {
        ...dataset,
        profiles: updatedProfiles,
        semanticMappings: updatedMappings,
      };

      const computedKPIs = generateDynamicKPIs(updatedDataset);
      const computedCharts = recommendChartsForDataset(updatedDataset);

      return {
        datasets: state.datasets.map((d) => (d.id === datasetId ? updatedDataset : d)),
        kpis: state.activeDatasetId === datasetId ? computedKPIs : state.kpis,
        charts: state.activeDatasetId === datasetId ? computedCharts : state.charts,
      };
    }),

  overrideBusinessDomain: (datasetId, domain) =>
    set((state) => {
      const dataset = state.datasets.find((d) => d.id === datasetId);
      if (!dataset) return state;

      const domainLabel = DOMAIN_ONTOLOGIES[domain]?.label || domain.toUpperCase();
      const { profiles, quality, semanticMappings, understandingReport } = profileEntireDataset(
        dataset.data,
        dataset.columns,
        domain
      );

      const updatedDataset: Dataset = {
        ...dataset,
        detectedDomain: {
          domain,
          confidence: 1.0,
          reasoning: [`User manual domain override set to ${domainLabel}`],
          domainLabel,
        },
        profiles,
        quality,
        semanticMappings,
        understandingReport,
      };

      const computedKPIs = generateDynamicKPIs(updatedDataset);
      const computedCharts = recommendChartsForDataset(updatedDataset);

      return {
        datasets: state.datasets.map((d) => (d.id === datasetId ? updatedDataset : d)),
        kpis: state.activeDatasetId === datasetId ? computedKPIs : state.kpis,
        charts: state.activeDatasetId === datasetId ? computedCharts : state.charts,
      };
    }),

  refreshKPIs: (datasetId) =>
    set((state) => {
      const targetId = datasetId || state.activeDatasetId;
      if (!targetId) return state;
      const dataset = state.datasets.find((d) => d.id === targetId);
      if (!dataset) return state;

      return {
        kpis: generateDynamicKPIs(dataset),
      };
    }),

  refreshCharts: (datasetId) =>
    set((state) => {
      const targetId = datasetId || state.activeDatasetId;
      if (!targetId) return state;
      const dataset = state.datasets.find((d) => d.id === targetId);
      if (!dataset) return state;

      return {
        charts: recommendChartsForDataset(dataset),
      };
    }),
}));
