import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPinballKnightsGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface EnemyKnight {
  id: number;
  x: number;
  y: number;
  vx: number;
  hp: number;
  maxHp: number;
  type: 'footman' | 'cavalry' | 'lord';
  cardId: number;
  icon: string;
  points: number;
  radius: number;
  isHit: boolean;
}

interface SlingShield {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  bounces: number;
  alive: boolean;
}

export const VoxelPinballKnightsGame: React.FC<VoxelPinballKnightsGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 49;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [knightsDefeated, setKnightsDefeated] = useState<number>(0);
  const [shieldsLeft, setShieldsLeft] = useState<number>(20);
  const [score, setScore] = useState<number>(0);
  const [slingCombo, setSlingCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_knights_sling') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const originX = 180;
  const originY = 440;

  const stateRef = useRef({
    knights: [] as EnemyKnight[],
    shields: [] as SlingShield[],
    isAiming: false,
    dragPos: { x: originX, y: originY },
    knightsDefeated: 0,
    shieldsLeft: 20,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    knightCounter: 1,
    spawnTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.knights = [];
    s.shields = [];
    s.isAiming = false;
    s.dragPos = { x: originX, y: originY };
    s.knightsDefeated = 0;
    s.shieldsLeft = 20;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.knightCounter = 1;
    s.spawnTimer = 0;
    s.particles = [];

    // Initial 3 Knights
    s.knights.push(
      { id: s.knightCounter++, x: 80, y: 150, vx: 50, hp: 1, maxHp: 1, type: 'footman', cardId: 34, icon: '🛡️', points: 200, radius: 22, isHit: false },
      { id: s.knightCounter++, x: 280, y: 200, vx: -65, hp: 2, maxHp: 2, type: 'cavalry', cardId: 55, icon: '🐴', points: 450, radius: 26, isHit: false }
    );

    setKnightsDefeated(0);
    setShieldsLeft(20);
    setScore(0);
    setSlingCombo(0);
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

  // Touch Handlers: Drag Back & Release Slingshot (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.shieldsLeft <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    if (Math.hypot(touchX - originX, touchY - originY) < 60) {
      s.isAiming = true;
      s.dragPos = { x: touchX, y: touchY };
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.isAiming || s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.dragPos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.isAiming || s.isGameOver || s.isPaused) return;
    s.isAiming = false;

    const dx = originX - s.dragPos.x;
    const dy = originY - s.dragPos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 25 && s.shieldsLeft > 0) {
      s.shieldsLeft -= 1;
      setShieldsLeft(s.shieldsLeft);

      const speed = Math.min(650, dist * 6.5);
      const angle = Math.atan2(dy, dx);

      s.shields.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 16,
        bounces: 4,
        alive: true,
      });

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }

    s.dragPos = { x: originX, y: originY };
  };

  // Main 60FPS Knights Sling Loop
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

      // Spawn Enemy Knights
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.2 && s.knights.length < 6) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isLord = rand < 0.18;
        const isCavalry = rand < 0.5;
        const cardId = isLord ? 83 : (isCavalry ? 55 : 34);

        s.knights.push({
          id: s.knightCounter++,
          x: Math.random() < 0.5 ? 30 : 330,
          y: 110 + Math.random() * 180,
          vx: (Math.random() < 0.5 ? 1 : -1) * (isLord ? 40 : (isCavalry ? 85 : 55)),
          hp: isLord ? 4 : (isCavalry ? 2 : 1),
          maxHp: isLord ? 4 : (isCavalry ? 2 : 1),
          type: isLord ? 'lord' : (isCavalry ? 'cavalry' : 'footman'),
          cardId,
          icon: isLord ? '👑' : (isCavalry ? '🐴' : '🛡️'),
          points: isLord ? 1000 : (isCavalry ? 450 : 200),
          radius: isLord ? 30 : (isCavalry ? 26 : 22),
          isHit: false,
        });
      }

      // Move Knights (Horizontal Wall Patrol)
      s.knights.forEach((k) => {
        k.x += k.vx * dt;
        if (k.x > 330) {
          k.x = 330;
          k.vx = -Math.abs(k.vx);
        } else if (k.x < 30) {
          k.x = 30;
          k.vx = Math.abs(k.vx);
        }
      });

      // Update Flying Shields
      for (let sIdx = s.shields.length - 1; sIdx >= 0; sIdx--) {
        const sh = s.shields[sIdx];
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;

        // Wall Bounces
        if (sh.x < 20 || sh.x > 340) {
          sh.vx = -sh.vx;
          sh.bounces -= 1;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }
        if (sh.y < 30) {
          sh.vy = -sh.vy;
          sh.bounces -= 1;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }

        // Check Collision with Knights
        for (let kIdx = s.knights.length - 1; kIdx >= 0; kIdx--) {
          const k = s.knights[kIdx];
          if (Math.hypot(k.x - sh.x, k.y - sh.y) < k.radius + sh.radius) {
            k.hp -= 1;
            sh.vx = -sh.vx * 0.8;
            sh.vy = -sh.vy * 0.8;
            sh.bounces -= 1;

            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = k.points + s.combo * 30;
            s.score += pts;

            setScore(s.score);
            setSlingCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`SHIELD SMASH! +${pts}P 💥`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            setTimeout(() => setFeedbackText(null), 300);

            // Shield Sparkles
            for (let p = 0; p < 10; p++) {
              s.particles.push({
                x: k.x,
                y: k.y,
                vx: (Math.random() - 0.5) * 220,
                vy: (Math.random() - 0.5) * 220,
                color: k.type === 'lord' ? '#fde047' : '#38bdf8',
                life: 0.5,
              });
            }

            if (k.hp <= 0) {
              s.knightsDefeated += 1;
              setKnightsDefeated(s.knightsDefeated);
              s.knights.splice(kIdx, 1);
            }
            break;
          }
        }

        if (sh.y > 510 || sh.bounces <= 0) {
          s.shields.splice(sIdx, 1);
        }
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

      // Castle Courtyard Stone Floor Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.6, '#0f172a');
      bgGrad.addColorStop(1, '#3b0764');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Slingshot Trajectory Preview Line
      if (s.isAiming) {
        const aimDx = originX - s.dragPos.x;
        const aimDy = originY - s.dragPos.y;

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX + aimDx * 2.5, originY + aimDy * 2.5);
        ctx.stroke();
        ctx.setLineDash([]);

        // Slingshot Elastic Bands
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(originX - 35, originY);
        ctx.lineTo(s.dragPos.x, s.dragPos.y);
        ctx.moveTo(originX + 35, originY);
        ctx.lineTo(s.dragPos.x, s.dragPos.y);
        ctx.stroke();
      }

      // Render Enemy Knights (Card Sprites)
      s.knights.forEach((k) => {
        ctx.save();
        ctx.translate(k.x, k.y);

        drawCardSprite(
          ctx,
          k.cardId,
          -k.radius,
          -k.radius,
          k.radius * 2,
          k.radius * 2,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: k.type === 'lord' ? '#fde047' : (k.type === 'cavalry' ? '#38bdf8' : '#ef4444'),
            shadowBlur: k.type === 'lord' ? 18 : 6,
            shadowColor: k.type === 'lord' ? 'rgba(253, 224, 71, 0.9)' : (k.type === 'cavalry' ? 'rgba(56, 189, 248, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
          }
        );

        // HP Bar for Stronger Knights
        if (k.maxHp > 1) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-14, k.radius + 3, 28, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-14, k.radius + 3, 28 * (k.hp / k.maxHp), 4);
        }
        ctx.restore();
      });

      // Render Flying Shields (Player Hero Badge)
      s.shields.forEach((sh) => {
        ctx.save();
        ctx.translate(sh.x, sh.y);

        drawCardSprite(
          ctx,
          playerHeroId,
          -16,
          -16,
          32,
          32,
          {
            circleClip: true,
            borderWidth: 2,
            borderColor: '#38bdf8',
            shadowBlur: 14,
            shadowColor: 'rgba(56, 189, 248, 0.8)',
          }
        );

        ctx.restore();
      });

      // Render Slingshot Base & Ready Shield (Player Hero Badge)
      ctx.save();
      ctx.translate(s.isAiming ? s.dragPos.x : originX, s.isAiming ? s.dragPos.y : originY);

      drawCardSprite(
        ctx,
        playerHeroId,
        -20,
        -20,
        40,
        40,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#fde047',
          shadowBlur: 16,
          shadowColor: 'rgba(253, 224, 71, 0.9)',
        }
      );

      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playSfx, playerHeroId]);

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
      gameId: 'arcade_knights_sling',
      gameTitle: '블리츠 나이츠 슬링',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.knightsDefeated * 250) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.knightsDefeated >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 슬링샷 방패 사격' : 'STEP 1: SLINGSHOT SHIELD LAUNCH',
      title: isKo ? '방패를 뒤로 당겨 궤적을 조준하고 손을 떼어 발사하세요' : 'Drag Shield Back to Aim & Release to Fire',
      description: isKo
        ? '가상 조이스틱 없이 하단의 성기사 방패(🛡️)를 손가락으로 뒤로 당겨 궤적을 조준하고 손을 떼어 발사하여 순찰하는 오크 보병, 기마 기사, 암흑 군주(👑)를 일격에 날려버리세요.'
        : 'Drag the paladin shield back to aim trajectory and release to ricochet smash incoming enemy knights.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 슬링샷 당기기 & 발사)',
            '암흑 군주(👑) 격파 시 1,000P 잭팟 대박 보너스',
            '35초간 최대 콤보로 기사단을 토벌하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Drag Back Slingshot & Release',
            'Dark Lords (👑) award massive 1,000P strike jackpot',
            'Defeat enemy knights with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 당기기 & 놓기 (Drag & Release)' : 'Drag & Release Gesture',
      description: isKo
        ? '손가락으로 방패를 잡고 당기면 점선 궤적이 표시됩니다.'
        : 'Pull shield back to preview dotted trajectory and release.',
      keyPoints: isKo
        ? [
            '👆 당기기 & 놓기: 4회 도탄 튕김 성기사 방패 사격',
            '💥 연속 격파 성공 시 슬링 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Drag & Release: 4-bounce ricocheting shield launch',
            '💥 Consecutive knight knockdowns grant combo multipliers',
            '⏱️ 35s time attack knights sling sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '토벌 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '토벌한 기사 수 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Defeated knights count and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#1e1b4b] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 나이츠 슬링' : 'Blitz Knights Sling'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '토벌' : 'Defeated', value: `${knightsDefeated}명`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '방패' : 'Shields', value: `${shieldsLeft}개`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Knights Sling Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-crosshair shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '방패를 뒤로 당겨 궤적을 조준하고 손을 떼어 발사하세요' : 'Drag shield back to aim trajectory and release to fire'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_knights_sling"
          gameTitle={isKo ? '블리츠 나이츠: 슬링샷 배틀' : 'Blitz Knights: Slingshot Battle'}
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
export default VoxelPinballKnightsGame;
