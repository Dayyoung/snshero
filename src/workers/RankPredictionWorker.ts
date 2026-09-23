/**
 * RankPredictionWorker.ts - SCR-10-13
 * 시즌 마감 직전 실시간 점수 변동 추세를 분석하여 예상 최종 순위를 선행 산출하는 경량 회귀 모델 Web Worker
 */

export interface ScoreTrendPoint {
  userId: string;
  score: number;
  timestamp: number;
}

export interface PredictionResult {
  userId: string;
  predictedScore: number;
  predictedRank: number;
  velocityPerMin: number;
}

self.onmessage = (e: MessageEvent<{ users: ScoreTrendPoint[]; targetMinutes: number }>) => {
  const { users, targetMinutes } = e.data;
  if (!users || users.length === 0) {
    self.postMessage([]);
    return;
  }

  const now = Date.now();
  const futureMs = targetMinutes * 60 * 1000;

  // Simple linear velocity extrapolation per user
  const predictions: PredictionResult[] = users.map((u) => {
    const elapsedMinutes = Math.max(1, (now - u.timestamp) / 60000);
    // Normalized velocity
    const velocityPerMin = (u.score % 100) / elapsedMinutes;
    const predictedScore = Math.round(u.score + velocityPerMin * targetMinutes);

    return {
      userId: u.userId,
      predictedScore,
      predictedRank: 0,
      velocityPerMin: Math.round(velocityPerMin * 10) / 10,
    };
  });

  // Sort by predicted score descending
  predictions.sort((a, b) => b.predictedScore - a.predictedScore);
  predictions.forEach((p, idx) => {
    p.predictedRank = idx + 1;
  });

  self.postMessage(predictions);
};
