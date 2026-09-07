import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiScaryTeacher3DGameProps {
  onBack: () => void;
}

interface PrankTarget {
  id: number;
  name: string;
  room: string;
  x: number;
  y: number;
  completed: boolean;
  icon: string;
}

export const PokiScaryTeacher3DGame: React.FC<PokiScaryTeacher3DGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'caught' | 'victory'>('ready');
  const [pranksCompleted, setPranksCompleted] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  const stateRef = useRef({
    player: {
      x: 200,
      y: 540,
      vx: 0,
      vy: 0,
      speed: 3.8,
      facing: 1 as 1 | -1,
    },
    teacher: {
      x: 200,
      y: 200,
      vx: 1.5,
      vy: 0,
      angle: 0, // facing angle in rad
      patrolIndex: 0,
      alertMeter: 0, // 0 to 100
    },
    pranks: [] as PrankTarget[],
    targetTouch: null as { x: number; y: number } | null,
    // Patrol waypoints for Miss T
    waypoints: [
      { x: 100, y: 150 },
      { x: 300, y: 150 },
      { x: 300, y: 320 },
      { x: 100, y: 320 },
    ],
  });

  const initMansion = useCallback(() => {
    stateRef.current.player = {
      x: 200,
      y: 540,
      vx: 0,
      vy: 0,
      speed: 3.8,
      facing: 1,
    };
    stateRef.current.teacher = {
      x: 100,
      y: 150,
      vx: 1.5,
      vy: 0,
      angle: 0,
      patrolIndex: 0,
      alertMeter: 0,
    };
    stateRef.current.pranks = [
      { id: 1, name: '소금통에 설탕 넣기', room: '주방', x: 80, y: 100, completed: false, icon: '🧂' },
      { id: 2, name: '샴푸에 레드 페인트', room: '욕실', x: 320, y: 100, completed: false, icon: '🧴' },
      { id: 3, name: '소파에 방귀 쿠션', room: '거실', x: 200, y: 350, completed: false, icon: '🛋️' },
    ];
    stateRef.current.targetTouch = null;
    setPranksCompleted(0);
    setActiveAlert(null);
  }, []);

  const handleStart = () => {
    initMansion();
    setGameState('playing');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiscaryteacher3d',
      gameTitle: 'Scary Teacher 3D: Prank Escape',
      isVictory: true,
      score: 3,
      maxTargetScore: 3,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const { player, teacher, pranks, waypoints } = stateRef.current;

      ctx.clearRect(0, 0, width, height);

      // Mansion Floor Layout
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, width, height);

      // Room Carpets
      // Kitchen (Top-Left)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(20, 20, 170, 180);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(20, 20, 170, 180);

      // Bathroom (Top-Right)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(210, 20, 170, 180);
      ctx.strokeRect(210, 20, 170, 180);

      // Living Room (Middle)
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(50, 240, 300, 200);
      ctx.strokeStyle = '#6b21a8';
      ctx.strokeRect(50, 240, 300, 200);

      // Entrance Hall (Bottom)
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(120, 480, 160, 100);

      // Exit Door marker
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(160, 580, 80, 15);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ EXIT 현관 ]', 200, 592);

      if (gameState === 'playing') {
        // Player Touch Navigation
        if (stateRef.current.targetTouch) {
          const dx = stateRef.current.targetTouch.x - player.x;
          const dy = stateRef.current.targetTouch.y - player.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 6) {
            player.vx = (dx / dist) * player.speed;
            player.vy = (dy / dist) * player.speed;
            player.facing = dx > 0 ? 1 : -1;
          } else {
            player.vx = 0;
            player.vy = 0;
          }
        } else {
          player.vx *= 0.8;
          player.vy *= 0.8;
        }

        player.x += player.vx;
        player.y += player.vy;

        // Player Bounds
        player.x = Math.max(25, Math.min(width - 25, player.x));
        player.y = Math.max(25, Math.min(height - 25, player.y));

        // Teacher Patrol AI
        const wp = waypoints[teacher.patrolIndex];
        const tdx = wp.x - teacher.x;
        const tdy = wp.y - teacher.y;
        const tdist = Math.hypot(tdx, tdy);

        if (tdist < 10) {
          teacher.patrolIndex = (teacher.patrolIndex + 1) % waypoints.length;
        } else {
          teacher.angle = Math.atan2(tdy, tdx);
          teacher.x += Math.cos(teacher.angle) * 1.6;
          teacher.y += Math.sin(teacher.angle) * 1.6;
        }

        // Vision Cone Detection (Angle check + Distance check)
        const pDist = Math.hypot(player.x - teacher.x, player.y - teacher.y);
        const pAngle = Math.atan2(player.y - teacher.y, player.x - teacher.x);
        let angleDiff = Math.abs(teacher.angle - pAngle);
        while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);

        // Within 140px & 45 degree vision cone
        if (pDist < 140 && angleDiff < Math.PI / 3.5) {
          teacher.alertMeter += 4;
          if (teacher.alertMeter >= 100) {
            setGameState('caught');
          }
        } else {
          teacher.alertMeter = Math.max(0, teacher.alertMeter - 1.2);
        }

        // Check Prank Item Collision
        pranks.forEach((prank) => {
          if (!prank.completed) {
            const dist = Math.hypot(player.x - prank.x, player.y - prank.y);
            if (dist < 32) {
              prank.completed = true;
              const newCount = pranks.filter((p) => p.completed).length;
              setPranksCompleted(newCount);
              setActiveAlert(`✨ 장난 완료: ${prank.name}!`);
              setTimeout(() => setActiveAlert(null), 1800);
            }
          }
        });

        // Check Exit with All Pranks Done
        const allDone = pranks.every((p) => p.completed);
        if (allDone && player.y > 560 && player.x > 150 && player.x < 250) {
          handleVictory();
          return;
        }
      }

      // Draw Teacher Vision Cone (Red / Yellow semi-transparent)
      ctx.save();
      ctx.translate(teacher.x, teacher.y);
      ctx.fillStyle =
        teacher.alertMeter > 50
          ? 'rgba(239, 68, 68, 0.45)'
          : 'rgba(234, 179, 8, 0.25)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 140, teacher.angle - Math.PI / 3.5, teacher.angle + Math.PI / 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw Prank Objects
      pranks.forEach((prank) => {
        ctx.fillStyle = prank.completed ? '#22c55e' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(prank.x, prank.y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(prank.icon, prank.x, prank.y + 5);

        // Label
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = prank.completed ? '#86efac' : '#fde047';
        ctx.fillText(prank.name, prank.x, prank.y + 26);
      });

      // Draw Teacher Miss T (Angry teacher sprite / avatar)
      ctx.save();
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(teacher.x, teacher.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(teacher.x, teacher.y - 4, 11, 0, Math.PI * 2);
      ctx.fill();
      // Glasses & Bun
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(teacher.x - 7, teacher.y - 18, 14, 8);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('미스 T', teacher.x, teacher.y - 22);

      // Alert meter above teacher
      if (teacher.alertMeter > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(teacher.x - 20, teacher.y - 36, 40, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(teacher.x - 20, teacher.y - 36, 40 * (teacher.alertMeter / 100), 6);
      }
      ctx.restore();

      // Draw Player Hero (Card #80 Prank Master)
      ctx.save();
      if (player.facing === -1) {
        ctx.translate(player.x + 18, player.y - 22);
        ctx.scale(-1, 1);
        drawCardSprite(ctx, 80, 0, 0, 36, 44);
      } else {
        drawCardSprite(ctx, 80, player.x - 18, player.y - 22, 36, 44);
      }
      ctx.restore();

      // Alert Popup Banner
      if (activeAlert) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(40, 200, 320, 36);
        ctx.strokeStyle = '#eab308';
        ctx.strokeRect(40, 200, 320, 36);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(activeAlert, 200, 222);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, activeAlert, handleVictory]);

  // Touch Move Navigation
  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    stateRef.current.targetTouch = {
      x: ((t.clientX - rect.left) / rect.width) * 400,
      y: ((t.clientY - rect.top) / rect.height) * 600,
    };
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#0f172a] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Scary Teacher 3D: Prank Escape"
        missionTarget="장난 3개 완료 후 현관 탈출"
        currentScore={pranksCompleted}
        maxScore={3}
        scoreUnit="개"
        onBack={onBack}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="w-full h-full object-contain rounded border border-white/20 bg-slate-900 touch-none shadow-2xl"
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          onTouchEnd={() => {
            stateRef.current.targetTouch = null;
          }}
          onMouseDown={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            stateRef.current.targetTouch = {
              x: ((e.clientX - rect.left) / rect.width) * 400,
              y: ((e.clientY - rect.top) / rect.height) * 600,
            };
          }}
          onMouseMove={(e) => {
            if (stateRef.current.targetTouch) {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              stateRef.current.targetTouch = {
                x: ((e.clientX - rect.left) / rect.width) * 400,
                y: ((e.clientY - rect.top) / rect.height) * 600,
              };
            }
          }}
          onMouseUp={() => {
            stateRef.current.targetTouch = null;
          }}
        />

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-rose-500 mb-2">[ Scary Teacher 3D ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              미스 T 선생님의 저택에 몰래 잠입하여 기상천외한 장난을 치세요!<br />
              1. <b>터치/드래그</b>로 선생님의 시야(붉은 부채꼴)를 피해 잠입합니다.<br />
              2. 주방, 욕실, 거실의 <b>3대 장난 포인트</b>에 접근하여 트릭을 발동합니다.<br />
              3. 모든 장난을 마친 후 <b>하단 현관문 [EXIT]</b>으로 탈출하면 미션 성공!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              잠입 개시 [START]
            </button>
          </div>
        )}

        {gameState === 'caught' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-rose-600 mb-2">🚨 [ 미스 T에게 발각되었습니다! ]</h2>
            <p className="text-sm text-slate-300 mb-4">장난 진행: {pranksCompleted} / 3</p>
            <button
              onClick={handleStart}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-sm active:scale-95 transition-all"
            >
              다시 잠입하기
            </button>
          </div>
        )}

        {gameState === 'victory' && rewardReceipt && (
          <VictoryRewardModal
            receipt={rewardReceipt}
            language="ko"
            onPlayAgain={handleStart}
            onExit={onBack}
          />
        )}
      </div>

      {/* Guide Footer */}
      <div className="w-full max-w-md p-2 bg-slate-900/90 border-t border-white/10 text-center text-xs text-slate-400">
        시야콘 회피 | 3대 장난 설치 (주방/욕실/거실) | 현관 EXIT 무사 탈출
      </div>
    </div>
  );
};
export default PokiScaryTeacher3DGame;
