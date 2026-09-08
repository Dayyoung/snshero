import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMurderGameProps {
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

export const PokiMurderGame: React.FC<PokiMurderGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 29;

  const [stabGauge, setStabGauge] = useState(0);
  const [kingLookBack, setKingLookBack] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    gauge: 0,
    isHolding: false,
    kingTurning: false,
    lookBackTimer: 3,
    turnAnim: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimurder',
      gameTitle: isKo ? 'Murder (머더)' : 'Murder',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        // King lookback cycle
        s.lookBackTimer -= dt;
        if (s.lookBackTimer <= 0) {
          s.kingTurning = !s.kingTurning;
          setKingLookBack(s.kingTurning);
          s.lookBackTimer = s.kingTurning ? 1.5 : 2.5 + Math.random() * 2;
          if (s.kingTurning && navigator.vibrate) navigator.vibrate(30);
        }

        // Holding knife
        if (s.isHolding) {
          s.gauge += dt * 45;
          setStabGauge(Math.min(100, Math.floor(s.gauge)));

          // Caught by King!
          if (s.kingTurning) {
            s.gauge = 0;
            setStabGauge(0);
            if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
          }

          if (s.gauge >= 100) {
            handleVictory();
          }
        } else {
          s.gauge = Math.max(0, s.gauge - dt * 25);
          setStabGauge(Math.floor(s.gauge));
        }
      }

      // Render Palace Hallway
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor red carpet
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(canvas.width / 2 - 80, 0, 160, canvas.height);

      // King ahead
      const kingX = canvas.width / 2;
      const kingY = 220;
      ctx.fillStyle = '#eab308';
      // Crown
      ctx.beginPath();
      ctx.arc(kingX, kingY - 30, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(kingX - 25, kingY - 10, 50, 60);

      // King eyes if looking back
      if (s.kingTurning) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(kingX - 6, kingY - 30, 4, 0, Math.PI * 2);
        ctx.arc(kingX + 6, kingY - 30, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(kingX - 6, kingY - 28, 2, 0, Math.PI * 2);
        ctx.arc(kingX + 6, kingY - 28, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('👀 !', kingX + 25, kingY - 35);
      }

      // Player behind King
      const px = canvas.width / 2;
      const py = 450;
      drawCardSprite(ctx, effectiveCardId, px - 25, py - 30, 50, 50);

      // Dagger in hand
      if (s.isHolding) {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(px + 18, py - 40, 6, 25);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(px + 16, py - 15, 10, 8);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory]);

  const onTouchStart = () => {
    gameState.current.isHolding = true;
  };

  const onTouchEnd = () => {
    gameState.current.isHolding = false;
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onTouchStart}
      onMouseUp={onTouchEnd}
    >
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Murder (머더)' : 'Murder'}
        currentScore={stabGauge}
        targetScore={100}
        onBack={handleExit}
        stageInfo={`${stabGauge}% / 100% | ${kingLookBack ? (isKo ? '왕이 뒤돌아봄!' : 'KING WATCHING!') : (isKo ? '기회!' : 'OPPORTUNITY')}`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Hold Indicator */}
      <div className="absolute bottom-8 inset-x-6 text-center z-20 pointer-events-none">
        <div className="w-full bg-slate-800 rounded-full h-4 mb-4 overflow-hidden border border-slate-600">
          <div className="bg-red-600 h-full transition-all duration-75" style={{ width: `${stabGauge}%` }} />
        </div>
        <span className="inline-block bg-slate-900/80 border border-slate-700 text-white font-bold py-3 px-8 rounded-full text-base backdrop-blur-md">
          {isKo ? '화면을 누르고 있으면 단검을 듭니다. 왕이 볼 땐 손을 떼세요!' : 'HOLD TO RAISE KNIFE! RELEASE WHEN KING LOOKS BACK!'}
        </span>
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          reward={rewardReceipt}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};

export default PokiMurderGame;
