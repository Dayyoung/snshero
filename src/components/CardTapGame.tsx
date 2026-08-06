import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Heart, Zap, Timer } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

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

const getCardSpriteStyle = (cardId: number): React.CSSProperties => {
  const idx = CARD_DATABASE[cardId] ? cardId : 1;
  const x = Math.floor(((idx - 1) % 10) * (100 / 9) * 100) / 100;
  const y = Math.floor(((idx - 1) / 10) * (100 / 10) * 100) / 100;
  return {
    backgroundImage: 'url(/card100.png)',
    backgroundSize: '1000% 1100%',
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated' as const,
  };
};

export const CardTapGame: React.FC<CardTapGameProps> = ({
  deck,
  language,
  lowSpecMode,
  playSfx,
  onExit,
  onReward,
}) => {
  const [status, setStatus] = useState<GameStatus>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [highScore, setHighScore] = useState(0);
  const [moles, setMoles] = useState<MoleState[]>([]);
  const [combo, setCombo] = useState(0);
  const [comboText, setComboText] = useState('');
  const [tappedCells, setTappedCells] = useState<Set<string>>(new Set());

  const gameLoopRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const nextMoleIdRef = useRef(0);
  const rewardedRef = useRef(false);
  const comboTimeoutRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const molesRef = useRef<MoleState[]>([]);

  const isKo = language === 'ko';

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('hero_cardtap_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const playSound = useCallback((url: string) => {
    playSfx(url);
  }, [playSfx]);

  const getDifficultyFactor = useCallback((): number => {
    if (status !== 'playing') return 0;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    return Math.min(elapsed / GAME_DURATION, 1);
  }, [status]);

  const spawnMole = useCallback(() => {
    const factor = getDifficultyFactor();
    const spawnInterval = BASE_SPAWN_INTERVAL - (BASE_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL) * factor;
    const now = Date.now();

    if (now - lastSpawnRef.current < spawnInterval) return;
    lastSpawnRef.current = now;

    const row = Math.floor(Math.random() * GRID_ROWS);
    const col = Math.floor(Math.random() * GRID_COLS);

    // Don't spawn on occupied cells
    const occupied = molesRef.current.some(m => m.row === row && m.col === col);
    if (occupied) return;

    // Pick card type
    const rand = Math.random();
    let type: MoleState['type'] = 'enemy';
    let cardId: number;

    if (rand < 0.15 && deck.length > 0) {
      // Bonus: use a card from the player's deck
      type = 'bonus';
      cardId = deck[Math.floor(Math.random() * deck.length)].id;
    } else if (rand < 0.25) {
      // Bomb
      type = 'bomb';
      cardId = Math.floor(Math.random() * 110) + 1;
    } else {
      // Enemy
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
    if (status !== 'playing') return;

    const now = Date.now();
    const activeMoles = molesRef.current.filter(m => m.showUntil > now && !m.tapped);
    const hitMole = activeMoles.find(m => m.row === row && m.col === col);

    if (!hitMole) return;

    // Mark as tapped
    molesRef.current = molesRef.current.map(m =>
      m.id === hitMole.id ? { ...m, tapped: true } : m
    );
    setMoles(molesRef.current);

    // Visual feedback
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
      // Penalty
      setCombo(0);
      setComboText(isKo ? '💥 폭탄!' : '💥 BOMB!');
      scoreRef.current = Math.max(0, scoreRef.current - 50);
      setScore(scoreRef.current);
      playSound('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      comboTimeoutRef.current = window.setTimeout(() => setComboText(''), 800);
      return;
    }

    // Hit!
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
  }, [status, combo, isKo, playSound]);

  const startGame = useCallback(() => {
    setStatus('playing');
    setScore(0);
    setLives(3);
    setTimeLeft(GAME_DURATION);
    setMoles([]);
    setCombo(0);
    setComboText('');
    setTappedCells(new Set());

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

  // Game loop
  useEffect(() => {
    if (status !== 'playing') return;

    const tick = () => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(Math.ceil(remaining));

      // Check expired moles (missed)
      const expiredMoles = molesRef.current.filter(
        m => !m.tapped && m.showUntil <= now
      );

      if (expiredMoles.length > 0) {
        // Mark expired as tapped so they're removed
        molesRef.current = molesRef.current.map(m =>
          expiredMoles.some(e => e.id === m.id) ? { ...m, tapped: true } : m
        );
        setMoles(molesRef.current);

        // Only lose life for enemy moles that expired (not bonus/bomb)
        const missedEnemies = expiredMoles.filter(m => m.type === 'enemy');
        if (missedEnemies.length > 0) {
          livesRef.current = Math.max(0, livesRef.current - missedEnemies.length);
          setLives(livesRef.current);
          setCombo(0);
          playSound('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
        }
      }

      // Remove tapped/expired moles (after 200ms for animation)
      const cleanupTime = now - 200;
      molesRef.current = molesRef.current.filter(
        m => !m.tapped || m.showUntil > cleanupTime
      );
      // Keep only active or recently tapped moles
      if (molesRef.current.length !== moles.filter(m => !m.tapped || m.showUntil > cleanupTime).length) {
        setMoles(molesRef.current);
      }

      // Spawn new moles
      spawnMole();

      // Check game over
      if (remaining <= 0 || livesRef.current <= 0) {
        // Game over
        const finalScore = scoreRef.current;
        if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem('hero_cardtap_highscore', String(finalScore));
        }

        // Calculate reward
        const reward = Math.floor(finalScore / 5);
        if (!rewardedRef.current) {
          rewardedRef.current = true;
          setTimeout(() => onReward(reward), 300);
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
  }, [status, highScore, spawnMole, onReward, playSound]);

  // Keyboard controls
  useEffect(() => {
    if (status !== 'playing') return;

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
  }, [status, tapMole]);

  // Touch handlers for cells
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
        // Tap
        tapMole(row, col);
      }
      // If swipe detected, don't do anything (no swipe actions in this game)
      touchStartRef.current = null;
    },
  });

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    };
  }, []);

  const activeMoles = moles.filter(m => !m.tapped && m.showUntil > Date.now());

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between mb-2">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-indigo-300/60 hover:text-indigo-200 transition-colors text-sm font-black tracking-wider"
        >
          <ArrowLeft size={18} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Lives */}
          <div className="flex items-center gap-1">
            {[0, 1, 2].map(i => (
              <Heart
                key={i}
                size={16}
                className={cn(
                  'transition-all',
                  i < lives
                    ? 'text-rose-400 fill-rose-400'
                    : 'text-slate-600'
                )}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1 text-amber-400">
            <Timer size={16} />
            <span className="text-sm font-black tracking-wider tabular-nums">
              {timeLeft}s
            </span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1 text-amber-400">
            <Zap size={16} />
            <span className="text-sm font-black tracking-wider tabular-nums">
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div
        className="relative w-full max-w-sm aspect-square bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-indigo-900/20 p-3"
        style={{ touchAction: 'none' as const }}
      >
        {/* Grid background */}
        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full h-full">
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
                  'relative rounded-xl border border-white/10 bg-indigo-950/60 overflow-hidden cursor-pointer select-none transition-all duration-100',
                  mole && 'border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/10',
                  wasTapped && 'scale-95 border-amber-400/60 bg-amber-400/10',
                  !lowSpecMode && !mole && 'hover:border-white/15'
                )}
                onClick={() => tapMole(row, col)}
                {...getTouchHandlers(row, col)}
              >
                {/* Hole shadow */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

                {/* Mole card */}
                {mole && (
                  <div
                    className={cn(
                      'absolute inset-1 rounded-lg transition-all duration-100',
                      mole.type === 'bonus' && 'ring-2 ring-amber-400/60 shadow-lg shadow-amber-400/20',
                      mole.type === 'bomb' && 'ring-2 ring-red-500/60 shadow-lg shadow-red-500/20',
                    )}
                    style={getCardSpriteStyle(mole.cardId)}
                  >
                    {/* Type indicator */}
                    {mole.type === 'bonus' && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] shadow-lg">
                        ⭐
                      </div>
                    )}
                    {mole.type === 'bomb' && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] shadow-lg">
                        💣
                      </div>
                    )}
                  </div>
                )}

                {/* Cell number hint (corner, subtle) */}
                <span className="absolute bottom-0.5 right-1 text-[9px] text-slate-600 font-mono leading-none pointer-events-none select-none">
                  {i + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Combo text overlay */}
        {comboText && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
            <span
              className={cn(
                'text-xl font-black tracking-wider drop-shadow-lg animate-pulse',
                combo >= 5 ? 'text-amber-400' : comboText.includes('폭탄') || comboText.includes('BOMB') ? 'text-red-400' : 'text-amber-200'
              )}
            >
              {comboText}
            </span>
          </div>
        )}
      </div>

      {/* Ready Screen Overlay */}
      {status === 'ready' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl p-8 max-w-sm text-center">
            <h1 className="text-3xl font-black tracking-wider text-amber-400 mb-3">
              {isKo ? '카드 탭' : 'CARD TAP'}
            </h1>
            <p className="text-indigo-300/60 text-sm font-black tracking-wider mb-6">
              {isKo
                ? '구멍에서 튀어나오는 카드들을 탭하세요!\n3x3 그리드, 30초 제한'
                : 'Tap the cards popping out of holes!\n3x3 grid, 30 second timer'}
            </p>
            <div className="flex flex-col gap-2 mb-6 text-left text-xs text-indigo-300/50 font-black tracking-wider">
              <div>🎯 {isKo ? '적 카드: +10점' : 'Enemy card: +10 pts'}</div>
              <div>⭐ {isKo ? '보너스 카드: +30점' : 'Bonus card: +30 pts'}</div>
              <div>💣 {isKo ? '폭탄 카드: -50점 (피하세요!)' : 'Bomb card: -50 pts (AVOID!)'}</div>
              <div>🔥 {isKo ? '콤보: 콤보당 +5 추가점수' : 'Combo: +5 extra per combo'}</div>
              <div className="mt-2 text-indigo-400/60">
                ⌨️ {isKo ? '키보드: 1-9 키 또는 QWE/ASD/ZXC' : 'Keyboard: 1-9 keys or QWE/ASD/ZXC'}
              </div>
            </div>
            {highScore > 0 && (
              <p className="text-amber-500/60 text-xs font-black tracking-wider mb-4">
                {isKo ? `최고 점수: ${highScore}` : `High Score: ${highScore}`}
              </p>
            )}
            <button
              onClick={startGame}
              className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              {isKo ? '게임 시작' : 'START GAME'}
            </button>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {status === 'gameover' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl p-8 max-w-sm text-center">
            <h1 className="text-2xl font-black tracking-wider text-amber-400 mb-2">
              {isKo ? '게임 오버' : 'GAME OVER'}
            </h1>
            <div className="text-4xl font-black tracking-wider text-white mb-2">
              {score}
            </div>
            <p className="text-indigo-300/60 text-sm font-black tracking-wider mb-1">
              {isKo ? `SNS 보상: +${Math.floor(score / 5)}` : `SNS Reward: +${Math.floor(score / 5)}`}
            </p>
            {score >= highScore && score > 0 && (
              <p className="text-amber-400 text-xs font-black tracking-wider mb-4">
                🏆 {isKo ? '최고 기록!' : 'NEW HIGH SCORE!'}
              </p>
            )}
            {highScore > 0 && score < highScore && (
              <p className="text-indigo-400/50 text-xs font-black tracking-wider mb-4">
                {isKo ? `최고 점수: ${highScore}` : `Best: ${highScore}`}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={startGame}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 text-sm"
              >
                {isKo ? '다시 하기' : 'RETRY'}
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-black tracking-wider rounded-xl transition-all text-sm"
              >
                {isKo ? '나가기' : 'EXIT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
