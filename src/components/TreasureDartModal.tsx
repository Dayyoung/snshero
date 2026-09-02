import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSns } from '../contexts/SnsContext';

interface TreasureDartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TreasureDartModal: React.FC<TreasureDartModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [dartPos, setDartPos] = useState<number>(0); // 0 to 100 (%)
  const [isAiming, setIsAiming] = useState<boolean>(true);
  const [rewardResult, setRewardResult] = useState<{
    zone: 'JACKPOT' | 'GREAT' | 'GOOD' | 'NORMAL';
    rewardText: string;
    points: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { addSns } = useSns();
  const dirRef = useRef<number>(1);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && isAiming) {
      const updateDart = () => {
        setDartPos(prev => {
          let next = prev + dirRef.current * 2.2;
          if (next >= 100) {
            next = 100;
            dirRef.current = -1;
          } else if (next <= 0) {
            next = 0;
            dirRef.current = 1;
          }
          return next;
        });
        animRef.current = requestAnimationFrame(updateDart);
      };
      animRef.current = requestAnimationFrame(updateDart);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isOpen, isAiming]);

  if (!isOpen) return null;

  const handleThrowDart = () => {
    if (!isAiming) return;
    setIsAiming(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);

    // Evaluate target zone
    // Center is 50%
    const distFromCenter = Math.abs(dartPos - 50);
    let zone: 'JACKPOT' | 'GREAT' | 'GOOD' | 'NORMAL' = 'NORMAL';
    let rewardText = '';
    let points = 50;

    if (distFromCenter <= 6) {
      zone = 'JACKPOT';
      rewardText = '★ JACKPOT: 전설 소환권 & +300 SNS 포인트 & 50 Gems!';
      points = 300;
    } else if (distFromCenter <= 16) {
      zone = 'GREAT';
      rewardText = 'GREAT: 에픽 룬 소환석 & +150 SNS 포인트 & 20 Gems!';
      points = 150;
    } else if (distFromCenter <= 30) {
      zone = 'GOOD';
      rewardText = 'GOOD: 레어 카드 팩 & +80 SNS 포인트!';
      points = 80;
    } else {
      zone = 'NORMAL';
      rewardText = 'NORMAL: 골드 상자 & +40 SNS 포인트!';
      points = 40;
    }

    addSns(points, '보스 3콤보 황금 다트 보너스');
    setRewardResult({ zone, rewardText, points });
  };

  const handleResetOrClose = () => {
    setRewardResult(null);
    setIsAiming(true);
    setDartPos(0);
    onClose();
  };

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const content = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono select-none pointer-events-auto">
      <div className="w-full max-w-md bg-[#fdfcfc] border-2 border-amber-500 rounded-none p-5 shadow-2xl space-y-4 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🎯</span>
            <div>
              <h2 className="text-base font-bold text-[#201d1d] uppercase tracking-wide">
                황금 보물상자 다트 (Treasure Dart)
              </h2>
              <p className="text-[11px] text-amber-700 font-bold">
                [보스 3-콤보 토벌 특별 보너스] 타이밍을 맞춰 정중앙을 명중시키세요!
              </p>
            </div>
          </div>
        </div>

        {/* Dartboard Target Track */}
        <div className="space-y-2 py-4">
          <div className="relative w-full h-12 bg-gray-200 border-2 border-[#201d1d] rounded-sm overflow-hidden flex items-center">
            {/* Zones */}
            <div className="absolute inset-y-0 left-0 w-[20%] bg-gray-300" />
            <div className="absolute inset-y-0 left-[20%] w-[14%] bg-blue-200" />
            <div className="absolute inset-y-0 left-[34%] w-[10%] bg-purple-200" />
            <div className="absolute inset-y-0 left-[44%] w-[12%] bg-amber-400 border-x-2 border-amber-600 flex items-center justify-center font-bold text-[10px] text-amber-950">
              JACKPOT
            </div>
            <div className="absolute inset-y-0 left-[56%] w-[10%] bg-purple-200" />
            <div className="absolute inset-y-0 left-[66%] w-[14%] bg-blue-200" />
            <div className="absolute inset-y-0 right-0 w-[20%] bg-gray-300" />

            {/* Moving Dart Pointer */}
            <div
              className="absolute top-0 bottom-0 w-3 bg-red-600 border border-black shadow-md transition-none -ml-1.5 flex items-center justify-center"
              style={{ left: `${dartPos}%` }}
            >
              <div className="w-1 h-8 bg-white" />
            </div>
          </div>

          {/* Target Zone Guide */}
          <div className="flex justify-between text-[10px] text-gray-500 font-bold px-1">
            <span>[NORMAL]</span>
            <span>[GOOD]</span>
            <span className="text-amber-700">[★ JACKPOT]</span>
            <span>[GOOD]</span>
            <span>[NORMAL]</span>
          </div>
        </div>

        {/* Result Showcase */}
        {rewardResult && (
          <div className="p-3 bg-amber-50 border border-amber-400 rounded-sm text-center space-y-1 animate-fade-in">
            <div className="text-xs font-black text-amber-900 uppercase">
              [{rewardResult.zone} HIT!]
            </div>
            <p className="text-xs font-bold text-[#201d1d] leading-snug">
              {rewardResult.rewardText}
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex justify-center pt-2">
          {isAiming ? (
            <button
              onClick={handleThrowDart}
              className="min-h-[48px] w-full px-6 py-3 bg-[#201d1d] text-[#fdfcfc] hover:bg-black font-bold text-sm rounded-sm flex items-center justify-center gap-2 border border-black cursor-pointer active:scale-95"
            >
              <span>🎯</span>
              <span>[지금 다트 던지기!]</span>
            </button>
          ) : (
            <button
              onClick={handleResetOrClose}
              className="min-h-[44px] w-full px-6 py-2.5 bg-amber-500 text-[#201d1d] hover:bg-amber-400 font-bold text-sm rounded-sm border border-black cursor-pointer active:scale-95"
            >
              [보상 수령 완료]
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
