import { CLASSIC_PRESET_DECKS, cardDb } from './cardDb';
import { CollectionMap, getJourneyCardMultiplier, hasCombatStatsForJourney } from './storage';
import { BoardThemeId, CustomBattleHeroSpec, HeroClass } from './types';

export interface JourneyCastMember {
  name: string;
  role: string;
  cutoutUrl: string;
  side: 'ALLY' | 'ENEMY';
}

export interface JourneyStoryScene {
  stageLabel: string;
  illustrationUrl: string;
  shortCaption: string;
  shortQuote: string;
  narration: string;
  speakerName: string;
  speakerRole: string;
  speakerCutoutUrl: string;
  quote: string;
}

export interface KadanJourneyEpisodeDef {
  episode: number;
  actNumber: number;
  actTitle: string;
  titleKo: string;
  locationKo: string;
  oneLineKo: string;
  novelEpisodeUrl: string;
  webtoonEpisodeUrl: string;
  bookMdUrl: string;
  coverIllustrationUrl: string;
  prevContextKo: string;
  synopsisKo: string;
  battleReasonKo: string;
  cast: JourneyCastMember[];
  scenes: JourneyStoryScene[];
  bossHeroClass: HeroClass;
  bossNameKo: string;
  bossCutoutUrl: string;
  bossHeroSpec: CustomBattleHeroSpec;
  playerHeroSpec: CustomBattleHeroSpec;
}

