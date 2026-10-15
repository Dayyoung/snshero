import React, { useState, useEffect } from 'react';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showTacticalNotification
} from '../../utils/localNotifications';

export interface SevenDayStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateMinigame?: () => void;
  language?: string;
}

interface StreakDayInfo {
  day: number;
  rewardName: string;
  rewardType: 'credits' | 'key' | 'ap' | 'ssr';
  value: string;
  isSsr?: boolean;
}

const STREAK_DAYS: StreakDayInfo[] = [
  { day: 1, rewardName: '200 SNS 원정 보급', rewardType: 'credits', value: '+200 SNS' },
  { day: 2, rewardName: '엘윈 설원 수호 열쇠 x1', rewardType: 'key', value: '수호 열쇠' },
  { day: 3, rewardName: '300 SNS + 정령 마나 50', rewardType: 'ap', value: '+300 / 50 마나' },
  { day: 4, rewardName: '알렉산다르의 검술 비급 x1', rewardType: 'key', value: '검술 비급' },
  { day: 5, rewardName: '500 SNS + 정령 마나 100', rewardType: 'ap', value: '+500 / 100 마나' },
  { day: 6, rewardName: '성기사단 순례 열쇠 x1', rewardType: 'key', value: '순례 열쇠' },
  { day: 7, rewardName: '[SSR] 전설의 천마 페가수스', rewardType: 'ssr', value: 'SSR 페가수스', isSsr: true }
];

const STREAK_I18N: Record<string, Record<string, string>> = {
  ko: {
    modalTitle: '[카단 연대기: 7일간의 설원 원정 서약 // EXPEDITION VOW]',
    subtitle: '매일 원정 기록을 남기면 7일차 전설의 천마 [SSR] 페가수스 확정 합류!',
    dayLabel: '일차',
    claimed: '[수령 완료]',
    claimNow: '[오늘의 원정 보급품 수령]',
    readyToClaim: '[수령 대기]',
    locked: '[잠김]',
    repairTitle: '[서약 복구: 설원 미니게임 수련]',
    repairDesc: '놓친 출석일은 미니게임 2회 승리로 무료 복구 가능합니다.',
    repairBtn: '[미니게임 수련으로 서약 복구 (0/2)]',
    notifBtn: '[일일 원정 알림 설정]',
    notifGranted: '[원정 알림 활성화됨]',
    closeBtn: '[확인]'
  },
  en: {
    modalTitle: '[KADAN CHRONICLES: 7-DAY FROST EXPEDITION VOW]',
    subtitle: 'Check in daily to recruit guaranteed SSR Pegasus on Day 7!',
    dayLabel: 'DAY',
    claimed: '[CLAIMED]',
    claimNow: '[CLAIM EXPEDITION SUPPLY]',
    readyToClaim: '[READY]',
    locked: '[LOCKED]',
    repairTitle: '[VOW REPAIR // MINIGAME TRAINING]',
    repairDesc: 'Missed a day? Win 2 minigames to restore yesterday for free.',
    repairBtn: '[TRAIN IN MINIGAMES (0/2)]',
    notifBtn: '[ENABLE EXPEDITION REMINDER]',
    notifGranted: '[REMINDER ACTIVE]',
    closeBtn: '[CONFIRM]'
  }
};

const STORAGE_KEY = 'snshero_streak_days_v1';
const STORAGE_LAST_CLAIM = 'snshero_streak_last_claim_v1';

