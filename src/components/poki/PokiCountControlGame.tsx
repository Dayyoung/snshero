import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCountControlGameProps {
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

interface BaseNode {
  id: number;
  x: number;
  y: number;
  owner: 'player' | 'neutral' | 'enemy';
  count: number;
}

export const PokiCountControlGame: React.FC<PokiCountControlGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 47;

  const [playerBases, setPlayerBases] = useState(1);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    nodes: [
      { id: 1, x: 80, y: 480, owner: 'player', count: 30 },
      { id: 2, x: 200, y: 320, owner: 'neutral', count: 15 },
      { id: 3, x: 320, y: 480, owner: 'neutral', count: 15 },
      { id: 4, x: 200, y: 160, owner: 'enemy', count: 20 },
    ] as BaseNode[],
    selectedNodeId: null as number | null
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokicountcontrol',
      gameTitle: isKo ? '카운트 컨트롤 레전드' : 'Count Control',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const sendTroops = useCallback((fromId: number, toId: number) => {
    const s = gameState.current;
    const from = s.nodes.find(n => n.id === fromId);
    const to = s.nodes.find(n => n.id === toId);
    if (!from || !to || fromId === toId) return;

    const dispatch = Math.floor(from.count / 2);
    from.count -= dispatch;

    if (to.owner === from.owner) {
      to.count += dispatch;
    } else {
      if (dispatch > to.count) {
        to.owner = from.owner;
        to.count = dispatch - to.count;
        if (playSfx) playSfx('/sfx/capture.mp3');
        if (navigator.vibrate) navigator.vibrate(30);
      } else {
        to.count -= dispatch;
      }
    }

    const pCount = s.nodes.filter(n => n.owner === 'player').length;
    setPlayerBases(pCount);
    if (pCount === s.nodes.length) {
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
        // Natural troop generation
        for (const n of s.nodes) {
          if (n.owner !== 'neutral') {
            n.count += dt * 3;
          }
        }
      }

      // Render Strategy Map
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Links between bases
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 3;
      for (let i = 0; i < s.nodes.length; i++) {
        for (let j = i + 1; j < s.nodes.length; j++) {
          ctx.beginPath();
          ctx.moveTo(s.nodes[i].x, s.nodes[i].y);
          ctx.lineTo(s.nodes[j].x, s.nodes[j].y);
          ctx.stroke();
        }
      }

      // Nodes
      for (const n of s.nodes) {
        ctx.fillStyle = n.owner === 'player' ? '#3b82f6' : n.owner === 'enemy' ? '#ef4444' : '#64748b';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 32, 0, Math.PI * 2);
        ctx.fill();

        if (s.selectedNodeId === n.id) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 4;
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(n.count)}`, n.x, n.y + 6);
      }
      ctx.textAlign = 'left';

      // Player Commander Sprite
      drawCardSprite(ctx, effectiveCardId, 30, 80, 44, 44);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const s = gameState.current;

      const clicked = s.nodes.find(n => Math.hypot(n.x - mx, n.y - my) < 36);
      if (clicked) {
        if (!s.selectedNodeId) {
          if (clicked.owner === 'player') {
            s.selectedNodeId = clicked.id;
          }
        } else {
          sendTroops(s.selectedNodeId, clicked.id);
          s.selectedNodeId = null;
        }
      } else {
        s.selectedNodeId = null;
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [effectiveCardId, gameWon, sendTroops]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '카운트 컨트롤 레전드' : 'Count Control'}
        currentScore={playerBases}
        targetScore={4}
        onBack={handleExit}
        stageInfo={`🏰 Bases: ${playerBases}/4`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-blue-200 pointer-events-none">
        {isKo ? '내 파란색 기지를 탭한 뒤 목표 기지를 탭하여 군대를 파견하고 전 기지를 점령하세요!' : 'Tap your blue base then tap target base to dispatch troops!'}
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

export default PokiCountControlGame;
