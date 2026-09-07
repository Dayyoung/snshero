import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSwordMastersGameProps {
  onClose: () => void;
}

interface Monster {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  size: number;
  color: string;
  isBoss: boolean;
  name: string;
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

export default function PokiSwordMastersGame({ onClose }: PokiSwordMastersGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [monstersKilled, setMonstersKilled] = useState(0);
  const [bossSpawned, setBossSpawned] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [swordStormReady, setSwordStormReady] = useState(true);

  const stateRef = useRef<{
    player: {
      x: number;
      y: number;
      hp: number;
      maxHp: number;
      swordAngle: number;
      swordLength: number;
      attackRange: number;
      isSpinning: boolean;
      spinTimer: number;
    };
    monsters: Monster[];
    particles: Particle[];
    nextMobId: number;
    kills: number;
    touchPos: { x: number; y: number } | null;
  }>({
    player: {
      x: 0,
      y: 0,
      hp: 150,
      maxHp: 150,
      swordAngle: 0,
      swordLength: 38,
      attackRange: 48,
      isSpinning: false,
      spinTimer: 0
    },
    monsters: [],
    particles: [],
    nextMobId: 1,
    kills: 0,
    touchPos: null
  });

  const playSound = (type: 'slash' | 'storm' | 'hit' | 'boss' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'slash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'storm') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'hit') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'boss') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.4);
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
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {}
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 4 + 1;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        life: 1,
        maxLife: Math.random() * 15 + 10
      });
    }
  };

  const triggerSwordStorm = () => {
    if (!swordStormReady) return;
    setSwordStormReady(false);
    stateRef.current.player.isSpinning = true;
    stateRef.current.player.spinTimer = 90; // ~1.5s
    playSound('storm');

    // 5s cooldown
    setTimeout(() => {
      setSwordStormReady(true);
    }, 5000);
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
      if (stateRef.current.player.x === 0 && stateRef.current.player.y === 0) {
        stateRef.current.player.x = canvas.width / 2;
        stateRef.current.player.y = canvas.height / 2;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let spawnTimer = 0;

    const loop = () => {
      const s = stateRef.current;
      const p = s.player;

      // Player Movement towards Touch
      if (s.touchPos) {
        const dx = s.touchPos.x - p.x;
        const dy = s.touchPos.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 6) {
          p.x += (dx / dist) * 3.5;
          p.y += (dy / dist) * 3.5;
        }
      }

      // Sword Rotation
      if (p.isSpinning) {
        p.swordAngle += 0.45;
        p.spinTimer--;
        if (p.spinTimer <= 0) {
          p.isSpinning = false;
        }
      } else {
        p.swordAngle += 0.08;
      }

      // Keep Player in bounds
      p.x = Math.max(30, Math.min(canvas.width - 30, p.x));
      p.y = Math.max(70, Math.min(canvas.height - 70, p.y));

      // Spawn regular monsters until 20 kills
      spawnTimer++;
      if (s.kills < 20 && s.monsters.length < 7 && spawnTimer > 40) {
        spawnTimer = 0;
        const side = Math.floor(Math.random() * 4);
        let mx = 0,
          my = 0;
        if (side === 0) {
          mx = Math.random() * canvas.width;
          my = 50;
        } else if (side === 1) {
          mx = canvas.width;
          my = Math.random() * canvas.height;
        } else if (side === 2) {
          mx = Math.random() * canvas.width;
          my = canvas.height;
        } else {
          mx = 0;
          my = Math.random() * canvas.height;
        }

        const isSkeleton = Math.random() < 0.4;
        s.monsters.push({
          id: s.nextMobId++,
          x: mx,
          y: my,
          hp: isSkeleton ? 40 : 25,
          maxHp: isSkeleton ? 40 : 25,
          speed: isSkeleton ? 1.6 : 1.2,
          size: isSkeleton ? 20 : 16,
          color: isSkeleton ? '#e2e8f0' : '#22c55e',
          isBoss: false,
          name: isSkeleton ? '스켈레톤 전사' : '슬라임'
        });
      }

      // Spawn Boss when 20 kills reached
      if (s.kills >= 20 && !s.monsters.some((m) => m.isBoss) && !bossSpawned && !gameWon) {
        setBossSpawned(true);
        playSound('boss');
        s.monsters.push({
          id: s.nextMobId++,
          x: canvas.width / 2,
          y: 80,
          hp: 300,
          maxHp: 300,
          speed: 1.4,
          size: 38,
          color: '#ef4444',
          isBoss: true,
          name: '심연의 데몬 로드'
        });
      }

      // Update Monsters & Collision
      const swordTipX = p.x + Math.cos(p.swordAngle) * (p.isSpinning ? p.swordLength * 1.5 : p.swordLength);
      const swordTipY = p.y + Math.sin(p.swordAngle) * (p.isSpinning ? p.swordLength * 1.5 : p.swordLength);

      for (let i = s.monsters.length - 1; i >= 0; i--) {
        const mob = s.monsters[i];

        // Move towards player
        const dx = p.x - mob.x;
        const dy = p.y - mob.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 10) {
          mob.x += (dx / dist) * mob.speed;
          mob.y += (dy / dist) * mob.speed;
        }

        // Damage Player if touching
        if (dist < mob.size + 16) {
          p.hp -= mob.isBoss ? 0.8 : 0.3;
          if (p.hp <= 0 && !gameOver) {
            setGameOver(true);
            playSound('hit');
          }
        }

        // Sword Hit Check
        const distToSword = Math.hypot(swordTipX - mob.x, swordTipY - mob.y);
        const hitThreshold = p.isSpinning ? 40 : 25;

        if (distToSword < mob.size + hitThreshold) {
          const dmg = p.isSpinning ? 6 : 3;
          mob.hp -= dmg;
          // Knockback
          mob.x -= (dx / dist) * (p.isSpinning ? 8 : 4);
          mob.y -= (dy / dist) * (p.isSpinning ? 8 : 4);
          spawnParticles(mob.x, mob.y, '#f59e0b', 4);
          playSound('slash');

          if (mob.hp <= 0) {
            spawnParticles(mob.x, mob.y, mob.color, mob.isBoss ? 40 : 15);
            s.monsters.splice(i, 1);
            if (mob.isBoss) {
              setGameWon(true);
              playSound('win');
              const deposit = calculateAndDepositMissionReward({
                gameId: 'pokiswordmasters',
                gameTitle: 'Sword Masters',
                isVictory: true,
                score: 1000,
                maxTargetScore: 1000,
                durationSeconds: 30
              });
              setRewardResult(deposit);
            } else {
              s.kills++;
              setMonstersKilled(s.kills);
            }
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

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dungeon Floor Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Particles
      s.particles.forEach((pt) => {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Monsters
      s.monsters.forEach((mob) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(mob.x, mob.y, mob.size, 0, Math.PI * 2);
        ctx.fillStyle = mob.color;
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(mob.x - mob.size * 0.3, mob.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(mob.x + mob.size * 0.3, mob.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // HP Bar
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(mob.x - mob.size, mob.y - mob.size - 10, mob.size * 2, 4);
        ctx.fillStyle = mob.isBoss ? '#ef4444' : '#22c55e';
        ctx.fillRect(
          mob.x - mob.size,
          mob.y - mob.size - 10,
          (mob.hp / mob.maxHp) * mob.size * 2,
          4
        );

        if (mob.isBoss) {
          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('BOSS: 데몬 로드', mob.x, mob.y - mob.size - 14);
        }
        ctx.restore();
      });

      // Draw Sword Spin Effect if spinning
      if (p.isSpinning) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.swordLength * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Player Card Sprite
      drawCardSprite(ctx, 63, p.x - 22, p.y - 22, 44, 44);

      // Draw Sword
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.swordAngle);
      ctx.fillStyle = '#94a3b8';
      const sLen = p.isSpinning ? p.swordLength * 1.5 : p.swordLength;
      ctx.fillRect(0, -3, sLen, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(sLen - 8, -4, 8, 8); // Sword Gem
      ctx.restore();

      // Player HP Bar
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(p.x - 24, p.y - 34, 48, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(p.x - 24, p.y - 34, (p.hp / p.maxHp) * 48, 6);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Touch Event Handling
    const handleTouchStart = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      stateRef.current.touchPos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      stateRef.current.touchPos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };

    const handleTouchEnd = () => {
      stateRef.current.touchPos = null;
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
  }, [gameWon, bossSpawned]);

  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Sword Masters"
        missionTarget={bossSpawned ? '거대 던전 보스 처치' : '몬스터 20마리 격파'}
        currentProgress={bossSpawned ? '보스전 진행 중!' : `${monstersKilled} / 20 처치`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Sword Storm Skill Button */}
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <button
            onClick={triggerSwordStorm}
            disabled={!swordStormReady}
            className={`px-5 py-3 rounded-sm font-bold text-xs border transition-all ${
              swordStormReady
                ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400 shadow-lg active:scale-95'
                : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
            }`}
          >
            ⚔️ 소드 스톰 {swordStormReady ? '(준비 완료)' : '(쿨다운)'}
          </button>
        </div>

        {/* Game Over Modal */}
        {gameOver && !gameWon && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-none text-center max-w-sm">
              <h2 className="text-xl font-bold text-red-400 mb-2">던전에서 쓰러짐!</h2>
              <p className="text-xs text-zinc-400 mb-4">몬스터들의 파상공격에 체력을 모두 소진했습니다.</p>
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
          gameTitle="Sword Masters"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
