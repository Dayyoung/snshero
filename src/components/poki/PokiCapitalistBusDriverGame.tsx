import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCapitalistBusDriverGameProps {
  onBack: () => void;
}

const TARGET_PASSENGERS = 20;

interface TrafficObstacle {
  x: number;
  y: number;
  lane: number;
  speed: number;
  color: string;
}

interface BusStop {
  y: number;
  passengers: number;
  visited: boolean;
}

export const PokiCapitalistBusDriverGame: React.FC<PokiCapitalistBusDriverGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [passengersDelivered, setPassengersDelivered] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    busLane: number; // 0, 1, 2
    busY: number;
    busSpeed: number;
    passengersOnboard: number;
    totalDelivered: number;
    revenue: number;
    distance: number;
    gameWon: boolean;
    obstacles: TrafficObstacle[];
    busStops: BusStop[];
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    busLane: 1, // center lane
    busY: 420,
    busSpeed: 4.0,
    passengersOnboard: 0,
    totalDelivered: 0,
    revenue: 0,
    distance: 0,
    gameWon: false,
    obstacles: [
      { x: 130, y: -100, lane: 0, speed: 2.5, color: '#ef4444' },
      { x: 200, y: -300, lane: 1, speed: 2.0, color: '#3b82f6' },
      { x: 270, y: -500, lane: 2, speed: 2.8, color: '#10b981' },
    ],
    busStops: [
      { y: -200, passengers: 5, visited: false },
      { y: -700, passengers: 8, visited: false },
      { y: -1200, passengers: 7, visited: false },
    ],
    particles: [],
  });

  const changeLane = (dir: 'left' | 'right') => {
    const st = stateRef.current;
    if (st.gameWon) return;
    if (dir === 'left' && st.busLane > 0) st.busLane -= 1;
    if (dir === 'right' && st.busLane < 2) st.busLane += 1;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const st = stateRef.current;

      // Background Asphalt Road
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, w, h);

      // Sidewalks
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 0, 70, h);
      ctx.fillRect(w - 70, 0, 70, h);

      // Lane dividers
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 12]);
      const laneWidth = (w - 140) / 3;

      for (let i = 1; i <= 2; i++) {
        const lx = 70 + i * laneWidth;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, h);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 96, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('CAPITALIST BUS // 시내버스 사업가', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`승객 탑승: ${st.passengersOnboard}명 | 수송 완료: ${st.totalDelivered}/${TARGET_PASSENGERS} ($${st.revenue})`, 84, 56);

      st.distance += st.busSpeed;

      // Move Bus Stops down
      st.busStops.forEach((stop) => {
        stop.y += st.busSpeed;

        // Draw Bus Stop Shelter on Right sidewalk
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(w - 65, stop.y, 60, 30);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`정류장 +${stop.passengers}`, w - 62, stop.y + 18);

        // Check Passenger Pickup when bus is in lane 2 (rightmost lane) near stop
        if (!stop.visited && Math.abs(stop.y - st.busY) < 40 && st.busLane === 2) {
          stop.visited = true;
          st.passengersOnboard += stop.passengers;

          // Pickup particles
          for (let i = 0; i < 15; i++) {
            st.particles.push({
              x: w - 70,
              y: st.busY,
              vx: -Math.random() * 4,
              vy: (Math.random() - 0.5) * 4,
              color: '#38bdf8',
              life: 1.0,
            });
          }
        }

        // Terminal Destination check (Resort unloading at end)
        if (stop.y > h && stop.visited && st.passengersOnboard > 0) {
          const dropOff = st.passengersOnboard;
          st.totalDelivered += dropOff;
          st.revenue += dropOff * 25;
          st.passengersOnboard = 0;
          setPassengersDelivered(st.totalDelivered);
          setRevenue(st.revenue);

          if (st.totalDelivered >= TARGET_PASSENGERS && !st.gameWon) {
            st.gameWon = true;
            setGameWon(true);
            const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
            const receipt = calculateAndDepositMissionReward({
              gameId: 'capitalist-bus-driver',
              gameTitle: 'Capitalist Bus Driver',
              score: st.revenue,
              durationSeconds: duration,
            });
            setRewardReceipt(receipt);
          }
        }
      });

      // Respawn bus stops in loop
      st.busStops.forEach((stop) => {
        if (stop.y > h + 100) {
          stop.y = -600;
          stop.visited = false;
        }
      });

      // Move & Draw Obstacle Cars
      st.obstacles.forEach((car) => {
        car.y += st.busSpeed - car.speed;
        if (car.y > h + 50) {
          car.y = -150 - Math.random() * 200;
          car.lane = Math.floor(Math.random() * 3);
          car.x = 70 + car.lane * laneWidth + laneWidth / 2;
        }

        ctx.fillStyle = car.color;
        ctx.fillRect(car.x - 12, car.y - 20, 24, 40);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(car.x - 12, car.y - 20, 24, 40);

        // Crash Collision check with Bus
        const currentBusX = 70 + st.busLane * laneWidth + laneWidth / 2;
        if (Math.abs(car.x - currentBusX) < 22 && Math.abs(car.y - st.busY) < 45) {
          // Collision slowdown penalty
          st.busSpeed = 1.0;
          setTimeout(() => { st.busSpeed = 4.0; }, 600);
          car.y += 80;
        }
      });

      // Draw Player Bus
      const busX = 70 + st.busLane * laneWidth + laneWidth / 2;
      ctx.save();
      ctx.translate(busX, st.busY);

      // Yellow City Bus Body
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-18, -35, 36, 70);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(-18, -35, 36, 70);

      // Windshield & Windows
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-14, -30, 28, 14);
      ctx.fillRect(-14, -10, 8, 12);
      ctx.fillRect(6, -10, 8, 12);
      ctx.fillRect(-14, 8, 8, 12);
      ctx.fillRect(6, 8, 8, 12);

      // Bus Headlights
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-14, -34, 6, 3);
      ctx.fillRect(8, -34, 6, 3);

      ctx.restore();

      // Draw Particles
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          st.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Bottom Instructions
      ctx.fillStyle = '#f8fafc';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 좌/우 터치로 차선을 변경하고 우측 정류장에서 승객을 태우세요 ]', w / 2, h - 20);
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;

    if (x < canvas.width / 2) {
      changeLane('left');
    } else {
      changeLane('right');
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Capitalist Bus Driver"
        score={passengersDelivered}
        targetScore={TARGET_PASSENGERS}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointerDown}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm cursor-pointer"
        />
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          receipt={rewardReceipt}
          onConfirm={onBack}
        />
      )}
    </div>
  );
};

export default PokiCapitalistBusDriverGame;

