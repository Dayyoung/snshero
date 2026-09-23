/**
 * CharacterReactionMotion.tsx - SCR-01-26
 * 감정표현 선택 시 캐릭터 맞춤 반응 모션 및 하트/홍조 파티클 오버레이
 */

import React from 'react';
import { motion } from 'motion/react';
import { CharacterEmotion } from './CharacterEmotionWheel';

interface CharacterReactionMotionProps {
  emotion: CharacterEmotion | null;
  onAnimationComplete: () => void;
}

export const CharacterReactionMotion: React.FC<CharacterReactionMotionProps> = ({
  emotion,
  onAnimationComplete,
}) => {
  if (!emotion) return null;

  const emotionMap: Record<CharacterEmotion, { emoji: string; text: string }> = {
    heart: { emoji: '💖', text: '두근두근! 친밀도 +10' },
    pet: { emoji: '✨', text: '기분 최고! 활력 +15' },
    cheer: { emoji: '🎉', text: '사기 충전! 공격력 +5%' },
    fire: { emoji: '🔥', text: '불타오르는 의지!' },
    laugh: { emoji: '😆', text: '하하하! 스트레스 해소' },
  };

  const item = emotionMap[emotion];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: -20, scale: 1.2 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      onAnimationComplete={onAnimationComplete}
      className="absolute top-1/3 inset-x-0 mx-auto w-max z-30 flex flex-col items-center pointer-events-none select-none font-mono"
    >
      <span className="text-4xl filter drop-shadow-md">{item.emoji}</span>
      <span className="text-xs font-black text-amber-300 bg-black/70 px-2.5 py-1 rounded-full border border-amber-400/40 mt-1 shadow-lg">
        {item.text}
      </span>
    </motion.div>
  );
};
