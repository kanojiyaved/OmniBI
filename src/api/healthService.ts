import { ApiService, BackendHealthResponse, SystemTelemetryResponse } from './client';

export interface ConnectionStatus {
  isOnline: boolean;
  isConnecting: boolean;
  health: BackendHealthResponse | null;
  telemetry: SystemTelemetryResponse | null;
  lastChecked: string | null;
  errorMessage: string | null;
}

export const checkBackendConnection = async (): Promise<ConnectionStatus> => {
  try {
    const [health, telemetry] = await Promise.all([
      ApiService.checkHealth(),
      ApiService.getSystemTelemetry(),
    ]);

    return {
      isOnline: true,
      isConnecting: false,
      health,
      telemetry,
      lastChecked: new Date().toISOString(),
      errorMessage: null,
    };
  } catch (err: any) {
    return {
      isOnline: false,
      isConnecting: false,
      health: null,
      telemetry: null,
      lastChecked: new Date().toISOString(),
      errorMessage: err?.message || 'Backend connection offline',
    };
  }
};
