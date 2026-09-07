import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBubbleStormGameProps {
  onBack: () => void;
  cardId?: number;
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'];

interface Bubble {
  r: number;
  c: number;
  x: number;
  y: number;
  color: string;
  active: boolean;
}

export const PokiBubbleStormGame: React.FC<PokiBubbleStormGameProps> = ({ onBack, cardId = 45 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [poppedCount, setPoppedCount] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(25);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    grid: [] as Bubble[],
    rows: 6,
    cols: 8,
    bubbleRadius: 18,
    startX: 0,
    startY: 80,
    aimAngle: -Math.PI / 2,
    isAiming: false,
    cannonX: 0,
    cannonY: 0,
    currentBubbleColor: COLORS[0],
    nextBubbleColor: COLORS[1],
    flyingBubble: null as { x: number; y: number; vx: number; vy: number; color: string } | null,
    popped: 0,
    shots: 25,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    startTime: Date.now(),
  });

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
      s.bubbleRadius = Math.min(22, Math.floor(canvas.width / 18));
      s.startX = (canvas.width - s.cols * s.bubbleRadius * 2) / 2 + s.bubbleRadius;
      s.startY = 90;
      s.cannonX = canvas.width / 2;
      s.cannonY = canvas.height - 130;

      // Recalculate grid positions
      s.grid.forEach((b) => {
        b.x = s.startX + b.c * s.bubbleRadius * 2 + (b.r % 2 === 1 ? s.bubbleRadius : 0);
        b.y = s.startY + b.r * s.bubbleRadius * 1.75;
      });
    };

    // Initialize grid
    const s = gameStateRef.current;
    s.grid = [];
    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        s.grid.push({
          r,
          c,
          x: 0,
          y: 0,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          active: true,
        });
      }
    }
    s.currentBubbleColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    s.nextBubbleColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const state = gameStateRef.current;

      // Update Flying Bubble
      if (state.flyingBubble) {
        const fb = state.flyingBubble;
        fb.x += fb.vx;
        fb.y += fb.vy;

        // Wall bounce
        const leftWall = state.startX - state.bubbleRadius;
        const rightWall = state.startX + state.cols * state.bubbleRadius * 2 - state.bubbleRadius;
        if (fb.x - state.bubbleRadius < leftWall || fb.x + state.bubbleRadius > rightWall) {
          fb.vx *= -1;
        }

        // Hit ceiling or grid bubble
        let collided = false;
        if (fb.y - state.bubbleRadius <= state.startY) {
          collided = true;
        } else {
          for (const b of state.grid) {
            if (b.active) {
              const dist = Math.hypot(b.x - fb.x, b.y - fb.y);
              if (dist < state.bubbleRadius * 1.8) {
                collided = true;
                break;
              }
            }
          }
        }

        if (collided) {
          // Find closest empty grid slot
          let closestDist = 9999;
          let bestSlot: Bubble | null = null;
          for (const b of state.grid) {
            if (!b.active) {
              const dist = Math.hypot(b.x - fb.x, b.y - fb.y);
              if (dist < closestDist) {
                closestDist = dist;
                bestSlot = b;
              }
            }
          }

          if (bestSlot && closestDist < state.bubbleRadius * 3) {
            bestSlot.active = true;
            bestSlot.color = fb.color;

            // Check match 3
            const matching: Bubble[] = [];
            const queue: Bubble[] = [bestSlot];
            const visited = new Set<Bubble>();
            visited.add(bestSlot);

            while (queue.length > 0) {
              const curr = queue.shift()!;
              matching.push(curr);

              for (const other of state.grid) {
                if (other.active && other.color === fb.color && !visited.has(other)) {
                  const d = Math.hypot(curr.x - other.x, curr.y - other.y);
                  if (d < state.bubbleRadius * 2.3) {
                    visited.add(other);
                    queue.push(other);
                  }
                }
              }
            }

            if (matching.length >= 3) {
              matching.forEach((b) => {
                b.active = false;
                // Pop sparks
                for (let k = 0; k < 8; k++) {
                  state.particles.push({
                    x: b.x,
                    y: b.y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    color: b.color,
                    life: 20,
                  });
                }
              });
              state.popped += matching.length;
              setPoppedCount(state.popped);
            }
          }

          state.flyingBubble = null;
          state.currentBubbleColor = state.nextBubbleColor;
          state.nextBubbleColor = COLORS[Math.floor(Math.random() * COLORS.length)];

          // Win check
          if (state.popped >= 30 && !gameWon) {
            setGameWon(true);
            setGameOver(true);
            const reward = calculateAndDepositMissionReward({
              gameId: 'pokibubblestorm',
              gameTitle: 'Bubble Storm',
              isVictory: true,
              score: state.popped * 35,
              maxTargetScore: 1000,
              durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
            });
            setRewardResult(reward);
            return;
          }

          if (state.shots <= 0 && !gameOver) {
            setGameOver(true);
            const won = state.popped >= 30;
            setGameWon(won);
            const reward = calculateAndDepositMissionReward({
              gameId: 'pokibubblestorm',
              gameTitle: 'Bubble Storm',
              isVictory: won,
              score: state.popped * 35,
              maxTargetScore: 1000,
              durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
            });
            setRewardResult(reward);
            return;
          }
        }
      }

      // Drawing
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Play area border
      const leftWall = state.startX - state.bubbleRadius;
      const rightWall = state.startX + state.cols * state.bubbleRadius * 2 - state.bubbleRadius;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(leftWall, 80, rightWall - leftWall, canvas.height - 200);

      // Draw Grid Bubbles
      for (const b of state.grid) {
        if (!b.active) continue;
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, state.bubbleRadius, 0, Math.PI * 2);
        ctx.fill();
        // Gloss highlight
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(b.x - state.bubbleRadius * 0.3, b.y - state.bubbleRadius * 0.3, state.bubbleRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Trajectory Aiming Line
      if (state.isAiming) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(state.cannonX, state.cannonY);
        ctx.lineTo(
          state.cannonX + Math.cos(state.aimAngle) * 220,
          state.cannonY + Math.sin(state.aimAngle) * 220
        );
        ctx.stroke();
        ctx.restore();
      }

      // Draw Flying Bubble
      if (state.flyingBubble) {
        ctx.save();
        ctx.fillStyle = state.flyingBubble.color;
        ctx.beginPath();
        ctx.arc(state.flyingBubble.x, state.flyingBubble.y, state.bubbleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Cannon Base & Hero Sprite
      drawCardSprite(ctx, cardId, state.cannonX - 22, state.cannonY + 10, 44, 52);

      // Loaded current bubble
      ctx.save();
      ctx.fillStyle = state.currentBubbleColor;
      ctx.beginPath();
      ctx.arc(state.cannonX, state.cannonY, state.bubbleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(state.cannonX - 5, state.cannonY - 5, 6, 0, Math.PI * 2);
      ctx.fill();

      // Next bubble preview
      ctx.fillStyle = state.nextBubbleColor;
      ctx.beginPath();
      ctx.arc(state.cannonX + 50, state.cannonY + 20, state.bubbleRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText('NEXT', state.cannonX + 40, state.cannonY + 45);
      ctx.restore();

      // Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(1, pt.life * 0.25), 0, Math.PI * 2);
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
    if (gameStateRef.current.flyingBubble || gameOver) return;
    gameStateRef.current.isAiming = true;
    updateAim(clientX, clientY);
  };

  const updateAim = (clientX: number, clientY: number) => {
    const s = gameStateRef.current;
    const dx = clientX - s.cannonX;
    const dy = clientY - s.cannonY;
    let angle = Math.atan2(dy, dx);
    if (angle > -0.2) angle = -0.2;
    if (angle < -Math.PI + 0.2) angle = -Math.PI + 0.2;
    s.aimAngle = angle;
  };

  const handlePointerUp = () => {
    const s = gameStateRef.current;
    if (!s.isAiming || s.flyingBubble || s.shots <= 0 || gameOver) return;
    s.isAiming = false;
    s.shots--;
    setShotsLeft(s.shots);

    const speed = 14;
    s.flyingBubble = {
      x: s.cannonX,
      y: s.cannonY,
      vx: Math.cos(s.aimAngle) * speed,
      vy: Math.sin(s.aimAngle) * speed,
      color: s.currentBubbleColor,
    };
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#0f172a] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Bubble Storm"
        score={poppedCount}
        targetScore={30}
        lives={shotsLeft}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => {
          if (gameStateRef.current.isAiming) updateAim(e.clientX, e.clientY);
        }}
        onMouseUp={handlePointerUp}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handlePointerDown(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (gameStateRef.current.isAiming) updateAim(t.clientX, t.clientY);
        }}
        onTouchEnd={handlePointerUp}
      />

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none text-xs text-cyan-400">
        화면을 드래그하여 조준선을 맞추고 손을 떼어 발사하세요! (3개 이상 매칭)
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={poppedCount * 35}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setPoppedCount(0);
          setShotsLeft(25);
          const s = gameStateRef.current;
          s.popped = 0;
          s.shots = 25;
          s.grid.forEach((b) => {
            b.active = true;
            b.color = COLORS[Math.floor(Math.random() * COLORS.length)];
          });
          s.startTime = Date.now();
        }}
      />
    </div>
  );
};

export default PokiBubbleStormGame;
