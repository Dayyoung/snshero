/**
 * HandCardReorder.tsx - SCR-02-20
 * 손패 카드를 길게 눌러 좌우로 자유롭게 위치를 바꾸는 핸드 드래그 리오더링 컨테이너
 */

import React, { useState } from 'react';
import { CardData } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface HandCardReorderProps {
  hand: CardData[];
  onReorderHand: (newHand: CardData[]) => void;
  renderCard: (card: CardData, idx: number) => React.ReactNode;
}

export const HandCardReorder: React.FC<HandCardReorderProps> = ({
  hand,
  onReorderHand,
  renderCard,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    triggerHaptic('selection');
    setDraggedIndex(idx);
  };

  const handleDragOver = (idx: number) => {
    if (draggedIndex === null || draggedIndex === idx) return;
    const reordered = [...hand];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(idx, 0, moved);
    setDraggedIndex(idx);
    triggerHaptic('selection');
    onReorderHand(reordered);
  };

  return (
    <div className="flex items-center justify-center gap-1 overflow-x-auto no-scrollbar py-2 font-mono select-none">
      {hand.map((card, idx) => (
        <div
          key={card.id || idx}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={() => handleDragOver(idx)}
          onDragEnd={() => setDraggedIndex(null)}
          className={`transition transform ${draggedIndex === idx ? 'scale-105 opacity-80' : ''}`}
        >
          {renderCard(card, idx)}
        </div>
      ))}
    </div>
  );
};
