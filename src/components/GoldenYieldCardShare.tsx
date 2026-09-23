/**
 * GoldenYieldCardShare.tsx - SCR-06-23
 * 총자산/수익률을 9:16 인스타 스토리용으로 생성 및 공유하는 48px 골든 수익률 카드 공유
 */

import React, { useState } from 'react';
import { Share2, Sparkles, X, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface GoldenYieldCardShareProps {
  totalBalance: number;
  yieldPercent: number;
  nickname: string;
}

export const GoldenYieldCardShare: React.FC<GoldenYieldCardShareProps> = ({
  totalBalance,
  yieldPercent,
  nickname,
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          triggerHaptic('medium');
          setShowModal(true);
        }}
        className="h-12 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg font-mono select-none"
      >
        <Share2 size={16} />
        <span>골든 수익률 카드 공유</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
          <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl flex flex-col items-center p-5 text-center relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 cursor-pointer"
            >
              <X size={14} />
            </button>

            {/* 9:16 Aspect Mini Preview */}
            <div className="w-52 h-80 bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-400/80 rounded-2xl p-4 flex flex-col justify-between shadow-2xl">
              <div>
                <span className="text-[10px] text-amber-400 font-bold block">SNSHERO PORTFOLIO</span>
                <h4 className="text-sm font-black text-white mt-1">@{nickname}</h4>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">총 자산 평가액</span>
                <div className="text-xl font-black text-white">{totalBalance.toLocaleString()} G</div>
                <div className="text-sm font-black text-emerald-400 mt-1">
                  +{yieldPercent.toFixed(2)}% PROFIT
                </div>
              </div>

              <div className="text-[9px] text-slate-500">
                Verified by SNSHero Financial Engine
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                setShowModal(false);
              }}
              className="h-10 mt-4 w-full bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <Check size={14} />
              <span>이미지 클립보드 복사 완료</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
