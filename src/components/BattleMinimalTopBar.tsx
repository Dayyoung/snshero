import React, { useState } from 'react';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';
import { usePerformanceMode } from '../hooks/usePerformanceMode';

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
 const { reducedMotion } = usePerformanceMode();
 const [showElementGuide, setShowElementGuide] = useState(false);
 const [showSettingsMenu, setShowSettingsMenu] = useState(false);
 const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
 const [showActionLogPopover, setShowActionLogPopover] = useState(false);
 const [showAiDiffPicker, setShowAiDiffPicker] = useState(false);

 const countdownPercent = Math.max(0, Math.min(100, (turnSecondsRemaining / maxTurnSeconds) * 100));
 const isUrgent = turnSecondsRemaining <= 5;

 return (
 <div className="w-full font-mono text-xs leading-5 text-[#201d1d] bg-[#fdfcfc] select-none space-y-1 relative z-30 pt-[env(safe-area-inset-top,0px)] [&_button]:min-h-11 [&_button]:min-w-11 [&_button]:rounded-sm [&_button]:cursor-pointer [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-[#646262]">
 {/* 1. Main 1-Line Status Row (ID 441, 526, 561, 501, 556, 506) */}
 <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-[#fdfcfc] text-[#201d1d] border border-[#0f0000]/12 px-2 py-1 rounded-none">
 {/* Left: Hand & Deck & Graveyard Minimal Pill (ID 441, ID 506) */}
 <div className="flex items-center gap-1 font-bold">
 <span>🃏 ME {playerHandCount}/5 (D:{playerDeckRemaining})</span>
 {graveyardCount > 0 && (
 <span className="text-[#646262] bg-[#f1eeee] px-1 border border-[#0f0000]/12 text-[11px]" title="묘지/퇴각 카드 수">
 🪦 {graveyardCount}
 </span>
 )}
 <span className="text-[#646262] font-normal">vs</span>
 <span className="text-[#646262]">OPP {opponentHandCount}/5</span>
 </div>

 {/* Center: ID 596 (Item 1) Win Threshold Momentum Bar & Turn/Round (design.md) */}
 <div className="flex flex-wrap items-center gap-1.5 font-bold">
 <span className="text-[#646262] px-1 text-[11px] shrink-0">
 ⚔️ T{currentRound}/{maxRounds}
 </span>
 <div className="flex items-center gap-1 bg-[#201d1d] text-[#fdfcfc] border border-[#0f0000]/12 px-2 py-1 text-sm">
 <span>🔵 {playerScore}</span>
 <span className="text-[#d5cece] text-[11px] font-normal">
 / {Math.max(0, 6 - playerScore) === 0 ? 'WIN' : `${Math.max(0, 6 - playerScore)} needed`}
 </span>
 {/* Integrated 2-color segmented momentum track with golden threshold marker */}
 <div className="relative w-14 sm:w-16 h-1.5 bg-[#302c2c] overflow-hidden flex items-center mx-0.5">
 <div
 style={{ width: `${Math.min(100, (playerScore / 9) * 100)}%` }}
 className={`h-full bg-[#2563eb] ${reducedMotion ? '' : 'transition-[width] duration-200'}`}
 />
 <div
 style={{ width: `${Math.min(100, (opponentScore / 9) * 100)}%` }}
 className={`h-full bg-[#dc2626] ml-auto ${reducedMotion ? '' : 'transition-[width] duration-200'}`}
 />
 {/* Golden victory condition threshold tick (6/9 = 66.7%) */}
 <div
 className="absolute top-0 bottom-0 w-px bg-[#fdfcfc] pointer-events-none z-10"
 style={{ left: '66.7%' }}
 title="6개 점유 시 승리 확정 임계점"
 />
 </div>
 <span>{opponentScore} 🔴</span>
 </div>
 {scoreDelta && (
 <span className="text-[#27613c] text-xs">
 [{scoreDelta}]
 </span>
 )}
 </div>

 {/* Right: Controls (AI Diff, Speed, Skip, Settings) (ID 501, 556, 481, 461) */}
 <div className="flex flex-wrap items-center gap-1 w-full border-t border-[#0f0000]/12 pt-1">
 {/* AI Difficulty Selector (ID 501) */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setShowAiDiffPicker(!showAiDiffPicker)}
 className="min-h-[44px] px-2 border border-[#0f0000]/12 bg-[#f8f7f7] text-[11px] font-bold hover:bg-[#f1eeee]"
 aria-expanded={showAiDiffPicker}
 title="AI 난이도"
 >
 🤖 {aiDifficulty.toUpperCase().slice(0, 3)} ▾
 </button>
 {showAiDiffPicker && (
 <div className="absolute top-full left-0 bg-[#fdfcfc] border border-[#0f0000]/12 p-1 z-50 flex flex-col gap-1 w-28">
 {(['easy', 'normal', 'hard'] as const).map(diff => (
 <button
 key={diff}
 onClick={() => {
 onChangeAiDifficulty?.(diff);
 setShowAiDiffPicker(false);
 triggerHaptic('light');
 }}
 aria-pressed={aiDifficulty === diff}
 className={`min-h-[44px] px-2 text-left text-xs uppercase font-bold ${
 aiDifficulty === diff ? 'bg-[#201d1d] text-[#fdfcfc]' : 'text-[#201d1d] hover:bg-[#f1eeee]'
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
 className="min-h-[44px] px-2 border border-[#0f0000]/12 bg-[#f8f7f7] text-[11px] hover:bg-[#f1eeee]"
 aria-expanded={showElementGuide}
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
 aria-pressed={skipAnimation}
 className={`min-h-[44px] px-2 text-xs font-bold border ${
 skipAnimation
 ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]'
 : 'border-[#0f0000]/12 bg-[#f8f7f7] text-[#646262]'
 }`}
 title="배틀 연출 스킵 토글"
 >
 ⚡
 </button>
 )}

 {/* Battle Speed Switcher (ID 481, ID 556) */}
 <div className="flex items-center border border-[#0f0000]/12 bg-[#f8f7f7] rounded-sm">
 {([1, 1.5, 2] as const).map(s => (
 <button
 key={s}
 onClick={() => {
 onChangeSpeed(s);
 triggerHaptic('light');
 }}
 aria-pressed={battleSpeed === s}
 className={`min-h-[44px] px-2 text-xs font-bold ${
 battleSpeed === s ? 'bg-[#201d1d] text-[#fdfcfc]' : 'text-[#646262] hover:bg-[#f1eeee]'
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
 className="min-h-[44px] px-2 border border-[#0f0000]/12 hover:bg-[#f1eeee] text-xs ml-auto"
 aria-label="대전 설정"
 aria-expanded={showSettingsMenu}
 >
 ⚙️
 </button>
 </div>
 </div>

 {/* 2. Integrated 2px Turn Countdown Bar (ID 451, ID 531) */}
 <div className="w-full h-1 bg-[#f1eeee] overflow-hidden relative">
 <div
 className={`h-full ${reducedMotion ? '' : 'transition-[width] duration-200'} ${
 isUrgent ? 'bg-[#a50011]' : 'bg-[#201d1d]'
 }`}
 style={{ width: `${countdownPercent}%` }}
 />
 </div>

 {/* 3. Sub-Row: Win Momentum, Deck Elements, Terrain & Synergy (ID 511, 541, 546, 571, 576) */}
 <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 text-[11px]">
 {/* Win Momentum Bar (ID 511) */}
 {winMomentum ? (
 <div className="flex items-center gap-1 shrink-0 px-1 border border-[#0f0000]/12">
 <span className="text-[#24566b] text-[11px] font-bold">{winMomentum.bluePct}% B</span>
 <div className="w-12 h-1 bg-[#f1eeee] overflow-hidden flex">
 <div style={{ width: `${winMomentum.bluePct}%` }} className="bg-[#24566b] h-full" />
 <div style={{ width: `${winMomentum.redPct}%` }} className="bg-[#963d36] h-full" />
 </div>
 <span className="text-[#963d36] text-[11px] font-bold">R {winMomentum.redPct}%</span>
 </div>
 ) : (
 <div className="flex-1 min-w-16 flex h-1.5 rounded-none overflow-hidden bg-[#f1eeee]" title="속성 점유율">
 <div style={{ width: `${elementDominance.water}%` }} className="bg-[#24566b]" />
 <div style={{ width: `${elementDominance.fire}%` }} className="bg-[#963d36]" />
 <div style={{ width: `${elementDominance.earth}%` }} className="bg-[#80602b]" />
 <div style={{ width: `${elementDominance.wind}%` }} className="bg-[#27613c]" />
 </div>
 )}

 {/* Deck Element Composition Summary (ID 541) */}
 {deckElementSummary && (
 <div className="flex items-center gap-1 text-[11px] font-bold shrink-0 px-1 border border-[#0f0000]/12">
 <span className="text-[#24566b]">💧{deckElementSummary.water}</span>
 <span className="text-[#963d36]">🔥{deckElementSummary.fire}</span>
 <span className="text-[#80602b]">🌿{deckElementSummary.earth}</span>
 <span className="text-[#27613c]">💨{deckElementSummary.wind}</span>
 </div>
 )}

 {/* Faction Synergy Badge (ID 571) */}
 {factionSynergy && (
 <div className="text-[11px] text-[#80602b] font-bold px-1 border border-[#0f0000]/12 break-words max-w-full">
 🛡️ {factionSynergy}
 </div>
 )}

 {/* Terrain Modifier Badges (ID 486, ID 546) */}
 {terrainModifiers.length > 0 && (
 <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#80602b] font-bold">
 {terrainModifiers.slice(0, 2).map((tm, idx) => (
 <span key={idx} className="px-1 border border-[#0f0000]/12">
 #{tm.slot} {tm.element}+{tm.bonus}
 </span>
 ))}
 </div>
 )}

 {/* Recent Action Log Pill (ID 476, ID 576) */}
 {recentActionLog && (
 <button
 onClick={() => setShowActionLogPopover(!showActionLogPopover)}
 className="min-h-[44px] px-2 text-[11px] text-[#646262] hover:text-[#201d1d] truncate max-w-[160px] border border-[#0f0000]/12"
 aria-expanded={showActionLogPopover}
 title="최근 액션 로그"
 >
 📜 {recentActionLog}
 </button>
 )}
 </div>

 {/* 4. Slot Hover/Touch Micro 1-Line Anchored Indicator Pill (ID 496, ID 536, ID 586) */}
 {(hoverCapturePreview || slotValidationMessage) && (
 <div className="flex flex-wrap items-center justify-center gap-1.5 py-1 px-2 bg-[#201d1d] border border-[#0f0000]/12 text-xs text-[#fdfcfc]">
 {slotValidationMessage && (
 <span className="font-bold text-[#dfcba4]">{slotValidationMessage}</span>
 )}
 {hoverCapturePreview?.elementAdvantage && (
 <span className="text-[#add4e3] font-bold">[{hoverCapturePreview.elementAdvantage}]</span>
 )}
 {hoverCapturePreview?.captureChance !== undefined && (
 <span className="text-[#c0d7bf] font-bold">
 {hoverCapturePreview.captureChance}% Capture Chance
 </span>
 )}
 {hoverCapturePreview?.statDelta && (
 <span className="text-[#d5cece] text-[11px] border-l border-[#fdfcfc]/20 pl-1">
 {hoverCapturePreview.statDelta}
 </span>
 )}
 </div>
 )}

 {/* 5. Micro 1.2s Toast Snackbar (ID 516) */}
 {toastMessage && (
 <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100%-2rem)] bg-[#201d1d] border border-[#fdfcfc]/20 text-[#fdfcfc] px-3 py-2 text-xs font-medium">
 {toastMessage}
 </div>
 )}

 {/* Element Guide Popover (ID 456, ID 521) */}
 {showElementGuide && (
 <div className="absolute top-full left-2 right-2 bg-[#fdfcfc] border border-[#0f0000]/12 p-3 text-xs text-[#201d1d] z-40 flex justify-between items-center gap-2">
 <div>
 <div className="font-bold mb-1">속성 상성 규칙 (+2 PWR 우위)</div>
 <div>💧 수 &gt; 🔥 화 &gt; 🌿 지 &gt; 💨 풍 &gt; 💧 수 | ✨ 신 ⇄ 🌑 암</div>
 </div>
 <button
 onClick={() => setShowElementGuide(false)}
 className="min-h-[44px] px-2 border border-[#0f0000]/12 hover:bg-[#f1eeee] text-xs shrink-0"
 >
 [X]
 </button>
 </div>
 )}

 {/* Action Log Detail Popover (ID 476, ID 576) */}
 {showActionLogPopover && recentActionLog && (
 <div className="absolute top-full right-2 max-w-[calc(100%-1rem)] w-80 bg-[#fdfcfc] border border-[#0f0000]/12 p-3 text-xs text-[#201d1d] z-40 flex justify-between items-center gap-2">
 <div>
 <span className="text-[#646262] font-bold">[RECENT ACTION]</span>
 <div className="mt-1 break-words">{recentActionLog}</div>
 </div>
 <button onClick={() => setShowActionLogPopover(false)} className="min-h-[44px] px-2 border border-[#0f0000]/12 hover:bg-[#f1eeee] shrink-0">
 [X]
 </button>
 </div>
 )}

 {/* Settings Dropdown with 2-Step Surrender (ID 461, ID 566, ID 581) */}
 {showSettingsMenu && (
 <div className="absolute top-full right-1 bg-[#fdfcfc] border border-[#0f0000]/12 p-3 z-50 w-52 space-y-2">
 <div className="text-xs font-bold border-b border-[#0f0000]/12 pb-2">
 대전 설정
 </div>
 <button
 onClick={() => {
 setShowSettingsMenu(false);
 setShowSurrenderConfirm(true);
 }}
 className="min-h-[44px] w-full px-2 hover:bg-[#f1eeee] border border-[#0f0000]/12 text-[#a50011] text-left font-bold text-xs flex items-center justify-between"
 >
 <span>[🏳️ 기권하기]</span>
 <span className="text-[11px]">몰수패</span>
 </button>
 <button
 onClick={() => setShowSettingsMenu(false)}
 className="min-h-[44px] w-full bg-[#f1eeee] text-[#201d1d] text-center text-xs"
 >
 닫기
 </button>
 </div>
 )}

 {/* 2-Step Surrender Confirmation Modal (ID 461, ID 581) */}
 {showSurrenderConfirm && (
 <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 p-4">
 <div className="bg-[#fdfcfc] border border-[#0f0000]/12 p-4 max-w-xs w-full text-center space-y-3">
 <div className="text-[#a50011] font-bold text-xs uppercase">
 ⚠️ [MATCH FORFEIT WARNING]
 </div>
 <p className="text-xs leading-5 text-[#424245]">
 정말로 경기를 기권하시겠습니까? 기권 시 몰수패로 처리되며 레이팅이 감소합니다.
 </p>
 <div className="grid grid-cols-2 gap-2 pt-1">
 <button
 onClick={() => setShowSurrenderConfirm(false)}
 className="min-h-[44px] px-2 border border-[#0f0000]/12 text-[#201d1d] text-xs font-bold hover:bg-[#f1eeee]"
 >
 [계속하기]
 </button>
 <button
 onClick={() => {
 setShowSurrenderConfirm(false);
 onSurrender();
 }}
 className="min-h-[44px] px-2 bg-[#a50011] hover:bg-[#84000e] text-[#fdfcfc] text-xs font-bold"
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
