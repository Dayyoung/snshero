/**
 * src/landing/services/playRpgEngine.ts
 *
 * Milestone 3: Pure TypeScript 2D Tile Adventure, Episode Dialogue,
 * 3x3 Tactical Card Battle Loop, and Poki 110 Arcade State Engine.
 *
 * Zero React runtime dependency — 100% genuine state machine:
 * - 2D Tile Grid & Hero movement (bounds checking, blocked tiles, ambushes).
 * - Chapter novel lore dialogue progression & protagonist interactive choices.
 * - 3x3 Tactical Card Battle flip engine (5 player cards vs 5 opponent cards).
 * - Battle victory awards 50 EXP to active deck cards via cardNurtureStore.
 * - Auto-Play loop progression (hero_kadan_rpg_auto_mode) hands-free runner.
 * - 110 Poki minigames catalog, search, filter, random die roll, and launch state.
 *
 * DESIGN.md Terminal Flat compliance: 0px/4px border radii, 44px+ touch targets.
 */

import { CARD_DATABASE } from '../../cardDatabase';
import {
  KADAN_RPG_EVENTS,
  KADAN_RPG_REGIONS,
  getKadanRpgRegion,
  getKadanRpgEvent,
  getDynamicKadanEncounter,
  KadanRpgEvent,
  KadanRpgRegion,
  KadanRpgTile,
  chapterTitles,
} from '../../content/kadanRpgStory';
import { KADAN_RPG_NOVEL_SCRIPTS, KadanRpgNovelScriptLine, KadanRpgDialogueChoice } from '../../content/kadanRpgNovelScript';
import { cardNurtureStore } from './cardNurtureStore';
import { getCharacterAsset, getLocalizedCharacterName } from './assetCatalog';
import { isKoreanLanguage, tr } from './i18n';
import {
  shouldTriggerAmbush,
  generateAmbushEncounter,
  AmbushEncounter,
  BANDIT_DECK_PRESET,
  THIEF_DECK_PRESET,
} from '../../lib/rpg/kadanRpgAmbush';
import { audioManager } from './audioManager';
import { preloadNearbyChapterBackgrounds } from './locationBgManager';

// Attach awardBattleVictoryExp and getCard to cardNurtureStore if not already present
if (typeof (cardNurtureStore as any).getCard !== 'function') {
  (cardNurtureStore as any).getCard = function (cardId: number) {
    return (
      (this as any).cards[cardId] || {
        cardId,
        level: 1,
        exp: 0,
        expToNext: 100,
        statPoints: 0,
        bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
        totalBonus: 0,
      }
    );
  };
}

if (typeof (cardNurtureStore as any).awardBattleVictoryExp !== 'function') {
  (cardNurtureStore as any).awardBattleVictoryExp = function (exp: number = 50) {
    const deck = (this as any).getDeckCardIds ? (this as any).getDeckCardIds() : [1, 2, 3, 4, 5];
    for (const cardId of deck) {
      this.nurtureCard(cardId, exp);
    }
    return { expAwarded: exp, deckCount: deck.length };
  };
}

export type PlayTabKey = 'adventure' | 'arcade' | 'webtoon';
export type PlaySubState = 'map' | 'dialogue' | 'battle' | 'reward' | 'reincarnation';

export interface BattleSlotState {
  cardId: number;
  owner: 'player' | 'opponent';
  stats: [number, number, number, number]; // [top, right, bottom, left]
  name: string;
}

export interface PlayerTacticalMove {
  handIdx: number;
  slotIdx: number;
  score: number;
  reason: string;
  flipsCount: number;
}

export interface PlayRpgState {
  activeTab: PlayTabKey;
  subState: PlaySubState;
  currentChapter: number;
  reincarnationLevel: number;
  reincarnationTimerSec: number;
  reincarnationDeadlineMs: number;
  heroTile: KadanRpgTile;
  targetTile: KadanRpgTile;
  regionId: string;
  stepCount: number;
  lastAmbushStep: number;
  ambushTriggeredInChapter: boolean;
  activeAmbush: AmbushEncounter | null;
  autoMode: boolean;
  repeatHunting: boolean;

  // Dialogue Sub-state
  currentDialogueLineIdx: number;
  currentDialoguePartIdx: number;     // 0: 첫 번째 파트, 1: 두 번째 파트 (대사 분할 시)
  dialogueTypingComplete: boolean;    // 현재 파트 글자 출력 완료 여부
  dialogueDisplayedLength: number;    // 현재 표시된 글자 수
  selectedChoiceIdx: number | null;
  choiceTimerSec: number;
  activeBuff: string | null;
  lastAutoStepAt: number;
  dialogueLineStartedAt: number;

  // Battle Sub-state
  battleBoard: (BattleSlotState | null)[]; // 9 slots
  playerHand: number[];                   // 5 card IDs
  opponentHand: number[];                 // 5 card IDs
  selectedHandIndex: number;
  turn: 'player' | 'opponent';
  battleWinner: 'player' | 'opponent' | 'draw' | null;
  battleMessage: string;
  opponentName: string;
  lastPlacedSlot: number | null;
  flippedSlots: number[];
  aiSuggestedMove: PlayerTacticalMove | null;

  // Battle Preload & Anti-Flicker Caching State
  battleLoading: boolean;
  battleLoadingProgress: number; // 0 ~ 100
  battleLoadingCardName: string;

  // Arcade Sub-state
  arcadeQuery: string;
  arcadeElement: string;
  activeArcadeModalId: number | null;
}

/**
 * Global singleton state for Milestone 3 Play RPG engine
 */
export const playRpgState: PlayRpgState = {
  activeTab: 'adventure', // Default initial view per Approved Task Prompt & M3 spec
  subState: 'map',
  currentChapter: 1,
  reincarnationLevel: 0,
  reincarnationTimerSec: 3.0,
  reincarnationDeadlineMs: 0,
  heroTile: { x: 2, y: 2 },
  targetTile: { x: 4, y: 3 },
  regionId: 'elwin-wildland',
  stepCount: 0,
  lastAmbushStep: -99,
  ambushTriggeredInChapter: false,
  activeAmbush: null,
  autoMode: false,
  repeatHunting: false,

  currentDialogueLineIdx: 0,
  currentDialoguePartIdx: 0,
  dialogueTypingComplete: false,
  dialogueDisplayedLength: 0,
  selectedChoiceIdx: null,
  choiceTimerSec: 5.0,
  activeBuff: null,
  lastAutoStepAt: 0,
  dialogueLineStartedAt: 0,

  battleBoard: Array(9).fill(null),
  playerHand: [1, 2, 3, 4, 5],
  opponentHand: [51, 52, 61, 60, 43],
  selectedHandIndex: 0,
  turn: 'player',
  battleWinner: null,
  battleMessage: '원하는 카드를 선택한 후 3x3 전장의 빈 슬롯을 터치하세요.',
  opponentName: '섀도우렐름 척후병',
  lastPlacedSlot: null,
  flippedSlots: [],
  aiSuggestedMove: null,

  battleLoading: false,
  battleLoadingProgress: 0,
  battleLoadingCardName: '',

  arcadeQuery: '',
  arcadeElement: 'all',
  activeArcadeModalId: null,
};

/**
 * Initialize state from localStorage flags
 */
export function initPlayRpgState(): void {
  if (typeof localStorage === 'undefined') return;

  try {
    // Auto-mode starts strictly paused by default so it never runs automatically without user interaction
    playRpgState.autoMode = false;
    try {
      localStorage.setItem('hero_kadan_rpg_auto_mode', 'false');
    } catch {}

    const savedRepeat = localStorage.getItem('hero_repeat_hunting');
    playRpgState.repeatHunting = savedRepeat === 'true';

    const savedChapter = localStorage.getItem('hero_kadan_rpg_chapter');
    if (savedChapter) {
      const parsed = parseInt(savedChapter, 10);
      if (parsed >= 1 && parsed <= 40) {
        playRpgState.currentChapter = parsed;
      }
    }

    const savedRebirth = localStorage.getItem('hero_kadan_rpg_rebirth_level');
    if (savedRebirth) {
      const parsedRebirth = parseInt(savedRebirth, 10);
      if (!isNaN(parsedRebirth) && parsedRebirth >= 0) {
        playRpgState.reincarnationLevel = parsedRebirth;
      }
    }
  } catch (err) {
    console.warn('[playRpgEngine] Error reading localStorage:', err);
  }

  syncRegionAndTargets();
}

/**
 * Format chapter prefix label (e.g. "제1화" or "환생1-1화")
 */
export function formatChapterLabel(
  chapter: number = playRpgState.currentChapter,
  rebirthLevel: number = playRpgState.reincarnationLevel
): string {
  if (rebirthLevel > 0) {
    return tr(
      `환생${rebirthLevel}-${chapter}화`,
      `Rebirth ${rebirthLevel}-${chapter}`,
      `転生${rebirthLevel}-第${chapter}話`
    );
  }
  return tr(`제${chapter}화`, `EP.${chapter}`, `第${chapter}話`);
}

/**
 * Synchronize target event coordinates and region info for current chapter
 */
export function syncRegionAndTargets(): void {
  const chEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === playRpgState.currentChapter);
  if (chEvent) {
    playRpgState.targetTile = { ...chEvent.tile };
    playRpgState.regionId = chEvent.regionId;
  }
}

/**
 * Switch top-level active tab
 */
export function setActiveTab(tab: PlayTabKey): void {
  playRpgState.activeTab = tab;
}

/**
 * Get the current region object
 */
export function getCurrentRegion(): KadanRpgRegion {
  return getKadanRpgRegion(playRpgState.regionId);
}

/**
 * Move hero by delta, enforcing region boundaries and blocked tiles
 */
export function stepHeroDelta(dx: number, dy: number): {
  moved: boolean;
  eventTriggered: boolean;
  ambushTriggered: boolean;
} {
  const region = getCurrentRegion();
  const newX = Math.max(0, Math.min(region.width - 1, playRpgState.heroTile.x + dx));
  const newY = Math.max(0, Math.min(region.height - 1, playRpgState.heroTile.y + dy));

  // Check if tile is blocked
  const isBlocked = region.blockedTiles.some((t) => t.x === newX && t.y === newY);
  if (isBlocked) {
    return { moved: false, eventTriggered: false, ambushTriggered: false };
  }

  // Check if no movement
  if (newX === playRpgState.heroTile.x && newY === playRpgState.heroTile.y) {
    return { moved: false, eventTriggered: false, ambushTriggered: false };
  }

  playRpgState.heroTile = { x: newX, y: newY };
  playRpgState.stepCount += 1;

  // Check if stepped onto target event tile
  const chEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === playRpgState.currentChapter);
  if (chEvent && newX === chEvent.tile.x && newY === chEvent.tile.y) {
    triggerDialogue(chEvent);
    return { moved: true, eventTriggered: true, ambushTriggered: false };
  }

  // Check for random field ambush (14% chance with cooldown protection)
  const isDest = Boolean(chEvent && newX === chEvent.tile.x && newY === chEvent.tile.y);
  if (
    shouldTriggerAmbush(
      playRpgState.stepCount,
      playRpgState.lastAmbushStep,
      playRpgState.ambushTriggeredInChapter,
      isDest
    )
  ) {
    playRpgState.lastAmbushStep = playRpgState.stepCount;
    playRpgState.ambushTriggeredInChapter = true;
    const ambush = generateAmbushEncounter(playRpgState.currentChapter, 0, playRpgState.regionId);
    playRpgState.activeAmbush = ambush;
    return { moved: true, eventTriggered: false, ambushTriggered: true };
  }

  return { moved: true, eventTriggered: false, ambushTriggered: false };
}

