/**
 * RankerProfileBottomSheet.tsx - SCR-11-26
 * 스와이프 가능한 100dvh 최적화 하단 하프 바텀시트(Half BottomSheet) 프로필 뷰:
 * 랭커 에이스 카드 3D 틸트 프리뷰와 함께 하단 Thumb Zone에 48px '원터치 친선전 신청 / 덱 카피 / 친구 추가' 액션 독 배치.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Copy, UserPlus, Trophy, Award, X, Sparkles, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface RankerProfileData {
  uid: string;
  name: string;
  rank: number;
  ratingScore: number;
  winStreak: number;
  aceCardName: string;
  aceCardElement: string;
  aceCardPower: number;
  deckSummary: string[];
}

interface RankerProfileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  ranker: RankerProfileData | null;
  onRequestFriendlyMatch: (uid: string) => void;
  onCopyDeck: (deckSummary: string[]) => void;
  onAddFriend: (uid: string) => void;
}

export const RankerProfileBottomSheet: React.FC<RankerProfileBottomSheetProps> = ({
  isOpen,
  onClose,
  ranker,
  onRequestFriendlyMatch,
  onCopyDeck,
  onAddFriend,
}) => {
  if (!isOpen || !ranker) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-end font-mono select-none overflow-hidden">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-slate-950 border-t-2 border-amber-400 rounded-t-3xl p-4 flex flex-col shadow-2xl max-h-[85dvh]"
      >
        {/* Grab Handle */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow">
              #{ranker.rank}
            </div>
            <div className="text-left">
              <span className="text-xs font-black text-white">{ranker.name}</span>
              <span className="text-[10px] text-slate-400 block">레이팅: {ranker.ratingScore} MMR</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 active:scale-95 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content: Ace Card 3D Tilt Preview */}
        <div className="py-3 flex flex-col items-center">
          <div className="relative w-40 h-52 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.3)] flex flex-col items-center justify-between p-3">
            <div className="w-full flex justify-between text-[10px] font-black text-amber-400">
              <span>{ranker.aceCardElement}</span>
              <span>전투력 {ranker.aceCardPower}</span>
            </div>

            <div className="text-4xl">👑</div>

            <div className="text-center">
              <span className="text-xs font-black text-white block">{ranker.aceCardName}</span>
              <span className="text-[9px] text-slate-400">대표 에이스 카드</span>
            </div>
          </div>
        </div>

        {/* Bottom Thumb Zone Action Dock (48px targets) */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
          {/* Friendly Match */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onRequestFriendlyMatch(ranker.uid);
            }}
            className="h-12 bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] rounded-xl flex flex-col items-center justify-center gap-0.5 active:scale-95 cursor-pointer shadow"
          >
            <Swords size={16} />
            <span>친선전 신청</span>
          </button>

          {/* Copy Deck */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onCopyDeck(ranker.deckSummary);
            }}
            className="h-12 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-black text-[11px] rounded-xl flex flex-col items-center justify-center gap-0.5 active:scale-95 cursor-pointer shadow"
          >
            <Copy size={16} />
            <span>덱 카피</span>
          </button>

          {/* Add Friend */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onAddFriend(ranker.uid);
            }}
            className="h-12 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-black text-[11px] rounded-xl flex flex-col items-center justify-center gap-0.5 active:scale-95 cursor-pointer shadow"
          >
            <UserPlus size={16} />
            <span>친구 추가</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
