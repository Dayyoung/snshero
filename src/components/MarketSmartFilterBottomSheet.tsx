/**
 * MarketSmartFilterBottomSheet.tsx - SCR-05-26
 * 하단 스와이프업 바텀시트 형태의 '원터치 스마트 필터 독(48px 터치 타깃)' 구축,
 * 선택 빈도가 높은 '즉시 구매 가능 / 최근 7일 최저가' 원클릭 토글 칩 제공 및 매물 카드 좌우 스와이프 즉시 비교 모드 도입.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Check, X, ArrowUpDown, Tag, Sparkles, SlidersHorizontal } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface MarketFilterState {
  instantBuyOnly: boolean;
  lowest7DaysOnly: boolean;
  selectedGrade: string; // 'all' | 'SSR' | 'SR' | 'R'
  selectedElement: string; // 'all' | 'fire' | 'water' | 'earth' | 'wind' | 'light'
  sortOrder: 'price_asc' | 'price_desc' | 'latest';
  compareMode: boolean;
}

interface MarketSmartFilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: MarketFilterState;
  onUpdateFilters: (filters: MarketFilterState) => void;
  totalMatchesCount: number;
}

export const MarketSmartFilterBottomSheet: React.FC<MarketSmartFilterBottomSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  totalMatchesCount,
}) => {
  if (!isOpen) return null;

  const toggleInstantBuy = () => {
    triggerHaptic('light');
    onUpdateFilters({ ...filters, instantBuyOnly: !filters.instantBuyOnly });
  };

  const toggleLowest7Days = () => {
    triggerHaptic('light');
    onUpdateFilters({ ...filters, lowest7DaysOnly: !filters.lowest7DaysOnly });
  };

  const toggleCompareMode = () => {
    triggerHaptic('medium');
    onUpdateFilters({ ...filters, compareMode: !filters.compareMode });
  };

  const setGrade = (grade: string) => {
    triggerHaptic('light');
    onUpdateFilters({ ...filters, selectedGrade: grade });
  };

  const setSort = (sort: 'price_asc' | 'price_desc' | 'latest') => {
    triggerHaptic('light');
    onUpdateFilters({ ...filters, sortOrder: sort });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end font-mono select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full bg-slate-950 border-t-2 border-amber-500/80 rounded-t-3xl p-4 flex flex-col gap-4 max-h-[85dvh] overflow-y-auto shadow-2xl"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
            <SlidersHorizontal size={16} />
            <span>[ 원터치 스마트 마켓 필터 ]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* 1-Tap Quick Action Chips (48px Touch Target) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Instant Buy Toggle */}
          <button
            type="button"
            onClick={toggleInstantBuy}
            className={`h-12 px-3 rounded-xl text-xs font-black flex items-center justify-between cursor-pointer border transition-all active:scale-95 ${
              filters.instantBuyOnly
                ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Tag size={15} className={filters.instantBuyOnly ? 'text-emerald-400' : ''} />
              <span>즉시 구매 가능</span>
            </div>
            {filters.instantBuyOnly && <Check size={14} className="text-emerald-400" />}
          </button>

          {/* 7-Days Lowest Price Toggle */}
          <button
            type="button"
            onClick={toggleLowest7Days}
            className={`h-12 px-3 rounded-xl text-xs font-black flex items-center justify-between cursor-pointer border transition-all active:scale-95 ${
              filters.lowest7DaysOnly
                ? 'bg-amber-950/60 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles size={15} className={filters.lowest7DaysOnly ? 'text-amber-400' : ''} />
              <span>7일 최저가 매물</span>
            </div>
            {filters.lowest7DaysOnly && <Check size={14} className="text-amber-400" />}
          </button>
        </div>

        {/* Swipe Compare Mode Toggle */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-slate-200 block">좌우 스와이프 즉시 비교 모드</span>
            <span className="text-[10px] text-slate-400">두 매물 카드를 나란히 두고 스탯과 시세를 1:1 비교</span>
          </div>
          <button
            type="button"
            onClick={toggleCompareMode}
            className={`h-8 px-3 rounded-lg text-xs font-black cursor-pointer active:scale-95 ${
              filters.compareMode
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {filters.compareMode ? '활성화됨' : '비교 OFF'}
          </button>
        </div>

        {/* Grade Filter */}
        <div>
          <span className="text-[11px] text-slate-400 font-bold block mb-1.5">카드 등급 필터</span>
          <div className="grid grid-cols-4 gap-1.5">
            {['all', 'SSR', 'SR', 'R'].map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setGrade(grade)}
                className={`h-10 rounded-lg text-xs font-black cursor-pointer border active:scale-95 ${
                  filters.selectedGrade === grade
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {grade === 'all' ? '전체' : grade}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Order */}
        <div>
          <span className="text-[11px] text-slate-400 font-bold block mb-1.5">정렬 기준</span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'price_asc', label: '최저가순' },
              { id: 'price_desc', label: '최고가순' },
              { id: 'latest', label: '최신 등록순' },
            ].map((sort) => (
              <button
                key={sort.id}
                type="button"
                onClick={() => setSort(sort.id as any)}
                className={`h-10 rounded-lg text-xs font-bold cursor-pointer border active:scale-95 ${
                  filters.sortOrder === sort.id
                    ? 'bg-slate-700 text-white border-slate-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button (48px) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            onClose();
          }}
          className="h-12 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg"
        >
          <span>{totalMatchesCount}개 매물 검색 적용</span>
        </button>
      </motion.div>
    </div>
  );
};
