import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelTreasureDiggerGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface MineTreasure {
  id: number;
  x: number;
  y: number;
  type: 'gold' | 'diamond' | 'chest' | 'rock';
  icon: string;
  points: number;
  radius: number;
  weight: number;
  collected: boolean;
}

export const VoxelTreasureDiggerGame: React.FC<VoxelTreasureDiggerGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 83;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [treasuresDug, setTreasuresDug] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [diggerCombo, setDiggerCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_treasure_digger') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const craneOriginX = 180;
  const craneOriginY = 60;

  const stateRef = useRef({
    hookState: 'idle' as 'idle' | 'aiming' | 'shooting' | 'retracting',
    aimAngle: Math.PI / 2,
    hookLength: 20,
    hookSpeed: 520,
    hookTarget: null as MineTreasure | null,
    treasures: [] as MineTreasure[],
    treasuresDug: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    treasureCounter: 1,
    spawnTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.hookState = 'idle';
    s.aimAngle = Math.PI / 2;
    s.hookLength = 20;
    s.hookTarget = null;
    s.treasures = [];
    s.treasuresDug = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.treasureCounter = 1;
    s.spawnTimer = 0;
    s.particles = [];

    // Initial Mine Treasures
    s.treasures.push(
      { id: s.treasureCounter++, x: 80, y: 220, type: 'gold', icon: '🪙', points: 300, radius: 22, weight: 1.0, collected: false },
      { id: s.treasureCounter++, x: 280, y: 260, type: 'diamond', icon: '💎', points: 600, radius: 20, weight: 0.8, collected: false },
      { id: s.treasureCounter++, x: 180, y: 380, type: 'chest', icon: '📦', points: 1000, radius: 26, weight: 1.4, collected: false },
      { id: s.treasureCounter++, x: 140, y: 240, type: 'rock', icon: '🪨', points: -150, radius: 24, weight: 2.2, collected: false }
    );

    setTreasuresDug(0);
    setScore(0);
    setDiggerCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Direct Touch Drag to Aim Hook and Release to Shoot
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.hookState !== 'idle') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    s.aimAngle = Math.atan2(touchY - craneOriginY, touchX - craneOriginX);
    s.hookState = 'aiming';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.hookState !== 'aiming' || s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    s.aimAngle = Math.atan2(touchY - craneOriginY, touchX - craneOriginX);
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (s.hookState !== 'aiming' || s.isGameOver || s.isPaused) return;

    s.hookState = 'shooting';
    s.hookLength = 20;
    s.hookTarget = null;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  // Main 60FPS Treasure Digger Loop
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

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Hook Mechanics
      const hookTipX = craneOriginX + Math.cos(s.aimAngle) * s.hookLength;
      const hookTipY = craneOriginY + Math.sin(s.aimAngle) * s.hookLength;

      if (s.hookState === 'shooting') {
        s.hookLength += s.hookSpeed * dt;

        // Check Collision with Mine Treasures
        for (let i = s.treasures.length - 1; i >= 0; i--) {
          const item = s.treasures[i];
          if (!item.collected && Math.hypot(item.x - hookTipX, item.y - hookTipY) < item.radius + 14) {
            item.collected = true;
            s.hookTarget = item;
            s.hookState = 'retracting';
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            break;
          }
        }

        // Boundary Limits
        if (hookTipX < 20 || hookTipX > 340 || hookTipY > 480) {
          s.hookState = 'retracting';
        }
      } else if (s.hookState === 'retracting') {
        const retractSpeed = s.hookTarget ? s.hookSpeed / s.hookTarget.weight : s.hookSpeed * 1.5;
        s.hookLength = Math.max(20, s.hookLength - retractSpeed * dt);

        if (s.hookLength <= 20) {
          s.hookState = 'idle';

          if (s.hookTarget) {
            const item = s.hookTarget;
            s.hookTarget = null;

            if (item.type === 'rock') {
              s.score = Math.max(0, s.score - 150);
              s.combo = 0;
              setScore(s.score);
              setDiggerCombo(0);

              setFeedbackText(isKo ? '돌멩이 채굴! 감점 🪨' : 'HEAVY ROCK! 🪨');
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            } else {
              s.treasuresDug += 1;
              s.combo += 1;
              if (s.combo > s.maxCombo) s.maxCombo = s.combo;

              const pts = item.points + s.combo * 50;
              s.score += pts;

              setTreasuresDug(s.treasuresDug);
              setScore(s.score);
              setDiggerCombo(s.combo);
              setMaxCombo(s.maxCombo);

              if (item.type === 'chest') {
                setFeedbackText(`📦 ANCIENT CHEST! +${pts}P ⚡`);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
              } else if (item.type === 'diamond') {
                setFeedbackText(`💎 DIAMOND! +${pts}P ✨`);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
              } else {
                setFeedbackText(`🪙 GOLD NUGGET! +${pts}P`);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
              }

              // Sparkle particles
              for (let p = 0; p < 12; p++) {
                s.particles.push({
                  x: craneOriginX,
                  y: craneOriginY,
                  vx: (Math.random() - 0.5) * 200,
                  vy: (Math.random() - 0.5) * 200,
                  color: '#fde047',
                  life: 0.4,
                });
              }
            }

            setTimeout(() => setFeedbackText(null), 300);
            s.treasures = s.treasures.filter((t) => !t.collected);
          }
        }
      }

      // Spawn Mine Treasures
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.4 && s.treasures.length < 6) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isChest = rand < 0.15;
        const isDiamond = rand >= 0.15 && rand < 0.45;
        const isRock = rand >= 0.45 && rand < 0.65;

        s.treasures.push({
          id: s.treasureCounter++,
          x: 40 + Math.random() * 280,
          y: 180 + Math.random() * 240,
          type: isChest ? 'chest' : (isDiamond ? 'diamond' : (isRock ? 'rock' : 'gold')),
          icon: isChest ? '📦' : (isDiamond ? '💎' : (isRock ? '🪨' : '🪙')),
          points: isChest ? 1000 : (isDiamond ? 600 : (isRock ? -150 : 300)),
          radius: isChest ? 26 : (isDiamond ? 20 : (isRock ? 24 : 22)),
          weight: isChest ? 1.4 : (isDiamond ? 0.8 : (isRock ? 2.2 : 1.0)),
          collected: false,
        });
      }

      // Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Gold Mine Dark Underground Gradient
      const mineGrad = ctx.createLinearGradient(0, 0, 0, h);
      mineGrad.addColorStop(0, '#1c1917');
      mineGrad.addColorStop(0.3, '#292524');
      mineGrad.addColorStop(1, '#0c0a09');
      ctx.fillStyle = mineGrad;
      ctx.fillRect(0, 0, w, h);

      // Ground Surface Line
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, craneOriginY + 20);
      ctx.lineTo(w, craneOriginY + 20);
      ctx.stroke();

      // Render Crane Hook Line
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(craneOriginX, craneOriginY);
      ctx.lineTo(hookTipX, hookTipY);
      ctx.stroke();

      // Render Hook Claw (🪝)
      ctx.save();
      ctx.translate(hookTipX, hookTipY);
      ctx.rotate(s.aimAngle - Math.PI / 2);
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪝', 0, 0);
      ctx.restore();

      // Render Mine Treasures
      s.treasures.forEach((item) => {
        if (!item.collected) {
          ctx.save();
          ctx.translate(item.x, item.y);
          if (item.type === 'chest') {
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 18;
          } else if (item.type === 'diamond') {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 15;
          }
          ctx.font = `${item.radius * 1.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.icon, 0, 0);
          ctx.restore();
        }
      });

      // Render Crane Cart at Top (🏗️)
      ctx.save();
      ctx.translate(craneOriginX, craneOriginY);
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 16;
      ctx.font = '36px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏗️', 0, -10);
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playSfx]);

  const endGame = (isWin: boolean) => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    setIsGameOver(true);

    if (isWin) {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    const duration = (Date.now() - s.startTime) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'arcade_treasure_digger',
      gameTitle: '블리츠 트레저 디거',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.treasuresDug * 350) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.treasuresDug >= 7,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 크레인 갈고리 채굴' : 'STEP 1: DRAG & LAUNCH HOOK',
      title: isKo ? '화면을 드래그해 보물을 조준하고 손을 떼어 낚아채세요' : 'Drag to aim crane hook and release to grab buried treasures',
      description: isKo
        ? '가상 조이스틱 없이 화면을 손가락으로 드래그하여 황금(🪙), 다이아몬드(💎), 보물 상자(📦)를 조준하고 손을 떼어 갈고리로 즉시 낚아채 끌어올리세요.'
        : 'Drag your finger to align the claw toward diamonds and gold, then release to launch the hook.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 드래그 조준 & 손떼기 사출)',
            '고대 보물 상자(📦) 획득 시 1,000P 잭팟 대박 보너스',
            '35초간 최대 콤보로 지하 광산을 채굴하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Drag-Aim & Release-Launch',
            'Treasure Chests (📦) award 1,000P massive gold jackpot',
            'Gather buried jewels with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 드래그 조준 (Drag to Aim & Release)' : 'Drag to Aim Gesture',
      description: isKo
        ? '손가락을 원하는 각도로 밀어 조준선을 맞춥니다.'
        : 'Slide your thumb to aim the hook vector line.',
      keyPoints: isKo
        ? [
            '👆 드래그 조준: 60FPS 실시간 조준선 표시',
            '💎 연속 채굴 시 디거 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Drag to Aim: Real-time 60FPS trajectory line',
            '💎 Consecutive mining grants digger combo multipliers',
            '⏱️ 35s time attack treasure digger sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '채굴 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '채굴한 보물 수 및 상자 개수 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Dug treasures count and chest multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0c0a09] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 트레저 디거' : 'Blitz Treasure Digger'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '채굴' : 'Treasures', value: `${treasuresDug}개`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${diggerCombo}x`, color: diggerCombo > 2 ? 'text-amber-300 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Treasure Digger Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-pointer shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap bg-black/60 px-4 py-1 rounded-full border border-amber-400/30">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '화면을 드래그해 각도를 맞추고 손을 떼어 갈고리를 사출하세요' : 'Drag to aim hook and release to launch claw'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_treasure_digger"
          gameTitle={isKo ? '블리츠 디거: 황금 보물 채굴' : 'Blitz Digger: Gold Miner'}
          customSteps={tutorialSteps}
          language={(language as Language) || 'ko'}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={(language as Language) || 'ko'}
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default VoxelTreasureDiggerGame;
