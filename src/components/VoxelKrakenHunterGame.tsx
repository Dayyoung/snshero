import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelKrakenHunterGameProps {
  deck: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Tentacle {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  isCut: boolean;
  angle: number;
}

export const VoxelKrakenHunterGame: React.FC<VoxelKrakenHunterGameProps> = ({
  deck: _deck,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [krakenHp, setKrakenHp] = useState<number>(600);
  const maxKrakenHp = 600;
  const [tentaclesCut, setTentaclesCut] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [slayCombo, setSlayCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_kraken_slayer') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    krakenHp: 600,
    tentacles: [] as Tentacle[],
    groggyTimer: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    tentaclesCutTotal: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    tentacleCounter: 1,
    spawnTimer: 0,
    touchStart: { x: 0, y: 0 },
    hitEffects: [] as { x: number; y: number; text: string; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.krakenHp = 600;
    s.tentacles = [];
    s.groggyTimer = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.tentaclesCutTotal = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.tentacleCounter = 1;
    s.spawnTimer = 0;
    s.hitEffects = [];

    // Initial 4 Tentacles around Kraken
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      s.tentacles.push({
        id: s.tentacleCounter++,
        x: 180 + Math.cos(angle) * 110,
        y: 260 + Math.sin(angle) * 90,
        hp: 50,
        maxHp: 50,
        isCut: false,
        angle,
      });
    }

    setKrakenHp(600);
    setTentaclesCut(0);
    setScore(0);
    setSlayCombo(0);
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

  // Touch Handlers: Swipe to Cut Tentacles / Tap to Harpoon Core (Zero Joysticks)
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

    if (dist > 25) {
      // Swipe: TENTACLE SLICE!
      let sliced = false;
      s.tentacles.forEach((t) => {
        if (!t.isCut && Math.hypot(t.x - endX, t.y - endY) < 55) {
          t.hp -= 35;
          sliced = true;

          if (t.hp <= 0) {
            t.isCut = true;
            s.tentaclesCutTotal += 1;
            setTentaclesCut(s.tentaclesCutTotal);

            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            s.score += 300 + s.combo * 20;
            setScore(s.score);
            setSlayCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`TENTACLE SLICED! +300P ⚔️`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            setTimeout(() => setFeedbackText(null), 300);

            s.hitEffects.push({
              x: t.x,
              y: t.y,
              text: '💥 SEVERED!',
              color: '#38bdf8',
              life: 0.6,
            });
          }
        }
      });

      if (sliced) {
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

        // Check if all tentacles are cut -> Trigger Groggy State!
        const allCut = s.tentacles.every((t) => t.isCut);
        if (allCut && s.groggyTimer <= 0) {
          s.groggyTimer = 3.0; // 3 sec groggy!
          setFeedbackText(`👑 GROGGY! CORE EXPOSED! 2X CRIT! 👑`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          setTimeout(() => setFeedbackText(null), 600);
        }
      }
    } else {
      // Tap: HARPOON STRIKE ON KRAKEN EYE/CORE!
      const coreX = 180;
      const coreY = 240;
      if (Math.hypot(endX - coreX, endY - coreY) < 70) {
        const isGroggy = s.groggyTimer > 0;
        const dmg = isGroggy ? 60 : 25;

        s.krakenHp = Math.max(0, s.krakenHp - dmg);
        setKrakenHp(s.krakenHp);

        s.combo += 1;
        if (s.combo > s.maxCombo) s.maxCombo = s.combo;

        const pts = (isGroggy ? 150 : 60) + s.combo * 10;
        s.score += pts;
        setScore(s.score);
        setSlayCombo(s.combo);
        setMaxCombo(s.maxCombo);

        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        s.hitEffects.push({
          x: endX + (Math.random() - 0.5) * 30,
          y: endY + (Math.random() - 0.5) * 30,
          text: isGroggy ? `CRIT! -${dmg} 🔱` : `-${dmg}`,
          color: isGroggy ? '#fde047' : '#f43f5e',
          life: 0.5,
        });

        if (s.krakenHp <= 0) {
          endGame(true);
        }
      }
    }
  };

  // Main 60FPS Kraken Deep Sea Loop
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

      // Update Groggy Timer & Tentacle Respawn
      if (s.groggyTimer > 0) {
        s.groggyTimer -= dt;
        if (s.groggyTimer <= 0) {
          // Respawn Tentacles
          s.tentacles.forEach((t) => {
            t.isCut = false;
            t.hp = t.maxHp;
          });
        }
      }

      // Update Hit Effects
      for (let i = s.hitEffects.length - 1; i >= 0; i--) {
        const eff = s.hitEffects[i];
        eff.y -= 30 * dt;
        eff.life -= dt;
        if (eff.life <= 0) s.hitEffects.splice(i, 1);
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Abyssal Deep Sea Background (Dark Oceanic Cyan)
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, '#02131e');
      oceanGrad.addColorStop(0.5, '#042f48');
      oceanGrad.addColorStop(1, '#064e77');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, w, h);

      // Deep Sea Vortex Swirl
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 3;
      [50, 100, 150].forEach((r) => {
        ctx.beginPath();
        ctx.arc(w / 2, 240, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Render Kraken Tentacles
      s.tentacles.forEach((t) => {
        if (!t.isCut) {
          ctx.save();
          ctx.translate(t.x, t.y);
          ctx.font = '40px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🐙', 0, 0);

          // Tentacle Mini HP Bar
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-15, 22, 30, 4);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-15, 22, 30 * (t.hp / t.maxHp), 4);
          ctx.restore();
        }
      });

      // Render Kraken Central Core Eye
      const coreX = 180;
      const coreY = 240;
      ctx.save();
      ctx.translate(coreX, coreY);

      if (s.groggyTimer > 0) {
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 25;
      }

      ctx.font = s.groggyTimer > 0 ? '70px serif' : '62px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.groggyTimer > 0 ? '💫' : '👁️', 0, 0);
      ctx.restore();

      // Boss Health Bar at Top
      const barW = 240;
      const barH = 10;
      const barX = (w - barW) / 2;
      const barY = 90;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(barX, barY, barW * (s.krakenHp / maxKrakenHp), barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.fillText(`심해의 지배자 크라켄 [${s.krakenHp}/${maxKrakenHp}]`, w / 2, barY - 10);

      // Render Floating Hit Effects
      s.hitEffects.forEach((eff) => {
        ctx.font = 'bold 15px monospace';
        ctx.fillStyle = eff.color;
        ctx.textAlign = 'center';
        ctx.fillText(eff.text, eff.x, eff.y);
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
      gameId: 'arcade_kraken_slayer',
      gameTitle: '블리츠 크라켄 슬레이어',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : 800) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.krakenHp <= 100,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 촉수 슬라이스 & 코어 작살' : 'STEP 1: SLICE TENTACLES & HARPOON',
      title: isKo ? '촉수를 베어내고 본체 눈동자를 연속 타격하세요' : 'Slice Tentacles and Tap to Harpoon Core',
      description: isKo
        ? '가상 조이스틱 없이 솟구치는 촉수(🐙)를 손가락 스와이프로 잘라내고, 촉수가 모두 잘려 그로기(💫) 상태가 되면 중앙의 거대 눈동자를 광속 탭하여 작살로 2배 크리티컬 폭딜을 꽂아 넣으세요.'
        : 'Swipe to sever surrounding tentacles, then rapidly tap the exposed eye during groggy for 2x critical damage.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 스와이프 절단 & 탭 작살 난사)',
            '촉수 전멸 시 3초간 그로기 코어 노출 & 2배 크리티컬',
            '35초 타임어택 내 심해 지배자 크라켄 완전 토벌'
          ]
        : [
            'Zero Virtual Joysticks: 100% Swipe Slice & Tap Harpoon',
            'Severing all tentacles triggers 3s groggy for 2x crit damage',
            'Slay the abyssal Kraken within 35s time attack'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 스와이프 & 연타 탭 (Swipe & Tap)' : 'Swipe & Rapid Tap Gestures',
      description: isKo
        ? '촉수는 손가락으로 빗겨 긋고, 코어는 연타로 두드립니다.'
        : 'Slice tentacles with quick swipes and hammer the eye with rapid taps.',
      keyPoints: isKo
        ? [
            '⚡ 스와이프: 실시간 촉수 일도양단 절단',
            '👆 고속 탭: 거대 눈동자 작살 폭풍 난타',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '⚡ Quick Swipe: Slice through emerging tentacles',
            '👆 Fast Tap: Unleash barrage of harpoon strikes',
            '⏱️ 35s time attack boss raid'
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
            '절단 촉수 및 보스 데미지 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Severed tentacles and boss damage combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#02131e] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 크라켄' : 'Blitz Kraken Slayer'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '촉수' : 'Tentacles', value: `${tentaclesCut}개 절단`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '체력' : 'Boss HP', value: `${krakenHp}/${maxKrakenHp}`, color: krakenHp <= 200 ? 'text-rose-500 font-bold animate-pulse' : 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${slayCombo}x`, color: slayCombo > 4 ? 'text-emerald-400 font-bold' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Kraken Boss Raid Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-crosshair shadow-2xl"
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
          {isKo ? '촉수를 스와이프로 자르고, 그로기 시 중앙 눈동자를 연타해 타격하세요' : 'Swipe to slice tentacles, tap the central eye during groggy'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_kraken_slayer"
          gameTitle={isKo ? '블리츠 크라켄: 심해 보스 토벌' : 'Blitz Kraken: Deep Sea Raid'}
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
export default VoxelKrakenHunterGame;
