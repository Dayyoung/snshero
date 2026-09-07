import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCuboyAdventureGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'solid' | 'spike' | 'moving';
  vx?: number;
  minX?: number;
  maxX?: number;
}

interface Star {
  x: number;
  y: number;
  collected: boolean;
}

export const PokiCuboyAdventureGame: React.FC<PokiCuboyAdventureGameProps> = ({ onBack, cardId = 44 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stars, setStars] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: {
      x: 60,
      y: 350,
      vx: 0,
      vy: 0,
      w: 32,
      h: 32,
      isGrounded: false,
      jumpsLeft: 2,
    },
    starsCount: 0,
    lives: 3,
    platforms: [
      { x: 30, y: 400, w: 140, h: 20, type: 'solid' },
      { x: 200, y: 360, w: 90, h: 20, type: 'moving', vx: 1.5, minX: 180, maxX: 290 },
      { x: 310, y: 420, w: 60, h: 16, type: 'spike' },
      { x: 390, y: 340, w: 110, h: 20, type: 'solid' },
      { x: 530, y: 280, w: 90, h: 20, type: 'moving', vx: -1.2, minX: 510, maxX: 640 },
      { x: 650, y: 390, w: 50, h: 16, type: 'spike' },
      { x: 720, y: 240, w: 140, h: 20, type: 'solid' },
    ] as Platform[],
    starsList: [
      { x: 245, y: 310, collected: false },
      { x: 575, y: 230, collected: false },
      { x: 790, y: 190, collected: false },
    ] as Star[],
    portal: { x: 820, y: 180, w: 40, h: 60 },
    cameraX: 0,
    startTime: Date.now(),
    keys: { left: false, right: false },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      const p = state.player;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Physics update
      if (state.keys.left) p.vx = -3.8;
      else if (state.keys.right) p.vx = 3.8;
      else p.vx *= 0.8;

      p.vy += 0.55; // gravity
      p.x += p.vx;
      p.y += p.vy;

      p.isGrounded = false;

      // Moving platforms update
      for (const plat of state.platforms) {
        if (plat.type === 'moving' && plat.vx !== undefined && plat.minX !== undefined && plat.maxX !== undefined) {
          plat.x += plat.vx;
          if (plat.x < plat.minX || plat.x > plat.maxX) plat.vx *= -1;
        }

        // Platform collision
        if (
          p.x + p.w > plat.x &&
          p.x < plat.x + plat.w &&
          p.y + p.h >= plat.y &&
          p.y + p.h <= plat.y + 16 &&
          p.vy >= 0
        ) {
          if (plat.type === 'spike') {
            // Hit spike
            state.lives--;
            setLives(state.lives);
            p.x = 60;
            p.y = 350;
            p.vx = 0;
            p.vy = 0;
            if (state.lives <= 0 && !gameOver) {
              setGameOver(true);
              const reward = calculateAndDepositMissionReward({
                gameId: 'pokicuboyadventure',
                gameTitle: 'Cuboy Adventure',
                isVictory: false,
                score: state.starsCount * 333,
                maxTargetScore: 1000,
                durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
              });
              setRewardResult(reward);
              return;
            }
          } else {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.isGrounded = true;
            p.jumpsLeft = 2;
          }
        }
      }

      // Fall off map
      if (p.y > canvas.height + 100) {
        state.lives--;
        setLives(state.lives);
        p.x = 60;
        p.y = 350;
        p.vx = 0;
        p.vy = 0;
        if (state.lives <= 0 && !gameOver) {
          setGameOver(true);
          const reward = calculateAndDepositMissionReward({
            gameId: 'pokicuboyadventure',
            gameTitle: 'Cuboy Adventure',
            isVictory: false,
            score: state.starsCount * 333,
            maxTargetScore: 1000,
            durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
          });
          setRewardResult(reward);
          return;
        }
      }

      // Check Stars pickup
      for (const s of state.starsList) {
        if (!s.collected) {
          const dist = Math.hypot(p.x + p.w / 2 - s.x, p.y + p.h / 2 - s.y);
          if (dist < 30) {
            s.collected = true;
            state.starsCount++;
            setStars(state.starsCount);
          }
        }
      }

      // Check Portal Goal
      const portal = state.portal;
      if (
        p.x + p.w > portal.x &&
        p.x < portal.x + portal.w &&
        p.y + p.h > portal.y &&
        p.y < portal.y + portal.h &&
        state.starsCount >= 3 &&
        !gameWon
      ) {
        setGameWon(true);
        setGameOver(true);
        const reward = calculateAndDepositMissionReward({
          gameId: 'pokicuboyadventure',
          gameTitle: 'Cuboy Adventure',
          isVictory: true,
          score: 1000,
          maxTargetScore: 1000,
          durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
        });
        setRewardResult(reward);
        return;
      }

      // Camera follow
      state.cameraX = Math.max(0, p.x - canvas.width * 0.35);

      // Render
      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-state.cameraX, 0);

      // Platforms
      for (const plat of state.platforms) {
        if (plat.type === 'solid') {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.fillStyle = '#15803d';
          ctx.fillRect(plat.x, plat.y + 4, plat.w, plat.h - 4);
        } else if (plat.type === 'moving') {
          ctx.fillStyle = '#0ea5e9';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        } else if (plat.type === 'spike') {
          ctx.fillStyle = '#ef4444';
          // Draw jagged spike triangles
          const spikesCount = Math.floor(plat.w / 12);
          for (let k = 0; k < spikesCount; k++) {
            const sx = plat.x + k * 12;
            ctx.beginPath();
            ctx.moveTo(sx, plat.y + plat.h);
            ctx.lineTo(sx + 6, plat.y);
            ctx.lineTo(sx + 12, plat.y + plat.h);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // Stars
      for (const s of state.starsList) {
        if (!s.collected) {
          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', s.x, s.y);
        }
      }

      // Goal Portal
      ctx.fillStyle = state.starsCount >= 3 ? '#eab308' : '#94a3b8';
      ctx.fillRect(portal.x, portal.y, portal.w, portal.h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.starsCount >= 3 ? 'GOAL' : 'LOCK', portal.x + portal.w / 2, portal.y + 35);

      // Player Cuboy
      drawCardSprite(ctx, cardId, p.x, p.y, p.w, p.h);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cardId, gameOver, gameWon]);

  const jump = () => {
    const p = gameStateRef.current.player;
    if (p.jumpsLeft > 0) {
      p.vy = -10.5;
      p.jumpsLeft--;
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#f0fdf4] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Cuboy Adventure"
        score={stars}
        targetScore={3}
        lives={lives}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onTouchStart={(e) => {
          const t = e.touches[0];
          const half = window.innerWidth / 2;
          if (t.clientY < window.innerHeight * 0.65) {
            jump();
          } else if (t.clientX < half) {
            gameStateRef.current.keys.left = true;
            gameStateRef.current.keys.right = false;
          } else {
            gameStateRef.current.keys.right = true;
            gameStateRef.current.keys.left = false;
          }
        }}
        onTouchEnd={() => {
          gameStateRef.current.keys.left = false;
          gameStateRef.current.keys.right = false;
        }}
        onMouseDown={(e) => {
          if (e.clientY < window.innerHeight * 0.65) {
            jump();
          } else if (e.clientX < window.innerWidth / 2) {
            gameStateRef.current.keys.left = true;
          } else {
            gameStateRef.current.keys.right = true;
          }
        }}
        onMouseUp={() => {
          gameStateRef.current.keys.left = false;
          gameStateRef.current.keys.right = false;
        }}
      />

      {/* Control UI guide */}
      <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-between items-center pointer-events-none text-xs text-stone-700">
        <div className="bg-white/80 px-3 py-2 rounded-sm border border-stone-300">
          ◀ 하단 좌측 [이동]
        </div>
        <div className="bg-white/80 px-3 py-2 rounded-sm border border-stone-300 text-center">
          <div>상단 탭: [2단 점프]</div>
          <div className="text-[10px] text-amber-600">별 ⭐ 3개를 모아 포털로 탈출!</div>
        </div>
        <div className="bg-white/80 px-3 py-2 rounded-sm border border-stone-300">
          하단 우측 [이동] ▶
        </div>
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={stars * 333}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setStars(0);
          setLives(3);
          const p = gameStateRef.current.player;
          p.x = 60;
          p.y = 350;
          p.vx = 0;
          p.vy = 0;
          gameStateRef.current.starsCount = 0;
          gameStateRef.current.lives = 3;
          gameStateRef.current.starsList.forEach((s) => (s.collected = false));
          gameStateRef.current.startTime = Date.now();
        }}
      />
    </div>
  );
};

export default PokiCuboyAdventureGame;
