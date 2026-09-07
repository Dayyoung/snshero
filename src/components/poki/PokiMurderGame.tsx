import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMurderGameProps {
  onBack: () => void;
  cardId?: number;
}

export const PokiMurderGame: React.FC<PokiMurderGameProps> = ({ onBack, cardId = 29 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [knifeCharge, setKnifeCharge] = useState(0);
  const [phase, setPhase] = useState<'assassin' | 'king'>('assassin');
  const [defendedCount, setDefendedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    phase: 'assassin' as 'assassin' | 'king',
    isHolding: false,
    charge: 0,
    kingTurning: false,
    kingLookBackTimer: 120,
    kingLookingBack: false,
    assassinComingTimer: 140,
    assassinApproaching: false,
    assassinKnifeCharge: 0,
    caughtTimer: 0,
    defended: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;

      if (!gameOver && !gameWon) {
        if (state.phase === 'assassin') {
          // Player is assassin trying to kill king
          if (state.isHolding) {
            state.charge = Math.min(100, state.charge + 0.8);
            setKnifeCharge(Math.round(state.charge));

            // Completed stab!
            if (state.charge >= 100) {
              state.phase = 'king';
              setPhase('king');
              state.isHolding = false;
              state.charge = 0;
            }
          } else {
            state.charge = Math.max(0, state.charge - 1.2);
            setKnifeCharge(Math.round(state.charge));
          }

          // King behavior
          state.kingLookBackTimer -= 1;
          if (state.kingLookBackTimer <= 30 && state.kingLookBackTimer > 0) {
            state.kingTurning = true; // Suspicion exclamation mark!
          } else if (state.kingLookBackTimer <= 0) {
            state.kingLookingBack = true;
            state.kingTurning = false;

            // If player holding knife while king looks back -> Caught!
            if (state.isHolding) {
              setGameOver(true);
            }

            if (state.kingLookBackTimer <= -50) {
              state.kingLookingBack = false;
              state.kingLookBackTimer = 100 + Math.floor(Math.random() * 80);
            }
          }
        } else {
          // Player is now the King! Must turn around and catch incoming assassins
          state.assassinComingTimer -= 1;
          if (state.assassinComingTimer <= 0) {
            state.assassinApproaching = true;
            state.assassinKnifeCharge += 0.8;

            if (state.assassinKnifeCharge >= 100) {
              // King stabbed!
              setGameOver(true);
            }
          }

          // Player turns around while holding screen
          if (state.isHolding && state.assassinApproaching) {
            // Caught the assassin!
            state.assassinApproaching = false;
            state.assassinKnifeCharge = 0;
            state.assassinComingTimer = 90 + Math.floor(Math.random() * 60);
            state.defended += 1;
            setDefendedCount(state.defended);

            if (state.defended >= 3) {
              setGameWon(true);
              const deposit = calculateAndDepositMissionReward({
                gameId: 'poki_murder',
                gameTitle: 'Murder',
                isVictory: true,
                score: 100,
                maxTargetScore: 100,
                durationSeconds: 35,
              });
              setRewardResult(deposit);
              return;
            }
          }
        }
      }

      // Drawing
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, cw, ch);

      const floorY = ch / 2 + 100;

      // Royal Palace Red Carpet Corridor
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, floorY, cw, 120);
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(cw, floorY);
      ctx.stroke();

      // Characters Render
      const kingX = cw * 0.58;
      const assassinX = cw * 0.42;

      if (state.phase === 'assassin') {
        // King walking forward (or looking back)
        drawCardSprite(ctx, 77, kingX - 25, floorY - 60, 50, 60, {
          flipH: state.kingLookingBack,
        });

        // Suspicion mark over king
        if (state.kingTurning) {
          ctx.font = 'bold 28px monospace';
          ctx.fillStyle = '#facc15';
          ctx.textAlign = 'center';
          ctx.fillText('!?', kingX, floorY - 80);
        }

        // Player Assassin
        drawCardSprite(ctx, cardId, assassinX - 25, floorY - 60, 50, 60);

        // Assassin Knife
        if (state.charge > 0) {
          ctx.save();
          ctx.translate(assassinX + 10, floorY - 30);
          ctx.rotate((-state.charge / 100) * (Math.PI * 0.5));
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(0, -4, 28, 8);
          ctx.fillStyle = '#78716c';
          ctx.fillRect(-10, -5, 10, 10);
          ctx.restore();
        }
      } else {
        // Player is King
        drawCardSprite(ctx, cardId, kingX - 25, floorY - 60, 50, 60, {
          flipH: state.isHolding, // Look back when player holds screen
        });

        // Crown on player head
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👑', kingX, floorY - 70);

        // Incoming Enemy Assassin
        if (state.assassinApproaching) {
          drawCardSprite(ctx, 88, assassinX - 25, floorY - 60, 50, 60);
          // Assassin Knife
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(assassinX + 15, floorY - 40, 24, 6);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [phase, gameOver, gameWon, cardId]);

  const handlePointerDown = () => {
    gameStateRef.current.isHolding = true;
  };

  const handlePointerUp = () => {
    gameStateRef.current.isHolding = false;
  };

  const handleRestart = () => {
    gameStateRef.current = {
      phase: 'assassin',
      isHolding: false,
      charge: 0,
      kingTurning: false,
      kingLookBackTimer: 120,
      kingLookingBack: false,
      assassinComingTimer: 140,
      assassinApproaching: false,
      assassinKnifeCharge: 0,
      caughtTimer: 0,
      defended: 0,
    };
    setPhase('assassin');
    setKnifeCharge(0);
    setDefendedCount(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#1c1917] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <MinimalistMissionHUD
        title="MURDER"
        score={phase === 'king' ? defendedCount + 1 : knifeCharge}
        goalScore={phase === 'king' ? 4 : 100}
        onBack={onBack}
        unit={phase === 'king' ? 'DEFENDED' : '%'}
      />

      {/* Role & Knife Charge Bar */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-stone-900/80 border border-stone-700 px-3 py-1.5 rounded-sm text-xs">
        <span className="font-bold text-amber-400 uppercase">
          ROLE: {phase === 'assassin' ? '🗡️ ASSASSIN (STAB THE KING)' : '👑 KING (CATCH THE ASSASSIN)'}
        </span>
        {phase === 'assassin' ? (
          <div className="flex items-center gap-2">
            <span>KNIFE:</span>
            <div className="w-24 h-2 bg-stone-800 rounded-xs overflow-hidden">
              <div className="h-full bg-rose-500" style={{ width: `${knifeCharge}%` }} />
            </div>
            <span className="text-rose-400 font-bold">{knifeCharge}%</span>
          </div>
        ) : (
          <span className="font-bold text-emerald-400">DEFENDED: {defendedCount} / 3</span>
        )}
      </div>

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-stone-300 bg-stone-900/90 border border-stone-700 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        {phase === 'assassin' ? (
          <>
            화면을 <span className="text-rose-400 font-bold">길게 눌러 단검 치켜들기</span> • 왕이 뒤돌아볼 땐 <span className="text-amber-400 font-bold">손을 떼어 시치미 떼기</span>
          </>
        ) : (
          <>
            뒤따라오는 암살자가 칼을 들 때 <span className="text-emerald-400 font-bold">화면을 탭하여 뒤돌아보고 감옥에 보내세요!</span>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ CAUGHT & DUNGEON ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            왕에게 현장을 들켰거나 암살자에게 등을 찔렸습니다! 지하 감옥으로 끌려갔습니다.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 암살
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
          message="왕좌를 차지하고 뒤따라오는 모든 반역 암살자들을 완벽히 격퇴했습니다!"
        />
      )}
    </div>
  );
};

export default PokiMurderGame;
