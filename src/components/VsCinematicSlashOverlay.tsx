/**
 * VsCinematicSlashOverlay.tsx - SCR-06-27
 * 대전 룸 매칭 성사 시 3초간 양측 대표 에이스 카드가 격돌하는 'VS 시네마틱 슬래시 연출' 도입,
 * 연승/상성 우세 엠블럼 효과 표시 및 승리 시 추가 랭크 포인트를 획득하는 '더블 다운(Double Down) 티켓' 베팅 시스템 연동.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Flame, Trophy, Zap, Shield, Check, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface VsCinematicSlashOverlayProps {
  isOpen: boolean;
  onComplete: (isDoubleDownBet: boolean) => void;
  playerName: string;
  playerAceCard: { name: string; power: number; element: string };
  playerWinStreak: number;
  opponentName: string;
  opponentAceCard: { name: string; power: number; element: string };
  opponentWinStreak: number;
  userDoubleDownTickets: number;
}

export const VsCinematicSlashOverlay: React.FC<VsCinematicSlashOverlayProps> = ({
  isOpen,
  onComplete,
  playerName,
  playerAceCard,
  playerWinStreak,
  opponentName,
  opponentAceCard,
  opponentWinStreak,
  userDoubleDownTickets,
}) => {
  const [isDoubleDownActive, setIsDoubleDownActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(3);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(3);
      setIsDoubleDownActive(false);
      return;
    }

    triggerHaptic('heavy');

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && secondsRemaining === 0) {
      onComplete(isDoubleDownActive);
    }
  }, [isOpen, secondsRemaining, isDoubleDownActive, onComplete]);

  if (!isOpen) return null;

  const toggleDoubleDown = () => {
    triggerHaptic('medium');
    setIsDoubleDownActive(!isDoubleDownActive);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 font-mono select-none overflow-hidden">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
          <Swords size={16} />
          <span>[ PVP RIVAL CLASH ]</span>
        </div>
        <div className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs text-slate-300 font-bold">
          전투 시작 {secondsRemaining}초 전
        </div>
      </div>

      {/* Center Cinematic Clash Arena */}
      <div className="relative w-full max-w-sm flex-1 flex flex-col items-center justify-center">
        {/* Diagonal Slash FX Line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: [0, 1, 0.6] }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="absolute w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent -rotate-12 z-20 shadow-[0_0_20px_rgba(251,191,36,1)]"
        />

        {/* Center VS Emblem */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="absolute z-30 w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 via-amber-500 to-yellow-400 flex items-center justify-center font-black text-2xl text-slate-950 shadow-[0_0_30px_rgba(239,68,68,0.7)] border-2 border-white"
        >
          VS
        </motion.div>

        {/* Player Left Side Card Card */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full flex items-center justify-between bg-slate-900/90 border border-blue-500/50 rounded-2xl p-3.5 mb-8 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-16 bg-blue-950 border border-blue-400 rounded-xl flex items-center justify-center text-2xl shadow">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">{playerName}</span>
                {playerWinStreak >= 2 && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black flex items-center gap-0.5">
                    <Flame size={10} /> {playerWinStreak}연승
                  </span>
                )}
              </div>
              <span className="text-[11px] text-blue-300 font-bold block mt-0.5">
                에이스: {playerAceCard.name}
              </span>
              <span className="text-[10px] text-slate-400">전투력 {playerAceCard.power}</span>
            </div>
          </div>
        </motion.div>

        {/* Opponent Right Side Card */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full flex items-center justify-between bg-slate-900/90 border border-rose-500/50 rounded-2xl p-3.5 mt-8 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-16 bg-rose-950 border border-rose-400 rounded-xl flex items-center justify-center text-2xl shadow">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">{opponentName}</span>
                {opponentWinStreak >= 2 && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-black flex items-center gap-0.5">
                    <Flame size={10} /> {opponentWinStreak}연승
                  </span>
                )}
              </div>
              <span className="text-[11px] text-rose-300 font-bold block mt-0.5">
                에이스: {opponentAceCard.name}
              </span>
              <span className="text-[10px] text-slate-400">전투력 {opponentAceCard.power}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Double Down Betting Option */}
      <div className="w-full max-w-sm flex flex-col gap-2 pb-2">
        <button
          type="button"
          onClick={toggleDoubleDown}
          className={`h-12 w-full rounded-xl font-black text-xs flex items-center justify-between px-4 border active:scale-95 cursor-pointer transition-all ${
            isDoubleDownActive
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.6)]'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap size={16} className={isDoubleDownActive ? 'text-slate-950' : 'text-amber-400'} />
            <div className="text-left">
              <span className="block text-xs">더블 다운(Double Down) 티켓</span>
              <span className="block text-[9px] opacity-80">승리 시 랭크 점수 2배 획득 (보유: {userDoubleDownTickets}장)</span>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded bg-black/20 text-[10px] font-black">
            {isDoubleDownActive ? '베팅 적용됨' : '베팅하기'}
          </div>
        </button>

        {/* Skip button (44px) */}
        <button
          type="button"
          onClick={() => onComplete(isDoubleDownActive)}
          className="h-11 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl active:scale-95 cursor-pointer"
        >
          즉시 전투 진입 (Skip)
        </button>
      </div>
    </div>
  );
};
