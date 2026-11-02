/**
 * src/landing/services/assetCatalog.ts
 *
 * 3-Tier Character Visual Assets Catalog & Lookup Service for SNSHero Landing.
 *
 * Visual Tiers:
 *   1. 7-Head Full-Body Cutout (full7 / 7head):
 *      Path: /anime-character-sheets/cutouts/{pad3}_{nameEn}.png (transparent anime cutouts)
 *   2. Torso / Bust Portrait (bust):
 *      Path: /anime-character-sheets/busts/{pad3}_bust.png (or .jpg), fallback to /seat/{nameEn}.png
 *   3. 3-Head SD / Chibi Sprite (sd / 3head):
 *      Path: /seat/{nameEn}.png (or /anime-character-sheets/sd/{pad3}_sd.png),
 *      fallback to /cards1.png (cards 1-100) or /cards2.png (cards 101-110)
 *
 * Meets DESIGN.md OpenCode Terminal-Flat specifications and zero server runtime dependencies.
 */

export type CharacterVisualTier = '7head' | 'bust' | '3head';

export interface CharacterSpriteCoords {
  sourceSheet: '/cards1.png' | '/cards2.png';
  col: number;
  row: number;
  xPercent: number;
  yPercent: number;
}

export interface CharacterAssetMeta {
  id: number;
  code: string;            // e.g. "NO.001"
  nameKo: string;          // e.g. "아쿠아리스"
  nameEn: string;          // e.g. "Aquaris"
  faction: string;         // e.g. "water", "fire", etc.
  rarity: string;          // "bronze" | "silver" | "gold"
  cutoutUrl: string;       // 7-head full body: /anime-character-sheets/cutouts/001_Aquaris.png
  bustPngUrl: string;      // Torso PNG: /anime-character-sheets/busts/001_bust.png
  bustJpgUrl: string;      // Torso JPG: /anime-character-sheets/busts/001_bust.jpg
  seatUrl: string;         // Chibi portrait: /seat/Aquaris.png
  sdUrl: string;           // 3-head SD sprite: /seat/Aquaris.png (or /anime-character-sheets/sd/001_sd.png)
  spriteSheet: '/cards1.png' | '/cards2.png';
  spriteCoords: CharacterSpriteCoords;
  fallbackSvgDataUri: string;
}

// ─── Faction Palette for Terminal-Flat Fallback Generation ────────────────────

export const FACTION_PALETTES: Record<string, { bg: string; text: string; border: string }> = {
  water:   { bg: '#0284c7', text: '#ffffff', border: '#0369a1' },
  fire:    { bg: '#dc2626', text: '#ffffff', border: '#b91c1c' },
  wind:    { bg: '#0d9488', text: '#ffffff', border: '#0f766e' },
  earth:   { bg: '#65a30d', text: '#ffffff', border: '#4d7c0f' },
  human:   { bg: '#2563eb', text: '#ffffff', border: '#1d4ed8' },
  undead:  { bg: '#7c3aed', text: '#ffffff', border: '#6d28d9' },
  elf:     { bg: '#16a34a', text: '#ffffff', border: '#15803d' },
  dwarf:   { bg: '#b45309', text: '#ffffff', border: '#92400e' },
  monster: { bg: '#be123c', text: '#ffffff', border: '#9f1239' },
  robot:   { bg: '#0369a1', text: '#ffffff', border: '#075985' },
  dragon:  { bg: '#991b1b', text: '#ffffff', border: '#7f1d1d' },
};

export function getFactionForCardId(cardId: number): string {
  if (cardId <= 10) return 'water';
  if (cardId <= 20) return 'fire';
  if (cardId <= 30) return 'wind';
  if (cardId <= 40) return 'earth';
  if (cardId <= 50) return 'human';
  if (cardId <= 60) return 'undead';
  if (cardId <= 70) return 'elf';
  if (cardId <= 80) return 'dwarf';
  if (cardId <= 90) return 'monster';
  if (cardId <= 100) return 'robot';
  return 'dragon';
}

// ─── 110 Canonical Character Names & Filename Suffixes ───────────────────────

