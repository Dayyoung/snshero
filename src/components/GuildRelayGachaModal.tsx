/**
 * GuildRelayGachaModal.tsx - SCR-09-18
 * 길드원 5명이 마법진에 에너지를 투입해 최고 등급 SSR을 확정 연성하는 '길드 릴레이 합동 소환식' 및 연성 비약 패키지(1,500원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Users, Crown, X, Check, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface GuildRelayGachaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContributeEnergy: () => void;
  onBuyElixirPack: () => void;
}

export const GuildRelayGachaModal: React.FC<GuildRelayGachaModalProps> = ({
  isOpen,
  onClose,
  onContributeEnergy,
  onBuyElixirPack,
}) => {
  const [energy, setEnergy] = useState(3); // 3 of 5 members contributed

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-emerald-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Users size={16} />
            <span>✨ 길드 릴레이 합동 소환식</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-400/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
            <Crown size={28} />
          </div>

          <div>
            <h4 className="text-sm font-black text-white">길드원 5인 마나 합동 충전</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              길드원들이 릴레이로 마나를 공양하여 100% 충전 시, 참가자 전원에게 SSR 카드가 확정 연성됩니다!
            </p>
          </div>

          {/* Energy Progress Indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`w-9 h-9 rounded-xl flex items-center justify-center border text-xs font-black transition ${
                  idx <= energy
                    ? 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-md scale-105'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {idx <= energy ? '✓' : idx}
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-300">
            충전 현황: <span className="text-emerald-400 font-bold">{energy} / 5 길드원</span>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              setEnergy((p) => Math.min(5, p + 1));
              onContributeEnergy();
            }}
            className="h-12 w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Zap size={16} />
            <span>내 마나 공양하기 (50 SNS)</span>
          </button>

          {/* Guild Elixir Pack (SCR-09-18) */}
          <div className="w-full p-2.5 bg-teal-950/40 border border-teal-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-teal-300 block">길드 합동 연성 비약</span>
              <span className="text-[9px] text-slate-400">마나 2단계 즉시 채우기 부스터</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyElixirPack();
                setEnergy((p) => Math.min(5, p + 2));
              }}
              className="px-2.5 py-1 bg-teal-500 hover:bg-teal-400 text-white text-[10px] font-bold rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (300 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
