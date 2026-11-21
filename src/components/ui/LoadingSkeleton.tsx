import React from 'react';

export interface LoadingSkeletonProps {
  variant?: 'card' | 'table-row' | 'chart' | 'text';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  count = 1,
}) => {
  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {items.map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 animate-pulse flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-slate-200 rounded w-24" />
              <div className="w-8 h-8 rounded-xl bg-slate-200" />
            </div>
            <div className="h-7 bg-slate-200 rounded w-32 mt-2" />
            <div className="h-3 bg-slate-100 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className="p-5 rounded-2xl bg-white border border-slate-200 animate-pulse w-full h-80 flex flex-col gap-4">
        <div className="h-4 bg-slate-200 rounded w-48" />
        <div className="flex-1 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className="flex flex-col gap-2 w-full animate-pulse">
        {items.map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-lg w-full" />
        ))}
      </div>
    );
  }

  return <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />;
};
