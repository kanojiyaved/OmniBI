import React from 'react';

export interface ProgressIndicatorProps {
  value: number; // 0 to 100
  label?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  label,
  variant = 'primary',
  size = 'md',
  showPercentage = true,
}) => {
  const clamped = Math.max(0, Math.min(100, value));

  const variantGradients = {
    primary: 'from-purple-500 to-indigo-600',
    success: 'from-emerald-500 to-teal-500',
    warning: 'from-amber-500 to-orange-500',
    danger: 'from-rose-500 to-red-600',
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-slate-600">{label}</span>}
          {showPercentage && <span className="font-bold text-slate-900 font-mono">{clamped.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClasses[size]} p-0.5 border border-slate-200/50`}>
        <div
          className={`h-full bg-gradient-to-r ${variantGradients[variant]} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
