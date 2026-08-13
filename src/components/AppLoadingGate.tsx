import React, { useState, useEffect, useRef } from 'react';
import { resetAllCaches, getCacheVersionTimestamp } from '../lib/cacheManager';

interface AppLoadingGateProps {
  language: 'ko' | 'en' | string;
  onComplete: () => void;
}

export const AppLoadingGate: React.FC<AppLoadingGateProps> = ({ language, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState<number>(3.0);
  const [progress, setProgress] = useState<number>(0);
  const [isCacheReset, setIsCacheReset] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const TOTAL_DURATION = 100; // Ultra fast boot gate (0.1s)

  useEffect(() => {
    try {
      sessionStorage.setItem('hero_boot_gate_shown', 'true');
    } catch {
      // ignore
    }

    setStatusMessage(
      language === 'ko'
        ? '로컬 캐시 리소스 검증 완료'
        : 'Local cached resources verified'
    );

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, (TOTAL_DURATION - elapsed) / 1000);
      const currentProgress = Math.min(100, (elapsed / TOTAL_DURATION) * 100);

      setTimeLeft(remaining);
      setProgress(currentProgress);

      if (elapsed >= TOTAL_DURATION) {
        clearInterval(interval);
        setFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 50);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [language, onComplete]);

  const handleResetCache = () => {
    const result = resetAllCaches();
    setIsCacheReset(true);
    setStatusMessage(
      language === 'ko'
        ? `[성공] 캐시 초기화 완료! (${result.clearedCount}개 삭제) 최신 리소스를 재로드합니다.`
        : `[SUCCESS] Cache cleared! (${result.clearedCount} items) Reloading fresh resources.`
    );
  };

  const cacheTs = getCacheVersionTimestamp();

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col justify-between p-6 sm:p-12 transition-opacity duration-300 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ userSelect: 'none' }}
    >
      {/* 상단 헤더 / 시스템 타이틀 */}
      <div className="flex justify-between items-center border-b border-[#201d1d]/20 pb-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 bg-[#201d1d] animate-pulse"></span>
          <span className="text-sm font-bold tracking-tight">SNSHERO REVOLUTION SYSTEM GATE</span>
        </div>
        <div className="text-xs text-[#201d1d]/60">
          BUILD CACHE_TS: #{cacheTs.slice(-6)}
        </div>
      </div>

      {/* 중앙 메인 카운트다운 & 상태 영역 */}
      <div className="max-w-xl mx-auto w-full flex flex-col items-center justify-center my-auto space-y-8 text-center">
        {/* 타이틀 및 카운트다운 숫자 */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-widest text-[#201d1d]/60 font-semibold">
            {language === 'ko' ? '[시스템 초기 접속 제어]' : '[INITIAL SYSTEM BOOT GATE]'}
          </div>
          <div className="text-5xl sm:text-6xl font-black tracking-tighter">
            {timeLeft.toFixed(1)}<span className="text-2xl font-normal ml-1">s</span>
          </div>
        </div>

        {/* 프로그레스 바 (ASCII 스타일 + 하드 1px 보더) */}
        <div className="w-full space-y-2">
          <div className="w-full h-4 border border-[#201d1d] p-0.5 bg-[#fdfcfc]">
            <div
              className="h-full bg-[#201d1d] transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-semibold text-[#201d1d]/70">
            <span>0%</span>
            <span>{Math.round(progress)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 상태 메시지 브리핑 */}
        <div className="w-full bg-[#201d1d]/5 border border-[#201d1d]/20 p-3.5 text-xs text-left font-mono min-h-[52px] flex items-center">
          <span className="mr-2 text-[#201d1d] font-bold">&gt;</span>
          <span className="leading-relaxed">{statusMessage}</span>
        </div>

        {/* 캐싱 초기화 액션 버튼 */}
        <div className="w-full pt-2 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleResetCache}
            disabled={isCacheReset}
            className={`w-full py-3 px-4 border-2 border-[#201d1d] text-xs font-bold transition-all ${
              isCacheReset
                ? 'bg-[#201d1d]/10 text-[#201d1d]/50 border-[#201d1d]/30 cursor-not-allowed'
                : 'bg-[#fdfcfc] text-[#201d1d] hover:bg-[#201d1d] hover:text-[#fdfcfc] active:scale-[0.99] cursor-pointer'
            }`}
          >
            {isCacheReset
              ? (language === 'ko' ? '[x] 캐시 초기화 진행 완료' : '[x] CACHE RESET COMPLETED')
              : (language === 'ko' ? '[RESTART] 캐싱 초기화 (전체 리소스 새로고침)' : '[RESTART] RESET CACHE (RELOAD ALL RESOURCES)')
            }
          </button>
          
          <p className="text-[11px] text-[#201d1d]/60 leading-tight">
            {language === 'ko'
              ? '* 버튼을 누르지 않으면 로컬 캐시 모드로 429 요청 제한 없이 빠르게 접속합니다.'
              : '* Without reset, boots instantly in local cache mode to prevent 429 rate limit errors.'
            }
          </p>
        </div>
      </div>

      {/* 하단 푸터 */}
      <div className="border-t border-[#201d1d]/20 pt-4 flex justify-between items-center text-[11px] text-[#201d1d]/60">
        <div>STATUS: {isCacheReset ? 'FRESH_RESOURCES' : 'CACHE_PRESERVED'}</div>
        <div>OPENCODE MONOSPACE DESIGN SYSTEM</div>
      </div>
    </div>
  );
};
