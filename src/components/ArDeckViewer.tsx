import React from 'react';
import { X, Sparkles, Eye } from 'lucide-react';
import type { Language, CardData } from '../types';
import { t } from '../lib/i18n';

interface ArDeckViewerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  deckCards: Array<CardData | null>;
  inventory?: Array<CardData | null>;
}

export const ArDeckViewer: React.FC<ArDeckViewerProps> = ({
  isOpen,
  onClose,
  language,
  deckCards,
}) => {
  if (!isOpen) return null;

  const validCards = deckCards.filter((c): c is CardData => c !== null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none">
      <div className="relative w-full max-w-lg bg-[#fdfcfc] text-[#201d1d] border border-black/20 p-5 rounded-none shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-mono font-bold text-sm tracking-wide uppercase">
              {language === 'ko' ? '[3D 덱 쇼케이스]' : '[3D Deck Showcase]'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/5 active:bg-black/10 transition-colors rounded-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Showcase Grid */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          <p className="text-xs font-mono text-black/70">
            {language === 'ko'
              ? '현재 출전 덱에 편성된 카드들의 홀로그램 및 능력치 쇼케이스입니다.'
              : 'Holographic and tactical showcase of currently assigned deck heroes.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {validCards.map((card, idx) => (
              <div
                key={card.id ? `${card.id}-${idx}` : idx}
                className="border border-black/15 bg-white p-3 rounded-sm flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase">
                    SLOT #{idx + 1}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black/5 rounded-xs font-semibold">
                    {card.rarity || card.tier || 'NORMAL'}
                  </span>
                </div>
                <div className="my-2 flex flex-col items-center justify-center p-3 bg-[#f8f7f5] border border-dashed border-black/15 min-h-[100px]">
                  <Eye className="w-8 h-8 text-black/40 mb-1" />
                  <span className="text-xs font-mono font-bold text-center">
                    {card.title || card.name || `Card #${card.id}`}
                  </span>
                  <span className="text-[10px] font-mono text-black/60">
                    POWER: {card.power || (card.atk ? card.atk + card.hp : 100)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {validCards.length === 0 && (
            <div className="text-center py-12 text-black/50 font-mono text-xs">
              {language === 'ko' ? '덱에 장착된 카드가 없습니다.' : 'No cards currently assigned to deck.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-black/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#201d1d] text-white font-mono text-xs uppercase font-bold rounded-sm min-h-[44px] hover:bg-black/80 transition-colors"
          >
            {language === 'ko' ? '닫기' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArDeckViewer;
