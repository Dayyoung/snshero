import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, Zap, ArrowUp, X, Award, CheckCircle } from 'lucide-react';
import { Language } from '../types';
import { cn } from '../lib/utils';

interface BattleVictoryXpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  earnedXp: number;
  earnedSns: number;
  playSfx: (url: string) => void;
}

export const BattleVictoryXpModal: React.FC<BattleVictoryXpModalProps> = ({
  isOpen,
  onClose,
  language,
  earnedXp,
  earnedSns,
  playSfx,
}) => {
  const [animatedXp, setAnimatedXp] = useState(0);
  const [animatedSns, setAnimatedSns] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setAnimatedXp(0);
      setAnimatedSns(0);
      return;
    }

    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

    // Number counter animation
    const duration = 1200; // 1.2s
    const steps = 30;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnimatedXp(Math.floor(earnedXp * progress));
      setAnimatedSns(Math.floor(earnedSns * progress));

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedXp(earnedXp);
        setAnimatedSns(earnedSns);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isOpen, earnedXp, earnedSns]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="bg-gradient-to-b from-amber-500/10 via-white to-white rounded-3xl max-w-sm w-full border border-amber-300 shadow-2xl p-6 text-center space-y-5 overflow-hidden relative"
        >
          {/* Victory Header Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 ring-4 ring-amber-200"
          >
            <Trophy size={32} className="animate-bounce" />
          </motion.div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              {language === 'ko' ? 'VICTORY! 승리' : 'VICTORY!'}
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              {language === 'ko' ? '대전에서 승리하여 경험치와 보상을 획득했습니다!' : 'Battle won! Claiming earned EXP & SNS rewards.'}
            </p>
          </div>

          {/* Animated EXP Counter (Item 30) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-600">
                <Zap size={18} className="text-indigo-500" />
                <span>{language === 'ko' ? '획득 경험치 (EXP)' : 'Earned EXP'}</span>
              </div>
              <span className="text-lg font-black text-indigo-600 font-mono">
                +{animatedXp.toLocaleString()} EXP
              </span>
            </div>

            {/* EXP Bar Animation */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '85%' }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="bg-indigo-600 h-full rounded-full"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-2 text-xs font-black text-amber-600">
                <Sparkles size={18} className="text-amber-500" />
                <span>{language === 'ko' ? 'SNS 포인트' : 'SNS Points'}</span>
              </div>
              <span className="text-lg font-black text-amber-600 font-mono">
                +{animatedSns.toLocaleString()} SNS
              </span>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle size={16} />
            <span>{language === 'ko' ? '보상 수령 완료' : 'Claim & Close'}</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
