import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMagicBattlegroundGameProps {
  onClose: () => void;
}

interface Mage {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  cardId: number;
  isPlayer: boolean;
  color: string;
  name: string;
  castCooldown: number;
  alive: boolean;
}

interface Spell {
  x: number;
  y: number;
  vx: number;
  vy: number;
  element: 'fire' | 'ice' | 'lightning';
  isPlayer: boolean;
  life: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export default function PokiMagicBattlegroundGame({ onClose }: PokiMagicBattlegroundGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<'fire' | 'ice' | 'lightning'>('fire');
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const stateRef = useRef<{
    player: Mage;
    enemies: Mage[];
    spells: Spell[];
    particles: Particle[];
    arenaRadius: number;
    touchStart: { x: number; y: number } | null;
    isAiming: boolean;
    aimTarget: { x: number; y: number };
  }>({
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      cardId: 61,
      isPlayer: true,
      color: '#3b82f6',
      name: '아케인 마법사',
      castCooldown: 0,
      alive: true
    },
    enemies: [],
    spells: [],
    particles: [],
    arenaRadius: 180,
    touchStart: null,
    isAiming: false,
    aimTarget: { x: 0, y: 0 }
  });

  const selectedSpellRef = useRef<'fire' | 'ice' | 'lightning'>('fire');
  selectedSpellRef.current = selectedSpell;

