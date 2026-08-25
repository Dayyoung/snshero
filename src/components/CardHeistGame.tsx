import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface CardHeistGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const GRID = 7;

interface GridCell {
  type: 'empty' | 'player' | 'enemy' | 'treasure';
  cardId: number;
  patrolDir?: 'up' | 'down' | 'left' | 'right';
  patrolStep?: number;
}

export const CardHeistGame: React.FC<CardHeistGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 17;
  const [grid, setGrid] = useState<GridCell[][]>(() =>
    Array.from({ length: GRID }, () =>
      Array.from({ length: GRID }, (): GridCell => ({ type: 'empty', cardId: 0 }))
    )
  );
  const [playerPos, setPlayerPos] = useState({ row: GRID - 1, col: Math.floor(GRID / 2) });
  const [score, setScore] = useState(0);
  const [treasuresCollected, setTreasuresCollected] = useState(0);
  const [totalTreasures, setTotalTreasures] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [level, setLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_heist') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());
  const playerCardId = deck[0]?.imageIndex || deck[0]?.id as number || 1;

  const initGame = useCallback(() => {
    const newGrid: GridCell[][] = Array.from({ length: GRID }, () =>
      Array.from({ length: GRID }, (): GridCell => ({ type: 'empty', cardId: 0 }))
    );

    const pRow = GRID - 1;
    const pCol = Math.floor(GRID / 2);
    newGrid[pRow][pCol] = { type: 'player', cardId: playerCardId };
    setPlayerPos({ row: pRow, col: pCol });

    // Place treasures
    const tCount = Math.min(level + 1, 4);
    setTotalTreasures(tCount);
    setTreasuresCollected(0);

    const treasureCards = [106, 107, 108, 109, 110];
    let placedT = 0;
    while (placedT < tCount) {
      const tr = Math.floor(Math.random() * (GRID - 2));
      const tc = Math.floor(Math.random() * GRID);
      if (newGrid[tr][tc].type === 'empty') {
        newGrid[tr][tc] = { type: 'treasure', cardId: treasureCards[placedT % treasureCards.length] };
        placedT++;
      }
    }

    // Place patrol enemies
    const eCount = Math.min(level + 2, 5);
    const enemyCards = [51, 52, 81, 82, 91];
    let placedE = 0;
    while (placedE < eCount) {
      const er = 1 + Math.floor(Math.random() * (GRID - 3));
      const ec = Math.floor(Math.random() * GRID);
      if (newGrid[er][ec].type === 'empty') {
        newGrid[er][ec] = {
          type: 'enemy',
          cardId: enemyCards[placedE % enemyCards.length],
          patrolDir: placedE % 2 === 0 ? 'left' : 'right',
          patrolStep: 0,
        };
        placedE++;
      }
    }

    setGrid(newGrid);
    setMoves(0);
    setIsGameOver(false);
    setIsWin(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [level, playerCardId]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const movePlayer = useCallback((dRow: number, dCol: number) => {
    if (isGameOver || isPaused) return;

    setPlayerPos(prev => {
      const nRow = prev.row + dRow;
      const nCol = prev.col + dCol;

      if (nRow < 0 || nRow >= GRID || nCol < 0 || nCol >= GRID) return prev;

      setMoves(m => m + 1);

      setGrid(currGrid => {
        const nextGrid = currGrid.map(row => row.map(cell => ({ ...cell })));
        const targetCell = nextGrid[nRow][nCol];

        if (targetCell.type === 'enemy') {
          // Busted by guard
          setIsGameOver(true);
          setIsWin(false);
          const duration = (Date.now() - startTimeRef.current) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: '2d_card_heist',
            gameTitle: '2D 카드 하이스트',
            durationSeconds: duration,
            score: treasuresCollected * 500,
            difficulty: 'HARD',
            isVictory: false
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          return nextGrid;
        }

        let newTreasures = treasuresCollected;
        if (targetCell.type === 'treasure') {
          newTreasures += 1;
          setTreasuresCollected(newTreasures);
          setScore(s => s + 500);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }

        nextGrid[prev.row][prev.col] = { type: 'empty', cardId: 0 };
        nextGrid[nRow][nCol] = { type: 'player', cardId: playerCardId };

        // Move Patrol Enemies
        for (let r = 0; r < GRID; r++) {
          for (let c = 0; c < GRID; c++) {
            const cell = nextGrid[r][c];
            if (cell.type === 'enemy') {
              let dc = cell.patrolDir === 'right' ? 1 : -1;
              let nextC = c + dc;
              if (nextC < 0 || nextC >= GRID || nextGrid[r][nextC].type === 'enemy') {
                cell.patrolDir = cell.patrolDir === 'right' ? 'left' : 'right';
                dc = cell.patrolDir === 'right' ? 1 : -1;
                nextC = c + dc;
              }
              if (nextC >= 0 && nextC < GRID && nextGrid[r][nextC].type !== 'enemy') {
                if (nextC === nCol && r === nRow) {
                  setIsGameOver(true);
                  setIsWin(false);
                }
              }
            }
          }
        }

        // Check Victory
        if (newTreasures >= totalTreasures && !isGameOver) {
          setIsGameOver(true);
          setIsWin(true);
          const duration = (Date.now() - startTimeRef.current) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: '2d_card_heist',
            gameTitle: '2D 카드 하이스트',
            durationSeconds: duration,
            score: newTreasures * 1000 + 2000,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }

        return nextGrid;
      });

      return { row: nRow, col: nCol };
    });
  }, [isGameOver, isPaused, playerCardId, treasuresCollected, totalTreasures, onReward, playSfx]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 보물 침투 탈취' : 'STEP 1: INFILTRATION',
      title: isKo ? '경비병 회피 & 모든 보물 수집' : 'Dodge Guards & Collect Loot',
      description: isKo
        ? '순찰 중인 경비 카드들의 시야를 피해 잠입하고 금고의 보물 카드를 모두 수집하세요.'
        : 'Sneak past patrol guards and collect all target treasure cards.',
      keyPoints: isKo
        ? [
            '보물 전원 수집 시 완승',
            '경비 카드와 접촉 시 즉시 발각',
            '최단 경로 이동 시 고득점'
          ]
        : [
            'Collect all loot to win',
            'Avoid contact with patrol guards',
            'Fewer moves yield higher scores'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '스와이프 & 원핸드 D-패드' : 'Swipe & One-Hand D-Pad',
      description: isKo
        ? '화면 스와이프 또는 하단 컴팩트 D-패드로 4방향 잠입 이동을 완벽하게 수행합니다.'
        : 'Swipe screen or tap one-handed D-pad to move in 4 orthogonal directions.',
      keyPoints: isKo
        ? [
            '👆 스와이프: 상하좌우 신속 침투',
            '🕹️ 컴팩트 D-패드 원터치 이동',
            '⚡ 턴제 잠입 기동 메커니즘'
          ]
        : [
            '👆 Swipe: Quick 4-way infiltration',
            '🕹️ Compact D-pad one-touch move',
            '⚡ Turn-based stealth mechanism'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '잠입 성공 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon heist completion.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '탈취 보물 및 잔여 턴수 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Treasure and turns bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '2D 카드 하이스트' : '2D Card Heist'}
        language={language}
        telemetries={[
          { label: isKo ? '스테이지' : 'Stage', value: `LV.${level}`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '보물' : 'Loot', value: `${treasuresCollected}/${totalTreasures}`, color: 'text-emerald-700 font-bold' },
          { label: isKo ? '이동' : 'Moves', value: `${moves}턴`, color: 'text-slate-700' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Game Grid Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2">
        <div
          className="w-full max-w-[340px] aspect-square bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-1 relative overflow-hidden touch-none select-none"
          style={{ touchAction: 'none' }}
        >
          <div
            className="grid gap-1 w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${GRID}, 1fr)`,
              gridTemplateRows: `repeat(${GRID}, 1fr)`,
            }}
          >
            {grid.flatMap((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={cn(
                    'rounded-sm flex items-center justify-center relative transition-all duration-100 border',
                    cell.type === 'empty' && 'bg-white border-[rgba(15,0,0,0.06)]',
                    cell.type === 'treasure' && 'bg-amber-100/60 border-amber-500/60',
                    cell.type === 'player' && 'bg-cyan-100/60 border-cyan-500 ring-1 ring-cyan-500',
                    cell.type === 'enemy' && 'bg-rose-100/60 border-rose-500/60'
                  )}
                >
                  {cell.cardId > 0 && (
                    <div
                      className="w-full h-full bg-contain bg-center bg-no-repeat p-0.5"
                      style={getCardSpriteStyle(cell.cardId)}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile One-Handed D-Pad */}
      <div className="shrink-0 flex flex-col items-center gap-1 select-none pb-3">
        <button
          type="button"
          onClick={() => movePlayer(-1, 0)}
          className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
        >
          ▲
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => movePlayer(0, -1)}
            className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => movePlayer(1, 0)}
            className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => movePlayer(0, 1)}
            className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_heist"
          gameTitle={isKo ? '2D 카드 하이스트 탈출' : '2D Card Heist Infiltration'}
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
          onPlayAgain={() => {
            if (isWin) setLevel(prev => Math.min(prev + 1, 5));
            initGame();
          }}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default CardHeistGame;
