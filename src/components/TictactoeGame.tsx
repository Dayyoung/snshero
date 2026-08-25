import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface TictactoeGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type CellValue = '' | 'X' | 'O';
const BOARD_SIZE = 3;

export const TictactoeGame: React.FC<TictactoeGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [board, setBoard] = useState<CellValue[]>(() => Array(BOARD_SIZE * BOARD_SIZE).fill(''));
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<CellValue | 'DRAW'>('');
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcade_tictactoe') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const checkWinner = (b: CellValue[]): CellValue | 'DRAW' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const [x, y, z] of lines) {
      if (b[x] && b[x] === b[y] && b[x] === b[z]) {
        return b[x];
      }
    }
    if (b.every(cell => cell !== '')) return 'DRAW';
    return null;
  };

  const initGame = useCallback(() => {
    setBoard(Array(BOARD_SIZE * BOARD_SIZE).fill(''));
    setTurn('player');
    setIsGameOver(false);
    setWinner('');
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCellClick = (idx: number) => {
    if (board[idx] !== '' || turn !== 'player' || isGameOver || isPaused) return;

    // Player Move
    const newBoard = [...board];
    newBoard[idx] = 'X';
    setBoard(newBoard);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    const result = checkWinner(newBoard);
    if (result) {
      handleGameOver(result);
      return;
    }

    // AI Move
    setTurn('ai');
    setTimeout(() => {
      const emptyIndices = newBoard
        .map((val, i) => (val === '' ? i : -1))
        .filter(i => i !== -1);

      if (emptyIndices.length > 0) {
        // Simple AI: pick winning or blocking or random
        let aiPick = emptyIndices[0];

        // Check if AI can win
        for (const i of emptyIndices) {
          const test = [...newBoard];
          test[i] = 'O';
          if (checkWinner(test) === 'O') {
            aiPick = i;
            break;
          }
        }
        // Check if AI needs to block
        for (const i of emptyIndices) {
          const test = [...newBoard];
          test[i] = 'X';
          if (checkWinner(test) === 'X') {
            aiPick = i;
            break;
          }
        }

        newBoard[aiPick] = 'O';
        setBoard([...newBoard]);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

        const aiResult = checkWinner(newBoard);
        if (aiResult) {
          handleGameOver(aiResult);
        } else {
          setTurn('player');
        }
      }
    }, 400);
  };

  const handleGameOver = (res: CellValue | 'DRAW') => {
    setIsGameOver(true);
    setWinner(res);

    const isVictory = res === 'X';
    if (isVictory) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    const duration = (Date.now() - startTimeRef.current) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'arcade_tictactoe',
      gameTitle: '틱택토 결투',
      durationSeconds: duration,
      score: isVictory ? 2000 : res === 'DRAW' ? 1000 : 500,
      difficulty: 'NORMAL',
      isVictory: isVictory
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 3목 완성 승리' : 'STEP 1: 3-IN-A-ROW',
      title: isKo ? '3칸 일직선 완성' : 'Complete 3 in a Row',
      description: isKo
        ? '3x3 격자판에 X 표식을 놓아 가로, 세로, 대각선 3칸을 AI보다 먼저 연결하세요.'
        : 'Place X marks to complete a 3-in-a-row line before AI opponent.',
      keyPoints: isKo
        ? [
            '가로/세로/대각선 3목 완성 시 승리',
            'AI의 3목 형성 선제 방어',
            '무승부 시에도 기본 정산 포인트 지급'
          ]
        : [
            '3 marks in any line to win',
            'Block AI from completing 3-in-a-row',
            'Draw yields standard base points'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '격자 셀 원터치 탭' : 'One-Touch Cell Tap',
      description: isKo
        ? '원하는 빈 격자 셀을 직접 탭하여 즉시 수를 놓습니다.'
        : 'Tap any empty grid cell to place your mark with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 셀 탭: 즉시 표식 마킹',
            '⚡ 실시간 턴제 AI 결투',
            '🧠 3x3 정통 틱택토 룰'
          ]
        : [
            '👆 Tap Cell: Instant mark placement',
            '⚡ Real-time turn-based AI',
            '🧠 Standard 3x3 Tic-Tac-Toe rules'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '결투 종료 즉시 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon game finish.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '연속 승리 및 완승 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Win streak and victory bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '틱택토 결투' : 'Tic-Tac-Toe'}
        language={language}
        telemetries={[
          { label: isKo ? '턴' : 'Turn', value: turn === 'player' ? (isKo ? '내 차례 (X)' : 'YOU (X)') : (isKo ? 'AI 차례 (O)' : 'AI (O)'), color: turn === 'player' ? 'text-cyan-700 font-bold' : 'text-slate-500' },
          { label: isKo ? '상태' : 'State', value: isGameOver ? (winner === 'X' ? (isKo ? '승리' : 'WIN') : winner === 'O' ? (isKo ? '패배' : 'LOSE') : (isKo ? '무승부' : 'DRAW')) : (isKo ? '대결중' : 'PLAYING'), color: 'text-amber-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Grid Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm">
        <div className="w-full max-w-[320px] aspect-square grid grid-cols-3 gap-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-2">
          {board.map((cell, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleCellClick(idx)}
              disabled={cell !== '' || turn !== 'player' || isGameOver || isPaused}
              className="aspect-square bg-white border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-3xl font-bold rounded-none active:scale-95 transition-all cursor-pointer shadow-xs disabled:cursor-default"
            >
              {cell === 'X' && <span className="text-cyan-700">X</span>}
              {cell === 'O' && <span className="text-rose-600">O</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '원하는 칸을 탭하여 X를 놓으세요 (3칸 일직선 완성 시 승리)' : 'Tap an empty cell to place X (3-in-a-row wins)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_tictactoe"
          gameTitle={isKo ? '틱택토 결투: 3목 대전' : 'Tic-Tac-Toe: 3-in-a-Row'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default TictactoeGame;
