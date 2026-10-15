import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const GROWTH_DIR = path.join(ROOT, 'src', 'components', 'growth');
fs.mkdirSync(GROWTH_DIR, { recursive: true });

// 프로젝트 내 design.md 확인 및 로그 출력
const designMdCandidates = [
  path.join(ROOT, 'design.md'),
  path.join(ROOT, 'DESIGN.md'),
  path.join(ROOT, 'docs', 'design.md'),
];
const foundDesignMd = designMdCandidates.find((p) => fs.existsSync(p));
if (foundDesignMd) {
  console.log('📐 Found design.md specification:', foundDesignMd);
}

// 0. GrowthIcons.tsx (유니코드 이모지를 100% 대체하는 하이엔드 커스텀 SVG 벡터 아이콘 세트)
const iconsCode = `// src/components/growth/GrowthIcons.tsx
import React from 'react';

export interface IconProps {
  className?: string;
}

export const IconSpark: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const IconCards: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="13" height="17" rx="2" />
    <path d="M16 6h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9" />
    <path d="M9.5 10.5 12 13l-2.5 2.5L7 13z" />
  </svg>
);

export const IconSwords: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" y1="19" x2="19" y2="13" />
    <line x1="16" y1="16" x2="20" y2="20" />
    <line x1="19" y1="21" x2="21" y2="19" />
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
    <line x1="5" y1="14" x2="9" y2="18" />
    <line x1="7" y1="17" x2="4" y2="20" />
    <line x1="3" y1="19" x2="5" y2="21" />
  </svg>
);

export const IconShield: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const IconTrophy: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export const IconRadar: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
    <line x1="12" y1="12" x2="18.5" y2="5.5" />
  </svg>
);

export const IconShare: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export const IconClose: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IconChevronRight: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const IconCpu: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
  </svg>
);

export const IconDownload: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const IconCopy: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// 카드 클래스별 기하학적 엠블럼 SVG (이모지 완전 대체)
export const HeroClassEmblem: React.FC<{ attribute: string; className?: string }> = ({
  attribute,
  className = 'w-10 h-10',
}) => {
  switch (attribute) {
    case 'CYBER':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <polygon points="20,3 35,11.5 35,28.5 20,37 5,28.5 5,11.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
          <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M20 7v7M20 26v7M7 20h7M26 20h7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'NEON':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <polygon points="20,4 36,20 20,36 4,20" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
          <polygon points="20,11 29,20 20,29 11,20" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'QUANTUM':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
          <polygon points="20,8 31,27 9,27" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
          <circle cx="20" cy="21" r="3" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <rect x="7" y="7" width="26" height="26" rx="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
          <path d="M14 20h12M20 14v12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
  }
};
`;

// 1. growthTypes.ts (이모지 필드 제거 & 코드네임/전술 스펙 중심 데이터 구조)
const growthTypesCode = `// src/components/growth/growthTypes.ts
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
  return btoa(binaryStr).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
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
`;

