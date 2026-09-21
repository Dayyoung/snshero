/**
 * AiCounterDeckSheet.tsx - SCR-03-17
 * 상대 덱 상성을 분석하여 내 인벤토리 중 최적 카운터 카드를 즉시 추천/배치하는 AI 카운터 빌더 바텀시트
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Swords, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface CounterRecommendation {
  slotIndex: number;
  currentCardName: string;
  recommendedCardId: number;
  recommendedCardName: string;
  reason: string;
  winRateBoost: number;
}

interface AiCounterDeckSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: CounterRecommendation[];
  onApplyCounterDeck: () => void;
}

export const AiCounterDeckSheet: React.FC<AiCounterDeckSheetProps> = ({
  isOpen,
  onClose,
  recommendations,
  onApplyCounterDeck,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end font-mono select-none">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-slate-950 border-t-2 border-amber-400 rounded-t-3xl p-5 max-w-lg mx-auto w-full flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-400" size={18} />
            <h3 className="text-sm font-black text-white">1-Tap AI 카운터 덱 빌더</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          최근 패배 전적 및 메타 덱 상성을 분석하여 내 인벤토리 기준 승률이 가장 높은 카드로 자동 교체합니다.
        </p>

        <div className="flex flex-col gap-2">
          {recommendations.map((rec) => (
            <div
              key={rec.slotIndex}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">{rec.currentCardName}</span>
                  <ArrowRight size={12} className="text-amber-400" />
                  <span className="font-bold text-emerald-400">{rec.recommendedCardName}</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">{rec.reason}</span>
              </div>
              <span className="text-xs font-bold text-amber-300">+{rec.winRateBoost}% 승률</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            onApplyCounterDeck();
            onClose();
          }}
          className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg"
        >
          <Check size={16} />
          <span>카운터 덱 원터치 적용</span>
        </button>
      </motion.div>
    </div>
  );
};
