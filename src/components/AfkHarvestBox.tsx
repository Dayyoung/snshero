import React, { useState, useEffect } from 'react';
import { Clock, Gift, Sparkles, Coins, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';
import { cn } from '../lib/utils';

interface AfkHarvestBoxProps {
  language: Language;
  onClaimSns: (amt: number) => void;
  playSfx: (url: string) => void;
}

const AFK_LAST_CLAIM_KEY = 'hero_afk_harvest_last_time';
const SNS_RATE_PER_HOUR = 150;
const MAX_AFK_HOURS = 24;

export const AfkHarvestBox: React.FC<AfkHarvestBoxProps> = ({
  language,
  onClaimSns,
  playSfx,
}) => {
  const [accumulatedSns, setAccumulatedSns] = useState<number>(0);
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);
  const [isHarvesting, setIsHarvesting] = useState<boolean>(false);
  const [justHarvestedAmt, setJustHarvestedAmt] = useState<number | null>(null);

  const calculateReward = () => {
    const lastClaimStr = localStorage.getItem(AFK_LAST_CLAIM_KEY);
    const now = Date.now();

    if (!lastClaimStr) {
      // First time initialization (assume 2 hours accumulated)
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;
      localStorage.setItem(AFK_LAST_CLAIM_KEY, String(twoHoursAgo));
      setElapsedMinutes(120);
      setAccumulatedSns(300);
      return;
    }

    const lastClaim = parseInt(lastClaimStr, 10);
    const diffMs = Math.max(0, now - lastClaim);
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const cappedMins = Math.min(MAX_AFK_HOURS * 60, diffMins);

    setElapsedMinutes(cappedMins);
    const earned = Math.floor((cappedMins / 60) * SNS_RATE_PER_HOUR);
    setAccumulatedSns(earned);
  };

  useEffect(() => {
    calculateReward();
    const interval = setInterval(calculateReward, 10000); // 10s ticker
    return () => clearInterval(interval);
  }, []);

  const handleHarvest = () => {
    if (accumulatedSns <= 0 || isHarvesting) return;

    setIsHarvesting(true);
    triggerHaptic('victory');
    playSfx("https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3");

    const claimedAmt = accumulatedSns;
    setJustHarvestedAmt(claimedAmt);

    // Save timestamp & update local storage
    const now = Date.now();
    localStorage.setItem(AFK_LAST_CLAIM_KEY, String(now));
    onClaimSns(claimedAmt);

    // Reset local state
    setAccumulatedSns(0);
    setElapsedMinutes(0);

    setTimeout(() => {
      setJustHarvestedAmt(null);
      setIsHarvesting(false);
    }, 2500);
  };

  const hours = Math.floor(elapsedMinutes / 60);
  const mins = elapsedMinutes % 60;
  const progressPct = Math.min(100, Math.round((elapsedMinutes / (MAX_AFK_HOURS * 60)) * 100));

  return (
    <div className="w-full border border-[#201d1d]/12 bg-white p-3 font-mono text-xs select-none rounded-none relative overflow-hidden">
      {/* Background Subtle Progress Bar */}
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-amber-500 transition-all duration-500" 
        style={{ width: `${progressPct}%` }}
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Left Status */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="p-2 border border-[#201d1d]/15 bg-[#fdfcfc] text-[#201d1d] shrink-0 rounded-none relative">
            <Clock size={16} className={cn(accumulatedSns > 0 ? "text-amber-600 animate-spin" : "text-slate-400")} />
            {accumulatedSns > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#201d1d]">
              <span>{language === 'ko' ? '[24H 오프라인 순찰 수확]' : '[24H AFK PATROL HARVEST]'}</span>
              <span className="text-[10px] text-[#201d1d]/60 font-semibold">
                ({hours}h {mins}m / 24h)
              </span>
            </div>
            <p className="text-[11px] text-[#201d1d]/70 mt-0.5 flex items-center gap-1">
              <span>{language === 'ko' ? '누적 순찰 보상:' : 'Accrued Reward:'}</span>
              <span className="font-black text-amber-700 bg-amber-50 border border-amber-200 px-1">
                +{accumulatedSns} SNS
              </span>
            </p>
          </div>
        </div>

        {/* Right Harvest Action Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <AnimatePresence>
            {justHarvestedAmt !== null && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-1 flex items-center gap-1"
              >
                <Sparkles size={12} className="text-emerald-600" />
                +{justHarvestedAmt} SNS 수확 완료!
              </motion.span>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={handleHarvest}
            disabled={accumulatedSns <= 0 || isHarvesting}
            className={cn(
              "min-h-[44px] px-3.5 py-1.5 text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded-none w-full sm:w-auto",
              accumulatedSns > 0
                ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] hover:bg-[#201d1d]/90 active:scale-[0.98] shadow-sm"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            )}
          >
            <Coins size={14} className={accumulatedSns > 0 ? "text-amber-300" : "text-slate-400"} />
            <span>
              {accumulatedSns > 0
                ? (language === 'ko' ? '[+] 지금 수확하기' : '[+] Harvest Now')
                : (language === 'ko' ? '[순찰 중...]' : '[Patrolling...]')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
