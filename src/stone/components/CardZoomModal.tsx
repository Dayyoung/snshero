import React from 'react';
import { hsAudio } from '../audio';
import { CLASS_CREST_URL, formatCardHtmlText } from '../cardDb';
import { useModalDismiss } from '../useModalDismiss';
import {
  CLASSIC_HEROES,
  CardClass,
  CardRarity,
  ClassicCardDef,
  HeroClass,
} from '../types';
import {
  HearthstoneCard,
  HsAttackBadge,
  HsHealthBadge,
  HsManaGem,
  RACE_KO,
} from './CardVisual';

const RARITY_LABEL_KO: Record<CardRarity, string> = {
  FREE: '기본',
  COMMON: '일반',
  RARE: '희귀',
  EPIC: '특급',
  LEGENDARY: '전설',
};

const TYPE_LABEL_KO: Record<ClassicCardDef['type'], string> = {
  MINION: '하수인',
  SPELL: '주문',
  WEAPON: '무기',
  HERO_POWER: '영웅 능력',
  HERO: '영웅',
};

function getClassLabelKo(cardClass: CardClass): string {
  if (cardClass === 'NEUTRAL') return '중립';
  if (cardClass === 'DREAM') return '꿈';
  return CLASSIC_HEROES[cardClass as HeroClass]?.classNameKo || cardClass;
}

export interface CardZoomAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'arcane' | 'emerald' | 'crimson' | 'brass';
}

export interface CardZoomModalProps {
  card: ClassicCardDef;
  effectiveCost?: number;
  spellPowerBonus?: number;
  velenMultiplier?: number;
  isGolden?: boolean;
  playableGlow?: 'NONE' | 'GREEN' | 'COMBO';
  rarityAura?: CardRarity;
  subtitleBadge?: string;
  liveStats?: {
    attack: number;
    health: number;
    maxHealth: number;
    statuses?: string[];
  };
  showFlavor?: boolean;
  primaryAction?: CardZoomAction;
  secondaryActions?: CardZoomAction[];
  onCancel: () => void;
}

