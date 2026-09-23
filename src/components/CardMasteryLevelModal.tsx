/**
 * CardMasteryLevelModal.tsx - SCR-03-24
 * 승리 횟수에 따라 프레임 이펙트가 감기는 '카드 장인 마스터리 시스템' 및 골든 엠퍼러 스킨 팩(1,100원)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Crown, Sparkles, Award, X, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface CardMasteryLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  masteryLevel: number;
  winCount: number;
  onBuyGoldenEmperorSkin: () => void;
}

export const CardMasteryLevelModal: React.FC<CardMasteryLevelModalProps> = ({
  isOpen,
  onClose,
  cardName,
  masteryLevel,
  winCount,
  onBuyGoldenEmperorSkin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Crown size={16} />
            <span>👑 카드 장인 마스터리</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-slate-950 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 text-3xl shadow-lg">
            🌟
          </div>

          <div>
            <div className="text-[10px] text-amber-400 font-bold">
              장인 숙련도: Lv.{masteryLevel} (누적 {winCount}승)
            </div>
            <h4 className="text-sm font-black text-white mt-1">[{cardName}] 마스터 달성!</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              카드를 전투에 기용해 승리할수록 카드 외곽에 화려한 신화 마스터리 오라가 영구 각인됩니다.
            </p>
          </div>

          {/* Golden Emperor Skin Pack (SCR-03-24) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">골든 엠퍼러 스킨 팩</span>
              <span className="text-[9px] text-slate-400">전투 스킬 황금빛 전용 이펙트 교체</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onBuyGoldenEmperorSkin();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (220 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
