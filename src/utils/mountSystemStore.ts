// Mount System Store (RSI-022: Crimson Mane Taming & Mount Binding)

export interface MountData {
  id: string;
  nameKo: string;
  nameEn: string;
  speedBonus: number;
  initiativeBonus: number; // +1 to start first in 3x3 battle
  descriptionKo: string;
  descriptionEn: string;
  unlockedAt?: number;
}

export const CRIMSON_MANE_MOUNT: MountData = {
  id: 'mount_crimson_mane',
  nameKo: '전설의 명마 적갈마',
  nameEn: 'Crimson Mane Courser',
  speedBonus: 25,
  initiativeBonus: 1, // 3x3 배틀 선공권 부여
  descriptionKo: '소설 8화 [적갈기의 기수]에서 주인공 카단이 설원의 질풍을 뚫고 길들인 전설의 명마.',
  descriptionEn: 'The legendary frost steed tamed by Kadan across the frozen winds in Novel Episode 8.',
};

const STORAGE_MOUNTS_KEY = 'snshero_unlocked_mounts';
const STORAGE_EQUIPPED_MOUNT_KEY = 'snshero_equipped_mount_id';

export const getUnlockedMounts = (): MountData[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_MOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isMountUnlocked = (mountId: string): boolean => {
  const mounts = getUnlockedMounts();
  return mounts.some((m) => m.id === mountId);
};

export const unlockMount = (mount: MountData): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const mounts = getUnlockedMounts();
    if (mounts.some((m) => m.id === mount.id)) return false;
    const updated = [...mounts, { ...mount, unlockedAt: Date.now() }];
    localStorage.setItem(STORAGE_MOUNTS_KEY, JSON.stringify(updated));
    // Auto equip if none equipped
    const equipped = localStorage.getItem(STORAGE_EQUIPPED_MOUNT_KEY);
    if (!equipped) {
      localStorage.setItem(STORAGE_EQUIPPED_MOUNT_KEY, mount.id);
    }
    window.dispatchEvent(new CustomEvent('snshero_mounts_updated', { detail: updated }));
    return true;
  } catch {
    return false;
  }
};

export const getEquippedMountId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_EQUIPPED_MOUNT_KEY);
};

export const equipMount = (mountId: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_EQUIPPED_MOUNT_KEY, mountId);
  window.dispatchEvent(new CustomEvent('snshero_mounts_updated'));
};
