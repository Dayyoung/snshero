import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiLevelDevilGameProps {
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

export const PokiLevelDevilGame: React.FC<PokiLevelDevilGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 5;

  const [currentStage, setCurrentStage] = useState(1);
  const [deaths, setDeaths] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    px: 60,
    py: 300,
    vx: 0,
    vy: 0,
    onGround: false,
    stage: 1,
    deaths: 0,
    won: false,
    startTime: Date.now(),
    leftPressed: false,
    rightPressed: false,
    trollTriggered: false,
    doorOffset: 0
  });

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch {}
    }
  };

  const jump = useCallback(() => {
    const gs = gameStateRef.current;
    if (gs.onGround && !gs.won) {
      gs.vy = -12;
      gs.onGround = false;
      triggerHaptic(15);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }
  }, [playSfx]);

  const respawn = () => {
    const gs = gameStateRef.current;
    gs.px = 60;
    gs.py = 300;
    gs.vx = 0;
    gs.vy = 0;
    gs.trollTriggered = false;
    gs.doorOffset = 0;
    gs.deaths++;
    setDeaths(gs.deaths);
    triggerHaptic(40);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
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
      const groundY = h * 0.7;

      if (!gs.won) {
        // Controls
        if (gs.leftPressed) gs.vx = -4.5;
        else if (gs.rightPressed) gs.vx = 4.5;
        else gs.vx *= 0.7;

        gs.px += gs.vx;
        gs.vy += 0.65; // gravity
        gs.py += gs.vy;

        // Troll trap check
        // Trap 1: Floor drop in center
        let floorGap = false;
        if (gs.px > w * 0.35 && gs.px < w * 0.55) {
          gs.trollTriggered = true;
          floorGap = true;
        }

        // Trap 2: Moving door when close
        const doorBaseX = w - 100;
        if (gs.px > w * 0.65) {
          gs.doorOffset = Math.min(60, gs.doorOffset + 2);
        }

        const effectiveDoorX = doorBaseX + gs.doorOffset;

        // Ground collision
        if (!floorGap && gs.py >= groundY - 24) {
          gs.py = groundY - 24;
          gs.vy = 0;
          gs.onGround = true;
        } else if (floorGap && gs.py >= groundY - 24) {
          gs.onGround = false;
        }

        // Death by falling into void
        if (gs.py > h + 50) {
          respawn();
        }

        // Win / Stage Clear
        if (gs.px >= effectiveDoorX - 20 && Math.abs(gs.py - (groundY - 24)) < 40) {
          if (gs.stage < 3) {
            gs.stage++;
            setCurrentStage(gs.stage);
            gs.px = 60;
            gs.py = 300;
            gs.doorOffset = 0;
            gs.trollTriggered = false;
            triggerHaptic(30);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          } else if (!gs.won) {
            gs.won = true;
            triggerHaptic(60);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            const elapsedSec = Math.max(5, Math.floor((Date.now() - gs.startTime) / 1000));
            const receipt = calculateAndDepositMissionReward({
              gameId: 'poki_leveldevil',
              gameTitle: isKo ? '레벨 데빌' : 'Level Devil',
              durationSeconds: elapsedSec,
              score: Math.max(100, 1000 - gs.deaths * 80),
              maxTargetScore: 1000,
              isVictory: true
            });
            setRewardReceipt(receipt);
            setGameWon(true);
            onReward?.(receipt.totalSns);
          }
        }
      }

      // 2D Drawing
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0f0f17';
      ctx.fillRect(0, 0, w, h);

      // Floor
      ctx.fillStyle = '#1e1b4b';
      // Left floor
      ctx.fillRect(0, groundY, w * 0.35, h - groundY);
      // Center trap floor (disappears if triggered)
      if (!gs.trollTriggered) {
        ctx.fillStyle = '#2e1065';
        ctx.fillRect(w * 0.35, groundY, w * 0.2, h - groundY);
      } else {
        // Red spike hazard in pit
        ctx.fillStyle = '#ef4444';
        for (let x = w * 0.35; x < w * 0.55; x += 15) {
          ctx.beginPath();
          ctx.moveTo(x, h - 20);
          ctx.lineTo(x + 7, h - 40);
          ctx.lineTo(x + 15, h - 20);
          ctx.fill();
        }
      }
      // Right floor
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(w * 0.55, groundY, w * 0.45, h - groundY);

      // Goal Door
      const effectiveDoorX = w - 100 + gs.doorOffset;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(effectiveDoorX, groundY - 60, 36, 60, [8, 8, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', effectiveDoorX + 18, groundY - 30);

      // Hero Sprite
      const pSize = 44;
      drawCardSprite(ctx, effectiveCardId, gs.px - pSize / 2, gs.py - pSize / 2, pSize, pSize, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#a855f7',
        shadowBlur: 10,
        shadowColor: 'rgba(168, 85, 247, 0.8)'
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, isKo, onReward, playSfx]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <MinimalistMissionHUD
        title={isKo ? '레벨 데빌' : 'Level Devil'}
        score={Math.max(100, 1000 - deaths * 80)}
        targetScore={1000}
        stageInfo={`STAGE ${currentStage} / 3 | DEATHS: ${deaths}`}
        onExit={handleExit}
        unit="pt"
      />

      {/* On-screen Touch Controls (Left, Right, Jump) */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-20 pointer-events-auto">
        <div className="flex gap-4">
          <button
            onTouchStart={() => { gameStateRef.current.leftPressed = true; }}
            onTouchEnd={() => { gameStateRef.current.leftPressed = false; }}
            className="w-16 h-16 rounded-full bg-slate-900/90 border-2 border-slate-700 text-white font-black text-2xl active:bg-indigo-600 active:scale-95 shadow-lg flex items-center justify-center cursor-pointer"
          >
            ◀
          </button>
          <button
            onTouchStart={() => { gameStateRef.current.rightPressed = true; }}
            onTouchEnd={() => { gameStateRef.current.rightPressed = false; }}
            className="w-16 h-16 rounded-full bg-slate-900/90 border-2 border-slate-700 text-white font-black text-2xl active:bg-indigo-600 active:scale-95 shadow-lg flex items-center justify-center cursor-pointer"
          >
            ▶
          </button>
        </div>
        <button
          onTouchStart={jump}
          className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-lg active:scale-95 shadow-lg shadow-amber-500/30 flex items-center justify-center cursor-pointer border-2 border-amber-300"
        >
          JUMP
        </button>
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

export default PokiLevelDevilGame;
