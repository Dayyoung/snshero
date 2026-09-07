import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPunchyGuyGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Boxer {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  punching: boolean;
  punchHand: 'left' | 'right';
  punchOffset: number;
  cardId: number;
}

export const PokiPunchyGuyGame: React.FC<PokiPunchyGuyGameProps> = ({ onBack, cardId = 40 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [kos, setKos] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: {
      x: 320,
      y: 380,
      hp: 100,
      maxHp: 100,
      punching: false,
      punchHand: 'right' as const,
      punchOffset: 0,
      cardId,
    },
    enemy: {
      x: 480,
      y: 380,
      hp: 100,
      maxHp: 100,
      punching: false,
      punchHand: 'left' as const,
      punchOffset: 0,
      cardId: 60,
    },
    enemyAttackTimer: 45,
    koCount: 0,
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
        // Player punch anim
        if (p.punching) {
          p.punchOffset += 8;
          if (p.punchOffset >= 40) {
            // Hit enemy!
            e.hp -= 20;
            setEnemyHp(Math.max(0, e.hp));

            if (e.hp <= 0) {
              state.koCount += 1;
              setKos(state.koCount);

              if (state.koCount >= 3) {
                setGameWon(true);
                const deposit = calculateAndDepositMissionReward({
                  gameId: 'poki_punchy_guy',
                  gameTitle: 'Punchy Guy',
                  isVictory: true,
                  score: 100,
                  maxTargetScore: 100,
                  durationSeconds: 30,
                });
                setRewardResult(deposit);
                return;
              } else {
                // Next challenger
                e.hp = 100;
                e.cardId = 60 + state.koCount * 12;
                setEnemyHp(100);
              }
            }
            p.punching = false;
            p.punchOffset = 0;
          }
        }

        // Enemy punch AI
        state.enemyAttackTimer -= 1;
        if (state.enemyAttackTimer <= 0) {
          state.enemyAttackTimer = 40 + Math.floor(Math.random() * 30);
          e.punching = true;
        }

        if (e.punching) {
          e.punchOffset += 7;
          if (e.punchOffset >= 40) {
            p.hp -= 15;
            setPlayerHp(Math.max(0, p.hp));
            if (p.hp <= 0) {
              setGameOver(true);
            }
            e.punching = false;
            e.punchOffset = 0;
          }
        }
      }

      // Render
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Boxing Canvas Ring
      ctx.fillStyle = '#27272a';
      ctx.fillRect(100, 420, 600, 100);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.strokeRect(100, 420, 600, 100);

      // Ring Ropes
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      [320, 370, 420].forEach(ry => {
        ctx.beginPath();
        ctx.moveTo(100, ry);
        ctx.lineTo(700, ry);
        ctx.stroke();
      });

      // Draw Player Hero Boxer
      ctx.save();
      ctx.translate(p.x, p.y);
      drawCardSprite(ctx, p.cardId, -20, -30, 40, 40);

      // Boxing Glove
      ctx.fillStyle = '#ef4444';
      const pGloveX = 20 + p.punchOffset;
      ctx.beginPath();
      ctx.arc(pGloveX, -10, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Draw Enemy Boxer
      ctx.save();
      ctx.translate(e.x, e.y);
      drawCardSprite(ctx, e.cardId, -20, -30, 40, 40, { flipH: true });

      // Enemy Glove
      ctx.fillStyle = '#3b82f6';
      const eGloveX = -20 - e.punchOffset;
      ctx.beginPath();
      ctx.arc(eGloveX, -10, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Tap to Punch
  const handlePointerDown = () => {
    if (gameOver || gameWon) return;
    const p = gameStateRef.current.player;
    if (!p.punching) {
      p.punching = true;
      p.punchOffset = 0;
    }
  };

  const handleRestart = () => {
    gameStateRef.current = {
      player: {
        x: 320,
        y: 380,
        hp: 100,
        maxHp: 100,
        punching: false,
        punchHand: 'right',
        punchOffset: 0,
        cardId,
      },
      enemy: {
        x: 480,
        y: 380,
        hp: 100,
        maxHp: 100,
        punching: false,
        punchHand: 'left',
        punchOffset: 0,
        cardId: 60,
      },
      enemyAttackTimer: 45,
      koCount: 0,
    };
    setKos(0);
    setPlayerHp(100);
    setEnemyHp(100);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#18181b] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointerDown}
    >
      <MinimalistMissionHUD
        title="PUNCHY GUY"
        score={kos}
        goalScore={3}
        onBack={onBack}
        unit="KNOCKOUTS"
      />

      {/* Boxer HP Bars */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-zinc-900/80 border border-zinc-700 px-3 py-1.5 rounded-sm text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-rose-400">YOU:</span>
          <div className="w-24 h-2 bg-zinc-800 rounded-xs overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: `${playerHp}%` }} />
          </div>
          <span className="text-zinc-300">{playerHp}</span>
        </div>
        <span className="font-bold text-amber-400">🥊 KO: {kos} / 3</span>
        <div className="flex items-center gap-2">
          <span className="text-zinc-300">{enemyHp}</span>
          <div className="w-24 h-2 bg-zinc-800 rounded-xs overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${enemyHp}%` }} />
          </div>
          <span className="font-bold text-blue-400">RIVAL</span>
        </div>
      </div>

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-700 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        화면을 <span className="text-rose-400 font-bold">연타하여 강력한 잽 펀치</span>를 날려 상대를 링 밖으로 날려버리세요!
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ TKO - KNOCKED OUT ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            상대의 강펀치에 다운되었습니다! 먼저 빠른 연타로 적의 기선을 제압하세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 스파링
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
          rewardAmount={rewardResult?.rewardAmount || 38}
          message="3명의 도전자들을 연속 KO시키고 복싱 아레나 챔피언에 올랐습니다!"
        />
      )}
    </div>
  );
};

export default PokiPunchyGuyGame;
