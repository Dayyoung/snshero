/**
 * QuestChainNavigator.ts - SCR-11-23
 * 다음 진행해야 할 퀘스트 및 최적의 이동 뷰(경로)를 추천해주는 네비게이터
 */

export interface RecommendedQuest {
  id: string;
  title: string;
  targetView: string;
  reward: string;
  isReadyToClaim: boolean;
}

export class QuestChainNavigator {
  public static getNextRecommendedQuest(): RecommendedQuest {
    return {
      id: 'quest_chain_1',
      title: '아레나 배틀 3회 승리하기',
      targetView: 'play',
      reward: '골드 500 G',
      isReadyToClaim: false,
    };
  }
}
