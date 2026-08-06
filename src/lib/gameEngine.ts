import { CardData, AiStrategy, AiDifficulty } from '../types';
import { getCardStatWithBonus } from '../constants';

export interface CardInstance extends CardData {
  owner: 'player' | 'ai';
}

export type Board = (CardInstance | null)[];

export type ElementalTile = 'fire' | 'water' | 'earth' | 'air' | null;

export const checkFlips = (
  board: Board, 
  placedIdx: number, 
  playerMultiplier: number = 1, 
  elementalBoard: ElementalTile[] = []
): Board => {
  let newBoard = [...board];
  const card = newBoard[placedIdx];
  if (!card) return newBoard;

  const row = Math.floor(placedIdx / 3);
  const col = Math.floor(placedIdx % 3);
  const dirs = [
    { r: -1, c: 0, m: 0, opp: 2 }, // Up
    { r: 0, c: 1, m: 1, opp: 3 },  // Right
    { r: 1, c: 0, m: 2, opp: 0 },  // Down
    { r: 0, c: -1, m: 3, opp: 1 }  // Left
  ];

  const flips: number[] = [];
  const sameMatched: number[] = [];
  const plusSums: Record<number, number[]> = {};
  let counterTargetOwner: 'player' | 'ai' | null = null;

  // Find direct flips and potential combos
  dirs.forEach(d => {
    const nr = row + d.r;
    const nc = col + d.c;
    if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
      const neighborIdx = nr * 3 + nc;
      const neighbor = newBoard[neighborIdx];
      if (neighbor) {
        const myStat = getCardStatWithBonus(card, d.m, elementalBoard[placedIdx]);
        const oppStat = getCardStatWithBonus(neighbor, d.opp, elementalBoard[neighborIdx]);

        // SAME rule logic
        if (myStat === oppStat) {
          sameMatched.push(neighborIdx);
        }

        // PLUS rule logic
        const sum = myStat + oppStat;
        if (!plusSums[sum]) plusSums[sum] = [];
        plusSums[sum].push(neighborIdx);

        // Standard Flip logic (only if not already flipping via SAME/PLUS)
        if (neighbor.owner !== card.owner) {
          let effectiveMyStat = myStat;
          let effectiveOppStat = oppStat;

          // WALL Ability: Cannot be flipped by basic comparison
          if (neighbor.ability?.type === 'WALL' && card.ability?.type !== 'PIERCE') {
            return;
          }

          // SHIELD Ability
          if (neighbor.ability?.type === 'SHIELD' && card.ability?.type !== 'PIERCE') {
            effectiveMyStat = Math.max(0, effectiveMyStat - neighbor.ability.value);
          }

          if (card.owner === 'player') effectiveMyStat *= playerMultiplier;
          else effectiveOppStat *= playerMultiplier;

          if (effectiveMyStat > effectiveOppStat) {
            flips.push(neighborIdx);
          } else if (neighbor.ability?.type === 'COUNTER' && card.ability?.type !== 'IMMUNITY') {
            // COUNTER: If placed card fails to flip neighbor, and neighbor has COUNTER, placed card gets flipped.
            // IMMUNITY protects against COUNTER.
            counterTargetOwner = neighbor.owner; // Will mutate ownership after all checks
          }
        }
      }
    }
  });

  // Finalize combo flips (SAME/PLUS)
  const comboFlippables: number[] = [];
  
  // SAME: if 2+ sides match stats
  if (sameMatched.length >= 2) {
    sameMatched.forEach(idx => {
      if (board[idx]?.owner !== card.owner) comboFlippables.push(idx);
    });
  }

  // PLUS: if 2+ sides have identical sums
  Object.values(plusSums).forEach(indices => {
    if (indices.length >= 2) {
      indices.forEach(idx => {
        if (board[idx]?.owner !== card.owner && board[idx]?.ability?.type !== 'IMMUNITY') comboFlippables.push(idx);
      });
    }
  });

  const allFlips = Array.from(new Set([...flips, ...comboFlippables]));
  
  allFlips.forEach(idx => {
    const neighbor = newBoard[idx];
    if (neighbor && neighbor.ability?.type !== 'IMMUNITY') {
      newBoard[idx] = { ...neighbor, owner: card.owner };
      // Recursive Combo: Flipping via combo can flip others (Simple version: one level depth for now)
      // In full Triple Triad, combos trigger further captures.
    }
  });

  // Apply COUNTER
  if (counterTargetOwner && newBoard[placedIdx]) {
    newBoard[placedIdx] = { ...newBoard[placedIdx]!, owner: counterTargetOwner };
  }

  return newBoard;
};

