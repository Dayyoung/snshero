import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiFashionLegendsGameProps {
  onBack: () => void;
}

interface FashionGate {
  id: number;
  y: number; // distance down the runway
  lane: 'left' | 'right';
  styleName: string;
  bonus: number;
  icon: string;
  collected: boolean;
}

export const PokiFashionLegendsGame: React.FC<PokiFashionLegendsGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'walking' | 'judging' | 'victory' | 'gameover'>('ready');
  const [fashionScore, setFashionScore] = useState(50);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [judgeComment, setJudgeComment] = useState('');

  const stateRef = useRef({
    modelX: 200,
    targetX: 200,
    runwayProgress: 0, // 0 to 100%
    speed: 1.8,
    gates: [] as FashionGate[],
  });

  const initRunway = useCallback(() => {
    stateRef.current.modelX = 200;
    stateRef.current.targetX = 200;
    stateRef.current.runwayProgress = 0;
    stateRef.current.gates = [
      { id: 1, y: 150, lane: 'left', styleName: '글램 실크 드레스', bonus: 15, icon: '👗', collected: false },
      { id: 2, y: 150, lane: 'right', styleName: '다크 캐주얼 후디', bonus: -5, icon: '👕', collected: false },
      { id: 3, y: 320, lane: 'left', styleName: '투박한 운동화', bonus: -5, icon: '👟', collected: false },
      { id: 4, y: 320, lane: 'right', styleName: '루비 하이힐', bonus: 15, icon: '👠', collected: false },
      { id: 5, y: 500, lane: 'left', styleName: '다이아 티아라', bonus: 20, icon: '👑', collected: false },
      { id: 6, y: 500, lane: 'right', styleName: '평범한 비니', bonus: 5, icon: '🧢', collected: false },
    ];
    setFashionScore(50);
    setJudgeComment('');
  }, []);

  const handleStart = () => {
    initRunway();
    setGameState('walking');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokifashionlegends',
      gameTitle: 'Fashion Legends: Catwalk Battle',
      isVictory: true,
      score: 100,
      maxTargetScore: 100,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, []);

  // Judging Podium evaluation
  const evaluateRunway = useCallback((finalScore: number) => {
    setGameState('judging');
    if (finalScore >= 80) {
      setJudgeComment('🌟 "완벽한 오뜨 꾸뛰르 컬렉션! 만장일치 우승!"');
      setTimeout(() => {
        handleVictory();
      }, 1500);
    } else {
      setJudgeComment('💔 "조금 아쉬운 스타일 매칭이었습니다."');
      setTimeout(() => {
        setGameState('gameover');
      }, 1500);
    }
  }, [handleVictory]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const { modelX, targetX, runwayProgress, gates } = stateRef.current;

      ctx.clearRect(0, 0, width, height);

      // VIP Runway Arena (Purple & Gold lights)
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Flashlights / Paparazzi ambient bursts
      if (Math.random() > 0.8) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const fx = Math.random() * width;
        const fy = Math.random() * 200;
        ctx.beginPath();
        ctx.arc(fx, fy, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // Catwalk Platform (Middle carpet)
      const catwalkW = 200;
      const catwalkX = (width - catwalkW) / 2;
      ctx.fillStyle = '#831843'; // Rose velvet
      ctx.fillRect(catwalkX, 0, catwalkW, height);
      // Gold catwalk borders
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.strokeRect(catwalkX, 0, catwalkW, height);

      // Runway moving stripes
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.lineWidth = 2;
      const offset = (runwayProgress * 8) % 40;
      for (let y = -40; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(catwalkX, y + offset);
        ctx.lineTo(catwalkX + catwalkW, y + offset);
        ctx.stroke();
      }

      if (gameState === 'walking') {
        // Smooth model horizontal steering
        stateRef.current.modelX += (targetX - modelX) * 0.12;

        // Advance runway progress
        stateRef.current.runwayProgress += 0.35;
        const progressY = stateRef.current.runwayProgress * 6;

        // Gates movement & collection
        gates.forEach((gate) => {
          const screenY = gate.y - progressY + 350;
          const gateX = gate.lane === 'left' ? catwalkX + 20 : catwalkX + catwalkW - 80;

          if (!gate.collected && screenY > 440 && screenY < 500) {
            // Check collision with model
            const isLeftHit = gate.lane === 'left' && stateRef.current.modelX < 190;
            const isRightHit = gate.lane === 'right' && stateRef.current.modelX > 210;

            if (isLeftHit || isRightHit) {
              gate.collected = true;
              setFashionScore((prev) => {
                const updated = Math.min(100, Math.max(0, prev + gate.bonus));
                return updated;
              });
            }
          }
        });

        // Reached the end of runway
        if (stateRef.current.runwayProgress >= 100) {
          evaluateRunway(fashionScore);
        }
      }

      // Draw Gates
      const progressY = stateRef.current.runwayProgress * 6;
      gates.forEach((gate) => {
        const screenY = gate.y - progressY + 350;
        if (screenY > -50 && screenY < height + 50) {
          const gateX = gate.lane === 'left' ? catwalkX + 15 : catwalkX + catwalkW - 85;
          ctx.fillStyle = gate.collected
            ? 'rgba(74, 222, 128, 0.3)'
            : gate.bonus > 0
            ? 'rgba(236, 72, 153, 0.7)'
            : 'rgba(239, 68, 68, 0.7)';
          ctx.fillRect(gateX, screenY, 70, 40);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(gateX, screenY, 70, 40);

          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(gate.icon, gateX + 35, screenY + 22);

          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(gate.bonus > 0 ? `+${gate.bonus}pt` : `${gate.bonus}pt`, gateX + 35, screenY + 34);
        }
      });

      // Draw Model (Card #84 Hero)
      const modelDrawX = Math.max(catwalkX + 15, Math.min(catwalkX + catwalkW - 55, stateRef.current.modelX - 20));
      drawCardSprite(ctx, 84, modelDrawX, 460, 40, 56);

      // Fashion Score Indicator
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`✨ STYLE: ${fashionScore}pt`, modelDrawX + 20, 450);

      // Runway Progress Bar
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(20, 20, width - 40, 10);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(20, 20, (width - 40) * Math.min(1, stateRef.current.runwayProgress / 100), 10);

      // Judge comment banner
      if (judgeComment) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(20, 240, width - 40, 50);
        ctx.strokeStyle = '#f43f5e';
        ctx.strokeRect(20, 240, width - 40, 50);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(judgeComment, width / 2, 270);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, fashionScore, judgeComment, evaluateRunway]);

  // Touch steer
  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    const tx = ((t.clientX - rect.left) / rect.width) * 400;
    stateRef.current.targetX = tx;
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#1e1b4b] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Fashion Legends"
        missionTarget="런웨이 워킹 80점 이상 획득"
        currentScore={fashionScore}
        maxScore={100}
        scoreUnit="점"
        onBack={onBack}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="w-full h-full object-contain rounded border border-white/20 bg-slate-950 touch-none shadow-2xl"
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          onMouseDown={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            stateRef.current.targetX = ((e.clientX - rect.left) / rect.width) * 400;
          }}
          onMouseMove={(e) => {
            if (e.buttons > 0) {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              stateRef.current.targetX = ((e.clientX - rect.left) / rect.width) * 400;
            }
          }}
        />

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-pink-400 mb-2">[ Fashion Legends ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              글로벌 캣워크 런웨이를 걸으며 최고의 패션을 완성하세요!<br />
              1. <b>화면 좌우 터치/드래그</b>로 모델을 조종합니다.<br />
              2. 런웨이 양쪽의 <b>플러스(+) 의상 게이트</b>를 수집해 스타일 점수를 높이세요.<br />
              3. 종점 포디움에서 <b>80점 이상</b> 획득 시 챔피언 트로피 수여!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-pink-500 hover:bg-pink-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              캣워크 개시 [WALK]
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-rose-500 mb-2">[ 심사 탈락 ]</h2>
            <p className="text-sm text-slate-300 mb-4">최종 스타일 점수: {fashionScore}점 / 80점 미달</p>
            <button
              onClick={handleStart}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-sm active:scale-95 transition-all"
            >
              다시 도전
            </button>
          </div>
        )}

        {gameState === 'victory' && rewardReceipt && (
          <VictoryRewardModal
            receipt={rewardReceipt}
            language="ko"
            onPlayAgain={handleStart}
            onExit={onBack}
          />
        )}
      </div>

      {/* Guide Footer */}
      <div className="w-full max-w-md p-2 bg-slate-900/90 border-t border-white/10 text-center text-xs text-slate-400">
        좌우 스와이프 조타 | 보너스 의상 게이트 수집 | 80점 이상 런웨이 우승
      </div>
    </div>
  );
};
export default PokiFashionLegendsGame;
