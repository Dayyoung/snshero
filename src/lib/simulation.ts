
import { CardData, AiStrategy } from '../types';
import { Board, findBestMove, checkFlips } from './gameEngine';
import { CARD_DATABASE } from '../cardDatabase';

const generateRandomCard = (id: string): CardData => {
  const keys = Object.keys(CARD_DATABASE);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  const base = CARD_DATABASE[Number(randomKey)];
  return {
    id,
    title_dis: base.title_dis,
    stats: base.stats,
    rarity: base.rarity,
    level: base.level,
    imageIndex: Number(randomKey),
    owner: null
  };
};

export const runSimulation = (stratA: AiStrategy, stratB: AiStrategy, games: number = 100) => {
  let winsA = 0;
  let winsB = 0;
  let draws = 0;

  for (let g = 0; g < games; g++) {
    const deckA = Array(5).fill(null).map((_, i) => generateRandomCard(`a-${g}-${i}`));
    const deckB = Array(5).fill(null).map((_, i) => generateRandomCard(`b-${g}-${i}`));
    
    let board: Board = Array(9).fill(null);
    let handA = [...deckA];
    let handB = [...deckB];
    let turn: 'a' | 'b' = Math.random() > 0.5 ? 'a' : 'b';

    for (let moveCount = 0; moveCount < 9; moveCount++) {
      const currentHand = turn === 'a' ? handA : handB;
      const strategy = turn === 'a' ? stratA : stratB;
      const result = findBestMove(board, currentHand, strategy, turn === 'a' ? 'player' : 'ai');
      
      if (result) {
        const card = { ...currentHand[result.cardIdx], owner: turn === 'a' ? 'player' : 'ai' } as any;
        board[result.boardIdx] = card;
        board = checkFlips(board, result.boardIdx);
        
        if (turn === 'a') {
          handA = handA.filter((_, i) => i !== result.cardIdx);
          turn = 'b';
        } else {
          handB = handB.filter((_, i) => i !== result.cardIdx);
          turn = 'a';
        }
      }
    }

    const scoreA = board.filter(c => c?.owner === 'player').length;
    const scoreB = board.filter(c => c?.owner === 'ai').length;

    if (scoreA > scoreB) winsA++;
    else if (scoreB > scoreA) winsB++;
    else draws++;
  }

  return { stratA, stratB, winsA, winsB, draws, total: games };
};
