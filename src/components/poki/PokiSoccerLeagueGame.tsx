import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSoccerLeagueGameProps {
  onBack: () => void;
}

const TARGET_GOALS = 3;

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  team: 'blue' | 'red';
  isKeeper?: boolean;
}

export const PokiSoccerLeagueGame: React.FC<PokiSoccerLeagueGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [playerGoals, setPlayerGoals] = useState(0);
  const [enemyGoals, setEnemyGoals] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    ball: { x: number; y: number; vx: number; vy: number; radius: number };
    players: Player[];
    aimStart: { x: number; y: number } | null;
    aimCurrent: { x: number; y: number } | null;
    playerGoals: number;
    enemyGoals: number;
    gameWon: boolean;
    goalFlash: number;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    ball: { x: 200, y: 320, vx: 0, vy: 0, radius: 8 },
    players: [
      // Blue (Player Team)
      { x: 200, y: 460, vx: 0, vy: 0, team: 'blue', isKeeper: true },
      { x: 140, y: 360, vx: 0, vy: 0, team: 'blue' },
      { x: 260, y: 360, vx: 0, vy: 0, team: 'blue' },
      // Red (Opponent Team)
      { x: 200, y: 150, vx: 0, vy: 0, team: 'red', isKeeper: true },
      { x: 150, y: 240, vx: 0, vy: 0, team: 'red' },
      { x: 250, y: 240, vx: 0, vy: 0, team: 'red' },
    ],
    aimStart: null,
    aimCurrent: null,
    playerGoals: 0,
    enemyGoals: 0,
    gameWon: false,
    goalFlash: 0,
    particles: [],
  });

  const resetPositions = () => {
    const st = stateRef.current;
    st.ball = { x: 200, y: 310, vx: 0, vy: 0, radius: 8 };
    st.players[0].x = 200; st.players[0].y = 470;
    st.players[1].x = 140; st.players[1].y = 360;
    st.players[2].x = 260; st.players[2].y = 360;
    st.players[3].x = 200; st.players[3].y = 150;
    st.players[4].x = 140; st.players[4].y = 250;
    st.players[5].x = 260; st.players[5].y = 250;
    st.players.forEach((p) => { p.vx = 0; p.vy = 0; });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const st = stateRef.current;

      // Pitch background (Green lawn)
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 95, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('SOCCER LEAGUE // 3v3 풋살 챔피언십', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText(`스코어: BLUE ${st.playerGoals} - ${st.enemyGoals} RED | 목표: ${TARGET_GOALS}골`, 84, 56);

      // Pitch Lines
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 90, w - 60, h - 140);

      // Half-way line & circle
      ctx.beginPath();
      ctx.moveTo(30, 310);
      ctx.lineTo(w - 30, 310);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(w / 2, 310, 45, 0, Math.PI * 2);
      ctx.stroke();

      // Top Goal (Red Goal)
      ctx.fillStyle = '#ef4444';
      ctx.strokeRect(140, 70, 120, 20);

      // Bottom Goal (Blue Goal)
      ctx.fillStyle = '#3b82f6';
      ctx.strokeRect(140, h - 50, 120, 20);

      // Update AI (Red Players)
      st.players.forEach((p) => {
        if (p.team === 'red') {
          if (p.isKeeper) {
            // Patrol goal line horizontally following ball
            const targetX = Math.max(150, Math.min(250, st.ball.x));
            p.x += (targetX - p.x) * 0.08;
          } else {
            // Seek ball
            const dx = st.ball.x - p.x;
            const dy = st.ball.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 15 && st.ball.y < 400) {
              p.x += (dx / dist) * 1.6;
              p.y += (dy / dist) * 1.6;
            }
          }
        }
      });

      // Update Ball physics
      st.ball.x += st.ball.vx;
      st.ball.y += st.ball.vy;
      st.ball.vx *= 0.96; // Friction
      st.ball.vy *= 0.96;

      // Ball pitch boundaries
      if (st.ball.x - st.ball.radius < 32 || st.ball.x + st.ball.radius > w - 32) {
        st.ball.vx *= -0.8;
      }

      // Check Goal Scored
      // Top Goal: y <= 90 and between 140 and 260
      if (st.ball.y <= 90 && st.ball.x >= 140 && st.ball.x <= 260 && !st.gameWon) {
        st.playerGoals += 1;
        setPlayerGoals(st.playerGoals);
        st.goalFlash = 1.0;

        // Goal celebration particles
        for (let i = 0; i < 30; i++) {
          st.particles.push({
            x: 200,
            y: 90,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * 6,
            color: '#38bdf8',
            life: 1.0,
          });
        }

        if (st.playerGoals >= TARGET_GOALS) {
          st.gameWon = true;
          setGameWon(true);
          const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'soccer-league',
            gameTitle: 'Soccer League',
            score: st.playerGoals * 100,
            durationSeconds: duration,
          });
          setRewardReceipt(receipt);
        } else {
          resetPositions();
        }
      }

      // Bottom Goal (Enemy Scored)
      if (st.ball.y >= h - 50 && st.ball.x >= 140 && st.ball.x <= 260) {
        st.enemyGoals += 1;
        setEnemyGoals(st.enemyGoals);
        resetPositions();
      }

      // Player-Ball collisions
      st.players.forEach((p) => {
        const dx = st.ball.x - p.x;
        const dy = st.ball.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < st.ball.radius + 14) {
          // Kick ball away
          const angle = Math.atan2(dy, dx);
          const kickForce = p.team === 'red' ? 4.5 : 3.0;
          st.ball.vx = Math.cos(angle) * kickForce;
          st.ball.vy = Math.sin(angle) * kickForce;
        }
      });

      // Draw Aim Slingshot line
      if (st.aimStart && st.aimCurrent) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(st.aimStart.x, st.aimStart.y);
        ctx.lineTo(st.aimCurrent.x, st.aimCurrent.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Players
      st.players.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = p.team === 'blue' ? '#2563eb' : '#dc2626';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Player number / label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.team === 'blue' ? `${idx + 1}` : 'R', p.x, p.y);
      });
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';

      // Draw Ball
      ctx.beginPath();
      ctx.arc(st.ball.x, st.ball.y, st.ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Particles
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life <= 0) {
          st.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
      }

      // Instructions
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 화면을 당겼다 놓아 공을 패스하거나 골대로 슈팅하세요 ]', w / 2, h - 20);
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    stateRef.current.aimStart = { x, y };
    stateRef.current.aimCurrent = { x, y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.aimStart) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    stateRef.current.aimCurrent = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerUp = () => {
    const st = stateRef.current;
    if (st.aimStart && st.aimCurrent) {
      const dx = st.aimStart.x - st.aimCurrent.x;
      const dy = st.aimStart.y - st.aimCurrent.y;
      const power = Math.min(14, Math.hypot(dx, dy) * 0.12);
      const angle = Math.atan2(dy, dx);

      // Find nearest blue player to kick
      st.ball.vx = Math.cos(angle) * power;
      st.ball.vy = Math.sin(angle) * power;
    }
    st.aimStart = null;
    st.aimCurrent = null;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Soccer League"
        score={playerGoals}
        targetScore={TARGET_GOALS}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm cursor-crosshair"
        />
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          receipt={rewardReceipt}
          onConfirm={onBack}
        />
      )}
    </div>
  );
};

export default PokiSoccerLeagueGame;

