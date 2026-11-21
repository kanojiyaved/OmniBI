import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { HardDrive, Layers, Zap, Server } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';
import { checkBackendConnection, ConnectionStatus } from '../../api/healthService';

export const StatusBar: React.FC = () => {
  const { datasets, activeDatasetId, isLoading } = useAppStore();
  const activeDataset = datasets.find((d) => d.id === activeDatasetId);

  const [backendStatus, setBackendStatus] = useState<ConnectionStatus>({
    isOnline: false,
    isConnecting: true,
    health: null,
    telemetry: null,
    lastChecked: null,
    errorMessage: null,
  });

  useEffect(() => {
    let isMounted = true;
    const probe = async () => {
      const res = await checkBackendConnection();
      if (isMounted) {
        setBackendStatus(res);
      }
    };
    probe();
    const interval = setInterval(probe, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="h-7 border-t border-slate-200 bg-white/90 backdrop-blur px-4 flex items-center justify-between text-[11px] text-slate-500 select-none z-30 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
          <span className="font-semibold text-slate-700">
            {isLoading ? 'Processing Pipeline...' : 'SaaS Engine Ready'}
          </span>
        </div>

        {/* Backend API Connection Indicator */}
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1.5">
          <Server className={`w-3 h-3 ${backendStatus.isOnline ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className={backendStatus.isOnline ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
            {backendStatus.isOnline 
              ? `FastAPI Analytics Core ${backendStatus.health?.python_version ? `(Py ${backendStatus.health.python_version})` : ''}`
              : 'Backend Standby (Client-Mode)'}
          </span>
        </div>

        {activeDataset && (
          <>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <Layers className="w-3 h-3 text-purple-600" />
              <span>{activeDataset.rowCount.toLocaleString()} rows</span>
            </span>
            <span className="text-slate-300">|</span>
            <span>{activeDataset.columnCount} columns</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-400" />
              <span>{formatFileSize(activeDataset.fileSize)}</span>
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:flex items-center gap-1 text-slate-500">
          <Zap className="w-3 h-3 text-purple-600" />
          <span>Pandas/NumPy Compatible</span>
        </span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span className="font-mono text-[10px] text-slate-500 font-medium">
          {datasets.length} Dataset{datasets.length === 1 ? '' : 's'} Mounted
        </span>
      </div>
    </div>
  );
};
