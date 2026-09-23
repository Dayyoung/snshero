import React from 'react';
import { X, DollarSign } from 'lucide-react';

interface PredictionBetSlipSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMarket?: any;
  userSns: number;
  onConfirmBet?: (marketId: string, outcome: string, amount: number) => void;
}

export const PredictionBetSlipSheet: React.FC<PredictionBetSlipSheetProps> = ({
  isOpen,
  onClose,
  selectedMarket,
  userSns,
  onConfirmBet
}) => {
  if (!isOpen || !selectedMarket) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-t-lg sm:rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-1.5 font-black text-sm">
            <DollarSign size={16} className="text-emerald-600" />
            <span>베팅 슬립</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs font-bold mb-2">{selectedMarket.question || '선택된 예측 마켓'}</p>
        <p className="text-[11px] text-[#201d1d]/60 mb-4">보유: {userSns} SNS</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirmBet?.(selectedMarket.id, 'YES', 50)}
            className="px-4 py-1.5 text-xs font-black bg-emerald-600 text-white rounded-sm"
          >
            50 SNS 베팅 확정
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredictionBetSlipSheet;
