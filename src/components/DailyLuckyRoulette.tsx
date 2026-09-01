/**
 * DailyLuckyRoulette.tsx
 * 로비/컬렉션 일일 럭키 출석 룰렛 & 7일 스트릭 보너스 팝업 모달
 * (구글 스프레드시트 Row 704 / ID 553 요구사항 구현)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, X, RotateCw, CheckCircle, Gift, Zap } from 'lucide-react';
import {
  ROULETTE_ITEMS,
  RouletteRewardItem,
  getAttendanceState,
  claimDailyReward,
  AttendanceState
} from '../lib/attendanceService';

interface DailyLuckyRouletteProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onRewardClaimed?: (reward: RouletteRewardItem, totalSnsGranted: number) => void;
}

export const DailyLuckyRoulette: React.FC<DailyLuckyRouletteProps> = ({
  isOpen,
  onClose,
  language = 'ko',
  onRewardClaimed
}) => {
  const isKo = language === 'ko';
  const [attendanceState, setAttendanceState] = useState<AttendanceState>(getAttendanceState);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [wonReward, setWonReward] = useState<RouletteRewardItem | null>(null);
  const [streakBonusGranted, setStreakBonusGranted] = useState<number>(0);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonReward(null);

    // 무작위 슬롯 선택 (0 ~ 5)
    const winningIdx = Math.floor(Math.random() * ROULETTE_ITEMS.length);
    const winningItem = ROULETTE_ITEMS[winningIdx];

    // 슬롯 6개 -> 슬롯당 60도 (360 / 6 = 60)
    const slotAngle = 360 / ROULETTE_ITEMS.length;
    const baseSpins = 360 * 5; // 5회전 이상
    const targetDeg = baseSpins + (360 - (winningIdx * slotAngle + slotAngle / 2));

    setRotationDegrees(prev => prev + targetDeg);

    setTimeout(() => {
      setIsSpinning(false);
      const { newState, streakBonus } = claimDailyReward(winningItem);
      setAttendanceState(newState);
      setWonReward(winningItem);
      setStreakBonusGranted(streakBonus);

      if (onRewardClaimed) {
        const total = (winningItem.rewardType === 'sns' ? winningItem.amount : 0) + streakBonus;
        onRewardClaimed(winningItem, total);
      }
    }, 3800);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 font-mono select-none backdrop-blur-xs animate-fade-in">
      <div className="bg-[#201d1d] text-white border-2 border-amber-500/50 w-full max-w-sm p-5 flex flex-col items-center gap-4 rounded-none shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSpinning}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center border-b border-white/10 pb-2 w-full">
          <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-300 font-bold mb-1">
            <Sparkles size={12} className="text-amber-400" />
            <span>{isKo ? '★ 일일 럭키 출석 룰렛 ★' : '★ DAILY LUCKY ROULETTE ★'}</span>
          </div>
          <h3 className="text-sm font-black text-amber-400 tracking-wider">
            {isKo ? '매일 1회 무료 행운의 룰렛' : 'Daily Free Lucky Wheel'}
          </h3>
          <p className="text-[10px] text-slate-400">
            {isKo ? '7일 연속 출석 시 신화 소환권 & 황금 뱃지 증정!' : '7-Day Streak unlocks Mythic Ticket & Gold Badge!'}
          </p>
        </div>

        {/* 7-Day Streak Tracker */}
        <div className="w-full bg-slate-900/80 border border-slate-800 p-2 flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-amber-300 flex items-center gap-1">
              <Trophy size={12} />
              {isKo ? `출석 스트릭: ${attendanceState.currentStreak}일차` : `Streak: Day ${attendanceState.currentStreak}`}
            </span>
            <span className="text-slate-400">7-DAY GOAL</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const isPassed = day <= attendanceState.currentStreak;
              const isToday = day === attendanceState.currentStreak;
              return (
                <div
                  key={day}
                  className={`flex flex-col items-center justify-center p-1 border text-[9px] font-bold ${
                    isPassed
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                      : 'border-slate-800 bg-slate-950 text-slate-600'
                  } ${isToday ? 'ring-1 ring-amber-400 animate-pulse' : ''}`}
                >
                  <span>D{day}</span>
                  <span>{day === 7 ? '👑' : isPassed ? '✓' : '•'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3D Wheel Container */}
        <div className="relative w-56 h-56 flex items-center justify-center my-1">
          {/* Wheel Pointer Pin */}
          <div className="absolute -top-3 z-30 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-amber-400 drop-shadow-md" />
          </div>

          {/* Rotating Wheel */}
          <div
            className="w-full h-full rounded-full border-4 border-amber-500/80 shadow-2xl relative overflow-hidden transition-all duration-[3800ms] cubic-bezier(0.15, 0.9, 0.25, 1.0)"
            style={{
              transform: `rotate(${rotationDegrees}deg)`
            }}
          >
            {ROULETTE_ITEMS.map((item, idx) => {
              const angle = (360 / ROULETTE_ITEMS.length) * idx;
              return (
                <div
                  key={item.id}
                  className="absolute top-0 left-0 w-full h-full flex items-start justify-center pt-2 select-none"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '50% 50%'
                  }}
                >
                  <div className="flex flex-col items-center text-[10px] font-bold text-amber-200">
                    <span>{item.icon}</span>
                    <span className="text-[8px] scale-90">{item.amount}</span>
                  </div>
                </div>
              );
            })}
            {/* Wheel Center Hub */}
            <div className="absolute inset-[38%] rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center shadow-inner">
              <Sparkles size={16} className="text-amber-400" />
            </div>
          </div>
        </div>

        {/* Reward Result Celebration */}
        <AnimatePresence>
          {wonReward && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full p-2.5 bg-amber-500/15 border border-amber-500/40 text-center flex flex-col items-center gap-1"
            >
              <div className="text-xs font-black text-amber-300 flex items-center gap-1">
                <CheckCircle size={14} className="text-emerald-400" />
                <span>{isKo ? wonReward.label_ko : wonReward.label_en} 획득!</span>
              </div>
              <div className="text-[10px] text-amber-200/80">
                {isKo ? `스트릭 보너스 +${streakBonusGranted} SNS 추가 입금 완료` : `Streak Bonus +${streakBonusGranted} SNS Deposited`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spin CTA Button */}
        <div className="w-full pt-1">
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg"
          >
            <RotateCw size={15} className={isSpinning ? 'animate-spin' : ''} />
            <span>
              {isSpinning
                ? (isKo ? '행운의 룰렛 회전 중...' : 'SPINNING...')
                : (isKo ? '무료 룰렛 돌리기 [SPIN]' : 'SPIN FREE WHEEL')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
