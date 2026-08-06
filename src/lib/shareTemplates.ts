import { CARD_DATABASE } from '../cardDatabase';
import { t } from './i18n';
import type { Language, CardData } from '../types';
import { getCharacterIpProfile, getFactionDef } from '../content/characterIpUtils';

export type ShareTemplateType = 'character' | 'webtoon' | 'season' | 'deck' | 'battle-result' | 'referral';
export type ShareAspectRatio = '1:1' | '9:16' | '16:9';

export interface ShareCopyResult {
  intro: string;
  caption: string;
  hashtags: string[];
}

/** 카드 이름 정리 (공백 제거, 특수문자 제거) */
const normalizeTag = (value: string): string => value.replace(/[\s#@!?.,\/\\]/g, '');

/** 카드 ID로 화면 표시 이름 */
const getCardDisplayName = (cardId: number, language: Language): string => {
  const card = CARD_DATABASE[cardId];
  if (!card) return language === 'ko' ? `카드 ${cardId}` : `Card ${cardId}`;
  return language === 'ko' ? card.title : card.title_dis;
};

/**
 * 캐릭터 소개 공유 카피 생성
 * — 카드 원화, 이름, 세력, 대표 대사, 해시태그
 */
export function buildCharacterShareCopy(cardId: number, language: Language): ShareCopyResult {
  const profile = getCharacterIpProfile(cardId);
  const card = CARD_DATABASE[cardId];

  if (!profile || !card) {
    const fallbackName = getCardDisplayName(cardId, language);
    const hashtags = ['#SNSHero', '#CardCodex', `#${normalizeTag(fallbackName)}`];
    return {
      intro: fallbackName,
      caption: [fallbackName, hashtags.join(' ')].join('\n'),
      hashtags,
    };
  }

  const displayName = getCardDisplayName(cardId, language);
  const factionDef = getFactionDef(profile.faction);
  const factionLabel = factionDef ? t(factionDef.nameKey, language) : profile.faction;
  const rarityLabel = t(`rarity_${profile.rarityTier}`, language);
  const signatureLine = t(profile.signatureLineKey, language);
  const tags = profile.marketingTags?.slice(0, 3) ?? [];

  const hashtags = [
    '#SNSHero',
    '#CardCodex',
    `#${normalizeTag(displayName)}`,
    `#${normalizeTag(factionLabel)}`,
    `#${normalizeTag(rarityLabel)}`,
    ...tags.map((tag: string) => `#${normalizeTag(tag)}`),
  ];

  const intro = [displayName, factionLabel, rarityLabel].filter(Boolean).join(' · ');
  const caption = [intro, signatureLine, hashtags.join(' ')].filter(Boolean).join('\n');

  return { intro, caption, hashtags };
}

/**
 * 웹툰 에피소드 공유 카피 생성
 * — 에피소드 제목, 로그라인, 해시태그
 */
export function buildWebtoonShareCopy(
  episodeTitle: string,
  logline: string,
  seasonName: string,
  language: Language,
): ShareCopyResult {
  const hashtags = [
    '#SNSHero',
    '#Webtoon',
    '#SNSHeroWebtoon',
    `#${normalizeTag(seasonName)}`,
  ];

  const intro = episodeTitle;
  const caption = [intro, logline, hashtags.join(' ')].filter(Boolean).join('\n');

  return { intro, caption, hashtags };
}

/**
 * 시즌 공유 카피 생성
 * — 시즌명, 시즌 로그라인, 이번 시즌 참여 CTA, 해시태그
 */
export function buildSeasonShareCopy(
  seasonTitle: string,
  seasonSubtitle: string,
  season: string,
  language: Language,
): ShareCopyResult {
  const cta = language === 'ko'
    ? '지금 SNSHero에서 시즌에 참여하고 특별 보상을 획득하세요!'
    : 'Join the season now on SNSHero and earn exclusive rewards!';

  const hashtags = [
    '#SNSHero',
    '#SeasonMission',
    `#${normalizeTag(seasonTitle)}`,
    `#${normalizeTag(season)}`,
  ];

  const intro = seasonTitle;
  const caption = [intro, seasonSubtitle, cta, hashtags.join(' ')].filter(Boolean).join('\n');

  return { intro, caption, hashtags };
}

/**
 * 덱 자랑 공유 카피 생성
 * — 총 전투력, 대표 세력, 공유 문구
 */
export function buildDeckShareCopy(
  deck: CardData[],
  language: Language,
): ShareCopyResult {
  const totalPower = deck.reduce((sum, c) => sum + (CARD_DATABASE[c.imageIndex || 0]?.power || 0), 0);

  // Find dominant faction
  const factionCount: Record<string, number> = {};
  deck.forEach(c => {
    const profile = getCharacterIpProfile(c.imageIndex || 0);
    if (profile) {
      factionCount[profile.faction] = (factionCount[profile.faction] || 0) + 1;
    }
  });
  const dominantFaction = Object.entries(factionCount).sort((a, b) => b[1] - a[1])[0];
  const factionLabel = dominantFaction
    ? (getFactionDef(dominantFaction[0] as any) ? t(getFactionDef(dominantFaction[0] as any)!.nameKey, language) : dominantFaction[0])
    : '';

  const cardNames = deck
    .map((c, i) => getCardDisplayName(c.imageIndex || 0, language))
    .filter(Boolean)
    .slice(0, 5);

  const boasterText = language === 'ko'
    ? `🔥 총 전투력 ${totalPower.toLocaleString()}의 최강 덱을 공개합니다!`
    : `🔥 Check out my ultimate deck with ${totalPower.toLocaleString()} total power!`;

  const factionText = factionLabel
    ? (language === 'ko' ? `대표 세력: ${factionLabel}` : `Main Faction: ${factionLabel}`)
    : '';

  const deckLine = cardNames.join(', ');

  const hashtags = [
    '#SNSHero',
    '#DeckShowcase',
    '#SNSHeroDeck',
    `#${normalizeTag(totalPower.toString())}Power`,
    ...(dominantFaction ? [`#${normalizeTag(factionLabel)}`] : []),
  ];

  const intro = boasterText;
  const caption = [intro, deckLine, factionText, hashtags.join(' ')].filter(Boolean).join('\n');

  return { intro, caption, hashtags };
}

/**
 * 전투 결과 공유 카피 생성
 */
export function buildBattleResultShareCopy(
  result: 'win' | 'loss' | 'draw',
  playerTotalPower: number,
  opponentTotalPower: number,
  language: Language,
): ShareCopyResult {
  const resultEmoji = result === 'win' ? '🏆' : result === 'loss' ? '💔' : '🤝';
  const resultText = language === 'ko'
    ? (result === 'win' ? '승리!' : result === 'loss' ? '패배...' : '무승부')
    : (result === 'win' ? 'Victory!' : result === 'loss' ? 'Defeat...' : 'Draw');

  const intro = `${resultEmoji} ${resultText} (${playerTotalPower} vs ${opponentTotalPower})`;

  const cta = language === 'ko'
    ? '지금 SNSHero에서 전투에 도전하세요!'
    : 'Challenge a battle now on SNSHero!';

  const hashtags = ['#SNSHero', '#CardBattle', '#SNSHeroBattle'];

  const caption = [intro, cta, hashtags.join(' ')].filter(Boolean).join('\n');

  return { intro, caption, hashtags };
}

/**
 * 공유 타입별 해시태그 생성
 * — 도감 공유 탭과 재사용 가능
 */
export function buildHashtags(
  type: ShareTemplateType,
  cardIds: number[],
  season?: string,
): string[] {
  const base = ['#SNSHero'];

  switch (type) {
    case 'character':
      base.push('#CardCodex');
      cardIds.forEach(id => {
        const name = getCardDisplayName(id, 'en');
        base.push(`#${normalizeTag(name)}`);
      });
      break;
    case 'webtoon':
      base.push('#Webtoon', '#SNSHeroWebtoon');
      if (season) base.push(`#${normalizeTag(season)}`);
      break;
    case 'season':
      base.push('#SeasonMission');
      if (season) base.push(`#${normalizeTag(season)}`);
      break;
    case 'deck':
      base.push('#DeckShowcase', '#SNSHeroDeck');
      break;
    case 'battle-result':
      base.push('#CardBattle', '#SNSHeroBattle');
      break;
    case 'referral':
      base.push('#InviteFriends', '#SNSHeroReferral');
      break;
  }

  return base;
}

/**
 * 친구 초대 공유 카피 생성
 * — 초대 코드, 초대 링크, 보상 안내, 해시태그
 */
export function buildReferralShareCopy(
  code: string,
  link: string,
  inviteMessage: string,
  rewardMessage: string,
): ShareCopyResult {
  const hashtags = ['#SNSHero', '#CardGame', '#InviteFriends', '#SNSHeroReferral'];

  const intro = inviteMessage;
  const caption = [inviteMessage, rewardMessage, link, hashtags.join(' ')].filter(Boolean).join('\n');

  return { intro, caption, hashtags };
}
