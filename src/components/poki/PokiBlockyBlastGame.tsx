import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiBlockyBlastGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Piece {
  id: number;
  shape: number[][]; // 2D array representing filled cells
  color: string;
  charId: number;
}

export const PokiBlockyBlastGame: React.FC<PokiBlockyBlastGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 9;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [linesCleared, setLinesCleared] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(50);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_blocky_blast') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    gridSize: 8,
    grid: Array(8).fill(null).map(() => Array(8).fill(0)), // 0: empty, 1+: charId
    availablePieces: [] as Piece[],
    selectedPieceIdx: -1,
    dragPos: { x: 0, y: 0 },
    combo: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; alpha: number }[],
  });

  const generatePieces = useCallback(() => {
    const shapes = [
      [[1]], // 1x1
      [[1, 1]], // 2x1
      [[1], [1]], // 1x2
      [[1, 1], [1, 1]], // 2x2
      [[1, 1, 1]], // 3x1
      [[1], [1], [1]], // 1x3
      [[1, 0], [1, 1]], // L small
      [[0, 1], [1, 1]], // J small
      [[1, 1, 1], [0, 1, 0]], // T shape
    ];
    const colors = ['#f59e0b', '#38bdf8', '#10b981', '#a855f7', '#ef4444'];
    const chars = [101, 105, 109, 115, 120];

    const pieces: Piece[] = [];
    for (let i = 0; i < 3; i++) {
      const sh = shapes[Math.floor(Math.random() * shapes.length)];
      pieces.push({
        id: Date.now() + i,
        shape: sh,
        color: colors[i % colors.length],
        charId: chars[i % chars.length],
      });
    }
    stateRef.current.availablePieces = pieces;
  }, []);

  const initGame = useCallback(() => {
    stateRef.current.grid = Array(8).fill(null).map(() => Array(8).fill(0));
    stateRef.current.combo = 0;
    generatePieces();
  }, [generatePieces]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(score >= 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial, score]);

  const handleGameOver = useCallback((victory: boolean) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = score + (victory ? 400 : 80);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_blockyblast',
      gameTitle: isKo ? '블로키 블래스트 퍼즐' : 'Blocky Blast Puzzle',
      durationSeconds: 50 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && linesCleared >= 10,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, linesCleared, isKo, onReward, playSfx]);

  // Check and clear filled lines
  const checkLines = useCallback((gridOriginX: number, gridOriginY: number, cellSize: number) => {
    const grid = stateRef.current.grid;
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    // Check rows
    for (let r = 0; r < 8; r++) {
      if (grid[r].every(v => v !== 0)) {
        rowsToClear.push(r);
      }
    }

    // Check cols
    for (let c = 0; c < 8; c++) {
      let full = true;
      for (let r = 0; r < 8; r++) {
        if (grid[r][c] === 0) {
          full = false;
          break;
        }
      }
      if (full) colsToClear.push(c);
    }

    if (rowsToClear.length > 0 || colsToClear.length > 0) {
      // Clear rows
      rowsToClear.forEach(r => {
        for (let c = 0; c < 8; c++) {
          grid[r][c] = 0;
          // Blast particles
          for (let p = 0; p < 3; p++) {
            stateRef.current.particles.push({
              x: gridOriginX + c * cellSize + cellSize / 2,
              y: gridOriginY + r * cellSize + cellSize / 2,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: '#38bdf8',
              alpha: 1,
            });
          }
        }
      });

      // Clear cols
      colsToClear.forEach(c => {
        for (let r = 0; r < 8; r++) {
          grid[r][c] = 0;
          for (let p = 0; p < 3; p++) {
            stateRef.current.particles.push({
              x: gridOriginX + c * cellSize + cellSize / 2,
              y: gridOriginY + r * cellSize + cellSize / 2,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: '#f59e0b',
              alpha: 1,
            });
          }
        }
      });

      const totalLines = rowsToClear.length + colsToClear.length;
      setLinesCleared(l => l + totalLines);
      const points = totalLines * 120 * totalLines;
      setScore(s => s + points);
      stateRef.current.combo += totalLines;

      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

      if (score + points >= 1000) {
        handleGameOver(true);
      }
    }
  }, [playSfx, score, handleGameOver]);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const gridSize = 8;
    const cellSize = Math.min((width - 40) / gridSize, 38);
    const gridOriginX = (width - cellSize * gridSize) / 2;
    const gridOriginY = 70;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const grid = stateRef.current.grid;
      const pieces = stateRef.current.availablePieces;
      const particles = stateRef.current.particles;

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Dark board background
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid Board Frame
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(gridOriginX - 6, gridOriginY - 6, cellSize * gridSize + 12, cellSize * gridSize + 12);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(gridOriginX - 6, gridOriginY - 6, cellSize * gridSize + 12, cellSize * gridSize + 12);

      // Draw Grid Cells
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const cellX = gridOriginX + c * cellSize;
          const cellY = gridOriginY + r * cellSize;

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);

          const cellVal = grid[r][c];
          if (cellVal > 0) {
            // Draw card sprite block
            drawCardSprite(ctx, cellVal, cellX + 2, cellY + 2, cellSize - 4, cellSize - 4, {
              roundedRadius: 4,
              borderWidth: 1,
              borderColor: '#f59e0b',
            });
          }
        }
      }

      // Draw Bottom Piece Slots
      const slotY = gridOriginY + cellSize * gridSize + 40;
      const pieceSlotW = width / 3;

      pieces.forEach((p, idx) => {
        if (stateRef.current.selectedPieceIdx === idx) return; // Being dragged
        const centerX = pieceSlotW * idx + pieceSlotW / 2;
        const pRows = p.shape.length;
        const pCols = p.shape[0].length;
        const pBlockSize = 20;
        const startX = centerX - (pCols * pBlockSize) / 2;
        const startY = slotY - (pRows * pBlockSize) / 2;

        for (let r = 0; r < pRows; r++) {
          for (let c = 0; c < pCols; c++) {
            if (p.shape[r][c]) {
              drawCardSprite(ctx, p.charId, startX + c * pBlockSize, startY + r * pBlockSize, pBlockSize - 2, pBlockSize - 2, {
                roundedRadius: 3,
                borderWidth: 1,
                borderColor: p.color,
              });
            }
          }
        }
      });

      // Draw Dragged Piece
      if (stateRef.current.selectedPieceIdx >= 0) {
        const selP = pieces[stateRef.current.selectedPieceIdx];
        if (selP) {
          const dragX = stateRef.current.dragPos.x;
          const dragY = stateRef.current.dragPos.y;
          const pRows = selP.shape.length;
          const pCols = selP.shape[0].length;

          for (let r = 0; r < pRows; r++) {
            for (let c = 0; c < pCols; c++) {
              if (selP.shape[r][c]) {
                const bX = dragX + (c - pCols / 2) * cellSize;
                const bY = dragY + (r - pRows / 2) * cellSize - 40; // Offset above finger
                drawCardSprite(ctx, selP.charId, bX, bY, cellSize - 2, cellSize - 2, {
                  roundedRadius: 4,
                  borderWidth: 2,
                  borderColor: '#38bdf8',
                  shadowBlur: 10,
                  shadowColor: '#38bdf8',
                });
              }
            }
          }
        }
      }

      // Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.04;
        if (pt.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.fillRect(pt.x, pt.y, 5, 5);
        ctx.globalAlpha = 1;
      }

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial]);

  // Touch drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const slotW = width / 3;
    const slotY = 70 + Math.min((width - 40) / 8, 38) * 8 + 40;

    // Check which piece touched
    if (touchY > slotY - 40 && touchY < slotY + 60) {
      const idx = Math.floor(touchX / slotW);
      if (idx >= 0 && idx < stateRef.current.availablePieces.length) {
        stateRef.current.selectedPieceIdx = idx;
        stateRef.current.dragPos = { x: touchX, y: touchY };
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stateRef.current.selectedPieceIdx < 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.dragPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerUp = () => {
    const selIdx = stateRef.current.selectedPieceIdx;
    if (selIdx < 0) return;

    const canvas = canvasRef.current;
    if (!canvas) {
      stateRef.current.selectedPieceIdx = -1;
      return;
    }

    const width = canvas.clientWidth;
    const cellSize = Math.min((width - 40) / 8, 38);
    const gridOriginX = (width - cellSize * 8) / 2;
    const gridOriginY = 70;

    const piece = stateRef.current.availablePieces[selIdx];
    const dragX = stateRef.current.dragPos.x;
    const dragY = stateRef.current.dragPos.y - 40;

    // Calculate snapped grid coordinate
    const pCols = piece.shape[0].length;
    const pRows = piece.shape.length;
    const snappedCol = Math.round((dragX - gridOriginX - (pCols * cellSize) / 2) / cellSize);
    const snappedRow = Math.round((dragY - gridOriginY - (pRows * cellSize) / 2) / cellSize);

    // Validate placement
    const grid = stateRef.current.grid;
    let canPlace = true;

    for (let r = 0; r < pRows; r++) {
      for (let c = 0; c < pCols; c++) {
        if (piece.shape[r][c]) {
          const gr = snappedRow + r;
          const gc = snappedCol + c;
          if (gr < 0 || gr >= 8 || gc < 0 || gc >= 8 || grid[gr][gc] !== 0) {
            canPlace = false;
            break;
          }
        }
      }
      if (!canPlace) break;
    }

    if (canPlace) {
      // Place piece on grid
      for (let r = 0; r < pRows; r++) {
        for (let c = 0; c < pCols; c++) {
          if (piece.shape[r][c]) {
            grid[snappedRow + r][snappedCol + c] = piece.charId;
          }
        }
      }

      setScore(s => s + 25);
      stateRef.current.availablePieces.splice(selIdx, 1);
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      // Check filled lines
      checkLines(gridOriginX, gridOriginY, cellSize);

      // If all 3 pieces used, spawn new ones!
      if (stateRef.current.availablePieces.length === 0) {
        generatePieces();
      }
    }

    stateRef.current.selectedPieceIdx = -1;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '블로키 블래스트 퍼즐' : 'Blocky Blast Puzzle',
      badge: 'MISSION 09',
      description: isKo
        ? '하단의 블록을 8x8 보드로 드래그하여 배치하세요! 가로줄 또는 세로줄을 가득 채우면 한 번에 폭파되며 콤보 점수를 얻습니다.'
        : 'Drag pieces onto the 8x8 grid! Fill entire rows or columns to trigger explosive blasts and combo scores.',
      keyPoints: isKo
        ? ['블록을 드래그하여 8x8 배치', '가로/세로 라인 폭파 클리어', '콤보 시 보너스 점수']
        : ['Drag blocks onto 8x8 grid', 'Clear horizontal/vertical lines', 'Combo bonuses for multi-clears'],
    },
    {
      title: isKo ? '라인 클리어 & 1,000점 달성' : 'Line Clears & Win',
      badge: 'LINE CLEAR',
      description: isKo
        ? '여러 줄을 동시에 클리어하면 엄청난 폭발과 함께 고득점을 획득합니다. 스코어 1,000점을 달성하여 승리하세요!'
        : 'Clear multiple lines simultaneously for huge combo bonuses and reach 1,000 points to win!',
      keyPoints: isKo
        ? ['다중 라인 동시 파괴', '목표 1,000점 달성', '100% 모바일 원터치 조작']
        : ['Multi-line explosive clear', 'Reach 1,000 pts goal', '100% pure touch controls'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.09 블로키 블래스트' : 'No.09 Blocky Blast'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`라인: ${linesCleared}줄 클리어`}
        combo={stateRef.current.combo}
        onExit={onExit}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full rounded-sm border border-slate-800 touch-none shadow-inner"
        />

        {/* Action Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs text-amber-400 font-bold tracking-wider animate-pulse">
            {isKo ? '🧩 하단 블록을 그리드로 드래그하여 배치' : '🧩 DRAG BLOCKS ONTO GRID'}
          </p>
        </div>
      </div>

      {/* Victory Reward Modal */}
      {settlementReceipt && (
        <VictoryRewardModal
          isOpen={isGameOver}
          isVictory={isVictory}
          score={score}
          receipt={settlementReceipt}
          onConfirm={onExit}
          onRestart={() => {
            setIsGameOver(false);
            setIsVictory(false);
            setSettlementReceipt(null);
            setScore(0);
            setLinesCleared(0);
            setTimeLeft(50);
            initGame();
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.09 블로키 블래스트' : 'No.09 Blocky Blast'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_blocky_blast', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};

export default PokiBlockyBlastGame;
