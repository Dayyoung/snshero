import React from 'react';
import { CardItem, OwnedCard } from '../types';
import { Shield, Swords, Heart, Zap } from 'lucide-react';

interface HeroCardProps {
  card: CardItem;
  owned?: OwnedCard;
  isSelected?: boolean;
  isInDeck?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const GRADE_STYLES = {
  N: { border: 'border-zinc-700', bg: 'from-zinc-900 to-zinc-800', badge: 'bg-zinc-700 text-zinc-300' },
  R: { border: 'border-blue-600', bg: 'from-blue-950 to-zinc-900', badge: 'bg-blue-600 text-white' },
  SR: { border: 'border-purple-600', bg: 'from-purple-950 to-zinc-900', badge: 'bg-purple-600 text-white' },
  SSR: { border: 'border-amber-500 shadow-amber-500/20 shadow-lg', bg: 'from-amber-950/80 to-zinc-900', badge: 'bg-amber-500 text-black font-extrabold' },
  UR: { border: 'border-rose-500 shadow-rose-500/30 shadow-xl', bg: 'from-rose-950/90 to-zinc-900', badge: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black' },
};

const ELEMENT_ICONS: Record<string, string> = {
  Water: '💧',
  Fire: '🔥',
  Earth: '🌿',
  Wind: '🌪️',
  Light: '☀️',
  Dark: '🌑',
};

export const HeroCard: React.FC<HeroCardProps> = ({
  card,
  owned,
  isSelected = false,
  isInDeck = false,
  onClick,
  size = 'md',
}) => {
  const gradeStyle = GRADE_STYLES[card.grade] || GRADE_STYLES.N;
  const level = owned?.level || 1;
  const statMult = 1 + (level - 1) * 0.1;

  const currentHp = Math.round(card.hp * statMult);
  const currentAtk = Math.round(card.atk * statMult);
  const currentDef = Math.round(card.def * statMult);

  const sizeClasses = {
    sm: 'w-36 h-52 p-2 text-xs',
    md: 'w-44 h-64 p-3 text-sm',
    lg: 'w-56 h-80 p-4 text-base',
  };

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-200 transform select-none rounded-xl border-2 flex flex-col justify-between overflow-hidden bg-gradient-to-b ${gradeStyle.bg} ${gradeStyle.border} ${sizeClasses[size]} ${
        isSelected ? 'ring-4 ring-yellow-400 -translate-y-2' : 'hover:-translate-y-1 hover:brightness-110'
      } ${isInDeck ? 'ring-2 ring-emerald-400' : ''}`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between z-10">
        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${gradeStyle.badge}`}>
          {card.grade}
        </span>
        <div className="flex items-center gap-1">
          <span title={card.element} className="text-sm">
            {ELEMENT_ICONS[card.element]}
          </span>
          {owned && (
            <span className="bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-amber-300 font-bold border border-amber-500/40">
              Lv.{owned.level}
            </span>
          )}
        </div>
      </div>

      {/* Avatar Artwork Box */}
      <div className="relative my-auto flex flex-col items-center justify-center py-2">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-3xl sm:text-4xl shadow-inner relative group">
          <span>{card.avatarIcon}</span>
          <div
            className="absolute inset-0 rounded-2xl opacity-20 filter blur-sm"
            style={{ backgroundColor: card.colorAccent }}
          />
        </div>
        <div className="text-center mt-2 px-1">
          <h4 className="font-bold text-zinc-100 truncate max-w-[140px] text-xs sm:text-sm">
            {card.nameKo}
          </h4>
          <p className="text-[10px] text-zinc-400 truncate">{card.title}</p>
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div className="z-10 bg-black/50 backdrop-blur-xs rounded-lg p-1.5 border border-white/5 space-y-0.5">
        <div className="grid grid-cols-3 text-center text-[10px] font-mono">
          <div className="flex items-center justify-center gap-0.5 text-rose-400">
            <Heart className="w-2.5 h-2.5" />
            <span>{currentHp}</span>
          </div>
          <div className="flex items-center justify-center gap-0.5 text-amber-400">
            <Swords className="w-2.5 h-2.5" />
            <span>{currentAtk}</span>
          </div>
          <div className="flex items-center justify-center gap-0.5 text-blue-400">
            <Shield className="w-2.5 h-2.5" />
            <span>{currentDef}</span>
          </div>
        </div>
      </div>

      {/* In-Deck Badge Indicator */}
      {isInDeck && (
        <div className="absolute top-1 left-1 bg-emerald-500 text-black text-[9px] font-black px-1 rounded uppercase tracking-tighter shadow-md">
          DECK
        </div>
      )}

      {/* Card No watermark */}
      <span className="absolute bottom-1 right-2 text-[9px] text-zinc-600 font-mono">
        #{card.no.toString().padStart(3, '0')}
      </span>
    </div>
  );
};
