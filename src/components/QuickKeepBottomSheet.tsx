/**
 * QuickKeepBottomSheet.tsx - SCR-04-17
 * 소환 결과 카드 중 즉시 주력 덱 슬롯에 등록하고 싶은 카드를 1초 만에 킵(Keep)하는 48px 바텀시트
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookmarkCheck, Plus, Check, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface QuickKeepBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCards: Array<{ id: number; name: string; rarity: string }>;
  onKeepToDeck: (cardId: number) => void;
}

export const QuickKeepBottomSheet: React.FC<QuickKeepBottomSheetProps> = ({
  isOpen,
  onClose,
  selectedCards,
  onKeepToDeck,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end font-mono select-none">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-slate-950 border-t-2 border-amber-400 rounded-t-3xl p-4 max-w-lg mx-auto w-full flex flex-col gap-3 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck size={18} className="text-amber-400" />
            <h4 className="text-xs font-black text-white">소환 카드 원터치 덱 보관 (Quick Keep)</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {selectedCards.map((card) => (
            <div
              key={card.id}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl min-w-[120px] flex flex-col items-center gap-1.5 shrink-0"
            >
              <span className="text-[10px] text-amber-400 font-bold">{card.rarity}</span>
              <span className="text-xs text-white font-bold truncate max-w-[100px]">{card.name}</span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onKeepToDeck(card.id);
                }}
                className="h-7 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer active:scale-95"
              >
                <Plus size={11} />
                <span>덱에 즉시 등록</span>
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
