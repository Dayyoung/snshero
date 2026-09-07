import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBrainTestGameProps {
  onBack: () => void;
  cardId?: number;
}

export const PokiBrainTestGame: React.FC<PokiBrainTestGameProps> = ({ onBack, cardId = 32 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stage, setStage] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    // Stage 1: Drag big cloud to reveal the real giant watermelon!
    cloud: { x: 400, y: 300, w: 140, h: 80, isDragging: false },
    realGiantMelon: { x: 400, y: 300, r: 50 },
    // Stage 2: Drag bridge plank to bridge the gap
    cat: { x: 180, y: 380 },
    fish: { x: 620, y: 380 },
    bridgePlank: { x: 300, y: 520, w: 160, h: 25, isPlaced: false, isDragging: false },
    // Stage 3: Tap the hidden light switch on wall
    bulbOn: false,
    switchBox: { x: 640, y: 220, w: 45, h: 55 },
    dragOffset: { x: 0, y: 0 },
  });

  const nextStage = () => {
    setFeedback('정답입니다! 💡');
    setTimeout(() => {
      setFeedback(null);
      if (stage < 3) {
        setStage(prev => prev + 1);
      } else {
        setGameWon(true);
        const deposit = calculateAndDepositMissionReward({
          gameId: 'poki_brain_test',
          gameTitle: 'Brain Test: Tricky Puzzles',
          isVictory: true,
          score: 100,
          maxTargetScore: 100,
          durationSeconds: 30,
        });
        setRewardResult(deposit);
      }
    }, 1200);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;

      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, cw, ch);

      // Hero Detective Card on top right
      drawCardSprite(ctx, cardId, cw - 70, 70, 48, 48);

      if (stage === 1) {
        // Stage 1: Question
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'center';
        ctx.fillText('Q1. 화면에서 가장 큰 과일을 탭하세요!', cw / 2, 140);

        // Small visible fruits
        ctx.font = '36px sans-serif';
        ctx.fillText('🍓', cw * 0.25, 340);
        ctx.fillText('🍎', cw * 0.75, 340);

        // Hidden Giant Watermelon behind cloud
        ctx.font = '72px sans-serif';
        ctx.fillText('🍉', state.realGiantMelon.x, state.realGiantMelon.y + 20);

        // Draggable Cloud
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(state.cloud.x - 30, state.cloud.y, 40, 0, Math.PI * 2);
        ctx.arc(state.cloud.x + 30, state.cloud.y, 40, 0, Math.PI * 2);
        ctx.arc(state.cloud.x, state.cloud.y - 20, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('구름', state.cloud.x, state.cloud.y + 4);

      } else if (stage === 2) {
        // Stage 2: Bridge Gap
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'center';
        ctx.fillText('Q2. 고양이가 물고기에 닿도록 도와주세요!', cw / 2, 140);

        // Cliff Platforms
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(80, 400, 200, 160);
        ctx.fillRect(520, 400, 200, 160);

        // Cat and Fish
        ctx.font = '40px sans-serif';
        ctx.fillText('🐱', state.cat.x, 390);
        ctx.fillText('🐟', state.fish.x, 390);

        // Water below
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(280, 500, 240, 60);

        // Draggable Wooden Plank
        ctx.fillStyle = '#b45309';
        ctx.fillRect(state.bridgePlank.x, state.bridgePlank.y, state.bridgePlank.w, state.bridgePlank.h);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.strokeRect(state.bridgePlank.x, state.bridgePlank.y, state.bridgePlank.w, state.bridgePlank.h);

      } else if (stage === 3) {
        // Stage 3: Light Bulb
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'center';
        ctx.fillText('Q3. 방의 불을 켜세요!', cw / 2, 140);

        // Ceiling Light Bulb
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cw / 2, 160);
        ctx.lineTo(cw / 2, 280);
        ctx.stroke();

        ctx.font = '64px sans-serif';
        ctx.fillText(state.bulbOn ? '💡' : '🔘', cw / 2, 340);

        // Hidden Wall Switch
        ctx.fillStyle = state.bulbOn ? '#22c55e' : '#52525b';
        ctx.fillRect(state.switchBox.x, state.switchBox.y, state.switchBox.w, state.switchBox.h);
        ctx.strokeStyle = '#a1a1aa';
        ctx.strokeRect(state.switchBox.x, state.switchBox.y, state.switchBox.w, state.switchBox.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('SWITCH', state.switchBox.x + 22, state.switchBox.y + 32);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [stage, cardId]);

  // Pointer interactions for tricks
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || feedback || gameWon) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;
    const state = gameStateRef.current;

    if (stage === 1) {
      // Check cloud drag
      const dCloud = Math.hypot(touchX - state.cloud.x, touchY - state.cloud.y);
      if (dCloud < 60) {
        state.cloud.isDragging = true;
        state.dragOffset = { x: touchX - state.cloud.x, y: touchY - state.cloud.y };
        return;
      }

      // Check click giant melon
      const dMelon = Math.hypot(touchX - state.realGiantMelon.x, touchY - state.realGiantMelon.y);
      if (dMelon < 55 && Math.hypot(state.cloud.x - state.realGiantMelon.x, state.cloud.y - state.realGiantMelon.y) > 70) {
        nextStage();
      }
    } else if (stage === 2) {
      // Check bridge plank drag
      const p = state.bridgePlank;
      if (touchX >= p.x && touchX <= p.x + p.w && touchY >= p.y && touchY <= p.y + p.h) {
        p.isDragging = true;
        state.dragOffset = { x: touchX - p.x, y: touchY - p.y };
      }
    } else if (stage === 3) {
      // Check switch click
      const s = state.switchBox;
      if (touchX >= s.x && touchX <= s.x + s.w && touchY >= s.y && touchY <= s.y + s.h) {
        state.bulbOn = true;
        nextStage();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;
    const state = gameStateRef.current;

    if (stage === 1 && state.cloud.isDragging) {
      state.cloud.x = touchX - state.dragOffset.x;
      state.cloud.y = touchY - state.dragOffset.y;
    } else if (stage === 2 && state.bridgePlank.isDragging) {
      state.bridgePlank.x = touchX - state.dragOffset.x;
      state.bridgePlank.y = touchY - state.dragOffset.y;

      // Check if plank placed between cliffs (gap x: 280 to 520, y: 390~410)
      if (Math.abs(state.bridgePlank.y - 400) < 30 && Math.abs(state.bridgePlank.x - 320) < 50) {
        state.bridgePlank.x = 320;
        state.bridgePlank.y = 400;
        state.bridgePlank.isDragging = false;
        // Cat runs to fish!
        state.cat.x = 580;
        nextStage();
      }
    }
  };

  const handlePointerUp = () => {
    const state = gameStateRef.current;
    state.cloud.isDragging = false;
    state.bridgePlank.isDragging = false;
  };

  const handleRestart = () => {
    gameStateRef.current = {
      cloud: { x: 400, y: 300, w: 140, h: 80, isDragging: false },
      realGiantMelon: { x: 400, y: 300, r: 50 },
      cat: { x: 180, y: 380 },
      fish: { x: 620, y: 380 },
      bridgePlank: { x: 300, y: 520, w: 160, h: 25, isPlaced: false, isDragging: false },
      bulbOn: false,
      switchBox: { x: 640, y: 220, w: 45, h: 55 },
      dragOffset: { x: 0, y: 0 },
    };
    setStage(1);
    setFeedback(null);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#18181b] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <MinimalistMissionHUD
        title="BRAIN TEST"
        score={stage}
        goalScore={3}
        onBack={onBack}
        unit="STAGE"
      />

      {/* Stage Tracker */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-zinc-900/80 border border-zinc-700 px-3 py-1.5 rounded-sm text-xs">
        <span className="font-bold text-amber-400">🧠 TRICKY PUZZLE: STAGE {stage} / 3</span>
        <span className="text-zinc-400">THINK OUTSIDE THE BOX</span>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 text-3xl font-extrabold text-emerald-400 animate-bounce tracking-wider">
          {feedback}
        </div>
      )}

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-700 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        화면의 사물을 <span className="text-amber-400 font-bold">드래그해 치우거나 숨은 장치</span>를 찾아 트릭을 해결하세요!
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* Victory Reward Modal */}
      {gameWon && (
        <VictoryRewardModal
          isOpen={true}
          onClose={onBack}
          rewardAmount={rewardResult?.rewardAmount || 38}
          message="기발한 창의력으로 모든 트릭 넌센스 퀴즈를 돌파했습니다!"
        />
      )}
    </div>
  );
};

export default PokiBrainTestGame;
