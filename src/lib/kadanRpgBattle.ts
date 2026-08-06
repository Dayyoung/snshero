import { CARD_DATABASE } from '../cardDatabase';
import { checkFlips, findBestMove, type Board } from './gameEngine';
import type { CardData } from '../types';
import type { KadanRpgDifficulty } from '../content/kadanRpgStory';

export type KadanBattleSide = 'player' | 'ai';
export type KadanBattleResult = 'win' | 'loss' | 'draw';

export interface KadanBattleMoveSummary {
  side: KadanBattleSide;
  card: CardData;
  boardIndex: number;
  flippedIndices: number[];
  scoreBefore: { player: number; ai: number };
  scoreAfter: { player: number; ai: number };
}

export interface KadanBattleState {
  board: Board;
  playerHand: CardData[];
  aiHand: CardData[];
  turn: KadanBattleSide;
  log: string[];
  lastMove: KadanBattleMoveSummary | null;
  result: KadanBattleResult | null;
}

const fallbackPlayerCardIds = [41, 1, 11, 3, 31];

export const cardFromDatabase = (cardId: number): CardData | null => {
  const dbCard = CARD_DATABASE[cardId];
  if (!dbCard) return null;

  return {
    id: `kadan-rpg-card-${dbCard.id}`,
    title_dis: dbCard.title_dis || dbCard.title_en || dbCard.title,
    title: dbCard.title,
    title_en: dbCard.title_en,
    stats: dbCard.stats,
    rarity: dbCard.rarity,
    element: dbCard.element,
    race: dbCard.race,
    power: dbCard.power,
    level: dbCard.level,
    ability: dbCard.ability,
    imageIndex: dbCard.id,
  };
};

export const getCardDisplayName = (card: CardData, language: string): string => {
  if (language === 'ko') return card.title || card.title_dis;
  return card.title_en || card.title_dis || card.title || card.id;
};

export const buildPlayerRpgHand = (currentDeck: Array<CardData | null>): CardData[] => {
  const deckCards = currentDeck
    .filter((card): card is CardData => Boolean(card))
    .slice(0, 5)
    .map((card) => ({
      ...card,
      owner: undefined,
      // Give player cards a +1 stat boost in RPG story mode so combat is accessible
      stats: card.stats.map((stat) => Math.min(10, stat + 1)) as [number, number, number, number],
    }));

  if (deckCards.length >= 5) return deckCards;

  const fallbackCards = fallbackPlayerCardIds
    .map(cardFromDatabase)
    .filter((card): card is CardData => Boolean(card))
    .map((card) => ({
      ...card,
      stats: card.stats.map((stat) => Math.min(10, stat + 1)) as [number, number, number, number],
    }));

  return [...deckCards, ...fallbackCards].slice(0, 5);
};

export const buildOpponentRpgHand = (
  cardIds: number[],
  difficulty: KadanRpgDifficulty,
  rebirthLevel = 0,
): CardData[] => {
  const bonusByDifficulty: Record<KadanRpgDifficulty, number> = {
    easy: -1,
    normal: 0,
    hard: 1,
    boss: 2,
  };
  const rebirthBonus = Math.max(0, Math.floor(rebirthLevel));
  const statBonus = bonusByDifficulty[difficulty] + Math.min(2, rebirthBonus);

  return cardIds
    .map(cardFromDatabase)
    .filter((card): card is CardData => Boolean(card))
    .slice(0, 5)
    .map((card) => ({
      ...card,
      stats: card.stats.map((stat) => Math.max(1, Math.min(10, stat + statBonus))) as [number, number, number, number],
      power: (card.power || 0) + statBonus * 4,
    }));
};

export const createInitialKadanBattleState = (
  playerHand: CardData[],
  aiHand: CardData[],
): KadanBattleState => ({
  board: Array(9).fill(null),
  playerHand,
  aiHand,
  turn: 'player',
  log: [],
  lastMove: null,
  result: null,
});

