import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Sparkles, X, Coins } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { playSfx } from '../lib/sound';

interface RevengeChanceModalProps {
  isOpen: boolean;
  playerScore: number;
  opponentScore: number;
  snsBalance: number;
  language: string;
  opponentName?: string;
  onClose: () => void;
  onActivateRevenge: (method: 'cash' | 'sns') => void;
}

/**
 * SCR-02-03: 1장 차이(4:5) 아쉬운 석패 시 출현하는 '리벤지 찬스' 모달
 * - 500원 초특가 또는 50 SNS로 다음 대결 전 스탯 +2 버프팩 즉시 획득
 * - 1-Tap 즉시 재대결 연동으로 이탈 방지 및 과금 전환 극대화
 */
export const RevengeChanceModal: React.FC<RevengeChanceModalProps> = ({
  isOpen,
  playerScore,
  opponentScore,
  snsBalance,
  language,
  opponentName,
  onClose,
  onActivateRevenge,
}) => {
  if (!isOpen) return null;

  const handleAction = (method: 'cash' | 'sns') => {
    triggerHaptic('special');
    playSfx('reward');
    onActivateRevenge(method);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[320] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-[#12141a] border-2 border-rose-500/80 rounded-none max-w-md w-full p-4 sm:p-6 shadow-[0_0_50px_rgba(244,63,94,0.4)] text-white relative overflow-hidden flex flex-col"
        >
          {/* Top Hairline Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600 animate-pulse" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-stone-400 hover:text-white rounded-sm hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Header Badge */}
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-rose-500/20 border border-rose-500/40 rounded-sm text-rose-400 animate-bounce">
              <Flame size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 block">
                [ 1-POINT MARGIN REVERSAL OFFER ]
              </span>
              <h3 className="text-lg sm:text-xl font-black text-rose-100 uppercase tracking-tight flex items-center gap-1.5">
                <span>{language === 'ko' ? '⚡ 리벤지 찬스 (REVENGE CHANCE)' : '⚡ REVENGE CHANCE!'}</span>
              </h3>
            </div>
          </div>

          {/* Match Defeat Context Box */}
          <div className="bg-rose-950/30 border border-rose-500/30 p-3 rounded-none my-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-rose-300">
                {language === 'ko' ? '아쉬운 석패 스코어:' : 'Close Defeat Score:'}
              </span>
              <span className="text-sm font-black text-white bg-black/60 px-2 py-0.5 border border-rose-500/50 rounded-sm font-mono">
                {playerScore} <span className="text-rose-400">:</span> {opponentScore}
              </span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed font-sans sm:font-mono">
              {language === 'ko'
                ? `단 1장 차이로 아쉽게 패배하셨습니다! ${opponentName ? `[${opponentName}]` : '상대'}에게 즉시 복수할 수 있는 특별 분노 버프를 지원합니다.`
                : `You narrowly lost by only 1 card! Activate Revenge Rage Buff to claim immediate vengeance.`}
            </p>
          </div>

          {/* Buff Benefit Preview */}
          <div className="bg-amber-950/20 border border-amber-500/40 p-3 rounded-none mb-4 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase">
              <Sparkles size={14} className="text-amber-400 animate-spin" />
              <span>{language === 'ko' ? '복수전 전용 버프 혜택' : 'Revenge Buff Perks'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-black/50 border border-amber-500/30 p-2 rounded-sm">
                <div className="text-stone-400 text-[9px]">{language === 'ko' ? '전 방향 스탯' : 'All Direction Stats'}</div>
                <div className="text-amber-300 font-black text-sm">+2 BUFF 🔥</div>
              </div>
              <div className="bg-black/50 border border-amber-500/30 p-2 rounded-sm">
                <div className="text-stone-400 text-[9px]">{language === 'ko' ? '덱 종합 전투력' : 'Deck Total Power'}</div>
                <div className="text-amber-300 font-black text-sm">+10 POWER ⚡</div>
              </div>
            </div>
          </div>

          {/* Action CTAs (44px+ touch targets) */}
          <div className="space-y-2.5 pt-1">
            {/* Primary Option: 500원 1-Tap 다이렉트 결제 */}
            <button
              type="button"
              onClick={() => handleAction('cash')}
              className="w-full min-h-[46px] py-3 px-4 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm uppercase rounded-sm border border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)] flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
            >
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-yellow-300 fill-yellow-300 animate-bounce" />
                <span>{language === 'ko' ? '[ 500원 초특가 복수전 시작 ]' : '[ $0.49 Instant Revenge ]'}</span>
              </div>
              <span className="text-[11px] bg-black/40 px-2 py-0.5 rounded-sm border border-rose-300/50">
                {language === 'ko' ? '1-Tap 결제' : '1-Tap Pay'}
              </span>
            </button>

            {/* Secondary Option: 50 SNS 토큰 결제 */}
            <button
              type="button"
              onClick={() => handleAction('sns')}
              disabled={snsBalance < 50}
              className={`w-full min-h-[44px] py-2.5 px-4 rounded-sm border font-bold text-xs sm:text-sm uppercase flex items-center justify-between transition-all ${
                snsBalance >= 50
                  ? 'bg-indigo-950/80 hover:bg-indigo-900 border-indigo-500/60 text-indigo-200 cursor-pointer active:scale-98'
                  : 'bg-stone-900/60 border-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                <Coins size={15} className={snsBalance >= 50 ? 'text-indigo-400' : 'text-stone-500'} />
                <span>{language === 'ko' ? '[ 🪙 50 SNS로 복수전 시작 ]' : '[ 🪙 Pay 50 SNS & Rematch ]'}</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">
                {language === 'ko' ? `(보유: ${snsBalance} SNS)` : `(Bal: ${snsBalance})`}
              </span>
            </button>

            {/* Close / Skip */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-stone-400 hover:text-stone-200 text-xs font-mono font-medium hover:underline transition-colors cursor-pointer text-center"
            >
              {language === 'ko' ? '다음에 복수하기 (일반 결과 화면)' : 'Skip for now (View Result)'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
