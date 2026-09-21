/**
 * InteractiveCreditsRoll.tsx - SCR-12-18
 * 닉네임과 대표 카드가 별자리로 반짝이는 3D 인터랙티브 엔드 크레딧 및 파운더스 후원자 명예 패키지(3,300원)
 */

import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, Award, Sparkles, X, Heart } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface CreditDonor {
  name: string;
  role: string;
  cardName: string;
}

interface InteractiveCreditsRollProps {
  isOpen: boolean;
  onClose: () => void;
  donors: CreditDonor[];
  onBuyFoundersPack: () => void;
}

export const InteractiveCreditsRoll: React.FC<InteractiveCreditsRollProps> = ({
  isOpen,
  onClose,
  donors,
  onBuyFoundersPack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, 320, 200);

      // Stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 37 + offset * 0.2) % 320;
        const sy = (i * 29) % 200;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Rolling Names
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';

      donors.forEach((d, idx) => {
        const y = 200 - ((offset + idx * 45) % (donors.length * 45 + 100));
        if (y > 0 && y < 200) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(`★ ${d.name} ★`, 160, y);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px monospace';
          ctx.fillText(`[${d.role} • ${d.cardName}]`, 160, y + 14);
          ctx.font = 'bold 12px monospace';
        }
      });

      offset += 0.8;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isOpen, donors]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Star size={16} />
            <span>🌌 별자리 인터랙티브 엔드 크레딧</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-slate-950 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          {/* Starfield Canvas */}
          <canvas
            ref={canvasRef}
            width={320}
            height={200}
            className="rounded-2xl border border-slate-800 bg-slate-950 w-full shadow-inner"
          />

          <div>
            <h4 className="text-sm font-black text-white">SNSHERO 창립 후원자 명예의 전당</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              게임을 빛내주신 영웅들의 닉네임과 대표 카드가 영원히 밤하늘의 별자리로 기록됩니다.
            </p>
          </div>

          {/* Founders Honor Pack (SCR-12-18) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">파운더스 후원자 명예 팩</span>
              <span className="text-[9px] text-slate-400">크레딧 영구 등재 + 골든 프로필 테두리</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyFoundersPack();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (500 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
