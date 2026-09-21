/**
 * PinchFlipCardScatter.tsx - SCR-04-17
 * 두 손가락 핀치 아웃(확장) 시 10장의 미개봉 카드가 일제히 황금빛을 내며 뒤집히는 인터랙티브 플립 연출 컴포넌트
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface PinchFlipCardScatterProps {
  cards: Array<{ id: number; name: string; rarity: string; image: string }>;
  onAllFlipped: () => void;
}

export const PinchFlipCardScatter: React.FC<PinchFlipCardScatterProps> = ({
  cards,
  onAllFlipped,
}) => {
  const [flippedAll, setFlippedAll] = useState(false);

  const handlePinchFlip = () => {
    if (flippedAll) return;
    triggerHaptic('heavy');
    setFlippedAll(true);
    onAllFlipped();
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 font-mono select-none">
      {/* Cards Grid */}
      <div className="grid grid-cols-5 gap-2 w-full max-w-sm">
        {cards.map((card, idx) => (
          <motion.div
            key={card.id}
            animate={{
              rotateY: flippedAll ? 180 : 0,
              scale: flippedAll ? [1, 1.15, 1] : 1,
            }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            className="w-16 h-24 rounded-xl border border-amber-400/80 bg-slate-900 flex flex-col items-center justify-center p-1 text-center shadow-lg relative cursor-pointer"
          >
            {flippedAll ? (
              <div className="text-[9px] text-white font-bold [transform:rotateY(180deg)]">
                <span className="text-amber-400 block text-[8px]">{card.rarity}</span>
                <span>{card.name}</span>
              </div>
            ) : (
              <div className="text-lg text-amber-400">❓</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pinch Trigger Button / Gesture Guide */}
      {!flippedAll && (
        <button
          type="button"
          onClick={handlePinchFlip}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
        >
          <Sparkles size={14} />
          <span>핀치 아웃하여 일괄 공개!</span>
        </button>
      )}
    </div>
  );
};