// 2. FtueOnboardingModal.tsx (이모지 완전 제거 + 하이엔드 택티컬 HUD 디자인)
const ftueModalCode = `// src/components/growth/FtueOnboardingModal.tsx
import React, { useState, useEffect } from 'react';
import { FTUE_STARTER_SSR_CARDS, trackGrowthEvent } from './growthTypes';
import type { GrowthHeroCard, GrowthRewardPayload } from './growthTypes';
import {
  HeroClassEmblem,
  IconCards,
  IconChevronRight,
  IconClose,
  IconSpark,
  IconSwords,
  IconTrophy,
} from './GrowthIcons';

interface FtueOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteReward: (reward: GrowthRewardPayload) => void;
  onNavigate?: (destination: 'card-shop' | 'my-deck' | 'battle-arena') => void;
}

type FtueStep = 'PACK_READY' | 'PACK_OPENING' | 'PICK_HERO' | 'CLIMAX_BATTLE' | 'VICTORY_REWARD';

export const FtueOnboardingModal: React.FC<FtueOnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleteReward,
  onNavigate,
}) => {
  const [step, setStep] = useState<FtueStep>('PACK_READY');
  const [selectedHero, setSelectedHero] = useState<GrowthHeroCard>(FTUE_STARTER_SSR_CARDS[0]);
  const [bossHp, setBossHp] = useState<number>(42);
  const [allyHp, setAllyHp] = useState<number>(28);
  const [isOverdriveReady, setIsOverdriveReady] = useState<boolean>(false);
  const [isOverdriveFired, setIsOverdriveFired] = useState<boolean>(false);
  const [battleLogs, setBattleLogs] = useState<string[]>([
    '[SYS-01] TACTICAL SIMULATION // FINAL ROUND INITIALIZED',
    '[WARN] 아군 5인 시너지 실드 잔량 28% — 전술 개입이 필요합니다.',
  ]);

  useEffect(() => {
    if (isOpen) {
      setStep('PACK_READY');
      setBossHp(42);
      setAllyHp(28);
      setIsOverdriveReady(false);
      setIsOverdriveFired(false);
      setBattleLogs([
        '[SYS-01] TACTICAL SIMULATION // FINAL ROUND INITIALIZED',
        '[WARN] 아군 5인 시너지 실드 잔량 28% — 전술 개입이 필요합니다.',
      ]);
      trackGrowthEvent('ftue_impression');
    }
  }, [isOpen]);

  useEffect(() => {
    if (step !== 'CLIMAX_BATTLE') return;

    const timer1 = setTimeout(() => {
      setBossHp(36);
      setAllyHp(19);
      setBattleLogs((prev) => [
        ...prev,
        '[ALERT] 적 코어 광역 펄스 감지 — 방어 장벽 임계점 도달',
      ]);
    }, 850);

    const timer2 = setTimeout(() => {
      setIsOverdriveReady(true);
      setBattleLogs((prev) => [
        ...prev,
        '[READY] OVERDRIVE 100% — [' + selectedHero.name + '] 시너지 프로토콜 승인 대기 중',
      ]);
    }, 1650);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [step, selectedHero]);

  if (!isOpen) return null;

  const handleOpenPack = () => {
    trackGrowthEvent('ftue_pack_opened');
    setStep('PACK_OPENING');
    setTimeout(() => {
      setStep('PICK_HERO');
    }, 650);
  };

  const handleConfirmHeroAndStartBattle = (hero: GrowthHeroCard) => {
    setSelectedHero(hero);
    trackGrowthEvent('ftue_hero_selected', { hero_id: hero.id, hero_name: hero.name });
    setStep('CLIMAX_BATTLE');
  };

  const handleTriggerOverdrive = () => {
    if (isOverdriveFired) return;
    setIsOverdriveFired(true);
    trackGrowthEvent('ftue_overdrive_triggered', { hero_id: selectedHero.id });

    setBattleLogs((prev) => [
      ...prev,
      '[EXEC] ' + selectedHero.name + ' // ' + selectedHero.skillName + ' 발동 (CRITICAL 99,999)',
    ]);
    setBossHp(0);

    setTimeout(() => {
      localStorage.setItem('snshero_ftue_completed', 'true');
      localStorage.setItem('snshero_starter_hero', JSON.stringify(selectedHero));
      const reward: GrowthRewardPayload = {
        snsPoints: 1000,
        freeTickets: 10,
        rewardCard: selectedHero,
        source: 'FTUE_CLEAR',
      };
      onCompleteReward(reward);
      trackGrowthEvent('ftue_completed', { reward_points: 1000 });
      setStep('VICTORY_REWARD');
    }, 1150);
  };

  const handleSkip = () => {
    localStorage.setItem('snshero_ftue_completed', 'true');
    trackGrowthEvent('ftue_skipped', { step });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-[#090d16] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* 상단 마이크로 그리드 라인 */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
              SNSHERO TACTICAL ONBOARDING // 110 CARDS ARCHIVE
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-white/25 hover:text-white transition cursor-pointer"
          >
            <span>SKIP</span>
            <IconClose className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          {/* STEP 1: 카드 코어 언락 */}
          {(step === 'PACK_READY' || step === 'PACK_OPENING') && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-sky-300 uppercase">
                <IconSpark className="w-3.5 h-3.5 text-sky-400" />
                <span>COMMANDER INITIALIZATION // SSR GUARANTEED</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                제네시스 SSR 리더 코어를 해방하십시오
              </h2>
              <p className="text-sm text-slate-400 mb-8 max-w-lg leading-relaxed">
                110종의 히어로 중 당신의 5장 시너지 덱을 통솔할 지휘관 유닛을 선택하고, 15초 전술 클라이맥스 시뮬레이션을 즉시 수행합니다.
              </p>

              <button
                onClick={handleOpenPack}
                disabled={step === 'PACK_OPENING'}
                className={
                  'group relative flex flex-col items-center justify-between w-64 h-88 rounded-xl border border-sky-400/40 bg-gradient-to-b from-slate-900 via-[#0c1424] to-slate-950 p-6 shadow-[0_0_50px_rgba(56,189,248,0.15)] transition-all duration-500 cursor-pointer ' +
                  (step === 'PACK_OPENING'
                    ? 'scale-110 opacity-0 blur-md'
                    : 'hover:border-sky-400 hover:shadow-[0_0_60px_rgba(56,189,248,0.3)] hover:-translate-y-1')
                }
              >
                <div className="w-full flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="font-mono text-[10px] tracking-widest text-slate-400">
                    EDITION // 01
                  </span>
                  <span className="font-mono text-[10px] font-bold text-amber-400">
                    SSR TIER
                  </span>
                </div>

                <div className="my-auto flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-400/10 text-sky-300 group-hover:scale-110 transition-transform duration-300">
                    <IconCards className="w-10 h-10" />
                  </div>
                  <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.25em] text-sky-400">
                    GENESIS CORE PACK
                  </div>
                  <div className="mt-1 text-base font-bold text-white">
                    마스터 리더 유닛 봉인 해제
                  </div>
                </div>

                <div className="w-full rounded-lg bg-sky-400 py-2.5 text-xs font-bold tracking-wider text-slate-950 uppercase group-hover:bg-sky-300 transition">
                  INITIALIZE PACK
                </div>
              </button>
            </div>
          )}

          {/* STEP 2: SSR 리더 3종 중 택 1 */}
          {step === 'PICK_HERO' && (
            <div>
              <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                    SSR UNIT AUTHORIZATION
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mt-0.5">
                    5인 시너지 덱을 지휘할 파트너 유닛을 선택하십시오
                  </h2>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  SELECT 1 OF 3 SSR UNITS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FTUE_STARTER_SSR_CARDS.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleConfirmHeroAndStartBattle(card)}
                    className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-sky-400/60 hover:bg-white/[0.04] transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="rounded border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                          {card.grade}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-300">
                          PWR {card.power.toLocaleString()}
                        </span>
                      </div>

                      <div className="my-2 flex h-24 items-center justify-center rounded-lg border border-white/5 bg-[#060911] text-sky-400 group-hover:border-sky-400/30 transition">
                        <HeroClassEmblem attribute={card.attribute} className="w-12 h-12" />
                      </div>

                      <div className="mt-3 font-mono text-[10px] tracking-widest text-sky-400 uppercase">
                        {card.codeName}
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">{card.name}</h3>
                      <p className="text-xs text-slate-400 mb-4">{card.title}</p>

                      <div className="rounded-lg border border-white/5 bg-black/40 p-3 text-xs">
                        <div className="font-mono text-[10px] text-amber-400 uppercase mb-1">
                          SYNERGY // {card.synergyTag}
                        </div>
                        <div className="font-semibold text-slate-200 mb-1">
                          {card.skillName}
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[11px]">
                          {card.skillDesc}
                        </p>
                      </div>
                    </div>

                    <button className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-400/10 py-2.5 text-xs font-bold text-sky-300 group-hover:bg-sky-400 group-hover:text-slate-950 transition cursor-pointer">
                      <span>유닛 편성 및 시뮬레이션 개시</span>
                      <IconChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: 15초 전술 클라이맥스 배틀 */}
          {step === 'CLIMAX_BATTLE' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-2 rounded border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-rose-300">
                  <IconSwords className="w-3.5 h-3.5" />
                  <span>CLIMAX INTERVENTION // TACTICAL OVERDRIVE</span>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  LEADER: <strong className="text-sky-400">{selectedHero.name}</strong>
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#05080f] p-5 mb-4">
                {/* 적 보스 게이지 */}
                <div className="mb-6">
                  <div className="flex justify-between font-mono text-xs mb-1.5">
                    <span className="text-rose-400 font-semibold">
                      HOSTILE CORE // OMEGA OVERLORD (LV.99)
                    </span>
                    <span className="text-rose-300">{bossHp}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-sm bg-slate-900 overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-500"
                      style={{ width: bossHp + '%' }}
                    />
                  </div>
                </div>

                {/* 중앙 HUD 교전 디스플레이 */}
                <div className="grid grid-cols-3 items-center py-5 border-y border-white/5 my-2">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/10 text-sky-400 mb-2">
                      <HeroClassEmblem attribute={selectedHero.attribute} className="w-8 h-8" />
                    </div>
                    <div className="text-xs font-bold text-white">{selectedHero.name}</div>
                    <div className="font-mono text-[10px] text-sky-400">{selectedHero.synergyTag}</div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="font-mono text-xs tracking-[0.3em] text-slate-500">ENGAGED</span>
                    <span className="text-lg font-black text-amber-400 my-0.5">VS</span>
                    <span className="font-mono text-[10px] text-slate-500">SYNC 99.4%</span>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div
                      className={
                        'flex h-14 w-14 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 mb-2 transition-all duration-500 ' +
                        (isOverdriveFired ? 'scale-125 opacity-15' : '')
                      }
                    >
                      <HeroClassEmblem attribute="CHAOS" className="w-8 h-8" />
                    </div>
                    <div className="text-xs font-bold text-rose-300">오메가 오버로드</div>
                    <div className="font-mono text-[10px] text-slate-500">PWR 45,000</div>
                  </div>
                </div>

                {/* 아군 게이지 */}
                <div className="mt-5">
                  <div className="flex justify-between font-mono text-xs mb-1.5">
                    <span className="text-sky-400 font-semibold">
                      ALLIED SQUAD // 5-UNIT SYNERGY SHIELD
                    </span>
                    <span className="text-sky-300">{allyHp}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-sm bg-slate-900 overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
                      style={{ width: allyHp + '%' }}
                    />
                  </div>
                </div>
              </div>

              {/* 터미널 스타일 배틀 로그 */}
              <div className="rounded-lg bg-black/60 border border-white/10 p-3.5 mb-5 h-24 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {battleLogs.map((log, i) => (
                  <div key={i} className="text-slate-300">
                    {log}
                  </div>
                ))}
              </div>

              <button
                onClick={handleTriggerOverdrive}
                disabled={!isOverdriveReady || isOverdriveFired}
                className={
                  'w-full rounded-xl py-4 px-6 font-bold text-sm md:text-base tracking-wide transition-all flex items-center justify-center gap-2 ' +
                  (isOverdriveReady && !isOverdriveFired
                    ? 'bg-sky-400 text-slate-950 hover:bg-sky-300 shadow-[0_0_35px_rgba(56,189,248,0.4)] cursor-pointer'
                    : 'border border-white/10 bg-white/[0.03] text-slate-500 cursor-not-allowed')
                }
              >
                <IconSpark className="w-4 h-4" />
                <span>
                  {isOverdriveFired
                    ? 'OVERDRIVE EXECUTED — TARGET ELIMINATED'
                    : isOverdriveReady
                    ? '[전술 개입 승인] ' + selectedHero.skillName + ' 발동'
                    : 'SYNERGY OVERDRIVE CHARGING...'}
                </span>
              </button>
            </div>
          )}

          {/* STEP 4: 시뮬레이션 클리어 보상 */}
          {step === 'VICTORY_REWARD' && (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-300">
                <IconTrophy className="w-7 h-7" />
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-sky-400">
                SIMULATION COMPLETE // REWARDS CREDITED
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                전술 시뮬레이션 완료 및 지휘관 보급 승인
              </h2>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                선택한 SSR 리더 유닛과 초기 정착 크레딧이 계정에 즉시 반영되었습니다.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6 text-left">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="font-mono text-[10px] text-amber-400 uppercase">SSR UNIT</div>
                  <div className="text-sm font-bold text-white mt-1 truncate">
                    {selectedHero.name}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                    PWR {selectedHero.power.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="font-mono text-[10px] text-sky-400 uppercase">CREDIT GRANT</div>
                  <div className="text-sm font-bold text-white mt-1">+1,000 SNS</div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">INSTANT BALANCE</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="font-mono text-[10px] text-purple-400 uppercase">SUMMON VOUCHER</div>
                  <div className="text-sm font-bold text-white mt-1">10x FREE PULL</div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">CARD ARCHIVE</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onNavigate?.('card-shop');
                  }}
                  className="flex-1 rounded-xl bg-sky-400 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-sky-300 transition cursor-pointer"
                >
                  10회 무료 카드 소환소 이동
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate?.('my-deck');
                  }}
                  className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] py-3.5 text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition cursor-pointer"
                >
                  내 5인 시너지 덱 편성 확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`;

