import React, { useState } from 'react';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface BattleMinimalTopBarProps {
  playerHandCount: number;
  playerDeckRemaining: number;
  opponentHandCount: number;
  turn: 'player' | 'opponent';
  turnSecondsRemaining: number;
  maxTurnSeconds?: number;
  battleSpeed: 1 | 1.5 | 2;
  onChangeSpeed: (speed: 1 | 1.5 | 2) => void;
  recentActionLog?: string;
  elementDominance?: { water: number; fire: number; earth: number; wind: number };
  terrainModifiers?: { slot: number; element: string; bonus: number }[];
  onSurrender: () => void;
  language: Language;
  // 신규 추가 배틀 HUD 프롭스 (ID 496, 501, 506, 511, 516, 526, 536, 541, 556, 561, 571, 586, 591)
  playerScore?: number;
  opponentScore?: number;
  currentRound?: number;
  maxRounds?: number;
  aiDifficulty?: 'easy' | 'normal' | 'hard';
  onChangeAiDifficulty?: (diff: 'easy' | 'normal' | 'hard') => void;
  graveyardCount?: number;
  winMomentum?: { bluePct: number; redPct: number };
  hoverCapturePreview?: {
    elementAdvantage?: string;
    captureChance?: number;
    statDelta?: string;
  } | null;
  toastMessage?: string | null;
  deckElementSummary?: { water: number; fire: number; earth: number; wind: number };
  factionSynergy?: string | null;
  slotValidationMessage?: string | null;
  scoreDelta?: string | null;
  skipAnimation?: boolean;
  onToggleSkipAnimation?: () => void;
}

/**
 * ID 441~486 및 신규 ID 496, 501, 506, 511, 516, 521, 526, 531, 536, 541, 546, 551, 556, 561, 566, 571, 576, 581, 586, 591:
 * 3x3 보드 상단/하단 1줄 미니멀 통합 HUD 바 & 인라인 뱃지 시스템
 */
