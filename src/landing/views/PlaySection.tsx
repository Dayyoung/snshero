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
import {
  getCutoutUrl,
  getCharacterAsset,
  getLocalizedCharacterName,
  getLocalizedFactionName,
  FACTION_PALETTES,
} from '../services/assetCatalog';
import { cardNurtureStore } from '../services/cardNurtureStore';
import { renderOriginalCardHtml, renderBattleBoardCardHtml } from '../components/OriginalCardHtml';
import { getCurrentLanguage, isKoreanLanguage, t, tr } from '../services/i18n';
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
  selectChapter,
  selectPrevChapter,
  selectNextChapter,
  PlayTabKey,
} from '../services/playRpgEngine';
import {
  getEpisodeBackground,
  getDialogueBackground,
  preloadLocationBackground,
} from '../services/locationBgManager';

/**
 * 40-Episode Quick Jump Drawer Open State for Adventure Tab
 */
let isAdventureDrawerOpen = false;

/**
 * Authentic RPG Terrain Tile & Object Sprites
 * Preserved from original RPG world map (/play & KadanWorldMap.tsx)
 */
export const RPG_TERRAIN_ASSETS: Record<string, string> = {
  snow: '/rpg/kadan-map/tile-snow.png',
  cliff: '/rpg/kadan-map/tile-cliff.png',
  palace: '/rpg/kadan-map/tile-palace.png',
  cave: '/rpg/kadan-map/tile-cave.png',
  lake: '/rpg/kadan-map/tile-forest.png',
  forest: '/rpg/kadan-map/tile-forest.png',
  island: '/rpg/kadan-map/tile-snow.png',
  citadel: '/rpg/kadan-map/tile-palace.png',
};

export const RPG_EVENT_NODE_ASSETS: Record<string, string> = {
  enemy: '/rpg/kadan-map/object-enemy.png',
  chest: '/rpg/kadan-map/object-chest.png',
  portal: '/rpg/kadan-map/object-portal.png',
  story: '/rpg/kadan-map/object-portal.png',
  boss: '/rpg/kadan-map/object-enemy.png',
};

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
    const isKo = isKoreanLanguage();
    const textToSpeak = isKo
      ? episode.leadNarrationKo || episode.titleKo
      : episode.leadNarrationEn || episode.titleEn;
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = isKo ? 'ko-KR' : 'en-US';
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
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.([15, 30, 15]);
        }
      } catch {}
      toggleAutoMode();
      break;
    case 'play-toggle-repeat':
      toggleRepeatHunting();
      break;

    // Episode / Chapter Switcher Actions (Webtoon / Web Novel style)
    case 'play-toggle-chapter-drawer':
      isAdventureDrawerOpen = !isAdventureDrawerOpen;
      break;
    case 'play-prev-chapter':
      selectPrevChapter();
      break;
    case 'play-next-chapter':
      selectNextChapter();
      break;
    case 'play-jump-chapter': {
      const chAttr = target?.getAttribute('data-chapter');
      if (chAttr) {
        selectChapter(parseInt(chAttr, 10));
        isAdventureDrawerOpen = false;
      }
      break;
    }
    case 'play-select-chapter': {
      const sel = target as HTMLSelectElement | null;
      if (sel && sel.value) {
        selectChapter(parseInt(sel.value, 10));
      }
      break;
    }

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
        syncBattleDomInPlace();
      }
      break;
    }
    case 'play-battle-slot': {
      const slotAttr = target?.getAttribute('data-slot');
      if (slotAttr !== null && slotAttr !== undefined) {
        const slotIdx = parseInt(slotAttr, 10);
        playCardToSlot(playRpgState.selectedHandIndex, slotIdx, 'player');
        syncBattleDomInPlace();
      }
      break;
    }
    case 'play-repeat-hunting':
      initBattle();
      break;
    case 'play-advance-next-chapter':
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
// 2.5 3x3 Battle Modular In-Place DOM Synchronizer (Anti-Flicker Architecture)
// ============================================================================

/**
 * Render Battle Top Status Bar (Turn Indicator, Cadence Message, Hand Counts)
 */
export function renderBattleStatusBarHtml(): string {
  const isPlayerTurn = playRpgState.turn === 'player';
  return `
    <div class="flex items-center gap-2 min-w-0">
      <span class="px-2 py-0.5 text-[10px] sm:text-[11px] font-black rounded-xs shrink-0 ${
        isPlayerTurn
          ? 'bg-sky-500 text-slate-950 animate-pulse'
          : 'bg-rose-500 text-white animate-pulse'
      }">
        ${isPlayerTurn ? tr('▶ 내 턴 (P1)', '▶ YOUR TURN (P1)', '▶ 自ターン (P1)') : tr('⏳ 상대 턴 (AI)', "⏳ OPPONENT'S TURN", '⏳ 相手ターン (AI)')}
      </span>
      <span class="text-[11px] sm:text-xs text-stone-300 truncate">
        ${playRpgState.battleMessage || tr('카드를 선택한 후 빈 슬롯을 터치하세요.', 'Select a card and touch an empty slot.', 'カードを選択して空きスロットをタッチしてください。')}
      </span>
    </div>
    <div class="text-[11px] sm:text-xs font-bold text-amber-400 shrink-0">
      P1(${playRpgState.playerHand.length}) : AI(${playRpgState.opponentHand.length})
    </div>
  `;
}

/**
 * Render 3x3 Battle Board 9-Slot Grid
 * - Keeps fixed aspect-[5/7] slots to prevent any layout shifts
 * - Renders FLIP badge and 3D card rotation on flipped cards
 */
export function renderBattleBoardGridHtml(): string {
  return playRpgState.battleBoard
    .map((slot, sIdx) => {
      if (!slot) {
        const isOpponentTurn = playRpgState.turn === 'opponent';
        return `
          <button
            type="button"
            id="battle-slot-${sIdx}"
            ${isOpponentTurn ? 'disabled' : `data-action="play-battle-slot" data-slot="${sIdx}"`}
            class="relative w-full aspect-[5/7] border-2 border-dashed ${
              isOpponentTurn
                ? 'border-stone-700/60 bg-stone-900/40 text-stone-600 cursor-wait'
                : 'border-amber-400/40 hover:border-amber-300 bg-[#0e1628]/60 hover:bg-[#131f38] text-amber-300 cursor-pointer active:scale-98'
            } rounded-xs flex flex-col items-center justify-between p-1.5 sm:p-2 transition-transform select-none shadow-sm"
            aria-label="${tr(`슬롯 ${sIdx + 1} 배치`, `Place in Slot ${sIdx + 1}`, `スロット${sIdx + 1}に配置`)}"
          >
            <!-- Slot Header -->
            <div class="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-mono ${isOpponentTurn ? 'text-stone-600' : 'text-stone-400/80'}">
              <span>#${sIdx + 1}</span>
              <span class="${isOpponentTurn ? 'text-stone-700' : 'text-amber-400/60'}">✦</span>
            </div>

            <!-- Center Target / Seal Cue -->
            <div class="flex flex-col items-center justify-center gap-1 my-auto">
              <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border ${
                isOpponentTurn ? 'border-stone-700 bg-black/40 text-stone-600' : 'border-amber-400/40 bg-black/50 text-amber-400'
              } flex items-center justify-center text-xs sm:text-sm font-black">
                ${isOpponentTurn ? '⏳' : '+'}
              </div>
              <span class="text-[10px] sm:text-[11px] font-black tracking-wider ${isOpponentTurn ? 'text-stone-600' : 'text-amber-400'}">
                ${isOpponentTurn ? tr('대기...', 'WAIT', '待機...') : tr('[배치]', '[PLACE]', '[配置]')}
              </span>
            </div>

            <!-- Footer Cue -->
            <div class="text-[8px] sm:text-[9px] font-mono truncate ${isOpponentTurn ? 'text-stone-700' : 'text-stone-400/60'}">
              ${isOpponentTurn ? 'AI TURN' : 'TAP HERE'}
            </div>
          </button>
        `;
      }

      return `
        <div id="battle-slot-${sIdx}" class="w-full aspect-[5/7]">
          ${renderBattleBoardCardHtml({
            cardId: slot.cardId,
            stats: slot.stats,
            owner: slot.owner,
            isJustPlaced: playRpgState.lastPlacedSlot === sIdx,
            isFlipped: playRpgState.flippedSlots?.includes(sIdx),
          })}
        </div>
      `;
    })
    .join('');
}

/**
 * Render Battle Result Controls (Victory / Defeat Buttons)
 */
