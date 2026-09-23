import React from 'react';
import { X, Play } from 'lucide-react';

interface PredictionShortsFeedProps {
  isOpen: boolean;
  onClose: () => void;
  matches?: any[];
  onSelectBet?: (matchId: string, choice: string) => void;
  language?: string;
}

export const PredictionShortsFeed: React.FC<PredictionShortsFeedProps> = ({
  isOpen,
  onClose,
  matches = [],
  onSelectBet
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm h-[80dvh] bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-white flex flex-col justify-between">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Play size={14} />
            <span>예측 쇼츠 하이라이트</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <p className="text-xs text-slate-300">
            {matches[0]?.title || '주요 매치 실시간 프리뷰'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (matches[0]) onSelectBet?.(matches[0].id, 'home');
              onClose();
            }}
            className="flex-1 py-2 bg-emerald-600 font-bold text-xs rounded"
          >
            YES 예측
          </button>
          <button
            type="button"
            onClick={() => {
              if (matches[0]) onSelectBet?.(matches[0].id, 'away');
              onClose();
            }}
            className="flex-1 py-2 bg-rose-600 font-bold text-xs rounded"
          >
            NO 예측
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredictionShortsFeed;
