import React, { useState, useEffect } from 'react';
import { 
  isDemoPlayActive, 
  getDemoPlayStep, 
  stopDemoPlay, 
  DEMO_PLAY_STEPS, 
  DemoPlayStep 
} from '../lib/demoPlayService';
import type { Language } from '../types';

interface DemoPlayHUDProps {
  onNavigate: (view: string) => void;
  language: Language;
}

export const DemoPlayHUD: React.FC<DemoPlayHUDProps> = ({
  onNavigate,
  language
}) => {
  const [active, setActive] = useState<boolean>(() => isDemoPlayActive());
  const [currentStep, setCurrentStep] = useState<DemoPlayStep>(() => getDemoPlayStep());

  useEffect(() => {
    const handleActiveChange = (e: Event) => {
      const ce = e as CustomEvent<{ active: boolean; step?: DemoPlayStep }>;
      setActive(ce.detail?.active ?? isDemoPlayActive());
      if (ce.detail?.step) {
        setCurrentStep(ce.detail.step);
      }
    };

    const handleStepChange = (e: Event) => {
      const ce = e as CustomEvent<{ step: DemoPlayStep }>;
      if (ce.detail?.step) {
        setCurrentStep(ce.detail.step);
      }
    };

    window.addEventListener('snshero_demo_play_changed', handleActiveChange as EventListener);
    window.addEventListener('snshero_demo_play_step_changed', handleStepChange as EventListener);

    return () => {
      window.removeEventListener('snshero_demo_play_changed', handleActiveChange as EventListener);
      window.removeEventListener('snshero_demo_play_step_changed', handleStepChange as EventListener);
    };
  }, []);

  if (!active) return null;

  const handleStop = () => {
    stopDemoPlay(onNavigate);
  };

  return (
    <aside 
      className="fixed top-0 left-0 right-0 z-[99999] bg-[#fdfcfc] text-[#201d1d] border-b border-[#0f0000]/12 shadow-sm font-mono select-none pointer-events-auto"
      role="banner"
      aria-label="Demo Play HUD"
    >
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2 text-[11px] sm:text-xs">
        {/* 데모 타이틀 & 현재 단계 순환 트랙 */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar shrink min-w-0">
          <span className="shrink-0 font-bold bg-[#201d1d] text-[#fdfcfc] px-1.5 py-0.5 rounded-sm tracking-wider uppercase flex items-center gap-1 text-[10px] sm:text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            DEMO
          </span>

          <nav className="flex items-center gap-1 shrink-0 text-[10px] sm:text-[11px]" aria-label="Demo play steps">
            {DEMO_PLAY_STEPS.map((s, idx) => {
              const isCurrent = currentStep === s.id;
              return (
                <React.Fragment key={s.id}>
                  <span 
                    className={`px-1.5 py-0.5 transition-colors duration-150 rounded-sm ${
                      isCurrent
                        ? 'bg-emerald-600 text-white font-bold border border-emerald-700 shadow-xs'
                        : 'text-[#201d1d]/60 font-medium'
                    }`}
                  >
                    {language === 'ko' ? s.labelKo : s.labelEn}
                  </span>
                  {idx < DEMO_PLAY_STEPS.length - 1 && (
                    <span className="text-[#201d1d]/30 text-[9px]">➔</span>
                  )}
                </React.Fragment>
              );
            })}
            <span className="text-[#201d1d]/30 text-[9px]">➔ 🔄</span>
          </nav>
        </div>

        {/* 데모플레이 종료 액션 */}
        <button
          onClick={handleStop}
          className="shrink-0 min-h-[30px] min-w-[70px] px-2.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-500/30 font-bold rounded-sm transition-all text-[11px] flex items-center justify-center gap-1 cursor-pointer"
          title={language === 'ko' ? '데모플레이를 중지하고 홈으로 복귀합니다' : 'Exit demo play and return home'}
        >
          <span>✕</span>
          <span>{language === 'ko' ? '중지' : 'Exit'}</span>
        </button>
      </div>
    </aside>
  );
};
