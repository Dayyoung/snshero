import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface MemoryMatchGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const DIFFICULTY_CONFIG = [
  { cols: 4, rows: 4, maxTurns: 18 },
  { cols: 6, rows: 4, maxTurns: 28 },
  { cols: 6, rows: 6, maxTurns: 42 },
];

interface CardTile {
  id: number;
  cardId: number;
  flipped: boolean;
  matched: boolean;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 9;
  const [level, setLevel] = useState(0);
  const [tiles, setTiles] = useState<CardTile[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcade_memory_match') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());
  const { cols, rows } = DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)];
  const totalPairs = (cols * rows) / 2;

  const initGame = useCallback(() => {
    const cardPool: number[] = [];
    if (deck && deck.length > 0) {
      deck.forEach(c => cardPool.push(c.id));
    }
    while (cardPool.length < totalPairs) {
      cardPool.push(cardPool.length + 1);
    }

    const tileList: CardTile[] = [];
    for (let i = 0; i < totalPairs; i++) {
      const cId = cardPool[i % cardPool.length];
      tileList.push({ id: i * 2, cardId: cId, flipped: false, matched: false });
      tileList.push({ id: i * 2 + 1, cardId: cId, flipped: false, matched: false });
    }

    // Shuffle tiles
    for (let i = tileList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tileList[i], tileList[j]] = [tileList[j], tileList[i]];
    }

    setTiles(tileList);
    setFlippedIds([]);
    setMatchedCount(0);
    setMoves(0);
    setIsChecking(false);
    setIsComplete(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [deck, totalPairs]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleTileClick = (id: number) => {
    if (isChecking || isComplete || isPaused) return;
    const target = tiles.find(t => t.id === id);
    if (!target || target.flipped || target.matched) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    // Flip this tile
    const newTiles = tiles.map(t => (t.id === id ? { ...t, flipped: true } : t));
    setTiles(newTiles);

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      const nextMoves = moves + 1;
      setMoves(nextMoves);

      const maxTurns = DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)].maxTurns;

      const first = newTiles.find(t => t.id === newFlipped[0]);
      const second = newTiles.find(t => t.id === newFlipped[1]);

      if (first && second && first.cardId === second.cardId) {
        // Matched!
        setTimeout(() => {
          setTiles(prev =>
            prev.map(t =>
              t.id === first.id || t.id === second.id ? { ...t, matched: true } : t
            )
          );
          setFlippedIds([]);
          setIsChecking(false);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          const nextMatched = matchedCount + 1;
          setMatchedCount(nextMatched);

          if (nextMatched >= totalPairs) {
            setIsComplete(true);
            const duration = (Date.now() - startTimeRef.current) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'arcade_memory_match',
              gameTitle: '클래식 메모리 매칭',
              durationSeconds: duration,
              score: (level + 1) * 1000 + Math.max(0, (maxTurns - nextMoves) * 50),
              difficulty: level >= 1 ? 'HARD' : 'NORMAL',
              isVictory: true
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          } else if (nextMoves >= maxTurns) {
            // Out of turns
            setIsComplete(true);
            const duration = (Date.now() - startTimeRef.current) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'arcade_memory_match',
              gameTitle: '클래식 메모리 매칭',
              durationSeconds: duration,
              score: nextMatched * 100,
              difficulty: level >= 1 ? 'HARD' : 'NORMAL',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          }
        }, 500);
      } else {
        // Mismatch
        setTimeout(() => {
          setTiles(prev =>
            prev.map(t =>
              t.id === newFlipped[0] || t.id === newFlipped[1] ? { ...t, flipped: false } : t
            )
          );
          setFlippedIds([]);
          setIsChecking(false);

          if (nextMoves >= maxTurns) {
            // Out of turns on mismatch -> Game Over!
            setIsComplete(true);
            const duration = (Date.now() - startTimeRef.current) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'arcade_memory_match',
              gameTitle: '클래식 메모리 매칭',
              durationSeconds: duration,
              score: matchedCount * 100,
              difficulty: level >= 1 ? 'HARD' : 'NORMAL',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          }
        }, 800);
      }
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 전체 카드 짝 맞추기' : 'STEP 1: MATCH ALL PAIRS',
      title: isKo ? '같은 카드 2장 연속 뒤집기' : 'Flip & Match Identical Cards',
      description: isKo
        ? '뒤집힌 카드들의 위치를 기억하고 동일한 카드 2장을 연속으로 찾아 모두 매칭하세요.'
        : 'Memorize flipped cards and match all identical pairs on the grid.',
      keyPoints: isKo
        ? [
            '모든 카드 짝 완성 시 즉시 승리',
            '동일 카드 매칭 시 영구 오픈',
            '최소 이동 횟수로 클리어 시 고득점'
          ]
        : [
            'Match all pairs to win',
            'Matched pairs stay revealed',
            'Fewer moves yield higher scores'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '카드 원터치 플립' : 'One-Touch Card Flip',
      description: isKo
        ? '격자판의 카드를 직접 탭하여 즉시 앞면을 확인합니다.'
        : 'Tap cards directly to flip with responsive zero-button touch.',
      keyPoints: isKo
        ? [
            '👆 카드 탭: 3D 플립 애니메이션',
            '⚡ 4x4, 6x4 고난이도 스테이지',
            '🧠 기억력 및 집중력 훈련'
          ]
        : [
            '👆 Tap Card: Responsive flip animation',
            '⚡ 4x4, 6x4 difficulty stages',
            '🧠 Memory and focus training'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '전체 짝 맞춤 완료 즉시 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon puzzle clear.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '난이도 및 이동 횟수 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Difficulty and moves bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '메모리 매칭' : 'Memory Match'}
        language={language}
        telemetries={[
          { label: isKo ? '스테이지' : 'Stage', value: `LV.${level + 1}`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '매칭' : 'Pairs', value: `${matchedCount}/${totalPairs}`, color: matchedCount >= totalPairs ? 'text-emerald-700 font-bold' : 'text-cyan-700 font-bold' },
          { label: isKo ? '남은 턴' : 'Turns', value: `${Math.max(0, DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)].maxTurns - moves)}/${DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)].maxTurns}`, color: (DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)].maxTurns - moves) <= 5 ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Grid Container */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm">
        <div
          className="grid p-2.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none shadow-none w-full max-w-[340px] max-h-[62vh]"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: '6px',
          }}
        >
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleTileClick(tile.id)}
              disabled={tile.matched || isComplete || isPaused}
              className={cn(
                'aspect-square rounded-sm border transition-all duration-150 select-none outline-none relative overflow-hidden flex items-center justify-center',
                !tile.flipped && !tile.matched && 'border-[rgba(15,0,0,0.15)] bg-white cursor-pointer active:scale-95 shadow-xs',
                tile.flipped && !tile.matched && 'bg-white border-amber-500 ring-1 ring-amber-400',
                tile.matched && 'bg-emerald-50 border-emerald-400 opacity-60'
              )}
            >
              {(tile.flipped || tile.matched) && (
                <div
                  className="w-full h-full p-0.5"
                  style={getCardSpriteStyle(tile.cardId)}
                />
              )}
              {!tile.flipped && !tile.matched && (
                <span className="text-xs font-bold text-slate-400">?</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '카드를 탭하여 짝을 맞추세요 (버튼 없음)' : 'Tap cards to match pairs (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_memory_match"
          gameTitle={isKo ? '클래식 메모리 매칭: 카드 짝 맞추기' : 'Classic Memory Match: Card Pairs'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isComplete && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={() => {
            if (level < DIFFICULTY_CONFIG.length - 1) {
              setLevel(l => l + 1);
            } else {
              initGame();
            }
          }}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default MemoryMatchGame;
