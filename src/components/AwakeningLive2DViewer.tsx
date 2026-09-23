import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface AwakeningLive2DViewerProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  cardImage?: string;
  onBuyAwakeningPack?: () => void;
}

export const AwakeningLive2DViewer: React.FC<AwakeningLive2DViewerProps> = ({
  isOpen,
  onClose,
  cardName,
  onBuyAwakeningPack
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d] text-center">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-1.5 font-black text-sm">
            <Sparkles size={16} className="text-amber-500" />
            <span>초월 각성 뷰어</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="py-4">
          <h3 className="font-black text-base">{cardName}</h3>
          <p className="text-xs text-[#201d1d]/60 mt-1">풀돌파 초월 각성 완료</p>
        </div>
        <div className="flex justify-center gap-2 pt-2 border-t border-[#201d1d]/10">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            닫기
          </button>
          {onBuyAwakeningPack && (
            <button
              type="button"
              onClick={() => {
                onBuyAwakeningPack();
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-black bg-amber-500 text-white rounded-sm"
            >
              기념 팩 수령
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AwakeningLive2DViewer;
