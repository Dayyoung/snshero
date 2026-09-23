/**
 * 미션 게임 3초 인트로 대사 데이터베이스
 * 110개 히어로 카드 수호자별 속성 및 캐릭터 맞춤 대사
 */

export interface CardDialogueData {
  quote: string;
  quote_en: string;
  taunt: string;
  taunt_en: string;
}

// 속성별 기본 대사 풀
const ELEMENTAL_DIALOGUES: Record<string, CardDialogueData[]> = {
  fire: [
    {
      quote: "타오르는 불꽃의 카드를 감당할 수 있겠나? 잿더미가 될 준비를 해라!",
      quote_en: "Can you handle the blazing flames of my card? Prepare for ashes!",
      taunt: "내 열기 앞에서 네 패는 순식간에 녹아내릴 것이다!",
      taunt_en: "Before my heat, your cards will melt away in an instant!"
    },
    {
      quote: "지옥의 화염이 이 전장을 집어삼킨다! 덤벼라, 도전자여!",
      quote_en: "Hellfire consumes this battlefield! Come at me, challenger!",
      taunt: "네 전략은 내 화염 폭풍에 흔적조차 남지 않을 것이다.",
      taunt_en: "Your strategy won't leave a trace against my firestorm."
    }
  ],
  water: [
    {
      quote: "잔잔한 수면 뒤에 숨겨진 깊은 심연을 보여주마. 승리는 내 것이다!",
      quote_en: "I will show you the deep abyss beneath the calm waters. Victory is mine!",
      taunt: "거대한 해일처럼 네 카드를 단숨에 휩쓸어버리겠다.",
      taunt_en: "Like a giant tsunami, I will wash away all your cards!"
    },
    {
      quote: "얼어붙은 절대영도의 서리가 네 손발을 굳게 만들 것이다.",
      quote_en: "The frost of absolute zero will freeze your every move.",
      taunt: "냉정함을 잃는 순간, 패배는 이미 결정된 거다.",
      taunt_en: "The moment you lose your cool, your defeat is sealed."
    }
  ],
  wind: [
    {
      quote: "질풍보다 빠른 내 일격을 과연 막아낼 수 있을까? 눈을 떼지 마라!",
      quote_en: "Can you block my strike faster than the gale? Don't blink!",
      taunt: "바람을 읽지 못하는 자에게 미래의 승리는 없다.",
      taunt_en: "He who cannot read the wind has no future victory."
    },
    {
      quote: "폭풍우의 칼날이 전장을 가른다! 날카로운 결단을 보여줘라!",
      quote_en: "The blade of the storm cleaves the battlefield! Show your sharp resolve!",
      taunt: "네 턴이 오기도 전에 바람은 이미 승부를 정했다.",
      taunt_en: "Before your turn even comes, the wind has decided the duel."
    }
  ],
  earth: [
    {
      quote: "대지의 굳건한 방벽은 결코 무너지지 않는다. 힘으로 증명해봐라!",
      quote_en: "The steadfast wall of earth never crumbles. Prove yourself with strength!",
      taunt: "네 어설픈 공격으로는 바위 하나조차 흠집 낼 수 없다.",
      taunt_en: "Your weak attacks cannot even scratch a single boulder."
    },
    {
      quote: "태고의 대지가 울부짖는다! 진정한 무게감을 느껴보아라!",
      quote_en: "The ancient earth roars! Feel the true weight of nature!",
      taunt: "발버둥쳐봐야 대지 위의 손바닥 안일 뿐이다.",
      taunt_en: "Struggle all you want, you are still in the palm of the earth."
    }
  ],
  dragon: [
    {
      quote: "신성한 용의 포효가 울려 퍼진다! 진정한 듀얼리스트의 기량을 보여라!",
      quote_en: "The roar of the sacred dragon echoes! Show your true duelist caliber!",
      taunt: "용의 비늘 앞에서는 어떠한 기교도 통하지 않는다!",
      taunt_en: "Before dragon scales, no shallow trick shall ever pass!"
    },
    {
      quote: "빛과 드래곤의 가호가 나를 이끈다. 패배를 두려워하지 않는다면 오라!",
      quote_en: "The blessing of light and dragons guides me. Step forward if you dare!",
      taunt: "천공을 가르는 용익 아래 네 카드는 무력할 뿐이다.",
      taunt_en: "Beneath the dragon wings cleaving the sky, your cards are powerless."
    }
  ],
  undead: [
    {
      quote: "어둠 속에서 네 영혼과 패를 꿰뚫어 보았다. 깊은 절망을 맛보아라!",
      quote_en: "From the darkness, I pierced your soul and hand. Taste deep despair!",
      taunt: "그림자가 널 삼킬 때, 승패는 이미 뒤집혀 있을 것이다.",
      taunt_en: "When the shadows swallow you, the match will already be over."
    },
    {
      quote: "심연의 망령들이 네 실수를 기다리고 있다... 어디 한번 발버둥 쳐봐라.",
      quote_en: "The wraiths of the void await your mistake... Let us see you struggle.",
      taunt: "차가운 밤의 공포가 네 손끝을 떨리게 할 것이다.",
      taunt_en: "The cold dread of the night shall make your fingertips tremble."
    }
  ],
  neutral: [
    {
      quote: "도전자여, 이 카드의 진정한 잠재력을 깨울 자격이 있는지 시험해보겠다!",
      quote_en: "Challenger, I shall test if you are worthy to awaken this card's true potential!",
      taunt: "모든 패는 준비되었다. 망설임 없는 한 수를 보여줘라!",
      taunt_en: "All cards are ready. Show me a move without hesitation!"
    },
    {
      quote: "승리는 오직 철저한 전략과 직관을 지닌 자의 몫이다. 시작하자!",
      quote_en: "Victory belongs only to those with keen strategy and intuition. Let's begin!",
      taunt: "전략의 빈틈을 파고드는 것은 내 전문이지.",
      taunt_en: "Exploiting gaps in strategy is my true specialty."
    }
  ]
};

