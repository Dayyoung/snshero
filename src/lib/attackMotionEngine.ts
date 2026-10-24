import { CARD_DATABASE } from '../cardDatabase';
import { CHARACTER_IP_PROFILES } from '../content/characterIp';
import type { CharacterAnimationProfile, CharacterFaction } from '../types';
import { getAssetUrl } from './utils';

export type AttackAnimationType = CharacterAnimationProfile['attackAnimation'];

export interface CharacterAttackMotionMeta {
  cardId: number;
  titleKo: string;
  titleEn: string;
  faction: CharacterFaction;
  attackAnimation: AttackAnimationType;
  /** High-resolution 256x296 RGBA attack motion cutout */
  cutoutAttackUrl: string;
  /** WebP animation asset path */
  webpAttackUrl: string;
  /** Sprite sheet URL for 10x10 board sprite rendering (/cards1_attack.png or /cards2_attack.png) */
  spriteSheetAttackUrl: string;
  /** Signature attack move title (Korean) */
  moveNameKo: string;
  /** Signature attack move title (English) */
  moveNameEn: string;
  /** Action badge label (e.g., SLASH / BLAST / STRIKE / BURST / SPIN / CHARGE) */
  actionTag: string;
  primaryHex: string;
  accentHex: string;
  glowRgba: string;
}

const FACTION_ATTACK_COLORS: Record<
  CharacterFaction,
  { primaryHex: string; accentHex: string; glowRgba: string; prefixKo: string; prefixEn: string }
> = {
  water: {
    primaryHex: '#0284c7',
    accentHex: '#38bdf8',
    glowRgba: 'rgba(56, 189, 248, 0.72)',
    prefixKo: '해류',
    prefixEn: 'HYDRO',
  },
  fire: {
    primaryHex: '#dc2626',
    accentHex: '#fb923c',
    glowRgba: 'rgba(249, 115, 22, 0.75)',
    prefixKo: '홍련',
    prefixEn: 'INFERNO',
  },
  wind: {
    primaryHex: '#0d9488',
    accentHex: '#2dd4bf',
    glowRgba: 'rgba(45, 212, 191, 0.72)',
    prefixKo: '질풍',
    prefixEn: 'TEMPEST',
  },
  earth: {
    primaryHex: '#65a30d',
    accentHex: '#facc15',
    glowRgba: 'rgba(163, 230, 53, 0.72)',
    prefixKo: '대지',
    prefixEn: 'SEISMIC',
  },
  human: {
    primaryHex: '#2563eb',
    accentHex: '#facc15',
    glowRgba: 'rgba(250, 204, 21, 0.72)',
    prefixKo: '성검',
    prefixEn: 'ROYAL',
  },
  undead: {
    primaryHex: '#7c3aed',
    accentHex: '#c084fc',
    glowRgba: 'rgba(192, 132, 252, 0.75)',
    prefixKo: '명계',
    prefixEn: 'ABYSS',
  },
  elf: {
    primaryHex: '#16a34a',
    accentHex: '#4ade80',
    glowRgba: 'rgba(74, 222, 128, 0.72)',
    prefixKo: '월광',
    prefixEn: 'SYLVAN',
  },
  dwarf: {
    primaryHex: '#d97706',
    accentHex: '#fde047',
    glowRgba: 'rgba(245, 158, 11, 0.75)',
    prefixKo: '용광',
    prefixEn: 'FORGE',
  },
  monster: {
    primaryHex: '#e11d48',
    accentHex: '#fb7185',
    glowRgba: 'rgba(244, 63, 94, 0.75)',
    prefixKo: '야수',
    prefixEn: 'SAVAGE',
  },
  robot: {
    primaryHex: '#2563eb',
    accentHex: '#22d3ee',
    glowRgba: 'rgba(34, 211, 238, 0.75)',
    prefixKo: '플라즈마',
    prefixEn: 'PLASMA',
  },
  dragon: {
    primaryHex: '#dc2626',
    accentHex: '#facc15',
    glowRgba: 'rgba(239, 68, 68, 0.78)',
    prefixKo: '용염',
    prefixEn: 'DRACONIC',
  },
};

