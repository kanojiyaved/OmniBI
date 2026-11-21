import React from 'react';
import { TrendingUp, TrendingDown, HelpCircle, LucideIcon, DollarSign, Users, ShieldCheck, Activity } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  Users,
  TrendingUp,
  ShieldCheck,
  Activity,
};

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  timeframe?: string;
  iconName?: string;
  tooltip?: string;
  sparklineData?: number[];
  progressPercent?: number;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  timeframe = 'vs. previous period',
  iconName = 'TrendingUp',
  tooltip,
  sparklineData,
  progressPercent,
}) => {
  const IconComponent = iconMap[iconName] || TrendingUp;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          {title}
          {tooltip && (
            <span title={tooltip} className="cursor-help text-slate-400 hover:text-slate-600">
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          )}
        </span>
        <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
          <IconComponent className="w-4 h-4" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          {value}
        </div>

        {/* Change Indicator & Context */}
        {change && (
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{change}</span>
            </span>
            <span className="text-xs text-slate-400 truncate">{timeframe}</span>
          </div>
        )}
      </div>

      {/* Optional Mini Progress Bar */}
      {progressPercent !== undefined && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>Target Progress</span>
            <span className="font-semibold text-slate-700">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      )}

      {/* Optional Sparkline SVG */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-3 h-8 w-full">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 30">
            <path
              d={sparklineData
                .map((val, idx) => {
                  const x = (idx / (sparklineData.length - 1)) * 100;
                  const min = Math.min(...sparklineData);
                  const max = Math.max(...sparklineData);
                  const y = 25 - ((val - min) / (max - min || 1)) * 20;
                  return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
