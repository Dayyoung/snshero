/**
 * PredictionShortsFeed.tsx - SCR-07-14
 * 100dvh 풀스크린 상하 스와이프 경기 하이라이트 & 전력 5초 요약 피드 모달
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronUp, ChevronDown, Flame, Zap, Shield, Trophy } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface ShortMatch {
  id: string;
  title: string;
  videoThumb: string;
  keyPoint: string;
  winRate: number;
  aiPrediction: string;
  homeTeam: string;
  awayTeam: string;
}

interface PredictionShortsFeedProps {
  isOpen: boolean;
  onClose: () => void;
  matches: ShortMatch[];
  onSelectBet: (matchId: string, choice: 'home' | 'away') => void;
  language?: string;
}

export const PredictionShortsFeed: React.FC<PredictionShortsFeedProps> = ({
  isOpen,
  onClose,
  matches,
  onSelectBet,
  language = 'ko',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || matches.length === 0) return null;

  const currentMatch = matches[currentIndex];

  const handleNext = () => {
    if (currentIndex < matches.length - 1) {
      triggerHaptic('medium');
      setCurrentIndex(c => c + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      triggerHaptic('medium');
      setCurrentIndex(c => c - 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[12000] bg-black font-mono select-none flex flex-col justify-between text-white"
      >
        {/* Top bar */}
        <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-600 rounded-lg text-white">
              <Flame size={16} />
            </span>
            <span className="text-xs font-black tracking-wider uppercase text-rose-400">
              ⚡ {language === 'ko' ? '5초 경기 하이라이트 쇼츠 피드' : 'Shorts Feed'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto relative">
          <div className="w-24 h-24 rounded-2xl bg-indigo-950/80 border-2 border-indigo-500/50 flex items-center justify-center mb-4 shadow-2xl">
            <Trophy size={40} className="text-amber-400 animate-pulse" />
          </div>

          <span className="text-[11px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold mb-2">
            MATCH #{currentIndex + 1} / {matches.length}
          </span>
          <h2 className="text-lg font-black text-white mb-2">{currentMatch.title}</h2>
          <p className="text-xs text-slate-300 mb-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            💡 {currentMatch.keyPoint}
          </p>

          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl mb-6 w-full text-xs">
            <span className="text-emerald-400 font-bold block mb-1">🤖 AI 승률 전력 분석</span>
            <span className="text-white font-bold">{currentMatch.aiPrediction} ({currentMatch.winRate}% 확률)</span>
          </div>

          {/* Quick Select Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onSelectBet(currentMatch.id, 'home');
                onClose();
              }}
              className="h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-lg"
            >
              <span>{currentMatch.homeTeam} 승리</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onSelectBet(currentMatch.id, 'away');
                onClose();
              }}
              className="h-12 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-lg"
            >
              <span>{currentMatch.awayTeam} 승리</span>
            </button>
          </div>
        </div>

        {/* Up/Down Navigation Floating Controls */}
        <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-t from-black/80 to-transparent">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
          >
            <ChevronUp size={16} />
            <span>이전 경기</span>
          </button>
          <span className="text-[10px] text-slate-500 font-bold">상하 스와이프로 5초 전환</span>
          <button
            type="button"
            disabled={currentIndex === matches.length - 1}
            onClick={handleNext}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
          >
            <span>다음 경기</span>
            <ChevronDown size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
