import { useCallback, useEffect, useState } from 'react';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import { MONSTER_PET_STORAGE_BASE_KEY } from '../lib/monsterPet';

interface MonsterPetStorage {
  representativePetMap: Record<string, number>;
  updatedAt: number;
}

interface UseMonsterPetOptions {
  season: string;
}

interface UseMonsterPetResult {
  getPetIdForRepresentativeCard: (representativeCardId: number | null | undefined) => number | null;
  assignPet: (representativeCardId: number | null | undefined, petCardId: number | null | undefined) => boolean;
  clearPet: (representativeCardId: number | null | undefined) => boolean;
  isPetEquipped: (representativeCardId: number | null | undefined, petCardId: number | null | undefined) => boolean;
}

const createDefaultStorage = (): MonsterPetStorage => ({
  representativePetMap: {},
  updatedAt: Date.now(),
});

const normalizeCardId = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : null;
};

const normalizeStorage = (raw: unknown): MonsterPetStorage => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return createDefaultStorage();
  }

  const representativePetMap = typeof (raw as { representativePetMap?: unknown }).representativePetMap === 'object'
    && (raw as { representativePetMap?: unknown }).representativePetMap !== null
    && !Array.isArray((raw as { representativePetMap?: unknown }).representativePetMap)
    ? Object.entries((raw as { representativePetMap: Record<string, unknown> }).representativePetMap).reduce<Record<string, number>>((acc, [key, value]) => {
        const normalized = normalizeCardId(value);
        if (normalized !== null) {
          acc[key] = normalized;
        }
        return acc;
      }, {})
    : {};

  return {
    representativePetMap,
    updatedAt: typeof (raw as { updatedAt?: unknown }).updatedAt === 'number' && Number.isFinite((raw as { updatedAt?: number }).updatedAt)
      ? (raw as { updatedAt: number }).updatedAt
      : Date.now(),
  };
};

const loadStorage = (season: string): MonsterPetStorage => {
  const raw = getSeasonItem(MONSTER_PET_STORAGE_BASE_KEY, season);
  if (!raw) return createDefaultStorage();

  try {
    return normalizeStorage(JSON.parse(raw) as unknown);
  } catch {
    return createDefaultStorage();
  }
};

const saveStorage = (season: string, storage: MonsterPetStorage): void => {
  setSeasonItem(MONSTER_PET_STORAGE_BASE_KEY, season, JSON.stringify({
    representativePetMap: storage.representativePetMap,
    updatedAt: Date.now(),
  }));
};

export const useMonsterPet = ({ season }: UseMonsterPetOptions): UseMonsterPetResult => {
  const [storage, setStorage] = useState<MonsterPetStorage>(() => loadStorage(season));

  useEffect(() => {
    setStorage(loadStorage(season));
  }, [season]);

  const getPetIdForRepresentativeCard = useCallback((representativeCardId: number | null | undefined): number | null => {
    const normalizedRepresentativeId = normalizeCardId(representativeCardId);
    if (normalizedRepresentativeId === null) return null;
    return storage.representativePetMap[String(normalizedRepresentativeId)] ?? null;
  }, [storage.representativePetMap]);

  const assignPet = useCallback((representativeCardId: number | null | undefined, petCardId: number | null | undefined): boolean => {
    const normalizedRepresentativeId = normalizeCardId(representativeCardId);
    const normalizedPetId = normalizeCardId(petCardId);
    if (normalizedRepresentativeId === null || normalizedPetId === null) {
      return false;
    }

    const nextStorage: MonsterPetStorage = {
      representativePetMap: {
        ...storage.representativePetMap,
        [String(normalizedRepresentativeId)]: normalizedPetId,
      },
      updatedAt: Date.now(),
    };

    setStorage(nextStorage);
    saveStorage(season, nextStorage);
    return true;
  }, [season, storage.representativePetMap]);

  const clearPet = useCallback((representativeCardId: number | null | undefined): boolean => {
    const normalizedRepresentativeId = normalizeCardId(representativeCardId);
    if (normalizedRepresentativeId === null) {
      return false;
    }

    if (!(String(normalizedRepresentativeId) in storage.representativePetMap)) {
      return true;
    }

    const nextMap = { ...storage.representativePetMap };
    delete nextMap[String(normalizedRepresentativeId)];

    const nextStorage: MonsterPetStorage = {
      representativePetMap: nextMap,
      updatedAt: Date.now(),
    };

    setStorage(nextStorage);
    saveStorage(season, nextStorage);
    return true;
  }, [season, storage.representativePetMap]);

  const isPetEquipped = useCallback((representativeCardId: number | null | undefined, petCardId: number | null | undefined): boolean => {
    const normalizedRepresentativeId = normalizeCardId(representativeCardId);
    const normalizedPetId = normalizeCardId(petCardId);
    if (normalizedRepresentativeId === null || normalizedPetId === null) {
      return false;
    }

    return storage.representativePetMap[String(normalizedRepresentativeId)] === normalizedPetId;
  }, [storage.representativePetMap]);

  return {
    getPetIdForRepresentativeCard,
    assignPet,
    clearPet,
    isPetEquipped,
  };
};
