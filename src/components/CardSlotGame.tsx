import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MobileSafeAreaHUD } from './MobileSafeAreaHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { get2DGameTutorialSteps } from '../lib/mission2DCardTutorialEngine';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface CardSlotGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const COLS = 3;
const ROWS = 3;
const FREE_SPINS = 5;
const SWIPE_THRESHOLD = 15;
const FAST_SWIPE_MS = 200;

const ELEMENT_EMOJI: Record<string, string> = {
  water: '💧', fire: '🔥', wind: '💨', land: '🏔️', air: '💨', earth: '🏔️',
};

type GameStatus = 'ready' | 'spinning' | 'stopping' | 'gameover';

interface SymbolData {
  cardId: number;
  element: string;
  isWild: boolean;
}

const getElement = (cardId: number): string => {
  const db = CARD_DATABASE[cardId];
  if (!db?.element) return 'neutral';
  const el = db.element.toLowerCase();
  if (el === 'air') return 'wind';
  if (el === 'earth') return 'land';
  return el;
};

const randomCardId = (): number => Math.floor(Math.random() * 110) + 1;

export const CardSlotGame: React.FC<CardSlotGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [status, setStatus] = useState<GameStatus>('ready');
  const [spinsLeft, setSpinsLeft] = useState(FREE_SPINS);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [grid, setGrid] = useState<SymbolData[][]>([]);
  const [spinningCols, setSpinningCols] = useState<boolean[]>([false, false, false]);
  const [winLines, setWinLines] = useState<number[][]>([]);
  const [lastWin, setLastWin] = useState(0);
  const [showWinFlash, setShowWinFlash] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_slot') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const rewardedRef = useRef(false);
  const scoreRef = useRef(0);
  const spinsLeftRef = useRef(FREE_SPINS);
  const spinTimersRef = useRef<number[]>([]);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const wildCardIdsRef = useRef<number[]>([]);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const saved = localStorage.getItem('hero_cardslot_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    const ids: number[] = [];
    for (const card of deck.slice(0, 5)) {
      const imgIdx = card.imageIndex || card.id || 0;
      if (imgIdx > 0 && imgIdx <= 110) ids.push(imgIdx);
    }
    wildCardIdsRef.current = ids;
  }, [deck]);

  const initGrid = useCallback((): SymbolData[][] => {
    const g: SymbolData[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: SymbolData[] = [];
      for (let c = 0; c < COLS; c++) {
        const cardId = randomCardId();
        row.push({ cardId, element: getElement(cardId), isWild: false });
      }
      g.push(row);
    }
    return g;
  }, []);

  const randomSymbol = useCallback((): SymbolData => {
    const wildIds = wildCardIdsRef.current;
    if (wildIds.length > 0 && Math.random() < 0.15) {
      const wildId = wildIds[Math.floor(Math.random() * wildIds.length)];
      return { cardId: wildId, element: getElement(wildId), isWild: true };
    }
    const cardId = randomCardId();
    return { cardId, element: getElement(cardId), isWild: false };
  }, []);

  const isMatch = (a: SymbolData, b: SymbolData): boolean => {
    if (a.isWild || b.isWild) return true;
    return a.cardId === b.cardId || a.element === b.element;
  };

  const getWinAmount = (a: SymbolData, b: SymbolData, c: SymbolData): number => {
    let base = 10;
    if (a.cardId === b.cardId && b.cardId === c.cardId) base = 40;
    else if (a.element === b.element && b.element === c.element && a.element !== 'neutral') base = 20;
    const wildCount = (a.isWild ? 1 : 0) + (b.isWild ? 1 : 0) + (c.isWild ? 1 : 0);
    if (wildCount >= 2) base *= 3;
    else if (wildCount === 1) base *= 2;
    return base;
  };

  const checkWinLines = useCallback((g: SymbolData[][]): { lines: number[][]; totalWin: number } => {
    const lines: number[][] = [];
    let totalWin = 0;

    for (let r = 0; r < ROWS; r++) {
      const a = g[r][0];
      const b = g[r][1];
      const c = g[r][2];
      if (isMatch(a, b) && isMatch(a, c)) {
        lines.push([r * COLS, r * COLS + 1, r * COLS + 2]);
        totalWin += getWinAmount(a, b, c);
      }
    }

    const d1a = g[0][0]; const d1b = g[1][1]; const d1c = g[2][2];
    if (isMatch(d1a, d1b) && isMatch(d1a, d1c)) {
      lines.push([0, 4, 8]);
      totalWin += getWinAmount(d1a, d1b, d1c);
    }

    const d2a = g[0][2]; const d2b = g[1][1]; const d2c = g[2][0];
    if (isMatch(d2a, d2b) && isMatch(d2a, d2c)) {
      lines.push([2, 4, 6]);
      totalWin += getWinAmount(d2a, d2b, d2c);
    }

    return { lines, totalWin };
  }, []);

  const triggerSettlement = useCallback((finalScore: number) => {
    if (rewardedRef.current) return;
    rewardedRef.current = true;

    const durationSeconds = Math.max(10, Math.round((Date.now() - startTimeRef.current) / 1000));
    const isVictory = finalScore >= 50;

    const receipt = calculateAndDepositMissionReward({
      gameId: 'card_slot',
      gameTitle: isKo ? '2D 카드 슬롯 머신' : '2D Card Slot Machine',
      durationSeconds,
      score: finalScore * 10,
      maxTargetScore: 1200,
      isVictory,
      difficulty: finalScore >= 100 ? 'NIGHTMARE' : finalScore >= 50 ? 'HARD' : 'NORMAL',
      comboCount: Math.floor(finalScore / 20),
      perfectClear: finalScore >= 100,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  }, [isKo, onReward]);

  const spinColumn = useCallback((colIdx: number, finalSymbols?: SymbolData[]) => {
    if (!lowSpecMode) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }

    let tickCount = 0;
    const maxTicks = 8 + colIdx * 3;
    const tickInterval = lowSpecMode ? 50 : 80;

    const tick = () => {
      tickCount++;
      setGrid(prev => {
        const next = prev.map(row => [...row]);
        for (let r = 0; r < ROWS; r++) {
          next[r][colIdx] = randomSymbol();
        }
        return next;
      });

      if (tickCount < maxTicks) {
        spinTimersRef.current[colIdx] = window.setTimeout(tick, tickInterval + tickCount * 8);
      } else {
        setGrid(prev => {
          const next = prev.map(row => [...row]);
          if (finalSymbols) {
            for (let r = 0; r < ROWS; r++) {
              next[r][colIdx] = finalSymbols[r];
            }
          }
          return next;
        });

        setSpinningCols(prev => {
          const next = [...prev];
          next[colIdx] = false;
          return next;
        });

        setSpinningCols(prevSpinning => {
          if (prevSpinning.every(s => !s) || prevSpinning.filter(s => s).length === 0) {
            setTimeout(() => evaluateResult(), 400);
          }
          return prevSpinning;
        });
      }
    };

    spinTimersRef.current[colIdx] = window.setTimeout(tick, 100);
  }, [lowSpecMode, playSfx, randomSymbol]);

  const generateFinalSymbols = useCallback((): SymbolData[] => {
    const symbols: SymbolData[] = [];
    for (let r = 0; r < ROWS; r++) {
      symbols.push(randomSymbol());
    }
    return symbols;
  }, [randomSymbol]);

  const evaluateResult = useCallback(() => {
    setGrid(prev => {
      const { lines, totalWin } = checkWinLines(prev);
      setWinLines(lines);
      setLastWin(totalWin);

      if (totalWin > 0) {
        setShowWinFlash(true);
        setTimeout(() => setShowWinFlash(false), 1200);
        scoreRef.current += totalWin;
        setScore(scoreRef.current);
        playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

        const saved = localStorage.getItem('hero_cardslot_highscore');
        const prevScore = saved ? parseInt(saved, 10) : 0;
        if (scoreRef.current > prevScore) {
          localStorage.setItem('hero_cardslot_highscore', String(scoreRef.current));
          setHighScore(scoreRef.current);
        }
      } else {
        setWinLines([]);
      }

      const isGameOver = spinsLeftRef.current <= 0;
      setStatus(isGameOver ? 'gameover' : 'ready');
      if (isGameOver) {
        triggerSettlement(scoreRef.current);
      }
      return prev;
    });
  }, [checkWinLines, playSfx, triggerSettlement]);

  const handleSpin = useCallback(() => {
    if (status !== 'ready' || showTutorial || isPaused) return;
    if (spinsLeftRef.current <= 0) return;

    spinsLeftRef.current -= 1;
    setSpinsLeft(spinsLeftRef.current);
    setSpinningCols([true, true, true]);
    setWinLines([]);
    setLastWin(0);
    setStatus('spinning');

    const finalGrid: SymbolData[][] = [];
    for (let c = 0; c < COLS; c++) {
      const symbols = generateFinalSymbols();
      finalGrid.push(symbols);
    }

    setTimeout(() => spinColumn(0, finalGrid[0]), 100);
    setTimeout(() => spinColumn(1, finalGrid[1]), 300);
    setTimeout(() => spinColumn(2, finalGrid[2]), 500);
  }, [status, showTutorial, isPaused, generateFinalSymbols, spinColumn]);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    rewardedRef.current = false;
    spinsLeftRef.current = FREE_SPINS;
    startTimeRef.current = Date.now();
    setScore(0);
    setSpinsLeft(FREE_SPINS);
    setWinLines([]);
    setLastWin(0);
    setSettlementReceipt(null);
    setGrid(initGrid());
    setStatus('ready');
  }, [initGrid]);

  useEffect(() => {
    setGrid(initGrid());
  }, [initGrid]);

  useEffect(() => {
    return () => {
      spinTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || status !== 'ready' || showTutorial || isPaused) return;
    const touch = e.changedTouches[0];
    const dy = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    const threshold = elapsed < FAST_SWIPE_MS ? SWIPE_THRESHOLD * 0.6 : SWIPE_THRESHOLD;

    if (dy > threshold) {
      handleSpin();
    }
    touchStartRef.current = null;
  }, [status, showTutorial, isPaused, handleSpin]);

  const allSpinning = spinningCols.some(s => s);
  const winIndexSet = new Set(winLines.flat());
  const tutorialSteps = get2DGameTutorialSteps('card_slot', isKo);

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#0f1117] text-slate-100 flex flex-col justify-between font-mono select-none w-full overflow-hidden">
      {/* Top Safe Area HUD */}
      <MobileSafeAreaHUD
        gameTitle={isKo ? '카드 슬롯 머신' : 'Card Slot Machine'}
        score={score}
        customMetricLabel={isKo ? '스핀' : 'Spins'}
        customMetricValue={`${spinsLeft}/${FREE_SPINS}`}
        isPaused={isPaused}
        language={language}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onTogglePause={() => setIsPaused(prev => !prev)}
      />

      {/* Status Bar */}
      <div className="w-full max-w-md mx-auto px-3 flex items-center justify-between text-xs py-1 bg-white/5 border border-white/10 shrink-0">
        <span className="text-slate-400">
          {isKo ? '최고점수' : 'HIGH'}: <span className="text-amber-400 font-bold">{highScore}</span>
        </span>
        <span className="text-slate-300">
          {isKo ? '획득' : 'LAST'}: <span className="text-emerald-400 font-bold">+{lastWin}</span>
        </span>
      </div>

      {/* 3x3 Slot Machine Viewport */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 touch-none select-none"
        style={{ touchAction: 'none' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-full max-w-[320px] aspect-square bg-black/60 border border-white/10 p-2 relative rounded-none flex flex-col justify-between">
          <div className="grid grid-cols-3 gap-2 w-full h-full">
            {grid.map((row, r) =>
              row.map((sym, c) => {
                const cellIdx = r * COLS + c;
                const isWinCell = winIndexSet.has(cellIdx);

                return (
                  <div
                    key={`${r}-${c}`}
                    className={cn(
                      'rounded-sm flex flex-col items-center justify-center relative border transition-all duration-150',
                      isWinCell
                        ? 'border-amber-400 bg-amber-950/40 ring-1 ring-amber-400'
                        : 'border-white/10 bg-slate-900/60'
                    )}
                  >
                    <div
                      className="w-12 h-12 bg-contain bg-center bg-no-repeat rounded-sm"
                      style={getCardSpriteStyle(sym.cardId)}
                    />
                    {sym.element !== 'neutral' && (
                      <span className="text-[10px] absolute bottom-1 left-1">
                        {ELEMENT_EMOJI[sym.element]}
                      </span>
                    )}
                    {sym.isWild && (
                      <span className="text-[8px] font-black text-amber-300 bg-amber-950/90 px-1 rounded-sm absolute top-1 right-1 border border-amber-400/40">
                        WILD
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Win flash */}
          {showWinFlash && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-amber-500/10">
              <div className="text-3xl font-black text-amber-400 font-mono">
                +{lastWin} SNS
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spin Controls */}
      <div className="shrink-0 flex flex-col items-center gap-1.5 w-full max-w-xs mx-auto pb-3 px-3 select-none">
        <button
          type="button"
          onClick={handleSpin}
          disabled={allSpinning || spinsLeft <= 0 || status === 'gameover'}
          className={cn(
            'w-full py-3.5 rounded-sm font-mono font-bold text-sm tracking-wider uppercase border transition-all active:scale-95 touch-manipulation min-h-[44px]',
            allSpinning || spinsLeft <= 0
              ? 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'
              : 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 shadow-md'
          )}
        >
          {allSpinning
            ? isKo ? '슬롯 회전 중...' : 'SPINNING...'
            : spinsLeft > 0
            ? isKo ? `스핀 돌리기 (${spinsLeft}회 남음)` : `SPIN (${spinsLeft} LEFT)`
            : isKo ? '스핀 소진 완료' : 'NO SPINS LEFT'}
        </button>
        <p className="text-[10px] text-slate-400 text-center font-mono">
          {isKo ? '화면 아래로 스와이프하거나 버튼을 눌러 스핀' : 'Swipe down or press button to spin'}
        </p>
      </div>

      {/* 2D Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_slot"
          gameTitle={isKo ? '2D 카드 슬롯 머신' : '2D Card Slot Machine'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory / Game Over Reward Modal */}
      {status === 'gameover' && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={startGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
