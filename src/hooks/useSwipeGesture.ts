import { useState, useRef, useCallback, TouchEvent } from 'react';

interface SwipeConfig {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipeGesture({
  threshold = 30,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
}: SwipeConfig) {
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isSwiping = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isSwiping.current = true;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwiping.current || !touchStartPos.current) return;
  }, []);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    if (!isSwiping.current || !touchStartPos.current) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const diffX = touchStartPos.current.x - endX;
    const diffY = touchStartPos.current.y - endY;

    // 수평 스와이프가 수직 스와이프보다 명확할 때만 동작
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) >= threshold) {
        if (diffX > 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    } else {
      if (Math.abs(diffY) >= threshold) {
        if (diffY > 0) {
          onSwipeUp?.();
        } else {
          onSwipeDown?.();
        }
      }
    }

    touchStartPos.current = null;
    isSwiping.current = false;
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
