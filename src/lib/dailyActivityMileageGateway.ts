/**
 * Daily Activity Mileage & SNS Point Equity Gateway (dailyActivityMileageGateway.ts)
 * 1 AP당 10 SNS 포인트 표준 적립 및 일일 100 AP 소진 시 500 SNS 페이백 상자 지급
 */

const MILEAGE_STORAGE_KEY = 'hero_daily_activity_mileage_v1';

export interface DailyActivityMileageState {
  date: string; // YYYY-MM-DD
  totalApSpentToday: number;
  accumulatedMileageSns: number;
  isDailyChestClaimed: boolean;
  history: Array<{
    timestamp: number;
    activityType: 'mission' | 'pvp' | 'story' | 'market' | 'dungeon';
    apSpent: number;
    snsEarned: number;
    title: string;
  }>;
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDailyActivityMileageState(): DailyActivityMileageState {
  const today = getTodayString();
  try {
    const raw = localStorage.getItem(MILEAGE_STORAGE_KEY);
    if (raw) {
      const parsed: DailyActivityMileageState = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse mileage state:', e);
  }

  // New Day Initialization
  const defaultState: DailyActivityMileageState = {
    date: today,
    totalApSpentToday: 0,
    accumulatedMileageSns: 0,
    isDailyChestClaimed: false,
    history: [],
  };
  saveDailyActivityMileageState(defaultState);
  return defaultState;
}

export function saveDailyActivityMileageState(state: DailyActivityMileageState): void {
  try {
    localStorage.setItem(MILEAGE_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save mileage state:', e);
  }
}

/**
 * AP 소모 시 1 AP당 10 SNS 마일리지 적립 기록
 */
export function recordApConsumption(
  activityType: 'mission' | 'pvp' | 'story' | 'market' | 'dungeon',
  apSpent: number,
  title: string
): { snsEarned: number; totalApSpent: number; canClaimChest: boolean } {
  const state = getDailyActivityMileageState();
  const snsEarned = Math.max(0, apSpent * 10);

  state.totalApSpentToday += apSpent;
  state.accumulatedMileageSns += snsEarned;
  state.history.unshift({
    timestamp: Date.now(),
    activityType,
    apSpent,
    snsEarned,
    title,
  });

  if (state.history.length > 30) {
    state.history = state.history.slice(0, 30);
  }

  saveDailyActivityMileageState(state);

  // 동기화 이벤트 디스패치
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('snshero_mileage_updated'));
  }

  return {
    snsEarned,
    totalApSpent: state.totalApSpentToday,
    canClaimChest: state.totalApSpentToday >= 100 && !state.isDailyChestClaimed,
  };
}

/**
 * 일일 100 AP 마일스톤 달성 시 500 SNS 페이백 상자 수령
 */
export function claimDaily100ApChest(): { success: boolean; bonusSns: number; message: string } {
  const state = getDailyActivityMileageState();

  if (state.totalApSpentToday < 100) {
    return {
      success: false,
      bonusSns: 0,
      message: `아직 일일 AP 소모량이 부족합니다. (현재: ${state.totalApSpentToday}/100 AP)`,
    };
  }

  if (state.isDailyChestClaimed) {
    return {
      success: false,
      bonusSns: 0,
      message: '오늘의 100 AP 페이백 상자를 이미 수령하셨습니다.',
    };
  }

  const bonusSns = 500;
  state.isDailyChestClaimed = true;
  saveDailyActivityMileageState(state);

  // SNS 포인트 영구 적립
  try {
    const currentSns = Number(localStorage.getItem('hero_sns') || 0);
    localStorage.setItem('hero_sns', String(currentSns + bonusSns));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snshero_sns_updated'));
      window.dispatchEvent(new Event('snshero_mileage_updated'));
    }
  } catch (e) {
    console.error(e);
  }

  return {
    success: true,
    bonusSns,
    message: `🎉 [100 AP 마일스톤 달성] +${bonusSns} SNS 페이백 상자를 성공적으로 수령했습니다!`,
  };
}
