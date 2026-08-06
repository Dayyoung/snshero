import { CARD_DATABASE } from '../cardDatabase';
import type { CharacterFaction, CharacterRarityTier } from '../types';
import { CHARACTER_IP_PROFILES, CHARACTER_RARITY_RULES } from './characterIp';
import { CHARACTER_ASSET_MANIFEST, getCharacterAssetManifestEntry, type CharacterAssetManifestEntry } from './characterAssetManifest';

export interface CharacterArtStyleGuide {
  coreStyle: string;
  allowedRatios: readonly ['5:7', '1:1', '16:9'];
  productionNotes: string[];
  forbiddenElements: string[];
  rarityGuide: Record<CharacterRarityTier, string>;
}

export interface CharacterArtPrompt {
  cardId: number;
  cardNameKo: string;
  cardNameEn: string;
  faction: CharacterFaction;
  rarityTier: CharacterRarityTier;
  personality: string;
  visualKeywords: string[];
  signatureShape: string;
  positivePromptKo: string;
  positivePromptEn: string;
  negativePrompt: string;
  thumbnailPrompt: string;
  webtoonPanelPrompt: string;
  animationPrompt: string;
  fallbackAsset: string;
  targetAssetPath: string;
  reviewChecklist: string[];
}

export interface CharacterArtValidationReport {
  totalCards: number;
  missingCardIds: number[];
  emptyPromptCardIds: number[];
  duplicateTargetPaths: string[];
  missingFallbackCardIds: number[];
  manifestMismatchCardIds: number[];
  isValid: boolean;
}

const FACTION_PROMPTS: Record<CharacterFaction, { ko: string; en: string }> = {
  water: {
    ko: '해양 심연 계열의 청량하고 투명한 바다 질감, 파도와 물방울, 시원한 푸른 계열',
    en: 'abyssal sea motif with crystalline water textures, waves, droplets, and a clean blue palette',
  },
  fire: {
    ko: '화염과 용암, 잿빛 연기, 뜨거운 열기와 주홍색 광원',
    en: 'flame, lava, ember smoke, intense heat, and scarlet lighting',
  },
  wind: {
    ko: '폭풍, 번개, 구름층, 공중 역동감과 바람의 궤적',
    en: 'storm fronts, lightning, cloud layers, aerial motion, and wind trails',
  },
  earth: {
    ko: '거친 암석, 뿌리, 수정, 산맥과 자연의 중량감',
    en: 'rough stone, roots, crystals, mountain forms, and grounded natural weight',
  },
  human: {
    ko: '철의 왕국, 깃발, 성채, 기사도와 군사 질서',
    en: 'the iron kingdom, banners, citadels, chivalry, and military order',
  },
  undead: {
    ko: '망자 군단, 그림자, 사념, 장례 의식과 차가운 보랏빛',
    en: 'an undead legion, shadows, soul residue, funerary ritual, and cold violet light',
  },
  elf: {
    ko: '달빛 숲, 고대 마법, 안개, 유려한 자연선과 신비한 분위기',
    en: 'moonlit forests, ancient magic, mist, flowing natural lines, and mystical atmosphere',
  },
  dwarf: {
    ko: '대장간 불꽃, 금속 망치질, 금광과 지하 공방의 견고함',
    en: 'forge sparks, hammer strikes, gold seams, and the sturdiness of an underground workshop',
  },
  monster: {
    ko: '야성의 이빨과 발톱, 거친 생태계, 포효와 포식의 긴장감',
    en: 'feral fangs and claws, a savage ecosystem, and the tension of a predator on the hunt',
  },
  robot: {
    ko: '기계 도시, 회로, 기어, 네온 전류와 금속의 정밀함',
    en: 'a machine city, circuitry, gears, neon current, and metallic precision',
  },
  dragon: {
    ko: '고대 비늘, 비행 궤적, 왕좌급 위압감, 보물과 하늘의 압도감',
    en: 'ancient scales, flight trails, throne-level presence, treasure hoards, and dominating skies',
  },
};

