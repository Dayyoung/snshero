/**
 * DragonEggIncubatorModal.tsx - SCR-01-24
 * 24시간 후 부화하는 '신비의 드래곤 알 부화기' (터치 시 시간 단축) 및 황금 모래시계 팩(800원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Egg, Sparkles, Clock, Flame, X, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface DragonEggIncubatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingSeconds: number;
  onWarmEgg: () => void;
  onBuyHourglassPack: () => void;
}

export const DragonEggIncubatorModal: React.FC<DragonEggIncubatorModalProps> = ({
  isOpen,
  onClose,
  remainingSeconds,
  onWarmEgg,
  onBuyHourglassPack,
}) => {
  const [tapBonus, setTapBonus] = useState(0);

  if (!isOpen) return null;

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Egg size={16} />
            <span>🥚 신비의 드래곤 알 부화기</span>
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
          {/* Egg Clickable Object */}
          <motion.div
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              triggerHaptic('medium');
              setTapBonus((p) => p + 1);
              onWarmEgg();
            }}
            className="w-24 h-28 rounded-full bg-gradient-to-t from-amber-600 via-yellow-500 to-amber-200 border-4 border-amber-300 flex items-center justify-center shadow-2xl cursor-pointer relative"
          >
            <span className="text-4xl">🐉</span>
            {tapBonus > 0 && (
              <span className="absolute -top-2 right-0 text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full animate-ping">
                -5초!
              </span>
            )}
          </motion.div>

          <div>
            <div className="text-[10px] text-amber-400 font-bold flex items-center justify-center gap-1">
              <Clock size={12} />
              <span>부화 잔여 시간: {hours}시간 {minutes}분</span>
            </div>
            <h4 className="text-sm font-black text-white mt-1">알을 톡톡 쳐서 온기를 나눠주세요!</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              터치할 때마다 부화 시간이 5초씩 단축되며, 부화 완료 시 전설 등급 아기 드래곤이 탄생합니다.
            </p>
          </div>

          {/* Golden Hourglass Pack (SCR-01-24) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">황금 모래시계 팩</span>
              <span className="text-[9px] text-slate-400">부화 시간 12시간 즉시 단축</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onBuyHourglassPack();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (150 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
