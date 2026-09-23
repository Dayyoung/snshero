import type { CharacterFaction, CharacterIpProfile, CharacterRarityTier } from '../types';

export interface FactionDef {
  id: CharacterFaction;
  nameKo: string;
  nameEn: string;
  primaryColor: string;
  accentColor: string;
  visualKeywords: string[];
  descriptionKo: string;
  descriptionEn: string;
}

export interface RarityRule {
  tier: CharacterRarityTier;
  nameKo: string;
  nameEn: string;
  frameMaterial: string;
  lightEffect: string;
  dropRatePercent: number;
}

export const CHARACTER_FACTIONS: Record<CharacterFaction, FactionDef> = {
  water: {
    id: 'water',
    nameKo: '수류 연맹',
    nameEn: 'Abyssal Current',
    primaryColor: '#0284c7',
    accentColor: '#38bdf8',
    visualKeywords: ['ocean', 'crystal', 'water', 'tsunami', 'azure'],
    descriptionKo: '심해의 깊은 냉기와 지혜를 품은 연맹',
    descriptionEn: 'Alliance wielding deep abyssal chill and crystalline hydro forces',
  },
  fire: {
    id: 'fire',
    nameKo: '화염 성채',
    nameEn: 'Volcanic Citadel',
    primaryColor: '#e11d48',
    accentColor: '#fb7185',
    visualKeywords: ['flame', 'magma', 'heat', 'furnace', 'ember'],
    descriptionKo: '꺼지지 않는 불꽃과 분노의 대장간',
    descriptionEn: 'Citadel of eternal magma and fiery wrath',
  },
  wind: {
    id: 'wind',
    nameKo: '질풍 기사단',
    nameEn: 'Gale Knights',
    primaryColor: '#059669',
    accentColor: '#34d399',
    visualKeywords: ['gale', 'feather', 'speed', 'storm', 'aerial'],
    descriptionKo: '하늘과 번개를 가르는 가장 빠른 자들',
    descriptionEn: 'High-speed interceptors of tempest winds and lightning',
  },
  earth: {
    id: 'earth',
    nameKo: '대지 수호단',
    nameEn: 'Terra Wardens',
    primaryColor: '#d97706',
    accentColor: '#fbbf24',
    visualKeywords: ['stone', 'mountain', 'bedrock', 'roots', 'shield'],
    descriptionKo: '흔들리지 않는 대지와 암석의 요새',
    descriptionEn: 'Immovable fortress of bedrock and deep geological force',
  },
  human: {
    id: 'human',
    nameKo: '인류 방위군',
    nameEn: 'Humanity Aegis',
    primaryColor: '#4f46e5',
    accentColor: '#818cf8',
    visualKeywords: ['alloy', 'tactical', 'heroic', 'insignia', 'tech'],
    descriptionKo: '기술과 불굴의 의지로 대륙을 지키는 히어로들',
    descriptionEn: 'Heroic vanguard guarding civilization with tech and resolve',
  },
  undead: {
    id: 'undead',
    nameKo: '불멸 망령회',
    nameEn: 'Soul Revenants',
    primaryColor: '#7c3aed',
    accentColor: '#a78bfa',
    visualKeywords: ['spectral', 'ghost', 'soul', 'shadow', 'relic'],
    descriptionKo: '죽음을 초월한 영혼과 고대 망령의 힘',
    descriptionEn: 'Spirits and spectral entities commanding transcendental soul energy',
  },
  elf: {
    id: 'elf',
    nameKo: '성스러운 엘프',
    nameEn: 'Sylph Elves',
    primaryColor: '#10b981',
    accentColor: '#6ee7b7',
    visualKeywords: ['forest', 'moon', 'nature', 'bow', 'mystic'],
    descriptionKo: '태고의 숲과 달빛의 축복을 받은 정령들',
    descriptionEn: 'Ancient forest custodians imbued with lunar mysticism',
  },
  dwarf: {
    id: 'dwarf',
    nameKo: '드워프 공방',
    nameEn: 'Forge Dwarves',
    primaryColor: '#b45309',
    accentColor: '#f59e0b',
    visualKeywords: ['hammer', 'anvil', 'steam', 'iron', 'gear'],
    descriptionKo: '최고의 기계와 강철을 빚어내는 장인들',
    descriptionEn: 'Master smiths of heavy steel and colossal machinery',
  },
  monster: {
    id: 'monster',
    nameKo: '야수 군단',
    nameEn: 'Feral Beasts',
    primaryColor: '#dc2626',
    accentColor: '#f87171',
    visualKeywords: ['claw', 'fang', 'roar', 'wild', 'primal'],
    descriptionKo: '통제되지 않는 야생의 파괴적 본능',
    descriptionEn: 'Unbridled primal predators reigning over untamed wilderness',
  },
  robot: {
    id: 'robot',
    nameKo: '사이버 코어',
    nameEn: 'Cybernetic Core',
    primaryColor: '#0ea5e9',
    accentColor: '#38bdf8',
    visualKeywords: ['cyber', 'neon', 'matrix', 'laser', 'android'],
    descriptionKo: '인공지능과 자율 기계의 초지능 집합체',
    descriptionEn: 'Autonomous cybernet and synthetic super-intelligence',
  },
  dragon: {
    id: 'dragon',
    nameKo: '용혈 황혼단',
    nameEn: 'Draconic Sovereignty',
    primaryColor: '#9333ea',
    accentColor: '#c084fc',
    visualKeywords: ['dragon', 'scale', 'starfire', 'ancient', 'dreadnought'],
    descriptionKo: '태초부터 군림해온 전설적인 용들의 지배',
    descriptionEn: 'Primordial dragons possessing catastrophic starfire supremacy',
  },
};

