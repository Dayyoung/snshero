import React from 'react';
import { Package, Lock } from 'lucide-react';

interface BlindBoxListingCardProps {
  language?: string;
  onOpenBlindBox?: () => void;
  onUnlockSafeBox?: () => void;
}

export const BlindBoxListingCard: React.FC<BlindBoxListingCardProps> = ({
  language,
  onOpenBlindBox,
  onUnlockSafeBox
}) => {
  return (
    <div className="p-3 border border-[#201d1d]/15 bg-amber-50/40 rounded-sm font-mono flex items-center justify-between gap-2 my-2">
      <div className="flex items-center gap-2">
        <Package size={16} className="text-amber-600" />
        <span className="text-xs font-bold text-[#201d1d]">황금 블라인드 매물 상자</span>
      </div>
      <div className="flex gap-1.5">
        {onOpenBlindBox && (
          <button
            type="button"
            onClick={onOpenBlindBox}
            className="px-2 py-1 text-[10px] font-bold bg-amber-500 text-white rounded-xs"
          >
            상자 열기
          </button>
        )}
        {onUnlockSafeBox && (
          <button
            type="button"
            onClick={onUnlockSafeBox}
            className="px-2 py-1 text-[10px] font-bold border border-[#201d1d]/20 rounded-xs hover:bg-[#201d1d]/5"
          >
            세이프박스
          </button>
        )}
      </div>
    </div>
  );
};

export default BlindBoxListingCard;
