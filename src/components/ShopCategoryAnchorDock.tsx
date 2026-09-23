/**
 * ShopCategoryAnchorDock.tsx - SCR-04-29
 * 100dvh 최적화 '원터치 카테고리 앵커 탭 바(44px)' 구축,
 * 확률표 원클릭 모달(시인성 높은 투명 표기) 및 하단 Thumb Zone에 '1회/10회 연속 소환 듀얼 햅틱 버튼(56px)' 배치.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, HelpCircle, Package, Gem, Coins, Zap, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export type ShopCategory = 'pickup' | 'normal' | 'diamonds' | 'gold';

interface ShopCategoryAnchorDockProps {
  activeCategory: ShopCategory;
  onSelectCategory: (cat: ShopCategory) => void;
  onSummonSingle: () => void;
  onSummonTen: () => void;
  singleCost: number;
  tenCost: number;
  userCurrency: number;
}

export const ShopCategoryAnchorDock: React.FC<ShopCategoryAnchorDockProps> = ({
  activeCategory,
  onSelectCategory,
  onSummonSingle,
  onSummonTen,
  singleCost,
  tenCost,
  userCurrency,
}) => {
  const [isProbabilityOpen, setIsProbabilityOpen] = useState(false);

  return (
    <>
      {/* 1. Top Category Anchor Tab Bar (44px target) */}
      <div className="w-full grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-3 shadow select-none font-mono">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onSelectCategory('pickup');
          }}
          className={`h-11 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeCategory === 'pickup'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles size={13} />
          <span>픽업</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onSelectCategory('normal');
          }}
          className={`h-11 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeCategory === 'normal'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package size={13} />
          <span>일반</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onSelectCategory('diamonds');
          }}
          className={`h-11 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeCategory === 'diamonds'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gem size={13} />
          <span>다이아</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onSelectCategory('gold');
          }}
          className={`h-11 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeCategory === 'gold'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Coins size={13} />
          <span>재화</span>
        </button>
      </div>

      {/* Probability Check Trigger (Clean Text Button) */}
      <div className="w-full flex justify-end mb-2 pr-1 select-none font-mono">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsProbabilityOpen(true);
          }}
          className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 underline cursor-pointer"
        >
          <HelpCircle size={12} />
          <span>상세 소환 확률표 보기</span>
        </button>
      </div>

      {/* 2. Bottom Thumb Zone: 56px Dual Haptic Summon Buttons */}
      <div className="w-full bg-slate-950/95 border border-slate-800 rounded-2xl p-2.5 grid grid-cols-2 gap-2 shadow-2xl font-mono select-none">
        {/* 1-Summon Button (56px) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            onSummonSingle();
          }}
          className="h-14 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center justify-center active:scale-95 cursor-pointer text-white"
        >
          <span className="text-xs font-black">1회 소환</span>
          <span className="text-[10px] text-amber-400 font-bold">{singleCost} 다이아</span>
        </button>

        {/* 10-Summon Button (56px, Highlighted) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            onSummonTen();
          }}
          className="h-14 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 rounded-xl flex flex-col items-center justify-center active:scale-95 cursor-pointer shadow-lg hover:brightness-105 font-black"
        >
          <div className="flex items-center gap-1 text-xs font-black">
            <Zap size={14} />
            <span>10회 연속 소환 (1회 보너스)</span>
          </div>
          <span className="text-[10px] font-bold opacity-80">{tenCost} 다이아</span>
        </button>
      </div>

      {/* Transparent Probability Modal */}
      <AnimatePresence>
        {isProbabilityOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-950 border-2 border-slate-800 rounded-3xl w-full max-w-xs p-4 shadow-2xl space-y-3"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <HelpCircle size={14} /> 소환 확률 고지
                </span>
                <button
                  type="button"
                  onClick={() => setIsProbabilityOpen(false)}
                  className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-slate-400 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-amber-400 font-bold">신화 SSR</span>
                  <span className="font-black">3.00%</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-purple-400 font-bold">전설 SR</span>
                  <span className="font-black">15.00%</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-cyan-400 font-bold">희귀 R</span>
                  <span className="font-black">40.00%</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 font-bold">일반 N</span>
                  <span className="font-black">42.00%</span>
                </div>
              </div>

              <p className="text-[9px] text-slate-500 leading-tight">
                * 30회 이상 SSR 미등장 시 '행운의 룬 에너지' 충전 및 천장이 발동됩니다.
              </p>

              <button
                type="button"
                onClick={() => setIsProbabilityOpen(false)}
                className="h-10 w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl active:scale-95 cursor-pointer border border-slate-800"
              >
                닫기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
