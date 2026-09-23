/**
 * SecretDateEpisodeModal.tsx - SCR-01-21
 * 호감도 레벨 상승 시 전용 스토리와 일러스트가 해금되는 '비밀 데이트 에피소드' 및 달콤 선물 박스(1,200원)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, X, Gift, BookOpen } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SecretDateEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  affectionLevel: number;
  onBuyGiftBox: () => void;
}

export const SecretDateEpisodeModal: React.FC<SecretDateEpisodeModalProps> = ({
  isOpen,
  onClose,
  characterName,
  affectionLevel,
  onBuyGiftBox,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-rose-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Heart size={16} />
            <span>💖 비밀 데이트 에피소드</span>
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
          <div className="w-16 h-16 rounded-2xl bg-rose-400/20 border-2 border-rose-400 flex items-center justify-center text-rose-400 text-3xl shadow-lg">
            💌
          </div>

          <div>
            <h4 className="text-sm font-black text-white">{characterName}와의 특별한 추억</h4>
            <div className="text-[11px] text-amber-400 font-bold mt-0.5">
              현재 호감도: Lv.{affectionLevel}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
              "지휘관님, 오늘 노을이 지는 호숫가에서 잠깐 둘만의 시간을 가질 수 있을까요...?"
            </p>
          </div>

          {/* Sweet Gift Box (SCR-01-21) */}
          <div className="w-full p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-rose-300 block">달콤 선물 박스</span>
              <span className="text-[9px] text-slate-400">호감도 2배 부스터 & 전용 대사 해금</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyGiftBox();
                onClose();
              }}
              className="px-2.5 py-1 bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (250 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