const ATTACK_TYPE_SUFFIX: Record<
  AttackAnimationType,
  { ko: string; en: string; tag: string }
> = {
  slash: { ko: '섬광참', en: 'BLADE SLASH', tag: '⚔️ SLASH' },
  blast: { ko: '파동포', en: 'NOVA BLAST', tag: '🔥 BLAST' },
  strike: { ko: '분쇄격', en: 'CRUSH STRIKE', tag: '💥 STRIKE' },
  burst: { ko: '각성폭발', en: 'AURA BURST', tag: '⚡ BURST' },
  spin: { ko: '회전열풍', en: 'VORTEX SPIN', tag: '🌪️ SPIN' },
  charge: { ko: '전광돌격', en: 'SONIC CHARGE', tag: '🚀 CHARGE' },
};

function resolveSeatFilename(cardId: number): string {
  const db = CARD_DATABASE[cardId];
  if (!db) return 'Kadan.png';
  // Card 70 has title_en 'Aila' and title_dis 'Aila the Demon Hunter'
  if (cardId === 70) return 'Aila.png';
  const baseName = (db.title_en || db.title_dis || 'Kadan').replace(/\s+/g, '_');
  return `${baseName}.png`;
}

export function getAttackSpriteAsset(cardId: number): string {
  const validId = Number(cardId) || 1;
  return validId >= 101 ? '/cards2_attack.png' : '/cards1_attack.png';
}

export function getCharacterAttackMotionMeta(cardId: number): CharacterAttackMotionMeta {
  const validId = Math.max(1, Math.min(110, Number(cardId) || 1));
  const db = CARD_DATABASE[validId];
  const ip = CHARACTER_IP_PROFILES[validId];

  const faction: CharacterFaction =
    ip?.faction ||
    (validId <= 10
      ? 'water'
      : validId <= 20
      ? 'fire'
      : validId <= 30
      ? 'wind'
      : validId <= 40
      ? 'earth'
      : validId <= 50
      ? 'human'
      : validId <= 60
      ? 'undead'
      : validId <= 70
      ? 'elf'
      : validId <= 80
      ? 'dwarf'
      : validId <= 90
      ? 'monster'
      : validId <= 100
      ? 'robot'
      : 'dragon');

  const attackAnimation: AttackAnimationType =
    ip?.animationProfile?.attackAnimation ||
    (['slash', 'blast', 'strike', 'burst', 'spin', 'charge'][(validId - 1) % 6] as AttackAnimationType);

  const fColor = FACTION_ATTACK_COLORS[faction] || FACTION_ATTACK_COLORS.human;
  const aSuffix = ATTACK_TYPE_SUFFIX[attackAnimation] || ATTACK_TYPE_SUFFIX.slash;
  const seatFile = resolveSeatFilename(validId);
  const padded = String(validId).padStart(3, '0');

  const titleKo = db?.title || `영웅 #${validId}`;
  const titleEn = db?.title_dis || db?.title_en || `Hero #${validId}`;

  return {
    cardId: validId,
    titleKo,
    titleEn,
    faction,
    attackAnimation,
    cutoutAttackUrl: getAssetUrl(`/seat_attack/${seatFile}`),
    webpAttackUrl: getAssetUrl(`/characters/animations/card-${padded}.webp`),
    spriteSheetAttackUrl: getAssetUrl(getAttackSpriteAsset(validId)),
    moveNameKo: `${titleKo} · ${fColor.prefixKo}${aSuffix.ko}`,
    moveNameEn: `${titleEn} · ${fColor.prefixEn} ${aSuffix.en}`,
    actionTag: aSuffix.tag,
    primaryHex: fColor.primaryHex,
    accentHex: fColor.accentHex,
    glowRgba: fColor.glowRgba,
  };
}

// Pre-built lookup table for all 110 characters
export const CHARACTER_ATTACK_MOTION_MAP: Record<number, CharacterAttackMotionMeta> = Object.fromEntries(
  Array.from({ length: 110 }, (_, idx) => {
    const id = idx + 1;
    return [id, getCharacterAttackMotionMeta(id)];
  })
) as Record<number, CharacterAttackMotionMeta>;
