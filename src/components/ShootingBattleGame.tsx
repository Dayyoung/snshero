import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface ShootingBattleGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const CANVAS_W = 360;
const CANVAS_H = 560;

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy: boolean;
}

interface Enemy {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  cardId: number;
}

export const ShootingBattleGame: React.FC<ShootingBattleGameProps> = ({
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
  const [playerHp, setPlayerHp] = useState(100);
  const [wave, setWave] = useState(1);
  const maxWaves = 5;
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcade_shooting') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameRef = useRef({
    px: CANVAS_W / 2,
    py: CANVAS_H - 60,
    hp: 100,
    score: 0,
    wave: 1,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    lastShootTime: 0,
  });

  const touchRef = useRef({ active: false, x: CANVAS_W / 2, y: CANVAS_H - 60 });

  const spawnWave = useCallback((w: number) => {
    const enemies: Enemy[] = [];
    const count = 4 + w * 2;
    for (let i = 0; i < count; i++) {
      enemies.push({
        x: 30 + (i % 5) * 65,
        y: 40 + Math.floor(i / 5) * 55,
        hp: 20 + w * 10,
        maxHp: 20 + w * 10,
        cardId: (i % 110) + 1,
      });
    }
    gameRef.current.enemies = enemies;
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.px = CANVAS_W / 2;
    g.py = CANVAS_H - 60;
    g.hp = 100;
    g.score = 0;
    g.wave = 1;
    g.bullets = [];
    g.isGameOver = false;
    g.isVictory = false;
    g.startTime = Date.now();

    setScore(0);
    setPlayerHp(100);
    setWave(1);
    setIsGameOver(false);
    setSettlementReceipt(null);
    spawnWave(1);
  }, [spawnWave]);

  useEffect(() => {
    startGame();
  }, [startGame]);

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

      // Player Follow Touch
      if (touchRef.current.active) {
        g.px += (touchRef.current.x - g.px) * 12 * dt;
        g.py += (touchRef.current.y - g.py) * 12 * dt;
        g.px = Math.max(20, Math.min(CANVAS_W - 20, g.px));
        g.py = Math.max(60, Math.min(CANVAS_H - 30, g.py));
      }

      // Auto Shooting Player Bullets
      if (now - g.lastShootTime > 180) {
        g.lastShootTime = now;
        g.bullets.push({ x: g.px - 8, y: g.py - 15, vx: 0, vy: -12, isEnemy: false });
        g.bullets.push({ x: g.px + 8, y: g.py - 15, vx: 0, vy: -12, isEnemy: false });
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }

      // Update Bullets
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        const b = g.bullets[i];
        b.x += b.vx * 60 * dt;
        b.y += b.vy * 60 * dt;

        if (!b.isEnemy) {
          // Check hit enemies
          for (let j = g.enemies.length - 1; j >= 0; j--) {
            const e = g.enemies[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < 22) {
              e.hp -= 20;
              g.bullets.splice(i, 1);
              g.score += 50;
              setScore(g.score);
              playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

              if (e.hp <= 0) {
                g.enemies.splice(j, 1);
                g.score += 150;
                setScore(g.score);
              }
              break;
            }
          }
        } else {
          // Check hit player
          if (Math.hypot(b.x - g.px, b.y - g.py) < 16) {
            g.hp -= 15;
            setPlayerHp(Math.max(0, g.hp));
            g.bullets.splice(i, 1);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

            if (g.hp <= 0) {
              g.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - g.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'arcade_shooting',
                gameTitle: '스페이스 슈팅 배틀',
                durationSeconds: duration,
                score: g.score,
                difficulty: 'NIGHTMARE',
                isVictory: false
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }
        }

        if (b.y < -10 || b.y > CANVAS_H + 10) {
          g.bullets.splice(i, 1);
        }
      }

      // Enemy AI Shooting
      if (Math.random() < 0.04 && g.enemies.length > 0) {
        const randE = g.enemies[Math.floor(Math.random() * g.enemies.length)];
        g.bullets.push({ x: randE.x, y: randE.y + 15, vx: 0, vy: 5, isEnemy: true });
      }

      // Wave Clear Check
      if (g.enemies.length === 0 && !g.isGameOver) {
        if (g.wave < maxWaves) {
          g.wave += 1;
          setWave(g.wave);
          spawnWave(g.wave);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        } else {
          g.isVictory = true;
          g.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - g.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'arcade_shooting',
            gameTitle: '스페이스 슈팅 배틀',
            durationSeconds: duration,
            score: g.score + 3000,
            difficulty: 'NIGHTMARE',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
      }

      // Render
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Space Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Draw Bullets
      g.bullets.forEach(b => {
        ctx.fillStyle = b.isEnemy ? '#f43f5e' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.isEnemy ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Enemies
      g.enemies.forEach(e => {
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(e.x - 14, e.y - 14, 28, 28);
        ctx.fillStyle = '#fecdd3';
        ctx.fillRect(e.x - 14, e.y - 18, 28 * (e.hp / e.maxHp), 3);
      });

      // Draw Player
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(g.px, g.py - 18);
      ctx.lineTo(g.px - 14, g.py + 14);
      ctx.lineTo(g.px + 14, g.py + 14);
      ctx.closePath();
      ctx.fill();
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [onReward, playSfx, spawnWave]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 5개 웨이브 전원 격추' : 'STEP 1: 5 WAVES DOGFIGHT',
      title: isKo ? '적 편대 섬멸 & 탄막 회피' : 'Eliminate Enemy Formations',
      description: isKo
        ? '화면을 드래그하여 기체를 조종하고 5개 웨이브의 적 함대를 전원 격추하세요.'
        : 'Drag screen to pilot starfighter and destroy 5 waves of enemy invaders.',
      keyPoints: isKo
        ? [
            '5개 웨이브 격추 성공 시 완승',
            '적 탄막 피탄 시 HP 차감',
            '자동 연사 플라즈마 캐논 탑재'
          ]
        : [
            'Clear 5 waves to win',
            'Avoid enemy plasma bullets',
            'Equipped with auto-firing plasma cannon'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 360° 드래그 기동' : 'Drag Screen to Fly',
      description: isKo
        ? '가상 버튼 없이 손가락을 대고 드래그하면 기체가 부드럽게 추종합니다.'
        : 'Drag anywhere to steer starfighter smoothly with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 전방위 정밀 비행 기동',
            '⚡ 100% 자동 사격 시스템',
            '💫 실시간 탄막 탄도 물리'
          ]
        : [
            '👆 Drag: Smooth 360° flight control',
            '⚡ 100% Automatic fire system',
            '💫 Real-time projectile physics'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '5개 웨이브 섬멸 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon victory.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '격추 점수 및 잔여 HP 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Score and remaining HP multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '스페이스 슈팅' : 'Space Shooting'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '웨이브' : 'Wave', value: `${wave}/${maxWaves}`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-cyan-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Canvas Arena Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full max-h-[70vh] object-contain border border-slate-800 bg-slate-950 rounded-none shadow-xl"
        />

        {/* Pure Gesture Touch Overlay */}
        {!isGameOver && !isPaused && !showTutorial && (
          <div
            className="absolute inset-0 z-10 select-none touch-none cursor-pointer"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              touchRef.current = {
                active: true,
                x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
                y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
              };
            }}
            onPointerMove={(e) => {
              if (!touchRef.current.active) return;
              const rect = e.currentTarget.getBoundingClientRect();
              touchRef.current = {
                active: true,
                x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
                y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
              };
            }}
            onPointerUp={() => {
              touchRef.current.active = false;
            }}
          />
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono">
          {isKo ? '화면을 드래그하여 전투기를 기동하세요 (자동 사격 탑재)' : 'Drag screen to pilot starfighter (Auto-fire enabled)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_shooting"
          gameTitle={isKo ? '스페이스 슈팅 배틀: 은하 함대 격돌' : 'Space Shooting Battle: Galaxy Armada'}
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
export default ShootingBattleGame;
