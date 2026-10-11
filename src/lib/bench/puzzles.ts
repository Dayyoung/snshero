/**
 * SHBP-3 Puzzle Track
 * Mid-game positions solved exactly by full-depth negamax. Every legal move carries its exact
 * game-theoretic value, so grading never re-runs search and is luck-free.
 */
import {
  BoardState,
  Cell,
  PlaceMove,
  SearchState,
  Side,
  boardView,
  cardView,
  legalMoves,
  moveKey,
  CellView,
  CardView,
} from './core';

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';

export interface BenchPuzzle {
  id: string;
  difficulty: PuzzleDifficulty;
  /** 9 cells: null or [cardId, owner(0 = you, 1 = opponent)] */
  board: Array<[number, Side] | null>;
  hand: number[];
  oppHand: number[];
  /** moveKey -> exact final score differential (you - opponent) under optimal play */
  values: Record<string, number>;
  best: number;
}

export interface PuzzleSet {
  version: string;
  name: string;
  generatedWith: string;
  puzzles: BenchPuzzle[];
}

export const puzzleBoard = (p: BenchPuzzle): BoardState =>
  p.board.map((c) => (c ? ({ c: c[0], o: c[1] } as Cell) : null));

export const puzzleState = (p: BenchPuzzle): SearchState => ({
  board: puzzleBoard(p),
  hands: [p.hand.slice(), p.oppHand.slice()],
  toMove: 0,
});

export const puzzleLegalMoves = (p: BenchPuzzle): PlaceMove[] => legalMoves(puzzleBoard(p), p.hand);

/** Probability that a uniformly random legal move is optimal. */
export const puzzleRandomChance = (p: BenchPuzzle): number => {
  const vals = Object.values(p.values);
  if (!vals.length) return 1;
  return vals.filter((v) => v === p.best).length / vals.length;
};

export interface PuzzleView {
  id: string;
  difficulty: PuzzleDifficulty;
  board: CellView[];
  yourHand: CardView[];
  opponentHand: CardView[];
}

export const puzzleView = (p: BenchPuzzle): PuzzleView => ({
  id: p.id,
  difficulty: p.difficulty,
  board: boardView(puzzleBoard(p)),
  yourHand: p.hand.map(cardView),
  opponentHand: p.oppHand.map(cardView),
});

export interface PuzzleGrade {
  id: string;
  difficulty: PuzzleDifficulty;
  valid: boolean;
  correct: boolean;
  regret: number;
  chance: number;
  /** chance-corrected score in [-chance/(1-chance), 1] */
  normalized: number;
}

export function gradePuzzle(p: BenchPuzzle, answer: PlaceMove | null | undefined): PuzzleGrade {
  const chance = puzzleRandomChance(p);
  const key = answer ? moveKey(answer) : '';
  const valid = !!answer && Object.prototype.hasOwnProperty.call(p.values, key);
  const worst = Math.min(...Object.values(p.values));
  const v = valid ? p.values[key] : worst;
  const correct = valid && v === p.best;
  const denom = 1 - chance;
  const normalized = denom <= 0 ? 1 : ((correct ? 1 : 0) - chance) / denom;
  return { id: p.id, difficulty: p.difficulty, valid, correct, regret: p.best - v, chance, normalized };
}
