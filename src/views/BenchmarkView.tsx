import React, { useState, useEffect } from 'react';
import { Shield, Trophy, Cpu, Zap, Copy, Check, Play, RefreshCw, Award, ExternalLink, Terminal, BarChart2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Language } from '../types';
import { 
  runOfficialBenchmark, 
  OFFICIAL_LEADERBOARD_ENTRIES, 
  BenchmarkResult 
} from '../lib/benchmarkEngine';
import { triggerHaptic } from '../lib/haptic';

interface BenchmarkViewProps {
  language: Language;
  onNavigate: (view: any) => void;
  playSfx?: (url: string) => void;
}

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({
  language,
  onNavigate,
  playSfx
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('Claude 3.7 Sonnet');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [liveStats, setLiveStats] = useState<any>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);

  // Standard benchmark prompt for requesting AI models
  const officialBenchmarkPrompt = `[SNSHero Bench Point (SHBP) 1-Hour AI Benchmark Request]
Target Service: https://snshero.com/bench
Specification: https://snshero.com/llms.txt

당신은 SNS히어로(SNSHero)의 공식 1시간 자율 플레이 벤치마크 참가자입니다.
아래의 엄격한 공정 플레이 규정에 따라 1시간 동안의 자율 게임 플레이(256경기)를 수행하고,
당신의 최종 'SNSHero Bench Point(SHBP)' 점수와 세부 전적을 측정하여 보고해 주세요.

[규칙 및 제약사항]
1. 공평한 초기 조건: 1,000 SNS 포인트 & 기본 5장 스타터 덱(Normal 등급)에서 시작.
2. 치팅 및 코드 조작 절대 금지 (Zero-Tampering Policy).
3. 표준 경기 수: 256경기 (DDA AI 상대 랭킹대전).
4. 스마트 루프 적용: 승리 후 SNS >= 100 달성 시 상점 소환 -> 더 강한 카드 획득 시 최약체 덱 슬롯 교체.
5. 보고 양식:
   - 모델명:
   - 최종 SNSHero Bench Point (SHBP): ____ 점
   - 랭킹전 최종 전적 (승/패/무 및 승률):
   - 주력 5인 덱 최종 전투력 (Active CP):
   - 총 수집 카드 종류 (___ / 110종):
   - 검증 체크섬:

https://snshero.com/bench 에서 [Start Benchmark]를 직접 실행하거나 위 룰대로 측정하여 점수를 알려주세요.`;

  const handleCopyPrompt = () => {
    try {
      navigator.clipboard.writeText(officialBenchmarkPrompt);
      setCopiedPrompt(true);
      triggerHaptic('light');
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {}
  };

  const handleCopyResult = () => {
    if (!benchmarkResult) return;
    try {
      const summary = `[SNSHero Bench Point 공식 성적표]
• 모델명: ${benchmarkResult.modelName}
• 최종 SHBP 스코어: ${benchmarkResult.shbpScore.toLocaleString()} 점
• 전적: ${benchmarkResult.wins}승 ${benchmarkResult.losses}패 ${benchmarkResult.draws}무 (승률 ${benchmarkResult.winRate}%)
• 주력 덱 파워: ${benchmarkResult.finalActiveDeckPower} CP
• 카드 수집: ${benchmarkResult.uniqueCardsCollected} / 110종 (${benchmarkResult.codexRate}%)
• 검증 해시: ${benchmarkResult.verificationHash}
• 검증 일시: ${benchmarkResult.executedAt}`;
      navigator.clipboard.writeText(summary);
      setCopiedResult(true);
      triggerHaptic('light');
      setTimeout(() => setCopiedResult(false), 2500);
    } catch {}
  };

  const handleStartBenchmark = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress(0);
    setLiveStats(null);
    setBenchmarkResult(null);
    triggerHaptic('heavy');
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    try {
      const seed = Math.floor(Date.now() / 1000);
      const result = await runOfficialBenchmark(
        selectedModel,
        seed,
        (pct, interim) => {
          setProgress(pct);
          setLiveStats(interim);
        }
      );
      setBenchmarkResult(result);
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      triggerHaptic('heavy');
    } catch (e) {
      console.error('Benchmark execution error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono p-3 sm:p-6 max-w-4xl mx-auto pb-32">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/10 pb-4 mb-6">
        <div>
          <PageHeader title={language === 'ko' ? 'SNSHero Bench Point (SHBP) AI 벤치마크' : 'SNSHero Bench Point (SHBP) AI Benchmark'} />
          <p className="text-xs text-stone-600 mt-1">
            {language === 'ko' 
              ? 'Claude, GPT, Gemini 등 첨단 AI 모델의 1시간 자율 플레이 역량을 측정하는 표준화된 공인 평가 환경' 
              : 'Standardized 1-hour autonomous gameplay benchmark evaluating Claude, GPT, and Gemini models'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-sm font-bold flex items-center gap-1">
            <Shield size={12} />
            <span>Anti-Cheat V2.1</span>
          </span>
          <button
            onClick={() => onNavigate('home')}
            className="text-xs px-3 py-1.5 border border-stone-300 hover:bg-stone-100 rounded-sm cursor-pointer"
          >
            {language === 'ko' ? '← 홈으로' : '← Home'}
          </button>
        </div>
      </div>

      {/* 2. Official Covenant & Zero-Tampering Rule */}
      <div className="bg-stone-900 text-stone-100 p-4 rounded-none border border-black mb-6">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-2">
          <Award size={16} />
          <span>{language === 'ko' ? '공정 플레이 & 치팅 금지 헌장 (Zero-Tampering Covenant)' : 'Official Fair Play & Anti-Tampering Covenant'}</span>
        </div>
        <ul className="text-[11px] text-stone-300 space-y-1.5 list-disc list-inside leading-relaxed">
          <li><strong>{language === 'ko' ? '동일 초기 조건' : 'Identical Starter State'}</strong>: 1,000 SNS 기본 제공 + 5장 브론즈 스타터 덱 (48 CP)에서 시작.</li>
          <li><strong>{language === 'ko' ? '1시간 표준 경기 수' : '1-Hour Standard Load'}</strong>: 256경기 (14초/경기 기준, 순수 대전 + 상점 소환 + 덱 교체).</li>
          <li><strong>{language === 'ko' ? '소스코드 조작 금지' : 'Anti-Tampering Rule'}</strong>: 재화 직접 수정이나 확률 임의 조작 시 검증 체크섬 불일치 처리.</li>
          <li><strong>{language === 'ko' ? '공식 지표' : 'Official Metric'}</strong>: 누적 획득한 SNS 총량을 <strong>SNSHero Bench Point (SHBP)</strong>로 공인 인증.</li>
        </ul>
      </div>

      {/* 3. Official AI Model Leaderboard */}
      <div className="border border-stone-300 bg-white p-4 rounded-none mb-6">
        <div className="flex items-center justify-between mb-3 border-b border-stone-200 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
            <Trophy size={16} className="text-amber-500" />
            <span>{language === 'ko' ? '공식 AI 모델 리더보드 (Official Verified Leaderboard)' : 'Official AI Verified Leaderboard'}</span>
          </div>
          <span className="text-[10px] text-stone-500">Seed: Deterministic 20261011</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] text-stone-600">
                <th className="p-2">Rank / Model</th>
                <th className="p-2 text-right">SHBP Score</th>
                <th className="p-2 text-right">Win Rate</th>
                <th className="p-2 text-right">Active CP</th>
                <th className="p-2 text-right">Codex</th>
                <th className="p-2 text-right">Verification Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {OFFICIAL_LEADERBOARD_ENTRIES.map((entry, idx) => (
                <tr key={idx} className="hover:bg-stone-50/80">
                  <td className="p-2 font-bold flex items-center gap-2">
                    <span className="text-stone-400 text-[10px]">#{idx + 1}</span>
                    <span>{entry.model}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded-sm text-stone-700">{entry.badge}</span>
                  </td>
                  <td className="p-2 text-right font-black text-amber-600 font-mono">
                    {entry.shbpScore.toLocaleString()} SHBP
                  </td>
                  <td className="p-2 text-right font-mono">{entry.winRate}%</td>
                  <td className="p-2 text-right font-mono font-bold">{entry.deckPower} CP</td>
                  <td className="p-2 text-right font-mono">{entry.codexRate}%</td>
                  <td className="p-2 text-right font-mono text-[10px] text-stone-500">{entry.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Live Benchmark Runner */}
      <div className="border border-stone-300 bg-white p-4 rounded-none mb-6">
        <div className="flex items-center justify-between mb-3 border-b border-stone-200 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
            <Cpu size={16} className="text-indigo-600" />
            <span>{language === 'ko' ? '실시간 1시간 공인 벤치마크 테스트기' : '1-Hour Benchmark Test Runner'}</span>
          </div>
          <span className="text-[10px] text-stone-500">{language === 'ko' ? '256경기 정밀 검증' : '256 Matches Execution'}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2">
            <label className="text-xs font-bold text-stone-700 whitespace-nowrap">{language === 'ko' ? '테스트 대상 모델:' : 'Target Model:'}</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isRunning}
              className="flex-1 p-2 border border-stone-300 bg-white text-xs font-mono rounded-sm focus:outline-none"
            >
              <option value="Claude 3.7 Sonnet">Claude 3.7 Sonnet (Anthropic)</option>
              <option value="GPT-4o">GPT-4o (OpenAI)</option>
              <option value="Gemini 2.5 Pro">Gemini 2.5 Pro (Google DeepMind)</option>
              <option value="Antigravity AI">Antigravity AI (Autonomous)</option>
              <option value="Custom Agent">Custom AI Agent / Local Model</option>
            </select>
          </div>

          <button
            onClick={handleStartBenchmark}
            disabled={isRunning}
            className={`px-5 py-2.5 text-xs font-bold uppercase rounded-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isRunning 
                ? 'bg-stone-300 text-stone-600 cursor-not-allowed' 
                : 'bg-stone-900 text-amber-300 hover:bg-stone-800 active:scale-95'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>{language === 'ko' ? `테스트 진행 중 (${progress}%)` : `Running (${progress}%)`}</span>
              </>
            ) : (
              <>
                <Play size={14} className="fill-amber-300" />
                <span>{language === 'ko' ? '1시간 벤치마크 실행' : 'Start Benchmark'}</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="mb-4">
            <div className="w-full bg-stone-200 h-2 rounded-sm overflow-hidden mb-1.5">
              <div 
                className="bg-amber-500 h-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-stone-600 font-mono">
              <span>Progress: {progress}% (Simulating 1-Hour Match Load)</span>
              <span>Live SHBP: {liveStats?.shbpScore ? `${liveStats.shbpScore.toLocaleString()} SHBP` : 'Calculating...'}</span>
            </div>
          </div>
        )}

        {/* Live Metrics Display */}
        {liveStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 bg-stone-50 border border-stone-200 p-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-stone-500 block">Record</span>
              <span className="font-bold">{liveStats.wins}W {liveStats.losses}L {liveStats.draws}D</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block">Win Rate</span>
              <span className="font-bold text-emerald-600">{liveStats.winRate}%</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block">Active Deck</span>
              <span className="font-bold text-indigo-600">{liveStats.finalActiveDeckPower} CP</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block">Cards Codex</span>
              <span className="font-bold text-amber-600">{liveStats.uniqueCardsCollected}/110</span>
            </div>
          </div>
        )}

        {/* 5. Benchmark Result Certificate Card */}
        {benchmarkResult && (
          <div className="border-2 border-amber-500 bg-amber-50/40 p-4 rounded-sm mt-4">
            <div className="flex items-start justify-between gap-3 border-b border-amber-200 pb-3 mb-3">
              <div>
                <span className="text-[10px] bg-amber-500 text-stone-900 font-black px-2 py-0.5 rounded-xs uppercase">
                  Official SHBP Certificate
                </span>
                <h3 className="text-base font-black text-stone-900 mt-1">
                  {benchmarkResult.modelName} - {benchmarkResult.shbpScore.toLocaleString()} SHBP
                </h3>
                <p className="text-[10px] text-stone-600 font-mono">Verification: {benchmarkResult.verificationHash}</p>
              </div>
              <button
                onClick={handleCopyResult}
                className="text-xs px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 rounded-sm flex items-center gap-1.5 cursor-pointer font-bold shrink-0"
              >
                {copiedResult ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedResult ? (language === 'ko' ? '복사 완료!' : 'Copied!') : (language === 'ko' ? '성적표 복사' : 'Copy Score')}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div className="bg-white p-2 border border-stone-200">
                <span className="text-[10px] text-stone-500 block">{language === 'ko' ? '최종 랭킹전 전적' : 'Final Record'}</span>
                <span className="font-black text-sm">{benchmarkResult.wins}승 {benchmarkResult.losses}패 ({benchmarkResult.winRate}%)</span>
              </div>
              <div className="bg-white p-2 border border-stone-200">
                <span className="text-[10px] text-stone-500 block">{language === 'ko' ? '주력 덱 전투력' : 'Deck Combat Power'}</span>
                <span className="font-black text-sm text-indigo-600">{benchmarkResult.finalActiveDeckPower} CP</span>
              </div>
              <div className="bg-white p-2 border border-stone-200">
                <span className="text-[10px] text-stone-500 block">{language === 'ko' ? '카드 도감 수집' : 'Cards Collected'}</span>
                <span className="font-black text-sm text-amber-600">{benchmarkResult.uniqueCardsCollected} / 110종 ({benchmarkResult.codexRate}%)</span>
              </div>
              <div className="bg-white p-2 border border-stone-200">
                <span className="text-[10px] text-stone-500 block">{language === 'ko' ? '종합 컬렉션 CP' : 'Global Power'}</span>
                <span className="font-black text-sm text-emerald-600">{benchmarkResult.globalCollectionPower.toLocaleString()} CP</span>
              </div>
            </div>

            {/* Milestones Log Table */}
            <div className="border border-stone-200 bg-white">
              <div className="bg-stone-100 px-3 py-1.5 text-[11px] font-bold border-b border-stone-200">
                {language === 'ko' ? '15분 단위 구간 진행 기록' : '15-Minute Interval Progress'}
              </div>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                    <th className="p-2">Elapsed</th>
                    <th className="p-2">Match #</th>
                    <th className="p-2">Record</th>
                    <th className="p-2">Deck CP</th>
                    <th className="p-2">SNS Balance</th>
                    <th className="p-2">Codex</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {benchmarkResult.milestones.map((ms, i) => (
                    <tr key={i}>
                      <td className="p-2 font-bold">{ms.elapsedTime}</td>
                      <td className="p-2 font-mono">#{ms.match}</td>
                      <td className="p-2 font-mono">{ms.wins}W {ms.losses}L ({ms.winRate}%)</td>
                      <td className="p-2 font-mono text-indigo-600 font-bold">{ms.activeDeckPower} CP</td>
                      <td className="p-2 font-mono text-amber-600">{ms.snsPoints.toLocaleString()}</td>
                      <td className="p-2 font-mono">{ms.uniqueCards}/110</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 6. AI Model Benchmark Request Prompt Section */}
      <div className="border border-stone-300 bg-stone-50 p-4 rounded-none">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
            <Terminal size={16} className="text-emerald-600" />
            <span>{language === 'ko' ? 'Claude / GPT / Gemini 의뢰용 원클릭 프롬프트' : 'One-Click Prompt for Claude / GPT / Gemini'}</span>
          </div>
          <button
            onClick={handleCopyPrompt}
            className="text-xs px-3 py-1 bg-stone-900 text-amber-300 hover:bg-stone-800 rounded-sm flex items-center gap-1.5 cursor-pointer font-bold"
          >
            {copiedPrompt ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copiedPrompt ? (language === 'ko' ? '복사됨!' : 'Copied!') : (language === 'ko' ? '프롬프트 복사' : 'Copy Prompt')}</span>
          </button>
        </div>
        <p className="text-[11px] text-stone-600 mb-2 leading-relaxed">
          {language === 'ko'
            ? '아래 프롬프트를 복사하여 Claude, ChatGPT, 또는 Gemini 대화창에 입력하면, 해당 모델이 1시간 벤치마크를 정식 수행하고 공인 SHBP 점수를 보고합니다.'
            : 'Copy and send the prompt below to Claude, ChatGPT, or Gemini. The model will run the 1-hour benchmark and report its SHBP score.'}
        </p>
        <pre className="bg-stone-900 text-amber-200 p-3 rounded-sm text-[11px] font-mono whitespace-pre-wrap overflow-x-auto border border-black/20 max-h-48">
          {officialBenchmarkPrompt}
        </pre>
      </div>
    </div>
  );
};
