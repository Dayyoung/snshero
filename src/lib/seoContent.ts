import { ViewType, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';

export function getCardKeywords(cardId: number, language: Language): string[] {
  const card = CARD_DATABASE[cardId];
  const name = card?.name || `Hero #${cardId}`;
  if (language === 'ko') {
    return ['SNS히어로', '카드게임', name, '전투력', '덱 빌딩', '웹 카드 배틀'];
  }
  return ['SNSHero', 'card game', name, 'deck building', 'web battle'];
}

export function joinKeywords(keywords: string[]): string {
  return keywords.join(', ');
}

export function getCardSeoTitle(cardId: number, language: Language): string {
  const card = CARD_DATABASE[cardId];
  const name = card?.name || `Hero #${cardId}`;
  if (language === 'ko') {
    return `${name} - SNS히어로 카드 백과`;
  }
  return `${name} - SNSHero Card Encyclopedia`;
}

export function getCardSeoDescription(cardId: number, language: Language): string {
  const card = CARD_DATABASE[cardId];
  const name = card?.name || `Hero #${cardId}`;
  if (language === 'ko') {
    return `SNS히어로 No.${cardId} ${name} 카드의 스탯, 스킬, 상성 정보 및 덱 편성 가이드.`;
  }
  return `Stats, skills, and deck pairing guide for No.${cardId} ${name} in SNSHero.`;
}

export function getCardShareImageUrl(cardId: number): string {
  return `https://snshero.com/cards/card_${cardId}.png`;
}

export function getWikiSeoTitle(view: ViewType, language: Language): string {
  if (language === 'ko') {
    switch (view) {
      case 'wiki-howtoplay':
        return '게임 플레이 가이드 - SNS히어로';
      case 'wiki-tip':
        return '공략 & 팁 - SNS히어로';
      case 'wiki-card':
        return '카드 도감 - SNS히어로';
      default:
        return '히어로 백과 - SNS히어로';
    }
  }
  switch (view) {
    case 'wiki-howtoplay':
      return 'How to Play Guide - SNSHero';
    case 'wiki-tip':
      return 'Strategy & Tips - SNSHero';
    case 'wiki-card':
      return 'Card Encyclopedia - SNSHero';
    default:
      return 'Hero Wiki - SNSHero';
  }
}

export function getWikiSeoDescription(view: ViewType, language: Language): string {
  if (language === 'ko') {
    return 'SNS히어로 게임 규칙, 카드 상성, 덱 조합 가이드 및 실시간 배틀 팁.';
  }
  return 'SNSHero rules, card synergies, deck building guides, and battle tips.';
}
