import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Flame, Droplets, Mountain, Wind } from 'lucide-react';
import { Language } from '../types';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { usePerformanceMode } from '../hooks/usePerformanceMode';

export interface SkillEvent {
 id: string;
 cardName: string;
 skillName: string;
 modifierText: string;
 element?: 'water' | 'fire' | 'earth' | 'wind' | 'neutral';
 cardImage?: string;
}

interface SkillActivationOverlayProps {
 event: SkillEvent | null;
 language: Language;
 onComplete?: () => void;
}

export const SkillActivationOverlay: React.FC<SkillActivationOverlayProps> = ({
 event,
 language,
 onComplete
}) => {
 const { reducedMotion } = usePerformanceMode();
 useEffect(() => {
 if (event) {
 triggerHaptic('flip');
 const timer = setTimeout(() => {
 if (onComplete) onComplete();
 }, 1800);
 return () => clearTimeout(timer);
 }
 }, [event, onComplete]);

 if (!event) return null;

 const getElementBadge = () => {
 switch (event.element) {
 case 'fire':
 return { border: 'border-l-[#d98979]', icon: Flame, text: 'text-[#efb1a3]' };
 case 'water':
 return { border: 'border-l-[#8bb9cc]', icon: Droplets, text: 'text-[#add4e3]' };
 case 'earth':
 return { border: 'border-l-[#c5ad7c]', icon: Mountain, text: 'text-[#dfcba4]' };
 case 'wind':
 return { border: 'border-l-[#9db99c]', icon: Wind, text: 'text-[#c0d7bf]' };
 default:
 return { border: 'border-l-[#fdfcfc]', icon: Zap, text: 'text-[#fdfcfc]' };
 }
 };

 const badge = getElementBadge();
 const IconComponent = badge.icon;

 return (
 <AnimatePresence>
 <motion.div
 initial={reducedMotion ? false : { opacity: 0, y: -6 }}
 animate={{ opacity: 1, y: 0 }}
 exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
 transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
 className="fixed top-[max(4rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[calc(100%-2rem)] max-w-sm font-mono"
 >
 <div className={cn(
 "relative overflow-hidden rounded-none border border-[#fdfcfc]/20 border-l-2 p-3 flex items-center gap-3 bg-[#201d1d] text-[#fdfcfc]",
 badge.border
 )}>
 {/* Card Image / Icon */}
 <div className="relative shrink-0 w-14 h-[72px] rounded-none bg-[#302c2c] border border-[#fdfcfc]/20 overflow-hidden flex items-center justify-center">
 {event.cardImage ? (
 <img src={event.cardImage} alt={event.cardName} className="w-full h-full object-cover object-top" />
 ) : (
 <IconComponent size={24} className={badge.text} />
 )}
 </div>

 {/* Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[#d5cece]">
 <IconComponent size={12} className={cn('shrink-0', badge.text)} aria-hidden="true" />
 <span>{language === 'ko' ? '스킬 발동!' : 'SKILL ACTIVATED'}</span>
 </div>
 <div className="mt-1 text-[11px] leading-4 text-[#d5cece] break-words">{event.cardName}</div>
 <h4 className="mt-0.5 text-base leading-5 font-bold break-words">
 {event.skillName}
 </h4>
 <p className={cn('mt-1 text-xs leading-4 font-medium break-words', badge.text)}>
 {event.modifierText}
 </p>
 </div>
 </div>
 </motion.div>
 </AnimatePresence>
 );
};
