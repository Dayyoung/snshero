import React, { useState } from 'react';
import {
  Shield,
  Trophy,
  Cpu,
  Copy,
  Check,
  Play,
  RefreshCw,
  Award,
  Terminal,
  FileCheck2,
  Upload,
  Download,
  AlertTriangle,
  ArrowLeft,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../types';
import {
  runOfficialBenchmark,
  OFFICIAL_LEADERBOARD,
  OFFICIAL_PUZZLE_SET,
  OFFICIAL_ANCHORS,
  BenchResult,
  BenchLog,
} from '../lib/benchmarkEngine';
import { BenchmarkChart } from '../components/bench/BenchmarkChart';
import { verifyLog, validateLogShape } from '../lib/bench/runner';
import { SHBP_RULES_PROMPT } from '../lib/bench/prompt';
import { triggerHaptic } from '../lib/haptic';

interface BenchmarkViewProps {
  language: Language;
  onNavigate: (view: any) => void;
  playSfx?: (url: string) => void;
}

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({
  language,
  onNavigate,
  playSfx,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<'greedy' | 'random' | 'expert'>('greedy');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [benchmarkResult, setBenchmarkResult] = useState<BenchResult | null>(null);
  const [benchmarkLog, setBenchmarkLog] = useState<BenchLog | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  // Verifier tab state
  const [verifierInput, setVerifierInput] = useState<string>('');
  const [verifiedFromInput, setVerifiedFromInput] = useState<BenchResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleCopyPrompt = () => {
    try {
      navigator.clipboard.writeText(SHBP_RULES_PROMPT);
      setCopiedPrompt(true);
      triggerHaptic('light');
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {}
  };

  const handleCopySnippet = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedSnippet(true);
      triggerHaptic('light');
      setTimeout(() => setCopiedSnippet(false), 2500);
    } catch {}
  };

  const handleCopyResult = () => {
    if (!benchmarkResult) return;
    try {
      const summary = `[SNSHero Bench Point (SHBP-3) Official Certificate]
• Agent: ${benchmarkResult.agent.label} (${benchmarkResult.agent.provider}/${benchmarkResult.agent.model})
• SHBP Score: ${benchmarkResult.shbp} ${benchmarkResult.ci95 !== null ? `± ${benchmarkResult.ci95}` : ''}
• Track A (60 Minimax Puzzles): Accuracy ${benchmarkResult.puzzle.accuracy}% (${benchmarkResult.puzzle.correct}/60) | Norm ${benchmarkResult.puzzle.normalized}
• Track B (Campaign Season): Norm ${benchmarkResult.campaign.normalized} | Record ${benchmarkResult.campaign.totals.win}W ${benchmarkResult.campaign.totals.draw}D ${benchmarkResult.campaign.totals.loss}L
• Log Fingerprint: ${benchmarkResult.logHash}
• Replay Verifier: https://snshero.com/bench`;
      navigator.clipboard.writeText(summary);
      setCopiedResult(true);
      triggerHaptic('light');
      setTimeout(() => setCopiedResult(false), 2500);
    } catch {}
  };

  const handleDownloadLog = () => {
    if (!benchmarkLog || !benchmarkResult) return;
    const blob = new Blob([JSON.stringify({ log: benchmarkLog, verified: benchmarkResult }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shbp3-${benchmarkResult.agent.model}-${benchmarkResult.logHash.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartBenchmark = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress(0);
    setProgressLabel(language === 'ko' ? '초기화 중...' : 'Initializing...');
    setBenchmarkResult(null);
    setBenchmarkLog(null);
    triggerHaptic('heavy');
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    try {
      const { result, log } = await runOfficialBenchmark(
        selectedAgent,
        undefined,
        undefined,
        (pct, label) => {
          setProgress(pct);
          setProgressLabel(label);
        }
      );
      setBenchmarkResult(result);
      setBenchmarkLog(log);
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      triggerHaptic('heavy');
    } catch (e: any) {
      console.error('Benchmark error:', e);
      alert(e?.message || 'Benchmark run failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleVerifyInput = () => {
    setVerifyError(null);
    setVerifiedFromInput(null);
    try {
      const parsed = JSON.parse(verifierInput);
      const rawLog = parsed.log || parsed;
      if (!validateLogShape(rawLog)) {
        throw new Error(
          language === 'ko'
            ? '유효한 SHBP-3 로그 포맷이 아닙니다. version, puzzleSet, agent, puzzleAnswers, campaigns 필드가 필수입니다.'
            : 'Invalid SHBP-3 log format. Missing required fields.'
        );
      }
      const verified = verifyLog(rawLog, OFFICIAL_PUZZLE_SET, OFFICIAL_ANCHORS);
      setVerifiedFromInput(verified);
      triggerHaptic('light');
    } catch (e: any) {
      setVerifyError(e?.message || 'Verification failed');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = String(evt.target?.result || '');
      setVerifierInput(text);
    };
    reader.readAsText(file);
  };

  const cliCode = `# 1. Anthropic Claude (Claude 3.7 Sonnet / Opus 등)
export ANTHROPIC_API_KEY="sk-ant-..."
npx tsx scripts/bench/harness.ts --agent anthropic --model claude-3-7-sonnet-20250219

# 2. OpenAI GPT (GPT-4o 등)
export OPENAI_API_KEY="sk-..."
npx tsx scripts/bench/harness.ts --agent openai --model gpt-4o

# 3. Google Gemini (Gemini 2.5 Pro / Flash 등)
export GEMINI_API_KEY="..."
npx tsx scripts/bench/harness.ts --agent gemini --model gemini-2.5-pro`;

  return (
    <div className="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono selection:bg-stone-900 selection:text-amber-300">
      {/* 1. Dedicated Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#fdfcfc]/95 backdrop-blur-md border-b border-[#201d1d]/15 px-3 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={() => onNavigate('home')}
            className="min-h-[40px] px-3 py-1.5 border border-[#201d1d] hover:bg-[#201d1d] hover:text-[#fdfcfc] active:scale-95 rounded-sm transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <ArrowLeft size={16} />
            <span>{language === 'ko' ? '홈으로' : 'Home'}</span>
          </button>

          <div className="text-center truncate px-2">
            <span className="text-xs sm:text-sm font-black tracking-tight text-[#201d1d] uppercase block truncate">
              SNSHero Bench Point (SHBP-3)
            </span>
            <span className="text-[10px] text-stone-500 hidden sm:inline-block">
              Official 2-Track Autonomous AI Benchmark
            </span>
          </div>

          <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-1 rounded-sm font-bold flex items-center gap-1 shrink-0">
            <Shield size={12} className="text-emerald-700" />
            <span className="hidden xs:inline">SHBP-3</span>
            <span>공인 검증</span>
          </span>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto p-3 sm:p-6 pb-24">
        {/* Title & Subtitle Banner */}
        <div className="border-b border-[#201d1d]/15 pb-4 mb-6">
          <h1 className="text-lg sm:text-2xl font-black tracking-tight text-[#201d1d] mb-1">
            {language === 'ko'
              ? 'SHBP-3 공인 인공지능 벤치마크'
              : 'SHBP-3 Official AI Benchmark'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {language === 'ko'
              ? '조작 불가능한 행동 로그 리플레이 검증 기반 2-트랙 AI 종합 평가 환경 (퍼즐 미니맥스 정답률 + 비공개 시즌 경제·덱빌딩)'
              : 'Tamper-proof log-replay verified 2-track AI benchmark (Combinatorial Minimax Ground Truth + Hidden-Hand Campaign)'}
          </p>
        </div>

        {/* 2. Architecture Explainer */}
        <section className="bg-stone-900 text-stone-100 p-4 sm:p-5 rounded-none border border-black mb-6">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-3">
            <Award size={16} />
            <span>
              {language === 'ko'
                ? 'SHBP-3 변별력 원칙 (Why SHBP Discriminates Real AI Capabilities)'
                : 'SHBP-3 Discrimination Architecture'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-[11px] text-stone-300 leading-relaxed mb-3">
            <div className="border border-stone-700 p-3 bg-stone-950/70 rounded-none">
              <div className="text-amber-400 font-bold mb-1 flex items-center justify-between">
                <span>[Track A] 60대 미니맥스 조합 퍼즐</span>
                <span className="text-[9px] bg-stone-800 px-1.5 py-0.5 rounded-xs text-stone-300 font-mono">운 개입 0%</span>
              </div>
              <p className="text-stone-400">
                {language === 'ko'
                  ? '경우의 수를 전수 탐색(Negamax Alpha-Beta)하여 모든 수의 게임이론적 승패값을 사전에 수학적으로 계산했습니다. 우연 일치 확률을 보정하여 찍기 점수를 0점으로 제거하고, 최선의 수와의 격차(Regret)를 엄밀히 채점합니다.'
                  : 'Pre-solved by exhaustive Negamax alpha-beta search. Chance-corrected accuracy eliminates lucky guesses; penalizes sub-optimal regrets.'}
              </p>
            </div>

            <div className="border border-stone-700 p-3 bg-stone-950/70 rounded-none">
              <div className="text-amber-400 font-bold mb-1 flex items-center justify-between">
                <span>[Track B] 비공개 패 캠페인 시즌</span>
                <span className="text-[9px] bg-stone-800 px-1.5 py-0.5 rounded-xs text-stone-300 font-mono">경제 & 덱 빌딩</span>
              </div>
              <p className="text-stone-400">
                {language === 'ko'
                  ? '상대 패가 가려진 불완전 정보 상태에서 20경기 시즌을 치릅니다. 경기 보상으로 팩(브론즈/실버/골드)을 전략적으로 구매하거나 SNS를 저축하며 덱을 강화하는 중장기 의사결정 능력을 평가합니다.'
                  : 'Incomplete information season: opponent hand hidden. Evaluates long-term pack purchasing (silver vs gold vs saving SNS) and deck-building.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-stone-400 gap-1.5">
            <span>
              {language === 'ko'
                ? '정규화 공식: SHBP = 0.5 × 퍼즐 정규점수 + 0.5 × 캠페인 정규점수 (Random = 0.0, Rule AI = 38.6, Expert = 100.0)'
                : 'Normalization: SHBP = 0.5 × PuzzleNorm + 0.5 × CampaignNorm (Random = 0.0, Rule AI = 38.6, Expert = 100.0)'}
            </span>
            <span className="text-emerald-400 font-mono font-bold">100% Deterministic & Replay-Audited</span>
          </div>
        </section>

        {/* 3. Official Audited Leaderboard & Interactive Chart (ArtificialAnalysis Style) */}
        <BenchmarkChart
          records={OFFICIAL_LEADERBOARD}
          language={language}
          onSelectModel={(model) => {
            triggerHaptic('light');
          }}
        />

        {/* 4. In-Browser Runner */}
        <section className="border border-stone-300 bg-white p-4 sm:p-5 rounded-none mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-900">
              <Cpu size={18} className="text-indigo-600" />
              <span>{language === 'ko' ? '인브라우저 결정론 벤치마크 실행기' : 'In-Browser Deterministic Runner'}</span>
            </div>
            <span className="text-[10px] text-stone-500 font-mono">
              60 Puzzles + 60 Campaign Matches
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs font-bold text-stone-700 whitespace-nowrap">
                {language === 'ko' ? '기준 모델 선택:' : 'Baseline Agent:'}
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value as any)}
                disabled={isRunning}
                className="w-full sm:flex-1 p-2.5 min-h-[44px] border border-stone-300 bg-white text-xs font-mono rounded-sm focus:outline-none cursor-pointer"
              >
                <option value="greedy">Rule AI (greedy) - 게임 내 탑재된 탐욕 규칙 알고리즘</option>
                <option value="random">Random Agent (anchor 0) - 무작위 균등 선택</option>
                <option value="expert">Expert Oracle (anchor 100) - 전수탐색 특권 에이전트</option>
              </select>
            </div>

            <button
              onClick={handleStartBenchmark}
              disabled={isRunning}
              className={`min-h-[44px] px-6 py-2.5 text-xs font-bold uppercase rounded-sm flex items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation ${
                isRunning
                  ? 'bg-stone-300 text-stone-600 cursor-not-allowed'
                  : 'bg-stone-900 text-amber-300 hover:bg-stone-800 active:scale-95'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{language === 'ko' ? `실행 중 (${progress}%)` : `Running (${progress}%)`}</span>
                </>
              ) : (
                <>
                  <Play size={14} className="fill-amber-300" />
                  <span>{language === 'ko' ? '벤치마크 실행' : 'Run Benchmark'}</span>
                </>
              )}
            </button>
          </div>

          {isRunning && (
            <div className="mb-4">
              <div className="w-full bg-stone-200 h-2 rounded-sm overflow-hidden mb-1.5">
                <div
                  className="bg-amber-500 h-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-stone-600 font-mono">
                <span className="truncate pr-2">{progressLabel || 'Processing...'}</span>
                <span className="shrink-0">{progress}%</span>
              </div>
            </div>
          )}

          {/* Result Certificate Card */}
          {benchmarkResult && (
            <div className="border-2 border-amber-500 bg-amber-50/40 p-4 rounded-sm mt-4 font-mono">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200 pb-3 mb-3">
                <div>
                  <span className="text-[10px] bg-amber-500 text-stone-900 font-black px-2 py-0.5 rounded-xs uppercase">
                    SHBP-3 Official Certificate
                  </span>
                  <h3 className="text-base font-black text-stone-900 mt-1">
                    {benchmarkResult.agent.label} — {benchmarkResult.shbp.toFixed(1)} SHBP
                    {benchmarkResult.ci95 !== null ? ` (±${benchmarkResult.ci95.toFixed(1)})` : ''}
                  </h3>
                  <p className="text-[10px] text-stone-600 font-mono truncate max-w-md">
                    Log Fingerprint: {benchmarkResult.logHash}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadLog}
                    className="flex-1 sm:flex-none min-h-[40px] text-xs px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 rounded-sm flex items-center justify-center gap-1.5 cursor-pointer font-bold touch-manipulation"
                  >
                    <Download size={14} />
                    <span>{language === 'ko' ? '로그 다운로드' : 'Download Log'}</span>
                  </button>
                  <button
                    onClick={handleCopyResult}
                    className="flex-1 sm:flex-none min-h-[40px] text-xs px-3 py-1.5 bg-stone-900 text-amber-300 hover:bg-stone-800 rounded-sm flex items-center justify-center gap-1.5 cursor-pointer font-bold touch-manipulation"
                  >
                    {copiedResult ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedResult ? (language === 'ko' ? '복사됨!' : 'Copied!') : (language === 'ko' ? '성적표 복사' : 'Copy')}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-white p-2.5 border border-stone-200">
                  <span className="text-[10px] text-stone-500 block">퍼즐 정답률 (Track A)</span>
                  <span className="font-black text-sm text-indigo-700">
                    {benchmarkResult.puzzle.accuracy}% ({benchmarkResult.puzzle.correct}/60)
                  </span>
                  <span className="text-[9px] text-stone-500 block mt-0.5 truncate">
                    E:{benchmarkResult.puzzle.byDifficulty.easy.correct}/20 M:{benchmarkResult.puzzle.byDifficulty.medium.correct}/20 H:{benchmarkResult.puzzle.byDifficulty.hard.correct}/20
                  </span>
                </div>

                <div className="bg-white p-2.5 border border-stone-200">
                  <span className="text-[10px] text-stone-500 block">퍼즐 정규화 점수</span>
                  <span className="font-black text-sm text-stone-900">
                    {benchmarkResult.puzzle.normalized.toFixed(1)} 점
                  </span>
                  <span className="text-[9px] text-stone-500 block mt-0.5">
                    평균 실책(Regret): {benchmarkResult.puzzle.regretAvg}
                  </span>
                </div>

                <div className="bg-white p-2.5 border border-stone-200">
                  <span className="text-[10px] text-stone-500 block">시즌 전적 (Track B)</span>
                  <span className="font-black text-sm text-emerald-700">
                    {benchmarkResult.campaign.totals.win}승 {benchmarkResult.campaign.totals.draw}무 {benchmarkResult.campaign.totals.loss}패
                  </span>
                  <span className="text-[9px] text-stone-500 block mt-0.5">
                    총 60경기 3시즌 합산
                  </span>
                </div>

                <div className="bg-white p-2.5 border border-stone-200">
                  <span className="text-[10px] text-stone-500 block">시즌 정규화 점수</span>
                  <span className="font-black text-sm text-amber-700">
                    {benchmarkResult.campaign.normalized.toFixed(1)} 점
                  </span>
                  <span className="text-[9px] text-stone-500 block mt-0.5">
                    위반 수: {benchmarkResult.campaign.invalid}회
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 5. Independent Action-Log Replay Verifier */}
        <section className="border border-stone-300 bg-white p-4 sm:p-5 rounded-none mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-900">
              <FileCheck2 size={18} className="text-emerald-600" />
              <span>
                {language === 'ko'
                  ? '독립 리플레이 검증기 (Action-Log Replay Verifier)'
                  : 'Action-Log Replay Verifier'}
              </span>
            </div>
            <span className="text-[10px] text-stone-500 font-mono">
              Zero-Tampering Architecture
            </span>
          </div>

          <p className="text-[11px] text-stone-600 mb-3 leading-relaxed">
            {language === 'ko'
              ? '점수는 모델이 보고한 텍스트를 믿지 않습니다. 오직 모델이 출력한 행동 로그(Action Log JSON)를 브라우저에서 동일한 시드로 100% 다시 재생하여 점수를 재계산합니다. 규칙 위반이나 조작이 있으면 즉시 감점되거나 검증에 실패합니다.'
              : 'Scores are never self-reported. Submit your recorded Action Log JSON; the browser re-executes every move under exact seeds and verifies every metric independently.'}
          </p>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="min-h-[40px] text-xs font-bold px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-sm cursor-pointer flex items-center gap-1.5 touch-manipulation">
                <Upload size={14} />
                <span>{language === 'ko' ? '로그 파일 업로드 (.json)' : 'Upload Log File (.json)'}</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
              <span className="text-[10px] text-stone-500">{language === 'ko' ? '또는 아래 텍스트 창에 직접 붙여넣기' : 'or paste JSON below'}</span>
            </div>

            <textarea
              value={verifierInput}
              onChange={(e) => setVerifierInput(e.target.value)}
              placeholder={
                language === 'ko'
                  ? '벤치마크 결과 JSON 또는 {"log": {...}} 형식의 텍스트를 붙여넣으세요.'
                  : 'Paste benchmark JSON log text here...'
              }
              rows={5}
              className="w-full p-2.5 text-xs font-mono border border-stone-300 rounded-sm focus:outline-none bg-stone-50"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleVerifyInput}
                disabled={!verifierInput.trim()}
                className="min-h-[40px] px-5 py-2 bg-stone-900 text-emerald-300 hover:bg-stone-800 disabled:bg-stone-300 disabled:text-stone-500 text-xs font-bold rounded-sm cursor-pointer flex items-center gap-1.5 touch-manipulation"
              >
                <Check size={14} />
                <span>{language === 'ko' ? '리플레이 검증 실행' : 'Verify Replay'}</span>
              </button>

              {verifyError && (
                <span className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                  <AlertTriangle size={14} />
                  <span>{verifyError}</span>
                </span>
              )}
            </div>

            {verifiedFromInput && (
              <div className="bg-emerald-50 border border-emerald-300 p-3 sm:p-4 rounded-sm mt-3 font-mono text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 mb-2">
                  <CheckCircle2 size={16} className="text-emerald-700" />
                  <span>
                    {language === 'ko' ? '검증 완료: 위변조 없음 (Verified Valid)' : 'Verification Succeeded'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-stone-500 block">Agent</span>
                    <span className="font-bold text-stone-900 truncate block">{verifiedFromInput.agent.label}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">SHBP Score</span>
                    <span className="font-black text-amber-700">
                      {verifiedFromInput.shbp.toFixed(1)} {verifiedFromInput.ci95 !== null ? `± ${verifiedFromInput.ci95.toFixed(1)}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Puzzles</span>
                    <span className="font-bold text-stone-900">{verifiedFromInput.puzzle.accuracy}% ({verifiedFromInput.puzzle.correct}/60)</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Fingerprint</span>
                    <span className="font-mono text-[10px] text-stone-600 truncate block">{verifiedFromInput.logHash}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 6. Official CLI Harness & Prompt Guide */}
        <section className="border border-stone-300 bg-stone-50 p-4 sm:p-5 rounded-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-stone-200 pb-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-900">
              <Terminal size={18} className="text-emerald-600" />
              <span>
                {language === 'ko'
                  ? '공식 CLI 하니스 & 프롬프트 연동 가이드'
                  : 'Official CLI Harness & Prompt Integration'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopySnippet(cliCode)}
                className="min-h-[36px] text-xs px-3 py-1 bg-white border border-stone-300 hover:bg-stone-100 rounded-sm flex items-center gap-1.5 cursor-pointer font-bold touch-manipulation"
              >
                {copiedSnippet ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedSnippet ? '복사됨!' : 'CLI 복사'}</span>
              </button>
              <button
                onClick={handleCopyPrompt}
                className="min-h-[36px] text-xs px-3 py-1 bg-stone-900 text-amber-300 hover:bg-stone-800 rounded-sm flex items-center gap-1.5 cursor-pointer font-bold touch-manipulation"
              >
                {copiedPrompt ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedPrompt ? '복사됨!' : '프롬프트 복사'}</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-stone-600 mb-2 leading-relaxed">
            {language === 'ko'
              ? '터미널에서 아래 명령어로 Claude, GPT, Gemini API를 직접 실행하여 공인 행동 로그를 생성할 수 있습니다:'
              : 'Run real models through the benchmark CLI to produce verified logs:'}
          </p>

          <pre className="bg-stone-900 text-amber-200 p-3 sm:p-4 rounded-sm text-[11px] font-mono whitespace-pre overflow-x-auto border border-black/20 mb-3">
            {cliCode}
          </pre>

          <div className="text-[10px] text-stone-500">
            {language === 'ko'
              ? '실행 결과는 benchmark_results/ 에 타임스탬프와 함께 .benchlog.json 으로 자동 저장되며, 상단의 [독립 리플레이 검증기]에 즉시 업로드하여 공인 인증을 받을 수 있습니다.'
              : 'Execution logs are automatically saved under benchmark_results/*.benchlog.json and can be verified anytime above.'}
          </div>
        </section>
      </main>
    </div>
  );
};

export default BenchmarkView;
