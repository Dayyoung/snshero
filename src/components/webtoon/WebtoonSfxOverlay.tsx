import React from 'react';
import { cn } from '../../lib/utils';

export interface WebtoonSfxCue {
 textKo: string;
 textEn: string;
 style?: 'slash' | 'impact' | 'magic' | 'rumble';
 position?: 'center' | 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right';
}

export interface WebtoonSfxOverlayProps {
 sfx: WebtoonSfxCue;
 language: 'ko' | 'en';
 onTriggerSfx?: () => void;
 className?: string;
}

export const WebtoonSfxOverlay: React.FC<WebtoonSfxOverlayProps> = ({
 sfx,
 language,
 onTriggerSfx,
 className,
}) => {
 const {
 textKo,
 textEn,
 style = 'impact',
 position = 'center',
 } = sfx;

 const sfxText = language === 'ko' ? textKo : textEn;

 const positionClasses = {
 'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
 'top-right': 'top-5 right-5 sm:top-8 sm:right-8',
 'top-left': 'top-5 left-5 sm:top-8 sm:left-8',
 'bottom-left': 'bottom-6 left-6 sm:bottom-10 sm:left-10',
 'bottom-right': 'bottom-6 right-6 sm:bottom-10 sm:right-10',
 }[position] || 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';

 // SFX typography styles matching dark-fantasy comic onomatopoeia
 const styleClasses = {
 slash: 'text-red-500 italic -rotate-6 tracking-widest text-lg sm:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] border-red-500/50',
 impact: 'text-amber-400 rotate-3 tracking-tight text-xl sm:text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] border-amber-400/50',
 magic: 'text-cyan-400 -rotate-3 tracking-wider text-base sm:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] border-cyan-400/50',
 rumble: 'text-stone-300 rotate-2 tracking-tighter text-lg sm:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] border-stone-400/50',
 }[style];

 return (
 <div
 onClick={(e) => {
 e.stopPropagation();
 if (onTriggerSfx) onTriggerSfx();
 }}
 className={cn(
 'absolute z-20 pointer-events-auto cursor-pointer select-none font-mono font-black',
 positionClasses,
 className
 )}
 title="Click to play SFX"
 >
 <div
 className={cn(
 'px-2.5 py-1 bg-black/75 rounded-sm border backdrop-blur-xs transition-transform active:scale-95 hover:scale-105',
 styleClasses
 )}
 >
 <span>{sfxText}</span>
 </div>
 </div>
 );
};