const simulateAbility = (board: Board, index: number, card: CardData): Board => {
  const newBoard = [...board];
  const virtualCard = { ...card, owner: (card as any).owner || 'ai' } as CardInstance;
  newBoard[index] = virtualCard;

  if (!card.ability) return newBoard;

  if (card.ability.type === 'OMNIBOOST') {
    newBoard.forEach((cell, idx) => {
      if (cell && cell.owner === virtualCard.owner) {
        newBoard[idx] = { ...cell, stats: cell.stats.map(s => s + card.ability!.value) as [number, number, number, number] };
      }
    });
  }

  const row = Math.floor(index / 3);
  const col = index % 3;
  const directions = [{r:-1, c:0}, {r:0, c:1}, {r:1, c:0}, {r:0, c:-1}];

  directions.forEach(dir => {
    const nr = row + dir.r;
    const nc = col + dir.c;
    if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
      const ni = nr * 3 + nc;
      const neighbor = newBoard[ni];
      if (!neighbor) return;

      if (card.ability?.type === 'POWER_BOOST' && neighbor.owner === virtualCard.owner) {
        newBoard[ni] = { ...neighbor, stats: neighbor.stats.map(s => s + card.ability!.value) as [number, number, number, number] };
      } else if (card.ability?.type === 'WEAKEN' && neighbor.owner !== virtualCard.owner) {
        if (neighbor.ability?.type === 'IMMUNITY') return; // Immunity prevents Weaken
        newBoard[ni] = { ...neighbor, stats: neighbor.stats.map(s => Math.max(0, s - card.ability!.value)) as [number, number, number, number] };
      } else if (card.ability?.type === 'REINFORCE' && neighbor.owner === virtualCard.owner) {
        const currentSelf = newBoard[index]!;
        newBoard[index] = { ...currentSelf, stats: currentSelf.stats.map(s => s + card.ability!.value) as [number, number, number, number] };
      }
    }
  });

  return newBoard;
};

export const findBestMove = (
  board: Board, 
  hand: CardData[], 
  strategy: AiStrategy, 
  side: 'player' | 'ai',
  playerMultiplier: number = 1,
  elementalBoard: ElementalTile[] = [],
  difficulty: AiDifficulty = 'hard'
): { cardIdx: number, boardIdx: number, reason: string } | null => {
  const possibleBoardIndices = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
  if (possibleBoardIndices.length === 0 || hand.length === 0) return null;

  let moves: { cardIdx: number, boardIdx: number, score: number, reason: string }[] = [];

  hand.forEach((card, cIdx) => {
    possibleBoardIndices.forEach(bIdx => {
      // 1. Simulate ability impact
      const virtualBoard = simulateAbility(board, bIdx, card);
      const virtualCardWithAbility = virtualBoard[bIdx]!;

      // 2. Check flips (including combos and special abilities)
      const afterMoveBoard = checkFlips(virtualBoard, bIdx, playerMultiplier, elementalBoard);
      let flippedCount = 0;
      afterMoveBoard.forEach((c, i) => {
        if (board[i] && board[i]!.owner !== side && c!.owner === side) {
          flippedCount++;
        }
      });

      // 3. Defense Score
      let exposeScore = 0;
      const row = Math.floor(bIdx / 3);
      const col = bIdx % 3;
      const dirs = [{r:-1,c:0,m:0},{r:0,c:1,m:1},{r:1,c:0,m:2},{r:0,c:-1,m:3}];

      dirs.forEach(d => {
        const nr = row + d.r;
        const nc = col + d.c;
        const statValue = getCardStatWithBonus(virtualCardWithAbility, d.m, elementalBoard[bIdx]);
        
        if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
          if (!board[nr * 3 + nc]) {
            exposeScore += statValue; 
          }
        } else {
          exposeScore += statValue * 0.5;
        }
      });

      // 4. Position & Rarity weights
      const isCorner = (row === 0 || row === 2) && (col === 0 || col === 2);
      const isCenter = row === 1 && col === 1;

      let score = (flippedCount * 400);

      if (strategy === 'random') {
        score = Math.random() * 1000; // Randomly weight moves
      } else if (strategy === 'aggressive') {
        score += (isCenter ? 100 : 0) + (exposeScore * 0.5);
      } else if (strategy === 'defensive') {
        score += (isCorner ? 120 : 0) + (exposeScore * 5.0);
      } else {
        score += (isCorner ? 60 : 0) + (exposeScore * 2.0);
      }

      // Elemental affinity bonus
      if (card.element && card.element === elementalBoard[bIdx]) {
        score += 50;
      }
      
      if (card.ability?.type === 'TIME_WARP') {
        score += 800; // Skipping opponent's turn is incredibly strong
      }

      // Lookahead Risk
      if (strategy !== 'aggressive') {
         let maxRisk = 0;
         dirs.forEach(d => {
            const nr = row + d.r;
            const nc = col + d.c;
            if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3 && !board[nr * 3 + nc]) {
               const ourStat = getCardStatWithBonus(card, d.m, elementalBoard[bIdx]);
               maxRisk = Math.max(maxRisk, 12 - ourStat); 
            }
         });
         score -= (maxRisk * 30);
      }

      moves.push({ cardIdx: cIdx, boardIdx: bIdx, score, reason: strategy });
    });
  });

  // Sort descending by score
  moves.sort((a, b) => b.score - a.score);

  // Apply difficulty logic
  let selectedMove = moves[0];
  if (difficulty === 'easy') {
    // Pick from the bottom 50% randomly, or a random move
    const idx = Math.floor(Math.random() * moves.length);
    selectedMove = moves[idx];
  } else if (difficulty === 'medium') {
    // 50% chance to pick the 2nd or 3rd best move if available
    if (Math.random() > 0.5 && moves.length > 1) {
      selectedMove = moves[Math.min(Math.floor(Math.random() * 3), moves.length - 1)];
    }
  }

  return selectedMove;
};
