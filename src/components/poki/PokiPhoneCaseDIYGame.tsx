import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPhoneCaseDIYGameProps {
  onBack: () => void;
}

type DIYStep = 'spray' | 'dry' | 'stickers';

const SPRAY_COLORS = ['#f43f5e', '#3b82f6', '#10b981', '#a855f7', '#f59e0b'];
const STICKERS = ['⭐', '💖', '🦄', '⚡', '🌸'];

export const PokiPhoneCaseDIYGame: React.FC<PokiPhoneCaseDIYGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [step, setStep] = useState<DIYStep>('spray');
  const [activeColorIdx, setActiveColorIdx] = useState(0);
  const [activeStickerIdx, setActiveStickerIdx] = useState(0);
  const [dryProgress, setDryProgress] = useState(0);
  const [paintCoverage, setPaintCoverage] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    step: DIYStep;
    paintedGrid: boolean[];
    dryProgress: number;
    placedStickers: Array<{ x: number; y: number; emoji: string }>;
    selectedColor: string;
    selectedSticker: string;
    gameWon: boolean;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    step: 'spray',
    paintedGrid: new Array(100).fill(false),
    dryProgress: 0,
    placedStickers: [],
    selectedColor: SPRAY_COLORS[0],
    selectedSticker: STICKERS[0],
    gameWon: false,
    particles: [],
  });

  const handlePointerAction = (pixelX: number, pixelY: number) => {
    const st = stateRef.current;
    if (st.gameWon) return;

    // Phone case bounding box: [120, 120] to [280, 420]
    const caseLeft = 120;
    const caseTop = 120;
    const caseWidth = 160;
    const caseHeight = 300;

    const insideCase =
      pixelX >= caseLeft &&
      pixelX <= caseLeft + caseWidth &&
      pixelY >= caseTop &&
      pixelY <= caseTop + caseHeight;

    if (!insideCase) return;

    if (st.step === 'spray') {
      const col = Math.floor(((pixelX - caseLeft) / caseWidth) * 10);
      const row = Math.floor(((pixelY - caseTop) / caseHeight) * 10);
      const idx = row * 10 + col;
      if (idx >= 0 && idx < 100 && !st.paintedGrid[idx]) {
        st.paintedGrid[idx] = true;
        const covered = st.paintedGrid.filter(Boolean).length;
        setPaintCoverage(covered);

        // Spray particles
        for (let i = 0; i < 4; i++) {
          st.particles.push({
            x: pixelX,
            y: pixelY,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: st.selectedColor,
            life: 0.6,
          });
        }

        if (covered >= 85) {
          // Move to Step 2: Dry
          st.step = 'dry';
          setStep('dry');
        }
      }
    } else if (st.step === 'dry') {
      st.dryProgress = Math.min(100, st.dryProgress + 4);
      setDryProgress(st.dryProgress);

      // Warm air particles
      for (let i = 0; i < 3; i++) {
        st.particles.push({
          x: pixelX,
          y: pixelY,
          vx: (Math.random() - 0.5) * 5,
          vy: -2 - Math.random() * 3,
          color: '#fde047',
          life: 0.6,
        });
      }

      if (st.dryProgress >= 100) {
        st.step = 'stickers';
        setStep('stickers');
      }
    } else if (st.step === 'stickers') {
      st.placedStickers.push({
        x: pixelX,
        y: pixelY,
        emoji: st.selectedSticker,
      });

      // Sticker sparkle particles
      for (let i = 0; i < 8; i++) {
        st.particles.push({
          x: pixelX,
          y: pixelY,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          color: '#ffffff',
          life: 0.8,
        });
      }

      if (st.placedStickers.length >= 4 && !st.gameWon) {
        st.gameWon = true;
        setGameWon(true);
        const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const receipt = calculateAndDepositMissionReward({
          gameId: 'phone-case-diy',
          gameTitle: 'Phone CASE DIY',
          score: 100,
          durationSeconds: duration,
        });
        setRewardReceipt(receipt);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const st = stateRef.current;

      ctx.fillStyle = '#fdfcfc';
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 94, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PHONE CASE DIY // 나만의 케이스 공방', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#f43f5e';
      const stepText =
        st.step === 'spray'
          ? `[1단계: 도색] 페인팅 진행도: ${paintCoverage}%/85%`
          : st.step === 'dry'
          ? `[2단계: 건조] 드라이어 열풍: ${st.dryProgress}%/100%`
          : `[3단계: 데코] 스티커 장식: ${st.placedStickers.length}/4`;
      ctx.fillText(stepText, 84, 56);

      // Phone Case Outline
      const caseX = 120;
      const caseY = 120;
      const caseW = 160;
      const caseH = 300;

      // Phone shadow & case base
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(caseX, caseY, caseW, caseH, 24);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Camera lens bump
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(caseX + 16, caseY + 16, 50, 50, 12);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(caseX + 41, caseY + 41, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(caseX + 38, caseY + 38, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw Painted Grid Cells
      st.paintedGrid.forEach((painted, idx) => {
        if (painted) {
          const col = idx % 10;
          const row = Math.floor(idx / 10);
          const px = caseX + (col * caseW) / 10;
          const py = caseY + (row * caseH) / 10;
          ctx.fillStyle = st.selectedColor;
          ctx.fillRect(px, py, caseW / 10 + 1, caseH / 10 + 1);
        }
      });

      // Shine overlay if dried
      if (st.step === 'stickers' || (st.step === 'dry' && st.dryProgress >= 100)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(caseX, caseY, caseW, caseH, 24);
        ctx.fill();
      }

      // Draw Placed Stickers
      st.placedStickers.forEach((stk) => {
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stk.emoji, stk.x, stk.y);
      });
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';

      // Draw Particles
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          st.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Bottom Interaction Guides
      ctx.fillStyle = '#201d1d';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      if (st.step === 'spray') {
        ctx.fillText('[ 케이스 표면을 문질러 스프레이를 골고루 분사하세요 ]', w / 2, h - 20);
      } else if (st.step === 'dry') {
        ctx.fillText('[ 케이스를 빠르게 문질러 열풍으로 건조시키세요 ]', w / 2, h - 20);
      } else {
        ctx.fillText('[ 마음에 드는 위치에 스티커 4개를 붙여 완성하세요 ]', w / 2, h - 20);
      }
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [paintCoverage, dryProgress]);

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    handlePointerAction(px, py);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Phone CASE DIY"
        score={step === 'spray' ? paintCoverage : step === 'dry' ? dryProgress : stateRef.current.placedStickers.length * 25}
        targetScore={100}
        onBack={onBack}
      />

      {/* Palette Toolbar */}
      <div className="px-4 py-2 bg-black/5 flex items-center justify-center gap-2 border-b border-black/10">
        {step === 'spray' && (
          <div className="flex gap-2">
            {SPRAY_COLORS.map((c, i) => (
              <button
                key={c}
                onClick={() => {
                  setActiveColorIdx(i);
                  stateRef.current.selectedColor = c;
                }}
                style={{ backgroundColor: c }}
                className={`w-8 h-8 rounded-sm border-2 ${
                  activeColorIdx === i ? 'border-black scale-110' : 'border-white'
                }`}
              />
            ))}
          </div>
        )}
        {step === 'dry' && (
          <div className="text-xs font-bold text-amber-600 flex items-center gap-1">
            <span>💨 헤어 드라이어 가동 중: 터치 드래그로 건조하세요!</span>
          </div>
        )}
        {step === 'stickers' && (
          <div className="flex gap-3">
            {STICKERS.map((s, i) => (
              <button
                key={s}
                onClick={() => {
                  setActiveStickerIdx(i);
                  stateRef.current.selectedSticker = s;
                }}
                className={`text-xl p-1 rounded-sm border ${
                  activeStickerIdx === i ? 'border-black bg-white shadow-sm' : 'border-transparent'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointer}
          onPointerMove={(e) => {
            if (e.buttons > 0) handlePointer(e);
          }}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm cursor-crosshair"
        />
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          receipt={rewardReceipt}
          onConfirm={onBack}
        />
      )}
    </div>
  );
};

export default PokiPhoneCaseDIYGame;

