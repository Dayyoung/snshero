import React, { useState } from 'react';
import { Target, Move, Coins, Check, ArrowRight, X, Sparkles, HelpCircle } from 'lucide-react';

export interface MissionTutorialStep {
  badge: string;
  title: string;
  description: string;
  keyPoints: string[];
  iconType?: 'GOAL' | 'GESTURES' | 'REWARDS';
}

export interface MissionTutorialOverlayProps {
  gameId: string;
  gameTitle: string;
  isOpen: boolean;
  language: string;
  customSteps?: MissionTutorialStep[];
  onClose: () => void;
}

/**
 * MissionTutorialOverlay.tsx
 * Standardized 3-Step Interactive Tutorial Overlay for All Mission Games per DESIGN.md
 */
export const MissionTutorialOverlay: React.FC<MissionTutorialOverlayProps> = ({
  gameId,
  gameTitle,
  isOpen,
  language,
  customSteps,
  onClose
}) => {
  const isKo = language === 'ko';
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  if (!isOpen) return null;

  const defaultSteps: MissionTutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 미션 목표 & 규칙' : 'STEP 1: MISSION GOAL',
      title: isKo ? `${gameTitle} 목표` : `${gameTitle} Objective`,
      description: isKo
        ? '제한 시간 내에 목표 점수를 달성하거나 보스를 격파하여 미션을 완료하세요.'
        : 'Achieve the target score or defeat bosses within the time limit to clear the mission.',
      keyPoints: isKo
        ? [
            '제한 시간 내 목표 클리어 시 승리',
            '콤보 및 정확도에 따라 고득점 배율 적용',
            '체력 소진 전 안전하게 클리어 목표'
          ]
        : [
            'Clear the objective before the timer expires',
            'Chain combos for progressive multiplier bonuses',
            'Survive and maintain HP to maximize final payout'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 100% 퓨어 제스처 조작' : 'STEP 2: PURE GESTURE CONTROLS',
      title: isKo ? '한 손 모바일 제스처' : '1-Thumb Mobile Gestures',
      description: isKo
        ? '화면 가상 버튼 없이 어디든 드래그와 탭만으로 직관적으로 플레이할 수 있습니다.'
        : 'Control everything seamlessly with natural drags and taps without screen-cluttering buttons.',
      keyPoints: isKo
        ? [
            '👆 엄지 드래그: 360도 자유로운 이동 및 조준',
            '⚡ 탭 / 릴리즈: 즉시 공격 또는 자동 타겟팅 발사',
            '💨 더블 탭: 긴급 회피 대시 / 대시 롤'
          ]
        : [
            '👆 Thumb Drag: Smooth 360-degree movement and aiming',
            '⚡ Tap / Release: Instant strike or auto-target fire',
            '💨 Double Tap: Quick evasive dash / dodge roll'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED SNS REWARDS',
      title: isKo ? '즉시 지갑 입금 및 정산' : 'Instant Wallet Settlement',
      description: isKo
        ? '모든 미션 승리 시 분당 50P 표준 및 성과 보너스가 지갑으로 즉시 원자적 입금됩니다.'
        : 'Guaranteed ~50P/min standard reward + performance multipliers deposited atomically into your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 유저 지갑으로 100% 확정 입금',
            '플레이 타임 + 스코어/콤보 보너스 투명 정산',
            '일일 퀘스트 및 시즌 미션 자동 카운트'
          ]
        : [
            '100% guaranteed deposit into your player wallet',
            'Transparent duration + score/combo breakdown',
            'Advances daily missions and season pass tiers'
          ],
      iconType: 'REWARDS'
    }
  ];

  const steps = customSteps && customSteps.length > 0 ? customSteps : defaultSteps;
  const activeStepData = steps[currentStep] || steps[0];

  const handleFinish = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`hero_tutorial_game_${gameId}`, 'true');
        localStorage.setItem(`hero_tutorial_game_2d_${gameId}`, 'true');
      } catch {
        // ignore
      }
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const renderIcon = (type?: string) => {
    switch (type) {
      case 'GOAL':
        return <Target className="w-7 h-7 text-amber-700" />;
      case 'GESTURES':
        return <Move className="w-7 h-7 text-sky-700" />;
      case 'REWARDS':
      default:
        return <Coins className="w-7 h-7 text-emerald-700" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#201d1d]/85 flex items-center justify-center p-3 sm:p-4 font-mono select-none backdrop-blur-xs">
      <div className="bg-[#fdfcfc] text-[#201d1d] border-2 border-[#201d1d] w-full max-w-md p-5 flex flex-col justify-between shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleFinish}
          className="absolute top-3 right-3 p-1.5 border border-[#201d1d]/30 text-[#201d1d] hover:bg-[#201d1d]/10 rounded-sm cursor-pointer"
          title={isKo ? '닫기' : 'Close'}
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="border-b border-[#201d1d]/20 pb-3 pr-8">
          <div className="inline-flex items-center gap-1.5 bg-[#201d1d]/10 border border-[#201d1d]/20 px-2 py-0.5 text-[10px] font-bold text-[#201d1d] mb-1.5">
            <span>{activeStepData.badge}</span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight uppercase truncate">
            {activeStepData.title}
          </h2>
          <p className="text-[11px] text-[#201d1d]/75 mt-0.5">
            {activeStepData.description}
          </p>
        </div>

        {/* Step Visual Body */}
        <div className="my-4 p-4 bg-[#201d1d]/5 border border-[#201d1d]/25">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-[#fdfcfc] border border-[#201d1d]/30 rounded-sm shrink-0 shadow-xs">
              {renderIcon(activeStepData.iconType)}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#201d1d]">
              {isKo ? '핵심 가이드' : 'CORE HIGHLIGHTS'}
            </div>
          </div>

          <div className="space-y-1.5">
            {activeStepData.keyPoints.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-[#201d1d]/90">
                <div className="w-1.5 h-1.5 bg-[#201d1d] rounded-none shrink-0 mt-1.5" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Indicator & Controls */}
        <div className="space-y-3">
          {/* Step Dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentStep(i)}
                  className={`h-1.5 transition-all rounded-none cursor-pointer ${
                    i === currentStep ? 'w-6 bg-[#201d1d]' : 'w-2 bg-[#201d1d]/30 hover:bg-[#201d1d]/60'
                  }`}
                  aria-label={`Step ${i + 1}`}
                />
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-[10px] text-[#201d1d]/80 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#201d1d] rounded-none cursor-pointer"
              />
              <span>{isKo ? '다시 보지 않기' : "Don't show again"}</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFinish}
              className="py-2.5 px-3 border border-[#201d1d] text-[#201d1d] hover:bg-[#201d1d]/10 text-xs font-bold rounded-sm cursor-pointer transition-all text-center"
            >
              <span>{isKo ? '건너뛰기' : 'Skip'}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-3 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-sm cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>
                {currentStep === steps.length - 1
                  ? isKo ? '게임 시작' : 'Start Game'
                  : isKo ? '다음 단계' : 'Next Step'}
              </span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
