/**
 * SNSHero Revolution - Official Benchmark Engine (SHBP-3)
 *
 * Provides the verified 2-Track Benchmark Environment:
 *  - Track A: 60 Combinatorial / Minimax-solved Puzzles (Chance-corrected, zero-luck accuracy)
 *  - Track B: Campaign Season with Hidden Opponent Hand, Pack Economy, and Deck Building
 *
 * All scores are normalized:
 *  - 0   = Uniform Random baseline
 *  - ~39 = In-Game Greedy Rule AI
 *  - 100 = Game-Theoretic Expert Oracle (upper bound)
 */
import puzzlesData from '../content/benchPuzzles.json';
import leaderboardData from '../content/benchLeaderboard.json';
import type { PuzzleSet } from './bench/puzzles';
import {
  runBenchmark,
  verifyLog,
  PUBLIC_SEEDS,
  DEFAULT_MATCHES,
  BenchResult,
  BenchLog,
  AnchorTable,
} from './bench/runner';
import {
  createGreedyAgent,
  createExpertAgent,
  createRandomAgent,
  BenchAgent,
} from './bench/agents';

export const OFFICIAL_PUZZLE_SET = puzzlesData as unknown as PuzzleSet;

export const OFFICIAL_ANCHORS: AnchorTable = (leaderboardData as any).anchors || {};

export const OFFICIAL_LEADERBOARD = (leaderboardData as any).records as Array<{
  result: BenchResult;
  log: BenchLog;
}>;

// Backwards-compatibility export for older components
export interface LegacyLeaderboardEntry {
  model: string;
  badge: string;
  shbpScore: number;
  ci95: string;
  puzzleAcc: number;
  campaignNorm: number;
  hash: string;
}

export const OFFICIAL_LEADERBOARD_ENTRIES: LegacyLeaderboardEntry[] = OFFICIAL_LEADERBOARD.map((item) => ({
  model: item.result.agent.label,
  badge: item.result.agent.privileged ? 'Anchor 100' : item.result.agent.model === 'greedy' ? 'Rule AI' : 'Anchor 0',
  shbpScore: item.result.shbp,
  ci95: item.result.ci95 !== null ? `±${item.result.ci95}` : 'Exact',
  puzzleAcc: item.result.puzzle.accuracy,
  campaignNorm: item.result.campaign.normalized,
  hash: item.result.logHash,
}));

/**
 * Runs a deterministic client-side benchmark for the chosen baseline agent.
 */
export async function runOfficialBenchmark(
  agentType: 'greedy' | 'random' | 'expert' = 'greedy',
  seeds: number[] = PUBLIC_SEEDS,
  matches: number = DEFAULT_MATCHES,
  onProgress?: (progressPercent: number, label: string) => void
): Promise<{ result: BenchResult; log: BenchLog }> {
  let agent: BenchAgent;
  switch (agentType) {
    case 'random':
      agent = createRandomAgent(42);
      break;
    case 'expert':
      agent = createExpertAgent();
      break;
    case 'greedy':
    default:
      agent = createGreedyAgent();
      break;
  }

  const log = await runBenchmark(agent, OFFICIAL_PUZZLE_SET, {
    seeds,
    matches,
    onProgress: (p) => {
      if (!onProgress) return;
      const totalSteps = OFFICIAL_PUZZLE_SET.puzzles.length + seeds.length;
      const doneSteps = p.stage === 'puzzle' ? p.done : OFFICIAL_PUZZLE_SET.puzzles.length + p.done;
      const pct = Math.min(100, Math.round((doneSteps / totalSteps) * 100));
      onProgress(pct, `${p.stage.toUpperCase()}: ${p.label}`);
    },
  });

  const result = verifyLog(log, OFFICIAL_PUZZLE_SET, OFFICIAL_ANCHORS);
  return { result, log };
}

export type { BenchResult, BenchLog };
