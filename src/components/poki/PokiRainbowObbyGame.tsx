import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiRainbowObbyGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isMoving?: boolean;
  vx?: number;
  isGoal?: boolean;
}

export const PokiRainbowObbyGame: React.FC<PokiRainbowObbyGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 11;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [stage, setStage] = useState<number>(1);
  const totalStages = 3;
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_rainbow_obby') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    player: {
      x: 50,
      y: 350,
      vx: 0,
      vy: 0,
      width: 38,
      height: 38,
      isGrounded: false,
      targetX: 50,
    },
    cameraX: 0,
    platforms: [] as Platform[],
    combo: 0,
    isTouchActive: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; alpha: number }[],
  });

  const initStage = useCallback((s: number) => {
    const rainbowColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];
    const plats: Platform[] = [];

    let curX = 20;
    const count = 18 + s * 4;

    for (let i = 0; i < count; i++) {
      const isGoal = i === count - 1;
      const col = rainbowColors[i % rainbowColors.length];
      const pW = isGoal ? 90 : (i === 0 ? 90 : 65);
      const isMoving = !isGoal && i > 3 && i % 3 === 0;
      const yOffset = Math.sin(i * 0.9) * 45;
      const pY = 340 + yOffset;

      plats.push({
        x: curX,
        y: pY,
        width: pW,
        height: 20,
        color: isGoal ? '#facc15' : col,
        isMoving,
        vx: isMoving ? (Math.random() < 0.5 ? 1.5 : -1.5) : 0,
        isGoal,
      });

      curX += pW + 28 + Math.random() * 15;
    }

    stateRef.current.platforms = plats;
    stateRef.current.player.x = 40;
    stateRef.current.player.y = 250;
    stateRef.current.player.vx = 0;
    stateRef.current.player.vy = 0;
    stateRef.current.player.targetX = 40;
    stateRef.current.cameraX = 0;
  }, []);

  useEffect(() => {
    initStage(stage);
  }, [stage, initStage]);

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
      gameId: 'poki_rainbow_obby',
      gameTitle: isKo ? '레인보우 오비 파쿠르' : 'Rainbow Obby',
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

  const triggerJump = useCallback(() => {
    const p = stateRef.current.player;
    if (p.isGrounded) {
      p.vy = -14.2;
      p.isGrounded = false;
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      // Sparkle particles
      for (let i = 0; i < 5; i++) {
        stateRef.current.particles.push({
          x: p.x + p.width / 2,
          y: p.y + p.height,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * -3,
          color: '#facc15',
          alpha: 1,
        });
      }
    }
  }, [playSfx]);

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

    const gravity = 0.62;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const p = stateRef.current.player;
      const plats = stateRef.current.platforms;
      const particles = stateRef.current.particles;

      // Player seek targetX
      p.vx = (p.targetX - p.x) * 0.14;
      p.x += p.vx;

      // Gravity
      p.vy += gravity;
      p.y += p.vy;
      p.isGrounded = false;

      // Move moving platforms
      for (const pl of plats) {
        if (pl.isMoving && pl.vx) {
          pl.x += pl.vx;
          if (pl.x < 100 || pl.x > 1800) pl.vx *= -1;
        }

        // Platform collision
        if (
          p.x + p.width > pl.x &&
          p.x < pl.x + pl.width &&
          p.y + p.height >= pl.y &&
          p.y + p.height <= pl.y + 22 &&
          p.vy >= 0
        ) {
          p.y = pl.y - p.height;
          p.vy = 0;
          p.isGrounded = true;

          if (pl.isMoving && pl.vx) {
            p.x += pl.vx;
            p.targetX += pl.vx;
          }

          if (pl.isGoal) {
            if (stage < totalStages) {
              setStage(s => s + 1);
              setScore(s => s + 250);
              stateRef.current.combo += 2;
            } else {
              handleGameOver(true);
            }
            return;
          }
        }
      }

      // Fall off
      if (p.y > height + 80) {
        p.y = 200;
        p.vy = 0;
        p.x = Math.max(40, p.x - 140);
        p.targetX = p.x;
        setScore(s => Math.max(0, s - 30));
        stateRef.current.combo = 0;
      }

      // Smooth camera follow
      const targetCamX = p.x - width * 0.28;
      stateRef.current.cameraX += (targetCamX - stateRef.current.cameraX) * 0.1;
      const camX = stateRef.current.cameraX;

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Sky gradient background
      ctx.fillStyle = '#0284c7'; // Vibrant sky blue
      ctx.fillRect(0, 0, width, height);

      // Fluffy clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let i = 0; i < 6; i++) {
        const cx = (i * 220 - camX * 0.3) % (width + 200);
        ctx.beginPath();
        ctx.arc(cx, 120 + (i % 3) * 40, 36, 0, Math.PI * 2);
        ctx.arc(cx + 25, 110 + (i % 3) * 40, 48, 0, Math.PI * 2);
        ctx.arc(cx + 55, 125 + (i % 3) * 40, 32, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Rainbow Platforms
      for (const pl of plats) {
        const scrX = pl.x - camX;
        if (scrX + pl.width < -50 || scrX > width + 50) continue;

        // Platform 3D shadow block
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(scrX + 4, pl.y + 6, pl.width, pl.height + 10);

        // Platform face
        ctx.fillStyle = pl.color;
        ctx.fillRect(scrX, pl.y, pl.width, pl.height);

        // Shiny border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(scrX, pl.y, pl.width, pl.height);

        if (pl.isGoal) {
          ctx.fillStyle = '#713f12';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🏆 GOAL', scrX + pl.width / 2, pl.y + pl.height / 2 + 4);
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
        ctx.beginPath();
        ctx.arc(pt.x - camX, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw Player Hero Sprite
      const pScrX = p.x - camX;
      drawCardSprite(ctx, playerHeroId, pScrX, p.y, p.width, p.height, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#facc15',
        shadowBlur: 8,
        shadowColor: '#facc15',
      });

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, stage, playerHeroId, handleGameOver]);

  // Touch Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;

    stateRef.current.isTouchActive = true;
    stateRef.current.player.targetX = stateRef.current.cameraX + touchX;
    triggerJump();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.isTouchActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.player.targetX = stateRef.current.cameraX + (e.clientX - rect.left);
  };

  const handlePointerUp = () => {
    stateRef.current.isTouchActive = false;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'GOAL',
      title: isKo ? '레인보우 오비 파쿠르' : 'Rainbow Obby',
      description: isKo
        ? '무지개 빛깔의 고공 발판 위를 점프하며 결승점(GOAL)까지 안전하게 도달하세요!'
        : 'Jump across colorful floating rainbow platforms and conquer the sky-high obby course!',
      keyPoints: isKo ? ['고공 발판 점프', '낙사 회피', '결승점 도착'] : ['Jump platforms', 'Avoid falling', 'Reach goal'],
    },
    {
      badge: 'CONTROLS',
      title: isKo ? '원터치 탭 점프 & 드래그' : 'Tap to Jump & Drag',
      description: isKo
        ? '화면을 탭하면 점프하고, 손가락을 좌우로 드래그하여 움직이는 발판 위에 정확하게 착지하세요.'
        : 'Tap to jump up, and drag horizontally to land precisely on moving platforms.',
      keyPoints: isKo ? ['탭하여 점프', '좌우 드래그 이동', '착지 타이밍'] : ['Tap to jump', 'Drag to steer', 'Land accurately'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.11 레인보우 오비' : 'No.11 Rainbow Obby'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`STAGE ${stage}/${totalStages}`}
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
          <p className="text-xs text-yellow-300 font-bold tracking-wider animate-pulse">
            {isKo ? '👆 탭: 점프 | ↔️ 드래그: 이동' : '👆 TAP: JUMP | ↔️ DRAG: MOVE'}
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
            setTimeLeft(45);
            initStage(1);
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.11 레인보우 오비' : 'No.11 Rainbow Obby'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_rainbow_obby', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};

export default PokiRainbowObbyGame;
