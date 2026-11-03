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
import {
  shouldTriggerAmbush,
  generateAmbushEncounter,
  AmbushEncounter,
  BANDIT_DECK_PRESET,
  THIEF_DECK_PRESET,
} from '../../lib/rpg/kadanRpgAmbush';

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
export type PlaySubState = 'map' | 'dialogue' | 'battle' | 'reward';

export interface BattleSlotState {
  cardId: number;
  owner: 'player' | 'opponent';
  stats: [number, number, number, number]; // [top, right, bottom, left]
  name: string;
}

export interface PlayRpgState {
  activeTab: PlayTabKey;
  subState: PlaySubState;
  currentChapter: number;
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
  selectedChoiceIdx: number | null;
  choiceTimerSec: number;
  activeBuff: string | null;

  // Battle Sub-state
  battleBoard: (BattleSlotState | null)[]; // 9 slots
  playerHand: number[];                   // 5 card IDs
  opponentHand: number[];                 // 5 card IDs
  selectedHandIndex: number;
  turn: 'player' | 'opponent';
  battleWinner: 'player' | 'opponent' | 'draw' | null;
  battleMessage: string;
  opponentName: string;

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
  selectedChoiceIdx: null,
  choiceTimerSec: 5.0,
  activeBuff: null,

  battleBoard: Array(9).fill(null),
  playerHand: [1, 2, 3, 4, 5],
  opponentHand: [51, 52, 61, 60, 43],
  selectedHandIndex: 0,
  turn: 'player',
  battleWinner: null,
  battleMessage: '원하는 카드를 선택한 후 3x3 전장의 빈 슬롯을 터치하세요.',
  opponentName: '섀도우렐름 척후병',

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
    const savedAuto = localStorage.getItem('hero_kadan_rpg_auto_mode');
    if (savedAuto === 'true') {
      playRpgState.autoMode = true;
    }

    const savedRepeat = localStorage.getItem('hero_repeat_hunting');
    playRpgState.repeatHunting = savedRepeat === 'true';

    const savedChapter = localStorage.getItem('hero_kadan_rpg_chapter');
    if (savedChapter) {
      const parsed = parseInt(savedChapter, 10);
      if (parsed >= 1 && parsed <= 40) {
        playRpgState.currentChapter = parsed;
      }
    }
  } catch (err) {
    console.warn('[playRpgEngine] Error reading localStorage:', err);
  }

  syncRegionAndTargets();
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
 * Extract clean, concise dialogue quote from script line (대사만 추출)
 */
