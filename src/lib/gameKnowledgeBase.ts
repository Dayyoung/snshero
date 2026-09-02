/**
 * SNSHero Game Knowledge Base & Lightweight Local RAG Engine
 * Provides structured in-app game knowledge for Local LLM (Chrome Built-in AI) and Chatbot
 */

export interface KnowledgeEntry {
  id: string;
  category: 'battle' | 'growth' | 'economy' | 'modes' | 'mall' | 'general';
  keywordsKo: string[];
  keywordsEn: string[];
  summaryKo: string;
  summaryEn: string;
}

export const GAME_KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  {
    id: 'attributes_and_battle',
    category: 'battle',
    keywordsKo: ['속성', '상성', '전투', '배틀', '공격', '방어', '덱', '승리', '전술', '카드'],
    keywordsEn: ['attribute', 'element', 'battle', 'combat', 'attack', 'defense', 'deck', 'synergy'],
    summaryKo: `[전투 및 속성 상성]
- 6대 속성 상성 체계: 화염(Fire) > 질풍(Wind) > 대지(Earth) > 수류(Water) > 화염 (상성 우위 시 피해량 1.5배). 빛(Light)과 암흑(Dark)은 상호 1.5배 피해를 줍니다.
- 전투 규칙: 5장의 영웅 카드로 덱을 구성하여 원클릭으로 진행되는 전략 카드 배틀입니다. 속성 시너지와 사령관 오라에 따라 보너스 버프가 발동합니다.`,
    summaryEn: `[Battle & Attribute Synergies]
- 6 Elements: Fire > Wind > Earth > Water > Fire (1.5x damage on advantage). Light and Dark deal 1.5x damage reciprocally.
- Combat Rules: 5-hero deck one-click battle system. Attribute synergy and Tactician Auras trigger bonus buffs.`
  },
  {
    id: 'hero_growth_and_care',
    category: 'growth',
    keywordsKo: ['육성', '돌봄', '다마고치', '친밀도', '포만감', '기분', '훈련', '휴식', '레벨업', '강화', '마스터리', '각성'],
    keywordsEn: ['growth', 'tamagotchi', 'care', 'intimacy', 'fullness', 'mood', 'training', 'mastery', 'upgrade'],
    summaryKo: `[영웅 육성 및 다마고치 돌봄]
- 마이덱(MyDeck)에서 영웅에게 식사 주기, 칭찬하기, 훈련, 휴식을 주어 포만감, 기분, 친밀도를 올릴 수 있습니다.
- 친밀도가 상승하면 전투 스탯 보너스와 함께 영웅별 골든 스킨 및 고유 보이스 배지가 해금됩니다.
- 카드 강화 및 각성을 통해 기본 공격력과 체력을 영구 증폭할 수 있습니다.`,
    summaryEn: `[Hero Growth & Care System]
- In MyDeck, feed, praise, train, and rest your heroes to boost Fullness, Mood, and Intimacy.
- Higher intimacy unlocks combat stat bonuses, Golden Skins, and unique Commander Voice Badges.
- Card upgrades and awakenings permanently amplify ATK and HP.`
  },
  {
    id: 'economy_and_gacha',
    category: 'economy',
    keywordsKo: ['뽑기', '가챠', '소환', '카드팩', '천장', 'sns', '포인트', '재화', '소각', '바이백', '환불'],
    keywordsEn: ['gacha', 'summon', 'pack', 'pity', 'sns', 'point', 'token', 'buyback', 'currency'],
    summaryKo: `[SNS 포인트 및 소환 천장]
- SNS 포인트는 전투 승리, 미션 완료, 출석, 부지런의 나무, 쇼핑몰 결제 등을 통해 획득하는 핵심 재화입니다.
- 카드팩 소환: 단일팩(100 SNS), 10연차(900 SNS)가 있으며, 50회 연속 소환 시 최고 등급(SSR/UR)이 100% 확정되는 천장(Pity) 시스템이 작동합니다.
- 토큰 이코노미: 상점에서 사용된 SNS 포인트의 일부는 바이백 및 영구 소각되어 재화 가치를 보존합니다.`,
    summaryEn: `[SNS Points & Summon Pity System]
- SNS Points are the primary currency earned via battles, missions, daily attendance, and merch purchases.
- Card Pack Summon: Single pack (100 SNS), 10x summon (900 SNS) with a guaranteed 50-pull SSR/UR Pity guarantee.
- Token Economy: A portion of spent SNS points is automatically bought back and permanently burned.`
  },
  {
    id: 'tower_and_expedition',
    category: 'modes',
    keywordsKo: ['탑', '시련의 탑', '원정대', '방치', '순찰', '8시간', '오프라인', '던전', '보스', '레이드', '보상'],
    keywordsEn: ['tower', 'trials', 'expedition', 'patrol', 'idle', '8 hours', 'offline', 'dungeon', 'boss', 'raid'],
    summaryKo: `[시련의 탑 및 오프라인 원정대]
- 시련의 탑(Tower of Trials): 50층으로 구성된 무한 등반 던전으로, 층별로 강력한 보스와 속성 기믹을 돌파하며 대량의 SNS 포인트와 전술가 칭호를 획득합니다.
- 오프라인 원정대: 게임을 종료해도 최대 8시간 동안 파티가 자동 순찰하며 경험치, 골드, 희귀 강화 재료를 수집해 대기합니다.`,
    summaryEn: `[Tower of Trials & Offline Expedition]
- Tower of Trials: 50-floor infinite climb dungeon rewarding massive SNS Points and Tactician titles upon conquering bosses.
- Offline Expedition: Automatic 8-hour idle patrol party gathering EXP, Gold, and rare materials while you are away.`
  },
  {
    id: 'kadan_rpg',
    category: 'modes',
    keywordsKo: ['카단', 'kadan', '아케인', 'rpg', '환생', '메인', '스토리', '챕터', '탐험'],
    keywordsEn: ['kadan', 'arcane', 'rpg', 'reincarnation', 'story', 'chapter', 'explore'],
    summaryKo: `[카단 & 아케인 에코즈 RPG]
- 주인공 카단이 아케인 대륙의 비밀을 탐험하는 정통 탑뷰/필드 RPG 모드입니다.
- 필드 탐색, 숨겨진 보물 상자, 강적 인카운터 전투, 환생(Reincarnation) 레벨 시스템을 통해 영구 능력치를 획득합니다.`,
    summaryEn: `[Kadan & Arcane Echoes RPG]
- Story RPG mode following protagonist Kadan across the Arcane Continent.
- Features field exploration, hidden treasure chests, elite encounters, and permanent Reincarnation stat progression.`
  },
  {
    id: 'official_mall',
    category: 'mall',
    keywordsKo: ['굿즈', '쇼핑몰', '몰', '구매', '결제', '배송', 'paypal', '카드덱', '테이블', '머그컵', '티셔츠', '110장', '달러'],
    keywordsEn: ['mall', 'merch', 'shop', 'buy', 'checkout', 'paypal', 'deck', 'table', 'mug', 'tshirt', 'shipping'],
    summaryKo: `[SNS히어로 공식 굿즈 몰 (/mall)]
- 실물 굿즈 4종: 1. 110장 유니크 히어로 카드 덱($30), 2. 전용 게임테이블($30), 3. 히어로 머그컵($10), 4. 히어로 티셔츠($30, S/M/L).
- 인페이지 PayPal 및 원클릭 즉시 결제를 지원하며, 구매 시 주문 번호가 발급되고 100% 로컬스토리지에 안전하게 기록됩니다.`,
    summaryEn: `[SNSHero Official Merch Mall (/mall)]
- 4 Physical Merch Items: 1. 110 Unique Heroes Card Deck ($30), 2. Game Table ($30), 3. Hero Mug ($10), 4. Hero T-shirt ($30, S/M/L).
- Features in-page PayPal and Instant Checkout with permanent local order receipt tracking.`
  },
  {
    id: 'minigames_and_arcade',
    category: 'modes',
    keywordsKo: ['미니게임', '미션', '게임', '블리츠', '아케이드', '퍼즐', '복셀', '원터치', '플레이', '스네이크', '팩맨', '2048'],
    keywordsEn: ['minigame', 'mission', 'blitz', 'arcade', 'puzzle', 'touch', 'play', 'snake', 'pacman'],
    summaryKo: `[110종 미션 미니게임 라인업]
- 클래식 16종 + 블리츠 78종 + 모드 16종 등 총 110종의 다채로운 2D/아케이드/퍼즐/액션 미션 게임을 제공합니다.
- 모바일 100% 퓨어 터치/스와이프 조작으로 한손 플레이가 가능하며, 클리어 시 10~60 SNS 포인트를 즉시 획득합니다.`,
    summaryEn: `[110 Mission Minigame Lineup]
- 110 diverse games (16 Classic + 78 Blitz + 16 Modes) spanning 2D, arcade, action, and puzzle genres.
- 100% mobile-friendly one-thumb swipe/tap gestures, rewarding 10~60 SNS Points upon completion.`
  }
];

