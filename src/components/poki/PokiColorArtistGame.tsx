import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiColorArtistGameProps {
  onClose: () => void;
}

interface ColorZone {
  id: number;
  label: string;
  targetNum: number;
  correctColor: string;
  currentColor: string;
  poly: { x: number; y: number }[];
  center: { x: number; y: number };
}

export default function PokiColorArtistGame({ onClose }: PokiColorArtistGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNum, setSelectedNum] = useState<number>(1);
  const [completedCount, setCompletedCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const palette = [
    { num: 1, col: '#fde047', name: '태양 옐로우' },
    { num: 2, col: '#f97316', name: '노을 오렌지' },
    { num: 3, col: '#38bdf8', name: '하늘 스카이블루' },
    { num: 4, col: '#1e40af', name: '심해 딥블루' },
    { num: 5, col: '#10b981', name: '해변 에메랄드' },
    { num: 6, col: '#ffffff', name: '요트 돛 화이트' }
  ];

  const stateRef = useRef<{
    zones: ColorZone[];
    activeNum: number;
  }>({
    zones: [],
    activeNum: 1
  });

  stateRef.current.activeNum = selectedNum;

  const playSound = (type: 'paint' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'paint') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
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

      const w = canvas.width;
      const h = canvas.height;

      // 6 Distinct Landscape Zones
      stateRef.current.zones = [
        // Zone 1: Sun circle
        {
          id: 1,
          label: '태양',
          targetNum: 1,
          correctColor: '#fde047',
          currentColor: '#f1f5f9',
          poly: [
            { x: w * 0.75, y: h * 0.25 },
            { x: w * 0.85, y: h * 0.25 },
            { x: w * 0.85, y: h * 0.35 },
            { x: w * 0.75, y: h * 0.35 }
          ],
          center: { x: w * 0.8, y: h * 0.3 }
        },
        // Zone 2: Sunset horizon
        {
          id: 2,
          label: '노을',
          targetNum: 2,
          correctColor: '#f97316',
          currentColor: '#e2e8f0',
          poly: [
            { x: w * 0.1, y: h * 0.38 },
            { x: w * 0.9, y: h * 0.38 },
            { x: w * 0.9, y: h * 0.48 },
            { x: w * 0.1, y: h * 0.48 }
          ],
          center: { x: w * 0.5, y: h * 0.43 }
        },
        // Zone 3: Upper Sky
        {
          id: 3,
          label: '하늘',
          targetNum: 3,
          correctColor: '#38bdf8',
          currentColor: '#cbd5e1',
          poly: [
            { x: w * 0.1, y: h * 0.15 },
            { x: w * 0.9, y: h * 0.15 },
            { x: w * 0.9, y: h * 0.38 },
            { x: w * 0.1, y: h * 0.38 }
          ],
          center: { x: w * 0.4, y: h * 0.26 }
        },
        // Zone 4: Deep Ocean
        {
          id: 4,
          label: '바다',
          targetNum: 4,
          correctColor: '#1e40af',
          currentColor: '#94a3b8',
          poly: [
            { x: w * 0.1, y: h * 0.48 },
            { x: w * 0.9, y: h * 0.48 },
            { x: w * 0.9, y: h * 0.65 },
            { x: w * 0.1, y: h * 0.65 }
          ],
          center: { x: w * 0.5, y: h * 0.56 }
        },
        // Zone 5: Island Shore
        {
          id: 5,
          label: '해변 섬',
          targetNum: 5,
          correctColor: '#10b981',
          currentColor: '#64748b',
          poly: [
            { x: w * 0.1, y: h * 0.65 },
            { x: w * 0.9, y: h * 0.65 },
            { x: w * 0.9, y: h * 0.75 },
            { x: w * 0.1, y: h * 0.75 }
          ],
          center: { x: w * 0.5, y: h * 0.7 }
        },
        // Zone 6: Sailboat Sail
        {
          id: 6,
          label: '요트 돛',
          targetNum: 6,
          correctColor: '#ffffff',
          currentColor: '#475569',
          poly: [
            { x: w * 0.3, y: h * 0.54 },
            { x: w * 0.38, y: h * 0.44 },
            { x: w * 0.38, y: h * 0.54 }
          ],
          center: { x: w * 0.35, y: h * 0.5 }
        }
      ];
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const s = stateRef.current;

      // RENDER
      ctx.fillStyle = '#0f172a'; // Artist easel dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Canvas Frame
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w * 0.08, h * 0.12, w * 0.84, h * 0.66);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 6;
      ctx.strokeRect(w * 0.08, h * 0.12, w * 0.84, h * 0.66);

      // Draw Color Zones
      s.zones.forEach((z) => {
        ctx.save();
        ctx.fillStyle = z.currentColor;
        ctx.beginPath();
        if (z.id === 1) {
          // Circle sun
          ctx.arc(z.center.x, z.center.y, 28, 0, Math.PI * 2);
        } else {
          ctx.moveTo(z.poly[0].x, z.poly[0].y);
          for (let i = 1; i < z.poly.length; i++) {
            ctx.lineTo(z.poly[i].x, z.poly[i].y);
          }
          ctx.closePath();
        }
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Target Number Marker
        if (z.currentColor !== z.correctColor) {
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(z.targetNum), z.center.x, z.center.y);
        }
        ctx.restore();
      });

      // Color Artist Card Sprite
      drawCardSprite(ctx, 75, 20, canvas.height - 100, 44, 44);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Touch Handling on Zones
    const handleTouch = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      const tx = t.clientX - rect.left;
      const ty = t.clientY - rect.top;

      const s = stateRef.current;
      s.zones.forEach((z) => {
        const dist = Math.hypot(tx - z.center.x, ty - z.center.y);
        if (dist < 50) {
          if (z.targetNum === s.activeNum) {
            z.currentColor = z.correctColor;
            playSound('paint');

            const done = s.zones.filter((x) => x.currentColor === x.correctColor).length;
            setCompletedCount(done);

            if (done >= 6 && !gameWon) {
              setGameWon(true);
              playSound('win');
              const deposit = calculateAndDepositMissionReward({
                gameId: 'pokicolorartist',
                gameTitle: 'Color Artist',
                isVictory: true,
                score: 1000,
                maxTargetScore: 1000,
                durationSeconds: 30
              });
              setRewardResult(deposit);
            }
          }
        }
      });
    };

    canvas.addEventListener('touchstart', handleTouch, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [gameWon]);

  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Color Artist"
        missionTarget="번호별 물감으로 6개 구역 100% 채색 완성"
        currentProgress={`완성도: ${completedCount} / 6 구역`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Bottom Palette Selector */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 pointer-events-auto">
          {palette.map((p) => (
            <button
              key={p.num}
              onClick={() => setSelectedNum(p.num)}
              className={`flex flex-col items-center justify-center w-12 h-14 rounded-sm border-2 transition-transform shadow-md ${
                selectedNum === p.num ? 'scale-110 border-white ring-2 ring-sky-400' : 'border-zinc-700'
              }`}
              style={{ backgroundColor: p.col }}
            >
              <span className={`font-bold text-base ${p.col === '#ffffff' || p.col === '#fde047' ? 'text-black' : 'text-white'}`}>
                {p.num}
              </span>
            </button>
          ))}
        </div>
      </div>

      {gameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          rewardSNS={rewardResult.rewardSNS}
          gameTitle="Color Artist"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
