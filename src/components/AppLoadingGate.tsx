import React, { useState, useEffect, useRef } from 'react';
import { checkAndSyncAppVersion, getLocalAppVersion, forcePurgeAndReload, VersionCheckResult } from '../lib/versionManager';
import { getCacheVersionTimestamp } from '../lib/cacheManager';

interface AppLoadingGateProps {
  language: 'ko' | 'en' | string;
  onComplete: () => void;
}

export const AppLoadingGate: React.FC<AppLoadingGateProps> = ({ language, onComplete }) => {
  const [progress, setProgress] = useState<number>(10);
  const [statusMessage, setStatusMessage] = useState<string>(
    language === 'ko' ? '[CHECK] 서버 최신 버전 검증 중...' : '[CHECK] Verifying latest system version...'
  );
  const [stepDetail, setStepDetail] = useState<string>('INIT_CHECK');
  const [versionResult, setVersionResult] = useState<VersionCheckResult | null>(null);
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [isManualResetting, setIsManualResetting] = useState<boolean>(false);

  const localVersion = getLocalAppVersion() || '2.0.0';
  const cacheTs = getCacheVersionTimestamp();
  const completedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function runVersionCheckSequence() {
      // 1. 버전 확인 단계 (Progress: 35%)
      setProgress(35);
      setStepDetail('FETCHING_API_VERSION');
      setStatusMessage(
        language === 'ko'
          ? '[API] /api/version 최신 빌드 버전 조회 중...'
          : '[API] Querying latest build from /api/version...'
      );

      // 최소한의 자연스러운 UI 반응 시간 보장 (150ms)
      await new Promise(r => setTimeout(r, 150));

      const result = await checkAndSyncAppVersion();
      if (!isMounted) return;

      setVersionResult(result);

      if (result.isUpdated) {
        // 2. 버전 불일치 -> 캐시 초기화 진행 (Progress: 75%)
        setProgress(75);
        setStepDetail('PURGING_STALE_CACHES');
        setStatusMessage(
          language === 'ko'
            ? `[UPDATE] 신규 버전 감지 (v${result.oldVersion || 'none'} → v${result.newVersion})! 오래된 캐시 ${result.clearedItemsCount}개 정리 완료.`
            : `[UPDATE] New version detected (v${result.oldVersion || 'none'} → v${result.newVersion})! Purged ${result.clearedItemsCount} cached items.`
        );

        await new Promise(r => setTimeout(r, 450));
      } else {
        // 2. 최신 버전 일치 (Progress: 75%)
        setProgress(75);
        setStepDetail('VERSION_MATCHED');
        setStatusMessage(
          language === 'ko'
            ? `[VERIFIED] 최신 버전 (v${result.newVersion}) 확인 완료. 리소스를 준비합니다.`
            : `[VERIFIED] Latest version (v${result.newVersion}) confirmed. Preparing assets.`
        );

        await new Promise(r => setTimeout(r, 200));
      }

      if (!isMounted) return;

      // 3. 완료 및 전환 (Progress: 100%)
      setProgress(100);
      setStepDetail('BOOT_READY');
      setStatusMessage(
        language === 'ko'
          ? `[READY] 시스템 준비 완료 (v${result.newVersion}). 로비로 진입합니다.`
          : `[READY] System initialized (v${result.newVersion}). Launching lobby.`
      );

      // 약간의 지연 후 페이드아웃 및 메인 화면 전환
      setTimeout(() => {
        if (!isMounted) return;
        setFadingOut(true);
        setTimeout(() => {
          if (!completedRef.current) {
            completedRef.current = true;
            try {
              sessionStorage.setItem('hero_boot_gate_shown', 'true');
            } catch {
              // ignore
            }
            onComplete();
          }
        }, 250);
      }, 300);
    }

    runVersionCheckSequence();

    return () => {
      isMounted = false;
    };
  }, [language, onComplete]);

  const handleManualReset = () => {
    setIsManualResetting(true);
    setStatusMessage(
      language === 'ko'
        ? '[FORCE] 전체 캐시 강제 삭제 및 새로고침 실행 중...'
        : '[FORCE] Purging all caches and reloading fresh bundle...'
    );
    setTimeout(() => {
      forcePurgeAndReload();
    }, 200);
  };

  return (
    <div
      id="app-loading-gate"
      className={`fixed inset-0 z-[999999] bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col justify-between p-6 sm:p-12 transition-opacity duration-300 ${
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
        <div className="text-xs text-[#201d1d]/60 flex items-center gap-3">
          <span>LOCAL_VER: v{versionResult?.newVersion || localVersion}</span>
          <span>BUILD_TS: #{cacheTs.slice(-6)}</span>
        </div>
      </div>

      {/* 중앙 메인 상태 및 프로그레스 영역 */}
      <div className="max-w-xl mx-auto w-full flex flex-col items-center justify-center my-auto space-y-6 text-center">
        {/* 시스템 모드 배지 & 타이틀 */}
        <div className="space-y-2">
          <div className="inline-block border border-[#201d1d] px-2.5 py-0.5 text-[11px] font-bold tracking-widest uppercase bg-[#201d1d] text-[#fdfcfc]">
            {language === 'ko' ? '[시스템 시작 & 버전 동기화]' : '[SYSTEM STARTUP & VERSION SYNC]'}
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight">
            SNSHERO REVOLUTION
          </div>
          <div className="text-xs text-[#201d1d]/60 font-semibold tracking-wider">
            STEP: [{stepDetail}] • PROGRESS: {Math.round(progress)}%
          </div>
        </div>

        {/* ASCII/하드 보더 프로그레스 바 */}
        <div className="w-full space-y-1.5">
          <div className="w-full h-4 border border-[#201d1d] p-0.5 bg-[#fdfcfc]">
            <div
              className="h-full bg-[#201d1d] transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-semibold text-[#201d1d]/70">
            <span>0%</span>
            <span>VER: v{versionResult?.newVersion || localVersion}</span>
            <span>100%</span>
          </div>
        </div>

        {/* 상태 메시지 터미널 박스 */}
        <div className="w-full bg-[#201d1d]/5 border border-[#201d1d]/20 p-3.5 text-xs text-left font-mono min-h-[58px] flex items-center">
          <span className="mr-2 text-[#201d1d] font-bold">&gt;</span>
          <span className="leading-relaxed break-words">{statusMessage}</span>
        </div>

        {/* 수동 캐시 초기화 및 비상 리로드 옵션 */}
        <div className="w-full pt-2 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleManualReset}
            disabled={isManualResetting}
            className="w-full py-2.5 px-4 border border-[#201d1d] text-xs font-bold bg-[#fdfcfc] text-[#201d1d] hover:bg-[#201d1d] hover:text-[#fdfcfc] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isManualResetting
              ? (language === 'ko' ? '[...] 캐시 초기화 진행 중...' : '[...] RESETTING CACHE...')
              : (language === 'ko' ? '[RELOAD] 수동 캐싱 초기화 및 전체 새로고침' : '[RELOAD] MANUAL CACHE RESET & FRESH RELOAD')
            }
          </button>
          <p className="text-[11px] text-[#201d1d]/50 leading-tight">
            {language === 'ko'
              ? '* 시작 시 서버의 최신 버전(/api/version)을 자동 검사하여 변경 시에만 스마트 초기화합니다.'
              : '* Automatically verifies /api/version on boot and auto-purges cache only when updated.'
            }
          </p>
        </div>
      </div>

      {/* 하단 푸터 */}
      <div className="border-t border-[#201d1d]/20 pt-4 flex justify-between items-center text-[11px] text-[#201d1d]/60">
        <div>STATUS: {versionResult?.isUpdated ? 'CACHE_PURGED_FRESH' : 'VERSION_SYNCED'}</div>
        <div>OPENCODE MONOSPACE DESIGN SYSTEM</div>
      </div>
    </div>
  );
};