/**
 * Retrieve relevant game knowledge entries matching the user prompt
 */
export const getRelevantGameKnowledge = (prompt: string, language: string = 'ko'): string => {
  const cleanPrompt = prompt.toLowerCase();
  const isEn = language !== 'ko';

  const scoredEntries = GAME_KNOWLEDGE_ENTRIES.map(entry => {
    let score = 0;
    const keywords = isEn ? entry.keywordsEn : entry.keywordsKo;
    
    keywords.forEach(kw => {
      if (cleanPrompt.includes(kw.toLowerCase())) {
        score += 2;
      }
    });

    return { entry, score };
  });

  // Sort by relevance score
  scoredEntries.sort((a, b) => b.score - a.score);

  // Take top 2-3 most relevant entries or general overview if no direct match
  const selected = scoredEntries.filter(item => item.score > 0).slice(0, 3);

  if (selected.length === 0) {
    // Return default game overview
    return isEn 
      ? `[SNSHero Overview]\nSNSHero is an AI-powered one-click web card battle game with 110 unique heroes, 6 attribute counters, Tamagotchi hero care, Tower of Trials, and an official merch mall.`
      : `[SNS히어로 게임 개요]\nSNS히어로는 110종의 유니크 영웅 카드, 6대 속성 상성 배틀, 다마고치형 영웅 돌봄 육성, 시련의 탑 50층, 카단 RPG, 공식 굿즈 몰(/mall)을 갖춘 차세대 웹 카드 배틀 게임입니다.`;
  }

  return selected.map(item => isEn ? item.entry.summaryEn : item.entry.summaryKo).join('\n\n');
};

/**
 * Summarize current user in-game state from LocalStorage for state-aware responses
 */
export const getUserGameStateContext = (language: string = 'ko'): string => {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  const isEn = language !== 'ko';

  try {
    const userName = localStorage.getItem('hero_user_name') || (isEn ? 'Hero' : '히어로');
    const towerFloor = localStorage.getItem('hero_tower_trials_floor_v1') || '1';
    const season = localStorage.getItem('hero_current_season') || 'season1';

    return isEn
      ? `[Current Player Context]\n- Player: ${userName}\n- Season: ${season}\n- Tower of Trials Max Floor: ${towerFloor}`
      : `[현재 플레이어 상태 정보]\n- 유저 닉네임: ${userName}\n- 활성 시즌: ${season}\n- 시련의 탑 최고 달성: ${towerFloor}층`;
  } catch (e) {
    return '';
  }
};
