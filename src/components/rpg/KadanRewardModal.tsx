import React from 'react';
import { Gift, Sparkles } from 'lucide-react';
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
  <div className="absolute inset-0 z-40 flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-xs md:items-center">
    <div className="w-full max-w-md rounded-lg border border-slate-100 bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Gift size={24} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-amber-600">{t('kadan_rpg_reward_found', language)}</p>
          <h3 className="text-lg font-extrabold text-slate-900">{t(reward.titleKey, language)}</h3>
        </div>
      </div>
      <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700">
        <p className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-500" />
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
      <div className="mt-5 flex justify-end gap-2">
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
