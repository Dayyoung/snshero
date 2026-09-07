import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCountControlGameProps {
  onBack: () => void;
  cardId?: number;
}

interface MathGate {
  y: number;
  leftVal: string;
  leftOp: (n: number) => number;
  rightVal: string;
  rightOp: (n: number) => number;
  passed: boolean;
}

export const PokiCountControlGame: React.FC<PokiCountControlGameProps> = ({ onBack, cardId = 47 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [armyCount, setArmyCount] = useState(10);
  const [distance, setDistance] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    squadX: 200,
    targetX: 200,
    squadY: 0,
    count: 10,
    progress: 0,
    trackLength: 3000,
    speed: 5.5,
    gates: [
      {
        y: 450,
        leftVal: '+15',
        leftOp: (n: number) => n + 15,
        rightVal: 'x2',
        rightOp: (n: number) => n * 2,
        passed: false,
      },
      {
        y: 1000,
        leftVal: 'x3',
        leftOp: (n: number) => n * 3,
        rightVal: '+20',
        rightOp: (n: number) => n + 20,
        passed: false,
      },
      {
        y: 1600,
        leftVal: '-10',
        leftOp: (n: number) => Math.max(1, n - 10),
        rightVal: '+35',
        rightOp: (n: number) => n + 35,
        passed: false,
      },
      {
        y: 2200,
        leftVal: 'x2',
        leftOp: (n: number) => n * 2,
        rightVal: '+40',
        rightOp: (n: number) => n + 40,
        passed: false,
      },
    ] as MathGate[],
    hazards: [
      { y: 750, x: 180, radius: 24, rot: 0 },
      { y: 1350, x: 260, radius: 24, rot: 0 },
      { y: 1950, x: 200, radius: 24, rot: 0 },
    ],
    bossHp: 80,
    startTime: Date.now(),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameStateRef.current.squadX = canvas.width / 2;
      gameStateRef.current.targetX = canvas.width / 2;
      gameStateRef.current.squadY = canvas.height - 180;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const state = gameStateRef.current;
      const trackW = Math.min(canvas.width * 0.9, 420);
      const startX = (canvas.width - trackW) / 2;

      // Update
      state.progress += state.speed;
      setDistance(Math.min(100, Math.floor((state.progress / state.trackLength) * 100)));

      // Smooth horizontal steer
      state.squadX += (state.targetX - state.squadX) * 0.2;
      state.squadX = Math.max(startX + 30, Math.min(startX + trackW - 30, state.squadX));

      // Check Math Gates
      for (const gate of state.gates) {
        const screenY = state.squadY - (gate.y - state.progress);
        if (!gate.passed && screenY >= state.squadY - 20 && screenY <= state.squadY + 20) {
          gate.passed = true;
          const midX = startX + trackW / 2;
          if (state.squadX < midX) {
            state.count = gate.leftOp(state.count);
          } else {
            state.count = gate.rightOp(state.count);
          }
          setArmyCount(state.count);
        }
      }

      // Check Hazards (Buzzsaws)
      for (const haz of state.hazards) {
        haz.rot += 0.1;
        const screenY = state.squadY - (haz.y - state.progress);
        if (Math.abs(screenY - state.squadY) < 30) {
          const dist = Math.hypot(startX + haz.x - state.squadX, screenY - state.squadY);
          if (dist < haz.radius + 20) {
            state.count = Math.max(1, Math.floor(state.count * 0.85));
            setArmyCount(state.count);
          }
        }
      }

      // Castle at finish line
      if (state.progress >= state.trackLength && !gameOver) {
        const won = state.count >= 50;
        setGameOver(true);
        setGameWon(won);
        const reward = calculateAndDepositMissionReward({
          gameId: 'pokicountcontrol',
          gameTitle: 'Count Control Legends',
          isVictory: won,
          score: state.count * 15,
          maxTargetScore: 1000,
          durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
        });
        setRewardResult(reward);
        return;
      }

      // Drawing
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track road
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(startX, 0, trackW, canvas.height);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(startX, 0, trackW, canvas.height);

      // Track grid stripes
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      const stripeOffset = state.progress % 40;
      for (let y = -stripeOffset; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + trackW, y);
        ctx.stroke();
      }

      // Draw Gates
      const midTrackX = startX + trackW / 2;
      for (const gate of state.gates) {
        const screenY = state.squadY - (gate.y - state.progress);
        if (screenY > -50 && screenY < canvas.height + 50) {
          // Left gate
          ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
          ctx.fillRect(startX + 4, screenY - 20, trackW / 2 - 6, 40);
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.strokeRect(startX + 4, screenY - 20, trackW / 2 - 6, 40);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(gate.leftVal, startX + trackW * 0.25, screenY + 6);

          // Right gate
          ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
          ctx.fillRect(midTrackX + 2, screenY - 20, trackW / 2 - 6, 40);
          ctx.strokeStyle = '#34d399';
          ctx.strokeRect(midTrackX + 2, screenY - 20, trackW / 2 - 6, 40);

          ctx.fillStyle = '#ffffff';
          ctx.fillText(gate.rightVal, startX + trackW * 0.75, screenY + 6);
        }
      }

      // Draw Hazards (Buzzsaws)
      for (const haz of state.hazards) {
        const screenY = state.squadY - (haz.y - state.progress);
        if (screenY > -50 && screenY < canvas.height + 50) {
          ctx.save();
          ctx.translate(startX + haz.x, screenY);
          ctx.rotate(haz.rot);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, haz.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fca5a5';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚡', 0, 4);
          ctx.restore();
        }
      }

      // Draw Squad (Leader sprite + mini clones)
      const visibleClones = Math.min(24, Math.floor(state.count / 2));
      for (let i = 0; i < visibleClones; i++) {
        const angle = (i / visibleClones) * Math.PI * 2;
        const dist = 14 + (i % 3) * 12;
        const cx = state.squadX + Math.cos(angle) * dist;
        const cy = state.squadY + Math.sin(angle) * dist * 0.7;

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Squad Leader Card Sprite
      drawCardSprite(ctx, cardId, state.squadX - 18, state.squadY - 22, 36, 44);

      // Army count badge
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`👥 ${state.count}`, state.squadX, state.squadY - 30);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [cardId, gameOver, gameWon]);

  const handlePointer = (clientX: number) => {
    gameStateRef.current.targetX = clientX;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#0f172a] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Count Control Legends"
        score={armyCount}
        targetScore={50}
        lives={100 - distance}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-ew-resize"
        onMouseMove={(e) => handlePointer(e.clientX)}
        onTouchMove={(e) => handlePointer(e.touches[0].clientX)}
        onTouchStart={(e) => handlePointer(e.touches[0].clientX)}
      />

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none text-xs text-sky-300">
        좌우로 드래그하여 배수(+15, x2, x3) 관문을 통과해 군단을 증식시키세요!
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={armyCount * 15}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setArmyCount(10);
          setDistance(0);
          const s = gameStateRef.current;
          s.count = 10;
          s.progress = 0;
          s.gates.forEach((g) => (g.passed = false));
          s.startTime = Date.now();
        }}
      />
    </div>
  );
};

export default PokiCountControlGame;
