import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiHillClimbRacingLiteGameProps {
  onBack: () => void;
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

export const PokiHillClimbRacingLiteGame: React.FC<PokiHillClimbRacingLiteGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'racing' | 'flipped' | 'victory'>('ready');
  const [distance, setDistance] = useState(0); // in meters, 0 to 300
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    car: {
      x: 60,
      y: 350,
      vx: 0,
      vy: 0,
      angle: 0, // rad
      angVel: 0,
      isGrounded: true,
    },
    cameraX: 0,
    gasPressed: false,
    brakePressed: false,
    coins: [] as Coin[],
  });

  // Terrain height function: y = f(x)
  const getGroundY = (x: number) => {
    return 420 - Math.sin(x * 0.008) * 60 - Math.cos(x * 0.02) * 25;
  };

  const getGroundSlope = (x: number) => {
    const delta = 5;
    const y1 = getGroundY(x - delta);
    const y2 = getGroundY(x + delta);
    return Math.atan2(y2 - y1, delta * 2);
  };

  const initGame = useCallback(() => {
    stateRef.current.car = {
      x: 60,
      y: getGroundY(60) - 20,
      vx: 0,
      vy: 0,
      angle: 0,
      angVel: 0,
      isGrounded: true,
    };
    stateRef.current.cameraX = 0;
    stateRef.current.gasPressed = false;
    stateRef.current.brakePressed = false;

    // Coins placed along the 300m track (~2400px)
    const cList: Coin[] = [];
    for (let cx = 300; cx <= 2400; cx += 400) {
      cList.push({
        x: cx,
        y: getGroundY(cx) - 40,
        collected: false,
      });
    }
    stateRef.current.coins = cList;
    setDistance(0);
    setCoinsCollected(0);
  }, []);

  const handleStart = () => {
    initGame();
    setGameState('racing');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokihillclimbracinglite',
      gameTitle: 'Hill Climb Racing Lite',
      isVictory: true,
      score: 300,
      maxTargetScore: 300,
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
      const { car, coins, gasPressed, brakePressed } = stateRef.current;

      ctx.clearRect(0, 0, width, height);

      // Sunny Countryside Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.7, '#bae6fd');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant Hills (Parallax)
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 20) {
        const hx = x + stateRef.current.cameraX * 0.2;
        const hy = 320 - Math.sin(hx * 0.004) * 40;
        ctx.lineTo(x, hy);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      if (gameState === 'racing') {
        // Physics
        const groundY = getGroundY(car.x);
        const groundSlope = getGroundSlope(car.x);

        // Gravity
        car.vy += 0.45;

        // Engine Gas & Brake forces
        if (gasPressed) {
          if (car.isGrounded) {
            car.vx += Math.cos(groundSlope) * 0.4;
            car.vy += Math.sin(groundSlope) * 0.4;
          } else {
            // Air tilt back
            car.angVel -= 0.015;
          }
        }

        if (brakePressed) {
          if (car.isGrounded) {
            car.vx -= Math.cos(groundSlope) * 0.35;
          } else {
            // Air tilt forward
            car.angVel += 0.015;
          }
        }

        // Friction & damping
        car.vx *= 0.96;
        car.angVel *= 0.92;

        car.x += car.vx;
        car.y += car.vy;
        car.angle += car.angVel;

        // Ground Collision Check
        if (car.y >= groundY - 18) {
          car.y = groundY - 18;
          car.vy = 0;
          car.isGrounded = true;

          // Align car angle to slope smoothly
          const angleDiff = groundSlope - car.angle;
          car.angle += angleDiff * 0.2;

          // Check rollover crash (angle > 100 deg)
          if (Math.abs(car.angle) > 1.8) {
            setGameState('flipped');
          }
        } else {
          car.isGrounded = false;
        }

        // Coins Check
        coins.forEach((c) => {
          if (!c.collected) {
            const dist = Math.hypot(car.x - c.x, car.y - c.y);
            if (dist < 36) {
              c.collected = true;
              setCoinsCollected((prev) => prev + 1);
            }
          }
        });

        // Camera follow
        stateRef.current.cameraX = car.x - 100;

        // Current distance in meters (0 to 300m)
        const curMeters = Math.min(300, Math.floor(car.x / 8));
        setDistance(curMeters);

        if (curMeters >= 300) {
          handleVictory();
          return;
        }
      }

      // Draw Terrain Ground
      const camX = stateRef.current.cameraX;
      ctx.fillStyle = '#854d0e'; // Dirt ground
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let sx = -20; sx <= width + 20; sx += 10) {
        const wx = sx + camX;
        const gy = getGroundY(wx);
        ctx.lineTo(sx, gy);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // Lush Grass Cap
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 10;
      ctx.beginPath();
      for (let sx = -20; sx <= width + 20; sx += 10) {
        const wx = sx + camX;
        const gy = getGroundY(wx);
        if (sx === -20) ctx.moveTo(sx, gy);
        else ctx.lineTo(sx, gy);
      }
      ctx.stroke();

      // Draw Coins
      coins.forEach((c) => {
        if (!c.collected) {
          const csx = c.x - camX;
          if (csx > -30 && csx < width + 30) {
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.arc(csx, c.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('$', csx, c.y + 3);
          }
        }
      });

      // Draw Jeep Car (Card #88 Hero)
      const carSX = car.x - camX;
      const carSY = car.y;

      ctx.save();
      ctx.translate(carSX, carSY);
      ctx.rotate(car.angle);

      // Chassis
      drawCardSprite(ctx, 88, -26, -24, 52, 34);

      // Wheels
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-16, 10, 9, 0, Math.PI * 2);
      ctx.arc(16, 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(-16, 10, 4, 0, Math.PI * 2);
      ctx.arc(16, 10, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Progress Meter
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(width - 140, 20, 110, 10);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(width - 140, 20, 110 * (distance / 300), 10);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, distance, handleVictory]);

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#0c4a6e] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Hill Climb Racing Lite"
        missionTarget="전복 없이 300m 언덕 완주"
        currentScore={distance}
        maxScore={300}
        scoreUnit="m"
        onBack={onBack}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="w-full h-full object-contain rounded border border-white/20 bg-sky-900 touch-none shadow-2xl"
        />

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-amber-400 mb-2">[ Hill Climb Racing ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              험준한 오프로드 언덕길을 지프차로 주파하세요!<br />
              1. <b>[가속(GAS)]</b> 버튼으로 언덕을 치고 올라갑니다.<br />
              2. 공중에서 <b>[브레이크]</b>와 <b>[가속]</b>으로 차량 균형을 맞추세요.<br />
              3. 차가 뒤집히지 않고 <b>300m 정상</b>에 도달하면 클리어!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              드라이빙 시작 [START]
            </button>
          </div>
        )}

        {gameState === 'flipped' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-rose-500 mb-2">🚗💥 [ 차량 전복 사고! ]</h2>
            <p className="text-sm text-slate-300 mb-4">도달 거리: {distance}m / 300m</p>
            <button
              onClick={handleStart}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-sm active:scale-95 transition-all"
            >
              다시 주행하기
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

      {/* Gas & Brake Pedal Controls */}
      {gameState === 'racing' && (
        <div className="w-full max-w-md p-3 bg-slate-950/95 border-t border-white/10 flex items-center justify-between gap-4">
          <button
            onTouchStart={() => (stateRef.current.brakePressed = true)}
            onTouchEnd={() => (stateRef.current.brakePressed = false)}
            onMouseDown={() => (stateRef.current.brakePressed = true)}
            onMouseUp={() => (stateRef.current.brakePressed = false)}
            className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded text-sm active:scale-95 transition-all shadow select-none"
          >
            🛑 BRAKE / TILT
          </button>
          <div className="text-xs text-amber-400 font-bold">
            🪙 코인: {coinsCollected}
          </div>
          <button
            onTouchStart={() => (stateRef.current.gasPressed = true)}
            onTouchEnd={() => (stateRef.current.gasPressed = false)}
            onMouseDown={() => (stateRef.current.gasPressed = true)}
            onMouseUp={() => (stateRef.current.gasPressed = false)}
            className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded text-sm active:scale-95 transition-all shadow select-none"
          >
            🚀 GAS (가속)
          </button>
        </div>
      )}
    </div>
  );
};
export default PokiHillClimbRacingLiteGame;
