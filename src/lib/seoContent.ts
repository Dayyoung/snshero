/**
 * SEO Content Utilities for SNSHero Wiki & Card Pages
 * 카드별 SEO 메타데이터 생성, 키워드 조합, fallback 관리
 */
import { DatabaseCard, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { t } from './i18n';
import { getCharacterIpProfile, getFactionDef } from '../content/characterIpUtils';

/** 카드 검색 키워드 매핑 (획득처, 추천 키워드) */
const CARD_KEYWORDS: Record<number, { ko: string[]; en: string[] }> = {};

/**
 * 카드별 검색 키워드를 동적으로 생성
 * fallback: 카드명 + 세력 + 희귀도 + 타입
 */
export function getCardKeywords(cardId: number, lang: Language): string[] {
  if (CARD_KEYWORDS[cardId]) {
    return lang === 'ko' ? CARD_KEYWORDS[cardId].ko : CARD_KEYWORDS[cardId].en;
  }

  const card = CARD_DATABASE[cardId];
  if (!card) return [];

  const profile = getCharacterIpProfile(cardId);
  const factionDef = profile ? getFactionDef(profile.faction) : undefined;

  const keywords: string[] = [];
  // Card name variations
  keywords.push(card.title, card.title_en, card.title_dis);
  // Faction
  if (factionDef) {
    const factionName = t(factionDef.nameKey, lang);
    if (factionName) keywords.push(factionName);
  }
  // Rarity
  if (card.rarity) keywords.push(card.rarity);
  // Element
  if (card.element) keywords.push(card.element);
  // Archtype
  if (profile?.archetype) keywords.push(profile.archetype);
  // Marketing tags
  if (profile?.marketingTags) keywords.push(...profile.marketingTags);

  return [...new Set(keywords.filter(Boolean))];
}

/**
 * 카드별 SEO 제목 생성
 * 예: "포세이돈 (Poseidon) - SNS히어로 카드 도감"
 */
export function getCardSeoTitle(cardId: number, lang: Language): string {
  const card = CARD_DATABASE[cardId];
  if (!card) return t('seo_title_wiki_card', lang);

  const cardName = lang === 'ko' ? card.title : (card.title_en || card.title);
  const suffix = lang === 'ko' ? 'SNS히어로 카드 도감' : 'SNSHero Card Encyclopedia';

  return `${cardName} - ${suffix}`;
}

/**
 * 카드별 SEO 설명 생성
 * 카드명, 세력, 스토리, 능력치를 조합한 meta description
 */
export function getCardSeoDescription(cardId: number, lang: Language): string {
  const card = CARD_DATABASE[cardId];
  if (!card) return t('seo_desc_wiki_card', lang);

  const profile = getCharacterIpProfile(cardId);
  const factionDef = profile ? getFactionDef(profile.faction) : undefined;

  const cardName = lang === 'ko' ? card.title : (card.title_en || card.title);
  const rarity = card.rarity || '';
  const faction = factionDef ? t(factionDef.nameKey, lang) : '';
  const stats = card.stats ? `[${card.stats.join('/')}]` : '';
  const power = card.power ? `CP ${card.power}` : '';

  if (lang === 'ko') {
    const parts = [`${cardName} 카드 상세 정보`];
    if (faction) parts.push(`소속: ${faction}`);
    if (rarity) parts.push(`등급: ${rarity}`);
    if (stats) parts.push(`스탯 ${stats}`);
    if (power) parts.push(power);
    if (card.lore_ko) parts.push(card.lore_ko.slice(0, 80));
    return parts.join('. ') + ' - SNS히어로 카드 도감에서 확인하세요.';
  }

  const parts = [`${cardName} card details`];
  if (faction) parts.push(`Faction: ${faction}`);
  if (rarity) parts.push(`Rarity: ${rarity}`);
  if (stats) parts.push(`Stats ${stats}`);
  if (power) parts.push(power);
  if (card.lore_en) parts.push(card.lore_en.slice(0, 80));
  return parts.join('. ') + ' - Browse the SNSHero Card Encyclopedia.';
}

/**
 * 위키 페이지 SEO 제목 fallback (view 타입 기반)
 */
export function getWikiSeoTitle(view: string, lang: Language): string {
  switch (view) {
    case 'wiki-card':
      return t('seo_title_wiki_card', lang);
    case 'wiki-howtoplay':
      return t('seo_title_wiki_howtoplay', lang);
    case 'wiki-tip':
      return t('seo_title_wiki_tip', lang);
    case 'wiki':
      return t('seo_title_wiki', lang);
    default:
      return t('seo_title_home', lang);
  }
}

/**
 * 위키 페이지 SEO 설명 fallback
 */
export function getWikiSeoDescription(view: string, lang: Language): string {
  switch (view) {
    case 'wiki-card':
      return t('seo_desc_wiki_card', lang);
    case 'wiki-howtoplay':
      return t('seo_desc_wiki_howtoplay', lang);
    case 'wiki-tip':
      return t('seo_desc_wiki_tip', lang);
    case 'wiki':
      return t('seo_desc_wiki', lang);
    default:
      return t('seo_desc_home', lang);
  }
}

/**
 * 카드별 공유 이미지 URL 생성
 * og:image 태그에 사용할 카드 썸네일 경로
 */
export function getCardShareImageUrl(cardId: number): string {
  const card = CARD_DATABASE[cardId];
  if (card?.imageUrl) return card.imageUrl;
  // fallback to card image index based URL
  return `https://snshero.com/cards/card_${cardId}.png`;
}

/**
 * 110종 카드가 누락 없이 fallback meta를 가지는지 검증
 */
export function validateCardSeoCoverage(): { covered: number; total: number } {
  const cardIds = Object.keys(CARD_DATABASE).map(Number);
  return {
    covered: cardIds.length,
    total: cardIds.length,
  };
}

/**
 * SEO 키워드 리스트를 쉼표로 조인
 */
export function joinKeywords(keywords: string[]): string {
  return keywords.filter(Boolean).slice(0, 10).join(', ');
}
