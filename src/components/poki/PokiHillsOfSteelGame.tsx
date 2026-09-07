import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiHillsOfSteelGameProps {
  onClose: () => void;
}

interface Enemy {
  id: number;
  type: 'tank' | 'heli';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  shootCooldown: number;
  alive: boolean;
}

interface Shell {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

export default function PokiHillsOfSteelGame({ onClose }: PokiHillsOfSteelGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tanksDefeated, setTanksDefeated] = useState(0);
  const [helisDefeated, setHelisDefeated] = useState(0);
  const [airStrikeReady, setAirStrikeReady] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const stateRef = useRef<{
    player: {
      x: number;
      y: number;
      angle: number;
      hp: number;
      maxHp: number;
      speed: number;
      reloadTimer: number;
    };
    enemies: Enemy[];
    shells: Shell[];
    particles: Particle[];
    touchDirection: 'left' | 'right' | null;
  }>({
    player: {
      x: 100,
      y: 0,
      angle: 0,
      hp: 120,
      maxHp: 120,
      speed: 0,
      reloadTimer: 0
    },
    enemies: [],
    shells: [],
    particles: [],
    touchDirection: null
  });

  // Hill function: returns ground height at x
  const getHillY = (x: number, baseH: number) => {
    return (
      baseH +
      Math.sin(x * 0.008) * 35 +
      Math.cos(x * 0.016) * 18 +
      Math.sin(x * 0.03) * 8
    );
  };

