import React from 'react';
import { X, ShieldAlert } from 'lucide-react';

export interface CounterRecommendation {
  slotIndex: number;
  currentCardName: string;
  recommendedCardId: any;
  recommendedCardName: string;
  reason: string;
  winRateBoost: number;
}

interface AiCounterDeckSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations?: CounterRecommendation[];
  onApplyCounterDeck?: () => void;
}

export const AiCounterDeckSheet: React.FC<AiCounterDeckSheetProps> = ({
  isOpen,
  onClose,
  recommendations = [],
  onApplyCounterDeck
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-4 rounded-t-lg sm:rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <ShieldAlert size={16} className="text-red-500" />
            <span>AI 카운터 덱 추천</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#201d1d]/70 mb-3">
          상대 덱 분석 결과 기반 최적의 카운터 카드를 추천합니다.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            닫기
          </button>
          {onApplyCounterDeck && (
            <button
              type="button"
              onClick={() => {
                onApplyCounterDeck();
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-black bg-[#201d1d] text-white rounded-sm"
            >
              카운터 덱 적용
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiCounterDeckSheet;
