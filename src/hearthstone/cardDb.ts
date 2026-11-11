import { CLASSIC_HEROES, CardClass, ClassicCardDef, CustomDeck, HERO_CLASS_ORDER, HeroClass } from './types';

class ClassicCardDatabase {
  private cardsById = new Map<string, ClassicCardDef>();
  private collectibleList: ClassicCardDef[] = [];
  private loaded = false;

  async init(): Promise<void> {
    if (this.loaded) return;
    const cardsRes = await fetch('/hs-assets/data/classic-cards.json');
    const cardsJson = (await cardsRes.json()) as {
      cards: ClassicCardDef[];
      tokens: ClassicCardDef[];
    };

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

  getCard(id: string): ClassicCardDef | undefined {
    const clean = id.startsWith('VAN_') ? id.slice(4) : id;
    return this.cardsById.get(id) || this.cardsById.get(clean);
  }

  mustGetCard(id: string): ClassicCardDef {
    const c = this.getCard(id);
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
        snsCharId: 41,
        snsCharName: '카단',
        snsFaction: 'human',
        snsFactionKo: '인간종족',
        artUrl: '/anime-character-sheets/cutouts/041_Kadan.png',
        bustUrl: '/anime-character-sheets/busts/041_bust.jpg',
      };
    }
    return c;
  }

  getAllCollectible(): ClassicCardDef[] {
    return this.collectibleList;
  }
}

export const cardDb = new ClassicCardDatabase();

export function getCardArtUrl(cardOrArtId: ClassicCardDef | string): string {
  if (typeof cardOrArtId !== 'string') {
    return cardOrArtId.artUrl || cardOrArtId.bustUrl || '/anime-character-sheets/cutouts/041_Kadan.png';
  }
  const c = cardDb.getCard(cardOrArtId);
  return c?.artUrl || c?.bustUrl || '/anime-character-sheets/cutouts/041_Kadan.png';
}

export function getCardBustUrl(cardOrArtId: ClassicCardDef | string): string {
  if (typeof cardOrArtId !== 'string') {
    return cardOrArtId.bustUrl || cardOrArtId.artUrl || '/anime-character-sheets/busts/041_bust.jpg';
  }
  const c = cardDb.getCard(cardOrArtId);
  return c?.bustUrl || c?.artUrl || '/anime-character-sheets/busts/041_bust.jpg';
}

export function getCardTileUrl(artId: string): string {
  return getCardArtUrl(artId);
}

const HERO_ID_TO_PORTRAIT: Record<string, string> = {
  HERO_01: CLASSIC_HEROES.WARRIOR.heroCutoutUrl,
  HERO_02: CLASSIC_HEROES.SHAMAN.heroCutoutUrl,
  HERO_03: CLASSIC_HEROES.ROGUE.heroCutoutUrl,
  HERO_04: CLASSIC_HEROES.PALADIN.heroCutoutUrl,
  HERO_05: CLASSIC_HEROES.HUNTER.heroCutoutUrl,
  HERO_06: CLASSIC_HEROES.DRUID.heroCutoutUrl,
  HERO_07: CLASSIC_HEROES.WARLOCK.heroCutoutUrl,
  HERO_08: CLASSIC_HEROES.MAGE.heroCutoutUrl,
  HERO_09: CLASSIC_HEROES.PRIEST.heroCutoutUrl,
  EX1_323h: '/anime-character-sheets/cutouts/080_Ironforge.png',
  EX1_323: '/anime-character-sheets/cutouts/080_Ironforge.png',
};

export function getHeroArtUrl(heroId: string): string {
  if (HERO_ID_TO_PORTRAIT[heroId]) return HERO_ID_TO_PORTRAIT[heroId];
  const c = cardDb.getCard(heroId);
  return c?.artUrl || c?.bustUrl || '/anime-character-sheets/cutouts/041_Kadan.png';
}

