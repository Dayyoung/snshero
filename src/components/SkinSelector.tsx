import React from 'react';
import { motion } from 'motion/react';
import { Check, Lock, Sparkles, ShoppingBag, Trophy, Gift, Star, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';
import type { Language, CharacterRarityTier } from '../types';
import type { CardSkin, SkinUnlockType } from '../content/cardSkins';
import { getUnlockTypeLabelKey } from '../content/cardSkins';

interface SkinSelectorProps {
  cardId: number;
  season: string;
  language: Language;
  lowSpecMode: boolean;
  /** 해당 카드에 사용 가능한 모든 스킨 */
  availableSkins: CardSkin[];
  /** 스킨 보유 여부 확인 */
  isSkinUnlocked: (skinKey: string) => boolean;
  /** 스킨 적용 여부 확인 */
  isSkinActive: (cardId: number, skinKey: string) => boolean;
  /** 스킨 장착 */
  onApplySkin: (cardId: number, skinKey: string) => void;
  /** 스킨 해제 */
  onRemoveSkin: (cardId: number) => void;
}

const unlockIconMap: Record<SkinUnlockType, React.ComponentType<{ size?: number; className?: string }>> = {
  'default': Gift,
  'season-pass': Star,
  'achievement': Trophy,
  'shop': ShoppingBag,
  'event': Sparkles,
  'mission': Trophy,
  'secret': HelpCircle,
};

const rarityBorderClass = (rarity: CharacterRarityTier): string => {
  switch (rarity) {
    case 'diamond':
      return 'border-cyan-300 bg-gradient-to-br from-cyan-950 via-sky-900 to-fuchsia-950';
    case 'platinum':
      return 'border-sky-200 bg-gradient-to-br from-slate-900 via-slate-700 to-sky-950';
    case 'legendary':
      return 'border-purple-400 bg-gradient-to-br from-purple-950 via-violet-900 to-slate-900';
    case 'gold':
      return 'border-amber-400 bg-gradient-to-br from-amber-950 via-yellow-900 to-slate-900';
    case 'silver':
      return 'border-slate-400 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900';
    case 'bronze':
    default:
      return 'border-orange-500 bg-gradient-to-br from-orange-950 via-amber-900 to-slate-900';
  }
};

const rarityGlowClass = (rarity: CharacterRarityTier): string => {
  switch (rarity) {
    case 'diamond':
      return 'shadow-cyan-400/30';
    case 'platinum':
      return 'shadow-sky-200/25';
    case 'legendary':
      return 'shadow-purple-500/30';
    case 'gold':
      return 'shadow-amber-400/25';
    case 'silver':
      return 'shadow-slate-300/20';
    case 'bronze':
    default:
      return 'shadow-orange-500/20';
  }
};

export const SkinSelector: React.FC<SkinSelectorProps> = ({
  cardId,
  season: _season,
  language,
  lowSpecMode,
  availableSkins,
  isSkinUnlocked,
  isSkinActive,
  onApplySkin,
  onRemoveSkin,
}) => {
  if (availableSkins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Sparkles size={32} className="text-slate-300 mb-2" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {t('skin_no_skins_available', language)}
        </p>
      </div>
    );
  }

  const containerMotion = lowSpecMode
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } };

  return (
    <motion.div {...containerMotion} className="space-y-4">
      {/* Horizontal scroll: skin thumbnails */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex gap-3 min-w-max px-1">
          {availableSkins.map((skin) => {
            const unlocked = isSkinUnlocked(skin.skinKey);
            const active = isSkinActive(cardId, skin.skinKey);
            const UnlockIcon = unlockIconMap[skin.unlockType] ?? HelpCircle;

            return (
              <div
                key={skin.skinKey}
                className={cn(
                  'relative flex flex-col items-center gap-2 shrink-0',
                )}
              >
                {/* Skin thumbnail card */}
                <button
                  type="button"
                  onClick={() => {
                    if (unlocked) {
                      if (active) {
                        onRemoveSkin(cardId);
                      } else {
                        onApplySkin(cardId, skin.skinKey);
                      }
                    }
                  }}
                  disabled={!unlocked}
                  className={cn(
                    'group relative w-[100px] h-[140px] rounded-lg border-2 overflow-hidden transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                    unlocked
                      ? 'cursor-pointer hover:scale-105 hover:shadow-lg active:scale-95'
                      : 'cursor-not-allowed opacity-70',
                    active
                      ? 'border-indigo-400 ring-2 ring-indigo-300 shadow-lg shadow-indigo-200/50'
                      : unlocked
                        ? rarityBorderClass(skin.rarityTier)
                        : 'border-slate-600 bg-slate-800',
                    rarityGlowClass(skin.rarityTier),
                  )}
                  style={{ minHeight: '140px' }}
                  aria-label={t(skin.nameKey, language)}
                >
                  {/* Skin preview area */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center p-2"
                    style={{
                      background: unlocked
                        ? `linear-gradient(135deg, ${skin.fallbackPrimaryColor}22 0%, ${skin.fallbackAccentColor}44 100%)`
                        : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    }}
                  >
                    {/* Fallback representation: gradient circle with emoji */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-1.5"
                      style={{
                        background: unlocked
                          ? `linear-gradient(135deg, ${skin.fallbackPrimaryColor} 0%, ${skin.fallbackAccentColor} 100%)`
                          : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        boxShadow: unlocked
                          ? `0 0 12px ${skin.fallbackAccentColor}55`
                          : 'none',
                      }}
                    >
                      <span className="text-lg">{skin.fallbackEmoji}</span>
                    </div>
                    <span
                      className={cn(
                        'text-[9px] font-black text-center leading-tight px-1 line-clamp-2',
                        unlocked ? 'text-white' : 'text-slate-400',
                      )}
                    >
                      {t(skin.nameKey, language)}
                    </span>
                  </div>

                  {/* Rarity badge top-left */}
                  <div
                    className={cn(
                      'absolute top-1.5 left-1.5 rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider border',
                      skin.rarityTier === 'diamond' && 'bg-cyan-300/90 text-slate-950 border-white/80',
                      skin.rarityTier === 'platinum' && 'bg-slate-200/90 text-slate-900 border-sky-100',
                      skin.rarityTier === 'legendary' && 'bg-purple-500/80 text-white border-purple-300',
                      skin.rarityTier === 'gold' && 'bg-amber-500/80 text-amber-950 border-amber-300',
                      skin.rarityTier === 'silver' && 'bg-slate-400/80 text-white border-slate-300',
                      skin.rarityTier === 'bronze' && 'bg-orange-500/80 text-white border-orange-300',
                    )}
                  >
                    {skin.rarityTier}
                  </div>

                  {/* Active checkmark */}
                  {active && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-md">
                      <Check size={12} className="text-white" />
                    </div>
                  )}

                  {/* Lock overlay */}
                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-[1px]">
                      <div className="flex flex-col items-center gap-1">
                        <Lock size={20} className="text-slate-400" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                          {t('skin_locked', language)}
                        </span>
                      </div>
                    </div>
                  )}
                </button>

                {/* Action button / unlock info */}
                <div className="flex flex-col items-center gap-1 w-full max-w-[100px]">
                  {unlocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (active) {
                          onRemoveSkin(cardId);
                        } else {
                          onApplySkin(cardId, skin.skinKey);
                        }
                      }}
                      className={cn(
                        'w-full min-h-[36px] rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 border',
                        active
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700 hover:bg-indigo-200'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
                      )}
                    >
                      {active ? t('skin_applied', language) : t('skin_apply', language)}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-[8px] font-semibold text-slate-400">
                      <UnlockIcon size={10} className="shrink-0" />
                      <span className="truncate">{t(getUnlockTypeLabelKey(skin.unlockType), language)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected skin info */}
      {(() => {
        const activeSkin = availableSkins.find((s) => isSkinActive(cardId, s.skinKey));
        if (!activeSkin) return null;

        return (
          <div
            className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3"
            style={{
              background: `linear-gradient(135deg, ${activeSkin.fallbackPrimaryColor}11 0%, ${activeSkin.fallbackAccentColor}22 100%)`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Check size={14} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                {t('skin_currently_applied', language)}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-600 leading-snug">
              {t(activeSkin.descKey, language)}
            </p>
          </div>
        );
      })()}

      {/* Unlock condition hint for selected locked skin */}
      {(() => {
        const firstLocked = availableSkins.find((s) => !isSkinUnlocked(s.skinKey));
        if (!firstLocked) return null;

        return (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <Lock size={12} />
              <span>{t('skin_how_to_unlock', language)}</span>
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-slate-600 leading-snug">
              {t(firstLocked.unlockConditionKey, language)}
            </p>
          </div>
        );
      })()}
    </motion.div>
  );
};
