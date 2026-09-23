/**
 * SafetyConfirmModal.tsx - SCR-08-20
 * 실패 위험 40% 이상 시 경고 햅틱 안전 잠금 48px 확인 모달
 */

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SafetyConfirmModalProps {
  isOpen: boolean;
  failRate: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SafetyConfirmModal: React.FC<SafetyConfirmModalProps> = ({
  isOpen,
  failRate,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-rose-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-600 to-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <AlertTriangle size={16} />
            <span>⚠️ 고위험 합성 안전 잠금 경고</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 text-3xl shadow-lg animate-pulse">
            ⚡
          </div>

          <div>
            <h4 className="text-sm font-black text-white">합성 파괴 위험도 {failRate}%</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              실패 확률이 40% 이상으로 매우 높습니다. 실패 시 투입된 보조 카드가 영구 소멸될 수 있습니다. 정말 진행하시겠습니까?
            </p>
          </div>

          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onCancel();
              }}
              className="h-12 flex-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs cursor-pointer active:scale-95"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onConfirm();
              }}
              className="h-12 flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer active:scale-95 shadow-lg"
            >
              위험 감수 진행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
