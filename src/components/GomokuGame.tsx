import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface GomokuGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type CellValue = '' | 'B' | 'W';

const BOARD_SIZE = 15;
const WIN_COUNT = 5;

export const GomokuGame: React.FC<GomokuGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcade_gomoku') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState(false);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [moves, setMoves] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameRef = useRef({
    board: Array(BOARD_SIZE * BOARD_SIZE).fill('') as CellValue[],
    turn: 'player' as 'player' | 'ai',
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    moves: 0,
    startTime: Date.now(),
  });

  const checkWin = (board: CellValue[], row: number, col: number, val: CellValue): boolean => {
    if (!val) return false;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]] as const) {
      let count = 1;
      for (const sign of [-1, 1] as const) {
        let r = row + dr * sign;
        let c = col + dc * sign;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r * BOARD_SIZE + c] === val) {
          count++;
          r += dr * sign;
          c += dc * sign;
        }
      }
      if (count >= WIN_COUNT) return true;
    }
    return false;
  };

  const aiPickMove = (board: CellValue[]): number | null => {
    // Quick heuristic AI
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const idx = r * BOARD_SIZE + c;
        if (board[idx] === '') {
          // Check winning move
          board[idx] = 'W';
          if (checkWin(board, r, c, 'W')) {
            board[idx] = '';
            return idx;
          }
          board[idx] = '';
        }
      }
    }
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const idx = r * BOARD_SIZE + c;
        if (board[idx] === '') {
          // Check blocking move
          board[idx] = 'B';
          if (checkWin(board, r, c, 'B')) {
            board[idx] = '';
            return idx;
          }
          board[idx] = '';
        }
      }
    }
    // Center-ish fallback
    const empty: number[] = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === '') empty.push(i);
    }
    return empty.length > 0 ? empty[Math.floor(Math.random() * empty.length)] : null;
  };

  const renderBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const g = gameRef.current;
    const cellSize = canvas.width / (BOARD_SIZE + 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Wood / Cream Background
    ctx.fillStyle = '#fdfcfc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(15, 0, 0, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 1; i <= BOARD_SIZE; i++) {
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(cellSize, i * cellSize);
      ctx.lineTo(BOARD_SIZE * cellSize, i * cellSize);
      ctx.stroke();

      // Vertical
      ctx.beginPath();
      ctx.moveTo(i * cellSize, cellSize);
      ctx.lineTo(i * cellSize, BOARD_SIZE * cellSize);
      ctx.stroke();
    }

    // Pieces
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const val = g.board[r * BOARD_SIZE + c];
        if (val) {
          const cx = (c + 1) * cellSize;
          const cy = (r + 1) * cellSize;

          ctx.beginPath();
          ctx.arc(cx, cy, cellSize * 0.4, 0, Math.PI * 2);
          if (val === 'B') {
            ctx.fillStyle = '#201d1d';
            ctx.fill();
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#201d1d';
            ctx.stroke();
          }
        }
      }
    }
  }, []);

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.board = Array(BOARD_SIZE * BOARD_SIZE).fill('') as CellValue[];
    g.turn = 'player';
    g.moves = 0;
    g.isGameOver = false;
    g.isVictory = false;
    g.startTime = Date.now();
    setTurn('player');
    setMoves(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
    renderBoard();
  }, [renderBoard]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const placeStone = (r: number, c: number) => {
    const g = gameRef.current;
    if (g.isGameOver || g.isPaused || g.turn !== 'player') return;

    const idx = r * BOARD_SIZE + c;
    if (g.board[idx] !== '') return;

    // Player (B) Move
    g.board[idx] = 'B';
    g.moves += 1;
    setMoves(g.moves);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    renderBoard();

    // Check Player Win
    if (checkWin(g.board, r, c, 'B')) {
      g.isVictory = true;
      g.isGameOver = true;
      setIsGameOver(true);
      const duration = (Date.now() - g.startTime) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'arcade_gomoku',
        gameTitle: '클래식 오목 대국',
        durationSeconds: duration,
        score: 3000,
        difficulty: 'HARD',
        isVictory: true
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
      return;
    }

    // AI Turn
    g.turn = 'ai';
    setTurn('ai');

    setTimeout(() => {
      if (g.isGameOver) return;
      const aiIdx = aiPickMove(g.board);
      if (aiIdx !== null) {
        const ar = Math.floor(aiIdx / BOARD_SIZE);
        const ac = aiIdx % BOARD_SIZE;
        g.board[aiIdx] = 'W';
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        renderBoard();

        if (checkWin(g.board, ar, ac, 'W')) {
          g.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - g.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'arcade_gomoku',
            gameTitle: '클래식 오목 대국',
            durationSeconds: duration,
            score: 500,
            difficulty: 'HARD',
            isVictory: false
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          return;
        }
      }
      g.turn = 'player';
      setTurn('player');
    }, 400);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 5목 완성 승리' : 'STEP 1: GOMOKU 5-IN-A-ROW',
      title: isKo ? '가로/세로/대각선 5돌 연속 배치' : 'Align 5 Consecutive Stones',
      description: isKo
        ? '15x15 바둑판에 흑돌을 놓아 AI 백돌보다 먼저 5목을 연속으로 완성하세요.'
        : 'Place black stones on 15x15 board to make 5 in a row before AI.',
      keyPoints: isKo
        ? [
            '가로/세로/대각선 5개 연속 연결 시 승리',
            'AI 백돌의 3목/4목 형성 선제 방어',
            '최소 수로 승리 시 고득점'
          ]
        : [
            'Align 5 stones in any direction to win',
            'Block AI from forming 4-in-a-row',
            'Fewer moves yield higher scores'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '바둑판 교차점 원터치 착수' : 'Touch Grid Intersection',
      description: isKo
        ? '바둑판의 원하는 교차점을 터치하여 즉시 돌을 착수합니다.'
        : 'Tap any grid intersection to place your stone with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 교차점 탭: 즉시 착수',
            '⚡ 실시간 턴제 AI 대국',
            '🧩 15x15 정통 오목 룰'
          ]
        : [
            '👆 Tap Intersection: Instant placement',
            '⚡ Real-time turn-based AI',
            '🧩 Standard 15x15 Gomoku rules'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '대국 승리 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon victory.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '착수 턴수 및 완승 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Turn count and win bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '클래식 오목' : 'Classic Gomoku'}
        language={language}
        telemetries={[
          { label: isKo ? '턴' : 'Turn', value: turn === 'player' ? (isKo ? '내 차례 (흑)' : 'YOU (Black)') : (isKo ? 'AI 차례 (백)' : 'AI (White)'), color: turn === 'player' ? 'text-amber-600 font-bold' : 'text-slate-500' },
          { label: isKo ? '착수' : 'Moves', value: `${moves}수`, color: 'text-cyan-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Board Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm">
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          className="border border-[rgba(15,0,0,0.15)] shadow-xs rounded-none bg-white cursor-pointer"
          onClick={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cellSize = canvas.width / (BOARD_SIZE + 1);
            const col = Math.round(x / cellSize) - 1;
            const row = Math.round(y / cellSize) - 1;

            if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
              placeStone(row, col);
            }
          }}
        />
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '바둑판 교차점을 탭하여 착수하세요 (흑돌 5목 연결 시 승리)' : 'Tap grid intersections to place black stones'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_gomoku"
          gameTitle={isKo ? '클래식 오목 대국: 5목 결투' : 'Classic Gomoku: 5-in-a-Row'}
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
export default GomokuGame;
