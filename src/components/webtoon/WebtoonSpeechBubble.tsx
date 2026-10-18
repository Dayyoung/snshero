import React from 'react';
import { cn, getCardSpriteStyle } from '../../lib/utils';

export interface WebtoonDialogue {
 speakerKo: string;
 speakerEn: string;
 textKo: string;
 textEn: string;
 bubbleType?: 'speech' | 'shout' | 'thought' | 'whisper';
 position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
 characterCardId?: number;
}

export interface WebtoonSpeechBubbleProps {
 dialogue: WebtoonDialogue;
 language: 'ko' | 'en';
 className?: string;
 onBubbleClick?: () => void;
}

export const WebtoonSpeechBubble: React.FC<WebtoonSpeechBubbleProps> = () => {
 return null;
};

export const _DisabledWebtoonSpeechBubble: React.FC<WebtoonSpeechBubbleProps> = ({
 dialogue,
 language,
 className,
 onBubbleClick,
}) => {
 const {
 speakerKo,
 speakerEn,
 textKo,
 textEn,
 bubbleType = 'speech',
 position = 'top-left',
 characterCardId,
 } = dialogue;

 const speakerName = language === 'ko' ? speakerKo : speakerEn;
 const bubbleText = language === 'ko' ? textKo : textEn;

 // Position classes
 const positionClasses = {
 'top-left': 'top-3 left-3 sm:top-5 sm:left-5',
 'top-right': 'top-3 right-3 sm:top-5 sm:right-5',
 'bottom-left': 'bottom-3 left-3 sm:bottom-5 sm:left-5',
 'bottom-right': 'bottom-3 right-3 sm:bottom-5 sm:right-5',
 'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
 }[position] || 'top-left';

 // Styling per bubble type adhering strictly to DESIGN.md
 // font-mono, rounded-sm, flat cream/ink palette, 1px border
 const bubbleStyle = {
 speech: 'bg-[#fdfcfc]/95 text-[#201d1d] border border-[#201d1d] shadow-sm',
 shout: 'bg-[#201d1d] text-[#fdfcfc] border-2 border-red-600 font-bold',
 thought: 'bg-[#f8f7f7]/95 text-[#201d1d] border border-dashed border-[#646262] italic',
 whisper: 'bg-[#fdfcfc]/90 text-[#646262] border border-dotted border-[rgba(15,0,0,0.25)] text-xs',
 }[bubbleType];

 const speakerBadgeStyle = {
 speech: 'bg-[#201d1d] text-[#fdfcfc]',
 shout: 'bg-red-700 text-white',
 thought: 'bg-[#646262] text-[#fdfcfc]',
 whisper: 'bg-stone-500 text-white',
 }[bubbleType];

 return (
 <div
 onClick={onBubbleClick}
 className={cn(
 'absolute z-20 pointer-events-auto font-mono max-w-[82%] sm:max-w-[340px] select-text',
 positionClasses,
 className
 )}
 >
 <div
 className={cn(
 'p-2.5 sm:p-3 rounded-sm transition-all text-xs sm:text-[13px] leading-relaxed',
 bubbleStyle
 )}
 >
 {/* Speaker Badge */}
 {speakerName && (
 <div className="flex items-center gap-1.5 mb-1 select-none">
 {characterCardId && (
 <span
 style={getCardSpriteStyle(characterCardId)}
 className="w-4 h-4 rounded-none border border-black/20 inline-block shrink-0"
 />
 )}
 <span
 className={cn(
 'text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase',
 speakerBadgeStyle
 )}
 >
 {speakerName}
 </span>
 {bubbleType === 'thought' && speakerKo !== '내레이션' && speakerEn !== 'Narration' && (
 <span className="text-[10px] text-[#646262] font-semibold">
 {language === 'ko' ? '(독백)' : '(Thought)'}
 </span>
 )}
 {bubbleType === 'shout' && (
 <span className="text-[10px] text-red-500 font-bold">
 !
 </span>
 )}
 </div>
 )}

 {/* Bubble Text */}
 <p className="whitespace-pre-line font-medium break-words">
 {bubbleText}
 </p>

 {/* Thought dots */}
 {bubbleType === 'thought' && (
 <div className="flex gap-1 mt-1 justify-end opacity-70">
 <span className="w-1.5 h-1.5 rounded-none bg-[#646262]" />
 <span className="w-1 h-1 rounded-none bg-[#646262]" />
 </div>
 )}
 </div>
 </div>
 );
};
