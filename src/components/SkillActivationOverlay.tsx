import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Shield, Flame, Droplets, Mountain, Wind } from 'lucide-react';
import { Language } from '../types';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';

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
        return { bg: 'from-rose-600 to-amber-600', border: 'border-rose-400', icon: Flame, text: 'text-rose-200' };
      case 'water':
        return { bg: 'from-cyan-600 to-blue-600', border: 'border-cyan-400', icon: Droplets, text: 'text-cyan-200' };
      case 'earth':
        return { bg: 'from-amber-700 to-emerald-700', border: 'border-amber-400', icon: Mountain, text: 'text-amber-200' };
      case 'wind':
        return { bg: 'from-emerald-600 to-teal-600', border: 'border-emerald-400', icon: Wind, text: 'text-emerald-200' };
      default:
        return { bg: 'from-indigo-600 to-purple-600', border: 'border-indigo-400', icon: Zap, text: 'text-indigo-200' };
    }
  };

  const badge = getElementBadge();
  const IconComponent = badge.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[90%] max-w-sm"
      >
        <div className={cn(
          "relative overflow-hidden rounded-2xl border-2 shadow-2xl p-3 flex items-center gap-3 bg-gradient-to-r text-white",
          badge.bg,
          badge.border
        )}>
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md -z-10" />

          {/* Card Image / Icon */}
          <div className="relative shrink-0 w-12 h-12 rounded-xl bg-slate-950/60 border border-white/20 overflow-hidden flex items-center justify-center p-0.5">
            {event.cardImage ? (
              <img src={event.cardImage} alt={event.cardName} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <IconComponent size={24} className={badge.text} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-white/80">
              <Sparkles size={12} className="text-amber-300 animate-pulse" />
              <span>{language === 'ko' ? '스킬 발동!' : 'SKILL ACTIVATED'}</span>
              <span className="text-white/50">• {event.cardName}</span>
            </div>
            <h4 className="font-mono text-sm font-extrabold truncate drop-shadow">
              {event.skillName}
            </h4>
            <p className="text-[11px] font-mono font-bold text-amber-200 drop-shadow-sm truncate">
              {event.modifierText}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
