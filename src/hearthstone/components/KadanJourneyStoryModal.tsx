import React, { useEffect, useRef, useState } from 'react';
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

const AUTO_START_MS = 3000;

/**
 * 간결한 네컷 웹툰 에피소드 요약 + 해당 회차 공식 웹툰/소설 바로가기 모달
 * - 자동플레이(autoPlayEnabled) 활성 시 3초 카운트다운 후 자동으로 결투 시작
 */
export const KadanJourneyStoryModal: React.FC<KadanJourneyStoryModalProps> = ({
  episode,
  reincarnation,
  maxClearedEpisode,
  autoPlayEnabled,
  isMidBattleReview = false,
  onStartBattle,
  onCloseReview,
}) => {
  const [viewingEpisode, setViewingEpisode] = useState<number>(episode);
  const [zoomedCutIdx, setZoomedCutIdx] = useState<number | null>(null);
  const [autoPaused, setAutoPaused] = useState<boolean>(false);
  const [remainingMs, setRemainingMs] = useState<number>(AUTO_START_MS);
  const firedRef = useRef(false);

  const epDef = getJourneyEpisodeDef(viewingEpisode);
  const diffSpec = getJourneyDifficultySpec(viewingEpisode, reincarnation);
  const unlockedMax = Math.max(episode, maxClearedEpisode + 1, 1);

  const isAutoTimerRunning =
    autoPlayEnabled && !isMidBattleReview && !autoPaused && zoomedCutIdx === null;

  useEffect(() => {
    firedRef.current = false;
    setRemainingMs(AUTO_START_MS);
  }, [viewingEpisode]);

  useEffect(() => {
    if (!isAutoTimerRunning) return;
    const tickMs = 100;
    const id = window.setInterval(() => {
      setRemainingMs((prev) => {
        const next = Math.max(0, prev - tickMs);
        if (next === 0 && !firedRef.current) {
          firedRef.current = true;
          window.setTimeout(() => {
            hsAudio.playSfx('ui_click', 0.75);
            onStartBattle(viewingEpisode !== episode ? viewingEpisode : undefined);
          }, 0);
        }
        return next;
      });
    }, tickMs);
    return () => window.clearInterval(id);
  }, [isAutoTimerRunning, onStartBattle, viewingEpisode, episode]);

  const handleCloseOrStart = () => {
    firedRef.current = true;
    hsAudio.playSfx('ui_click');
    if (isMidBattleReview && viewingEpisode === episode && onCloseReview) {
      onCloseReview();
      return;
    }
    onStartBattle(viewingEpisode !== episode ? viewingEpisode : undefined);
  };

  const secsLeft = Math.max(1, Math.ceil(remainingMs / 1000));
  const progressPct = Math.max(0, Math.min(100, ((AUTO_START_MS - remainingMs) / AUTO_START_MS) * 100));

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/82 p-2 backdrop-blur-sm sm:p-4"
    >
      <div className="hs-wood-panel relative flex max-h-[96%] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-2 border-[#e2be75] shadow-[0_24px_70px_rgba(0,0,0,0.95)] sm:rounded-3xl">
        {/* Auto-Advance 3s Top Progress Bar */}
        {isAutoTimerRunning && (
          <div className="h-1.5 w-full bg-stone-900">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300 transition-all duration-100"
            />
          </div>
        )}

        {/* Compact Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 bg-stone-950/85 px-3.5 py-2.5 sm:px-5 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="shrink-0 rounded-lg border border-emerald-300/70 bg-emerald-950 px-2.5 py-0.5 text-xs font-extrabold text-emerald-200">
              {reincarnation > 0 ? `${reincarnation}환생 · ` : ''}제{epDef.episode}화
            </span>
            <h2 className="hs-title truncate text-base font-extrabold text-amber-100 sm:text-xl">
              {epDef.titleKo}
            </h2>
            <span className="hidden rounded-full border border-amber-400/40 bg-amber-950/70 px-2.5 py-0.5 text-[11px] font-bold text-amber-200 md:inline-block">
              보스: {epDef.bossNameKo} (승리 +{diffSpec.expectedWinGold}G
              {diffSpec.isBossMilestone ? ' +1팩' : ''})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {autoPlayEnabled && !isMidBattleReview && (
              <button
                type="button"
                onClick={() => setAutoPaused((p) => !p)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-extrabold transition ${
                  !autoPaused
                    ? 'border-emerald-300/70 bg-emerald-950/90 text-emerald-200'
                    : 'border-amber-400/50 bg-stone-900 text-amber-200'
                }`}
              >
                {!autoPaused ? `⏱ 자동 진행 ${secsLeft}초 (정지)` : '▶ 자동 진행 재개'}
              </button>
            )}

            <select
              aria-label="에피소드 선택"
              value={viewingEpisode}
              onChange={(e) => {
                hsAudio.playSfx('card_flip', 0.7);
                setAutoPaused(true);
                setZoomedCutIdx(null);
                setViewingEpisode(Number(e.target.value));
              }}
              className="rounded-lg border border-amber-400/60 bg-stone-900 px-2 py-1 text-xs font-extrabold text-amber-100 outline-none"
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
              aria-label="닫기"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/50 bg-stone-900 text-xs font-black text-amber-200 hover:bg-stone-800"
            >
              ✕
            </button>
          </div>
        </header>

        {/* 4-Cut Official Webtoon Summary Strip */}
        <div className="hs-no-scrollbar flex-1 overflow-y-auto px-3 py-2.5 sm:px-5 sm:py-3.5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
            {epDef.scenes.slice(0, 4).map((cut, idx) => (
              <div
                key={cut.stageLabel}
                onClick={() => {
                  setAutoPaused(true);
                  setZoomedCutIdx(zoomedCutIdx === idx ? null : idx);
                }}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border-2 border-[#c8a158]/75 bg-stone-950 shadow-lg transition hover:border-amber-300"
              >
                {/* 16:9 Official Webtoon Artwork */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-900">
                  <img
                    src={cut.illustrationUrl}
                    alt={`${epDef.titleKo} ${cut.stageLabel}`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Cut Badge */}
                  <span className="absolute left-2 top-2 rounded-md border border-amber-300/80 bg-black/80 px-2 py-0.5 text-[10.5px] font-extrabold text-amber-200 shadow">
                    {cut.stageLabel}
                  </span>

                  {/* Compact Speech Bubble Overlay */}
                  {cut.shortQuote && (
                    <div className="absolute bottom-1.5 left-2 right-2 truncate rounded-lg border border-white/25 bg-black/75 px-2.5 py-1 text-[11px] font-bold text-amber-100 backdrop-blur-[2px]">
                      <span className="mr-1 font-extrabold text-sky-300">
                        {cut.speakerName}:
                      </span>
                      “{cut.shortQuote}”
                    </div>
                  )}
                </div>

                {/* Concise 1-Line Comic Caption */}
                <div className="bg-[#181009] px-3 py-1.5 text-xs font-bold leading-snug text-amber-50/95 sm:py-2 sm:text-[13px]">
                  {cut.shortCaption}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar: Direct Episode Webtoon / Novel Links + Start Battle Button */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-500/30 bg-stone-950/92 px-3.5 py-2.5 sm:px-5 sm:py-3">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={epDef.webtoonEpisodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setAutoPaused(true);
                hsAudio.playSfx('ui_click', 0.7);
              }}
              className="hs-brass-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold text-amber-100 sm:text-sm"
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
              className="hs-brass-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold text-amber-100 sm:text-sm"
            >
              <span>📖</span>
              <span>제{epDef.episode}화 소설 바로가기 ↗</span>
            </a>
          </div>

          <button
            type="button"
            onClick={handleCloseOrStart}
            className="hs-arcane-btn ml-auto min-h-[42px] rounded-xl px-5 py-2 text-sm font-extrabold tracking-wide text-white sm:px-7 sm:text-base"
          >
            {isMidBattleReview && viewingEpisode === episode
              ? '⚔ 전장으로 돌아가기'
              : isAutoTimerRunning
                ? `⚔ 제${epDef.episode}화 결투 시작 (${secsLeft}초)`
                : `⚔ 제${epDef.episode}화 결투 시작`}
          </button>
        </footer>

        {/* Optional Single-Cut Lightbox Zoom */}
        {zoomedCutIdx !== null && epDef.scenes[zoomedCutIdx] && (
          <div
            onClick={() => setZoomedCutIdx(null)}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/92 p-4"
          >
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-amber-300 bg-stone-950 shadow-2xl">
              <img
                src={epDef.scenes[zoomedCutIdx].illustrationUrl}
                alt={epDef.scenes[zoomedCutIdx].stageLabel}
                className="aspect-[16/9] w-full object-cover"
              />
              <div className="p-3.5 text-center">
                <div className="text-xs font-extrabold text-amber-300">
                  {epDef.scenes[zoomedCutIdx].stageLabel} · 클릭하면 닫힙니다
                </div>
                <div className="mt-1 text-sm font-extrabold text-white">
                  {epDef.scenes[zoomedCutIdx].shortCaption}
                </div>
                {epDef.scenes[zoomedCutIdx].shortQuote && (
                  <div className="mt-1 text-xs font-bold text-sky-200">
                    {epDef.scenes[zoomedCutIdx].speakerName}: “
                    {epDef.scenes[zoomedCutIdx].shortQuote}”
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
