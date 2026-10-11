/**
 * SHBP-3 Runner & Replay Verifier
 *  - runBenchmark(): drives any (possibly async, LLM-backed) agent and records an action log.
 *  - verifyLog():    replays a log from scratch and recomputes every metric. Scores are never
 *                    self-reported; they are derived only from the recorded actions.
 */
import { PlaceMove, SHBP_VERSION, deriveSeed, fingerprint } from './core';
import { BenchAction, CampaignEnv, CampaignOutcome } from './campaign';
import { BenchAgent, SyncAgent, createExpertAgent, createRandomAgent } from './agents';
import { BenchPuzzle, PuzzleDifficulty, PuzzleSet, gradePuzzle, puzzleLegalMoves, puzzleView } from './puzzles';

export const PUBLIC_SEEDS = [20261011, 20261012, 20261013];
export const DEFAULT_MATCHES = 20;
export const RANDOM_ANCHOR_RUNS = 5;

export interface BenchLog {
  version: typeof SHBP_VERSION;
  puzzleSet: string;
  agent: { label: string; provider: string; model: string; privileged?: boolean };
  createdAt: string;
  puzzleAnswers: Record<string, PlaceMove | null>;
  campaigns: Array<{ seed: number; matches: number; actions: Array<BenchAction | null> }>;
  meta?: {
    durationMs?: number;
    calls?: number;
    inputTokens?: number;
    outputTokens?: number;
    parseFailures?: number;
    notes?: string;
  };
}

export interface CampaignAnchor {
  random: number;
  expert: number;
}
export type AnchorTable = Record<string, CampaignAnchor>; // key: `${seed}:${matches}`

export const anchorKey = (seed: number, matches: number): string => `${seed}:${matches}`;

export interface BenchResult {
  version: string;
  agent: BenchLog['agent'];
  logHash: string;
  shbp: number;
  ci95: number | null;
  puzzle: {
    n: number;
    correct: number;
    accuracy: number;
    normalized: number;
    se: number | null;
    regretAvg: number;
    invalid: number;
    byDifficulty: Record<PuzzleDifficulty, { n: number; correct: number }>;
  };
  campaign: {
    normalized: number;
    se: number | null;
    invalid: number;
    decisions: number;
    totals: { win: number; draw: number; loss: number };
    perSeed: Array<CampaignOutcome & CampaignAnchor & { normalized: number }>;
  };
}

export interface ProgressInfo {
  stage: 'puzzle' | 'campaign' | 'anchor';
  done: number;
  total: number;
  label: string;
}

const yieldUi = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

// ---------------------------------------------------------------------------
// Running
// ---------------------------------------------------------------------------
export async function runBenchmark(
  agent: BenchAgent,
  puzzleSet: PuzzleSet,
  opts: { seeds?: number[]; matches?: number; puzzleLimit?: number; onProgress?: (p: ProgressInfo) => void } = {},
): Promise<BenchLog> {
  const seeds = opts.seeds ?? PUBLIC_SEEDS;
  const matches = opts.matches ?? DEFAULT_MATCHES;
  const puzzles = puzzleSet.puzzles.slice(0, opts.puzzleLimit ?? puzzleSet.puzzles.length);
  const started = Date.now();
  const log: BenchLog = {
    version: SHBP_VERSION,
    puzzleSet: puzzleSet.name,
    agent: { label: agent.label, provider: agent.provider, model: agent.model, privileged: agent.privileged || undefined },
    createdAt: new Date().toISOString(),
    puzzleAnswers: {},
    campaigns: [],
  };

  for (let i = 0; i < puzzles.length; i++) {
    const p = puzzles[i];
    const legal = puzzleLegalMoves(p);
    const action = await agent.decide({ kind: 'puzzle', puzzle: puzzleView(p), legal }, agent.privileged ? { puzzle: p } : {});
    log.puzzleAnswers[p.id] = action && action.t === 'place' ? { card: action.card, cell: action.cell } : null;
    opts.onProgress?.({ stage: 'puzzle', done: i + 1, total: puzzles.length, label: p.id });
    if (i % 10 === 9) await yieldUi();
  }

  for (let s = 0; s < seeds.length; s++) {
    const env = new CampaignEnv(seeds[s], matches);
    const actions: Array<BenchAction | null> = [];
    let req = env.pending();
    let steps = 0;
    while (req) {
      const action = await agent.decide(req, agent.privileged ? { env } : {});
      actions.push(action ?? null);
      env.apply(action);
      req = env.pending();
      if (++steps % 8 === 0) {
        opts.onProgress?.({ stage: 'campaign', done: s, total: seeds.length, label: `seed ${seeds[s]} · match ${env.snapshot().match}/${matches}` });
        await yieldUi();
      }
    }
    log.campaigns.push({ seed: seeds[s], matches, actions });
    opts.onProgress?.({ stage: 'campaign', done: s + 1, total: seeds.length, label: `seed ${seeds[s]}` });
  }

  log.meta = { ...(log.meta || {}), durationMs: Date.now() - started };
  return log;
}