export const KADAN_JOURNEY_EPISODES: KadanJourneyEpisodeDef[] = [
  {
    "episode": 1,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "눈보라 아래 두 서약",
    "locationKo": "엘윈 마을 통나무 주막 & 외나무다리",
    "oneLineKo": "만삭의 아내 엘윈이 북방 설원으로 무사히 탈출할 수 있도록, 불타는 외나무다리 위에서 야심가 루시안을 막아내야 한다!",
    "novelEpisodeUrl": "/book?ep=1",
    "webtoonEpisodeUrl": "/webtoon?ep=1",
    "bookMdUrl": "/book/episode_01.md",
    "coverIllustrationUrl": "/images/webtoon/episode_01/scene_05.webp",
    "prevContextKo": "패전국의 변방 설원 엘윈 마을에서 옛 성기사 알렉산다르와 발리안은 신분을 숨긴 채 새 생명의 탄생을 기다린다.",
    "synopsisKo": "순례 성기사 헤르쿨이 찾아와 곧 태어날 두 아이(카단·이그니스)를 위한 은빛 단검을 건넨다. 그러나 사흘 뒤 궁정 귀족 루시안이 만삭의 엘윈을 탐내 마을을 반역죄로 모함하여 토벌대를 이끌고 습격한다. 알렉산다르는 아내와 뱃속의 카단을 피신시키기 위해 외나무다리 위에서 홀로 최후의 결전을 벌인다.",
    "battleReasonKo": "만삭의 아내 엘윈이 북방 설원으로 무사히 탈출할 수 있도록, 불타는 외나무다리 위에서 야심가 루시안을 막아내야 한다!",
    "cast": [
      {
        "name": "알렉산다르",
        "role": "카단의 아버지 · 옛 아케 성기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/050_Aleksandar.png",
        "side": "ALLY"
      },
      {
        "name": "발리안",
        "role": "이그니스의 친아들 아버지 · 아케 창술사",
        "cutoutUrl": "/anime-character-sheets/cutouts/043_Balian.png",
        "side": "ALLY"
      },
      {
        "name": "헤르쿨",
        "role": "은빛 단검을 전한 순례 성기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
        "side": "ALLY"
      },
      {
        "name": "엘윈",
        "role": "카단의 어머니 · 설원의 강인한 여인",
        "cutoutUrl": "/anime-character-sheets/cutouts/042_Elwin.png",
        "side": "ALLY"
      },
      {
        "name": "루시안",
        "role": "붉은 유리 궁정 재상 · 만악의 근원",
        "cutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_01/scene_05.webp",
        "shortCaption": "순례 성기사 헤르쿨이 찾아와 곧 태어날 두 아이를 위한 은빛 단검을 건넨다.",
        "shortQuote": "섀도우렐름의 사냥개라면 이름을 밝힐 시간조차 아까울 텐데.",
        "narration": "라이트헤븐 왕국의 남쪽 끝자락, 거친 산맥과 툰드라가 맞닿은 엘윈 마을에는 겨울이 가혹하리만치 서둘러 당도했다.",
        "speakerName": "발리안",
        "speakerRole": "이그니스의 친아들 아버지 · 아케 창술사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/043_Balian.png",
        "quote": "섀도우렐름의 사냥개라면 이름을 밝힐 시간조차 아까울 텐데."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_01/scene_19.webp",
        "shortCaption": "궁정 귀족 루시안이 만삭의 엘윈을 탐내 마을을 반역죄로 모함하여 토벌대를 이끌고 습격한다.",
        "shortQuote": "어둠의 군세가 이 남쪽 계곡까지 내려왔네.",
        "narration": "그러나 사흘 뒤 궁정 귀족 루시안이 만삭의 엘윈을 탐내 마을을 반역죄로 모함하여 토벌대를 이끌고 습격한다",
        "speakerName": "헤르쿨",
        "speakerRole": "은빛 단검을 전한 순례 성기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
        "quote": "부모의 피비린내 나는 원한을 억지로 떠넘기라는 뜻이 아닐세. 장차 온 세상이 거짓과 탐욕으로 물들 때, 누가 진짜 아군이고 적인지 스스로 판별할 수 있도록 가슴속 진실의 룬을 지키게 하려는 걸세."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_01/scene_34.webp",
        "shortCaption": "알렉산다르는 아내와 뱃속의 카단을 피신시키기 위해 외나무다리 위에서 홀로 최후의 결전을 벌인다.",
        "shortQuote": "손대지 마라, 이 비겁한 악마야!",
        "narration": "한편 골목 끝자락에서 발리안의 마차는 궁정 기병대의 쇠사슬에 얽혀 전복되고 말았다. 이셀라는 부른 배를 감싸 쥔 채 필사적으로 진흙탕을 기었으나 루시안의 말발굽이 그녀의 앞을 가로막았다.",
        "speakerName": "발리안",
        "speakerRole": "이그니스의 친아들 아버지 · 아케 창술사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/043_Balian.png",
        "quote": "손대지 마라, 이 비겁한 악마야!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_01/scene_45.webp",
        "shortCaption": "만삭의 아내 엘윈이 북방 설원으로 무사히 탈출할 수 있도록, 불타는 외나무다리 위에서 야심가 루시안을 막아내야 한다!",
        "shortQuote": "언젠가 누군가는 이 땅에서 다시 따뜻한 빵을 구워야 하니까요.",
        "narration": "만삭의 아내 엘윈이 북방 설원으로 무사히 탈출할 수 있도록, 불타는 외나무다리 위에서 야심가 루시안을 막아내야 한다!",
        "speakerName": "엘윈",
        "speakerRole": "카단의 아버지 · 옛 아케 성기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/050_Aleksandar.png",
        "quote": "다만 어떤 불의와 거짓 앞에서도 비겁하게 고개를 숙이지 않는 사람으로 자라다오."
      }
    ],
    "bossHeroClass": "ROGUE",
    "bossNameKo": "야심가 루시안",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
    "bossHeroSpec": {
      "heroNameKo": "야심가 루시안",
      "titleKo": "제1화 보스 · 붉은 유리 궁정 재상 · 만악의 근원",
      "factionLabelKo": "붉은 유리 궁정 · 엘윈",
      "portraitUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
      "heroPowerNameKo": "궁정 암살 단검",
      "heroPowerTextKo": "1/2 단검을 장착합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
      "accentColor": "#f43f5e",
      "frameGradient": "linear-gradient(180deg, #be123c 0%, #4c0519 100%)",
      "skyTop": "#4c0519",
      "skyMid": "#9f1239",
      "skyBot": "#1c040c",
      "halo": "rgba(251, 113, 133, 0.55)",
      "emotesKo": {
        "greetings": "변방의 천한 것들이 감히 궁정의 뜻을 거스르느냐.",
        "well_played": "흥, 발버둥 치는 꼴이 제법 볼만하군.",
        "thanks": "네 어리석음이 내 패업을 앞당기는구나.",
        "wow": "이 따위 변수가 생길 줄이야...!",
        "oops": "사소한 계산 착오일 뿐이다.",
        "threaten": "붉은 유리 궁정의 이름으로 흔적도 없이 불태워주마!",
        "start": "저 반역자들을 남김없이 베어라! 단 한 명도 살려 보내지 마라!",
        "concede": "크윽... 지금은 물러나지만, 궁정의 그림자는 끝까지 너희를 쫓을 것이다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "성기사 알렉산다르",
      "titleKo": "카단의 아버지 · 외나무다리의 수호자",
      "factionLabelKo": "옛 아케 성기사단",
      "portraitUrl": "/anime-character-sheets/cutouts/050_Aleksandar.png",
      "heroPowerNameKo": "수호자의 헌신",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/050_Aleksandar.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #1d4ed8 0%, #1e293b 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈의 설원 아래, 아내와 아이는 내가 끝까지 지킨다.",
        "well_played": "제법 매서운 검술이로군.",
        "thanks": "고맙네, 전우여.",
        "wow": "아케 성기사단의 방패가 울릴 만큼 강한 일격이다!",
        "oops": "다리 위 발판이 흔들렸군.",
        "threaten": "이 외나무다리 너머로는 단 한 발짝도 지나갈 수 없다!",
        "start": "엘윈, 어서 북쪽으로 가거라! 여기는 내가 목숨으로 막아낸다!",
        "concede": "엘윈과 우리 아이는 이미 설원 너머로 떠났다... 내 임무는 다했어..."
      }
    }
  },
  {
    "episode": 2,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "일곱 추적자의 맹세",
    "locationKo": "세븐브리지 항구 어시장 골목",
    "oneLineKo": "오해로 부딪친 세븐브리지 일곱 추적자의 선봉 대장장이 그림리와 정정당당히 무예를 겨루어 성기사의 신의를 증명하라!",
    "novelEpisodeUrl": "/book?ep=2",
    "webtoonEpisodeUrl": "/webtoon?ep=2",
    "bookMdUrl": "/book/episode_02.md",
    "coverIllustrationUrl": "/images/webtoon/episode_02/scene_04.webp",
    "prevContextKo": "엘윈 마을이 불타고 알렉산다르가 산화한 뒤, 뒤늦게 잿더미에 도착한 헤르쿨은 루시안의 왕실 병기 파편을 수습해 남쪽 항구로 향한다.",
    "synopsisKo": "노예선에 끌려가던 전쟁고아들을 추적하던 헤르쿨은 부둣가에서 변방의 일곱 의인(가웨인·그림리·에일라·엘리아나·카제·론돌·로비냐드)과 궁정 첩자로 서로 오해해 격돌한다. 소녀의 증언으로 오해를 푼 뒤, 일곱 추적자는 북방에서 카단을, 헤르쿨은 남방에서 이그니스를 찾아 기르고 18년 뒤 별취한 종탑에서 재회하기로 피의 맹세를 맺는다.",
    "battleReasonKo": "오해로 부딪친 세븐브리지 일곱 추적자의 선봉 대장장이 그림리와 정정당당히 무예를 겨루어 성기사의 신의를 증명하라!",
    "cast": [
      {
        "name": "헤르쿨",
        "role": "은빛 단검을 전한 순례 성기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
        "side": "ALLY"
      },
      {
        "name": "가웨인",
        "role": "일곱 추적자 수장 · 맹인 음파 무인",
        "cutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "side": "ALLY"
      },
      {
        "name": "에일라",
        "role": "일곱 추적자 · 백발백중 석궁 명사수",
        "cutoutUrl": "/anime-character-sheets/cutouts/070_Aila.png",
        "side": "ALLY"
      },
      {
        "name": "그림리",
        "role": "일곱 추적자 · 드워프 대장장이 스승",
        "cutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "side": "ENEMY"
      },
      {
        "name": "카제",
        "role": "일곱 추적자 · 은화 비검술사",
        "cutoutUrl": "/anime-character-sheets/cutouts/044_Kaze.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_02/scene_04.webp",
        "shortCaption": "노예선에 끌려가던 전쟁고아들을 추적하던 헤르쿨은 부둣가에서 변방의 일곱 의인과 궁정 첩자로 서로 오해해 격돌한다.",
        "shortQuote": "이것은 국경을 지키는 라이트헤븐 정예 사령부의 문장...",
        "narration": "헤르쿨이 폐허로 변해 버린 엘윈 마을의 잿더미에 당도했을 때, 대지 위에 남은 것은 검게 얼어붙은 서까래와 눈물처럼 얼룩진 핏자국뿐이었다.",
        "speakerName": "헤르쿨",
        "speakerRole": "은빛 단검을 전한 순례 성기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
        "quote": "이것은 국경을 지키는 라이트헤븐 정예 사령부의 문장... 외부의 적이 아니라, 왕국 내부의 권력자가 설계를 주도했다는 명백한 증거다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_02/scene_18.webp",
        "shortCaption": "소녀의 증언으로 오해를 푼 뒤, 일곱 추적자는 북방에서 카단을, 헤르쿨은 남방에서 이그니스를 찾아 기르고 18년…",
        "shortQuote": "빌어먹을, 궁정 놈들의 개가 아니라 진짜 뼈대 있는 성기사였단 말인가.",
        "narration": "소녀의 증언으로 오해를 푼 뒤, 일곱 추적자는 북방에서 카단을, 헤르쿨은 남방에서 이그니스를 찾아 기르고 18년 뒤 별취한 종탑에서 재회하기로 피의 맹세를 맺는다.",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "빌어먹을, 궁정 놈들의 개가 아니라 진짜 뼈대 있는 성기사였단 말인가. 겉모습만 보고 섣불리 화살을 날렸군 그래. 이 부둣가에 궁정 첩자들이 하도 들끓어서 눈이 뒤집혔던 게지."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_02/scene_32.webp",
        "shortCaption": "소녀의 증언으로 오해를 푼 뒤, 일곱 추적자는 북방에서 카단을, 헤르쿨은 남방에서 이그니스를 찾아 기르고 18년…",
        "shortQuote": "알렉산다르의 아내는 만삭의 몸으로 북쪽 얼어붙은 와일드랜드로 탈출했소.",
        "narration": "소녀의 증언으로 오해를 푼 뒤, 일곱 추적자는 북방에서 카단을, 헤르쿨은 남방에서 이그니스를 찾아 기르고 18년 뒤 별취한 종탑에서 재회하기로 피의 맹세를 맺는다.",
        "speakerName": "헤르쿨",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "물살을 타는 법과 거센 풍랑 속에서 배를 모는 끈기도 결코 빼놓을 수 없소."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_02/scene_43.webp",
        "shortCaption": "오해로 부딪친 세븐브리지 일곱 추적자의 선봉 대장장이 그림리와 정정당당히 무예를 겨루어 성기사의 신의를 증명하라!",
        "shortQuote": "누구의 가르침이 더 올곧게 세상의 불의를 갈랐는지 무인의 결투로 확인하는 것이 어떻겠소?",
        "narration": "오해로 부딪친 세븐브리지 일곱 추적자의 선봉 대장장이 그림리와 정정당당히 무예를 겨루어 성기사의 신의를 증명하라!",
        "speakerName": "가웨인",
        "speakerRole": "은빛 단검을 전한 순례 성기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
        "quote": "좋소! 승패를 떠나, 두 아이가 부모의 숭고한 뜻을 이어받아 이 썩어빠진 대륙을 구할 진정한 등불이 되었음을 증명하는 의식이 될 것이오!"
      }
    ],
    "bossHeroClass": "WARLOCK",
    "bossNameKo": "대장장이 그림리",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
    "bossHeroSpec": {
      "heroNameKo": "대장장이 그림리",
      "titleKo": "제2화 보스 · 일곱 추적자 · 드워프 대장장이 스승",
      "factionLabelKo": "세븐브리지 일곱 추적자 · 세븐브리지",
      "portraitUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
      "heroPowerNameKo": "대장간 투혼 연성",
      "heroPowerTextKo": "카드를 1장 뽑고 내 영웅에게 피해를 2 줍니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
      "accentColor": "#f59e0b",
      "frameGradient": "linear-gradient(180deg, #b45309 0%, #451a03 100%)",
      "skyTop": "#451a03",
      "skyMid": "#92400e",
      "skyBot": "#1c1008",
      "halo": "rgba(251, 191, 36, 0.52)",
      "emotesKo": {
        "greetings": "흥! 왕실 끄나풀이 아니라면 망치 맛부터 견뎌 보시지!",
        "well_played": "허허! 강철처럼 단단한 솜씨로구먼!",
        "thanks": "고맙네! 대장장이의 이름으로 빚을 졌군!",
        "wow": "내 모루가 갈라질 만큼 묵직한 한 방이야!",
        "oops": "이런, 쇳물을 너무 일찍 부었구먼!",
        "threaten": "세븐브리지 의인들의 무쇠 망치를 얕보지 마라!",
        "start": "일곱 추적자 진영 전개! 저 성기사의 진짜 실력과 신의를 시험한다!",
        "concede": "하하하! 의심해서 미안하오, 헤르쿨 경! 당신은 진정한 아케의 기사로군!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "순례 성기사 헤르쿨",
      "titleKo": "은빛 단검의 전령 · 아케 성기사",
      "factionLabelKo": "옛 아케 성기사단",
      "portraitUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
      "heroPowerNameKo": "성광의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
      "accentColor": "#fbbf24",
      "frameGradient": "linear-gradient(180deg, #ca8a04 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "나는 아케 성기사 헤르쿨이오! 오해를 거두고 내 말을 들어주시오!",
        "well_played": "과연 세븐브리지 의인들의 무예는 명불허전이군!",
        "thanks": "신의에 감사하오!",
        "wow": "드워프 대장장이의 괴력이 실로 대단하구려!",
        "oops": "허허, 성급한 발걸음이었소.",
        "threaten": "전쟁고아들을 지키기 위해서라면 내 성검도 물러서지 않소!",
        "start": "말로 통하지 않는다면 정정당당한 기사의 검으로 신의를 증명하겠소!",
        "concede": "당신들의 의협심을 확인했소. 이제 오해를 풀고 아이들을 구합시다!"
      }
    }
  },
  {
    "episode": 3,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "안개 절벽의 피",
    "locationKo": "미스트폴 절벽 고대 타이탄 폐신전",
    "oneLineKo": "동료 로비냐드의 숭고한 희생을 헛되이 하지 않기 위해, 흑요석 결정 괴인 벨페고르를 처단하라!",
    "novelEpisodeUrl": "/book?ep=3",
    "webtoonEpisodeUrl": "/webtoon?ep=3",
    "bookMdUrl": "/book/episode_03.md",
    "coverIllustrationUrl": "/images/webtoon/episode_03/scene_05.webp",
    "prevContextKo": "알렉산다르의 아들을 찾아 북방으로 떠난 일곱 추적자는 칠흑 같은 흑암 안개가 깔린 미스트폴 절벽에 발이 묶인다.",
    "synopsisKo": "금지된 마도서 『나인섀도우 코덱스』를 훔쳐 달아난 파문 마도사 메두사 고르고와 흑요석 괴인 벨페고르가 폐신전 천장을 부수고 일행을 기습한다. 독안개와 그림자 봉쇄 속 절체절명의 위기에서 곡예사 로비냐드가 몸을 던져 벨페고르를 붙잡고 산화하며, 남은 여섯 스승은 눈물 속에 하나의 심장으로 합을 맞춰 괴물을 격퇴한다.",
    "battleReasonKo": "동료 로비냐드의 숭고한 희생을 헛되이 하지 않기 위해, 흑요석 결정 괴인 벨페고르를 처단하라!",
    "cast": [
      {
        "name": "로비냐드",
        "role": "일곱 추적자 · 동료 위해 산화한 곡예사",
        "cutoutUrl": "/anime-character-sheets/cutouts/048_Robinyard.png",
        "side": "ALLY"
      },
      {
        "name": "가웨인",
        "role": "일곱 추적자 수장 · 맹인 음파 무인",
        "cutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "side": "ALLY"
      },
      {
        "name": "그림리",
        "role": "일곱 추적자 · 드워프 대장장이 스승",
        "cutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "side": "ALLY"
      },
      {
        "name": "에일라",
        "role": "일곱 추적자 · 백발백중 석궁 명사수",
        "cutoutUrl": "/anime-character-sheets/cutouts/070_Aila.png",
        "side": "ALLY"
      },
      {
        "name": "벨페고르",
        "role": "흑요석 결정술사 · 심연의 마인",
        "cutoutUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
        "side": "ENEMY"
      },
      {
        "name": "메두사 고르고",
        "role": "나인섀도우 코덱스를 훔친 암흑 마녀",
        "cutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_03/scene_05.webp",
        "shortCaption": "금지된 마도서 『나인섀도우 코덱스』를 훔쳐 달아난 파문 마도사 메두사 고르고와 흑요석 괴인 벨페고르가 폐신전…",
        "shortQuote": "살아 있는 생명체에서 억지로 마나를 뽑아내어 시체처럼 결정을 굳히는 금지된 흑마술의 흔적이에요.",
        "narration": "북방을 향해 험준한 산악 지대를 가로지르던 일곱 추적자는 미스트폴 절벽의 기괴한 침묵 속에서 길을 잃었다. 수천 년 전 고대 타이탄 거인족이 맨손으로 깎아 세웠다는 거대한 현무암 암벽들이 안개 너머로 거인의 묘비처럼 불길하게 솟아 있었다.",
        "speakerName": "엘리아나",
        "speakerRole": "일곱 추적자 · 약제사 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/063_Eliana.png",
        "quote": "살아 있는 생명체에서 억지로 마나를 뽑아내어 시체처럼 결정을 굳히는 금지된 흑마술의 흔적이에요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_03/scene_20.webp",
        "shortCaption": "남은 여섯 스승은 눈물 속에 하나의 심장으로 합을 맞춰 괴물을 격퇴한다.",
        "shortQuote": "천장이다! 흩어져라!",
        "narration": "그러나 지하 바위틈을 타고 되돌아온 공명음은 일곱 개가 아닌 여덟 개였다. 지팡이를 쥔 가웨인의 핏줄 선 손등이 굳어졌다.",
        "speakerName": "가웨인",
        "speakerRole": "일곱 추적자 수장 · 맹인 음파 무인",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "quote": "천장이다! 흩어져라!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_03/scene_35.webp",
        "shortCaption": "남은 여섯 스승은 눈물 속에 하나의 심장으로 합을 맞춰 괴물을 격퇴한다.",
        "shortQuote": "일곱 추적자 놈들... 오늘의 피는 너희의 목숨으로 반드시 되갚아 주마!",
        "narration": "메두사 고르고는 파트너의 비참한 최후에 이를 갈며 독안개 속으로 모습을 감췄다.",
        "speakerName": "메두사 고르고",
        "speakerRole": "나인섀도우 코덱스를 훔친 암흑 마녀",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
        "quote": "일곱 추적자 놈들... 오늘의 피는 너희의 목숨으로 반드시 되갚아 주마!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_03/scene_47.webp",
        "shortCaption": "동료 로비냐드의 숭고한 희생을 헛되이 하지 않기 위해, 흑요석 결정 괴인 벨페고르를 처단하라!",
        "shortQuote": "로비냐드는 조용히 미소를 머금은 채 차가운 절벽 바람 속에서 숨을 거두었다.",
        "narration": "동료 로비냐드의 숭고한 희생을 헛되이 하지 않기 위해, 흑요석 결정 괴인 벨페고르를 처단하라!",
        "speakerName": "엘리아나",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "우리는 이제 일곱이 아니라 여섯이다. 그러나 로비냐드의 영혼은 영원히 우리 호흡 속에 살아 숨 쉴 것이다. 가자, 북쪽 황야로!"
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "결정술사 벨페고르",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
    "bossHeroSpec": {
      "heroNameKo": "결정술사 벨페고르",
      "titleKo": "제3화 보스 · 흑요석 결정술사 · 심연의 마인",
      "factionLabelKo": "흑요석 심연 군단 · 미스트폴",
      "portraitUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
      "heroPowerNameKo": "흑요석 결정 갑주",
      "heroPowerTextKo": "방어도를 +2 얻습니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
      "accentColor": "#c026d3",
      "frameGradient": "linear-gradient(180deg, #86198f 0%, #2e1065 100%)",
      "skyTop": "#2e1065",
      "skyMid": "#701a75",
      "skyBot": "#0f0720",
      "halo": "rgba(232, 121, 249, 0.55)",
      "emotesKo": {
        "greetings": "크하하! 나인섀도우 코덱스의 심연 결정 앞에 무릎 꿇어라!",
        "well_played": "미약한 인간치고는 내 외피에 흠집을 냈군.",
        "thanks": "네 고통이 흑요석 결정을 더욱 단단히 살찌운다!",
        "wow": "크헉?! 내 심연 갑주가 금이 가다니?!",
        "oops": "결정의 파편이 빗나갔군.",
        "threaten": "동료의 시체 위에서 절망하며 돌덩이로 굳어 죽어라!",
        "start": "미스트폴 절벽이 너희 일곱 추적자의 무덤이 될 것이다!",
        "concede": "크아아악! 죽은 동료의 넋이 검에 깃들다니... 심연으로 후퇴한다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "수장 가웨인",
      "titleKo": "일곱 추적자 수장 · 음파 검성",
      "factionLabelKo": "세븐브리지 추적자",
      "portraitUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
      "heroPowerNameKo": "전우의 지혈",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
      "accentColor": "#38bdf8",
      "frameGradient": "linear-gradient(180deg, #0369a1 0%, #0f172a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "비록 두 눈은 멀었으나, 네 사악한 기척은 바람 속에 선명하다.",
        "well_played": "심연의 괴물다운 무거운 파동이로군.",
        "thanks": "고맙다, 형제들이여.",
        "wow": "로비냐드의 넋이 우리 여섯의 검을 하나로 이끄는구나!",
        "oops": "안개의 메아리가 잠시 겹쳤군.",
        "threaten": "동료의 피값은 네 흑요석 심장으로 반드시 치르게 하겠다!",
        "start": "추적자 전원, 심장의 박동을 하나로 맞춰라! 로비냐드의 복수전이다!",
        "concede": "크윽... 아이를 찾아야 하는 맹세가 있는 한 우리는 쓰러질 수 없다!"
      }
    }
  },
  {
    "episode": 4,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "황야에서 자란 아이",
    "locationKo": "북방 와일드랜드 영구동토 빙판 협곡",
    "oneLineKo": "등에 업은 친구 길가메시를 끝까지 지켜내기 위해, 살얼음 협곡을 추격해 오는 암살대장 카르그를 물리쳐라!",
    "novelEpisodeUrl": "/book?ep=4",
    "webtoonEpisodeUrl": "/webtoon?ep=4",
    "bookMdUrl": "/book/episode_04.md",
    "coverIllustrationUrl": "/images/webtoon/episode_04/scene_04.webp",
    "prevContextKo": "여섯 번의 혹한이 흐른 북방 설원에서 카단은 마나 재능은 더디지만 어머니 엘윈의 가르침 아래 누구보다 우직하고 따뜻한 아이로 자라난다.",
    "synopsisKo": "정복왕 펜릴의 어린 아들 길가메시가 적대 부족 암살자들에게 포위되자, 맨손의 소년 카단이 눈보라 속으로 뛰어들어 화살에 허벅지를 찢기면서도 길가메시를 등에 업고 살얼음 강을 건너 구해낸다. 그날 밤 은빛 단검의 공명을 따라 도착한 여섯 스승이 드디어 카단을 찾아내 제자로 맞이한다.",
    "battleReasonKo": "등에 업은 친구 길가메시를 끝까지 지켜내기 위해, 살얼음 협곡을 추격해 오는 암살대장 카르그를 물리쳐라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "엘윈",
        "role": "카단의 어머니 · 설원의 강인한 여인",
        "cutoutUrl": "/anime-character-sheets/cutouts/042_Elwin.png",
        "side": "ALLY"
      },
      {
        "name": "길가메시",
        "role": "펜릴의 아들 · 카단의 의형제",
        "cutoutUrl": "/anime-character-sheets/cutouts/047_Gilgamesh.png",
        "side": "ALLY"
      },
      {
        "name": "정복왕 펜릴",
        "role": "북방 백은 늑대 부족의 패왕",
        "cutoutUrl": "/anime-character-sheets/cutouts/081_Fenrir.png",
        "side": "ALLY"
      },
      {
        "name": "암살대장 카르그",
        "role": "북방 흑랑 암살단장",
        "cutoutUrl": "/hs-assets/bosses/boss_karg.webp",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_04/scene_04.webp",
        "shortCaption": "맨손의 소년 카단이 눈보라 속으로 뛰어들어 화살에 허벅지를 찢기면서도 길가메시를 등에 업고 살얼음 강을 건너 구해낸다.",
        "shortQuote": "어머니, 오늘 울타리를 고치다가 눈더미에 갇혀 얼어 죽어가는 새끼 늑대를 보았어요.",
        "narration": "가혹한 혹한의 계절이 여섯 번이나 지나갔다. 엘윈은 남편 알렉산다르가 목숨으로 지켜낸 아들 카단을 품에 안고, 대륙 북방의 거친 유목 부족들이 모여 사는 와일드랜드의 가죽 천막 사이에서 살아남았다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "어머니, 오늘 울타리를 고치다가 눈더미에 갇혀 얼어 죽어가는 새끼 늑대를 보았어요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_04/scene_17.webp",
        "shortCaption": "은빛 단검의 공명을 따라 도착한 여섯 스승이 드디어 카단을 찾아내 제자로 맞이한다.",
        "shortQuote": "이곳에서 사람을 해치지 마라!",
        "narration": "그 광경을 가축 떼를 돌보던 어린 카단이 목격했다. 카단의 손에는 번듯한 활이나 쇠칼 한 자루조차 쥐어져 있지 않았다. 그러나 아이는 한 치의 망설임도 없이 눈보라 치는 빙판 위로 몸을 날렸다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "이곳에서 사람을 해치지 마라!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_04/scene_32.webp",
        "shortCaption": "은빛 단검의 공명을 따라 도착한 여섯 스승이 드디어 카단을 찾아내 제자로 맞이한다.",
        "shortQuote": "내 목숨은 네 것이다, 카단. 앞으로 너를 형제라 부르겠다.",
        "narration": "길가메시 역시 가슴의 청동 늑대 목걸이를 벗어 카단의 손에 쥐여 주며 눈물을 글썽였다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "내 목숨은 네 것이다, 카단. 앞으로 너를 형제라 부르겠다."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_04/scene_42.webp",
        "shortCaption": "등에 업은 친구 길가메시를 끝까지 지켜내기 위해, 살얼음 협곡을 추격해 오는 암살대장 카르그를 물리쳐라!",
        "shortQuote": "알렉산다르의 약속을 잊지 않고 와 주셨군요...” 가웨인이 쇠지팡이를 짚으며 정중히 예를 표했다.",
        "narration": "등에 업은 친구 길가메시를 끝까지 지켜내기 위해, 살얼음 협곡을 추격해 오는 암살대장 카르그를 물리쳐라!",
        "speakerName": "엘윈",
        "speakerRole": "카단의 아버지 · 옛 아케 성기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/050_Aleksandar.png",
        "quote": "이 거친 손을 보니 대장장이보다 단단하군. 아주 마음에 들어."
      }
    ],
    "bossHeroClass": "HUNTER",
    "bossNameKo": "암살대장 카르그",
    "bossCutoutUrl": "/hs-assets/bosses/boss_karg.webp",
    "bossHeroSpec": {
      "heroNameKo": "암살대장 카르그",
      "titleKo": "제4화 보스 · 북방 흑랑 암살단장",
      "factionLabelKo": "북방 흑랑 암살단 · 북방",
      "portraitUrl": "/hs-assets/bosses/boss_karg.webp",
      "heroPowerNameKo": "설원 독화살 사격",
      "heroPowerTextKo": "적 영웅에게 피해를 2 줍니다.",
      "heroPowerIconUrl": "/hs-assets/bosses/boss_karg.webp",
      "accentColor": "#2dd4bf",
      "frameGradient": "linear-gradient(180deg, #115e59 0%, #042f2e 100%)",
      "skyTop": "#0f172a",
      "skyMid": "#134e4a",
      "skyBot": "#020617",
      "halo": "rgba(94, 234, 212, 0.48)",
      "emotesKo": {
        "greetings": "꼬맹이 하나가 펜릴의 핏줄을 업고 어딜 도망치느냐!",
        "well_played": "맨손의 어린것치고는 독하게 버티는군.",
        "thanks": "살얼음판 위에서 제 발로 지쳐 쓰러져라.",
        "wow": "화살을 맞고도 눈빛이 흔들리지 않다니?!",
        "oops": "눈보라 때문에 조준이 빗나갔다!",
        "threaten": "독화살 한 발이면 둘 다 얼음 강 밑바닥 신세다!",
        "start": "흑랑 사수대, 포위 사격! 펜릴의 아들과 저 꼬마를 생포하라!",
        "concede": "이럴 수가... 여섯 달인들이 당도했다! 전원 철수하라!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 5,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "폭우 속의 유령",
    "locationKo": "북방 고원 석회암 종유석 동굴",
    "oneLineKo": "시야를 가리는 흑암 연막 속에서 눈을 감고 바람의 결을 읽어, 유령처럼 덮쳐오는 암흑 마녀 메두사 고르고를 격퇴하라!",
    "novelEpisodeUrl": "/book?ep=5",
    "webtoonEpisodeUrl": "/webtoon?ep=5",
    "bookMdUrl": "/book/episode_05.md",
    "coverIllustrationUrl": "/images/webtoon/episode_05/scene_05.webp",
    "prevContextKo": "여섯 스승 밑에서 6년간 혹독한 수련을 쌓아 열두 살이 된 카단은 폭우를 피해 스승들과 고대 종유석 동굴로 몸을 숨긴다.",
    "synopsisKo": "로비냐드의 원수인 암흑 마녀 메두사 고르고가 폭우의 음파와 흑암 연막을 타고 유령처럼 스며들어 카단의 목덜미를 노린다. 시야가 차단된 순간, 맹인 스승 가웨인의 일갈을 들은 카단이 두 눈을 감고 빗방울이 비껴가는 진공의 틈을 감지해 은빛 단검으로 보이지 않는 고르고의 손목을 베어낸다.",
    "battleReasonKo": "시야를 가리는 흑암 연막 속에서 눈을 감고 바람의 결을 읽어, 유령처럼 덮쳐오는 암흑 마녀 메두사 고르고를 격퇴하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "가웨인",
        "role": "일곱 추적자 수장 · 맹인 음파 무인",
        "cutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "side": "ALLY"
      },
      {
        "name": "그림리",
        "role": "일곱 추적자 · 드워프 대장장이 스승",
        "cutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "side": "ALLY"
      },
      {
        "name": "에일라",
        "role": "일곱 추적자 · 백발백중 석궁 명사수",
        "cutoutUrl": "/anime-character-sheets/cutouts/070_Aila.png",
        "side": "ALLY"
      },
      {
        "name": "메두사 고르고",
        "role": "나인섀도우 코덱스를 훔친 암흑 마녀",
        "cutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_05/scene_05.webp",
        "shortCaption": "로비냐드의 원수인 암흑 마녀 메두사 고르고가 폭우의 음파와 흑암 연막을 타고 유령처럼 스며들어 카단의 목덜미를 노린다.",
        "shortQuote": "단순한 가을비가 아니에요.",
        "narration": "황야의 짧은 여름이 차갑게 식어 가고, 대지를 집어삼킬 듯한 흉포한 폭우가 와일드랜드의 북방 고원 지대를 무섭게 강타했다.",
        "speakerName": "에일라",
        "speakerRole": "일곱 추적자 · 백발백중 석궁 명사수",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/070_Aila.png",
        "quote": "단순한 가을비가 아니에요. 마나의 결이 불길하게 뒤틀리고 있어요. 저 먹구름 뒤편에서 누군가 인위적으로 흑마술의 장막을 부르고 있습니다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_05/scene_19.webp",
        "shortCaption": "시야가 차단된 순간, 맹인 스승 가웨인의 일갈을 들은 카단이 두 눈을 감고 빗방울이 비껴가는 진공의 틈을 감지해…",
        "shortQuote": "시각은 언제나 허상을 보여주지만, 네 피부를 때리는 빗방울과 공기의 흐름은 결코…",
        "narration": "가웨인이 쇠지팡이로 젖은 동굴 바닥을 내리찍자, 맑은 음파 진동이 물결처럼 바닥을 타고 사방으로 뻗어 나갔다.",
        "speakerName": "가웨인",
        "speakerRole": "일곱 추적자 수장 · 맹인 음파 무인",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "quote": "시각은 언제나 허상을 보여주지만, 네 피부를 때리는 빗방울과 공기의 흐름은 결코 거짓말을 하지 않는다! 일찍이 바람섬의 현자 에올루스 경에게서 배운 음파의 길을 기억하라. 살아 숨 쉬는 생명체가 공기를 가를 때, 바람은 그 자리를 비워두지 못하는 법이다!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_05/scene_35.webp",
        "shortCaption": "시야가 차단된 순간, 맹인 스승 가웨인의 일갈을 들은 카단이 두 눈을 감고 빗방울이 비껴가는 진공의 틈을 감지해…",
        "shortQuote": "그 아이도... 저처럼 누군가에게 쫓기며 두려움 속에 떨고 있는 겁니까?",
        "narration": "시야가 차단된 순간, 맹인 스승 가웨인의 일갈을 들은 카단이 두 눈을 감고 빗방울이 비껴가는 진공의 틈을 감지해 은빛 단검으로 보이지 않는 고르고의 손목을 베어낸다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "그 아이도... 저처럼 누군가에게 쫓기며 두려움 속에 떨고 있는 겁니까?"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_05/scene_46.webp",
        "shortCaption": "시야를 가리는 흑암 연막 속에서 눈을 감고 바람의 결을 읽어, 유령처럼 덮쳐오는 암흑 마녀 메두사 고르고를 격퇴하라!",
        "shortQuote": "그렇다면 네가 더 강해져야 한단다, 카단.",
        "narration": "시야를 가리는 흑암 연막 속에서 눈을 감고 바람의 결을 읽어, 유령처럼 덮쳐오는 암흑 마녀 메두사 고르고를 격퇴하라!",
        "speakerName": "에일라",
        "speakerRole": "일곱 추적자 · 약제사 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/063_Eliana.png",
        "quote": "상처를 두려워하지 마라. 아문 상처는 살갗보다 더 단단한 갑옷이 되는 법이란다."
      }
    ],
    "bossHeroClass": "ROGUE",
    "bossNameKo": "메두사 고르고",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
    "bossHeroSpec": {
      "heroNameKo": "메두사 고르고",
      "titleKo": "제5화 보스 · 나인섀도우 코덱스를 훔친 암흑 마녀",
      "factionLabelKo": "나인섀도우 암흑마녀 · 북방",
      "portraitUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
      "heroPowerNameKo": "맹독 사슬 비수",
      "heroPowerTextKo": "1/2 단검을 장착합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
      "accentColor": "#a855f7",
      "frameGradient": "linear-gradient(180deg, #6b21a8 0%, #1e1b4b 100%)",
      "skyTop": "#1e1b4b",
      "skyMid": "#581c87",
      "skyBot": "#090514",
      "halo": "rgba(192, 132, 252, 0.55)",
      "emotesKo": {
        "greetings": "후후... 어둠과 빗소리 속에서 내 독니를 볼 수 있겠니?",
        "well_played": "호오, 눈을 감고 내 살기를 읽었단 말이냐?",
        "thanks": "두려움에 떨수록 맹독은 더 빨리 퍼지지.",
        "wow": "내 흑암 연막을 은빛 단검으로 찢어내다니!",
        "oops": "칫, 빗방울 파동을 들켰군.",
        "threaten": "돌처럼 굳어 영원히 이 동굴의 석상이 되어라!",
        "start": "폭우 속의 유령이 네 숨통을 소리 없이 거두어 주마!",
        "concede": "내 손목에 상처를 입히다니... 알렉산다르의 핏줄, 다음에 반드시 끝장내주마!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 6,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "별을 호흡하는 법",
    "locationKo": "와일드랜드 별빛 바위 봉우리",
    "oneLineKo": "여섯 갈래로 흩어진 무예를 하나의 별빛 호흡으로 융합하기 위해, 대현자 말퓨온의 영기 수련 시험을 통과하라!",
    "novelEpisodeUrl": "/book?ep=6",
    "webtoonEpisodeUrl": "/webtoon?ep=6",
    "bookMdUrl": "/book/episode_06.md",
    "coverIllustrationUrl": "/images/webtoon/episode_06/scene_05.webp",
    "prevContextKo": "여섯 스승의 제각기 다른 무예를 한꺼번에 배우던 카단은 기술들이 몸 안에서 충돌하며 성장이 멈추는 한계에 부딪힌다.",
    "synopsisKo": "스승들 몰래 밤마다 깎아지른 별빛 바위 봉우리에 오른 카단 앞에 대자연의 은둔 현자 말퓨온이 나타난다. 말퓨온은 밤하늘의 별빛을 들이쉬고 발밑 대지로 숨을 내쉬는 고대 내공 『별을 호흡하는 법(성진호흡법)』을 전수하고, 흩어졌던 여섯 스승의 무예가 마침내 카단의 단단한 대지 호흡 하나로 융합된다.",
    "battleReasonKo": "여섯 갈래로 흩어진 무예를 하나의 별빛 호흡으로 융합하기 위해, 대현자 말퓨온의 영기 수련 시험을 통과하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "그림리",
        "role": "일곱 추적자 · 드워프 대장장이 스승",
        "cutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "side": "ALLY"
      },
      {
        "name": "가웨인",
        "role": "일곱 추적자 수장 · 맹인 음파 무인",
        "cutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "side": "ALLY"
      },
      {
        "name": "대현자 말퓨온",
        "role": "별을 호흡하는 법을 전수한 현자",
        "cutoutUrl": "/anime-character-sheets/cutouts/066_Malfuon.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_06/scene_05.webp",
        "shortCaption": "스승들 몰래 밤마다 깎아지른 별빛 바위 봉우리에 오른 카단 앞에 대자연의 은둔 현자 말퓨온이 나타난다.",
        "shortQuote": "도끼와 망치는 잔꾀를 부리지 않아!",
        "narration": "여섯 스승의 가르침은 소년 카단을 매일 서로 다른 극단적인 방향으로 끌어당겼다. 혹한의 와일드랜드 고원 지대를 가로지르는 삭풍 속에서 드워프 대장장이 그림리는 바위처럼 땅에 뿌리를 박고 물러서지 않는 묵직한 하체를 단련하라 호통쳤다.",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "도끼와 망치는 잔꾀를 부리지 않아! 쇠를 달군 만큼 단단해지고 부딪친 만큼 불꽃이 튀는 법이다! 발바닥으로 대지를 짓이기고 한 치도 물러서지 마라!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_06/scene_20.webp",
        "shortCaption": "흩어졌던 여섯 스승의 무예가 마침내 카단의 단단한 대지 호흡 하나로 융합된다.",
        "shortQuote": "산이... 사람을 거부할 수도 있는 겁니까?",
        "narration": "카단이 화들짝 놀라 뒤를 돌아보았다. 이끼 낀 낡은 거친 모직 망토를 두르고 개암나무 지팡이를 짚은 노인, 북방 황야의 전설적인 은둔자 말퓨온이 바위 그림자 아래 서 있었다. 카단이 이마에 흐르는 피를 소매로 닦아내며 가쁘게 헐떡였다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "산이... 사람을 거부할 수도 있는 겁니까?"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_06/scene_35.webp",
        "shortCaption": "흩어졌던 여섯 스승의 무예가 마침내 카단의 단단한 대지 호흡 하나로 융합된다.",
        "shortQuote": "별을 세느라 등 뒤에 선 동료의 발소리를 놓친다면, 그 방패는 대체 누구를 위한 것이냐?",
        "narration": "말퓨온은 가혹하리만치 엄격하게 호흡의 중심을 바로잡아 주었다. 카단의 숨결이 조금이라도 흐트러지면 단단한 개암 열매를 던져 이마를 쳤고, 집중이 지나쳐 주변을 잊으면 날카로운 화두를 던졌다.",
        "speakerName": "대현자 말퓨온",
        "speakerRole": "별을 호흡하는 법을 전수한 현자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/066_Malfuon.png",
        "quote": "별을 세느라 등 뒤에 선 동료의 발소리를 놓친다면, 그 방패는 대체 누구를 위한 것이냐?"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_06/scene_47.webp",
        "shortCaption": "여섯 갈래로 흩어진 무예를 하나의 별빛 호흡으로 융합하기 위해, 대현자 말퓨온의 영기 수련 시험을 통과하라!",
        "shortQuote": "꼬마야! 뼈마디가 조금 단단해진 것 같군! 내일부터 다시 모루 앞으로 나와라!",
        "narration": "여섯 갈래로 흩어진 무예를 하나의 별빛 호흡으로 융합하기 위해, 대현자 말퓨온의 영기 수련 시험을 통과하라!",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "그래, 꼬마야! 뼈마디가 조금 단단해진 것 같군! 내일부터 다시 모루 앞으로 나와라!"
      }
    ],
    "bossHeroClass": "DRUID",
    "bossNameKo": "대현자 말퓨온",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/066_Malfuon.png",
    "bossHeroSpec": {
      "heroNameKo": "대현자 말퓨온",
      "titleKo": "제6화 보스 · 별을 호흡하는 법을 전수한 현자",
      "factionLabelKo": "별빛 봉우리의 은둔 현자 · 와일드랜드",
      "portraitUrl": "/anime-character-sheets/cutouts/066_Malfuon.png",
      "heroPowerNameKo": "별빛 대지 호흡",
      "heroPowerTextKo": "이번 턴에 공격력 +1, 방어도 +1을 얻습니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/066_Malfuon.png",
      "accentColor": "#34d399",
      "frameGradient": "linear-gradient(180deg, #15803d 0%, #052e16 100%)",
      "skyTop": "#052e16",
      "skyMid": "#166534",
      "skyBot": "#02180b",
      "halo": "rgba(110, 231, 183, 0.55)",
      "emotesKo": {
        "greetings": "별빛을 들이쉬고 대지로 내쉬어라, 젊은 수호자여.",
        "well_played": "흩어졌던 여섯 무예가 하나의 호흡으로 모이는구나.",
        "thanks": "대자연의 순리에 귀를 기울일 줄 아는군.",
        "wow": "별과 대지의 공명을 벌써 깨우치다니 놀랍구나!",
        "oops": "호흡이 조급해지면 기운이 흩어지는 법이다.",
        "threaten": "폭풍 앞에서도 흔들리지 않는 바위의 중심을 증명해 보아라!",
        "start": "성진호흡법의 시련을 시작한다. 네 안의 여섯 갈래 기운을 하나로 묶어라!",
        "concede": "훌륭하다, 카단. 이제 별빛과 대지의 호흡은 온전히 네 것이다."
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 7,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "배신자들의 천막",
    "locationKo": "와일드랜드 대평원 유목 연맹 본영",
    "oneLineKo": "정복왕 펜릴의 막사를 기습한 반란의 배후 데스나이트 아르투스의 선발대를 진압하고 북방의 의리를 지켜내라!",
    "novelEpisodeUrl": "/book?ep=7",
    "webtoonEpisodeUrl": "/webtoon?ep=7",
    "bookMdUrl": "/book/episode_07.md",
    "coverIllustrationUrl": "/images/webtoon/episode_07/scene_05.webp",
    "prevContextKo": "열여덟 살 건장한 청년 무인으로 성장한 카단은 스승들의 18년 맹세를 지키러 남쪽으로 떠나기 전 마지막 밤을 맞이한다.",
    "synopsisKo": "붉은 유리 궁정의 루시안과 은밀히 내통한 북방 부족의 배신자들이 축제 술잔에 마비 독을 타 정복왕 펜릴을 암살하려는 반란을 일으킨다. 카단은 의형제 길가메시·요정 전사 티타니아와 함께 포위망을 뚫고 반란군 배후의 죽음기사를 제압하면서도 항복한 포로의 목숨을 살려 기사의 도리를 세운 뒤, 본토를 향한 대장정에 오른다.",
    "battleReasonKo": "정복왕 펜릴의 막사를 기습한 반란의 배후 데스나이트 아르투스의 선발대를 진압하고 북방의 의리를 지켜내라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "정복왕 펜릴",
        "role": "북방 백은 늑대 부족의 패왕",
        "cutoutUrl": "/anime-character-sheets/cutouts/081_Fenrir.png",
        "side": "ALLY"
      },
      {
        "name": "길가메시",
        "role": "펜릴의 아들 · 카단의 의형제",
        "cutoutUrl": "/anime-character-sheets/cutouts/047_Gilgamesh.png",
        "side": "ALLY"
      },
      {
        "name": "티타니아",
        "role": "북방 초원의 요정 전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/064_Titania.png",
        "side": "ALLY"
      },
      {
        "name": "데스나이트 아르투스",
        "role": "섀도우렐름 섭정 · 죽음의 기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_07/scene_05.webp",
        "shortCaption": "붉은 유리 궁정의 루시안과 은밀히 내통한 북방 부족의 배신자들이 축제 술잔에 마비 독을 타 정복왕 펜릴을…",
        "shortQuote": "약조한 거사일이 바로 내일 밤이오.",
        "narration": "와일드랜드의 대평원을 휘감던 모닥불 연기가 잦아들 무렵, 북방의 밤하늘은 금방이라도 혹한의 폭설을 쏟아낼 듯 짙은 잿빛 먹구름으로 뒤덮여 있었다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "약조한 거사일이 바로 내일 밤이오. 펜릴의 저녁 축제 술잔에 마비 독을 섞어 둘 것이오. 펜릴이 쓰러지는 즉시 부족 전사들을 모조리 섀도우렐름의 깃발 아래 집결시키시오."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_07/scene_19.webp",
        "shortCaption": "본토를 향한 대장정에 오른다.",
        "shortQuote": "형님, 조상들이 정해준 경계 안에서 살면 족합니다.",
        "narration": "실마리는 한밤중에 드러났다. 티타니아가 살해된 전령의 말안장 가죽 틈새에서 붉은 유리 가루를 찾아내 펜릴의 탁자 위에 쏟아부은 것이다. 그것은 남쪽 궁정 기병들만이 사용하는 특수 제련 유리였다.",
        "speakerName": "정복왕 펜릴",
        "speakerRole": "북방 백은 늑대 부족의 패왕",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/081_Fenrir.png",
        "quote": "형님, 조상들이 정해준 경계 안에서 살면 족합니다. 왜 무리하게 모든 부족을 하나로 묶어 황궁의 미움을 사려 하십니까? 이 목걸이를 돌려드릴 테니 이제 그만 항복하십시오."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_07/scene_35.webp",
        "shortCaption": "본토를 향한 대장정에 오른다.",
        "shortQuote": "포로를 베어 공포를 심는 것은 기사의 도리가 아닙니다.",
        "narration": "사흘 뒤, 펜릴은 바르가스트의 본진을 기습해 반역을 완전히 진압했다. 배신한 장수들은 처형되었으나, 펜릴은 바르가스트에게 독주를 건네며 무사로서의 마지막 명예를 허락했다. 승리의 함성이 대평원에 울려 퍼졌지만 펜릴의 눈빛에는 깊은 슬픔이 서려 있었다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "원하는 것을 말해라, 젊은 전사여. 이 대평원의 절반이라도 베어 주마."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_07/scene_46.webp",
        "shortCaption": "정복왕 펜릴의 막사를 기습한 반란의 배후 데스나이트 아르투스의 선발대를 진압하고 북방의 의리를 지켜내라!",
        "shortQuote": "내게 가장 소중한 딸을 너에게 맡기마. 황야의 사자가 되어 부족을 이끌어라!",
        "narration": "정복왕 펜릴의 막사를 기습한 반란의 배후 데스나이트 아르투스의 선발대를 진압하고 북방의 의리를 지켜내라!",
        "speakerName": "펜릴",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "기억하겠다, 티타니아. 네 선택이 부끄럽지 않도록 살아 돌아오마."
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "데스나이트 아르투스",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
    "bossHeroSpec": {
      "heroNameKo": "데스나이트 아르투스",
      "titleKo": "제7화 보스 · 섀도우렐름 섭정 · 죽음의 기사",
      "factionLabelKo": "섀도우렐름 죽음기사단 · 와일드랜드",
      "portraitUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
      "heroPowerNameKo": "서리 철갑 방벽",
      "heroPowerTextKo": "방어도를 +2 얻습니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
      "accentColor": "#818cf8",
      "frameGradient": "linear-gradient(180deg, #3730a3 0%, #0f172a 100%)",
      "skyTop": "#0f172a",
      "skyMid": "#312e81",
      "skyBot": "#020617",
      "halo": "rgba(129, 140, 248, 0.55)",
      "emotesKo": {
        "greetings": "산 자의 맹세 따위, 죽음의 서리 앞에서는 부질없다.",
        "well_played": "그 방패... 옛 아케 성기사단의 기운이 서려 있군.",
        "thanks": "네 망설임이 내 흑요석 대검의 먹잇감이다.",
        "wow": "내 필살의 참격을 정면으로 받아내다니...!",
        "oops": "검기가 한 치 어긋났군.",
        "threaten": "섀도우렐름의 차가운 어둠 속에 영원히 잠들어라!",
        "start": "흑요석 마검이여, 가로막는 모든 방패를 두 동강 내라!",
        "concede": "크윽... 부서지지 않는 신념이로군. 이 승부는 아직 끝나지 않았다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 8,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "붉은 갈기의 기수",
    "locationKo": "국경 관문 도시 페가수스 밸리",
    "oneLineKo": "순수한 카단의 적갈기 명마를 강탈하려는 국경 관문의 사병대장 볼튼과 약탈 기병대를 혼내 주어라!",
    "novelEpisodeUrl": "/book?ep=8",
    "webtoonEpisodeUrl": "/webtoon?ep=8",
    "bookMdUrl": "/book/episode_08.md",
    "coverIllustrationUrl": "/images/webtoon/episode_08/scene_04.webp",
    "prevContextKo": "북방 설원을 넘어 처음으로 남쪽 번화가 페가수스 밸리에 발을 디딘 카단은 대륙 본토의 활기와 위선을 동시에 마주한다.",
    "synopsisKo": "어떤 조련사도 태우지 못한 전설의 적갈기 야생 명마가 난동을 부리자, 카단은 채찍 대신 별빛 호흡의 평온함으로 교감해 명마의 진정한 주인이 된다. 이어 시장에서 남루한 거지 소년 차림으로 탐욕스러운 상인의 누명을 통쾌한 추리로 깨부수는 천재 소녀 지략가 ‘실리아’와 운명적인 첫 동행을 시작한다.",
    "battleReasonKo": "순수한 카단의 적갈기 명마를 강탈하려는 국경 관문의 사병대장 볼튼과 약탈 기병대를 혼내 주어라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "적갈기 페가수스",
        "role": "카단과 교감한 전설의 명마",
        "cutoutUrl": "/anime-character-sheets/cutouts/090_Pegasus.png",
        "side": "ALLY"
      },
      {
        "name": "사병대장 볼튼",
        "role": "페가수스 관문 약탈기병장",
        "cutoutUrl": "/hs-assets/bosses/boss_bolton.webp",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_08/scene_04.webp",
        "shortCaption": "카단은 채찍 대신 별빛 호흡의 평온함으로 교감해 명마의 진정한 주인이 된다.",
        "shortQuote": "단돈 은화 세 닢에 이 미친 괴물을 데려갈 용사 없소?",
        "narration": "와일드랜드의 얼어붙은 툰드라를 벗어나 남쪽으로 반나절을 달렸을 때, 풍경은 거친 암석 황무지에서 안개 낀 국경 관문 소도시 페가수스 밸리로 완만하게 바뀌어 있었다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "단돈 은화 세 닢에 이 미친 괴물을 데려갈 용사 없소? 가까이 갔다간 대가리가 깨질 테니 조심들 하시오!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_08/scene_17.webp",
        "shortCaption": "시장에서 남루한 거지 소년 차림으로 탐욕스러운 상인의 누명을 통쾌한 추리로 깨부수는 천재 소녀 지략가…",
        "shortQuote": "증거가 명백하니 폭력을 거두시오. 아이의 말이 사실이오.",
        "narration": "상인이 몽둥이를 치켜들며 얼굴을 붉히자, 카단이 둘 사이를 막아서며 무쇠 방패의 모서리로 몽둥이를 가볍게 밀어냈다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "증거가 명백하니 폭력을 거두시오. 아이의 말이 사실이오."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_08/scene_32.webp",
        "shortCaption": "시장에서 남루한 거지 소년 차림으로 탐욕스러운 상인의 누명을 통쾌한 추리로 깨부수는 천재 소녀 지략가…",
        "shortQuote": "말과 돈을 얌전히 넘기면 목숨만은 살려주마!",
        "narration": "식사를 마치고 어두워진 장터 골목을 빠져나오던 중, 적갈기를 노리고 뒤를 밟던 마구간 도적 열두 명이 칼을 빼 들고 앞뒤를 가로막았다. 도적 두목이 흉악한 칼날을 들이댔다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "말과 돈을 얌전히 넘기면 목숨만은 살려주마! 저 명마 한 필이면 우리 패거리가 일 년은 떵떵거리며 산다!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_08/scene_42.webp",
        "shortCaption": "순수한 카단의 적갈기 명마를 강탈하려는 국경 관문의 사병대장 볼튼과 약탈 기병대를 혼내 주어라!",
        "shortQuote": "천한 방랑자가 감히 내 정의를 논하느냐?",
        "narration": "순수한 카단의 적갈기 명마를 강탈하려는 국경 관문의 사병대장 볼튼과 약탈 기병대를 혼내 주어라!",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "천한 방랑자가 감히 내 정의를 논하느냐? 그 알량한 단검으로 내 불꽃을 막을 수 있는지 시험해 보아라!"
      }
    ],
    "bossHeroClass": "HUNTER",
    "bossNameKo": "사병대장 볼튼",
    "bossCutoutUrl": "/hs-assets/bosses/boss_bolton.webp",
    "bossHeroSpec": {
      "heroNameKo": "사병대장 볼튼",
      "titleKo": "제8화 보스 · 페가수스 관문 약탈기병장",
      "factionLabelKo": "페가수스 관문 약탈기병대 · 국경",
      "portraitUrl": "/hs-assets/bosses/boss_bolton.webp",
      "heroPowerNameKo": "관문 기병 연사",
      "heroPowerTextKo": "적 영웅에게 피해를 2 줍니다.",
      "heroPowerIconUrl": "/hs-assets/bosses/boss_bolton.webp",
      "accentColor": "#ea580c",
      "frameGradient": "linear-gradient(180deg, #9a3412 0%, #431407 100%)",
      "skyTop": "#431407",
      "skyMid": "#9a3412",
      "skyBot": "#1c0a04",
      "halo": "rgba(251, 146, 60, 0.5)",
      "emotesKo": {
        "greetings": "촌뜨기 녀석! 그 적갈기 명마는 오늘부터 이 볼튼 님의 것이다!",
        "well_played": "칫, 시골 무사 녀석이 힘 하나는 장사로군!",
        "thanks": "하하하! 통행세까지 두둑히 챙겨 주마!",
        "wow": "럴수, 적갈기 명마와 한 몸처럼 움직이다니?!",
        "oops": "에잇, 채찍이 엉켰잖아!",
        "threaten": "관문 사병대 전원 돌격! 말과 짐을 몽땅 빼앗아라!",
        "start": "감히 내 구역에서 명마를 길들여? 본때를 보여줘라, 얘들아!",
        "concede": "아이구 살려주십쇼! 다시는 여행자와 명마에 손대지 않겠습니다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 9,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "거지 옷의 바람",
    "locationKo": "왕도 라이트헤븐 내성 결투 광장",
    "oneLineKo": "원수의 양자로 자라 무고한 이들을 짓밟는 불꽃 궁정의 귀공자 이그니스의 오만한 검을 정면으로 꺾어라!",
    "novelEpisodeUrl": "/book?ep=9",
    "webtoonEpisodeUrl": "/webtoon?ep=9",
    "bookMdUrl": "/book/episode_09.md",
    "coverIllustrationUrl": "/images/webtoon/episode_09/scene_05.webp",
    "prevContextKo": "카단과 실리아가 당도한 왕도 라이트헤븐 광장에서는 거만한 귀족 공자가 비무 초빙을 빙자해 서민 무인들을 짓밟고 있었다.",
    "synopsisKo": "붉은 비단 예복을 입은 소년 귀족의 정체는 원수 루시안의 양자로 길러진 발리안의 친아들 ‘이그니스’였다! 출생의 비밀을 모른 채 권력과 오만에 취해 암흑 사술까지 섞어 쓰는 이그니스 앞에 카단이 나서 정면으로 격돌하고, 은둔 무인 워커의 조력 속에 첫 숙명의 라이벌전을 펼친다.",
    "battleReasonKo": "원수의 양자로 자라 무고한 이들을 짓밟는 불꽃 궁정의 귀공자 이그니스의 오만한 검을 정면으로 꺾어라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "워커",
        "role": "왕도 뒷골목의 은둔 무인",
        "cutoutUrl": "/anime-character-sheets/cutouts/051_Walker.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_09/scene_05.webp",
        "shortCaption": "붉은 비단 예복을 입은 소년 귀족의 정체는 원수 루시안의 양자로 길러진 발리안의 친아들 ‘이그니스’였다!",
        "shortQuote": "황궁의 사회관이 황금 나팔을 불며 목청을 높였다.",
        "narration": "라이트헤븐 내성 광장의 거대한 결투 무대 위는 순식간에 살얼음판 같은 팽팽한 긴장감으로 얼어붙었다.",
        "speakerName": "황궁 사회관",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "와일드랜드에서 온 미천한 부랑자가 감히 황실 백색 화염 기사단의 명예에 도전장을 내밀었도다! 기사단장 이그니스 경의 자비 없는 심판을 보라!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_09/scene_19.webp",
        "shortCaption": "은둔 무인 워커의 조력 속에 첫 숙명의 라이벌전을 펼친다.",
        "shortQuote": "고르고의 생명 흡수 독이에요.",
        "narration": "출생의 비밀을 모른 채 권력과 오만에 취해 암흑 사술까지 섞어 쓰는 이그니스 앞에 카단이 나서 정면으로 격돌하고, 은둔 무인 워커의 조력 속에 첫 숙명의 라이벌전을 펼친다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "고르고의 생명 흡수 독이에요. 이대로 두면 사흘 안에 심장이 굳어 돌이 되고 말아요."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_09/scene_34.webp",
        "shortCaption": "은둔 무인 워커의 조력 속에 첫 숙명의 라이벌전을 펼친다.",
        "shortQuote": "은빛 단검의 룬이라면 어떤 봉인도 풀 수 있습니다. 제가 가겠습니다.",
        "narration": "출생의 비밀을 모른 채 권력과 오만에 취해 암흑 사술까지 섞어 쓰는 이그니스 앞에 카단이 나서 정면으로 격돌하고, 은둔 무인 워커의 조력 속에 첫 숙명의 라이벌전을 펼친다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "은빛 단검의 룬이라면 어떤 봉인도 풀 수 있습니다. 제가 가겠습니다."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_09/scene_45.webp",
        "shortCaption": "원수의 양자로 자라 무고한 이들을 짓밟는 불꽃 궁정의 귀공자 이그니스의 오만한 검을 정면으로 꺾어라!",
        "shortQuote": "약초를 달여 워커 님을 치료한 뒤, 곧바로 수용소로 가요.",
        "narration": "원수의 양자로 자라 무고한 이들을 짓밟는 불꽃 궁정의 귀공자 이그니스의 오만한 검을 정면으로 꺾어라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "약초를 달여 워커 님을 치료한 뒤, 곧바로 수용소로 가요. 바람이 우리의 길잡이가 되어줄 테니까요."
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "귀공자 이그니스",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
    "bossHeroSpec": {
      "heroNameKo": "귀공자 이그니스",
      "titleKo": "제9화 보스 · 발리안의 친아들 · 불꽃 궁정의 양자",
      "factionLabelKo": "붉은 유리 궁정의 양자 · 왕도",
      "portraitUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
      "heroPowerNameKo": "불꽃 귀공자 갑주",
      "heroPowerTextKo": "방어도를 +2 얻습니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
      "accentColor": "#f97316",
      "frameGradient": "linear-gradient(180deg, #ea580c 0%, #7c2d12 100%)",
      "skyTop": "#450a0a",
      "skyMid": "#c2410c",
      "skyBot": "#1c0703",
      "halo": "rgba(251, 146, 60, 0.6)",
      "emotesKo": {
        "greetings": "남루한 거지 행색으로 감히 내 비무대에 오르다니, 가소롭군!",
        "well_played": "흥... 내 불꽃 검기를 정면으로 흘려내다니, 정체가 뭐냐!",
        "thanks": "궁정의 귀공자에게 당연한 예우다.",
        "wow": "이럴 수가... 내 가슴속 단검과 똑같은 기운이 느껴져?!",
        "oops": "불길이 너무 거셌나 보군.",
        "threaten": "루시안 아버님의 이름을 걸고 네 오만한 방패를 녹여버리겠다!",
        "start": "비켜서지 않겠다면 내 진홍빛 화염검으로 베어 넘기겠다!",
        "concede": "크윽... 왜지? 네 눈빛을 보면 이상하게도 검 끝이 떨리는구나...!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 10,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "불꽃 궁정의 포로",
    "locationKo": "라이트헤븐 붉은 유리 궁전 외곽",
    "oneLineKo": "은신처를 포위한 최고 재상 루시안과 불꽃 궁정 친위 기사단을 돌파하고 지하 감옥 구출로를 확보하라!",
    "novelEpisodeUrl": "/book?ep=10",
    "webtoonEpisodeUrl": "/webtoon?ep=10",
    "bookMdUrl": "/book/episode_10.md",
    "coverIllustrationUrl": "/images/webtoon/episode_10/scene_05.webp",
    "prevContextKo": "광장 결투 이후 루시안의 본거지인 붉은 유리 궁전을 정찰하던 카단과 실리아는 궁정 깊숙한 곳에 숨겨진 충격적인 비밀을 감지한다.",
    "synopsisKo": "죽은 줄 알았던 이그니스의 친어머니 이셀라가 18년 동안 루시안의 감시 아래 유폐되어 있었고, 지하 감옥에는 반역자로 낙인찍힌 양심수들이 신음하고 있었다. 실리아의 치밀한 환기구 분석으로 잠입 작전을 세우던 밤, 진홍빛 예복의 재상 루시안이 친위 불꽃 기사단을 이끌고 은신처를 급습한다.",
    "battleReasonKo": "은신처를 포위한 최고 재상 루시안과 불꽃 궁정 친위 기사단을 돌파하고 지하 감옥 구출로를 확보하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "이셀라",
        "role": "이그니스의 어머니 · 납치된 성녀",
        "cutoutUrl": "/anime-character-sheets/cutouts/034_Ysela.png",
        "side": "ALLY"
      },
      {
        "name": "루시안",
        "role": "붉은 유리 궁정 재상 · 만악의 근원",
        "cutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "side": "ENEMY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_10/scene_05.webp",
        "shortCaption": "지하 감옥에는 반역자로 낙인찍힌 양심수들이 신음하고 있었다.",
        "shortQuote": "보라, 발리안 경의 피를 이어받은 순백의 화염이다!",
        "narration": "라이트헤븐 내성의 심장부에 우뚝 솟은 붉은 유리 궁전은 대륙 어디에서도 볼 수 없는 기괴하고도 찬란한 위용을 자랑했다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "보라, 발리안 경의 피를 이어받은 순백의 화염이다! 황실의 가장 순결한 검이 바로 저기에 있도다!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_10/scene_19.webp",
        "shortCaption": "진홍빛 예복의 재상 루시안이 친위 불꽃 기사단을 이끌고 은신처를 급습한다.",
        "shortQuote": "어머니의 뇌리에 고르고의 암흑 망각 주술이 겹겹이 얽혀 있어요.",
        "narration": "실리아가 바람의 기운을 모아 초가집 주변의 감시 룬을 차단하며 속삭였다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "어머니의 뇌리에 고르고의 암흑 망각 주술이 겹겹이 얽혀 있어요. 제가 바람의 룬으로 매듭을 풀 테니, 카단 당신이 기억의 단초를 던져주세요."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_10/scene_34.webp",
        "shortCaption": "진홍빛 예복의 재상 루시안이 친위 불꽃 기사단을 이끌고 은신처를 급습한다.",
        "shortQuote": "마법에 걸려 누구의 목소리인지조차 기억하지 못했어...",
        "narration": "실리아의 치밀한 환기구 분석으로 잠입 작전을 세우던 밤, 진홍빛 예복의 재상 루시안이 친위 불꽃 기사단을 이끌고 은신처를 급습한다.",
        "speakerName": "이셀라",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "역시 쥐새끼들이 숨어들었군. 이셀라, 네 기억이 돌아왔다면 더욱 쓸모가 커졌지. 발리안의 숨통을 끊기 전에 그 고결한 아내의 절규를 들려주면 마침내 옥좌의 문장을 내놓을 테니!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_10/scene_45.webp",
        "shortCaption": "은신처를 포위한 최고 재상 루시안과 불꽃 궁정 친위 기사단을 돌파하고 지하 감옥 구출로를 확보하라!",
        "shortQuote": "약속하겠습니다, 아주머니.",
        "narration": "은신처를 포위한 최고 재상 루시안과 불꽃 궁정 친위 기사단을 돌파하고 지하 감옥 구출로를 확보하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "약속하겠습니다, 아주머니. 숙부님을 구해내고, 이그니스를 반드시 어머니의 품으로 돌려보내겠습니다."
      }
    ],
    "bossHeroClass": "MAGE",
    "bossNameKo": "재상 루시안",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
    "bossHeroSpec": {
      "heroNameKo": "재상 루시안",
      "titleKo": "제10화 보스 · 붉은 유리 궁정 재상 · 만악의 근원",
      "factionLabelKo": "붉은 유리 궁정 · 라이트헤븐",
      "portraitUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
      "heroPowerNameKo": "붉은 유리 화염탄",
      "heroPowerTextKo": "피해를 1 줍니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
      "accentColor": "#f43f5e",
      "frameGradient": "linear-gradient(180deg, #be123c 0%, #4c0519 100%)",
      "skyTop": "#4c0519",
      "skyMid": "#9f1239",
      "skyBot": "#1c040c",
      "halo": "rgba(251, 113, 133, 0.55)",
      "emotesKo": {
        "greetings": "변방의 천한 것들이 감히 궁정의 뜻을 거스르느냐.",
        "well_played": "흥, 발버둥 치는 꼴이 제법 볼만하군.",
        "thanks": "네 어리석음이 내 패업을 앞당기는구나.",
        "wow": "이 따위 변수가 생길 줄이야...!",
        "oops": "사소한 계산 착오일 뿐이다.",
        "threaten": "붉은 유리 궁정의 이름으로 흔적도 없이 불태워주마!",
        "start": "저 반역자들을 남김없이 베어라! 단 한 명도 살려 보내지 마라!",
        "concede": "크윽... 지금은 물러나지만, 궁정의 그림자는 끝까지 너희를 쫓을 것이다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 11,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "기억을 깨우는 단검",
    "locationKo": "붉은 유리 궁정 제7 지하 용암 감옥",
    "oneLineKo": "발리안과 이셀라의 탈출로를 가로막는 지하 용암 감옥 수호장 메두사 고르고의 맹공을 방패로 막아내라!",
    "novelEpisodeUrl": "/book?ep=11",
    "webtoonEpisodeUrl": "/webtoon?ep=11",
    "bookMdUrl": "/book/episode_11.md",
    "coverIllustrationUrl": "/images/webtoon/episode_11/scene_05.webp",
    "prevContextKo": "용암 열기가 들끓는 지하 폐광 감옥 깊숙이 잠입한 카단과 실리아는 쇠사슬에 묶인 채 18년을 버텨온 창술사 발리안을 발견한다.",
    "synopsisKo": "추격해 온 이그니스가 친아버지인 줄도 모른 채 발리안에게 화염 검을 겨누자, 발리안은 살상 대신 아들의 검 궤도만을 쳐내는 아케 가문 비전 창술을 보여준다. 동시에 카단이 꺼낸 은빛 단검 한 쌍이 공명하며 출생의 진실이 흔들리고, 뒤따라온 감옥장 메두사 고르고의 사슬 채찍을 카단이 방패로 막아내며 탈출을 성공시킨다.",
    "battleReasonKo": "발리안과 이셀라의 탈출로를 가로막는 지하 용암 감옥 수호장 메두사 고르고의 맹공을 방패로 막아내라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "발리안",
        "role": "이그니스의 친아들 아버지 · 아케 창술사",
        "cutoutUrl": "/anime-character-sheets/cutouts/043_Balian.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "이셀라",
        "role": "이그니스의 어머니 · 납치된 성녀",
        "cutoutUrl": "/anime-character-sheets/cutouts/034_Ysela.png",
        "side": "ALLY"
      },
      {
        "name": "메두사 고르고",
        "role": "나인섀도우 코덱스를 훔친 암흑 마녀",
        "cutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_11/scene_05.webp",
        "shortCaption": "발리안은 살상 대신 아들의 검 궤도만을 쳐내는 아케 가문 비전 창술을 보여준다.",
        "shortQuote": "순찰 간격은 정확히 삼백 번의 호흡이에요.",
        "narration": "성기사 발리안이 갇혀 있는 제7 지하 노동 감옥은 붉은 유리 궁정의 가장 깊은 지하실 아래에 버려진 거대한 화산 폐광산과 거미줄처럼 이어져 있었다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "순찰 간격은 정확히 삼백 번의 호흡이에요. 환기구가 열릴 때 생기는 역풍을 타면 감시탑의 룬 렌즈를 피할 수 있어요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_11/scene_20.webp",
        "shortCaption": "뒤따라온 감옥장 메두사 고르고의 사슬 채찍을 카단이 방패로 막아내며 탈출을 성공시킨다.",
        "shortQuote": "칼을 거두고 진실을 보아라, 이그니스!",
        "narration": "카단은 맞서 싸우는 대신, 품속에서 꺼낸 어머니 엘윈의 서한과 비밀 일지를 이그니스의 발밑으로 던졌다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "칼을 거두고 진실을 보아라, 이그니스! 네 눈앞에 서 계신 분이 바로 네 친아버지 발리안 공작님이시다!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_11/scene_36.webp",
        "shortCaption": "뒤따라온 감옥장 메두사 고르고의 사슬 채찍을 카단이 방패로 막아내며 탈출을 성공시킨다.",
        "shortQuote": "바람섬 놈들은 믿을 수 없어!",
        "narration": "지상으로 탈출한 카단 일행을 맞이한 것은 은신처에서 대기하고 있던 여섯 스승이었다. 스승들은 카단이 상의도 없이 무모하게 궁정에 잠입한 것에 크게 분노했고, 함께 온 실리아가 바람섬 군주 에올루스의 외동딸이라는 사실에 더욱 크게 경악했다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "바람섬 놈들은 믿을 수 없어! 오래전 우리 의형제 로비냐드를 잔인하게 살해한 메두사 고르고 역시 그 저주받은 섬의 제자가 아니었더냐!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_11/scene_48.webp",
        "shortCaption": "발리안과 이셀라의 탈출로를 가로막는 지하 용암 감옥 수호장 메두사 고르고의 맹공을 방패로 막아내라!",
        "shortQuote": "실리아? 너 역시 스승의 죄악에서 결코 자유롭지 못할 것이다.",
        "narration": "발리안과 이셀라의 탈출로를 가로막는 지하 용암 감옥 수호장 메두사 고르고의 맹공을 방패로 막아내라!",
        "speakerName": "메두사 고르고",
        "speakerRole": "나인섀도우 코덱스를 훔친 암흑 마녀",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
        "quote": "에올루스가 그 가증스러운 코덱스의 비밀을 지키기 위해 얼마나 많은 제자들의 목숨을 쓰레기처럼 버렸는지 아느냐, 실리아? 너 역시 스승의 죄악에서 결코 자유롭지 못할 것이다."
      }
    ],
    "bossHeroClass": "ROGUE",
    "bossNameKo": "감옥장 메두사 고르고",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
    "bossHeroSpec": {
      "heroNameKo": "감옥장 메두사 고르고",
      "titleKo": "제11화 보스 · 나인섀도우 코덱스를 훔친 암흑 마녀",
      "factionLabelKo": "나인섀도우 암흑마녀 · 붉은",
      "portraitUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
      "heroPowerNameKo": "용암 사슬 비수",
      "heroPowerTextKo": "1/2 단검을 장착합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
      "accentColor": "#a855f7",
      "frameGradient": "linear-gradient(180deg, #6b21a8 0%, #1e1b4b 100%)",
      "skyTop": "#1e1b4b",
      "skyMid": "#581c87",
      "skyBot": "#090514",
      "halo": "rgba(192, 132, 252, 0.55)",
      "emotesKo": {
        "greetings": "후후... 어둠과 빗소리 속에서 내 독니를 볼 수 있겠니?",
        "well_played": "호오, 눈을 감고 내 살기를 읽었단 말이냐?",
        "thanks": "두려움에 떨수록 맹독은 더 빨리 퍼지지.",
        "wow": "내 흑암 연막을 은빛 단검으로 찢어내다니!",
        "oops": "칫, 빗방울 파동을 들켰군.",
        "threaten": "돌처럼 굳어 영원히 이 동굴의 석상이 되어라!",
        "start": "폭우 속의 유령이 네 숨통을 소리 없이 거두어 주마!",
        "concede": "내 손목에 상처를 입히다니... 알렉산다르의 핏줄, 다음에 반드시 끝장내주마!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 12,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "두 무덤 사이의 봄",
    "locationKo": "왕도 외곽 잊힌 옛 성기사단 성소",
    "oneLineKo": "선대 성기사들의 넋이 잠든 옛 성소를 파괴하려는 궁정 공성거신 아이언포지를 물리쳐라!",
    "novelEpisodeUrl": "/book?ep=12",
    "webtoonEpisodeUrl": "/webtoon?ep=12",
    "bookMdUrl": "/book/episode_12.md",
    "coverIllustrationUrl": "/images/webtoon/episode_12/scene_04.webp",
    "prevContextKo": "18년 만에 해후한 발리안과 이셀라는 옛 성기사단의 폐허 성소에서 눈물로 재회하며 카단에게 지난날 엘윈 마을의 모든 진실을 들려준다.",
    "synopsisKo": "부모 세대의 숭고한 희생을 알게 된 카단은 증오가 아닌 수호의 길을 다시금 다짐한다. 그러나 성소까지 추격해 온 궁정 마도 공성 거신이 성역을 짓밟으려 들자, 발리안은 카단에게 두 번째 은빛 단검을 맡기며 성소의 결계를 함께 지켜낸다.",
    "battleReasonKo": "선대 성기사들의 넋이 잠든 옛 성소를 파괴하려는 궁정 공성거신 아이언포지를 물리쳐라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "발리안",
        "role": "이그니스의 친아들 아버지 · 아케 창술사",
        "cutoutUrl": "/anime-character-sheets/cutouts/043_Balian.png",
        "side": "ALLY"
      },
      {
        "name": "헤르쿨",
        "role": "은빛 단검을 전한 순례 성기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "거신 아이언포지",
        "role": "봉인 석실의 수호 거신병",
        "cutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_12/scene_04.webp",
        "shortCaption": "부모 세대의 숭고한 희생을 알게 된 카단은 증오가 아닌 수호의 길을 다시금 다짐한다.",
        "shortQuote": "발리안, 조금만 더 기운을 내요.",
        "narration": "수도 라이트헤븐의 외곽을 둘러싼 울창한 고대 참나무 숲 깊은 곳에는 세월의 풍파에 잊힌 옛 성기사단의 버려진 성소가 무거운 침묵 속에 잠겨 있었다.",
        "speakerName": "이셀라",
        "speakerRole": "이그니스의 어머니 · 납치된 성녀",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/034_Ysela.png",
        "quote": "발리안, 조금만 더 기운을 내요. 카단이 가져온 치유의 비약이 곧 상처의 불길을 가라앉힐 거예요. 우리 아이를... 이그니스를 다시 품에 안아야 하잖아요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_12/scene_18.webp",
        "shortCaption": "발리안은 카단에게 두 번째 은빛 단검을 맡기며 성소의 결계를 함께 지켜낸다.",
        "shortQuote": "성소 북쪽 계곡으로 피난민들과 이셀라 님을 모셔야 해요!",
        "narration": "그러나 성소까지 추격해 온 궁정 마도 공성 거신이 성역을 짓밟으려 들자, 발리안은 카단에게 두 번째 은빛 단검을 맡기며 성소의 결계를 함께 지켜낸다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "성소 북쪽 계곡으로 피난민들과 이셀라 님을 모셔야 해요! 적의 화염 마법진이 숲을 포위하기 전에 어서요!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_12/scene_32.webp",
        "shortCaption": "발리안은 카단에게 두 번째 은빛 단검을 맡기며 성소의 결계를 함께 지켜낸다.",
        "shortQuote": "숙부님, 당신이 지켜온 불씨는 결코 꺼지지 않을 것입니다.",
        "narration": "발리안은 품속에서 성기사단의 비밀 맹세가 새겨진 오래된 은빛 단검 한 자루를 꺼내 카단의 손에 쥐여주었다. 카단은 단검의 서늘한 칼날을 쥐며 숙부의 눈을 응시했다.",
        "speakerName": "발리안",
        "speakerRole": "이그니스의 친아들 아버지 · 아케 창술사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/043_Balian.png",
        "quote": "숙부님, 당신이 지켜온 불씨는 결코 꺼지지 않을 것입니다. 반드시 이그니스를 구하고 대륙의 평화를 되찾겠습니다."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_12/scene_43.webp",
        "shortCaption": "선대 성기사들의 넋이 잠든 옛 성소를 파괴하려는 궁정 공성거신 아이언포지를 물리쳐라!",
        "shortQuote": "우리가 걸어갈 길도 마찬가지일 거다. 바다 건너 바람섬으로 가자.",
        "narration": "선대 성기사들의 넋이 잠든 옛 성소를 파괴하려는 궁정 공성거신 아이언포지를 물리쳐라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "우리가 걸어갈 길도 마찬가지일 거다. 바다 건너 바람섬으로 가자."
      }
    ],
    "bossHeroClass": "PALADIN",
    "bossNameKo": "공성거신 아이언포지",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
    "bossHeroSpec": {
      "heroNameKo": "공성거신 아이언포지",
      "titleKo": "제12화 보스 · 봉인 석실의 수호 거신병",
      "factionLabelKo": "고대 강철 수호 거신 · 왕도",
      "portraitUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
      "heroPowerNameKo": "마도 경비병 호출",
      "heroPowerTextKo": "1/1 수호병을 하나 소환합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
      "accentColor": "#eab308",
      "frameGradient": "linear-gradient(180deg, #ca8a04 0%, #422006 100%)",
      "skyTop": "#292524",
      "skyMid": "#854d0e",
      "skyBot": "#0c0a09",
      "halo": "rgba(250, 204, 21, 0.55)",
      "emotesKo": {
        "greetings": "[경고] 성역 침입자 감지. 수호 프로토콜을 가동합니다.",
        "well_played": "[분석] 아케 성기사단 정통 무예 파장과 일치합니다.",
        "thanks": "[충전] 마도 동력 코어 출력이 상승합니다.",
        "wow": "[경보] 아다만티움 장갑에 임계 충격 발생!",
        "oops": "[오류] 마도 조준경 미세 편차 발생.",
        "threaten": "[섬멸] 거신 중력포 최대 출력으로 제압합니다!",
        "start": "[기동 완료] 자격을 증명하지 못하는 자는 한 걸음도 지나갈 수 없다!",
        "concede": "[승인 완료] 고결한 수호자의 자격 확인... 성물의 봉인을 해제합니다."
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 13,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "녹옥 지팡이의 주인",
    "locationKo": "동해안 삼나무 안개 숲길",
    "oneLineKo": "녹옥 지팡이를 물려받을 자격을 증명하기 위해, 전설의 노장 레오나르가 내리는 실전 대련 시험을 이겨내라!",
    "novelEpisodeUrl": "/book?ep=13",
    "webtoonEpisodeUrl": "/webtoon?ep=13",
    "bookMdUrl": "/book/episode_13.md",
    "coverIllustrationUrl": "/images/webtoon/episode_13/scene_04.webp",
    "prevContextKo": "루시안의 추적을 피해 동해안 안개 호수로 향하던 카단과 실리아는 숲속 주막에서 호방한 거지 차림의 기이한 노인과 마주친다.",
    "synopsisKo": "실리아가 정성껏 차려낸 요리로 노인의 마음을 사로잡자, 노인은 자신이 한때 대륙의 의인 연맹을 이끌었던 전설의 대장군 ‘레오나르’임을 밝힌다. 홀로 방황하던 이그니스까지 우연히 합류하며, 레오나르는 실리아의 총명함과 의협심을 인정해 지휘관의 증표인 ‘녹옥 지팡이’와 비전 타격술을 전수한다.",
    "battleReasonKo": "녹옥 지팡이를 물려받을 자격을 증명하기 위해, 전설의 노장 레오나르가 내리는 실전 대련 시험을 이겨내라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "노장 레오나르",
        "role": "녹옥 지팡이의 주인 · 옛 대장군",
        "cutoutUrl": "/anime-character-sheets/cutouts/086_Leonar.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_13/scene_04.webp",
        "shortCaption": "노인은 자신이 한때 대륙의 의인 연맹을 이끌었던 전설의 대장군 ‘레오나르’임을 밝힌다.",
        "shortQuote": "바다에서 불어오는 바람이 점점 무거워지고 있어요.",
        "narration": "동해안으로 굽이쳐 흐르는 해안 산맥의 험준한 삼나무 숲길은 며칠 동안 내린 이른 봄비로 질척하게 젖어 있었다. 빽빽하게 우거진 침엽수림 사이로는 짙은 바다 안개가 밀려들었고, 젖은 흙바닥과 바위 표면에서는 축축한 이끼 냄새와 솔잎 향이 뒤섞여 피어올랐다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "바다에서 불어오는 바람이 점점 무거워지고 있어요. 바람 속삭임 섬의 결계탑이 흔들리면서 동해안의 마나 균형이 무너지고 있다는 증거예요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_13/scene_17.webp",
        "shortCaption": "레오나르는 실리아의 총명함과 의협심을 인정해 지휘관의 증표인 ‘녹옥 지팡이’와 비전 타격술을 전수한다.",
        "shortQuote": "레오나르가 입가에 고인 침을 닦으며 호기심 어린 눈을 번뜩였다.",
        "narration": "레오나르가 입가에 고인 침을 닦으며 호기심 어린 눈을 번뜩였다.",
        "speakerName": "레오나르",
        "speakerRole": "녹옥 지팡이의 주인 · 옛 대장군",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/086_Leonar.png",
        "quote": "허허, 웬 당돌한 계집애와 북방의 나무토막 같은 애송이가 남의 주안상에 참견질이냐!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_13/scene_32.webp",
        "shortCaption": "레오나르는 실리아의 총명함과 의협심을 인정해 지휘관의 증표인 ‘녹옥 지팡이’와 비전 타격술을 전수한다.",
        "shortQuote": "황궁의 기사단에서 나는 영웅이라 불렸지만, 사실은 루시안이 조종하는 허수아비에 불과했다.",
        "narration": "홀로 방황하던 이그니스까지 우연히 합류하며, 레오나르는 실리아의 총명함과 의협심을 인정해 지휘관의 증표인 ‘녹옥 지팡이’와 비전 타격술을 전수한다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "황궁의 기사단에서 나는 영웅이라 불렸지만, 사실은 루시안이 조종하는 허수아비에 불과했다. 발리안 경이 내 아버지이고, 내 어머니가 그 차가운 정원에서 십팔 년 동안 물레를 돌리던 죄수였다니... 나는 도대체 무엇을 위해 검을 휘둘러 왔단 말인가."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_13/scene_42.webp",
        "shortCaption": "녹옥 지팡이를 물려받을 자격을 증명하기 위해, 전설의 노장 레오나르가 내리는 실전 대련 시험을 이겨내라!",
        "shortQuote": "그 배신의 불씨가 결국 대륙 전체를 전쟁의 소용돌이로 몰아넣은 거다.",
        "narration": "녹옥 지팡이를 물려받을 자격을 증명하기 위해, 전설의 노장 레오나르가 내리는 실전 대련 시험을 이겨내라!",
        "speakerName": "레오나르",
        "speakerRole": "녹옥 지팡이의 주인 · 옛 대장군",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/086_Leonar.png",
        "quote": "그렇다, 아가씨. 충성스러운 자들은 말이 없는 법이지. 어서 가자, 구름돌아오는장원에서 그 늙은 사공의 술잔을 채워주어야 하지 않겠느냐!"
      }
    ],
    "bossHeroClass": "SHAMAN",
    "bossNameKo": "노장 레오나르",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/086_Leonar.png",
    "bossHeroSpec": {
      "heroNameKo": "노장 레오나르",
      "titleKo": "제13화 보스 · 녹옥 지팡이의 주인 · 옛 대장군",
      "factionLabelKo": "의인 연맹 전설 대장군 · 동해안",
      "portraitUrl": "/anime-character-sheets/cutouts/086_Leonar.png",
      "heroPowerNameKo": "녹옥 전술 진영",
      "heroPowerTextKo": "무작위 주술 토템을 하나 소환합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/086_Leonar.png",
      "accentColor": "#10b981",
      "frameGradient": "linear-gradient(180deg, #059669 0%, #064e3b 100%)",
      "skyTop": "#064e3b",
      "skyMid": "#047857",
      "skyBot": "#022c22",
      "halo": "rgba(52, 211, 153, 0.55)",
      "emotesKo": {
        "greetings": "껄껄껄! 맛있는 밥값 대신 이 늙은이가 뼈마디 좀 풀어주마!",
        "well_played": "오호라! 지략과 우직함이 아주 찰떡궁합이로구나!",
        "thanks": "따뜻한 국밥 한 그릇에 마음이 다 든든하구먼!",
        "wow": "하하하! 내 녹옥 지팡이가 새 주인을 알아보고 우는구나!",
        "oops": "허허, 허리가 삐끗했나 보다!",
        "threaten": "전설 대장군의 녹옥 타격술을 한 수 제대로 받아 보아라!",
        "start": "자, 간다! 녹옥 지팡이를 물려받을 그릇인지 온몸으로 부딪쳐 보거라!",
        "concede": "껄껄껄! 합격이다, 실리아, 카단! 대륙의 다음 시대는 너희 몫이다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 14,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "안개 호수의 손님들",
    "locationKo": "동해안 안개 호수 ‘구름돌아오는장원’",
    "oneLineKo": "피난민 아이들이 머무는 안개 호수 장원을 약탈하려는 수적두목 아쿠아로드를 수장시켜라!",
    "novelEpisodeUrl": "/book?ep=14",
    "webtoonEpisodeUrl": "/webtoon?ep=14",
    "bookMdUrl": "/book/episode_14.md",
    "coverIllustrationUrl": "/images/webtoon/episode_14/scene_04.webp",
    "prevContextKo": "일흔두 개의 거대한 현무암 석주가 솟은 안개 호수에서 카단은 스승 론돌의 옛 전우들이 지키는 피난민 장원을 방문한다.",
    "synopsisKo": "전쟁고아와 난민들을 돌보는 장원에 궁정의 앞잡이 수적두목 아쿠아로드가 들이닥쳐 약탈을 시도한다. 카단과 실리아는 물안개 지형과 얼음 다리를 활용해 주민들을 먼저 대피시키고 수적단을 격파하며, 뒤따라온 이그니스는 난민들이 내민 따뜻한 산나물 국 한 그릇에 처음으로 황실 바깥 민중의 온기를 느낀다.",
    "battleReasonKo": "피난민 아이들이 머무는 안개 호수 장원을 약탈하려는 수적두목 아쿠아로드를 수장시켜라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "론돌",
        "role": "일곱 추적자 · 거친 파도의 뱃사공",
        "cutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "수문장 아쿠아로드",
        "role": "네 수문 요새를 막아선 심연 군주",
        "cutoutUrl": "/anime-character-sheets/cutouts/005_Aqualord.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_14/scene_04.webp",
        "shortCaption": "전쟁고아와 난민들을 돌보는 장원에 궁정의 앞잡이 수적두목 아쿠아로드가 들이닥쳐 약탈을 시도한다.",
        "shortQuote": "수몰된 종탑들이 물속에서 미세한 마나의 파동을 보내고 있어요.",
        "narration": "동해안 어귀에 드넓게 자리 잡은 안개 호수는 사시사철 자욱한 유백색 물안개에 덮여 있어 길손들의 발길을 쉬이 허락하지 않는 신비로운 곳이었다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "수몰된 종탑들이 물속에서 미세한 마나의 파동을 보내고 있어요. 물의 정령들이 여전히 저 아래에서 잠들어 있는 거예요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_14/scene_18.webp",
        "shortCaption": "뒤따라온 이그니스는 난민들이 내민 따뜻한 산나물 국 한 그릇에 처음으로 황실 바깥 민중의 온기를 느낀다.",
        "shortQuote": "숙부님의 의족에 새겨진 바람 룬을 보았습니다.",
        "narration": "카단이 한 걸음 앞으로 나서며 무쇠 방패를 가볍게 들어 보였다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "숙부님의 의족에 새겨진 바람 룬을 보았습니다. 알렉산다르 스승님께서도 바다의 벗 론돌의 충직함을 늘 칭송하셨습니다. 저희를 장원으로 인도해 주십시오."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_14/scene_32.webp",
        "shortCaption": "뒤따라온 이그니스는 난민들이 내민 따뜻한 산나물 국 한 그릇에 처음으로 황실 바깥 민중의 온기를 느낀다.",
        "shortQuote": "주민들은 얼음 다리를 건너 본채로 대피하십시오! 아이들을 먼저 챙기세요!",
        "narration": "론돌이 무쇠 의족을 굴러 호수 표면에 거대한 소용돌이를 일으켰고, 실리아는 허공으로 도약해 날카로운 질풍의 화살들을 퍼부었다. 카단은 기우는 부두 끝으로 달려가 무쇠 방패를 내리찍으며 수면에 거대한 서리의 얼음 다리를 펼쳤다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "주민들은 얼음 다리를 건너 본채로 대피하십시오! 아이들을 먼저 챙기세요!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_14/scene_43.webp",
        "shortCaption": "피난민 아이들이 머무는 안개 호수 장원을 약탈하려는 수적두목 아쿠아로드를 수장시켜라!",
        "shortQuote": "불 곁으로 다가와서 몸을 말려라, 이그니스.",
        "narration": "피난민 아이들이 머무는 안개 호수 장원을 약탈하려는 수적두목 아쿠아로드를 수장시켜라!",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "불 곁으로 다가와서 몸을 말려라, 이그니스. 내일 새벽이면 우리 모두 저 거친 대해로 나아가야 한다."
      }
    ],
    "bossHeroClass": "MAGE",
    "bossNameKo": "수적두목 아쿠아로드",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/005_Aqualord.png",
    "bossHeroSpec": {
      "heroNameKo": "수적두목 아쿠아로드",
      "titleKo": "제14화 보스 · 네 수문 요새를 막아선 심연 군주",
      "factionLabelKo": "심연 해역 타락 수군 · 동해안",
      "portraitUrl": "/anime-character-sheets/cutouts/005_Aqualord.png",
      "heroPowerNameKo": "안개 해류 수압탄",
      "heroPowerTextKo": "피해를 1 줍니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/005_Aqualord.png",
      "accentColor": "#0ea5e9",
      "frameGradient": "linear-gradient(180deg, #0369a1 0%, #082f49 100%)",
      "skyTop": "#082f49",
      "skyMid": "#0284c7",
      "skyBot": "#021627",
      "halo": "rgba(56, 189, 248, 0.55)",
      "emotesKo": {
        "greetings": "크하하! 물안개와 탁류 속에서 모두 수장시켜 주마!",
        "well_played": "육지 것들치고는 물길을 읽는 눈이 있군!",
        "thanks": "수위가 차오를수록 내 삼지창은 더욱 거세진다!",
        "wow": "말도 안 돼! 내 해일 방벽을 정면으로 가르다니?!",
        "oops": "물살이 잠시 역류했군!",
        "threaten": "차디찬 강물 밑바닥에서 물고기 밥이 되어라!",
        "start": "수문을 봉쇄하고 약탈 수군 전원 진격하라!",
        "concede": "크아악... 수문 장치가 부서지다니! 탁류 속으로 퇴각한다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 15,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "독사와 사자의 밤",
    "locationKo": "폭풍우 치는 구름돌아오는장원 본채",
    "oneLineKo": "노장 레오나르가 목숨 바쳐 지켜낸 아이들을 수호하기 위해, 황실 직속 암살단장 독거미 아라크네를 섬멸하라!",
    "novelEpisodeUrl": "/book?ep=15",
    "webtoonEpisodeUrl": "/webtoon?ep=15",
    "bookMdUrl": "/book/episode_15.md",
    "coverIllustrationUrl": "/images/webtoon/episode_15/scene_04.webp",
    "prevContextKo": "자정의 폭풍우가 안개 호수를 덮친 밤, 루시안이 비밀리에 파견한 황실 직속 독사·거미 암살단장 아라크네가 장원 전체를 몰살하기 위해 침투한다.",
    "synopsisKo": "맹독 단검에 찔리면서도 어린 난민 아이들을 품에 안고 버텨 선 노장 레오나르는 사자 같은 마지막 포효로 적들을 쓸어낸 뒤 평온히 눈을 감는다. 현장에 떨어진 암살단의 황실 친필 인장을 직접 확인한 이그니스는 자신이 믿었던 양아버지 루시안이 무고한 백성을 학살하는 원흉이었음을 깨닫고 피눈물을 흘린다.",
    "battleReasonKo": "노장 레오나르가 목숨 바쳐 지켜낸 아이들을 수호하기 위해, 황실 직속 암살단장 독거미 아라크네를 섬멸하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "노장 레오나르",
        "role": "녹옥 지팡이의 주인 · 옛 대장군",
        "cutoutUrl": "/anime-character-sheets/cutouts/086_Leonar.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "독거미 아라크네",
        "role": "루시안 휘하 맹독 암살단장",
        "cutoutUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
        "side": "ENEMY"
      },
      {
        "name": "메두사 고르고",
        "role": "나인섀도우 코덱스를 훔친 암흑 마녀",
        "cutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_15/scene_04.webp",
        "shortCaption": "맹독 단검에 찔리면서도 어린 난민 아이들을 품에 안고 버텨 선 노장 레오나르는 사자 같은 마지막 포효로 적들을…",
        "shortQuote": "실리아가 치유 물약 잔을 저으며 창밖의 험악한 비바람을 내다보았다.",
        "narration": "자정이 깊어갈 무렵, 안개 호수의 물결은 한층 더 거칠어지고 있었다. 동해안 산맥에서 불어닥친 사나운 밤바람이 구름돌아오는장원의 삼나무 지붕을 사정없이 흔들었고, 굵은 빗줄기가 호수 수면을 어지럽게 두드렸다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "호수의 수면 아래에서 불길한 기류가 소용돌이치고 있어요. 파도의 결이 평소와 달리 검붉은 마나를 머금고 뒤틀려 있네요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_15/scene_18.webp",
        "shortCaption": "현장에 떨어진 암살단의 황실 친필 인장을 직접 확인한 이그니스는 자신이 믿었던 양아버지 루시안이 무고한 백성을…",
        "shortQuote": "크윽... 꼬마들아, 괜찮으냐... 다친 곳은 없지...?",
        "narration": "아이들을 꼭 껴안은 채 무릎을 꿇은 레오나르의 입에서 짙은 핏덩이가 쏟아져 나왔다.",
        "speakerName": "노장 레오나르",
        "speakerRole": "녹옥 지팡이의 주인 · 옛 대장군",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/086_Leonar.png",
        "quote": "크윽... 꼬마들아, 괜찮으냐... 다친 곳은 없지...?"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_15/scene_33.webp",
        "shortCaption": "현장에 떨어진 암살단의 황실 친필 인장을 직접 확인한 이그니스는 자신이 믿었던 양아버지 루시안이 무고한 백성을…",
        "shortQuote": "황실의 인장... 루시안 재상이 직접 보낸 암살 도구였단 말인가? 무고한…",
        "narration": "현장에 떨어진 암살단의 황실 친필 인장을 직접 확인한 이그니스는 자신이 믿었던 양아버지 루시안이 무고한 백성을 학살하는 원흉이었음을 깨닫고 피눈물을 흘린다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "나는 대체 무엇을 위해 칼을 갈아왔던 것인가! 내 칼끝이 지킨 것은 평화가 아니라 황궁의 탐욕스러운 돼지들이었단 말인가!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_15/scene_44.webp",
        "shortCaption": "노장 레오나르가 목숨 바쳐 지켜낸 아이들을 수호하기 위해, 황실 직속 암살단장 독거미 아라크네를 섬멸하라!",
        "shortQuote": "장군님께서 지키신 아이들의 생명과 장원의 온기를 제 방패로 영원히 수호하겠습니다.",
        "narration": "노장 레오나르가 목숨 바쳐 지켜낸 아이들을 수호하기 위해, 황실 직속 암살단장 독거미 아라크네를 섬멸하라!",
        "speakerName": "카단",
        "speakerRole": "녹옥 지팡이의 주인 · 옛 대장군",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/086_Leonar.png",
        "quote": "울지 마라, 얘들아... 늙은 사자는 그저 잠시 눈을 붙이는 것뿐이다..."
      }
    ],
    "bossHeroClass": "ROGUE",
    "bossNameKo": "독거미 아라크네",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
    "bossHeroSpec": {
      "heroNameKo": "독거미 아라크네",
      "titleKo": "제15화 보스 · 루시안 휘하 맹독 암살단장",
      "factionLabelKo": "황실 직속 독사·거미 암살단 · 폭풍우",
      "portraitUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
      "heroPowerNameKo": "독거미 쌍단검",
      "heroPowerTextKo": "1/2 단검을 장착합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
      "accentColor": "#84cc16",
      "frameGradient": "linear-gradient(180deg, #4d7c0f 0%, #1a2e05 100%)",
      "skyTop": "#1a2e05",
      "skyMid": "#3f6212",
      "skyBot": "#0a1202",
      "halo": "rgba(163, 230, 53, 0.52)",
      "emotesKo": {
        "greetings": "샤샤샥... 내 맹독 거미줄에 걸린 나비들이 여기 있었네?",
        "well_played": "어머, 맹독 단검을 아슬아슬하게 쳐냈구나?",
        "thanks": "몸부림칠수록 거미줄은 더 깊숙이 파고든단다.",
        "wow": "내 신경독을 별빛 호흡으로 태워 없애다니?!",
        "oops": "호호, 독침 하나가 빗나갔네.",
        "threaten": "심장이 검게 녹아내리는 극독의 키스를 선물해 주마!",
        "start": "루시안 재상 각하의 밀명이다! 소리 없이 전원 몰살하라!",
        "concede": "샤아악! 내 독거미 진형이 찢기다니... 어둠 속으로 숨는다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 16,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "폐허 앞의 형제",
    "locationKo": "상현달이 뜬 안개 호수 출항 부두",
    "oneLineKo": "진정한 형제로 거듭난 카단과 이그니스의 첫 협공으로, 부두를 포위한 추격사령관 루시안을 격파하라!",
    "novelEpisodeUrl": "/book?ep=16",
    "webtoonEpisodeUrl": "/webtoon?ep=16",
    "bookMdUrl": "/book/episode_16.md",
    "coverIllustrationUrl": "/images/webtoon/episode_16/scene_04.webp",
    "prevContextKo": "레오나르의 장례를 치른 다음 날 밤, 상현달 아래 마주 선 카단과 이그니스는 부모 세대가 남긴 편지와 두 자루 은빛 단검을 마주한다.",
    "synopsisKo": "친아버지 발리안의 원수인 루시안을 아비라 부르며 살아온 죄책감에 무너져 내리던 이그니스에게, 카단은 원망 대신 굳센 손을 내밀어 의형제의 맹세를 다시 잇는다. 증거 인멸을 위해 직접 추격 함대를 끌고 온 루시안의 선봉을 두 형제가 완벽한 협공으로 격파하고, 실리아의 고향 ‘바람 속삭임 섬’을 향해 돛을 올린다.",
    "battleReasonKo": "진정한 형제로 거듭난 카단과 이그니스의 첫 협공으로, 부두를 포위한 추격사령관 루시안을 격파하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "론돌",
        "role": "일곱 추적자 · 거친 파도의 뱃사공",
        "cutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "side": "ALLY"
      },
      {
        "name": "루시안",
        "role": "붉은 유리 궁정 재상 · 만악의 근원",
        "cutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_16/scene_04.webp",
        "shortCaption": "카단은 원망 대신 굳센 손을 내밀어 의형제의 맹세를 다시 잇는다.",
        "shortQuote": "황실의 영예가 깃든 검이다. 아깝지 않은가?",
        "narration": "바람 속삭임 섬으로 출항하기 전날 밤, 며칠 동안 안개 호수를 무겁게 짓누르던 짙은 유백색 물안개가 한순간 거짓말처럼 걷혀 나갔다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "황실의 영예가 깃든 검이다. 아깝지 않은가?"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_16/scene_18.webp",
        "shortCaption": "실리아의 고향 ‘바람 속삭임 섬’을 향해 돛을 올린다.",
        "shortQuote": "숙부님은 한 번도 너를 탓하지 않으셨다.",
        "narration": "증거 인멸을 위해 직접 추격 함대를 끌고 온 루시안의 선봉을 두 형제가 완벽한 협공으로 격파하고, 실리아의 고향 ‘바람 속삭임 섬’을 향해 돛을 올린다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "숙부님은 한 번도 너를 탓하지 않으셨다. 네가 살아남아 빛을 찾는 것만이 그분의 유일한 소원이었어."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_16/scene_33.webp",
        "shortCaption": "실리아의 고향 ‘바람 속삭임 섬’을 향해 돛을 올린다.",
        "shortQuote": "암살 대장이 흉포한 살기를 뿜어내며 소리쳤다.",
        "narration": "증거 인멸을 위해 직접 추격 함대를 끌고 온 루시안의 선봉을 두 형제가 완벽한 협공으로 격파하고, 실리아의 고향 ‘바람 속삭임 섬’을 향해 돛을 올린다.",
        "speakerName": "암살 대장",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "역적 놈들과 황궁의 배신자를 한 놈도 남기지 말고 몰살해라! 저택과 배를 모조리 불태워 증거를 인멸하라!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_16/scene_44.webp",
        "shortCaption": "진정한 형제로 거듭난 카단과 이그니스의 첫 협공으로, 부두를 포위한 추격사령관 루시안을 격파하라!",
        "shortQuote": "바다의 신이 우리에게 길을 열어주셨다!",
        "narration": "진정한 형제로 거듭난 카단과 이그니스의 첫 협공으로, 부두를 포위한 추격사령관 루시안을 격파하라!",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "바다의 신이 우리에게 길을 열어주셨다! 젊은 사자들아, 새로운 시대를 향해 돛을 올려라!"
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "추격사령관 루시안",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
    "bossHeroSpec": {
      "heroNameKo": "추격사령관 루시안",
      "titleKo": "제16화 보스 · 붉은 유리 궁정 재상 · 만악의 근원",
      "factionLabelKo": "붉은 유리 궁정 · 상현달이",
      "portraitUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
      "heroPowerNameKo": "황궁 화염 중갑",
      "heroPowerTextKo": "방어도를 +2 얻습니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
      "accentColor": "#f43f5e",
      "frameGradient": "linear-gradient(180deg, #be123c 0%, #4c0519 100%)",
      "skyTop": "#4c0519",
      "skyMid": "#9f1239",
      "skyBot": "#1c040c",
      "halo": "rgba(251, 113, 133, 0.55)",
      "emotesKo": {
        "greetings": "변방의 천한 것들이 감히 궁정의 뜻을 거스르느냐.",
        "well_played": "흥, 발버둥 치는 꼴이 제법 볼만하군.",
        "thanks": "네 어리석음이 내 패업을 앞당기는구나.",
        "wow": "이 따위 변수가 생길 줄이야...!",
        "oops": "사소한 계산 착오일 뿐이다.",
        "threaten": "붉은 유리 궁정의 이름으로 흔적도 없이 불태워주마!",
        "start": "저 반역자들을 남김없이 베어라! 단 한 명도 살려 보내지 마라!",
        "concede": "크윽... 지금은 물러나지만, 궁정의 그림자는 끝까지 너희를 쫓을 것이다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 17,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "바람섬의 초대장",
    "locationKo": "동쪽 대해 범선 ‘미풍의날개호’ 갑판",
    "oneLineKo": "바람 속삭임 섬 진입을 막아서는 반역자 대장로 제피르의 해협 매복 함대를 선상 결투로 돌파하라!",
    "novelEpisodeUrl": "/book?ep=17",
    "webtoonEpisodeUrl": "/webtoon?ep=17",
    "bookMdUrl": "/book/episode_17.md",
    "coverIllustrationUrl": "/images/webtoon/episode_17/scene_04.webp",
    "prevContextKo": "일흔두 석주 미로를 빠져나와 망망대해로 나선 일행에게 바람 속삭임 섬에서 날아온 의문의 초대장이 도착한다.",
    "synopsisKo": "실리아는 어머니 실피드 여왕이 10년 전 의문의 죽음을 맞은 뒤 고향 섬이 외부와 단절되었다는 아픈 과거를 털어놓는다. 칼날 산호초 해협에 들어서자 섬의 반역파인 대장로 제피르가 직접 이끄는 해상 기습선이 접근하고, 일행은 거센 파도 위 선상 난전을 돌파해 비밀 해저 동굴로 진입한다.",
    "battleReasonKo": "바람 속삭임 섬 진입을 막아서는 반역자 대장로 제피르의 해협 매복 함대를 선상 결투로 돌파하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "론돌",
        "role": "일곱 추적자 · 거친 파도의 뱃사공",
        "cutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "side": "ALLY"
      },
      {
        "name": "대장로 제피르",
        "role": "바람섬 여왕 독살 반역자",
        "cutoutUrl": "/hs-assets/bosses/boss_zephyr.webp",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_17/scene_04.webp",
        "shortCaption": "실리아는 어머니 실피드 여왕이 10년 전 의문의 죽음을 맞은 뒤 고향 섬이 외부와 단절되었다는 아픈 과거를 털어놓는다.",
        "shortQuote": "북서쪽 하늘을 보아라!",
        "narration": "동쪽 대해를 가르는 범선 ‘미풍의날개호’의 갑판 위로는 소금기 머금은 거센 해풍이 쉴 새 없이 몰아치고 있었다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "북서쪽 하늘을 보아라! 보통 바다갈매기가 아니다. 왕실의 은빛 깃털을 지닌 바람 그리폰이다!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_17/scene_17.webp",
        "shortCaption": "일행은 거센 파도 위 선상 난전을 돌파해 비밀 해저 동굴로 진입한다.",
        "shortQuote": "이그니스가 주먹을 쥐며 갑판 난간을 내리쳤다.",
        "narration": "카단이 실리아의 떨리는 어깨를 묵묵히 짚어주며 침착하게 물었다.",
        "speakerName": "이그니스",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "티타니아 학사님이 제시한 다른 진입로가 있는가? 정규 항구로 접근했다간 해안 마나포의 표적이 될 것이다."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_17/scene_31.webp",
        "shortCaption": "일행은 거센 파도 위 선상 난전을 돌파해 비밀 해저 동굴로 진입한다.",
        "shortQuote": "적선이 접근한다! 선상 난전을 준비하라!",
        "narration": "카단이 지체 없이 무쇠 방패를 들어 올려 날아드는 불화살들을 쳐내며 선원들을 보호했다. 쾅 하는 굉음과 함께 방패 표면에서 화염이 튀었지만, 카단의 견고한 하체는 조금도 흔들리지 않았다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "적선이 접근한다! 선상 난전을 준비하라!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_17/scene_41.webp",
        "shortCaption": "바람 속삭임 섬 진입을 막아서는 반역자 대장로 제피르의 해협 매복 함대를 선상 결투로 돌파하라!",
        "shortQuote": "황실이 저지른 죗값을 내가 앞장서서 갚겠다.",
        "narration": "바람 속삭임 섬 진입을 막아서는 반역자 대장로 제피르의 해협 매복 함대를 선상 결투로 돌파하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "황실이 저지른 죗값을 내가 앞장서서 갚겠다."
      }
    ],
    "bossHeroClass": "SHAMAN",
    "bossNameKo": "대장로 제피르",
    "bossCutoutUrl": "/hs-assets/bosses/boss_zephyr.webp",
    "bossHeroSpec": {
      "heroNameKo": "대장로 제피르",
      "titleKo": "제17화 보스 · 바람섬 여왕 독살 반역자",
      "factionLabelKo": "바람섬 반역 장로파 · 동쪽",
      "portraitUrl": "/hs-assets/bosses/boss_zephyr.webp",
      "heroPowerNameKo": "칼날 해협 풍랑주술",
      "heroPowerTextKo": "무작위 주술 토템을 하나 소환합니다.",
      "heroPowerIconUrl": "/hs-assets/bosses/boss_zephyr.webp",
      "accentColor": "#14b8a6",
      "frameGradient": "linear-gradient(180deg, #0f766e 0%, #042f2e 100%)",
      "skyTop": "#042f2e",
      "skyMid": "#115e59",
      "skyBot": "#021716",
      "halo": "rgba(45, 212, 191, 0.52)",
      "emotesKo": {
        "greetings": "실리아 공주... 죽은 어미처럼 조용히 바다에 잠들 것이지 왜 돌아왔느냐!",
        "well_played": "과연 실피드 여왕의 피를 이은 계집답군.",
        "thanks": "칼날 산호초의 역풍은 내 편이다!",
        "wow": "선상 난전에서 내 폭풍 결계를 뚫어내다니?!",
        "oops": "풍향이 갑자기 바뀌었군!",
        "threaten": "10년 전 진실과 함께 이 해협 밑바닥에 영원히 수장시켜 주마!",
        "start": "칼날 해협 매복선 전원 기습! 공주의 배를 암초로 몰아 침몰시켜라!",
        "concede": "크윽... 해저 동굴로 빠져나가다니! 검은 성전의 수호병을 깨워라!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 18,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "검은 성전의 비밀",
    "locationKo": "바람 속삭임 섬 지하 ‘검은 성전’",
    "oneLineKo": "실피드 여왕 독살의 진실을 묻어버리려 가동된 검은 성전의 흑요석 거신 아이언포지를 파괴하라!",
    "novelEpisodeUrl": "/book?ep=18",
    "webtoonEpisodeUrl": "/webtoon?ep=18",
    "bookMdUrl": "/book/episode_18.md",
    "coverIllustrationUrl": "/images/webtoon/episode_18/scene_05.webp",
    "prevContextKo": "해저 동굴을 지나 수천 년간 봉인되어 있던 지하 흑요석 유적 ‘검은 성전’에 발을 디딘 카단, 실리아, 이그니스.",
    "synopsisKo": "성전 중앙의 고대 기억 수정구가 작동하며 10년 전 연회의 충격적인 진상이 투영된다. 평화 협정 자리에서 루시안 재상과 내통한 제피르 대장로가 실피드 여왕의 은잔에 메두사 고르고의 맹독을 탔던 것이다! 진실을 목격한 이들을 매장하려는 성전 흑요석 수호 거신이 깨어나자 세 사람은 분노와 정의의 불꽃으로 맞선다.",
    "battleReasonKo": "실피드 여왕 독살의 진실을 묻어버리려 가동된 검은 성전의 흑요석 거신 아이언포지를 파괴하라!",
    "cast": [
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "거신 아이언포지",
        "role": "봉인 석실의 수호 거신병",
        "cutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
        "side": "ENEMY"
      },
      {
        "name": "대장로 제피르",
        "role": "바람섬 여왕 독살 반역자",
        "cutoutUrl": "/hs-assets/bosses/boss_zephyr.webp",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_18/scene_05.webp",
        "shortCaption": "성전 중앙의 고대 기억 수정구가 작동하며 10년 전 연회의 충격적인 진상이 투영된다.",
        "shortQuote": "이곳은 바람의 정령왕 에올루스의 선조들이 대륙의 모든 진실을 기록해 둔 태초의 아카이브예요.",
        "narration": "칼날 산호초 해협의 해저 동굴을 빠져나온 일행은 바람 속삭임 섬 지하 깊은 곳에 자리 잡은 ‘검은 성전’의 폐허에 조심스럽게 발을 디뎠다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이곳은 바람의 정령왕 에올루스의 선조들이 대륙의 모든 진실을 기록해 둔 태초의 아카이브예요. 종이나 잉크는 세월의 풍파에 닳아 없어지지만, 대지의 모든 숨결과 거짓 없는 기억은 이 흑요석 수정 속에 영원히 봉인되어 있어요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_18/scene_21.webp",
        "shortCaption": "평화 협정 자리에서 루시안 재상과 내통한 제피르 대장로가 실피드 여왕의 은잔에 메두사 고르고의 맹독을 탔던 것이다!",
        "shortQuote": "성기사들이 여왕을 시해했다! 반역자들을 한 놈도 살려두지 마라!",
        "narration": "황궁의 최고 권력자 루시안 재상과 내통한 바람섬의 제피르 대장로가, 당시 평화 협정을 축하하기 위해 마련된 연회에서 실피드 여왕의 은잔에 메두사 고르고의 맹독을 은밀히 타는 장면이 공중에 선명하게 떠올랐다.",
        "speakerName": "메두사 고르고",
        "speakerRole": "나인섀도우 코덱스를 훔친 암흑 마녀",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
        "quote": "성기사들이 여왕을 시해했다! 반역자들을 한 놈도 살려두지 마라!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_18/scene_37.webp",
        "shortCaption": "진실을 목격한 이들을 매장하려는 성전 흑요석 수호 거신이 깨어나자 세 사람은 분노와 정의의 불꽃으로 맞선다.",
        "shortQuote": "실리아, 이그니스! 증거가 담긴 기억 수정을 지켜라!",
        "narration": "산봉우리가 무너져 내리는 듯한 충격이 방패를 강타했지만, 카단은 하체에 대지의 마나를 굳건히 실으며 타격의 원심력을 성전 바닥의 지하 수맥으로 유려하게 흘려보냈다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "실리아, 이그니스! 증거가 담긴 기억 수정을 지켜라!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_18/scene_50.webp",
        "shortCaption": "실피드 여왕 독살의 진실을 묻어버리려 가동된 검은 성전의 흑요석 거신 아이언포지를 파괴하라!",
        "shortQuote": "제피르의 목은 내가 베겠다.",
        "narration": "실피드 여왕 독살의 진실을 묻어버리려 가동된 검은 성전의 흑요석 거신 아이언포지를 파괴하라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "제피르의 목은 내가 베겠다. 그것만이 내 아버지 발리안과 알렉산다르 숙부님 앞에 조금이나마 속죄할 수 있는 유일한 길이다."
      }
    ],
    "bossHeroClass": "WARLOCK",
    "bossNameKo": "흑요석 거신 아이언포지",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
    "bossHeroSpec": {
      "heroNameKo": "흑요석 거신 아이언포지",
      "titleKo": "제18화 보스 · 봉인 석실의 수호 거신병",
      "factionLabelKo": "고대 강철 수호 거신 · 바람",
      "portraitUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
      "heroPowerNameKo": "흑요석 마력 방출",
      "heroPowerTextKo": "카드를 1장 뽑고 내 영웅에게 피해를 2 줍니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
      "accentColor": "#eab308",
      "frameGradient": "linear-gradient(180deg, #ca8a04 0%, #422006 100%)",
      "skyTop": "#292524",
      "skyMid": "#854d0e",
      "skyBot": "#0c0a09",
      "halo": "rgba(250, 204, 21, 0.55)",
      "emotesKo": {
        "greetings": "[경고] 성역 침입자 감지. 수호 프로토콜을 가동합니다.",
        "well_played": "[분석] 아케 성기사단 정통 무예 파장과 일치합니다.",
        "thanks": "[충전] 마도 동력 코어 출력이 상승합니다.",
        "wow": "[경보] 아다만티움 장갑에 임계 충격 발생!",
        "oops": "[오류] 마도 조준경 미세 편차 발생.",
        "threaten": "[섬멸] 거신 중력포 최대 출력으로 제압합니다!",
        "start": "[기동 완료] 자격을 증명하지 못하는 자는 한 걸음도 지나갈 수 없다!",
        "concede": "[승인 완료] 고결한 수호자의 자격 확인... 성물의 봉인을 해제합니다."
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 19,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "세 가지 시험",
    "locationKo": "해발 수천 길 상공 ‘하늘 제단’",
    "oneLineKo": "대륙 본토 구원 동맹을 맺기 위해, 천공의 군주 에올루스 국왕이 내리는 하늘 제단 세 가지 시험을 통과하라!",
    "novelEpisodeUrl": "/book?ep=19",
    "webtoonEpisodeUrl": "/webtoon?ep=19",
    "bookMdUrl": "/book/episode_19.md",
    "coverIllustrationUrl": "/images/webtoon/episode_19/scene_05.webp",
    "prevContextKo": "지하 성전을 빠져나와 섬 최정상 하늘 제단에 오른 일행 앞을 실리아의 외조부이자 바람섬의 국왕 에올루스가 가로막는다.",
    "synopsisKo": "외부인을 불신하던 에올루스 국왕은 세 가지 무예·지략·신념의 시험을 내린다. 카단은 대지의 무게로 폭풍을 품는 별빛 호흡으로 바람의 칼날을 견뎌내고, 이그니스는 형제를 대신해 기꺼이 벌을 받겠다는 헌신을 보이며 국왕의 얼어붙은 마음을 녹인다. 에올루스는 실리아에게 어머니의 푸른 깃털 망토를 물려준다.",
    "battleReasonKo": "대륙 본토 구원 동맹을 맺기 위해, 천공의 군주 에올루스 국왕이 내리는 하늘 제단 세 가지 시험을 통과하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "국왕 에올루스",
        "role": "바람 속삭임 섬의 왕 · 실리아의 외조부",
        "cutoutUrl": "/anime-character-sheets/cutouts/025_Aeolus.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_19/scene_05.webp",
        "shortCaption": "외부인을 불신하던 에올루스 국왕은 세 가지 무예·지략·신념의 시험을 내린다.",
        "shortQuote": "에올루스가 대검을 겨누며 갈라진 목소리로 포효했다.",
        "narration": "나선형 계단을 모두 오른 일행은 마침내 바람 속삭임 섬의 최정상이자 해발 수천 길 상공에 떠 있는 ‘하늘 제단’에 도달했다.",
        "speakerName": "에올루스",
        "speakerRole": "바람 속삭임 섬의 왕 · 실리아의 외조부",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/025_Aeolus.png",
        "quote": "누구도 이 다리를 건널 수 없다! 아내 실피드를 비열하게 살해한 성기사단의 후예와, 어미의 원수와 손을 잡은 배신자 왕녀를 결코 결계탑 안으로 들일 수 없다!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_19/scene_19.webp",
        "shortCaption": "이그니스는 형제를 대신해 기꺼이 벌을 받겠다는 헌신을 보이며 국왕의 얼어붙은 마음을 녹인다.",
        "shortQuote": "대지의 무게로 바람의 결을 품으라고 가르치셨다.",
        "narration": "카단은 칼을 뽑지 않고, 오직 무쇠 방패 하나만을 앞세운 채 별의 호흡을 폐부 깊숙이 끌어올렸다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "알렉산다르 스승님께서는 바람을 거스르려 하지 말고, 대지의 무게로 바람의 결을 품으라고 가르치셨다."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_19/scene_34.webp",
        "shortCaption": "에올루스는 실리아에게 어머니의 푸른 깃털 망토를 물려준다.",
        "shortQuote": "과거 실피드와 알렉산다르가 꿈꾸었던 평화의 불씨가 살아 숨 쉬고 있었거늘...",
        "narration": "에올루스의 손에서 폭풍의 대검이 맥없이 바닥으로 떨어졌다. 국왕의 잿빛 눈동자에서 마침내 제피르의 환영 안개가 완전히 걷히고, 맑은 눈물이 흘러내렸다. 에올루스는 비틀거리며 다가와 실리아의 뺨을 떨리는 손으로 어루만졌다.",
        "speakerName": "국왕 에올루스",
        "speakerRole": "바람 속삭임 섬의 왕 · 실리아의 외조부",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/025_Aeolus.png",
        "quote": "실리아... 내 딸아... 내가 오랜 슬픔에 눈이 멀어 역적의 혓바닥에 놀아나고 있었구나... 서로의 등을 지켜주는 저 아이들의 눈빛 속에, 과거 실피드와 알렉산다르가 꿈꾸었던 평화의 불씨가 살아 숨 쉬고 있었거늘..."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_19/scene_45.webp",
        "shortCaption": "대륙 본토 구원 동맹을 맺기 위해, 천공의 군주 에올루스 국왕이 내리는 하늘 제단 세 가지 시험을 통과하라!",
        "shortQuote": "실리아가 눈물을 닦으며 아버지를 부축했다.",
        "narration": "대륙 본토 구원 동맹을 맺기 위해, 천공의 군주 에올루스 국왕이 내리는 하늘 제단 세 가지 시험을 통과하라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이 망토는 네 어미 실피드가 물려준 왕가의 유산이다. 이제 네가 바람의 참된 주인이 되어 백성들을 이끌어다오."
      }
    ],
    "bossHeroClass": "HUNTER",
    "bossNameKo": "국왕 에올루스",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/025_Aeolus.png",
    "bossHeroSpec": {
      "heroNameKo": "국왕 에올루스",
      "titleKo": "제19화 보스 · 바람 속삭임 섬의 왕 · 실리아의 외조부",
      "factionLabelKo": "바람 속삭임 섬의 천공왕 · 해발",
      "portraitUrl": "/anime-character-sheets/cutouts/025_Aeolus.png",
      "heroPowerNameKo": "하늘 제단 풍압시",
      "heroPowerTextKo": "적 영웅에게 피해를 2 줍니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/025_Aeolus.png",
      "accentColor": "#38bdf8",
      "frameGradient": "linear-gradient(180deg, #0284c7 0%, #1e3a8a 100%)",
      "skyTop": "#0c4a6e",
      "skyMid": "#0369a1",
      "skyBot": "#082f49",
      "halo": "rgba(125, 211, 252, 0.58)",
      "emotesKo": {
        "greetings": "하늘 제단에 오른 이방인들이여, 너희 신념의 무게를 달아보겠다.",
        "well_played": "대지의 호흡으로 내 천공의 칼바람을 품어내다니!",
        "thanks": "손녀 실리아의 곁을 지키는 마음이 참으로 곧구나.",
        "wow": "형제를 대신해 기꺼이 벼락을 맞으려 하다니... 눈부신 의리로다!",
        "oops": "바람의 기세가 지나쳤군.",
        "threaten": "세 가지 천공의 시련을 넘지 못하면 꽃배 선단은 움직이지 않는다!",
        "start": "바람섬 왕가의 이름으로 첫째 무예, 둘째 지략, 셋째 신념의 시험을 개시한다!",
        "concede": "장하다, 젊은 영웅들이여! 바람 속삭임 섬의 모든 돛이 너희와 함께 출항할 것이다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 20,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "꽃배를 삼킨 파도",
    "locationKo": "바람섬 비취 결계탑 & 출항 대해",
    "oneLineKo": "수백 척의 꽃배 선단을 집어삼키려는 타락한 바다 괴수 심연룡 리바이어던의 검은 해일을 막아내라!",
    "novelEpisodeUrl": "/book?ep=20",
    "webtoonEpisodeUrl": "/webtoon?ep=20",
    "bookMdUrl": "/book/episode_20.md",
    "coverIllustrationUrl": "/images/webtoon/episode_20/scene_04.webp",
    "prevContextKo": "음모가 탄로 난 제피르 대장로가 비취 결계탑 코어를 『나인섀도우 코덱스』의 암흑 장치와 연결해 바다 밑 심연 괴수를 깨운다.",
    "synopsisKo": "출항 준비를 마친 수백 척의 꽃배 선단 앞으로 칠흑의 해일과 함께 타락한 바다의 재앙 ‘심연룡 리바이어던’이 솟구친다! 론돌이 선단을 지휘하는 사이, 카단은 뱃머리 최전선에 우뚝 서 별빛 장벽을 전개해 리바이어던의 암흑 마나포를 정면으로 받아치며 본토 상륙의 바닷길을 열어젖힌다.",
    "battleReasonKo": "수백 척의 꽃배 선단을 집어삼키려는 타락한 바다 괴수 심연룡 리바이어던의 검은 해일을 막아내라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "국왕 에올루스",
        "role": "바람 속삭임 섬의 왕 · 실리아의 외조부",
        "cutoutUrl": "/anime-character-sheets/cutouts/025_Aeolus.png",
        "side": "ALLY"
      },
      {
        "name": "론돌",
        "role": "일곱 추적자 · 거친 파도의 뱃사공",
        "cutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "side": "ALLY"
      },
      {
        "name": "심연룡 리바이어던",
        "role": "코덱스의 어둠에 잠식된 대해의 괴수",
        "cutoutUrl": "/anime-character-sheets/cutouts/006_Leviathan.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_20/scene_04.webp",
        "shortCaption": "출항 준비를 마친 수백 척의 꽃배 선단 앞으로 칠흑의 해일과 함께 타락한 바다의 재앙 ‘심연룡 리바이어던’이 솟구친다!",
        "shortQuote": "어리석은 에올루스와 철없는 왕녀여!",
        "narration": "비취 결계탑의 중심부에 진입했을 때, 제피르 대장로는 이미 제단 중앙의 마나 코어를 ‘나인섀도우 코덱스’의 칠흑빛 마도 장치와 강제로 연결해 둔 상태였다.",
        "speakerName": "대장로 제피르",
        "speakerRole": "바람섬 여왕 독살 반역자",
        "speakerCutoutUrl": "/hs-assets/bosses/boss_zephyr.webp",
        "quote": "어리석은 에올루스와 철없는 왕녀여! 바람 속삭임 섬은 오늘부로 신세계를 열어젖힐 거대한 제물이 될 것이다! 대해의 심연이 모든 것을 삼키고 나면, 황실과 내가 손을 잡고 이 대륙의 새로운 지배자로 군림할 것이다!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_20/scene_18.webp",
        "shortCaption": "론돌이 선단을 지휘하는 사이, 카단은 뱃머리 최전선에 우뚝 서 별빛 장벽을 전개해 리바이어던의 암흑 마나포를…",
        "shortQuote": "아이들과 노약자들을 먼저 태워라!",
        "narration": "론돌이 목재 의족을 쿵쿵 울리며 부두 전면에 나서서 사공들을 진두지휘했다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "아이들과 노약자들을 먼저 태워라! 배 한 척에 서른 명씩, 노를 잡을 수 있는 장정들은 양쪽에 붙어라! 론돌의 이름을 걸고 단 한 사람도 파도에 빼앗기지 않는다!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_20/scene_33.webp",
        "shortCaption": "론돌이 선단을 지휘하는 사이, 카단은 뱃머리 최전선에 우뚝 서 별빛 장벽을 전개해 리바이어던의 암흑 마나포를…",
        "shortQuote": "사라져라, 심연의 괴물이여!",
        "narration": "그 틈을 타 이그니스가 허공으로 도약했다. 순백의 성화를 칼날에 실은 이그니스가 리바이어던의 거대한 눈을 향해 번개처럼 쇄도했다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "사라져라, 심연의 괴물이여!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_20/scene_44.webp",
        "shortCaption": "수백 척의 꽃배 선단을 집어삼키려는 타락한 바다 괴수 심연룡 리바이어던의 검은 해일을 막아내라!",
        "shortQuote": "슬퍼하지 마라, 실리아.",
        "narration": "수백 척의 꽃배 선단을 집어삼키려는 타락한 바다 괴수 심연룡 리바이어던의 검은 해일을 막아내라!",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "우리가 지켜야 할 것은 과거의 돌무더기가 아니라, 미래를 살아갈 사람들의 온기다. 이제 수도로 진격해 루시안과 제피르의 죄를 백일하에 드러내고 심판해야 한다."
      }
    ],
    "bossHeroClass": "MAGE",
    "bossNameKo": "심연룡 리바이어던",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/006_Leviathan.png",
    "bossHeroSpec": {
      "heroNameKo": "심연룡 리바이어던",
      "titleKo": "제20화 보스 · 코덱스의 어둠에 잠식된 대해의 괴수",
      "factionLabelKo": "코덱스에 잠식된 대해의 재앙 · 바람섬",
      "portraitUrl": "/anime-character-sheets/cutouts/006_Leviathan.png",
      "heroPowerNameKo": "심연 암흑 마나포",
      "heroPowerTextKo": "피해를 1 줍니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/006_Leviathan.png",
      "accentColor": "#6366f1",
      "frameGradient": "linear-gradient(180deg, #4338ca 0%, #1e1b4b 100%)",
      "skyTop": "#1e1b4b",
      "skyMid": "#3730a3",
      "skyBot": "#09081c",
      "halo": "rgba(129, 140, 248, 0.62)",
      "emotesKo": {
        "greetings": "크오오오오—!! 심연 해일의 분노가 수백 척의 배를 삼키리라!",
        "well_played": "크르르... 자그마한 방패가 내 해일을 버텨내다니!",
        "thanks": "검은 바닷물이 더욱 거세게 소용돌이친다!",
        "wow": "크아아악!! 별빛 장벽이 내 암흑 마나포를 되받아치다니!!",
        "oops": "거센 파도가 바위에 부딪혔다!",
        "threaten": "모든 꽃배와 희망을 칠흑의 심연 해구로 끌고 내려가마!",
        "start": "크오오오—!! 나인섀도우의 저주로 깨어난 검은 해일을 맞이해라!",
        "concede": "크아아아—!! 코덱스의 사슬이 끊어진다... 대해가 다시 맑아지는구나..."
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 21,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "불탄 배의 흔적",
    "locationKo": "불타는 본토 서남부 세븐브리지 해안",
    "oneLineKo": "해안 구호소에 불을 지르고 상륙을 봉쇄하는 철갑섭정 아르투스를 격파하라!",
    "novelEpisodeUrl": "/book?ep=21",
    "webtoonEpisodeUrl": "/webtoon?ep=21",
    "bookMdUrl": "/book/episode_21.md",
    "coverIllustrationUrl": "/images/webtoon/episode_21/scene_04.webp",
    "prevContextKo": "거센 대해를 건너 마침내 대륙 본토 해안에 상륙한 꽃배 선단 앞에는 환영 대신 검붉은 연기와 불타버린 구호소가 펼쳐져 있었다.",
    "synopsisKo": "루시안의 명령을 받은 철갑섭정 데스나이트 아르투스가 선단의 상륙을 막기 위해 해안 성역과 피난민 창고에 불을 지르고 독화살 세례를 퍼붓는다. 카단은 무쇠 방패를 앞세워 불길 속 주민들을 구출하고, 실리아·이그니스와 함께 해안 교두보를 탈환하며 대륙 심장부로의 진격을 시작한다.",
    "battleReasonKo": "해안 구호소에 불을 지르고 상륙을 봉쇄하는 철갑섭정 아르투스를 격파하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "데스나이트 아르투스",
        "role": "섀도우렐름 섭정 · 죽음의 기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_21/scene_04.webp",
        "shortCaption": "루시안의 명령을 받은 철갑섭정 데스나이트 아르투스가 선단의 상륙을 막기 위해 해안 성역과 피난민 창고에 불을…",
        "shortQuote": "이 잔인무도한 놈들...",
        "narration": "미풍의날개호를 선두로 한 수백 척의 꽃배 선단이 대해의 거센 풍랑을 넘어 마침내 대륙의 서남부 해안에 도달했을 때, 일행을 맞이한 것은 환영의 깃발이 아니라 매캐한 기름 냄새와 검붉은 연기 기둥이었다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "이 잔인무도한 놈들... 피난민들의 발을 묶기 위해 민간 항구와 어선들까지 모조리 불태워 버렸구나. 십 년 전만 해도 온갖 곡식과 비단이 오가던 번영하던 항구였거늘, 권력에 눈이 먼 자들의 광기가 끝이 없구나."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_21/scene_17.webp",
        "shortCaption": "실리아·이그니스와 함께 해안 교두보를 탈환하며 대륙 심장부로의 진격을 시작한다.",
        "shortQuote": "오오, 빛의 신이시여!",
        "narration": "카단은 무쇠 방패를 앞세워 불길 속 주민들을 구출하고, 실리아·이그니스와 함께 해안 교두보를 탈환하며 대륙 심장부로의 진격을 시작한다.",
        "speakerName": "항구 노인",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "자비와 생명을 돌보던 성역에 불을 지르다니, 결코 용서받지 못할 패륜이에요."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_21/scene_32.webp",
        "shortCaption": "실리아·이그니스와 함께 해안 교두보를 탈환하며 대륙 심장부로의 진격을 시작한다.",
        "shortQuote": "감찰대장이 창고 문을 걷어차며 비열한 조소를 흘렸다.",
        "narration": "카단은 무쇠 방패를 앞세워 불길 속 주민들을 구출하고, 실리아·이그니스와 함께 해안 교두보를 탈환하며 대륙 심장부로의 진격을 시작한다.",
        "speakerName": "감찰대장",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "숨어 있는 쥐새끼들이 감히 살아남아 있었군! 반역자들의 씨를 말려 바다에 던져라!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_21/scene_42.webp",
        "shortCaption": "해안 구호소에 불을 지르고 상륙을 봉쇄하는 철갑섭정 아르투스를 격파하라!",
        "shortQuote": "실리아가 불타버린 등대 기둥을 매만지며 결연하게 말했다.",
        "narration": "해안 구호소에 불을 지르고 상륙을 봉쇄하는 철갑섭정 아르투스를 격파하라!",
        "speakerName": "실리아",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "알렉산다르 스승님과 발리안 숙부님이 목숨 바쳐 지키려 했던 대륙이다. 절망의 잿더미 속에서도 우리는 사람의 온기를 지켜냈다. 이제 우리가 방패를 들고 그 길을 끝까지 걸어가자."
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "철갑섭정 아르투스",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
    "bossHeroSpec": {
      "heroNameKo": "철갑섭정 아르투스",
      "titleKo": "제21화 보스 · 섀도우렐름 섭정 · 죽음의 기사",
      "factionLabelKo": "섀도우렐름 죽음기사단 · 불타는",
      "portraitUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
      "heroPowerNameKo": "불타는 해안 중갑",
      "heroPowerTextKo": "방어도를 +2 얻습니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
      "accentColor": "#818cf8",
      "frameGradient": "linear-gradient(180deg, #3730a3 0%, #0f172a 100%)",
      "skyTop": "#0f172a",
      "skyMid": "#312e81",
      "skyBot": "#020617",
      "halo": "rgba(129, 140, 248, 0.55)",
      "emotesKo": {
        "greetings": "산 자의 맹세 따위, 죽음의 서리 앞에서는 부질없다.",
        "well_played": "그 방패... 옛 아케 성기사단의 기운이 서려 있군.",
        "thanks": "네 망설임이 내 흑요석 대검의 먹잇감이다.",
        "wow": "내 필살의 참격을 정면으로 받아내다니...!",
        "oops": "검기가 한 치 어긋났군.",
        "threaten": "섀도우렐름의 차가운 어둠 속에 영원히 잠들어라!",
        "start": "흑요석 마검이여, 가로막는 모든 방패를 두 동강 내라!",
        "concede": "크윽... 부서지지 않는 신념이로군. 이 승부는 아직 끝나지 않았다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 22,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "무인도의 투석기",
    "locationKo": "수도 해상 관문 ‘사이렌 해협’ 무인도",
    "oneLineKo": "무인도에서 완성한 협동 공성 투석기로 사이렌 해협 절벽의 요새사령관 볼칸을 격파하라!",
    "novelEpisodeUrl": "/book?ep=22",
    "webtoonEpisodeUrl": "/webtoon?ep=22",
    "bookMdUrl": "/book/episode_22.md",
    "coverIllustrationUrl": "/images/webtoon/episode_22/scene_05.webp",
    "prevContextKo": "수도로 향하는 유일한 좁은 물길 사이렌 해협 양쪽 절벽에는 요새사령관 볼칸의 마도 화포 진지가 선단의 진입을 원천 봉쇄하고 있었다.",
    "synopsisKo": "정면 돌파가 불가능한 상황에서 무인도에 상륙한 일행은 스승 그림리의 대장장이 기술, 실리아의 대왕 다시마 탄성 로프 설계, 카단의 괴력을 합쳐 하룻밤 만에 초거대 공성 투석기를 완성한다! 절벽 위 볼칸의 화포 진지를 정확히 타격해 해협 봉쇄망을 통쾌하게 무너뜨린다.",
    "battleReasonKo": "무인도에서 완성한 협동 공성 투석기로 사이렌 해협 절벽의 요새사령관 볼칸을 격파하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "그림리",
        "role": "일곱 추적자 · 드워프 대장장이 스승",
        "cutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "side": "ALLY"
      },
      {
        "name": "요새사령관 볼칸",
        "role": "사이렌 해협 마도 화포장",
        "cutoutUrl": "/hs-assets/bosses/boss_krakenlord.webp",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_22/scene_05.webp",
        "shortCaption": "실리아의 대왕 다시마 탄성 로프 설계, 카단의 괴력을 합쳐 하룻밤 만에 초거대 공성 투석기를 완성한다!",
        "shortQuote": "저 철갑선들의 흘수선이 너무 깊어 우리 꽃배들이 접근하기도 전에 마나포에 수장되고 말겠어.",
        "narration": "세븐브리지 항구를 벗어난 꽃배 선단이 수도로 진입하기 위한 유일한 해상 관문인 ‘사이렌 해협’ 어귀에 도달했을 때, 바다 위에는 차가운 긴장감이 팽팽하게 감돌았다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "저 철갑선들의 흘수선이 너무 깊어 우리 꽃배들이 접근하기도 전에 마나포에 수장되고 말겠어. 암벽 위의 쇠뇌 포탑들을 먼저 침묵시키지 않고는 단 한 척도 해협을 빠져나갈 수 없다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_22/scene_21.webp",
        "shortCaption": "절벽 위 볼칸의 화포 진지를 정확히 타격해 해협 봉쇄망을 통쾌하게 무너뜨린다.",
        "shortQuote": "좋습니다, 그림리 스승님. 제가 목재의 이음새를 다듬고 쐐기를 박겠습니다.",
        "narration": "카단이 은빛 단검을 뽑아 참나무 목재의 썩은 껍질을 능숙하게 깎아내며 거들었다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "좋습니다, 그림리 스승님. 제가 목재의 이음새를 다듬고 쐐기를 박겠습니다."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_22/scene_38.webp",
        "shortCaption": "절벽 위 볼칸의 화포 진지를 정확히 타격해 해협 봉쇄망을 통쾌하게 무너뜨린다.",
        "shortQuote": "안개의 장막으로 섬의 정상을 가리겠어요! 적들이 조준하지 못하게 시간을 벌게요!",
        "narration": "실리아가 녹옥 지팡이를 휘둘러 바다 안개를 짙게 끌어올렸다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "안개의 장막으로 섬의 정상을 가리겠어요! 적들이 조준하지 못하게 시간을 벌게요!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_22/scene_51.webp",
        "shortCaption": "무인도에서 완성한 협동 공성 투석기로 사이렌 해협 절벽의 요새사령관 볼칸을 격파하라!",
        "shortQuote": "우리가 만든 작은 도구가 수많은 생명을 살려냈다.",
        "narration": "무인도에서 완성한 협동 공성 투석기로 사이렌 해협 절벽의 요새사령관 볼칸을 격파하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "우리가 만든 작은 도구가 수많은 생명을 살려냈다. 스승님께서 말씀하셨던 방패의 참뜻이 바로 이것이리라."
      }
    ],
    "bossHeroClass": "PALADIN",
    "bossNameKo": "요새사령관 볼칸",
    "bossCutoutUrl": "/hs-assets/bosses/boss_krakenlord.webp",
    "bossHeroSpec": {
      "heroNameKo": "요새사령관 볼칸",
      "titleKo": "제22화 보스 · 사이렌 해협 마도 화포장",
      "factionLabelKo": "사이렌 해협 마도 화포 요새 · 수도",
      "portraitUrl": "/hs-assets/bosses/boss_krakenlord.webp",
      "heroPowerNameKo": "화포 수비병 소집",
      "heroPowerTextKo": "1/1 수호병을 하나 소환합니다.",
      "heroPowerIconUrl": "/hs-assets/bosses/boss_krakenlord.webp",
      "accentColor": "#ef4444",
      "frameGradient": "linear-gradient(180deg, #b91c1c 0%, #450a0a 100%)",
      "skyTop": "#450a0a",
      "skyMid": "#991b1b",
      "skyBot": "#1c0505",
      "halo": "rgba(248, 113, 113, 0.52)",
      "emotesKo": {
        "greetings": "하하하! 사이렌 해협 절벽 위 화포 진지는 하늘도 뚫지 못한다!",
        "well_played": "뭐야?! 무인도에서 하룻밤 만에 저런 거대 투석기를 만들었다고?!",
        "thanks": "사정거리 안으로 제 발로 들어왔구나!",
        "wow": "으아악! 대왕 다시마 탄성 투석탄이 탄약고를 직격했다!!",
        "oops": "화포 냉각수가 끓어올랐군!",
        "threaten": "전 포문 일제 사격! 해협 물길 자체를 불바다로 만들어라!",
        "start": "사이렌 해협 봉쇄 화포대, 조준 완료! 반군 선단을 수장시켜라!",
        "concede": "절벽 요새가 무너진다! 해협 봉쇄선이 뚫렸다, 전원 후퇴하라!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 23,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "석굴의 기록",
    "locationKo": "용의 뿔 산맥 고대 해안 석굴",
    "oneLineKo": "선대 성기사들의 유해가 잠든 용의 석굴을 더럽히는 사령술사 간다르를 정화하라!",
    "novelEpisodeUrl": "/book?ep=23",
    "webtoonEpisodeUrl": "/webtoon?ep=23",
    "bookMdUrl": "/book/episode_23.md",
    "coverIllustrationUrl": "/images/webtoon/episode_23/scene_05.webp",
    "prevContextKo": "사이렌 해협을 돌파한 일행은 수도 외곽 ‘용의 뿔 산맥’ 기슭에서 옛 아케 성기사단이 남긴 비밀 석굴 통로를 발견한다.",
    "synopsisKo": "석굴 벽면에는 제1차 성전 당시 어둠의 군단에 맞섰던 선대 성기사들과 알렉산다르·발리안의 젊은 날 기록이 새겨져 있었다. 그때 성기사들의 유해를 모독하며 망령으로 되살리려던 사령술사 간다르가 침입하고, 카단은 아버지와 선배 영웅들의 안식처를 지키기 위해 분연히 방패를 든다.",
    "battleReasonKo": "선대 성기사들의 유해가 잠든 용의 석굴을 더럽히는 사령술사 간다르를 정화하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "발리안",
        "role": "이그니스의 친아들 아버지 · 아케 창술사",
        "cutoutUrl": "/anime-character-sheets/cutouts/043_Balian.png",
        "side": "ALLY"
      },
      {
        "name": "알렉산다르",
        "role": "카단의 아버지 · 옛 아케 성기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/050_Aleksandar.png",
        "side": "ALLY"
      },
      {
        "name": "주술사 간다르",
        "role": "검은 늪의 저주와 도박장 지배자",
        "cutoutUrl": "/anime-character-sheets/cutouts/069_Gandar.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_23/scene_05.webp",
        "shortCaption": "석굴 벽면에는 제1차 성전 당시 어둠의 군단에 맞섰던 선대 성기사들과 알렉산다르·발리안의 젊은 날 기록이 새겨져 있었다.",
        "shortQuote": "이곳이 틀림없다. 이십 년 전 발리안 경과 알렉산다르 경이 제국군의 포위망을…",
        "narration": "사이렌 해협을 무사히 통과한 일행은 대륙 본토의 험준한 산악 지대인 ‘용의 뿔 산맥’ 기슭에 도달했다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "이곳이 틀림없다. 이십 년 전 발리안 경과 알렉산다르 경이 제국군의 포위망을 뚫고 피난민들을 숨겨두었던 비밀 거점이지. 아직도 바위틈에서 성기사단의 결계 마나 냄새가 희미하게 풍겨오는구나."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_23/scene_20.webp",
        "shortCaption": "카단은 아버지와 선배 영웅들의 안식처를 지키기 위해 분연히 방패를 든다.",
        "shortQuote": "어머니의 꽃잎이다...",
        "narration": "그때 성기사들의 유해를 모독하며 망령으로 되살리려던 사령술사 간다르가 침입하고, 카단은 아버지와 선배 영웅들의 안식처를 지키기 위해 분연히 방패를 든다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "어머니의 꽃잎이다... 아버지는 수용소로 끌려가시는 마지막 순간까지도 어머니와 알렉산다르 숙부님의 이름을 부르셨어. 그분들의 순수한 희생을 생각하면 내 가슴이 찢어질 것 같다."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_23/scene_36.webp",
        "shortCaption": "카단은 아버지와 선배 영웅들의 안식처를 지키기 위해 분연히 방패를 든다.",
        "shortQuote": "카단이 지도를 가리키며 말했다.",
        "narration": "카단의 방패에서 뿜어져 나온 푸른 별빛 장벽이 망령들의 독안개를 단숨에 밀어냈다. 이그니스는 쇠파이프를 치켜들며 순백의 화염을 폭발시켰다. 정화의 성화가 허공을 가르며 망령들의 사령 핵을 연달아 꿰뚫었다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "사라져라, 어둠의 잔재들이여!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_23/scene_48.webp",
        "shortCaption": "선대 성기사들의 유해가 잠든 용의 석굴을 더럽히는 사령술사 간다르를 정화하라!",
        "shortQuote": "실리아가 열쇠를 들어 올리며 말했다.",
        "narration": "선대 성기사들의 유해가 잠든 용의 석굴을 더럽히는 사령술사 간다르를 정화하라!",
        "speakerName": "실리아",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "가자. 문 뒤에서 기다리고 있을 선대 영웅들의 유산을 맞이하러."
      }
    ],
    "bossHeroClass": "WARLOCK",
    "bossNameKo": "사령술사 간다르",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/069_Gandar.png",
    "bossHeroSpec": {
      "heroNameKo": "사령술사 간다르",
      "titleKo": "제23화 보스 · 검은 늪의 저주와 도박장 지배자",
      "factionLabelKo": "검은 늪 사령·도박 결사 · 용의",
      "portraitUrl": "/anime-character-sheets/cutouts/069_Gandar.png",
      "heroPowerNameKo": "사령 금술 해방",
      "heroPowerTextKo": "카드를 1장 뽑고 내 영웅에게 피해를 2 줍니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/069_Gandar.png",
      "accentColor": "#9333ea",
      "frameGradient": "linear-gradient(180deg, #7e22ce 0%, #2e1065 100%)",
      "skyTop": "#2e1065",
      "skyMid": "#6b21a8",
      "skyBot": "#120524",
      "halo": "rgba(192, 132, 252, 0.55)",
      "emotesKo": {
        "greetings": "키히히! 망자의 뼈와 사기 주사위 판에 발을 들인 걸 환영한다!",
        "well_played": "이, 이럴 수가! 주사위를 반으로 쪼개 눈금 13을 만들다니?!",
        "thanks": "키히히, 네 영혼도 판돈으로 얹어 주지!",
        "wow": "으아악! 내 필승의 저주 술식이 단검 한 자루에 박살 나다니!",
        "oops": "어라, 사령의 촛불이 흔들렸군!",
        "threaten": "비겁하다고 욕해 봐라! 이기면 그만인 어둠의 주술로 짓뭉개 주마!",
        "start": "어둠의 망령들과 저주의 패거리여, 저 건방진 영웅들을 물어뜯어라!",
        "concede": "키에에엑! 내 사령 제단과 도박장이 전부 무너지다니, 살려다오!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 24,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "봉인된 석실",
    "locationKo": "용의 석굴 최심부 아다만티움 석실",
    "oneLineKo": "전설의 성물 『드래곤 브레이커 방패』의 주인으로 인정받기 위해 봉인 석실의 아다만티움 수호거신을 돌파하라!",
    "novelEpisodeUrl": "/book?ep=24",
    "webtoonEpisodeUrl": "/webtoon?ep=24",
    "bookMdUrl": "/book/episode_24.md",
    "coverIllustrationUrl": "/images/webtoon/episode_24/scene_05.webp",
    "prevContextKo": "석굴 가장 깊은 곳, 수백 길 높이의 아다만티움 철문 너머에서 제1차 성전 열두 성기사의 전설적인 유산이 일행을 기다린다.",
    "synopsisKo": "고대 성기사단의 시련 수호 거신을 정정당당히 넘어선 카단은 부서지지 않는 전설의 성물 『드래곤 브레이커 방패』를 계승하고 별빛 호흡의 극의를 깨우친다. 마침 수도 라이트헤븐에서 루시안이 황권을 찬탈하기 위해 거짓 혼례식을 연다는 급보가 날아들고, 세 청년은 비밀 지하 수로를 통해 수도 한복판으로 질주한다.",
    "battleReasonKo": "전설의 성물 『드래곤 브레이커 방패』의 주인으로 인정받기 위해 봉인 석실의 아다만티움 수호거신을 돌파하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "거신 아이언포지",
        "role": "봉인 석실의 수호 거신병",
        "cutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_24/scene_05.webp",
        "shortCaption": "고대 성기사단의 시련 수호 거신을 정정당당히 넘어선 카단은 부서지지 않는 전설의 성물 『드래곤 브레이커 방패』를…",
        "shortQuote": "이 문은 성기사의 순수한 신념, 바람 왕실의 고결한 혈통, 그리고 순백 화염의…",
        "narration": "용의 석굴 가장 깊은 막다른 곳에 다다랐을 때, 일행의 앞을 가로막은 것은 거대한 지하 절벽 전체를 깎아 만든 웅장한 아다만티움 철문이었다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이 문은 성기사의 순수한 신념, 바람 왕실의 고결한 혈통, 그리고 순백 화염의 맹세가 한데 모여 공명해야만 열리는 ‘삼위일체의 봉인’이에요. 세 사람의 마나가 단 한 치의 오차도 없이 일치해야 해요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_24/scene_19.webp",
        "shortCaption": "세 청년은 비밀 지하 수로를 통해 수도 한복판으로 질주한다.",
        "shortQuote": "실리아가 부조를 바라보며 감탄했다.",
        "narration": "마침 수도 라이트헤븐에서 루시안이 황권을 찬탈하기 위해 거짓 혼례식을 연다는 급보가 날아들고, 세 청년은 비밀 지하 수로를 통해 수도 한복판으로 질주한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이 석실은 단순한 무기고가 아니에요. 성기사단의 영광과 신념이 고스란히 보존된 영원의 신전이에요."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_24/scene_34.webp",
        "shortCaption": "세 청년은 비밀 지하 수로를 통해 수도 한복판으로 질주한다.",
        "shortQuote": "바르토가 흉포한 미소를 지으며 둔기를 내리찍었다.",
        "narration": "바르토가 피를 토하며 바닥을 기어 도망치려 하자, 이그니스가 쇠파이프 끝으로 그의 앞을 가로막았다.",
        "speakerName": "바르토",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "루시안의 개 노릇을 한 대가를 뼈저리게 느껴라. 너희들의 거짓된 제국은 오늘부로 끝이다."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_24/scene_45.webp",
        "shortCaption": "전설의 성물 『드래곤 브레이커 방패』의 주인으로 인정받기 위해 봉인 석실의 아다만티움 수호거신을 돌파하라!",
        "shortQuote": "수도의 시민들이 우리를 기다리고 있어요.",
        "narration": "전설의 성물 『드래곤 브레이커 방패』의 주인으로 인정받기 위해 봉인 석실의 아다만티움 수호거신을 돌파하라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "수도의 시민들이 우리를 기다리고 있어요. 거짓된 혼례식을 부수고 진정한 새벽을 열러 가요!"
      }
    ],
    "bossHeroClass": "PALADIN",
    "bossNameKo": "아다만티움 수호거신",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
    "bossHeroSpec": {
      "heroNameKo": "아다만티움 수호거신",
      "titleKo": "제24화 보스 · 봉인 석실의 수호 거신병",
      "factionLabelKo": "고대 강철 수호 거신 · 용의",
      "portraitUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
      "heroPowerNameKo": "성물 파수병 소환",
      "heroPowerTextKo": "1/1 수호병을 하나 소환합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
      "accentColor": "#eab308",
      "frameGradient": "linear-gradient(180deg, #ca8a04 0%, #422006 100%)",
      "skyTop": "#292524",
      "skyMid": "#854d0e",
      "skyBot": "#0c0a09",
      "halo": "rgba(250, 204, 21, 0.55)",
      "emotesKo": {
        "greetings": "[경고] 성역 침입자 감지. 수호 프로토콜을 가동합니다.",
        "well_played": "[분석] 아케 성기사단 정통 무예 파장과 일치합니다.",
        "thanks": "[충전] 마도 동력 코어 출력이 상승합니다.",
        "wow": "[경보] 아다만티움 장갑에 임계 충격 발생!",
        "oops": "[오류] 마도 조준경 미세 편차 발생.",
        "threaten": "[섬멸] 거신 중력포 최대 출력으로 제압합니다!",
        "start": "[기동 완료] 자격을 증명하지 못하는 자는 한 걸음도 지나갈 수 없다!",
        "concede": "[승인 완료] 고결한 수호자의 자격 확인... 성물의 봉인을 해제합니다."
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 25,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "거짓된 혼례",
    "locationKo": "수도 라이트헤븐 백리석 대성당",
    "oneLineKo": "거짓 혼례식장을 지키는 타락한 대심판관 말라카이의 근위 사제단을 무너뜨리고 민중에게 진실을 밝혀라!",
    "novelEpisodeUrl": "/book?ep=25",
    "webtoonEpisodeUrl": "/webtoon?ep=25",
    "bookMdUrl": "/book/episode_25.md",
    "coverIllustrationUrl": "/images/webtoon/episode_25/scene_05.webp",
    "prevContextKo": "수천 개의 촛불로 치장된 수도 대성당에서 최고 재상 루시안은 황실의 정통성을 날조하기 위한 거짓 혼례식을 강행한다.",
    "synopsisKo": "성당의 거대한 문이 열리며 백색 화염을 두른 이그니스와 카단, 실리아가 당당히 걸어 들어온다! 이그니스는 만천하의 시민들 앞에서 루시안의 엘윈 마을 학살과 여왕 독살 죄상을 낱낱이 폭로하고, 진실에 눈뜬 수도 시민들이 일제히 봉기하자 루시안은 대심판관 말라카이에게 뒤를 맡기고 내궁 비밀 철문으로 도주한다.",
    "battleReasonKo": "거짓 혼례식장을 지키는 타락한 대심판관 말라카이의 근위 사제단을 무너뜨리고 민중에게 진실을 밝혀라!",
    "cast": [
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "대심판관 말라카이",
        "role": "대성당 거짓 혼례 근위단장",
        "cutoutUrl": "/hs-assets/bosses/boss_malakai.webp",
        "side": "ENEMY"
      },
      {
        "name": "루시안",
        "role": "붉은 유리 궁정 재상 · 만악의 근원",
        "cutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_25/scene_05.webp",
        "shortCaption": "성당의 거대한 문이 열리며 백색 화염을 두른 이그니스와 카단, 실리아가 당당히 걸어 들어온다!",
        "shortQuote": "제단 중앙에 서 있는 실비아 영애의 손목에 검은 마나 족쇄가 채워져 있어요.",
        "narration": "제국 수도 라이트헤이븐의 중앙에 우뚝 솟은 거대한 백리석 대성당은 겉보기에 화려한 축제의 열기로 가득 차 있었다. 첨탑마다 붉은 비단 깃발과 황실 문장이 펄럭였고, 회랑에는 황금빛 촛대 수천 개가 불을 밝히며 대리석 바닥을 눈부시게 비추고 있었다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "제단 중앙에 서 있는 실비아 영애의 손목에 검은 마나 족쇄가 채워져 있어요. 저건 메두사 고르고의 꼭두각시 저주 족쇄예요. 영혼을 마비시켜 강제로 혼인 서약서에 피의 서명을 하게 만들려는 수작이에요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_25/scene_20.webp",
        "shortCaption": "진실에 눈뜬 수도 시민들이 일제히 봉기하자 루시안은 대심판관 말라카이에게 뒤를 맡기고 내궁 비밀 철문으로 도주한다.",
        "shortQuote": "이그니스가 높은 제단 난간에 착지하며 사자후를 토해냈다.",
        "narration": "이그니스는 만천하의 시민들 앞에서 루시안의 엘윈 마을 학살과 여왕 독살 죄상을 낱낱이 폭로하고, 진실에 눈뜬 수도 시민들이 일제히 봉기하자 루시안은 대심판관 말라카이에게 뒤를 맡기고 내궁 비밀 철문으로 도주한다.",
        "speakerName": "이그니스",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "반역자 놈들이다! 친위대, 뭣들 하느냐! 저놈들의 목을 베어 바닥을 피로 물들여라!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_25/scene_35.webp",
        "shortCaption": "진실에 눈뜬 수도 시민들이 일제히 봉기하자 루시안은 대심판관 말라카이에게 뒤를 맡기고 내궁 비밀 철문으로 도주한다.",
        "shortQuote": "이그니스 기사단장님이 황궁의 반역자들에게 맞서고 계신다!” 시민들의 외침에 겁에…",
        "narration": "이그니스는 만천하의 시민들 앞에서 루시안의 엘윈 마을 학살과 여왕 독살 죄상을 낱낱이 폭로하고, 진실에 눈뜬 수도 시민들이 일제히 봉기하자 루시안은 대심판관 말라카이에게 뒤를 맡기고 내궁 비밀 철문으로 도주한다.",
        "speakerName": "수도의 시민들",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "이그니스 기사단장님이 황궁의 반역자들에게 맞서고 계신다!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_25/scene_47.webp",
        "shortCaption": "거짓 혼례식장을 지키는 타락한 대심판관 말라카이의 근위 사제단을 무너뜨리고 민중에게 진실을 밝혀라!",
        "shortQuote": "수도의 백성들이여! 더 이상 루시안의 거짓과 공포 앞에 무릎 꿇지 마세요!…",
        "narration": "거짓 혼례식장을 지키는 타락한 대심판관 말라카이의 근위 사제단을 무너뜨리고 민중에게 진실을 밝혀라!",
        "speakerName": "실리아",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "보았느냐, 카단. 사람들의 가슴속에 잠들어 있던 빛이 마침내 깨어났다."
      }
    ],
    "bossHeroClass": "PRIEST",
    "bossNameKo": "대심판관 말라카이",
    "bossCutoutUrl": "/hs-assets/bosses/boss_malakai.webp",
    "bossHeroSpec": {
      "heroNameKo": "대심판관 말라카이",
      "titleKo": "제25화 보스 · 대성당 거짓 혼례 근위단장",
      "factionLabelKo": "수도 대성당 타락 심판관단 · 수도",
      "portraitUrl": "/hs-assets/bosses/boss_malakai.webp",
      "heroPowerNameKo": "위선의 암흑 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/hs-assets/bosses/boss_malakai.webp",
      "accentColor": "#fbbf24",
      "frameGradient": "linear-gradient(180deg, #d97706 0%, #3b0764 100%)",
      "skyTop": "#3b0764",
      "skyMid": "#92400e",
      "skyBot": "#170529",
      "halo": "rgba(251, 191, 36, 0.55)",
      "emotesKo": {
        "greetings": "신성한 루시안 재상 각하의 성혼식을 방해하는 불경한 역적들이다!",
        "well_played": "백색 화염이라니... 이그니스 공자가 어째서 역적의 편에 서는가!",
        "thanks": "거짓된 성광일지라도 권력 앞에서는 법이 된다!",
        "wow": "시민들이 술렁인다?! 안 돼, 엘윈 마을의 진실을 입 밖에 내지 마라!",
        "oops": "성당의 촛대가 무너졌군!",
        "threaten": "심판관 근위대여, 진실을 외치는 저자들의 입을 영원히 봉하라!",
        "start": "백리석 대성당의 문을 봉쇄하라! 재상 각하의 거짓 혼례를 끝까지 사수한다!",
        "concede": "커헉... 시민들이 모두 진실을 알게 되다니... 위선의 제단이 무너진다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 26,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "열린 문, 닫힌 마음",
    "locationKo": "황궁 삼중 방어벽 제1관문 ‘태양의 철문’",
    "oneLineKo": "뱀 문신의 세뇌 저주에 조종당하는 태양의 철문 수문장 발타자르를 제압하고 황궁 진입로를 열어라!",
    "novelEpisodeUrl": "/book?ep=26",
    "webtoonEpisodeUrl": "/webtoon?ep=26",
    "bookMdUrl": "/book/episode_26.md",
    "coverIllustrationUrl": "/images/webtoon/episode_26/scene_05.webp",
    "prevContextKo": "대성당 해방과 함께 횃불을 든 수도 상인·노동자들이 합류하며 황궁 외곽 ‘태양의 철문’ 앞에서 대격돌이 벌어진다.",
    "synopsisKo": "루시안의 세뇌 저주인 뱀 문신에 묶여 백성들에게 칼을 겨누던 황궁 수문장 발타자르와 맞선 카단과 이그니스. 두 청년은 병사들의 목숨을 빼앗는 대신 방패와 검등으로 저주의 핵만을 타격해 철문을 개방하고, 죽어가던 발타자르 역시 마침내 세뇌에서 풀려나 내궁의 함정을 경고하고 눈을 감는다.",
    "battleReasonKo": "뱀 문신의 세뇌 저주에 조종당하는 태양의 철문 수문장 발타자르를 제압하고 황궁 진입로를 열어라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "수문장 발타자르",
        "role": "태양의 철문 뱀 문신 장군",
        "cutoutUrl": "/hs-assets/bosses/boss_balthazar.webp",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_26/scene_05.webp",
        "shortCaption": "루시안의 세뇌 저주인 뱀 문신에 묶여 백성들에게 칼을 겨누던 황궁 수문장 발타자르와 맞선 카단과 이그니스.",
        "shortQuote": "철문은 부수었지만 아직 싸움은 끝나지 않았다.",
        "narration": "대성당의 해방 소식은 삽시간에 수도 전역으로 번져나갔다. 억압받던 상인들과 빈민가의 노동자들은 손에 횃불을 들고 거리로 쏟아져 나왔고, 황궁 외곽을 둘러싸고 있던 삼중 방어벽의 첫 번째 관문인 ‘태양의 철문’이 민중들의 거대한 함성 속에 활짝 열려 젖혀졌...",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "철문은 부수었지만 아직 싸움은 끝나지 않았다. 루시안은 내궁 깊숙한 흑요석 탑에 틀어박혀 결사항전을 준비하고 있다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_26/scene_21.webp",
        "shortCaption": "루시안의 세뇌 저주인 뱀 문신에 묶여 백성들에게 칼을 겨누던 황궁 수문장 발타자르와 맞선 카단과 이그니스.",
        "shortQuote": "발타자르가 조소했다. “명예 따위는 패배자들의 변명일 뿐이다! 힘이야말로 이…",
        "narration": "루시안의 세뇌 저주인 뱀 문신에 묶여 백성들에게 칼을 겨누던 황궁 수문장 발타자르와 맞선 카단과 이그니스. 두 청년은 병사들의 목숨을 빼앗는 대신 방패와 검등으로 저주의 핵만을 타격해 철문을 개방하고, 죽어가던 발타자르 역시 마침내 세뇌에서 풀려나 내궁의...",
        "speakerName": "발타자르",
        "speakerRole": "태양의 철문 뱀 문신 장군",
        "speakerCutoutUrl": "/hs-assets/bosses/boss_balthazar.webp",
        "quote": "발타자르 백작! 어릴 적 내게 검술을 가르쳐주었던 당신마저 이런 추악한 괴물이 되었단 말인가! 더 이상 황실의 명예를 더럽히지 말고 무기를 거두어라!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_26/scene_37.webp",
        "shortCaption": "루시안의 세뇌 저주인 뱀 문신에 묶여 백성들에게 칼을 겨누던 황궁 수문장 발타자르와 맞선 카단과 이그니스.",
        "shortQuote": "백작님? 황실의 기사는 백성을 지키는 방패라 가르치셨던 당신이 아니었습니까?",
        "narration": "루시안의 세뇌 저주인 뱀 문신에 묶여 백성들에게 칼을 겨누던 황궁 수문장 발타자르와 맞선 카단과 이그니스. 두 청년은 병사들의 목숨을 빼앗는 대신 방패와 검등으로 저주의 핵만을 타격해 철문을 개방하고, 죽어가던 발타자르 역시 마침내 세뇌에서 풀려나 내궁의...",
        "speakerName": "이그니스",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "공포에 굴복해 스스로 마음의 문을 닫아버린 사람들의 비극이에요."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_26/scene_50.webp",
        "shortCaption": "뱀 문신의 세뇌 저주에 조종당하는 태양의 철문 수문장 발타자르를 제압하고 황궁 진입로를 열어라!",
        "shortQuote": "내일 밤이면 모든 것이 끝난다.",
        "narration": "뱀 문신의 세뇌 저주에 조종당하는 태양의 철문 수문장 발타자르를 제압하고 황궁 진입로를 열어라!",
        "speakerName": "이그니스",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "내일 새벽, 우리는 황궁의 옥좌에 진정한 백성들의 깃발을 꽂을 것이다."
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "수문장 발타자르",
    "bossCutoutUrl": "/hs-assets/bosses/boss_balthazar.webp",
    "bossHeroSpec": {
      "heroNameKo": "수문장 발타자르",
      "titleKo": "제26화 보스 · 태양의 철문 뱀 문신 장군",
      "factionLabelKo": "태양의 철문 중장갑 수비대 · 황궁",
      "portraitUrl": "/hs-assets/bosses/boss_balthazar.webp",
      "heroPowerNameKo": "뱀 문신 강철갑주",
      "heroPowerTextKo": "방어도를 +2 얻습니다.",
      "heroPowerIconUrl": "/hs-assets/bosses/boss_balthazar.webp",
      "accentColor": "#dc2626",
      "frameGradient": "linear-gradient(180deg, #991b1b 0%, #1f2937 100%)",
      "skyTop": "#1f2937",
      "skyMid": "#7f1d1d",
      "skyBot": "#090d16",
      "halo": "rgba(248, 113, 113, 0.5)",
      "emotesKo": {
        "greetings": "크으으... 머릿속 뱀 문신이 명령한다... 황궁 문을 여는 자는 베어라...!",
        "well_played": "크헉... 목숨을 해치지 않고 갑주의 저주 핵만 노리고 있구나...!",
        "thanks": "세뇌의 사슬이 내 팔을 강제로 휘두른다...!",
        "wow": "아아... 그 순수한 방패와 검등의 울림에 머릿속 안개가 걷힌다!",
        "oops": "저주의 파동이 잠시 멎었다...!",
        "threaten": "피할 수 없다면 내 중장갑 대검을 정면으로 꺾어 세뇌를 부숴다오!",
        "start": "태양의 철문 방벽 전개... 나를 쓰러뜨리지 않고선 내궁으로 갈 수 없다!",
        "concede": "고맙다, 젊은 영웅들이여... 드디어 정신이 돌아왔소. 내궁 비취 평의회의 심연 핵을 조심하시오!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 27,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "두 개의 약속 사이에서",
    "locationKo": "결전 전야 황궁 내궁 정원",
    "oneLineKo": "결전 전야 내궁 정원으로 스며든 암살단장 독거미 아라크네의 그림자 자객단을 물리치고 새벽의 깃발을 지켜라!",
    "novelEpisodeUrl": "/book?ep=27",
    "webtoonEpisodeUrl": "/webtoon?ep=27",
    "bookMdUrl": "/book/episode_27.md",
    "coverIllustrationUrl": "/images/webtoon/episode_27/scene_05.webp",
    "prevContextKo": "비취 평의회 최후의 결전을 하루 앞둔 자정, 고요한 내궁 정원에서 세 사람은 저마다 가슴속 깊은 약속을 나눈다.",
    "synopsisKo": "실리아는 전쟁이 끝나면 북방의 봄날 보리밭에서 평범하게 함께 살자는 소박한 소망을 카단에게 고백한다. 한편 홀로 과거의 죄책감을 짊어진 이그니스는 카단에게 자신의 순수한 마나가 담긴 ‘유리 불씨’를 건네며, 무슨 일이 생겨도 대륙과 실리아를 지켜 달라는 비장한 다짐을 남긴 채 야습해 온 암살단장 아라크네와 맞선다.",
    "battleReasonKo": "결전 전야 내궁 정원으로 스며든 암살단장 독거미 아라크네의 그림자 자객단을 물리치고 새벽의 깃발을 지켜라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "독거미 아라크네",
        "role": "루시안 휘하 맹독 암살단장",
        "cutoutUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_27/scene_05.webp",
        "shortCaption": "실리아는 전쟁이 끝나면 북방의 봄날 보리밭에서 평범하게 함께 살자는 소박한 소망을 카단에게 고백한다.",
        "shortQuote": "잠이 오지 않나요, 카단?",
        "narration": "자정을 앞둔 황궁 내궁의 정원은 적막할 정도로 고요했다. 낮 동안의 전투 흔적은 가라앉았지만, 밤안개 사이로 스며드는 살기는 살갗을 바늘처럼 찔렀다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "잠이 오지 않나요, 카단? 내일이면 십팔 년간 얽혀 있던 대륙의 오랜 악연이 결판날 텐데, 당신의 등은 여전히 북방의 바위처럼 묵직하네요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_27/scene_19.webp",
        "shortCaption": "무슨 일이 생겨도 대륙과 실리아를 지켜 달라는 비장한 다짐을 남긴 채 야습해 온 암살단장 아라크네와 맞선다.",
        "shortQuote": "실리아가 고개를 끄덕였다. “네, 그 약속을 가슴에 품고 내일의 전장을 견뎌낼게요.",
        "narration": "카단이 방패에 새겨진 드래곤의 문양을 어루만지며 속삭였다.",
        "speakerName": "실리아",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "보리가 익어갈 무렵이면 바람 속삭임 섬의 꽃배들도 다시 바다를 메우겠지. 그날이 오면 검과 방패를 내려놓고 온전한 평화를 노래할 수 있을 것이다."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_27/scene_34.webp",
        "shortCaption": "무슨 일이 생겨도 대륙과 실리아를 지켜 달라는 비장한 다짐을 남긴 채 야습해 온 암살단장 아라크네와 맞선다.",
        "shortQuote": "들어라, 카단. 너는 대륙의 백성들을 지킬 방패다. 실리아는 새로운 시대를 이끌…",
        "narration": "한편 홀로 과거의 죄책감을 짊어진 이그니스는 카단에게 자신의 순수한 마나가 담긴 ‘유리 불씨’를 건네며, 무슨 일이 생겨도 대륙과 실리아를 지켜 달라는 비장한 다짐을 남긴 채 야습해 온 암살단장 아라크네와 맞선다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "이것은 내 심장 마나와 연결된 ‘순백의 유리 불씨’다. 루시안은 내일 밤 황제의 옥좌에 나인섀도우의 심연 핵을 설치해 폭주시킬 것이다. 그 핵을 파괴하려면 황실의 정통 화염 혈통인 내 마나를 희생시켜야만 해."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_27/scene_45.webp",
        "shortCaption": "결전 전야 내궁 정원으로 스며든 암살단장 독거미 아라크네의 그림자 자객단을 물리치고 새벽의 깃발을 지켜라!",
        "shortQuote": "카단은 드래곤 브레이커 방패를 품에 안고 조용히 눈을 감았다.",
        "narration": "결전 전야 내궁 정원으로 스며든 암살단장 독거미 아라크네의 그림자 자객단을 물리치고 새벽의 깃발을 지켜라!",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "바람의 정령들이 길을 인도하고 있어요. 갑시다, 평의회의 대전각으로."
      }
    ],
    "bossHeroClass": "ROGUE",
    "bossNameKo": "암살단장 아라크네",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
    "bossHeroSpec": {
      "heroNameKo": "암살단장 아라크네",
      "titleKo": "제27화 보스 · 루시안 휘하 맹독 암살단장",
      "factionLabelKo": "황실 직속 독사·거미 암살단 · 결전",
      "portraitUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
      "heroPowerNameKo": "야습 맹독 비수",
      "heroPowerTextKo": "1/2 단검을 장착합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
      "accentColor": "#84cc16",
      "frameGradient": "linear-gradient(180deg, #4d7c0f 0%, #1a2e05 100%)",
      "skyTop": "#1a2e05",
      "skyMid": "#3f6212",
      "skyBot": "#0a1202",
      "halo": "rgba(163, 230, 53, 0.52)",
      "emotesKo": {
        "greetings": "샤샤샥... 내 맹독 거미줄에 걸린 나비들이 여기 있었네?",
        "well_played": "어머, 맹독 단검을 아슬아슬하게 쳐냈구나?",
        "thanks": "몸부림칠수록 거미줄은 더 깊숙이 파고든단다.",
        "wow": "내 신경독을 별빛 호흡으로 태워 없애다니?!",
        "oops": "호호, 독침 하나가 빗나갔네.",
        "threaten": "심장이 검게 녹아내리는 극독의 키스를 선물해 주마!",
        "start": "루시안 재상 각하의 밀명이다! 소리 없이 전원 몰살하라!",
        "concede": "샤아악! 내 독거미 진형이 찢기다니... 어둠 속으로 숨는다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 28,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "비취 평의회의 반란",
    "locationKo": "황궁 최고 회의장 ‘비취 평의회’ 대전각",
    "oneLineKo": "형제 이그니스의 숭고한 불꽃이 헛되지 않도록, 비취 평의회 대전각의 데스나이트 아르투스를 분쇄하라!",
    "novelEpisodeUrl": "/book?ep=28",
    "webtoonEpisodeUrl": "/webtoon?ep=28",
    "bookMdUrl": "/book/episode_28.md",
    "coverIllustrationUrl": "/images/webtoon/episode_28/scene_05.webp",
    "prevContextKo": "자정의 비취 평의회 대전각—루시안과 데스나이트 아르투스는 수도 전체를 날려버릴 금지된 유물 ‘심연의 핵’을 폭주시키고 있었다!",
    "synopsisKo": "아르투스의 흑요석 대검 맹공을 카단이 드래곤 브레이커 방패로 한 치의 물러섬 없이 받아내는 사이, 임계점에 달한 심연의 핵이 대폭발을 일으키려 한다. 그 순간 이그니스가 형제 카단과 백성들을 결계 밖으로 밀쳐내고 자신의 심장 불꽃을 끝까지 불살라 폭주하는 심연의 핵을 홀로 봉인하며 찬란한 빛 속으로 산화한다.",
    "battleReasonKo": "형제 이그니스의 숭고한 불꽃이 헛되지 않도록, 비취 평의회 대전각의 데스나이트 아르투스를 분쇄하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "데스나이트 아르투스",
        "role": "섀도우렐름 섭정 · 죽음의 기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
        "side": "ENEMY"
      },
      {
        "name": "루시안",
        "role": "붉은 유리 궁정 재상 · 만악의 근원",
        "cutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_28/scene_05.webp",
        "shortCaption": "임계점에 달한 심연의 핵이 대폭발을 일으키려 한다.",
        "shortQuote": "루시안이 광기에 찬 사자후를 터뜨렸다.",
        "narration": "자정이 깊어지자 황궁 최고 회의장인 ‘비취 평의회’ 대전각은 짙푸른 암흑 마나의 소용돌이에 휩싸였다.",
        "speakerName": "루시안",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "시간이 되었다! 황제의 피를 바쳐 심연의 차원문을 열고, 신세계의 절대 군주로 군림하리라!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_28/scene_20.webp",
        "shortCaption": "그 순간 이그니스가 형제 카단과 백성들을 결계 밖으로 밀쳐내고 자신의 심장 불꽃을 끝까지 불살라 폭주하는 심연의…",
        "shortQuote": "괴물 같은 놈들! 감히 내 신세계를 방해하다니!",
        "narration": "이그니스의 백색 화염은 루시안의 암흑 결계를 맹렬하게 집어삼켰다. 불길 속에서 루시안의 진홍빛 법복이 누더기로 타들어갔다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "괴물 같은 놈들! 감히 내 신세계를 방해하다니!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_28/scene_37.webp",
        "shortCaption": "그 순간 이그니스가 형제 카단과 백성들을 결계 밖으로 밀쳐내고 자신의 심장 불꽃을 끝까지 불살라 폭주하는 심연의…",
        "shortQuote": "카단... 내 형제여... 알렉산다르 숙부님과 발리안 아버지께 전해다오...…",
        "narration": "이그니스가 피를 토하면서도 환하게 미소를 지으며 뒤를 돌아보았다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "카단... 내 형제여... 알렉산다르 숙부님과 발리안 아버지께 전해다오... 이그니스는 마지막 순간에... 비겁하지 않았노라고... 실리아... 카단을... 부탁하오..."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_28/scene_49.webp",
        "shortCaption": "형제 이그니스의 숭고한 불꽃이 헛되지 않도록, 비취 평의회 대전각의 데스나이트 아르투스를 분쇄하라!",
        "shortQuote": "이그니스... 네 희생을 결코 헛되이 하지 않겠다. 네가 목숨으로 지켜낸 이…",
        "narration": "형제 이그니스의 숭고한 불꽃이 헛되지 않도록, 비취 평의회 대전각의 데스나이트 아르투스를 분쇄하라!",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이그니스는 영원히 우리 곁에 있어요. 그가 남긴 빛으로 반드시 새벽을 완성해야 해요."
      }
    ],
    "bossHeroClass": "ROGUE",
    "bossNameKo": "데스나이트 아르투스",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
    "bossHeroSpec": {
      "heroNameKo": "데스나이트 아르투스",
      "titleKo": "제28화 보스 · 섀도우렐름 섭정 · 죽음의 기사",
      "factionLabelKo": "섀도우렐름 죽음기사단 · 황궁",
      "portraitUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
      "heroPowerNameKo": "흑요석 마검 발도",
      "heroPowerTextKo": "1/2 단검을 장착합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
      "accentColor": "#818cf8",
      "frameGradient": "linear-gradient(180deg, #3730a3 0%, #0f172a 100%)",
      "skyTop": "#0f172a",
      "skyMid": "#312e81",
      "skyBot": "#020617",
      "halo": "rgba(129, 140, 248, 0.55)",
      "emotesKo": {
        "greetings": "산 자의 맹세 따위, 죽음의 서리 앞에서는 부질없다.",
        "well_played": "그 방패... 옛 아케 성기사단의 기운이 서려 있군.",
        "thanks": "네 망설임이 내 흑요석 대검의 먹잇감이다.",
        "wow": "내 필살의 참격을 정면으로 받아내다니...!",
        "oops": "검기가 한 치 어긋났군.",
        "threaten": "섀도우렐름의 차가운 어둠 속에 영원히 잠들어라!",
        "start": "흑요석 마검이여, 가로막는 모든 방패를 두 동강 내라!",
        "concede": "크윽... 부서지지 않는 신념이로군. 이 승부는 아직 끝나지 않았다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 29,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "바람의 여왕",
    "locationKo": "잿빛 새벽의 라이트헤븐 중앙 광장",
    "oneLineKo": "수도 해방 선언식을 피로 물들이려 광장 지하에서 기습한 맹독여왕 아라크네를 완전히 처단하라!",
    "novelEpisodeUrl": "/book?ep=29",
    "webtoonEpisodeUrl": "/webtoon?ep=29",
    "bookMdUrl": "/book/episode_29.md",
    "coverIllustrationUrl": "/images/webtoon/episode_29/scene_05.webp",
    "prevContextKo": "이그니스의 희생으로 수도 라이트헤븐은 파멸을 면했지만, 형제를 잃은 슬픔이 채 가시기도 전에 북방으로 도주한 루시안의 독니가 다시 덮쳐온다.",
    "synopsisKo": "해방된 시민들이 실리아를 새로운 여왕으로 추대하려 하지만, 실리아는 화려한 왕관을 사양하고 민중과 함께 걷는 ‘바람의 벗’으로 남겠다고 선언해 광장을 감동시킨다. 직후 광장 지하에서 최후의 발악으로 기습해 온 맹독여왕 아라크네를 처단한 카단과 실리아는 이그니스의 유리 불씨를 품고 북방 최후 결전지로 출진한다.",
    "battleReasonKo": "수도 해방 선언식을 피로 물들이려 광장 지하에서 기습한 맹독여왕 아라크네를 완전히 처단하라!",
    "cast": [
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "독거미 아라크네",
        "role": "루시안 휘하 맹독 암살단장",
        "cutoutUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_29/scene_05.webp",
        "shortCaption": "실리아는 화려한 왕관을 사양하고 민중과 함께 걷는 ‘바람의 벗’으로 남겠다고 선언해 광장을 감동시킨다.",
        "shortQuote": "카단이 방패를 고쳐 쥐며 고개를 끄덕였다.",
        "narration": "비취 평의회의 참극이 지나간 다음 날 아침, 수도 라이트헤이븐의 하늘은 잿빛 먹구름에 덮여 있었다. 황궁 대전각의 화재는 진압되었지만, 이그니스를 잃은 슬픔의 무게는 대성당과 황궁 전체를 무겁게 짓누르고 있었다.",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이 유리 불씨를 쥐고 있으면 이그니스의 정결한 영혼이 손끝으로 고스란히 전해져 와요. 그의 고결한 희생으로 황궁을 구했지만, 곁이 비어버린 슬픔은 쉽게 가시지 않네요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_29/scene_20.webp",
        "shortCaption": "직후 광장 지하에서 최후의 발악으로 기습해 온 맹독여왕 아라크네를 처단한 카단과 실리아는 이그니스의 유리 불씨를…",
        "shortQuote": "스승님과 여왕 전하께서 하늘에서 보셨다면 참으로 자랑스러워하셨을 결단이다.",
        "narration": "직후 광장 지하에서 최후의 발악으로 기습해 온 맹독여왕 아라크네를 처단한 카단과 실리아는 이그니스의 유리 불씨를 품고 북방 최후 결전지로 출진한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "스승님과 여왕 전하께서 하늘에서 보셨다면 참으로 자랑스러워하셨을 결단이다."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_29/scene_35.webp",
        "shortCaption": "직후 광장 지하에서 최후의 발악으로 기습해 온 맹독여왕 아라크네를 처단한 카단과 실리아는 이그니스의 유리 불씨를…",
        "shortQuote": "아라크네가 기괴하게 웃음을 터뜨렸다.",
        "narration": "직후 광장 지하에서 최후의 발악으로 기습해 온 맹독여왕 아라크네를 처단한 카단과 실리아는 이그니스의 유리 불씨를 품고 북방 최후 결전지로 출진한다.",
        "speakerName": "아라크네",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "형제가 길을 열어주었다. 주저 없이 돌파한다."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_29/scene_47.webp",
        "shortCaption": "수도 해방 선언식을 피로 물들이려 광장 지하에서 기습한 맹독여왕 아라크네를 완전히 처단하라!",
        "shortQuote": "바람은 결코 멈추지 않아요. 우리가 지나간 자리에 반드시 평화로운 꽃이 필 거예요.",
        "narration": "수도 해방 선언식을 피로 물들이려 광장 지하에서 기습한 맹독여왕 아라크네를 완전히 처단하라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "바람은 결코 멈추지 않아요. 우리가 지나간 자리에 반드시 평화로운 꽃이 필 거예요."
      }
    ],
    "bossHeroClass": "WARLOCK",
    "bossNameKo": "맹독여왕 아라크네",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
    "bossHeroSpec": {
      "heroNameKo": "맹독여왕 아라크네",
      "titleKo": "제29화 보스 · 루시안 휘하 맹독 암살단장",
      "factionLabelKo": "황실 직속 독사·거미 암살단 · 잿빛",
      "portraitUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
      "heroPowerNameKo": "거미여왕 독낭 폭주",
      "heroPowerTextKo": "카드를 1장 뽑고 내 영웅에게 피해를 2 줍니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
      "accentColor": "#84cc16",
      "frameGradient": "linear-gradient(180deg, #4d7c0f 0%, #1a2e05 100%)",
      "skyTop": "#1a2e05",
      "skyMid": "#3f6212",
      "skyBot": "#0a1202",
      "halo": "rgba(163, 230, 53, 0.52)",
      "emotesKo": {
        "greetings": "샤샤샥... 내 맹독 거미줄에 걸린 나비들이 여기 있었네?",
        "well_played": "어머, 맹독 단검을 아슬아슬하게 쳐냈구나?",
        "thanks": "몸부림칠수록 거미줄은 더 깊숙이 파고든단다.",
        "wow": "내 신경독을 별빛 호흡으로 태워 없애다니?!",
        "oops": "호호, 독침 하나가 빗나갔네.",
        "threaten": "심장이 검게 녹아내리는 극독의 키스를 선물해 주마!",
        "start": "루시안 재상 각하의 밀명이다! 소리 없이 전원 몰살하라!",
        "concede": "샤아악! 내 독거미 진형이 찢기다니... 어둠 속으로 숨는다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 30,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "네 수문의 맹독",
    "locationKo": "북방 방어선 ‘네 수문 요새’",
    "oneLineKo": "하류 백성들에게 맹독 강물을 방류하려는 네 수문 요새의 타락수문장 아쿠아로드를 제압하라!",
    "novelEpisodeUrl": "/book?ep=30",
    "webtoonEpisodeUrl": "/webtoon?ep=30",
    "bookMdUrl": "/book/episode_30.md",
    "coverIllustrationUrl": "/images/webtoon/episode_30/scene_05.webp",
    "prevContextKo": "루시안의 본거지 검은 늪으로 진격하는 연합군 앞을 절벽 사이 네 개의 거대한 흑철 수문 요새가 가로막는다.",
    "synopsisKo": "메두사 고르고가 수문 상류에 풀어놓은 치명적인 부식 맹독이 강물을 타고 수천 명의 의용군과 피난민을 덮치려 한다! 스승 론돌과 약제사 엘리아나가 해독 수로를 여는 동안, 카단과 실리아는 폭풍우를 가르고 수문 꼭대기로 돌격해 타락수문장 아쿠아로드와 독기 장치를 단숨에 박살 낸다.",
    "battleReasonKo": "하류 백성들에게 맹독 강물을 방류하려는 네 수문 요새의 타락수문장 아쿠아로드를 제압하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "론돌",
        "role": "일곱 추적자 · 거친 파도의 뱃사공",
        "cutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "side": "ALLY"
      },
      {
        "name": "엘리아나",
        "role": "일곱 추적자 · 약제사 스승",
        "cutoutUrl": "/anime-character-sheets/cutouts/063_Eliana.png",
        "side": "ALLY"
      },
      {
        "name": "수문장 아쿠아로드",
        "role": "네 수문 요새를 막아선 심연 군주",
        "cutoutUrl": "/anime-character-sheets/cutouts/005_Aqualord.png",
        "side": "ENEMY"
      },
      {
        "name": "메두사 고르고",
        "role": "나인섀도우 코덱스를 훔친 암흑 마녀",
        "cutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_30/scene_05.webp",
        "shortCaption": "메두사 고르고가 수문 상류에 풀어놓은 치명적인 부식 맹독이 강물을 타고 수천 명의 의용군과 피난민을 덮치려 한다!",
        "shortQuote": "고약한 독기로군! 쇠붙이마저 삭혀버리는 산성 독무다. 이 독기를 마시면 아무리…",
        "narration": "네 수문 요새의 첫 번째 관문을 돌파한 일행이 마주한 것은 고대 제국의 북방 방어선이자 악명 높은 ‘네 수문 요새’의 본진이었다.",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "고약한 독기로군! 쇠붙이마저 삭혀버리는 산성 독무다. 이 독기를 마시면 아무리 장사라도 십 리를 못 가고 피를 토하며 쓰러질 게야."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_30/scene_19.webp",
        "shortCaption": "카단과 실리아는 폭풍우를 가르고 수문 꼭대기로 돌격해 타락수문장 아쿠아로드와 독기 장치를 단숨에 박살 낸다.",
        "shortQuote": "하하! 뼈다귀 놈들이 북방의 늑대 방패 앞에서 추풍낙엽이로구나! 다음 문으로 가자!",
        "narration": "스승 론돌과 약제사 엘리아나가 해독 수로를 여는 동안, 카단과 실리아는 폭풍우를 가르고 수문 꼭대기로 돌격해 타락수문장 아쿠아로드와 독기 장치를 단숨에 박살 낸다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "하하! 뼈다귀 놈들이 북방의 늑대 방패 앞에서 추풍낙엽이로구나! 다음 문으로 가자!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_30/scene_34.webp",
        "shortCaption": "카단과 실리아는 폭풍우를 가르고 수문 꼭대기로 돌격해 타락수문장 아쿠아로드와 독기 장치를 단숨에 박살 낸다.",
        "shortQuote": "애송이 놈들! 이 최후의 맹독의 지옥불은 바위도 녹여버린다! 잿더미가 되어…",
        "narration": "바르가스트가 흉포한 미소를 지으며 화염 방사기의 밸브를 열었다.",
        "speakerName": "수문장 아쿠아로드",
        "speakerRole": "네 수문 요새를 막아선 심연 군주",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/005_Aqualord.png",
        "quote": "애송이 놈들! 이 최후의 맹독의 지옥불은 바위도 녹여버린다! 잿더미가 되어 늪지의 거름이나 되어라!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_30/scene_45.webp",
        "shortCaption": "하류 백성들에게 맹독 강물을 방류하려는 네 수문 요새의 타락수문장 아쿠아로드를 제압하라!",
        "shortQuote": "형제가 남겨준 등불을 따라, 최후의 어둠을 심판하러 가자.” 선대 영웅들의 넋과…",
        "narration": "하류 백성들에게 맹독 강물을 방류하려는 네 수문 요새의 타락수문장 아쿠아로드를 제압하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "형제가 남겨준 등불을 따라, 최후의 어둠을 심판하러 가자."
      }
    ],
    "bossHeroClass": "SHAMAN",
    "bossNameKo": "타락수문장 아쿠아로드",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/005_Aqualord.png",
    "bossHeroSpec": {
      "heroNameKo": "타락수문장 아쿠아로드",
      "titleKo": "제30화 보스 · 네 수문 요새를 막아선 심연 군주",
      "factionLabelKo": "심연 해역 타락 수군 · 북방",
      "portraitUrl": "/anime-character-sheets/cutouts/005_Aqualord.png",
      "heroPowerNameKo": "맹독 수문 토템",
      "heroPowerTextKo": "무작위 주술 토템을 하나 소환합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/005_Aqualord.png",
      "accentColor": "#0ea5e9",
      "frameGradient": "linear-gradient(180deg, #0369a1 0%, #082f49 100%)",
      "skyTop": "#082f49",
      "skyMid": "#0284c7",
      "skyBot": "#021627",
      "halo": "rgba(56, 189, 248, 0.55)",
      "emotesKo": {
        "greetings": "크하하! 물안개와 탁류 속에서 모두 수장시켜 주마!",
        "well_played": "육지 것들치고는 물길을 읽는 눈이 있군!",
        "thanks": "수위가 차오를수록 내 삼지창은 더욱 거세진다!",
        "wow": "말도 안 돼! 내 해일 방벽을 정면으로 가르다니?!",
        "oops": "물살이 잠시 역류했군!",
        "threaten": "차디찬 강물 밑바닥에서 물고기 밥이 되어라!",
        "start": "수문을 봉쇄하고 약탈 수군 전원 진격하라!",
        "concede": "크아악... 수문 장치가 부서지다니! 탁류 속으로 퇴각한다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 31,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "내기에 건 손",
    "locationKo": "검은 늪 외곽 ‘흐르는 모래강’ 도박 요새",
    "oneLineKo": "비열한 인질 사기 도박이 깨지자 본색을 드러낸 도박사 간다르의 흑마술 군단을 쓸어버려라!",
    "novelEpisodeUrl": "/book?ep=31",
    "webtoonEpisodeUrl": "/webtoon?ep=31",
    "bookMdUrl": "/book/episode_31.md",
    "coverIllustrationUrl": "/images/webtoon/episode_31/scene_05.webp",
    "prevContextKo": "네 수문을 넘어선 연합군은 바닥 없는 유사(流砂)가 흐르는 모래강 도하 다리를 점거한 흑마법 도박사 간다르와 마주한다.",
    "synopsisKo": "간다르는 포로로 잡은 민간인들의 목숨을 담보로 주사위 두 개로 ‘13’을 만들어야만 다리를 내주겠다는 불가능한 사기 도박을 강요한다. 스승 카제의 눈썰미를 떠올린 카단은 주사위가 멈추는 찰나 은빛 단검의 검기만으로 주사위 하나를 반으로 쪼개 ‘6 + 6 + 1 = 13’을 만들어내는 통쾌한 기지로 적의 사기극을 박살 내고 인질들을 구출한다!",
    "battleReasonKo": "비열한 인질 사기 도박이 깨지자 본색을 드러낸 도박사 간다르의 흑마술 군단을 쓸어버려라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "그림리",
        "role": "일곱 추적자 · 드워프 대장장이 스승",
        "cutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "side": "ALLY"
      },
      {
        "name": "카제",
        "role": "일곱 추적자 · 은화 비검술사",
        "cutoutUrl": "/anime-character-sheets/cutouts/044_Kaze.png",
        "side": "ALLY"
      },
      {
        "name": "주술사 간다르",
        "role": "검은 늪의 저주와 도박장 지배자",
        "cutoutUrl": "/anime-character-sheets/cutouts/069_Gandar.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_31/scene_05.webp",
        "shortCaption": "간다르는 포로로 잡은 민간인들의 목숨을 담보로 주사위 두 개로 ‘13’을 만들어야만 다리를 내주겠다는 불가능한…",
        "shortQuote": "이 흐르는 모래강은 바다보다.",
        "narration": "네 수문의 맹독을 정화하고 북쪽 평원으로 진격한 연합군이 마주한 것은 대륙 북방의 악명 높은 불모지, ‘검은 늪지대’의 외곽을 가로지르는 흐르는 모래강이었다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "이 흐르는 모래강은 바다보다 더 고약해. 일반 목재 배는 띄우자마자 진흙의 무게를 못 이기고 가라앉아 버리지. 오직 늪지대 고블린들이 만든 특수 부유선 ‘갈대나룻배’만이 이 강을 건널 수 있다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_31/scene_22.webp",
        "shortCaption": "스승 카제의 눈썰미를 떠올린 카단은 주사위가 멈추는 찰나 은빛 단검의 검기만으로 주사위 하나를 반으로 쪼개 ‘6…",
        "shortQuote": "네놈이 진다면... 그 전설의 방패를 쥔 네 왼팔을 통째로 잘라 내 도박장의…",
        "narration": "보가트가 황금 주사위 두 개를 손안에서 짤랑거리며 눈을 번뜩였다.",
        "speakerName": "보가트",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "금화 따위는 시시해! 내기를 하자, 기사 양반! 내 주사위 놀음에서 네놈이 이기면 나룻배 백 척을 무상으로 내어주지. 하지만 네놈이 진다면... 그 전설의 방패를 쥔 네 왼팔을 통째로 잘라 내 도박장의 장식품으로 걸어두겠다! 어때, 내기에 걸겠느냐?"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_31/scene_40.webp",
        "shortCaption": "스승 카제의 눈썰미를 떠올린 카단은 주사위가 멈추는 찰나 은빛 단검의 검기만으로 주사위 하나를 반으로 쪼개 ‘6…",
        "shortQuote": "말도 안 돼! 주사위가 쪼개져서 13이 나오다니... 사기다! 이놈들을 모조리 쳐라!",
        "narration": "스승 카제의 눈썰미를 떠올린 카단은 주사위가 멈추는 찰나 은빛 단검의 검기만으로 주사위 하나를 반으로 쪼개 ‘6 + 6 + 1 = 13’을 만들어내는 통쾌한 기지로 적의 사기극을 박살 내고 인질들을 구출한다!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "마, 말도 안 돼! 주사위가 쪼개져서 13이 나오다니... 사기다! 이놈들을 모조리 쳐라!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_31/scene_53.webp",
        "shortCaption": "비열한 인질 사기 도박이 깨지자 본색을 드러낸 도박사 간다르의 흑마술 군단을 쓸어버려라!",
        "shortQuote": "주사위를 쪼개서 13을 만들다니, 알렉산다르 그 양반보다.",
        "narration": "비열한 인질 사기 도박이 깨지자 본색을 드러낸 도박사 간다르의 흑마술 군단을 쓸어버려라!",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "주사위를 쪼개서 13을 만들다니, 알렉산다르 그 양반보다 네놈이 한 수 위로구나! 참으로 가슴이 뻥 뚫리는 한판이었다!"
      }
    ],
    "bossHeroClass": "WARLOCK",
    "bossNameKo": "도박사 간다르",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/069_Gandar.png",
    "bossHeroSpec": {
      "heroNameKo": "도박사 간다르",
      "titleKo": "제31화 보스 · 검은 늪의 저주와 도박장 지배자",
      "factionLabelKo": "검은 늪 사령·도박 결사 · 검은",
      "portraitUrl": "/anime-character-sheets/cutouts/069_Gandar.png",
      "heroPowerNameKo": "사기 주사위 계약",
      "heroPowerTextKo": "카드를 1장 뽑고 내 영웅에게 피해를 2 줍니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/069_Gandar.png",
      "accentColor": "#9333ea",
      "frameGradient": "linear-gradient(180deg, #7e22ce 0%, #2e1065 100%)",
      "skyTop": "#2e1065",
      "skyMid": "#6b21a8",
      "skyBot": "#120524",
      "halo": "rgba(192, 132, 252, 0.55)",
      "emotesKo": {
        "greetings": "키히히! 망자의 뼈와 사기 주사위 판에 발을 들인 걸 환영한다!",
        "well_played": "이, 이럴 수가! 주사위를 반으로 쪼개 눈금 13을 만들다니?!",
        "thanks": "키히히, 네 영혼도 판돈으로 얹어 주지!",
        "wow": "으아악! 내 필승의 저주 술식이 단검 한 자루에 박살 나다니!",
        "oops": "어라, 사령의 촛불이 흔들렸군!",
        "threaten": "비겁하다고 욕해 봐라! 이기면 그만인 어둠의 주술로 짓뭉개 주마!",
        "start": "어둠의 망령들과 저주의 패거리여, 저 건방진 영웅들을 물어뜯어라!",
        "concede": "키에에엑! 내 사령 제단과 도박장이 전부 무너지다니, 살려다오!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 32,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "첫사랑의 메아리",
    "locationKo": "검은 늪 안개림 ‘속삭이는 버드나무 숲’",
    "oneLineKo": "그리운 이의 환영으로 마음을 무너뜨리는 속삭이는 버드나무 숲의 환각마녀 모르가나를 파훼하라!",
    "novelEpisodeUrl": "/book?ep=32",
    "webtoonEpisodeUrl": "/webtoon?ep=32",
    "bookMdUrl": "/book/episode_32.md",
    "coverIllustrationUrl": "/images/webtoon/episode_32/scene_05.webp",
    "prevContextKo": "모래강을 건넌 연합군은 천 년 된 고대 버드나무들이 안개 속에 도열한 환각의 숲으로 진입한다.",
    "synopsisKo": "숲을 지배하는 환각마녀 모르가나의 주술이 실리아 앞에 돌아가신 어머니 실피드 여왕의 따뜻한 환영을 피워 올려 마음의 빈틈을 파고든다. 환각에 잠식될 위기의 순간, 카단이 불어준 맑고 청아한 북방의 피리 소리가 안개를 산산조각 내고, 두 사람은 봄날 보리밭의 약속을 다시 새기며 심연의 본진 앞으로 나아간다.",
    "battleReasonKo": "그리운 이의 환영으로 마음을 무너뜨리는 속삭이는 버드나무 숲의 환각마녀 모르가나를 파훼하라!",
    "cast": [
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "여왕 실피드",
        "role": "독살당한 실리아의 어머니",
        "cutoutUrl": "/anime-character-sheets/cutouts/023_Sylphid.png",
        "side": "ALLY"
      },
      {
        "name": "환각마녀 모르가나",
        "role": "속삭이는 버드나무 안개림 마녀",
        "cutoutUrl": "/hs-assets/bosses/boss_morgana.webp",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_32/scene_05.webp",
        "shortCaption": "숲을 지배하는 환각마녀 모르가나의 주술이 실리아 앞에 돌아가신 어머니 실피드 여왕의 따뜻한 환영을 피워 올려…",
        "shortQuote": "실리아가 녹옥 지팡이를 가슴에 품으며 걸음을 멈추었다.",
        "narration": "흐르는 모래강을 건넌 연합군은 검은 늪지대의 깊은 안개 숲인 ‘속삭이는 버드나무 숲’으로 접어들었다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이곳은... 어머니 실피드와 아버지 에올루스가 젊은 시절 처음으로 만나 사랑을 맹세하셨던 ‘은빛 버드나무 정원’이에요. 고향 섬의 옛 노래에 나오는 바로 그곳이에요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_32/scene_19.webp",
        "shortCaption": "환각에 잠식될 위기의 순간, 카단이 불어준 맑고 청아한 북방의 피리 소리가 안개를 산산조각 내고, 두 사람은…",
        "shortQuote": "어머니... 정말 어머니예요...? 저를... 두고 가지 마세요...",
        "narration": "실리아의 눈동자가 흔들리기 시작했다. 어머니를 향한 오랜 그리움과 유년 시절의 상처가 한순간에 봇물 터지듯 터져 나오며, 실리아의 손에서 녹옥 지팡이가 힘없이 미끄러져 떨어지려 했다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "어머니... 정말 어머니예요...? 저를... 두고 가지 마세요..."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_32/scene_34.webp",
        "shortCaption": "환각에 잠식될 위기의 순간, 카단이 불어준 맑고 청아한 북방의 피리 소리가 안개를 산산조각 내고, 두 사람은…",
        "shortQuote": "네 어머니는 결코 딸에게 도망치라 가르치지 않았다!",
        "narration": "환각에 잠식될 위기의 순간, 카단이 불어준 맑고 청아한 북방의 피리 소리가 안개를 산산조각 내고, 두 사람은 봄날 보리밭의 약속을 다시 새기며 심연의 본진 앞으로 나아간다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "네 어머니는 결코 딸에게 도망치라 가르치지 않았다! 실피드 여왕의 영혼은 너의 승리를 위해 하늘에서 기도하고 계신다!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_32/scene_45.webp",
        "shortCaption": "그리운 이의 환영으로 마음을 무너뜨리는 속삭이는 버드나무 숲의 환각마녀 모르가나를 파훼하라!",
        "shortQuote": "카단이 부드럽게 미소 지으며 대답했다.",
        "narration": "그리운 이의 환영으로 마음을 무너뜨리는 속삭이는 버드나무 숲의 환각마녀 모르가나를 파훼하라!",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "봄날의 보리밭 약속, 반드시 지켜주셔야 해요."
      }
    ],
    "bossHeroClass": "PRIEST",
    "bossNameKo": "환각마녀 모르가나",
    "bossCutoutUrl": "/hs-assets/bosses/boss_morgana.webp",
    "bossHeroSpec": {
      "heroNameKo": "환각마녀 모르가나",
      "titleKo": "제32화 보스 · 속삭이는 버드나무 안개림 마녀",
      "factionLabelKo": "속삭이는 버드나무 안개림 · 검은",
      "portraitUrl": "/hs-assets/bosses/boss_morgana.webp",
      "heroPowerNameKo": "환각 정기 흡수",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/hs-assets/bosses/boss_morgana.webp",
      "accentColor": "#c084fc",
      "frameGradient": "linear-gradient(180deg, #7e22ce 0%, #1e293b 100%)",
      "skyTop": "#1e1b4b",
      "skyMid": "#6b21a8",
      "skyBot": "#0f172a",
      "halo": "rgba(216, 180, 254, 0.58)",
      "emotesKo": {
        "greetings": "우후후... 가장 그리운 사람의 목소리 속에서 영원히 잠들렴...",
        "well_played": "어머나, 북방의 맑은 피리 소리로 내 천 년 환각 안개를 깨뜨리다니!",
        "thanks": "그리움과 눈물일수록 달콤한 환영의 양분이 되지.",
        "wow": "두 사람의 봄날 보리밭 약속이 내 주술보다 강하단 말이냐?!",
        "oops": "환영 거울에 금이 갔네...",
        "threaten": "죽은 어머니의 품속 환영에서 영원히 깨어나지 못하게 해주마!",
        "start": "속삭이는 버드나무 안개여, 이들의 가장 아픈 기억을 피워 올려라!",
        "concede": "아아... 맑은 피리 소리에 안개림의 저주가 흩어진다... 길을 비켜주마!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 33,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "검은 늪",
    "locationKo": "심연의 심장부 ‘검은 늪 성채’ 정문",
    "oneLineKo": "여섯 스승과 힘을 합쳐 검은 늪 성채 정문을 가로막은 거신마인 벨페고르를 돌파하라!",
    "novelEpisodeUrl": "/book?ep=33",
    "webtoonEpisodeUrl": "/webtoon?ep=33",
    "bookMdUrl": "/book/episode_33.md",
    "coverIllustrationUrl": "/images/webtoon/episode_33/scene_05.webp",
    "prevContextKo": "유황 진흙과 산성 안개가 들끓는 대륙 모든 부패의 종착지, 루시안의 최후 거점 ‘검은 늪 성채’가 마침내 모습을 드러낸다.",
    "synopsisKo": "루시안은 신의 힘으로도 열 수 없다는 거대 흑철 성문을 걸어 잠그고 결정마인 벨페고르에게 정문 방어를 맡긴다. 그때 북방에서 달려온 여섯 스승(가웨인·그림리·에일라·엘리아나·카제·론돌)이 제자 카단의 곁에 집결하여 완벽한 6인의 합공으로 난공불락의 성문 빗장을 부수고 돌격로를 연다!",
    "battleReasonKo": "여섯 스승과 힘을 합쳐 검은 늪 성채 정문을 가로막은 거신마인 벨페고르를 돌파하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "가웨인",
        "role": "일곱 추적자 수장 · 맹인 음파 무인",
        "cutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "side": "ALLY"
      },
      {
        "name": "그림리",
        "role": "일곱 추적자 · 드워프 대장장이 스승",
        "cutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "side": "ALLY"
      },
      {
        "name": "벨페고르",
        "role": "흑요석 결정술사 · 심연의 마인",
        "cutoutUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
        "side": "ENEMY"
      },
      {
        "name": "루시안",
        "role": "붉은 유리 궁정 재상 · 만악의 근원",
        "cutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_33/scene_05.webp",
        "shortCaption": "루시안은 신의 힘으로도 열 수 없다는 거대 흑철 성문을 걸어 잠그고 결정마인 벨페고르에게 정문 방어를 맡긴다.",
        "shortQuote": "루시안이 대륙 전역에서 끌어모은 최후의 병력이다.",
        "narration": "속삭이는 버드나무 숲을 벗어난 연합군이 당도한 곳은 마침내 대륙의 모든 악과 부패가 집결된 심연의 심장부, ‘검은 늪’의 본진이었다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "루시안이 대륙 전역에서 끌어모은 최후의 병력이다. 성문 앞의 깊은 해자에는 펄펄 끓는 용암과 독극물이 흐르고 있어 평범한 도하로는 접근조차 불가능하다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_33/scene_19.webp",
        "shortCaption": "그때 북방에서 달려온 여섯 스승이 제자 카단의 곁에 집결하여 완벽한 6인의 합공으로 난공불락의 성문 빗장을 부수고 돌격로를 연다!",
        "shortQuote": "성채 전체가 하나의 거대한 나인섀도우 마법진이에요.",
        "narration": "그때 북방에서 달려온 여섯 스승(가웨인·그림리·에일라·엘리아나·카제·론돌)이 제자 카단의 곁에 집결하여 완벽한 6인의 합공으로 난공불락의 성문 빗장을 부수고 돌격로를 연다!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "성채 전체가 하나의 거대한 나인섀도우 마법진이에요. 루시안을 처단하지 않으면 대륙의 지맥이 영원히 오염될 거예요."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_33/scene_34.webp",
        "shortCaption": "그때 북방에서 달려온 여섯 스승이 제자 카단의 곁에 집결하여 완벽한 6인의 합공으로 난공불락의 성문 빗장을 부수고 돌격로를 연다!",
        "shortQuote": "안 돼요! 루시안이 성채를 통째로 무너뜨려 연합군 전체를 매장하려 하고 있어요!",
        "narration": "그때 북방에서 달려온 여섯 스승(가웨인·그림리·에일라·엘리아나·카제·론돌)이 제자 카단의 곁에 집결하여 완벽한 6인의 합공으로 난공불락의 성문 빗장을 부수고 돌격로를 연다!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "안 돼요! 루시안이 성채를 통째로 무너뜨려 연합군 전체를 매장하려 하고 있어요!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_33/scene_45.webp",
        "shortCaption": "여섯 스승과 힘을 합쳐 검은 늪 성채 정문을 가로막은 거신마인 벨페고르를 돌파하라!",
        "shortQuote": "성문이 열렸어요! 루시안이 있는 중앙 대회랑으로 돌격해요!",
        "narration": "여섯 스승과 힘을 합쳐 검은 늪 성채 정문을 가로막은 거신마인 벨페고르를 돌파하라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "성문이 열렸어요! 루시안이 있는 중앙 대회랑으로 돌격해요!"
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "거신마인 벨페고르",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
    "bossHeroSpec": {
      "heroNameKo": "거신마인 벨페고르",
      "titleKo": "제33화 보스 · 흑요석 결정술사 · 심연의 마인",
      "factionLabelKo": "흑요석 심연 군단 · 심연의",
      "portraitUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
      "heroPowerNameKo": "심연 흑철 성벽",
      "heroPowerTextKo": "방어도를 +2 얻습니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
      "accentColor": "#c026d3",
      "frameGradient": "linear-gradient(180deg, #86198f 0%, #2e1065 100%)",
      "skyTop": "#2e1065",
      "skyMid": "#701a75",
      "skyBot": "#0f0720",
      "halo": "rgba(232, 121, 249, 0.55)",
      "emotesKo": {
        "greetings": "크하하! 나인섀도우 코덱스의 심연 결정 앞에 무릎 꿇어라!",
        "well_played": "미약한 인간치고는 내 외피에 흠집을 냈군.",
        "thanks": "네 고통이 흑요석 결정을 더욱 단단히 살찌운다!",
        "wow": "크헉?! 내 심연 갑주가 금이 가다니?!",
        "oops": "결정의 파편이 빗나갔군.",
        "threaten": "동료의 시체 위에서 절망하며 돌덩이로 굳어 죽어라!",
        "start": "미스트폴 절벽이 너희 일곱 추적자의 무덤이 될 것이다!",
        "concede": "크아아악! 죽은 동료의 넋이 검에 깃들다니... 심연으로 후퇴한다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 34,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "쓰러진 바람섬",
    "locationKo": "붕괴하는 검은 성채 지하 용암 회랑",
    "oneLineKo": "무너지는 용암 회랑에서 스승들이 열어준 생명의 통로를 가로막는 파멸마인 벨페고르를 일소하라!",
    "novelEpisodeUrl": "/book?ep=34",
    "webtoonEpisodeUrl": "/webtoon?ep=34",
    "bookMdUrl": "/book/episode_34.md",
    "coverIllustrationUrl": "/images/webtoon/episode_34/scene_05.webp",
    "prevContextKo": "성채 내부로 진입하자 루시안이 가동한 ‘대륙 붕괴의 룬’으로 천장의 유황 암석이 쏟아지고 바닥이 용암 속으로 무너져 내린다.",
    "synopsisKo": "제자 카단과 실리아를 최상층 파멸의 제단으로 올려보내기 위해, 여섯 스승들이 기꺼이 무너지는 거대 석주 아래에 남아 어깨와 무기로 천장을 떠받친다! ‘대륙의 미래를 부탁한다, 우리의 자랑스러운 제자여!’ 스승들의 숭고한 외침을 등 뒤로 삼킨 채 카단은 피눈물을 머금고 용암 회랑의 파멸마인 벨페고르를 뚫고 질주한다.",
    "battleReasonKo": "무너지는 용암 회랑에서 스승들이 열어준 생명의 통로를 가로막는 파멸마인 벨페고르를 일소하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "론돌",
        "role": "일곱 추적자 · 거친 파도의 뱃사공",
        "cutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "side": "ALLY"
      },
      {
        "name": "에일라",
        "role": "일곱 추적자 · 백발백중 석궁 명사수",
        "cutoutUrl": "/anime-character-sheets/cutouts/070_Aila.png",
        "side": "ALLY"
      },
      {
        "name": "벨페고르",
        "role": "흑요석 결정술사 · 심연의 마인",
        "cutoutUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_34/scene_05.webp",
        "shortCaption": "여섯 스승들이 기꺼이 무너지는 거대 석주 아래에 남아 어깨와 무기로 천장을 떠받친다!",
        "shortQuote": "이곳은 성채가 아니라 거대한 무덤이다!",
        "narration": "검은 성채의 내부 회랑은 지옥의 형상을 띠고 있었다. 천장에서는 불타는 유황 암석들이 우박처럼 쏟아져 내렸고, 바닥의 석판들은 거대한 지진에 갈라져 붉은 용암을 토해내고 있었다.",
        "speakerName": "가웨인",
        "speakerRole": "일곱 추적자 수장 · 맹인 음파 무인",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "quote": "이곳은 성채가 아니라 거대한 무덤이다! 루시안 놈은 처음부터 살아서 나갈 생각이 없었어! 자신의 파멸에 온 대륙을 끌어들이려는 것이다!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_34/scene_19.webp",
        "shortCaption": "‘대륙의 미래를 부탁한다, 우리의 자랑스러운 제자여!’ 스승들의 숭고한 외침을 등 뒤로 삼킨 채 카단은 피눈물을…",
        "shortQuote": "그림리 스승님! 안 됩니다! 기둥이 무너지면 빠져나올 수 없습니다!",
        "narration": "‘대륙의 미래를 부탁한다, 우리의 자랑스러운 제자여!’ 스승들의 숭고한 외침을 등 뒤로 삼킨 채 카단은 피눈물을 머금고 용암 회랑의 파멸마인 벨페고르를 뚫고 질주한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "그림리 스승님! 안 됩니다! 기둥이 무너지면 빠져나올 수 없습니다!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_34/scene_35.webp",
        "shortCaption": "‘대륙의 미래를 부탁한다, 우리의 자랑스러운 제자여!’ 스승들의 숭고한 외침을 등 뒤로 삼킨 채 카단은 피눈물을…",
        "shortQuote": "가웨인의 마지막 바람을 보아라, 카단! 제단으로 뛰어라!",
        "narration": "바람의 마도사 가웨인이 지팡이를 땅에 꽂으며 카단을 돌아보았다.",
        "speakerName": "가웨인",
        "speakerRole": "일곱 추적자 수장 · 맹인 음파 무인",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "quote": "가웨인의 마지막 바람을 보아라, 카단! 제단으로 뛰어라!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_34/scene_46.webp",
        "shortCaption": "무너지는 용암 회랑에서 스승들이 열어준 생명의 통로를 가로막는 파멸마인 벨페고르를 일소하라!",
        "shortQuote": "카단이 방패를 앞으로 겨누며 선언했다.",
        "narration": "무너지는 용암 회랑에서 스승들이 열어준 생명의 통로를 가로막는 파멸마인 벨페고르를 일소하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "루시안, 네놈의 시대는 끝났다. 여섯 스승들의 영혼과 이그니스의 맹세가 지금 네놈의 목을 벨 것이다."
      }
    ],
    "bossHeroClass": "SHAMAN",
    "bossNameKo": "파멸마인 벨페고르",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
    "bossHeroSpec": {
      "heroNameKo": "파멸마인 벨페고르",
      "titleKo": "제34화 보스 · 흑요석 결정술사 · 심연의 마인",
      "factionLabelKo": "흑요석 심연 군단 · 붕괴하는",
      "portraitUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
      "heroPowerNameKo": "용암 회랑 화염주술",
      "heroPowerTextKo": "무작위 주술 토템을 하나 소환합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
      "accentColor": "#c026d3",
      "frameGradient": "linear-gradient(180deg, #86198f 0%, #2e1065 100%)",
      "skyTop": "#2e1065",
      "skyMid": "#701a75",
      "skyBot": "#0f0720",
      "halo": "rgba(232, 121, 249, 0.55)",
      "emotesKo": {
        "greetings": "크하하! 나인섀도우 코덱스의 심연 결정 앞에 무릎 꿇어라!",
        "well_played": "미약한 인간치고는 내 외피에 흠집을 냈군.",
        "thanks": "네 고통이 흑요석 결정을 더욱 단단히 살찌운다!",
        "wow": "크헉?! 내 심연 갑주가 금이 가다니?!",
        "oops": "결정의 파편이 빗나갔군.",
        "threaten": "동료의 시체 위에서 절망하며 돌덩이로 굳어 죽어라!",
        "start": "미스트폴 절벽이 너희 일곱 추적자의 무덤이 될 것이다!",
        "concede": "크아아악! 죽은 동료의 넋이 검에 깃들다니... 심연으로 후퇴한다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 35,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "안개 속의 착각",
    "locationKo": "검은 성채 상층 ‘환영의 안개 회랑’",
    "oneLineKo": "다섯 개의 환영 분신 뒤에서 심장을 노리는 숙적 데스나이트 아르투스와 최후의 진검승부를 결판내라!",
    "novelEpisodeUrl": "/book?ep=35",
    "webtoonEpisodeUrl": "/webtoon?ep=35",
    "bookMdUrl": "/book/episode_35.md",
    "coverIllustrationUrl": "/images/webtoon/episode_35/scene_05.webp",
    "prevContextKo": "스승들의 헌신으로 상층부에 도달한 카단과 실리아를 기다리는 것은 스승들의 비명 환청으로 정신을 흔드는 ‘환영의 안개 회랑’이었다.",
    "synopsisKo": "슬픔의 틈을 노리고 안개 속에서 다섯 개의 분신으로 나뉜 숙적 데스나이트 아르투스의 흑요석 대검이 동시에 카단의 심장을 찌른다! 그러나 12살 폭우 동굴에서 배운 가웨인의 가르침을 기억한 카단은 환청을 차단하고 진짜 살기의 무게중심 단 하나를 간파해 아르투스의 마검을 두 동강 낸다.",
    "battleReasonKo": "다섯 개의 환영 분신 뒤에서 심장을 노리는 숙적 데스나이트 아르투스와 최후의 진검승부를 결판내라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "가웨인",
        "role": "일곱 추적자 수장 · 맹인 음파 무인",
        "cutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "side": "ALLY"
      },
      {
        "name": "데스나이트 아르투스",
        "role": "섀도우렐름 섭정 · 죽음의 기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_35/scene_05.webp",
        "shortCaption": "슬픔의 틈을 노리고 안개 속에서 다섯 개의 분신으로 나뉜 숙적 데스나이트 아르투스의 흑요석 대검이 동시에 카단의 심장을 찌른다!",
        "shortQuote": "귀를 막아라, 실리아.",
        "narration": "여섯 스승의 거룩한 희생으로 붕괴의 통로를 돌파한 카단과 실리아가 도달한 곳은 파멸의 제단 외곽을 둘러싸고 있는 거대한 공중 회랑, ‘환영의 안개 회랑’이었다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "귀를 막아라, 실리아. 안개 속에서 들려오는 목소리는 스승님들이 아니다. 적들이 우리의 슬픔을 파고들기 위해 펼쳐둔 비열한 환청이다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_35/scene_20.webp",
        "shortCaption": "12살 폭우 동굴에서 배운 가웨인의 가르침을 기억한 카단은 환청을 차단하고 진짜 살기의 무게중심 단 하나를…",
        "shortQuote": "스승들을 무덤에 묻고 온 가련한 고아들이여...",
        "narration": "아르투스의 갈라진 음성이 안개 전체에서 동시에 메아리쳤다.",
        "speakerName": "데스나이트 아르투스",
        "speakerRole": "섀도우렐름 섭정 · 죽음의 기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
        "quote": "스승들을 무덤에 묻고 온 가련한 고아들이여... 산 자는 결코 죽은 자들의 미로를 빠져나갈 수 없다. 네놈들의 헛된 신념도 이 안개 속에서 썩어 문드러질 것이다!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_35/scene_35.webp",
        "shortCaption": "12살 폭우 동굴에서 배운 가웨인의 가르침을 기억한 카단은 환청을 차단하고 진짜 살기의 무게중심 단 하나를…",
        "shortQuote": "너 역시 루시안의 탐욕에 희생된 꼭두각시였을 뿐이구나.",
        "narration": "실리아가 지팡이를 거두며 나지막이 말했다. 아르투스는 문을 닫아걸고 마지막 어둠 속으로 숨어들었다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "너 역시 루시안의 탐욕에 희생된 꼭두각시였을 뿐이구나."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_35/scene_47.webp",
        "shortCaption": "다섯 개의 환영 분신 뒤에서 심장을 노리는 숙적 데스나이트 아르투스와 최후의 진검승부를 결판내라!",
        "shortQuote": "실리아가 눈물을 닦아내고 결연한 미소를 지었다.",
        "narration": "다섯 개의 환영 분신 뒤에서 심장을 노리는 숙적 데스나이트 아르투스와 최후의 진검승부를 결판내라!",
        "speakerName": "실리아",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "더 이상 도망칠 곳은 없다, 루시안."
      }
    ],
    "bossHeroClass": "ROGUE",
    "bossNameKo": "숙적 데스나이트 아르투스",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
    "bossHeroSpec": {
      "heroNameKo": "숙적 데스나이트 아르투스",
      "titleKo": "제35화 보스 · 섀도우렐름 섭정 · 죽음의 기사",
      "factionLabelKo": "섀도우렐름 죽음기사단 · 검은",
      "portraitUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
      "heroPowerNameKo": "환영 분신 발도",
      "heroPowerTextKo": "1/2 단검을 장착합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
      "accentColor": "#818cf8",
      "frameGradient": "linear-gradient(180deg, #3730a3 0%, #0f172a 100%)",
      "skyTop": "#0f172a",
      "skyMid": "#312e81",
      "skyBot": "#020617",
      "halo": "rgba(129, 140, 248, 0.55)",
      "emotesKo": {
        "greetings": "산 자의 맹세 따위, 죽음의 서리 앞에서는 부질없다.",
        "well_played": "그 방패... 옛 아케 성기사단의 기운이 서려 있군.",
        "thanks": "네 망설임이 내 흑요석 대검의 먹잇감이다.",
        "wow": "내 필살의 참격을 정면으로 받아내다니...!",
        "oops": "검기가 한 치 어긋났군.",
        "threaten": "섀도우렐름의 차가운 어둠 속에 영원히 잠들어라!",
        "start": "흑요석 마검이여, 가로막는 모든 방패를 두 동강 내라!",
        "concede": "크윽... 부서지지 않는 신념이로군. 이 승부는 아직 끝나지 않았다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 36,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "십자 흉터의 지도",
    "locationKo": "검은 성채 최상층 ‘별빛의 기록실’",
    "oneLineKo": "별빛의 기록실 제단 통로를 봉쇄한 고위흑술사 간다르와 나인섀도우 마도사단을 격파하라!",
    "novelEpisodeUrl": "/book?ep=36",
    "webtoonEpisodeUrl": "/webtoon?ep=36",
    "bookMdUrl": "/book/episode_36.md",
    "coverIllustrationUrl": "/images/webtoon/episode_36/scene_04.webp",
    "prevContextKo": "환영 회랑을 넘어 도달한 별빛의 기록실 천장 아래에는 대륙 전체의 마나 맥동이 실시간으로 흐르는 거대한 고대 성도가 펼쳐져 있었다.",
    "synopsisKo": "실리아는 성도 위에 새겨진 선대 스승들의 암호를 해독해 북방의 눈꽃·대해의 바람·황실의 성화·대지의 방패 네 힘이 교차하는 십자 중심점이 바로 루시안의 파멸 제단임을 밝혀낸다! 같은 시각 성채 하층부에서는 북방의 정복왕 펜릴과 길가메시가 이끄는 백은 늑대 기병대가 당도해 승리의 뿔피리를 울린다.",
    "battleReasonKo": "별빛의 기록실 제단 통로를 봉쇄한 고위흑술사 간다르와 나인섀도우 마도사단을 격파하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "정복왕 펜릴",
        "role": "북방 백은 늑대 부족의 패왕",
        "cutoutUrl": "/anime-character-sheets/cutouts/081_Fenrir.png",
        "side": "ALLY"
      },
      {
        "name": "길가메시",
        "role": "펜릴의 아들 · 카단의 의형제",
        "cutoutUrl": "/anime-character-sheets/cutouts/047_Gilgamesh.png",
        "side": "ALLY"
      },
      {
        "name": "주술사 간다르",
        "role": "검은 늪의 저주와 도박장 지배자",
        "cutoutUrl": "/anime-character-sheets/cutouts/069_Gandar.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_36/scene_04.webp",
        "shortCaption": "실리아는 성도 위에 새겨진 선대 스승들의 암호를 해독해 북방의 눈꽃·대해의 바람·황실의 성화·대지의 방패 네…",
        "shortQuote": "이 성도는 단순한 지도가 아니에요.",
        "narration": "환영의 안개 회랑을 돌파한 카단과 실리아는 마침내 검은 성채의 최상층이자 제국의 모든 비밀이 봉인된 ‘별빛의 기록실’에 도달했다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이 성도는 단순한 지도가 아니에요. 대륙 전역에 흐르는 고대 마나의 맥동과 봉인된 룬의 위치가 실시간으로 빛나고 있어요. 하지만 지도의 중심부마다 검붉은 독기가 핏줄처럼 얽혀 있네요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_36/scene_18.webp",
        "shortCaption": "같은 시각 성채 하층부에서는 북방의 정복왕 펜릴과 길가메시가 이끄는 백은 늑대 기병대가 당도해 승리의 뿔피리를 울린다.",
        "shortQuote": "스승님께서는 결코 죽음을 두려워하지 않으셨다.",
        "narration": "카단은 눈시울을 붉히며 지도의 모서리를 조심스럽게 어루만졌다. 실리아가 조용히 다가와 카단의 굳은 손을 잡아주었다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "스승님께서는 결코 죽음을 두려워하지 않으셨다. 오직 등 뒤에 남겨진 아이들이 걸어갈 미래의 빛만을 걱정하셨지."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_36/scene_32.webp",
        "shortCaption": "같은 시각 성채 하층부에서는 북방의 정복왕 펜릴과 길가메시가 이끄는 백은 늑대 기병대가 당도해 승리의 뿔피리를 울린다.",
        "shortQuote": "카단이 굳게 주먹을 쥐며 말했다.",
        "narration": "같은 시각 성채 하층부에서는 북방의 정복왕 펜릴과 길가메시가 이끄는 백은 늑대 기병대가 당도해 승리의 뿔피리를 울린다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "펜릴 왕이 외곽을 맡아주었으니, 우리는 오직 루시안과의 일대일 결전에만 집중할 수 있다. 십자 흉터의 지도가 가리키는 파멸의 제단 중심부로 진격하자."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_36/scene_43.webp",
        "shortCaption": "별빛의 기록실 제단 통로를 봉쇄한 고위흑술사 간다르와 나인섀도우 마도사단을 격파하라!",
        "shortQuote": "카단이 부드럽게 미소 지으며 대답했다.",
        "narration": "별빛의 기록실 제단 통로를 봉쇄한 고위흑술사 간다르와 나인섀도우 마도사단을 격파하라!",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "우리의 신념이 대륙의 어둠을 밝힐 거예요."
      }
    ],
    "bossHeroClass": "MAGE",
    "bossNameKo": "고위흑술사 간다르",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/069_Gandar.png",
    "bossHeroSpec": {
      "heroNameKo": "고위흑술사 간다르",
      "titleKo": "제36화 보스 · 검은 늪의 저주와 도박장 지배자",
      "factionLabelKo": "검은 늪 사령·도박 결사 · 검은",
      "portraitUrl": "/anime-character-sheets/cutouts/069_Gandar.png",
      "heroPowerNameKo": "고위 비전 마탄",
      "heroPowerTextKo": "피해를 1 줍니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/069_Gandar.png",
      "accentColor": "#9333ea",
      "frameGradient": "linear-gradient(180deg, #7e22ce 0%, #2e1065 100%)",
      "skyTop": "#2e1065",
      "skyMid": "#6b21a8",
      "skyBot": "#120524",
      "halo": "rgba(192, 132, 252, 0.55)",
      "emotesKo": {
        "greetings": "키히히! 망자의 뼈와 사기 주사위 판에 발을 들인 걸 환영한다!",
        "well_played": "이, 이럴 수가! 주사위를 반으로 쪼개 눈금 13을 만들다니?!",
        "thanks": "키히히, 네 영혼도 판돈으로 얹어 주지!",
        "wow": "으아악! 내 필승의 저주 술식이 단검 한 자루에 박살 나다니!",
        "oops": "어라, 사령의 촛불이 흔들렸군!",
        "threaten": "비겁하다고 욕해 봐라! 이기면 그만인 어둠의 주술로 짓뭉개 주마!",
        "start": "어둠의 망령들과 저주의 패거리여, 저 건방진 영웅들을 물어뜯어라!",
        "concede": "키에에엑! 내 사령 제단과 도박장이 전부 무너지다니, 살려다오!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 37,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "패왕의 전쟁",
    "locationKo": "검은 성채 외곽 협곡 & 최상층 계단",
    "oneLineKo": "파멸의 제단 옥좌 홀 직전을 가로막는 루시안 친위 사령기사단장 아르투스를 돌파하라!",
    "novelEpisodeUrl": "/book?ep=37",
    "webtoonEpisodeUrl": "/webtoon?ep=37",
    "bookMdUrl": "/book/episode_37.md",
    "coverIllustrationUrl": "/images/webtoon/episode_37/scene_04.webp",
    "prevContextKo": "성채 아래 협곡에서는 북방 패왕 펜릴의 백은 늑대 기병대가 루시안의 최후 친위대 ‘사령 기사단’을 상대로 장엄한 전면전을 벌인다.",
    "synopsisKo": "‘알렉산다르의 아들이 꼭대기에서 싸우고 있다, 단 한 마리의 마수도 올려보내지 마라!’ 펜릴의 포효 속에 상층 계단을 오른 카단과 실리아는 이성을 잃고 조종당하는 기사들을 단 한 명의 부당한 살상도 없이 방패와 질풍만으로 무장 해체시키며 마침내 옥좌 홀 문 앞에 당도한다.",
    "battleReasonKo": "파멸의 제단 옥좌 홀 직전을 가로막는 루시안 친위 사령기사단장 아르투스를 돌파하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "정복왕 펜릴",
        "role": "북방 백은 늑대 부족의 패왕",
        "cutoutUrl": "/anime-character-sheets/cutouts/081_Fenrir.png",
        "side": "ALLY"
      },
      {
        "name": "데스나이트 아르투스",
        "role": "섀도우렐름 섭정 · 죽음의 기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_37/scene_04.webp",
        "shortCaption": "‘알렉산다르의 아들이 꼭대기에서 싸우고 있다, 단 한 마리의 마수도 올려보내지 마라!’ 펜릴의 포효 속에 상층…",
        "shortQuote": "펜릴 왕이 피 묻은 대검을 어깨에 걸머쥐며 포효했다.",
        "narration": "검은 성채의 하층부와 외곽 협곡에서는 북방의 패왕 펜릴이 이끄는 백은 늑대 기병대와 루시안의 마지막 친위 군단 ‘사령 기사단’ 사이의 처절한 격전이 벌어지고 있었다.",
        "speakerName": "펜릴",
        "speakerRole": "북방 백은 늑대 부족의 패왕",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/081_Fenrir.png",
        "quote": "북방의 사나이들이 피를 두려워할 줄 아느냐! 알렉산다르의 제자가 성채 꼭대기에서 싸우고 있다! 단 한 놈의 마수도 상층부로 올려보내지 마라!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_37/scene_18.webp",
        "shortCaption": "‘알렉산다르의 아들이 꼭대기에서 싸우고 있다, 단 한 마리의 마수도 올려보내지 마라!’ 펜릴의 포효 속에 상층…",
        "shortQuote": "저들은 이미 이성을 잃은 사령의 꼭두각시다. 망설임 없이 일격에 무력화시켜야 한다.",
        "narration": "카단이 방패의 무게중심을 낮추며 경고했다. 실리아가 바람의 장막을 펼치며 고개를 끄덕였다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "저들은 이미 이성을 잃은 사령의 꼭두각시다. 망설임 없이 일격에 무력화시켜야 한다."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_37/scene_33.webp",
        "shortCaption": "‘알렉산다르의 아들이 꼭대기에서 싸우고 있다, 단 한 마리의 마수도 올려보내지 마라!’ 펜릴의 포효 속에 상층…",
        "shortQuote": "그대의 방패는 진정...",
        "narration": "카르낙이 부러진 검을 내려놓으며 속삭였다. 카단이 고개를 끄덕이며 전사의 어깨를 다독였다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "그대의 방패는 진정... 대륙을 지탱할 산맥이로군... 루시안의 옥좌 뒤편에... 나인섀도우의 세 봉인이 숨겨져 있다... 부디 그 어둠을 부숴다오..."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_37/scene_44.webp",
        "shortCaption": "파멸의 제단 옥좌 홀 직전을 가로막는 루시안 친위 사령기사단장 아르투스를 돌파하라!",
        "shortQuote": "어둠의 밤을 끝내고 봄을 맞이할 시간이다.",
        "narration": "파멸의 제단 옥좌 홀 직전을 가로막는 루시안 친위 사령기사단장 아르투스를 돌파하라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "어둠의 밤을 끝내고 봄을 맞이할 시간이다."
      }
    ],
    "bossHeroClass": "PALADIN",
    "bossNameKo": "사령기사단장 아르투스",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
    "bossHeroSpec": {
      "heroNameKo": "사령기사단장 아르투스",
      "titleKo": "제37화 보스 · 섀도우렐름 섭정 · 죽음의 기사",
      "factionLabelKo": "섀도우렐름 죽음기사단 · 검은",
      "portraitUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
      "heroPowerNameKo": "사령 친위병 소환",
      "heroPowerTextKo": "1/1 수호병을 하나 소환합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
      "accentColor": "#818cf8",
      "frameGradient": "linear-gradient(180deg, #3730a3 0%, #0f172a 100%)",
      "skyTop": "#0f172a",
      "skyMid": "#312e81",
      "skyBot": "#020617",
      "halo": "rgba(129, 140, 248, 0.55)",
      "emotesKo": {
        "greetings": "산 자의 맹세 따위, 죽음의 서리 앞에서는 부질없다.",
        "well_played": "그 방패... 옛 아케 성기사단의 기운이 서려 있군.",
        "thanks": "네 망설임이 내 흑요석 대검의 먹잇감이다.",
        "wow": "내 필살의 참격을 정면으로 받아내다니...!",
        "oops": "검기가 한 치 어긋났군.",
        "threaten": "섀도우렐름의 차가운 어둠 속에 영원히 잠들어라!",
        "start": "흑요석 마검이여, 가로막는 모든 방패를 두 동강 내라!",
        "concede": "크윽... 부서지지 않는 신념이로군. 이 승부는 아직 끝나지 않았다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 38,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "세 개의 명주 봉인",
    "locationKo": "파멸의 제단 최정상 흑요석 옥좌 홀",
    "oneLineKo": "부모 세대와 이그니스, 스승들의 모든 염원을 담아 최종 보스 심연화신 루시안을 심판하라!",
    "novelEpisodeUrl": "/book?ep=38",
    "webtoonEpisodeUrl": "/webtoon?ep=38",
    "bookMdUrl": "/book/episode_38.md",
    "coverIllustrationUrl": "/images/webtoon/episode_38/scene_05.webp",
    "prevContextKo": "마침내 마주한 최정상 옥좌 홀—최고 재상 루시안은 인간의 형상을 완전히 버리고 심연의 군주 벨페고르의 마력을 삼켜 괴물로 변이해 있었다!",
    "synopsisKo": "대륙 전체를 심연으로 침몰시킬 ‘세 개의 명주 봉인’이 풀려나는 절체절명의 순간! 실리아의 녹옥 질풍이 첫 봉인을 찢고, 카단의 드래곤 브레이커 방패가 두 번째 봉인을 부수며, 마지막 세 번째 암흑 결계는 카단의 품속에서 타오른 이그니스의 ‘유리 불씨’가 은빛 단검과 공명해 찬란한 빛의 폭풍으로 『나인섀도우 코덱스』를 영원히 소멸시킨다!",
    "battleReasonKo": "부모 세대와 이그니스, 스승들의 모든 염원을 담아 최종 보스 심연화신 루시안을 심판하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "이그니스",
        "role": "발리안의 친아들 · 불꽃 궁정의 양자",
        "cutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "side": "ALLY"
      },
      {
        "name": "심연화신 루시안",
        "role": "벨페고르 융합 최종 재앙",
        "cutoutUrl": "/hs-assets/bosses/boss_abyss_lucian.webp",
        "side": "ENEMY"
      },
      {
        "name": "벨페고르",
        "role": "흑요석 결정술사 · 심연의 마인",
        "cutoutUrl": "/anime-character-sheets/cutouts/013_Belphegor.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_38/scene_05.webp",
        "shortCaption": "대륙 전체를 심연으로 침몰시킬 ‘세 개의 명주 봉인’이 풀려나는 절체절명의 순간!",
        "shortQuote": "크하하하! 기어코 내 옥좌 앞까지 기어 올라왔구나, 애송이 놈들! 하지만 너무…",
        "narration": "파멸의 제단 최정상 옥좌 홀은 핏빛 암흑 마나의 소용돌이로 가득 차 있었다. 홀 중앙의 흑요석 옥좌 위에는 최고 재상 루시안이 흉포한 모습으로 군림하고 있었다. 루시안은 이미 인간의 형상을 완전히 벗어던진 상태였다.",
        "speakerName": "루시안",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "크하하하! 기어코 내 옥좌 앞까지 기어 올라왔구나, 애송이 놈들! 하지만 너무 늦었다! 세 개의 명주 봉인이 풀려나면, 대륙 전체가 나인섀도우의 심연 속으로 영원히 가라앉을 것이다!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_38/scene_19.webp",
        "shortCaption": "실리아의 녹옥 질풍이 첫 봉인을 찢고, 카단의 드래곤 브레이커 방패가 두 번째 봉인을 부수며, 마지막 세 번째…",
        "shortQuote": "건방진 계집년이! 감히 내 첫 번째 봉인을 깨뜨리다니!",
        "narration": "실리아의 녹옥 질풍이 첫 봉인을 찢고, 카단의 드래곤 브레이커 방패가 두 번째 봉인을 부수며, 마지막 세 번째 암흑 결계는 카단의 품속에서 타오른 이그니스의 ‘유리 불씨’가 은빛 단검과 공명해 찬란한 빛의 폭풍으로 『나인섀도우 코덱스』를 영원히 소멸시킨다!",
        "speakerName": "루시안",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "건방진 계집년이! 감히 내 첫 번째 봉인을 깨뜨리다니!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_38/scene_35.webp",
        "shortCaption": "실리아의 녹옥 질풍이 첫 봉인을 찢고, 카단의 드래곤 브레이커 방패가 두 번째 봉인을 부수며, 마지막 세 번째…",
        "shortQuote": "내가 죽더라도 네놈들을 길동무로 삼겠다!",
        "narration": "루시안이 피를 토하며 마지막 세 번째 명주 봉인을 가슴에 찔러 넣었다.",
        "speakerName": "루시안",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "내가 죽더라도 네놈들을 길동무로 삼겠다! 심연의 군주 벨페고르여, 내 영혼을 바치니 저놈들을 영원한 지옥으로 끌고 가라!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_38/scene_46.webp",
        "shortCaption": "부모 세대와 이그니스, 스승들의 모든 염원을 담아 최종 보스 심연화신 루시안을 심판하라!",
        "shortQuote": "카단이 폭주하는 루시안의 마나 폭풍을 향해 쐐기처럼 돌진했다.",
        "narration": "부모 세대와 이그니스, 스승들의 모든 염원을 담아 최종 보스 심연화신 루시안을 심판하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "우리가 지켜낸 생명의 이름으로, 어둠의 심장을 꿰뚫는다!"
      }
    ],
    "bossHeroClass": "WARLOCK",
    "bossNameKo": "심연화신 루시안",
    "bossCutoutUrl": "/hs-assets/bosses/boss_abyss_lucian.webp",
    "bossHeroSpec": {
      "heroNameKo": "심연화신 루시안",
      "titleKo": "제38화 보스 · 벨페고르 융합 최종 재앙",
      "factionLabelKo": "벨페고르 융합 · 최후의 재앙 · 파멸의",
      "portraitUrl": "/hs-assets/bosses/boss_abyss_lucian.webp",
      "heroPowerNameKo": "심연 봉인 폭주",
      "heroPowerTextKo": "카드를 1장 뽑고 내 영웅에게 피해를 2 줍니다.",
      "heroPowerIconUrl": "/hs-assets/bosses/boss_abyss_lucian.webp",
      "accentColor": "#e11d48",
      "frameGradient": "linear-gradient(180deg, #9f1239 0%, #3b0764 55%, #090514 100%)",
      "skyTop": "#3b0764",
      "skyMid": "#be123c",
      "skyBot": "#090514",
      "halo": "rgba(244, 63, 94, 0.72)",
      "emotesKo": {
        "greetings": "크하하하!! 인간의 육신을 넘어 나는 마침내 심연의 신이 되었다!!",
        "well_played": "건방진 알렉산다르의 자식!! 그 따위 방패로 신을 막겠다는 거냐!",
        "thanks": "세 개의 명주 봉인이 열릴수록 대륙 전체가 내 발아래 침몰한다!",
        "wow": "말도 안 돼!! 죽은 이그니스의 유리 불씨가 은빛 단검과 공명하고 있어?!",
        "oops": "심연의 마력이 폭주하는군...!",
        "threaten": "나인섀도우 코덱스의 칠흑 폭풍으로 이 세상 모든 빛을 지워버리마!!",
        "start": "최후의 심판이다, 카단! 부모와 스승, 형제의 뒤를 따라 심연으로 떨어져라!!",
        "concede": "크아아아악!! 내 코덱스와 심연의 권능이 소멸한다니... 제, 제발 목숨만은 살려다오...!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 39,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "지킬 만한 가치가 있는 세상",
    "locationKo": "새벽빛이 내리는 파멸의 제단 정상",
    "oneLineKo": "전쟁의 마지막 망령으로 일어난 고대 죽음기사 아르투스에게 참된 기사의 안식을 선사하고 새벽을 완성하라!",
    "novelEpisodeUrl": "/book?ep=39",
    "webtoonEpisodeUrl": "/webtoon?ep=39",
    "bookMdUrl": "/book/episode_39.md",
    "coverIllustrationUrl": "/images/webtoon/episode_39/scene_05.webp",
    "prevContextKo": "세 개의 명주 봉인이 박살 나고 칠흑 같던 먹구름이 걷히며 동쪽 대해 수평선 너머로 황금빛 새벽 햇살이 대륙을 비추기 시작한다.",
    "synopsisKo": "그러나 무너진 옥좌 뒤편에서 마지막 망념에 사로잡힌 고대 죽음의 기사가 부러진 대검을 끌며 일어난다. 카단은 증오 대신 기사의 안식을 빌어주는 정결한 방패술로 마지막 어둠을 잠재워 무릎 꿇리고, 바닥을 기며 목숨을 구걸하는 루시안을 사적 복수 대신 역사와 법의 심판대에 넘긴다.",
    "battleReasonKo": "전쟁의 마지막 망령으로 일어난 고대 죽음기사 아르투스에게 참된 기사의 안식을 선사하고 새벽을 완성하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "데스나이트 아르투스",
        "role": "섀도우렐름 섭정 · 죽음의 기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_39/scene_05.webp",
        "shortCaption": "무너진 옥좌 뒤편에서 마지막 망념에 사로잡힌 고대 죽음의 기사가 부러진 대검을 끌며 일어난다.",
        "shortQuote": "아르투스가 갈라진 음성으로 중얼거렸다.",
        "narration": "세 개의 명주 봉인이 모두 산산조각 나며 나인섀도우 코덱스의 어둠이 걷혀 나가자, 파멸의 제단에는 차가운 새벽바람이 들이치기 시작했다. 그러나 무너진 옥좌 뒤편의 어둠 속에서, 부러진 갑주를 끌며 마지막 죽음의 기사 아르투스가 비틀거리며 걸어 나왔다.",
        "speakerName": "데스나이트 아르투스",
        "speakerRole": "섀도우렐름 섭정 · 죽음의 기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
        "quote": "기사의... 맹세는... 어둠 속에서도... 결코 더럽혀지지... 않았다..."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_39/scene_20.webp",
        "shortCaption": "바닥을 기며 목숨을 구걸하는 루시안을 사적 복수 대신 역사와 법의 심판대에 넘긴다.",
        "shortQuote": "고맙다... 알렉산다르의 아이여... 네 방패가... 나를 구원하였구나...…",
        "narration": "아르투스는 무릎을 꿇은 채 눈물을 흘리며 카단의 손을 잡았다. 노기사의 영혼은 평온한 미소를 머금은 채 아침 햇살 속으로 승화되었다.",
        "speakerName": "데스나이트 아르투스",
        "speakerRole": "섀도우렐름 섭정 · 죽음의 기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
        "quote": "고맙다... 알렉산다르의 아이여... 네 방패가... 나를 구원하였구나... 이제 발리안 경과 알렉산다르 경을 뵈러 갈 수 있겠어..."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_39/scene_36.webp",
        "shortCaption": "바닥을 기며 목숨을 구걸하는 루시안을 사적 복수 대신 역사와 법의 심판대에 넘긴다.",
        "shortQuote": "보고 있는가, 이그니스. 스승님, 숙부님... 우리가 마침내 약속을 지켜냈습니다.",
        "narration": "유리 불씨 속의 순백 화염이 햇살과 어우러지며, 마치 이그니스가 환하게 미소 짓는 듯 눈부신 빛의 파문을 일으켰다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "보고 있는가, 이그니스. 스승님, 숙부님... 우리가 마침내 약속을 지켜냈습니다."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_39/scene_48.webp",
        "shortCaption": "전쟁의 마지막 망령으로 일어난 고대 죽음기사 아르투스에게 참된 기사의 안식을 선사하고 새벽을 완성하라!",
        "shortQuote": "카단이 방패를 거두며 고개를 끄덕였다.",
        "narration": "전쟁의 마지막 망령으로 일어난 고대 죽음기사 아르투스에게 참된 기사의 안식을 선사하고 새벽을 완성하라!",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "우리가 지켜낸 세상이에요. 이제 모든 상처를 보듬고 새로운 이야기를 시작해요."
      }
    ],
    "bossHeroClass": "PRIEST",
    "bossNameKo": "망념의 죽음기사 아르투스",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
    "bossHeroSpec": {
      "heroNameKo": "망념의 죽음기사 아르투스",
      "titleKo": "제39화 보스 · 섀도우렐름 섭정 · 죽음의 기사",
      "factionLabelKo": "섀도우렐름 죽음기사단 · 새벽빛이",
      "portraitUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
      "heroPowerNameKo": "망령의 재생",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
      "accentColor": "#818cf8",
      "frameGradient": "linear-gradient(180deg, #3730a3 0%, #0f172a 100%)",
      "skyTop": "#0f172a",
      "skyMid": "#312e81",
      "skyBot": "#020617",
      "halo": "rgba(129, 140, 248, 0.55)",
      "emotesKo": {
        "greetings": "산 자의 맹세 따위, 죽음의 서리 앞에서는 부질없다.",
        "well_played": "그 방패... 옛 아케 성기사단의 기운이 서려 있군.",
        "thanks": "네 망설임이 내 흑요석 대검의 먹잇감이다.",
        "wow": "내 필살의 참격을 정면으로 받아내다니...!",
        "oops": "검기가 한 치 어긋났군.",
        "threaten": "섀도우렐름의 차가운 어둠 속에 영원히 잠들어라!",
        "start": "흑요석 마검이여, 가로막는 모든 방패를 두 동강 내라!",
        "concede": "크윽... 부서지지 않는 신념이로군. 이 승부는 아직 끝나지 않았다!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  },
  {
    "episode": 40,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "영웅이라 불리지 않는 자",
    "locationKo": "재건된 수도 라이트헤븐 & 엘윈 설원 보리밭 오두막",
    "oneLineKo": "대단원의 피날레—성기사 헤르쿨 및 모든 전우들과 함께 평화의 새벽을 여는 영광의 기념 수련전에서 승리하라!",
    "novelEpisodeUrl": "/book?ep=40",
    "webtoonEpisodeUrl": "/webtoon?ep=40",
    "bookMdUrl": "/book/episode_40.md",
    "coverIllustrationUrl": "/images/webtoon/episode_40/scene_05.webp",
    "prevContextKo": "전쟁이 끝나고 한 달 뒤, 평화를 되찾은 수도 라이트헤븐 광장에 수만 명의 백성이 구국의 영웅을 맞이하기 위해 운집한다.",
    "synopsisKo": "황실은 대륙 최고 원수의 직위와 공작 작위, 무수한 황금을 내리려 하지만, 카단과 실리아는 모든 권력과 영예를 조용히 사양한다. 두 사람은 전쟁 전 어머니 엘윈이 차가운 설원에 심었던 밀밭으로 돌아가, 전설의 방패를 오두막 지붕 삼아 흙을 일구고 다친 길손을 맞이하는 따뜻하고 평범한 ‘사람’으로서의 새로운 삶을 시작한다. (40화 완주 시 다음 차원 ‘환생’ 개방!)",
    "battleReasonKo": "대단원의 피날레—성기사 헤르쿨 및 모든 전우들과 함께 평화의 새벽을 여는 영광의 기념 수련전에서 승리하라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "실리아",
        "role": "바람섬의 왕녀 · 천재 지략가",
        "cutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "side": "ALLY"
      },
      {
        "name": "국왕 에올루스",
        "role": "바람 속삭임 섬의 왕 · 실리아의 외조부",
        "cutoutUrl": "/anime-character-sheets/cutouts/025_Aeolus.png",
        "side": "ALLY"
      },
      {
        "name": "정복왕 펜릴",
        "role": "북방 백은 늑대 부족의 패왕",
        "cutoutUrl": "/anime-character-sheets/cutouts/081_Fenrir.png",
        "side": "ALLY"
      },
      {
        "name": "헤르쿨",
        "role": "은빛 단검을 전한 순례 성기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
        "side": "ENEMY"
      },
      {
        "name": "알렉산다르",
        "role": "카단의 아버지 · 옛 아케 성기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/050_Aleksandar.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_40/scene_05.webp",
        "shortCaption": "황실은 대륙 최고 원수의 직위와 공작 작위, 무수한 황금을 내리려 하지만, 카단과 실리아는 모든 권력과 영예를 조용히 사양한다.",
        "shortQuote": "카단 대원수 만세! 실리아 황후 전하 만세!",
        "narration": "전쟁이 끝나고 한 달이 지난 수도 라이트헤이븐은 평화로운 활기를 완전히 되찾아가고 있었다. 불타버렸던 세븐브리지 항구의 부두들은 드워프 장인들과 어부들의 협동으로 새롭게 재건되었고, 꽃배 선단이 실어 나른 수많은 구호 식량과 약초들이 거리마다 가득했다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "카단 대원수 만세! 실리아 황후 전하 만세!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_40/scene_19.webp",
        "shortCaption": "전설의 방패를 오두막 지붕 삼아 흙을 일구고 다친 길손을 맞이하는 따뜻하고 평범한 ‘사람’으로서의 새로운 삶을 시작한다.",
        "shortQuote": "방패는 권좌를 지키기 위해 든 것이 아니라, 추위에 떠는 어린아이들의 손을…",
        "narration": "두 사람은 전쟁 전 어머니 엘윈이 차가운 설원에 심었던 밀밭으로 돌아가, 전설의 방패를 오두막 지붕 삼아 흙을 일구고 다친 길손을 맞이하는 따뜻하고 평범한 ‘사람’으로서의 새로운 삶을 시작한다",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "방패는 권좌를 지키기 위해 든 것이 아니라, 추위에 떠는 어린아이들의 손을 잡아주기 위해 들었던 것입니다. 제 자리는 궁정이 아니라 흙냄새 나는 고향의 대지 위입니다."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_40/scene_35.webp",
        "shortCaption": ".",
        "shortQuote": "그래, 실리아. 겨울은 길었지만, 봄은 결코 길을 잃지 않았다.",
        "narration": "펜릴 왕이 카단의 잔을 채워주며 껄껄 웃었다. 론돌 역시 턱수염을 쓸며 고개를 끄덕였다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "북방의 설원으로 돌아가거든 내 언제든 사냥한 멧돼지 다리를 짊어지고 네 오두막을 찾아가마. 알렉산다르 형제의 무덤에 좋은 북방주를 부어주어야지."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_40/scene_46.webp",
        "shortCaption": "대단원의 피날레—성기사 헤르쿨 및 모든 전우들과 함께 평화의 새벽을 여는 영광의 기념 수련전에서 승리하라!",
        "shortQuote": "스승님, 아버지... 그리고 이그니스. 약속대로 이 땅에 봄을 데려왔습니다.…",
        "narration": "대단원의 피날레—성기사 헤르쿨 및 모든 전우들과 함께 평화의 새벽을 여는 영광의 기념 수련전에서 승리하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "스승님, 아버지... 그리고 이그니스. 약속대로 이 땅에 봄을 데려왔습니다. 이제 이곳에서 흙을 일구고, 다친 길손들의 발을 씻겨주며 살아가겠습니다."
      }
    ],
    "bossHeroClass": "PALADIN",
    "bossNameKo": "성기사 헤르쿨",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
    "bossHeroSpec": {
      "heroNameKo": "성기사 헤르쿨",
      "titleKo": "제40화 보스 · 은빛 단검을 전한 순례 성기사",
      "factionLabelKo": "평화의 새벽 기념 수련전 · 재건된",
      "portraitUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
      "heroPowerNameKo": "성기사 수련병 소집",
      "heroPowerTextKo": "1/1 수호병을 하나 소환합니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
      "accentColor": "#facc15",
      "frameGradient": "linear-gradient(180deg, #eab308 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#ca8a04",
      "skyBot": "#0f172a",
      "halo": "rgba(253, 224, 71, 0.6)",
      "emotesKo": {
        "greetings": "장하구나, 카단, 실리아! 하늘의 알렉산다르와 발리안도 미소 짓고 있을 게다!",
        "well_played": "오오! 이제 나조차 감당하기 벅찰 만큼 완벽한 수호의 방패로구나!",
        "thanks": "고맙다. 너희가 대륙의 새벽을 지켜주었어.",
        "wow": "별빛 호흡과 녹옥 질풍의 조화가 실로 눈부시구나!",
        "oops": "하하, 노병의 팔이 조금 무뎌졌나 보구나!",
        "threaten": "자, 엘윈 보리밭으로 떠나기 전 마지막 기념 대련이다! 전력을 다해 오너라!",
        "start": "평화의 시대를 여는 영광의 기념 수련전을 시작한다! 마음껏 기량을 펼쳐라!",
        "concede": "완패다, 카단! 이제 무거운 갑옷을 벗고 네가 꿈꾸던 따뜻한 보리밭으로 돌아가거라!"
      }
    },
    "playerHeroSpec": {
      "heroNameKo": "엘윈의 방패 카단",
      "titleKo": "엘윈마을 설원의 눈히어로",
      "factionLabelKo": "눈히어로 동맹",
      "portraitUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "heroPowerNameKo": "설원의 치유",
      "heroPowerTextKo": "생명력을 2 회복시킵니다.",
      "heroPowerIconUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
      "accentColor": "#60a5fa",
      "frameGradient": "linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)",
      "skyTop": "#1e3a8a",
      "skyMid": "#2563eb",
      "skyBot": "#0f172a",
      "halo": "rgba(96, 165, 250, 0.55)",
      "emotesKo": {
        "greetings": "엘윈마을의 이름으로 인사드립니다!",
        "well_played": "정말 훌륭한 한 수였어요!",
        "thanks": "고맙습니다, 동료여.",
        "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
        "oops": "앗, 성급한 판단이었네요.",
        "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
        "start": "부모님과 스승님들의 뜻을 이어, 이 전장을 수호하겠습니다!",
        "concede": "아직 쓰러질 수 없습니다... 방패를 고쳐 쥐고 다시 일어서겠습니다!"
      }
    }
  }
];

export function getJourneyEpisodeDef(episode: number): KadanJourneyEpisodeDef {
  const safeIdx = Math.max(1, Math.min(40, Math.floor(episode || 1))) - 1;
  return KADAN_JOURNEY_EPISODES[safeIdx] || KADAN_JOURNEY_EPISODES[0];
}

export interface JourneyDifficultySpec {
  enemyHeroHealth: number;
  enemyStatScale: number;
  recommendedMultiplier: number;
  aiDifficulty: 'NORMAL' | 'EXPERT';
  boardTheme: BoardThemeId;
  expectedWinGold: number;
  isBossMilestone: boolean;
}

/**
 * 회차(1~40화) 및 환생(0, 1, 2...) 진행에 따른 상대 덱 난이도 곡선:
 * - 1~2화: 입문자가 기본 1배 덱으로도 첫 자동플레이 승리를 맛볼 수 있는 완만한 시작
 * - 3~5화부터: 적 생명력과 하수인/무기 공격력·체력 배율이 본격 상승하여,
 *   카드팩 개봉 및 골드/보급소 구매를 통한 3장(×3배) 중첩 업그레이드 없이는 돌파가 불가능해짐!
 * - 환생 반복 시: 매 환생마다 적 생명력과 스탯 배율이 비약적으로 상승.
 */
export function getJourneyDifficultySpec(
  episode: number,
  reincarnation: number,
): JourneyDifficultySpec {
  const ep = Math.max(1, Math.min(40, Math.floor(episode || 1)));
  const reinc = Math.max(0, Math.floor(reincarnation || 0));

  let baseHp = 20;
  let baseScale = 0.85;

  if (ep === 1) {
    baseHp = 20;
    baseScale = 0.85;
  } else if (ep === 2) {
    baseHp = 26;
    baseScale = 1.05;
  } else if (ep === 3) {
    baseHp = 38;
    baseScale = 1.65;
  } else if (ep <= 10) {
    baseHp = 38 + (ep - 3) * 5; // 38 -> 73
    baseScale = 1.65 + (ep - 3) * 0.22; // 1.65 -> 3.19
  } else if (ep <= 25) {
    baseHp = 73 + (ep - 10) * 4; // 73 -> 133
    baseScale = 3.2 + (ep - 10) * 0.16; // 3.2 -> 5.6
  } else {
    baseHp = 133 + (ep - 25) * 5; // 133 -> 208
    baseScale = 5.6 + (ep - 25) * 0.22; // 5.6 -> 8.9
  }

  if (ep % 5 === 0) {
    baseHp = Math.round(baseHp * 1.15);
    baseScale = Number((baseScale * 1.12).toFixed(2));
  }

  const reincHpFactor = 1 + reinc * 0.9;
  const reincScaleAdd = reinc * 2.6;

  const enemyHeroHealth = Math.round(baseHp * reincHpFactor);
  const enemyStatScale = Number((baseScale + reincScaleAdd).toFixed(2));
  const recommendedMultiplier = Math.max(1, Math.ceil(enemyStatScale * 0.9));

  const themes: BoardThemeId[] = ['STORMWIND', 'ORGRIMMAR', 'PANDARIA'];
  const boardTheme = themes[(ep - 1) % themes.length];
  const expectedWinGold = 40 + ep * 5 + reinc * 35;

  return {
    enemyHeroHealth,
    enemyStatScale,
    recommendedMultiplier,
    aiDifficulty: ep >= 3 || reinc > 0 ? 'EXPERT' : 'NORMAL',
    boardTheme,
    expectedWinGold,
    isBossMilestone: ep % 5 === 0,
  };
}

/**
 * 카단의 여정 전용 플레이어 덱 자동 구성:
 * - 보유한 모든 카드(종족 제한 없음)가 골고루 등장하도록 보유 카드 전체 풀에서 균등 셔플 편성
 * - 3장 이상 보유한 하수인·무기 카드는 보유 장수 배수(3장=3배, N장=N배)를 메타데이터에 기록
 */
export function buildJourneyPlayerDeckAndMultipliers(col: CollectionMap): {
  deckCards: string[];
  playerCardMultipliers: Record<string, number>;
  boostedCardCount: number;
  maxMultiplier: number;
  totalOwnedUnique: number;
} {
  const allCollectible = cardDb.getAllCollectible();
  const ownedCards = allCollectible.filter((c) => (col[c.id] || 0) > 0);
  const playerCardMultipliers: Record<string, number> = {};
  let boostedCardCount = 0;
  let maxMultiplier = 1;

  for (const card of ownedCards) {
    const cnt = col[card.id] || 0;
    const mult = getJourneyCardMultiplier(card, cnt);
    if (mult > 1) {
      playerCardMultipliers[card.id] = mult;
      boostedCardCount += 1;
      if (mult > maxMultiplier) maxMultiplier = mult;
    }
  }

  const poolIds = ownedCards.map((c) => c.id);
  for (let i = poolIds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [poolIds[i], poolIds[j]] = [poolIds[j], poolIds[i]];
  }

  const lowCurve = poolIds.filter((id) => (cardDb.getCard(id)?.cost ?? 3) <= 3);
  const midCurve = poolIds.filter((id) => {
    const cost = cardDb.getCard(id)?.cost ?? 3;
    return cost >= 4 && cost <= 5;
  });
  const highCurve = poolIds.filter((id) => (cardDb.getCard(id)?.cost ?? 3) >= 6);

  const deckCards: string[] = [];
  const takeEvenly = (arr: string[], target: number) => {
    for (let i = 0; i < arr.length && deckCards.length < target; i += 1) {
      deckCards.push(arr[i]);
    }
  };

  takeEvenly(lowCurve, 16);
  takeEvenly(midCurve, 28);
  takeEvenly(highCurve, 36);

  let safetyIdx = 0;
  while (deckCards.length < 30 && poolIds.length > 0) {
    deckCards.push(poolIds[safetyIdx % poolIds.length]);
    safetyIdx += 1;
  }

  return {
    deckCards,
    playerCardMultipliers,
    boostedCardCount,
    maxMultiplier,
    totalOwnedUnique: ownedCards.length,
  };
}

/**
 * 회차 및 환생 난이도에 맞춰 적 보스의 덱 또한 해당 보스 종족과 등급에 걸맞은 정예 카드들로 편성됨
 */
export function buildJourneyBossDeck(
  bossClass: HeroClass,
  episode: number,
  reincarnation: number,
): string[] {
  const preset = CLASSIC_PRESET_DECKS.find((d) => d.heroClass === bossClass);
  const baseDeck = preset ? [...preset.cards] : [...CLASSIC_PRESET_DECKS[0].cards];

  if (episode <= 2 && reincarnation === 0) {
    return baseDeck;
  }

  const allCards = cardDb.getAllCollectible();
  const classElite = allCards.filter(
    (c) =>
      c.cardClass === bossClass &&
      hasCombatStatsForJourney(c),
  );
  const neutralElite = allCards.filter(
    (c) =>
      c.cardClass === 'NEUTRAL' &&
      hasCombatStatsForJourney(c) &&
      (episode >= 12 || reincarnation > 0
        ? c.rarity === 'RARE' || c.rarity === 'EPIC' || c.rarity === 'LEGENDARY'
        : c.rarity === 'COMMON' || c.rarity === 'RARE' || c.rarity === 'EPIC'),
  );
  const elitePool = [...classElite, ...classElite, ...neutralElite];

  if (elitePool.length === 0) return baseDeck;

  const replaceCount = Math.min(22, Math.floor((episode - 1) * 0.55) + reincarnation * 8);
  const upgraded = [...baseDeck];
  for (let i = 0; i < replaceCount; i += 1) {
    const pick = elitePool[(episode * 7 + i * 13 + reincarnation * 19) % elitePool.length];
    upgraded[i % upgraded.length] = pick.id;
  }
  return upgraded;
}
