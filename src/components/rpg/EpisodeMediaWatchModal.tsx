import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Film, CheckCircle2, Sparkles, Play, ArrowRight } from 'lucide-react';
import { MOVIE_EPISODES } from '../../content/movieEpisodeMapping';
import { CARD_DATABASE } from '../../cardDatabase';
import { t } from '../../lib/i18n';
import { cn, getAssetUrl } from '../../lib/utils';
import {
  loadKadanArtStyleMode,
  resolveKadanArtStyleUrl,
  saveKadanArtStyleMode,
  type KadanArtStyleMode,
} from '../../hooks/useKadanRpgProgress';
import type { Language } from '../../types';
import type { KadanRpgReward } from '../../content/kadanRpgStory';

export const EPISODE_MEDIA_WATCH_REWARD_SNS = 100;

interface EpisodeMediaWatchModalProps {
  chapterNumber: number;
  language: Language;
  artStyleMode?: KadanArtStyleMode;
  onChangeArtStyleMode?: (mode: KadanArtStyleMode) => void;
  chapterReward?: KadanRpgReward | null;
  chapterRewardSnsTotal?: number;
  onClaimWatchReward: (mediaType: 'anime' | 'movie', chapterNumber: number) => Promise<void> | void;
  onProceedNext: () => void;
}

