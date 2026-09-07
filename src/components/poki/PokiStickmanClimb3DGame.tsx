import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStickmanClimb3DGameProps {
  onBack: () => void;
}

const TARGET_HEIGHT = 100;

interface RockLedge {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PokiStickmanClimb3DGame: React.FC<PokiStickmanClimb3DGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentHeight, setCurrentHeight] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    potX: number;
    potY: number;
    vx: number;
    vy: number;
    axeAngle: number;
    targetAngle: number;
    ledges: RockLedge[];
    maxHeight: number;
    gameWon: boolean;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    potX: 200,
    potY: 480,
    vx: 0,
    vy: 0,
    axeAngle: -Math.PI / 2,
    targetAngle: -Math.PI / 2,
    ledges: [
      { x: 50, y: 420, w: 100, h: 20 },
      { x: 250, y: 350, w: 110, h: 20 },
      { x: 80, y: 270, w: 120, h: 20 },
      { x: 230, y: 190, w: 120, h: 20 },
      { x: 140, y: 110, w: 120, h: 20 }, // Summit ledge
    ],
    maxHeight: 0,
    gameWon: false,
    particles: [],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const st = stateRef.current;

      // Mountain sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#fde047');
      sky.addColorStop(0.5, '#fed7aa');
      sky.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 106, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('STICKMAN CLIMB // 항아리 곡괭이 등반', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#f59e0b';
      const climbMeters = Math.max(0, Math.floor((500 - st.potY) / 4));
      ctx.fillText(`등반 고도: ${climbMeters}m/${TARGET_HEIGHT}m | 정상 깃발을 향해 도약!`, 84, 56);

      // Smooth axe rotation towards touch angle
      st.axeAngle += (st.targetAngle - st.axeAngle) * 0.15;

      // Axe tip position (axe length = 45)
      const axeLength = 45;
      const tipX = st.potX + Math.cos(st.axeAngle) * axeLength;
      const tipY = st.potY + Math.sin(st.axeAngle) * axeLength;

      // Physics Gravity on Pot
      st.vy += 0.35;
      st.potX += st.vx;
      st.potY += st.vy;
      st.vx *= 0.95;

      // Floor boundary
      if (st.potY > 500) {
        st.potY = 500;
        st.vy = 0;
      }
      if (st.potX < 30) { st.potX = 30; st.vx = 0; }
      if (st.potX > w - 30) { st.potX = w - 30; st.vx = 0; }

      // Check Axe tip collision with Ledges
      st.ledges.forEach((ledge) => {
        // Draw Rock Ledge
        ctx.fillStyle = '#475569';
        ctx.fillRect(ledge.x, ledge.y, ledge.w, ledge.h);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(ledge.x, ledge.y, ledge.w, ledge.h);

        // Collision check
        if (
          tipX >= ledge.x &&
          tipX <= ledge.x + ledge.w &&
          tipY >= ledge.y &&
          tipY <= ledge.y + ledge.h + 8
        ) {
          // Push pot away from tip (Vaulting physics!)
          const pushForce = 5.5;
          const pushAngle = st.axeAngle + Math.PI;
          st.vx += Math.cos(pushAngle) * pushForce * 0.5;
          st.vy = Math.sin(pushAngle) * pushForce;

          // Spark particles
          for (let p = 0; p < 4; p++) {
            st.particles.push({
              x: tipX,
              y: tipY,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              color: '#facc15',
              life: 0.6,
            });
          }
        }
      });

      // Summit Flag on top ledge (140, 110)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(200, 70);
      ctx.lineTo(230, 85);
      ctx.lineTo(200, 100);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(200, 70);
      ctx.lineTo(200, 110);
      ctx.stroke();

      // Check Victory: Reach summit
      if (st.potY <= 120 && Math.abs(st.potX - 200) < 60 && !st.gameWon) {
        st.gameWon = true;
        setGameWon(true);
        const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const receipt = calculateAndDepositMissionReward({
          gameId: 'stickman-climb-3d',
          gameTitle: 'Stickman Climb 3D',
          score: 1000,
          durationSeconds: duration,
        });
        setRewardReceipt(receipt);
      }

      // Draw Stickman in Pot
      // Pot (Cauldron)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(st.potX, st.potY, 18, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Stickman Head & Torso
      ctx.beginPath();
      ctx.arc(st.potX, st.potY - 22, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(st.potX, st.potY - 13);
      ctx.lineTo(st.potX, st.potY);
      ctx.stroke();

      // Axe handle & head
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(st.potX, st.potY - 10);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Pickaxe metal head
      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.rotate(st.axeAngle);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-6, -10, 12, 20);
      ctx.restore();

      // Draw Particles
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          st.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
      }

      // Instructions
      ctx.fillStyle = '#0f172a';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 화면을 원형으로 드래그해 곡괭이를 휘둘러 절벽을 오르세요 ]', w / 2, h - 15);
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const dx = x - stateRef.current.potX;
    const dy = y - (stateRef.current.potY - 10);
    stateRef.current.targetAngle = Math.atan2(dy, dx);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Stickman Climb 3D"
        score={currentHeight}
        targetScore={TARGET_HEIGHT}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointer}
          onPointerMove={(e) => {
            if (e.buttons > 0) handlePointer(e);
          }}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm cursor-crosshair"
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

export default PokiStickmanClimb3DGame;