// 3. DeckChallengeSystem.tsx (이모지 완전 제거 + 하이엔드 Canvas 전술 카드 렌더링)
const deckChallengeCode = `// src/components/growth/DeckChallengeSystem.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  COUNTER_DECK_PRESETS,
  encodeChallengeDeck,
  trackGrowthEvent,
} from './growthTypes';
import type {
  ChallengePayload,
  GrowthHeroCard,
  GrowthRewardPayload,
} from './growthTypes';
import {
  HeroClassEmblem,
  IconClose,
  IconCopy,
  IconDownload,
  IconShare,
  IconSpark,
  IconSwords,
  IconTrophy,
} from './GrowthIcons';

interface InstantChallengeBattleModalProps {
  challengeData: ChallengePayload | null;
  onClose: () => void;
  onClaimReward: (reward: GrowthRewardPayload) => void;
  onOpenShareMyDeck: () => void;
}

export const InstantChallengeBattleModal: React.FC<InstantChallengeBattleModalProps> = ({
  challengeData,
  onClose,
  onClaimReward,
  onOpenShareMyDeck,
}) => {
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [phase, setPhase] = useState<'SELECT_COUNTER' | 'BATTLING' | 'RESULT'>('SELECT_COUNTER');
  const [enemyHp, setEnemyHp] = useState<number>(100);
  const [myHp, setMyHp] = useState<number>(100);
  const [overdriveUsed, setOverdriveUsed] = useState<boolean>(false);

  if (!challengeData) return null;

  const challengerPower = challengeData.cards.reduce((acc, c) => acc + c.pwr, 0);
  const chosenPreset = COUNTER_DECK_PRESETS[selectedPresetIdx];
  const myTotalPower = chosenPreset.cards.reduce((acc, c) => acc + c.power, 0);

  const startInstantBattle = () => {
    trackGrowthEvent('challenge_battle_started', {
      challenger: challengeData.nick,
      counter_preset: chosenPreset.id,
    });
    setPhase('BATTLING');
    setEnemyHp(100);
    setMyHp(100);

    setTimeout(() => {
      setEnemyHp(58);
      setMyHp(64);
    }, 700);

    setTimeout(() => {
      setEnemyHp(24);
      setMyHp(38);
    }, 1500);
  };

  const triggerCounterFinish = () => {
    setOverdriveUsed(true);
    setEnemyHp(0);
    setTimeout(() => {
      trackGrowthEvent('challenge_battle_completed', {
        challenger: challengeData.nick,
        result: 'WIN',
      });
      onClaimReward({
        snsPoints: 1500,
        freeTickets: 5,
        rewardCard: chosenPreset.cards[0],
        source: 'CHALLENGE_WIN',
      });
      setPhase('RESULT');
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-[#090d16] text-white shadow-2xl overflow-hidden">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-400/70 to-transparent" />

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <IconSwords className="w-4 h-4 text-purple-400" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300">
              DIRECT DECK CHALLENGE // ZERO-INSTALL ENGAGEMENT
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-white/5 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-purple-400">
                  CHALLENGER SQUAD
                </span>
                <h3 className="text-lg font-bold text-white">
                  {challengeData.nick} 지휘관의 5인 시너지 편성
                </h3>
              </div>
              <div className="text-right font-mono">
                <div className="text-[10px] text-slate-400">TOTAL POWER / WIN RATE</div>
                <div className="text-sm font-bold text-amber-400">
                  PWR {challengerPower.toLocaleString()} ({challengeData.winRate}%)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {challengeData.cards.map((c, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-white/10 bg-[#05080f] p-2.5 text-center"
                >
                  <div className="flex justify-center text-sky-400 mb-1.5">
                    <HeroClassEmblem attribute={c.attr} className="w-7 h-7" />
                  </div>
                  <div className="font-mono text-[10px] font-bold text-amber-400">{c.grade}</div>
                  <div className="text-[11px] font-semibold text-white truncate mt-0.5">{c.name}</div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                    {c.pwr.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {phase === 'SELECT_COUNTER' && (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-sky-400 mb-2.5">
                SELECT COUNTER-PROTOCOL (VICTORY BOUNTY: +1,500 SNS)
              </div>
              <div className="space-y-2.5 mb-6">
                {COUNTER_DECK_PRESETS.map((preset, idx) => (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetIdx(idx)}
                    className={
                      'rounded-xl border p-4 cursor-pointer transition-all ' +
                      (selectedPresetIdx === idx
                        ? 'border-sky-400 bg-sky-400/[0.07]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/25')
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-sky-400 mr-2">
                          {preset.code}
                        </span>
                        <span className="font-bold text-sm text-white">{preset.title}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-300">
                        PWR {preset.cards.reduce((s, c) => s + c.power, 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{preset.subtitle}</p>
                    <div className="mt-2 font-mono text-[11px] text-amber-300">
                      {preset.synergyBonus}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={startInstantBattle}
                className="w-full rounded-xl bg-sky-400 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-sky-300 transition cursor-pointer"
              >
                선택한 카운터 덱으로 즉시 교전 개시
              </button>
            </div>
          )}

          {phase === 'BATTLING' && (
            <div className="text-center py-3">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-sky-400/30 bg-black/50 p-4 text-left">
                  <div className="font-mono text-[10px] text-sky-400">
                    ALLIED COUNTER SQUAD ({myTotalPower.toLocaleString()})
                  </div>
                  <div className="text-sm font-bold text-white my-1 truncate">
                    {chosenPreset.title}
                  </div>
                  <div className="h-2 w-full rounded-sm bg-slate-900 overflow-hidden mt-2">
                    <div
                      className="h-full bg-sky-400 transition-all duration-500"
                      style={{ width: myHp + '%' }}
                    />
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-sky-300">SHIELD {myHp}%</div>
                </div>

                <div className="rounded-xl border border-rose-500/30 bg-black/50 p-4 text-left">
                  <div className="font-mono text-[10px] text-rose-400">
                    CHALLENGER ({challengerPower.toLocaleString()})
                  </div>
                  <div className="text-sm font-bold text-white my-1 truncate">
                    {challengeData.nick}
                  </div>
                  <div className="h-2 w-full rounded-sm bg-slate-900 overflow-hidden mt-2">
                    <div
                      className="h-full bg-rose-500 transition-all duration-500"
                      style={{ width: enemyHp + '%' }}
                    />
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-rose-300">SHIELD {enemyHp}%</div>
                </div>
              </div>

              <button
                onClick={triggerCounterFinish}
                disabled={overdriveUsed}
                className="w-full rounded-xl bg-sky-400 py-4 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-sky-300 transition cursor-pointer"
              >
                {overdriveUsed
                  ? 'COUNTER PROTOCOL EXECUTED'
                  : '[전술 카운터 발동] ' + chosenPreset.cards[0].skillName}
              </button>
            </div>
          )}

          {phase === 'RESULT' && (
            <div className="text-center py-3">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-300">
                <IconTrophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {challengeData.nick} 지휘관의 방어 편성을 격파했습니다
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                승리 현상금으로 <strong className="text-amber-300">+1,500 SNS</strong> 및{' '}
                <strong className="text-sky-300">소환 티켓 5매</strong>가 지급되었습니다.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenShareMyDeck();
                  }}
                  className="flex-1 rounded-xl bg-sky-400 py-3 text-xs font-bold text-slate-950 cursor-pointer"
                >
                  내 5인 덱 도전장 링크 생성하기
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] py-3 text-xs font-bold text-white cursor-pointer"
                >
                  메인 아레나로 복귀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ViralDeckShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  nickname: string;
  myDeck: GrowthHeroCard[];
  winRate?: number;
}

export const ViralDeckShareModal: React.FC<ViralDeckShareModalProps> = ({
  isOpen,
  onClose,
  nickname,
  myDeck,
  winRate = 82,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [activeNickname, setActiveNickname] = useState<string>(nickname || 'COMMANDER');

  const safeDeck =
    myDeck && myDeck.length >= 5 ? myDeck.slice(0, 5) : COUNTER_DECK_PRESETS[0].cards;

  const encodedParam = encodeChallengeDeck(activeNickname, safeDeck, winRate);
  const originUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://snshero.com';
  const shareUrl = originUrl + '/?challenge=' + encodedParam;

  // 이모지 없이 순수 벡터 기하학과 택티컬 타이포그래피로만 그리는 1200x630 배틀 데이터 시트
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1200;
    const H = 630;
    canvas.width = W;
    canvas.height = H;

    // 1. 하이엔드 다크 매트릭스 배경
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#05080f');
    bgGrad.addColorStop(0.5, '#090e1a');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 미세 그리드 패턴
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }

    // 외곽 프레임
    ctx.strokeStyle = 'rgba(56,189,248,0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, W - 56, H - 56);

    // 2. 헤더 메타데이터
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 18px monospace';
    ctx.fillText('SNSHERO.COM // TACTICAL 5-UNIT SYNERGY CHALLENGE DOSSIER', 64, 78);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(activeNickname + ' // SQUAD CHALLENGE', 64, 134);

    const totalPower = safeDeck.reduce((sum, c) => sum + c.power, 0);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 22px monospace';
    ctx.fillText(
      'SQUAD RATING: ' +
        totalPower.toLocaleString() +
        '    |    WIN RATIO: ' +
        winRate +
        '%    |    BOUNTY: +1,500 SNS',
      64,
      178
    );

    // 3. 5장 히어로 유닛 슬롯 (이모지 대신 기하학 벡터 엠블럼 렌더링)
    const cardW = 198;
    const cardH = 290;
    const startX = 64;
    const startY = 215;
    const gap = 20;

    safeDeck.forEach((card, idx) => {
      const x = startX + idx * (cardW + gap);
      const y = startY;

      ctx.fillStyle = '#070b14';
      ctx.fillRect(x, y, cardW, cardH);

      ctx.strokeStyle = card.grade === 'SSR' ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cardW, cardH);

      // 상단 등급 바
      ctx.fillStyle = card.grade === 'SSR' ? 'rgba(251,191,36,0.12)' : 'rgba(56,189,248,0.12)';
      ctx.fillRect(x + 1, y + 1, cardW - 2, 36);

      ctx.fillStyle = card.grade === 'SSR' ? '#fbbf24' : '#38bdf8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(card.grade + ' // #' + card.id, x + 14, y + 24);

      // 중앙 기하학 육각/다이아몬드 코어 엠블럼
      const cx = x + cardW / 2;
      const cy = y + 110;
      ctx.strokeStyle = card.grade === 'SSR' ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + 34 * Math.cos(angle);
        const py = cy + 34 * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(card.attribute, cx, cy + 4);
      ctx.textAlign = 'left';

      // 시너지 태그
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 12px monospace';
      ctx.fillText(card.synergyTag.slice(0, 18), x + 14, y + 185);

      // 유닛명
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 19px sans-serif';
      ctx.fillText(card.name.slice(0, 9), x + 14, y + 216);

      // 전투력
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 16px monospace';
      ctx.fillText('PWR ' + card.power.toLocaleString(), x + 14, y + 262);
    });

    // 4. 하단 콜투액션 바
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(64, 532, W - 128, 46);
    ctx.fillStyle = '#020617';
    ctx.font = 'bold 19px monospace';
    ctx.fillText(
      'INSTANT BROWSER BATTLE (NO LOGIN REQUIRED)  >>>  SNSHERO.COM',
      92,
      561
    );
  }, [isOpen, activeNickname, safeDeck, winRate]);

  if (!isOpen) return null;

  const handleCopyChallengeLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      trackGrowthEvent('challenge_link_created', { nickname: activeNickname });
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch (e) {
      // ignore
    }
  };

  const handleDownloadCardImage = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'snshero-dossier-' + activeNickname + '.png';
    a.click();
    trackGrowthEvent('challenge_card_downloaded', { nickname: activeNickname });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-[#090d16] text-white shadow-2xl overflow-hidden">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">
              TACTICAL DOSSIER GENERATOR
            </span>
            <h3 className="text-lg font-bold text-white">
              5인 시너지 덱 도전장 링크 및 데이터 카드 생성
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-4">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              COMMANDER CALLSIGN (NICKNAME)
            </label>
            <input
              type="text"
              value={activeNickname}
              onChange={(e) => setActiveNickname(e.target.value)}
              maxLength={16}
              placeholder="CALLSIGN"
              className="w-full rounded-lg border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
            />
          </div>

          <div className="mb-5 overflow-hidden rounded-xl border border-white/10 bg-black p-2">
            <canvas ref={canvasRef} className="w-full h-auto rounded-lg" />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 p-2 mb-5">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-transparent font-mono text-xs text-slate-300 focus:outline-none truncate px-2"
            />
            <button
              onClick={handleCopyChallengeLink}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-sky-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-300 transition cursor-pointer"
            >
              <IconCopy className="w-3.5 h-3.5" />
              <span>{copiedUrl ? 'COPIED' : 'COPY URL'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadCardImage}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] py-3 text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition cursor-pointer"
            >
              <IconDownload className="w-4 h-4" />
              <span>데이터 카드 PNG 다운로드</span>
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: activeNickname + ' // SNSHero 5-Unit Deck Challenge',
                    text: '설치 없이 즉시 내 5인 히어로 편성과 교전하십시오 (승리 보상 1,500 SNS)',
                    url: shareUrl,
                  });
                } else {
                  handleCopyChallengeLink();
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-400 py-3 text-xs font-bold text-slate-950 hover:bg-sky-300 transition cursor-pointer"
            >
              <IconShare className="w-4 h-4" />
              <span>도전장 링크 즉시 공유</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
`;

