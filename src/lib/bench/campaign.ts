/**
 * SHBP-3 Campaign Track
 * A seeded multi-match season with hidden information (opponent hand is never revealed),
 * an economy (pack purchase vs. saving), and deck building. Fully deterministic given
 * (seed, actions), so any submitted action log can be replayed and re-scored exactly.
 */
import {
  BoardState,
  CardView,
  CellView,
  PlaceMove,
  Prng,
  Side,
  applyPlacement,
  boardView,
  cardView,
  countOwned,
  createPrng,
  deriveSeed,
  drawCard,
  emptyBoard,
  emptyCells,
  getCard,
  immediateGain,
  legalMoves,
  moveKey,
  removeOne,
  scoreDiff,
} from './core';

export type PackType = 'bronze' | 'silver' | 'gold';
export type ShopChoice = 'skip' | PackType;

export const PACKS: Record<PackType, { price: number; weights: [number, number, number] }> = {
  bronze: { price: 40, weights: [90, 10, 0] },
  silver: { price: 100, weights: [55, 40, 5] },
  gold: { price: 220, weights: [15, 55, 30] },
};
export const CARDS_PER_PACK = 3;
export const MATCH_REWARD = { win: 50, draw: 25, loss: 10 } as const;
export const START_SNS = 150;
export const STARTER_SIZE = 7;
export const DECK_SIZE = 5;
/** Opponent rarity weights by season phase (first / middle / final third). */
export const OPP_PHASE_WEIGHTS: Array<[number, number, number]> = [
  [85, 15, 0],
  [45, 45, 10],
  [15, 50, 35],
];

export type BenchAction =
  | { t: 'place'; card: number; cell: number }
  | { t: 'shop'; pack: ShopChoice }
  | { t: 'deck'; cards: number[] };

export interface PlaceObs {
  match: number;
  matches: number;
  record: { win: number; draw: number; loss: number };
  sns: number;
  youMovedFirst: boolean;
  board: CellView[];
  yourHand: CardView[];
  opponentCardsInHand: number;
  opponentCardsPlayed: CardView[];
  currentScore: { you: number; opponent: number };
}

export interface ShopObs {
  matchCompleted: number;
  matches: number;
  matchesRemaining: number;
  lastResult: 'win' | 'draw' | 'loss';
  record: { win: number; draw: number; loss: number };
  sns: number;
  packs: Array<{ type: PackType; price: number; weights: [number, number, number] }>;
  deck: CardView[];
  inventoryCount: number;
}

export interface DeckObs {
  reason: 'initial' | 'after_pack';
  matchesRemaining: number;
  newCards: CardView[];
  inventory: CardView[];
  currentDeck: number[];
}

export type CampaignRequest =
  | { kind: 'place'; obs: PlaceObs; legal: PlaceMove[] }
  | { kind: 'shop'; obs: ShopObs; legal: ShopChoice[] }
  | { kind: 'deck'; obs: DeckObs };

export interface MatchRecord {
  match: number;
  result: 'win' | 'draw' | 'loss';
  diff: number;
  deckPower: number;
  oppPower: number;
}

export interface CampaignOutcome {
  seed: number;
  matches: number;
  score: number;
  win: number;
  draw: number;
  loss: number;
  sns: number;
  packs: Record<PackType, number>;
  invalid: number;
  decisions: number;
  history: MatchRecord[];
}

type Phase = 'deck' | 'place' | 'shop' | 'done';

export const campaignScore = (win: number, draw: number, sns: number): number =>
  win * 3 + draw + Math.floor(sns / 100);

const sortIds = (ids: number[]): number[] => ids.slice().sort((a, b) => a - b);

export class CampaignEnv {
  readonly seed: number;
  readonly matches: number;
  private packPrng: Prng;
  private oppPrng: Prng;
  private oppDecks: number[][];
  private phase: Phase = 'deck';
  private deckReason: 'initial' | 'after_pack' = 'initial';
  private newCards: number[] = [];
  private matchIdx = 0;
  private board: BoardState = emptyBoard();
  private hands: [number[], number[]] = [[], []];
  private toMove: Side = 0;
  private oppPlayed: number[] = [];
  sns = START_SNS;
  inventory: number[] = [];
  deck: number[] = [];
  record = { win: 0, draw: 0, loss: 0 };
  packs: Record<PackType, number> = { bronze: 0, silver: 0, gold: 0 };
  invalid = 0;
  decisions = 0;
  history: MatchRecord[] = [];
  private lastResult: 'win' | 'draw' | 'loss' = 'draw';