/**
 * Direct tile click movement
 */
export function moveHeroToTile(target: KadanRpgTile): {
  moved: boolean;
  eventTriggered: boolean;
  ambushTriggered: boolean;
} {
  const region = getCurrentRegion();
  const clampedX = Math.max(0, Math.min(region.width - 1, target.x));
  const clampedY = Math.max(0, Math.min(region.height - 1, target.y));

  const isBlocked = region.blockedTiles.some((t) => t.x === clampedX && t.y === clampedY);
  if (isBlocked) {
    return { moved: false, eventTriggered: false, ambushTriggered: false };
  }

  const dx = clampedX - playRpgState.heroTile.x;
  const dy = clampedY - playRpgState.heroTile.y;

  // Single step toward target tile
  const stepX = dx !== 0 ? Math.sign(dx) : 0;
  const stepY = stepX === 0 && dy !== 0 ? Math.sign(dy) : 0;

  return stepHeroDelta(stepX, stepY);
}

/**
 * Ensure adventure game is started immediately upon navigating to #play
 */
export function ensureGameStarted(): void {
  playRpgState.autoMode = true;
  playRpgState.activeTab = 'adventure';
  try {
    localStorage.setItem('hero_kadan_rpg_auto_mode', 'true');
  } catch {}

  const chEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === playRpgState.currentChapter) || KADAN_RPG_EVENTS[0];

  if (playRpgState.subState === 'map') {
    if (chEvent) {
      playRpgState.heroTile = { ...chEvent.tile };
      triggerDialogue(chEvent);
    }
  } else if (playRpgState.subState === 'battle' && playRpgState.battleWinner) {
    if (playRpgState.repeatHunting) {
      initBattle();
    } else {
      advanceNextChapter();
      const nextEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === playRpgState.currentChapter) || chEvent;
      if (nextEvent) {
        playRpgState.heroTile = { ...nextEvent.tile };
        triggerDialogue(nextEvent);
      }
    }
  }
}

/**
 * Truncates and condenses dialogue quote to crisp, impactful game visual-novel length (max 70~80 chars).
 * Prevents dialogue boxes from becoming bloated novels with excessive lines.
 */
function condenseDialogueQuote(rawQuote: string, maxLen: number = 75): string {
  let clean = rawQuote.trim();
  const hasKoreanQuotes = clean.startsWith('“') && clean.endsWith('”');
  const hasDoubleQuotes = clean.startsWith('"') && clean.endsWith('"');
  if (hasKoreanQuotes || hasDoubleQuotes) {
    clean = clean.slice(1, -1).trim();
  }

  // If already concise, wrap back in quotes
  if (clean.length <= maxLen) {
    return `“${clean}”`;
  }

  // Split into sentences using delimiter (. ! ?)
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length > 1) {
    let result = '';
    for (const sent of sentences) {
      const candidate = result ? `${result} ${sent}` : sent;
      if (candidate.length <= maxLen) {
        result = candidate;
      } else {
        break;
      }
    }
    if (result.length > 0) {
      return `“${result}”`;
    }
    const trimmed = sentences[0].slice(0, maxLen - 3).trim();
    return `“${trimmed}...”`;
  }

  const trimmed = clean.slice(0, maxLen - 3).trim();
  return `“${trimmed}...”`;
}

function condenseEnglishQuote(rawQuote: string, maxLen: number = 100): string {
  let clean = rawQuote.trim();
  if ((clean.startsWith('“') && clean.endsWith('”')) || (clean.startsWith('"') && clean.endsWith('"'))) {
    clean = clean.slice(1, -1).trim();
  }
  if (clean.length <= maxLen) return `"${clean}"`;

  const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  if (sentences.length > 1) {
    let result = '';
    for (const sent of sentences) {
      const candidate = result ? `${result} ${sent}` : sent;
      if (candidate.length <= maxLen) {
        result = candidate;
      } else {
        break;
      }
    }
    if (result.length > 0) return `"${result}"`;
  }
  return `"${clean.slice(0, maxLen - 3).trim()}..."`;
}

/**
 * Extract clean, concise dialogue quote from script line (대사만 추출)
 * Strictly limits to a single impactful dialogue quote (max 75 chars)
 * to keep the visual-novel reading experience swift and prevent screen clutter.
 */
