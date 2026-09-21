/**
 * QuickBatchListingSheet.tsx - SCR-05-17
 * 중복 카드를 최저가 -1%로 1-Tap 즉시 등록하는 48px 스마트 일괄 출품 바텀시트
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Tag, Sparkles, Check, X, Layers, ArrowDown } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface DuplicateCardItem {
  id: number;
  name: string;
  rarity: string;
  count: number;
  lowestMarketPrice: number;
}

interface QuickBatchListingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateCardItem[];
  onBatchList: (discountPercent: number) => void;
}

export const QuickBatchListingSheet: React.FC<QuickBatchListingSheetProps> = ({
  isOpen,
  onClose,
  duplicates,
  onBatchList,
}) => {
  const [discountPercent, setDiscountPercent] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end font-mono select-none">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-slate-950 border-t-2 border-amber-400 rounded-t-3xl p-5 max-w-lg mx-auto w-full flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-amber-400" />
            <h3 className="text-sm font-black text-white">중복 카드 1-Tap 스마트 일괄 출품</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          인벤토리 내 2장 이상 보유한 중복 카드를 현재 시장 최저가 대비 {discountPercent}% 저렴하게 일괄 등록하여 초고속 체결을 유도합니다.
        </p>

        {/* Duplicates List */}
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {duplicates.map((item) => {
            const listPrice = Math.floor(item.lowestMarketPrice * (1 - discountPercent / 100));
            return (
              <div
                key={item.id}
                className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{item.name}</span>
                  <span className="text-[10px] text-slate-400">
                    보유 {item.count}장 (최저가: {item.lowestMarketPrice} SNS)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold block">{listPrice} SNS</span>
                  <span className="text-[10px] text-rose-400">(-{discountPercent}%)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 48px Action Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            onBatchList(discountPercent);
            onClose();
          }}
          className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg"
        >
          <Check size={16} />
          <span>중복 카드 {duplicates.length}종 일괄 출품 완료</span>
        </button>
      </motion.div>
    </div>
  );
};
