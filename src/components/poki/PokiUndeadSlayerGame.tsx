import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiUndeadSlayerGameProps {
  onBack: () => void;
}

const TARGET_KILLS = 25;

interface Monster {
  x: number;
  y: number;
  hp: number;
  speed: number;
  type: 'skeleton' | 'zombie' | 'boss';
  size: number;
}

export const PokiUndeadSlayerGame: React.FC<PokiUndeadSlayerGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [kills, setKills] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [whirlwindReady, setWhirlwindReady] = useState(true);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    playerX: number;
    playerY: number;
    targetX: number;
    targetY: number;
    playerHp: number;
    kills: number;
    gameWon: boolean;
    slashTimer: number;
    whirlwindCooldown: number;
    isWhirlwinding: boolean;
    monsters: Monster[];
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    playerX: 200,
    playerY: 300,
    targetX: 200,
    targetY: 300,
    playerHp: 100,
    kills: 0,
    gameWon: false,
    slashTimer: 0,
    whirlwindCooldown: 0,
    isWhirlwinding: false,
    monsters: [],
    particles: [],
  });

  const triggerWhirlwind = () => {
    const st = stateRef.current;
    if (st.whirlwindCooldown > 0 || st.gameWon) return;

    st.isWhirlwinding = true;
    st.whirlwindCooldown = 300; // 5 seconds cooldown
    setWhirlwindReady(false);

    // Whirlwind slice all nearby monsters
    st.monsters.forEach((m) => {
      const dist = Math.hypot(m.x - st.playerX, m.y - st.playerY);
      if (dist < 110) {
        m.hp -= 80;
        // Knockback
        const angle = Math.atan2(m.y - st.playerY, m.x - st.playerX);
        m.x += Math.cos(angle) * 40;
        m.y += Math.sin(angle) * 40;
      }
    });

    // Whirlwind particles
    for (let i = 0; i < 30; i++) {
      const angle = (i * Math.PI * 2) / 30;
      st.particles.push({
        x: st.playerX + Math.cos(angle) * 50,
        y: st.playerY + Math.sin(angle) * 50,
        vx: Math.cos(angle) * 5,
        vy: Math.sin(angle) * 5,
        color: '#38bdf8',
        life: 0.8,
      });
    }

    setTimeout(() => {
      st.isWhirlwinding = false;
    }, 400);
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

      // Dark Crypt Dungeon Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 100, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('UNDEAD SLAYER // 언데드 슬레이어', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`토벌: ${st.kills}/${TARGET_KILLS} | HP: ${Math.floor(st.playerHp)}%`, 84, 56);

      // Cooldown decrement
      if (st.whirlwindCooldown > 0) {
        st.whirlwindCooldown -= 1;
        if (st.whirlwindCooldown <= 0) setWhirlwindReady(true);
      }

      // Move player towards touch target
      const dx = st.targetX - st.playerX;
      const dy = st.targetY - st.playerY;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        const speed = 3.6;
        st.playerX += (dx / dist) * Math.min(speed, dist);
        st.playerY += (dy / dist) * Math.min(speed, dist);
      }

      // Spawn Undead Monsters
      if (st.monsters.length < 7 && st.kills + st.monsters.length < TARGET_KILLS) {
        const edge = Math.floor(Math.random() * 4);
        let mx = 0, my = 0;
        if (edge === 0) { mx = Math.random() * w; my = 90; }
        else if (edge === 1) { mx = w; my = Math.random() * (h - 90) + 90; }
        else if (edge === 2) { mx = Math.random() * w; my = h - 20; }
        else { mx = 0; my = Math.random() * (h - 90) + 90; }

        const isBoss = st.kills >= 20 && !st.monsters.some((m) => m.type === 'boss');

        st.monsters.push({
          x: mx,
          y: my,
          hp: isBoss ? 200 : 35,
          speed: isBoss ? 1.0 : 1.6 + Math.random() * 0.8,
          type: isBoss ? 'boss' : Math.random() > 0.5 ? 'skeleton' : 'zombie',
          size: isBoss ? 24 : 14,
        });
      }

      // Auto Sword Slash attack against nearest monster
      st.slashTimer += 1;
      if (st.slashTimer >= 15) {
        st.slashTimer = 0;
        let nearest: Monster | null = null;
        let minDist = 65;

        st.monsters.forEach((m) => {
          const d = Math.hypot(m.x - st.playerX, m.y - st.playerY);
          if (d < minDist) {
            minDist = d;
            nearest = m;
          }
        });

        if (nearest) {
          (nearest as Monster).hp -= 25;
          // Slash arc effect
          for (let p = 0; p < 8; p++) {
            st.particles.push({
              x: (nearest as Monster).x,
              y: (nearest as Monster).y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: '#f8fafc',
              life: 0.6,
            });
          }
        }
      }

      // Update & Draw Monsters
      for (let i = st.monsters.length - 1; i >= 0; i--) {
        const m = st.monsters[i];

        // Move towards player
        const mdx = st.playerX - m.x;
        const mdy = st.playerY - m.y;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist > 12) {
          m.x += (mdx / mdist) * m.speed;
          m.y += (mdy / mdist) * m.speed;
        } else {
          // Attack player
          st.playerHp = Math.max(0, st.playerHp - 0.2);
          setPlayerHp(Math.floor(st.playerHp));
        }

        // Draw Monster
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fillStyle = m.type === 'boss' ? '#dc2626' : m.type === 'skeleton' ? '#e2e8f0' : '#15803d';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = `${Math.floor(m.size * 1.2)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.type === 'boss' ? '👿' : m.type === 'skeleton' ? '💀' : '🧟', m.x, m.y);

        // Monster death check
        if (m.hp <= 0) {
          st.monsters.splice(i, 1);
          st.kills += 1;
          setKills(st.kills);

          // Death burst particles
          for (let p = 0; p < 15; p++) {
            st.particles.push({
              x: m.x,
              y: m.y,
              vx: (Math.random() - 0.5) * 7,
              vy: (Math.random() - 0.5) * 7,
              color: '#ef4444',
              life: 0.9,
            });
          }

          if (st.kills >= TARGET_KILLS && !st.gameWon) {
            st.gameWon = true;
            setGameWon(true);
            const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
            const receipt = calculateAndDepositMissionReward({
              gameId: 'undead-slayer',
              gameTitle: 'Undead Slayer',
              score: st.kills * 100,
              durationSeconds: duration,
            });
            setRewardReceipt(receipt);
          }
        }
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      // Draw Player Hero (Undead Slayer)
      ctx.save();
      ctx.translate(st.playerX, st.playerY);

      // Whirlwind Slash visual aura
      if (st.isWhirlwinding) {
        ctx.beginPath();
        ctx.arc(0, 0, 90, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Slayer Body
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Slayer Greatsword
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(12, -4, 22, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, -8, 4, 16);

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
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
      }

      // Whirlwind Skill Button at bottom-right
      ctx.fillStyle = st.whirlwindCooldown <= 0 ? '#38bdf8' : '#64748b';
      ctx.beginPath();
      ctx.arc(w - 55, h - 55, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (st.whirlwindCooldown <= 0) {
        ctx.fillText('회전참격', w - 55, h - 55);
      } else {
        ctx.fillText(`${Math.ceil(st.whirlwindCooldown / 60)}s`, w - 55, h - 55);
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      // Bottom Instructions
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText('[ 화면 터치 이동 & 자동 연속 검격 토벌 ]', 20, h - 15);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    // Check click on Whirlwind button
    const w = canvas.width;
    const h = canvas.height;
    const btnDist = Math.hypot(px - (w - 55), py - (h - 55));
    if (btnDist <= 35) {
      triggerWhirlwind();
      return;
    }

    stateRef.current.targetX = px;
    stateRef.current.targetY = py;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Undead Slayer"
        score={kills}
        targetScore={TARGET_KILLS}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointer}
          onPointerMove={(e) => {
            if (e.buttons > 0) handlePointer(e);
          }}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm cursor-crosshair"
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

export default PokiUndeadSlayerGame;

