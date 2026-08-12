import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Tv,
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
  Info,
  Maximize,
  Minimize
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { PageHeader } from '../components/PageHeader';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

interface AnimeViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx?: (url: string) => void;
  currentSeason?: string;
  updateSns?: (amount: number, reason?: string) => void;
  showCustomAlert?: (title: string, message: string) => void;
}

const TOTAL_EPISODES = 40;
const YOUTUBE_PLAYLIST_ID = 'PLM4FMYy7mS8w';
const YOUTUBE_PLAYLIST_URL = 'https://youtube.com/playlist?list=PLM4FMYy7mS8w&si=DvP5SUT70GNOAq2g';

export const AnimeView: React.FC<AnimeViewProps> = ({
  language,
  onNavigate,
  playSfx,
  currentSeason = 'season1',
  updateSns,
  showCustomAlert,
}) => {
  // 현재 시청 중인 에피소드 번호 (1~40)
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState<number>(() => {
    const saved = getSeasonItem('hero_anime_progress', currentSeason);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 || parsed > TOTAL_EPISODES ? 1 : parsed;
  });

  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);

  // YouTube IFrame API Initializer
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

    const initYTPlayer = () => {
      if (window.YT && window.YT.Player && !playerRef.current) {
        try {
          playerRef.current = new window.YT.Player('anime-yt-player', {
            events: {
              onReady: (event: any) => {
                if (!isMounted) return;
                setIsPlayerReady(true);
                try {
                  event.target.cuePlaylist({
                    listType: 'playlist',
                    list: YOUTUBE_PLAYLIST_ID,
                    index: currentEpisodeNum - 1,
                  });
                } catch (err) {
                  console.warn("Cue playlist error:", err);
                }
              },
            },
          });
        } catch (e) {
          console.warn("Init YT player error:", e);
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
  }, []);

  // Sync player episode when currentEpisodeNum changes
  useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      try {
        if (typeof playerRef.current.playVideoAt === 'function') {
          playerRef.current.playVideoAt(currentEpisodeNum - 1);
        } else if (typeof playerRef.current.loadPlaylist === 'function') {
          playerRef.current.loadPlaylist({
            listType: 'playlist',
            list: YOUTUBE_PLAYLIST_ID,
            index: currentEpisodeNum - 1,
          });
        }
      } catch (err) {
        console.warn("Failed to switch playlist episode via YT API:", err);
      }
    }

    // Explicitly purge unreferenced chapter image/media buffers to maintain RAM footprint under 80MB
    return () => {
      const cachedImages = document.querySelectorAll('img[data-webtoon-chapter]');
      cachedImages.forEach((el) => {
        const img = el as HTMLImageElement;
        img.src = '';
        img.removeAttribute('src');
      });
    };
  }, [currentEpisodeNum, isPlayerReady]);

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
          console.error("Fullscreen error:", err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error("Exit fullscreen error:", err);
        });
      }
    }
  };

  // 시청 완료 보상 수령 상태 (에피소드별)
  const [claimedRewards, setClaimedRewards] = useState<Record<number, boolean>>(() => {
    try {
      const saved = getSeasonItem('hero_anime_claimed_episodes', currentSeason);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 에피소드 변경 시 진행도 저장
  useEffect(() => {
    setSeasonItem('hero_anime_progress', currentEpisodeNum.toString(), currentSeason);
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
    setSeasonItem('hero_anime_claimed_episodes', JSON.stringify(newClaimed), currentSeason);

    if (updateSns) {
      updateSns(100, `Anime Ep.${epNum} Watch Reward`);
    }

    if (playSfx) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    }

    if (showCustomAlert) {
      showCustomAlert(
        language === 'ko' ? '시청 보상 수령' : 'Reward Claimed',
        language === 'ko'
          ? `제 ${epNum}화 시청 완료 보상으로 100 SNS가 지급되었습니다!`
          : `Received 100 SNS for watching Episode ${epNum}!`
      );
    }
  };

  const currentRewardClaimed = Boolean(claimedRewards[currentEpisodeNum]);

  // 에피소드 번호 기반 YouTube 임베드 URL (index=0이 1화)
  const embedUrl = `https://www.youtube-nocookie.com/embed?listType=playlist&list=${YOUTUBE_PLAYLIST_ID}&index=${currentEpisodeNum - 1}&enablejsapi=1&rel=0`;

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfcfc] text-[#201d1d] font-sans p-3 sm:p-4 md:p-8 pb-32 max-w-5xl mx-auto w-full overflow-x-hidden">
      {/* ── Page Header ── */}
      <PageHeader
        title={t('anime_title', language) || 'SNSHero 애니메이션 (40부작)'}
        onBack={() => onNavigate('home')}
        rightAction={
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-white text-xs font-bold text-[#201d1d] hover:bg-[#f8f7f7] transition-colors cursor-pointer touch-target shrink-0"
          >
            <List size={16} />
            <span className="hidden sm:inline">{t('anime_list', language) || '회차 목록'}</span>
            <span className="sm:hidden">{currentEpisodeNum}화</span>
          </button>
        }
      />

      {/* ── Subtitle / Intro Banner ── */}
      <div className="mt-3 sm:mt-4 mb-4 sm:mb-6 p-3 sm:p-4 rounded-sm border border-[rgba(15,0,0,0.12)] bg-gradient-to-r from-purple-900/10 via-fuchsia-900/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-purple-500/30 bg-purple-500/10 text-purple-600">
            <Tv size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold font-mono text-[#201d1d] truncate">
              {language === 'ko' ? `제 ${currentEpisodeNum}화 / 총 ${TOTAL_EPISODES}화` : `Episode ${currentEpisodeNum} / Total ${TOTAL_EPISODES}`}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 break-words line-clamp-2 sm:line-clamp-none">
              {t('anime_subtitle', language) || 'SNSHero의 세계관과 펼쳐지는 영웅들의 이야기를 동영상으로 감상하세요.'}
            </p>
          </div>
        </div>

        {/* 유튜브 원본 플레이리스트 링크 */}
        <a
          href={YOUTUBE_PLAYLIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-all shrink-0 cursor-pointer w-full sm:w-auto"
        >
          <span>{t('anime_playlist_link', language) || '유튜브에서 보기'}</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* ── Main Video Player Container (Embedded 16:9) ── */}
      <div
        ref={playerContainerRef}
        className={cn(
          "relative w-full aspect-video rounded-sm border-2 border-[#201d1d] bg-black shadow-xl overflow-hidden mb-4 sm:mb-6 group transition-all",
          isFullscreen && "fixed inset-0 z-[99999] rounded-none border-0 aspect-none h-screen w-screen mb-0"
        )}
      >
        <iframe
          id="anime-yt-player"
          key={currentEpisodeNum}
          src={embedUrl}
          title={`SNSHero Animation Episode ${currentEpisodeNum}`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />

        {/* Video Player Top-Right Fullscreen Quick Overlay Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-black/75 hover:bg-black/90 text-white text-xs font-bold border border-white/20 backdrop-blur-xs shadow-md transition-all opacity-80 group-hover:opacity-100 active:scale-95 cursor-pointer touch-target"
          title={isFullscreen ? (t('anime_exit_fullscreen', language) || '전체화면 종료') : (t('anime_fullscreen', language) || '전체화면 보기')}
          aria-label={isFullscreen ? (t('anime_exit_fullscreen', language) || '전체화면 종료') : (t('anime_fullscreen', language) || '전체화면 보기')}
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          <span className="hidden sm:inline">{isFullscreen ? (t('anime_exit_fullscreen', language) || '전체화면 종료') : (t('anime_fullscreen', language) || '전체화면 보기')}</span>
        </button>
      </div>

      {/* ── Control Bar & Rewards ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-sm border border-[rgba(15,0,0,0.12)] bg-white shadow-xs w-full overflow-hidden">
        {/* 이전 화 / 다음 화 이동 버튼 & 전체화면 버튼 */}
        <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={currentEpisodeNum <= 1}
            onClick={() => handleSelectEpisode(currentEpisodeNum - 1)}
            className={cn(
              "flex items-center justify-center gap-1 px-2 py-2 sm:px-4 sm:py-2.5 rounded-sm border text-xs font-bold transition-all cursor-pointer touch-target",
              currentEpisodeNum <= 1
                ? "border-slate-200 text-slate-300 cursor-not-allowed"
                : "border-[rgba(15,0,0,0.12)] bg-white text-[#201d1d] hover:bg-[#f8f7f7] active:scale-95"
            )}
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">{t('anime_prev_ep', language) || '이전 화'}</span>
            <span className="sm:hidden">{language === 'ko' ? '이전' : 'Prev'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="flex items-center justify-center gap-1 px-2 py-2 sm:px-3 sm:py-2.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-all cursor-pointer font-mono touch-target"
          >
            <span>{currentEpisodeNum} / {TOTAL_EPISODES}</span>
            <List size={14} className="hidden sm:inline" />
          </button>

          <button
            type="button"
            disabled={currentEpisodeNum >= TOTAL_EPISODES}
            onClick={() => handleSelectEpisode(currentEpisodeNum + 1)}
            className={cn(
              "flex items-center justify-center gap-1 px-2 py-2 sm:px-4 sm:py-2.5 rounded-sm border text-xs font-bold transition-all cursor-pointer touch-target",
              currentEpisodeNum >= TOTAL_EPISODES
                ? "border-slate-200 text-slate-300 cursor-not-allowed"
                : "border-[rgba(15,0,0,0.12)] bg-white text-[#201d1d] hover:bg-[#f8f7f7] active:scale-95"
            )}
          >
            <span className="hidden sm:inline">{t('anime_next_ep', language) || '다음 화'}</span>
            <span className="sm:hidden">{language === 'ko' ? '다음' : 'Next'}</span>
            <ChevronRight size={16} />
          </button>

          {/* Dedicated Control Bar Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center justify-center gap-1 px-2 py-2 sm:px-3.5 sm:py-2.5 rounded-sm border border-purple-500/30 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-all cursor-pointer touch-target shadow-xs"
            title={isFullscreen ? (t('anime_exit_fullscreen', language) || '전체화면 종료') : (t('anime_fullscreen', language) || '전체화면 보기')}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            <span className="hidden md:inline">{isFullscreen ? (t('anime_exit_fullscreen', language) || '전체화면 종료') : (t('anime_fullscreen', language) || '전체화면 보기')}</span>
          </button>
        </div>

        {/* 시청 보상 수령 버튼 */}
        <button
          type="button"
          disabled={currentRewardClaimed}
          onClick={() => handleClaimReward(currentEpisodeNum)}
          className={cn(
            "w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm font-bold text-xs transition-all touch-target cursor-pointer shadow-xs shrink-0",
            currentRewardClaimed
              ? "border border-emerald-300 bg-emerald-50 text-emerald-700 cursor-default"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 active:scale-95"
          )}
        >
          {currentRewardClaimed ? (
            <>
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{t('anime_reward_claimed', language) || '보상 수령 완료'}</span>
            </>
          ) : (
            <>
              <Gift size={16} className="animate-bounce shrink-0" />
              <span>{t('anime_reward_claim', language) || '시청 보상 수령 (+100 SNS)'}</span>
            </>
          )}
        </button>
      </div>

      {/* ── 에피소드 전체 그리드 목록 (하단 카드 세션) ── */}
      <div className="mt-6 sm:mt-8 w-full">
        <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-[rgba(15,0,0,0.12)] pb-2">
          <h3 className="font-bold font-mono text-xs sm:text-sm uppercase text-[#201d1d] flex items-center gap-2">
            <List size={16} className="text-purple-600 shrink-0" />
            <span>{language === 'ko' ? '전체 40부작 에피소드' : 'All 40 Episodes'}</span>
          </h3>
          <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-500">
            {language === 'ko' ? `보상: ${Object.keys(claimedRewards).length} / ${TOTAL_EPISODES}` : `Rewards: ${Object.keys(claimedRewards).length} / ${TOTAL_EPISODES}`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 w-full">
          {Array.from({ length: TOTAL_EPISODES }, (_, i) => i + 1).map((epNum) => {
            const isCurrent = epNum === currentEpisodeNum;
            const isClaimed = Boolean(claimedRewards[epNum]);

            return (
              <button
                key={epNum}
                type="button"
                onClick={() => handleSelectEpisode(epNum)}
                className={cn(
                  "flex flex-col justify-between p-2.5 sm:p-3 rounded-sm border text-left transition-all cursor-pointer relative group min-w-0",
                  isCurrent
                    ? "border-purple-600 bg-purple-50/80 shadow-sm"
                    : "border-[rgba(15,0,0,0.12)] bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className={cn(
                    "text-xs font-bold font-mono truncate",
                    isCurrent ? "text-purple-700" : "text-[#201d1d]"
                  )}>
                    {language === 'ko' ? `제 ${epNum}화` : `Ep. ${epNum}`}
                  </span>
                  {isClaimed && (
                    <Award size={14} className="text-emerald-600 shrink-0" />
                  )}
                </div>

                <div className="mt-2 sm:mt-3 flex items-center justify-between text-[11px] text-slate-500 w-full">
                  <span className="truncate">{isCurrent ? (language === 'ko' ? '시청 중' : 'Watching') : (language === 'ko' ? '재생' : 'Play')}</span>
                  {isCurrent && <Play size={12} className="text-purple-600 fill-purple-600 animate-pulse shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Episode List Drawer / Modal ── */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
            onClick={() => setShowDrawer(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-sm border border-[rgba(15,0,0,0.12)] p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[rgba(15,0,0,0.12)] mb-3 sm:mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Tv size={20} className="text-purple-600 shrink-0" />
                  <h3 className="font-bold font-mono text-sm sm:text-base text-[#201d1d] truncate">
                    {language === 'ko' ? '에피소드 선택 (총 40화)' : 'Select Episode (Total 40)'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="p-1 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pr-1">
                {Array.from({ length: TOTAL_EPISODES }, (_, i) => i + 1).map((epNum) => {
                  const isCurrent = epNum === currentEpisodeNum;
                  const isClaimed = Boolean(claimedRewards[epNum]);

                  return (
                    <button
                      key={epNum}
                      type="button"
                      onClick={() => handleSelectEpisode(epNum)}
                      className={cn(
                        "p-2.5 sm:p-3 rounded-sm border text-left flex items-center justify-between transition-all cursor-pointer font-mono text-xs min-w-0",
                        isCurrent
                          ? "border-purple-600 bg-purple-600 text-white font-bold shadow-sm"
                          : "border-[rgba(15,0,0,0.12)] bg-white hover:bg-slate-50 text-[#201d1d]"
                      )}
                    >
                      <span className="truncate">{language === 'ko' ? `제 ${epNum}화` : `Ep. ${epNum}`}</span>
                      {isClaimed && (
                        <Award size={14} className={cn("shrink-0", isCurrent ? "text-amber-300" : "text-emerald-600")} />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