export function extractDialogueText(
  line: KadanRpgNovelScriptLine,
  preferredSpeakerName?: string
): { text: string; isNarration: boolean } {
  const isKo = isKoreanLanguage();

  if (!isKo) {
    // Non-Korean languages default novel/story dialogues to English
    if (line.dialogueQuoteEn && line.dialogueQuoteEn.trim().length > 0) {
      const matches = line.dialogueQuoteEn.match(/[“"][^”"]+[”"]/g);
      const quote = matches && matches.length > 0 ? matches[0] : line.dialogueQuoteEn;
      return { text: condenseEnglishQuote(quote, 110), isNarration: false };
    }

    if (line.subCuts && line.subCuts.length > 0) {
      for (const cut of line.subCuts) {
        const srcEn = cut.dialogueEn || cut.narrationEn || '';
        const matches = srcEn.match(/[“"][^”"]+[”"]/g);
        if (matches && matches.length > 0) {
          return { text: condenseEnglishQuote(matches[0], 110), isNarration: false };
        }
      }
    }

    if (line.textEn && line.textEn.trim()) {
      const matches = line.textEn.match(/[“"][^”"]+[”"]/g);
      if (matches && matches.length > 0) {
        return { text: condenseEnglishQuote(matches[0], 110), isNarration: false };
      }
      const sentences = line.textEn
        .replace(/\n+/g, ' ')
        .split(/[.!?]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const summary = sentences.length > 0 ? sentences[0] + '.' : line.textEn.slice(0, 90) + '...';
      const cleanSummary = summary.length > 100 ? summary.slice(0, 97) + '...' : summary;
      return { text: cleanSummary, isNarration: true };
    }
  }

  // 1. preferredSpeakerName이 지정되고 subCuts가 있는 경우: 해당 화자의 발언 1개만 정밀 추출
  if (preferredSpeakerName && line.subCuts && line.subCuts.length > 0) {
    for (const cut of line.subCuts) {
      const cutSpk = (cut.speakerKo || '').trim();
      if (
        cutSpk &&
        (cutSpk === preferredSpeakerName ||
          cutSpk.includes(preferredSpeakerName) ||
          preferredSpeakerName.includes(cutSpk))
      ) {
        const srcText = cut.dialogueKo || cut.narrationKo || '';
        const matches = srcText.match(/[“"][^”"]+[”"]/g);
        if (matches && matches.length > 0) {
          return { text: condenseDialogueQuote(matches[0], 75), isNarration: false };
        }
      }
    }
  }

  // 2. 이미 정제된 dialogueQuoteKo가 있는 경우: 복수 대사가 병합되어 있어도 첫 번째 대표 대사 1개만 컴팩트 압축
  if (line.dialogueQuoteKo && line.dialogueQuoteKo.trim().length > 0) {
    const raw = line.dialogueQuoteKo.trim();
    const matches = raw.match(/[“"][^”"]+[”"]/g);
    if (matches && matches.length > 0) {
      return { text: condenseDialogueQuote(matches[0], 75), isNarration: false };
    }
    return { text: condenseDialogueQuote(raw, 75), isNarration: false };
  }

  // 3. subCuts에서 큰따옴표 대사 탐색 (첫 번째 대사 1개만)
  if (line.subCuts && line.subCuts.length > 0) {
    for (const cut of line.subCuts) {
      if (cut.dialogueKo && cut.dialogueKo.trim()) {
        const matches = cut.dialogueKo.match(/[“"][^”"]+[”"]/g);
        if (matches && matches.length > 0) {
          return { text: condenseDialogueQuote(matches[0], 75), isNarration: false };
        }
      }
    }
  }

  // 4. line.text에서 큰따옴표 대사 탐색 (첫 번째 대사 1개만)
  if (line.text && line.text.trim()) {
    const matches = line.text.match(/[“"][^”"]+[”"]/g);
    if (matches && matches.length > 0) {
      return { text: condenseDialogueQuote(matches[0], 75), isNarration: false };
    }

    // 5. 큰따옴표 대사가 전혀 없는 순수 지문/내레이션 문단:
    // 장황한 소설 문단 전체 대신, 1문장(최대 65자 이내)의 핵심 정황만 간결하게 표시
    const sentences = line.text
      .replace(/\n+/g, ' ')
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const firstSentence = sentences.length > 0 ? sentences[0] + '.' : line.text.slice(0, 60) + '...';
    const cleanSentence = firstSentence.length > 65 ? firstSentence.slice(0, 62) + '...' : firstSentence;
    return { text: cleanSentence, isNarration: true };
  }

  return { text: isKo ? '“서약은 얼어붙지 않는다.”' : '"An oath never freezes."', isNarration: false };
}

/**
 * Splits dialogue text into compact 1~3 line chunks (max 50~55 chars per part).
 * If the dialogue is long, it breaks into 2 sequential parts for comfortable reading.
 */
export function splitDialogueIntoParts(fullText: string, maxPartLen: number = 55): string[] {
  const clean = fullText.trim();
  if (!clean) return [''];

  const hasKoreanQuotes = clean.startsWith('“') && clean.endsWith('”');
  const hasDoubleQuotes = clean.startsWith('"') && clean.endsWith('"');
  const quoteCharL = hasKoreanQuotes ? '“' : hasDoubleQuotes ? '"' : '';
  const quoteCharR = hasKoreanQuotes ? '”' : hasDoubleQuotes ? '"' : '';

  let inner = clean;
  if (quoteCharL && quoteCharR) {
    inner = clean.slice(1, -1).trim();
  }

  // Short enough: return single part
  if (inner.length <= maxPartLen) {
    return [clean];
  }

  // Split by sentence boundaries (. ! ?)
  const sentences = inner
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length >= 2) {
    const part1 = sentences[0];
    let part2 = sentences.slice(1).join(' ');
    if (part2.length > maxPartLen + 15) {
      const sub = part2
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      part2 = sub[0];
    }
    const res1 = quoteCharL ? `${quoteCharL}${part1}${quoteCharR}` : part1;
    const res2 = quoteCharL ? `${quoteCharL}${part2}${quoteCharR}` : part2;
    return [res1, res2];
  }

  // Single long sentence: split near comma or whitespace around middle
  const mid = Math.floor(inner.length / 2);
  let splitIdx = -1;
  for (let i = Math.max(20, mid - 15); i < Math.min(inner.length - 10, mid + 15); i++) {
    if (inner[i] === ',' || inner[i] === '，') {
      splitIdx = i + 1;
      break;
    }
  }
  if (splitIdx === -1) {
    for (let i = Math.max(15, mid - 15); i < Math.min(inner.length - 10, mid + 15); i++) {
      if (inner[i] === ' ') {
        splitIdx = i;
        break;
      }
    }
  }
  if (splitIdx === -1) {
    splitIdx = mid;
  }

  const p1 = inner.slice(0, splitIdx).trim();
  const p2 = inner.slice(splitIdx).trim();
  const res1 = quoteCharL ? `${quoteCharL}${p1}${quoteCharR}` : p1;
  const res2 = quoteCharL ? `${quoteCharL}${p2}${quoteCharR}` : p2;
  return [res1, res2];
}

/**
 * Returns dialogue parts for the current active line
 */
export function getCurrentDialogueParts(): { parts: string[]; currentPart: string; isNarration: boolean } {
  const lines = getCurrentDialogueLines();
  const currentLine = lines[playRpgState.currentDialogueLineIdx];
  if (!currentLine) {
    return { parts: ['“서약은 얼어붙지 않는다.”'], currentPart: '“서약은 얼어붙지 않는다.”', isNarration: false };
  }

  const activeSpeaker = resolveActiveDialogueSpeaker(currentLine);
  const dialogueData = extractDialogueText(currentLine, activeSpeaker.name);
  const parts = splitDialogueIntoParts(dialogueData.text);
  const clampedIdx = Math.max(0, Math.min(parts.length - 1, playRpgState.currentDialoguePartIdx));
  return {
    parts,
    currentPart: parts[clampedIdx] || parts[0],
    isNarration: dialogueData.isNarration,
  };
}

let dialogueTypingTimer: any = null;

/**
 * Starts typewriter effect with Animal Crossing micro-synth chatter
 */
export function startDialogueTyping(fullText: string, onTick?: (displayed: string, isDone: boolean) => void): void {
  if (typeof window === 'undefined') return;

  if (dialogueTypingTimer) {
    clearInterval(dialogueTypingTimer);
    dialogueTypingTimer = null;
  }

  playRpgState.dialogueTypingComplete = false;
  playRpgState.dialogueDisplayedLength = 0;
  playRpgState.dialogueLineStartedAt = Date.now();

  const totalLen = fullText.length;
  if (totalLen <= 0) {
    playRpgState.dialogueTypingComplete = true;
    return;
  }

  let curLen = 0;
  // 35ms per character creates the classic Animal Crossing / Pokemon typing cadence
  dialogueTypingTimer = setInterval(() => {
    curLen++;
    playRpgState.dialogueDisplayedLength = curLen;

    const char = fullText[curLen - 1];
    // Play Animal Crossing cute pitch-varied chirp for non-whitespace characters
    if (char && char.trim().length > 0) {
      audioManager.playDialogueChirp(char);
    }

    // Direct DOM sync for smooth zero-lag animation
    const textEl = document.getElementById('dialogue-text-content');
    if (textEl) {
      const isDone = curLen >= totalLen;
      textEl.textContent = fullText.slice(0, curLen);
      const cursorEl = document.getElementById('dialogue-typing-cursor');
      if (cursorEl) {
        cursorEl.style.display = isDone ? 'none' : 'inline-block';
      }
      const indicatorEl = document.getElementById('dialogue-next-indicator');
      if (indicatorEl) {
        indicatorEl.style.opacity = isDone ? '1' : '0.2';
      }
    }

    if (onTick) {
      onTick(fullText.slice(0, curLen), curLen >= totalLen);
    }

    if (curLen >= totalLen) {
      if (dialogueTypingTimer) {
        clearInterval(dialogueTypingTimer);
        dialogueTypingTimer = null;
      }
      playRpgState.dialogueTypingComplete = true;
      playRpgState.lastAutoStepAt = Date.now();
    }
  }, 35);
}

/**
 * Immediately skips typewriter animation to complete the text on user tap
 */
export function skipDialogueTyping(fullText: string): void {
  if (dialogueTypingTimer) {
    clearInterval(dialogueTypingTimer);
    dialogueTypingTimer = null;
  }
  playRpgState.dialogueDisplayedLength = fullText.length;
  playRpgState.dialogueTypingComplete = true;
  playRpgState.lastAutoStepAt = Date.now();

  const textEl = document.getElementById('dialogue-text-content');
  if (textEl) {
    textEl.textContent = fullText;
  }
  const cursorEl = document.getElementById('dialogue-typing-cursor');
  if (cursorEl) {
    cursorEl.style.display = 'none';
  }
  const indicatorEl = document.getElementById('dialogue-next-indicator');
  if (indicatorEl) {
    indicatorEl.style.opacity = '1';
  }
}

/**
 * Advances to next dialogue part or advances to next script line / battle.
 * If currently typing, instantly completes typing first (skip typing).
 */
export function advanceDialoguePartOrLine(): { completed: boolean; readyForBattle: boolean } {
  const { parts, currentPart } = getCurrentDialogueParts();

  // 1. If currently typing: skip typing to show full text immediately
  if (!playRpgState.dialogueTypingComplete) {
    skipDialogueTyping(currentPart);
    audioManager.playClickTick();
    return { completed: false, readyForBattle: false };
  }

  // 2. If multi-part dialogue has next part available: advance part!
  if (playRpgState.currentDialoguePartIdx < parts.length - 1) {
    playRpgState.currentDialoguePartIdx += 1;
    playRpgState.dialogueLineStartedAt = Date.now();
    playRpgState.lastAutoStepAt = Date.now();
    const nextPart = parts[playRpgState.currentDialoguePartIdx];
    startDialogueTyping(nextPart);
    audioManager.playClickTick();
    return { completed: false, readyForBattle: false };
  }

  // 3. Current line completed: advance to next dialogue line or battle!
  playRpgState.currentDialoguePartIdx = 0;
  audioManager.playClickTick();
  const res = advanceDialogue();
  if (!res.completed && !res.readyForBattle) {
    const nextLineData = getCurrentDialogueParts();
    startDialogueTyping(nextLineData.currentPart);
  }
  return res;
}

/**
 * Moves back to previous dialogue part or previous script line.
 */
export function prevDialoguePartOrLine(): { moved: boolean; lineIndex: number } {
  if (playRpgState.currentDialoguePartIdx > 0) {
    playRpgState.currentDialoguePartIdx -= 1;
    playRpgState.dialogueLineStartedAt = Date.now();
    playRpgState.lastAutoStepAt = Date.now();
    const { currentPart } = getCurrentDialogueParts();
    startDialogueTyping(currentPart);
    audioManager.playClickTick();
    return { moved: true, lineIndex: playRpgState.currentDialogueLineIdx };
  }

  // If at part 0: go back to previous line
  playRpgState.currentDialoguePartIdx = 0;
  audioManager.playClickTick();
  const res = prevDialogue();
  if (res.moved) {
    const { currentPart } = getCurrentDialogueParts();
    startDialogueTyping(currentPart);
  }
  return res;
}

export interface DialogueSpeakerInfo {
  name: string;
  cardId: number;
  role: string;
  isActive: boolean;
}

export interface ResolvedDialogueSpeakers {
  left: DialogueSpeakerInfo;
  right: DialogueSpeakerInfo;
  activeSide: 'left' | 'right';
  speakerTitle: string;
}

function findSpeakerInfoInLine(
  line: KadanRpgNovelScriptLine,
  prevCardId: number | null
): { cardId: number; name: string; role: string } {
  const isKo = isKoreanLanguage();
  const chars = line.sceneCharacters || [];

  const resolveByName = (rawName: string): { cardId: number; name: string; role: string } | null => {
    const clean = rawName.trim();
    if (!clean || clean === '내레이션' || clean === 'Narration') return null;
    const foundInScene = chars.find(
      (c) => c.nameKo === clean || clean.includes(c.nameKo) || c.nameKo.includes(clean)
    );
    if (foundInScene) {
      const cid = foundInScene.cardId || 41;
      return {
        cardId: cid,
        name: isKo ? foundInScene.nameKo : getLocalizedCharacterName(cid),
        role: isKo ? foundInScene.roleKo || '수호자' : foundInScene.roleEn || tr('수호자', 'Guardian', '守護者'),
      };
    }
    for (let id = 1; id <= 110; id++) {
      const card = CARD_DATABASE[id];
      if (card && card.title && (card.title === clean || clean.includes(card.title))) {
        return {
          cardId: id,
          name: isKo ? card.title : getLocalizedCharacterName(id),
          role: isKo ? (card.desc ? card.desc.slice(0, 36) : '수호자') : tr('수호자', 'Guardian', '守護者'),
        };
      }
    }
    return null;
  };

  // 1. subCuts에서 실제 발화 캐릭터 탐색
  const cutSpeakers: { cardId: number; name: string; role: string }[] = [];
  if (line.subCuts && line.subCuts.length > 0) {
    for (const cut of line.subCuts) {
      if (cut.speakerKo) {
        const resolved = resolveByName(cut.speakerKo);
        if (resolved && !cutSpeakers.some((s) => s.cardId === resolved.cardId)) {
          cutSpeakers.push(resolved);
        }
      }
    }
  }

  if (cutSpeakers.length > 0) {
    if (prevCardId !== null && cutSpeakers.length > 1 && cutSpeakers[0].cardId === prevCardId) {
      return cutSpeakers[1];
    }
    return cutSpeakers[0];
  }

  // 2. line.name에 명시된 캐릭터 확인 (단, 직전 화자와 다를 때 우선)
  const rawLineName = (line.name || '').split('·').pop()?.trim() || '';
  const fromLineName = resolveByName(rawLineName);
  if (fromLineName && fromLineName.cardId !== prevCardId) {
    return fromLineName;
  }

  // 3. sceneCharacters에서 직전 화자와 다른 등장인물 우선 선택하여 자연스러운 교차 유도
  if (chars.length > 0) {
    if (prevCardId !== null && chars.length > 1) {
      const diffChar = chars.find((c) => c.cardId !== prevCardId);
      if (diffChar) {
        const cid = diffChar.cardId || 41;
        return {
          cardId: cid,
          name: isKo ? diffChar.nameKo : getLocalizedCharacterName(cid),
          role: isKo ? diffChar.roleKo || '수호자' : diffChar.roleEn || tr('수호자', 'Guardian', '守護者'),
        };
      }
    }
    const firstCid = chars[0].cardId || 41;
    return {
      cardId: firstCid,
      name: isKo ? chars[0].nameKo : getLocalizedCharacterName(firstCid),
      role: isKo ? chars[0].roleKo || '수호자' : chars[0].roleEn || tr('수호자', 'Guardian', '守護者'),
    };
  }

  if (fromLineName) {
    return fromLineName;
  }

  const fallbackCid = line.cardId || 41;
  return {
    cardId: fallbackCid,
    name: isKo ? rawLineName || '카단' : getLocalizedCharacterName(fallbackCid),
    role: tr('성기사단의 후예', 'Descendant of the Holy Order', '聖騎士団の末裔'),
  };
}

/**
 * Resolve active speaking character and alternate left/right side whenever character changes
 */
export function resolveDialogueSpeakers(line: KadanRpgNovelScriptLine): ResolvedDialogueSpeakers {
  const isKo = isKoreanLanguage();
  const allLines = getCurrentDialogueLines();
  const idxInAll = allLines.indexOf(line);
  const targetIdx = idxInAll >= 0 ? idxInAll : playRpgState.currentDialogueLineIdx;

  let activeSide: 'left' | 'right' = 'left';
  let prevCardId: number | null = null;
  const initCid = line.cardId || 41;
  let currentSpeaker = {
    cardId: initCid,
    name: isKo ? (line.name || '카단').split('·').pop()?.trim() || '카단' : getLocalizedCharacterName(initCid),
    role: tr('성기사단의 후예', 'Descendant of the Holy Order', '聖騎士団の末裔'),
  };

  if (allLines.length > 0 && targetIdx >= 0 && targetIdx < allLines.length) {
    for (let i = 0; i <= targetIdx; i++) {
      const spk = findSpeakerInfoInLine(allLines[i], prevCardId);
      if (i === 0) {
        activeSide = 'left';
      } else if (spk.cardId !== prevCardId) {
        activeSide = activeSide === 'left' ? 'right' : 'left';
      }
      prevCardId = spk.cardId;
      currentSpeaker = spk;
    }
  } else {
    currentSpeaker = findSpeakerInfoInLine(line, null);
  }

  // Opposite placeholder info for backward compatibility with ResolvedDialogueSpeakers shape
  const chars = line.sceneCharacters || [];
  const otherChar = chars.find((c) => c.cardId !== currentSpeaker.cardId) || {
    cardId: currentSpeaker.cardId === 41 ? 43 : 41,
    nameKo: currentSpeaker.cardId === 41 ? '발리안' : '카단',
    nameEn: currentSpeaker.cardId === 41 ? 'Balian' : 'Kadan',
    roleKo: currentSpeaker.cardId === 41 ? '아케인 창술의 달인' : '성기사단의 후예',
    roleEn: currentSpeaker.cardId === 41 ? 'Master of the Arcane Spear' : 'Descendant of the Holy Order',
  };

  const activeInfo: DialogueSpeakerInfo = {
    name: currentSpeaker.name,
    cardId: currentSpeaker.cardId,
    role: currentSpeaker.role,
    isActive: true,
  };

  const otherCid = otherChar.cardId || 43;
  const inactiveInfo: DialogueSpeakerInfo = {
    name: isKo ? otherChar.nameKo : getLocalizedCharacterName(otherCid),
    cardId: otherCid,
    role: isKo ? otherChar.roleKo || '동료' : (otherChar as any).roleEn || tr('동료', 'Companion', '仲間'),
    isActive: false,
  };

  return {
    left: activeSide === 'left' ? activeInfo : inactiveInfo,
    right: activeSide === 'right' ? activeInfo : inactiveInfo,
    activeSide,
    speakerTitle: currentSpeaker.role || tr('수호자', 'Guardian', '守護者'),
  };
}

const loadedBustUrls = new Set<string>();
const loadingBustUrls = new Set<string>();

export const AUTO_STEP_INTERVAL_MS = 2800; // 2x slower than previous 1400ms

/**
 * Normalize image URL to clean pathname for reliable cache hit matching
 */
function normalizeImageUrl(url: string): string {
  if (!url) return '';
  return url.split('?')[0].split('#')[0];
}

/**
 * Record image URL as loaded (stores both raw URL and clean pathname)
 */
function markBustUrlLoaded(url: string): void {
  if (!url) return;
  loadedBustUrls.add(url);
  loadedBustUrls.add(normalizeImageUrl(url));
}

/**
 * Check if image URL is marked as loaded
 */
function isBustUrlLoaded(url: string): boolean {
  if (!url) return true;
  return loadedBustUrls.has(url) || loadedBustUrls.has(normalizeImageUrl(url));
}

/**
 * Get canonical versioned bust URL for a character cardId
 */
export function getCharacterBustUrl(cardId: number): string {
  const asset = getCharacterAsset(cardId);
  return asset.bustPngUrl;
}

/**
 * Preload a character's bust image and record completion so slow networks never skip ahead before image loads
 */
export function preloadCharacterBust(cardId: number): void {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return;
  const asset = getCharacterAsset(cardId);
  const url = getCharacterBustUrl(cardId);
  if (isBustUrlLoaded(url) || loadingBustUrls.has(url)) return;

  loadingBustUrls.add(url);
  const img = new Image();
  img.onload = () => {
    loadingBustUrls.delete(url);
    markBustUrlLoaded(url);
  };
  img.onerror = () => {
    const fallback = asset.seatUrl;
    if (fallback) {
      const fbImg = new Image();
      fbImg.onload = () => {
        loadingBustUrls.delete(url);
        markBustUrlLoaded(url);
      };
      fbImg.onerror = () => {
        loadingBustUrls.delete(url);
        markBustUrlLoaded(url); // even on fallback error, mark loaded so we never block game progression
      };
      fbImg.src = fallback;
    } else {
      loadingBustUrls.delete(url);
      markBustUrlLoaded(url); // prevent game blockage
    }
  };
  img.src = url;
}

/**
 * Preload current, next, and upcoming dialogue speaker bust images for the active chapter
 */
export function preloadDialogueChapterImages(): void {
  if (typeof window === 'undefined') return;
  preloadNearbyChapterBackgrounds(playRpgState.currentChapter);
  const lines = getCurrentDialogueLines();
  const curIdx = playRpgState.currentDialogueLineIdx;

  // Prioritize current and next 2 lines first
  for (let i = curIdx; i < Math.min(lines.length, curIdx + 3); i++) {
    const spk = resolveDialogueSpeakers(lines[i]);
    const active = spk.activeSide === 'left' ? spk.left : spk.right;
    preloadCharacterBust(active.cardId);
  }

  // Also preload remaining lines and episode opponent deck
  for (let i = 0; i < lines.length; i++) {
    const spk = resolveDialogueSpeakers(lines[i]);
    const active = spk.activeSide === 'left' ? spk.left : spk.right;
    preloadCharacterBust(active.cardId);
  }
  const epDeck = getEpisodeActualOpponentDeck(playRpgState.currentChapter);
  for (const cid of epDeck.cardIds) {
    preloadCharacterBust(cid);
  }
}

/**
 * Check if the dialogue is ready to advance in auto-play mode.
 * Guaranteed:
 *   - NEVER hangs: hard safety deadline (3200ms) forces progression even on slow/broken network
 *   - Smooth experience: waits for current speaker image to load up to normal interval
 *   - Battle transition: immediately ready when reaching the final dialogue line
 */
export function isDialogueReadyToAdvance(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true;
  }

  // 1. Hard Safety Watchdog: If 3500ms have elapsed on this dialogue line, NEVER hang!
  const now = Date.now();
  const elapsed = now - (playRpgState.dialogueLineStartedAt || now);
  if (elapsed >= 3500) {
    return true;
  }

  // 1-1. If typewriter animation is still active, wait for typing to finish (unless 3500ms watchdog fires)
  if (!playRpgState.dialogueTypingComplete) {
    return false;
  }

  // 1-2. Minimum reading time after typing finishes
  if (elapsed < 1500) {
    return false;
  }

  // 2. Verify current speaker bust image in the live DOM
  // If complete (whether loaded or errored out), treat as ready
  const domImg = document.getElementById('dialogue-speaker-bust-img') as HTMLImageElement | null;
  if (domImg) {
    if (!domImg.complete) {
      return false; // currently downloading
    }
  }

  const lines = getCurrentDialogueLines();
  const curIdx = playRpgState.currentDialogueLineIdx;
  const curLine = lines[curIdx];

  // If choice prompt exists, choices don't need next image gating
  if (curLine?.choices && curLine.choices.length > 0) {
    return true;
  }

  if (curLine) {
    const curSpk = resolveDialogueSpeakers(curLine);
    const curActive = curSpk.activeSide === 'left' ? curSpk.left : curSpk.right;
    const curUrl = getCharacterBustUrl(curActive.cardId);
    if (domImg && domImg.complete) {
      markBustUrlLoaded(curUrl);
    } else if (!isBustUrlLoaded(curUrl)) {
      preloadCharacterBust(curActive.cardId);
      return false;
    }
  }

  // 3. If this is the final line before battle, do NOT block dialogue advance!
  // Battle state itself has full 0%~100% pre-caching progress bar.
  if (curIdx >= lines.length - 1) {
    return true;
  }

  // 4. Verify NEXT line's speaker image is cached/loading
  const nextLine = lines[curIdx + 1];
  if (nextLine) {
    const nextSpk = resolveDialogueSpeakers(nextLine);
    const nextActive = nextSpk.activeSide === 'left' ? nextSpk.left : nextSpk.right;
    const nextUrl = getCharacterBustUrl(nextActive.cardId);
    if (!isBustUrlLoaded(nextUrl)) {
      preloadCharacterBust(nextActive.cardId);
      // If we've already waited at least 1800ms, don't hold the user back further
      if (elapsed >= 1800) {
        return true;
      }
      return false;
    }
  }

  return true;
}

/**
 * Trigger dialogue cutscene overlay
 */
export function triggerDialogue(event: KadanRpgEvent): void {
  playRpgState.subState = 'dialogue';
  playRpgState.currentDialogueLineIdx = 0;
  playRpgState.currentDialoguePartIdx = 0;
  playRpgState.dialogueTypingComplete = false;
  playRpgState.selectedChoiceIdx = null;
  playRpgState.choiceTimerSec = playRpgState.autoMode ? 3.0 : 5.0;
  playRpgState.activeAmbush = null;
  playRpgState.lastAutoStepAt = Date.now();
  playRpgState.dialogueLineStartedAt = Date.now();
  preloadDialogueChapterImages();
  setTimeout(() => {
    const { currentPart } = getCurrentDialogueParts();
    startDialogueTyping(currentPart);
  }, 60);
}

/**
 * Close dialogue modal and stop active auto-play
 */
export function closeDialogueAndStopPlay(): void {
  if (reincarnationIntervalId) {
    clearInterval(reincarnationIntervalId);
    reincarnationIntervalId = null;
  }
  if (dialogueTypingTimer) {
    clearInterval(dialogueTypingTimer);
    dialogueTypingTimer = null;
  }
  playRpgState.autoMode = false;
  playRpgState.subState = 'map';
  playRpgState.activeAmbush = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hero_kadan_rpg_auto_mode', 'false');
    }
  } catch {}
  const region = getCurrentRegion();
  playRpgState.heroTile = { ...region.startTile };
  notifyPlayStateUpdated();
}

/**
 * Get active script lines for current chapter
 */
export function getCurrentDialogueLines(): KadanRpgNovelScriptLine[] {
  const script = KADAN_RPG_NOVEL_SCRIPTS[playRpgState.currentChapter];
  if (Array.isArray(script)) return script;
  if (script && (script as any).lines && Array.isArray((script as any).lines)) {
    return (script as any).lines;
  }
  return [];
}

/**
 * Go back to previous dialogue line
 */
export function prevDialogue(): { moved: boolean; lineIndex: number } {
  if (playRpgState.currentDialogueLineIdx > 0) {
    playRpgState.currentDialogueLineIdx -= 1;
    playRpgState.currentDialoguePartIdx = 0;
    playRpgState.selectedChoiceIdx = null;
    playRpgState.choiceTimerSec = playRpgState.autoMode ? 3.0 : 5.0;
    playRpgState.lastAutoStepAt = Date.now();
    playRpgState.dialogueLineStartedAt = Date.now();
    preloadDialogueChapterImages();
    return { moved: true, lineIndex: playRpgState.currentDialogueLineIdx };
  }
  return { moved: false, lineIndex: playRpgState.currentDialogueLineIdx };
}

/**
 * Advance dialogue by one line or transition into battle
 */
export function advanceDialogue(): { completed: boolean; readyForBattle: boolean } {
  const lines = getCurrentDialogueLines();
  if (playRpgState.currentDialogueLineIdx < lines.length - 1) {
    playRpgState.currentDialogueLineIdx += 1;
    playRpgState.currentDialoguePartIdx = 0;
    playRpgState.selectedChoiceIdx = null;
    playRpgState.choiceTimerSec = playRpgState.autoMode ? 3.0 : 5.0;
    playRpgState.lastAutoStepAt = Date.now();
    playRpgState.dialogueLineStartedAt = Date.now();
    preloadDialogueChapterImages();
    return { completed: false, readyForBattle: false };
  }

  // Dialogue completed: transition to battle!
  initBattle();
  playRpgState.lastAutoStepAt = Date.now();
  return { completed: true, readyForBattle: true };
}

/**
 * Select a protagonist choice prompt
 */
export function selectDialogueChoice(choiceIndex: number): void {
  const lines = getCurrentDialogueLines();
  const currentLine = lines[playRpgState.currentDialogueLineIdx];
  if (!currentLine?.choices || !currentLine.choices[choiceIndex]) return;

  const choice: KadanRpgDialogueChoice = currentLine.choices[choiceIndex];
  playRpgState.selectedChoiceIdx = choiceIndex;

  if (choice.bonusType === 'sns' && choice.bonusValue) {
    try {
      const cur = parseInt(localStorage.getItem('hero_sns') || '1000', 10);
      localStorage.setItem('hero_sns', String(cur + choice.bonusValue));
    } catch {}
  } else if (choice.bonusType === 'buff') {
    playRpgState.activeBuff = choice.attitude || '성진호흡 각성';
  }

  // Automatically advance to next dialogue line
  advanceDialogue();
}

/**
 * Extract the 5 actual appearing card characters for a given episode (1..40)
 * strictly from KADAN_RPG_NOVEL_SCRIPTS[chapter].
 */
export function getEpisodeActualOpponentDeck(chapter: number): {
  cardIds: number[];
  leaderName: string;
  deckNames: string[];
} {
  const clampedChapter = Math.max(1, Math.min(40, Math.floor(chapter || 1)));
  const rawScript = KADAN_RPG_NOVEL_SCRIPTS[clampedChapter];
  const lines: KadanRpgNovelScriptLine[] = Array.isArray(rawScript)
    ? rawScript
    : rawScript && Array.isArray((rawScript as any).lines)
    ? (rawScript as any).lines
    : [];

  const nonKadanIds: number[] = [];
  const allAppearingIds: number[] = [];

  const registerId = (id: number | undefined) => {
    if (!id || !Number.isInteger(id) || id < 1 || id > 110 || !CARD_DATABASE[id]) return;
    if (!allAppearingIds.includes(id)) {
      allAppearingIds.push(id);
    }
    if (id !== 41 && !nonKadanIds.includes(id)) {
      nonKadanIds.push(id);
    }
  };

  for (const line of lines) {
    registerId(line.cardId);
    if (line.sceneCharacters && Array.isArray(line.sceneCharacters)) {
      for (const sc of line.sceneCharacters) {
        registerId(sc.cardId);
      }
    }
  }

  // Fallback to encounter definition if script lines are empty
  if (nonKadanIds.length < 5) {
    const chEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === clampedChapter);
    if (chEvent) {
      const enc = getDynamicKadanEncounter(chEvent, 0);
      for (const cid of enc.opponentCardIds) {
        registerId(cid);
      }
    }
  }

  const selected: number[] = [...nonKadanIds.slice(0, 5)];
  for (const id of allAppearingIds) {
    if (selected.length >= 5) break;
    if (!selected.includes(id)) selected.push(id);
  }
  while (selected.length < 5) {
    const fallbackId = allAppearingIds[selected.length % Math.max(1, allAppearingIds.length)] || 50;
    selected.push(fallbackId);
  }

  const deckNames = selected.map((id) => getLocalizedCharacterName(id) || CARD_DATABASE[id]?.title || `#${id}`);
  const leaderName = deckNames[0] || tr('수호자', 'Guardian', '守護者');

  return {
    cardIds: selected.slice(0, 5),
    leaderName,
    deckNames,
  };
}

/**
 * Compute per-direction stat bonus for opponent cards based on reincarnation level.
 * By user decree: Reincarnations 1 through 10 are tuned for easy, triumphant progression (+0 opponent buff).
 * Beyond Reincarnation 10, progressive challenge starts (+1 per cycle above 10).
 */
export function getOpponentRebirthStatBonus(
  rebirthLevel: number = playRpgState.reincarnationLevel,
  _chapter: number = playRpgState.currentChapter
): number {
  if (!rebirthLevel || rebirthLevel <= 10) {
    return 0;
  }
  return rebirthLevel - 10;
}

/**
 * In-memory decoded image cache to prevent browser re-decoding / flickering.
 */
const BATTLE_IMAGE_MEMORY_CACHE = new Map<string, HTMLImageElement>();

/**
 * Preload all hero card visual assets for the upcoming battle into browser & GPU memory.
 * Provides real-time percentage progress (0% ~ 100%) for smooth loading bar display.
 */
export async function preloadBattleImages(
  cardIds: number[],
  onProgress?: (progress: number, heroName: string) => void
): Promise<void> {
  if (typeof window === 'undefined') return;

  const uniqueIds = Array.from(new Set(cardIds));
  const total = uniqueIds.length;
  let loaded = 0;

  const loadSingle = async (cardId: number): Promise<void> => {
    const card = CARD_DATABASE[cardId];
    const asset = getCharacterAsset(cardId);
    const bustUrl = asset.bustPngUrl;
    const fallbackUrl = asset.cutoutUrl || `/seat/${card?.englishName || card?.title || 'Devastator'}.png`;

    const heroName = getLocalizedCharacterName(cardId) || card?.title || `Hero #${cardId}`;

    if (BATTLE_IMAGE_MEMORY_CACHE.has(bustUrl)) {
      loaded++;
      if (onProgress) onProgress(Math.min(100, Math.round((loaded / total) * 100)), heroName);
      return;
    }

    try {
      const img = new Image();
      img.src = bustUrl;
      if ('decode' in img) {
        await Promise.race([
          img.decode(),
          new Promise((r) => setTimeout(r, 800)),
        ]);
      } else {
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 800);
        });
      }
      BATTLE_IMAGE_MEMORY_CACHE.set(bustUrl, img);
    } catch {
      try {
        const fImg = new Image();
        fImg.src = fallbackUrl;
        if ('decode' in fImg) await fImg.decode();
        BATTLE_IMAGE_MEMORY_CACHE.set(bustUrl, fImg);
      } catch {}
    }

    loaded++;
    if (onProgress) {
      const progress = Math.min(100, Math.round((loaded / total) * 100));
      onProgress(progress, heroName);
    }
  };

  // Run in parallel with a hard safety deadline of 1800ms
  await Promise.race([
    Promise.all(uniqueIds.map((cid) => loadSingle(cid))),
    new Promise((r) => setTimeout(r, 1800)),
  ]);
}

function setupBattleStateInternal(
  playerHand: number[],
  opponentHand: number[],
  customOpponentName?: string
): void {
  playRpgState.battleBoard = Array(9).fill(null);
  playRpgState.battleWinner = null;
  playRpgState.selectedHandIndex = 0;
  playRpgState.turn = 'player';
  playRpgState.lastPlacedSlot = null;
  playRpgState.flippedSlots = [];
  playRpgState.playerHand = [...playerHand];
  playRpgState.opponentHand = [...opponentHand];

  const playerAura = playRpgState.reincarnationLevel;
  playRpgState.battleMessage =
    playerAura > 0
      ? tr(
          `✨ [환생 ${playerAura}회차] 영웅 전원 스탯 +${playerAura} 오라 발동! 카드를 선택해 빈 슬롯에 배치하세요.`,
          `✨ [Rebirth ${playerAura}] Hero Aura +${playerAura} active on all cards! Tap an empty slot to place.`,
          `✨ [転生${playerAura}周目] 英雄全員ステータス+${playerAura}オーラ発動！空きスロットに配置してください。`
        )
      : tr(
          '카드를 선택한 후 3x3 전장의 빈 슬롯을 터치하세요.',
          'Select a card from your hand, then tap an empty slot on the 3x3 board.',
          '手札からカードを選択し、3x3盤面の空きスロットをタップしてください。'
        );

  if (customOpponentName) {
    playRpgState.opponentName = customOpponentName;
  } else {
    const chapLabel = formatChapterLabel(playRpgState.currentChapter, playRpgState.reincarnationLevel);
    const epDeck = getEpisodeActualOpponentDeck(playRpgState.currentChapter);
    const secondName = epDeck.deckNames[1] ? `·${epDeck.deckNames[1]}` : '';
    playRpgState.opponentName = tr(
      `${chapLabel} 등장인물 (${epDeck.leaderName}${secondName} 외)`,
      `${chapLabel} Cast (${epDeck.leaderName}${secondName} & others)`,
      `${chapLabel} 登場人物 (${epDeck.leaderName}${secondName} 他)`
    );
  }

  // Pre-calculate tactical AI recommendation for opening move
  playRpgState.aiSuggestedMove = findBestPlayerTacticalMove();
  if (playRpgState.aiSuggestedMove) {
    playRpgState.selectedHandIndex = playRpgState.aiSuggestedMove.handIdx;
  }
}

/**
 * Initialize 3x3 Tactical Battle with Visual Preloading Progress Bar
 */
export function initBattle(customOpponentCards?: number[], customOpponentName?: string): void {
  playRpgState.subState = 'battle';

  // Gather hands to preload
  const activeDeck = (cardNurtureStore as any).getDeckCardIds
    ? (cardNurtureStore as any).getDeckCardIds()
    : [1, 2, 3, 4, 5];
  const playerHand = activeDeck.length === 5 ? [...activeDeck] : [1, 2, 3, 4, 5];

  let opponentHand: number[];
  if (customOpponentCards && customOpponentCards.length >= 5) {
    opponentHand = customOpponentCards.slice(0, 5);
  } else {
    const epDeck = getEpisodeActualOpponentDeck(playRpgState.currentChapter);
    opponentHand = [...epDeck.cardIds];
  }

  // Activate preloading screen with progress bar
  playRpgState.battleLoading = true;
  playRpgState.battleLoadingProgress = 0;
  playRpgState.battleLoadingCardName = tr('영웅 카드 이미지 사전 캐싱 중...', 'Preloading Hero Assets...', 'カード画像事前読み込み中...');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hero_rpg_board_updated'));
  }

  preloadBattleImages([...playerHand, ...opponentHand], (prog, heroName) => {
    playRpgState.battleLoadingProgress = prog;
    playRpgState.battleLoadingCardName = heroName;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hero_rpg_board_updated'));
    }
  }).then(() => {
    playRpgState.battleLoading = false;
    setupBattleStateInternal(playerHand, opponentHand, customOpponentName);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hero_rpg_board_updated'));
    }
  }).catch(() => {
    playRpgState.battleLoading = false;
    setupBattleStateInternal(playerHand, opponentHand, customOpponentName);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hero_rpg_board_updated'));
    }
  });
}

/**
 * Helper to get 4-way card stats [top, right, bottom, left]
 */
function getCardCombatStats(
  cardId: number,
  owner: 'player' | 'opponent' = 'player'
): [number, number, number, number] {
  const card = CARD_DATABASE[cardId];
  const rebirthLevel = playRpgState.reincarnationLevel || 0;

  if (owner === 'opponent') {
    const chapter = playRpgState.currentChapter || 1;
    const rawTop = card?.top || 3;
    const rawRight = card?.right || 3;
    const rawBottom = card?.bottom || 3;
    const rawLeft = card?.left || 3;

    // Story Chapter progression cap:
    // In Reincarnations 1..10, cap starts at 2 (Ch 1..10) and gently rises to 5 (Ch 40)
    // Ensures opponents are effortlessly defeated in Reincarnations 1..10
    const chapterClamped = Math.max(1, Math.min(40, chapter));
    const isEasyReincarnation = rebirthLevel <= 10;
    const chapterCap = isEasyReincarnation
      ? 2 + Math.floor((chapterClamped - 1) / 10) // Ch1..10: 2, Ch11..20: 3, Ch21..30: 4, Ch31..40: 5
      : 3 + Math.floor((chapterClamped - 1) / 5);

    const rebirthBonus = getOpponentRebirthStatBonus(rebirthLevel, chapter);

    return [
      Math.max(1, Math.min(rawTop, chapterCap) + rebirthBonus),
      Math.max(1, Math.min(rawRight, chapterCap) + rebirthBonus),
      Math.max(1, Math.min(rawBottom, chapterCap) + rebirthBonus),
      Math.max(1, Math.min(rawLeft, chapterCap) + rebirthBonus),
    ];
  }

  // Player cards: Base + Level bonuses + Reincarnation Hero Aura (+1 per rebirth level)
  // Ensures triumphant player progression through Reincarnations 1..10
  const nurture = (cardNurtureStore as any).getCard(cardId);
  const bonus = nurture?.bonusStats || { top: 0, right: 0, bottom: 0, left: 0 };
  const playerRebirthAura = rebirthLevel;

  const top = (card?.top || 2) + bonus.top + playerRebirthAura;
  const right = (card?.right || 2) + bonus.right + playerRebirthAura;
  const bottom = (card?.bottom || 2) + bonus.bottom + playerRebirthAura;
  const left = (card?.left || 2) + bonus.left + playerRebirthAura;

  return [top, right, bottom, left];
}

/**
 * Play a card from hand to a 3x3 board slot
 */
export function playCardToSlot(
  handIdx: number,
  slotIdx: number,
  owner: 'player' | 'opponent' = 'player'
): { success: boolean; completed: boolean } {
  if (slotIdx < 0 || slotIdx > 8) return { success: false, completed: false };

  // Guard: player cannot place cards during opponent's turn
  if (owner === 'player' && playRpgState.turn !== 'player') {
    return { success: false, completed: false };
  }

  if (playRpgState.battleBoard[slotIdx] !== null) {
    playRpgState.battleMessage = tr(
      '이미 카드가 배치된 슬롯입니다.',
      'This slot already has a card placed.',
      'すでにカードが配置されているスロットです。'
    );
    return { success: false, completed: false };
  }

  const hand = owner === 'player' ? playRpgState.playerHand : playRpgState.opponentHand;
  if (!hand[handIdx]) return { success: false, completed: false };

  const cardId = hand[handIdx];
  const stats = getCardCombatStats(cardId, owner);
  const card = CARD_DATABASE[cardId];

  // Place card
  playRpgState.battleBoard[slotIdx] = {
    cardId,
    owner,
    stats,
    name: getLocalizedCharacterName(cardId) || card?.title || `Hero ${cardId}`,
  };
  playRpgState.lastPlacedSlot = slotIdx;
  playRpgState.flippedSlots = [];

  // Play placement sound effect immediately
  audioManager.playCardPlace();

  // Remove card from hand
  hand.splice(handIdx, 1);

  // Evaluate 4-way flips
  evaluateBoardFlips(slotIdx, owner, stats);

  // Schedule visual animation cleanup after 850ms
  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      if (playRpgState.lastPlacedSlot === slotIdx) {
        playRpgState.lastPlacedSlot = null;
      }
      playRpgState.flippedSlots = [];
      window.dispatchEvent(new CustomEvent('hero_rpg_board_updated'));
    }, 850);
  }

  // Check if battle completed (all 9 slots filled or hands empty)
  const isBoardFull = playRpgState.battleBoard.every((slot) => slot !== null);
  const isHandsEmpty = playRpgState.playerHand.length === 0 && playRpgState.opponentHand.length === 0;

  if (isBoardFull || isHandsEmpty) {
    finalizeBattle();
    return { success: true, completed: true };
  }

  // Switch turn with deliberate cadence
  if (owner === 'player') {
    playRpgState.turn = 'opponent';
    playRpgState.selectedHandIndex = 0;
    playRpgState.battleMessage = tr(
      '상대방 턴: 상대가 전황을 분석하며 카드를 고르고 있습니다...',
      "Opponent's turn: Analyzing the battlefield...",
      '相手のターン：戦況を分析しながらカードを選択中...'
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hero_rpg_board_updated'));
      // Execute opponent turn after a clear 1000ms delay so both sides play with cadence
      window.setTimeout(() => {
        if (playRpgState.subState === 'battle' && !playRpgState.battleWinner && playRpgState.turn === 'opponent') {
          executeOpponentTurn();
        }
      }, 1000);
    } else {
      executeOpponentTurn();
    }
  } else {
    playRpgState.turn = 'player';
    playRpgState.aiSuggestedMove = findBestPlayerTacticalMove();
    if (playRpgState.aiSuggestedMove) {
      playRpgState.selectedHandIndex = playRpgState.aiSuggestedMove.handIdx;
    } else {
      playRpgState.selectedHandIndex = 0;
    }

    const suggestText = playRpgState.aiSuggestedMove
      ? ` 🤖 [AI 추천: ${playRpgState.aiSuggestedMove.slotIdx + 1}번 슬롯 (${playRpgState.aiSuggestedMove.reason})]`
      : '';

    playRpgState.battleMessage = tr(
      `내 턴: 출격할 카드를 선택한 후 3x3 전장의 빈 슬롯을 터치하세요.${suggestText}`,
      `Your turn: Select a card and touch an empty slot.${suggestText}`,
      `あなたのターン：カードを選択して空きスロットをタッチしてください。${suggestText}`
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hero_rpg_board_updated'));
    }
  }

  return { success: true, completed: false };
}

