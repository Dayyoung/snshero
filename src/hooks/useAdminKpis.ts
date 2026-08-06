import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────

export interface KpiSnapshot {
  /** Daily Active Users */
  dau: number;
  /** Weekly Active Users */
  wau: number;
  /** D1 retention rate (0-1) */
  retentionD1: number;
  /** D7 retention rate (0-1) */
  retentionD7: number;
  /** D30 retention rate (0-1) */
  retentionD30: number;
}

export interface ConversionFunnelStep {
  label: string;
  count: number;
}

export interface ConversionFunnelData {
  steps: ConversionFunnelStep[];
}

export interface WeeklyTrendPoint {
  date: string; // YYYY-MM-DD
  dau: number;
  wau: number;
  newUsers: number;
}

export interface KpiPeriod {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface AdminKpisData {
  snapshot: KpiSnapshot;
  weeklyTrend: WeeklyTrendPoint[];
  funnel: ConversionFunnelData;
  loading: boolean;
  error: string | null;
}

// ─── Provider Interface ───────────────────────────────────────────────

/**
 * Implement this interface to swap the mock provider for a real
 * backend (Firestore aggregation, PostHog, BigQuery, etc.).
 */
export interface KpiProvider {
  fetchKpis(period: KpiPeriod): Promise<AdminKpisData>;
}

// ─── Mock Provider ────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockSnapshot(): KpiSnapshot {
  return {
    dau: randomInt(800, 2400),
    wau: randomInt(5000, 14000),
    retentionD1: +(Math.random() * 0.3 + 0.3).toFixed(2),
    retentionD7: +(Math.random() * 0.2 + 0.1).toFixed(2),
    retentionD30: +(Math.random() * 0.1 + 0.05).toFixed(2),
  };
}

function generateMockWeeklyTrend(period: KpiPeriod): WeeklyTrendPoint[] {
  const points: WeeklyTrendPoint[] = [];
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  const cursor = new Date(start);

  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10);
    points.push({
      date: dateStr,
      dau: randomInt(600, 2600),
      wau: randomInt(4000, 15000),
      newUsers: randomInt(20, 200),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}

function generateMockFunnel(): ConversionFunnelData {
  const total = randomInt(3000, 8000);
  return {
    steps: [
      { label: 'webtoon_views', count: total },
      { label: 'game_sessions', count: Math.round(total * 0.55) },
      { label: 'cardpack_views', count: Math.round(total * 0.28) },
      { label: 'purchase_attempts', count: Math.round(total * 0.09) },
    ],
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockProvider: KpiProvider = {
  async fetchKpis(period: KpiPeriod): Promise<AdminKpisData> {
    // Simulate a short network delay
    await delay(400);
    return {
      snapshot: generateMockSnapshot(),
      weeklyTrend: generateMockWeeklyTrend(period),
      funnel: generateMockFunnel(),
      loading: false,
      error: null,
    };
  },
};

// ─── Hook ─────────────────────────────────────────────────────────────

const DEFAULT_PERIOD: KpiPeriod = (() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 13); // last 14 days
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
})();

/**
 * React hook that fetches admin KPI data.
 *
 * By default it uses the mock provider. To switch to a real backend
 * (Firestore / PostHog), pass a custom provider:
 *
 * ```ts
 * const { data } = useAdminKpis(period, firestoreKpiProvider);
 * ```
 */
export function useAdminKpis(
  period: KpiPeriod = DEFAULT_PERIOD,
  provider: KpiProvider = mockProvider,
) {
  const [data, setData] = useState<AdminKpisData>({
    snapshot: { dau: 0, wau: 0, retentionD1: 0, retentionD7: 0, retentionD30: 0 },
    weeklyTrend: [],
    funnel: { steps: [] },
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await provider.fetchKpis(period);
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load KPIs';
      setData((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [period, provider]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...data, refetch: fetch };
}
