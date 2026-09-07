import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRailInAirGameProps {
  onClose: () => void;
}

interface Station {
  dist: number;
  name: string;
  cleared: boolean;
}

export default function PokiRailInAirGame({ onClose }: PokiRailInAirGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentDist, setCurrentDist] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [clearedStations, setClearedStations] = useState(0);
  const [derailRisk, setDerailRisk] = useState(0);
  const [isStationStop, setIsStationStop] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const TOTAL_TRACK = 3000; // 3000m

  const stateRef = useRef<{
    dist: number;
    speed: number; // 0 to 20
    throttle: number; // 0 to 1
    brake: boolean;
    stations: Station[];
    risk: number; // 0 to 100
    isStoppedAtStation: boolean;
    stationWaitTimer: number;
    touchY: number | null;
  }>({
    dist: 0,
    speed: 0,
    throttle: 0,
    brake: false,
    stations: [
      { dist: 800, name: '스카이 하버 역', cleared: false },
      { dist: 1800, name: '클라우드 피크 역', cleared: false },
      { dist: 2800, name: '센트럴 에어 포트 역', cleared: false }
    ],
    risk: 0,
    isStoppedAtStation: false,
    stationWaitTimer: 0,
    touchY: null
  });

  const isCurveZone = (d: number) => {
    // Sharp curves at 400-600, 1200-1500, 2200-2500
    return (
      (d >= 400 && d <= 650) ||
      (d >= 1200 && d <= 1500) ||
      (d >= 2200 && d <= 2550)
    );
  };

  const playSound = (type: 'horn' | 'chime' | 'alarm' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'horn') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(420, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'alarm') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
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

      // Physics
      if (s.isStoppedAtStation) {
        s.stationWaitTimer++;
        if (s.stationWaitTimer > 100) {
          // Passengers boarded, release
          s.isStoppedAtStation = false;
          setIsStationStop(false);
          s.stationWaitTimer = 0;
          playSound('horn');
        }
      } else {
        // Apply throttle & brake
        const maxSpd = 16;
        if (s.brake) {
          s.speed = Math.max(0, s.speed - 0.25);
        } else {
          const targetSpd = s.throttle * maxSpd;
          s.speed += (targetSpd - s.speed) * 0.05;
        }

        s.dist += s.speed * 0.5;
        setCurrentDist(Math.floor(s.dist));
        setSpeedKmh(Math.floor(s.speed * 12));

        // Check curve overspeed risk
        const inCurve = isCurveZone(s.dist);
        if (inCurve && s.speed > 8) {
          s.risk = Math.min(100, s.risk + (s.speed - 8) * 0.4);
          if (Math.random() < 0.2) playSound('alarm');
        } else {
          s.risk = Math.max(0, s.risk - 0.6);
        }
        setDerailRisk(Math.floor(s.risk));

        // Derail Game Over
        if (s.risk >= 100 && !gameOver) {
          setGameOver(true);
        }

        // Station Check
        s.stations.forEach((st) => {
          if (!st.cleared && Math.abs(s.dist - st.dist) < 25) {
            if (s.speed < 2) {
              // Perfectly stopped at station
              st.cleared = true;
              s.isStoppedAtStation = true;
              setIsStationStop(true);
              s.speed = 0;
              s.stationWaitTimer = 0;
              playSound('chime');
              const clearedCount = s.stations.filter((x) => x.cleared).length;
              setClearedStations(clearedCount);

              if (clearedCount >= 3 && !gameWon) {
                setGameWon(true);
                playSound('win');
                const deposit = calculateAndDepositMissionReward({
                  gameId: 'pokirailinair',
                  gameTitle: 'Rail in the Air',
                  isVictory: true,
                  score: 1000,
                  maxTargetScore: 1000,
                  durationSeconds: 30
                });
                setRewardResult(deposit);
              }
            }
          }
        });
      }

      // RENDER
      ctx.fillStyle = '#0284c7'; // High altitude sky
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 180 - s.dist * 0.2) % (canvas.width + 200)) - 50;
        ctx.beginPath();
        ctx.arc(cx, 120 + i * 20, 45, 0, Math.PI * 2);
        ctx.arc(cx + 40, 110 + i * 20, 55, 0, Math.PI * 2);
        ctx.arc(cx + 80, 120 + i * 20, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      // High monorail concrete pillars
      const railY = canvas.height * 0.62;
      ctx.fillStyle = '#475569';
      for (let x = -((s.dist * 2) % 120); x < canvas.width; x += 120) {
        ctx.fillRect(x + 20, railY, 24, canvas.height - railY);
      }

      // Dual Monorail Beams
      const inCurve = isCurveZone(s.dist);
      ctx.fillStyle = inCurve ? '#f97316' : '#cbd5e1';
      ctx.fillRect(0, railY - 14, canvas.width, 14);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, railY - 8, canvas.width, 4);

      // Station Platform if nearby
      s.stations.forEach((st) => {
        const relX = (st.dist - s.dist) * 2 + canvas.width * 0.35;
        if (relX > -100 && relX < canvas.width + 100) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(relX - 60, railY - 60, 120, 46);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`[ ${st.name} ]`, relX, railY - 68);
          ctx.fillStyle = '#fde047';
          ctx.fillText('정차 구역 (STOP)', relX, railY - 42);
        }
      });

      // Draw Monorail Train Body
      const trainX = canvas.width * 0.35;
      const trainY = railY - 44;

      // Train Carriages (3 cars)
      for (let c = 0; c < 3; c++) {
        const cx = trainX - c * 64;
        ctx.fillStyle = c === 0 ? '#1e40af' : '#2563eb';
        ctx.fillRect(cx - 28, trainY, 56, 30);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 28, trainY, 56, 30);

        // Windows
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(cx - 20, trainY + 6, 16, 12);
        ctx.fillRect(cx + 4, trainY + 6, 16, 12);
      }

      // Train Wheels / Magnets on rail
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(trainX - 24, railY - 14, 16, 8);
      ctx.fillRect(trainX + 8, railY - 14, 16, 8);

      // Conductor Card Sprite
      drawCardSprite(ctx, 67, trainX - 14, trainY + 4, 28, 28);

      // Curve Warning Sign
      if (inCurve) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ 급커브 감속 경고! 80km/h 이하 유지 ⚠️', canvas.width / 2, 75);
      }

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
        gameTitle="Rail in the Air"
        missionTarget="탈선 없이 3개 정거장 정차 및 승객 운송"
        currentProgress={`역 통과: ${clearedStations} / 3 | 탈선 위험도: ${derailRisk}%`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Dashboard Gauges */}
        <div className="absolute top-2 left-4 bg-zinc-900/85 border border-zinc-700 p-3 rounded-sm space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">속도:</span>
            <span className="text-sky-400 font-bold ml-3 text-sm">{speedKmh} KM/H</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">주행거리:</span>
            <span className="text-white font-bold ml-3">{currentDist}m / {TOTAL_TRACK}m</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">탈선 위험도:</span>
            <span className={`font-bold ml-3 ${derailRisk > 60 ? 'text-red-500' : 'text-emerald-400'}`}>
              {derailRisk}%
            </span>
          </div>
          {isStationStop && (
            <div className="text-center text-amber-400 font-bold text-xs py-1 animate-pulse">
              승객 탑승 중...
            </div>
          )}
        </div>

        {/* Throttle & Brake Control Pad */}
        <div className="absolute bottom-6 right-6 flex flex-col items-center gap-3 pointer-events-auto">
          {/* Accelerator Level 1 & 2 */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                stateRef.current.throttle = 0.5;
                stateRef.current.brake = false;
              }}
              className="w-16 h-16 bg-blue-600 active:bg-blue-500 rounded-sm border border-blue-400 text-white font-bold text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center"
            >
              <span>가속</span>
              <span className="text-[10px] text-blue-200">순항</span>
            </button>
            <button
              onClick={() => {
                stateRef.current.throttle = 1.0;
                stateRef.current.brake = false;
              }}
              className="w-16 h-16 bg-sky-500 active:bg-sky-400 rounded-sm border border-sky-300 text-black font-bold text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center"
            >
              <span>풀가속</span>
              <span className="text-[10px] text-sky-900">MAX</span>
            </button>
          </div>

          {/* Emergency Brake */}
          <button
            onClick={() => {
              stateRef.current.throttle = 0;
              stateRef.current.brake = true;
            }}
            className="w-34 h-12 bg-red-600 active:bg-red-500 rounded-sm border border-red-400 text-white font-bold text-xs shadow-lg active:scale-95 flex items-center justify-center gap-1"
          >
            🛑 제동 (브레이크/정차)
          </button>
        </div>

        {/* Game Over Modal */}
        {gameOver && !gameWon && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-none text-center max-w-sm">
              <h2 className="text-xl font-bold text-red-400 mb-2">열차 탈선 사고!</h2>
              <p className="text-xs text-zinc-400 mb-4">급커브 구간에서 과속으로 인해 모노레일이 탈선했습니다.</p>
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
          gameTitle="Rail in the Air"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
