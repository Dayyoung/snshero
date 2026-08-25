import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface MonsterBeastariumCatchMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface WildPet {
  id: number;
  nameKo: string;
  nameEn: string;
  rarity: 'SSR' | 'SR' | 'R';
  icon: string;
  catchRate: number;
}

export const MonsterBeastariumCatchMission: React.FC<MonsterBeastariumCatchMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [trapsLeft, setTrapsLeft] = useState(5);
  const [currentPet, setCurrentPet] = useState<WildPet | null>(null);
  const [caughtPets, setCaughtPets] = useState<WildPet[]>([]);
  const [feedBonus, setFeedBonus] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [catchLog, setCatchLog] = useState<string>('');
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_monster_beastarium') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const PET_POOL: WildPet[] = [
    { id: 1, nameKo: '아기 드래곤', nameEn: 'Baby Dragon', rarity: 'SSR', icon: '🐲', catchRate: 0.35 },
    { id: 2, nameKo: '서리 그리폰', nameEn: 'Frost Gryphon', rarity: 'SSR', icon: '🦅', catchRate: 0.45 },
    { id: 3, nameKo: '달빛 여우', nameEn: 'Moonlight Fox', rarity: 'SR', icon: '🦊', catchRate: 0.65 },
    { id: 4, nameKo: '황금 늑대', nameEn: 'Golden Wolf', rarity: 'SR', icon: '🐺', catchRate: 0.70 },
    { id: 5, nameKo: '숲의 다람쥐', nameEn: 'Forest Squirrel', rarity: 'R', icon: '🐿️', catchRate: 0.85 },
  ];

  const spawnPet = useCallback(() => {
    const p = PET_POOL[Math.floor(Math.random() * PET_POOL.length)];
    setCurrentPet(p);
    setFeedBonus(0);
    setCatchLog(isKo ? `야생의 [${p.nameKo}] (${p.rarity}) 출현!` : `Wild [${p.nameEn}] (${p.rarity}) Appeared!`);
  }, [isKo]);

  const initGame = useCallback(() => {
    setTrapsLeft(5);
    setCaughtPets([]);
    setFeedBonus(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
    spawnPet();
    startTimeRef.current = Date.now();
  }, [spawnPet]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const throwTrap = () => {
    if (isGameOver || isPaused || trapsLeft <= 0 || !currentPet) return;

    const nextTraps = trapsLeft - 1;
    setTrapsLeft(nextTraps);

    const finalRate = currentPet.catchRate + feedBonus;
    const success = Math.random() < finalRate;

    if (success) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      const nextCaught = [...caughtPets, currentPet];
      setCaughtPets(nextCaught);
      setCatchLog(isKo ? `🎉 [${currentPet.nameKo}] 포획 성공!` : `🎉 Caught [${currentPet.nameEn}]!`);

      if (nextTraps <= 0) {
        endGame(nextCaught);
      } else {
        setTimeout(() => spawnPet(), 600);
      }
    } else {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setCatchLog(isKo ? `💨 [${currentPet.nameKo}] 가 덫을 회피했습니다!` : `💨 [${currentPet.nameEn}] escaped trap!`);

      if (nextTraps <= 0) {
        endGame(caughtPets);
      } else {
        setTimeout(() => spawnPet(), 600);
      }
    }
  };

  const feedBait = () => {
    if (isGameOver || isPaused || feedBonus >= 0.3) return;

    setFeedBonus(b => b + 0.15);
    setCatchLog(isKo ? '🍖 먹이를 주어 포획 확률이 +15% 증가했습니다!' : '🍖 Fed bait! Catch rate +15%!');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const endGame = (caught: WildPet[]) => {
    setIsGameOver(true);
    const score = caught.reduce((acc, p) => acc + (p.rarity === 'SSR' ? 1800 : p.rarity === 'SR' ? 1000 : 500), 0);
    const duration = (Date.now() - startTimeRef.current) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'mission_monster_beastarium',
      gameTitle: '비스티아리움 몬스터 포획',
      durationSeconds: duration,
      score: score + (caught.length >= 3 ? 2000 : 500),
      difficulty: 'NIGHTMARE',
      isVictory: caught.length >= 2
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 희귀 펫 3마리 이상 포획' : 'STEP 1: CATCH 3+ RARE PETS',
      title: isKo ? '먹이 유인 & 매직 트랩 포획' : 'Feed Bait & Throw Traps',
      description: isKo
        ? '5개의 매직 트랩으로 야생의 희귀 펫(SSR/SR)을 길들여 비스티아리움 도감을 완성하세요.'
        : 'Use 5 magic traps to tame wild pets (SSR/SR) for your Beastarium.',
      keyPoints: isKo
        ? [
            '2마리 이상 포획 시 완승 정산',
            'SSR 등급 펫 포획 시 대량 보너스 포인트',
            '먹이를 주면 포획 확률 +15% 상승'
          ]
        : [
            'Catch 2+ pets to win',
            'SSR pets grant massive bonus points',
            'Feeding bait increases catch rate +15%'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '먹이/트랩 원터치 시전' : 'One-Touch Bait & Trap',
      description: isKo
        ? '먹이 주기 버튼으로 확률을 높이고, 트랩 투척 버튼을 탭하여 즉시 포획합니다.'
        : 'Tap bait to increase chance and tap trap to capture wild pets.',
      keyPoints: isKo
        ? [
            '🍖 먹이 주기: 포획 확률 중첩 증가',
            '🕸️ 트랩 투척: 즉시 몬스터 포획 시도',
            '🐾 잔여 트랩 실시간 카운트'
          ]
        : [
            '🍖 Feed Bait: Stackable catch bonus',
            '🕸️ Throw Trap: Instant capture attempt',
            '🐾 Real-time trap counter'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '포획 완수 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon beast hunt finish.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '포획 펫 등급 및 수량 비례 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Pet rarity and count multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '비스티아리움 포획' : 'Beastarium Catch'}
        language={language}
        telemetries={[
          { label: isKo ? '트랩' : 'Traps', value: `${trapsLeft}/5`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '포획' : 'Caught', value: `${caughtPets.length}`, color: 'text-emerald-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pet Catch Arena Viewport */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden p-3 w-full max-w-sm">
        {/* Wild Pet Avatar */}
        {currentPet && (
          <div className="w-40 h-40 bg-[#f8f7f7] border-2 border-[rgba(15,0,0,0.15)] flex flex-col items-center justify-center rounded-none shadow-sm mb-3">
            <span className="text-6xl animate-bounce">{currentPet.icon}</span>
            <div className="text-xs font-bold mt-2">{isKo ? currentPet.nameKo : currentPet.nameEn}</div>
            <div className="text-[10px] font-bold text-amber-600">[{currentPet.rarity}] {(currentPet.catchRate * 100).toFixed(0)}%</div>
          </div>
        )}

        {/* Catch Log */}
        <div className="w-full max-w-xs p-3 bg-white border border-[rgba(15,0,0,0.15)] text-center text-xs font-mono text-slate-700 shadow-xs mb-3 min-h-[44px] flex items-center justify-center">
          {catchLog}
        </div>

        {/* Caught Pets Gallery */}
        <div className="w-full max-w-xs flex items-center gap-1 overflow-x-auto p-1 bg-black/5 border border-[rgba(15,0,0,0.06)] min-h-[36px]">
          {caughtPets.map((p, i) => (
            <span key={i} className="text-xl" title={p.nameKo}>{p.icon}</span>
          ))}
          {caughtPets.length === 0 && (
            <span className="text-[10px] text-slate-400 font-mono w-full text-center">{isKo ? '포획한 펫 없음' : 'No pets caught'}</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="shrink-0 w-full max-w-sm px-4 pb-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={feedBait}
          disabled={isGameOver || isPaused || feedBonus >= 0.3}
          className="flex-1 py-3.5 bg-amber-500 text-[#201d1d] rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs border border-amber-600 disabled:opacity-50"
        >
          🍖 {isKo ? `먹이 유인 (+${(feedBonus * 100).toFixed(0)}%)` : `Feed Bait (+${(feedBonus * 100).toFixed(0)}%)`}
        </button>
        <button
          type="button"
          onClick={throwTrap}
          disabled={isGameOver || isPaused || trapsLeft <= 0}
          className="flex-1 py-3.5 bg-[#201d1d] text-white rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs"
        >
          🕸️ {isKo ? '트랩 투척' : 'Throw Trap'}
        </button>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_monster_beastarium"
          gameTitle={isKo ? '비스티아리움 몬스터 포획 미션' : 'Beastarium Monster Catch Mission'}
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
export default MonsterBeastariumCatchMission;
