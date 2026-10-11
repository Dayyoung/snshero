/**
 * SHBP-3 puzzle generator.
 *   npx tsx scripts/bench/generate-puzzles.ts [--per 20] [--base 3101]
 * Produces src/content/benchPuzzles.json with exact negamax values for every legal move.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SearchState,
  Side,
  applyMove,
  createPrng,
  deriveSeed,
  drawCard,
  emptyCells,
  greedyMove,
  legalMoves,
  moveKey,
  pickOne,
  scoreRootMoves,
  getCard,
  immediateGain,
} from '../../src/lib/bench/core';
import type { BenchPuzzle, PuzzleDifficulty, PuzzleSet } from '../../src/lib/bench/puzzles';

const arg = (name: string, fallback: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const PER = Number(arg('per', '20'));
const BASE = Number(arg('base', '3101'));
const SET_NAME = `public-v1`;

const buckets: Record<PuzzleDifficulty, BenchPuzzle[]> = { easy: [], medium: [], hard: [] };
const started = Date.now();
let attempts = 0;

for (let k = 1; k < 200000 && (buckets.easy.length < PER || buckets.medium.length < PER || buckets.hard.length < PER); k++) {
  attempts++;
  const prng = createPrng(deriveSeed(BASE, k));
  const targetEmpty = pickOne(prng, [4, 5, 6, 6]);
  const hands: [number[], number[]] = [
    Array.from({ length: 5 }, () => drawCard(prng, [50, 32, 18])),
    Array.from({ length: 5 }, () => drawCard(prng, [50, 32, 18])),
  ];
  let s: SearchState = { board: Array(9).fill(null), hands, toMove: (prng() < 0.5 ? 0 : 1) as Side };
  while (emptyCells(s.board).length > targetEmpty || s.toMove !== 0) {
    if (emptyCells(s.board).length <= 2 || s.hands[s.toMove].length === 0) break;
    const moves = legalMoves(s.board, s.hands[s.toMove]);
    const m = prng() < 0.65 ? greedyMove(s.board, s.hands[s.toMove], s.toMove)! : pickOne(prng, moves);
    s = applyMove(s, m);
  }
  if (s.toMove !== 0 || emptyCells(s.board).length < 3 || s.hands[0].length === 0) continue;

  const scored = scoreRootMoves(s);
  if (scored.length < 6) continue;
  const best = Math.max(...scored.map((m) => m.v));
  const distinct = new Set(scored.map((m) => m.v)).size;
  const bestFrac = scored.filter((m) => m.v === best).length / scored.length;
  if (distinct < 2 || bestFrac > 0.34) continue;

  const values: Record<string, number> = {};
  scored.forEach((m) => (values[moveKey(m)] = m.v));

  const g = greedyMove(s.board, s.hands[0], 0)!;
  const greedyOk = values[moveKey(g)] === best;
  const d2 = scoreRootMoves(s, 2).sort(
    (a, b) => b.v - a.v || immediateGain(s.board, b, 0) - immediateGain(s.board, a, 0) || getCard(a.card).power - getCard(b.card).power,
  )[0];
  const d2Ok = values[moveKey(d2)] === best;
  const difficulty: PuzzleDifficulty = greedyOk ? 'easy' : d2Ok ? 'medium' : 'hard';
  if (buckets[difficulty].length >= PER) continue;

  buckets[difficulty].push({
    id: '',
    difficulty,
    board: s.board.map((c) => (c ? [c.c, c.o] : null)),
    hand: s.hands[0].slice(),
    oppHand: s.hands[1].slice(),
    values,
    best,
  });
}

const puzzles: BenchPuzzle[] = [];
(['easy', 'medium', 'hard'] as PuzzleDifficulty[]).forEach((d) => {
  buckets[d].forEach((p, i) => puzzles.push({ ...p, id: `${d[0].toUpperCase()}${String(i + 1).padStart(2, '0')}` }));
});

const set: PuzzleSet = {
  version: 'SHBP-3',
  name: SET_NAME,
  generatedWith: `generate-puzzles.ts base=${BASE} per=${PER} attempts=${attempts}`,
  puzzles,
};
const out = resolve(process.cwd(), 'src/content/benchPuzzles.json');
writeFileSync(out, JSON.stringify(set) + '\n');
console.log(
  `wrote ${puzzles.length} puzzles (easy ${buckets.easy.length}, medium ${buckets.medium.length}, hard ${buckets.hard.length}) in ${Date.now() - started}ms after ${attempts} attempts -> ${out}`,
);
