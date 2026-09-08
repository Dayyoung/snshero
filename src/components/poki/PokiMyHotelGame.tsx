import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMyHotelGameProps {
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

interface Guest {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: 'waiting_checkin' | 'in_room' | 'leaving';
  assignedRoom: number;
  stayTime: number;
}

interface Room {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  isOccupied: boolean;
  needsCleaning: boolean;
  cleanProgress: number;
}

export const PokiMyHotelGame: React.FC<PokiMyHotelGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 12;

  const [servedCount, setServedCount] = useState(0);
  const [money, setMoney] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 400,
    targetX: 200,
    targetY: 400,
    served: 0,
    cash: 0,
    rooms: [
      { id: 0, x: 40, y: 150, w: 140, h: 120, isOccupied: false, needsCleaning: false, cleanProgress: 0 },
      { id: 1, x: 220, y: 150, w: 140, h: 120, isOccupied: false, needsCleaning: false, cleanProgress: 0 },
      { id: 2, x: 40, y: 300, w: 140, h: 120, isOccupied: false, needsCleaning: false, cleanProgress: 0 },
      { id: 3, x: 220, y: 300, w: 140, h: 120, isOccupied: false, needsCleaning: false, cleanProgress: 0 },
    ] as Room[],
    guests: [] as Guest[],
    guestSpawnTimer: 0,
    frontDesk: { x: 150, y: 480, w: 100, h: 40 }
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimyhotel',
      gameTitle: isKo ? 'My Perfect Hotel (퍼펙트 호텔)' : 'My Perfect Hotel',
      durationSeconds: 30,
      score: gameState.current.served * 100 + gameState.current.cash * 10,
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
        // Player move to target
        const dx = s.targetX - s.px;
        const dy = s.targetY - s.py;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          s.px += (dx / dist) * 200 * dt;
          s.py += (dy / dist) * 200 * dt;
        }

        // Spawn guests
        s.guestSpawnTimer += dt;
        if (s.guestSpawnTimer > 3 && s.guests.length < 3) {
          s.guestSpawnTimer = 0;
          s.guests.push({
            id: Date.now() + Math.random(),
            x: 200,
            y: 600,
            targetX: 200,
            targetY: 530,
            state: 'waiting_checkin',
            assignedRoom: -1,
            stayTime: 0
          });
        }

        // Check front desk checkin
        const nearFront = Math.hypot(s.px - 200, s.py - 460) < 50;
        if (nearFront) {
          const waitingGuest = s.guests.find(g => g.state === 'waiting_checkin');
          if (waitingGuest) {
            const emptyRoom = s.rooms.find(r => !r.isOccupied && !r.needsCleaning);
            if (emptyRoom) {
              emptyRoom.isOccupied = true;
              waitingGuest.state = 'in_room';
              waitingGuest.assignedRoom = emptyRoom.id;
              waitingGuest.targetX = emptyRoom.x + emptyRoom.w / 2;
              waitingGuest.targetY = emptyRoom.y + emptyRoom.h / 2;
              if (playSfx) playSfx('/sfx/bell.mp3');
              if (navigator.vibrate) navigator.vibrate(25);
            }
          }
        }

        // Update guests
        for (let i = s.guests.length - 1; i >= 0; i--) {
          const g = s.guests[i];
          const gdx = g.targetX - g.x;
          const gdy = g.targetY - g.y;
          const gdist = Math.hypot(gdx, gdy);
          if (gdist > 3) {
            g.x += (gdx / gdist) * 90 * dt;
            g.y += (gdy / gdist) * 90 * dt;
          }

          if (g.state === 'in_room') {
            g.stayTime += dt;
            if (g.stayTime > 5) {
              // Leave room and make room dirty
              const room = s.rooms[g.assignedRoom];
              if (room) {
                room.isOccupied = false;
                room.needsCleaning = true;
                room.cleanProgress = 0;
              }
              g.state = 'leaving';
              g.targetX = 200;
              g.targetY = 650;
              s.cash += 50;
              setMoney(s.cash);
              s.served++;
              setServedCount(s.served);
              if (playSfx) playSfx('/sfx/coin.mp3');
              if (s.served >= 8) {
                handleVictory();
              }
            }
          } else if (g.state === 'leaving' && g.y > 620) {
            s.guests.splice(i, 1);
          }
        }

        // Clean room if player is inside dirty room
        for (const r of s.rooms) {
          if (r.needsCleaning) {
            if (s.px >= r.x && s.px <= r.x + r.w && s.py >= r.y && s.py <= r.y + r.h) {
              r.cleanProgress += dt * 50;
              if (r.cleanProgress >= 100) {
                r.needsCleaning = false;
                r.cleanProgress = 0;
                s.cash += 20;
                setMoney(s.cash);
                if (navigator.vibrate) navigator.vibrate(30);
              }
            }
          }
        }
      }

      // Render 2D Top-down
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Hotel carpet
      ctx.fillStyle = '#334155';
      ctx.fillRect(20, 100, 360, 500);

      // Rooms
      for (const r of s.rooms) {
        ctx.fillStyle = r.isOccupied ? '#1e1b4b' : r.needsCleaning ? '#451a03' : '#0f172a';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x, r.y, r.w, r.h);

        // Bed icon
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(r.x + 15, r.y + 15, 40, 60);

        // Room Status text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        if (r.isOccupied) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(isKo ? '투숙 중' : 'Occupied', r.x + 10, r.y + 105);
        } else if (r.needsCleaning) {
          ctx.fillStyle = '#f87171';
          ctx.fillText(isKo ? `청소 필요 (${Math.floor(r.cleanProgress)}%)` : `Clean (${Math.floor(r.cleanProgress)}%)`, r.x + 10, r.y + 105);
        } else {
          ctx.fillStyle = '#4ade80';
          ctx.fillText(isKo ? '빈 객실' : 'Ready', r.x + 10, r.y + 105);
        }
      }

      // Front Desk
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(s.frontDesk.x, s.frontDesk.y, s.frontDesk.w, s.frontDesk.h, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(isKo ? '프론트 데스크' : 'FRONT DESK', s.frontDesk.x + 10, s.frontDesk.y + 24);

      // Guests
      for (const g of s.guests) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText('VIP', g.x - 9, g.y + 4);
      }

      // Player Character
      drawCardSprite(ctx, effectiveCardId, s.px - 22, s.py - 22, 44, 44);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameState.current.targetX = e.clientX - rect.left;
      gameState.current.targetY = e.clientY - rect.top;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (e.buttons > 0) {
        const rect = canvas.getBoundingClientRect();
        gameState.current.targetX = e.clientX - rect.left;
        gameState.current.targetY = e.clientY - rect.top;
      }
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [effectiveCardId, gameWon, handleVictory, isKo, playSfx]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'My Perfect Hotel (퍼펙트 호텔)' : 'My Perfect Hotel'}
        currentScore={servedCount}
        targetScore={8}
        onBack={handleExit}
        stageInfo={`${isKo ? '손님 서비스' : 'Guests'}: ${servedCount}/8 | 💰 $${money}`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 bg-slate-900/80 border border-slate-700 p-3 rounded-xl text-center text-xs text-slate-300 pointer-events-none backdrop-blur-md">
        {isKo ? '화면을 탭하여 이동하세요. 프론트 데스크와 객실로 가서 체크인 & 청소를 수행하세요!' : 'Tap anywhere to move! Manage front desk and clean rooms!'}
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

export default PokiMyHotelGame;
