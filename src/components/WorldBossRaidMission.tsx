import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface WorldBossRaidMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const WorldBossRaidMission: React.FC<WorldBossRaidMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [bossHp, setBossHp] = useState(5000);
  const maxBossHp = 5000;
  const [playerHp, setPlayerHp] = useState(100);
  const [combo, setCombo] = useState(0);
  const [totalDamage, setTotalDamage] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [bossStance, setBossStance] = useState<'idle' | 'charging' | 'attacking'>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_world_boss_raid') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const initGame = useCallback(() => {
    setBossHp(maxBossHp);
    setPlayerHp(100);
    setCombo(0);
    setTotalDamage(0);
    setTimeRemaining(45);
    setBossStance('idle');
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [maxBossHp]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Boss Attack Timer Loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) {
          // Time Over
          endGame(false, totalDamage);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const bossCycle = setInterval(() => {
      setBossStance('charging');
      setTimeout(() => {
        setBossStance('attacking');
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        setPlayerHp(hp => {
          const next = Math.max(0, hp - 20);
          if (next <= 0) {
            endGame(false, totalDamage);
          }
          return next;
        });
        setTimeout(() => setBossStance('idle'), 600);
      }, 1000);
    }, 4500);

    return () => {
      clearInterval(timer);
      clearInterval(bossCycle);
    };
  }, [isGameOver, isPaused, totalDamage]);

  const attackBoss = (multiplier: number) => {
    if (isGameOver || isPaused) return;

    const baseDmg = 120 + Math.floor(Math.random() * 60);
    const dmg = Math.floor(baseDmg * multiplier * (1 + combo * 0.05));
    const nextBossHp = Math.max(0, bossHp - dmg);
    const nextTotalDmg = totalDamage + dmg;
    const nextCombo = combo + 1;

    setBossHp(nextBossHp);
    setTotalDamage(nextTotalDmg);
    setCombo(nextCombo);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    if (nextBossHp <= 0) {
      endGame(true, nextTotalDmg);
    }
  };

  const endGame = (isVictory: boolean, dmg: number) => {
    setIsGameOver(true);
    const duration = (Date.now() - startTimeRef.current) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'mission_world_boss_raid',
      gameTitle: '월드 보스 레이드 토벌',
      durationSeconds: duration,
      score: dmg + (isVictory ? 5000 : 1000),
      difficulty: 'NIGHTMARE',
      isVictory: isVictory
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 월드 보스 완전 토벌' : 'STEP 1: SLAY WORLD BOSS',
      title: isKo ? '45초 타임어택 & 보스 HP 격파' : '45s Time Attack & Deplete Boss HP',
      description: isKo
        ? '강력한 공격 스킬과 콤보를 연계하여 45초 이내에 5,000 HP의 월드 보스를 격파하세요.'
        : 'Chain attack skills and combos to deplete 5,000 Boss HP within 45s.',
      keyPoints: isKo
        ? [
            '보스 HP 0 달성 시 레이드 완승',
            '보스의 차징 광역기 피격 주의 (HP -20)',
            '연속 공격 시 콤보 데미지 누적 배수'
          ]
        : [
            'Deplete Boss HP to 0 to win',
            'Beware of Boss charging AOE attacks',
            'Chain continuous attacks for combo multipliers'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '스킬 슬롯 원터치 시전' : 'One-Touch Skill Cast',
      description: isKo
        ? '하단 스킬 카드를 탭하여 일반 공격, 치명타, 필살기를 신속하게 연타합니다.'
        : 'Tap bottom skill cards to unleash Normal, Critical, and Ultimate attacks.',
      keyPoints: isKo
        ? [
            '⚔️ 일반 공격: 즉시 타격 (1.0x)',
            '⚡ 치명타: 강력한 돌진 (1.8x)',
            '🔥 필살기: 메가 버스트 (3.0x)'
          ]
        : [
            '⚔️ Normal Attack: Instant strike (1.0x)',
            '⚡ Critical: Heavy thrust (1.8x)',
            '🔥 Ultimate: Mega Burst (3.0x)'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '토벌 성공 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon boss defeat.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '누적 딜량 및 완승 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Total damage and victory multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '월드 보스 레이드' : 'World Boss Raid'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '시간' : 'Time', value: `${timeRemaining}s`, color: 'text-cyan-700 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${combo}x`, color: 'text-amber-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Boss Raid Arena Viewport */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden p-3 w-full max-w-sm">
        {/* Boss HP Gauge */}
        <div className="w-full max-w-xs mb-3 space-y-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-rose-600 font-bold">🔥 BOSS HP</span>
            <span className="text-slate-700">{bossHp} / {maxBossHp}</span>
          </div>
          <div className="w-full h-3 bg-black/10 rounded-none overflow-hidden border border-[rgba(15,0,0,0.15)]">
            <div
              className="h-full bg-rose-600 transition-all duration-150"
              style={{ width: `${(bossHp / maxBossHp) * 100}%` }}
            />
          </div>
        </div>

        {/* Boss Sprite Avatar */}
        <div
          className={`w-36 h-36 border-2 flex flex-col items-center justify-center rounded-none shadow-md transition-all ${
            bossStance === 'attacking'
              ? 'bg-rose-600 border-rose-700 text-white scale-110'
              : bossStance === 'charging'
              ? 'bg-amber-400 border-amber-500 text-[#201d1d] animate-pulse'
              : 'bg-slate-900 border-slate-950 text-white'
          }`}
        >
          <span className="text-5xl">{bossStance === 'attacking' ? '💥' : bossStance === 'charging' ? '⚡' : '🐲'}</span>
          <span className="text-[10px] font-bold mt-1 tracking-wider">
            {bossStance === 'attacking' ? 'ATTACK!' : bossStance === 'charging' ? 'CHARGING...' : 'WORLD DRAGON'}
          </span>
        </div>

        <div className="text-xs font-bold text-slate-500 mt-3">
          {isKo ? `누적 데미지: ${totalDamage.toLocaleString()} DMG` : `Total DMG: ${totalDamage.toLocaleString()}`}
        </div>
      </div>

      {/* Skill Attack Control Bar */}
      <div className="shrink-0 w-full max-w-sm px-4 pb-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => attackBoss(1.0)}
          disabled={isGameOver || isPaused}
          className="flex-1 py-3 bg-[#201d1d] text-white rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs"
        >
          ⚔️ {isKo ? '일반 공격' : 'Attack'}
        </button>
        <button
          type="button"
          onClick={() => attackBoss(1.8)}
          disabled={isGameOver || isPaused}
          className="flex-1 py-3 bg-amber-500 text-[#201d1d] rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs border border-amber-600"
        >
          ⚡ {isKo ? '치명타' : 'Crit'}
        </button>
        <button
          type="button"
          onClick={() => attackBoss(3.0)}
          disabled={isGameOver || isPaused}
          className="flex-1 py-3 bg-rose-600 text-white rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs"
        >
          🔥 {isKo ? '필살기' : 'Ult'}
        </button>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_world_boss_raid"
          gameTitle={isKo ? '월드 보스 레이드 토벌 미션' : 'World Boss Raid Mission'}
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
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default WorldBossRaidMission;