export const countBattleScore = (board: Board): { player: number; ai: number } => {
  const player = board.filter((card) => card?.owner === 'player').length;
  const ai = board.filter((card) => card?.owner === 'ai').length;
  return { player, ai };
};

export const resolveBattleResult = (board: Board): KadanBattleResult => {
  const score = countBattleScore(board);
  if (score.player > score.ai) return 'win';
  if (score.player < score.ai) return 'loss';
  return 'draw';
};

const isBattleOver = (state: KadanBattleState): boolean => (
  state.board.every(Boolean) || (state.playerHand.length === 0 && state.aiHand.length === 0)
);

export const placeKadanBattleCard = (
  state: KadanBattleState,
  side: KadanBattleSide,
  cardIndex: number,
  boardIndex: number,
  language: string,
): KadanBattleState => {
  if (state.result || state.turn !== side || state.board[boardIndex]) return state;

  const hand = side === 'player' ? state.playerHand : state.aiHand;
  const card = hand[cardIndex];
  if (!card) return state;

  const cardInstance = { ...card, owner: side };
  const nextBoard = [...state.board];
  nextBoard[boardIndex] = cardInstance;
  const scoreBefore = countBattleScore(state.board);
  const flippedBoard = checkFlips(nextBoard, boardIndex);
  const flippedIndices = flippedBoard.reduce<number[]>((indices, boardCard, index) => {
    const previousOwner = nextBoard[index]?.owner;
    if (boardCard && previousOwner && boardCard.owner !== previousOwner) {
      indices.push(index);
    }
    return indices;
  }, []);
  const nextPlayerHand = side === 'player'
    ? state.playerHand.filter((_, index) => index !== cardIndex)
    : state.playerHand;
  const nextAiHand = side === 'ai'
    ? state.aiHand.filter((_, index) => index !== cardIndex)
    : state.aiHand;
  const nextTurn: KadanBattleSide = side === 'player' ? 'ai' : 'player';
  const nextState: KadanBattleState = {
    ...state,
    board: flippedBoard,
    playerHand: nextPlayerHand,
    aiHand: nextAiHand,
    turn: nextTurn,
    lastMove: {
      side,
      card,
      boardIndex,
      flippedIndices,
      scoreBefore,
      scoreAfter: countBattleScore(flippedBoard),
    },
    log: [
      language === 'ko'
        ? `${side === 'player' ? '카단' : '상대'}: ${getCardDisplayName(card, language)} ${boardIndex + 1}번 배치${flippedIndices.length > 0 ? `, ${flippedIndices.map((index) => index + 1).join(', ')}번 뒤집음` : ', 뒤집힘 없음'}`
        : `${side === 'player' ? 'Kadan' : 'Echo'} placed ${getCardDisplayName(card, language)} on ${boardIndex + 1}${flippedIndices.length > 0 ? ` and flipped ${flippedIndices.map((index) => index + 1).join(', ')}` : ' with no flips'}`,
      ...state.log,
    ].slice(0, 8),
  };

  if (isBattleOver(nextState)) {
    return {
      ...nextState,
      result: resolveBattleResult(nextState.board),
    };
  }

  return nextState;
};

export const chooseKadanAutoMove = (
  state: KadanBattleState,
  side: KadanBattleSide,
  difficulty: KadanRpgDifficulty,
): { cardIndex: number; boardIndex: number } | null => {
  const hand = side === 'player' ? state.playerHand : state.aiHand;
  if (hand.length === 0) return null;

  const aiDifficulty = difficulty === 'easy' ? 'easy' : difficulty === 'normal' ? 'medium' : 'hard';
  const move = findBestMove(
    state.board,
    hand,
    side === 'player' ? 'balanced' : difficulty === 'boss' ? 'aggressive' : 'balanced',
    side,
    1,
    [],
    aiDifficulty,
  );

  if (move) {
    return { cardIndex: move.cardIdx, boardIndex: move.boardIdx };
  }

  const boardIndex = state.board.findIndex((card) => card === null);
  return boardIndex >= 0 ? { cardIndex: 0, boardIndex } : null;
};
