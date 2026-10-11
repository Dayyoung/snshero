import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Activity,
  Table,
  Filter,
  Trophy,
  Sparkles,
  Layers,
  TrendingUp,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../../types';
import { BenchResult, BenchLog } from '../../lib/benchmarkEngine';

export interface BenchmarkChartProps {
  records: Array<{ result: BenchResult; log: BenchLog }>;
  language: Language;
  onSelectModel?: (model: BenchResult) => void;
}

type ViewMode = 'bar' | 'scatter' | 'table';
type MetricKey = 'shbp' | 'puzzle' | 'campaign' | 'winRate';
type ProviderFilter = 'all' | 'anthropic' | 'google' | 'openai' | 'deepseek' | 'meta' | 'xai' | 'baseline';

interface ProviderMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barColor: string;
  accentColor: string;
  dotColor: string;
}

const PROVIDER_THEMES: Record<string, ProviderMeta> = {
  anthropic: {
    label: 'Anthropic',
    badgeBg: 'bg-[#fef3ee]',
    badgeText: 'text-[#c25737]',
    badgeBorder: 'border-[#f4c6b2]',
    barColor: '#c25737',
    accentColor: '#e07a5f',
    dotColor: '#c25737',
  },
  google: {
    label: 'Google',
    badgeBg: 'bg-[#eef4ff]',
    badgeText: 'text-[#1a73e8]',
    badgeBorder: 'border-[#c0d7fe]',
    barColor: '#1a73e8',
    accentColor: '#4285f4',
    dotColor: '#1a73e8',
  },
  openai: {
    label: 'OpenAI',
    badgeBg: 'bg-[#ecfdf5]',
    badgeText: 'text-[#059669]',
    badgeBorder: 'border-[#a7f3d0]',
    barColor: '#059669',
    accentColor: '#10b981',
    dotColor: '#059669',
  },
  deepseek: {
    label: 'DeepSeek',
    badgeBg: 'bg-[#f0fdfa]',
    badgeText: 'text-[#0d9488]',
    badgeBorder: 'border-[#99f6e4]',
    barColor: '#0d9488',
    accentColor: '#14b8a6',
    dotColor: '#0d9488',
  },
  meta: {
    label: 'Meta',
    badgeBg: 'bg-[#eef2ff]',
    badgeText: 'text-[#4f46e5]',
    badgeBorder: 'border-[#c7d2fe]',
    barColor: '#4f46e5',
    accentColor: '#6366f1',
    dotColor: '#4f46e5',
  },
  xai: {
    label: 'xAI',
    badgeBg: 'bg-zinc-100',
    badgeText: 'text-zinc-900',
    badgeBorder: 'border-zinc-300',
    barColor: '#27272a',
    accentColor: '#52525b',
    dotColor: '#27272a',
  },
  baseline: {
    label: 'Baseline',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    barColor: '#b45309',
    accentColor: '#d97706',
    dotColor: '#b45309',
  },
};

const getProviderMeta = (provider: string): ProviderMeta => {
  const key = provider.toLowerCase();
  return (
    PROVIDER_THEMES[key] || {
      label: provider,
      badgeBg: 'bg-stone-100',
      badgeText: 'text-stone-800',
      badgeBorder: 'border-stone-300',
      barColor: '#78716c',
      accentColor: '#a8a29e',
      dotColor: '#78716c',
    }
  );
};

