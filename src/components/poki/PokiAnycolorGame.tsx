import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiAnycolorGameProps {
  onBack?: () => void;
  onClose?: () => void;
}

interface ColorZone {
  id: number;
  name: string;
  requiredNum: number;
  poly: { x: number; y: number }[];
  center: { x: number; y: number };
  currentColor: string | null;
}

const PALETTE = [
  { num: 1, col: '#f43f5e', name: '루비 핑크' },
  { num: 2, col: '#0ea5e9', name: '스카이 시안' },
  { num: 3, col: '#eab308', name: '웜 앰버' },
  { num: 4, col: '#10b981', name: '에메랄드' },
  { num: 5, col: '#8b5cf6', name: '바이올렛' },
];

function pointInPoly(pt: { x: number; y: number }, poly: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
      (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const PokiAnycolorGame: React.FC<PokiAnycolorGameProps> = ({ onBack, onClose }) => {
  const handleExit = onBack || onClose || (() => {});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNum, setSelectedNum] = useState<number>(1);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'victory'>('ready');
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const zonesRef = useRef<ColorZone[]>([
    {
      id: 1,
      name: '크라운 젬',
      requiredNum: 1,
      poly: [{ x: 160, y: 80 }, { x: 200, y: 40 }, { x: 240, y: 80 }, { x: 200, y: 110 }],
      center: { x: 200, y: 75 },
      currentColor: null,
    },
    {
      id: 2,
      name: '레프트 바이저',
      requiredNum: 2,
      poly: [{ x: 130, y: 125 }, { x: 195, y: 125 }, { x: 195, y: 175 }, { x: 140, y: 165 }],
      center: { x: 165, y: 145 },
      currentColor: null,
    },
    {
      id: 3,
      name: '라이트 바이저',
      requiredNum: 2,
      poly: [{ x: 205, y: 125 }, { x: 270, y: 125 }, { x: 260, y: 165 }, { x: 205, y: 175 }],
      center: { x: 235, y: 145 },
      currentColor: null,
    },
    {
      id: 4,
      name: '레프트 윙',
      requiredNum: 3,
      poly: [{ x: 110, y: 110 }, { x: 130, y: 125 }, { x: 120, y: 185 }, { x: 90, y: 155 }],
      center: { x: 115, y: 145 },
      currentColor: null,
    },
    {
      id: 5,
      name: '라이트 윙',
      requiredNum: 3,
      poly: [{ x: 290, y: 110 }, { x: 310, y: 155 }, { x: 280, y: 185 }, { x: 270, y: 125 }],
      center: { x: 285, y: 145 },
      currentColor: null,
    },
    {
      id: 6,
      name: '페이스 마스크',
      requiredNum: 4,
      poly: [{ x: 160, y: 185 }, { x: 240, y: 185 }, { x: 225, y: 225 }, { x: 175, y: 225 }],
      center: { x: 200, y: 205 },
      currentColor: null,
    },
    {
      id: 7,
      name: '코어 넥',
      requiredNum: 5,
      poly: [{ x: 180, y: 245 }, { x: 220, y: 245 }, { x: 210, y: 285 }, { x: 190, y: 285 }],
      center: { x: 200, y: 265 },
      currentColor: null,
    },
    {
      id: 8,
      name: '레프트 숄더',
      requiredNum: 1,
      poly: [{ x: 120, y: 255 }, { x: 175, y: 255 }, { x: 180, y: 350 }, { x: 110, y: 330 }],
      center: { x: 145, y: 295 },
      currentColor: null,
    },
    {
      id: 9,
      name: '라이트 숄더',
      requiredNum: 1,
      poly: [{ x: 225, y: 255 }, { x: 280, y: 255 }, { x: 290, y: 330 }, { x: 220, y: 350 }],
      center: { x: 255, y: 295 },
      currentColor: null,
    },
    {
      id: 10,
      name: '파워 리액터',
      requiredNum: 3,
      poly: [{ x: 185, y: 300 }, { x: 215, y: 300 }, { x: 210, y: 360 }, { x: 190, y: 360 }],
      center: { x: 200, y: 330 },
      currentColor: null,
    },
  ]);

  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; life: number }[]>([]);

  const handleStart = () => {
    zonesRef.current.forEach((z) => (z.currentColor = null));
    setCompletedCount(0);
    setGameState('playing');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokianycolor',
      gameTitle: 'Anycolor: Pop Art Palette',
      isVictory: true,
      score: 10,
      maxTargetScore: 10,
      durationSeconds: 25,
    });
    setRewardReceipt(receipt);
  }, []);

  // Main Render Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Canvas Grid
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Frame Shadow & Border
      ctx.fillStyle = '#27272a';
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(40, 20, 320, 370, 12);
      ctx.fill();
      ctx.stroke();

      // Draw Zones
      zonesRef.current.forEach((z) => {
        const isPainted = z.currentColor !== null;
        const isMatched = z.requiredNum === selectedNum;

        ctx.beginPath();
        ctx.moveTo(z.poly[0].x, z.poly[0].y);
        for (let i = 1; i < z.poly.length; i++) {
          ctx.lineTo(z.poly[i].x, z.poly[i].y);
        }
        ctx.closePath();

        if (isPainted) {
          ctx.fillStyle = z.currentColor!;
        } else if (isMatched) {
          ctx.fillStyle = '#52525b';
        } else {
          ctx.fillStyle = '#3f3f46';
        }
        ctx.fill();

        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 3;
        ctx.stroke();

        // If not painted, draw required number
        if (!isPainted) {
          ctx.font = 'bold 14px monospace';
          ctx.fillStyle = isMatched ? '#fbbf24' : '#a1a1aa';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(z.requiredNum), z.center.x, z.center.y);
        }
      });

      // SNSHero No.79 Artist Hero Badge
      drawCardSprite(ctx, 79, 48, 28, 44, 44);
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'left';
      ctx.fillText('HERO #079 ARTIST', 98, 45);
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '9px monospace';
      ctx.fillText('POP ART COLORING', 98, 60);

      // Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
          ctx.globalAlpha = 1;
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [selectedNum]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    // Check collision with zones
    for (const zone of zonesRef.current) {
      if (zone.currentColor === null && pointInPoly({ x: clickX, y: clickY }, zone.poly)) {
        if (zone.requiredNum === selectedNum) {
          const color = PALETTE[selectedNum - 1].col;
          zone.currentColor = color;

          // Spawn celebration particles
          for (let i = 0; i < 14; i++) {
            const ang = (Math.PI * 2 * i) / 14;
            const spd = 2 + Math.random() * 3;
            particlesRef.current.push({
              x: zone.center.x,
              y: zone.center.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              color,
              life: 1.0,
            });
          }

          const done = zonesRef.current.filter((z) => z.currentColor !== null).length;
          setCompletedCount(done);

          if (done === 10) {
            setTimeout(() => {
              handleVictory();
            }, 400);
          }
        }
        break;
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#18181b] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Anycolor: Pop Art Palette"
        missionTarget="10개 파츠 완벽 채색"
        currentScore={completedCount}
        maxScore={10}
        scoreUnit="구역"
        onBack={handleExit}
      />

      {/* Main Canvas Drawing Area */}
      <div className="relative flex-1 w-full max-w-md flex flex-col items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={420}
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasClick}
          className="w-full max-w-[380px] aspect-[400/420] border border-white/20 rounded-md cursor-pointer shadow-2xl bg-zinc-950 touch-none"
        />

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-violet-400 mb-2">[ Anycolor: Pop Art ]</h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              감각적인 컬러링으로 레트로 로봇 일러스트를 완성하세요!<br />
              1. 하단에서 색상 번호(1~5)를 선택합니다.<br />
              2. 도안에서 <b>동일한 번호의 구역</b>을 터치하여 채색합니다.<br />
              10개 구역을 100% 채색하면 갤러리 전시 & 보상 획득!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-violet-500 hover:bg-violet-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              컬러링 시작 [START]
            </button>
          </div>
        )}

        {gameState === 'victory' && rewardReceipt && (
          <VictoryRewardModal
            receipt={rewardReceipt}
            language="ko"
            onPlayAgain={handleStart}
            onExit={handleExit}
          />
        )}
      </div>

      {/* Color Palette Selector Footer */}
      <div className="w-full max-w-md p-3 bg-zinc-900 border-t border-white/10 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs text-zinc-400 px-1">
          <span>선택된 색상: {PALETTE[selectedNum - 1].name}</span>
          <span>진행도: {completedCount} / 10 ({Math.round((completedCount / 10) * 100)}%)</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          {PALETTE.map((pal) => {
            const isSelected = pal.num === selectedNum;
            return (
              <button
                key={pal.num}
                onClick={() => setSelectedNum(pal.num)}
                className={`flex-1 py-3.5 rounded-sm flex flex-col items-center justify-center font-bold text-sm transition-all shadow ${
                  isSelected ? 'ring-2 ring-white scale-105' : 'opacity-80'
                }`}
                style={{ backgroundColor: pal.col }}
              >
                <span className="text-white drop-shadow font-black">{pal.num}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PokiAnycolorGame;
