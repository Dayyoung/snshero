import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMineFunGameProps {
  onBack?: () => void;
  onExit?: () => void;
  onClose?: () => void;
  deck?: any[];
  cardId?: number;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onReward?: (amount: number) => void;
}

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'stone' | 'coal' | 'iron' | 'gold' | 'diamond';
  hp: number;
  maxHp: number;
}

interface Monster {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
}

export const PokiMineFunGame: React.FC<PokiMineFunGameProps> = ({
  onBack,
  onExit,
  onClose,
  deck = [],
  cardId,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 3;

  const [score, setScore] = useState(0);
  const [minerals, setMinerals] = useState({ stone: 0, iron: 0, diamond: 0 });
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    score: 0,
    minerals: { stone: 0, iron: 0, diamond: 0 },
    blocks: [] as Block[],
    monsters: [] as Monster[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    won: false,
    startTime: Date.now()
  });

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch {}
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const tx = t.clientX - rect.left;
    const ty = t.clientY - rect.top;
    const gs = gameStateRef.current;

    // Check hit monsters first
    for (let i = gs.monsters.length - 1; i >= 0; i--) {
      const m = gs.monsters[i];
      if (Math.hypot(m.x - tx, m.y - ty) < 36) {
        m.hp--;
        triggerHaptic(25);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        for (let p = 0; p < 6; p++) {
          gs.particles.push({
            x: m.x,
            y: m.y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            color: '#ef4444',
            life: 15
          });
        }
        if (m.hp <= 0) {
          gs.monsters.splice(i, 1);
          gs.score += 80;
          setScore(gs.score);
        }
        return;
      }
    }

    // Check hit blocks
    for (let i = gs.blocks.length - 1; i >= 0; i--) {
      const b = gs.blocks[i];
      if (tx >= b.x && tx <= b.x + b.w && ty >= b.y && ty <= b.y + b.h) {
        b.hp--;
        triggerHaptic(15);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        // Mining particles
        const pColor = b.type === 'diamond' ? '#38bdf8' : b.type === 'gold' ? '#fbbf24' : b.type === 'iron' ? '#cbd5e1' : '#64748b';
        for (let p = 0; p < 5; p++) {
          gs.particles.push({
            x: tx,
            y: ty,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: pColor,
            life: 15
          });
        }
        if (b.hp <= 0) {
          if (b.type === 'diamond') { gs.minerals.diamond++; gs.score += 150; }
          else if (b.type === 'gold' || b.type === 'iron') { gs.minerals.iron++; gs.score += 60; }
          else { gs.minerals.stone++; gs.score += 20; }
          setMinerals({ ...gs.minerals });
          setScore(gs.score);
          gs.blocks.splice(i, 1);
        }
        break;
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initGrid();
    };

    const initGrid = () => {
      const gs = gameStateRef.current;
      gs.blocks = [];
      const cols = 5;
      const bw = Math.floor(canvas.width / cols);
      const startY = canvas.height * 0.35;
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < cols; c++) {
          const rand = Math.random();
          const type = rand < 0.1 ? 'diamond' : rand < 0.25 ? 'gold' : rand < 0.45 ? 'iron' : rand < 0.65 ? 'coal' : 'stone';
          const hp = type === 'diamond' ? 4 : type === 'gold' || type === 'iron' ? 3 : 2;
          gs.blocks.push({
            x: c * bw + 4,
            y: startY + r * (bw * 0.85),
            w: bw - 8,
            h: bw * 0.85 - 8,
            type,
            hp,
            maxHp: hp
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let monsterTimer = 0;

    const loop = () => {
      const gs = gameStateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      if (!gs.won) {
        // Monster spawn
        monsterTimer++;
        if (monsterTimer > 110 && gs.monsters.length < 3) {
          monsterTimer = 0;
          gs.monsters.push({
            x: Math.random() < 0.5 ? -20 : w + 20,
            y: h * 0.2 + Math.random() * (h * 0.4),
            hp: 2,
            maxHp: 2,
            speed: 1.2
          });
        }

        // Move monsters toward center
        for (const m of gs.monsters) {
          const targetX = w / 2;
          const targetY = h * 0.2;
          const angle = Math.atan2(targetY - m.y, targetX - m.x);
          m.x += Math.cos(angle) * m.speed;
          m.y += Math.sin(angle) * m.speed;
        }

        // Particles
        for (let i = gs.particles.length - 1; i >= 0; i--) {
          const p = gs.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          if (p.life <= 0) gs.particles.splice(i, 1);
        }

        // Victory check
        if (gs.score >= 500 && !gs.won) {
          gs.won = true;
          triggerHaptic(60);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          const elapsedSec = Math.max(5, Math.floor((Date.now() - gs.startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki_minefun',
            gameTitle: isKo ? '마인펀 샌드박스' : 'MineFun.io',
            durationSeconds: elapsedSec,
            score: gs.score,
            maxTargetScore: 500,
            isVictory: true
          });
          setRewardReceipt(receipt);
          setGameWon(true);
          onReward?.(receipt.totalSns);
        }
      }

      // Drawing
      ctx.clearRect(0, 0, w, h);

      // Sky & Underworld
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Miner Hero Avatar
      const heroSize = 56;
      drawCardSprite(ctx, effectiveCardId, w / 2 - heroSize / 2, h * 0.16, heroSize, heroSize, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#fbbf24',
        shadowBlur: 10,
        shadowColor: 'rgba(251, 191, 36, 0.6)'
      });

      // Blocks
      for (const b of gs.blocks) {
        const color = b.type === 'diamond' ? '#0284c7' : b.type === 'gold' ? '#d97706' : b.type === 'iron' ? '#94a3b8' : b.type === 'coal' ? '#1e293b' : '#475569';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 6);
        ctx.fill();

        // Cracks
        if (b.hp < b.maxHp) {
          ctx.strokeStyle = 'rgba(0,0,0,0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x + b.w * 0.3, b.y + 4);
          ctx.lineTo(b.x + b.w * 0.6, b.y + b.h - 4);
          ctx.stroke();
        }

        // Mineral Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = b.type === 'diamond' ? '💎' : b.type === 'gold' ? '🪙' : b.type === 'iron' ? '⚙️' : '🪨';
        ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2);
      }

      // Monsters
      for (const m of gs.monsters) {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('👾 ZOMBIE', m.x, m.y - 20);
      }

      // Particles
      for (const p of gs.particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bottom guidance
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '블록을 탭하여 채굴 | 접근하는 몬스터를 탭하여 격퇴' : 'Tap blocks to mine | Tap monsters to attack', w / 2, h - 30);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, isKo, onReward, playSfx]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={handleTouchStart}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <MinimalistMissionHUD
        title={isKo ? '마인펀 샌드박스' : 'MineFun.io'}
        score={score}
        targetScore={500}
        stageInfo={`💎 ${minerals.diamond} | ⚙️ ${minerals.iron}`}
        onExit={handleExit}
        unit="pt"
      />

      {gameWon && (
        <VictoryRewardModal
          isOpen={gameWon}
          rewardReceipt={rewardReceipt}
          onClose={handleExit}
          onClaimBonus={handleExit}
          language={isKo ? 'ko' : 'en'}
        />
      )}
    </div>
  );
};

export default PokiMineFunGame;
