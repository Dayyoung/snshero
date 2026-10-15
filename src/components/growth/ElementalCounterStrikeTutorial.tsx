import React, { useState, useEffect } from 'react';

interface ElementalCounterStrikeTutorialProps {
  isOpen: boolean;
  onComplete: (rewardGold: number) => void;
  onSkip: () => void;
}

const STORAGE_KEY = 'snshero_ftue_battle_cleared';

export const isFtueBattleCleared = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
};

export const markFtueBattleCleared = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, 'true');
};

export const ElementalCounterStrikeTutorial: React.FC<ElementalCounterStrikeTutorialProps> = ({
  isOpen,
  onComplete,
  onSkip,
}) => {
  // States: TUTORIAL_ACTIVE -> STRIKE_EXECUTED -> VICTORY_CLAIM
  const [step, setStep] = useState<'TUTORIAL_ACTIVE' | 'STRIKE_EXECUTED' | 'VICTORY_CLAIM'>('TUTORIAL_ACTIVE');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [boardCards, setBoardCards] = useState<(string | null)[]>([
    null, null, null,
    null, 'FIRE_BOSS', null,
    null, null, null,
  ]);

  if (!isOpen) return null;

  const handlePlaceCard = () => {
    if (step !== 'TUTORIAL_ACTIVE') return;

    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 100]);
    }

    setStep('STRIKE_EXECUTED');

    // 0.8s later flip boss card
    setTimeout(() => {
      setIsFlipped(true);
      setBoardCards([
        null, null, null,
        null, 'WATER_HERO_CAPTURED', null,
        null, null, null,
      ]);
    }, 800);

    // 2.2s later show victory
    setTimeout(() => {
      setStep('VICTORY_CLAIM');
      markFtueBattleCleared();
    }, 2200);
  };

  const handleSkip = () => {
    markFtueBattleCleared();
    onSkip();
  };

  const handleFinish = () => {
    markFtueBattleCleared();
    onComplete(1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md select-none font-mono">
      <div className="relative w-full max-w-md bg-[#090d16] text-stone-200 border border-cyan-500/40 rounded-none p-5 shadow-2xl flex flex-col justify-between min-h-[520px]">
        {/* Top Bar with SKIP Button */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold uppercase tracking-wider">
              [FTUE // 3초 역상성 파훼]
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="px-3 py-1.5 text-xs text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 rounded-sm transition-all min-h-[44px]"
          >
            [SKIP TUTORIAL]
          </button>
        </div>

        {/* Content based on Step */}
        {step !== 'VICTORY_CLAIM' ? (
          <div className="flex-1 flex flex-col justify-between">
            {/* Guide Headline */}
            <div className="text-center mb-2">
              <div className="text-xs text-amber-400 font-bold tracking-tight mb-1">
                상성 우위 분석: 수류(WATER) &gt; 화염(FIRE) // 공격력 +50%
              </div>
              <p className="text-[11px] text-stone-400">
                중앙 B2 슬롯을 탭하여 수류 영웅을 배치하고 적 보스를 뒤집으십시오!
              </p>
            </div>

            {/* 3x3 Battlefield Grid */}
            <div className="my-auto py-2">
              <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mx-auto aspect-square p-2 bg-black/60 border border-white/10 rounded-sm">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
                  const isCenter = index === 4;
                  const cardState = boardCards[index];

                  return (
                    <div
                      key={index}
                      onClick={isCenter && step === 'TUTORIAL_ACTIVE' ? handlePlaceCard : undefined}
                      className={`relative aspect-square border rounded-sm flex items-center justify-center transition-all ${
                        isCenter
                          ? 'border-cyan-400 bg-cyan-950/30 cursor-pointer shadow-cyan-500/20'
                          : 'border-white/5 bg-stone-900/30'
                      }`}
                    >
                      {/* Center Target Pulse Ring */}
                      {isCenter && step === 'TUTORIAL_ACTIVE' && (
                        <span className="absolute -inset-1 rounded-sm bg-cyan-400/30 animate-ping pointer-events-none" />
                      )}

                      {/* Boss / Hero Card */}
                      {isCenter && (
                        <div
                          className={`w-full h-full p-1.5 flex flex-col items-center justify-between text-center transition-transform duration-700 ${
                            isFlipped ? 'rotate-y-180 bg-cyan-950/80 text-cyan-300' : 'bg-rose-950/80 text-rose-300'
                          }`}
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          <div className="text-[9px] font-bold">
                            {isFlipped ? '[수류 영웅: 카단]' : '[화염 보스: 무스펠]'}
                          </div>
                          <div className="my-auto">
                            {isFlipped ? (
                              <svg className="w-8 h-8 text-cyan-300 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                              </svg>
                            ) : (
                              <svg className="w-8 h-8 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                              </svg>
                            )}
                          </div>
                          <div className="text-[8px] font-extrabold">
                            {isFlipped ? 'CAPTURED! (승리)' : 'ATK: 7 // DEF: 6'}
                          </div>
                        </div>
                      )}

                      {!isCenter && (
                        <span className="text-[10px] text-stone-700">
                          {['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'][index]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom User Hand / Execution Button */}
            <div className="mt-3">
              <button
                onClick={handlePlaceCard}
                disabled={step !== 'TUTORIAL_ACTIVE'}
                className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-sm transition-all shadow-lg flex items-center justify-center space-x-2 min-h-[48px]"
              >
                <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg>
                <span>
                  {step === 'TUTORIAL_ACTIVE'
                    ? '[B2 슬롯 1탭 // 수류 역상성 파훼 발동]'
                    : '[수류 룬 폭발 연출 진행중...]'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Victory Claim Screen */
          <div className="flex-1 flex flex-col justify-between py-2 text-center animate-fadeIn">
            <div className="my-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 border border-cyan-400 flex items-center justify-center text-cyan-300">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="8" r="7"></circle>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </svg>
              </div>

              <div>
                <span className="px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase font-bold">
                  [칭호 획득: 상성 마스터]
                </span>
                <h3 className="text-lg font-bold text-white mt-2">
                  초회 전술 파훼 승리 완료!
                </h3>
                <p className="text-xs text-stone-300 mt-1">
                  모험가 졸업 배낭과 군자금이 인벤토리에 지급되었습니다.
                </p>
              </div>

              {/* Reward Items Box */}
              <div className="p-3 bg-black/60 border border-white/10 rounded-sm text-left max-w-xs mx-auto space-y-1.5 text-xs">
                <div className="flex justify-between text-amber-300 font-bold">
                  <span>- 정착 군자금:</span>
                  <span>+1,500 SNS</span>
                </div>
                <div className="flex justify-between text-cyan-300 font-bold">
                  <span>- 기사단 졸업 무구:</span>
                  <span>[SSR] 설원의 성검</span>
                </div>
                <div className="flex justify-between text-stone-400 text-[11px]">
                  <span>- 칭호 특성:</span>
                  <span>상성 공격 시 +10% 추가타</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-sm transition-all shadow-lg min-h-[48px]"
            >
              [보상 수령 및 메인 덱 출격]
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
