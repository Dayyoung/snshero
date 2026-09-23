/**
 * StoryMapQuickJumpHUD.tsx - SCR-02-29
 * 맵 진입 시 '현재 진행 스테이지 자동 부드러운 포커싱(Smooth Auto-Focus)' 지원,
 * 하단 Thumb Zone에 '현재/다음 스테이지 즉시 출격 퀵 점프 플로팅 HUD(48px)' 및 챕터 미니맵 아코디언 구축.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Play, MapPin, ChevronUp, ChevronDown, Sparkles, Swords, Star } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface StoryMapQuickJumpHUDProps {
  currentStageNumber: number;
  currentStageName: string;
  isBossStage: boolean;
  totalStars: number;
  onJumpToCurrentStage: () => void;
  onInstantLaunchStage: () => void;
  chapters: { id: number; title: string; clearedCount: number; totalCount: number }[];
  onSelectChapter: (chapterId: number) => void;
}

export const StoryMapQuickJumpHUD: React.FC<StoryMapQuickJumpHUDProps> = ({
  currentStageNumber,
  currentStageName,
  isBossStage,
  totalStars,
  onJumpToCurrentStage,
  onInstantLaunchStage,
  chapters,
  onSelectChapter,
}) => {
  const [isChapterAccordionOpen, setIsChapterAccordionOpen] = useState(false);

  return (
    <>
      {/* Top Left Mini Stars HUD */}
      <div className="fixed top-12 left-3 z-30 bg-slate-950/80 border border-slate-800 rounded-full px-3 py-1 flex items-center gap-1.5 text-xs text-amber-300 font-bold font-mono shadow backdrop-blur-sm">
        <Star size={13} className="fill-amber-400 text-amber-400" />
        <span>별 {totalStars}개 획득</span>
      </div>

      {/* Chapter Minimap Accordion Trigger (Top Right) */}
      <div className="fixed top-12 right-3 z-30 font-mono select-none">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsChapterAccordionOpen(!isChapterAccordionOpen);
          }}
          className="h-8 px-3 rounded-full bg-slate-950/90 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer shadow backdrop-blur-sm"
        >
          <span>챕터 목록</span>
          {isChapterAccordionOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        <AnimatePresence>
          {isChapterAccordionOpen && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute right-0 top-10 w-56 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl space-y-1"
            >
              {chapters.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectChapter(ch.id);
                    setIsChapterAccordionOpen(false);
                  }}
                  className="w-full p-2 rounded-xl text-left bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex justify-between items-center text-[11px] cursor-pointer"
                >
                  <span className="font-bold text-white truncate">{ch.title}</span>
                  <span className="text-amber-400 font-black text-[10px]">
                    {ch.clearedCount}/{ch.totalCount}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Thumb Zone: 48px Quick Jump & Instant Launch HUD */}
      <div className="fixed bottom-4 inset-x-3 z-30 font-mono select-none">
        <div className="w-full bg-slate-950/95 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between shadow-2xl backdrop-blur-md">
          {/* Stage Info & Auto-Focus Jump Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onJumpToCurrentStage();
            }}
            className="flex items-center gap-2.5 text-left active:scale-95 cursor-pointer"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow ${
                isBossStage
                  ? 'bg-rose-600 text-white border border-rose-400 animate-pulse'
                  : 'bg-amber-500 text-slate-950 border border-amber-300'
              }`}
            >
              {isBossStage ? 'BOSS' : `${currentStageNumber}`}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                  <MapPin size={11} /> 다음 도전 스테이지
                </span>
              </div>
              <span className="text-xs font-black text-white block truncate max-w-[150px]">
                {currentStageName}
              </span>
            </div>
          </button>

          {/* Instant Launch Button (48px) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onInstantLaunchStage();
            }}
            className="h-12 px-5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-lg hover:brightness-105 shrink-0"
          >
            <Swords size={16} />
            <span>즉시 출격</span>
          </button>
        </div>
      </div>
    </>
  );
};
