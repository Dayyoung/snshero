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
  RefreshCw,
  Copy,
  ShoppingCart,
  BookOpen,
  Download
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { PageHeader } from '../components/PageHeader';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import { MOVIE_EPISODES } from '../content/movieEpisodeMapping';
import { CinematicMoviePlayer } from '../components/movie/CinematicMoviePlayer';

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
  showCustomAlert?: (title: string, message: string, autoCloseSeconds?: number) => void;
}

const TOTAL_EPISODES = 40;
const YOUTUBE_PLAYLIST_ID = 'PLOLtCtApKgp8';
const YOUTUBE_PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLOLtCtApKgp8';

// 기본 공개 완료 에피소드 기본값 (40부작 전편 100% 공개)
const DEFAULT_RELEASED_COUNT = 40;

export const MovieView: React.FC<MovieViewProps> = ({
  language,
  onNavigate,
  playSfx,
  currentSeason = 'season1',
  updateSns,
  showCustomAlert,
}) => {
  // 현재 시청 중인 에피소드 번호 (1~40) - URL 쿼리 파라미터(?ep=, ?episode=) 최우선 반영 및 [1, TOTAL_EPISODES] 클램핑
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined') {
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
    const saved = getSeasonItem('hero_movie_progress', currentSeason);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 || parsed > TOTAL_EPISODES ? 1 : Math.max(1, Math.min(TOTAL_EPISODES, parsed));
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
  const [playerMode, setPlayerMode] = useState<'cinematic' | 'mp4' | 'youtube'>('cinematic');

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
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
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
    if (epNum < 1 || epNum > TOTAL_EPISODES) return;
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
      let isAutoLoop = false;
      try {
        isAutoLoop = localStorage.getItem('hero_auto_loop_is_ranking') === 'true' ||
                     localStorage.getItem('hero_auto_loop_mode') !== null;
      } catch {}

      showCustomAlert(
        language === 'ko' ? '시청 보상 수령' : 'Reward Claimed',
        language === 'ko'
          ? `극장판 제 ${epNum}화 시청 완료 보상으로 100 SNS가 지급되었습니다!`
          : `Received 100 SNS for watching Movie Episode ${epNum}!`,
        isAutoLoop ? 2 : 3
      );
    }
  };

  const currentRewardClaimed = Boolean(claimedRewards[currentEpisodeNum]);
  const isCurrentReleased = currentEpisodeNum <= releasedCount;

  // Viral share state (hero_movie_viral_share_${todayStr})
  const todayStr = new Date().toISOString().split('T')[0];
  const [viralSharedToday, setViralSharedToday] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hero_movie_viral_share_${todayStr}`) === 'true';
    } catch {
      return false;
    }
  });
  const [shareToast, setShareToast] = useState<string | null>(null);

  const handleShareMovieChallenge = () => {
    triggerHaptic('tap');
    const shareUrl = `https://snshero.com/?ep=${currentEpisodeNum}&challenge=1-11-31-51-101`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    const shareKey = `hero_movie_viral_share_${todayStr}`;
    let alreadyShared = false;
    try {
      alreadyShared = localStorage.getItem(shareKey) === 'true';
    } catch {}

    if (!alreadyShared) {
      try {
        localStorage.setItem(shareKey, 'true');
      } catch {}
      setViralSharedToday(true);
      if (updateSns) {
        updateSns(50, language === 'ko' ? '극장판 영화 & 도전장 링크 공유 보상' : 'Movie & Challenge Link Share Reward');
      } else {
        try {
          const cur = parseInt(localStorage.getItem('hero_sns') || '500', 10);
          localStorage.setItem('hero_sns', String(cur + 50));
          window.dispatchEvent(new Event('hero_sns_updated'));
        } catch {}
      }
      triggerHaptic('victory');
      setShareToast(language === 'ko' ? '[v] 영화 & 도전장 링크 복사 완료 (+50 SNS 지급!)' : '[v] Movie & Duel Link Copied (+50 SNS!)');
      setTimeout(() => setShareToast(null), 2800);
    } else {
      setShareToast(language === 'ko' ? '[v] 영화 & 도전장 링크 복사 완료' : '[v] Movie & Duel Link Copied');
      setTimeout(() => setShareToast(null), 2400);
    }
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  // 극장판 에피소드 시청 시 미수령 보상 자동 지급 (수동 버튼 클릭 불필요)
  useEffect(() => {
    if (!claimedRewards[currentEpisodeNum] && isCurrentReleased) {
      const timer = setTimeout(() => {
        handleClaimReward(currentEpisodeNum);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentEpisodeNum, claimedRewards, isCurrentReleased]);

  // 에피소드 번호 기반 YouTube 임베드 URL (정확한 Video ID 우선, 없을 경우 0-based index 플레이리스트 폴백)
  const currentVideoId = getVideoId(currentEpisodeNum);
  const embedUrl = currentVideoId
    ? `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&rel=0&enablejsapi=1`
    : `https://www.youtube-nocookie.com/embed?listType=playlist&list=${YOUTUBE_PLAYLIST_ID}&index=${currentEpisodeNum - 1}&autoplay=1&rel=0&enablejsapi=1`;

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono p-3 sm:p-4 md:p-8 pb-32 max-w-5xl mx-auto w-full overflow-x-hidden">
      {shareToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100000] bg-[#201d1d] text-[#fdfcfc] text-xs px-4 py-2.5 rounded-none border border-[#201d1d] flex items-center gap-2 font-mono">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{shareToast}</span>
        </div>
      )}

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
              className="min-h-[44px] flex items-center gap-1 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-xs font-bold text-[#201d1d] hover:bg-[#f8f7f7] disabled:opacity-50 transition-colors cursor-pointer shrink-0 font-mono"
            >
              <RefreshCw size={14} className={cn(isCheckingPlaylist && 'animate-spin')} />
              <span className="hidden sm:inline">[동기화]</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-xs font-bold text-[#201d1d] hover:bg-[#f8f7f7] transition-colors cursor-pointer shrink-0 font-mono"
            >
              <List size={16} />
              <span className="hidden sm:inline">[{t('movie_list', language) || '영화 회차 목록'}]</span>
            </button>
          </div>
        }
      />



      {/* ── Movie Banner Info Header ── */}
      <div className="mb-4 sm:mb-6 p-4 rounded-none border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-sm bg-[#fdfcfc]/10 border border-[#fdfcfc]/20 text-[#fdfcfc] shrink-0 mt-0.5">
              <Film size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold tracking-wider text-[#fdfcfc] uppercase">
                  [SNSHERO THE MOVIE]
                </span>
                <span className="px-1.5 py-0.5 rounded-sm bg-[#fdfcfc] text-[#201d1d] text-[10px] font-bold font-mono">
                  {releasedCount}화 공개 중
                </span>
                {isCheckingPlaylist && (
                  <span className="text-[10px] text-[#fdfcfc]/80 font-mono">
                    (YouTube 최신 목록 확인 중...)
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold mt-1 text-[#fdfcfc]">
                {t('movie_subtitle', language) || '스펙터클한 SNSHero 극장판 영화 시리즈를 오피셜 플레이리스트로 감상하세요.'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => fetchLatestPlaylistStatus(false)}
              disabled={isCheckingPlaylist}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#201d1d] hover:bg-black border border-[#fdfcfc]/30 text-[#fdfcfc] font-mono text-xs font-bold transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw size={13} className={cn(isCheckingPlaylist && 'animate-spin')} />
              <span>{isCheckingPlaylist ? '동기화 중...' : '[최신 회차 동기화]'}</span>
            </button>
            <a
              href={getDirectYouTubeWatchUrl(currentEpisodeNum)}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] font-mono text-xs font-bold transition-colors shrink-0"
              title={`YouTube에서 제 ${currentEpisodeNum}화 직접 시청하기`}
            >
              <ExternalLink size={14} />
              <span>[YouTube 제{currentEpisodeNum}화 바로보기]</span>
            </a>
            <a
              href={YOUTUBE_PLAYLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#201d1d] hover:bg-black text-[#fdfcfc] border border-[#fdfcfc]/30 font-mono text-xs font-bold transition-colors shrink-0"
            >
              <List size={13} />
              <span>[전체 재생목록]</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Movie Player Section ── */}
      <div className="mb-6 space-y-3">
        {/* Playback Mode Switcher: Cinematic Player vs MP4 Video vs YouTube Stream */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setPlayerMode('cinematic');
            }}
            className={cn(
              'min-h-[44px] flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2 rounded-sm border font-mono text-xs font-bold transition-colors cursor-pointer',
              playerMode === 'cinematic'
                ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]'
                : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f8f7f7]'
            )}
          >
            <Sparkles size={16} className={playerMode === 'cinematic' ? 'text-amber-400' : 'text-amber-600'} />
            <span>[🎬 인터랙티브 영화관 (40부작)]</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setPlayerMode('mp4');
            }}
            className={cn(
              'min-h-[44px] flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2 rounded-sm border font-mono text-xs font-bold transition-colors cursor-pointer',
              playerMode === 'mp4'
                ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]'
                : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f8f7f7]'
            )}
          >
            <Film size={16} className={playerMode === 'mp4' ? 'text-amber-400' : 'text-stone-700'} />
            <span>[🎞️ MP4 비디오 상영]</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setPlayerMode('youtube');
            }}
            className={cn(
              'min-h-[44px] flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2 rounded-sm border font-mono text-xs font-bold transition-colors cursor-pointer',
              playerMode === 'youtube'
                ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]'
                : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f8f7f7]'
            )}
          >
            <Play size={16} />
            <span>[📺 YouTube 오피셜{currentEpisodeNum <= 8 ? '' : ' (1~8화)'}]</span>
          </button>
        </div>

        {playerMode === 'cinematic' ? (
          <CinematicMoviePlayer
            episodeNumber={currentEpisodeNum}
            titleKo={MOVIE_EPISODES[currentEpisodeNum]?.titleKo || `제 ${currentEpisodeNum}화`}
            titleEn={MOVIE_EPISODES[currentEpisodeNum]?.titleEn || `Episode ${currentEpisodeNum}`}
            titleJa={MOVIE_EPISODES[currentEpisodeNum]?.titleJa}
            language={language === 'en' ? 'en' : language === 'ja' ? 'ja' : 'ko'}
            onEpisodeComplete={(ep) => handleClaimReward(ep)}
            onSelectEpisode={(ep) => handleSelectEpisode(ep)}
            totalEpisodes={TOTAL_EPISODES}
          />
        ) : playerMode === 'mp4' ? (
          <div
            className={cn(
              'relative w-full rounded-none overflow-hidden bg-black border border-[#201d1d] flex flex-col items-center justify-center',
              isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none max-w-none' : 'aspect-video'
            )}
          >
            <video
              key={`mp4-video-ep-${currentEpisodeNum}`}
              src={`/videos/episodes/episode_${String(currentEpisodeNum).padStart(2, '0')}.mp4`}
              controls
              playsInline
              className="w-full h-full object-contain"
              poster={`/images/webtoon/episode_${String(currentEpisodeNum).padStart(2, '0')}/scene_00.webp`}
            >
              <p className="text-white text-xs font-mono p-4">
                브라우저가 HTML5 비디오를 지원하지 않습니다.
              </p>
            </video>

            {/* Top Bar with MP4 Download Button and Fullscreen */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <a
                href={`/videos/episodes/episode_${String(currentEpisodeNum).padStart(2, '0')}.mp4`}
                download={`SNSHero_Episode_${String(currentEpisodeNum).padStart(2, '0')}.mp4`}
                className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#201d1d] hover:bg-black text-[#fdfcfc] border border-[#fdfcfc]/30 font-mono text-xs font-bold transition-colors cursor-pointer shrink-0"
                title="MP4 비디오 파일 다운로드"
              >
                <Download size={14} />
                <span>[⬇️ MP4 다운로드]</span>
              </a>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="min-h-[44px] min-w-[44px] p-2 rounded-sm bg-[#201d1d] hover:bg-black text-[#fdfcfc] border border-[#fdfcfc]/30 transition-colors cursor-pointer flex items-center justify-center"
                title={isFullscreen ? '전체화면 종료' : '전체화면'}
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={playerContainerRef}
            className={cn(
              'relative w-full rounded-none overflow-hidden bg-black border border-[#201d1d] transition-colors',
              isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none max-w-none' : 'aspect-video'
            )}
          >
            {currentEpisodeNum <= 8 || currentVideoId ? (
              <iframe
                key={`movie-yt-player-ep-${currentEpisodeNum}-${currentVideoId || 'playlist'}`}
                id="movie-yt-player"
                src={embedUrl}
                title={`SNSHero Movie Ep.${currentEpisodeNum}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-stone-950 font-mono">
                <Sparkles size={36} className="text-amber-400 mb-3" />
                <h4 className="text-base font-bold mb-2">제 {currentEpisodeNum}화는 인앱 시네마틱 영화관 전용 상영작입니다</h4>
                <p className="text-xs text-stone-400 max-w-md mb-4">
                  유튜브 공식 영상은 1~8화까지 제공되며, 9~40화는 멀티플레인 연출과 사운드 엔진이 탑재된 [인터랙티브 영화관] 또는 [MP4 비디오]에서 감상하실 수 있습니다.
                </p>
                <button
                  type="button"
                  onClick={() => setPlayerMode('cinematic')}
                  className="min-h-[44px] flex items-center gap-2 px-5 py-2 rounded-sm border border-amber-500 bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>[시네마틱 영화관으로 전환하여 즉시 감상]</span>
                </button>
              </div>
            )}

            {/* Fullscreen Overlay Controls */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="min-h-[44px] min-w-[44px] p-2 rounded-sm bg-[#201d1d] hover:bg-black text-[#fdfcfc] border border-[#fdfcfc]/30 transition-colors cursor-pointer flex items-center justify-center"
                title={isFullscreen ? '전체화면 종료' : '전체화면'}
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* Player Controls & Episode Info Bar */}
        <div className="p-3 sm:p-4 rounded-none border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-1 rounded-sm bg-[#201d1d] text-[#fdfcfc]">
              극장판 EP.{String(currentEpisodeNum).padStart(2, '0')}
            </span>
            {isCurrentReleased ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                <CheckCircle2 size={12} />
                [v] 공개 완료
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                <Clock size={12} />
                [공개예정]
              </span>
            )}
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
            {/* Cross-Media Navigation: Novel & Webtoon */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('ep', currentEpisodeNum.toString());
                  window.history.replaceState(window.history.state, '', url.pathname + url.search);
                }
                onNavigate('novel');
              }}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-xs font-bold font-mono transition-colors cursor-pointer"
              title={`제 ${currentEpisodeNum}화 웹소설 읽기`}
            >
              <BookOpen size={14} className="text-amber-800" />
              <span>[📖 소설 {currentEpisodeNum}화]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('ep', currentEpisodeNum.toString());
                  window.history.replaceState(window.history.state, '', url.pathname + url.search);
                }
                onNavigate('webtoon');
              }}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-xs font-bold font-mono transition-colors cursor-pointer"
              title={`제 ${currentEpisodeNum}화 웹툰 보기`}
            >
              <Film size={14} className="text-blue-800" />
              <span>[🖼️ 웹툰 {currentEpisodeNum}화]</span>
            </button>

            {/* Direct YouTube Link Button */}
            <a
              href={getDirectYouTubeWatchUrl(currentEpisodeNum)}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] flex items-center gap-1 px-3 py-1.5 rounded-sm border border-[#201d1d] bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-xs font-bold font-mono transition-colors cursor-pointer"
              title={`YouTube 앱/웹에서 제 ${currentEpisodeNum}화 직접 열기`}
            >
              <ExternalLink size={13} />
              <span className="hidden xs:inline">YouTube</span>
              <span>EP.{currentEpisodeNum}</span>
            </a>

            {/* Direct MP4 Download Button */}
            <a
              href={`/videos/episodes/episode_${String(currentEpisodeNum).padStart(2, '0')}.mp4`}
              download={`SNSHero_Episode_${String(currentEpisodeNum).padStart(2, '0')}.mp4`}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] hover:bg-black text-xs font-bold font-mono transition-colors cursor-pointer"
              title={`제 ${currentEpisodeNum}화 MP4 비디오 파일 다운로드`}
            >
              <Download size={13} />
              <span>[MP4 다운]</span>
            </a>

            {/* Prev Ep */}
            <button
              type="button"
              disabled={currentEpisodeNum <= 1}
              onClick={() => handleSelectEpisode(currentEpisodeNum - 1)}
              className="min-h-[44px] flex items-center gap-1 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f1eeee] disabled:opacity-40 disabled:pointer-events-none text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>이전 화</span>
            </button>

            {/* Next Ep */}
            <button
              type="button"
              disabled={currentEpisodeNum >= TOTAL_EPISODES}
              onClick={() => handleSelectEpisode(currentEpisodeNum + 1)}
              className="min-h-[44px] flex items-center gap-1 px-3 py-1.5 rounded-sm border bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] hover:bg-[#201d1d]/90 text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <span>다음 화</span>
              <ChevronRight size={16} />
            </button>

            {/* Reward Claim Status */}
            {isCurrentReleased && (
              <div className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>{language === 'ko' ? '[v] 시청 보상 100 SNS 자동 지급 완료' : '[v] 100 SNS Auto-Awarded'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Episode Grid View (1 ~ 40화) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-bold text-[#201d1d]">
              [ 전체 에피소드 ({TOTAL_EPISODES}부작) ]
            </h3>
            <span className="text-xs text-[#646262] font-mono">
              (공개 {releasedCount} / 예정 {TOTAL_EPISODES - releasedCount})
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#f8f7f7] p-1 rounded-none border border-[rgba(15,0,0,0.12)] text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={cn('min-h-[44px] px-3.5 py-1.5 rounded-sm transition-colors cursor-pointer flex items-center justify-center', filterMode === 'all' ? 'bg-[#201d1d] text-[#fdfcfc] font-bold' : 'text-[#201d1d] hover:bg-[#f1eeee]')}
            >
              [전체]
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('released')}
              className={cn('min-h-[44px] px-3.5 py-1.5 rounded-sm transition-colors cursor-pointer flex items-center justify-center', filterMode === 'released' ? 'bg-[#201d1d] text-[#fdfcfc] font-bold' : 'text-[#201d1d] hover:bg-[#f1eeee]')}
            >
              [공개 완료 ({releasedCount})]
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('upcoming')}
              className={cn('min-h-[44px] px-3.5 py-1.5 rounded-sm transition-colors cursor-pointer flex items-center justify-center', filterMode === 'upcoming' ? 'bg-[#201d1d] text-[#fdfcfc] font-bold' : 'text-[#201d1d] hover:bg-[#f1eeee]')}
            >
              [공개예정 ({TOTAL_EPISODES - releasedCount})]
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
                    'min-h-[64px] relative flex flex-col items-center justify-center p-2.5 rounded-none border transition-colors text-left cursor-pointer font-mono group',
                    isSelected && isReleased
                      ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] font-bold'
                      : isReleased
                      ? 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:border-[#201d1d] hover:bg-[#f8f7f7] text-[#201d1d]'
                      : 'border-[rgba(15,0,0,0.12)] bg-[#f1eeee] text-[#646262]'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[11px] font-bold">
                      EP.{String(ep).padStart(2, '0')}
                    </span>
                    {isReleased ? (
                      <Play size={12} className={cn(isSelected ? 'text-[#fdfcfc] fill-current' : 'text-[#646262] group-hover:text-[#201d1d]')} />
                    ) : (
                      <Lock size={12} className="text-[#646262]" />
                    )}
                  </div>

                  <div className="w-full text-center">
                    {isReleased ? (
                      <span className={cn(
                        "inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-bold border",
                        isSelected ? "bg-[#fdfcfc] text-[#201d1d] border-[#fdfcfc]" : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      )}>
                        공개 완료
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-[#fdfcfc] text-[#646262] border border-[rgba(15,0,0,0.12)]">
                        공개예정
                      </span>
                    )}
                  </div>

                  {isClaimed && (
                    <span className={cn("absolute top-1 right-1", isSelected ? "text-emerald-300" : "text-emerald-600")}>
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
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md h-full bg-[#fdfcfc] border-l border-[#201d1d] p-4 flex flex-col rounded-none"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(15,0,0,0.12)] mb-3">
                <div className="flex items-center gap-2">
                  <Film size={18} className="text-[#201d1d]" />
                  <h3 className="font-mono text-base font-bold text-[#201d1d]">
                    [ 영화 회차 목록 (40부작) ]
                  </h3>
                </div>
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
                  const isReleased = ep <= releasedCount;
                  const isSelected = ep === currentEpisodeNum;
                  const isClaimed = Boolean(claimedRewards[ep]);

                  return (
                    <button
                      key={ep}
                      type="button"
                      onClick={() => handleSelectEpisode(ep)}
                      className={cn(
                        'min-h-[48px] w-full p-3 rounded-sm border text-left flex items-center justify-between transition-colors cursor-pointer font-mono',
                        isSelected && isReleased
                          ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] font-bold'
                          : isReleased
                          ? 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f8f7f7] text-[#201d1d]'
                          : 'border-[rgba(15,0,0,0.12)] bg-[#f1eeee] text-[#646262]'
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
                            <span className={cn("text-[10px] truncate font-normal", isSelected ? "text-[#fdfcfc]/70" : "text-[#646262]")}>
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
                              className={cn("min-h-[44px] min-w-[44px] flex items-center justify-center p-1 rounded-sm transition-colors", isSelected ? "text-[#fdfcfc]" : "text-[#201d1d] hover:bg-[#f1eeee]")}
                            >
                              <ExternalLink size={14} />
                            </a>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-sm text-[10px] font-bold border",
                              isSelected ? "bg-[#fdfcfc] text-[#201d1d] border-[#fdfcfc]" : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            )}>
                              공개 완료
                            </span>
                          </>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-[#fdfcfc] text-[#646262] border border-[rgba(15,0,0,0.12)] flex items-center gap-1">
                            <Lock size={10} />
                            공개예정
                          </span>
                        )}
                        {isClaimed && <CheckCircle2 size={14} className={isSelected ? "text-emerald-300" : "text-emerald-600"} />}
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
