import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiShenzhenMahjongGameProps {
  onBack: () => void;
  cardId?: number;
}

interface MahjongTile {
  id: number;
  type: string;
  label: string;
  icon: string;
  color: string;
  r: number;
  c: number;
  cleared: boolean;
}

const TILE_TYPES = [
  { type: 'dragon_red', label: '紅中', icon: '🀄', color: '#dc2626' },
  { type: 'dragon_green', label: '發財', icon: '🀅', color: '#16a34a' },
  { type: 'dragon_white', label: '白板', icon: '🀆', color: '#2563eb' },
  { type: 'bamboo_1', label: '一索', icon: '🎋', color: '#059669' },
  { type: 'bamboo_2', label: '二索', icon: '🎋', color: '#047857' },
  { type: 'coin_1', label: '一筒', icon: '🪙', color: '#d97706' },
  { type: 'coin_2', label: '二筒', icon: '🪙', color: '#b45309' },
  { type: 'char_1', label: '一萬', icon: '壹', color: '#b91c1c' },
  { type: 'char_2', label: '二萬', icon: '貳', color: '#991b1b' },
  { type: 'flower_plum', label: '梅花', icon: '🌸', color: '#db2777' },
  { type: 'flower_orchid', label: '蘭花', icon: '🌺', color: '#e11d48' },
  { type: 'wind_east', label: '東風', icon: '🀀', color: '#475569' },
];

