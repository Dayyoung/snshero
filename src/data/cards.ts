import { CardItem, CardElement, CardGrade } from '../types';

const ELEMENTS: CardElement[] = ['Water', 'Fire', 'Earth', 'Wind', 'Light', 'Dark'];
const GRADES: CardGrade[] = ['N', 'R', 'SR', 'SSR', 'UR'];

// Card archetype definitions
const HERO_TEMPLATES = [
  { name: 'Aqua Puffer', nameKo: '물방구 복어', title: '버블 가디언', element: 'Water' as CardElement, emoji: '🐡', skill: '버블 쉴드' },
  { name: 'Flame Kitten', nameKo: '불꽃 고양이', title: '화염의 발톱', element: 'Fire' as CardElement, emoji: '🐱', skill: '불꽃 할퀴기' },
  { name: 'Sprout Golem', nameKo: '새싹 골렘', title: '대지의 보호자', element: 'Earth' as CardElement, emoji: '🌱', skill: '뿌리 얽기' },
  { name: 'Breeze Falcon', nameKo: '산들바람 매', title: '질풍의 날개', element: 'Wind' as CardElement, emoji: '🦅', skill: '회오리 강타' },
  { name: 'Solar Pixie', nameKo: '태양 요정', title: '빛의 인도자', element: 'Light' as CardElement, emoji: '🧚', skill: '성스러운 빛' },
  { name: 'Shadow Pup', nameKo: '그림자 강아지', title: '심연의 정찰병', element: 'Dark' as CardElement, emoji: '🐶', skill: '어둠의 물기' },
  { name: 'Tide Turtle', nameKo: '파도 거북이', title: '해일 방패병', element: 'Water' as CardElement, emoji: '🐢', skill: '조수 방벽' },
  { name: 'Magma Drake', nameKo: '마그마 드레이크', title: '용암 숨결', element: 'Fire' as CardElement, emoji: '🐉', skill: '화염 폭풍' },
  { name: 'Stone Bear', nameKo: '바위 곰', title: '바위 요새', element: 'Earth' as CardElement, emoji: '🐻', skill: '지진 분쇄' },
  { name: 'Thunder Fox', nameKo: '천둥 여우', title: '번개 질주', element: 'Wind' as CardElement, emoji: '🦊', skill: '벼락 섬광' },
  { name: 'Glory Pegasus', nameKo: '영광의 페가수스', title: '천공의 기사', element: 'Light' as CardElement, emoji: '🦄', skill: '천상의 돌격' },
  { name: 'Night Raven', nameKo: '밤의 갈가마귀', title: '망령의 눈동자', element: 'Dark' as CardElement, emoji: '🦅', skill: '환각의 날개' },
  { name: 'Coral Slime', nameKo: '산호 슬라임', title: '말랑한 물방울', element: 'Water' as CardElement, emoji: '💧', skill: '물방울 튀기기' },
  { name: 'Blaze Bunny', nameKo: '작열 토끼', title: '당근 폭탄마', element: 'Fire' as CardElement, emoji: '🐰', skill: '불꽃 킥' },
  { name: 'Flora Deer', nameKo: '꽃사슴 정령', title: '생명의 숲지기', element: 'Earth' as CardElement, emoji: '🦌', skill: '치유의 꽃가루' },
  { name: 'Gale Owl', nameKo: '돌풍 부엉이', title: '밤바람 지혜관', element: 'Wind' as CardElement, emoji: '🦉', skill: '초음파 파동' },
  { name: 'Aurora Spirit', nameKo: '오로라 정령', title: '무지개 장막', element: 'Light' as CardElement, emoji: '✨', skill: '프리즘 실드' },
  { name: 'Eclipse Bat', nameKo: '일식 박쥐', title: '어둠의 흡혈귀', element: 'Dark' as CardElement, emoji: '🦇', skill: '생명력 흡수' },
  { name: 'Frost Whale', nameKo: '빙하 고래', title: '동결의 제왕', element: 'Water' as CardElement, emoji: '🐳', skill: '빙하 해일' },
  { name: 'Inferno Phoenix', nameKo: '인페르노 불사조', title: '불사의 화신', element: 'Fire' as CardElement, emoji: '🔥', skill: '화염 환생' },
  { name: 'Titan Rhino', nameKo: '티탄 코뿔소', title: '철벽의 돌파병', element: 'Earth' as CardElement, emoji: '🦏', skill: '충격파 돌진' },
  { name: 'Zephyr Leopard', nameKo: '제피르 표범', title: '음속의 암살자', element: 'Wind' as CardElement, emoji: '🐆', skill: '진공 베기' },
];

