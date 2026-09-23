/**
 * PassClaimAllPulseDock.tsx - SCR-10-26
 * 하단 Thumb Zone에 '원탭 전체 수령(Claim All) 펄스 플로팅 독(52px)' 배치 및
 * 패스 트랙 상단에 '현재 내 레벨 즉시 점프' 앵커 버튼과 레벨업 게이지 HUD 반응형 통합.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowDownToLine, Zap, Navigation, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface PassClaimAllPulseDockProps {
  currentPassLevel: number;
  currentExp: number;
  maxExpForLevel: number;
  unclaimedCount: number;
  onClaimAll: () => void;
  onJumpToCurrentLevel: () => void;
}

export const PassClaimAllPulseDock: React.FC<PassClaimAllPulseDockProps> = ({
  currentPassLevel,
  currentExp,
  maxExpForLevel,
  unclaimedCount,
  onClaimAll,
  onJumpToCurrentLevel,
}) => {
  const expPercent = Math.min(100, Math.floor((currentExp / maxExpForLevel) * 100));

  return (
    <>
      {/* 1. Top HUD: Jump Anchor & Level Progress */}
      <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5 px-3 flex items-center justify-between font-mono select-none shadow-md mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow">
            {currentPassLevel}
          </div>
          <div className="text-left">
            <span className="text-[10px] text-slate-400 block font-bold">배틀패스 시즌 1</span>
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Jump Anchor Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onJumpToCurrentLevel();
          }}
          className="h-8 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-[10px] font-bold rounded-xl flex items-center gap-1 active:scale-95 cursor-pointer shadow"
        >
          <Navigation size={12} />
          <span>내 레벨로 이동 (Lv.{currentPassLevel})</span>
        </button>
      </div>

      {/* 2. Bottom Thumb Zone: Claim All Pulse Floating Dock (52px) */}
      {unclaimedCount > 0 && (
        <div className="fixed bottom-3 inset-x-4 z-40 font-mono select-none">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onClaimAll();
            }}
            className="h-13 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-between px-4 shadow-2xl active:scale-95 cursor-pointer border-2 border-amber-300 animate-pulse hover:brightness-105"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <span className="text-xs font-black">수령 대기 보상 일괄 받기</span>
            </div>

            <div className="px-3 py-1 rounded-xl bg-slate-950 text-amber-400 text-[11px] font-black flex items-center gap-1 shadow">
              <ArrowDownToLine size={13} />
              <span>{unclaimedCount}개 전체 수령</span>
            </div>
          </button>
        </div>
      )}
    </>
  );
};
