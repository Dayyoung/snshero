import React, { useState } from 'react';

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
      navigator.vibrate([30, 40, 60]);
    }

    setStep('STRIKE_EXECUTED');

    // 0.6s later flip boss card
    setTimeout(() => {
      setIsFlipped(true);
      setBoardCards([
        null, null, null,
        null, 'WATER_HERO_CAPTURED', null,
        null, null, null,
      ]);
    }, 600);

    // 1.8s later show victory
    setTimeout(() => {
      setStep('VICTORY_CLAIM');
      markFtueBattleCleared();
    }, 1800);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs select-none font-mono">
      <div className="relative w-full max-w-md bg-[#090d16] text-stone-200 border border-[#646262]/40 rounded-none p-5 shadow-2xl flex flex-col justify-between min-h-[500px]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] bg-stone-900 text-stone-300 border border-stone-700 font-bold uppercase tracking-wider rounded-xs">
              [FTUE // 속성 상성 가이드]
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSkip}
              className="px-2.5 py-1 text-xs text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-sm transition-colors min-h-[36px]"
              title="건너뛰기"
            >
              [건너뛰기]
            </button>
            <button
              onClick={handleSkip}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-sm transition-colors border border-transparent hover:border-stone-700"
              aria-label="Close"
            >
              [x]
            </button>
          </div>
        </div>

        {/* Content based on Step */}
        {step !== 'VICTORY_CLAIM' ? (
          <div className="flex-1 flex flex-col justify-between">
            {/* Guide Headline */}
            <div className="text-center mb-2">
              <div className="text-xs text-amber-400 font-bold tracking-tight mb-1">
                상성 공식: 수류(WATER) &gt; 화염(FIRE) // 공격력 +50%
              </div>
              <p className="text-[11px] text-stone-400">
                중앙 [B2] 슬롯을 탭하여 수류 영웅을 배치하면 적 보스 카드를 정화 캡처합니다.
              </p>
            </div>

            {/* 3x3 Battlefield Grid */}
            <div className="my-auto py-2">
              <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mx-auto aspect-square p-2 bg-stone-950 border border-stone-800 rounded-none">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
                  const isCenter = index === 4;
                  return (
                    <div
                      key={index}
                      onClick={isCenter && step === 'TUTORIAL_ACTIVE' ? handlePlaceCard : undefined}
                      className={`relative aspect-square border rounded-none flex items-center justify-center transition-all ${
                        isCenter
                          ? 'border-amber-400/80 bg-stone-900 cursor-pointer shadow-sm hover:border-amber-300'
                          : 'border-stone-800/80 bg-stone-950/60'
                      }`}
                    >
                      {/* Center Target Indicator */}
                      {isCenter && step === 'TUTORIAL_ACTIVE' && (
                        <span className="absolute top-1 right-1 text-[8px] text-amber-400 font-bold">
                          [TAP]
                        </span>
                      )}

                      {/* Boss / Hero Card */}
                      {isCenter && (
                        <div
                          className={`w-full h-full p-1.5 flex flex-col items-center justify-between text-center transition-colors duration-500 ${
                            isFlipped ? 'bg-cyan-950/90 text-cyan-200' : 'bg-stone-900 text-rose-300'
                          }`}
                        >
                          <div className="text-[9px] font-bold">
                            {isFlipped ? '[수류: 카단]' : '[화염: 무스펠]'}
                          </div>
                          <div className="my-auto">
                            {isFlipped ? (
                              <svg className="w-6 h-6 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                              </svg>
                            )}
                          </div>
                          <div className="text-[9px] font-bold">
                            {isFlipped ? 'CAPTURED (승리)' : 'ATK:7 // DEF:6'}
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
                className="w-full py-3 bg-[#201d1d] hover:bg-stone-800 text-stone-100 font-bold text-xs rounded-sm border border-amber-500/40 transition-colors flex items-center justify-center space-x-2 min-h-[44px]"
              >
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg>
                <span>
                  {step === 'TUTORIAL_ACTIVE'
                    ? '[B2 슬롯 1탭 // 수류 역상성 파훼 발동]'
                    : '[수류 룬 타격 진행중...]'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Victory Claim Screen */
          <div className="flex-1 flex flex-col justify-between py-2 text-center">
            <div className="my-auto space-y-4">
              <div className="w-12 h-12 mx-auto rounded-none bg-stone-900 border border-amber-400/60 flex items-center justify-center text-amber-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <div>
                <span className="px-2 py-0.5 text-[10px] bg-stone-900 text-amber-400 border border-stone-700 uppercase font-bold rounded-xs">
                  [칭호 획득: 상성 마스터]
                </span>
                <h3 className="text-base font-bold text-white mt-2">
                  초회 전술 파훼 승리 완료
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  모험가 졸업 배낭과 군자금이 인벤토리에 지급되었습니다.
                </p>
              </div>

              {/* Reward Items Box */}
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-none text-left max-w-xs mx-auto space-y-1.5 text-xs">
                <div className="flex justify-between text-amber-300 font-bold">
                  <span>- 정착 군자금:</span>
                  <span>+1,500 SNS</span>
                </div>
                <div className="flex justify-between text-stone-200 font-bold">
                  <span>- 기사단 졸업 무구:</span>
                  <span>[SSR] 설원의 성검</span>
                </div>
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>- 칭호 효과:</span>
                  <span>상성 공격 시 +10% 추가타</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3 bg-[#201d1d] hover:bg-stone-800 text-white font-bold text-xs rounded-sm border border-stone-700 transition-colors min-h-[44px]"
            >
              [보상 수령 및 메인 덱 출격]
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElementalCounterStrikeTutorial;
