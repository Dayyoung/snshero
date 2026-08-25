import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface TowerOfTrials50FMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const TowerOfTrials50FMission: React.FC<TowerOfTrials50FMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [currentFloor, setCurrentFloor] = useState(1);
  const maxFloor = 50;
  const [playerHp, setPlayerHp] = useState(100);
  const [guardianHp, setGuardianHp] = useState(80);
  const [maxGuardianHp, setMaxGuardianHp] = useState(80);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_tower_of_trials_50f') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const initGame = useCallback(() => {
    setCurrentFloor(1);
    setPlayerHp(100);
    setGuardianHp(80);
    setMaxGuardianHp(80);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const attackGuardian = (type: 'quick' | 'heavy') => {
    if (isGameOver || isPaused) return;

    let pDmg = type === 'quick' ? 30 + Math.floor(Math.random() * 15) : 55 + Math.floor(Math.random() * 20);
    let gDmg = type === 'quick' ? 8 + Math.floor(currentFloor * 0.5) : 16 + Math.floor(currentFloor * 0.8);

    const nextGuardianHp = Math.max(0, guardianHp - pDmg);
    const nextPlayerHp = Math.max(0, playerHp - gDmg);

    setGuardianHp(nextGuardianHp);
    setPlayerHp(nextPlayerHp);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    if (nextPlayerHp <= 0) {
      // Defeated on this floor
      setIsGameOver(true);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'mission_tower_of_trials_50f',
        gameTitle: '시련의 탑 50층 무한 등반',
        durationSeconds: duration,
        score: currentFloor * 400,
        difficulty: 'NIGHTMARE',
        isVictory: currentFloor >= 10
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
      return;
    }

    if (nextGuardianHp <= 0) {
      if (currentFloor < maxFloor) {
        // Floor Clear! Climb up
        const nextFloor = currentFloor + 1;
        const nextMaxG = 80 + nextFloor * 15;
        setCurrentFloor(nextFloor);
        setMaxGuardianHp(nextMaxG);
        setGuardianHp(nextMaxG);
        setPlayerHp(hp => Math.min(100, hp + 20)); // Heal
        playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      } else {
        // 50F Conquer Victory!
        setIsGameOver(true);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        const duration = (Date.now() - startTimeRef.current) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'mission_tower_of_trials_50f',
          gameTitle: '시련의 탑 50층 무한 등반',
          durationSeconds: duration,
          score: 50 * 500 + 5000,
          difficulty: 'NIGHTMARE',
          isVictory: true
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 시련의 탑 50층 등반' : 'STEP 1: 50 FLOORS TOWER CLIMB',
      title: isKo ? '층별 수호자 격파 & 타워 정복' : 'Defeat Guardians & Climb Up',
      description: isKo
        ? '각 층의 타워 가디언을 물리치고 50층 정상에 도달하여 전설 칭호를 획득하세요.'
        : 'Slay tower guardians on each floor to conquer the 50F pinnacle.',
      keyPoints: isKo
        ? [
            '50층 정상 정복 시 초대형 잭팟 정산',
            '층을 오를수록 수호자 공격력 상승',
            '층 돌파 시 HP +20 회복 보너스'
          ]
        : [
            'Reach 50F for jackpot payout',
            'Guardians get stronger on higher floors',
            'Recover +20 HP upon floor clear'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '속공 vs 강타 원터치 시전' : 'Quick vs Heavy Attacks',
      description: isKo
        ? '피해량이 적고 반격이 약한 속공과, 강력하지만 반격이 큰 강타를 전략적으로 선택합니다.'
        : 'Strategically choose between Quick strike and Heavy thrust.',
      keyPoints: isKo
        ? [
            '⚡ 속공: 빠른 안전 타격 (반격 최소화)',
            '💥 강타: 하이 리스크 고위력 일격',
            '🛡️ 층별 가디언 체력 게이지 모니터링'
          ]
        : [
            '⚡ Quick: Fast safe strike (Low counter)',
            '💥 Heavy: High risk heavy burst',
            '🛡️ Real-time guardian HP monitoring'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '등반 종료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon tower run finish.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '도달 최고 층수 비례 대형 배수 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Max floor reached multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '시련의 탑 50F' : 'Tower of Trials'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '층수' : 'Floor', value: `${currentFloor}F / 50F`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '수호자' : 'Guard', value: `${guardianHp}HP`, color: 'text-rose-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Tower Arena Viewport */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden p-3 w-full max-w-sm">
        {/* Guardian Box */}
        <div className="w-full max-w-xs p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗿</span>
            <div>
              <div className="text-xs font-bold">{isKo ? `${currentFloor}F 수호자` : `${currentFloor}F Guardian`}</div>
              <div className="text-[10px] text-slate-500">{isKo ? '타워 시련 가디언' : 'Tower Trial Guardian'}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-rose-600">{guardianHp} / {maxGuardianHp} HP</div>
          </div>
        </div>

        {/* Guardian HP Gauge */}
        <div className="w-full max-w-xs mb-6 space-y-1">
          <div className="w-full h-3 bg-black/10 rounded-none overflow-hidden border border-[rgba(15,0,0,0.15)]">
            <div
              className="h-full bg-rose-600 transition-all duration-150"
              style={{ width: `${(guardianHp / maxGuardianHp) * 100}%` }}
            />
          </div>
        </div>

        {/* Player Box */}
        <div className="w-full max-w-xs p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧙</span>
            <div>
              <div className="text-xs font-bold">{isKo ? '등반 영웅' : 'Climbing Hero'}</div>
              <div className="text-[10px] text-cyan-700 font-bold">{isKo ? '전설의 도전자' : 'Legend Challenger'}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-cyan-700">{playerHp} HP</div>
          </div>
        </div>
      </div>

      {/* Combat Buttons */}
      <div className="shrink-0 w-full max-w-sm px-4 pb-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => attackGuardian('quick')}
          disabled={isGameOver || isPaused}
          className="flex-1 py-3 bg-[#201d1d] text-white rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs"
        >
          ⚡ {isKo ? '속공 타격' : 'Quick Strike'}
        </button>
        <button
          type="button"
          onClick={() => attackGuardian('heavy')}
          disabled={isGameOver || isPaused}
          className="flex-1 py-3 bg-rose-600 text-white rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs"
        >
          💥 {isKo ? '강타 일격' : 'Heavy Blow'}
        </button>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_tower_of_trials_50f"
          gameTitle={isKo ? '시련의 탑 50층 무한 등반 미션' : 'Tower of Trials 50F Mission'}
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
export default TowerOfTrials50FMission;
