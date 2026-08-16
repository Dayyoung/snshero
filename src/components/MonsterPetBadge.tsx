import React from 'react';
import { Sparkles } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { cn, getCardSpriteStyle } from '../lib/utils';

interface MonsterPetBadgeProps {
  cardId: number | null | undefined;
  className?: string;
  imageClassName?: string;
  label?: string;
}

const getCardAvatarStyle = (cardId: number): React.CSSProperties => {
  const idx = CARD_DATABASE[cardId] ? cardId : 1;
  return getCardSpriteStyle(idx);
};

export const MonsterPetBadge: React.FC<MonsterPetBadgeProps> = ({
  cardId,
  className,
  imageClassName,
  label,
}) => {
  if (!cardId || !CARD_DATABASE[cardId]) {
    return null;
  }

  const card = CARD_DATABASE[cardId];
  const title = label || card.title || card.title_dis || card.title_en || `Pet ${cardId}`;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/95 px-1.5 py-1 shadow-md backdrop-blur-sm',
        className,
      )}
      title={title}
      aria-label={title}
    >
      <div
        className={cn('h-6 w-6 rounded-full border border-white bg-slate-100 shadow-inner', imageClassName)}
        style={getCardAvatarStyle(cardId)}
        aria-hidden="true"
      />
      <Sparkles size={10} className="text-emerald-500" aria-hidden="true" />
    </div>
  );
};
