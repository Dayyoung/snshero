import { CARD_DATABASE } from '../cardDatabase';
import { CardData } from '../types';

export interface RankOpponentInfo {
  id: string;
  name: string;
  title?: string;
  badge?: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalPower: number;
  sns: number;
  language: string;
  deck: CardData[];
}

export const DUMMY_RANK_OPPONENT_POOL: Omit<RankOpponentInfo, 'deck'>[] = [
  { id: 'rank-bot-1', name: 'SNS_Hero_Master', title: 'title_legend', badge: 'badge_first_place', wins: 154, losses: 12, draws: 3, totalPower: 14800, winRate: 91.1, sns: 25000, language: 'ko' },
  { id: 'rank-bot-2', name: 'CyberBlade99', title: 'title_master', badge: 'badge_top_ranker', wins: 138, losses: 21, draws: 2, totalPower: 13200, winRate: 85.7, sns: 18400, language: 'en' },
  { id: 'rank-bot-3', name: 'CardSorcerer_KR', title: 'title_challenger', wins: 121, losses: 28, draws: 4, totalPower: 11800, winRate: 79.2, sns: 14200, language: 'ko' },
  { id: 'rank-bot-4', name: 'ShadowStriker', title: 'title_expert', wins: 105, losses: 32, draws: 1, totalPower: 10200, winRate: 75.5, sns: 11000, language: 'ja' },
  { id: 'rank-bot-5', name: 'PixelHunter', title: 'title_arena_runner', wins: 94, losses: 36, draws: 3, totalPower: 9100, winRate: 70.7, sns: 9200, language: 'ko' },
  { id: 'rank-bot-6', name: 'AlphaZero_Bot', title: 'title_grand_strategist', wins: 88, losses: 40, draws: 2, totalPower: 8400, winRate: 67.2, sns: 8100, language: 'en' },
  { id: 'rank-bot-7', name: 'ArcaneEchoes', title: 'title_deck_stylist', wins: 81, losses: 43, draws: 3, totalPower: 7600, winRate: 63.8, sns: 7300, language: 'de' },
  { id: 'rank-bot-8', name: 'MechaCommander', title: 'title_season_signal', wins: 73, losses: 46, draws: 1, totalPower: 6900, winRate: 60.3, sns: 6200, language: 'fr' },
  { id: 'rank-bot-9', name: 'DragonSlayer77', title: 'title_new_hunter', wins: 66, losses: 48, draws: 2, totalPower: 6100, winRate: 56.9, sns: 5400, language: 'ko' },
  { id: 'rank-bot-10', name: 'NeonViper_Global', title: 'title_challenger', wins: 59, losses: 51, draws: 0, totalPower: 5400, winRate: 53.6, sns: 4600, language: 'es' },
  { id: 'rank-bot-11', name: 'ZeroKadan', title: 'title_master', wins: 52, losses: 53, draws: 2, totalPower: 4800, winRate: 48.6, sns: 3900, language: 'ko' },
  { id: 'rank-bot-12', name: 'BitConqueror', title: 'title_expert', wins: 45, losses: 55, draws: 1, totalPower: 4100, winRate: 44.6, sns: 3100, language: 'en' },
  { id: 'rank-bot-13', name: 'VortexChampion', title: 'title_legend', wins: 142, losses: 19, draws: 4, totalPower: 13900, winRate: 86.1, sns: 21000, language: 'en' },
  { id: 'rank-bot-14', name: 'LunarEclipse_KR', title: 'title_grand_strategist', wins: 115, losses: 26, draws: 2, totalPower: 11200, winRate: 80.4, sns: 13500, language: 'ko' },
  { id: 'rank-bot-15', name: 'ThunderStrike_JP', title: 'title_challenger', wins: 98, losses: 35, draws: 3, totalPower: 9500, winRate: 72.1, sns: 9800, language: 'ja' },
];

/**
 * 랭킹 상대의 5장 덱을 동기화하여 생성합니다.
 */
export function generateRankOpponentDeck(seedCardIds?: number[]): CardData[] {
  const cardCount = Object.keys(CARD_DATABASE).length || 110;
  const pickedIds: number[] = [];

  if (seedCardIds && seedCardIds.length > 0) {
    pickedIds.push(...seedCardIds.slice(0, 5));
  }

  while (pickedIds.length < 5) {
    const randId = Math.floor(Math.random() * cardCount) + 1;
    if (!pickedIds.includes(randId)) {
      pickedIds.push(randId);
    }
  }

  return pickedIds.map((cId, idx) => {
    const dbCard = CARD_DATABASE[cId] || CARD_DATABASE[1];
    return {
      id: `rank-opp-card-${cId}-${idx}-${Date.now()}`,
      imageIndex: cId,
      title: dbCard.title,
      title_dis: dbCard.title_dis,
      title_en: dbCard.title_en,
      power: dbCard.power || 10,
      rarity: dbCard.rarity || 'bronze',
      owner: 'ai' as const,
      stats: [...(dbCard.stats || [5, 5, 5, 5])] as [number, number, number, number],
      ability: dbCard.ability,
      element: dbCard.element,
      level: 1
    };
  });
}

/**
 * 현재 상대와 중복되지 않는 새로운 랭킹 대전 상대를 선별하여 반환합니다.
 */
export function pickNewRankOpponent(previousOpponentName?: string | null): RankOpponentInfo {
  // 이전 상대와 다른 후보군 필터
  const candidates = DUMMY_RANK_OPPONENT_POOL.filter(
    u => !previousOpponentName || u.name !== previousOpponentName
  );
  const pool = candidates.length > 0 ? candidates : DUMMY_RANK_OPPONENT_POOL;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  // 카드 덱 생성
  const deck = generateRankOpponentDeck();

  return {
    ...picked,
    deck
  };
}
