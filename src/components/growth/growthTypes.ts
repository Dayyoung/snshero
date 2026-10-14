export type CardGrade = 'SSR' | 'SR' | 'R';
export type CardAttribute = 'CYBER' | 'MEME' | 'QUANTUM' | 'NEON' | 'CHAOS';

export interface GrowthHeroCard {
  id: number;
  name: string;
  title: string;
  grade: CardGrade;
  attribute: CardAttribute;
  power: number;
  synergyTag: string;
  skillName: string;
  skillDesc: string;
  accentColor: string;
  avatarEmoji: string;
  imageUrl?: string;
}

export interface ChallengePayload {
  v: number;
  nick: string;
  winRate: number;
  cards: Array<{
    id: number;
    name: string;
    grade: CardGrade;
    attr: CardAttribute;
    pwr: number;
    tag: string;
    skill: string;
    emoji: string;
  }>;
}

export interface GrowthRewardPayload {
  snsPoints: number;
  freeTickets: number;
  rewardCard?: GrowthHeroCard;
  source: 'FTUE_CLEAR' | 'CHALLENGE_WIN' | 'CHALLENGE_PARTICIPATE';
}

export const trackGrowthEvent = (
  eventName:
    | 'ftue_impression'
    | 'ftue_pack_opened'
    | 'ftue_hero_selected'
    | 'ftue_overdrive_triggered'
    | 'ftue_completed'
    | 'ftue_skipped'
    | 'challenge_link_created'
    | 'challenge_card_downloaded'
    | 'challenge_battle_started'
    | 'challenge_battle_completed',
  params?: Record<string, string | number | boolean>
) => {
  try {
    if (typeof window !== 'undefined' && typeof (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag === 'function') {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', eventName, {
        event_category: 'growth_funnel',
        ...params,
      });
    }
  } catch (e) {
    console.warn('[GrowthAnalytics] Event tracking skipped:', e);
  }
};

export const encodeChallengeDeck = (
  nickname: string,
  deck: GrowthHeroCard[],
  winRate: number = 78
): string => {
  const payload: ChallengePayload = {
    v: 1,
    nick: nickname.slice(0, 16) || 'SNS히어로',
    winRate: Math.min(99, Math.max(40, winRate)),
    cards: deck.slice(0, 5).map((c) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      attr: c.attribute,
      pwr: c.power,
      tag: c.synergyTag,
      skill: c.skillName,
      emoji: c.avatarEmoji || '⚡',
    })),
  };

  const jsonStr = JSON.stringify(payload);
  const utf8Bytes = new TextEncoder().encode(jsonStr);
  let binaryStr = '';
  utf8Bytes.forEach((b) => {
    binaryStr += String.fromCharCode(b);
  });
  return btoa(binaryStr)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const decodeChallengeDeck = (encoded: string): ChallengePayload | null => {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    const binaryStr = atob(padded);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(jsonStr) as ChallengePayload;
    if (!parsed || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('[ChallengeCodec] Failed to decode challenge URL:', e);
    return null;
  }
};

export const FTUE_STARTER_SSR_CARDS: GrowthHeroCard[] = [
  {
    id: 101,
    name: '알파 제네시스 V',
    title: '초거대 AI 사령관',
    grade: 'SSR',
    attribute: 'CYBER',
    power: 9850,
    synergyTag: 'AI 오버클럭',
    skillName: '뉴럴 네트워크 붕괴',
    skillDesc: '적 전체 방어력을 무력화하고 아군 5장 시너지 공격력을 250% 증폭합니다.',
    accentColor: '#06b6d4',
    avatarEmoji: '🤖',
  },
  {
    id: 104,
    name: '바이럴 퀸 루미나',
    title: '트렌드 지배자',
    grade: 'SSR',
    attribute: 'NEON',
    power: 9720,
    synergyTag: '도파민 폭주',
    skillName: '1억 뷰 슈퍼노바',
    skillDesc: '타임라인을 장악하여 적의 턴을 봉쇄하고 치명타 확률 100% 광역 피해를 입힙니다.',
    accentColor: '#ec4899',
    avatarEmoji: '👑',
  },
  {
    id: 109,
    name: '퀀텀 사토시 나이트',
    title: '블록체인 집행자',
    grade: 'SSR',
    attribute: 'QUANTUM',
    power: 9910,
    synergyTag: '제네시스 블록',
    skillName: '라이트닝 해시 슬래시',
    skillDesc: '불변의 장부 에너지를 해방하여 적 보스에게 최대 체력 비례 확정 피해를 가합니다.',
    accentColor: '#f59e0b',
    avatarEmoji: '⚔️',
  },
];

