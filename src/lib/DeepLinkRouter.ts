/**
 * DeepLinkRouter.ts - SCR-01-20
 * 48px 스마트 퀵 커맨드 런처 딥링크 라우터 및 명령 목록
 */

export interface QuickCommand {
  id: string;
  title: string;
  category: string;
  view: string;
  keywords?: string[];
}

export class DeepLinkRouter {
  private commands: QuickCommand[] = [
    { id: 'cmd-deck', title: '내 카드 덱 편성 및 성장', category: '덱', view: 'deck', keywords: ['deck', 'card', 'cards', 'hero'] },
    { id: 'cmd-battle', title: '실시간 PVP 랭킹 아레나', category: '배틀', view: 'battle', keywords: ['battle', 'pvp', 'arena', 'fight'] },
    { id: 'cmd-market', title: 'P2P 카드 거래소', category: '거래소', view: 'market', keywords: ['market', 'trade', 'p2p', 'exchange'] },
    { id: 'cmd-stock', title: '실시간 주식 / 예측 시장', category: '경제', view: 'stock', keywords: ['stock', 'prediction', 'invest'] },
    { id: 'cmd-shop', title: '카드팩 상점 및 럭키 박스', category: '상점', view: 'shop', keywords: ['shop', 'gacha', 'pack', 'draw'] },
    { id: 'cmd-mission', title: '110종 미션 게임 룸', category: '미션', view: 'play', keywords: ['mission', 'game', 'play', 'poki'] },
    { id: 'cmd-guild', title: '길드 아지트 및 레이드', category: '길드', view: 'guild', keywords: ['guild', 'raid', 'boss'] },
    { id: 'cmd-ranking', title: '글로벌 시즌 명예의 전당', category: '랭킹', view: 'ranking', keywords: ['ranking', 'hall', 'leaderboard'] },
  ];

  public search(query: string): QuickCommand[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.commands;
    return this.commands.filter(cmd =>
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.view.toLowerCase().includes(q) ||
      cmd.keywords?.some(k => k.includes(q))
    );
  }

  public getAll(): QuickCommand[] {
    return this.commands;
  }
}

export default DeepLinkRouter;
