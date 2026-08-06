import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  // --- BATTLE CATEGORY ---
  {
    id: 'battle_wins_1',
    category: 'battle',
    title: { ko: '첫 승리의 맛', en: 'First Victory' },
    description: { ko: '첫 번째 승리를 거두세요.', en: 'Win your first battle.' },
    targetValue: 1,
    rewardType: 'coins',
    rewardAmount: 100
  },
  {
    id: 'battle_wins_10',
    category: 'battle',
    title: { ko: '노련한 투사', en: 'Seasoned Fighter' },
    description: { ko: '전투에서 10번 승리하세요.', en: 'Win 10 battles.' },
    targetValue: 10,
    rewardType: 'coins',
    rewardAmount: 500
  },
  {
    id: 'battle_wins_50',
    category: 'battle',
    title: { ko: '전장의 지배자', en: 'Battlefield Ruler' },
    description: { ko: '전투에서 50번 승리하세요.', en: 'Win 50 battles.' },
    targetValue: 50,
    rewardType: 'coins',
    rewardAmount: 2000
  },
  {
    id: 'battle_wins_100',
    category: 'battle',
    title: { ko: '백전노장', en: 'War Veteran' },
    description: { ko: '전투에서 100번 승리하세요.', en: 'Win 100 battles.' },
    targetValue: 100,
    rewardType: 'coins',
    rewardAmount: 5000
  },
  {
    id: 'battle_wins_500',
    category: 'battle',
    title: { ko: '무패의 신화', en: 'Invincible Myth' },
    description: { ko: '전투에서 500번 승리하세요.', en: 'Win 500 battles.' },
    targetValue: 500,
    rewardType: 'coins',
    rewardAmount: 20000
  },
  {
    id: 'battle_flips_10',
    category: 'battle',
    title: { ko: '플립 마스터', en: 'Flip Master' },
    description: { ko: '상대 카드를 10번 뒤집으세요.', en: 'Flip 10 opponent cards.' },
    targetValue: 10,
    rewardType: 'points',
    rewardAmount: 10
  },
  {
    id: 'battle_flips_100',
    category: 'battle',
    title: { ko: '뒤집기 달인', en: 'Master Turner' },
    description: { ko: '상대 카드를 100번 뒤집으세요.', en: 'Flip 100 opponent cards.' },
    targetValue: 100,
    rewardType: 'points',
    rewardAmount: 50
  },
  {
    id: 'battle_flips_1000',
    category: 'battle',
    title: { ko: '매트릭스 붕괴', en: 'Matrix Collapse' },
    description: { ko: '상대 카드를 1000번 뒤집으세요.', en: 'Flip 1000 opponent cards.' },
    targetValue: 1000,
    rewardType: 'points',
    rewardAmount: 200
  },
  {
    id: 'battle_streak_3',
    category: 'battle',
    title: { ko: '연승 행진', en: 'Winning Streak' },
    description: { ko: '3연승을 달성하세요.', en: 'Achieve a 3-win streak.' },
    targetValue: 3,
    rewardType: 'coins',
    rewardAmount: 300
  },
  {
    id: 'battle_streak_5',
    category: 'battle',
    title: { ko: '멈출 수 없는 기세', en: 'Unstoppable Force' },
    description: { ko: '5연승을 달성하세요.', en: 'Achieve a 5-win streak.' },
    targetValue: 5,
    rewardType: 'coins',
    rewardAmount: 1000
  },
  {
    id: 'battle_streak_10',
    category: 'battle',
    title: { ko: '전설의 연승', en: 'Legendary Streak' },
    description: { ko: '10연승을 달성하세요.', en: 'Achieve a 10-win streak.' },
    targetValue: 10,
    rewardType: 'coins',
    rewardAmount: 5000
  },

  // --- COLLECTION CATEGORY ---
  {
    id: 'coll_total_10',
    category: 'collection',
    title: { ko: '수집의 시작', en: 'Collection Start' },
    description: { ko: '카드 10장을 수집하세요.', en: 'Collect 10 cards.' },
    targetValue: 10,
    rewardType: 'coins',
    rewardAmount: 200
  },
  {
    id: 'coll_total_50',
    category: 'collection',
    title: { ko: '카드 수집가', en: 'Card Collector' },
    description: { ko: '카드 50장을 수집하세요.', en: 'Collect 50 cards.' },
    targetValue: 50,
    rewardType: 'coins',
    rewardAmount: 1000
  },
  {
    id: 'coll_total_100',
    category: 'collection',
    title: { ko: '박물관장', en: 'Museum Curator' },
    description: { ko: '카드 100장을 수집하세요.', en: 'Collect 100 cards.' },
    targetValue: 100,
    rewardType: 'coins',
    rewardAmount: 2500
  },
  {
    id: 'coll_unique_10',
    category: 'collection',
    title: { ko: '다양한 인맥', en: 'Diverse Connections' },
    description: { ko: '유니크 카드 10종을 수집하세요.', en: 'Collect 10 unique cards.' },
    targetValue: 10,
    rewardType: 'points',
    rewardAmount: 20
  },
  {
    id: 'coll_unique_50',
    category: 'collection',
    title: { ko: '도감 완성 전문가', en: 'Encyclopedia Expert' },
    description: { ko: '유니크 카드 50종을 수집하세요.', en: 'Collect 50 unique cards.' },
    targetValue: 50,
    rewardType: 'points',
    rewardAmount: 100
  },
  {
    id: 'coll_max_level_1',
    category: 'collection',
    title: { ko: '최강의 카드', en: 'Strongest Card' },
    description: { ko: '카드 1장을 만렙으로 만드세요.', en: 'Reach max level with 1 card.' },
    targetValue: 1,
    rewardType: 'coins',
    rewardAmount: 1000
  },

  // --- GROWTH CATEGORY ---
  {
    id: 'growth_lvl_10',
    category: 'growth',
    title: { ko: '초보 탈출', en: 'Out of Beginner' },
    description: { ko: '카드를 10레벨로 업그레이드하세요.', en: 'Upgrade a card to level 10.' },
    targetValue: 1,
    rewardType: 'coins',
    rewardAmount: 300
  },
  {
    id: 'growth_lvl_50',
    category: 'growth',
    title: { ko: '베테랑 헌터', en: 'Veteran Hunter' },
    description: { ko: '카드를 50레벨로 업그레이드하세요.', en: 'Upgrade a card to level 50.' },
    targetValue: 5,
    rewardType: 'coins',
    rewardAmount: 10000
  },
  {
    id: 'growth_skill_10',
    category: 'growth',
    title: { ko: '스킬 마스터', en: 'Skill Master' },
    description: { ko: '아무 스킬을 10번 강화하세요.', en: 'Upgrade any skill 10 times.' },
    targetValue: 10,
    rewardType: 'points',
    rewardAmount: 5
  },

  // --- SPECIAL CATEGORY ---
  {
    id: 'spec_perfect_win',
    category: 'special',
    title: { ko: '완벽한 승리', en: 'Perfect Victory' },
    description: { ko: '보드를 모두 자신의 카드로 채워 승리하세요.', en: 'Win by filling the entire board with your cards.' },
    targetValue: 1,
    rewardType: 'coins',
    rewardAmount: 2000
  },
  {
    id: 'spec_low_level_win',
    category: 'special',
    title: { ko: '다윗과 골리앗', en: 'David and Goliath' },
    description: { ko: '레벨 1 카드만 사용하여 승리하세요.', en: 'Win using only Level 1 cards.' },
    targetValue: 1,
    rewardType: 'coins',
    rewardAmount: 1500
  },

  // --- SOCIAL/OTHER ---
  {
    id: 'soc_spend_1000',
    category: 'social',
    title: { ko: '큰 손', en: 'Big Spender' },
    description: { ko: '상점에서 1000 코인을 사용하세요.', en: 'Spend 1000 coins in the shop.' },
    targetValue: 1000,
    rewardType: 'points',
    rewardAmount: 10
  },
  {
    id: 'soc_feedback',
    category: 'social',
    title: { ko: '열혈 헌터', en: 'Enthusiastic Hunter' },
    description: { ko: '개선 의견을 1회 이상 제출하세요.', en: 'Submit feedback at least once.' },
    targetValue: 1,
    rewardType: 'coins',
    rewardAmount: 500
  },
];

// Add more dynamically to reach 110
const generateMore = () => {
    const categories: ('battle' | 'collection' | 'growth' | 'special' | 'social')[] = ['battle', 'collection', 'growth', 'special', 'social'];
    const extra: Achievement[] = [];
    
    // We already have some. Let's add variations.
    for (let i = ACHIEVEMENTS.length; i < 110; i++) {
        const cat = categories[i % categories.length];
        extra.push({
            id: `${cat}_ext_${i}`,
            category: cat,
            title: { ko: `도전 과제 #${i + 1}`, en: `Challenge #${i + 1}` },
            description: { ko: `게임 플레이를 통해 이 과제를 달성하세요. (${cat})`, en: `Complete this challenge through gameplay. (${cat})` },
            targetValue: (i + 1) * 10,
            rewardType: i % 2 === 0 ? 'coins' : 'points',
            rewardAmount: (i + 1) * 5
        });
    }
    return extra;
};

export const ALL_ACHIEVEMENTS = [...ACHIEVEMENTS, ...generateMore()];