export const PokiShenzhenMahjongGame: React.FC<PokiShenzhenMahjongGameProps> = ({ onBack, cardId = 49 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pairsCleared, setPairsCleared] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    tiles: [] as MahjongTile[],
    selectedTile: null as MahjongTile | null,
    tileW: 56,
    tileH: 72,
    startX: 0,
    startY: 120,
    pairsCleared: 0,
    totalPairs: 12,
    timeLeft: 90,
    startTime: Date.now(),
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const s = gameStateRef.current;

    // Generate 12 pairs (24 tiles) shuffled into a 4 rows x 6 cols grid
    const deck: { type: string; label: string; icon: string; color: string }[] = [];
    TILE_TYPES.forEach((t) => {
      deck.push(t);
      deck.push(t);
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    s.tiles = [];
    let idx = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        const item = deck[idx];
        s.tiles.push({
          id: idx,
          type: item.type,
          label: item.label,
          icon: item.icon,
          color: item.color,
          r,
          c,
          cleared: false,
        });
        idx++;
      }
    }

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const maxW = Math.min(canvas.width - 32, 420);
      s.tileW = Math.floor(maxW / 6.4);
      s.tileH = Math.floor(s.tileW * 1.35);
      s.startX = (canvas.width - s.tileW * 6) / 2;
      s.startY = 130;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const timerInterval = setInterval(() => {
      if (s.timeLeft > 0 && !gameOver) {
        s.timeLeft--;
        setTimeLeft(s.timeLeft);
        if (s.timeLeft <= 0) {
          const won = s.pairsCleared >= s.totalPairs;
          setGameOver(true);
          setGameWon(won);
          const reward = calculateAndDepositMissionReward({
            gameId: 'pokishenzhenmahjong',
            gameTitle: 'Shenzhen Mahjong',
            isVictory: won,
            score: s.pairsCleared * 83,
            maxTargetScore: 1000,
            durationSeconds: Math.floor((Date.now() - s.startTime) / 1000),
          });
          setRewardResult(reward);
        }
      }
    }, 1000);

    const render = () => {
      // Wood table background
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Wooden felt mat
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(s.startX - 12, s.startY - 12, s.tileW * 6 + 24, s.tileH * 4 + 24);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.strokeRect(s.startX - 12, s.startY - 12, s.tileW * 6 + 24, s.tileH * 4 + 24);

      // Draw Mahjong Tiles
      for (const t of s.tiles) {
        if (t.cleared) continue;
        const tx = s.startX + t.c * s.tileW + 2;
        const ty = s.startY + t.r * s.tileH + 2;
        const tw = s.tileW - 4;
        const th = s.tileH - 4;

        const isSelected = s.selectedTile?.id === t.id;

        ctx.save();
        // Tile 3D depth base
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(tx + 2, ty + 4, tw, th, 6);
        ctx.fill();

        // Tile bone front face
        ctx.fillStyle = isSelected ? '#fef08a' : '#fdfbf7';
        ctx.beginPath();
        ctx.roundRect(tx, ty, tw, th, 6);
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#eab308' : '#cbd5e1';
        ctx.lineWidth = isSelected ? 2.5 : 1;
        ctx.stroke();

        // Tile icon/glyph
        ctx.fillStyle = t.color;
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.icon, tx + tw / 2, ty + th * 0.4);

        // Tile label
        ctx.font = 'bold 11px monospace';
        ctx.fillText(t.label, tx + tw / 2, ty + th * 0.78);

        ctx.restore();
      }

      // Grandmaster Hero Sprite at bottom right
      drawCardSprite(ctx, cardId, canvas.width / 2 - 24, canvas.height - 110, 48, 56);

      // Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(1, pt.life * 0.25), 0, Math.PI * 2);
        ctx.fill();
        if (pt.life <= 0) s.particles.splice(i, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      clearInterval(timerInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, [cardId, gameOver, gameWon]);

  const handleTileClick = (clientX: number, clientY: number) => {
    if (gameOver) return;
    const s = gameStateRef.current;

    for (const t of s.tiles) {
      if (t.cleared) continue;
      const tx = s.startX + t.c * s.tileW + 2;
      const ty = s.startY + t.r * s.tileH + 2;
      const tw = s.tileW - 4;
      const th = s.tileH - 4;

      if (clientX >= tx && clientX <= tx + tw && clientY >= ty && clientY <= ty + th) {
        if (!s.selectedTile) {
          s.selectedTile = t;
        } else if (s.selectedTile.id === t.id) {
          s.selectedTile = null; // deselect
        } else if (s.selectedTile.type === t.type) {
          // Matched pair!
          s.selectedTile.cleared = true;
          t.cleared = true;
          s.pairsCleared++;
          setPairsCleared(s.pairsCleared);

          // Spark particles
          for (let k = 0; k < 12; k++) {
            s.particles.push({
              x: tx + tw / 2,
              y: ty + th / 2,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: '#fbbf24',
              life: 20,
            });
          }

          s.selectedTile = null;

          // Win check
          if (s.pairsCleared >= s.totalPairs) {
            setGameWon(true);
            setGameOver(true);
            const reward = calculateAndDepositMissionReward({
              gameId: 'pokishenzhenmahjong',
              gameTitle: 'Shenzhen Mahjong',
              isVictory: true,
              score: 1000,
              maxTargetScore: 1000,
              durationSeconds: Math.floor((Date.now() - s.startTime) / 1000),
            });
            setRewardResult(reward);
          }
        } else {
          // Different type, switch selection
          s.selectedTile = t;
        }
        break;
      }
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#1c1917] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Shenzhen Mahjong"
        score={pairsCleared}
        targetScore={12}
        timeLeft={timeLeft}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-pointer"
        onMouseDown={(e) => handleTileClick(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handleTileClick(t.clientX, t.clientY);
        }}
      />

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none text-xs text-amber-300">
        같은 문양의 마작패 2개를 탭하여 짝을 맞춰 보드를 비우세요! (12쌍)
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={pairsCleared * 83}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setPairsCleared(0);
          setTimeLeft(90);
          const s = gameStateRef.current;
          s.pairsCleared = 0;
          s.timeLeft = 90;
          s.selectedTile = null;
          s.tiles.forEach((t) => (t.cleared = false));
          s.startTime = Date.now();
        }}
      />
    </div>
  );
};

export default PokiShenzhenMahjongGame;
