import React from 'react';
import { X, PackagePlus } from 'lucide-react';

interface InventoryExpansionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlots: number;
  userSns: number;
  onExpand: (newCapacity: number) => void;
}

export const InventoryExpansionModal: React.FC<InventoryExpansionModalProps> = ({
  isOpen,
  onClose,
  currentSlots,
  userSns,
  onExpand
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <PackagePlus size={16} className="text-indigo-600" />
            <span>인벤토리 슬롯 확장</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#201d1d]/70 mb-2">
          현재 슬롯: {currentSlots}칸 (최대 +10칸 확장 가능)
        </p>
        <p className="text-[11px] text-amber-700 font-bold mb-4">
          비용: 50 SNS (보유: {userSns} SNS)
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              onExpand(currentSlots + 10);
              onClose();
            }}
            disabled={userSns < 50}
            className="px-4 py-1.5 text-xs font-black bg-[#201d1d] text-white rounded-sm disabled:opacity-40"
          >
            확장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryExpansionModal;
