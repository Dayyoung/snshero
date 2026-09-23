/**
 * GoldenPinataModal.tsx - SCR-11-15
 * 주간 퀘스트 100% 달성 시 10초 손가락 연타 황금 피냐타 미니게임 & 다이아몬드 배트 팩 모달
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Gift, X, Flame, Shield } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface GoldenPinataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishGame: (totalCoinsEarned: number) => void;
  onBuyBatPack: () => void;
}

export const GoldenPinataModal: React.FC<GoldenPinataModalProps> = ({
  isOpen,
  onClose,
  onFinishGame,
  onBuyBatPack,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [hitCount, setHitCount] = useState(0);
  const [hasDiamondBat, setHasDiamondBat] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsPlaying(false);
            triggerHaptic('heavy');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  if (!isOpen) return null;

  const handleStart = () => {
    setIsPlaying(true);
    setTimeLeft(10);
    setHitCount(0);
    setCoinsEarned(0);
    triggerHaptic('heavy');
  };

  const handleHitPinata = () => {
    if (!isPlaying || timeLeft <= 0) return;
    triggerHaptic('medium');
    const multiplier = hasDiamondBat ? 3 : 1;
    setHitCount((prev) => prev + 1);
    setCoinsEarned((prev) => prev + 10 * multiplier);
  };

  const handleFinishAndClaim = () => {
    onFinishGame(coinsEarned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-sm">
            <Gift size={18} />
            <span>🪅 주간 황금 피냐타 축제</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col items-center gap-4">
          {!isPlaying && timeLeft === 10 && (
            <>
              <div className="text-4xl animate-bounce">🪅</div>
              <div>
                <h4 className="text-sm font-black text-white">10초간 제한 시간 연타!</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  화면의 피냐타를 최대한 빠르게 탭하여 쏟아지는 SNS 보너스를 획득하세요!
                </p>
              </div>

              {/* Diamond Bat Upsell (SCR-11-15) */}
              <div className="w-full p-3 bg-slate-900 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-amber-300 block">다이아몬드 배트 팩 (990원)</span>
                  <span className="text-[10px] text-slate-400">타격당 재화 획득량 3배 영구 증폭</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHasDiamondBat(true);
                    triggerHaptic('heavy');
                    onBuyBatPack();
                  }}
                  className={`px-3 py-1 text-xs font-black rounded-lg ${
                    hasDiamondBat
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {hasDiamondBat ? '장착 완료' : '구매 (250 SNS)'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleStart}
                className="h-12 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg"
              >
                <span>피냐타 터트리기 시작!</span>
              </button>
            </>
          )}

          {/* Playing state */}
          {isPlaying && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex items-center justify-between w-full text-xs font-black">
                <span className="text-rose-400">⏱️ 남은 시간: {timeLeft}초</span>
                <span className="text-amber-400">💰 획득: {coinsEarned} SNS</span>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={handleHitPinata}
                className="w-40 h-40 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 border-4 border-white flex flex-col items-center justify-center text-5xl shadow-2xl active:brightness-125 cursor-pointer"
              >
                <span>🪅</span>
                <span className="text-[10px] text-slate-950 font-black mt-1">TAP! TAP!</span>
              </motion.button>

              <span className="text-xs text-slate-300 font-bold">연타 횟수: {hitCount}회</span>
            </div>
          )}

          {/* Finished state */}
          {!isPlaying && timeLeft === 0 && (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="text-4xl animate-bounce">🎉</div>
              <h4 className="text-base font-black text-amber-300">피냐타 격파 완료!</h4>
              <p className="text-xs text-slate-300">
                총 <span className="text-emerald-400 font-black text-sm">{coinsEarned.toLocaleString()} SNS</span>를 획득했습니다!
              </p>
              <button
                type="button"
                onClick={handleFinishAndClaim}
                className="h-12 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg"
              >
                <span>보상 수령하고 닫기</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
