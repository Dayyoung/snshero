/**
 * TouchCalibrationPad.tsx - SCR-12-14
 * 모바일 터치/스와이프/롱프레스 감도를 실시간으로 조작하고 테스트하는 대화형 캘리브레이션 패드
 */

import React, { useState, useRef } from 'react';
import { motion, PanInfo } from 'motion/react';
import { Sliders, Vibrate, Clock, Check, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { TouchSensitivitySettings } from '../lib/GestureSensitivityManager';

interface TouchCalibrationPadProps {
  settings: TouchSensitivitySettings;
  onUpdate: (settings: Partial<TouchSensitivitySettings>) => void;
}

export const TouchCalibrationPad: React.FC<TouchCalibrationPadProps> = ({
  settings,
  onUpdate,
}) => {
  const [testResult, setTestResult] = useState<string>('패드를 스와이프하거나 길게 눌러보세요');
  const pressTimerRef = useRef<any>(null);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const dist = Math.sqrt(info.offset.x * info.offset.x + info.offset.y * info.offset.y);
    if (dist >= settings.swipeThresholdPx) {
      if (settings.hapticIntensity !== 'off') {
        triggerHaptic(settings.hapticIntensity);
      }
      setTestResult(`✅ 스와이프 인식 성공! 이동 거리: ${Math.round(dist)}px (임계값: ${settings.swipeThresholdPx}px)`);
    } else {
      setTestResult(`❌ 스와이프 거리 부족 (${Math.round(dist)}px / 최소 ${settings.swipeThresholdPx}px 필요)`);
    }
  };

  const handleTouchStart = () => {
    pressTimerRef.current = setTimeout(() => {
      if (settings.hapticIntensity !== 'off') {
        triggerHaptic(settings.hapticIntensity);
      }
      setTestResult(`✅ 롱프레스 인식 성공! (${settings.longPressDelayMs}ms 유지됨)`);
    }, settings.longPressDelayMs);
  };

  const handleTouchEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono select-none flex flex-col gap-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
          <Sliders size={15} />
          <span>터치 제스처 캘리브레이션 패드</span>
        </div>
        <span className="text-[10px] text-slate-400">실시간 체감 조율</span>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-3">
        {/* Swipe Threshold */}
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>스와이프 인식 거리</span>
            <span className="text-amber-400 font-bold">{settings.swipeThresholdPx} px</span>
          </div>
          <input
            type="range"
            min={20}
            max={100}
            value={settings.swipeThresholdPx}
            onChange={(e) => onUpdate({ swipeThresholdPx: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Long Press Delay */}
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>롱프레스 지연 시간</span>
            <span className="text-amber-400 font-bold">{settings.longPressDelayMs} ms</span>
          </div>
          <input
            type="range"
            min={150}
            max={600}
            step={50}
            value={settings.longPressDelayMs}
            onChange={(e) => onUpdate({ longPressDelayMs: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Haptic Intensity */}
        <div>
          <span className="text-xs text-slate-300 block mb-1">햅틱 진동 강도</span>
          <div className="grid grid-cols-4 gap-1.5">
            {(['off', 'light', 'medium', 'heavy'] as const).map((intensity) => (
              <button
                key={intensity}
                type="button"
                onClick={() => {
                  if (intensity !== 'off') {
                    triggerHaptic(intensity);
                  }
                  onUpdate({ hapticIntensity: intensity });
                }}
                className={`py-1.5 text-[11px] font-black rounded-lg uppercase ${
                  settings.hapticIntensity === intensity
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {intensity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Testing Sandbox Pad */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        className="w-full h-24 rounded-xl border-2 border-dashed border-amber-500/40 bg-slate-950/80 flex flex-col items-center justify-center text-center p-2 cursor-grab active:cursor-grabbing hover:border-amber-400 transition-colors"
      >
        <span className="text-xs font-bold text-amber-300">🎮 터치 테스트 영역</span>
        <span className="text-[10px] text-slate-400 mt-1">{testResult}</span>
      </motion.div>
    </div>
  );
};
