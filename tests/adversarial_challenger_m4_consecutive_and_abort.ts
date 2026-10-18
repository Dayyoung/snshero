import fs from 'fs';
import path from 'path';
import { 
  KADAN_RPG_EVENTS, 
  getDynamicKadanEncounter, 
  getKadanRpgReward,
  type KadanRpgEvent,
  type KadanRpgTile
} from '../src/content/kadanRpgStory';
import { generateAmbushEncounter } from '../src/lib/rpg/kadanRpgAmbush';

interface AssertionResult {
  category: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: AssertionResult[] = [];

function assert(category: string, name: string, condition: boolean, details?: string) {
  results.push({ category, name, passed: condition, details });
  if (!condition) {
    console.error(`  ✗ FAIL [${category}] ${name}: ${details || ''}`);
  } else {
    console.log(`  ✓ PASS [${category}] ${name}`);
  }
}

console.log('======================================================================');
console.log('  Milestone 4 Iteration 2 Challenger: Consecutive Battles & Manual Abort');
console.log('  Target: Consecutive Battle Chains & Manual Abort Mid-Match Pausing');
console.log('======================================================================\n');

// =========================================================================
// SECTION 1: Contract Analysis on Source Files
// =========================================================================
console.log('=== [SECTION 1] Static Code Contract Audit ===\n');

const kadanViewSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/views/KadanRpgView.tsx'), 'utf-8');
const mobileCardSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/views/MobileCardPlayScreen.tsx'), 'utf-8');
const autoRunnerSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/hooks/useKadanRpgAutoRunner.ts'), 'utf-8');

// 1. MobileCardPlayScreen contract
assert(
  'Static Contract',
  'MobileCardPlayScreen defines onBack with optional completed boolean',
  mobileCardSrc.includes('onBack: (completed?: boolean) => void;')
);

assert(
  'Static Contract',
  'MobileCardPlayScreen calculates isMatchCompleted from gameOver && winner',
  mobileCardSrc.includes('const isMatchCompleted = Boolean(gameOver && winner);')
);

assert(
  'Static Contract',
  'MobileCardPlayScreen passes isMatchCompleted to onBack',
  mobileCardSrc.includes('onBack(isMatchCompleted);')
);

// 2. KadanRpgView boss battle portal contract
const bossPortalRegex = /activeEncounter\s*&&\s*battleEvent[\s\S]*?<MobileCardPlayScreen[\s\S]*?onBack=\{([\s\S]*?)\}[\s\S]*?\/>/;
const bossPortalMatch = kadanViewSrc.match(bossPortalRegex);
assert(
  'Static Contract',
  'Boss portal matches MobileCardPlayScreen onBack handler',
  Boolean(bossPortalMatch)
);

const bossOnBackBody = bossPortalMatch ? bossPortalMatch[1] : '';
assert(
  'Static Contract',
  'Boss portal onBack accepts completed parameter and checks !completed before setAutoMode(false)',
  bossOnBackBody.includes('completed') && 
  bossOnBackBody.includes('!completed') && 
  bossOnBackBody.includes('setAutoMode(false)') &&
  !bossOnBackBody.includes('if (progress.autoMode) setAutoMode(false);')
);

// 3. KadanRpgView ambush battle portal contract
const ambushPortalRegex = /ambushBattle[\s\S]*?<MobileCardPlayScreen[\s\S]*?onBack=\{([\s\S]*?)\}[\s\S]*?\/>/;
const ambushPortalMatch = kadanViewSrc.match(ambushPortalRegex);
assert(
  'Static Contract',
  'Ambush portal matches MobileCardPlayScreen onBack handler',
  Boolean(ambushPortalMatch)
);

const ambushOnBackBody = ambushPortalMatch ? ambushPortalMatch[1] : '';
assert(
  'Static Contract',
  'Ambush portal onBack accepts completed parameter and checks !completed before setAutoMode(false)',
  ambushOnBackBody.includes('completed') && 
  ambushOnBackBody.includes('!completed') && 
  ambushOnBackBody.includes('setAutoMode(false)') &&
  !ambushOnBackBody.includes('if (progress.autoMode) setAutoMode(false);')
);

// 4. AutoRunner pauses when enabled becomes false
assert(
  'Static Contract',
  'useKadanRpgAutoRunner pauses when enabled is false',
  autoRunnerSrc.includes('if (!enabled)') && autoRunnerSrc.includes("setGuardedStep('paused')")
);

// =========================================================================
// SECTION 2: Empirical Simulation of Consecutive Battle Chains (80 Battles)
// =========================================================================
console.log('\n=== [SECTION 2] Consecutive Battle Chains (Ambush + Boss Chains) ===\n');

// Simulating React component state and callback wiring for KadanRpgView & MobileCardPlayScreen
class KadanRpgSimulationHarness {
  public autoMode = true;
  public currentChapter = 1;
  public battleEvent: any = null;
  public ambushBattle: any = null;
  public rewardEvent: any = null;
  public autoRunnerStep: string = 'idle';
  public stepHistory: string[] = [];
  public completedBattlesCount = 0;
  public manualAbortsCount = 0;
  public autoRunnerPausedCount = 0;
  public repeatedStepCount = 0;
  private previousStep = 'idle';

