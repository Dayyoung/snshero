/**
 * src/landing/views/PlaySection.tsx
 *
 * Milestone 3: 3-Tab Segmented Play Section for SNSHero Static Landing.
 *
 * Tab Architecture:
 * 1. adventure (Default Initial View):
 *    - 2D Tile Adventure Map (KadanWorldMap 10x8 grid style).
 *    - Step movement via 4-way D-Pad, Arrow keys/WASD, and direct tile tap.
 *    - Stepping on event tiles activates episode dialogue (KadanNpcDialog style)
 *      with 7-head character cutouts, novel lore scripts, protagonist choices, and countdown timer.
 *    - Concluding dialogue transitions into 3x3 tactical card battle (MobileCardPlayScreen style).
 *    - Match victory awards 50 EXP to active deck cards, supports repeat hunting, and auto-play runner.
 * 2. arcade:
 *    - 110 Poki minigames catalog (CARD_DATABASE IDs 1..110).
 *    - Search bar, element filter pills, and [🎲 랜덤 플레이] die roller.
 *    - Full-screen 100dvh launch modal with 44px+ exit control.
 * 3. webtoon:
 *    - 40-Episode Webtoon scene viewer & media player.
 *    - Strictly preserves the exact 5-button control bar [닫기, 이전, 다음, 나레이션, TTS]
 *      inside <section aria-label="웹툰 컨트롤 바"> and isTtsActive: false default invariant.
 *
 * Adheres strictly to DESIGN.md OpenCode Terminal-Flat specifications:
 * - Zero prohibited decorative classes (rounded-none and rounded-sm only).
 * - min-h-[44px] mobile touch targets across all interactive buttons.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import {
  getWebtoonEpisode,
  getWebtoonSceneImageUrl,
  WEBTOON_40_EPISODES,
  WebtoonEpisodeMeta,
} from '../services/webtoonCatalog';
import { CARD_DATABASE } from '../../cardDatabase';
import {
  KADAN_RPG_EVENTS,
  getKadanRpgRegion,
  chapterTitles,
} from '../../content/kadanRpgStory';
import type { KadanRpgNovelScriptLine } from '../../content/kadanRpgNovelScript';
import { getCutoutUrl, getCharacterAsset, FACTION_PALETTES } from '../services/assetCatalog';
import { cardNurtureStore } from '../services/cardNurtureStore';
import { renderOriginalCardHtml } from '../components/OriginalCardHtml';
import {
  playRpgState,
  setActiveTab,
  getCurrentRegion,
  stepHeroDelta,
  moveHeroToTile,
  getCurrentDialogueLines,
  prevDialogue,
  advanceDialogue,
  selectDialogueChoice,
  initBattle,
  playCardToSlot,
  advanceNextChapter,
  toggleAutoMode,
  toggleRepeatHunting,
  launchArcadeGame,
  closeArcadeModal,
  rollRandomArcadeGame,
  extractDialogueText,
  resolveDialogueSpeakers,
  ensureGameStarted,
  formatChapterLabel,
  closeDialogueAndStopPlay,
  completeReincarnation,
  getEpisodeActualOpponentDeck,
  getOpponentRebirthStatBonus,
  preloadDialogueChapterImages,
  PlayTabKey,
} from '../services/playRpgEngine';

// ============================================================================
// 1. Webtoon Viewer State (Strict Invariant Contract Preserved)
// ============================================================================

export interface PlayViewerState {
  currentEpisode: number;      // 1..40
  currentScene: number;        // 0..(totalScenes - 1)
  isTtsActive: boolean;        // STRICT CONTRACT: default false!
  isNarrationVisible: boolean; // default true
  speechRate: number;
}

// Global singleton state for the static landing Webtoon player
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
  if (!playState.isTtsActive) return;

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

  if (playState.isTtsActive) {
    speakCurrentNarration();
  }
}

/**
 * Jump to a specific episode (1..40).
 */
export function setEpisode(epNum: number): void {
  if (typeof epNum !== 'number' || isNaN(epNum)) epNum = 1;
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
  if (typeof sceneIdx !== 'number' || isNaN(sceneIdx)) sceneIdx = 0;
  const clamped = Math.max(0, Math.min(currentEp.totalScenes - 1, Math.floor(sceneIdx)));
  playState.currentScene = clamped;

  if (playState.isTtsActive) {
    speakCurrentNarration();
  }
}

// ============================================================================
// 2. Event Dispatcher for All Play Actions
// ============================================================================

