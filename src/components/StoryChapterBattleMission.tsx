import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface StoryChapterBattleMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const StoryChapterBattleMission: React.FC<StoryChapterBattleMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [round, setRound] = useState(1);
  const maxRounds = 3;
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [battleLog, setBattleLog] = useState<string>('');
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_story_chapter_battle') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const initGame = useCallback(() => {
    setRound(1);
    setPlayerHp(100);
    setEnemyHp(100);
    setBattleLog(isKo ? '스토리 제1장: 암흑 결사대와의 조우' : 'Chapter 1: Encounter with Dark Legion');
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [isKo]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const executeAction = (actionType: 'strike' | 'guard' | 'magic') => {
    if (isGameOver || isPaused) return;

    // Player action
    let pDmg = 0;
    let eDmg = 15 + Math.floor(Math.random() * 10);

    if (actionType === 'strike') {
      pDmg = 35 + Math.floor(Math.random() * 15);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    } else if (actionType === 'guard') {
      pDmg = 15;
      eDmg = Math.max(0, eDmg - 12);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    } else {
      pDmg = 50;
      eDmg += 5; // Risk
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }

    const nextEnemyHp = Math.max(0, enemyHp - pDmg);
    const nextPlayerHp = Math.max(0, playerHp - eDmg);

    setEnemyHp(nextEnemyHp);
    setPlayerHp(nextPlayerHp);
    setBattleLog(
      isKo
        ? `가한 피해: ${pDmg} DMG | 받은 피해: ${eDmg} DMG`
        : `Dealt: ${pDmg} DMG | Received: ${eDmg} DMG`
    );

    if (nextPlayerHp <= 0) {
      // Defeat
      setIsGameOver(true);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'mission_story_chapter_battle',
        gameTitle: '스토리 챕터 전술 배틀',
        durationSeconds: duration,
        score: (round - 1) * 1000,
        difficulty: 'NIGHTMARE',
        isVictory: false
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
      return;
    }

    if (nextEnemyHp <= 0) {
      if (round < maxRounds) {
        // Next round
        setRound(r => r + 1);
        setEnemyHp(100 + round * 20);
        setPlayerHp(hp => Math.min(100, hp + 30));
        setBattleLog(isKo ? `라운드 ${round + 1} 개시!` : `Round ${round + 1} Start!`);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      } else {
        // Story Cleared!
        setIsGameOver(true);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        const duration = (Date.now() - startTimeRef.current) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'mission_story_chapter_battle',
          gameTitle: '스토리 챕터 전술 배틀',
          durationSeconds: duration,
          score: 5000,
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
      badge: isKo ? 'STEP 1: 3라운드 스토리 완파' : 'STEP 1: 3 CHAPTER ROUNDS',
      title: isKo ? '암흑 결사대 격파 & 챕터 클리어' : 'Defeat 3 Enemy Waves',
      description: isKo
        ? '3개 라운드에 걸쳐 등장하는 스토리 적 부대를 상성 전술로 전원 격파하세요.'
        : 'Defeat all 3 chapter story enemies using tactical battle skills.',
      keyPoints: isKo
        ? [
            '3개 챕터 연속 완파 시 대승리',
            '체력 0 소진 시 스토리 진행 실패',
            '라운드 클리어 시 HP +30 회복'
          ]
        : [
            'Clear 3 rounds to win',
            'Depleting HP causes defeat',
            'Recover +30 HP upon round clear'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '전술 커맨드 원터치 선택' : 'One-Touch Command Cast',
      description: isKo
        ? '강타, 방어, 마법 3종 전술 커맨드를 상황에 맞춰 탭합니다.'
        : 'Tap Strike, Guard, or Magic to execute instant tactical turns.',
      keyPoints: isKo
        ? [
            '🗡️ 강타: 균형 잡힌 물리 타격',
            '🛡️ 방어: 피해 감소 및 반격',
            '🔮 마법: 하이 리스크 폭딜'
          ]
        : [
            '🗡️ Strike: Balanced physical attack',
            '🛡️ Guard: Mitigate damage and counter',
            '🔮 Magic: High risk burst damage'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '챕터 클리어 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon chapter win.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '스토리 진행도 및 잔여 HP 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Story progress and HP multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '스토리 챕터 배틀' : 'Story Chapter Battle'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '라운드' : 'Round', value: `${round}/${maxRounds}`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '적군' : 'Enemy', value: `${enemyHp}HP`, color: 'text-rose-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Battle Arena Viewport */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden p-3 w-full max-w-sm">
        {/* Enemy Box */}
        <div className="w-full max-w-xs p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦹</span>
            <div>
              <div className="text-xs font-bold">{isKo ? `챕터 적군 (LV.${round})` : `Chapter Foe (LV.${round})`}</div>
              <div className="text-[10px] text-slate-500">{isKo ? '암흑 군단 지휘관' : 'Dark Legion Commander'}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-rose-600">{enemyHp} HP</div>
          </div>
        </div>

        {/* Battle Log Box */}
        <div className="w-full max-w-xs p-3 bg-white border border-[rgba(15,0,0,0.15)] text-center text-xs font-mono text-slate-700 shadow-xs mb-4 min-h-[48px] flex items-center justify-center">
          {battleLog}
        </div>

        {/* Player Box */}
        <div className="w-full max-w-xs p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧙</span>
            <div>
              <div className="text-xs font-bold">{isKo ? '영웅 사령관' : 'Hero Commander'}</div>
              <div className="text-[10px] text-cyan-700 font-bold">{isKo ? '아케인 에코즈' : 'Arcane Echoes'}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-cyan-700">{playerHp} HP</div>
          </div>
        </div>
      </div>

      {/* Tactical Commands */}
      <div className="shrink-0 w-full max-w-sm px-4 pb-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => executeAction('strike')}
          disabled={isGameOver || isPaused}
          className="flex-1 py-3 bg-[#201d1d] text-white rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs"
        >
          🗡️ {isKo ? '강타' : 'Strike'}
        </button>
        <button
          type="button"
          onClick={() => executeAction('guard')}
          disabled={isGameOver || isPaused}
          className="flex-1 py-3 bg-cyan-700 text-white rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs"
        >
          🛡️ {isKo ? '방어' : 'Guard'}
        </button>
        <button
          type="button"
          onClick={() => executeAction('magic')}
          disabled={isGameOver || isPaused}
          className="flex-1 py-3 bg-amber-500 text-[#201d1d] rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs border border-amber-600"
        >
          🔮 {isKo ? '마법' : 'Magic'}
        </button>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_story_chapter_battle"
          gameTitle={isKo ? '스토리 챕터 전술 배틀 미션' : 'Story Chapter Battle Mission'}
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
export default StoryChapterBattleMission;
