import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from '../lib/firebaseMock';
import { getUserCollectionName } from '../lib/utils';
import { CARD_DATABASE } from '../cardDatabase';

export interface TopCardStat {
  index: number;
  count: number;
  name: string;
}

export interface LanguageDistStat {
  language: string;
  count: number;
}

export interface AdminStatsData {
  totalUsers: number;
  recentUsers24h: number;
  recentUsers7d: number;
  returningUsers: number;
  totalGames: number;
  avgWinRate: number;
  avgPower: number;
  newUsersToday: number;
  topCards: TopCardStat[];
  languageDist: LanguageDistStat[];
  loading: boolean;
  error: string | null;
}

export const useAdminStats = (currentSeason: string) => {
  const [stats, setStats] = useState<AdminStatsData>({
    totalUsers: 0,
    recentUsers24h: 0,
    recentUsers7d: 0,
    returningUsers: 0,
    totalGames: 0,
    avgWinRate: 0,
    avgPower: 0,
    newUsersToday: 0,
    topCards: [],
    languageDist: [],
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    setStats(prev => ({ ...prev, loading: true, error: null }));
    try {
      const colRef = collection(db, getUserCollectionName(currentSeason));
      const snap = await getDocs(colRef);

      let totalUsers = 0;
      let recentUsers24h = 0;
      let recentUsers7d = 0;
      let returningUsers = 0;
      let totalGames = 0;
      let totalWinRate = 0;
      let winRateCount = 0;
      let totalPowerSum = 0;
      let powerCount = 0;
      let newUsersToday = 0;
      const cardCounts: Record<number, number> = {};
      const langCounts: Record<string, number> = {};

      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      snap.forEach(doc => {
        const data = doc.data();
        totalUsers++;

        const lastSync = Number(data.lastSync) || 0;
        if (lastSync > now - oneDay) recentUsers24h++;
        if (lastSync > now - oneDay * 7) recentUsers7d++;

        const hasActivity =
          (data.stats && (data.stats.wins || data.stats.losses || data.stats.draws)) ||
          data.tutorialCompleted === true;
        if (lastSync > 0 && hasActivity) returningUsers++;

        if (lastSync >= todayStart.getTime()) newUsersToday++;

        if (data.stats) {
          const wins = data.stats.wins || 0;
          const losses = data.stats.losses || 0;
          const draws = data.stats.draws || 0;
          totalGames += wins + losses + draws;
        }

        if (typeof data.winRate === 'number') {
          totalWinRate += data.winRate;
          winRateCount++;
        }

        if (typeof data.totalPower === 'number') {
          totalPowerSum += data.totalPower;
          powerCount++;
        }

        if (data.inventory) {
          Object.entries(data.inventory).forEach(([idx, record]) => {
            const rec = record as { quantity?: number };
            const count = rec?.quantity || 1;
            const index = Number(idx);
            cardCounts[index] = (cardCounts[index] || 0) + count;
          });
        }

        const lang = data.language || 'en';
        langCounts[lang] = (langCounts[lang] || 0) + 1;
      });

      const avgWinRate = winRateCount > 0 ? parseFloat((totalWinRate / winRateCount).toFixed(1)) : 0;
      const avgPower = powerCount > 0 ? Math.round(totalPowerSum / powerCount) : 0;

      const topCards = Object.entries(cardCounts)
        .map(([index, count]) => {
          const idx = Number(index);
          const dbCard = CARD_DATABASE[idx];
          return {
            index: idx,
            count,
            name: dbCard?.title || dbCard?.title_en || `Card #${idx}`,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const languageDist = Object.entries(langCounts)
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalUsers,
        recentUsers24h,
        recentUsers7d,
        returningUsers,
        totalGames,
        avgWinRate,
        avgPower,
        newUsersToday,
        topCards,
        languageDist,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stats';
      setStats(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [currentSeason]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...stats, refetch: fetchStats };
};
