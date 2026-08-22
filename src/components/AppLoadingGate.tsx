import React, { useState, useEffect, useRef } from 'react';
import { checkAndSyncAppVersion, getLocalAppVersion, forcePurgeAndReload, VersionCheckResult } from '../lib/versionManager';
import { getCacheVersionTimestamp } from '../lib/cacheManager';
import { X, ArrowRight, RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ViewType } from '../types';

interface AppLoadingGateProps {
  language: 'ko' | 'en' | string;
  currentView?: ViewType;
  onComplete: () => void;
}

const getViewTitle = (view?: ViewType, lang?: string) => {
  const isKo = lang === 'ko';
  switch (view) {
    case 'season-hub':
      return isKo ? '시즌 허브' : 'Season Hub';
    case 'web3-landing':
      return isKo ? 'Web3 SNSHero' : 'Web3 SNSHero';
    case 'referral':
      return isKo ? '추천인' : 'Referral';
    case 'boost':
      return isKo ? '부스트 상점' : 'Boost Shop';
    case 'policy-center':
      return isKo ? '신뢰 및 정책 센터' : 'Trust & Policy Center';
    case 'guild-list':
      return isKo ? '길드 목록' : 'Guild List';
    case 'playground':
      return isKo ? '플레이그라운드' : 'Playground';
    case 'stock-market':
      return isKo ? '주식 시장' : 'Stock Market';
    case 'card-marketplace':
      return isKo ? 'P2P 마켓' : 'P2P Marketplace';
    case 'prediction-market':
      return isKo ? '예측 시장' : 'Prediction Market';
    case 'share':
      return isKo ? '카드 공유' : 'Card Share';
    default:
      return isKo ? '메인 로비' : 'Main Lobby';
  }
};

