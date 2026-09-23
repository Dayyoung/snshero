import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface CardHoloTiltPreviewProps {
  card: any;
  isOpen: boolean;
  onClose: () => void;
  isInDeck?: boolean;
  onRegisterDeck?: (card: any) => void;
  language?: string;
}

export const CardHoloTiltPreview: React.FC<CardHoloTiltPreviewProps> = ({
  card,
  isOpen,
  onClose,
  isInDeck = false,
  onRegisterDeck
}) => {
  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d] text-center">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-1.5 font-black text-sm">
            <Sparkles size={16} className="text-amber-500" />
            <span>홀로그램 3D 프리뷰</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="py-4">
          <h3 className="font-black text-base mb-1">{card.title || card.name}</h3>
          <p className="text-xs text-[#201d1d]/60 mb-2">등급: {card.rarity || 'RARE'} / 파워: {card.power || 10}</p>
        </div>
        <div className="flex justify-center gap-2 pt-2 border-t border-[#201d1d]/10">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            닫기
          </button>
          {onRegisterDeck && (
            <button
              type="button"
              onClick={() => {
                onRegisterDeck(card);
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-black bg-[#201d1d] text-white rounded-sm"
            >
              {isInDeck ? '덱에서 제거' : '덱에 등록'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardHoloTiltPreview;
