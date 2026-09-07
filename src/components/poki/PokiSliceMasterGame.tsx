import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSliceMasterGameProps {
  onBack: () => void;
  cardId?: number;
}

interface TargetItem {
  x: number;
  y: number;
  type: 'fruit' | 'burger' | 'spike';
  sliced: boolean;
  name: string;
}

export const PokiSliceMasterGame: React.FC<PokiSliceMasterGameProps> = ({ onBack, cardId = 31 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [slices, setSlices] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    knife: {
      x: 100,
      y: 280,
      vx: 3.5,
      vy: 0,
      angle: 0,
      angularVel: 0.12,
      stuck: false,
    },
    items: [
      { x: 300, y: 350, type: 'fruit' as const, sliced: false, name: '🍎' },
      { x: 450, y: 350, type: 'burger' as const, sliced: false, name: '🍔' },
      { x: 620, y: 380, type: 'spike' as const, sliced: false, name: '🔺' },
      { x: 780, y: 350, type: 'fruit' as const, sliced: false, name: '🍊' },
      { x: 950, y: 350, type: 'fruit' as const, sliced: false, name: '🍉' },
      { x: 1100, y: 380, type: 'spike' as const, sliced: false, name: '🔺' },
      { x: 1250, y: 350, type: 'burger' as const, sliced: false, name: '🍕' },
      { x: 1400, y: 350, type: 'fruit' as const, sliced: false, name: '🥝' },
      { x: 1550, y: 380, type: 'spike' as const, sliced: false, name: '🔺' },
      { x: 1700, y: 350, type: 'fruit' as const, sliced: false, name: '🍓' },
      { x: 1850, y: 350, type: 'burger' as const, sliced: false, name: '🍔' },
      { x: 2000, y: 350, type: 'fruit' as const, sliced: false, name: '🍍' },
      { x: 2150, y: 380, type: 'spike' as const, sliced: false, name: '🔺' },
      { x: 2300, y: 350, type: 'burger' as const, sliced: false, name: '🌭' },
      { x: 2450, y: 350, type: 'fruit' as const, sliced: false, name: '🍇' },
      { x: 2600, y: 350, type: 'fruit' as const, sliced: false, name: '🥑' },
    ] as TargetItem[],
    sliceCount: 0,
    cameraX: 0,
    gravity: 0.38,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      const k = state.knife;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;

      if (!gameOver && !gameWon) {
        if (!k.stuck) {
          k.vy += state.gravity;
          k.x += k.vx;
          k.y += k.vy;
          k.angle += k.angularVel;

          // Camera track
          state.cameraX = k.x - cw * 0.35;

          // Ground hit check
          if (k.y > 440) {
            k.y = 440;
            k.vy = 0;
            k.stuck = true;
          }

          // Slice items
          state.items.forEach(item => {
            if (!item.sliced) {
              const d = Math.hypot(k.x - item.x, k.y - item.y);
              if (d < 35) {
                if (item.type === 'spike') {
                  // Hit spike!
                  setGameOver(true);
                } else {
                  item.sliced = true;
                  state.sliceCount += 1;
                  setSlices(state.sliceCount);

                  // Little bounce upwards upon slicing
                  k.vy = -6;

                  if (state.sliceCount >= 10) {
                    setGameWon(true);
                    const deposit = calculateAndDepositMissionReward({
                      gameId: 'poki_slice_master',
                      gameTitle: 'Slice Master',
                      isVictory: true,
                      score: 100,
                      maxTargetScore: 100,
                      durationSeconds: 30,
                    });
                    setRewardResult(deposit);
                    return;
                  }
                }
              }
            }
          });
        }
      }

      // Drawing
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(-state.cameraX, 0);

      // Floor Table
      ctx.fillStyle = '#27272a';
      ctx.fillRect(-200, 460, 3500, 200);
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-200, 460);
      ctx.lineTo(3300, 460);
      ctx.stroke();

      // Items along track
      state.items.forEach(item => {
        ctx.save();
        ctx.translate(item.x, item.y);

        if (item.sliced) {
          // Halves flying apart
          ctx.font = '22px sans-serif';
          ctx.fillText(item.name, -16, -10);
          ctx.fillText(item.name, 10, 10);
        } else {
          ctx.font = '32px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.name, 0, 0);

          if (item.type === 'spike') {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(0, -22);
            ctx.lineTo(16, 16);
            ctx.lineTo(-16, 16);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();
      });

      // Knife
      ctx.save();
      ctx.translate(k.x, k.y);
      ctx.rotate(k.angle);

      // Blade
      ctx.fillStyle = '#e4e4e7';
      ctx.fillRect(0, -5, 36, 10);
      ctx.beginPath();
      ctx.moveTo(36, -5);
      ctx.lineTo(48, 5);
      ctx.lineTo(36, 5);
      ctx.closePath();
      ctx.fillStyle = '#f4f4f5';
      ctx.fill();

      // Knife Handle with Hero Card
      ctx.fillStyle = '#71717a';
      ctx.fillRect(-18, -6, 18, 12);
      drawCardSprite(ctx, cardId, -32, -14, 28, 28);

      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Tap to Flip Knife
  const handlePointerDown = () => {
    if (gameOver || gameWon) return;
    const k = gameStateRef.current.knife;
    k.stuck = false;
    k.vy = -10.5;
    k.vx = 4.2;
    k.angularVel = 0.16;
  };

  const handleRestart = () => {
    gameStateRef.current = {
      knife: {
        x: 100,
        y: 280,
        vx: 3.5,
        vy: 0,
        angle: 0,
        angularVel: 0.12,
        stuck: false,
      },
      items: gameStateRef.current.items.map(it => ({ ...it, sliced: false })),
      sliceCount: 0,
      cameraX: 0,
      gravity: 0.38,
    };
    setSlices(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#09090b] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointerDown}
    >
      <MinimalistMissionHUD
        title="SLICE MASTER"
        score={slices}
        goalScore={10}
        onBack={onBack}
        unit="SLICES"
      />

      {/* Slice Counter Bar */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-zinc-900/80 border border-zinc-700 px-3 py-1.5 rounded-sm text-xs">
        <span className="font-bold text-amber-400">🔪 SLICES: {slices} / 10 TARGETS</span>
        <span className="text-zinc-300">AVOID 🔺 RED SPIKES</span>
      </div>

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-700 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        화면을 <span className="text-amber-400 font-bold">탭하여 칼날 플립 점프!</span> 과일을 베고 붉은 스파이크를 피하세요.
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ HIT SPIKE ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            날카로운 붉은 스파이크에 칼날이 부딪혔습니다! 점프 타이밍을 조절하세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 슬라이스
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
          rewardAmount={rewardResult?.rewardAmount || 35}
          message="10개의 과일과 음식을 완벽하게 슬라이스하여 마스터 셰프가 되었습니다!"
        />
      )}
    </div>
  );
};

export default PokiSliceMasterGame;
