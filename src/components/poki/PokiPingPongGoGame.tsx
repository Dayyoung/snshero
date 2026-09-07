import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPingPongGoGameProps {
  onClose: () => void;
}

export default function PokiPingPongGoGame({ onClose }: PokiPingPongGoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [rallyCount, setRallyCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const WIN_SCORE = 5;

  const stateRef = useRef<{
    ball: { x: number; y: number; vx: number; vy: number; radius: number };
    playerPaddle: { x: number; y: number; w: number; h: number };
    aiPaddle: { x: number; y: number; w: number; h: number; speed: number };
    rally: number;
    touchX: number | null;
    pScore: number;
    aScore: number;
  }>({
    ball: { x: 200, y: 300, vx: 2, vy: 5, radius: 7 },
    playerPaddle: { x: 200, y: 520, w: 70, h: 14 },
    aiPaddle: { x: 200, y: 120, w: 65, h: 14, speed: 3.5 },
    rally: 0,
    touchX: null,
    pScore: 0,
    aScore: 0
  });

  const playSound = (type: 'paddle' | 'table' | 'score' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'paddle') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'table') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.06);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'score') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.exponentialRampToValueAtTime(1046, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
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

  const resetBall = (toPlayer: boolean) => {
    const s = stateRef.current;
    s.ball.x = s.playerPaddle.x;
    s.ball.y = toPlayer ? s.playerPaddle.y - 30 : s.aiPaddle.y + 30;
    s.ball.vx = (Math.random() - 0.5) * 4;
    s.ball.vy = toPlayer ? -5.5 : 5.5;
    s.rally = 0;
    setRallyCount(0);
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
      const s = stateRef.current;
      s.playerPaddle.y = canvas.height * 0.82;
      s.aiPaddle.y = canvas.height * 0.18;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const s = stateRef.current;
      const b = s.ball;
      const pp = s.playerPaddle;
      const ap = s.aiPaddle;

      const tableLeft = Math.max(20, (canvas.width - 320) / 2);
      const tableRight = Math.min(canvas.width - 20, (canvas.width + 320) / 2);

      // Player Movement
      if (s.touchX !== null) {
        pp.x += (s.touchX - pp.x) * 0.3;
      }
      pp.x = Math.max(tableLeft + pp.w / 2, Math.min(tableRight - pp.w / 2, pp.x));

      // AI Paddle Movement
      const aiTargetX = b.x;
      ap.x += (aiTargetX - ap.x) * 0.12;
      ap.x = Math.max(tableLeft + ap.w / 2, Math.min(tableRight - ap.w / 2, ap.x));

      // Ball Physics
      b.x += b.vx;
      b.y += b.vy;

      // Wall Bounce
      if (b.x <= tableLeft + b.radius || b.x >= tableRight - b.radius) {
        b.vx = -b.vx;
        playSound('table');
      }

      // Player Paddle Hit
      if (
        b.y + b.radius >= pp.y - pp.h / 2 &&
        b.y - b.radius <= pp.y + pp.h / 2 &&
        b.x >= pp.x - pp.w / 2 &&
        b.x <= pp.x + pp.w / 2 &&
        b.vy > 0
      ) {
        // Calculate deflection angle
        const hitOffset = (b.x - pp.x) / (pp.w / 2);
        b.vx = hitOffset * 6.5;
        b.vy = -Math.abs(b.vy) * 1.05; // Slightly faster each rally
        b.vy = Math.max(-12, b.vy);
        s.rally++;
        setRallyCount(s.rally);
        playSound('paddle');
      }

      // AI Paddle Hit
      if (
        b.y - b.radius <= ap.y + ap.h / 2 &&
        b.y + b.radius >= ap.y - ap.h / 2 &&
        b.x >= ap.x - ap.w / 2 &&
        b.x <= ap.x + ap.w / 2 &&
        b.vy < 0
      ) {
        const hitOffset = (b.x - ap.x) / (ap.w / 2);
        b.vx = hitOffset * 6.0;
        b.vy = Math.abs(b.vy) * 1.05;
        b.vy = Math.min(12, b.vy);
        s.rally++;
        setRallyCount(s.rally);
        playSound('paddle');
      }

      // Point Scored by Player (Ball out top)
      if (b.y < ap.y - 40) {
        s.pScore++;
        setPlayerScore(s.pScore);
        playSound('score');
        if (s.pScore >= WIN_SCORE && !gameWon) {
          setGameWon(true);
          playSound('win');
          const deposit = calculateAndDepositMissionReward({
            gameId: 'pokipingponggo',
            gameTitle: 'Ping Pong Go!',
            isVictory: true,
            score: 1000,
            maxTargetScore: 1000,
            durationSeconds: 30
          });
          setRewardResult(deposit);
        } else {
          resetBall(false);
        }
      }

      // Point Scored by AI (Ball out bottom)
      if (b.y > pp.y + 40) {
        s.aScore++;
        setAiScore(s.aScore);
        playSound('table');
        if (s.aScore >= WIN_SCORE && !gameOver) {
          setGameOver(true);
        } else {
          resetBall(true);
        }
      }

      // RENDER
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ping Pong Table Surface
      const tableW = tableRight - tableLeft;
      const tableH = pp.y - ap.y + 60;
      ctx.fillStyle = '#0284c7'; // Blue Table
      ctx.fillRect(tableLeft, ap.y - 30, tableW, tableH);

      // White Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(tableLeft, ap.y - 30, tableW, tableH);

      // Center Net
      const netY = (ap.y + pp.y) / 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(tableLeft, netY);
      ctx.lineTo(tableRight, netY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      // Draw AI Paddle
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(ap.x - ap.w / 2, ap.y - ap.h / 2, ap.w, ap.h);
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;
      ctx.strokeRect(ap.x - ap.w / 2, ap.y - ap.h / 2, ap.w, ap.h);

      // Draw Player Paddle
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(pp.x - pp.w / 2, pp.y - pp.h / 2, pp.w, pp.h);
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 2;
      ctx.strokeRect(pp.x - pp.w / 2, pp.y - pp.h / 2, pp.w, pp.h);

      // Player Card Sprite
      drawCardSprite(ctx, 74, pp.x - 14, pp.y + 14, 28, 28);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Touch Event Handling
    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      stateRef.current.touchX = t.clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      stateRef.current.touchX = t.clientX;
    };

    const handleTouchEnd = () => {
      stateRef.current.touchX = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameWon]);

  return (
    <div className="relative w-full h-full bg-zinc-950 flex flex-col select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Ping Pong Go!"
        missionTarget={`먼저 ${WIN_SCORE}점 득점 매치 승리`}
        currentProgress={`나: ${playerScore} VS 상대: ${aiScore} | 랠리: ${rallyCount}회`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Bottom Touch Guide */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-zinc-900/80 text-zinc-300 border border-zinc-700 px-3 py-1.5 text-xs rounded-sm">
            좌우 드래그: 탁구 라켓 이동 & 고속 랠리 스매시!
          </span>
        </div>

        {/* Game Over Modal */}
        {gameOver && !gameWon && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-none text-center max-w-sm">
              <h2 className="text-xl font-bold text-red-400 mb-2">매치 패배!</h2>
              <p className="text-xs text-zinc-400 mb-4">상대 선수가 먼저 {WIN_SCORE}점을 획득했습니다.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-sm"
                >
                  다시 도전
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-sm border border-zinc-700"
                >
                  나가기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {gameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          rewardSNS={rewardResult.rewardSNS}
          gameTitle="Ping Pong Go!"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
