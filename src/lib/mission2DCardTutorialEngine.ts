/**
 * Mission2DCardTutorialEngine.ts
 * 3-Step Interactive Onboarding & Guide Engine for 2D Mission Games
 * 
 * Features:
 * - 3-step illustrated onboarding for 2D card/puzzle/arcade games:
 *   1. Board Objective & Core Rules
 *   2. Card Drag / Touch Gesture Placement
 *   3. Guaranteed Instant SNS Wallet Payouts & Multipliers
 * - LocalStorage persistence (`hero_tutorial_game_2d_{gameId}`)
 * - Quick-access tooltip & help guide state management
 */

import { TutorialStep } from '../components/UniversalTutorialModal';

export type Game2DType = 
  | 'card_rush'
  | 'card_flip'
  | 'card_slot'
  | 'card_sorcery'
  | 'card_tap'
  | 'card_heist'
  | 'card_slide'
  | 'card_jumper'
  | 'card_match'
  | 'card_tower'
  | 'card_puzzle'
  | 'generic_2d';

export interface Game2DConfig {
  id: string;
  nameKo: string;
  nameEn: string;
  type: Game2DType;
  objectiveKo: string;
  objectiveEn: string;
  controlsKo: string[];
  controlsEn: string[];
  rewardTipKo: string;
  rewardTipEn: string;
}

