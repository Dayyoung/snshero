import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStickmanCrazyBoxGameProps {
  onBack: () => void;
}

interface FallingBox {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  color: string;
}

interface StarGem {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export const PokiStickmanCrazyBoxGame: React.FC<PokiStickmanCrazyBoxGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'hit' | 'victory'>('ready');
  const [starsCollected, setStarsCollected] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    hero: {
      x: 200,
      y: 500,
      vx: 0,
      vy: 0,
      w: 32,
      h: 46,
      isGrounded: true,
    },
    targetTouchX: null as number | null,
    boxes: [] as FallingBox[],
    stars: [] as StarGem[],
    boxSpawnCounter: 0,
    starSpawnCounter: 0,
  });

  const initGame = useCallback(() => {
    stateRef.current.hero = {
      x: 200,
      y: 500,
      vx: 0,
      vy: 0,
      w: 32,
      h: 46,
      isGrounded: true,
    };
    stateRef.current.boxes = [];
    stateRef.current.stars = [];
    stateRef.current.boxSpawnCounter = 0;
    stateRef.current.starSpawnCounter = 0;
    setStarsCollected(0);
  }, []);

  const handleStart = () => {
    initGame();
    setGameState('playing');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokistickmancrazybox',
      gameTitle: 'Stickman Crazy Box Arena',
      isVictory: true,
      score: 8,
      maxTargetScore: 8,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, []);

  // Jump trigger
  const triggerJump = useCallback(() => {
    const { hero } = stateRef.current;
    if (hero.isGrounded) {
      hero.vy = -14;
      hero.isGrounded = false;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const { hero, boxes, stars } = stateRef.current;

      ctx.clearRect(0, 0, width, height);

      // Cyber Neon Party Arena
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Arena Floor
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 546, width, height - 546);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 546);
      ctx.lineTo(width, 546);
      ctx.stroke();

      if (gameState === 'playing') {
        // Hero Steering
        if (stateRef.current.targetTouchX !== null) {
          const dx = stateRef.current.targetTouchX - hero.x;
          hero.vx += dx * 0.1;
        }
        hero.vx *= 0.82;
        hero.x += hero.vx;

        // Gravity
        hero.vy += 0.7;
        hero.y += hero.vy;

        // Ground collision
        if (hero.y >= 546 - hero.h) {
          hero.y = 546 - hero.h;
          hero.vy = 0;
          hero.isGrounded = true;
        }

        hero.x = Math.max(10, Math.min(width - hero.w - 10, hero.x));

        // Spawn Falling Boxes
        stateRef.current.boxSpawnCounter++;
        if (stateRef.current.boxSpawnCounter % 40 === 0) {
          boxes.push({
            id: Date.now() + Math.random(),
            x: 20 + Math.random() * (width - 70),
            y: -60,
            w: 48,
            h: 48,
            vy: 3.5 + Math.random() * 2.5,
            color: ['#ea580c', '#e11d48', '#9333ea', '#2563eb'][Math.floor(Math.random() * 4)],
          });
        }

        // Spawn Star Gems
        stateRef.current.starSpawnCounter++;
        if (stateRef.current.starSpawnCounter % 90 === 0 && stars.length < 8) {
          stars.push({
            id: Date.now() + Math.random(),
            x: 40 + Math.random() * (width - 80),
            y: -30,
            collected: false,
          });
        }

        // Update Boxes
        for (let b = boxes.length - 1; b >= 0; b--) {
          const box = boxes[b];
          box.y += box.vy;

          // Check Hero Box Collision
          if (
            hero.x + hero.w > box.x &&
            hero.x < box.x + box.w &&
            hero.y + hero.h > box.y &&
            hero.y < box.y + box.h
          ) {
            setGameState('hit');
            return;
          }

          if (box.y > height) {
            boxes.splice(b, 1);
          }
        }

        // Update Stars
        for (let s = stars.length - 1; s >= 0; s--) {
          const star = stars[s];
          if (!star.collected) {
            star.y += 2.2;

            // Check Hero Star Collection
            const dist = Math.hypot(hero.x + hero.w / 2 - star.x, hero.y + hero.h / 2 - star.y);
            if (dist < 32) {
              star.collected = true;
              setStarsCollected((prev) => {
                const updated = prev + 1;
                if (updated >= 8) {
                  setTimeout(() => handleVictory(), 300);
                }
                return updated;
              });
            }
          }
        }
      }

      // Draw Falling Boxes
      boxes.forEach((box) => {
        ctx.fillStyle = box.color;
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.w, box.h);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('📦', box.x + box.w / 2, box.y + box.h / 2 + 5);
      });

      // Draw Stars
      stars.forEach((star) => {
        if (!star.collected) {
          ctx.fillStyle = '#facc15';
          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⭐', star.x, star.y);
        }
      });

      // Draw Hero (Card #89 Hero)
      drawCardSprite(ctx, 89, hero.x, hero.y, hero.w, hero.h);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, handleVictory]);

  // Touch controls
  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    stateRef.current.targetTouchX = ((t.clientX - rect.left) / rect.width) * 400;
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#0f172a] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Stickman Crazy Box"
        missionTarget="상자 회피 & 스타 8개 수집"
        currentScore={starsCollected}
        maxScore={8}
        scoreUnit="개"
        onBack={onBack}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="w-full h-full object-contain rounded border border-white/20 bg-slate-900 touch-none shadow-2xl"
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          onTouchEnd={() => (stateRef.current.targetTouchX = null)}
          onMouseDown={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            stateRef.current.targetTouchX = ((e.clientX - rect.left) / rect.width) * 400;
          }}
          onMouseMove={(e) => {
            if (e.buttons > 0) {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              stateRef.current.targetTouchX = ((e.clientX - rect.left) / rect.width) * 400;
            }
          }}
          onMouseUp={() => (stateRef.current.targetTouchX = null)}
        />

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-amber-400 mb-2">[ Stickman Crazy Box ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              하늘에서 쏟아지는 위험한 크레이지 박스를 피하세요!<br />
              1. <b>화면 좌우 터치/드래그</b>로 스틱맨을 움직입니다.<br />
              2. <b>[JUMP(점프)]</b> 버튼으로 상자를 뛰어넘으세요.<br />
              3. 떨어지는 <b>황금 스타(⭐) 8개</b>를 모두 수집하면 승리!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              배틀 시작 [START]
            </button>
          </div>
        )}

        {gameState === 'hit' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-rose-500 mb-2">📦💥 [ 상자에 부딪혔습니다! ]</h2>
            <p className="text-sm text-slate-300 mb-4">수집한 스타: {starsCollected} / 8</p>
            <button
              onClick={handleStart}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-sm active:scale-95 transition-all"
            >
              다시 도전
            </button>
          </div>
        )}

        {gameState === 'victory' && rewardReceipt && (
          <VictoryRewardModal
            receipt={rewardReceipt}
            language="ko"
            onPlayAgain={handleStart}
            onExit={onBack}
          />
        )}
      </div>

      {/* Jump Button */}
      {gameState === 'playing' && (
        <div className="w-full max-w-md p-3 bg-slate-950/95 border-t border-white/10 flex items-center justify-between gap-4">
          <div className="text-xs text-amber-400 font-bold">
            ⭐ 스타 수집: {starsCollected}/8
          </div>
          <button
            onClick={triggerJump}
            className="flex-1 py-3.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black rounded-sm text-sm active:scale-95 transition-all shadow"
          >
            ⬆️ JUMP (점프)
          </button>
        </div>
      )}
    </div>
  );
};
export default PokiStickmanCrazyBoxGame;