export const EpisodeMediaWatchModal: React.FC<EpisodeMediaWatchModalProps> = ({
  chapterNumber,
  language,
  artStyleMode: propArtStyleMode,
  onChangeArtStyleMode,
  chapterReward,
  chapterRewardSnsTotal,
  onClaimWatchReward,
  onProceedNext,
}) => {
  const isKo = language === 'ko';
  const safeChapter = Math.max(1, Math.min(40, chapterNumber || 1));
  const epMeta = MOVIE_EPISODES[safeChapter] ?? MOVIE_EPISODES[1];

  const [localArtStyleMode, setLocalArtStyleMode] = useState<KadanArtStyleMode>(() =>
    propArtStyleMode ?? loadKadanArtStyleMode()
  );
  const artStyleMode = propArtStyleMode ?? localArtStyleMode;

  useEffect(() => {
    if (propArtStyleMode) {
      setLocalArtStyleMode(propArtStyleMode);
    }
  }, [propArtStyleMode]);

  const handleSetArtStyle = useCallback(
    (mode: KadanArtStyleMode) => {
      const saved = saveKadanArtStyleMode(mode);
      setLocalArtStyleMode(saved);
      onChangeArtStyleMode?.(saved);
    },
    [onChangeArtStyleMode]
  );

  const episodePreviewUrl = getAssetUrl(
    resolveKadanArtStyleUrl(
      `/images/storybook/ep_${String(safeChapter).padStart(2, '0')}/page_01.webp`,
      artStyleMode
    )
  );

  const episodeTitle = isKo
    ? epMeta.titleKo
    : language === 'ja'
    ? epMeta.titleJa
    : epMeta.titleEn;

  const baseOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://snshero.com';

  const animeEpisodeUrl = `${baseOrigin}/animation?ep=${safeChapter}`;
  const movieEpisodeUrl = `${baseOrigin}/cinema?ep=${safeChapter}`;
  const displayAnimeUrl = `https://snshero.com/animation?ep=${safeChapter}`;
  const displayMovieUrl = `https://snshero.com/cinema?ep=${safeChapter}`;

  const TOTAL_COUNTDOWN_MS = 3000;
  const [timeLeftMs, setTimeLeftMs] = useState<number>(TOTAL_COUNTDOWN_MS);
  const [watchState, setWatchState] = useState<'countdown' | 'watching' | 'rewarded'>('countdown');
  const [selectedMedia, setSelectedMedia] = useState<'anime' | 'movie'>('anime');
  const [lastOpenedUrl, setLastOpenedUrl] = useState<string>(animeEpisodeUrl);

  const hasProceededRef = useRef(false);
  const hasRewardedRef = useRef(false);
  const watchOpenedAtRef = useRef<number>(0);
  const pageHiddenAfterOpenRef = useRef<boolean>(false);
  const onProceedNextRef = useRef(onProceedNext);
  onProceedNextRef.current = onProceedNext;

  const safeProceedNext = useCallback(() => {
    if (hasProceededRef.current) return;
    hasProceededRef.current = true;
    onProceedNextRef.current();
  }, []);

  const completeWatchAndGrantReward = useCallback(async () => {
    if (hasRewardedRef.current) return;
    hasRewardedRef.current = true;
    setWatchState('rewarded');

    try {
      await onClaimWatchReward(selectedMedia, safeChapter);
    } catch {}

    window.setTimeout(() => {
      safeProceedNext();
    }, 900);
  }, [onClaimWatchReward, safeChapter, safeProceedNext, selectedMedia]);

  // 3-second countdown when user has NOT clicked any video button
  useEffect(() => {
    if (watchState !== 'countdown') return;

    const deadline = Date.now() + TOTAL_COUNTDOWN_MS;
    setTimeLeftMs(TOTAL_COUNTDOWN_MS);

    const intervalId = window.setInterval(() => {
      const remaining = Math.max(0, deadline - Date.now());
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        window.clearInterval(intervalId);
        safeProceedNext();
      }
    }, 50);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [safeProceedNext, watchState]);

  // Detect when user returns from watching the episode in the new window/tab
  useEffect(() => {
    if (watchState !== 'watching') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pageHiddenAfterOpenRef.current = true;
      } else if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - watchOpenedAtRef.current;
        if (pageHiddenAfterOpenRef.current || elapsed >= 1000) {
          void completeWatchAndGrantReward();
        }
      }
    };

    const handleWindowFocus = () => {
      const elapsed = Date.now() - watchOpenedAtRef.current;
      if (pageHiddenAfterOpenRef.current || elapsed >= 1000) {
        void completeWatchAndGrantReward();
      }
    };

    const handlePageShow = () => {
      const elapsed = Date.now() - watchOpenedAtRef.current;
      if (pageHiddenAfterOpenRef.current || elapsed >= 1000) {
        void completeWatchAndGrantReward();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [completeWatchAndGrantReward, watchState]);

  const handleOpenMediaLink = (url: string, mediaType: 'anime' | 'movie') => {
    setSelectedMedia(mediaType);
    setLastOpenedUrl(url);
    watchOpenedAtRef.current = Date.now();
    pageHiddenAfterOpenRef.current = false;
    setWatchState('watching');

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = url;
    }
  };

  const remainingSecondsText = (timeLeftMs / 1000).toFixed(1);
  const remainingCeilSeconds = Math.max(1, Math.ceil(timeLeftMs / 1000));
  const progressPercent = Math.max(0, Math.min(100, (timeLeftMs / TOTAL_COUNTDOWN_MS) * 100));

  return (
    <div
      className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/80 p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] font-mono select-none"
      role="dialog"
      aria-modal="true"
      aria-label={isKo ? `제 ${safeChapter}화 종료 미디어 보상 안내` : `Episode ${safeChapter} Media Reward`}
    >
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-none border border-[#201d1d] bg-[#fdfcfc] text-[#201d1d]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#201d1d] bg-[#201d1d] px-4 py-3 text-[#fdfcfc] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Film size={18} className="text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 truncate">
                {`[EPISODE ${String(safeChapter).padStart(2, '0')} CLEAR · MEDIA REWARD]`}
              </p>
              <h3 className="text-sm sm:text-base font-bold truncate">
                {isKo
                  ? `제 ${safeChapter}화 종료 · 애니/무비 시청 보상 안내`
                  : `EP.${safeChapter} Cleared · Watch Anime/Movie for Bonus`}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={safeProceedNext}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-bold text-[#fdfcfc] transition-colors cursor-pointer shrink-0"
            aria-label={isKo ? '닫기 및 다음 회차 이동' : 'Close and Next Episode'}
            title={isKo ? '다음 회차로 이동' : 'Next Episode'}
          >
            [x]
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Chapter Clear Base Reward Summary (if any) */}
          {chapterReward && (
            <div className="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-3 rounded-none space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-[#201d1d]">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600 shrink-0" />
                  <span>{isKo ? '회차 클리어 기본 보상 지급 완료' : 'Episode Clear Base Reward Claimed'}</span>
                </span>
                <span className="text-amber-700 font-bold">
                  +{chapterRewardSnsTotal ?? chapterReward.sns} SNS
                </span>
              </div>
              {chapterReward.cardIds.length > 0 && (
                <p className="text-[11px] font-semibold text-[#646262] truncate">
                  {t('kadan_rpg_reward_cards', language, {
                    cards: chapterReward.cardIds
                      .map((cid) => {
                        const c = CARD_DATABASE[cid];
                        return isKo ? c?.title : c?.title_en;
                      })
                      .filter(Boolean)
                      .join(', '),
                  })}
                </p>
              )}
            </div>
          )}

          {/* Episode Title & Watch Reward Guidance Box */}
          <div className="border border-[#201d1d] bg-[#f8f7f7] p-3.5 sm:p-4 rounded-none space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="inline-block px-2 py-0.5 text-[11px] font-bold bg-[#201d1d] text-[#fdfcfc] rounded-sm">
                  {isKo ? `제 ${safeChapter}화 공식 영상` : `EP.${safeChapter} OFFICIAL MEDIA`}
                </span>
                <div className="inline-flex items-center rounded-sm border border-[#201d1d] bg-[#fdfcfc] p-0.5">
                  <button
                    type="button"
                    onClick={() => handleSetArtStyle('animation')}
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-bold rounded-sm cursor-pointer transition-colors',
                      artStyleMode === 'animation'
                        ? 'bg-[#201d1d] text-[#fdfcfc]'
                        : 'text-[#646262] hover:text-[#201d1d]'
                    )}
                  >
                    🎨 {isKo ? '애니' : 'Anime'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetArtStyle('liveaction')}
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-bold rounded-sm cursor-pointer transition-colors',
                      artStyleMode === 'liveaction'
                        ? 'bg-amber-400 text-[#201d1d]'
                        : 'text-[#646262] hover:text-[#201d1d]'
                    )}
                  >
                    🎬 {isKo ? '무비' : 'Movie'}
                  </button>
                </div>
              </div>
              <span className="inline-block px-2 py-0.5 text-xs font-bold bg-amber-500 text-[#201d1d] rounded-sm border border-[#201d1d]">
                +{EPISODE_MEDIA_WATCH_REWARD_SNS} SNS {isKo ? '보상' : 'BONUS'}
              </span>
            </div>

            <div className="relative w-full aspect-video overflow-hidden rounded-none border border-[#201d1d] bg-stone-950">
              <img
                src={episodePreviewUrl}
                alt={episodeTitle}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-black rounded-sm border border-stone-900 bg-amber-400 text-stone-950">
                {artStyleMode === 'liveaction'
                  ? isKo
                    ? '🎬 무비(실사) 스틸컷'
                    : '🎬 MOVIE STILL'
                  : isKo
                  ? '🎨 애니메이션 스틸컷'
                  : '🎨 ANIME STILL'}
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-bold text-[#201d1d]">
              {isKo ? `제 ${safeChapter}화: ${episodeTitle}` : `EP.${safeChapter}: ${episodeTitle}`}
            </h4>

            <p className="text-xs sm:text-sm font-semibold leading-relaxed text-[#201d1d]">
              {isKo
                ? `이번 회차(제 ${safeChapter}화)의 애니메이션 또는 무비를 시청하면 특별 보상(+${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS)이 지급됩니다! 아래 버튼을 클릭하면 해당 회차 시청 페이지가 새 창으로 열리며, 동영상을 보고 돌아오면 보상이 즉시 지급됩니다.`
                : `Watch Episode ${safeChapter}'s Animation or Movie to receive a special +${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS reward! Click below to open the episode page in a new window, and return to claim your reward.`}
            </p>
          </div>

          {/* Action Buttons: Open /animation?ep=N and /cinema?ep=N in New Window */}
          {watchState === 'countdown' && (
            <div className="space-y-2.5">
              {/* 1. Animation (/animation?ep=N) */}
              <button
                type="button"
                onClick={() => handleOpenMediaLink(animeEpisodeUrl, 'anime')}
                className="w-full min-h-[54px] px-4 py-3 bg-[#201d1d] hover:bg-[#332e2e] text-[#fdfcfc] font-bold text-xs sm:text-sm rounded-sm border border-[#201d1d] flex items-center justify-between gap-2 cursor-pointer transition-colors text-left"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="flex items-center gap-2 truncate">
                    <Play size={16} className="text-amber-400 shrink-0" />
                    <span className="truncate">
                      {isKo
                        ? `[🎬 제 ${safeChapter}화 애니메이션 시청 (+${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS)]`
                        : `[🎬 Watch EP.${safeChapter} Animation (+${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS)]`}
                    </span>
                  </span>
                  <span className="text-[10px] text-stone-300 font-normal truncate pl-6">
                    {displayAnimeUrl}
                  </span>
                </div>
                <ExternalLink size={15} className="shrink-0 opacity-80" />
              </button>

              {/* 2. Movie / Cinema (/cinema?ep=N) */}
              <button
                type="button"
                onClick={() => handleOpenMediaLink(movieEpisodeUrl, 'movie')}
                className="w-full min-h-[54px] px-4 py-3 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] font-bold text-xs sm:text-sm rounded-sm border border-[#201d1d] flex items-center justify-between gap-2 cursor-pointer transition-colors text-left"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="flex items-center gap-2 truncate">
                    <Film size={16} className="text-[#201d1d] shrink-0" />
                    <span className="truncate">
                      {isKo
                        ? `[🎥 제 ${safeChapter}화 무비 시청 (+${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS)]`
                        : `[🎥 Watch EP.${safeChapter} Movie (+${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS)]`}
                    </span>
                  </span>
                  <span className="text-[10px] text-[#646262] font-normal truncate pl-6">
                    {displayMovieUrl}
                  </span>
                </div>
                <ExternalLink size={15} className="shrink-0 opacity-80" />
              </button>
            </div>
          )}

          {/* Watching State: Waiting for user to return from the new window/tab */}
          {watchState === 'watching' && (
            <div className="border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] p-4 rounded-none space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                <Film size={18} className="text-amber-400 shrink-0" />
                <span>
                  {isKo
                    ? '새 창에서 회차 동영상을 시청 중입니다...'
                    : 'Watching episode video in a new window...'}
                </span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {isKo
                  ? `동영상을 보고 이 게임 화면으로 돌아오면 +${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS 보상이 즉시 지급되며 다음 회차로 이동합니다. (창 전환이 감지되지 않으면 아래 완료 버튼을 눌러주세요.)`
                  : `Return to this game window after watching to automatically receive +${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS and advance to the next episode.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void completeWatchAndGrantReward()}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#201d1d] font-bold text-xs sm:text-sm rounded-sm border border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>
                    {isKo
                      ? `시청 완료 · +${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS 보상 받기`
                      : `Claim +${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS & Continue`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.open(lastOpenedUrl, '_blank', 'noopener,noreferrer');
                    } catch {}
                  }}
                  className="min-h-[44px] px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-sm border border-stone-600 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span>{isKo ? '새창 다시 열기' : 'Reopen Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Rewarded State */}
          {watchState === 'rewarded' && (
            <div className="border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] p-4 rounded-none flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-bold text-emerald-300">
                    {isKo
                      ? `시청 보상 +${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS 지급 완료!`
                      : `+${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS Watch Reward Granted!`}
                  </p>
                  <p className="text-[11px] text-stone-300">
                    {isKo ? '다음 회차 게임으로 이동합니다...' : 'Moving to the next episode...'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: 3-Second Auto-Advance Countdown */}
        <div className="border-t border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-3.5 sm:p-4 shrink-0 space-y-2">
          {watchState === 'countdown' ? (
            <>
              <div className="flex items-center justify-between text-xs font-bold text-[#646262]">
                <span>
                  {isKo
                    ? `클릭하지 않으면 ${remainingCeilSeconds}초 후 다음 회차 게임으로 이동`
                    : `Auto-advancing to next episode in ${remainingCeilSeconds}s`}
                </span>
                <span className="tabular-nums text-[#201d1d]">{remainingSecondsText}s</span>
              </div>
              <div className="h-2 w-full bg-[#e5e0e0] rounded-none overflow-hidden border border-[rgba(15,0,0,0.12)]">
                <div
                  className="h-full bg-[#201d1d] transition-all duration-75 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <button
                type="button"
                onClick={safeProceedNext}
                className="w-full min-h-[44px] px-4 py-2 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] font-bold text-xs rounded-sm border border-[rgba(15,0,0,0.2)] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>
                  {isKo
                    ? `[다음 회차 게임으로 즉시 이동 (${remainingCeilSeconds}초)]`
                    : `[Skip to Next Episode (${remainingCeilSeconds}s)]`}
                </span>
                <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={safeProceedNext}
              className="w-full min-h-[44px] px-4 py-2 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#646262] font-bold text-xs rounded-sm border border-[rgba(15,0,0,0.2)] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>{isKo ? '[다음 회차 게임으로 이동]' : '[Continue to Next Episode]'}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
