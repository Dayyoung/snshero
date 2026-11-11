import { CardClass, ClassicCardDef, CustomDeck, HERO_CLASS_ORDER, HeroClass } from './types';

export interface ReaManifestData {
  generator: string;
  sourceInstallation: string;
  evidence: {
    assemblyCSharp: {
      evidenceId: string;
      sha256: string;
      byteLength: number;
      tableRowCounts: Record<string, number>;
    };
    blizzardT5Game: {
      evidenceId: string;
      sha256: string;
    };
    rymedyBaseline: {
      evidenceId: string;
      sha256: string;
    };
  };
  engineConstants: {
    turnDurationSeconds: number;
    ropeFuseSeconds: number;
    maxHandSize: number;
    maxBoardMinions: number;
    maxManaCrystals: number;
    deckSize: number;
    craftingCost: Record<string, number>;
    disenchantValue: Record<string, number>;
  };
  koKR: {
    spinnerTitles: string[];
    playErrors: Record<string, string>;
    ui: Record<string, string>;
  };
}

class ClassicCardDatabase {
  private cardsById = new Map<string, ClassicCardDef>();
  private collectibleList: ClassicCardDef[] = [];
  private manifest: ReaManifestData | null = null;
  private loaded = false;

  async init(): Promise<void> {
    if (this.loaded) return;
    const [cardsRes, manifestRes] = await Promise.all([
      fetch('/stone-assets/data/classic-cards.json'),
      fetch('/stone-assets/data/rea-manifest.json'),
    ]);
    const cardsJson = (await cardsRes.json()) as {
      cards: ClassicCardDef[];
      tokens: ClassicCardDef[];
    };
    this.manifest = (await manifestRes.json()) as ReaManifestData;

    this.collectibleList = cardsJson.cards;
    for (const c of cardsJson.cards) {
      this.cardsById.set(c.id, c);
      this.cardsById.set(c.vanId, c);
    }
    for (const t of cardsJson.tokens) {
      if (!this.cardsById.has(t.id)) {
        this.cardsById.set(t.id, t);
      }
      if (t.vanId && !this.cardsById.has(t.vanId)) {
        this.cardsById.set(t.vanId, t);
      }
    }
    this.loaded = true;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getManifest(): ReaManifestData | null {
    return this.manifest;
  }

  getCard(id: string): ClassicCardDef | undefined {
    return this.cardsById.get(id);
  }

  mustGetCard(id: string): ClassicCardDef {
    const c = this.cardsById.get(id);
    if (!c) {
      return {
        id,
        vanId: id,
        name: id,
        text: '',
        cardClass: 'NEUTRAL',
        type: 'MINION',
        rarity: 'COMMON',
        cost: 1,
        attack: 1,
        health: 1,
        mechanics: [],
        spellDamage: 0,
        overload: 0,
        collectible: false,
        artId: 'CS2_231',
      };
    }
    return c;
  }

  getAllCollectible(): ClassicCardDef[] {
    return this.collectibleList;
  }
}

export const cardDb = new ClassicCardDatabase();

export function getCardArtUrl(artId: string): string {
  const clean = artId.startsWith('VAN_') ? artId.slice(4) : artId;
  return `https://art.hearthstonejson.com/v1/256x/${clean}.jpg`;
}

export function getCardTileUrl(artId: string): string {
  const clean = artId.startsWith('VAN_') ? artId.slice(4) : artId;
  return `https://art.hearthstonejson.com/v1/tiles/${clean}.webp`;
}

export function getHeroArtUrl(heroId: string): string {
  return `https://art.hearthstonejson.com/v1/256x/${heroId}.jpg`;
}

/**
 * Official Blizzard Korean (`koKR`) transparent-alpha card render URL.
 * Prefers 2014 Classic `VAN_*` IDs so un-nerfed stats, swirl watermarks,
 * Legendary dragon crests, sword/blood-drop gems, and S-curved scrolls match 1:1.
 */
export function getOfficialCardRenderUrl(
  card: ClassicCardDef,
  res: '256x' | '512x' = '256x',
): string {
  const primaryId = card.vanId || card.id || card.artId;
  return `https://art.hearthstonejson.com/v1/render/latest/koKR/${res}/${primaryId}.png`;
}

export function getOfficialCardRenderFallbackUrl(
  card: ClassicCardDef,
  res: '256x' | '512x' = '256x',
): string {
  const cleanId = card.id.startsWith('VAN_') ? card.id.slice(4) : card.id;
  return `https://art.hearthstonejson.com/v1/render/latest/koKR/${res}/${cleanId}.png`;
}

export const CLASS_CREST_URL: Record<CardClass, string> = {
  MAGE: '/stone-assets/ui/crest_mage.webp',
  PALADIN: '/stone-assets/ui/crest_paladin.webp',
  PRIEST: '/stone-assets/ui/crest_priest.webp',
  ROGUE: '/stone-assets/ui/crest_rogue.webp',
  SHAMAN: '/stone-assets/ui/crest_shaman.webp',
  WARLOCK: '/stone-assets/ui/crest_warlock.webp',
  WARRIOR: '/stone-assets/ui/crest_warrior.webp',
  DRUID: '/stone-assets/ui/crest_druid.webp',
  HUNTER: '/stone-assets/ui/crest_hunter.webp',
  NEUTRAL: '/stone-assets/ui/crest_neutral.webp',
  DREAM: '/stone-assets/ui/crest_druid.webp',
};

export function encodeDeckShareCode(deck: CustomDeck): string {
  const counts = new Map<string, number>();
  for (const cid of deck.cards) {
    counts.set(cid, (counts.get(cid) || 0) + 1);
  }
  const pairs = Array.from(counts.entries())
    .map(([cid, n]) => `${cid}:${n}`)
    .join(',');
  const payload = JSON.stringify({
    v: 1,
    c: deck.heroClass,
    n: deck.name,
    d: pairs,
  });
  return `HSCLASSIC1:${btoa(encodeURIComponent(payload))}`;
}

export function decodeDeckShareCode(
  rawCode: string,
): { name: string; heroClass: HeroClass; cards: string[] } | null {
  try {
    const trimmed = rawCode.trim();
    const b64 = trimmed.startsWith('HSCLASSIC1:') ? trimmed.slice('HSCLASSIC1:'.length) : trimmed;
    const parsed = JSON.parse(decodeURIComponent(atob(b64))) as {
      c?: string;
      n?: string;
      d?: string;
    };
    if (!parsed.c || !HERO_CLASS_ORDER.includes(parsed.c as HeroClass) || !parsed.d) {
      return null;
    }
    const cards: string[] = [];
    for (const seg of parsed.d.split(',')) {
      const [cid, cntStr] = seg.split(':');
      const card = cardDb.getCard(cid);
      const cnt = Math.min(card?.rarity === 'LEGENDARY' ? 1 : 2, Math.max(1, Number(cntStr) || 1));
      if (card && card.collectible) {
        for (let i = 0; i < cnt && cards.length < 30; i += 1) {
          cards.push(card.id);
        }
      }
    }
    if (cards.length === 0) return null;
    return {
      name: (parsed.n || `${parsed.c} 공유 덱`).slice(0, 28),
      heroClass: parsed.c as HeroClass,
      cards,
    };
  } catch {
    return null;
  }
}

/**
 * Formats Hearthstone card text:
 * - `$6` -> dynamic spell damage (e.g. `*7*` when spellDamage > 0)
 * - `#8` -> dynamic heal value (e.g. `*16*` with Prophet Velen)
 * - Cleans `[x]` layout markers
 */
export function formatCardHtmlText(
  rawText: string,
  spellPowerBonus = 0,
  velenMultiplier = 1,
): string {
  if (!rawText) return '';
  let txt = rawText.replace(/\[x\]/g, '').replace(/&/g, ' ').trim();
  txt = txt.replace(/\$(\d+)(-\$(\d+))?/g, (_, n1: string, _range: string, n2?: string) => {
    const v1 = (parseInt(n1, 10) + spellPowerBonus) * velenMultiplier;
    if (n2) {
      const v2 = (parseInt(n2, 10) + spellPowerBonus) * velenMultiplier;
      return spellPowerBonus > 0 || velenMultiplier > 1
        ? `<b style="color:#4ade80">*${v1}-${v2}*</b>`
        : `${v1}-${v2}`;
    }
    return spellPowerBonus > 0 || velenMultiplier > 1
      ? `<b style="color:#4ade80">*${v1}*</b>`
      : `${v1}`;
  });
  txt = txt.replace(/#(\d+)/g, (_, n1: string) => {
    const v1 = parseInt(n1, 10) * velenMultiplier;
    return velenMultiplier > 1 ? `<b style="color:#4ade80">*${v1}*</b>` : `${v1}`;
  });
  return txt.replace(/\n/g, '<br/>');
}

