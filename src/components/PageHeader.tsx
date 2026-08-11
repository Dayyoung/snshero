import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
  dark?: boolean;
  transparent?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onBack,
  rightAction,
  className,
  dark = false,
  transparent = false,
}) => {
  return (
    <div
      className={cn(
        "sticky top-0 z-50 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-2 shrink-0 bg-[#fdfcfc] border-b border-[#201d1d]/15 font-mono text-[#201d1d]",
        dark && "bg-[#201d1d] text-[#fdfcfc] border-b border-stone-800",
        transparent && "bg-transparent border-transparent shadow-none",
        className
      )}
    >
      <div className="shrink-0 min-w-10 flex items-center justify-start">
        {onBack && (
          <button
            onClick={onBack}
            className={cn(
              "h-8 px-2.5 rounded-sm border flex items-center gap-1 text-xs font-mono font-bold uppercase transition-colors cursor-pointer select-none active:translate-y-[1px]",
              dark
                ? "border-stone-700 text-[#fdfcfc] hover:bg-[#fdfcfc] hover:text-[#201d1d]"
                : "border-[#201d1d]/20 text-[#201d1d] hover:bg-[#201d1d] hover:text-[#fdfcfc]"
            )}
            aria-label="Back"
            type="button"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline-block">BACK</span>
          </button>
        )}
      </div>

      {/* Center: Title */}
      <h1
        className={cn(
          "flex-1 text-xs sm:text-sm font-black uppercase tracking-wider text-center truncate font-mono text-[#201d1d]",
          dark && "text-[#fdfcfc]"
        )}
      >
        {title}
      </h1>

      {/* Right: Action or spacer */}
      <div className="shrink-0 min-w-10 max-w-[45%] flex items-center justify-end overflow-hidden font-mono">
        {rightAction || null}
      </div>
    </div>
  );
};

