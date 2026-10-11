/**
 * SNSHero Smart Loop Feature Demo Tour Service
 * 
 * 자동 플레이(스마트 루프) 시 랭킹대전 > 상점 > 마이덱의 단순 반복을 탈피하여,
 * 랭킹대전 복귀 전 낮은 확률(약 35%)로 SNSHero의 다양한 핵심 기능 화면들을
 * 유저에게 시연/소개(Tour)한 후 다시 랭킹대전으로 자동 복귀시키는 서비스.
 */

export interface DemoTourFeature {
  viewId: string;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  badge: string;
}

export const DEMO_TOUR_FEATURES: DemoTourFeature[] = [
  {
    viewId: 'novel',
    titleKo: '📚 웹소설 라운지',
    titleEn: '📚 Web Novel Lounge',
    descKo: 'AI가 실시간 집필하는 카단 유니버스 오리지널 웹소설 & 에피소드 감상!',
    descEn: 'Original web novels and stories set in the Kadan universe!',
    badge: 'STORY'
  },
  {
    viewId: 'webtoon',
    titleKo: '🎨 웹툰 스튜디오',
    titleEn: '🎨 Webtoon Studio',
    descKo: '히어로들의 역동적인 스토리라인을 고화질 웹툰으로 감상하는 공간!',
    descEn: 'Enjoy the heroes’ storyline in high-definition webtoons!',
    badge: 'CARTOON'
  },
  {
    viewId: 'stock-market',
    titleKo: '📈 SNS 주식 거래소',
    titleEn: '📈 SNS Stock Market',
    descKo: '히어로 팩션별 실시간 모의 주식 거래와 배당 수익 시스템!',
    descEn: 'Real-time faction stock trading and dividend yield system!',
    badge: 'FINANCE'
  },
  {
    viewId: 'card-marketplace',
    titleKo: '💼 카드 P2P 거래소',
    titleEn: '💼 Card P2P Market',
    descKo: '전 세계 플레이어들과 실시간으로 카드를 사고파는 분산형 거래소!',
    descEn: 'Trade rare cards with players around the globe in real time!',
    badge: 'MARKET'
  },
  {
    viewId: 'prediction-market',
    titleKo: '🎯 승부 예측 시장',
    titleEn: '🎯 Prediction Market',
    descKo: '글로벌 스포츠 경기와 히어로 리그의 승패를 예측하고 베팅하는 마켓!',
    descEn: 'Predict outcomes and bet on global sports matches and hero leagues!',
    badge: 'PREDICT'
  },
  {
    viewId: 'season-hub',
    titleKo: '🌟 시즌 허브 & 패스',
    titleEn: '🌟 Season Hub & Pass',
    descKo: '시즌 퀘스트 진행도 확인, 배틀패스 티어 보상 및 한정판 스킨 획득!',
    descEn: 'Track season progress and unlock exclusive Battle Pass rewards!',
    badge: 'SEASON'
  },
  {
    viewId: 'ranking',
    titleKo: '🏆 명예의 전당 (랭킹)',
    titleEn: '🏆 Hall of Fame (Ranking)',
    descKo: '전 세계 상위 랭커들의 덱 분석, 전적 통계 및 글로벌 리더보드!',
    descEn: 'Analyze top players’ decks and track global leaderboards!',
    badge: 'LEADERBOARD'
  },
  {
    viewId: 'boost',
    titleKo: '⚡ 부스트 & 행운 복권',
    titleEn: '⚡ Boost & Daily Lottery',
    descKo: '출석체크, 걸음수 보상, 행운의 황금 복권으로 대량의 SNS 포인트 획득!',
    descEn: 'Earn massive SNS points with check-ins, step rewards, and lotteries!',
    badge: 'REWARD'
  },
  {
    viewId: 'god',
    titleKo: '🌌 신전 (판테온)',
    titleEn: '🌌 Temple of Gods',
    descKo: '팩션 수호신들의 축복과 가호를 받고 특별 능력치를 개방하는 신전!',
    descEn: 'Receive blessings from faction guardian gods and unlock divine powers!',
    badge: 'PANTHEON'
  },
  {
    viewId: 'community',
    titleKo: '💬 히어로 커뮤니티',
    titleEn: '💬 Hero Community',
    descKo: '전략 덱 자랑, 카드 토론 및 실시간 공략 공유 라운지!',
    descEn: 'Share deck strategies, discuss cards, and exchange tips in real time!',
    badge: 'SOCIAL'
  }
];

