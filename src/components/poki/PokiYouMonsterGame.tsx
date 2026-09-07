import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiYouMonsterGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Building {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  collapsed: boolean;
}

interface ArmyUnit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'tank' | 'copter';
}

export const PokiYouMonsterGame: React.FC<PokiYouMonsterGameProps> = ({ onBack, cardId = 54 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rampageScore, setRampageScore] = useState(0);
  const [monsterSize, setMonsterSize] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    monsterX: 200,
    monsterY: 350,
    targetX: 200,
    targetY: 350,
    sizeScale: 1,
    score: 0,
    buildings: [] as Building[],
    army: [] as ArmyUnit[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number; size: number }[],
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
      s.monsterX = canvas.width / 2;
      s.monsterY = canvas.height * 0.6;
      s.targetX = s.monsterX;
      s.targetY = s.monsterY;

      // Spawn city buildings
      s.buildings = [];
      const cols = 5;
      const rows = 3;
      const bW = Math.min(55, Math.floor(canvas.width / 7));
      const bH = 75;
      const startX = (canvas.width - cols * (bW + 16)) / 2;
      const startY = 110;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          s.buildings.push({
            x: startX + c * (bW + 16),
            y: startY + r * (bH + 20),
            w: bW,
            h: bH,
            hp: 60,
            maxHp: 60,
            collapsed: false,
          });
        }
      }

      // Spawn army
      s.army = [];
      for (let i = 0; i < 4; i++) {
        s.army.push({
          x: Math.random() * canvas.width,
          y: canvas.height * 0.75 + Math.random() * 80,
          vx: (Math.random() - 0.5) * 2,
          vy: 0,
          type: i % 2 === 0 ? 'tank' : 'copter',
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const state = gameStateRef.current;

      // Smooth monster follow
      state.monsterX += (state.targetX - state.monsterX) * 0.12;
      state.monsterY += (state.targetY - state.monsterY) * 0.12;

      const monsterRadius = 32 * state.sizeScale;

      // Check collision with buildings
      for (const b of state.buildings) {
        if (b.collapsed) continue;
        if (
          state.monsterX + monsterRadius > b.x &&
          state.monsterX - monsterRadius < b.x + b.w &&
          state.monsterY + monsterRadius > b.y &&
          state.monsterY - monsterRadius < b.y + b.h
        ) {
          b.hp -= 3;
          if (b.hp <= 0) {
            b.collapsed = true;
            state.score += 70;
            state.sizeScale = Math.min(1.8, state.sizeScale + 0.05);
            setRampageScore(state.score);
            setMonsterSize(Number(state.sizeScale.toFixed(2)));

            // Rubble explosion particles
            for (let k = 0; k < 18; k++) {
              state.particles.push({
                x: b.x + b.w / 2,
                y: b.y + b.h / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: '#78716c',
                life: 25,
                size: 4 + Math.random() * 4,
              });
            }

            // Win condition: 1,000 score
            if (state.score >= 1000 && !gameWon) {
              setGameWon(true);
              setGameOver(true);
              const reward = calculateAndDepositMissionReward({
                gameId: 'pokiyoumonster',
                gameTitle: 'You Monster!',
                isVictory: true,
                score: 1000,
                maxTargetScore: 1000,
                durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
              });
              setRewardResult(reward);
              return;
            }
          }
        }
      }

      // Update Army units
      for (let i = state.army.length - 1; i >= 0; i--) {
        const u = state.army[i];
        u.x += u.vx;
        if (u.x < 20 || u.x > canvas.width - 20) u.vx *= -1;

        // Crush by monster
        const dist = Math.hypot(u.x - state.monsterX, u.y - state.monsterY);
        if (dist < monsterRadius + 15) {
          state.score += 50;
          setRampageScore(state.score);
          state.particles.push({
            x: u.x,
            y: u.y,
            vx: 0,
            vy: -2,
            color: '#ef4444',
            life: 20,
            size: 6,
          });
          state.army.splice(i, 1);

          // Respawn
          state.army.push({
            x: Math.random() < 0.5 ? 20 : canvas.width - 20,
            y: canvas.height * 0.75 + Math.random() * 60,
            vx: (Math.random() - 0.5) * 2,
            vy: 0,
            type: Math.random() < 0.5 ? 'tank' : 'copter',
          });
        }
      }

      // Drawing
      // Smoky destroyed city background
      ctx.fillStyle = '#292524';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Roads
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, canvas.height * 0.42, canvas.width, 36);
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, 40);

      // Draw Buildings
      for (const b of state.buildings) {
        if (b.collapsed) {
          ctx.fillStyle = '#44403c';
          ctx.fillRect(b.x, b.y + b.h - 15, b.w, 15);
        } else {
          ctx.fillStyle = '#57534e';
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = '#292524';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y, b.w, b.h);

          // Windows
          ctx.fillStyle = '#fef08a';
          for (let wy = b.y + 10; wy < b.y + b.h - 10; wy += 15) {
            ctx.fillRect(b.x + 8, wy, 8, 8);
            ctx.fillRect(b.x + b.w - 16, wy, 8, 8);
          }

          // HP bar
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(b.x, b.y - 6, (b.hp / b.maxHp) * b.w, 3);
        }
      }

      // Draw Army Units
      for (const u of state.army) {
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(u.type === 'tank' ? '🚜' : '🚁', u.x, u.y);
      }

      // Draw Monster Kaiju (Card Sprite scaled)
      const mW = 64 * state.sizeScale;
      const mH = 80 * state.sizeScale;
      drawCardSprite(ctx, cardId, state.monsterX - mW / 2, state.monsterY - mH / 2, mW, mH);

      // Stomp shockwave aura
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.monsterX, state.monsterY + mH * 0.35, monsterRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Particles
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
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [cardId, gameOver, gameWon]);

  const handlePointer = (clientX: number, clientY: number) => {
    gameStateRef.current.targetX = clientX;
    gameStateRef.current.targetY = clientY;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#292524] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="You Monster!"
        score={rampageScore}
        targetScore={1000}
        lives={Math.floor(monsterSize * 10)}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-pointer"
        onMouseMove={(e) => handlePointer(e.clientX, e.clientY)}
        onMouseDown={(e) => handlePointer(e.clientX, e.clientY)}
        onTouchMove={(e) => {
          const t = e.touches[0];
          handlePointer(t.clientX, t.clientY);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handlePointer(t.clientX, t.clientY);
        }}
      />

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none text-xs text-amber-400">
        화면을 터치/드래그하여 괴수를 조종하고 빌딩과 탱크를 부숴 몸집을 키우세요! (크기 x{monsterSize})
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={rampageScore}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setRampageScore(0);
          setMonsterSize(1);
          const s = gameStateRef.current;
          s.score = 0;
          s.sizeScale = 1;
          s.buildings.forEach((b) => {
            b.hp = b.maxHp;
            b.collapsed = false;
          });
          s.startTime = Date.now();
        }}
      />
    </div>
  );
};
