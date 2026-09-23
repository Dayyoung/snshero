import React from 'react';
import { X, Award } from 'lucide-react';

interface DeckSynergyMasteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
  wildcardCount?: number;
  onBuyWildcard?: () => void;
}

export const DeckSynergyMasteryModal: React.FC<DeckSynergyMasteryModalProps> = ({
  isOpen,
  onClose,
  wildcardCount = 0,
  onBuyWildcard
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <Award size={16} className="text-amber-500" />
            <span>덱 시너지 마스터리</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#201d1d]/70 mb-3 leading-relaxed">
          동일 종족 및 속성 카드를 조합하여 추가 공격력과 특수 발동 버프를 누리세요.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            닫기
          </button>
          {onBuyWildcard && (
            <button
              type="button"
              onClick={() => {
                onBuyWildcard();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-black bg-amber-500 text-white rounded-sm"
            >
              조커 카드 상점
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckSynergyMasteryModal;