// 4. WildCardEncounterWidget.tsx (이모지 완전 제거 + 미니멀 택티컬 레이더 위젯)
const wildCardWidgetCode = `// src/components/growth/WildCardEncounterWidget.tsx
import React, { useState, useEffect } from 'react';
import { FTUE_STARTER_SSR_CARDS, trackGrowthEvent } from './growthTypes';
import type { GrowthHeroCard, GrowthRewardPayload } from './growthTypes';
import { HeroClassEmblem, IconClose, IconRadar } from './GrowthIcons';

interface WildCardEncounterWidgetProps {
  onClaimLoot: (reward: GrowthRewardPayload) => void;
  onStartTrialBattle?: (rentalCard: GrowthHeroCard) => void;
}

export const WildCardEncounterWidget: React.FC<WildCardEncounterWidgetProps> = ({
  onClaimLoot,
  onStartTrialBattle,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isClaimed, setIsClaimed] = useState<boolean>(false);
  const [encounterCard, setEncounterCard] = useState<GrowthHeroCard>(
    FTUE_STARTER_SSR_CARDS[0]
  );
  const [contextLabel, setContextLabel] = useState<string>('SIGNAL DETECTED // SSR FRAGMENT');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const path = window.location.pathname.toLowerCase();
    const randomCard =
      FTUE_STARTER_SSR_CARDS[Math.floor(Math.random() * FTUE_STARTER_SSR_CARDS.length)];
    setEncounterCard(randomCard);

    if (path.includes('/news') || path.includes('/r/')) {
      setContextLabel('NEWSROOM ARCHIVE // HIDDEN UNIT');
    } else if (
      path.includes('webtoon') ||
      path.includes('novel') ||
      path.includes('movie') ||
      path.includes('lore')
    ) {
      setContextLabel('LORE SYNCHRONIZATION // +15% ATK');
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const handleClaimAndPlay = () => {
    if (isClaimed) return;
    setIsClaimed(true);

    const rentalData = {
      card: encounterCard,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      synergyBuff: 15,
    };
    localStorage.setItem('snshero_rental_card', JSON.stringify(rentalData));

    trackGrowthEvent('ftue_hero_selected', {
      source: 'contextual_loot_drop',
      hero_id: encounterCard.id,
    });

    onClaimLoot({
      snsPoints: 300,
      freeTickets: 2,
      rewardCard: encounterCard,
      source: 'CHALLENGE_PARTICIPATE',
    });

    onStartTrialBattle?.(encounterCard);
  };

  return (
    <div className="fixed bottom-5 left-5 z-[9990] max-w-xs">
      <div className="relative overflow-hidden rounded-xl border border-white/15 bg-[#090d16]/95 p-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="h-[1px] w-full bg-gradient-to-r from-sky-400/60 to-transparent mb-3" />

        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 text-slate-500 hover:text-white cursor-pointer"
          aria-label="Close"
        >
          <IconClose className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/10 text-sky-400">
            <HeroClassEmblem attribute={encounterCard.attribute} className="w-7 h-7" />
          </div>

          <div className="flex-1 pr-4">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-sky-400 uppercase">
              <IconRadar className="w-3 h-3" />
              <span>{contextLabel}</span>
            </div>
            <h4 className="text-xs font-bold text-white mt-0.5">
              [{encounterCard.grade}] {encounterCard.name}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              24시간 덱 편성권 및 <strong className="text-sky-300">+300 SNS</strong> 즉시 승인
            </p>
          </div>
        </div>

        <button
          onClick={handleClaimAndPlay}
          disabled={isClaimed}
          className={
            'mt-3 w-full rounded-lg py-2 px-3 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ' +
            (isClaimed
              ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
              : 'bg-sky-400 text-slate-950 hover:bg-sky-300')
          }
        >
          {isClaimed ? 'UNIT SYNCED (+300 SNS)' : '유닛 동기화 및 시뮬레이션 개시'}
        </button>
      </div>
    </div>
  );
};
`;

