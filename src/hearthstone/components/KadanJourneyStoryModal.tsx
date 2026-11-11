import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hsAudio } from '../audio';
import { useModalDismiss } from '../useModalDismiss';
import {
  KADAN_JOURNEY_EPISODES,
  getJourneyDifficultySpec,
  getJourneyEpisodeDef,
} from '../kadanJourneyData';

export interface KadanJourneyStoryModalProps {
  episode: number;
  reincarnation: number;
  maxClearedEpisode: number;
  playerBoostedCount: number;
  playerMaxMultiplier: number;
  autoPlayEnabled: boolean;
  isMidBattleReview?: boolean;
  onStartBattle: (selectedEpisode?: number) => void;
  onCloseReview?: () => void;
}

const CUT_COUNT = 5;
const POST_SPEECH_PAUSE_MS = 420;

/**
 * 스토리모드 에피소드 5컷 5문구 남성 성우 낭독 웹툰 극장
 * - 각 에피소드 전체 기승전결을 완벽히 요약한 5개 핵심 문장과 5개 웹툰 일러스트를 표시합니다.
 * - 스튜디오 마스터링 한국어 남성 성우(Neural Male Narrator) MP3로 낭독하며,
 *   문장을 읽는 도중 절대 끊고 넘어가지 않고 오디오 재생이 100% 끝난 뒤에만 다음 컷(및 전투)으로 이동합니다.
 */
