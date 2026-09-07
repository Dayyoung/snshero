import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRealCityBikesGameProps {
  onClose: () => void;
}

interface TrafficCar {
  id: number;
  lane: number;
  y: number;
  speed: number;
  color: string;
  width: number;
  height: number;
  nearMissed: boolean;
}

export default function PokiRealCityBikesGame({ onClose }: PokiRealCityBikesGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [distance, setDistance] = useState(0);
  const [nearMissCount, setNearMissCount] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(120);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const TARGET_DIST = 2000; // 2000 meters
  const REQUIRED_NEAR_MISS = 5;

  const stateRef = useRef<{
    playerLane: number; // 0 to 3
    playerX: number;
    playerY: number;
    speed: number; // world speed
    isNitro: boolean;
    traffic: TrafficCar[];
    nextCarId: number;
    traveledDist: number;
    nearMisses: number;
    touchStartX: number | null;
  }>({
    playerLane: 1,
    playerX: 0,
    playerY: 0,
    speed: 8,
    isNitro: false,
    traffic: [],
    nextCarId: 1,
    traveledDist: 0,
    nearMisses: 0,
    touchStartX: null
  });

  const playSound = (type: 'near' | 'nitro' | 'crash' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'near') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'nitro') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.12);
        osc.frequency.setValueAtTime(784, now + 0.24);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {}
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      stateRef.current.playerY = canvas.height * 0.78;
    };
    resize();
    window.addEventListener('resize', resize);

    let spawnTimer = 0;
    let roadStripeOffset = 0;

    const loop = () => {
      const s = stateRef.current;

      // Calculate Lane Positions
      const roadWidth = Math.min(canvas.width * 0.9, 360);
      const roadLeft = (canvas.width - roadWidth) / 2;
      const laneWidth = roadWidth / 4;

      // Smooth move player to target lane
      const targetPlayerX = roadLeft + s.playerLane * laneWidth + laneWidth / 2;
      s.playerX += (targetPlayerX - s.playerX) * 0.25;

      // Speed & Distance
      const baseSpd = s.isNitro ? 16 : 9;
      s.speed += (baseSpd - s.speed) * 0.1;
      setSpeedKmh(Math.floor(s.speed * 16));

      s.traveledDist += s.speed * 0.25;
      setDistance(Math.floor(s.traveledDist));

      roadStripeOffset = (roadStripeOffset + s.speed) % 40;

      // Spawn Traffic Cars
      spawnTimer++;
      if (spawnTimer > 35 && s.traffic.length < 5) {
        spawnTimer = 0;
        const lane = Math.floor(Math.random() * 4);
        const colors = ['#ef4444', '#eab308', '#10b981', '#a855f7', '#06b6d4'];
        s.traffic.push({
          id: s.nextCarId++,
          lane,
          y: -80,
          speed: Math.random() * 3 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          width: laneWidth * 0.65,
          height: 54,
          nearMissed: false
        });
      }

      // Update Traffic & Near Miss / Collision
      for (let i = s.traffic.length - 1; i >= 0; i--) {
        const car = s.traffic[i];
        car.y += s.speed - car.speed;

        const carX = roadLeft + car.lane * laneWidth + laneWidth / 2;

        // Collision Check
        const dx = Math.abs(s.playerX - carX);
        const dy = Math.abs(s.playerY - car.y);

        if (dx < car.width * 0.48 && dy < 36) {
          // Crash!
          setGameOver(true);
          playSound('crash');
          return;
        }

        // Near Miss Check (very close in X, crossing in Y)
        if (!car.nearMissed && dx < car.width * 0.85 && dx >= car.width * 0.48 && dy < 32) {
          car.nearMissed = true;
          s.nearMisses++;
          setNearMissCount(s.nearMisses);
          playSound('near');
        }

        // Out of screen bottom
        if (car.y > canvas.height + 100) {
          s.traffic.splice(i, 1);
        }
      }

      // Check Win
      if (s.traveledDist >= TARGET_DIST && s.nearMisses >= REQUIRED_NEAR_MISS && !gameWon) {
        setGameWon(true);
        playSound('win');
        const deposit = calculateAndDepositMissionReward({
          gameId: 'pokirealcitybikes',
          gameTitle: 'Real City Bikes',
          isVictory: true,
          score: 1000,
          maxTargetScore: 1000,
          durationSeconds: 30
        });
        setRewardResult(deposit);
      }

      // RENDER
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Road
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(roadLeft, 0, roadWidth, canvas.height);

      // Road Edges
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(roadLeft - 6, 0, 6, canvas.height);
      ctx.fillRect(roadLeft + roadWidth, 0, 6, canvas.height);

      // Lane Dash Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -roadStripeOffset;

      for (let l = 1; l < 4; l++) {
        const lx = roadLeft + l * laneWidth;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, canvas.height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw Traffic Cars
      s.traffic.forEach((car) => {
        const cx = roadLeft + car.lane * laneWidth + laneWidth / 2;
        ctx.save();
        ctx.fillStyle = car.color;
        ctx.fillRect(cx - car.width / 2, car.y - car.height / 2, car.width, car.height);
        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - car.width * 0.35, car.y - car.height * 0.3, car.width * 0.7, 12);
        // Taillights
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - car.width * 0.4, car.y + car.height * 0.4, 6, 4);
        ctx.fillRect(cx + car.width * 0.4 - 6, car.y + car.height * 0.4, 6, 4);
        ctx.restore();
      });

      // Draw Bike Flame Exhaust if Nitro
      if (s.isNitro) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(s.playerX - 6, s.playerY + 24);
        ctx.lineTo(s.playerX + 6, s.playerY + 24);
        ctx.lineTo(s.playerX, s.playerY + 44 + Math.random() * 10);
        ctx.fill();
      }

      // Draw Player Bike & Card Sprite
      drawCardSprite(ctx, 65, s.playerX - 18, s.playerY - 22, 36, 36);

      // Bike Body Frame
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(s.playerX - 6, s.playerY - 14, 12, 28);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(s.playerX - 10, s.playerY - 4, 20, 6); // Handlebars

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Touch Swipe Controls
    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      stateRef.current.touchStartX = t.clientX;
      stateRef.current.isNitro = true;
      playSound('nitro');
    };

    const handleTouchMove = (e: TouchEvent) => {
      const startX = stateRef.current.touchStartX;
      if (startX === null) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;

      if (Math.abs(dx) > 35) {
        if (dx > 0 && stateRef.current.playerLane < 3) {
          stateRef.current.playerLane++;
        } else if (dx < 0 && stateRef.current.playerLane > 0) {
          stateRef.current.playerLane--;
        }
        stateRef.current.touchStartX = t.clientX;
      }
    };

    const handleTouchEnd = () => {
      stateRef.current.touchStartX = null;
      stateRef.current.isNitro = false;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameWon]);

  return (
    <div className="relative w-full h-full bg-zinc-950 flex flex-col select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Real City Bikes"
        missionTarget={`2,000m 완주 & 니어미스 ${REQUIRED_NEAR_MISS}회`}
        currentProgress={`${distance}m / 2,000m | 니어미스: ${nearMissCount} / ${REQUIRED_NEAR_MISS}`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Speedometer & Guide HUD */}
        <div className="absolute top-2 left-4 bg-zinc-900/80 border border-zinc-700 px-3 py-1.5 rounded-sm">
          <div className="text-sky-400 font-bold text-sm">{speedKmh} KM/H</div>
          <div className="text-[10px] text-zinc-400">화면 터치: 니트로 가속</div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-zinc-900/80 text-zinc-400 border border-zinc-700 px-3 py-1 text-[11px] rounded-sm">
            좌우 스와이프: 차선 변경 | 길게 누르기: 부스터
          </span>
        </div>

        {/* Game Over Modal */}
        {gameOver && !gameWon && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-none text-center max-w-sm">
              <h2 className="text-xl font-bold text-red-400 mb-2">차량 추돌 충돌!</h2>
              <p className="text-xs text-zinc-400 mb-4">도로 위의 차량과 충돌하여 바이크가 전복되었습니다.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-sm"
                >
                  다시 도전
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-sm border border-zinc-700"
                >
                  나가기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {gameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          rewardSNS={rewardResult.rewardSNS}
          gameTitle="Real City Bikes"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
