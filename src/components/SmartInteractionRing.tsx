/**
 * SmartInteractionRing.tsx - SCR-09-17
 * 아바타 터치 시 4개 퀵 액션(대화, 친선전, 선물, 프로필)이 원형으로 펼쳐지는 48px 스마트 인터랙션 링
 */

import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Swords, Gift, User, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SmartInteractionRingProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserName: string;
  onChat: () => void;
  onDuel: () => void;
  onGift: () => void;
  onProfile: () => void;
}

export const SmartInteractionRing: React.FC<SmartInteractionRingProps> = ({
  isOpen,
  onClose,
  targetUserName,
  onChat,
  onDuel,
  onGift,
  onProfile,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center font-mono select-none">
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Center Avatar Badge */}
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex flex-col items-center justify-center text-amber-400 z-10 shadow-xl">
          <span className="text-[10px] font-black truncate max-w-[50px]">{targetUserName}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[9px] text-slate-400 hover:text-white mt-0.5 cursor-pointer"
          >
            [닫기]
          </button>
        </div>

        {/* 4 Radial Action Buttons */}
        {/* Top: Chat */}
        <motion.button
          initial={{ scale: 0, y: 0 }}
          animate={{ scale: 1, y: -70 }}
          onClick={() => {
            triggerHaptic('medium');
            onChat();
            onClose();
          }}
          className="absolute w-12 h-12 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center text-[9px] font-bold shadow-lg active:scale-95 cursor-pointer"
        >
          <MessageSquare size={16} />
          <span>대화</span>
        </motion.button>

        {/* Right: Duel */}
        <motion.button
          initial={{ scale: 0, x: 0 }}
          animate={{ scale: 1, x: 70 }}
          onClick={() => {
            triggerHaptic('heavy');
            onDuel();
            onClose();
          }}
          className="absolute w-12 h-12 rounded-full bg-rose-600 text-white flex flex-col items-center justify-center text-[9px] font-bold shadow-lg active:scale-95 cursor-pointer"
        >
          <Swords size={16} />
          <span>친선전</span>
        </motion.button>

        {/* Bottom: Gift */}
        <motion.button
          initial={{ scale: 0, y: 0 }}
          animate={{ scale: 1, y: 70 }}
          onClick={() => {
            triggerHaptic('medium');
            onGift();
            onClose();
          }}
          className="absolute w-12 h-12 rounded-full bg-emerald-600 text-white flex flex-col items-center justify-center text-[9px] font-bold shadow-lg active:scale-95 cursor-pointer"
        >
          <Gift size={16} />
          <span>선물</span>
        </motion.button>

        {/* Left: Profile */}
        <motion.button
          initial={{ scale: 0, x: 0 }}
          animate={{ scale: 1, x: -70 }}
          onClick={() => {
            triggerHaptic('selection');
            onProfile();
            onClose();
          }}
          className="absolute w-12 h-12 rounded-full bg-purple-600 text-white flex flex-col items-center justify-center text-[9px] font-bold shadow-lg active:scale-95 cursor-pointer"
        >
          <User size={16} />
          <span>정보</span>
        </motion.button>
      </div>
    </div>
  );
};