  // Sound generator
  const playSound = (type: 'cast' | 'hit' | 'explosion' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'cast') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.12);
        osc.frequency.setValueAtTime(784, now + 0.24);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // Audio context may be restricted
    }
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: Math.random() * 20 + 15,
        color,
        size: Math.random() * 4 + 2
      });
    }
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
      const s = stateRef.current;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      s.arenaRadius = Math.min(canvas.width, canvas.height) * 0.42;

      // Init positions if fresh
      if (s.player.x === 0 && s.player.y === 0) {
        s.player.x = cx;
        s.player.y = cy + s.arenaRadius * 0.5;

        // 3 enemies in triangular positions
        s.enemies = [
          {
            x: cx - s.arenaRadius * 0.5,
            y: cy - s.arenaRadius * 0.3,
            vx: 0,
            vy: 0,
            hp: 60,
            maxHp: 60,
            cardId: 17,
            isPlayer: false,
            color: '#ef4444',
            name: '파이어 소서러',
            castCooldown: 60,
            alive: true
          },
          {
            x: cx + s.arenaRadius * 0.5,
            y: cy - s.arenaRadius * 0.3,
            vx: 0,
            vy: 0,
            hp: 60,
            maxHp: 60,
            cardId: 2,
            isPlayer: false,
            color: '#06b6d4',
            name: '프로스트 메이지',
            castCooldown: 90,
            alive: true
          },
          {
            x: cx,
            y: cy - s.arenaRadius * 0.6,
            vx: 0,
            vy: 0,
            hp: 75,
            maxHp: 75,
            cardId: 20,
            isPlayer: false,
            color: '#eab308',
            name: '라이트닝 워록',
            castCooldown: 120,
            alive: true
          }
        ];
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Main Game Loop
    const loop = () => {
      const s = stateRef.current;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Update player
      if (s.player.alive) {
        s.player.x += s.player.vx;
        s.player.y += s.player.vy;
        s.player.vx *= 0.88;
        s.player.vy *= 0.88;

        if (s.player.castCooldown > 0) s.player.castCooldown--;

        // Check if out of arena
        const distFromCenter = Math.hypot(s.player.x - cx, s.player.y - cy);
        if (distFromCenter > s.arenaRadius + 20) {
          s.player.alive = false;
          s.player.hp = 0;
          spawnParticles(s.player.x, s.player.y, '#ef4444', 30);
          setGameOver(true);
        }
      }

      // Update enemies
      let deadCount = 0;
      s.enemies.forEach((enemy) => {
        if (!enemy.alive) {
          deadCount++;
          return;
        }

        // Enemy AI: circle arena and shoot at player
        const distToPlayer = Math.hypot(s.player.x - enemy.x, s.player.y - enemy.y);
        const distToCenter = Math.hypot(enemy.x - cx, enemy.y - cy);

        // Keep inside arena
        if (distToCenter > s.arenaRadius - 30) {
          const angleToCenter = Math.atan2(cy - enemy.y, cx - enemy.x);
          enemy.vx += Math.cos(angleToCenter) * 0.3;
          enemy.vy += Math.sin(angleToCenter) * 0.3;
        } else {
          // Wander/flank
          const wanderAngle = Math.atan2(s.player.y - enemy.y, s.player.x - enemy.x) + Math.PI * 0.5;
          enemy.vx += Math.cos(wanderAngle) * 0.15;
          enemy.vy += Math.sin(wanderAngle) * 0.15;
        }

        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        enemy.vx *= 0.88;
        enemy.vy *= 0.88;

        // Ring out check
        if (distToCenter > s.arenaRadius + 20) {
          enemy.alive = false;
          enemy.hp = 0;
          spawnParticles(enemy.x, enemy.y, enemy.color, 25);
          playSound('explosion');
        }

        // Enemy spell casting
        enemy.castCooldown--;
        if (enemy.castCooldown <= 0 && s.player.alive) {
          enemy.castCooldown = Math.floor(Math.random() * 50) + 70;
          const angle = Math.atan2(s.player.y - enemy.y, s.player.x - enemy.x);
          const spd = 4.5;
          s.spells.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            element: enemy.color === '#ef4444' ? 'fire' : enemy.color === '#06b6d4' ? 'ice' : 'lightning',
            isPlayer: false,
            life: 80
          });
        }
      });

      setEnemiesDefeated(deadCount);
      if (deadCount >= s.enemies.length && !gameWon) {
        setGameWon(true);
        playSound('win');
        const deposit = calculateAndDepositMissionReward({
          gameId: 'pokimagicbattleground',
          gameTitle: 'Magic Battleground',
          isVictory: true,
          score: 1000,
          maxTargetScore: 1000,
          durationSeconds: 30
        });
        setRewardResult(deposit);
      }

      // Update Spells
      for (let i = s.spells.length - 1; i >= 0; i--) {
        const sp = s.spells[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life--;

        // Particle trail
        if (Math.random() < 0.6) {
          const pColor = sp.element === 'fire' ? '#f97316' : sp.element === 'ice' ? '#38bdf8' : '#fbbf24';
          stateRef.current.particles.push({
            x: sp.x,
            y: sp.y,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            life: 1,
            maxLife: 10,
            color: pColor,
            size: 2
          });
        }

        // Collision with player
        if (!sp.isPlayer && s.player.alive) {
          const dist = Math.hypot(sp.x - s.player.x, sp.y - s.player.y);
          if (dist < 24) {
            s.player.hp -= 15;
            // Knockback
            s.player.vx += sp.vx * 0.8;
            s.player.vy += sp.vy * 0.8;
            spawnParticles(s.player.x, s.player.y, '#ef4444', 10);
            playSound('hit');
            s.spells.splice(i, 1);
            if (s.player.hp <= 0) {
              s.player.alive = false;
              setGameOver(true);
            }
            continue;
          }
        }

        // Collision with enemies
        if (sp.isPlayer) {
          let hit = false;
          for (const enemy of s.enemies) {
            if (!enemy.alive) continue;
            const dist = Math.hypot(sp.x - enemy.x, sp.y - enemy.y);
            if (dist < 24) {
              const dmg = sp.element === 'fire' ? 25 : sp.element === 'ice' ? 18 : 30;
              const knock = sp.element === 'lightning' ? 1.5 : 1.1;
              enemy.hp -= dmg;
              enemy.vx += sp.vx * knock;
              enemy.vy += sp.vy * knock;
              spawnParticles(enemy.x, enemy.y, '#f59e0b', 14);
              playSound('hit');
              hit = true;
              if (enemy.hp <= 0) {
                enemy.alive = false;
                spawnParticles(enemy.x, enemy.y, enemy.color, 25);
                playSound('explosion');
              }
              break;
            }
          }
          if (hit) {
            s.spells.splice(i, 1);
            continue;
          }
        }

        if (sp.life <= 0) {
          s.spells.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life >= p.maxLife) {
          s.particles.splice(i, 1);
        }
      }

      // Render
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Magic Arena Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, s.arenaRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#27272a';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#6366f1';
      ctx.stroke();

      // Inner runes circle
      ctx.beginPath();
      ctx.arc(cx, cy, s.arenaRadius * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Draw Aim Line
      if (s.isAiming && s.player.alive) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(s.player.x, s.player.y);
        ctx.lineTo(s.aimTarget.x, s.aimTarget.y);
        ctx.strokeStyle =
          selectedSpellRef.current === 'fire'
            ? 'rgba(249, 115, 22, 0.7)'
            : selectedSpellRef.current === 'ice'
            ? 'rgba(56, 189, 248, 0.7)'
            : 'rgba(250, 204, 21, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Spells
      s.spells.forEach((sp) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 7, 0, Math.PI * 2);
        ctx.fillStyle =
          sp.element === 'fire' ? '#ea580c' : sp.element === 'ice' ? '#0284c7' : '#ca8a04';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      });

      // Draw Particles
      s.particles.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Enemies
      s.enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        drawCardSprite(ctx, enemy.cardId, enemy.x - 22, enemy.y - 22, 44, 44);

        // HP Bar
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(enemy.x - 20, enemy.y - 30, 40, 5);
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x - 20, enemy.y - 30, (enemy.hp / enemy.maxHp) * 40, 5);

        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.name, enemy.x, enemy.y - 34);
      });

      // Draw Player
      if (s.player.alive) {
        drawCardSprite(ctx, s.player.cardId, s.player.x - 24, s.player.y - 24, 48, 48);

        // Player HP Bar
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(s.player.x - 24, s.player.y - 34, 48, 6);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(s.player.x - 24, s.player.y - 34, (s.player.hp / s.player.maxHp) * 48, 6);

        // Player Marker
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', s.player.x, s.player.y - 38);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Touch & Pointer handlers
    const handleTouchStart = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      const tx = t.clientX - rect.left;
      const ty = t.clientY - rect.top;

      stateRef.current.touchStart = { x: tx, y: ty };
      stateRef.current.isAiming = true;
      stateRef.current.aimTarget = { x: tx, y: ty };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!stateRef.current.touchStart) return;
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      const tx = t.clientX - rect.left;
      const ty = t.clientY - rect.top;

      stateRef.current.aimTarget = { x: tx, y: ty };

      // Move player slightly towards touch direction
      const p = stateRef.current.player;
      if (p.alive) {
        const dx = tx - p.x;
        const dy = ty - p.y;
        p.vx += Math.sign(dx) * 0.4;
        p.vy += Math.sign(dy) * 0.4;
      }
    };

    const handleTouchEnd = () => {
      const s = stateRef.current;
      if (s.isAiming && s.player.alive && s.player.castCooldown <= 0) {
        const angle = Math.atan2(s.aimTarget.y - s.player.y, s.aimTarget.x - s.player.x);
        const spd = selectedSpellRef.current === 'lightning' ? 8 : 6;
        s.spells.push({
          x: s.player.x,
          y: s.player.y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          element: selectedSpellRef.current,
          isPlayer: true,
          life: 90
        });
        s.player.castCooldown = selectedSpellRef.current === 'lightning' ? 24 : 15;
        playSound('cast');
      }
      s.isAiming = false;
      s.touchStart = null;
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
        gameTitle="Magic Battleground"
        missionTarget="상대 마법사 3명 전원 장외/제압"
        currentProgress={`${enemiesDefeated} / 3 KO`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Bottom Spell Selector Bar */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4 pointer-events-auto">
          <button
            onClick={() => setSelectedSpell('fire')}
            className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all ${
              selectedSpell === 'fire'
                ? 'bg-orange-600 text-white border-orange-400 shadow-md'
                : 'bg-zinc-900/80 text-orange-400 border-zinc-700'
            }`}
          >
            🔥 파이어볼 (중형 데미지)
          </button>
          <button
            onClick={() => setSelectedSpell('ice')}
            className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all ${
              selectedSpell === 'ice'
                ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                : 'bg-zinc-900/80 text-sky-400 border-zinc-700'
            }`}
          >
            ❄️ 프로스트 (빠른 연사)
          </button>
          <button
            onClick={() => setSelectedSpell('lightning')}
            className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all ${
              selectedSpell === 'lightning'
                ? 'bg-amber-500 text-black border-amber-300 shadow-md'
                : 'bg-zinc-900/80 text-amber-400 border-zinc-700'
            }`}
          >
            ⚡ 라이트닝 (넉백 극대)
          </button>
        </div>

        {/* Game Over Modal */}
        {gameOver && !gameWon && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-none text-center max-w-sm">
              <h2 className="text-xl font-bold text-red-400 mb-2">링 아웃 / 패배</h2>
              <p className="text-xs text-zinc-400 mb-4">아레나 밖으로 밀려나거나 체력이 모두 소진되었습니다.</p>
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
          gameTitle="Magic Battleground"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