export function renderBattleResultControlsHtml(): string {
  if (!playRpgState.battleWinner) return '';
  const currentChapter = playRpgState.currentChapter;
  const isPlayerWon = playRpgState.battleWinner === 'player';

  return `
    <div class="w-full bg-[#0a1020] border border-white/15 p-3 rounded-none shadow-xl flex flex-col items-center gap-2.5">
      <div class="text-xs sm:text-sm font-black text-center ${
        isPlayerWon ? 'text-emerald-400' : 'text-rose-400'
      }">
        ${
          isPlayerWon
            ? tr('🎉 전투 승리! 50 EXP 획득 완료.', '🎉 Victory! +50 EXP awarded.', '🎉 バトル勝利！50 EXPを獲得しました。')
            : tr(
                '⚠️ 승리하지 못하면 다음 회차로 진행할 수 없습니다. 카드를 업그레이드(#card)하거나 재도전하세요!',
                '⚠️ You must win to advance to the next episode. Upgrade your cards (#card) or retry!',
                '⚠️ 勝利しないと次話へ進めません。カードを強化（#card）するか再挑戦してください！'
              )
        }
      </div>

      <div class="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          data-action="play-repeat-hunting"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-sm min-h-[44px] cursor-pointer active:translate-y-px"
        >
          ${isPlayerWon ? tr('🔁 반복 사냥 재전투', '🔁 Repeat Battle', '🔁 反復狩り再戦') : tr('⚔️ 현재 회차 재도전', '⚔️ Retry Episode', '⚔️ 現在のエピソードに再挑戦')}
        </button>
        ${
          isPlayerWon
            ? `
              <button
                type="button"
                data-action="play-next-chapter"
                class="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-black rounded-sm min-h-[44px] cursor-pointer active:translate-y-px shadow-lg"
              >
                ${currentChapter >= 40 ? tr('👑 40화 완주 · 환생하기 ▶', '👑 Episode 40 Clear · Reincarnate ▶', '👑 全40話完走・転生する ▶') : tr('다음 챕터로 전진 ▶', 'Next Chapter ▶', '次のチャプターへ ▶')}
              </button>
            `
            : `
              <button
                type="button"
                data-nav="card"
                class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black rounded-sm min-h-[44px] cursor-pointer active:translate-y-px"
              >
                ⬆️ ${tr('카드 업그레이드 (#card)', 'Upgrade Cards (#card)', 'カード強化 (#card)')}
              </button>
            `
        }
      </div>
    </div>
  `;
}

/**
 * Render Player Hand Cards Row at Bottom of Battle Modal
 */
export function renderBattleHandRowHtml(): string {
  return playRpgState.playerHand
    .map((cId, hIdx) => {
      const isSelected = playRpgState.selectedHandIndex === hIdx;
      return `
        <button
          type="button"
          data-action="play-battle-card"
          data-hand-index="${hIdx}"
          class="relative flex-1 min-w-0 sm:min-w-[80px] md:min-w-[100px] max-w-[70px] sm:max-w-[110px] md:max-w-[125px] text-left p-0 bg-transparent border-0 cursor-pointer transition-transform ${
            isSelected
              ? '-translate-y-2 ring-2 ring-amber-400 rounded-sm z-20'
              : 'hover:-translate-y-1 opacity-95 hover:opacity-100'
          }"
        >
          ${
            isSelected
              ? `<span class="absolute -top-3 left-1/2 -translate-x-1/2 z-40 px-1.5 py-0.2 bg-amber-400 text-stone-950 text-[8px] sm:text-[9px] font-black rounded-xs whitespace-nowrap border border-stone-900 shadow-md">▼ SELECT</span>`
              : ''
          }
          ${renderOriginalCardHtml(cId, {
            isSelected,
            isOwned: true,
            showRedDot: false,
            size: 'responsive',
            visualTier: 'bust',
            className: 'w-full min-w-0 sm:min-w-[80px] md:min-w-[100px] aspect-[5/7] max-h-[110px] sm:max-h-[160px] md:max-h-[185px]',
          })}
        </button>
      `;
    })
    .join('');
}

/**
 * In-Place DOM Synchronizer for 3x3 Card Battle (Anti-Flicker)
 * Updates only the battle sub-elements (#battle-status-bar, #battle-board-grid,
 * #battle-result-container, #battle-hand-row) directly in the existing DOM.
 * Eliminates full mainSlot.innerHTML destruction and repaints, preventing screen/card blinking.
 * Returns true if the battle DOM was located and updated in-place; false if not currently in battle.
 */
export function syncBattleDomInPlace(): boolean {
  if (typeof document === 'undefined') return false;
  const boardEl = document.getElementById('battle-board-grid');
  if (!boardEl) return false;

  const statusBarEl = document.getElementById('battle-status-bar');
  if (statusBarEl) {
    statusBarEl.innerHTML = renderBattleStatusBarHtml();
  }

  const resultEl = document.getElementById('battle-result-container');
  if (resultEl) {
    resultEl.innerHTML = renderBattleResultControlsHtml();
  }

  const handEl = document.getElementById('battle-hand-row');
  if (handEl) {
    handEl.innerHTML = renderBattleHandRowHtml();
  }

  const handCountEl = document.getElementById('battle-hand-count');
  if (handCountEl) {
    handCountEl.textContent = `(${playRpgState.playerHand.length})`;
  }

  // Update board grid slots
  boardEl.innerHTML = renderBattleBoardGridHtml();

  return true;
}

// ============================================================================
// 3. Tab Sub-Renderers
// ============================================================================

/**
 * Render Tab 1: 2D Tile Adventure Map & RPG Battle Loop
 */
