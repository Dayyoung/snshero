import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface TournamentChampionMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type TournamentStage = 'QUARTERS' | 'SEMIS' | 'FINALS' | 'CHAMPION';

export const TournamentChampionMission: React.FC<TournamentChampionMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [stage, setStage] = useState<TournamentStage>('QUARTERS');
  const [playerHp, setPlayerHp] = useState(100);
  const [rivalHp, setRivalHp] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [tournamentLog, setTournamentLog] = useState<string>('');
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_tournament_champion') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const initGame = useCallback(() => {
    setStage('QUARTERS');
    setPlayerHp(100);
    setRivalHp(100);
    setTournamentLog(isKo ? '🏆 8강전 개시! 상대: 섀도우 블레이더' : '🏆 Quarter-Finals Started! Rival: Shadow Blader');
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [isKo]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const attackRival = (powerTier: 'normal' | 'heavy' | 'burst') => {
    if (isGameOver || isPaused) return;

    let pDmg = powerTier === 'normal' ? 35 : powerTier === 'heavy' ? 55 : 85;
    let rDmg = powerTier === 'normal' ? 12 : powerTier === 'heavy' ? 22 : 38;

    pDmg += Math.floor(Math.random() * 15);
    rDmg += Math.floor(Math.random() * 10);

    const nextRivalHp = Math.max(0, rivalHp - pDmg);
    const nextPlayerHp = Math.max(0, playerHp - rDmg);

    setRivalHp(nextRivalHp);
    setPlayerHp(nextPlayerHp);
    setTournamentLog(
      isKo
        ? `가한 일격: ${pDmg} DMG | 받은 반격: ${rDmg} DMG`
        : `Dealt: ${pDmg} DMG | Countered: ${rDmg} DMG`
    );
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    if (nextPlayerHp <= 0) {
      // Tournament Eliminated
      setIsGameOver(true);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'mission_tournament_champion',
        gameTitle: '토너먼트 챔피언십',
        durationSeconds: duration,
        score: stage === 'FINALS' ? 4000 : stage === 'SEMIS' ? 2500 : 1000,
        difficulty: 'NIGHTMARE',
        isVictory: false
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
      return;
    }

    if (nextRivalHp <= 0) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      if (stage === 'QUARTERS') {
        setStage('SEMIS');
        setRivalHp(130);
        setPlayerHp(hp => Math.min(100, hp + 35));
        setTournamentLog(isKo ? '🔥 4강 진출! 준결승 상대: 프로스트 발키리' : '🔥 Semis! Rival: Frost Valkyrie');
      } else if (stage === 'SEMIS') {
        setStage('FINALS');
        setRivalHp(160);
        setPlayerHp(hp => Math.min(100, hp + 40));
        setTournamentLog(isKo ? '👑 결승전 진출! 챔피언 상대: 드래곤 나이트' : '👑 Finals! Rival: Dragon Knight');
      } else {
        // Champion Victory!
        setStage('CHAMPION');
        setIsGameOver(true);
        const duration = (Date.now() - startTimeRef.current) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'mission_tournament_champion',
          gameTitle: '토너먼트 챔피언십',
          durationSeconds: duration,
          score: 8000,
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
      badge: isKo ? 'STEP 1: 챔피언십 우승 쟁탈' : 'STEP 1: WIN TOURNAMENT',
      title: isKo ? '8강/4강/결승 전승 우승' : '8-4-Finals Champion Crown',
      description: isKo
        ? '토너먼트 8강, 4강, 결승전 3연승을 달성하여 최강 챔피언 타이틀을 쟁취하세요.'
        : 'Win 3 consecutive rounds (8강, Semis, Finals) to become Champion.',
      keyPoints: isKo
        ? [
            '결승전 승리 시 초대형 잭팟 우승 정산',
            '라운드 클리어 시 HP 체력 회복 보너스',
            '상대 라이벌의 강력한 반격 게이지 주의'
          ]
        : [
            'Win Finals for ultimate jackpot reward',
            'Recover HP upon round victory',
            'Beware of heavy rival counter attacks'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '3단 위력 원터치 타격' : '3-Tier Strike Cast',
      description: isKo
        ? '일반 타격, 강타, 버스트 필살기 3종을 타이밍에 맞춰 탭합니다.'
        : 'Tap Normal, Heavy, or Burst strikes strategically.',
      keyPoints: isKo
        ? [
            '🗡️ 일반 타격: 안전한 빠른 공격',
            '⚡ 강타: 균형 잡힌 강력한 일격',
            '🔥 버스트: 리스크 동반 초대형 폭딜'
          ]
        : [
            '🗡️ Normal: Fast safe damage',
            '⚡ Heavy: Balanced power strike',
            '🔥 Burst: High risk mega damage'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '챔피언 등극 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon Championship victory.',
      keyPoints: isKo
        ? [
            '우승 즉시 LocalStorage 영구 지갑 입금',
            '토너먼트 최종 라운드 및 완승 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Championship crown multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '토너먼트 챔피언십' : 'Tournament Championship'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '라운드' : 'Stage', value: stage, color: 'text-amber-600 font-bold' },
          { label: isKo ? '라이벌' : 'Rival', value: `${rivalHp}HP`, color: 'text-rose-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Tournament Arena Viewport */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden p-3 w-full max-w-sm">
        {/* Stage Banner */}
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] font-bold text-amber-600 mb-3">
          {stage === 'QUARTERS' ? '🏆 8강전 (Quarter-Finals)' : stage === 'SEMIS' ? '🔥 4강 준결승 (Semi-Finals)' : '👑 결승전 (Grand Finals)'}
        </div>

        {/* Rival Card */}
        <div className="w-full max-w-xs p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{stage === 'QUARTERS' ? '🥷' : stage === 'SEMIS' ? '🧝‍♀️' : '🐉'}</span>
            <div>
              <div className="text-xs font-bold">
                {stage === 'QUARTERS' ? (isKo ? '섀도우 블레이더' : 'Shadow Blader') : stage === 'SEMIS' ? (isKo ? '프로스트 발키리' : 'Frost Valkyrie') : (isKo ? '드래곤 나이트' : 'Dragon Knight')}
              </div>
              <div className="text-[10px] text-slate-500">{isKo ? '챔피언십 라이벌' : 'Championship Rival'}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-rose-600">{rivalHp} HP</div>
          </div>
        </div>

        {/* Tournament Log */}
        <div className="w-full max-w-xs p-3 bg-white border border-[rgba(15,0,0,0.15)] text-center text-xs font-mono text-slate-700 shadow-xs mb-3 min-h-[44px] flex items-center justify-center">
          {tournamentLog}
        </div>

        {/* Player Card */}
        <div className="w-full max-w-xs p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧙</span>
            <div>
              <div className="text-xs font-bold">{isKo ? '영웅 도전자' : 'Hero Challenger'}</div>
              <div className="text-[10px] text-cyan-700 font-bold">{isKo ? '아케인 에코즈' : 'Arcane Echoes'}</div>
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
          onClick={() => attackRival('normal')}
          disabled={isGameOver || isPaused}
          className="flex-1 py-3 bg-[#201d1d] text-white rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs"
        >
          🗡️ {isKo ? '일반 타격' : 'Normal'}
        </button>
        <button
          type="button"
          onClick={() => attackRival('heavy')}
          disabled={isGameOver || isPaused}
          className="flex-1 py-3 bg-cyan-700 text-white rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs"
        >
          ⚡ {isKo ? '강타 일격' : 'Heavy'}
        </button>
        <button
          type="button"
          onClick={() => attackRival('burst')}
          disabled={isGameOver || isPaused}
          className="flex-1 py-3 bg-rose-600 text-white rounded-none font-bold text-xs active:scale-95 transition-all shadow-xs"
        >
          🔥 {isKo ? '버스트 폭딜' : 'Burst'}
        </button>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_tournament_champion"
          gameTitle={isKo ? '토너먼트 챔피언십 미션' : 'Tournament Championship Mission'}
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
export default TournamentChampionMission;
