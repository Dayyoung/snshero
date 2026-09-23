/**
 * LivePickupTradeModal.tsx - SCR-04-21
 * 10연차 시 소환 직후 30분간 타 유저의 동급 SSR과 1:1 맞교환하는 '라이브 픽업 교환소' 및 익스체인지 팩(1,000원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Repeat, Clock, Sparkles, X, Check, Users } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { CardData } from '../types';

interface LiveTradeCandidate {
  traderName: string;
  offeredCard: CardData;
  wantedCardName: string;
  expiresInSeconds: number;
}

interface LivePickupTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  myCard: CardData | null;
  candidates: LiveTradeCandidate[];
  onAcceptTrade: (candidate: LiveTradeCandidate) => void;
  onBuyExchangePack: () => void;
}

export const LivePickupTradeModal: React.FC<LivePickupTradeModalProps> = ({
  isOpen,
  onClose,
  myCard,
  candidates,
  onAcceptTrade,
  onBuyExchangePack,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Repeat size={16} />
            <span>🔄 라이브 픽업 1:1 교환소</span>
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
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
            <Clock size={14} />
            <span>교환 가능 잔여 시간: 29분 50초</span>
          </div>

          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-left">
            <span className="text-[10px] text-slate-500 block">내 보유 교환 대상 SSR</span>
            <span className="text-xs font-black text-white">{myCard?.title_dis || '심연의 마왕'}</span>
          </div>

          <div className="text-xs font-bold text-slate-300 w-full text-left">
            실시간 교환 희망 유저 목록
          </div>

          <div className="flex flex-col gap-2 w-full max-h-48 overflow-y-auto pr-1">
            {candidates.map((c, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-left"
              >
                <div>
                  <span className="text-[10px] text-amber-400 font-bold block">{c.traderName}</span>
                  <span className="text-xs font-black text-white">{c.offeredCard.title_dis || c.offeredCard.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('heavy');
                    onAcceptTrade(c);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer active:scale-95 shadow"
                >
                  교환 수락
                </button>
              </div>
            ))}
          </div>

          {/* Exchange Pack (SCR-04-21) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">라이브 익스체인지 팩</span>
              <span className="text-[9px] text-slate-400">교환 시간 24시간 연장 & 무제한 매칭</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyExchangePack();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (200 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
