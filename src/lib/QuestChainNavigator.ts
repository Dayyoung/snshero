/**
 * QuestChainNavigator.ts - SCR-11-23
 * 다음 추천 퀘스트 체인 산출 및 자동 네비게이션 엔진
 */

export interface RecommendedQuest {
  id: string;
  title: string;
  targetView: string;
  isReadyToClaim: boolean;
  rewardAmount?: number;
  category?: string;
}

export class QuestChainNavigator {
  private static defaultQuests: RecommendedQuest[] = [
    {
      id: 'quest-daily-battle',
      title: '일일 카드 배틀 1회 승리',
      targetView: 'battle',
      isReadyToClaim: false,
      rewardAmount: 50,
      category: 'daily',
    },
    {
      id: 'quest-market-trade',
      title: '카드 마켓플레이스 둘러보기',
      targetView: 'market',
      isReadyToClaim: false,
      rewardAmount: 30,
      category: 'daily',
    },
    {
      id: 'quest-gacha-draw',
      title: '오늘의 무료 카드팩 소환',
      targetView: 'shop',
      isReadyToClaim: true,
      rewardAmount: 100,
      category: 'special',
    },
  ];

  public static getNextRecommendedQuest(claimedIds: string[] = []): RecommendedQuest {
    const remaining = this.defaultQuests.filter(q => !claimedIds.includes(q.id));
    return remaining[0] || this.defaultQuests[0];
  }
}

export default QuestChainNavigator;
