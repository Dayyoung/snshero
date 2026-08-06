import React, { useMemo } from 'react';
import { X, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn, getFormattedCardName } from '../lib/utils';
import { t } from '../lib/i18n';
import {
  GACHA_PACK_CONFIG,
  getGachaCardPoolGroups,
  formatProbabilityRate,
  type GachaPackRarity,
} from '../content/gachaRates';
import type { Language } from '../types';
import { PityGauge } from './PityGauge';

interface ProbabilityModalProps {
  isOpen: boolean;
  selectedPack: GachaPackRarity;
  onSelectPack: (packRarity: GachaPackRarity) => void;
  onClose: () => void;
  language: Language;
  lowSpecMode?: boolean;
  onNavigate?: (view: string) => void;
}

const PACK_TITLES: Record<GachaPackRarity, string> = {
  bronze: 'common_card_pack',
  silver: 'magic_card_pack',
  gold: 'rare_card_pack',
};

export const ProbabilityModal: React.FC<ProbabilityModalProps> = ({
  isOpen,
  selectedPack,
  onSelectPack,
  onClose,
  language,
  lowSpecMode = false,
  onNavigate,
}) => {
  const groups = useMemo(() => getGachaCardPoolGroups(), []);
  const config = GACHA_PACK_CONFIG[selectedPack];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={lowSpecMode ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="fixed inset-0 z-[230] flex items-center justify-center bg-black/70 backdrop-blur-lg p-3 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={lowSpecMode ? { y: 12, opacity: 0 } : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0d1117] text-white shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label={t('close', language)}
            >
              <X size={20} />
            </button>

            <div className="border-b border-white/10 px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-col gap-3 pr-10 sm:pr-14">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400/80">
                  <Sparkles size={14} />
                  <span>{t('shop_gacha_probability_title', language)}</span>
                </div>
                <h3 className="text-xl font-black tracking-tight sm:text-2xl">
                  {t('shop_gacha_probability_subtitle', language)}
                </h3>
                <p className="max-w-3xl text-xs leading-relaxed text-white/55 sm:text-sm">
                  {t('shop_gacha_server_validation_note', language)}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                {(Object.keys(PACK_TITLES) as GachaPackRarity[]).map((packRarity) => (
                  <button
                    key={packRarity}
                    type="button"
                    onClick={() => onSelectPack(packRarity)}
                    className={cn(
                      'rounded-2xl border px-3 py-3 text-left transition touch-target',
                      selectedPack === packRarity
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-200 shadow-[0_0_0_1px_rgba(250,204,21,0.2)]'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/45">
                      {t(PACK_TITLES[packRarity], language)}
                    </div>
                    <div className="mt-1 text-sm font-black tracking-tight">
                      {t(`rarity_${packRarity}` as const, language)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 px-5 py-5 sm:px-7 lg:grid-cols-[1.25fr_0.75fr] lg:gap-6 lg:py-7">
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                      {t('shop_gacha_pack_rates', language)}
                    </p>
                    <h4 className="mt-1 text-lg font-black tracking-tight text-white">
                      {t(PACK_TITLES[selectedPack], language)}
                    </h4>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white/55">
                    {t('shop_gacha_updated_at', language)} {config.updatedAt}
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-white/35 sm:px-5">
                    <span>{t('shop_gacha_rarity', language)}</span>
                    <span>{t('shop_gacha_rate', language)}</span>
                  </div>
                  {config.rates.map((row) => (
                    <div
                      key={row.rarity}
                      className="grid grid-cols-[1fr_auto] gap-2 border-b border-white/5 px-4 py-3 last:border-b-0 sm:px-5"
                    >
                      <span className="text-sm font-bold capitalize text-white/85">
                        {t(`rarity_${row.rarity}` as const, language)}
                      </span>
                      <span className="text-sm font-black text-yellow-300">
                        {formatProbabilityRate(row.rate)}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <PityGauge
                    packRarity={selectedPack}
                    language={language}
                    current={0}
                    remaining={config.pityThreshold}
                    threshold={config.pityThreshold}
                    guaranteeRarity={config.pityGuaranteeRarity}
                    updatedAt={config.updatedAt}
                    seasonLabel={null}
                    lowSpecMode={lowSpecMode}
                    standalone
                  />
                </div>
              </section>

              <aside className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                    {t('shop_gacha_included_cards', language)}
                  </p>
                  <h4 className="mt-1 text-lg font-black tracking-tight text-white">
                    {t(PACK_TITLES[selectedPack], language)}
                  </h4>
                </div>

                <div className="space-y-3">
                  {groups.map((group) => (
                    <details
                      key={group.rarity}
                      className="group rounded-2xl border border-white/10 bg-black/20 open:bg-black/30"
                      open={group.rarity === selectedPack}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white/70">
                        <span>{t(`rarity_${group.rarity}` as const, language)}</span>
                        <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] tracking-[0.25em] text-white/45">
                          {group.cards.length}
                        </span>
                      </summary>
                      <div className="border-t border-white/10 px-4 py-4">
                        <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                          {group.cards.map((card) => (
                            <div
                              key={card.id}
                              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80"
                            >
                              {getFormattedCardName(card, language)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>

                <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-xs leading-relaxed text-yellow-50/90">
                  <div className="mb-2 flex items-center gap-2 font-black uppercase tracking-[0.25em] text-yellow-300">
                    <ShieldAlert size={14} />
                    {t('shop_gacha_policy_title', language)}
                  </div>
                  <p>{t('shop_gacha_policy_body', language)}</p>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('policy-center')}
                      className="mt-3 w-full py-2 px-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-300 hover:bg-yellow-400/20 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={12} />
                      {language === 'ko' ? '신뢰 센터에서 전체 정책 보기' : 'View Full Policies in Trust Center'}
                    </button>
                  )}
                  <details className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-[0.25em] text-white/70">
                      {t('shop_gacha_policy_more', language)}
                    </summary>
                    <div className="mt-2 space-y-2 text-white/60">
                      <p>{t('shop_gacha_policy_item_1', language)}</p>
                      <p>{t('shop_gacha_policy_item_2', language)}</p>
                      <p>{t('shop_gacha_policy_item_3', language)}</p>
                    </div>
                  </details>
                </div>
              </aside>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
