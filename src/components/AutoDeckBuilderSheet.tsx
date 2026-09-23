import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface AutoDeckBuilderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  ownedCards?: any[];
  currentDeck?: any[];
  onApplyDeck?: (newDeck: any[]) => void;
}

export const AutoDeckBuilderSheet: React.FC<AutoDeckBuilderSheetProps> = ({
  isOpen,
  onClose,
  ownedCards = [],
  onApplyDeck
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-4 rounded-t-lg sm:rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <Sparkles size={16} className="text-amber-500" />
            <span>원클릭 AI 덱 자동 편성</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#201d1d]/70 mb-4">
          보유한 카드 중 가장 강력한 시너지의 5장을 자동으로 분석하여 덱을 편성합니다.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            닫기
          </button>
          <button
            type="button"
            onClick={() => {
              if (onApplyDeck && ownedCards.length >= 5) {
                onApplyDeck(ownedCards.slice(0, 5));
              }
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-black bg-[#201d1d] text-white rounded-sm"
          >
            편성 적용
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoDeckBuilderSheet;
