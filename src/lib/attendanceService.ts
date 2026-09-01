/**
 * attendanceService.ts
 * 일일 럭키 출석 룰렛 & 7일 연속 출석 도파민 스트릭 보너스 시스템
 * (구글 스프레드시트 Row 704 / ID 553 요구사항 구현)
 */

export interface AttendanceState {
  lastClaimDate: string; // YYYY-MM-DD
  currentStreak: number; // 1~7
  totalClaims: number;
  claimedRewardHistory: {
    date: string;
    day: number;
    rewardType: 'sns' | 'ap' | 'ticket' | 'badge';
    amount: number;
    title: string;
  }[];
}

const STORAGE_KEY = 'hero_attendance_streak_v1';

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getAttendanceState(): AttendanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }

  return {
    lastClaimDate: '',
    currentStreak: 0,
    totalClaims: 0,
    claimedRewardHistory: []
  };
}

export function canClaimDailyRoulette(): boolean {
  const state = getAttendanceState();
  const today = getTodayDateString();
  return state.lastClaimDate !== today;
}

export interface RouletteRewardItem {
  id: string;
  label_ko: string;
  label_en: string;
  rewardType: 'sns' | 'ap' | 'ticket' | 'badge';
  amount: number;
  color: string;
  icon: string;
}

export const ROULETTE_ITEMS: RouletteRewardItem[] = [
  { id: 'sns_100', label_ko: '100 SNS 포인트', label_en: '100 SNS Points', rewardType: 'sns', amount: 100, color: 'from-amber-500 to-yellow-400', icon: '🪙' },
  { id: 'ap_30', label_ko: '30 스태미나 AP', label_en: '30 Stamina AP', rewardType: 'ap', amount: 30, color: 'from-cyan-500 to-blue-400', icon: '⚡' },
  { id: 'sns_250', label_ko: '250 SNS 대박', label_en: '250 SNS Jackpot', rewardType: 'sns', amount: 250, color: 'from-amber-600 to-orange-400', icon: '💰' },
  { id: 'ticket_1', label_ko: 'UR 확정 소환권', label_en: 'UR Summon Ticket', rewardType: 'ticket', amount: 1, color: 'from-fuchsia-600 to-purple-400', icon: '🎟️' },
  { id: 'ap_50', label_ko: '50 스태미나 AP', label_en: '50 Stamina AP', rewardType: 'ap', amount: 50, color: 'from-teal-500 to-emerald-400', icon: '⚡' },
  { id: 'sns_500', label_ko: '500 SNS 메가팟', label_en: '500 SNS Megapot', rewardType: 'sns', amount: 500, color: 'from-rose-600 to-pink-400', icon: '💎' }
];

export function claimDailyReward(selectedItem: RouletteRewardItem): { newState: AttendanceState; streakBonus: number; isSeventhDay: boolean } {
  const state = getAttendanceState();
  const today = getTodayDateString();

  let newStreak = state.currentStreak + 1;
  if (newStreak > 7) {
    newStreak = 1;
  }

  // 7일 연속 출석 여부
  const isSeventhDay = newStreak === 7;
  const streakBonus = newStreak * 20; // 스트릭 일차별 추가 20P SNS

  // 유저 SNS 잔액 입금
  try {
    const rawSns = localStorage.getItem('hero_user_sns');
    const currentSns = rawSns ? parseInt(rawSns, 10) || 0 : 1000;
    const totalGranted = (selectedItem.rewardType === 'sns' ? selectedItem.amount : 0) + streakBonus;
    localStorage.setItem('hero_user_sns', String(currentSns + totalGranted));
  } catch {
    // ignore
  }

  const updatedState: AttendanceState = {
    lastClaimDate: today,
    currentStreak: newStreak,
    totalClaims: state.totalClaims + 1,
    claimedRewardHistory: [
      {
        date: today,
        day: newStreak,
        rewardType: selectedItem.rewardType,
        amount: selectedItem.amount,
        title: selectedItem.label_ko
      },
      ...state.claimedRewardHistory.slice(0, 20)
    ]
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
  } catch {
    // ignore
  }

  return {
    newState: updatedState,
    streakBonus,
    isSeventhDay
  };
}
