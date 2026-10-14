// src/components/growth/growthTypes.ts
export type CardGrade = 'SSR' | 'SR' | 'R';
export type CardAttribute = 'CYBER' | 'MEME' | 'QUANTUM' | 'NEON' | 'CHAOS';

export interface GrowthHeroCard {
  id: number;
  codeName: string;
  name: string;
  title: string;
  grade: CardGrade;
  attribute: CardAttribute;
  power: number;
  synergyTag: string;
  skillName: string;
  skillDesc: string;
  accentColor: string;
  imageUrl?: string;
}

export interface ChallengePayload {
  v: number;
  nick: string;
  winRate: number;
  cards: Array<{
    id: number;
    code: string;
    name: string;
    grade: CardGrade;
    attr: CardAttribute;
    pwr: number;
    tag: string;
    skill: string;
  }>;
}

export interface GrowthRewardPayload {
  snsPoints: number;
  freeTickets: number;
  rewardCard?: GrowthHeroCard;
  source: 'FTUE_CLEAR' | 'CHALLENGE_WIN' | 'CHALLENGE_PARTICIPATE';
}

export const trackGrowthEvent = (
  eventName: string,
  params?: Record<string, string | number | boolean>
) => {
  try {
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', eventName, {
        event_category: 'growth_funnel',
        ...params,
      });
    }
  } catch (e) {
    // ignore analytics error
  }
};

export const encodeChallengeDeck = (
  nickname: string,
  deck: GrowthHeroCard[],
  winRate: number = 78
): string => {
  const payload: ChallengePayload = {
    v: 1,
    nick: (nickname || 'COMMANDER').slice(0, 16),
    winRate: Math.min(99, Math.max(40, winRate)),
    cards: deck.slice(0, 5).map((c) => ({
      id: c.id,
      code: c.codeName || 'UNIT-' + c.id,
      name: c.name,
      grade: c.grade,
      attr: c.attribute,
      pwr: c.power,
      tag: c.synergyTag,
      skill: c.skillName,
    })),
  };

  const jsonStr = JSON.stringify(payload);
  const utf8Bytes = new TextEncoder().encode(jsonStr);
  let binaryStr = '';
  utf8Bytes.forEach((b) => {
    binaryStr += String.fromCharCode(b);
  });
  return btoa(binaryStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
    return null;
  }
};

export const FTUE_STARTER_SSR_CARDS: GrowthHeroCard[] = [
  {
    id: 101,
    codeName: 'SH-101 // SOVEREIGN',
    name: '알파 제네시스 V',
    title: '초거대 AI 전술 사령관',
    grade: 'SSR',
    attribute: 'CYBER',
    power: 9850,
    synergyTag: 'NEURAL OVERCLOCK',
    skillName: '뉴럴 네트워크 붕괴',
    skillDesc: '적 전체 방어 프로토콜을 무력화하고 아군 5장 시너지 공격력을 250% 증폭합니다.',
    accentColor: '#38bdf8',
  },
  {
    id: 104,
    codeName: 'SH-104 // VALKYRIE',
    name: '루미나 프라임',
    title: '하이퍼 네트워크 지배자',
    grade: 'SSR',
    attribute: 'NEON',
    power: 9720,
    synergyTag: 'SYNAPSE SURGE',
    skillName: '슈퍼노바 펄스',
    skillDesc: '전장 타임라인을 장악하여 적의 턴을 봉쇄하고 확정 치명타 광역 피해를 입힙니다.',
    accentColor: '#c084fc',
  },
  {
    id: 109,
    codeName: 'SH-109 // EXECUTOR',
    name: '퀀텀 나이트 제로',
    title: '제네시스 원장 집행관',
    grade: 'SSR',
    attribute: 'QUANTUM',
    power: 9910,
    synergyTag: 'GENESIS PROTOCOL',
    skillName: '라이트닝 해시 슬래시',
    skillDesc: '양자 코어 에너지를 해방하여 적 주력 유닛에게 최대 체력 비례 확정 피해를 가합니다.',
    accentColor: '#fbbf24',
  },
];

