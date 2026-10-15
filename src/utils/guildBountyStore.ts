export interface GuildBounty {
  id: string;
  titleKo: string;
  titleEn: string;
  descriptionKo: string;
  targetCount: number;
  currentCount: number;
  rewardGold: number;
  rewardExp: number;
  isClaimed: boolean;
}

export interface GuildBountyState {
  lastUpdatedDate: string; // YYYY-MM-DD
  bounties: GuildBounty[];
  weeklySeals: number; // 0 to 7
  weeklyRaidUnlocked: boolean;
  weeklyRaidCleared: boolean;
}

const STORAGE_KEY = 'snshero_guild_bounties';

const getTodayDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const INITIAL_BOUNTIES: GuildBounty[] = [
  {
    id: 'bounty_battle_win',
    titleKo: '설원 전선 사수 (배틀 2승)',
    titleEn: 'Defend Snow Frontline (Win 2 Battles)',
    descriptionKo: '3x3 카드 배틀 또는 아레나에서 2회 승리하십시오.',
    targetCount: 2,
    currentCount: 0,
    rewardGold: 300,
    rewardExp: 50,
    isClaimed: false,
  },
  {
    id: 'bounty_minigame_play',
    titleKo: '기사단 전술 기동 (미니게임 1회)',
    titleEn: 'Tactical Maneuver (Play 1 Minigame)',
    descriptionKo: '110종 미니게임 중 1종을 플레이하여 전술 AP를 획득하십시오.',
    targetCount: 1,
    currentCount: 0,
    rewardGold: 200,
    rewardExp: 30,
    isClaimed: false,
  },
  {
    id: 'bounty_card_enhance',
    titleKo: '무구 룬 제련 (카드 강화 1회)',
    titleEn: 'Rune Forging (Enhance 1 Card)',
    descriptionKo: '덱 빌더에서 보유 카드의 잠재력을 1회 강화하십시오.',
    targetCount: 1,
    currentCount: 0,
    rewardGold: 250,
    rewardExp: 40,
    isClaimed: false,
  },
];

export const getGuildBountyState = (): GuildBountyState => {
  const today = getTodayDateString();
  if (typeof window === 'undefined') {
    return {
      lastUpdatedDate: today,
      bounties: INITIAL_BOUNTIES,
      weeklySeals: 0,
      weeklyRaidUnlocked: false,
      weeklyRaidCleared: false,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: GuildBountyState = {
        lastUpdatedDate: today,
        bounties: INITIAL_BOUNTIES,
        weeklySeals: 1,
        weeklyRaidUnlocked: false,
        weeklyRaidCleared: false,
      };
      saveGuildBountyState(initial);
      return initial;
    }

    const parsed: GuildBountyState = JSON.parse(raw);
    // If date changed, reset daily bounties but keep weeklySeals
    if (parsed.lastUpdatedDate !== today) {
      const resetBounties: GuildBountyState = {
        ...parsed,
        lastUpdatedDate: today,
        bounties: INITIAL_BOUNTIES,
      };
      saveGuildBountyState(resetBounties);
      return resetBounties;
    }

    return parsed;
  } catch {
    return {
      lastUpdatedDate: today,
      bounties: INITIAL_BOUNTIES,
      weeklySeals: 0,
      weeklyRaidUnlocked: false,
      weeklyRaidCleared: false,
    };
  }
};

export const saveGuildBountyState = (state: GuildBountyState): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('snshero_guild_bounties_updated', { detail: state }));
  } catch {
    // ignore
  }
};

export const incrementBountyProgress = (bountyId: string, amount: number = 1): GuildBountyState => {
  const current = getGuildBountyState();
  const updatedBounties = current.bounties.map((b) => {
    if (b.id === bountyId) {
      return {
        ...b,
        currentCount: Math.min(b.targetCount, b.currentCount + amount),
      };
    }
    return b;
  });

  const updated: GuildBountyState = {
    ...current,
    bounties: updatedBounties,
  };

  saveGuildBountyState(updated);
  return updated;
};

export const claimBountyReward = (bountyId: string): { success: boolean; rewardGold: number; state: GuildBountyState } => {
  const current = getGuildBountyState();
  let rewardGold = 0;
  let success = false;

  const updatedBounties = current.bounties.map((b) => {
    if (b.id === bountyId && b.currentCount >= b.targetCount && !b.isClaimed) {
      rewardGold = b.rewardGold;
      success = true;
      return { ...b, isClaimed: true };
    }
    return b;
  });

  if (!success) {
    return { success: false, rewardGold: 0, state: current };
  }

  // Check if all 3 bounties are claimed -> grant 1 weekly seal
  const allClaimed = updatedBounties.every((b) => b.isClaimed);
  let newWeeklySeals = current.weeklySeals;
  let newWeeklyRaidUnlocked = current.weeklyRaidUnlocked;

  if (allClaimed && current.bounties.some((b) => !b.isClaimed)) {
    newWeeklySeals = Math.min(7, current.weeklySeals + 1);
    if (newWeeklySeals >= 5) {
      newWeeklyRaidUnlocked = true;
    }
  }

  const updated: GuildBountyState = {
    ...current,
    bounties: updatedBounties,
    weeklySeals: newWeeklySeals,
    weeklyRaidUnlocked: newWeeklyRaidUnlocked,
  };

  saveGuildBountyState(updated);
  return { success: true, rewardGold, state: updated };
};

export const clearWeeklyRaidBoss = (): { success: boolean; state: GuildBountyState } => {
  const current = getGuildBountyState();
  if (!current.weeklyRaidUnlocked || current.weeklyRaidCleared) {
    return { success: false, state: current };
  }

  const updated: GuildBountyState = {
    ...current,
    weeklyRaidCleared: true,
  };

  saveGuildBountyState(updated);
  return { success: true, state: updated };
};
