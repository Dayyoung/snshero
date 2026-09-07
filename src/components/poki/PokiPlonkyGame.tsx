import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiPlonkyGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface RotorObstacle {
  y: number;
  angle: number;
  speed: number;
  gapAngle: number;
  radius: number;
}

export const PokiPlonkyGame: React.FC<PokiPlonkyGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 18;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const totalLevels = 3;
  const [depthProgress, setDepthProgress] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_plonky') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    ball: {
      x: 180,
      y: 60,
      vx: 0,
      vy: 2.8,
      radius: 16,
    },
    rotors: [] as RotorObstacle[],
    gems: [] as { x: number; y: number; collected: boolean }[],
    combo: 0,
    isTouchActive: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; alpha: number }[],
  });

  const initLevel = useCallback((lvl: number) => {
    const rotors: RotorObstacle[] = [];
    const count = 5 + lvl * 2;
    for (let i = 0; i < count; i++) {
      rotors.push({
        y: 140 + i * 85,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() < 0.5 ? 1 : -1) * (0.025 + lvl * 0.008),
        gapAngle: 0.9, // Opening width
        radius: 70,
      });
    }

    const gems: { x: number; y: number; collected: boolean }[] = [];
    for (let i = 0; i < count - 1; i++) {
      gems.push({
        x: 180 + (Math.random() - 0.5) * 60,
        y: 180 + i * 85,
        collected: false,
      });
    }

    stateRef.current.rotors = rotors;
    stateRef.current.gems = gems;
    stateRef.current.ball.x = 180;
    stateRef.current.ball.y = 60;
    stateRef.current.ball.vx = 0;
    stateRef.current.ball.vy = 2.8;
  }, []);

  useEffect(() => {
    initLevel(level);
  }, [level, initLevel]);

  // Timer
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

    const finalScore = score + (victory ? 500 : 100);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_plonky',
      gameTitle: isKo ? '플롱키 드롭' : 'Plonky Drop',
      durationSeconds: 45 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && timeLeft > 20,
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

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const b = stateRef.current.ball;
      const rotors = stateRef.current.rotors;
      const gems = stateRef.current.gems;
      const particles = stateRef.current.particles;

      // Ball falling
      b.x += b.vx;
      b.y += b.vy;
      b.vx *= 0.94;

      // Boundary
      if (b.x < b.radius) b.x = b.radius;
      if (b.x > width - b.radius) b.x = width - b.radius;

      // Update depth %
      const maxDepth = rotors.length > 0 ? rotors[rotors.length - 1].y + 60 : height;
      const pct = Math.min(100, Math.round((b.y / maxDepth) * 100));
      setDepthProgress(pct);

      // Rotors update & collision
      for (const r of rotors) {
        r.angle += r.speed;

        // Check if ball intersects rotor ring
        if (Math.abs(b.y - r.y) < b.radius + 6) {
          const dx = b.x - width / 2;
          const dy = b.y - r.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > r.radius - 12 && dist < r.radius + 12) {
            // Check if within gap opening
            const angleToBall = Math.atan2(dy, dx);
            let diff = Math.abs(angleToBall - r.angle);
            while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

            if (diff > r.gapAngle / 2) {
              // Hit the rotating spike bar!
              if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
              handleGameOver(false);
              return;
            } else {
              // Successfully plunged through gap!
              setScore(s => s + 30);
              stateRef.current.combo++;
            }
          }
        }
      }

      // Collect gems
      for (const g of gems) {
        if (!g.collected && Math.hypot(b.x - g.x, b.y - g.y) < 24) {
          g.collected = true;
          setScore(s => s + 50);
          stateRef.current.combo++;
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      }

      // Bottom reached!
      if (b.y > maxDepth) {
        if (level < totalLevels) {
          setLevel(l => l + 1);
          setScore(s => s + 250);
        } else {
          handleGameOver(true);
        }
        return;
      }

      // Camera Y scroll
      const camY = Math.max(0, b.y - height * 0.35);

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Dark futuristic shaft
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, width, height);

      // Shaft walls
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 18, height);
      ctx.fillRect(width - 18, 0, 18, height);

      // Draw Rotors
      const centerX = width / 2;
      for (const r of rotors) {
        const scrY = r.y - camY;
        if (scrY < -100 || scrY > height + 100) continue;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, scrY, r.radius, r.angle + r.gapAngle / 2, r.angle - r.gapAngle / 2 + Math.PI * 2);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Neon glow
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 14;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Gems
      for (const g of gems) {
        if (g.collected) continue;
        const scrY = g.y - camY;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(g.x, scrY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw Player Hero Ball
      const ballScrY = b.y - camY;
      drawCardSprite(ctx, playerHeroId, b.x - b.radius, ballScrY - b.radius, b.radius * 2, b.radius * 2, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#f59e0b',
        shadowBlur: 8,
        shadowColor: '#f59e0b',
      });

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, level, playerHeroId, handleGameOver]);

  // Touch Drag to steer left/right
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;

    const b = stateRef.current.ball;
    b.vx = (touchX - b.x) * 0.15;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;

    const b = stateRef.current.ball;
    b.vx = (touchX - b.x) * 0.15;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'CONTROLS',
      title: isKo ? '플롱키 드롭 (회전 틈새 낙하)' : 'Plonky Drop',
      description: isKo
        ? '좌우로 손가락을 드래그하여 낙하 궤적을 조절하고, 회전하는 빨간 링의 열린 틈새로 쏙 통과하세요!'
        : 'Drag left or right to steer and plunge safely through the gaps of rotating obstacle rings!',
      keyPoints: isKo ? ['좌우 드래그 조향', '회전 링 틈새 통과', '충돌 방지'] : ['Drag to steer', 'Pass through ring gaps', 'Avoid obstacles'],
    },
    {
      badge: 'GOAL',
      title: isKo ? '바닥 골인 지점 도달' : 'Reach the Deep Goal',
      description: isKo
        ? '보석을 모으며 최하층의 결승선까지 완벽하게 낙하하여 3개 레벨을 정복하세요.'
        : 'Collect gems on the way down and reach the bottom to conquer all 3 levels.',
      keyPoints: isKo ? ['보석 수집 추가 점수', '최하층 결승선 도착', '3레벨 연속 돌파'] : ['Collect gems', 'Reach bottom goal', 'Clear 3 levels'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.18 플롱키 드롭' : 'No.18 Plonky'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`LEVEL ${level}/${totalLevels} | 진행도: ${depthProgress}%`}
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

        {/* Action Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs text-rose-400 font-bold tracking-wider animate-pulse">
            {isKo ? '↔️ 좌우 드래그: 틈새로 낙하 조타' : '↔️ DRAG: STEER THROUGH GAPS'}
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
            setLevel(1);
            setTimeLeft(45);
            initLevel(1);
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.18 플롱키 드롭' : 'No.18 Plonky'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_plonky', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};
