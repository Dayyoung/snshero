/**
 * BossRaidTutorialModal.tsx
 * 3D 보스 레이드/격투 미션 대상 3단계 패링&회피 타이밍 튜토리얼 팝업 및 상시 ❓ 가이드
 * (구글 스프레드시트 Row 957 / ID 553 요구사항 구현)
 */

import React, { useState, useEffect } from 'react';
import { Shield, Zap, Gift, X, HelpCircle, Check } from 'lucide-react';
import { Language } from '../types';

interface BossRaidTutorialModalProps {
  gameId: string;
  gameTitle: string;
  language?: Language;
  onClose: () => void;
  isOpen?: boolean;
}

export const BossRaidTutorialModal: React.FC<BossRaidTutorialModalProps> = ({
  gameId,
  gameTitle,
  language = 'ko',
  onClose,
  isOpen = true,
}) => {
  const isKo = language === 'ko';
  const STORAGE_KEY = `hero_boss_tutorial_skip_${gameId}`;

  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const skipped = localStorage.getItem(STORAGE_KEY) === 'true';
      if (!skipped) {
        setVisible(true);
      }
    } else {
      setVisible(false);
    }
  }, [isOpen, STORAGE_KEY]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setVisible(false);
    onClose();
  };

  const handleOpenManually = () => {
    setCurrentStep(1);
    setVisible(true);
  };

  if (!visible) {
    return (
      <button
        onClick={handleOpenManually}
        aria-label="보스 공략 튜토리얼 가이드 열기"
        className="fixed top-3 right-3 z-30 flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold bg-[#fdfcfc]/90 dark:bg-[#181616]/90 text-[#201d1d] dark:text-[#fdfcfc] border border-[rgba(15,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] rounded-sm active:scale-95 shadow-none transition-all"
      >
        <HelpCircle size={14} className="stroke-[2.2]" />
        <span>{isKo ? '❓ 보스 공략' : '❓ Boss Guide'}</span>
      </button>
    );
  }

  const STEPS = [
    {
      step: 1,
      title: isKo ? 'STEP 1: 보스 약점 부위 파괴' : 'STEP 1: Boss Weakpoint Break',
      icon: Shield,
      color: 'text-amber-500',
      descKo: '보스 몸체에 빛나는 약점 부위(코어/뿔/날개)를 집중 타격하세요. 부위 파괴 시 보스가 그로기 상태에 빠지며 300% 추가 피해가 들어갑니다.',
      descEn: 'Focus attacks on glowing weak points (Core/Horn/Wing). Breaking parts inflicts groggy state with 300% bonus damage.',
      badge: '[약점 집중 타격]',
    },
    {
      step: 2,
      title: isKo ? 'STEP 2: 0.2초 패링 & 회피 윈도우' : 'STEP 2: 0.2s Parry & Dodge Window',
      icon: Zap,
      color: 'text-rose-500',
      descKo: '보스 눈빛이 붉게 번쩍일 때 화면을 터치하면 [0.2초 저스트 패링]이 발동되어 무적 반격합니다. 급박할 때는 더블탭으로 360도 구르기 회피하세요.',
      descEn: 'Tap screen right as the boss flashes red for a 0.2s Just Parry counter. Double-tap to execute invulnerable dodge roll.',
      badge: '[원터치 패링 / 더블탭 회피]',
    },
    {
      step: 3,
      title: isKo ? 'STEP 3: 확정 SNS 보상 & 보너스' : 'STEP 3: Guaranteed SNS Rewards',
      icon: Gift,
      color: 'text-emerald-500',
      descKo: '미션 클리어 즉시 분당 50 SNS 포인트 기준 보상이 지갑으로 원자적 입금됩니다. 무피격 3스타 달성 시 최대 130% 보너스가 가산됩니다.',
      descEn: 'Clear grants normalized 50P/min SNS Point deposits immediately. Flawless 3-star victory adds up to 130% bonus.',
      badge: '[100% 확정 입금 + 130% 보너스]',
    },
  ];

  const currentStepData = STEPS[currentStep - 1];
  const StepIcon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs font-mono select-none">
      <div className="w-full max-w-sm bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d] dark:border-white rounded-none p-4 text-[#201d1d] dark:text-[#fdfcfc] flex flex-col gap-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] pb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black bg-[#201d1d] text-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#201d1d] px-1.5 py-0.5 rounded-sm">
              TUTORIAL
            </span>
            <span className="text-xs font-bold truncate max-w-[170px]">{gameTitle}</span>
          </div>
          <button
            onClick={handleClose}
            aria-label="닫기"
            className="p-1 text-[#6e6e73] hover:text-[#201d1d] dark:hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 진행 인디케이터 */}
        <div className="flex items-center gap-1 w-full">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className={`h-1 flex-1 rounded-none transition-all ${
                s.step === currentStep
                  ? 'bg-[#201d1d] dark:bg-[#fdfcfc]'
                  : s.step < currentStep
                  ? 'bg-emerald-500'
                  : 'bg-[rgba(15,0,0,0.1)] dark:bg-[rgba(255,255,255,0.1)]'
              }`}
            />
          ))}
        </div>

        {/* 본문 콘텐츠 */}
        <div className="flex flex-col items-center text-center gap-2 py-2">
          <div className="p-3 bg-[rgba(15,0,0,0.03)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(15,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-sm">
            <StepIcon size={32} className={`${currentStepData.color} stroke-[2.2]`} />
          </div>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
            {currentStepData.badge}
          </span>
          <h3 className="text-sm font-black tracking-tight">{currentStepData.title}</h3>
          <p className="text-xs text-[#555] dark:text-[#ccc] leading-relaxed px-1">
            {isKo ? currentStepData.descKo : currentStepData.descEn}
          </p>
        </div>

        {/* 하단 제어 및 다시 보지 않기 */}
        <div className="flex flex-col gap-2 pt-1 border-t border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)]">
          <label className="flex items-center gap-1.5 text-[11px] text-[#777] dark:text-[#aaa] cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="accent-[#201d1d] dark:accent-[#fdfcfc]"
            />
            <span>{isKo ? '다시 보지 않기' : "Don't show again"}</span>
          </label>

          <div className="flex gap-2">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex-1 py-2 text-xs font-bold border border-[rgba(15,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] rounded-sm hover:bg-black/5 dark:hover:bg-white/5 active:scale-98"
              >
                {isKo ? '이전' : 'Prev'}
              </button>
            )}
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="flex-1 py-2 text-xs font-bold bg-[#201d1d] text-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#201d1d] rounded-sm active:scale-98"
              >
                {isKo ? '다음 단계 →' : 'Next →'}
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-black bg-emerald-600 text-white rounded-sm active:scale-98"
              >
                <Check size={14} className="stroke-[3]" />
                <span>{isKo ? '전투 개시!' : 'Battle Start!'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
