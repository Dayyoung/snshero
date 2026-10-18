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
 "sticky top-0 z-50 w-full min-w-0 px-3 pb-2.5 sm:px-4 sm:pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.625rem)] flex items-center justify-between gap-3 shrink-0 bg-[var(--ui-canvas)] border-b border-[var(--ui-line)] font-mono text-[var(--ui-ink)]",
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
 "min-h-11 min-w-11 h-11 px-3 rounded-sm border flex items-center gap-1.5 text-xs font-mono font-bold uppercase transition-colors cursor-pointer select-none",
 dark
 ? "border-[#fdfcfc]/30 bg-[#302c2c] text-[#fdfcfc] hover:bg-[#424245]"
 : "border-[var(--ui-line)] bg-[var(--ui-surface)] text-[var(--ui-ink)] hover:border-[var(--ui-muted)]"
 )}
 aria-label="Back"
 type="button"
 >
 <ArrowLeft size={20} strokeWidth={2} className="shrink-0" />
 <span className="hidden sm:inline-block tracking-wider">BACK</span>
 </button>
 )}
 </div>

 {/* Center: Title */}
 <h1
 className={cn(
 "flex-1 min-w-0 text-sm sm:text-base font-bold tracking-tight text-left truncate font-mono",
 dark && "text-[#fdfcfc]"
 )}
 >
 {title}
 </h1>

 {/* Right: Action or spacer */}
 <div className="shrink-0 max-w-[45%] flex items-center justify-end font-mono">
 {rightAction || null}
 </div>
 </div>
 );
};
