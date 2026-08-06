import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import {
  DAILY_MISSIONS,
  WEEKLY_MISSIONS,
  getSeasonMissions,
  getTodayStr,
  getMondayStr,
  needsDailyReset,
  needsWeeklyReset,
} from '../content/seasonMissions';
import type {
  SeasonMission,
  UserMissionState,
  SeasonMissionsSaveData,
  MissionStatus,
} from '../content/seasonMissions';
import type { InventoryRecord } from '../types';

const STORAGE_KEY = 'hero_season_missions';

/** 기본 저장 데이터 생성 */
function createDefaultSaveData(): SeasonMissionsSaveData {
  return {
    missions: [],
    lastDailyReset: getTodayStr(),
    lastWeeklyReset: getMondayStr(),
  };
}

/** 저장 데이터 불러오기 */
function loadSaveData(season: string): SeasonMissionsSaveData {
  const raw = getSeasonItem(STORAGE_KEY, season);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fall through
    }
  }
  return createDefaultSaveData();
}

/** 저장 */
function saveData(season: string, data: SeasonMissionsSaveData): void {
  setSeasonItem(STORAGE_KEY, season, JSON.stringify(data));
}

/** 특정 미션의 상태 찾기 */
function findMissionState(
  data: SeasonMissionsSaveData,
  missionId: string,
): UserMissionState | undefined {
  return data.missions.find((m) => m.missionId === missionId);
}

