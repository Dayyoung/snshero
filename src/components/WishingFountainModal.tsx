/**
 * WishingFountainModal.tsx - SCR-01-15
 * 메인 로비 데일리 도파민 인터랙션: 소원의 분수대 & 10분 한정 타임딜
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Sparkles, X, Gift, Flame, Clock, Trophy } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface WishingFountainModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onReward: (snsAmount: number) => void;
}

export const WishingFountainModal: React.FC<WishingFountainModalProps> = ({
  isOpen,
  onClose,
  language,
  onReward,
}) => {
  const todayKey = new Date().toISOString().slice(0, 10);
  const [hasFreeTossed, setHasFreeTossed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hero_fountain_free_toss_${todayKey}`) === 'true';
    } catch {
      return false;
    }
  });

  const [isTossing, setIsTossing] = useState(false);
  const [wonAmount, setWonAmount] = useState<number | null>(null);
  const [showTimeDeal, setShowTimeDeal] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(600); // 10 minutes

  useEffect(() => {
    if (!showTimeDeal) return;
    const interval = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowTimeDeal(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showTimeDeal]);

  if (!isOpen) return null;

  const handleTossCoin = () => {
    if (isTossing) return;
    setIsTossing(true);
    triggerHaptic('heavy');

    setTimeout(() => {
      // 잭팟 롤링 (50 ~ 1000 SNS)
      const isJackpot = Math.random() < 0.15;
      const prize = isJackpot ? 500 : Math.floor(Math.random() * 80) + 20;

      setWonAmount(prize);
      setIsTossing(false);
      setHasFreeTossed(true);
      setShowTimeDeal(true);

      try {
        localStorage.setItem(`hero_fountain_free_toss_${todayKey}`, 'true');
      } catch {}

      onReward(prize);
      triggerHaptic('success');
    }, 1200);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-indigo-950 border-2 border-amber-400 rounded-lg p-5 text-white shadow-2xl relative text-center"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>

          <div className="inline-flex p-3 bg-amber-400/20 rounded-full text-amber-300 border border-amber-400/50 mb-3 animate-bounce">
            <Coins size={36} />
          </div>

          <h2 className="text-lg font-black text-amber-300 tracking-tight">
            ⛲ {language === 'ko' ? '신비한 소원의 분수대' : 'Mystic Wishing Fountain'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 mb-4">
            {language === 'ko'
              ? '매일 1회 무료 동전을 분수에 던져 행운의 잭팟을 시험하세요!'
              : 'Toss a free daily coin to trigger lucky jackpots!'}
          </p>

          {wonAmount !== null ? (
            <div className="p-4 bg-emerald-950/80 border border-emerald-400 rounded mb-4 animate-in zoom-in-90">
              <Trophy size={28} className="mx-auto text-amber-400 mb-1" />
              <div className="text-xs text-emerald-300 font-bold">
                {language === 'ko' ? '분수의 여신이 화답했습니다!' : 'The Fountain Goddess responded!'}
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1 animate-pulse">
                +{wonAmount} SNS
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded mb-4">
              <p className="text-xs text-slate-300">
                {hasFreeTossed
                  ? (language === 'ko' ? '오늘의 무료 기회를 이미 사용하셨습니다.' : 'Daily free coin used.')
                  : (language === 'ko' ? '행운의 황금 동전 1개 준비 완료' : '1 Lucky Golden Coin Ready')}
              </p>
            </div>
          )}

          <button
            type="button"
            disabled={hasFreeTossed || isTossing}
            onClick={handleTossCoin}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 text-slate-950 font-black text-sm rounded shadow-lg active:scale-95 transition-all cursor-pointer mb-3"
          >
            {isTossing
              ? (language === 'ko' ? '동전을 던지는 중...' : 'Tossing Coin...')
              : hasFreeTossed
              ? (language === 'ko' ? '내일 다시 열립니다' : 'Come back tomorrow')
              : (language === 'ko' ? '✨ 행운의 동전 던지기 (무료)' : '✨ Toss Coin (Free)')}
          </button>

          {/* 게릴라 타임딜 패키지 */}
          {showTimeDeal && (
            <div className="p-3 bg-amber-500/10 border border-amber-400/60 rounded text-left mt-2 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-300">
                  <Flame size={14} className="text-rose-400 animate-pulse" />
                  {language === 'ko' ? '황금 분수 소원 패키지 (700원)' : 'Golden Fountain Deal ($0.59)'}
                </span>
                <span className="text-[10px] text-rose-300 font-bold flex items-center gap-0.5">
                  <Clock size={12} /> {formatTime(timeLeftSec)}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 mb-2">
                {language === 'ko'
                  ? '코인 5개 + 잭팟 확률 3배 버프 지급 (10분 한정)'
                  : '5 Coins + 3x Jackpot Chance (10m only)'}
              </p>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('heavy');
                  alert(language === 'ko' ? '상점으로 이동하여 패키지를 구매합니다.' : 'Redirecting to shop...');
                  onClose();
                }}
                className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded active:scale-95 transition-all cursor-pointer"
              >
                {language === 'ko' ? '⚡ 700원에 타임딜 획득하기' : '⚡ Claim Special Deal'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
