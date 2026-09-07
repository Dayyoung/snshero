import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiScaryTeacherHideSeekGameProps {
  onClose: () => void;
}

interface Item {
  id: number;
  x: number;
  y: number;
  name: string;
  emoji: string;
  collected: boolean;
}

interface Furniture {
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
}

export default function PokiScaryTeacherHideSeekGame({ onClose }: PokiScaryTeacherHideSeekGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [itemsCollected, setItemsCollected] = useState(0);
  const [isHiding, setIsHiding] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const stateRef = useRef<{
    player: { x: number; y: number; hidden: boolean };
    teacher: {
      x: number;
      y: number;
      angle: number;
      patrolIndex: number;
      speed: number;
      patrolPoints: { x: number; y: number }[];
    };
    items: Item[];
    furniture: Furniture[];
    touchPos: { x: number; y: number } | null;
  }>({
    player: { x: 80, y: 80, hidden: false },
    teacher: {
      x: 300,
      y: 300,
      angle: 0,
      patrolIndex: 0,
      speed: 1.6,
      patrolPoints: [
        { x: 300, y: 150 },
        { x: 500, y: 150 },
        { x: 500, y: 350 },
        { x: 300, y: 350 }
      ]
    },
    items: [
      { id: 1, x: 450, y: 100, name: '장난 거미', emoji: '🕷️', collected: false },
      { id: 2, x: 520, y: 280, name: '방귀 쿠션', emoji: '💨', collected: false },
      { id: 3, x: 260, y: 380, name: '장난 압정', emoji: '📌', collected: false }
    ],
    furniture: [
      { x: 180, y: 120, w: 60, h: 50, name: '소파' },
      { x: 380, y: 220, w: 70, h: 60, name: '식탁' },
      { x: 180, y: 280, w: 50, h: 70, name: '옷장' }
    ],
    touchPos: null
  });

  const playSound = (type: 'collect' | 'hide' | 'spotted' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'collect') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'hide') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'spotted') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.12);
        osc.frequency.setValueAtTime(784, now + 0.24);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {}
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

      // Adjust patrol points relative to canvas
      const w = canvas.width;
      const h = canvas.height;
      stateRef.current.teacher.patrolPoints = [
        { x: w * 0.4, y: h * 0.3 },
        { x: w * 0.75, y: h * 0.3 },
        { x: w * 0.75, y: h * 0.7 },
        { x: w * 0.4, y: h * 0.7 }
      ];
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const s = stateRef.current;
      const p = s.player;
      const t = s.teacher;

      // Move player towards touch
      if (s.touchPos) {
        const dx = s.touchPos.x - p.x;
        const dy = s.touchPos.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 6) {
          p.x += (dx / dist) * 3.4;
          p.y += (dy / dist) * 3.4;
        }
      }

      // Check if hiding behind furniture
      let nearFurniture = false;
      s.furniture.forEach((f) => {
        if (
          p.x >= f.x - 15 &&
          p.x <= f.x + f.w + 15 &&
          p.y >= f.y - 15 &&
          p.y <= f.y + f.h + 15
        ) {
          nearFurniture = true;
        }
      });
      p.hidden = nearFurniture;
      setIsHiding(nearFurniture);

      // Teacher Patrol AI
      const currentTarget = t.patrolPoints[t.patrolIndex];
      const tdx = currentTarget.x - t.x;
      const tdy = currentTarget.y - t.y;
      const tdist = Math.hypot(tdx, tdy);

      t.angle = Math.atan2(tdy, tdx);
      if (tdist < 10) {
        t.patrolIndex = (t.patrolIndex + 1) % t.patrolPoints.length;
      } else {
        t.x += Math.cos(t.angle) * t.speed;
        t.y += Math.sin(t.angle) * t.speed;
      }

      // Teacher Vision Cone & Player Detection
      const distToPlayer = Math.hypot(p.x - t.x, p.y - t.y);
      const angleToPlayer = Math.atan2(p.y - t.y, p.x - t.x);
      let angleDiff = Math.abs(angleToPlayer - t.angle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      // Field of view: 80 degrees (~1.4 rad), distance: 160px
      if (distToPlayer < 160 && angleDiff < 0.7 && !p.hidden && !gameOver) {
        // Spotted!
        setGameOver(true);
        playSound('spotted');
      }

      // Item Collection
      s.items.forEach((it) => {
        if (!it.collected && Math.hypot(p.x - it.x, p.y - it.y) < 30) {
          it.collected = true;
          playSound('collect');
          const count = s.items.filter((x) => x.collected).length;
          setItemsCollected(count);
        }
      });

      // Exit condition (bottom right door)
      const exitPos = { x: canvas.width - 50, y: canvas.height - 50 };
      const allItemsCollected = s.items.every((x) => x.collected);
      if (
        allItemsCollected &&
        Math.hypot(p.x - exitPos.x, p.y - exitPos.y) < 45 &&
        !gameWon
      ) {
        setGameWon(true);
        playSound('win');
        const deposit = calculateAndDepositMissionReward({
          gameId: 'pokiscaryteacherhideseek',
          gameTitle: 'Scary Teacher Hide & Seek',
          isVictory: true,
          score: 1000,
          maxTargetScore: 1000,
          durationSeconds: 30
        });
        setRewardResult(deposit);
      }

      // RENDER
      ctx.fillStyle = '#1c1917'; // Dark wooden floor
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor Planks
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Furniture (Hide spots)
      s.furniture.forEach((f) => {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.strokeRect(f.x, f.y, f.w, f.h);

        ctx.fillStyle = '#fef3c7';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(f.name, f.x + f.w / 2, f.y + f.h / 2 + 3);
      });

      // Draw Items
      s.items.forEach((it) => {
        if (!it.collected) {
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(it.emoji, it.x, it.y + 6);
        }
      });

      // Draw Exit Door
      ctx.fillStyle = allItemsCollected ? '#22c55e' : '#71717a';
      ctx.fillRect(exitPos.x - 25, exitPos.y - 25, 50, 50);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(exitPos.x - 25, exitPos.y - 25, 50, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', exitPos.x, exitPos.y + 4);

      // Draw Teacher Vision Cone
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.arc(t.x, t.y, 160, t.angle - 0.7, t.angle + 0.7);
      ctx.closePath();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Draw Scary Teacher (Red Dress Silhouette)
      ctx.save();
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Angry Teacher Eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(t.x + Math.cos(t.angle + 0.4) * 12, t.y + Math.sin(t.angle + 0.4) * 12, 3.5, 0, Math.PI * 2);
      ctx.arc(t.x + Math.cos(t.angle - 0.4) * 12, t.y + Math.sin(t.angle - 0.4) * 12, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw Player Student Card Sprite
      ctx.save();
      if (p.hidden) {
        ctx.globalAlpha = 0.5; // Transparency when hiding
      }
      drawCardSprite(ctx, 71, p.x - 18, p.y - 18, 36, 36);
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Touch Event Handling
    const handleTouchStart = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      stateRef.current.touchPos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      stateRef.current.touchPos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };

    const handleTouchEnd = () => {
      stateRef.current.touchPos = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameWon]);

  return (
    <div className="relative w-full h-full bg-stone-950 flex flex-col select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Scary Teacher Hide & Seek"
        missionTarget="장난 아이템 3개 수집 후 탈출구 도달"
        currentProgress={`아이템: ${itemsCollected} / 3 | 상태: ${isHiding ? '은폐 중 (안전)' : '노출됨 (위험)'}`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Bottom Guide */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-zinc-900/80 text-zinc-300 border border-zinc-700 px-3 py-1.5 text-xs rounded-sm">
            터치/드래그 이동 | 가구 뒤에 숨어 선생님의 붉은 시야각(FOV)을 피하세요!
          </span>
        </div>

        {/* Game Over Modal */}
        {gameOver && !gameWon && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-none text-center max-w-sm">
              <h2 className="text-xl font-bold text-red-400 mb-2">미스 T에게 발각됨!</h2>
              <p className="text-xs text-zinc-400 mb-4">선생님의 무서운 시야에 걸려 방과 후 벌청소를 받게 되었습니다.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-sm"
                >
                  다시 도전
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-sm border border-zinc-700"
                >
                  나가기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {gameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          rewardSNS={rewardResult.rewardSNS}
          gameTitle="Scary Teacher Hide & Seek"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
