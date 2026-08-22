import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MobileSafeAreaHUD } from './MobileSafeAreaHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { get2DGameTutorialSteps } from '../lib/mission2DCardTutorialEngine';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface CardTapGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const GRID_COLS = 3;
const GRID_ROWS = 3;
const GAME_DURATION = 30;
const SWIPE_THRESHOLD = 15;
const FAST_SWIPE_MS = 200;
const BASE_SPAWN_INTERVAL = 1200;
const MIN_SPAWN_INTERVAL = 500;
const BASE_HIDE_TIME = 1000;
const MIN_HIDE_TIME = 500;

interface MoleState {
  id: number;
  row: number;
  col: number;
  cardId: number;
  type: 'enemy' | 'bonus' | 'bomb';
  showUntil: number;
  tapped: boolean;
}

type GameStatus = 'ready' | 'playing' | 'gameover';

export const CardTapGame: React.FC<CardTapGameProps> = ({
  deck,
  language,
  lowSpecMode,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_tap') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [status, setStatus] = useState<GameStatus>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [highScore, setHighScore] = useState(0);
  const [moles, setMoles] = useState<MoleState[]>([]);
  const [combo, setCombo] = useState(0);
  const [comboText, setComboText] = useState('');
  const [tappedCells, setTappedCells] = useState<Set<string>>(new Set());
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameLoopRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const nextMoleIdRef = useRef(0);
  const rewardedRef = useRef(false);
  const comboTimeoutRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const molesRef = useRef<MoleState[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('hero_cardtap_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const playSound = useCallback((url: string) => {
    playSfx(url);
  }, [playSfx]);

  const getDifficultyFactor = useCallback((): number => {
    if (status !== 'playing' || isPaused || showTutorial) return 0;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    return Math.min(elapsed / GAME_DURATION, 1);
  }, [status, isPaused, showTutorial]);

  const spawnMole = useCallback(() => {
    const factor = getDifficultyFactor();
    const spawnInterval = BASE_SPAWN_INTERVAL - (BASE_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL) * factor;
    const now = Date.now();

    if (now - lastSpawnRef.current < spawnInterval) return;
    lastSpawnRef.current = now;

    const row = Math.floor(Math.random() * GRID_ROWS);
    const col = Math.floor(Math.random() * GRID_COLS);

    const occupied = molesRef.current.some(m => m.row === row && m.col === col);
    if (occupied) return;

    const rand = Math.random();
    let type: MoleState['type'] = 'enemy';
    let cardId: number;

    if (rand < 0.15 && deck.length > 0) {
      type = 'bonus';
      cardId = deck[Math.floor(Math.random() * deck.length)].id;
    } else if (rand < 0.25) {
      type = 'bomb';
      cardId = Math.floor(Math.random() * 110) + 1;
    } else {
      type = 'enemy';
      cardId = Math.floor(Math.random() * 110) + 1;
    }

    const hideTime = BASE_HIDE_TIME - (BASE_HIDE_TIME - MIN_HIDE_TIME) * factor;
    const mole: MoleState = {
      id: nextMoleIdRef.current++,
      row,
      col,
      cardId,
      type,
      showUntil: now + hideTime,
      tapped: false,
    };

    molesRef.current = [...molesRef.current, mole];
    setMoles(molesRef.current);
  }, [deck, getDifficultyFactor]);

  const tapMole = useCallback((row: number, col: number) => {
    if (status !== 'playing' || isPaused || showTutorial) return;

    const now = Date.now();
    const activeMoles = molesRef.current.filter(m => m.showUntil > now && !m.tapped);
    const hitMole = activeMoles.find(m => m.row === row && m.col === col);

    if (!hitMole) return;

    molesRef.current = molesRef.current.map(m =>
      m.id === hitMole.id ? { ...m, tapped: true } : m
    );
    setMoles(molesRef.current);

    const cellKey = `${row}-${col}`;
    setTappedCells(prev => new Set([...prev, cellKey]));
    setTimeout(() => {
      setTappedCells(prev => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }, 150);

    if (hitMole.type === 'bomb') {
      setCombo(0);
      setComboText(isKo ? '💥 폭탄!' : '💥 BOMB!');
      scoreRef.current = Math.max(0, scoreRef.current - 50);
      setScore(scoreRef.current);
      playSound('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      comboTimeoutRef.current = window.setTimeout(() => setComboText(''), 800);
      return;
    }

    const newCombo = combo + 1;
    setCombo(newCombo);
    const points = hitMole.type === 'bonus' ? 30 : 10;
    const comboBonus = Math.floor((newCombo - 1) * 5);
    const earnedPoints = points + comboBonus;

    scoreRef.current += earnedPoints;
    setScore(scoreRef.current);

    if (newCombo >= 5) {
      setComboText(isKo ? `🔥 ${newCombo} 콤보!` : `🔥 ${newCombo}x COMBO!`);
    } else if (newCombo >= 3) {
      setComboText(isKo ? `✨ ${newCombo} 연속!` : `✨ ${newCombo} streak!`);
    } else {
      setComboText(hitMole.type === 'bonus' ? (isKo ? '+30 보너스!' : '+30 BONUS!') : `+${earnedPoints}`);
    }

    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    comboTimeoutRef.current = window.setTimeout(() => setComboText(''), 800);

    playSound(
      hitMole.type === 'bonus'
        ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'
        : 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
    );
  }, [status, isPaused, showTutorial, combo, isKo, playSound]);

  const startGame = useCallback(() => {
    setStatus('playing');
    setScore(0);
    setLives(3);
    setTimeLeft(GAME_DURATION);
    setMoles([]);
    setCombo(0);
    setComboText('');
    setTappedCells(new Set());
    setSettlementReceipt(null);

    scoreRef.current = 0;
    livesRef.current = 3;
    molesRef.current = [];
    nextMoleIdRef.current = 0;
    startTimeRef.current = Date.now();
    lastSpawnRef.current = 0;
    rewardedRef.current = false;

    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    playSound('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  }, [playSound]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    if (status === 'ready') {
      startGame();
    }
  };

  // Game loop
  useEffect(() => {
    if (status !== 'playing' || isPaused || showTutorial) return;

    const tick = () => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(Math.ceil(remaining));

      const expiredMoles = molesRef.current.filter(
        m => !m.tapped && m.showUntil <= now
      );

      if (expiredMoles.length > 0) {
        molesRef.current = molesRef.current.map(m =>
          expiredMoles.some(e => e.id === m.id) ? { ...m, tapped: true } : m
        );
        setMoles(molesRef.current);

        const missedEnemies = expiredMoles.filter(m => m.type === 'enemy');
        if (missedEnemies.length > 0) {
          livesRef.current = Math.max(0, livesRef.current - missedEnemies.length);
          setLives(livesRef.current);
          setCombo(0);
          playSound('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
        }
      }

      const cleanupTime = now - 200;
      molesRef.current = molesRef.current.filter(
        m => !m.tapped || m.showUntil > cleanupTime
      );
      if (molesRef.current.length !== moles.filter(m => !m.tapped || m.showUntil > cleanupTime).length) {
        setMoles(molesRef.current);
      }

      spawnMole();

      // Check game over condition
      if (remaining <= 0 || livesRef.current <= 0) {
        const finalScore = scoreRef.current;
        if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem('hero_cardtap_highscore', String(finalScore));
        }

        if (!rewardedRef.current) {
          rewardedRef.current = true;
          const isVictory = livesRef.current > 0 && finalScore >= 100;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'card_tap',
            gameTitle: isKo ? '카드 탭: 두더지 잡기' : 'Card Tap: Whack-a-Card',
            durationSeconds: Math.round(GAME_DURATION - remaining),
            score: finalScore,
            maxTargetScore: 500,
            isVictory,
            difficulty: 'NORMAL',
            comboCount: combo,
            perfectClear: livesRef.current === 3
          });

          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }

        setStatus('gameover');
        return;
      }

      gameLoopRef.current = requestAnimationFrame(tick);
    };

    gameLoopRef.current = requestAnimationFrame(tick);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [status, isPaused, showTutorial, highScore, spawnMole, onReward, playSound, combo, isKo]);

  // Keyboard controls
  useEffect(() => {
    if (status !== 'playing' || isPaused || showTutorial) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, [number, number]> = {
        '1': [0, 0], '2': [0, 1], '3': [0, 2],
        '4': [1, 0], '5': [1, 1], '6': [1, 2],
        '7': [2, 0], '8': [2, 1], '9': [2, 2],
        'q': [0, 0], 'w': [0, 1], 'e': [0, 2],
        'a': [1, 0], 's': [1, 1], 'd': [1, 2],
        'z': [2, 0], 'x': [2, 1], 'c': [2, 2],
      };
      const pos = keyMap[e.key.toLowerCase()];
      if (pos) {
        e.preventDefault();
        tapMole(pos[0], pos[1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, isPaused, showTutorial, tapMole]);

  const getTouchHandlers = (row: number, col: number) => ({
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      const start = touchStartRef.current;
      if (!start) {
        tapMole(row, col);
        return;
      }
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const dt = Date.now() - start.time;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const threshold = dt < FAST_SWIPE_MS ? SWIPE_THRESHOLD * 0.6 : SWIPE_THRESHOLD;

      if (dist < threshold) {
        tapMole(row, col);
      }
      touchStartRef.current = null;
    },
  });

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    };
  }, []);

  const activeMoles = moles.filter(m => !m.tapped && m.showUntil > Date.now());
  const tutorialSteps = get2DGameTutorialSteps('card_tap', isKo);

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#0f1117] text-slate-100 flex flex-col justify-between font-mono select-none">
      {/* Safe Area Top HUD */}
      <MobileSafeAreaHUD
        gameTitle={isKo ? '카드 탭' : 'Card Tap'}
        score={score}
        timeLeft={timeLeft}
        hp={lives}
        maxHp={3}
        combo={combo}
        isPaused={isPaused}
        language={language}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onTogglePause={() => setIsPaused(prev => !prev)}
      />

      {/* Main Board Viewport */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-3 relative overflow-hidden">
        <div
          className="w-full max-w-[340px] aspect-square bg-black/40 border border-white/10 p-1 relative overflow-hidden touch-none"
          style={{ touchAction: 'none' }}
        >
          <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-full h-full">
            {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, i) => {
              const row = Math.floor(i / GRID_COLS);
              const col = i % GRID_COLS;
              const cellKey = `${row}-${col}`;
              const mole = activeMoles.find(m => m.row === row && m.col === col);
              const wasTapped = tappedCells.has(cellKey);

              return (
                <div
                  key={i}
                  className={cn(
                    'relative rounded-sm border border-white/15 bg-slate-900 overflow-hidden cursor-pointer select-none transition-all duration-100 flex items-center justify-center',
                    mole && 'border-amber-400 bg-amber-500/10',
                    wasTapped && 'scale-95 border-amber-300 bg-amber-400/20',
                    !lowSpecMode && !mole && 'hover:border-white/20'
                  )}
                  onClick={() => tapMole(row, col)}
                  {...getTouchHandlers(row, col)}
                >
                  {mole && (
                    <div
                      className={cn(
                        'w-[90%] h-[90%] rounded-sm relative border',
                        mole.type === 'bonus' && 'border-amber-400 ring-1 ring-amber-400',
                        mole.type === 'bomb' && 'border-red-500 ring-1 ring-red-500',
                        mole.type === 'enemy' && 'border-white/30'
                      )}
                      style={getCardSpriteStyle(mole.cardId)}
                    >
                      {mole.type === 'bonus' && (
                        <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-bold px-1 rounded-bl-sm">
                          ★
                        </div>
                      )}
                      {mole.type === 'bomb' && (
                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-1 rounded-bl-sm">
                          ✕
                        </div>
                      )}
                    </div>
                  )}

                  <span className="absolute bottom-0.5 right-1 text-[8px] text-slate-500 font-mono pointer-events-none">
                    {i + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Combo text overlay */}
          {comboText && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 bg-slate-900/90 border border-amber-400 px-3 py-1 text-xs font-bold text-amber-300 shadow-md animate-bounce">
              {comboText}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <p className="mt-3 text-[11px] text-slate-400 font-mono text-center">
          {isKo ? '카드가 나타나면 즉시 터치! (폭탄 ✕ 주의, 보너스 ★ 획득)' : 'Tap cards fast! Avoid bomb [✕], catch bonus [★]'}
        </p>
      </div>

      {/* Ready Screen Overlay */}
      {status === 'ready' && !showTutorial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono">
          <div className="bg-slate-900 border border-white/15 rounded-none p-6 max-w-xs text-center w-full">
            <h1 className="text-lg font-bold tracking-wider text-amber-400 mb-2">
              [{isKo ? '카드 탭' : 'CARD TAP'}]
            </h1>
            <p className="text-slate-300 text-xs mb-4">
              {isKo
                ? '3x3 격자에서 튀어나오는 카드를 탭하세요! 30초 제한'
                : 'Tap cards appearing in the 3x3 grid! 30s limit'}
            </p>
            <div className="text-left text-xs text-slate-400 space-y-1 mb-4 border border-white/10 p-2 bg-white/5">
              <div>[+] {isKo ? '일반/적: +10점' : 'Enemy card: +10'}</div>
              <div>[★] {isKo ? '보너스: +30점' : 'Bonus card: +30'}</div>
              <div>[✕] {isKo ? '폭탄: -50점 / 하트 차감' : 'Bomb: -50 / -1 Life'}</div>
              <div>[🔥] {isKo ? '연속 콤보 가산점 제공' : 'Combo bonuses'}</div>
            </div>
            {highScore > 0 && (
              <p className="text-amber-400 text-xs mb-4 font-bold">
                {isKo ? `최고 점수: ${highScore}` : `Best: ${highScore}`}
              </p>
            )}
            <button
              onClick={startGame}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold tracking-wider rounded-sm text-xs min-h-[44px] cursor-pointer"
            >
              {isKo ? '게임 시작' : 'START GAME'}
            </button>
          </div>
        </div>
      )}

      {/* Universal 2D Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_tap"
          gameTitle={isKo ? '2D 카드 탭: 두더지 잡기' : '2D Card Tap: Whack-a-Card'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={handleTutorialComplete}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Standardized Victory/Reward Settlement Modal */}
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