function makeCrestDataUri(bgTop: string, bgBot: string, rim: string, glyphPath: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
      <radialGradient id="g" cx="35%" cy="28%" r="72%">
        <stop offset="0%" stop-color="${bgTop}"/>
        <stop offset="100%" stop-color="${bgBot}"/>
      </radialGradient>
      <linearGradient id="r" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fff3c4"/>
        <stop offset="50%" stop-color="${rim}"/>
        <stop offset="100%" stop-color="#5c3d14"/>
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#g)" stroke="url(#r)" stroke-width="3.5"/>
    <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1"/>
    <path d="${glyphPath}" fill="#fff8e1" stroke="rgba(0,0,0,0.55)" stroke-width="1.2" stroke-linejoin="round"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const CLASS_CREST_URL: Record<CardClass, string> = {
  // 인간종족 (설원 눈꽃 성기사 방패)
  PRIEST: makeCrestDataUri(
    '#60a5fa',
    '#1e3a8a',
    '#eab308',
    'M32 13 L46 19 V32 C46 42 39 48 32 52 C25 48 18 42 18 32 V19 Z M32 20 V44 M23 31 H41',
  ),
  // 물종족 (포세이돈 삼지창)
  MAGE: makeCrestDataUri(
    '#38bdf8',
    '#0c4a6e',
    '#7dd3fc',
    'M32 13 L36 21 H33.8 V49 H30.2 V21 H28 Z M21 18 L25 25 L23 31 H28 V27 H25.5 Z M43 18 L39 25 L41 31 H36 V27 H38.5 Z',
  ),
  // 불종족 (태양 불꽃 대검)
  WARRIOR: makeCrestDataUri(
    '#f87171',
    '#7f1d1d',
    '#f59e0b',
    'M32 12 C39 20 44 26 42 35 C40 43 35 48 32 51 C29 48 24 43 22 35 C20 26 25 20 32 12 Z M32 23 C29 28 28 33 32 42 C36 33 35 28 32 23 Z',
  ),
  // 바람종족 (폭풍 날개 화살)
  HUNTER: makeCrestDataUri(
    '#2dd4bf',
    '#115e59',
    '#99f6e4',
    'M32 12 L42 26 H35 V40 L42 48 L32 44 L22 48 L29 40 V26 H22 Z',
  ),
  // 땅종족 (대지 거석 수정)
  PALADIN: makeCrestDataUri(
    '#a3e635',
    '#365314',
    '#fde047',
    'M32 12 L47 24 L42 48 H22 L17 24 Z M32 19 L24 27 L27 42 H37 L40 27 Z',
  ),
  // 언데드종족 (섀도우 서리 쌍검)
  ROGUE: makeCrestDataUri(
    '#c084fc',
    '#3b0764',
    '#d8b4fe',
    'M20 15 L45 43 L41 47 L16 19 Z M44 15 L19 43 L23 47 L48 19 Z M32 24 L37 32 L32 40 L27 32 Z',
  ),
  // 엘프종족 (달빛 실반 초승달 & 별)
  SHAMAN: makeCrestDataUri(
    '#4ade80',
    '#14532d',
    '#bbf7d0',
    'M36 14 C25 16 19 25 21 36 C23 45 32 50 42 47 C33 46 28 39 28 31 C28 23 32 17 36 14 Z M41 22 L43 27 L48 29 L43 31 L41 36 L39 31 L34 29 L39 27 Z',
  ),
  // 드워프종족 (딥포지 룬 전쟁망치)
  WARLOCK: makeCrestDataUri(
    '#fbbf24',
    '#78350f',
    '#fde68a',
    'M18 17 H46 L43 29 H35 V50 H29 V29 H21 Z',
  ),
  // 동물종족 (야성 빙결늑대 발톱)
  DRUID: makeCrestDataUri(
    '#fb7185',
    '#881337',
    '#fda4af',
    'M21 16 L26 34 L22 48 L17 33 Z M32 13 L36 33 L32 50 L28 33 Z M43 16 L47 33 L42 48 L38 34 Z',
  ),
  // 중립 (로봇·용·110종족 눈히어로 8각 별)
  NEUTRAL: makeCrestDataUri(
    '#94a3b8',
    '#1e293b',
    '#e2e8f0',
    'M32 12 L37 25 L50 25 L40 34 L44 48 L32 39 L20 48 L24 34 L14 25 L27 25 Z',
  ),
  // 신록 비전 (신록룡 알렉스트라 비전)
  DREAM: makeCrestDataUri(
    '#34d399',
    '#064e3b',
    '#a7f3d0',
    'M32 13 C42 21 46 31 32 50 C18 31 22 21 32 13 Z',
  ),
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
    v: 2,
    c: deck.heroClass,
    n: deck.name,
    d: pairs,
  });
  return `SNSHERO1:${btoa(encodeURIComponent(payload))}`;
}