  const playSound = (type: 'fire' | 'hit' | 'airstrike' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'fire') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'airstrike') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
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

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 4 + 1;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color,
        life: 1,
        maxLife: Math.random() * 15 + 10
      });
    }
  };

  const triggerAirStrike = () => {
    if (!airStrikeReady) return;
    setAirStrikeReady(false);
    playSound('airstrike');

    const s = stateRef.current;
    // Bomb all active enemies
    s.enemies.forEach((en) => {
      if (en.alive) {
        en.hp -= 40;
        spawnParticles(en.x, en.y, '#f59e0b', 20);
        if (en.hp <= 0) en.alive = false;
      }
    });

    setTimeout(() => {
      setAirStrikeReady(true);
    }, 6000);
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

    // Init Enemies
    stateRef.current.enemies = [
      { id: 1, type: 'tank', x: 450, y: 0, hp: 45, maxHp: 45, speed: 0.8, shootCooldown: 60, alive: true },
      { id: 2, type: 'tank', x: 680, y: 0, hp: 45, maxHp: 45, speed: 0.8, shootCooldown: 100, alive: true },
      { id: 3, type: 'heli', x: 800, y: 120, hp: 35, maxHp: 35, speed: 1.2, shootCooldown: 80, alive: true },
      { id: 4, type: 'tank', x: 1050, y: 0, hp: 55, maxHp: 55, speed: 0.8, shootCooldown: 70, alive: true },
      { id: 5, type: 'heli', x: 1300, y: 110, hp: 40, maxHp: 40, speed: 1.2, shootCooldown: 90, alive: true },
      { id: 6, type: 'tank', x: 1550, y: 0, hp: 70, maxHp: 70, speed: 0.8, shootCooldown: 60, alive: true }
    ];

    const loop = () => {
      const s = stateRef.current;
      const baseGroundY = canvas.height * 0.72;

      // Player Movement
      if (s.touchDirection === 'left') {
        s.player.speed = Math.max(-2.5, s.player.speed - 0.2);
      } else if (s.touchDirection === 'right') {
        s.player.speed = Math.min(3.2, s.player.speed + 0.2);
      } else {
        s.player.speed *= 0.9;
      }

      s.player.x = Math.max(40, s.player.x + s.player.speed);

      // Player slope angle on hill
      const y1 = getHillY(s.player.x - 15, baseGroundY);
      const y2 = getHillY(s.player.x + 15, baseGroundY);
      s.player.y = (y1 + y2) / 2;
      s.player.angle = Math.atan2(y2 - y1, 30);

      // Player Auto Shoot
      s.player.reloadTimer--;
      if (s.player.reloadTimer <= 0) {
        s.player.reloadTimer = 35;
        // Fire shell in slope / facing direction
        const shootAng = s.player.angle - 0.22;
        const spd = 12;
        s.shells.push({
          x: s.player.x + Math.cos(shootAng) * 25,
          y: s.player.y - 12 + Math.sin(shootAng) * 25,
          vx: Math.cos(shootAng) * spd,
          vy: Math.sin(shootAng) * spd,
          isPlayer: true
        });
        playSound('fire');
      }

      // Camera Offset
      const camX = s.player.x - canvas.width * 0.25;

      // Update Enemies
      let deadTanks = 0;
      let deadHelis = 0;

      s.enemies.forEach((en) => {
        if (!en.alive) {
          if (en.type === 'tank') deadTanks++;
          else deadHelis++;
          return;
        }

        // Move towards player
        if (en.x > s.player.x + 120) {
          en.x -= en.speed;
        }

        if (en.type === 'tank') {
          en.y = getHillY(en.x, baseGroundY);
        }

        // Enemy Shoot
        en.shootCooldown--;
        if (en.shootCooldown <= 0 && en.x - s.player.x < canvas.width * 0.8) {
          en.shootCooldown = 90;
          const ang = Math.atan2(s.player.y - en.y, s.player.x - en.x);
          s.shells.push({
            x: en.x,
            y: en.y - 10,
            vx: Math.cos(ang) * 7,
            vy: Math.sin(ang) * 7,
            isPlayer: false
          });
        }
      });

      setTanksDefeated(deadTanks);
      setHelisDefeated(deadHelis);

      if (deadTanks >= 4 && deadHelis >= 2 && !gameWon) {
        setGameWon(true);
        playSound('win');
        const deposit = calculateAndDepositMissionReward({
          gameId: 'pokihillsofsteel',
          gameTitle: 'Hills of Steel',
          isVictory: true,
          score: 1000,
          maxTargetScore: 1000,
          durationSeconds: 30
        });
        setRewardResult(deposit);
      }

      // Update Shells
      for (let i = s.shells.length - 1; i >= 0; i--) {
        const sh = s.shells[i];
        sh.x += sh.vx;
        sh.y += sh.vy;
        sh.vy += 0.22; // Gravity arc

        // Hit Ground
        const groundY = getHillY(sh.x, baseGroundY);
        if (sh.y >= groundY) {
          spawnParticles(sh.x, sh.y, '#71717a', 8);
          s.shells.splice(i, 1);
          continue;
        }

        // Hit Player
        if (!sh.isPlayer) {
          const dist = Math.hypot(sh.x - s.player.x, sh.y - (s.player.y - 10));
          if (dist < 22) {
            s.player.hp -= 12;
            spawnParticles(s.player.x, s.player.y - 10, '#ef4444', 12);
            playSound('hit');
            s.shells.splice(i, 1);
            if (s.player.hp <= 0 && !gameOver) {
              setGameOver(true);
            }
            continue;
          }
        }

        // Hit Enemies
        if (sh.isPlayer) {
          let hit = false;
          for (const en of s.enemies) {
            if (!en.alive) continue;
            const dist = Math.hypot(sh.x - en.x, sh.y - en.y);
            if (dist < 26) {
              en.hp -= 20;
              spawnParticles(en.x, en.y, '#f59e0b', 14);
              playSound('hit');
              hit = true;
              if (en.hp <= 0) {
                en.alive = false;
                spawnParticles(en.x, en.y, '#ef4444', 25);
              }
              break;
            }
          }
          if (hit) {
            s.shells.splice(i, 1);
            continue;
          }
        }
      }

      // Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        if (pt.life >= pt.maxLife) {
          s.particles.splice(i, 1);
        }
      }

      // RENDER
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Sun / Clouds
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(canvas.width - 80, 80, 32, 0, Math.PI * 2);
      ctx.fill();

      // Draw Hills Ground
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let sx = 0; sx <= canvas.width; sx += 8) {
        const wx = camX + sx;
        const gy = getHillY(wx, baseGroundY);
        ctx.lineTo(sx, gy);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.fillStyle = '#15803d'; // Green Hill
      ctx.fill();
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // Draw Particles
      s.particles.forEach((pt) => {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x - camX, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Shells
      s.shells.forEach((sh) => {
        ctx.fillStyle = sh.isPlayer ? '#38bdf8' : '#ef4444';
        ctx.beginPath();
        ctx.arc(sh.x - camX, sh.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Enemies
      s.enemies.forEach((en) => {
        if (!en.alive) return;
        const sx = en.x - camX;
        if (sx < -50 || sx > canvas.width + 50) return;

        if (en.type === 'tank') {
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(sx - 20, en.y - 12, 40, 14);
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(sx - 12, en.y - 20, 24, 8);
          // Gun barrel
          ctx.fillRect(sx - 26, en.y - 18, 14, 4);
        } else {
          // Heli
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.ellipse(sx, en.y, 22, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          // Rotor
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx - 26, en.y - 14);
          ctx.lineTo(sx + 26, en.y - 14);
          ctx.stroke();
        }

        // Enemy HP
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(sx - 18, en.y - 28, 36, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(sx - 18, en.y - 28, (en.hp / en.maxHp) * 36, 4);
      });

      // Draw Player Tank & Card Sprite
      ctx.save();
      const psx = s.player.x - camX;
      ctx.translate(psx, s.player.y);
      ctx.rotate(s.player.angle);

      // Tracks
      ctx.fillStyle = '#334155';
      ctx.fillRect(-22, -6, 44, 8);

      // Hull
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-18, -16, 36, 10);

      // Cannon Barrel
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(8, -20, 22, 5);

      // Card Sprite as Commander
      drawCardSprite(ctx, 66, -12, -38, 26, 26);

      ctx.restore();

      // Player HP Bar (above tank on screen)
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(psx - 22, s.player.y - 50, 44, 6);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(psx - 22, s.player.y - 50, (s.player.hp / s.player.maxHp) * 44, 6);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Touch Event Handling
    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t.clientX < window.innerWidth / 2) {
        stateRef.current.touchDirection = 'left';
      } else {
        stateRef.current.touchDirection = 'right';
      }
    };

    const handleTouchEnd = () => {
      stateRef.current.touchDirection = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameWon]);

  return (
    <div className="relative w-full h-full bg-zinc-950 flex flex-col select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Hills of Steel"
        missionTarget="적 지상 전차 4대 & 전투 헬기 2대 전멸"
        currentProgress={`전차: ${tanksDefeated}/4 | 헬기: ${helisDefeated}/2`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Air Strike Button */}
        <div className="absolute top-3 right-4 pointer-events-auto">
          <button
            onClick={triggerAirStrike}
            disabled={!airStrikeReady}
            className={`px-3 py-1.5 rounded-sm font-bold text-xs border transition-all ${
              airStrikeReady
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 shadow-md active:scale-95'
                : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
            }`}
          >
            ✈️ 공중 폭격 {airStrikeReady ? '(준비됨)' : '(대기중)'}
          </button>
        </div>

        {/* Bottom Touch Guide */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-6 pointer-events-none">
          <span className="bg-zinc-900/80 text-zinc-400 border border-zinc-700 px-3 py-1.5 text-xs rounded-sm">
            ◀ 화면 왼쪽 탭: 후진
          </span>
          <span className="bg-zinc-900/80 text-zinc-400 border border-zinc-700 px-3 py-1.5 text-xs rounded-sm">
            화면 오른쪽 탭: 전진 ▶
          </span>
        </div>

        {/* Game Over Modal */}
        {gameOver && !gameWon && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-none text-center max-w-sm">
              <h2 className="text-xl font-bold text-red-400 mb-2">전차 대파!</h2>
              <p className="text-xs text-zinc-400 mb-4">적의 집중 포화에 전차가 파괴되었습니다.</p>
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
          gameTitle="Hills of Steel"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