  constructor(seed: number, matches: number) {
    this.seed = seed >>> 0;
    this.matches = Math.max(1, Math.floor(matches));
    const setup = createPrng(deriveSeed(this.seed, 1));
    this.packPrng = createPrng(deriveSeed(this.seed, 2));
    this.oppPrng = createPrng(deriveSeed(this.seed, 3));
    this.inventory = sortIds(Array.from({ length: STARTER_SIZE }, () => drawCard(setup, [85, 15, 0])));
    this.deck = this.inventory.slice(0, DECK_SIZE);
    const oppSetup = createPrng(deriveSeed(this.seed, 4));
    this.oppDecks = Array.from({ length: this.matches }, (_, i) => {
      const phase = Math.min(2, Math.floor((3 * i) / this.matches));
      return Array.from({ length: DECK_SIZE }, () => drawCard(oppSetup, OPP_PHASE_WEIGHTS[phase]));
    });
  }

  get done(): boolean {
    return this.phase === 'done';
  }

  /** Hidden information, only exposed to explicitly privileged reference agents. */
  privileged(): { oppHand: number[]; futureOppDecks: number[][] } {
    return { oppHand: this.hands[1].slice(), futureOppDecks: this.oppDecks.slice(this.matchIdx + 1).map((d) => d.slice()) };
  }

  /** Full state snapshot for UI rendering. */
  snapshot() {
    return {
      phase: this.phase,
      match: this.matchIdx + 1,
      board: this.board.slice(),
      hands: [this.hands[0].slice(), this.hands[1].length] as const,
      sns: this.sns,
      record: { ...this.record },
    };
  }

  pending(): CampaignRequest | null {
    if (this.phase === 'done') return null;
    if (this.phase === 'deck') {
      return {
        kind: 'deck',
        obs: {
          reason: this.deckReason,
          matchesRemaining: this.matches - this.matchIdx - (this.deckReason === 'initial' ? 0 : 1),
          newCards: this.newCards.map(cardView),
          inventory: this.inventory.map(cardView),
          currentDeck: this.deck.slice(),
        },
      };
    }
    if (this.phase === 'shop') {
      const legal: ShopChoice[] = ['skip'];
      (Object.keys(PACKS) as PackType[]).forEach((p) => {
        if (this.sns >= PACKS[p].price) legal.push(p);
      });
      return {
        kind: 'shop',
        obs: {
          matchCompleted: this.matchIdx + 1,
          matches: this.matches,
          matchesRemaining: this.matches - this.matchIdx - 1,
          lastResult: this.lastResult,
          record: { ...this.record },
          sns: this.sns,
          packs: (Object.keys(PACKS) as PackType[]).map((type) => ({ type, ...PACKS[type] })),
          deck: this.deck.map(cardView),
          inventoryCount: this.inventory.length,
        },
        legal,
      };
    }
    return {
      kind: 'place',
      obs: {
        match: this.matchIdx + 1,
        matches: this.matches,
        record: { ...this.record },
        sns: this.sns,
        youMovedFirst: this.matchIdx % 2 === 0,
        board: boardView(this.board),
        yourHand: this.hands[0].map(cardView),
        opponentCardsInHand: this.hands[1].length,
        opponentCardsPlayed: this.oppPlayed.map(cardView),
        currentScore: {
          you: countOwned(this.board, 0) + this.hands[0].length,
          opponent: countOwned(this.board, 1) + this.hands[1].length,
        },
      },
      legal: legalMoves(this.board, this.hands[0]),
    };
  }

