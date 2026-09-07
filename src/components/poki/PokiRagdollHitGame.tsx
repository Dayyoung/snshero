import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRagdollHitGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Fighter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  weaponAngle: number;
  cardId: number;
}

export const PokiRagdollHitGame: React.FC<PokiRagdollHitGameProps> = ({ onBack, cardId = 24 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [wins, setWins] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: {
      x: 250,
      y: 400,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      weaponAngle: 0,
      cardId,
    } as Fighter,
    enemy: {
      x: 550,
      y: 400,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      weaponAngle: Math.PI,
      cardId: 55,
    } as Fighter,
    currentRound: 1,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    gravity: 0.4,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      const p = state.player;
      const e = state.enemy;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.min(cw / 800, ch / 600);
      const offsetX = (cw - 800 * scale) / 2;
      const offsetY = (ch - 600 * scale) / 2;

      if (!gameOver && !gameWon) {
        // Physics for Player
        p.vy += state.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;

        // Ground collision
        if (p.y > 450) {
          p.y = 450;
          p.vy = 0;
        }
        // Walls
        if (p.x < 100) { p.x = 100; p.vx = -p.vx * 0.5; }
        if (p.x > 700) { p.x = 700; p.vx = -p.vx * 0.5; }

        // Physics for Enemy AI
        e.vy += state.gravity;
        e.x += e.vx;
        e.y += e.vy;
        e.vx *= 0.96;
        e.vy *= 0.96;

        if (e.y > 450) {
          e.y = 450;
          e.vy = 0;
        }
        if (e.x < 100) { e.x = 100; e.vx = -e.vx * 0.5; }
        if (e.x > 700) { e.x = 700; e.vx = -e.vx * 0.5; }

        // Enemy AI hops towards player
        if (Math.random() < 0.03 && e.y >= 445) {
          const dir = p.x < e.x ? -1 : 1;
          e.vx = dir * (4 + Math.random() * 4);
          e.vy = -(7 + Math.random() * 5);
          e.weaponAngle += Math.PI * 0.5;
        }

        // Weapon rotation
        p.weaponAngle += Math.hypot(p.vx, p.vy) * 0.05;
        e.weaponAngle -= Math.hypot(e.vx, e.vy) * 0.05;

        // Hit Detection
        const hitDist = Math.hypot(p.x - e.x, p.y - e.y);
        if (hitDist < 60) {
          // Relative collision velocity
          const relV = Math.hypot(p.vx - e.vx, p.vy - e.vy);
          if (relV > 3) {
            // Repel
            const angle = Math.atan2(e.y - p.y, e.x - p.x);
            p.vx -= Math.cos(angle) * relV * 0.5;
            p.vy -= Math.sin(angle) * relV * 0.5;
            e.vx += Math.cos(angle) * relV * 0.7;
            e.vy += Math.sin(angle) * relV * 0.7;

            // Damage logic
            if (Math.hypot(p.vx, p.vy) > Math.hypot(e.vx, e.vy)) {
              e.hp -= Math.round(relV * 3.5);
              setEnemyHp(Math.max(0, e.hp));
            } else {
              p.hp -= Math.round(relV * 2.8);
              setPlayerHp(Math.max(0, p.hp));
            }

            // Check KO
            if (e.hp <= 0) {
              const nextRound = state.currentRound + 1;
              state.currentRound = nextRound;
              setWins(nextRound - 1);

              if (nextRound > 3) {
                setGameWon(true);
                const deposit = calculateAndDepositMissionReward({
                  gameId: 'poki_ragdoll_hit',
                  gameTitle: 'Ragdoll Hit',
                  isVictory: true,
                  score: 100,
                  maxTargetScore: 100,
                  durationSeconds: 35,
                });
                setRewardResult(deposit);
                return;
              } else {
                // Next fighter
                e.hp = 100;
                e.x = 600;
                e.y = 400;
                e.vx = 0;
                e.vy = 0;
                e.cardId = 55 + nextRound * 10;
                setEnemyHp(100);
              }
            }

            if (p.hp <= 0) {
              setGameOver(true);
            }
          }
        }
      }

      // Drawing
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Arena Floor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(80, 480, 640, 60);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 480, 640, 60);

      // Boxing Ropes
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(80, 380); ctx.lineTo(720, 380);
      ctx.moveTo(80, 430); ctx.lineTo(720, 430);
      ctx.stroke();

      // Draw Player Fighter & Bat
      ctx.save();
      ctx.translate(p.x, p.y);
      drawCardSprite(ctx, p.cardId, -18, -25, 36, 36);

      // Bat weapon
      ctx.rotate(p.weaponAngle);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(15, -4, 30, 8);
      ctx.restore();

      // Draw Enemy Fighter & Bat
      ctx.save();
      ctx.translate(e.x, e.y);
      drawCardSprite(ctx, e.cardId, -18, -25, 36, 36);

      // Bat weapon
      ctx.rotate(e.weaponAngle);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(15, -4, 30, 8);
      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Touch Drag Fling
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    gameStateRef.current.isDragging = true;
    gameStateRef.current.dragStart = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!gameStateRef.current.isDragging) return;
    gameStateRef.current.isDragging = false;

    const dx = e.clientX - gameStateRef.current.dragStart.x;
    const dy = e.clientY - gameStateRef.current.dragStart.y;
    const flingDist = Math.hypot(dx, dy);

    if (flingDist > 15) {
      const p = gameStateRef.current.player;
      p.vx = (dx / flingDist) * Math.min(18, flingDist * 0.14);
      p.vy = (dy / flingDist) * Math.min(18, flingDist * 0.14);
    }
  };

  const handleRestart = () => {
    gameStateRef.current = {
      player: {
        x: 250,
        y: 400,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        weaponAngle: 0,
        cardId,
      },
      enemy: {
        x: 550,
        y: 400,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        weaponAngle: Math.PI,
        cardId: 55,
      },
      currentRound: 1,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      gravity: 0.4,
    };
    setWins(0);
    setPlayerHp(100);
    setEnemyHp(100);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#0f172a] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <MinimalistMissionHUD
        title="RAGDOLL HIT"
        score={wins}
        goalScore={3}
        onBack={onBack}
        unit="KNOCKOUTS"
      />

      {/* Duel HP Bars */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-sky-400 font-bold">HERO:</span>
          <div className="w-24 h-2.5 bg-slate-800 rounded-xs overflow-hidden">
            <div className="h-full bg-sky-500" style={{ width: `${playerHp}%` }} />
          </div>
          <span className="text-xs text-sky-300">{playerHp}</span>
        </div>
        <span className="text-xs font-bold text-amber-400">KO {wins} / 3</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-rose-300">{enemyHp}</span>
          <div className="w-24 h-2.5 bg-slate-800 rounded-xs overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: `${enemyHp}%` }} />
          </div>
          <span className="text-xs text-rose-400 font-bold">OPPONENT</span>
        </div>
      </div>

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-slate-400 bg-slate-900/90 border border-slate-700 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        화면을 <span className="text-amber-400 font-bold">드래그 후 튕겨서</span> 래그돌 몸통 박치기와 배트 공격으로 적을 KO시키세요!
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ KNOCKED OUT ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            상대의 강렬한 타격에 쓰러졌습니다! 반동 스윙을 이용해 적을 먼저 가격하세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 도전
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-sm transition-colors cursor-pointer"
            >
              미션 목록
            </button>
          </div>
        </div>
      )}

      {/* Victory Reward Modal */}
      {gameWon && (
        <VictoryRewardModal
          isOpen={true}
          onClose={onBack}
          rewardAmount={rewardResult?.rewardAmount || 36}
          message="래그돌 격투 아레나의 3명 챔피언을 모두 넉아웃시키고 우승했습니다!"
        />
      )}
    </div>
  );
};

export default PokiRagdollHitGame;
