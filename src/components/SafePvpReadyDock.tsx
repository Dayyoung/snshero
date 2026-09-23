/**
 * SafePvpReadyDock.tsx - SCR-06-29
 * 우측 하단 Thumb Zone에 초대형 펄스 READY 액션 버튼(60px) 고정하고,
 * 퇴장 버튼은 상단 좌측 미니 백 버튼에 '1초 롱프레스 홀드' 안전장치를 적용하여 물리적 분리.
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Swords, ArrowLeft, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SafePvpReadyDockProps {
  isReady: boolean;
  onToggleReady: () => void;
  onConfirmExit: () => void;
  opponentReady: boolean;
}

export const SafePvpReadyDock: React.FC<SafePvpReadyDockProps> = ({
  isReady,
  onToggleReady,
  onConfirmExit,
  opponentReady,
}) => {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<any>(null);

  const startHold = () => {
    triggerHaptic('light');
    let elapsed = 0;
    holdIntervalRef.current = setInterval(() => {
      elapsed += 50;
      const pct = Math.min(100, Math.floor((elapsed / 1000) * 100));
      setHoldProgress(pct);
      if (pct >= 100) {
        clearInterval(holdIntervalRef.current);
        triggerHaptic('heavy');
        onConfirmExit();
      }
    }, 50);
  };

  const stopHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  return (
    <>
      {/* 1. Top-Left 1-Second Hold Safe Exit Button */}
      <div className="fixed top-3 left-3 z-40 font-mono select-none">
        <div
          onMouseDown={startHold}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={startHold}
          onTouchEnd={stopHold}
          className="relative h-10 px-3 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 flex items-center gap-1.5 cursor-pointer shadow backdrop-blur-sm active:scale-95 overflow-hidden"
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-rose-600/50 transition-all pointer-events-none"
            style={{ width: `${holdProgress}%` }}
          />

          <ArrowLeft size={14} className="z-10" />
          <span className="text-[10px] font-bold z-10">
            {holdProgress > 0 ? `홀드 중.. (${holdProgress}%)` : '길게 눌러 퇴장 (1초)'}
          </span>
        </div>
      </div>

      {/* 2. Bottom Right Thumb Zone: 60px Giant Pulse READY Button */}
      <div className="fixed bottom-4 right-4 z-40 font-mono select-none flex items-center gap-3">
        {/* Opponent Ready Status Badge */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] shadow">
          <span className="text-slate-400 block text-[9px]">상대방 준비</span>
          <span
            className={`font-black ${opponentReady ? 'text-emerald-400' : 'text-amber-400'}`}
          >
            {opponentReady ? 'READY ✓' : '대기 중..'}
          </span>
        </div>

        {/* 60px Circular Giant READY Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            triggerHaptic('heavy');
            onToggleReady();
          }}
          className={`w-16 h-16 rounded-full font-black flex flex-col items-center justify-center border-2 cursor-pointer shadow-2xl relative transition-all ${
            isReady
              ? 'bg-emerald-500 text-slate-950 border-white shadow-[0_0_20px_rgba(16,185,129,0.7)]'
              : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 border-white shadow-[0_0_20px_rgba(245,158,11,0.6)]'
          }`}
        >
          {/* Pulsing ring when not ready */}
          {!isReady && (
            <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-60 pointer-events-none" />
          )}

          {isReady ? <Check size={24} /> : <Swords size={22} />}
          <span className="text-[10px] leading-tight font-black mt-0.5">
            {isReady ? '준비완료' : 'READY'}
          </span>
        </motion.button>
      </div>
    </>
  );
};
