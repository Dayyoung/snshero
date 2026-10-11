import { CARD_DATABASE } from '../src/cardDatabase';
import { findBestMove, checkFlips, Board } from '../src/lib/gameEngine';
import { getCardPower } from '../src/constants';
import { getDynamicDifficultyProfile } from '../src/lib/dynamicDifficulty';
import { determineGachaOutcomeRarity, GachaPackRarity } from '../src/content/gachaRates';
import { CardData } from '../src/types';

// Card rarity pools
const cardRarityPools: Record<string, number[]> = { bronze: [], silver: [], gold: [] };
Object.keys(CARD_DATABASE).map(Number).forEach(idx => {
  const c = CARD_DATABASE[idx];
  if (!c) return;
  const r = (c.rarity || 'bronze').toLowerCase();
  if (cardRarityPools[r]) cardRarityPools[r].push(idx);
  else cardRarityPools.bronze.push(idx);
});

// Helper to create card instance
function makeCard(imgIdx: number, id: string, owner: 'player' | 'ai' | null = null): CardData {
  const db = CARD_DATABASE[imgIdx] || CARD_DATABASE[1];
  return {
    id,
    title_dis: db.title_dis || db.title,
    title: db.title,
    title_en: db.title_en,
    stats: [...(db.stats || [2, 2, 2, 2])],
    rarity: db.rarity,
    level: 1,
    imageIndex: imgIdx,
    element: db.element,
    power: getCardPower(db as any),
    owner
  } as CardData;
}

// 1. Initial State
let sns = 1000; // Welcome bonus
let inventory: Record<number, number> = {}; // imgIdx -> count
let matchHistory: ('win' | 'loss' | 'draw')[] = [];
let wins = 0;
let losses = 0;
let draws = 0;
let totalPacksOpened = 0;
let upgradesCount = 0;

// Initial 5-card deck (Starter Bronze Normal cards)
const starterIdxs = [1, 2, 3, 4, 5];
let currentDeck: CardData[] = starterIdxs.map((idx, i) => {
  inventory[idx] = 1;
  return makeCard(idx, `player-start-${i}`);
});

console.log('================================================================');
console.log('🎮 [SNSHero 30-Minute Real Autonomous Play Simulation]');
console.log('================================================================');
console.log(`[00:00] Initial State: ${sns} SNS, Initial Deck Power: ${currentDeck.reduce((a, c) => a + getCardPower(c), 0)} CP`);

// Helper to open pack
function openPack(packRarity: GachaPackRarity = 'silver'): CardData[] {
  totalPacksOpened++;
  const drawn: CardData[] = [];
  for (let i = 0; i < 5; i++) {
    const r = determineGachaOutcomeRarity(packRarity);
    const pool = cardRarityPools[r] || cardRarityPools.bronze;
    const imgIdx = pool[Math.floor(Math.random() * pool.length)];
    const isNew = !inventory[imgIdx];
    inventory[imgIdx] = (inventory[imgIdx] || 0) + 1;
    if (isNew) {
      sns += 50; // New card codex bonus (+50 SNS)
    }
    drawn.push(makeCard(imgIdx, `card-draw-${Date.now()}-${i}`));
  }
  return drawn;
}

// Pre-match starter pack opening (Using part of 1,000 SNS welcome bonus)
sns -= 100;
const firstPack = openPack('silver');
firstPack.forEach(c => {
  // Check if better than weakest
  let minP = 9999;
  let minIdx = 0;
  currentDeck.forEach((dc, idx) => {
    const p = getCardPower(dc);
    if (p < minP) { minP = p; minIdx = idx; }
  });
  if (getCardPower(c) > minP) {
    currentDeck[minIdx] = c;
    upgradesCount++;
  }
});
console.log(`[00:01] Welcome Pack Summoned! Current Deck Power: ${currentDeck.reduce((a, c) => a + getCardPower(c), 0)} CP | SNS: ${sns}`);

// Total matches in 30 minutes (14 seconds per match cycle = ~128 matches)
const TOTAL_MATCHES = 128;

const logMilestones = [
  { match: 16, time: '03:45' },
  { match: 32, time: '07:30' },
  { match: 48, time: '11:15' },
  { match: 64, time: '15:00 (Half-Time)' },
  { match: 80, time: '18:45' },
  { match: 96, time: '22:30' },
  { match: 112, time: '26:15' },
  { match: 128, time: '30:00 (Final)' }
];

