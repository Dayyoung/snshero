import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPlanetDestructionGameProps {
  onBack: () => void;
  cardId?: number;
}

type SuperWeapon = 'meteor' | 'laser' | 'nuke' | 'alien';

interface ImpactCrater {
  x: number;
  y: number;
  radius: number;
}

export const PokiPlanetDestructionGame: React.FC<PokiPlanetDestructionGameProps> = ({
  onBack,
  cardId = 53,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [destructionPct, setDestructionPct] = useState(0);
  const [weapon, setWeapon] = useState<SuperWeapon>('meteor');
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    weapon: 'meteor' as SuperWeapon,
    destruction: 0,
    planetAngle: 0,
    craters: [] as ImpactCrater[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number; size: number }[],
    startTime: Date.now(),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Deep Cosmic Space background
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97) % canvas.width;
        const sy = (i * 131) % canvas.height;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      const planetX = canvas.width / 2;
      const planetY = canvas.height * 0.45;
      const planetR = Math.min(canvas.width * 0.35, 120);

      state.planetAngle += 0.005;

      // Planet Glow Aura
      const glow = ctx.createRadialGradient(planetX, planetY, planetR * 0.8, planetX, planetY, planetR * 1.3);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetR * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Planet Body
      ctx.save();
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
      ctx.clip();

      // Ocean base
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(planetX - planetR, planetY - planetR, planetR * 2, planetR * 2);

      // Rotating Continents
      ctx.fillStyle = '#15803d';
      for (let c = -1; c < 3; c++) {
        const cx = planetX + Math.sin(state.planetAngle + c * 1.6) * (planetR * 0.8);
        ctx.beginPath();
        ctx.ellipse(cx, planetY - 20, planetR * 0.4, planetR * 0.6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 30, planetY + 40, planetR * 0.3, planetR * 0.3, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Craters & Magma Lava cracks
      for (const cr of state.craters) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cr.x, cr.y, cr.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(cr.x, cr.y, cr.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      // Atmosphere 3D Shadow overlay
      const shadowGrad = ctx.createLinearGradient(planetX - planetR, planetY, planetX + planetR, planetY);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(planetX - planetR, planetY - planetR, planetR * 2, planetR * 2);

      ctx.restore();

      // Commander Card Sprite in bottom left corner
      drawCardSprite(ctx, cardId, 24, canvas.height - 180, 50, 60);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('COMMANDER', 20, canvas.height - 110);

      // Particles (fire, debris, shockwaves)
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(1, pt.size * (pt.life / 25)), 0, Math.PI * 2);
        ctx.fill();
        if (pt.life <= 0) state.particles.splice(i, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cardId, gameOver, gameWon]);

  const launchAttack = (clientX: number, clientY: number) => {
    if (gameOver) return;
    const s = gameStateRef.current;
    const planetX = window.innerWidth / 2;
    const planetY = window.innerHeight * 0.45;
    const planetR = Math.min(window.innerWidth * 0.35, 120);

    const dist = Math.hypot(clientX - planetX, clientY - planetY);
    if (dist > planetR * 1.1) return; // Must tap on planet

    let dmg = 6;
    let color = '#f59e0b';
    let rad = 14;

    if (s.weapon === 'meteor') {
      dmg = 7;
      color = '#f97316';
      rad = 16;
    } else if (s.weapon === 'laser') {
      dmg = 10;
      color = '#38bdf8';
      rad = 12;
    } else if (s.weapon === 'nuke') {
      dmg = 18;
      color = '#ef4444';
      rad = 26;
    } else if (s.weapon === 'alien') {
      dmg = 12;
      color = '#a855f7';
      rad = 18;
    }

    s.destruction = Math.min(100, s.destruction + dmg);
    setDestructionPct(s.destruction);

    s.craters.push({ x: clientX, y: clientY, radius: rad });

    // Explosion shockwave particles
    for (let k = 0; k < 15; k++) {
      s.particles.push({
        x: clientX,
        y: clientY,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color,
        life: 25,
        size: 5 + Math.random() * 5,
      });
    }

    if (s.destruction >= 100 && !gameWon) {
      setGameWon(true);
      setGameOver(true);
      const reward = calculateAndDepositMissionReward({
        gameId: 'pokiplanetdestruction',
        gameTitle: 'Planet Destruction',
        isVictory: true,
        score: 1000,
        maxTargetScore: 1000,
        durationSeconds: Math.floor((Date.now() - s.startTime) / 1000),
      });
      setRewardResult(reward);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#05070f] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Planet Destruction"
        score={destructionPct}
        targetScore={100}
        lives={100 - destructionPct}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseDown={(e) => launchAttack(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          launchAttack(t.clientX, t.clientY);
        }}
      />

      {/* Weapon Armory Selection Dock */}
      <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center gap-2 pointer-events-auto">
        {(
          [
            { key: 'meteor', label: '☄️ 운석', desc: '+7%' },
            { key: 'laser', label: '⚡ 레이저', desc: '+10%' },
            { key: 'nuke', label: '🚀 핵미사일', desc: '+18%' },
            { key: 'alien', label: '🛸 함선폭격', desc: '+12%' },
          ] as const
        ).map((w) => (
          <button
            key={w.key}
            onClick={() => {
              setWeapon(w.key);
              gameStateRef.current.weapon = w.key;
            }}
            className={`px-3 py-2 rounded-sm border text-xs font-bold transition-all ${
              weapon === w.key
                ? 'bg-red-600 text-white border-red-400 scale-105 shadow'
                : 'bg-stone-900/90 text-stone-300 border-stone-700'
            }`}
          >
            <div>{w.label}</div>
            <div className="text-[10px] text-amber-400">{w.desc}</div>
          </button>
        ))}
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={destructionPct * 10}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setDestructionPct(0);
          const s = gameStateRef.current;
          s.destruction = 0;
          s.craters = [];
          s.startTime = Date.now();
        }}
      />
    </div>
  );
};
