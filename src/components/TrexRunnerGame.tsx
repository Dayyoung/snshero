import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface TrexRunnerGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const CANVAS_W = 360;
const CANVAS_H = 480;
const GROUND_Y = CANVAS_H - 80;

interface Obstacle {
  x: number;
  w: number;
  h: number;
}

export const TrexRunnerGame: React.FC<TrexRunnerGameProps> = ({
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
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcade_trex') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameRef = useRef({
    py: GROUND_Y - 30,
    vy: 0,
    isJumping: false,
    jumpCount: 0,
    speed: 5,
    score: 0,
    obstacles: [] as Obstacle[],
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    lastObstacleX: CANVAS_W,
  });

  const jump = () => {
    const g = gameRef.current;
    if (g.isGameOver || g.isPaused) return;

    if (g.jumpCount < 2) {
      g.vy = -12;
      g.jumpCount += 1;
      g.isJumping = true;
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.py = GROUND_Y - 30;
    g.vy = 0;
    g.isJumping = false;
    g.jumpCount = 0;
    g.speed = 5;
    g.score = 0;
    g.obstacles = [{ x: CANVAS_W + 100, w: 20, h: 35 }];
    g.isGameOver = false;
    g.isVictory = false;
    g.startTime = Date.now();
    g.lastObstacleX = CANVAS_W + 100;

    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Game Loop
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

      // Update Physics
      g.vy += 28 * dt;
      g.py += g.vy * 60 * dt;

      if (g.py >= GROUND_Y - 30) {
        g.py = GROUND_Y - 30;
        g.vy = 0;
        g.isJumping = false;
        g.jumpCount = 0;
      }

      // Update Score & Speed
      g.score += Math.floor(g.speed * dt * 10);
      setScore(g.score);
      g.speed = Math.min(12, 5 + g.score / 500);

      // Move Obstacles
      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const obs = g.obstacles[i];
        obs.x -= g.speed * 60 * dt;

        // Collision Check
        const px = 40;
        const py = g.py;
        const pw = 30;
        const ph = 30;

        if (
          px < obs.x + obs.w &&
          px + pw > obs.x &&
          py < GROUND_Y &&
          py + ph > GROUND_Y - obs.h
        ) {
          // Crash!
          g.isGameOver = true;
          setIsGameOver(true);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

          const duration = (Date.now() - g.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'arcade_trex',
            gameTitle: 'T-REX 무한 러너',
            durationSeconds: duration,
            score: g.score,
            difficulty: 'HARD',
            isVictory: g.score >= 1000
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          return;
        }

        if (obs.x < -30) {
          g.obstacles.splice(i, 1);
        }
      }

      // Spawn Obstacles
      const lastX = g.obstacles.length > 0 ? g.obstacles[g.obstacles.length - 1].x : 0;
      if (lastX < CANVAS_W - 140 && Math.random() < 0.05) {
        g.obstacles.push({
          x: CANVAS_W + 20,
          w: 20 + Math.random() * 10,
          h: 25 + Math.random() * 25,
        });
      }

      // Render
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background
      ctx.fillStyle = '#fdfcfc';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Ground
      ctx.strokeStyle = '#201d1d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_W, GROUND_Y);
      ctx.stroke();

      // Render Obstacles
      ctx.fillStyle = '#201d1d';
      g.obstacles.forEach(obs => {
        ctx.fillRect(obs.x, GROUND_Y - obs.h, obs.w, obs.h);
      });

      // Render T-Rex Player
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(40, g.py, 30, 30);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [onReward, playSfx]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 1000M 무한 질주' : 'STEP 1: 1000M ENDLESS RUN',
      title: isKo ? '선인장 장애물 2단 점프 회피' : 'Dodge Cacti with Double Jump',
      description: isKo
        ? '다가오는 선인장 장애물을 타이밍에 맞춰 점프 및 2단 점프로 피하며 1000m 이상 질주하세요.'
        : 'Jump over approaching cacti hurdles and double jump to reach 1000m.',
      keyPoints: isKo
        ? [
            '1000m 이상 도달 시 승리 보너스',
            '장애물 충돌 시 즉시 게임 오버',
            '거리가 늘어날수록 질주 속도 점진적 상승'
          ]
        : [
            'Reach 1000m for victory payout',
            'Hitting obstacles causes game over',
            'Running speed increases with distance'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 어디든 탭/더블탭' : 'Tap Screen Anywhere',
      description: isKo
        ? '버튼 없이 화면 아무 곳이나 원터치 탭하여 점프하고, 공중에서 한 번 더 탭하여 2단 점프합니다.'
        : 'Tap screen anywhere to jump, tap again in mid-air for a double jump.',
      keyPoints: isKo
        ? [
            '👆 1회 탭: 기본 점프',
            '👆👆 공중 2회 탭: 2단 체공 도약',
            '⚡ 60FPS 부드러운 물리 가속도'
          ]
        : [
            '👆 Tap once: Standard jump',
            '👆👆 Double tap: High double jump',
            '⚡ 60FPS fluid gravity physics'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '러닝 종료 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon runner exit.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '도달 거리(M) 비례 고득점 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Distance multipliers and bonus payouts',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? 'T-REX 러너' : 'T-Rex Runner'}
        language={language}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${score}M`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '속도' : 'Speed', value: `${gameRef.current.speed.toFixed(1)}x`, color: 'text-cyan-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Runner Viewport */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm cursor-pointer touch-none select-none"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          e.preventDefault();
          jump();
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="border border-[rgba(15,0,0,0.15)] shadow-xs rounded-none bg-white w-full h-full max-h-[65vh] object-contain"
        />
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '화면 어디든 탭하여 점프 / 공중에서 다시 탭하여 2단 점프' : 'Tap screen to jump / Double tap for high jump'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_trex"
          gameTitle={isKo ? 'T-REX 무한 러너: 공룡 점프' : 'T-Rex Endless Runner'}
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
export default TrexRunnerGame;
