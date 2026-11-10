import React, { useState } from 'react';
import {
  formatCardHtmlText,
  getCardArtUrl,
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

export const RACE_KO: Record<string, string> = {
  BEAST: '야수',
  DEMON: '악마',
  DRAGON: '용족',
  MURLOC: '멀록',
  PIRATE: '해적',
  TOTEM: '토템',
};

const CLASS_FRAME_COLORS: Record<CardClass, { bg: string; border: string; trim: string }> = {
  MAGE: {
    bg: 'linear-gradient(180deg, #3b82f6 0%, #1e3a8a 100%)',
    border: '#93c5fd',
    trim: '#1d4ed8',
  },
  WARRIOR: {
    bg: 'linear-gradient(180deg, #b91c1c 0%, #450a0a 100%)',
    border: '#fca5a5',
    trim: '#7f1d1d',
  },
  HUNTER: {
    bg: 'linear-gradient(180deg, #15803d 0%, #052e16 100%)',
    border: '#86efac',
    trim: '#14532d',
  },
  PALADIN: {
    bg: 'linear-gradient(180deg, #d97706 0%, #713f12 100%)',
    border: '#fde047',
    trim: '#a16207',
  },
  PRIEST: {
    bg: 'linear-gradient(180deg, #e2e8f0 0%, #64748b 100%)',
    border: '#f8fafc',
    trim: '#94a3b8',
  },
  ROGUE: {
    bg: 'linear-gradient(180deg, #334155 0%, #090d16 100%)',
    border: '#94a3b8',
    trim: '#1e293b',
  },
  SHAMAN: {
    bg: 'linear-gradient(180deg, #1d4ed8 0%, #172554 100%)',
    border: '#60a5fa',
    trim: '#1e40af',
  },
  WARLOCK: {
    bg: 'linear-gradient(180deg, #7e22ce 0%, #2e1065 100%)',
    border: '#d8b4fe',
    trim: '#581c87',
  },
  DRUID: {
    bg: 'linear-gradient(180deg, #92400e 0%, #3b1704 100%)',
    border: '#fdba74',
    trim: '#78350f',
  },
  NEUTRAL: {
    bg: 'linear-gradient(180deg, #78716c 0%, #292524 100%)',
    border: '#d6d3d1',
    trim: '#57534e',
  },
  DREAM: {
    bg: 'linear-gradient(180deg, #10b981 0%, #064e3b 100%)',
    border: '#6ee7b7',
    trim: '#047857',
  },
};

const RARITY_GEM_COLORS: Record<CardRarity, string | null> = {
  FREE: null,
  COMMON: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 65%, #64748b 100%)',
  RARE: 'radial-gradient(circle at 35% 35%, #93c5fd 0%, #2563eb 65%, #1e3a8a 100%)',
  EPIC: 'radial-gradient(circle at 35% 35%, #e9d5ff 0%, #9333ea 65%, #4c1d95 100%)',
  LEGENDARY: 'radial-gradient(circle at 35% 35%, #fef08a 0%, #f97316 65%, #9a3412 100%)',
};

export interface HearthstoneCardProps {
  card: ClassicCardDef;
  effectiveCost?: number;
  spellPowerBonus?: number;
  velenMultiplier?: number;
  playableGlow?: 'NONE' | 'GREEN' | 'COMBO';
  isGolden?: boolean;
  size?: 'SM' | 'MD' | 'LG';
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
  isGolden = false,
  size = 'MD',
  enableTilt = false,
  onClick,
  className = '',
}) => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [imgErr, setImgErr] = useState(false);

  const shownCost = effectiveCost !== undefined ? effectiveCost : card.cost;
  const costColor =
    shownCost < card.cost ? '#4ade80' : shownCost > card.cost ? '#f87171' : '#ffffff';

  const frame = isGolden
    ? {
        bg: 'linear-gradient(180deg, #facc15 0%, #b45309 55%, #78350f 100%)',
        border: '#fef08a',
        trim: '#d97706',
      }
    : CLASS_FRAME_COLORS[card.cardClass] || CLASS_FRAME_COLORS.NEUTRAL;

  const dims =
    size === 'SM'
      ? { w: 124, h: 176, fontTitle: 'text-[10.5px]', fontBody: 'text-[8.5px]', statSize: 'w-7 h-7 text-sm' }
      : size === 'LG'
        ? { w: 224, h: 314, fontTitle: 'text-[15px]', fontBody: 'text-[11.5px]', statSize: 'w-11 h-11 text-2xl' }
        : { w: 164, h: 232, fontTitle: 'text-[12px]', fontBody: 'text-[9.5px]', statSize: 'w-8 h-8 text-lg' };

  const glowStyle =
    playableGlow === 'COMBO'
      ? '0 0 0 3px #facc15, 0 0 22px 6px rgba(250, 204, 21, 0.85)'
      : playableGlow === 'GREEN'
        ? '0 0 0 3px #4ade80, 0 0 20px 5px rgba(34, 197, 94, 0.82)'
        : '0 10px 24px rgba(0,0,0,0.65)';

  const gemBg = RARITY_GEM_COLORS[card.rarity];
  const formattedText = formatCardHtmlText(card.text, spellPowerBonus, velenMultiplier);

  return (
    <div
      onClick={onClick}
      onMouseMove={(e) => {
        if (!enableTilt) return;
        const r = e.currentTarget.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        setTilt({ rx: -ny * 15, ry: nx * 15 });
      }}
      onMouseLeave={() => enableTilt && setTilt({ rx: 0, ry: 0 })}
      style={{
        width: dims.w,
        height: dims.h,
        background: frame.bg,
        borderColor: isGolden ? '#fef08a' : frame.border,
        boxShadow: glowStyle,
        transform:
          enableTilt && (tilt.rx !== 0 || tilt.ry !== 0)
            ? `perspective(700px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
            : undefined,
      }}
      className={`relative select-none rounded-[14px] border-[2.5px] p-1.5 transition-transform duration-150 ${className}`}
    >
      {/* Legendary Dragon Crest */}
      {card.rarity === 'LEGENDARY' && (
        <div className="pointer-events-none absolute -top-3.5 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center">
          <div className="rounded-full border border-amber-200 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-800 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-amber-950 shadow-lg">
            ★ 전설 ★
          </div>
        </div>
      )}

      {/* Mana Crystal (Top Left) */}
      <div
        className={`hs-num absolute -left-2 -top-2 z-30 flex items-center justify-center rounded-full border-2 border-sky-200 bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-950 shadow-[0_3px_10px_rgba(0,0,0,0.8)] ${dims.statSize}`}
        style={{
          clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)',
          color: costColor,
        }}
      >
        {shownCost}
      </div>

      {/* Card Art Window */}
      <div
        className={`relative mx-auto mt-1 overflow-hidden border-2 border-amber-200/60 bg-stone-950 shadow-inner ${
          card.type === 'MINION'
            ? 'h-[46%] w-[78%] rounded-[50%]'
            : card.type === 'WEAPON'
              ? 'h-[45%] w-[76%] rounded-full border-slate-300/80'
              : 'h-[45%] w-[88%] rounded-t-[18px] rounded-b-[6px]'
        }`}
      >
        {!imgErr ? (
          <img
            src={getCardArtUrl(card.artId)}
            alt={card.name}
            loading="lazy"
            onError={() => setImgErr(true)}
            className="h-full w-full scale-110 object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-amber-900 to-stone-950 text-xs font-bold text-amber-200">
            {card.name.slice(0, 4)}
          </div>
        )}
        {isGolden && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-amber-400/10 via-transparent to-yellow-200/25 mix-blend-screen" />
        )}
      </div>

      {/* Curved Parchment Name Ribbon */}
      <div className="relative z-20 -mt-2.5 mx-0.5 flex items-center justify-center rounded-[8px] border border-amber-900/80 bg-gradient-to-b from-[#f6e7c1] via-[#e6cfa0] to-[#caa971] px-1.5 py-0.5 shadow-md">
        <span
          className={`hs-outline-sm truncate font-extrabold tracking-tight text-white ${dims.fontTitle}`}
        >
          {card.name}
        </span>
      </div>

      {/* Rarity Gem */}
      {gemBg && (
        <div className="relative z-20 -mt-1 flex justify-center">
          <div
            className="h-3 w-2.5 rounded-full border border-stone-900 shadow"
            style={{ background: gemBg }}
          />
        </div>
      )}

      {/* Parchment Description Box */}
      <div
        className={`${
          gemBg ? 'mt-0.5' : 'mt-1.5'
        } flex h-[32%] w-full items-center justify-center overflow-hidden rounded-[7px] border border-stone-800/60 px-2 py-1 text-center shadow-inner ${
          card.type === 'WEAPON'
            ? 'bg-gradient-to-b from-slate-800 to-slate-950 text-slate-100'
            : 'bg-gradient-to-b from-[#f5ebd4] to-[#dfd0b0] text-[#241a10]'
        }`}
      >
        <div
          className={`leading-[1.22] font-semibold ${dims.fontBody}`}
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      </div>

      {/* Tribe Tag */}
      {card.race && RACE_KO[card.race] && (
        <div className="absolute bottom-1 left-1/2 z-20 -translate-x-1/2 rounded border border-amber-900 bg-[#3a2614] px-2 py-[1px] text-[8.5px] font-bold text-amber-200 shadow">
          {RACE_KO[card.race]}
        </div>
      )}

      {/* Attack Badge (Minion / Weapon) */}
      {(card.type === 'MINION' || card.type === 'WEAPON') && (
        <div
          className={`hs-num absolute -bottom-2 -left-2 z-30 flex items-center justify-center rounded-full border-2 shadow-[0_3px_10px_rgba(0,0,0,0.85)] ${
            card.type === 'WEAPON'
              ? 'border-slate-300 bg-gradient-to-b from-slate-400 via-slate-600 to-slate-900 text-white'
              : 'border-amber-200 bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-800 text-white'
          } ${dims.statSize}`}
        >
          {card.attack ?? 0}
        </div>
      )}

      {/* Health / Durability Badge */}
      {card.type === 'MINION' && (
        <div
          className={`hs-num absolute -bottom-2 -right-2 z-30 flex items-center justify-center rounded-full border-2 border-red-200 bg-gradient-to-b from-red-400 via-red-600 to-red-950 text-white shadow-[0_3px_10px_rgba(0,0,0,0.85)] ${dims.statSize}`}
        >
          {card.health ?? 1}
        </div>
      )}
      {card.type === 'WEAPON' && (
        <div
          className={`hs-num absolute -bottom-2 -right-2 z-30 flex items-center justify-center rounded-md border-2 border-slate-200 bg-gradient-to-b from-slate-400 via-slate-600 to-slate-900 text-white shadow-[0_3px_10px_rgba(0,0,0,0.85)] ${dims.statSize}`}
        >
          {card.durability ?? 1}
        </div>
      )}
    </div>
  );
};

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

  const atkColor = atk > minion.baseAttack ? '#4ade80' : '#ffffff';
  const hpColor =
    hp < maxHp ? '#fca5a5' : maxHp > minion.baseHealth ? '#4ade80' : '#ffffff';

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

  const showSleepZzz = minion.exhausted && !minion.charge && !minion.auraCharge && !minion.cantAttack;

  return (
    <div
      data-hs-entity={minion.uid}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={`group relative flex h-[116px] w-[92px] cursor-pointer select-none items-center justify-center transition-transform duration-150 ${
        isSelectedAttacker ? '-translate-y-3 scale-110 z-30' : 'hover:scale-105 hover:z-20'
      }`}
    >
      {/* Taunt Shield Silhouette Behind Oval */}
      {isTaunt && (
        <div
          className="pointer-events-none absolute -inset-2 z-0 border-[4px] border-[#d6b370] bg-gradient-to-b from-[#6e5638] via-[#3c2d1d] to-[#1e150c] shadow-[0_6px_18px_rgba(0,0,0,0.88)]"
          style={{
            clipPath:
              'polygon(50% 0%, 92% 14%, 100% 56%, 82% 88%, 50% 100%, 18% 88%, 0% 56%, 8% 14%)',
          }}
        />
      )}

      {/* Ready-to-Attack or Valid Target Glow */}
      {(canAttack || isValidTarget || isSelectedAttacker) && (
        <div
          className={`pointer-events-none absolute -inset-1.5 z-0 rounded-[50%] transition-all ${
            isSelectedAttacker
              ? 'shadow-[0_0_0_4px_#facc15,0_0_24px_8px_rgba(250,204,21,0.9)]'
              : isValidTarget
                ? 'animate-pulse shadow-[0_0_0_4px_#ef4444,0_0_22px_6px_rgba(239,68,68,0.9)]'
                : 'shadow-[0_0_0_3.5px_#4ade80,0_0_18px_5px_rgba(74,222,128,0.85)]'
          }`}
        />
      )}

      {/* Legendary Dragon Top Crest */}
      {minion.rarity === 'LEGENDARY' && (
        <div className="pointer-events-none absolute -top-3.5 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-200 bg-gradient-to-b from-amber-300 to-amber-700 px-2 py-[1px] text-[9px] font-black text-amber-950 shadow">
          ★ 전설
        </div>
      )}

      {/* Oval Portrait Frame */}
      <div
        className={`relative z-10 h-[104px] w-[82px] overflow-hidden rounded-[50%] border-[3.5px] bg-stone-900 shadow-[0_8px_18px_rgba(0,0,0,0.75)] ${
          minion.frozen
            ? 'border-cyan-300 ring-4 ring-sky-400/70'
            : isTaunt
              ? 'border-[#e7c98a]'
              : 'border-[#c8a568]'
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
          <div className="flex h-full w-full items-center justify-center bg-stone-800 px-1 text-center text-[11px] font-bold text-amber-200">
            {minion.name}
          </div>
        )}

        {/* Stealth Mist */}
        {minion.stealth && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/45">
            <span className="rounded bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-200">
              은신
            </span>
          </div>
        )}

        {/* Frozen Ice Overlay */}
        {minion.frozen && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-200/45 via-sky-400/25 to-blue-600/45" />
        )}

        {/* Windfury Streaks */}
        {minion.windfury && !minion.silenced && (
          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
            <span className="rounded-full bg-sky-900/80 px-1.5 text-[8.5px] font-bold text-cyan-200">
              질풍 ×2
            </span>
          </div>
        )}

        {/* Silenced Chains X */}
        {minion.silenced && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-black text-purple-300/85 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
              ✕
            </span>
          </div>
        )}
      </div>

      {/* Divine Shield Golden Dome */}
      {minion.divineShield && (
        <div className="pointer-events-none absolute -inset-1 z-20 rounded-[50%] border-[3px] border-yellow-200 bg-gradient-to-tr from-amber-300/25 via-yellow-100/35 to-amber-200/30 shadow-[0_0_18px_rgba(250,204,21,0.85)]" />
      )}

      {/* Floating Zzz Exhaustion Indicator */}
      {showSleepZzz && (
        <div className="pointer-events-none absolute -right-1 -top-2 z-30 animate-bounce text-xs font-black text-sky-200 drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)]">
          Zzz
        </div>
      )}

      {/* Bottom Keyword Trigger / Deathrattle / Poison / SpellPower Emblem */}
      {(hasDeathrattle || (!minion.silenced && (minion.poisonous || minion.spellDamage > 0))) && (
        <div className="pointer-events-none absolute -bottom-2 left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-amber-300/80 bg-stone-950 px-1.5 py-[1px] text-[10px] shadow">
          {hasDeathrattle && <span title="죽음의 메아리">💀</span>}
          {!minion.silenced && minion.poisonous && <span title="독성">🧪</span>}
          {!minion.silenced && minion.spellDamage > 0 && (
            <span className="font-bold text-sky-300" title="주문 공격력">
              ✦+{minion.spellDamage}
            </span>
          )}
        </div>
      )}

      {/* Attack Sword Orb (Bottom Left) */}
      <div
        style={{ color: atkColor }}
        className="hs-num pointer-events-none absolute -bottom-1 -left-1.5 z-30 flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-200 bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-900 text-lg shadow-[0_3px_8px_rgba(0,0,0,0.9)]"
      >
        {atk}
      </div>

      {/* Health Blood Drop Orb (Bottom Right) */}
      <div
        style={{ color: hpColor }}
        className={`hs-num pointer-events-none absolute -bottom-1 -right-1.5 z-30 flex h-8 w-8 items-center justify-center rounded-full border-2 text-lg shadow-[0_3px_8px_rgba(0,0,0,0.9)] ${
          hp < maxHp
            ? 'border-red-300 bg-gradient-to-b from-red-500 via-red-700 to-red-950'
            : 'border-red-200 bg-gradient-to-b from-red-400 via-red-600 to-red-900'
        }`}
      >
        {hp}
      </div>
    </div>
  );
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
    <div className="relative flex items-center justify-center gap-3 select-none">
      {/* Left: Equipped Weapon Medallion */}
      <div className="relative flex h-[78px] w-[78px] items-center justify-center">
        {player.weapon ? (
          <div
            title={`${player.weapon.name} (${player.weapon.attack}/${player.weapon.durability})`}
            className={`relative flex h-[74px] w-[74px] items-center justify-center rounded-full border-[3px] shadow-[0_6px_16px_rgba(0,0,0,0.85)] transition-all ${
              weaponOpen
                ? 'border-amber-300 bg-stone-900 ring-2 ring-emerald-400/60'
                : 'border-slate-500 bg-slate-900 brightness-75'
            }`}
          >
            {weaponOpen ? (
              <img
                src={getCardArtUrl(player.weapon.cardId)}
                alt={player.weapon.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              /* Closed Weapon Steel Shutter on Opponent's Turn! */
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950 text-[10px] font-bold text-slate-300">
                <span>⚔</span>
                <span>닫힘</span>
              </div>
            )}
            <div className="hs-num absolute -bottom-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-800 text-sm text-white">
              {player.weapon.attack}
            </div>
            <div className="hs-num absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-700 text-sm text-white">
              {player.weapon.durability}
            </div>
          </div>
        ) : (
          <div className="h-[68px] w-[68px] rounded-full border border-amber-900/30 bg-black/20" />
        )}
      </div>

      {/* Center: Arch Hero Portrait */}
      <div
        data-hs-entity={entityId}
        onClick={(e) => {
          e.stopPropagation();
          onClickHero();
        }}
        className={`relative flex h-[116px] w-[104px] cursor-pointer items-center justify-center transition-transform ${
          isHeroSelectedAttacker ? '-translate-y-2 scale-105' : 'hover:scale-[1.03]'
        }`}
      >
        {/* Active Secrets Crown Orbs */}
        {player.secrets.length > 0 && (
          <div className="absolute -top-4 left-1/2 z-40 flex -translate-x-1/2 gap-1">
            {player.secrets.map((sec) => {
              const secColor = CLASSIC_HEROES[sec.heroClass]?.secretColor || '#f472b6';
              return (
                <div
                  key={sec.uid}
                  title={
                    isFriendly
                      ? `내 비밀: ${sec.name}`
                      : `${CLASSIC_HEROES[sec.heroClass].classNameKo} 비밀: 조건이 충족되면 밝혀집니다!`
                  }
                  style={{ background: secColor }}
                  className="hs-num flex h-6 w-6 items-center justify-center rounded-full border-2 border-amber-100 text-xs text-stone-950 shadow-lg"
                >
                  ?
                </div>
              );
            })}
          </div>
        )}

        {/* Glow Ring */}
        {(canHeroAttack || isHeroValidTarget || isHeroSelectedAttacker) && (
          <div
            className={`pointer-events-none absolute -inset-1.5 rounded-t-[54px] rounded-b-[14px] ${
              isHeroSelectedAttacker
                ? 'shadow-[0_0_0_4px_#facc15,0_0_24px_6px_rgba(250,204,21,0.9)]'
                : isHeroValidTarget
                  ? 'animate-pulse shadow-[0_0_0_4px_#ef4444,0_0_24px_6px_rgba(239,68,68,0.9)]'
                  : 'shadow-[0_0_0_3.5px_#4ade80,0_0_18px_5px_rgba(74,222,128,0.85)]'
            }`}
          />
        )}

        {/* Arch Frame */}
        <div
          className={`relative h-full w-full overflow-hidden rounded-t-[54px] rounded-b-[14px] border-[4px] bg-stone-900 shadow-[0_10px_24px_rgba(0,0,0,0.88)] ${
            player.immuneThisTurn
              ? 'border-yellow-200 ring-4 ring-amber-300'
              : player.frozen
                ? 'border-cyan-300 ring-4 ring-sky-400/70'
                : 'border-[#d4b06a]'
          }`}
        >
          <img
            src={getHeroArtUrl(player.isJaraxxus ? 'EX1_323h' : player.heroId)}
            alt={player.heroNameKo}
            className="h-full w-full scale-110 object-cover object-top"
          />
          {player.frozen && (
            <div className="pointer-events-none absolute inset-0 bg-cyan-300/35" />
          )}
          {player.immuneThisTurn && (
            <div className="pointer-events-none absolute inset-x-0 top-2 text-center text-[10px] font-black text-yellow-200 drop-shadow">
              ★ 면역 ★
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-1 pb-1 pt-3 text-center">
            <div className="truncate text-[10px] font-bold text-amber-100">
              {player.name}
            </div>
          </div>
        </div>

        {/* Hero Attack Badge (Only shown when > 0) */}
        {heroAtk > 0 && (
          <div className="hs-num pointer-events-none absolute -bottom-2 -left-2.5 z-30 flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-200 bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-900 text-xl text-white shadow-lg">
            {heroAtk}
          </div>
        )}

        {/* Armor Shield Badge */}
        {player.armor > 0 && (
          <div className="hs-num pointer-events-none absolute -right-2.5 bottom-7 z-30 flex h-8 w-8 items-center justify-center rounded-t-md rounded-b-xl border-2 border-slate-100 bg-gradient-to-b from-slate-300 via-slate-500 to-slate-800 text-base text-white shadow-lg">
            {player.armor}
          </div>
        )}

        {/* Health Blood Drop Badge */}
        <div
          className={`hs-num pointer-events-none absolute -bottom-2 -right-2.5 z-30 flex h-9 w-9 items-center justify-center rounded-full border-2 border-red-200 bg-gradient-to-b from-red-400 via-red-600 to-red-950 text-xl shadow-lg ${
            player.health < player.maxHealth ? 'text-red-200' : 'text-white'
          }`}
        >
          {player.health}
        </div>

        {/* Speech Bubble for Korean Emotes */}
        {emoteBubbleText && (
          <div
            className={`pointer-events-none absolute z-50 w-44 rounded-2xl border-2 border-stone-700 bg-[#fdf8ec] px-3 py-2 text-center text-xs font-extrabold text-stone-900 shadow-2xl ${
              isFriendly ? '-top-14 -left-32' : '-bottom-14 -left-32'
            }`}
          >
            “{emoteBubbleText}”
          </div>
        )}
      </div>

      {/* Right: Flipping Hero Power Coin */}
      <div className="relative flex h-[78px] w-[78px] items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClickHeroPower();
          }}
          title={`${player.heroPowerNameKo} (비용 2): ${player.heroPowerTextKo}`}
          className={`relative flex h-[74px] w-[74px] items-center justify-center rounded-full border-[3.5px] transition-all duration-300 ${
            player.heroPowerUsedThisTurn
              ? 'rotate-y-180 border-stone-700 bg-gradient-to-b from-[#5c4028] to-[#2c1d11] opacity-80'
              : isHeroPowerSelected
                ? 'scale-110 border-yellow-300 shadow-[0_0_0_3px_#facc15,0_0_20px_rgba(250,204,21,0.9)]'
                : canUseHeroPower
                  ? 'cursor-pointer border-[#e5c178] shadow-[0_0_0_3px_#4ade80,0_0_16px_rgba(74,222,128,0.8)] hover:scale-105'
                  : 'border-[#b69252] bg-stone-900'
          }`}
        >
          {player.heroPowerUsedThisTurn ? (
            /* Flipped Wooden Hearthstone Swirl Back */
            <div className="flex flex-col items-center justify-center text-amber-300/60">
              <span className="text-xl">🌀</span>
              <span className="text-[9px] font-bold">사용됨</span>
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
              <div className="hs-num absolute -top-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-sky-200 bg-gradient-to-b from-sky-400 to-blue-900 text-xs text-white shadow">
                2
              </div>
              <div className="absolute inset-x-0 bottom-0 rounded-b-full bg-black/75 py-0.5 text-center text-[8.5px] font-bold text-amber-100">
                {player.heroPowerNameKo}
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
