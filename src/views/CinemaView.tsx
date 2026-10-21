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
import { MOVIE_EPISODES } from '../content/movieEpisodeMapping';

interface CinemaViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx?: (url: string) => void;
  currentSeason?: string;
  updateSns?: (amount: number, reason?: string) => void;
  showCustomAlert?: (title: string, message: string, autoCloseSeconds?: number) => void;
}

const TOTAL_EPISODES = 40;
const YOUTUBE_PLAYLIST_ID = 'PLMdirwPt_FHU';
const YOUTUBE_PLAYLIST_URL = 'https://www.youtube.com/watch?v=P5KotZjJiZ8&list=PLMdirwPt_FHU';
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
            const ids = data.items
              .map((item: any) => item?.snippet?.resourceId?.videoId)
              .filter(Boolean);
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
      } catch {
        // ignore
      }
    }
  }, [currentEpisodeNum, currentSeason]);

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

  const currentVideoId = getVideoId(currentEpisodeNum) || 'P5KotZjJiZ8';
  const embedUrl = `https://www.youtube.com/embed/${currentVideoId}?list=${YOUTUBE_PLAYLIST_ID}&autoplay=1&rel=0`;

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

      {/* ── YouTube Movie Player Only ── */}
      <div className="mb-5 w-full">
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
              disabled={currentEpisodeNum >= TOTAL_EPISODES}
              onClick={() => handleSelectEpisode(currentEpisodeNum + 1)}
              className="min-h-[44px] flex items-center gap-1 px-3 py-1.5 rounded-sm border bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] hover:bg-black text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <span>다음 화</span>
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
