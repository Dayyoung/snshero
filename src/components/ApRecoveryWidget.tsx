import React, { useState, useEffect, useMemo } from 'react';
import { Zap, Clock, Coins, Check, AlertCircle } from 'lucide-react';
import { Language } from '../types';

interface ApRecoveryWidgetProps {
  currentAp: number;
  maxAp?: number;
  goldBalance?: number;
  onApRestored?: (addedAp: number, costGold: number) => void;
  language: Language;
}

const AP_RECOVERY_INTERVAL_SEC = 300; // 5분마다 1 AP 충전
const GOLD_REST_COST = 500;
const GOLD_REST_AP_GAIN = 5;
const MAX_DAILY_GOLD_REST = 2;

export const ApRecoveryWidget: React.FC<ApRecoveryWidgetProps> = ({
  currentAp,
  maxAp = 20,
  goldBalance = 1500,
  onApRestored,
  language,
}) => {
  const [remainingSec, setRemainingSec] = useState<number>(AP_RECOVERY_INTERVAL_SEC);
  const [successToast, setSuccessToast] = useState(false);

  // 일일 사용 횟수 로컬스토리지 관리
  const todayKey = useMemo(() => {
    const d = new Date();
    return `hero_gold_rest_claims_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
  }, []);

  const [dailyClaims, setDailyClaims] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      return parseInt(localStorage.getItem(todayKey) || '0', 10);
    } catch {
      return 0;
    }
  });

  // 카운트다운 타이머
  useEffect(() => {
    if (currentAp >= maxAp) return;

    const timer = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          return AP_RECOVERY_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentAp, maxAp]);

  const formatCountdown = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleGoldRest = () => {
    if (dailyClaims >= MAX_DAILY_GOLD_REST || goldBalance < GOLD_REST_COST) return;

    const newClaims = dailyClaims + 1;
    setDailyClaims(newClaims);
    try {
      localStorage.setItem(todayKey, String(newClaims));
    } catch (e) {
      console.warn('Failed to store daily rest claim:', e);
    }

    if (onApRestored) {
      onApRestored(GOLD_REST_AP_GAIN, GOLD_REST_COST);
    }

    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 2500);
  };

  const claimsRemaining = Math.max(0, MAX_DAILY_GOLD_REST - dailyClaims);
  const canAfford = goldBalance >= GOLD_REST_COST;

  return (
    <div className="p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 text-zinc-100 shadow-md font-mono text-xs space-y-2.5">
      {/* Top Bar: AP count & Countdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold">
          <Zap size={15} className="text-amber-400 fill-amber-400" />
          <span className="text-white">AP: {currentAp} / {maxAp}</span>
        </div>

        {currentAp < maxAp ? (
          <div className="flex items-center gap-1 text-[11px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            <Clock size={12} className="animate-spin-slow" />
            <span>{language === 'ko' ? `다음 1 AP 충전: ${formatCountdown(remainingSec)}` : `Next in ${formatCountdown(remainingSec)}`}</span>
          </div>
        ) : (
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {language === 'ko' ? 'AP 완전 충전됨' : 'Fully Charged'}
          </span>
        )}
      </div>

      {/* Gold Rest Button (Row 1055 / ID 318) */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-200">
            <Coins size={12} className="text-yellow-400" />
            <span>{language === 'ko' ? '골드로 휴식 (Gold Rest)' : 'Gold Rest'}</span>
          </div>
          <span className="text-[10px] text-zinc-500">
            {language === 'ko' ? `500 골드 소모 (+5 AP) • 일일 ${claimsRemaining}/${MAX_DAILY_GOLD_REST}회 가능` : `Costs 500G (+5 AP) • ${claimsRemaining}/${MAX_DAILY_GOLD_REST} left today`}
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoldRest}
          disabled={claimsRemaining <= 0 || !canAfford}
          className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 ${
            successToast
              ? 'bg-emerald-600 text-white'
              : claimsRemaining <= 0 || !canAfford
              ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 shadow-xs'
          }`}
        >
          {successToast ? (
            <>
              <Check size={12} />
              <span>{language === 'ko' ? '+5 AP 회복!' : '+5 AP!'}</span>
            </>
          ) : (
            <span>{language === 'ko' ? '500G 충전' : 'Use 500G'}</span>
          )}
        </button>
      </div>
    </div>
  );
};
