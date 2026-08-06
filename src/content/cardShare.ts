import { CARD_DATABASE } from '../cardDatabase';
import { t } from '../lib/i18n';
import type { Language } from '../types';
import { getCharacterIpProfile, getFactionDef, getMarketingTags } from './characterIpUtils';

export interface CardShareTemplate {
  intro: string;
  caption: string;
  hashtags: string[];
}

const normalizeTag = (value: string): string => value.replace(/\s+/g, '');

const getCardDisplayName = (cardId: number, language: Language): string => {
  const card = CARD_DATABASE[cardId];
  if (!card) return language === 'ko' ? `카드 ${cardId}` : `Card ${cardId}`;
  return language === 'ko' ? card.title : card.title_dis;
};

export function buildCardShareTemplate(cardId: number, language: Language): CardShareTemplate {
  const profile = getCharacterIpProfile(cardId);
  const card = CARD_DATABASE[cardId];

  if (!profile || !card) {
    const fallbackName = getCardDisplayName(cardId, language);
    const intro = fallbackName;
    const hashtags = ['#SNSHero', '#CardCodex', `#${normalizeTag(fallbackName)}`];
    return {
      intro,
      caption: [intro, hashtags.join(' ')].join('\n'),
      hashtags,
    };
  }

  const displayName = getCardDisplayName(cardId, language);
  const factionDef = getFactionDef(profile.faction);
  const factionLabel = factionDef ? t(factionDef.nameKey, language) : profile.faction;
  const rarityLabel = t(`rarity_${profile.rarityTier}`, language);
  const signatureLine = t(profile.signatureLineKey, language);
  const marketingTags = getMarketingTags(cardId).slice(0, 3);

  const hashtags = [
    '#SNSHero',
    '#CardCodex',
    `#${normalizeTag(displayName)}`,
    `#${normalizeTag(factionLabel)}`,
    `#${normalizeTag(rarityLabel)}`,
    ...marketingTags.map((tag) => `#${normalizeTag(tag)}`),
  ];

  const intro = [displayName, factionLabel, rarityLabel].filter(Boolean).join(' · ');
  const caption = [intro, signatureLine, hashtags.join(' ')].filter(Boolean).join('\n');

  return {
    intro,
    caption,
    hashtags,
  };
}