export const SevenDayStreakModal: React.FC<SevenDayStreakModalProps> = ({
  isOpen,
  onClose,
  onNavigateMinigame,
  language = 'ko'
}) => {
  const { theme } = useGameSettings();
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [claimedDays, setClaimedDays] = useState<number[]>([]);
  const [canClaimToday, setCanClaimToday] = useState<boolean>(true);
  const [notifGranted, setNotifGranted] = useState<boolean>(false);

  const t = STREAK_I18N[language] || STREAK_I18N.ko;

  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined') {
      try {
        const savedDays = localStorage.getItem(STORAGE_KEY);
        const parsedDays: number[] = savedDays ? JSON.parse(savedDays) : [];
        setClaimedDays(parsedDays);

        const lastClaimStr = localStorage.getItem(STORAGE_LAST_CLAIM);
        if (lastClaimStr) {
          const lastClaimDate = new Date(parseInt(lastClaimStr, 10)).toDateString();
          const today = new Date().toDateString();
          if (lastClaimDate === today) {
            setCanClaimToday(false);
          } else {
            setCanClaimToday(true);
          }
        } else {
          setCanClaimToday(true);
        }

        const nextDay = Math.min(7, (parsedDays.length % 7) + 1);
        setCurrentDay(nextDay);
      } catch {
        // ignore
      }

      setNotifGranted(getNotificationPermission() === 'granted');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = () => {
    if (!canClaimToday) return;
    triggerHaptic('victory');

    const updated = [...claimedDays, currentDay];
    setClaimedDays(updated);
    setCanClaimToday(false);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(STORAGE_LAST_CLAIM, String(Date.now()));

      // 7일차 SSR 페가수스 지급
      if (currentDay === 7) {
        const currentSeason = localStorage.getItem('hero_current_season') || 'season1';
        const invKey = `hero_inventory_${currentSeason}`;
        const invRaw = localStorage.getItem(invKey);
        const inv: Array<{ id: number; level: number; exp: number; count: number }> = invRaw ? JSON.parse(invRaw) : [];
        const existing = inv.find(c => c.id === 90);
        if (existing) existing.count = (existing.count || 1) + 1;
        else inv.push({ id: 90, level: 1, exp: 0, count: 1 });
        localStorage.setItem(invKey, JSON.stringify(inv));
      }
    } catch {
      // ignore
    }
  };

  const handleRequestNotif = async () => {
    triggerHaptic('tap');
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      showTacticalNotification(
        '엘윈 원정대 서약 알림',
        '매일 자정 전 엘윈 원정 서약을 잊지 말고 완수하세요!'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] bg-black/85 flex items-center justify-center p-3 font-mono text-xs select-none animate-fade-in"
    >
      <div className="w-full max-w-lg bg-[#141212] border border-stone-800 rounded-none text-stone-200 flex flex-col relative overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between shrink-0 bg-[#181616]">
          <div>
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">
              [엘윈 설원 순찰 기록]
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              {t.modalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 7일 그리드 (OpenCode.ai 모노스페이스 플랫) */}
        <div className="p-4 space-y-4 overflow-y-auto">
          <p className="text-xs text-stone-400">
            {t.subtitle}
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {STREAK_DAYS.map((sd) => {
              const isClaimed = claimedDays.includes(sd.day);
              const isToday = currentDay === sd.day && canClaimToday;

              return (
                <div
                  key={sd.day}
                  className={`p-2 border rounded-none flex flex-col items-center justify-between min-h-[90px] text-center transition-all ${
                    sd.isSsr
                      ? 'border-amber-500 bg-amber-950/20 text-amber-300 font-bold'
                      : isClaimed
                      ? 'border-stone-800 bg-stone-900/40 text-stone-600'
                      : isToday
                      ? 'border-amber-400 bg-stone-900 text-white ring-1 ring-amber-400'
                      : 'border-stone-800 bg-stone-950/60 text-stone-400'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase text-stone-500">
                    {sd.day}{t.dayLabel}
                  </span>

                  <div className="my-1">
                    <span className="text-[10px] block font-bold leading-tight">
                      {sd.value}
                    </span>
                  </div>

                  {isClaimed ? (
                    <span className="text-[9px] text-stone-500 font-bold">{t.claimed}</span>
                  ) : isToday ? (
                    <span className="text-[9px] text-amber-400 font-bold animate-pulse">{t.readyToClaim}</span>
                  ) : (
                    <span className="text-[9px] text-stone-700">{t.locked}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 오늘 수령 버튼 */}
          {canClaimToday && (
            <button
              type="button"
              onClick={handleClaim}
              className="w-full min-h-[44px] rounded-sm border border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs active:scale-95 transition-all"
            >
              {t.claimNow} ({currentDay}{t.dayLabel})
            </button>
          )}

          {/* 스트릭 복구 훅 (미니게임 연동) */}
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-none flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-stone-300">{t.repairTitle}</div>
              <p className="text-[11px] text-stone-400 mt-0.5">{t.repairDesc}</p>
            </div>
            {onNavigateMinigame && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateMinigame();
                }}
                className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 font-bold rounded-sm text-[10px] shrink-0"
              >
                {t.repairBtn}
              </button>
            )}
          </div>
        </div>

        {/* 하단 알림 및 닫기 */}
        <div className="p-3 border-t border-stone-800 bg-[#181616] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleRequestNotif}
            className="text-[11px] text-stone-400 hover:text-white underline cursor-pointer"
          >
            {notifGranted ? t.notifGranted : t.notifBtn}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 min-h-[44px] rounded-sm border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SevenDayStreakModal;
