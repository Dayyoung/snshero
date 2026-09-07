import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSubwaySurfersGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Obstacle {
  lane: number;
  y: number;
  type: 'train' | 'barrier' | 'overhead';
}

interface Coin {
  lane: number;
  y: number;
  collected: boolean;
}

export const PokiSubwaySurfersGame: React.FC<PokiSubwaySurfersGameProps> = ({ onBack, cardId = 26 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: {
      lane: 1, // 0: Left, 1: Center, 2: Right
      x: 400,
      targetX: 400,
      y: 520,
      jumpY: 0,
      vy: 0,
      isJumping: false,
      isRolling: false,
      rollTimer: 0,
    },
    obstacles: [
      { lane: 0, y: -200, type: 'train' as const },
      { lane: 1, y: -600, type: 'barrier' as const },
      { lane: 2, y: -1000, type: 'overhead' as const },
      { lane: 1, y: -1400, type: 'train' as const },
      { lane: 0, y: -1800, type: 'barrier' as const },
      { lane: 2, y: -2200, type: 'train' as const },
    ] as Obstacle[],
    coins: [] as Coin[],
    speed: 7.5,
    distanceRun: 0,
    coinCount: 0,
    touchStart: { x: 0, y: 0 },
    lanesX: [280, 400, 520],
  });

  // Generate track coins
  useEffect(() => {
    const list: Coin[] = [];
    for (let i = 0; i < 60; i++) {
      list.push({
        lane: Math.floor(Math.random() * 3),
        y: -150 * i - 100,
        collected: false,
      });
    }
    gameStateRef.current.coins = list;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      const p = state.player;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.min(cw / 800, ch / 680);
      const offsetX = (cw - 800 * scale) / 2;
      const offsetY = (ch - 680 * scale) / 2;

      if (!gameOver && !gameWon) {
        state.distanceRun += Math.round(state.speed * 0.1);
        setDistance(state.distanceRun);

        // Player lane transition
        p.targetX = state.lanesX[p.lane];
        p.x += (p.targetX - p.x) * 0.25;

        // Jump physics
        if (p.isJumping) {
          p.jumpY += p.vy;
          p.vy += 0.8;
          if (p.jumpY >= 0) {
            p.jumpY = 0;
            p.isJumping = false;
          }
        }

        // Roll timer
        if (p.isRolling) {
          p.rollTimer -= 1;
          if (p.rollTimer <= 0) {
            p.isRolling = false;
          }
        }

        // Scroll Obstacles
        state.obstacles.forEach(obs => {
          obs.y += state.speed;

          // Recycle
          if (obs.y > 700) {
            obs.y = -600 - Math.random() * 400;
            obs.lane = Math.floor(Math.random() * 3);
            const types: ('train' | 'barrier' | 'overhead')[] = ['train', 'barrier', 'overhead'];
            obs.type = types[Math.floor(Math.random() * types.length)];
          }

          // Hit detection
          const obsX = state.lanesX[obs.lane];
          if (p.lane === obs.lane && Math.abs(obs.y - p.y) < 35) {
            if (obs.type === 'barrier' && p.isJumping && p.jumpY < -25) {
              // Cleared by jump!
            } else if (obs.type === 'overhead' && p.isRolling) {
              // Cleared by roll!
            } else {
              // Crash!
              setGameOver(true);
            }
          }
        });

        // Scroll Coins
        state.coins.forEach(coin => {
          if (!coin.collected) {
            coin.y += state.speed;
            const coinX = state.lanesX[coin.lane];

            if (p.lane === coin.lane && Math.abs(coin.y - p.y) < 30) {
              coin.collected = true;
              state.coinCount += 1;
              setCoins(state.coinCount);

              if (state.coinCount >= 35) {
                setGameWon(true);
                const deposit = calculateAndDepositMissionReward({
                  gameId: 'poki_subway_surfers',
                  gameTitle: 'Subway Surfers',
                  isVictory: true,
                  score: 100,
                  maxTargetScore: 100,
                  durationSeconds: 35,
                });
                setRewardResult(deposit);
                return;
              }
            }
          }
        });
      }

      // Render
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Track Ground
      ctx.fillStyle = '#312e81';
      ctx.fillRect(200, 0, 400, 680);

      // Rails
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 4;
      [280, 400, 520].forEach(lx => {
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, 680);
        ctx.stroke();

        // Cross ties
        ctx.strokeStyle = '#4338ca';
        ctx.lineWidth = 2;
        for (let y = 0; y < 680; y += 40) {
          ctx.beginPath();
          ctx.moveTo(lx - 40, y);
          ctx.lineTo(lx + 40, y);
          ctx.stroke();
        }
      });

      // Draw Coins
      state.coins.forEach(coin => {
        if (!coin.collected && coin.y > -50 && coin.y < 700) {
          const cx = state.lanesX[coin.lane];
          ctx.beginPath();
          ctx.arc(cx, coin.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#facc15';
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Draw Obstacles
      state.obstacles.forEach(obs => {
        if (obs.y > -150 && obs.y < 750) {
          const ox = state.lanesX[obs.lane];
          if (obs.type === 'train') {
            // Subway train
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(ox - 35, obs.y - 70, 70, 120);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(ox - 25, obs.y + 25, 12, 10);
            ctx.fillRect(ox + 13, obs.y + 25, 12, 10);
          } else if (obs.type === 'barrier') {
            // Low hurdle
            ctx.fillStyle = '#f97316';
            ctx.fillRect(ox - 30, obs.y - 12, 60, 24);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(ox - 20, obs.y - 8, 12, 16);
            ctx.fillRect(ox + 8, obs.y - 8, 12, 16);
          } else if (obs.type === 'overhead') {
            // Overhead sign (must roll)
            ctx.fillStyle = '#eab308';
            ctx.fillRect(ox - 35, obs.y - 25, 70, 16);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ROLL UNDER', ox, obs.y - 13);
          }
        }
      });

      // Draw Player Surfer
      const playerRenderY = p.y + p.jumpY;
      const pSize = p.isRolling ? 24 : 36;
      drawCardSprite(ctx, cardId, p.x - pSize / 2, playerRenderY - pSize / 2, pSize, pSize);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // 4-way Swipe Controls
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    gameStateRef.current.touchStart = { x: clientX, y: clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;
    const dx = clientX - gameStateRef.current.touchStart.x;
    const dy = clientY - gameStateRef.current.touchStart.y;
    const p = gameStateRef.current.player;

    if (Math.abs(dx) > 25 || Math.abs(dy) > 25) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal: change lane
        if (dx > 0 && p.lane < 2) p.lane += 1;
        if (dx < 0 && p.lane > 0) p.lane -= 1;
      } else {
        // Vertical: jump or roll
        if (dy < 0 && !p.isJumping) {
          p.isJumping = true;
          p.vy = -12;
        } else if (dy > 0 && !p.isRolling) {
          p.isRolling = true;
          p.rollTimer = 35;
          if (p.isJumping) {
            // Fast fall
            p.vy = 12;
          }
        }
      }
    }
  };

  const handleRestart = () => {
    gameStateRef.current = {
      ...gameStateRef.current,
      player: {
        lane: 1,
        x: 400,
        targetX: 400,
        y: 520,
        jumpY: 0,
        vy: 0,
        isJumping: false,
        isRolling: false,
        rollTimer: 0,
      },
      obstacles: [
        { lane: 0, y: -200, type: 'train' },
        { lane: 1, y: -600, type: 'barrier' },
        { lane: 2, y: -1000, type: 'overhead' },
        { lane: 1, y: -1400, type: 'train' },
        { lane: 0, y: -1800, type: 'barrier' },
        { lane: 2, y: -2200, type: 'train' },
      ],
      distanceRun: 0,
      coinCount: 0,
    };
    setCoins(0);
    setDistance(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#1e1b4b] overflow-hidden select-none font-mono touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      <MinimalistMissionHUD
        title="SUBWAY SURFERS"
        score={coins}
        goalScore={35}
        onBack={onBack}
        unit="COINS"
      />

      {/* Progress & Distance */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-indigo-950/80 border border-indigo-700 px-3 py-1.5 rounded-sm text-xs">
        <span className="font-bold text-amber-400">🪙 COINS: {coins} / 35</span>
        <span className="text-indigo-200">DISTANCE: {distance}m</span>
      </div>

      {/* Swipe Control Help */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-indigo-200 bg-indigo-950/90 border border-indigo-700 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        <span className="text-amber-400 font-bold">좌우 스와이프</span>(레인 변경) • <span className="text-sky-400 font-bold">위 스와이프</span>(점프) • <span className="text-rose-400 font-bold">아래 스와이프</span>(구르기)
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ CAUGHT BY INSPECTOR ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            기차 또는 장애물에 부딪혔습니다! 스와이프 타이밍을 맞춰 다시 질주하세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 서핑
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-sm transition-colors cursor-pointer"
            >
              미션 목록
            </button>
          </div>
        </div>
      )}

      {/* Victory Reward Modal */}
      {gameWon && (
        <VictoryRewardModal
          isOpen={true}
          onClose={onBack}
          rewardAmount={rewardResult?.rewardAmount || 40}
          message="지하철 선로에서 골드 코인 35개를 모두 수집하고 완벽한 탈출을 달성했습니다!"
        />
      )}
    </div>
  );
};

export default PokiSubwaySurfersGame;
