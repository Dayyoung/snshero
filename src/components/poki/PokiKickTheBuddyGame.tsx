import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiKickTheBuddyGameProps {
  onBack: () => void;
  cardId?: number;
}

type WeaponType = 'glove' | 'dart' | 'bomb' | 'zap';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  text?: string;
  color?: string;
  life: number;
}

export const PokiKickTheBuddyGame: React.FC<PokiKickTheBuddyGameProps> = ({ onBack, cardId = 46 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('glove');
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    buddy: {
      x: 200,
      y: 320,
      vx: 0,
      vy: 0,
      rotation: 0,
      angularVel: 0,
      scale: 1,
    },
    weapon: 'glove' as WeaponType,
    score: 0,
    particles: [] as Particle[],
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
      gameStateRef.current.buddy.x = canvas.width / 2;
      gameStateRef.current.buddy.y = canvas.height * 0.45;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const state = gameStateRef.current;
      const b = state.buddy;

      // Physics & spring return towards center
      const restX = canvas.width / 2;
      const restY = canvas.height * 0.45;

      b.vx += (restX - b.x) * 0.04;
      b.vy += (restY - b.y) * 0.04;
      b.vx *= 0.88;
      b.vy *= 0.88;

      b.x += b.vx;
      b.y += b.vy;

      b.angularVel += -b.rotation * 0.05;
      b.angularVel *= 0.85;
      b.rotation += b.angularVel;

      b.scale += (1 - b.scale) * 0.1;

      // Render room
      ctx.fillStyle = '#fef3c7'; // Cardboard box background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cardboard box seams
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 80, canvas.width - 40, canvas.height - 180);

      // Buddy suspension springs/strings from ceiling
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 40, 80);
      ctx.lineTo(b.x - 20, b.y - 40);
      ctx.moveTo(canvas.width / 2 + 40, 80);
      ctx.lineTo(b.x + 20, b.y - 40);
      ctx.stroke();

      // Draw Buddy Ragdoll
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);
      ctx.scale(b.scale, b.scale);

      // Body / torso
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(-30, -10, 60, 70, 12);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Card Hero Sprite as Buddy
      drawCardSprite(ctx, cardId, -24, -60, 48, 48);

      // Flailing arms
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-45, 0, 15, 40);
      ctx.fillRect(30, 0, 15, 40);

      // Dangling legs
      ctx.fillRect(-22, 60, 16, 45);
      ctx.fillRect(6, 60, 16, 45);

      ctx.restore();

      // Particles (coins, spark text, explosions)
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;

        if (pt.text) {
          ctx.fillStyle = pt.color || '#f59e0b';
          ctx.font = 'bold 15px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(pt.text, pt.x, pt.y);
        } else {
          ctx.fillStyle = pt.color || '#eab308';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(1, pt.life * 0.2), 0, Math.PI * 2);
          ctx.fill();
        }

        if (pt.life <= 0) state.particles.splice(i, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [cardId, gameOver, gameWon]);

  const triggerHit = (clientX: number, clientY: number) => {
    if (gameOver) return;
    const state = gameStateRef.current;
    const b = state.buddy;

    let points = 50;
    let impulseX = (Math.random() - 0.5) * 20;
    let impulseY = (Math.random() - 0.5) * 15;
    let rotImpulse = (Math.random() - 0.5) * 0.5;

    if (state.weapon === 'glove') {
      points = 50;
      impulseX = clientX < b.x ? 25 : -25;
      impulseY = -15;
    } else if (state.weapon === 'dart') {
      points = 70;
      impulseY = 10;
    } else if (state.weapon === 'bomb') {
      points = 150;
      impulseY = -35;
      rotImpulse = 0.8;
      b.scale = 1.35;
    } else if (state.weapon === 'zap') {
      points = 100;
      rotImpulse = (Math.random() - 0.5) * 1.2;
    }

    b.vx += impulseX;
    b.vy += impulseY;
    b.angularVel += rotImpulse;

    state.score += points;
    setScore(state.score);

    // Spawn coin & impact particles
    state.particles.push({
      x: clientX,
      y: clientY,
      vx: 0,
      vy: -2,
      text: `+${points} 💰`,
      color: '#f59e0b',
      life: 25,
    });

    for (let k = 0; k < 8; k++) {
      state.particles.push({
        x: clientX,
        y: clientY,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: state.weapon === 'bomb' ? '#ef4444' : state.weapon === 'zap' ? '#38bdf8' : '#eab308',
        life: 20,
      });
    }

    // Win condition: 1500 score
    if (state.score >= 1500 && !gameWon) {
      setGameWon(true);
      setGameOver(true);
      const reward = calculateAndDepositMissionReward({
        gameId: 'pokikickthebuddy',
        gameTitle: 'Kick The Buddy',
        isVictory: true,
        score: state.score,
        maxTargetScore: 1500,
        durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
      });
      setRewardResult(reward);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fef3c7] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Kick The Buddy"
        score={score}
        targetScore={1500}
        lives={5}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-pointer"
        onMouseDown={(e) => triggerHit(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          triggerHit(t.clientX, t.clientY);
        }}
      />

      {/* Bottom Tool Selection Bar */}
      <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center gap-3 pointer-events-auto">
        {(
          [
            { type: 'glove', label: '🥊 펀치', desc: '50pt' },
            { type: 'dart', label: '🎯 다트', desc: '70pt' },
            { type: 'bomb', label: '💣 폭탄', desc: '150pt' },
            { type: 'zap', label: '⚡ 전기', desc: '100pt' },
          ] as const
        ).map((w) => (
          <button
            key={w.type}
            onClick={() => {
              setSelectedWeapon(w.type);
              gameStateRef.current.weapon = w.type;
            }}
            className={`px-3 py-2 rounded-sm border text-xs font-bold transition-all ${
              selectedWeapon === w.type
                ? 'bg-amber-500 text-white border-amber-600 scale-105 shadow'
                : 'bg-white/90 text-stone-700 border-stone-300'
            }`}
          >
            <div>{w.label}</div>
            <div className="text-[10px] opacity-80">{w.desc}</div>
          </button>
        ))}
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={score}
        targetScore={1500}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setScore(0);
          gameStateRef.current.score = 0;
          gameStateRef.current.startTime = Date.now();
        }}
      />
    </div>
  );
};

export default PokiKickTheBuddyGame;
