/**
 * 일일 미션 시스템 (Daily Missions)
 * 
 * 매일 자정 리셋되는 일일 미션. localStorage에 진행도를 저장하며,
 * 미니게임/전투 완료 시 progress를 업데이트하고 달성 시 보상을 지급한다.
 */

import { addNotification } from './notificationHelper';

export interface DailyMission {
  id: string;
  type: 'play_ai_battle' | 'play_minigame' | 'score_snake' | 'score_2048' | 'win_ai_battle' | 'collect_cards' | 'earn_sns' | 'play_pvp_battle';
  title_ko: string;
  title_en: string;
  target: number;
  reward_sns: number;
  reward_xp: number;
}

export interface MissionState {
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyMissionProgress {
  date: string; // YYYY-MM-DD
  missions: Record<string, MissionState>;
}

const STORAGE_KEY = 'hero_daily_missions';

/** 오늘 날짜 문자열 (YYYY-MM-DD, 로컬 타임존) */
export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 일일 미션 정의 */
export const DAILY_MISSIONS: DailyMission[] = [
  {
    id: 'ai_battle_1',
    type: 'play_ai_battle',
    title_ko: 'AI 대전 1회 플레이',
    title_en: 'Play 1 AI Battle',
    target: 1,
    reward_sns: 50,
    reward_xp: 25,
  },
  {
    id: 'win_ai_battle_3',
    type: 'win_ai_battle',
    title_ko: 'AI 대전 3회 승리',
    title_en: 'Win 3 AI Battles',
    target: 3,
    reward_sns: 150,
    reward_xp: 75,
  },
  {
    id: 'collect_cards_5',
    type: 'collect_cards',
    title_ko: '카드 5장 수집',
    title_en: 'Collect 5 Cards',
    target: 5,
    reward_sns: 120,
    reward_xp: 60,
  },
  {
    id: 'earn_sns_500',
    type: 'earn_sns',
    title_ko: '500 SNS 포인트 획득',
    title_en: 'Earn 500 SNS Points',
    target: 500,
    reward_sns: 100,
    reward_xp: 50,
  },
  {
    id: 'minigame_3',
    type: 'play_minigame',
    title_ko: '미니게임 3회 플레이',
    title_en: 'Play 3 Minigames',
    target: 3,
    reward_sns: 80,
    reward_xp: 40,
  },
  {
    id: 'pvp_battle_1',
    type: 'play_pvp_battle',
    title_ko: 'PVP 대전 1회 플레이',
    title_en: 'Play 1 PVP Battle',
    target: 1,
    reward_sns: 100,
    reward_xp: 50,
  },
];

/** 저장된 미션 진행도를 불러온다. 날짜가 바뀌었으면 초기화. */
export function loadDailyMissions(): DailyMissionProgress {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const today = getTodayStr();
    if (saved) {
      const data: DailyMissionProgress = JSON.parse(saved);
      // 날짜가 바뀌었으면 초기화
      if (data.date === today) {
        // 새로 추가된 미션 키가 없으면 채워 넣음
        DAILY_MISSIONS.forEach(m => {
          if (!data.missions[m.id]) {
            data.missions[m.id] = { progress: 0, completed: false, claimed: false };
          }
        });
        return data;
      }
    }
  } catch (e) {
    // 저장 데이터 파손 시 초기화
  }
  return createFreshMissions();
}

/** 새 미션 진행도 생성 */
function createFreshMissions(): DailyMissionProgress {
  const missions: Record<string, MissionState> = {};
  DAILY_MISSIONS.forEach(m => {
    missions[m.id] = { progress: 0, completed: false, claimed: false };
  });
  return { date: getTodayStr(), missions };
}

/** 미션 진행도 저장 */
export function saveDailyMissions(data: DailyMissionProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hero_daily_missions_updated'));
    }
  } catch (e) {
    // 저장 실패는 무시 (스토리지 꽉 참 등)
  }
}

/** 특정 타입의 미션 진행도를 증가시킨다. 완료 여부도 갱신. */
export function incrementMissionProgress(
  type: DailyMission['type'],
  amount: number = 1,
  scoreValue?: number
): DailyMissionProgress {
  const data = loadDailyMissions();
  let changed = false;

  DAILY_MISSIONS.forEach(mission => {
    if (mission.type !== type) return;
    const state = data.missions[mission.id];
    if (!state || state.claimed) return; // 이미 보상 수령 완료

    let newProgress = state.progress;
    if (type === 'score_snake' || type === 'score_2048') {
      // 점수형 미션: 최고 점수만 기록
      if (scoreValue !== undefined && scoreValue > newProgress) {
        newProgress = scoreValue;
      }
    } else {
      // 카운트형 미션: 누적
      newProgress = Math.min(state.progress + amount, mission.target);
    }

    if (newProgress !== state.progress) {
      data.missions[mission.id] = { ...state, progress: newProgress };
      changed = true;
    }

    // 목표 달성 체크 (100% 달성 시)
    if (newProgress >= mission.target && !data.missions[mission.id].completed) {
      data.missions[mission.id] = { ...data.missions[mission.id], completed: true };
      changed = true;

      addNotification({
        category: 'reward',
        title: `일일 미션 달성: ${mission.title_ko}`,
        message: `[${mission.title_ko}] 미션을 달성하였습니다! 보상 받기 버튼을 눌러 보상을 수령하세요. (+${mission.reward_sns} SNS)`,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hero_daily_mission_completed', {
          detail: {
            id: mission.id,
            title_ko: mission.title_ko,
            title_en: mission.title_en,
            reward_sns: mission.reward_sns,
            reward_xp: mission.reward_xp,
          }
        }));
      }
    }
  });

  if (changed) saveDailyMissions(data);
  return data;
}