export const CRAFTING_COST: Record<string, number> = {
  COMMON: 40,
  RARE: 100,
  EPIC: 400,
  LEGENDARY: 1600,
};

export const DISENCHANT_VALUE: Record<string, number> = {
  COMMON: 5,
  RARE: 20,
  EPIC: 100,
  LEGENDARY: 400,
};

/**
 * 9 Classic Starter / Iconic Archetype Preset Decks (each 30 verified Classic cards)
 * Uses Basic (FREE) + Classic staples so every class plays authentically right out of the box!
 */
export const CLASSIC_PRESET_DECKS: CustomDeck[] = [
  {
    id: 'preset_mage',
    name: '키린 토 클래식 마법사',
    heroClass: 'MAGE',
    isPreset: true,
    cards: [
      'NEW1_012', 'NEW1_012', // 마나 지룡 x2
      'EX1_277', 'EX1_277', // 신비한 화살 x2
      'CS2_024', 'CS2_024', // 얼음 화살 x2
      'EX1_608', 'EX1_608', // 마술사의 수습생 x2
      'CS2_172', 'CS2_172', // 붉은늪지랩터 x2
      'EX1_015', 'EX1_015', // 풋내기 기술자 x2
      'CS2_023', 'CS2_023', // 신비한 지능 x2
      'EX1_019', 'EX1_019', // 무너진 태양 성직자 x2
      'CS2_022', 'CS2_022', // 변이 x2
      'CS2_029', 'CS2_029', // 화염구 x2
      'CS2_033', 'CS2_033', // 물의 정령 x2
      'CS2_182', 'CS2_182', // 서리바람 설인 x2
      'CS2_179', 'CS2_179', // 센진 방패대가 x2
      'EX1_284', 'EX1_284', // 하늘빛 비룡 x2
      'CS2_032', 'CS2_032', // 불기둥 x2
    ],
  },
  {
    id: 'preset_warrior',
    name: '호드의 방패 컨트롤 전사',
    heroClass: 'WARRIOR',
    isPreset: true,
    cards: [
      'EX1_607', 'EX1_607', // 내면의 분노 x2
      'CS2_108', 'CS2_108', // 마무리 일격 x2
      'EX1_400', 'EX1_400', // 소용돌이 x2
      'CS2_106', 'CS2_106', // 이글거리는 전쟁 도끼 x2
      'EX1_603', 'EX1_603', // 잔인한 감독관 x2
      'EX1_391', 'EX1_391', // 격돌 x2
      'EX1_402', 'EX1_402', // 방어구 제작자 x2
      'EX1_606', 'EX1_606', // 방패 올리기 x2
      'EX1_007', 'EX1_007', // 고통의 수행사제 x2
      'EX1_604', 'EX1_604', // 거품 무는 광전사 x2
      'NEW1_011', 'NEW1_011', // 코르크론 정예병 x2
      'CS2_179', 'CS2_179', // 센진 방패대가 x2
      'CS2_112', 'CS2_112', // 아케이나이트 도끼 x2
      'CS2_200', 'CS2_200', // 돌주먹 오우거 x2
      'EX1_410', 'EX1_407', // 방패 밀쳐내기 + 난투
    ],
  },
  {
    id: 'preset_hunter',
    name: '야수 조련 미드레인지 사냥꾼',
    heroClass: 'HUNTER',
    isPreset: true,
    cards: [
      'CS2_084', 'CS2_084', // 사냥꾼의 징표 x2
      'DS1_185', 'DS1_185', // 신비한 사격 x2
      'DS1_175', 'DS1_175', // 회갈색 늑대 x2
      'CS2_172', 'CS2_172', // 붉은늪지랩터 x2
      'CS2_120', 'CS2_120', // 민물악어 x2
      'EX1_531', 'EX1_531', // 청소부 하이에나 x2
      'EX1_610', 'EX1_611', // 폭발의 덫 + 빙결의 덫
      'NEW1_031', 'NEW1_031', // 야생의 벗 x2
      'EX1_539', 'EX1_539', // 살상 명령 x2
      'EX1_538', 'EX1_538', // 개들을 풀어라 x2
      'EX1_617', 'EX1_617', // 치명적인 사격 x2
      'DS1_070', 'DS1_070', // 사냥개조련사 x2
      'DS1_183', 'DS1_183', // 일제 사격 x2
      'DS1_178', 'DS1_178', // 툰드라 코뿔소 x2
      'EX1_534', 'EX1_534', // 사바나 사자 x2
    ],
  },
  {
    id: 'preset_paladin',
    name: '은빛 성기사단 미드레인지',
    heroClass: 'PALADIN',
    isPreset: true,
    cards: [
      'CS2_087', 'CS2_087', // 힘의 축복 x2
      'EX1_360', 'EX1_360', // 겸손 x2
      'EX1_008', 'EX1_008', // 은빛십자군 종자 x2
      'EX1_619', 'EX1_619', // 평등 x2
      'EX1_362', 'EX1_362', // 여명회 파수병 x2
      'EX1_019', 'EX1_019', // 무너진 태양 성직자 x2
      'EX1_382', 'EX1_382', // 알도르 평화감시단 x2
      'CS2_093', 'CS2_093', // 신성화 x2
      'CS2_097', 'CS2_097', // 용사의 진은검 x2
      'CS2_092', 'CS2_092', // 왕의 축복 x2
      'CS2_094', 'CS2_094', // 천벌의 망치 x2
      'CS2_182', 'CS2_182', // 서리바람 설인 x2
      'CS2_151', 'CS2_151', // 은빛 성기사단 기사 x2
      'CS2_088', 'CS2_088', // 왕의 수호자 x2
      'CS2_222', 'CS2_222', // 스톰윈드 용사 x2
    ],
  },
  {
    id: 'preset_priest',
    name: '스톰윈드 빛의 사제',
    heroClass: 'PRIEST',
    isPreset: true,
    cards: [
      'EX1_621', 'EX1_621', // 치유의 마법진 x2
      'CS2_235', 'CS2_235', // 북녘골 성직자 x2
      'CS2_004', 'CS2_004', // 신의 권능: 보호막 x2
      'CS1_130', 'CS1_130', // 성스러운 일격 x2
      'CS2_234', 'CS2_234', // 어둠의 권능: 고통 x2
      'NEW1_020', 'NEW1_020', // 광기의 화염술사 x2
      'EX1_622', 'EX1_622', // 어둠의 권능: 죽음 x2
      'EX1_339', 'EX1_339', // 생각 훔치기 x2
      'CS2_181', 'CS2_181', // 부상당한 검귀 x2
      'EX1_591', 'EX1_591', // 아키나이 영혼사제 x2
      'CS2_179', 'CS2_179', // 센진 방패대가 x2
      'CS1_112', 'CS1_112', // 신성한 폭발 x2
      'EX1_284', 'EX1_284', // 하늘빛 비룡 x2
      'EX1_624', 'EX1_624', // 신성한 불꽃 x2
      'EX1_623', 'CS1_113', // 사원 집행자 + 정신 지배
    ],
  },
  {
    id: 'preset_rogue',
    name: 'SI:7 템포 암살 도적',
    heroClass: 'ROGUE',
    isPreset: true,
    cards: [
      'CS2_072', 'CS2_072', // 기습 x2
      'CS2_074', 'CS2_074', // 맹독 x2
      'CS2_073', 'CS2_073', // 냉혈 x2
      'EX1_008', 'EX1_008', // 은빛십자군 종자 x2
      'EX1_131', 'EX1_131', // 데피아즈단 두목 x2
      'EX1_124', 'EX1_124', // 절개 x2
      'EX1_581', 'EX1_581', // 혼절시키기 x2
      'CS2_233', 'CS2_233', // 폭풍의 칼날 x2
      'EX1_096', 'EX1_096', // 전리품 수집가 x2
      'EX1_134', 'EX1_134', // SI:7 요원 x2
      'EX1_129', 'EX1_129', // 칼날 부채 x2
      'EX1_556', 'EX1_556', // 허수아비골렘 x2
      'EX1_046', 'EX1_046', // 검은무쇠 드워프 x2
      'EX1_284', 'EX1_284', // 하늘빛 비룡 x2
      'CS2_076', 'CS2_077', // 암살 + 전력 질주
    ],
  },
  {
    id: 'preset_shaman',
    name: '대지 고리회 토템 주술사',
    heroClass: 'SHAMAN',
    isPreset: true,
    cards: [
      'CS2_045', 'CS2_045', // 대지의 무기 x2
      'EX1_238', 'EX1_238', // 번개 화살 x2
      'EX1_245', 'EX1_245', // 대지 충격 x2
      'EX1_565', 'EX1_565', // 불꽃의 토템 x2
      'EX1_247', 'EX1_247', // 폭풍으로 벼려낸 도끼 x2
      'EX1_246', 'EX1_246', // 사술 x2
      'EX1_248', 'EX1_248', // 야수 정령 x2
      'EX1_259', 'EX1_259', // 번개 폭풍 x2
      'EX1_258', 'EX1_258', // 속박 풀린 정령 x2
      'EX1_575', 'EX1_556', // 마나 해일 토템 + 허수아비골렘
      'EX1_093', 'EX1_093', // 아르거스의 수호자 x2
      'CS2_182', 'CS2_182', // 서리바람 설인 x2
      'CS2_046', 'EX1_284', // 피의 욕망 + 하늘빛 비룡
      'CS2_042', 'CS2_042', // 불의 정령 x2
      'EX1_067', 'EX1_067', // 은빛십자군 부대장 x2
    ],
  },
  {
    id: 'preset_warlock',
    name: '화염과 그림자 위니 흑마법사',
    heroClass: 'WARLOCK',
    isPreset: true,
    cards: [
      'EX1_308', 'EX1_308', // 영혼의 불꽃 x2
      'CS2_065', 'CS2_065', // 공허방랑자 x2
      'EX1_319', 'EX1_319', // 화염 임프 x2
      'CS2_188', 'CS2_188', // 가혹한 하사관 x2
      'EX1_008', 'EX1_008', // 은빛십자군 종자 x2
      'EX1_302', 'EX1_302', // 필멸의 고리 x2
      'EX1_004', 'EX1_004', // 젊은 여사제 x2
      'NEW1_019', 'NEW1_019', // 단검 곡예사 x2
      'EX1_162', 'EX1_162', // 광포한 늑대 우두머리 x2
      'EX1_019', 'EX1_019', // 무너진 태양 성직자 x2
      'EX1_556', 'EX1_556', // 허수아비골렘 x2
      'EX1_046', 'EX1_046', // 검은무쇠 드워프 x2
      'EX1_093', 'EX1_093', // 아르거스의 수호자 x2
      'CS2_182', 'CS2_182', // 서리바람 설인 x2
      'EX1_310', 'EX1_310', // 파멸수호병 x2
    ],
  },
  {
    id: 'preset_druid',
    name: '자군야포 클래식 램프 드루이드',
    heroClass: 'DRUID',
    isPreset: true,
    cards: [
      'EX1_169', 'EX1_169', // 정신 자극 x2
      'CS2_005', 'CS2_005', // 할퀴기 x2
      'CS2_013', 'CS2_013', // 급속 성장 x2
      'EX1_154', 'EX1_154', // 천벌 x2
      'CS2_011', 'CS2_011', // 야생의 포효 x2
      'EX1_556', 'EX1_556', // 허수아비골렘 x2
      'CS2_012', 'CS2_012', // 휘둘러치기 x2
      'EX1_166', 'EX1_166', // 숲의 수호자 x2
      'CS2_182', 'CS2_182', // 서리바람 설인 x2
      'CS2_179', 'CS2_179', // 센진 방패대가 x2
      'EX1_165', 'EX1_165', // 발톱의 드루이드 x2
      'EX1_284', 'EX1_284', // 하늘빛 비룡 x2
      'EX1_571', 'EX1_571', // 자연의 군대 x2
      'NEW1_008', 'NEW1_008', // 지식의 고대정령 x2
      'CS2_232', 'CS2_232', // 무쇠껍질 수호정령 x2
    ],
  },
];

export const CLASSIC_RANK_NAMES: Record<number, string> = {
  25: '화난 닭',
  24: '오염된 노움',
  23: '은빛십자군 종자',
  22: '멀록 약탈꾼',
  21: '남쪽바다 갑판원',
  20: '방패병',
  19: '풋내기 기술자',
  18: '마술사의 수습생',
  17: '타우렌 전사',
  16: '퀘스트 중인 모험가',
  15: '실버문 수호병',
  14: '공격대장',
  13: '공포의 해적',
  12: '전쟁노래 사령관',
  11: '나 이런 사냥꾼이야',
  10: '오우거 마법사',
  9: '은빛 성기사단 기사',
  8: '서리늑대 전쟁군주',
  7: '태양길잡이',
  6: '고대의 전쟁정령',
  5: '바다 거인',
  4: '산악 거인',
  3: '용암 거인',
  2: '흑기사',
  1: '여관주인',
  0: '전설 (LEGEND)',
};

export function getStarsNeededForRank(rank: number): number {
  if (rank <= 0) return 999;
  if (rank >= 21) return 2;
  if (rank >= 16) return 3;
  if (rank >= 11) return 4;
  return 5;
}
