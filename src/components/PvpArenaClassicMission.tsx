import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface PvpArenaClassicMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface CombatCard {
  id: number;
  nameKo: string;
  nameEn: string;
  power: number;
  speed: number;
  defense: number;
  icon: string;
}

export const PvpArenaClassicMission: React.FC<PvpArenaClassicMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [round, setRound] = useState(1);
  const [myCard, setMyCard] = useState<CombatCard | null>(null);
  const [enemyCard, setEnemyCard] = useState<CombatCard | null>(null);
  const [handCards, setHandCards] = useState<CombatCard[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [matchLog, setMatchLog] = useState<string>('');
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_pvp_classic') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const CARD_POOL: CombatCard[] = [
    { id: 1, nameKo: '화염의 전사', nameEn: 'Flame Warrior', power: 95, speed: 70, defense: 60, icon: '⚔️' },
    { id: 2, nameKo: '천공의 궁수', nameEn: 'Sky Archer', power: 80, speed: 95, defense: 50, icon: '🏹' },
    { id: 3, nameKo: '강철의 수호기사', nameEn: 'Steel Knight', power: 70, speed: 50, defense: 95, icon: '🛡️' },
    { id: 4, nameKo: '아케인 대마법사', nameEn: 'Arcane Mage', power: 99, speed: 60, defense: 40, icon: '🔮' },
    { id: 5, nameKo: '그림자 암살자', nameEn: 'Shadow Rogue', power: 88, speed: 90, defense: 55, icon: '🗡️' },
  ];

  const initGame = useCallback(() => {
    setPlayerWins(0);
    setAiWins(0);
    setRound(1);
    setMyCard(null);
    setEnemyCard(null);
    setHandCards([...CARD_POOL]);
    setMatchLog(isKo ? '3전 2선승 PVP 아레나 덱 매치 개시' : 'Best of 3 PVP Arena Deck Match Started');
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [isKo]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const selectCardForRound = (card: CombatCard) => {
    if (isGameOver || isPaused) return;

    const aiCard = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
    setMyCard(card);
    setEnemyCard(aiCard);

    // Combat calculation: Total Combat Power = Power + Speed + Defense
    const myTotal = card.power + card.speed + card.defense;
    const aiTotal = aiCard.power + aiCard.speed + aiCard.defense;

    let pWin = playerWins;
    let aWin = aiWins;

    if (myTotal >= aiTotal) {
      pWin += 1;
      setPlayerWins(pWin);
      setMatchLog(
        isKo
          ? `[라운드 ${round} 승리!] 내 카드(${myTotal}) vs 상대(${aiTotal})`
          : `[Round ${round} WIN!] You(${myTotal}) vs AI(${aiTotal})`
      );
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      aWin += 1;
      setAiWins(aWin);
      setMatchLog(
        isKo
          ? `[라운드 ${round} 패배...] 내 카드(${myTotal}) vs 상대(${aiTotal})`
          : `[Round ${round} LOSE...] You(${myTotal}) vs AI(${aiTotal})`
      );
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    const nextHand = handCards.filter(c => c.id !== card.id);
    setHandCards(nextHand);

    if (pWin >= 2 || aWin >= 2) {
      setIsGameOver(true);
      const isVictory = pWin >= 2;
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'mission_pvp_classic',
        gameTitle: 'PVP 아레나 클래식 덱 대결',
        durationSeconds: duration,
        score: pWin * 1500 + (isVictory ? 3000 : 500),
        difficulty: 'NIGHTMARE',
        isVictory: isVictory
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    } else {
      setRound(r => r + 1);
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 3전 2선승 덱 매치' : 'STEP 1: BEST OF 3 PVP',
      title: isKo ? '스탯 총합 비교 & 2승 선점' : 'Compare Stats & Win 2 Rounds',
      description: isKo
        ? '5장의 덱 카드 중 최적의 카드를 출전시켜 전투력 총합(공+속+방)으로 상대를 제압하세요.'
        : 'Select the strongest card from your deck to out-power opponent in Best of 3.',
      keyPoints: isKo
        ? [
            '먼저 2승을 선점하면 아레나 완승',
            '공격력 + 속도 + 방어력 총합 승부',
            '출전한 카드는 다음 라운드에서 소모'
          ]
        : [
            'Score 2 wins first to claim victory',
            'Combined stat battle: Power + Speed + Def',
            'Cards are expended upon each round'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '출전 카드 원터치 선택' : 'One-Touch Card Selection',
      description: isKo
        ? '하단의 출전 가능한 카드를 직접 탭하여 즉시 전장에 출격시킵니다.'
        : 'Tap any ready card from your hand to deploy into the arena.',
      keyPoints: isKo
        ? [
            '👆 카드 탭: 즉시 전장 출격 & 대결',
            '⚡ 실시간 3전 2선승 판정 시스템',
            '📊 실시간 스탯 총합 비교'
          ]
        : [
            '👆 Tap Card: Instant arena deployment',
            '⚡ Real-time Best-of-3 judging',
            '📊 Live stat sum comparison'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '매치 종료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon arena victory.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '연승 및 라운드 승리 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Win streak and round multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? 'PVP 클래식 아레나' : 'PVP Classic Arena'}
        language={language}
        telemetries={[
          { label: isKo ? '스코어' : 'Score', value: `${playerWins} : ${aiWins}`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '라운드' : 'Round', value: `${round}/3`, color: 'text-cyan-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Arena Viewport */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden p-3 w-full max-w-sm">
        {/* Match Log */}
        <div className="w-full max-w-xs p-3 bg-white border border-[rgba(15,0,0,0.15)] text-center text-xs font-mono text-slate-700 shadow-xs mb-3 min-h-[44px] flex items-center justify-center">
          {matchLog}
        </div>

        {/* Versus Battle Cards */}
        <div className="w-full max-w-xs flex items-center justify-between gap-2 mb-3">
          <div className="flex-1 p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-center">
            <div className="text-[10px] font-bold text-cyan-700 mb-1">YOU</div>
            {myCard ? (
              <div>
                <span className="text-3xl">{myCard.icon}</span>
                <div className="text-xs font-bold mt-1">{isKo ? myCard.nameKo : myCard.nameEn}</div>
                <div className="text-[10px] text-slate-500 font-mono font-bold">PWR: {myCard.power + myCard.speed + myCard.defense}</div>
              </div>
            ) : (
              <div className="py-4 text-xs text-slate-400">선택 대기</div>
            )}
          </div>
          <span className="text-base font-bold text-slate-400">VS</span>
          <div className="flex-1 p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-center">
            <div className="text-[10px] font-bold text-rose-600 mb-1">AI</div>
            {enemyCard ? (
              <div>
                <span className="text-3xl">{enemyCard.icon}</span>
                <div className="text-xs font-bold mt-1">{isKo ? enemyCard.nameKo : enemyCard.nameEn}</div>
                <div className="text-[10px] text-slate-500 font-mono font-bold">PWR: {enemyCard.power + enemyCard.speed + enemyCard.defense}</div>
              </div>
            ) : (
              <div className="py-4 text-xs text-slate-400">대기중</div>
            )}
          </div>
        </div>

        {/* Hand Cards */}
        <div className="w-full max-w-xs space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase">{isKo ? '출전할 카드 선택' : 'Select Card to Deploy'}</div>
          <div className="grid grid-cols-5 gap-1">
            {handCards.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCardForRound(c)}
                disabled={isGameOver || isPaused}
                className="p-1 bg-white border border-[rgba(15,0,0,0.15)] flex flex-col items-center justify-center rounded-none active:scale-95 cursor-pointer shadow-xs hover:border-[#201d1d]"
              >
                <span className="text-base">{c.icon}</span>
                <span className="text-[8px] font-bold text-slate-600 truncate w-full text-center">{c.power}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '카드를 탭하여 출전시키세요 (3전 2선승제 승리 시 대량 정산)' : 'Tap a card to deploy (Win 2 of 3 rounds to win)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_pvp_classic"
          gameTitle={isKo ? 'PVP 아레나 클래식 덱 대결 미션' : 'PVP Arena Classic Deck Mission'}
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
export default PvpArenaClassicMission;
