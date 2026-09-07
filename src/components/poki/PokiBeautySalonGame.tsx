import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBeautySalonGameProps {
  onBack: () => void;
  cardId?: number;
}

type SalonStep = 'cleansing' | 'hair' | 'makeup' | 'dressup';

export const PokiBeautySalonGame: React.FC<PokiBeautySalonGameProps> = ({ onBack, cardId = 50 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentStep, setCurrentStep] = useState<SalonStep>('cleansing');
  const [cleanliness, setCleanliness] = useState(0);
  const [selectedHair, setSelectedHair] = useState(0);
  const [selectedHairColor, setSelectedHairColor] = useState('#f59e0b');
  const [selectedLipColor, setSelectedLipColor] = useState('#f43f5e');
  const [selectedDress, setSelectedDress] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    step: 'cleansing' as SalonStep,
    cleanProgress: 0,
    spongePos: { x: 200, y: 300 },
    isDraggingSponge: false,
    selectedHair: 0,
    selectedHairColor: '#f59e0b',
    selectedLipColor: '#f43f5e',
    selectedDress: 0,
    startTime: Date.now(),
    confetti: [] as { x: number; y: number; vx: number; vy: number; color: string; size: number }[],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameStateRef.current.spongePos = { x: canvas.width / 2, y: canvas.height * 0.45 };
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const state = gameStateRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Soft salon pastel background
      ctx.fillStyle = '#fff1f2';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gold ornate vanity mirror frame
      const mirrorW = Math.min(canvas.width - 40, 380);
      const mirrorH = canvas.height * 0.52;
      const mirrorX = (canvas.width - mirrorW) / 2;
      const mirrorY = 90;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(mirrorX, mirrorY, mirrorW, mirrorH, 20);
      ctx.fill();
      ctx.stroke();

      // Mirror lights along the frame
      ctx.fillStyle = '#fef08a';
      for (let i = 0; i < 6; i++) {
        const lx = mirrorX + 24 + i * ((mirrorW - 48) / 5);
        ctx.beginPath();
        ctx.arc(lx, mirrorY + 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lx, mirrorY + mirrorH - 12, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Character center
      const charX = mirrorX + mirrorW / 2;
      const charY = mirrorY + mirrorH * 0.5;

      // Draw Card Sprite as Model Base
      drawCardSprite(ctx, cardId, charX - 55, charY - 80, 110, 140);

      // Step overlays
      if (state.step === 'cleansing') {
        // Dirt spots on face if clean < 100
        if (state.cleanProgress < 100) {
          ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
          ctx.beginPath();
          ctx.arc(charX - 20, charY - 20, 14, 0, Math.PI * 2);
          ctx.arc(charX + 22, charY - 10, 12, 0, Math.PI * 2);
          ctx.arc(charX, charY + 15, 16, 0, Math.PI * 2);
          ctx.fill();

          // Cleansing foam bubbles
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          for (let k = 0; k < 8; k++) {
            ctx.beginPath();
            ctx.arc(charX + (k % 3) * 15 - 15, charY + Math.floor(k / 3) * 15 - 10, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Draw Foam Sponge
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(state.spongePos.x, state.spongePos.y, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🧼 스펀지', state.spongePos.x, state.spongePos.y + 4);
      } else {
        // Applied Hairstyles
        ctx.save();
        ctx.strokeStyle = state.selectedHairColor;
        ctx.fillStyle = state.selectedHairColor;
        ctx.lineWidth = 4;

        if (state.selectedHair === 0) {
          // Elegant Twin Tails
          ctx.beginPath();
          ctx.arc(charX - 45, charY - 60, 18, 0, Math.PI * 2);
          ctx.arc(charX + 45, charY - 60, 18, 0, Math.PI * 2);
          ctx.fill();
        } else if (state.selectedHair === 1) {
          // Royal Crown Bun
          ctx.beginPath();
          ctx.arc(charX, charY - 85, 24, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Glamour Wave
          ctx.beginPath();
          ctx.arc(charX - 35, charY - 50, 16, 0, Math.PI * 2);
          ctx.arc(charX + 35, charY - 50, 16, 0, Math.PI * 2);
          ctx.arc(charX, charY - 80, 20, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Applied Makeup (Lipstick & Blush)
        ctx.fillStyle = state.selectedLipColor;
        ctx.beginPath();
        ctx.roundRect(charX - 12, charY + 12, 24, 8, 4);
        ctx.fill();

        // Cheek blush
        ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.beginPath();
        ctx.arc(charX - 30, charY + 2, 10, 0, Math.PI * 2);
        ctx.arc(charX + 30, charY + 2, 10, 0, Math.PI * 2);
        ctx.fill();

        // Applied Dress Ribbon / Dress Overlay
        const dressColors = ['#f43f5e', '#8b5cf6', '#06b6d4'];
        ctx.fillStyle = dressColors[state.selectedDress % dressColors.length];
        ctx.beginPath();
        ctx.roundRect(charX - 40, charY + 35, 80, 45, 10);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨', charX, charY + 60);
      }

      // Confetti in final celebration
      for (let i = state.confetti.length - 1; i >= 0; i--) {
        const cf = state.confetti[i];
        cf.x += cf.vx;
        cf.y += cf.vy;
        cf.vy += 0.15;
        ctx.fillStyle = cf.color;
        ctx.fillRect(cf.x, cf.y, cf.size, cf.size);
        if (cf.y > canvas.height) state.confetti.splice(i, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [cardId]);

  const handlePointerMove = (clientX: number, clientY: number) => {
    const s = gameStateRef.current;
    if (s.step === 'cleansing' && s.isDraggingSponge) {
      s.spongePos = { x: clientX, y: clientY };

      // Check distance to face center
      const charX = window.innerWidth / 2;
      const charY = 90 + window.innerHeight * 0.52 * 0.5;
      const dist = Math.hypot(clientX - charX, clientY - charY);
      if (dist < 80) {
        s.cleanProgress = Math.min(100, s.cleanProgress + 2);
        setCleanliness(s.cleanProgress);
        if (s.cleanProgress >= 100) {
          s.step = 'hair';
          setCurrentStep('hair');
        }
      }
    }
  };

  const finishMakeover = () => {
    const s = gameStateRef.current;
    setGameWon(true);
    setGameOver(true);

    // Spawn confetti
    for (let k = 0; k < 60; k++) {
      s.confetti.push({
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.3,
        vx: (Math.random() - 0.5) * 12,
        vy: -4 - Math.random() * 8,
        color: ['#f43f5e', '#ec4899', '#a855f7', '#3b82f6', '#f59e0b'][k % 5],
        size: 6 + Math.random() * 6,
      });
    }

    const reward = calculateAndDepositMissionReward({
      gameId: 'pokibeautysalon',
      gameTitle: 'Beauty Salon',
      isVictory: true,
      score: 1000,
      maxTargetScore: 1000,
      durationSeconds: Math.floor((Date.now() - s.startTime) / 1000),
    });
    setRewardResult(reward);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fff1f2] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Beauty Salon"
        score={
          currentStep === 'cleansing'
            ? cleanliness
            : currentStep === 'hair'
            ? 50
            : currentStep === 'makeup'
            ? 75
            : 100
        }
        targetScore={100}
        lives={100}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-pointer"
        onMouseDown={() => {
          gameStateRef.current.isDraggingSponge = true;
        }}
        onMouseUp={() => {
          gameStateRef.current.isDraggingSponge = false;
        }}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onTouchStart={() => {
          gameStateRef.current.isDraggingSponge = true;
        }}
        onTouchEnd={() => {
          gameStateRef.current.isDraggingSponge = false;
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          handlePointerMove(t.clientX, t.clientY);
        }}
      />

      {/* Interactive Styling Control Dock */}
      <div className="absolute bottom-6 left-0 right-0 px-4 flex flex-col items-center gap-2 pointer-events-auto">
        {currentStep === 'cleansing' && (
          <div className="bg-white/90 px-4 py-2 rounded-sm border border-rose-300 text-xs text-rose-700 text-center shadow-sm">
            <div>스펀지를 드래그하여 얼굴의 오염을 깨끗하게 클렌징하세요!</div>
            <div className="text-[10px] text-stone-500">진행도: {cleanliness}%</div>
          </div>
        )}

        {currentStep === 'hair' && (
          <div className="bg-white/95 p-3 rounded-sm border border-rose-300 flex flex-col gap-2 w-full max-w-sm">
            <div className="text-xs font-bold text-rose-800 text-center">
              헤어 스타일 & 염색 컬러 선택
            </div>
            <div className="flex justify-center gap-2">
              {['트윈테일', '크라운번', '글래머웨이브'].map((style, idx) => (
                <button
                  key={style}
                  onClick={() => {
                    setSelectedHair(idx);
                    gameStateRef.current.selectedHair = idx;
                  }}
                  className={`px-2.5 py-1.5 rounded-sm border text-[11px] font-bold ${
                    selectedHair === idx
                      ? 'bg-rose-500 text-white border-rose-600'
                      : 'bg-stone-50 text-stone-700 border-stone-300'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-2">
              {['#f59e0b', '#ec4899', '#8b5cf6', '#10b981'].map((c) => (
                <button
                  key={c}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    setSelectedHairColor(c);
                    gameStateRef.current.selectedHairColor = c;
                  }}
                  className={`w-7 h-7 rounded-full border-2 ${
                    selectedHairColor === c ? 'border-stone-900 scale-110' : 'border-white'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => {
                setCurrentStep('makeup');
                gameStateRef.current.step = 'makeup';
              }}
              className="mt-1 bg-rose-600 text-white py-1.5 rounded-sm font-bold text-xs"
            >
              다음: 메이크업 단계로 ▶
            </button>
          </div>
        )}

        {currentStep === 'makeup' && (
          <div className="bg-white/95 p-3 rounded-sm border border-rose-300 flex flex-col gap-2 w-full max-w-sm">
            <div className="text-xs font-bold text-rose-800 text-center">
              립스틱 & 블러셔 컬러 선택
            </div>
            <div className="flex justify-center gap-3">
              {[
                { name: '로즈레드', color: '#f43f5e' },
                { name: '코랄핑크', color: '#fb7185' },
                { name: '베리바이올렛', color: '#c026d3' },
              ].map((lip) => (
                <button
                  key={lip.color}
                  onClick={() => {
                    setSelectedLipColor(lip.color);
                    gameStateRef.current.selectedLipColor = lip.color;
                  }}
                  className={`px-3 py-1.5 rounded-sm border text-[11px] font-bold flex items-center gap-1.5 ${
                    selectedLipColor === lip.color
                      ? 'bg-rose-500 text-white border-rose-600'
                      : 'bg-stone-50 text-stone-700 border-stone-300'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: lip.color }}
                  />
                  {lip.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setCurrentStep('dressup');
                gameStateRef.current.step = 'dressup';
              }}
              className="mt-1 bg-rose-600 text-white py-1.5 rounded-sm font-bold text-xs"
            >
              다음: 드레스업 단계로 ▶
            </button>
          </div>
        )}

        {currentStep === 'dressup' && (
          <div className="bg-white/95 p-3 rounded-sm border border-rose-300 flex flex-col gap-2 w-full max-w-sm">
            <div className="text-xs font-bold text-rose-800 text-center">
              오트쿠튀르 갈라 드레스 선택
            </div>
            <div className="flex justify-center gap-2">
              {['로열 루비', '스타라이트 바이올렛', '오션 시안'].map((dress, idx) => (
                <button
                  key={dress}
                  onClick={() => {
                    setSelectedDress(idx);
                    gameStateRef.current.selectedDress = idx;
                  }}
                  className={`px-2.5 py-1.5 rounded-sm border text-[11px] font-bold ${
                    selectedDress === idx
                      ? 'bg-rose-500 text-white border-rose-600'
                      : 'bg-stone-50 text-stone-700 border-stone-300'
                  }`}
                >
                  {dress}
                </button>
              ))}
            </div>
            <button
              onClick={finishMakeover}
              className="mt-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white py-2 rounded-sm font-bold text-xs shadow"
            >
              🎉 메이크오버 완성 & 런웨이 데뷔!
            </button>
          </div>
        )}
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={1000}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setCurrentStep('cleansing');
          setCleanliness(0);
          const s = gameStateRef.current;
          s.step = 'cleansing';
          s.cleanProgress = 0;
          s.confetti = [];
          s.startTime = Date.now();
        }}
      />
    </div>
  );
};

export default PokiBeautySalonGame;
