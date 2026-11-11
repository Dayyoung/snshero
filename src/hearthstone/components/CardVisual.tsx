import React, { useEffect, useState } from 'react';
import {
  CLASS_CREST_URL,
  formatCardHtmlText,
  getCardArtUrl,
  getCardBustUrl,
  getCardTileUrl,
  getHeroArtUrl,
} from '../cardDb';
import {
  getHeroAttack,
  getMinionAttack,
  getMinionHealth,
  getMinionMaxHealth,
  hasMinionTaunt,
} from '../engine/GameEngine';
import {
  CLASSIC_HEROES,
  CardClass,
  CardRarity,
  ClassicCardDef,
  MinionInstance,
  PlayerBattleState,
} from '../types';
import {
  SNS_ICON_URL,
  SnsArmorCrestSvg,
  SnsDivineBarrierSvg,
  SnsLegendaryCrestSvg,
  SnsSecretOrbSvg,
  SnsSnowCompassSeal,
  SnsTauntShieldSvg,
} from './SnsHeroArtKit';

export const RACE_KO: Record<string, string> = {
  BEAST: '영수',
  DEMON: '심연마족',
  DRAGON: '용족',
  MURLOC: '해수족',
  PIRATE: '흑풍단',
  TOTEM: '정령석',
  MECHANICAL: '마공학',
  UNDEAD: '언데드',
};

/* ============================================================================
 * 1. Bespoke Sculpted Jewels & Currency Icons (Zero External Assets)
 * ============================================================================ */

export const HsManaGem: React.FC<{
  value: number | string;
  state?: 'normal' | 'buffed' | 'nerfed';
  size?: number;
  active?: boolean;
  className?: string;
}> = ({ value, state = 'normal', size = 34, active = false, className = '' }) => {
  const numColor =
    state === 'buffed' ? '#4ade80' : state === 'nerfed' ? '#ff5555' : '#ffffff';
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex shrink-0 select-none items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        className={`h-full w-full ${
          active
            ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.95)]'
            : 'drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]'
        }`}
      >
        <defs>
          <linearGradient id="hsSapphireBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="38%" stopColor="#2563eb" />
            <stop offset="78%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="hsSapphireRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
        <polygon
          points="32,3 58,18 58,46 32,61 6,46 6,18"
          fill="url(#hsSapphireRim)"
          stroke="#091128"
          strokeWidth="2.6"
        />
        <polygon
          points="32,8 53,20 53,44 32,56 11,44 11,20"
          fill="url(#hsSapphireBody)"
        />
        <polygon points="32,8 53,20 32,30 11,20" fill="rgba(186,230,253,0.45)" />
        <polygon points="11,20 32,30 20,47 11,44" fill="rgba(96,165,250,0.28)" />
        <polygon points="53,20 53,44 32,56 32,30" fill="rgba(15,23,42,0.42)" />
      </svg>
      <span
        style={{
          color: numColor,
          fontSize: Math.max(11, Math.round(size * 0.54)),
        }}
        className="hs-num pointer-events-none absolute inset-0 flex items-center justify-center pb-[1px]"
      >
        {value}
      </span>
    </div>
  );
};

export const HsAttackBadge: React.FC<{
  value: number;
  buffed?: boolean;
  isWeapon?: boolean;
  size?: number;
  className?: string;
}> = ({ value, buffed = false, isWeapon = false, size = 36, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex shrink-0 select-none items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 68 68"
        className="h-full w-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]"
      >
        <defs>
          <radialGradient id="hsAtkGold" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="85%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#451a03" />
          </radialGradient>
          <radialGradient id="hsAtkSteel" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>
        <g stroke="#140c06" strokeWidth="2.2" strokeLinejoin="round">
          <polygon points="8,8 15,6 24,15 15,24 6,15" fill="#78716c" />
          <polygon points="9,24 24,9 28,13 13,28" fill="#d6b36a" />
          <polygon points="48,44 63,56 56,63 44,48" fill="#cbd5e1" />
        </g>
        <circle
          cx="35"
          cy="37"
          r="22"
          fill={isWeapon ? 'url(#hsAtkSteel)' : 'url(#hsAtkGold)'}
          stroke={isWeapon ? '#cbd5e1' : '#fde68a'}
          strokeWidth="2.8"
        />
        <circle cx="35" cy="37" r="24.2" fill="none" stroke="#180d05" strokeWidth="2" />
        <ellipse
          cx="29"
          cy="28"
          rx="9"
          ry="5"
          fill="rgba(255,255,255,0.34)"
          transform="rotate(-22 29 28)"
        />
      </svg>
      <span
        style={{
          color: buffed ? '#4ade80' : '#ffffff',
          fontSize: Math.max(13, Math.round(size * 0.54)),
        }}
        className="hs-num pointer-events-none absolute inset-0 flex items-center justify-center pl-[1px] pt-[3px]"
      >
        {value}
      </span>
    </div>
  );
};

