/**
 * SpectatorModal.tsx
 * 실시간 대전 관전(Spectator Mode) 진입 모달
 * (백로그 ID 470: 친구 목록 내 실시간 대전 관전 진입 버튼)
 */

import React, { useState } from 'react';
import { Eye, Swords, User, Play, X } from 'lucide-react';

interface SpectatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendName: string;
  opponentName?: string;
  onEnterSpectator: () => void;
  language?: string;
}

export const SpectatorModal: React.FC<SpectatorModalProps> = ({
  isOpen,
  onClose,
  friendName,
  opponentName = 'Mystic_Duelist',
  onEnterSpectator,
  language = 'ko',
}) => {
  if (!isOpen) return null;
  const isKo = language === 'ko';

  return (
    <div className="fixed inset-0 z-[10030] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d]/20 dark:border-white/20 p-5 rounded-none max-w-sm w-full shadow-2xl space-y-4 text-[#201d1d] dark:text-[#fdfcfc]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/10 dark:border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-amber-500" />
            <h3 className="font-black text-sm uppercase tracking-wider">
              {isKo ? '실시간 대전 관전' : 'Live Spectator Mode'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/5 dark:hover:bg-white/5 cursor-pointer text-xs"
          >
            [x]
          </button>
        </div>

        {/* Live Match Info */}
        <div className="bg-[#201d1d]/5 dark:bg-white/5 p-4 border border-[#201d1d]/10 dark:border-white/10 text-center space-y-2.5">
          <div className="inline-block px-2 py-0.5 bg-red-600 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">
            LIVE MATCH
          </div>
          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <span className="text-amber-600 dark:text-amber-400">{friendName}</span>
            <span className="text-stone-400 text-[10px]">VS</span>
            <span className="text-cyan-600 dark:text-cyan-400">{opponentName}</span>
          </div>
          <p className="text-[10px] opacity-75">
            {isKo ? '현재 3x3 보드 4턴 진행 중 (점유: 5 vs 4)' : 'Current Turn 4 in progress (Tiles: 5 vs 4)'}
          </p>
        </div>

        {/* CTA */}
        <div className="pt-1 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs border border-[#201d1d]/20 dark:border-white/20 hover:bg-[#201d1d]/5 font-bold cursor-pointer"
          >
            {isKo ? '취소' : 'Cancel'}
          </button>
          <button
            onClick={() => {
              onClose();
              onEnterSpectator();
            }}
            className="flex-1 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-black cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
          >
            <Play size={12} className="fill-stone-950" />
            <span>{isKo ? '관전 입장' : 'Watch Live'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
