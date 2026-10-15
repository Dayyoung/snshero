import React, { useState, useEffect } from 'react';
import {
  STORY_DUEL_PRESETS,
  StoryDuelPreset,
  getStoryDuelPreset,
  getStoryDuelShareUrl,
} from '../../utils/storyDeckPresets';
import { CARD_DATABASE } from '../../cardDatabase';

interface StoryRivalDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetId?: string;
  onStartBattle: (preset: StoryDuelPreset) => void;
}

export const StoryRivalDuelModal: React.FC<StoryRivalDuelModalProps> = ({
  isOpen,
  onClose,
  presetId = 'ep08',
  onStartBattle,
}) => {
  const [selectedId, setSelectedId] = useState<string>(presetId);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (presetId && STORY_DUEL_PRESETS[presetId]) {
      setSelectedId(presetId);
    }
  }, [presetId]);

  if (!isOpen) return null;

  const currentPreset = getStoryDuelPreset(selectedId);
  const shareUrl = getStoryDuelShareUrl(selectedId);

  const handleShare = async () => {
    const text = `[SNSHero 소설 결투장] ${currentPreset.titleKo}\n"${currentPreset.quoteKo}"\n3x3 운명의 결투를 받아들여라!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `[SNSHero] ${currentPreset.titleKo}`,
          text,
          url: shareUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const getThemeGradient = (theme: StoryDuelPreset['backgroundTheme']) => {
    switch (theme) {
      case 'snow':
        return 'from-sky-950/60 via-[#090d16] to-[#090d16] border-sky-500/30';
      case 'wasteland':
        return 'from-amber-950/60 via-[#090d16] to-[#090d16] border-amber-500/30';
      case 'fortress':
        return 'from-indigo-950/60 via-[#090d16] to-[#090d16] border-indigo-500/30';
      case 'shadow':
        return 'from-purple-950/60 via-[#090d16] to-[#090d16] border-purple-500/30';
      default:
        return 'from-amber-950/60 via-[#090d16] to-[#090d16] border-amber-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm select-none font-mono">
      <div
        className={`relative w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-[#090d16] text-stone-200 border rounded-none p-5 shadow-2xl flex flex-col justify-between ${getThemeGradient(
          currentPreset.backgroundTheme
        )}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest font-bold">
                [STORY RIVAL DUEL // EP.{String(currentPreset.episodeNumber).padStart(2, '0')}]
              </span>
            </div>
            <h2 className="text-base font-bold tracking-tight text-white mt-1">
              {currentPreset.titleKo}
            </h2>
            <div className="text-[11px] text-stone-400">
              {currentPreset.titleEn}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-sm transition-colors border border-transparent hover:border-white/20"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Episode Selector Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {Object.values(STORY_DUEL_PRESETS).map((preset) => {
            const isSelected = preset.id === selectedId;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedId(preset.id)}
                className={`py-1.5 px-1 text-[11px] border transition-all text-center rounded-sm ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                    : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/30 hover:text-stone-200'
                }`}
              >
                EP.{preset.episodeNumber}
              </button>
            );
          })}
        </div>

        {/* Novel Lore Dialogue Quote Card */}
        <div className="p-3.5 bg-black/60 border border-white/10 rounded-sm mb-4 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-stone-700 pointer-events-none">
            <svg className="w-12 h-12 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div className="flex items-center space-x-2 text-xs text-amber-400 mb-1">
            <span className="font-bold">[{currentPreset.rivalNameKo}]</span>
            <span className="text-[10px] text-stone-400">({currentPreset.rivalSubtitleKo})</span>
          </div>
          <p className="text-xs text-stone-300 italic leading-relaxed pl-2 border-l-2 border-amber-500/50">
            "{currentPreset.quoteKo}"
          </p>
        </div>

        {/* Rival Deck vs Recommended Deck Showcase */}
        <div className="space-y-3 mb-4">
          {/* Rival Deck */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1.5">
              <span className="text-rose-400 font-bold">[적 라이벌 덱: 5장]</span>
              <span className="text-[10px] text-stone-500">3x3 난이도: S-CLASS</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {currentPreset.rivalCardIds.map((cardId) => {
                const card = CARD_DATABASE[cardId];
                return (
                  <div
                    key={cardId}
                    className="p-1.5 bg-rose-950/20 border border-rose-500/30 rounded-sm text-center flex flex-col items-center justify-between min-h-[60px]"
                  >
                    <span className="text-[10px] text-rose-300 font-bold truncate w-full">
                      {card ? card.title : `#${cardId}`}
                    </span>
                    <span className="text-[9px] text-stone-400">
                      P.{card ? card.power : '--'}
                    </span>
                    <span className="text-[8px] uppercase text-stone-500">
                      {card ? card.element : 'rival'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player Recommend Deck */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1.5">
              <span className="text-cyan-400 font-bold">[기사단 대응 추천 덱: 5장]</span>
              <span className="text-[10px] text-stone-500">카단 성전 유파</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {currentPreset.playerRecommendCardIds.map((cardId) => {
                const card = CARD_DATABASE[cardId];
                return (
                  <div
                    key={cardId}
                    className="p-1.5 bg-cyan-950/20 border border-cyan-500/30 rounded-sm text-center flex flex-col items-center justify-between min-h-[60px]"
                  >
                    <span className="text-[10px] text-cyan-300 font-bold truncate w-full">
                      {card ? card.title : `#${cardId}`}
                    </span>
                    <span className="text-[9px] text-stone-400">
                      P.{card ? card.power : '--'}
                    </span>
                    <span className="text-[8px] uppercase text-stone-500">
                      {card ? card.element : 'hero'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Victory Rewards Notice */}
        <div className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-sm text-xs mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
            <span className="text-stone-300 font-semibold">[승리 보상]</span>
          </div>
          <div className="flex items-center space-x-3 text-amber-300 font-bold">
            <span>+{currentPreset.rewardGold} SNS</span>
            <span>+영웅 소환권 x{currentPreset.rewardTicketCount}</span>
          </div>
        </div>

        {/* Action Buttons: 1-Click Duel & Share */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10">
          <button
            onClick={handleShare}
            className="flex items-center justify-center space-x-2 py-3 px-4 border border-stone-600 bg-stone-800/80 hover:bg-stone-700/80 text-white font-bold text-xs rounded-sm transition-all min-h-[48px]"
          >
            <svg className="w-4 h-4 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span>
              {copied
                ? '[도전장 링크 복사됨!]'
                : shareSuccess
                ? '[결투장 공유 완료!]'
                : '[친구에게 도전장 보내기]'}
            </span>
          </button>

          <button
            onClick={() => {
              onStartBattle(currentPreset);
              onClose();
            }}
            className="flex items-center justify-center space-x-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-sm transition-all shadow-md min-h-[48px]"
          >
            <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline>
              <line x1="13" y1="19" x2="19" y2="13"></line>
              <line x1="16" y1="16" x2="20" y2="20"></line>
              <line x1="19" y1="21" x2="21" y2="19"></line>
              <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"></polyline>
              <line x1="5" y1="14" x2="9" y2="18"></line>
              <line x1="7" y1="17" x2="4" y2="20"></line>
              <line x1="3" y1="19" x2="5" y2="21"></line>
            </svg>
            <span>[운명의 결투 개시 // 1-CLICK]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
