import React from 'react';
import { X, Sparkles, Shield, Zap, Sword } from 'lucide-react';
import { CardData, Language } from '../types';
import { getCardSpriteStyle } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';

interface CardDetailBottomSheetProps {
  card: CardData | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onEquipToDeck?: (card: CardData) => void;
}

export const CardDetailBottomSheet: React.FC<CardDetailBottomSheetProps> = ({
  card,
  isOpen,
  onClose,
  language,
  onEquipToDeck,
}) => {
  if (!isOpen || !card) return null;

  const isKo = language === 'ko';
  const spriteStyle = getCardSpriteStyle(card.imageIndex || 1);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#201d1d]/60 backdrop-blur-xs font-mono select-none">
      <div className="w-full max-w-md bg-[#fdfcfc] text-[#201d1d] border-t-2 border-[#201d1d] rounded-t-sm p-4 shadow-2xl animate-slideUp max-h-[60vh] overflow-y-auto">
        {/* 상단 핸들 & 헤더 */}
        <div className="w-10 h-1 bg-[#201d1d]/30 rounded-full mx-auto mb-3" />
        <div className="flex justify-between items-center border-b border-[#201d1d]/15 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-xs">
              {card.rarity || 'SSR'}
            </span>
            <span className="text-xs font-black tracking-tight">{card.title_dis || '히어로'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/10 rounded-xs cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* 메인 스펙 영역 */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-xs border-2 border-[#201d1d] shrink-0 shadow-sm"
            style={spriteStyle}
          />
          <div className="flex-1 space-y-1 text-xs">
            <div className="text-[11px] text-[#201d1d]/70">
              {isKo ? `레벨: Lv.${card.level || 1} • 각성: 0단계` : `Level: Lv.${card.level || 1}`}
            </div>
            {/* 4방향 스탯 배지 */}
            <div className="grid grid-cols-4 gap-1 text-center font-mono">
              <div className="bg-rose-50 border border-rose-200 p-1 text-[10px] font-bold text-rose-800">
                N {card.stats.N}
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-1 text-[10px] font-bold text-emerald-800">
                E {card.stats.E}
              </div>
              <div className="bg-amber-50 border border-amber-200 p-1 text-[10px] font-bold text-amber-800">
                S {card.stats.S}
              </div>
              <div className="bg-blue-50 border border-blue-200 p-1 text-[10px] font-bold text-blue-800">
                W {card.stats.W}
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="pt-2 border-t border-[#201d1d]/10 flex gap-2">
          {onEquipToDeck && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('success');
                onEquipToDeck(card);
                onClose();
              }}
              className="flex-1 py-2.5 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-xs cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              {isKo ? '[ 대표 덱에 즉시 장착 ]' : '[ Equip To Deck ]'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-[#201d1d]/30 hover:bg-[#201d1d]/5 text-xs font-bold rounded-xs cursor-pointer"
          >
            {isKo ? '닫기' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
