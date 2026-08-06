import React, { useMemo, useState } from 'react';
import { ChevronDown, Clock3, ShieldAlert, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';
import { type GachaOutcomeRarity, type GachaPackRarity } from '../content/gachaRates';
import type { Language } from '../types';

interface PityGaugeProps {
  packRarity: GachaPackRarity;
  language: Language;
  current: number;
  remaining: number;
  threshold: number;
  guaranteeRarity: Exclude<GachaOutcomeRarity, 'bronze'>;
  updatedAt: string;
  seasonLabel?: string | null;
  lowSpecMode?: boolean;
  standalone?: boolean;
  variant?: 'dark' | 'light';
}

const PACK_BADGE_LIGHT: Record<GachaPackRarity, string> = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-slate-100 text-slate-700 border-slate-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const PACK_BADGE_DARK: Record<GachaPackRarity, string> = {
  bronze: 'bg-amber-500/15 text-amber-200 border-amber-400/20',
  silver: 'bg-slate-300/15 text-slate-100 border-slate-200/20',
  gold: 'bg-yellow-400/15 text-yellow-200 border-yellow-300/20',
};

export const PityGauge: React.FC<PityGaugeProps> = ({
  packRarity,
  language,
  current,
  remaining,
  threshold,
  guaranteeRarity,
  updatedAt,
  seasonLabel,
  lowSpecMode = false,
  standalone = false,
  variant: variantProp,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isLight = variantProp === 'light' || (!standalone && variantProp !== 'dark');
  const badgeClass = isLight ? PACK_BADGE_LIGHT : PACK_BADGE_DARK;
  const textMuted = isLight ? 'text-slate-400' : 'text-white/40';
  const textMain = isLight ? 'text-slate-800' : 'text-white';
  const textDim = isLight ? 'text-slate-500' : 'text-white/55';
  const borderDim = isLight ? 'border-slate-200' : 'border-white/10';
  const bgCard = isLight ? 'bg-white' : 'bg-black/20';
  const bgBar = isLight ? 'bg-slate-200' : 'bg-white/10';
  const iconColor = isLight ? 'text-amber-500' : 'text-yellow-300';

  const progress = useMemo(() => {
    if (threshold <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((current / threshold) * 100)));
  }, [current, threshold]);

  const wrapperClassName = standalone
    ? 'space-y-3'
    : isLight
      ? 'rounded-2xl border border-slate-200 bg-slate-50/80 p-3'
      : 'rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-inner';

  return (
    <motion.div
      {...(lowSpecMode
        ? {}
        : {
            initial: { opacity: 0, y: 6 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.2 },
          })}
      className={wrapperClassName}
    >
      {/* Always visible: header + progress bar */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em]", textDim)}>
              <Sparkles size={12} className={iconColor} />
              <span>{t('shop_gacha_pity_title', language)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em]', badgeClass[packRarity])}>
                {t(`rarity_${packRarity}` as const, language)}
              </span>
              {seasonLabel && (
                <span className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em]",
                  isLight ? "border-slate-200 bg-slate-100 text-slate-500" : "border-white/10 bg-white/5 text-white/55"
                )}>
                  {seasonLabel}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <div className={cn("text-lg font-black tracking-tight", textMain)}>{current}/{threshold}</div>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className={textMuted}
            >
              <ChevronDown size={16} />
            </motion.div>
          </div>
        </div>

        <div className={cn("mt-2 h-2 overflow-hidden rounded-full", bgBar)}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              packRarity === 'bronze'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                : packRarity === 'silver'
                  ? 'bg-gradient-to-r from-slate-300 to-slate-500'
                  : 'bg-gradient-to-r from-yellow-300 to-amber-500',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </button>

      {/* Collapsible details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              <div className={cn("grid gap-2 text-xs sm:grid-cols-2", textDim)}>
                <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", borderDim, bgCard)}>
                  <Clock3 size={13} className={cn("shrink-0", iconColor)} />
                  <span>
                    {t('shop_gacha_pity_next_condition', language, {
                      rarity: t(`rarity_${guaranteeRarity}` as const, language),
                      threshold,
                    })}
                  </span>
                </div>
                <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", borderDim, bgCard)}>
                  <ShieldAlert size={13} className={cn("shrink-0", iconColor)} />
                  <span>{t('shop_gacha_pity_server_note', language)}</span>
                </div>
              </div>

              <div className={cn("text-[10px] leading-relaxed", textMuted)}>
                {t('shop_gacha_pity_remaining_short', language)} {remaining} · {t('shop_gacha_pity_scope_note', language)} · {t('shop_gacha_updated_at', language)} {updatedAt}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