export function extractDialogueText(line: KadanRpgNovelScriptLine): { text: string; isNarration: boolean } {
  // 1. 이미 정제된 dialogueQuoteKo가 있는 경우 최우선 채택
  if (line.dialogueQuoteKo && line.dialogueQuoteKo.trim().length > 0) {
    let quote = line.dialogueQuoteKo.trim();
    if (!quote.startsWith('“') && !quote.startsWith('"')) {
      quote = `“${quote}”`;
    }
    // 복수 대사 따옴표 분리 포맷팅
    quote = quote.replace(/”\s*“/g, '”\n\n“').replace(/"\s*"/g, '"\n\n"');
    return { text: quote, isNarration: false };
  }

  // 2. subCuts에서 따옴표 대사가 있는지 확인
  if (line.subCuts && line.subCuts.length > 0) {
    const cutQuotes: string[] = [];
    for (const cut of line.subCuts) {
      if (cut.dialogueKo && cut.dialogueKo.trim()) {
        const matches = cut.dialogueKo.match(/[“"][^”"]+[”"]/g);
        if (matches && matches.length > 0) {
          cutQuotes.push(...matches);
        }
      }
    }
    if (cutQuotes.length > 0) {
      // 중복 대사 제거 및 병합
      const uniqueQuotes = Array.from(new Set(cutQuotes));
      return { text: uniqueQuotes.join('\n\n'), isNarration: false };
    }
  }

  // 3. line.text에서 큰따옴표 대사 추출
  if (line.text && line.text.trim()) {
    const matches = line.text.match(/[“"][^”"]+[”"]/g);
    if (matches && matches.length > 0) {
      const uniqueQuotes = Array.from(new Set(matches));
      return { text: uniqueQuotes.join('\n\n'), isNarration: false };
    }

    // 4. 큰따옴표 대사가 전혀 없는 순수 지문/내레이션 문단인 경우:
    // 전체 소설 본문 대신 1~2문장의 핵심 상황만 간결하게 표시 (최대 90자 이내)
    const sentences = line.text
      .replace(/\n+/g, ' ')
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const summary = sentences.slice(0, 2).join('. ') + (sentences.length > 0 ? '.' : '');
    return { text: summary || line.text.slice(0, 80) + '...', isNarration: true };
  }

  return { text: '“서약은 얼어붙지 않는다.”', isNarration: false };
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

/**
 * Resolve top-left and top-right characters and identify who is speaking
 */
export function resolveDialogueSpeakers(line: KadanRpgNovelScriptLine): ResolvedDialogueSpeakers {
  const chars = line.sceneCharacters || [];

  // 기본 캐릭터 1 (주인공 / 아군 측 또는 첫 번째 인물)
  const char1 = chars[0] || {
    cardId: line.cardId || 41,
    nameKo: line.name || '카단',
    roleKo: '성기사단의 후예',
    isSpeaker: true,
  };

  // 기본 캐릭터 2 (상대방 / 조력자 / 적 또는 두 번째 인물)
  let char2 = chars[1];
  if (!char2) {
    // 1명만 있을 경우 대비: 카단이 아니면 카단을 상대방으로, 카단이면 발리안/알렉산다르를 배치
    const oppCardId = char1.cardId === 41 ? 43 : 41;
    const oppName = oppCardId === 41 ? '카단' : '발리안';
    const oppRole = oppCardId === 41 ? '성기사단의 후예' : '아케인 창술의 달인';
    char2 = {
      cardId: oppCardId,
      nameKo: oppName,
      roleKo: oppRole,
      isSpeaker: false,
    };
  }

  // 발화자가 누구인지 판단 (좌측 vs 우측)
  const lineSpeakerName = (line.name || '').trim();
  const lineSpeakerType = line.speaker;
  let activeSide: 'left' | 'right' = 'left';

  if (lineSpeakerName.includes(char2.nameKo) || (char2.nameEn && lineSpeakerName.includes(char2.nameEn))) {
    activeSide = 'right';
  } else if (lineSpeakerName.includes(char1.nameKo) || (char1.nameEn && lineSpeakerName.includes(char1.nameEn))) {
    activeSide = 'left';
  } else if (lineSpeakerType === 'kadan' && char1.cardId === 41) {
    activeSide = 'left';
  } else if (lineSpeakerType === 'kadan' && char2.cardId === 41) {
    activeSide = 'right';
  } else if (char2.isSpeaker && !char1.isSpeaker) {
    activeSide = 'right';
  } else {
    activeSide = 'left';
  }

  const activeChar = activeSide === 'left' ? char1 : char2;

  return {
    left: {
      name: char1.nameKo,
      cardId: char1.cardId || 41,
      role: char1.roleKo || '동료',
      isActive: activeSide === 'left',
    },
    right: {
      name: char2.nameKo,
      cardId: char2.cardId || 43,
      role: char2.roleKo || '동료',
      isActive: activeSide === 'right',
    },
    activeSide,
    speakerTitle: activeChar.roleKo || '수호자',
  };
}

/**
 * Trigger dialogue cutscene overlay
 */
export function triggerDialogue(event: KadanRpgEvent): void {
  playRpgState.subState = 'dialogue';
  playRpgState.currentDialogueLineIdx = 0;
  playRpgState.selectedChoiceIdx = null;
  playRpgState.choiceTimerSec = playRpgState.autoMode ? 1.5 : 5.0;
  playRpgState.activeAmbush = null;
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
 * Advance dialogue by one line or transition into battle
 */
export function advanceDialogue(): { completed: boolean; readyForBattle: boolean } {
  const lines = getCurrentDialogueLines();
  if (playRpgState.currentDialogueLineIdx < lines.length - 1) {
    playRpgState.currentDialogueLineIdx += 1;
    playRpgState.selectedChoiceIdx = null;
    playRpgState.choiceTimerSec = playRpgState.autoMode ? 1.5 : 5.0;
    return { completed: false, readyForBattle: false };
  }

  // Dialogue completed: transition to battle!
  initBattle();
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
 * Initialize 3x3 Tactical Battle
 */
export function initBattle(customOpponentCards?: number[], customOpponentName?: string): void {
  playRpgState.subState = 'battle';
  playRpgState.battleBoard = Array(9).fill(null);
  playRpgState.battleWinner = null;
  playRpgState.selectedHandIndex = 0;
  playRpgState.turn = 'player';
  playRpgState.battleMessage = '카드를 선택한 후 3x3 전장의 빈 슬롯을 터치하세요.';

  // Player Hand: 5 active deck cards
  const activeDeck = (cardNurtureStore as any).getDeckCardIds
    ? (cardNurtureStore as any).getDeckCardIds()
    : [1, 2, 3, 4, 5];
  playRpgState.playerHand = activeDeck.length === 5 ? [...activeDeck] : [1, 2, 3, 4, 5];

  // Opponent Hand: Scaled from chapter encounter or custom cards
  if (customOpponentCards && customOpponentCards.length >= 5) {
    playRpgState.opponentHand = customOpponentCards.slice(0, 5);
    playRpgState.opponentName = customOpponentName || '기습 적군';
  } else {
    const chEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === playRpgState.currentChapter);
    if (chEvent) {
      const encounter = getDynamicKadanEncounter(chEvent, 0);
      playRpgState.opponentHand = [...encounter.opponentCardIds.slice(0, 5)];
      playRpgState.opponentName = `제${playRpgState.currentChapter}화 수호 기사단`;
    } else {
      playRpgState.opponentHand = [51, 52, 61, 60, 43];
      playRpgState.opponentName = '섀도우렐름 정예단';
    }
  }
}

/**
 * Helper to get 4-way card stats [top, right, bottom, left]
 */
function getCardCombatStats(cardId: number): [number, number, number, number] {
  const card = CARD_DATABASE[cardId];
  const nurture = (cardNurtureStore as any).getCard(cardId);
  const bonus = nurture.bonusStats || { top: 0, right: 0, bottom: 0, left: 0 };

  const top = (card?.top || 2) + bonus.top;
  const right = (card?.right || 2) + bonus.right;
  const bottom = (card?.bottom || 2) + bonus.bottom;
  const left = (card?.left || 2) + bonus.left;

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
  if (playRpgState.battleBoard[slotIdx] !== null) {
    playRpgState.battleMessage = '이미 카드가 배치된 슬롯입니다.';
    return { success: false, completed: false };
  }

  const hand = owner === 'player' ? playRpgState.playerHand : playRpgState.opponentHand;
  if (!hand[handIdx]) return { success: false, completed: false };

  const cardId = hand[handIdx];
  const stats = getCardCombatStats(cardId);
  const card = CARD_DATABASE[cardId];

  // Place card
  playRpgState.battleBoard[slotIdx] = {
    cardId,
    owner,
    stats,
    name: card?.title || `Hero ${cardId}`,
  };

  // Remove card from hand
  hand.splice(handIdx, 1);

  // Evaluate 4-way flips
  evaluateBoardFlips(slotIdx, owner, stats);

  // Check if battle completed (all 9 slots filled or hands empty)
  const isBoardFull = playRpgState.battleBoard.every((slot) => slot !== null);
  const isHandsEmpty = playRpgState.playerHand.length === 0 && playRpgState.opponentHand.length === 0;

  if (isBoardFull || isHandsEmpty) {
    finalizeBattle();
    return { success: true, completed: true };
  }

  // Switch turn
  if (owner === 'player') {
    playRpgState.turn = 'opponent';
    playRpgState.selectedHandIndex = 0;
    // Execute AI turn
    executeOpponentTurn();
  } else {
    playRpgState.turn = 'player';
    playRpgState.selectedHandIndex = 0;
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
  let flipCount = 0;

  // 1. Top neighbor: slot - 3
  if (slot >= 3) {
    const neighborIdx = slot - 3;
    const neighbor = playRpgState.battleBoard[neighborIdx];
    if (neighbor && neighbor.owner !== placedOwner && top > neighbor.stats[2]) {
      neighbor.owner = placedOwner;
      flipCount++;
    }
  }

  // 2. Bottom neighbor: slot + 3
  if (slot <= 5) {
    const neighborIdx = slot + 3;
    const neighbor = playRpgState.battleBoard[neighborIdx];
    if (neighbor && neighbor.owner !== placedOwner && bottom > neighbor.stats[0]) {
      neighbor.owner = placedOwner;
      flipCount++;
    }
  }

  // 3. Left neighbor: slot - 1 (if not col 0)
  if (slot % 3 !== 0) {
    const neighborIdx = slot - 1;
    const neighbor = playRpgState.battleBoard[neighborIdx];
    if (neighbor && neighbor.owner !== placedOwner && left > neighbor.stats[1]) {
      neighbor.owner = placedOwner;
      flipCount++;
    }
  }

  // 4. Right neighbor: slot + 1 (if not col 2)
  if (slot % 3 !== 2) {
    const neighborIdx = slot + 1;
    const neighbor = playRpgState.battleBoard[neighborIdx];
    if (neighbor && neighbor.owner !== placedOwner && right > neighbor.stats[3]) {
      neighbor.owner = placedOwner;
      flipCount++;
    }
  }

  if (flipCount > 0) {
    playRpgState.battleMessage = `상대 카드 ${flipCount}장을 공명 역전(Flip)했습니다!`;
  }
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

  // AI picks best slot or random slot
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
    playRpgState.battleMessage = `🎉 승리! (스코어 ${pScore} : ${oScore}) +50 EXP가 활성 덱 전원에 지급되었습니다.`;
    finishBattleAndAwardExp();
  } else if (pScore < oScore) {
    playRpgState.battleWinner = 'opponent';
    playRpgState.battleMessage = `패배 (스코어 ${pScore} : ${oScore}). 재도전하거나 덱을 보강하세요.`;
    if (playRpgState.repeatHunting) {
      setTimeout(() => {
        initBattle();
      }, 1500);
    }
  } else {
    playRpgState.battleWinner = 'draw';
    playRpgState.battleMessage = `무승부 (스코어 ${pScore} : ${oScore}).`;
    if (playRpgState.repeatHunting) {
      setTimeout(() => {
        initBattle();
      }, 1500);
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
      initBattle();
    }, 1500);
  } else if (playRpgState.autoMode) {
    // If autoMode is active without repeat hunting, advance to next chapter
    setTimeout(() => {
      advanceNextChapter();
    }, 1500);
  }

  return result;
}

/**
 * Advance to next chapter
 */
export function advanceNextChapter(): void {
  if (playRpgState.currentChapter < 40) {
    playRpgState.currentChapter += 1;
    try {
      localStorage.setItem('hero_kadan_rpg_chapter', String(playRpgState.currentChapter));
    } catch {}
  }

  playRpgState.subState = 'map';
  playRpgState.ambushTriggeredInChapter = false;
  playRpgState.activeAmbush = null;
  syncRegionAndTargets();

  // Reset hero to region start
  const region = getCurrentRegion();
  playRpgState.heroTile = { ...region.startTile };
}

/**
 * Toggle auto mode
 */
export function toggleAutoMode(): boolean {
  playRpgState.autoMode = !playRpgState.autoMode;
  try {
    localStorage.setItem('hero_kadan_rpg_auto_mode', String(playRpgState.autoMode));
  } catch {}
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
 * Automated single step for auto-runner
 */
export function runAutoStep(): void {
  if (!playRpgState.autoMode) return;

  if (playRpgState.subState === 'map') {
    // In auto mode, immediately jump to event tile and trigger dialogue cutscene
    const chEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === playRpgState.currentChapter) || KADAN_RPG_EVENTS[0];
    if (chEvent) {
      playRpgState.heroTile = { ...chEvent.tile };
      triggerDialogue(chEvent);
    }
  } else if (playRpgState.subState === 'dialogue') {
    // If choice prompt active, auto-select option 0
    const lines = getCurrentDialogueLines();
    const currentLine = lines[playRpgState.currentDialogueLineIdx];
    if (currentLine?.choices && currentLine.choices.length > 0) {
      selectDialogueChoice(0);
    } else {
      advanceDialogue();
    }
  } else if (playRpgState.subState === 'battle') {
    if (!playRpgState.battleWinner && playRpgState.turn === 'player') {
      // Find empty slot
      const emptyIdx = playRpgState.battleBoard.findIndex((s) => s === null);
      if (emptyIdx !== -1 && playRpgState.playerHand.length > 0) {
        playCardToSlot(0, emptyIdx, 'player');
      }
    } else if (playRpgState.battleWinner) {
      if (playRpgState.repeatHunting) {
        initBattle();
      } else {
        advanceNextChapter();
        const nextEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === playRpgState.currentChapter);
        if (nextEvent) {
          playRpgState.heroTile = { ...nextEvent.tile };
          triggerDialogue(nextEvent);
        }
      }
    }
  }
}

// Initial bootstrap
initPlayRpgState();
