/**
 * platformTokenEconomyGate.ts
 * 마켓플레이스 수수료 바이백-소각 연동 및 활동별(PVP/미션/스토리/출석) 일일 SNS 포인트 수급 밸런스 정규화 게이트웨이
 * (구글 스프레드시트 Row 777 / ID 566 요구사항 구현)
 */

export interface TokenEconomyState {
  date: string; // YYYY-MM-DD
  totalBurnedSns: number;
  seasonBuybackPoolSns: number;
  activityEarnings: {
    pvp: number;
    mission: number;
    story: number;
    attendance: number;
    market: number;
  };
  caps: {
    pvp: number;
    mission: number;
    story: number;
    attendance: number;
  };
  burnLogs: Array<{
    timestamp: number;
    amount: number;
    source: string;
    txHash: string;
  }>;
}

const STORAGE_KEY = 'hero_platform_token_economy_gate_v1';

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getPlatformTokenEconomyState(): TokenEconomyState {
  const today = getTodayStr();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: TokenEconomyState = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
      // 날짜 변경 시 일일 활동 누적액 리셋 및 누적 소각량 보존
      parsed.date = today;
      parsed.activityEarnings = {
        pvp: 0,
        mission: 0,
        story: 0,
        attendance: 0,
        market: 0,
      };
      savePlatformTokenEconomyState(parsed);
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse token economy state:', e);
  }

  const initial: TokenEconomyState = {
    date: today,
    totalBurnedSns: 0,
    seasonBuybackPoolSns: 0,
    activityEarnings: {
      pvp: 0,
      mission: 0,
      story: 0,
      attendance: 0,
      market: 0,
    },
    caps: {
      pvp: 1000,
      mission: 1500,
      story: 800,
      attendance: 500,
    },
    burnLogs: [],
  };
  savePlatformTokenEconomyState(initial);
  return initial;
}

export function savePlatformTokenEconomyState(state: TokenEconomyState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save token economy state:', e);
  }
}

/**
 * 마켓 거래 수수료 50% 자동 소각 처리
 */
export function processMarketFeeBurn(totalFee: number, cardTitle: string): {
  burnedAmount: number;
  poolAmount: number;
  totalBurnedAllTime: number;
} {
  const state = getPlatformTokenEconomyState();
  const burnedAmount = Math.floor(totalFee * 0.5);
  const poolAmount = totalFee - burnedAmount;

  state.totalBurnedSns += burnedAmount;
  state.seasonBuybackPoolSns += poolAmount;
  state.burnLogs.unshift({
    timestamp: Date.now(),
    amount: burnedAmount,
    source: `Market Trade Fee: ${cardTitle}`,
    txHash: `0x${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16)}`,
  });

  if (state.burnLogs.length > 50) {
    state.burnLogs.pop();
  }

  savePlatformTokenEconomyState(state);
  return {
    burnedAmount,
    poolAmount,
    totalBurnedAllTime: state.totalBurnedSns,
  };
}

/**
 * 활동별(PVP/미션/스토리/출석) 일일 SNS 포인트 정규화 수급 체크 및 승인
 */
export function grantNormalizedActivitySns(
  activity: 'pvp' | 'mission' | 'story' | 'attendance',
  requestedAmount: number
): {
  grantedAmount: number;
  currentTotal: number;
  cap: number;
  isCapped: boolean;
} {
  const state = getPlatformTokenEconomyState();
  const current = state.activityEarnings[activity] || 0;
  const cap = state.caps[activity] || 1000;

  const remaining = Math.max(0, cap - current);
  const granted = Math.min(requestedAmount, remaining);

  state.activityEarnings[activity] = current + granted;
  savePlatformTokenEconomyState(state);

  return {
    grantedAmount: granted,
    currentTotal: state.activityEarnings[activity],
    cap,
    isCapped: granted < requestedAmount,
  };
}
