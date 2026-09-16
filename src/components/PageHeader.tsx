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
      <div className="shrink-0 flex items-center justify-start">
        {onBack && (
          <button
            onClick={onBack}
            className={cn(
              "min-h-11 min-w-11 h-11 px-3 rounded-xl border-2 flex items-center gap-1.5 text-xs font-mono font-black uppercase transition-all cursor-pointer select-none active:scale-95 shadow-md",
              dark
                ? "border-amber-400 bg-[#141212] text-amber-300 hover:bg-[#201d1d] hover:border-amber-300"
                : "border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] hover:bg-black"
            )}
            aria-label="Back"
            type="button"
          >
            <ArrowLeft size={20} strokeWidth={2.8} className="shrink-0" />
            <span className="inline-block font-black tracking-wider">BACK</span>
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

