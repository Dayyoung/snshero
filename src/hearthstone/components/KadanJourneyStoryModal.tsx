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

/**
 * 스토리모드 에피소드 5컷 5문구 음성 낭독 웹툰 극장
 * - 에피소드 진입 시 5개 핵심 이미지와 5개 요약 문구를 한국어 음성(TTS)으로 순차 낭독합니다.
 * - 5개 슬라이드가 종료되면 자동으로 결투(게임)가 시작됩니다.
 * - [건너뛰기 · 결투 시작], 일시정지/재개, 컷 수동 선택, 웹툰/소설 바로가기 제공.
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
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const firedRef = useRef(false);
  const ttsAbortRef = useRef<boolean>(false);

  const epDef = getJourneyEpisodeDef(viewingEpisode);
  const diffSpec = getJourneyDifficultySpec(viewingEpisode, reincarnation);
  const unlockedMax = Math.max(episode, maxClearedEpisode + 1, 1);

  const cuts = useMemo(() => epDef.scenes.slice(0, CUT_COUNT), [epDef]);
  const totalCuts = Math.max(1, cuts.length);
  const currentCut = cuts[Math.min(activeCutIdx, totalCuts - 1)] || cuts[0];

  // 각 컷별 낭독 문구: 핵심 요약 캡션 + 인물 대사
  const speechText = useMemo(() => {
    if (!currentCut) return '';
    if (currentCut.speakerName && currentCut.shortQuote) {
      return `${currentCut.shortCaption} ${currentCut.speakerName}, "${currentCut.shortQuote}"`;
    }
    return currentCut.shortCaption;
  }, [currentCut]);

  // 문구 길이에 비례한 슬라이드 지속 시간 (최소 3.5초 ~ 최대 7.0초)
  const cutDurationMs = useMemo(() => {
    const baseLen = speechText.length || 20;
    return Math.max(3500, Math.min(7500, baseLen * 140));
  }, [speechText]);

  // 5컷 일러스트 이미지 선행 프리로드
  useEffect(() => {
    for (const sc of cuts) {
      const img = new Image();
      img.src = sc.illustrationUrl;
    }
  }, [cuts]);

  // 에피소드 변경 시 리셋
  useEffect(() => {
    firedRef.current = false;
    ttsAbortRef.current = false;
    setActiveCutIdx(0);
    setCutElapsedMs(0);
    hsAudio.cancelTts();
  }, [viewingEpisode]);

  // 컷 진입 시 한국어 TTS 음성 낭독 시작
  useEffect(() => {
    if (isMidBattleReview || autoPaused || !speechText) return;

    ttsAbortRef.current = false;
    setIsSpeaking(true);

    let isDone = false;
    const finishSpeech = () => {
      if (isDone) return;
      isDone = true;
      setIsSpeaking(false);
    };

    hsAudio
      .speakTts(speechText, 1.05, 0.98)
      .then(finishSpeech)
      .catch(finishSpeech);

    return () => {
      isDone = true;
      hsAudio.cancelTts();
      setIsSpeaking(false);
    };
  }, [activeCutIdx, viewingEpisode, speechText, autoPaused, isMidBattleReview]);

  const isSequentialRunning = !isMidBattleReview && !autoPaused;

  // 슬라이드 진행 타이머 (지속 시간 도달 시 다음 컷으로, 5컷 완료 시 자동 게임 시작)
  useEffect(() => {
    if (!isSequentialRunning) return;
    const tickMs = 50;
    const id = window.setInterval(() => {
      setCutElapsedMs((prev) => {
        const next = prev + tickMs;
        if (next < cutDurationMs) {
          return next;
        }

        // 현재 컷 지속 시간 완료 -> 다음 컷 진행 또는 5컷 종료 후 자동 결투 시작!
        setActiveCutIdx((curIdx) => {
          if (curIdx + 1 < totalCuts) {
            hsAudio.playSfx('card_flip', 0.4);
            return curIdx + 1;
          }

          // 5번째 슬라이드 종료 -> 자동 게임 시작!
          if (!firedRef.current) {
            firedRef.current = true;
            hsAudio.cancelTts();
            window.setTimeout(() => {
              hsAudio.playSfx('ui_click', 0.75);
              onStartBattle(viewingEpisode !== episode ? viewingEpisode : undefined);
            }, 100);
          }
          return curIdx;
        });
        return 0;
      });
    }, tickMs);

    return () => window.clearInterval(id);
  }, [isSequentialRunning, cutDurationMs, totalCuts, onStartBattle, viewingEpisode, episode]);

  const handleCloseOrStart = useCallback(() => {
    firedRef.current = true;
    hsAudio.cancelTts();
    hsAudio.playSfx('ui_click');
    if (isMidBattleReview && viewingEpisode === episode && onCloseReview) {
      onCloseReview();
      return;
    }
    onStartBattle(viewingEpisode !== episode ? viewingEpisode : undefined);
  }, [isMidBattleReview, viewingEpisode, episode, onCloseReview, onStartBattle]);

  useModalDismiss(true, () => {
    hsAudio.cancelTts();
    if (isMidBattleReview && onCloseReview) {
      hsAudio.playSfx('box_close');
      onCloseReview();
    } else {
      handleCloseOrStart();
    }
  });

  // 언마운트 시 TTS 정리
  useEffect(() => {
    return () => {
      hsAudio.cancelTts();
    };
  }, []);

  // 일시정지 토글 핸들러
  const handleTogglePause = () => {
    setAutoPaused((prev) => {
      const next = !prev;
      if (next) {
        hsAudio.cancelTts();
        setIsSpeaking(false);
      }
      return next;
    });
  };

  // 남은 예상 시간(초)
  const remainingTotalMs = Math.max(
    0,
    (totalCuts - 1 - activeCutIdx) * cutDurationMs + (cutDurationMs - cutElapsedMs),
  );
  const secsLeft = Math.max(1, Math.ceil(remainingTotalMs / 1000));

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      data-testid="story-5cut-modal"
      data-active-cut={activeCutIdx + 1}
      data-total-cuts={totalCuts}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/88 p-2 backdrop-blur-sm sm:p-4"
    >
      <div className="hs-wood-panel relative flex max-h-[96%] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-2 border-[#e2be75] shadow-[0_24px_70px_rgba(0,0,0,0.95)] sm:rounded-3xl">
        {/* 5-Segment Sequential Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5 bg-stone-950 px-3 pt-2.5">
          {cuts.map((cut, idx) => {
            const fillPct =
              idx < activeCutIdx
                ? 100
                : idx > activeCutIdx
                  ? 0
                  : isSequentialRunning
                    ? Math.min(100, (cutElapsedMs / cutDurationMs) * 100)
                    : 100;
            return (
              <div
                key={cut.stageLabel}
                className="h-2 overflow-hidden rounded-full bg-stone-800"
              >
                <div
                  style={{ width: `${fillPct}%` }}
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 transition-[width] duration-75 ease-linear shadow-[0_0_8px_rgba(245,158,11,0.6)]"
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

        {/* Single-Cut Sequential Spotlight Stage (1 Cut Shown at a Time with Voiceover Narration) */}
        <div className="flex flex-1 flex-col justify-center px-3 py-2.5 sm:px-5 sm:py-3.5">
          {currentCut && (
            <div
              key={`${viewingEpisode}_${activeCutIdx}`}
              className="animate-[hsCardPop_0.22s_ease-out] overflow-hidden rounded-2xl border-2 border-[#d9b264] bg-stone-950 shadow-[0_14px_38px_rgba(0,0,0,0.9)]"
            >
              {/* 16:9 Full-Focus Webtoon Cut Artwork */}
              <div className="relative aspect-[16/9] max-h-[52vh] w-full overflow-hidden bg-stone-900">
                <img
                  src={currentCut.illustrationUrl}
                  alt={`${epDef.titleKo} ${currentCut.stageLabel}`}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

                {/* Cut Stage Badge + Step Counter + Voice Status Pill */}
                <div className="absolute left-3 top-2.5 flex items-center gap-2">
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
                    <span className="inline-flex animate-pulse items-center gap-1 rounded-md border border-emerald-400/70 bg-emerald-950/90 px-2 py-0.5 text-[11px] font-extrabold text-emerald-300 shadow">
                      <span>🔊</span>
                      <span>음성 낭독 중</span>
                    </span>
                  )}
                </div>

                {/* Character Cutout Avatar + Speech Bubble Overlay */}
                {currentCut.shortQuote && (
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-2.5 rounded-xl border border-amber-200/40 bg-black/85 px-3 py-2 text-xs font-bold text-amber-50 shadow-xl backdrop-blur-[3px] sm:text-sm">
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

              {/* High-Contrast 5-Cut Story Summary Caption Bar (음성 낭독 요약 문구) */}
              <div className="border-t-2 border-amber-500/40 bg-[#160f08] px-4 py-2.5 text-center text-sm font-extrabold leading-relaxed text-amber-100 sm:px-6 sm:py-3.5 sm:text-base">
                <span className="inline-block text-amber-300">✦ </span>
                <span className="tracking-wide text-amber-50">{currentCut.shortCaption}</span>
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
                    hsAudio.cancelTts();
                    setAutoPaused(true);
                    setActiveCutIdx(idx);
                    setCutElapsedMs(0);
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
                hsAudio.cancelTts();
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
                hsAudio.cancelTts();
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
