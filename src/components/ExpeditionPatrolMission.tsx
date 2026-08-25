import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface ExpeditionPatrolMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface PatrolZone {
  id: number;
  nameKo: string;
  nameEn: string;
  danger: string;
  looted: boolean;
  reward: number;
}

export const ExpeditionPatrolMission: React.FC<ExpeditionPatrolMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [zones, setZones] = useState<PatrolZone[]>([
    { id: 1, nameKo: '서리 골짜기', nameEn: 'Frost Valley', danger: 'LOW', looted: false, reward: 800 },
    { id: 2, nameKo: '화염의 화산', nameEn: 'Flame Volcano', danger: 'MED', looted: false, reward: 1200 },
    { id: 3, nameKo: '암흑의 미궁', nameEn: 'Dark Labyrinth', danger: 'HIGH', looted: false, reward: 1800 },
    { id: 4, nameKo: '천공의 신전', nameEn: 'Sky Temple', danger: 'EXTREME', looted: false, reward: 2500 },
  ]);
  const [patrolPoints, setPatrolPoints] = useState(4);
  const [totalLoot, setTotalLoot] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_expedition_patrol') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const initGame = useCallback(() => {
    setZones([
      { id: 1, nameKo: '서리 골짜기', nameEn: 'Frost Valley', danger: 'LOW', looted: false, reward: 800 },
      { id: 2, nameKo: '화염의 화산', nameEn: 'Flame Volcano', danger: 'MED', looted: false, reward: 1200 },
      { id: 3, nameKo: '암흑의 미궁', nameEn: 'Dark Labyrinth', danger: 'HIGH', looted: false, reward: 1800 },
      { id: 4, nameKo: '천공의 신전', nameEn: 'Sky Temple', danger: 'EXTREME', looted: false, reward: 2500 },
    ]);
    setPatrolPoints(4);
    setTotalLoot(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const dispatchPatrol = (zoneId: number) => {
    if (isGameOver || isPaused || patrolPoints <= 0) return;

    const target = zones.find(z => z.id === zoneId);
    if (!target || target.looted) return;

    const nextPoints = patrolPoints - 1;
    const nextLoot = totalLoot + target.reward;
    const nextZones = zones.map(z => (z.id === zoneId ? { ...z, looted: true } : z));

    setPatrolPoints(nextPoints);
    setTotalLoot(nextLoot);
    setZones(nextZones);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    if (nextPoints <= 0 || nextZones.every(z => z.looted)) {
      setIsGameOver(true);
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'mission_expedition_patrol',
        gameTitle: '원정대 순찰 파견',
        durationSeconds: duration,
        score: nextLoot,
        difficulty: 'NIGHTMARE',
        isVictory: true
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 4대 권역 순찰 완수' : 'STEP 1: 4 PATROL ZONES',
      title: isKo ? '원정대 파견 & 고수익 전리품 회수' : 'Dispatch Squad & Loot Rewards',
      description: isKo
        ? '보유한 4개의 순찰 포인트로 4대 미개척 권역에 원정대를 파견하여 전리품을 회수하세요.'
        : 'Use 4 patrol points to dispatch squads to 4 uncharted zones for loot.',
      keyPoints: isKo
        ? [
            '4대 권역 전원 순찰 시 완승 잭팟',
            '위험도가 높은 권역일수록 고수익 보상',
            '원정 파견 즉시 전리품 회수'
          ]
        : [
            'Patrol all 4 zones to win',
            'Higher danger zones yield higher rewards',
            'Instant loot acquisition upon dispatch'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '권역 카드 원터치 파견' : 'One-Touch Zone Dispatch',
      description: isKo
        ? '원하는 순찰 권역 카드를 직접 탭하여 즉시 원정대를 파견합니다.'
        : 'Tap any zone card to dispatch patrol squad instantly.',
      keyPoints: isKo
        ? [
            '👆 권역 탭: 즉시 원정대 파견',
            '⚡ 4대 난이도 권역 실시간 탐색',
            '📦 전리품 즉시 누적 정산'
          ]
        : [
            '👆 Tap Zone: Instant squad dispatch',
            '⚡ 4 danger tiers exploration',
            '📦 Instant loot accumulation'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '순찰 완수 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon expedition finish.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '회수 전리품 총액 비례 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Total looted points multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '원정대 순찰' : 'Expedition Patrol'}
        language={language}
        telemetries={[
          { label: isKo ? '파견' : 'Points', value: `${patrolPoints}/4`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '전리품' : 'Loot', value: `${totalLoot}P`, color: 'text-emerald-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Zones Viewport */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden p-3 w-full max-w-sm gap-2.5">
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => dispatchPatrol(zone.id)}
            disabled={zone.looted || patrolPoints <= 0 || isGameOver || isPaused}
            className={`w-full p-3 border flex items-center justify-between transition-all rounded-none shadow-xs ${
              zone.looted
                ? 'bg-emerald-50 border-emerald-400 opacity-60 cursor-default'
                : 'bg-white border-[rgba(15,0,0,0.15)] active:scale-95 cursor-pointer hover:border-[#201d1d]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{zone.looted ? '✅' : '🗺️'}</span>
              <div className="text-left">
                <div className="text-xs font-bold">{isKo ? zone.nameKo : zone.nameEn}</div>
                <div className="text-[10px] text-slate-500 font-bold">
                  {isKo ? '위험도' : 'Danger'}: <span className={zone.danger === 'EXTREME' ? 'text-rose-600' : zone.danger === 'HIGH' ? 'text-amber-600' : 'text-cyan-700'}>{zone.danger}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-700">+{zone.reward} P</div>
              <div className="text-[10px] text-slate-400">{zone.looted ? (isKo ? '완료' : 'CLEARED') : (isKo ? '파견 가능' : 'READY')}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '권역을 탭하여 원정대를 파견하세요 (4개 권역 탐색 시 정산)' : 'Tap zones to dispatch squad (4 zones clear for payout)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_expedition_patrol"
          gameTitle={isKo ? '원정대 순찰 파견 미션' : 'Expedition Patrol Mission'}
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
export default ExpeditionPatrolMission;
