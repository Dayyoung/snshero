/**
 * CardSpringRig.tsx - SCR-02-13
 * Pointer Raw Update 및 스프링 틸트 물리 기반 60fps 무감속 카드 시뮬레이션 래퍼
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface CardSpringRigProps {
  children: React.ReactNode;
  className?: string;
  onDragEnd?: (x: number, y: number) => void;
}

export const CardSpringRig: React.FC<CardSpringRigProps> = ({
  children,
  className = '',
  onDragEnd,
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { startX: e.clientX, startY: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    setOffset({ x: dx, y: dy });
    setTilt({
      x: Math.max(-20, Math.min(20, dy * 0.15)),
      y: Math.max(-20, Math.min(20, -dx * 0.15)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (onDragEnd) {
      onDragEnd(offset.x, offset.y);
    }
    // 스프링 복귀
    setOffset({ x: 0, y: 0 });
    setTilt({ x: 0, y: 0 });
  };

  return (
    <motion.div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      animate={{
        x: offset.x,
        y: offset.y,
        rotateX: tilt.x,
        rotateY: tilt.y,
        scale: isDragging ? 1.05 : 1.0,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        mass: 0.8,
      }}
      className={`touch-none cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ perspective: 1000 }}
    >
      {children}
    </motion.div>
  );
};