/**
 * Evaluate 4-direction tactical flips around placed slot
 */
function evaluateBoardFlips(
  slot: number,
  placedOwner: 'player' | 'opponent',
  placedStats: [number, number, number, number]
): void {
  const [top, right, bottom, left] = placedStats;
  const flippedList: number[] = [];

  // 1. Top neighbor: slot - 3
  if (slot >= 3) {
    const neighborIdx = slot - 3;
    const neighbor = playRpgState.battleBoard[neighborIdx];
    if (neighbor && neighbor.owner !== placedOwner && top > neighbor.stats[2]) {
      neighbor.owner = placedOwner;
      flippedList.push(neighborIdx);
    }
  }

  // 2. Bottom neighbor: slot + 3
  if (slot <= 5) {
    const neighborIdx = slot + 3;
    const neighbor = playRpgState.battleBoard[neighborIdx];
    if (neighbor && neighbor.owner !== placedOwner && bottom > neighbor.stats[0]) {
      neighbor.owner = placedOwner;
      flippedList.push(neighborIdx);
    }
  }

  // 3. Left neighbor: slot - 1 (if not col 0)
  if (slot % 3 !== 0) {
    const neighborIdx = slot - 1;
    const neighbor = playRpgState.battleBoard[neighborIdx];
    if (neighbor && neighbor.owner !== placedOwner && left > neighbor.stats[1]) {
      neighbor.owner = placedOwner;
      flippedList.push(neighborIdx);
    }
  }

  // 4. Right neighbor: slot + 1 (if not col 2)
  if (slot % 3 !== 2) {
    const neighborIdx = slot + 1;
    const neighbor = playRpgState.battleBoard[neighborIdx];
    if (neighbor && neighbor.owner !== placedOwner && right > neighbor.stats[3]) {
      neighbor.owner = placedOwner;
      flippedList.push(neighborIdx);
    }
  }

  if (flippedList.length > 0) {
    playRpgState.flippedSlots = flippedList;
    playRpgState.battleMessage = tr(
      `상대 카드 ${flippedList.length}장을 공명 역전(Flip)했습니다!`,
      `Flipped ${flippedList.length} opponent card(s)!`,
      `相手カード${flippedList.length}枚を反転（Flip）しました！`
    );
    audioManager.playCardFlip();
  }
}

