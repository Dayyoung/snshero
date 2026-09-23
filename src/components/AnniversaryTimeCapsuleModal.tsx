/**
 * AnniversaryTimeCapsuleModal.tsx - SCR-12-21
 * 기념일 플레이 통계와 무료 SSR을 증정하는 '기념일 타임캡슐' 및 영구 VIP 라이프타임 패스(4,900원)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Gift, Calendar, Sparkles, X, Check, Award } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface AnniversaryTimeCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysActive: number;
  totalBattles: number;
  onClaimSsrReward: () => void;
  onBuyLifetimePass: () => void;
}

export const AnniversaryTimeCapsuleModal: React.FC<AnniversaryTimeCapsuleModalProps> = ({
  isOpen,
  onClose,
  daysActive,
  totalBattles,
  onClaimSsrReward,
  onBuyLifetimePass,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Award size={16} />
            <span>🎉 히어로 기념일 타임캡슐</span>
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
            📜
          </div>

          <div>
            <h4 className="text-sm font-black text-white">SNS히어로와 함께한 {daysActive}일!</h4>
            <div className="text-[11px] text-slate-400 mt-1">
              누적 대전 횟수: <span className="text-amber-400 font-bold">{totalBattles}회</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              영웅님의 특별한 기념일을 축하하며 100% 무료 확정 SSR 소환권을 타임캡슐에 담아 선물합니다.
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onClaimSsrReward();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Gift size={16} />
            <span>기념 무료 확정 SSR 수령</span>
          </button>

          {/* Lifetime VIP Pass (SCR-12-21) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">영구 VIP 라이프타임 패스</span>
              <span className="text-[9px] text-slate-400">매월 1일 영구 다이아 지급 & 전용 휘장</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyLifetimePass();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (500 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
