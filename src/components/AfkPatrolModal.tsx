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
  const [earnedSns, setEarnedSns] = useState(0);

  useEffect(() => {
    const lastClaimStr = localStorage.getItem(AFK_LAST_CLAIM_KEY);
    const now = Date.now();

    if (!lastClaimStr) {
      // First time initialization (assume 2 hours accumulated)
      localStorage.setItem(AFK_LAST_CLAIM_KEY, (now - 2 * 60 * 60 * 1000).toString());
      setElapsedHours(2);
      setEarnedSns(300);
      setIsOpen(true);
      return;
    }

    const lastClaim = parseInt(lastClaimStr, 10);
    const diffMs = now - lastClaim;
    const diffHours = Math.min(12, Math.floor(diffMs / (1000 * 60 * 60)));

    if (diffHours >= 1) {
      const sns = diffHours * 150;
      setElapsedHours(diffHours);
      setEarnedSns(sns);
      setIsOpen(true);
    }
  }, []);

  const handleClaim = () => {
    triggerHaptic('victory');
    localStorage.setItem(AFK_LAST_CLAIM_KEY, Date.now().toString());
    if (onClaim) {
      onClaim(0, earnedSns);
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-5 text-[#201d1d] shadow-2xl text-center rounded-none overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 p-1.5 text-[#646262] hover:text-[#201d1d] rounded-sm hover:bg-[#f8f7f7] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Icon Header */}
          <div className="mx-auto w-12 h-12 rounded-sm bg-[#201d1d] flex items-center justify-center text-[#fdfcfc] shadow-sm mb-3">
            <Gift size={24} />
          </div>

          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#646262]">
            {language === 'ko' ? '[오프라인 자동 탐색 보상]' : '[AFK PATROL REWARD]'}
          </span>
          <h3 className="font-mono text-base font-extrabold text-[#201d1d] mt-1 mb-1">
            {language === 'ko' ? '탐색 완료 보상 수령' : 'Collect Exploration Loot'}
          </h3>

          <p className="text-xs font-mono text-[#646262] mb-4 flex items-center justify-center gap-1.5">
            <Clock size={14} className="text-[#201d1d]" />
            <span>
              {language === 'ko'
                ? `오프라인 방치 시간: ${elapsedHours}시간 (최대 12시간)`
                : `AFK Duration: ${elapsedHours}h (Max 12h)`}
            </span>
          </p>

          {/* Rewards Box */}
          <div className="p-3.5 rounded-sm bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] mb-5 flex flex-col items-center">
            <span className="text-[10px] font-mono text-[#646262] uppercase font-bold tracking-wider">
              {language === 'ko' ? '획득 보상 (SNS 포인트)' : 'EARNED SNS POINTS'}
            </span>
            <span className="font-mono text-xl font-black text-[#201d1d] flex items-center gap-1.5 mt-1">
              <Sparkles size={18} className="text-indigo-600" />
              +{earnedSns.toLocaleString()} SNS
            </span>
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            className="w-full py-3 rounded-sm bg-[#201d1d] hover:bg-[#383333] text-[#fdfcfc] font-mono text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <ShieldCheck size={18} />
            <span>{language === 'ko' ? '보상 일괄 수령' : 'Collect All Rewards'}</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
