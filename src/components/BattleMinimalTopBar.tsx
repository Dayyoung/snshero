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
}

/**
 * ID 441, 446, 451, 456, 461, 471, 476, 481, 486: 3x3 보드 상단 1줄 미니멀 통합 HUD 바
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
}) => {
  const [showElementGuide, setShowElementGuide] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const [showActionLogPopover, setShowActionLogPopover] = useState(false);

  const countdownPercent = Math.max(0, Math.min(100, (turnSecondsRemaining / maxTurnSeconds) * 100));
  const isUrgent = turnSecondsRemaining <= 5;

  return (
    <div className="w-full font-mono text-[10px] select-none space-y-1 relative z-30">
      {/* 1. Main 1-Line Status Row */}
      <div className="flex items-center justify-between gap-1 bg-[#1a1717]/90 text-white border border-[#201d1d]/20 px-2 py-1 rounded-none shadow-xs backdrop-blur-xs">
        {/* Left: Hand & Deck Minimal Pill (ID 441) */}
        <div className="flex items-center gap-1 font-bold">
          <span className="text-cyan-400">🃏 ME {playerHandCount}/5 (D:{playerDeckRemaining})</span>
          <span className="text-slate-500">vs</span>
          <span className="text-rose-400">OPP {opponentHandCount}/5</span>
        </div>

        {/* Center: Turn State or Opponent Thinking Indicator (ID 446) */}
        <div className="flex items-center gap-1">
          {turn === 'opponent' ? (
            <span className="text-amber-400 font-bold animate-pulse">
              [ ⏳ {language === 'ko' ? '상대 수 싸움 중...' : 'Opponent strategizing...'} ]
            </span>
          ) : (
            <span className="text-emerald-400 font-black">
              [ ▶ {language === 'ko' ? '내 착수 턴' : 'YOUR TURN'} ]
            </span>
          )}
        </div>

        {/* Right: Controls (Speed, Element Guide, Settings) */}
        <div className="flex items-center gap-1.5">
          {/* Element Advantage Guide Pill (ID 456) */}
          <button
            type="button"
            onClick={() => setShowElementGuide(!showElementGuide)}
            className="px-1.5 py-0.5 border border-slate-700 bg-slate-800 text-[9px] hover:border-slate-500 active:scale-95"
            title="속성 상성 가이드"
          >
            [ 💧&gt;🔥&gt;🌿&gt;💨 ]
          </button>

          {/* Battle Speed Switcher (ID 481) */}
          <div className="flex items-center border border-slate-700 bg-slate-800">
            {([1, 1.5, 2] as const).map(s => (
              <button
                key={s}
                onClick={() => {
                  onChangeSpeed(s);
                  triggerHaptic('light');
                }}
                className={`px-1 py-0.5 text-[9px] font-bold ${
                  battleSpeed === s ? 'bg-amber-500 text-black' : 'text-slate-400'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Gear Settings Dropdown (ID 461) */}
          <button
            type="button"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="px-1.5 py-0.5 border border-slate-700 hover:bg-slate-700 active:scale-95"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* 2. Integrated 2px Turn Countdown Bar (ID 451) */}
      <div className="w-full h-1 bg-slate-800/80 overflow-hidden relative">
        <div
          className={`h-full transition-all duration-300 ${
            isUrgent ? 'bg-red-500 animate-pulse' : 'bg-cyan-400'
          }`}
          style={{ width: `${countdownPercent}%` }}
        />
      </div>

      {/* 3. Element Dominance Segment Bar (ID 471) & Terrain Modifiers (ID 486) */}
      <div className="flex items-center justify-between gap-2 px-1 text-[9px]">
        {/* Dominance Bar */}
        <div className="flex-1 flex h-1.5 rounded-none overflow-hidden bg-slate-900 border border-slate-800" title="속성 점유율">
          <div style={{ width: `${elementDominance.water}%` }} className="bg-blue-500" />
          <div style={{ width: `${elementDominance.fire}%` }} className="bg-red-500" />
          <div style={{ width: `${elementDominance.earth}%` }} className="bg-amber-600" />
          <div style={{ width: `${elementDominance.wind}%` }} className="bg-emerald-500" />
        </div>

        {/* Terrain Modifier Badges (ID 486) */}
        {terrainModifiers.length > 0 && (
          <div className="flex items-center gap-1 text-[8px] text-amber-300 font-bold shrink-0">
            {terrainModifiers.slice(0, 2).map((tm, idx) => (
              <span key={idx} className="bg-slate-800/80 px-1 border border-slate-700">
                #{tm.slot} {tm.element}+{tm.bonus}
              </span>
            ))}
          </div>
        )}

        {/* Recent Action Log Pill (ID 476) */}
        {recentActionLog && (
          <button
            onClick={() => setShowActionLogPopover(!showActionLogPopover)}
            className="text-[8px] text-slate-400 hover:text-white truncate max-w-[120px]"
            title="최근 액션 로그"
          >
            📜 {recentActionLog}
          </button>
        )}
      </div>

      {/* Element Guide Popover (ID 456) */}
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

      {/* Action Log Detail Popover (ID 476) */}
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

      {/* Settings Dropdown with 2-Step Surrender (ID 461) */}
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

      {/* 2-Step Surrender Confirmation Modal (ID 461) */}
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
