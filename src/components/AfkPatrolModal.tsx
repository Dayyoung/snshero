import React, { useState, useEffect } from 'react';
import { Clock, Coins, Sparkles, X, ShieldCheck, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface AfkPatrolModalProps {
  language: Language;
  onClaim?: (gold: number, sns: number) => void;
}

const AFK_LAST_CLAIM_KEY = 'hero_afk_patrol_last_claim';

export const AfkPatrolModal: React.FC<AfkPatrolModalProps> = ({ language, onClaim }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [elapsedHours, setElapsedHours] = useState(0);
  const [earnedGold, setEarnedGold] = useState(0);
  const [earnedSns, setEarnedSns] = useState(0);

  useEffect(() => {
    const lastClaimStr = localStorage.getItem(AFK_LAST_CLAIM_KEY);
    const now = Date.now();

    if (!lastClaimStr) {
      // First time initialization (assume 2 hours accumulated)
      localStorage.setItem(AFK_LAST_CLAIM_KEY, (now - 2 * 60 * 60 * 1000).toString());
      setElapsedHours(2);
      setEarnedGold(2000);
      setEarnedSns(150);
      setIsOpen(true);
      return;
    }

    const lastClaim = parseInt(lastClaimStr, 10);
    const diffMs = now - lastClaim;
    const diffHours = Math.min(12, Math.floor(diffMs / (1000 * 60 * 60)));

    if (diffHours >= 1) {
      const gold = diffHours * 1000;
      const sns = diffHours * 75;
      setElapsedHours(diffHours);
      setEarnedGold(gold);
      setEarnedSns(sns);
      setIsOpen(true);
    }
  }, []);

  const handleClaim = () => {
    triggerHaptic('victory');
    localStorage.setItem(AFK_LAST_CLAIM_KEY, Date.now().toString());
    if (onClaim) {
      onClaim(earnedGold, earnedSns);
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-sm rounded-2xl border-2 border-indigo-500/40 bg-slate-900 p-5 text-white shadow-2xl text-center overflow-hidden"
        >
          {/* Background Aura */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Icon Header */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-3 border border-indigo-400/40">
            <Gift size={28} className="animate-pulse" />
          </div>

          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400">
            {language === 'ko' ? '오프라인 자동 탐색 보상' : 'AFK PATROL REWARD'}
          </span>
          <h3 className="font-mono text-lg font-extrabold text-white mt-0.5 mb-1">
            {language === 'ko' ? '탐색 완료 보상 수령' : 'Collect Exploration Loot'}
          </h3>

          <p className="text-xs font-mono text-slate-400 mb-4 flex items-center justify-center gap-1.5">
            <Clock size={14} className="text-indigo-400" />
            <span>
              {language === 'ko'
                ? `오프라인 방치 시간: ${elapsedHours}시간 (최대 12시간)`
                : `AFK Duration: ${elapsedHours}h (Max 12h)`}
            </span>
          </p>

          {/* Rewards Box */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 mb-5">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">{language === 'ko' ? '골드 획득' : 'GOLD'}</span>
              <span className="font-mono text-base font-black text-amber-400 flex items-center gap-1 mt-0.5">
                <Coins size={14} />
                +{earnedGold.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">{language === 'ko' ? 'SNS 포인트' : 'SNS PTS'}</span>
              <span className="font-mono text-base font-black text-cyan-400 flex items-center gap-1 mt-0.5">
                <Sparkles size={14} />
                +{earnedSns.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white font-mono text-sm font-extrabold shadow-lg shadow-indigo-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            <span>{language === 'ko' ? '보상 일괄 수령' : 'Collect All Rewards'}</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
