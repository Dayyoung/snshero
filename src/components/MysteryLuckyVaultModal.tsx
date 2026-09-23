/**
 * MysteryLuckyVaultModal.tsx - SCR-11-21
 * 잉여 퀘스트 포인트 100점마다 뽑는 '미스터리 럭키 금고' 및 3배 보상 '마법의 황금 열쇠 팩(990원)'
 */

import React from 'react';
import { motion } from 'motion/react';
import { Key, Gift, Sparkles, X, Check, Lock } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface MysteryLuckyVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  surplusPoints: number;
  onOpenVault: () => void;
  onBuyGoldenKeyPack: () => void;
}

export const MysteryLuckyVaultModal: React.FC<MysteryLuckyVaultModalProps> = ({
  isOpen,
  onClose,
  surplusPoints,
  onOpenVault,
  onBuyGoldenKeyPack,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Lock size={16} />
            <span>🔐 미스터리 럭키 금고</span>
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
            🎁
          </div>

          <div>
            <div className="text-[10px] text-slate-400">
              보유 잉여 퀘스트 포인트: <span className="text-amber-400 font-bold">{surplusPoints} P</span>
            </div>
            <h4 className="text-sm font-black text-white mt-1">100 포인트로 금고 1회 개봉!</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              마일스톤 달성 후 남는 잉여 포인트를 소모해 랜덤 골드, 다이아, 소환 티켓을 획득하세요.
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onOpenVault();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Key size={16} />
            <span>금고 개봉 (100 P 소모)</span>
          </button>

          {/* Golden Key Pack (SCR-11-21) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">마법의 황금 열쇠 팩</span>
              <span className="text-[9px] text-slate-400">금고 개봉 보상 3배(300%) 불리기</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyGoldenKeyPack();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (180 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