export function decodeDeckShareCode(
  rawCode: string,
): { name: string; heroClass: HeroClass; cards: string[] } | null {
  try {
    const trimmed = rawCode.trim();
    const b64 = trimmed.startsWith('SNSHERO1:')
      ? trimmed.slice('SNSHERO1:'.length)
      : trimmed.startsWith('HSCLASSIC1:')
        ? trimmed.slice('HSCLASSIC1:'.length)
        : trimmed;
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
    const heroInfo = CLASSIC_HEROES[parsed.c as HeroClass];
    return {
      name: (parsed.n || `${heroInfo.classNameKo}의 ${heroInfo.nameKo}`).slice(0, 28),
      heroClass: parsed.c as HeroClass,
      cards,
    };
  } catch {
    return null;
  }
}

/**
 * Formats card ability text:
 * - `$6` -> dynamic spell damage (e.g. `*7*` when spellDamage > 0)
 * - `#8` -> dynamic heal value (e.g. `*16*` with Alexandar)
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
        ? `<b style="color:#15803d">*${v1}-${v2}*</b>`
        : `${v1}-${v2}`;
    }
    return spellPowerBonus > 0 || velenMultiplier > 1
      ? `<b style="color:#15803d">*${v1}*</b>`
      : `${v1}`;
  });
  txt = txt.replace(/#(\d+)/g, (_, n1: string) => {
    const v1 = parseInt(n1, 10) * velenMultiplier;
    return velenMultiplier > 1 ? `<b style="color:#15803d">*${v1}*</b>` : `${v1}`;
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

export const GOLDEN_CRAFTING_COST: Record<string, number> = {
  COMMON: 400,
  RARE: 800,
  EPIC: 1600,
  LEGENDARY: 3200,
};

export const GOLDEN_DISENCHANT_VALUE: Record<string, number> = {
  COMMON: 50,
  RARE: 100,
  EPIC: 400,
  LEGENDARY: 1600,
};

/**
 * 무기 카드의 내구도는 데이터에서 `durability` 또는 `health` 필드에 보관되므로
 * 0 표기 버그 없이 정확한 정통 내구도 수치를 반환합니다.
 */
export function getCardBaseDurability(card: Pick<ClassicCardDef, 'durability' | 'health'>): number {
  if (typeof card.durability === 'number' && card.durability > 0) return card.durability;
  if (typeof card.health === 'number' && card.health > 0) return card.health;
  return 1;
}

/**
 * `/stone.html` 382장 도감과 100% 동일한 슬롯 순서(마나 비용 오름차순 -> 원작 기준 `stoneSortOrder`) 비교기
 */
export function compareCardsStoneOrder(a: ClassicCardDef, b: ClassicCardDef): number {
  if (a.cost !== b.cost) return a.cost - b.cost;
  if (a.stoneSortOrder !== undefined && b.stoneSortOrder !== undefined && a.stoneSortOrder !== b.stoneSortOrder) {
    return a.stoneSortOrder - b.stoneSortOrder;
  }
  return a.name.localeCompare(b.name, 'ko');
}

/**
 * 9 SNSHero Faction Starter / Iconic Archetype Preset Decks (each 30 verified cards)
 */
