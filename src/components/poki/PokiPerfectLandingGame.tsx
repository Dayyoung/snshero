import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPerfectLandingGameProps {
  onBack: () => void;
}

const TARGET_LANDINGS = 3;

interface Turbine {
  x: number;
  y: number;
  bladeAngle: number;
}

export const PokiPerfectLandingGame: React.FC<PokiPerfectLandingGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [landingCount, setLandingCount] = useState(0);
  const [altitude, setAltitude] = useState(1000);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    planeX: number;
    planeY: number;
    planePitch: number;
    planeVy: number;
    targetPitch: number;
    distanceToRunway: number;
    landings: number;
    gameWon: boolean;
    turbines: Turbine[];
    landingSuccess: boolean;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    planeX: 80,
    planeY: 200,
    planePitch: 0,
    planeVy: 0,
    targetPitch: 0,
    distanceToRunway: 1200,
    landings: 0,
    gameWon: false,
    turbines: [
      { x: 300, y: 350, bladeAngle: 0 },
      { x: 600, y: 320, bladeAngle: 1.2 },
      { x: 900, y: 380, bladeAngle: 2.5 },
    ],
    landingSuccess: false,
    particles: [],
  });

  const resetApproach = () => {
    const st = stateRef.current;
    st.planeX = 80;
    st.planeY = 180;
    st.planePitch = 0;
    st.planeVy = 0;
    st.targetPitch = 0;
    st.distanceToRunway = 1200;
    st.landingSuccess = false;
    st.turbines = [
      { x: 350, y: 350, bladeAngle: 0 },
      { x: 650, y: 320, bladeAngle: 1.2 },
      { x: 950, y: 380, bladeAngle: 2.5 },
    ];
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
      const st = stateRef.current;

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.7, '#bae6fd');
      skyGrad.addColorStop(1, '#86efac');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 99, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`PERFECT LANDING // 착륙 성공: ${st.landings}/${TARGET_LANDINGS}`, 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#38bdf8';
      const curAlt = Math.max(0, Math.floor(500 - st.planeY));
      ctx.fillText(`고도: ${curAlt}m | 활주로 거리: ${Math.max(0, Math.floor(st.distanceToRunway))}m`, 84, 56);

      // Distance progresses
      st.distanceToRunway -= 4;

      // Update plane physics
      st.planePitch += (st.targetPitch - st.planePitch) * 0.1;
      st.planeVy = Math.sin(st.planePitch) * 4.0;
      st.planeY += st.planeVy;

      // Boundary limit
      st.planeY = Math.max(90, Math.min(h - 50, st.planeY));
      setAltitude(Math.max(0, Math.floor(500 - st.planeY)));

      // Draw Turbines
      st.turbines.forEach((tb) => {
        tb.bladeAngle += 0.05;
        const screenX = tb.x - (1200 - st.distanceToRunway);

        if (screenX > -50 && screenX < w + 50) {
          // Pole
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(screenX - 4, tb.y, 8, h - tb.y);

          // Rotor hub
          ctx.beginPath();
          ctx.arc(screenX, tb.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#64748b';
          ctx.fill();

          // Blades
          for (let b = 0; b < 3; b++) {
            const angle = tb.bladeAngle + (b * Math.PI * 2) / 3;
            const bx = screenX + Math.cos(angle) * 40;
            const by = tb.y + Math.sin(angle) * 40;
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(screenX, tb.y);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }

          // Check Collision with Turbine Blades
          const distToHub = Math.hypot(screenX - st.planeX, tb.y - st.planeY);
          if (distToHub < 45) {
            // Turbulence bump!
            st.planePitch = 0.4;
            st.planeY += 20;
          }
        }
      });

      // Runway Approach (When distanceToRunway < 250)
      if (st.distanceToRunway <= 250) {
        const runwayProgress = (250 - st.distanceToRunway) / 250;
        const runwayX = w - 250 * (1 - runwayProgress);

        // Draw Runway Tarmac
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(runwayX, h - 50, 300, 40);

        // Runway White Center Lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(runwayX, h - 30);
        ctx.lineTo(runwayX + 300, h - 30);
        ctx.stroke();
        ctx.setLineDash([]);

        // Check Touchdown
        if (st.planeX >= runwayX && st.planeY >= h - 70 && !st.landingSuccess) {
          st.landingSuccess = true;
          st.landings += 1;
          setLandingCount(st.landings);

          // Landing smoke particles
          for (let i = 0; i < 20; i++) {
            st.particles.push({
              x: st.planeX,
              y: h - 50,
              vx: -Math.random() * 6,
              vy: -Math.random() * 3,
              color: '#ffffff',
              life: 1.0,
            });
          }

          if (st.landings >= TARGET_LANDINGS && !st.gameWon) {
            st.gameWon = true;
            setGameWon(true);
            const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
            const receipt = calculateAndDepositMissionReward({
              gameId: 'perfect-landing-plane-pilot',
              gameTitle: 'Perfect Landing, Plane Pilot',
              score: st.landings * 100,
              durationSeconds: duration,
            });
            setRewardReceipt(receipt);
          } else {
            setTimeout(resetApproach, 1000);
          }
        }
      }

      // Draw Airplane
      ctx.save();
      ctx.translate(st.planeX, st.planeY);
      ctx.rotate(st.planePitch);

      // Fuselage (Body)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cockpit Window
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(12, -2, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-6, -14, 8, 28);

      // Tail fin
      ctx.beginPath();
      ctx.moveTo(-20, -2);
      ctx.lineTo(-24, -12);
      ctx.lineTo(-16, -2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      ctx.restore();

      // Draw Particles
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life <= 0) {
          st.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Bottom Instructions
      ctx.fillStyle = '#0f172a';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 화면 상단 터치: 상승 | 화면 하단 터치: 하강 및 착륙 ]', w / 2, h - 10);
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
    const scaleY = canvas.height / rect.height;
    const y = (e.clientY - rect.top) * scaleY;

    if (y < canvas.height / 2) {
      stateRef.current.targetPitch = -0.35; // Climb up
    } else {
      stateRef.current.targetPitch = 0.35; // Dive down
    }
  };

  const handlePointerUp = () => {
    stateRef.current.targetPitch = 0; // Level flight
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Perfect Landing"
        score={landingCount}
        targetScore={TARGET_LANDINGS}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm cursor-pointer"
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

export default PokiPerfectLandingGame;

