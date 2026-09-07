import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStealBrainrotGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Guard {
  x: number;
  y: number;
  angle: number;
  patrolRoute: { x: number; y: number }[];
  currentRouteIdx: number;
  speed: number;
  viewDist: number;
  fov: number; // in radians
}

export const PokiStealBrainrotGame: React.FC<PokiStealBrainrotGameProps> = ({ onBack, cardId = 21 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [hasBrainrot, setHasBrainrot] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: { x: 80, y: 350, targetX: 80, targetY: 350, speed: 3.4, radius: 16 },
    brainrot: { x: 740, y: 350, collected: false, radius: 20 },
    escapeZone: { x: 70, y: 350, radius: 55 },
    guards: [
      {
        x: 320,
        y: 180,
        angle: 0,
        patrolRoute: [{ x: 320, y: 180 }, { x: 320, y: 520 }],
        currentRouteIdx: 0,
        speed: 1.8,
        viewDist: 150,
        fov: Math.PI / 3.5,
      },
      {
        x: 540,
        y: 520,
        angle: Math.PI,
        patrolRoute: [{ x: 540, y: 520 }, { x: 540, y: 180 }],
        currentRouteIdx: 0,
        speed: 2.1,
        viewDist: 160,
        fov: Math.PI / 3.2,
      },
      {
        x: 700,
        y: 200,
        angle: Math.PI / 2,
        patrolRoute: [{ x: 700, y: 200 }, { x: 700, y: 500 }],
        currentRouteIdx: 0,
        speed: 1.6,
        viewDist: 140,
        fov: Math.PI / 3,
      }
    ] as Guard[],
    alarmPulse: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      const p = state.player;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.min(cw / 840, ch / 680);
      const offsetX = (cw - 840 * scale) / 2;
      const offsetY = (ch - 680 * scale) / 2;

      if (!gameOver && !gameWon) {
        // Player move to target
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);
        const actualSpeed = state.brainrot.collected ? p.speed * 1.25 : p.speed;

        if (dist > 4) {
          p.x += (dx / dist) * Math.min(dist, actualSpeed);
          p.y += (dy / dist) * Math.min(dist, actualSpeed);
        }

        // Clamp inside arena
        p.x = Math.max(50, Math.min(790, p.x));
        p.y = Math.max(100, Math.min(600, p.y));

        // Guards patrol & FOV detection
        state.guards.forEach(g => {
          const target = g.patrolRoute[g.currentRouteIdx];
          const gdx = target.x - g.x;
          const gdy = target.y - g.y;
          const gdist = Math.hypot(gdx, gdy);

          if (gdist < 6) {
            g.currentRouteIdx = (g.currentRouteIdx + 1) % g.patrolRoute.length;
          } else {
            g.x += (gdx / gdist) * g.speed;
            g.y += (gdy / gdist) * g.speed;
            g.angle = Math.atan2(gdy, gdx);
          }

          // Check if player in FOV
          const pdx = p.x - g.x;
          const pdy = p.y - g.y;
          const pdist = Math.hypot(pdx, pdy);

          if (pdist < g.viewDist) {
            let angleDiff = Math.atan2(pdy, pdx) - g.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (Math.abs(angleDiff) < g.fov / 2) {
              // Spotted by guard!
              setGameOver(true);
            }
          }

          // Guard touch
          if (pdist < p.radius + 18) {
            setGameOver(true);
          }
        });

        // Brainrot pickup
        if (!state.brainrot.collected) {
          const bdist = Math.hypot(p.x - state.brainrot.x, p.y - state.brainrot.y);
          if (bdist < p.radius + state.brainrot.radius) {
            state.brainrot.collected = true;
            setHasBrainrot(true);
            setAlarmActive(true);
            // Speed up guards
            state.guards.forEach(g => (g.speed *= 1.4));
          }
        }

        // Escape check
        if (state.brainrot.collected) {
          const edist = Math.hypot(p.x - state.escapeZone.x, p.y - state.escapeZone.y);
          if (edist < state.escapeZone.radius) {
            setGameWon(true);
            const deposit = calculateAndDepositMissionReward({
              gameId: 'poki_steal_brainrot',
              gameTitle: 'Steal a Brainrot',
              isVictory: true,
              score: 100,
              maxTargetScore: 100,
              durationSeconds: 40,
            });
            setRewardResult(deposit);
            return;
          }
        }

        if (alarmActive) {
          state.alarmPulse = (state.alarmPulse + 0.1) % (Math.PI * 2);
        }
      }

      // Drawing
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Arena Base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(40, 80, 760, 540);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 80, 760, 540);

      // Laser grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 80; x < 800; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 80);
        ctx.lineTo(x, 620);
        ctx.stroke();
      }
      for (let y = 120; y < 620; y += 40) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(800, y);
        ctx.stroke();
      }

      // Escape Safe Zone
      ctx.beginPath();
      ctx.arc(state.escapeZone.x, state.escapeZone.y, state.escapeZone.radius, 0, Math.PI * 2);
      ctx.fillStyle = state.brainrot.collected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 116, 139, 0.2)';
      ctx.fill();
      ctx.strokeStyle = state.brainrot.collected ? '#22c55e' : '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = state.brainrot.collected ? '#86efac' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(state.brainrot.collected ? 'ESCAPE HERE!' : 'SAFE ZONE', state.escapeZone.x, state.escapeZone.y + 4);

      // Guards and their Flashlight FOV
      state.guards.forEach(g => {
        // FOV cone
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.arc(g.x, g.y, g.viewDist, g.angle - g.fov / 2, g.angle + g.fov / 2);
        ctx.closePath();
        ctx.fillStyle = alarmActive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(234, 179, 8, 0.2)';
        ctx.fill();
        ctx.strokeStyle = alarmActive ? 'rgba(239, 68, 68, 0.6)' : 'rgba(234, 179, 8, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Guard body
        ctx.beginPath();
        ctx.arc(g.x, g.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Guard visor direction
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(g.x + Math.cos(g.angle) * 10, g.y + Math.sin(g.angle) * 10, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Brainrot Trophy Vault
      if (!state.brainrot.collected) {
        ctx.beginPath();
        ctx.arc(state.brainrot.x, state.brainrot.y, state.brainrot.radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🗿', state.brainrot.x, state.brainrot.y);

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#f3e8ff';
        ctx.fillText('BRAINROT', state.brainrot.x, state.brainrot.y + 32);
      }

      // Player
      drawCardSprite(ctx, cardId, p.x - 18, p.y - 18, 36, 36);

      // Carried Trophy icon over player head
      if (state.brainrot.collected) {
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🗿', p.x, p.y - 26);
      }

      // Alarm red border pulse
      if (alarmActive) {
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + Math.sin(state.alarmPulse) * 0.3})`;
        ctx.lineWidth = 10;
        ctx.strokeRect(40, 80, 760, 540);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId, alarmActive]);

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.min(cw / 840, ch / 680);
    const offsetX = (cw - 840 * scale) / 2;
    const offsetY = (ch - 680 * scale) / 2;

    const clickX = (e.clientX - rect.left - offsetX) / scale;
    const clickY = (e.clientY - rect.top - offsetY) / scale;

    gameStateRef.current.player.targetX = clickX;
    gameStateRef.current.player.targetY = clickY;
  };

  const handleRestart = () => {
    gameStateRef.current = {
      player: { x: 80, y: 350, targetX: 80, targetY: 350, speed: 3.4, radius: 16 },
      brainrot: { x: 740, y: 350, collected: false, radius: 20 },
      escapeZone: { x: 70, y: 350, radius: 55 },
      guards: [
        {
          x: 320,
          y: 180,
          angle: 0,
          patrolRoute: [{ x: 320, y: 180 }, { x: 320, y: 520 }],
          currentRouteIdx: 0,
          speed: 1.8,
          viewDist: 150,
          fov: Math.PI / 3.5,
        },
        {
          x: 540,
          y: 520,
          angle: Math.PI,
          patrolRoute: [{ x: 540, y: 520 }, { x: 540, y: 180 }],
          currentRouteIdx: 0,
          speed: 2.1,
          viewDist: 160,
          fov: Math.PI / 3.2,
        },
        {
          x: 700,
          y: 200,
          angle: Math.PI / 2,
          patrolRoute: [{ x: 700, y: 200 }, { x: 700, y: 500 }],
          currentRouteIdx: 0,
          speed: 1.6,
          viewDist: 140,
          fov: Math.PI / 3,
        }
      ],
      alarmPulse: 0,
    };
    setGameOver(false);
    setGameWon(false);
    setHasBrainrot(false);
    setAlarmActive(false);
    setRewardResult(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#0f172a] overflow-hidden select-none font-mono touch-none">
      <MinimalistMissionHUD
        title="STEAL A BRAINROT"
        score={hasBrainrot ? 1 : 0}
        goalScore={1}
        onBack={onBack}
        unit="TROPHY"
      />

      {/* Alarm Status Badge */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center text-xs bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-sm">
        <div className="flex items-center gap-2">
          <span>STATUS:</span>
          <span className={`font-bold ${alarmActive ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
            {alarmActive ? '⚠️ ALARM ACTIVE - RUN!' : 'INFILTRATING QUIETLY'}
          </span>
        </div>
        <div className="font-bold text-purple-300">
          {hasBrainrot ? '🗿 TROPHY ACQUIRED! ESCAPE TO SAFE ZONE' : 'TARGET: STEAL 🗿 BRAINROT'}
        </div>
      </div>

      {/* Touch Guide */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-[11px] text-slate-400 bg-slate-900/90 border border-slate-700 px-4 py-1.5 rounded-sm whitespace-nowrap pointer-events-none">
        화면을 탭/드래그하여 이동 • 경비원 시야(노란 콘)를 피해 유물을 훔치고 탈출하세요
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
          <div className="text-red-500 font-bold text-2xl mb-2 tracking-widest">[ SPOTTED & ARRESTED ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            경비 로봇의 시야에 포착되어 체포되었습니다!
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 잠입
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
          rewardAmount={rewardResult?.rewardAmount || 38}
          message="경비망을 뚫고 Brainrot 트로피를 안전하게 탈취했습니다!"
        />
      )}
    </div>
  );
};

export default PokiStealBrainrotGame;