export const HsHealthBadge: React.FC<{
  value: number;
  state?: 'normal' | 'damaged' | 'buffed';
  isWeaponDurability?: boolean;
  size?: number;
  className?: string;
}> = ({ value, state = 'normal', isWeaponDurability = false, size = 36, className = '' }) => {
  const color =
    state === 'damaged' ? '#ff6b6b' : state === 'buffed' ? '#4ade80' : '#ffffff';

  if (isWeaponDurability) {
    return (
      <div
        style={{ width: size, height: size * 1.08 }}
        className={`relative inline-flex shrink-0 select-none items-center justify-center ${className}`}
      >
        <svg viewBox="0 0 60 66" className="h-full w-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
          <path
            d="M30 4 L54 14 V34 C54 49 43 58 30 63 C17 58 6 49 6 34 V14 Z"
            fill="#334155"
            stroke="#e2e8f0"
            strokeWidth="3"
          />
          <path
            d="M30 10 L48 18 V33 C48 45 39 52 30 56 C21 52 12 45 12 33 V18 Z"
            fill="#0f172a"
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
        </svg>
        <span
          style={{ color, fontSize: Math.max(13, Math.round(size * 0.52)) }}
          className="hs-num pointer-events-none absolute inset-0 flex items-center justify-center pb-[1px]"
        >
          {value}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size * 1.12 }}
      className={`relative inline-flex shrink-0 select-none items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 60 68"
        className="h-full w-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]"
      >
        <defs>
          <radialGradient id="hsBloodRuby" cx="36%" cy="55%" r="60%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="35%" stopColor="#ef4444" />
            <stop offset="78%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </radialGradient>
        </defs>
        <path
          d="M30 4 C30 4 54 30 54 45 C54 58 43.5 65 30 65 C16.5 65 6 58 6 45 C6 30 30 4 30 4 Z"
          fill="url(#hsBloodRuby)"
          stroke="#cbd5e1"
          strokeWidth="2.8"
        />
        <path
          d="M30 2 C30 2 56 29 56 45 C56 59.5 44.5 67 30 67 C15.5 67 4 59.5 4 45 C4 29 30 2 30 2 Z"
          fill="none"
          stroke="#1c0908"
          strokeWidth="2"
        />
        <path
          d="M24 18 C18 28 14 37 15 45 C16 49 19 49 20 44 C21 36 24 27 27 19 Z"
          fill="rgba(255,255,255,0.38)"
        />
      </svg>
      <span
        style={{
          color,
          fontSize: Math.max(13, Math.round(size * 0.54)),
        }}
        className="hs-num pointer-events-none absolute inset-0 flex items-center justify-center pt-[7px]"
      >
        {value}
      </span>
    </div>
  );
};

export const HsGoldCoinIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    className="shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
  >
    <defs>
      <radialGradient id="hsCoinGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="45%" stopColor="#facc15" />
        <stop offset="85%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#713f12" />
      </radialGradient>
    </defs>
    <circle cx="20" cy="20" r="17" fill="url(#hsCoinGrad)" stroke="#422006" strokeWidth="2.5" />
    <circle cx="20" cy="20" r="12.5" fill="none" stroke="#fef08a" strokeWidth="1.4" opacity="0.75" />
    <path
      d="M20 11 L22.5 17.5 L29 20 L22.5 22.5 L20 29 L17.5 22.5 L11 20 L17.5 17.5 Z"
      fill="#78350f"
    />
  </svg>
);

export const HsArcaneDustVialIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    className="shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
  >
    <defs>
      <linearGradient id="hsDustGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="45%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect x="15" y="4" width="10" height="5" rx="2" fill="#b45309" stroke="#291507" strokeWidth="1.8" />
    <path
      d="M16 9 L24 9 L26 15 L33 27 C35 31 32 36 27 36 L13 36 C8 36 5 31 7 27 L14 15 Z"
      fill="url(#hsDustGrad)"
      stroke="#bae6fd"
      strokeWidth="2"
    />
    <circle cx="17" cy="26" r="2.2" fill="#ffffff" opacity="0.85" />
    <circle cx="24" cy="29" r="1.6" fill="#ffffff" opacity="0.7" />
  </svg>
);

/* ============================================================================
 * 2. Commercial Sculpted SNSHero Card Component (100% SNSHero Art & Lore)
 * ============================================================================ */

const CLASS_FRAME_GRADIENT: Record<CardClass, { frame: string; bezel: string; aura: string }> = {
  // 인간종족 (라이트헤븐 로열 블루 & 실버골드)
  PRIEST: {
    frame: 'linear-gradient(165deg, #3b82f6 0%, #1e3a8a 52%, #0f172a 100%)',
    bezel: '#eab308',
    aura: 'radial-gradient(circle at 50% 35%, rgba(147,197,253,0.55) 0%, rgba(15,23,42,0.92) 78%)',
  },
  // 물종족 (심연 사파이어)
  MAGE: {
    frame: 'linear-gradient(165deg, #0ea5e9 0%, #0369a1 52%, #082f49 100%)',
    bezel: '#7dd3fc',
    aura: 'radial-gradient(circle at 50% 35%, rgba(56,189,248,0.6) 0%, rgba(8,47,73,0.95) 78%)',
  },
  // 불종족 (불꽃 궁정 크림슨)
  WARRIOR: {
    frame: 'linear-gradient(165deg, #ef4444 0%, #991b1b 52%, #450a0a 100%)',
    bezel: '#f59e0b',
    aura: 'radial-gradient(circle at 50% 35%, rgba(251,146,60,0.6) 0%, rgba(69,10,10,0.95) 78%)',
  },
  // 바람종족 (바람섬 청록 에메랄드)
  HUNTER: {
    frame: 'linear-gradient(165deg, #14b8a6 0%, #0f766e 52%, #042f2e 100%)',
    bezel: '#99f6e4',
    aura: 'radial-gradient(circle at 50% 35%, rgba(45,212,191,0.55) 0%, rgba(4,47,46,0.95) 78%)',
  },
  // 땅종족 (대지 성채 황금 올리브)
  PALADIN: {
    frame: 'linear-gradient(165deg, #eab308 0%, #65a30d 48%, #365314 100%)',
    bezel: '#fef08a',
    aura: 'radial-gradient(circle at 50% 35%, rgba(250,204,21,0.55) 0%, rgba(26,46,5,0.95) 78%)',
  },
  // 언데드종족 (섀도우렐름 자수정)
  ROGUE: {
    frame: 'linear-gradient(165deg, #9333ea 0%, #4c1d95 52%, #1e1b4b 100%)',
    bezel: '#d8b4fe',
    aura: 'radial-gradient(circle at 50% 35%, rgba(192,132,252,0.52) 0%, rgba(15,10,40,0.95) 78%)',
  },
  // 엘프종족 (달빛 실반 포레스트)
  SHAMAN: {
    frame: 'linear-gradient(165deg, #22c55e 0%, #15803d 52%, #052e16 100%)',
    bezel: '#fde68a',
    aura: 'radial-gradient(circle at 50% 35%, rgba(74,222,128,0.52) 0%, rgba(5,46,22,0.95) 78%)',
  },
  // 드워프종족 (딥포지 용광로 브론즈)
  WARLOCK: {
    frame: 'linear-gradient(165deg, #d97706 0%, #92400e 52%, #291205 100%)',
    bezel: '#fcd34d',
    aura: 'radial-gradient(circle at 50% 35%, rgba(251,191,36,0.55) 0%, rgba(41,18,5,0.95) 78%)',
  },
  // 동물종족 (야성의 대지 루비 앰버)
  DRUID: {
    frame: 'linear-gradient(165deg, #e11d48 0%, #881337 52%, #3b0819 100%)',
    bezel: '#fda4af',
    aura: 'radial-gradient(circle at 50% 35%, rgba(251,113,133,0.52) 0%, rgba(59,8,25,0.95) 78%)',
  },
  // 중립 (성흔 석조 슬레이트 — 로봇/용/110종족)
  NEUTRAL: {
    frame: 'linear-gradient(165deg, #78716c 0%, #44403c 52%, #1c1917 100%)',
    bezel: '#d6b36a',
    aura: 'radial-gradient(circle at 50% 35%, rgba(214,179,106,0.42) 0%, rgba(28,25,23,0.95) 78%)',
  },
  DREAM: {
    frame: 'linear-gradient(165deg, #10b981 0%, #047857 52%, #022c22 100%)',
    bezel: '#a7f3d0',
    aura: 'radial-gradient(circle at 50% 35%, rgba(52,211,153,0.55) 0%, rgba(2,44,34,0.95) 78%)',
  },
};

const RARITY_GEM_STYLE: Record<CardRarity, string | null> = {
  FREE: null,
  COMMON: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 65%, #475569 100%)',
  RARE: 'radial-gradient(circle at 35% 35%, #93c5fd 0%, #2563eb 65%, #1e3a8a 100%)',
  EPIC: 'radial-gradient(circle at 35% 35%, #f5d0fe 0%, #9333ea 65%, #4c1d95 100%)',
  LEGENDARY: 'radial-gradient(circle at 35% 35%, #fef08a 0%, #f97316 65%, #9a3412 100%)',
};

export interface HearthstoneCardProps {
  card: ClassicCardDef;
  effectiveCost?: number;
  spellPowerBonus?: number;
  velenMultiplier?: number;
  playableGlow?: 'NONE' | 'GREEN' | 'COMBO';
  rarityAura?: CardRarity;
  isGolden?: boolean;
  size?: 'XS' | 'SM' | 'MD' | 'LG';
  enableTilt?: boolean;
  onClick?: () => void;
  className?: string;
}

export const HearthstoneCard: React.FC<HearthstoneCardProps> = ({
  card,
  effectiveCost,
  spellPowerBonus = 0,
  velenMultiplier = 1,
  playableGlow = 'NONE',
  rarityAura,
  isGolden = false,
  size = 'MD',
  enableTilt = false,
  onClick,
  className = '',
}) => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [useCutoutFallback, setUseCutoutFallback] = useState(false);

  useEffect(() => {
    setUseCutoutFallback(false);
  }, [card.id]);

  const shownCost = effectiveCost !== undefined ? effectiveCost : card.cost;
  const costState: 'normal' | 'buffed' | 'nerfed' =
    shownCost < card.cost ? 'buffed' : shownCost > card.cost ? 'nerfed' : 'normal';

  const hasDynamicSpellAmplify =
    card.type === 'SPELL' &&
    (spellPowerBonus > 0 || velenMultiplier > 1) &&
    /[$#]\d+/.test(card.text || '');

  const dims =
    size === 'XS'
      ? {
          w: 96,
          h: 144,
          manaGem: 23,
          statGem: 24,
          titleCls: 'text-[8px]',
          bodyCls: 'text-[6.8px]',
          tagCls: 'text-[6.5px]',
        }
      : size === 'SM'
        ? {
            w: 132,
            h: 198,
            manaGem: 30,
            statGem: 31,
            titleCls: 'text-[10px]',
            bodyCls: 'text-[8.2px]',
            tagCls: 'text-[7.5px]',
          }
        : size === 'LG'
          ? {
              w: 236,
              h: 354,
              manaGem: 50,
              statGem: 52,
              titleCls: 'text-[14.5px]',
              bodyCls: 'text-[11.2px]',
              tagCls: 'text-[10px]',
            }
          : {
              w: 176,
              h: 264,
              manaGem: 38,
              statGem: 40,
              titleCls: 'text-[11.5px]',
              bodyCls: 'text-[9.2px]',
              tagCls: 'text-[8.5px]',
            };

  const silhouetteFilterClass =
    playableGlow === 'COMBO'
      ? 'hs-card-glow-combo'
      : playableGlow === 'GREEN'
        ? 'hs-card-glow-green'
        : rarityAura === 'LEGENDARY'
          ? 'hs-card-glow-legendary'
          : rarityAura === 'EPIC'
            ? 'hs-card-glow-epic'
            : rarityAura === 'RARE'
              ? 'hs-card-glow-rare'
              : 'hs-card-shadow-base';

  const theme = CLASS_FRAME_GRADIENT[card.cardClass] || CLASS_FRAME_GRADIENT.NEUTRAL;
  const isWeapon = card.type === 'WEAPON';
  const isSpell = card.type === 'SPELL';
  const portraitSrc = useCutoutFallback ? getCardArtUrl(card) : getCardBustUrl(card);
  const bottomTribeText =
    (card.race && RACE_KO[card.race]) || card.snsFactionKo || '';

  return (
    <div
      onClick={onClick}
      onMouseMove={(e) => {
        if (!enableTilt) return;
        const r = e.currentTarget.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        setTilt({ rx: -ny * 14, ry: nx * 14 });
      }}
      onMouseLeave={() => enableTilt && setTilt({ rx: 0, ry: 0 })}
      style={{
        width: dims.w,
        height: dims.h,
        transform:
          enableTilt && (tilt.rx !== 0 || tilt.ry !== 0)
            ? `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
            : undefined,
      }}
      className={`relative select-none transition-transform duration-150 ${silhouetteFilterClass} ${className}`}
    >
      {/* Main Sculpted Card Body */}
      <div
        style={{
          background: isGolden
            ? 'linear-gradient(155deg, #fef08a 0%, #eab308 38%, #92400e 72%, #facc15 100%)'
            : isWeapon
              ? 'linear-gradient(165deg, #64748b 0%, #1e293b 55%, #090d16 100%)'
              : theme.frame,
          borderColor: isGolden ? '#fef9c3' : isWeapon ? '#cbd5e1' : theme.bezel,
        }}
        className="relative mx-auto mt-[6%] flex h-[88%] w-[88%] flex-col justify-between rounded-[14px] border-[2.5px] p-[5%] shadow-[inset_0_1px_2px_rgba(255,255,255,0.48),inset_0_-4px_10px_rgba(0,0,0,0.65)]"
      >
        {/* Subtle inner filigree border */}
        <div className="pointer-events-none absolute inset-[3px] rounded-[11px] border border-amber-100/25" />

        {/* Legendary Twin-Wing Dragon Crown Crest */}
        {card.rarity === 'LEGENDARY' && (
          <SnsLegendaryCrestSvg className="absolute -top-[10%] left-1/2 z-20 w-[94%] -translate-x-1/2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" />
        )}

        {/* Top-Left Faceted Mana Sapphire */}
        <div className="pointer-events-none absolute -left-[7%] -top-[6%] z-30">
          <HsManaGem value={shownCost} state={costState} size={dims.manaGem} active={shownCost !== card.cost} />
        </div>

        {/* Character / Spell / Weapon Portrait Window */}
        <div
          style={{
            background: theme.aura,
            borderColor: isGolden ? '#fef08a' : isWeapon ? '#cbd5e1' : '#e7c985',
          }}
          className={`relative z-10 mx-auto mt-[2%] h-[49%] w-[86%] overflow-hidden border-[2.5px] shadow-[inset_0_4px_12px_rgba(0,0,0,0.85),0_3px_8px_rgba(0,0,0,0.65)] ${
            isSpell
              ? 'rounded-t-[44%] rounded-b-[10px]'
              : isWeapon
                ? 'rounded-[14px]'
                : 'rounded-[50%]'
          }`}
        >
          <img
            src={portraitSrc}
            alt={card.name}
            draggable={false}
            onError={() => {
              if (!useCutoutFallback) setUseCutoutFallback(true);
            }}
            className="h-full w-full scale-[1.08] object-cover object-top"
          />
          {/* Vignette & Weapon Prop Badge */}
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_-14px_18px_rgba(0,0,0,0.62)]" />
          {isWeapon && card.propUrl && (
            <img
              src={card.propUrl}
              alt=""
              draggable={false}
              className="pointer-events-none absolute bottom-1 right-1 h-[38%] w-[38%] rounded-full border border-amber-200/80 object-cover shadow-md"
            />
          )}
        </div>

        {/* Sculpted S-Curved Parchment Name Ribbon */}
        <div
          style={{
            background: isWeapon
              ? 'linear-gradient(180deg, #e2e8f0 0%, #94a3b8 55%, #475569 100%)'
              : 'linear-gradient(180deg, #fff9eb 0%, #ecd5a6 55%, #c79f59 100%)',
          }}
          className="relative z-20 -mt-[6%] rounded-[9px] border-[1.8px] border-[#4a2e12] px-1.5 py-[2px] text-center shadow-[0_3px_6px_rgba(0,0,0,0.65)]"
        >
          <span
            className={`hs-outline-sm block truncate font-extrabold tracking-tight text-white ${dims.titleCls}`}
          >
            {card.name}
          </span>
        </div>

        {/* Faceted Rarity Oval Jewel */}
        <div className="relative z-20 -my-[3%] flex h-[10px] items-center justify-center">
          {RARITY_GEM_STYLE[card.rarity] && (
            <div
              style={{ background: RARITY_GEM_STYLE[card.rarity]! }}
              className="h-[11px] w-[9px] rounded-full border-[1.4px] border-[#261608] shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
            />
          )}
        </div>

        {/* Parchment Ability Text Scroll + Snow-Emblem Watermark */}
        <div
          style={{
            background: isWeapon
              ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(180deg, #fbf3df 0%, #e5d1a7 100%)',
          }}
          className={`relative z-10 flex h-[34%] items-center justify-center overflow-hidden rounded-[8px] border px-1.5 py-1 text-center shadow-[inset_0_2px_6px_rgba(0,0,0,0.28)] ${
            isWeapon
              ? 'border-slate-500/70 text-slate-100'
              : 'border-[#6b4924] text-[#22150a]'
          }`}
        >
          <img
            src={SNS_ICON_URL}
            alt=""
            draggable={false}
            className="pointer-events-none absolute h-[64%] w-[64%] object-contain opacity-[0.11]"
          />
          <div
            className={`relative z-10 line-clamp-4 font-bold leading-[1.18] ${dims.bodyCls}`}
            dangerouslySetInnerHTML={{
              __html: formatCardHtmlText(card.text, spellPowerBonus, velenMultiplier),
            }}
          />
        </div>

        {/* Bottom Faction / Tribe Plaque */}
        {bottomTribeText && (
          <div className="pointer-events-none absolute -bottom-[3.2%] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-[5px] border border-[#5a3b1b] bg-gradient-to-b from-[#432c16] to-[#231509] px-1.5 py-[0.5px] shadow">
            <span className={`font-extrabold text-amber-200 ${dims.tagCls}`}>
              {bottomTribeText}
            </span>
          </div>
        )}

        {/* Golden Foil Specular Shimmer */}
        {isGolden && (
          <div
            style={{
              background:
                'linear-gradient(115deg, transparent 30%, rgba(254,240,138,0.38) 48%, rgba(255,255,255,0.6) 50%, rgba(250,204,21,0.32) 54%, transparent 70%)',
              backgroundSize: '240% 100%',
              animation: 'hsGoldenFoil 3.4s linear infinite',
            }}
            className="pointer-events-none absolute inset-0 z-20 rounded-[14px] mix-blend-screen"
          />
        )}

        {/* Bottom-Left Attack Badge */}
        {(card.type === 'MINION' || card.type === 'WEAPON') && (
          <div className="pointer-events-none absolute -bottom-[7%] -left-[7%] z-30">
            <HsAttackBadge
              value={card.attack ?? 0}
              isWeapon={isWeapon}
              size={dims.statGem}
            />
          </div>
        )}

        {/* Bottom-Right Health / Weapon Durability Badge */}
        {card.type === 'MINION' && (
          <div className="pointer-events-none absolute -bottom-[8%] -right-[7%] z-30">
            <HsHealthBadge value={card.health ?? 1} size={dims.statGem} />
          </div>
        )}
        {isWeapon && (
          <div className="pointer-events-none absolute -bottom-[7%] -right-[7%] z-30">
            <HsHealthBadge
              value={card.durability ?? 1}
              isWeaponDurability
              size={dims.statGem}
            />
          </div>
        )}

        {/* Live Dynamic Spell Damage Amplification Tag */}
        {hasDynamicSpellAmplify && (
          <div className="pointer-events-none absolute -top-2 right-1 z-30 whitespace-nowrap rounded-full border border-sky-300 bg-sky-950/95 px-1.5 py-[0.5px] text-[8.5px] font-extrabold text-sky-200 shadow-lg">
            ✦ 증폭 {velenMultiplier > 1 ? `×${velenMultiplier}` : `+${spellPowerBonus}`}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. Commercial Battlefield Oval Minion Token
 * ============================================================================ */

export interface BoardMinionTokenProps {
  minion: MinionInstance;
  canAttack: boolean;
  isSelectedAttacker: boolean;
  isValidTarget: boolean;
  onSelect: () => void;
  onHoverChange?: (hovering: boolean) => void;
}

export const BoardMinionToken: React.FC<BoardMinionTokenProps> = ({
  minion,
  canAttack,
  isSelectedAttacker,
  isValidTarget,
  onSelect,
  onHoverChange,
}) => {
  const [imgErr, setImgErr] = useState(false);
  const atk = getMinionAttack(minion);
  const hp = getMinionHealth(minion);
  const maxHp = getMinionMaxHealth(minion);
  const isTaunt = hasMinionTaunt(minion);

  const hpState: 'normal' | 'damaged' | 'buffed' =
    hp < maxHp ? 'damaged' : maxHp > minion.baseHealth ? 'buffed' : 'normal';

  const hasDeathrattle =
    !minion.silenced &&
    (minion.soulOfTheForestCount > 0 ||
      minion.ancestralSpiritCount > 0 ||
      [
        'EX1_029',
        'EX1_096',
        'EX1_012',
        'EX1_556',
        'EX1_534',
        'EX1_097',
        'EX1_577',
        'EX1_016',
        'EX1_110',
        'EX1_383',
      ].includes(minion.cardId));

  const showSleepZzz =
    minion.exhausted && !minion.charge && !minion.auraCharge && !minion.cantAttack;

  return (
    <div
      data-hs-entity={minion.uid}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={`group relative flex h-[66px] w-[48px] shrink-0 cursor-pointer select-none items-center justify-center transition-transform duration-150 sm:h-[120px] sm:w-[96px] ${
        isSelectedAttacker
          ? 'z-30 -translate-y-2 scale-110 sm:-translate-y-3 sm:scale-112'
          : 'hover:z-20 hover:scale-106'
      }`}
    >
      {/* Sculpted Snow-Emblem Taunt Shield Frame */}
      {isTaunt && (
        <SnsTauntShieldSvg className="absolute -inset-1.5 z-0 h-[calc(100%+12px)] w-[calc(100%+12px)] drop-shadow-[0_6px_12px_rgba(0,0,0,0.92)] sm:-inset-2.5 sm:h-[calc(100%+20px)] sm:w-[calc(100%+20px)]" />
      )}

      {/* Ready-to-Attack / Valid Target Organic Aura */}
      {(canAttack || isValidTarget || isSelectedAttacker) && (
        <div
          className={`pointer-events-none absolute -inset-0.5 z-0 rounded-[50%] transition-all sm:-inset-1 ${
            isSelectedAttacker
              ? 'shadow-[0_0_0_3px_#fde047,0_0_18px_5px_rgba(250,204,21,0.95)] sm:shadow-[0_0_0_4px_#fde047,0_0_26px_8px_rgba(250,204,21,0.95)]'
              : isValidTarget
                ? 'animate-pulse shadow-[0_0_0_3px_#ef4444,0_0_18px_5px_rgba(239,68,68,0.92)] sm:shadow-[0_0_0_4px_#ef4444,0_0_24px_7px_rgba(239,68,68,0.92)]'
                : 'shadow-[0_0_0_2.5px_#4ade80,0_0_14px_4px_rgba(34,197,94,0.88)] sm:shadow-[0_0_0_3.5px_#4ade80,0_0_20px_6px_rgba(34,197,94,0.88)]'
          }`}
        />
      )}

      {/* Sculpted Legendary Crown Crest */}
      {minion.rarity === 'LEGENDARY' && (
        <SnsLegendaryCrestSvg className="absolute -top-2.5 left-1/2 z-30 w-[108%] -translate-x-1/2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] sm:-top-4" />
      )}

      {/* Oval Portrait + Chiseled Stone Bezel */}
      <div
        className={`relative z-10 h-[58px] w-[43px] overflow-hidden rounded-[50%] border-[2.5px] bg-stone-950 shadow-[0_8px_16px_rgba(0,0,0,0.88),inset_0_0_10px_rgba(0,0,0,0.85)] sm:h-[106px] sm:w-[84px] sm:border-[4px] ${
          minion.frozen
            ? 'border-cyan-200 ring-2 ring-sky-400/75 sm:ring-4'
            : isTaunt
              ? 'border-[#ebd094]'
              : 'border-[#b9965b]'
        }`}
      >
        {!imgErr ? (
          <img
            src={getCardBustUrl(minion.cardId)}
            alt={minion.name}
            onError={() => setImgErr(true)}
            className={`h-full w-full scale-110 object-cover object-top ${
              minion.stealth ? 'brightness-50 contrast-125 saturate-50' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-900 px-0.5 text-center text-[8px] font-bold text-amber-200 sm:px-1 sm:text-[11px]">
            {minion.name}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 rounded-[50%] shadow-[inset_0_0_14px_rgba(0,0,0,0.75)]" />

        {minion.stealth && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-950/60 via-slate-900/35 to-slate-950/75">
            <span className="hs-outline-sm rounded border border-slate-400/50 bg-slate-950/85 px-1 py-0.5 text-[7.5px] font-extrabold tracking-wider text-slate-200 sm:px-1.5 sm:text-[9px]">
              은신
            </span>
          </div>
        )}

        {minion.frozen && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-100/55 via-sky-400/25 to-blue-700/50" />
        )}

        {minion.windfury && !minion.silenced && (
          <div className="pointer-events-none absolute inset-x-0 top-1 flex justify-center sm:top-2">
            <span className="hs-outline-sm rounded-full border border-cyan-300/60 bg-sky-950/85 px-1 text-[7px] font-extrabold text-cyan-200 sm:px-1.5 sm:text-[8.5px]">
              질풍
            </span>
          </div>
        )}

        {minion.silenced && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-purple-950/25">
            <svg viewBox="0 0 48 48" className="h-7 w-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] sm:h-12 sm:w-12">
              <circle cx="24" cy="24" r="18" fill="none" stroke="#e879f9" strokeWidth="3.2" strokeDasharray="5 3" />
              <line x1="11" y1="11" x2="37" y2="37" stroke="#f0abfc" strokeWidth="4" strokeLinecap="round" />
              <line x1="37" y1="11" x2="11" y2="37" stroke="#f0abfc" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Divine Shield Golden Barrier Dome */}
      {minion.divineShield && (
        <SnsDivineBarrierSvg className="absolute -inset-1 z-20 h-[calc(100%+8px)] w-[calc(100%+8px)] drop-shadow-[0_0_14px_rgba(250,204,21,0.9)] sm:-inset-2 sm:h-[calc(100%+16px)] sm:w-[calc(100%+16px)]" />
      )}

      {showSleepZzz && (
        <div className="hs-num pointer-events-none absolute -right-1 -top-1.5 z-30 animate-bounce text-[9px] text-sky-200 sm:-top-2 sm:text-xs">
          Zzz
        </div>
      )}

      {(hasDeathrattle || (!minion.silenced && (minion.poisonous || minion.spellDamage > 0))) && (
        <div className="pointer-events-none absolute -bottom-2 left-1/2 z-30 flex -translate-x-1/2 origin-bottom scale-[0.72] items-center gap-0.5 whitespace-nowrap rounded-full border border-[#d8b267] bg-stone-950/95 px-1.5 py-[1px] text-[9px] font-extrabold text-amber-200 shadow-lg sm:-bottom-2.5 sm:scale-100 sm:gap-1 sm:px-2 sm:py-[1.5px] sm:text-[9.5px]">
          {hasDeathrattle && (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-stone-200" aria-label="죽음의 메아리">
              <path d="M12 2C7.5 2 4 5.4 4 9.7c0 2.8 1.5 5.2 3.8 6.5V19c0 .6.4 1 1 1h6.4c.6 0 1-.4 1-1v-2.8c2.3-1.3 3.8-3.7 3.8-6.5C20 5.4 16.5 2 12 2zm-3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
            </svg>
          )}
          {!minion.silenced && minion.poisonous && (
            <span className="text-emerald-400">독성</span>
          )}
          {!minion.silenced && minion.spellDamage > 0 && (
            <span className="text-sky-300">✦+{minion.spellDamage}</span>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute -bottom-1.5 -left-1.5 z-30 origin-bottom-left scale-[0.62] sm:-bottom-2 sm:-left-2.5 sm:scale-100">
        <HsAttackBadge value={atk} buffed={atk > minion.baseAttack} size={36} />
      </div>

      <div className="pointer-events-none absolute -bottom-2 -right-1.5 z-30 origin-bottom-right scale-[0.62] sm:-bottom-2.5 sm:-right-2.5 sm:scale-100">
        <HsHealthBadge value={hp} state={hpState} size={35} />
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. Commercial Hero Arch Portrait + Weapon Sheathe + Hero Power Coin
 * ============================================================================ */

export interface HeroZoneProps {
  player: PlayerBattleState;
  isFriendly: boolean;
  isActiveTurn: boolean;
  canHeroAttack: boolean;
  isHeroSelectedAttacker: boolean;
  isHeroValidTarget: boolean;
  canUseHeroPower: boolean;
  isHeroPowerSelected: boolean;
  emoteBubbleText?: string | null;
  onClickHero: () => void;
  onClickHeroPower: () => void;
}

export const HeroPortraitZone: React.FC<HeroZoneProps> = ({
  player,
  isFriendly,
  isActiveTurn,
  canHeroAttack,
  isHeroSelectedAttacker,
  isHeroValidTarget,
  canUseHeroPower,
  isHeroPowerSelected,
  emoteBubbleText,
  onClickHero,
  onClickHeroPower,
}) => {
  const entityId = isFriendly ? 'PLAYER_HERO' : 'OPPONENT_HERO';
  const heroAtk = getHeroAttack(player, isActiveTurn);
  const heroMeta = CLASSIC_HEROES[player.heroClass];
  const weaponOpen = isActiveTurn && Boolean(player.weapon);

  return (
    <div className="relative flex select-none items-center justify-center gap-2 sm:gap-3.5">
      {/* Left: Equipped Weapon Medallion */}
      <div className="relative flex h-[54px] w-[54px] items-center justify-center sm:h-[80px] sm:w-[80px]">
        {player.weapon ? (
          <div
            title={`${player.weapon.name} (${player.weapon.attack}/${player.weapon.durability})`}
            className={`relative flex h-[50px] w-[50px] items-center justify-center rounded-full border-[2.5px] shadow-[0_8px_20px_rgba(0,0,0,0.9)] transition-all sm:h-[76px] sm:w-[76px] sm:border-[3.5px] ${
              weaponOpen
                ? 'border-[#ebd08c] bg-stone-950 ring-2 ring-emerald-400/70'
                : 'border-slate-500 bg-slate-900 brightness-80'
            }`}
          >
            {weaponOpen ? (
              <img
                src={getCardBustUrl(player.weapon.cardId)}
                alt={player.weapon.name}
                className="h-full w-full rounded-full object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950">
                <SnsSnowCompassSeal size={34} className="opacity-80" />
              </div>
            )}
            <div className="pointer-events-none absolute -bottom-1.5 -left-1.5 z-20 origin-bottom-left scale-[0.72] sm:-bottom-2 sm:-left-2 sm:scale-100">
              <HsAttackBadge value={player.weapon.attack} isWeapon size={30} />
            </div>
            <div className="hs-num pointer-events-none absolute -bottom-1 -right-1 z-20 flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-gradient-to-b from-slate-500 to-slate-900 text-[11px] text-white shadow-lg sm:-bottom-1.5 sm:-right-1.5 sm:h-7 sm:w-7 sm:rounded-md sm:border-2 sm:text-sm">
              {player.weapon.durability}
            </div>
          </div>
        ) : (
          <div className="h-[46px] w-[46px] rounded-full border-2 border-[#543a1f]/45 bg-black/25 shadow-inner sm:h-[68px] sm:w-[68px]" />
        )}
      </div>

      {/* Center: Sculpted Stone & Brass Hero Arch */}
      <div
        data-hs-entity={entityId}
        onClick={(e) => {
          e.stopPropagation();
          onClickHero();
        }}
        className={`relative flex h-[82px] w-[74px] cursor-pointer items-center justify-center transition-transform sm:h-[120px] sm:w-[108px] ${
          isHeroSelectedAttacker ? '-translate-y-1.5 scale-106 sm:-translate-y-2' : 'hover:scale-[1.03]'
        }`}
      >
        {/* Active Secrets Crown Medallions */}
        {player.secrets.length > 0 && (
          <div className="absolute -top-3 left-1/2 z-40 flex -translate-x-1/2 gap-0.5 sm:-top-4 sm:gap-1">
            {player.secrets.map((sec) => (
              <div
                key={sec.uid}
                title={
                  isFriendly
                    ? `내 비밀: ${sec.name}`
                    : `${CLASSIC_HEROES[sec.heroClass].classNameKo} 비밀: 조건이 충족되면 발동합니다!`
                }
                className="relative flex h-5 w-5 items-center justify-center rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.9)] sm:h-7 sm:w-7"
              >
                <SnsSecretOrbSvg heroClass={sec.heroClass} size={26} />
              </div>
            ))}
          </div>
        )}

        {/* Attack / Target Glow Ring */}
        {(canHeroAttack || isHeroValidTarget || isHeroSelectedAttacker) && (
          <div
            className={`pointer-events-none absolute -inset-1 rounded-t-[44px] rounded-b-[10px] sm:-inset-1.5 sm:rounded-t-[58px] sm:rounded-b-[14px] ${
              isHeroSelectedAttacker
                ? 'shadow-[0_0_0_3px_#fde047,0_0_20px_5px_rgba(250,204,21,0.92)] sm:shadow-[0_0_0_4px_#fde047,0_0_26px_7px_rgba(250,204,21,0.92)]'
                : isHeroValidTarget
                  ? 'animate-pulse shadow-[0_0_0_3px_#ef4444,0_0_20px_5px_rgba(239,68,68,0.92)] sm:shadow-[0_0_0_4px_#ef4444,0_0_24px_7px_rgba(239,68,68,0.92)]'
                  : 'shadow-[0_0_0_3px_#4ade80,0_0_16px_4px_rgba(34,197,94,0.88)] sm:shadow-[0_0_0_3.5px_#4ade80,0_0_18px_5px_rgba(34,197,94,0.88)]'
            }`}
          />
        )}

        {/* Chiseled Gold-Trimmed Hero Arch */}
        <div
          className={`relative h-full w-full overflow-hidden rounded-t-[44px] rounded-b-[10px] border-[3px] bg-stone-950 shadow-[0_10px_24px_rgba(0,0,0,0.92),inset_0_0_14px_rgba(0,0,0,0.85)] sm:rounded-t-[58px] sm:rounded-b-[14px] sm:border-[4.5px] ${
            player.immuneThisTurn
              ? 'border-yellow-200 ring-2 ring-amber-300 sm:ring-4'
              : player.frozen
                ? 'border-cyan-200 ring-2 ring-sky-400/75 sm:ring-4'
                : 'border-[#deb96e]'
          }`}
        >
          <img
            src={getHeroArtUrl(player.isJaraxxus ? 'EX1_323h' : player.heroId)}
            alt={player.heroNameKo}
            className="h-full w-full scale-110 object-cover object-top"
          />
          <img
            src={CLASS_CREST_URL[player.heroClass]}
            alt=""
            className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full opacity-90 drop-shadow sm:left-1.5 sm:top-1.5 sm:h-5 sm:w-5"
          />
          {player.frozen && (
            <div className="pointer-events-none absolute inset-0 bg-cyan-200/35" />
          )}
          {player.immuneThisTurn && (
            <div className="hs-outline-sm pointer-events-none absolute inset-x-0 top-1.5 text-center text-[8.5px] font-black text-yellow-200 sm:top-2 sm:text-[10px]">
              면역
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-1 pb-0.5 pt-3 text-center sm:px-1.5 sm:pb-1 sm:pt-4">
            <div className="hs-outline-sm truncate text-[8.5px] font-extrabold text-amber-100 sm:text-[10.5px]">
              {player.name}
            </div>
          </div>
        </div>

        {/* Hero Attack Sword Orb */}
        {heroAtk > 0 && (
          <div className="pointer-events-none absolute -bottom-2 -left-2.5 z-30 origin-bottom-left scale-[0.72] sm:-bottom-2.5 sm:-left-3 sm:scale-100">
            <HsAttackBadge value={heroAtk} size={40} />
          </div>
        )}

        {/* Sculpted Silver Armor Shield */}
        {player.armor > 0 && (
          <div className="pointer-events-none absolute -right-2.5 bottom-6 z-30 flex h-7 w-6.5 items-center justify-center sm:-right-3 sm:bottom-8 sm:h-10 sm:w-9">
            <SnsArmorCrestSvg className="h-full w-full drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]" />
            <span className="hs-num absolute inset-0 flex items-center justify-center pb-0.5 text-xs text-white sm:text-base">
              {player.armor}
            </span>
          </div>
        )}

        {/* Hero Health Crimson Blood-Drop */}
        <div className="pointer-events-none absolute -bottom-2.5 -right-2.5 z-30 origin-bottom-right scale-[0.72] sm:-bottom-3 sm:-right-3 sm:scale-100">
          <HsHealthBadge
            value={player.health}
            state={player.health < player.maxHealth ? 'damaged' : 'normal'}
            size={39}
          />
        </div>

        {/* Parchment Emote Speech Bubble */}
        {emoteBubbleText && (
          <div
            className={`pointer-events-none absolute left-1/2 z-50 w-44 -translate-x-1/2 rounded-2xl border-2 border-[#6e4c23] bg-gradient-to-b from-[#fcf6e6] to-[#e6d3ad] px-3 py-1.5 text-center text-[11px] font-extrabold text-[#24170b] shadow-[0_12px_28px_rgba(0,0,0,0.9)] sm:w-52 sm:translate-x-0 sm:px-3.5 sm:py-2 sm:text-xs ${
              isFriendly ? '-top-11 sm:-left-40 sm:-top-14' : '-bottom-11 sm:-bottom-14 sm:-left-40'
            }`}
          >
            “{emoteBubbleText}”
          </div>
        )}
      </div>

      {/* Right: Flipping Carved Brass Hero Power Coin */}
      <div className="relative flex h-[56px] w-[56px] items-center justify-center sm:h-[80px] sm:w-[80px]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClickHeroPower();
          }}
          title={`${player.heroPowerNameKo} (비용 2): ${player.heroPowerTextKo}`}
          className={`relative flex h-[52px] w-[52px] items-center justify-center rounded-full border-[2.5px] transition-all duration-300 sm:h-[76px] sm:w-[76px] sm:border-[3.5px] ${
            player.heroPowerUsedThisTurn
              ? 'border-stone-600 bg-stone-900 opacity-85'
              : isHeroPowerSelected
                ? 'scale-110 border-yellow-200 shadow-[0_0_0_3px_#fde047,0_0_18px_rgba(250,204,21,0.95)]'
                : canUseHeroPower
                  ? 'cursor-pointer border-[#edd189] shadow-[0_0_0_2.5px_#4ade80,0_0_14px_rgba(34,197,94,0.85)] hover:scale-106'
                  : 'border-[#b99554] bg-stone-950 shadow-[0_6px_16px_rgba(0,0,0,0.85)]'
          }`}
        >
          {player.heroPowerUsedThisTurn ? (
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-stone-950">
              <SnsSnowCompassSeal size={44} className="opacity-70" />
            </div>
          ) : (
            <>
              <img
                src={getCardTileUrl(player.heroPowerId)}
                alt={player.heroPowerNameKo}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = getHeroArtUrl(heroMeta.heroId);
                }}
                className="h-full w-full rounded-full object-cover object-top"
              />
              <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 scale-[0.82] sm:-top-2.5 sm:scale-100">
                <HsManaGem value={2} size={26} />
              </div>
              <div className="hs-outline-sm absolute inset-x-0 bottom-0 rounded-b-full bg-gradient-to-t from-black/90 via-black/65 to-transparent py-0.5 text-center text-[7px] font-extrabold text-amber-100 sm:py-1 sm:text-[8.5px]">
                {player.heroPowerNameKo}
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