/** 미션의 초기 상태 생성 */
function createInitialState(mission: SeasonMission): UserMissionState {
  return {
    missionId: mission.id,
    progress: 0,
    status: 'in_progress' as MissionStatus,
    resetDate: mission.period === 'daily'
      ? getTodayStr()
      : mission.period === 'weekly'
        ? getMondayStr()
        : undefined,
  };
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getCollectedCardCount(season: string): number {
  const sources = [
    parseJson<Record<string, InventoryRecord>>(getSeasonItem('hero_inventory', season)),
    parseJson<Record<string, InventoryRecord>>(getSeasonItem('hero_inventory_guest', season)),
  ];

  const cardIds = new Set<number>();
  for (const source of sources) {
    if (!source) continue;
    for (const [cardId, record] of Object.entries(source)) {
      const quantity = typeof record?.quantity === 'number' ? record.quantity : 0;
      if (quantity > 0) {
        const parsedId = Number(cardId);
        if (Number.isFinite(parsedId)) cardIds.add(parsedId);
      }
    }
  }

  return cardIds.size;
}

function getWebtoonReadCount(season: string): number {
  const progress = parseJson<{ readEpisodeIds?: string[] }>(getSeasonItem('hero_webtoon_progress', season));
  return Array.isArray(progress?.readEpisodeIds) ? progress.readEpisodeIds.length : 0;
}

function getBattleWinCount(): number {
  const history = parseJson<Array<{ result?: string }>>(typeof window !== 'undefined' ? localStorage.getItem('hero_match_history') : null);
  if (!Array.isArray(history)) return 0;
  return history.filter((record) => record?.result === 'win').length;
}

function getMissionTypeProgress(season: string, missionType: SeasonMission['type']): number {
  switch (missionType) {
    case 'collect_card':
      return getCollectedCardCount(season);
    case 'read_webtoon':
      return getWebtoonReadCount(season);
    case 'win_battle':
      return getBattleWinCount();
    default:
      return 0;
  }
}

export interface UseSeasonMissionsReturn {
  /** 모든 미션 (daily + weekly + season) */
  allMissions: SeasonMission[];
  /** 미션별 현재 상태 맵 (missionId -> UserMissionState) */
  missionStates: Record<string, UserMissionState>;
  /** 데일리 미션 */
  dailyMissions: SeasonMission[];
  /** 위클리 미션 */
  weeklyMissions: SeasonMission[];
  /** 시즌 미션 */
  seasonMissions: SeasonMission[];
  /** 완료된 미션 수 */
  completedCount: number;
  /** 수령 완료된 미션 수 */
  claimedCount: number;
  /** 진행률 업데이트 */
  updateProgress: (missionType: SeasonMission['type'], amount?: number) => void;
  /** 완료된 미션 보상 수령 */
  claimReward: (missionId: string) => MissionRewardResult | null;
  /** 특정 미션의 상태 가져오기 */
  getMissionState: (missionId: string) => UserMissionState | undefined;
  /** 수동으로 리셋 체크 */
  checkAndReset: () => void;
}

export interface MissionRewardResult {
  sns: number;
  badgeKey?: string;
  skinUnlockKey?: string;
  webtoonCutUnlock?: string;
  titleKey?: string;
}

export function useSeasonMissions(currentSeason: string): UseSeasonMissionsReturn {
  const missionDataSeasonRef = useRef(currentSeason);
  const [missionData, setMissionData] = useState<SeasonMissionsSaveData>(() =>
    loadSaveData(currentSeason),
  );

  useEffect(() => {
    if (missionDataSeasonRef.current === currentSeason) return;
    missionDataSeasonRef.current = currentSeason;
    setMissionData(loadSaveData(currentSeason));
  }, [currentSeason]);

  // Save whenever data changes
  useEffect(() => {
    if (missionDataSeasonRef.current !== currentSeason) return;
    saveData(currentSeason, missionData);
  }, [missionData, currentSeason]);


  // Build mission state map
  const missionStates = useMemo<Record<string, UserMissionState>>(() => {
    const map: Record<string, UserMissionState> = {};
    for (const state of missionData.missions) {
      map[state.missionId] = state;
    }
    return map;
  }, [missionData.missions]);

  // All missions
  const allMissions = useMemo<SeasonMission[]>(() => {
    return [
      ...DAILY_MISSIONS,
      ...WEEKLY_MISSIONS,
      ...getSeasonMissions(currentSeason),
    ];
  }, [currentSeason]);

  const dailyMissions = useMemo(() => DAILY_MISSIONS, []);
  const weeklyMissions = useMemo(() => WEEKLY_MISSIONS, []);
  const seasonMissions = useMemo(
    () => getSeasonMissions(currentSeason),
    [currentSeason],
  );

  const completedCount = useMemo(
    () =>
      missionData.missions.filter((m) => m.status === 'completed').length,
    [missionData.missions],
  );

  const claimedCount = useMemo(
    () =>
      missionData.missions.filter((m) => m.status === 'claimed').length,
    [missionData.missions],
  );

  /** 데일리/위클리 리셋 */
  const checkAndReset = useCallback(() => {
    setMissionData((prev) => {
      let updated = { ...prev, missions: [...prev.missions] };
      let changed = false;
      const currentMissions = [...DAILY_MISSIONS, ...WEEKLY_MISSIONS, ...getSeasonMissions(currentSeason)];

      // Daily reset
      if (needsDailyReset(prev.lastDailyReset)) {
        updated.lastDailyReset = getTodayStr();
        updated.missions = updated.missions.filter((m) => {
          const mission = currentMissions.find((dm) => dm.id === m.missionId);
          return !mission || mission.period !== 'daily';
        });
        changed = true;
      }

      // Weekly reset
      if (needsWeeklyReset(prev.lastWeeklyReset)) {
        updated.lastWeeklyReset = getMondayStr();
        updated.missions = updated.missions.filter((m) => {
          const mission = currentMissions.find((wm) => wm.id === m.missionId);
          return !mission || mission.period !== 'weekly';
        });
        changed = true;
      }

      return changed ? updated : prev;
    });
  }, [currentSeason]);

  useEffect(() => {
    checkAndReset();
  }, [checkAndReset]);

  /** 미션 진행도 업데이트 */
  const updateProgress = useCallback(
    (missionType: SeasonMission['type'], amount: number = 1) => {
      setMissionData((prev) => {
        const updatedMissions = [...prev.missions];
        let changed = false;

        // Find all in_progress missions of this type
        const matchingMissions = allMissions.filter(
          (m) => m.type === missionType,
        );

        for (const mission of matchingMissions) {
          const existingIdx = updatedMissions.findIndex(
            (um) => um.missionId === mission.id,
          );

          if (existingIdx >= 0) {
            const state = updatedMissions[existingIdx];
            if (state.status === 'in_progress' || state.status === 'locked') {
              const newProgress = Math.min(
                state.progress + amount,
                mission.targetValue,
              );
              updatedMissions[existingIdx] = {
                ...state,
                progress: newProgress,
                status: newProgress >= mission.targetValue ? 'completed' : 'in_progress',
              };
              changed = true;
            }
          } else {
            // Create new state
            const nextState = createInitialState(mission);
            const newProgress = Math.min(amount, mission.targetValue);
            updatedMissions.push({
              ...nextState,
              progress: newProgress,
              status: newProgress >= mission.targetValue ? 'completed' : 'in_progress',
            });
            changed = true;
          }
        }

        return changed
          ? { ...prev, missions: updatedMissions }
          : prev;
      });
    },
    [allMissions],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncDerivedMissionProgress = () => {
      setMissionData((prev) => {
        const nextMissionStates = [...prev.missions];
        let changed = false;

        for (const mission of allMissions) {
          const derivedProgress = getMissionTypeProgress(currentSeason, mission.type);
          if (derivedProgress <= 0) continue;

          const cappedProgress = Math.min(derivedProgress, mission.targetValue);
          const existingIndex = nextMissionStates.findIndex((state) => state.missionId === mission.id);

          if (existingIndex >= 0) {
            const existingState = nextMissionStates[existingIndex];
            if (existingState.status === 'claimed' || existingState.progress >= cappedProgress) {
              continue;
            }

            nextMissionStates[existingIndex] = {
              ...existingState,
              progress: cappedProgress,
              status: cappedProgress >= mission.targetValue ? 'completed' : existingState.status,
            };
            changed = true;
            continue;
          }

          nextMissionStates.push({
            ...createInitialState(mission),
            progress: cappedProgress,
            status: cappedProgress >= mission.targetValue ? 'completed' : 'in_progress',
          });
          changed = true;
        }

        return changed ? { ...prev, missions: nextMissionStates } : prev;
      });
    };

    syncDerivedMissionProgress();
    window.addEventListener('focus', syncDerivedMissionProgress);
    return () => window.removeEventListener('focus', syncDerivedMissionProgress);
  }, [allMissions, currentSeason]);

  const claimReward = useCallback(
    (missionId: string): MissionRewardResult | null => {
      const mission = allMissions.find((m) => m.id === missionId);
      if (!mission) return null;

      let result: MissionRewardResult | null = null;

      setMissionData((prev) => {
        const updatedMissions = [...prev.missions];
        const idx = updatedMissions.findIndex(
          (um) => um.missionId === missionId,
        );

        if (idx < 0) return prev;

        const state = updatedMissions[idx];
        if (state.status !== 'completed') return prev;

        updatedMissions[idx] = {
          ...state,
          status: 'claimed' as MissionStatus,
          claimedAt: Date.now(),
        };

        result = {
          sns: mission.reward.sns,
          badgeKey: mission.reward.badgeKey,
          skinUnlockKey: mission.reward.skinUnlockKey,
          webtoonCutUnlock: mission.reward.webtoonCutUnlock,
          titleKey: mission.reward.titleKey,
        };

        return { ...prev, missions: updatedMissions };
      });

      return result;
    },
    [allMissions],
  );

  /** 특정 미션 상태 조회 */
  const getMissionState = useCallback(
    (missionId: string): UserMissionState | undefined => {
      return missionStates[missionId];
    },
    [missionStates],
  );

  return {
    allMissions,
    missionStates,
    dailyMissions,
    weeklyMissions,
    seasonMissions,
    completedCount,
    claimedCount,
    updateProgress,
    claimReward,
    getMissionState,
    checkAndReset,
  };
}
