/**
 * MatchingQueueDualDock.tsx - SCR-06-26
 * 매칭 대기 연출을 화면 상단 펄스 미니 인디케이터(40px)로 축소하고,
 * 하단에 스와이프 가능한 '원탭 덱/룬 퀵 체인지 독(Thumb Zone)' 및 실시간 상대 밴픽/룰 가이드를 배치한 반응형 듀얼 레이아웃.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Shield, Zap, BookOpen, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface MatchingQueueDualDockProps {
  isSearching: boolean;
  queueTimeSeconds: number;
  onCancelQueue: () => void;
  activeDeckPresetIndex: number;
  onSelectDeckPreset: (presetIndex: number) => void;
  activeRunePreset: string;
  onSelectRunePreset: (rune: string) => void;
}

export const MatchingQueueDualDock: React.FC<MatchingQueueDualDockProps> = ({
  isSearching,
  queueTimeSeconds,
  onCancelQueue,
  activeDeckPresetIndex,
  onSelectDeckPreset,
  activeRunePreset,
  onSelectRunePreset,
}) => {
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  if (!isSearching) return null;

  const mins = Math.floor(queueTimeSeconds / 60);
  const secs = queueTimeSeconds % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const deckPresets = [
    { id: 0, label: '덱 1: 화염 버스트', icon: '🔥' },
    { id: 1, label: '덱 2: 수류 빙결', icon: '💧' },
    { id: 2, label: '덱 3: 대지 가디언', icon: '⛰️' },
  ];

  const runePresets = [
    { id: 'crit', label: '치명타 룬', icon: '⚡' },
    { id: 'shield', label: '수호 방벽', icon: '🛡️' },
    { id: 'vamp', label: '흡혈 룬', icon: '🩸' },
  ];

  return (
    <>
      {/* 1. Top Slim Pulsing Mini Indicator (40px) */}
      <div className="fixed top-2 inset-x-3 z-40 h-10 bg-slate-950/95 border border-cyan-500/50 rounded-xl px-3 flex items-center justify-between font-mono select-none shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <Radio size={14} className="text-cyan-400" />
          <span className="text-xs font-black text-cyan-300">
            상대 탐색 중... [{timeFormatted}]
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onCancelQueue();
          }}
          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-bold active:scale-95 cursor-pointer"
        >
          매칭 취소
        </button>
      </div>

      {/* 2. Bottom Thumb Zone: Quick Change Dock & Rules */}
      <div className="fixed bottom-3 inset-x-3 z-40 bg-slate-950/95 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2.5 font-mono select-none shadow-2xl backdrop-blur-md">
        {/* Toggle Rule Guide Header */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1 font-bold">
            <Zap size={14} className="text-amber-400" />
            <span>대기 중 덱/룬 빠른 교체</span>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsRulesExpanded(!isRulesExpanded);
            }}
            className="text-[10px] text-slate-400 flex items-center gap-0.5 hover:text-slate-200 cursor-pointer"
          >
            <BookOpen size={12} />
            <span>룰 가이드</span>
            {isRulesExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
        </div>

        {/* Expandable Rules Guide */}
        <AnimatePresence>
          {isRulesExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] text-slate-300 space-y-1 overflow-hidden"
            >
              <div className="font-bold text-amber-300">⚔️ 배틀 아레나 공식 대전 룰</div>
              <div>• 턴당 15초 제한 시간 (시간 초과 시 자동 추천 착수)</div>
              <div>• 화 &gt; 풍 &gt; 지 &gt; 수 &gt; 화 4대 속성 상성 연쇄 플립 가산</div>
              <div>• 최종 9턴 완료 후 5장 이상 선점한 플레이어 승리</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deck Preset Quick Switcher (44px Targets) */}
        <div className="grid grid-cols-3 gap-1.5">
          {deckPresets.map((preset) => {
            const isSelected = activeDeckPresetIndex === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onSelectDeckPreset(preset.id);
                }}
                className={`h-11 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 border active:scale-95 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{preset.icon}</span>
                <span className="truncate">{preset.label.split(':')[0]}</span>
                {isSelected && <Check size={12} className="shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Rune Preset Quick Switcher */}
        <div className="grid grid-cols-3 gap-1.5">
          {runePresets.map((rune) => {
            const isSelected = activeRunePreset === rune.id;
            return (
              <button
                key={rune.id}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onSelectRunePreset(rune.id);
                }}
                className={`h-9 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border active:scale-95 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-slate-300'
                }`}
              >
                <span>{rune.icon}</span>
                <span className="truncate">{rune.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
