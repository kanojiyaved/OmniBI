import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  BrainCircuit, 
  Sparkles, 
  Sun, 
  Moon, 
  Database, 
  ChevronDown, 
  BarChart3, 
  Layers, 
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface NavbarProps {
  onOpenUploadModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenUploadModal }) => {
  const { 
    datasets, 
    activeDatasetId, 
    setActiveDatasetId, 
    activeTab, 
    setActiveTab, 
    isChatOpen, 
    setChatOpen,
    theme,
    toggleTheme 
  } = useAppStore();

  const activeDataset = datasets.find((d) => d.id === activeDatasetId);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Brand & Active Dataset Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                OmniBI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Dataset Switcher Dropdown */}
        {datasets.length > 0 && (
          <div className="relative flex items-center">
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="relative">
                <select
                  value={activeDatasetId || ''}
                  onChange={(e) => setActiveDatasetId(e.target.value)}
                  className="appearance-none bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl pl-8 pr-8 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all max-w-[200px] truncate"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-slate-100">
                      {d.name} ({d.rowCount.toLocaleString()} rows)
                    </option>
                  ))}
                </select>
                <Database className="w-3.5 h-3.5 text-brand-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {activeDataset && (
                <Badge variant="brand" size="sm" hasDot>
                  {activeDataset.detectedDomain.domainLabel}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60 shadow-inner">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Executive Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('profiler')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'profiler'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Data Profiler</span>
        </button>

        <button
          onClick={() => setActiveTab('datatable')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'datatable'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Raw Data & Schema</span>
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'insights'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Insights</span>
        </button>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {onOpenUploadModal && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenUploadModal}
            leftIcon={<Upload className="w-3.5 h-3.5 text-brand-400" />}
          >
            Upload Data
          </Button>
        )}

        <button
          onClick={() => setChatOpen(!isChatOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isChatOpen
              ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/25'
              : 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/30 text-purple-300 hover:border-purple-400/60'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${isChatOpen ? 'text-white' : 'animate-pulse'}`} />
          <span>Ask AI Analyst</span>
        </button>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>
      </div>
    </header>
  );
};