/**
 * Count how many opponent cards would be flipped if `stats` were placed at `slot` by `placedOwner`
 */
function countPotentialFlips(
  slot: number,
  placedOwner: 'player' | 'opponent',
  placedStats: [number, number, number, number]
): number {
  const [top, right, bottom, left] = placedStats;
  let flips = 0;
  if (slot >= 3) {
    const n = playRpgState.battleBoard[slot - 3];
    if (n && n.owner !== placedOwner && top > n.stats[2]) flips++;
  }
  if (slot <= 5) {
    const n = playRpgState.battleBoard[slot + 3];
    if (n && n.owner !== placedOwner && bottom > n.stats[0]) flips++;
  }
  if (slot % 3 !== 0) {
    const n = playRpgState.battleBoard[slot - 1];
    if (n && n.owner !== placedOwner && left > n.stats[1]) flips++;
  }
  if (slot % 3 !== 2) {
    const n = playRpgState.battleBoard[slot + 1];
    if (n && n.owner !== placedOwner && right > n.stats[3]) flips++;
  }
  return flips;
}

/**
 * Advanced Tactical AI Engine for Player's Auto-Play & Real-Time Hinting:
 * Evaluates board state, opponent's placed cards, and opponent's remaining hand
 * to calculate the highest expected-value placement (Max Flips, Vulnerability Defense, Positional Advantage).
 */
