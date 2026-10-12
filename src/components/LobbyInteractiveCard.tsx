import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
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
  card,
  index,
  totalCards,
  lowSpecMode,
  language = 'ko',
  onCardClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const rafId = useRef<number | null>(null);

  // 5장 겹침 부채꼴(Fan/Stack) 덱 레이아웃 계산 (중앙 카드 기준 대칭 분산)
  const centerOffset = index - Math.floor(totalCards / 2);
  const rotation = centerOffset * 6;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const xOffset = centerOffset * (isMobile ? 32 : 50);
  const yOffset = Math.abs(centerOffset) * (isMobile ? 6 : 10);

  const getFaction = useCallback((): string => {
    const title = (card.title_dis || card.title || '').toLowerCase();
    if (title.includes('화염') || title.includes('불') || title.includes('fire') || (card.imageIndex !== undefined && card.imageIndex <= 20)) return 'fire';
    if (title.includes('물') || title.includes('빙') || title.includes('water') || (card.imageIndex !== undefined && card.imageIndex <= 40)) return 'water';
    if (title.includes('바람') || title.includes('풍') || title.includes('wind') || (card.imageIndex !== undefined && card.imageIndex <= 60)) return 'wind';
    if (title.includes('빛') || title.includes('전기') || title.includes('thunder') || (card.imageIndex !== undefined && card.imageIndex <= 80)) return 'light';
    return 'earth';
  }, [card]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lowSpecMode || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 14;
    const rotateX = -((y - centerY) / centerY) * 14;
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
      role="button"
      tabIndex={0}
      aria-label={`${card.title_dis || card.title || card.id}, ${index + 1}/${totalCards}`}
      className={cn(
        "absolute flex flex-col items-center gap-1 transform-gpu pointer-events-auto cursor-pointer transition-shadow",
        isHovered ? "z-40 scale-108" : ""
      )}
      style={{
        transform: `translateX(${xOffset}px) translateY(${yOffset}px) rotate(${rotation}deg)`,
        zIndex: isHovered ? 50 : index + 10,
        perspective: '800px',
      }}
    >
      <div
        className="relative overflow-hidden rounded-lg transition-transform duration-100 ease-out shadow-xl"
        style={{
          transform: !lowSpecMode && isHovered
            ? `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(1.05)`
            : undefined,
        }}
      >
        <CardItem
          card={card}
          language={language}
          lowSpecMode={lowSpecMode}
          className="w-24 h-34 sm:w-32 sm:h-44 md:w-36 md:h-50 rounded-lg border border-slate-700/30"
        />

        {/* Hologram Foil Shimmer Overlay */}
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
      </div>

      {/* Equipment Indicators */}
      <div className="flex flex-col items-center gap-0.5 mt-0.5 transition-opacity text-center">
        <div className="flex gap-1">
          {['necklace', 'ring1', 'ring2', 'boots'].map(slot => (
            <div
              key={slot}
              className={cn(
                "w-1.5 h-1.5 rounded-full border border-black/20",
                card.equipment?.[slot as EquipmentSlot]
                  ? cn("bg-yellow-400", lowSpecMode ? "" : "animate-pulse")
                  : "bg-slate-300"
              )}
            />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-0.5 max-w-[48px]">
          {INITIAL_SKILLS.filter(baseSkill => {
            const skill = card.skills?.find(s => s.id === baseSkill.id);
            return (skill?.level || 0) > 0;
          }).map(baseSkill => (
            <div
              key={baseSkill.id}
              className={cn(
                "w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_2px_rgba(34,211,238,0.5)]",
                lowSpecMode ? "" : "animate-pulse"
              )}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
