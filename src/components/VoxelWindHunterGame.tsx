import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelWindHunterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface FlyingTarget {
  id: number;
  x: number;
  y: number;
  vx: number;
  type: 'balloon' | 'bird' | 'eagle';
  icon: string;
  points: number;
  radius: number;
  hit: boolean;
}

interface FlyingArrow {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
}

export const VoxelWindHunterGame: React.FC<VoxelWindHunterGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [targetsHit, setTargetsHit] = useState<number>(0);
  const [arrowsLeft, setArrowsLeft] = useState<number>(18);
  const [score, setScore] = useState<number>(0);
  const [huntCombo, setHuntCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [windSpeed, setWindSpeed] = useState<number>(2.5);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_wind_hunter') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const bowOriginX = 180;
  const bowOriginY = 430;

  const stateRef = useRef({
    isDrawing: false,
    dragX: 180,
    dragY: 430,
    aimVector: { x: 0, y: -1 },
    drawPower: 0,
    arrows: [] as FlyingArrow[],
    targets: [] as FlyingTarget[],
    windSpeed: 2.5,
    targetsHit: 0,
    arrowsLeft: 18,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    targetCounter: 1,
    spawnTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.isDrawing = false;
    s.dragX = 180;
    s.dragY = 430;
    s.aimVector = { x: 0, y: -1 };
    s.drawPower = 0;
    s.arrows = [];
    s.targets = [];
    s.windSpeed = +(Math.random() * 4 - 2).toFixed(1);
    s.targetsHit = 0;
    s.arrowsLeft = 18;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.targetCounter = 1;
    s.spawnTimer = 0;
    s.particles = [];

    // Initial Flying Targets
    s.targets.push(
      { id: s.targetCounter++, x: 60, y: 130, vx: 50, type: 'balloon', icon: '🎈', points: 300, radius: 22, hit: false },
      { id: s.targetCounter++, x: 300, y: 200, vx: -60, type: 'bird', icon: '🕊️', points: 500, radius: 24, hit: false }
    );

    setTargetsHit(0);
    setArrowsLeft(18);
    setScore(0);
    setHuntCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setWindSpeed(s.windSpeed);
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

  // Direct Touch Draw Bow and Release Arrow
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.arrowsLeft <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.dragX = (e.clientX - rect.left) * scaleX;
    s.dragY = (e.clientY - rect.top) * scaleY;
    s.isDrawing = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.isDrawing || s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.dragX = (e.clientX - rect.left) * scaleX;
    s.dragY = (e.clientY - rect.top) * scaleY;

    // Pull Vector from Bow Origin to Finger
    const pullX = bowOriginX - s.dragX;
    const pullY = bowOriginY - s.dragY;
    const dist = Math.hypot(pullX, pullY);

    if (dist > 10) {
      s.aimVector = { x: pullX / dist, y: pullY / dist };
      s.drawPower = Math.min(1.0, dist / 110);
    }
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.isDrawing || s.isGameOver || s.isPaused || s.arrowsLeft <= 0) {
      s.isDrawing = false;
      return;
    }

    s.isDrawing = false;
    if (s.drawPower > 0.15) {
      s.arrowsLeft -= 1;
      setArrowsLeft(s.arrowsLeft);

      const speed = 400 + s.drawPower * 350;
      s.arrows.push({
        x: bowOriginX,
        y: bowOriginY,
        vx: s.aimVector.x * speed + s.windSpeed * 25,
        vy: s.aimVector.y * speed,
        alive: true,
      });

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  // Main 60FPS Wind Hunter Loop
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

      // Spawn Flying Targets
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.0 && s.targets.length < 6) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isEagle = rand < 0.2;
        const isBird = rand >= 0.2 && rand < 0.55;

        s.targets.push({
          id: s.targetCounter++,
          x: Math.random() < 0.5 ? 20 : 340,
          y: 70 + Math.random() * 180,
          vx: (Math.random() < 0.5 ? 1 : -1) * (isEagle ? 85 : (isBird ? 60 : 45)),
          type: isEagle ? 'eagle' : (isBird ? 'bird' : 'balloon'),
          icon: isEagle ? '🦅' : (isBird ? '🕊️' : '🎈'),
          points: isEagle ? 800 : (isBird ? 500 : 300),
          radius: isEagle ? 28 : (isBird ? 24 : 22),
          hit: false,
        });
      }

      // Move Targets
      s.targets.forEach((target) => {
        target.x += target.vx * dt;
        if (target.x > 330) {
          target.x = 330;
          target.vx = -Math.abs(target.vx);
        } else if (target.x < 30) {
          target.x = 30;
          target.vx = Math.abs(target.vx);
        }
      });

      // Update Flying Arrows
      for (let i = s.arrows.length - 1; i >= 0; i--) {
        const arr = s.arrows[i];
        if (arr.alive) {
          arr.x += arr.vx * dt;
          arr.y += arr.vy * dt;
          arr.vy += 120 * dt; // Gravity arc

          // Check Collision with Targets
          for (let j = s.targets.length - 1; j >= 0; j--) {
            const t = s.targets[j];
            if (!t.hit && Math.hypot(t.x - arr.x, t.y - arr.y) < t.radius + 12) {
              t.hit = true;
              arr.alive = false;
              s.targetsHit += 1;
              s.combo += 1;
              if (s.combo > s.maxCombo) s.maxCombo = s.combo;

              const pts = t.points + s.combo * 40;
              s.score += pts;

              setTargetsHit(s.targetsHit);
              setScore(s.score);
              setHuntCombo(s.combo);
              setMaxCombo(s.maxCombo);

              if (t.type === 'eagle') {
                setFeedbackText(`🦅 GOLDEN EAGLE! +${pts}P ⚡`);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
              } else {
                setFeedbackText(`🎯 BULLSEYE HIT! +${pts}P ✨`);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
              }
              setTimeout(() => setFeedbackText(null), 300);

              // Feather & Sparkle Particles
              for (let p = 0; p < 14; p++) {
                s.particles.push({
                  x: t.x,
                  y: t.y,
                  vx: (Math.random() - 0.5) * 220,
                  vy: (Math.random() - 0.5) * 220,
                  color: t.type === 'eagle' ? '#f59e0b' : '#38bdf8',
                  life: 0.4,
                });
              }

              s.targets.splice(j, 1);
              break;
            }
          }

          // Out of screen
          if (arr.x < 0 || arr.x > 360 || arr.y < 0 || arr.y > 500) {
            arr.alive = false;
          }
        } else {
          s.arrows.splice(i, 1);
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

      // Highland Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.5, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Highland Pine Silhouette at bottom
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h - 60);
      ctx.lineTo(w / 3, h - 30);
      ctx.lineTo(w / 2, h - 70);
      ctx.lineTo((w * 2) / 3, h - 40);
      ctx.lineTo(w, h - 80);
      ctx.lineTo(w, h);
      ctx.fill();

      // Render Aim Guide (When Drawing)
      if (s.isDrawing && s.drawPower > 0.1) {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(bowOriginX, bowOriginY);
        ctx.lineTo(bowOriginX + s.aimVector.x * 120, bowOriginY + s.aimVector.y * 120);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Render Flying Arrows
      s.arrows.forEach((arr) => {
        ctx.save();
        ctx.translate(arr.x, arr.y);
        ctx.rotate(Math.atan2(arr.vy, arr.vx));
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏹', 0, 0);
        ctx.restore();
      });

      // Render Targets
      s.targets.forEach((t) => {
        if (!t.hit) {
          ctx.save();
          ctx.translate(t.x, t.y);
          if (t.type === 'eagle') {
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 18;
          } else {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 12;
          }
          ctx.font = `${t.radius * 1.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(t.icon, 0, 0);
          ctx.restore();
        }
      });

      // Render Hunter Archer at Bottom (🏹)
      ctx.save();
      ctx.translate(bowOriginX, bowOriginY);
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 18;
      ctx.font = '44px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏹', 0, 0);
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [bowOriginX, bowOriginY, playSfx]);

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
      gameId: 'arcade_wind_hunter',
      gameTitle: '블리츠 윈드 헌터',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.targetsHit * 300) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.targetsHit >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 활시위 사격' : 'STEP 1: DRAG & SHOOT BOW',
      title: isKo ? '활시위를 뒤로 당겨 각도를 조준하고 손을 떼어 화살을 쏘세요' : 'Drag bowstring back to aim trajectory and release to loose arrows',
      description: isKo
        ? '가상 조이스틱 없이 화면을 손가락으로 뒤로 당겨 조준 궤적을 확인한 뒤 손을 떼면 바람을 뚫고 화살이 발사되어 공중 타깃(🎈, 🕊️, 🦅)을 격추합니다.'
        : 'Pull back on the string to adjust arc and release to shoot flying targets.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 당겨 조준 & 손떼기 발사)',
            '황금 독수리(🦅) 명중 시 800P 잭팟 대박 보너스',
            '35초간 최대 콤보로 하늘을 수렵하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Drag-Aim & Release-Shoot',
            'Golden Eagle (🦅) awards 800P massive hunting jackpot',
            'Hunt down all airborne targets with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 드래그 조준 (Drag to Draw Bow)' : 'Drag to Aim Gesture',
      description: isKo
        ? '손가락을 뒤로 밀어 활시위 당김 파워와 발사 각도를 조종합니다.'
        : 'Slide thumb backward to build draw tension and aim arc.',
      keyPoints: isKo
        ? [
            '👆 드래그 조준: 60FPS 실시간 포물선 조준 궤적 가이드',
            '🏹 연속 명중 시 헌팅 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Drag to Draw: Instant 60FPS ballistic trajectory guide',
            '🏹 Consecutive bullseyes grant hunting combo multipliers',
            '⏱️ 35s time attack wind hunter sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '사냥 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '격추한 타깃 수 및 황금 독수리 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Hit targets count and eagle multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0284c7] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 윈드 헌터' : 'Blitz Wind Hunter'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '명중' : 'Hits', value: `${targetsHit}회`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '화살' : 'Arrows', value: `${arrowsLeft}발`, color: 'text-cyan-200 font-bold' },
          { label: isKo ? '풍속' : 'Wind', value: `${windSpeed > 0 ? `+${windSpeed}` : windSpeed}m/s`, color: 'text-white font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Wind Hunter Canvas Viewport */}
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
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-200 font-mono">
          {isKo ? '화면을 뒤로 당겨 각도를 조준하고 손을 떼어 화살을 발사하세요' : 'Drag backward to aim trajectory and release to shoot'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_wind_hunter"
          gameTitle={isKo ? '블리츠 헌터: 바람 양궁 사냥' : 'Blitz Hunter: Wind Archery'}
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
export default VoxelWindHunterGame;