export function findBestPlayerTacticalMove(): PlayerTacticalMove | null {
  if (playRpgState.playerHand.length === 0) return null;

  // 1. Gather all empty slots on the 3x3 board
  const emptySlots: number[] = [];
  playRpgState.battleBoard.forEach((slot, idx) => {
    if (slot === null) emptySlots.push(idx);
  });
  if (emptySlots.length === 0) return null;

  // 2. Pre-analyze opponent's remaining hand stats to calculate defensive vulnerability
  const opponentHandStats = playRpgState.opponentHand.map((cid) => getCardCombatStats(cid, 'opponent'));

  let bestMove: PlayerTacticalMove = {
    handIdx: 0,
    slotIdx: emptySlots[0],
    score: -Infinity,
    reason: '',
    flipsCount: 0,
  };

  // Positional helpers: Corners (0, 2, 6, 8), Center (4)
  const isCorner = (slot: number) => slot === 0 || slot === 2 || slot === 6 || slot === 8;
  const isCenter = (slot: number) => slot === 4;

  for (let hIdx = 0; hIdx < playRpgState.playerHand.length; hIdx++) {
    const cardId = playRpgState.playerHand[hIdx];
    const stats = getCardCombatStats(cardId, 'player'); // [top, right, bottom, left]
    const statSum = stats[0] + stats[1] + stats[2] + stats[3];

    for (const slot of emptySlots) {
      let score = 0;
      let flipCount = 0;
      let capturedStatsTotal = 0;
      const reasonList: string[] = [];

      // A. Offensive Flip Evaluation (Directly attack and flip opponent's placed cards)
      // Top neighbor: slot - 3
      if (slot >= 3) {
        const topNeighbor = playRpgState.battleBoard[slot - 3];
        if (topNeighbor && topNeighbor.owner === 'opponent') {
          if (stats[0] > topNeighbor.stats[2]) {
            flipCount++;
            capturedStatsTotal += (topNeighbor.stats[0] + topNeighbor.stats[1] + topNeighbor.stats[2] + topNeighbor.stats[3]);
          }
        }
      }
      // Bottom neighbor: slot + 3
      if (slot <= 5) {
        const bottomNeighbor = playRpgState.battleBoard[slot + 3];
        if (bottomNeighbor && bottomNeighbor.owner === 'opponent') {
          if (stats[2] > bottomNeighbor.stats[0]) {
            flipCount++;
            capturedStatsTotal += (bottomNeighbor.stats[0] + bottomNeighbor.stats[1] + bottomNeighbor.stats[2] + bottomNeighbor.stats[3]);
          }
        }
      }
      // Left neighbor: slot - 1
      if (slot % 3 !== 0) {
        const leftNeighbor = playRpgState.battleBoard[slot - 1];
        if (leftNeighbor && leftNeighbor.owner === 'opponent') {
          if (stats[3] > leftNeighbor.stats[1]) {
            flipCount++;
            capturedStatsTotal += (leftNeighbor.stats[0] + leftNeighbor.stats[1] + leftNeighbor.stats[2] + leftNeighbor.stats[3]);
          }
        }
      }
      // Right neighbor: slot + 1
      if (slot % 3 !== 2) {
        const rightNeighbor = playRpgState.battleBoard[slot + 1];
        if (rightNeighbor && rightNeighbor.owner === 'opponent') {
          if (stats[1] > rightNeighbor.stats[3]) {
            flipCount++;
            capturedStatsTotal += (rightNeighbor.stats[0] + rightNeighbor.stats[1] + rightNeighbor.stats[2] + rightNeighbor.stats[3]);
          }
        }
      }

      // Flip score bonus (Heavy priority on capturing opponent cards)
      if (flipCount > 0) {
        score += flipCount * 15000;
        score += capturedStatsTotal * 80;
        if (flipCount >= 2) {
          score += 30000; // Multi-flip combo
          reasonList.push(`더블 역전(+${flipCount})`);
        } else {
          reasonList.push(`적 카드 역전(+1)`);
        }
      }

      // B. Defensive Vulnerability Evaluation against Opponent's Remaining Deck
      // Examine each side that borders an EMPTY slot (where opponent could place next)
      // 1. Top border (slot - 3)
      if (slot < 3) {
        // Wall: 100% immune from attack
        score += (10 - stats[0]) * 150; // Efficient placement of lower stat against wall
      } else if (playRpgState.battleBoard[slot - 3] === null) {
        // Exposed to slot - 3. Check opponent hand bottom stats vs my top stat
        const threats = opponentHandStats.filter((oStats) => oStats[2] > stats[0]).length;
        if (threats === 0) {
          score += 4500; // Iron wall
        } else {
          score -= threats * 2200;
        }
      }

      // 2. Bottom border (slot + 3)
      if (slot > 5) {
        // Wall: 100% immune
        score += (10 - stats[2]) * 150;
      } else if (playRpgState.battleBoard[slot + 3] === null) {
        // Exposed to slot + 3. Check opponent hand top stats vs my bottom stat
        const threats = opponentHandStats.filter((oStats) => oStats[0] > stats[2]).length;
        if (threats === 0) {
          score += 4500;
        } else {
          score -= threats * 2200;
        }
      }

      // 3. Left border (slot - 1)
      if (slot % 3 === 0) {
        // Wall: 100% immune
        score += (10 - stats[3]) * 150;
      } else if (playRpgState.battleBoard[slot - 1] === null) {
        // Exposed to slot - 1. Check opponent hand right stats vs my left stat
        const threats = opponentHandStats.filter((oStats) => oStats[1] > stats[3]).length;
        if (threats === 0) {
          score += 4500;
        } else {
          score -= threats * 2200;
        }
      }

      // 4. Right border (slot + 1)
      if (slot % 3 === 2) {
        // Wall: 100% immune
        score += (10 - stats[1]) * 150;
      } else if (playRpgState.battleBoard[slot + 1] === null) {
        // Exposed to slot + 1. Check opponent hand left stats vs my right stat
        const threats = opponentHandStats.filter((oStats) => oStats[3] > stats[1]).length;
        if (threats === 0) {
          score += 4500;
        } else {
          score -= threats * 2200;
        }
      }

      // C. Positional Strategy
      if (isCorner(slot)) {
        score += 3500; // Corners are inherently safer
        if (flipCount === 0) reasonList.push('코너 방어 진형');
      } else if (isCenter(slot)) {
        if (flipCount === 0) {
          score -= 4000; // Do not waste center in early game without flips
        } else {
          score += 2000;
          reasonList.push('전장 중앙 제어');
        }
      } else {
        score += 1000; // Edge
      }

      // D. Card Conservation in Early Game
      if (playRpgState.playerHand.length >= 4 && flipCount === 0) {
        score -= statSum * 40;
      } else {
        score += statSum * 30;
      }

      if (score > bestMove.score) {
        bestMove = {
          handIdx: hIdx,
          slotIdx: slot,
          score,
          reason: reasonList.join(' · ') || '최적 전술 수',
          flipsCount: flipCount,
        };
      }
    }
  }

  return bestMove;
}

