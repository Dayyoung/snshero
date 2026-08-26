import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelHalfpipeSkaterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelHalfpipeSkaterGame: React.FC<VoxelHalfpipeSkaterGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 102;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [airHeight, setAirHeight] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [trickCombo, setTrickCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [lastTrick, setLastTrick] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_halfpipe_air') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    halfpipeT: 0, // 0 to Math.PI (oscillation)
    pipeSpeed: 2.2,
    isAirborne: false,
    airY: 0,
    airVy: 0,
    tricksInAir: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    touchStart: { x: 0, y: 0 },
    trickEffects: [] as { x: number; y: number; text: string; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.halfpipeT = 0;
    s.pipeSpeed = 2.2;
    s.isAirborne = false;
    s.airY = 0;
    s.airVy = 0;
    s.tricksInAir = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.trickEffects = [];

    setAirHeight(0);
    setScore(0);
    setTrickCombo(0);
    setMaxCombo(0);
    setLastTrick('');
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

  // Touch Swipe Handlers for Launch & Aerial Tricks (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.touchStart = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const endX = (e.clientX - rect.left) * scaleX;
    const endY = (e.clientY - rect.top) * scaleY;

    const dx = endX - s.touchStart.x;
    const dy = endY - s.touchStart.y;
    const dist = Math.hypot(dx, dy);

    if (!s.isAirborne) {
      // On Pipe: Tap/Swipe to Pump & Launch!
      if (dy < -20 || dist < 15) {
        // Launch into Air!
        s.isAirborne = true;
        s.airY = 0;
        s.airVy = 340 + Math.min(s.combo * 20, 160); // higher air with combos!
        s.tricksInAir = 0;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setFeedbackText('AIR LAUNCH! 🚀');
        setTimeout(() => setFeedbackText(null), 300);
      }
    } else {
      // In Air: Swipe in 4 directions for Radical Tricks!
      if (dist >= 25) {
        let trickName = 'KICKFLIP';
        let pts = 250;
        let color = '#38bdf8';

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            trickName = '360 SPIN 🌀';
            pts = 350;
            color = '#fde047';
          } else {
            trickName = 'HEELFLIP 🛹';
            pts = 300;
            color = '#a855f7';
          }
        } else {
          if (dy < 0) {
            trickName = 'SUPERMAN GRAB 🦸';
            pts = 450;
            color = '#ef4444';
          } else {
            trickName = 'METHOD AIR ⚡';
            pts = 320;
            color = '#34d399';
          }
        }

        s.tricksInAir += 1;
        s.combo += 1;
        if (s.combo > s.maxCombo) s.maxCombo = s.combo;

        const finalPts = pts + s.combo * 30;
        s.score += finalPts;

        setScore(s.score);
        setTrickCombo(s.combo);
        setMaxCombo(s.maxCombo);
        setLastTrick(trickName);

        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        s.trickEffects.push({
          x: 180 + (Math.random() - 0.5) * 60,
          y: 200 - s.airY * 0.4,
          text: `${trickName} +${finalPts}P`,
          color,
          life: 0.7,
        });
      }
    }
  };

  // Main 60FPS Halfpipe & Aerial Trick Loop
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

      // Pipe Oscillation
      if (!s.isAirborne) {
        s.halfpipeT += s.pipeSpeed * dt;
      } else {
        // Airborne Physics
        s.airY += s.airVy * dt;
        s.airVy -= 420 * dt; // Gravity
        setAirHeight(Math.max(0, Math.round(s.airY / 10)));

        // Landing Check
        if (s.airY <= 0 && s.airVy < 0) {
          s.airY = 0;
          s.airVy = 0;
          s.isAirborne = false;

          // Clean Landing
          const cleanBonus = s.tricksInAir > 0 ? 200 + s.tricksInAir * 100 : 50;
          s.score += cleanBonus;
          setScore(s.score);
          setFeedbackText(`CLEAN LANDING! +${cleanBonus}P 🛹`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          setTimeout(() => setFeedbackText(null), 400);
        }
      }

      // Update Trick Effects
      for (let i = s.trickEffects.length - 1; i >= 0; i--) {
        const eff = s.trickEffects[i];
        eff.y -= 35 * dt;
        eff.life -= dt;
        if (eff.life <= 0) s.trickEffects.splice(i, 1);
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Sunset Extreme Skate Park Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.5, '#431407');
      skyGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Halfpipe Ramp Arc
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(30, 220);
      ctx.quadraticCurveTo(w / 2, 450, w - 30, 220);
      ctx.stroke();

      // Ramp Wood Texture Fill
      ctx.fillStyle = '#9a3412';
      ctx.beginPath();
      ctx.moveTo(30, 220);
      ctx.quadraticCurveTo(w / 2, 450, w - 30, 220);
      ctx.lineTo(w - 30, 480);
      ctx.lineTo(30, 480);
      ctx.closePath();
      ctx.fill();

      // Left & Right Ramp Coping Card Sprite Emblems
      drawCardSprite(ctx, 100, 18, 208, 24, 24, {
        circleClip: true,
        borderWidth: 1.5,
        borderColor: '#fde047',
        shadowBlur: 8,
        shadowColor: 'rgba(253, 224, 71, 0.8)',
      });
      drawCardSprite(ctx, 100, w - 42, 208, 24, 24, {
        circleClip: true,
        borderWidth: 1.5,
        borderColor: '#fde047',
        shadowBlur: 8,
        shadowColor: 'rgba(253, 224, 71, 0.8)',
      });

      // Skater Position
      let skaterX = w / 2;
      let skaterY = 380;
      let skaterAngle = 0;

      if (!s.isAirborne) {
        // Move along curve
        const t = Math.sin(s.halfpipeT); // -1 to 1
        skaterX = w / 2 + t * 130;
        skaterY = 380 - Math.abs(t) * 160;
        skaterAngle = t * 0.8;
      } else {
        // High Air at Center
        skaterX = w / 2;
        skaterY = 220 - s.airY * 0.6;
        skaterAngle = (Date.now() / 200) % (Math.PI * 2);
      }

      // Render Skater
      ctx.save();
      ctx.translate(skaterX, skaterY);
      ctx.rotate(skaterAngle);

      drawCardSprite(ctx, playerHeroId, -22, -22, 44, 44, {
        circleClip: true,
        borderWidth: 2,
        borderColor: s.isAirborne ? '#38bdf8' : '#fde047',
        shadowBlur: s.isAirborne ? 18 : 10,
        shadowColor: s.isAirborne ? 'rgba(56, 189, 248, 0.9)' : 'rgba(253, 224, 71, 0.7)',
      });

      ctx.restore();

      // Render Floating Trick Effects
      s.trickEffects.forEach((eff) => {
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = eff.color;
        ctx.textAlign = 'center';
        ctx.fillText(eff.text, eff.x, eff.y);
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
      gameId: 'arcade_halfpipe_air',
      gameTitle: '블리츠 하프파이프 에어',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : 1000) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.score >= 2000,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 펌프 런칭 & 에어 트릭' : 'STEP 1: LAUNCH & AIR TRICKS',
      title: isKo ? '도약 후 공중에서 스와이프로 트릭을 펼치세요' : 'Launch from Ramp and Swipe for Aerial Tricks',
      description: isKo
        ? '가상 조이스틱 없이 램프 끝에서 위로 스와이프해 높은 에어를 띄운 뒤, 공중 체공 중 4방향 스와이프(좌/우/상/하)로 킥플립, 360 스핀, 슈퍼맨 등 화려한 트릭 콤보를 꽂아 넣으세요.'
        : 'Swipe up to blast into the air, and flick in 4 directions while airborne to execute radical skateboard tricks.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 모바일 퓨어 제스처 스와이프)',
            '공중 4방향 스와이프 트릭: 킥플립, 360 스핀, 힐플립, 슈퍼맨',
            '착지 시 클린 랜딩 보너스로 대량 점수 획득'
          ]
        : [
            'Zero Virtual Joysticks: 100% Pure Gesture Swipes',
            '4-Way Aerial Swipes: Kickflip, 360 Spin, Heelflip, Superman',
            'Clean landings award massive combo multipliers'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 스와이프 (Aerial Swipe)' : 'Aerial Swipe Gestures',
      description: isKo
        ? '도약은 위로 스와이프, 공중 트릭은 좌우상하로 빠르게 긁습니다.'
        : 'Flick up to launch, flick 4-ways to perform aerial tricks.',
      keyPoints: isKo
        ? [
            '🚀 위로 스와이프: 하프파이프 로켓 에어 도약',
            '🛹 4방향 스와이프: 실시간 익스트림 에어 트릭',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '🚀 Swipe Up: High-altitude rocket ramp launch',
            '🛹 4-Way Swipes: Real-time extreme aerial tricks',
            '⏱️ 35s time attack extreme sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '런 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '달성 트릭 및 클린 랜딩 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Air tricks and clean landing multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0f172a] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 하프파이프' : 'Blitz Halfpipe Air'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '고도' : 'Air', value: `${airHeight}m`, color: airHeight > 10 ? 'text-amber-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '트릭' : 'Trick', value: lastTrick || 'READY', color: 'text-yellow-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${trickCombo}x`, color: trickCombo > 4 ? 'text-emerald-400 font-bold' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Halfpipe Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-pointer shadow-2xl"
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
          {isKo ? '위로 스와이프해 에어 도약하고, 공중에서 4방향 스와이프로 트릭을 구사하세요' : 'Swipe up to launch into air, swipe 4-ways to perform aerial tricks'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_halfpipe_air"
          gameTitle={isKo ? '블리츠 하프파이프: 에어 트릭' : 'Blitz Halfpipe: Aerial Tricks'}
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
export default VoxelHalfpipeSkaterGame;
