import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSprintLeagueGameProps {
  onClose: () => void;
}

interface Runner {
  id: string;
  lane: number;
  dist: number;
  speed: number;
  cardId: number;
  name: string;
  color: string;
  isPlayer: boolean;
  isJumping: boolean;
  jumpY: number;
  jumpVy: number;
  finished: boolean;
  finishRank: number;
}

interface Hurdle {
  lane: number;
  dist: number;
  hit: boolean;
}

export default function PokiSprintLeagueGame({ onClose }: PokiSprintLeagueGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playerDist, setPlayerDist] = useState(0);
  const [playerRank, setPlayerRank] = useState(1);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const TRACK_LENGTH = 100; // 100 meters

  const stateRef = useRef<{
    runners: Runner[];
    hurdles: Hurdle[];
    lastTapFoot: 'left' | 'right' | null;
    finishOrder: string[];
  }>({
    runners: [
      {
        id: 'player',
        lane: 0,
        dist: 0,
        speed: 0,
        cardId: 64,
        name: '나 (히어로)',
        color: '#3b82f6',
        isPlayer: true,
        isJumping: false,
        jumpY: 0,
        jumpVy: 0,
        finished: false,
        finishRank: 0
      },
      {
        id: 'ai1',
        lane: 1,
        dist: 0,
        speed: 0,
        cardId: 13,
        name: '골드 라이트',
        color: '#eab308',
        isPlayer: false,
        isJumping: false,
        jumpY: 0,
        jumpVy: 0,
        finished: false,
        finishRank: 0
      },
      {
        id: 'ai2',
        lane: 2,
        dist: 0,
        speed: 0,
        cardId: 7,
        name: '썬더 볼트',
        color: '#ef4444',
        isPlayer: false,
        isJumping: false,
        jumpY: 0,
        jumpVy: 0,
        finished: false,
        finishRank: 0
      },
      {
        id: 'ai3',
        lane: 3,
        dist: 0,
        speed: 0,
        cardId: 1,
        name: '스피드 카단',
        color: '#10b981',
        isPlayer: false,
        isJumping: false,
        jumpY: 0,
        jumpVy: 0,
        finished: false,
        finishRank: 0
      }
    ],
    hurdles: [
      { lane: 0, dist: 30, hit: false },
      { lane: 0, dist: 60, hit: false },
      { lane: 0, dist: 85, hit: false },
      { lane: 1, dist: 30, hit: false },
      { lane: 1, dist: 60, hit: false },
      { lane: 1, dist: 85, hit: false },
      { lane: 2, dist: 30, hit: false },
      { lane: 2, dist: 60, hit: false },
      { lane: 2, dist: 85, hit: false },
      { lane: 3, dist: 30, hit: false },
      { lane: 3, dist: 60, hit: false },
      { lane: 3, dist: 85, hit: false }
    ],
    lastTapFoot: null,
    finishOrder: []
  });

  const playSound = (type: 'step' | 'jump' | 'stumble' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'step') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'stumble') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
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

  const handleFootTap = (foot: 'left' | 'right') => {
    const s = stateRef.current;
    const player = s.runners.find((r) => r.isPlayer);
    if (!player || player.finished) return;

    if (s.lastTapFoot !== foot) {
      // Good rhythm bonus!
      player.speed = Math.min(player.speed + 0.06, 0.48);
      s.lastTapFoot = foot;
      playSound('step');
    } else {
      // Stumble on same foot
      player.speed = Math.max(player.speed - 0.04, 0.1);
    }
  };

  const handleJump = () => {
    const player = stateRef.current.runners.find((r) => r.isPlayer);
    if (!player || player.isJumping || player.finished) return;
    player.isJumping = true;
    player.jumpVy = 8.5;
    playSound('jump');
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
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const s = stateRef.current;
      const player = s.runners.find((r) => r.isPlayer);

      // AI runners physics & jump AI
      s.runners.forEach((r) => {
        if (!r.isPlayer && !r.finished) {
          // AI base speed with natural fluctuation
          const targetSpd = 0.38 + (Math.sin(Date.now() * 0.003 + r.lane) * 0.04);
          r.speed += (targetSpd - r.speed) * 0.05;

          // AI Hurdles Jump Auto
          const upcomingHurdle = s.hurdles.find(
            (h) => h.lane === r.lane && !h.hit && h.dist > r.dist && h.dist - r.dist < 2.5
          );
          if (upcomingHurdle && !r.isJumping && Math.random() < 0.9) {
            r.isJumping = true;
            r.jumpVy = 8.5;
          }
        }

        // Apply Speed & Friction
        if (!r.finished) {
          r.dist += r.speed;
          if (r.isPlayer) {
            r.speed *= 0.985; // Player friction
          }
        }

        // Jump physics
        if (r.isJumping) {
          r.jumpY += r.jumpVy;
          r.jumpVy -= 0.6; // Gravity
          if (r.jumpY <= 0) {
            r.jumpY = 0;
            r.jumpVy = 0;
            r.isJumping = false;
          }
        }

        // Hurdle Collision
        s.hurdles.forEach((h) => {
          if (h.lane === r.lane && !h.hit && Math.abs(r.dist - h.dist) < 0.8) {
            if (r.jumpY < 18) {
              // Hit hurdle!
              h.hit = true;
              r.speed *= 0.4;
              if (r.isPlayer) playSound('stumble');
            }
          }
        });

        // Finish Check
        if (r.dist >= TRACK_LENGTH && !r.finished) {
          r.finished = true;
          r.dist = TRACK_LENGTH;
          s.finishOrder.push(r.id);
          r.finishRank = s.finishOrder.length;

          if (r.isPlayer) {
            if (r.finishRank === 1) {
              setGameWon(true);
              playSound('win');
              const deposit = calculateAndDepositMissionReward({
                gameId: 'pokisprintleague',
                gameTitle: 'Sprint League',
                isVictory: true,
                score: 1000,
                maxTargetScore: 1000,
                durationSeconds: 30
              });
              setRewardResult(deposit);
            } else {
              setGameOver(true);
            }
          }
        }
      });

      // Update UI Rank
      if (player) {
        setPlayerDist(Math.floor(player.dist));
        const currentRank =
          s.runners.filter((r) => r.dist > player.dist).length + 1;
        setPlayerRank(currentRank);
      }

      // RENDER
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const trackTop = canvas.height * 0.22;
      const trackHeight = canvas.height * 0.52;
      const laneHeight = trackHeight / 4;

      // Track Clay Surface
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(0, trackTop, canvas.width, trackHeight);

      // Lane Lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, trackTop + i * laneHeight);
        ctx.lineTo(canvas.width, trackTop + i * laneHeight);
        ctx.stroke();
      }

      // Camera Offset tracking player
      const pDist = player ? player.dist : 0;
      const viewScale = canvas.width / 35; // Show ~35m in view
      const viewOffsetX = pDist * viewScale - canvas.width * 0.25;

      // Draw Distance Markers & Finish Line
      for (let m = 0; m <= TRACK_LENGTH; m += 10) {
        const screenX = m * viewScale - viewOffsetX;
        if (screenX >= -50 && screenX <= canvas.width + 50) {
          ctx.strokeStyle = m === TRACK_LENGTH ? '#fbbf24' : 'rgba(255,255,255,0.4)';
          ctx.lineWidth = m === TRACK_LENGTH ? 6 : 2;
          ctx.beginPath();
          ctx.moveTo(screenX, trackTop);
          ctx.lineTo(screenX, trackTop + trackHeight);
          ctx.stroke();

          ctx.fillStyle = m === TRACK_LENGTH ? '#fbbf24' : '#ffffff';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${m}m`, screenX, trackTop - 6);
        }
      }

      // Draw Hurdles
      s.hurdles.forEach((h) => {
        const screenX = h.dist * viewScale - viewOffsetX;
        const ly = trackTop + h.lane * laneHeight + laneHeight / 2;
        if (screenX >= -30 && screenX <= canvas.width + 30) {
          ctx.fillStyle = h.hit ? '#71717a' : '#f59e0b';
          ctx.fillRect(screenX - 3, ly - 14, 6, 28);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(screenX - 3, ly - 14, 6, 6);
        }
      });

      // Draw Runners
      s.runners.forEach((r) => {
        const screenX = r.dist * viewScale - viewOffsetX;
        const ly = trackTop + r.lane * laneHeight + laneHeight / 2 - r.jumpY;

        drawCardSprite(ctx, r.cardId, screenX - 18, ly - 18, 36, 36);

        // Name tag
        ctx.fillStyle = r.isPlayer ? '#60a5fa' : '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(r.name, screenX, ly - 22);

        // Finish ribbon
        if (r.finished) {
          ctx.fillStyle = '#22c55e';
          ctx.fillText(`FINISH #${r.finishRank}`, screenX, ly + 28);
        }
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [gameWon]);

  return (
    <div className="relative w-full h-full bg-zinc-950 flex flex-col select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Sprint League"
        missionTarget="100m 트랙에서 1위로 결승선 통과"
        currentProgress={`${playerDist}m / 100m (현재 ${playerRank}위)`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Foot Control & Jump Buttons */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-between items-center px-6 pointer-events-auto">
          {/* Left Foot Tap */}
          <button
            onClick={() => handleFootTap('left')}
            className="w-24 h-24 bg-blue-600 active:bg-blue-500 rounded-full border-2 border-blue-300 text-white font-bold text-lg shadow-xl active:scale-95 flex flex-col items-center justify-center"
          >
            <span>왼발</span>
            <span className="text-[10px] text-blue-200">TAP!</span>
          </button>

          {/* Jump Button */}
          <button
            onClick={handleJump}
            className="w-20 h-20 bg-amber-500 active:bg-amber-400 rounded-full border-2 border-amber-200 text-black font-bold text-sm shadow-xl active:scale-95 flex flex-col items-center justify-center"
          >
            <span>점프</span>
            <span className="text-[10px] text-amber-900">허들 넘기</span>
          </button>

          {/* Right Foot Tap */}
          <button
            onClick={() => handleFootTap('right')}
            className="w-24 h-24 bg-blue-600 active:bg-blue-500 rounded-full border-2 border-blue-300 text-white font-bold text-lg shadow-xl active:scale-95 flex flex-col items-center justify-center"
          >
            <span>오른발</span>
            <span className="text-[10px] text-blue-200">TAP!</span>
          </button>
        </div>

        {/* Game Over Modal */}
        {gameOver && !gameWon && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-none text-center max-w-sm">
              <h2 className="text-xl font-bold text-red-400 mb-2">1위 달성 실패!</h2>
              <p className="text-xs text-zinc-400 mb-4">다른 스프린터에게 선두를 내주었습니다.</p>
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
          gameTitle="Sprint League"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
