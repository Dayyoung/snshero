import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';
import { drawCardSprite } from '../lib/canvasCardRenderer';

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
  monsterId: number;
}

export const TrexRunnerGame: React.FC<TrexRunnerGameProps> = ({
  deck = [],
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

  // Player hero card ID from deck
  const playerHeroId = deck[0]?.id || 1;

  const gameRef = useRef({
    py: GROUND_Y - 36,
    vy: 0,
    isJumping: false,
    jumpCount: 0,
    speed: 5.5,
    score: 0,
    obstacles: [] as Obstacle[],
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    lastObstacleX: CANVAS_W,
    runAnimTick: 0,
  });

  const jump = () => {
    const g = gameRef.current;
    if (g.isGameOver || g.isPaused) return;

    if (g.jumpCount < 2) {
      g.vy = -12.5;
      g.jumpCount += 1;
      g.isJumping = true;
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.py = GROUND_Y - 36;
    g.vy = 0;
    g.isJumping = false;
    g.jumpCount = 0;
    g.speed = 5.5;
    g.score = 0;
    g.obstacles = [{ x: CANVAS_W + 100, w: 28, h: 36, monsterId: 8 }];
    g.isGameOver = false;
    g.isVictory = false;
    g.startTime = Date.now();
    g.lastObstacleX = CANVAS_W + 100;
    g.runAnimTick = 0;

    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Keyboard Jump
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main 60FPS Game Loop
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

      // Physics & Gravity
      g.vy += 28 * dt; // Gravity
      g.py += g.vy;

      if (g.py >= GROUND_Y - 36) {
        g.py = GROUND_Y - 36;
        g.vy = 0;
        g.isJumping = false;
        g.jumpCount = 0;
      }

      // Speed progression
      g.speed = 5.5 + Math.min(6, g.score / 200);
      g.score += Math.floor(g.speed * 0.4);
      setScore(g.score);

      g.runAnimTick += dt * 15;

      // Move & Check Obstacles
      const playerX = 40;
      const playerY = g.py;
      const playerW = 32;
      const playerH = 32;

      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const obs = g.obstacles[i];
        obs.x -= g.speed;

        // Collision Check
        if (
          playerX + playerW > obs.x + 4 &&
          playerX < obs.x + obs.w - 4 &&
          playerY + playerH > GROUND_Y - obs.h + 4
        ) {
          // Crash!
          g.isGameOver = true;
          setIsGameOver(true);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

          const duration = (Date.now() - g.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'arcade_trex',
            gameTitle: '히어로 카드 러너',
            durationSeconds: duration,
            score: g.score,
            difficulty: 'HARD',
            isVictory: g.score >= 1000,
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          return;
        }

        if (obs.x < -40) {
          g.obstacles.splice(i, 1);
        }
      }

      // Spawn Obstacles
      const lastX = g.obstacles.length > 0 ? g.obstacles[g.obstacles.length - 1].x : 0;
      if (lastX < CANVAS_W - 140 && Math.random() < 0.055) {
        const monsterPool = [6, 8, 12, 18, 24, 30, 45, 52, 68];
        const randomMonster = monsterPool[Math.floor(Math.random() * monsterPool.length)];
        const isFlying = Math.random() < 0.25;

        g.obstacles.push({
          x: CANVAS_W + 20,
          w: isFlying ? 32 : 28 + Math.random() * 8,
          h: isFlying ? 65 : 30 + Math.random() * 15,
          monsterId: randomMonster,
        });
      }

      // ── Render Frame ──
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#f8fafc');
      skyGrad.addColorStop(0.7, '#f1f5f9');
      skyGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Ground Line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_W, GROUND_Y);
      ctx.stroke();

      // Ground Details / Track Dots
      ctx.fillStyle = '#94a3b8';
      for (let dotX = ((-g.score * 2) % 30); dotX < CANVAS_W; dotX += 30) {
        ctx.fillRect(dotX, GROUND_Y + 6, 8, 2);
      }

      // Render Obstacles (Card Monsters from cards1.png / cards2.png)
      g.obstacles.forEach((obs) => {
        drawCardSprite(
          ctx,
          obs.monsterId,
          obs.x,
          GROUND_Y - obs.h,
          obs.w,
          obs.w,
          {
            roundedRadius: 6,
            borderWidth: 1.5,
            borderColor: '#ef4444',
            shadowBlur: 6,
            shadowColor: 'rgba(239, 68, 68, 0.4)',
          }
        );
      });

      // Render Player Hero (Cards1 / Cards2 Sprite Sheet Character)
      const bobbingY = g.isJumping ? 0 : Math.sin(g.runAnimTick) * 2;
      drawCardSprite(
        ctx,
        playerHeroId,
        playerX - 2,
        playerY - 2 + bobbingY,
        playerW + 4,
        playerH + 4,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#0284c7',
          shadowBlur: 10,
          shadowColor: 'rgba(2, 132, 199, 0.5)',
          rotation: g.isJumping ? (g.vy * 0.04) : 0,
        }
      );
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [onReward, playSfx, playerHeroId]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 1000M 카드 히어로 무한 질주' : 'STEP 1: 1000M CARD HERO RUN',
      title: isKo ? '카드 영웅으로 몬스터를 2단 점프 회피하세요' : 'Dodge Monster Obstacles with Double Jump',
      description: isKo
        ? '내 덱의 대표 카드 영웅이 질주하며 다가오는 카드 몬스터들을 2단 점프로 피하며 1000m 이상 완주하세요.'
        : 'Your card hero sprints across the plains, double jumping over incoming monster cards to reach 1000m.',
      keyPoints: isKo
        ? [
            '1000m 이상 질주 시 NIGHTMARE 승리 보상',
            '몬스터 충돌 시 즉시 게임 오버',
            '거리가 늘어날수록 질주 속도 상승'
          ]
        : [
            'Reach 1000m for guaranteed Nightmare rewards',
            'Colliding with monsters ends the run',
            'Running speed escalates with distance'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 어디든 원터치 탭/더블탭' : 'Tap Screen Anywhere',
      description: isKo
        ? '버튼 없이 화면 아무 곳이나 탭하여 도약하고, 공중에서 한 번 더 탭해 2단 점프합니다.'
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
        ? '완주 즉시 점수에 비례하여 확정 SNS 포인트가 로컬스토리지 지갑에 안전하게 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '질주 거리(m) 및 속도 비례 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Distance sprint multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '히어로 카드 러너' : 'Hero Card Runner'}
        language={language}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${score}m`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '목표' : 'Goal', value: '1000m', color: 'text-cyan-200' },
          { label: isKo ? '상태' : 'State', value: gameRef.current.isJumping ? 'JUMP' : 'RUN', color: 'text-emerald-400' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Main Touch Canvas */}
      <div 
        className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2 cursor-pointer"
        onPointerDown={jump}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full object-contain touch-none shadow-2xl rounded-sm"
        />
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-200 font-mono">
          {isKo ? '화면 어디든 탭하여 점프 / 공중에서 더블 탭으로 2단 점프' : 'Tap anywhere to jump / Double tap for 2-stage air jump'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_trex"
          gameTitle={isKo ? '히어로 카드 러너: 무한 질주' : 'Hero Card Runner: Sprint'}
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
