import React from 'react';
import { cn } from '../../lib/utils';

export interface WebtoonMonologueBoxProps {
 speaker?: string;
 text: string;
 language: 'ko' | 'en';
 className?: string;
}

export const WebtoonMonologueBox: React.FC<WebtoonMonologueBoxProps> = ({
 speaker,
 text,
 language,
 className,
}) => {
 return (
 <div
 className={cn(
 'font-mono text-xs sm:text-[13px] leading-relaxed bg-[#201d1d]/95 text-[#fdfcfc] border-l-2 border-amber-500 p-3 rounded-none shadow-sm select-text',
 className
 )}
 >
 {speaker && (
 <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-amber-400 select-none">
 <span className="w-1.5 h-1.5 rounded-none bg-amber-400" />
 <span>{speaker}</span>
 <span className="text-[10px] text-stone-400">
 {language === 'ko' ? '(내면의 독백)' : '(Internal Monologue)'}
 </span>
 </div>
 )}
 <p className="italic text-stone-200 break-words">
 {text}
 </p>
 </div>
 );
};
