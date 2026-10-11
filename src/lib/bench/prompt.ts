/**
 * SHBP-3 LLM protocol: rules prompt, per-decision rendering, and strict response parsing.
 * Shared by the Node harness (scripts/bench/harness.ts) and the /bench page (documentation).
 */
import { DecisionRequest } from './agents';
import { BenchAction, CARDS_PER_PACK, DECK_SIZE, MATCH_REWARD, OPP_PHASE_WEIGHTS, PACKS, START_SNS, STARTER_SIZE } from './campaign';
import { CardView, CellView } from './core';

export const SHBP_RULES_PROMPT = `You are playing the SNSHero Bench (SHBP-3), a deterministic card-placement benchmark.

BOARD: 3x3 grid, cells indexed
  0 | 1 | 2
  3 | 4 | 5
  6 | 7 | 8
CARDS: each card has four side stats n (top), e (right), s (bottom), w (left) from 1-10, plus an element.

PLACEMENT RULES (applied when a card is placed on an empty cell):
1. BASIC: for each adjacent OPPONENT card, compare your touching side with its opposite side
   (your n vs its s, your e vs its w, your s vs its n, your w vs its e). Strictly greater -> it flips to you.
   Element edge: +1 to your stat if your element beats theirs (water>fire, fire>earth, earth>air, air>water).
2. SAME: if two or more adjacent cards (any owner) have touching values EQUAL to yours, every opponent card among them flips.
3. PLUS: if two or more adjacent cards (any owner) produce the SAME SUM (your side + their touching side), every opponent card among them flips.
4. COMBO: cards flipped by SAME or PLUS then apply BASIC against their own neighbours, cascading recursively.
SCORING: when the board is full, your score = cards you own on the board + cards left in your hand. 10 cards total. More than 5 wins, exactly 5 draws.

TRACK A - PUZZLES: a mid-game position with BOTH hands visible. Pick the move that maximises your final score assuming the opponent also plays perfectly.

TRACK B - CAMPAIGN SEASON: a sequence of matches.
- You start with ${START_SNS} SNS and ${STARTER_SIZE} cards; your deck is ${DECK_SIZE} cards. The opponent's hand is HIDDEN (you only see cards already played).
- You move first in odd-numbered matches. Opponents get stronger: rarity weights bronze/silver/gold by season third = ${OPP_PHASE_WEIGHTS.map((w) => w.join('/')).join(' -> ')}.
- Opponent policy: captures as many cards as possible each turn (ties broken randomly).
- Match rewards: win +${MATCH_REWARD.win} SNS, draw +${MATCH_REWARD.draw}, loss +${MATCH_REWARD.loss}.
- After each match (except the last) you may buy ONE pack of ${CARDS_PER_PACK} cards: ${(Object.keys(PACKS) as Array<keyof typeof PACKS>)
  .map((p) => `${p} ${PACKS[p].price} SNS (bronze/silver/gold weights ${PACKS[p].weights.join('/')})`)
  .join('; ')}. After buying you rebuild your deck.
- Campaign score = 3 x wins + 1 x draws + floor(final SNS / 100). Unspent SNS is worth something, packs bought too late are wasted.

RESPONSE FORMAT: think as much as you like, then finish with exactly one final line:
  ACTION: <option number>              (for placement / puzzle / shop decisions)
  DECK: <id>,<id>,<id>,<id>,<id>       (for deck decisions; ids must exist in your inventory, duplicates only if owned twice)`;

const fmtCard = (c: CardView): string => `#${c.id} ${c.name} [n${c.n} e${c.e} s${c.s} w${c.w}] ${c.el} ${c.rarity}`;

const fmtBoard = (board: CellView[]): string => {
  const cell = (c: CellView, i: number): string =>
    c ? `${c.owner === 'you' ? 'YOU' : 'OPP'}#${c.id}(n${c.n} e${c.e} s${c.s} w${c.w} ${c.el})` : `(${i} empty)`;
  return [0, 3, 6].map((r) => [r, r + 1, r + 2].map((i) => cell(board[i], i)).join(' | ')).join('\n');
};

