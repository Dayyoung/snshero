import React, { useState, useEffect } from 'react';
import {
  getStarBreathingState,
  chargeAstralResonance,
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
      navigator.vibrate([40, 60, 100]);
    }

    if (onCastUltimate) {
      onCastUltimate(4); // Default center tile B2 (index 4)
    }

    setTimeout(() => {
      setIsCastingAnimation(false);
      setState(getStarBreathingState());
    }, 2000);
  };

  return (
    <>
      {/* Floating 58px Ultimate Orb Button */}
      <div className={`fixed bottom-20 right-4 z-40 select-none font-mono ${className}`}>
        <div className="relative flex flex-col items-end">
          {/* Status Tooltip Pill */}
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="mb-1.5 px-2 py-0.5 text-[9px] bg-[#090d16]/90 border border-amber-500/30 text-amber-300 rounded-sm flex items-center space-x-1 backdrop-blur-sm shadow-sm"
          >
            <span>[EP.06 성진호흡 {state.stage}성]</span>
            <span className="text-stone-400">({Math.floor(state.astralResonance)}%)</span>
          </button>

          {/* 58px Action Orb */}
          <div className="relative">
            {/* Pulsing ring when 100% ready */}
            {isReady && (
              <span className="absolute -inset-1 rounded-full bg-cyan-500/40 animate-ping pointer-events-none" />
            )}

            <button
              onClick={handleCast}
              disabled={!isReady || isCastingAnimation}
              aria-label="Cast Star Breathing Ultimate"
              className={`relative w-[58px] h-[58px] rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-xl ${
                isReady
                  ? 'bg-gradient-to-br from-indigo-950 via-cyan-950 to-[#090d16] border-cyan-400 text-cyan-300 hover:scale-105 active:scale-95 cursor-pointer shadow-cyan-500/20'
                  : 'bg-[#090d16]/95 border-stone-700 text-stone-500 cursor-not-allowed opacity-85'
              }`}
            >
              {/* Star Constellation Rune Icon */}
              <svg className={`w-6 h-6 ${isReady ? 'animate-pulse text-cyan-300' : 'text-stone-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span className="text-[8px] font-extrabold tracking-tighter mt-0.5">
                {isReady ? '오의개방' : `${Math.floor(state.astralResonance)}%`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Casting Flash FX Overlay */}
      {isCastingAnimation && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-cyan-950/40 backdrop-blur-xs font-mono">
          <div className="text-center p-6 bg-[#090d16]/95 border border-cyan-400 text-white rounded-none shadow-2xl animate-bounce">
            <div className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-1">
              [EPISODE 06 // THE ART OF BREATHING STARS]
            </div>
            <div className="text-xl font-black text-amber-300 mb-2">
              성진호흡 제{state.stage}성: 별빛 성역 전개!
            </div>
            <div className="text-xs text-stone-300">
              전장 타일 정화 완료 // 인접 적 카드 캡처 발동
            </div>
          </div>
        </div>
      )}

      {/* Star Breathing Detail Dialog */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono select-none">
          <div className="relative w-full max-w-sm bg-[#090d16] border border-cyan-500/40 rounded-none p-5 text-stone-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <div className="flex items-center space-x-1.5 text-xs text-cyan-400 font-bold">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>[소설 비전 // 성진호흡법 수련기]</span>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="text-stone-400 hover:text-white p-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-black/60 border border-white/10 rounded-sm">
                <div className="text-amber-400 font-bold mb-1">
                  {stageInfo.nameKo}
                </div>
                <div className="text-[11px] text-stone-400 mb-2">
                  {stageInfo.nameEn}
                </div>
                <div className="text-[11px] text-cyan-300">
                  특성: {stageInfo.perkKo}
                </div>
              </div>

              {/* Progress bar to next stage */}
              <div>
                <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                  <span>다음 성좌 승급 수련도</span>
                  <span>{state.starShards} / {nextRequired} 파편</span>
                </div>
                <div className="w-full h-2 bg-stone-900 border border-stone-700 rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                    style={{ width: `${Math.min(100, (state.starShards / nextRequired) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-2 bg-white/5 border border-white/10 rounded-sm text-[11px] text-stone-400 leading-relaxed">
                110종 미니게임을 완료할 때마다 성진의 파편을 획득하며, 3x3 배틀 중 성진 게이지가 100% 충전되면 전장의 적 카드를 정화 캡처하는 오의를 시전할 수 있습니다.
              </div>

              <button
                onClick={() => setShowDetail(false)}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-sm border border-stone-600"
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
