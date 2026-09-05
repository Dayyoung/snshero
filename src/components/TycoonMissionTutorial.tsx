/**
 * TycoonMissionTutorial.tsx
 * 3D 타이쿤/경영 미션 대상 자원 수집 및 시설 건설 3단계 온보딩 튜토리얼 팝업 (design.md 준수)
 * (구글 스프레드시트 Row 897 / ID 553 요구사항 구현)
 */

import React, { useState } from 'react';
import { HelpCircle, ArrowRight, CheckCircle2, Pickaxe, Hammer, Coins } from 'lucide-react';
import { Language } from '../types';

interface TycoonMissionTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  title: string;
  gameId: string;
}

export const TycoonMissionTutorial: React.FC<TycoonMissionTutorialProps> = ({
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

  const storageKey = `hero_tutorial_tycoon_craft_${gameId}`;

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
      badge: isKo ? 'STEP 1: 근접 자동 자원 채취' : 'STEP 1: PROXIMITY HARVESTING',
      title: isKo ? '자원 노드 접근 시 자동 채집' : 'Auto-Gather Raw Materials',
      desc: isKo
        ? '벌목장, 광산 등 자원 노드 근처로 이동하면 추가 버튼 입력 없이 100% 자동 채취가 시작됩니다.'
        : 'Move close to timber or ore nodes to start automated hands-free harvesting.',
      icon: Pickaxe,
    },
    {
      step: 2,
      badge: isKo ? 'STEP 2: 건설 구역 자동 투입' : 'STEP 2: AUTOMATED STRUCTURE BUILDING',
      title: isKo ? '건설 부지 접근 시 자재 투입' : 'Proximity Construction Flow',
      desc: isKo
        ? '생산 시설 및 공장 건설 부지 안으로 이동하면 보유 중인 자재가 순차적으로 자동 투입되어 완성됩니다.'
        : 'Step into building zones to automatically deposit inventory materials and build facilities.',
      icon: Hammer,
    },
    {
      step: 3,
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED SNS REWARDS',
      title: isKo ? '목표 생산량 달성 즉시 원자적 정산' : 'Atomic Wallet Settlement',
      desc: isKo
        ? '목표 시설 완공 또는 퀘스트 달성 즉시 분당 50P 기준 확정 SNS 포인트가 유저 지갑으로 즉시 입금됩니다.'
        : 'Guaranteed SNS points atomically credited to your wallet upon production goal completion.',
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
            <HelpCircle size={18} className="text-emerald-700" />
            <h3 className="font-bold text-sm tracking-tight text-[#201d1d] truncate max-w-[200px]">{title}</h3>
          </div>
          <span className="text-[11px] text-[#6e6e73]">
            {step} / 3
          </span>
        </div>

        {/* Content Body */}
        <div className="py-6 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-none bg-[#f4f2ee] border border-[rgba(15,0,0,0.1)] flex items-center justify-center text-emerald-800">
            <Icon size={28} />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
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
              className="rounded-none accent-emerald-700"
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
                <span>{isKo ? '경영 시작하기' : 'Start Tycoon'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