export const CHARACTER_ART_STYLE_GUIDE: CharacterArtStyleGuide = {
  coreStyle: 'Premium mobile card game key art with a sharp silhouette, collectible character focus, and a middle ground between semi-realism and animation. Keep compositions readable, dramatic, and not overly busy.',
  allowedRatios: ['5:7', '1:1', '16:9'] as const,
  productionNotes: [
    'Card art should feel premium and instantly readable on a phone screen.',
    'Keep the face, weapon, and signature shape readable even at thumbnail size.',
    'Use faction color accents and rarity lighting to create visual hierarchy.',
    'If lowSpecMode is true, prefer a static fallback image over complex motion.',
  ],
  forbiddenElements: [
    'blurry background',
    'text inside the image',
    'logo watermark',
    'overly dense micro-patterns',
    'real trademarked or copyrighted character mimicry',
    'crowded UI frames or poster typography',
  ],
  rarityGuide: {
    bronze: 'clean silhouette first, minimal effects, simple readability',
    silver: 'add weapon detail and a soft aura without clutter',
    gold: 'expand the story-rich background and luminous effects',
    platinum: 'introduce premium foil reflections, cool metallic polish, and refined aura layering',
    diamond: 'push crystal-cut highlights, spectral edge lighting, and showcase-grade framing without overloading the silhouette',
    legendary: 'stage the character like a seasonal boss with cinematic spectacle',
  },
};

export const RARITY_FRAME_PROMPTS: Record<CharacterRarityTier, { ko: string; en: string }> = {
  bronze: {
    ko: '매트 구리 프레임, 단순한 가장자리, 읽기 쉬운 초심자용 수집 카드',
    en: 'matte copper frame, simple edge treatment, beginner-friendly collectible card',
  },
  silver: {
    ko: '광택 있는 은 프레임, 얕은 룬 각인, 무기와 오라가 돋보이는 중간 단계',
    en: 'polished silver frame, subtle rune engraving, medium-tier card with weapon and aura emphasis',
  },
  gold: {
    ko: '장식적인 금 프레임, 보석 인레이, 배경 서사와 빛 효과를 강조',
    en: 'ornate gold frame, gem inlays, and stronger background storytelling with luminous effects',
  },
  platinum: {
    ko: '차가운 플래티넘 프레임, 정교한 포일 라인, 고급스러운 금속 광택과 안정된 오라 연출',
    en: 'cool platinum frame, refined foil linework, premium metallic polish, and controlled aura presentation',
  },
  diamond: {
    ko: '다면체 다이아 프레임, 스펙트럼 엣지 라이트, 쇼케이스급 크리스탈 하이라이트',
    en: 'faceted diamond frame, spectral edge lighting, and showcase-grade crystal highlights',
  },
  legendary: {
    ko: '우주적 프리즘 프레임, 별자리 모티프, 시즌 보스급 연출',
    en: 'cosmic prismatic frame, constellation motifs, and season-boss-level presentation',
  },
};

export const FACTION_VISUAL_PROMPTS = FACTION_PROMPTS;

const NEGATIVE_PROMPT = [
  'text inside the image',
  'written words',
  'letters',
  'alphabets',
  'typography',
  'captions',
  'labels',
  'titles',
  'card borders or frames with text boxes',
  'blurry background',
  'watermark',
  'logo',
  'copyrighted character mimicry',
  'tiny unreadable details',
  'overly complex micro-patterns',
  'extra limbs',
  'cropped face',
  'cut off hands',
  'poster typography',
  'UI frame',
  'low contrast silhouette',
].join(', ');

function formatCardId(cardId: number): string {
  return String(cardId).padStart(3, '0');
}