for (let m = 1; m <= TOTAL_MATCHES; m++) {
  const playerTotalPower = currentDeck.reduce((a, c) => a + getCardPower(c), 0);
  const recentSlice = matchHistory.slice(-5);
  const ddaProfile = getDynamicDifficultyProfile(playerTotalPower, recentSlice);

  // Generate Opponent Deck calibrated by DDA
  const oppTargetPower = Math.round(playerTotalPower * (ddaProfile.multiplier || 1.0));
  const oppCards: CardData[] = [];
  const pool = Object.keys(CARD_DATABASE).map(Number);
  for (let i = 0; i < 5; i++) {
    const rIdx = pool[Math.floor(Math.random() * pool.length)];
    oppCards.push(makeCard(rIdx, `opp-${m}-${i}`, 'ai'));
  }

  // 3x3 Board Match Play
  let board: Board = Array(9).fill(null);
  let handPlayer = currentDeck.map((c, i) => ({ ...c, owner: 'player' as const }));
  let handAi = oppCards.map((c, i) => ({ ...c, owner: 'ai' as const }));
  let turn: 'player' | 'ai' = Math.random() > 0.5 ? 'player' : 'ai';

  for (let moveCount = 0; moveCount < 9; moveCount++) {
    if (turn === 'player') {
      const best = findBestMove(board, handPlayer, 'smart', 'player');
      if (best) {
        const card = { ...handPlayer[best.cardIdx], owner: 'player' as const };
        board[best.boardIdx] = card;
        board = checkFlips(board, best.boardIdx);
        handPlayer = handPlayer.filter((_, idx) => idx !== best.cardIdx);
      }
      turn = 'ai';
    } else {
      let best = findBestMove(board, handAi, 'aggressive', 'ai');
      // Apply DDA human error rate (mistake chance)
      const mistakeChance = ddaProfile.aiMistakeChance || 0.15;
      if (Math.random() < mistakeChance && handAi.length > 1) {
        // AI makes a suboptimal/random move
        const emptyIndices = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
        if (emptyIndices.length > 0) {
          const randBoardIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          const randCardIdx = Math.floor(Math.random() * handAi.length);
          best = { boardIdx: randBoardIdx, cardIdx: randCardIdx };
        }
      }

      if (best) {
        const card = { ...handAi[best.cardIdx], owner: 'ai' as const };
        board[best.boardIdx] = card;
        board = checkFlips(board, best.boardIdx);
        handAi = handAi.filter((_, idx) => idx !== best.cardIdx);
      }
      turn = 'player';
    }
  }

  // Determine winner
  const pCount = board.filter(c => c?.owner === 'player').length;
  const aiCount = board.filter(c => c?.owner === 'ai').length;

  let outcome: 'win' | 'loss' | 'draw' = 'draw';
  if (pCount > aiCount) {
    outcome = 'win';
    wins++;
    sns += 30; // +30 SNS victory reward
  } else if (aiCount > pCount) {
    outcome = 'loss';
    losses++;
    sns += 10; // +10 SNS consolation reward
  } else {
    outcome = 'draw';
    draws++;
    sns += 15; // +15 SNS draw reward
  }
  matchHistory.push(outcome);

  // Smart Loop: If won and SNS >= 100, trigger automated shop summon & upgrade
  if (outcome === 'win' && sns >= 100) {
    sns -= 100;
    const drawnPack = openPack('silver');
    let bestDrawn = drawnPack[0];
    let bestP = getCardPower(bestDrawn);
    drawnPack.forEach(c => {
      const p = getCardPower(c);
      if (p > bestP) { bestP = p; bestDrawn = c; }
    });

    let weakestP = 9999;
    let weakestIdx = 0;
    currentDeck.forEach((dc, idx) => {
      const p = getCardPower(dc);
      if (p < weakestP) { weakestP = p; weakestIdx = idx; }
    });

    if (bestP > weakestP) {
      currentDeck[weakestIdx] = bestDrawn;
      upgradesCount++;
    }
  }

  // Every 4th match: Relaxation break (+15 SNS media/webtoon bonus)
  if (m % 4 === 0) {
    sns += 15;
  }

  // Achievement milestones
  if (m === 10) sns += 200;
  if (m === 25) sns += 400;
  if (m === 50) sns += 800;
  if (m === 100) sns += 1500;

  // Milestone logging
  const ms = logMilestones.find(l => l.match === m);
  if (ms) {
    const deckPower = currentDeck.reduce((a, c) => a + getCardPower(c), 0);
    const winRate = Math.round((wins / m) * 100);
    const ownedCount = Object.keys(inventory).length;
    console.log(`[${ms.time}] Match #${m} | Rec: ${wins}W ${losses}L ${draws}D (${winRate}%) | Deck: ${deckPower} CP | SNS: ${sns} | Cards: ${ownedCount}/110 | Upgrades: ${upgradesCount}`);
  }
}

// Final Summary
const finalDeckPower = currentDeck.reduce((a, c) => a + getCardPower(c), 0);
const finalWinRate = Math.round((wins / TOTAL_MATCHES) * 100);
const totalOwnedCards = Object.keys(inventory).length;
let totalCollectionPower = 0;
Object.keys(inventory).forEach(k => {
  const c = CARD_DATABASE[Number(k)];
  if (c) totalCollectionPower += getCardPower(c as any);
});

console.log('================================================================');
console.log('📊 [30-Minute Final Results Summary]');
console.log('================================================================');
console.log(`• Total Matches Played: ${TOTAL_MATCHES} games`);
console.log(`• Final Record: ${wins} Wins, ${losses} Losses, ${draws} Draws`);
console.log(`• Win Rate: ${finalWinRate}%`);
console.log(`• Active 5-Card Deck Combat Power: ${finalDeckPower} CP (Initial 48 CP -> ${finalDeckPower} CP)`);
console.log(`• Total Cards Collected: ${totalOwnedCards} / 110 types (${Math.round((totalOwnedCards / 110) * 100)}% Codex Complete)`);
console.log(`• Global Collection Battle Power: ${totalCollectionPower} CP`);
console.log(`• Final SNS Points Remaining: ${sns} SNS`);
console.log(`• Card Packs Opened: ${totalPacksOpened} packs (${totalPacksOpened * 5} cards total)`);
console.log(`• Total Automated Deck Upgrades: ${upgradesCount} swaps`);
console.log('================================================================');
