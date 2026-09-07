import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSushiPartyGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Point {
  x: number;
  y: number;
}

interface SushiItem {
  x: number;
  y: number;
  icon: string;
  radius: number;
}

interface Snake {
  id: number;
  body: Point[];
  angle: number;
  speed: number;
  color: string;
  isAi: boolean;
  length: number;
  isDead: boolean;
}

export const PokiSushiPartyGame: React.FC<PokiSushiPartyGameProps> = ({ onBack, cardId = 34 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [length, setLength] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const sushiIcons = ['🍣', '🍱', '🍙', '🥢', '🦐'];

  const gameStateRef = useRef({
    player: {
      id: 0,
      body: [] as Point[],
      angle: 0,
      speed: 3.4,
      color: '#f43f5e',
      isAi: false,
      length: 20,
      isDead: false,
    } as Snake,
    aiSnakes: [
      { id: 1, body: [], angle: Math.PI, speed: 2.8, color: '#38bdf8', isAi: true, length: 25, isDead: false },
      { id: 2, body: [], angle: Math.PI / 2, speed: 2.6, color: '#facc15', isAi: true, length: 22, isDead: false },
    ] as Snake[],
    sushis: [] as SushiItem[],
    targetAngle: 0,
    isBoosting: false,
    camera: { x: 0, y: 0 },
    worldSize: 1800,
  });

  // Init world
  useEffect(() => {
    const state = gameStateRef.current;
    // Player body
    const pb: Point[] = [];
    for (let i = 0; i < 20; i++) {
      pb.push({ x: 900 - i * 8, y: 900 });
    }
    state.player.body = pb;

    // AI bodies
    state.aiSnakes.forEach((ai, idx) => {
      const ab: Point[] = [];
      const startX = 600 + idx * 600;
      const startY = 600 + idx * 500;
      for (let i = 0; i < 25; i++) {
        ab.push({ x: startX + i * 8, y: startY });
      }
      ai.body = ab;
    });

    // Sushis
    const sList: SushiItem[] = [];
    for (let i = 0; i < 70; i++) {
      sList.push({
        x: 100 + Math.random() * 1600,
        y: 100 + Math.random() * 1600,
        icon: sushiIcons[Math.floor(Math.random() * sushiIcons.length)],
        radius: 12,
      });
    }
    state.sushis = sList;
  }, []);

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

      if (!gameOver && !gameWon) {
        // Player turn to target angle
        let angleDiff = state.targetAngle - p.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        p.angle += angleDiff * 0.12;

        const currentSpeed = state.isBoosting ? p.speed * 1.6 : p.speed;
        const head = p.body[0];
        const newHead = {
          x: head.x + Math.cos(p.angle) * currentSpeed,
          y: head.y + Math.sin(p.angle) * currentSpeed,
        };

        // World boundary clamp
        if (newHead.x < 50 || newHead.x > state.worldSize - 50 || newHead.y < 50 || newHead.y > state.worldSize - 50) {
          setGameOver(true);
        }

        p.body.unshift(newHead);
        while (p.body.length > p.length) {
          p.body.pop();
        }

        // Camera follow
        state.camera.x = newHead.x - cw / 2;
        state.camera.y = newHead.y - ch / 2;

        // AI behavior
        state.aiSnakes.forEach(ai => {
          if (ai.isDead) return;
          if (Math.random() < 0.03) {
            ai.angle += (Math.random() - 0.5) * 1.2;
          }
          const aiHead = ai.body[0];
          const nextAiHead = {
            x: aiHead.x + Math.cos(ai.angle) * ai.speed,
            y: aiHead.y + Math.sin(ai.angle) * ai.speed,
          };
          // Bounce off world
          if (nextAiHead.x < 100 || nextAiHead.x > state.worldSize - 100) ai.angle = Math.PI - ai.angle;
          if (nextAiHead.y < 100 || nextAiHead.y > state.worldSize - 100) ai.angle = -ai.angle;

          ai.body.unshift(nextAiHead);
          while (ai.body.length > ai.length) {
            ai.body.pop();
          }

          // Check if AI hits player body
          for (let i = 4; i < p.body.length; i++) {
            if (Math.hypot(nextAiHead.x - p.body[i].x, nextAiHead.y - p.body[i].y) < 16) {
              ai.isDead = true;
              // Drop sushis
              for (let s = 0; s < 12; s++) {
                state.sushis.push({
                  x: nextAiHead.x + (Math.random() - 0.5) * 80,
                  y: nextAiHead.y + (Math.random() - 0.5) * 80,
                  icon: '🍣',
                  radius: 12,
                });
              }
              break;
            }
          }

          // Check if player hits AI body
          for (let i = 0; i < ai.body.length; i++) {
            if (Math.hypot(newHead.x - ai.body[i].x, newHead.y - ai.body[i].y) < 16) {
              setGameOver(true);
            }
          }
        });

        // Eat Sushis
        for (let i = state.sushis.length - 1; i >= 0; i--) {
          const s = state.sushis[i];
          if (Math.hypot(newHead.x - s.x, newHead.y - s.y) < 22) {
            state.sushis.splice(i, 1);
            p.length += 3;
            setLength(p.length);

            // Win at length 100
            if (p.length >= 80) {
              setGameWon(true);
              const deposit = calculateAndDepositMissionReward({
                gameId: 'poki_sushi_party',
                gameTitle: 'Sushi Party',
                isVictory: true,
                score: 100,
                maxTargetScore: 100,
                durationSeconds: 35,
              });
              setRewardResult(deposit);
              return;
            }

            // Spawn new sushi elsewhere
            state.sushis.push({
              x: 100 + Math.random() * 1600,
              y: 100 + Math.random() * 1600,
              icon: sushiIcons[Math.floor(Math.random() * sushiIcons.length)],
              radius: 12,
            });
          }
        }
      }

      // Render
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(-state.camera.x, -state.camera.y);

      // Tatami World Grid
      ctx.fillStyle = '#2e1065';
      ctx.fillRect(40, 40, state.worldSize - 80, state.worldSize - 80);
      ctx.strokeStyle = '#4c1d95';
      ctx.lineWidth = 1;
      for (let x = 40; x < state.worldSize; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, state.worldSize - 40);
        ctx.stroke();
      }
      for (let y = 40; y < state.worldSize; y += 60) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(state.worldSize - 40, y);
        ctx.stroke();
      }

      // Draw Sushis
      state.sushis.forEach(s => {
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.icon, s.x, s.y);
      });

      // Draw AI Snakes
      state.aiSnakes.forEach(ai => {
        if (ai.isDead) return;
        ctx.fillStyle = ai.color;
        ai.body.forEach(seg => {
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, 10, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Draw Player Sushi Snake
      ctx.fillStyle = p.color;
      p.body.forEach((seg, idx) => {
        if (idx === 0) {
          // Head Hero Card
          drawCardSprite(ctx, cardId, seg.x - 14, seg.y - 14, 28, 28);
        } else {
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, Math.max(6, 12 - idx * 0.05), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Touch Pointer steering
  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const cw = canvas.width;
    const ch = canvas.height;
    gameStateRef.current.targetAngle = Math.atan2(touchY - ch / 2, touchX - cw / 2);
  };

  const handleRestart = () => {
    gameStateRef.current.player.body = [];
    const pb: Point[] = [];
    for (let i = 0; i < 20; i++) {
      pb.push({ x: 900 - i * 8, y: 900 });
    }
    gameStateRef.current.player.body = pb;
    gameStateRef.current.player.length = 20;
    setLength(20);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#1e1b4b] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointer}
      onPointerMove={e => e.buttons === 1 && handlePointer(e)}
    >
      <MinimalistMissionHUD
        title="SUSHI PARTY"
        score={length}
        goalScore={80}
        onBack={onBack}
        unit="LENGTH"
      />

      {/* Length Progress Bar */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-purple-950/80 border border-purple-800 px-3 py-1.5 rounded-sm text-xs">
        <span className="font-bold text-pink-400">🍣 SUSHI LENGTH: {length} / 80</span>
        <span className="text-purple-200">EAT SUSHIS & TRAP AI FOES</span>
      </div>

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-purple-200 bg-purple-950/90 border border-purple-800 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        화면을 탭/드래그하여 <span className="text-pink-400 font-bold">스시 뱀을 조종</span>하고 초밥을 먹어 몸집을 키우세요!
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ SQUASHED ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            다른 스네이크의 몸체 또는 벽에 부딪혔습니다! 궤적을 넓게 돌아보세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 스시 먹방
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
          message="초밥 파티의 초대형 스시 드래곤으로 등극하여 승리했습니다!"
        />
      )}
    </div>
  );
};

export default PokiSushiPartyGame;
