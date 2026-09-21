/**
 * WeatherAtmosphereEffect.tsx - SCR-01-18
 * 로비 기상 환경(비/눈) 파티클 이펙트, 우천 핫타임(골드 +30%) 및 레인 드롭 스킨 팩 모달
 */

import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, Snowflake, Sun, Sparkles, X, Gift } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface WeatherAtmosphereEffectProps {
  weather?: 'rain' | 'snow' | 'clear';
  onBuySkinPack?: () => void;
}

export const WeatherAtmosphereEffect: React.FC<WeatherAtmosphereEffectProps> = ({
  weather = 'rain',
  onBuySkinPack,
}) => {
  const [showPromo, setShowPromo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Rain / Snow particle loop
  useEffect(() => {
    if (weather === 'clear') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 2 + Math.random() * 4,
      length: 8 + Math.random() * 10,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = weather === 'rain' ? 'rgba(147, 197, 253, 0.4)' : 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        if (weather === 'rain') {
          ctx.lineTo(p.x - 1, p.y + p.length);
        } else {
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        }
        ctx.stroke();

        p.y += p.speed;
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [weather]);

  return (
    <>
      {weather !== 'clear' && (
        <canvas
          ref={canvasRef}
          width={window.innerWidth || 400}
          height={window.innerHeight || 800}
          className="fixed inset-0 pointer-events-none z-10 w-full h-full opacity-60"
        />
      )}

      {/* Weather Hot Time Badge */}
      <div className="fixed top-20 left-4 z-20 font-mono select-none">
        <button
          type="button"
          onClick={() => setShowPromo(true)}
          className="px-2.5 py-1 bg-cyan-950/85 border border-cyan-400/60 rounded-full flex items-center gap-1.5 text-[11px] text-cyan-200 cursor-pointer shadow-lg active:scale-95"
        >
          {weather === 'rain' ? <CloudRain size={13} className="text-cyan-400 animate-bounce" /> : <Snowflake size={13} className="text-white animate-spin" />}
          <span>감성 우천 핫타임 (골드 +30%)</span>
        </button>
      </div>

      {/* Rain Drop Skin Pack Modal (SCR-01-18) */}
      {showPromo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none">
          <div className="bg-slate-950 border-2 border-cyan-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
            <div className="p-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-xs">
                <CloudRain size={16} />
                <span>🌧️ 비 오는 날 한정 70% 특가</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPromo(false)}
                className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-3xl">
                💧
              </div>
              <div>
                <h4 className="text-sm font-black text-white">레인 드롭 한정 스킨 팩 (990원)</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  현지 날씨 비/눈 감응 전용 물방울 카드 프레임 & 빗소리 BGM 테마가 즉시 해금됩니다.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('heavy');
                  if (onBuySkinPack) onBuySkinPack();
                  setShowPromo(false);
                }}
                className="h-11 w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
              >
                <Sparkles size={14} />
                <span>특가 팩 구매 (200 SNS)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