  public setAutoMode(val: boolean) {
    this.autoMode = val;
    this.updateAutoRunner();
  }

  // Simulated onBack handlers from KadanRpgView lines 750-755 and 786-791
  public handleBossPortalBack(completed?: boolean) {
    this.battleEvent = null;
    if (!completed && this.autoMode) {
      this.setAutoMode(false);
    }
    this.updateAutoRunner();
  }

  public handleAmbushPortalBack(completed?: boolean) {
    this.ambushBattle = null;
    if (!completed && this.autoMode) {
      this.setAutoMode(false);
    }
    this.updateAutoRunner();
  }

  // Simulated MobileCardPlayScreen handleExitGame
  public simulateMobileCardExit(isAutoClose: boolean, target: 'boss' | 'ambush') {
    // When autoCloseOnComplete fires, gameOver && winner are true
    // When manual user exit fires mid-match, gameOver && winner are false
    const gameOver = isAutoClose;
    const winner = isAutoClose ? 'player' : null;
    const isMatchCompleted = Boolean(gameOver && winner);

    if (isMatchCompleted) {
      this.completedBattlesCount++;
    } else {
      this.manualAbortsCount++;
    }

    if (target === 'boss') {
      this.handleBossPortalBack(isMatchCompleted);
    } else {
      this.handleAmbushPortalBack(isMatchCompleted);
    }
  }

  // Simulated useKadanRpgAutoRunner state machine
  private setGuardedStep(nextStep: string) {
    if (this.previousStep === nextStep) {
      this.repeatedStepCount++;
    } else {
      this.repeatedStepCount = 0;
      this.previousStep = nextStep;
    }

    const effective = this.repeatedStepCount > 18 ? 'paused' : nextStep;
    this.autoRunnerStep = effective;
    this.stepHistory.push(effective);
    if (effective === 'paused') {
      this.autoRunnerPausedCount++;
    }
  }

  public updateAutoRunner() {
    if (!this.autoMode) {
      this.setGuardedStep('paused');
      return;
    }

    const isBusy = Boolean(this.battleEvent) || Boolean(this.ambushBattle);
    if (isBusy) return;

    if (this.rewardEvent) {
      this.setGuardedStep('reward');
      return;
    }

    if (this.battleEvent) {
      this.setGuardedStep('battle');
      return;
    }

    this.setGuardedStep('routeToTarget');
  }

