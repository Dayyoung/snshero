import React from 'react';
import { X, Search } from 'lucide-react';

interface CardAppraisalMagnifierProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  cardImage?: string;
  language?: string;
}

export const CardAppraisalMagnifier: React.FC<CardAppraisalMagnifierProps> = ({
  isOpen,
  onClose,
  cardName,
  language
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d] text-center">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <Search size={16} className="text-amber-500" />
            <span>카드 2.5x 감정 돋보기</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="py-4">
          <h3 className="font-black text-base">{cardName}</h3>
          <p className="text-xs text-emerald-700 font-bold mt-1">감정 완료: 정품 A급 매물</p>
        </div>
        <div className="flex justify-center pt-2 border-t border-[#201d1d]/10">
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs font-bold border border-[#201d1d]/20 rounded-sm">
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardAppraisalMagnifier;
