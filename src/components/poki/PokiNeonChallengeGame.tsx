import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiNeonChallengeGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface NeonTile {
  x: number;
  y: number;
  width: number;
  color: string;
  isGoal?: boolean;
}

export const PokiNeonChallengeGame: React.FC<PokiNeonChallengeGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 17;
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
      return localStorage.getItem('hero_tutorial_neon_challenge') !== 'true';
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
      width: 36,
      height: 36,
      isGrounded: false,
      targetX: 50,
    },
    cameraX: 0,
    tiles: [] as NeonTile[],
    combo: 0,
    isTouchActive: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; alpha: number }[],
  });

  const initStage = useCallback((s: number) => {
    const neonColors = ['#06b6d4', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
    const tiles: NeonTile[] = [];

    let curX = 20;
    const count = 16 + s * 4;

    for (let i = 0; i < count; i++) {
      const isGoal = i === count - 1;
      const tW = isGoal ? 90 : (i === 0 ? 80 : 55);
      const col = neonColors[i % neonColors.length];
      const yOffset = Math.sin(i * 1.1) * 50;
      const tY = 340 + yOffset;

      tiles.push({
        x: curX,
        y: tY,
        width: tW,
        color: isGoal ? '#facc15' : col,
        isGoal,
      });

      curX += tW + 30 + Math.random() * 20;
    }

    stateRef.current.tiles = tiles;
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
      gameId: 'poki_neon_challenge',
      gameTitle: isKo ? '네온 챌린지 레전드' : 'Neon Challenge Legends',
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
      p.vy = -14.5;
      p.isGrounded = false;
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      // Neon trail particles
      for (let i = 0; i < 5; i++) {
        stateRef.current.particles.push({
          x: p.x + p.width / 2,
          y: p.y + p.height,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * -3,
          color: '#ec4899',
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

    const gravity = 0.65;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const p = stateRef.current.player;
      const tiles = stateRef.current.tiles;
      const particles = stateRef.current.particles;

      p.vx = (p.targetX - p.x) * 0.15;
      p.x += p.vx;

      p.vy += gravity;
      p.y += p.vy;
      p.isGrounded = false;

      // Platform collision
      for (const t of tiles) {
        if (
          p.x + p.width > t.x &&
          p.x < t.x + t.width &&
          p.y + p.height >= t.y &&
          p.y + p.height <= t.y + 22 &&
          p.vy >= 0
        ) {
          p.y = t.y - p.height;
          p.vy = 0;
          p.isGrounded = true;

          if (t.isGoal) {
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
        p.x = Math.max(40, p.x - 120);
        p.targetX = p.x;
        setScore(s => Math.max(0, s - 30));
        stateRef.current.combo = 0;
      }

      // Smooth camera follow
      const targetCamX = p.x - width * 0.3;
      stateRef.current.cameraX += (targetCamX - stateRef.current.cameraX) * 0.1;
      const camX = stateRef.current.cameraX;

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Cyber Synthwave dark grid background
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, width, height);

      // Neon horizon grid lines
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.25)';
      ctx.lineWidth = 1;
      for (let x = - (camX % 50); x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw Neon Tiles
      for (const t of tiles) {
        const scrX = t.x - camX;
        if (scrX + t.width < -50 || scrX > width + 50) continue;

        ctx.fillStyle = t.color;
        ctx.fillRect(scrX, t.y, t.width, 16);

        // Bright neon border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(scrX, t.y, t.width, 16);

        // Neon glow bar below
        ctx.fillStyle = t.color;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(scrX + 4, t.y + 16, t.width - 8, 8);
        ctx.globalAlpha = 1.0;

        if (t.isGoal) {
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('FINISH', scrX + t.width / 2, t.y + 12);
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
        borderColor: '#06b6d4',
        shadowBlur: 10,
        shadowColor: '#06b6d4',
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
      title: isKo ? '네온 챌린지 레전드' : 'Neon Challenge Legends',
      description: isKo
        ? '빛나는 사이버 네온 발판 위를 연속으로 도약하여 결승선(FINISH)까지 질주하세요!'
        : 'Dash across glowing cyber neon platforms and reach the finish line!',
      keyPoints: isKo ? ['사이버 네온 발판 도약', '낙사 방지', '결승선 도달'] : ['Dash neon platforms', 'Avoid falling', 'Reach finish line'],
    },
    {
      badge: 'CONTROLS',
      title: isKo ? '원터치 탭 점프 & 드래그' : 'One-Touch Jump',
      description: isKo
        ? '화면을 탭하면 점프하며, 누른 채 좌우로 드래그하여 정확하게 착지할 수 있습니다.'
        : 'Tap to jump and drag left/right to position your landing smoothly.',
      keyPoints: isKo ? ['탭하여 도약', '좌우 드래그 조향', '콤보 부스트'] : ['Tap to jump', 'Drag to steer', 'Combo speed boost'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.17 네온 챌린지' : 'No.17 Neon Challenge'}
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
          <p className="text-xs text-cyan-400 font-bold tracking-wider animate-pulse">
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
          gameTitle={isKo ? 'No.17 네온 챌린지' : 'No.17 Neon Challenge'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_neon_challenge', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};
