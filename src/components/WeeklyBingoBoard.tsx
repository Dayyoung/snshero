import React from 'react';
import { X, Grid } from 'lucide-react';

interface WeeklyBingoBoardProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimReward?: (amount: number) => void;
}

export const WeeklyBingoBoard: React.FC<WeeklyBingoBoardProps> = ({
  isOpen,
  onClose,
  onClaimReward
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <Grid size={16} className="text-amber-500" />
            <span>주간 길드 빙고 보드</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#201d1d]/70 mb-4">
          주간 미션을 완료하고 빙고 라인을 완성하여 추가 보상을 수령하세요.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            닫기
          </button>
          {onClaimReward && (
            <button
              type="button"
              onClick={() => {
                onClaimReward(30);
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-black bg-amber-500 text-white rounded-sm"
            >
              보상 수령 (+30 SNS)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyBingoBoard;
