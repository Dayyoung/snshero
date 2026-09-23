/**
 * CharacterEmotionWheel.tsx - SCR-01-26
 * 캐릭터 롱프레스 시 펼쳐지는 5가지 감정 래디얼 링 (48px)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Heart, Smile, Sparkles, ThumbsUp, Flame, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export type CharacterEmotion = 'cheer' | 'pet' | 'heart' | 'fire' | 'laugh';

interface CharacterEmotionWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmotion: (emotion: CharacterEmotion) => void;
}

export const CharacterEmotionWheel: React.FC<CharacterEmotionWheelProps> = ({
  isOpen,
  onClose,
  onSelectEmotion,
}) => {
  if (!isOpen) return null;

  const emotions: { id: CharacterEmotion; label: string; icon: string }[] = [
    { id: 'heart', label: '하트', icon: '💖' },
    { id: 'pet', label: '쓰다듬기', icon: '✋' },
    { id: 'cheer', label: '응원', icon: '📣' },
    { id: 'fire', label: '열정', icon: '🔥' },
    { id: 'laugh', label: '미소', icon: '😄' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="relative w-64 h-64 flex items-center justify-center"
      >
        <button
          type="button"
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-slate-400 cursor-pointer shadow-xl z-20"
        >
          <X size={18} />
        </button>

        {emotions.map((e, idx) => {
          const angle = (idx / emotions.length) * Math.PI * 2 - Math.PI / 2;
          const radius = 80;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.button
              key={e.id}
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onSelectEmotion(e.id);
                onClose();
              }}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              className="absolute w-12 h-12 rounded-full bg-amber-400 text-slate-950 font-bold flex flex-col items-center justify-center shadow-xl active:scale-95 cursor-pointer z-10"
            >
              <span className="text-base">{e.icon}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
