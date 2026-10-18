import React, { useState, useEffect } from 'react';
import {
  getStarBreathingState,
  consumeAstralUltimate,
  STAGE_TITLES,
  STAGE_REQUIREMENTS,
  StarBreathingState,
} from '../../utils/starBreathingStore';

interface StarBreathingUltimateWidgetProps {
  onCastUltimate?: (targetTileIndex?: number) => void;
  className?: string;
  isBattleActive?: boolean;
}

export const StarBreathingUltimateWidget: React.FC<StarBreathingUltimateWidgetProps> = ({
  onCastUltimate,
  className = '',
  isBattleActive = true,
}) => {
  const [state, setState] = useState<StarBreathingState>(getStarBreathingState());
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isCastingAnimation, setIsCastingAnimation] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<StarBreathingState>;
      if (custom.detail) {
        setState(custom.detail);
      } else {
        setState(getStarBreathingState());
      }
    };

    window.addEventListener('snshero_star_breathing_updated', handleUpdate);
    return () => {
      window.removeEventListener('snshero_star_breathing_updated', handleUpdate);
    };
  }, []);

  // In active battle, passively generate slight astral resonance periodically
  useEffect(() => {
    if (!isBattleActive) return;
    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.astralResonance >= 100) return prev;
        const next = Math.min(100, prev.astralResonance + 4);
        return { ...prev, astralResonance: next };
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [isBattleActive]);

  const isReady = state.astralResonance >= 100;
  const stageInfo = STAGE_TITLES[state.stage] || STAGE_TITLES[1];
  const nextRequired = STAGE_REQUIREMENTS[state.stage] || 100;

  const handleCast = () => {
    if (!isReady || isCastingAnimation) return;

    const success = consumeAstralUltimate();
    if (!success) return;

    setIsCastingAnimation(true);
    if (navigator.vibrate) {
      navigator.vibrate([30, 40, 80]);
    }

    if (onCastUltimate) {
      onCastUltimate(4); // Default center tile B2 (index 4)
    }

    setTimeout(() => {
      setIsCastingAnimation(false);
      setState(getStarBreathingState());
    }, 1800);
  };

  return (
    <>
      {/* Tactical Flat Monospace HUD Widget (Top-Right or Floating Safe Zone) */}
      <div className={`fixed top-14 right-3 z-40 select-none font-mono ${className}`}>
        {isMinimized ? (
          /* Minimized Edge Badge: Zero intrusion on gameplay */
          <button
            onClick={() => setIsMinimized(false)}
            className="min-h-[44px] flex items-center space-x-1.5 px-3 py-2 bg-[#090d16]/95 hover:bg-[#201d1d] text-stone-300 border border-[#646262]/30 rounded-sm transition-all"
            title="Expand Star Breathing HUD"
          >
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-[11px] font-bold">
              [성진호흡 {state.stage}성: {Math.floor(state.astralResonance)}%]
            </span>
            {isReady && (
              <span className="text-[9px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded-xs font-bold">
                READY
              </span>
            )}
          </button>
        ) : (
          /* Clean Monospace Tactical Bar */
          <div className="bg-[#090d16]/95 border border-[#646262]/30 text-stone-200 rounded-none p-2 flex flex-col space-y-1.5 min-w-[210px] max-w-[250px]">
            {/* Top Bar: Title & Minimize Toggle */}
            <div className="flex items-center justify-between text-[10px] border-b border-white/10 pb-1">
              <button
                onClick={() => setShowDetail(true)}
                className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 font-bold transition-colors min-h-[32px]"
              >
                <span>[EP.06 성진호흡 {state.stage}성]</span>
                <span className="text-stone-400 font-normal">?</span>
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="min-h-[44px] min-w-[44px] text-stone-500 hover:text-stone-300 p-1 rounded-xs flex items-center justify-center text-xs font-bold"
                title="Minimize HUD"
              >
                [—]
              </button>
            </div>

            {/* Gauge Row */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-stone-400">
                <span>영기 충전도</span>
                <span className={isReady ? 'text-cyan-400 font-bold' : 'text-stone-300 font-bold'}>
                  {Math.floor(state.astralResonance)} / 100%
                </span>
              </div>
              <div className="w-full h-1.5 bg-stone-900 border border-stone-800 rounded-none overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isReady ? 'bg-cyan-400' : 'bg-amber-500/80'
                  }`}
                  style={{ width: `${Math.min(100, state.astralResonance)}%` }}
                />
              </div>
            </div>

            {/* Action Button: Flat 4px Button adhering to DESIGN.md button-primary */}
            <button
              onClick={handleCast}
              disabled={!isReady || isCastingAnimation}
              className={`w-full min-h-[44px] h-11 py-2 px-3 text-xs font-bold rounded-sm border transition-all flex items-center justify-center space-x-1.5 ${
                isReady
                  ? 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-400 text-cyan-200 cursor-pointer active:bg-cyan-950'
                  : 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed opacity-75'
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${isReady ? 'text-cyan-300' : 'text-stone-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>{isReady ? '[오의 발동: 별빛 성역]' : '[영기 충전 대기]'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Casting Notice: Flat Terminal Banner adhering to OpenCode TUI style */}
      {isCastingAnimation && (
        <div className="fixed inset-x-0 top-16 z-50 pointer-events-none flex items-center justify-center font-mono px-4">
          <div className="w-full max-w-md p-3 bg-[#090d16]/98 border border-cyan-400 text-white rounded-none text-center">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-0.5">
              [SYSTEM // ASTRAL SANCTUARY ENGAGED]
            </div>
            <div className="text-sm font-bold text-amber-300">
              성진호흡 제{state.stage}성 오의 발동: 전장 타일 정화 & 적 카드 캡처
            </div>
          </div>
        </div>
      )}

      {/* Star Breathing Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono select-none">
          <div className="relative w-full max-w-sm bg-[#090d16] border border-[#646262]/40 rounded-none p-5 text-stone-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-bold">
                <span>[소설 비전 // 성진호흡법 수련기]</span>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-white rounded-sm border border-transparent hover:border-white/20"
                aria-label="Close"
              >
                [x]
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-black/60 border border-white/10 rounded-none">
                <div className="text-amber-400 font-bold mb-0.5">
                  {stageInfo.nameKo}
                </div>
                <div className="text-[11px] text-stone-400 mb-1.5">
                  {stageInfo.nameEn}
                </div>
                <div className="text-[11px] text-cyan-300">
                  고유 특성: {stageInfo.perkKo}
                </div>
              </div>

              {/* Progress bar to next stage */}
              <div>
                <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                  <span>다음 성좌 승급 수련도</span>
                  <span className="font-bold text-stone-200">{state.starShards} / {nextRequired} 파편</span>
                </div>
                <div className="w-full h-1.5 bg-stone-900 border border-stone-800 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${Math.min(100, (state.starShards / nextRequired) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-2 bg-white/5 border border-white/10 rounded-none text-[11px] text-stone-400 leading-relaxed">
                110종 미니게임을 승리할 때마다 성진의 파편을 획득하며, 3x3 배틀 중 게이지가 100% 충전되면 전장의 적 카드를 정화 캡처하는 오의를 시전할 수 있습니다.
              </div>

              <button
                onClick={() => setShowDetail(false)}
                className="w-full min-h-[44px] h-11 bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-xs rounded-sm border border-stone-700 transition-colors flex items-center justify-center"
              >
                [확인 완료]
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StarBreathingUltimateWidget;
