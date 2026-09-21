/**
 * SuddenDeathChallengeModal.tsx - SCR-02-21
 * 치명타 피격 시 1턴간 체력 1로 생존하고 마나를 완충해 역전 기회를 주는 '서든데스 챌린지' 및 결사 각성 앰플(600원)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Skull, ShieldAlert, Zap, X, Check, HeartCrack } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SuddenDeathChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSurviveSuddenDeath: () => void;
  onBuyAwakeningAmpoule: () => void;
}

export const SuddenDeathChallengeModal: React.FC<SuddenDeathChallengeModalProps> = ({
  isOpen,
  onClose,
  onSurviveSuddenDeath,
  onBuyAwakeningAmpoule,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-rose-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-600 to-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Skull size={16} />
            <span>💀 서든데스 라스트 스탠드</span>
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
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 text-3xl shadow-lg animate-pulse">
            🩸
          </div>

          <div>
            <h4 className="text-sm font-black text-white">체력 1 생존 & 마나 완충!</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              치명타 피격 시 즉시 패배하지 않고, 1턴 동안 체력 1로 버티며 마나를 가득 채워 마지막 역전의 일격을 가할 수 있습니다.
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onSurviveSuddenDeath();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Zap size={16} className="text-yellow-300" />
            <span>서든데스 결사의 한 방 발동!</span>
          </button>

          {/* Awakening Ampoule (SCR-02-21) */}
          <div className="w-full p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-rose-300 block">결사 각성 앰플</span>
              <span className="text-[9px] text-slate-400">마지막 턴 공격력 1.5배 & 치명타 100%</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyAwakeningAmpoule();
                onClose();
              }}
              className="px-2.5 py-1 bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (120 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