function getCardName(cardId: number, locale: 'ko' | 'en'): string {
  const card = CARD_DATABASE[cardId];
  if (!card) return locale === 'ko' ? `카드 ${formatCardId(cardId)}` : `Card ${formatCardId(cardId)}`;
  return locale === 'ko' ? card.title : card.title_dis;
}

function getCardDisplayName(cardId: number): string {
  return CARD_DATABASE[cardId]?.title_dis ?? `Card ${formatCardId(cardId)}`;
}

function getCardLore(cardId: number, locale: 'ko' | 'en'): string {
  const card = CARD_DATABASE[cardId];
  if (!card) return '';
  return locale === 'ko' ? (card.lore_ko ?? '') : (card.lore_en ?? '');
}

function getPromptText(cardId: number, locale: 'ko' | 'en'): string {
  const card = CARD_DATABASE[cardId];
  const profile = CHARACTER_IP_PROFILES[cardId];
  if (!card || !profile) {
    return locale === 'ko'
      ? `카드 ${formatCardId(cardId)} 캐릭터 리디자인, 프리미엄 모바일 카드게임 원화, 선명한 실루엣, 과도한 복잡도 금지`
      : `Card ${formatCardId(cardId)} redesign, premium mobile card game illustration, clean silhouette, no excessive complexity`;
  }

  const factionPrompt = FACTION_PROMPTS[profile.faction][locale];
  const rarityPrompt = RARITY_FRAME_PROMPTS[profile.rarityTier][locale];
  const title = getCardName(cardId, locale);
  const displayName = getCardDisplayName(cardId);
  const art = profile.artDirection;
  const pose = art.poseKeywords.join(locale === 'ko' ? '·' : ', ');
  const background = art.backgroundKeywords.join(locale === 'ko' ? '·' : ', ');
  const rarityRule = CHARACTER_RARITY_RULES[profile.rarityTier];
  const lore = getCardLore(cardId, locale);
  const loreSuffix = lore ? (locale === 'ko' ? `서사 힌트: ${lore}` : `Lore hook: ${lore}`) : '';

  if (locale === 'ko') {
    return [
      `${title} 캐릭터 리디자인.`,
      `${factionPrompt}, ${rarityPrompt}, ${profile.personality} 성격, ${profile.archetype} 포지션, ${pose} 포즈, ${background} 배경, ${art.lightingStyle} 조명, ${art.cameraAngle} 시점.`,
      `프리미엄 모바일 카드게임 원화, 반실사와 애니메이션의 중간, 선명한 실루엣, ${rarityRule.frameMaterial}, ${rarityRule.lightEffect}, 5:7 카드 일러스트, 캐릭터 중심 구도, 과도한 복잡도 금지.`,
      loreSuffix,
    ].filter(Boolean).join(' ');
  }

  return [
    `${displayName} redesign.`,
    `${factionPrompt}, ${rarityPrompt}, ${profile.personality} tone, ${profile.archetype} role, ${pose} pose, ${background} background, ${art.lightingStyle} lighting, ${art.cameraAngle} camera.`,
    `Premium mobile card game key art, semi-realistic anime balance, sharp silhouette, ${rarityRule.frameMaterial}, ${rarityRule.lightEffect}, 5:7 composition, character-first layout, no excessive complexity.`,
    'completely clean background, absolutely no text, words, or letters inside the image frame.',
    loreSuffix,
  ].filter(Boolean).join(' ');
}

function getThumbnailPrompt(cardId: number): string {
  const card = CARD_DATABASE[cardId];
  const profile = CHARACTER_IP_PROFILES[cardId];
  if (!card || !profile) {
    return `1:1 social thumbnail for Card ${formatCardId(cardId)}, centered portrait, simple background, high contrast, no text, no watermark`;
  }

  const title = getCardDisplayName(cardId);
  const factionPrompt = FACTION_PROMPTS[profile.faction].en;
  const rarityPrompt = RARITY_FRAME_PROMPTS[profile.rarityTier].en;
  return `${title} 1:1 social thumbnail, centered portrait, simplified story background, high-contrast rim light, readable at small size, ${factionPrompt}, ${rarityPrompt}, no text, no watermark`;
}

