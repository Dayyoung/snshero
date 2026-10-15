/**
 * 눈히어로 판타지 대서사시 서약 & 영웅 영입 스토어 (loreRecruitmentStore.ts)
 * 소설/웹툰 본문의 고대 유물 서약 단서를 수집하여 카단 연대기의 핵심 영웅을 영입하는 시스템
 */

export interface LoreClue {
  id: string;
  keyword: string;
  title: string;
  category: 'novel' | 'wiki' | 'news';
  secretBrief: string;
  relatedHeroId: number;
  relatedHeroName: string;
}

export const TACTICAL_LORE_CLUES: LoreClue[] = [
  {
    id: 'clue_herkul_rune_dagger',
    keyword: '은빛 단검',
    title: '성기사단 순례자 헤르쿨의 룬 단검',
    category: 'novel',
    secretBrief: '헤르쿨이 어린 카단과 이그니스에게 남긴 은빛 단검. 손잡이 안쪽에 진실을 가리키는 고대 성기사단의 룬이 새겨져 있습니다.',
    relatedHeroId: 41,
    relatedHeroName: '카단 (Kadan)',
  },
  {
    id: 'clue_alexandar_sheath',
    keyword: '알렉산다르',
    title: '선술집 다리를 지킨 알렉산다르의 부러진 검집',
    category: 'novel',
    secretBrief: '엘윈 마을 다리 위에서 끝까지 피난민들을 지켜낸 쌍검사 알렉산다르의 마지막 유품. 눈 아래 묻힌 희망의 밀 씨앗과 함께 전해집니다.',
    relatedHeroId: 50,
    relatedHeroName: '알렉산다르 (Alexandar)',
  },
  {
    id: 'clue_valian_arcane_spear',
    keyword: '발리안',
    title: '성기사 발리안의 아케인 창 파편',
    category: 'novel',
    secretBrief: '눈보라 속 늑대의 눈을 꿰뚫던 아케인 창. 발리안의 의지는 훗날 아들 이그니스의 화염 마나로 계승됩니다.',
    relatedHeroId: 43,
    relatedHeroName: '발리안 (Valian)',
  },
  {
    id: 'clue_ignis_flame_core',
    keyword: '이그니스',
    title: '엘윈 설원에 피어난 화염핵',
    category: 'wiki',
    secretBrief: '눈보라 속에서도 꺼지지 않는 진실의 불길. 이그니스가 다루는 정령 화염의 근원입니다.',
    relatedHeroId: 11,
    relatedHeroName: '이그니스 (Ignis)',
  },
  {
    id: 'clue_cilia_barrier',
    keyword: '실리아',
    title: '상냥한 치유사 실리아의 수호 로켓',
    category: 'news',
    secretBrief: '동료들의 상처를 보듬고 혹한의 냉기를 차단하는 수호 마법이 깃든 은제 펜던트.',
    relatedHeroId: 62,
    relatedHeroName: '실리아 (Cilia)',
  },
];

const STORAGE_KEY_CLUES = 'snshero_lore_clues';
const STORAGE_KEY_CLAIMED_HEROES = 'snshero_lore_claimed_heroes';

export function getCollectedClueIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLUES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isClueCollected(clueId: string): boolean {
  const list = getCollectedClueIds();
  return list.includes(clueId);
}

export function collectClue(clueId: string): {
  isNew: boolean;
  totalCollected: number;
  isUnlocked: boolean;
  unlockedHeroId: number;
} {
  const current = getCollectedClueIds();
  let isNew = false;
  if (!current.includes(clueId)) {
    current.push(clueId);
    isNew = true;
    try {
      localStorage.setItem(STORAGE_KEY_CLUES, JSON.stringify(current));
    } catch {
      // quota safeguard
    }
    // GA4 이벤트
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'lore_clue_collected', {
        clue_id: clueId,
        total_collected: current.length,
      });
    }
  }

  // 3개 수집 시 눈히어로 서약 영웅 획득 활성화 (주인공: 카단 #41)
  const isUnlocked = current.length >= 3;
  return {
    isNew,
    totalCollected: current.length,
    isUnlocked,
    unlockedHeroId: 41,
  };
}

export function isHeroClaimed(heroId: number): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLAIMED_HEROES);
    const claimed: number[] = raw ? JSON.parse(raw) : [];
    return claimed.includes(heroId);
  } catch {
    return false;
  }
}

export function claimRecruitedHero(heroId: number): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLAIMED_HEROES);
    const claimed: number[] = raw ? JSON.parse(raw) : [];
    if (!claimed.includes(heroId)) {
      claimed.push(heroId);
      localStorage.setItem(STORAGE_KEY_CLAIMED_HEROES, JSON.stringify(claimed));
    }
    // 인벤토리에 카드 추가 (hero_inventory_{season})
    const currentSeason = localStorage.getItem('hero_current_season') || 'season1';
    const invKey = `hero_inventory_${currentSeason}`;
    const invRaw = localStorage.getItem(invKey);
    const inventory: Array<{ id: number; level: number; exp: number; count: number }> = invRaw ? JSON.parse(invRaw) : [];
    const existing = inventory.find((c) => c.id === heroId);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
    } else {
      inventory.push({ id: heroId, level: 1, exp: 0, count: 1 });
    }
    localStorage.setItem(invKey, JSON.stringify(inventory));

    // GA4 이벤트
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'lore_hero_recruited', {
        hero_id: heroId,
      });
    }
  } catch {
    // ignore
  }
}
