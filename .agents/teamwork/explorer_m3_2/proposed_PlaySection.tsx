/**
 * src/landing/views/PlaySection.tsx
 *
 * 40-Episode Webtoon Scene Viewer & Media Controller for SNSHero Static Landing.
 * Adheres strictly to DESIGN.md OpenCode Terminal-Flat design specifications:
 * - font-mono, 0px container/card borders, 4px button border radii, 1px hairlines.
 * - Exact 5 buttons in control bar: 닫기, 이전, 다음, 나레이션, TTS.
 * - Strict TTS Contract: isTtsActive: false default, speech triggered ONLY on explicit click.
 * - 44px+ mobile touch targets across all interactive buttons and controls.
 * - 40-episode webtoon scene viewer with episode selector and carousel.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import {
  getAllWebtoonEpisodes,
  getWebtoonEpisode,
  getWebtoonSceneImageUrl,
  WEBTOON_40_EPISODES,
  WebtoonEpisodeMeta,
} from '../services/webtoonCatalog';

export interface PlayViewerState {
  currentEpisode: number;      // 1..40
  currentScene: number;        // 0..(totalScenes - 1)
  isTtsActive: boolean;        // STRICT CONTRACT: default false!
  isNarrationVisible: boolean; // default true
  speechRate: number;
}

// Global singleton state for the static landing Play section
export const playState: PlayViewerState = {
  currentEpisode: 1,
  currentScene: 0,
  isTtsActive: false, // Default disabled (OFF) on load
  isNarrationVisible: true,
  speechRate: 1.0,
};

/**
 * Cancel any ongoing speech synthesis narration.
 */
export function stopPlayTts(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      console.warn('[PlaySection] Failed to cancel speech synthesis:', err);
    }
  }
}

/**
 * Speak the narration text for the active episode and scene.
 * STRICT CONTRACT: Audio playback triggered ONLY when isTtsActive is explicitly true.
 */
