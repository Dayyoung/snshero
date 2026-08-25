import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface RunningEndlessMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const CANVAS_W = 360;
const CANVAS_H = 560;
const LANES = [-80, 0, 80];

interface Obstacle {
  lane: number;
  z: number;
  type: 'barrier' | 'coin';
}

export const RunningEndlessMission: React.FC<RunningEndlessMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);

  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_running_endless') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameRef = useRef({
    currentLane: 1, // 0: Left, 1: Center, 2: Right
    playerX: 0,
    playerY: 0,
    isJumping: false,
    jumpProgress: 0,
    speed: 12,
    distance: 0,
    coins: 0,
    obstacles: [] as Obstacle[],
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
  });

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.currentLane = 1;
    g.playerX = 0;
    g.playerY = 0;
    g.isJumping = false;
    g.jumpProgress = 0;
    g.speed = 12;
    g.distance = 0;
    g.coins = 0;
    g.obstacles = [
      { lane: 0, z: 200, type: 'coin' },
      { lane: 1, z: 300, type: 'barrier' },
      { lane: 2, z: 400, type: 'coin' }
    ];
    g.isGameOver = false;
    g.isVictory = false;
    g.startTime = Date.now();

    setScore(0);
    setCoins(0);
    setDistance(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const changeLane = (dir: -1 | 1) => {
    const g = gameRef.current;
    if (g.isGameOver || g.isPaused) return;

    const nextLane = Math.max(0, Math.min(2, g.currentLane + dir));
    if (nextLane !== g.currentLane) {
      g.currentLane = nextLane;
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const jump = () => {
    const g = gameRef.current;
    if (g.isGameOver || g.isPaused || g.isJumping) return;

    g.isJumping = true;
    g.jumpProgress = 0;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      animFrameRef.current = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const g = gameRef.current;
      if (g.isPaused || g.isGameOver) return;

      // Update Player Smooth Lane Movement
      const targetX = LANES[g.currentLane];
      g.playerX += (targetX - g.playerX) * 15 * dt;

      // Update Jump
      if (g.isJumping) {
        g.jumpProgress += dt * 3.5;
        g.playerY = Math.sin(g.jumpProgress * Math.PI) * 45;
        if (g.jumpProgress >= 1) {
          g.isJumping = false;
          g.playerY = 0;
        }
      }

      // Update Distance & Speed
      g.distance += Math.floor(g.speed * dt * 10);
      setDistance(g.distance);
      g.speed = Math.min(24, 12 + g.distance / 400);

      // Move Obstacles
      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const obs = g.obstacles[i];
        obs.z -= g.speed * 20 * dt;

        // Collision Check (when z near player)
        if (obs.z < 25 && obs.z > -15) {
          if (obs.lane === g.currentLane) {
            if (obs.type === 'coin') {
              g.coins += 1;
              setCoins(g.coins);
              setScore(s => s + 200);
              g.obstacles.splice(i, 1);
              playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
              continue;
            } else if (obs.type === 'barrier' && !g.isJumping) {
              // Crash!
              g.isGameOver = true;
              setIsGameOver(true);
              playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

              const duration = (Date.now() - g.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'mission_running_endless',
                gameTitle: '엔드리스 런 무한 질주',
                durationSeconds: duration,
                score: g.distance + g.coins * 200,
                difficulty: 'NIGHTMARE',
                isVictory: g.distance >= 1000
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
              return;
            }
          }
        }

        if (obs.z < -40) {
          g.obstacles.splice(i, 1);
        }
      }

      // Spawn Obstacles
      const maxZ = g.obstacles.length > 0 ? Math.max(...g.obstacles.map(o => o.z)) : 0;
      if (maxZ < 500) {
        const lane = Math.floor(Math.random() * 3);
        const type = Math.random() < 0.4 ? 'barrier' : 'coin';
        g.obstacles.push({ lane, z: maxZ + 90 + Math.random() * 60, type });
      }

      // Render
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Track Perspective
      ctx.fillStyle = '#fdfcfc';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // 3 Lanes Road
      ctx.fillStyle = '#f1eeee';
      ctx.beginPath();
      ctx.moveTo(CANVAS_W / 2 - 40, 100);
      ctx.lineTo(CANVAS_W / 2 + 40, 100);
      ctx.lineTo(CANVAS_W / 2 + 160, CANVAS_H);
      ctx.lineTo(CANVAS_W / 2 - 160, CANVAS_H);
      ctx.closePath();
      ctx.fill();

      // Lane dividers
      ctx.strokeStyle = 'rgba(15, 0, 0, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 15]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_W / 2 - 13, 100);
      ctx.lineTo(CANVAS_W / 2 - 53, CANVAS_H);
      ctx.moveTo(CANVAS_W / 2 + 13, 100);
      ctx.lineTo(CANVAS_W / 2 + 53, CANVAS_H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Render Obstacles (Sort by z desc)
      const sorted = [...g.obstacles].sort((a, b) => b.z - a.z);
      sorted.forEach(obs => {
        const perspective = Math.max(0.15, (500 - obs.z) / 500);
        const screenX = CANVAS_W / 2 + LANES[obs.lane] * perspective * 1.5;
        const screenY = 100 + (CANVAS_H - 140) * perspective;
        const size = 30 * perspective;

        if (obs.type === 'coin') {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(screenX, screenY, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#e11d48';
          ctx.fillRect(screenX - size * 0.6, screenY - size, size * 1.2, size);
        }
      });

      // Render Player (Hero)
      const px = CANVAS_W / 2 + g.playerX;
      const py = CANVAS_H - 80 - g.playerY;

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(px - 16, py - 32, 32, 32);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px - 10, py - 40, 20, 10);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [onReward, playSfx]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 3차선 무한 질주' : 'STEP 1: 3-LANE ENDLESS RUN',
      title: isKo ? '배리어 점프 & 코인 수집' : 'Jump Barriers & Collect Coins',
      description: isKo
        ? '3개 차선을 좌우로 변경하고 배리어를 뛰어넘으며 최대한 멀리 질주하세요.'
        : 'Shift across 3 lanes and jump hurdles to achieve maximum distance.',
      keyPoints: isKo
        ? [
            '1000M 돌파 시 대량 보상 정산',
            '배리어 충돌 시 게임 오버',
            '황금 코인 획득 시 보너스 점수 가산'
          ]
        : [
            'Reach 1000M for jackpot payout',
            'Crashing barriers causes game over',
            'Golden coins grant bonus points'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '좌우 스와이프 & 탭 점프' : 'Swipe Shift & Tap Jump',
      description: isKo
        ? '좌우 스와이프로 차선을 변경하고, 화면을 탭하여 즉시 도약 점프합니다.'
        : 'Swipe left/right to shift lanes, tap screen to jump hurdles.',
      keyPoints: isKo
        ? [
            '👈👉 좌우 스와이프: 3차선 신속 이동',
            '👆 화면 탭 / 위로 스와이프: 배리어 점프',
            '⚡ 60FPS 부드러운 3D 원근 렌더링'
          ]
        : [
            '👈👉 Swipe: Quick 3-lane shift',
            '👆 Tap / Swipe Up: High hurdle jump',
            '⚡ 60FPS fluid 3D perspective'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '질주 종료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon run finish.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '질주 거리 및 코인 수집 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Distance and coin collection multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '엔드리스 런' : 'Endless Run'}
        language={language}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distance}M`, color: 'text-cyan-700 font-bold' },
          { label: isKo ? '코인' : 'Coin', value: `${coins}`, color: 'text-amber-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Runner Viewport */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm touch-none select-none cursor-pointer"
        style={{ touchAction: 'none' }}
        onTouchStart={(e) => {
          touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          if (!touchStartRef.current) return;
          const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
          const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
            changeLane(dx > 0 ? 1 : -1);
          } else if (dy < -20 || (Math.abs(dx) < 15 && Math.abs(dy) < 15)) {
            jump();
          }
          touchStartRef.current = null;
        }}
        onClick={jump}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="border border-[rgba(15,0,0,0.15)] shadow-xs rounded-none bg-white w-full h-full max-h-[70vh] object-contain"
        />
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '좌우 스와이프: 차선 변경 | 탭 / 위로 스와이프: 점프' : 'Swipe Left/Right: Shift | Tap/Swipe Up: Jump'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_running_endless"
          gameTitle={isKo ? '엔드리스 런: 무한 질주 미션' : 'Endless Run: Infinite Sprint'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default RunningEndlessMission;
