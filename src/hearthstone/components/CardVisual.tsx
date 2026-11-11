import React, { useEffect, useId, useState } from 'react';
import {
  CLASS_CREST_URL,
  cardDb,
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
 * 1. Bespoke Sculpted Jewels & Currency Icons (100% Original SNSHero Vector Art)
 * ============================================================================ */

export const HsManaGem: React.FC<{
  value: number | string;
  state?: 'normal' | 'buffed' | 'nerfed';
  size?: number;
  active?: boolean;
  className?: string;
}> = ({ value, state = 'normal', size = 34, active = false, className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const numColor =
    state === 'buffed' ? '#4ade80' : state === 'nerfed' ? '#ff6464' : '#ffffff';
  const strVal = String(value);
  const fontScale = strVal.length >= 3 ? 0.38 : strVal.length === 2 ? 0.48 : 0.56;

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex shrink-0 select-none items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 72 72"
        className={`h-full w-full ${
          active
            ? 'drop-shadow-[0_0_10px_rgba(56,189,248,0.95)]'
            : 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.88)]'
        }`}
      >
        <defs>
          <linearGradient id={`manaRim_${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="45%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <radialGradient id={`manaCore_${uid}`} cx="36%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="32%" stopColor="#38bdf8" />
            <stop offset="72%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0b1536" />
          </radialGradient>
        </defs>
        {/* Outer Sculpted Gold-Silver Setting */}
        <polygon
          points="36,3 64,19 64,53 36,69 8,53 8,19"
          fill={`url(#manaRim_${uid})`}
          stroke="#070d1f"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        {/* Inner Faceted Royal Sapphire */}
        <polygon
          points="36,8 59,21.5 59,50.5 36,64 13,50.5 13,21.5"
          fill={`url(#manaCore_${uid})`}
          stroke="#0c2461"
          strokeWidth="1.6"
        />
        {/* Crown & Pavilion Crystal Facets */}
        <polygon points="36,8 59,21.5 36,34 13,21.5" fill="rgba(224,242,254,0.48)" />
        <polygon points="13,21.5 36,34 22,53 13,50.5" fill="rgba(125,211,252,0.28)" />
        <polygon points="59,21.5 59,50.5 36,64 36,34" fill="rgba(7,14,38,0.46)" />
        <polygon
          points="36,16 50,24.5 50,47.5 36,56 22,47.5 22,24.5"
          fill="none"
          stroke="rgba(224,242,254,0.5)"
          strokeWidth="1.3"
        />
        <ellipse cx="28" cy="21" rx="7" ry="3.5" fill="rgba(255,255,255,0.65)" transform="rotate(-24 28 21)" />
      </svg>
      <span
        style={{
          color: numColor,
          fontSize: Math.max(11, Math.round(size * fontScale)),
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
  const uid = useId().replace(/:/g, '');
  const strVal = String(value);
  const fontScale = strVal.length >= 2 ? 0.48 : 0.56;

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex shrink-0 select-none items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 76 76"
        className="h-full w-full drop-shadow-[0_4px_7px_rgba(0,0,0,0.92)]"
      >
        <defs>
          <radialGradient id={`atkSun_${uid}`} cx="36%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="32%" stopColor="#fde047" />
            <stop offset="72%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#5c2404" />
          </radialGradient>
          <radialGradient id={`atkSteel_${uid}`} cx="36%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="85%" stopColor="#334155" />
            <stop offset="100%" stopColor="#090d16" />
          </radialGradient>
          <linearGradient id={`atkBlade_${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Sculpted Sword Pommel, Crossguard & Pointed Tip Behind Orb */}
        <g stroke="#160c05" strokeWidth="2.4" strokeLinejoin="round">
          {/* Pommel & Hilt (Top-Left) */}
          <circle cx="11" cy="11" r="5" fill="#f59e0b" />
          <polygon points="13,17 17,13 26,22 22,26" fill="#78350f" />
          <polygon points="10,27 27,10 31,14 14,31" fill="#fcd34d" />
          {/* Pointed Broadsword Tip (Bottom-Right) */}
          <polygon points="52,48 71,61 72,72 61,71 48,52" fill={`url(#atkBlade_${uid})`} />
        </g>

        {/* Sunburst Crown Spikes Around Attack Sphere */}
        <polygon
          points="39,9 44,17 53,13 52,23 62,24 56,33 65,39 56,45 62,54 52,55 53,65 44,61 39,69 34,61 25,65 26,55 16,54 22,45 13,39 22,33 16,24 26,23 25,13 34,17"
          fill={isWeapon ? '#94a3b8' : '#b45309'}
          stroke="#1a0d04"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* Central Beveled Attack Orb */}
        <circle
          cx="39"
          cy="39"
          r="22.5"
          fill={isWeapon ? `url(#atkSteel_${uid})` : `url(#atkSun_${uid})`}
          stroke={isWeapon ? '#e2e8f0' : '#fef3c7'}
          strokeWidth="2.8"
        />
        <circle cx="39" cy="39" r="24.5" fill="none" stroke="#180c04" strokeWidth="2" />
        <ellipse
          cx="32"
          cy="29"
          rx="9"
          ry="4.8"
          fill="rgba(255,255,255,0.42)"
          transform="rotate(-24 32 29)"
        />
      </svg>
      <span
        style={{
          color: buffed ? '#4ade80' : '#ffffff',
          fontSize: Math.max(12, Math.round(size * fontScale)),
        }}
        className="hs-num pointer-events-none absolute inset-0 flex items-center justify-center pl-[2px] pt-[2px]"
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
  const uid = useId().replace(/:/g, '');
  const color =
    state === 'damaged' ? '#ff6b6b' : state === 'buffed' ? '#4ade80' : '#ffffff';
  const strVal = String(value);
  const fontScale = strVal.length >= 2 ? 0.48 : 0.56;

  if (isWeaponDurability) {
    return (
      <div
        style={{ width: size, height: size * 1.08 }}
        className={`relative inline-flex shrink-0 select-none items-center justify-center ${className}`}
      >
        <svg viewBox="0 0 64 70" className="h-full w-full drop-shadow-[0_4px_7px_rgba(0,0,0,0.92)]">
          <defs>
            <linearGradient id={`durShield_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="48%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <path
            d="M32 4 L58 15 V36 C58 52 46 62 32 67 C18 62 6 52 6 36 V15 Z"
            fill={`url(#durShield_${uid})`}
            stroke="#090d16"
            strokeWidth="3.2"
          />
          <path
            d="M32 10 L51 19 V35 C51 48 41.5 55.5 32 60 C22.5 55.5 13 48 13 35 V19 Z"
            fill="#1e293b"
            stroke="#cbd5e1"
            strokeWidth="1.8"
          />
        </svg>
        <span
          style={{ color, fontSize: Math.max(12, Math.round(size * fontScale)) }}
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
        viewBox="0 0 66 74"
        className="h-full w-full drop-shadow-[0_4px_7px_rgba(0,0,0,0.92)]"
      >
        <defs>
          <radialGradient id={`hpRuby_${uid}`} cx="36%" cy="54%" r="60%">
            <stop offset="0%" stopColor="#fecaca" />
            <stop offset="32%" stopColor="#ef4444" />
            <stop offset="75%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#3b0404" />
          </radialGradient>
          <linearGradient id={`hpRim_${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        {/* Blood-Ruby Teardrop Body */}
        <path
          d="M33 5 C33 5 59 33 59 49 C59 63 47.5 70 33 70 C18.5 70 7 63 7 49 C7 33 33 5 33 5 Z"
          fill={`url(#hpRuby_${uid})`}
          stroke={`url(#hpRim_${uid})`}
          strokeWidth="3.2"
        />
        <path
          d="M33 3 C33 3 61 32 61 49 C61 64.5 48.5 72 33 72 C17.5 72 5 64.5 5 49 C5 32 33 3 33 3 Z"
          fill="none"
          stroke="#1c0606"
          strokeWidth="2.2"
        />
        {/* Metallic Crown Cap */}
        <path
          d="M23 18 L33 5 L43 18 Q33 14 23 18 Z"
          fill="#fde68a"
          stroke="#451a03"
          strokeWidth="1.6"
        />
        {/* Glossy Ruby Highlight */}
        <path
          d="M25 22 C19 32 15 41 16 50 C17 54 20.5 54 21.5 49 C22.5 40 25.5 31 28.5 23 Z"
          fill="rgba(255,255,255,0.44)"
        />
      </svg>
      <span
        style={{
          color,
          fontSize: Math.max(12, Math.round(size * fontScale)),
        }}
        className="hs-num pointer-events-none absolute inset-0 flex items-center justify-center pt-[8px]"
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
 * 2. Commercial Sculpted SNSHero Card Component (Master 300x420 SVG Architecture)
 * ============================================================================ */

interface ClassFramePalette {
  top: string;
  mid: string;
  bot: string;
  rimLight: string;
  rimDark: string;
  skyTop: string;
  skyMid: string;
  skyBot: string;
  halo: string;
}

const CLASS_PALETTES: Record<CardClass, ClassFramePalette> = {
  // 인간종족 (엘윈마을 로열 코발트 & 설원 골드)
  PRIEST: {
    top: '#dbeafe',
    mid: '#2563eb',
    bot: '#172554',
    rimLight: '#fef08a',
    rimDark: '#a16207',
    skyTop: '#38bdf8',
    skyMid: '#1e3a8a',
    skyBot: '#090d16',
    halo: 'rgba(186, 230, 253, 0.72)',
  },
  // 물종족 (심연 해역 아쿠아 사파이어)
  MAGE: {
    top: '#7dd3fc',
    mid: '#0284c7',
    bot: '#082f49',
    rimLight: '#e0f2fe',
    rimDark: '#0369a1',
    skyTop: '#22d3ee',
    skyMid: '#0369a1',
    skyBot: '#041322',
    halo: 'rgba(103, 232, 249, 0.75)',
  },
  // 불종족 (불꽃 성채 크림슨 & 몰튼 골드)
  WARRIOR: {
    top: '#f87171',
    mid: '#b91c1c',
    bot: '#450a0a',
    rimLight: '#fde047',
    rimDark: '#92400e',
    skyTop: '#fb923c',
    skyMid: '#991b1b',
    skyBot: '#1f0505',
    halo: 'rgba(253, 186, 116, 0.75)',
  },
  // 바람종족 (에메랄드 바람 신전)
  HUNTER: {
    top: '#34d399',
    mid: '#059669',
    bot: '#064e3b',
    rimLight: '#fef08a',
    rimDark: '#0f766e',
    skyTop: '#2dd4bf',
    skyMid: '#0f766e',
    skyBot: '#031c18',
    halo: 'rgba(110, 231, 183, 0.72)',
  },
  // 땅종족 (대지 성채 앰버 골드)
  PALADIN: {
    top: '#fde047',
    mid: '#ca8a04',
    bot: '#422006',
    rimLight: '#fffbeb',
    rimDark: '#854d0e',
    skyTop: '#facc15',
    skyMid: '#854d0e',
    skyBot: '#1c1004',
    halo: 'rgba(254, 240, 138, 0.75)',
  },
  // 언데드종족 (섀도우렐름 옵시디언 & 퍼플)
  ROGUE: {
    top: '#94a3b8',
    mid: '#334155',
    bot: '#0f172a',
    rimLight: '#e9d5ff',
    rimDark: '#581c87',
    skyTop: '#a855f7',
    skyMid: '#3b0764',
    skyBot: '#090514',
    halo: 'rgba(216, 180, 254, 0.7)',
  },
  // 엘프종족 (달빛 실반 인디고 & 문실버)
  SHAMAN: {
    top: '#60a5fa',
    mid: '#1d4ed8',
    bot: '#172554',
    rimLight: '#bbf7d0',
    rimDark: '#15803d',
    skyTop: '#4ade80',
    skyMid: '#14532d',
    skyBot: '#05180d',
    halo: 'rgba(134, 239, 172, 0.72)',
  },
  // 드워프종족 (딥포지 마그마 퍼플 브론즈)
  WARLOCK: {
    top: '#c084fc',
    mid: '#6b21a8',
    bot: '#2e1065',
    rimLight: '#fcd34d',
    rimDark: '#78350f',
    skyTop: '#f59e0b',
    skyMid: '#7c2d12',
    skyBot: '#1c0903',
    halo: 'rgba(252, 211, 77, 0.72)',
  },
  // 동물종족 (야성 설원 루비 우드)
  DRUID: {
    top: '#d97706',
    mid: '#78350f',
    bot: '#291205',
    rimLight: '#fda4af',
    rimDark: '#881337',
    skyTop: '#fb7185',
    skyMid: '#881337',
    skyBot: '#1f040d',
    halo: 'rgba(253, 164, 175, 0.7)',
  },
  // 중립 (다종족 연합 조각 석재 & 황동)
  NEUTRAL: {
    top: '#a8a29e',
    mid: '#57534e',
    bot: '#1c1917',
    rimLight: '#fde68a',
    rimDark: '#78552b',
    skyTop: '#64748b',
    skyMid: '#334155',
    skyBot: '#0c0a09',
    halo: 'rgba(253, 230, 138, 0.58)',
  },
  DREAM: {
    top: '#6ee7b7',
    mid: '#059669',
    bot: '#022c22',
    rimLight: '#fef08a',
    rimDark: '#047857',
    skyTop: '#34d399',
    skyMid: '#065f46',
    skyBot: '#021712',
    halo: 'rgba(167, 243, 208, 0.75)',
  },
};

const RARITY_GEM_COLORS: Record<
  CardRarity,
  { hi: string; mid: string; lo: string } | null
> = {
  FREE: null,
  COMMON: { hi: '#ffffff', mid: '#cbd5e1', lo: '#475569' },
  RARE: { hi: '#bae6fd', mid: '#2563eb', lo: '#172554' },
  EPIC: { hi: '#f5d0fe', mid: '#9333ea', lo: '#3b0764' },
  LEGENDARY: { hi: '#fef9c3', mid: '#f97316', lo: '#7c2d12' },
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
  const uid = useId().replace(/:/g, '');
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [useBustFallback, setUseBustFallback] = useState(false);

  useEffect(() => {
    setUseBustFallback(false);
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
      ? { w: 100, h: 140 }
      : size === 'SM'
        ? { w: 136, h: 190 }
        : size === 'LG'
          ? { w: 250, h: 350 }
          : { w: 180, h: 252 };

  const scale = dims.w / 300;

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

  const pal = CLASS_PALETTES[card.cardClass] || CLASS_PALETTES.NEUTRAL;
  const isWeapon = card.type === 'WEAPON';
  const isSpell = card.type === 'SPELL';
  const gemCol = RARITY_GEM_COLORS[card.rarity];

  // Always prefer RGBA transparent hero cutout (`getCardArtUrl`) so there is ZERO white background!
  const portraitSrc = useBustFallback ? getCardBustUrl(card) : getCardArtUrl(card);
  const bottomTribeText =
    (card.race && RACE_KO[card.race]) || card.snsFactionKo || '';

  const formattedHtml = formatCardHtmlText(card.text || '', spellPowerBonus, velenMultiplier);
  const plainTextLen = (card.text || '').replace(/<[^>]+>/g, '').length;
  const bodyFontSize = plainTextLen > 72 ? 12.5 : plainTextLen > 46 ? 14 : 15.5;

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
            ? `perspective(850px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
            : undefined,
      }}
      className={`relative select-none transition-transform duration-150 ${silhouetteFilterClass} ${className}`}
    >
      {/* Master 300x420 Studio Card Canvas Scaled Proportionally */}
      <div
        style={{
          width: 300,
          height: 420,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        className="pointer-events-none relative"
      >
        {/* 1. LAYER A: Painted Atmospheric Portrait Window + RGBA Hero Cutout */}
        <div
          style={{
            background: `linear-gradient(180deg, ${pal.skyTop} 0%, ${pal.skyMid} 52%, ${pal.skyBot} 100%)`,
            ...(isSpell
              ? {
                  left: 34,
                  top: 30,
                  width: 232,
                  height: 192,
                  borderRadius: '110px 110px 22px 22px',
                }
              : isWeapon
                ? {
                    left: 52,
                    top: 32,
                    width: 196,
                    height: 196,
                    borderRadius: '50%',
                  }
                : {
                    left: 52,
                    top: 24,
                    width: 196,
                    height: 214,
                    borderRadius: '50%',
                  }),
          }}
          className="absolute z-[5] overflow-hidden"
        >
          {/* Radiant Elemental Halo Behind Character */}
          <div
            style={{
              background: `radial-gradient(circle at 50% 38%, ${pal.halo} 0%, transparent 68%)`,
            }}
            className="absolute inset-0"
          />
          {/* Subtle Arcane Starburst Rays for Spells */}
          {isSpell && (
            <div
              style={{
                background:
                  'repeating-conic-gradient(from 0deg at 50% 42%, rgba(255,255,255,0.12) 0deg 9deg, transparent 9deg 24deg)',
              }}
              className="absolute inset-0 mix-blend-overlay"
            />
          )}

          {/* High-Res RGBA Character Cutout (Zoomed onto Heroic Upper Torso & Face) */}
          <img
            src={portraitSrc}
            alt={card.name}
            draggable={false}
            onError={() => {
              if (!useBustFallback) setUseBustFallback(true);
            }}
            className="absolute left-1/2 top-[3%] h-[156%] w-[124%] max-w-none -translate-x-1/2 object-cover object-top drop-shadow-[0_8px_12px_rgba(0,0,0,0.82)]"
          />

          {/* Weapon Signature Relic Medallion Overlay */}
          {isWeapon && card.propUrl && (
            <img
              src={card.propUrl}
              alt=""
              draggable={false}
              className="absolute bottom-3 right-3 h-16 w-16 rounded-full border-2 border-amber-200/90 object-cover shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
            />
          )}

          {/* Deep Portrait Rim Shadow */}
          <div
            style={{
              boxShadow: 'inset 0 6px 16px rgba(0,0,0,0.72), inset 0 -22px 24px rgba(0,0,0,0.78)',
              borderRadius: 'inherit',
            }}
            className="absolute inset-0"
          />
        </div>

        {/* 2. LAYER B: Precision Sculpted Hearthstone-Caliber Frame, Bezel, Scroll & Arched Ribbon SVG */}
        <svg
          viewBox="0 0 300 420"
          className="absolute inset-0 z-[12] h-full w-full overflow-visible"
        >
          <defs>
            {/* Outer Card Body Gradient */}
            <linearGradient id={`bodyGrad_${uid}`} x1="0.15" y1="0" x2="0.85" y2="1">
              {isGolden ? (
                <>
                  <stop offset="0%" stopColor="#fef9c3" />
                  <stop offset="28%" stopColor="#eab308" />
                  <stop offset="68%" stopColor="#92400e" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </>
              ) : isWeapon ? (
                <>
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="45%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#090d16" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor={pal.top} />
                  <stop offset="42%" stopColor={pal.mid} />
                  <stop offset="100%" stopColor={pal.bot} />
                </>
              )}
            </linearGradient>

            {/* Metallic Gold / Silver Rim Bezel */}
            <linearGradient id={`bezelGrad_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="35%" stopColor={isWeapon ? '#cbd5e1' : isGolden ? '#fde047' : pal.rimLight} />
              <stop offset="75%" stopColor={isWeapon ? '#475569' : '#b45309'} />
              <stop offset="100%" stopColor={isWeapon ? '#1e293b' : pal.rimDark} />
            </linearGradient>

            {/* Sculpted 3D Parchment Name Banner Gradient */}
            <linearGradient id={`ribbonGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
              {isWeapon ? (
                <>
                  <stop offset="0%" stopColor="#f1f5f9" />
                  <stop offset="52%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#334155" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#fffdf5" />
                  <stop offset="45%" stopColor="#f2dfb6" />
                  <stop offset="88%" stopColor="#cfa763" />
                  <stop offset="100%" stopColor="#9e7332" />
                </>
              )}
            </linearGradient>

            {/* Recessed Ability Text Scroll Gradient */}
            <linearGradient id={`scrollGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
              {isWeapon ? (
                <>
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#090d16" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#fcf5e5" />
                  <stop offset="55%" stopColor="#efe0be" />
                  <stop offset="100%" stopColor="#dcc496" />
                </>
              )}
            </linearGradient>

            {/* Subtle Engraved Stone/Damask Hatching Pattern */}
            <pattern
              id={`filigree_${uid}`}
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(35)"
            >
              <line x1="0" y1="0" x2="0" y2="18" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              <line x1="9" y1="0" x2="9" y2="18" stroke="rgba(0,0,0,0.14)" strokeWidth="2" />
            </pattern>

            {/* Rarity Gem Radial Gradient */}
            {gemCol && (
              <radialGradient id={`gemGrad_${uid}`} cx="36%" cy="32%" r="68%">
                <stop offset="0%" stopColor={gemCol.hi} />
                <stop offset="48%" stopColor={gemCol.mid} />
                <stop offset="100%" stopColor={gemCol.lo} />
              </radialGradient>
            )}

            {/* Compound Mask Cutting Out the Exact Portrait Window Inside the Sculpted Frame */}
            <mask id={`frameCutout_${uid}`}>
              <rect x="0" y="0" width="300" height="420" fill="white" />
              {isSpell ? (
                <path
                  d="M 38 142 V 132 C 38 64 88 32 150 32 C 212 32 262 64 262 132 V 210 Q 262 222 250 222 H 50 Q 38 222 38 210 Z"
                  fill="black"
                />
              ) : isWeapon ? (
                <circle cx="150" cy="130" r="94" fill="black" />
              ) : (
                <ellipse cx="150" cy="131" rx="95" ry="104" fill="black" />
              )}
            </mask>

            {/* Gentle Upward Arch Path for Card Name Typography */}
            <path
              id={`titleArch_${uid}`}
              d="M 40 231 Q 150 207 260 231"
              fill="none"
            />
          </defs>

          {/* Sculpted Outer Card Body with Cutout Window */}
          <g mask={`url(#frameCutout_${uid})`}>
            <path
              d="M 40 26
                 Q 150 8 260 26
                 Q 282 30 282 54
                 V 374
                 Q 282 398 258 400
                 H 42
                 Q 18 398 18 374
                 V 54
                 Q 18 30 40 26 Z"
              fill={`url(#bodyGrad_${uid})`}
            />
            <path
              d="M 40 26
                 Q 150 8 260 26
                 Q 282 30 282 54
                 V 374
                 Q 282 398 258 400
                 H 42
                 Q 18 398 18 374
                 V 54
                 Q 18 30 40 26 Z"
              fill={`url(#filigree_${uid})`}
            />
          </g>

          {/* Outer Beveled Metallic Border & Inner Decorative Filigree Rail */}
          <path
            d="M 40 26
               Q 150 8 260 26
               Q 282 30 282 54
               V 374
               Q 282 398 258 400
               H 42
               Q 18 398 18 374
               V 54
               Q 18 30 40 26 Z"
            fill="none"
            stroke="#120a04"
            strokeWidth="6.5"
          />
          <path
            d="M 40 26
               Q 150 8 260 26
               Q 282 30 282 54
               V 374
               Q 282 398 258 400
               H 42
               Q 18 398 18 374
               V 54
               Q 18 30 40 26 Z"
            fill="none"
            stroke={`url(#bezelGrad_${uid})`}
            strokeWidth="3.6"
          />
          <rect
            x="25"
            y="34"
            width="250"
            height="358"
            rx="18"
            fill="none"
            stroke="rgba(255,248,220,0.28)"
            strokeWidth="1.4"
          />

          {/* Sculpted Portrait Bezel Ring (Distinct per Card Type!) */}
          {isSpell ? (
            <>
              <path
                d="M 38 142 V 132 C 38 64 88 32 150 32 C 212 32 262 64 262 132 V 210 Q 262 222 250 222 H 50 Q 38 222 38 210 Z"
                fill="none"
                stroke="#140b04"
                strokeWidth="10"
              />
              <path
                d="M 38 142 V 132 C 38 64 88 32 150 32 C 212 32 262 64 262 132 V 210 Q 262 222 250 222 H 50 Q 38 222 38 210 Z"
                fill="none"
                stroke={`url(#bezelGrad_${uid})`}
                strokeWidth="6.2"
              />
            </>
          ) : isWeapon ? (
            <>
              <circle cx="150" cy="130" r="95" fill="none" stroke="#090d16" strokeWidth="11" />
              <circle cx="150" cy="130" r="95" fill="none" stroke={`url(#bezelGrad_${uid})`} strokeWidth="7" />
              <circle cx="150" cy="130" r="89" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" />
            </>
          ) : (
            <>
              <ellipse cx="150" cy="131" rx="96" ry="105" fill="none" stroke="#140b04" strokeWidth="10.5" />
              <ellipse
                cx="150"
                cy="131"
                rx="96"
                ry="105"
                fill="none"
                stroke={`url(#bezelGrad_${uid})`}
                strokeWidth="6.5"
              />
              <ellipse
                cx="150"
                cy="131"
                rx="91"
                ry="100"
                fill="none"
                stroke="rgba(255,251,235,0.38)"
                strokeWidth="1.4"
              />
            </>
          )}

          {/* Recessed Parchment / Slate Ability Scroll Box */}
          <path
            d="M 42 246
               H 258
               L 266 256
               V 368
               L 256 378
               H 44
               L 34 368
               V 256 Z"
            fill={`url(#scrollGrad_${uid})`}
            stroke={isWeapon ? '#475569' : '#573818'}
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <path
            d="M 46 251 H 254 L 260 258 V 364 L 253 372 H 47 L 40 364 V 258 Z"
            fill="none"
            stroke={isWeapon ? 'rgba(148,163,184,0.28)' : 'rgba(120,74,28,0.32)'}
            strokeWidth="1.4"
          />

          {/* 3D Folded Ribbon Tails (Left & Right) */}
          <path
            d="M 11 232 L 34 216 L 38 246 L 13 254 L 21 239 Z"
            fill={isWeapon ? '#475569' : '#9a6f32'}
            stroke="#1f1106"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path
            d="M 289 232 L 266 216 L 262 246 L 287 254 L 279 239 Z"
            fill={isWeapon ? '#475569' : '#9a6f32'}
            stroke="#1f1106"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />

          {/* Sculpted Arched 3D Parchment Name Ribbon */}
          <path
            d="M 24 217
               Q 150 191 276 217
               L 270 247
               Q 150 222 30 247 Z"
            fill={`url(#ribbonGrad_${uid})`}
            stroke="#241306"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <path
            d="M 29 221 Q 150 196 271 221"
            fill="none"
            stroke="rgba(255,255,255,0.65)"
            strokeWidth="1.5"
          />

          {/* Curved Korean Card Name Along the Banner Arch */}
          <text
            fill="#ffffff"
            stroke="#1a0d04"
            strokeWidth="3.6"
            paintOrder="stroke"
            fontFamily="'Nanum Gothic', sans-serif"
            fontWeight="900"
            fontSize={
              card.name.length >= 13
                ? '14.8'
                : card.name.length >= 10
                  ? '16.8'
                  : '19'
            }
            letterSpacing="-0.2"
          >
            <textPath
              href={`#titleArch_${uid}`}
              startOffset="50%"
              textAnchor="middle"
              {...(card.name.length >= 15
                ? { textLength: 216, lengthAdjust: 'spacingAndGlyphs' as const }
                : {})}
            >
              {card.name}
            </textPath>
          </text>

          {/* Ornate Winged Rarity Gem Clasp Below Name Banner */}
          <g transform="translate(150, 243)">
            <path
              d="M -24 0 Q -12 -7 0 -5 Q 12 -7 24 0 Q 12 7 0 5 Q -12 7 -24 0 Z"
              fill={`url(#bezelGrad_${uid})`}
              stroke="#1c0f05"
              strokeWidth="2.2"
            />
            {gemCol ? (
              <>
                <ellipse
                  cx="0"
                  cy="0"
                  rx="8.5"
                  ry="11"
                  fill={`url(#gemGrad_${uid})`}
                  stroke="#1c0f05"
                  strokeWidth="2.4"
                />
                <polygon points="0,-8 5,-1 0,8 -5,-1" fill="rgba(255,255,255,0.34)" />
                <circle cx="-2.5" cy="-3.5" r="2.2" fill="rgba(255,255,255,0.8)" />
              </>
            ) : (
              <circle
                cx="0"
                cy="0"
                r="5.5"
                fill={`url(#bezelGrad_${uid})`}
                stroke="#1c0f05"
                strokeWidth="2"
              />
            )}
          </g>

          {/* Chiseled Bottom Faction / Tribe Plaque */}
          {bottomTribeText && (
            <g transform="translate(150, 386)">
              <rect
                x="-58"
                y="-11"
                width="116"
                height="22"
                rx="6"
                fill="#29190c"
                stroke={`url(#bezelGrad_${uid})`}
                strokeWidth="2.4"
              />
              <text
                x="0"
                y="4.5"
                textAnchor="middle"
                fill="#fde68a"
                stroke="#120903"
                strokeWidth="3"
                paintOrder="stroke"
                fontFamily="'Nanum Gothic', sans-serif"
                fontWeight="800"
                fontSize="13"
              >
                {bottomTribeText}
              </text>
            </g>
          )}
        </svg>

        {/* 3. LAYER C: Ability Scroll Watermark + Crisp Korean Ability Copy */}
        <div
          style={{
            left: 44,
            top: 256,
            width: 212,
            height: 112,
          }}
          className="absolute z-[15] flex items-center justify-center overflow-hidden px-2 py-1 text-center"
        >
          <img
            src={CLASS_CREST_URL[card.cardClass] || CLASS_CREST_URL.NEUTRAL}
            alt=""
            draggable={false}
            className="pointer-events-none absolute h-20 w-20 rounded-full object-contain opacity-[0.13] grayscale-[25%]"
          />
          {formattedHtml && (
            <div
              style={{ fontSize: bodyFontSize }}
              className={`relative z-10 line-clamp-4 font-extrabold leading-[1.24] tracking-tight ${
                isWeapon ? 'text-slate-100' : 'text-[#211307]'
              }`}
              dangerouslySetInnerHTML={{ __html: formattedHtml }}
            />
          )}
        </div>

        {/* 4. LAYER D: Sweeping Golden Legendary Dragon Crest */}
        {card.rarity === 'LEGENDARY' && (
          <SnsLegendaryCrestSvg className="absolute -top-[8px] left-1/2 z-[22] w-[264px] -translate-x-1/2 drop-shadow-[0_6px_10px_rgba(0,0,0,0.92)]" />
        )}

        {/* 5. LAYER E: Golden Foil Specular Shimmer */}
        {isGolden && (
          <div
            style={{
              left: 18,
              top: 18,
              width: 264,
              height: 382,
              background:
                'linear-gradient(115deg, transparent 30%, rgba(254,240,138,0.38) 48%, rgba(255,255,255,0.62) 50%, rgba(250,204,21,0.32) 54%, transparent 70%)',
              backgroundSize: '240% 100%',
              animation: 'hsGoldenFoil 3.4s linear infinite',
            }}
            className="pointer-events-none absolute z-[24] rounded-[24px] mix-blend-screen"
          />
        )}

        {/* 6. LAYER F: Corner 3D Stat Jewels (Mana, Attack, Health / Durability) */}
        <div className="absolute left-[2px] top-[4px] z-[30]">
          <HsManaGem
            value={shownCost}
            state={costState}
            size={68}
            active={shownCost !== card.cost}
          />
        </div>

        {(card.type === 'MINION' || card.type === 'WEAPON') && (
          <div className="absolute bottom-[4px] left-[0px] z-[30]">
            <HsAttackBadge
              value={card.attack ?? 0}
              isWeapon={isWeapon}
              size={74}
            />
          </div>
        )}

        {card.type === 'MINION' && (
          <div className="absolute bottom-[2px] right-[4px] z-[30]">
            <HsHealthBadge value={card.health ?? 1} size={70} />
          </div>
        )}

        {isWeapon && (
          <div className="absolute bottom-[4px] right-[4px] z-[30]">
            <HsHealthBadge
              value={card.durability ?? 1}
              isWeaponDurability
              size={68}
            />
          </div>
        )}

        {/* Live Dynamic Spell Damage Amplification Tag */}
        {hasDynamicSpellAmplify && (
          <div className="pointer-events-none absolute right-2 top-3 z-[32] whitespace-nowrap rounded-full border-2 border-sky-300 bg-sky-950/95 px-2.5 py-0.5 text-[14px] font-extrabold text-sky-200 shadow-lg">
            ✦ 증폭 {velenMultiplier > 1 ? `×${velenMultiplier}` : `+${spellPowerBonus}`}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. Commercial Battlefield Oval Minion Token (Zero White Backgrounds)
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

  const cardDef = cardDb.getCard(minion.cardId);
  const pal = CLASS_PALETTES[cardDef?.cardClass || 'NEUTRAL'] || CLASS_PALETTES.NEUTRAL;

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
      {/* Sculpted Taunt Shield Frame */}
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

      {/* Oval Portrait + Atmospheric Faction Sky + RGBA Cutout */}
      <div
        style={{
          background: `radial-gradient(circle at 50% 35%, ${pal.halo} 0%, ${pal.skyMid} 55%, ${pal.skyBot} 100%)`,
        }}
        className={`relative z-10 h-[58px] w-[43px] overflow-hidden rounded-[50%] border-[2.5px] shadow-[0_8px_16px_rgba(0,0,0,0.88),inset_0_0_10px_rgba(0,0,0,0.85)] sm:h-[106px] sm:w-[84px] sm:border-[4px] ${
          minion.frozen
            ? 'border-cyan-200 ring-2 ring-sky-400/75 sm:ring-4'
            : isTaunt
              ? 'border-[#f2d694]'
              : 'border-[#d4ab63]'
        }`}
      >
        {!imgErr ? (
          <img
            src={getCardArtUrl(minion.cardId)}
            alt={minion.name}
            onError={() => setImgErr(true)}
            className={`absolute left-1/2 top-[3%] h-[155%] w-[124%] max-w-none -translate-x-1/2 object-cover object-top drop-shadow-[0_4px_6px_rgba(0,0,0,0.75)] ${
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
  const pal = CLASS_PALETTES[player.heroClass] || CLASS_PALETTES.PRIEST;
  const weaponOpen = isActiveTurn && Boolean(player.weapon);

  return (
    <div className="relative flex select-none items-center justify-center gap-2 sm:gap-3.5">
      {/* Left: Equipped Weapon Medallion */}
      <div className="relative flex h-[54px] w-[54px] items-center justify-center sm:h-[80px] sm:w-[80px]">
        {player.weapon ? (
          <div
            title={`${player.weapon.name} (${player.weapon.attack}/${player.weapon.durability})`}
            className={`relative flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-full border-[2.5px] shadow-[0_8px_20px_rgba(0,0,0,0.9)] transition-all sm:h-[76px] sm:w-[76px] sm:border-[3.5px] ${
              weaponOpen
                ? 'border-[#ebd08c] bg-slate-900 ring-2 ring-emerald-400/70'
                : 'border-slate-500 bg-slate-950 brightness-80'
            }`}
          >
            {weaponOpen ? (
              <img
                src={getCardArtUrl(player.weapon.cardId)}
                alt={player.weapon.name}
                className="h-[145%] w-[120%] max-w-none object-cover object-top"
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

        {/* Chiseled Gold-Trimmed Hero Arch + Atmospheric Faction Sky */}
        <div
          style={{
            background: `radial-gradient(circle at 50% 34%, ${pal.halo} 0%, ${pal.skyMid} 58%, ${pal.skyBot} 100%)`,
          }}
          className={`relative h-full w-full overflow-hidden rounded-t-[44px] rounded-b-[10px] border-[3px] shadow-[0_10px_24px_rgba(0,0,0,0.92),inset_0_0_14px_rgba(0,0,0,0.85)] sm:rounded-t-[58px] sm:rounded-b-[14px] sm:border-[4.5px] ${
            player.immuneThisTurn
              ? 'border-yellow-200 ring-2 ring-amber-300 sm:ring-4'
              : player.frozen
                ? 'border-cyan-200 ring-2 ring-sky-400/75 sm:ring-4'
                : 'border-[#e6c478]'
          }`}
        >
          <img
            src={getHeroArtUrl(player.isJaraxxus ? 'EX1_323h' : player.heroId)}
            alt={player.heroNameKo}
            className="absolute left-1/2 top-[2%] h-[154%] w-[124%] max-w-none -translate-x-1/2 object-cover object-top drop-shadow-[0_6px_10px_rgba(0,0,0,0.8)]"
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
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/92 via-black/60 to-transparent pl-1 pr-4 pb-0.5 pt-3 text-center sm:pl-1.5 sm:pr-5 sm:pb-1 sm:pt-4">
            <div className="hs-outline-sm truncate text-[8px] font-extrabold text-amber-100 sm:text-[10px]">
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

      {/* Right: Carved Brass Hero Power Medallion */}
      <div className="relative flex h-[56px] w-[56px] items-center justify-center sm:h-[80px] sm:w-[80px]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClickHeroPower();
          }}
          title={`${player.heroPowerNameKo} (비용 2): ${player.heroPowerTextKo}`}
          style={
            !player.heroPowerUsedThisTurn
              ? {
                  background: `radial-gradient(circle at 50% 35%, ${pal.halo} 0%, ${pal.skyMid} 65%, ${pal.skyBot} 100%)`,
                }
              : undefined
          }
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
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                <img
                  src={getCardTileUrl(player.heroPowerId)}
                  alt={player.heroPowerNameKo}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = getHeroArtUrl(heroMeta.heroId);
                  }}
                  className="absolute left-1/2 top-[4%] h-[150%] w-[120%] max-w-none -translate-x-1/2 object-cover object-top"
                />
              </div>
              <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 scale-[0.82] sm:-top-2.5 sm:scale-100">
                <HsManaGem value={2} size={26} />
              </div>
              <div className="hs-outline-sm absolute inset-x-0 bottom-0 rounded-b-full bg-gradient-to-t from-black/92 via-black/65 to-transparent py-0.5 text-center text-[7px] font-extrabold text-amber-100 sm:py-1 sm:text-[8.5px]">
                {player.heroPowerNameKo}
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
