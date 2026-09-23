/**
 * GuildGuardianPetModal.tsx - SCR-09-24
 * 매일 먹이를 주면 길드원 전원에게 다이아를 물어오는 '길드 아기 신수' 및 신수의 골든 성수 펀딩팩(1,500원)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, Gift, X, Check, Award } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface GuildGuardianPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  petLevel: number;
  affectionPercent: number;
  onFeedPet: () => void;
  onBuyHolyWaterPack: () => void;
}

export const GuildGuardianPetModal: React.FC<GuildGuardianPetModalProps> = ({
  isOpen,
  onClose,
  petLevel,
  affectionPercent,
  onFeedPet,
  onBuyHolyWaterPack,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Heart size={16} />
            <span>🐾 길드 아기 신수</span>
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
          <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-5xl shadow-xl">
            🦊
          </div>

          <div>
            <div className="text-[10px] text-amber-400 font-bold">
              성장 레벨: Lv.{petLevel} (친밀도 {affectionPercent}%)
            </div>
            <h4 className="text-sm font-black text-white mt-1">길드 마스코트 '구미'</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              매일 길드원들이 함께 먹이를 주면 신수가 보답으로 길드원 전원에게 매일 다이아를 물어옵니다.
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onFeedPet();
            }}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Gift size={16} />
            <span>오늘의 맛있는 먹이 주기</span>
          </button>

          {/* Holy Water Pack (SCR-09-24) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">신수의 골든 성수 펀딩팩</span>
              <span className="text-[9px] text-slate-400">즉시 최종 신수 진화 & 전원 다이아 500개</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyHolyWaterPack();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (300 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
