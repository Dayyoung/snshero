import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMrRacerGameProps {
  onBack: () => void;
}

interface TrafficCar {
  id: number;
  lane: number; // 0, 1, 2, 3
  y: number; // Screen Y
  speed: number;
  color: string;
}

export const PokiMrRacerGame: React.FC<PokiMrRacerGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'racing' | 'crashed' | 'victory'>('ready');
  const [distance, setDistance] = useState(0); // in meters, 0 to 1500
  const [isNitro, setIsNitro] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const LANES = [80, 160, 240, 320]; // 4 lanes center X

  const stateRef = useRef({
    playerX: 200,
    targetX: 200,
    distanceMeters: 0,
    nitroFuel: 100,
    traffic: [] as TrafficCar[],
    roadOffset: 0,
  });

  const initRace = useCallback(() => {
    stateRef.current.playerX = 200;
    stateRef.current.targetX = 200;
    stateRef.current.distanceMeters = 0;
    stateRef.current.nitroFuel = 100;
    stateRef.current.roadOffset = 0;

    // Spawn 5 traffic cars ahead
    const cars: TrafficCar[] = [];
    for (let i = 0; i < 5; i++) {
      cars.push({
        id: i + 1,
        lane: Math.floor(Math.random() * 4),
        y: -100 - i * 150,
        speed: 3 + Math.random() * 2,
        color: ['#38bdf8', '#f59e0b', '#10b981', '#a855f7'][i % 4],
      });
    }
    stateRef.current.traffic = cars;
    setDistance(0);
    setIsNitro(false);
  }, []);

  const handleStart = () => {
    initRace();
    setGameState('racing');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimrracer',
      gameTitle: 'MR RACER: High-Speed Highway',
      isVictory: true,
      score: 1500,
      maxTargetScore: 1500,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const { traffic } = stateRef.current;

      ctx.clearRect(0, 0, width, height);

      // Asphalt Highway (4 Lanes)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(40, 0, 320, height);

      // Highway Guardrails
      ctx.fillStyle = '#475569';
      ctx.fillRect(32, 0, 8, height);
      ctx.fillRect(360, 0, 8, height);

      // Outer Grass / Desert
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 32, height);
      ctx.fillRect(368, 0, width - 368, height);

      // Moving Lane Stripes
      const speedMultiplier = isNitro ? 2.2 : 1.2;
      stateRef.current.roadOffset = (stateRef.current.roadOffset + 12 * speedMultiplier) % 40;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.setLineDash([16, 24]);

      [120, 200, 280].forEach((lx) => {
        ctx.beginPath();
        ctx.moveTo(lx, -40 + stateRef.current.roadOffset);
        ctx.lineTo(lx, height + 40);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      if (gameState === 'racing') {
        // Distance progress
        stateRef.current.distanceMeters += 2.2 * speedMultiplier;
        const currentDist = Math.min(1500, Math.floor(stateRef.current.distanceMeters));
        setDistance(currentDist);

        if (currentDist >= 1500) {
          handleVictory();
          return;
        }

        // Smooth player car movement
        stateRef.current.playerX += (stateRef.current.targetX - stateRef.current.playerX) * 0.15;
        stateRef.current.playerX = Math.max(60, Math.min(340, stateRef.current.playerX));

        // Nitro Fuel handling
        if (isNitro) {
          stateRef.current.nitroFuel = Math.max(0, stateRef.current.nitroFuel - 0.4);
          if (stateRef.current.nitroFuel <= 0) {
            setIsNitro(false);
          }
        }

        // Traffic AI & Spawning
        traffic.forEach((car) => {
          car.y += (10 * speedMultiplier - car.speed * 1.2);

          // Recycle car if it goes past the bottom
          if (car.y > height + 80) {
            car.y = -120 - Math.random() * 100;
            car.lane = Math.floor(Math.random() * 4);
            car.speed = 3 + Math.random() * 2;
          }

          // Collision Detection with Player Car (Player is at y: 480, w: 36, h: 64)
          const carX = LANES[car.lane];
          const px = stateRef.current.playerX;
          const py = 480;

          if (
            Math.abs(px - carX) < 32 &&
            Math.abs(py - car.y) < 56
          ) {
            setGameState('crashed');
          }
        });
      }

      // Draw Traffic Cars
      traffic.forEach((car) => {
        const cx = LANES[car.lane];
        ctx.fillStyle = car.color;
        ctx.fillRect(cx - 16, car.y - 28, 32, 56);

        // Windows & Headlights
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 12, car.y - 12, 24, 20);
        ctx.fillStyle = '#ef4444'; // Taillights
        ctx.fillRect(cx - 14, car.y + 24, 8, 4);
        ctx.fillRect(cx + 6, car.y + 24, 8, 4);
      });

      // Draw Player Sports Car (Card #86)
      const px = stateRef.current.playerX;
      const py = 480;

      // Nitro Flame Thrusters
      if (isNitro) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(px - 10, py + 32);
        ctx.lineTo(px, py + 55 + Math.random() * 15);
        ctx.lineTo(px + 10, py + 32);
        ctx.fill();
      }

      drawCardSprite(ctx, 86, px - 18, py - 32, 36, 64);

      // HUD Speedometer overlay
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(50, 15, 140, 24);
      ctx.fillStyle = isNitro ? '#38bdf8' : '#22c55e';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`SPEED: ${isNitro ? '280' : '190'} KM/H`, 58, 31);

      // Distance Progress Bar
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(width - 150, 15, 100, 12);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(width - 150, 15, 100 * (distance / 1500), 12);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, distance, isNitro, handleVictory]);

  // Touch steer
  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    const tx = ((t.clientX - rect.left) / rect.width) * 400;
    stateRef.current.targetX = tx;
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#0f172a] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="MR RACER - Car Racing"
        missionTarget="1,500m 고속도로 무사고 질주"
        currentScore={distance}
        maxScore={1500}
        scoreUnit="m"
        onBack={onBack}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="w-full h-full object-contain rounded border border-white/20 bg-slate-900 touch-none shadow-2xl"
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          onMouseDown={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            stateRef.current.targetX = ((e.clientX - rect.left) / rect.width) * 400;
          }}
          onMouseMove={(e) => {
            if (e.buttons > 0) {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              stateRef.current.targetX = ((e.clientX - rect.left) / rect.width) * 400;
            }
          }}
        />

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-sky-400 mb-2">[ MR RACER ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              복잡한 고속도로에서 차량들을 추월하며 전속력으로 질주하세요!<br />
              1. <b>화면 좌우 터치/드래그</b>로 4개 차선을 오가며 차량을 피합니다.<br />
              2. 하단 <b>[NITRO BOOST]</b> 버튼을 탭해 시속 280km/h로 질주하세요!<br />
              3. 1,500m를 무사고로 완주하면 레이서 트로피 수여!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              레이스 스타트 [RACE]
            </button>
          </div>
        )}

        {gameState === 'crashed' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-rose-500 mb-2">💥 [ 충돌 사고 발생 ]</h2>
            <p className="text-sm text-slate-300 mb-4">도달 거리: {distance}m / 1,500m</p>
            <button
              onClick={handleStart}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-sm active:scale-95 transition-all"
            >
              다시 도전
            </button>
          </div>
        )}

        {gameState === 'victory' && rewardReceipt && (
          <VictoryRewardModal
            receipt={rewardReceipt}
            language="ko"
            onPlayAgain={handleStart}
            onExit={onBack}
          />
        )}
      </div>

      {/* Nitro Boost Action Controls */}
      {gameState === 'racing' && (
        <div className="w-full max-w-md p-3 bg-slate-950/95 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex-1">
            터치 드래그로 차선 변경
          </div>
          <button
            onClick={() => setIsNitro(!isNitro)}
            className={`py-3 px-6 font-black rounded-sm text-sm active:scale-95 transition-all shadow ${
              isNitro
                ? 'bg-sky-400 text-slate-950 ring-2 ring-white animate-pulse'
                : 'bg-slate-800 text-sky-400 hover:bg-slate-700'
            }`}
          >
            ⚡ NITRO BOOST (280 KM/H)
          </button>
        </div>
      )}
    </div>
  );
};
export default PokiMrRacerGame;
