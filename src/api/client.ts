/**
 * API Client for communication between React Frontend and FastAPI Backend
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface BackendHealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  python_version: string;
  environment: string;
}

export interface SystemTelemetryResponse {
  python_version: string;
  pandas_version: string;
  numpy_version: string;
  backend_engine: string;
  status: string;
}

export class ApiService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error [${response.status}]: ${response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      console.warn(`Backend API request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  /**
   * Check FastAPI Backend Health
   */
  static async checkHealth(): Promise<BackendHealthResponse> {
    return this.request<BackendHealthResponse>('/api/v1/health');
  }

  /**
   * Fetch Python runtime and Pandas/NumPy telemetry
   */
  static async getSystemTelemetry(): Promise<SystemTelemetryResponse> {
    return this.request<SystemTelemetryResponse>('/api/v1/health/system');
  }

  /**
   * Fetch Supported Semantic Business Domains
   */
  static async getSupportedDomains(): Promise<{ domains: { id: string; name: string; confidence_threshold: number }[] }> {
    return this.request('/api/v1/semantic/domains');
  }
}
