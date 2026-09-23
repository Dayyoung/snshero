/**
 * GuildTavernCocktailModal.tsx - SCR-09-21
 * 매일 1회 무료 칵테일 잭팟 버프 룰렛 및 길드원 전원 공+20% '황금 럼주 골든 파티 샷(1,100원)'
 */

import React from 'react';
import { motion } from 'motion/react';
import { Wine, Sparkles, Flame, X, Check, Gift } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface GuildTavernCocktailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpinCocktail: () => void;
  onBuyGoldenRumParty: () => void;
}

export const GuildTavernCocktailModal: React.FC<GuildTavernCocktailModalProps> = ({
  isOpen,
  onClose,
  onSpinCocktail,
  onBuyGoldenRumParty,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Wine size={16} />
            <span>🍸 길드 선술집 & 럭키 칵테일 바</span>
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
            🍹
          </div>

          <div>
            <h4 className="text-sm font-black text-white">매일 1회 무료 바텐더 칵테일</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              신비한 칵테일을 주문하면 경험치 2배, 골드 획득량 증가 등 24시간 특별 길드 버프가 부여됩니다.
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onSpinCocktail();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Sparkles size={16} />
            <span>오늘의 칵테일 룰렛 주문</span>
          </button>

          {/* Golden Rum Party Shot (SCR-09-21) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">황금 럼주 골든 파티 샷</span>
              <span className="text-[9px] text-slate-400">접속 길드원 전원 24시간 공격력 +20%</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyGoldenRumParty();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              쏘기 (250 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
