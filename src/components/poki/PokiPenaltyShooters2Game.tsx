import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPenaltyShooters2GameProps {
  onBack: () => void;
}

type TurnMode = 'shoot' | 'save';

export const PokiPenaltyShooters2Game: React.FC<PokiPenaltyShooters2GameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'roundResult' | 'victory' | 'gameover'>('ready');
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState<TurnMode>('shoot');
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [roundMessage, setRoundMessage] = useState<string>('');

  const stateRef = useRef({
    ball: {
      x: 200,
      y: 460,
      targetX: 200,
      targetY: 200,
      radius: 12,
      progress: 0,
      inFlight: false,
    },
    keeper: {
      x: 200,
      y: 220,
      targetX: 200,
      targetY: 220,
      w: 48,
      h: 64,
    },
    // Goal bounds
    goal: {
      x: 60,
      y: 130,
      w: 280,
      h: 150,
    },
    dragStart: null as { x: number; y: number } | null,
    dragCurrent: null as { x: number; y: number } | null,
  });

  const initRound = useCallback((nextRound: number, nextTurn: TurnMode) => {
    stateRef.current.ball = {
      x: 200,
      y: 460,
      targetX: 200,
      targetY: 200,
      radius: 12,
      progress: 0,
      inFlight: false,
    };
    stateRef.current.keeper = {
      x: 200,
      y: 220,
      targetX: 200,
      targetY: 220,
      w: 48,
      h: 64,
    };
    stateRef.current.dragStart = null;
    stateRef.current.dragCurrent = null;
    setTurn(nextTurn);
    setRound(nextRound);
    setRoundMessage('');
  }, []);

  const handleStart = () => {
    setPlayerScore(0);
    setAiScore(0);
    setRewardReceipt(null);
    initRound(1, 'shoot');
    setGameState('playing');
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokipenaltyshooters2',
      gameTitle: 'Penalty Shooters 2 Tournament',
      isVictory: true,
      score: 5,
      maxTargetScore: 5,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, []);

  // End of a shot/save animation
  const evaluateTurn = useCallback(() => {
    const { ball, keeper, goal } = stateRef.current;
    const isInsideGoal =
      ball.targetX >= goal.x + 10 &&
      ball.targetX <= goal.x + goal.w - 10 &&
      ball.targetY >= goal.y + 10 &&
      ball.targetY <= goal.y + goal.h;

    const keeperDist = Math.hypot(ball.targetX - keeper.targetX, ball.targetY - keeper.targetY);
    const isSaved = keeperDist < 46;

    if (turn === 'shoot') {
      if (isInsideGoal && !isSaved) {
        setPlayerScore((prev) => prev + 1);
        setRoundMessage('⚽ GOOOAL! 멋진 슈팅 득점!');
      } else if (isSaved) {
        setRoundMessage('🧤 선방 당함! 키퍼가 막아냈습니다.');
      } else {
        setRoundMessage('💨 골대 밖으로 빗나갔습니다!');
      }
    } else {
      // turn === 'save'
      if (isSaved) {
        setRoundMessage('🧤 완벽한 슈퍼 세이브! 방어 성공!');
      } else if (isInsideGoal) {
        setAiScore((prev) => prev + 1);
        setRoundMessage('🥅 실점! 상대방의 득점.');
      } else {
        setRoundMessage('💨 상대 슈팅이 빗나갔습니다!');
      }
    }

    setGameState('roundResult');

    setTimeout(() => {
      if (turn === 'shoot') {
        // Now AI shoots, player saves
        initRound(round, 'save');
        setGameState('playing');
        // AI kicks automatically after 1 second
        setTimeout(() => {
          triggerAiKick();
        }, 800);
      } else {
        // Next round
        if (round >= 3) {
          // Check final score
          const pScore = playerScore + (roundMessage.includes('GOOOAL') ? 1 : 0);
          const aScore = aiScore + (roundMessage.includes('실점') ? 1 : 0);
          if (pScore >= aScore) {
            handleVictory();
          } else {
            setGameState('gameover');
          }
        } else {
          initRound(round + 1, 'shoot');
          setGameState('playing');
        }
      }
    }, 1800);
  }, [turn, round, playerScore, aiScore, roundMessage, initRound, handleVictory]);

  // AI shoots at goal
  const triggerAiKick = () => {
    const { ball, goal } = stateRef.current;
    const targetX = goal.x + 20 + Math.random() * (goal.w - 40);
    const targetY = goal.y + 20 + Math.random() * (goal.h - 30);
    ball.targetX = targetX;
    ball.targetY = targetY;
    ball.inFlight = true;
    ball.progress = 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const { ball, keeper, goal } = stateRef.current;

      ctx.clearRect(0, 0, width, height);

      // Stadium turf & stands
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, width, height);

      // Stadium Crowd in background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, 120);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#f59e0b';
        ctx.beginPath();
        ctx.arc((i * 12) % 400, 20 + (i % 5) * 18, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Green Pitch with stripes
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 120, width, height - 120);
      for (let s = 140; s < height; s += 50) {
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(0, s, width, 25);
      }

      // Penalty box lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 250, 340, 320);
      ctx.strokeRect(100, 200, 200, 80);

      // Goal Post
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);

      // Goal net pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      for (let nx = goal.x; nx <= goal.x + goal.w; nx += 16) {
        ctx.beginPath();
        ctx.moveTo(nx, goal.y);
        ctx.lineTo(nx, goal.y + goal.h);
        ctx.stroke();
      }
      for (let ny = goal.y; ny <= goal.y + goal.h; ny += 16) {
        ctx.beginPath();
        ctx.moveTo(goal.x, ny);
        ctx.lineTo(goal.x + goal.w, ny);
        ctx.stroke();
      }

      // Ball Physics Flight
      if (ball.inFlight) {
        ball.progress += 0.04;
        const p = Math.min(1, ball.progress);
        ball.x = 200 + (ball.targetX - 200) * p;
        ball.y = 460 + (ball.targetY - 460) * p;
        // Arc peak
        ball.radius = 12 - p * 4;

        if (p >= 1) {
          ball.inFlight = false;
          evaluateTurn();
        }
      }

      // Keeper movement
      if (turn === 'shoot' && ball.inFlight) {
        // AI Goalkeeper dives
        keeper.targetX += (ball.targetX - keeper.targetX) * 0.08;
        keeper.targetY += (ball.targetY - keeper.targetY) * 0.08;
      }

      // Draw Goalkeeper
      ctx.save();
      const kx = keeper.targetX - keeper.w / 2;
      const ky = keeper.targetY - keeper.h / 2;
      if (turn === 'shoot') {
        // AI Keeper (Red/Black Jersey)
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(kx, ky, keeper.w, keeper.h);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(kx - 10, ky + 10, 10, 20); // Gloves
        ctx.fillRect(kx + keeper.w, ky + 10, 10, 20);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AI KEEPER', keeper.targetX, ky - 8);
      } else {
        // Player Keeper (Card #81 Hero)
        drawCardSprite(ctx, 81, kx, ky, keeper.w, keeper.h);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ YOU (GK)', keeper.targetX, ky - 8);
      }
      ctx.restore();

      // Draw Ball
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Soccer ball pentagon pattern
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Slingshot Aim Line (when shooting)
      if (turn === 'shoot' && stateRef.current.dragStart && stateRef.current.dragCurrent) {
        const ds = stateRef.current.dragStart;
        const dc = stateRef.current.dragCurrent;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(200, 460);
        // Invert drag vector to shoot target
        const aimX = 200 - (dc.x - ds.x) * 1.5;
        const aimY = 460 - (dc.y - ds.y) * 1.5;
        ctx.lineTo(aimX, aimY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target crosshair
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(aimX, aimY, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Round Message Overlay
      if (roundMessage) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(30, 260, 340, 50);
        ctx.strokeStyle = '#f59e0b';
        ctx.strokeRect(30, 260, 340, 50);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(roundMessage, 200, 292);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [turn, roundMessage, evaluateTurn]);

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    const tx = ((t.clientX - rect.left) / rect.width) * 400;
    const ty = ((t.clientY - rect.top) / rect.height) * 600;

    if (turn === 'shoot') {
      stateRef.current.dragStart = { x: tx, y: ty };
      stateRef.current.dragCurrent = { x: tx, y: ty };
    } else {
      // Save mode: Move Goalkeeper
      stateRef.current.keeper.targetX = Math.max(80, Math.min(320, tx));
      stateRef.current.keeper.targetY = Math.max(140, Math.min(270, ty));
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    const tx = ((t.clientX - rect.left) / rect.width) * 400;
    const ty = ((t.clientY - rect.top) / rect.height) * 600;

    if (turn === 'shoot' && stateRef.current.dragStart) {
      stateRef.current.dragCurrent = { x: tx, y: ty };
    } else if (turn === 'save') {
      stateRef.current.keeper.targetX = Math.max(80, Math.min(320, tx));
      stateRef.current.keeper.targetY = Math.max(140, Math.min(270, ty));
    }
  };

  const handleTouchEnd = () => {
    if (gameState !== 'playing') return;
    if (turn === 'shoot' && stateRef.current.dragStart && stateRef.current.dragCurrent) {
      const ds = stateRef.current.dragStart;
      const dc = stateRef.current.dragCurrent;
      const aimX = 200 - (dc.x - ds.x) * 1.5;
      const aimY = 460 - (dc.y - ds.y) * 1.5;

      const { ball } = stateRef.current;
      ball.targetX = aimX;
      ball.targetY = aimY;
      ball.inFlight = true;
      ball.progress = 0;

      // Reset drag
      stateRef.current.dragStart = null;
      stateRef.current.dragCurrent = null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#064e3b] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Penalty Shooters 2"
        missionTarget={`승부차기 우승 (${round}/3라운드)`}
        currentScore={playerScore}
        maxScore={3}
        scoreUnit="골"
        onBack={onBack}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="w-full h-full object-contain rounded border border-white/20 bg-emerald-950 touch-none shadow-2xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Scoreboard Header Overlay */}
        <div className="absolute top-4 bg-black/75 px-5 py-2 rounded border border-white/20 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-bold">YOU:</span>
            <span className="text-xl font-black text-white">{playerScore}</span>
          </div>
          <div className="text-xs text-amber-400 font-bold">
            {turn === 'shoot' ? '⚡ 당신의 슈팅 차례!' : '🧤 상대방 슈팅 방어!'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-rose-400 font-bold">AI:</span>
            <span className="text-xl font-black text-white">{aiScore}</span>
          </div>
        </div>

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-amber-400 mb-2">[ Penalty Shooters 2 ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              승부차기 3라운드 토너먼트에서 승리하세요!<br />
              <b>공격 턴</b>: 공을 뒤로 당겨 각도를 조준하고 손을 떼어 슈팅!<br />
              <b>수비 턴</b>: 키퍼를 손가락으로 드래그해 상대 슈팅을 선방!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              토너먼트 시작 [KICK OFF]
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-rose-500 mb-2">[ 승부차기 패배 ]</h2>
            <p className="text-sm text-slate-300 mb-4">최종 스코어: {playerScore} - {aiScore}</p>
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
      <div className="w-full max-w-md p-2 bg-emerald-950/90 border-t border-white/10 text-center text-xs text-slate-300">
        슬링샷 조준 슈팅 | 키퍼 드래그 선방 | 승부차기 3라운드 승리 시 미션 클리어
      </div>
    </div>
  );
};
export default PokiPenaltyShooters2Game;
