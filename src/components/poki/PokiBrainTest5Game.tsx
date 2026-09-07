import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBrainTest5GameProps {
  onBack: () => void;
}

export const PokiBrainTest5Game: React.FC<PokiBrainTest5GameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentStage, setCurrentStage] = useState(1);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    stage: number;
    gameWon: boolean;
    // Stage 1 state
    watermelonScale: number;
    // Stage 2 state (can dragged to cat)
    canX: number;
    canY: number;
    isDraggingCan: boolean;
    catAwake: boolean;
    // Stage 3 state (match dragged to box then candle)
    matchX: number;
    matchY: number;
    isDraggingMatch: boolean;
    matchLit: boolean;
    candleLit: boolean;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    stage: 1,
    gameWon: false,
    watermelonScale: 1.0,
    canX: 100,
    canY: 420,
    isDraggingCan: false,
    catAwake: false,
    matchX: 100,
    matchY: 420,
    isDraggingMatch: false,
    matchLit: false,
    candleLit: false,
    particles: [],
  });

  const nextStage = () => {
    const st = stateRef.current;
    if (st.stage < 3) {
      st.stage += 1;
      setCurrentStage(st.stage);
    } else {
      if (!st.gameWon) {
        st.gameWon = true;
        setGameWon(true);
        const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const receipt = calculateAndDepositMissionReward({
          gameId: 'brain-test-5',
          gameTitle: 'Brain Test 5',
          score: 300,
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

      // Clean background
      ctx.fillStyle = '#fdfcfc';
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 104, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`BRAIN TEST 5 // 스테이지 ${st.stage}/3`, 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#38bdf8';
      const prompt =
        st.stage === 1
          ? 'Q: 현실에서 실제로 가장 거대한 과일은?'
          : st.stage === 2
          ? 'Q: 쿨쿨 잠든 게으른 고양이를 깨워보세요!'
          : 'Q: 어두운 방의 양초에 불을 켜세요!';
      ctx.fillText(prompt, 84, 56);

      // Stage Rendering
      if (st.stage === 1) {
        // Fruit choices: Strawberry (shown huge), Apple (medium), Watermelon (shown tiny trick!)
        // Strawberry (Fake huge)
        ctx.font = '72px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍓', 100, 260);

        // Apple (Normal)
        ctx.font = '54px sans-serif';
        ctx.fillText('🍎', 200, 260);

        // Watermelon (Real biggest! shown small)
        ctx.font = '36px sans-serif';
        ctx.fillText('🍉', 310, 260);

        ctx.font = '12px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('(겉보기 크기에 속지 마세요!)', w / 2, 380);
      } else if (st.stage === 2) {
        // Cat at right, fish can at left
        ctx.font = '84px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.catAwake ? '😻' : '😴', 280, 260);

        // Fish Can
        ctx.font = '48px sans-serif';
        ctx.fillText('🐟', st.canX, st.canY);

        ctx.font = '12px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('[ 맛있는 생선 캔을 고양이 코앞으로 드래그하세요 ]', w / 2, 380);
      } else if (st.stage === 3) {
        // Matchbox in center, candle at right, match at bottom
        // Candle
        ctx.font = '72px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.candleLit ? '🕯️' : '🕯️', 300, 240);

        if (st.candleLit) {
          // Flame glow
          ctx.beginPath();
          ctx.arc(300, 205, 18, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';
          ctx.fill();
        }

        // Matchbox
        ctx.fillStyle = '#78350f';
        ctx.fillRect(160, 230, 60, 40);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('성냥갑', 190, 255);

        // Striker strip
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(160, 265, 60, 6);

        // Match
        ctx.font = '36px sans-serif';
        ctx.fillText(st.matchLit ? '🔥' : '🥢', st.matchX, st.matchY);

        ctx.font = '12px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(st.matchLit ? '[ 불붙은 성냥을 양초로 가져가세요 ]' : '[ 성냥을 성냥갑 밑면에 긁어 불을 붙이세요 ]', w / 2, 380);
      }

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

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
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
      }

      // Bottom Instructions
      ctx.fillStyle = '#201d1d';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 화면의 사물들을 자유롭게 터치하고 드래그해보세요 ]', w / 2, h - 15);
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const st = stateRef.current;

    if (st.stage === 1) {
      // Check if clicked watermelon (x ~ 310, y ~ 260)
      if (Math.hypot(x - 310, y - 260) < 40) {
        // Correct! Watermelon is real biggest fruit!
        for (let p = 0; p < 20; p++) {
          st.particles.push({
            x: 310,
            y: 260,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#10b981',
            life: 1.0,
          });
        }
        setTimeout(nextStage, 600);
      }
    } else if (st.stage === 2) {
      if (Math.hypot(x - st.canX, y - st.canY) < 40) {
        st.isDraggingCan = true;
      }
    } else if (st.stage === 3) {
      if (Math.hypot(x - st.matchX, y - st.matchY) < 40) {
        st.isDraggingMatch = true;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const st = stateRef.current;

    if (st.stage === 2 && st.isDraggingCan) {
      st.canX = x;
      st.canY = y;

      // Check if brought to cat (280, 260)
      if (Math.hypot(x - 280, y - 260) < 50 && !st.catAwake) {
        st.catAwake = true;
        for (let p = 0; p < 20; p++) {
          st.particles.push({
            x: 280,
            y: 260,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#fb7185',
            life: 1.0,
          });
        }
        setTimeout(nextStage, 800);
      }
    } else if (st.stage === 3 && st.isDraggingMatch) {
      st.matchX = x;
      st.matchY = y;

      // Check striker box (160..220, 230..275)
      if (x >= 150 && x <= 230 && y >= 220 && y <= 280 && !st.matchLit) {
        st.matchLit = true;
        for (let p = 0; p < 15; p++) {
          st.particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            color: '#f97316',
            life: 0.8,
          });
        }
      }

      // Check candle (300, 240)
      if (st.matchLit && Math.hypot(x - 300, y - 220) < 40 && !st.candleLit) {
        st.candleLit = true;
        for (let p = 0; p < 25; p++) {
          st.particles.push({
            x: 300,
            y: 205,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#fbbf24',
            life: 1.0,
          });
        }
        setTimeout(nextStage, 800);
      }
    }
  };

  const handlePointerUp = () => {
    stateRef.current.isDraggingCan = false;
    stateRef.current.isDraggingMatch = false;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Brain Test 5"
        score={currentStage}
        targetScore={3}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm cursor-pointer"
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

export default PokiBrainTest5Game;
