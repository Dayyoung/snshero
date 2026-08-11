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
    <div className="relative overflow-hidden bg-[#fdfcfc] p-4 sm:p-5 border-b border-[#201d1d]/15 shrink-0 font-mono text-left text-[#201d1d]">
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          {badge && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">
              <span>[{badge}]</span>
            </div>
          )}
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight leading-snug mb-1.5 text-[#201d1d] break-words font-mono">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[#646262] leading-relaxed max-w-2xl font-mono break-words">
            {description}
          </p>
        </div>
        {actionButton && (
          <div className="flex w-full min-w-0 shrink-0 flex-wrap items-stretch gap-2 sm:w-auto sm:max-w-[45%] sm:justify-end font-mono">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
};

