import type { CardData } from '../types';
import { getCharacterIpProfile } from '../content/characterIpUtils';

export const MONSTER_PET_STORAGE_BASE_KEY = 'hero_monster_pet';

const ELIGIBLE_GROUPS = ['monster', 'dragon'] as const;

export type MonsterPetGroup = (typeof ELIGIBLE_GROUPS)[number];

const normalizeToken = (value: string | undefined | null): string => (
  typeof value === 'string' ? value.trim().toLowerCase() : ''
);

const hasEligibleKeyword = (value: string): MonsterPetGroup | null => {
  if (!value) return null;
  if (value.includes('dragon')) return 'dragon';
  if (value.includes('monster')) return 'monster';
  return null;
};

export const getMonsterPetGroup = (card: CardData | null | undefined): MonsterPetGroup | null => {
  if (!card) return null;

  const profile = typeof card.imageIndex === 'number' ? getCharacterIpProfile(card.imageIndex) : undefined;
  const directFaction = normalizeToken(profile?.faction);
  if (directFaction === 'dragon' || directFaction === 'monster') {
    return directFaction;
  }

  const directElement = normalizeToken(card.element);
  if (directElement === 'dragon' || directElement === 'monster') {
    return directElement;
  }

  const directRace = normalizeToken(card.race);
  if (directRace === 'dragon' || directRace === 'monster') {
    return directRace;
  }

  return (
    hasEligibleKeyword(normalizeToken(card.title_en))
    ?? hasEligibleKeyword(normalizeToken(card.title))
    ?? hasEligibleKeyword(normalizeToken(card.title_dis))
  );
};

export const isMonsterPetCandidate = (card: CardData | null | undefined): boolean => (
  getMonsterPetGroup(card) !== null
);

export const parseCardAvatarId = (avatar: string | null | undefined): number | null => {
  if (typeof avatar !== 'string' || !avatar.startsWith('card:')) {
    return null;
  }

  const rawId = Number(avatar.split(':')[1]);
  return Number.isFinite(rawId) && rawId > 0 ? rawId : null;
};
