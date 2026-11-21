import { describe, it, expect } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import { formatNumber, formatCurrency, formatPercentage } from '../utils/formatters';
import { getChartColor, PALETTES } from '../utils/colors';

describe('Stage 0: Architecture and System Initialization', () => {
  it('initializes the Zustand application store with correct defaults', () => {
    const state = useAppStore.getState();
    expect(state.datasets).toEqual([]);
    expect(state.activeDatasetId).toBeNull();
    expect(state.kpis).toEqual([]);
    expect(state.charts).toEqual([]);
    expect(state.activeTab).toBe('dashboard');
    expect(state.theme).toBe('dark');
    expect(state.filters.searchQuery).toBe('');
    expect(state.chatMessages.length).toBeGreaterThan(0);
  });

  it('correctly handles store actions', () => {
    const { setActiveTab, setChatOpen, addChatMessage } = useAppStore.getState();
    
    setActiveTab('profiler');
    expect(useAppStore.getState().activeTab).toBe('profiler');

    setChatOpen(true);
    expect(useAppStore.getState().isChatOpen).toBe(true);

    addChatMessage({
      id: 'test-1',
      role: 'user',
      content: 'Hello Data Analyst',
      timestamp: '2026-11-21T10:00:00Z',
    });
    const messages = useAppStore.getState().chatMessages;
    expect(messages.some(m => m.id === 'test-1')).toBe(true);
  });

  it('formats numbers, currencies, and percentages deterministically', () => {
    expect(formatNumber(12345.678)).toBe('12,345.68');
    expect(formatNumber(null)).toBe('N/A');
    expect(formatCurrency(1500.5)).toBe('$1,501');
    expect(formatCurrency(24.5)).toBe('$24.50');
    expect(formatPercentage(15.23, true)).toBe('+15.2%');
    expect(formatPercentage(-5.5, true)).toBe('-5.5%');
  });

  it('returns valid colors from visual design palettes', () => {
    expect(getChartColor(0, 'vibrant')).toBe(PALETTES.vibrant[0]);
    expect(getChartColor(7, 'vibrant')).toBe(PALETTES.vibrant[0]); // Wrap-around check
    expect(PALETTES.ocean.length).toBeGreaterThan(0);
  });
});
