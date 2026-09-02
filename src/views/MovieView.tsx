import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film,
  ChevronLeft,
  ChevronRight,
  List,
  ExternalLink,
  Gift,
  Award,
  Sparkles,
  X,
  Play,
  CheckCircle2,
  Lock,
  Clock,
  Info,
  Maximize,
  Minimize,
  RefreshCw
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { PageHeader } from '../components/PageHeader';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import { MOVIE_EPISODES } from '../content/movieEpisodeMapping';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

interface MovieViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx?: (url: string) => void;
  currentSeason?: string;
  updateSns?: (amount: number, reason?: string) => void;
  showCustomAlert?: (title: string, message: string) => void;
}

const TOTAL_EPISODES = 40;
const YOUTUBE_PLAYLIST_ID = 'PLOLtCtApKgp8';
const YOUTUBE_PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLOLtCtApKgp8';

// 기본 공개 완료 에피소드 기본값 (현재 최소 6화까지 공개됨)
const DEFAULT_RELEASED_COUNT = 8;

export const MovieView: React.FC<MovieViewProps> = ({
  language,
  onNavigate,
  playSfx,
  currentSeason = 'season1',
  updateSns,
  showCustomAlert,
}) => {
  // 현재 시청 중인 에피소드 번호 (1~40) - URL 쿼리 파라미터(?ep=, ?episode=) 최우선 반영
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const epParam = params.get('ep') || params.get('episode');
        if (epParam) {
          const parsedEp = parseInt(epParam, 10);
          if (!isNaN(parsedEp) && parsedEp >= 1 && parsedEp <= TOTAL_EPISODES) {
            return parsedEp;
          }
        }
      }
    } catch {
      // ignore
    }
    const saved = getSeasonItem('hero_movie_progress', currentSeason);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 || parsed > TOTAL_EPISODES ? 1 : parsed;
  });

  // 공개된 에피소드 개수 (최소 8화부터 시작하여 실시간 유동 감지)
  const [releasedCount, setReleasedCount] = useState<number>(() => {
    const saved = getSeasonItem('hero_movie_released_count', currentSeason);
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_RELEASED_COUNT;
    return isNaN(parsed) || parsed < DEFAULT_RELEASED_COUNT ? DEFAULT_RELEASED_COUNT : parsed;
  });

  const [playlistVideoIds, setPlaylistVideoIds] = useState<string[]>([]);
  const [isCheckingPlaylist, setIsCheckingPlaylist] = useState<boolean>(false);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'released' | 'upcoming'>('all');

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);

  // 에피소드 번호별 정확한 YouTube Video ID 도출 (정적 매핑 MOVIE_EPISODES 최우선)
  const getVideoId = (epNum: number): string | undefined => {
    return MOVIE_EPISODES[epNum]?.videoId || playlistVideoIds[epNum - 1];
  };

  // 해당 에피소드의 정확한 YouTube 직접 시청 URL (YouTube 앱/웹에서 해당 회차 바로 열기)
  const getDirectYouTubeWatchUrl = (epNum: number): string => {
    const vId = getVideoId(epNum);
    if (vId) {
      return `https://www.youtube.com/watch?v=${vId}&list=${YOUTUBE_PLAYLIST_ID}&index=${epNum}`;
    }
    return `https://www.youtube.com/watch?list=${YOUTUBE_PLAYLIST_ID}&index=${epNum}`;
  };

  // 에피소드 제목 헬퍼
  const getEpisodeTitle = (epNum: number): { main: string; sub: string } => {
    const meta = MOVIE_EPISODES[epNum];
    if (!meta) {
      return { main: `제 ${epNum}화`, sub: `Episode ${epNum}` };
    }
    if (language === 'ko') {
      return { main: `제${epNum}화 ${meta.titleKo}`, sub: meta.titleJa ? `${meta.titleJa} (${meta.titleEn})` : meta.titleEn };
    } else if (language === 'ja') {
      return { main: `第${epNum}話 ${meta.titleJa || meta.titleKo}`, sub: meta.titleKo };
    } else {
      return { main: `Ep.${epNum} ${meta.titleEn}`, sub: meta.titleKo };
    }
  };

  // 유튜브 플레이리스트 최신 목록 실시간 동적 확인 (HTML 직접 파싱 + RSS + 다중 CORS 프록시 fallback 체인)
  const fetchLatestPlaylistStatus = async (silent = false) => {
    setIsCheckingPlaylist(true);
    try {
      const playlistPageUrl = `https://www.youtube.com/playlist?list=${YOUTUBE_PLAYLIST_ID}`;
      const rawRssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${YOUTUBE_PLAYLIST_ID}`;
      
      const fetchTargets = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(playlistPageUrl)}`,
        `https://corsproxy.io/?url=${encodeURIComponent(playlistPageUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(playlistPageUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(rawRssUrl)}`,
        `https://corsproxy.io/?url=${encodeURIComponent(rawRssUrl)}`,
      ];

      let fetchedVideoIds: string[] = [];

      for (const targetUrl of fetchTargets) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(targetUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (res.ok) {
            const text = await res.text();
            
            // 1. HTML ytInitialData or regex videoId matches
            const videoIdMatches = Array.from(text.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)).map(m => m[1]);
            const uniqueIds: string[] = [];
            for (const vid of videoIdMatches) {
              if (vid && vid !== YOUTUBE_PLAYLIST_ID && !uniqueIds.includes(vid)) {
                uniqueIds.push(vid);
              }
            }

            if (uniqueIds.length >= DEFAULT_RELEASED_COUNT) {
              fetchedVideoIds = uniqueIds;
              break;
            }

            // 2. RSS XML matches
            const rssMatches = Array.from(text.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)).map(m => m[1]);
            if (rssMatches.length > 0 && uniqueIds.length === 0) {
              fetchedVideoIds = rssMatches;
              break;
            }
          }
        } catch {
          // try next proxy
        }
      }

      const knownStaticIds = Object.entries(MOVIE_EPISODES)
        .filter(([_, meta]) => Boolean(meta.videoId))
        .map(([_, meta]) => meta.videoId as string);

      const combinedCount = Math.max(
        fetchedVideoIds.length,
        knownStaticIds.length,
        DEFAULT_RELEASED_COUNT
      );

      setReleasedCount(combinedCount);
      setSeasonItem('hero_movie_released_count', combinedCount.toString(), currentSeason);
      if (fetchedVideoIds.length > 0) {
        setPlaylistVideoIds(fetchedVideoIds);
      }

      if (!silent && showCustomAlert) {
        showCustomAlert(
          language === 'ko' ? '실시간 동기화 완료' : 'Real-time Sync Complete',
          language === 'ko'
            ? `유튜브 오피셜 플레이리스트에서 총 ${combinedCount}화 공개 상태를 실시간 동기화했습니다.`
            : `Successfully synced ${combinedCount} released episodes from YouTube official playlist.`
        );
      }
    } catch (err) {
      console.warn('Movie playlist dynamic check notice (using cache):', err);
    } finally {
      setIsCheckingPlaylist(false);
    }
  };

  // 최초화면 진입 시 자동 확인
  useEffect(() => {
    fetchLatestPlaylistStatus(true);
  }, [currentSeason]);

  // YouTube IFrame API Initializer (플레이어의 getPlaylist() 동적 감지 포함)
  useEffect(() => {
    let isMounted = true;

    if (!window.YT) {
      const scriptId = 'yt-iframe-api';
      let tag = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!tag) {
        tag = document.createElement('script');
        tag.id = scriptId;
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onerror = (e) => {
          console.warn('YouTube IFrame API script failed to load:', e);
        };
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }

    const syncPlaylistFromPlayer = (player: any) => {
      try {
        if (typeof player.getPlaylist === 'function') {
          const list = player.getPlaylist();
          if (Array.isArray(list) && list.length > 0 && isMounted) {
            setPlaylistVideoIds(list);
            const count = Math.max(list.length, DEFAULT_RELEASED_COUNT);
            setReleasedCount(count);
            setSeasonItem('hero_movie_released_count', count.toString(), currentSeason);
          }
        }
      } catch (err) {
        console.warn('YouTube player getPlaylist notice:', err);
      }
    };

    const initYTPlayer = () => {
      if (window.YT && window.YT.Player && !playerRef.current) {
        try {
          playerRef.current = new window.YT.Player('movie-yt-player', {
            events: {
              onReady: (event: any) => {
                if (!isMounted) return;
                setIsPlayerReady(true);
                syncPlaylistFromPlayer(event.target);
                try {
                  const targetVideoId = getVideoId(currentEpisodeNum);
                  if (targetVideoId && typeof event.target.cueVideoById === 'function') {
                    event.target.cueVideoById(targetVideoId);
                  } else {
                    event.target.cuePlaylist({
                      listType: 'playlist',
                      list: YOUTUBE_PLAYLIST_ID,
                      index: currentEpisodeNum - 1,
                    });
                  }
                } catch (err) {
                  console.warn('Cue playlist error:', err);
                }
              },
              onStateChange: (event: any) => {
                if (!isMounted) return;
                syncPlaylistFromPlayer(event.target);
              },
            },
          });
        } catch (e) {
          console.warn('Init YT player error:', e);
        }
      }
    };

    if (window.YT && window.YT.Player) {
      initYTPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initYTPlayer();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [currentSeason]);

  // Sync player episode when currentEpisodeNum changes
  useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      try {
        const targetVideoId = getVideoId(currentEpisodeNum);
        if (targetVideoId && typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById(targetVideoId);
        } else if (typeof playerRef.current.playVideoAt === 'function') {
          playerRef.current.playVideoAt(currentEpisodeNum - 1);
        } else if (typeof playerRef.current.loadPlaylist === 'function') {
          playerRef.current.loadPlaylist({
            listType: 'playlist',
            list: YOUTUBE_PLAYLIST_ID,
            index: currentEpisodeNum - 1,
          });
        }
      } catch (err) {
        console.warn('Failed to switch playlist episode via YT API:', err);
      }
    }
  }, [currentEpisodeNum, isPlayerReady, playlistVideoIds]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen().catch((err) => {
          console.error('Fullscreen error:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error('Exit fullscreen error:', err);
        });
      }
    }
  };

  // 시청 완료 보상 수령 상태 (에피소드별)
  const [claimedRewards, setClaimedRewards] = useState<Record<number, boolean>>(() => {
    try {
      const saved = getSeasonItem('hero_movie_claimed_episodes', currentSeason);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 에피소드 변경 시 진행도 저장 및 브라우저 URL 쿼리 파라미터 동기화
  useEffect(() => {
    setSeasonItem('hero_movie_progress', currentEpisodeNum.toString(), currentSeason);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('ep') !== currentEpisodeNum.toString()) {
          url.searchParams.set('ep', currentEpisodeNum.toString());
          window.history.replaceState(window.history.state, '', url.pathname + url.search);
        }
      } catch {
        // ignore
      }
    }
  }, [currentEpisodeNum, currentSeason]);

  const handleSelectEpisode = (epNum: number) => {
    if (epNum > releasedCount) {
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      if (showCustomAlert) {
        showCustomAlert(
          language === 'ko' ? '공개 예정 에피소드' : 'Episode Coming Soon',
          language === 'ko'
            ? `제 ${epNum}화는 아직 공개 준비 중입니다! 유튜브 오피셜 채널에서 곧 공개될 예정입니다.`
            : `Episode ${epNum} is scheduled for release soon! Stay tuned on the YouTube playlist.`
        );
      }
      return;
    }

    setCurrentEpisodeNum(epNum);
    setShowDrawer(false);
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleClaimReward = (epNum: number) => {
    if (claimedRewards[epNum]) return;

    const newClaimed = { ...claimedRewards, [epNum]: true };
    setClaimedRewards(newClaimed);
    setSeasonItem('hero_movie_claimed_episodes', JSON.stringify(newClaimed), currentSeason);

    if (updateSns) {
      updateSns(100, `Movie Ep.${epNum} Watch Reward`);
    }

    if (playSfx) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    }

    if (showCustomAlert) {
      showCustomAlert(
        language === 'ko' ? '시청 보상 수령' : 'Reward Claimed',
        language === 'ko'
          ? `극장판 제 ${epNum}화 시청 완료 보상으로 100 SNS가 지급되었습니다!`
          : `Received 100 SNS for watching Movie Episode ${epNum}!`
      );
    }
  };

  const currentRewardClaimed = Boolean(claimedRewards[currentEpisodeNum]);
  const isCurrentReleased = currentEpisodeNum <= releasedCount;

  // 에피소드 번호 기반 YouTube 임베드 URL (정확한 Video ID 우선, 없을 경우 0-based index 플레이리스트 폴백)
  const currentVideoId = getVideoId(currentEpisodeNum);
  const embedUrl = currentVideoId
    ? `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&rel=0&enablejsapi=1`
    : `https://www.youtube-nocookie.com/embed?listType=playlist&list=${YOUTUBE_PLAYLIST_ID}&index=${currentEpisodeNum - 1}&autoplay=1&rel=0&enablejsapi=1`;

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfcfc] text-[#201d1d] font-sans p-3 sm:p-4 md:p-8 pb-32 max-w-5xl mx-auto w-full overflow-x-hidden">
      {/* ── Page Header ── */}
      <PageHeader
        title={t('movie_title', language) || 'SNSHero 공식 영화 (극장판)'}
        onBack={() => onNavigate('home')}
        rightAction={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchLatestPlaylistStatus(false)}
              disabled={isCheckingPlaylist}
              title="YouTube 최신 회차 동기화"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-white text-xs font-bold text-[#201d1d] hover:bg-[#f8f7f7] disabled:opacity-50 transition-colors cursor-pointer touch-target shrink-0 font-mono"
            >
              <RefreshCw size={14} className={cn(isCheckingPlaylist && 'animate-spin text-rose-600')} />
              <span className="hidden sm:inline">동기화</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-white text-xs font-bold text-[#201d1d] hover:bg-[#f8f7f7] transition-colors cursor-pointer touch-target shrink-0"
            >
              <List size={16} />
              <span className="hidden sm:inline">{t('movie_list', language) || '영화 회차 목록'}</span>
            </button>
          </div>
        }
      />

      {/* ── Movie Banner Info Header ── */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-sm border border-[rgba(15,0,0,0.12)] bg-gradient-to-r from-red-950 via-rose-950 to-neutral-900 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded bg-rose-600/30 border border-rose-500/40 text-rose-300 shrink-0 mt-0.5">
              <Film size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold tracking-wider text-rose-400 uppercase">
                  SNSHERO THE MOVIE
                </span>
                <span className="px-1.5 py-0.5 rounded-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
                  {releasedCount}화 공개 중
                </span>
                {isCheckingPlaylist && (
                  <span className="text-[10px] text-rose-300 animate-pulse font-mono">
                    (YouTube 최신 목록 확인 중...)
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-extrabold mt-0.5 text-neutral-100">
                {t('movie_subtitle', language) || '스펙터클한 SNSHero 극장판 영화 시리즈를 오피셜 플레이리스트로 감상하세요.'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => fetchLatestPlaylistStatus(false)}
              disabled={isCheckingPlaylist}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs font-bold transition active:scale-95 shrink-0 cursor-pointer"
            >
              <RefreshCw size={13} className={cn(isCheckingPlaylist && 'animate-spin')} />
              <span>{isCheckingPlaylist ? '동기화 중...' : '최신 회차 동기화'}</span>
            </button>
            <a
              href={getDirectYouTubeWatchUrl(currentEpisodeNum)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold transition active:scale-95 shrink-0 shadow-xs"
              title={`YouTube에서 제 ${currentEpisodeNum}화 직접 시청하기`}
            >
              <ExternalLink size={14} />
              <span>YouTube 제{currentEpisodeNum}화 바로보기</span>
            </a>
            <a
              href={YOUTUBE_PLAYLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-mono text-xs font-bold transition active:scale-95 shrink-0"
            >
              <List size={13} />
              <span>전체 재생목록</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Movie Player Section ── */}
      <div className="mb-6 space-y-3">
        <div
          ref={playerContainerRef}
          className={cn(
            'relative w-full rounded-sm overflow-hidden bg-black border border-[rgba(15,0,0,0.12)] shadow-md transition-all',
            isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none max-w-none' : 'aspect-video'
          )}
        >
          <iframe
            key={`movie-yt-player-ep-${currentEpisodeNum}-${currentVideoId || 'playlist'}`}
            id="movie-yt-player"
            src={embedUrl}
            title={`SNSHero Movie Ep.${currentEpisodeNum}`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />

          {/* Fullscreen Overlay Controls */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10 opacity-80 hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition cursor-pointer"
              title={isFullscreen ? '전체화면 종료' : '전체화면'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>

        {/* Player Controls & Episode Info Bar */}
        <div className="p-3 sm:p-4 rounded-sm border border-[rgba(15,0,0,0.12)] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-extrabold px-2 py-1 rounded bg-rose-100 text-rose-800 border border-rose-200">
              극장판 EP.{String(currentEpisodeNum).padStart(2, '0')}
            </span>
            {isCurrentReleased ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={12} />
                공개 완료
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <Clock size={12} />
                공개예정
              </span>
            )}
            <span className="text-xs font-bold text-[#201d1d] font-mono">
              {getEpisodeTitle(currentEpisodeNum).main}
              {getEpisodeTitle(currentEpisodeNum).sub && (
                <span className="text-[11px] text-stone-500 ml-1.5 font-normal">
                  ({getEpisodeTitle(currentEpisodeNum).sub})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
            {/* Direct YouTube Link Button */}
            <a
              href={getDirectYouTubeWatchUrl(currentEpisodeNum)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold font-mono transition cursor-pointer"
              title={`YouTube 앱/웹에서 제 ${currentEpisodeNum}화 직접 열기`}
            >
              <ExternalLink size={13} />
              <span className="hidden xs:inline">YouTube</span>
              <span>EP.{currentEpisodeNum}</span>
            </a>

            {/* Prev Ep */}
            <button
              type="button"
              disabled={currentEpisodeNum <= 1}
              onClick={() => handleSelectEpisode(currentEpisodeNum - 1)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-white hover:bg-[#f8f7f7] disabled:opacity-40 disabled:pointer-events-none text-xs font-bold font-mono transition cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>이전 화</span>
            </button>

            {/* Next Ep */}
            <button
              type="button"
              disabled={currentEpisodeNum >= TOTAL_EPISODES}
              onClick={() => handleSelectEpisode(currentEpisodeNum + 1)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] text-xs font-bold font-mono transition cursor-pointer",
                currentEpisodeNum + 1 > releasedCount
                  ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                  : "bg-white hover:bg-[#f8f7f7]"
              )}
            >
              <span>다음 화</span>
              {currentEpisodeNum + 1 > releasedCount ? <Lock size={14} className="text-amber-600" /> : <ChevronRight size={16} />}
            </button>

            {/* Reward Claim */}
            {isCurrentReleased && (
              <button
                type="button"
                disabled={currentRewardClaimed}
                onClick={() => handleClaimReward(currentEpisodeNum)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-xs font-bold transition cursor-pointer shrink-0',
                  currentRewardClaimed
                    ? 'bg-neutral-100 text-neutral-500 border border-neutral-200 cursor-default'
                    : 'bg-rose-600 text-white hover:bg-rose-700 shadow-2xs active:scale-95'
                )}
              >
                {currentRewardClaimed ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>보상 완료</span>
                  </>
                ) : (
                  <>
                    <Gift size={14} />
                    <span>시청 보상 (+100 SNS)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Episode Grid View (1 ~ 40화) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-extrabold text-[#201d1d]">
              전체 에피소드 ({TOTAL_EPISODES}부작)
            </h3>
            <span className="text-xs text-neutral-500 font-mono">
              (공개 {releasedCount} / 예정 {TOTAL_EPISODES - releasedCount})
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded border border-[rgba(15,0,0,0.12)] text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={cn('px-2 py-0.5 rounded transition cursor-pointer', filterMode === 'all' && 'bg-white font-bold shadow-2xs')}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('released')}
              className={cn('px-2 py-0.5 rounded transition cursor-pointer', filterMode === 'released' && 'bg-white font-bold text-emerald-700 shadow-2xs')}
            >
              공개 완료 ({releasedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('upcoming')}
              className={cn('px-2 py-0.5 rounded transition cursor-pointer', filterMode === 'upcoming' && 'bg-white font-bold text-amber-700 shadow-2xs')}
            >
              공개예정 ({TOTAL_EPISODES - releasedCount})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2">
          {Array.from({ length: TOTAL_EPISODES }, (_, i) => i + 1)
            .filter((ep) => {
              if (filterMode === 'released') return ep <= releasedCount;
              if (filterMode === 'upcoming') return ep > releasedCount;
              return true;
            })
            .map((ep) => {
              const isReleased = ep <= releasedCount;
              const isSelected = ep === currentEpisodeNum;
              const isClaimed = Boolean(claimedRewards[ep]);

              return (
                <button
                  key={ep}
                  type="button"
                  onClick={() => handleSelectEpisode(ep)}
                  className={cn(
                    'relative flex flex-col items-center justify-center p-2.5 rounded-sm border transition text-left cursor-pointer font-mono group',
                    isSelected && isReleased
                      ? 'border-rose-600 bg-rose-50 text-rose-950 font-extrabold ring-1 ring-rose-500'
                      : isReleased
                      ? 'border-[rgba(15,0,0,0.12)] bg-white hover:border-rose-300 hover:bg-rose-50/50 text-[#201d1d]'
                      : 'border-neutral-200 bg-neutral-100/80 text-neutral-400 hover:bg-neutral-100 hover:border-amber-300'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[11px] font-bold">
                      EP.{String(ep).padStart(2, '0')}
                    </span>
                    {isReleased ? (
                      <Play size={12} className={cn(isSelected ? 'text-rose-600 fill-current' : 'text-neutral-400 group-hover:text-rose-600')} />
                    ) : (
                      <Lock size={12} className="text-amber-500" />
                    )}
                  </div>

                  <div className="w-full text-center">
                    {isReleased ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                        공개 완료
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200/60">
                        공개예정
                      </span>
                    )}
                  </div>

                  {isClaimed && (
                    <span className="absolute top-1 right-1 text-emerald-600">
                      <CheckCircle2 size={10} />
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* ── Slide Drawer: Episode List ── */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md h-full bg-[#fdfcfc] border-l border-[rgba(15,0,0,0.12)] p-4 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(15,0,0,0.12)] mb-3">
                <div className="flex items-center gap-2">
                  <Film size={18} className="text-rose-600" />
                  <h3 className="font-mono text-base font-extrabold text-[#201d1d]">
                    영화 회차 목록 (40부작)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="p-1 rounded-sm hover:bg-[#f1eeee] text-[#201d1d] transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {Array.from({ length: TOTAL_EPISODES }, (_, i) => i + 1).map((ep) => {
                  const isReleased = ep <= releasedCount;
                  const isSelected = ep === currentEpisodeNum;
                  const isClaimed = Boolean(claimedRewards[ep]);

                  return (
                    <button
                      key={ep}
                      type="button"
                      onClick={() => handleSelectEpisode(ep)}
                      className={cn(
                        'w-full p-3 rounded-sm border text-left flex items-center justify-between transition cursor-pointer font-mono',
                        isSelected && isReleased
                          ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold ring-1 ring-rose-500'
                          : isReleased
                          ? 'border-[rgba(15,0,0,0.12)] bg-white hover:bg-rose-50/40 text-[#201d1d]'
                          : 'border-neutral-200 bg-neutral-100 text-neutral-400 hover:bg-neutral-150'
                      )}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-xs font-bold shrink-0">
                          EP.{String(ep).padStart(2, '0')}
                        </span>
                        <div className="flex flex-col truncate">
                          <span className="text-xs truncate font-medium">
                            {getEpisodeTitle(ep).main}
                          </span>
                          {getEpisodeTitle(ep).sub && (
                            <span className="text-[10px] text-stone-400 truncate font-normal">
                              {getEpisodeTitle(ep).sub}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isReleased ? (
                          <>
                            <a
                              href={getDirectYouTubeWatchUrl(ep)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title={`YouTube에서 제 ${ep}화 직접 시청하기`}
                              className="p-1 rounded hover:bg-rose-100 text-rose-600 transition"
                            >
                              <ExternalLink size={12} />
                            </a>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              공개 완료
                            </span>
                          </>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Lock size={10} />
                            공개예정
                          </span>
                        )}
                        {isClaimed && <CheckCircle2 size={14} className="text-emerald-600" />}
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
