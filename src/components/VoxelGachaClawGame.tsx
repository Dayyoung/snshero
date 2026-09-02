import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelGachaClawGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface GachaCapsule {
  id: number;
  x: number;
  y: number;
  vy: number;
  tier: 'NORMAL' | 'RARE' | 'HERO' | 'LEGENDARY';
  cardId: number;
  color: string;
  icon: string;
  prizeIcon: string;
  prizeName: string;
  prizeEnName: string;
  points: number;
  radius: number;
  isPopped: boolean;
}

const CAPSULE_TIERS = [
  { tier: 'NORMAL', weight: 0.5, cardId: 13, color: '#ef4444', icon: '🔴', prizeIcon: '🧸', prizeName: '곰인형', prizeEnName: 'Teddy Bear', points: 100, radius: 24 },
  { tier: 'RARE', weight: 0.3, cardId: 31, color: '#0ea5e9', icon: '🔵', prizeIcon: '🤖', prizeName: '로봇 피규어', prizeEnName: 'Robot Figure', points: 250, radius: 26 },
  { tier: 'HERO', weight: 0.15, cardId: 62, color: '#a855f7', icon: '🟣', prizeIcon: '🐉', prizeName: '드래곤 피규어', prizeEnName: 'Dragon Figure', points: 500, radius: 28 },
  { tier: 'LEGENDARY', weight: 0.05, cardId: 100, color: '#eab308', icon: '🟡', prizeIcon: '👑', prizeName: '황금 왕관 피규어', prizeEnName: 'Golden Crown', points: 1000, radius: 32 },
];