export const GAME_2D_REGISTRY: Record<string, Game2DConfig> = {
  card_rush: {
    id: 'card_rush',
    nameKo: '카드 러시 배틀',
    nameEn: 'Card Rush Battle',
    type: 'card_rush',
    objectiveKo: '제한 시간 내에 쏟아지는 몬스터 카드 속성을 파악하여 상성 카드로 빠르게 카운터 어택하세요.',
    objectiveEn: 'Analyze incoming monster card elements and rapidly counter with advantageous synergy cards.',
    controlsKo: [
      '👆 탭 / 드래그: 상성 카드 선택 및 슬롯 배치',
      '⚡ 콤보 연타: 빠른 상성 격파 시 콤보 게이지 상승',
      '🛡️ 스킬 발동: 하단 에너지 가득 찰 시 필살기 터치'
    ],
    controlsEn: [
      '👆 Tap / Drag: Select and place counter cards',
      '⚡ Combo Streak: Fast element counters build fever',
      '🛡️ Ultimate: Tap special burst when gauge fills'
    ],
    rewardTipKo: '연속 10콤보 이상 달성 시 퍼펙트 보너스 최대 +80 SNS 추가 지급!',
    rewardTipEn: 'Reach 10+ combo streak for up to +80 SNS perfect clear bonus!'
  },
  card_flip: {
    id: 'card_flip',
    nameKo: '카드 플립 메모리',
    nameEn: 'Card Flip Memory',
    type: 'card_flip',
    objectiveKo: '뒤집힌 카드들을 기억하여 동일한 영웅 카드 짝을 맞춰 보드를 완전히 클리어하세요.',
    objectiveEn: 'Memorize hidden card pairs and match all identical hero cards to clear the board.',
    controlsKo: [
      '👆 카드 탭: 2장의 카드를 뒤집어 일치 여부 확인',
      '⚡ 빠른 매칭: 3초 내 연속 성공 시 더블 점수 획득',
      '💡 힌트 사용: 상단 돋보기로 일시적 전체 카드 투시'
    ],
    controlsEn: [
      '👆 Tap Card: Flip 2 cards to verify matching pair',
      '⚡ Quick Match: Match within 3s for double points',
      '💡 Hint: Tap magnifier to peek all cards temporarily'
    ],
    rewardTipKo: '오답 횟수 3회 이하로 올클리어 시 퍼펙트 +100 SNS 확정 입금!',
    rewardTipEn: 'Clear with under 3 mistakes for guaranteed +100 SNS bonus!'
  },
  card_slot: {
    id: 'card_slot',
    nameKo: '카드 럭키 슬롯',
    nameEn: 'Card Lucky Slot',
    type: 'card_slot',
    objectiveKo: '3줄 슬롯을 회전시켜 동일한 영웅 엠블럼 또는 트리플 럭키 라인을 정렬하세요.',
    objectiveEn: 'Spin the 3-reel slot to align matching hero emblems or jackpot paylines.',
    controlsKo: [
      '👆 스핀 레버 터치: 릴 고속 회전 시작',
      '⚡ 스탑 버튼 탭: 원하는 타이밍에 각 릴 멈춤',
      '🔥 피버 모드: 황금 영웅 3개 정렬 시 10배 잭팟'
    ],
    controlsEn: [
      '👆 Tap Spin Lever: Start high-speed reel rotation',
      '⚡ Tap Stop: Stop individual reels on target timing',
      '🔥 Fever Jackpot: Match 3 golden heroes for 10x payout'
    ],
    rewardTipKo: '잭팟 당첨 시 회당 최대 260 SNS 포인트 즉시 지갑 정산!',
    rewardTipEn: 'Hit the jackpot for instant max 260 SNS deposit to wallet!'
  },
  card_sorcery: {
    id: 'card_sorcery',
    nameKo: '카드 소서리 아케인',
    nameEn: 'Card Sorcery Arcane',
    type: 'card_sorcery',
    objectiveKo: '원소 마법 룬을 조합하여 상급 마법을 시전하고 아케인 보스를 격파하세요.',
    objectiveEn: 'Combine elemental magic runes to cast high-tier spells and defeat arcane bosses.',
    controlsKo: [
      '👆 룬 드래그: 화면 중앙 마법진으로 룬 연결',
      '⚡ 속성 콤비네이션: 화염+바람 조합 시 광역 폭발',
      '🛡️ 마나 쉴드: 적 공격 턴에 방어 룬 터치'
    ],
    controlsEn: [
      '👆 Drag Rune: Connect runes to central magic circle',
      '⚡ Element Combo: Fire + Wind triggers explosive AoE',
      '🛡️ Mana Shield: Tap defense rune during enemy turn'
    ],
    rewardTipKo: '보스 약점 속성 공략 시 스피드 클리어 +70 SNS 추가 정산!',
    rewardTipEn: 'Exploit boss weaknesses for speedrun bonus +70 SNS!'
  },
  card_tap: {
    id: 'card_tap',
    nameKo: '카드 탭 리듬 배틀',
    nameEn: 'Card Tap Rhythm Battle',
    type: 'card_tap',
    objectiveKo: '리듬에 맞춰 판정 라인에 도달하는 카드를 정확한 타이밍에 탭하여 퍼펙트 스코어를 만드세요.',
    objectiveEn: 'Tap cards reaching the judgment line in sync with the beat for perfect scores.',
    controlsKo: [
      '👆 터치 라인 탭: 타이밍 바가 겹칠 때 정확히 탭',
      '⚡ 롱 노트 홀드: 긴 카드는 손을 떼지 않고 유지',
      '💨 슬라이드 플릭: 화살표 카드는 방향대로 스와이프'
    ],
    controlsEn: [
      '👆 Tap Line: Tap precisely when timing bar aligns',
      '⚡ Long Note: Hold your finger down for continuous score',
      '💨 Slide Flick: Swipe in the arrow direction'
    ],
    rewardTipKo: '퍼펙트 판정 90% 이상 시 최대 난이도 배율 1.5x 적용!',
    rewardTipEn: 'Achieve 90%+ Perfect rate for max 1.5x difficulty multiplier!'
  },
  card_heist: {
    id: 'card_heist',
    nameKo: '카드 하이스트 탈출',
    nameEn: 'Card Heist Infiltration',
    type: 'card_heist',
    objectiveKo: '경비망과 레이저를 피해 금고 속 보물 카드를 훔치고 비상 탈출구로 무사히 빠져나가세요.',
    objectiveEn: 'Infiltrate the vault, bypass laser security, steal the target card, and reach the extraction zone.',
    controlsKo: [
      '👆 스와이프 / 탭: 플레이어 잠입 이동',
      '⚡ 은신 모드: 경비 감시 시야 회피',
      '💎 금고 해킹: 암호 핀 순차 입력'
    ],
    controlsEn: [
      '👆 Swipe / Tap: Stealth movement',
      '⚡ Invisibility: Avoid guard vision cones',
      '💎 Vault Hack: Solve pin sequence'
    ],
    rewardTipKo: '경보 미작동 스텔스 탈출 시 퍼펙트 +90 SNS 추가 지급!',
    rewardTipEn: 'No-alarm stealth escape grants +90 SNS perfect infiltration bonus!'
  },
  card_slide: {
    id: 'card_slide',
    nameKo: '카드 슬라이드 퍼즐',
    nameEn: 'Card Slide Puzzle',
    type: 'card_slide',
    objectiveKo: '빈칸을 활용해 카드 타일들을 순서대로 밀어서 원래의 히어로 일러스트를 완성하세요.',
    objectiveEn: 'Slide card tiles sequentially using the empty cell to restore the full hero artwork.',
    controlsKo: [
      '👆 타일 탭: 빈칸과 인접한 타일 즉시 밀기',
      '⚡ 연속 슬라이드: 한 번의 스와이프로 라인 일괄 이동',
      '💡 완성 미리보기: 상단 미니맵으로 원본 확인'
    ],
    controlsEn: [
      '👆 Tap Tile: Slide tile into adjacent empty slot',
      '⚡ Multi-Slide: Swipe lines to move multiple tiles',
      '💡 Preview: Check thumbnail for full portrait target'
    ],
    rewardTipKo: '최소 이동 수 달성 시 스피드런 보너스 +60 SNS!',
    rewardTipEn: 'Clear with optimal moves for +60 SNS speedrun bonus!'
  },
  card_jumper: {
    id: 'card_jumper',
    nameKo: '카드 점퍼 스카이',
    nameEn: 'Card Jumper Sky Climb',
    type: 'card_jumper',
    objectiveKo: '좌우 탭으로 발판 카드를 밟고 끊임없이 위로 뛰어올라 최고 고도를 달성하세요.',
    objectiveEn: 'Jump continuously on platform cards to reach maximum height and collect rewards.',
    controlsKo: [
      '👆 좌/우 화면 탭: 해당 방향으로 점프 도약',
      '⚡ 슈퍼 스프링: 황금 카드 밟을 시 초고속 수직 도약',
      '🛡️ 파괴 발판 주의: 붉은 카드는 1회 밟은 후 소멸'
    ],
    controlsEn: [
      '👆 Left/Right Tap: Jump in target direction',
      '⚡ Super Spring: Golden cards give massive boost',
      '🛡️ Fragile Tiles: Red cards break after 1 landing'
    ],
    rewardTipKo: '100m 돌파 시마다 +20 SNS 보너스 즉시 적립!',
    rewardTipEn: 'Every 100m climbed awards +20 SNS instantly!'
  }
};

