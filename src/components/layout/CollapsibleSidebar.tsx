import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Search, 
  Briefcase, 
  Megaphone, 
  BarChart3, 
  GitBranch, 
  Calendar, 
  Users, 
  Target, 
  Sparkles, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  BrainCircuit
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isAi?: boolean;
}

export const SIDEBAR_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', path: '/', icon: LayoutDashboard },
  { id: 'import', label: 'Data Import', path: '/import', icon: UploadCloud, badge: 'Universal' },
  { id: 'explorer', label: 'Data Explorer', path: '/explorer', icon: Search },
  { id: 'deals', label: 'Deal Management', path: '/deals', icon: Briefcase },
  { id: 'campaigns', label: 'Campaign Management', path: '/campaigns', icon: Megaphone },
  { id: 'reports', label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
  { id: 'pipeline', label: 'Sales Pipeline', path: '/pipeline', icon: GitBranch },
  { id: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar },
  { id: 'contacts', label: 'Contacts', path: '/contacts', icon: Users },
  { id: 'goals', label: 'Goals', path: '/goals', icon: Target },
  { id: 'ai-analyst', label: 'AI Analyst', path: '/ai-analyst', icon: Sparkles, isAi: true, badge: 'Copilot' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
];

export interface CollapsibleSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  currentPath,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 ease-in-out select-none ${
          isCollapsed ? 'w-18' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Branding Section */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20 shrink-0">
                <BrainCircuit className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">
                    OmniBI
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                    Enterprise SaaS
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = currentPath === item.path;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.path);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-purple-600'
                        : item.isAi
                        ? 'text-purple-500 animate-pulse'
                        : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            item.isAi
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Active Indicator Strip */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-purple-600 rounded-r-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Workspace Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          {!isCollapsed ? (
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
                <div className="truncate text-[11px]">
                  <p className="font-bold text-slate-800 truncate">Acme Analytics Corp</p>
                  <p className="text-slate-400 text-[10px]">Enterprise Tier</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Active Connection" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
