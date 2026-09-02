import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';
import { drawCardSprite } from '../lib/canvasCardRenderer';

interface CardJumperGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const CANVAS_W = 360;
const CANVAS_H = 640;
const PLAYER_W = 34;
const PLAYER_H = 34;
const PLATFORM_W = 64;
const PLATFORM_H = 14;
const GRAVITY = 0.42;
const JUMP_VELOCITY = -11.5;

interface Platform {
  x: number;
  y: number;
  w: number;
  hasCoin: boolean;
  coinCollected: boolean;
}

export const CardJumperGame: React.FC<CardJumperGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 11;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_jumper') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState(false);
  const [hudScore, setHudScore] = useState(0);
  const [hudHeight, setHudHeight] = useState(0);
  const targetHeight = 500;
  const [isGameOver, setIsGameOver] = useState(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameRef = useRef({
    playerX: CANVAS_W / 2,
    playerY: CANVAS_H - 120,
    playerVY: JUMP_VELOCITY,
    steerDir: 0,
    platforms: [] as Platform[],
    cameraY: 0,
    score: 0,
    bestHeight: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
  });

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.playerX = CANVAS_W / 2;
    g.playerY = CANVAS_H - 120;
    g.playerVY = JUMP_VELOCITY;
    g.steerDir = 0;
    g.score = 0;
    g.bestHeight = 0;
    g.cameraY = 0;
    g.isGameOver = false;
    g.isVictory = false;
    g.startTime = Date.now();

    const plats: Platform[] = [
      { x: CANVAS_W / 2 - PLATFORM_W / 2, y: CANVAS_H - 80, w: PLATFORM_W, hasCoin: false, coinCollected: false }
    ];

    for (let y = CANVAS_H - 160; y > -CANVAS_H * 5; y -= 75) {
      plats.push({
        x: Math.random() * (CANVAS_W - PLATFORM_W - 20) + 10,
        y,
        w: PLATFORM_W,
        hasCoin: Math.random() < 0.35,
        coinCollected: false
      });
    }

    g.platforms = plats;
    setHudScore(0);
    setHudHeight(0);
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

      // Player Movement
      g.playerX += g.steerDir * 240 * dt;
      if (g.playerX < 0) g.playerX = CANVAS_W;
      if (g.playerX > CANVAS_W) g.playerX = 0;

      // Gravity & Jump Physics
      g.playerVY += GRAVITY;
      g.playerY += g.playerVY;

      // Platform Collisions (only when falling)
      if (g.playerVY > 0) {
        for (const p of g.platforms) {
          if (
            g.playerX + PLAYER_W / 2 >= p.x &&
            g.playerX - PLAYER_W / 2 <= p.x + p.w &&
            g.playerY + PLAYER_H / 2 >= p.y &&
            g.playerY + PLAYER_H / 2 <= p.y + PLATFORM_H + 8
          ) {
            g.playerVY = JUMP_VELOCITY;
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            break;
          }
        }
      }

      // Coin Pickups
      for (const p of g.platforms) {
        if (p.hasCoin && !p.coinCollected) {
          if (Math.hypot(g.playerX - (p.x + p.w / 2), g.playerY - (p.y - 15)) < 24) {
            p.coinCollected = true;
            g.score += 200;
            setHudScore(g.score);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }
        }
      }

      // Camera Tracking
      const targetCamY = CANVAS_H / 2 - g.playerY;
      if (targetCamY > g.cameraY) {
        g.cameraY = targetCamY;
        const currentHeightM = Math.round(g.cameraY / 10);
        if (currentHeightM > g.bestHeight) {
          g.bestHeight = currentHeightM;
          setHudHeight(g.bestHeight);
        }
      }

      // Fall Below Camera -> Game Over (screenY = g.playerY + g.cameraY)
      const screenPlayerY = g.playerY + g.cameraY;
      if (screenPlayerY > CANVAS_H + 20 && !g.isGameOver) {
        g.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - g.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: '2d_card_jumper',
          gameTitle: '2D 카드 점퍼 스카이',
          durationSeconds: duration,
          score: g.score + g.bestHeight * 10,
          difficulty: 'HARD',
          isVictory: false
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }

      // Height Victory Check
      if (g.bestHeight >= targetHeight && !g.isGameOver) {
        g.isVictory = true;
        g.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - g.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: '2d_card_jumper',
          gameTitle: '2D 카드 점퍼 스카이',
          durationSeconds: duration,
          score: g.score + 2500,
          difficulty: 'HARD',
          isVictory: true
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }

      // Render
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Sky Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.save();
      ctx.translate(0, g.cameraY);

      // Render Platforms & Coins
      for (const p of g.platforms) {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(p.x, p.y, p.w, PLATFORM_H);

        if (p.hasCoin && !p.coinCollected) {
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(p.x + p.w / 2, p.y - 12, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render Player (Card Hero from cards1.png / cards2.png)
      drawCardSprite(
        ctx,
        playerHeroId,
        g.playerX - PLAYER_W / 2,
        g.playerY - PLAYER_H / 2,
        PLAYER_W,
        PLAYER_H,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#f43f5e',
          shadowBlur: 10,
          shadowColor: 'rgba(244, 63, 94, 0.6)',
          rotation: g.playerVY * 0.03,
        }
      );

      ctx.restore();
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [playSfx, onReward, playerHeroId]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 500m 천공 도약' : 'STEP 1: SKY JUMP',
      title: isKo ? '500m 고도 도달 & 코인 수집' : 'Reach 500m & Collect Coins',
      description: isKo
        ? '발판을 연속으로 밟고 위로 도약하며 500m 천공 정상에 도달하세요.'
        : 'Bounce continuously across floating platforms to reach 500m height.',
      keyPoints: isKo
        ? [
            '500m 고도 도달 시 승리',
            '발판 밖으로 추락 시 게임 오버',
            '황금 코인 획득 시 +200P 보너스'
          ]
        : [
            'Reach 500m to win',
            'Falling off camera causes game over',
            'Collect gold coins for +200P'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '좌우 화면 탭 & 드래그 조향' : 'Tap & Drag Steering',
      description: isKo
        ? '가상 버튼 없이 화면 좌측/우측을 탭하거나 드래그하여 영웅의 도약 방향을 조향합니다.'
        : 'Tap or drag left/right screen to steer hero with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 좌우 화면 터치/드래그: 수평 이동 조향',
            '⚡ 화면 끝 통과 시 반대편으로 루프 이동',
            '💫 자동 점프 메커니즘'
          ]
        : [
            '👆 Tap/Drag L/R: Horizontal steering',
            '⚡ Screen edge wrap-around loop',
            '💫 Automatic jump bounce mechanism'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '정상 도달 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon reaching target height.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '도달 높이 및 수집 코인 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Height and coin bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '2D 카드 점퍼' : '2D Card Jumper'}
        language={language}
        telemetries={[
          { label: isKo ? '높이' : 'Height', value: `${hudHeight}m/${targetHeight}m`, color: hudHeight >= targetHeight ? 'text-emerald-700 font-bold' : 'text-cyan-700 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${hudScore}P`, color: 'text-amber-600 font-bold' }
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
              const rect = e.currentTarget.getBoundingClientRect();
              const normX = (e.clientX - rect.left) / rect.width;
              gameRef.current.steerDir = normX < 0.5 ? -1 : 1;
            }}
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const normX = (e.clientX - rect.left) / rect.width;
              gameRef.current.steerDir = normX < 0.5 ? -1 : 1;
            }}
            onPointerUp={() => {
              gameRef.current.steerDir = 0;
            }}
          />
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '화면 좌우 탭/드래그: 도약 방향 조향 (버튼 없음)' : 'Tap/Drag L/R: Steer jump bounce (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_jumper"
          gameTitle={isKo ? '2D 카드 점퍼 스카이' : '2D Card Jumper Sky'}
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
export default CardJumperGame;
