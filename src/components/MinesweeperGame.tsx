import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { cn } from '../lib/utils';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';
import { drawCardSprite } from '../lib/canvasCardRenderer';

interface MinesweeperGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const GRID_SIZE = 8;
const MINES_COUNT = 8;
const CANVAS_SIZE = 340;

type CellState = 'hidden' | 'revealed' | 'flagged';

export const MinesweeperGame: React.FC<MinesweeperGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 20;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [flagMode, setFlagMode] = useState(false);
  const [flagsLeft, setFlagsLeft] = useState(MINES_COUNT);
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcade_minesweeper') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameRef = useRef({
    mines: [] as boolean[][],
    numbers: [] as number[][],
    states: [] as CellState[][],
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    timer: 0,
    startTime: Date.now(),
  });

  const cellSize = CANVAS_SIZE / GRID_SIZE;

  const renderBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const g = gameRef.current;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const state = g.states[r]?.[c] || 'hidden';
        const num = g.numbers[r]?.[c] || 0;
        const isMine = g.mines[r]?.[c] || false;
        const x = c * cellSize;
        const y = r * cellSize;

        if (state === 'revealed') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.strokeStyle = 'rgba(15, 0, 0, 0.12)';
          ctx.strokeRect(x, y, cellSize, cellSize);

          if (isMine) {
            drawCardSprite(
              ctx,
              4,
              x + 2,
              y + 2,
              cellSize - 4,
              cellSize - 4,
              {
                circleClip: true,
                borderWidth: 1.5,
                borderColor: '#ef4444',
                shadowBlur: 4,
                shadowColor: 'rgba(239, 68, 68, 0.6)',
              }
            );
          } else if (num > 0) {
            ctx.font = 'bold 16px monospace';
            ctx.fillStyle = num === 1 ? '#0284c7' : num === 2 ? '#16a34a' : num === 3 ? '#dc2626' : '#9333ea';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${num}`, x + cellSize / 2, y + cellSize / 2);
          }
        } else {
          ctx.fillStyle = '#f1eeee';
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.strokeStyle = 'rgba(15, 0, 0, 0.15)';
          ctx.strokeRect(x, y, cellSize, cellSize);

          if (state === 'flagged') {
            drawCardSprite(
              ctx,
              playerHeroId,
              x + 3,
              y + 3,
              cellSize - 6,
              cellSize - 6,
              {
                circleClip: true,
                borderWidth: 1,
                borderColor: '#3b82f6',
                shadowBlur: 4,
                shadowColor: 'rgba(59, 130, 246, 0.5)',
              }
            );
          }
        }
      }
    }
  }, [cellSize, playerHeroId]);

  const initGame = useCallback(() => {
    const g = gameRef.current;
    const mines: boolean[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
    const states: CellState[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('hidden'));

    // Place 8 mines
    let placed = 0;
    while (placed < MINES_COUNT) {
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);
      if (!mines[r][c]) {
        mines[r][c] = true;
        placed++;
      }
    }

    // Calculate numbers
    const numbers: number[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (mines[r][c]) {
          numbers[r][c] = -1;
          continue;
        }
        let cnt = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && mines[nr][nc]) {
              cnt++;
            }
          }
        }
        numbers[r][c] = cnt;
      }
    }

    g.mines = mines;
    g.numbers = numbers;
    g.states = states;
    g.isGameOver = false;
    g.isVictory = false;
    g.startTime = Date.now();

    setFlagsLeft(MINES_COUNT);
    setTimer(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
    renderBoard();
  }, [renderBoard]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGameOver, isPaused]);

  const revealCell = (r: number, c: number) => {
    const g = gameRef.current;
    if (g.isGameOver || g.isPaused || r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
    if (g.states[r][c] !== 'hidden') return;

    if (g.mines[r][c]) {
      // Boom!
      g.states[r][c] = 'revealed';
      g.isGameOver = true;
      setIsGameOver(true);
      renderBoard();
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

      const duration = (Date.now() - g.startTime) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'arcade_minesweeper',
        gameTitle: '클래식 지뢰찾기',
        durationSeconds: duration,
        score: 500,
        difficulty: 'HARD',
        isVictory: false
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
      return;
    }

    // Safe reveal (flood fill if 0)
    const queue = [[r, c]];
    g.states[r][c] = 'revealed';

    while (queue.length > 0) {
      const [cr, cc] = queue.shift()!;
      if (g.numbers[cr][cc] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
              if (g.states[nr][nc] === 'hidden') {
                g.states[nr][nc] = 'revealed';
                if (g.numbers[nr][nc] === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    renderBoard();

    // Check Victory
    let hiddenSafe = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (!g.mines[i][j] && g.states[i][j] === 'hidden') {
          hiddenSafe++;
        }
      }
    }

    if (hiddenSafe === 0) {
      g.isVictory = true;
      g.isGameOver = true;
      setIsGameOver(true);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      const duration = (Date.now() - g.startTime) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'arcade_minesweeper',
        gameTitle: '클래식 지뢰찾기',
        durationSeconds: duration,
        score: 2500,
        difficulty: 'HARD',
        isVictory: true
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    }
  };

  const toggleFlag = (r: number, c: number) => {
    const g = gameRef.current;
    if (g.isGameOver || g.isPaused || r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
    if (g.states[r][c] === 'revealed') return;

    if (g.states[r][c] === 'hidden') {
      g.states[r][c] = 'flagged';
      setFlagsLeft(f => f - 1);
    } else {
      g.states[r][c] = 'hidden';
      setFlagsLeft(f => f + 1);
    }
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    renderBoard();
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 안전 구역 100% 개방' : 'STEP 1: CLEAR SAFE CELLS',
      title: isKo ? '8개 지뢰 회피 & 숫자 힌트 분석' : 'Avoid 8 Mines & Decode Numbers',
      description: isKo
        ? '숫자 힌트를 분석하여 8개의 위험 지뢰를 피해 모든 안전 타일을 개방하세요.'
        : 'Decode neighbor counts to clear all safe cells while avoiding 8 hidden mines.',
      keyPoints: isKo
        ? [
            '모든 안전 타일 오픈 시 즉시 승리',
            '지뢰 타일 탭 시 즉시 게임 오버',
            '숫자는 인접 8칸 내 지뢰 개수를 의미'
          ]
        : [
            'Clear all safe cells to win',
            'Tapping a mine triggers game over',
            'Numbers represent adjacent mine counts'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '원터치 모드 전환 & 탭' : 'Tap & Flag Toggle',
      description: isKo
        ? '하단 버튼으로 열기/깃발 모드를 원터치 전환하고 타일을 탭합니다.'
        : 'Toggle Dig/Flag mode and tap tiles directly.',
      keyPoints: isKo
        ? [
            '👆 타일 탭: 안전 구역 개방',
            '🚩 깃발 모드: 의심 타일 마킹',
            '⚡ 0번 타일 자동 연쇄 오픈'
          ]
        : [
            '👆 Tap Tile: Open safe cell',
            '🚩 Flag Mode: Mark suspected mine',
            '⚡ Zero-tile automatic floodfill'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '지뢰 탐지 완수 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon sweep completion.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '소요 시간 및 잔여 깃발 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Time and flag accuracy bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '클래식 지뢰찾기' : 'Classic Minesweeper'}
        language={language}
        telemetries={[
          { label: isKo ? '시간' : 'Time', value: `${timer}s`, color: 'text-cyan-700 font-bold' },
          { label: isKo ? '깃발' : 'Flags', value: `${flagsLeft}`, color: 'text-rose-600 font-bold' }
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
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border border-[rgba(15,0,0,0.15)] shadow-xs rounded-none bg-white cursor-pointer"
          onClick={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const c = Math.floor(x / cellSize);
            const r = Math.floor(y / cellSize);

            if (flagMode) {
              toggleFlag(r, c);
            } else {
              revealCell(r, c);
            }
          }}
        />
      </div>

      {/* Dig vs Flag Toggle Button */}
      <div className="shrink-0 flex items-center justify-center gap-3 w-full max-w-xs mx-auto pb-4 px-3 select-none">
        <button
          type="button"
          onClick={() => setFlagMode(false)}
          className={cn(
            'flex-1 py-2.5 rounded-sm font-bold text-xs border transition-all touch-manipulation',
            !flagMode ? 'bg-[#201d1d] text-white border-[#201d1d]' : 'bg-black/5 text-[#201d1d] border-[rgba(15,0,0,0.15)]'
          )}
        >
          🔍 {isKo ? '열기 모드' : 'Dig Mode'}
        </button>
        <button
          type="button"
          onClick={() => setFlagMode(true)}
          className={cn(
            'flex-1 py-2.5 rounded-sm font-bold text-xs border transition-all touch-manipulation',
            flagMode ? 'bg-rose-600 text-white border-rose-600' : 'bg-black/5 text-[#201d1d] border-[rgba(15,0,0,0.15)]'
          )}
        >
          🚩 {isKo ? '깃발 모드' : 'Flag Mode'}
        </button>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_minesweeper"
          gameTitle={isKo ? '클래식 지뢰찾기: 지뢰 탐지전' : 'Classic Minesweeper: Demining'}
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
export default MinesweeperGame;
