import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlacktopPoliceGameProps {
  onBack: () => void;
  cardId?: number;
}

interface PoliceCar {
  x: number;
  y: number;
  lane: number;
  speed: number;
  sirenColor: string;
}

interface PickZone {
  x: number;
  y: number;
  type: 'robber' | 'safehouse';
  active: boolean;
}

export const PokiBlacktopPoliceGame: React.FC<PokiBlacktopPoliceGameProps> = ({ onBack, cardId = 41 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cash, setCash] = useState(0);
  const [carHp, setCarHp] = useState(100);
  const [hasPassenger, setHasPassenger] = useState(false);
  const [nitro, setNitro] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    carX: 0,
    carY: 0,
    targetLane: 1, // 0: left, 1: mid, 2: right
    speed: 6,
    isNitro: false,
    hp: 100,
    cash: 0,
    hasPassenger: false,
    nitro: 100,
    distance: 0,
    lanes: [0, 0, 0],
    police: [] as PoliceCar[],
    pickups: [] as PickZone[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    sirenTimer: 0,
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
      const roadW = Math.min(canvas.width * 0.9, 440);
      const startX = (canvas.width - roadW) / 2;
      const laneW = roadW / 3;
      gameStateRef.current.lanes = [
        startX + laneW * 0.5,
        startX + laneW * 1.5,
        startX + laneW * 2.5,
      ];
      gameStateRef.current.carX = gameStateRef.current.lanes[1];
      gameStateRef.current.carY = canvas.height - 180;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial pickups
    gameStateRef.current.pickups.push({
      x: gameStateRef.current.lanes[0],
      y: -200,
      type: 'robber',
      active: true,
    });

    const spawnPolice = () => {
      const state = gameStateRef.current;
      if (state.police.length < 3) {
        const laneIdx = Math.floor(Math.random() * 3);
        state.police.push({
          x: state.lanes[laneIdx],
          y: -150 - Math.random() * 200,
          lane: laneIdx,
          speed: 4 + Math.random() * 2,
          sirenColor: '#ef4444',
        });
      }
    };

    const render = () => {
      const state = gameStateRef.current;
      const roadW = Math.min(canvas.width * 0.9, 440);
      const startX = (canvas.width - roadW) / 2;

      // Update
      const actualSpeed = state.isNitro && state.nitro > 0 ? state.speed * 1.6 : state.speed;
      if (state.isNitro && state.nitro > 0) {
        state.nitro = Math.max(0, state.nitro - 0.5);
      } else {
        state.nitro = Math.min(100, state.nitro + 0.15);
      }
      setNitro(Math.floor(state.nitro));

      state.distance += actualSpeed;

      // Steer smooth interpolation
      const targetX = state.lanes[state.targetLane];
      state.carX += (targetX - state.carX) * 0.2;

      // Spawn police periodically
      if (Math.random() < 0.02) spawnPolice();

      // Update police
      state.sirenTimer++;
      const sirenRed = state.sirenTimer % 20 < 10;
      for (let i = state.police.length - 1; i >= 0; i--) {
        const p = state.police[i];
        p.y += actualSpeed - p.speed;
        p.sirenColor = sirenRed ? '#ef4444' : '#3b82f6';

        // Collision with player car
        const dist = Math.hypot(p.x - state.carX, p.y - state.carY);
        if (dist < 46) {
          state.hp -= 15;
          setCarHp(Math.max(0, state.hp));
          // Crash particles
          for (let k = 0; k < 12; k++) {
            state.particles.push({
              x: (p.x + state.carX) / 2,
              y: (p.y + state.carY) / 2,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 25,
              color: '#f59e0b',
            });
          }
          state.police.splice(i, 1);

          if (state.hp <= 0 && !gameOver) {
            setGameOver(true);
            const reward = calculateAndDepositMissionReward({
              gameId: 'pokiblacktoppolice',
              gameTitle: 'Blacktop Police Chase',
              isVictory: false,
              score: state.cash,
              maxTargetScore: 1000,
              durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
            });
            setRewardResult(reward);
            return;
          }
          continue;
        }

        if (p.y > canvas.height + 150) {
          state.police.splice(i, 1);
        }
      }

      // Update pickups
      for (let i = state.pickups.length - 1; i >= 0; i--) {
        const pu = state.pickups[i];
        pu.y += actualSpeed;

        const dist = Math.hypot(pu.x - state.carX, pu.y - state.carY);
        if (pu.active && dist < 50) {
          pu.active = false;
          if (pu.type === 'robber' && !state.hasPassenger) {
            state.hasPassenger = true;
            setHasPassenger(true);
            // Spawn next safehouse ahead
            state.pickups.push({
              x: state.lanes[Math.floor(Math.random() * 3)],
              y: -500,
              type: 'safehouse',
              active: true,
            });
          } else if (pu.type === 'safehouse' && state.hasPassenger) {
            state.hasPassenger = false;
            setHasPassenger(false);
            state.cash += 250;
            setCash(state.cash);

            // Win condition: $1,000
            if (state.cash >= 1000 && !gameWon) {
              setGameWon(true);
              setGameOver(true);
              const reward = calculateAndDepositMissionReward({
                gameId: 'pokiblacktoppolice',
                gameTitle: 'Blacktop Police Chase',
                isVictory: true,
                score: state.cash,
                maxTargetScore: 1000,
                durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
              });
              setRewardResult(reward);
              return;
            }

            // Spawn next robber
            state.pickups.push({
              x: state.lanes[Math.floor(Math.random() * 3)],
              y: -500,
              type: 'robber',
              active: true,
            });
          }
          state.pickups.splice(i, 1);
          continue;
        }

        if (pu.y > canvas.height + 100) {
          state.pickups.splice(i, 1);
          // Re-spawn
          state.pickups.push({
            x: state.lanes[Math.floor(Math.random() * 3)],
            y: -300,
            type: state.hasPassenger ? 'safehouse' : 'robber',
            active: true,
          });
        }
      }

      // Render
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road asphalt
      ctx.fillStyle = '#292524';
      ctx.fillRect(startX, 0, roadW, canvas.height);

      // Road borders
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, canvas.height);
      ctx.moveTo(startX + roadW, 0);
      ctx.lineTo(startX + roadW, canvas.height);
      ctx.stroke();

      // Dashed lane lines
      ctx.strokeStyle = '#e7e5e4';
      ctx.lineWidth = 3;
      ctx.setLineDash([25, 25]);
      ctx.lineDashOffset = -state.distance % 50;
      const laneW = roadW / 3;
      ctx.beginPath();
      ctx.moveTo(startX + laneW, 0);
      ctx.lineTo(startX + laneW, canvas.height);
      ctx.moveTo(startX + laneW * 2, 0);
      ctx.lineTo(startX + laneW * 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Pickups / Safehouses
      for (const pu of state.pickups) {
        if (!pu.active) continue;
        ctx.save();
        if (pu.type === 'robber') {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(pu.x, pu.y, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1c1917';
          ctx.font = 'bold 13px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('👤 PICK', pu.x, pu.y);
        } else {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(pu.x - 28, pu.y - 20, 56, 40);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🏠 SAFE', pu.x, pu.y);
        }
        ctx.restore();
      }

      // Draw Police Cars
      for (const p of state.police) {
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(p.x - 18, p.y - 32, 36, 64);
        // Siren
        ctx.fillStyle = p.sirenColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('POLICE', p.x, p.y + 12);
        ctx.restore();
      }

      // Draw Player Car
      ctx.save();
      // Nitro exhaust flames
      if (state.isNitro && state.nitro > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(state.carX - 10, state.carY + 36);
        ctx.lineTo(state.carX + 10, state.carY + 36);
        ctx.lineTo(state.carX, state.carY + 56 + Math.random() * 10);
        ctx.closePath();
        ctx.fill();
      }

      // Car body
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(state.carX - 22, state.carY - 36, 44, 72);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(state.carX - 18, state.carY - 24, 36, 20);

      // Card sprite hero as driver
      drawCardSprite(ctx, cardId, state.carX - 14, state.carY - 20, 28, 28);

      if (state.hasPassenger) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(state.carX + 14, state.carY - 30, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

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

  const switchLane = (direction: 'left' | 'right') => {
    const s = gameStateRef.current;
    if (direction === 'left') {
      s.targetLane = Math.max(0, s.targetLane - 1);
    } else {
      s.targetLane = Math.min(2, s.targetLane + 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const half = window.innerWidth / 2;
    if (touch.clientX < half) {
      switchLane('left');
    } else {
      switchLane('right');
    }
    gameStateRef.current.isNitro = true;
  };

  const handleTouchEnd = () => {
    gameStateRef.current.isNitro = false;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#1e1b18] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Blacktop Police Chase"
        score={cash}
        targetScore={1000}
        lives={Math.ceil(carHp / 34)}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={(e) => {
          if (e.clientX < window.innerWidth / 2) switchLane('left');
          else switchLane('right');
          gameStateRef.current.isNitro = true;
        }}
        onMouseUp={() => {
          gameStateRef.current.isNitro = false;
        }}
      />

      {/* Touch Steering Guide & Status Bar */}
      <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-between items-center pointer-events-none text-xs text-stone-300">
        <div className="bg-stone-900/80 px-3 py-1.5 rounded-sm border border-stone-700">
          ◀ 터치 [좌선회]
        </div>
        <div className="bg-stone-900/80 px-3 py-1.5 rounded-sm border border-stone-700 text-center">
          <div>{hasPassenger ? '🟢 은신처(SAFE)로 이송 중!' : '🟡 탈옥범(PICK) 태우기 대기'}</div>
          <div className="text-[10px] text-amber-400">터치 유지: 니트로 가속 ({nitro}%)</div>
        </div>
        <div className="bg-stone-900/80 px-3 py-1.5 rounded-sm border border-stone-700">
          터치 [우선회] ▶
        </div>
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={cash}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setCash(0);
          setCarHp(100);
          setHasPassenger(false);
          gameStateRef.current.hp = 100;
          gameStateRef.current.cash = 0;
          gameStateRef.current.hasPassenger = false;
          gameStateRef.current.police = [];
          gameStateRef.current.pickups = [];
          gameStateRef.current.startTime = Date.now();
        }}
      />
    </div>
  );
};