function getWebtoonPanelPrompt(cardId: number): string {
  const card = CARD_DATABASE[cardId];
  const profile = CHARACTER_IP_PROFILES[cardId];
  if (!card || !profile) {
    return `16:9 cinematic webtoon panel for Card ${formatCardId(cardId)}, dynamic action beat, story-focused background, no text, no watermark`;
  }

  const title = getCardDisplayName(cardId);
  const art = profile.artDirection;
  const pose = art.poseKeywords.join(', ');
  const background = art.backgroundKeywords.join(', ');
  return `${title} 16:9 cinematic webtoon panel, dynamic action beat, narrative background, ${pose} pose, ${background} setting, leave space for speech bubbles, no text inside the image, no watermark`;
}

function getAnimationPrompt(cardId: number): string {
  const card = CARD_DATABASE[cardId];
  const profile = CHARACTER_IP_PROFILES[cardId];
  if (!card || !profile) {
    return `Animate Card ${formatCardId(cardId)} with a subtle idle loop only; if lowSpecMode is true, use a static fallback and no particles.`;
  }

  const title = getCardDisplayName(cardId);
  const animation = profile.animationProfile;
  const lowSpecFallback = getCharacterAssetManifestEntry(cardId).lowSpecFallbackAssetPath;
  return `${title} animation concept: ${animation.idleAnimation} idle loop, ${animation.attackAnimation} attack motion, ${animation.specialEffect} as the signature VFX, ${animation.frameRate}fps target. If lowSpecMode is true, disable particle trails and switch to a static fallback using ${lowSpecFallback}.`;
}

function getVisualKeywords(cardId: number): string[] {
  const manifest = getCharacterAssetManifestEntry(cardId);
  const profile = CHARACTER_IP_PROFILES[cardId];
  const factionKeywords = FACTION_PROMPTS[manifest.faction].en
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 3);
  const poseKeywords = profile?.artDirection.poseKeywords ?? [];

  return Array.from(new Set([...factionKeywords, ...poseKeywords, profile?.archetype ?? ''].filter(Boolean)));
}

function getSignatureShape(cardId: number): string {
  const profile = CHARACTER_IP_PROFILES[cardId];
  const silhouetteStrength = profile?.artDirection.silhouetteStrength ?? 'moderate';
  const poseKeyword = profile?.artDirection.poseKeywords[0] ?? 'balanced';
  const archetype = profile?.archetype ?? 'adventurer';

  return `${silhouetteStrength} silhouette, ${poseKeyword} ${archetype} pose`;
}

function getReviewChecklist(cardId: number, manifest: CharacterAssetManifestEntry): string[] {
  const card = CARD_DATABASE[cardId];
  const profile = CHARACTER_IP_PROFILES[cardId];
  const title = card?.title_dis ?? `Card ${formatCardId(cardId)}`;
  const factionLabel = FACTION_PROMPTS[profile?.faction ?? 'human'].en;
  const rarityLabel = RARITY_FRAME_PROMPTS[profile?.rarityTier ?? 'bronze'].en;
  return [
    `${title}: faction and rarity read as ${factionLabel} / ${rarityLabel}.`,
    'Silhouette, face, and weapon stay readable at thumbnail size.',
    'No text, watermark, logo, or extra UI frame appears inside the art.',
    `Target asset path resolves to ${manifest.frontAssetPath}.`,
    `Low-spec fallback stays static via ${manifest.lowSpecFallbackAssetPath}.`,
  ];
}