  /** Apply an agent action. Invalid/missing actions are counted and replaced by a fixed fallback. */
  apply(action: BenchAction | null | undefined): { valid: boolean } {
    const req = this.pending();
    if (!req) return { valid: false };
    this.decisions++;
    let valid = false;

    if (req.kind === 'place') {
      let move: PlaceMove = req.legal[0];
      if (action && action.t === 'place') {
        const key = moveKey(action);
        const found = req.legal.find((m) => moveKey(m) === key);
        if (found) {
          move = found;
          valid = true;
        }
      }
      this.placeFor(0, move);
      this.runOpponent();
    } else if (req.kind === 'shop') {
      let choice: ShopChoice = 'skip';
      if (action && action.t === 'shop' && req.legal.includes(action.pack)) {
        choice = action.pack;
        valid = true;
      }
      if (choice === 'skip') {
        this.nextMatch();
      } else {
        this.sns -= PACKS[choice].price;
        this.packs[choice]++;
        this.newCards = Array.from({ length: CARDS_PER_PACK }, () => drawCard(this.packPrng, PACKS[choice as PackType].weights));
        this.inventory = sortIds([...this.inventory, ...this.newCards]);
        this.deckReason = 'after_pack';
        this.phase = 'deck';
      }
    } else {
      if (action && action.t === 'deck' && this.isValidDeck(action.cards)) {
        this.deck = action.cards.slice();
        valid = true;
      }
      if (this.deckReason === 'initial') this.startMatch(0);
      else this.nextMatch();
    }

    if (!valid) this.invalid++;
    return { valid };
  }

  isValidDeck(cards: unknown): cards is number[] {
    if (!Array.isArray(cards) || cards.length !== DECK_SIZE) return false;
    const pool = this.inventory.slice();
    for (const c of cards) {
      if (typeof c !== 'number') return false;
      const i = pool.indexOf(c);
      if (i < 0) return false;
      pool.splice(i, 1);
    }
    return true;
  }

  outcome(): CampaignOutcome {
    return {
      seed: this.seed,
      matches: this.matches,
      score: campaignScore(this.record.win, this.record.draw, this.sns),
      win: this.record.win,
      draw: this.record.draw,
      loss: this.record.loss,
      sns: this.sns,
      packs: { ...this.packs },
      invalid: this.invalid,
      decisions: this.decisions,
      history: this.history.slice(),
    };
  }

  // -------------------------------------------------------------------------
  private startMatch(i: number) {
    this.matchIdx = i;
    this.board = emptyBoard();
    this.hands = [this.deck.slice(), this.oppDecks[i].slice()];
    this.oppPlayed = [];
    this.toMove = i % 2 === 0 ? 0 : 1;
    this.newCards = [];
    this.phase = 'place';
    this.runOpponent();
  }

  private nextMatch() {
    if (this.matchIdx + 1 >= this.matches) {
      this.phase = 'done';
      return;
    }
    this.startMatch(this.matchIdx + 1);
  }

  private placeFor(side: Side, m: PlaceMove) {
    this.board = applyPlacement(this.board, m.cell, m.card, side).board;
    this.hands[side] = removeOne(this.hands[side], m.card);
    if (side === 1) this.oppPlayed.push(m.card);
    this.toMove = (1 - side) as Side;
  }

  private matchOver(): boolean {
    return emptyCells(this.board).length === 0 || this.hands[this.toMove].length === 0;
  }

  /** Opponent: greedy capture maximiser with seeded tie-breaking. */
  private runOpponent() {
    while (this.phase === 'place') {
      if (this.matchOver()) {
        this.endMatch();
        return;
      }
      if (this.toMove === 0) return;
      const moves = legalMoves(this.board, this.hands[1]);
      let bestGain = -1;
      let best: PlaceMove[] = [];
      for (const m of moves) {
        const g = immediateGain(this.board, m, 1);
        if (g > bestGain) {
          bestGain = g;
          best = [m];
        } else if (g === bestGain) best.push(m);
      }
      this.placeFor(1, best[Math.floor(this.oppPrng() * best.length)]);
    }
  }

  private endMatch() {
    const diff = scoreDiff(this.board, this.hands[0].length, this.hands[1].length);
    const result = diff > 0 ? 'win' : diff < 0 ? 'loss' : 'draw';
    this.record[result]++;
    this.sns += MATCH_REWARD[result];
    this.lastResult = result;
    this.history.push({
      match: this.matchIdx + 1,
      result,
      diff,
      deckPower: this.deck.reduce((a, c) => a + getCard(c).power, 0),
      oppPower: this.oppDecks[this.matchIdx].reduce((a, c) => a + getCard(c).power, 0),
    });
    if (this.matchIdx + 1 >= this.matches) this.phase = 'done';
    else this.phase = 'shop';
  }
}
