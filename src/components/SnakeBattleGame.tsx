import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Zap } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn, getCardSpriteStyle } from '../lib/utils';

type Direction = 'up' | 'down' | 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

interface SnakeSegment extends Point {
  cardId: number;
}

interface AiSnake {
  id: string;
  name: string;
  color: string;
  direction: Direction;
  segments: SnakeSegment[];
}

interface PeerSnake {
  id: string;
  name: string;
  segments: SnakeSegment[];
  updatedAt: number;
}

interface SnakeBattleGameProps {
  deck: CardData[];
  language: Language;
  playerName?: string;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const BOARD_SIZE = 18;
const TICK_MS = 140;
const CHANNEL_NAME = 'hero_snake_battle';

const getCardId = (card: CardData | undefined, fallback: number) => {
  const imageIndex = typeof card?.imageIndex === 'number' ? card.imageIndex : undefined;
  const numericId = typeof card?.id === 'number' ? card.id : undefined;
  const id = imageIndex || numericId || fallback;
  return CARD_DATABASE[id] ? id : fallback;
};

// Uses getCardSpriteStyle from utils

const wrap = (value: number) => {
  if (value < 0) return BOARD_SIZE - 1;
  if (value >= BOARD_SIZE) return 0;
  return value;
};

const movePoint = (point: Point, direction: Direction): Point => {
  if (direction === 'up') return { x: point.x, y: wrap(point.y - 1) };
  if (direction === 'down') return { x: point.x, y: wrap(point.y + 1) };
  if (direction === 'left') return { x: wrap(point.x - 1), y: point.y };
  return { x: wrap(point.x + 1), y: point.y };
};

const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

const isOppositeDirection = (a: Direction, b: Direction) => {
  return (a === 'up' && b === 'down') ||
    (a === 'down' && b === 'up') ||
    (a === 'left' && b === 'right') ||
    (a === 'right' && b === 'left');
};

const makeInitialPlayerSnake = (deck: CardData[]) => {
  const cards = Array.from({ length: 5 }).map((_, idx) => getCardId(deck[idx], idx + 1));
  return cards.map((cardId, idx) => ({ x: 9 - idx, y: 9, cardId }));
};

const makeAiSnake = (idx: number): AiSnake => {
  const baseY = 3 + idx * 4;
  const baseX = idx % 2 === 0 ? 5 : 14;
  return {
    id: `snake-ai-${idx}`,
    name: `AI-${idx + 1}`,
    color: ['bg-rose-500', 'bg-amber-500', 'bg-cyan-500'][idx] || 'bg-slate-500',
    direction: idx % 2 === 0 ? 'right' : 'left',
    segments: Array.from({ length: 4 }).map((_, segIdx) => ({
      x: baseX - segIdx,
      y: baseY,
      cardId: ((idx * 12 + segIdx) % 110) + 1
    }))
  };
};

const nextFood = () => ({
  x: Math.floor(Math.random() * BOARD_SIZE),
  y: Math.floor(Math.random() * BOARD_SIZE),
  cardId: Math.floor(Math.random() * 110) + 1
});

export const SnakeBattleGame: React.FC<SnakeBattleGameProps> = ({
  deck,
  language,
  playerName,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const playerId = useMemo(() => `snake-${Date.now()}-${Math.random().toString(36).slice(2)}`, []);
  const [showTutorial, setShowTutorial] = useState(true);
  const [isBoosting, setIsBoosting] = useState(false);
  const boostFrameRef = useRef(0);
  const [snake, setSnake] = useState<SnakeSegment[]>(() => makeInitialPlayerSnake(deck));
  const [direction, setDirection] = useState<Direction>('right');
  const [food, setFood] = useState<SnakeSegment>(() => nextFood());
  const [aiSnakes, setAiSnakes] = useState<AiSnake[]>(() => [makeAiSnake(0), makeAiSnake(1), makeAiSnake(2)]);
  const [peers, setPeers] = useState<Record<string, PeerSnake>>({});
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const directionRef = useRef(direction);
  const nextCardRef = useRef(6);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const rewardedRef = useRef(false);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const changePlayerDirection = (nextDirection: Direction) => {
    const current = directionRef.current;
    if (nextDirection === current) return;

    if (isOppositeDirection(current, nextDirection)) {
      setSnake(prev => [...prev].reverse());
    }

    directionRef.current = nextDirection;
    setDirection(nextDirection);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === ' ') {
        event.preventDefault();
        setIsBoosting(true);
        return;
      }
      const nextDirection =
        key === 'arrowup' || key === 'w' ? 'up' :
        key === 'arrowdown' || key === 's' ? 'down' :
        key === 'arrowleft' || key === 'a' ? 'left' :
        key === 'arrowright' || key === 'd' ? 'right' :
        null;

      if (!nextDirection) return;
      event.preventDefault();
      event.stopPropagation();

      changePlayerDirection(nextDirection);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        setIsBoosting(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<PeerSnake>) => {
      const data = event.data;
      if (!data || data.id === playerId) return;
      setPeers(prev => ({ ...prev, [data.id]: data }));
    };
    return () => channel.close();
  }, [playerId]);

  useEffect(() => {
    if (!channelRef.current || isGameOver) return;
    channelRef.current.postMessage({
      id: playerId,
      name: playerName || 'Player',
      segments: snake,
      updatedAt: Date.now()
    });
  }, [isGameOver, playerId, playerName, snake]);

  useEffect(() => {
    const cleanup = window.setInterval(() => {
      const now = Date.now();
      setPeers(prev => Object.fromEntries(
        (Object.entries(prev) as [string, PeerSnake][]).filter(([, peer]) => now - peer.updatedAt < 3000)
      ));
    }, 1000);
    return () => window.clearInterval(cleanup);
  }, []);

  useEffect(() => {
    if (isGameOver || showTutorial) return;
    const currentTick = isBoosting ? 70 : TICK_MS;
    const interval = window.setInterval(() => {
      if (isBoosting) {
        boostFrameRef.current += currentTick;
        if (boostFrameRef.current >= 1200) {
          boostFrameRef.current = 0;
          setScore(prev => {
            if (prev <= 1) {
              setIsBoosting(false);
              return 0;
            }
            return prev - 1;
          });
        }
      }

      setSnake(prevSnake => {
        const head = prevSnake[0];
        const nextHead = { ...movePoint(head, directionRef.current), cardId: head.cardId };
        const hitSelf = prevSnake.slice(1).some(segment => samePoint(segment, nextHead));
        const hitPeer = (Object.values(peers) as PeerSnake[]).some(peer => peer.segments.some(segment => samePoint(segment, nextHead)));

        if (hitSelf || hitPeer) {
          setIsGameOver(true);
          return prevSnake;
        }

        let grew = false;
        let nextScore = 0;
        let nextFoodState = food;
        let eatenAiId: string | null = null;
        let eatenAiSegmentIndex = -1;

        if (samePoint(nextHead, food)) {
          grew = true;
          nextScore += 1;
          nextFoodState = nextFood();
          playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        }

        aiSnakes.forEach(ai => {
          const foundIndex = ai.segments.findIndex(segment => samePoint(segment, nextHead));
          if (foundIndex >= 0 && eatenAiId === null) {
            grew = true;
            nextScore += 5;
            eatenAiId = ai.id;
            eatenAiSegmentIndex = foundIndex;
            playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
          }
        });

        if (nextFoodState !== food) setFood(nextFoodState);
        if (nextScore > 0) setScore(prev => prev + nextScore);
        if (eatenAiId) {
          setAiSnakes(prev => prev.map(ai => {
            if (ai.id !== eatenAiId) return ai;
            const remaining = ai.segments.filter((_, idx) => idx !== eatenAiSegmentIndex);
            return remaining.length > 0 ? { ...ai, segments: remaining } : makeAiSnake(Math.floor(Math.random() * 3));
          }));
        }

        const next = [nextHead, ...prevSnake];
        if (grew) {
          const nextCard = nextCardRef.current;
          nextCardRef.current = nextCard >= 110 ? 1 : nextCard + 1;
          next.push({ ...prevSnake[prevSnake.length - 1], cardId: nextCard });
        } else {
          next.pop();
        }
        return next;
      });

      setAiSnakes(prev => prev.map(ai => {
        if (ai.segments.length === 0) return ai;
        const head = ai.segments[0];
        const horizontal = Math.abs(food.x - head.x) > Math.abs(food.y - head.y);
        const preferred: Direction = horizontal ? (food.x > head.x ? 'right' : 'left') : (food.y > head.y ? 'down' : 'up');
        const nextDirection = Math.random() < 0.75 ? preferred : ai.direction;
        const nextHead = { ...movePoint(head, nextDirection), cardId: head.cardId };
        const nextSegments = [nextHead, ...ai.segments];
        if (samePoint(nextHead, food)) {
          setFood(nextFood());
        } else {
          nextSegments.pop();
        }
        return { ...ai, direction: nextDirection, segments: nextSegments };
      }));
    }, currentTick);
    return () => window.clearInterval(interval);
  }, [aiSnakes, food, isGameOver, peers, playSfx, isBoosting]);

