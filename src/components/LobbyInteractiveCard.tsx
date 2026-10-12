import React from 'react';
import { CardData, EquipmentSlot, Language } from '../types';
import { CardItem } from './CardItem';
import { INITIAL_SKILLS } from '../constants';
import { cn } from '../lib/utils';
import { playFactionSfx } from '../lib/sound';
import { triggerHaptic } from '../lib/haptic';

interface LobbyInteractiveCardProps {
  card: CardData;
  index: number;
  totalCards: number;
  lowSpecMode: boolean;
  language?: Language;
  onCardClick?: (card: CardData) => void;
}

export const LobbyInteractiveCard: React.FC<LobbyInteractiveCardProps> = ({
  card, index, totalCards, lowSpecMode, language = 'en', onCardClick,
}) => {
  const displayName = language === 'ko'
    ? card.title || card.title_dis || card.title_en || card.id
    : card.title_en || card.title_dis || card.title || card.id;
  const handleClick = () => {
    const title = (card.title_dis || card.title || '').toLowerCase();
    const faction = title.includes('화염') || title.includes('불') || title.includes('fire') || card.imageIndex <= 20
      ? 'fire'
      : title.includes('물') || title.includes('빙') || title.includes('water') || card.imageIndex <= 40
        ? 'water'
        : title.includes('바람') || title.includes('풍') || title.includes('wind') || card.imageIndex <= 60
          ? 'wind'
          : title.includes('빛') || title.includes('전기') || title.includes('thunder') || card.imageIndex <= 80
            ? 'light' : 'earth';
    playFactionSfx(faction);
    triggerHaptic('heavy');
    onCardClick?.(card);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${displayName}, ${index + 1}/${totalCards}`}
      className={cn(
        'group min-w-0 w-full rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-1 text-left font-mono text-[#201d1d] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#201d1d]',
        !lowSpecMode && 'transition-colors hover:border-[#201d1d]',
      )}
    >
      <div className="flex items-center justify-between gap-1 px-1 py-2 text-xs tabular-nums">
        <span>{String(index + 1).padStart(2, '0')} / {String(totalCards).padStart(2, '0')}</span>
        <span className="text-[#646262]">#{String(card.imageIndex).padStart(3, '0')}</span>
      </div>
      <CardItem card={card} language={language} lowSpecMode={lowSpecMode} hideStats className="aspect-[5/7] w-full h-auto rounded-none border-0 shadow-none pointer-events-none" />
      <div className="min-h-11 px-2 py-3 text-sm font-bold leading-snug break-words">{displayName}</div>
      <div className="grid grid-cols-4 divide-x divide-[rgba(15,0,0,0.12)] border-y border-[rgba(15,0,0,0.12)] py-2">
        {(['N', 'E', 'S', 'W'] as const).map((dir, statIdx) => (
          <div key={dir} className="flex flex-col items-center gap-1">
            <span className="text-xs text-[#646262]">{dir}</span>
            <span className="text-sm font-bold tabular-nums">{card.stats[statIdx]}</span>
          </div>
        ))}
      </div>
      <div className="flex min-h-7 items-center justify-between gap-2 px-1">
        <div className="flex gap-1">
          {['necklace', 'ring1', 'ring2', 'boots'].map(slot => (
            <span key={slot} className={cn('h-1.5 w-1.5 border border-[#646262]', card.equipment?.[slot as EquipmentSlot] ? 'bg-[#201d1d]' : 'bg-transparent')} />
          ))}
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {INITIAL_SKILLS.filter(baseSkill => (card.skills?.find(s => s.id === baseSkill.id)?.level || 0) > 0).map(baseSkill => (
            <span key={baseSkill.id} className="h-1.5 w-1.5 bg-[#646262]" />
          ))}
        </div>
      </div>
    </button>
  );
};
