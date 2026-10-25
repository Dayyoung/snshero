import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film,
  ChevronLeft,
  ChevronRight,
  List,
  ExternalLink,
  X,
  Play,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { PageHeader } from '../components/PageHeader';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import { MOVIE_EPISODES, getCinemaVideoUrl } from '../content/movieEpisodeMapping';
import { LiveActionCinemaPlayer } from '../components/movie/LiveActionCinemaPlayer';

interface CinemaViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx?: (url: string) => void;
  currentSeason?: string;
  updateSns?: (amount: number, reason?: string) => void;
  showCustomAlert?: (title: string, message: string, autoCloseSeconds?: number) => void;
}

const TOTAL_EPISODES = 40;
const YOUTUBE_PLAYLIST_ID = 'PLHiW8jLQ0t2Q';
const YOUTUBE_PLAYLIST_URL = 'https://www.youtube.com/watch?v=hqgXClTuKmU&list=PLHiW8jLQ0t2Q';
const YOUTUBE_DATA_API_KEY = 'AIzaSyBa9TidLv_iwMyB-9VSrVGWEVUr0WyjiQU';

export const CinemaView: React.FC<CinemaViewProps> = ({
  language,
  onNavigate,
  playSfx,
  currentSeason = 'season1',
  updateSns,
  showCustomAlert,
}) => {
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined') {
        const pathMatch = window.location.pathname.match(/\/ep-(\d+)/i);
        if (pathMatch && pathMatch[1]) {
          const parsedPathEp = parseInt(pathMatch[1], 10);
          if (!isNaN(parsedPathEp)) {
            return Math.max(1, Math.min(TOTAL_EPISODES, parsedPathEp));
          }
        }
        const params = new URLSearchParams(window.location.search);
        const epParam = params.get('ep') || params.get('episode');
        if (epParam) {
          const parsedEp = parseInt(epParam, 10);
          if (!isNaN(parsedEp)) {
            return Math.max(1, Math.min(TOTAL_EPISODES, parsedEp));
          }
        }
      }
    } catch {
      // ignore
    }
    const saved = getSeasonItem('hero_cinema_progress', currentSeason);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 || parsed > TOTAL_EPISODES ? 1 : Math.max(1, Math.min(TOTAL_EPISODES, parsed));
  });

  const [playlistVideoIds, setPlaylistVideoIds] = useState<string[]>([]);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [playerMode, setPlayerMode] = useState<'conquest_mp4' | 'interactive' | 'youtube'>('conquest_mp4');
  const todayStr = new Date().toISOString().split('T')[0];

  const [claimedRewards, setClaimedRewards] = useState<Record<number, boolean>>(() => {
    try {
      const saved = getSeasonItem('hero_cinema_claimed_episodes', currentSeason);
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  });

  // YouTube Data API v3로 최신 무비 플레이리스트 Video ID 동기화
  useEffect(() => {
    let isMounted = true;
    const syncPlaylist = async () => {
      try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${YOUTUBE_PLAYLIST_ID}&key=${YOUTUBE_DATA_API_KEY}`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.items) && isMounted) {
            const validItems = data.items.filter(
              (item: any) =>
                item?.snippet?.title !== 'Deleted video' &&
                item?.snippet?.title !== 'Private video' &&
                item?.snippet?.resourceId?.videoId
            );
            validItems.sort((a: any, b: any) => {
              const ma = String(a?.snippet?.title || '').match(/EP\.?0*(\d+)/i);
              const mb = String(b?.snippet?.title || '').match(/EP\.?0*(\d+)/i);
              const na = ma ? parseInt(ma[1], 10) : 999;
              const nb = mb ? parseInt(mb[1], 10) : 999;
              return na - nb;
            });
            const ids = validItems.map((item: any) => item?.snippet?.resourceId?.videoId);
            if (ids.length > 0) {
              setPlaylistVideoIds(ids);
            }
          }
        }
      } catch {
        // 정적 매핑 MOVIE_EPISODES 폴백 사용
      }
    };
    syncPlaylist();
    return () => {
      isMounted = false;
    };
  }, []);

  const getVideoId = (epNum: number): string | undefined => {
    return MOVIE_EPISODES[epNum]?.movieVideoId || playlistVideoIds[epNum - 1];
  };

  const getDirectYouTubeWatchUrl = (epNum: number): string => {
    const vId = getVideoId(epNum);
    if (vId) {
      return `https://www.youtube.com/watch?v=${vId}&list=${YOUTUBE_PLAYLIST_ID}`;
    }
    return YOUTUBE_PLAYLIST_URL;
  };

  const getEpisodeTitle = (epNum: number): { main: string; sub: string } => {
    const meta = MOVIE_EPISODES[epNum];
    if (!meta) return { main: `제 ${epNum}화`, sub: `Episode ${epNum}` };
    if (language === 'ko') {
      return { main: `제${epNum}화 ${meta.titleKo}`, sub: meta.titleEn };
    } else if (language === 'ja') {
      return { main: `第${epNum}話 ${meta.titleJa || meta.titleKo}`, sub: meta.titleEn };
    }
    return { main: `Ep.${epNum} ${meta.titleEn}`, sub: meta.titleKo };
  };

  useEffect(() => {
    setSeasonItem('hero_cinema_progress', currentEpisodeNum.toString(), currentSeason);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('ep') !== currentEpisodeNum.toString()) {
          url.searchParams.set('ep', currentEpisodeNum.toString());
          window.history.replaceState(window.history.state, '', url.pathname + url.search);
        }
        const meta = MOVIE_EPISODES[currentEpisodeNum];
        const vid = meta?.movieVideoId || playlistVideoIds[currentEpisodeNum - 1] || 'hqgXClTuKmU';
        if (meta && typeof document !== 'undefined') {
          document.title = `무비 제${currentEpisodeNum}화: ${meta.titleKo} (${meta.titleEn}) | SNSHero 공식 무비 40화`;
          let scriptEl = document.getElementById('snshero-video-schema');
          if (!scriptEl) {
            scriptEl = document.createElement('script');
            scriptEl.id = 'snshero-video-schema';
            scriptEl.setAttribute('type', 'application/ld+json');
            document.head.appendChild(scriptEl);
          }
          scriptEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: `SNSHero 공식 무비 제${currentEpisodeNum}화: ${meta.titleKo} (${meta.titleEn})`,
            description: `${meta.synopsisKo} (${meta.synopsisEn}) 감상 시 +100 SNS 보상 지급.`,
            thumbnailUrl: [`https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`],
            uploadDate: '2026-10-12T00:00:00+09:00',
            duration: `PT${meta.durationMinutes || 6}M`,
            contentUrl: `https://www.youtube.com/watch?v=${vid}&list=${YOUTUBE_PLAYLIST_ID}`,
            embedUrl: `https://www.youtube.com/embed/${vid}?list=${YOUTUBE_PLAYLIST_ID}`,
            isAccessibleForFree: true,
          });
        }
      } catch {
        // ignore
      }
    }
  }, [currentEpisodeNum, currentSeason, playlistVideoIds]);

  const handleSelectEpisode = (epNum: number) => {
    if (epNum < 1 || epNum > TOTAL_EPISODES) return;
    triggerHaptic('light');
    setCurrentEpisodeNum(epNum);
    setShowDrawer(false);
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleClaimReward = (epNum: number) => {
    if (claimedRewards[epNum]) return;

    const newClaimed = { ...claimedRewards, [epNum]: true };
    setClaimedRewards(newClaimed);
    setSeasonItem('hero_cinema_claimed_episodes', JSON.stringify(newClaimed), currentSeason);

    if (updateSns) {
      updateSns(100, `Movie Ep.${epNum} Watch Reward`);
    }

    if (playSfx) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    }

    if (showCustomAlert) {
      showCustomAlert(
        language === 'ko' ? '무비 시청 보상' : 'Movie Watch Reward',
        language === 'ko'
          ? `무비 제 ${epNum}화 시청 보상으로 100 SNS가 지급되었습니다!`
          : `Received 100 SNS for watching Movie Episode ${epNum}!`,
        3
      );
    }
  };

  // 에피소드 선택/시청 시 미수령 보상 자동 지급
  useEffect(() => {
    if (!claimedRewards[currentEpisodeNum]) {
      const timer = setTimeout(() => {
        handleClaimReward(currentEpisodeNum);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentEpisodeNum, claimedRewards]);

  // 40화 재생 종료 시 실사(무비) <-> 애니메이션 자동 교차 토글
  const handleAdvanceOrToggleCrossMedia = () => {
    triggerHaptic('light');
    if (currentEpisodeNum < TOTAL_EPISODES) {
      handleSelectEpisode(currentEpisodeNum + 1);
      return;
    }
    setSeasonItem('hero_movie_progress', '1', currentSeason);
    try {
      localStorage.setItem('hero_storybook_art_style', 'animation');
      window.dispatchEvent(
        new CustomEvent('hero_art_style_updated', { detail: { artStyleMode: 'animation' } })
      );
    } catch {}
    if (showCustomAlert) {
      showCustomAlert(
        language === 'ko' ? '🎨 [40화 완주] 애니메이션 교차 전환!' : '🎨 [EP.40 Complete] Switched to Animation!',
        language === 'ko'
          ? '실사 무비 40화 재생이 완료되어 애니메이션(1~40화) 모드로 자동 교차 전환됩니다!'
          : 'Completed 40 Live-Action Movie episodes! Automatically toggling to Animation (EP.1-40)!',
        2
      );
    }
    onNavigate('movie');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleYouTubeMessage = (event: MessageEvent) => {
      if (!event.origin.includes('youtube.com')) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const isEnded =
          (data?.event === 'onStateChange' && data?.info === 0) ||
          (data?.event === 'infoDelivery' && data?.info?.playerState === 0);
        if (isEnded) {
          handleAdvanceOrToggleCrossMedia();
        }
      } catch {}
    };
    window.addEventListener('message', handleYouTubeMessage);
    return () => window.removeEventListener('message', handleYouTubeMessage);
  }, [currentEpisodeNum, currentSeason, language]);

  const currentVideoId = getVideoId(currentEpisodeNum) || 'hqgXClTuKmU';
  const embedUrl = `https://www.youtube.com/embed/${currentVideoId}?list=${YOUTUBE_PLAYLIST_ID}&autoplay=1&rel=0&enablejsapi=1`;

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono px-0 py-2 sm:py-3 pb-32 max-w-[1024px] mx-auto w-full overflow-x-hidden">
      {shareToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100000] bg-[#201d1d] text-[#fdfcfc] text-xs px-4 py-2.5 rounded-none border border-[#201d1d] flex items-center gap-2 font-mono">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="px-2 sm:px-4">
        <PageHeader
          title={language === 'ko' ? 'SNSHero 공식 무비 (40화)' : 'SNSHero Official Movie (40 Episodes)'}
          onBack={() => onNavigate('home')}
          rightAction={
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-xs font-bold text-[#201d1d] hover:bg-[#f8f7f7] transition-colors cursor-pointer shrink-0 font-mono"
            >
              <List size={16} />
              <span className="hidden sm:inline">[무비 회차 목록 (40화)]</span>
            </button>
          }
        />
      </div>

      {/* ── YouTube Movie Header Bar ── */}
      <div className="mb-3 px-3 sm:px-4 py-3 rounded-none border-y border-x-0 border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-sm bg-[#fdfcfc] text-[#201d1d] text-[11px] font-bold">
            [MOVIE 40화]
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#fdfcfc]">
            무비 시청 시 회차당 +100 SNS 보상이 즉시 지급됩니다.
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <a
            href={getDirectYouTubeWatchUrl(currentEpisodeNum)}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] font-mono text-xs font-bold transition-colors shrink-0"
          >
            <ExternalLink size={14} />
            <span>[YouTube 무비 제{currentEpisodeNum}화 열기]</span>
          </a>
          <a
            href={YOUTUBE_PLAYLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              try {
                const key = `hero_yt_movie_playlist_boost_${todayStr}`;
                if (localStorage.getItem(key) !== 'true') {
                  localStorage.setItem(key, 'true');
                  if (updateSns) {
                    updateSns(300, 'YouTube Movie Playlist Visit Bonus');
                  }
                  setShareToast('[v] YouTube 무비 플레이리스트 시청 보너스 (+300 SNS 지급!)');
                  setTimeout(() => setShareToast(null), 3000);
                }
              } catch {}
            }}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#201d1d] hover:bg-black text-[#fdfcfc] border border-[#fdfcfc]/30 font-mono text-xs font-bold transition-colors shrink-0"
          >
            <List size={13} />
            <span>[전체 재생목록 (+300 SNS)]</span>
          </a>
        </div>
      </div>

      {/* ── Live-Action Movie Player Mode Switch & Video Viewport ── */}
      <div className="mb-5 w-full">
        <div className="px-2 sm:px-4 py-2 bg-[#f8f7f7] border-t border-x-0 border-[rgba(15,0,0,0.12)] flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-sm border border-[#201d1d] bg-[#fdfcfc] p-0.5 font-mono">
            <button
              type="button"
              onClick={() => setPlayerMode('conquest_mp4')}
              className={cn(
                'min-h-[36px] px-2.5 py-1 rounded-sm text-xs font-mono font-bold transition-colors cursor-pointer',
                playerMode === 'conquest_mp4'
                  ? 'bg-[#201d1d] text-[#fdfcfc]'
                  : 'text-[#646262] hover:text-[#201d1d]'
              )}
            >
              🎞️ {language === 'ko' ? '완전정복 MP4 (2,009컷)' : 'Conquest MP4 (2,009 Cuts)'}
            </button>
            <button
              type="button"
              onClick={() => setPlayerMode('interactive')}
              className={cn(
                'min-h-[36px] px-2.5 py-1 rounded-sm text-xs font-mono font-bold transition-colors cursor-pointer',
                playerMode === 'interactive'
                  ? 'bg-[#201d1d] text-[#fdfcfc]'
                  : 'text-[#646262] hover:text-[#201d1d]'
              )}
            >
              🎬 {language === 'ko' ? '인터랙티브 70mm 극장' : 'Interactive 70mm Cinema'}
            </button>
            <button
              type="button"
              onClick={() => setPlayerMode('youtube')}
              className={cn(
                'min-h-[36px] px-2.5 py-1 rounded-sm text-xs font-mono font-bold transition-colors cursor-pointer',
                playerMode === 'youtube'
                  ? 'bg-[#201d1d] text-[#fdfcfc]'
                  : 'text-[#646262] hover:text-[#201d1d]'
              )}
            >
              ▶️ YouTube
            </button>
          </div>
          <span className="text-[11px] font-mono text-[#646262]">
            {language === 'ko'
              ? '중복 0% · 전 40화 2,009컷 1:1 완전정복 70mm 실사 무비 적용'
              : '0% Duplicates · All 40 Episodes 2,009 Unique Live-Action Cuts Applied'}
          </span>
        </div>

        {playerMode === 'conquest_mp4' ? (
          <div className="relative w-full aspect-video rounded-none overflow-hidden bg-black border-y border-x-0 border-[#201d1d]">
            <video
              key={`movie-mp4-ep-${currentEpisodeNum}`}
              src={getCinemaVideoUrl(currentEpisodeNum)}
              controls
              autoPlay
              playsInline
              onEnded={handleAdvanceOrToggleCrossMedia}
              onError={() => setPlayerMode('interactive')}
              className="w-full h-full object-contain bg-black"
            />
          </div>
        ) : playerMode === 'interactive' ? (
          <div className="w-full border-y border-x-0 border-[#201d1d]">
            <LiveActionCinemaPlayer
              key={`movie-interactive-ep-${currentEpisodeNum}`}
              episodeNumber={currentEpisodeNum}
              titleKo={MOVIE_EPISODES[currentEpisodeNum]?.titleKo || `제 ${currentEpisodeNum}화`}
              titleEn={MOVIE_EPISODES[currentEpisodeNum]?.titleEn || `Episode ${currentEpisodeNum}`}
              titleJa={MOVIE_EPISODES[currentEpisodeNum]?.titleJa}
              language={language === 'ko' || language === 'ja' ? language : 'en'}
              onEpisodeComplete={() => handleAdvanceOrToggleCrossMedia()}
              onSelectEpisode={handleSelectEpisode}
              totalEpisodes={TOTAL_EPISODES}
            />
          </div>
        ) : (
          <div className="relative w-full aspect-video rounded-none overflow-hidden bg-black border-y border-x-0 border-[#201d1d]">
            <iframe
              key={`movie-yt-ep-${currentEpisodeNum}-${currentVideoId}`}
              src={embedUrl}
              title={`SNSHero The Movie Ep.${currentEpisodeNum}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}

        {/* Episode Info & Navigation Bar */}
        <div className="p-3 sm:p-4 rounded-none border-b border-x-0 border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-1 rounded-sm bg-[#201d1d] text-[#fdfcfc]">
              무비 EP.{String(currentEpisodeNum).padStart(2, '0')}
            </span>
            <span className="text-xs font-bold text-[#201d1d] font-mono">
              {getEpisodeTitle(currentEpisodeNum).main}
              {getEpisodeTitle(currentEpisodeNum).sub && (
                <span className="text-[11px] text-[#646262] ml-1.5 font-normal">
                  ({getEpisodeTitle(currentEpisodeNum).sub})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onNavigate('novel');
              }}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <BookOpen size={14} />
              <span>[소설 {currentEpisodeNum}화]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onNavigate('movie');
              }}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#201d1d] bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <Film size={14} />
              <span>[애니메이션 {currentEpisodeNum}화]</span>
            </button>

            <button
              type="button"
              disabled={currentEpisodeNum <= 1}
              onClick={() => handleSelectEpisode(currentEpisodeNum - 1)}
              className="min-h-[44px] flex items-center gap-1 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f1eeee] disabled:opacity-40 text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>이전 화</span>
            </button>

            <button
              type="button"
              onClick={handleAdvanceOrToggleCrossMedia}
              className="min-h-[44px] flex items-center gap-1 px-3 py-1.5 rounded-sm border bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] hover:bg-black text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <span>
                {currentEpisodeNum >= TOTAL_EPISODES
                  ? language === 'ko'
                    ? '🎨 애니 1화로 교차'
                    : '🎨 Toggle to Anime EP.1'
                  : '다음 화'}
              </span>
              <ChevronRight size={16} />
            </button>

            <div className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>[v] 시청 보상 +100 SNS 지급 완료</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Episode Grid View (1 ~ 40화) ── */}
      <div className="space-y-3 px-2 sm:px-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-mono text-sm font-bold text-[#201d1d]">
            [ 무비 전체 에피소드 ({TOTAL_EPISODES}화) ]
          </h3>
          <span className="text-xs text-[#646262] font-mono">
            수령 완료: {Object.keys(claimedRewards).length} / {TOTAL_EPISODES}화
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2">
          {Array.from({ length: TOTAL_EPISODES }, (_, i) => i + 1).map((ep) => {
            const isSelected = ep === currentEpisodeNum;
            const isClaimed = Boolean(claimedRewards[ep]);

            return (
              <button
                key={ep}
                type="button"
                onClick={() => handleSelectEpisode(ep)}
                className={cn(
                  'min-h-[64px] relative flex flex-col items-start justify-between p-2.5 rounded-none border transition-colors text-left cursor-pointer font-mono',
                  isSelected
                    ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] font-bold'
                    : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:border-[#201d1d] hover:bg-[#f8f7f7] text-[#201d1d]'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold">EP.{String(ep).padStart(2, '0')}</span>
                  {isClaimed ? (
                    <CheckCircle2 size={12} className={isSelected ? 'text-emerald-300' : 'text-emerald-600'} />
                  ) : (
                    <Play size={12} className={isSelected ? 'text-[#fdfcfc]' : 'text-[#646262]'} />
                  )}
                </div>
                <span className="text-[11px] truncate w-full mt-1">
                  {MOVIE_EPISODES[ep]?.titleKo || `제 ${ep}화`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Slide Drawer: Movie Episode List ── */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md h-full bg-[#fdfcfc] border-l border-[#201d1d] p-4 flex flex-col rounded-none"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(15,0,0,0.12)] mb-3">
                <h3 className="font-mono text-base font-bold text-[#201d1d]">
                  [ 무비 회차 목록 (40화) ]
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="min-h-[44px] min-w-[44px] p-1 rounded-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee] text-[#201d1d] transition-colors cursor-pointer flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {Array.from({ length: TOTAL_EPISODES }, (_, i) => i + 1).map((ep) => {
                  const isSelected = ep === currentEpisodeNum;
                  const isClaimed = Boolean(claimedRewards[ep]);

                  return (
                    <button
                      key={ep}
                      type="button"
                      onClick={() => handleSelectEpisode(ep)}
                      className={cn(
                        'min-h-[48px] w-full p-3 rounded-sm border text-left flex items-center justify-between transition-colors cursor-pointer font-mono',
                        isSelected
                          ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] font-bold'
                          : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f8f7f7] text-[#201d1d]'
                      )}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-xs font-bold shrink-0">EP.{String(ep).padStart(2, '0')}</span>
                        <span className="text-xs truncate">{getEpisodeTitle(ep).main}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px]">
                          {isClaimed ? '[v] +100 SNS' : '+100 SNS'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
