/**
 * TycoonTutorialModal.tsx
 * 포션/카페/공장/크레인 타이쿤 미션 대상 3단계 인터랙티브 온보딩 가이드 표준화
 * (구글 스프레드시트 Row 808 / ID 561 요구사항 구현)
 */

import React, { useState } from 'react';
import { HelpCircle, ArrowRight, CheckCircle2, Factory, Sparkles, Coins } from 'lucide-react';
import { Language } from '../types';

interface TycoonTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  title: string;
  gameId: string;
}

export const TycoonTutorialModal: React.FC<TycoonTutorialModalProps> = ({
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

  const storageKey = `hero_tutorial_tycoon_${gameId}`;

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
      badge: isKo ? 'STEP 1: 목표 생산량 & 자원 루프' : 'STEP 1: PRODUCTION & LOOPS',
      title: isKo ? '자원 채집 및 공정 자동화' : 'Resource Gathering & Flow',
      desc: isKo
        ? '화면의 자원 구역을 탭하거나 슬라이드하여 원자재를 수확하고 제조 시설로 즉시 운반하세요.'
        : 'Tap or slide resources to harvest raw materials and route them into manufacturing units.',
      icon: Factory,
    },
    {
      step: 2,
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '가상 버튼 0개 ➔ 100% 터치 & 드래그' : 'Zero Buttons: Direct Touch & Drag',
      desc: isKo
        ? '복잡한 가상 D-패드 없이 스마트폰 화면을 직접 터치/스와이프하여 물류를 운반하고 조합합니다.'
        : 'Interact directly with items using single-finger drags and proximity drops.',
      icon: Sparkles,
    },
    {
      step: 3,
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '생산 효율 비례 원자적 지갑 입금' : 'Atomic Wallet Settlement',
      desc: isKo
        ? '달성한 완성품 수량과 운영 시간에 비례하여 분당 50P 기준 확정 SNS 포인트가 입금됩니다.'
        : 'Earn standardized SNS Points atomically credited to your permanent wallet on completion.',
      icon: Coins,
    },
  ];

  const currentInfo = STEPS[step - 1];
  const Icon = currentInfo.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-[#fdfcfc] text-[#201d1d] w-full max-w-sm border border-[rgba(15,0,0,0.15)] rounded-none shadow-2xl p-5 flex flex-col justify-between max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.1)] pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-cyan-700" />
            <h3 className="font-bold text-sm tracking-tight text-[#201d1d]">{title}</h3>
          </div>
          <span className="text-[11px] text-[#6e6e73]">
            {step} / 3
          </span>
        </div>

        {/* Content Body */}
        <div className="py-6 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-none bg-[#f2f0ed] border border-[rgba(15,0,0,0.1)] flex items-center justify-center text-cyan-800">
            <Icon size={28} />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-cyan-700 tracking-wider">
              {currentInfo.badge}
            </span>
            <h4 className="font-bold text-base text-[#201d1d]">{currentInfo.title}</h4>
          </div>

          <p className="text-xs text-[#555] leading-relaxed max-w-xs">
            {currentInfo.desc}
          </p>
        </div>

        {/* Footer & Actions */}
        <div className="space-y-3 pt-3 border-t border-[rgba(15,0,0,0.1)]">
          <label className="flex items-center justify-center gap-2 text-xs text-[#6e6e73] cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded-none accent-cyan-700"
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
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>{isKo ? '생산 시작하기' : 'Start Tycoon'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