export const CHARACTER_BASE_NAMES: Record<number, { ko: string; en: string; file: string; rarity: string }> = {
  1:   { ko: '아쿠아리스', en: 'Aquaris', file: 'Aquaris', rarity: 'bronze' },
  2:   { ko: '나이아드', en: 'Naiad', file: 'Naiad', rarity: 'bronze' },
  3:   { ko: '운디네', en: 'Undine', file: 'Undine', rarity: 'bronze' },
  4:   { ko: '켈피', en: 'Kelpie', file: 'Kelpie', rarity: 'bronze' },
  5:   { ko: '아쿠아로드', en: 'Aqualord', file: 'Aqualord', rarity: 'bronze' },
  6:   { ko: '레비아탄', en: 'Leviathan', file: 'Leviathan', rarity: 'silver' },
  7:   { ko: '가르간티아', en: 'Gargantia', file: 'Gargantia', rarity: 'silver' },
  8:   { ko: '캐스케이드', en: 'Cascade', file: 'Cascade', rarity: 'silver' },
  9:   { ko: '크라켄', en: 'Kraken', file: 'Kraken', rarity: 'gold' },
  10:  { ko: '포세이돈', en: 'Poseidon', file: 'Poseidon', rarity: 'gold' },
  11:  { ko: '이그니스', en: 'Ignis', file: 'Ignis', rarity: 'bronze' },
  12:  { ko: '샐러맨더', en: 'Salamander', file: 'Salamander', rarity: 'bronze' },
  13:  { ko: '벨페고르', en: 'Belphegor', file: 'Belphegor', rarity: 'bronze' },
  14:  { ko: '파이로', en: 'Pyro', file: 'Pyro', rarity: 'bronze' },
  15:  { ko: '발록', en: 'Balrog', file: 'Balrog', rarity: 'bronze' },
  16:  { ko: '무스펠', en: 'Muspel', file: 'Muspel', rarity: 'silver' },
  17:  { ko: '이바르', en: 'Ivar', file: 'Ivar', rarity: 'silver' },
  18:  { ko: '불사신 아셀', en: 'Ashel the Immortal', file: 'Ashel_the_Immortal', rarity: 'silver' },
  19:  { ko: '피닉스', en: 'Phoenix', file: 'Phoenix', rarity: 'gold' },
  20:  { ko: '이그니시우스', en: 'Ignisius', file: 'Ignisius', rarity: 'gold' },
  21:  { ko: '제피로스', en: 'Zephyros', file: 'Zephyros', rarity: 'bronze' },
  22:  { ko: '실프', en: 'Sylph', file: 'Sylph', rarity: 'bronze' },
  23:  { ko: '실피드', en: 'Sylphid', file: 'Sylphid', rarity: 'bronze' },
  24:  { ko: '하피', en: 'Harpy', file: 'Harpy', rarity: 'bronze' },
  25:  { ko: '에올루스', en: 'Aeolus', file: 'Aeolus', rarity: 'bronze' },
  26:  { ko: '템페스트', en: 'Tempest', file: 'Tempest', rarity: 'silver' },
  27:  { ko: '사이클론', en: 'Cyclone', file: 'Cyclone', rarity: 'silver' },
  28:  { ko: '제우스피어', en: 'Zeusphere', file: 'Zeusphere', rarity: 'silver' },
  29:  { ko: '뇌신', en: 'Raijin', file: 'Raijin', rarity: 'gold' },
  30:  { ko: '바람신 토람', en: 'Wind God Toram', file: 'Wind_God_Toram', rarity: 'gold' },
  31:  { ko: '가이아', en: 'Gaia', file: 'Gaia', rarity: 'bronze' },
  32:  { ko: '그놈', en: 'Gnome', file: 'Gnome', rarity: 'bronze' },
  33:  { ko: '테라', en: 'Terra', file: 'Terra', rarity: 'bronze' },
  34:  { ko: '고르곤', en: 'Gorgon', file: 'Gorgon', rarity: 'bronze' },
  35:  { ko: '오벨리스크', en: 'Obelisk', file: 'Obelisk', rarity: 'bronze' },
  36:  { ko: '그랜드로크', en: 'Grandrock', file: 'Grandrock', rarity: 'silver' },
  37:  { ko: '록타', en: 'Rokta', file: 'Rokta', rarity: 'silver' },
  38:  { ko: '오리하르콘', en: 'Orihalcon', file: 'Orihalcon', rarity: 'silver' },
  39:  { ko: '아틀라스', en: 'Atlas', file: 'Atlas', rarity: 'gold' },
  40:  { ko: '콜로서스', en: 'Colossus', file: 'Colossus', rarity: 'gold' },
  41:  { ko: '카단', en: 'Kadan', file: 'Kadan', rarity: 'bronze' },
  42:  { ko: '엘윈', en: 'Elwin', file: 'Elwin', rarity: 'bronze' },
  43:  { ko: '발리안', en: 'Balian', file: 'Balian', rarity: 'bronze' },
  44:  { ko: '카제', en: 'Kaze', file: 'Kaze', rarity: 'bronze' },
  45:  { ko: '가웨인', en: 'Gawain', file: 'Gawain', rarity: 'bronze' },
  46:  { ko: '론돌', en: 'Rondol', file: 'Rondol', rarity: 'silver' },
  47:  { ko: '길가메시', en: 'Gilgamesh', file: 'Gilgamesh', rarity: 'silver' },
  48:  { ko: '로비냐드', en: 'Robinyard', file: 'Robinyard', rarity: 'silver' },
  49:  { ko: '헤르쿨', en: 'Hercul', file: 'Hercul', rarity: 'gold' },
  50:  { ko: '알렉산다르', en: 'Aleksandar', file: 'Aleksandar', rarity: 'gold' },
  51:  { ko: '워커', en: 'Walker', file: 'Walker', rarity: 'bronze' },
  52:  { ko: '구울', en: 'Ghoul', file: 'Ghoul', rarity: 'bronze' },
  53:  { ko: '캐리언', en: 'Carrion', file: 'Carrion', rarity: 'bronze' },
  54:  { ko: '아라크네', en: 'Arachne', file: 'Arachne', rarity: 'bronze' },
  55:  { ko: '패치워크', en: 'Patchwork', file: 'Patchwork', rarity: 'bronze' },
  56:  { ko: '카르디스', en: 'Cardis', file: 'Cardis', rarity: 'silver' },
  57:  { ko: '스톤가고일', en: 'Stone Gargoyle', file: 'Stone_Gargoyle', rarity: 'silver' },
  58:  { ko: '사이드라고사', en: 'Sidragosa', file: 'Sidragosa', rarity: 'silver' },
  59:  { ko: '켈투스', en: 'Keltus', file: 'Keltus', rarity: 'gold' },
  60:  { ko: '데스나이트 아르투스', en: 'Death Knight Artus', file: 'Death_Knight_Artus', rarity: 'gold' },
  61:  { ko: '루시안', en: 'Lucian', file: 'Lucian', rarity: 'bronze' },
  62:  { ko: '실리아', en: 'Celia', file: 'Celia', rarity: 'bronze' },
  63:  { ko: '엘리아나', en: 'Eliana', file: 'Eliana', rarity: 'bronze' },
  64:  { ko: '티타니아', en: 'Titania', file: 'Titania', rarity: 'bronze' },
  65:  { ko: '실바니아', en: 'Sylvania', file: 'Sylvania', rarity: 'bronze' },
  66:  { ko: '말퓨온', en: 'Malfuon', file: 'Malfuon', rarity: 'silver' },
  67:  { ko: '베작스', en: 'Vezax', file: 'Vezax', rarity: 'silver' },
  68:  { ko: '캘토르', en: 'Kaeltor', file: 'Kaeltor', rarity: 'silver' },
  69:  { ko: '간다르', en: 'Gandar', file: 'Gandar', rarity: 'gold' },
  70:  { ko: '에일라', en: 'Aila', file: 'Aila', rarity: 'gold' },
  71:  { ko: '발보', en: 'Balbo', file: 'Balbo', rarity: 'bronze' },
  72:  { ko: '프레도', en: 'Fredo', file: 'Fredo', rarity: 'bronze' },
  73:  { ko: '샘와이', en: 'Samwy', file: 'Samwy', rarity: 'bronze' },
  74:  { ko: '그림리', en: 'Grimli', file: 'Grimli', rarity: 'bronze' },
  75:  { ko: '마그니스', en: 'Magnis', file: 'Magnis', rarity: 'bronze' },
  76:  { ko: '브란디', en: 'Brandy', file: 'Brandy', rarity: 'silver' },
  77:  { ko: '무라디', en: 'Muradi', file: 'Muradi', rarity: 'silver' },
  78:  { ko: '토그림', en: 'Thorgrim', file: 'Thorgrim', rarity: 'silver' },
  79:  { ko: '베리포지', en: 'Berryforge', file: 'Berryforge', rarity: 'gold' },
  80:  { ko: '아이언포지', en: 'Ironforge', file: 'Ironforge', rarity: 'gold' },
  81:  { ko: '펜릴', en: 'Fenrir', file: 'Fenrir', rarity: 'bronze' },
  82:  { ko: '미노타우로스', en: 'Minotaur', file: 'Minotaur', rarity: 'bronze' },
  83:  { ko: '요르문간드', en: 'Jormungandr', file: 'Jormungandr', rarity: 'bronze' },
  84:  { ko: '그리폰', en: 'Griffon', file: 'Griffon', rarity: 'bronze' },
  85:  { ko: '바이라', en: 'Byra', file: 'Byra', rarity: 'bronze' },
  86:  { ko: '레오나르', en: 'Leonar', file: 'Leonar', rarity: 'silver' },
  87:  { ko: '바르가스트', en: 'Barghest', file: 'Barghest', rarity: 'silver' },
  88:  { ko: '우르삭', en: 'Ursoc', file: 'Ursoc', rarity: 'silver' },
  89:  { ko: '메두사 고르고', en: 'Medusa Gorgo', file: 'Medusa_Gorgo', rarity: 'gold' },
  90:  { ko: '페가수스', en: 'Pegasus', file: 'Pegasus', rarity: 'gold' },
  91:  { ko: '스파이더봇', en: 'Spiderbot', file: 'Spiderbot', rarity: 'bronze' },
  92:  { ko: '크로노스', en: 'Chronos', file: 'Chronos', rarity: 'bronze' },
  93:  { ko: '센티넬', en: 'Sentinel', file: 'Sentinel', rarity: 'bronze' },
  94:  { ko: '디바스터', en: 'Devastator', file: 'Devastator', rarity: 'bronze' },
  95:  { ko: '골리앗', en: 'Goliath', file: 'Goliath', rarity: 'bronze' },
  96:  { ko: '시즈엔진', en: 'Siege Engine', file: 'Siege_Engine', rarity: 'silver' },
  97:  { ko: '하이페리온 프라임', en: 'Hyperion Prime', file: 'Hyperion_Prime', rarity: 'silver' },
  98:  { ko: '아이언클래드', en: 'Ironclad', file: 'Ironclad', rarity: 'silver' },
  99:  { ko: '마기테크 골렘', en: 'Magitech Golem', file: 'Magitech_Golem', rarity: 'gold' },
  100: { ko: '오메가 웨폰', en: 'Omega Weapon', file: 'Omega_Weapon', rarity: 'gold' },
  101: { ko: '드레이크', en: 'Drake', file: 'Drake', rarity: 'silver' },
  102: { ko: '와이버니', en: 'Wyverny', file: 'Wyverny', rarity: 'silver' },
  103: { ko: '네더드래곤', en: 'Netherdragon', file: 'Netherdragon', rarity: 'gold' },
  104: { ko: '바하무트', en: 'Bahamut', file: 'Bahamut', rarity: 'gold' },
  105: { ko: '스파이크드래곤', en: 'Spikedragon', file: 'Spikedragon', rarity: 'gold' },
  106: { ko: '어스드래곤 테라', en: 'Earth Dragon Terra', file: 'Earth_Dragon_Terra', rarity: 'gold' },
  107: { ko: '이셀라', en: 'Ysela', file: 'Ysela', rarity: 'gold' },
  108: { ko: '알렉스트라', en: 'Alexstra', file: 'Alexstra', rarity: 'gold' },
  109: { ko: '말리곤', en: 'Malygon', file: 'Malygon', rarity: 'gold' },
  110: { ko: '드레드윙', en: 'Dreadwing', file: 'Dreadwing', rarity: 'gold' },
};

