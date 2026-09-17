import React, { useState } from 'react';
import { Award, X, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Language, CardData } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { getCardSpriteStyle } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';

interface MileageQuickSheetProps {
  mileage: number;
  onExchangeCard: (cardId: number, cost: number) => void;
  language: Language;
}

export const MileageQuickSheet: React.FC<MileageQuickSheetProps> = ({
  mileage,
  onExchangeCard,
  language,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isKo = language === 'ko';

  // 교환 가능한 대표 SSR 카드 목록 (비용: 100 마일리지)
  const exchangeCandidates = [1, 11, 31, 51, 101];

  const handleExchange = (cardId: number) => {
    if (mileage < 100) return;
    triggerHaptic('victory');
    onExchangeCard(cardId, 100);
    setIsOpen(false);
  };

  return (
    <>
      {/* 하단 Thumb Zone 위 상시 오버레이 교환 바 (44px 규격) */}
      <div className="w-full bg-[#fdfcfc] border-t border-b border-[#201d1d]/15 px-3 py-2 font-mono flex items-center justify-between select-none shadow-xs">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-purple-600" />
          <div className="text-xs font-bold text-[#201d1d]">
            <span>{isKo ? '소환 마일리지' : 'Summon Mileage'}:</span>{' '}
            <span className="text-purple-700 font-black">{mileage} P</span>
          </div>
          <span className="text-[10px] text-[#201d1d]/60 hidden xs:inline">
            (100P = SSR 즉시 교환)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="min-h-[36px] px-3 py-1 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isKo ? 'SSR 교환소' : 'SSR Exchange'}</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* 하프 바텀시트 */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#201d1d]/60 backdrop-blur-xs font-mono select-none">
          <div className="w-full max-w-md bg-[#fdfcfc] text-[#201d1d] border-t-2 border-[#201d1d] rounded-t-sm p-4 shadow-2xl animate-slideUp max-h-[70vh] overflow-y-auto">
            {/* 상단 바 */}
            <div className="w-10 h-1 bg-[#201d1d]/30 rounded-full mx-auto mb-3" />
            <div className="flex justify-between items-center border-b border-[#201d1d]/15 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-600" />
                <span className="text-xs font-black">
                  {isKo ? '[소환 마일리지 SSR 즉시 교환]' : '[SSR Mileage Exchange]'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#201d1d]/10 rounded-xs cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mb-3 text-[11px] text-[#201d1d]/70">
              {isKo
                ? `현재 보유 마일리지: ${mileage}P (원하는 SSR 카드를 선택해 즉시 획득하세요)`
                : `Current Mileage: ${mileage}P (Choose your SSR Hero)`}
            </div>

            {/* 카드 목록 */}
            <div className="space-y-2 mb-4">
              {exchangeCandidates.map((cardId) => {
                const card = CARD_DATABASE[cardId];
                if (!card) return null;
                const spriteStyle = getCardSpriteStyle(cardId);
                const canAfford = mileage >= 100;

                return (
                  <div
                    key={cardId}
                    className="p-2.5 bg-white border border-[#201d1d]/20 rounded-xs flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xs border border-[#201d1d]/30 shrink-0"
                        style={spriteStyle}
                      />
                      <div>
                        <div className="text-xs font-black text-[#201d1d]">
                          {isKo ? card.title : card.title_en}
                        </div>
                        <div className="text-[10px] text-purple-700 font-bold">
                          100 Mileage P
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleExchange(cardId)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xs cursor-pointer transition-colors ${
                        canAfford
                          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? (isKo ? '교환' : 'Exchange') : (isKo ? 'P 부족' : 'Need P')}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 border border-[#201d1d]/30 text-xs font-bold rounded-xs cursor-pointer hover:bg-[#201d1d]/5"
            >
              {isKo ? '닫기' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
