import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelBubblePopGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface BubbleCell {
  id: number;
  row: number;
  col: number;
  colorIdx: number;
  isBomb: boolean;
}

const BUBBLE_COLORS = [
  { bg: '#ef4444', icon: '🔴', border: '#b91c1c' },
  { bg: '#3b82f6', icon: '🔵', border: '#1d4ed8' },
  { bg: '#10b981', icon: '🟢', border: '#047857' },
  { bg: '#f59e0b', icon: '🟡', border: '#b45309' },
  { bg: '#a855f7', icon: '🟣', border: '#7e22ce' },
];

export const VoxelBubblePopGame: React.FC<VoxelBubblePopGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 99;
  const ROWS = 7;
  const COLS = 7;

  const [grid, setGrid] = useState<BubbleCell[][]>([]);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [burstMsg, setBurstMsg] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_bubble_burst') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    grid: [] as BubbleCell[][],
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    cellCounter: 1,
  });

  const createInitialGrid = useCallback((): BubbleCell[][] => {
    const newGrid: BubbleCell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: BubbleCell[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          id: stateRef.current.cellCounter++,
          row: r,
          col: c,
          colorIdx: Math.floor(Math.random() * BUBBLE_COLORS.length),
          isBomb: false,
        });
      }
      newGrid.push(row);
    }
    return newGrid;
  }, [COLS, ROWS]);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();

    const initial = createInitialGrid();
    s.grid = initial;
    setGrid(initial);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setBurstMsg(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, [createInitialGrid]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Find all connected bubbles of the same color (Flood Fill)
  const findConnectedGroup = (startR: number, startC: number, currentGrid: BubbleCell[][]): BubbleCell[] => {
    const target = currentGrid[startR]?.[startC];
    if (!target) return [];

    const visited = new Set<string>();
    const group: BubbleCell[] = [];
    const queue: [number, number][] = [[startR, startC]];
    visited.add(`${startR},${startC}`);

    if (target.isBomb) {
      // Bomb explodes 3x3 surrounding cells
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = startR + dr;
          const nc = startC + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && currentGrid[nr][nc]) {
            group.push(currentGrid[nr][nc]);
          }
        }
      }
      return group;
    }

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const cell = currentGrid[r][c];
      group.push(cell);

      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      dirs.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        const key = `${nr},${nc}`;
        if (
          nr >= 0 &&
          nr < ROWS &&
          nc >= 0 &&
          nc < COLS &&
          !visited.has(key) &&
          currentGrid[nr][nc] &&
          currentGrid[nr][nc].colorIdx === target.colorIdx &&
          !currentGrid[nr][nc].isBomb
        ) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      });
    }

    return group;
  };

  // Direct Screen Tap Bubble Burst Handler (Zero Joysticks)
  const handleBubbleTap = (r: number, c: number) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const group = findConnectedGroup(r, c, grid);
    const clickedCell = grid[r]?.[c];
    if (!clickedCell) return;

    if (group.length < 2 && !clickedCell.isBomb) {
      // Single bubble tap feedback
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      return;
    }

    // Burst Group!
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    const isLargeCluster = group.length >= 5;
    const burstPoints = group.length * 50 + (isLargeCluster ? 300 : 0) + s.combo * 40;
    s.score += burstPoints;
    s.combo += 1;
    if (s.combo > s.maxCombo) s.maxCombo = s.combo;

    setScore(s.score);
    setCombo(s.combo);
    setMaxCombo(s.maxCombo);

    if (isLargeCluster) {
      setBurstMsg(`MEGA BURST! +${burstPoints}P 💣`);
    } else {
      setBurstMsg(`+${burstPoints}P ✨`);
    }
    setTimeout(() => setBurstMsg(null), 600);

    const groupIds = new Set(group.map((b) => b.id));

    // Fall down physics & refill
    const newGrid: BubbleCell[][] = [];
    for (let col = 0; col < COLS; col++) {
      const remainingInCol: BubbleCell[] = [];
      for (let row = ROWS - 1; row >= 0; row--) {
        const cell = grid[row][col];
        if (!groupIds.has(cell.id)) {
          remainingInCol.unshift(cell);
        }
      }

      // If clicked a large cluster, spawn a bomb at top of that col
      if (isLargeCluster && col === c) {
        remainingInCol.unshift({
          id: s.cellCounter++,
          row: 0,
          col,
          colorIdx: 0,
          isBomb: true,
        });
      }

      // Fill missing slots from top
      while (remainingInCol.length < ROWS) {
        remainingInCol.unshift({
          id: s.cellCounter++,
          row: 0,
          col,
          colorIdx: Math.floor(Math.random() * BUBBLE_COLORS.length),
          isBomb: false,
        });
      }

      // Re-assign row indices
      remainingInCol.forEach((cell, rowIdx) => {
        cell.row = rowIdx;
        cell.col = col;
      });
    }

    // Build row-based 2D grid
    for (let row = 0; row < ROWS; row++) {
      const rowArr: BubbleCell[] = [];
      for (let col = 0; col < COLS; col++) {
        // Find cell by row/col
        const found = grid
          .flat()
          .concat(
            Array.from({ length: ROWS * COLS }, (_, idx) => ({
              id: s.cellCounter + idx,
              row,
              col,
              colorIdx: Math.floor(Math.random() * BUBBLE_COLORS.length),
              isBomb: false,
            }))
          )
          .find((cell) => cell.row === row && cell.col === col);

        rowArr.push(
          found || {
            id: s.cellCounter++,
            row,
            col,
            colorIdx: Math.floor(Math.random() * BUBBLE_COLORS.length),
            isBomb: false,
          }
        );
      }
      newGrid.push(rowArr);
    }

    // Reconstruct clean grid
    const cleanGrid: BubbleCell[][] = Array.from({ length: ROWS }, (_, rIdx) =>
      Array.from({ length: COLS }, (_, cIdx) => ({
        id: s.cellCounter++,
        row: rIdx,
        col: cIdx,
        colorIdx: Math.floor(Math.random() * BUBBLE_COLORS.length),
        isBomb: false,
      }))
    );

    // Apply falling column data
    for (let cIdx = 0; cIdx < COLS; cIdx++) {
      const colCells: BubbleCell[] = [];
      for (let rIdx = ROWS - 1; rIdx >= 0; rIdx--) {
        if (!groupIds.has(grid[rIdx][cIdx].id)) {
          colCells.unshift(grid[rIdx][cIdx]);
        }
      }
      if (isLargeCluster && cIdx === c) {
        colCells.unshift({
          id: s.cellCounter++,
          row: 0,
          col: cIdx,
          colorIdx: 0,
          isBomb: true,
        });
      }
      while (colCells.length < ROWS) {
        colCells.unshift({
          id: s.cellCounter++,
          row: 0,
          col: cIdx,
          colorIdx: Math.floor(Math.random() * BUBBLE_COLORS.length),
          isBomb: false,
        });
      }
      for (let rIdx = 0; rIdx < ROWS; rIdx++) {
        cleanGrid[rIdx][cIdx] = {
          ...colCells[rIdx],
          row: rIdx,
          col: cIdx,
        };
      }
    }

    setGrid(cleanGrid);
  };

  const endGame = () => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    setIsGameOver(true);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    const duration = (Date.now() - s.startTime) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'arcade_bubble_burst',
      gameTitle: '블리츠 버블 버스트',
      durationSeconds: duration,
      score: s.score + s.maxCombo * 80,
      difficulty: 'NIGHTMARE',
      isVictory: s.score >= 2000,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 탭하여 버블 폭발' : 'STEP 1: TAP TO BURST',
      title: isKo ? '같은 색상 버블 그룹을 터뜨리세요' : 'Tap Matching Bubble Clusters',
      description: isKo
        ? '가상 조이스틱 없이 화면 위 7x7 그리드에서 인접한 2개 이상의 같은 색상 버블을 직접 탭하여 터뜨리세요.'
        : 'Tap groups of 2 or more connected matching color bubbles to burst them.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 탭 매치)',
            '5개 이상 동시 폭발 시 3x3 폭탄 버블(💣) 생성',
            '연속 탭 시 콤보 배수 보너스 가산'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Match',
            'Burst 5+ bubbles to spawn a 3x3 Bomb Bubble (💣)',
            'Chain consecutive taps for massive combo multipliers'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 탭 (Direct Screen Tap)' : 'Direct Screen Tap',
      description: isKo
        ? '터뜨리고 싶은 버블 뭉치를 손가락으로 가볍게 탭합니다.'
        : 'Simply tap any matching color bubble cluster on screen.',
      keyPoints: isKo
        ? [
            '👆 원클릭 탭: 즉각적인 연쇄 버블 파티클 폭발',
            '💣 폭탄 탭: 주변 3x3 전방위 동시 소멸',
            '⚡ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 One-touch Tap: Instant cascading bubble bursts',
            '💣 Tap Bombs: Clear 3x3 radius simultaneously',
            '⚡ 35s time attack high-score sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '시간 종료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '최종 점수 및 맥스 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Score and max combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#070b14] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 버블 버스트' : 'Blitz Bubble Burst'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${combo}x`, color: combo > 3 ? 'text-amber-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-emerald-400 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch 7x7 Bubble Grid Viewport */}
      <div className="flex-1 w-full max-w-sm relative overflow-hidden flex items-center justify-center select-none touch-none p-3">
        <div className="grid grid-cols-7 gap-1.5 w-full aspect-square p-2 bg-slate-900/80 border border-cyan-500/20 rounded-none shadow-2xl">
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const colorInfo = BUBBLE_COLORS[cell.colorIdx] || BUBBLE_COLORS[0];
              return (
                <button
                  key={cell.id}
                  onClick={() => handleBubbleTap(rIdx, cIdx)}
                  className="w-full h-full flex items-center justify-center rounded-sm transition-transform active:scale-90 border font-mono text-base shadow-sm"
                  style={{
                    backgroundColor: cell.isBomb ? '#1e293b' : colorInfo.bg,
                    borderColor: cell.isBomb ? '#fbbf24' : colorInfo.border,
                  }}
                >
                  {cell.isBomb ? '💣' : colorInfo.icon}
                </button>
              );
            })
          )}
        </div>

        {/* Floating Burst Message */}
        {burstMsg && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-xl font-bold text-amber-300 drop-shadow-lg animate-bounce">
            {burstMsg}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '같은 색상 버블 뭉치를 탭하여 터뜨리세요 (5개 이상: 💣 폭탄)' : 'Tap matching color bubbles to burst (5+: 💣 Bomb)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_bubble_burst"
          gameTitle={isKo ? '블리츠 버블 버스트: 탭 매치 퍼즐' : 'Blitz Bubble Burst: Tap Match Puzzle'}
          customSteps={tutorialSteps}
          language={(language as Language) || 'ko'}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={(language as Language) || 'ko'}
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default VoxelBubblePopGame;
