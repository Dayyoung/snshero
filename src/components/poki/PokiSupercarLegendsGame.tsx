import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSupercarLegendsGameProps {
  onClose: () => void;
}

interface Car {
  id: string;
  progress: number; // 0 to 3 laps (0 to 3.0)
  laneOffset: number; // -1 to 1
  speed: number;
  color: string;
  cardId: number;
  isPlayer: boolean;
  name: string;
}

export default function PokiSupercarLegendsGame({ onClose }: PokiSupercarLegendsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentLap, setCurrentLap] = useState(1);
  const [playerRank, setPlayerRank] = useState(1);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const TOTAL_LAPS = 3;

  const stateRef = useRef<{
    cars: Car[];
    isNitro: boolean;
    touchX: number | null;
  }>({
    cars: [
      { id: 'player', progress: 0, laneOffset: 0, speed: 0.002, color: '#ef4444', cardId: 72, isPlayer: true, name: '나 (슈퍼카)' },
      { id: 'ai1', progress: 0.05, laneOffset: -0.5, speed: 0.0028, color: '#3b82f6', cardId: 11, isPlayer: false, name: '블루 썬더' },
      { id: 'ai2', progress: 0.08, laneOffset: 0.5, speed: 0.0027, color: '#eab308', cardId: 7, isPlayer: false, name: '골드 바이퍼' },
      { id: 'ai3', progress: 0.12, laneOffset: 0.1, speed: 0.0026, color: '#10b981', cardId: 4, isPlayer: false, name: '그린 팬텀' }
    ],
    isNitro: false,
    touchX: null
  });

  const playSound = (type: 'engine' | 'nitro' | 'lap' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'engine') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'nitro') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'lap') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
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

  // Convert track progress (0 to 1 loop) to 2D coordinates on oval
  const getTrackCoords = (progress: number, laneOffset: number, w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const rx = Math.min(w * 0.38, 220);
    const ry = Math.min(h * 0.32, 170);

    const rad = (progress % 1.0) * Math.PI * 2 - Math.PI / 2;
    const trackWidth = 50;

    const baseRadiusX = rx + laneOffset * (trackWidth * 0.35);
    const baseRadiusY = ry + laneOffset * (trackWidth * 0.35);

    const x = cx + Math.cos(rad) * baseRadiusX;
    const y = cy + Math.sin(rad) * baseRadiusY;
    const angle = rad + Math.PI / 2;

    return { x, y, angle };
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
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const s = stateRef.current;
      const player = s.cars.find((c) => c.isPlayer);

      // Player Speed Physics
      if (player) {
        const targetSpd = s.isNitro ? 0.0042 : 0.0031;
        player.speed += (targetSpd - player.speed) * 0.08;
        setSpeedKmh(Math.floor(player.speed * 65000));
        if (Math.random() < 0.15) playSound('engine');

        // Lap update
        const lapNum = Math.min(TOTAL_LAPS, Math.floor(player.progress) + 1);
        setCurrentLap(lapNum);

        // Win check
        if (player.progress >= TOTAL_LAPS && !gameWon) {
          // Check if 1st
          const rank = s.cars.filter((c) => c.progress > player.progress).length + 1;
          if (rank === 1) {
            setGameWon(true);
            playSound('win');
            const deposit = calculateAndDepositMissionReward({
              gameId: 'pokisupercarlegends',
              gameTitle: 'Supercar Legends',
              isVictory: true,
              score: 1000,
              maxTargetScore: 1000,
              durationSeconds: 30
            });
            setRewardResult(deposit);
          } else {
            setGameOver(true);
          }
        }
      }

      // Update All Cars
      s.cars.forEach((c) => {
        c.progress += c.speed;
        if (!c.isPlayer) {
          // AI slight random speed variation
          c.speed += (Math.random() - 0.5) * 0.0001;
          c.speed = Math.max(0.0024, Math.min(0.0034, c.speed));
        }
      });

      // Rank calculation
      if (player) {
        const rank = s.cars.filter((c) => c.progress > player.progress).length + 1;
        setPlayerRank(rank);
      }

      // RENDER
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const rx = Math.min(canvas.width * 0.38, 220);
      const ry = Math.min(canvas.height * 0.32, 170);

      // Green Infield
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx - 35, ry - 35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Asphalt Track
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 70;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Track Curb (Red/White Curbs)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Center Dash Line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Start/Finish Line (Top of loop)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx - 3, cy - ry - 35, 6, 70);

      // Draw Cars
      s.cars.forEach((c) => {
        const pos = getTrackCoords(c.progress, c.laneOffset, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(pos.angle);

        // Nitro Flame
        if (c.isPlayer && s.isNitro) {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(-6, -16);
          ctx.lineTo(6, -16);
          ctx.lineTo(0, -30 - Math.random() * 8);
          ctx.fill();
        }

        // Car Body
        ctx.fillStyle = c.color;
        ctx.fillRect(-10, -16, 20, 32);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-8, -8, 16, 12); // Cockpit

        // Card Sprite as Driver Badge
        drawCardSprite(ctx, c.cardId, -7, -7, 14, 14);

        ctx.restore();
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Touch Event Handling
    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      stateRef.current.touchX = t.clientX;
      stateRef.current.isNitro = true;
      playSound('nitro');
    };

    const handleTouchMove = (e: TouchEvent) => {
      const startX = stateRef.current.touchX;
      if (startX === null) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;

      const player = stateRef.current.cars.find((c) => c.isPlayer);
      if (player) {
        player.laneOffset = Math.max(-0.8, Math.min(0.8, player.laneOffset + dx * 0.015));
      }
      stateRef.current.touchX = t.clientX;
    };

    const handleTouchEnd = () => {
      stateRef.current.touchX = null;
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
        gameTitle="Supercar Legends"
        missionTarget={`3랩 서킷 1위로 완주`}
        currentProgress={`랩: ${currentLap} / ${TOTAL_LAPS} | 현재 순위: ${playerRank}위 | ${speedKmh} KM/H`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Bottom Touch Guide */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-zinc-900/80 text-zinc-300 border border-zinc-700 px-3 py-1.5 text-xs rounded-sm">
            좌우 드래그: 코너 라인 조타 | 터치 유지: 니트로 풀가속!
          </span>
        </div>

        {/* Game Over Modal */}
        {gameOver && !gameWon && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-none text-center max-w-sm">
              <h2 className="text-xl font-bold text-red-400 mb-2">1위 완주 실패!</h2>
              <p className="text-xs text-zinc-400 mb-4">라이벌 슈퍼카에게 선두를 내주었습니다.</p>
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
          gameTitle="Supercar Legends"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