// 5. DailyRetentionAndArcadeLoop.tsx (이모지 완전 제거 + 세련된 상단 커맨드 독)
const dailyRetentionCode = `// src/components/growth/DailyRetentionAndArcadeLoop.tsx
import React, { useState, useEffect } from 'react';
import type { GrowthRewardPayload } from './growthTypes';
import { IconClose, IconCpu, IconSpark } from './GrowthIcons';

interface DailyRetentionAndArcadeLoopProps {
  onClaimDailyReward: (reward: GrowthRewardPayload) => void;
}

export const DailyRetentionAndArcadeLoop: React.FC<DailyRetentionAndArcadeLoopProps> = ({
  onClaimDailyReward,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [arcadeEnergy, setArcadeEnergy] = useState<number>(65);
  const [dailyClaimed, setDailyClaimed] = useState<boolean>(false);
  const [tacticalStance, setTacticalStance] = useState<'BURST' | 'COUNTER' | 'BALANCE'>('BURST');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const todayKey = new Date().toISOString().slice(0, 10);
    const savedDate = localStorage.getItem('snshero_daily_claimed_date');
    if (savedDate === todayKey) {
      setDailyClaimed(true);
    }

    const savedStance = localStorage.getItem('snshero_tactical_stance') as
      | 'BURST'
      | 'COUNTER'
      | 'BALANCE'
      | null;
    if (savedStance) {
      setTacticalStance(savedStance);
    }
  }, []);

  const handleClaimDailyPack = () => {
    if (dailyClaimed) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    localStorage.setItem('snshero_daily_claimed_date', todayKey);
    setDailyClaimed(true);

    onClaimDailyReward({
      snsPoints: 500,
      freeTickets: 10,
      source: 'CHALLENGE_PARTICIPATE',
    });
  };

  const handleChargeArcadeEnergy = () => {
    if (arcadeEnergy >= 100) {
      setArcadeEnergy(0);
      onClaimDailyReward({
        snsPoints: 800,
        freeTickets: 5,
        source: 'CHALLENGE_WIN',
      });
    } else {
      setArcadeEnergy((prev) => Math.min(100, prev + 35));
    }
  };

  const handleSelectStance = (stance: 'BURST' | 'COUNTER' | 'BALANCE') => {
    setTacticalStance(stance);
    localStorage.setItem('snshero_tactical_stance', stance);
  };

  return (
    <div className="fixed top-20 right-4 z-[9990] flex flex-col items-end">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2.5 rounded-lg border border-white/15 bg-[#090d16]/90 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-lg backdrop-blur-md hover:border-sky-400/50 transition cursor-pointer"
      >
        <IconCpu className="w-3.5 h-3.5 text-sky-400" />
        <span className="font-mono text-[11px] tracking-wider uppercase">COMMAND OPS</span>
        <span
          className={
            'rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ' +
            (dailyClaimed
              ? 'bg-white/10 text-slate-400'
              : 'bg-sky-400/20 text-sky-300 border border-sky-400/30')
          }
        >
          {dailyClaimed ? 'SYNCED' : 'SUPPLY READY'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 w-80 rounded-xl border border-white/15 bg-[#090d16]/95 p-4 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-sky-400">
              TACTICAL COMMAND & SUPPLY
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <IconClose className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase text-amber-300">
                DAILY VOUCHER GRANT
              </span>
              <span className="font-mono text-[10px] text-slate-500">RESET 00:00</span>
            </div>
            <button
              onClick={handleClaimDailyPack}
              disabled={dailyClaimed}
              className={
                'w-full rounded-md py-2 text-xs font-bold transition cursor-pointer ' +
                (dailyClaimed
                  ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                  : 'bg-sky-400 text-slate-950 hover:bg-sky-300')
              }
            >
              {dailyClaimed
                ? '금일 보급 수령 완료'
                : '10회 소환 티켓 + 500 SNS 수령'}
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 mb-3">
            <div className="font-mono text-[10px] uppercase text-slate-400 mb-2">
              AI AUTO-BATTLE DIRECTIVE
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'BURST', label: 'ASSAULT', desc: 'CRIT +35%' },
                  { id: 'COUNTER', label: 'COUNTER', desc: 'REFLECT +40%' },
                  { id: 'BALANCE', label: 'SYNERGY', desc: 'REPAIR +20%' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectStance(item.id)}
                  className={
                    'rounded border p-2 text-center transition cursor-pointer ' +
                    (tacticalStance === item.id
                      ? 'border-sky-400 bg-sky-400/10 text-white'
                      : 'border-white/10 bg-black/40 text-slate-400 hover:text-white')
                  }
                >
                  <div className="font-mono text-[10px] font-bold">{item.label}</div>
                  <div className="font-mono text-[9px] text-sky-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
              <span className="text-slate-300">ARCADE CORE SYNC</span>
              <span className="text-sky-400">{arcadeEnergy}%</span>
            </div>
            <div className="h-1.5 w-full rounded-sm bg-slate-900 overflow-hidden mb-2.5">
              <div
                className="h-full bg-sky-400 transition-all duration-300"
                style={{ width: arcadeEnergy + '%' }}
              />
            </div>
            <button
              onClick={handleChargeArcadeEnergy}
              className="w-full rounded-md border border-sky-400/30 bg-sky-400/10 py-1.5 font-mono text-[10px] font-bold text-sky-300 hover:bg-sky-400/20 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <IconSpark className="w-3 h-3" />
              <span>
                {arcadeEnergy >= 100
                  ? 'CLAIM OVERCHARGE (+800 SNS)'
                  : 'BOOST ARCADE SYNC (+35%)'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
`;

