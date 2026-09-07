import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSoccerSkillsWorldCupGameProps {
  onBack: () => void;
  cardId?: number;
}

export const PokiSoccerSkillsWorldCupGame: React.FC<PokiSoccerSkillsWorldCupGameProps> = ({
  onBack,
  cardId = 56,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stageName, setStageName] = useState('8강전');
  const [goals, setGoals] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    matchIdx: 0, // 0: 8강, 1: 4강, 2: 결승
    goalsInMatch: 0,
    attempts: 5,
    ball: { x: 200, y: 450, vx: 0, vy: 0, isKicked: false, inGoal: false },
    goalkeeper: { x: 200, y: 190, vx: 2.2, minX: 140, maxX: 260 },
    defender: { x: 200, y: 310, vx: -1.8, minX: 130, maxX: 270 },
    isAiming: false,
    dragStart: { x: 0, y: 0 },
    dragCurrent: { x: 0, y: 0 },
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    startTime: Date.now(),
  });

  const MATCHES = ['8강전 (Quarter)', '4강전 (Semi)', '월드컵 결승전 (FINAL)'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const s = gameStateRef.current;
      s.ball.x = canvas.width / 2;
      s.ball.y = canvas.height * 0.72;
      const goalW = Math.min(canvas.width * 0.6, 220);
      s.goalkeeper.x = canvas.width / 2;
      s.goalkeeper.minX = canvas.width / 2 - goalW * 0.4;
      s.goalkeeper.maxX = canvas.width / 2 + goalW * 0.4;

      s.defender.x = canvas.width / 2;
      s.defender.minX = canvas.width / 2 - goalW * 0.45;
      s.defender.maxX = canvas.width / 2 + goalW * 0.45;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const state = gameStateRef.current;
      const b = state.ball;
      const gk = state.goalkeeper;
      const def = state.defender;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Update goalkeeper
      gk.x += gk.vx;
      if (gk.x < gk.minX || gk.x > gk.maxX) gk.vx *= -1;

      // Update defender
      def.x += def.vx;
      if (def.x < def.minX || def.x > def.maxX) def.vx *= -1;

      // Update Ball physics
      if (b.isKicked) {
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.985;
        b.vy *= 0.985;

        const goalY = 160;
        const goalW = Math.min(canvas.width * 0.6, 220);
        const goalLeft = canvas.width / 2 - goalW / 2;
        const goalRight = canvas.width / 2 + goalW / 2;

        // Defender block check
        if (Math.hypot(b.x - def.x, b.y - def.y) < 22) {
          b.isKicked = false;
          b.vx = 0;
          b.vy = 0;
          b.x = canvas.width / 2;
          b.y = canvas.height * 0.72;
          state.attempts--;
          setAttemptsLeft(state.attempts);
        }

        // Goalkeeper save check
        if (Math.hypot(b.x - gk.x, b.y - gk.y) < 26) {
          b.isKicked = false;
          b.vx = 0;
          b.vy = 0;
          b.x = canvas.width / 2;
          b.y = canvas.height * 0.72;
          state.attempts--;
          setAttemptsLeft(state.attempts);
        }

        // Goal scored check
        if (b.y <= goalY && b.x >= goalLeft && b.x <= goalRight) {
          b.isKicked = false;
          state.goalsInMatch++;
          setGoals(state.goalsInMatch);

          // Goal sparks
          for (let k = 0; k < 25; k++) {
            state.particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              color: '#f59e0b',
              life: 30,
            });
          }

          // Reset ball
          b.x = canvas.width / 2;
          b.y = canvas.height * 0.72;
          b.vx = 0;
          b.vy = 0;

          if (state.goalsInMatch >= 2) {
            // Match Won!
            if (state.matchIdx >= 2) {
              // World Cup Champions!
              setGameWon(true);
              setGameOver(true);
              const reward = calculateAndDepositMissionReward({
                gameId: 'pokisoccerskills2',
                gameTitle: 'Soccer Skills 2 World Cup',
                isVictory: true,
                score: 1000,
                maxTargetScore: 1000,
                durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
              });
              setRewardResult(reward);
              return;
            } else {
              state.matchIdx++;
              state.goalsInMatch = 0;
              state.attempts = 5;
              setStageName(MATCHES[state.matchIdx]);
              setGoals(0);
              setAttemptsLeft(5);
              gk.vx = (Math.abs(gk.vx) + 0.6) * (gk.vx > 0 ? 1 : -1);
            }
          }
        } else if (b.y < 120 || b.x < 30 || b.x > canvas.width - 30) {
          // Missed shot
          b.isKicked = false;
          b.x = canvas.width / 2;
          b.y = canvas.height * 0.72;
          b.vx = 0;
          b.vy = 0;
          state.attempts--;
          setAttemptsLeft(state.attempts);

          if (state.attempts <= 0 && !gameOver) {
            setGameOver(true);
            const reward = calculateAndDepositMissionReward({
              gameId: 'pokisoccerskills2',
              gameTitle: 'Soccer Skills 2 World Cup',
              isVictory: false,
              score: state.matchIdx * 333 + state.goalsInMatch * 100,
              maxTargetScore: 1000,
              durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
            });
            setRewardResult(reward);
            return;
          }
        }
      }

      // Drawing Pitch
      ctx.fillStyle = '#15803d'; // Green lawn
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pitch grass lawn stripes
      ctx.fillStyle = '#16a34a';
      for (let y = 100; y < canvas.height; y += 40) {
        ctx.fillRect(0, y, canvas.width, 20);
      }

      // Penalty Box & Goal
      const goalW = Math.min(canvas.width * 0.6, 220);
      const goalLeft = canvas.width / 2 - goalW / 2;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(goalLeft, 140, goalW, 40);

      // Penalty Area Arc
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 220, 70, 0, Math.PI);
      ctx.stroke();

      // Draw Goalkeeper
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(gk.x, gk.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🧤 GK', gk.x, gk.y + 4);

      // Draw Defender
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(def.x, def.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('DF', def.x, def.y + 4);

      // Draw Striker Card Sprite
      drawCardSprite(ctx, cardId, canvas.width / 2 - 24, b.y + 20, 48, 56);

      // Draw Slingshot Trajectory
      if (state.isAiming) {
        const dx = state.dragStart.x - state.dragCurrent.x;
        const dy = state.dragStart.y - state.dragCurrent.y;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + dx * 1.5, b.y + dy * 1.5);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Soccer Ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(1, pt.life * 0.2), 0, Math.PI * 2);
        ctx.fill();
        if (pt.life <= 0) state.particles.splice(i, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [cardId, gameOver, gameWon]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (gameStateRef.current.ball.isKicked || gameOver) return;
    gameStateRef.current.isAiming = true;
    gameStateRef.current.dragStart = { x: clientX, y: clientY };
    gameStateRef.current.dragCurrent = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (gameStateRef.current.isAiming) {
      gameStateRef.current.dragCurrent = { x: clientX, y: clientY };
    }
  };

  const handlePointerUp = () => {
    const s = gameStateRef.current;
    if (s.isAiming && !s.ball.isKicked) {
      s.isAiming = false;
      const dx = s.dragStart.x - s.dragCurrent.x;
      const dy = s.dragStart.y - s.dragCurrent.y;

      if (Math.hypot(dx, dy) > 20) {
        s.ball.isKicked = true;
        s.ball.vx = (dx / 12) * 1.8;
        s.ball.vy = (dy / 12) * 1.8;
      }
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#15803d] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Soccer Skills 2 World Cup"
        score={goals}
        targetScore={2}
        lives={attemptsLeft}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handlePointerDown(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          handlePointerMove(t.clientX, t.clientY);
        }}
        onTouchEnd={handlePointerUp}
      />

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none text-xs text-yellow-300">
        <div>[{stageName}] 공을 뒤로 당겨 궤적을 조준하고 손을 떼어 감아차세요!</div>
        <div className="text-[10px] text-white/80">골키퍼와 수비수를 피해 2골을 넣으세요.</div>
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={1000}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setStageName(MATCHES[0]);
          setGoals(0);
          setAttemptsLeft(5);
          const s = gameStateRef.current;
          s.matchIdx = 0;
          s.goalsInMatch = 0;
          s.attempts = 5;
          s.startTime = Date.now();
        }}
      />
    </div>
  );
};
