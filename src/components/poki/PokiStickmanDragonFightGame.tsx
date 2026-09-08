import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStickmanDragonFightGameProps {
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

export const PokiStickmanDragonFightGame: React.FC<PokiStickmanDragonFightGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 77;

  const [ki, setKi] = useState(0);
  const [rivalHp, setRivalHp] = useState(100);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    kiGauge: 0,
    rivalHp: 100,
    isCharging: false,
    beamActive: false,
    beamTimer: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokistickmandragonfight',
      gameTitle: isKo ? '스틱맨 드래곤 파이트' : 'Stickman Dragon Fight',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const fireBeam = useCallback(() => {
    const s = gameState.current;
    if (s.kiGauge < 50 || s.beamActive) return;

    s.kiGauge -= 50;
    setKi(s.kiGauge);
    s.beamActive = true;
    s.beamTimer = 0.6;
    s.rivalHp = Math.max(0, s.rivalHp - 50);
    setRivalHp(s.rivalHp);

    if (playSfx) playSfx('/sfx/kamehameha.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    if (s.rivalHp <= 0) {
      handleVictory();
    }
  }, [handleVictory, playSfx]);

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
        if (s.isCharging) {
          s.kiGauge = Math.min(100, s.kiGauge + 55 * dt);
          setKi(Math.floor(s.kiGauge));
        }

        if (s.beamActive) {
          s.beamTimer -= dt;
          if (s.beamTimer <= 0) s.beamActive = false;
        }
      }

      // Render Dragon Battlefield
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const py = 350;

      // Aura if charging
      if (s.isCharging) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath();
        ctx.arc(80, py, 45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Kamehameha Beam
      if (s.beamActive) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(100, py - 15, canvas.width - 180, 30);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(100, py - 6, canvas.width - 180, 12);
      }

      // Rival Stickman
      const rx = canvas.width - 80;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(rx, py, 20, 0, Math.PI * 2);
      ctx.fill();

      // Rival HP
      ctx.fillStyle = '#334155';
      ctx.fillRect(rx - 30, py - 45, 60, 8);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(rx - 30, py - 45, (s.rivalHp / 100) * 60, 8);

      // Player Saiyan Card Sprite
      drawCardSprite(ctx, effectiveCardId, 55, py - 25, 50, 50);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '스틱맨 드래곤 파이트' : 'Dragon Fight'}
        currentScore={100 - rivalHp}
        targetScore={100}
        onBack={handleExit}
        stageInfo={`⚡ Ki: ${ki}% | Rival HP: ${rivalHp}%`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Charge & Fire Buttons */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-6 z-20">
        <button
          className="flex-1 h-20 bg-blue-600 active:bg-blue-500 border-2 border-blue-400 text-white font-bold text-xl rounded-2xl shadow-xl active:scale-95"
          onTouchStart={() => { gameState.current.isCharging = true; }}
          onTouchEnd={() => { gameState.current.isCharging = false; }}
          onMouseDown={() => { gameState.current.isCharging = true; }}
          onMouseUp={() => { gameState.current.isCharging = false; }}
        >
          CHARGE KI ⚡
        </button>
        <button
          className="flex-1 h-20 bg-amber-600 active:bg-amber-500 border-2 border-amber-400 text-white font-bold text-xl rounded-2xl shadow-xl active:scale-95"
          onClick={fireBeam}
        >
          KAMEHAMEHA! 💥
        </button>
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

export default PokiStickmanDragonFightGame;