export const CLASSIC_PRESET_DECKS: CustomDeck[] = [
  {
    id: 'preset_priest',
    name: '인간종족의 카단',
    heroClass: 'PRIEST',
    isPreset: true,
    cards: [
      'EX1_621', 'EX1_621',
      'CS2_235', 'CS2_235',
      'CS2_004', 'CS2_004',
      'CS1_130', 'CS1_130',
      'CS2_234', 'CS2_234',
      'NEW1_020', 'NEW1_020',
      'EX1_622', 'EX1_622',
      'EX1_339', 'EX1_339',
      'CS2_181', 'CS2_181',
      'EX1_591', 'EX1_591',
      'CS2_179', 'CS2_179',
      'CS1_112', 'CS1_112',
      'EX1_284', 'EX1_284',
      'EX1_624', 'EX1_624',
      'EX1_623', 'CS1_113',
    ],
  },
  {
    id: 'preset_mage',
    name: '물종족의 포세이돈',
    heroClass: 'MAGE',
    isPreset: true,
    cards: [
      'NEW1_012', 'NEW1_012',
      'EX1_277', 'EX1_277',
      'CS2_024', 'CS2_024',
      'EX1_608', 'EX1_608',
      'CS2_172', 'CS2_172',
      'EX1_015', 'EX1_015',
      'CS2_023', 'CS2_023',
      'EX1_019', 'EX1_019',
      'CS2_022', 'CS2_022',
      'CS2_029', 'CS2_029',
      'CS2_033', 'CS2_033',
      'CS2_182', 'CS2_182',
      'CS2_179', 'CS2_179',
      'EX1_284', 'EX1_284',
      'CS2_032', 'CS2_032',
    ],
  },
  {
    id: 'preset_warrior',
    name: '불종족의 이그니시우스',
    heroClass: 'WARRIOR',
    isPreset: true,
    cards: [
      'EX1_607', 'EX1_607',
      'CS2_108', 'CS2_108',
      'EX1_400', 'EX1_400',
      'CS2_106', 'CS2_106',
      'EX1_603', 'EX1_603',
      'EX1_391', 'EX1_391',
      'EX1_402', 'EX1_402',
      'EX1_606', 'EX1_606',
      'EX1_007', 'EX1_007',
      'EX1_604', 'EX1_604',
      'NEW1_011', 'NEW1_011',
      'CS2_179', 'CS2_179',
      'CS2_112', 'CS2_112',
      'CS2_200', 'CS2_200',
      'EX1_410', 'EX1_407',
    ],
  },
  {
    id: 'preset_hunter',
    name: '바람종족의 토람',
    heroClass: 'HUNTER',
    isPreset: true,
    cards: [
      'CS2_084', 'CS2_084',
      'DS1_185', 'DS1_185',
      'DS1_175', 'DS1_175',
      'CS2_172', 'CS2_172',
      'CS2_120', 'CS2_120',
      'EX1_531', 'EX1_531',
      'EX1_610', 'EX1_611',
      'NEW1_031', 'NEW1_031',
      'EX1_539', 'EX1_539',
      'EX1_538', 'EX1_538',
      'EX1_617', 'EX1_617',
      'DS1_070', 'DS1_070',
      'DS1_183', 'DS1_183',
      'DS1_178', 'DS1_178',
      'EX1_534', 'EX1_534',
    ],
  },
  {
    id: 'preset_paladin',
    name: '땅종족의 콜로서스',
    heroClass: 'PALADIN',
    isPreset: true,
    cards: [
      'CS2_087', 'CS2_087',
      'EX1_360', 'EX1_360',
      'EX1_008', 'EX1_008',
      'EX1_619', 'EX1_619',
      'EX1_362', 'EX1_362',
      'EX1_019', 'EX1_019',
      'EX1_382', 'EX1_382',
      'CS2_093', 'CS2_093',
      'CS2_097', 'CS2_097',
      'CS2_092', 'CS2_092',
      'CS2_094', 'CS2_094',
      'CS2_182', 'CS2_182',
      'CS2_151', 'CS2_151',
      'CS2_088', 'CS2_088',
      'CS2_222', 'CS2_222',
    ],
  },
  {
    id: 'preset_rogue',
    name: '언데드종족의 아르투스',
    heroClass: 'ROGUE',
    isPreset: true,
    cards: [
      'CS2_072', 'CS2_072',
      'CS2_074', 'CS2_074',
      'CS2_073', 'CS2_073',
      'EX1_008', 'EX1_008',
      'EX1_131', 'EX1_131',
      'EX1_124', 'EX1_124',
      'EX1_581', 'EX1_581',
      'CS2_233', 'CS2_233',
      'EX1_096', 'EX1_096',
      'EX1_134', 'EX1_134',
      'EX1_129', 'EX1_129',
      'EX1_556', 'EX1_556',
      'EX1_046', 'EX1_046',
      'EX1_284', 'EX1_284',
      'CS2_076', 'CS2_077',
    ],
  },
  {
    id: 'preset_shaman',
    name: '엘프종족의 에일라',
    heroClass: 'SHAMAN',
    isPreset: true,
    cards: [
      'CS2_045', 'CS2_045',
      'EX1_238', 'EX1_238',
      'EX1_245', 'EX1_245',
      'EX1_565', 'EX1_565',
      'EX1_247', 'EX1_247',
      'EX1_246', 'EX1_246',
      'EX1_248', 'EX1_248',
      'EX1_259', 'EX1_259',
      'EX1_258', 'EX1_258',
      'EX1_575', 'EX1_556',
      'EX1_093', 'EX1_093',
      'CS2_182', 'CS2_182',
      'CS2_046', 'EX1_284',
      'CS2_042', 'CS2_042',
      'EX1_067', 'EX1_067',
    ],
  },
  {
    id: 'preset_warlock',
    name: '드워프종족의 아이언포지',
    heroClass: 'WARLOCK',
    isPreset: true,
    cards: [
      'EX1_308', 'EX1_308',
      'CS2_065', 'CS2_065',
      'EX1_319', 'EX1_319',
      'CS2_188', 'CS2_188',
      'EX1_008', 'EX1_008',
      'EX1_302', 'EX1_302',
      'EX1_004', 'EX1_004',
      'NEW1_019', 'NEW1_019',
      'EX1_162', 'EX1_162',
      'EX1_019', 'EX1_019',
      'EX1_556', 'EX1_556',
      'EX1_046', 'EX1_046',
      'EX1_093', 'EX1_093',
      'CS2_182', 'CS2_182',
      'EX1_310', 'EX1_310',
    ],
  },
  {
    id: 'preset_druid',
    name: '동물종족의 펜릴',
    heroClass: 'DRUID',
    isPreset: true,
    cards: [
      'EX1_169', 'EX1_169',
      'CS2_005', 'CS2_005',
      'CS2_013', 'CS2_013',
      'EX1_154', 'EX1_154',
      'CS2_011', 'CS2_011',
      'EX1_556', 'EX1_556',
      'CS2_012', 'CS2_012',
      'EX1_166', 'EX1_166',
      'CS2_182', 'CS2_182',
      'CS2_179', 'CS2_179',
      'EX1_165', 'EX1_165',
      'EX1_284', 'EX1_284',
      'EX1_571', 'EX1_571',
      'NEW1_008', 'NEW1_008',
      'CS2_232', 'CS2_232',
    ],
  },
];

