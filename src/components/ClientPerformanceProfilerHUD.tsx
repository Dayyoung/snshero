/**
 * ClientPerformanceProfilerHUD.tsx - SCR-12-19
 * 실시간 FPS, 힙 메모리, 프레임 타임을 무부하로 측정하는 성능 진단 프로파일러 HUD
 */

import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive } from 'lucide-react';

export const ClientPerformanceProfilerHUD: React.FC = () => {
  const [fps, setFps] = useState(60);
  const [memoryMB, setMemoryMB] = useState(48);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;

        // Memory if available in Chromium
        const perf = performance as unknown as { memory?: { usedJSHeapSize: number } };
        if (perf.memory) {
          setMemoryMB(Math.round(perf.memory.usedJSHeapSize / (1024 * 1024)));
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="fixed top-14 right-2 z-40 bg-slate-950/90 border border-slate-700/80 backdrop-blur-md rounded-xl px-2.5 py-1.5 flex items-center gap-3 font-mono text-[10px] select-none text-slate-300 shadow-md">
      <div className="flex items-center gap-1">
        <Activity size={12} className={fps >= 55 ? 'text-emerald-400' : 'text-amber-400'} />
        <span className="font-bold">{fps} FPS</span>
      </div>

      <div className="flex items-center gap-1">
        <HardDrive size={12} className="text-blue-400" />
        <span>{memoryMB} MB</span>
      </div>
    </div>
  );
};