/**
 * Execute AI opponent turn
 */
function executeOpponentTurn(): void {
  if (playRpgState.opponentHand.length === 0) return;

  // Find empty slots
  const emptySlots: number[] = [];
  playRpgState.battleBoard.forEach((slot, idx) => {
    if (slot === null) emptySlots.push(idx);
  });

  if (emptySlots.length === 0) return;

  // AI smartness: in Reincarnations 1..10, AI plays ultra-casually (5%~15% smart move)
  // so the player can effortlessly and triumphantly progress
  const rebirthLevel = playRpgState.reincarnationLevel || 0;
  const chapter = Math.max(1, Math.min(40, playRpgState.currentChapter || 1));

  let smartMoveChance: number;
  if (rebirthLevel <= 10) {
    // Ultra-forgiving AI for Reincarnations 1..10 (5% at Ch 1 up to 15% at Ch 40)
    smartMoveChance = 0.05 + (chapter / 40) * 0.10;
  } else {
    // Gradual challenge from Reincarnation 11+
    const chapterSmart = 0.20 + (chapter / 40) * 0.40;
    const rebirthSmart = Math.min(0.25, (rebirthLevel - 10) * 0.05);
    smartMoveChance = Math.min(0.80, chapterSmart + rebirthSmart);
  }

  const isSmartMove = Math.random() < smartMoveChance;

  if (isSmartMove) {
    let bestHandIdx = 0;
    let bestSlot = emptySlots[0];
    let bestScore = -1;

    for (let hIdx = 0; hIdx < playRpgState.opponentHand.length; hIdx++) {
      const cid = playRpgState.opponentHand[hIdx];
      const stats = getCardCombatStats(cid, 'opponent');
      const statSum = stats[0] + stats[1] + stats[2] + stats[3];
      for (const sIdx of emptySlots) {
        const flips = countPotentialFlips(sIdx, 'opponent', stats);
        const score = flips * 1000 + statSum;
        if (score > bestScore) {
          bestScore = score;
          bestHandIdx = hIdx;
          bestSlot = sIdx;
        }
      }
    }
    playCardToSlot(bestHandIdx, bestSlot, 'opponent');
    return;
  }

  // Standard casual move (fallback)
  const randomSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
  const randomHandIdx = Math.floor(Math.random() * playRpgState.opponentHand.length);

  playCardToSlot(randomHandIdx, randomSlot, 'opponent');
}

/**
 * Finalize battle results and calculate scores
 */
export function finalizeBattle(): void {
  let pScore = playRpgState.playerHand.length;
  let oScore = playRpgState.opponentHand.length;

  for (const slot of playRpgState.battleBoard) {
    if (slot?.owner === 'player') pScore++;
    else if (slot?.owner === 'opponent') oScore++;
  }

  if (pScore > oScore) {
    playRpgState.battleWinner = 'player';
    playRpgState.battleMessage = tr(
      `🎉 승리! (스코어 ${pScore} : ${oScore}) +50 EXP가 활성 덱 전원에 지급되었습니다.`,
      `🎉 Victory! (Score ${pScore} : ${oScore}) +50 EXP awarded to all active deck cards.`,
      `🎉 勝利！（スコア ${pScore} : ${oScore}）編成デッキ全員に+50 EXPが付与されました。`
    );
    finishBattleAndAwardExp();
  } else if (pScore < oScore) {
    playRpgState.battleWinner = 'opponent';
    const reb = playRpgState.reincarnationLevel;
    playRpgState.battleMessage =
      reb > 0
        ? tr(
            `⚠️ 패배 (스코어 ${pScore} : ${oScore}) · 환생 ${reb}회차 강화 덱에 막혔습니다! 카드를 업그레이드하지 않으면 다음 회차로 진행할 수 없습니다.`,
            `⚠️ Defeat (Score ${pScore} : ${oScore}) · Blocked by Reincarnation ${reb} deck! Upgrade your cards to advance to the next episode.`,
            `⚠️ 敗北（スコア ${pScore} : ${oScore}）・転生${reb}周目強化デッキに阻まれました！カードを強化しないと次話へ進めません。`
          )
        : tr(
            `⚠️ 패배 (스코어 ${pScore} : ${oScore}) · 승리해야 다음 회차로 진행할 수 있습니다. 카드를 업그레이드하거나 재도전하세요.`,
            `⚠️ Defeat (Score ${pScore} : ${oScore}) · Victory is required to advance. Upgrade your cards or retry.`,
            `⚠️ 敗北（スコア ${pScore} : ${oScore}）・次話へ進むには勝利が必要です。カードを強化するか再挑戦してください。`
          );
    if (playRpgState.repeatHunting) {
      setTimeout(() => {
        initBattle();
      }, 3000);
    } else if (playRpgState.autoMode) {
      // 자동플레이 중 승리하지 못한 경우: 멈추지 않고 상점 이동 -> 카드 뽑기 -> 5장 확인 -> 마이덱 최적화 -> 재도전 루프 가동!
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('snshero_battle_defeat_auto_loop'));
      }
    } else {
      playRpgState.autoMode = false;
      try {
        localStorage.setItem('hero_kadan_rpg_auto_mode', 'false');
      } catch {}
    }
  } else {
    playRpgState.battleWinner = 'draw';
    playRpgState.battleMessage = tr(
      `⚠️ 무승부 (스코어 ${pScore} : ${oScore}) · 승리해야만 다음 회차로 전진할 수 있습니다. 카드를 업그레이드하거나 재도전하세요.`,
      `⚠️ Draw (Score ${pScore} : ${oScore}) · Victory is required to advance. Upgrade your cards or retry.`,
      `⚠️ 引き分け（スコア ${pScore} : ${oScore}）・次話へ進むには勝利が必要です。カードを強化するか再挑戦してください。`
    );
    if (playRpgState.repeatHunting) {
      setTimeout(() => {
        initBattle();
      }, 3000);
    } else if (playRpgState.autoMode) {
      // 자동플레이 중 무승부 시에도 동일하게 자동 성장 & 재도전 루프 가동
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('snshero_battle_defeat_auto_loop'));
      }
    } else {
      playRpgState.autoMode = false;
      try {
        localStorage.setItem('hero_kadan_rpg_auto_mode', 'false');
      } catch {}
    }
  }
}

/**
 * Award 50 EXP upon victory and persist progress
 */
