import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface SnakeBattleGameProps {
  deck: CardData[];
  language: Language;
  playerName?: string;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

interface SnakeSegment extends Point {
  cardId: number;
}

const BOARD_SIZE = 16;

const wrap = (val: number) => {
  if (val < 0) return BOARD_SIZE - 1;
  if (val >= BOARD_SIZE) return 0;
  return val;
};

export const SnakeBattleGame: React.FC<SnakeBattleGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 6;
  const [snake, setSnake] = useState<SnakeSegment[]>([]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('right');
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcade_snake') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());
  const dirRef = useRef<Direction>('right');
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const initGame = useCallback(() => {
    const playerCardId = deck[0]?.imageIndex || (deck[0]?.id as number) || 1;
    const initialSnake: SnakeSegment[] = [
      { x: 8, y: 8, cardId: playerCardId },
      { x: 7, y: 8, cardId: playerCardId },
      { x: 6, y: 8, cardId: playerCardId },
    ];
    setSnake(initialSnake);
    setFood({ x: 4, y: 4 });
    setDirection('right');
    dirRef.current = 'right';
    setScore(0);
    setLength(3);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [deck]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const changeDirection = (newDir: Direction) => {
    const cur = dirRef.current;
    if (
      (newDir === 'up' && cur === 'down') ||
      (newDir === 'down' && cur === 'up') ||
      (newDir === 'left' && cur === 'right') ||
      (newDir === 'right' && cur === 'left')
    ) {
      return;
    }
    dirRef.current = newDir;
    setDirection(newDir);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  // Game Loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const interval = setInterval(() => {
      setSnake(prev => {
        if (prev.length === 0) return prev;

        const head = prev[0];
        let nx = head.x;
        let ny = head.y;
        const d = dirRef.current;

        if (d === 'up') ny = wrap(ny - 1);
        if (d === 'down') ny = wrap(ny + 1);
        if (d === 'left') nx = wrap(nx - 1);
        if (d === 'right') nx = wrap(nx + 1);

        // Self collision check
        for (let i = 1; i < prev.length; i++) {
          if (prev[i].x === nx && prev[i].y === ny) {
            setIsGameOver(true);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            const duration = (Date.now() - startTimeRef.current) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'arcade_snake',
              gameTitle: '클래식 스네이크 배틀',
              durationSeconds: duration,
              score: prev.length * 200,
              difficulty: 'HARD',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
            return prev;
          }
        }

        const newHead: SnakeSegment = { x: nx, y: ny, cardId: head.cardId };
        const newSnake = [newHead, ...prev];

        // Eat food
        if (nx === food.x && ny === food.y) {
          setScore(s => s + 100);
          setLength(l => l + 1);
          setFood({
            x: Math.floor(Math.random() * BOARD_SIZE),
            y: Math.floor(Math.random() * BOARD_SIZE),
          });
          playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 140);

    return () => clearInterval(interval);
  }, [food, isGameOver, isPaused, onReward, playSfx]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 먹이 수집 & 꼬리 성장' : 'STEP 1: GROW SNAKE',
      title: isKo ? '황금 사과 섭취 & 몸체 확장' : 'Eat Apples & Extend Body',
      description: isKo
        ? '보드 위에 나타나는 황금 먹이를 섭취하여 꼬리를 늘리고 최고 점수를 달성하세요.'
        : 'Eat golden food items to extend your snake body and score high.',
      keyPoints: isKo
        ? [
            '먹이 섭취 시 +100P 및 길이 +1',
            '자신의 꼬리와 충돌 시 게임 오버',
            '보드 경계 통과 시 반대편으로 루프'
          ]
        : [
            'Food items give +100P and +1 length',
            'Colliding with self causes game over',
            'Screen edge wrap-around loop'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '스와이프 & 원핸드 D-패드' : 'Swipe & D-Pad Steer',
      description: isKo
        ? '화면 스와이프 또는 하단 D-패드로 4방향 이동을 빠르고 정확하게 조작합니다.'
        : 'Swipe screen or tap one-handed D-pad to change direction.',
      keyPoints: isKo
        ? [
            '👆 스와이프: 상하좌우 즉시 턴',
            '🕹️ 컴팩트 D-패드 원터치 조작',
            '⚡ 140ms 고속 반응 틱'
          ]
        : [
            '👆 Swipe: Instant 4-way turn',
            '🕹️ Compact D-pad one-touch move',
            '⚡ 140ms fast game loop'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '게임 종료 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon game finish.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '최종 몸체 길이 및 먹이 수집 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Snake length and food bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '클래식 스네이크' : 'Classic Snake'}
        language={language}
        telemetries={[
          { label: isKo ? '길이' : 'Length', value: `${length}`, color: 'text-emerald-700 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Board Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm">
        <div
          className="w-full max-w-[340px] aspect-square bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] relative overflow-hidden touch-none select-none p-1"
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => {
            touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            if (!touchStartRef.current) return;
            const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
            const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15) {
              changeDirection(dx > 0 ? 'right' : 'left');
            } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 15) {
              changeDirection(dy > 0 ? 'down' : 'up');
            }
            touchStartRef.current = null;
          }}
        >
          {/* Food */}
          <div
            style={{
              left: `${(food.x / BOARD_SIZE) * 100}%`,
              top: `${(food.y / BOARD_SIZE) * 100}%`,
              width: `${100 / BOARD_SIZE}%`,
              height: `${100 / BOARD_SIZE}%`,
            }}
            className="absolute p-0.5"
          >
            <div className="w-full h-full bg-amber-500 rounded-full animate-pulse shadow-xs" />
          </div>

          {/* Snake Segments */}
          {snake.map((seg, i) => (
            <div
              key={i}
              style={{
                left: `${(seg.x / BOARD_SIZE) * 100}%`,
                top: `${(seg.y / BOARD_SIZE) * 100}%`,
                width: `${100 / BOARD_SIZE}%`,
                height: `${100 / BOARD_SIZE}%`,
              }}
              className="absolute p-0.5"
            >
              <div
                className={cn(
                  'w-full h-full rounded-xs border transition-all',
                  i === 0 ? 'bg-[#201d1d] border-[#201d1d] shadow-xs' : 'bg-cyan-600 border-cyan-700'
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile One-Handed D-Pad */}
      <div className="shrink-0 flex flex-col items-center gap-1 select-none pb-3">
        <button
          type="button"
          onClick={() => changeDirection('up')}
          className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
        >
          ▲
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => changeDirection('left')}
            className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => changeDirection('down')}
            className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => changeDirection('right')}
            className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_snake"
          gameTitle={isKo ? '클래식 스네이크 배틀' : 'Classic Snake Battle'}
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
export default SnakeBattleGame;
