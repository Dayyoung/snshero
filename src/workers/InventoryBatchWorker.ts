/**
 * InventoryBatchWorker.ts - SCR-03-13
 * 대량 카드 분해 및 일괄 정산 백그라운드 Web Worker
 */

interface BatchDismantleTask {
  cardIds: string[];
  rarityMultiplier: Record<string, number>;
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'BATCH_DISMANTLE') {
    const { cardIds, cardsMap } = payload;
    let totalSoulDust = 0;
    let totalSnsRefund = 0;
    const processedIds: string[] = [];

    const CHUNK_SIZE = 25;
    let index = 0;

    function processChunk() {
      const end = Math.min(index + CHUNK_SIZE, cardIds.length);
      for (let i = index; i < end; i++) {
        const id = cardIds[i];
        const card = cardsMap[id];
        if (card) {
          const rarity = card.rarity || 'common';
          const multiplier = rarity === 'mythic' ? 500 : rarity === 'legendary' ? 100 : rarity === 'epic' ? 30 : rarity === 'rare' ? 10 : 2;
          totalSoulDust += multiplier;
          totalSnsRefund += Math.floor(multiplier * 0.5);
          processedIds.push(id);
        }
      }
      index = end;

      self.postMessage({
        type: 'PROGRESS',
        progress: Math.round((index / cardIds.length) * 100),
        processedCount: index,
        totalCount: cardIds.length,
      });

      if (index < cardIds.length) {
        setTimeout(processChunk, 16);
      } else {
        self.postMessage({
          type: 'COMPLETE',
          totalSoulDust,
          totalSnsRefund,
          processedIds,
        });
      }
    }

    processChunk();
  }
};