export function handlePlayAction(action: string, target?: HTMLElement): void {
  switch (action) {
    // Tab switching
    case 'play-tab-adventure':
      setActiveTab('adventure');
      break;
    case 'play-tab-arcade':
      setActiveTab('arcade');
      break;
    case 'play-tab-webtoon':
      setActiveTab('webtoon');
      break;

    // Movement actions
    case 'play-move-up':
      stepHeroDelta(0, -1);
      break;
    case 'play-move-down':
      stepHeroDelta(0, 1);
      break;
    case 'play-move-left':
      stepHeroDelta(-1, 0);
      break;
    case 'play-move-right':
      stepHeroDelta(1, 0);
      break;
    case 'play-tile-click': {
      const xAttr = target?.getAttribute('data-x');
      const yAttr = target?.getAttribute('data-y');
      if (xAttr !== null && yAttr !== null && xAttr !== undefined && yAttr !== undefined) {
        moveHeroToTile({ x: parseInt(xAttr, 10), y: parseInt(yAttr, 10) });
      }
      break;
    }

    // RPG loop toggles
    case 'play-toggle-auto':
      toggleAutoMode();
      break;
    case 'play-toggle-repeat':
      toggleRepeatHunting();
      break;

    // Dialogue actions
    case 'play-dialogue-prev':
      prevDialogue();
      break;
    case 'play-dialogue-next':
      advanceDialogue();
      break;
    case 'play-dialogue-skip':
      initBattle();
      break;
    case 'play-dialogue-close':
      closeDialogueAndStopPlay();
      break;
    case 'play-reincarnate-now':
      completeReincarnation();
      break;
    case 'play-reincarnate-close':
      closeDialogueAndStopPlay();
      break;
    case 'play-dialogue-choice': {
      const idxAttr = target?.getAttribute('data-choice-index');
      if (idxAttr !== null && idxAttr !== undefined) {
        selectDialogueChoice(parseInt(idxAttr, 10));
      }
      break;
    }
    case 'play-battle-start':
      initBattle();
      break;

    // Battle actions
    case 'play-battle-card': {
      const handIdxAttr = target?.getAttribute('data-hand-index');
      if (handIdxAttr !== null && handIdxAttr !== undefined) {
        playRpgState.selectedHandIndex = parseInt(handIdxAttr, 10);
      }
      break;
    }
    case 'play-battle-slot': {
      const slotAttr = target?.getAttribute('data-slot');
      if (slotAttr !== null && slotAttr !== undefined) {
        const slotIdx = parseInt(slotAttr, 10);
        playCardToSlot(playRpgState.selectedHandIndex, slotIdx, 'player');
      }
      break;
    }
    case 'play-repeat-hunting':
      initBattle();
      break;
    case 'play-next-chapter':
      advanceNextChapter();
      break;

    // Ambush actions
    case 'play-ambush-start':
      if (playRpgState.activeAmbush) {
        initBattle(
          playRpgState.activeAmbush.type === 'bandit' ? [82, 81, 35, 15, 85] : [54, 51, 62, 53, 57],
          playRpgState.activeAmbush.name
        );
      }
      break;
    case 'play-ambush-evade':
      playRpgState.activeAmbush = null;
      break;

    // Arcade actions
    case 'play-arcade-search': {
      const input = target as HTMLInputElement | null;
      if (input) {
        playRpgState.arcadeQuery = input.value.trim().toLowerCase();
      }
      break;
    }
    case 'play-arcade-filter-element': {
      const el = target?.getAttribute('data-element') || 'all';
      playRpgState.arcadeElement = el;
      break;
    }
    case 'play-arcade-random':
      rollRandomArcadeGame();
      break;
    case 'play-arcade-launch': {
      const cardIdAttr = target?.getAttribute('data-card-id');
      if (cardIdAttr) {
        launchArcadeGame(parseInt(cardIdAttr, 10));
      }
      break;
    }
    case 'play-arcade-close':
      closeArcadeModal();
      break;

    // Webtoon actions
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

// ============================================================================
// 3. Tab Sub-Renderers
// ============================================================================

/**
 * Render Tab 1: 2D Tile Adventure Map & RPG Battle Loop
 */
function renderAdventureView(): string {
  const currentChapter = playRpgState.currentChapter;
  const rebirthLevel = playRpgState.reincarnationLevel;
  const chapterLabel = formatChapterLabel(currentChapter, rebirthLevel);
  const chapterMeta = chapterTitles.find((c) => c.chapter === currentChapter) || {
    chapter: currentChapter,
    titleKo: `${chapterLabel}의 여정`,
    titleEn: `Chapter ${currentChapter} Journey`,
  };
  const region = getCurrentRegion();
  const chEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === currentChapter);
  const heroX = playRpgState.heroTile.x;
  const heroY = playRpgState.heroTile.y;

  return `
    <div id="kadan-world-map" class="w-full space-y-4">
      <!-- Stage Info Bar -->
      <section class="w-full bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-4 rounded-none flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[11px] font-bold rounded-sm uppercase tracking-wider mb-1">
            <span>2D 모험 RPG</span>
            <span class="text-stone-400">·</span>
            <span>지역: ${region.nameKey}</span>
            ${
              rebirthLevel > 0
                ? `<span class="text-amber-400 font-black">· 👑 환생 ${rebirthLevel}회차</span>`
                : ''
            }
          </div>
          <h2 class="text-lg sm:text-xl font-black text-[#201d1d] m-0">
            ${chapterLabel}: ${chapterMeta.titleKo}
          </h2>
          <p class="text-xs text-stone-500 m-0 pt-0.5">
            ${chapterMeta.titleEn} · 목표: ${chEvent ? chEvent.objectiveKey : '원정 진행 중'}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Coordinates Badge -->
          <span class="px-3 py-2 bg-white text-[#201d1d] text-xs font-bold rounded-sm border border-[rgba(15,0,0,0.12)] min-h-[44px] inline-flex items-center">
            📍 좌표 (${heroX + 1}, ${heroY + 1})
          </span>

          <!-- Auto-Play Toggle -->
          <button
            type="button"
            data-action="play-toggle-auto"
            class="px-4 py-2 border text-xs font-bold rounded-sm min-h-[44px] inline-flex items-center justify-center cursor-pointer transition-colors active:translate-y-px ${
              playRpgState.autoMode
                ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                : 'bg-[#f1eeee] text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#e8e5e5]'
            }"
            aria-label="자동 진행 토글"
          >
            🤖 자동 진행 ${playRpgState.autoMode ? '[ON]' : '[OFF]'}
          </button>

          <!-- Repeat Hunting Toggle -->
          <button
            type="button"
            data-action="play-toggle-repeat"
            class="px-4 py-2 border text-xs font-bold rounded-sm min-h-[44px] inline-flex items-center justify-center cursor-pointer transition-colors active:translate-y-px ${
              playRpgState.repeatHunting
                ? 'bg-emerald-800 text-white border-emerald-900'
                : 'bg-[#f1eeee] text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#e8e5e5]'
            }"
            aria-label="반복 사냥 토글"
          >
            🔁 반복 사냥 ${playRpgState.repeatHunting ? '[ON]' : '[OFF]'}
          </button>

          <!-- Direct 3x3 Card Battle Popup Launch Button (Mobile & Desktop Quick Access) -->
          <button
            type="button"
            data-action="play-battle-start"
            class="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white border border-rose-800 text-xs font-black rounded-sm min-h-[44px] inline-flex items-center justify-center cursor-pointer transition-colors active:translate-y-px"
            aria-label="3x3 카드 배틀 팝업 열기"
          >
            ⚔️ 3x3 카드 배틀
          </button>
        </div>
      </section>

      <!-- Sub-State: Ambush Alert Banner -->
      ${
        playRpgState.activeAmbush
          ? `
            <div class="w-full bg-rose-50 border-2 border-rose-600 p-4 rounded-none flex flex-wrap items-center justify-between gap-3">
              <div>
                <span class="text-xs font-black text-rose-700 uppercase tracking-wider">[⚠️ 마물/산적 기습 발생!]</span>
                <p class="text-sm font-bold text-rose-950 m-0 pt-0.5">${playRpgState.activeAmbush.name}의 습격을 받았습니다!</p>
                <p class="text-xs text-rose-800 m-0 pt-0.5">"${playRpgState.activeAmbush.dialogQuoteKo}"</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  data-action="play-ambush-start"
                  class="px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-sm min-h-[44px] hover:bg-rose-500 cursor-pointer"
                >
                  ⚔️ 즉시 요격 (배틀)
                </button>
                <button
                  type="button"
                  data-action="play-ambush-evade"
                  class="px-4 py-2.5 bg-white text-stone-700 border border-stone-300 text-xs font-bold rounded-sm min-h-[44px] hover:bg-stone-100 cursor-pointer"
                >
                  돌파 회피
                </button>
              </div>
            </div>
          `
          : ''
      }

      <!-- Sub-State: 1. 2D Tile Map Grid & Movement Controls -->
      ${
        playRpgState.subState === 'map' ||
        playRpgState.subState === 'dialogue' ||
        playRpgState.subState === 'battle' ||
        playRpgState.subState === 'reincarnation'
          ? `
            <section class="w-full bg-[#090d16] border border-[rgba(15,0,0,0.12)] p-4 sm:p-6 rounded-none">
              <!-- 10x8 Grid Container -->
              <div
                class="grid gap-1 sm:gap-1.5 w-full max-w-3xl mx-auto aspect-[10/8] select-none"
                style="grid-template-columns: repeat(${region.width}, minmax(0, 1fr));"
              >
                ${Array.from({ length: region.width * region.height }, (_, idx) => {
                  const tileX = idx % region.width;
                  const tileY = Math.floor(idx / region.width);
                  const isBlocked = region.blockedTiles.some((b) => b.x === tileX && b.y === tileY);
                  const isHero = heroX === tileX && heroY === tileY;
                  const isTarget = chEvent?.tile.x === tileX && chEvent?.tile.y === tileY;

                  let cellBg = isBlocked ? 'bg-stone-900/90' : 'bg-[#151c2e] hover:bg-[#1f2942]';
                  let borderStyle = isTarget ? 'border-2 border-amber-400' : 'border border-white/10';

                  return `
                    <button
                      type="button"
                      data-action="play-tile-click"
                      data-x="${tileX}"
                      data-y="${tileY}"
                      ${isBlocked ? 'disabled' : ''}
                      class="relative w-full h-full min-h-[32px] sm:min-h-[44px] rounded-none ${cellBg} ${borderStyle} transition-colors flex items-center justify-center cursor-pointer p-0 select-none"
                      aria-label="타일 (${tileX + 1}, ${tileY + 1})"
                    >
                      ${
                        isHero
                          ? `
                            <div class="w-7 h-7 sm:w-9 sm:h-9 rounded-none border border-white bg-amber-400 p-0.5 flex items-center justify-center shadow-none z-20">
                              <img src="/rpg/kadan-map/hero-kadan.png" alt="카단" class="w-full h-full object-cover" onerror="this.src='/seat/Kadan.png'; this.onerror=null;" />
                            </div>
                          `
                          : isTarget
                          ? `
                            <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-none border border-amber-300 bg-amber-500/30 flex items-center justify-center text-amber-300 text-xs font-bold z-10 animate-pulse">
                              🚩
                            </div>
                          `
                          : isBlocked
                          ? `<span class="text-stone-600 text-[10px]">✕</span>`
                          : `<span class="text-white/20 text-[9px]">${tileX + 1},${tileY + 1}</span>`
                      }
                    </button>
                  `;
                }).join('')}
              </div>

              <!-- D-Pad Directional Controls -->
              <div class="mt-6 flex flex-col items-center justify-center gap-2">
                <span class="text-xs text-stone-400 font-bold">
                  [방향키, W/A/S/D 키 또는 아래 버튼으로 이동 · 타일 직접 터치 이동 지원]
                </span>
                <div class="flex flex-col items-center gap-1.5 pt-1">
                  <!-- Up -->
                  <button
                    type="button"
                    data-action="play-move-up"
                    class="w-14 h-11 bg-[#fdfcfc] text-[#201d1d] border border-white/20 text-sm font-black rounded-sm hover:bg-stone-200 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:translate-y-px"
                    aria-label="위로 이동"
                  >
                    ▲
                  </button>
                  <!-- Left, Down, Right -->
                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      data-action="play-move-left"
                      class="w-14 h-11 bg-[#fdfcfc] text-[#201d1d] border border-white/20 text-sm font-black rounded-sm hover:bg-stone-200 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:translate-y-px"
                      aria-label="왼쪽으로 이동"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      data-action="play-move-down"
                      class="w-14 h-11 bg-[#fdfcfc] text-[#201d1d] border border-white/20 text-sm font-black rounded-sm hover:bg-stone-200 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:translate-y-px"
                      aria-label="아래로 이동"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      data-action="play-move-right"
                      class="w-14 h-11 bg-[#fdfcfc] text-[#201d1d] border border-white/20 text-sm font-black rounded-sm hover:bg-stone-200 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:translate-y-px"
                      aria-label="오른쪽으로 이동"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>
            </section>
          `
          : ''
      }

      <!-- Sub-State: 2. Dialogue Modal Popup Overlay (Top-Left/Right Character Recognition & Clean Dialogue Only) -->
      ${
        playRpgState.subState === 'dialogue'
          ? (() => {
              const lines = getCurrentDialogueLines();
              const defaultLine: KadanRpgNovelScriptLine = {
                speaker: 'kadan',
                cardId: 41,
                name: '카단',
                nameEn: 'Kadan',
                text: '눈보라가 거세지고 있다. 물러설 수 없다.',
                textEn: 'The blizzard thickens. There is no turning back.',
                dialogueQuoteKo: '서약은 얼어붙지 않는다.',
                choices: [],
              };
              const line: KadanRpgNovelScriptLine = lines[playRpgState.currentDialogueLineIdx] || defaultLine;
              const isFinal = playRpgState.currentDialogueLineIdx >= lines.length - 1;

              // Clean dialogue text & speaker resolution (Single alternating active speaker bust only)
              preloadDialogueChapterImages();
              const speakers = resolveDialogueSpeakers(line);
              const activeSpeaker = speakers.activeSide === 'left' ? speakers.left : speakers.right;
              const dialogueData = extractDialogueText(line, activeSpeaker.name);
              const activeSpeakerAsset = getCharacterAsset(activeSpeaker.cardId);

              return `
                <div
                  id="play-dialogue-modal-root"
                  class="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] sm:pt-[12vh] p-3 sm:p-4 font-mono select-none"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="dialogue-modal-speaker"
                >
                  <!-- Backdrop Overlay with Blur -->
                  <div
                    data-action="play-dialogue-close"
                    class="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity cursor-pointer"
                    aria-hidden="true"
                  ></div>

                  <!-- Dialogue Box Container with Fixed Character Position & Fixed Controls -->
                  <div class="relative z-10 w-full max-w-xl text-[#fdfcfc] rounded-none pt-20 sm:pt-24">
                    
                    <!-- Single Active Speaking Character (Fixed Vertical Coordinate, Alternates Left / Right) -->
                    <div class="absolute top-0 ${
                      speakers.activeSide === 'left' ? 'left-3 sm:left-6' : 'right-3 sm:right-6'
                    } flex flex-col items-center z-20 transition-all duration-200">
                      <div class="relative w-24 h-24 sm:w-28 sm:h-28 bg-[#0d0b0b] border-2 border-amber-400 bg-amber-950/20 rounded-none overflow-hidden flex items-end justify-center">
                        <img
                          id="dialogue-speaker-bust-img"
                          src="${activeSpeakerAsset.bustPngUrl}?v=20261103v4"
                          alt="${activeSpeaker.name}"
                          loading="eager"
                          class="w-full h-full object-contain"
                          onerror="this.src='${activeSpeakerAsset.seatUrl}'; this.onerror=null;"
                        />
                      </div>
                      <div class="mt-1 px-2.5 py-0.5 text-center bg-amber-400 text-stone-950 font-black text-[11px] sm:text-xs rounded-sm max-w-[110px] sm:max-w-[140px] truncate">
                        ${activeSpeaker.name}
                      </div>
                    </div>

                    <!-- Dialogue Modal Frame: Fixed Top/Bottom Control Positions, Dynamic Speech Bubble Height -->
                    <div class="relative bg-[#181515] text-[#fdfcfc] border border-amber-400/60 shadow-2xl rounded-none p-4 sm:p-6 pt-12 sm:pt-14 h-[350px] sm:h-[370px] flex flex-col justify-between">
                      
                      <!-- Fixed Top Header & Speaker Tag (Never Moves) -->
                      <div class="shrink-0 space-y-2.5">
                        <!-- Top Bar: Chapter Title, Skip Button & Close (Stop Play) Button -->
                        <div class="flex items-center justify-between pb-2 border-b border-white/10 gap-2">
                          <span class="text-xs font-bold text-amber-400 truncate">
                            ${chapterLabel} [${playRpgState.currentDialogueLineIdx + 1} / ${lines.length}]
                          </span>
                          <div class="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              data-action="play-dialogue-skip"
                              class="px-2.5 py-1.5 bg-stone-800 text-stone-300 text-xs font-bold rounded-sm border border-stone-600 min-h-[44px] hover:bg-stone-700 cursor-pointer shrink-0"
                              aria-label="대화 건너뛰기 및 전투 직행"
                            >
                              건너뛰기 ▶
                            </button>
                            <button
                              type="button"
                              data-action="play-dialogue-close"
                              class="px-3 py-1.5 bg-rose-950/90 text-rose-200 text-xs font-black rounded-sm border border-rose-500/70 min-h-[44px] hover:bg-rose-900 cursor-pointer shrink-0"
                              aria-label="대사 창 닫기 및 플레이 중지"
                            >
                              ✕ 닫기
                            </button>
                          </div>
                        </div>

                        <!-- Active Speaker Tag -->
                        <div class="flex items-center gap-2">
                          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-400 text-stone-950 text-xs font-black rounded-sm uppercase">
                            <span id="dialogue-modal-speaker">${activeSpeaker.name}</span>
                          </div>
                          <span class="text-[11px] text-stone-400 truncate">
                            ${speakers.speakerTitle}
                          </span>
                        </div>
                      </div>

                      <!-- Middle Slot: Speech Bubble Dynamically Changes Height According to Dialogue Text -->
                      <div class="flex-1 flex flex-col justify-start py-2 overflow-y-auto space-y-2.5">
                        <!-- Dynamic-Height Dialogue Speech Bubble (h-auto) -->
                        <div class="w-full h-auto p-3.5 sm:p-4 bg-[#100d0d] border border-amber-400/50 rounded-none relative transition-all duration-150">
                          <!-- Speech Bubble Pointer Arrow pointing toward the active speaker -->
                          <div
                            class="absolute -top-2 ${
                              speakers.activeSide === 'left' ? 'left-8 sm:left-12' : 'right-8 sm:right-12'
                            } w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-amber-400/60"
                          ></div>

                          <div class="space-y-1.5">
                            ${dialogueData.text
                              .split('\n\n')
                              .map(
                                (paragraph) => `
                              <p class="text-sm sm:text-base font-bold text-amber-100 leading-relaxed m-0 break-keep">
                                ${paragraph}
                              </p>
                            `
                              )
                              .join('')}
                          </div>
                        </div>

                        <!-- Protagonist Interactive Choices -->
                        ${
                          line.choices && line.choices.length > 0
                            ? `
                              <div class="pt-1 border-t border-white/10 space-y-1.5">
                                <div class="flex items-center justify-between text-[11px] text-stone-400">
                                  <span>주인공 선택지 (${playRpgState.autoMode ? '3.0초 후 자동 진행' : '선택 대기'})</span>
                                  <span class="text-amber-400 font-bold">${line.choices.length}개 선택 가능</span>
                                </div>
                                <div class="grid grid-cols-1 gap-1.5">
                                  ${line.choices
                                    .map(
                                      (c, cIdx) => `
                                    <button
                                      type="button"
                                      data-action="play-dialogue-choice"
                                      data-choice-index="${cIdx}"
                                      class="px-3.5 py-2.5 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] border border-amber-400/50 text-xs font-bold rounded-sm min-h-[44px] text-left transition-colors flex items-center justify-between cursor-pointer active:translate-y-px"
                                    >
                                      <span><span class="text-amber-400 font-black mr-1.5">[${c.attitude || '결의'}]</span>${c.labelKo || c.labelEn || '선택'}</span>
                                      <span class="text-[10px] text-emerald-400 font-mono">${c.bonusType === 'sns' ? '+SNS 코인' : '+버프 각성'}</span>
                                    </button>
                                  `
                                    )
                                    .join('')}
                                </div>
                              </div>
                            `
                            : ''
                        }
                      </div>

                      <!-- Fixed Bottom Navigation Bar (Never Moves When Dialogue Length Changes) -->
                      <div class="shrink-0 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            data-action="play-dialogue-close"
                            class="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer"
                            aria-label="대사 창 닫기 및 플레이 중지"
                          >
                            ✕ 닫기
                          </button>
                          <span class="hidden sm:inline text-[11px] text-stone-400 font-mono">
                            ${playRpgState.autoMode ? '⚡ 자동 진행 중' : '수동 진행'}
                          </span>
                        </div>
                        <div class="flex items-center gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            data-action="play-dialogue-prev"
                            ${playRpgState.currentDialogueLineIdx <= 0 ? 'disabled' : ''}
                            class="px-3 sm:px-4 py-2.5 ${
                              playRpgState.currentDialogueLineIdx <= 0
                                ? 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                                : 'bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-500 cursor-pointer active:translate-y-px'
                            } text-xs font-black rounded-sm min-h-[44px] transition-colors flex items-center gap-1"
                            aria-label="이전 대화로 이동"
                          >
                            ◀ 이전 대화
                          </button>
                          ${
                            isFinal
                              ? `
                                <button
                                  type="button"
                                  data-action="play-battle-start"
                                  class="px-4 sm:px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-black rounded-sm min-h-[44px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-none active:scale-95"
                                >
                                  ⚔️ 전투 시작 ▶
                                </button>
                              `
                              : `
                                <button
                                  type="button"
                                  data-action="play-dialogue-next"
                                  class="px-4 sm:px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black rounded-sm min-h-[44px] transition-colors flex items-center gap-1 cursor-pointer active:translate-y-px"
                                >
                                  다음 대화 ▶
                                </button>
                              `
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            })()
          : ''
      }

      <!-- Sub-State: 3. 3x3 Tactical Card Battle Modal Popup (Compact Header + 1-Row Dynamic Card Deck on Mobile) -->
      ${
        playRpgState.subState === 'battle'
          ? (() => {
              const epDeck = getEpisodeActualOpponentDeck(currentChapter);
              const rebirthBonus = getOpponentRebirthStatBonus(
                playRpgState.reincarnationLevel,
                currentChapter,
              );
              return `
            <div
              id="play-battle-modal-root"
              class="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 font-mono select-none overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="battle-modal-title"
            >
              <!-- Backdrop Overlay -->
              <div
                data-action="play-dialogue-close"
                class="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity cursor-pointer"
                aria-hidden="true"
              ></div>

              <!-- Battle Popup Dialog Box -->
              <section class="relative z-10 w-full max-w-4xl my-auto max-h-[96dvh] overflow-y-auto bg-[#060a14] border-2 border-amber-400/70 p-2.5 sm:p-5 rounded-none space-y-2 sm:space-y-3 text-white shadow-2xl">
                <!-- Ultra-Compact Single-Line Battle Header (Unnecessary Top Text Removed) -->
                <div class="flex items-center justify-between pb-1.5 border-b border-white/10 gap-2">
                  <div class="flex items-center gap-1.5 min-w-0 truncate">
                    <span class="px-1.5 py-0.5 bg-amber-400 text-stone-950 text-[10px] sm:text-xs font-black rounded-sm shrink-0">
                      ${chapterLabel}
                    </span>
                    <h3 id="battle-modal-title" class="text-xs sm:text-base font-black text-white m-0 truncate">
                      vs ${epDeck.leaderName} 외 (${epDeck.deckNames.slice(0, 3).join('·')})
                    </h3>
                    ${
                      playRpgState.reincarnationLevel > 0
                        ? `<span class="px-1.5 py-0.5 bg-purple-950 text-purple-200 border border-purple-500/70 text-[9px] sm:text-[10px] font-black rounded-sm shrink-0">🔥+${rebirthBonus}</span>`
                        : ''
                    }
                  </div>
                  <button
                    type="button"
                    data-action="play-dialogue-close"
                    class="px-2.5 py-1 bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-500/70 text-xs font-black rounded-sm min-h-[38px] sm:min-h-[44px] cursor-pointer shrink-0"
                    aria-label="배틀 중지 및 맵으로 복귀"
                  >
                    ✕ 닫기
                  </button>
                </div>

                <!-- 3x3 Battle Field Board -->
                <div class="grid grid-cols-3 gap-1 sm:gap-2 w-full max-w-[235px] sm:max-w-[320px] mx-auto aspect-square select-none p-1 sm:p-2 bg-[#0c1220] border border-white/10">
                  ${playRpgState.battleBoard
                    .map((slot, sIdx) => {
                      if (!slot) {
                        return `
                          <button
                            type="button"
                            data-action="play-battle-slot"
                            data-slot="${sIdx}"
                            class="w-full h-full border border-dashed border-white/25 bg-white/5 hover:bg-white/15 rounded-none flex flex-col items-center justify-center text-xs text-stone-400 font-bold min-h-[44px] cursor-pointer active:translate-y-px transition-colors"
                            aria-label="슬롯 ${sIdx + 1} 배치"
                          >
                            <span class="text-[10px] text-stone-500">${sIdx + 1}</span>
                            <span class="text-amber-400 text-[11px] font-black">[배치]</span>
                          </button>
                        `;
                      }

                      const isPlayer = slot.owner === 'player';
                      const [top, right, bottom, left] = slot.stats;
                      const slotAsset = getCharacterAsset(slot.cardId);

                      return `
                        <div class="relative w-full h-full border-2 ${
                          isPlayer ? 'border-sky-400 bg-sky-950/90 text-sky-100' : 'border-rose-500 bg-rose-950/90 text-rose-100'
                        } rounded-none p-1 flex flex-col justify-between overflow-hidden shadow-none">
                          <!-- Character Bust Background Art -->
                          <div class="absolute inset-0 z-0 flex items-center justify-center p-1 opacity-95 pointer-events-none">
                            <img
                              src="${slotAsset.bustPngUrl}?v=20261103v4"
                              alt="${slotAsset.nameKo}"
                              class="w-full h-full object-contain"
                              onerror="this.src='${slotAsset.seatUrl}'; this.onerror=null;"
                            />
                          </div>

                          <!-- Top Row: Owner Badge & North Stat -->
                          <div class="relative z-10 flex items-center justify-between w-full px-0.5">
                            <span class="px-1 py-0.5 text-[9px] font-black rounded-xs ${
                              isPlayer ? 'bg-sky-500 text-slate-950' : 'bg-rose-500 text-white'
                            }">${isPlayer ? 'P1' : 'AI'}</span>
                            <span class="min-w-[18px] h-[18px] px-1 bg-black/80 border border-white/40 text-white text-[10px] font-black flex items-center justify-center rounded-xs">${top}</span>
                            <span class="w-4"></span>
                          </div>

                          <!-- Middle Row: West & East Stats -->
                          <div class="relative z-10 flex items-center justify-between w-full px-0.5 my-auto">
                            <span class="min-w-[18px] h-[18px] px-1 bg-black/80 border border-white/40 text-white text-[10px] font-black flex items-center justify-center rounded-xs">${left}</span>
                            <span class="min-w-[18px] h-[18px] px-1 bg-black/80 border border-white/40 text-white text-[10px] font-black flex items-center justify-center rounded-xs">${right}</span>
                          </div>

                          <!-- Bottom Row: Card Name & South Stat -->
                          <div class="relative z-10 flex items-center justify-between w-full px-0.5 bg-black/75 py-0.5">
                            <span class="text-[9px] font-bold text-white truncate max-w-[65%]">${slotAsset.nameKo}</span>
                            <span class="min-w-[18px] h-[18px] px-1 bg-amber-400 text-stone-950 text-[10px] font-black flex items-center justify-center rounded-xs">${bottom}</span>
                          </div>
                        </div>
                      `;
                    })
                    .join('')}
                </div>

                <!-- Player Active Hand Cards (1-Row Dynamic Card Width, Zero Extra Header Clutter) -->
                <div class="pt-1.5 border-t border-white/10">
                  <div class="flex flex-nowrap items-stretch justify-center gap-1 sm:gap-2.5 pt-1 w-full">
                    ${playRpgState.playerHand
                      .map((cId, hIdx) => {
                        const isSelected = playRpgState.selectedHandIndex === hIdx;
                        return `
                          <button
                            type="button"
                            data-action="play-battle-card"
                            data-hand-index="${hIdx}"
                            class="relative flex-1 min-w-0 max-w-[23%] sm:max-w-[20%] text-left p-0 bg-transparent border-0 cursor-pointer transition-transform ${
                              isSelected
                                ? '-translate-y-1.5 ring-2 ring-amber-400 rounded-sm z-20'
                                : 'hover:-translate-y-0.5 opacity-95 hover:opacity-100'
                            }"
                          >
                            ${
                              isSelected
                                ? `<span class="absolute -top-2.5 left-1/2 -translate-x-1/2 z-40 px-1.5 sm:px-2 py-0.5 bg-amber-400 text-stone-950 text-[8px] sm:text-[9px] font-black rounded-xs whitespace-nowrap border border-stone-900">▼ 선택됨</span>`
                                : ''
                            }
                            ${renderOriginalCardHtml(cId, {
                              isSelected,
                              isOwned: true,
                              showRedDot: false,
                              size: 'responsive',
                              visualTier: 'bust',
                              className: 'w-full min-w-0 aspect-[5/7] sm:min-h-[180px]',
                            })}
                          </button>
                        `;
                      })
                      .join('')}
                  </div>
                </div>

                <!-- Battle Result Controls (Victory Required to Advance Chapter) -->
                ${
                  playRpgState.battleWinner
                    ? `
                      <div class="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                        <div class="text-xs sm:text-sm font-bold ${
                          playRpgState.battleWinner === 'player' ? 'text-emerald-400' : 'text-rose-400'
                        }">
                          ${
                            playRpgState.battleWinner === 'player'
                              ? '🎉 전투 승리! 50 EXP 획득 완료.'
                              : '⚠️ 승리하지 못하면 다음 회차로 진행할 수 없습니다. 카드를 업그레이드(#card)하거나 재도전하세요!'
                          }
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            data-action="play-repeat-hunting"
                            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-sm min-h-[44px] cursor-pointer"
                          >
                            ${playRpgState.battleWinner === 'player' ? '🔁 반복 사냥 재전투' : '⚔️ 현재 회차 재도전'}
                          </button>
                          ${
                            playRpgState.battleWinner === 'player'
                              ? `
                                <button
                                  type="button"
                                  data-action="play-next-chapter"
                                  class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black rounded-sm min-h-[44px] cursor-pointer"
                                >
                                  ${currentChapter >= 40 ? '👑 40화 완주 · 환생하기 ▶' : '다음 챕터로 전진 ▶'}
                                </button>
                              `
                              : `
                                <button
                                  type="button"
                                  data-nav="card"
                                  class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black rounded-sm min-h-[44px] cursor-pointer"
                                >
                                  ⬆️ 카드 업그레이드 (#card)
                                </button>
                              `
                          }
                        </div>
                      </div>
                    `
                    : ''
                }
              </section>
            </div>
          `;
            })()
          : ''
      }

      <!-- Sub-State: 4. 3-Second Reincarnation Modal Popup (After Episode 40 Completes) -->
      ${
        playRpgState.subState === 'reincarnation'
          ? (() => {
              const nextRebirth = playRpgState.reincarnationLevel + 1;
              const remainingSec = Math.max(0, playRpgState.reincarnationTimerSec);
              const progressPct = Math.max(0, Math.min(100, (remainingSec / 3.0) * 100));
              const kadanAsset = getCharacterAsset(41);

              return `
                <div
                  id="play-reincarnation-modal-root"
                  class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-mono select-none"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="reincarnation-modal-title"
                >
                  <!-- Backdrop Overlay -->
                  <div
                    class="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity"
                    aria-hidden="true"
                  ></div>

                  <!-- Reincarnation Dialog Box -->
                  <div class="relative z-10 w-full max-w-lg bg-[#181515] text-[#fdfcfc] border-2 border-amber-400 rounded-none p-5 sm:p-6 space-y-4">
                    <!-- Top Header -->
                    <div class="flex items-center justify-between border-b border-white/15 pb-3 gap-2">
                      <div>
                        <span class="inline-block px-2 py-0.5 bg-amber-400 text-stone-950 text-[10px] font-black rounded-sm uppercase tracking-wider mb-1">
                          👑 40화 대장정 완주 · 차원 환생
                        </span>
                        <h3 id="reincarnation-modal-title" class="text-base sm:text-lg font-black text-white m-0">
                          환생 ${nextRebirth}회차 각성 (환생${nextRebirth}-1화 시작)
                        </h3>
                      </div>
                      <button
                        type="button"
                        data-action="play-reincarnate-close"
                        class="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer shrink-0"
                        aria-label="환생 창 닫기 및 플레이 중지"
                      >
                        ✕ 닫기
                      </button>
                    </div>

                    <!-- Character & Description -->
                    <div class="flex items-center gap-4 bg-[#100d0d] border border-amber-400/40 p-3.5 rounded-none">
                      <div class="w-20 h-20 sm:w-24 sm:h-24 bg-[#0d0b0b] border border-amber-400 rounded-none shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src="${kadanAsset.bustPngUrl}?v=20261103v4"
                          alt="카단"
                          class="w-full h-full object-contain"
                          onerror="this.src='${kadanAsset.seatUrl}'; this.onerror=null;"
                        />
                      </div>
                      <div class="space-y-1.5 text-xs">
                        <p class="text-amber-200 font-bold leading-relaxed m-0">
                          제40화의 마지막 결전을 넘어 새로운 차원의 지평선이 열렸습니다!
                        </p>
                        <p class="text-stone-300 leading-relaxed m-0">
                          보유 카드와 육성 레벨(Lv)은 모두 영구 보존되며, <strong class="text-amber-400">[환생${nextRebirth}-1화]</strong>부터 더욱 강력한 적들과 새로운 여정이 시작됩니다.
                        </p>
                      </div>
                    </div>

                    <!-- 3-Second Auto Reincarnation Countdown Bar -->
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between text-xs font-bold text-amber-300">
                        <span>⚡ 3초 후 [환생${nextRebirth}-1화]가 자동으로 시작됩니다...</span>
                        <span>${remainingSec.toFixed(1)}s</span>
                      </div>
                      <div class="w-full h-2 bg-stone-800 border border-white/15 rounded-none overflow-hidden">
                        <div
                          class="h-full bg-amber-400 transition-all duration-100 ease-linear"
                          style="width: ${progressPct}%"
                        ></div>
                      </div>
                    </div>

                    <!-- Footer Buttons -->
                    <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <div class="px-3 py-2 bg-stone-900 border border-amber-400/40 text-xs font-black text-amber-400">
                        👑 환생 레벨: Lv.${nextRebirth}
                      </div>
                      <button
                        type="button"
                        data-action="play-reincarnate-now"
                        class="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs sm:text-sm font-black rounded-sm min-h-[44px] cursor-pointer"
                      >
                        👑 환생${nextRebirth}-1화 즉시 시작 (${Math.max(1, Math.ceil(remainingSec))}s) ▶
                      </button>
                    </div>
                  </div>
                </div>
              `;
            })()
          : ''
      }
    </div>
  `;
}

/**
 * Render Tab 2: 110 Poki Minigames Arcade Catalog
 */
function renderArcadeView(): string {
  const query = playRpgState.arcadeQuery.toLowerCase();
  const selectedElement = playRpgState.arcadeElement;

  const elements = [
    { key: 'all', label: '전체 (All)' },
    { key: 'water', label: '물 (Water)' },
    { key: 'fire', label: '불 (Fire)' },
    { key: 'wind', label: '바람 (Wind)' },
    { key: 'earth', label: '땅 (Earth)' },
    { key: 'human', label: '인간 (Human)' },
    { key: 'undead', label: '언데드 (Undead)' },
    { key: 'elf', label: '엘프 (Elf)' },
    { key: 'dwarf', label: '호빗 (Hobbit)' },
    { key: 'monster', label: '야수 (Beast)' },
    { key: 'robot', label: '메카 (Mecha)' },
    { key: 'dragon', label: '드래곤 (Dragon)' },
  ];

  // 110 Games Filter
  const filteredGames: { id: number; title: string; element: string; power: number }[] = [];
  for (let id = 1; id <= 110; id++) {
    const card = CARD_DATABASE[id];
    if (!card) continue;

    const rawEl = card.element?.toLowerCase() || 'water';
    const el = rawEl === 'air' ? 'wind' : rawEl;
    const titleMatch = card.title?.toLowerCase().includes(query) || (card.desc && card.desc.toLowerCase().includes(query));
    const elMatch = selectedElement === 'all' || el === selectedElement;

    if (titleMatch && elMatch) {
      filteredGames.push({
        id,
        title: card.title || `Hero ${id}`,
        element: el,
        power: (card.top || 2) + (card.right || 2) + (card.bottom || 2) + (card.left || 2),
      });
    }
  }

  return `
    <div class="w-full space-y-4">
      <!-- Arcade Header & Controls -->
      <section class="w-full bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-4 rounded-none space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[rgba(15,0,0,0.12)]">
          <div>
            <span class="text-xs font-bold text-[#201d1d] uppercase">[110선 Poki 미니게임 아케이드 카탈로그]</span>
            <p class="text-xs text-stone-500 m-0 pt-0.5">
              110종 영웅 수호 덱과 2D Canvas 챌린지 플레이 · 100% 모바일 퓨어 터치 지원
            </p>
          </div>

          <!-- Random Play Roller Button -->
          <button
            type="button"
            data-action="play-arcade-random"
            class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] hover:bg-stone-800 text-xs font-bold rounded-sm min-h-[44px] inline-flex items-center gap-1.5 cursor-pointer active:translate-y-px"
            aria-label="랜덤 플레이"
          >
            🎲 랜덤 플레이 (Die Roll)
          </button>
        </div>

        <!-- Search Input -->
        <div class="w-full">
          <input
            type="text"
            data-action="play-arcade-search"
            value="${playRpgState.arcadeQuery}"
            placeholder="미니게임 및 캐릭터 검색 (110종)..."
            class="w-full px-3 py-2 bg-white text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px]"
            aria-label="미니게임 검색"
          />
        </div>

        <!-- Element Filter Pills -->
        <div class="flex flex-wrap items-center gap-1.5">
          ${elements
            .map(
              (el) => `
            <button
              type="button"
              data-action="play-arcade-filter-element"
              data-element="${el.key}"
              class="px-3 py-1.5 text-xs font-bold rounded-sm border min-h-[44px] transition-colors cursor-pointer ${
                selectedElement === el.key
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#f1eeee] text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#e8e5e5]'
              }"
            >
              ${el.label}
            </button>
          `
            )
            .join('')}
        </div>
      </section>

      <!-- 110 Games Grid -->
      <section class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        ${filteredGames
          .map((g) => {
            const padId = String(g.id).padStart(3, '0');
            const gAsset = getCharacterAsset(g.id);
            return `
              <div class="bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-3 rounded-none flex flex-col justify-between space-y-2 hover:border-stone-400 transition-colors">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold text-stone-400 font-mono">#${padId}</span>
                  <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-stone-100 rounded-sm">${g.element}</span>
                </div>

                <div class="w-full aspect-[4/3] bg-stone-100 border border-[rgba(15,0,0,0.08)] rounded-none flex items-center justify-center overflow-hidden p-1">
                  <img
                    src="${gAsset.bustPngUrl}"
                    alt="${g.title}"
                    class="h-full object-contain"
                    onerror="this.src='${gAsset.seatUrl}'; this.onerror=null;"
                  />
                </div>

                <div>
                  <h4 class="text-xs font-bold text-[#201d1d] m-0 truncate">${g.title}</h4>
                  <span class="text-[10px] text-stone-500 font-mono">전투력: ${g.power} TP</span>
                </div>

                <button
                  type="button"
                  data-action="play-arcade-launch"
                  data-card-id="${g.id}"
                  class="w-full py-2 bg-[#f1eeee] text-[#201d1d] hover:bg-[#201d1d] hover:text-[#fdfcfc] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="${g.title} 플레이"
                >
                  🎮 도전 / 플레이
                </button>
              </div>
            `;
          })
          .join('')}
      </section>

      <!-- Minigame Fullscreen 100dvh Launch Modal -->
      ${
        playRpgState.activeArcadeModalId !== null
          ? (() => {
              const activeCard = CARD_DATABASE[playRpgState.activeArcadeModalId] || {
                title: '수호자 미니게임',
              };
              const activeAsset = getCharacterAsset(playRpgState.activeArcadeModalId);
              return `
                <div class="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none z-[99999] bg-[#fdfcfc] flex flex-col justify-between">
                  <!-- Minimalist Mission HUD -->
                  <div class="w-full bg-[#201d1d] text-[#fdfcfc] px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black uppercase text-amber-400">[아케이드 챌린지]</span>
                      <span class="text-xs font-bold text-white">${activeCard.title}</span>
                    </div>

                    <button
                      type="button"
                      data-action="play-arcade-close"
                      class="px-4 py-2 bg-stone-800 text-white hover:bg-stone-700 text-xs font-bold rounded-sm border border-stone-600 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      aria-label="미니게임 닫기"
                    >
                      ✕ 나가기
                    </button>
                  </div>

                  <!-- Game Stage Placeholder / 2D Canvas Duel Arena -->
                  <div class="flex-1 w-full bg-[#0e0c0c] flex flex-col items-center justify-center p-4 text-center space-y-4">
                    <div class="w-24 h-24 rounded-none bg-stone-900 border border-white/20 p-2 flex items-center justify-center overflow-hidden">
                      <img src="${activeAsset.bustPngUrl}" alt="${activeAsset.nameKo}" class="w-full h-full object-contain" onerror="this.src='${activeAsset.seatUrl}'; this.onerror=null;" />
                    </div>

                    <div class="space-y-1">
                      <h3 class="text-base sm:text-lg font-bold text-white m-0">${activeCard.title} 전용 수호자 시련</h3>
                      <p class="text-xs text-stone-400 m-0">2D 모바일 제스처 터치 및 3x3 카드 대결 플레이를 지원합니다.</p>
                    </div>

                    <button
                      type="button"
                      data-action="play-ambush-start"
                      class="px-6 py-3 bg-amber-400 text-stone-950 hover:bg-amber-300 text-xs font-black rounded-sm min-h-[44px] transition-colors cursor-pointer"
                    >
                      ⚔️ 수호 덱과 3x3 카드 결투 개시
                    </button>
                  </div>
                </div>
              `;
            })()
          : ''
      }
    </div>
  `;
}

/**
 * Render Tab 3: 40-Episode Webtoon Theater (Strict Invariant Contract)
 */
function renderWebtoonView(): string {
  const currentEp: WebtoonEpisodeMeta = getWebtoonEpisode(playState.currentEpisode);
  const sceneImageUrl = getWebtoonSceneImageUrl(playState.currentEpisode, playState.currentScene);
  const padEp = String(playState.currentEpisode).padStart(2, '0');
  const padScene = String(playState.currentScene + 1).padStart(2, '0');
  const padTotal = String(currentEp.totalScenes).padStart(2, '0');

  return `
    <div class="w-full space-y-4">
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
        <div class="w-full flex items-center justify-center p-2 sm:p-4">
          <img
            src="${sceneImageUrl}"
            alt="${currentEp.titleKo} - 씬 ${padScene}"
            class="max-w-full max-h-[65vh] object-contain mx-auto shadow-none select-none transition-opacity duration-200"
            loading="eager"
            onerror="this.src='/images/webtoon/episode_${padEp}/scene_00.webp'; this.onerror=null;"
          />
        </div>

        <div class="absolute top-3 left-3 px-2.5 py-1 bg-[#201d1d]/85 text-[#fdfcfc] text-[11px] font-bold rounded-sm border border-white/15 backdrop-blur-xs">
          [EP.${padEp} · 씬 ${padScene} / ${padTotal}]
        </div>

        ${
          playState.isNarrationVisible
            ? `
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
            `
            : ''
        }
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

