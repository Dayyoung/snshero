import React from 'react';
import { Gift, Heart, Sparkles, Utensils, Zap, Footprints } from 'lucide-react';
import type { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import type { HeroCareAction, HeroCareRecord, HeroCareRewardStatus } from '../hooks/useHeroCare';
import { cn } from '../lib/utils';

interface HeroCarePanelProps {
  card: CardData;
  careState: HeroCareRecord;
  rewardStatus: HeroCareRewardStatus;
  language: Language;
  lowSpecMode?: boolean;
  onAction: (action: HeroCareAction) => void;
  onClaimReward: () => void;
}

const ACTIONS: Array<{ action: HeroCareAction; icon: React.ComponentType<{ size?: number; className?: string }>; titleKey: string; descKey: string; }> = [
  { action: 'feed', icon: Utensils, titleKey: 'hero_care_action_feed', descKey: 'hero_care_action_feed_desc' },
  { action: 'train', icon: Zap, titleKey: 'hero_care_action_train', descKey: 'hero_care_action_train_desc' },
  { action: 'play', icon: Heart, titleKey: 'hero_care_action_play', descKey: 'hero_care_action_play_desc' },
  { action: 'rest', icon: Footprints, titleKey: 'hero_care_action_rest', descKey: 'hero_care_action_rest_desc' },
];

const getMeterTone = (value: number): string => {
  if (value >= 70) return 'from-emerald-400 to-teal-500';
  if (value >= 40) return 'from-amber-400 to-orange-500';
  return 'from-rose-400 to-pink-500';
};

const getStatusKey = (careState: HeroCareRecord): string => {
  if (careState.hunger < 35) return 'hero_care_status_hungry';
  if (careState.energy < 35) return 'hero_care_status_tired';
  if (careState.mood < 40) return 'hero_care_status_lonely';
  if (careState.training > 75 && careState.energy > 45) return 'hero_care_status_focused';
  return 'hero_care_status_balanced';
};

const getGrowthFocusKey = (careState: HeroCareRecord): string => {
  const counts = careState.actionCounts;
  const entries = Object.entries(counts) as Array<[keyof typeof counts, number]>;
  const [focusAction, focusCount] = entries.reduce((best, current) => (
    current[1] > best[1] ? current : best
  ), entries[0]);

  if (focusCount <= 0) {
    return 'hero_care_focus_balanced';
  }

  switch (focusAction) {
    case 'feed':
      return 'hero_care_focus_support';
    case 'train':
      return 'hero_care_focus_drive';
    case 'play':
      return 'hero_care_focus_charm';
    case 'rest':
      return 'hero_care_focus_recovery';
    default:
      return 'hero_care_focus_balanced';
  }
};

const getMemoryLabelKey = (action: HeroCareRecord['memoryEntries'][number]['action']): string => {
  switch (action) {
    case 'feed':
      return 'hero_care_memory_feed';
    case 'train':
      return 'hero_care_memory_train';
    case 'play':
      return 'hero_care_memory_play';
    case 'rest':
      return 'hero_care_memory_rest';
    default:
      return 'hero_care_memory_play';
  }
};

export const HeroCarePanel: React.FC<HeroCarePanelProps> = ({
  card,
  careState,
  rewardStatus,
  language,
  lowSpecMode = false,
  onAction,
  onClaimReward,
}) => {
  const statusKey = getStatusKey(careState);
  const growthFocusKey = getGrowthFocusKey(careState);
  const cardName = card.customName || card.title_dis || card.title || card.title_en || `#${card.imageIndex ?? '-'}`;

  return (
    <div className="space-y-4 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-violet-700">
            <Sparkles size={12} className={cn(!lowSpecMode && 'animate-pulse')} />
            {t('hero_care_badge', language)}
          </div>
          <h4 className="text-sm font-black uppercase tracking-wide text-slate-900">
            {t('hero_care_title', language)}
          </h4>
          <p className="text-[11px] font-semibold leading-relaxed text-slate-600">
            {t('hero_care_desc', language, { name: cardName })}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-white/90 px-3 py-2 text-right shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500">
            {t('hero_care_affinity_label', language)}
          </div>
          <div className="mt-1 text-2xl font-black italic text-violet-700">
            {careState.affinity}
          </div>
          <div className="text-[10px] font-semibold text-slate-500">
            {t(statusKey, language)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { key: 'hero_care_stat_hunger', value: careState.hunger },
          { key: 'hero_care_stat_mood', value: careState.mood },
          { key: 'hero_care_stat_training', value: careState.training },
          { key: 'hero_care_stat_energy', value: careState.energy },
        ].map((stat) => (
          <div key={stat.key} className="rounded-2xl border border-white/70 bg-white/85 p-3 shadow-xs">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <span>{t(stat.key, language)}</span>
              <span>{stat.value}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', getMeterTone(stat.value), !lowSpecMode && stat.value < 35 && 'animate-pulse')}
                style={{ width: `${stat.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="rounded-2xl border border-violet-200 bg-white/90 p-3 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500">
            {t('hero_care_focus_title', language)}
          </div>
          <div className="mt-2 text-sm font-black text-slate-900">
            {t(growthFocusKey, language)}
          </div>
          <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
            {t('hero_care_focus_desc', language)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {t('hero_care_memory_title', language)}
          </div>
          {careState.memoryEntries.length === 0 ? (
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-slate-500">
              {t('hero_care_memory_empty', language)}
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {careState.memoryEntries.slice(0, 4).map((entry) => (
                <span
                  key={`${entry.action}-${entry.createdAt}`}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700"
                >
                  {t(getMemoryLabelKey(entry.action), language)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {ACTIONS.map(({ action, icon: Icon, titleKey, descKey }) => (
          <button
            key={action}
            type="button"
            onClick={() => onAction(action)}
            className="flex min-h-11 items-start gap-3 rounded-2xl border border-violet-100 bg-white px-3 py-3 text-left transition-all hover:border-violet-300 hover:bg-violet-50 active:scale-[0.99]"
          >
            <div className="mt-0.5 rounded-xl bg-violet-100 p-2 text-violet-700">
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-900">
                {t(titleKey, language)}
              </div>
              <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">
                {t(descKey, language)}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
            <Gift size={13} />
            {t('hero_care_reward_title', language)}
          </div>
          <p className="mt-2 text-[11px] font-semibold leading-relaxed text-amber-950/80">
            {rewardStatus.ready && rewardStatus.current
              ? t('hero_care_reward_ready', language, {
                  amount: rewardStatus.current.snsReward,
                  affinity: rewardStatus.current.affinityRequired,
                })
              : rewardStatus.next
                ? t('hero_care_reward_next', language, {
                    amount: rewardStatus.next.snsReward,
                    affinity: rewardStatus.next.affinityRequired,
                  })
                : t('hero_care_reward_complete', language)}
          </p>
          <button
            type="button"
            onClick={onClaimReward}
            disabled={!rewardStatus.ready}
            className={cn(
              'mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all',
              rewardStatus.ready
                ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 active:scale-[0.99]'
                : 'cursor-not-allowed bg-white/80 text-slate-400 ring-1 ring-slate-200',
            )}
          >
            <Gift size={14} />
            {t('hero_care_reward_claim', language)}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {t('hero_care_memento_title', language)}
          </div>
          {careState.unlockedCosmetics.length === 0 ? (
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-slate-500">
              {t('hero_care_memento_empty', language)}
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {careState.unlockedCosmetics.map((cosmeticKey) => (
                <span
                  key={cosmeticKey}
                  className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white"
                >
                  {t('hero_care_memento_badge', language, { key: cosmeticKey.replaceAll('-', ' ') })}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
