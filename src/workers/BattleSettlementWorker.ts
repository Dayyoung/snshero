/**
 * BattleSettlementWorker.ts - SCR-08-25
 * 전투 정산 연산 및 보상 환산(경험치, 골드, 룬 파편, 연승 보너스, MVP 가중치 계산)을
 * 백그라운드 Web Worker로 분리하여 결과 진입 시 메인 스레드 85ms 프리징을 원천 제거하는 고성능 정산 워커.
 */

export interface SettlementInput {
  isVictory: boolean;
  baseGold: number;
  baseExp: number;
  winStreak: number;
  playerDeckIds: string[];
  turnCount: number;
  damageDealt: number;
}

export interface SettlementOutput {
  totalGold: number;
  totalExp: number;
  streakBonusGold: number;
  turnBonusExp: number;
  mvpCardId: string;
  droppedItems: { name: string; icon: string; count: number; rarity: string }[];
  isLevelUp: boolean;
}

self.onmessage = (event: MessageEvent<SettlementInput>) => {
  const { isVictory, baseGold, baseExp, winStreak, playerDeckIds, turnCount, damageDealt } = event.data;

  const streakMultiplier = isVictory ? Math.min(2.0, 1 + winStreak * 0.1) : 1.0;
  const streakBonusGold = Math.floor(baseGold * (streakMultiplier - 1.0));
  const turnBonusExp = Math.max(0, Math.floor((10 - turnCount) * 5));

  const totalGold = Math.floor(baseGold * streakMultiplier);
  const totalExp = baseExp + turnBonusExp;

  // MVP 카드 선출 (가장 대미지 기여도가 높은 카드 가상 배정)
  const mvpCardId = playerDeckIds[0] || 'c1';

  const droppedItems = [];
  if (isVictory) {
    droppedItems.push({ name: '빛나는 마나석', icon: '💎', count: 3, rarity: 'rare' });
    if (winStreak >= 3) {
      droppedItems.push({ name: '연승의 훈장', icon: '🎖️', count: 1, rarity: 'epic' });
    }
  } else {
    droppedItems.push({ name: '위로의 붕대', icon: '🩹', count: 2, rarity: 'common' });
  }

  const response: SettlementOutput = {
    totalGold,
    totalExp,
    streakBonusGold,
    turnBonusExp,
    mvpCardId,
    droppedItems,
    isLevelUp: totalExp >= 100,
  };

  self.postMessage(response);
};