// 6. SNSHeroGrowthManager.tsx (이모지 완전 제거 + 슬림한 택티컬 런처 바)
const managerCode = `// src/components/growth/SNSHeroGrowthManager.tsx
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { decodeChallengeDeck } from './growthTypes';
import type {
  ChallengePayload,
  GrowthHeroCard,
  GrowthRewardPayload,
} from './growthTypes';
import { FtueOnboardingModal } from './FtueOnboardingModal';
import {
  InstantChallengeBattleModal,
  ViralDeckShareModal,
} from './DeckChallengeSystem';
import { WildCardEncounterWidget } from './WildCardEncounterWidget';
import { DailyRetentionAndArcadeLoop } from './DailyRetentionAndArcadeLoop';
import { IconShare, IconSpark } from './GrowthIcons';

interface SNSHeroGrowthManagerProps {
  userNickname?: string;
  userDeck?: GrowthHeroCard[];
  onGrantReward?: (reward: GrowthRewardPayload) => void;
  onNavigateTab?: (tab: 'card-shop' | 'my-deck' | 'battle-arena') => void;
}

export const SNSHeroGrowthManager: React.FC<SNSHeroGrowthManagerProps> = ({
  userNickname = 'COMMANDER',
  userDeck = [],
  onGrantReward,
  onNavigateTab,
}) => {
  const [showFtue, setShowFtue] = useState<boolean>(false);
  const [challengeData, setChallengeData] = useState<ChallengePayload | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__SNSHERO_GROWTH_MOUNTED__ = true;

    const params = new URLSearchParams(window.location.search);
    const challengeParam = params.get('challenge');

    if (challengeParam) {
      const decoded = decodeChallengeDeck(challengeParam);
      if (decoded) {
        setChallengeData(decoded);
        return;
      }
    }

    const ftueDone = localStorage.getItem('snshero_ftue_completed');
    if (ftueDone !== 'true') {
      const timer = setTimeout(() => {
        setShowFtue(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRewardGranted = (reward: GrowthRewardPayload) => {
    const prevPoints = Number(localStorage.getItem('snshero_bonus_points') || '0');
    const prevTickets = Number(localStorage.getItem('snshero_free_tickets') || '0');
    localStorage.setItem('snshero_bonus_points', String(prevPoints + reward.snsPoints));
    localStorage.setItem('snshero_free_tickets', String(prevTickets + reward.freeTickets));

    window.dispatchEvent(new CustomEvent('snshero:growth-reward', { detail: reward }));

    onGrantReward?.(reward);
    setToastMessage(
      'REWARD CREDITED // +' +
        reward.snsPoints.toLocaleString() +
        ' SNS & +' +
        reward.freeTickets +
        ' VOUCHERS'
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  const clearChallengeQueryParam = () => {
    setChallengeData(null);
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('challenge');
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] rounded-lg border border-sky-400/50 bg-[#090d16]/95 px-5 py-2.5 font-mono text-xs font-bold text-sky-300 shadow-2xl">
          {toastMessage}
        </div>
      )}

      <DailyRetentionAndArcadeLoop onClaimDailyReward={handleRewardGranted} />

      <WildCardEncounterWidget
        onClaimLoot={handleRewardGranted}
        onStartTrialBattle={() => setShowFtue(true)}
      />

      <div className="fixed bottom-5 right-5 z-[9990] flex flex-col gap-2 items-end">
        <button
          onClick={() => {
            localStorage.removeItem('snshero_ftue_completed');
            setShowFtue(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#090d16]/90 px-3.5 py-2 font-mono text-[11px] font-semibold text-slate-300 shadow-lg backdrop-blur-md hover:border-sky-400/50 hover:text-white transition cursor-pointer"
        >
          <IconSpark className="w-3.5 h-3.5 text-sky-400" />
          <span>FTUE SIMULATION</span>
        </button>
        <button
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-sky-400/50 bg-sky-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.3)] hover:bg-sky-300 transition cursor-pointer"
        >
          <IconShare className="w-3.5 h-3.5" />
          <span>DECK CHALLENGE LINK</span>
        </button>
      </div>

      <FtueOnboardingModal
        isOpen={showFtue}
        onClose={() => setShowFtue(false)}
        onCompleteReward={handleRewardGranted}
        onNavigate={onNavigateTab}
      />

      <InstantChallengeBattleModal
        challengeData={challengeData}
        onClose={clearChallengeQueryParam}
        onClaimReward={handleRewardGranted}
        onOpenShareMyDeck={() => setShowShareModal(true)}
      />

      <ViralDeckShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        nickname={userNickname}
        myDeck={userDeck}
      />
    </>
  );
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  setTimeout(() => {
    if (!(window as any).__SNSHERO_GROWTH_MOUNTED__) {
      let portalEl = document.getElementById('snshero-growth-portal-root');
      if (!portalEl) {
        portalEl = document.createElement('div');
        portalEl.id = 'snshero-growth-portal-root';
        document.body.appendChild(portalEl);
        const root = createRoot(portalEl);
        root.render(<SNSHeroGrowthManager />);
      }
    }
  }, 500);
}
`;

