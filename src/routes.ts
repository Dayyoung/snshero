import type { ViewType, Language } from './types';

export interface RouteMeta {
  path: string;
  aliases?: string[];
  titleKo: string;
  titleEn: string;
  descriptionKo: string;
  descriptionEn: string;
}

export const VIEW_ROUTES: Record<ViewType, RouteMeta> = {
  home: {
    path: '/home',
    aliases: ['/'],
    titleKo: 'SNS히어로 (SNSHero) - 원클릭 AI 웹 카드 게임',
    titleEn: 'SNSHero - One-Click AI Web Card Game',
    descriptionKo: '복잡한 가입 없이 클릭 한 번으로 시작하는 AI 웹 카드 게임 SNS히어로 로비입니다.',
    descriptionEn: 'Start instantly with one click. Collect 110+ hero cards with AI battles.',
  },
  main: {
    path: '/main',
    titleKo: '카단과 아케인의 메아리 - 메인 RPG',
    titleEn: 'Kadan & Arcane Echoes - Main RPG',
    descriptionKo: '카단이 소설 속 지도를 자동으로 이동하며 대화, 카드 전투, 보상 획득을 진행하는 메인 RPG 모드입니다.',
    descriptionEn: 'Explore the map, battle AI enemies, and experience the epic RPG storyline.',
  },
  mydeck: {
    path: '/deck',
    aliases: ['/mydeck'],
    titleKo: '마이덱 (My Deck) - SNS히어로 카드 컬렉션',
    titleEn: 'My Deck - SNSHero Card Collection',
    descriptionKo: '수집한 영웅 카드 덱을 구성하고 강력한 장비를 장착하여 나만의 최강 시너지 조합을 설계하세요.',
    descriptionEn: 'Manage your card deck, equip items, and optimize your battle synergy.',
  },
  play: {
    path: '/play',
    titleKo: '배틀 대전 (Play Battle) - SNS히어로 실시간 카드 배틀',
    titleEn: 'Battle Arena (Play) - SNSHero Real-Time Card Battle',
    descriptionKo: '인공지능(AI) 라이벌과 대적하여 실시간 자동 전투를 벌이고 랭킹 포인트와 명예를 획득하세요.',
    descriptionEn: 'Battle AI rivals in real-time card matches and earn ranking points.',
  },
  'card-play': {
    path: '/card-play',
    aliases: ['/card-battle', '/mobile-card-battle'],
    titleKo: '모바일 카드 플레이 (Mobile Card Play) - SNS히어로',
    titleEn: 'Mobile Card Play - SNSHero',
    descriptionKo: '모바일 환경에 최적화된 심플 원화면 카드 대결 화면입니다.',
    descriptionEn: 'Mobile-dedicated single-screen card battle arena.',
  },
  shop: {
    path: '/shop',
    titleKo: '카드 상점 (Shop) - SNS히어로 카드 및 스킨 뽑기',
    titleEn: 'Shop - SNSHero Card & Skin Gacha',
    descriptionKo: 'SNS 포인트를 사용하여 등급별 카드를 소환하고 컬렉션을 완성하세요.',
    descriptionEn: 'Summon cards and skins with SNS points or crypto.',
  },
  event: {
    path: '/event',
    titleKo: '특별 이벤트 홀 (Event) - SNS히어로',
    titleEn: 'Special Events - SNSHero',
    descriptionKo: '시간의 나무 무료 충전과 럭키 룰렛, 크레인 인형뽑기 등 특별 이벤트를 즐기세요.',
    descriptionEn: 'Enjoy special events, roulette, and claw machines for rich rewards.',
  },
  setting: {
    path: '/setting',
    aliases: ['/settings'],
    titleKo: '설정 (Settings) - SNS히어로 게임 환경설정',
    titleEn: 'Settings - SNSHero',
    descriptionKo: '배경음악, 볼륨 조절 및 데이터 연동, 다국어 설정을 손쉽게 변경하세요.',
    descriptionEn: 'Adjust BGM, sound effects, language, and account settings.',
  },
  ranking: {
    path: '/ranking',
    titleKo: '랭킹대전 (Ranking) - SNS히어로',
    titleEn: 'Rankings - SNSHero Leaderboard',
    descriptionKo: 'SNS히어로 랭킹 경쟁에서 다른 헌터의 덱과 전투력을 비교하고 도전하세요.',
    descriptionEn: 'Compare total power and battle top hunters on the leaderboard.',
  },
  companion: {
    path: '/companion',
    titleKo: '히어로 육성 (Companion) - SNS히어로',
    titleEn: 'Companion Growth - SNSHero',
    descriptionKo: '동료 히어로를 성장시키고 장비를 관리하여 덱 전투력을 강화하세요.',
    descriptionEn: 'Level up companion heroes and enhance their stats.',
  },
  profile: {
    path: '/profile',
    titleKo: '프로필 (Profile) - SNS히어로',
    titleEn: 'Profile - SNSHero',
    descriptionKo: '닉네임과 아바타를 설정하고 나만의 헌터 프로필을 관리하세요.',
    descriptionEn: 'Customize your nickname, avatar, and view your battle stats.',
  },
  skill: {
    path: '/skill',
    aliases: ['/skills'],
    titleKo: '스킬 강화 (Skills) - SNS히어로',
    titleEn: 'Skills - SNSHero',
    descriptionKo: '스킬 포인트를 투자해 카드 능력을 강화하고 전술 효율을 높이세요.',
    descriptionEn: 'Upgrade grid skills and enhance tactical battle advantages.',
  },
  'guild-list': {
    path: '/guild-list',
    aliases: ['/guilds'],
    titleKo: '길드 목록 (Guilds) - SNS히어로',
    titleEn: 'Guild List - SNSHero',
    descriptionKo: '길드를 만들거나 가입해 보상을 공유하고 길드 전투를 준비하세요.',
    descriptionEn: 'Create or join a guild to share rewards and participate in raids.',
  },
  'guild-detail': {
    path: '/guild',
    aliases: ['/guild-detail'],
    titleKo: '길드 본부 (Guild) - SNS히어로',
    titleEn: 'Guild HQ - SNSHero',
    descriptionKo: '길드원들과 협력하여 레이드에 도전하고 길드 버프를 누리세요.',
    descriptionEn: 'Manage your guild, participate in guild raids, and earn buffs.',
  },
  'guild-house': {
    path: '/guild/house',
    aliases: ['/guild-house'],
    titleKo: '길드 아지트 & 하우스 (Guild House) - SNS히어로',
    titleEn: 'Guild House & Hall - SNSHero',
    descriptionKo: '60fps CRDT 멀티 동기화 길드 하우스와 4대 영지 쟁탈전 아레나입니다.',
    descriptionEn: 'Realtime CRDT multiplayer guild house, interior decorator, and territory wars.',
  },
  community: {
    path: '/community',
    titleKo: '커뮤니티 (Community) - SNS히어로 소셜 피드',
    titleEn: 'Community - SNSHero Social Feed',
    descriptionKo: '전 세계 헌터들과 덱을 공유하고 실시간 피드와 결투를 즐기세요.',
    descriptionEn: 'Share decks, post moments, and challenge friends worldwide.',
  },
  playground: {
    path: '/playground',
    titleKo: '플레이그라운드 (Playground) - SNS히어로',
    titleEn: 'Playground - SNSHero Sandbox',
    descriptionKo: '카드 조합과 전술을 자유롭게 시험할 수 있는 모의 실험 공간입니다.',
    descriptionEn: 'Test card combos, strategies, and AI mechanics freely.',
  },
  'stock-market': {
    path: '/stock-market',
    aliases: ['/market'],
    titleKo: '카드 거래소 (Market) - SNS히어로',
    titleEn: 'Stock Market - SNSHero',
    descriptionKo: '카드와 SNS 경제 흐름을 확인하고 컬렉션 가치를 비교하세요.',
    descriptionEn: 'Track card market indices, volume, and economic dynamics.',
  },
  'card-marketplace': {
    path: '/marketplace',
    aliases: ['/p2p'],
    titleKo: '카드 P2P 거래소 (Marketplace) - SNS히어로',
    titleEn: 'Card Marketplace (P2P) - SNSHero',
    descriptionKo: '안전한 에스크로 시스템으로 원하는 카드를 거래하세요.',
    descriptionEn: 'Buy and sell cards directly with safe escrow transactions.',
  },
  'prediction-market': {
    path: '/prediction-market',
    aliases: ['/predict'],
    titleKo: '예측시장 (Prediction Market) - SNS히어로',
    titleEn: 'Prediction Market - SNSHero',
    descriptionKo: '스포츠 경기와 이벤트 결과를 예측하고 SNS 보상을 노려보세요.',
    descriptionEn: 'Predict real-world match outcomes and win SNS rewards.',
  },
  'reward-qr': {
    path: '/reward-qr',
    aliases: ['/reward'],
    titleKo: 'QR 보상 수령 (QR Reward) - SNS히어로',
    titleEn: 'QR Reward - SNSHero',
    descriptionKo: 'QR 코드를 스캔하여 특별 카드와 일일 SNS 보상을 즉시 수령하세요.',
    descriptionEn: 'Scan QR codes to claim instant bonus cards and SNS points.',
  },
  'reward-ar': {
    path: '/reward-ar',
    titleKo: 'AR 카메라 보상 (AR Reward) - SNS히어로',
    titleEn: 'AR Reward - SNSHero',
    descriptionKo: 'AR 증강현실로 카드를 소환하고 보너스를 획득하세요.',
    descriptionEn: 'Summon cards in Augmented Reality and claim exclusive rewards.',
  },
  share: {
    path: '/share',
    titleKo: '덱 공유 (Share Deck) - SNS히어로',
    titleEn: 'Share Deck - SNSHero',
    descriptionKo: '다른 사용자가 공유한 카드 덱을 확인하고 AI 대전을 진행해보세요.',
    descriptionEn: 'Preview shared decks and challenge them directly.',
  },
  boost: {
    path: '/boost',
    titleKo: '소셜 부스팅 (Social Boost) - SNS히어로',
    titleEn: 'Social Boost - SNSHero',
    descriptionKo: '합법적이고 안전한 방식으로 당신의 채널을 성장시키세요.',
    descriptionEn: 'Grow your social channels with real organic interactions.',
  },
  'season-hub': {
    path: '/season-hub',
    aliases: ['/mission', '/missions'],
    titleKo: '시즌 허브 (Season Hub) - SNS히어로',
    titleEn: 'Season Hub - SNSHero',
    descriptionKo: '시즌별 스토리, 일일/주간 미션, 보상 패스를 한눈에 확인하세요.',
    descriptionEn: 'Track season progress, daily missions, and battle pass tiers.',
  },
  'policy-center': {
    path: '/policy-center',
    aliases: ['/policy'],
    titleKo: '정책 센터 (Policy Center) - SNS히어로',
    titleEn: 'Policy & Trust Center - SNSHero',
    descriptionKo: '소환 확률, 환불, 이용약관, 개인정보 처리방침을 투명하게 안내합니다.',
    descriptionEn: 'Transparent gacha rates, refund policies, and terms of service.',
  },
  'web3-landing': {
    path: '/web3',
    titleKo: 'Web3 게이트웨이 (Web3) - SNS히어로',
    titleEn: 'Web3 Gateway - SNSHero',
    descriptionKo: '지갑 없이 브라우저에서 바로 즐기는 차세대 카드 배틀 게임.',
    descriptionEn: 'Play instantly without a wallet. BTC, ETH, and USDC supported.',
  },
  referral: {
    path: '/referral',
    titleKo: '친구 초대 (Referral) - SNS히어로',
    titleEn: 'Referral Program - SNSHero',
    descriptionKo: '친구를 초대하고 함께 풍성한 SNS 포인트와 특별 카드를 받으세요.',
    descriptionEn: 'Invite friends and earn bonus SNS points and rare cards.',
  },
  creator: {
    path: '/creator',
    titleKo: '크리에이터 리워드 (Creator) - SNS히어로',
    titleEn: 'Creator Rewards - SNSHero',
    descriptionKo: '크리에이터 코드로 가입하고 특별 지원 혜택을 누리세요.',
    descriptionEn: 'Use creator codes for exclusive welcome bonuses and perks.',
  },
  anime: {
    path: '/anime',
    titleKo: '애니메이션 극장 (Anime) - SNS히어로',
    titleEn: 'Anime Theater - SNSHero',
    descriptionKo: 'SNS히어로의 공식 애니메이션 클립과 비주얼 영상을 감상하세요.',
    descriptionEn: 'Watch official SNSHero anime clips and lore shorts.',
  },
  movie: {
    path: '/movie',
    titleKo: '영화관 (Movie) - SNS히어로',
    titleEn: 'Movie Theater - SNSHero',
    descriptionKo: '공식 3D 풀버전 스토리 무비를 연속 시청하고 보상을 획득하세요.',
    descriptionEn: 'Stream full cinematic story movies and earn watch rewards.',
  },
  mall: {
    path: '/mall',
    titleKo: '공식 굿즈 몰 (Mall) - SNS히어로',
    titleEn: 'Official Goods Mall - SNSHero',
    descriptionKo: 'SNS히어로 공식 피규어, 카드 앨범, 굿즈 컬렉션을 만나보세요.',
    descriptionEn: 'Official SNSHero figures, cards, and merchandise store.',
  },
  modoo: {
    path: '/modoo',
    titleKo: '모두의 마블 보드 (Modoo) - SNS히어로',
    titleEn: 'Modoo Marble Board - SNSHero',
    descriptionKo: '주사위를 굴려 도시를 점령하고 보상을 획득하는 모바일 보드 게임.',
    descriptionEn: 'Roll the dice, buy cities, and dominate the board.',
  },
  'tool-makegrid': {
    path: '/tool/makegrid',
    aliases: ['/makegrid', '/grid', '/tool/grid', '/too/grid'],
    titleKo: '그리드 생성기 (Grid Generator) - SNS히어로',
    titleEn: 'CSS Grid Generator - SNSHero Tool',
    descriptionKo: 'CSS Grid 레이아웃을 시각적으로 설계하고 코드를 추출하는 도구입니다.',
    descriptionEn: 'Visual CSS Grid builder and live code generator.',
  },
  'tool-grid': {
    path: '/tool/makegrid',
    aliases: ['/grid'],
    titleKo: '그리드 생성기 (Grid Generator) - SNS히어로',
    titleEn: 'CSS Grid Generator - SNSHero Tool',
    descriptionKo: 'CSS Grid 레이아웃 도구입니다.',
    descriptionEn: 'Visual CSS Grid builder tool.',
  },
  'tool-checkgrid': {
    path: '/tool/checkgrid',
    aliases: ['/checkgrid', '/tool/check-grid'],
    titleKo: '그리드 검수기 (Grid Checker) - SNS히어로',
    titleEn: 'Grid Checker - SNSHero Tool',
    descriptionKo: '이미지 그리드 좌표와 셀 정합성을 정밀 검수하는 도구입니다.',
    descriptionEn: 'Inspect image slicing coordinates and grid alignments.',
  },
  novel: {
    path: '/book',
    aliases: ['/novel'],
    titleKo: '40부작 공식 웹소설 - 카단과 아케인의 메아리',
    titleEn: 'Official Web Novel - Kadan & Arcane Echoes',
    descriptionKo: '40부작 공식 판타지 웹소설. 카단의 서사시를 감상하세요.',
    descriptionEn: 'Read the 40-episode official fantasy web novel.',
  },
  webtoon: {
    path: '/webtoon',
    aliases: ['/cartoonbook'],
    titleKo: '공식 웹툰 (Webtoon) - SNS히어로',
    titleEn: 'Official Webtoon - SNSHero',
    descriptionKo: 'AI로 그려낸 고품질 판타지 RPG 웹툰을 감상하세요.',
    descriptionEn: 'Read the high-quality full-color fantasy RPG webtoon.',
  },
  pacpik: {
    path: '/pacpik',
    aliases: ['/pacpik.html'],
    titleKo: 'Pacpik Games Verification | SNSHero',
    titleEn: 'Pacpik Games Verification | SNSHero',
    descriptionKo: 'Pacpik Games 파트너십 인증 페이지입니다.',
    descriptionEn: 'Pacpik Games partnership verification endpoint.',
  },
  admin: {
    path: '/admin',
    titleKo: '관리자 콘솔 (Admin) - SNS히어로',
    titleEn: 'Admin Console - SNSHero',
    descriptionKo: '시스템 모니터링 및 게임 밸런스 조정 콘솔입니다.',
    descriptionEn: 'Admin control center for system operations.',
  },
  status: {
    path: '/status',
    titleKo: '시스템 통계 (Status) - SNS히어로',
    titleEn: 'Status Dashboard - SNSHero',
    descriptionKo: '실시간 유저 통계, 승률, 경제 지표를 조회하는 대시보드입니다.',
    descriptionEn: 'Real-time player statistics and server metrics.',
  },
  wiki: {
    path: '/wiki',
    titleKo: '게임 백과사전 (Wiki) - SNS히어로',
    titleEn: 'Game Wiki - SNSHero',
    descriptionKo: '게임 가이드, 규칙, 도감을 망라한 종합 백과사전입니다.',
    descriptionEn: 'Comprehensive guide, database, and encyclopedia.',
  },
  'world-codex': {
    path: '/world-codex',
    titleKo: '세계관 도감 (World Codex) - SNS히어로',
    titleEn: 'World Codex - SNSHero',
    descriptionKo: 'SNS히어로 세계관의 세력, 갈등, 인물 관계도를 한눈에 살펴보세요.',
    descriptionEn: 'Explore factions, characters, and lore across the universe.',
  },
  'wiki-howtoplay': {
    path: '/wiki/howtoplay',
    titleKo: '플레이 방법 (How to Play) - SNS히어로',
    titleEn: 'How to Play - SNSHero Guide',
    descriptionKo: '기본 카드 배틀 규칙과 조작법을 상세히 배울 수 있는 가이드입니다.',
    descriptionEn: 'Step-by-step tutorial on rules, combat, and controls.',
  },
  'wiki-tip': {
    path: '/wiki/tip',
    titleKo: '공략 팁 (Strategy & Tips) - SNS히어로',
    titleEn: 'Strategy & Tips - SNSHero Guide',
    descriptionKo: '효율적인 카드 육성과 승리를 위한 덱 전략 팁 모음입니다.',
    descriptionEn: 'Pro tips, meta deck strategies, and progression advice.',
  },
  'wiki-card': {
    path: '/wiki/card',
    titleKo: '카드 도감 (Hero Library) - SNS히어로',
    titleEn: 'Card Codex - SNSHero Guide',
    descriptionKo: '110여 종 전체 카드의 속성과 스탯, 고유 스킬을 상세히 조회하세요.',
    descriptionEn: 'Browse all 110+ hero cards, stats, and abilities.',
  },
  'wiki-item': {
    path: '/wiki/item',
    titleKo: '장비 도감 (Equipment) - SNS히어로',
    titleEn: 'Item Library - SNSHero Guide',
    descriptionKo: '히어로 카드의 능력을 증폭시키는 장비 아이템 목록과 옵션 가이드입니다.',
    descriptionEn: 'Browse all weapons, rings, and boots upgrades.',
  },
  'wiki-skill': {
    path: '/wiki/skill',
    titleKo: '스킬 도감 (Skills) - SNS히어로',
    titleEn: 'Skill Library - SNSHero Guide',
    descriptionKo: '전투에서 사용할 수 있는 각종 전술 스킬 효과와 쿨타임 정보입니다.',
    descriptionEn: 'Complete manual on tactical skills and effects.',
  },
  god: {
    path: '/god',
    titleKo: '디버그 센터 (God Mode) - SNS히어로',
    titleEn: 'God Mode Debug - SNSHero',
    descriptionKo: '개발자 테스트를 위한 전용 샌드박스 화면입니다.',
    descriptionEn: 'Developer sandbox for live feature testing.',
  },
  game: {
    path: '/game',
    titleKo: '미니게임 아케이드 (Mini Games) - SNS히어로',
    titleEn: 'Arcade Mini Games - SNSHero',
    descriptionKo: '다양한 캐주얼 미니게임을 즐기고 추가 보상을 획득하세요.',
    descriptionEn: 'Play arcade mini-games and earn bonus rewards.',
  },
  fusion: {
    path: '/fusion',
    titleKo: '소환 & 융합 연구소 (Fusion Lab) - SNS히어로',
    titleEn: 'Alchemy Fusion Lab - SNSHero',
    descriptionKo: '초고속 WebGL 60fps 마법 유체 융합 & 연금술 레시피 역추적 연구소입니다.',
    descriptionEn: 'GPGPU 60fps fluid simulation card fusion and alchemy recipes.',
  },
  leaderboard: {
    path: '/leaderboard',
    titleKo: '랭킹 & 명예의 전당 (Leaderboard) - SNS히어로',
    titleEn: 'Leaderboard & Hall of Fame - SNSHero',
    descriptionKo: '60fps 베지어 실시간 보간 랭킹 및 라이벌 즉시 매치업 시스템.',
    descriptionEn: '60fps Bezier interpolated ranking and instant rival matchmaking.',
  },
  'quest-achievement': {
    path: '/quest-achievement',
    aliases: ['/quests'],
    titleKo: '퀘스트 & 업적 센터 (Quests) - SNS히어로',
    titleEn: 'Quest & Achievement Center - SNSHero',
    descriptionKo: '60fps 캔버스 타이머 & 별자리 연계 퀘스트 맵 및 황금 피냐타 축제.',
    descriptionEn: 'Unified timer worker, canvas overlays, and quest constellation map.',
  },
  'setting-reward': {
    path: '/setting-reward',
    aliases: ['/settings-center'],
    titleKo: '환경설정 & 계정 센터 (Settings) - SNS히어로',
    titleEn: 'Settings & Account Center - SNSHero',
    descriptionKo: '초고속 멀티 CDN 자동 스왑 & 터치 감도 캘리브레이션 패드.',
    descriptionEn: 'Dynamic CDN ping auto-swap and touch calibration pad.',
  },
};

