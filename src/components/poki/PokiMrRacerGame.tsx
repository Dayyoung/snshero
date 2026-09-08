import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMrRacerGameProps {
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

export const PokiMrRacerGame: React.FC<PokiMrRacerGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 86;

  const [dist, setDist] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    lane: 1,
    laneX: [80, 200, 320],
    playerX: 200,
    py: 480,
    speed: 340,
    distance: 0,
    traffic: [] as { lane: number; y: number }[],
    spawnTimer: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimrracer',
      gameTitle: isKo ? '미스터 레이서' : 'MR RACER',
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
    const next = Math.max(0, Math.min(2, s.lane + dir));
    if (next !== s.lane) {
      s.lane = next;
      if (navigator.vibrate) navigator.vibrate(15);
    }
  }, []);

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
        s.distance += s.speed * dt * 0.12;
        setDist(Math.floor(s.distance));

        if (s.distance >= 500) {
          handleVictory();
        }

        const targetX = s.laneX[s.lane];
        s.playerX += (targetX - s.playerX) * 15 * dt;

        // Spawn traffic
        s.spawnTimer += dt;
        if (s.spawnTimer > 0.8) {
          s.spawnTimer = 0;
          s.traffic.push({
            lane: Math.floor(Math.random() * 3),
            y: -60
          });
        }

        // Update traffic
        for (let i = s.traffic.length - 1; i >= 0; i--) {
          const t = s.traffic[i];
          t.y += 200 * dt;

          if (Math.abs(t.y - s.py) < 45 && s.lane === t.lane) {
            s.distance = Math.max(0, s.distance - 25);
            s.traffic.splice(i, 1);
            if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
            continue;
          }

          if (t.y > canvas.height + 60) {
            s.traffic.splice(i, 1);
          }
        }
      }

      // Render Highway
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(canvas.width * 0.08, 0, canvas.width * 0.84, canvas.height);

      // Traffic Cars
      for (const t of s.traffic) {
        const tx = s.laneX[t.lane];
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(tx - 20, t.y - 35, 40, 70, 6);
        ctx.fill();
      }

      // Racer Car
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(s.playerX - 22, s.py - 35, 44, 70, 8);
      ctx.fill();

      // Card Driver Sprite
      drawCardSprite(ctx, effectiveCardId, s.playerX - 16, s.py - 20, 32, 32);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '미스터 레이서' : 'MR RACER'}
        currentScore={dist}
        targetScore={500}
        onBack={handleExit}
        stageInfo={`🏎️ ${dist}m / 500m`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Steer Touch Buttons */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-6 z-20">
        <button
          className="flex-1 h-20 bg-slate-800/80 active:bg-cyan-600 border-2 border-slate-600 text-white font-bold text-3xl rounded-2xl backdrop-blur-md"
          onClick={() => changeLane(-1)}
        >
          ◀
        </button>
        <button
          className="flex-1 h-20 bg-slate-800/80 active:bg-cyan-600 border-2 border-slate-600 text-white font-bold text-3xl rounded-2xl backdrop-blur-md"
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

export default PokiMrRacerGame;
