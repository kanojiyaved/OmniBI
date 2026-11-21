import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService } from '../api/client';
import { checkBackendConnection } from '../api/healthService';

describe('Stage 0: Full-Stack Frontend-Backend Communication Service Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully fetches health check from FastAPI backend', async () => {
    const mockHealth = {
      status: 'healthy',
      service: 'OmniBI Platform - Analytics Core',
      version: '1.0.0',
      timestamp: '2026-11-21T05:30:00Z',
      python_version: '3.11.6',
      environment: 'development',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealth,
    });

    const res = await ApiService.checkHealth();
    expect(res.status).toBe('healthy');
    expect(res.service).toBe('OmniBI Platform - Analytics Core');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/health'),
      expect.any(Object)
    );
  });

  it('successfully fetches system telemetry (Pandas/NumPy) from backend', async () => {
    const mockTelemetry = {
      python_version: '3.11.6',
      pandas_version: '2.2.1',
      numpy_version: '1.26.4',
      backend_engine: 'FastAPI + Uvicorn Async Architecture',
      status: 'ready',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTelemetry,
    });

    const res = await ApiService.getSystemTelemetry();
    expect(res.pandas_version).toBe('2.2.1');
    expect(res.numpy_version).toBe('1.26.4');
  });

  it('handles backend offline state gracefully without crashing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const status = await checkBackendConnection();
    expect(status.isOnline).toBe(false);
    expect(status.health).toBeNull();
    expect(status.errorMessage).toContain('Connection refused');
  });
});
