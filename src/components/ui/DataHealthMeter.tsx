import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

export interface DataHealthMeterProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const DataHealthMeter: React.FC<DataHealthMeterProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let progressColor = 'from-emerald-500 to-teal-400';
  let status = 'Excellent Quality';
  let Icon = ShieldCheck;

  if (clampedScore < 50) {
    colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    progressColor = 'from-rose-500 to-orange-400';
    status = 'Critical Quality Issues';
    Icon = ShieldAlert;
  } else if (clampedScore < 80) {
    colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    progressColor = 'from-amber-500 to-yellow-400';
    status = 'Moderate Quality';
    Icon = AlertTriangle;
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Icon className={`w-3.5 h-3.5 ${colorClass.split(' ')[0]}`} />
            <span>Data Health Score</span>
          </div>
          <span className={`font-bold font-mono px-1.5 py-0.5 rounded border ${colorClass}`}>
            {clampedScore}% • {status}
          </span>
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden ${heightClasses[size]} border border-slate-700/50`}>
        <div
          className={`h-full bg-gradient-to-r ${progressColor} transition-all duration-500 rounded-full`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
};