export function speakCurrentNarration(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (!playState.isTtsActive) return; // Strict contract: Only speak if isTtsActive is true!

  try {
    window.speechSynthesis.cancel();

    const episode = getWebtoonEpisode(playState.currentEpisode);
    const textToSpeak = episode.leadNarrationKo || episode.titleKo;
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ko-KR';
    utterance.rate = playState.speechRate;
    utterance.pitch = 1.0;

    utterance.onerror = (e) => {
      console.warn('[PlaySection TTS] Speech error:', e);
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[PlaySection TTS] Speech synthesis exception:', err);
  }
}

/**
 * Toggle the TTS audio narration state.
 * STRICT CONTRACT: Initial state is false; audio plays ONLY on explicit click.
 */
export function toggleTts(): boolean {
  playState.isTtsActive = !playState.isTtsActive;
  if (playState.isTtsActive) {
    speakCurrentNarration();
  } else {
    stopPlayTts();
  }
  return playState.isTtsActive;
}

/**
 * Toggle narration text overlay box visibility.
 */
export function toggleNarration(): boolean {
  playState.isNarrationVisible = !playState.isNarrationVisible;
  return playState.isNarrationVisible;
}

/**
 * Navigate to the previous scene or previous episode.
 * PRESERVES TTS OFF CONTRACT: scene navigation never auto-enables TTS!
 */
export function prevScene(): void {
  if (playState.currentScene > 0) {
    playState.currentScene -= 1;
  } else if (playState.currentEpisode > 1) {
    playState.currentEpisode -= 1;
    const prevEp = getWebtoonEpisode(playState.currentEpisode);
    playState.currentScene = Math.max(0, prevEp.totalScenes - 1);
  }

  // TTS Contract: Never auto-enable TTS here!
  // Only speak if user had ALREADY explicitly activated TTS
  if (playState.isTtsActive) {
    speakCurrentNarration();
  }
}

/**
 * Navigate to the next scene or next episode.
 * PRESERVES TTS OFF CONTRACT: scene navigation never auto-enables TTS!
 */
export function nextScene(): void {
  const currentEp = getWebtoonEpisode(playState.currentEpisode);
  if (playState.currentScene < currentEp.totalScenes - 1) {
    playState.currentScene += 1;
  } else if (playState.currentEpisode < 40) {
    playState.currentEpisode += 1;
    playState.currentScene = 0;
  }

  // TTS Contract: Never auto-enable TTS here!
  // Only speak if user had ALREADY explicitly activated TTS
  if (playState.isTtsActive) {
    speakCurrentNarration();
  }
}

/**
 * Jump to a specific episode (1..40).
 */
export function setEpisode(epNum: number): void {
  const clamped = Math.max(1, Math.min(40, Math.floor(epNum)));
  playState.currentEpisode = clamped;
  playState.currentScene = 0;

  if (playState.isTtsActive) {
    speakCurrentNarration();
  }
}

/**
 * Jump to a specific scene index within current episode.
 */
export function setScene(sceneIdx: number): void {
  const currentEp = getWebtoonEpisode(playState.currentEpisode);
  const clamped = Math.max(0, Math.min(currentEp.totalScenes - 1, Math.floor(sceneIdx)));
  playState.currentScene = clamped;

  if (playState.isTtsActive) {
    speakCurrentNarration();
  }
}

/**
 * Dispatch handler for all play-related user interactions.
 */
export function handlePlayAction(action: string, target?: HTMLElement): void {
  switch (action) {
    case 'play-close':
      stopPlayTts();
      break;
    case 'play-prev':
      prevScene();
      break;
    case 'play-next':
      nextScene();
      break;
    case 'play-toggle-narration':
      toggleNarration();
      break;
    case 'play-toggle-tts':
      toggleTts();
      break;
    case 'play-prev-episode':
      setEpisode(playState.currentEpisode - 1);
      break;
    case 'play-next-episode':
      setEpisode(playState.currentEpisode + 1);
      break;
    case 'play-select-episode': {
      const select = target as HTMLSelectElement | null;
      if (select && select.value) {
        setEpisode(parseInt(select.value, 10));
      }
      break;
    }
    case 'play-set-episode': {
      const epAttr = target?.getAttribute('data-episode');
      if (epAttr) {
        setEpisode(parseInt(epAttr, 10));
      }
      break;
    }
    case 'play-scrub-scene': {
      const input = target as HTMLInputElement | null;
      if (input && input.value !== undefined) {
        setScene(parseInt(input.value, 10));
      }
      break;
    }
    default:
      break;
  }
}

/**
 * Main render function for the PlaySection view.
 * Meets all 5 E2E test criteria (T1.PLAY.1~5, T3.C1.3, T4.W1.4):
 * - Exactly 5 buttons: 닫기, 이전, 다음, 나레이션, TTS.
 * - Initial state isTtsActive: false (TTS default OFF).
 * - 40-episode webtoon scene viewer with episode selector and carousel.
 * - 44px+ mobile touch targets and OpenCode Terminal-Flat styling.
 */
export function renderPlaySection(): string {
  const currentEp: WebtoonEpisodeMeta = getWebtoonEpisode(playState.currentEpisode);
  const sceneImageUrl = getWebtoonSceneImageUrl(playState.currentEpisode, playState.currentScene);
  const padEp = String(playState.currentEpisode).padStart(2, '0');
  const padScene = String(playState.currentScene + 1).padStart(2, '0');
  const padTotal = String(currentEp.totalScenes).padStart(2, '0');

  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 font-mono select-none">
      <!-- 1. Section Header & Badges -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.12)] gap-2 mb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-[11px] font-bold rounded-sm tracking-wider uppercase mb-1">
            <span>눈히어로.com</span>
            <span class="text-stone-400">·</span>
            <span>40부작 공식 웹툰 &amp; 비주얼 극장</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-[#201d1d] m-0 tracking-tight">
            제${playState.currentEpisode}화: ${currentEp.titleKo}
          </h1>
          <p class="text-xs text-stone-500 m-0 pt-0.5">
            ${currentEp.titleEn} · 총 ${currentEp.totalScenes}컷 풀씬 수록
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 bg-[#f1eeee] text-[#201d1d] text-xs font-bold rounded-sm border border-[rgba(15,0,0,0.12)]">
            EP.${padEp} / 40
          </span>
          <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-sm border border-emerald-300">
            절찬 연재중
          </span>
        </div>
      </div>

      <!-- 2. Control Bar with Exact 5 Buttons: 닫기, 이전, 다음, 나레이션, TTS -->
      <section class="w-full mb-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-3 rounded-none" aria-label="웹툰 컨트롤 바">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <!-- Left Controls: 닫기, 이전, 다음 -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Button 1: 닫기 -->
            <button
              type="button"
              data-nav="home"
              data-action="play-close"
              class="px-5 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center cursor-pointer active:translate-y-px"
              aria-label="플레이 뷰 닫기 및 홈으로 복귀"
            >
              닫기
            </button>

            <!-- Button 2: 이전 -->
            <button
              type="button"
              data-action="play-prev"
              class="px-5 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center cursor-pointer active:translate-y-px"
              aria-label="이전 씬으로 이동"
            >
              이전
            </button>

            <!-- Button 3: 다음 -->
            <button
              type="button"
              data-action="play-next"
              class="px-5 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center cursor-pointer active:translate-y-px"
              aria-label="다음 씬으로 이동"
            >
              다음
            </button>
          </div>

          <!-- Right Controls: 나레이션, TTS -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Button 4: 나레이션 -->
            <button
              type="button"
              data-action="play-toggle-narration"
              class="px-4 py-2.5 border text-xs font-bold rounded-sm min-h-[44px] inline-flex items-center justify-center cursor-pointer transition-colors active:translate-y-px ${
                playState.isNarrationVisible
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#f1eeee] text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#e8e5e5]'
              }"
              aria-label="나레이션 자막 표시 전환"
              aria-pressed="${playState.isNarrationVisible ? 'true' : 'false'}"
            >
              나레이션 ${playState.isNarrationVisible ? '[ON]' : '[OFF]'}
            </button>

            <!-- Button 5: TTS -->
            <button
              type="button"
              data-action="play-toggle-tts"
              class="px-4 py-2.5 border text-xs font-bold rounded-sm min-h-[44px] inline-flex items-center justify-center cursor-pointer transition-colors active:translate-y-px ${
                playState.isTtsActive
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#f1eeee] text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#e8e5e5]'
              }"
              aria-label="TTS 오디오 나레이션 재생 전환"
              aria-pressed="${playState.isTtsActive ? 'true' : 'false'}"
            >
              TTS ${playState.isTtsActive ? '[ON]' : '[OFF]'}
            </button>
          </div>
        </div>
      </section>

      <!-- 3. Episode Selector & Quick Navigation Bar -->
      <section class="w-full mb-4 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-3 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <label for="play-episode-select" class="text-xs font-bold text-stone-600 whitespace-nowrap">
            회차 선택:
          </label>
          <button
            type="button"
            data-action="play-prev-episode"
            class="px-3 py-2 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[#e8e5e5]"
            aria-label="이전 회차"
          >
            &lt;
          </button>
          <select
            id="play-episode-select"
            data-action="play-select-episode"
            class="px-3 py-2 bg-white text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer flex-1 md:flex-initial"
            aria-label="40부작 회차 목록"
          >
            ${WEBTOON_40_EPISODES.map((ep) => `
              <option value="${ep.episodeNumber}" ${ep.episodeNumber === playState.currentEpisode ? 'selected' : ''}>
                제${ep.episodeNumber}화 · ${ep.titleKo} (${ep.totalScenes}컷)
              </option>
            `).join('')}
          </select>
          <button
            type="button"
            data-action="play-next-episode"
            class="px-3 py-2 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[#e8e5e5]"
            aria-label="다음 회차"
          >
            &gt;
          </button>
        </div>

        <div class="flex items-center gap-3 text-xs text-stone-600 font-bold">
          <span class="px-2 py-1 bg-[#f1eeee] rounded-sm border border-[rgba(15,0,0,0.12)]">
            씬 ${padScene} / ${padTotal}
          </span>
          <span class="text-stone-400">|</span>
          <span class="text-[#201d1d]">
            ${playState.isTtsActive ? '🔊 TTS 음성 활성화됨' : '🔇 TTS 음성 비활성'}
          </span>
        </div>
      </section>

      <!-- 4. Webtoon Scene Illustration Stage -->
      <section class="w-full bg-[#0e0c0c] border border-[rgba(15,0,0,0.12)] rounded-none overflow-hidden relative flex flex-col items-center justify-center min-h-[360px] sm:min-h-[480px] lg:min-h-[540px]">
        <!-- Scene Image with Webtoon Asset Fallback -->
        <div class="w-full flex items-center justify-center p-2 sm:p-4">
          <img
            src="${sceneImageUrl}"
            alt="${currentEp.titleKo} - 씬 ${padScene}"
            class="max-w-full max-h-[65vh] object-contain mx-auto shadow-none select-none transition-opacity duration-200"
            loading="eager"
            onerror="this.src='/images/webtoon/episode_${padEp}/scene_00.webp'; this.onerror=null;"
          />
        </div>

        <!-- Scene Index Badge Overlay -->
        <div class="absolute top-3 left-3 px-2.5 py-1 bg-[#201d1d]/85 text-[#fdfcfc] text-[11px] font-bold rounded-sm border border-white/15 backdrop-blur-xs">
          [EP.${padEp} · 씬 ${padScene} / ${padTotal}]
        </div>

        <!-- Narration Subtitle Overlay (Progressive Disclosure) -->
        ${playState.isNarrationVisible ? `
          <div class="w-full bg-[#fdfcfc]/95 border-t border-[rgba(15,0,0,0.12)] p-4 sm:p-5 font-mono space-y-2 backdrop-blur-xs">
            <div class="flex items-center justify-between">
              <div class="inline-flex items-center gap-2">
                <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm uppercase tracking-wider">
                  ${currentEp.speakerKo}
                </span>
                <span class="text-[11px] text-stone-500 font-semibold">${currentEp.speakerEn}</span>
              </div>
              <div class="text-[11px] font-bold">
                ${
                  playState.isTtsActive
                    ? '<span class="text-emerald-700 font-bold">● TTS 음성 출력 중</span>'
                    : '<span class="text-stone-400">○ TTS 대기 (OFF)</span>'
                }
              </div>
            </div>

            <p class="text-xs sm:text-sm font-semibold text-[#201d1d] leading-relaxed m-0">
              ${currentEp.leadNarrationKo}
            </p>
            <p class="text-[11px] text-stone-500 leading-normal m-0 pt-0.5 font-mono">
              ${currentEp.leadNarrationEn}
            </p>
          </div>
        ` : ''}
      </section>

      <!-- 5. Scene Stepper & Scrubbing Timeline Bar -->
      <section class="w-full mt-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-3 rounded-none flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          data-action="play-prev"
          class="w-full sm:w-auto px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] flex items-center justify-center cursor-pointer"
          aria-label="이전 컷"
        >
          ◀ 이전 컷
        </button>

        <div class="flex-1 w-full flex flex-col justify-center px-1">
          <input
            type="range"
            min="0"
            max="${Math.max(0, currentEp.totalScenes - 1)}"
            value="${playState.currentScene}"
            data-action="play-scrub-scene"
            class="w-full cursor-pointer accent-[#201d1d] min-h-[44px]"
            aria-label="웹툰 씬 타임라인 스크러버"
          />
          <div class="flex justify-between text-[10px] text-stone-500 pt-0.5">
            <span>씬 01 (시작)</span>
            <span class="font-bold text-[#201d1d]">컷 ${playState.currentScene + 1} / ${currentEp.totalScenes}</span>
            <span>씬 ${currentEp.totalScenes} (끝)</span>
          </div>
        </div>

        <button
          type="button"
          data-action="play-next"
          class="w-full sm:w-auto px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] flex items-center justify-center cursor-pointer"
          aria-label="다음 컷"
        >
          다음 컷 ▶
        </button>
      </section>

      <!-- 6. 40-Episode Quick Jump Carousel Grid -->
      <section class="w-full mt-6 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-4 rounded-none space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.12)]">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-[#201d1d]">[40부작 전편 빠른 이동 (Carousel)]</span>
            <span class="text-[11px] text-stone-500">전편 감상 가능</span>
          </div>
          <span class="text-[11px] text-stone-500 font-mono">1~40화 전편 수록</span>
        </div>

        <div class="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-56 overflow-y-auto p-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none">
          ${WEBTOON_40_EPISODES.map((ep) => {
            const isCurrent = ep.episodeNumber === playState.currentEpisode;
            return `
              <button
                type="button"
                data-action="play-set-episode"
                data-episode="${ep.episodeNumber}"
                class="px-2 py-2 text-center text-xs font-bold rounded-sm border min-h-[44px] transition-colors flex flex-col items-center justify-center ${
                  isCurrent
                    ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                    : 'bg-white text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
                }"
                aria-label="제${ep.episodeNumber}화 보기"
                aria-current="${isCurrent ? 'true' : 'false'}"
              >
                <span class="text-[10px] ${isCurrent ? 'text-stone-300' : 'text-stone-400'}">EP</span>
                <span>${String(ep.episodeNumber).padStart(2, '0')}</span>
              </button>
            `;
          }).join('')}
        </div>
      </section>
    </div>
  `;
}
