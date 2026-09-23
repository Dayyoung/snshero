/**
 * HeroChronicleStorybook.tsx - SCR-11-18
 * 상위 업적 달성 시 게임 여정이 3D 스토리북으로 펼쳐지는 '영웅의 연대기' 시네마틱 해금 및 골든 트로피 패키지(2,500원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Trophy, Crown, Sparkles, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface ChroniclePage {
  chapter: number;
  title: string;
  desc: string;
  date: string;
}

interface HeroChronicleStorybookProps {
  isOpen: boolean;
  onClose: () => void;
  pages: ChroniclePage[];
  onBuyTrophyPack: () => void;
}

export const HeroChronicleStorybook: React.FC<HeroChronicleStorybookProps> = ({
  isOpen,
  onClose,
  pages,
  onBuyTrophyPack,
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  if (!isOpen) return null;

  const active = pages[currentPage] || {
    chapter: 1,
    title: '여정의 시작',
    desc: '첫 번째 히어로 카드를 획득하고 아레나에 첫 발을 내디뎠습니다.',
    date: '2026.01.01',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <BookOpen size={16} />
            <span>📖 영웅의 연대기 (시네마틱 스토리북)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-slate-950 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          {/* 3D Book Page Container */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center gap-2 relative shadow-inner min-h-[160px] justify-center">
            <div className="text-amber-400 text-[10px] font-bold">
              제 {active.chapter} 장 • {active.date}
            </div>
            <h4 className="text-sm font-black text-white">{active.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed text-center mt-1">
              "{active.desc}"
            </p>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center justify-between w-full px-2">
            <button
              type="button"
              disabled={currentPage <= 0}
              onClick={() => {
                triggerHaptic('selection');
                setCurrentPage((p) => Math.max(0, p - 1));
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft size={14} /> 이전
            </button>
            <span className="text-xs text-slate-400">
              {currentPage + 1} / {Math.max(1, pages.length)}
            </span>
            <button
              type="button"
              disabled={currentPage >= pages.length - 1}
              onClick={() => {
                triggerHaptic('selection');
                setCurrentPage((p) => Math.min(pages.length - 1, p + 1));
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              다음 <ChevronRight size={14} />
            </button>
          </div>

          {/* Golden Trophy Pack (SCR-11-18) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">업적 마스터 골든 트로피</span>
              <span className="text-[9px] text-slate-400">상위 5% 독점 한정판 프로필 트로피</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyTrophyPack();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (400 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
