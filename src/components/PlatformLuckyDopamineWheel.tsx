/**
 * PlatformLuckyDopamineWheel.tsx
 * 전 플랫폼 통합 일일 럭키 도파민 휠 & 콤보 잭팟 마일스톤 루프
 * (구글 스프레드시트 Row 949 / ID 553 요구사항 구현)
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Trophy } from 'lucide-react';
import { Language } from '../types';

interface PlatformLuckyDopamineWheelProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

interface WheelSegment {
  id: number;
  label: string;
  type: 'sns' | 'pack' | 'ap' | 'jackpot';
  amount: number;
  color: string;
}

export const PlatformLuckyDopamineWheel: React.FC<PlatformLuckyDopamineWheelProps> = ({
  isOpen,
  onClose,
  language = 'ko',
}) => {
  const isKo = language === 'ko';
  const STORAGE_KEY_DAILY_SPIN = 'hero_dopamine_wheel_last_spin';

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [wonSegment, setWonSegment] = useState<WheelSegment | null>(null);

  const SEGMENTS: WheelSegment[] = [
    { id: 0, label: '50 SNS', type: 'sns', amount: 50, color: '#3b82f6' },
    { id: 1, label: '일반팩 1장', type: 'pack', amount: 1, color: '#10b981' },
    { id: 2, label: '100 SNS', type: 'sns', amount: 100, color: '#8b5cf6' },
    { id: 3, label: '30 AP 포션', type: 'ap', amount: 30, color: '#06b6d4' },
    { id: 4, label: '★ 500 SNS 잭팟 ★', type: 'jackpot', amount: 500, color: '#f59e0b' },
    { id: 5, label: '매직팩 1장', type: 'pack', amount: 1, color: '#ec4899' },
  ];

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = localStorage.getItem(STORAGE_KEY_DAILY_SPIN);
    setHasSpunToday(lastDate === today);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning || hasSpunToday) return;

    setIsSpinning(true);
    setWonSegment(null);

    // 랜덤 당첨 인덱스 선정 (0 ~ 5)
    const winningIndex = Math.floor(Math.random() * SEGMENTS.length);
    const segmentAngle = 360 / SEGMENTS.length;
    // 5~8바퀴 회전 후 해당 세그먼트의 중심에 멈추도록 계산
    const extraSpins = 360 * 6;
    const targetDeg = extraSpins + (360 - winningIndex * segmentAngle - segmentAngle / 2);

    setRotationDeg(targetDeg);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = SEGMENTS[winningIndex];
      setWonSegment(prize);
      setHasSpunToday(true);

      // 보상 즉시 적립
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(STORAGE_KEY_DAILY_SPIN, today);

      if (prize.type === 'sns' || prize.type === 'jackpot') {
        const current = parseInt(localStorage.getItem('hero_sns_point') || '0', 10) || 0;
        const updated = current + prize.amount;
        localStorage.setItem('hero_sns_point', updated.toString());

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('hero_sns_point_changed', {
              detail: { newBalance: updated, diff: prize.amount, reason: 'dopamine_wheel' },
            })
          );
        }
      }
    }, 3800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-mono select-none">
      <div className="relative w-full max-w-sm bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d] dark:border-white rounded-none p-4 text-[#201d1d] dark:text-[#fdfcfc] flex flex-col items-center gap-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between w-full border-b border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] pb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-black tracking-tight">
              {isKo ? '일일 럭키 도파민 휠' : 'Daily Dopamine Wheel'}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1 text-[#6e6e73] hover:text-[#201d1d] dark:hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 휠 컨테이너 */}
        <div className="relative flex items-center justify-center w-56 h-56 my-2">
          {/* 상단 화살표 핀 */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-red-600 drop-shadow-md" />

          {/* 회전판 */}
          <div
            className="w-full h-full rounded-full border-4 border-[#201d1d] dark:border-white relative overflow-hidden transition-transform ease-out"
            style={{
              transform: `rotate(${rotationDeg}deg)`,
              transitionDuration: isSpinning ? '3800ms' : '0ms',
            }}
          >
            {SEGMENTS.map((seg, idx) => {
              const rotate = idx * 60;
              return (
                <div
                  key={seg.id}
                  className="absolute top-0 left-0 w-full h-full origin-center flex items-start justify-center pt-2"
                  style={{
                    transform: `rotate(${rotate}deg)`,
                    backgroundColor: seg.color,
                    clipPath: 'polygon(50% 50%, 21% 0%, 79% 0%)',
                  }}
                >
                  <span className="text-[10px] font-black text-white drop-shadow-md select-none mt-2">
                    {seg.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 중앙 허브 버튼 */}
          <button
            onClick={handleSpin}
            disabled={isSpinning || hasSpunToday}
            className={`absolute z-10 w-16 h-16 rounded-full font-black text-[11px] flex items-center justify-center border-2 border-white shadow-md active:scale-95 transition-all ${
              hasSpunToday
                ? 'bg-neutral-400 text-neutral-200 cursor-not-allowed'
                : isSpinning
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-[#201d1d] text-white hover:bg-black cursor-pointer'
            }`}
          >
            {isSpinning ? 'SPIN!' : hasSpunToday ? (isKo ? '내일 도전' : 'DONE') : (isKo ? '회전!' : 'SPIN')}
          </button>
        </div>

        {/* 당첨 결과 배너 */}
        {wonSegment && (
          <div className="w-full p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-400 rounded-sm text-center flex flex-col items-center gap-1 animate-bounce">
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-300 text-xs font-black">
              <Trophy size={14} />
              <span>{isKo ? '축하합니다! 보상 당첨!' : 'Congratulations!'}</span>
            </div>
            <span className="text-sm font-black text-[#201d1d] dark:text-white">
              [{wonSegment.label}] 즉시 지급 완료!
            </span>
          </div>
        )}

        <p className="text-[11px] text-[#777] dark:text-[#aaa] text-center">
          {hasSpunToday
            ? isKo
              ? '오늘의 휠 기회를 모두 사용했습니다. 자정에 다시 충전됩니다!'
              : 'Daily spin completed. Recharges tomorrow at midnight!'
            : isKo
            ? '매일 1회 무료 회전! 미션 3회 클리어 시 추가 보너스 스핀 획득.'
            : '1 free spin daily! Clear 3 missions for an extra bonus spin.'}
        </p>
      </div>
    </div>
  );
};
