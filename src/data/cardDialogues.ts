/**
 * cardDialogues.ts
 * 미션 게임 및 카드 수호자 결투 인트로 대사 데이터셋
 */

export interface MissionDialogue {
  quote: string;
  quote_en: string;
  taunt: string;
  taunt_en: string;
}

const ELEMENTAL_DIALOGUES: Record<string, MissionDialogue> = {
  fire: {
    quote: '불타는 영혼의 검이 너의 나약함을 심판할 것이다!',
    quote_en: 'The sword of the burning soul shall judge your weakness!',
    taunt: '겨우 이 정도 열기로 나를 꺾으려 들다니 어리석군.',
    taunt_en: 'Foolish to challenge me with such feeble heat.',
  },
  water: {
    quote: '깊은 심연의 격류가 모든 것을 삼켜버린다.',
    quote_en: 'The torrent of the deep abyss swallows everything.',
    taunt: '거친 파도 앞에 서 있는 네 모습을 직시해라.',
    taunt_en: 'Face yourself standing before the unyielding waves.',
  },
  wind: {
    quote: '보이지 않는 질풍이 네 호흡을 앗아갈 것이다.',
    quote_en: 'The unseen gale will rob you of your very breath.',
    taunt: '바람보다 느린 검은 결코 나를 벨 수 없다.',
    taunt_en: 'A blade slower than the wind can never touch me.',
  },
  earth: {
    quote: '대지의 무게를 견딜 수 있는 자만이 전진할 수 있다.',
    quote_en: 'Only those who bear the weight of earth may advance.',
    taunt: '굳건한 산맥처럼 나는 한 치도 물러서지 않는다.',
    taunt_en: 'Like steadfast mountains, I will not yield an inch.',
  },
  dragon: {
    quote: '태고의 용혈이 울부짖으며 전장을 불사른다!',
    quote_en: 'Ancient dragon blood roars, incinerating the battlefield!',
    taunt: '미천한 필멸자여, 용의 존엄 앞에 무릎을 꿇어라.',
    taunt_en: 'Humble mortal, kneel before the dignity of dragons.',
  },
  neutral: {
    quote: '운명의 카드가 열리는 순간, 승자는 결정된다.',
    quote_en: 'The moment destiny unfolds, the victor is decided.',
    taunt: '너의 전략을 어디 한번 증명해 보아라.',
    taunt_en: 'Go ahead and prove your strategy to me.',
  },
};

export function getMissionCardDialogue(cardId: number, element?: string): MissionDialogue {
  const elemKey = (element || 'neutral').toLowerCase();
  return ELEMENTAL_DIALOGUES[elemKey] || ELEMENTAL_DIALOGUES.neutral;
}

export default getMissionCardDialogue;
