import React, { useState, useEffect, useRef } from 'react';
import { Swords, X, Sparkles, Compass } from 'lucide-react';
import { 
  getActiveTourFeature, 
  endDemoTour, 
  DemoTourFeature 
} from '../lib/smartLoopTourService';
import type { Language } from '../types';

interface SmartLoopTourHUDProps {
  currentView: string;
  onNavigate: (view: string) => void;
  language: Language;
}

export const SmartLoopTourHUD: React.FC<SmartLoopTourHUDProps> = ({
  currentView,
  onNavigate,
  language
}) => {
  const [feature, setFeature] = useState<DemoTourFeature | null>(() => getActiveTourFeature(currentView));
  const totalDurationMs = 4000;
  const [remainingMs, setRemainingMs] = useState<number>(totalDurationMs);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasEndedRef = useRef<boolean>(false);

  useEffect(() => {
    const handleTourStart = (e: Event) => {
      const customEvent = e as CustomEvent<DemoTourFeature>;
      if (customEvent.detail) {
        setFeature(customEvent.detail);
        setRemainingMs(totalDurationMs);
        hasEndedRef.current = false;
      }
    };

    window.addEventListener('snshero_demo_tour_start', handleTourStart as EventListener);
    return () => {
      window.removeEventListener('snshero_demo_tour_start', handleTourStart as EventListener);
    };
  }, []);

  useEffect(() => {
    // 뷰가 변경되었을 때 메타데이터 동기화
    const currentFeature = getActiveTourFeature(currentView);
    if (currentFeature) {
      setFeature(currentFeature);
    }
  }, [currentView]);

  useEffect(() => {
    hasEndedRef.current = false;
    const interval = 100;

    timerRef.current = setInterval(() => {
      setRemainingMs(prev => {
        const next = prev - interval;
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            setTimeout(() => {
              endDemoTour(onNavigate, false);
            }, 50);
          }
          return 0;
        }
        return next;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onNavigate, currentView]);

  if (!feature) return null;

  const title = language === 'ko' ? feature.titleKo : feature.titleEn;
  const desc = language === 'ko' ? feature.descKo : feature.descEn;
  const remainingSec = (remainingMs / 1000).toFixed(1);
  const progressPercent = Math.max(0, Math.min(100, (remainingMs / totalDurationMs) * 100));

  const handleReturnNow = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    hasEndedRef.current = true;
    endDemoTour(onNavigate, false);
  };

  const handleStopTour = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    hasEndedRef.current = true;
    endDemoTour(onNavigate, true);
  };

  return (
    <div 
      className="fixed top-2 sm:top-3.5 left-1/2 -translate-x-1/2 z-[99998] w-[94%] max-w-md sm:max-w-lg select-none font-mono animate-in fade-in slide-in-from-top-3 duration-200"
      role="region"
      aria-label="SNSHero Feature Demo Tour HUD"
    >
      <div className="bg-[#fdfcfc] text-[#201d1d] border-2 border-[#201d1d] rounded-none shadow-2xl p-3 sm:p-3.5 flex flex-col gap-2 relative">
        {/* Top Header Row */}
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-[#201d1d] text-[#fdfcfc] rounded-xs text-[10px] font-black shrink-0">
              <Compass size={12} className="animate-spin-slow" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-tight text-[#201d1d] truncate">
              [🌐 {language === 'ko' ? '기능 데모 투어' : 'FEATURE TOUR'}]
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded-xs uppercase shrink-0">
              {feature.badge}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-xs animate-pulse">
              ⏱ {remainingSec}s
            </span>
          </div>
        </div>

        {/* Feature Title & Description */}
        <div className="flex flex-col gap-0.5">
          <div className="text-xs sm:text-sm font-black text-[#201d1d] flex items-center gap-1">
            <Sparkles size={13} className="text-amber-500 fill-current shrink-0" />
            <span className="truncate">{title}</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#646262] leading-tight line-clamp-2">
            {desc}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[#e2e0e0] overflow-hidden rounded-none border border-[rgba(15,0,0,0.08)]">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 via-indigo-600 to-cyan-500 transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-[rgba(15,0,0,0.08)]">
          <button
            onClick={handleReturnNow}
            className="flex-1 py-1.5 px-2 bg-[#201d1d] hover:bg-[#383333] active:scale-95 text-[#fdfcfc] font-black text-[11px] rounded-xs border border-[#201d1d] transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[36px]"
          >
            <Swords size={13} />
            <span>[{language === 'ko' ? '지금 바로 랭킹대전 복귀' : 'Back to Rank Match'}]</span>
          </button>
          
          <button
            onClick={handleStopTour}
            className="py-1.5 px-2 bg-[#fdfcfc] hover:bg-[#f1eeee] active:scale-95 text-[#646262] hover:text-[#201d1d] font-bold text-[10px] rounded-xs border border-[rgba(15,0,0,0.2)] transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 min-h-[36px]"
            title={language === 'ko' ? '자동 데모를 멈추고 이 화면에 머뭅니다' : 'Stop tour and stay here'}
          >
            <X size={12} />
            <span>[{language === 'ko' ? '머물기' : 'Stay'}]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