export function renderDecision(req: DecisionRequest): string {
  if (req.kind === 'puzzle') {
    const p = req.puzzle;
    return [
      `TRACK A PUZZLE ${p.id}. It is your move.`,
      `BOARD:\n${fmtBoard(p.board)}`,
      `YOUR HAND:\n${p.yourHand.map(fmtCard).join('\n')}`,
      `OPPONENT HAND (visible):\n${p.opponentHand.map(fmtCard).join('\n') || '(empty)'}`,
      `OPTIONS:\n${req.legal.map((m, i) => `${i}: card #${m.card} -> cell ${m.cell}`).join('\n')}`,
      'Answer with ACTION: <option number>.',
    ].join('\n\n');
  }
  if (req.kind === 'place') {
    const o = req.obs;
    return [
      `TRACK B MATCH ${o.match}/${o.matches}. Record W${o.record.win}-D${o.record.draw}-L${o.record.loss}. SNS ${o.sns}. You moved ${o.youMovedFirst ? 'first' : 'second'}.`,
      `CURRENT SCORE: you ${o.currentScore.you} - opponent ${o.currentScore.opponent}`,
      `BOARD:\n${fmtBoard(o.board)}`,
      `YOUR HAND:\n${o.yourHand.map(fmtCard).join('\n')}`,
      `OPPONENT: ${o.opponentCardsInHand} hidden card(s) in hand. Already played: ${o.opponentCardsPlayed.map((c) => `#${c.id}`).join(', ') || 'none'}`,
      `OPTIONS:\n${req.legal.map((m, i) => `${i}: card #${m.card} -> cell ${m.cell}`).join('\n')}`,
      'Answer with ACTION: <option number>.',
    ].join('\n\n');
  }
  if (req.kind === 'shop') {
    const o = req.obs;
    return [
      `TRACK B SHOP after match ${o.matchCompleted}/${o.matches} (${o.matchesRemaining} match(es) remaining). Last result: ${o.lastResult}. Record W${o.record.win}-D${o.record.draw}-L${o.record.loss}.`,
      `SNS: ${o.sns}`,
      `YOUR DECK:\n${o.deck.map(fmtCard).join('\n')}`,
      `OPTIONS:\n${req.legal
        .map((p, i) => (p === 'skip' ? `${i}: skip (save SNS)` : `${i}: buy ${p} pack (${PACKS[p].price} SNS)`))
        .join('\n')}`,
      'Answer with ACTION: <option number>.',
    ].join('\n\n');
  }
  const o = req.obs;
  return [
    `TRACK B DECK BUILD (${o.reason === 'initial' ? 'season start' : 'after opening a pack'}). ${o.matchesRemaining} match(es) remaining.`,
    o.newCards.length ? `NEW CARDS:\n${o.newCards.map(fmtCard).join('\n')}` : '',
    `INVENTORY:\n${o.inventory.map(fmtCard).join('\n')}`,
    `CURRENT DECK: ${o.currentDeck.map((id) => `#${id}`).join(', ')}`,
    `Choose exactly ${DECK_SIZE} card ids. Answer with DECK: id,id,id,id,id`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Parses the LAST ACTION/DECK line. Returns null when the response is unusable. */
export function parseDecision(req: DecisionRequest, text: string): BenchAction | null {
  if (!text) return null;
  if (req.kind === 'deck') {
    const matches = [...text.matchAll(/DECK:\s*([#\d,\s]+)/gi)];
    const last = matches[matches.length - 1];
    if (!last) return null;
    const ids = last[1]
      .split(/[,\s]+/)
      .map((s) => s.replace('#', '').trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n));
    return ids.length ? { t: 'deck', cards: ids.slice(0, DECK_SIZE) } : null;
  }
  const matches = [...text.matchAll(/ACTION:\s*\**\s*(\d+)/gi)];
  const last = matches[matches.length - 1];
  if (!last) return null;
  const idx = Number(last[1]);
  if (req.kind === 'shop') {
    const pack = req.legal[idx];
    return pack ? { t: 'shop', pack } : null;
  }
  const m = req.legal[idx];
  return m ? { t: 'place', card: m.card, cell: m.cell } : null;
}
