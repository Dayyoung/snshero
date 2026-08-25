import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';
import { drawCardSprite } from '../lib/canvasCardRenderer';

interface BreakoutGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const CANVAS_W = 360;
const CANVAS_H = 540;
const PADDLE_W = 70;
const PADDLE_H = 10;
const BALL_R = 5;
const BRICK_ROWS = 5;
const BRICK_COLS = 6;
const BRICK_W = 52;
const BRICK_H = 18;

interface Brick {
  x: number;
  y: number;
  monsterId: number;
  alive: boolean;
}

export const BreakoutGame: React.FC<BreakoutGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 19;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [remainingBricks, setRemainingBricks] = useState(BRICK_ROWS * BRICK_COLS);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcade_breakout') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameRef = useRef({
    paddleX: CANVAS_W / 2,
    ballX: CANVAS_W / 2,
    ballY: CANVAS_H - 60,
    ballVX: 3.5,
    ballVY: -4.5,
    started: false,
    bricks: [] as Brick[],
    lives: 3,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
  });

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.paddleX = CANVAS_W / 2;
    g.ballX = CANVAS_W / 2;
    g.ballY = CANVAS_H - 60;
    g.ballVX = 3.5 * (Math.random() > 0.5 ? 1 : -1);
    g.ballVY = -4.5;
    g.started = false;
    g.lives = 3;
    g.score = 0;
    g.isGameOver = false;
    g.isVictory = false;
    g.startTime = Date.now();

    const bricks: Brick[] = [];
    const monsterPool = [4, 7, 13, 16, 22, 28, 35, 41, 49, 58];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: 18 + c * (BRICK_W + 5),
          y: 40 + r * (BRICK_H + 6),
          monsterId: monsterPool[(r * BRICK_COLS + c) % monsterPool.length],
          alive: true,
        });
      }
    }
    g.bricks = bricks;

    setScore(0);
    setLives(3);
    setRemainingBricks(bricks.length);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

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

      if (g.started) {
        // Move Ball
        g.ballX += g.ballVX * 60 * dt;
        g.ballY += g.ballVY * 60 * dt;

        // Wall collisions
        if (g.ballX - BALL_R <= 0) {
          g.ballX = BALL_R;
          g.ballVX = Math.abs(g.ballVX);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }
        if (g.ballX + BALL_R >= CANVAS_W) {
          g.ballX = CANVAS_W - BALL_R;
          g.ballVX = -Math.abs(g.ballVX);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }
        if (g.ballY - BALL_R <= 0) {
          g.ballY = BALL_R;
          g.ballVY = Math.abs(g.ballVY);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }

        // Paddle Collision
        const paddleY = CANVAS_H - 30;
        if (
          g.ballY + BALL_R >= paddleY &&
          g.ballY - BALL_R <= paddleY + PADDLE_H &&
          g.ballX >= g.paddleX - PADDLE_W / 2 &&
          g.ballX <= g.paddleX + PADDLE_W / 2
        ) {
          g.ballVY = -Math.abs(g.ballVY);
          const hitOffset = (g.ballX - g.paddleX) / (PADDLE_W / 2);
          g.ballVX = hitOffset * 4.5;
          playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }

        // Brick Collisions
        let aliveCount = 0;
        for (const b of g.bricks) {
          if (b.alive) {
            aliveCount++;
            if (
              g.ballX + BALL_R >= b.x &&
              g.ballX - BALL_R <= b.x + BRICK_W &&
              g.ballY + BALL_R >= b.y &&
              g.ballY - BALL_R <= b.y + BRICK_H
            ) {
              b.alive = false;
              g.ballVY = -g.ballVY;
              g.score += 100;
              setScore(g.score);
              playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
              break;
            }
          }
        }
        setRemainingBricks(aliveCount);

        // Win Check
        if (aliveCount === 0 && !g.isGameOver) {
          g.isVictory = true;
          g.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - g.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'arcade_breakout',
            gameTitle: '클래식 벽돌깨기',
            durationSeconds: duration,
            score: g.score + 2500,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }

        // Ball Drop below Paddle
        if (g.ballY > CANVAS_H + 20) {
          g.lives -= 1;
          setLives(g.lives);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

          if (g.lives <= 0) {
            g.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - g.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'arcade_breakout',
              gameTitle: '클래식 벽돌깨기',
              durationSeconds: duration,
              score: g.score,
              difficulty: 'HARD',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          } else {
            g.ballX = g.paddleX;
            g.ballY = CANVAS_H - 60;
            g.ballVY = -4.5;
            g.started = false;
          }
        }
      }

      // Render
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Bricks (Card Monsters from cards1.png / cards2.png)
      for (const b of g.bricks) {
        if (b.alive) {
          drawCardSprite(
            ctx,
            b.monsterId,
            b.x,
            b.y,
            BRICK_W,
            BRICK_H,
            {
              roundedRadius: 4,
              borderWidth: 1,
              borderColor: '#0284c7',
              shadowBlur: 4,
              shadowColor: 'rgba(2, 132, 199, 0.4)',
            }
          );
        }
      }

      // Paddle Platform
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(g.paddleX - PADDLE_W / 2, CANVAS_H - 24, PADDLE_W, PADDLE_H);

      // Paddle Hero (Card Hero Sprite)
      drawCardSprite(
        ctx,
        playerHeroId,
        g.paddleX - 16,
        CANVAS_H - 44,
        32,
        32,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#f43f5e',
          shadowBlur: 8,
          shadowColor: 'rgba(244, 63, 94, 0.6)',
        }
      );

      // Ball
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(g.ballX, g.ballY, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [onReward, playSfx, playerHeroId]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 전 벽돌 완파' : 'STEP 1: CLEAR BRICKS',
      title: isKo ? '바운스 볼로 모든 벽돌 격파' : 'Break All Grid Bricks',
      description: isKo
        ? '패들을 움직여 바운스 볼을 튕겨내고 상단의 모든 블록을 격파하세요.'
        : 'Bounce the ball with your paddle to smash all bricks.',
      keyPoints: isKo
        ? [
            '모든 벽돌 완파 시 즉시 승리',
            '바운스 볼 낙하 방지 (라이프 3회)',
            '패들 타격 위치에 따른 앵글 반사'
          ]
        : [
            'Clear all bricks to win',
            'Keep ball from dropping (3 lives)',
            'Angle rebounds based on paddle hit position'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 좌우 드래그 패들 이동' : 'Drag Screen to Steer Paddle',
      description: isKo
        ? '화면을 좌우로 드래그하여 패들을 자유롭게 이동시키고 볼을 튕겨냅니다.'
        : 'Drag anywhere left/right to move paddle with precision touch.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 실시간 패들 포지셔닝',
            '⚡ 탭: 서브 볼 발사',
            '💫 즉각적인 물리 반사'
          ]
        : [
            '👆 Drag L/R: Real-time paddle positioning',
            '⚡ Tap: Launch ball',
            '💫 Instant physics bounce'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '벽돌 완파 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon victory.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 라이프 및 완파 속도 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining lives and speed bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '클래식 벽돌깨기' : 'Classic Breakout'}
        language={language}
        telemetries={[
          { label: isKo ? '벽돌' : 'Bricks', value: `${remainingBricks}`, color: 'text-cyan-700 font-bold' },
          { label: isKo ? '라이프' : 'Lives', value: '❤️'.repeat(Math.max(0, lives)), color: 'text-rose-600' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Canvas Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full max-h-[70vh] object-contain border border-[rgba(15,0,0,0.12)] bg-white rounded-none shadow-none"
        />

        {/* Pure Gesture Touch Overlay */}
        {!isGameOver && !isPaused && !showTutorial && (
          <div
            className="absolute inset-0 z-10 select-none touch-none cursor-pointer"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
              const g = gameRef.current;
              if (!g.started) g.started = true;
              const rect = e.currentTarget.getBoundingClientRect();
              const normX = (e.clientX - rect.left) / rect.width;
              g.paddleX = normX * CANVAS_W;
            }}
            onPointerMove={(e) => {
              const g = gameRef.current;
              const rect = e.currentTarget.getBoundingClientRect();
              const normX = (e.clientX - rect.left) / rect.width;
              g.paddleX = Math.max(PADDLE_W / 2, Math.min(CANVAS_W - PADDLE_W / 2, normX * CANVAS_W));
            }}
          />
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '화면 좌우 드래그: 패들 이동 | 탭: 볼 발사 (버튼 없음)' : 'Drag Screen L/R: Move Paddle | Tap: Launch Ball (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_breakout"
          gameTitle={isKo ? '클래식 벽돌깨기: 아케이드 브레이크' : 'Classic Breakout: Arcade Smash'}
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
          onPlayAgain={startGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default BreakoutGame;