/** 보상 수령 처리 — 수령 가능한 미션이 있으면 보상 반환, 없으면 null */
export function claimMissionReward(
  missionId: string
): { sns: number; xp: number; title_ko: string; title_en: string } | null {
  const data = loadDailyMissions();
  const mission = DAILY_MISSIONS.find(m => m.id === missionId);
  if (!mission) return null;

  const state = data.missions[missionId];
  if (!state || (!state.completed && state.progress < mission.target) || state.claimed) return null;

  // 보상 수령 마킹
  data.missions[missionId] = { ...state, completed: true, claimed: true };
  saveDailyMissions(data);

  // 수행 기록 추가
  addMissionHistoryEntry({
    missionId: mission.id,
    title_ko: mission.title_ko,
    title_en: mission.title_en,
    reward_sns: mission.reward_sns,
    reward_xp: mission.reward_xp,
    claimedAt: new Date().toISOString(),
    date: data.date || getTodayStr(),
  });

  return {
    sns: mission.reward_sns,
    xp: mission.reward_xp,
    title_ko: mission.title_ko,
    title_en: mission.title_en,
  };
}

export interface DailyMissionHistoryEntry {
  id: string;
  missionId: string;
  title_ko: string;
  title_en: string;
  reward_sns: number;
  reward_xp: number;
  claimedAt: string;
  date: string;
}

const HISTORY_STORAGE_KEY = 'hero_daily_missions_history';

export function loadDailyMissionHistory(): DailyMissionHistoryEntry[] {
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export function saveDailyMissionHistory(history: DailyMissionHistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hero_daily_missions_history_updated'));
    }
  } catch (e) {
    // ignore
  }
}

export function addMissionHistoryEntry(entry: Omit<DailyMissionHistoryEntry, 'id'>): DailyMissionHistoryEntry {
  const history = loadDailyMissionHistory();
  const newEntry: DailyMissionHistoryEntry = {
    ...entry,
    id: `mhist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  };
  const updated = [newEntry, ...history].slice(0, 100);
  saveDailyMissionHistory(updated);
  return newEntry;
}

export function clearDailyMissionHistory(): void {
  saveDailyMissionHistory([]);
}

export function getMissionHistoryStats(): { totalSns: number; totalXp: number; totalCompleted: number } {
  const history = loadDailyMissionHistory();
  return history.reduce((acc, curr) => ({
    totalSns: acc.totalSns + (curr.reward_sns || 0),
    totalXp: acc.totalXp + (curr.reward_xp || 0),
    totalCompleted: acc.totalCompleted + 1,
  }), { totalSns: 0, totalXp: 0, totalCompleted: 0 });
}

/** 완료되었지만 아직 수령 안 한 미션 개수 */
export function getClaimableCount(): number {
  const data = loadDailyMissions();
  let count = 0;
  Object.values(data.missions).forEach(s => {
    if (s.completed && !s.claimed) count++;
  });
  return count;
}

/** 완료되었지만 아직 수령 안 한 미션의 총 SNS 보상 */
export function getClaimableRewardTotal(): number {
  const data = loadDailyMissions();

  return DAILY_MISSIONS.reduce((total, mission) => {
    const state = data.missions[mission.id];
    if (!state || !state.completed || state.claimed) {
      return total;
    }

    return total + mission.reward_sns;
  }, 0);
}

/** 하루 기준 전체 일일 미션 SNS 총량 */
export function getDailyMissionRewardTotal(): number {
  return DAILY_MISSIONS.reduce((total, mission) => total + mission.reward_sns, 0);
}

/** 오늘 미션 전체 완료 여부 */
export function isAllMissionsClaimed(): boolean {
  const data = loadDailyMissions();
  return Object.values(data.missions).every(s => s.claimed);
}

/** 아직 완료/수령하지 않은 미션이 있는지 여부 (플레이 유도용) */
export function hasUnfinishedMissions(): boolean {
  const data = loadDailyMissions();
  return Object.values(data.missions).some(s => !s.claimed);
}

