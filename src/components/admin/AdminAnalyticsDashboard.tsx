import React, { useState, useMemo } from 'react';
import { Language } from '../../types';
import { t } from '../../lib/i18n';
import { useAdminKpis, type WeeklyTrendPoint, type KpiPeriod } from '../../hooks/useAdminKpis';
import {
  TrendingUp,
  Users,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Filter,
} from 'lucide-react';

interface AdminAnalyticsDashboardProps {
  language: Language;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function toRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

function periodLabel(p: KpiPeriod, lang: Language): string {
  const fmt = lang === 'ko'
    ? `${p.startDate} ~ ${p.endDate}`
    : `${p.startDate} – ${p.endDate}`;
  return fmt;
}

// ─── KPI Card ─────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string;
  change?: { value: string; positive: boolean };
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-slate-500">{icon}</span>
      </div>
      <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
      {change && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${change.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {change.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change.value}
        </div>
      )}
    </div>
  );
}

// ─── Simple SVG Bar Chart ─────────────────────────────────────────────

function WeeklyTrendChart({
  data,
  language,
}: {
  data: WeeklyTrendPoint[];
  language: Language;
}) {
  const maxValue = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map((d) => Math.max(d.dau, d.wau, d.newUsers)), 1);
  }, [data]);

  const chartW = 600;
  const chartH = 200;
  const padLeft = 40;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 24;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;

  if (data.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm text-center text-xs text-slate-500 py-12">
        {t('admin_analytics_no_data', language)}
      </div>
    );
  }

  const barWidth = Math.max(4, Math.min(14, plotW / data.length / 3 - 2));
  const groupWidth = barWidth * 3 + 4;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm overflow-x-auto">
      <div className="flex items-center gap-3 mb-3">
        <BarChart3 size={14} className="text-indigo-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {t('admin_analytics_weekly_trend', language)}
        </span>
      </div>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-w-full" style={{ minWidth: 300 }}>
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padTop + plotH * (1 - frac);
          return (
            <g key={frac}>
              <line x1={padLeft} y1={y} x2={chartW - padRight} y2={y} stroke="rgba(148,163,184,0.1)" />
              <text x={padLeft - 6} y={y + 4} textAnchor="end" className="text-[8px] fill-slate-500" fontFamily="sans-serif">
                {formatCount(Math.round(maxValue * frac))}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {data.map((point, i) => {
          const x = padLeft + i * groupWidth + 2;
          const dauH = (point.dau / maxValue) * plotH;
          const wauH = (point.wau / maxValue) * plotH;
          const newH = (point.newUsers / maxValue) * plotH;

          return (
            <g key={point.date}>
              <rect
                x={x}
                y={padTop + plotH - dauH}
                width={barWidth}
                height={dauH}
                fill="rgba(99,102,241,0.7)"
                rx={1}
              />
              <rect
                x={x + barWidth + 1}
                y={padTop + plotH - wauH}
                width={barWidth}
                height={wauH}
                fill="rgba(168,85,247,0.5)"
                rx={1}
              />
              <rect
                x={x + barWidth * 2 + 2}
                y={padTop + plotH - newH}
                width={barWidth}
                height={newH}
                fill="rgba(34,211,238,0.6)"
                rx={1}
              />
              {/* X-axis label (show every Nth) */}
              {data.length <= 10 || i % Math.ceil(data.length / 7) === 0 ? (
                <text
                  x={x + groupWidth / 2}
                  y={chartH - 4}
                  textAnchor="middle"
                  className="text-[7px] fill-slate-500"
                  fontFamily="sans-serif"
                >
                  {point.date.slice(5)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-indigo-500/70 inline-block" />
          {t('admin_analytics_dau', language)}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-purple-500/50 inline-block" />
          {t('admin_analytics_wau', language)}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-cyan-400/60 inline-block" />
          {t('admin_analytics_new_users', language)}
        </span>
      </div>
    </div>
  );
}

// ─── Funnel Chart ─────────────────────────────────────────────────────

function ConversionFunnel({
  steps,
  language,
}: {
  steps: { label: string; count: number }[];
  language: Language;
}) {
  if (steps.length === 0) return null;

  const maxCount = steps[0]?.count ?? 1;

  const stepLabels: Record<string, string> = {
    webtoon_views: t('admin_analytics_funnel_webtoon', language),
    game_sessions: t('admin_analytics_funnel_game', language),
    cardpack_views: t('admin_analytics_funnel_cardpack', language),
    purchase_attempts: t('admin_analytics_funnel_purchase', language),
  };

  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-cyan-500', 'bg-emerald-500'];

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <Filter size={14} className="text-indigo-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {t('admin_analytics_conversion_funnel', language)}
        </span>
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const pct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
          const prevCount = i > 0 ? steps[i - 1].count : step.count;
          const dropPct = prevCount > 0 ? ((prevCount - step.count) / prevCount * 100).toFixed(0) : '0';
          const showDrop = i > 0;

          return (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300">
                  {stepLabels[step.label] ?? step.label}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {formatCount(step.count)}
                  {showDrop && (
                    <span className="ml-2 text-[10px] text-rose-400">
                      (-{dropPct}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Period Selector ──────────────────────────────────────────────────

function PeriodSelector({
  period,
  onChange,
  language,
}: {
  period: KpiPeriod;
  onChange: (p: KpiPeriod) => void;
  language: Language;
}) {
  const presets: { labelKo: string; labelEn: string; days: number }[] = [
    { labelKo: '7일', labelEn: '7D', days: 7 },
    { labelKo: '14일', labelEn: '14D', days: 14 },
    { labelKo: '30일', labelEn: '30D', days: 30 },
  ];

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    onChange({ startDate: fmt(start), endDate: fmt(end) });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {t('admin_analytics_period', language)}
      </span>
      {presets.map((preset) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - (preset.days - 1));
        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        const active = period.startDate === fmt(start) && period.endDate === fmt(end);

        return (
          <button
            key={preset.days}
            type="button"
            onClick={() => handlePreset(preset.days)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all ${
              active
                ? 'border-indigo-500/50 text-white bg-indigo-600/20'
                : 'border-slate-700/50 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {language === 'ko' ? preset.labelKo : preset.labelEn}
          </button>
        );
      })}
      <span className="text-[10px] text-slate-500 ml-2">{periodLabel(period, language)}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({ language }) => {
  const defaultPeriod: KpiPeriod = (() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 13);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { startDate: fmt(start), endDate: fmt(end) };
  })();

  const [period, setPeriod] = useState<KpiPeriod>(defaultPeriod);
  const { snapshot, weeklyTrend, funnel, loading, error, refetch } = useAdminKpis(period);
  const funnelCounts = useMemo(() => {
    const getCount = (label: string) => funnel.steps.find((step) => step.label === label)?.count ?? 0;
    const webtoonViews = getCount('webtoon_views');
    const gameSessions = getCount('game_sessions');
    const cardpackViews = getCount('cardpack_views');
    const purchaseAttempts = getCount('purchase_attempts');

    return {
      webtoonToGameRate: toRate(gameSessions, webtoonViews),
      cardpackPurchaseRate: toRate(purchaseAttempts, cardpackViews),
    };
  }, [funnel.steps]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <TrendingUp size={18} className="text-indigo-400" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            {t('admin_analytics_title', language)}
          </h3>
        </div>
        <button
          type="button"
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider rounded-xl border border-slate-700/50 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {t('admin_analytics_refresh', language)}
        </button>
      </div>

      <PeriodSelector period={period} onChange={setPeriod} language={language} />

      {error && (
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <KpiCard
          label={t('admin_analytics_dau', language)}
          value={loading ? '...' : formatCount(snapshot.dau)}
          icon={<Users size={14} />}
        />
        <KpiCard
          label={t('admin_analytics_wau', language)}
          value={loading ? '...' : formatCount(snapshot.wau)}
          icon={<Activity size={14} />}
        />
        <KpiCard
          label={t('admin_analytics_retention_d1', language)}
          value={loading ? '...' : formatPct(snapshot.retentionD1)}
          icon={<TrendingUp size={14} />}
        />
        <KpiCard
          label={t('admin_analytics_retention_d7', language)}
          value={loading ? '...' : formatPct(snapshot.retentionD7)}
          icon={<TrendingUp size={14} />}
        />
        <KpiCard
          label={t('admin_analytics_retention_d30', language)}
          value={loading ? '...' : formatPct(snapshot.retentionD30)}
          icon={<TrendingUp size={14} />}
        />
        <KpiCard
          label={t('admin_analytics_webtoon_to_game_rate', language)}
          value={loading ? '...' : formatPct(funnelCounts.webtoonToGameRate)}
          icon={<ArrowUpRight size={14} />}
        />
        <KpiCard
          label={t('admin_analytics_cardpack_purchase_rate', language)}
          value={loading ? '...' : formatPct(funnelCounts.cardpackPurchaseRate)}
          icon={<ArrowUpRight size={14} />}
        />
      </div>

      {/* Weekly Trend Chart */}
      <WeeklyTrendChart data={weeklyTrend} language={language} />

      {/* Conversion Funnel */}
      <ConversionFunnel steps={funnel.steps} language={language} />
    </div>
  );
};

export default AdminAnalyticsDashboard;
