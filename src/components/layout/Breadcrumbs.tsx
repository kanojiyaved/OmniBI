import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { SIDEBAR_ITEMS } from './CollapsibleSidebar';

export interface BreadcrumbsProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentPath, onNavigate }) => {
  const activeItem = SIDEBAR_ITEMS.find((item) => item.path === currentPath) || SIDEBAR_ITEMS[0];

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 select-none">
      <button
        onClick={() => onNavigate('/')}
        className="flex items-center gap-1 hover:text-slate-800 transition-colors"
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">OmniBI</span>
      </button>

      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

      <span className="font-semibold text-slate-800 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100">
        {activeItem.label}
      </span>
    </nav>
  );
};
