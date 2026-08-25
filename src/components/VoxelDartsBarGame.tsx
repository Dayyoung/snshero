import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDartsBarGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface StuckKnife {
  angle: number;
}

interface TargetApple {
  angle: number;
  hit: boolean;
}

export const VoxelDartsBarGame: React.FC<VoxelDartsBarGameProps> = ({
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

  const [knivesLeft, setKnivesLeft] = useState<number>(7);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const totalStages = 4;
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_flick_knife') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    targetAngle: 0,
    targetSpeed: 1.8,
    targetRadius: 75,
    stuckKnives: [] as StuckKnife[],
    apples: [] as TargetApple[],
    knivesLeft: 7,
    stage: 1,
    score: 0,
    combo: 0,
    maxCombo: 0,
    flyingKnife: null as { y: number; speed: number } | null,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
  });

  const setupStage = useCallback((stageNum: number) => {
    const s = stateRef.current;
    s.stage = stageNum;
    s.knivesLeft = 6 + stageNum;
    s.stuckKnives = [];
    s.targetAngle = 0;
    s.targetSpeed = (1.5 + stageNum * 0.4) * (stageNum % 2 === 0 ? -1 : 1);
    s.flyingKnife = null;

    // Place 1~2 initial obstacle knives & apples
    const initKnivesCount = Math.min(3, stageNum);
    for (let i = 0; i < initKnivesCount; i++) {
      s.stuckKnives.push({
        angle: (i * Math.PI * 2) / initKnivesCount + 0.3,
      });
    }

    s.apples = [
      { angle: 1.2, hit: false },
      { angle: 3.8, hit: false },
    ];

    setKnivesLeft(s.knivesLeft);
    setCurrentStage(stageNum);
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.isGameOver = false;
    s.startTime = Date.now();

    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);

    setupStage(1);
  }, [setupStage]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Touch / Pointer Throw Knife Action (Zero Joysticks - Direct 1-Tap)
  const handleScreenTap = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.knivesLeft <= 0 || s.flyingKnife) return;

    // Launch Knife upwards
    s.flyingKnife = { y: 460, speed: 1800 };
    s.knivesLeft -= 1;
    setKnivesLeft(s.knivesLeft);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  // Main 60FPS Knife Hit Engine Loop
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

      // Rotate Target Log Wheel
      s.targetAngle += s.targetSpeed * dt;

      // Update Flying Knife
      if (s.flyingKnife) {
        s.flyingKnife.y -= s.flyingKnife.speed * dt;

        const targetCenterY = 170;
        const targetHitY = targetCenterY + s.targetRadius;

        if (s.flyingKnife.y <= targetHitY) {
          // Impact Check!
          s.flyingKnife = null;

          // Normalize impact angle relative to rotating log
          let impactAngle = Math.PI / 2 - s.targetAngle;
          while (impactAngle < 0) impactAngle += Math.PI * 2;
          impactAngle = impactAngle % (Math.PI * 2);

          // Check Collision with existing stuck knives
          const minAngleDist = 0.22; // ~12 degrees
          let knifeClash = false;

          for (const k of s.stuckKnives) {
            let diff = Math.abs(k.angle - impactAngle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;

            if (diff < minAngleDist) {
              knifeClash = true;
              break;
            }
          }

          if (knifeClash) {
            // Clash & Rebound ➔ Game Over
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            endGame(false);
            return;
          }

          // Stick Knife Successfully!
          s.stuckKnives.push({ angle: impactAngle });
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          let points = 100 + s.combo * 30;

          // Check Apple Slices
          s.apples.forEach((apple) => {
            if (!apple.hit) {
              let diff = Math.abs(apple.angle - impactAngle);
              if (diff > Math.PI) diff = Math.PI * 2 - diff;
              if (diff < 0.28) {
                apple.hit = true;
                points += 300;
                setFeedbackText(`APPLE SLICE! +300P 🍎`);
                setTimeout(() => setFeedbackText(null), 400);
              }
            }
          });

          s.score += points;
          setScore(s.score);
          setCombo(s.combo);
          setMaxCombo(s.maxCombo);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          // Check Stage Clear (All knives thrown in this stage)
          if (s.knivesLeft <= 0) {
            if (s.stage < totalStages) {
              setFeedbackText(`STAGE ${s.stage} CLEAR! ⚡`);
              setTimeout(() => {
                setFeedbackText(null);
                setupStage(s.stage + 1);
              }, 600);
            } else {
              // Complete All Stages!
              endGame(true);
            }
          }
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Cyber Target Arena Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      const targetX = w / 2;
      const targetY = 170;

      // Render Rotating Log Target Wheel
      ctx.save();
      ctx.translate(targetX, targetY);
      ctx.rotate(s.targetAngle);

      // Wood Target Core
      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.arc(0, 0, s.targetRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Wood Grain Rings
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, s.targetRadius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s.targetRadius * 0.3, 0, Math.PI * 2);
      ctx.stroke();

      // Stuck Knives attached to wheel
      s.stuckKnives.forEach((k) => {
        ctx.save();
        ctx.rotate(k.angle);
        ctx.translate(0, s.targetRadius);

        // Knife Blade
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-3, 0, 6, 28);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-4, 28, 8, 12);
        ctx.restore();
      });

      // Target Apples on wheel
      s.apples.forEach((a) => {
        if (!a.hit) {
          ctx.save();
          ctx.rotate(a.angle);
          ctx.translate(0, s.targetRadius - 10);
          ctx.font = '22px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🍎', 0, 0);
          ctx.restore();
        }
      });

      ctx.restore();

      // Render Flying Knife
      if (s.flyingKnife) {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(targetX - 4, s.flyingKnife.y, 8, 35);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(targetX - 6, s.flyingKnife.y + 35, 12, 16);
      }

      // Render Ready Knife at bottom
      if (s.knivesLeft > 0 && !s.flyingKnife) {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(targetX - 4, 450, 8, 35);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(targetX - 6, 485, 12, 16);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [setupStage]);

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
      gameId: 'arcade_flick_knife',
      gameTitle: '블리츠 플릭 나이프',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : s.stage * 400) + s.maxCombo * 70,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.stage >= 3,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 단검 꽂아넣기' : 'STEP 1: THROW KNIVES',
      title: isKo ? '회전하는 통나무에 단검을 꽂으세요' : 'Tap to Stick Knives into Target Log',
      description: isKo
        ? '가상 조이스틱 없이 화면을 원터치 탭하여 회전하는 통나무 타깃에 단검을 꽂아 넣으세요. 이미 꽂힌 단검과 충돌하면 패배합니다.'
        : 'Tap anywhere to throw knives into the spinning wood log without hitting existing knives.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 직접 원터치 탭 투척)',
            '사과(🍎)를 맞추면 300P 대량 보너스 획득',
            '단검 겹침 충돌을 피해 모든 단검을 꽂으면 스테이지 클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Screen Tap',
            'Hit apples (🍎) for 300P massive bonus',
            'Stick all knives safely without clashing to clear stage'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 어디든 원터치 탭 (Single Tap)' : 'One-Touch Screen Tap',
      description: isKo
        ? '빈 틈이 보이는 순간 화면 아무 곳이나 가볍게 탭합니다.'
        : 'Simply tap anywhere when you spot an open gap on the log.',
      keyPoints: isKo
        ? [
            '👆 원터치 탭: 즉각적인 초고속 단검 발사',
            '⚡ 연속 히트 성공 시 콤보 배수 보너스 가산',
            '🎯 4개 스테이지를 모두 정복하세요'
          ]
        : [
            '👆 Single Tap: Instant ultra-fast knife throw',
            '⚡ Chain consecutive hits for combo multipliers',
            '🎯 Conquer all 4 spinning boss stages'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '결투 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '도달 스테이지 및 사과 슬라이스 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Cleared stages and apple slices multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div
      onClick={handleScreenTap}
      className="relative w-full h-[100dvh] bg-[#080d1a] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none cursor-pointer"
    >
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <div onClick={(e) => e.stopPropagation()} className="w-full">
        <MinimalistMissionHUD
          title={isKo ? '블리츠 플릭 나이프' : 'Blitz Flick Knife'}
          language={(language as Language) || 'ko'}
          telemetries={[
            { label: isKo ? '스테이지' : 'Stage', value: `${currentStage}/${totalStages}`, color: 'text-amber-400 font-bold text-base' },
            { label: isKo ? '단검' : 'Knives', value: '🗡️'.repeat(knivesLeft), color: knivesLeft <= 2 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
            { label: isKo ? '콤보' : 'Combo', value: `${combo}x`, color: combo > 3 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
            { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
          ]}
          onExit={onExit}
          onHelp={() => setShowTutorial(true)}
          onPauseToggle={() => setIsPaused(prev => !prev)}
          isPaused={isPaused}
        />
      </div>

      {/* Pure Touch Knife Hit Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={540}
          className="w-full h-full object-contain touch-none shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-xl font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '화면을 탭하여 단검을 꽂으세요 (단검 충돌 주의 / 사과 슬라이스)' : 'Tap anywhere to throw knife (Avoid hitting knives!)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <div onClick={(e) => e.stopPropagation()}>
          <UniversalTutorialModal
            gameId="arcade_flick_knife"
            gameTitle={isKo ? '블리츠 플릭 나이프: 타깃 히트' : 'Blitz Flick Knife: Target Hit'}
            customSteps={tutorialSteps}
            language={(language as Language) || 'ko'}
            onStartGame={() => setShowTutorial(false)}
            onClose={() => setShowTutorial(false)}
          />
        </div>
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <div onClick={(e) => e.stopPropagation()}>
          <VictoryRewardModal
            receipt={settlementReceipt}
            language={(language as Language) || 'ko'}
            onPlayAgain={initGame}
            onExit={onExit}
          />
        </div>
      )}
    </div>
  );
};
export default VoxelDartsBarGame;
