import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiHexellentGameProps {
  onBack: () => void;
}

interface HexTile {
  q: number;
  r: number;
  color: number; // 0..4
  highlight: boolean;
  popProgress: number; // 0 = normal, >0 = popping
}

const COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
];

const TARGET_SCORE = 1000;

export const PokiHexellentGame: React.FC<PokiHexellentGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    tiles: Map<string, HexTile>;
    score: number;
    gameWon: boolean;
    hexRadius: number;
    originX: number;
    originY: number;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    tiles: new Map(),
    score: 0,
    gameWon: false,
    hexRadius: 28,
    originX: 200,
    originY: 250,
    particles: [],
  });

  // Hex grid axial coordinates: radius 3 circle
  useEffect(() => {
    const tiles = new Map<string, HexTile>();
    const radius = 3;
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      for (let r = r1; r <= r2; r++) {
        const key = `${q},${r}`;
        tiles.set(key, {
          q,
          r,
          color: Math.floor(Math.random() * COLORS.length),
          highlight: false,
          popProgress: 0,
        });
      }
    }
    stateRef.current.tiles = tiles;
  }, []);

  const handleHexTap = (pixelX: number, pixelY: number) => {
    if (stateRef.current.gameWon) return;

    const { originX, originY, hexRadius, tiles } = stateRef.current;
    const relX = pixelX - originX;
    const relY = pixelY - originY;

    // Convert pixel to axial coords
    const qF = ((Math.sqrt(3) / 3) * relX - (1 / 3) * relY) / hexRadius;
    const rF = ((2 / 3) * relY) / hexRadius;

    // Round axial coords
    const sF = -qF - rF;
    let q = Math.round(qF);
    let r = Math.round(rF);
    let s = Math.round(sF);
    const qDiff = Math.abs(q - qF);
    const rDiff = Math.abs(r - rF);
    const sDiff = Math.abs(s - sF);

    if (qDiff > rDiff && qDiff > sDiff) {
      q = -r - s;
    } else if (rDiff > sDiff) {
      r = -q - s;
    }

    const clickedKey = `${q},${r}`;
    const startTile = tiles.get(clickedKey);
    if (!startTile) return;

    // Find connected matching tiles (Flood Fill)
    const targetColor = startTile.color;
    const visited = new Set<string>();
    const toVisit: HexTile[] = [startTile];
    const matchGroup: HexTile[] = [];

    const neighbors = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1]
    ];

    while (toVisit.length > 0) {
      const curr = toVisit.pop()!;
      const key = `${curr.q},${curr.r}`;
      if (visited.has(key)) continue;
      visited.add(key);
      matchGroup.push(curr);

      for (const [dq, dr] of neighbors) {
        const nKey = `${curr.q + dq},${curr.r + dr}`;
        const neighbor = tiles.get(nKey);
        if (neighbor && !visited.has(nKey) && neighbor.color === targetColor) {
          toVisit.push(neighbor);
        }
      }
    }

    // Minimum match is 2 tiles
    if (matchGroup.length >= 2) {
      const points = matchGroup.length * 20 * (1 + matchGroup.length * 0.1);
      const newScore = Math.floor(stateRef.current.score + points);
      stateRef.current.score = newScore;
      setScore(newScore);
      setCombo((prev) => prev + 1);

      // Create burst particles
      matchGroup.forEach((tile) => {
        const cx = originX + hexRadius * (Math.sqrt(3) * tile.q + (Math.sqrt(3) / 2) * tile.r);
        const cy = originY + hexRadius * ((3 / 2) * tile.r);
        for (let i = 0; i < 6; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          stateRef.current.particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: COLORS[tile.color],
            life: 1.0,
          });
        }
        // Repopulate with new random color
        tile.color = Math.floor(Math.random() * COLORS.length);
      });

      if (newScore >= TARGET_SCORE && !stateRef.current.gameWon) {
        stateRef.current.gameWon = true;
        setGameWon(true);
        const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const receipt = calculateAndDepositMissionReward({
          gameId: 'hexellent',
          gameTitle: 'Hexellent',
          score: newScore,
          durationSeconds: duration,
        });
        setRewardReceipt(receipt);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      stateRef.current.originX = w / 2;
      stateRef.current.originY = h / 2 + 30;

      ctx.fillStyle = '#fdfcfc';
      ctx.fillRect(0, 0, w, h);

      // Draw subtle grid texture
      ctx.strokeStyle = 'rgba(15,0,0,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Draw Hero Banner at top
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 91, 24, 18, 48, 48);

      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('HEXELLENT // 육각 콤보 블래스터', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#a3a3a3';
      ctx.fillText(`연결 육각 블록 탭 | 목표: ${TARGET_SCORE} pt`, 84, 56);

      const { originX, originY, hexRadius, tiles, particles } = stateRef.current;

      // Draw Hexagonal Grid
      tiles.forEach((tile) => {
        const cx = originX + hexRadius * (Math.sqrt(3) * tile.q + (Math.sqrt(3) / 2) * tile.r);
        const cy = originY + hexRadius * ((3 / 2) * tile.r);

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 180) * (60 * i + 30);
          const px = cx + (hexRadius - 2) * Math.cos(angle);
          const py = cy + (hexRadius - 2) * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.fillStyle = COLORS[tile.color];
        ctx.fill();
        ctx.strokeStyle = '#201d1d';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Hex center shine
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 5, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
      });

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 0.03;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Bottom Instructions
      ctx.fillStyle = '#201d1d';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 인접한 같은 색상 육각 블록을 터치해 연쇄 폭발을 일으키세요 ]', w / 2, h - 20);
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    handleHexTap(x, y);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Hexellent"
        score={score}
        targetScore={TARGET_SCORE}
        combo={combo}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointerDown}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm"
        />
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          receipt={rewardReceipt}
          onConfirm={onBack}
        />
      )}
    </div>
  );
};

export default PokiHexellentGame;

