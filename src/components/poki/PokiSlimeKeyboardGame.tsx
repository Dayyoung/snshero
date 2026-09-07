import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiSlimeKeyboardGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface KeyBlock {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isSlime: boolean;
  isGoal: boolean;
  slimeTimer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export const PokiSlimeKeyboardGame: React.FC<PokiSlimeKeyboardGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 1;
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
      return localStorage.getItem('hero_tutorial_slime_keyboard') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    player: {
      x: 60,
      y: 300,
      vx: 0,
      vy: 0,
      width: 44,
      height: 44,
      isGrounded: false,
      isJumping: false,
      targetX: 60,
    },
    cameraX: 0,
    keys: [] as KeyBlock[],
    particles: [] as Particle[],
    isTouchActive: false,
    combo: 0,
    lastJumpTime: 0,
  });

  // Stage generation
  const initStage = useCallback((stageNum: number) => {
    const keyLabels = ['ESC', 'F1', 'F2', 'TAB', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'ENTER', 'SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'SPACE', 'ALT', 'CTRL', 'WIN', 'FN', 'DEL', 'END', 'PGDN', 'UP', 'DOWN', 'GOAL!'];
    const blocks: KeyBlock[] = [];

    let curX = 40;
    const baseWidth = 70;
    const keyGap = 16;
    const count = 25 + stageNum * 5;

    for (let i = 0; i < count; i++) {
      const isGoal = i === count - 1;
      const isSlime = !isGoal && i > 2 && Math.random() < (0.28 + stageNum * 0.06);
      const keyW = isGoal ? 110 : (i % 6 === 0 ? baseWidth * 1.4 : baseWidth);
      const keyH = 50;
      const yOffset = Math.sin(i * 0.8) * 45;
      const keyY = 320 + yOffset;

      const lbl = isGoal ? '🏆 GOAL' : keyLabels[i % keyLabels.length];
      blocks.push({
        label: lbl,
        x: curX,
        y: keyY,
        width: keyW,
        height: keyH,
        isSlime,
        isGoal,
        slimeTimer: 0,
      });

      curX += keyW + keyGap;
    }

    stateRef.current.keys = blocks;
    stateRef.current.player.x = 50;
    stateRef.current.player.y = 200;
    stateRef.current.player.vx = 0;
    stateRef.current.player.vy = 0;
    stateRef.current.player.targetX = 50;
    stateRef.current.cameraX = 0;
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

    const finalScore = score + (victory ? 500 : 100);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_slime_keyboard',
      gameTitle: isKo ? '슬라임 키보드 탈출' : 'Slime Keyboard Escape',
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

  // Jump trigger
  const triggerJump = useCallback(() => {
    const p = stateRef.current.player;
    if (p.isGrounded) {
      p.vy = -14;
      p.isGrounded = false;
      p.isJumping = true;
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      // Jump particles
      for (let i = 0; i < 6; i++) {
        stateRef.current.particles.push({
          x: p.x + p.width / 2,
          y: p.y + p.height,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * -3,
          radius: Math.random() * 3 + 2,
          color: '#34d399',
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
      const keys = stateRef.current.keys;
      const particles = stateRef.current.particles;

      // Player horizontal auto-run & target seeking
      p.vx = (p.targetX - p.x) * 0.12;
      p.x += p.vx;

      // Vertical physics
      p.vy += gravity;
      p.y += p.vy;
      p.isGrounded = false;

      // Collision with key blocks
      for (const k of keys) {
        if (
          p.x + p.width > k.x &&
          p.x < k.x + k.width &&
          p.y + p.height >= k.y &&
          p.y + p.height <= k.y + 24 &&
          p.vy >= 0
        ) {
          p.y = k.y - p.height;
          p.vy = 0;
          p.isGrounded = true;
          p.isJumping = false;

          // Check slime trap
          if (k.isSlime) {
            k.slimeTimer += 1;
            if (k.slimeTimer > 25) {
              p.vy = 8;
              setScore(s => Math.max(0, s - 20));
              stateRef.current.combo = 0;
              k.isSlime = false;
            }
          } else {
            setScore(s => s + 2);
            stateRef.current.combo++;
          }

          // Check goal block
          if (k.isGoal) {
            if (stage < totalStages) {
              setStage(prev => prev + 1);
              setScore(s => s + 200);
            } else {
              handleGameOver(true);
            }
            return;
          }
          break;
        }
      }

      // Fall off bottom screen
      if (p.y > height + 80) {
        p.y = 100;
        p.vy = 0;
        p.x = Math.max(50, p.x - 120);
        p.targetX = p.x;
        setScore(s => Math.max(0, s - 50));
        stateRef.current.combo = 0;
      }

      // Smooth camera follow
      const targetCamX = p.x - width * 0.3;
      stateRef.current.cameraX += (targetCamX - stateRef.current.cameraX) * 0.1;
      const camX = stateRef.current.cameraX;

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Background: Dark cyber keyboard mesh
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Neon grid lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      for (let x = - (camX % 60); x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw Key Blocks
      for (const k of keys) {
        const screenX = k.x - camX;
        if (screenX + k.width < -50 || screenX > width + 50) continue;

        // Key shadow
        ctx.fillStyle = '#020617';
        ctx.fillRect(screenX + 3, k.y + 4, k.width, k.height);

        // Key surface
        ctx.fillStyle = k.isGoal ? '#eab308' : (k.isSlime ? '#065f46' : '#1e293b');
        ctx.fillRect(screenX, k.y, k.width, k.height);

        // Slime dripping effect
        if (k.isSlime) {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(screenX + k.width * 0.3, k.y + 4, 8, 0, Math.PI * 2);
          ctx.arc(screenX + k.width * 0.7, k.y + 6, 10, 0, Math.PI * 2);
          ctx.fill();
        }

        // Key Border
        ctx.strokeStyle = k.isGoal ? '#fde047' : (k.isSlime ? '#34d399' : '#475569');
        ctx.lineWidth = 1.5;
        ctx.strokeRect(screenX, k.y, k.width, k.height);

        // Key Label
        ctx.fillStyle = k.isGoal ? '#713f12' : '#94a3b8';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(k.label, screenX + k.width / 2, k.y + k.height / 2);
      }

      // Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.03;
        if (pt.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x - camX, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw Player Hero Sprite (SNSHero cards1.png / cards2.png)
      const playerScreenX = p.x - camX;
      drawCardSprite(ctx, playerHeroId, playerScreenX, p.y, p.width, p.height, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#38bdf8',
        shadowBlur: 8,
        shadowColor: '#38bdf8',
      });

      // Jump hint aura if grounded
      if (p.isGrounded) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(playerScreenX + p.width / 2, p.y + p.height, 18, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, stage, playerHeroId, handleGameOver]);

  // Pure Touch / Drag Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;

    stateRef.current.isTouchActive = true;
    stateRef.current.player.targetX = stateRef.current.cameraX + touchX;

    // Direct jump on tap
    triggerJump();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.isTouchActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;

    stateRef.current.player.targetX = stateRef.current.cameraX + touchX;
  };

  const handlePointerUp = () => {
    stateRef.current.isTouchActive = false;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '슬라임 키보드 탈출' : 'Slime Keyboard Escape',
      badge: 'MISSION 01',
      description: isKo
        ? '화면을 터치하거나 손가락으로 드래그하여 키보드 키 위를 점프하고 슬라임 트랩을 피해 탈출하세요!'
        : 'Touch or drag anywhere to jump between giant keyboard keys and avoid sticky green slime traps!',
      keyPoints: isKo
        ? ['키보드 위를 점프하여 전진', '녹색 끈적 슬라임 함정 회피', '보석 획득 시 보너스 점수']
        : ['Jump across keyboard keys', 'Avoid sticky green slimes', 'Collect gems for bonus pts'],
    },
    {
      title: isKo ? '퓨어 원터치 점프' : 'Pure Touch Jump',
      badge: 'TOUCH CONTROL',
      description: isKo
        ? '탭하면 점프하며, 누른 채 좌우로 드래그하면 원하는 위치로 즉시 도약 착지합니다.'
        : 'Tap to jump up, and drag horizontally to control your landing position smoothly.',
      keyPoints: isKo
        ? ['단순 탭: 제자리 수직 점프', '좌우 드래그: 목표 방향 정밀 도약', '한 손으로 100% 플레이 가능']
        : ['Tap: Vertical hop', 'Drag: Directed jump', '100% one-hand friendly'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.01 슬라임 키보드 탈출' : 'No.01 Slime Keyboard'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`STAGE ${stage}/${totalStages}`}
        combo={stateRef.current.combo}
        onExit={onExit}
      />

      <div className="relative flex-1 w-full max-w-2xl flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full rounded-sm border border-slate-800 touch-none shadow-inner"
        />

        {/* Touch Action Guide Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs text-emerald-400 font-bold tracking-wider animate-pulse">
            {isKo ? '👆 탭: 점프 | ↔️ 드래그: 좌우 이동' : '👆 TAP: JUMP | ↔️ DRAG: MOVE'}
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
          gameTitle={isKo ? 'No.01 슬라임 키보드 탈출' : 'No.01 Slime Keyboard'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_slime_keyboard', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};
