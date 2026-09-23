import React from 'react';
import { Share2, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

interface ShareViewProps {
  language: Language;
  onNavigate: (view: any) => void;
  playSfx?: (sfx: string) => void;
  currentDeck?: any[];
  user?: any;
}

export const ShareView: React.FC<ShareViewProps> = ({
  language,
  onNavigate,
  currentDeck = []
}) => {
  return (
    <div className="w-full max-w-lg mx-auto p-4 font-mono text-[#201d1d]">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#201d1d]/15">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-black">
          {language === 'ko' ? '덱 자랑 & 공유' : 'Share Deck'}
        </h2>
      </div>
      <div className="p-4 border border-[#201d1d]/20 bg-white rounded-sm text-center">
        <Share2 size={24} className="mx-auto mb-2 text-indigo-600" />
        <p className="text-xs text-[#201d1d]/70 mb-4">
          {language === 'ko'
            ? `현재 편성된 ${currentDeck.length}장의 카드를 친구들에게 공유하고 SNS 보상을 받으세요.`
            : `Share your current deck (${currentDeck.length} cards) to receive SNS rewards.`}
        </p>
        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(window.location.origin);
            }
          }}
          className="px-4 py-2 bg-[#201d1d] text-white text-xs font-black rounded-sm cursor-pointer"
        >
          {language === 'ko' ? '초대 링크 복사' : 'Copy Invite Link'}
        </button>
      </div>
    </div>
  );
};

export default ShareView;