export function finishBattleAndAwardExp(): { expAwarded: number; deckCount: number; updatedCards?: number[] } {
  const result = cardNurtureStore.awardBattleVictoryExp
    ? cardNurtureStore.awardBattleVictoryExp(50)
    : (cardNurtureStore as any).awardBattleVictoryExp(50);

  // If repeat hunting is active, immediately repeat battle
  if (playRpgState.repeatHunting) {
    setTimeout(() => {
      if (playRpgState.subState === 'battle') {
        initBattle();
      }
    }, 3000);
  } else if (playRpgState.currentChapter >= 40) {
    // When Episode 40 finishes, automatically open the 3-second Reincarnation Popup
    setTimeout(() => {
      if (playRpgState.subState === 'battle' && playRpgState.currentChapter >= 40) {
        triggerReincarnationPopup();
      }
    }, 2400);
  } else if (playRpgState.autoMode) {
    // If autoMode is active without repeat hunting, advance to next chapter
    setTimeout(() => {
      if (playRpgState.subState === 'battle' && playRpgState.battleWinner) {
        advanceNextChapter();
      }
    }, 3000);
  }

  return result;
}

let reincarnationIntervalId: ReturnType<typeof setInterval> | null = null;

function notifyPlayStateUpdated(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('snshero_card_nurture_updated'));
    } catch {}
  }
}

/**
 * Show 3-second Reincarnation Modal Popup after Episode 40 completes
 */
export function triggerReincarnationPopup(): void {
  if (reincarnationIntervalId) {
    clearInterval(reincarnationIntervalId);
    reincarnationIntervalId = null;
  }

  playRpgState.subState = 'reincarnation';
  playRpgState.reincarnationTimerSec = 3.0;
  playRpgState.reincarnationDeadlineMs = Date.now() + 3000;
  notifyPlayStateUpdated();

  if (typeof window !== 'undefined') {
    reincarnationIntervalId = setInterval(() => {
      if (playRpgState.subState !== 'reincarnation') {
        if (reincarnationIntervalId) {
          clearInterval(reincarnationIntervalId);
          reincarnationIntervalId = null;
        }
        return;
      }

      const remainingMs = Math.max(0, playRpgState.reincarnationDeadlineMs - Date.now());
      playRpgState.reincarnationTimerSec = Number((remainingMs / 1000).toFixed(1));

      if (remainingMs <= 0) {
        if (reincarnationIntervalId) {
          clearInterval(reincarnationIntervalId);
          reincarnationIntervalId = null;
        }
        completeReincarnation();
      } else {
        notifyPlayStateUpdated();
      }
    }, 100);
  }
}

/**
 * Complete reincarnation and restart from Reincarnation N-1 (환생N-1화)
 */
export function completeReincarnation(): void {
  if (reincarnationIntervalId) {
    clearInterval(reincarnationIntervalId);
    reincarnationIntervalId = null;
  }

  playRpgState.reincarnationLevel += 1;
  playRpgState.currentChapter = 1;
  playRpgState.reincarnationTimerSec = 0;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hero_kadan_rpg_rebirth_level', String(playRpgState.reincarnationLevel));
      localStorage.setItem('hero_kadan_rpg_chapter', '1');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hero_reincarnation_updated', {
          detail: { rebirthLevel: playRpgState.reincarnationLevel },
        })
      );
    }
  } catch {}

  playRpgState.ambushTriggeredInChapter = false;
  playRpgState.activeAmbush = null;
  syncRegionAndTargets();

  const ch1Event = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === 1) || KADAN_RPG_EVENTS[0];
  if (ch1Event) {
    playRpgState.heroTile = { ...ch1Event.tile };
    triggerDialogue(ch1Event);
  } else {
    playRpgState.subState = 'map';
    const region = getCurrentRegion();
    playRpgState.heroTile = { ...region.startTile };
  }

  notifyPlayStateUpdated();
}

/**
 * Advance to next chapter (or trigger 3s Reincarnation Popup after Chapter 40)
 * Strictly requires battle victory when called from an ended battle.
 */
export function advanceNextChapter(): void {
  if (
    playRpgState.subState === 'battle' &&
    playRpgState.battleWinner !== null &&
    playRpgState.battleWinner !== 'player'
  ) {
    playRpgState.battleMessage = tr(
      '⚠️ 전투에서 승리해야만 다음 회차로 전진할 수 있습니다! 카드를 업그레이드하거나 재도전하세요.',
      '⚠️ You must win the battle to advance to the next episode! Upgrade your cards or retry.',
      '⚠️ バトルに勝利しないと次のエピソードへ進めません！カードを強化するか再挑戦してください。'
    );
    return;
  }

  if (playRpgState.currentChapter >= 40) {
    triggerReincarnationPopup();
    return;
  }

  playRpgState.currentChapter += 1;
  try {
    localStorage.setItem('hero_kadan_rpg_chapter', String(playRpgState.currentChapter));
  } catch {}

  playRpgState.subState = 'map';
  playRpgState.ambushTriggeredInChapter = false;
  playRpgState.activeAmbush = null;
  syncRegionAndTargets();

  // Reset hero to region start
  const region = getCurrentRegion();
  playRpgState.heroTile = { ...region.startTile };
}

/**
 * Jump directly to a selected chapter (1..40)
 */
export function selectChapter(targetChapter: number): void {
  const validChapter = Math.max(1, Math.min(40, Math.floor(targetChapter)));
  playRpgState.currentChapter = validChapter;
  try {
    localStorage.setItem('hero_kadan_rpg_chapter', String(validChapter));
  } catch {}

  playRpgState.subState = 'map';
  playRpgState.ambushTriggeredInChapter = false;
  playRpgState.activeAmbush = null;
  playRpgState.battleWinner = null;
  playRpgState.dialogueStep = 0;
  playRpgState.activeEvent = null;
  syncRegionAndTargets();

  // Reset hero to region start tile
  const region = getCurrentRegion();
  playRpgState.heroTile = { ...region.startTile };
  preloadDialogueChapterImages(validChapter);
}

/**
 * Move to previous chapter
 */
export function selectPrevChapter(): void {
  if (playRpgState.currentChapter > 1) {
    selectChapter(playRpgState.currentChapter - 1);
  }
}

/**
 * Move to next chapter
 */
export function selectNextChapter(): void {
  if (playRpgState.currentChapter < 40) {
    selectChapter(playRpgState.currentChapter + 1);
  }
}

/**
 * Toggle auto mode
 */
export function toggleAutoMode(): boolean {
  playRpgState.autoMode = !playRpgState.autoMode;
  try {
    localStorage.setItem('hero_kadan_rpg_auto_mode', String(playRpgState.autoMode));
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('snshero_auto_mode_toggled', {
        detail: { autoMode: playRpgState.autoMode },
      })
    );
  }
  return playRpgState.autoMode;
}

/**
 * Toggle repeat hunting
 */
export function toggleRepeatHunting(): boolean {
  playRpgState.repeatHunting = !playRpgState.repeatHunting;
  if (cardNurtureStore.setRepeatHunting) {
    cardNurtureStore.setRepeatHunting(playRpgState.repeatHunting);
  } else {
    try {
      localStorage.setItem('hero_repeat_hunting', String(playRpgState.repeatHunting));
    } catch {}
  }
  return playRpgState.repeatHunting;
}

/**
 * Launch Arcade Minigame
 */
export function launchArcadeGame(cardId: number): void {
  playRpgState.activeArcadeModalId = cardId;
}

/**
 * Close Arcade Minigame Modal
 */
export function closeArcadeModal(): void {
  playRpgState.activeArcadeModalId = null;
}

/**
 * Random die roller across 1..110
 */
export function rollRandomArcadeGame(): number {
  const rolledId = Math.floor(Math.random() * 110) + 1;
  playRpgState.activeArcadeModalId = rolledId;
  return rolledId;
}

/**
 * Automated single step for auto-runner.
 * When `respectSpeedAndImageGate` is true (used by the periodic UI runner),
 * enforces the 2x slower interval (2800ms) and waits until current & next bust images have finished loading.
 */
export function runAutoStep(respectSpeedAndImageGate: boolean = false): boolean {
  if (!playRpgState.autoMode) return false;

  if (respectSpeedAndImageGate) {
    const now = Date.now();
    if (playRpgState.lastAutoStepAt > 0 && now - playRpgState.lastAutoStepAt < AUTO_STEP_INTERVAL_MS) {
      return false;
    }
    if (playRpgState.subState === 'dialogue' && !isDialogueReadyToAdvance()) {
      return false;
    }
  }

  playRpgState.lastAutoStepAt = Date.now();

  if (playRpgState.subState === 'map') {
    // In auto mode, immediately jump to event tile and trigger dialogue cutscene
    const chEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === playRpgState.currentChapter) || KADAN_RPG_EVENTS[0];
    if (chEvent) {
      playRpgState.heroTile = { ...chEvent.tile };
      triggerDialogue(chEvent);
      return true;
    }
  } else if (playRpgState.subState === 'dialogue') {
    const lines = getCurrentDialogueLines();
    if (lines.length === 0) {
      advanceDialogue();
      return true;
    }
    const currentLine = lines[playRpgState.currentDialogueLineIdx];
    if (currentLine?.choices && currentLine.choices.length > 0) {
      selectDialogueChoice(0);
    } else {
      advanceDialoguePartOrLine();
    }
    return true;
  } else if (playRpgState.subState === 'battle') {
    if (!playRpgState.battleWinner && playRpgState.turn === 'player') {
      // Tactical AI Engine: evaluates opponent's placed cards and opponent hand to counter-pick
      const bestMove = findBestPlayerTacticalMove();
      if (bestMove && playRpgState.playerHand.length > 0) {
        const cardId = playRpgState.playerHand[bestMove.handIdx];
        const cardName = getLocalizedCharacterName(cardId) || `카드 ${cardId}`;
        playRpgState.battleMessage = tr(
          `🤖 [전술 AI 출격] ${cardName} → ${bestMove.slotIdx + 1}번 슬롯 (${bestMove.reason})`,
          `🤖 [Tactical AI] ${cardName} → Slot ${bestMove.slotIdx + 1} (${bestMove.reason})`,
          `🤖 [戦術AI出撃] ${cardName} → スロット${bestMove.slotIdx + 1} (${bestMove.reason})`
        );
        playCardToSlot(bestMove.handIdx, bestMove.slotIdx, 'player');
        return true;
      } else {
        // Fallback if no specific move found
        const emptyIdx = playRpgState.battleBoard.findIndex((s) => s === null);
        if (emptyIdx !== -1 && playRpgState.playerHand.length > 0) {
          playCardToSlot(0, emptyIdx, 'player');
          return true;
        }
      }
    } else if (playRpgState.battleWinner) {
      if (playRpgState.repeatHunting) {
        initBattle();
        return true;
      } else if (playRpgState.battleWinner === 'player') {
        advanceNextChapter();
        // If 40th chapter triggered the 3-second Reincarnation Popup, wait for the 3s countdown!
        if (playRpgState.subState === 'reincarnation') {
          return true;
        }
        const nextEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === playRpgState.currentChapter);
        if (nextEvent) {
          playRpgState.heroTile = { ...nextEvent.tile };
          triggerDialogue(nextEvent);
        }
        return true;
      } else {
        // Defeat or Draw: cannot advance to next chapter without winning (upgrade cards required)
        playRpgState.autoMode = false;
        try {
          localStorage.setItem('hero_kadan_rpg_auto_mode', 'false');
        } catch {}
        return true;
      }
    }
  } else if (playRpgState.subState === 'reincarnation') {
    // Wait for the 3-second reincarnation popup countdown to complete
    if (playRpgState.reincarnationDeadlineMs > 0 && Date.now() >= playRpgState.reincarnationDeadlineMs) {
      completeReincarnation();
      return true;
    }
  }
  return false;
}

// Initial bootstrap
initPlayRpgState();
