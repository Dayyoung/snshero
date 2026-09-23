/**
 * MidnightBlackMarketModal.tsx - SCR-05-24
 * 매일 밤 23시 초희귀 카드가 100 코인 시작가로 출품되는 '심야 도깨비 야시장' 및 암시장 비밀 통행증(1,200원)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Moon, Sparkles, X, Check, Flame, Ticket } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface MidnightBlackMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  rareCardTitle: string;
  currentBid: number;
  onPlaceBid: () => void;
  onBuySecretPass: () => void;
}

export const MidnightBlackMarketModal: React.FC<MidnightBlackMarketModalProps> = ({
  isOpen,
  onClose,
  rareCardTitle,
  currentBid,
  onPlaceBid,
  onBuySecretPass,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-purple-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-purple-200 flex items-center justify-between border-b border-purple-500/40">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Moon size={16} className="text-amber-400" />
            <span>🏮 심야 도깨비 야시장</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-purple-300 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-900/40 border-2 border-purple-400 flex items-center justify-center text-purple-300 text-3xl shadow-lg">
            👺
          </div>

          <div>
            <div className="text-[10px] text-purple-400 font-bold">
              매일 23:00 ~ 01:00 단 2시간 개장
            </div>
            <h4 className="text-sm font-black text-white mt-1">[{rareCardTitle}]</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              초희귀 한정 매물이 100 골드 시작가로 출품되었습니다! 최고 입찰자가 카드를 낙찰받습니다.
            </p>
          </div>

          {/* Current Bid Display */}
          <div className="w-full bg-slate-900 border border-purple-500/30 rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-xs text-slate-400">현재 최고 호가:</span>
            <span className="text-sm font-black text-amber-400">{currentBid} G</span>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onPlaceBid();
            }}
            className="h-12 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Flame size={16} />
            <span>+50 G 상향 입찰하기</span>
          </button>

          {/* Secret Pass (SCR-05-24) */}
          <div className="w-full p-2.5 bg-purple-950/40 border border-purple-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-purple-300 block">암시장 비밀 통행증</span>
              <span className="text-[9px] text-slate-400">우선 입찰권 & 수수료 50% 감면</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuySecretPass();
                onClose();
              }}
              className="px-2.5 py-1 bg-purple-500 hover:bg-purple-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (240 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
