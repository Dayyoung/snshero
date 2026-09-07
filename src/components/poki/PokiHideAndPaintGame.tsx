import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiHideAndPaintGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Guard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  viewDist: number;
  fov: number; // radians
  monsterId: number;
}

export const PokiHideAndPaintGame: React.FC<PokiHideAndPaintGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 2;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [stage, setStage] = useState<number>(1);
  const totalStages = 3;
  const [paintedPct, setPaintedPct] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(40);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_hide_and_paint') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    player: {
      x: 80,
      y: 80,
      vx: 0,
      vy: 0,
      speed: 3.5,
      isMoving: false,
      isCamouflaged: false,
      targetX: 80,
      targetY: 80,
    },
    gridSize: 20,
    gridCols: 20,
    gridRows: 25,
    paintedGrid: [] as boolean[],
    guards: [] as Guard[],
    isTouchActive: false,
    combo: 0,
  });

  const initStage = useCallback((stageNum: number) => {
    const cols = 20;
    const rows = 25;
    stateRef.current.gridCols = cols;
    stateRef.current.gridRows = rows;
    stateRef.current.paintedGrid = new Array(cols * rows).fill(false);

    stateRef.current.player.x = 80;
    stateRef.current.player.y = 80;
    stateRef.current.player.targetX = 80;
    stateRef.current.player.targetY = 80;
    stateRef.current.player.isMoving = false;

    // Create guards
    const guardCount = 2 + stageNum;
    const guards: Guard[] = [];
    const monsterIds = [105, 108, 112, 115, 120];

    for (let i = 0; i < guardCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      guards.push({
        x: 150 + Math.random() * 180,
        y: 150 + Math.random() * 250,
        vx: Math.cos(angle) * (1.5 + stageNum * 0.3),
        vy: Math.sin(angle) * (1.5 + stageNum * 0.3),
        angle,
        speed: 1.5 + stageNum * 0.3,
        viewDist: 100 + stageNum * 10,
        fov: 0.7, // ~40 degrees
        monsterId: monsterIds[i % monsterIds.length],
      });
    }

    stateRef.current.guards = guards;
    setPaintedPct(0);
  }, []);

  useEffect(() => {
    initStage(stage);
  }, [stage, initStage]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial]);

  const handleGameOver = useCallback((victory: boolean) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = score + (victory ? 500 : 80);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_hide_and_paint',
      gameTitle: isKo ? '하이드 앤 페인트' : 'Hide and Paint',
      durationSeconds: 40 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && timeLeft > 15,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, isKo, onReward, playSfx]);

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

    const cellW = width / stateRef.current.gridCols;
    const cellH = height / stateRef.current.gridRows;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const p = stateRef.current.player;
      const guards = stateRef.current.guards;
      const painted = stateRef.current.paintedGrid;
      const cols = stateRef.current.gridCols;
      const rows = stateRef.current.gridRows;

      // Player Movement towards target
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 4) {
        p.isMoving = true;
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;

        // Paint current cell
        const cCol = Math.floor(p.x / cellW);
        const cRow = Math.floor(p.y / cellH);
        if (cCol >= 0 && cCol < cols && cRow >= 0 && cRow < rows) {
          const idx = cRow * cols + cCol;
          if (!painted[idx]) {
            painted[idx] = true;
            setScore(s => s + 5);
            stateRef.current.combo++;

            // Count painted
            const totalCells = cols * rows;
            const paintedCount = painted.filter(Boolean).length;
            const pct = Math.round((paintedCount / totalCells) * 100);
            setPaintedPct(pct);

            if (pct >= 65) {
              if (stage < totalStages) {
                setStage(prev => prev + 1);
                setScore(s => s + 250);
              } else {
                handleGameOver(true);
              }
              return;
            }
          }
        }
      } else {
        p.isMoving = false;
      }

      // Check Camouflage: stationary on a painted cell
      const curCol = Math.floor(p.x / cellW);
      const curRow = Math.floor(p.y / cellH);
      const curIdx = curRow * cols + curCol;
      p.isCamouflaged = !p.isMoving && Boolean(painted[curIdx]);

      // Guards Update & Vision Cone Detection
      for (const g of guards) {
        g.x += g.vx;
        g.y += g.vy;

        // Bounce walls
        if (g.x < 20 || g.x > width - 20) {
          g.vx *= -1;
          g.angle = Math.atan2(g.vy, g.vx);
        }
        if (g.y < 20 || g.y > height - 20) {
          g.vy *= -1;
          g.angle = Math.atan2(g.vy, g.vx);
        }

        // Vision check on player if player is not camouflaged
        if (!p.isCamouflaged) {
          const pdx = p.x - g.x;
          const pdy = p.y - g.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

          if (pdist < g.viewDist) {
            const angleToP = Math.atan2(pdy, pdx);
            let diffAngle = Math.abs(angleToP - g.angle);
            while (diffAngle > Math.PI) diffAngle = Math.abs(diffAngle - Math.PI * 2);

            if (diffAngle < g.fov) {
              // Caught by guard!
              handleGameOver(false);
              return;
            }
          }
        }
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Floor background (dark slate)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw Painted Grid Tiles
      ctx.fillStyle = '#0284c7'; // Vibrant cyan-blue paint
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (painted[r * cols + c]) {
            ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);
          }
        }
      }

      // Subtle grid borders
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellW, 0);
        ctx.lineTo(c * cellW, height);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellH);
        ctx.lineTo(width, r * cellH);
        ctx.stroke();
      }

      // Draw Guards & Vision Cones
      for (const g of guards) {
        // Vision cone
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.arc(g.x, g.y, g.viewDist, g.angle - g.fov, g.angle + g.fov);
        ctx.closePath();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.18)'; // Soft red warning light
        ctx.fill();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Guard Monster Sprite
        drawCardSprite(ctx, g.monsterId, g.x - 16, g.y - 16, 32, 32, {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#ef4444',
          shadowBlur: 6,
          shadowColor: '#ef4444',
        });
      }

      // Draw Player Hero (with Camouflage effect)
      if (p.isCamouflaged) {
        // Blended/translucent when hidden in paint
        ctx.globalAlpha = 0.45;
        drawCardSprite(ctx, playerHeroId, p.x - 18, p.y - 18, 36, 36, {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#38bdf8',
        });
        ctx.globalAlpha = 1.0;

        // Hidden label
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ HIDING', p.x, p.y - 24);
      } else {
        // Normal active player
        drawCardSprite(ctx, playerHeroId, p.x - 18, p.y - 18, 36, 36, {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#f59e0b',
          shadowBlur: 8,
          shadowColor: '#f59e0b',
        });

        // Paint roller trail
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.x, p.y + 14, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, stage, playerHeroId, handleGameOver]);

  // Touch / Drag controls
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    stateRef.current.isTouchActive = true;
    stateRef.current.player.targetX = x;
    stateRef.current.player.targetY = y;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.isTouchActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    stateRef.current.player.targetX = x;
    stateRef.current.player.targetY = y;
  };

  const handlePointerUp = () => {
    stateRef.current.isTouchActive = false;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '하이드 앤 페인트' : 'Hide and Paint',
      badge: 'MISSION 02',
      description: isKo
        ? '손가락으로 드래그하여 바닥에 페인트를 칠하세요! 맵의 65% 이상을 칠하면 스테이지를 클리어합니다.'
        : 'Drag your finger to roll paint over the floor! Cover at least 65% to clear the stage.',
      keyPoints: isKo
        ? ['원터치 드래그로 바닥 칠하기', '목표 면적 65% 달성 시 클리어', '콤보 획득으로 고득점 달성']
        : ['Drag finger to paint floor', 'Cover 65% area to clear', 'Keep moving for combo score'],
    },
    {
      title: isKo ? '페인트 위장 은신' : 'Paint Camouflage',
      badge: 'STEALTH HIDE',
      description: isKo
        ? '빨간 시야를 가진 몬스터 순찰자가 다가오면, 페인트칠된 바닥 위에서 손을 떼고 멈추세요. 완벽하게 위장되어 들키지 않습니다!'
        : 'When guards approach, release and stay still on painted tiles. You will camouflage and become invisible!',
      keyPoints: isKo
        ? ['칠해진 바닥에서 정지 시 자동 은신', '순찰자의 붉은 경계 시야 회피', '한 손으로 100% 플레이 가능']
        : ['Stop on painted floor to camouflage', 'Avoid red guard cone of vision', '100% one-hand friendly'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.02 하이드 앤 페인트' : 'No.02 Hide and Paint'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`PAINT: ${paintedPct}% (목표 65%)`}
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

        {/* Touch Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs text-amber-400 font-bold tracking-wider animate-pulse">
            {isKo ? '👆 드래그: 페인트 칠하기 | 🛑 멈춤: 은신 위장' : '👆 DRAG: PAINT | 🛑 STOP: HIDE'}
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
            setStage(1);
            setTimeLeft(40);
            initStage(1);
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.02 하이드 앤 페인트' : 'No.02 Hide and Paint'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_hide_and_paint', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};
