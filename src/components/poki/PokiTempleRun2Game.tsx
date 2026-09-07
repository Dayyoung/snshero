import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiTempleRun2GameProps {
  onBack: () => void;
  cardId?: number;
}

interface Obstacle {
  lane: number;
  y: number;
  type: 'flame' | 'log' | 'root';
}

interface Coin {
  lane: number;
  y: number;
  collected: boolean;
}

export const PokiTempleRun2Game: React.FC<PokiTempleRun2GameProps> = ({ onBack, cardId = 36 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: {
      lane: 1, // 0, 1, 2
      x: 400,
      targetX: 400,
      y: 520,
      jumpY: 0,
      vy: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
    },
    obstacles: [
      { lane: 0, y: -300, type: 'flame' as const },
      { lane: 1, y: -700, type: 'log' as const },
      { lane: 2, y: -1100, type: 'root' as const },
      { lane: 1, y: -1500, type: 'flame' as const },
      { lane: 0, y: -1900, type: 'log' as const },
      { lane: 2, y: -2300, type: 'flame' as const },
    ] as Obstacle[],
    coins: [] as Coin[],
    speed: 7.8,
    distanceRun: 0,
    coinCount: 0,
    touchStart: { x: 0, y: 0 },
    lanesX: [280, 400, 520],
  });

  useEffect(() => {
    const list: Coin[] = [];
    for (let i = 0; i < 60; i++) {
      list.push({
        lane: Math.floor(Math.random() * 3),
        y: -140 * i - 120,
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

        // Lane transition
        p.targetX = state.lanesX[p.lane];
        p.x += (p.targetX - p.x) * 0.25;

        // Jump
        if (p.isJumping) {
          p.jumpY += p.vy;
          p.vy += 0.82;
          if (p.jumpY >= 0) {
            p.jumpY = 0;
            p.isJumping = false;
          }
        }

        // Slide
        if (p.isSliding) {
          p.slideTimer -= 1;
          if (p.slideTimer <= 0) {
            p.isSliding = false;
          }
        }

        // Obstacles scroll
        state.obstacles.forEach(obs => {
          obs.y += state.speed;

          if (obs.y > 700) {
            obs.y = -600 - Math.random() * 400;
            obs.lane = Math.floor(Math.random() * 3);
            const types: ('flame' | 'log' | 'root')[] = ['flame', 'log', 'root'];
            obs.type = types[Math.floor(Math.random() * types.length)];
          }

          if (p.lane === obs.lane && Math.abs(obs.y - p.y) < 32) {
            if (obs.type === 'log' && p.isJumping && p.jumpY < -24) {
              // Jump over log!
            } else if (obs.type === 'root' && p.isSliding) {
              // Slide under root!
            } else {
              setGameOver(true);
            }
          }
        });

        // Coins scroll
        state.coins.forEach(coin => {
          if (!coin.collected) {
            coin.y += state.speed;
            if (p.lane === coin.lane && Math.abs(coin.y - p.y) < 28) {
              coin.collected = true;
              state.coinCount += 1;
              setCoins(state.coinCount);

              if (state.coinCount >= 30) {
                setGameWon(true);
                const deposit = calculateAndDepositMissionReward({
                  gameId: 'poki_temple_run_2',
                  gameTitle: 'Temple Run 2',
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

      // Drawing
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Ancient Stone Temple Wall Pathway
      ctx.fillStyle = '#78350f';
      ctx.fillRect(200, 0, 400, 680);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 4;
      ctx.strokeRect(200, 0, 400, 680);

      // Pathway stone tiles
      ctx.strokeStyle = 'rgba(254, 243, 199, 0.15)';
      ctx.lineWidth = 2;
      for (let y = 0; y < 680; y += 40) {
        ctx.beginPath();
        ctx.moveTo(200, y);
        ctx.lineTo(600, y);
        ctx.stroke();
      }

      // Coins
      state.coins.forEach(coin => {
        if (!coin.collected && coin.y > -50 && coin.y < 700) {
          const cx = state.lanesX[coin.lane];
          ctx.beginPath();
          ctx.arc(cx, coin.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#facc15';
          ctx.fill();
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Obstacles
      state.obstacles.forEach(obs => {
        if (obs.y > -150 && obs.y < 750) {
          const ox = state.lanesX[obs.lane];
          if (obs.type === 'flame') {
            ctx.font = '28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔥', ox, obs.y);
          } else if (obs.type === 'log') {
            ctx.fillStyle = '#451a03';
            ctx.fillRect(ox - 35, obs.y - 10, 70, 20);
            ctx.strokeStyle = '#78350f';
            ctx.strokeRect(ox - 35, obs.y - 10, 70, 20);
          } else if (obs.type === 'root') {
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(ox - 35, obs.y - 24, 70, 14);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SLIDE UNDER', ox, obs.y - 14);
          }
        }
      });

      // Player Runner
      const playerRenderY = p.y + p.jumpY;
      const pSize = p.isSliding ? 24 : 36;
      drawCardSprite(ctx, cardId, p.x - pSize / 2, playerRenderY - pSize / 2, pSize, pSize);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Swipe controls
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
        if (dx > 0 && p.lane < 2) p.lane += 1;
        if (dx < 0 && p.lane > 0) p.lane -= 1;
      } else {
        if (dy < 0 && !p.isJumping) {
          p.isJumping = true;
          p.vy = -12;
        } else if (dy > 0 && !p.isSliding) {
          p.isSliding = true;
          p.slideTimer = 35;
          if (p.isJumping) p.vy = 12;
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
        isSliding: false,
        slideTimer: 0,
      },
      obstacles: [
        { lane: 0, y: -300, type: 'flame' },
        { lane: 1, y: -700, type: 'log' },
        { lane: 2, y: -1100, type: 'root' },
        { lane: 1, y: -1500, type: 'flame' },
        { lane: 0, y: -1900, type: 'log' },
        { lane: 2, y: -2300, type: 'flame' },
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
      className="relative w-full h-[100dvh] bg-[#064e3b] overflow-hidden select-none font-mono touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      <MinimalistMissionHUD
        title="TEMPLE RUN 2"
        score={coins}
        goalScore={30}
        onBack={onBack}
        unit="COINS"
      />

      {/* Coins & Distance Bar */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-amber-950/80 border border-amber-800 px-3 py-1.5 rounded-sm text-xs">
        <span className="font-bold text-amber-400">🪙 COINS: {coins} / 30</span>
        <span className="text-amber-200">DISTANCE: {distance}m</span>
      </div>

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-amber-100 bg-amber-950/90 border border-amber-800 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        <span className="text-amber-400 font-bold">좌우 스와이프</span>(턴) • <span className="text-sky-400 font-bold">위 스와이프</span>(점프) • <span className="text-rose-400 font-bold">아래 스와이프</span>(슬라이딩)
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ TEMPLE TRAP HIT ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            유적의 함정이나 절벽에 부딪혔습니다! 몬스터의 발소리를 피해 다시 질주하세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 탈출
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
          message="신전 유적의 모든 함정을 돌파하고 황금 우상을 탈취했습니다!"
        />
      )}
    </div>
  );
};

export default PokiTempleRun2Game;