/**
 * 뷰 식별자에 해당하는 고유 URL 경로를 반환합니다.
 */
export function getViewPath(view: ViewType): string {
  const route = VIEW_ROUTES[view];
  return route ? route.path : '/home';
}

/**
 * URL 경로 및 쿼리 파라미터로부터 정확한 ViewType을 역추적합니다.
 */
export function getViewFromPath(pathname: string, search = ''): ViewType {
  const params = new URLSearchParams(search);
  const queryView = params.get('view');
  
  // 1. 쿼리 파라미터 우선 매핑 (?view=...)
  if (queryView) {
    if (queryView in VIEW_ROUTES) {
      return queryView as ViewType;
    }
    if (queryView === 'makegrid' || queryView === 'tool/grid' || queryView === 'too/grid') return 'tool-makegrid';
    if (queryView === 'checkgrid' || queryView === 'tool/checkgrid') return 'tool-checkgrid';
  }

  // 2. URL 경로 정규화 (끝 슬래시 제거, 소문자 변환)
  const cleanPath = pathname.replace(/\/$/, '').toLowerCase() || '/';

  // 특수 접두사 라우팅
  if (cleanPath.startsWith('/creator/')) return 'creator';
  if (cleanPath.startsWith('/novel/s1-')) return 'novel';
  if (cleanPath.startsWith('/gotest')) return 'home';

  // 3. 고유 경로 및 별칭(Aliases) 전수 검색
  for (const [v, meta] of Object.entries(VIEW_ROUTES) as [ViewType, RouteMeta][]) {
    if (meta.path.toLowerCase() === cleanPath) {
      return v;
    }
    if (meta.aliases) {
      for (const alias of meta.aliases) {
        if (alias.toLowerCase() === cleanPath) {
          return v;
        }
      }
    }
  }

  // 4. Fallback: 로컬 스토리지에 저장된 마지막 뷰 또는 홈
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hero_current_view') as ViewType;
    if (saved && saved in VIEW_ROUTES) {
      return saved;
    }
  }

  return 'home';
}

/**
 * 뷰와 언어에 맞는 SEO 메타 정보를 반환합니다.
 */
export function getRouteMeta(view: ViewType, language: Language = 'ko'): { title: string; description: string; url: string } {
  const route = VIEW_ROUTES[view] || VIEW_ROUTES.home;
  const title = language === 'ko' ? route.titleKo : route.titleEn;
  const description = language === 'ko' ? route.descriptionKo : route.descriptionEn;
  const url = `https://snshero.com${route.path}`;
  return { title, description, url };
}
