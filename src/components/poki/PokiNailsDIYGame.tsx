import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiNailsDIYGameProps {
  onClose: () => void;
}

interface Nail {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  sticker: string | null;
  painted: boolean;
}

export default function PokiNailsDIYGame({ onClose }: PokiNailsDIYGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#f43f5e'); // Rose pink
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [paintedCount, setPaintedCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const colors = [
    { col: '#f43f5e', name: '로즈 핑크' },
    { col: '#06b6d4', name: '파스텔 민트' },
    { col: '#a855f7', name: '라벤더' },
    { col: '#f59e0b', name: '샤이니 골드' }
  ];

  const stickers = ['💖', '⭐', '💎', '🌸'];

  const stateRef = useRef<{
    nails: Nail[];
    activeColor: string;
    activeSticker: string | null;
  }>({
    nails: [
      { id: 1, x: 80, y: 260, w: 36, h: 48, color: '#fbcfe8', sticker: null, painted: false }, // Thumb
      { id: 2, x: 140, y: 190, w: 32, h: 54, color: '#fbcfe8', sticker: null, painted: false }, // Index
      { id: 3, x: 200, y: 160, w: 34, h: 58, color: '#fbcfe8', sticker: null, painted: false }, // Middle
      { id: 4, x: 260, y: 190, w: 32, h: 54, color: '#fbcfe8', sticker: null, painted: false }, // Ring
      { id: 5, x: 320, y: 240, w: 28, h: 44, color: '#fbcfe8', sticker: null, painted: false }  // Pinky
    ],
    activeColor: '#f43f5e',
    activeSticker: null
  });

  stateRef.current.activeColor = selectedColor;
  stateRef.current.activeSticker = selectedSticker;

  const playSound = (type: 'paint' | 'sticker' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'paint') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'sticker') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
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

      // Position 5 nails in center arc
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.45;
      const s = stateRef.current;

      s.nails[0].x = cx - 120; s.nails[0].y = cy + 50;
      s.nails[1].x = cx - 60;  s.nails[1].y = cy - 20;
      s.nails[2].x = cx;       s.nails[2].y = cy - 50;
      s.nails[3].x = cx + 60;  s.nails[3].y = cy - 20;
      s.nails[4].x = cx + 120; s.nails[4].y = cy + 40;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const s = stateRef.current;

      // RENDER
      ctx.fillStyle = '#fff1f2'; // Soft rose manicure table
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height * 0.45;

      // Hand Palm Silhouette
      ctx.fillStyle = '#fed7aa'; // Skin tone
      ctx.beginPath();
      ctx.ellipse(cx, cy + 120, 130, 90, 0, 0, Math.PI * 2);
      ctx.fill();

      // Finger Bases
      s.nails.forEach((n) => {
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.ellipse(n.x, n.y + 40, n.w * 0.9, 50, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Nails
      s.nails.forEach((n) => {
        ctx.save();
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.ellipse(n.x, n.y, n.w / 2, n.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shimmer shine reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(n.x - n.w * 0.2, n.y - n.h * 0.2, n.w * 0.15, n.h * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sticker
        if (n.sticker) {
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(n.sticker, n.x, n.y);
        }
        ctx.restore();
      });

      // Nail Artist Card Sprite
      drawCardSprite(ctx, 73, 24, canvas.height - 110, 48, 48);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Touch Handling on Nails
    const handleTouch = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      const tx = t.clientX - rect.left;
      const ty = t.clientY - rect.top;

      const s = stateRef.current;
      s.nails.forEach((n) => {
        const dist = Math.hypot(tx - n.x, ty - n.y);
        if (dist < n.h * 0.65) {
          if (s.activeSticker) {
            n.sticker = s.activeSticker;
            playSound('sticker');
          } else {
            n.color = s.activeColor;
            n.painted = true;
            playSound('paint');
          }

          const count = s.nails.filter((x) => x.painted && x.sticker !== null).length;
          setPaintedCount(count);

          if (count >= 5 && !gameWon) {
            setGameWon(true);
            playSound('win');
            const deposit = calculateAndDepositMissionReward({
              gameId: 'pokinailsdiy',
              gameTitle: 'Nails DIY: Manicure Master',
              isVictory: true,
              score: 1000,
              maxTargetScore: 1000,
              durationSeconds: 30
            });
            setRewardResult(deposit);
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
    <div className="relative w-full h-full bg-rose-50 flex flex-col select-none overflow-hidden font-mono text-zinc-900">
      <MinimalistMissionHUD
        gameTitle="Nails DIY: Manicure Master"
        missionTarget="5개 손톱 모두 컬러링 & 스티커 완성"
        currentProgress={`완성도: ${paintedCount} / 5 손톱`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top Palette Selector */}
        <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-2 pointer-events-auto">
          {/* Colors */}
          <div className="flex gap-3 bg-white/80 backdrop-blur p-2 rounded-full shadow-md border border-rose-200">
            {colors.map((c) => (
              <button
                key={c.col}
                onClick={() => {
                  setSelectedColor(c.col);
                  setSelectedSticker(null);
                }}
                className={`w-9 h-9 rounded-full border-2 transition-transform ${
                  selectedColor === c.col && selectedSticker === null ? 'scale-125 border-zinc-900' : 'border-white'
                }`}
                style={{ backgroundColor: c.col }}
              />
            ))}
          </div>

          {/* Stickers */}
          <div className="flex gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-md border border-rose-200">
            {stickers.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedSticker(st)}
                className={`w-8 h-8 rounded-sm text-sm flex items-center justify-center transition-transform ${
                  selectedSticker === st ? 'scale-125 bg-rose-100 border border-rose-400' : ''
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Guide */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-zinc-900/80 text-zinc-300 border border-zinc-700 px-4 py-1.5 text-xs rounded-sm shadow-md">
            상단 컬러/스티커 선택 ➔ 손톱을 탭하여 완벽한 네일아트를 완성하세요!
          </span>
        </div>
      </div>

      {gameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          rewardSNS={rewardResult.rewardSNS}
          gameTitle="Nails DIY: Manicure Master"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