function renderAdventureView(): string {
  const isKo = isKoreanLanguage();
  const currentChapter = playRpgState.currentChapter;
  const rebirthLevel = playRpgState.reincarnationLevel;
  const chapterLabel = formatChapterLabel(currentChapter, rebirthLevel);
  const chapterMeta = chapterTitles.find((c) => c.chapter === currentChapter) || {
    chapter: currentChapter,
    titleKo: `${chapterLabel}의 여정`,
    titleEn: `Chapter ${currentChapter} Journey`,
  };
  const region = getCurrentRegion();
  const regionDisplayName = t(region.nameKey, region.id);
  const chEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === currentChapter);
  const objectiveText = chEvent
    ? t(chEvent.objectiveKey, tr('원정 진행 중', 'Expedition in Progress', '遠征進行中'))
    : tr('원정 진행 중', 'Expedition in Progress', '遠征進行中');
  const heroX = playRpgState.heroTile.x;
  const heroY = playRpgState.heroTile.y;
  const displayChapterTitle = isKo ? chapterMeta.titleKo : chapterMeta.titleEn;

  return `
    <div id="kadan-world-map" class="w-full space-y-4">
      <!-- Stage Info Bar & Episode Switcher (Web Novel / Webtoon Style) -->
      <section class="w-full bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-4 rounded-none space-y-3 font-mono">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[11px] font-bold rounded-sm uppercase tracking-wider mb-1">
              <span>${tr('2D 모험 RPG', '2D Adventure RPG', '2D冒険RPG')}</span>
              <span class="text-stone-400">·</span>
              <span>${tr('지역', 'Region', '地域')}: ${regionDisplayName}</span>
              ${
                rebirthLevel > 0
                  ? `<span class="text-amber-400 font-black">· 👑 ${tr(`환생 ${rebirthLevel}회차`, `Rebirth ${rebirthLevel}`, `転生${rebirthLevel}周目`)}</span>`
                  : ''
              }
            </div>
            <h2 class="text-lg sm:text-xl font-black text-[#201d1d] m-0">
              ${chapterLabel}: ${displayChapterTitle}
            </h2>
            <p class="text-xs text-stone-500 m-0 pt-0.5">
              ${chapterMeta.titleEn} · ${tr('목표', 'Objective', '目標')}: ${objectiveText}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Coordinates Badge -->
            <span class="px-3 py-2 bg-white text-[#201d1d] text-xs font-bold rounded-sm border border-[rgba(15,0,0,0.12)] min-h-[44px] inline-flex items-center">
              📍 ${tr('좌표', 'Coord', '座標')} (${heroX + 1}, ${heroY + 1})
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
              aria-label="${tr('자동 진행 토글', 'Toggle Auto-Play', '自動進行切替')}"
            >
              🤖 ${tr('자동 진행', 'Auto-Play', '自動進行')} ${playRpgState.autoMode ? '[ON]' : '[OFF]'}
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
              aria-label="${tr('반복 사냥 토글', 'Toggle Repeat Hunt', '反復狩り切替')}"
            >
              🔁 ${tr('반복 사냥', 'Repeat Hunt', '反復狩り')} ${playRpgState.repeatHunting ? '[ON]' : '[OFF]'}
            </button>

            <!-- Direct 3x3 Card Battle Popup Launch Button (Mobile & Desktop Quick Access) -->
            <button
              type="button"
              data-action="play-battle-start"
              class="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white border border-rose-800 text-xs font-black rounded-sm min-h-[44px] inline-flex items-center justify-center cursor-pointer transition-colors active:translate-y-px"
              aria-label="${tr('3x3 카드 배틀 팝업 열기', 'Open 3x3 Card Battle', '3x3カードバトルを開く')}"
            >
              ⚔️ ${tr('3x3 카드 배틀', '3x3 Card Battle', '3x3カードバトル')}
            </button>
          </div>
        </div>

        <!-- Webtoon/Webnovel Style Episode Selector Bar -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[rgba(15,0,0,0.12)]">
          <!-- Prev Episode Button -->
          <button
            type="button"
            data-action="play-prev-chapter"
            ${currentChapter <= 1 ? 'disabled' : ''}
            class="px-3.5 py-2 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#383333] disabled:opacity-30 disabled:hover:bg-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors"
            aria-label="${tr('이전 회차', 'Previous Episode', '前のエピソード')}"
          >
            ◀ ${tr('이전화', 'Prev', '前話')}
          </button>

          <!-- Dropdown Episode Selector -->
          <div class="flex-1 min-w-[200px] max-w-sm mx-auto">
            <select
              id="play-chapter-select"
              data-action="play-select-chapter"
              class="w-full px-3 py-2 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.2)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer focus:outline-none focus:border-[#201d1d] text-center"
              aria-label="${tr('플레이할 회차 선택', 'Select Episode to Play', 'プレイするエピソードを選択')}"
            >
              ${Array.from({ length: 40 }, (_, idx) => {
                const num = idx + 1;
                const meta = chapterTitles[idx] || { titleKo: `제 ${num}화`, titleEn: `Episode ${num}` };
                const optTitle = isKo ? meta.titleKo : meta.titleEn;
                const optPrefix = isKo ? `제${num}화` : `EP.${String(num).padStart(2, '0')}`;
                return `
                  <option value="${num}" ${num === currentChapter ? 'selected' : ''}>
                    ${optPrefix} - ${optTitle}
                  </option>
                `;
              }).join('')}
            </select>
          </div>

          <!-- Next Episode Button -->
          <button
            type="button"
            data-action="play-next-chapter"
            ${currentChapter >= 40 ? 'disabled' : ''}
            class="px-3.5 py-2 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#383333] disabled:opacity-30 disabled:hover:bg-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors"
            aria-label="${tr('다음 회차', 'Next Episode', '次のエピソード')}"
          >
            ${tr('다음화', 'Next', '次話')} ▶
          </button>

          <!-- 40-Episode Index Drawer Toggle Button -->
          <button
            type="button"
            data-action="play-toggle-chapter-drawer"
            class="px-3 py-2 bg-[#f1eeee] hover:bg-[#e4e1e1] text-[#201d1d] border border-[rgba(15,0,0,0.15)] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            aria-label="${tr('회차 전체 목차 토글', 'Toggle Episode Index', '全エピソード目次切替')}"
          >
            <span>📋 ${tr('전체 목차', 'All Episodes', '全話目次')}</span>
            <span class="text-[10px] text-stone-500">${isAdventureDrawerOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        <!-- 40-Episode Quick Jump Drawer -->
        ${
          isAdventureDrawerOpen
            ? `
              <div class="pt-3 border-t border-[rgba(15,0,0,0.12)]">
                <div class="flex items-center justify-between pb-2 mb-2">
                  <span class="text-xs font-black text-[#201d1d]">
                    ${tr(
                      '원하는 회차를 선택하면 해당 필드 맵과 배틀로 즉시 이동합니다 (1~40화 전편):',
                      'Select any episode to jump directly to its field map and battle (Episodes 1–40):',
                      'エピソードを選択すると該当のフィールドマップとバトルへ即座に移動します（全40話）:'
                    )}
                  </span>
                  <button
                    type="button"
                    data-action="play-toggle-chapter-drawer"
                    class="text-xs text-stone-500 hover:text-stone-900 font-bold p-1 cursor-pointer"
                  >
                    ✕ ${tr('닫기', 'Close', '閉じる')}
                  </button>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                  ${Array.from({ length: 40 }, (_, idx) => {
                    const num = idx + 1;
                    const meta = chapterTitles[idx] || { titleKo: `제 ${num}화`, titleEn: `Episode ${num}` };
                    const btnTitle = isKo ? meta.titleKo : meta.titleEn;
                    const btnPrefix = isKo ? `제${num}화` : `EP.${String(num).padStart(2, '0')}`;
                    const isCur = num === currentChapter;
                    const ev = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === num);
                    return `
                      <button
                        type="button"
                        data-action="play-jump-chapter"
                        data-chapter="${num}"
                        class="px-2 py-2 text-left text-xs rounded-sm border transition-colors truncate min-h-[40px] cursor-pointer flex flex-col justify-center ${
                          isCur
                            ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] font-black'
                            : 'bg-white text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
                        }"
                        title="${btnPrefix} - ${btnTitle}"
                      >
                        <div class="flex items-center justify-between w-full">
                          <span class="font-bold">${btnPrefix}</span>
                          <span class="text-[9px] ${isCur ? 'text-amber-400' : 'text-stone-400'} uppercase">${ev?.regionId || ''}</span>
                        </div>
                        <span class="text-[11px] truncate opacity-90">${btnTitle}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            `
            : ''
        }
      </section>

      <!-- Sub-State: Ambush Alert Banner -->
      ${
        playRpgState.activeAmbush
          ? `
            <div class="w-full bg-rose-50 border-2 border-rose-600 p-4 rounded-none flex flex-wrap items-center justify-between gap-3">
              <div>
                <span class="text-xs font-black text-rose-700 uppercase tracking-wider">${tr('[⚠️ 마물/산적 기습 발생!]', '[⚠️ Field Ambush Encounter!]', '[⚠️ 魔物・山賊の奇襲発生！]')}</span>
                <p class="text-sm font-bold text-rose-950 m-0 pt-0.5">${
                  isKo
                    ? `${playRpgState.activeAmbush.name}의 습격을 받았습니다!`
                    : tr(
                        `${playRpgState.activeAmbush.name}의 습격을 받았습니다!`,
                        `Ambushed by ${playRpgState.activeAmbush.nameEn || playRpgState.activeAmbush.name}!`,
                        `${playRpgState.activeAmbush.nameEn || playRpgState.activeAmbush.name}に奇襲されました！`
                      )
                }</p>
                <p class="text-xs text-rose-800 m-0 pt-0.5">"${
                  isKo
                    ? playRpgState.activeAmbush.dialogQuoteKo
                    : playRpgState.activeAmbush.dialogQuoteEn || playRpgState.activeAmbush.dialogQuoteKo
                }"</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  data-action="play-ambush-start"
                  class="px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-sm min-h-[44px] hover:bg-rose-500 cursor-pointer"
                >
                  ⚔️ ${tr('즉시 요격 (배틀)', 'Intercept Now (Battle)', '即座に迎撃（バトル）')}
                </button>
                <button
                  type="button"
                  data-action="play-ambush-evade"
                  class="px-4 py-2.5 bg-white text-stone-700 border border-stone-300 text-xs font-bold rounded-sm min-h-[44px] hover:bg-stone-100 cursor-pointer"
                >
                  ${tr('돌파 회피', 'Evade', '突破回避')}
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
            <section class="w-full bg-[#060a12] border-2 border-[#1e293b] p-3 sm:p-5 rounded-none shadow-2xl font-mono">
              <!-- World Map Legend & Terrain Header Bar -->
              <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/10 text-xs select-none">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/50 text-[10px] font-black rounded-xs uppercase tracking-wider">
                    TERRAIN: ${(region.terrain || 'forest').toUpperCase()}
                  </span>
                  <span class="text-stone-300 text-xs font-bold">
                    ${regionDisplayName}
                  </span>
                  <span class="text-stone-500 text-[10px] hidden sm:inline">
                    (${region.width} × ${region.height} ${tr('타일 필드', 'Tile Field', 'タイルフィールド')})
                  </span>
                </div>
                <div class="flex items-center gap-3 text-[10px] text-stone-300 font-bold">
                  <span class="inline-flex items-center gap-1">
                    <img src="/rpg/kadan-map/hero-kadan.png" alt="${tr('카단', 'Kadan', 'カダン')}" class="w-4 h-4 rounded-full border border-amber-300 object-cover" />
                    <span>${tr('카단', 'Kadan', 'カダン')}</span>
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <img src="${RPG_EVENT_NODE_ASSETS[chEvent?.nodeType || 'enemy'] || '/rpg/kadan-map/object-portal.png'}" alt="GO" class="w-4 h-4 object-contain" />
                    <span class="text-amber-400 font-black">${tr('목표 (GO)', 'Target (GO)', '目標 (GO)')}</span>
                  </span>
                  <span class="inline-flex items-center gap-1 text-stone-500">
                    <span class="w-3.5 h-3.5 bg-black/80 border border-stone-700 flex items-center justify-center text-[9px]">✕</span>
                    <span>${tr('통행 불가', 'Blocked', '通行不可')}</span>
                  </span>
                </div>
              </div>

              <!-- 10x8 RPG Tile Map with 4-Way Compass Controls Overlaid (North / South / West / East) -->
              <div
                class="relative w-full max-w-3xl mx-auto select-none rounded-none border border-white/20 bg-[#0a0f1d] shadow-inner overflow-hidden p-0 m-0"
                style="aspect-ratio: ${region.width} / ${region.height};"
              >
                <!-- 1. 10x8 Terrain Tile Grid (Zero Margin, Zero Gap, Zero Padding, Strict 10x8 Proportion) -->
                <div
                  class="grid gap-0 w-full h-full select-none p-0 m-0 border-0"
                  style="grid-template-columns: repeat(${region.width}, minmax(0, 1fr)); grid-template-rows: repeat(${region.height}, minmax(0, 1fr));"
                >
                  ${Array.from({ length: region.width * region.height }, (_, idx) => {
                    const tileX = idx % region.width;
                    const tileY = Math.floor(idx / region.width);
                    const isBlocked = region.blockedTiles.some((b) => b.x === tileX && b.y === tileY);
                    const isHero = heroX === tileX && heroY === tileY;
                    const isTarget = chEvent?.tile.x === tileX && chEvent?.tile.y === tileY;
                    const terrainImg = RPG_TERRAIN_ASSETS[region.terrain] || '/rpg/kadan-map/tile-forest.png';
                    const eventImg = RPG_EVENT_NODE_ASSETS[chEvent?.nodeType || 'enemy'] || '/rpg/kadan-map/object-portal.png';

                    return `
                      <button
                        type="button"
                        data-action="play-tile-click"
                        data-x="${tileX}"
                        data-y="${tileY}"
                        ${isBlocked ? 'disabled' : ''}
                        style="min-height: 0; min-width: 0; aspect-ratio: 1 / 1;"
                        class="group relative w-full h-full min-w-0 min-h-0 aspect-square rounded-none m-0 p-0 border-0 outline-none select-none flex items-center justify-center transition-none ${
                          isBlocked
                            ? 'cursor-not-allowed opacity-60 overflow-hidden'
                            : isTarget
                            ? 'cursor-pointer z-20 overflow-visible'
                            : isHero
                            ? 'cursor-default z-20 overflow-visible'
                            : 'cursor-pointer hover:brightness-105 active:brightness-110 overflow-hidden'
                        }"
                        aria-label="${tr('타일', 'Tile', 'タイル')} (${tileX + 1}, ${tileY + 1})"
                      >
                        <!-- 1. Authentic Terrain Tile Background Texture (Seamless 0-Margin) -->
                        <img
                          src="${terrainImg}"
                          alt=""
                          class="absolute inset-0 w-full h-full object-cover pointer-events-none select-none ${
                            isBlocked
                              ? 'grayscale contrast-125 brightness-40'
                              : 'opacity-100'
                          }"
                          draggable="false"
                        />

                        <!-- 2. Blocked Tile Overlay (Obstacle / Cliff) -->
                        ${
                          isBlocked
                            ? `
                              <div class="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none z-10">
                                <span class="text-stone-400 text-[10px] sm:text-xs font-black select-none drop-shadow">✕</span>
                              </div>
                            `
                            : ''
                        }

                        <!-- 3. Target Node Sprite (Original Enemy / Chest / Portal from /play) -->
                        ${
                          isTarget
                            ? `
                              <!-- Fixed Golden Tile Highlight Frame (Anchored to Tile, Never Jump) -->
                              <div class="absolute inset-0 border-2 border-amber-400 bg-amber-400/15 pointer-events-none z-10 shadow-[inset_0_0_10px_rgba(251,191,36,0.7)] ring-1 ring-amber-300"></div>

                              <!-- Animated Bouncing Sprite & GO Badge Inside Tile Frame -->
                              <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 animate-bounce">
                                <img
                                  src="${eventImg}"
                                  alt="${tr('목표 지점', 'Target Node', '目標地点')}"
                                  style="aspect-ratio: 1 / 1;"
                                  class="w-[52%] aspect-square max-w-[26px] max-h-[26px] shrink-0 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
                                  draggable="false"
                                />
                                <span class="mt-0.5 px-1.5 py-0.2 bg-amber-400 text-stone-950 text-[7px] sm:text-[9px] font-black rounded-xs whitespace-nowrap shadow-md border border-stone-950 leading-none">
                                  GO!
                                </span>
                              </div>
                            `
                            : ''
                        }

                        <!-- 4. Hero Kadan Token Marker (Circular Golden Avatar) -->
                        ${
                          isHero
                            ? `
                              <div class="absolute inset-0 border border-amber-300 sm:border-2 pointer-events-none z-20 shadow-[inset_0_0_8px_rgba(251,191,36,0.8)] flex items-center justify-center">
                                <div
                                  style="aspect-ratio: 1 / 1;"
                                  class="w-[78%] aspect-square max-w-[36px] max-h-[36px] shrink-0 rounded-full border border-amber-300 sm:border-2 bg-slate-950 p-0.5 shadow-[0_0_12px_rgba(251,191,36,0.9)] ring-1 sm:ring-2 ring-amber-400 flex items-center justify-center overflow-hidden animate-pulse pointer-events-none select-none"
                                >
                                  <img
                                    src="/rpg/kadan-map/hero-kadan.png"
                                    alt="${tr('카단', 'Kadan', 'カダン')}"
                                    style="aspect-ratio: 1 / 1;"
                                    class="w-full h-full aspect-square object-cover object-center rounded-full block"
                                    draggable="false"
                                    onerror="this.src='/seat/Kadan.png'; this.onerror=null;"
                                  />
                                </div>
                              </div>
                            `
                            : ''
                        }

                        <!-- 5. Coordinate Badge (Subtle Top-Left on Clean Tiles) -->
                        ${
                          !isBlocked && !isHero && !isTarget
                            ? `<span class="absolute top-0.5 left-0.5 z-10 text-[6px] sm:text-[8px] font-mono text-white/35 bg-black/50 px-0.5 rounded-none pointer-events-none select-none leading-none">${tileX + 1},${tileY + 1}</span>`
                            : ''
                        }
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- 2. Independent Under-Map 4-Way Directional Controller (Zero Tile Occlusion) -->
              <div class="mt-4 flex flex-col items-center justify-center select-none font-mono">
                <!-- North (위로) -->
                <button
                  type="button"
                  data-action="play-move-up"
                  class="w-14 h-10 sm:w-16 sm:h-11 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] hover:text-amber-400 border border-white/20 text-sm font-black rounded-sm flex items-center justify-center cursor-pointer active:translate-y-px shadow-md transition-colors min-h-[44px]"
                  aria-label="${tr('위로 이동', 'Move Up', '上へ移動')}"
                  title="${tr('위로 이동 (W / ↑)', 'Move Up (W / ↑)', '上へ移動 (W / ↑)')}"
                >
                  ▲
                </button>

                <!-- Middle Row: West + Movement Mode Label + East -->
                <div class="flex items-center gap-2 my-1">
                  <button
                    type="button"
                    data-action="play-move-left"
                    class="w-14 h-10 sm:w-16 sm:h-11 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] hover:text-amber-400 border border-white/20 text-sm font-black rounded-sm flex items-center justify-center cursor-pointer active:translate-y-px shadow-md transition-colors min-h-[44px]"
                    aria-label="${tr('왼쪽으로 이동', 'Move Left', '左へ移動')}"
                    title="${tr('왼쪽으로 이동 (A / ←)', 'Move Left (A / ←)', '左へ移動 (A / ←)')}"
                  >
                    ◀
                  </button>
                  <div class="w-20 sm:w-24 text-center">
                    <span class="text-[10px] sm:text-xs font-bold text-stone-400 tracking-wider">
                      ${tr('[이동]', '[MOVE]', '[移動]')}
                    </span>
                  </div>
                  <button
                    type="button"
                    data-action="play-move-right"
                    class="w-14 h-10 sm:w-16 sm:h-11 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] hover:text-amber-400 border border-white/20 text-sm font-black rounded-sm flex items-center justify-center cursor-pointer active:translate-y-px shadow-md transition-colors min-h-[44px]"
                    aria-label="${tr('오른쪽으로 이동', 'Move Right', '右へ移動')}"
                    title="${tr('오른쪽으로 이동 (D / →)', 'Move Right (D / →)', '右へ移動 (D / →)')}"
                  >
                    ▶
                  </button>
                </div>

                <!-- South (아래로) -->
                <button
                  type="button"
                  data-action="play-move-down"
                  class="w-14 h-10 sm:w-16 sm:h-11 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] hover:text-amber-400 border border-white/20 text-sm font-black rounded-sm flex items-center justify-center cursor-pointer active:translate-y-px shadow-md transition-colors min-h-[44px]"
                  aria-label="${tr('아래로 이동', 'Move Down', '下へ移動')}"
                  title="${tr('아래로 이동 (S / ↓)', 'Move Down (S / ↓)', '下へ移動 (S / ↓)')}"
                >
                  ▼
                </button>
              </div>

              <!-- Movement Guide Hint -->
              <div class="mt-2 text-center">
                <span class="text-[11px] sm:text-xs text-stone-400 font-mono">
                  ${tr(
                    '[방향키 버튼, 키보드(↑↓←→ / W·A·S·D) 또는 타일 직접 터치로 이동]',
                    '[Move via Direction buttons, Arrow keys / W·A·S·D, or tap any tile directly]',
                    '[方向キー・キーボード(↑↓←→ / W·A·S·D)・タイル直接タップで移動]'
                  )}
                </span>
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
                dialogueQuoteEn: 'An oath never freezes.',
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

              // Canonical single fixed location background for this episode
              const currentChapter = playRpgState.currentChapter;
              const bgLoc = getEpisodeBackground(currentChapter);
              preloadLocationBackground(bgLoc.bgJpgUrl);

              return `
                <div
                  id="play-dialogue-modal-root"
                  class="fixed inset-0 z-50 flex flex-col justify-between bg-[#0e0c0c] text-[#fdfcfc] font-mono select-none overflow-hidden h-[100dvh]"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="dialogue-modal-speaker"
                >
                  <!-- 0. 장소 배경 아트 레이어 & 다크 비네팅 오버레이 -->
                  <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
                    <img
                      src="${bgLoc.bgJpgUrl}"
                      alt="${bgLoc.nameKo}"
                      class="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.08] scale-105 transition-all duration-700 ease-out"
                    />
                    <!-- 부드러운 상하 비네팅 및 다크 그라데이션 오버레이로 텍스트/UI 가독성 극대화 -->
                    <div class="absolute inset-0 bg-gradient-to-b from-[#0e0c0c]/85 via-[#0e0c0c]/55 to-[#0e0c0c]/95"></div>
                    <!-- 은은한 앰비언트 격자/필름 그레인 느낌 -->
                    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]"></div>
                  </div>

                  <!-- 1. 상단 바: 챕터 제목 & 장소 배지 & 우측 [건너뛰기 ▶] + [✕ 닫기] 버튼 -->
                  <header class="w-full shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-[#161313]/85 backdrop-blur-md z-20">
                    <div class="flex items-center gap-2 truncate">
                      <span class="px-2 py-0.5 bg-amber-400 text-stone-950 font-black text-[11px] sm:text-xs rounded-sm shrink-0">
                        EPISODE
                      </span>
                      <span class="text-xs sm:text-sm font-bold text-amber-300 truncate">
                        ${chapterLabel} [${playRpgState.currentDialogueLineIdx + 1} / ${lines.length}]
                      </span>
                      <!-- 현재 캐노니컬 장소 배지 -->
                      <span class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-stone-900/80 border border-amber-400/40 text-amber-200 text-[11px] rounded-sm truncate">
                        📍 ${isKo ? bgLoc.nameKo : bgLoc.nameEn}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        data-action="play-dialogue-skip"
                        class="px-3 py-1.5 bg-stone-800/90 hover:bg-stone-700 text-stone-300 border border-stone-600 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer active:translate-y-px"
                        aria-label="${tr('대화 건너뛰기 및 전투 직행', 'Skip Dialogue & Start Battle', '会話をスキップして戦闘へ')}"
                      >
                        ${tr('건너뛰기 ▶', 'Skip ▶', 'スキップ ▶')}
                      </button>
                      <button
                        type="button"
                        data-action="play-dialogue-close"
                        class="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/60 text-xs font-black rounded-sm min-h-[44px] cursor-pointer flex items-center gap-1 active:translate-y-px"
                        aria-label="${tr('대사 창 닫기 및 플레이 중지', 'Close Dialogue & Stop Play', '会話ウィンドウを閉じて停止')}"
                      >
                        ✕ ${tr('닫기', 'Close', '閉じる')}
                      </button>
                    </div>
                  </header>

                  <!-- 2. 중앙 메인: 배경 위에 자연스럽게 서 있는 캐릭터 (경계 박스 완전 제거) + 화자 이름 + 정돈된 대사 박스 -->
                  <main class="relative z-10 flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-center px-4 py-2 sm:py-4 overflow-y-auto space-y-3 sm:space-y-4">
                    
                    <!-- 캐릭터 상반신/전신 (경계 박스 border/bg/box-shadow 완전 제거, 자연스러운 입체 드롭 섀도우) -->
                    <div class="flex flex-col items-center shrink-0">
                      <div class="relative w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-end justify-center pointer-events-none select-none">
                        <img
                          id="dialogue-speaker-bust-img"
                          src="${activeSpeakerAsset.bustPngUrl}?v=20261103v4"
                          alt="${activeSpeaker.name}"
                          loading="eager"
                          class="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] transform transition-transform duration-300"
                          onerror="this.src='${activeSpeakerAsset.seatUrl}'; this.onerror=null;"
                        />
                      </div>
                      <!-- 화자 이름 배지 & 장소 인디케이터 (모바일 표시용) -->
                      <div class="mt-2 flex items-center gap-2">
                        <div class="px-3.5 py-1 bg-amber-400 text-stone-950 font-black text-xs sm:text-sm rounded-sm tracking-wide shadow-md">
                          <span id="dialogue-modal-speaker">${activeSpeaker.name}</span>
                        </div>
                        <span class="sm:hidden px-2 py-0.5 bg-stone-900/85 border border-amber-400/40 text-amber-200 text-[10px] font-bold rounded-sm">
                          📍 ${isKo ? bgLoc.nameKo : bgLoc.nameEn}
                        </span>
                      </div>
                    </div>

                    <!-- 대사 박스: 배경 위 가독성을 높인 반투명 글래스 다크 패널 -->
                    <div class="w-full bg-[#141111]/90 backdrop-blur-md border border-amber-400/50 p-4 sm:p-5 rounded-none shadow-2xl">
                      <div class="space-y-2">
                        ${dialogueData.text
                          .split('\n\n')
                          .map(
                            (paragraph) => `
                          <p class="text-sm sm:text-base md:text-lg font-bold text-amber-50 leading-relaxed m-0 text-center break-keep">
                            ${paragraph}
                          </p>
                        `
                          )
                          .join('')}
                      </div>

                      <!-- 선택지가 있을 경우 -->
                      ${
                        line.choices && line.choices.length > 0
                          ? `
                            <div class="mt-4 pt-3 border-t border-white/10 space-y-2">
                              <div class="flex items-center justify-between text-[11px] text-stone-400">
                                <span>${tr('주인공 선택지', 'Protagonist Choice', '主人公の選択肢')} (${playRpgState.autoMode ? tr('3초 후 자동 진행', 'Auto in 3s', '3秒後に自動') : tr('선택 대기', 'Waiting for choice', '選択待機中')})</span>
                                <span class="text-amber-400 font-bold">${tr(`${line.choices.length}개 선택 가능`, `${line.choices.length} options`, `${line.choices.length}択`)}</span>
                              </div>
                              <div class="grid grid-cols-1 gap-1.5">
                                ${line.choices
                                  .map((c, cIdx) => {
                                    const cAttitude = isKo ? c.attitude || '결의' : c.attitudeEn || 'Resolve';
                                    const cLabel = isKo ? c.labelKo || c.labelEn || '선택' : c.labelEn || c.labelKo || 'Select';
                                    return `
                                      <button
                                        type="button"
                                        data-action="play-dialogue-choice"
                                        data-choice-index="${cIdx}"
                                        class="px-3.5 py-2.5 bg-[#251f1f] hover:bg-stone-800 text-[#fdfcfc] border border-amber-400/50 text-xs sm:text-sm font-bold rounded-sm min-h-[44px] text-left transition-colors flex items-center justify-between cursor-pointer active:translate-y-px"
                                      >
                                        <span><span class="text-amber-400 font-black mr-1.5">[${cAttitude}]</span>${cLabel}</span>
                                        <span class="text-[10px] text-emerald-400 font-mono">${c.bonusType === 'sns' ? tr('+SNS 코인', '+SNS Coins', '+SNSコイン') : tr('+버프 각성', '+Buff Awakening', '+バフ覚醒')}</span>
                                      </button>
                                    `;
                                  })
                                  .join('')}
                              </div>
                            </div>
                          `
                          : ''
                      }
                    </div>
                  </main>

                  <!-- 3. 하단 바: 조작 버튼들 (자동 진행 토글, 이전, 다음 / 전투 시작) -->
                  <footer class="w-full shrink-0 px-4 sm:px-6 py-3 border-t border-white/10 bg-[#161313]/95 z-20">
                    <div class="max-w-2xl mx-auto flex items-center justify-between gap-3">
                      <!-- 좌측: 자동 진행 토글 버튼 -->
                      <button
                        type="button"
                        data-action="play-toggle-auto"
                        class="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer flex items-center gap-1.5 active:translate-y-px"
                        aria-label="${tr('자동 진행 모드 토글', 'Toggle Auto-Play', '自動進行切替')}"
                      >
                        ${playRpgState.autoMode ? '⚡ ' + tr('자동 진행 ON', 'Auto: ON', '自動: ON') : '⏸️ ' + tr('자동 진행 OFF', 'Auto: OFF', '自動: OFF')}
                      </button>

                      <!-- 우측: 이전 / 다음 (또는 전투 시작) -->
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          data-action="play-dialogue-prev"
                          ${playRpgState.currentDialogueLineIdx <= 0 ? 'disabled' : ''}
                          class="px-3 sm:px-4 py-2.5 ${
                            playRpgState.currentDialogueLineIdx <= 0
                              ? 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                              : 'bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-500 cursor-pointer active:translate-y-px'
                          } text-xs font-black rounded-sm min-h-[44px] transition-colors flex items-center gap-1"
                          aria-label="${tr('이전 대화로 이동', 'Previous Dialogue', '前の会話へ')}"
                        >
                          ◀ ${tr('이전', 'Prev', '前へ')}
                        </button>
                        ${
                          isFinal
                            ? `
                              <button
                                type="button"
                                data-action="play-battle-start"
                                class="px-4 sm:px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-black rounded-sm min-h-[44px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-none active:scale-95"
                              >
                                ⚔️ ${tr('전투 시작 ▶', 'Start Battle ▶', '戦闘開始 ▶')}
                              </button>
                            `
                            : `
                              <button
                                type="button"
                                data-action="play-dialogue-next"
                                class="px-4 sm:px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-black rounded-sm min-h-[44px] transition-colors flex items-center gap-1 cursor-pointer active:translate-y-px"
                              >
                                ${tr('다음 대화 ▶', 'Next ▶', '次へ ▶')}
                              </button>
                            `
                        }
                      </div>
                    </div>
                  </footer>
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
              // Single fixed canonical location background for the active episode battle
              const bgLoc = getEpisodeBackground(currentChapter);
              preloadLocationBackground(bgLoc.bgJpgUrl);

              return `
            <div
              id="play-battle-modal-root"
              class="fixed inset-0 z-50 flex flex-col justify-between bg-[#060a14] text-[#fdfcfc] font-mono select-none overflow-hidden h-[100dvh]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="battle-modal-title"
            >
              <!-- 0. 에피소드 고정 장소 배경 아트 레이어 & 배틀 전용 다크 비네팅 오버레이 -->
              <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
                <img
                  src="${bgLoc.bgJpgUrl}"
                  alt="${bgLoc.nameKo}"
                  class="w-full h-full object-cover object-center filter brightness-[0.55] contrast-[1.12] scale-105"
                />
                <!-- 부드러운 상하 비네팅 및 다크 그라데이션 오버레이로 배틀 보드 및 카드 가독성 확보 -->
                <div class="absolute inset-0 bg-gradient-to-b from-[#060a14]/90 via-[#060a14]/65 to-[#060a14]/95"></div>
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.7)_100%)]"></div>
              </div>

              <!-- 1. 상단 바: 챕터 / 장소 배지 / 대결 상대 / 닫기 버튼 -->
              <header class="w-full shrink-0 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 bg-[#0c1222]/90 backdrop-blur-md z-20">
                <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                  <span class="px-2 py-0.5 bg-amber-400 text-stone-950 text-[10px] sm:text-xs font-black rounded-sm shrink-0">
                    ${chapterLabel}
                  </span>
                  <span class="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-stone-900/80 border border-amber-400/40 text-amber-200 text-[10px] font-bold rounded-sm shrink-0">
                    📍 ${isKo ? bgLoc.nameKo : bgLoc.nameEn}
                  </span>
                  <h3 id="battle-modal-title" class="text-xs sm:text-sm md:text-base font-black text-white m-0 truncate">
                    vs ${epDeck.leaderName} ${tr('외', '& others', '他')} (${epDeck.deckNames.slice(0, 3).join('·')})
                  </h3>
                  ${
                    playRpgState.reincarnationLevel > 0
                      ? `<span class="px-1.5 py-0.5 bg-amber-400 text-stone-950 text-[9px] sm:text-[10px] font-black rounded-sm shrink-0">✨${tr(`영웅오라 +${playRpgState.reincarnationLevel}`, `Hero Aura +${playRpgState.reincarnationLevel}`, `英雄オーラ +${playRpgState.reincarnationLevel}`)}</span>`
                      : ''
                  }
                </div>
                <button
                  type="button"
                  data-action="play-dialogue-close"
                  class="px-3 py-1.5 bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-500/70 text-xs font-black rounded-sm min-h-[44px] cursor-pointer shrink-0 flex items-center gap-1 active:translate-y-px"
                  aria-label="${tr('배틀 중지 및 맵으로 복귀', 'Exit Battle & Return to Map', 'バトルを中断してマップへ戻る')}"
                >
                  ✕ ${tr('닫기', 'Close', '閉じる')}
                </button>
              </header>

              <!-- 2. 중앙 메인: 턴 안내 바 + 3x3 전장 보드 필드 + 전투 승패 결과 (고유 ID 컨테이너로 깜박임 없는 국소 갱신 지원) -->
              <main class="relative z-10 flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-center px-3 py-1 sm:py-3 overflow-y-auto space-y-2 sm:space-y-3">
                <!-- 실시간 턴 안내 및 캐던스 바 -->
                <div id="battle-status-bar" class="w-full flex items-center justify-between px-3 py-1.5 bg-[#0e1628] border border-white/10 text-xs rounded-none font-mono select-none">
                  ${renderBattleStatusBarHtml()}
                </div>

                <!-- 3x3 Battle Field Board (고정 aspect-[5/7] 슬롯으로 카드 배치 전후 높이 100% 동일 유지) -->
                <div id="battle-board-grid" class="grid grid-cols-3 gap-1.5 sm:gap-2.5 w-full max-w-[285px] sm:max-w-[360px] md:max-w-[400px] mx-auto select-none p-1.5 sm:p-2.5 bg-[#0c1220] border-2 border-amber-400/60 shadow-2xl rounded-none">
                  ${renderBattleBoardGridHtml()}
                </div>

                <!-- Battle Result Controls (Victory Required to Advance Chapter) -->
                <div id="battle-result-container" class="w-full">
                  ${renderBattleResultControlsHtml()}
                </div>
              </main>

              <!-- 3. 하단 바: Player Active Hand Cards (한 손 조작 최적화) -->
              <footer class="relative w-full shrink-0 border-t border-white/10 bg-[#090f1e]/90 backdrop-blur-md px-3 py-2 sm:py-3 z-20">
                <div class="w-full max-w-2xl mx-auto flex flex-col items-center">
                  <div class="w-full flex items-center justify-between pb-1 text-[10px] sm:text-[11px] text-stone-400 font-mono">
                    <span>${tr('내 핸드 카드', 'My Hand Cards', '手札カード')} <span id="battle-hand-count">(${playRpgState.playerHand.length})</span></span>
                    <span class="text-amber-400 font-bold">${tr('카드를 터치하여 선택 후 보드에 배치', 'Tap card to select, then tap slot', 'カードを選択してスロットへ配置')}</span>
                  </div>
                  <!-- 카드 덱 행 (고유 ID 컨테이너로 깜박임 없는 국소 갱신) -->
                  <div id="battle-hand-row" class="flex flex-nowrap items-stretch justify-center gap-1 sm:gap-2.5 w-full pt-1">
                    ${renderBattleHandRowHtml()}
                  </div>
                </div>
              </footer>
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
                          👑 ${tr('40화 대장정 완주 · 차원 환생', 'Episode 40 Clear · Dimensional Reincarnation', '全40話完走・次元転生')}
                        </span>
                        <h3 id="reincarnation-modal-title" class="text-base sm:text-lg font-black text-white m-0">
                          ${tr(
                            `환생 ${nextRebirth}회차 각성 (환생${nextRebirth}-1화 시작)`,
                            `Reincarnation ${nextRebirth} Awakening (Start Rebirth ${nextRebirth}-1)`,
                            `転生${nextRebirth}周目覚醒（転生${nextRebirth}-第1話開始）`
                          )}
                        </h3>
                      </div>
                      <button
                        type="button"
                        data-action="play-reincarnate-close"
                        class="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer shrink-0"
                        aria-label="${tr('환생 창 닫기 및 플레이 중지', 'Close Reincarnation Modal', '転生ウィンドウを閉じる')}"
                      >
                        ✕ ${tr('닫기', 'Close', '閉じる')}
                      </button>
                    </div>

                    <!-- Character & Description -->
                    <div class="flex items-center gap-4 bg-[#100d0d] border border-amber-400/40 p-3.5 rounded-none">
                      <div class="w-20 h-20 sm:w-24 sm:h-24 bg-[#0d0b0b] border border-amber-400 rounded-none shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src="${kadanAsset.bustPngUrl}?v=20261103v4"
                          alt="${kadanAsset.nameKo}"
                          class="w-full h-full object-contain"
                          onerror="this.src='${kadanAsset.seatUrl}'; this.onerror=null;"
                        />
                      </div>
                      <div class="space-y-1.5 text-xs">
                        <p class="text-amber-200 font-bold leading-relaxed m-0">
                          ${tr(
                            '제40화의 마지막 결전을 넘어 새로운 차원의 지평선이 열렸습니다!',
                            'Beyond the final battle of Episode 40, a new dimensional horizon has opened!',
                            '第40話の最終決戦を超え、新たな次元の地平が開かれました！'
                          )}
                        </p>
                        <p class="text-stone-300 leading-relaxed m-0">
                          ${tr(
                            `보유 카드와 육성 레벨(Lv)은 모두 영구 보존되며, <strong class="text-amber-400">[환생${nextRebirth}-1화]</strong>부터 더욱 강력한 적들과 새로운 여정이 시작됩니다.`,
                            `All owned cards and nurture levels (Lv) are permanently preserved as a new journey against stronger foes begins at <strong class="text-amber-400">[Rebirth ${nextRebirth}-1]</strong>.`,
                            `保有カードと育成レベル（Lv）はすべて永久保存され、<strong class="text-amber-400">[転生${nextRebirth}-第1話]</strong>からさらに強力な敵との新たな旅が始まります。`
                          )}
                        </p>
                      </div>
                    </div>

                    <!-- 3-Second Auto Reincarnation Countdown Bar -->
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between text-xs font-bold text-amber-300">
                        <span>⚡ ${tr(
                          `3초 후 [환생${nextRebirth}-1화]가 자동으로 시작됩니다...`,
                          `[Rebirth ${nextRebirth}-1] starts automatically in 3 seconds...`,
                          `3秒後に[転生${nextRebirth}-第1話]が自動的に開始されます...`
                        )}</span>
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
                        👑 ${tr('환생 레벨', 'Rebirth Lv', '転生レベル')}: Lv.${nextRebirth}
                      </div>
                      <button
                        type="button"
                        data-action="play-reincarnate-now"
                        class="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs sm:text-sm font-black rounded-sm min-h-[44px] cursor-pointer"
                      >
                        👑 ${tr(
                          `환생${nextRebirth}-1화 즉시 시작`,
                          `Start Rebirth ${nextRebirth}-1 Now`,
                          `転生${nextRebirth}-第1話をすぐ開始`
                        )} (${Math.max(1, Math.ceil(remainingSec))}s) ▶
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
    { key: 'all', label: tr('전체 (All)', 'All', 'すべて (All)') },
    { key: 'water', label: `${getLocalizedFactionName('물')} (Water)` },
    { key: 'fire', label: `${getLocalizedFactionName('불')} (Fire)` },
    { key: 'wind', label: `${getLocalizedFactionName('바람')} (Wind)` },
    { key: 'earth', label: `${getLocalizedFactionName('땅')} (Earth)` },
    { key: 'human', label: `${getLocalizedFactionName('인간')} (Human)` },
    { key: 'undead', label: `${getLocalizedFactionName('언데드')} (Undead)` },
    { key: 'elf', label: `${getLocalizedFactionName('엘프')} (Elf)` },
    { key: 'dwarf', label: `${getLocalizedFactionName('호빗')} (Hobbit)` },
    { key: 'monster', label: `${getLocalizedFactionName('야수')} (Beast)` },
    { key: 'robot', label: `${getLocalizedFactionName('메카')} (Mecha)` },
    { key: 'dragon', label: `${getLocalizedFactionName('드래곤')} (Dragon)` },
  ];

  // 110 Games Filter
  const filteredGames: { id: number; title: string; element: string; power: number }[] = [];
  for (let id = 1; id <= 110; id++) {
    const card = CARD_DATABASE[id];
    if (!card) continue;

    const rawEl = card.element?.toLowerCase() || 'water';
    const el = rawEl === 'air' ? 'wind' : rawEl;
    const locName = getLocalizedCharacterName(id);
    const titleMatch =
      locName.toLowerCase().includes(query) ||
      card.title?.toLowerCase().includes(query) ||
      (card.desc && card.desc.toLowerCase().includes(query));
    const elMatch = selectedElement === 'all' || el === selectedElement;

    if (titleMatch && elMatch) {
      filteredGames.push({
        id,
        title: locName || card.title || `Hero ${id}`,
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
            <span class="text-xs font-bold text-[#201d1d] uppercase">${tr(
              '[110선 Poki 미니게임 아케이드 카탈로그]',
              '[110 Poki Minigames Arcade Catalog]',
              '[110種 Pokiミニゲーム・アーケードカタログ]'
            )}</span>
            <p class="text-xs text-stone-500 m-0 pt-0.5">
              ${tr(
                '110종 영웅 수호 덱과 2D Canvas 챌린지 플레이 · 100% 모바일 퓨어 터치 지원',
                '110 Hero Guardian Decks & 2D Canvas Challenges · 100% Mobile Pure Touch',
                '110種英雄守護デッキ＆2Dキャンバスチャレンジ・100%モバイルタッチ対応'
              )}
            </p>
          </div>

          <!-- Random Play Roller Button -->
          <button
            type="button"
            data-action="play-arcade-random"
            class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] hover:bg-stone-800 text-xs font-bold rounded-sm min-h-[44px] inline-flex items-center gap-1.5 cursor-pointer active:translate-y-px"
            aria-label="${tr('랜덤 플레이', 'Random Play', 'ランダムプレイ')}"
          >
            🎲 ${tr('랜덤 플레이 (Die Roll)', 'Random Play (Die Roll)', 'ランダムプレイ (Die Roll)')}
          </button>
        </div>

        <!-- Search Input -->
        <div class="w-full">
          <input
            type="text"
            data-action="play-arcade-search"
            value="${playRpgState.arcadeQuery}"
            placeholder="${tr('미니게임 및 캐릭터 검색 (110종)...', 'Search minigames & heroes (110)...', 'ミニゲーム・キャラクター検索 (110種)...')}"
            class="w-full px-3 py-2 bg-white text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px]"
            aria-label="${tr('미니게임 검색', 'Search Minigames', 'ミニゲーム検索')}"
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
                  <span class="text-[10px] text-stone-500 font-mono">${tr('전투력', 'Power', '戦闘力')}: ${g.power} TP</span>
                </div>

                <button
                  type="button"
                  data-action="play-arcade-launch"
                  data-card-id="${g.id}"
                  class="w-full py-2 bg-[#f1eeee] text-[#201d1d] hover:bg-[#201d1d] hover:text-[#fdfcfc] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="${g.title} ${tr('플레이', 'Play', 'プレイ')}"
                >
                  🎮 ${tr('도전 / 플레이', 'Challenge / Play', '挑戦 / プレイ')}
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
              const activeTitle =
                getLocalizedCharacterName(playRpgState.activeArcadeModalId) ||
                CARD_DATABASE[playRpgState.activeArcadeModalId]?.title ||
                tr('수호자 미니게임', 'Guardian Minigame', '守護者ミニゲーム');
              const activeAsset = getCharacterAsset(playRpgState.activeArcadeModalId);
              return `
                <div class="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none z-[99999] bg-[#fdfcfc] flex flex-col justify-between">
                  <!-- Minimalist Mission HUD -->
                  <div class="w-full bg-[#201d1d] text-[#fdfcfc] px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black uppercase text-amber-400">${tr('[아케이드 챌린지]', '[Arcade Challenge]', '[アーケードチャレンジ]')}</span>
                      <span class="text-xs font-bold text-white">${activeTitle}</span>
                    </div>

                    <button
                      type="button"
                      data-action="play-arcade-close"
                      class="px-4 py-2 bg-stone-800 text-white hover:bg-stone-700 text-xs font-bold rounded-sm border border-stone-600 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      aria-label="${tr('미니게임 닫기', 'Close Minigame', 'ミニゲームを閉じる')}"
                    >
                      ✕ ${tr('나가기', 'Exit', '終了')}
                    </button>
                  </div>

                  <!-- Game Stage Placeholder / 2D Canvas Duel Arena -->
                  <div class="flex-1 w-full bg-[#0e0c0c] flex flex-col items-center justify-center p-4 text-center space-y-4">
                    <div class="w-24 h-24 rounded-none bg-stone-900 border border-white/20 p-2 flex items-center justify-center overflow-hidden">
                      <img src="${activeAsset.bustPngUrl}" alt="${activeAsset.nameKo}" class="w-full h-full object-contain" onerror="this.src='${activeAsset.seatUrl}'; this.onerror=null;" />
                    </div>

                    <div class="space-y-1">
                      <h3 class="text-base sm:text-lg font-bold text-white m-0">${activeTitle} — ${tr('전용 수호자 시련', 'Guardian Trial', '専用守護者試練')}</h3>
                      <p class="text-xs text-stone-400 m-0">${tr('2D 모바일 제스처 터치 및 3x3 카드 대결 플레이를 지원합니다.', 'Supports 2D mobile touch gestures and 3x3 card duel play.', '2Dモバイルタッチジェスチャーおよび3x3カード対戦に対応しています。')}</p>
                    </div>

                    <button
                      type="button"
                      data-action="play-ambush-start"
                      class="px-6 py-3 bg-amber-400 text-stone-950 hover:bg-amber-300 text-xs font-black rounded-sm min-h-[44px] transition-colors cursor-pointer"
                    >
                      ⚔️ ${tr('수호 덱과 3x3 카드 결투 개시', 'Start 3x3 Card Duel vs Guardian Deck', '守護デッキと3x3カード決闘開始')}
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
  const isKo = isKoreanLanguage();
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
              aria-label="${tr('플레이 뷰 닫기 및 홈으로 복귀', 'Close Play View & Return Home', '閉じてホームへ戻る')}"
            >
              ${tr('닫기', 'Close', '閉じる')}
            </button>

            <!-- Button 2: 이전 -->
            <button
              type="button"
              data-action="play-prev"
              class="px-5 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center cursor-pointer active:translate-y-px"
              aria-label="${tr('이전 씬으로 이동', 'Previous Scene', '前のシーンへ')}"
            >
              ${tr('이전', 'Prev', '前へ')}
            </button>

            <!-- Button 3: 다음 -->
            <button
              type="button"
              data-action="play-next"
              class="px-5 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center cursor-pointer active:translate-y-px"
              aria-label="${tr('다음 씬으로 이동', 'Next Scene', '次のシーンへ')}"
            >
              ${tr('다음', 'Next', '次へ')}
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
              aria-label="${tr('나레이션 자막 표시 전환', 'Toggle Narration Subtitles', 'ナレーション字幕表示切替')}"
              aria-pressed="${playState.isNarrationVisible ? 'true' : 'false'}"
            >
              ${tr('나레이션', 'Narration', 'ナレーション')} ${playState.isNarrationVisible ? '[ON]' : '[OFF]'}
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
              aria-label="${tr('TTS 오디오 나레이션 재생 전환', 'Toggle TTS Audio', 'TTS音声再生切替')}"
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
            ${tr('회차 선택:', 'Episode:', 'エピソード選択:')}
          </label>
          <button
            type="button"
            data-action="play-prev-episode"
            class="px-3 py-2 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[#e8e5e5]"
            aria-label="${tr('이전 회차', 'Previous Episode', '前のエピソード')}"
          >
            &lt;
          </button>
          <select
            id="play-episode-select"
            data-action="play-select-episode"
            class="px-3 py-2 bg-white text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer flex-1 md:flex-initial"
            aria-label="${tr('40부작 회차 목록', '40-Episode List', '全40話リスト')}"
          >
            ${WEBTOON_40_EPISODES.map((ep) => {
              const epTitle = isKo ? ep.titleKo : ep.titleEn;
              const epPrefix = isKo ? `제${ep.episodeNumber}화` : `EP.${String(ep.episodeNumber).padStart(2, '0')}`;
              return `
              <option value="${ep.episodeNumber}" ${ep.episodeNumber === playState.currentEpisode ? 'selected' : ''}>
                ${epPrefix} · ${epTitle} (${ep.totalScenes}${tr('컷', ' scenes', 'カット')})
              </option>
            `;
            }).join('')}
          </select>
          <button
            type="button"
            data-action="play-next-episode"
            class="px-3 py-2 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[#e8e5e5]"
            aria-label="${tr('다음 회차', 'Next Episode', '次のエピソード')}"
          >
            &gt;
          </button>
        </div>

        <div class="flex items-center gap-3 text-xs text-stone-600 font-bold">
          <span class="px-2 py-1 bg-[#f1eeee] rounded-sm border border-[rgba(15,0,0,0.12)]">
            ${tr('씬', 'Scene', 'シーン')} ${padScene} / ${padTotal}
          </span>
          <span class="text-stone-400">|</span>
          <span class="text-[#201d1d]">
            ${playState.isTtsActive ? tr('🔊 TTS 음성 활성화됨', '🔊 TTS Audio Active', '🔊 TTS音声有効') : tr('🔇 TTS 음성 비활성', '🔇 TTS Audio Muted', '🔇 TTS音声オフ')}
          </span>
        </div>
      </section>

      <!-- 4. Webtoon Scene Illustration Stage -->
      <section class="w-full bg-[#0e0c0c] border border-[rgba(15,0,0,0.12)] rounded-none overflow-hidden relative flex flex-col items-center justify-center min-h-[360px] sm:min-h-[480px] lg:min-h-[540px]">
        <div class="w-full flex items-center justify-center p-2 sm:p-4">
          <img
            src="${sceneImageUrl}"
            alt="${isKo ? currentEp.titleKo : currentEp.titleEn} - ${padScene}"
            class="max-w-full max-h-[65vh] object-contain mx-auto shadow-none select-none transition-opacity duration-200"
            loading="eager"
            onerror="this.src='/images/webtoon/episode_${padEp}/scene_00.webp'; this.onerror=null;"
          />
        </div>

        <div class="absolute top-3 left-3 px-2.5 py-1 bg-[#201d1d]/85 text-[#fdfcfc] text-[11px] font-bold rounded-sm border border-white/15 backdrop-blur-xs">
          [EP.${padEp} · ${tr('씬', 'Scene', 'シーン')} ${padScene} / ${padTotal}]
        </div>

        ${
          playState.isNarrationVisible
            ? `
              <div class="w-full bg-[#fdfcfc]/95 border-t border-[rgba(15,0,0,0.12)] p-4 sm:p-5 font-mono space-y-2 backdrop-blur-xs">
                <div class="flex items-center justify-between">
                  <div class="inline-flex items-center gap-2">
                    <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm uppercase tracking-wider">
                      ${isKo ? currentEp.speakerKo : currentEp.speakerEn}
                    </span>
                    <span class="text-[11px] text-stone-500 font-semibold">${currentEp.speakerEn}</span>
                  </div>
                  <div class="text-[11px] font-bold">
                    ${
                      playState.isTtsActive
                        ? `<span class="text-emerald-700 font-bold">● ${tr('TTS 음성 출력 중', 'TTS Speaking', 'TTS音声出力中')}</span>`
                        : `<span class="text-stone-400">○ ${tr('TTS 대기 (OFF)', 'TTS Standby (OFF)', 'TTS待機 (OFF)')}</span>`
                    }
                  </div>
                </div>

                <p class="text-xs sm:text-sm font-semibold text-[#201d1d] leading-relaxed m-0">
                  ${isKo ? currentEp.leadNarrationKo : currentEp.leadNarrationEn}
                </p>
                ${
                  isKo
                    ? `<p class="text-[11px] text-stone-500 leading-normal m-0 pt-0.5 font-mono">${currentEp.leadNarrationEn}</p>`
                    : ''
                }
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
          aria-label="${tr('이전 컷', 'Previous Panel', '前のカット')}"
        >
          ◀ ${tr('이전 컷', 'Prev Panel', '前のカット')}
        </button>

        <div class="flex-1 w-full flex flex-col justify-center px-1">
          <input
            type="range"
            min="0"
            max="${Math.max(0, currentEp.totalScenes - 1)}"
            value="${playState.currentScene}"
            data-action="play-scrub-scene"
            class="w-full cursor-pointer accent-[#201d1d] min-h-[44px]"
            aria-label="${tr('웹툰 씬 타임라인 스크러버', 'Webtoon Scene Timeline Scrubber', 'ウェブトゥーン・タイムライン')}"
          />
          <div class="flex justify-between text-[10px] text-stone-500 pt-0.5">
            <span>${tr('씬 01 (시작)', 'Scene 01 (Start)', 'シーン 01 (開始)')}</span>
            <span class="font-bold text-[#201d1d]">${tr('컷', 'Panel', 'カット')} ${playState.currentScene + 1} / ${currentEp.totalScenes}</span>
            <span>${tr(`씬 ${currentEp.totalScenes} (끝)`, `Scene ${currentEp.totalScenes} (End)`, `シーン ${currentEp.totalScenes} (終了)`)}</span>
          </div>
        </div>

        <button
          type="button"
          data-action="play-next"
          class="w-full sm:w-auto px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] flex items-center justify-center cursor-pointer"
          aria-label="${tr('다음 컷', 'Next Panel', '次のカット')}"
        >
          ${tr('다음 컷', 'Next Panel', '次のカット')} ▶
        </button>
      </section>

      <!-- 6. 40-Episode Quick Jump Carousel Grid -->
      <section class="w-full mt-6 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-4 rounded-none space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.12)]">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-[#201d1d]">${tr('[40부작 전편 빠른 이동 (Carousel)]', '[All 40 Episodes Quick Jump]', '[全40話クイック移動]')}</span>
            <span class="text-[11px] text-stone-500">${tr('전편 감상 가능', 'All Episodes Available', '全話鑑賞可能')}</span>
          </div>
          <span class="text-[11px] text-stone-500 font-mono">${tr('1~40화 전편 수록', 'Episodes 1–40 Complete', '第1〜40話収録')}</span>
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
                aria-label="EP.${ep.episodeNumber}"
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
// 4. Floating AUTO PLAY Button & Main Exported Renderer
// ============================================================================

/**
 * Render Floating AUTO PLAY Action Button at Bottom-Right (z-[70])
 * - Raised upward (bottom-24 sm:bottom-28) so it never covers bottom navigation or action buttons
 * - Modern OpenCode Terminal-Flat design: single flat pill, 1px hairline border, 44px+ touch target
 * - Clean status dot, modern vector icon, integrated [ON]/[OFF] state badge (zero visual clutter)
 */
export function renderAutoPlayFloatingButton(): string {
  const isAuto = playRpgState.autoMode;

  return `
    <aside
      id="play-floating-auto-dock"
      class="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-[70] select-none pointer-events-auto font-mono"
      aria-label="${tr('자동 진행 컨트롤러', 'Auto-Play Controller', '自動進行コントローラー')}"
    >
      <button
        type="button"
        data-action="play-toggle-auto"
        class="group flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-sm border transition-all cursor-pointer select-none active:scale-95 shadow-md min-h-[44px] ${
          isAuto
            ? 'bg-[#201d1d] text-[#fdfcfc] border-amber-400 hover:border-amber-300'
            : 'bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border-stone-300'
        }"
        aria-label="${isAuto ? tr('자동 진행 중지', 'Stop Auto-Play', '自動進行停止') : tr('자동 진행 시작', 'Start Auto-Play', '自動進行開始')}"
        title="${isAuto ? tr('자동 진행 중지 (클릭 시 멈춤)', 'Stop Auto-Play (Click to pause)', '自動進行停止 (クリックで一時停止)') : tr('자동 진행 시작 (클릭 시 자동 모험)', 'Start Auto-Play (Click to run)', '自動進行開始 (クリックで自動冒険)')}"
      >
        <!-- Status Indicator Dot -->
        <span class="w-2 h-2 rounded-full shrink-0 ${
          isAuto ? 'bg-emerald-400 animate-pulse' : 'bg-stone-400'
        }"></span>

        <!-- Modern Vector Icon (Spinning loop when active, clean play triangle when idle) -->
        <svg
          viewBox="0 0 24 24"
          class="w-4 h-4 shrink-0 transition-transform ${isAuto ? 'text-amber-400 animate-spin' : 'text-stone-600 group-hover:text-[#201d1d]'}"
          style="${isAuto ? 'animation-duration: 3s;' : ''}"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          ${
            isAuto
              ? `
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              `
              : `
                <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" />
              `
          }
        </svg>

        <!-- Label & State Badge -->
        <div class="flex items-center gap-1.5 text-xs font-bold leading-none tracking-tight">
          <span class="font-mono tracking-tight font-black">AUTO PLAY</span>
          <span class="px-1.5 py-0.5 text-[10px] font-mono font-black rounded-xs ${
            isAuto
              ? 'bg-amber-400 text-stone-950'
              : 'bg-stone-200 text-stone-600'
          }">
            ${isAuto ? 'ON' : 'OFF'}
          </span>
        </div>
      </button>
    </aside>
  `;
}

/**
 * Main render function for the PlaySection view.
 * Displays 2D Adventure RPG (카단의 여정) with 3x3 tactical battle loop.
 */
export function renderPlaySection(): string {
  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 font-mono select-none text-[#201d1d]">
      <!-- Adventure RPG View (카단의 여정) -->
      <div id="kadan-journey-stage" class="w-full">
        ${renderAdventureView()}
      </div>

      <!-- Floating AUTO PLAY Action Button (Fixed Bottom-Right) -->
      ${renderAutoPlayFloatingButton()}
    </div>
  `;
}