export const KadanJourneyStoryModal: React.FC<KadanJourneyStoryModalProps> = ({
  episode,
  reincarnation,
  maxClearedEpisode,
  isMidBattleReview = false,
  onStartBattle,
  onCloseReview,
}) => {
  const [viewingEpisode, setViewingEpisode] = useState<number>(episode);
  const [activeCutIdx, setActiveCutIdx] = useState<number>(0);
  const [cutProgressPct, setCutProgressPct] = useState<number>(0);
  const [cutRemSec, setCutRemSec] = useState<number>(5);
  const [autoPaused, setAutoPaused] = useState<boolean>(isMidBattleReview);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [useSilentFallbackTimer, setUseSilentFallbackTimer] = useState<boolean>(false);

  const firedRef = useRef(false);
  const nextStepTimeoutRef = useRef<number | null>(null);
  const onStartBattleRef = useRef(onStartBattle);
  onStartBattleRef.current = onStartBattle;

  const epDef = getJourneyEpisodeDef(viewingEpisode);
  const diffSpec = getJourneyDifficultySpec(viewingEpisode, reincarnation);
  const unlockedMax = Math.max(episode, maxClearedEpisode + 1, 1);

  const cuts = useMemo(() => epDef.scenes.slice(0, CUT_COUNT), [epDef]);
  const totalCuts = Math.max(1, cuts.length);
  const currentCut = cuts[Math.min(activeCutIdx, totalCuts - 1)] || cuts[0];

  const clearPendingAdvance = useCallback(() => {
    if (nextStepTimeoutRef.current !== null) {
      window.clearTimeout(nextStepTimeoutRef.current);
      nextStepTimeoutRef.current = null;
    }
  }, []);

  // 다음 컷 이동 또는 5컷 낭독 완료 후 자동 결투 시작
  const advanceAfterCutComplete = useCallback(
    (completedIdx: number) => {
      if (completedIdx + 1 < totalCuts) {
        hsAudio.playSfx('card_flip', 0.38);
        setCutProgressPct(0);
        setActiveCutIdx(completedIdx + 1);
        return;
      }

      if (!isMidBattleReview && !firedRef.current) {
        firedRef.current = true;
        hsAudio.stopStoryNarration();
        hsAudio.playSfx('ui_click', 0.75);
        onStartBattleRef.current(viewingEpisode !== episode ? viewingEpisode : undefined);
      }
    },
    [totalCuts, isMidBattleReview, viewingEpisode, episode],
  );

  // 5컷 웹툰 일러스트 및 남성 성우 MP3 선행 프리로드
  useEffect(() => {
    for (const sc of cuts) {
      const img = new Image();
      img.src = sc.illustrationUrl;
      if (sc.narrationAudioUrl) {
        const preloadAudio = new Audio();
        preloadAudio.preload = 'auto';
        preloadAudio.src = sc.narrationAudioUrl;
      }
    }
  }, [cuts]);

  // 에피소드 변경 시 초기화
  useEffect(() => {
    firedRef.current = false;
    clearPendingAdvance();
    hsAudio.stopStoryNarration();
    setActiveCutIdx(0);
    setCutProgressPct(0);
    setCutRemSec(5);
    setUseSilentFallbackTimer(false);
  }, [viewingEpisode, clearPendingAdvance]);

  // 현재 컷 남성 성우 MP3 재생 — 문장 낭독이 100% 완료된 후에만 다음 화면으로 전환!
  useEffect(() => {
    clearPendingAdvance();
    if (!currentCut) return;

    if (autoPaused) {
      setIsSpeaking(false);
      return;
    }

    setCutProgressPct(0);
    setUseSilentFallbackTimer(false);
    const estSec = Math.max(4, Math.ceil((currentCut.shortCaption.length || 45) / 9.5));
    setCutRemSec(estSec);

    let cancelled = false;
    setIsSpeaking(true);

    const cleanupAudio = hsAudio.playStoryNarration(currentCut.narrationAudioUrl, {
      onProgress: (progress01, remainingSec) => {
        if (cancelled) return;
        setCutProgressPct(Math.min(100, Math.max(0, progress01 * 100)));
        setCutRemSec(Math.max(1, Math.ceil(remainingSec)));
      },
      onEnded: () => {
        if (cancelled) return;
        setIsSpeaking(false);
        setCutProgressPct(100);
        // 문장을 끝까지 다 읽은 뒤 자연스러운 여운(0.42초) 후 다음 컷으로 이동
        nextStepTimeoutRef.current = window.setTimeout(() => {
          if (!cancelled) {
            advanceAfterCutComplete(activeCutIdx);
          }
        }, POST_SPEECH_PAUSE_MS);
      },
      onFallbackTimer: () => {
        if (cancelled) return;
        // 음소거 상태이거나 자동재생이 차단된 경우에만 독서 시간 타이머 작동
        setIsSpeaking(false);
        setUseSilentFallbackTimer(true);
      },
    });

    return () => {
      cancelled = true;
      clearPendingAdvance();
      cleanupAudio();
      setIsSpeaking(false);
    };
    // autoPaused 토글 시에는 pauseStoryNarration/resumeStoryNarration으로 이어서 재생하도록 별도 제어
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCutIdx, viewingEpisode, currentCut?.narrationAudioUrl]);

  // 음소거 / 오디오 미재생 폴백 전용 타이머 (성우 음성이 재생 중일 때는 절대 개입하지 않음!)
  const silentDurationMs = useMemo(
    () => Math.max(4200, (currentCut?.shortCaption.length || 45) * 95),
    [currentCut],
  );

  useEffect(() => {
    if (!useSilentFallbackTimer || autoPaused || isMidBattleReview) return;
    const tickMs = 50;
    let elapsed = 0;
    const id = window.setInterval(() => {
      elapsed += tickMs;
      const pct = Math.min(100, (elapsed / silentDurationMs) * 100);
      setCutProgressPct(pct);
      setCutRemSec(Math.max(1, Math.ceil((silentDurationMs - elapsed) / 1000)));
      if (elapsed >= silentDurationMs) {
        window.clearInterval(id);
        advanceAfterCutComplete(activeCutIdx);
      }
    }, tickMs);

    return () => window.clearInterval(id);
  }, [
    useSilentFallbackTimer,
    autoPaused,
    isMidBattleReview,
    silentDurationMs,
    activeCutIdx,
    advanceAfterCutComplete,
  ]);

  const handleCloseOrStart = useCallback(() => {
    firedRef.current = true;
    clearPendingAdvance();
    hsAudio.stopStoryNarration();
    hsAudio.playSfx('ui_click');
    if (isMidBattleReview && viewingEpisode === episode && onCloseReview) {
      onCloseReview();
      return;
    }
    onStartBattle(viewingEpisode !== episode ? viewingEpisode : undefined);
  }, [
    clearPendingAdvance,
    isMidBattleReview,
    viewingEpisode,
    episode,
    onCloseReview,
    onStartBattle,
  ]);

  useModalDismiss(true, () => {
    clearPendingAdvance();
    hsAudio.stopStoryNarration();
    if (isMidBattleReview && onCloseReview) {
      hsAudio.playSfx('box_close');
      onCloseReview();
    } else {
      handleCloseOrStart();
    }
  });

  useEffect(() => {
    return () => {
      clearPendingAdvance();
      hsAudio.stopStoryNarration();
    };
  }, [clearPendingAdvance]);

  const handleTogglePause = () => {
    setAutoPaused((prev) => {
      const nextPaused = !prev;
      if (nextPaused) {
        clearPendingAdvance();
        hsAudio.pauseStoryNarration();
        setIsSpeaking(false);
      } else {
        if (cutProgressPct >= 99.9) {
          window.setTimeout(() => advanceAfterCutComplete(activeCutIdx), 120);
        } else {
          hsAudio.resumeStoryNarration();
          if (!useSilentFallbackTimer) {
            setIsSpeaking(true);
          }
        }
      }
      return nextPaused;
    });
  };

  const isSequentialRunning = !isMidBattleReview && !autoPaused;
  const remainingTotalSec = Math.max(
    1,
    cutRemSec + Math.max(0, totalCuts - 1 - activeCutIdx) * 5,
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      data-testid="story-5cut-modal"
      data-active-cut={activeCutIdx + 1}
      data-total-cuts={totalCuts}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/88 p-2 backdrop-blur-sm sm:p-4"
    >
      <div className="hs-wood-panel relative flex max-h-[96%] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-2 border-[#e2be75] shadow-[0_24px_70px_rgba(0,0,0,0.95)] sm:rounded-3xl">
        {/* 5-Segment Voice-Synced Sequential Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5 bg-stone-950 px-3 pt-2.5">
          {cuts.map((cut, idx) => {
            const fillPct =
              idx < activeCutIdx
                ? 100
                : idx > activeCutIdx
                  ? 0
                  : autoPaused
                    ? cutProgressPct
                    : cutProgressPct;
            return (
              <div
                key={cut.stageLabel}
                className="h-2 overflow-hidden rounded-full bg-stone-800"
              >
                <div
                  style={{ width: `${fillPct}%` }}
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-[width] duration-75 ease-linear"
                />
              </div>
            );
          })}
        </div>

        {/* Compact Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 bg-stone-950/90 px-3.5 py-2 sm:px-5 sm:py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-lg border border-amber-300/70 bg-amber-950 px-2 py-0.5 text-[11px] font-extrabold text-amber-200 sm:text-xs">
              스토리모드 · {reincarnation > 0 ? `${reincarnation}환생 ` : ''}제{epDef.episode}화
            </span>
            <h2 className="hs-title truncate text-sm font-extrabold text-amber-100 sm:text-lg">
              {epDef.titleKo}
            </h2>
            <span className="hidden items-center gap-1.5 rounded-full border border-red-400/50 bg-red-950/75 py-0.5 pl-1 pr-2.5 text-[11px] font-bold text-amber-100 md:inline-flex">
              <img
                src={epDef.bossHeroSpec.portraitUrl}
                alt=""
                className="h-4 w-4 rounded-full border border-amber-300/80 bg-stone-900 object-cover object-top"
              />
              <span>
                보스: <strong className="text-red-200">{epDef.bossNameKo}</strong> (+{diffSpec.expectedWinGold}G
                {diffSpec.isBossMilestone ? ' +1팩' : ''})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isMidBattleReview && (
              <button
                type="button"
                data-testid="story-pause-toggle"
                onClick={handleTogglePause}
                className={`min-h-[32px] rounded-lg border px-2.5 py-1 text-[11px] font-extrabold transition sm:text-xs ${
                  !autoPaused
                    ? 'border-emerald-300/70 bg-emerald-950/90 text-emerald-200'
                    : 'border-amber-400/60 bg-stone-900 text-amber-200'
                }`}
              >
                {!autoPaused
                  ? `⏸ ${activeCutIdx + 1}/${totalCuts}컷 (일시정지)`
                  : '▶ 이어 듣기'}
              </button>
            )}

            <select
              aria-label="에피소드 선택"
              value={viewingEpisode}
              onChange={(e) => {
                hsAudio.playSfx('card_flip', 0.7);
                setAutoPaused(false);
                setViewingEpisode(Number(e.target.value));
              }}
              className="min-h-[32px] rounded-lg border border-amber-400/60 bg-stone-900 px-2 py-1 text-[11px] font-extrabold text-amber-100 outline-none sm:text-xs"
            >
              {KADAN_JOURNEY_EPISODES.map((ep) => {
                const locked = ep.episode > unlockedMax && reincarnation === 0;
                return (
                  <option key={ep.episode} value={ep.episode} disabled={locked}>
                    제{ep.episode}화 · {ep.titleKo} {locked ? '🔒' : ''}
                  </option>
                );
              })}
            </select>

            <button
              type="button"
              onClick={handleCloseOrStart}
              aria-label="건너뛰기 및 닫기"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/50 bg-stone-900 text-xs font-black text-amber-200 hover:bg-stone-800"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Single-Cut Sequential Spotlight Stage (1 Cut + Full Cohesive Story Summary + Studio Male Voiceover) */}
        <div className="flex flex-1 flex-col justify-center px-3 py-2.5 sm:px-5 sm:py-3.5">
          {currentCut && (
            <div
              key={`${viewingEpisode}_${activeCutIdx}`}
              className="animate-[hsCardPop_0.22s_ease-out] overflow-hidden rounded-2xl border-2 border-[#d9b264] bg-stone-950 shadow-[0_14px_38px_rgba(0,0,0,0.9)]"
            >
              {/* 16:9 Full-Focus Webtoon Cut Artwork */}
              <div className="relative aspect-[16/9] max-h-[50vh] w-full overflow-hidden bg-stone-900">
                <img
                  src={currentCut.illustrationUrl}
                  alt={`${epDef.titleKo} ${currentCut.stageLabel}`}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/45" />

                {/* Cut Stage Badge + Step Counter + Studio Male Voiceover Pill */}
                <div className="absolute left-3 top-2.5 flex flex-wrap items-center gap-2">
                  <span
                    data-testid="story-cut-stage-label"
                    className="rounded-lg border border-amber-300/90 bg-black/85 px-2.5 py-1 text-xs font-extrabold text-amber-200 shadow-lg sm:text-sm"
                  >
                    {currentCut.stageLabel}
                  </span>
                  <span className="rounded-md border border-amber-400/50 bg-amber-950/85 px-2 py-0.5 text-[11px] font-extrabold text-amber-200">
                    {activeCutIdx + 1} / {totalCuts}
                  </span>
                  {isSpeaking && (
                    <span
                      data-testid="story-voice-playing-badge"
                      className="inline-flex animate-pulse items-center gap-1 rounded-md border border-emerald-400/70 bg-emerald-950/90 px-2 py-0.5 text-[11px] font-extrabold text-emerald-300 shadow"
                    >
                      <span>🎙</span>
                      <span>성우 내레이션 낭독 중</span>
                    </span>
                  )}
                </div>

                {/* Subtle Location & Matchup Tag in Bottom-Right Corner */}
                <div className="pointer-events-none absolute bottom-2.5 right-3 rounded-lg border border-amber-300/35 bg-black/75 px-2.5 py-1 text-[11px] font-bold text-amber-200/95 backdrop-blur-[2px]">
                  📍 {epDef.locationKo}
                </div>
              </div>

              {/* High-Contrast Cohesive Story Summary Bar (낭독 문장 전문 표시 — 도중 끊김 없음) */}
              <div
                data-testid="story-summary-caption"
                className="border-t-2 border-amber-500/45 bg-[#160f08] px-4 py-3 text-center text-sm font-extrabold leading-relaxed text-amber-50 sm:px-6 sm:py-4 sm:text-[16.5px]"
              >
                <span className="mr-1.5 inline-block text-amber-300">✦</span>
                <span className="tracking-wide">{currentCut.shortCaption}</span>
              </div>
            </div>
          )}

          {/* 5-Cut Step Selector Pills (클릭 시 해당 컷 이동 및 성우 낭독 재생) */}
          <div className="mt-2.5 flex items-center justify-center gap-1.5 sm:gap-2">
            {cuts.map((cut, idx) => {
              const isCurrent = idx === activeCutIdx;
              return (
                <button
                  key={cut.stageLabel}
                  type="button"
                  onClick={() => {
                    hsAudio.playSfx('card_flip', 0.55);
                    clearPendingAdvance();
                    hsAudio.stopStoryNarration();
                    setAutoPaused(false);
                    setCutProgressPct(0);
                    setActiveCutIdx(idx);
                  }}
                  className={`min-h-[34px] rounded-lg border px-2.5 py-1 text-[11px] font-extrabold transition sm:px-3.5 sm:text-xs ${
                    isCurrent
                      ? 'border-amber-200 bg-gradient-to-b from-amber-500 to-amber-800 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                      : idx < activeCutIdx
                        ? 'border-amber-400/50 bg-amber-950/65 text-amber-200'
                        : 'border-stone-700 bg-stone-900/90 text-stone-300 hover:border-amber-400/60'
                  }`}
                >
                  {idx + 1}컷
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Bar: Direct Episode Webtoon / Novel Links + Skip / Start Battle Button */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-500/30 bg-stone-950/95 px-3.5 py-2.5 sm:px-5 sm:py-3">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={epDef.webtoonEpisodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setAutoPaused(true);
                clearPendingAdvance();
                hsAudio.pauseStoryNarration();
                hsAudio.playSfx('ui_click', 0.7);
              }}
              className="hs-brass-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold text-amber-100 sm:px-3.5 sm:text-sm"
            >
              <span>🎨</span>
              <span>제{epDef.episode}화 웹툰 바로가기 ↗</span>
            </a>

            <a
              href={epDef.novelEpisodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setAutoPaused(true);
                clearPendingAdvance();
                hsAudio.pauseStoryNarration();
                hsAudio.playSfx('ui_click', 0.7);
              }}
              className="hs-brass-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold text-amber-100 sm:px-3.5 sm:text-sm"
            >
              <span>📖</span>
              <span>제{epDef.episode}화 소설 바로가기 ↗</span>
            </a>
          </div>

          <button
            type="button"
            data-testid="story-skip-start-btn"
            onClick={handleCloseOrStart}
            className="hs-arcane-btn ml-auto min-h-[42px] rounded-xl px-4 py-2 text-xs font-extrabold tracking-wide text-white sm:px-6 sm:text-base"
          >
            {isMidBattleReview && viewingEpisode === episode
              ? '⚔ 전장으로 돌아가기'
              : isSequentialRunning
                ? `⚔ 건너뛰기 · 결투 시작 (약 ${remainingTotalSec}초)`
                : `⚔ 제${epDef.episode}화 결투 시작`}
          </button>
        </footer>
      </div>
    </div>
  );
};
