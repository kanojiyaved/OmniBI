import React, { useState } from 'react';
import { Menu, Search, Sparkles, Command, Download } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { NotificationDropdown } from './NotificationDropdown';
import { UserProfileDropdown } from './UserProfileDropdown';
import { GlobalSearchModal } from './GlobalSearchModal';
import { DatePicker } from '../ui/DatePicker';
import { ExportModal } from '../export/ExportModal';
import { useAppStore } from '../../store/useAppStore';

export interface TopNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenMobileMenu: () => void;
  onOpenAiAnalyst?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentPath,
  onNavigate,
  onOpenMobileMenu,
  onOpenAiAnalyst,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const { setDateRangeFilter, activeDatasetId } = useAppStore();

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors shadow-xs">
        {/* Left Side: Mobile Menu + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Breadcrumbs currentPath={currentPath} onNavigate={onNavigate} />
        </div>

        {/* Center / Search Trigger */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs text-slate-500 transition-colors w-64 lg:w-80 justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search analytics, metrics, deals...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-mono shadow-xs">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Right Side: Quick Filters + AI trigger + Export + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <DatePicker
            className="hidden sm:inline-block"
            onChange={(range) => setDateRangeFilter(range.startDate, range.endDate)}
          />

          {activeDatasetId && (
            <button
              onClick={() => setIsExportOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
              title="Export Analytics & Records"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          )}

          {onOpenAiAnalyst && (
            <button
              onClick={onOpenAiAnalyst}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          )}

          <NotificationDropdown />

          <div className="h-6 w-px bg-slate-200 mx-0.5" />

          <UserProfileDropdown />
        </div>
      </header>

      {/* Global Command/Search Dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPath={onNavigate}
      />

      {/* Global Export Dialog */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </>
  );
};
