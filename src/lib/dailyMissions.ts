export interface MissionState {
  id: string;
  type: string;
  titleKey: string;
  descKey: string;
  target: number;
  current: number;
  snsReward: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
  period?: 'daily' | 'weekly' | 'season';
}

export interface DailyMissionProgress {
  date: string;
  missions: MissionState[];
}

export interface DailyMissionHistoryEntry {
  id: string;
  missionId: string;
  title: string;
  snsReward: number;
  xpReward: number;
  claimedAt: number;
}

export const DAILY_MISSIONS: MissionState[] = [
  { id: 'login', type: 'login', titleKey: 'daily_mission_login_title', descKey: 'daily_mission_login_desc', target: 1, current: 1, snsReward: 30, xpReward: 50, completed: true, claimed: false },
  { id: 'play_game', type: 'play', titleKey: 'daily_mission_play_title', descKey: 'daily_mission_play_desc', target: 3, current: 0, snsReward: 50, xpReward: 100, completed: false, claimed: false },
  { id: 'win_battle', type: 'win', titleKey: 'daily_mission_win_title', descKey: 'daily_mission_win_desc', target: 1, current: 0, snsReward: 40, xpReward: 80, completed: false, claimed: false },
  { id: 'upgrade_card', type: 'upgrade', titleKey: 'daily_mission_upgrade_title', descKey: 'daily_mission_upgrade_desc', target: 1, current: 0, snsReward: 20, xpReward: 40, completed: false, claimed: false },
];

export function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadDailyMissions(): DailyMissionProgress {
  const today = getTodayStr();
  try {
    const raw = localStorage.getItem('hero_daily_missions');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === today && Array.isArray(data.missions)) {
        return data;
      }
    }
  } catch {}
  return { date: today, missions: DAILY_MISSIONS };
}

export function saveDailyMissions(data: DailyMissionProgress): void {
  try {
    localStorage.setItem('hero_daily_missions', JSON.stringify(data));
  } catch {}
}

export function getClaimableCount(data?: DailyMissionProgress): number {
  const progress = data || loadDailyMissions();
  return progress.missions.filter(m => m.completed && !m.claimed).length;
}

export function hasUnfinishedMissions(data?: DailyMissionProgress): boolean {
  const progress = data || loadDailyMissions();
  return progress.missions.some(m => !m.completed);
}

export function getClaimableRewardTotal(data?: DailyMissionProgress): { sns: number; xp: number } {
  const progress = data || loadDailyMissions();
  return progress.missions
    .filter(m => m.completed && !m.claimed)
    .reduce((acc, m) => ({ sns: acc.sns + m.snsReward, xp: acc.xp + m.xpReward }), { sns: 0, xp: 0 });
}

export function getDailyMissionRewardTotal(data?: DailyMissionProgress): { sns: number; xp: number } {
  const progress = data || loadDailyMissions();
  return progress.missions.reduce((acc, m) => ({ sns: acc.sns + m.snsReward, xp: acc.xp + m.xpReward }), { sns: 0, xp: 0 });
}

export function claimMissionReward(id: string): { success: boolean; reward?: { sns: number; xp: number } } {
  const data = loadDailyMissions();
  const mission = data.missions.find(m => m.id === id);
  if (!mission || !mission.completed || mission.claimed) return { success: false };
  mission.claimed = true;
  saveDailyMissions(data);
  return { success: true, reward: { sns: mission.snsReward, xp: mission.xpReward } };
}

export function claimAllDailyMissions(): { claimedCount: number; reward: { sns: number; xp: number } } {
  const data = loadDailyMissions();
  let count = 0;
  let totalSns = 0;
  let totalXp = 0;
  data.missions.forEach(m => {
    if (m.completed && !m.claimed) {
      m.claimed = true;
      count++;
      totalSns += m.snsReward;
      totalXp += m.xpReward;
    }
  });
  if (count > 0) saveDailyMissions(data);
  return { claimedCount: count, reward: { sns: totalSns, xp: totalXp } };
}

export function incrementMissionProgress(type: string, amount: number = 1): void {
  const data = loadDailyMissions();
  let updated = false;
  data.missions.forEach(m => {
    if (m.type === type && !m.completed) {
      m.current = Math.min(m.target, m.current + amount);
      if (m.current >= m.target) m.completed = true;
      updated = true;
    }
  });
  if (updated) saveDailyMissions(data);
}

export function loadDailyMissionHistory(): DailyMissionHistoryEntry[] {
  try {
    const raw = localStorage.getItem('hero_daily_missions_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearDailyMissionHistory(): void {
  try {
    localStorage.removeItem('hero_daily_missions_history');
  } catch {}
}

export function getMissionHistoryStats(): { totalSns: number; totalXp: number; count: number } {
  const history = loadDailyMissionHistory();
  return history.reduce((acc, h) => ({
    totalSns: acc.totalSns + h.snsReward,
    totalXp: acc.totalXp + h.xpReward,
    count: acc.count + 1
  }), { totalSns: 0, totalXp: 0, count: 0 });
}