export const CHARACTER_RARITY_RULES: Record<CharacterRarityTier, RarityRule> = {
  bronze: {
    tier: 'bronze',
    nameKo: '브론즈',
    nameEn: 'Bronze',
    frameMaterial: 'Weathered Bronze Alloy',
    lightEffect: 'Soft ambient glimmer',
    dropRatePercent: 45,
  },
  silver: {
    tier: 'silver',
    nameKo: '실버',
    nameEn: 'Silver',
    frameMaterial: 'Brushed Silver Plate',
    lightEffect: 'Silvery sheen shimmer',
    dropRatePercent: 30,
  },
  gold: {
    tier: 'gold',
    nameKo: '골드',
    nameEn: 'Gold',
    frameMaterial: '24K Polished Gold Inlay',
    lightEffect: 'Gilded solar radiance',
    dropRatePercent: 15,
  },
  platinum: {
    tier: 'platinum',
    nameKo: '플래티넘',
    nameEn: 'Platinum',
    frameMaterial: 'Iridescent Platinum Weave',
    lightEffect: 'Prismatic diffraction flare',
    dropRatePercent: 7,
  },
  diamond: {
    tier: 'diamond',
    nameKo: '다이아몬드',
    nameEn: 'Diamond',
    frameMaterial: 'Crystalline Diamond facet',
    lightEffect: 'Spectral refraction prism pulse',
    dropRatePercent: 2.5,
  },
  legendary: {
    tier: 'legendary',
    nameKo: '레전더리',
    nameEn: 'Legendary',
    frameMaterial: 'Cosmic Stellar Relic',
    lightEffect: 'Omni chromatic nova aura',
    dropRatePercent: 0.5,
  },
};

const FACTIONS_ARRAY: CharacterFaction[] = [
  'water', 'fire', 'wind', 'earth', 'human', 
  'undead', 'elf', 'dwarf', 'monster', 'robot', 'dragon'
];

function determineRarity(id: number): CharacterRarityTier {
  if (id >= 100) return 'legendary';
  if (id >= 85) return 'diamond';
  if (id >= 65) return 'platinum';
  if (id >= 40) return 'gold';
  if (id >= 20) return 'silver';
  return 'bronze';
}

function generateProfiles(): Record<number, CharacterIpProfile> {
  const map: Record<number, CharacterIpProfile> = {};
  for (let id = 1; id <= 110; id++) {
    const faction = FACTIONS_ARRAY[(id - 1) % FACTIONS_ARRAY.length];
    const rarityTier = determineRarity(id);
    const rivalId = id === 110 ? 1 : id + 1;
    const allyId = id === 1 ? 110 : id - 1;

    map[id] = {
      cardId: id,
      faction,
      rarityTier,
      archetype: id % 3 === 0 ? 'Striker' : id % 3 === 1 ? 'Guardian' : 'Tactician',
      personality: id % 2 === 0 ? 'Disciplined and resolute' : 'Fierce and audacious',
      artDirection: {
        poseKeywords: ['dynamic combat stance', 'readied weapon', 'cinematic perspective'],
        lightingStyle: rarityTier === 'legendary' ? 'cosmic backlighting' : 'dramatic directional fill',
        cameraAngle: 'low-angle hero shot',
      },
      animationProfile: {
        animationIntensity: rarityTier === 'legendary' || rarityTier === 'diamond' ? 3 : rarityTier === 'platinum' ? 2 : 1,
      },
      marketingTags: [`#${faction}`, `#Hero_${id}`, `#${rarityTier}`],
      rivalIds: [rivalId],
      allyIds: [allyId],
      relationshipIds: [rivalId, allyId],
    };
  }
  return map;
}

export const CHARACTER_IP_PROFILES: Record<number, CharacterIpProfile> = generateProfiles();
export default CHARACTER_IP_PROFILES;
