/**
 * AwakeningLive2DViewer.tsx - SCR-03-18
 * 5성 풀돌파 카드의 Live2D 호흡 애니메이션 뷰어 및 초월 기념 축하 패키지 모달
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Crown, Volume2, X, Gift } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface AwakeningLive2DViewerProps {
  cardName: string;
  cardImage: string;
  voiceLineText?: string;
  isOpen: boolean;
  onClose: () => void;
  onBuyAwakeningPack: () => void;
}

export const AwakeningLive2DViewer: React.FC<AwakeningLive2DViewerProps> = ({
  cardName,
  cardImage,
  voiceLineText = '나의 진정한 힘이 깨어났다... 전장을 지배하라!',
  isOpen,
  onClose,
  onBuyAwakeningPack,
}) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col items-center text-center">
        {/* Header */}
        <div className="w-full p-4 bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-sm">
            <Crown size={18} />
            <span>✨ Live2D 초월 각성 완성!</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Breathing Live2D Simulation Card */}
        <div className="p-5 flex flex-col items-center gap-4 w-full">
          <motion.div
            animate={{
              scale: [1, 1.03, 1],
              rotate: [-0.5, 0.5, -0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-48 h-64 rounded-2xl overflow-hidden border-4 border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.4)] relative flex items-center justify-center bg-slate-900"
          >
            <img
              src={cardImage}
              alt={cardName}
              className="w-full h-full object-cover"
            />
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-300/20 to-transparent pointer-events-none" />
          </motion.div>

          {/* Voice line */}
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <Volume2 size={16} className="text-amber-400 shrink-0" />
            <span className="italic">"{voiceLineText}"</span>
          </div>

          {/* Awakening Celebration Pack (SCR-03-18) */}
          <div className="w-full p-3 bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">초월 기념 축하 패키지 (1,200원)</span>
              <span className="text-[10px] text-slate-400">초월 전용 테두리 + 1,000 SNS 환급</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onBuyAwakeningPack();
                onClose();
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (300 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
