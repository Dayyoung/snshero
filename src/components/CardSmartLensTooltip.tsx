import React from 'react';
import { X, Search } from 'lucide-react';

interface CardSmartLensTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type?: string;
}

export const CardSmartLensTooltip: React.FC<CardSmartLensTooltipProps> = ({
  isOpen,
  onClose,
  title,
  description,
  type
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-2">
          <div className="flex items-center gap-2 font-black text-sm">
            <Search size={16} className="text-blue-600" />
            <span>{title || '스마트 렌즈 분석'}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#201d1d]/80 leading-relaxed mb-3">
          {description}
        </p>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="px-3 py-1 text-xs border border-[#201d1d]/20 rounded-sm">
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardSmartLensTooltip;
