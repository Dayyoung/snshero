/**
 * GuildRaidModularLayout.tsx - SCR-09-26
 * 100dvh 공간 3단 모듈형 재설계: 상단 '보스 기믹 HUD(44px)', 중단 '다이내믹 보스 캔버스',
 * 하단 Thumb Zone에 슬라이드형 '원터치 속성 덱 스위처 & 퀵 버프 패널(52px)' 배치 및 채팅창 플로팅 버블 토글 분리.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Flame, MessageSquare, Zap, ChevronUp, ChevronDown, Check, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface GuildRaidModularLayoutProps {
  bossName: string;
  bossCurrentHp: number;
  bossMaxHp: number;
  bossGimmickText: string;
  bossWeaknessElement: string;
  groggyPercent: number;
  activeDeckIndex: number;
  onSelectDeck: (index: number) => void;
  onUseQuickBuff: (buffId: string) => void;
  onAttack: () => void;
  recentChatMessage?: string;
}

export const GuildRaidModularLayout: React.FC<GuildRaidModularLayoutProps> = ({
  bossName,
  bossCurrentHp,
  bossMaxHp,
  bossGimmickText,
  bossWeaknessElement,
  groggyPercent,
  activeDeckIndex,
  onSelectDeck,
  onUseQuickBuff,
  onAttack,
  recentChatMessage,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const hpPercent = Math.max(0, Math.min(100, Math.floor((bossCurrentHp / bossMaxHp) * 100)));

  const deckList = [
    { id: 0, label: '수류 빙결덱', element: '💧', desc: '화염 보스 카운터' },
    { id: 1, label: '화염 폭격덱', element: '🔥', desc: '바람 보스 카운터' },
    { id: 2, label: '대지 방어덱', element: '⛰️', desc: '지속 생존력 특화' },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 font-mono select-none overflow-hidden relative">
      {/* 1. Top Boss Gimmick HUD (44px) */}
      <div className="w-full h-11 bg-slate-950/90 border border-amber-500/40 rounded-xl px-3 flex items-center justify-between shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-black text-white">{bossName}</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
            약점: {bossWeaknessElement}
          </span>
        </div>

        <div className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
          <Zap size={13} />
          <span>{bossGimmickText}</span>
        </div>
      </div>

      {/* 2. Middle Dynamic Boss Canvas & HP / Groggy Gauge */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-2">
        {/* Boss HP Bar */}
        <div className="w-full max-w-sm mb-2 space-y-1">
          <div className="flex justify-between text-[11px] text-slate-300 font-bold px-1">
            <span>보스 HP</span>
            <span className="text-rose-400 font-black">{hpPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-900 border border-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 transition-all duration-300"
              style={{ width: `${hpPercent}%` }}
            />
          </div>

          {/* Groggy Bar */}
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-200"
              style={{ width: `${groggyPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-cyan-400 text-right block font-bold">
            그로기 피버 게이지 {groggyPercent}%
          </span>
        </div>

        {/* Boss Monster Core Visual Representation */}
        <div className="relative w-44 h-44 rounded-3xl bg-slate-950 border-2 border-rose-500/60 flex items-center justify-center text-7xl shadow-[0_0_40px_rgba(244,63,94,0.3)]">
          🐉
          {groggyPercent >= 100 && (
            <div className="absolute inset-0 bg-cyan-500/20 rounded-3xl border-2 border-cyan-400 animate-pulse flex items-center justify-center font-black text-cyan-300 text-sm">
              ⚡ GROGGY TIME ⚡
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Thumb Zone: 1-Touch Element Deck Switcher & Quick Attack (52px) */}
      <div className="w-full bg-slate-950/95 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 shadow-2xl backdrop-blur-md">
        {/* Sliding 3 Deck Switcher */}
        <div className="grid grid-cols-3 gap-1.5">
          {deckList.map((deck) => {
            const isSelected = activeDeckIndex === deck.id;
            return (
              <button
                key={deck.id}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onSelectDeck(deck.id);
                }}
                className={`h-10 px-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 border active:scale-95 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{deck.element}</span>
                <span className="truncate">{deck.label}</span>
                {isSelected && <Check size={12} />}
              </button>
            );
          })}
        </div>

        {/* 52px Attack Action Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            onAttack();
          }}
          className="h-13 w-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg hover:brightness-105"
        >
          <Flame size={18} />
          <span>길드 총공격 시전 (ATTACK)</span>
        </button>
      </div>

      {/* Floating Chat Bubble Toggle */}
      <div className="fixed bottom-24 right-3 z-30 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-64 p-3 bg-slate-950 border border-slate-800 rounded-2xl mb-2 text-[10px] text-slate-300 shadow-2xl space-y-1.5"
            >
              <div className="font-bold text-amber-300">💬 실시간 길드원 응원 채팅</div>
              <p className="bg-slate-900 p-2 rounded-lg text-slate-200">
                {recentChatMessage || '길드장: 보스 화염 패턴 시 수류 빙결덱으로 전환하세요!'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsChatOpen(!isChatOpen);
          }}
          className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
        >
          <MessageSquare size={18} />
        </button>
      </div>
    </div>
  );
};
