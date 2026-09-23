/**
 * FinalCountdownModal.tsx - SCR-10-21
 * 시즌 종료 전 승점 2배 골든 아워 피버 타임 및 시즌 엔드 스퍼트 앰플(1,200원)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Flame, Clock, Trophy, X, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface FinalCountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  hoursRemaining: number;
  onEnterFeverBattle: () => void;
  onBuySpurtAmpoule: () => void;
}

export const FinalCountdownModal: React.FC<FinalCountdownModalProps> = ({
  isOpen,
  onClose,
  hoursRemaining,
  onEnterFeverBattle,
  onBuySpurtAmpoule,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Flame size={16} />
            <span>🔥 골든 아워 2X 피버 타임</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 text-3xl shadow-lg animate-bounce">
            ⏳
          </div>

          <div>
            <div className="text-[10px] text-amber-400 font-bold flex items-center justify-center gap-1">
              <Clock size={12} />
              <span>시즌 종료까지 잔여 {hoursRemaining}시간</span>
            </div>
            <h4 className="text-sm font-black text-white mt-1">막판 스퍼트 승점 2배 폭풍 적립!</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              지금 랭킹전에 참여하면 승리 승점이 2배로 적립되며, 마지막 상위 티어 진입 기회를 잡을 수 있습니다.
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onEnterFeverBattle();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Zap size={16} />
            <span>피버 랭킹전 지금 바로 입장</span>
          </button>

          {/* Spurt Ampoule (SCR-10-21) */}
          <div className="w-full p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-rose-300 block">시즌 엔드 스퍼트 앰플</span>
              <span className="text-[9px] text-slate-400">패배 시 점수 하락 50% 방어 & 승점 +30%</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuySpurtAmpoule();
                onClose();
              }}
              className="px-2.5 py-1 bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (240 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
