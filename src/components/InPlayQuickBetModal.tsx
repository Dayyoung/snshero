import React from 'react';
import { X, Flame } from 'lucide-react';

interface InPlayQuickBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchTitle: string;
  currentScore?: string;
  activeBetAmount?: number;
  language?: string;
  onQuickBet?: (option: string, amount: number) => void;
}

export const InPlayQuickBetModal: React.FC<InPlayQuickBetModalProps> = ({
  isOpen,
  onClose,
  matchTitle,
  currentScore = '0 - 0',
  onQuickBet
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-1.5 font-black text-sm text-red-600">
            <Flame size={16} />
            <span>라이브 5분 인플레이 예측</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs font-bold mb-1">{matchTitle}</p>
        <p className="text-[11px] text-[#201d1d]/60 mb-4">현재 스코어: {currentScore}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            닫기
          </button>
          <button
            type="button"
            onClick={() => {
              onQuickBet?.('NEXT_GOAL', 30);
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-black bg-red-600 text-white rounded-sm"
          >
            30 SNS 퀵 예측
          </button>
        </div>
      </div>
    </div>
  );
};

export default InPlayQuickBetModal;
