import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBackroomsRecoveryGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Item {
  x: number;
  y: number;
  collected: boolean;
  type: 'keycard' | 'battery' | 'tape';
}

interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  state: 'patrol' | 'chase';
}

export const PokiBackroomsRecoveryGame: React.FC<PokiBackroomsRecoveryGameProps> = ({ onBack, cardId = 19 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [keysFound, setKeysFound] = useState(0);
  const [flashlight, setFlashlight] = useState(100);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: { x: 120, y: 120, targetX: 120, targetY: 120, speed: 3.2, radius: 18 },
    exit: { x: 800, y: 750, radius: 35, unlocked: false },
    items: [
      { x: 300, y: 220, collected: false, type: 'keycard' as const },
      { x: 750, y: 180, collected: false, type: 'keycard' as const },
      { x: 200, y: 680, collected: false, type: 'keycard' as const },
      { x: 500, y: 450, collected: false, type: 'battery' as const },
      { x: 650, y: 550, collected: false, type: 'battery' as const },
    ],
    entities: [
      { x: 450, y: 300, vx: 1.5, vy: 0, speed: 1.8, state: 'patrol' as const },
      { x: 600, y: 700, vx: 0, vy: -1.5, speed: 2.0, state: 'patrol' as const },
    ],
    walls: [
      // Outer bounds
      { x: 40, y: 40, w: 880, h: 20 },
      { x: 40, y: 840, w: 880, h: 20 },
      { x: 40, y: 40, w: 20, h: 820 },
      { x: 900, y: 40, w: 20, h: 820 },
      // Inner yellow partitions
      { x: 220, y: 40, w: 20, h: 300 },
      { x: 400, y: 160, w: 20, h: 350 },
      { x: 580, y: 40, w: 20, h: 250 },
      { x: 720, y: 250, w: 20, h: 350 },
      { x: 180, y: 480, w: 240, h: 20 },
      { x: 420, y: 600, w: 280, h: 20 },
      { x: 550, y: 400, w: 250, h: 20 },
      { x: 250, y: 700, w: 20, h: 160 },
      { x: 750, y: 680, w: 170, h: 20 },
    ],
    camera: { x: 0, y: 0 },
    keysCount: 0,
    flashlightBattery: 100,
    heartbeatRate: 1,
    isInteracting: false,
  });

  const checkWallCollision = (x: number, y: number, r: number) => {
    for (const w of gameStateRef.current.walls) {
      const closestX = Math.max(w.x, Math.min(x, w.x + w.w));
      const closestY = Math.max(w.y, Math.min(y, w.y + w.h));
      const distX = x - closestX;
      const distY = y - closestY;
      if (distX * distX + distY * distY < r * r) {
        return true;
      }
    }
    return false;
  };

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

      // Handle screen size
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;

      if (!gameOver && !gameWon) {
        // Player movement towards target
        const dx = state.player.targetX - state.player.x;
        const dy = state.player.targetY - state.player.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
          const moveStep = Math.min(dist, state.player.speed * 60 * dt);
          const nextX = state.player.x + (dx / dist) * moveStep;
          const nextY = state.player.y + (dy / dist) * moveStep;

          if (!checkWallCollision(nextX, state.player.y, state.player.radius)) {
            state.player.x = nextX;
          }
          if (!checkWallCollision(state.player.x, nextY, state.player.radius)) {
            state.player.y = nextY;
          }
        }

        // Battery drain
        state.flashlightBattery = Math.max(0, state.flashlightBattery - dt * 1.2);
        setFlashlight(Math.round(state.flashlightBattery));

        // Camera follow
        state.camera.x = state.player.x - cw / 2;
        state.camera.y = state.player.y - ch / 2;

        // Items pickup
        state.items.forEach(item => {
          if (!item.collected) {
            const d = Math.hypot(state.player.x - item.x, state.player.y - item.y);
            if (d < state.player.radius + 18) {
              item.collected = true;
              if (item.type === 'keycard') {
                state.keysCount += 1;
                setKeysFound(state.keysCount);
                if (state.keysCount >= 3) {
                  state.exit.unlocked = true;
                }
              } else if (item.type === 'battery') {
                state.flashlightBattery = Math.min(100, state.flashlightBattery + 45);
              }
            }
          }
        });

        // Exit check
        const exitDist = Math.hypot(state.player.x - state.exit.x, state.player.y - state.exit.y);
        if (exitDist < state.player.radius + state.exit.radius && state.exit.unlocked) {
          setGameWon(true);
          const deposit = calculateAndDepositMissionReward({
            gameId: 'poki_backrooms_recovery',
            gameTitle: 'Backrooms Recovery',
            isVictory: true,
            score: 3,
            maxTargetScore: 3,
            durationSeconds: 45,
          });
          setRewardResult(deposit);
          return;
        }

        // Entities behavior
        let minEntityDist = 9999;
        state.entities.forEach(ent => {
          const pDist = Math.hypot(state.player.x - ent.x, state.player.y - ent.y);
          if (pDist < minEntityDist) minEntityDist = pDist;

          // Chase if close or patrolling
          if (pDist < 260) {
            ent.state = 'chase';
            const edx = state.player.x - ent.x;
            const edy = state.player.y - ent.y;
            const edist = Math.hypot(edx, edy) || 1;
            ent.vx = (edx / edist) * ent.speed * 1.5;
            ent.vy = (edy / edist) * ent.speed * 1.5;
          } else {
            ent.state = 'patrol';
            if (Math.random() < 0.02) {
              const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
              const a = angles[Math.floor(Math.random() * angles.length)];
              ent.vx = Math.cos(a) * ent.speed;
              ent.vy = Math.sin(a) * ent.speed;
            }
          }

          const nex = ent.x + ent.vx * 60 * dt;
          const ney = ent.y + ent.vy * 60 * dt;
          if (!checkWallCollision(nex, ent.y, 16)) ent.x = nex;
          else ent.vx = -ent.vx;
          if (!checkWallCollision(ent.x, ney, 16)) ent.y = ney;
          else ent.vy = -ent.vy;

          // Catch player
          if (pDist < state.player.radius + 14) {
            setGameOver(true);
          }
        });

        // Heartbeat visual intensity
        state.heartbeatRate = minEntityDist < 200 ? 1 + (200 - minEntityDist) / 40 : 1;
      }

      // Drawing
      ctx.fillStyle = '#0a0a08';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(-state.camera.x, -state.camera.y);

      // Floor - creepy fluorescent yellowish wallpaper grid
      ctx.fillStyle = '#262315';
      ctx.fillRect(40, 40, 880, 820);

      // Carpet grid lines
      ctx.strokeStyle = 'rgba(70, 65, 35, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 40; x <= 920; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, 860);
        ctx.stroke();
      }
      for (let y = 40; y <= 860; y += 40) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(920, y);
        ctx.stroke();
      }

      // Exit Zone
      ctx.fillStyle = state.exit.unlocked ? 'rgba(74, 222, 128, 0.35)' : 'rgba(239, 68, 68, 0.2)';
      ctx.beginPath();
      ctx.arc(state.exit.x, state.exit.y, state.exit.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = state.exit.unlocked ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = state.exit.unlocked ? '#86efac' : '#fca5a5';
      ctx.textAlign = 'center';
      ctx.fillText(state.exit.unlocked ? 'EXIT OPEN' : 'EXIT LOCKED', state.exit.x, state.exit.y + 4);

      // Walls
      ctx.fillStyle = '#453c20';
      ctx.strokeStyle = '#1e1a0d';
      ctx.lineWidth = 2;
      state.walls.forEach(w => {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      });

      // Items
      state.items.forEach(item => {
        if (!item.collected) {
          ctx.beginPath();
          if (item.type === 'keycard') {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(item.x - 10, item.y - 8, 20, 16);
            ctx.fillStyle = '#1e1a0d';
            ctx.fillRect(item.x - 7, item.y - 5, 6, 10);
          } else {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(item.x - 8, item.y - 12, 16, 24);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(item.x - 4, item.y - 15, 8, 3);
          }
        }
      });

      // Entities (Shadow creatures)
      state.entities.forEach(ent => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ent.x, ent.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#0f0e0c';
        ctx.fill();
        ctx.strokeStyle = ent.state === 'chase' ? '#ef4444' : '#52525b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glowing red piercing eyes
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(ent.x - 5, ent.y - 4, 3, 0, Math.PI * 2);
        ctx.arc(ent.x + 5, ent.y - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Player
      drawCardSprite(ctx, cardId, state.player.x - 18, state.player.y - 18, 36, 36);

      ctx.restore();

      // Flashlight Vignette / Darkness Effect
      const pScreenX = state.player.x - state.camera.x;
      const pScreenY = state.player.y - state.camera.y;
      const lightRadius = Math.max(60, (state.flashlightBattery / 100) * 220);

      const grad = ctx.createRadialGradient(
        pScreenX, pScreenY, lightRadius * 0.3,
        pScreenX, pScreenY, lightRadius
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.7, 'rgba(10,10,8,0.7)');
      grad.addColorStop(1, 'rgba(10,10,8,0.98)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      // Flickering heartbeat chromatic noise when entity is close
      if (state.heartbeatRate > 1.2) {
        ctx.fillStyle = `rgba(239, 68, 68, ${Math.sin(time * 0.01 * state.heartbeatRate) * 0.12 + 0.12})`;
        ctx.fillRect(0, 0, cw, ch);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Touch / Pointer controls
  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const state = gameStateRef.current;
    state.player.targetX = state.camera.x + touchX;
    state.player.targetY = state.camera.y + touchY;
  };

  const handleRestart = () => {
    gameStateRef.current = {
      player: { x: 120, y: 120, targetX: 120, targetY: 120, speed: 3.2, radius: 18 },
      exit: { x: 800, y: 750, radius: 35, unlocked: false },
      items: [
        { x: 300, y: 220, collected: false, type: 'keycard' },
        { x: 750, y: 180, collected: false, type: 'keycard' },
        { x: 200, y: 680, collected: false, type: 'keycard' },
        { x: 500, y: 450, collected: false, type: 'battery' },
        { x: 650, y: 550, collected: false, type: 'battery' },
      ],
      entities: [
        { x: 450, y: 300, vx: 1.5, vy: 0, speed: 1.8, state: 'patrol' },
        { x: 600, y: 700, vx: 0, vy: -1.5, speed: 2.0, state: 'patrol' },
      ],
      walls: gameStateRef.current.walls,
      camera: { x: 0, y: 0 },
      keysCount: 0,
      flashlightBattery: 100,
      heartbeatRate: 1,
      isInteracting: false,
    };
    setGameOver(false);
    setGameWon(false);
    setKeysFound(0);
    setFlashlight(100);
    setRewardResult(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#0a0a08] overflow-hidden select-none font-mono touch-none">
      <MinimalistMissionHUD
        title="BACKROOMS RECOVERY"
        score={keysFound}
        goalScore={3}
        onBack={onBack}
        unit="KEYS"
      />

      {/* Battery & Status Bar */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center text-xs text-[#a1a1aa] bg-[#18181b]/80 border border-[#27272a] px-3 py-1.5 rounded-sm">
        <div className="flex items-center gap-2">
          <span>FLASHLIGHT:</span>
          <div className="w-24 h-2.5 bg-[#27272a] rounded-xs overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${flashlight > 25 ? 'bg-amber-400' : 'bg-red-500 animate-pulse'}`}
              style={{ width: `${flashlight}%` }}
            />
          </div>
          <span>{flashlight}%</span>
        </div>
        <div className="font-bold text-amber-300">
          KEYS: {keysFound} / 3 {keysFound >= 3 && ' [EXIT UNLOCKED]'}
        </div>
      </div>

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-[11px] text-[#71717a] bg-[#09090b]/90 border border-[#27272a] px-4 py-1.5 rounded-sm whitespace-nowrap pointer-events-none">
        화면을 탭/드래그하여 이동 • 그림자를 피해 키카드 3개를 모아 EXIT로 탈출
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
          <div className="text-red-500 font-bold text-2xl mb-2 tracking-widest">[ ENTITY CAUGHT YOU ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            그림자 엔티티에게 붙잡혔습니다! 복도의 어둠 속으로 끌려들어갔습니다.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 시도
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
          rewardAmount={rewardResult?.rewardAmount || 36}
          message="기묘한 백룸 미로의 모든 키카드를 회수하고 안전하게 탈출했습니다!"
        />
      )}
    </div>
  );
};

export default PokiBackroomsRecoveryGame;
