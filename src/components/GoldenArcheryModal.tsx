import React, { useState, useEffect, useRef } from 'react';
import { Target, Trophy, Wind, Sparkles, X } from 'lucide-react';
import { Language } from '../types';

interface GoldenArcheryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  playSfx: (url: string) => void;
  onReward: (amount: number, reason: string) => void;
}

export const GoldenArcheryModal: React.FC<GoldenArcheryModalProps> = ({
  isOpen,
  onClose,
  language,
  playSfx,
  onReward,
}) => {
  const [arrowsLeft, setArrowsLeft] = useState<number>(3);
  const [scores, setScores] = useState<number[]>([]);
  const [wind, setWind] = useState<{ direction: 'LEFT' | 'RIGHT'; speed: number }>({
    direction: 'RIGHT',
    speed: 2,
  });
  const [aimX, setAimX] = useState<number>(50); // 0~100%
  const [isAiming, setIsAiming] = useState<boolean>(true);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const aimDirectionRef = useRef<number>(1);

  // Oscillating aim reticle animation
  useEffect(() => {
    if (!isOpen || !isAiming || isFinished) return;

    const interval = setInterval(() => {
      setAimX((prev) => {
        let next = prev + aimDirectionRef.current * 3;
        if (next >= 95) {
          aimDirectionRef.current = -1;
          next = 95;
        } else if (next <= 5) {
          aimDirectionRef.current = 1;
          next = 5;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isOpen, isAiming, isFinished]);

  if (!isOpen) return null;

  const handleShoot = () => {
    if (arrowsLeft <= 0 || isFinished) return;

    setIsAiming(false);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'); // Arrow shoot sfx

    // Calculate score based on center distance + wind offset
    const windOffset = (wind.direction === 'RIGHT' ? 1 : -1) * (wind.speed * 4);
    const finalLandingX = Math.max(0, Math.min(100, aimX + windOffset));
    const distFromCenter = Math.abs(finalLandingX - 50);

    let score = 0;
    if (distFromCenter <= 5) score = 10; // Bullseye 10
    else if (distFromCenter <= 12) score = 9;
    else if (distFromCenter <= 20) score = 8;
    else if (distFromCenter <= 30) score = 7;
    else if (distFromCenter <= 40) score = 6;
    else score = 4;

    const nextScores = [...scores, score];
    setScores(nextScores);
    const nextArrows = arrowsLeft - 1;
    setArrowsLeft(nextArrows);

    setTimeout(() => {
      if (nextArrows <= 0) {
        setIsFinished(true);
        const total = nextScores.reduce((a, b) => a + b, 0);
        const rewardSns = total * 10 + (total >= 28 ? 100 : 0);
        onReward(rewardSns, `황금 양궁 챌린지 (${total}점 만점 획득)`);
      } else {
        // Randomize next wind
        setWind({
          direction: Math.random() > 0.5 ? 'RIGHT' : 'LEFT',
          speed: Math.floor(Math.random() * 4) + 1,
        });
        setIsAiming(true);
      }
    }, 800);
  };

  const totalScore = scores.reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs font-mono">
      <div className="relative w-full max-w-sm bg-[#fdfcfc] text-[#201d1d] border-2 border-[#201d1d] shadow-none rounded-none p-4 flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-black/10 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-yellow-600" />
            <span className="font-black text-sm tracking-wider">
              {language === 'ko' ? '[황금 양궁 과녁 사격]' : '[GOLDEN ARCHERY CHALLENGE]'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-black/5 text-[#201d1d] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Wind & Arrow Indicator */}
        <div className="w-full flex items-center justify-between p-2 bg-slate-100 border border-black/10 rounded-sm mb-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <Wind size={14} className="text-sky-600" />
            <span>
              {language === 'ko' ? '풍속: ' : 'Wind: '}
              {wind.direction === 'LEFT' ? '◀' : '▶'} {wind.speed} m/s
            </span>
          </div>
          <div className="font-bold text-amber-700">
            {language === 'ko' ? '남은 화살: ' : 'Arrows: '}
            {'🏹'.repeat(arrowsLeft)}
          </div>
        </div>

        {/* Archery Target Canvas */}
        <div className="relative w-56 h-56 bg-slate-900 border-4 border-amber-500 rounded-full flex items-center justify-center my-2 shadow-inner overflow-hidden">
          {/* Target Rings (10, 9, 8, 7, 6...) */}
          <div className="absolute inset-4 border-2 border-white/40 rounded-full bg-slate-800" />
          <div className="absolute inset-8 border-2 border-blue-400/50 rounded-full bg-blue-900/60" />
          <div className="absolute inset-14 border-2 border-red-400/60 rounded-full bg-red-800/80" />
          <div className="absolute inset-20 border-2 border-yellow-300 rounded-full bg-yellow-400 flex items-center justify-center">
            <span className="text-[#201d1d] font-black text-xs">10</span>
          </div>

          {/* Aim Reticle Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-300 pointer-events-none transition-all duration-75"
            style={{ left: `${aimX}%` }}
          >
            <div className="w-4 h-4 border-2 border-yellow-300 -translate-x-1.5 translate-y-24 rounded-full" />
          </div>
        </div>

        {/* Score History */}
        <div className="flex items-center gap-2 w-full justify-center my-2">
          {[0, 1, 2].map((idx) => {
            const sc = scores[idx];
            return (
              <div
                key={idx}
                className="w-12 h-10 border border-black/20 bg-white flex flex-col items-center justify-center font-black text-xs rounded-sm"
              >
                <span className="text-[9px] text-slate-500">{idx + 1}발</span>
                <span className={sc === 10 ? 'text-amber-600 text-sm' : 'text-[#201d1d]'}>
                  {sc !== undefined ? `${sc}점` : '-'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="w-full mt-3">
          {!isFinished ? (
            <button
              onClick={handleShoot}
              disabled={!isAiming || arrowsLeft <= 0}
              className="w-full min-h-[44px] px-4 bg-[#201d1d] text-[#fdfcfc] hover:bg-black font-black text-xs rounded-sm flex items-center justify-center gap-2 cursor-pointer shadow-none"
            >
              <span>🏹 {language === 'ko' ? '정밀 화살 발사!' : 'Shoot Arrow!'}</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full min-h-[44px] px-4 bg-amber-500 text-[#201d1d] hover:bg-amber-400 border border-amber-600 font-black text-xs rounded-sm flex items-center justify-center gap-2 cursor-pointer shadow-none"
            >
              <Trophy size={14} />
              <span>{language === 'ko' ? `총 ${totalScore}점 상금 수령 완료` : `Claim Total ${totalScore} Pts`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
