import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiTankStarsGameProps {
  onBack: () => void;
  cardId?: number;
}

type ShellType = 'standard' | 'cluster' | 'nuke';

export const PokiTankStarsGame: React.FC<PokiTankStarsGameProps> = ({ onBack, cardId = 60 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [selectedShell, setSelectedShell] = useState<ShellType>('standard');
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    playerTank: { x: 70, y: 0, angle: -Math.PI / 4, power: 12 },
    enemyTank: { x: 300, y: 0, angle: -Math.PI * 0.75, power: 11 },
    playerHp: 100,
    enemyHp: 100,
    shell: 'standard' as ShellType,
    flyingShells: [] as { x: number; y: number; vx: number; vy: number; isPlayer: boolean; dmg: number }[],
    isAiming: false,
    aimAngle: -Math.PI / 4,
    aimPower: 12,
    dragStart: { x: 0, y: 0 },
    turn: 'player' as 'player' | 'enemy',
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
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
      const s = gameStateRef.current;
      s.playerTank.y = canvas.height * 0.65;
      s.enemyTank.x = canvas.width - 80;
      s.enemyTank.y = canvas.height * 0.65;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const state = gameStateRef.current;
      const p = state.playerTank;
      const e = state.enemyTank;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Update flying shells
      for (let i = state.flyingShells.length - 1; i >= 0; i--) {
        const sh = state.flyingShells[i];
        sh.x += sh.vx;
        sh.y += sh.vy;
        sh.vy += 0.35; // gravity

        // Check ground or tank hit
        const groundY = canvas.height * 0.65;
        let hit = false;

        if (sh.isPlayer) {
          // Check enemy hit
          if (Math.hypot(sh.x - e.x, sh.y - e.y) < 32) {
            hit = true;
            state.enemyHp = Math.max(0, state.enemyHp - sh.dmg);
            setEnemyHp(state.enemyHp);

            if (state.enemyHp <= 0 && !gameWon) {
              setGameWon(true);
              setGameOver(true);
              const reward = calculateAndDepositMissionReward({
                gameId: 'pokitankstars',
                gameTitle: 'Tank Stars',
                isVictory: true,
                score: 1000,
                maxTargetScore: 1000,
                durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
              });
              setRewardResult(reward);
              return;
            }
          }
        } else {
          // Check player hit
          if (Math.hypot(sh.x - p.x, sh.y - p.y) < 32) {
            hit = true;
            state.playerHp = Math.max(0, state.playerHp - sh.dmg);
            setPlayerHp(state.playerHp);

            if (state.playerHp <= 0 && !gameOver) {
              setGameOver(true);
              const reward = calculateAndDepositMissionReward({
                gameId: 'pokitankstars',
                gameTitle: 'Tank Stars',
                isVictory: false,
                score: (100 - state.enemyHp) * 10,
                maxTargetScore: 1000,
                durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
              });
              setRewardResult(reward);
              return;
            }
          }
        }

        if (hit || sh.y >= groundY || sh.x < 0 || sh.x > canvas.width) {
          // Explosion particles
          for (let k = 0; k < 18; k++) {
            state.particles.push({
              x: sh.x,
              y: Math.min(groundY, sh.y),
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              color: '#f59e0b',
              life: 25,
            });
          }
          state.flyingShells.splice(i, 1);

          // If all shells done, switch turn
          if (state.flyingShells.length === 0) {
            if (state.turn === 'player') {
              state.turn = 'enemy';
              setTurn('enemy');
              // Enemy bot AI shoots after 1.2s delay
              setTimeout(() => {
                enemyFire();
              }, 1200);
            } else {
              state.turn = 'player';
              setTurn('player');
            }
          }
        }
      }

      // Drawing
      // Sunset War Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.65);
      skyGrad.addColorStop(0, '#7c2d12');
      skyGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Desert hill battlefield
      const groundY = canvas.height * 0.65;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Draw Player Blue Tank
      ctx.save();
      // Tank body
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(p.x - 25, groundY - 18, 50, 18);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(p.x - 28, groundY - 6, 56, 8); // treads

      // Cannon barrel
      ctx.translate(p.x, groundY - 18);
      ctx.rotate(state.aimAngle);
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, -5, 32, 10);
      ctx.restore();

      // Player Tank Hero Sprite
      drawCardSprite(ctx, cardId, p.x - 16, groundY - 48, 32, 36);

      // Draw Enemy Red Tank
      ctx.save();
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(e.x - 25, groundY - 18, 50, 18);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(e.x - 28, groundY - 6, 56, 8);

      ctx.translate(e.x, groundY - 18);
      ctx.rotate(e.angle);
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, -5, 32, 10);
      ctx.restore();

      // Enemy Tank Hero Sprite
      drawCardSprite(ctx, 30, e.x - 16, groundY - 48, 32, 36, { flipH: true });

      // Trajectory Prediction Arc for Player
      if (state.turn === 'player' && state.isAiming) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        let simX = p.x;
        let simY = groundY - 18;
        let simVx = Math.cos(state.aimAngle) * state.aimPower;
        let simVy = Math.sin(state.aimAngle) * state.aimPower;
        ctx.moveTo(simX, simY);
        for (let step = 0; step < 24; step++) {
          simX += simVx;
          simY += simVy;
          simVy += 0.35;
          ctx.lineTo(simX, simY);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Flying Shells
      for (const sh of state.flyingShells) {
        ctx.fillStyle = sh.isPlayer ? '#38bdf8' : '#ef4444';
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, sh.dmg > 40 ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // HP Bar Overlay
      // Player HP
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(p.x - 30, groundY + 14, 60, 6);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(p.x - 30, groundY + 14, (state.playerHp / 100) * 60, 6);

      // Enemy HP
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(e.x - 30, groundY + 14, 60, 6);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(e.x - 30, groundY + 14, (state.enemyHp / 100) * 60, 6);

      // Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(1, pt.life * 0.2), 0, Math.PI * 2);
        ctx.fill();
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

  const enemyFire = () => {
    const s = gameStateRef.current;
    if (s.playerHp <= 0 || s.enemyHp <= 0) return;

    // AI calculated trajectory towards player with small noise
    const dx = s.playerTank.x - s.enemyTank.x;
    const angle = -Math.PI * 0.72 + (Math.random() - 0.5) * 0.15;
    const power = 12 + (Math.random() - 0.5) * 2;
    s.enemyTank.angle = angle;

    s.flyingShells.push({
      x: s.enemyTank.x - 25,
      y: s.enemyTank.y - 18,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power,
      isPlayer: false,
      dmg: 25,
    });
  };

  const firePlayer = () => {
    const s = gameStateRef.current;
    if (s.turn !== 'player' || s.flyingShells.length > 0 || gameOver) return;

    const angle = s.aimAngle;
    const power = s.aimPower;
    const p = s.playerTank;

    if (s.shell === 'standard') {
      s.flyingShells.push({
        x: p.x + 25,
        y: p.y - 18,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power,
        isPlayer: true,
        dmg: 40,
      });
    } else if (s.shell === 'cluster') {
      // 3 cluster shells
      for (let k = -1; k <= 1; k++) {
        s.flyingShells.push({
          x: p.x + 25,
          y: p.y - 18,
          vx: Math.cos(angle + k * 0.08) * power,
          vy: Math.sin(angle + k * 0.08) * power,
          isPlayer: true,
          dmg: 22,
        });
      }
    } else if (s.shell === 'nuke') {
      s.flyingShells.push({
        x: p.x + 25,
        y: p.y - 18,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power,
        isPlayer: true,
        dmg: 75,
      });
    }
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (gameStateRef.current.turn !== 'player' || gameOver) return;
    gameStateRef.current.isAiming = true;
    gameStateRef.current.dragStart = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    const s = gameStateRef.current;
    if (s.isAiming) {
      const dx = clientX - s.dragStart.x;
      const dy = clientY - s.dragStart.y;
      // Adjust angle & power
      s.aimAngle = Math.max(-Math.PI * 0.48, Math.min(-0.2, -Math.PI / 4 + dy * 0.01));
      s.aimPower = Math.max(7, Math.min(18, 12 + dx * 0.08));
    }
  };

  const handlePointerUp = () => {
    gameStateRef.current.isAiming = false;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#7c2d12] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Tank Stars"
        score={100 - enemyHp}
        targetScore={100}
        lives={Math.ceil(playerHp / 34)}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handlePointerDown(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          handlePointerMove(t.clientX, t.clientY);
        }}
        onTouchEnd={handlePointerUp}
      />

      {/* Shell Weapon Selection & Fire Dock */}
      <div className="absolute bottom-4 left-0 right-0 px-4 flex flex-col items-center gap-2 pointer-events-auto">
        <div className="flex justify-center gap-2">
          {(
            [
              { type: 'standard', label: '💣 일반포탄', desc: '40 DMG' },
              { type: 'cluster', label: '💥 확산탄', desc: '3x22 DMG' },
              { type: 'nuke', label: '☢️ 원자폭탄', desc: '75 DMG' },
            ] as const
          ).map((w) => (
            <button
              key={w.type}
              onClick={() => {
                setSelectedShell(w.type);
                gameStateRef.current.shell = w.type;
              }}
              className={`px-3 py-1.5 rounded-sm border text-xs font-bold ${
                selectedShell === w.type
                  ? 'bg-amber-500 text-stone-950 border-amber-400 scale-105 shadow'
                  : 'bg-stone-900/90 text-stone-300 border-stone-700'
              }`}
            >
              <div>{w.label}</div>
              <div className="text-[9px] text-amber-300">{w.desc}</div>
            </button>
          ))}
        </div>

        <button
          onClick={firePlayer}
          disabled={turn !== 'player'}
          className={`w-full max-w-xs py-2.5 rounded-sm font-bold text-xs tracking-wider transition-all ${
            turn === 'player'
              ? 'bg-red-600 active:bg-red-700 text-white shadow-lg animate-pulse'
              : 'bg-stone-700 text-stone-400 cursor-not-allowed'
          }`}
        >
          {turn === 'player' ? '🔥 곡사포 발사 (FIRE!)' : '적 전차 조준 사격 중...'}
        </button>
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={1000}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setPlayerHp(100);
          setEnemyHp(100);
          setTurn('player');
          const s = gameStateRef.current;
          s.playerHp = 100;
          s.enemyHp = 100;
          s.turn = 'player';
          s.flyingShells = [];
          s.startTime = Date.now();
        }}
      />
    </div>
  );
};

export default PokiTankStarsGame;