// ─── Inline OpenCode Terminal-Flat SVG Data-URI Generator ────────────────────

export function generateTerminalFlatPlaceholder(name: string, faction: string): string {
  const pal = FACTION_PALETTES[faction] || { bg: '#201d1d', text: '#fdfcfc', border: '#646262' };
  const safeName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="296" viewBox="0 0 256 296">
  <rect width="256" height="296" fill="#fdfcfc" stroke="#201d1d" stroke-width="2"/>
  <rect x="8" y="8" width="240" height="280" fill="${pal.bg}" stroke="${pal.border}" stroke-width="1"/>
  <text x="128" y="140" fill="${pal.text}" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${safeName}</text>
  <text x="128" y="168" fill="${pal.text}" font-family="monospace" font-size="11" opacity="0.8" text-anchor="middle">[${faction.toUpperCase()}]</text>
  <rect x="16" y="248" width="224" height="24" fill="#201d1d" rx="2"/>
  <text x="128" y="264" fill="#fdfcfc" font-family="monospace" font-size="10" text-anchor="middle">SNSHERO REVOLUTION</text>
</svg>`.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ─── Lookup Utilities ────────────────────────────────────────────────────────

export function getCharacterAsset(id: number): CharacterAssetMeta {
  const validId = Math.max(1, Math.min(110, Number(id) || 1));
  const pad3 = String(validId).padStart(3, '0');
  const base = CHARACTER_BASE_NAMES[validId] || {
    ko: `영웅 ${pad3}`,
    en: `Hero ${pad3}`,
    file: `Hero_${pad3}`,
    rarity: 'bronze',
  };
  const faction = getFactionForCardId(validId);

  // Sprite coords calculation for cards1.png (1-100) or cards2.png (101-110)
  const isCards2 = validId >= 101;
  const sourceSheet: '/cards1.png' | '/cards2.png' = isCards2 ? '/cards2.png' : '/cards1.png';
  const offsetIndex = isCards2 ? (validId - 101) % 100 : (validId - 1) % 100;
  const col = offsetIndex % 10;
  const row = Math.floor(offsetIndex / 10);
  const xPercent = col * (100 / 9);
  const yPercent = row * (100 / 9);

  return {
    id: validId,
    code: `NO.${pad3}`,
    nameKo: base.ko,
    nameEn: base.en,
    faction,
    rarity: base.rarity,
    cutoutUrl: `/anime-character-sheets/cutouts/${pad3}_${base.file}.png`,
    bustPngUrl: `/anime-character-sheets/busts/${pad3}_bust.png`,
    bustJpgUrl: `/anime-character-sheets/busts/${pad3}_bust.jpg`,
    seatUrl: `/seat/${base.file}.png`,
    sdUrl: `/seat/${base.file}.png`,
    spriteSheet: sourceSheet,
    spriteCoords: {
      sourceSheet,
      col,
      row,
      xPercent,
      yPercent,
    },
    fallbackSvgDataUri: generateTerminalFlatPlaceholder(base.ko, faction),
  };
}

export function getCutoutUrl(cardId: number): string {
  return getCharacterAsset(cardId).cutoutUrl;
}

export function getBustUrl(cardId: number, format: 'png' | 'jpg' = 'png'): string {
  const asset = getCharacterAsset(cardId);
  return format === 'jpg' ? asset.bustJpgUrl : asset.bustPngUrl;
}

export function getSdUrl(cardId: number): string {
  return getCharacterAsset(cardId).sdUrl;
}

/**
 * Returns prioritized fallback list for any tier:
 *   - '7head': cutoutUrl -> bustPngUrl -> seatUrl -> fallbackSvg
 *   - 'bust': bustPngUrl -> bustJpgUrl -> seatUrl -> fallbackSvg
 *   - '3head': sdUrl (/seat/..) -> spriteSheet -> fallbackSvg
 */
export function getAssetCandidates(cardId: number, tier: CharacterVisualTier): string[] {
  const asset = getCharacterAsset(cardId);
  if (tier === '7head') {
    return [asset.cutoutUrl, asset.bustPngUrl, asset.seatUrl, asset.fallbackSvgDataUri];
  }
  if (tier === 'bust') {
    return [asset.bustPngUrl, asset.bustJpgUrl, asset.seatUrl, asset.fallbackSvgDataUri];
  }
  return [asset.sdUrl, asset.seatUrl, asset.spriteSheet, asset.fallbackSvgDataUri];
}

/**
 * Attaches automatic error fallback handler to an <img> element.
 */
export function attachImageFallback(
  img: HTMLImageElement,
  cardId: number,
  tier: CharacterVisualTier = '7head',
): void {
  const candidates = getAssetCandidates(cardId, tier);
  let currentIndex = 0;

  img.src = candidates[0];
  img.onerror = () => {
    currentIndex++;
    if (currentIndex < candidates.length) {
      img.src = candidates[currentIndex];
    } else {
      img.onerror = null;
    }
  };
}

export function getAllCharacterAssets(): CharacterAssetMeta[] {
  return Array.from({ length: 110 }, (_, i) => getCharacterAsset(i + 1));
}