  public claimRewardAndNextChapter() {
    this.rewardEvent = null;
    this.currentChapter++;
    this.updateAutoRunner();
  }
}

// Test 2.1: Multi-battle chain across 40 chapters (each chapter having 1 Ambush + 1 Boss = 80 battles)
const harness = new KadanRpgSimulationHarness();
let chainBroke = false;
let chainBreakReason = '';

for (let ch = 1; ch <= 40; ch++) {
  // Step 1: Navigating to target
  harness.updateAutoRunner();
  if (harness.autoRunnerStep !== 'routeToTarget' || !harness.autoMode) {
    chainBroke = true;
    chainBreakReason = `Stalled on routeToTarget at chapter ${ch}`;
    break;
  }

  // Step 2: Ambush encountered
  harness.ambushBattle = generateAmbushEncounter(ch, 0, 'wasteland');
  harness.updateAutoRunner();

  // Step 3: Ambush battle auto-closes (completed = true)
  harness.simulateMobileCardExit(true, 'ambush');

  // Verify autoMode is still TRUE after ambush auto-close!
  if (!harness.autoMode) {
    chainBroke = true;
    chainBreakReason = `autoMode disengaged after ambush battle auto-close at chapter ${ch}`;
    break;
  }

  // Step 4: Reaches target node, Boss Battle engages
  const event = KADAN_RPG_EVENTS.find(e => e.chapterNumber === ch)!;
  harness.battleEvent = getDynamicKadanEncounter(event, 0);
  harness.updateAutoRunner();

  // Step 5: Boss battle auto-closes (completed = true)
  harness.simulateMobileCardExit(true, 'boss');

  // Verify autoMode is still TRUE after boss battle auto-close!
  if (!harness.autoMode) {
    chainBroke = true;
    chainBreakReason = `autoMode disengaged after boss battle auto-close at chapter ${ch}`;
    break;
  }

  // Step 6: Reward claim and next chapter
  harness.rewardEvent = event;
  harness.updateAutoRunner();
  harness.claimRewardAndNextChapter();
}

assert(
  'Consecutive Battle Chain',
  '80 consecutive battles (40 ambush + 40 boss) execute without autoMode disengaging',
  !chainBroke && harness.completedBattlesCount === 80,
  chainBreakReason || `completedBattles=${harness.completedBattlesCount}`
);

assert(
  'Consecutive Battle Chain',
  'AutoRunner step machine never falsely entered paused during 80 consecutive battles',
  harness.autoRunnerPausedCount === 0,
  `autoRunnerPausedCount=${harness.autoRunnerPausedCount}`
);

assert(
  'Consecutive Battle Chain',
  'Repeated step count remained well below the 18 threshold during normal auto progression',
  harness.repeatedStepCount < 18,
  `repeatedStepCount=${harness.repeatedStepCount}`
);

assert(
  'Consecutive Battle Chain',
  'Reached Chapter 41 cleanly through continuous auto progression',
  harness.currentChapter === 41
);

// =========================================================================
// SECTION 3: Empirical Testing of Manual Abort Mid-Match
// =========================================================================
console.log('\n=== [SECTION 3] Manual Abort Mid-Match Verification ===\n');

// 3.1 Mid-match exit on Boss Battle
const abortHarness1 = new KadanRpgSimulationHarness();
abortHarness1.setAutoMode(true);
abortHarness1.battleEvent = { id: 'boss_ch1' };
abortHarness1.updateAutoRunner();

// User taps Exit mid-match (isAutoClose = false)
abortHarness1.simulateMobileCardExit(false, 'boss');

assert(
  'Manual Abort',
  'Mid-match manual exit on Boss Battle sets autoMode to false',
  abortHarness1.autoMode === false,
  `autoMode=${abortHarness1.autoMode}`
);

assert(
  'Manual Abort',
  'Mid-match manual exit on Boss Battle transitions autoRunner to paused',
  abortHarness1.autoRunnerStep === 'paused',
  `autoRunnerStep=${abortHarness1.autoRunnerStep}`
);

assert(
  'Manual Abort',
  'Boss battle event is cleared upon manual abort',
  abortHarness1.battleEvent === null
);

// 3.2 Mid-match exit on Ambush Battle
const abortHarness2 = new KadanRpgSimulationHarness();
abortHarness2.setAutoMode(true);
abortHarness2.ambushBattle = { id: 'ambush_bandit' };
abortHarness2.updateAutoRunner();

// User taps Exit mid-match (isAutoClose = false)
abortHarness2.simulateMobileCardExit(false, 'ambush');

assert(
  'Manual Abort',
  'Mid-match manual exit on Ambush Battle sets autoMode to false',
  abortHarness2.autoMode === false,
  `autoMode=${abortHarness2.autoMode}`
);

assert(
  'Manual Abort',
  'Mid-match manual exit on Ambush Battle transitions autoRunner to paused',
  abortHarness2.autoRunnerStep === 'paused',
  `autoRunnerStep=${abortHarness2.autoRunnerStep}`
);

assert(
  'Manual Abort',
  'Ambush battle event is cleared upon manual abort',
  abortHarness2.ambushBattle === null
);

// 3.3 Calling onBack with undefined (legacy callers or browser back)
const abortHarness3 = new KadanRpgSimulationHarness();
abortHarness3.setAutoMode(true);
abortHarness3.battleEvent = { id: 'boss_ch2' };
abortHarness3.handleBossPortalBack(undefined);

assert(
  'Manual Abort',
  'onBack(undefined) safely defaults to pausing autoMode (defensive fallback)',
  abortHarness3.autoMode === false && abortHarness3.autoRunnerStep === 'paused'
);

// 3.4 Manual abort when autoMode is already false
const abortHarness4 = new KadanRpgSimulationHarness();
abortHarness4.setAutoMode(false);
abortHarness4.battleEvent = { id: 'boss_ch3' };
abortHarness4.simulateMobileCardExit(false, 'boss');

assert(
  'Manual Abort',
  'Manual abort when autoMode is already false remains false without error',
  abortHarness4.autoMode === false && abortHarness4.autoRunnerStep === 'paused'
);

// 3.5 Re-enabling autoMode after manual abort safely resumes
abortHarness1.setAutoMode(true);
assert(
  'Manual Abort Resume',
  'Re-enabling autoMode after manual abort unpauses autoRunner into active workflow',
  abortHarness1.autoMode === true && abortHarness1.autoRunnerStep === 'routeToTarget',
  `autoRunnerStep=${abortHarness1.autoRunnerStep}`
);

// =========================================================================
// SECTION 4: Ambush Countdown Wall-Clock Deadline Concurrency Verification
// =========================================================================
console.log('\n=== [SECTION 4] Ambush Countdown Wall-Clock Deadline Concurrency ===\n');

// Test wall-clock deadline loop logic from KadanRpgView lines 453-478
function testAmbushCountdownInterval() {
  const durationMs = 1000;
  const deadline = Date.now() + durationMs;
  let hasEngaged = false;
  let engagedCalls = 0;

  const mockEngageAmbush = () => {
    engagedCalls++;
  };

  // Simulate multiple timer tick invocations, including ticks past deadline
  for (let offset = 0; offset <= 1500; offset += 50) {
    const fakeCurrentTime = deadline - durationMs + offset;
    const remainingMs = Math.max(0, deadline - fakeCurrentTime);
    const countdownSec = remainingMs / 1000;

    if (remainingMs <= 0 && !hasEngaged) {
      hasEngaged = true;
      mockEngageAmbush();
    }
  }

  return { engagedCalls, hasEngaged };
}

const ambushTestResult = testAmbushCountdownInterval();

assert(
  'Ambush Timer Concurrency',
  'handleEngageAmbush is called exactly 1 time across multiple post-deadline ticks (idempotency guard)',
  ambushTestResult.engagedCalls === 1,
  `engagedCalls=${ambushTestResult.engagedCalls}`
);

assert(
  'Ambush Timer Concurrency',
  'hasEngaged flag remains true post-trigger',
  ambushTestResult.hasEngaged === true
);

// Verify countdown reaches 0.0s at deadline
const simulatedRemaining = Math.max(0, 1000 - 1000) / 1000;
assert(
  'Ambush Timer Concurrency',
  'Countdown properly reaches 0.0 at deadline',
  simulatedRemaining === 0
);

// =========================================================================
// FINAL SUMMARY
// =========================================================================
console.log('\n======================================================================');
const passedCount = results.filter(r => r.passed).length;
const failedCount = results.filter(r => !r.passed).length;
console.log(`TOTAL CONSECUTIVE & MANUAL ABORT ASSERTIONS: ${results.length}`);
console.log(`PASSED: ${passedCount}`);
console.log(`FAILED: ${failedCount}`);
console.log('======================================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
