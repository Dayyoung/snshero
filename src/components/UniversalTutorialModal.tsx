import React, { useState, useEffect } from 'react';
import { HelpCircle, Check, X, ArrowRight, ArrowLeft, Trophy, Zap, Shield, Sparkles, Smartphone, Move, MousePointerClick } from 'lucide-react';

export interface TutorialStep {
  title: string;
  badge: string;
  description: string;
  keyPoints: string[];
  iconType?: 'GOAL' | 'GESTURES' | 'REWARDS';
}

interface UniversalTutorialModalProps {
  gameId: string;
  gameTitle: string;
  language: string;
  customSteps?: TutorialStep[];
  onStartGame: () => void;
  onClose?: () => void;
}

export const UniversalTutorialModal: React.FC<UniversalTutorialModalProps> = ({
  gameId,
  gameTitle,
  language,
  customSteps,
  onStartGame,
  onClose
}) => {
  const isKo = language === 'ko';
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);

  const defaultSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 게임 목표 & 룰' : 'STEP 1: OBJECTIVE & RULES',
      title: isKo ? `${gameTitle} 승리 목표` : `${gameTitle} Mission Goal`,
      description: isKo
        ? '제한 시간 내에 미션 목표 점수를 달성하거나 최종 보스/장애물을 클리어하세요. 콤보를 연속 유지할수록 보너스 배율이 급상승합니다.'
        : 'Achieve the target score or clear the stage before the timer expires. Maintaining active streaks multiplies your score.',
      keyPoints: isKo
        ? [
            '제한 시간 내 목표 달성 시 승리 확정',
            '연속 성공 시 스코어 콤보 및 피버 게이지 충전',
            '장애물 충돌 시 감점 또는 체력 감소 주의'
          ]
        : [
            'Clear the objective within the time limit',
            'Chain combos to build bonus multipliers',
            'Avoid collisions to protect your health & score'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 100% 퓨어 제스처' : 'STEP 2: PURE GESTURE CONTROLS',
      title: isKo ? '원핸드 모바일 제스처 조작' : 'One-Thumb Mobile Gestures',
      description: isKo
        ? '화면 어디든 엄지손가락으로 터치/드래그하여 캐릭터나 커서를 직관적으로 조작할 수 있습니다. 가상 버튼 없이 화면 전체가 컨트롤러입니다.'
        : 'Touch and drag anywhere on screen with a single thumb. Clean gesture mapping eliminates cluttered on-screen buttons.',
      keyPoints: isKo
        ? [
            '👆 엄지 드래그: 캐릭터 자유 이동 / 조준',
            '⚡ 탭 (Tap): 메인 스킬 / 공격 / 점프',
            '💨 더블 탭 (Double Tap): 대시 / 부스터 / 특수기 발동',
            '🛡️ 롱 프레스 (Hold): 방어 자세 / 충전 사격'
          ]
        : [
            '👆 Thumb Drag: Move / Aim smoothly',
            '⚡ Single Tap: Primary Action / Attack / Jump',
            '💨 Double Tap: Dash / Boost / Special Move',
            '🛡️ Long Press: Charge / Defensive Stance'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 보상' : 'STEP 3: GUARANTEED SNS REWARDS',
      title: isKo ? '즉시 지갑 정산 & 보너스' : 'Instant Wallet Settlement',
      description: isKo
        ? '게임 클리어 즉시 플레이 시간(분당 약 50P 표준)과 콤보, 스코어에 비례하여 최대 260 SNS 포인트가 유저 지갑에 100% 확정 입금됩니다.'
        : 'Upon mission clear, up to 260 SNS Points are instantly settled and deposited directly to your in-game wallet.',
      keyPoints: isKo
        ? [
            '기본 클리어 시 100% 확정 SNS 포인트 즉시 입금',
            '고득점 & 빠른 클리어 시 스피드/스킬 보너스 추가',
            '매일 미션 퀘스트 진행도 동시 자동 누적'
          ]
        : [
            'Guaranteed instant SNS Point deposit to your wallet',
            'High scores and rapid clears award extra bonus multipliers',
            'Counts toward daily quest progression automatically'
          ],
      iconType: 'REWARDS'
    }
  ];

  const steps = customSteps || defaultSteps;

  const handleFinish = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(`hero_tutorial_game_${gameId}`, 'true');
      } catch {
        // ignore
      }
    }
    onStartGame();
  };

  const activeStepData = steps[currentStep] || steps[0];

  return (
    <div className="fixed inset-0 z-[99999] bg-[#201d1d]/80 flex items-center justify-center p-4 font-mono select-none backdrop-blur-xs">
      <div className="bg-[#fdfcfc] text-[#201d1d] border-2 border-[#201d1d] w-full max-w-md p-5 flex flex-col justify-between shadow-2xl relative">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#201d1d] inline-block animate-pulse" />
            <span className="text-xs font-bold tracking-tight uppercase">
              {activeStepData.badge}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#201d1d]/10 text-[#201d1d] rounded-sm cursor-pointer transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-1.5 pt-3">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 transition-all ${
                idx === currentStep
                  ? 'bg-[#201d1d]'
                  : idx < currentStep
                  ? 'bg-[#201d1d]/50'
                  : 'bg-[#201d1d]/15'
              }`}
            />
          ))}
        </div>

        {/* Main Step Content */}
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] shrink-0">
              {activeStepData.iconType === 'GESTURES' ? (
                <Smartphone size={20} />
              ) : activeStepData.iconType === 'REWARDS' ? (
                <Trophy size={20} />
              ) : (
                <Zap size={20} />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight">
                {activeStepData.title}
              </h3>
              <p className="text-[11px] text-[#201d1d]/70 leading-tight mt-0.5">
                {activeStepData.description}
              </p>
            </div>
          </div>

          {/* Infographic Visual Illustration */}
          {activeStepData.iconType === 'GESTURES' ? (
            <div className="bg-[#201d1d]/5 border border-[#201d1d]/20 p-3 rounded-none">
              <div className="text-[11px] font-bold text-[#201d1d] mb-2 flex items-center gap-1.5">
                <Smartphone size={13} />
                <span>{isKo ? '📱 원핸드 터치 맵핑 다이어그램' : '📱 One-Thumb Gesture Mapping'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="border border-[#201d1d]/20 bg-[#fdfcfc] p-2 flex flex-col items-center text-center">
                  <div className="text-sm font-black mb-1">👆 DRAG</div>
                  <div className="text-[#201d1d]/70">{isKo ? '자유 이동 & 조준' : 'Move / Aim'}</div>
                </div>
                <div className="border border-[#201d1d]/20 bg-[#fdfcfc] p-2 flex flex-col items-center text-center">
                  <div className="text-sm font-black mb-1">⚡ TAP</div>
                  <div className="text-[#201d1d]/70">{isKo ? '액션 / 공격 / 점프' : 'Primary Action'}</div>
                </div>
                <div className="border border-[#201d1d]/20 bg-[#fdfcfc] p-2 flex flex-col items-center text-center">
                  <div className="text-sm font-black mb-1">💨 2x TAP</div>
                  <div className="text-[#201d1d]/70">{isKo ? '대시 / 부스터' : 'Dash / Boost'}</div>
                </div>
                <div className="border border-[#201d1d]/20 bg-[#fdfcfc] p-2 flex flex-col items-center text-center">
                  <div className="text-sm font-black mb-1">🛡️ HOLD</div>
                  <div className="text-[#201d1d]/70">{isKo ? '방어 / 차지 스킬' : 'Charge / Shield'}</div>
                </div>
              </div>
            </div>
          ) : activeStepData.iconType === 'REWARDS' ? (
            <div className="bg-amber-500/10 border border-amber-600/30 p-3 rounded-none">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                <span>{isKo ? '🏆 확정 보상 기준' : '🏆 Reward Settlement Table'}</span>
                <span className="text-amber-800">~50P / MIN</span>
              </div>
              <div className="space-y-1 text-[11px] text-amber-950 font-medium">
                <div className="flex justify-between border-b border-amber-900/10 pb-0.5">
                  <span>{isKo ? '• 스테이지 기본 클리어' : '• Stage Base Clear'}</span>
                  <span className="font-bold">+35~60 SNS</span>
                </div>
                <div className="flex justify-between border-b border-amber-900/10 pb-0.5">
                  <span>{isKo ? '• 스코어 & 콤보 보너스' : '• Score & Combo Bonus'}</span>
                  <span className="font-bold">최대 +120 SNS</span>
                </div>
                <div className="flex justify-between">
                  <span>{isKo ? '• 완벽 클리어 / 스피드 런' : '• Perfect Run / Speedrun'}</span>
                  <span className="font-bold">최대 +80 SNS</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Keypoints list */}
          <div className="space-y-1.5 bg-[#201d1d]/5 p-2.5 border border-[#201d1d]/15">
            {activeStepData.keyPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                <span className="text-[#201d1d] font-bold shrink-0">✓</span>
                <span className="text-[#201d1d]/90 font-medium">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer & Controls */}
        <div className="border-t border-[#201d1d]/20 pt-3 flex flex-col gap-2.5">
          {/* Don't show again toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#201d1d]/80 select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="accent-[#201d1d] w-3.5 h-3.5 cursor-pointer rounded-xs"
            />
            <span>{isKo ? '이 게임 튜토리얼 다시 보지 않기' : 'Do not show this tutorial again'}</span>
          </label>

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="py-2.5 px-3 border border-[#201d1d] text-[#201d1d] text-xs font-bold hover:bg-[#201d1d]/10 rounded-sm cursor-pointer transition-all flex items-center gap-1"
              >
                <ArrowLeft size={13} />
                <span>{isKo ? '이전' : 'Prev'}</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="flex-1 py-2.5 px-4 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-sm cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>{isKo ? '다음 단계 (Next)' : 'Next Step'}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 py-2.5 px-4 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-sm cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>{isKo ? '[ 게임 지금 바로 시작 ]' : '[ START MISSION NOW ]'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
