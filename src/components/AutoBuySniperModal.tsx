import React from 'react';
import { X, Crosshair } from 'lucide-react';

interface AutoBuySniperModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSns: number;
  onSnipeSuccess?: (targetName: string, price: number) => void;
}

export const AutoBuySniperModal: React.FC<AutoBuySniperModalProps> = ({
  isOpen,
  onClose,
  userSns,
  onSnipeSuccess
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <Crosshair size={16} className="text-amber-500" />
            <span>자동 매수 스나이퍼</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#201d1d]/70 mb-4">
          원하는 카드와 상한가를 설정하면 조건 충족 시 즉시 자동 매수합니다.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            닫기
          </button>
          <button
            type="button"
            onClick={() => {
              if (onSnipeSuccess) onSnipeSuccess('희귀 카드', 100);
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-black bg-[#201d1d] text-white rounded-sm"
          >
            스나이퍼 가동
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoBuySniperModal;
