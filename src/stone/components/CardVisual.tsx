import React, { useEffect, useState } from 'react';
import {
  CLASS_CREST_URL,
  formatCardHtmlText,
  getCardArtUrl,
  getCardTileUrl,
  getHeroArtUrl,
  getOfficialCardRenderFallbackUrl,
  getOfficialCardRenderUrl,
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

export const RACE_KO: Record<string, string> = {
  BEAST: '야수',
  DEMON: '악마',
  DRAGON: '용족',
  MURLOC: '멀록',
  PIRATE: '해적',
  TOTEM: '토템',
};

/* ============================================================================
 * 1. Bespoke Sculpted Hearthstone Jewels & Currency Icons (Zero Emoji Policy)
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
        {/* Outer Chiseled Rim */}
        <polygon
          points="32,3 58,18 58,46 32,61 6,46 6,18"
          fill="url(#hsSapphireRim)"
          stroke="#091128"
          strokeWidth="2.6"
        />
        {/* Inner Faceted Sapphire */}
        <polygon
          points="32,8 53,20 53,44 32,56 11,44 11,20"
          fill="url(#hsSapphireBody)"
        />
        {/* Top Specular Facets */}
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
        {/* Diagonal Broadsword Behind Sphere (Hilt Top-Left -> Tip Bottom-Right) */}
        <g stroke="#140c06" strokeWidth="2.2" strokeLinejoin="round">
          <polygon points="8,8 15,6 24,15 15,24 6,15" fill="#78716c" />
          <polygon points="9,24 24,9 28,13 13,28" fill="#d6b36a" />
          <polygon points="48,44 63,56 56,63 44,48" fill="#cbd5e1" />
        </g>
        {/* Sculpted Attack Sphere */}
        <circle
          cx="35"
          cy="37"
          r="22"
          fill={isWeapon ? 'url(#hsAtkSteel)' : 'url(#hsAtkGold)'}
          stroke={isWeapon ? '#cbd5e1' : '#fde68a'}
          strokeWidth="2.8"
        />
        <circle
          cx="35"
          cy="37"
          r="24.2"
          fill="none"
          stroke="#180d05"
          strokeWidth="2"
        />
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
  size?: number;
  className?: string;
}> = ({ value, state = 'normal', size = 36, className = '' }) => {
  const color =
    state === 'damaged' ? '#ff6b6b' : state === 'buffed' ? '#4ade80' : '#ffffff';
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
        {/* Sculpted Crimson Blood-Drop */}
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
        {/* Specular Glass Highlight */}
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
      d="M20 12 C25 12 28 16 26 21 C24 25 18 25 17 21 C16 18 19 17 21 18"
      fill="none"
      stroke="#78350f"
      strokeWidth="2.6"
      strokeLinecap="round"
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
 * 2. Commercial 1:1 Hearthstone Card Component (Official koKR Alpha Render)
 * ============================================================================ */

const FALLBACK_CLASS_TINT: Record<CardClass, string> = {
  MAGE: 'from-[#3b82f6] via-[#1d4ed8] to-[#172554]',
  WARRIOR: 'from-[#dc2626] via-[#991b1b] to-[#450a0a]',
  HUNTER: 'from-[#16a34a] via-[#166534] to-[#052e16]',
  PALADIN: 'from-[#f59e0b] via-[#b45309] to-[#451a03]',
  PRIEST: 'from-[#f1f5f9] via-[#94a3b8] to-[#334155]',
  ROGUE: 'from-[#475569] via-[#1e293b] to-[#090d16]',
  SHAMAN: 'from-[#2563eb] via-[#1e40af] to-[#0f172a]',
  WARLOCK: 'from-[#9333ea] via-[#6b21a8] to-[#2e1065]',
  DRUID: 'from-[#b45309] via-[#78350f] to-[#291205]',
  NEUTRAL: 'from-[#78716c] via-[#44403c] to-[#1c1917]',
  DREAM: 'from-[#10b981] via-[#047857] to-[#022c22]',
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

export const HearthstoneCard: React.FC<HearthstoneCardProps> = React.memo(({
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
  // 0 = primary VAN_* koKR render, 1 = fallback clean ID koKR render, 2 = offline sculpted SVG card
  const [renderStage, setRenderStage] = useState<0 | 1 | 2>(0);
  const [artErr, setArtErr] = useState(false);

  useEffect(() => {
    setRenderStage(0);
    setArtErr(false);
  }, [card.id, card.vanId]);

  const cachedPreviewSrc =
    renderStage === 0
      ? getOfficialCardRenderUrl(card, '256x')
      : getOfficialCardRenderFallbackUrl(card, '256x');
  const hdSrc =
    renderStage === 0
      ? getOfficialCardRenderUrl(card, '512x')
      : getOfficialCardRenderFallbackUrl(card, '512x');
  const renderSrc = size === 'LG' ? hdSrc : cachedPreviewSrc;

  const shownCost = effectiveCost !== undefined ? effectiveCost : card.cost;
  const costModified = shownCost !== card.cost;
  const costState: 'normal' | 'buffed' | 'nerfed' =
    shownCost < card.cost ? 'buffed' : shownCost > card.cost ? 'nerfed' : 'normal';

  const hasDynamicSpellAmplify =
    card.type === 'SPELL' &&
    (spellPowerBonus > 0 || velenMultiplier > 1) &&
    /[$#]\d+/.test(card.text || '');

  // Official Blizzard render canvas aspect ratio is 256 x 388
  const dims =
    size === 'XS'
      ? { w: 96, h: 146, manaGem: 22, titleCls: 'text-[8.5px]', bodyCls: 'text-[7px]' }
      : size === 'SM'
        ? { w: 132, h: 200, manaGem: 29, titleCls: 'text-[10.5px]', bodyCls: 'text-[8.5px]' }
        : size === 'LG'
          ? { w: 236, h: 358, manaGem: 48, titleCls: 'text-[14.5px]', bodyCls: 'text-[11px]' }
          : { w: 176, h: 267, manaGem: 38, titleCls: 'text-[12px]', bodyCls: 'text-[9.5px]' };

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
      {renderStage < 2 ? (
        <>
          {size === 'LG' && (
            <img
              src={cachedPreviewSrc}
              alt=""
              draggable={false}
              className={`pointer-events-none absolute inset-0 h-full w-full object-contain ${
                isGolden
                  ? 'sepia-[0.28] saturate-[1.45] brightness-[1.06] contrast-[1.05]'
                  : ''
              }`}
            />
          )}
          <img
            src={renderSrc}
            alt={card.name}
            draggable={false}
            onError={() => {
              setRenderStage((prev) => (prev === 0 ? 1 : 2));
            }}
            className={`pointer-events-none relative z-10 h-full w-full object-contain ${
              isGolden
                ? 'sepia-[0.28] saturate-[1.45] brightness-[1.06] contrast-[1.05]'
                : ''
            }`}
          />

          {/* Golden Foil Specular Shimmer */}
          {isGolden && (
            <div
              style={{
                background:
                  'linear-gradient(115deg, transparent 30%, rgba(254,240,138,0.42) 48%, rgba(255,255,255,0.65) 50%, rgba(250,204,21,0.35) 54%, transparent 70%)',
                backgroundSize: '240% 100%',
                animation: 'hsGoldenFoil 3.4s linear infinite',
                WebkitMaskImage: `url(${renderSrc})`,
                maskImage: `url(${renderSrc})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              }}
              className="pointer-events-none absolute inset-0 z-20 mix-blend-screen"
            />
          )}

          {/* Live Dynamic Mana Cost Overlay (Only shown when cost is modified in battle!) */}
          {costModified && (
            <div
              style={{
                left: '16.8%',
                top: '17.2%',
                transform: 'translate(-50%, -50%)',
              }}
              className="pointer-events-none absolute z-30"
            >
              <HsManaGem value={shownCost} state={costState} size={dims.manaGem} active />
            </div>
          )}

          {/* Live Dynamic Spell Damage Amplification Tag */}
          {hasDynamicSpellAmplify && (
            <div className="pointer-events-none absolute bottom-[6%] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-sky-300 bg-sky-950/95 px-2 py-[1px] text-[9px] font-extrabold text-sky-200 shadow-lg">
              ✦ 주문 증폭 {velenMultiplier > 1 ? `×${velenMultiplier}` : `+${spellPowerBonus}`}
            </div>
          )}
        </>
      ) : (
        /* Offline / Custom Token Sculpted Fallback Frame */
        <div className="relative mx-auto mt-[8%] flex h-[84%] w-[86%] flex-col justify-between rounded-[16px] border-[3px] border-[#d6b36a] bg-gradient-to-b p-1.5 shadow-2xl">
          <div
            className={`absolute inset-0 rounded-[13px] bg-gradient-to-b opacity-95 ${
              FALLBACK_CLASS_TINT[card.cardClass] || FALLBACK_CLASS_TINT.NEUTRAL
            }`}
          />
          {card.rarity === 'LEGENDARY' && (
            <img
              src="/stone-assets/ui/legendary_dragon.webp"
              alt=""
              className="pointer-events-none absolute -right-3 -top-5 z-20 w-[78%] object-contain"
            />
          )}
          <div className="pointer-events-none absolute -left-2.5 -top-2.5 z-30">
            <HsManaGem value={shownCost} state={costState} size={dims.manaGem} />
          </div>

          <div className="relative z-10 mx-auto mt-1 h-[48%] w-[82%] overflow-hidden rounded-[50%] border-[2.5px] border-[#e7c985] bg-stone-950 shadow-inner">
            {!artErr ? (
              <img
                src={getCardArtUrl(card.artId)}
                alt={card.name}
                onError={() => setArtErr(true)}
                className="h-full w-full scale-110 object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-extrabold text-amber-200">
                {card.name}
              </div>
            )}
          </div>

          <div className="relative z-20 -mt-2 rounded-[10px] border-[1.5px] border-[#593818] bg-gradient-to-b from-[#faf0d7] via-[#e7d1a7] to-[#c7a56e] px-1.5 py-0.5 text-center shadow">
            <span className={`hs-outline-sm block truncate font-extrabold text-white ${dims.titleCls}`}>
              {card.name}
            </span>
          </div>

          {RARITY_GEM_STYLE[card.rarity] && (
            <div className="relative z-20 -mt-1 flex justify-center">
              <div
                style={{ background: RARITY_GEM_STYLE[card.rarity]! }}
                className="h-3 w-2.5 rounded-full border border-stone-900 shadow"
              />
            </div>
          )}

          <div className="relative z-10 flex h-[33%] items-center justify-center overflow-hidden rounded-[8px] border border-[#5e4122] bg-gradient-to-b from-[#f4e8cd] to-[#dcc7a0] px-2 py-1 text-center text-[#24180d] shadow-inner">
            <div
              className={`leading-[1.2] font-bold ${dims.bodyCls}`}
              dangerouslySetInnerHTML={{
                __html: formatCardHtmlText(card.text, spellPowerBonus, velenMultiplier),
              }}
            />
          </div>

          {(card.type === 'MINION' || card.type === 'WEAPON') && (
            <div className="pointer-events-none absolute -bottom-2.5 -left-2.5 z-30">
              <HsAttackBadge
                value={card.attack ?? 0}
                isWeapon={card.type === 'WEAPON'}
                size={dims.manaGem}
              />
            </div>
          )}
          {card.type === 'MINION' && (
            <div className="pointer-events-none absolute -bottom-3 -right-2.5 z-30">
              <HsHealthBadge value={card.health ?? 1} size={dims.manaGem} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

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

export const BoardMinionToken: React.FC<BoardMinionTokenProps> = React.memo(({
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
        isSelectedAttacker ? 'z-30 -translate-y-2 scale-110 sm:-translate-y-3 sm:scale-112' : 'hover:z-20 hover:scale-106'
      }`}
    >
      {/* Authentic Taunt Iron-Bound Shield Frame */}
      {isTaunt && (
        <img
          src="/stone-assets/ui/taunt_shield.webp"
          alt="도발"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[72px] w-[58px] -translate-x-1/2 -translate-y-[47%] object-fill drop-shadow-[0_6px_12px_rgba(0,0,0,0.92)] sm:h-[138px] sm:w-[110px]"
        />
      )}

      {/* Ready-to-Attack / Valid Target Organic Aura */}
      {(canAttack || isValidTarget || isSelectedAttacker) && (
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 z-0 h-[62px] w-[47px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] transition-all sm:h-[114px] sm:w-[92px] ${
            isSelectedAttacker
              ? 'shadow-[0_0_0_3px_#fde047,0_0_18px_5px_rgba(250,204,21,0.95)] sm:shadow-[0_0_0_4px_#fde047,0_0_26px_8px_rgba(250,204,21,0.95)]'
              : isValidTarget
                ? 'animate-pulse shadow-[0_0_0_3px_#ef4444,0_0_18px_5px_rgba(239,68,68,0.92)] sm:shadow-[0_0_0_4px_#ef4444,0_0_24px_7px_rgba(239,68,68,0.92)]'
                : 'shadow-[0_0_0_2.5px_#4ade80,0_0_14px_4px_rgba(34,197,94,0.88)] sm:shadow-[0_0_0_3.5px_#4ade80,0_0_20px_6px_rgba(34,197,94,0.88)]'
          }`}
        />
      )}

      {/* Sculpted Legendary Dragon Crest */}
      {minion.rarity === 'LEGENDARY' && (
        <img
          src="/stone-assets/ui/legendary_dragon.webp"
          alt="전설"
          className="pointer-events-none absolute -right-2 -top-2.5 z-30 h-8 w-12 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] sm:-right-3 sm:-top-3.5 sm:h-14 sm:w-[86px]"
        />
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
            src={getCardArtUrl(minion.cardId)}
            alt={minion.name}
            onError={() => setImgErr(true)}
            className={`h-full w-full scale-115 object-cover ${
              minion.stealth ? 'brightness-50 contrast-125 saturate-50' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-900 px-0.5 text-center text-[8px] font-bold text-amber-200 sm:px-1 sm:text-[11px]">
            {minion.name}
          </div>
        )}

        {/* Inner Vignette Rim */}
        <div className="pointer-events-none absolute inset-0 rounded-[50%] shadow-[inset_0_0_14px_rgba(0,0,0,0.75)]" />

        {/* Stealth Shadow Fog */}
        {minion.stealth && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-950/60 via-slate-900/35 to-slate-950/75">
            <span className="hs-outline-sm rounded border border-slate-400/50 bg-slate-950/85 px-1 py-0.5 text-[7.5px] font-extrabold tracking-wider text-slate-200 sm:px-1.5 sm:text-[9px]">
              은신
            </span>
          </div>
        )}

        {/* Frozen Ice Glaze */}
        {minion.frozen && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-100/55 via-sky-400/25 to-blue-700/50" />
        )}

        {/* Windfury Swirl */}
        {minion.windfury && !minion.silenced && (
          <div className="pointer-events-none absolute inset-x-0 top-1 flex justify-center sm:top-2">
            <span className="hs-outline-sm rounded-full border border-cyan-300/60 bg-sky-950/85 px-1 text-[7px] font-extrabold text-cyan-200 sm:px-1.5 sm:text-[8.5px]">
              질풍
            </span>
          </div>
        )}

        {/* Silenced Arcane Seal */}
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

      {/* Divine Shield Golden Dome */}
      {minion.divineShield && (
        <img
          src="/stone-assets/ui/divine_shield.webp"
          alt="천상의 보호막"
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[64px] w-[50px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] object-cover opacity-85 mix-blend-screen drop-shadow-[0_0_14px_rgba(250,204,21,0.9)] sm:h-[118px] sm:w-[96px]"
        />
      )}

      {/* Summoning Sickness Zzz */}
      {showSleepZzz && (
        <div className="hs-num pointer-events-none absolute -right-1 -top-1.5 z-30 animate-bounce text-[9px] text-sky-200 sm:-top-2 sm:text-xs">
          Zzz
        </div>
      )}

      {/* Deathrattle / Poison / Spell Power Pedestal Emblem */}
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

      {/* Sculpted Crossed-Sword Attack Badge (Bottom Left) */}
      <div className="pointer-events-none absolute -bottom-1.5 -left-1.5 z-30 origin-bottom-left scale-[0.62] sm:-bottom-2 sm:-left-2.5 sm:scale-100">
        <HsAttackBadge value={atk} buffed={atk > minion.baseAttack} size={36} />
      </div>

      {/* Sculpted Crimson Blood-Drop Health Badge (Bottom Right) */}
      <div className="pointer-events-none absolute -bottom-2 -right-1.5 z-30 origin-bottom-right scale-[0.62] sm:-bottom-2.5 sm:-right-2.5 sm:scale-100">
        <HsHealthBadge value={hp} state={hpState} size={35} />
      </div>
    </div>
  );
});

/* ============================================================================
 * 4. Commercial Hero Arch Portrait + Weapon Sheathe + Hero Power Coin
 * ============================================================================ */

const SECRET_MEDALLION_URL: Record<string, string> = {
  MAGE: '/stone-assets/ui/secret_mage.webp',
  HUNTER: '/stone-assets/ui/secret_hunter.webp',
  PALADIN: '/stone-assets/ui/secret_paladin.webp',
};

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

export const HeroPortraitZone: React.FC<HeroZoneProps> = React.memo(({
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
                src={getCardArtUrl(player.weapon.cardId)}
                alt={player.weapon.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              /* Closed Steel Weapon Shutter on Opponent's Turn */
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950">
                <img
                  src="/stone-assets/ui/play_swirl_medallion.webp"
                  alt=""
                  className="h-8 w-8 opacity-65 sm:h-11 sm:w-11"
                />
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
            {player.secrets.map((sec) => {
              const secImg = SECRET_MEDALLION_URL[sec.heroClass];
              return (
                <div
                  key={sec.uid}
                  title={
                    isFriendly
                      ? `내 비밀: ${sec.name}`
                      : `${CLASSIC_HEROES[sec.heroClass].classNameKo} 비밀: 조건이 충족되면 발동합니다!`
                  }
                  className="relative flex h-5 w-5 items-center justify-center rounded-full border border-amber-100 bg-stone-950 shadow-[0_3px_8px_rgba(0,0,0,0.9)] sm:h-7 sm:w-7 sm:border-2"
                >
                  {secImg ? (
                    <img src={secImg} alt="비밀" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <span className="hs-num text-[10px] text-amber-200 sm:text-xs">?</span>
                  )}
                </div>
              );
            })}
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
            className="h-full w-full scale-112 object-cover object-top"
          />
          {/* Small Class Crest Pin Top-Left */}
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

        {/* Official Extracted Silver Armor Shield */}
        {player.armor > 0 && (
          <div className="pointer-events-none absolute -right-2.5 bottom-6 z-30 flex h-7 w-6.5 items-center justify-center sm:-right-3 sm:bottom-8 sm:h-10 sm:w-9">
            <img
              src="/stone-assets/ui/armor_shield.webp"
              alt="방어도"
              className="h-full w-full object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]"
            />
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
            className={`pointer-events-none absolute left-1/2 z-50 w-44 -translate-x-1/2 rounded-2xl border-2 border-[#6e4c23] bg-gradient-to-b from-[#fcf6e6] to-[#e6d3ad] px-3 py-1.5 text-center text-[11px] font-extrabold text-[#24170b] shadow-[0_12px_28px_rgba(0,0,0,0.9)] sm:w-48 sm:translate-x-0 sm:px-3.5 sm:py-2 sm:text-xs ${
              isFriendly ? '-top-11 sm:-left-36 sm:-top-14' : '-bottom-11 sm:-bottom-14 sm:-left-36'
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
            /* Flipped Carved Hearthstone Swirl Back (No Emoji!) */
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
              <img
                src="/stone-assets/ui/play_swirl_medallion.webp"
                alt="사용됨"
                className="h-full w-full object-cover brightness-75"
              />
            </div>
          ) : (
            <>
              <img
                src={getCardTileUrl(player.heroPowerId)}
                alt={player.heroPowerNameKo}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = getHeroArtUrl(heroMeta.heroId);
                }}
                className="h-full w-full rounded-full object-cover"
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
});
