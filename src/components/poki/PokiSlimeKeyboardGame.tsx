import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSlimeKeyboardGameProps {
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

const TOTAL_TRACK_DISTANCE = 300;

interface Keycap {
  x: number;
  y: number;
  w: number;
  h: number;
  char: string;
  type: 'normal' | 'slime' | 'boost' | 'coin';
  collected?: boolean;
}

export const PokiSlimeKeyboardGame: React.FC<PokiSlimeKeyboardGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 1;

  const [currentDist, setCurrentDist] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [isBoosting, setIsBoosting] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    playerX: 0,
    playerLane: 1,
    targetLane: 1,
    posY: 0,
    jumpY: 0,
    jumpVy: 0,
    isGrounded: true,
    speed: 6,
    score: 0,
    coins: 0,
    won: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    keys: [] as Keycap[],
    touchStartX: 0,
    touchStartY: 0,
    startTime: Date.now()
  });

  const KEY_CHARS = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'SPACE', 'ENTER', 'ESC'];

  useEffect(() => {
    const keys: Keycap[] = [];
    const laneWidth = 100;
    for (let y = 300; y < TOTAL_TRACK_DISTANCE * 40; y += 120) {
      for (let lane = 0; lane < 3; lane++) {
        const rand = Math.random();
        let type: 'normal' | 'slime' | 'boost' | 'coin' = 'normal';
        if (rand < 0.22) type = 'slime';
        else if (rand < 0.35) type = 'coin';
        else if (rand < 0.42) type = 'boost';

        keys.push({
          x: (lane - 1) * laneWidth,
          y: y,
          w: 80,
          h: 80,
          char: KEY_CHARS[Math.floor(Math.random() * KEY_CHARS.length)],
          type
        });
      }
    }
    gameStateRef.current.keys = keys;
  }, []);

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch {}
    }
  };

  const jump = useCallback(() => {
    const gs = gameStateRef.current;
    if (gs.isGrounded && !gs.won) {
      gs.jumpVy = 13;
      gs.isGrounded = false;
      triggerHaptic(15);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }
  }, [playSfx]);

  const handleStart = (clientX: number, clientY: number) => {
    gameStateRef.current.touchStartX = clientX;
    gameStateRef.current.touchStartY = clientY;
  };

  const handleEnd = (clientX: number, clientY: number) => {
    const dx = clientX - gameStateRef.current.touchStartX;
    const dy = clientY - gameStateRef.current.touchStartY;
    const gs = gameStateRef.current;

    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && gs.targetLane < 2) {
        gs.targetLane++;
        triggerHaptic(10);
      } else if (dx < 0 && gs.targetLane > 0) {
        gs.targetLane--;
        triggerHaptic(10);
      }
    } else if (dy < -30) {
      jump();
    } else if (Math.abs(dx) <= 15 && Math.abs(dy) <= 15) {
      jump();
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
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const gs = gameStateRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h * 0.75;

      if (!gs.won) {
        const targetX = (gs.targetLane - 1) * 90;
        gs.playerX += (targetX - gs.playerX) * 0.2;

        gs.posY += gs.speed;
        const currentDistM = Math.min(TOTAL_TRACK_DISTANCE, Math.floor(gs.posY / 40));
        setCurrentDist(currentDistM);
        gs.score = currentDistM * 10 + gs.coins * 50;
        setCurrentScore(gs.score);

        if (!gs.isGrounded) {
          gs.jumpY += gs.jumpVy;
          gs.jumpVy -= 0.8;
          if (gs.jumpY <= 0) {
            gs.jumpY = 0;
            gs.jumpVy = 0;
            gs.isGrounded = true;
          }
        }

        const playerBottom = gs.posY;
        for (const k of gs.keys) {
          if (k.collected) continue;
          const kLane = k.x < -40 ? 0 : k.x > 40 ? 2 : 1;
          const distY = Math.abs(k.y - playerBottom);
          if (distY < 40 && kLane === gs.targetLane && gs.isGrounded) {
            if (k.type === 'slime') {
              gs.speed = Math.max(3, gs.speed - 2);
              triggerHaptic(40);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              for (let i = 0; i < 8; i++) {
                gs.particles.push({
                  x: cx + gs.playerX,
                  y: cy,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: '#a855f7',
                  life: 20
                });
              }
            } else if (k.type === 'boost') {
              gs.speed = 12;
              setIsBoosting(true);
              setTimeout(() => {
                gs.speed = 6;
                setIsBoosting(false);
              }, 1800);
              triggerHaptic(30);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
              k.collected = true;
            } else if (k.type === 'coin') {
              gs.coins++;
              setCoins(gs.coins);
              k.collected = true;
              triggerHaptic(15);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            }
          }
        }

        if (currentDistM >= TOTAL_TRACK_DISTANCE && !gs.won) {
          gs.won = true;
          triggerHaptic(60);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          const elapsedSec = Math.max(5, Math.floor((Date.now() - gs.startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki_slime_keyboard',
            gameTitle: isKo ? '슬라임 키보드 탈출' : 'Slime Keyboard Escape',
            durationSeconds: elapsedSec,
            score: gs.score,
            maxTargetScore: TOTAL_TRACK_DISTANCE * 10,
            isVictory: true
          });
          setRewardReceipt(receipt);
          setGameWon(true);
          onReward?.(receipt.totalSns);
        }
      }

      ctx.clearRect(0, 0, w, h);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(1, '#020408');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const trackWidth = 300;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - trackWidth / 2, 0, trackWidth, h);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 15]);
      ctx.lineDashOffset = -gs.posY;
      ctx.beginPath();
      ctx.moveTo(cx - 50, 0);
      ctx.lineTo(cx - 50, h);
      ctx.moveTo(cx + 50, 0);
      ctx.lineTo(cx + 50, h);
      ctx.stroke();
      ctx.setLineDash([]);

      for (const k of gs.keys) {
        const renderY = cy - (k.y - gs.posY);
        if (renderY < -100 || renderY > h + 100 || k.collected) continue;
        const kx = cx + k.x - k.w / 2;

        ctx.fillStyle = k.type === 'slime' ? '#581c87' : k.type === 'boost' ? '#b45309' : k.type === 'coin' ? '#047857' : '#1e293b';
        ctx.beginPath();
        ctx.roundRect(kx, renderY + 6, k.w, k.h, 10);
        ctx.fill();

        ctx.fillStyle = k.type === 'slime' ? '#9333ea' : k.type === 'boost' ? '#f59e0b' : k.type === 'coin' ? '#10b981' : '#334155';
        ctx.beginPath();
        ctx.roundRect(kx, renderY, k.w, k.h - 6, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = k.type === 'slime' ? 'SLIME' : k.type === 'boost' ? 'BOOST' : k.type === 'coin' ? '★' : k.char;
        ctx.fillText(label, kx + k.w / 2, renderY + (k.h - 6) / 2);
      }

      for (let i = gs.particles.length - 1; i >= 0; i--) {
        const p = gs.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0) gs.particles.splice(i, 1);
      }

      const px = cx + gs.playerX;
      const py = cy - gs.jumpY;
      const pSize = 54;

      if (!gs.isGrounded) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(px, cy + 20, 24 * (1 - gs.jumpY / 150), 10 * (1 - gs.jumpY / 150), 0, 0, Math.PI * 2);
        ctx.fill();
      }

      drawCardSprite(ctx, effectiveCardId, px - pSize / 2, py - pSize / 2, pSize, pSize, {
        circleClip: true,
        borderWidth: 2,
        borderColor: gs.speed > 8 ? '#f59e0b' : '#38bdf8',
        shadowBlur: 10,
        shadowColor: gs.speed > 8 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(56, 189, 248, 0.6)'
      });

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '화면 탭 / 위로 스와이프: 점프' : 'Tap or Swipe Up: Jump', cx, h - 35);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onKeyDown = (e: KeyboardEvent) => {
      const gs = gameStateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (gs.targetLane > 0) {
          gs.targetLane--;
          triggerHaptic(10);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (gs.targetLane < 2) {
          gs.targetLane++;
          triggerHaptic(10);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        jump();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [effectiveCardId, isKo, onReward, playSfx, jump]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono cursor-pointer"
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) handleStart(t.clientX, t.clientY);
      }}
      onTouchEnd={(e) => {
        const t = e.changedTouches[0];
        if (t) handleEnd(t.clientX, t.clientY);
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseUp={(e) => handleEnd(e.clientX, e.clientY)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <MinimalistMissionHUD
        title={isKo ? '슬라임 키보드 탈출' : 'Slime Keyboard Escape'}
        score={currentScore}
        targetScore={TOTAL_TRACK_DISTANCE * 10}
        stageInfo={`${currentDist} / ${TOTAL_TRACK_DISTANCE}m`}
        onExit={handleExit}
        unit="m"
      />

      <div className="absolute top-16 left-4 z-20 flex gap-2 pointer-events-none">
        <div className="bg-slate-900/80 border border-slate-700 px-3 py-1 rounded-sm text-xs text-amber-400 font-bold shadow-md">
          ★ COINS: {coins}
        </div>
        {isBoosting && (
          <div className="bg-amber-500/20 border border-amber-400 px-3 py-1 rounded-sm text-xs text-amber-300 font-black animate-pulse">
            ⚡ SPEED BOOST!
          </div>
        )}
      </div>

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

export default PokiSlimeKeyboardGame;
