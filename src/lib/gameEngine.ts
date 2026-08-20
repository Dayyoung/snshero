import { CardData, AiStrategy, AiDifficulty, GambitConfig, TacticalStance } from '../types';
import { getCardStatWithBonus } from '../constants';

export interface CardInstance extends CardData {
  owner: 'player' | 'ai';
}

export type Board = (CardInstance | null)[];

export type ElementalTile = 'fire' | 'water' | 'earth' | 'air' | null;

export interface FlipResultDetails {
  newBoard: Board;
  flippedIndices: number[];
  comboType: 'NORMAL' | 'DOUBLE' | 'TRIPLE' | 'MEGA' | 'SAME' | 'PLUS' | 'DOMINO' | null;
  comboCount: number;
  isCriticalShatter: boolean;
  maxPowerDiff: number;
  doubleWeaknessBroken?: boolean;
}

export const checkFlipsWithDetails = (
  board: Board, 
  placedIdx: number, 
  playerMultiplier: number = 1, 
  elementalBoard: ElementalTile[] = [],
  isSuddenDeath: boolean = false
): FlipResultDetails => {
  let newBoard = [...board];
  const card = newBoard[placedIdx];
  if (!card) {
    return {
      newBoard,
      flippedIndices: [],
      comboType: null,
      comboCount: 0,
      isCriticalShatter: false,
      maxPowerDiff: 0,
    };
  }

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
  const suddenDeathBonus = isSuddenDeath ? 2 : 0;
  let maxPowerDiff = 0;
  let weakPointsBroken = 0;

  // Find direct flips and potential combos
  dirs.forEach(d => {
    const nr = row + d.r;
    const nc = col + d.c;
    if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
      const neighborIdx = nr * 3 + nc;
      const neighbor = newBoard[neighborIdx];
      if (neighbor) {
        let myStat = getCardStatWithBonus(card, d.m, elementalBoard[placedIdx]) + suddenDeathBonus;
        let oppStat = getCardStatWithBonus(neighbor, d.opp, elementalBoard[neighborIdx]) + suddenDeathBonus;

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

          const diff = effectiveMyStat - effectiveOppStat;
          if (diff > 0) {
            flips.push(neighborIdx);
            maxPowerDiff = Math.max(maxPowerDiff, diff);
            // Check weakness break (boss or weak elemental target)
            if (diff >= 3 || (card.element && neighbor.element && card.element !== neighbor.element)) {
              weakPointsBroken++;
            }
          } else if (neighbor.ability?.type === 'COUNTER' && card.ability?.type !== 'IMMUNITY') {
            counterTargetOwner = neighbor.owner;
          }
        }
      }
    }
  });

  // Finalize combo flips (SAME/PLUS)
  const comboFlippables: number[] = [];
  let isSameCombo = false;
  let isPlusCombo = false;
  
  if (sameMatched.length >= 2) {
    sameMatched.forEach(idx => {
      if (board[idx]?.owner !== card.owner) {
        comboFlippables.push(idx);
        isSameCombo = true;
      }
    });
  }

  Object.values(plusSums).forEach(indices => {
    if (indices.length >= 2) {
      indices.forEach(idx => {
        if (board[idx]?.owner !== card.owner && board[idx]?.ability?.type !== 'IMMUNITY') {
          comboFlippables.push(idx);
          isPlusCombo = true;
        }
      });
    }
  });

  const allFlips = Array.from(new Set([...flips, ...comboFlippables]));
  
  allFlips.forEach(idx => {
    const neighbor = newBoard[idx];
    if (neighbor && neighbor.ability?.type !== 'IMMUNITY') {
      newBoard[idx] = { ...neighbor, owner: card.owner };
    }
  });

  // Domino Blast Cascade
  let isDominoCombo = false;
  if (allFlips.length > 0) {
    const dominoFlips: number[] = [];
    allFlips.forEach(fIdx => {
      const fCard = newBoard[fIdx];
      if (!fCard) return;
      const fRow = Math.floor(fIdx / 3);
      const fCol = fIdx % 3;
      dirs.forEach(d => {
        const dRow = fRow + d.r;
        const dCol = fCol + d.c;
        if (dRow >= 0 && dRow < 3 && dCol >= 0 && dCol < 3) {
          const adjIdx = dRow * 3 + dCol;
          const adjCard = newBoard[adjIdx];
          if (adjCard && adjCard.owner !== card.owner && adjCard.ability?.type !== 'IMMUNITY' && adjCard.ability?.type !== 'WALL') {
            const fStat = getCardStatWithBonus(fCard, d.m, elementalBoard[fIdx]);
            const adjStat = getCardStatWithBonus(adjCard, d.opp, elementalBoard[adjIdx]);
            if (fStat >= adjStat + 2) {
              dominoFlips.push(adjIdx);
              isDominoCombo = true;
            }
          }
        }
      });
    });

    dominoFlips.forEach(dIdx => {
      const target = newBoard[dIdx];
      if (target && target.ability?.type !== 'IMMUNITY') {
        newBoard[dIdx] = { ...target, owner: card.owner };
        if (!allFlips.includes(dIdx)) {
          allFlips.push(dIdx);
        }
      }
    });
  }

  // Apply COUNTER
  if (counterTargetOwner && newBoard[placedIdx]) {
    newBoard[placedIdx] = { ...newBoard[placedIdx]!, owner: counterTargetOwner };
  }

  let comboType: 'NORMAL' | 'DOUBLE' | 'TRIPLE' | 'MEGA' | 'SAME' | 'PLUS' | 'DOMINO' | null = null;
  if (allFlips.length >= 4) comboType = 'MEGA';
  else if (allFlips.length === 3) comboType = 'TRIPLE';
  else if (allFlips.length === 2) comboType = 'DOUBLE';
  else if (isSameCombo) comboType = 'SAME';
  else if (isPlusCombo) comboType = 'PLUS';
  else if (isDominoCombo) comboType = 'DOMINO';
  else if (allFlips.length === 1) comboType = 'NORMAL';

  const isCriticalShatter = maxPowerDiff >= 3 || allFlips.length >= 2;
  const doubleWeaknessBroken = weakPointsBroken >= 2;

  return {
    newBoard,
    flippedIndices: allFlips,
    comboType,
    comboCount: allFlips.length,
    isCriticalShatter,
    maxPowerDiff,
    doubleWeaknessBroken,
  };
};
export const checkFlips = (
  board: Board, 
  placedIdx: number, 
  playerMultiplier: number = 1, 
  elementalBoard: ElementalTile[] = [],
  isSuddenDeath: boolean = false
): Board => {
  return checkFlipsWithDetails(board, placedIdx, playerMultiplier, elementalBoard, isSuddenDeath).newBoard;
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
  difficulty: AiDifficulty = 'hard',
  isSuddenDeath: boolean = false,
  gambitConfig?: GambitConfig,
  tacticalStance: TacticalStance = 'balanced'
): { cardIdx: number, boardIdx: number, score: number, reason: string } | null => {
  const possibleBoardIndices = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
  if (possibleBoardIndices.length === 0 || hand.length === 0) return null;

  let moves: { cardIdx: number, boardIdx: number, score: number, reason: string }[] = [];

  // Tactical stance weighting multipliers (Item 401)
  const stanceAtkMult = tacticalStance === 'attack' ? 1.6 : (tacticalStance === 'defense' ? 0.75 : 1.0);
  const stanceDefMult = tacticalStance === 'defense' ? 2.5 : (tacticalStance === 'attack' ? 0.5 : 1.0);

  hand.forEach((card, cIdx) => {
    possibleBoardIndices.forEach(bIdx => {
      // 1. Simulate ability impact
      const virtualBoard = simulateAbility(board, bIdx, card);
      const virtualCardWithAbility = virtualBoard[bIdx]!;

      // 2. Check flips (including combos and special abilities, 1-Ply cascade prediction)
      const afterMoveBoard = checkFlips(virtualBoard, bIdx, playerMultiplier, elementalBoard, isSuddenDeath);
      let flippedCount = 0;
      let keyTargetSnipeBonus = 0;
      let counteredElementCount = 0;

      afterMoveBoard.forEach((c, i) => {
        if (board[i] && board[i]!.owner !== side && c!.owner === side) {
          flippedCount++;
          const flippedCard = board[i]!;
          // Item 358: Sniper Priority for Boss / High Power / Support Healer / Legendary cards
          const isHighValue = (flippedCard.power && flippedCard.power >= 150) ||
            flippedCard.rarity === 'legendary' ||
            flippedCard.rarity === 'epic' ||
            flippedCard.ability?.type === 'POWER_BOOST' ||
            flippedCard.ability?.type === 'REINFORCE' ||
            flippedCard.ability?.type === 'TIME_WARP';
          if (isHighValue) {
            keyTargetSnipeBonus += 350;
          }

          // Check if flipped via elemental counter
          if (card.element && flippedCard.element) {
            const elWins: Record<string, string> = { water: 'fire', fire: 'earth', earth: 'wind', wind: 'water' };
            if (elWins[card.element] === flippedCard.element) {
              counteredElementCount++;
            }
          }
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

      // 4. Position & Cascade combo weights (Item 350: 1-Ply combo cascade prediction)
      const isCorner = (row === 0 || row === 2) && (col === 0 || col === 2);
      const isCenter = row === 1 && col === 1;

      // Cascade Multiplier: 2.0x weight for multi-tile flips + Item 358 Sniper bonus
      const cascadeMultiplier = flippedCount >= 2 ? 2.0 : 1.0;
      let score = (flippedCount * 450 * cascadeMultiplier * stanceAtkMult) + (keyTargetSnipeBonus * stanceAtkMult);
      let moveReason = strategy as string;

      // Item 393: Player-Configured 'Gambit' Tactics Priority Engine
      if (gambitConfig && gambitConfig.slots) {
        const slotWeights = [380, 240, 140];
        gambitConfig.slots.forEach((priority, pIdx) => {
          const pWeight = slotWeights[pIdx] || 100;
          if (priority === 'COUNTER_ELEMENT' && counteredElementCount > 0) {
            score += pWeight * 1.5 * counteredElementCount;
            moveReason = `Gambit P${pIdx + 1}: 속성 카운터 캡처`;
          } else if (priority === 'SECURE_CORNERS' && isCorner) {
            score += pWeight * (flippedCount > 0 ? 1.3 : 1.0);
            moveReason = `Gambit P${pIdx + 1}: 모서리 요충지 선점`;
          } else if (priority === 'PRESERVE_ACE') {
            const isAce = (card.power || 0) >= 140 || card.rarity === 'legendary';
            if (!isAce && possibleBoardIndices.length >= 4) {
              score += pWeight * 1.2; // Save Ace for late game
              moveReason = `Gambit P${pIdx + 1}: 에이스 보존 전략`;
            }
          } else if (priority === 'SNIPE_HIGH_VALUE' && keyTargetSnipeBonus > 0) {
            score += pWeight * 1.8;
            moveReason = `Gambit P${pIdx + 1}: 고가치 영웅 저격`;
          } else if (priority === 'INTERCEPT_SYNERGY') {
            // Check if intercepting buff or synergy lines
            if (bIdx === 4 || elementalBoard[bIdx] !== undefined) {
              score += pWeight * 1.2;
              moveReason = `Gambit P${pIdx + 1}: 연계/버프 타일 선점`;
            }
          }
        });
      }

      // Item 366: Buff-Denial & Intercept Smart AI (+320 pts for intercepting neutral buff / bonus tiles)
      const isBuffOrPowerTile = bIdx === 4 || elementalBoard[bIdx] !== undefined;
      if (isBuffOrPowerTile && flippedCount === 0) {
        score += 320;
        moveReason = 'Buff Deny (적 버프 선점 차단)';
      }

      // Item 362: Tempo Stalling Placement AI (Bait enemy aces by playing low-power/safe cards in corners)
      const isLowPowerCard = (card.power || 0) <= 60 || (!card.rarity || card.rarity === 'common');
      if (isLowPowerCard && isCorner && flippedCount === 0 && possibleBoardIndices.length >= 5) {
        score += 260;
        moveReason = 'Tempo Stall (적 필살기 유도 대기)';
      }

      // Item 370: 2-Ply Bait & Trap Placement AI (Deploy bait card to set up decisive next-turn capture)
      if (flippedCount === 0 && (row === 1 || col === 1) && !isCenter) {
        const centerCard = board[4];
        if (!centerCard) {
          score += 280;
          moveReason = 'Bait Trap (적 에이스 유인 트랩)';
        }
      }

      // Item 374: Enemy Synergy Disruption Heuristics (Intercept opponent 2-tile elemental alignment)
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];
      let isEnemySynergyIntercept = false;
      lines.forEach(l => {
        if (l.includes(bIdx)) {
          const otherTwo = l.filter(i => i !== bIdx);
          const c1 = board[otherTwo[0]];
          const c2 = board[otherTwo[1]];
          if (c1 && c2 && c1.owner !== side && c2.owner !== side && (c1.element === c2.element || c1.power === c2.power)) {
            isEnemySynergyIntercept = true;
          }
        }
      });
      if (isEnemySynergyIntercept) {
        score += 280;
        moveReason = 'Disrupt Chain (적 속성 연계 분단 차단)';
      }

      // Item 378: Card Auto-Rotation Optimization AI (Simulate 4 directional rotations for best capture angle)
      if (card.stats && card.stats.length === 4) {
        let bestRotBonus = 0;
        const statRotations = [
          card.stats,
          [card.stats[3], card.stats[0], card.stats[1], card.stats[2]],
          [card.stats[2], card.stats[3], card.stats[0], card.stats[1]],
          [card.stats[1], card.stats[2], card.stats[3], card.stats[0]],
        ];
        statRotations.forEach((rotStats, rotIdx) => {
          if (rotIdx === 0) return;
          const rotCard = { ...card, stats: rotStats as [number, number, number, number] };
          const rotBoard = simulateAbility(board, bIdx, rotCard);
          const rotAfter = checkFlips(rotBoard, bIdx, playerMultiplier, elementalBoard, isSuddenDeath);
          let rotFlips = 0;
          rotAfter.forEach((c, i) => {
            if (board[i] && board[i]!.owner !== side && c!.owner === side) rotFlips++;
          });
          if (rotFlips > flippedCount) {
            bestRotBonus = Math.max(bestRotBonus, (rotFlips - flippedCount) * 200 + 120);
          }
        });
        if (bestRotBonus > 0) {
          score += bestRotBonus;
          moveReason = 'Auto-Rotate (최적 각도 회전 캡처)';
        }
      }

      if (strategy === 'random') {
        score = Math.random() * 1000; // Randomly weight moves
      } else if (strategy === 'aggressive' || tacticalStance === 'attack') {
        score += (isCenter ? 140 : 0) + (exposeScore * 0.5 * stanceDefMult);
      } else if (strategy === 'defensive' || tacticalStance === 'defense') {
        score += (isCorner ? 180 : 0) + (exposeScore * 4.0 * stanceDefMult);
      } else {
        score += (isCorner ? 80 : 0) + (exposeScore * 2.0 * stanceDefMult);
      }

      // Elemental affinity bonus
      if (card.element && card.element === elementalBoard[bIdx]) {
        score += 60;
      }
      
      if (card.ability?.type === 'TIME_WARP') {
        score += 800; // Skipping opponent's turn is incredibly strong
      }

      // Lookahead Risk
      if (strategy !== 'aggressive' && tacticalStance !== 'attack') {
         let maxRisk = 0;
         dirs.forEach(d => {
            const nr = row + d.r;
            const nc = col + d.c;
            if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3 && !board[nr * 3 + nc]) {
               const ourStat = getCardStatWithBonus(card, d.m, elementalBoard[bIdx]);
               maxRisk = Math.max(maxRisk, 12 - ourStat); 
            }
         });
         score -= (maxRisk * 25 * stanceDefMult);
      }

      moves.push({ cardIdx: cIdx, boardIdx: bIdx, score, reason: moveReason });
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