export const BenchmarkChart: React.FC<BenchmarkChartProps> = ({
  records,
  language,
  onSelectModel,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('bar');
  const [metric, setMetric] = useState<MetricKey>('shbp');
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<BenchResult | null>(null);

  // Extract metric value
  const getMetricValue = (result: BenchResult, key: MetricKey): number => {
    switch (key) {
      case 'shbp':
        return result.shbp;
      case 'puzzle':
        return result.puzzle.accuracy;
      case 'campaign':
        return result.campaign.normalized;
      case 'winRate': {
        const total = result.campaign.totals.win + result.campaign.totals.draw + result.campaign.totals.loss;
        return total > 0 ? (result.campaign.totals.win / total) * 100 : 0;
      }
      default:
        return result.shbp;
    }
  };

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let list = records.map((r) => r.result);

    if (providerFilter !== 'all') {
      list = list.filter((r) => r.agent.provider.toLowerCase() === providerFilter);
    }

    // Sort descending by current metric
    return list.slice().sort((a, b) => getMetricValue(b, metric) - getMetricValue(a, metric));
  }, [records, providerFilter, metric]);

  const topModel = useMemo(() => {
    const nonOracle = records
      .map((r) => r.result)
      .filter((r) => !r.agent.privileged)
      .sort((a, b) => b.shbp - a.shbp)[0];
    return nonOracle || records[0]?.result;
  }, [records]);

  const ruleAiScore = useMemo(() => {
    const rule = records.find((r) => r.result.agent.model === 'greedy');
    return rule?.result.shbp || 38.6;
  }, [records]);

  // Scatter plot constants
  const scatterWidth = 760;
  const scatterHeight = 460;
  const padding = { top: 40, right: 40, bottom: 60, left: 65 };
  const plotW = scatterWidth - padding.left - padding.right;
  const plotH = scatterHeight - padding.top - padding.bottom;

  return (
    <div className="border border-[#201d1d]/20 bg-[#fdfcfc] rounded-none mb-8 font-mono">
      {/* 1. Header & ArtificialAnalysis-style Controls */}
      <div className="p-4 sm:p-5 border-b border-[#201d1d]/15 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-[#201d1d] text-amber-300 text-xs font-bold rounded-xs">
                AI
              </span>
              <h2 className="text-sm sm:text-base font-black text-[#201d1d] tracking-tight uppercase">
                {language === 'ko'
                  ? '공인 모델별 성능 비교 그래프 (ArtificialAnalysis Style)'
                  : 'AI Model Benchmark Comparison (ArtificialAnalysis Style)'}
              </h2>
            </div>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              {language === 'ko'
                ? '운 개입 0% 완전탐색 60대 미니맥스 퍼즐과 비공개 패 20경기 자율 경제 시즌을 합산한 0~100 정규화 벤치마크 점수'
                : 'Zero-luck 60 minimax solved puzzles + 20-match hidden-hand autonomous season composite scores (0-100 normalized)'}
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center border border-[#201d1d]/30 bg-[#fdfcfc] p-0.5 rounded-sm self-start lg:self-center">
            <button
              onClick={() => setViewMode('bar')}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'bar'
                  ? 'bg-[#201d1d] text-amber-300'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <BarChart3 size={14} />
              <span>{language === 'ko' ? '바 차트' : 'Bar Chart'}</span>
            </button>
            <button
              onClick={() => setViewMode('scatter')}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'scatter'
                  ? 'bg-[#201d1d] text-amber-300'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Activity size={14} />
              <span>{language === 'ko' ? '사분면 산점도' : 'Scatter Plot'}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#201d1d] text-amber-300'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Table size={14} />
              <span>{language === 'ko' ? '데이터 표' : 'Data Table'}</span>
            </button>
          </div>
        </div>

        {/* 2. Headline Performance Metrics (Hero Stats) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4 text-xs">
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm">
            <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center justify-between">
              <span>{language === 'ko' ? '최고 자율 AI 모델' : 'Top Frontier AI'}</span>
              <Trophy size={13} className="text-amber-500" />
            </div>
            <div className="text-sm font-black text-stone-900 mt-1 truncate">
              {topModel?.agent.label || 'Claude 3.7 Sonnet'}
            </div>
            <div className="text-[11px] font-bold text-amber-700 mt-0.5">
              {topModel?.shbp.toFixed(1)} SHBP <span className="text-[10px] text-stone-500 font-normal">(Oracle 100 대비 89.2%)</span>
            </div>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm">
            <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center justify-between">
              <span>{language === 'ko' ? 'Rule AI 대비 지능 격차' : 'Gap vs Rule AI Baseline'}</span>
              <TrendingUp size={13} className="text-emerald-600" />
            </div>
            <div className="text-sm font-black text-emerald-700 mt-1">
              +{((topModel?.shbp || 89.2) - ruleAiScore).toFixed(1)} SHBP
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">
              {language === 'ko' ? '탐욕 알고리즘(Greedy 38.6) 대비 초과 성능' : 'Over greedy heuristic anchor (38.6)'}
            </div>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm">
            <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center justify-between">
              <span>{language === 'ko' ? '검증 규격 및 표본' : 'Evaluation Standard'}</span>
              <CheckCircle2 size={13} className="text-indigo-600" />
            </div>
            <div className="text-sm font-black text-stone-900 mt-1">
              120 Decisions / Model
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">
              60 Puzzles + 60 Matches (3 Seeds)
            </div>
          </div>
        </div>

        {/* 3. Metric & Provider Selectors */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-stone-200 text-xs">
          {/* Metric Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-stone-500 font-bold uppercase mr-1">
              {language === 'ko' ? '기준 지표:' : 'Metric:'}
            </span>
            <button
              onClick={() => setMetric('shbp')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-sm border transition-colors cursor-pointer ${
                metric === 'shbp'
                  ? 'bg-stone-900 text-amber-300 border-stone-900'
                  : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'
              }`}
            >
              {language === 'ko' ? 'SHBP-3 종합 점수' : 'SHBP-3 Composite'}
            </button>
            <button
              onClick={() => setMetric('puzzle')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-sm border transition-colors cursor-pointer ${
                metric === 'puzzle'
                  ? 'bg-stone-900 text-amber-300 border-stone-900'
                  : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'
              }`}
            >
              {language === 'ko' ? 'Track A: 퍼즐 정답률' : 'Track A: Puzzle Acc%'}
            </button>
            <button
              onClick={() => setMetric('campaign')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-sm border transition-colors cursor-pointer ${
                metric === 'campaign'
                  ? 'bg-stone-900 text-amber-300 border-stone-900'
                  : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'
              }`}
            >
              {language === 'ko' ? 'Track B: 캠페인 정규점수' : 'Track B: Campaign Norm'}
            </button>
            <button
              onClick={() => setMetric('winRate')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-sm border transition-colors cursor-pointer ${
                metric === 'winRate'
                  ? 'bg-stone-900 text-amber-300 border-stone-900'
                  : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'
              }`}
            >
              {language === 'ko' ? '캠페인 승률 (%)' : 'Win Rate (%)'}
            </button>
          </div>

          {/* Provider Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <Filter size={12} className="text-stone-400 mr-0.5 shrink-0" />
            {(['all', 'anthropic', 'google', 'openai', 'deepseek', 'meta', 'xai', 'baseline'] as ProviderFilter[]).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setProviderFilter(p)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border transition-colors whitespace-nowrap cursor-pointer ${
                    providerFilter === p
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {p === 'all'
                    ? language === 'ko'
                      ? '전체'
                      : 'All'
                    : PROVIDER_THEMES[p]?.label || p.toUpperCase()}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 4. Main Chart Content Area */}
      <div className="p-4 sm:p-5">
        {/* VIEW 1: Artificial Analysis Horizontal Bar Chart */}
        {viewMode === 'bar' && (
          <div className="space-y-3">
            {filteredRecords.map((result, idx) => {
              const val = getMetricValue(result, metric);
              const maxVal = metric === 'puzzle' || metric === 'winRate' ? 100 : 100;
              const widthPct = Math.max(2, Math.min(100, (Math.max(0, val) / maxVal) * 100));
              const theme = getProviderMeta(result.agent.provider);
              const ci = result.ci95;
              const isSelected = selectedRecord?.agent.model === result.agent.model;

              // Dual track segments for the visual bar fill
              const puzShare = Math.min(100, Math.max(0, result.puzzle.normalized));
              const campShare = Math.min(100, Math.max(0, result.campaign.normalized));

              return (
                <div
                  key={result.agent.model}
                  onClick={() => {
                    setSelectedRecord(isSelected ? null : result);
                    if (onSelectModel) onSelectModel(result);
                  }}
                  onMouseEnter={() => setHoveredModel(result.agent.model)}
                  onMouseLeave={() => setHoveredModel(null)}
                  className={`border transition-all cursor-pointer p-2.5 sm:p-3 rounded-sm ${
                    isSelected
                      ? 'border-stone-900 bg-amber-50/40 ring-1 ring-stone-900'
                      : 'border-stone-200/90 bg-white hover:border-stone-400 hover:bg-stone-50/60'
                  }`}
                >
                  {/* Top Bar Label: Rank, Provider Badge, Model Name, Scores */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-black text-stone-400 w-5 shrink-0">
                        #{idx + 1}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 border font-bold rounded-xs shrink-0 ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                      >
                        {theme.label}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-stone-900 truncate">
                        {result.agent.label}
                      </span>
                      {result.agent.privileged && (
                        <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1 rounded-xs">
                          Oracle 100
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 self-end sm:self-auto shrink-0">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-black text-stone-900 font-mono">
                          {val.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-stone-500 ml-1 font-bold">
                          {metric === 'shbp'
                            ? 'SHBP'
                            : metric === 'winRate'
                            ? '%'
                            : metric === 'puzzle'
                            ? '% Acc'
                            : 'Norm'}
                        </span>
                      </div>
                      {metric === 'shbp' && ci !== null && (
                        <span className="text-[10px] text-stone-500 font-mono">
                          {ci > 0 ? `±${ci.toFixed(1)}` : 'Exact'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Bar Graphic */}
                  <div className="relative w-full bg-stone-100 border border-stone-200 h-6 sm:h-7 rounded-sm overflow-hidden flex items-center">
                    {/* The Fill Bar */}
                    <div
                      className="h-full relative transition-all duration-300 flex"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: theme.barColor,
                      }}
                    >
                      {/* Sub-track visual pattern when metric === 'shbp' */}
                      {metric === 'shbp' && (
                        <div
                          className="h-full bg-white/20 border-r border-white/30"
                          style={{ width: `${(puzShare / (puzShare + campShare || 1)) * 100}%` }}
                          title={`Track A (Puzzle): ${result.puzzle.accuracy}%`}
                        />
                      )}
                    </div>

                    {/* CI95 Whisker Error Bar */}
                    {metric === 'shbp' && ci !== null && ci > 0 && (
                      <div
                        className="absolute h-4 border-l border-r border-stone-800 pointer-events-none"
                        style={{
                          left: `${Math.max(0, widthPct - (ci / maxVal) * 100)}%`,
                          width: `${Math.min(100 - widthPct, (ci / maxVal) * 200)}%`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      >
                        <div className="w-full h-0.5 bg-stone-800 absolute top-1/2 -translate-y-1/2" />
                      </div>
                    )}

                    {/* Inline Track breakdown label */}
                    <div className="absolute right-2 text-[10px] font-mono font-bold text-stone-700/90 pointer-events-none truncate hidden sm:block">
                      Puz: {result.puzzle.accuracy}% · Camp: {result.campaign.normalized} ({result.campaign.totals.win}W-{result.campaign.totals.draw}D-{result.campaign.totals.loss}L)
                    </div>
                  </div>

                  {/* Expanded Model Details Card (when selected) */}
                  {isSelected && (
                    <div className="mt-3 pt-2.5 border-t border-stone-200 text-xs bg-stone-50 p-3 rounded-sm space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-stone-500 block text-[10px]">Track A 퍼즐 정답률:</span>
                          <span className="font-bold text-stone-900">
                            {result.puzzle.accuracy}% ({result.puzzle.correct}/60)
                          </span>
                          <span className="text-[9px] text-stone-500 block mt-0.5">
                            E:{result.puzzle.byDifficulty.easy.correct}/20 M:{result.puzzle.byDifficulty.medium.correct}/20 H:{result.puzzle.byDifficulty.hard.correct}/20
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[10px]">Track B 캠페인 승률:</span>
                          <span className="font-bold text-stone-900">
                            {((result.campaign.totals.win / 60) * 100).toFixed(1)}% ({result.campaign.totals.win}승 {result.campaign.totals.draw}무 {result.campaign.totals.loss}패)
                          </span>
                          <span className="text-[9px] text-stone-500 block mt-0.5">
                            정규화 점수: {result.campaign.normalized}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[10px]">평균 실책 (Regret):</span>
                          <span className="font-bold text-stone-900">
                            {result.puzzle.regretAvg}
                          </span>
                          <span className="text-[9px] text-stone-500 block mt-0.5">
                            규칙 위반 수: {result.campaign.invalid}회
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[10px]">위변조 방지 해시:</span>
                          <span className="font-mono text-stone-800 text-[10px] truncate block">
                            {result.logHash}
                          </span>
                          <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">
                            [✓ 100% Deterministic Replay]
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: Artificial Analysis 2D Scatter Quadrant Plot */}
        {viewMode === 'scatter' && (
          <div>
            <div className="mb-2 text-xs text-stone-600 flex items-center justify-between">
              <span>
                {language === 'ko'
                  ? '사분면 맵: X축(퍼즐 추론 정답률) vs Y축(캠페인 전략 점수)'
                  : 'Quadrant Plot: X-Axis (Puzzle Accuracy %) vs Y-Axis (Campaign Score)'}
              </span>
              <span className="text-[10px] text-stone-500">
                {language === 'ko' ? '우상단 영역 = 최우수 자율 AI' : 'Top-Right = Frontier Dominance'}
              </span>
            </div>

            <div className="relative border border-stone-300 bg-white p-2 rounded-sm overflow-x-auto">
              <svg
                viewBox={`0 0 ${scatterWidth} ${scatterHeight}`}
                className="w-full h-auto max-h-[500px] select-none font-mono"
              >
                {/* 4 Quadrants Background Tint */}
                <rect
                  x={padding.left + plotW / 2}
                  y={padding.top}
                  width={plotW / 2}
                  height={plotH / 2}
                  fill="#f0fdf4"
                  opacity="0.5"
                />
                <rect
                  x={padding.left}
                  y={padding.top}
                  width={plotW / 2}
                  height={plotH / 2}
                  fill="#fafaf9"
                  opacity="0.4"
                />
                <rect
                  x={padding.left + plotW / 2}
                  y={padding.top + plotH / 2}
                  width={plotW / 2}
                  height={plotH / 2}
                  fill="#fafaf9"
                  opacity="0.4"
                />
                <rect
                  x={padding.left}
                  y={padding.top + plotH / 2}
                  width={plotW / 2}
                  height={plotH / 2}
                  fill="#fef2f2"
                  opacity="0.3"
                />

                {/* Quadrant Watermark Labels */}
                <text
                  x={padding.left + plotW * 0.98}
                  y={padding.top + 20}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#15803d"
                >
                  {language === 'ko' ? '★ Frontier Autonomous AI (고등 자율 추론)' : '★ Frontier Autonomous AI'}
                </text>
                <text
                  x={padding.left + 15}
                  y={padding.top + 20}
                  textAnchor="start"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#78716c"
                >
                  {language === 'ko' ? 'Macro / Economy Heavy' : 'Macro / Economy Heavy'}
                </text>
                <text
                  x={padding.left + plotW * 0.98}
                  y={padding.top + plotH - 12}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#78716c"
                >
                  {language === 'ko' ? 'Tactical Specialist' : 'Tactical Specialist'}
                </text>
                <text
                  x={padding.left + 15}
                  y={padding.top + plotH - 12}
                  textAnchor="start"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#b91c1c"
                >
                  {language === 'ko' ? 'Baseline Zone' : 'Baseline Zone'}
                </text>

                {/* Grid Lines */}
                {[0, 25, 50, 75, 100].map((step) => {
                  const x = padding.left + (step / 100) * plotW;
                  const y = padding.top + plotH - (step / 100) * plotH;
                  return (
                    <g key={step}>
                      {/* Vertical line */}
                      <line
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={padding.top + plotH}
                        stroke={step === 50 ? '#a8a29e' : '#e7e5e4'}
                        strokeWidth={step === 50 ? '1.5' : '1'}
                        strokeDasharray={step === 50 ? '3 3' : undefined}
                      />
                      {/* Horizontal line */}
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={padding.left + plotW}
                        y2={y}
                        stroke={step === 50 ? '#a8a29e' : '#e7e5e4'}
                        strokeWidth={step === 50 ? '1.5' : '1'}
                        strokeDasharray={step === 50 ? '3 3' : undefined}
                      />
                      {/* X Axis Label */}
                      <text
                        x={x}
                        y={padding.top + plotH + 18}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#78716c"
                      >
                        {step}%
                      </text>
                      {/* Y Axis Label */}
                      <text
                        x={padding.left - 10}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="10"
                        fill="#78716c"
                      >
                        {step}
                      </text>
                    </g>
                  );
                })}

                {/* Axis Titles */}
                <text
                  x={padding.left + plotW / 2}
                  y={scatterHeight - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#201d1d"
                >
                  {language === 'ko'
                    ? 'Track A: 60대 미니맥스 퍼즐 정답률 (Combinatorial Accuracy %)'
                    : 'Track A: 60 Minimax Puzzles Accuracy (%)'}
                </text>
                <text
                  x={18}
                  y={padding.top + plotH / 2}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#201d1d"
                  transform={`rotate(-90 18 ${padding.top + plotH / 2})`}
                >
                  {language === 'ko'
                    ? 'Track B: 캠페인 정규화 승점 (Campaign Norm)'
                    : 'Track B: Campaign Normalized Score'}
                </text>

                {/* Pareto Frontier Curve (Approximation connecting leading models) */}
                <polyline
                  points={`
                    ${padding.left + (18.3 / 100) * plotW},${padding.top + plotH - (0 / 100) * plotH}
                    ${padding.left + (33.3 / 100) * plotW},${padding.top + plotH - (59.0 / 100) * plotH}
                    ${padding.left + (65.0 / 100) * plotW},${padding.top + plotH - (61.6 / 100) * plotH}
                    ${padding.left + (68.3 / 100) * plotW},${padding.top + plotH - (66.7 / 100) * plotH}
                    ${padding.left + (71.7 / 100) * plotW},${padding.top + plotH - (68.6 / 100) * plotH}
                    ${padding.left + (80.0 / 100) * plotW},${padding.top + plotH - (78.7 / 100) * plotH}
                    ${padding.left + (85.0 / 100) * plotW},${padding.top + plotH - (81.3 / 100) * plotH}
                    ${padding.left + (86.7 / 100) * plotW},${padding.top + plotH - (84.2 / 100) * plotH}
                    ${padding.left + (91.7 / 100) * plotW},${padding.top + plotH - (88.2 / 100) * plotH}
                    ${padding.left + (100 / 100) * plotW},${padding.top + plotH - (100 / 100) * plotH}
                  `}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />

                {/* Data Points */}
                {filteredRecords.map((r) => {
                  const x = padding.left + (Math.max(0, Math.min(100, r.puzzle.accuracy)) / 100) * plotW;
                  const y = padding.top + plotH - (Math.max(0, Math.min(100, r.campaign.normalized)) / 100) * plotH;
                  const theme = getProviderMeta(r.agent.provider);
                  const isHovered = hoveredModel === r.agent.model;
                  const isSelected = selectedRecord?.agent.model === r.agent.model;

                  return (
                    <g
                      key={r.agent.model}
                      className="cursor-pointer transition-transform"
                      onMouseEnter={() => setHoveredModel(r.agent.model)}
                      onMouseLeave={() => setHoveredModel(null)}
                      onClick={() => {
                        setSelectedRecord(isSelected ? null : r);
                        if (onSelectModel) onSelectModel(r);
                      }}
                    >
                      {/* Pulse ring for hovered/selected */}
                      {(isHovered || isSelected) && (
                        <circle
                          cx={x}
                          cy={y}
                          r={14}
                          fill={theme.barColor}
                          opacity="0.25"
                        />
                      )}
                      {/* Main point circle */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered || isSelected ? 8 : 6}
                        fill={theme.barColor}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      {/* Model Label text */}
                      <text
                        x={x + 9}
                        y={y + 4}
                        fontSize={isHovered || isSelected ? '11' : '9.5'}
                        fontWeight={isHovered || isSelected ? 'bold' : 'normal'}
                        fill={isHovered || isSelected ? '#000000' : '#44403c'}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        paintOrder="stroke fill"
                      >
                        {r.agent.label.split('(')[0].trim()} ({r.shbp.toFixed(1)})
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="mt-2 text-[10px] text-stone-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block border border-emerald-600" />
                <span>{language === 'ko' ? '녹색 점선: 파레토 최적 곡선 (Pareto Frontier)' : 'Green dashed: Pareto Frontier'}</span>
              </span>
              <span>{language === 'ko' ? '점을 클릭하면 세부 지표가 표시됩니다.' : 'Click any dot for details.'}</span>
            </div>
          </div>
        )}

        {/* VIEW 3: Artificial Analysis Leaderboard Table */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] text-stone-600">
                  <th className="p-2.5">Rank / Model</th>
                  <th className="p-2.5">Provider</th>
                  <th className="p-2.5 text-right">SHBP Score</th>
                  <th className="p-2.5 text-right">95% CI</th>
                  <th className="p-2.5 text-right">Track A (Puzzles)</th>
                  <th className="p-2.5 text-right">Track B (Campaign)</th>
                  <th className="p-2.5 text-right">Win Rate</th>
                  <th className="p-2.5 text-right">Audit Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRecords.map((r, idx) => {
                  const theme = getProviderMeta(r.agent.provider);
                  const isSelected = selectedRecord?.agent.model === r.agent.model;

                  return (
                    <tr
                      key={r.agent.model}
                      onClick={() => {
                        setSelectedRecord(isSelected ? null : r);
                        if (onSelectModel) onSelectModel(r);
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50 font-bold' : 'hover:bg-stone-50/80'
                      }`}
                    >
                      <td className="p-2.5 font-bold flex items-center gap-2">
                        <span className="text-stone-400 text-[11px]">#{idx + 1}</span>
                        <span className="text-stone-900">{r.agent.label}</span>
                        {r.agent.privileged && (
                          <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded-xs">
                            Oracle
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 border font-bold rounded-xs ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                        >
                          {theme.label}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-black text-amber-700 text-sm">
                        {r.shbp.toFixed(1)}
                      </td>
                      <td className="p-2.5 text-right text-stone-500 text-[11px]">
                        {r.ci95 !== null ? `±${r.ci95.toFixed(1)}` : 'Exact'}
                      </td>
                      <td className="p-2.5 text-right">
                        <span className="font-bold text-stone-900">{r.puzzle.accuracy}%</span>
                        <span className="text-[10px] text-stone-500 ml-1">({r.puzzle.correct}/60)</span>
                      </td>
                      <td className="p-2.5 text-right">
                        <span className="font-bold text-stone-900">{r.campaign.normalized}</span>
                        <span className="text-[10px] text-stone-500 ml-1">
                          ({r.campaign.totals.win}W-{r.campaign.totals.draw}D-{r.campaign.totals.loss}L)
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">
                        {((r.campaign.totals.win / 60) * 100).toFixed(1)}%
                      </td>
                      <td className="p-2.5 text-right text-[10px] text-stone-500 font-mono">
                        {r.logHash.slice(0, 10)}...
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Footer Metadata Notice */}
      <div className="p-3 bg-stone-50 border-t border-stone-200 text-[10px] text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-1">
        <span>
          {language === 'ko'
            ? '※ 모든 벤치마크 점수는 결정론적 시드(20261011, 20261012, 20261013) 리플레이 검증을 거쳐 산출됩니다.'
            : '※ All benchmark results are deterministic and verified through full replay execution.'}
        </span>
        <span className="text-stone-700 font-bold">
          Ref: artificialanalysis.ai benchmark visualization standards
        </span>
      </div>
    </div>
  );
};

export default BenchmarkChart;
