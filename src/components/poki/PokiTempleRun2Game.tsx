import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiTempleRun2GameProps {
  onBack?: () => void;
  onExit?: () => void;
  onClose?: () => void;
  deck?: any[];
  cardId?: number;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onReward?: (amount: number) => void;
}

interface Obstacle {
  lane: number;
  y: number;
  type: 'log' | 'fire' | 'idol';
  collected?: boolean;
}

export const PokiTempleRun2Game: React.FC<PokiTempleRun2GameProps> = ({
  onBack,
  onExit,
  onClose,
  deck = [],
  cardId,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 36;

  const [dist, setDist] = useState(0);
  const [idols, setIdols] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    lane: 1,
    laneX: [80, 200, 320],
    playerX: 200,
    playerY: 500,
    isJumping: false,
    jumpY: 0,
    jumpVy: 0,
    speed: 300,
    currentDist: 0,
    idolsCollected: 0,
    obstacles: [] as Obstacle[],
    spawnTimer: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokitemplerun2',
      gameTitle: isKo ? 'Temple Run 2 (템플런 2)' : 'Temple Run 2',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const changeLane = useCallback((dir: -1 | 1) => {
    const s = gameState.current;
    const nextLane = Math.max(0, Math.min(2, s.lane + dir));
    if (nextLane !== s.lane) {
      s.lane = nextLane;
      if (navigator.vibrate) navigator.vibrate(15);
    }
  }, []);

  const jump = useCallback(() => {
    const s = gameState.current;
    if (!s.isJumping) {
      s.isJumping = true;
      s.jumpVy = -16;
      if (playSfx) playSfx('/sfx/jump.mp3');
      if (navigator.vibrate) navigator.vibrate(25);
    }
  }, [playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      const w = canvas.width;
      gameState.current.laneX = [w * 0.22, w * 0.5, w * 0.78];
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        s.currentDist += s.speed * dt * 0.12;
        setDist(Math.floor(s.currentDist));

        if (s.currentDist >= 500) {
          handleVictory();
        }

        if (s.isJumping) {
          s.jumpY += s.jumpVy;
          s.jumpVy += 38 * dt;
          if (s.jumpY >= 0) {
            s.jumpY = 0;
            s.isJumping = false;
          }
        }

        const targetX = s.laneX[s.lane];
        s.playerX += (targetX - s.playerX) * 16 * dt;

        s.spawnTimer += dt;
        if (s.spawnTimer > 0.8) {
          s.spawnTimer = 0;
          const l = Math.floor(Math.random() * 3);
          const r = Math.random();
          s.obstacles.push({
            lane: l,
            y: -50,
            type: r < 0.35 ? 'idol' : r < 0.7 ? 'log' : 'fire'
          });
        }

        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const ob = s.obstacles[i];
          ob.y += s.speed * dt;

          if (!ob.collected && Math.abs(ob.y - s.playerY) < 40 && s.lane === ob.lane) {
            if (ob.type === 'idol') {
              ob.collected = true;
              s.idolsCollected++;
              setIdols(s.idolsCollected);
              if (playSfx) playSfx('/sfx/coin.mp3');
              if (navigator.vibrate) navigator.vibrate(15);
            } else if (ob.type === 'log') {
              if (!s.isJumping) {
                s.currentDist = Math.max(0, s.currentDist - 25);
                ob.collected = true;
                if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
              }
            } else if (ob.type === 'fire') {
              s.currentDist = Math.max(0, s.currentDist - 35);
              ob.collected = true;
              if (navigator.vibrate) navigator.vibrate([100, 80, 100]);
            }
          }

          if (ob.y > canvas.height + 60) {
            s.obstacles.splice(i, 1);
          }
        }
      }

      // Render Ancient Temple
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stone path
      ctx.fillStyle = '#44403c';
      ctx.fillRect(canvas.width * 0.08, 0, canvas.width * 0.84, canvas.height);

      // Obstacles
      for (const ob of s.obstacles) {
        if (ob.collected) continue;
        const ox = s.laneX[ob.lane];
        if (ob.type === 'idol') {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(ox, ob.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000';
          ctx.font = '10px monospace';
          ctx.fillText('🗿', ox - 7, ob.y + 4);
        } else if (ob.type === 'log') {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(ox - 30, ob.y - 12, 60, 24);
        } else if (ob.type === 'fire') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(ox, ob.y, 18, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Giant Chasing Demon Monkey behind
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.arc(s.playerX, s.playerY + 70, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(s.playerX - 10, s.playerY + 65, 4, 0, Math.PI * 2);
      ctx.arc(s.playerX + 10, s.playerY + 65, 4, 0, Math.PI * 2);
      ctx.fill();

      // Runner Card Character
      const py = s.playerY + s.jumpY;
      drawCardSprite(ctx, effectiveCardId, s.playerX - 24, py - 24, 48, 48);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory, playSfx]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Temple Run 2 (템플런 2)' : 'Temple Run 2'}
        currentScore={dist}
        targetScore={500}
        onBack={handleExit}
        stageInfo={`${dist}m / 500m | 🗿 ${idols}`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Mobile Touch Navigation */}
      <div className="absolute bottom-6 inset-x-4 flex justify-between gap-3 z-20 pointer-events-none">
        <button
          className="pointer-events-auto flex-1 h-20 bg-stone-800/80 active:bg-amber-600 text-white rounded-2xl border-2 border-stone-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
          onClick={() => changeLane(-1)}
        >
          ◀
        </button>
        <button
          className="pointer-events-auto flex-1 h-20 bg-amber-600/90 active:bg-amber-500 text-white rounded-2xl border-2 border-amber-400 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
          onClick={jump}
        >
          ▲ JUMP
        </button>
        <button
          className="pointer-events-auto flex-1 h-20 bg-stone-800/80 active:bg-amber-600 text-white rounded-2xl border-2 border-stone-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
          onClick={() => changeLane(1)}
        >
          ▶
        </button>
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          reward={rewardReceipt}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};

export default PokiTempleRun2Game;
