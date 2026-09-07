import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiRagdollChaosGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Obstacle {
  x: number;
  y: number;
  radius: number;
  type: 'bumper' | 'explosive' | 'portal';
  color: string;
}

export const PokiRagdollChaosGame: React.FC<PokiRagdollChaosGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 10;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [bounces, setBounces] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_ragdoll_chaos') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    ragdoll: {
      x: 180,
      y: 120,
      vx: 0,
      vy: 0,
      angle: 0,
      vAngle: 0,
      radius: 22,
      isHeld: false,
    },
    obstacles: [] as Obstacle[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; alpha: number }[],
    combo: 0,
    prevTouchPos: { x: 0, y: 0 },
  });

  const initPhysics = useCallback((width: number, height: number) => {
    const obs: Obstacle[] = [
      { x: width * 0.25, y: height * 0.35, radius: 28, type: 'bumper', color: '#38bdf8' },
      { x: width * 0.75, y: height * 0.35, radius: 28, type: 'bumper', color: '#38bdf8' },
      { x: width * 0.5, y: height * 0.5, radius: 32, type: 'explosive', color: '#ef4444' },
      { x: width * 0.2, y: height * 0.7, radius: 24, type: 'bumper', color: '#f59e0b' },
      { x: width * 0.8, y: height * 0.7, radius: 24, type: 'bumper', color: '#f59e0b' },
      { x: width * 0.5, y: height * 0.85, radius: 36, type: 'portal', color: '#a855f7' },
    ];
    stateRef.current.obstacles = obs;
    stateRef.current.ragdoll.x = width * 0.5;
    stateRef.current.ragdoll.y = 100;
    stateRef.current.ragdoll.vx = (Math.random() - 0.5) * 6;
    stateRef.current.ragdoll.vy = 2;
  }, []);

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
      gameId: 'poki_ragdoll_chaos',
      gameTitle: isKo ? '래그돌 카오스 물리' : 'Ragdoll Chaos',
      durationSeconds: 45 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && bounces >= 30,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, bounces, isKo, onReward, playSfx]);

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

    initPhysics(width, height);

    const gravity = 0.45;
    const friction = 0.985;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const rd = stateRef.current.ragdoll;
      const obs = stateRef.current.obstacles;
      const particles = stateRef.current.particles;

      if (!rd.isHeld) {
        rd.vy += gravity;
        rd.vx *= friction;
        rd.vy *= friction;
        rd.x += rd.vx;
        rd.y += rd.vy;
        rd.angle += rd.vAngle;
        rd.vAngle *= 0.98;

        // Boundary collision
        if (rd.x < rd.radius) {
          rd.x = rd.radius;
          rd.vx = Math.abs(rd.vx) * 0.85;
          rd.vAngle = (Math.random() - 0.5) * 0.3;
        }
        if (rd.x > width - rd.radius) {
          rd.x = width - rd.radius;
          rd.vx = -Math.abs(rd.vx) * 0.85;
          rd.vAngle = (Math.random() - 0.5) * 0.3;
        }
        if (rd.y < rd.radius) {
          rd.y = rd.radius;
          rd.vy = Math.abs(rd.vy) * 0.85;
        }
        if (rd.y > height - rd.radius) {
          rd.y = height - rd.radius;
          rd.vy = -Math.abs(rd.vy) * 0.9;
          rd.vx *= 0.9;
        }

        // Obstacles collision
        for (const o of obs) {
          const dx = rd.x - o.x;
          const dy = rd.y - o.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < rd.radius + o.radius) {
            const nx = dx / dist;
            const ny = dy / dist;

            if (o.type === 'bumper') {
              rd.vx = nx * 14;
              rd.vy = ny * 14;
              rd.vAngle = (Math.random() - 0.5) * 0.5;
              setScore(s => s + 35);
              setBounces(b => b + 1);
              stateRef.current.combo++;
              if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            } else if (o.type === 'explosive') {
              rd.vx = nx * 22;
              rd.vy = ny * 22;
              setScore(s => s + 100);
              setBounces(b => b + 2);
              stateRef.current.combo += 2;
              if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

              // Explosion particles
              for (let k = 0; k < 12; k++) {
                particles.push({
                  x: o.x,
                  y: o.y,
                  vx: (Math.random() - 0.5) * 12,
                  vy: (Math.random() - 0.5) * 12,
                  color: '#ef4444',
                  alpha: 1,
                });
              }
            } else if (o.type === 'portal') {
              // Teleport to top with random blast
              rd.x = width * 0.5;
              rd.y = 80;
              rd.vy = 8;
              rd.vx = (Math.random() - 0.5) * 14;
              setScore(s => s + 80);
              setBounces(b => b + 1);
              if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }
            break;
          }
        }
      }

      if (score >= 1000) {
        handleGameOver(true);
        return;
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Dark pinball arena background
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, width, height);

      // Draw Obstacles (Bumpers / Bombs / Portal)
      for (const o of obs) {
        ctx.fillStyle = o.color;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lbl = o.type === 'bumper' ? '⚡' : (o.type === 'explosive' ? '💥' : '🌀');
        ctx.fillText(lbl, o.x, o.y);
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
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw Ragdoll Hero Sprite (with rotation)
      ctx.save();
      ctx.translate(rd.x, rd.y);
      ctx.rotate(rd.angle);
      drawCardSprite(ctx, playerHeroId, -rd.radius, -rd.radius, rd.radius * 2, rd.radius * 2, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#a855f7',
        shadowBlur: 10,
        shadowColor: '#a855f7',
      });
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, initPhysics, score, playerHeroId, handleGameOver]);

  // Touch Drag & Fling
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const rd = stateRef.current.ragdoll;
    if (Math.hypot(touchX - rd.x, touchY - rd.y) < rd.radius + 30) {
      rd.isHeld = true;
      rd.vx = 0;
      rd.vy = 0;
      stateRef.current.prevTouchPos = { x: touchX, y: touchY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rd = stateRef.current.ragdoll;
    if (!rd.isHeld) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const prev = stateRef.current.prevTouchPos;
    rd.vx = (touchX - prev.x) * 0.9;
    rd.vy = (touchY - prev.y) * 0.9;

    rd.x = touchX;
    rd.y = touchY;
    stateRef.current.prevTouchPos = { x: touchX, y: touchY };
  };

  const handlePointerUp = () => {
    const rd = stateRef.current.ragdoll;
    if (rd.isHeld) {
      rd.isHeld = false;
      rd.vAngle = (rd.vx + rd.vy) * 0.05;
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '래그돌 카오스 물리 샌드박스' : 'Ragdoll Chaos',
      badge: 'MISSION 10',
      description: isKo
        ? '래그돌 캐릭터를 손가락으로 잡고 화면 구석구석으로 시원하게 던져 날리세요!'
        : 'Grab and fling your ragdoll hero across the pinball arena with maximum chaos!',
      keyPoints: isKo
        ? ['래그돌을 잡고 시원하게 투척', '핀볼 아레나 장애물 충돌', '연속 바운스로 콤보 점수']
        : ['Fling hero into arena', 'Bounce off obstacles', 'Build up combo scores'],
    },
    {
      title: isKo ? '범퍼 충돌 & 콤보 점수' : 'Bumper Bounces & Combos',
      badge: 'CHAOS BOUNCE',
      description: isKo
        ? '범퍼(⚡), 폭발물(💥), 포털(🌀)에 연속으로 튕겨 다니며 콤보 점수를 쌓아 1,000점을 달성하세요.'
        : 'Bounce between bumpers, explosives, and portals to rack up massive combo scores!',
      keyPoints: isKo
        ? ['범퍼/폭발물 연쇄 타격', '목표 1,000점 달성', '100% 모바일 퓨어 터치']
        : ['Trigger chained explosions', 'Reach 1,000 pts to win', '100% pure touch control'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.10 래그돌 카오스' : 'No.10 Ragdoll Chaos'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`바운스: ${bounces}회 | 콤보: x${stateRef.current.combo}`}
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
          <p className="text-xs text-purple-400 font-bold tracking-wider animate-pulse">
            {isKo ? '👆 래그돌을 드래그해 날리기 (슬링 물리)' : '👆 DRAG & FLING RAGDOLL'}
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
            setBounces(0);
            setTimeLeft(45);
            if (canvasRef.current) initPhysics(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.10 래그돌 카오스' : 'No.10 Ragdoll Chaos'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_ragdoll_chaos', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};

export default PokiRagdollChaosGame;
