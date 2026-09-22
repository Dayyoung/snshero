import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Share2, Copy, Check, Sparkles, Download, Layers } from 'lucide-react';
import { ViewType, CardData, Language } from '../types';
import { ShareTemplateCard } from '../components/ShareTemplateCard';
import { CARD_DATABASE } from '../cardDatabase';
import { t } from '../lib/i18n';

export interface ShareViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx: (url: string) => void;
  currentDeck: CardData[];
  user?: any;
  onAttackUser?: (opponent: any) => void;
  showCustomAlert?: (message: string) => void;
  updateSns?: (amount: number, reason?: string) => void;
}

export const ShareView: React.FC<ShareViewProps> = ({
  language,
  onNavigate,
  playSfx,
  currentDeck = [],
  user,
  showCustomAlert,
  updateSns,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'deck' | 'character'>('deck');

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://snshero.com';

  const handleCopyLink = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (showCustomAlert) {
        showCustomAlert(language === 'ko' ? '공유 링크가 복사되었습니다!' : 'Share link copied!');
      }
    }
  };

  const firstCard = currentDeck && currentDeck.length > 0 ? currentDeck[0] : null;
  const dbCard = firstCard ? CARD_DATABASE[firstCard.imageIndex] : null;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-5 text-[#201d1d]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-3">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-xs font-mono border border-[rgba(15,0,0,0.15)] px-3 py-1.5 rounded-sm hover:bg-[#f1eeee] active:scale-95 cursor-pointer min-h-[36px]"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '로비로 돌아가기' : 'Back to Lobby'}</span>
        </button>
        <span className="font-mono font-bold text-sm sm:text-base">
          {language === 'ko' ? '[ 공유 & 자랑하기 ]' : '[ Share & Boast ]'}
        </span>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 text-xs font-mono border border-[#201d1d] bg-[#0f0000] text-white px-3 py-1.5 rounded-sm hover:opacity-90 active:scale-95 cursor-pointer min-h-[36px]"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? (language === 'ko' ? '복사됨' : 'Copied') : (language === 'ko' ? '링크 복사' : 'Copy Link')}</span>
        </button>
      </div>

      {/* Share Template Selector */}
      <div className="flex gap-2 border-b border-[rgba(15,0,0,0.12)] pb-2">
        <button
          onClick={() => setSelectedTemplate('deck')}
          className={`px-3 py-1.5 text-xs font-mono rounded-sm border cursor-pointer ${
            selectedTemplate === 'deck' 
              ? 'border-[#201d1d] bg-[#0f0000] text-white' 
              : 'border-[rgba(15,0,0,0.15)] bg-transparent hover:bg-[#f1eeee]'
          }`}
        >
          {language === 'ko' ? '덱 편성 카드 공유' : 'Battle Deck Share'}
        </button>
        <button
          onClick={() => setSelectedTemplate('character')}
          className={`px-3 py-1.5 text-xs font-mono rounded-sm border cursor-pointer ${
            selectedTemplate === 'character' 
              ? 'border-[#201d1d] bg-[#0f0000] text-white' 
              : 'border-[rgba(15,0,0,0.15)] bg-transparent hover:bg-[#f1eeee]'
          }`}
        >
          {language === 'ko' ? '대표 영웅 카드 공유' : 'Hero Card Share'}
        </button>
      </div>

      {/* Share Card Content */}
      <div className="flex justify-center w-full py-4">
        {selectedTemplate === 'deck' ? (
          <ShareTemplateCard
            templateType="deck"
            language={language}
            deckCards={currentDeck}
            onClose={() => onNavigate('home')}
          />
        ) : (
          <ShareTemplateCard
            templateType="character"
            language={language}
            cardId={firstCard?.imageIndex ?? 1}
            cardData={dbCard || undefined}
            onClose={() => onNavigate('home')}
          />
        )}
      </div>
    </div>
  );
};

export default ShareView;