export const BattleMinimalTopBar: React.FC<BattleMinimalTopBarProps> = ({
  playerHandCount,
  playerDeckRemaining,
  opponentHandCount,
  turn,
  turnSecondsRemaining,
  maxTurnSeconds = 15,
  battleSpeed,
  onChangeSpeed,
  recentActionLog,
  elementDominance = { water: 25, fire: 25, earth: 25, wind: 25 },
  terrainModifiers = [],
  onSurrender,
  language,
  playerScore = 5,
  opponentScore = 4,
  currentRound = 1,
  maxRounds = 9,
  aiDifficulty = 'normal',
  onChangeAiDifficulty,
  graveyardCount = 0,
  winMomentum,
  hoverCapturePreview,
  toastMessage,
  deckElementSummary,
  factionSynergy,
  slotValidationMessage,
  scoreDelta,
  skipAnimation = false,
  onToggleSkipAnimation,
}) => {
  const [showElementGuide, setShowElementGuide] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const [showActionLogPopover, setShowActionLogPopover] = useState(false);
  const [showAiDiffPicker, setShowAiDiffPicker] = useState(false);

  const countdownPercent = Math.max(0, Math.min(100, (turnSecondsRemaining / maxTurnSeconds) * 100));
  const isUrgent = turnSecondsRemaining <= 5;

  return (
    <div className="w-full font-mono text-[10px] select-none space-y-1 relative z-30">
      {/* 1. Main 1-Line Status Row (ID 441, 526, 561, 501, 556, 506) */}
      <div className="flex items-center justify-between gap-1 bg-[#1a1717]/95 text-white border border-[#201d1d]/30 px-2 py-1 rounded-none shadow-xs backdrop-blur-xs">
        {/* Left: Hand & Deck & Graveyard Minimal Pill (ID 441, ID 506) */}
        <div className="flex items-center gap-1 font-bold">
          <span className="text-cyan-400">🃏 ME {playerHandCount}/5 (D:{playerDeckRemaining})</span>
          {graveyardCount > 0 && (
            <span className="text-slate-400 bg-black/40 px-1 border border-slate-700 text-[9px]" title="묘지/퇴각 카드 수">
              🪦 {graveyardCount}
            </span>
          )}
          <span className="text-slate-500">vs</span>
          <span className="text-rose-400">OPP {opponentHandCount}/5</span>
        </div>

        {/* Center: Turn, Round & 1-Line Scoreboard (ID 526, ID 561) */}
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-amber-300 bg-amber-950/60 px-1 border border-amber-800 text-[9px]">
            ⚔️ T{currentRound}/{maxRounds}
          </span>
          <span className="text-cyan-300">🔵 {playerScore}</span>
          <span className="text-slate-600">:</span>
          <span className="text-rose-400">{opponentScore} 🔴</span>
          {scoreDelta && (
            <span className="text-emerald-400 text-[9px] animate-pulse">
              [{scoreDelta}]
            </span>
          )}
        </div>

        {/* Right: Controls (AI Diff, Speed, Skip, Settings) (ID 501, 556, 481, 461) */}
        <div className="flex items-center gap-1">
          {/* AI Difficulty Selector (ID 501) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAiDiffPicker(!showAiDiffPicker)}
              className="px-1 py-0.5 border border-slate-700 bg-slate-800 text-[8px] text-amber-300 font-bold hover:border-amber-500 active:scale-95"
              title="AI 난이도"
            >
              🤖 {aiDifficulty.toUpperCase().slice(0, 3)} ▾
            </button>
            {showAiDiffPicker && (
              <div className="absolute top-6 right-0 bg-[#201d1d] border border-amber-500 p-1 shadow-xl z-50 flex flex-col gap-1 w-20">
                {(['easy', 'normal', 'hard'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => {
                      onChangeAiDifficulty?.(diff);
                      setShowAiDiffPicker(false);
                      triggerHaptic('light');
                    }}
                    className={`px-1 py-0.5 text-left text-[9px] uppercase font-bold ${
                      aiDifficulty === diff ? 'bg-amber-500 text-black' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Element Advantage Guide Pill (ID 456, ID 521) */}
          <button
            type="button"
            onClick={() => setShowElementGuide(!showElementGuide)}
            className="px-1 py-0.5 border border-slate-700 bg-slate-800 text-[8px] hover:border-slate-500 active:scale-95"
            title="속성 상성 가이드"
          >
            [💧&gt;🔥&gt;🌿]
          </button>

          {/* Animation Skip Toggle (ID 556) */}
          {onToggleSkipAnimation && (
            <button
              type="button"
              onClick={() => {
                onToggleSkipAnimation();
                triggerHaptic('light');
              }}
              className={`px-1 py-0.5 text-[8px] font-bold border ${
                skipAnimation
                  ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
              title="배틀 연출 스킵 토글"
            >
              ⚡
            </button>
          )}

          {/* Battle Speed Switcher (ID 481, ID 556) */}
          <div className="flex items-center border border-slate-700 bg-slate-800">
            {([1, 1.5, 2] as const).map(s => (
              <button
                key={s}
                onClick={() => {
                  onChangeSpeed(s);
                  triggerHaptic('light');
                }}
                className={`px-1 py-0.5 text-[8px] font-bold ${
                  battleSpeed === s ? 'bg-amber-500 text-black' : 'text-slate-400'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Gear Settings Dropdown (ID 461, ID 566) */}
          <button
            type="button"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="px-1 py-0.5 border border-slate-700 hover:bg-slate-700 active:scale-95 text-[9px]"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* 2. Integrated 2px Turn Countdown Bar (ID 451, ID 531) */}
      <div className="w-full h-1 bg-slate-800/80 overflow-hidden relative">
        <div
          className={`h-full transition-all duration-300 ${
            isUrgent ? 'bg-red-500 animate-pulse' : 'bg-cyan-400'
          }`}
          style={{ width: `${countdownPercent}%` }}
        />
      </div>

      {/* 3. Sub-Row: Win Momentum, Deck Elements, Terrain & Synergy (ID 511, 541, 546, 571, 576) */}
      <div className="flex items-center justify-between gap-1 px-1 text-[9px]">
        {/* Win Momentum Bar (ID 511) */}
        {winMomentum ? (
          <div className="flex items-center gap-1 shrink-0 bg-slate-900 px-1 border border-slate-800">
            <span className="text-cyan-400 text-[8px] font-bold">{winMomentum.bluePct}% B</span>
            <div className="w-12 h-1 bg-slate-800 overflow-hidden flex">
              <div style={{ width: `${winMomentum.bluePct}%` }} className="bg-cyan-400 h-full" />
              <div style={{ width: `${winMomentum.redPct}%` }} className="bg-rose-500 h-full" />
            </div>
            <span className="text-rose-400 text-[8px] font-bold">R {winMomentum.redPct}%</span>
          </div>
        ) : (
          <div className="flex-1 flex h-1.5 rounded-none overflow-hidden bg-slate-900 border border-slate-800" title="속성 점유율">
            <div style={{ width: `${elementDominance.water}%` }} className="bg-blue-500" />
            <div style={{ width: `${elementDominance.fire}%` }} className="bg-red-500" />
            <div style={{ width: `${elementDominance.earth}%` }} className="bg-amber-600" />
            <div style={{ width: `${elementDominance.wind}%` }} className="bg-emerald-500" />
          </div>
        )}

        {/* Deck Element Composition Summary (ID 541) */}
        {deckElementSummary && (
          <div className="flex items-center gap-0.5 text-[8px] text-slate-300 font-bold shrink-0 bg-black/40 px-1 border border-slate-800">
            <span className="text-blue-400">💧{deckElementSummary.water}</span>
            <span className="text-red-400">🔥{deckElementSummary.fire}</span>
            <span className="text-amber-400">🌿{deckElementSummary.earth}</span>
            <span className="text-emerald-400">💨{deckElementSummary.wind}</span>
          </div>
        )}

        {/* Faction Synergy Badge (ID 571) */}
        {factionSynergy && (
          <div className="text-[8px] text-amber-300 font-bold bg-amber-950/40 px-1 border border-amber-800/80 truncate max-w-[140px]">
            🛡️ {factionSynergy}
          </div>
        )}

        {/* Terrain Modifier Badges (ID 486, ID 546) */}
        {terrainModifiers.length > 0 && (
          <div className="flex items-center gap-1 text-[8px] text-amber-300 font-bold shrink-0">
            {terrainModifiers.slice(0, 2).map((tm, idx) => (
              <span key={idx} className="bg-slate-800/80 px-1 border border-slate-700">
                #{tm.slot} {tm.element}+{tm.bonus}
              </span>
            ))}
          </div>
        )}

        {/* Recent Action Log Pill (ID 476, ID 576) */}
        {recentActionLog && (
          <button
            onClick={() => setShowActionLogPopover(!showActionLogPopover)}
            className="text-[8px] text-slate-400 hover:text-white truncate max-w-[110px]"
            title="최근 액션 로그"
          >
            📜 {recentActionLog}
          </button>
        )}
      </div>

      {/* 4. Slot Hover/Touch Micro 1-Line Anchored Indicator Pill (ID 496, ID 536, ID 586) */}
      {(hoverCapturePreview || slotValidationMessage) && (
        <div className="flex items-center justify-center gap-1.5 py-0.5 px-2 bg-black/85 border border-cyan-500/40 text-[9px] text-cyan-200 animate-fadeIn">
          {slotValidationMessage && (
            <span className="font-bold text-amber-400">{slotValidationMessage}</span>
          )}
          {hoverCapturePreview?.elementAdvantage && (
            <span className="text-cyan-300 font-bold">[{hoverCapturePreview.elementAdvantage}]</span>
          )}
          {hoverCapturePreview?.captureChance !== undefined && (
            <span className="text-emerald-300 font-black">
              {hoverCapturePreview.captureChance}% Capture Chance
            </span>
          )}
          {hoverCapturePreview?.statDelta && (
            <span className="text-slate-300 text-[8px] border-l border-slate-700 pl-1">
              {hoverCapturePreview.statDelta}
            </span>
          )}
        </div>
      )}

      {/* 5. Micro 1.2s Toast Snackbar (ID 516) */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[#1a1717] border border-cyan-500 text-cyan-200 px-3 py-1 text-[10px] font-bold shadow-xl animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Element Guide Popover (ID 456, ID 521) */}
      {showElementGuide && (
        <div className="absolute top-8 left-2 right-2 bg-[#201d1d] border border-amber-500 p-2.5 text-[10px] text-white z-40 shadow-xl flex justify-between items-center">
          <div>
            <div className="font-bold text-amber-400 mb-0.5">속성 상성 규칙 (+2 PWR 우위)</div>
            <div>💧 수 &gt; 🔥 화 &gt; 🌿 지 &gt; 💨 풍 &gt; 💧 수 | ✨ 신 ⇄ 🌑 암</div>
          </div>
          <button
            onClick={() => setShowElementGuide(false)}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 text-xs"
          >
            [X]
          </button>
        </div>
      )}

      {/* Action Log Detail Popover (ID 476, ID 576) */}
      {showActionLogPopover && recentActionLog && (
        <div className="absolute top-8 right-2 max-w-xs w-full bg-[#201d1d] border border-slate-600 p-2 text-[10px] text-slate-200 z-40 shadow-xl flex justify-between items-center">
          <div>
            <span className="text-amber-400 font-bold">[RECENT ACTION]</span>
            <div className="mt-1">{recentActionLog}</div>
          </div>
          <button onClick={() => setShowActionLogPopover(false)} className="px-2 py-0.5 bg-white/10">
            [X]
          </button>
        </div>
      )}

      {/* Settings Dropdown with 2-Step Surrender (ID 461, ID 566, ID 581) */}
      {showSettingsMenu && (
        <div className="absolute top-8 right-1 bg-[#1a1717] border border-slate-600 p-2 shadow-xl z-50 w-44 space-y-2">
          <div className="text-[10px] font-bold text-slate-300 border-b border-slate-700 pb-1">
            대전 설정
          </div>
          <button
            onClick={() => {
              setShowSettingsMenu(false);
              setShowSurrenderConfirm(true);
            }}
            className="w-full py-1.5 px-2 bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200 text-left font-bold text-[10px] flex items-center justify-between"
          >
            <span>[🏳️ 기권하기]</span>
            <span className="text-[8px] text-rose-400">몰수패</span>
          </button>
          <button
            onClick={() => setShowSettingsMenu(false)}
            className="w-full py-1 bg-slate-800 text-slate-300 text-center text-[9px]"
          >
            닫기
          </button>
        </div>
      )}

      {/* 2-Step Surrender Confirmation Modal (ID 461, ID 581) */}
      {showSurrenderConfirm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1a1717] border border-rose-500 p-4 max-w-xs w-full shadow-2xl text-center space-y-3">
            <div className="text-rose-400 font-bold text-xs uppercase">
              ⚠️ [MATCH FORFEIT WARNING]
            </div>
            <p className="text-[11px] text-slate-300">
              정말로 경기를 기권하시겠습니까? 기권 시 몰수패로 처리되며 레이팅이 감소합니다.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowSurrenderConfirm(false)}
                className="py-1.5 border border-slate-600 text-slate-300 text-xs font-bold"
              >
                [계속하기]
              </button>
              <button
                onClick={() => {
                  setShowSurrenderConfirm(false);
                  onSurrender();
                }}
                className="py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black"
              >
                [기권 확정]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