export const COUNTER_DECK_PRESETS: Array<{
  id: string;
  title: string;
  subtitle: string;
  synergyBonus: string;
  badgeColor: string;
  cards: GrowthHeroCard[];
}> = [
  {
    id: 'burst',
    title: '🔥 극공격 오버드라이브 덱',
    subtitle: '초반 10초 내 폭발적인 치명타 시너지로 상대 덱을 제압합니다.',
    synergyBonus: '시너지 공격력 +35% / 치명타 확률 +50%',
    badgeColor: 'from-rose-600 to-orange-500',
    cards: [
      FTUE_STARTER_SSR_CARDS[2],
      {
        id: 12,
        name: '사이버 블레이드 렉스',
        title: '광속 암살자',
        grade: 'SSR',
        attribute: 'CYBER',
        power: 9100,
        synergyTag: '초고속 연격',
        skillName: '플라즈마 일섬',
        skillDesc: '전열 적에게 3연속 관통 피해',
        accentColor: '#f43f5e',
        avatarEmoji: '🗡️',
      },
      {
        id: 27,
        name: '네온 발키리 아리아',
        title: '하늘의 심판자',
        grade: 'SR',
        attribute: 'NEON',
        power: 8650,
        synergyTag: '도파민 폭주',
        skillName: '발키리 스트라이크',
        skillDesc: '아군 전체 공격속도 가속',
        accentColor: '#fb7185',
        avatarEmoji: '🪽',
      },
      {
        id: 44,
        name: '크립토 버서커 볼프',
        title: '불장 돌파자',
        grade: 'SR',
        attribute: 'MEME',
        power: 8400,
        synergyTag: '투더문',
        skillName: '로켓 펀치',
        skillDesc: '잃은 체력 비례 추가 데미지',
        accentColor: '#f97316',
        avatarEmoji: '🐺',
      },
      {
        id: 68,
        name: '하이퍼 스나이퍼 제로',
        title: '원샷 원킬',
        grade: 'SR',
        attribute: 'CYBER',
        power: 8550,
        synergyTag: 'AI 오버클럭',
        skillName: '레일건 저격',
        skillDesc: '가장 전투력이 높은 적 집중 타격',
        accentColor: '#ef4444',
        avatarEmoji: '🎯',
      },
    ],
  },
  {
    id: 'counter',
    title: '⚡ AI 뉴럴 카운터 덱',
    subtitle: '상대의 주력 스킬을 역이용하여 한 방에 전세를 뒤집는 전술 덱입니다.',
    synergyBonus: '적 스킬 피해 40% 반사 / 궁극기 게이지 2배 충전',
    badgeColor: 'from-cyan-600 to-blue-600',
    cards: [
      FTUE_STARTER_SSR_CARDS[0],
      {
        id: 19,
        name: '프로토콜 아키텍트',
        title: '설계자',
        grade: 'SSR',
        attribute: 'QUANTUM',
        power: 9050,
        synergyTag: 'AI 오버클럭',
        skillName: '방화벽 전개',
        skillDesc: '아군 전원 절대 방어막 생성',
        accentColor: '#06b6d4',
        avatarEmoji: '🛡️',
      },
      {
        id: 33,
        name: '딥러닝 오라클',
        title: '미래 예지자',
        grade: 'SR',
        attribute: 'CYBER',
        power: 8700,
        synergyTag: '예측 알고리즘',
        skillName: '시뮬레이션 역전',
        skillDesc: '적의 다음 공격을 100% 회피 후 반격',
        accentColor: '#3b82f6',
        avatarEmoji: '🔮',
      },
      {
        id: 51,
        name: '일렉트로 팬텀',
        title: '네트워크 유령',
        grade: 'SR',
        attribute: 'NEON',
        power: 8350,
        synergyTag: '도파민 폭주',
        skillName: 'EMP 쇼크웨이브',
        skillDesc: '적 전체 2초간 기절',
        accentColor: '#6366f1',
        avatarEmoji: '👻',
      },
      {
        id: 77,
        name: '메카 가디언 타이탄',
        title: '강철의 요새',
        grade: 'SR',
        attribute: 'CYBER',
        power: 8600,
        synergyTag: '제네시스 블록',
        skillName: '이지스 리플렉트',
        skillDesc: '받은 피해의 150%를 카운터로 반환',
        accentColor: '#0ea5e9',
        avatarEmoji: '🦾',
      },
    ],
  },
  {
    id: 'viral',
    title: '👑 도파민 만능 시너지 덱',
    subtitle: '공격과 회복, 버프가 완벽히 조화된 5장 풀 시너지 밸런스 덱입니다.',
    synergyBonus: '모든 스탯 +25% / 매 턴 체력 15% 자동 회복',
    badgeColor: 'from-fuchsia-600 to-purple-600',
    cards: [
      FTUE_STARTER_SSR_CARDS[1],
      {
        id: 23,
        name: '스타라이트 디바 세라',
        title: '은하계 아이돌',
        grade: 'SSR',
        attribute: 'NEON',
        power: 9120,
        synergyTag: '도파민 폭주',
        skillName: '앙코르 심포니',
        skillDesc: '아군 전체 체력 회복 및 공격력 2배',
        accentColor: '#d946ef',
        avatarEmoji: '🎤',
      },
      {
        id: 39,
        name: '밈 로드 도지킹',
        title: '커뮤니티의 왕',
        grade: 'SR',
        attribute: 'MEME',
        power: 8800,
        synergyTag: '투더문',
        skillName: '화성 갈끄니까',
        skillDesc: '랜덤 적 3명에게 폭탄 피해',
        accentColor: '#eab308',
        avatarEmoji: '🐕',
      },
      {
        id: 58,
        name: '카오스 조커 할리',
        title: '예측불허 트릭스터',
        grade: 'SR',
        attribute: 'CHAOS',
        power: 8500,
        synergyTag: '룰 브레이커',
        skillName: '잭팟 룰렛',
        skillDesc: '777% 확률적 치명타 발동',
        accentColor: '#a855f7',
        avatarEmoji: '🃏',
      },
      {
        id: 88,
        name: '네뷸라 나이트 카일',
        title: '성운의 수호기사',
        grade: 'SR',
        attribute: 'QUANTUM',
        power: 8450,
        synergyTag: '제네시스 블록',
        skillName: '스타더스트 배리어',
        skillDesc: '아군 치명타 피해량 80% 증가',
        accentColor: '#8b5cf6',
        avatarEmoji: '🌟',
      },
    ],
  },
];