export const ALL_CARDS: CardItem[] = Array.from({ length: 110 }, (_, index) => {
  const cardNo = index + 1;
  const template = HERO_TEMPLATES[index % HERO_TEMPLATES.length];
  const gradeCycle: CardGrade[] = ['N', 'N', 'R', 'R', 'SR', 'SSR', 'UR'];
  const grade = gradeCycle[index % gradeCycle.length];
  const element = ELEMENTS[index % ELEMENTS.length];

  // Grade multiplier for stats
  const gradeMultipliers: Record<CardGrade, number> = {
    N: 1.0,
    R: 1.3,
    SR: 1.7,
    SSR: 2.2,
    UR: 2.8,
  };
  const mult = gradeMultipliers[grade];

  const baseHp = Math.round((280 + (index % 12) * 25) * mult);
  const baseAtk = Math.round((45 + (index % 15) * 8) * mult);
  const baseDef = Math.round((25 + (index % 10) * 5) * mult);
  const baseSpd = Math.round((30 + (index % 8) * 6) * (0.9 + mult * 0.1));
  const critRate = Math.min(45, Math.round(5 + (index % 10) * 2 * (mult * 0.6)));

  const accentColors: Record<CardElement, string> = {
    Water: '#3b82f6',
    Fire: '#ef4444',
    Earth: '#10b981',
    Wind: '#06b6d4',
    Light: '#f59e0b',
    Dark: '#8b5cf6',
  };

  const nameVariant = index >= HERO_TEMPLATES.length 
    ? `${template.name} Mk-${Math.floor(index / HERO_TEMPLATES.length) + 1}`
    : template.name;
    
  const nameKoVariant = index >= HERO_TEMPLATES.length 
    ? `${template.nameKo} ${Math.floor(index / HERO_TEMPLATES.length) + 1}세`
    : template.nameKo;

  return {
    id: `card_${cardNo}`,
    no: cardNo,
    name: nameVariant,
    nameKo: nameKoVariant,
    title: template.title,
    element: element,
    grade: grade,
    hp: baseHp,
    atk: baseAtk,
    def: baseDef,
    spd: baseSpd,
    critRate: critRate,
    avatarIcon: template.emoji,
    colorAccent: accentColors[element],
    description: `SNS히어로 레볼루션 ${cardNo}번째 히어로. ${element} 속성의 강력한 에너지를 다루며 아군을 수호합니다.`,
    skill: {
      id: `skill_${cardNo}`,
      name: template.skill,
      description: `적 1명에게 공격력의 ${Math.round(120 * mult)}% 피해를 입히고 속성 추가 효과를 발동합니다.`,
      cooldown: grade === 'UR' ? 2 : grade === 'SSR' ? 3 : 4,
      powerMultiplier: 1.2 * mult,
      effectType: index % 5 === 0 ? 'heal' : index % 4 === 0 ? 'shield' : 'damage',
    },
  };
});

// Helper dictionary for instant card lookups
export const CARDS_BY_ID: Record<string, CardItem> = ALL_CARDS.reduce((acc, card) => {
  acc[card.id] = card;
  return acc;
}, {} as Record<string, CardItem>);

// Initial starter card instances given to every new player
export const STARTER_CARD_IDS = ['card_1', 'card_2', 'card_3', 'card_4', 'card_5', 'card_6', 'card_7', 'card_8'];