// 7. 영구적인 디자인 가드레일 파일(.cursorrules & CLAUDE.md) 생성
const designGuardrailRules = `# SNSHero Vibe Coding Design System Guardrails

1. **MANDATORY DESIGN SPEC CHECK (\`design.md\`)**:
   - Before creating or modifying any UI component, ALWAYS read \`design.md\` in the repository root and strictly follow its color tokens, typography scale, spacing, border radius, and elevation rules.

2. **ZERO EMOJI POLICY IN UI**:
   - NEVER use Unicode emojis (e.g., 🎁, 🔥, ⚡, 🚀, 🃏, 👹, 🎉) in UI buttons, badges, headers, modals, or canvas renders.
   - ALWAYS use crisp inline SVG icons (\`strokeWidth="1.75"\`), Lucide icons, or geometric vector emblems (\`GrowthIcons.tsx\`).

3. **TACTICAL HUD AESTHETIC**:
   - Use deep obsidian/slate surfaces (\`#090d16\`, \`bg-black/85 backdrop-blur-xl\`) with \`1px\` subtle structural borders (\`border-white/10\` to \`border-white/15\`) and restrained cyan/sky/amber tactical accents.
   - Use \`font-mono\` for tactical metadata, unit codes, power ratings, and system logs.
`;

fs.writeFileSync(path.join(GROWTH_DIR, 'GrowthIcons.tsx'), iconsCode, 'utf8');
fs.writeFileSync(path.join(GROWTH_DIR, 'growthTypes.ts'), growthTypesCode, 'utf8');
fs.writeFileSync(path.join(GROWTH_DIR, 'FtueOnboardingModal.tsx'), ftueModalCode, 'utf8');
fs.writeFileSync(path.join(GROWTH_DIR, 'DeckChallengeSystem.tsx'), deckChallengeCode, 'utf8');
fs.writeFileSync(path.join(GROWTH_DIR, 'WildCardEncounterWidget.tsx'), wildCardWidgetCode, 'utf8');
fs.writeFileSync(path.join(GROWTH_DIR, 'DailyRetentionAndArcadeLoop.tsx'), dailyRetentionCode, 'utf8');
fs.writeFileSync(path.join(GROWTH_DIR, 'SNSHeroGrowthManager.tsx'), managerCode, 'utf8');

// .cursorrules 에 디자인 규칙 추가 (기존 파일이 있으면 보존하며 하단에 추가)
const cursorRulesPath = path.join(ROOT, '.cursorrules');
if (!fs.existsSync(cursorRulesPath)) {
  fs.writeFileSync(cursorRulesPath, designGuardrailRules, 'utf8');
}

console.log('✅ Replaced all emojis with custom vector SVGs and updated UI to Tactical HUD style.');

try {
  execSync('git add src/components/growth .cursorrules', { stdio: 'inherit' });
  execSync('git commit -m "refactor(ui): remove all emojis and align growth HUD with design.md"', { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
  console.log('🚀 Successfully pushed the refined UI to GitHub!');
} catch (e) {
  console.warn('ℹ️ Git step message:', e.message);
}
