import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiPaperIoGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Point {
  x: number;
  y: number;
}

interface AiOpponent {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  color: string;
  trail: Point[];
  charId: number;
  isAlive: boolean;
}

export const PokiPaperIoGame: React.FC<PokiPaperIoGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 4;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [territoryPct, setTerritoryPct] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_paperio2') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    gridCols: 40,
    gridRows: 50,
    gridOwners: [] as number[], // 0: neutral, 1: player, 2+: AI
    player: {
      x: 100,
      y: 150,
      angle: 0,
      speed: 3.2,
      trail: [] as Point[],
      isOutside: false,
      kills: 0,
    },
    targetAngle: 0,
    opponents: [] as AiOpponent[],
    combo: 0,
  });

  const initGame = useCallback(() => {
    const cols = 40;
    const rows = 50;
    const owners = new Array(cols * rows).fill(0);

    // Initial base for player (3x3 at col 10, row 15)
    for (let r = 13; r <= 17; r++) {
      for (let c = 8; c <= 12; c++) {
        owners[r * cols + c] = 1;
      }
    }

    // Spawn 3 AI opponents with small bases
    const opps: AiOpponent[] = [
      { id: 2, x: 250, y: 150, angle: Math.PI, speed: 2.8, color: '#ef4444', trail: [], charId: 105, isAlive: true },
      { id: 3, x: 120, y: 350, angle: -Math.PI / 2, speed: 2.7, color: '#a855f7', trail: [], charId: 110, isAlive: true },
      { id: 4, x: 260, y: 360, angle: -Math.PI / 2, speed: 2.6, color: '#eab308', trail: [], charId: 115, isAlive: true },
    ];

    opps.forEach(op => {
      const baseC = Math.floor(op.x / 8);
      const baseR = Math.floor(op.y / 8);
      for (let r = Math.max(0, baseR - 2); r <= Math.min(rows - 1, baseR + 2); r++) {
        for (let c = Math.max(0, baseC - 2); c <= Math.min(cols - 1, baseC + 2); c++) {
          owners[r * cols + c] = op.id;
        }
      }
    });

    stateRef.current.gridCols = cols;
    stateRef.current.gridRows = rows;
    stateRef.current.gridOwners = owners;
    stateRef.current.player = {
      x: 80,
      y: 120,
      angle: 0,
      speed: 3.2,
      trail: [],
      isOutside: false,
      kills: 0,
    };
    stateRef.current.targetAngle = 0;
    stateRef.current.opponents = opps;
    setTerritoryPct(5);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(territoryPct >= 25);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial, territoryPct]);

  const handleGameOver = useCallback((victory: boolean) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = score + (victory ? 500 : 100) + stateRef.current.player.kills * 150;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_paperio2',
      gameTitle: isKo ? '페이퍼 io 2' : 'Paper.io 2',
      durationSeconds: 45 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && territoryPct >= 35,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, territoryPct, isKo, onReward, playSfx]);

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

    const cols = stateRef.current.gridCols;
    const rows = stateRef.current.gridRows;
    const cellW = width / cols;
    const cellH = height / rows;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const p = stateRef.current.player;
      const owners = stateRef.current.gridOwners;
      const opps = stateRef.current.opponents;

      // Smooth rotate player toward targetAngle
      let diff = stateRef.current.targetAngle - p.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      p.angle += diff * 0.15;

      // Move player
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;

      // Boundary clamp
      p.x = Math.max(10, Math.min(width - 10, p.x));
      p.y = Math.max(10, Math.min(height - 10, p.y));

      const cCol = Math.floor(p.x / cellW);
      const cRow = Math.floor(p.y / cellH);
      const curCellOwner = (cCol >= 0 && cCol < cols && cRow >= 0 && cRow < rows) ? owners[cRow * cols + cCol] : 0;

      if (curCellOwner === 1) {
        // Player returned to own territory
        if (p.trail.length > 0) {
          // Fill enclosed territory (bounding box flood/fill heuristic)
          let minC = cols, maxC = 0, minR = rows, maxR = 0;
          p.trail.forEach(pt => {
            const tc = Math.floor(pt.x / cellW);
            const tr = Math.floor(pt.y / cellH);
            if (tc < minC) minC = tc;
            if (tc > maxC) maxC = tc;
            if (tr < minR) minR = tr;
            if (tr > maxR) maxR = tr;
          });

          // Expand bounding box slightly and fill
          minC = Math.max(0, minC - 1);
          maxC = Math.min(cols - 1, maxC + 1);
          minR = Math.max(0, minR - 1);
          maxR = Math.min(rows - 1, maxR + 1);

          let newFilled = 0;
          for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
              const idx = r * cols + c;
              if (owners[idx] !== 1) {
                owners[idx] = 1;
                newFilled++;
              }
            }
          }

          p.trail = [];
          setScore(s => s + newFilled * 8 + 50);
          stateRef.current.combo++;

          // Recalc territory %
          const myTotal = owners.filter(o => o === 1).length;
          const pct = Math.round((myTotal / (cols * rows)) * 100);
          setTerritoryPct(pct);

          if (pct >= 40) {
            handleGameOver(true);
            return;
          }
        }
      } else {
        // Player is outside own territory -> add trail
        const lastPt = p.trail[p.trail.length - 1];
        if (!lastPt || Math.hypot(p.x - lastPt.x, p.y - lastPt.y) > 6) {
          p.trail.push({ x: p.x, y: p.y });
        }
      }

      // AI Opponents logic
      for (const op of opps) {
        if (!op.isAlive) continue;

        op.angle += (Math.random() - 0.5) * 0.2;
        op.x += Math.cos(op.angle) * op.speed;
        op.y += Math.sin(op.angle) * op.speed;

        // Bounce walls
        if (op.x < 20 || op.x > width - 20) op.angle = Math.PI - op.angle;
        if (op.y < 20 || op.y > height - 20) op.angle = -op.angle;

        // Player cuts AI trail?
        for (let tIdx = 0; tIdx < op.trail.length; tIdx++) {
          const tp = op.trail[tIdx];
          if (Math.hypot(p.x - tp.x, p.y - tp.y) < 16) {
            // Cut AI trail! AI dies
            op.isAlive = false;
            p.kills++;
            setScore(s => s + 200);
            stateRef.current.combo += 2;
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            break;
          }
        }

        // AI cuts Player trail?
        if (op.isAlive) {
          for (const pt of p.trail) {
            if (Math.hypot(op.x - pt.x, op.y - pt.y) < 14) {
              // Player trail cut! Game over
              handleGameOver(false);
              return;
            }
          }
        }
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Background grid
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid Ownership
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const owner = owners[r * cols + c];
          if (owner === 1) {
            ctx.fillStyle = '#0284c7'; // Player blue
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
          } else if (owner === 2) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
          } else if (owner === 3) {
            ctx.fillStyle = 'rgba(168, 85, 247, 0.45)';
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
          } else if (owner === 4) {
            ctx.fillStyle = 'rgba(234, 179, 8, 0.45)';
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
          }
        }
      }

      // Draw Player Trail
      if (p.trail.length > 1) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      // Draw AI Opponents
      for (const op of opps) {
        if (!op.isAlive) continue;
        drawCardSprite(ctx, op.charId, op.x - 14, op.y - 14, 28, 28, {
          circleClip: true,
          borderWidth: 2,
          borderColor: op.color,
          shadowBlur: 6,
          shadowColor: op.color,
        });
      }

      // Draw Player Hero Sprite
      drawCardSprite(ctx, playerHeroId, p.x - 18, p.y - 18, 36, 36, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#38bdf8',
        shadowBlur: 8,
        shadowColor: '#38bdf8',
      });

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, playerHeroId, handleGameOver]);

  // Touch Direction Drag
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const p = stateRef.current.player;
    stateRef.current.targetAngle = Math.atan2(touchY - p.y, touchX - p.x);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const p = stateRef.current.player;
    stateRef.current.targetAngle = Math.atan2(touchY - p.y, touchX - p.x);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '페이퍼 io 2 영토 전쟁' : 'Paper.io 2 Territory',
      badge: 'MISSION 04',
      description: isKo
        ? '손가락으로 원하는 방향을 터치/드래그하여 내 영역 밖으로 선을 그리고 다시 내 땅으로 복귀하면 땅이 넓어집니다!'
        : 'Touch or drag in any direction to draw lines outside and return to claim massive territory!',
      keyPoints: isKo
        ? ['원터치 드래그로 영역 확장', '내 땅으로 복귀하여 영토 확보', '목표 점유율 40% 달성 시 승리']
        : ['Drag finger to steer and expand', 'Return to safe base to claim', 'Reach 40% territory to win'],
    },
    {
      title: isKo ? '꼬리 방어 & 적 처치' : 'Trail Defense & Kills',
      badge: 'TRAIL BATTLE',
      description: isKo
        ? '선이 이어져 있을 때 적이 내 꼬리를 밟으면 즉사합니다! 반대로 적의 꼬리를 들이받아 적을 제압하세요.'
        : 'If an enemy crosses your trail while outside, you lose! Strike their trail instead to eliminate them.',
      keyPoints: isKo
        ? ['적에게 꼬리를 보이지 않고 방어', '적의 꼬리를 들이받아 처치', '한 손으로 100% 플레이 가능']
        : ['Protect your exposed trail', 'Bite enemy trails to eliminate', '100% one-hand friendly'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.04 페이퍼 io 2' : 'No.04 Paper.io 2'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`영토: ${territoryPct}% (목표 40%)`}
        combo={stateRef.current.combo}
        onExit={onExit}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full rounded-sm border border-slate-800 touch-none shadow-inner"
        />

        {/* Control Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs text-sky-400 font-bold tracking-wider animate-pulse">
            {isKo ? '👆 터치/드래그: 이동 방향 조절 (땅따먹기)' : '👆 TOUCH/DRAG: STEER & EXPAND'}
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
            setTimeLeft(45);
            initGame();
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.04 페이퍼 io 2' : 'No.04 Paper.io 2'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_paperio2', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};

export default PokiPaperIoGame;