// ============================================================================
// 4. Main Exported Renderer
// ============================================================================

/**
 * Main render function for the PlaySection view.
 * Displays 2D Adventure RPG (카단의 여정) with 3x3 tactical battle loop.
 */
export function renderPlaySection(): string {
  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 font-mono select-none text-[#201d1d]">
      <!-- 1. Master Section Header & Badges -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.12)] gap-2 mb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-[11px] font-bold rounded-sm tracking-wider uppercase mb-1">
            <span>눈히어로.com</span>
            <span class="text-stone-400">·</span>
            <span>카단의 여정 (2D 모험 RPG)</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-[#201d1d] m-0 tracking-tight">
            카단의 모험 &amp; 3x3 전술 카드 배틀
          </h1>
          <p class="text-xs text-stone-500 m-0 pt-0.5">
            2D 타일 탐험 · 에피소드 스토리 다이얼로그 · 3x3 전술 카드 배틀 루프
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 bg-[#f1eeee] text-[#201d1d] text-xs font-bold rounded-sm border border-[rgba(15,0,0,0.12)]">
            EP.${String(playRpgState.currentChapter).padStart(2, '0')} / 40
          </span>
          <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-sm border border-emerald-300">
            절찬 연재중
          </span>
        </div>
      </div>

      <!-- 2. Adventure RPG View (카단의 여정) -->
      <div id="kadan-journey-stage" class="w-full">
        ${renderAdventureView()}
      </div>
    </div>
  `;
}
