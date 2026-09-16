import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { CardData, EquipmentSlot } from '../types';
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
  onCardClick?: (card: CardData) => void;
}

export const LobbyInteractiveCard: React.FC<LobbyInteractiveCardProps> = ({
  card,
  index,
  totalCards,
  lowSpecMode,
  onCardClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const rafId = useRef<number | null>(null);

  const rotation = (index - 2) * 5;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const xOffset = (index - 2) * (isMobile ? 24 : 35);
  const yOffset = Math.abs(index - 2) * (isMobile ? 5 : 8);

  // Determine card element / faction
  const getFaction = useCallback((): string => {
    const title = (card.title_dis || card.title || '').toLowerCase();
    if (title.includes('화염') || title.includes('불') || title.includes('fire') || card.imageIndex <= 20) return 'fire';
    if (title.includes('물') || title.includes('빙') || title.includes('water') || card.imageIndex <= 40) return 'water';
    if (title.includes('바람') || title.includes('풍') || title.includes('wind') || card.imageIndex <= 60) return 'wind';
    if (title.includes('빛') || title.includes('전기') || title.includes('thunder') || card.imageIndex <= 80) return 'light';
    return 'earth';
  }, [card]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lowSpecMode || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 14; // max 14 deg
    const rotateX = -((y - centerY) / centerY) * 14; // max 14 deg
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setTilt({ rotateX, rotateY, glareX, glareY });
    });
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const faction = getFaction();
    playFactionSfx(faction);
    triggerHaptic('heavy');
    if (onCardClick) {
      onCardClick(card);
    }
  };

  return (
    <motion.div
      key={card.id}
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      className={cn(
        "absolute flex flex-col items-center gap-1 transform-gpu pointer-events-auto cursor-pointer transition-shadow",
        isHovered ? "z-30 scale-108" : ""
      )}
      style={{
        transform: `translateX(${xOffset}px) translateY(${yOffset}px) rotate(${rotation}deg)`,
        zIndex: isHovered ? 40 : index + 10,
        perspective: '800px',
      }}
    >
      <div
        className="relative overflow-hidden rounded-lg transition-transform duration-100 ease-out"
        style={{
          transform: !lowSpecMode && isHovered
            ? `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(1.06)`
            : undefined,
        }}
      >
        <CardItem
          card={card}
          className="w-20 h-28 sm:w-28 sm:h-40 md:w-32 md:h-44 shadow-2xl rounded-lg border border-slate-700/30"
        />

        {/* SCR-01-03: Hologram Foil Shimmer Overlay */}
        {!lowSpecMode && (
          <div
            className={cn(
              "absolute inset-0 pointer-events-none rounded-lg transition-opacity duration-200",
              isHovered ? "opacity-75" : "opacity-0"
            )}
            style={{
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.45) 0%, rgba(255,200,255,0.2) 30%, rgba(100,220,255,0.2) 60%, transparent 80%)`,
              mixBlendMode: 'color-dodge',
            }}
          />
        )}

        {/* Stats Summary Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-1 rounded-b-lg border-t border-slate-200 opacity-100">
          <div className="grid grid-cols-4 gap-0.5">
            {(['N', 'E', 'S', 'W'] as const).map((dir, statIdx) => (
              <div key={dir} className="flex flex-col items-center rounded bg-slate-50 px-0.5 py-0.5 ring-1 ring-slate-200">
                <span className="text-[5px] font-black text-slate-500 leading-none">{dir}</span>
                <span className="text-[8px] font-black text-slate-950 leading-none mt-0.5">{card.stats[statIdx]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equipment Indicators */}
      <div className="flex flex-col items-center gap-0.5 mt-1 transition-opacity translate-y-0 text-center">
        <div className="flex gap-0.5">
          {['necklace', 'ring1', 'ring2', 'boots'].map(slot => (
            <div
              key={slot}
              className={cn(
                "w-1 h-1 rounded-full",
                card.equipment?.[slot as EquipmentSlot]
                  ? cn("bg-yellow-400", lowSpecMode ? "" : "animate-pulse")
                  : "bg-slate-200"
              )}
            />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-0.5 max-w-[40px]">
          {INITIAL_SKILLS.filter(baseSkill => {
            const skill = card.skills?.find(s => s.id === baseSkill.id);
            return (skill?.level || 0) > 0;
          }).map(baseSkill => (
            <div
              key={baseSkill.id}
              className={cn(
                "w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_2px_rgba(34,211,238,0.5)]",
                lowSpecMode ? "" : "animate-pulse"
              )}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
