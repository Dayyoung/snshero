/**
 * DimensionRiftHiddenDungeonModal.tsx - SCR-02-30
 * 스테이지 클리어 시 일정 확률로 2시간 동안 숨겨진 '차원 균열 히든 보물 던전'이 출현하는 인터랙티브 탐험 이벤트 및
 * 챕터 3별 완벽 클리어 시 전용 '챕터 정복 기념 SSR 룬 돌파 팩(2,200원 타임딜)' 기간 한정 연동.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Clock, Compass, Trophy, Zap, X, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface DimensionRiftHiddenDungeonModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle: string;
  isAllThreeStars: boolean;
  onEnterHiddenDungeon: () => void;
  onBuyChapterConquestPack: () => void;
}

export const DimensionRiftHiddenDungeonModal: React.FC<DimensionRiftHiddenDungeonModalProps> = ({
  isOpen,
  onClose,
  chapterTitle,
  isAllThreeStars,
  onEnterHiddenDungeon,
  onBuyChapterConquestPack,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(7200); // 2 hours
  const [hasBoughtPack, setHasBoughtPack] = useState(() => {
    return localStorage.getItem('hero_chapter_conquest_pack') === 'purchased';
  });

  useEffect(() => {
    if (!isOpen) return;
    triggerHaptic('heavy');

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleBuy = () => {
    triggerHaptic('heavy');
    localStorage.setItem('hero_chapter_conquest_pack', 'purchased');
    setHasBoughtPack(true);
    onBuyChapterConquestPack();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-950 border-2 border-purple-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 text-white flex items-center justify-between font-black text-xs">
          <div className="flex items-center gap-1.5">
            <Compass size={16} />
            <span>[ 차원 균열 히든 보물 던전 발견! ]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-black/20 flex items-center justify-center cursor-pointer active:scale-95"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-400 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse">
            🌀
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-xs text-rose-400 font-bold bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-500/30 mb-2">
              <Clock size={12} />
              <span>차원 균열 붕괴까지 {timeStr}</span>
            </div>
            <h3 className="text-sm font-black text-white">비밀 보물 던전이 열렸습니다!</h3>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              2시간 동안만 입장 가능한 특별 차원 균열입니다.
              <br />
              클리어 시 <strong className="text-purple-300">희귀 진화석 3종 + 대량의 골드</strong> 획득!
            </p>
          </div>

          {/* Enter Dungeon Button (48px) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onEnterHiddenDungeon();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg hover:brightness-105"
          >
            <Zap size={16} />
            <span>차원 균열 즉시 탐험 (ENTER)</span>
          </button>

          {/* 3-Star Chapter Conquest Pack (2,200 KRW / 220 SNS) */}
          {isAllThreeStars && (
            <div className="w-full p-3 bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <Trophy size={13} /> {chapterTitle} 완벽 정복 팩
                </span>
                <span className="text-[9px] text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/30">
                  3별 기념
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                SSR 룬 선택 상자 1개 + 룬 강화석 50개 + 100 다이아 (2,200원 / 220 SNS)
              </p>
              <div className="flex justify-end pt-1">
                {hasBoughtPack ? (
                  <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <Check size={14} /> 구매 완료
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleBuy}
                    className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-black rounded-lg active:scale-95 cursor-pointer shadow"
                  >
                    구매하기
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl active:scale-95 cursor-pointer border border-slate-800"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
};
