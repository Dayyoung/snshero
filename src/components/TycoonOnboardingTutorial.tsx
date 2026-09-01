/**
 * TycoonOnboardingTutorial.tsx
 * 3D 타이쿤/경영 미션(공장/카페/벌목) 3단계 인터랙티브 생산 튜토리얼 팝업 & 상시 가이드
 * (구글 스프레드시트 Row 724 / ID 565 요구사항 구현)
 */

import React, { useState } from 'react';
import { HelpCircle, ArrowRight, Pickaxe, Truck, Coins } from 'lucide-react';

interface TycoonOnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  tycoonTitle: string;
  storageKey: string;
}

export const TycoonOnboardingTutorial: React.FC<TycoonOnboardingTutorialProps> = ({
  isOpen,
  onClose,
  language = 'ko',
  tycoonTitle,
  storageKey
}) => {
  const [step, setStep] = useState<number>(1);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const isKo = language === 'ko';

  if (!isOpen) return null;

  const STEPS = [
    {
      title: isKo ? '1. 자원 거점 접근 & 자동 채집' : '1. Auto Proximity Gathering',
      desc: isKo ? '캐릭터를 자원 구역(목재/원두/광석) 근처로 이동하면 자동으로 자원을 채집하여 인벤토리에 보관합니다.' : 'Move your character near resource spots to automatically gather and store items.',
      icon: Pickaxe
    },
    {
      title: isKo ? '2. 가공 시설 운반 & 자동 납품' : '2. Factory Delivery & Crafting',
      desc: isKo ? '채집한 원자재를 가공/판매 구역으로 가져가면 자동으로 완제품으로 전환되어 수익이 누적됩니다.' : 'Carry raw materials to delivery zones to process them into finished goods.',
      icon: Truck
    },
    {
      title: isKo ? '3. 분당 50P 표준 확정 SNS 보상' : '3. Guaranteed SNS Payouts',
      desc: isKo ? '누적 생산량과 운영 시간에 비례하여 100% 확정 SNS 포인트가 유저 지갑으로 즉시 입금됩니다.' : 'Earn guaranteed SNS points atomically deposited based on production efficiency.',
      icon: Coins
    }
  ];

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

  const currentInfo = STEPS[step - 1];
  const IconComp = currentInfo.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 font-mono select-none backdrop-blur-xs">
      <div className="bg-[#201d1d] text-white border border-amber-500/40 w-full max-w-sm p-5 flex flex-col gap-4 rounded-none shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
            <HelpCircle size={15} />
            <span>[{tycoonTitle} {isKo ? '경영 가이드' : 'Guide'}]</span>
          </div>
          <span className="text-[10px] text-slate-400">{step}/3</span>
        </div>

        {/* Step Body */}
        <div className="flex flex-col gap-3 py-1">
          <h4 className="text-amber-300 font-bold text-xs flex items-center gap-1.5">
            <IconComp size={16} className="text-amber-400" />
            <span>{currentInfo.title}</span>
          </h4>
          <p className="text-[11px] text-slate-300 bg-black/40 p-3 border border-white/5 leading-relaxed">
            {currentInfo.desc}
          </p>

          <div className="w-full h-20 bg-slate-900 border border-amber-500/20 flex flex-col items-center justify-center text-amber-300 text-[10px] gap-1">
            <IconComp size={24} className="animate-bounce text-amber-400" />
            <span className="text-slate-400 text-[9px]">
              {isKo ? '100% 모바일 퓨어 제스처 조작' : '100% Mobile Pure Gestures'}
            </span>
          </div>
        </div>

        {/* Don't show again */}
        <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="rounded-none accent-amber-500"
          />
          <span>{isKo ? '다시 보지 않기 (상시 ❓ 버튼 제공)' : "Don't show again (Access via '?')"}</span>
        </label>

        {/* Buttons */}
        <div className="pt-1">
          {step < 3 ? (
            <button
              onClick={() => setStep(prev => prev + 1)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>{isKo ? '다음 단계' : 'Next'}</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-sm transition-colors cursor-pointer"
            >
              {isKo ? '경영 시작하기' : 'Start Tycoon'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
