import React from 'react';
import { Gift, Sparkles, X } from 'lucide-react';
import { t } from '../../lib/i18n';
import { CARD_DATABASE } from '../../cardDatabase';
import type { Language } from '../../types';
import type { KadanRpgReward } from '../../content/kadanRpgStory';

interface KadanRewardModalProps {
  reward: KadanRpgReward;
  language: Language;
  onClaim: () => void;
  onClose: () => void;
}

export const KadanRewardModal: React.FC<KadanRewardModalProps> = ({
  reward,
  language,
  onClaim,
  onClose,
}) => (
  <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-slate-950/70 p-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-xs">
    <div className="relative flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-slate-100 bg-white p-4 sm:p-5 shadow-2xl">
      {/* Top right close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('kadan_rpg_close', language)}
        className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
      >
        <X size={16} />
      </button>

      <div className="mb-3 flex shrink-0 items-center gap-3 pr-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Gift size={24} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-amber-600">{t('kadan_rpg_reward_found', language)}</p>
          <h3 className="text-lg font-extrabold text-slate-900">{t(reward.titleKey, language)}</h3>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700 pr-2">
        <p className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-500 shrink-0" />
          {t('kadan_rpg_reward_sns', language, { amount: reward.sns })}
        </p>
        {reward.itemRarity && (
          <p>{t('kadan_rpg_reward_item', language, { rarity: reward.itemRarity })}</p>
        )}
        {reward.cardIds.length > 0 && (
          <p>
            {t('kadan_rpg_reward_cards', language, {
              cards: reward.cardIds
                .map((cardId) => {
                  const card = CARD_DATABASE[cardId];
                  return language === 'ko' ? card?.title : card?.title_en;
                })
                .filter(Boolean)
                .join(', '),
            })}
          </p>
        )}
      </div>

      <div className="mt-4 flex shrink-0 justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition-all active:scale-95"
        >
          {t('kadan_rpg_close', language)}
        </button>
        <button
          type="button"
          onClick={onClaim}
          className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/10 transition-all active:scale-95"
        >
          {t('kadan_rpg_claim_reward', language)}
        </button>
      </div>
    </div>
  </div>
);

