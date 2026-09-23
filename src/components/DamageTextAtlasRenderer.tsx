/**
 * DamageTextAtlasRenderer.tsx - SCR-02-22
 * 데미지 숫자를 사전 래스터화된 비트맵 아틀라스에서 단일 드로우 콜로 60fps 렌더링하는 캔버스 컴포넌트
 */

import React, { useRef, useEffect } from 'react';
import { BitmapFontBaker } from '../lib/BitmapFontBaker';

export interface FloatingDamage {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  alpha: number;
}

export const DamageTextAtlasRenderer: React.FC<{ damages: FloatingDamage[] }> = ({ damages }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { canvas: atlas, glyphs } = BitmapFontBaker.getAtlas();
    let currentDamages = [...damages];
    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      currentDamages.forEach((d) => {
        d.y += d.vy;
        d.alpha -= 0.02;

        if (d.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, d.alpha);

          let offsetX = d.x;
          for (let i = 0; i < d.text.length; i++) {
            const ch = d.text[i];
            const glyph = glyphs.get(ch);
            if (glyph) {
              ctx.drawImage(atlas, glyph.x, glyph.y, glyph.w, glyph.h, offsetX, d.y, glyph.w, glyph.h);
              offsetX += glyph.w - 2;
            }
          }
          ctx.restore();
        }
      });

      currentDamages = currentDamages.filter((d) => d.alpha > 0);
      if (currentDamages.length > 0) {
        animId = requestAnimationFrame(render);
      }
    };

    if (currentDamages.length > 0) {
      animId = requestAnimationFrame(render);
    }

    return () => cancelAnimationFrame(animId);
  }, [damages]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth || 360}
      height={window.innerHeight || 640}
      className="pointer-events-none fixed inset-0 z-40 w-full h-full"
    />
  );
};
