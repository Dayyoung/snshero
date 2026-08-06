import React from 'react';

interface PageSubHeaderProps {
  badge?: string;
  title: string;
  description: string;
  actionButton?: React.ReactNode;
}

export const PageSubHeader: React.FC<PageSubHeaderProps> = ({
  badge,
  title,
  description,
  actionButton
}) => {
  return (
    <div className="relative overflow-hidden bg-slate-950 p-5 sm:p-6 shadow-sm border-b border-slate-800 shrink-0 font-sans text-left">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-amber-400 pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          {badge && (
            <p className="text-[10px] font-bold uppercase text-cyan-300 tracking-wider mb-1">
              {badge}
            </p>
          )}
          <h2 className="text-lg sm:text-xl font-extrabold uppercase leading-tight mb-2 text-white break-words">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-medium break-words">
            {description}
          </p>
        </div>
        {actionButton && (
          <div className="flex w-full min-w-0 shrink-0 flex-wrap items-stretch gap-2 sm:w-auto sm:max-w-[45%] sm:justify-end">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
};
