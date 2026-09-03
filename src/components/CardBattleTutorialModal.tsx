/**
 * CardBattleTutorialModal.tsx
 * 2D 카드 대전 속성 상성 및 콤보 캡처 3단계 인터랙티브 튜토리얼 오버레이
 * (구글 스프레드시트 Row 816 / ID 553 요구사항 구현)
 */

import React, { useState } from 'react';
import { HelpCircle, ArrowRight, CheckCircle2, ShieldAlert, Sparkles, Coins } from 'lucide-react';
import { Language } from '../types';

interface CardBattleTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const CardBattleTutorialModal: React.FC<CardBattleTutorialModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [step, setStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const isKo = language === 'ko';

  if (!isOpen) return null;

  const storageKey = 'hero_tutorial_card_battle_rules';

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
      badge: isKo ? 'STEP 1: 4대 원소 상성 (+2 파워)' : 'STEP 1: 4-ELEMENT ADVANTAGE (+2)',
      title: isKo ? '화 > 풍 > 지 > 수 > 화 상성 우위' : 'Fire > Wind > Earth > Water > Fire',
      desc: isKo
        ? '인접 카드 대치 시 상성 우위 속성은 공격력 +2 보너스를 받아 상대 카드를 손쉽게 뒤집을 수 있습니다.'
        : 'Attacking an element with advantage adds +2 power check bonus to capture opposing cards.',
      icon: ShieldAlert,
    },
    {
      step: 2,
      badge: isKo ? 'STEP 2: 연쇄 콤보 캡처 (Cascade Flips)' : 'STEP 2: COMBO CASCADE FLIPS',
      title: isKo ? '뒤집힌 카드가 인접 카드를 추가 포획' : 'Captured Cards Chain-Flip Enemies',
      desc: isKo
        ? '내 카드로 변환된 상대 카드는 즉시 주변 상대 카드를 추가 공격하여 연쇄 콤보 캡처를 일으킵니다.'
        : 'Newly captured cards immediately strike adjacent enemy cards for dynamic chain reactions.',
      icon: Sparkles,
    },
    {
      step: 3,
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '승리 및 소요 시간 비례 즉시 입금' : 'Atomic Wallet Settlement',
      desc: isKo
        ? '대전 종료 즉시 분당 50P 기준의 확정 SNS 포인트가 유저 로컬스토리지 지갑으로 즉시 정산됩니다.'
        : 'Guaranteed SNS points atomically deposited to your wallet based on duration and skill victory.',
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
            <h3 className="font-bold text-sm tracking-tight text-[#201d1d]">
              {isKo ? '2D 카드 배틀 룰 가이드' : 'Card Battle Rule Guide'}
            </h3>
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
                className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>{isKo ? '전장 진입하기' : 'Enter Arena'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