  useEffect(() => {
    if (!isGameOver || rewardedRef.current) return;
    rewardedRef.current = true;
    onReward(score * 10);
  }, [isGameOver, onReward, score]);

  const restart = () => {
    rewardedRef.current = false;
    setSnake(makeInitialPlayerSnake(deck));
    setAiSnakes([makeAiSnake(0), makeAiSnake(1), makeAiSnake(2)]);
    setDirection('right');
    setFood(nextFood());
    setScore(0);
    setIsGameOver(false);
    nextCardRef.current = 6;
  };

  const renderSegment = (segment: SnakeSegment, className: string, idx: number, label?: string) => {
    const size = 100 / BOARD_SIZE;
    const visualScale = 1;
    const offset = (size * (visualScale - 1)) / 2;

    return (
    <div
      key={`${segment.x}-${segment.y}-${segment.cardId}-${idx}`}
      className={cn('absolute overflow-visible drop-shadow-xl', className)}
      style={{
        left: `${(segment.x / BOARD_SIZE) * 100 - offset}%`,
        top: `${(segment.y / BOARD_SIZE) * 100 - offset}%`,
        width: `${size * visualScale}%`,
        height: `${size * visualScale}%`
      }}
    >
      <div
        className="w-full h-full scale-[1.25]"
        style={getCardSpriteStyle(segment.cardId)}
        title={CARD_DATABASE[segment.cardId]?.title_dis || CARD_DATABASE[segment.cardId]?.title_en || 'card'}
      />
      {label && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-black shadow-lg whitespace-nowrap border border-white/40 animate-pulse">
          {label}
        </span>
      )}
    </div>
    );
  };

  const directionLabels: Record<Direction, { arrow: string; label: string }> = {
    up: { arrow: '^', label: 'N' },
    right: { arrow: '>', label: 'E' },
    down: { arrow: 'v', label: 'S' },
    left: { arrow: '<', label: 'W' }
  };

  const DirectionButton = ({ dir }: { dir: Direction }) => (
    <button
      aria-label={dir}
      type="button"
      onPointerDown={(event) => {
        event.preventDefault();
        changePlayerDirection(dir);
      }}
      onClick={() => changePlayerDirection(dir)}
      className={cn(
        'w-14 h-14 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center leading-none font-black shadow-sm select-none touch-none',
        direction === dir && 'bg-indigo-500/70 border-indigo-300 shadow-indigo-500/30 shadow-lg'
      )}
      style={{ touchAction: 'none' }}
    >
      <span className="text-lg font-black">{directionLabels[dir].arrow}</span>
      <span className="text-[9px] font-black text-slate-300 mt-0.5">{directionLabels[dir].label}</span>
    </button>
  );

  const handleBoardPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;

    if (Math.abs(dx) > Math.abs(dy)) {
      changePlayerDirection(dx > 0 ? 'right' : 'left');
    } else {
      changePlayerDirection(dy > 0 ? 'down' : 'up');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-28 flex flex-col gap-4 font-sans">
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <button onClick={onExit} className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 transition-all active:scale-95 cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black uppercase tracking-tight">{t('mode_snake', language)}</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('snake_subtitle', language)}</p>
        </div>
        <div className="px-3 py-2 rounded-2xl bg-indigo-500/20 border border-indigo-400/20 text-indigo-100 font-black text-sm tabular-nums">
          {score}
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full flex flex-col items-center gap-6 lg:grid lg:grid-cols-[1fr_260px] lg:items-start">
        <div
          className="relative w-full max-w-[360px] aspect-square bg-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl touch-none select-none"
          onPointerDown={(event) => {
            event.preventDefault();
            handleBoardPointer(event);
          }}
          style={{ touchAction: 'none' }}
        >
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: `${100 / BOARD_SIZE}% ${100 / BOARD_SIZE}%` }} />
          <div className="pointer-events-none absolute inset-0 z-[45] text-white/25 font-black">
            <div className="absolute inset-x-[28%] top-3 h-[28%] rounded-3xl border border-white/10 bg-white/[0.03] flex items-start justify-center pt-3 text-3xl">^</div>
            <div className="absolute inset-x-[28%] bottom-3 h-[28%] rounded-3xl border border-white/10 bg-white/[0.03] flex items-end justify-center pb-3 text-3xl">v</div>
            <div className="absolute inset-y-[28%] left-3 w-[28%] rounded-3xl border border-white/10 bg-white/[0.03] flex items-center justify-start pl-3 text-3xl">&lt;</div>
            <div className="absolute inset-y-[28%] right-3 w-[28%] rounded-3xl border border-white/10 bg-white/[0.03] flex items-center justify-end pr-3 text-3xl">&gt;</div>
            <div className="absolute left-1/2 top-1/2 w-28 h-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-slate-950/20 flex items-center justify-center text-[10px] tracking-[0.3em] text-white/20">
              TOUCH
            </div>
          </div>
          {renderSegment(food, lowSpecMode ? 'bg-amber-400' : 'bg-amber-400 animate-pulse', 0)}
          {snake.map((segment, idx) => renderSegment(
            segment,
            idx === 0
              ? 'z-40 [filter:drop-shadow(0_0_16px_rgba(129,140,248,1))]'
              : 'z-30 [filter:drop-shadow(0_0_10px_rgba(99,102,241,0.75))]',
            idx,
            idx === 0 ? (language === 'ko' ? '내 지렁이' : 'YOU') : undefined
          ))}
          {aiSnakes.flatMap(ai => ai.segments.map((segment, idx) => renderSegment(segment, cn(ai.color, 'opacity-90 z-5'), idx)))}
          {(Object.values(peers) as PeerSnake[]).flatMap(peer => peer.segments.map((segment, idx) => renderSegment(segment, 'ring-2 ring-emerald-300 z-10', idx)))}

          {isGameOver && (
            <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-slate-100/80 animate-in zoom-in-95 duration-200">
                <Trophy size={42} className="mx-auto text-amber-500 mb-3 animate-bounce" />
                <h2 className="text-xl font-bold text-slate-800 mb-1">
                  {t('snake_game_over', language)}
                </h2>
                <div className="flex items-center justify-center gap-2 mb-6 mt-3">
                  <span className="text-3xl font-extrabold text-indigo-600">
                    +{score * 10}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">SNS</span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={restart}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold active:scale-95 transition-all shadow-md shadow-indigo-600/10 hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={14} />
                    {language === 'ko' ? '재시작' : 'Restart'}
                  </button>
                  <button
                    onClick={onExit}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/85 text-slate-700 font-semibold rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    {language === 'ko' ? '종료' : 'Exit'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="w-full max-w-[360px] space-y-3">
          <div className="bg-white/10 border border-white/10 rounded-3xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 text-center lg:text-left">{t('snake_controls', language)}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="grid grid-cols-3 grid-rows-3 gap-2 place-items-center w-fit">
                <div />
                <DirectionButton dir="up" />
                <div />
                <DirectionButton dir="left" />
                <div className="w-14 h-14 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-center text-[10px] font-black text-indigo-200 shadow-inner select-none">
                  MOVE
                </div>
                <DirectionButton dir="right" />
                <div />
                <DirectionButton dir="down" />
                <div />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onPointerDown={() => setIsBoosting(true)}
                  onPointerUp={() => setIsBoosting(false)}
                  onPointerLeave={() => setIsBoosting(false)}
                  className={cn(
                    "w-16 h-16 rounded-full flex flex-col items-center justify-center border font-black uppercase text-xs shadow-md transition-all active:scale-90 cursor-pointer select-none touch-none",
                    isBoosting 
                      ? "bg-amber-500 border-amber-300 text-slate-950 scale-95 shadow-amber-500/20" 
                      : "bg-white/10 border-white/15 text-amber-400 hover:bg-white/15"
                  )}
                  style={{ touchAction: 'none' }}
                >
                  <Zap size={22} className={cn(isBoosting && "animate-pulse")} />
                  <span className="text-[8px] mt-0.5">BOOST</span>
                </button>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{language === 'ko' ? '스페이스바' : 'SPACEBAR'}</span>
              </div>
            </div>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-3xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{t('snake_players', language)}</p>
            <div className="space-y-2 text-xs font-bold text-slate-300">
              <div className="flex justify-between"><span>{playerName || 'YOU'}</span><span>{snake.length}</span></div>
              {aiSnakes.map(ai => <div key={ai.id} className="flex justify-between"><span>{ai.name}</span><span>{ai.segments.length}</span></div>)}
              {(Object.values(peers) as PeerSnake[]).map(peer => <div key={peer.id} className="flex justify-between text-emerald-300"><span>{peer.name}</span><span>{peer.segments.length}</span></div>)}
            </div>
          </div>
        </aside>
      </main>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4 animate-in fade-in duration-200">
          <div className="bg-white text-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100/80 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Zap size={16} />
              </span>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                {t('tutorial_title', language)}
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
              {t('tutorial_snakebattle', language)}
            </p>
            <button
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                setShowTutorial(false);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              {t('tutorial_start_game', language)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
