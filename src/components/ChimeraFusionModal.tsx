/**
 * ChimeraFusionModal.tsx - SCR-08-21
 * 서로 다른 3개 종족 합성 시 전설의 혼혈 카드를 탄생시키는 '키메라 연성식' 및 키메라 주문서 번들(1,900원)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Dna, Flame, X, Check, Scroll } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface ChimeraFusionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChimeraFusion: () => void;
  onBuyChimeraScroll: () => void;
}

export const ChimeraFusionModal: React.FC<ChimeraFusionModalProps> = ({
  isOpen,
  onClose,
  onStartChimeraFusion,
  onBuyChimeraScroll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-purple-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Dna size={16} />
            <span>🧬 전설의 키메라 삼합 연성식</span>
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
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-purple-300 text-3xl shadow-lg">
            🐉
          </div>

          <div>
            <h4 className="text-sm font-black text-white">서로 다른 3개 종족 이종 융합</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              드래곤, 메카, 언데드 등 3종족을 교차 합성하여 듀얼 종족 패시브를 보유한 궁극의 키메라 히어로를 탄생시킵니다.
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onStartChimeraFusion();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Sparkles size={16} />
            <span>키메라 연성 의식 시작</span>
          </button>

          {/* Chimera Scroll Bundle (SCR-08-21) */}
          <div className="w-full p-2.5 bg-purple-950/40 border border-purple-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-purple-300 block">키메라 연성 비전 주문서</span>
              <span className="text-[9px] text-slate-400">성공 확률 5배(500%) & 파괴 방지 실드</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyChimeraScroll();
                onClose();
              }}
              className="px-2.5 py-1 bg-purple-500 hover:bg-purple-400 text-white text-[10px] font-bold rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (350 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
