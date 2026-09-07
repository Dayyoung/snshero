import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiDisasterArenaGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Meteor {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  speed: number;
  exploded: boolean;
  blastRadius: number;
}

interface SafeTile {
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean;
  warningTimer: number;
}

export const PokiDisasterArenaGame: React.FC<PokiDisasterArenaGameProps> = ({ onBack, cardId = 30 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hp, setHp] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: { x: 400, y: 350, targetX: 400, targetY: 350, speed: 4.2, radius: 18, hp: 100 },
    meteors: [] as Meteor[],
    tiles: [] as SafeTile[],
    timeRemaining: 30,
    spawnTimer: 0,
    arenaRadius: 260,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      const state = gameStateRef.current;
      const p = state.player;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;
      const center = { x: cw / 2, y: ch / 2 + 10 };

      if (!gameOver && !gameWon) {
        state.timeRemaining = Math.max(0, state.timeRemaining - dt);
        setTimeLeft(Math.ceil(state.timeRemaining));

        if (state.timeRemaining <= 0) {
          setGameWon(true);
          const deposit = calculateAndDepositMissionReward({
            gameId: 'poki_disaster_arena',
            gameTitle: 'Disaster Arena',
            isVictory: true,
            score: 100,
            maxTargetScore: 100,
            durationSeconds: 30,
          });
          setRewardResult(deposit);
          return;
        }

        // Move Player to Target
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          p.x += (dx / dist) * Math.min(dist, p.speed * 60 * dt);
          p.y += (dy / dist) * Math.min(dist, p.speed * 60 * dt);
        }

        // Clamp in Arena circle
        const pDist = Math.hypot(p.x - center.x, p.y - center.y);
        if (pDist > state.arenaRadius - p.radius) {
          const angle = Math.atan2(p.y - center.y, p.x - center.x);
          p.x = center.x + Math.cos(angle) * (state.arenaRadius - p.radius);
          p.y = center.y + Math.sin(angle) * (state.arenaRadius - p.radius);
        }

        // Spawn Meteors
        state.spawnTimer += dt;
        if (state.spawnTimer > 0.45) {
          state.spawnTimer = 0;
          const targetAngle = Math.random() * Math.PI * 2;
          const targetDist = Math.random() * (state.arenaRadius - 30);
          const tx = center.x + Math.cos(targetAngle) * targetDist;
          const ty = center.y + Math.sin(targetAngle) * targetDist;

          state.meteors.push({
            x: tx + (Math.random() - 0.5) * 100,
            y: ty - 450,
            targetX: tx,
            targetY: ty,
            radius: 12,
            speed: 520,
            exploded: false,
            blastRadius: 55,
          });
        }

        // Update Meteors
        for (let i = state.meteors.length - 1; i >= 0; i--) {
          const m = state.meteors[i];
          if (!m.exploded) {
            const mdy = m.targetY - m.y;
            m.y += m.speed * dt;
            if (m.y >= m.targetY) {
              m.y = m.targetY;
              m.exploded = true;

              // Blast damage to player
              const hitDist = Math.hypot(p.x - m.targetX, p.y - m.targetY);
              if (hitDist < m.blastRadius) {
                p.hp = Math.max(0, p.hp - 35);
                setHp(p.hp);
                if (p.hp <= 0) {
                  setGameOver(true);
                  return;
                }
              }
            }
          } else {
            // Blast dissipation
            m.blastRadius -= 90 * dt;
            if (m.blastRadius <= 0) {
              state.meteors.splice(i, 1);
            }
          }
        }
      }

      // Drawing
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, cw, ch);

      // Lava background outside arena
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, 0, cw, ch);

      // Arena Circle
      ctx.beginPath();
      ctx.arc(center.x, center.y, state.arenaRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#27272a';
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Meteors & Impact Reticles
      state.meteors.forEach(m => {
        if (!m.exploded) {
          // Warning reticle on ground
          ctx.beginPath();
          ctx.arc(m.targetX, m.targetY, 35, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fill();

          // Meteorite body in sky
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#f97316';
          ctx.fill();
        } else {
          // Explosion shockwave
          ctx.beginPath();
          ctx.arc(m.targetX, m.targetY, m.blastRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });

      // Player
      drawCardSprite(ctx, cardId, p.x - 18, p.y - 18, 36, 36);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    gameStateRef.current.player.targetX = e.clientX - rect.left;
    gameStateRef.current.player.targetY = e.clientY - rect.top;
  };

  const handleRestart = () => {
    gameStateRef.current = {
      player: { x: 400, y: 350, targetX: 400, targetY: 350, speed: 4.2, radius: 18, hp: 100 },
      meteors: [],
      tiles: [],
      timeRemaining: 30,
      spawnTimer: 0,
      arenaRadius: 260,
    };
    setTimeLeft(30);
    setHp(100);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#18181b] overflow-hidden select-none font-mono touch-none">
      <MinimalistMissionHUD
        title="DISASTER ARENA"
        score={30 - timeLeft}
        goalScore={30}
        onBack={onBack}
        unit="SECONDS"
      />

      {/* Survival Time & HP Bar */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-zinc-900/80 border border-zinc-700 px-3 py-1.5 rounded-sm text-xs">
        <div className="flex items-center gap-2">
          <span>HERO HP:</span>
          <div className="w-20 h-2 bg-zinc-800 rounded-xs overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${hp}%` }} />
          </div>
          <span className="font-bold text-emerald-400">{hp}</span>
        </div>
        <span className="font-bold text-amber-400 animate-pulse">🔥 SURVIVE: {timeLeft}s LEFT</span>
      </div>

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-zinc-300 bg-zinc-900/90 border border-zinc-700 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        화면을 탭/드래그하여 <span className="text-orange-400 font-bold">붉은 낙하 표식을 피하며</span> 30초간 생존하세요!
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointer}
        onPointerMove={e => e.buttons === 1 && handlePointer(e)}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ OBLITERATED ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            쏟아지는 메테오 폭격에 쓰러졌습니다! 낙하 궤적을 예측하여 안전 구역으로 피신하세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 생존
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-sm transition-colors cursor-pointer"
            >
              미션 목록
            </button>
          </div>
        </div>
      )}

      {/* Victory Reward Modal */}
      {gameWon && (
        <VictoryRewardModal
          isOpen={true}
          onClose={onBack}
          rewardAmount={rewardResult?.rewardAmount || 40}
          message="메테오 대재앙의 극한 환경에서 끝까지 살아남아 승리를 쟁취했습니다!"
        />
      )}
    </div>
  );
};

export default PokiDisasterArenaGame;
