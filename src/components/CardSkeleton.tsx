import React from 'react';
import { cn } from '../lib/utils';

interface CardSkeletonProps {
  className?: string;
  count?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ className, count = 1 }) => {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, idx) => (
        <div
          key={idx}
          className={cn(
            "w-20 h-28 sm:w-28 sm:h-40 md:w-32 md:h-44 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-300/50 flex flex-col justify-between p-2 shrink-0 select-none",
            className
          )}
        >
          {/* Header Placeholder */}
          <div className="flex items-center justify-between">
            <div className="w-8 h-2.5 rounded bg-slate-300 dark:bg-slate-700" />
            <div className="w-4 h-2.5 rounded bg-slate-300 dark:bg-slate-700" />
          </div>

          {/* Character Art Placeholder */}
          <div className="w-full h-1/2 rounded-lg bg-slate-300/80 dark:bg-slate-700/80 my-1" />

          {/* Stats Grid Placeholder */}
          <div className="grid grid-cols-4 gap-1">
            <div className="h-3 rounded bg-slate-300 dark:bg-slate-700" />
            <div className="h-3 rounded bg-slate-300 dark:bg-slate-700" />
            <div className="h-3 rounded bg-slate-300 dark:bg-slate-700" />
            <div className="h-3 rounded bg-slate-300 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </>
  );
};
