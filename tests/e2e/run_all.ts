#!/usr/bin/env tsx
/**
 * SNSHero Hash-Based SPA Migration & Full Feature Parity Master 4-Tier E2E Test Runner.
 *
 * Usage:
 *   npx tsx tests/e2e/run_all.ts
 *   npx tsx tests/e2e/run_all.ts --tier 1
 *   npx tsx tests/e2e/run_all.ts --tier 2
 *   npx tsx tests/e2e/run_all.ts --tier 3
 *   npx tsx tests/e2e/run_all.ts --tier 4
 *   npx tsx tests/e2e/run_all.ts --milestone M1
 *   npx tsx tests/e2e/run_all.ts --milestone M2
 *   npx tsx tests/e2e/run_all.ts --milestone M3
 *   npx tsx tests/e2e/run_all.ts --milestone M4
 *   npx tsx tests/e2e/run_all.ts --milestone M5
 *   npx tsx tests/e2e/run_all.ts --milestone M6
 *   npx tsx tests/e2e/run_all.ts --milestone ALL
 *   npx tsx tests/e2e/run_all.ts --verbose
 *   npx tsx tests/e2e/run_all.ts --json
 *   npx tsx tests/e2e/run_all.ts --allow-fail
 */

import { runTier1Tests } from './tier1_feature_coverage';
import { runTier2Tests } from './tier2_boundary_corner';
import { runTier3Tests } from './tier3_cross_feature';
import { runTier4Tests } from './tier4_realworld_workload';
import { RunOptions, TestResult, MilestoneType } from './types';
import { REPO_ROOT } from './helpers';

// ANSI terminal colors
const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const CYAN = '\x1b[96m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function parseCliArgs(): RunOptions {
  const args = process.argv.slice(2);
  const options: RunOptions = {
    milestone: 'ALL',
    verbose: false,
    json: false,
    allowFail: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--tier' && args[i + 1]) {
      options.tier = parseInt(args[++i], 10);
    } else if (arg === '--milestone' && args[i + 1]) {
      options.milestone = args[++i].toUpperCase() as MilestoneType;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--allow-fail') {
      options.allowFail = true;
    }
  }

  return options;
}

function printBanner(options: RunOptions) {
  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  SNSHero Hash-Based SPA Migration & Full Feature Parity E2E Runner   ${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`Working Directory : ${REPO_ROOT}`);
  console.log(`Target Scope      : Hash Routes, Idle Auto-Play, Gameplay Parity, Shop & AdSense`);
  const tierStr = options.tier ? `TIER ${options.tier}` : 'ALL TIERS (1..4)';
  const msStr = options.milestone || 'ALL';
  console.log(`Execution Scope   : ${tierStr} | Milestone: ${msStr}`);
  console.log(`Verbose Logging   : ${options.verbose}\n`);
}

function printResultLine(res: TestResult, verbose: boolean) {
  let badge: string;
  if (res.status === 'PASS') {
    badge = `${GREEN}✓ PASS${RESET}`;
  } else if (res.status === 'WARN') {
    badge = `${YELLOW}⚠ WARN${RESET}`;
  } else {
    badge = `${RED}✗ FAIL${RESET}`;
  }

  const durationStr = `(${res.durationMs.toFixed(1)}ms)`;
  console.log(`  [${res.testId}] [${res.milestone}] ${res.name.padEnd(52)} ${badge} ${durationStr}`);
  if (res.status !== 'PASS' || verbose) {
    if (res.message) {
      console.log(`    ${YELLOW}↳ ${res.message}${RESET}`);
    }
    if (res.details && res.details.length > 0) {
      for (const d of res.details) {
        console.log(`      ${d}`);
      }
    }
  }
}

async function main() {
  const options = parseCliArgs();
  const startTime = performance.now();

  if (!options.json) {
    printBanner(options);
  }

  let allResults: TestResult[] = [];

  // Run selected tiers
  if (!options.tier || options.tier === 1) {
    if (!options.json) console.log(`${BOLD}=== [TIER 1] Feature Coverage & Interface Contracts ===${RESET}`);
    const t1 = await runTier1Tests();
    for (const r of t1) {
      if (!options.json && (options.milestone === 'ALL' || r.milestone === options.milestone)) {
        printResultLine(r, !!options.verbose);
      }
    }
    allResults = allResults.concat(t1);
    if (!options.json) console.log('');
  }

  if (!options.tier || options.tier === 2) {
    if (!options.json) console.log(`${BOLD}=== [TIER 2] Boundary Value Analysis & Corner Cases ===${RESET}`);
    const t2 = await runTier2Tests();
    for (const r of t2) {
      if (!options.json && (options.milestone === 'ALL' || r.milestone === options.milestone)) {
        printResultLine(r, !!options.verbose);
      }
    }
    allResults = allResults.concat(t2);
    if (!options.json) console.log('');
  }

  if (!options.tier || options.tier === 3) {
    if (!options.json) console.log(`${BOLD}=== [TIER 3] Pairwise Combinations & State Machine ===${RESET}`);
    const t3 = await runTier3Tests();
    for (const r of t3) {
      if (!options.json && (options.milestone === 'ALL' || r.milestone === options.milestone)) {
        printResultLine(r, !!options.verbose);
      }
    }
    allResults = allResults.concat(t3);
    if (!options.json) console.log('');
  }

  if (!options.tier || options.tier === 4) {
    if (!options.json) console.log(`${BOLD}=== [TIER 4] Real-World Workload Scenarios ===${RESET}`);
    const t4 = await runTier4Tests();
    for (const r of t4) {
      if (!options.json && (options.milestone === 'ALL' || r.milestone === options.milestone)) {
        printResultLine(r, !!options.verbose);
      }
    }
    allResults = allResults.concat(t4);
    if (!options.json) console.log('');
  }

  // Filter results if milestone is specified
  const filteredResults = options.milestone && options.milestone !== 'ALL'
    ? allResults.filter(r => r.milestone === options.milestone)
    : allResults;

  const passed = filteredResults.filter(r => r.status === 'PASS').length;
  const failed = filteredResults.filter(r => r.status === 'FAIL').length;
  const total = filteredResults.length;
  const totalDuration = performance.now() - startTime;

  if (options.json) {
    const report = {
      summary: {
        total,
        passed,
        failed,
        passRate: total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '0%',
        durationMs: totalDuration,
      },
      results: filteredResults,
    };
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`${BOLD}${CYAN}----------------------------------------------------------------------${RESET}`);
    console.log(`${BOLD}TEST EXECUTION SUMMARY${RESET}`);
    console.log(`${BOLD}${CYAN}----------------------------------------------------------------------${RESET}`);
    console.log(`Total Assertions Run : ${total}`);
    console.log(`Passed               : ${GREEN}${passed}${RESET}`);
    console.log(`Failed               : ${failed > 0 ? RED + failed + RESET : '0'}`);
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';
    console.log(`Pass Rate            : ${passRate === '100.0' ? GREEN : YELLOW}${passRate}%${RESET}`);
    console.log(`Total Duration       : ${(totalDuration / 1000).toFixed(2)}s\n`);
  }

  if (failed > 0 && !options.allowFail) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error executing test runner:', err);
  process.exit(1);
});
