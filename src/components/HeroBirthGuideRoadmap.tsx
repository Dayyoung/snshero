/**
 * HeroBirthGuideRoadmap.tsx - SCR-01-30
 * 신규/복귀 유저 전용 '7일 연속 로드맵: 히어로 탄생 가이드' 상시 프로그레스 바를 홈 하단에 배치하고,
 * 1일차 챕터 1 클리어 시 SSR 확정권을 증정하는 '웰컴 파이터 스타터 팩(990원 타임딜)' 조건부 잠금 해제 시스템.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Gift, Sparkles, ChevronRight, Check, Zap, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface HeroBirthGuideRoadmapProps {
  currentDay: number; // 1 to 7
  isChapter1Cleared: boolean;
  onOpenRoadmapDetails: () => void;
  onBuyWelcomeStarterPack: () => void;
}

export const HeroBirthGuideRoadmap: React.FC<HeroBirthGuideRoadmapProps> = ({
  currentDay,
  isChapter1Cleared,
  onOpenRoadmapDetails,
  onBuyWelcomeStarterPack,
}) => {
  const [isStarterPackOpen, setIsStarterPackOpen] = useState(false);
  const [hasBoughtStarter, setHasBoughtStarter] = useState(() => {
    return localStorage.getItem('hero_welcome_starter_pack') === 'purchased';
  });

  const progressPercent = Math.min(100, Math.floor((currentDay / 7) * 100));

  const handleBuy = () => {
    triggerHaptic('heavy');
    localStorage.setItem('hero_welcome_starter_pack', 'purchased');
    setHasBoughtStarter(true);
    onBuyWelcomeStarterPack();
  };

  return (
    <>
      {/* Home Bottom Persistent Roadmap Progress Bar */}
      <div className="w-full bg-slate-950/95 border border-slate-800 rounded-2xl p-2.5 px-3.5 flex items-center justify-between font-mono select-none shadow-lg backdrop-blur-md">
        <div
          onClick={() => {
            triggerHaptic('light');
            onOpenRoadmapDetails();
          }}
          className="flex-1 flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-sm shadow">
            🌱
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-white flex items-center gap-1">
                히어로 탄생 가이드 ({currentDay}/7일)
              </span>
              <span className="text-amber-400">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 1-Day Starter Pack Trigger if Chapter 1 Cleared */}
        {isChapter1Cleared && !hasBoughtStarter && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              setIsStarterPackOpen(true);
            }}
            className="ml-3 h-8 px-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] rounded-xl flex items-center gap-1 active:scale-95 cursor-pointer shadow animate-bounce shrink-0"
          >
            <Gift size={12} />
            <span>SSR 스타터 (990원)</span>
          </button>
        )}
      </div>

      {/* Welcome Starter Pack Modal (SCR-01-30) */}
      <AnimatePresence>
        {isStarterPackOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center"
            >
              <div className="p-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-between font-black text-xs">
                <div className="flex items-center gap-1.5">
                  <Gift size={16} />
                  <span>[ 웰컴 파이터 스타터 팩: 990원 타임딜 ]</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStarterPackOpen(false)}
                  className="w-7 h-7 rounded bg-black/20 flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-5 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-4xl shadow animate-pulse">
                  🎟️
                </div>

                <div>
                  <h3 className="text-sm font-black text-white">챕터 1 돌파 기념 특가!</h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    신화급 SSR 확정 소환권 1매 + 10,000 골드
                    <br />
                    신규 모험가만을 위한 85% 할인 타임 리미트 혜택.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleBuy();
                    setIsStarterPackOpen(false);
                  }}
                  className="h-12 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-between px-4 cursor-pointer active:scale-95 shadow-xl hover:brightness-105"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap size={16} />
                    <span>SSR 확정권 구매하기</span>
                  </span>
                  <div className="text-right">
                    <span className="block text-xs font-black">990원 (또는 99 SNS)</span>
                    <span className="block text-[9px] line-through opacity-70">6,600원</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
