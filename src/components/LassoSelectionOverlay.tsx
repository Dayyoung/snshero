/**
 * LassoSelectionOverlay.tsx - SCR-03-20
 * 손가락으로 영역을 둘러싸면 다수의 카드가 한 번에 선택되는 라쏘(Lasso) 올가미 터치 제스처 오버레이
 */

import React, { useRef, useState } from 'react';
import { triggerHaptic } from '../lib/haptic';

interface Point {
  x: number;
  y: number;
}

interface LassoSelectionOverlayProps {
  isActive: boolean;
  onSelectCardsInBounds: (bounds: { minX: number; maxX: number; minY: number; maxY: number }) => void;
  children: React.ReactNode;
}

export const LassoSelectionOverlay: React.FC<LassoSelectionOverlayProps> = ({
  isActive,
  onSelectCardsInBounds,
  children,
}) => {
  const [points, setPoints] = useState<Point[]>([]);
  const isDrawingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isActive) return;
    isDrawingRef.current = true;
    const touch = e.touches[0];
    setPoints([{ x: touch.clientX, y: touch.clientY }]);
    triggerHaptic('selection');
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isActive || !isDrawingRef.current) return;
    const touch = e.touches[0];
    setPoints((prev) => [...prev, { x: touch.clientX, y: touch.clientY }]);
  };

  const handleTouchEnd = () => {
    if (!isActive || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (points.length > 2) {
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      triggerHaptic('medium');
      onSelectCardsInBounds({ minX, maxX, minY, maxY });
    }

    setPoints([]);
  };

  return (
    <div
      className="relative w-full h-full select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}

      {/* SVG Lasso Path Visualization */}
      {isActive && points.length > 1 && (
        <svg className="fixed inset-0 pointer-events-none z-50 w-full h-full">
          <polyline
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="rgba(245, 158, 11, 0.15)"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>
      )}
    </div>
  );
};
