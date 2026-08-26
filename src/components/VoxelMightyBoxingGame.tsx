import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMightyBoxingGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelMightyBoxingGame: React.FC<VoxelMightyBoxingGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 81;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [enemyHp, setEnemyHp] = useState<number>(100);
  const [enemyDowns, setEnemyDowns] = useState<number>(0);
  const maxDowns = 3;
  const [score, setScore] = useState<number>(0);
  const [boxingCombo, setBoxingCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_boxing_champ') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    enemyHp: 100,
    enemyDowns: 0,
    enemyState: 'idle' as 'idle' | 'windup' | 'punch' | 'hit' | 'down',
    enemyTimer: 1.5,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    touchStart: { x: 0, y: 0, time: 0 },
    hitEffects: [] as { x: number; y: number; text: string; color: string; life: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.enemyHp = 100;
    s.enemyDowns = 0;
    s.enemyState = 'idle';
    s.enemyTimer = 1.5;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.hitEffects = [];
    s.particles = [];

    setEnemyHp(100);
    setEnemyDowns(0);
    setScore(0);
    setBoxingCombo(0);
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
          endGame(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Touch Handlers: Tap (Jab) / Horizontal Swipe (Hook) / Upward Swipe (Uppercut)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.enemyState === 'down') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.touchStart = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.enemyState === 'down') return;

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

    let punchType: 'jab' | 'hook' | 'uppercut' = 'jab';
    let baseDmg = 15;
    let basePts = 150;
    let punchText = 'JAB! 🥊';

    if (dist > 30) {
      if (dy < -25 && Math.abs(dy) > Math.abs(dx)) {
        // Upward Swipe: Uppercut!
        punchType = 'uppercut';
        baseDmg = 45;
        basePts = 600;
        punchText = '💥 UPPERCUT! 💥';
      } else {
        // Horizontal Swipe: Hook!
        punchType = 'hook';
        baseDmg = 30;
        basePts = 350;
        punchText = '⚡ HOOK! ⚡';
      }
    }

    const isCounter = s.enemyState === 'windup' || s.enemyState === 'punch';
    const finalDmg = isCounter ? baseDmg * 1.8 : baseDmg;
    const finalPts = isCounter ? basePts * 2 : basePts;

    s.enemyHp = Math.max(0, s.enemyHp - finalDmg);
    setEnemyHp(Math.round(s.enemyHp));

    s.combo += 1;
    if (s.combo > s.maxCombo) s.maxCombo = s.combo;

    const pts = finalPts + s.combo * 20;
    s.score += pts;

    setScore(s.score);
    setBoxingCombo(s.combo);
    setMaxCombo(s.maxCombo);

    s.enemyState = 'hit';
    s.enemyTimer = 0.35;

    // Particle Flash
    for (let p = 0; p < (punchType === 'uppercut' ? 12 : 6); p++) {
      s.particles.push({
        x: endX,
        y: endY,
        vx: (Math.random() - 0.5) * 250,
        vy: (Math.random() - 0.5) * 250,
        color: isCounter ? '#fde047' : '#f43f5e',
        life: 0.5,
      });
    }

    s.hitEffects.push({
      x: endX,
      y: endY - 20,
      text: isCounter ? `COUNTER ${punchText} +${pts}P` : `${punchText} +${pts}P`,
      color: isCounter ? '#fde047' : '#ffffff',
      life: 0.5,
    });

    if (punchType === 'uppercut') {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    } else {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    // Check Knockdown
    if (s.enemyHp <= 0) {
      s.enemyDowns += 1;
      setEnemyDowns(s.enemyDowns);
      s.enemyState = 'down';
      s.enemyTimer = 1.6;

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      setFeedbackText(`👑 DOWN! [${s.enemyDowns}/${maxDowns}] 👑`);
      setTimeout(() => setFeedbackText(null), 600);

      if (s.enemyDowns >= maxDowns) {
        endGame(true);
      }
    }
  };

  // Main 60FPS Boxing Ring Loop
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

      // Enemy AI State Machine
      s.enemyTimer -= dt;
      if (s.enemyTimer <= 0) {
        if (s.enemyState === 'down') {
          // Get back up!
          s.enemyHp = 100;
          setEnemyHp(100);
          s.enemyState = 'idle';
          s.enemyTimer = 1.0;
        } else if (s.enemyState === 'idle') {
          s.enemyState = 'windup';
          s.enemyTimer = 0.6;
        } else if (s.enemyState === 'windup') {
          s.enemyState = 'punch';
          s.enemyTimer = 0.4;
          // Enemy attacks!
          s.combo = 0;
          setBoxingCombo(0);
          setFeedbackText(isKo ? '적 카운터 펀치 피격! 💔' : 'ENEMY HIT! 💔');
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          setTimeout(() => setFeedbackText(null), 400);
        } else {
          s.enemyState = 'idle';
          s.enemyTimer = 0.8 + Math.random() * 0.5;
        }
      }

      // Update Hit Effects
      for (let i = s.hitEffects.length - 1; i >= 0; i--) {
        const eff = s.hitEffects[i];
        eff.y -= 35 * dt;
        eff.life -= dt;
        if (eff.life <= 0) s.hitEffects.splice(i, 1);
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

      // Boxing Ring Arena Background
      const ringGrad = ctx.createLinearGradient(0, 0, 0, h);
      ringGrad.addColorStop(0, '#1e1b4b');
      ringGrad.addColorStop(0.5, '#0f172a');
      ringGrad.addColorStop(1, '#3b0764');
      ctx.fillStyle = ringGrad;
      ctx.fillRect(0, 0, w, h);

      // Ring Ropes (Horizontal Lines)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      [140, 200, 260].forEach((ry) => {
        ctx.beginPath();
        ctx.moveTo(20, ry);
        ctx.lineTo(w - 20, ry);
        ctx.stroke();
      });

      // Render Rival Boxer (Card Sprite)
      const enemyX = 180;
      const enemyY = 260;

      ctx.save();
      ctx.translate(enemyX, enemyY);

      if (s.enemyState === 'down') {
        ctx.rotate(0.3);
      }

      drawCardSprite(
        ctx,
        54,
        -36,
        -36,
        72,
        72,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: s.enemyState === 'windup' ? '#fde047' : s.enemyState === 'punch' ? '#ef4444' : '#94a3b8',
          shadowBlur: s.enemyState === 'windup' ? 20 : 8,
          shadowColor: s.enemyState === 'windup' ? 'rgba(253, 224, 71, 0.9)' : s.enemyState === 'punch' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(148, 163, 184, 0.5)',
        }
      );

      // Status Badge
      if (s.enemyState === 'down') {
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('💫 DOWN!', 0, -45);
      } else if (s.enemyState === 'windup') {
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#fde047';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ COUNTER!', 0, -45);
      }

      ctx.restore();

      // Enemy HP Bar at Top
      const barW = 240;
      const barH = 10;
      const barX = (w - barW) / 2;
      const barY = 85;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(barX, barY, barW * (s.enemyHp / 100), barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.fillText(`${isKo ? '라이벌 챔피언' : 'Rival Champion'} [DOWN: ${s.enemyDowns}/${maxDowns}]`, w / 2, barY - 10);

      // Player Hero Boxer at Bottom
      drawCardSprite(
        ctx,
        playerHeroId,
        w / 2 - 28,
        410,
        56,
        56,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#38bdf8',
          shadowBlur: 14,
          shadowColor: 'rgba(56, 189, 248, 0.8)',
        }
      );

      // Render Floating Hit Effects
      s.hitEffects.forEach((eff) => {
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = eff.color;
        ctx.textAlign = 'center';
        ctx.fillText(eff.text, eff.x, eff.y);
      });

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isKo, playSfx, playerHeroId]);

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
      gameId: 'arcade_boxing_champ',
      gameTitle: '블리츠 복싱 챔프',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.enemyDowns * 1000) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.enemyDowns >= 2,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 퓨어 제스처 복싱 KO' : 'STEP 1: PURE GESTURE BOXING KO',
      title: isKo ? '탭과 스와이프로 펀치를 꽂아 3다운 KO를 달성하세요' : 'Tap & Swipe Punches to Claim 3-Down KO Championship',
      description: isKo
        ? '가상 버튼 없이 화면을 직접 탭(잽 🥊), 좌우 스와이프(훅 💥), 위로 스와이프(어퍼컷 ⚡)하여 상대 복서를 타격하고 3번 다운시켜 챔피언 벨트를 차지하세요.'
        : 'Use pure gestures: Tap for Jabs, Horizontal Swipe for Hooks, and Upward Swipe for crushing Uppercuts to score 3 knockdowns.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 탭/스와이프 퓨어 제스처 타격)',
            '적이 펀치를 모을 때 타격 시 카운터 2배 크리티컬',
            '35초간 3번 다운(KO)을 달성하고 챔피언 등극'
          ]
        : [
            'Zero Virtual Joysticks: 100% Pure Gesture Tap & Swipe Strikes',
            'Counter strikes when enemy charges grant 2x critical damage',
            'Score 3 Knockdowns (KO) within 35s to win'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '탭 / 훅 / 어퍼컷 제스처' : 'Tap / Hook / Uppercut Gestures',
      description: isKo
        ? '화면을 터치하거나 빗겨 쓸어올립니다.'
        : 'Tap quickly or swipe upward/sideways.',
      keyPoints: isKo
        ? [
            '👆 탭: 광속 연타 스트레이트 잽 (150P)',
            '↔️ 좌우 스와이프: 파워풀 사이드 훅 (350P)',
            '⬆️ 위로 스와이프: 카운터 넉아웃 어퍼컷 (600P)'
          ]
        : [
            '👆 Tap: High-speed straight jab (150P)',
            '↔️ Horizontal Swipe: Powerful side hook (350P)',
            '⬆️ Upward Swipe: Devastating counter uppercut (600P)'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? 'KO 달성 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '다운 횟수 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Knockdowns and maximum combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#1e1b4b] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 복싱' : 'Blitz Boxing Champ'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '다운' : 'Down', value: `${enemyDowns}/${maxDowns}`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '체력' : 'Rival HP', value: `${enemyHp}%`, color: enemyHp <= 30 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Boxing Ring Canvas Viewport */}
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
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '탭: 잽 | 좌우 스와이프: 훅 | 위로 스와이프: 어퍼컷' : 'Tap: Jab | Swipe Left/Right: Hook | Swipe Up: Uppercut'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_boxing_champ"
          gameTitle={isKo ? '블리츠 복싱: 챔피언십' : 'Blitz Boxing: Championship'}
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
export default VoxelMightyBoxingGame;
