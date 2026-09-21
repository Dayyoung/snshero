/**
 * PredictionDepthCanvas.tsx - SCR-07-13
 * WebGL 셰이더 기반 60fps 무감속 인스턴스 렌더링 베팅 뎁스 차트
 */

import React, { useEffect, useRef } from 'react';
import { createWebGLProgram } from '../lib/GpuHeatmapShader';

interface OrderDepth {
  price: number;
  volume: number;
}

interface PredictionDepthCanvasProps {
  bids: OrderDepth[];
  asks: OrderDepth[];
  width?: number;
  height?: number;
}

export const PredictionDepthCanvas: React.FC<PredictionDepthCanvasProps> = ({
  bids,
  asks,
  width = 320,
  height = 120,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const program = createWebGLProgram(gl);
    if (!program) return;

    gl.viewport(0, 0, width, height);
    gl.clearColor(0.05, 0.05, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    const uRes = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(uRes, width, height);

    // Build geometry for bids (left, green) and asks (right, rose)
    const positions: number[] = [];
    const colors: number[] = [];

    const halfW = width / 2;
    const maxVol = Math.max(1, ...bids.map(b => b.volume), ...asks.map(a => a.volume));

    // Bids (Green)
    bids.slice(0, 10).forEach((b, i) => {
      const x1 = (i / 10) * halfW;
      const x2 = ((i + 1) / 10) * halfW;
      const barH = (b.volume / maxVol) * (height - 10);
      const y1 = height;
      const y2 = height - barH;

      positions.push(x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2);
      for (let k = 0; k < 6; k++) {
        colors.push(0.1, 0.8, 0.4, 0.7);
      }
    });

    // Asks (Rose/Red)
    asks.slice(0, 10).forEach((a, i) => {
      const x1 = halfW + (i / 10) * halfW;
      const x2 = halfW + ((i + 1) / 10) * halfW;
      const barH = (a.volume / maxVol) * (height - 10);
      const y1 = height;
      const y2 = height - barH;

      positions.push(x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2);
      for (let k = 0; k < 6; k++) {
        colors.push(0.9, 0.2, 0.3, 0.7);
      }
    });

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const aCol = gl.getAttribLocation(program, 'a_color');
    gl.enableVertexAttribArray(aCol);
    gl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
  }, [bids, asks, width, height]);

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono overflow-hidden">
      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
        <span className="text-emerald-400 font-bold">● YES 뎁스 (매수)</span>
        <span className="text-slate-500 font-mono text-[9px]">WebGL 60fps 가속</span>
        <span className="text-rose-400 font-bold">NO 뎁스 (매도) ●</span>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-[80px] rounded block"
      />
    </div>
  );
};