const TOUR_TRIGGER_PROBABILITY = 0.35; // 약 35% 확률로 기능 데모 투어 발동

/**
 * 데모 투어를 발동할지 여부 결정
 */
export function shouldTriggerDemoTour(): boolean {
  try {
    const isAutoLoopRanking = localStorage.getItem('hero_auto_loop_is_ranking') === 'true';
    if (!isAutoLoopRanking) return false;

    // 이미 투어 중인 경우 중복 트리거 방지
    const currentMode = localStorage.getItem('hero_auto_loop_mode');
    if (currentMode === 'demo_tour') return false;

    // 35% 확률 검사
    return Math.random() < TOUR_TRIGGER_PROBABILITY;
  } catch {
    return false;
  }
}

/**
 * 다음으로 소개할 화면을 순환(Round-Robin) 방식으로 선택
 */
export function getNextTourFeature(): DemoTourFeature {
  try {
    const lastIdxStr = localStorage.getItem('hero_auto_loop_last_tour_idx');
    let nextIdx = 0;
    if (lastIdxStr !== null) {
      nextIdx = (parseInt(lastIdxStr, 10) + 1) % DEMO_TOUR_FEATURES.length;
    } else {
      nextIdx = Math.floor(Math.random() * DEMO_TOUR_FEATURES.length);
    }
    localStorage.setItem('hero_auto_loop_last_tour_idx', String(nextIdx));
    return DEMO_TOUR_FEATURES[nextIdx];
  } catch {
    return DEMO_TOUR_FEATURES[0];
  }
}

/**
 * 현재 활성 데모 투어 정보 가져오기
 */
export function getActiveTourFeature(viewId?: string): DemoTourFeature | null {
  try {
    const targetView = viewId || localStorage.getItem('hero_auto_loop_tour_view');
    if (!targetView) return null;
    return DEMO_TOUR_FEATURES.find(f => f.viewId === targetView) || null;
  } catch {
    return null;
  }
}

/**
 * 신규 기능 화면 데모 투어 시작
 */
export function startDemoTour(onNavigate: (view: string) => void): DemoTourFeature {
  const feature = getNextTourFeature();
  try {
    localStorage.setItem('hero_auto_loop_mode', 'demo_tour');
    localStorage.setItem('hero_auto_loop_tour_view', feature.viewId);
    localStorage.setItem('hero_auto_loop_is_ranking', 'true');
    window.dispatchEvent(new CustomEvent('snshero_demo_tour_start', { detail: feature }));
  } catch (e) {
    console.error('Failed to start demo tour', e);
  }
  onNavigate(feature.viewId);
  return feature;
}

/**
 * 조건에 따라 투어를 시작하거나, 아니면 랭킹 대전으로 바로 복귀
 * @returns boolean 투어가 시작되었으면 true, 바로 랭킹대전으로 갔으면 false
 */
export function maybeTriggerTourOrProceedToBattle(onNavigate: (view: string) => void): boolean {
  if (shouldTriggerDemoTour()) {
    startDemoTour(onNavigate);
    return true;
  } else {
    try {
      localStorage.removeItem('hero_auto_loop_mode');
      localStorage.removeItem('hero_auto_loop_tour_view');
      localStorage.setItem('hero_auto_loop_is_ranking', 'true');
    } catch {}
    onNavigate('card-play');
    return false;
  }
}

/**
 * 데모 투어 종료 처리
 * @param stayHere true면 자동플레이를 끄고 현재 화면에 머묾, false면 랭킹대전으로 복귀
 */
export function endDemoTour(onNavigate: (view: string) => void, stayHere = false): void {
  try {
    localStorage.removeItem('hero_auto_loop_mode');
    localStorage.removeItem('hero_auto_loop_tour_view');
    window.dispatchEvent(new Event('snshero_demo_tour_end'));

    if (stayHere) {
      localStorage.removeItem('hero_auto_loop_is_ranking');
    } else {
      localStorage.setItem('hero_auto_loop_is_ranking', 'true');
      onNavigate('card-play');
    }
  } catch (e) {
    console.error('Failed to end demo tour', e);
    if (!stayHere) {
      onNavigate('card-play');
    }
  }
}
