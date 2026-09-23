import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface MutantFusionEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCards?: any[];
  onMutantCrafted?: (mutantCard: any) => void;
}

export const MutantFusionEventModal: React.FC<MutantFusionEventModalProps> = ({
  isOpen,
  onClose,
  availableCards = [],
  onMutantCrafted
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <Sparkles size={16} className="text-purple-600" />
            <span>변종 카드 합성 이벤트</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#201d1d]/70 mb-4">
          미지의 융합 에너지를 모아 특별한 변종 돌연변이 카드를 합성하세요.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            닫기
          </button>
          {onMutantCrafted && availableCards.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const sample = { ...availableCards[0], title: '뮤턴트 ' + (availableCards[0].title || '히어로') };
                onMutantCrafted(sample);
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-black bg-purple-600 text-white rounded-sm"
            >
              합성하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MutantFusionEventModal;