export function playCampaignSync(agent: SyncAgent, seed: number, matches: number): CampaignOutcome {
  const env = new CampaignEnv(seed, matches);
  let req = env.pending();
  while (req) {
    env.apply(agent.decide(req, agent.privileged ? { env } : {}));
    req = env.pending();
  }
  return env.outcome();
}

export function computeAnchor(seed: number, matches: number): CampaignAnchor {
  let sum = 0;
  for (let k = 0; k < RANDOM_ANCHOR_RUNS; k++) {
    sum += playCampaignSync(createRandomAgent(deriveSeed(seed, 1000 + k)), seed, matches).score;
  }
  return {
    random: Math.round((sum / RANDOM_ANCHOR_RUNS) * 100) / 100,
    expert: playCampaignSync(createExpertAgent(), seed, matches).score,
  };
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const stdErr = (xs: number[]): number | null => {
  if (xs.length < 2) return null;
  const m = mean(xs);
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v / xs.length);
};
const round1 = (x: number): number => Math.round(x * 10) / 10;

export function canonicalLog(log: BenchLog): string {
  return JSON.stringify({
    version: log.version,
    puzzleSet: log.puzzleSet,
    agent: log.agent,
    puzzleAnswers: Object.keys(log.puzzleAnswers)
      .sort()
      .map((k) => [k, log.puzzleAnswers[k]]),
    campaigns: log.campaigns,
  });
}

export function validateLogShape(raw: unknown): raw is BenchLog {
  if (!raw || typeof raw !== 'object') return false;
  const l = raw as Partial<BenchLog>;
  return (
    l.version === SHBP_VERSION &&
    typeof l.puzzleSet === 'string' &&
    !!l.agent &&
    typeof l.puzzleAnswers === 'object' &&
    Array.isArray(l.campaigns)
  );
}

export function verifyLog(log: BenchLog, puzzleSet: PuzzleSet, anchors: AnchorTable = {}): BenchResult {
  if (log.puzzleSet !== puzzleSet.name) throw new Error(`Puzzle set mismatch: ${log.puzzleSet} != ${puzzleSet.name}`);

  // Puzzle track - graded against every puzzle in the set (missing answers count as wrong).
  const byDifficulty: Record<PuzzleDifficulty, { n: number; correct: number }> = {
    easy: { n: 0, correct: 0 },
    medium: { n: 0, correct: 0 },
    hard: { n: 0, correct: 0 },
  };
  const grades = puzzleSet.puzzles.map((p: BenchPuzzle) => {
    const g = gradePuzzle(p, log.puzzleAnswers[p.id]);
    byDifficulty[p.difficulty].n++;
    if (g.correct) byDifficulty[p.difficulty].correct++;
    return g;
  });
  const pNorm = grades.map((g) => g.normalized * 100);
  const pSe = stdErr(pNorm);

  // Campaign track - full deterministic replay.
  const perSeed = log.campaigns.map((c) => {
    const env = new CampaignEnv(c.seed, c.matches);
    let i = 0;
    while (!env.done) {
      env.apply(i < c.actions.length ? c.actions[i] : null);
      i++;
    }
    const outcome = env.outcome();
    const anchor = anchors[anchorKey(c.seed, c.matches)] ?? computeAnchor(c.seed, c.matches);
    const span = anchor.expert - anchor.random;
    const normalized = span > 0 ? ((outcome.score - anchor.random) / span) * 100 : 0;
    return { ...outcome, ...anchor, normalized: round1(normalized) };
  });
  const cNormList = perSeed.map((s) => s.normalized);
  const cSe = stdErr(cNormList);

  const P = mean(pNorm);
  const C = mean(cNormList);
  const shbp = 0.5 * P + 0.5 * C;
  const combinedSe = pSe !== null && cSe !== null ? 0.5 * Math.sqrt(pSe ** 2 + cSe ** 2) : null;

  return {
    version: log.version,
    agent: log.agent,
    logHash: fingerprint(canonicalLog(log)),
    shbp: round1(shbp),
    ci95: combinedSe !== null ? round1(1.96 * combinedSe) : null,
    puzzle: {
      n: grades.length,
      correct: grades.filter((g) => g.correct).length,
      accuracy: round1((grades.filter((g) => g.correct).length / Math.max(1, grades.length)) * 100),
      normalized: round1(P),
      se: pSe !== null ? round1(pSe) : null,
      regretAvg: Math.round(mean(grades.map((g) => g.regret)) * 100) / 100,
      invalid: grades.filter((g) => !g.valid).length,
      byDifficulty,
    },
    campaign: {
      normalized: round1(C),
      se: cSe !== null ? round1(cSe) : null,
      invalid: perSeed.reduce((a, s) => a + s.invalid, 0),
      decisions: perSeed.reduce((a, s) => a + s.decisions, 0),
      totals: {
        win: perSeed.reduce((a, s) => a + s.win, 0),
        draw: perSeed.reduce((a, s) => a + s.draw, 0),
        loss: perSeed.reduce((a, s) => a + s.loss, 0),
      },
      perSeed,
    },
  };
}