export const CLASSIC_RANK_NAMES: Record<number, string> = {
  25: '엘윈 마을 수습생',
  24: '설원 변경 정찰병',
  23: '라이트헤븐 종자',
  22: '산호 해역 파수병',
  21: '흑풍단 갑판원',
  20: '무쇠 방패 보병',
  19: '딥포지 수습 기술자',
  18: '심연 수구 수련생',
  17: '바람섬 궁수',
  16: '녹옥회 유랑 모험가',
  15: '달빛 실반 파수꾼',
  14: '북방 설원 기병',
  13: '불꽃 궁정 선봉장',
  12: '아케 성기사단 정예',
  11: '안개절벽 사냥꾼',
  10: '별빛 기록실 마도사',
  9: '일곱 추적자 계승자',
  8: '비취 평의회 집행관',
  7: '하늘 제단 수호자',
  6: '고대 마공학 지휘관',
  5: '심연 해구 대장군',
  4: '대지 성채 거신병',
  3: '용의 첨탑 수호룡',
  2: '은빛 단검의 계승자',
  1: '엘윈마을 대승부사',
  0: '전설의 눈히어로 (LEGEND)',
};

export function getStarsNeededForRank(rank: number): number {
  if (rank <= 0) return 999;
  if (rank >= 21) return 2;
  if (rank >= 16) return 3;
  if (rank >= 11) return 4;
  return 5;
}
