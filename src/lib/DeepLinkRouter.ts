/**
 * DeepLinkRouter.ts - SCR-01-20
 * 1글자 입력 시 즉시 딥링크 이동하는 퀵 커맨드 라우터
 */

export interface QuickCommand {
  id: string;
  title: string;
  category: string;
  view: string;
  keywords: string[];
}

export const COMMAND_REGISTRY: QuickCommand[] = [
  { id: 'arena', title: '배틀 아레나', category: '전투', view: 'play', keywords: ['arena', 'battle', '배틀', '전투'] },
  { id: 'deck', title: '마이덱 관리', category: '덱', view: 'deck', keywords: ['deck', '덱', '카드', '편성'] },
  { id: 'shop', title: '상점 & 가챠', category: '상점', view: 'shop', keywords: ['shop', 'gacha', '가챠', '뽑기', '소환'] },
  { id: 'market', title: '카드 마켓', category: '경제', view: 'marketplace', keywords: ['market', '거래', '시세', '호가'] },
  { id: 'stock', title: '가상 주식', category: '경제', view: 'stock', keywords: ['stock', '주식', '증시'] },
  { id: 'guild', title: '길드 하우스', category: '소셜', view: 'guild', keywords: ['guild', '길드', '레이드'] },
  { id: 'rank', title: '명예의 전당', category: '소셜', view: 'leaderboard', keywords: ['rank', '랭킹', '순위'] },
  { id: 'quest', title: '퀘스트 센터', category: '업적', view: 'quest', keywords: ['quest', '미션', '업적'] },
];

export class DeepLinkRouter {
  public search(query: string): QuickCommand[] {
    const q = query.trim().toLowerCase();
    if (!q) return COMMAND_REGISTRY;
    return COMMAND_REGISTRY.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }
}