// 특정 주요 카드별 전용 시그니처 대사
const SPECIAL_CARD_DIALOGUES: Record<number, CardDialogueData> = {
  1: {
    quote: "히어로의 시작이자 심장! 내 카드와 진정한 공명을 이룰 수 있겠나?",
    quote_en: "The origin and heart of the Hero! Can you truly resonate with my card?",
    taunt: "첫 번째 히어로의 긍지를 똑똑히 보여주마!",
    taunt_en: "I'll show you the clear pride of the first hero!"
  },
  2: {
    quote: "암살의 그림자는 소리 없이 다가온다... 네 카드가 뒤집히는 순간을 기대해라.",
    quote_en: "The shadow of assassination arrives without sound... Watch your card flip.",
    taunt: "등 뒤를 조심해라, 듀얼리스트여.",
    taunt_en: "Watch your back, duelist."
  },
  3: {
    quote: "마법 공학의 결정체 메카 코어가 가동된다! 전력 출력 100%!",
    quote_en: "The magic engineering mecha core initiates! 100% full power!",
    taunt: "내 연산 회로는 이미 네 패배를 0.01초 만에 도출했다.",
    taunt_en: "My calculation circuits deduced your defeat in 0.01 seconds."
  },
  10: {
    quote: "시간의 균열을 여는 자! 과거와 미래를 넘나드는 나의 콤보를 보아라!",
    quote_en: "Opener of the rift of time! Behold my combo traversing past and future!",
    taunt: "시간을 되돌리고 싶어도 이미 늦었다!",
    taunt_en: "Even if you want to rewind time, it is already too late!"
  },
  77: {
    quote: "전설의 드래곤 슬레이어! 거대한 용조차 내 일격에 쓰러졌다, 덤벼라!",
    quote_en: "Legendary Dragon Slayer! Even grand dragons fell to my strike, come at me!",
    taunt: "네 덱의 파워는 내 칼날을 견딜 수 없다.",
    taunt_en: "Your deck's power cannot endure my edge."
  },
  100: {
    quote: "신화의 영역에 도달한 자의 카드! 너는 이 거룩한 위엄을 마주할 수 있는가?",
    quote_en: "The card of one who reached the mythic realm! Can you face this majesty?",
    taunt: "신의 시련을 극복해라, 필멸자여!",
    taunt_en: "Overcome the trial of the divine, mortal!"
  },
  110: {
    quote: "궁극의 오리진 히어로! 110장의 모든 지혜와 힘이 내 손끝에서 폭발한다!",
    quote_en: "The Ultimate Origin Hero! All wisdom and power of 110 cards explode from my hand!",
    taunt: "최후의 시험을 통과하고 전설이 되어라!",
    taunt_en: "Pass the ultimate test and become a legend!"
  }
};

/**
 * 카드 ID와 속성을 바탕으로 3초 인트로 대사를 가져옵니다.
 */
export function getMissionCardDialogue(cardId: number, element?: string): CardDialogueData {
  if (SPECIAL_CARD_DIALOGUES[cardId]) {
    return SPECIAL_CARD_DIALOGUES[cardId];
  }

  const rawElem = (element || 'neutral').toLowerCase();
  let key = 'neutral';
  if (rawElem.includes('fire') || rawElem.includes('flame')) key = 'fire';
  else if (rawElem.includes('water') || rawElem.includes('ice') || rawElem.includes('aqua')) key = 'water';
  else if (rawElem.includes('wind') || rawElem.includes('air')) key = 'wind';
  else if (rawElem.includes('earth') || rawElem.includes('land') || rawElem.includes('rock')) key = 'earth';
  else if (rawElem.includes('dragon') || rawElem.includes('holy') || rawElem.includes('light')) key = 'dragon';
  else if (rawElem.includes('undead') || rawElem.includes('monster') || rawElem.includes('dark')) key = 'undead';

  const pool = ELEMENTAL_DIALOGUES[key] || ELEMENTAL_DIALOGUES.neutral;
  const idx = Math.abs((cardId * 31 + 7)) % pool.length;
  return pool[idx];
}
