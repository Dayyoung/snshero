import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRedBall4GameProps {
  onBack: () => void;
  cardId?: number;
}

interface Star {
  x: number;
  y: number;
  collected: boolean;
}

interface SquareMinion {
  x: number;
  y: number;
  vx: number;
  minX: number;
  maxX: number;
  defeated: boolean;
}

export const PokiRedBall4Game: React.FC<PokiRedBall4GameProps> = ({ onBack, cardId = 59 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stars, setStars] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    ball: {
      x: 50,
      y: 350,
      vx: 0,
      vy: 0,
      radius: 18,
      rotation: 0,
      isGrounded: false,
    },
    starsList: [
      { x: 260, y: 320, collected: false },
      { x: 530, y: 260, collected: false },
      { x: 740, y: 220, collected: false },
    ] as Star[],
    minions: [
      { x: 380, y: 390, vx: 1.5, minX: 340, maxX: 450, defeated: false },
      { x: 620, y: 330, vx: -1.2, minX: 580, maxX: 680, defeated: false },
    ] as SquareMinion[],
    flag: { x: 840, y: 230 },
    cameraX: 0,
    lives: 3,
    keys: { left: false, right: false },
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
      const b = state.ball;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Physics update
      if (state.keys.left) {
        b.vx = -4;
        b.rotation -= 0.12;
      } else if (state.keys.right) {
        b.vx = 4;
        b.rotation += 0.12;
      } else {
        b.vx *= 0.88;
      }

      b.vy += 0.52; // gravity
      b.x += b.vx;
      b.y += b.vy;

      // Ground height calculation function (hilly terrain)
      const getGroundY = (x: number) => {
        if (x < 300) return 400;
        if (x < 500) return 410 - (x - 300) * 0.3;
        if (x < 700) return 350 - (x - 500) * 0.4;
        return 270;
      };

      const groundY = getGroundY(b.x);
      if (b.y + b.radius >= groundY) {
        b.y = groundY - b.radius;
        b.vy = 0;
        b.isGrounded = true;
      } else {
        b.isGrounded = false;
      }

      // Update Minions
      for (const m of state.minions) {
        if (m.defeated) continue;
        m.x += m.vx;
        if (m.x < m.minX || m.x > m.maxX) m.vx *= -1;

        // Collision with ball
        const dist = Math.hypot(b.x - m.x, b.y - m.y);
        if (dist < b.radius + 18) {
          if (b.vy > 0 && b.y < m.y - 8) {
            // Stomp kill!
            m.defeated = true;
            b.vy = -8.5; // bounce up
          } else {
            // Hurt ball
            state.lives--;
            setLives(state.lives);
            b.x = 50;
            b.y = 350;
            b.vx = 0;
            b.vy = 0;

            if (state.lives <= 0 && !gameOver) {
              setGameOver(true);
              const reward = calculateAndDepositMissionReward({
                gameId: 'pokiredball4',
                gameTitle: 'Red Ball 4',
                isVictory: false,
                score: state.starsList.filter((s) => s.collected).length * 333,
                maxTargetScore: 1000,
                durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
              });
              setRewardResult(reward);
              return;
            }
          }
        }
      }

      // Collect Stars
      for (const s of state.starsList) {
        if (!s.collected && Math.hypot(b.x - s.x, b.y - s.y) < 28) {
          s.collected = true;
          setStars(state.starsList.filter((it) => it.collected).length);
        }
      }

      // Check Flag Goal
      if (Math.hypot(b.x - state.flag.x, b.y - state.flag.y) < 36 && !gameWon) {
        setGameWon(true);
        setGameOver(true);
        const reward = calculateAndDepositMissionReward({
          gameId: 'pokiredball4',
          gameTitle: 'Red Ball 4',
          isVictory: true,
          score: 1000,
          maxTargetScore: 1000,
          durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
        });
        setRewardResult(reward);
        return;
      }

      // Camera follow
      state.cameraX = Math.max(0, b.x - canvas.width * 0.35);

      // Drawing
      ctx.fillStyle = '#e0f2fe'; // Sky blue
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-state.cameraX, 0);

      // Hills & Green ground
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(0, 400);
      ctx.lineTo(300, 400);
      ctx.lineTo(500, 350);
      ctx.lineTo(700, 270);
      ctx.lineTo(1000, 270);
      ctx.lineTo(1000, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Dirt layer
      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.moveTo(0, 420);
      ctx.lineTo(300, 420);
      ctx.lineTo(500, 370);
      ctx.lineTo(700, 290);
      ctx.lineTo(1000, 290);
      ctx.lineTo(1000, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Stars
      for (const s of state.starsList) {
        if (!s.collected) {
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', s.x, s.y);
        }
      }

      // Minions (Black square cubes)
      for (const m of state.minions) {
        if (!m.defeated) {
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(m.x - 16, m.y - 16, 32, 32);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(m.x - 8, m.y - 6, 5, 5);
          ctx.fillRect(m.x + 3, m.y - 6, 5, 5);
        }
      }

      // Goal Flag
      const fl = state.flag;
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fl.x, fl.y + 40);
      ctx.lineTo(fl.x, fl.y);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(fl.x, fl.y);
      ctx.lineTo(fl.x + 28, fl.y + 12);
      ctx.lineTo(fl.x, fl.y + 24);
      ctx.closePath();
      ctx.fill();

      // Draw Red Ball Player with Rotation
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);

      // Red ball base
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Card Sprite as texture
      drawCardSprite(ctx, cardId, -12, -12, 24, 24);

      // Cute eyes & smile
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, -4, 4, 0, Math.PI * 2);
      ctx.arc(5, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(-4, -4, 2, 0, Math.PI * 2);
      ctx.arc(6, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cardId, gameOver, gameWon]);

  const jump = () => {
    const b = gameStateRef.current.ball;
    if (b.isGrounded) {
      b.vy = -11;
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#e0f2fe] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Red Ball 4"
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

      <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-between items-center pointer-events-none text-xs text-stone-700">
        <div className="bg-white/80 px-3 py-2 rounded-sm border border-stone-300">
          ◀ 하단 좌측 [구르기]
        </div>
        <div className="bg-white/80 px-3 py-2 rounded-sm border border-stone-300 text-center">
          <div>상단 탭: [바운스 점프]</div>
          <div className="text-[10px] text-red-600">몬스터 머리를 밟아 처치하세요!</div>
        </div>
        <div className="bg-white/80 px-3 py-2 rounded-sm border border-stone-300">
          하단 우측 [구르기] ▶
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
          const s = gameStateRef.current;
          s.ball.x = 50;
          s.ball.y = 350;
          s.ball.vx = 0;
          s.ball.vy = 0;
          s.starsList.forEach((st) => (st.collected = false));
          s.minions.forEach((m) => (m.defeated = false));
          s.startTime = Date.now();
        }}
      />
    </div>
  );
};

export default PokiRedBall4Game;
