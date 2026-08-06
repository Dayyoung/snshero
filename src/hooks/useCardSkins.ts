import { useState, useCallback, useEffect, useRef } from 'react';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import { ALL_CARD_SKINS, getSkinsForCard, getCardSkinByKey, type CardSkin } from '../content/cardSkins';

const SKINS_STORAGE_KEY = 'hero_card_skins';

/** 카드 스킨 상태 */
export interface CardSkinState {
  /** 보유한 스킨 키 목록 */
  unlockedSkinKeys: string[];
  /** 현재 장착 중인 스킨 (카드 ID → 스킨 키) */
  activeSkinMap: Record<number, string>;
}

function getDefaultUnlockedSkinKeys(season: string): string[] {
  return (ALL_CARD_SKINS[season] ?? [])
    .filter((skin) => skin.unlockType === 'default')
    .map((skin) => skin.skinKey);
}

function normalizeSkinState(season: string, parsed: Partial<CardSkinState> | null | undefined): CardSkinState {
  const seasonSkins = ALL_CARD_SKINS[season] ?? [];
  const seasonSkinMap = new Map(seasonSkins.map((skin) => [skin.skinKey, skin]));
  const defaultUnlockedSkinKeys = getDefaultUnlockedSkinKeys(season);
  const unlockedSkinKeys = Array.from(new Set([
    ...defaultUnlockedSkinKeys,
    ...(Array.isArray(parsed?.unlockedSkinKeys) ? parsed.unlockedSkinKeys : []),
  ])).filter((skinKey) => seasonSkinMap.has(skinKey));

  const activeSkinEntries = Object.entries(parsed?.activeSkinMap ?? {}).filter(([cardId, skinKey]) => {
    if (typeof skinKey !== 'string') return false;
    const skin = seasonSkinMap.get(skinKey);
    if (!skin) return false;
    return skin.cardId === Number(cardId) && unlockedSkinKeys.includes(skinKey);
  });

  return {
    unlockedSkinKeys,
    activeSkinMap: Object.fromEntries(activeSkinEntries),
  };
}

function loadSkinState(season: string): CardSkinState {
  const raw = getSeasonItem(SKINS_STORAGE_KEY, season);
  if (raw) {
    try {
      return normalizeSkinState(season, JSON.parse(raw) as Partial<CardSkinState>);
    } catch {
      // fall through
    }
  }
  return normalizeSkinState(season, null);
}

function saveSkinState(season: string, state: CardSkinState): void {
  setSeasonItem(SKINS_STORAGE_KEY, season, JSON.stringify(state));
}

export interface UseCardSkinsReturn {
  /** 보유한 스킨 키 목록 */
  unlockedSkinKeys: string[];
  /** 현재 장착 중인 스킨 맵 (cardId → skinKey) */
  activeSkinMap: Record<number, string>;
  /** 특정 카드의 현재 적용된 스킨 */
  getActiveSkin: (cardId: number) => CardSkin | undefined;
  /** 특정 카드의 사용 가능한 모든 스킨 */
  getAvailableSkins: (cardId: number) => CardSkin[];
  /** 스킨 보유 여부 */
  isSkinUnlocked: (skinKey: string) => boolean;
  /** 스킨 장착 */
  applySkin: (cardId: number, skinKey: string) => void;
  /** 스킨 해제 */
  removeSkin: (cardId: number) => void;
  /** 스킨 획득 (치트/디버그용) */
  unlockSkin: (skinKey: string) => boolean;
  /** 스킨 적용 여부 확인 */
  isSkinActive: (cardId: number, skinKey: string) => boolean;
}

export function useCardSkins(season: string): UseCardSkinsReturn {
  const seasonRef = useRef(season);
  const [state, setState] = useState<CardSkinState>(() => loadSkinState(season));

  useEffect(() => {
    if (seasonRef.current === season) return;
    seasonRef.current = season;
    setState(loadSkinState(season));
  }, [season]);

  useEffect(() => {
    if (seasonRef.current !== season) return;
    saveSkinState(season, state);
  }, [state, season]);

  const getActiveSkin = useCallback(
    (cardId: number): CardSkin | undefined => {
      const skinKey = state.activeSkinMap[cardId];
      if (!skinKey) return undefined;
      return getCardSkinByKey(skinKey);
    },
    [state.activeSkinMap],
  );

  const getAvailableSkins = useCallback(
    (cardId: number): CardSkin[] => {
      return getSkinsForCard(cardId, season);
    },
    [season],
  );

  const isSkinUnlocked = useCallback(
    (skinKey: string): boolean => {
      return state.unlockedSkinKeys.includes(skinKey);
    },
    [state.unlockedSkinKeys],
  );

  const applySkin = useCallback(
    (cardId: number, skinKey: string) => {
      setState((prev) => {
        const skin = getCardSkinByKey(skinKey);
        if (!skin || skin.season !== season || skin.cardId !== cardId) return prev;
        if (!prev.unlockedSkinKeys.includes(skinKey) && skin.unlockType !== 'default') return prev;
        return {
          ...prev,
          activeSkinMap: { ...prev.activeSkinMap, [cardId]: skinKey },
        };
      });
    },
    [season],
  );

  const removeSkin = useCallback(
    (cardId: number) => {
      setState((prev) => {
        const next = { ...prev.activeSkinMap };
        delete next[cardId];
        return { ...prev, activeSkinMap: next };
      });
    },
    [],
  );

  const unlockSkin = useCallback(
    (skinKey: string): boolean => {
      const skin = getCardSkinByKey(skinKey);
      if (!skin || skin.season !== season) return false;
      if (state.unlockedSkinKeys.includes(skinKey)) return false;
      setState((prev) => ({
        ...prev,
        unlockedSkinKeys: [...prev.unlockedSkinKeys, skinKey],
      }));
      return true;
    },
    [season, state.unlockedSkinKeys],
  );

  const isSkinActive = useCallback(
    (cardId: number, skinKey: string): boolean => {
      return state.activeSkinMap[cardId] === skinKey;
    },
    [state.activeSkinMap],
  );

  return {
    unlockedSkinKeys: state.unlockedSkinKeys,
    activeSkinMap: state.activeSkinMap,
    getActiveSkin,
    getAvailableSkins,
    isSkinUnlocked,
    applySkin,
    removeSkin,
    unlockSkin,
    isSkinActive,
  };
}
