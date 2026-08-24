import React, { useState } from 'react';
import { Trophy, HelpCircle, ArrowRight, Zap, Target } from 'lucide-react';

interface SportsMissionTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  gameTitle: string;
  steps?: { title: string; desc: string; gestureType: 'pull' | 'flick' | 'tap' | 'slide' }[];
  storageKey: string;
}

export const SportsMissionTutorial: React.FC<SportsMissionTutorialProps> = ({
  isOpen,
  onClose,
  language,
  gameTitle,
  steps,
  storageKey
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const isKo = language === 'ko';

  if (!isOpen) return null;

  const defaultSteps = [
    {
      title: isKo ? '1. 경기 규칙 및 승리 목표' : '1. Rules & Objective',
      desc: isKo ? `${gameTitle} 모드에서 정확한 물리 조준과 타이밍으로 최고 기록을 달성하고 승리하세요.` : `Achieve the high score with precise physics aiming and timing in ${gameTitle}.`,
      gestureType: 'target'
    },
    {
      title: isKo ? '2. 순수 제스처 조작법 (버튼 없음)' : '2. Pure Touch Gesture Controls',
      desc: isKo ? '화면 하단 썸존을 당겨(Pull-back) 파워를 모으고, 손가락을 떼어(Release) 정밀 슛/투구를 발사합니다.' : 'Pull back on the bottom thumb zone to charge power, and release to shoot.',
      gestureType: 'pull'
    },
    {
      title: isKo ? '3. 분당 50P 표준 확정 SNS 보상' : '3. Guaranteed SNS Rewards',
      desc: isKo ? '경기 클리어 즉시 플레이 시간 및 스킬 보너스가 계산되어 100% 확정 SNS 포인트가 지갑으로 즉시 입금됩니다.' : 'Guaranteed SNS points based on duration and skill bonus deposited atomically into your wallet.',
      gestureType: 'reward'
    }
  ];

  const activeSteps = steps || defaultSteps;

  const handleFinish = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch {
        // ignore
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#201d1d] border border-amber-500/40 w-full max-w-sm rounded-none p-5 text-white font-mono text-xs flex flex-col gap-4 animate-fade-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <HelpCircle size={15} />
            <span>[{gameTitle} {isKo ? '가이드' : 'Guide'}]</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {currentStep} / {activeSteps.length}
          </span>
        </div>

        {/* Step Content */}
        <div className="py-2 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <span>{activeSteps[currentStep - 1].title}</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px] bg-black/40 p-3 border border-white/5 rounded-xs">
            {activeSteps[currentStep - 1].desc}
          </p>

          {/* Infographic Visual Placeholder */}
          <div className="w-full h-24 bg-slate-900 border border-amber-500/20 flex flex-col items-center justify-center gap-1.5 text-[10px] text-amber-200">
            {currentStep === 1 && <Target size={28} className="text-amber-400" />}
            {currentStep === 2 && <Zap size={28} className="text-cyan-400 animate-pulse" />}
            {currentStep === 3 && <Trophy size={28} className="text-amber-400 animate-bounce" />}
            <span className="text-[9px] text-slate-400">
              {currentStep === 2 ? (isKo ? '👆 당겨서 조준 ➔ 손 떼서 발사' : 'Pull ➔ Aim ➔ Release') : (isKo ? '100% 모바일 원핸드 지원' : '100% One-Thumb Mobile')}
            </span>
          </div>
        </div>

        {/* Don't show again checkbox */}
        <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="rounded-none accent-amber-500"
          />
          <span>{isKo ? '다시 보지 않기 (상시 ❓ 버튼으로 재확인 가능)' : "Don't show again (Access via '?' button)"}</span>
        </label>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          {currentStep < activeSteps.length ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black text-xs rounded-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>{isKo ? '다음 단계' : 'Next'}</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black text-xs rounded-sm transition-colors"
            >
              {isKo ? '게임 시작하기' : 'Start Game'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
