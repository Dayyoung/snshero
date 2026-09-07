import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMonkeyMartGameProps {
  onClose: () => void;
}

interface Customer {
  id: number;
  x: number;
  y: number;
  target: 'shelf1' | 'shelf2' | 'cashier' | 'exit';
  carrying: 'banana' | 'corn' | null;
  animal: 'panda' | 'cat' | 'giraffe';
  waitTimer: number;
}

interface CashNote {
  id: number;
  x: number;
  y: number;
  val: number;
}

export default function PokiMonkeyMartGame({ onClose }: PokiMonkeyMartGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cash, setCash] = useState(0);
  const [itemsSold, setItemsSold] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const TARGET_CASH = 500;
  const TARGET_SOLD = 30;

  const stateRef = useRef<{
    player: {
      x: number;
      y: number;
      carryingType: 'banana' | 'corn' | null;
      carryingCount: number;
      maxCarry: number;
    };
    bananaTreeStock: number;
    cornPlantStock: number;
    shelf1Bananas: number; // Banana shelf
    shelf2Corn: number; // Corn shelf
    customers: Customer[];
    cashNotes: CashNote[];
    nextId: number;
    touchPos: { x: number; y: number } | null;
    totalSold: number;
    earnedCash: number;
  }>({
    player: {
      x: 180,
      y: 220,
      carryingType: null,
      carryingCount: 0,
      maxCarry: 6
    },
    bananaTreeStock: 10,
    cornPlantStock: 10,
    shelf1Bananas: 4,
    shelf2Corn: 4,
    customers: [],
    cashNotes: [],
    nextId: 1,
    touchPos: null,
    totalSold: 0,
    earnedCash: 0
  });

  const playSound = (type: 'harvest' | 'stock' | 'cash' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'harvest') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'stock') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(550, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'cash') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
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
    };
    resize();
    window.addEventListener('resize', resize);

    let customerSpawnTimer = 0;
    let farmRegenTimer = 0;

    const loop = () => {
      const s = stateRef.current;
      const p = s.player;

      // Player Movement
      if (s.touchPos) {
        const dx = s.touchPos.x - p.x;
        const dy = s.touchPos.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 8) {
          p.x += (dx / dist) * 4;
          p.y += (dy / dist) * 4;
        }
      }

      // Keep Player In Bounds
      p.x = Math.max(30, Math.min(canvas.width - 30, p.x));
      p.y = Math.max(80, Math.min(canvas.height - 80, p.y));

      // Zones Coords
      const bananaTreePos = { x: 70, y: 150 };
      const cornPlantPos = { x: canvas.width - 70, y: 150 };
      const shelf1Pos = { x: canvas.width * 0.35, y: canvas.height * 0.52 };
      const shelf2Pos = { x: canvas.width * 0.65, y: canvas.height * 0.52 };
      const cashierPos = { x: canvas.width / 2, y: canvas.height * 0.78 };

      // Crop Regen
      farmRegenTimer++;
      if (farmRegenTimer > 60) {
        farmRegenTimer = 0;
        if (s.bananaTreeStock < 12) s.bananaTreeStock++;
        if (s.cornPlantStock < 12) s.cornPlantStock++;
      }

      // Player Harvest Banana Tree
      if (
        Math.hypot(p.x - bananaTreePos.x, p.y - bananaTreePos.y) < 45 &&
        s.bananaTreeStock > 0
      ) {
        if (p.carryingType === 'banana' || p.carryingType === null) {
          if (p.carryingCount < p.maxCarry) {
            p.carryingType = 'banana';
            p.carryingCount++;
            s.bananaTreeStock--;
            playSound('harvest');
          }
        }
      }

      // Player Harvest Corn Plant
      if (
        Math.hypot(p.x - cornPlantPos.x, p.y - cornPlantPos.y) < 45 &&
        s.cornPlantStock > 0
      ) {
        if (p.carryingType === 'corn' || p.carryingType === null) {
          if (p.carryingCount < p.maxCarry) {
            p.carryingType = 'corn';
            p.carryingCount++;
            s.cornPlantStock--;
            playSound('harvest');
          }
        }
      }

      // Player Stock Shelf 1 (Bananas)
      if (
        Math.hypot(p.x - shelf1Pos.x, p.y - shelf1Pos.y) < 50 &&
        p.carryingType === 'banana' &&
        p.carryingCount > 0
      ) {
        if (s.shelf1Bananas < 10) {
          s.shelf1Bananas++;
          p.carryingCount--;
          if (p.carryingCount === 0) p.carryingType = null;
          playSound('stock');
        }
      }

      // Player Stock Shelf 2 (Corn)
      if (
        Math.hypot(p.x - shelf2Pos.x, p.y - shelf2Pos.y) < 50 &&
        p.carryingType === 'corn' &&
        p.carryingCount > 0
      ) {
        if (s.shelf2Corn < 10) {
          s.shelf2Corn++;
          p.carryingCount--;
          if (p.carryingCount === 0) p.carryingType = null;
          playSound('stock');
        }
      }

      // Player Collect Cash
      for (let i = s.cashNotes.length - 1; i >= 0; i--) {
        const cn = s.cashNotes[i];
        if (Math.hypot(p.x - cn.x, p.y - cn.y) < 40) {
          s.earnedCash += cn.val;
          setCash(s.earnedCash);
          playSound('cash');
          s.cashNotes.splice(i, 1);
        }
      }

      // Customer Spawning
      customerSpawnTimer++;
      if (customerSpawnTimer > 70 && s.customers.length < 5) {
        customerSpawnTimer = 0;
        const animals: ('panda' | 'cat' | 'giraffe')[] = ['panda', 'cat', 'giraffe'];
        const targetShelf = Math.random() < 0.5 ? 'shelf1' : 'shelf2';
        s.customers.push({
          id: s.nextId++,
          x: canvas.width / 2,
          y: canvas.height + 20,
          target: targetShelf,
          carrying: null,
          animal: animals[Math.floor(Math.random() * animals.length)],
          waitTimer: 0
        });
      }

      // Update Customers
      for (let i = s.customers.length - 1; i >= 0; i--) {
        const c = s.customers[i];
        let tx = canvas.width / 2;
        let ty = canvas.height + 40;

        if (c.target === 'shelf1') {
          tx = shelf1Pos.x;
          ty = shelf1Pos.y + 35;
          const dist = Math.hypot(c.x - tx, c.y - ty);
          if (dist < 10) {
            // Take banana
            if (s.shelf1Bananas > 0) {
              s.shelf1Bananas--;
              c.carrying = 'banana';
              c.target = 'cashier';
            }
          }
        } else if (c.target === 'shelf2') {
          tx = shelf2Pos.x;
          ty = shelf2Pos.y + 35;
          const dist = Math.hypot(c.x - tx, c.y - ty);
          if (dist < 10) {
            // Take corn
            if (s.shelf2Corn > 0) {
              s.shelf2Corn--;
              c.carrying = 'corn';
              c.target = 'cashier';
            }
          }
        } else if (c.target === 'cashier') {
          tx = cashierPos.x;
          ty = cashierPos.y - 30;
          const dist = Math.hypot(c.x - tx, c.y - ty);
          if (dist < 10) {
            c.waitTimer++;
            if (c.waitTimer > 30) {
              // Pay cash and exit!
              s.cashNotes.push({
                id: s.nextId++,
                x: cashierPos.x + (Math.random() - 0.5) * 40,
                y: cashierPos.y + (Math.random() - 0.5) * 20,
                val: 25
              });
              s.totalSold++;
              setItemsSold(s.totalSold);
              c.target = 'exit';
            }
          }
        } else if (c.target === 'exit') {
          tx = canvas.width / 2;
          ty = canvas.height + 40;
          if (c.y > canvas.height + 20) {
            s.customers.splice(i, 1);
            continue;
          }
        }

        // Move customer
        const dx = tx - c.x;
        const dy = ty - c.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 3) {
          c.x += (dx / dist) * 2.2;
          c.y += (dy / dist) * 2.2;
        }
      }

      // Check Win Condition
      if (s.earnedCash >= TARGET_CASH && s.totalSold >= TARGET_SOLD && !gameWon) {
        setGameWon(true);
        playSound('win');
        const deposit = calculateAndDepositMissionReward({
          gameId: 'pokimonkeymart',
          gameTitle: 'Monkey Mart',
          isVictory: true,
          score: 1000,
          maxTargetScore: 1000,
          durationSeconds: 30
        });
        setRewardResult(deposit);
      }

      // RENDER
      ctx.fillStyle = '#fef3c7'; // Mart light tiled floor
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor tiles
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Banana Tree Spot
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(bananaTreePos.x, bananaTreePos.y, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#166534';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`🍌 바나나 (${s.bananaTreeStock})`, bananaTreePos.x, bananaTreePos.y + 4);

      // Corn Plant Spot
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(cornPlantPos.x, cornPlantPos.y, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillText(`🌽 옥수수 (${s.cornPlantStock})`, cornPlantPos.x, cornPlantPos.y + 4);

      // Shelves
      // Shelf 1 (Banana)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(shelf1Pos.x - 36, shelf1Pos.y - 18, 72, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`🍌 진열대: ${s.shelf1Bananas}/10`, shelf1Pos.x, shelf1Pos.y + 4);

      // Shelf 2 (Corn)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(shelf2Pos.x - 36, shelf2Pos.y - 18, 72, 36);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`🌽 진열대: ${s.shelf2Corn}/10`, shelf2Pos.x, shelf2Pos.y + 4);

      // Cashier Counter
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(cashierPos.x - 50, cashierPos.y - 16, 100, 32);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('💵 계산대 (CASH)', cashierPos.x, cashierPos.y + 4);

      // Draw Cash Notes on floor
      s.cashNotes.forEach((cn) => {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(cn.x - 8, cn.y - 5, 16, 10);
        ctx.fillStyle = '#14532d';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('$', cn.x, cn.y + 3);
      });

      // Draw Customers
      s.customers.forEach((c) => {
        ctx.fillStyle = c.animal === 'panda' ? '#18181b' : c.animal === 'cat' ? '#f97316' : '#ea580c';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (c.carrying) {
          ctx.font = '12px sans-serif';
          ctx.fillText(c.carrying === 'banana' ? '🍌' : '🌽', c.x, c.y - 20);
        }
      });

      // Draw Player Monkey Card Sprite
      drawCardSprite(ctx, 68, p.x - 20, p.y - 20, 40, 40);

      // Carrying Bubble
      if (p.carryingCount > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.arc(p.x, p.y - 30, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(
          `${p.carryingType === 'banana' ? '🍌' : '🌽'}${p.carryingCount}`,
          p.x,
          p.y - 26
        );
      }

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
    <div className="relative w-full h-full bg-amber-50 flex flex-col select-none overflow-hidden font-mono text-zinc-900">
      <MinimalistMissionHUD
        gameTitle="Monkey Mart"
        missionTarget={`수익 $${TARGET_CASH} 달성 & 상품 ${TARGET_SOLD}개 판매`}
        currentProgress={`수익: $${cash} / $${TARGET_CASH} | 판매: ${itemsSold} / ${TARGET_SOLD}`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating Guide */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-zinc-900/80 text-zinc-300 border border-zinc-700 px-3 py-1 text-xs rounded-sm">
            터치/드래그 이동: 밭 수확 ➔ 진열대 보충 ➔ 지폐 수거
          </span>
        </div>
      </div>

      {gameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          rewardSNS={rewardResult.rewardSNS}
          gameTitle="Monkey Mart"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
