import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface TreasureLootHuntMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Chest {
  id: number;
  r: number;
  c: number;
  type: 'gold' | 'legendary' | 'mimic';
  opened: boolean;
}

const GRID_SIZE = 5;

export const TreasureLootHuntMission: React.FC<TreasureLootHuntMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [chests, setChests] = useState<Chest[]>([]);
  const [keysLeft, setKeysLeft] = useState(5);
  const [lootedGold, setLootedGold] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_treasure_loot_hunt') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const initGame = useCallback(() => {
    const list: Chest[] = [];
    let id = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const rand = Math.random();
        const type: 'gold' | 'legendary' | 'mimic' = rand < 0.15 ? 'legendary' : rand < 0.4 ? 'mimic' : 'gold';
        list.push({ id: id++, r, c, type, opened: false });
      }
    }
    setChests(list);
    setKeysLeft(5);
    setLootedGold(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const openChest = (chestId: number) => {
    if (isGameOver || isPaused || keysLeft <= 0) return;

    const target = chests.find(ch => ch.id === chestId);
    if (!target || target.opened) return;

    const nextKeys = keysLeft - 1;
    setKeysLeft(nextKeys);

    let goldGained = 0;
    let hitMimic = false;

    if (target.type === 'legendary') {
      goldGained = 1500;
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else if (target.type === 'gold') {
      goldGained = 500;
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    } else {
      hitMimic = true;
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    const nextChests = chests.map(ch => (ch.id === chestId ? { ...ch, opened: true } : ch));
    setChests(nextChests);

    const nextTotalGold = lootedGold + goldGained;
    setLootedGold(nextTotalGold);

    // End game condition: no keys left or mimic exploded
    if (nextKeys <= 0 || hitMimic) {
      setIsGameOver(true);
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'mission_treasure_loot_hunt',
        gameTitle: '보물 상자 루트 헌트',
        durationSeconds: duration,
        score: nextTotalGold,
        difficulty: 'NIGHTMARE',
        isVictory: !hitMimic && nextTotalGold >= 2000
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 전설 보물 상자 파밍' : 'STEP 1: LOOT TREASURE CHESTS',
      title: isKo ? '황금 상자 탐색 & 미믹 회피' : 'Find Gold & Avoid Mimics',
      description: isKo
        ? '5개의 황금 열쇠로 5x5 던전의 보물 상자를 열어 전설 루트를 획득하세요.'
        : 'Use 5 golden keys to unlock dungeon chests and score legendary loot.',
      keyPoints: isKo
        ? [
            '전설 상자(+1500P) & 일반 상자(+500P)',
            '미믹 함정 상자 개봉 시 즉시 탈락',
            '5개 열쇠 소진 시 자동 정산 완료'
          ]
        : [
            'Legendary (+1500P) & Gold (+500P)',
            'Opening mimic trap causes instant loss',
            'Auto settlement when 5 keys used'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '보물 상자 원터치 개봉' : 'One-Touch Chest Unlock',
      description: isKo
        ? '원하는 격자 상자를 직접 탭하여 즉시 잠금을 해제합니다.'
        : 'Tap chests directly to unlock with fluid responsive touch.',
      keyPoints: isKo
        ? [
            '👆 상자 탭: 즉시 루트 오픈',
            '⚡ 5x5 던전 랜덤 보물 배치',
            '🗝️ 잔여 열쇠 실시간 카운트'
          ]
        : [
            '👆 Tap Chest: Instant unlock & reveal',
            '⚡ 5x5 dungeon procedural layout',
            '🗝️ Real-time key counter'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '파밍 종료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon hunt finish.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '루팅 골드 및 전설 아이템 배수',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Looted gold and legendary multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '보물 상자 루트 헌트' : 'Treasure Loot Hunt'}
        language={language}
        telemetries={[
          { label: isKo ? '열쇠' : 'Keys', value: `${keysLeft}/5`, color: keysLeft > 1 ? 'text-amber-600 font-bold' : 'text-rose-600 font-bold' },
          { label: isKo ? '루트' : 'Loot', value: `${lootedGold}G`, color: 'text-cyan-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Chests Grid Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm">
        <div className="w-full max-w-[340px] aspect-square grid grid-cols-5 gap-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-2">
          {chests.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => openChest(ch.id)}
              disabled={ch.opened || keysLeft <= 0 || isGameOver || isPaused}
              className="aspect-square bg-white border border-[rgba(15,0,0,0.15)] flex items-center justify-center rounded-none active:scale-95 transition-all cursor-pointer shadow-xs disabled:cursor-default"
            >
              {ch.opened ? (
                ch.type === 'legendary' ? (
                  <span className="text-xl font-bold text-amber-500">👑</span>
                ) : ch.type === 'gold' ? (
                  <span className="text-xl font-bold text-yellow-600">💰</span>
                ) : (
                  <span className="text-xl font-bold text-rose-600">👹</span>
                )
              ) : (
                <span className="text-xl text-slate-400">📦</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '상자를 탭하여 오픈하세요 (황금 열쇠 5개 보유 / 미믹 주의)' : 'Tap chests to unlock (5 Golden Keys / Beware of Mimics)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_treasure_loot_hunt"
          gameTitle={isKo ? '보물 상자 루트 헌트: 던전 파밍' : 'Treasure Loot Hunt: Dungeon Looting'}
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
export default TreasureLootHuntMission;
