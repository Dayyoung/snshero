/**
 * DeckSmartSpecPopover.tsx - SCR-03-29
 * 스와이프 제스처 기반 덱 슬롯 고정 2단 접이식 바텀시트:
 * 롱프레스 시 즉시 뜨는 '스마트 스펙 돋보기 팝오버(Touch-and-Hold Preview)' 및 원터치 일괄 자동 편성 퀵 버튼(48px) 통합.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, Shield, Flame, Sparkles, X, ChevronUp, ChevronDown } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface CardSpecDetail {
  id: string;
  name: string;
  grade: string;
  element: string;
  atk: number;
  def: number;
  hp: number;
  skillName: string;
  skillDescription: string;
}

interface DeckSmartSpecPopoverProps {
  previewCard: CardSpecDetail | null;
  onClosePreview: () => void;
  onAutoFormDeck: () => void;
  isDeckFull: boolean;
  activeDeckCount: number;
}

export const DeckSmartSpecPopover: React.FC<DeckSmartSpecPopoverProps> = ({
  previewCard,
  onClosePreview,
  onAutoFormDeck,
  isDeckFull,
  activeDeckCount,
}) => {
  return (
    <>
      {/* 1. Bottom One-Touch Auto Form & Deck Counter Bar (48px targets) */}
      <div className="w-full bg-slate-950/95 border border-slate-800 rounded-2xl p-2.5 px-3.5 flex items-center justify-between font-mono select-none shadow-xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold">덱 편성 슬롯:</span>
          <span className="text-amber-400 font-black text-sm">{activeDeckCount} / 5</span>
        </div>

        {/* 48px One-Touch Auto Form Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            onAutoFormDeck();
          }}
          className="h-11 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 active:scale-95 cursor-pointer shadow hover:brightness-105"
        >
          <Wand2 size={15} />
          <span>원터치 자동 편성</span>
        </button>
      </div>

      {/* 2. Touch-and-Hold Smart Spec Preview Popover */}
      <AnimatePresence>
        {previewCard && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="w-full max-w-xs bg-slate-950 border-2 border-amber-400 rounded-3xl p-4 shadow-2xl flex flex-col gap-3"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px]">
                    {previewCard.grade}
                  </span>
                  <span className="text-xs font-black text-white">{previewCard.name}</span>
                </div>
                <button
                  type="button"
                  onClick={onClosePreview}
                  className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-slate-400 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">공격력</span>
                  <span className="text-xs font-black text-rose-400">{previewCard.atk}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">방어력</span>
                  <span className="text-xs font-black text-cyan-400">{previewCard.def}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">체력</span>
                  <span className="text-xs font-black text-emerald-400">{previewCard.hp}</span>
                </div>
              </div>

              {/* Skill Details */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-left">
                <span className="text-[10px] text-amber-400 font-bold block mb-1">
                  ⚡ 고유 스킬: {previewCard.skillName}
                </span>
                <p className="text-[10px] text-slate-300 leading-tight">
                  {previewCard.skillDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={onClosePreview}
                className="h-10 w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl active:scale-95 cursor-pointer border border-slate-800"
              >
                닫기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
