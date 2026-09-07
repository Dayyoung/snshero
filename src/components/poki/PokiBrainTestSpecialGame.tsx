import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBrainTestSpecialGameProps {
  onBack: () => void;
}

export const PokiBrainTestSpecialGame: React.FC<PokiBrainTestSpecialGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentStage, setCurrentStage] = useState(1);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    stage: number;
    gameWon: boolean;
    // Stage 1: Cloud dragged away to reveal runway
    cloudX: number;
    cloudY: number;
    isDraggingCloud: boolean;
    runwayRevealed: boolean;
    // Stage 2: UFO Dome dragged up
    ufoDomeY: number;
    isDraggingDome: boolean;
    alienFound: boolean;
    // Stage 3: Lock shake taps
    lockTaps: number;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    stage: 1,
    gameWon: false,
    cloudX: 200,
    cloudY: 340,
    isDraggingCloud: false,
    runwayRevealed: false,
    ufoDomeY: 240,
    isDraggingDome: false,
    alienFound: false,
    lockTaps: 0,
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
          gameId: 'brain-test-special',
          gameTitle: 'Brain Test Special',
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

      ctx.fillStyle = '#fdfcfc';
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 107, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`BRAIN TEST SPECIAL // 스테이지 ${st.stage}/3`, 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#a855f7';
      const prompt =
        st.stage === 1
          ? 'Q: 안개 속에 갇힌 비행기를 착륙시키세요!'
          : st.stage === 2
          ? 'Q: 숨어있는 외계인을 찾아내세요!'
          : 'Q: 열쇠 없이 자물쇠를 열어보세요!';
      ctx.fillText(prompt, 84, 56);

      // Stage Rendering
      if (st.stage === 1) {
        // Airplane flying at top
        ctx.font = '54px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✈️', 200, 180);

        // Hidden runway at (200, 340)
        ctx.fillStyle = '#334155';
        ctx.fillRect(80, 320, 240, 40);
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(80, 340);
        ctx.lineTo(320, 340);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cloud blocking view
        ctx.font = '80px sans-serif';
        ctx.fillText('☁️', st.cloudX, st.cloudY);

        ctx.font = '12px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('[ 먹구름을 옆으로 치워 활주로를 찾으세요 ]', w / 2, 430);
      } else if (st.stage === 2) {
        // Alien UFO
        ctx.font = '72px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Alien inside
        ctx.fillText('👽', 200, 240);

        // Glass Dome covering alien (drag up!)
        ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.beginPath();
        ctx.arc(200, st.ufoDomeY, 36, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // UFO Base
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(200, 255, 60, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = '12px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('[ UFO 조종석 돔을 위로 밀어 열어보세요 ]', w / 2, 380);
      } else if (st.stage === 3) {
        // Brass Padlock
        ctx.font = '96px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.lockTaps >= 5 ? '🔓' : '🔒', 200, 250);

        ctx.font = '12px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`[ 자물쇠를 빠르게 5번 연타해 잠금을 해제하세요! (${st.lockTaps}/5) ]`, w / 2, 380);
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

      // Instructions
      ctx.fillStyle = '#201d1d';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 고정관념을 깨고 창의적으로 화면과 상호작용하세요 ]', w / 2, h - 15);
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
      if (Math.hypot(x - st.cloudX, y - st.cloudY) < 50) {
        st.isDraggingCloud = true;
      }
    } else if (st.stage === 2) {
      if (Math.hypot(x - 200, y - st.ufoDomeY) < 40) {
        st.isDraggingDome = true;
      }
    } else if (st.stage === 3) {
      if (Math.hypot(x - 200, y - 250) < 60) {
        st.lockTaps += 1;
        for (let p = 0; p < 8; p++) {
          st.particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            color: '#facc15',
            life: 0.6,
          });
        }
        if (st.lockTaps >= 5) {
          setTimeout(nextStage, 600);
        }
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

    if (st.stage === 1 && st.isDraggingCloud) {
      st.cloudX = x;
      st.cloudY = y;
      if (Math.abs(st.cloudX - 200) > 120 && !st.runwayRevealed) {
        st.runwayRevealed = true;
        for (let p = 0; p < 20; p++) {
          st.particles.push({
            x: 200,
            y: 340,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#38bdf8',
            life: 1.0,
          });
        }
        setTimeout(nextStage, 800);
      }
    } else if (st.stage === 2 && st.isDraggingDome) {
      st.ufoDomeY = Math.min(240, y);
      if (st.ufoDomeY < 180 && !st.alienFound) {
        st.alienFound = true;
        for (let p = 0; p < 20; p++) {
          st.particles.push({
            x: 200,
            y: 240,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#a855f7',
            life: 1.0,
          });
        }
        setTimeout(nextStage, 800);
      }
    }
  };

  const handlePointerUp = () => {
    stateRef.current.isDraggingCloud = false;
    stateRef.current.isDraggingDome = false;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Brain Test Special"
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

export default PokiBrainTestSpecialGame;
