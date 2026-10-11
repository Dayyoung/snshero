/**
 * Generates official reference logs and the leaderboard summary for src/content/benchLeaderboard.json
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import puzzlesData from '../../src/content/benchPuzzles.json';
import type { PuzzleSet } from '../../src/lib/bench/puzzles';
import { runBenchmark, verifyLog, computeAnchor, anchorKey, PUBLIC_SEEDS, DEFAULT_MATCHES, AnchorTable, BenchResult, BenchLog } from '../../src/lib/bench/runner';
import { createGreedyAgent, createExpertAgent, createRandomAgent, BenchAgent } from '../../src/lib/bench/agents';

const puzzleSet = puzzlesData as unknown as PuzzleSet;

interface LeaderboardRecord {
  result: BenchResult;
  log: BenchLog;
}

async function main() {
  console.log('Computing anchors for public seeds...');
  const anchors: AnchorTable = {};
  for (const s of PUBLIC_SEEDS) {
    anchors[anchorKey(s, DEFAULT_MATCHES)] = computeAnchor(s, DEFAULT_MATCHES);
  }

  const agents: BenchAgent[] = [
    createExpertAgent(),
    createGreedyAgent(),
    createRandomAgent(42),
  ];

  const records: LeaderboardRecord[] = [];

  for (const agent of agents) {
    console.log(`Running benchmark for ${agent.label}...`);
    const log = await runBenchmark(agent, puzzleSet, {
      seeds: PUBLIC_SEEDS,
      matches: DEFAULT_MATCHES,
    });
    const result = verifyLog(log, puzzleSet, anchors);
    records.push({ result, log });
    console.log(` -> ${agent.label}: SHBP ${result.shbp} ± ${result.ci95} (P: ${result.puzzle.accuracy}%, C: ${result.campaign.normalized})`);
  }

  const out = resolve(process.cwd(), 'src/content/benchLeaderboard.json');
  writeFileSync(out, JSON.stringify({ version: 'SHBP-3', updatedAt: new Date().toISOString(), anchors, records }, null, 2) + '\n');
  console.log(`Saved official leaderboard to ${out}`);
}

main().catch(console.error);
