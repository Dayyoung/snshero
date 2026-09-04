/**
 * ArcadeMissionTutorial.tsx
 * 3D 아케이드 미션 대상 3단계 탄도각 조준 튜토리얼 팝업 & 상시 ❓ 가이드 모달
 * (구글 스프레드시트 Row 861 / ID 553 요구사항 구현)
 */

import React, { useState } from 'react';
import { HelpCircle, ArrowRight, CheckCircle2, Crosshair, Sparkles, Coins } from 'lucide-react';
import { Language } from '../types';

interface ArcadeMissionTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  title: string;
  gameId: string;
}

export const ArcadeMissionTutorial: React.FC<ArcadeMissionTutorialProps> = ({
  isOpen,
  onClose,
  language,
  title,
  gameId,
}) => {
  const [step, setStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const isKo = language === 'ko';

  if (!isOpen) return null;

  const storageKey = `hero_tutorial_arcade_${gameId}`;

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

  const STEPS = [
    {
      step: 1,
      badge: isKo ? 'STEP 1: 목표 및 반사/파쇄 룰' : 'STEP 1: OBJECTIVE & BOUNCE RULES',
      title: isKo ? '타깃 파쇄 및 도탄 물리' : 'Target Shattering & Wall Ricochet',
      desc: isKo
        ? '발사체가 벽과 장애물에 부딪히며 각도에 따라 반사됩니다. 동일 색상 타깃을 연속 파쇄하세요.'
        : 'Projectiles ricochet off walls according to physics angles. Break consecutive color targets.',
      icon: Crosshair,
    },
    {
      step: 2,
      badge: isKo ? 'STEP 2: 100% 퓨어 터치 조준' : 'STEP 2: PURE TOUCH AIMING',
      title: isKo ? '화면 드래그 조준선 & 손 떼어 발사' : 'Drag Trajectory & Release to Fire',
      desc: isKo
        ? '가상 D-패드 없이 스마트폰 화면을 터치하여 당기면 반사 궤적이 표시되고, 손을 떼면 즉시 발사됩니다.'
        : 'Touch and pull anywhere on the screen to view reflection lines, and release to shoot.',
      icon: Sparkles,
    },
    {
      step: 3,
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED SNS REWARD',
      title: isKo ? '콤보 배수 및 원자적 지갑 입금' : 'Combo Multipliers & Atomic Wallet Credit',
      desc: isKo
        ? '연속 파쇄 콤보 보너스와 플레이 시간 비례(분당 50P) 확정 SNS 포인트가 즉시 지갑에 정산됩니다.'
        : 'Earn standardized SNS Points plus combo multipliers credited atomically upon clear.',
      icon: Coins,
    },
  ];

  const current = STEPS[step - 1];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-[#fdfcfc] text-[#201d1d] w-full max-w-sm border border-[rgba(15,0,0,0.15)] rounded-none shadow-2xl p-5 flex flex-col justify-between max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.1)] pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-amber-600" />
            <h3 className="font-bold text-sm tracking-tight text-[#201d1d] truncate max-w-[200px]">{title}</h3>
          </div>
          <span className="text-[11px] text-[#6e6e73]">
            {step} / 3
          </span>
        </div>

        {/* Content Body */}
        <div className="py-6 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-none bg-[#f4f2ee] border border-[rgba(15,0,0,0.1)] flex items-center justify-center text-amber-700">
            <Icon size={28} />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
              {current.badge}
            </span>
            <h4 className="font-bold text-base text-[#201d1d]">{current.title}</h4>
          </div>

          <p className="text-xs text-[#555] leading-relaxed max-w-xs">
            {current.desc}
          </p>
        </div>

        {/* Footer & Actions */}
        <div className="space-y-3 pt-3 border-t border-[rgba(15,0,0,0.1)]">
          <label className="flex items-center justify-center gap-2 text-xs text-[#6e6e73] cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded-none accent-amber-700"
            />
            <span>{isKo ? '다시 보지 않기' : 'Do not show again'}</span>
          </label>

          <div className="flex gap-2">
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="w-full py-2.5 bg-[#201d1d] hover:bg-black text-[#fdfcfc] font-bold text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{isKo ? '다음 단계' : 'Next Step'}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>{isKo ? '게임 시작하기' : 'Start Game'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