export const VoxelGachaClawGame: React.FC<VoxelGachaClawGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 85;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [poppedCount, setPoppedCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [popCombo, setPopCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [legendaryCount, setLegendaryCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_gacha_burst') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    capsules: [] as GachaCapsule[],
    popEffects: [] as { x: number; y: number; text: string; color: string; life: number }[],
    popped: 0,
    legendary: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    capsuleCounter: 1,
    spawnTimer: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.capsules = [];
    s.popEffects = [];
    s.popped = 0;
    s.legendary = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.capsuleCounter = 1;
    s.spawnTimer = 0;

    setPoppedCount(0);
    setScore(0);
    setPopCombo(0);
    setMaxCombo(0);
    setLegendaryCount(0);
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
          const isTargetMet = stateRef.current.popped >= 15;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Touch / Pointer Direct Tap to Pop Gacha Capsule (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const tapX = (e.clientX - rect.left) * scaleX;
    const tapY = (e.clientY - rect.top) * scaleY;

    // Check hit on falling capsules (prioritize newest/highest layer)
    for (let i = s.capsules.length - 1; i >= 0; i--) {
      const cap = s.capsules[i];
      if (!cap.isPopped && Math.hypot(cap.x - tapX, cap.y - tapY) < cap.radius + 16) {
        cap.isPopped = true;
        s.popped += 1;
        s.combo += 1;
        if (s.combo > s.maxCombo) s.maxCombo = s.combo;

        if (cap.tier === 'LEGENDARY') {
          s.legendary += 1;
          setLegendaryCount(s.legendary);
        }

        const pts = cap.points + s.combo * 25;
        s.score += pts;

        setScore(s.score);
        setPopCombo(s.combo);
        setMaxCombo(s.maxCombo);
        setPoppedCount(s.popped);

        // Pop Floating Effect
        s.popEffects.push({
          x: cap.x,
          y: cap.y,
          text: `${cap.prizeIcon} +${pts}P`,
          color: cap.color,
          life: 0.8,
        });

        if (cap.tier === 'LEGENDARY') {
          setFeedbackText(`🎉 LEGENDARY POP! +${pts}P 👑`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        } else {
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
        setTimeout(() => setFeedbackText(null), 400);

        s.capsules.splice(i, 1);
        return;
      }
    }

    // Miss tap
    s.combo = 0;
    setPopCombo(0);
  };

  // Main 60FPS Gacha Burst Engine Loop
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

      // Spawn falling capsules
      s.spawnTimer += dt;
      const spawnRate = s.timeLeft <= 10 ? 0.35 : 0.6; // Fever Burst in last 10s!
      if (s.spawnTimer >= spawnRate && s.capsules.length < 10) {
        s.spawnTimer = 0;

        // Determine Tier
        const randVal = Math.random();
        let tierTemplate = CAPSULE_TIERS[0];
        if (randVal < 0.08) {
          tierTemplate = CAPSULE_TIERS[3]; // Legendary
        } else if (randVal < 0.25) {
          tierTemplate = CAPSULE_TIERS[2]; // Hero
        } else if (randVal < 0.6) {
          tierTemplate = CAPSULE_TIERS[1]; // Rare
        }

        s.capsules.push({
          id: s.capsuleCounter++,
          x: 40 + Math.random() * 280,
          y: 40, // Drop from Gacha Machine Dispenser
          vy: 80 + Math.random() * 80 + (tierTemplate.tier === 'LEGENDARY' ? 40 : 0),
          tier: tierTemplate.tier as 'NORMAL' | 'RARE' | 'HERO' | 'LEGENDARY',
          cardId: tierTemplate.cardId,
          color: tierTemplate.color,
          icon: tierTemplate.icon,
          prizeIcon: tierTemplate.prizeIcon,
          prizeName: tierTemplate.prizeName,
          prizeEnName: tierTemplate.prizeEnName,
          points: tierTemplate.points,
          radius: tierTemplate.radius,
          isPopped: false,
        });
      }

      // Update Capsules Fall Motion
      for (let i = s.capsules.length - 1; i >= 0; i--) {
        const cap = s.capsules[i];
        cap.y += cap.vy * dt;

        // Dropped below bottom
        if (cap.y > 470) {
          s.capsules.splice(i, 1);
        }
      }

      // Update Pop Effects
      for (let i = s.popEffects.length - 1; i >= 0; i--) {
        const eff = s.popEffects[i];
        eff.y -= 35 * dt;
        eff.life -= dt;
        if (eff.life <= 0) {
          s.popEffects.splice(i, 1);
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Cyber Arcade Game Center Background
      ctx.fillStyle = '#0e0b1f';
      ctx.fillRect(0, 0, w, h);

      // Top Gacha Machine Roof & Dispenser
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(20, 10, w - 40, 45);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 10, w - 40, 45);

      // Hero Gacha Master Emblem
      drawCardSprite(
        ctx,
        playerHeroId,
        28,
        16,
        32,
        32,
        {
          circleClip: true,
          borderWidth: 1.5,
          borderColor: '#c084fc',
          shadowBlur: 8,
          shadowColor: 'rgba(192, 132, 252, 0.8)',
        }
      );

      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎰 LUCKY GACHA BURST 🎁', w / 2 + 16, 32);

      // Bottom Collection Tray
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(20, 440, w - 40, 50);
      ctx.strokeStyle = '#818cf8';
      ctx.strokeRect(20, 440, w - 40, 50);
      ctx.font = '13px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('🔻 GACHA DROP TRAY 🔻', w / 2, 465);

      // Render Falling Gacha Capsules (Card Sprites)
      s.capsules.forEach((cap) => {
        const rad = cap.radius;
        drawCardSprite(
          ctx,
          cap.cardId,
          cap.x - rad,
          cap.y - rad,
          rad * 2,
          rad * 2,
          {
            circleClip: true,
            borderWidth: cap.tier === 'LEGENDARY' ? 2.5 : cap.tier === 'HERO' ? 2 : 1.5,
            borderColor: cap.color,
            shadowBlur: cap.tier === 'LEGENDARY' ? 14 : cap.tier === 'HERO' ? 10 : 4,
            shadowColor: cap.color,
          }
        );
      });

      // Render Pop Floating Effects
      s.popEffects.forEach((eff) => {
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = eff.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
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
      gameId: 'arcade_gacha_burst',
      gameTitle: '블리츠 가챠 버스트',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : s.popped * 150) + s.legendary * 500,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.popped >= 15,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 가챠 캡슐 탭 팝핑' : 'STEP 1: TAP TO POP CAPSULES',
      title: isKo ? '떨어지는 캡슐을 탭해 피규어를 획득하세요' : 'Tap Falling Gacha Capsules to Pop and Collect Figures',
      description: isKo
        ? '가상 조이스틱 없이 화면 상단 가챠 머신에서 쏟아지는 캡슐(🔴🧸, 🔵🤖, 🟣🐉, 🟡👑)을 손가락으로 빠르게 직접 탭하여 터뜨리고 점수를 획득하세요.'
        : 'Directly tap colorful gacha capsules falling from the dispenser to collect toys and earn massive points.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 캡슐 직접 원터치 탭 팝)',
            '황금 전설 캡슐(🟡👑) 터뜨릴 시 1,000P 잭팟',
            '35초간 최대 콤보로 피규어 도감을 완성하세요'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Popping',
            'Golden Legendary Capsules (🟡👑) grant 1,000P jackpot',
            'Chain continuous pops for high combo score multipliers'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 타깃 탭 (Direct Target Tap)' : 'Direct Screen Tap',
      description: isKo
        ? '낙하하는 캡슐을 눈으로 쫓으며 손가락으로 톡톡 터치합니다.'
        : 'Tap rapidly on descending capsules before they fall into the tray.',
      keyPoints: isKo
        ? [
            '👆 타깃 직접 탭: 즉각적인 캡슐 팝핑 타격 피드백',
            '⚡ 마지막 10초 피버 버스트 모드로 대량 캡슐 쏟아짐',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Direct Tap: Instant responsive capsule burst effects',
            '⚡ Final 10s triggers Fever Burst mode with rushing capsules',
            '⏱️ 35s time attack arcade sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '가챠 종료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '터뜨린 캡슐 수 및 전설 피규어 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Popped capsules and legendary figures multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#090615] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 가챠 버스트' : 'Blitz Gacha Burst'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '획득' : 'Popped', value: `${poppedCount}개`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '전설' : 'Legend', value: `${legendaryCount}👑`, color: 'text-yellow-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${popCombo}x`, color: popCombo > 4 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Gacha Burst Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
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
          {isKo ? '쏟아지는 가챠 캡슐을 빠르게 탭하여 피규어를 수집하세요' : 'Tap falling gacha capsules rapidly to pop and collect toys'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_gacha_burst"
          gameTitle={isKo ? '블리츠 가챠 버스트: 캡슐 팝' : 'Blitz Gacha Burst: Capsule Pop'}
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
export default VoxelGachaClawGame;
