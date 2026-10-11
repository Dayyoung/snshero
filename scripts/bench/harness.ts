/**
 * SHBP-3 CLI Harness
 * Drives real LLM APIs (Anthropic, OpenAI, Google Gemini) or local rule baselines through
 * the benchmark, recording action logs and producing verified result files.
 *
 * Usage:
 *   npx tsx scripts/bench/harness.ts --agent greedy
 *   npx tsx scripts/bench/harness.ts --agent expert
 *   npx tsx scripts/bench/harness.ts --agent random --seed 42
 *   npx tsx scripts/bench/harness.ts --agent anthropic --model claude-3-7-sonnet-20250219
 *   npx tsx scripts/bench/harness.ts --agent openai --model gpt-4o
 *   npx tsx scripts/bench/harness.ts --agent gemini --model gemini-2.5-pro
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import puzzlesData from '../../src/content/benchPuzzles.json';
import type { PuzzleSet } from '../../src/lib/bench/puzzles';
import { runBenchmark, verifyLog, computeAnchor, anchorKey, PUBLIC_SEEDS, DEFAULT_MATCHES, AnchorTable, BenchLog } from '../../src/lib/bench/runner';
import { BenchAgent, createGreedyAgent, createExpertAgent, createRandomAgent } from '../../src/lib/bench/agents';
import { renderDecision, parseDecision, SHBP_RULES_PROMPT } from '../../src/lib/bench/prompt';

const puzzleSet = puzzlesData as unknown as PuzzleSet;

function getArg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

// ---------------------------------------------------------------------------
// LLM Agent Adapters
// ---------------------------------------------------------------------------
function createAnthropicAgent(model = 'claude-3-7-sonnet-20250219'): BenchAgent {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  return {
    id: `anthropic-${model}`,
    label: `Anthropic ${model}`,
    provider: 'anthropic',
    model,
    async decide(req) {
      const prompt = renderDecision(req);
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 350,
          temperature: 0.1,
          system: SHBP_RULES_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) {
        console.error('Anthropic API error:', res.status, await res.text());
        return null;
      }
      const data = await res.json() as any;
      const text = data.content?.[0]?.text || '';
      return parseDecision(req, text);
    },
  };
}

function createOpenAIAgent(model = 'gpt-4o'): BenchAgent {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  return {
    id: `openai-${model}`,
    label: `OpenAI ${model}`,
    provider: 'openai',
    model,
    async decide(req) {
      const prompt = renderDecision(req);
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: 350,
          messages: [
            { role: 'system', content: SHBP_RULES_PROMPT },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (!res.ok) {
        console.error('OpenAI API error:', res.status, await res.text());
        return null;
      }
      const data = await res.json() as any;
      const text = data.choices?.[0]?.message?.content || '';
      return parseDecision(req, text);
    },
  };
}

function createGeminiAgent(model = 'gemini-2.5-pro'): BenchAgent {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  return {
    id: `gemini-${model}`,
    label: `Google ${model}`,
    provider: 'google',
    model,
    async decide(req) {
      const prompt = renderDecision(req);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SHBP_RULES_PROMPT }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 350 },
        }),
      });
      if (!res.ok) {
        console.error('Gemini API error:', res.status, await res.text());
        return null;
      }
      const data = await res.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseDecision(req, text);
    },
  };
}

async function main() {
  const agentType = getArg('agent', 'greedy');
  const modelName = getArg('model');
  const customSeed = getArg('seed') ? Number(getArg('seed')) : undefined;
  const matches = getArg('matches') ? Number(getArg('matches')) : DEFAULT_MATCHES;
  const limitPuzzles = getArg('puzzles') ? Number(getArg('puzzles')) : undefined;

  let agent: BenchAgent;
  switch (agentType) {
    case 'random':
      agent = createRandomAgent(customSeed ?? 99);
      break;
    case 'greedy':
      agent = createGreedyAgent();
      break;
    case 'expert':
      agent = createExpertAgent();
      break;
    case 'anthropic':
      agent = createAnthropicAgent(modelName || 'claude-3-7-sonnet-20250219');
      break;
    case 'openai':
      agent = createOpenAIAgent(modelName || 'gpt-4o');
      break;
    case 'gemini':
      agent = createGeminiAgent(modelName || 'gemini-2.5-pro');
      break;
    default:
      console.error(`Unknown agent type: ${agentType}. Options: random, greedy, expert, anthropic, openai, gemini`);
      process.exit(1);
  }

  const seeds = customSeed ? [customSeed] : PUBLIC_SEEDS;
  console.log(`=== SHBP-3 Official Benchmark Run ===`);
  console.log(`Agent: ${agent.label} (${agent.provider}/${agent.model})`);
  console.log(`Seeds: ${seeds.join(', ')} | Matches/seed: ${matches} | Puzzles: ${limitPuzzles ?? puzzleSet.puzzles.length}`);

  const anchors: AnchorTable = {};
  for (const s of seeds) {
    anchors[anchorKey(s, matches)] = computeAnchor(s, matches);
  }

  const log: BenchLog = await runBenchmark(agent, puzzleSet, {
    seeds,
    matches,
    puzzleLimit: limitPuzzles,
    onProgress: (p) => {
      process.stdout.write(`\r[${p.stage}] ${p.done}/${p.total} - ${p.label}             `);
    },
  });
  console.log('\nExecution complete. Verifying log...');

  const verified = verifyLog(log, puzzleSet, anchors);

  console.log(`\n================ RESULT ================`);
  console.log(`Model:               ${verified.agent.label}`);
  console.log(`SHBP Score:          ${verified.shbp} ${verified.ci95 !== null ? `± ${verified.ci95}` : ''}`);
  console.log(`Puzzle Accuracy:     ${verified.puzzle.accuracy}% (${verified.puzzle.correct}/${verified.puzzle.n})`);
  console.log(`  Easy:              ${verified.puzzle.byDifficulty.easy.correct}/${verified.puzzle.byDifficulty.easy.n}`);
  console.log(`  Medium:            ${verified.puzzle.byDifficulty.medium.correct}/${verified.puzzle.byDifficulty.medium.n}`);
  console.log(`  Hard:              ${verified.puzzle.byDifficulty.hard.correct}/${verified.puzzle.byDifficulty.hard.n}`);
  console.log(`Puzzle Norm Score:   ${verified.puzzle.normalized}`);
  console.log(`Campaign Norm Score: ${verified.campaign.normalized}`);
  console.log(`Campaign Record:     ${verified.campaign.totals.win}W ${verified.campaign.totals.draw}D ${verified.campaign.totals.loss}L`);
  console.log(`Invalid Actions:     Puzzles: ${verified.puzzle.invalid}, Campaign: ${verified.campaign.invalid}`);
  console.log(`Log Fingerprint:     ${verified.logHash}`);
  console.log(`========================================\n`);

  const outDir = resolve(process.cwd(), 'benchmark_results');
  mkdirSync(outDir, { recursive: true });
  const filename = `${agent.id}-${Date.now()}.benchlog.json`;
  const outPath = resolve(outDir, filename);
  writeFileSync(outPath, JSON.stringify({ log, verified }, null, 2) + '\n');
  console.log(`Saved full action log & verification certificate to: ${outPath}`);
}

main().catch((err) => {
  console.error('Fatal benchmark harness error:', err);
  process.exit(1);
});
