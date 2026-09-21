/**
 * ChampionCrownAuctionModal.tsx - SCR-10-18
 * TOP 10 랭커 독점 '시즌 챔피언 월계관 프로필 오라' 경매 및 그랜드마스터 홀로그램 명예 팩(2,900원)
 */

import React, { useState } from 'react';
import { Crown, Sparkles, X, Check, Gavel, Award } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface ChampionCrownAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBid: number;
  onPlaceBid: (newBid: number) => void;
  onBuyHonorPack: () => void;
}

export const ChampionCrownAuctionModal: React.FC<ChampionCrownAuctionModalProps> = ({
  isOpen,
  onClose,
  currentBid,
  onPlaceBid,
  onBuyHonorPack,
}) => {
  const [bidAmount, setBidAmount] = useState(currentBid + 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Crown size={16} />
            <span>👑 시즌 챔피언 월계관 오라 경매</span>
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
            👑
          </div>

          <div>
            <h4 className="text-sm font-black text-white">전 서버 유일 챔피언 오라</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              시즌 종료 시 TOP 10 최고 입찰자에게만 영구 수여되는 전 서버 독점 황금 월계관 오라입니다.
            </p>
          </div>

          {/* Current Bid Box */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 flex justify-between items-center text-xs">
            <span className="text-slate-400">현재 최고 입찰가</span>
            <span className="text-amber-400 font-black text-sm">{currentBid.toLocaleString()} SNS</span>
          </div>

          {/* 48px Bid Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onPlaceBid(bidAmount);
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Gavel size={16} />
            <span>{bidAmount} SNS로 경매 입찰하기</span>
          </button>

          {/* Grandmaster Honor Pack (SCR-10-18) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">그랜드마스터 홀로그램 팩</span>
              <span className="text-[9px] text-slate-400">상위 100위 전용 70% 특별 할인</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyHonorPack();
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
