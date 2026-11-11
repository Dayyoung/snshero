import React, { useEffect, useMemo, useRef, useState } from 'react';
import { hsAudio } from '../audio';
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
const CUT_DURATION_MS = 1000;

/**
 * 스토리모드 에피소드 5컷 순차 웹툰 극장
 * - 에피소드 진입 시 5컷을 한 번에 나열하지 않고 1컷씩 순차적으로 1초마다 표시한 뒤(총 5초) 즉시 결투를 시작합니다.
 * - 상단 5분할 타임라인 인디케이터, 일시정지/재개, 건너뛰기(바로 결투 시작), 공식 웹툰/소설 바로가기 제공.
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
  const [cutElapsedMs, setCutElapsedMs] = useState<number>(0);
  const [autoPaused, setAutoPaused] = useState<boolean>(isMidBattleReview);
  const firedRef = useRef(false);

  const epDef = getJourneyEpisodeDef(viewingEpisode);
  const diffSpec = getJourneyDifficultySpec(viewingEpisode, reincarnation);
  const unlockedMax = Math.max(episode, maxClearedEpisode + 1, 1);

  const cuts = useMemo(() => epDef.scenes.slice(0, CUT_COUNT), [epDef]);
  const totalCuts = Math.max(1, cuts.length);
  const currentCut = cuts[Math.min(activeCutIdx, totalCuts - 1)] || cuts[0];

  // Preload all 5 cut illustrations immediately so 1s sequential transitions never flicker
  useEffect(() => {
    for (const sc of cuts) {
      const img = new Image();
      img.src = sc.illustrationUrl;
    }
  }, [cuts]);

  // Reset sequential reel when episode changes
  useEffect(() => {
    firedRef.current = false;
    setActiveCutIdx(0);
    setCutElapsedMs(0);
  }, [viewingEpisode]);

  const isSequentialRunning = !isMidBattleReview && !autoPaused;

  useEffect(() => {
    if (!isSequentialRunning) return;
    const tickMs = 50;
    const id = window.setInterval(() => {
      setCutElapsedMs((prev) => {
        const next = prev + tickMs;
        if (next < CUT_DURATION_MS) {
          return next;
        }
        // Current 1-second cut completed -> advance to next cut or start battle after Cut 5!
        setActiveCutIdx((curIdx) => {
          if (curIdx + 1 < totalCuts) {
            hsAudio.playSfx('card_flip', 0.34);
            return curIdx + 1;
          }
          if (!firedRef.current) {
            firedRef.current = true;
            window.setTimeout(() => {
              hsAudio.playSfx('ui_click', 0.75);
              onStartBattle(viewingEpisode !== episode ? viewingEpisode : undefined);
            }, 0);
          }
          return curIdx;
        });
        return 0;
      });
    }, tickMs);
    return () => window.clearInterval(id);
  }, [isSequentialRunning, totalCuts, onStartBattle, viewingEpisode, episode]);

  const handleCloseOrStart = () => {
    firedRef.current = true;
    hsAudio.playSfx('ui_click');
    if (isMidBattleReview && viewingEpisode === episode && onCloseReview) {
      onCloseReview();
      return;
    }
    onStartBattle(viewingEpisode !== episode ? viewingEpisode : undefined);
  };

  const remainingTotalMs = Math.max(
    0,
    (totalCuts - 1 - activeCutIdx) * CUT_DURATION_MS + (CUT_DURATION_MS - cutElapsedMs),
  );
  const secsLeft = Math.max(1, Math.ceil(remainingTotalMs / 1000));

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      data-testid="story-5cut-modal"
      data-active-cut={activeCutIdx + 1}
      data-total-cuts={totalCuts}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/86 p-2 backdrop-blur-sm sm:p-4"
    >
      <div className="hs-wood-panel relative flex max-h-[96%] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-2 border-[#e2be75] shadow-[0_24px_70px_rgba(0,0,0,0.95)] sm:rounded-3xl">
        {/* 5-Segment Sequential Progress Bar (1.0s per Cut) */}
        <div className="grid grid-cols-5 gap-1 bg-stone-950 px-2.5 pt-2">
          {cuts.map((cut, idx) => {
            const fillPct =
              idx < activeCutIdx
                ? 100
                : idx > activeCutIdx
                  ? 0
                  : isSequentialRunning
                    ? Math.min(100, (cutElapsedMs / CUT_DURATION_MS) * 100)
                    : 100;
            return (
              <div
                key={cut.stageLabel}
                className="h-1.5 overflow-hidden rounded-full bg-stone-800"
              >
                <div
                  style={{ width: `${fillPct}%` }}
                  className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300 transition-[width] duration-75 ease-linear"
                />
              </div>
            );
          })}
        </div>

        {/* Compact Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 bg-stone-950/90 px-3.5 py-2 sm:px-5 sm:py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-lg border border-emerald-300/70 bg-emerald-950 px-2 py-0.5 text-[11px] font-extrabold text-emerald-200 sm:text-xs">
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
                onClick={() => setAutoPaused((p) => !p)}
                className={`min-h-[32px] rounded-lg border px-2.5 py-1 text-[11px] font-extrabold transition sm:text-xs ${
                  !autoPaused
                    ? 'border-emerald-300/70 bg-emerald-950/90 text-emerald-200'
                    : 'border-amber-400/60 bg-stone-900 text-amber-200'
                }`}
              >
                {!autoPaused
                  ? `⏱ ${activeCutIdx + 1}/${totalCuts}컷 (${secsLeft}초 · 일시정지)`
                  : '▶ 순차 재생 재개'}
              </button>
            )}

            <select
              aria-label="에피소드 선택"
              value={viewingEpisode}
              onChange={(e) => {
                hsAudio.playSfx('card_flip', 0.7);
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

        {/* Single-Cut Sequential Spotlight Stage (1 Cut Shown at a Time for 1.0s Each!) */}
        <div className="flex flex-1 flex-col justify-center px-3 py-2.5 sm:px-5 sm:py-3.5">
          {currentCut && (
            <div
              key={`${viewingEpisode}_${activeCutIdx}`}
              className="animate-[hsCardPop_0.22s_ease-out] overflow-hidden rounded-2xl border-2 border-[#d9b264] bg-stone-950 shadow-[0_14px_38px_rgba(0,0,0,0.9)]"
            >
              {/* 16:9 Full-Focus Webtoon Cut Artwork */}
              <div className="relative aspect-[16/9] max-h-[54vh] w-full overflow-hidden bg-stone-900">
                <img
                  src={currentCut.illustrationUrl}
                  alt={`${epDef.titleKo} ${currentCut.stageLabel}`}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/88 via-black/15 to-black/35" />

                {/* Cut Stage Badge + Step Counter */}
                <div className="absolute left-3 top-2.5 flex items-center gap-2">
                  <span
                    data-testid="story-cut-stage-label"
                    className="rounded-lg border border-amber-300/90 bg-black/85 px-2.5 py-1 text-xs font-extrabold text-amber-200 shadow-lg sm:text-sm"
                  >
                    {currentCut.stageLabel}
                  </span>
                  <span className="rounded-md border border-emerald-400/50 bg-emerald-950/85 px-2 py-0.5 text-[11px] font-extrabold text-emerald-200">
                    {activeCutIdx + 1} / {totalCuts}
                  </span>
                </div>

                {/* Character Cutout Avatar + Speech Bubble Overlay */}
                {currentCut.shortQuote && (
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-2.5 rounded-xl border border-amber-200/35 bg-black/80 px-3 py-2 text-xs font-bold text-amber-50 shadow-xl backdrop-blur-[3px] sm:text-sm">
                    <img
                      src={currentCut.speakerCutoutUrl}
                      alt={currentCut.speakerName}
                      className="h-9 w-9 shrink-0 rounded-full border border-sky-300/80 bg-stone-900 object-cover object-top sm:h-11 sm:w-11"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="mr-1.5 font-extrabold text-sky-300">
                        {currentCut.speakerName}:
                      </span>
                      <span className="leading-snug text-amber-100">
                        “{currentCut.shortQuote}”
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Concise 1-Line Comic Caption */}
              <div className="border-t border-amber-500/25 bg-[#181009] px-3.5 py-2 text-center text-xs font-extrabold leading-snug text-amber-50 sm:px-5 sm:py-2.5 sm:text-sm">
                {currentCut.shortCaption}
              </div>
            </div>
          )}

          {/* 5-Cut Step Selector Pills */}
          <div className="mt-2.5 flex items-center justify-center gap-1.5 sm:gap-2">
            {cuts.map((cut, idx) => {
              const isCurrent = idx === activeCutIdx;
              return (
                <button
                  key={cut.stageLabel}
                  type="button"
                  onClick={() => {
                    hsAudio.playSfx('card_flip', 0.55);
                    setAutoPaused(true);
                    setActiveCutIdx(idx);
                    setCutElapsedMs(0);
                  }}
                  className={`min-h-[34px] rounded-lg border px-2.5 py-1 text-[11px] font-extrabold transition sm:px-3.5 sm:text-xs ${
                    isCurrent
                      ? 'border-amber-200 bg-gradient-to-b from-amber-500 to-amber-800 text-white shadow'
                      : idx < activeCutIdx
                        ? 'border-emerald-400/50 bg-emerald-950/65 text-emerald-200'
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
                ? `⚔ 건너뛰기 · 결투 시작 (${secsLeft}초)`
                : `⚔ 제${epDef.episode}화 결투 시작`}
          </button>
        </footer>
      </div>
    </div>
  );
};
