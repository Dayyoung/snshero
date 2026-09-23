import React from 'react';
import { X, Shield } from 'lucide-react';

interface UnderdogInsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMarket?: any;
  onApplyInsurance?: (rate: number) => void;
}

export const UnderdogInsuranceModal: React.FC<UnderdogInsuranceModalProps> = ({
  isOpen,
  onClose,
  onApplyInsurance
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <Shield size={16} className="text-blue-600" />
            <span>언더독 원금 보장 보험</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#201d1d]/70 mb-4">
          역배당(언더독) 베팅 시 패배하더라도 원금의 50%를 환급해주는 보험입니다.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            닫기
          </button>
          <button
            type="button"
            onClick={() => onApplyInsurance?.(50)}
            className="px-4 py-1.5 text-xs font-black bg-blue-600 text-white rounded-sm"
          >
            보험 적용 (50%)
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnderdogInsuranceModal;
