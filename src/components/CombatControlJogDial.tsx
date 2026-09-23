import React, { useState, useRef, useCallback } from 'react';
import { FastForward, Zap, Bot } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { AutoBattleHapticToggle } from './AutoBattleHapticToggle';

export interface CombatControlJogDialProps {
  speed: 1 | 2 | 3;
  onSpeedChange: (speed: 1 | 2 | 3) => void;
  isAuto: boolean;
  onToggleAuto: () => void;
  className?: string;
  id?: string;
}

export const CombatControlJogDial: React.FC<CombatControlJogDialProps> = ({
  speed,
  onSpeedChange,
  isAuto,
  onToggleAuto,
  className = '',
  id = 'combat-control-jog-dial-container'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Rotate through 1x -> 2x -> 3x
  const handleNextSpeed = useCallback(() => {
    const nextSpeed: 1 | 2 | 3 = speed === 1 ? 2 : speed === 2 ? 3 : 1;
    triggerHaptic(nextSpeed === 3 ? 'heavy' : 'tap');
    onSpeedChange(nextSpeed);
  }, [speed, onSpeedChange]);

  // Touch handlers for upward swipe gesture (Swipe up -> Instant 3x Turbo)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartYRef.current = touch.clientY;
    touchStartXRef.current = touch.clientX;
    setIsDragging(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current !== null) {
      const touch = e.changedTouches[0];
      const deltaY = touch.clientY - touchStartYRef.current;
      const deltaX = touch.clientX - (touchStartXRef.current ?? touch.clientX);

      // Swiped UP significantly (negative deltaY, > 25px)
      if (deltaY < -25 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (speed !== 3) {
          triggerHaptic('special');
          onSpeedChange(3);
        }
      }
    }
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    setIsDragging(false);
  };

  // Dial rotation angle by speed: 1x = -30deg, 2x = 0deg, 3x = +30deg
  const dialRotation = speed === 1 ? -30 : speed === 2 ? 0 : 30;

  return (
    <div
      id={id}
      className={`relative flex items-center gap-2 select-none z-30 ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── 52px Semicircular Haptic Jog Dial ─── */}
      <div className="relative flex flex-col items-center">
        {/* Swipe Up Hint indicator when not at 3x */}
        {speed !== 3 && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-amber-400/80 uppercase tracking-tighter whitespace-nowrap animate-pulse pointer-events-none">
            ↑ SWIPE 3X
          </div>
        )}

        <button
          id="combat-jog-wheel-button"
          type="button"
          onClick={handleNextSpeed}
          className={`group relative w-[52px] h-[52px] rounded-full border flex items-center justify-center transition-all duration-200 active:scale-90 shadow-md ${
            speed === 3
              ? 'bg-rose-950/80 border-rose-500/70 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.35)]'
              : speed === 2
              ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'bg-slate-900/90 border-white/20 text-slate-200'
          } ${isDragging ? 'ring-2 ring-amber-400/60' : ''}`}
          aria-label={`전투 속도 변경 (현재 ${speed}배속)`}
          title="탭: 배속 순환 | 위로 스와이프: 즉시 3배속"
        >
          {/* Dial Arc Ticks (1x, 2x, 3x notches) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 52 52"
          >
            {/* 1x tick */}
            <line
              x1="12" y1="36" x2="16" y2="33"
              stroke={speed === 1 ? '#38bdf8' : '#64748b'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* 2x tick */}
            <line
              x1="26" y1="6" x2="26" y2="11"
              stroke={speed === 2 ? '#fbbf24' : '#64748b'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* 3x tick */}
            <line
              x1="40" y1="36" x2="36" y2="33"
              stroke={speed === 3 ? '#f43f5e' : '#64748b'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {/* Internal rotating pointer wheel */}
          <div
            className="relative flex flex-col items-center justify-center transition-transform duration-200"
            style={{ transform: `rotate(${dialRotation}deg)` }}
          >
            <div className="flex items-center">
              {speed === 3 ? (
                <Zap className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
              ) : (
                <FastForward className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="w-1 h-2 bg-white/40 rounded-full mt-0.5" />
          </div>

          {/* Center Speed Badge */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-mono font-black text-xs tracking-tighter mt-4 drop-shadow">
              {speed}x
            </span>
          </div>
        </button>

        {/* Speed Label below wheel */}
        <span className="text-[10px] font-mono text-slate-400 mt-0.5 tracking-tight">
          {speed === 3 ? 'TURBO' : speed === 2 ? 'FAST' : 'NORMAL'}
        </span>
      </div>

      {/* ─── Integrated Auto Battle Toggle ─── */}
      <AutoBattleHapticToggle
        id="combat-jog-auto-toggle"
        isAuto={isAuto}
        onToggle={onToggleAuto}
        compact={true}
        className="h-[44px] shadow-sm"
      />
    </div>
  );
};