export const COUNTER_DECK_PRESETS = [
  {
    id: 'burst',
    code: 'PRESET // 01-ASSAULT',
    title: '오버드라이브 강습 덱',
    subtitle: '초반 10초 내 폭발적인 치명타 시너지로 상대 진영을 제압하는 고속 기동 편성',
    synergyBonus: '시너지 공격력 +35%  |  치명타 확률 +50%',
    cards: [
      FTUE_STARTER_SSR_CARDS[2],
      {
        id: 12,
        codeName: 'SH-012 // BLADE',
        name: '사이버 블레이드 렉스',
        title: '광속 암살자',
        grade: 'SSR' as CardGrade,
        attribute: 'CYBER' as CardAttribute,
        power: 9100,
        synergyTag: 'HIGH-SPEED SLASH',
        skillName: '플라즈마 일섬',
        skillDesc: '전열 적에게 3연속 관통 피해',
        accentColor: '#38bdf8',
      },
      {
        id: 27,
        codeName: 'SH-027 // AEGIS',
        name: '발키리 아리아',
        title: '궤도 강하 타격대',
        grade: 'SR' as CardGrade,
        attribute: 'NEON' as CardAttribute,
        power: 8650,
        synergyTag: 'SYNAPSE SURGE',
        skillName: '발키리 스트라이크',
        skillDesc: '아군 전체 공격속도 가속',
        accentColor: '#c084fc',
      },
      {
        id: 44,
        codeName: 'SH-044 // FENRIR',
        name: '크립토 버서커 볼프',
        title: '전선 돌파자',
        grade: 'SR' as CardGrade,
        attribute: 'QUANTUM' as CardAttribute,
        power: 8400,
        synergyTag: 'GENESIS PROTOCOL',
        skillName: '오버차지 스매시',
        skillDesc: '잃은 체력 비례 추가 피해',
        accentColor: '#fbbf24',
      },
      {
        id: 68,
        codeName: 'SH-068 // RAILGUN',
        name: '하이퍼 스나이퍼 제로',
        title: '초장거리 저격수',
        grade: 'SR' as CardGrade,
        attribute: 'CYBER' as CardAttribute,
        power: 8550,
        synergyTag: 'NEURAL OVERCLOCK',
        skillName: '레일건 저격',
        skillDesc: '가장 전투력이 높은 적 집중 타격',
        accentColor: '#38bdf8',
      },
    ],
  },
  {
    id: 'counter',
    code: 'PRESET // 02-COUNTER',
    title: 'AI 뉴럴 카운터 덱',
    subtitle: '상대의 주력 스킬을 역이용하여 단번에 전세를 뒤집는 전술 방어 반격 편성',
    synergyBonus: '적 스킬 피해 40% 반사  |  오버드라이브 충전 +100%',
    cards: [
      FTUE_STARTER_SSR_CARDS[0],
      {
        id: 19,
        codeName: 'SH-019 // CITADEL',
        name: '프로토콜 아키텍트',
        title: '방어 체계 설계자',
        grade: 'SSR' as CardGrade,
        attribute: 'QUANTUM' as CardAttribute,
        power: 9050,
        synergyTag: 'NEURAL OVERCLOCK',
        skillName: '절대 방화벽 전개',
        skillDesc: '아군 전원 고밀도 실드 생성',
        accentColor: '#38bdf8',
      },
      {
        id: 33,
        codeName: 'SH-033 // ORACLE',
        name: '딥러닝 오라클',
        title: '전술 연산기',
        grade: 'SR' as CardGrade,
        attribute: 'CYBER' as CardAttribute,
        power: 8700,
        synergyTag: 'PREDICTIVE MATRIX',
        skillName: '시뮬레이션 역전',
        skillDesc: '적의 다음 공격을 회피 후 반격',
        accentColor: '#38bdf8',
      },
      {
        id: 51,
        codeName: 'SH-051 // PHANTOM',
        name: '일렉트로 팬텀',
        title: '네트워크 잠입자',
        grade: 'SR' as CardGrade,
        attribute: 'NEON' as CardAttribute,
        power: 8350,
        synergyTag: 'SYNAPSE SURGE',
        skillName: 'EMP 쇼크웨이브',
        skillDesc: '적 전체 2초간 행동 불능',
        accentColor: '#c084fc',
      },
      {
        id: 77,
        codeName: 'SH-077 // TITAN',
        name: '메카 가디언 타이탄',
        title: '중장갑 요새',
        grade: 'SR' as CardGrade,
        attribute: 'CYBER' as CardAttribute,
        power: 8600,
        synergyTag: 'GENESIS PROTOCOL',
        skillName: '이지스 리플렉트',
        skillDesc: '받은 피해의 150%를 반사',
        accentColor: '#fbbf24',
      },
    ],
  },
  {
    id: 'viral',
    code: 'PRESET // 03-SYNERGY',
    title: '하모니 풀 시너지 덱',
    subtitle: '화력 지원과 내구도 회복, 코어 버프가 유기적으로 결합된 올라운더 편성',
    synergyBonus: '모든 스탯 +25%  |  매 턴 내구도 15% 자동 수복',
    cards: [
      FTUE_STARTER_SSR_CARDS[1],
      {
        id: 23,
        codeName: 'SH-023 // SERAPH',
        name: '스타라이트 세라',
        title: '공명 지휘관',
        grade: 'SSR' as CardGrade,
        attribute: 'NEON' as CardAttribute,
        power: 9120,
        synergyTag: 'SYNAPSE SURGE',
        skillName: '레조넌스 심포니',
        skillDesc: '아군 전체 수복 및 공격력 증폭',
        accentColor: '#c084fc',
      },
      {
        id: 39,
        codeName: 'SH-039 // VANGUARD',
        name: '프라임 뱅가드',
        title: '전술 기수',
        grade: 'SR' as CardGrade,
        attribute: 'QUANTUM' as CardAttribute,
        power: 8800,
        synergyTag: 'GENESIS PROTOCOL',
        skillName: '궤도 폭격 요청',
        skillDesc: '적 다수에게 고출력 포격 피해',
        accentColor: '#fbbf24',
      },
      {
        id: 58,
        codeName: 'SH-058 // MIRAGE',
        name: '카오스 미라주',
        title: '차원 교란기',
        grade: 'SR' as CardGrade,
        attribute: 'CHAOS' as CardAttribute,
        power: 8500,
        synergyTag: 'PHASE SHIFT',
        skillName: '디멘션 브레이크',
        skillDesc: '높은 계수의 공간 왜곡 치명타',
        accentColor: '#c084fc',
      },
      {
        id: 88,
        codeName: 'SH-088 // NEBULA',
        name: '네뷸라 나이트 카일',
        title: '성운 수호기사',
        grade: 'SR' as CardGrade,
        attribute: 'QUANTUM' as CardAttribute,
        power: 8450,
        synergyTag: 'GENESIS PROTOCOL',
        skillName: '스타더스트 배리어',
        skillDesc: '아군 치명타 피해량 80% 증가',
        accentColor: '#38bdf8',
      },
    ],
  },
];
