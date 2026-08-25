import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelGladiatorColosseumGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface RivalGladiator {
  id: number;
  name: string;
  enName: string;
  avatar: string;
  maxHp: number;
  attackInterval: number; // seconds
}

const RIVALS: RivalGladiator[] = [
  { id: 1, name: '철벽의 트레보', enName: 'Trevor the Iron', avatar: '🛡️', maxHp: 180, attackInterval: 1.8 },
  { id: 2, name: '화염검의 이그니스', enName: 'Ignis the Flame', avatar: '⚔️', maxHp: 260, attackInterval: 1.4 },
  { id: 3, name: '패왕 막시무스', enName: 'Maximus the Warlord', avatar: '👑', maxHp: 380, attackInterval: 1.1 },
];

export const VoxelGladiatorColosseumGame: React.FC<VoxelGladiatorColosseumGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 61;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [currentRivalIdx, setCurrentRivalIdx] = useState<number>(0);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [enemyHp, setEnemyHp] = useState<number>(180);
  const [score, setScore] = useState<number>(0);
  const [duelCombo, setDuelCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_gladiator_duel') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    rivalIdx: 0,
    playerHp: 100,
    enemyHp: 180,
    isEnemyAttacking: false,
    enemyAttackTimer: 0,
    enemyStunTimer: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    touchStart: { x: 0, y: 0 },
    hitEffects: [] as { x: number; y: number; text: string; color: string; life: number }[],
  });

  const setupRival = useCallback((idx: number) => {
    const s = stateRef.current;
    const rival = RIVALS[idx] || RIVALS[0];
    s.rivalIdx = idx;
    s.enemyHp = rival.maxHp;
    s.isEnemyAttacking = false;
    s.enemyAttackTimer = 0;
    s.enemyStunTimer = 0;

    setCurrentRivalIdx(idx);
    setEnemyHp(rival.maxHp);
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.playerHp = 100;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.hitEffects = [];

    setPlayerHp(100);
    setScore(0);
    setDuelCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);

    setupRival(0);
  }, [setupRival]);

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

  // Touch Handlers: Tap to Attack / Swipe to Parry (Zero Joysticks)
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

    if (dist > 30) {
      // Swipe Action: PARRY / DEFLECT!
      if (s.isEnemyAttacking) {
        // Perfect Parry Clash!
        s.isEnemyAttacking = false;
        s.enemyStunTimer = 2.0; // Stun enemy for 2 sec!
        s.combo += 1;
        if (s.combo > s.maxCombo) s.maxCombo = s.combo;

        s.score += 300 + s.combo * 40;
        setScore(s.score);
        setDuelCombo(s.combo);
        setMaxCombo(s.maxCombo);

        setFeedbackText(`PERFECT PARRY! ⚔️ STUNNED!`);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        setTimeout(() => setFeedbackText(null), 500);

        s.hitEffects.push({
          x: 180,
          y: 240,
          text: '⚡ PARRY!',
          color: '#38bdf8',
          life: 0.7,
        });
      } else {
        // Normal Blade Slash
        triggerPlayerAttack(40, true);
      }
    } else {
      // Tap Action: RAPID FLURRY STRIKE!
      triggerPlayerAttack(25, false);
    }
  };

  const triggerPlayerAttack = (dmg: number, isHeavy: boolean) => {
    const s = stateRef.current;
    const isStunned = s.enemyStunTimer > 0;
    const finalDmg = isStunned ? dmg * 2 : dmg;

    s.enemyHp = Math.max(0, s.enemyHp - finalDmg);
    s.combo += 1;
    if (s.combo > s.maxCombo) s.maxCombo = s.combo;

    s.score += 80 + s.combo * 15;
    setEnemyHp(s.enemyHp);
    setScore(s.score);
    setDuelCombo(s.combo);
    setMaxCombo(s.maxCombo);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    s.hitEffects.push({
      x: 150 + Math.random() * 60,
      y: 200 + Math.random() * 50,
      text: isStunned ? `CRITICAL! -${finalDmg} 💥` : `-${finalDmg}`,
      color: isStunned ? '#fde047' : '#f43f5e',
      life: 0.6,
    });

    // Check Rival Defeat
    if (s.enemyHp <= 0) {
      if (s.rivalIdx < RIVALS.length - 1) {
        setFeedbackText(`CHAMPION DEFEATED! 🏆`);
        s.score += 1000;
        setScore(s.score);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        setTimeout(() => {
          setFeedbackText(null);
          setupRival(s.rivalIdx + 1);
        }, 800);
      } else {
        // Slay Maximus to Win!
        endGame(true);
      }
    }
  };

  // Main 60FPS Duel Battle Loop
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

      const rival = RIVALS[s.rivalIdx] || RIVALS[0];

      // Update Stun & Enemy Attack AI
      if (s.enemyStunTimer > 0) {
        s.enemyStunTimer -= dt;
      } else {
        s.enemyAttackTimer += dt;
        if (s.enemyAttackTimer >= rival.attackInterval - 0.45 && !s.isEnemyAttacking) {
          // Warning state: Flash Red!
          s.isEnemyAttacking = true;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        }

        if (s.enemyAttackTimer >= rival.attackInterval) {
          // Enemy Strike Lands!
          s.enemyAttackTimer = 0;
          s.isEnemyAttacking = false;
          s.playerHp = Math.max(0, s.playerHp - 22);
          s.combo = 0;
          setPlayerHp(s.playerHp);
          setDuelCombo(0);
          setFeedbackText(isKo ? '피격 당함! -22 HP 💔' : 'HIT TAKEN! -22 HP 💔');
          setTimeout(() => setFeedbackText(null), 350);

          if (s.playerHp <= 0) {
            endGame(false);
            return;
          }
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

      // Colosseum Sand Arena Background
      ctx.fillStyle = '#1c130d';
      ctx.fillRect(0, 0, w, h);

      // Arena Torch Pillars
      ctx.fillStyle = '#451a03';
      ctx.fillRect(15, 60, 20, 360);
      ctx.fillRect(w - 35, 60, 20, 360);
      ctx.font = '20px serif';
      ctx.fillText('🔥', 15, 65);
      ctx.fillText('🔥', w - 35, 65);

      // Sand Ground Oval
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(w / 2, 340, 140, 60, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Render Enemy Gladiator
      const enemyY = 240;
      ctx.save();
      if (s.isEnemyAttacking) {
        // Red Flashing Rage
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 20;
      }

      ctx.font = s.isEnemyAttacking ? '70px serif' : '60px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rival.avatar, w / 2, enemyY);
      ctx.restore();

      // Enemy Stunned Stars
      if (s.enemyStunTimer > 0) {
        ctx.font = '22px serif';
        ctx.fillText('💫😵💫', w / 2, enemyY - 50);
      }

      // Enemy Attack Warning Indicator
      if (s.isEnemyAttacking) {
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ SWIPE TO PARRY! ⚠️', w / 2, enemyY - 60);
      }

      // Enemy Health Bar at Top
      const barW = 220;
      const barH = 10;
      const barX = (w - barW) / 2;
      const barY = 110;

      ctx.fillStyle = '#374151';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(barX, barY, barW * (s.enemyHp / rival.maxHp), barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.fillText(`${isKo ? rival.name : rival.enName} [${s.enemyHp}/${rival.maxHp}]`, w / 2, barY - 10);

      // Player Sword at Bottom-Right
      ctx.font = '40px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🗡️', w / 2 + 50, 420);

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
  }, [isKo, playSfx]);

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
      gameId: 'arcade_gladiator_duel',
      gameTitle: '블리츠 글래디에이터 듀얼',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (s.rivalIdx + 1) * 600) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.rivalIdx >= 2,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 탭 공격 & 스와이프 패링' : 'STEP 1: TAP ATTACK & SWIPE PARRY',
      title: isKo ? '화면을 탭해 공격하고 스와이프로 쳐내세요' : 'Tap to Rapid Slash, Swipe to Parry Enemy Strikes',
      description: isKo
        ? '가상 조이스틱 없이 화면을 탭하여 연속 검격을 가하고, 적이 붉게 번쩍이며 공격할 때(⚠️) 화면을 슥 스와이프하여 패링 쳐내고 스턴 그로기에 빠뜨리세요.'
        : 'Tap rapidly to unleash combo slashes, and swipe across the screen when the enemy flashes red to parry.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 탭 연속 공격 & 스와이프 패링)',
            '패링 성공 시 적이 2초간 스턴되며 2배 크리티컬 폭딜',
            '3인의 검투 챔피언을 모두 쓰러뜨리고 패왕에 등극하세요'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Rush & Swipe Parry',
            'Successful parries stun enemies for 2x critical damage',
            'Defeat all 3 colosseum champions to claim the throne'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 탭 & 스와이프 (Tap & Swipe)' : 'Tap & Swipe Gestures',
      description: isKo
        ? '적의 빈틈에 폭풍 연타를 넣고, 공격 타이밍에 날카롭게 스와이프합니다.'
        : 'Tap for flurry combos and flick quickly for parry counter-attacks.',
      keyPoints: isKo
        ? [
            '👆 빠른 탭: 폭풍 연속 난타 검격 콤보',
            '⚡ 슥 스와이프: 칼날 쳐내기 패링 반격',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Fast Tap: Rapid-fire sword flurry combos',
            '⚡ Quick Swipe: Blade-deflecting parry counter',
            '⏱️ 35s time attack duel sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '결투 승리 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '격파 챔피언 및 패링 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Defeated champions and parry combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  const currentRival = RIVALS[currentRivalIdx] || RIVALS[0];

  return (
    <div className="relative w-full h-[100dvh] bg-[#120b06] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 글래디에이터' : 'Blitz Gladiator Duel'}
        language={(language as Language) || 'ko'}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '챔피언' : 'Champion', value: `${currentRivalIdx + 1}/${RIVALS.length} ${isKo ? currentRival.name : currentRival.enName}`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${duelCombo}x`, color: duelCombo > 4 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Gladiator Duel Canvas Viewport */}
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
          {isKo ? '화면을 탭해 연속 공격하고, 적 공격(⚠️) 시 스와이프해 패링하세요' : 'Tap to attack, swipe when enemy strikes (⚠️) to parry'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_gladiator_duel"
          gameTitle={isKo ? '블리츠 글래디에이터: 1:1 결투' : 'Blitz Gladiator: 1v1 Duel'}
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
export default VoxelGladiatorColosseumGame;
