/**
 * SHBP-3 Benchmark Core
 * - Pure, deterministic, dependency-light rules engine shared by the browser verifier and the Node harness.
 * - No localStorage / Math.random / Date usage inside rules so that replays are bit-exact everywhere.
 */
import { CARD_DATABASE } from '../../cardDatabase';

export const SHBP_VERSION = 'SHBP-3';

// ---------------------------------------------------------------------------
// PRNG (mulberry32) - deterministic, seedable
// ---------------------------------------------------------------------------
export type Prng = () => number;

export function createPrng(seed: number): Prng {
  let a = (seed >>> 0) || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function deriveSeed(seed: number, salt: number): number {
  let h = (seed ^ Math.imul(salt + 0x7f4a7c15, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export const pickOne = <T,>(prng: Prng, arr: readonly T[]): T => arr[Math.floor(prng() * arr.length)];

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
export type BenchRarity = 'bronze' | 'silver' | 'gold';

export interface BenchCard {
  id: number;
  name: string;
  /** [top/N, right/E, bottom/S, left/W] */
  s: [number, number, number, number];
  el: string;
  r: BenchRarity;
  power: number;
}

const toRarity = (r: string | undefined): BenchRarity => (r === 'silver' || r === 'gold' ? r : 'bronze');

export const BENCH_CARDS: Record<number, BenchCard> = {};
export const CARD_IDS_BY_RARITY: Record<BenchRarity, number[]> = { bronze: [], silver: [], gold: [] };

Object.keys(CARD_DATABASE)
  .map(Number)
  .sort((a, b) => a - b)
  .forEach((id) => {
    const db = CARD_DATABASE[id];
    if (!db) return;
    const s = [...(db.stats || [1, 1, 1, 1])] as [number, number, number, number];
    const card: BenchCard = {
      id,
      name: db.title_en || db.title_dis || db.title || `Card ${id}`,
      s,
      el: String(db.element || 'none'),
      r: toRarity(db.rarity),
      power: s[0] + s[1] + s[2] + s[3],
    };
    BENCH_CARDS[id] = card;
    CARD_IDS_BY_RARITY[card.r].push(id);
  });

export const ALL_CARD_IDS: number[] = Object.keys(BENCH_CARDS).map(Number);

export const getCard = (id: number): BenchCard => BENCH_CARDS[id] || BENCH_CARDS[ALL_CARD_IDS[0]];

/** Elemental edge cycle: attacker gets +1 on basic comparisons against the element it beats. */
export const ELEMENT_BEATS: Record<string, string> = { water: 'fire', fire: 'earth', earth: 'air', air: 'water' };

export function drawRarity(prng: Prng, weights: [number, number, number]): BenchRarity {
  const total = weights[0] + weights[1] + weights[2];
  const x = prng() * total;
  if (x < weights[0]) return 'bronze';
  if (x < weights[0] + weights[1]) return 'silver';
  return 'gold';
}

export function drawCard(prng: Prng, weights: [number, number, number]): number {
  const r = drawRarity(prng, weights);
  const pool = CARD_IDS_BY_RARITY[r].length ? CARD_IDS_BY_RARITY[r] : ALL_CARD_IDS;
  return pickOne(prng, pool);
}

// ---------------------------------------------------------------------------
// Board rules (SHBP-3 ruleset)
//   1. BASIC : attacker side stat (+1 element edge) > defender opposite stat -> flip.
//   2. SAME  : >=2 neighbours with equal touching stats -> opponent ones flip.
//   3. PLUS  : >=2 neighbours with equal touching-stat sums -> opponent ones flip.
//   4. COMBO : cards flipped by SAME/PLUS cascade BASIC captures recursively.
//   Score   : owned board cells + cards still in hand. 10 cards total, >5 wins.
// ---------------------------------------------------------------------------
export type Side = 0 | 1; // 0 = benchmarked agent, 1 = opponent
export interface Cell {
  c: number; // card id
  o: Side; // owner
}
export type BoardState = (Cell | null)[];

/** NEIGHBORS[idx] = list of [neighbourIdx, mySideIdx, theirSideIdx] */
export const NEIGHBORS: Array<Array<[number, number, number]>> = Array.from({ length: 9 }, (_, idx) => {
  const r = Math.floor(idx / 3);
  const c = idx % 3;
  const out: Array<[number, number, number]> = [];
  if (r > 0) out.push([idx - 3, 0, 2]);
  if (c < 2) out.push([idx + 1, 1, 3]);
  if (r < 2) out.push([idx + 3, 2, 0]);
  if (c > 0) out.push([idx - 1, 3, 1]);
  return out;
});

export const emptyBoard = (): BoardState => Array(9).fill(null);

export interface PlacementResult {
  board: BoardState;
  flipped: number[];
  combo: 'SAME' | 'PLUS' | 'SAME+PLUS' | null;
}

const edge = (atk: BenchCard, def: BenchCard): number => (ELEMENT_BEATS[atk.el] === def.el ? 1 : 0);

export function applyPlacement(board: BoardState, idx: number, cardId: number, side: Side): PlacementResult {
  const next = board.slice();
  next[idx] = { c: cardId, o: side };
  const me = getCard(cardId);
  const flipSet = new Set<number>();
  const same: number[] = [];
  const plus = new Map<number, number[]>();

  for (const [n, mi, ti] of NEIGHBORS[idx]) {
    const cell = next[n];
    if (!cell) continue;
    const them = getCard(cell.c);
    const a = me.s[mi];
    const d = them.s[ti];
    if (a === d) same.push(n);
    const sum = a + d;
    const list = plus.get(sum);
    if (list) list.push(n);
    else plus.set(sum, [n]);
    if (cell.o !== side && a + edge(me, them) > d) flipSet.add(n);
  }

  const comboSeeds: number[] = [];
  let sameHit = false;
  let plusHit = false;
  if (same.length >= 2) {
    for (const n of same) {
      if (next[n]!.o !== side) {
        comboSeeds.push(n);
        sameHit = true;
      }
    }
  }
  plus.forEach((list) => {
    if (list.length < 2) return;
    for (const n of list) {
      if (next[n]!.o !== side) {
        comboSeeds.push(n);
        plusHit = true;
      }
    }
  });

  for (const n of flipSet) next[n] = { c: next[n]!.c, o: side };
  const queue: number[] = Array.from(new Set(comboSeeds));
  for (const n of queue) {
    next[n] = { c: next[n]!.c, o: side };
    flipSet.add(n);
  }

  // COMBO cascade
  while (queue.length) {
    const q = queue.shift()!;
    const qc = getCard(next[q]!.c);
    for (const [n, mi, ti] of NEIGHBORS[q]) {
      const cell = next[n];
      if (!cell || cell.o === side) continue;
      const them = getCard(cell.c);
      if (qc.s[mi] + edge(qc, them) > them.s[ti]) {
        next[n] = { c: cell.c, o: side };
        flipSet.add(n);
        queue.push(n);
      }
    }
  }

  return {
    board: next,
    flipped: Array.from(flipSet),
    combo: sameHit && plusHit ? 'SAME+PLUS' : sameHit ? 'SAME' : plusHit ? 'PLUS' : null,
  };
}

export const emptyCells = (board: BoardState): number[] => {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) if (!board[i]) out.push(i);
  return out;
};

export const countOwned = (board: BoardState, side: Side): number => {
  let n = 0;
  for (const cell of board) if (cell && cell.o === side) n++;
  return n;
};

/** Final score differential from side 0's perspective (board + hand). */
export const scoreDiff = (board: BoardState, hand0: number, hand1: number): number =>
  countOwned(board, 0) + hand0 - (countOwned(board, 1) + hand1);

export interface PlaceMove {
  card: number;
  cell: number;
}

export const moveKey = (m: PlaceMove): string => `${m.card}@${m.cell}`;

/** Unique legal moves (dedupes duplicate card ids in hand). Ordered by cell then card id. */
export function legalMoves(board: BoardState, hand: number[]): PlaceMove[] {
  const cards = Array.from(new Set(hand)).sort((a, b) => a - b);
  const out: PlaceMove[] = [];
  for (const cell of emptyCells(board)) for (const card of cards) out.push({ card, cell });
  return out;
}

export const removeOne = (hand: number[], card: number): number[] => {
  const i = hand.indexOf(card);
  if (i < 0) return hand.slice();
  return [...hand.slice(0, i), ...hand.slice(i + 1)];
};

// ---------------------------------------------------------------------------
// Search (negamax + alpha-beta). Value is always from side 0's perspective * sign.
// ---------------------------------------------------------------------------
export interface SearchState {
  board: BoardState;
  hands: [number[], number[]];
  toMove: Side;
}

const isTerminal = (s: SearchState): boolean =>
  emptyCells(s.board).length === 0 || s.hands[s.toMove].length === 0;

const evalState = (s: SearchState): number => scoreDiff(s.board, s.hands[0].length, s.hands[1].length);

export function applyMove(s: SearchState, m: PlaceMove): SearchState {
  const res = applyPlacement(s.board, m.cell, m.card, s.toMove);
  const hands: [number[], number[]] = [s.hands[0], s.hands[1]];
  hands[s.toMove] = removeOne(s.hands[s.toMove], m.card);
  return { board: res.board, hands, toMove: (1 - s.toMove) as Side };
}

/** Returns value from side-to-move perspective. depth = Infinity for exact solve. */
export function negamax(s: SearchState, depth: number, alpha: number, beta: number): number {
  const sign = s.toMove === 0 ? 1 : -1;
  if (depth === 0 || isTerminal(s)) return sign * evalState(s);
  let best = -Infinity;
  for (const m of legalMoves(s.board, s.hands[s.toMove])) {
    const v = -negamax(applyMove(s, m), depth - 1, -beta, -alpha);
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/** Exact (or depth-limited) value of every root move, from the mover's perspective. */
export function scoreRootMoves(s: SearchState, depth = Infinity): Array<PlaceMove & { v: number }> {
  return legalMoves(s.board, s.hands[s.toMove]).map((m) => ({
    ...m,
    v: -negamax(applyMove(s, m), depth - 1, -Infinity, Infinity),
  }));
}

/** Immediate material gain of a move for the mover (cells flipped + 0). */
export function immediateGain(board: BoardState, m: PlaceMove, side: Side): number {
  return applyPlacement(board, m.cell, m.card, side).flipped.length;
}

/** Greedy rule-AI move: max immediate flips, ties -> strongest card, then lowest index. */
export function greedyMove(board: BoardState, hand: number[], side: Side): PlaceMove | null {
  let best: PlaceMove | null = null;
  let bestScore = -Infinity;
  for (const m of legalMoves(board, hand)) {
    const score = immediateGain(board, m, side) * 1000 - getCard(m.card).power;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Observation helpers (shared by prompts and UI)
// ---------------------------------------------------------------------------
export interface CardView {
  id: number;
  name: string;
  n: number;
  e: number;
  s: number;
  w: number;
  el: string;
  rarity: BenchRarity;
}

export const cardView = (id: number): CardView => {
  const c = getCard(id);
  return { id: c.id, name: c.name, n: c.s[0], e: c.s[1], s: c.s[2], w: c.s[3], el: c.el, rarity: c.r };
};

export type CellView = (CardView & { owner: 'you' | 'opponent' }) | null;

export const boardView = (board: BoardState): CellView[] =>
  board.map((cell) => (cell ? { ...cardView(cell.c), owner: cell.o === 0 ? 'you' : 'opponent' } : null));

// ---------------------------------------------------------------------------
// Hashing (FNV-1a 64-bit as hex) - fingerprint for logs, not a security primitive.
// ---------------------------------------------------------------------------
export function fingerprint(text: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x5bd1e995) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`.toUpperCase();
}
