import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRealCityBikesGameProps {
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

interface TrafficCar {
  lane: number;
  y: number;
  speed: number;
}

export const PokiRealCityBikesGame: React.FC<PokiRealCityBikesGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 65;

  const [dist, setDist] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    lane: 1, // 0, 1, 2
    laneX: [80, 200, 320],
    playerX: 200,
    py: 480,
    cars: [] as TrafficCar[],
    distance: 0,
    speed: 320,
    spawnTimer: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokirealcitybikes',
      gameTitle: isKo ? '리얼 시티 바이크' : 'Real City Bikes',
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

        // Steer
        const targetX = s.laneX[s.lane];
        s.playerX += (targetX - s.playerX) * 14 * dt;

        // Spawn traffic
        s.spawnTimer += dt;
        if (s.spawnTimer > 0.9) {
          s.spawnTimer = 0;
          s.cars.push({
            lane: Math.floor(Math.random() * 3),
            y: -60,
            speed: 150
          });
        }

        // Update traffic
        for (let i = s.cars.length - 1; i >= 0; i--) {
          const c = s.cars[i];
          c.y += (s.speed - c.speed) * dt;

          // Hit check
          if (Math.abs(c.y - s.py) < 40 && s.lane === c.lane) {
            s.distance = Math.max(0, s.distance - 30);
            s.cars.splice(i, 1);
            if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
            continue;
          }

          if (c.y > canvas.height + 60) {
            s.cars.splice(i, 1);
          }
        }
      }

      // Render City Road
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(canvas.width * 0.08, 0, canvas.width * 0.84, canvas.height);

      // Traffic
      for (const c of s.cars) {
        const cx = s.laneX[c.lane];
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(cx - 20, c.y - 30, 40, 60, 6);
        ctx.fill();
      }

      // Bike Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.playerX - 22, s.py - 30, 44, 44);

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
        gameTitle={isKo ? '리얼 시티 바이크' : 'Real City Bikes'}
        currentScore={dist}
        targetScore={500}
        onBack={handleExit}
        stageInfo={`🏍️ ${dist}m / 500m`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Lane Change Buttons */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-6 z-20">
        <button
          className="flex-1 h-20 bg-slate-800/80 active:bg-amber-600 border-2 border-slate-600 text-white font-bold text-3xl rounded-2xl backdrop-blur-md"
          onClick={() => changeLane(-1)}
        >
          ◀
        </button>
        <button
          className="flex-1 h-20 bg-slate-800/80 active:bg-amber-600 border-2 border-slate-600 text-white font-bold text-3xl rounded-2xl backdrop-blur-md"
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

export default PokiRealCityBikesGame;
