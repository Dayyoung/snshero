import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface GuildRaidCoopMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const GuildRaidCoopMission: React.FC<GuildRaidCoopMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [bossHp, setBossHp] = useState(8000);
  const maxBossHp = 8000;
  const [guildContribution, setGuildContribution] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [guildAllies, setGuildAllies] = useState<number>(3);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_guild_raid_coop') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const initGame = useCallback(() => {
    setBossHp(maxBossHp);
    setGuildContribution(0);
    setTimeRemaining(30);
    setGuildAllies(3);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [maxBossHp]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Guild Allies Auto DPS
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) {
          endGame(false, guildContribution);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const allyDps = setInterval(() => {
      const allyDamage = guildAllies * 80;
      setBossHp(hp => {
        const next = Math.max(0, hp - allyDamage);
        if (next <= 0) {
          endGame(true, guildContribution);
        }
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(allyDps);
    };
  }, [guildAllies, guildContribution, isGameOver, isPaused]);

  const tapRaidAttack = () => {
    if (isGameOver || isPaused) return;

    const myDmg = 150 + Math.floor(Math.random() * 50);
    const nextContribution = guildContribution + myDmg;
    const nextBossHp = Math.max(0, bossHp - myDmg);

    setGuildContribution(nextContribution);
    setBossHp(nextBossHp);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    if (nextBossHp <= 0) {
      endGame(true, nextContribution);
    }
  };

  const summonReinforcements = () => {
    if (isGameOver || isPaused || guildAllies >= 6) return;

    setGuildAllies(a => a + 1);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  };

  const endGame = (isVictory: boolean, contribution: number) => {
    setIsGameOver(true);
    const duration = (Date.now() - startTimeRef.current) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'mission_guild_raid_coop',
      gameTitle: '길드 레이드 협동 토벌',
      durationSeconds: duration,
      score: contribution + (isVictory ? 6000 : 1500),
      difficulty: 'NIGHTMARE',
      isVictory: isVictory
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 고대 골렘 합동 토벌' : 'STEP 1: CO-OP GOLEM RAID',
      title: isKo ? '길드원 협동 딜량 & 30초 타임어택' : 'Guild Co-Op DPS & 30s Attack',
      description: isKo
        ? '길드원들과 협동하여 30초 내에 8,000 HP의 고대 골렘을 쓰러뜨리고 길드 기여도를 높이세요.'
        : 'Team up with guild allies to take down 8,000 HP Golem in 30s.',
      keyPoints: isKo
        ? [
            '골렘 체력 0 소진 시 레이드 성공',
            '길드원 소환으로 자동 초당 딜량(DPS) 상승',
            '내 타격 기여도가 높을수록 추가 보너스'
          ]
        : [
            'Deplete Boss HP to 0 to win',
            'Summon reinforcements to increase auto DPS',
            'Higher contribution yields higher rewards'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '원터치 연타 & 원군 지원' : 'One-Touch Raid Taps',
      description: isKo
        ? '화면의 골렘을 연타하여 직접 딜을 넣고, 원군 호출 버튼을 탭하여 길드원을 증원합니다.'
        : 'Tap Golem to deal burst damage and summon guild reinforcements.',
      keyPoints: isKo
        ? [
            '👆 골렘 연타: 강력한 수동 타격 (+150 DMG)',
            '🚩 원군 호출: 길드원 자동 사격 화력 증원',
            '⚡ 실시간 길드 협동 딜 그래프'
          ]
        : [
            '👆 Tap Golem: Manual burst attack (+150 DMG)',
            '🚩 Reinforce: Boost ally automated DPS',
            '⚡ Real-time guild DPS contribution'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '레이드 종료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon raid finish.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '길드 기여도 및 토벌 성공 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Contribution and victory multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '길드 레이드 협동' : 'Guild Raid Co-Op'}
        language={language}
        telemetries={[
          { label: isKo ? '시간' : 'Time', value: `${timeRemaining}s`, color: 'text-cyan-700 font-bold' },
          { label: isKo ? '길드원' : 'Allies', value: `${guildAllies}명`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '내 기여' : 'Contrib', value: `${guildContribution}`, color: 'text-emerald-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Golem Raid Arena Viewport */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden p-3 w-full max-w-sm">
        {/* Boss HP Bar */}
        <div className="w-full max-w-xs mb-3 space-y-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-amber-600 font-bold">🗿 ANCIENT GOLEM</span>
            <span className="text-slate-700">{bossHp} / {maxBossHp}</span>
          </div>
          <div className="w-full h-3 bg-black/10 rounded-none overflow-hidden border border-[rgba(15,0,0,0.15)]">
            <div
              className="h-full bg-amber-600 transition-all duration-150"
              style={{ width: `${(bossHp / maxBossHp) * 100}%` }}
            />
          </div>
        </div>

        {/* Interactive Golem Box */}
        <button
          type="button"
          onClick={tapRaidAttack}
          disabled={isGameOver || isPaused}
          className="w-40 h-40 bg-slate-900 border-2 border-slate-950 text-white flex flex-col items-center justify-center rounded-none active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <span className="text-6xl">🗿</span>
          <span className="text-[10px] font-bold mt-2 text-amber-300">
            {isKo ? '탭하여 집중 공격!' : 'TAP TO ATTACK!'}
          </span>
        </button>

        <div className="text-xs font-bold text-slate-500 mt-3">
          {isKo ? `길드원 DPS 화력: +${guildAllies * 80} DMG/s` : `Guild Ally DPS: +${guildAllies * 80} DMG/s`}
        </div>
      </div>

      {/* Reinforce Button */}
      <div className="shrink-0 w-full max-w-sm px-4 pb-4 flex items-center justify-center">
        <button
          type="button"
          onClick={summonReinforcements}
          disabled={isGameOver || isPaused || guildAllies >= 6}
          className="w-full py-3 bg-[#201d1d] text-white rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs disabled:opacity-50"
        >
          🚩 {isKo ? `길드 원군 호출 (현재 ${guildAllies}/6)` : `Summon Guild Reinforcements (${guildAllies}/6)`}
        </button>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_guild_raid_coop"
          gameTitle={isKo ? '길드 레이드 협동 토벌 미션' : 'Guild Raid Co-Op Mission'}
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
export default GuildRaidCoopMission;
