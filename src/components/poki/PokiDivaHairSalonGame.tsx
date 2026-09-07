import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiDivaHairSalonGameProps {
  onClose: () => void;
}

type Stage = 'shampoo' | 'dry' | 'cut' | 'color';

export default function PokiDivaHairSalonGame({ onClose }: PokiDivaHairSalonGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentStage, setCurrentStage] = useState<Stage>('shampoo');
  const [stageProgress, setStageProgress] = useState(0); // 0 to 100%
  const [selectedColor, setSelectedColor] = useState<string>('#ec4899'); // Pink
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const stateRef = useRef<{
    stage: Stage;
    progress: number;
    color: string;
    bubbles: { x: number; y: number; r: number }[];
    hairLength: number; // 100 down to 70 for cut
    hairWave: number; // 0 to 1
    particles: { x: number; y: number; vx: number; vy: number; color: string; life: number }[];
    isDragging: boolean;
  }>({
    stage: 'shampoo',
    progress: 0,
    color: '#ec4899',
    bubbles: [],
    hairLength: 100,
    hairWave: 0,
    particles: [],
    isDragging: false
  });

  stateRef.current.color = selectedColor;

  const playSound = (type: 'spray' | 'blow' | 'snip' | 'magic' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'spray') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'blow') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(250, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'snip') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(400, now + 0.04);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'magic') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.12);
        osc.frequency.setValueAtTime(784, now + 0.24);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {}
  };

  const advanceStage = () => {
    const s = stateRef.current;
    if (s.stage === 'shampoo') {
      s.stage = 'dry';
      s.progress = 0;
      setCurrentStage('dry');
      setStageProgress(0);
      playSound('magic');
    } else if (s.stage === 'dry') {
      s.stage = 'cut';
      s.progress = 0;
      setCurrentStage('cut');
      setStageProgress(0);
      playSound('magic');
    } else if (s.stage === 'cut') {
      s.stage = 'color';
      s.progress = 0;
      setCurrentStage('color');
      setStageProgress(0);
      playSound('magic');
    } else if (s.stage === 'color') {
      // Finished all 4 stages!
      setGameWon(true);
      playSound('win');
      const deposit = calculateAndDepositMissionReward({
        gameId: 'pokidivahairsalon',
        gameTitle: 'Diva Hair Salon',
        isVictory: true,
        score: 1000,
        maxTargetScore: 1000,
        durationSeconds: 30
      });
      setRewardResult(deposit);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const s = stateRef.current;

      // Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // RENDER
      ctx.fillStyle = '#fdf4ff'; // Light lavender salon wallpaper
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height * 0.45;

      // Salon Mirror Oval
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 140, 170, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Mirror Reflection Back Glass
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 130, 160, 0, 0, Math.PI * 2);
      ctx.fill();

      // Character Diva Model Back Hair
      const hairCol = s.stage === 'color' && s.progress > 50 ? s.color : '#78350f';
      ctx.fillStyle = hairCol;

      // Long Hair Strands
      const len = 70 + (s.hairLength * 0.4);
      ctx.beginPath();
      ctx.ellipse(cx, cy + 30, 75, len, 0, 0, Math.PI * 2);
      ctx.fill();

      // Character Face
      ctx.fillStyle = '#fed7aa'; // Skin
      ctx.beginPath();
      ctx.arc(cx, cy, 54, 0, Math.PI * 2);
      ctx.fill();

      // Eyes & Smile
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(cx - 18, cy - 6, 5, 0, Math.PI * 2);
      ctx.arc(cx + 18, cy - 6, 5, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks (Blush)
      ctx.fillStyle = 'rgba(244, 114, 182, 0.4)';
      ctx.beginPath();
      ctx.arc(cx - 24, cy + 12, 8, 0, Math.PI * 2);
      ctx.arc(cx + 24, cy + 12, 8, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy + 12, 14, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Front Bangs Hair
      ctx.fillStyle = hairCol;
      ctx.beginPath();
      ctx.arc(cx, cy - 20, 56, Math.PI, Math.PI * 2);
      ctx.fill();

      // Tiara if color stage complete
      if (s.stage === 'color' && s.progress >= 90) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 50);
        ctx.lineTo(cx, cy - 70);
        ctx.lineTo(cx + 30, cy - 50);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy - 58, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Shampoo Bubbles
      s.bubbles.forEach((b) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Hair Stylist Card Sprite (Bottom Left Salon Master)
      drawCardSprite(ctx, 70, 24, canvas.height - 110, 48, 48);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Touch & Drag Handling on Hair Zone
    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      const tx = t.clientX - rect.left;
      const ty = t.clientY - rect.top;

      const s = stateRef.current;
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.45;

      // Check if touching hair zone
      if (Math.hypot(tx - cx, ty - cy) < 110) {
        if (s.stage === 'shampoo') {
          s.progress = Math.min(100, s.progress + 2.5);
          s.bubbles.push({
            x: tx + (Math.random() - 0.5) * 20,
            y: ty + (Math.random() - 0.5) * 20,
            r: Math.random() * 8 + 4
          });
          if (s.bubbles.length > 50) s.bubbles.shift();
          playSound('spray');
        } else if (s.stage === 'dry') {
          s.progress = Math.min(100, s.progress + 2.5);
          if (s.bubbles.length > 0) s.bubbles.splice(0, 3);
          s.particles.push({
            x: tx,
            y: ty,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 4,
            color: '#38bdf8',
            life: 15
          });
          playSound('blow');
        } else if (s.stage === 'cut') {
          s.progress = Math.min(100, s.progress + 3.0);
          s.hairLength = Math.max(65, s.hairLength - 0.7);
          s.particles.push({
            x: tx,
            y: ty,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 3,
            color: '#78350f',
            life: 20
          });
          playSound('snip');
        } else if (s.stage === 'color') {
          s.progress = Math.min(100, s.progress + 2.5);
          s.particles.push({
            x: tx,
            y: ty,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: s.color,
            life: 25
          });
          playSound('magic');
        }

        setStageProgress(Math.floor(s.progress));

        // Auto advance if 100%
        if (s.progress >= 100) {
          advanceStage();
        }
      }
    };

    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameWon]);

  return (
    <div className="relative w-full h-full bg-pink-50 flex flex-col select-none overflow-hidden font-mono text-zinc-900">
      <MinimalistMissionHUD
        gameTitle="Diva Hair Salon"
        missionTarget="4단계 살롱 코스 완벽 스타일링"
        currentProgress={`단계: ${
          currentStage === 'shampoo'
            ? '1. 샴푸 세발'
            : currentStage === 'dry'
            ? '2. 헤어 드라이'
            : currentStage === 'cut'
            ? '3. 헤어 커트'
            : '4. 컬러링 & 완성'
        } (${stageProgress}%)`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Color Palette if on Color Stage */}
        {currentStage === 'color' && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-3 pointer-events-auto">
            {[
              { col: '#ec4899', name: '핑크' },
              { col: '#f59e0b', name: '골드' },
              { col: '#a855f7', name: '퍼플' },
              { col: '#06b6d4', name: '스카이' }
            ].map((c) => (
              <button
                key={c.col}
                onClick={() => setSelectedColor(c.col)}
                className={`w-10 h-10 rounded-full border-2 shadow-md transition-transform ${
                  selectedColor === c.col ? 'scale-125 border-zinc-900' : 'border-white'
                }`}
                style={{ backgroundColor: c.col }}
              />
            ))}
          </div>
        )}

        {/* Bottom Tool Guide */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-zinc-900/80 text-zinc-200 border border-zinc-700 px-4 py-2 text-xs rounded-sm shadow-md">
            {currentStage === 'shampoo' && '🧴 모발 부위를 손가락으로 문질러 거품 세발을 진행하세요!'}
            {currentStage === 'dry' && '💨 드라이어로 모발을 문질러 수분을 완전히 말리세요!'}
            {currentStage === 'cut' && '✂️ 가위로 모발 끝을 다듬어 우아한 길이로 손질하세요!'}
            {currentStage === 'color' && '🎨 상단 컬러를 선택 후 모발을 문질러 완벽 염색하세요!'}
          </span>
        </div>
      </div>

      {gameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          rewardSNS={rewardResult.rewardSNS}
          gameTitle="Diva Hair Salon"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
