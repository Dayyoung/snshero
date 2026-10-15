/**
 * guildRankStore.ts
 * 모험가 길드 명예 칭호 계급장 승급 의식 및 주간 랭킹 정산 리텐션 퍼널 스토어 (RSI-025)
 * 로컬스토리지 기반 길드 계급, 명예 포인트, 주간 정산 배당금 영속화
 */

export type GuildRankTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'MITHRIL' | 'ORICHALCUM';

export interface GuildRankInfo {
  tier: GuildRankTier;
  titleKo: string;
  titleEn: string;
  minPoints: number;
  weeklyDividendSns: number;
  bonusAtkPct: number;
  badgeLabel: string;
}

export const GUILD_RANKS: Record<GuildRankTier, GuildRankInfo> = {
  BRONZE: {
    tier: 'BRONZE',
    titleKo: '견습 모험가 (Bronze)',
    titleEn: 'Apprentice Adventurer',
    minPoints: 0,
    weeklyDividendSns: 100,
    bonusAtkPct: 0,
    badgeLabel: 'BRONZE'
  },
  SILVER: {
    tier: 'SILVER',
    titleKo: '숙련 용병 (Silver)',
    titleEn: 'Seasoned Mercenary',
    minPoints: 500,
    weeklyDividendSns: 300,
    bonusAtkPct: 3,
    badgeLabel: 'SILVER'
  },
  GOLD: {
    tier: 'GOLD',
    titleKo: '기사단 정예 (Gold)',
    titleEn: 'Knight Elite',
    minPoints: 1500,
    weeklyDividendSns: 800,
    bonusAtkPct: 7,
    badgeLabel: 'GOLD'
  },
  MITHRIL: {
    tier: 'MITHRIL',
    titleKo: '미스릴 수호자 (Mithril)',
    titleEn: 'Mithril Guardian',
    minPoints: 3500,
    weeklyDividendSns: 2000,
    bonusAtkPct: 12,
    badgeLabel: 'MITHRIL'
  },
  ORICHALCUM: {
    tier: 'ORICHALCUM',
    titleKo: '전설의 영웅 (Orichalcum)',
    titleEn: 'Legendary Sovereign',
    minPoints: 7000,
    weeklyDividendSns: 5000,
    bonusAtkPct: 20,
    badgeLabel: 'ORICHALCUM'
  }
};

export interface GuildMemberRankState {
  currentTier: GuildRankTier;
  honorPoints: number;
  lastSettledWeek: string; // YYYY-WW
  pendingPromotion: boolean;
  unclaimedDividend: number;
}

const STORAGE_KEY = 'hero_guild_member_rank';

const getWeekIdentifier = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
};

export function getGuildMemberRank(): GuildMemberRankState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultState: GuildMemberRankState = {
        currentTier: 'BRONZE',
        honorPoints: 350,
        lastSettledWeek: getWeekIdentifier(),
        pendingPromotion: false,
        unclaimedDividend: 0
      };
      saveGuildMemberRank(defaultState);
      return defaultState;
    }
    const parsed: GuildMemberRankState = JSON.parse(raw);

    // 주간 정산 체크: 이전 주차인 경우 배당금 자동 적립
    const currentWeek = getWeekIdentifier();
    if (parsed.lastSettledWeek !== currentWeek) {
      const rankInfo = GUILD_RANKS[parsed.currentTier];
      parsed.unclaimedDividend += rankInfo.weeklyDividendSns;
      parsed.lastSettledWeek = currentWeek;
      saveGuildMemberRank(parsed);
    }

    return parsed;
  } catch {
    return {
      currentTier: 'BRONZE',
      honorPoints: 350,
      lastSettledWeek: getWeekIdentifier(),
      pendingPromotion: false,
      unclaimedDividend: 0
    };
  }
}

export function saveGuildMemberRank(state: GuildMemberRankState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('snshero_guild_rank_updated', { detail: state }));
    }
  } catch {}
}

export function addHonorPoints(points: number): { state: GuildMemberRankState; canPromote: boolean } {
  const current = getGuildMemberRank();
  current.honorPoints += points;

  // 다음 계급 체크
  const tiers: GuildRankTier[] = ['BRONZE', 'SILVER', 'GOLD', 'MITHRIL', 'ORICHALCUM'];
  const currentIndex = tiers.indexOf(current.currentTier);
  let canPromote = false;

  if (currentIndex < tiers.length - 1) {
    const nextTier = tiers[currentIndex + 1];
    if (current.honorPoints >= GUILD_RANKS[nextTier].minPoints) {
      current.pendingPromotion = true;
      canPromote = true;
    }
  }

  saveGuildMemberRank(current);
  return { state: current, canPromote };
}

export function executePromotion(): { success: boolean; newTier?: GuildRankTier; rewardSns?: number } {
  const current = getGuildMemberRank();
  const tiers: GuildRankTier[] = ['BRONZE', 'SILVER', 'GOLD', 'MITHRIL', 'ORICHALCUM'];
  const currentIndex = tiers.indexOf(current.currentTier);

  if (currentIndex >= tiers.length - 1) return { success: false };

  const nextTier = tiers[currentIndex + 1];
  if (current.honorPoints >= GUILD_RANKS[nextTier].minPoints) {
    current.currentTier = nextTier;
    current.pendingPromotion = false;
    const bonusSns = GUILD_RANKS[nextTier].weeklyDividendSns;
    current.unclaimedDividend += bonusSns;
    saveGuildMemberRank(current);
    return { success: true, newTier: nextTier, rewardSns: bonusSns };
  }

  return { success: false };
}

export function claimWeeklyDividend(): number {
  const current = getGuildMemberRank();
  const amount = current.unclaimedDividend;
  if (amount > 0) {
    current.unclaimedDividend = 0;
    saveGuildMemberRank(current);
  }
  return amount;
}
