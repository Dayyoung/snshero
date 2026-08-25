import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface CardFlipGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const DIFFICULTY_CONFIG = [
  { size: 3, shuffleMoves: 5, reward: 15 },
  { size: 4, shuffleMoves: 10, reward: 30 },
  { size: 5, shuffleMoves: 18, reward: 45 },
  { size: 6, shuffleMoves: 28, reward: 60 },
];

interface FlipTile {
  id: number;
  cardId: number;
  active: boolean;
}

const generateSolvablePuzzle = (size: number, moves: number, cardPool: number[]): FlipTile[] => {
  const totalTiles = size * size;
  const state: boolean[] = Array(totalTiles).fill(true);

  for (let m = 0; m < moves; m++) {
    const idx = Math.floor(Math.random() * totalTiles);
    const row = Math.floor(idx / size);
    const col = idx % size;
    state[idx] = !state[idx];
    if (row > 0) state[idx - size] = !state[idx - size];
    if (row < size - 1) state[idx + size] = !state[idx + size];
    if (col > 0) state[idx - 1] = !state[idx - 1];
    if (col < size - 1) state[idx + 1] = !state[idx + 1];
  }

  if (state.every(s => s)) {
    const idx = Math.floor(Math.random() * totalTiles);
    const row = Math.floor(idx / size);
    const col = idx % size;
    state[idx] = !state[idx];
    if (row > 0) state[idx - size] = !state[idx - size];
    if (row < size - 1) state[idx + size] = !state[idx + size];
    if (col > 0) state[idx - 1] = !state[idx - 1];
    if (col < size - 1) state[idx + 1] = !state[idx + 1];
  }

  return state.map((active, i) => ({
    id: i,
    cardId: cardPool[i % cardPool.length],
    active,
  }));
};

export const CardFlipGame: React.FC<CardFlipGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [level, setLevel] = useState(0);
  const [tiles, setTiles] = useState<FlipTile[]>([]);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_flip') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());
  const { size, shuffleMoves } = DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)];
  const totalTiles = size * size;

  const initGame = useCallback(() => {
    const cardPool: number[] = [];
    if (deck && deck.length > 0) {
      deck.forEach(c => cardPool.push(c.id));
    } else {
      Object.values(CARD_DATABASE).slice(0, 12).forEach(c => cardPool.push(c.id));
    }
    setTiles(generateSolvablePuzzle(size, shuffleMoves, cardPool));
    setMoves(0);
    setIsComplete(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [deck, size, shuffleMoves]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const toggleTile = (index: number) => {
    if (isComplete || isPaused) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    setTiles(prev => {
      const next = prev.map(t => ({ ...t }));
      const row = Math.floor(index / size);
      const col = index % size;

      next[index].active = !next[index].active;
      if (row > 0) next[index - size].active = !next[index - size].active;
      if (row < size - 1) next[index + size].active = !next[index + size].active;
      if (col > 0) next[index - 1].active = !next[index - 1].active;
      if (col < size - 1) next[index + 1].active = !next[index + 1].active;

      const allActive = next.every(t => t.active);
      if (allActive) {
        setIsComplete(true);
        const duration = (Date.now() - startTimeRef.current) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: '2d_card_flip',
          gameTitle: '2D 카드 플립 퍼즐',
          durationSeconds: duration,
          score: (level + 1) * 1000,
          difficulty: level >= 2 ? 'HARD' : 'NORMAL',
          isVictory: true
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }

      return next;
    });

    setMoves(m => m + 1);
  };

  const activeCount = tiles.filter(t => t.active).length;
  const cellGap = size <= 3 ? 12 : size === 4 ? 8 : size === 5 ? 6 : 4;

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 모든 카드 활성화' : 'STEP 1: FLIP ALL CARDS',
      title: isKo ? '그리드 전체 카드 동시 점등' : 'Light Up All Grid Tiles',
      description: isKo
        ? '인접 카드의 반전 효과를 전략적으로 활용하여 그리드 내 모든 카드를 동시에 앞면(활성) 상태로 만드세요.'
        : 'Flip all card tiles on the grid to active face-up state.',
      keyPoints: isKo
        ? [
            '모든 카드 활성화 시 즉시 승리',
            '선택한 카드 및 상하좌우 인접 카드 반전',
            '최소 이동 횟수로 클리어 시 고득점'
          ]
        : [
            'Light up all cards to win',
            'Toggles selected tile and 4 orthogonal neighbors',
            'Fewer moves yield higher scores'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '원터치 카드 플립' : 'One-Touch Card Flip',
      description: isKo
        ? '버튼 없이 그리드 위의 카드를 탭하여 즉시 반전시킵니다.'
        : 'Tap any card tile directly to toggle with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 카드 탭: 십자 방향 인접 타일 동시 반전',
            '⚡ 4x4, 5x5 확장 고난이도 스테이지',
            '🧩 완벽한 솔루션 알고리즘 탑재'
          ]
        : [
            '👆 Card Tap: Cross-pattern neighbor flip',
            '⚡ 4x4 and 5x5 high difficulty stages',
            '🧩 Guaranteed solvable puzzle state'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '퍼즐 클리어 즉시 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon puzzle completion.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '스테이지 난이도 및 이동 횟수 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Stage difficulty and moves bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '2D 카드 플립' : '2D Card Flip'}
        language={language}
        telemetries={[
          { label: isKo ? '스테이지' : 'Stage', value: `LV.${level + 1}`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '활성' : 'Active', value: `${activeCount}/${totalTiles}`, color: 'text-cyan-700 font-bold' },
          { label: isKo ? '이동' : 'Moves', value: `${moves}회`, color: 'text-slate-700' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Responsive Grid Container */}
      <div className="w-full max-w-md px-4 flex justify-center flex-1 min-h-0 items-center">
        <div
          className="grid p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none shadow-none w-full max-w-[340px] max-h-[50vh]"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gap: `${cellGap}px`,
          }}
        >
          {tiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => toggleTile(tile.id)}
              disabled={isComplete || isPaused}
              className={cn(
                'aspect-square rounded-sm border transition-all duration-150 select-none outline-none relative overflow-hidden',
                'cursor-pointer hover:opacity-90 active:scale-95 min-h-[36px]',
                tile.active && 'border-[#201d1d] bg-[#0f0000]',
                !tile.active && 'border-[rgba(15,0,0,0.15)] bg-[#f1eeee]',
                isComplete && 'border-[#201d1d] ring-1 ring-[#201d1d]',
              )}
            >
              {tile.active && (
                <div
                  className="w-full h-full rounded-none"
                  style={getCardSpriteStyle(tile.cardId)}
                />
              )}
              {!tile.active && (
                <div className="w-full h-full bg-[#f1eeee] rounded-none flex items-center justify-center relative overflow-hidden border border-[rgba(15,0,0,0.06)]">
                  <div className="w-5 h-5 rounded-sm bg-[#e5e1e1] border border-[rgba(15,0,0,0.1)] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#6e6e73]">?</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '카드 탭: 인접 카드 십자 반전 | 전체 활성화 시 승리 (버튼 없음)' : 'Tap Card: Cross-pattern neighbor flip | Light all up to win'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_flip"
          gameTitle={isKo ? '2D 카드 플립 퍼즐' : '2D Card Flip Puzzle'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Standardized Victory & Reward Settlement Modal */}
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
export default CardFlipGame;