export const get2DGameTutorialSteps = get2DTutorialSteps;

/**
 * Returns a 3-step tutorial step array for a given 2D game
 */
export function get2DTutorialSteps(gameId: string, language: string | boolean = 'ko'): TutorialStep[] {
  const isKo = typeof language === 'boolean' ? language : language === 'ko';
  const config = GAME_2D_REGISTRY[gameId] || {
    id: gameId,
    nameKo: '2D 미션 게임',
    nameEn: '2D Mission Game',
    type: 'generic_2d',
    objectiveKo: '규칙에 맞춰 퍼즐 및 카드를 조작하여 목표 점수를 달성하세요.',
    objectiveEn: 'Manipulate cards and solve puzzles to achieve the target score.',
    controlsKo: [
      '👆 원터치 / 드래그: 카드 선택 및 이동',
      '⚡ 콤보 연계: 연속 정답 시 추가 점수 배율',
      '🛡️ 일시정지 / 가이드: 상단 버튼으로 상시 확인'
    ],
    controlsEn: [
      '👆 One-Touch / Drag: Select and move cards',
      '⚡ Combo Streak: Chaining correct actions multiplies score',
      '🛡️ Pause / Help: Check rules anytime via top bar'
    ],
    rewardTipKo: '클리어 즉시 분당 50P 표준 및 성과 보너스가 지갑에 100% 확정 입금됩니다.',
    rewardTipEn: 'Instant ~50P/min standard + skill bonus deposited to your wallet on victory.'
  };

  return [
    {
      badge: isKo ? 'STEP 1: 미션 목표' : 'STEP 1: MISSION GOAL',
      title: isKo ? `${config.nameKo} 규칙` : `${config.nameEn} Rules`,
      description: isKo ? config.objectiveKo : config.objectiveEn,
      keyPoints: isKo
        ? [
            '제한 시간 내 목표 스코어 달성 시 승리',
            '판정 및 상성에 따라 고득점 콤보 부여',
            '실수 최소화 시 랭킹 및 보너스 포인트 상승'
          ]
        : [
            'Clear the objective before the time limit',
            'Chain combos for progressive multiplier bonuses',
            'Minimize errors to maximize score & SNS payout'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 간편 원터치 조작' : 'STEP 2: 1-TOUCH CONTROLS',
      title: isKo ? '모바일 원터치 제스처' : 'Mobile 1-Touch Gestures',
      description: isKo
        ? '복잡한 조작 없이 한 손으로 직관적인 탭과 드래그만으로 플레이할 수 있습니다.'
        : 'Play seamlessly with single-finger taps and smooth drag gestures without clutter.',
      keyPoints: isKo ? config.controlsKo : config.controlsEn,
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED SNS REWARDS',
      title: isKo ? '즉시 지갑 입금 및 보너스' : 'Instant Wallet Settlement',
      description: isKo ? config.rewardTipKo : config.rewardTipEn,
      keyPoints: isKo
        ? [
            '승리 즉시 유저 지갑으로 100% 확정 입금',
            '기본 플레이 시간 + 스코어/콤보 보너스 종합 정산',
            '일일 퀘스트 및 시즌 미션 자동 카운트'
          ]
        : [
            '100% guaranteed deposit to your in-game wallet',
            'Itemized duration + score/combo performance bonus',
            'Automatically advances daily quests & season missions'
          ],
      iconType: 'REWARDS'
    }
  ];
}

/**
 * Checks if the user has completed or skipped the tutorial for this 2D game
 */
export function hasSeen2DTutorial(gameId: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(`hero_tutorial_game_2d_${gameId}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Marks the tutorial as completed
 */
export function mark2DTutorialCompleted(gameId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`hero_tutorial_game_2d_${gameId}`, 'true');
  } catch {
    // ignore
  }
}
