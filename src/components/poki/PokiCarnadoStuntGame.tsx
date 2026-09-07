import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCarnadoStuntGameProps {
  onClose: () => void;
}

export default function PokiCarnadoStuntGame({ onClose }: PokiCarnadoStuntGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stuntScore, setStuntScore] = useState(0);
  const [jumpsLanded, setJumpsLanded] = useState(0);
  const [airRotations, setAirRotations] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const TARGET_SCORE = 1500;
  const TARGET_JUMPS = 3;

  const stateRef = useRef<{
    car: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      angle: number;
      angularVel: number;
      inAir: boolean;
      totalAirRotations: number;
    };
    isGas: boolean;
    score: number;
    landedCount: number;
    rampX: number;
    groundY: number;
    touchStartX: number | null;
  }>({
    car: {
      x: 100,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVel: 0,
      inAir: false,
      totalAirRotations: 0
    },
    isGas: false,
    score: 0,
    landedCount: 0,
    rampX: 500,
    groundY: 0,
    touchStartX: null
  });

  const playSound = (type: 'engine' | 'jump' | 'stunt' | 'crash' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'engine') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'stunt') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.exponentialRampToValueAtTime(1174, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
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
      stateRef.current.groundY = canvas.height * 0.75;
      if (!stateRef.current.car.inAir && stateRef.current.car.y === 0) {
        stateRef.current.car.y = stateRef.current.groundY - 14;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const s = stateRef.current;
      const c = s.car;
      const gY = s.groundY;

      // Accelerator
      if (s.isGas) {
        c.vx = Math.min(18, c.vx + 0.35);
        if (!c.inAir && Math.random() < 0.2) playSound('engine');
      } else {
        c.vx *= 0.985;
      }

      // Movement
      c.x += c.vx;

      // Ramp Jump Trigger
      // Ramp is from rampX to rampX + 150
      const onRamp = c.x >= s.rampX && c.x <= s.rampX + 140;
      if (onRamp && !c.inAir) {
        const rampProgress = (c.x - s.rampX) / 140;
        c.y = gY - 14 - rampProgress * 65;
        c.angle = -0.42;

        if (c.x >= s.rampX + 130) {
          // Launch into air!
          c.inAir = true;
          c.vy = -c.vx * 0.7;
          c.angularVel = 0.05;
          playSound('jump');
        }
      } else if (c.inAir) {
        // Air physics
        c.y += c.vy;
        c.vy += 0.45; // Gravity
        c.angle += c.angularVel;

        // Count 360 rotations
        if (Math.abs(c.angle) >= Math.PI * 2 * (c.totalAirRotations + 1)) {
          c.totalAirRotations++;
          s.score += 400;
          setStuntScore(s.score);
          setAirRotations(c.totalAirRotations);
          playSound('stunt');
        }

        // Landing check
        if (c.y >= gY - 14) {
          c.y = gY - 14;
          c.vy = 0;
          c.inAir = false;

          // Normalize angle (-PI to PI)
          const normAngle = Math.atan2(Math.sin(c.angle), Math.cos(c.angle));

          // Safe landing tolerance: within +/- 45 deg
          if (Math.abs(normAngle) < 0.78) {
            // Landed successfully!
            c.angle = 0;
            c.angularVel = 0;
            s.landedCount++;
            s.score += 300;
            setStuntScore(s.score);
            setJumpsLanded(s.landedCount);
            playSound('stunt');

            // Setup next ramp ahead
            s.rampX = c.x + 600;
            c.totalAirRotations = 0;

            if (s.score >= TARGET_SCORE && s.landedCount >= TARGET_JUMPS && !gameWon) {
              setGameWon(true);
              playSound('win');
              const deposit = calculateAndDepositMissionReward({
                gameId: 'pokicarnadostunt',
                gameTitle: 'Carnado Stunt Car',
                isVictory: true,
                score: 1000,
                maxTargetScore: 1000,
                durationSeconds: 30
              });
              setRewardResult(deposit);
            }
          } else {
            // Crashed!
            setGameOver(true);
            playSound('crash');
          }
        }
      } else {
        // Flat ground
        c.y = gY - 14;
        c.angle = 0;
      }

      // Camera Offset
      const camX = c.x - canvas.width * 0.25;

      // RENDER
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sunset gradient / city silhouettes
      ctx.fillStyle = '#1e1b4b';
      for (let b = 0; b < 10; b++) {
        const bx = ((b * 160 - camX * 0.2) % (canvas.width + 300)) - 100;
        ctx.fillRect(bx, gY - 160 - (b % 4) * 30, 80, 200);
      }

      // Stunt Mega Ramp
      const rampScreenX = s.rampX - camX;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(rampScreenX, gY);
      ctx.lineTo(rampScreenX + 140, gY - 65);
      ctx.lineTo(rampScreenX + 140, gY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Ground Road
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, gY, canvas.width, canvas.height - gY);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, gY, canvas.width, 4);

      // Draw Stunt Car
      ctx.save();
      const carScreenX = c.x - camX;
      ctx.translate(carScreenX, c.y);
      ctx.rotate(c.angle);

      // Nitro Fire exhaust
      if (s.isGas) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-28, 0);
        ctx.lineTo(-44 - Math.random() * 12, -4);
        ctx.lineTo(-28, 4);
        ctx.fill();
      }

      // Car Body
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-26, -10, 52, 16);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-10, -20, 26, 10); // Roof
      // Wheels
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(-16, 8, 8, 0, Math.PI * 2);
      ctx.arc(16, 8, 8, 0, Math.PI * 2);
      ctx.fill();

      // Driver Card Sprite
      drawCardSprite(ctx, 69, -10, -38, 26, 26);

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Touch Event Handling
    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      stateRef.current.isGas = true;
      stateRef.current.touchStartX = t.clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const startX = stateRef.current.touchStartX;
      if (startX === null) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;

      // In air: adjust angular velocity
      if (stateRef.current.car.inAir) {
        stateRef.current.car.angularVel += Math.sign(dx) * 0.02;
        stateRef.current.touchStartX = t.clientX;
      }
    };

    const handleTouchEnd = () => {
      stateRef.current.isGas = false;
      stateRef.current.touchStartX = null;
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
        gameTitle="Carnado Stunt Car"
        missionTarget={`스턴트 점수 ${TARGET_SCORE}점 & 점프 ${TARGET_JUMPS}회 착지`}
        currentProgress={`점수: ${stuntScore} / ${TARGET_SCORE} | 착지: ${jumpsLanded} / ${TARGET_JUMPS}`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Air Rotation Counter */}
        {airRotations > 0 && (
          <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
            <span className="bg-amber-500 text-black font-bold px-4 py-1 rounded-sm text-sm shadow-lg animate-bounce">
              🔥 360° 공중제비 x{airRotations} 성공! (+400pts)
            </span>
          </div>
        )}

        {/* Bottom Guide */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-zinc-900/80 text-zinc-300 border border-zinc-700 px-3 py-1.5 text-xs rounded-sm">
            터치 유지: 풀악셀 가속 | 공중 좌우 스와이프: 공중제비 묘기 & 수평 착지
          </span>
        </div>

        {/* Game Over Modal */}
        {gameOver && !gameWon && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-none text-center max-w-sm">
              <h2 className="text-xl font-bold text-red-400 mb-2">스턴트 차량 전복!</h2>
              <p className="text-xs text-zinc-400 mb-4">공중에서 수평을 맞추지 못하고 뒤집혀 추락했습니다.</p>
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
          gameTitle="Carnado Stunt Car"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