function buildCharacterArtPrompt(cardId: number): CharacterArtPrompt {
  const manifest = getCharacterAssetManifestEntry(cardId);
  return {
    cardId,
    cardNameKo: manifest.cardNameKo,
    cardNameEn: manifest.cardNameEn,
    faction: manifest.faction,
    rarityTier: manifest.rarityTier,
    personality: CHARACTER_IP_PROFILES[cardId]?.personality ?? 'balanced',
    visualKeywords: getVisualKeywords(cardId),
    signatureShape: getSignatureShape(cardId),
    positivePromptKo: getPromptText(cardId, 'ko'),
    positivePromptEn: getPromptText(cardId, 'en'),
    negativePrompt: NEGATIVE_PROMPT,
    thumbnailPrompt: getThumbnailPrompt(cardId),
    webtoonPanelPrompt: getWebtoonPanelPrompt(cardId),
    animationPrompt: getAnimationPrompt(cardId),
    fallbackAsset: manifest.fallbackAssetPath,
    targetAssetPath: manifest.frontAssetPath,
    reviewChecklist: getReviewChecklist(cardId, manifest),
  };
}

export const CHARACTER_ART_PROMPTS: Record<number, CharacterArtPrompt> = Object.fromEntries(
  Array.from({ length: 110 }, (_, index) => {
    const cardId = index + 1;
    return [cardId, buildCharacterArtPrompt(cardId)];
  }),
) as Record<number, CharacterArtPrompt>;

export function getCharacterArtPrompt(cardId: number): CharacterArtPrompt {
  return CHARACTER_ART_PROMPTS[cardId] ?? buildCharacterArtPrompt(cardId);
}

export function validateCharacterArtPrompts(): CharacterArtValidationReport {
  const missingCardIds: number[] = [];
  const emptyPromptCardIds: number[] = [];
  const duplicateTargetPaths: string[] = [];
  const missingFallbackCardIds: number[] = [];
  const manifestMismatchCardIds: number[] = [];
  const targetPathCounts = new Map<string, number>();

  for (let cardId = 1; cardId <= 110; cardId += 1) {
    const prompt = CHARACTER_ART_PROMPTS[cardId];
    const manifest = CHARACTER_ASSET_MANIFEST[cardId];

    if (!prompt || !manifest) {
      missingCardIds.push(cardId);
      continue;
    }

    const requiredText = [
      prompt.cardNameKo,
      prompt.cardNameEn,
      prompt.signatureShape,
      prompt.positivePromptKo,
      prompt.positivePromptEn,
      prompt.negativePrompt,
      prompt.thumbnailPrompt,
      prompt.webtoonPanelPrompt,
      prompt.animationPrompt,
      prompt.targetAssetPath,
      prompt.fallbackAsset,
    ];

    if (
      requiredText.some((text) => text.trim().length === 0)
      || prompt.reviewChecklist.length === 0
      || prompt.visualKeywords.length === 0
    ) {
      emptyPromptCardIds.push(cardId);
    }

    if (prompt.targetAssetPath.trim().length === 0 || prompt.fallbackAsset.trim().length === 0) {
      missingFallbackCardIds.push(cardId);
    }

    if (prompt.targetAssetPath !== manifest.frontAssetPath || prompt.fallbackAsset !== manifest.fallbackAssetPath) {
      manifestMismatchCardIds.push(cardId);
    }

    const currentCount = targetPathCounts.get(prompt.targetAssetPath) ?? 0;
    targetPathCounts.set(prompt.targetAssetPath, currentCount + 1);
  }

  for (const [targetPath, count] of targetPathCounts.entries()) {
    if (count > 1) duplicateTargetPaths.push(targetPath);
  }

  return {
    totalCards: 110,
    missingCardIds,
    emptyPromptCardIds,
    duplicateTargetPaths,
    missingFallbackCardIds,
    manifestMismatchCardIds,
    isValid:
      missingCardIds.length === 0 &&
      emptyPromptCardIds.length === 0 &&
      duplicateTargetPaths.length === 0 &&
      missingFallbackCardIds.length === 0 &&
      manifestMismatchCardIds.length === 0,
  };
}
