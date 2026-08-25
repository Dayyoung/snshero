import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Shield } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface CardRushGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';
type CellKind = 'empty' | 'player' | 'ally' | 'enemy' | 'gate';

interface Cell {
  kind: CellKind;
  cardId: number;
  backgroundCardId: number;
}

interface Position {
  row: number;
  col: number;
}

const CARD_POOL = Object.keys(CARD_DATABASE)
  .map(Number)
  .filter((id) => Number.isFinite(id) && id > 0);

const getValidCardId = (card?: CardData | null): number => {
  const imageIndex = card?.imageIndex;
  if (typeof imageIndex === 'number' && imageIndex > 0) return imageIndex;
  const parsed = Number(card?.id ?? NaN);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 1;
};

const pickRandomCardId = (exclude = new Set<number>()): number => {
  const available = CARD_POOL.filter((id) => !exclude.has(id));
  const pool = available.length > 0 ? available : CARD_POOL;
  return pool[Math.floor(Math.random() * pool.length)] || 1;
};

const createCell = (backgroundCardId: number, kind: CellKind = 'empty', cardId = backgroundCardId): Cell => ({
  kind,
  cardId,
  backgroundCardId,
});

export const CardRushGame: React.FC<CardRushGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const boardSize = 6;
  const allyTargetCount = 3;
  const enemyCount = 3;

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_rush') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const heroCardId = useMemo(() => getValidCardId(deck[0]), [deck]);
  const allyCardIds = useMemo(() => {
    const used = new Set<number>([heroCardId]);
    const ids: number[] = [];
    for (let i = 1; i < deck.length && ids.length < allyTargetCount; i += 1) {
      const id = getValidCardId(deck[i]);
      if (!used.has(id)) {
        used.add(id);
        ids.push(id);
      }
    }
    while (ids.length < allyTargetCount) {
      const fallback = pickRandomCardId(used);
      used.add(fallback);
      ids.push(fallback);
    }
    return ids;
  }, [allyTargetCount, deck, heroCardId]);

  const enemyCardIds = useMemo(() => {
    const used = new Set<number>([heroCardId, ...allyCardIds]);
    const ids: number[] = [];
    while (ids.length < enemyCount) {
      const picked = pickRandomCardId(used);
      used.add(picked);
      ids.push(picked);
    }
    return ids;
  }, [allyCardIds, enemyCount, heroCardId]);

  const gateCardId = useMemo(() => {
    const used = new Set<number>([heroCardId, ...allyCardIds, ...enemyCardIds]);
    return pickRandomCardId(used);
  }, [allyCardIds, enemyCardIds, heroCardId]);

  const [board, setBoard] = useState<Cell[][]>(() =>
    Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => createCell(1, 'empty', 1))
    )
  );
  const [playerPos, setPlayerPos] = useState<Position>({ row: 0, col: 0 });
  const [gatePos, setGatePos] = useState<Position>({ row: boardSize - 1, col: boardSize - 1 });
  const [rescuedCount, setRescuedCount] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());
  const gateOpen = rescuedCount >= allyTargetCount;

  const buildBoard = useCallback(() => {
    const usedBg = new Set<number>();
    const nextBoard: Cell[][] = Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => {
        const bgId = pickRandomCardId(usedBg);
        usedBg.add(bgId);
        return createCell(bgId, 'empty', bgId);
      })
    );

    const pPos: Position = { row: 0, col: 0 };
    const gPos: Position = { row: boardSize - 1, col: boardSize - 1 };

    nextBoard[pPos.row][pPos.col] = createCell(nextBoard[pPos.row][pPos.col].backgroundCardId, 'player', heroCardId);
    nextBoard[gPos.row][gPos.col] = createCell(nextBoard[gPos.row][gPos.col].backgroundCardId, 'gate', gateCardId);

    const emptySlots: Position[] = [];
    for (let r = 0; r < boardSize; r += 1) {
      for (let c = 0; c < boardSize; c += 1) {
        if ((r === pPos.row && c === pPos.col) || (r === gPos.row && c === gPos.col)) continue;
        emptySlots.push({ row: r, col: c });
      }
    }

    // Place Allies
    allyCardIds.forEach(id => {
      if (emptySlots.length === 0) return;
      const idx = Math.floor(Math.random() * emptySlots.length);
      const { row, col } = emptySlots.splice(idx, 1)[0];
      nextBoard[row][col] = createCell(nextBoard[row][col].backgroundCardId, 'ally', id);
    });

    // Place Enemies
    enemyCardIds.forEach(id => {
      if (emptySlots.length === 0) return;
      const idx = Math.floor(Math.random() * emptySlots.length);
      const { row, col } = emptySlots.splice(idx, 1)[0];
      nextBoard[row][col] = createCell(nextBoard[row][col].backgroundCardId, 'enemy', id);
    });

    setBoard(nextBoard);
    setPlayerPos(pPos);
    setGatePos(gPos);
    setRescuedCount(0);
    setMoves(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [allyCardIds, boardSize, enemyCardIds, gateCardId, heroCardId]);

  useEffect(() => {
    buildBoard();
  }, [buildBoard]);

  const movePlayer = useCallback((dir: Direction) => {
    if (isGameOver || isPaused) return;

    setPlayerPos(prev => {
      let nRow = prev.row;
      let nCol = prev.col;
      if (dir === 'up') nRow -= 1;
      if (dir === 'down') nRow += 1;
      if (dir === 'left') nCol -= 1;
      if (dir === 'right') nCol += 1;

      if (nRow < 0 || nRow >= boardSize || nCol < 0 || nCol >= boardSize) return prev;

      setMoves(m => m + 1);

      setBoard(curr => {
        const next = curr.map(r => r.map(c => ({ ...c })));
        const target = next[nRow][nCol];

        if (target.kind === 'enemy') {
          // Busted by Enemy
          setIsGameOver(true);
          const duration = (Date.now() - startTimeRef.current) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: '2d_card_rush',
            gameTitle: '2D 카드 러시',
            durationSeconds: duration,
            score: rescuedCount * 400,
            difficulty: 'HARD',
            isVictory: false
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          return next;
        }

        let newRescued = rescuedCount;
        if (target.kind === 'ally') {
          newRescued += 1;
          setRescuedCount(newRescued);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }

        if (target.kind === 'gate' && newRescued >= allyTargetCount) {
          // Escape Victory!
          setIsGameOver(true);
          const duration = (Date.now() - startTimeRef.current) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: '2d_card_rush',
            gameTitle: '2D 카드 러시',
            durationSeconds: duration,
            score: newRescued * 1000 + 2000,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }

        next[prev.row][prev.col] = createCell(next[prev.row][prev.col].backgroundCardId, 'empty');
        next[nRow][nCol] = createCell(next[nRow][nCol].backgroundCardId, 'player', heroCardId);

        return next;
      });

      return { row: nRow, col: nCol };
    });
  }, [allyTargetCount, boardSize, heroCardId, isGameOver, isPaused, onReward, playSfx, rescuedCount]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 동료 구출 & 차원문 탈출' : 'STEP 1: RESCUE & ESCAPE',
      title: isKo ? '동료 3명 구출 후 포털 탈출' : 'Rescue 3 Allies & Escape',
      description: isKo
        ? '던전 격자판을 탐색하여 갇힌 동료 카드 3명을 모두 구출하고 개방된 차원문으로 탈출하세요.'
        : 'Explore the grid to rescue 3 trapped ally cards and exit via the opened portal.',
      keyPoints: isKo
        ? [
            '동료 3명 구출 시 차원문 개방',
            '적 몬스터 카드와 접촉 시 패배',
            '최단 턴수 탈출 시 고득점'
          ]
        : [
            'Rescue 3 allies to open portal',
            'Avoid monster cards',
            'Fewer moves yield higher scores'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '스와이프 & 원핸드 D-패드' : 'Swipe & One-Hand D-Pad',
      description: isKo
        ? '화면 스와이프 또는 하단 D-패드를 원터치하여 4방향 던전 탐색을 진행합니다.'
        : 'Swipe screen or tap one-handed D-pad to navigate in 4 directions.',
      keyPoints: isKo
        ? [
            '👆 스와이프: 상하좌우 신속 이동',
            '🕹️ 컴팩트 D-패드 원터치 조작',
            '⚡ 턴제 장애물 회피'
          ]
        : [
            '👆 Swipe: Fast 4-way movement',
            '🕹️ Compact D-pad one-touch move',
            '⚡ Turn-based obstacle avoidance'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '던전 탈출 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon dungeon escape.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '구출 동료 및 잔여 턴수 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Rescue count and turns bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '2D 카드 러시' : '2D Card Rush'}
        language={language}
        telemetries={[
          { label: isKo ? '구출' : 'Allies', value: `${rescuedCount}/${allyTargetCount}`, color: rescuedCount >= allyTargetCount ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold' },
          { label: isKo ? '포털' : 'Gate', value: gateOpen ? 'OPEN' : 'LOCKED', color: gateOpen ? 'text-cyan-700 font-bold' : 'text-slate-500' },
          { label: isKo ? '이동' : 'Moves', value: `${moves}턴`, color: 'text-slate-700' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Grid Container */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2">
        <div className="w-full max-w-[340px] aspect-square bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-1.5 relative overflow-hidden touch-none select-none">
          <div
            className="grid gap-1 w-full h-full"
            style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
          >
            {board.flatMap((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={cn(
                    'relative aspect-square rounded-sm overflow-hidden border transition-all duration-100',
                    cell.kind === 'empty' && 'border-[rgba(15,0,0,0.06)] bg-white',
                    cell.kind === 'player' && 'border-amber-500 ring-2 ring-amber-400 bg-amber-50',
                    cell.kind === 'ally' && 'border-emerald-500 ring-1 ring-emerald-400 bg-emerald-50',
                    cell.kind === 'enemy' && 'border-rose-500 ring-1 ring-rose-400 bg-rose-50',
                    cell.kind === 'gate' && (gateOpen ? 'border-cyan-500 ring-2 ring-cyan-400 bg-cyan-50' : 'border-slate-400 bg-slate-100')
                  )}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-0.5">
                    {cell.kind !== 'empty' && (
                      <div className="w-[88%] h-[88%] rounded-sm overflow-hidden border border-black/10">
                        <div className="w-full h-full" style={getCardSpriteStyle(cell.cardId)} />
                      </div>
                    )}
                  </div>
                  {cell.kind === 'gate' && !gateOpen && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Shield size={14} className="text-white" />
                    </div>
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
          onClick={() => movePlayer('up')}
          className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
        >
          ▲
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => movePlayer('left')}
            className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => movePlayer('down')}
            className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => movePlayer('right')}
            className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_rush"
          gameTitle={isKo ? '2D 카드 러시: 던전 탈출' : '2D Card Rush: Dungeon Escape'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory / Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={buildBoard}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default CardRushGame;
