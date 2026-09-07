import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiMyHotelGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isOccupied: boolean;
  isDirty: boolean;
  guestTimer: number;
  cashOnFloor: number;
}

interface Guest {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  charId: number;
  assignedRoomId: number | null;
}

export const PokiMyHotelGame: React.FC<PokiMyHotelGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 12;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [cash, setCash] = useState<number>(50);
  const [roomsUnlocked, setRoomsUnlocked] = useState<number>(2);
  const [timeLeft, setTimeLeft] = useState<number>(50);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_my_hotel') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    player: {
      x: 180,
      y: 420,
      targetX: 180,
      targetY: 420,
      speed: 4.5,
      isHoldingKey: true,
    },
    rooms: [] as Room[],
    guests: [] as Guest[],
    checkinDesk: { x: 180, y: 460, width: 80, height: 24 },
    combo: 0,
    isTouchActive: false,
  });

  const initHotel = useCallback(() => {
    const rooms: Room[] = [
      { id: 1, x: 40, y: 120, width: 75, height: 75, isOccupied: false, isDirty: false, guestTimer: 0, cashOnFloor: 0 },
      { id: 2, x: 140, y: 120, width: 75, height: 75, isOccupied: false, isDirty: false, guestTimer: 0, cashOnFloor: 0 },
      { id: 3, x: 240, y: 120, width: 75, height: 75, isOccupied: false, isDirty: false, guestTimer: 0, cashOnFloor: 0 },
      { id: 4, x: 40, y: 230, width: 75, height: 75, isOccupied: false, isDirty: false, guestTimer: 0, cashOnFloor: 0 },
    ];
    stateRef.current.rooms = rooms;
    stateRef.current.guests = [];
  }, []);

  useEffect(() => {
    initHotel();
  }, [initHotel]);

  // Spawn guest
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const interval = setInterval(() => {
      const guests = stateRef.current.guests;
      if (guests.length < 3) {
        const guestChars = [102, 105, 109, 114, 119];
        guests.push({
          id: Date.now() + Math.random(),
          x: 180,
          y: 540,
          targetX: 180,
          targetY: 480, // waiting at check-in desk
          charId: guestChars[Math.floor(Math.random() * guestChars.length)],
          assignedRoomId: null,
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isGameOver, isVictory, showTutorial]);

  // Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(score >= 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial, score]);

  const handleGameOver = useCallback((victory: boolean) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = score + (victory ? 400 : 80);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_my_hotel',
      gameTitle: isKo ? '마이 퍼펙트 호텔' : 'My Perfect Hotel',
      durationSeconds: 50 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && roomsUnlocked >= 4,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, roomsUnlocked, isKo, onReward, playSfx]);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const p = stateRef.current.player;
      const rooms = stateRef.current.rooms;
      const guests = stateRef.current.guests;
      const desk = stateRef.current.checkinDesk;

      // Player seek target
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 4) {
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
      }

      // Guest check-in logic
      const waitingGuest = guests.find(g => g.assignedRoomId === null && Math.hypot(g.x - 180, g.y - 480) < 15);
      if (waitingGuest && Math.hypot(p.x - desk.x, p.y - desk.y) < 40) {
        // Find available clean room
        const availRoom = rooms.find(r => r.id <= roomsUnlocked && !r.isOccupied && !r.isDirty);
        if (availRoom) {
          waitingGuest.assignedRoomId = availRoom.id;
          waitingGuest.targetX = availRoom.x + availRoom.width / 2;
          waitingGuest.targetY = availRoom.y + availRoom.height / 2;
          availRoom.isOccupied = true;
          availRoom.guestTimer = 160; // Stay duration
          setScore(s => s + 40);
          stateRef.current.combo++;
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      }

      // Update Guests & Rooms
      for (let i = guests.length - 1; i >= 0; i--) {
        const g = guests[i];
        const gdx = g.targetX - g.x;
        const gdy = g.targetY - g.y;
        const gdist = Math.sqrt(gdx * gdx + gdy * gdy);
        if (gdist > 3) {
          g.x += (gdx / gdist) * 2.8;
          g.y += (gdy / gdist) * 2.8;
        }

        // Inside room timer
        if (g.assignedRoomId) {
          const r = rooms.find(rm => rm.id === g.assignedRoomId);
          if (r && r.guestTimer > 0) {
            r.guestTimer--;
            if (r.guestTimer <= 0) {
              // Guest leaves room dirty and drops cash!
              r.isOccupied = false;
              r.isDirty = true;
              r.cashOnFloor += 50;
              guests.splice(i, 1);
              if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            }
          }
        }
      }

      // Player clean dirty room & collect cash
      for (const r of rooms) {
        if (Math.hypot(p.x - (r.x + r.width / 2), p.y - (r.y + r.height / 2)) < 45) {
          if (r.cashOnFloor > 0) {
            setCash(c => c + r.cashOnFloor);
            setScore(s => s + r.cashOnFloor * 2);
            r.cashOnFloor = 0;
            stateRef.current.combo++;
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }
          if (r.isDirty) {
            r.isDirty = false;
            setScore(s => s + 30);
          }
        }
      }

      if (score >= 1000) {
        handleGameOver(true);
        return;
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Hotel lobby floor (Warm wood laminate)
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(0, 0, width, height);

      // Draw Rooms
      for (const r of rooms) {
        const isUnlocked = r.id <= roomsUnlocked;
        ctx.fillStyle = isUnlocked ? (r.isDirty ? '#451a03' : (r.isOccupied ? '#1e3a5f' : '#14532d')) : '#0f172a';
        ctx.fillRect(r.x, r.y, r.width, r.height);

        ctx.strokeStyle = isUnlocked ? '#f59e0b' : '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x, r.y, r.width, r.height);

        // Room label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`ROOM ${r.id}`, r.x + r.width / 2, r.y + 18);

        // Status
        ctx.font = '10px monospace';
        const st = isUnlocked ? (r.isDirty ? '🧹 CLEAN' : (r.isOccupied ? '💤 SLEEP' : '✨ READY')) : '🔒 LOCKED';
        ctx.fillText(st, r.x + r.width / 2, r.y + 36);

        // Cash on floor
        if (r.cashOnFloor > 0) {
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(r.x + r.width / 2, r.y + 55, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.fillText('💵', r.x + r.width / 2, r.y + 58);
        }
      }

      // Draw Check-in Desk
      ctx.fillStyle = '#78350f';
      ctx.fillRect(desk.x - desk.width / 2, desk.y, desk.width, desk.height);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(desk.x - desk.width / 2, desk.y, desk.width, desk.height);
      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('RECEPTION', desk.x, desk.y + 16);

      // Draw Guests
      for (const g of guests) {
        drawCardSprite(ctx, g.charId, g.x - 14, g.y - 14, 28, 28, {
          circleClip: true,
          borderWidth: 1.5,
          borderColor: '#38bdf8',
        });
      }

      // Draw Player Hero (Hotel Manager)
      drawCardSprite(ctx, playerHeroId, p.x - 18, p.y - 18, 36, 36, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#f59e0b',
        shadowBlur: 8,
        shadowColor: '#f59e0b',
      });

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, roomsUnlocked, score, playerHeroId, handleGameOver]);

  // Touch Move
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.isTouchActive = true;
    stateRef.current.player.targetX = e.clientX - rect.left;
    stateRef.current.player.targetY = e.clientY - rect.top;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.isTouchActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.player.targetX = e.clientX - rect.left;
    stateRef.current.player.targetY = e.clientY - rect.top;
  };

  const handlePointerUp = () => {
    stateRef.current.isTouchActive = false;
  };

  const unlockNextRoom = () => {
    if (cash >= 100 && roomsUnlocked < 4) {
      setCash(c => c - 100);
      setRoomsUnlocked(r => r + 1);
      setScore(s => s + 150);
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'GOAL',
      title: isKo ? '마이 퍼펙트 호텔 (타이쿤)' : 'My Perfect Hotel',
      description: isKo
        ? '체크인 데스크로 다가가 손님에게 방을 배정하고, 손님이 나간 방을 청소하여 현금을 수집하세요!'
        : 'Walk to the reception desk to check in guests, then clean rooms and collect cash!',
      keyPoints: isKo ? ['손님 체크인', '룸 청소 & 소독', '현금 수거'] : ['Check in guests', 'Clean rooms', 'Collect cash'],
    },
    {
      badge: 'MANAGEMENT',
      title: isKo ? '객실 확장 & 호텔 경영' : 'Expand & Upgrade Rooms',
      description: isKo
        ? '수집한 현금으로 하단의 룸 확장 버튼을 눌러 새 객실을 오픈하고 스코어 1,000점을 달성하세요.'
        : 'Use your earned revenue to unlock new rooms and reach 1,000 points to win!',
      keyPoints: isKo ? ['신규 객실 오픈', '수익 증대', '1,000점 달성'] : ['Unlock rooms', 'Boost revenue', 'Reach 1,000 pts'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.12 마이 퍼펙트 호텔' : 'No.12 My Perfect Hotel'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`현금: $${cash} | 객실: ${roomsUnlocked}/4실`}
        combo={stateRef.current.combo}
        onExit={onExit}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full rounded-sm border border-slate-800 touch-none shadow-inner"
        />

        {/* Upgrade Button Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {roomsUnlocked < 4 && (
            <button
              onClick={unlockNextRoom}
              disabled={cash < 100}
              className={`px-4 py-1.5 rounded-sm text-xs font-bold transition-all shadow-md ${
                cash >= 100
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              🏨 {isKo ? `객실 확장 ($100)` : `UNLOCK ROOM ($100)`}
            </button>
          )}
        </div>
      </div>

      {/* Victory Reward Modal */}
      {settlementReceipt && (
        <VictoryRewardModal
          isOpen={isGameOver}
          isVictory={isVictory}
          score={score}
          receipt={settlementReceipt}
          onConfirm={onExit}
          onRestart={() => {
            setIsGameOver(false);
            setIsVictory(false);
            setSettlementReceipt(null);
            setScore(0);
            setCash(50);
            setRoomsUnlocked(2);
            setTimeLeft(50);
            initHotel();
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.12 마이 퍼펙트 호텔' : 'No.12 My Perfect Hotel'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_my_hotel', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};
