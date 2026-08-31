import React, { useState, useEffect, useMemo } from 'react';
import { ViewType, Language } from '../types';
import { resetAllCaches } from '../lib/cacheManager';
import { RotateCw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ViewLoadingFallbackProps {
  view?: ViewType | string;
  language?: Language;
  targetDurationMs?: number;
  onResetCache?: () => void;
  customMessage?: string;
  minProgress?: number;
}

interface ViewLoadingMeta {
  code: string;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  icon: string;
}

const VIEW_METAS: Record<string, ViewLoadingMeta> = {
  home: {
    code: 'HOME',
    titleKo: '메인 로비',
    titleEn: 'MAIN LOBBY',
    descKo: '메인 로비 모듈 및 유저 데이터 동기화 중...',
    descEn: 'Syncing main lobby & user session...',
    icon: '[⌂]',
  },
  main: {
    code: 'RPG',
    titleKo: '카단 RPG',
    titleEn: 'KADAN RPG',
    descKo: '카단 & 아케인 에코즈 RPG 월드 초기화 중...',
    descEn: 'Initializing RPG world & echoes...',
    icon: '[⚔]',
  },
  mydeck: {
    code: 'MY DECK',
    titleKo: '마이 덱',
    titleEn: 'MY DECK',
    descKo: '카드 인벤토리 및 덱 컴패니언 엔진 로드 중...',
    descEn: 'Loading deck & card inventory...',
    icon: '[🗎]',
  },
  play: {
    code: 'PLAY',
    titleKo: '배틀 아레나',
    titleEn: 'BATTLE ARENA',
    descKo: '전장 아레나 및 배틀 게임 엔진 초기화 중...',
    descEn: 'Initializing battle arena & game engine...',
    icon: '[⚔]',
  },
  'season-hub': {
    code: 'MISSIONS',
    titleKo: '시즌 미션 & 허브',
    titleEn: 'SEASON HUB',
    descKo: '시즌 미션 & 패스 보상 허브 로드 중...',
    descEn: 'Loading season missions & hub...',
    icon: '[★]',
  },
  shop: {
    code: 'SHOP',
    titleKo: '상점 & 가챠',
    titleEn: 'SHOP & GACHA',
    descKo: '카드팩 카탈로그 및 상점 모듈 로드 중...',
    descEn: 'Loading shop catalog & card packs...',
    icon: '[$]',
  },
  ranking: {
    code: 'RANKING',
    titleKo: '랭킹 보드',
    titleEn: 'LEADERBOARD',
    descKo: '실시간 리더보드 및 전적 데이터 로드 중...',
    descEn: 'Loading leaderboard & battle records...',
    icon: '[▲]',
  },
  event: {
    code: 'EVENT',
    titleKo: '이벤트 센터',
    titleEn: 'EVENT CENTER',
    descKo: '시즌 이벤트 및 특별 보상 센터 로드 중...',
    descEn: 'Loading seasonal events & rewards...',
    icon: '[🎁]',
  },
  setting: {
    code: 'SETTINGS',
    titleKo: '환경설정',
    titleEn: 'SETTINGS',
    descKo: '환경설정 및 시스템 옵션 로드 중...',
    descEn: 'Loading settings & preferences...',
    icon: '[⚙]',
  },
  companion: {
    code: 'COMPANION',
    titleKo: '컴패니언 훈련',
    titleEn: 'HERO COMPANION',
    descKo: '히어로 동료 육성 & 장비 모듈 로드 중...',
    descEn: 'Loading companion growth & gear...',
    icon: '[♥]',
  },
  community: {
    code: 'COMMUNITY',
    titleKo: '광장 커뮤니티',
    titleEn: 'COMMUNITY',
    descKo: '유저 광장 피드 및 대전 게시판 로드 중...',
    descEn: 'Loading community feed & boards...',
    icon: '[💬]',
  },
  'guild-list': {
    code: 'GUILD',
    titleKo: '길드 리스트',
    titleEn: 'GUILD LIST',
    descKo: '길드 네트워크 및 등록 현황 로드 중...',
    descEn: 'Loading guild registry...',
    icon: '[⚑]',
  },
  'guild-detail': {
    code: 'GUILD RAID',
    titleKo: '길드 본부',
    titleEn: 'GUILD HQ',
    descKo: '길드 본부 및 보스 레이드 정보 로드 중...',
    descEn: 'Loading guild base & raid info...',
    icon: '[🛡]',
  },
  'card-marketplace': {
    code: 'MARKET',
    titleKo: '카드 거래소',
    titleEn: 'CARD MARKET',
    descKo: 'P2P 카드 거래소 및 오더북 로드 중...',
    descEn: 'Loading card exchange & orderbook...',
    icon: '[↔]',
  },
  'stock-market': {
    code: 'EXCHANGE',
    titleKo: 'SNS 주식시장',
    titleEn: 'SNS MARKET',
    descKo: '가상 주식 시세 및 트레이딩 엔진 로드 중...',
    descEn: 'Loading stock charts & engine...',
    icon: '[📈]',
  },
  'prediction-market': {
    code: 'PREDICTION',
    titleKo: '예측 시장',
    titleEn: 'PREDICTION MARKET',
    descKo: '승부 예측 및 스포츠 베팅 마켓 로드 중...',
    descEn: 'Loading prediction fixtures...',
    icon: '[🎲]',
  },
  novel: {
    code: 'NOVEL',
    titleKo: '웹소설 뷰어',
    titleEn: 'NOVEL VIEWER',
    descKo: '웹소설 회차 및 스토리 스크립트 로드 중...',
    descEn: 'Loading novel chapters & story...',
    icon: '[📖]',
  },
  anime: {
    code: 'ANIME',
    titleKo: '애니메이션',
    titleEn: 'ANIME VIEWER',
    descKo: '애니메이션 씬 및 재생 엔진 로드 중...',
    descEn: 'Loading anime scenes & engine...',
    icon: '[▶]',
  },
  movie: {
    code: 'MOVIE',
    titleKo: '영화 극장',
    titleEn: 'MOVIE THEATER',
    descKo: '시네마 에피소드 및 비디오 플레이어 로드 중...',
    descEn: 'Loading cinematic episodes...',
    icon: '[🎬]',
  },
  profile: {
    code: 'PROFILE',
    titleKo: '프로필 센터',
    titleEn: 'PROFILE CENTER',
    descKo: '유저 프로필 및 칭호/배지 데이터 로드 중...',
    descEn: 'Loading user profile & badges...',
    icon: '[👤]',
  },
  status: {
    code: 'STATUS',
    titleKo: '서버 상태',
    titleEn: 'SYSTEM STATUS',
    descKo: '시스템 통계 및 서비스 모니터링 로드 중...',
    descEn: 'Loading system diagnostics...',
    icon: '[📊]',
  },
  admin: {
    code: 'ADMIN',
    titleKo: '관리자 센터',
    titleEn: 'ADMIN CENTER',
    descKo: '관리자 콘솔 및 시뮬레이션 엔진 로드 중...',
    descEn: 'Loading admin command center...',
    icon: '[⚡]',
  },
};

export const ViewLoadingFallback: React.FC<ViewLoadingFallbackProps> = ({
  view = 'home',
  language = 'ko',
  targetDurationMs = 2000,
  onResetCache,
  customMessage,
  minProgress = 0,
}) => {
  const [progress, setProgress] = useState(minProgress);
  const [isResetting, setIsResetting] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  // 2초 동안 부드럽게 0% -> 100% 로딩 게이지 애니메이션
  useEffect(() => {
    const startTime = performance.now();
    let animationFrameId: number;

    const updateProgress = (now: number) => {
      const elapsed = now - startTime;
      const rawPct = Math.min(100, Math.floor((elapsed / targetDurationMs) * 100));
      // 지수 감속 곡선으로 자연스러운 게이지 채움
      const displayPct = Math.max(minProgress, Math.min(99, rawPct));
      setProgress(displayPct);

      if (elapsed < targetDurationMs) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        setProgress(100);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetDurationMs, minProgress]);

  const meta = useMemo<ViewLoadingMeta>(() => {
    const key = String(view).toLowerCase();
    if (VIEW_METAS[key]) return VIEW_METAS[key];
    
    // wiki 관련
    if (key.startsWith('wiki') || key === 'world-codex') {
      return {
        code: 'CODEX',
        titleKo: '세계관 백과사전',
        titleEn: 'CODEX & WIKI',
        descKo: '게임 백과사전 및 카드/아이템 도감 로드 중...',
        descEn: 'Loading codex & encyclopedia...',
        icon: '[📚]',
      };
    }
    
    // 기본 메타
    return {
      code: key.toUpperCase(),
      titleKo: key.toUpperCase(),
      titleEn: key.toUpperCase(),
      descKo: '화면 리소스 모듈을 불러오는 중입니다...',
      descEn: 'Loading view resource module...',
      icon: '[+]',
    };
  }, [view]);

  // ASCII 진행 바 생성 ([==========>     ] 20칸)
  const asciiBar = useMemo(() => {
    const totalSlots = 20;
    const filled = Math.min(totalSlots, Math.floor((progress / 100) * totalSlots));
    const empty = Math.max(0, totalSlots - filled - 1);
    if (filled === totalSlots) {
      return '[' + '='.repeat(totalSlots) + ']';
    }
    return '[' + '='.repeat(filled) + '>' + ' '.repeat(empty) + ']';
  }, [progress]);

  // 캐시 초기화 핸들러
  const handlePurgeCache = () => {
    if (isResetting) return;
    setIsResetting(true);

    try {
      if (onResetCache) {
        onResetCache();
      } else {
        resetAllCaches();
      }
      setResetCompleted(true);
      setTimeout(() => {
        // 캐시 삭제 후 새로고침 (로그인/게임 데이터는 로컬스토리지에 안전 보존)
        window.location.reload();
      }, 350);
    } catch (e) {
      console.error('[ViewLoadingFallback] Cache purge failed:', e);
      window.location.reload();
    }
  };

  const isKo = language === 'ko';

  return (
    <div className="flex-1 w-full min-h-[60dvh] flex flex-col items-center justify-center p-4 sm:p-6 select-none font-mono bg-[#fdfcfc] text-[#201d1d] transition-opacity duration-150">
      {/* Container - DESIGN.md 플랫 1px 보더 & 웜크림 박스 */}
      <div className="w-full max-w-md bg-white border border-[#201d1d]/15 p-5 sm:p-6 rounded-sm shadow-xs flex flex-col gap-4">
        {/* Header ASCII Banner */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#201d1d] bg-[#201d1d]/5 px-2 py-0.5 rounded-none border border-[#201d1d]/15">
              {meta.icon} [{meta.code}]
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#201d1d]">
              {isKo ? meta.titleKo : meta.titleEn}
            </span>
          </div>
          <span className="text-[11px] font-bold tabular-nums text-[#201d1d]">
            {progress}%
          </span>
        </div>

        {/* Progress Bar (0% -> 100%) */}
        <div className="flex flex-col gap-1.5">
          <div className="w-full bg-[#f0eded] h-3 rounded-none border border-[#201d1d]/20 overflow-hidden relative p-[1px]">
            <div
              className="bg-[#201d1d] h-full transition-all duration-75 ease-out rounded-none relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Internal subtle scanline reflection */}
              <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
            </div>
          </div>
          
          {/* ASCII Bar Visualizer */}
          <div className="flex items-center justify-between text-[10px] text-[#201d1d]/60 font-mono tracking-tight">
            <span className="hidden sm:inline font-bold text-[#201d1d]/80">{asciiBar}</span>
            <span className="truncate">{customMessage || (isKo ? meta.descKo : meta.descEn)}</span>
            <span className="font-bold tabular-nums">{progress}/100</span>
          </div>
        </div>

        {/* Skeleton Line Simulation */}
        <div className="flex flex-col gap-2 py-2 border-y border-[#201d1d]/5">
          <div className="h-2 w-4/5 bg-[#201d1d]/8 animate-pulse rounded-none" />
          <div className="h-2 w-3/5 bg-[#201d1d]/8 animate-pulse rounded-none delay-75" />
          <div className="h-2 w-2/3 bg-[#201d1d]/8 animate-pulse rounded-none delay-150" />
        </div>

        {/* Bottom Actions & Cache Reset Button */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handlePurgeCache}
            disabled={isResetting}
            className="w-full h-9 bg-white hover:bg-[#201d1d]/5 active:bg-[#201d1d]/10 border border-[#201d1d]/25 text-[#201d1d] text-[11px] font-bold tracking-wider uppercase rounded-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            title={isKo ? '브라우저 리소스 캐시를 정리하고 새로고침합니다' : 'Purges resource cache and reloads'}
          >
            {isResetting ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>[{isKo ? '캐시 정리 및 재시작 중...' : 'PURGING CACHE...'}]</span>
              </>
            ) : resetCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>[{isKo ? '초기화 완료! 새로고침 중...' : 'PURGED! RELOADING...'}]</span>
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5" />
                <span>[↺ {isKo ? '캐시 초기화 & 새로고침' : 'RESET CACHE & RELOAD'}]</span>
              </>
            )}
          </button>

          {/* Safety & Integrity Guarantee Notice */}
          <div className="flex items-center gap-1 text-[10px] text-[#201d1d]/60 leading-tight text-center">
            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>
              {isKo
                ? '* 로그인 세션과 게임 플레이 데이터는 안전하게 보존됩니다.'
                : '* Login session & saved game data are 100% preserved.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
