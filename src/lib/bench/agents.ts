/**
 * SHBP-3 Reference Agents (baselines used for normalisation)
 *  - random : uniform over legal actions                     -> anchor 0
 *  - greedy : the in-game rule AI (max immediate captures)    -> reference
 *  - expert : privileged search agent (sees hidden hand)      -> anchor 100
 */
import { BenchCard, PlaceMove, Prng, createPrng, getCard, immediateGain, moveKey, scoreRootMoves, emptyCells } from './core';
import { BenchAction, CampaignEnv, CampaignRequest, DECK_SIZE, PACKS, ShopChoice } from './campaign';
import { BenchPuzzle, PuzzleView } from './puzzles';

export type DecisionRequest = { kind: 'puzzle'; puzzle: PuzzleView; legal: PlaceMove[] } | CampaignRequest;

export interface DecisionContext {
  /** Only populated for privileged reference agents. */
  puzzle?: BenchPuzzle;
  env?: CampaignEnv;
}

export interface BenchAgent {
  id: string;
  label: string;
  provider: string;
  model: string;
  privileged?: boolean;
  decide(req: DecisionRequest, ctx: DecisionContext): Promise<BenchAction | null> | BenchAction | null;
}

export interface SyncAgent extends Omit<BenchAgent, 'decide'> {
  decide(req: DecisionRequest, ctx: DecisionContext): BenchAction | null;
}

const byPowerDesc = (a: number, b: number): number => getCard(b).power - getCard(a).power || a - b;
const topDeck = (inventory: number[]): number[] => inventory.slice().sort(byPowerDesc).slice(0, DECK_SIZE);

const place = (m: PlaceMove | undefined | null): BenchAction | null => (m ? { t: 'place', card: m.card, cell: m.cell } : null);

// ---------------------------------------------------------------------------
export function createRandomAgent(seed = 7): SyncAgent {
  const prng: Prng = createPrng(seed);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(prng() * arr.length)];
  return {
    id: `random-${seed}`,
    label: 'Random Agent',
    provider: 'baseline',
    model: 'random',
    decide(req): BenchAction | null {
      if (req.kind === 'puzzle' || req.kind === 'place') return place(pick(req.legal));
      if (req.kind === 'shop') return { t: 'shop', pack: pick(req.legal) };
      const inv = req.obs.inventory.map((c) => c.id);
      for (let i = inv.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [inv[i], inv[j]] = [inv[j], inv[i]];
      }
      return { t: 'deck', cards: inv.slice(0, DECK_SIZE) };
    },
  };
}

// ---------------------------------------------------------------------------
function greedyPick(req: { legal: PlaceMove[] }, boardCells: Array<{ id: number; owner: 'you' | 'opponent' } | null>): PlaceMove | null {
  const board = boardCells.map((c) => (c ? { c: c.id, o: (c.owner === 'you' ? 0 : 1) as 0 | 1 } : null));
  let best: PlaceMove | null = null;
  let bestScore = -Infinity;
  for (const m of req.legal) {
    const s = immediateGain(board, m, 0) * 1000 - getCard(m.card).power;
    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }
  return best;
}

export function createGreedyAgent(): SyncAgent {
  return {
    id: 'greedy',
    label: 'Rule AI (greedy)',
    provider: 'baseline',
    model: 'greedy',
    decide(req): BenchAction | null {
      if (req.kind === 'puzzle') return place(greedyPick(req, req.puzzle.board));
      if (req.kind === 'place') return place(greedyPick(req, req.obs.board));
      if (req.kind === 'shop') return { t: 'shop', pack: req.legal.includes('silver') ? 'silver' : 'skip' };
      return { t: 'deck', cards: topDeck(req.obs.inventory.map((c) => c.id)) };
    },
  };
}

// ---------------------------------------------------------------------------
export function createExpertAgent(): SyncAgent {
  return {
    id: 'expert',
    label: 'Expert Oracle (privileged)',
    provider: 'baseline',
    model: 'expert',
    privileged: true,
    decide(req, ctx): BenchAction | null {
      if (req.kind === 'puzzle') {
        const p = ctx.puzzle;
        if (!p) return place(req.legal[0]);
        const best = req.legal.find((m) => p.values[moveKey(m)] === p.best);
        return place(best || req.legal[0]);
      }
      if (req.kind === 'place') {
        const env = ctx.env;
        if (!env) return place(req.legal[0]);
        const board = req.obs.board.map((c) => (c ? { c: c.id, o: (c.owner === 'you' ? 0 : 1) as 0 | 1 } : null));
        const hand = req.obs.yourHand.map((c) => c.id);
        const oppHand = env.privileged().oppHand;
        const empties = emptyCells(board).length;
        const depth = empties <= 6 ? Infinity : 3;
        const scored = scoreRootMoves({ board, hands: [hand, oppHand], toMove: 0 }, depth);
        scored.sort(
          (a, b) =>
            b.v - a.v ||
            immediateGain(board, b, 0) - immediateGain(board, a, 0) ||
            getCard(a.card).power - getCard(b.card).power ||
            a.cell - b.cell,
        );
        return place(scored[0]);
      }
      if (req.kind === 'shop') {
        const remaining = req.obs.matchesRemaining;
        let pack: ShopChoice = 'skip';
        if (remaining >= 2 && req.legal.includes('gold')) pack = 'gold';
        else if (remaining >= 6 && req.legal.includes('silver') && req.obs.sns - PACKS.silver.price >= 0) {
          const weakest = Math.min(...req.obs.deck.map((c) => c.n + c.e + c.s + c.w));
          if (weakest < 20) pack = 'silver';
        }
        return { t: 'shop', pack };
      }
      return { t: 'deck', cards: topDeck(req.obs.inventory.map((c) => c.id)) };
    },
  };
}

export const cardPower = (c: BenchCard): number => c.power;