export const AppLoadingGate: React.FC<AppLoadingGateProps> = ({
  language,
  currentView,
  onComplete,
}) => {
  const [progress, setProgress] = useState<number>(30);
  const [statusMessage, setStatusMessage] = useState<string>(
    language === 'ko' ? '[CHECK] 시스템 버전 검증 중...' : '[CHECK] Verifying system version...'
  );
  const [stepDetail, setStepDetail] = useState<string>('INIT_CHECK');
  const [versionResult, setVersionResult] = useState<VersionCheckResult | null>(null);
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [isManualResetting, setIsManualResetting] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const localVersion = getLocalAppVersion() || '2.1.0';
  const cacheTs = getCacheVersionTimestamp();
  const completedRef = useRef(false);

  const isSubpage = currentView && currentView !== 'home' && currentView !== 'main';
  const targetTitle = getViewTitle(currentView, language);

  // 즉시 닫기 및 완료 처리 헬퍼
  const dismissGate = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('hero_boot_gate_shown', 'true');
        localStorage.setItem('hero_boot_gate_shown', 'true');
      }
    } catch {
      // ignore
    }
    setFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 20);
  };

  useEffect(() => {
    let isMounted = true;

    // Subpage는 150ms, Root는 350ms 후 자동 무조건 진입 허용 (블로킹 완벽 차단)
    const safetyTimer = setTimeout(() => {
      if (isMounted && !completedRef.current) {
        dismissGate();
      }
    }, isSubpage ? 150 : 350);

    async function runVersionCheckSequence() {
      try {
        setProgress(70);
        setStepDetail('VERSION_CHECK');

        const result = await checkAndSyncAppVersion();
        if (!isMounted) return;

        setVersionResult(result);

        if (result.success) {
          setProgress(100);
          setStepDetail('BOOT_READY');
          setStatusMessage(
            language === 'ko'
              ? `[READY] 시스템 준비 완료 (v${result.newVersion}). ${targetTitle}(으)로 진입합니다.`
              : `[READY] System initialized (v${result.newVersion}). Launching ${targetTitle}.`
          );

          // 버전 동기화 성공 시 지연 없이 즉각 자동 닫기 (30ms)
          setTimeout(() => {
            if (isMounted) {
              dismissGate();
            }
          }, 30);
        } else {
          // 실패 시에만 재시도/닫기 UI 유지
          setHasError(true);
          setProgress(100);
          setStepDetail('SYNC_FALLBACK');
          setStatusMessage(
            language === 'ko'
              ? `[NOTICE] 오프라인 또는 버전 확인 응답 없음. 기본 버전(v${result.newVersion})으로 시작합니다.`
              : `[NOTICE] Version check response unavailable. Continuing with build v${result.newVersion}.`
          );
        }
      } catch {
        if (!isMounted) return;
        setHasError(true);
        setProgress(100);
        setStepDetail('ERROR_FALLBACK');
        setStatusMessage(
          language === 'ko'
            ? `[NOTICE] 시스템 초기화 완료. ${targetTitle}(으)로 진입 가능합니다.`
            : `[NOTICE] System initialized. Ready to enter ${targetTitle}.`
        );
      }
    }

    runVersionCheckSequence();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [language, isSubpage, targetTitle]);

  const handleManualReset = () => {
    setIsManualResetting(true);
    setStatusMessage(
      language === 'ko'
        ? '[FORCE] 전체 캐시 강제 삭제 및 새로고침 실행 중...'
        : '[FORCE] Purging all caches and reloading fresh bundle...'
    );
    setTimeout(() => {
      forcePurgeAndReload();
    }, 150);
  };

  const handleRetry = async () => {
    setHasError(false);
    setProgress(30);
    setStepDetail('RETRY_CHECK');
    setStatusMessage(
      language === 'ko' ? '[RETRY] 최신 버전 재검증 중...' : '[RETRY] Re-verifying version...'
    );
    try {
      const result = await checkAndSyncAppVersion();
      setVersionResult(result);
      setProgress(100);
      setStepDetail('BOOT_READY');
      setTimeout(() => {
        dismissGate();
      }, 60);
    } catch {
      dismissGate();
    }
  };

  // 서브페이지 진입 시에는 전체 화면을 가리지 않는 비차단형 상단 플로팅 배지로 렌더링
  if (isSubpage) {
    return (
      <div
        id="app-loading-gate-subpage-pill"
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-[999999] transition-all duration-200 pointer-events-none ${
          fadingOut ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="bg-[#201d1d] text-[#fdfcfc] px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-2 shadow-lg border border-[#fdfcfc]/20">
          <span className={`w-2 h-2 rounded-full shrink-0 ${hasError ? 'bg-amber-400' : progress >= 100 ? 'bg-emerald-400' : 'bg-blue-400 animate-pulse'}`} />
          <span>[SYSTEM] {targetTitle} • v{versionResult?.newVersion || localVersion} ({Math.round(progress)}%)</span>
        </div>
      </div>
    );
  }

  // 홈/메인 화면용 풀스크린 게이트
  return (
    <div
      id="app-loading-gate"
      className={`fixed inset-0 z-[999999] bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col justify-between p-4 sm:p-10 transition-opacity duration-150 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ userSelect: 'none' }}
    >
      {/* 상단 헤더 / 시스템 타이틀 & 즉시 닫기 버튼 */}
      <div className="flex justify-between items-center border-b border-[#201d1d]/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 bg-[#201d1d] animate-pulse"></span>
          <span className="text-xs sm:text-sm font-bold tracking-tight">SNSHERO REVOLUTION SYSTEM GATE</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] sm:text-xs text-[#201d1d]/60 hidden xs:flex items-center gap-2">
            <span>VER: v{versionResult?.newVersion || localVersion}</span>
            <span>BUILD: #{cacheTs.slice(-6)}</span>
          </div>
          {/* 즉시 닫기 / 스킵 버튼 */}
          <button
            id="app-loading-gate-close-btn"
            type="button"
            onClick={dismissGate}
            className="px-2.5 py-1 border border-[#201d1d]/40 hover:border-[#201d1d] hover:bg-[#201d1d] hover:text-[#fdfcfc] text-[11px] font-bold rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
            title={language === 'ko' ? '닫기 / 바로 진입' : 'Close / Enter now'}
          >
            <X size={12} />
            <span>{language === 'ko' ? '닫기' : 'Close'}</span>
          </button>
        </div>
      </div>

      {/* 중앙 메인 상태 및 프로그레스 영역 */}
      <div className="max-w-md sm:max-w-lg mx-auto w-full flex flex-col items-center justify-center my-auto space-y-5 text-center">
        {/* 시스템 모드 배지 & 타이틀 */}
        <div className="space-y-1.5">
          <div className="inline-block border border-[#201d1d] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase bg-[#201d1d] text-[#fdfcfc]">
            {language === 'ko' ? '[시스템 시작 & 버전 동기화]' : '[SYSTEM STARTUP & VERSION SYNC]'}
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight">
            SNSHERO REVOLUTION
          </div>
          <div className="text-[11px] text-[#201d1d]/60 font-semibold tracking-wider flex items-center justify-center gap-1.5">
            {hasError ? (
              <AlertTriangle size={13} className="text-amber-600" />
            ) : progress >= 100 ? (
              <CheckCircle2 size={13} className="text-emerald-600" />
            ) : null}
            <span>STEP: [{stepDetail}] • PROGRESS: {Math.round(progress)}%</span>
          </div>
        </div>

        {/* ASCII/하드 보더 프로그레스 바 */}
        <div className="w-full space-y-1">
          <div className="w-full h-3 sm:h-3.5 border border-[#201d1d] p-0.5 bg-[#fdfcfc]">
            <div
              className="h-full bg-[#201d1d] transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold text-[#201d1d]/70">
            <span>0%</span>
            <span>VER: v{versionResult?.newVersion || localVersion}</span>
            <span>100%</span>
          </div>
        </div>

        {/* 상태 메시지 터미널 박스 */}
        <div className="w-full bg-[#201d1d]/5 border border-[#201d1d]/20 p-3 text-xs text-left font-mono min-h-[50px] flex items-center">
          <span className="mr-2 text-[#201d1d] font-bold shrink-0">&gt;</span>
          <span className="leading-relaxed break-words text-[11px] sm:text-xs">{statusMessage}</span>
        </div>

        {/* 메인 진입 및 조작 버튼 그룹 */}
        <div className="w-full pt-1 flex flex-col gap-2">
          {/* 즉시 시작 / 로비 진입 CTA 버튼 */}
          <button
            id="app-loading-gate-enter-btn"
            type="button"
            onClick={dismissGate}
            className="w-full py-2.5 px-4 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
          >
            <span>
              {language === 'ko'
                ? `[ ${targetTitle} 지금 바로 시작하기 ]`
                : `[ Enter ${targetTitle} Now ]`}
            </span>
            <ArrowRight size={14} />
          </button>

          {/* 실패 또는 오류 발생 시에만 재시도 및 비상 복구 버튼 제공 */}
          {hasError && (
            <>
              <button
                type="button"
                onClick={handleRetry}
                className="w-full py-2 px-3 border border-amber-600 bg-amber-50 text-amber-950 text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <RefreshCw size={12} />
                <span>{language === 'ko' ? '[재시도] 버전 동기화 다시 시도' : '[Retry] Re-sync Version'}</span>
              </button>

              <button
                type="button"
                onClick={handleManualReset}
                disabled={isManualResetting}
                className="w-full py-1.5 px-3 border border-stone-400 text-[11px] font-medium bg-stone-100 text-stone-800 hover:bg-stone-200 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <ShieldAlert size={12} className="text-stone-600" />
                <span>
                  {isManualResetting
                    ? (language === 'ko' ? '[...] 캐시 초기화 진행 중...' : '[...] RESETTING CACHE...')
                    : (language === 'ko' ? '[비상 복구] 수동 캐싱 초기화 및 전체 새로고침' : '[EMERGENCY] Manual Cache Reset & Reload')}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 하단 푸터 */}
      <div className="border-t border-[#201d1d]/20 pt-3 flex justify-between items-center text-[10px] sm:text-[11px] text-[#201d1d]/60">
        <div>STATUS: {hasError ? 'STANDALONE_READY' : versionResult?.isUpdated ? 'CACHE_PURGED_FRESH' : 'VERSION_SYNCED'}</div>
        <div>OPENCODE MONOSPACE SYSTEM</div>
      </div>
    </div>
  );
};
