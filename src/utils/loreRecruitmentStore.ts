/**
 * Tactical Lore Clue & Recruitment Store (RSI-017)
 * 영속적 로컬스토리지 기반 인라인 군사 기밀 단서 수집 및 테마 히어로 계약 시스템
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
    id: 'clue_nano_blade',
    keyword: '나노 블레이드',
    title: '프로토콜: 나노 분자 절삭도',
    category: 'novel',
    secretBrief: '초고주파 진동으로 장갑을 분해하는 프로토타입 암살 무기 잔해.',
    relatedHeroId: 4,
    relatedHeroName: '섀도우 블레이드 (Shadow Blade)',
  },
  {
    id: 'clue_neural_overdrive',
    keyword: '신경 오버드라이브',
    title: '프로토콜: 뇌파 가속 인젝터',
    category: 'novel',
    secretBrief: '반응 속도를 0.005초 이하로 단축시키는 극비 사이버네틱스 칩셋.',
    relatedHeroId: 4,
    relatedHeroName: '섀도우 블레이드 (Shadow Blade)',
  },
  {
    id: 'clue_quantum_cloak',
    keyword: '양자 은폐',
    title: '프로토콜: 위상 편이 스펙트럼',
    category: 'wiki',
    secretBrief: '레이더 및 광학 센서를 완전히 교란하는 4차원 굴절 차폐막.',
    relatedHeroId: 4,
    relatedHeroName: '섀도우 블레이드 (Shadow Blade)',
  },
  {
    id: 'clue_aegis_core',
    keyword: '이지스 코어',
    title: '프로토콜: 다중 중력 실드',
    category: 'news',
    secretBrief: '전함급 포격을 일시 편향시키는 고에너지 역장 발생 장치.',
    relatedHeroId: 7,
    relatedHeroName: '아이언 이지스 (Iron Aegis)',
  },
  {
    id: 'clue_plasma_cannon',
    keyword: '플라즈마 캐논',
    title: '프로토콜: 과충전 열선포',
    category: 'wiki',
    secretBrief: '섭씨 10만 도의 플라즈마 구체를 연사하는 중화기 터렛 모듈.',
    relatedHeroId: 7,
    relatedHeroName: '아이언 이지스 (Iron Aegis)',
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
      // storage quota fallback
    }
    // GA4 이벤트
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'lore_clue_collected', {
        clue_id: clueId,
        total_collected: current.length,
      });
    }
  }

  // 3개 수집 시 보상 영입 활성화 (기본 히어로 ID: 4)
  const isUnlocked = current.length >= 3;
  return {
    isNew,
    totalCollected: current.length,
    isUnlocked,
    unlockedHeroId: 4,
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
    // 인벤토리에 카드 추가 (hero_inventory_{season} 또는 addCard)
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
