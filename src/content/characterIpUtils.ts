import type { CharacterFaction, CharacterIpProfile, CharacterRarityTier } from '../types';
import { CHARACTER_IP_PROFILES, CHARACTER_FACTIONS, CHARACTER_RARITY_RULES } from './characterIp';
import type { FactionDef, RarityRule } from './characterIp';
import { CARD_DATABASE } from '../cardDatabase';
import type { DatabaseCard } from '../types';

/** 카드 ID로 IP 프로필 조회 */
export function getCharacterIpProfile(cardId: number): CharacterIpProfile | undefined {
  return CHARACTER_IP_PROFILES[cardId];
}

/** 카드의 소속 세력 조회 */
export function getFactionByCard(card: DatabaseCard | { id: number }): CharacterFaction | undefined {
  const profile = CHARACTER_IP_PROFILES[card.id];
  return profile?.faction;
}

/** 카드 ID로 소속 세력 조회 */
export function getFactionById(cardId: number): CharacterFaction | undefined {
  return CHARACTER_IP_PROFILES[cardId]?.faction;
}

/** 세력 정의 조회 */
export function getFactionDef(faction: CharacterFaction): FactionDef | undefined {
  return CHARACTER_FACTIONS[faction];
}

/** 희귀도 규칙 조회 */
export function getRarityRule(rarity: CharacterRarityTier): RarityRule | undefined {
  return CHARACTER_RARITY_RULES[rarity];
}

/** 카드의 희귀도 규칙 조회 */
export function getRarityRuleByCard(card: DatabaseCard | { rarity?: string }): RarityRule | undefined {
  const rarity = card.rarity as CharacterRarityTier | undefined;
  if (!rarity) return undefined;
  return CHARACTER_RARITY_RULES[rarity];
}

/** 라이벌 카드 ID 목록 조회 */
export function getRivalIds(cardId: number): number[] {
  return CHARACTER_IP_PROFILES[cardId]?.rivalIds ?? [];
}

/** 동맹 카드 ID 목록 조회 */
export function getAllyIds(cardId: number): number[] {
  return CHARACTER_IP_PROFILES[cardId]?.allyIds ?? [];
}

/** 연관된 모든 캐릭터 카드 ID 조회 (라이벌 + 동맹 + 기타 관계) */
export function getRelatedCharacters(cardId: number): number[] {
  return CHARACTER_IP_PROFILES[cardId]?.relationshipIds ?? [];
}

/** 특정 세력에 속한 모든 카드 ID 조회 */
export function getCardsByFaction(faction: CharacterFaction): number[] {
  return Object.values(CHARACTER_IP_PROFILES)
    .filter((p) => p.faction === faction)
    .map((p) => p.cardId);
}

/** 카드 ID로 아트 생성 프롬프트 빌드 (ko/en 지원) */
export function buildCharacterArtPrompt(cardId: number, locale: 'ko' | 'en' = 'ko'): string {
  const profile = CHARACTER_IP_PROFILES[cardId];
  if (!profile) return '';

  const card = CARD_DATABASE[cardId];
  const factionDef = CHARACTER_FACTIONS[profile.faction];
  const rarityRule = CHARACTER_RARITY_RULES[profile.rarityTier];

  const parts: string[] = [];
  parts.push(`Character: ${card?.title ?? `Card #${cardId}`} (${card?.title_en ?? ''})`);
  parts.push(`Faction: ${profile.faction}, Rarity: ${profile.rarityTier}`);
  parts.push(`Archetype: ${profile.archetype}, Personality: ${profile.personality}`);
  if (factionDef) {
    parts.push(`Visual style: ${factionDef.visualKeywords.join(', ')}`);
    parts.push(`Colors: ${factionDef.primaryColor} / ${factionDef.accentColor}`);
  }
  if (rarityRule) {
    parts.push(`Frame: ${rarityRule.frameMaterial}, Light: ${rarityRule.lightEffect}`);
  }
  parts.push(`Pose: ${profile.artDirection.poseKeywords.join(', ')}`);
  parts.push(`Lighting: ${profile.artDirection.lightingStyle}, Camera: ${profile.artDirection.cameraAngle}`);

  return parts.join(' | ');
}

/** 카드의 저사양 모드 애니메이션 강도 조회 (0: off, 3: max) */
export function getAnimationIntensity(cardId: number): number {
  return CHARACTER_IP_PROFILES[cardId]?.animationProfile.animationIntensity ?? 0;
}

/** 저사양 모드에서 애니메이션을 비활성화해야 하는지 확인 */
export function isAnimationDisabledInLowSpec(cardId: number, lowSpecMode: boolean): boolean {
  if (!lowSpecMode) return false;
  return getAnimationIntensity(cardId) > 0;
}

/** 카드의 마케팅 태그 조회 */
export function getMarketingTags(cardId: number): string[] {
  return CHARACTER_IP_PROFILES[cardId]?.marketingTags ?? [];
}

/** 모든 세력 목록 조회 */
export function getAllFactions(): CharacterFaction[] {
  return Object.keys(CHARACTER_FACTIONS) as CharacterFaction[];
}

/** 모든 희귀도 등급 목록 조회 */
export function getAllRarityTiers(): CharacterRarityTier[] {
  return Object.keys(CHARACTER_RARITY_RULES) as CharacterRarityTier[];
}