export const CardZoomModal: React.FC<CardZoomModalProps> = ({
  card,
  effectiveCost,
  spellPowerBonus = 0,
  velenMultiplier = 1,
  isGolden = false,
  playableGlow = 'NONE',
  rarityAura,
  subtitleBadge,
  liveStats,
  showFlavor = false,
  primaryAction,
  secondaryActions = [],
  onCancel,
}) => {
  useModalDismiss(true, onCancel);

  const shownCost = effectiveCost !== undefined ? effectiveCost : card.cost;
  const costState: 'normal' | 'buffed' | 'nerfed' =
    shownCost < card.cost ? 'buffed' : shownCost > card.cost ? 'nerfed' : 'normal';

  const shownAttack = liveStats ? liveStats.attack : card.attack;
  const shownHealth =
    liveStats !== undefined
      ? liveStats.health
      : card.type === 'WEAPON'
        ? card.durability
        : card.health;

  const cleanHtml = formatCardHtmlText(card.text || '', spellPowerBonus, velenMultiplier).trim();

  const renderBtnClass = (variant: CardZoomAction['variant'] = 'arcane', disabled?: boolean) => {
    if (disabled) {
      return 'cursor-not-allowed border-2 border-stone-600 bg-stone-900/95 text-stone-400 opacity-85';
    }
    if (variant === 'emerald') {
      return 'border-2 border-emerald-200 bg-gradient-to-b from-emerald-500 via-emerald-700 to-emerald-950 text-white shadow-[0_8px_22px_rgba(16,185,129,0.55)] hover:brightness-110 active:scale-[0.98]';
    }
    if (variant === 'crimson') {
      return 'border-2 border-red-300 bg-gradient-to-b from-red-600 via-red-800 to-red-950 text-white shadow-[0_8px_20px_rgba(220,38,38,0.5)] hover:brightness-110 active:scale-[0.98]';
    }
    if (variant === 'brass') {
      return 'hs-brass-btn text-amber-100';
    }
    return 'hs-arcane-btn text-white';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name} 카드 확대`}
      onClick={() => {
        hsAudio.playSfx('ui_click', 0.45);
        onCancel();
      }}
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/78 px-5 py-3 backdrop-blur-[3px] sm:px-8 sm:py-6"
    >
      {/* Inner Card Inspection & Action Container (Stops propagation so only outer click cancels) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="hs-wood-panel relative flex max-h-[94dvh] w-full max-w-[332px] flex-col items-center overflow-y-auto rounded-3xl px-3.5 pb-3.5 pt-2.5 text-amber-100 shadow-[0_26px_70px_rgba(0,0,0,0.95)] sm:max-w-[408px] sm:px-5 sm:pb-4 sm:pt-3.5"
      >
        {/* Top Close Pill */}
        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('ui_click', 0.45);
            onCancel();
          }}
          aria-label="카드 선택 취소"
          className="hs-brass-btn absolute right-2.5 top-2.5 z-40 flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold text-amber-100"
        >
          ✕
        </button>

        {subtitleBadge && (
          <div className="mb-1 rounded-full border border-amber-300/60 bg-stone-950/90 px-3 py-0.5 text-[11px] font-extrabold text-amber-200 shadow">
            {subtitleBadge}
          </div>
        )}

        {/* Enlarged 512x Official koKR Sculpted Card */}
        <div className="-my-6 origin-center scale-[0.78] sm:-my-2 sm:scale-[0.94]">
          <HearthstoneCard
            card={card}
            effectiveCost={effectiveCost}
            spellPowerBonus={spellPowerBonus}
            velenMultiplier={velenMultiplier}
            isGolden={isGolden}
            playableGlow={playableGlow}
            rarityAura={rarityAura || card.rarity}
            size="LG"
            enableTilt
          />
        </div>

        {/* Crisp Nanum Gothic High-Contrast Card Text Readout Plaque */}
        <div className="mt-1 w-full rounded-2xl border-2 border-[#a88246] bg-gradient-to-b from-[#fdf6e4] to-[#ecdab5] px-3.5 py-2.5 text-[#221409] shadow-[inset_0_2px_8px_rgba(68,40,14,0.22)]">
          <div className="flex items-center justify-between gap-2 border-b border-[#9a743a]/35 pb-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <img
                src={CLASS_CREST_URL[card.cardClass] || CLASS_CREST_URL.NEUTRAL}
                alt=""
                className="h-5 w-5 shrink-0 rounded-full border border-[#6e4c23] object-cover"
              />
              <h3 className="truncate text-base font-extrabold tracking-tight text-[#1c1007] sm:text-lg">
                {card.name}
              </h3>
            </div>

            {/* Crisp Stat Summary Badges */}
            <div className="flex shrink-0 items-center gap-1">
              <HsManaGem value={shownCost} state={costState} size={25} active />
              {(card.type === 'MINION' || card.type === 'WEAPON') && shownAttack !== undefined && (
                <HsAttackBadge
                  value={shownAttack}
                  buffed={liveStats ? liveStats.attack > (card.attack ?? 0) : false}
                  isWeapon={card.type === 'WEAPON'}
                  size={25}
                />
              )}
              {(card.type === 'MINION' || card.type === 'WEAPON') && shownHealth !== undefined && (
                <HsHealthBadge
                  value={shownHealth}
                  state={
                    liveStats
                      ? liveStats.health < liveStats.maxHealth
                        ? 'damaged'
                        : liveStats.maxHealth > (card.health ?? 1)
                          ? 'buffed'
                          : 'normal'
                      : 'normal'
                  }
                  size={24}
                />
              )}
            </div>
          </div>

          {/* Card Classification Tags */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px] font-bold text-[#5a3b1c]">
            <span className="rounded bg-[#422813] px-1.5 py-0.5 text-[10.5px] font-extrabold text-amber-100">
              {getClassLabelKo(card.cardClass)}
            </span>
            <span>·</span>
            <span>{TYPE_LABEL_KO[card.type]}</span>
            <span>·</span>
            <span>{RARITY_LABEL_KO[card.rarity]} 등급</span>
            {card.race && RACE_KO[card.race] && (
              <>
                <span>·</span>
                <span className="font-extrabold text-[#7c2d12]">{RACE_KO[card.race]}</span>
              </>
            )}
            {isGolden && (
              <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-extrabold text-stone-950">
                황금
              </span>
            )}
          </div>

          {/* Large Readable Nanum Gothic Card Ability Text */}
          <div className="mt-2 rounded-xl border border-[#b9965b]/55 bg-[#fffbf0] px-3 py-2 text-center text-[14px] font-bold leading-relaxed text-[#1a0f06] sm:text-[15px]">
            {cleanHtml ? (
              <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
            ) : (
              <span className="text-xs font-bold text-[#6e5032]">
                특수 능력 없음 (기본 공격력·생명력 전투 하수인)
              </span>
            )}
          </div>

          {/* Live Battlefield Status Pills (if inspecting a board minion) */}
          {liveStats?.statuses && liveStats.statuses.length > 0 && (
            <div className="mt-1.5 flex flex-wrap justify-center gap-1">
              {liveStats.statuses.map((st, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-[#8b6532] bg-[#36200f] px-2 py-0.5 text-[10.5px] font-extrabold text-amber-200"
                >
                  {st}
                </span>
              ))}
            </div>
          )}

          {/* Optional Collection Flavor Text */}
          {showFlavor && card.flavor && (
            <p className="mt-1.5 text-center text-[11px] font-bold leading-snug text-[#5c3d1e]">
              “{card.flavor.replace(/<[^>]+>/g, '')}”
            </p>
          )}
        </div>

        {/* Bottom Primary Use / Confirm Action Button */}
        {primaryAction && (
          <button
            type="button"
            disabled={primaryAction.disabled}
            onClick={primaryAction.onClick}
            className={`mt-2.5 flex min-h-[48px] w-full items-center justify-center rounded-2xl px-4 py-2.5 text-base font-extrabold tracking-wide transition ${renderBtnClass(
              primaryAction.variant,
              primaryAction.disabled,
            )}`}
          >
            {primaryAction.label}
          </button>
        )}

        {/* Secondary Action Row (Crafting, Deck Remove, Positional Drop, etc.) */}
        {secondaryActions.length > 0 && (
          <div className="mt-2 flex w-full flex-wrap gap-1.5">
            {secondaryActions.map((act, idx) => (
              <button
                key={idx}
                type="button"
                disabled={act.disabled}
                onClick={act.onClick}
                className={`flex min-h-[42px] flex-1 items-center justify-center rounded-xl px-2.5 py-1.5 text-xs font-extrabold transition ${renderBtnClass(
                  act.variant || 'brass',
                  act.disabled,
                )}`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 text-center text-[11px] font-bold text-amber-200/80">
          바깥 영역을 터치하면 카드 선택이 취소됩니다
        </div>
      </div>
    </div>
  );
};
