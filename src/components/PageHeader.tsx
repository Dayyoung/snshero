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
        "sticky top-0 z-50 px-4 py-3 flex items-center gap-3 shrink-0 bg-white/88 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_1px_0_rgba(15,23,42,0.03)]",
        dark && "bg-slate-900/85 border-b border-slate-800 text-white",
        transparent && "bg-transparent border-transparent shadow-none",
        className
      )}
    >
      <div className="shrink-0 w-10 flex items-center justify-start">
        {onBack && (
          <button
            onClick={onBack}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 touch-target cursor-pointer",
              dark
                ? "text-slate-100 hover:bg-white/10"
                : "text-slate-700 hover:bg-slate-100"
            )}
            aria-label="Back"
            type="button"
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </div>

      {/* Center: Title */}
      <h1
        className={cn(
          "flex-1 text-sm font-extrabold uppercase tracking-wide text-center truncate text-slate-850",
          dark && "text-white"
        )}
      >
        {title}
      </h1>

      {/* Right: Action or spacer */}
      <div className="shrink-0 min-w-10 max-w-[45%] flex items-center justify-end overflow-hidden">
        {rightAction || null}
      </div>
    </div>
  );
};
