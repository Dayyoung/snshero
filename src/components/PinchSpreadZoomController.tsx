/**
 * PinchSpreadZoomController.tsx - SCR-06-20
 * 두 손가락 핀치 제스처로 호가 틱 단위(1/5/10/50원)를 즉각 변경하는 줌 컨트롤러
 */

import React, { useRef } from 'react';
import { triggerHaptic } from '../lib/haptic';

export type TickUnit = 1 | 5 | 10 | 50;

interface PinchSpreadZoomControllerProps {
  currentTick: TickUnit;
  onChangeTick: (tick: TickUnit) => void;
  children: React.ReactNode;
}

export const PinchSpreadZoomController: React.FC<PinchSpreadZoomControllerProps> = ({
  currentTick,
  onChangeTick,
  children,
}) => {
  const initialDistRef = useRef<number | null>(null);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      if (initialDistRef.current === null) {
        initialDistRef.current = dist;
      } else {
        const delta = dist - initialDistRef.current;
        if (Math.abs(delta) > 40) {
          triggerHaptic('selection');
          if (delta > 0) {
            // Zoom in -> smaller tick
            if (currentTick === 50) onChangeTick(10);
            else if (currentTick === 10) onChangeTick(5);
            else if (currentTick === 5) onChangeTick(1);
          } else {
            // Zoom out -> larger tick
            if (currentTick === 1) onChangeTick(5);
            else if (currentTick === 5) onChangeTick(10);
            else if (currentTick === 10) onChangeTick(50);
          }
          initialDistRef.current = dist;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    initialDistRef.current = null;
  };

  return (
    <div
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full select-none"
    >
      {children}
    </div>
  );
};
