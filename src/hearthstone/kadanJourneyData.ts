import { CLASSIC_PRESET_DECKS, cardDb } from './cardDb';
import { CollectionMap, getJourneyCardMultiplier, hasCombatStatsForJourney } from './storage';
import { BoardThemeId, HeroClass, JourneyBattleMeta } from './types';

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
}

export const KADAN_JOURNEY_EPISODES: KadanJourneyEpisodeDef[] = [
  {
    "episode": 1,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "눈보라 아래 두 서약",
    "locationKo": "엘윈 마을 통나무 주막 & 외나무다리",
    "oneLineKo": "만삭의 아내 엘윈이 북방 설원으로 무사히 탈출할 수 있도록, 불타는 외나무다리 위에서 루시안의 궁정 토벌대를 막아내야 한다!",
    "novelEpisodeUrl": "/book?ep=1",
    "webtoonEpisodeUrl": "/webtoon?ep=1",
    "bookMdUrl": "/book/episode_01.md",
    "coverIllustrationUrl": "/images/webtoon/episode_01/scene_05.webp",
    "prevContextKo": "패전국의 변방 설원 엘윈 마을에서 옛 성기사 알렉산다르와 발리안은 신분을 숨긴 채 새 생명의 탄생을 기다린다.",
    "synopsisKo": "순례 성기사 헤르쿨이 찾아와 곧 태어날 두 아이(카단·이그니스)를 위한 은빛 단검을 건넨다. 그러나 사흘 뒤 궁정 귀족 루시안이 만삭의 엘윈을 탐내 마을을 반역죄로 모함하여 토벌대를 이끌고 습격한다. 알렉산다르는 아내와 뱃속의 카단을 피신시키기 위해 외나무다리 위에서 홀로 최후의 결전을 벌인다.",
    "battleReasonKo": "만삭의 아내 엘윈이 북방 설원으로 무사히 탈출할 수 있도록, 불타는 외나무다리 위에서 루시안의 궁정 토벌대를 막아내야 한다!",
    "cast": [
      {
        "name": "알렉산다르",
        "role": "카단의 아버지 · 옛 아케 성기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/050_Aleksandar.png",
        "side": "ALLY"
      },
      {
        "name": "발리안",
        "role": "이그니스의 친아버지 · 아케 창술사",
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
        "speakerRole": "이그니스의 친아버지 · 아케 창술사",
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
        "speakerRole": "이그니스의 친아버지 · 아케 창술사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/043_Balian.png",
        "quote": "손대지 마라, 이 비겁한 악마야!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_01/scene_45.webp",
        "shortCaption": "만삭의 아내 엘윈이 북방 설원으로 무사히 탈출할 수 있도록, 불타는 외나무다리 위에서 루시안의 궁정 토벌대를 막아내야 한다!",
        "shortQuote": "언젠가 누군가는 이 땅에서 다시 따뜻한 빵을 구워야 하니까요.",
        "narration": "만삭의 아내 엘윈이 북방 설원으로 무사히 탈출할 수 있도록, 불타는 외나무다리 위에서 루시안의 궁정 토벌대를 막아내야 한다!",
        "speakerName": "엘윈",
        "speakerRole": "카단의 아버지 · 옛 아케 성기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/050_Aleksandar.png",
        "quote": "다만 어떤 불의와 거짓 앞에서도 비겁하게 고개를 숙이지 않는 사람으로 자라다오."
      }
    ],
    "bossHeroClass": "ROGUE",
    "bossNameKo": "야심가 루시안의 토벌대",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png"
  },
  {
    "episode": 2,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "일곱 추적자의 맹세",
    "locationKo": "세븐브리지 항구 어시장 골목",
    "oneLineKo": "오해로 부딪친 세븐브리지의 일곱 추적자들과 정정당당히 무예를 겨루어 진정한 성기사의 신의를 증명하라!",
    "novelEpisodeUrl": "/book?ep=2",
    "webtoonEpisodeUrl": "/webtoon?ep=2",
    "bookMdUrl": "/book/episode_02.md",
    "coverIllustrationUrl": "/images/webtoon/episode_02/scene_04.webp",
    "prevContextKo": "엘윈 마을이 불타고 알렉산다르가 산화한 뒤, 뒤늦게 잿더미에 도착한 헤르쿨은 루시안의 왕실 병기 파편을 수습해 남쪽 항구로 향한다.",
    "synopsisKo": "노예선에 끌려가던 전쟁고아들을 추적하던 헤르쿨은 부둣가에서 변방의 일곱 의인(가웨인·그림리·에일라·엘리아나·카제·론돌·로비냐드)과 궁정 첩자로 서로 오해해 격돌한다. 소녀의 증언으로 오해를 푼 뒤, 일곱 추적자는 북방에서 카단을, 헤르쿨은 남방에서 이그니스를 찾아 기르고 18년 뒤 별취한 종탑에서 재회하기로 피의 맹세를 맺는다.",
    "battleReasonKo": "오해로 부딪친 세븐브리지의 일곱 추적자들과 정정당당히 무예를 겨루어 진정한 성기사의 신의를 증명하라!",
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
        "shortCaption": "오해로 부딪친 세븐브리지의 일곱 추적자들과 정정당당히 무예를 겨루어 진정한 성기사의 신의를 증명하라!",
        "shortQuote": "누구의 가르침이 더 올곧게 세상의 불의를 갈랐는지 무인의 결투로 확인하는 것이 어떻겠소?",
        "narration": "오해로 부딪친 세븐브리지의 일곱 추적자들과 정정당당히 무예를 겨루어 진정한 성기사의 신의를 증명하라!",
        "speakerName": "가웨인",
        "speakerRole": "은빛 단검을 전한 순례 성기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
        "quote": "좋소! 승패를 떠나, 두 아이가 부모의 숭고한 뜻을 이어받아 이 썩어빠진 대륙을 구할 진정한 등불이 되었음을 증명하는 의식이 될 것이오!"
      }
    ],
    "bossHeroClass": "WARLOCK",
    "bossNameKo": "세븐브리지 일곱 추적자",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png"
  },
  {
    "episode": 3,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "안개 절벽의 피",
    "locationKo": "미스트폴 절벽 고대 타이탄 폐신전",
    "oneLineKo": "동료 로비냐드의 숭고한 희생을 헛되이 하지 않기 위해, 흑요석 결정 괴인 벨페고르와 암흑 마녀 고르고를 처단하라!",
    "novelEpisodeUrl": "/book?ep=3",
    "webtoonEpisodeUrl": "/webtoon?ep=3",
    "bookMdUrl": "/book/episode_03.md",
    "coverIllustrationUrl": "/images/webtoon/episode_03/scene_05.webp",
    "prevContextKo": "알렉산다르의 아들을 찾아 북방으로 떠난 일곱 추적자는 칠흑 같은 흑암 안개가 깔린 미스트폴 절벽에 발이 묶인다.",
    "synopsisKo": "금지된 마도서 『나인섀도우 코덱스』를 훔쳐 달아난 파문 마도사 메두사 고르고와 흑요석 괴인 벨페고르가 폐신전 천장을 부수고 일행을 기습한다. 독안개와 그림자 봉쇄 속 절체절명의 위기에서 곡예사 로비냐드가 몸을 던져 벨페고르를 붙잡고 산화하며, 남은 여섯 스승은 눈물 속에 하나의 심장으로 합을 맞춰 괴물을 격퇴한다.",
    "battleReasonKo": "동료 로비냐드의 숭고한 희생을 헛되이 하지 않기 위해, 흑요석 결정 괴인 벨페고르와 암흑 마녀 고르고를 처단하라!",
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
        "shortCaption": "동료 로비냐드의 숭고한 희생을 헛되이 하지 않기 위해, 흑요석 결정 괴인 벨페고르와 암흑 마녀 고르고를 처단하라!",
        "shortQuote": "로비냐드는 조용히 미소를 머금은 채 차가운 절벽 바람 속에서 숨을 거두었다.",
        "narration": "동료 로비냐드의 숭고한 희생을 헛되이 하지 않기 위해, 흑요석 결정 괴인 벨페고르와 암흑 마녀 고르고를 처단하라!",
        "speakerName": "엘리아나",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "우리는 이제 일곱이 아니라 여섯이다. 그러나 로비냐드의 영혼은 영원히 우리 호흡 속에 살아 숨 쉴 것이다. 가자, 북쪽 황야로!"
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "결정술사 벨페고르",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/013_Belphegor.png"
  },
  {
    "episode": 4,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "황야에서 자란 아이",
    "locationKo": "북방 와일드랜드 영구동토 빙판 협곡",
    "oneLineKo": "등에 업은 친구 길가메시를 끝까지 지켜내기 위해, 살얼음 협곡을 추격해 오는 북방 암살자 부대를 물리쳐라!",
    "novelEpisodeUrl": "/book?ep=4",
    "webtoonEpisodeUrl": "/webtoon?ep=4",
    "bookMdUrl": "/book/episode_04.md",
    "coverIllustrationUrl": "/images/webtoon/episode_04/scene_04.webp",
    "prevContextKo": "여섯 번의 혹한이 흐른 북방 설원에서 카단은 마나 재능은 더디지만 어머니 엘윈의 가르침 아래 누구보다 우직하고 따뜻한 아이로 자라난다.",
    "synopsisKo": "정복왕 펜릴의 어린 아들 길가메시가 적대 부족 암살자들에게 포위되자, 맨손의 소년 카단이 눈보라 속으로 뛰어들어 화살에 허벅지를 찢기면서도 길가메시를 등에 업고 살얼음 강을 건너 구해낸다. 그날 밤 은빛 단검의 공명을 따라 도착한 여섯 스승이 드디어 카단을 찾아내 제자로 맞이한다.",
    "battleReasonKo": "등에 업은 친구 길가메시를 끝까지 지켜내기 위해, 살얼음 협곡을 추격해 오는 북방 암살자 부대를 물리쳐라!",
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
        "name": "루시안",
        "role": "붉은 유리 궁정 재상 · 만악의 근원",
        "cutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
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
        "shortCaption": "등에 업은 친구 길가메시를 끝까지 지켜내기 위해, 살얼음 협곡을 추격해 오는 북방 암살자 부대를 물리쳐라!",
        "shortQuote": "알렉산다르의 약속을 잊지 않고 와 주셨군요...” 가웨인이 쇠지팡이를 짚으며 정중히 예를 표했다.",
        "narration": "등에 업은 친구 길가메시를 끝까지 지켜내기 위해, 살얼음 협곡을 추격해 오는 북방 암살자 부대를 물리쳐라!",
        "speakerName": "엘윈",
        "speakerRole": "카단의 아버지 · 옛 아케 성기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/050_Aleksandar.png",
        "quote": "이 거친 손을 보니 대장장이보다 단단하군. 아주 마음에 들어."
      }
    ],
    "bossHeroClass": "HUNTER",
    "bossNameKo": "설원 협곡 암살단",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/070_Aila.png"
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
    "bossNameKo": "암흑 마녀 메두사 고르고",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png"
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
        "name": "대현자 말퓨온",
        "role": "별을 호흡하는 법을 전수한 현자",
        "cutoutUrl": "/anime-character-sheets/cutouts/066_Malfuon.png",
        "side": "ALLY"
      },
      {
        "name": "그림리",
        "role": "일곱 추적자 · 드워프 대장장이 스승",
        "cutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "side": "ALLY"
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
    "bossNameKo": "대자연의 현자 말퓨온",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/066_Malfuon.png"
  },
  {
    "episode": 7,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "배신자들의 천막",
    "locationKo": "와일드랜드 대평원 유목 연맹 본영",
    "oneLineKo": "정복왕 펜릴의 막사를 기습한 섀도우렐름 내통 배신자 부대를 진압하고 북방의 의리를 지켜내라!",
    "novelEpisodeUrl": "/book?ep=7",
    "webtoonEpisodeUrl": "/webtoon?ep=7",
    "bookMdUrl": "/book/episode_07.md",
    "coverIllustrationUrl": "/images/webtoon/episode_07/scene_05.webp",
    "prevContextKo": "열여덟 살 건장한 청년 무인으로 성장한 카단은 스승들의 18년 맹세를 지키러 남쪽으로 떠나기 전 마지막 밤을 맞이한다.",
    "synopsisKo": "붉은 유리 궁정의 루시안과 은밀히 내통한 북방 부족의 배신자들이 축제 술잔에 마비 독을 타 정복왕 펜릴을 암살하려는 반란을 일으킨다. 카단은 의형제 길가메시·요정 전사 티타니아와 함께 포위망을 뚫고 반란군을 제압하면서도 항복한 포로의 목숨을 살려 기사의 도리를 세운 뒤, 본토를 향한 대장정에 오른다.",
    "battleReasonKo": "정복왕 펜릴의 막사를 기습한 섀도우렐름 내통 배신자 부대를 진압하고 북방의 의리를 지켜내라!",
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
        "shortCaption": "정복왕 펜릴의 막사를 기습한 섀도우렐름 내통 배신자 부대를 진압하고 북방의 의리를 지켜내라!",
        "shortQuote": "내게 가장 소중한 딸을 너에게 맡기마. 황야의 사자가 되어 부족을 이끌어라!",
        "narration": "정복왕 펜릴의 막사를 기습한 섀도우렐름 내통 배신자 부대를 진압하고 북방의 의리를 지켜내라!",
        "speakerName": "펜릴",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "기억하겠다, 티타니아. 네 선택이 부끄럽지 않도록 살아 돌아오마."
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "섀도우렐름 내통 반란군",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png"
  },
  {
    "episode": 8,
    "actNumber": 1,
    "actTitle": "제1막 · 눈보라의 서약과 북방의 성장",
    "titleKo": "붉은 갈기의 기수",
    "locationKo": "국경 관문 도시 페가수스 밸리",
    "oneLineKo": "순수한 카단의 적갈기 명마를 강탈하려는 국경 관문의 사병 대장과 건달 무리를 혼내 주어라!",
    "novelEpisodeUrl": "/book?ep=8",
    "webtoonEpisodeUrl": "/webtoon?ep=8",
    "bookMdUrl": "/book/episode_08.md",
    "coverIllustrationUrl": "/images/webtoon/episode_08/scene_04.webp",
    "prevContextKo": "북방 설원을 넘어 처음으로 남쪽 번화가 페가수스 밸리에 발을 디딘 카단은 대륙 본토의 활기와 위선을 동시에 마주한다.",
    "synopsisKo": "어떤 조련사도 태우지 못한 전설의 적갈기 야생 명마가 난동을 부리자, 카단은 채찍 대신 별빛 호흡의 평온함으로 교감해 명마의 진정한 주인이 된다. 이어 시장에서 남루한 거지 소년 차림으로 탐욕스러운 상인의 누명을 통쾌한 추리로 깨부수는 천재 소녀 지략가 ‘실리아’와 운명적인 첫 동행을 시작한다.",
    "battleReasonKo": "순수한 카단의 적갈기 명마를 강탈하려는 국경 관문의 사병 대장과 건달 무리를 혼내 주어라!",
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
        "name": "워커",
        "role": "왕도 뒷골목의 은둔 무인",
        "cutoutUrl": "/anime-character-sheets/cutouts/051_Walker.png",
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
        "shortCaption": "순수한 카단의 적갈기 명마를 강탈하려는 국경 관문의 사병 대장과 건달 무리를 혼내 주어라!",
        "shortQuote": "천한 방랑자가 감히 내 정의를 논하느냐?",
        "narration": "순수한 카단의 적갈기 명마를 강탈하려는 국경 관문의 사병 대장과 건달 무리를 혼내 주어라!",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "천한 방랑자가 감히 내 정의를 논하느냐? 그 알량한 단검으로 내 불꽃을 막을 수 있는지 시험해 보아라!"
      }
    ],
    "bossHeroClass": "HUNTER",
    "bossNameKo": "관문 약탈 기병대장",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/051_Walker.png"
  },
  {
    "episode": 9,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "거지 옷의 바람",
    "locationKo": "왕도 라이트헤븐 내성 결투 광장",
    "oneLineKo": "원수의 양자로 자라 무고한 이들을 짓밟는 화염의 귀공자 이그니스의 오만한 검을 정면으로 꺾어라!",
    "novelEpisodeUrl": "/book?ep=9",
    "webtoonEpisodeUrl": "/webtoon?ep=9",
    "bookMdUrl": "/book/episode_09.md",
    "coverIllustrationUrl": "/images/webtoon/episode_09/scene_05.webp",
    "prevContextKo": "카단과 실리아가 당도한 왕도 라이트헤븐 광장에서는 거만한 귀족 공자가 비무 초빙을 빙자해 서민 무인들을 짓밟고 있었다.",
    "synopsisKo": "붉은 비단 예복을 입은 소년 귀족의 정체는 원수 루시안의 양자로 길러진 발리안의 친아들 ‘이그니스’였다! 출생의 비밀을 모른 채 권력과 오만에 취해 암흑 사술까지 섞어 쓰는 이그니스 앞에 카단이 나서 정면으로 격돌하고, 은둔 무인 워커의 조력 속에 첫 숙명의 라이벌전을 펼친다.",
    "battleReasonKo": "원수의 양자로 자라 무고한 이들을 짓밟는 화염의 귀공자 이그니스의 오만한 검을 정면으로 꺾어라!",
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
        "shortCaption": "원수의 양자로 자라 무고한 이들을 짓밟는 화염의 귀공자 이그니스의 오만한 검을 정면으로 꺾어라!",
        "shortQuote": "약초를 달여 워커 님을 치료한 뒤, 곧바로 수용소로 가요.",
        "narration": "원수의 양자로 자라 무고한 이들을 짓밟는 화염의 귀공자 이그니스의 오만한 검을 정면으로 꺾어라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "약초를 달여 워커 님을 치료한 뒤, 곧바로 수용소로 가요. 바람이 우리의 길잡이가 되어줄 테니까요."
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "불꽃 궁정의 귀공자 이그니스",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png"
  },
  {
    "episode": 10,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "불꽃 궁정의 포로",
    "locationKo": "라이트헤븐 붉은 유리 궁전 외곽",
    "oneLineKo": "은신처를 포위한 루시안의 불꽃 궁정 친위 기사단을 돌파하고 지하 감옥 구출로를 확보하라!",
    "novelEpisodeUrl": "/book?ep=10",
    "webtoonEpisodeUrl": "/webtoon?ep=10",
    "bookMdUrl": "/book/episode_10.md",
    "coverIllustrationUrl": "/images/webtoon/episode_10/scene_05.webp",
    "prevContextKo": "광장 결투 이후 루시안의 본거지인 붉은 유리 궁전을 정찰하던 카단과 실리아는 궁정 깊숙한 곳에 숨겨진 충격적인 비밀을 감지한다.",
    "synopsisKo": "죽은 줄 알았던 이그니스의 친어머니 이셀라가 18년 동안 루시안의 감시 아래 유폐되어 있었고, 지하 감옥에는 반역자로 낙인찍힌 양심수들이 신음하고 있었다. 실리아의 치밀한 환기구 분석으로 잠입 작전을 세우던 밤, 진홍빛 예복의 재상 루시안이 친위 불꽃 기사단을 이끌고 은신처를 급습한다.",
    "battleReasonKo": "은신처를 포위한 루시안의 불꽃 궁정 친위 기사단을 돌파하고 지하 감옥 구출로를 확보하라!",
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
        "shortCaption": "은신처를 포위한 루시안의 불꽃 궁정 친위 기사단을 돌파하고 지하 감옥 구출로를 확보하라!",
        "shortQuote": "약속하겠습니다, 아주머니.",
        "narration": "은신처를 포위한 루시안의 불꽃 궁정 친위 기사단을 돌파하고 지하 감옥 구출로를 확보하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "약속하겠습니다, 아주머니. 숙부님을 구해내고, 이그니스를 반드시 어머니의 품으로 돌려보내겠습니다."
      }
    ],
    "bossHeroClass": "MAGE",
    "bossNameKo": "붉은 유리 궁정 친위대",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png"
  },
  {
    "episode": 11,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "기억을 깨우는 단검",
    "locationKo": "붉은 유리 궁정 제7 지하 용암 감옥",
    "oneLineKo": "발리안과 이셀라의 탈출로를 가로막는 지하 감옥 수호장 메두사 고르고의 맹공을 방패로 막아내라!",
    "novelEpisodeUrl": "/book?ep=11",
    "webtoonEpisodeUrl": "/webtoon?ep=11",
    "bookMdUrl": "/book/episode_11.md",
    "coverIllustrationUrl": "/images/webtoon/episode_11/scene_05.webp",
    "prevContextKo": "용암 열기가 들끓는 지하 폐광 감옥 깊숙이 잠입한 카단과 실리아는 쇠사슬에 묶인 채 18년을 버텨온 창술사 발리안을 발견한다.",
    "synopsisKo": "추격해 온 이그니스가 친아버지인 줄도 모른 채 발리안에게 화염 검을 겨누자, 발리안은 살상 대신 아들의 검 궤도만을 쳐내는 아케 가문 비전 창술을 보여준다. 동시에 카단이 꺼낸 은빛 단검 한 쌍이 공명하며 출생의 진실이 흔들리고, 뒤따라온 메두사 고르고의 사슬 채찍을 카단이 방패로 막아내며 발리안과 이셀라의 탈출을 성공시킨다.",
    "battleReasonKo": "발리안과 이셀라의 탈출로를 가로막는 지하 감옥 수호장 메두사 고르고의 맹공을 방패로 막아내라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "발리안",
        "role": "이그니스의 친아버지 · 아케 창술사",
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
        "shortCaption": "뒤따라온 메두사 고르고의 사슬 채찍을 카단이 방패로 막아내며 발리안과 이셀라의 탈출을 성공시킨다.",
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
        "shortCaption": "뒤따라온 메두사 고르고의 사슬 채찍을 카단이 방패로 막아내며 발리안과 이셀라의 탈출을 성공시킨다.",
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
        "shortCaption": "발리안과 이셀라의 탈출로를 가로막는 지하 감옥 수호장 메두사 고르고의 맹공을 방패로 막아내라!",
        "shortQuote": "실리아? 너 역시 스승의 죄악에서 결코 자유롭지 못할 것이다.",
        "narration": "발리안과 이셀라의 탈출로를 가로막는 지하 감옥 수호장 메두사 고르고의 맹공을 방패로 막아내라!",
        "speakerName": "메두사 고르고",
        "speakerRole": "나인섀도우 코덱스를 훔친 암흑 마녀",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
        "quote": "에올루스가 그 가증스러운 코덱스의 비밀을 지키기 위해 얼마나 많은 제자들의 목숨을 쓰레기처럼 버렸는지 아느냐, 실리아? 너 역시 스승의 죄악에서 결코 자유롭지 못할 것이다."
      }
    ],
    "bossHeroClass": "ROGUE",
    "bossNameKo": "지하 감옥의 메두사 고르고",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png"
  },
  {
    "episode": 12,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "두 무덤 사이의 봄",
    "locationKo": "왕도 외곽 잊힌 옛 성기사단 성소",
    "oneLineKo": "선대 성기사들의 넋이 잠든 옛 성소를 파괴하려는 궁정 마도 골렘 토벌대를 물리쳐라!",
    "novelEpisodeUrl": "/book?ep=12",
    "webtoonEpisodeUrl": "/webtoon?ep=12",
    "bookMdUrl": "/book/episode_12.md",
    "coverIllustrationUrl": "/images/webtoon/episode_12/scene_04.webp",
    "prevContextKo": "18년 만에 해후한 발리안과 이셀라는 옛 성기사단의 폐허 성소에서 눈물로 재회하며 카단에게 지난날 엘윈 마을의 모든 진실을 들려준다.",
    "synopsisKo": "부모 세대의 숭고한 희생을 알게 된 카단은 증오가 아닌 수호의 길을 다시금 다짐한다. 그러나 성소까지 추격해 온 궁정 마도 골렘 부대가 성역을 짓밟으려 들자, 발리안은 카단에게 두 번째 은빛 단검을 맡기며 성소의 결계를 함께 지켜낸다.",
    "battleReasonKo": "선대 성기사들의 넋이 잠든 옛 성소를 파괴하려는 궁정 마도 골렘 토벌대를 물리쳐라!",
    "cast": [
      {
        "name": "카단",
        "role": "알렉산다르의 아들 · 눈히어로 수호전사",
        "cutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "side": "ALLY"
      },
      {
        "name": "발리안",
        "role": "이그니스의 친아버지 · 아케 창술사",
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
        "name": "장인 아이언포지",
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
        "narration": "그러나 성소까지 추격해 온 궁정 마도 골렘 부대가 성역을 짓밟으려 들자, 발리안은 카단에게 두 번째 은빛 단검을 맡기며 성소의 결계를 함께 지켜낸다.",
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
        "speakerRole": "이그니스의 친아버지 · 아케 창술사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/043_Balian.png",
        "quote": "숙부님, 당신이 지켜온 불씨는 결코 꺼지지 않을 것입니다. 반드시 이그니스를 구하고 대륙의 평화를 되찾겠습니다."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_12/scene_43.webp",
        "shortCaption": "선대 성기사들의 넋이 잠든 옛 성소를 파괴하려는 궁정 마도 골렘 토벌대를 물리쳐라!",
        "shortQuote": "우리가 걸어갈 길도 마찬가지일 거다. 바다 건너 바람섬으로 가자.",
        "narration": "선대 성기사들의 넋이 잠든 옛 성소를 파괴하려는 궁정 마도 골렘 토벌대를 물리쳐라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "우리가 걸어갈 길도 마찬가지일 거다. 바다 건너 바람섬으로 가자."
      }
    ],
    "bossHeroClass": "PALADIN",
    "bossNameKo": "궁정 마도 공성 골렘",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png"
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
        "side": "ALLY"
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
    "bossNameKo": "전설의 노장 레오나르",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/086_Leonar.png"
  },
  {
    "episode": 14,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "안개 호수의 손님들",
    "locationKo": "동해안 안개 호수 ‘구름돌아오는장원’",
    "oneLineKo": "피난민 아이들이 머무는 안개 호수 장원을 약탈하려는 해안 수적단을 수장시켜라!",
    "novelEpisodeUrl": "/book?ep=14",
    "webtoonEpisodeUrl": "/webtoon?ep=14",
    "bookMdUrl": "/book/episode_14.md",
    "coverIllustrationUrl": "/images/webtoon/episode_14/scene_04.webp",
    "prevContextKo": "일흔두 개의 거대한 현무암 석주가 솟은 안개 호수에서 카단은 스승 론돌의 옛 전우들이 지키는 피난민 장원을 방문한다.",
    "synopsisKo": "전쟁고아와 난민들을 돌보는 장원에 궁정의 앞잡이 수적단이 들이닥쳐 약탈을 시도한다. 카단과 실리아는 물안개 지형과 얼음 다리를 활용해 주민들을 먼저 대피시키고 수적단을 격파하며, 뒤따라온 이그니스는 난민들이 내민 따뜻한 산나물 국 한 그릇에 처음으로 황실 바깥 민중의 온기를 느낀다.",
    "battleReasonKo": "피난민 아이들이 머무는 안개 호수 장원을 약탈하려는 해안 수적단을 수장시켜라!",
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
        "shortCaption": "전쟁고아와 난민들을 돌보는 장원에 궁정의 앞잡이 수적단이 들이닥쳐 약탈을 시도한다.",
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
        "shortCaption": "피난민 아이들이 머무는 안개 호수 장원을 약탈하려는 해안 수적단을 수장시켜라!",
        "shortQuote": "불 곁으로 다가와서 몸을 말려라, 이그니스.",
        "narration": "피난민 아이들이 머무는 안개 호수 장원을 약탈하려는 해안 수적단을 수장시켜라!",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "불 곁으로 다가와서 몸을 말려라, 이그니스. 내일 새벽이면 우리 모두 저 거친 대해로 나아가야 한다."
      }
    ],
    "bossHeroClass": "MAGE",
    "bossNameKo": "안개 호수 약탈 수적단",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/005_Aqualord.png"
  },
  {
    "episode": 15,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "독사와 사자의 밤",
    "locationKo": "폭풍우 치는 구름돌아오는장원 본채",
    "oneLineKo": "노장 레오나르가 목숨 바쳐 지켜낸 아이들을 수호하기 위해, 루시안이 보낸 황실 독사 암살단을 섬멸하라!",
    "novelEpisodeUrl": "/book?ep=15",
    "webtoonEpisodeUrl": "/webtoon?ep=15",
    "bookMdUrl": "/book/episode_15.md",
    "coverIllustrationUrl": "/images/webtoon/episode_15/scene_04.webp",
    "prevContextKo": "자정의 폭풍우가 안개 호수를 덮친 밤, 루시안이 비밀리에 파견한 황실 직속 독사 암살단이 장원 전체를 몰살하기 위해 침투한다.",
    "synopsisKo": "맹독 단검에 찔리면서도 어린 난민 아이들을 품에 안고 버텨 선 노장 레오나르는 사자 같은 마지막 포효로 적들을 쓸어낸 뒤 평온히 눈을 감는다. 현장에 떨어진 암살단의 황실 친필 인장을 직접 확인한 이그니스는 자신이 믿었던 양아버지 루시안이 무고한 백성을 학살하는 원흉이었음을 깨닫고 피눈물을 흘린다.",
    "battleReasonKo": "노장 레오나르가 목숨 바쳐 지켜낸 아이들을 수호하기 위해, 루시안이 보낸 황실 독사 암살단을 섬멸하라!",
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
        "name": "메두사 고르고",
        "role": "나인섀도우 코덱스를 훔친 암흑 마녀",
        "cutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
        "side": "ENEMY"
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
        "shortCaption": "노장 레오나르가 목숨 바쳐 지켜낸 아이들을 수호하기 위해, 루시안이 보낸 황실 독사 암살단을 섬멸하라!",
        "shortQuote": "장군님께서 지키신 아이들의 생명과 장원의 온기를 제 방패로 영원히 수호하겠습니다.",
        "narration": "노장 레오나르가 목숨 바쳐 지켜낸 아이들을 수호하기 위해, 루시안이 보낸 황실 독사 암살단을 섬멸하라!",
        "speakerName": "카단",
        "speakerRole": "녹옥 지팡이의 주인 · 옛 대장군",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/086_Leonar.png",
        "quote": "울지 마라, 얘들아... 늙은 사자는 그저 잠시 눈을 붙이는 것뿐이다..."
      }
    ],
    "bossHeroClass": "ROGUE",
    "bossNameKo": "황실 직속 독사 암살단",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/054_Arachne.png"
  },
  {
    "episode": 16,
    "actNumber": 2,
    "actTitle": "제2막 · 붉은 유리 궁정과 엇갈린 두 형제",
    "titleKo": "폐허 앞의 형제",
    "locationKo": "상현달이 뜬 안개 호수 출항 부두",
    "oneLineKo": "진정한 형제로 거듭난 카단과 이그니스의 첫 협공으로, 부두를 포위한 황궁 화염 추격대를 격파하라!",
    "novelEpisodeUrl": "/book?ep=16",
    "webtoonEpisodeUrl": "/webtoon?ep=16",
    "bookMdUrl": "/book/episode_16.md",
    "coverIllustrationUrl": "/images/webtoon/episode_16/scene_04.webp",
    "prevContextKo": "레오나르의 장례를 치른 다음 날 밤, 상현달 아래 마주 선 카단과 이그니스는 부모 세대가 남긴 편지와 두 자루 은빛 단검을 마주한다.",
    "synopsisKo": "친아버지 발리안의 원수인 루시안을 아비라 부르며 살아온 죄책감에 무너져 내리던 이그니스에게, 카단은 원망 대신 굳센 손을 내밀어 의형제의 맹세를 다시 잇는다. 증거 인멸을 위해 들이닥친 황궁 추격 함대를 두 형제가 완벽한 협공으로 격파하고, 실리아의 고향 ‘바람 속삭임 섬’을 향해 돛을 올린다.",
    "battleReasonKo": "진정한 형제로 거듭난 카단과 이그니스의 첫 협공으로, 부두를 포위한 황궁 화염 추격대를 격파하라!",
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
        "narration": "증거 인멸을 위해 들이닥친 황궁 추격 함대를 두 형제가 완벽한 협공으로 격파하고, 실리아의 고향 ‘바람 속삭임 섬’을 향해 돛을 올린다.",
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
        "narration": "증거 인멸을 위해 들이닥친 황궁 추격 함대를 두 형제가 완벽한 협공으로 격파하고, 실리아의 고향 ‘바람 속삭임 섬’을 향해 돛을 올린다.",
        "speakerName": "암살 대장",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "역적 놈들과 황궁의 배신자를 한 놈도 남기지 말고 몰살해라! 저택과 배를 모조리 불태워 증거를 인멸하라!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_16/scene_44.webp",
        "shortCaption": "진정한 형제로 거듭난 카단과 이그니스의 첫 협공으로, 부두를 포위한 황궁 화염 추격대를 격파하라!",
        "shortQuote": "바다의 신이 우리에게 길을 열어주셨다!",
        "narration": "진정한 형제로 거듭난 카단과 이그니스의 첫 협공으로, 부두를 포위한 황궁 화염 추격대를 격파하라!",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "바다의 신이 우리에게 길을 열어주셨다! 젊은 사자들아, 새로운 시대를 향해 돛을 올려라!"
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "황궁 추격 함대 사령관",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png"
  },
  {
    "episode": 17,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "바람섬의 초대장",
    "locationKo": "동쪽 대해 범선 ‘미풍의날개호’ 갑판",
    "oneLineKo": "바람 속삭임 섬 진입을 막아서는 제피르 대장로의 해협 매복 함대를 선상 결투로 돌파하라!",
    "novelEpisodeUrl": "/book?ep=17",
    "webtoonEpisodeUrl": "/webtoon?ep=17",
    "bookMdUrl": "/book/episode_17.md",
    "coverIllustrationUrl": "/images/webtoon/episode_17/scene_04.webp",
    "prevContextKo": "일흔두 석주 미로를 빠져나와 망망대해로 나선 일행에게 바람 속삭임 섬에서 날아온 의문의 초대장이 도착한다.",
    "synopsisKo": "실리아는 어머니 실피드 여왕이 10년 전 의문의 죽음을 맞은 뒤 고향 섬이 외부와 단절되었다는 아픈 과거를 털어놓는다. 칼날 산호초 해협에 들어서자 섬의 반역파인 제피르 대장로가 보낸 해상 기습선이 접근하고, 일행은 거센 파도 위 선상 난전을 돌파해 비밀 해저 동굴로 진입한다.",
    "battleReasonKo": "바람 속삭임 섬 진입을 막아서는 제피르 대장로의 해협 매복 함대를 선상 결투로 돌파하라!",
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
        "name": "수문장 아쿠아로드",
        "role": "네 수문 요새를 막아선 심연 군주",
        "cutoutUrl": "/anime-character-sheets/cutouts/005_Aqualord.png",
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
        "shortCaption": "바람 속삭임 섬 진입을 막아서는 제피르 대장로의 해협 매복 함대를 선상 결투로 돌파하라!",
        "shortQuote": "황실이 저지른 죗값을 내가 앞장서서 갚겠다.",
        "narration": "바람 속삭임 섬 진입을 막아서는 제피르 대장로의 해협 매복 함대를 선상 결투로 돌파하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "황실이 저지른 죗값을 내가 앞장서서 갚겠다."
      }
    ],
    "bossHeroClass": "SHAMAN",
    "bossNameKo": "칼날 해협 매복 함대",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/005_Aqualord.png"
  },
  {
    "episode": 18,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "검은 성전의 비밀",
    "locationKo": "바람 속삭임 섬 지하 ‘검은 성전’",
    "oneLineKo": "실피드 여왕 독살의 진실을 묻어버리려 가동된 지하 검은 성전의 고대 흑요석 수호자를 파괴하라!",
    "novelEpisodeUrl": "/book?ep=18",
    "webtoonEpisodeUrl": "/webtoon?ep=18",
    "bookMdUrl": "/book/episode_18.md",
    "coverIllustrationUrl": "/images/webtoon/episode_18/scene_05.webp",
    "prevContextKo": "해저 동굴을 지나 수천 년간 봉인되어 있던 지하 흑요석 유적 ‘검은 성전’에 발을 디딘 카단, 실리아, 이그니스.",
    "synopsisKo": "성전 중앙의 고대 기억 수정구가 작동하며 10년 전 연회의 충격적인 진상이 투영된다. 평화 협정 자리에서 루시안 재상과 내통한 제피르 대장로가 실피드 여왕의 은잔에 메두사 고르고의 맹독을 탔던 것이다! 진실을 목격한 이들을 매장하려는 성전 수호 골렘이 깨어나자 세 사람은 분노와 정의의 불꽃으로 맞선다.",
    "battleReasonKo": "실피드 여왕 독살의 진실을 묻어버리려 가동된 지하 검은 성전의 고대 흑요석 수호자를 파괴하라!",
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
        "name": "장인 아이언포지",
        "role": "봉인 석실의 수호 거신병",
        "cutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
        "side": "ENEMY"
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
        "shortCaption": "진실을 목격한 이들을 매장하려는 성전 수호 골렘이 깨어나자 세 사람은 분노와 정의의 불꽃으로 맞선다.",
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
        "shortCaption": "실피드 여왕 독살의 진실을 묻어버리려 가동된 지하 검은 성전의 고대 흑요석 수호자를 파괴하라!",
        "shortQuote": "제피르의 목은 내가 베겠다.",
        "narration": "실피드 여왕 독살의 진실을 묻어버리려 가동된 지하 검은 성전의 고대 흑요석 수호자를 파괴하라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "제피르의 목은 내가 베겠다. 그것만이 내 아버지 발리안과 알렉산다르 숙부님 앞에 조금이나마 속죄할 수 있는 유일한 길이다."
      }
    ],
    "bossHeroClass": "WARLOCK",
    "bossNameKo": "검은 성전 흑요석 수호자",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png"
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
        "side": "ALLY"
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
    "bossNameKo": "바람섬 국왕 에올루스",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/025_Aeolus.png"
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
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
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
    "bossCutoutUrl": "/anime-character-sheets/cutouts/006_Leviathan.png"
  },
  {
    "episode": 21,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "불탄 배의 흔적",
    "locationKo": "불타는 본토 서남부 세븐브리지 해안",
    "oneLineKo": "해안 구호소에 불을 지르고 독화살을 퍼붓는 루시안의 서남부 철갑 봉쇄군을 격파하라!",
    "novelEpisodeUrl": "/book?ep=21",
    "webtoonEpisodeUrl": "/webtoon?ep=21",
    "bookMdUrl": "/book/episode_21.md",
    "coverIllustrationUrl": "/images/webtoon/episode_21/scene_04.webp",
    "prevContextKo": "거센 대해를 건너 마침내 대륙 본토 해안에 상륙한 꽃배 선단 앞에는 환영 대신 검붉은 연기와 불타버린 구호소가 펼쳐져 있었다.",
    "synopsisKo": "루시안의 직속 철갑 추격대가 선단의 상륙을 막기 위해 해안 성역과 피난민 창고에 불을 지르고 독화살 세례를 퍼붓는다. 카단은 무쇠 방패를 앞세워 불길 속 주민들을 구출하고, 실리아·이그니스와 함께 해안 교두보를 탈환하며 대륙 심장부로의 진격을 시작한다.",
    "battleReasonKo": "해안 구호소에 불을 지르고 독화살을 퍼붓는 루시안의 서남부 철갑 봉쇄군을 격파하라!",
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
        "shortCaption": "루시안의 직속 철갑 추격대가 선단의 상륙을 막기 위해 해안 성역과 피난민 창고에 불을 지르고 독화살 세례를 퍼붓는다.",
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
        "shortCaption": "해안 구호소에 불을 지르고 독화살을 퍼붓는 루시안의 서남부 철갑 봉쇄군을 격파하라!",
        "shortQuote": "실리아가 불타버린 등대 기둥을 매만지며 결연하게 말했다.",
        "narration": "해안 구호소에 불을 지르고 독화살을 퍼붓는 루시안의 서남부 철갑 봉쇄군을 격파하라!",
        "speakerName": "실리아",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "알렉산다르 스승님과 발리안 숙부님이 목숨 바쳐 지키려 했던 대륙이다. 절망의 잿더미 속에서도 우리는 사람의 온기를 지켜냈다. 이제 우리가 방패를 들고 그 길을 끝까지 걸어가자."
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "해안 방화 철갑 추격대",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png"
  },
  {
    "episode": 22,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "무인도의 투석기",
    "locationKo": "수도 해상 관문 ‘사이렌 해협’ 무인도",
    "oneLineKo": "무인도에서 완성한 협동 공성 투석기로 사이렌 해협 절벽의 마도 화포 수비대를 격파하라!",
    "novelEpisodeUrl": "/book?ep=22",
    "webtoonEpisodeUrl": "/webtoon?ep=22",
    "bookMdUrl": "/book/episode_22.md",
    "coverIllustrationUrl": "/images/webtoon/episode_22/scene_05.webp",
    "prevContextKo": "수도로 향하는 유일한 좁은 물길 사이렌 해협 양쪽 절벽에는 루시안의 마도 화포 진지가 선단의 진입을 원천 봉쇄하고 있었다.",
    "synopsisKo": "정면 돌파가 불가능한 상황에서 무인도에 상륙한 일행은 스승 그림리의 대장장이 기술, 실리아의 대왕 다시마 탄성 로프 설계, 카단의 괴력을 합쳐 하룻밤 만에 초거대 공성 투석기를 완성한다! 절벽 위 화포 진지를 정확히 타격해 해협 봉쇄망을 통쾌하게 무너뜨린다.",
    "battleReasonKo": "무인도에서 완성한 협동 공성 투석기로 사이렌 해협 절벽의 마도 화포 수비대를 격파하라!",
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
        "name": "장인 아이언포지",
        "role": "봉인 석실의 수호 거신병",
        "cutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
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
        "shortCaption": "절벽 위 화포 진지를 정확히 타격해 해협 봉쇄망을 통쾌하게 무너뜨린다.",
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
        "shortCaption": "절벽 위 화포 진지를 정확히 타격해 해협 봉쇄망을 통쾌하게 무너뜨린다.",
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
        "shortCaption": "무인도에서 완성한 협동 공성 투석기로 사이렌 해협 절벽의 마도 화포 수비대를 격파하라!",
        "shortQuote": "우리가 만든 작은 도구가 수많은 생명을 살려냈다.",
        "narration": "무인도에서 완성한 협동 공성 투석기로 사이렌 해협 절벽의 마도 화포 수비대를 격파하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "우리가 만든 작은 도구가 수많은 생명을 살려냈다. 스승님께서 말씀하셨던 방패의 참뜻이 바로 이것이리라."
      }
    ],
    "bossHeroClass": "PALADIN",
    "bossNameKo": "사이렌 해협 화포 요새장",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png"
  },
  {
    "episode": 23,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "석굴의 기록",
    "locationKo": "용의 뿔 산맥 고대 해안 석굴",
    "oneLineKo": "선대 성기사들의 유해가 잠든 용의 석굴을 더럽히는 섀도우렐름 사령술사 부대를 정화하라!",
    "novelEpisodeUrl": "/book?ep=23",
    "webtoonEpisodeUrl": "/webtoon?ep=23",
    "bookMdUrl": "/book/episode_23.md",
    "coverIllustrationUrl": "/images/webtoon/episode_23/scene_05.webp",
    "prevContextKo": "사이렌 해협을 돌파한 일행은 수도 외곽 ‘용의 뿔 산맥’ 기슭에서 옛 아케 성기사단이 남긴 비밀 석굴 통로를 발견한다.",
    "synopsisKo": "석굴 벽면에는 제1차 성전 당시 어둠의 군단에 맞섰던 선대 성기사들과 알렉산다르·발리안의 젊은 날 기록이 새겨져 있었다. 그때 성기사들의 유해를 모독하며 망령으로 되살리려던 사령술사 부대가 침입하고, 카단은 아버지와 선배 영웅들의 안식처를 지키기 위해 분연히 방패를 든다.",
    "battleReasonKo": "선대 성기사들의 유해가 잠든 용의 석굴을 더럽히는 섀도우렐름 사령술사 부대를 정화하라!",
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
        "role": "이그니스의 친아버지 · 아케 창술사",
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
        "narration": "그때 성기사들의 유해를 모독하며 망령으로 되살리려던 사령술사 부대가 침입하고, 카단은 아버지와 선배 영웅들의 안식처를 지키기 위해 분연히 방패를 든다.",
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
        "shortCaption": "선대 성기사들의 유해가 잠든 용의 석굴을 더럽히는 섀도우렐름 사령술사 부대를 정화하라!",
        "shortQuote": "실리아가 열쇠를 들어 올리며 말했다.",
        "narration": "선대 성기사들의 유해가 잠든 용의 석굴을 더럽히는 섀도우렐름 사령술사 부대를 정화하라!",
        "speakerName": "실리아",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "가자. 문 뒤에서 기다리고 있을 선대 영웅들의 유산을 맞이하러."
      }
    ],
    "bossHeroClass": "WARLOCK",
    "bossNameKo": "석굴 침입 사령술사",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/069_Gandar.png"
  },
  {
    "episode": 24,
    "actNumber": 3,
    "actTitle": "제3막 · 바람섬의 진실과 선대 영웅의 유산",
    "titleKo": "봉인된 석실",
    "locationKo": "용의 석굴 최심부 아다만티움 석실",
    "oneLineKo": "전설의 성물 『드래곤 브레이커 방패』의 주인으로 인정받기 위해 봉인 석실의 황금 수호 거신을 돌파하라!",
    "novelEpisodeUrl": "/book?ep=24",
    "webtoonEpisodeUrl": "/webtoon?ep=24",
    "bookMdUrl": "/book/episode_24.md",
    "coverIllustrationUrl": "/images/webtoon/episode_24/scene_05.webp",
    "prevContextKo": "석굴 가장 깊은 곳, 수백 길 높이의 아다만티움 철문 너머에서 제1차 성전 열두 성기사의 전설적인 유산이 일행을 기다린다.",
    "synopsisKo": "고대 성기사단의 시련 수호자를 정정당당히 넘어선 카단은 부서지지 않는 전설의 성물 『드래곤 브레이커 방패』를 계승하고 별빛 호흡의 극의를 깨우친다. 마침 수도 라이트헤븐에서 루시안이 황권을 찬탈하기 위해 거짓 혼례식을 연다는 급보가 날아들고, 세 청년은 비밀 지하 수로를 통해 수도 한복판으로 질주한다.",
    "battleReasonKo": "전설의 성물 『드래곤 브레이커 방패』의 주인으로 인정받기 위해 봉인 석실의 황금 수호 거신을 돌파하라!",
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
        "name": "장인 아이언포지",
        "role": "봉인 석실의 수호 거신병",
        "cutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png",
        "side": "ALLY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_24/scene_05.webp",
        "shortCaption": "고대 성기사단의 시련 수호자를 정정당당히 넘어선 카단은 부서지지 않는 전설의 성물 『드래곤 브레이커 방패』를…",
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
        "shortCaption": "전설의 성물 『드래곤 브레이커 방패』의 주인으로 인정받기 위해 봉인 석실의 황금 수호 거신을 돌파하라!",
        "shortQuote": "수도의 시민들이 우리를 기다리고 있어요.",
        "narration": "전설의 성물 『드래곤 브레이커 방패』의 주인으로 인정받기 위해 봉인 석실의 황금 수호 거신을 돌파하라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "수도의 시민들이 우리를 기다리고 있어요. 거짓된 혼례식을 부수고 진정한 새벽을 열러 가요!"
      }
    ],
    "bossHeroClass": "PALADIN",
    "bossNameKo": "석실의 아다만티움 수호신",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/080_Ironforge.png"
  },
  {
    "episode": 25,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "거짓된 혼례",
    "locationKo": "수도 라이트헤븐 백리석 대성당",
    "oneLineKo": "거짓 혼례식장을 지키는 루시안의 대성당 근위 사제단과 심판관들을 무너뜨리고 민중에게 진실을 밝혀라!",
    "novelEpisodeUrl": "/book?ep=25",
    "webtoonEpisodeUrl": "/webtoon?ep=25",
    "bookMdUrl": "/book/episode_25.md",
    "coverIllustrationUrl": "/images/webtoon/episode_25/scene_05.webp",
    "prevContextKo": "수천 개의 촛불로 치장된 수도 대성당에서 최고 재상 루시안은 황실의 정통성을 날조하기 위한 거짓 혼례식을 강행한다.",
    "synopsisKo": "성당의 거대한 문이 열리며 백색 화염을 두른 이그니스와 카단, 실리아가 당당히 걸어 들어온다! 이그니스는 만천하의 시민들 앞에서 루시안의 엘윈 마을 학살과 여왕 독살 죄상을 낱낱이 폭로하고, 진실에 눈뜬 수도 시민들이 일제히 봉기하자 당황한 루시안은 내궁 비밀 철문 뒤로 도주한다.",
    "battleReasonKo": "거짓 혼례식장을 지키는 루시안의 대성당 근위 사제단과 심판관들을 무너뜨리고 민중에게 진실을 밝혀라!",
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
        "shortCaption": "진실에 눈뜬 수도 시민들이 일제히 봉기하자 당황한 루시안은 내궁 비밀 철문 뒤로 도주한다.",
        "shortQuote": "이그니스가 높은 제단 난간에 착지하며 사자후를 토해냈다.",
        "narration": "이그니스는 만천하의 시민들 앞에서 루시안의 엘윈 마을 학살과 여왕 독살 죄상을 낱낱이 폭로하고, 진실에 눈뜬 수도 시민들이 일제히 봉기하자 당황한 루시안은 내궁 비밀 철문 뒤로 도주한다.",
        "speakerName": "이그니스",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "반역자 놈들이다! 친위대, 뭣들 하느냐! 저놈들의 목을 베어 바닥을 피로 물들여라!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_25/scene_35.webp",
        "shortCaption": "진실에 눈뜬 수도 시민들이 일제히 봉기하자 당황한 루시안은 내궁 비밀 철문 뒤로 도주한다.",
        "shortQuote": "이그니스 기사단장님이 황궁의 반역자들에게 맞서고 계신다!” 시민들의 외침에 겁에…",
        "narration": "이그니스는 만천하의 시민들 앞에서 루시안의 엘윈 마을 학살과 여왕 독살 죄상을 낱낱이 폭로하고, 진실에 눈뜬 수도 시민들이 일제히 봉기하자 당황한 루시안은 내궁 비밀 철문 뒤로 도주한다.",
        "speakerName": "수도의 시민들",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "이그니스 기사단장님이 황궁의 반역자들에게 맞서고 계신다!"
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_25/scene_47.webp",
        "shortCaption": "거짓 혼례식장을 지키는 루시안의 대성당 근위 사제단과 심판관들을 무너뜨리고 민중에게 진실을 밝혀라!",
        "shortQuote": "수도의 백성들이여! 더 이상 루시안의 거짓과 공포 앞에 무릎 꿇지 마세요!…",
        "narration": "거짓 혼례식장을 지키는 루시안의 대성당 근위 사제단과 심판관들을 무너뜨리고 민중에게 진실을 밝혀라!",
        "speakerName": "실리아",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "보았느냐, 카단. 사람들의 가슴속에 잠들어 있던 빛이 마침내 깨어났다."
      }
    ],
    "bossHeroClass": "PRIEST",
    "bossNameKo": "대성당 타락 심판관단",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png"
  },
  {
    "episode": 26,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "열린 문, 닫힌 마음",
    "locationKo": "황궁 삼중 방어벽 제1관문 ‘태양의 철문’",
    "oneLineKo": "뱀 문신의 저주에 조종당하는 태양의 철문 중장갑 수비대를 제압하고 황궁 진입로를 열어라!",
    "novelEpisodeUrl": "/book?ep=26",
    "webtoonEpisodeUrl": "/webtoon?ep=26",
    "bookMdUrl": "/book/episode_26.md",
    "coverIllustrationUrl": "/images/webtoon/episode_26/scene_05.webp",
    "prevContextKo": "대성당 해방과 함께 횃불을 든 수도 상인·노동자들이 합류하며 황궁 외곽 ‘태양의 철문’ 앞에서 대격돌이 벌어진다.",
    "synopsisKo": "루시안의 세뇌 저주인 뱀 문신에 묶여 백성들에게 칼을 겨누던 황궁 수문장 발타자르와 맞선 카단과 이그니스. 두 청년은 병사들의 목숨을 빼앗는 대신 방패와 검등으로 저주의 핵만을 타격해 철문을 개방하고, 죽어가던 발타자르 역시 마침내 세뇌에서 풀려나 내궁의 함정을 경고하고 눈을 감는다.",
    "battleReasonKo": "뱀 문신의 저주에 조종당하는 태양의 철문 중장갑 수비대를 제압하고 황궁 진입로를 열어라!",
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
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
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
        "shortCaption": "뱀 문신의 저주에 조종당하는 태양의 철문 중장갑 수비대를 제압하고 황궁 진입로를 열어라!",
        "shortQuote": "내일 밤이면 모든 것이 끝난다.",
        "narration": "뱀 문신의 저주에 조종당하는 태양의 철문 중장갑 수비대를 제압하고 황궁 진입로를 열어라!",
        "speakerName": "이그니스",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "내일 새벽, 우리는 황궁의 옥좌에 진정한 백성들의 깃발을 꽂을 것이다."
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "태양의 철문 저주 수문장",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png"
  },
  {
    "episode": 27,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "두 개의 약속 사이에서",
    "locationKo": "결전 전야 황궁 내궁 정원",
    "oneLineKo": "결전 전야 내궁 정원으로 스며든 섀도우렐름 그림자 자객단을 물리치고 내일 새벽의 깃발을 지켜라!",
    "novelEpisodeUrl": "/book?ep=27",
    "webtoonEpisodeUrl": "/webtoon?ep=27",
    "bookMdUrl": "/book/episode_27.md",
    "coverIllustrationUrl": "/images/webtoon/episode_27/scene_05.webp",
    "prevContextKo": "비취 평의회 최후의 결전을 하루 앞둔 자정, 고요한 내궁 정원에서 세 사람은 저마다 가슴속 깊은 약속을 나눈다.",
    "synopsisKo": "실리아는 전쟁이 끝나면 북방의 봄날 보리밭에서 평범하게 함께 살자는 소박한 소망을 카단에게 고백한다. 한편 홀로 과거의 죄책감을 짊어진 이그니스는 카단에게 자신의 순수한 마나가 담긴 ‘유리 불씨’를 건네며, 무슨 일이 생겨도 대륙과 실리아를 지켜 달라는 비장한 다짐을 남긴 채 야습해 온 암살단과 맞선다.",
    "battleReasonKo": "결전 전야 내궁 정원으로 스며든 섀도우렐름 그림자 자객단을 물리치고 내일 새벽의 깃발을 지켜라!",
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
        "shortCaption": "무슨 일이 생겨도 대륙과 실리아를 지켜 달라는 비장한 다짐을 남긴 채 야습해 온 암살단과 맞선다.",
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
        "shortCaption": "무슨 일이 생겨도 대륙과 실리아를 지켜 달라는 비장한 다짐을 남긴 채 야습해 온 암살단과 맞선다.",
        "shortQuote": "들어라, 카단. 너는 대륙의 백성들을 지킬 방패다. 실리아는 새로운 시대를 이끌…",
        "narration": "한편 홀로 과거의 죄책감을 짊어진 이그니스는 카단에게 자신의 순수한 마나가 담긴 ‘유리 불씨’를 건네며, 무슨 일이 생겨도 대륙과 실리아를 지켜 달라는 비장한 다짐을 남긴 채 야습해 온 암살단과 맞선다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "이것은 내 심장 마나와 연결된 ‘순백의 유리 불씨’다. 루시안은 내일 밤 황제의 옥좌에 나인섀도우의 심연 핵을 설치해 폭주시킬 것이다. 그 핵을 파괴하려면 황실의 정통 화염 혈통인 내 마나를 희생시켜야만 해."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_27/scene_45.webp",
        "shortCaption": "결전 전야 내궁 정원으로 스며든 섀도우렐름 그림자 자객단을 물리치고 내일 새벽의 깃발을 지켜라!",
        "shortQuote": "카단은 드래곤 브레이커 방패를 품에 안고 조용히 눈을 감았다.",
        "narration": "결전 전야 내궁 정원으로 스며든 섀도우렐름 그림자 자객단을 물리치고 내일 새벽의 깃발을 지켜라!",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "바람의 정령들이 길을 인도하고 있어요. 갑시다, 평의회의 대전각으로."
      }
    ],
    "bossHeroClass": "ROGUE",
    "bossNameKo": "내궁 그림자 자객단",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/054_Arachne.png"
  },
  {
    "episode": 28,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "비취 평의회의 반란",
    "locationKo": "황궁 최고 회의장 ‘비취 평의회’ 대전각",
    "oneLineKo": "형제 이그니스의 숭고한 불꽃이 헛되지 않도록, 대전각을 가로막은 데스나이트 아르투스의 맹공을 분쇄하라!",
    "novelEpisodeUrl": "/book?ep=28",
    "webtoonEpisodeUrl": "/webtoon?ep=28",
    "bookMdUrl": "/book/episode_28.md",
    "coverIllustrationUrl": "/images/webtoon/episode_28/scene_05.webp",
    "prevContextKo": "자정의 비취 평의회 대전각—루시안과 데스나이트 아르투스는 수도 전체를 날려버릴 금지된 유물 ‘심연의 핵’을 폭주시키고 있었다!",
    "synopsisKo": "아르투스의 흑요석 대검 맹공을 카단이 드래곤 브레이커 방패로 한 치의 물러섬 없이 받아내는 사이, 임계점에 달한 심연의 핵이 대폭발을 일으키려 한다. 그 순간 이그니스가 형제 카단과 백성들을 결계 밖으로 밀쳐내고 자신의 심장 불꽃을 끝까지 불살라 폭주하는 심연의 핵을 홀로 봉인하며 찬란한 빛 속으로 산화한다.",
    "battleReasonKo": "형제 이그니스의 숭고한 불꽃이 헛되지 않도록, 대전각을 가로막은 데스나이트 아르투스의 맹공을 분쇄하라!",
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
        "shortCaption": "형제 이그니스의 숭고한 불꽃이 헛되지 않도록, 대전각을 가로막은 데스나이트 아르투스의 맹공을 분쇄하라!",
        "shortQuote": "이그니스... 네 희생을 결코 헛되이 하지 않겠다. 네가 목숨으로 지켜낸 이…",
        "narration": "형제 이그니스의 숭고한 불꽃이 헛되지 않도록, 대전각을 가로막은 데스나이트 아르투스의 맹공을 분쇄하라!",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이그니스는 영원히 우리 곁에 있어요. 그가 남긴 빛으로 반드시 새벽을 완성해야 해요."
      }
    ],
    "bossHeroClass": "ROGUE",
    "bossNameKo": "데스나이트 아르투스",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png"
  },
  {
    "episode": 29,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "바람의 여왕",
    "locationKo": "잿빛 새벽의 라이트헤븐 중앙 광장",
    "oneLineKo": "수도 해방 선언식을 피로 물들이려 기습한 맹독 거미 여왕 아라크네를 광장에서 처단하라!",
    "novelEpisodeUrl": "/book?ep=29",
    "webtoonEpisodeUrl": "/webtoon?ep=29",
    "bookMdUrl": "/book/episode_29.md",
    "coverIllustrationUrl": "/images/webtoon/episode_29/scene_05.webp",
    "prevContextKo": "이그니스의 희생으로 수도 라이트헤븐은 파멸을 면했지만, 형제를 잃은 슬픔이 채 가시기도 전에 북방으로 도주한 루시안의 독니가 다시 덮쳐온다.",
    "synopsisKo": "해방된 시민들이 실리아를 새로운 여왕으로 추대하려 하지만, 실리아는 화려한 왕관을 사양하고 민중과 함께 걷는 ‘바람의 벗’으로 남겠다고 선언해 광장을 감동시킨다. 직후 광장 지하에서 기습해 온 루시안 휘하 맹독 암살단장 아라크네를 제압한 카단과 실리아는 이그니스의 유리 불씨를 품고 북방 최후 결전지로 출진한다.",
    "battleReasonKo": "수도 해방 선언식을 피로 물들이려 기습한 맹독 거미 여왕 아라크네를 광장에서 처단하라!",
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
        "shortCaption": "직후 광장 지하에서 기습해 온 루시안 휘하 맹독 암살단장 아라크네를 제압한 카단과 실리아는 이그니스의 유리…",
        "shortQuote": "스승님과 여왕 전하께서 하늘에서 보셨다면 참으로 자랑스러워하셨을 결단이다.",
        "narration": "직후 광장 지하에서 기습해 온 루시안 휘하 맹독 암살단장 아라크네를 제압한 카단과 실리아는 이그니스의 유리 불씨를 품고 북방 최후 결전지로 출진한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "스승님과 여왕 전하께서 하늘에서 보셨다면 참으로 자랑스러워하셨을 결단이다."
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_29/scene_35.webp",
        "shortCaption": "직후 광장 지하에서 기습해 온 루시안 휘하 맹독 암살단장 아라크네를 제압한 카단과 실리아는 이그니스의 유리…",
        "shortQuote": "아라크네가 기괴하게 웃음을 터뜨렸다.",
        "narration": "직후 광장 지하에서 기습해 온 루시안 휘하 맹독 암살단장 아라크네를 제압한 카단과 실리아는 이그니스의 유리 불씨를 품고 북방 최후 결전지로 출진한다.",
        "speakerName": "아라크네",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "형제가 길을 열어주었다. 주저 없이 돌파한다."
      },
      {
        "stageLabel": "4컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_29/scene_47.webp",
        "shortCaption": "수도 해방 선언식을 피로 물들이려 기습한 맹독 거미 여왕 아라크네를 광장에서 처단하라!",
        "shortQuote": "바람은 결코 멈추지 않아요. 우리가 지나간 자리에 반드시 평화로운 꽃이 필 거예요.",
        "narration": "수도 해방 선언식을 피로 물들이려 기습한 맹독 거미 여왕 아라크네를 광장에서 처단하라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "바람은 결코 멈추지 않아요. 우리가 지나간 자리에 반드시 평화로운 꽃이 필 거예요."
      }
    ],
    "bossHeroClass": "WARLOCK",
    "bossNameKo": "맹독 여왕 아라크네",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/054_Arachne.png"
  },
  {
    "episode": 30,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "네 수문의 맹독",
    "locationKo": "북방 방어선 ‘네 수문 요새’",
    "oneLineKo": "하류 백성들에게 맹독 강물을 방류하려는 네 수문 요새의 타락 수문장 아쿠아로드를 제압하라!",
    "novelEpisodeUrl": "/book?ep=30",
    "webtoonEpisodeUrl": "/webtoon?ep=30",
    "bookMdUrl": "/book/episode_30.md",
    "coverIllustrationUrl": "/images/webtoon/episode_30/scene_05.webp",
    "prevContextKo": "루시안의 본거지 검은 늪으로 진격하는 연합군 앞을 절벽 사이 네 개의 거대한 흑철 수문 요새가 가로막는다.",
    "synopsisKo": "메두사 고르고가 수문 상류에 풀어놓은 치명적인 부식 맹독이 강물을 타고 수천 명의 의용군과 피난민을 덮치려 한다! 스승 론돌과 약제사 엘리아나가 해독 수로를 여는 동안, 카단과 실리아는 폭풍우를 가르고 수문 꼭대기로 돌격해 수문장 아쿠아로드와 고르고의 독기 장치를 단숨에 박살 낸다.",
    "battleReasonKo": "하류 백성들에게 맹독 강물을 방류하려는 네 수문 요새의 타락 수문장 아쿠아로드를 제압하라!",
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
        "shortCaption": "카단과 실리아는 폭풍우를 가르고 수문 꼭대기로 돌격해 수문장 아쿠아로드와 고르고의 독기 장치를 단숨에 박살 낸다.",
        "shortQuote": "하하! 뼈다귀 놈들이 북방의 늑대 방패 앞에서 추풍낙엽이로구나! 다음 문으로 가자!",
        "narration": "스승 론돌과 약제사 엘리아나가 해독 수로를 여는 동안, 카단과 실리아는 폭풍우를 가르고 수문 꼭대기로 돌격해 수문장 아쿠아로드와 고르고의 독기 장치를 단숨에 박살 낸다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "하하! 뼈다귀 놈들이 북방의 늑대 방패 앞에서 추풍낙엽이로구나! 다음 문으로 가자!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_30/scene_34.webp",
        "shortCaption": "카단과 실리아는 폭풍우를 가르고 수문 꼭대기로 돌격해 수문장 아쿠아로드와 고르고의 독기 장치를 단숨에 박살 낸다.",
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
        "shortCaption": "하류 백성들에게 맹독 강물을 방류하려는 네 수문 요새의 타락 수문장 아쿠아로드를 제압하라!",
        "shortQuote": "형제가 남겨준 등불을 따라, 최후의 어둠을 심판하러 가자.” 선대 영웅들의 넋과…",
        "narration": "하류 백성들에게 맹독 강물을 방류하려는 네 수문 요새의 타락 수문장 아쿠아로드를 제압하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "형제가 남겨준 등불을 따라, 최후의 어둠을 심판하러 가자."
      }
    ],
    "bossHeroClass": "SHAMAN",
    "bossNameKo": "타락 수문장 아쿠아로드",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/005_Aqualord.png"
  },
  {
    "episode": 31,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "내기에 건 손",
    "locationKo": "검은 늪 외곽 ‘흐르는 모래강’ 도박 요새",
    "oneLineKo": "비열한 인질 사기 도박이 깨지자 본색을 드러낸 모래강 흑마술사 간다르의 군단을 쓸어버려라!",
    "novelEpisodeUrl": "/book?ep=31",
    "webtoonEpisodeUrl": "/webtoon?ep=31",
    "bookMdUrl": "/book/episode_31.md",
    "coverIllustrationUrl": "/images/webtoon/episode_31/scene_05.webp",
    "prevContextKo": "네 수문을 넘어선 연합군은 바닥 없는 유사(流砂)가 흐르는 모래강 도하 다리를 점거한 흑마법 도박사 간다르와 마주한다.",
    "synopsisKo": "간다르는 포로로 잡은 민간인들의 목숨을 담보로 주사위 두 개로 ‘13’을 만들어야만 다리를 내주겠다는 불가능한 사기 도박을 강요한다. 스승 카제의 눈썰미를 떠올린 카단은 주사위가 멈추는 찰나 은빛 단검의 검기만으로 주사위 하나를 반으로 쪼개 ‘6 + 6 + 1 = 13’을 만들어내는 통쾌한 기지로 적의 사기극을 박살 내고 인질들을 구출한다!",
    "battleReasonKo": "비열한 인질 사기 도박이 깨지자 본색을 드러낸 모래강 흑마술사 간다르의 군단을 쓸어버려라!",
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
        "shortCaption": "비열한 인질 사기 도박이 깨지자 본색을 드러낸 모래강 흑마술사 간다르의 군단을 쓸어버려라!",
        "shortQuote": "주사위를 쪼개서 13을 만들다니, 알렉산다르 그 양반보다.",
        "narration": "비열한 인질 사기 도박이 깨지자 본색을 드러낸 모래강 흑마술사 간다르의 군단을 쓸어버려라!",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "주사위를 쪼개서 13을 만들다니, 알렉산다르 그 양반보다 네놈이 한 수 위로구나! 참으로 가슴이 뻥 뚫리는 한판이었다!"
      }
    ],
    "bossHeroClass": "WARLOCK",
    "bossNameKo": "모래강 지배자 간다르",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/069_Gandar.png"
  },
  {
    "episode": 32,
    "actNumber": 4,
    "actTitle": "제4막 · 수도 해방전과 형제의 숭고한 불씨",
    "titleKo": "첫사랑의 메아리",
    "locationKo": "검은 늪 안개림 ‘속삭이는 버드나무 숲’",
    "oneLineKo": "그리운 이의 환영으로 마음을 무너뜨리는 속삭이는 버드나무 숲의 환각 결계 수호자를 파훼하라!",
    "novelEpisodeUrl": "/book?ep=32",
    "webtoonEpisodeUrl": "/webtoon?ep=32",
    "bookMdUrl": "/book/episode_32.md",
    "coverIllustrationUrl": "/images/webtoon/episode_32/scene_05.webp",
    "prevContextKo": "모래강을 건넌 연합군은 천 년 된 고대 버드나무들이 안개 속에 도열한 환각의 숲으로 진입한다.",
    "synopsisKo": "숲을 지배하는 환각 마녀의 주술이 실리아 앞에 돌아가신 어머니 실피드 여왕의 따뜻한 환영을 피워 올려 마음의 빈틈을 파고든다. 환각에 잠식될 위기의 순간, 카단이 불어준 맑고 청아한 북방의 피리 소리가 안개를 산산조각 내고, 두 사람은 봄날 보리밭의 약속을 다시 새기며 심연의 본진 앞으로 나아간다.",
    "battleReasonKo": "그리운 이의 환영으로 마음을 무너뜨리는 속삭이는 버드나무 숲의 환각 결계 수호자를 파훼하라!",
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
        "name": "메두사 고르고",
        "role": "나인섀도우 코덱스를 훔친 암흑 마녀",
        "cutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
        "side": "ENEMY"
      }
    ],
    "scenes": [
      {
        "stageLabel": "1컷 · 발단",
        "illustrationUrl": "/images/webtoon/episode_32/scene_05.webp",
        "shortCaption": "숲을 지배하는 환각 마녀의 주술이 실리아 앞에 돌아가신 어머니 실피드 여왕의 따뜻한 환영을 피워 올려 마음의 빈틈을 파고든다.",
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
        "shortCaption": "그리운 이의 환영으로 마음을 무너뜨리는 속삭이는 버드나무 숲의 환각 결계 수호자를 파훼하라!",
        "shortQuote": "카단이 부드럽게 미소 지으며 대답했다.",
        "narration": "그리운 이의 환영으로 마음을 무너뜨리는 속삭이는 버드나무 숲의 환각 결계 수호자를 파훼하라!",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "봄날의 보리밭 약속, 반드시 지켜주셔야 해요."
      }
    ],
    "bossHeroClass": "PRIEST",
    "bossNameKo": "안개숲의 환각 마녀",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png"
  },
  {
    "episode": 33,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "검은 늪",
    "locationKo": "심연의 심장부 ‘검은 늪 성채’ 정문",
    "oneLineKo": "여섯 스승과 힘을 합쳐 난공불락의 검은 늪 성채 정문 수비군단을 돌파하라!",
    "novelEpisodeUrl": "/book?ep=33",
    "webtoonEpisodeUrl": "/webtoon?ep=33",
    "bookMdUrl": "/book/episode_33.md",
    "coverIllustrationUrl": "/images/webtoon/episode_33/scene_05.webp",
    "prevContextKo": "유황 진흙과 산성 안개가 들끓는 대륙 모든 부패의 종착지, 루시안의 최후 거점 ‘검은 늪 성채’가 마침내 모습을 드러낸다.",
    "synopsisKo": "루시안은 신의 힘으로도 열 수 없다는 거대 흑철 성문을 걸어 잠그고 지하 붕괴 마법진을 가동해 연합군을 생매장하려 한다. 그때 북방에서 달려온 여섯 스승(가웨인·그림리·에일라·엘리아나·카제·론돌)이 제자 카단의 곁에 집결하여 완벽한 6인의 합공으로 난공불락의 성문 빗장을 부수고 돌격로를 연다!",
    "battleReasonKo": "여섯 스승과 힘을 합쳐 난공불락의 검은 늪 성채 정문 수비군단을 돌파하라!",
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
        "name": "루시안",
        "role": "붉은 유리 궁정 재상 · 만악의 근원",
        "cutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
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
        "illustrationUrl": "/images/webtoon/episode_33/scene_05.webp",
        "shortCaption": "루시안은 신의 힘으로도 열 수 없다는 거대 흑철 성문을 걸어 잠그고 지하 붕괴 마법진을 가동해 연합군을 생매장하려 한다.",
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
        "shortCaption": "여섯 스승과 힘을 합쳐 난공불락의 검은 늪 성채 정문 수비군단을 돌파하라!",
        "shortQuote": "성문이 열렸어요! 루시안이 있는 중앙 대회랑으로 돌격해요!",
        "narration": "여섯 스승과 힘을 합쳐 난공불락의 검은 늪 성채 정문 수비군단을 돌파하라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "성문이 열렸어요! 루시안이 있는 중앙 대회랑으로 돌격해요!"
      }
    ],
    "bossHeroClass": "WARRIOR",
    "bossNameKo": "검은 늪 성문 거신병단",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/013_Belphegor.png"
  },
  {
    "episode": 34,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "쓰러진 바람섬",
    "locationKo": "붕괴하는 검은 성채 지하 용암 회랑",
    "oneLineKo": "무너지는 용암 회랑에서 스승들이 열어준 생명의 통로를 가로막는 심연 파멸군을 일소하라!",
    "novelEpisodeUrl": "/book?ep=34",
    "webtoonEpisodeUrl": "/webtoon?ep=34",
    "bookMdUrl": "/book/episode_34.md",
    "coverIllustrationUrl": "/images/webtoon/episode_34/scene_05.webp",
    "prevContextKo": "성채 내부로 진입하자 루시안이 가동한 ‘대륙 붕괴의 룬’으로 천장의 유황 암석이 쏟아지고 바닥이 용암 속으로 무너져 내린다.",
    "synopsisKo": "제자 카단과 실리아를 최상층 파멸의 제단으로 올려보내기 위해, 여섯 스승들이 기꺼이 무너지는 거대 석주 아래에 남아 어깨와 무기로 천장을 떠받친다! ‘대륙의 미래를 부탁한다, 우리의 자랑스러운 제자여!’ 스승들의 숭고한 외침을 등 뒤로 삼킨 채 카단은 피눈물을 머금고 나선 계단 끝으로 질주한다.",
    "battleReasonKo": "무너지는 용암 회랑에서 스승들이 열어준 생명의 통로를 가로막는 심연 파멸군을 일소하라!",
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
        "name": "데스나이트 아르투스",
        "role": "섀도우렐름 섭정 · 죽음의 기사",
        "cutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
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
        "shortCaption": "우리의 자랑스러운 제자여!’ 스승들의 숭고한 외침을 등 뒤로 삼킨 채 카단은 피눈물을 머금고 나선 계단 끝으로 질주한다.",
        "shortQuote": "그림리 스승님! 안 됩니다! 기둥이 무너지면 빠져나올 수 없습니다!",
        "narration": "‘대륙의 미래를 부탁한다, 우리의 자랑스러운 제자여!’ 스승들의 숭고한 외침을 등 뒤로 삼킨 채 카단은 피눈물을 머금고 나선 계단 끝으로 질주한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "그림리 스승님! 안 됩니다! 기둥이 무너지면 빠져나올 수 없습니다!"
      },
      {
        "stageLabel": "3컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_34/scene_35.webp",
        "shortCaption": "우리의 자랑스러운 제자여!’ 스승들의 숭고한 외침을 등 뒤로 삼킨 채 카단은 피눈물을 머금고 나선 계단 끝으로 질주한다.",
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
        "shortCaption": "무너지는 용암 회랑에서 스승들이 열어준 생명의 통로를 가로막는 심연 파멸군을 일소하라!",
        "shortQuote": "카단이 방패를 앞으로 겨누며 선언했다.",
        "narration": "무너지는 용암 회랑에서 스승들이 열어준 생명의 통로를 가로막는 심연 파멸군을 일소하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "루시안, 네놈의 시대는 끝났다. 여섯 스승들의 영혼과 이그니스의 맹세가 지금 네놈의 목을 벨 것이다."
      }
    ],
    "bossHeroClass": "SHAMAN",
    "bossNameKo": "용암 회랑 파멸 수호대",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png"
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
    "synopsisKo": "슬픔의 틈을 노리고 안개 속에서 다섯 개의 분신으로 나뉜 데스나이트 아르투스의 흑요석 대검이 동시에 카단의 심장을 찌른다! 그러나 12살 폭우 동굴에서 배운 가웨인의 가르침을 기억한 카단은 환청을 차단하고 진짜 살기의 무게중심 단 하나를 간파해 아르투스의 마검을 두 동강 낸다.",
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
        "shortCaption": "슬픔의 틈을 노리고 안개 속에서 다섯 개의 분신으로 나뉜 데스나이트 아르투스의 흑요석 대검이 동시에 카단의 심장을 찌른다!",
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
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png"
  },
  {
    "episode": 36,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "십자 흉터의 지도",
    "locationKo": "검은 성채 최상층 ‘별빛의 기록실’",
    "oneLineKo": "별빛의 기록실 제단 통로를 봉쇄한 나인섀도우 고위 비전 마도사단을 격파하라!",
    "novelEpisodeUrl": "/book?ep=36",
    "webtoonEpisodeUrl": "/webtoon?ep=36",
    "bookMdUrl": "/book/episode_36.md",
    "coverIllustrationUrl": "/images/webtoon/episode_36/scene_04.webp",
    "prevContextKo": "환영 회랑을 넘어 도달한 별빛의 기록실 천장 아래에는 대륙 전체의 마나 맥동이 실시간으로 흐르는 거대한 고대 성도가 펼쳐져 있었다.",
    "synopsisKo": "실리아는 성도 위에 새겨진 선대 스승들의 암호를 해독해 북방의 눈꽃·대해의 바람·황실의 성화·대지의 방패 네 힘이 교차하는 십자 중심점이 바로 루시안의 파멸 제단임을 밝혀낸다! 같은 시각 성채 하층부에서는 북방의 정복왕 펜릴과 길가메시가 이끄는 백은 늑대 기병대가 당도해 승리의 뿔피리를 울린다.",
    "battleReasonKo": "별빛의 기록실 제단 통로를 봉쇄한 나인섀도우 고위 비전 마도사단을 격파하라!",
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
        "shortCaption": "별빛의 기록실 제단 통로를 봉쇄한 나인섀도우 고위 비전 마도사단을 격파하라!",
        "shortQuote": "카단이 부드럽게 미소 지으며 대답했다.",
        "narration": "별빛의 기록실 제단 통로를 봉쇄한 나인섀도우 고위 비전 마도사단을 격파하라!",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "우리의 신념이 대륙의 어둠을 밝힐 거예요."
      }
    ],
    "bossHeroClass": "MAGE",
    "bossNameKo": "별빛 기록실 암흑 마도사단",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/069_Gandar.png"
  },
  {
    "episode": 37,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "패왕의 전쟁",
    "locationKo": "검은 성채 외곽 협곡 & 최상층 계단",
    "oneLineKo": "파멸의 제단 옥좌 홀 직전을 가로막는 루시안의 불사 ‘사령 기사단’ 정예를 돌파하라!",
    "novelEpisodeUrl": "/book?ep=37",
    "webtoonEpisodeUrl": "/webtoon?ep=37",
    "bookMdUrl": "/book/episode_37.md",
    "coverIllustrationUrl": "/images/webtoon/episode_37/scene_04.webp",
    "prevContextKo": "성채 아래 협곡에서는 북방 패왕 펜릴의 백은 늑대 기병대가 루시안의 최후 친위대 ‘사령 기사단’을 상대로 장엄한 전면전을 벌인다.",
    "synopsisKo": "‘알렉산다르의 아들이 꼭대기에서 싸우고 있다, 단 한 마리의 마수도 올려보내지 마라!’ 펜릴의 포효 속에 상층 계단을 오른 카단과 실리아는 이성을 잃고 조종당하는 기사들을 단 한 명의 부당한 살상도 없이 방패와 질풍만으로 무장 해체시키며 마침내 옥좌 홀 문 앞에 당도한다.",
    "battleReasonKo": "파멸의 제단 옥좌 홀 직전을 가로막는 루시안의 불사 ‘사령 기사단’ 정예를 돌파하라!",
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
        "shortCaption": "파멸의 제단 옥좌 홀 직전을 가로막는 루시안의 불사 ‘사령 기사단’ 정예를 돌파하라!",
        "shortQuote": "어둠의 밤을 끝내고 봄을 맞이할 시간이다.",
        "narration": "파멸의 제단 옥좌 홀 직전을 가로막는 루시안의 불사 ‘사령 기사단’ 정예를 돌파하라!",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "어둠의 밤을 끝내고 봄을 맞이할 시간이다."
      }
    ],
    "bossHeroClass": "PALADIN",
    "bossNameKo": "루시안 친위 사령 기사단",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png"
  },
  {
    "episode": 38,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "세 개의 명주 봉인",
    "locationKo": "파멸의 제단 최정상 흑요석 옥좌 홀",
    "oneLineKo": "부모 세대와 이그니스, 스승들의 모든 염원을 담아 심연의 괴물로 타락한 원흉 루시안·벨페고르 융합체를 심판하라!",
    "novelEpisodeUrl": "/book?ep=38",
    "webtoonEpisodeUrl": "/webtoon?ep=38",
    "bookMdUrl": "/book/episode_38.md",
    "coverIllustrationUrl": "/images/webtoon/episode_38/scene_05.webp",
    "prevContextKo": "마침내 마주한 최정상 옥좌 홀—최고 재상 루시안은 인간의 형상을 완전히 버리고 심연의 군주 벨페고르의 마력을 삼켜 괴물로 변이해 있었다!",
    "synopsisKo": "대륙 전체를 심연으로 침몰시킬 ‘세 개의 명주 봉인’이 풀려나는 절체절명의 순간! 실리아의 녹옥 질풍이 첫 봉인을 찢고, 카단의 드래곤 브레이커 방패가 두 번째 봉인을 부수며, 마지막 세 번째 암흑 결계는 카단의 품속에서 타오른 이그니스의 ‘유리 불씨’가 은빛 단검과 공명해 찬란한 빛의 폭풍으로 『나인섀도우 코덱스』를 영원히 소멸시킨다!",
    "battleReasonKo": "부모 세대와 이그니스, 스승들의 모든 염원을 담아 심연의 괴물로 타락한 원흉 루시안·벨페고르 융합체를 심판하라!",
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
        "name": "루시안",
        "role": "붉은 유리 궁정 재상 · 만악의 근원",
        "cutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
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
        "shortCaption": "부모 세대와 이그니스, 스승들의 모든 염원을 담아 심연의 괴물로 타락한 원흉 루시안·벨페고르 융합체를 심판하라!",
        "shortQuote": "카단이 폭주하는 루시안의 마나 폭풍을 향해 쐐기처럼 돌진했다.",
        "narration": "부모 세대와 이그니스, 스승들의 모든 염원을 담아 심연의 괴물로 타락한 원흉 루시안·벨페고르 융합체를 심판하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "우리가 지켜낸 생명의 이름으로, 어둠의 심장을 꿰뚫는다!"
      }
    ],
    "bossHeroClass": "WARLOCK",
    "bossNameKo": "심연화신 루시안 & 벨페고르",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png"
  },
  {
    "episode": 39,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "지킬 만한 가치가 있는 세상",
    "locationKo": "새벽빛이 내리는 파멸의 제단 정상",
    "oneLineKo": "전쟁의 마지막 망령으로 일어난 고대 죽음의 기사에게 참된 기사의 안식을 선사하고 새벽을 완성하라!",
    "novelEpisodeUrl": "/book?ep=39",
    "webtoonEpisodeUrl": "/webtoon?ep=39",
    "bookMdUrl": "/book/episode_39.md",
    "coverIllustrationUrl": "/images/webtoon/episode_39/scene_05.webp",
    "prevContextKo": "세 개의 명주 봉인이 박살 나고 칠흑 같던 먹구름이 걷히며 동쪽 대해 수평선 너머로 황금빛 새벽 햇살이 대륙을 비추기 시작한다.",
    "synopsisKo": "그러나 무너진 옥좌 뒤편에서 마지막 망념에 사로잡힌 고대 죽음의 기사가 부러진 대검을 끌며 일어난다. 카단은 증오 대신 기사의 안식을 빌어주는 정결한 방패술로 마지막 어둠을 잠재워 무릎 꿇리고, 바닥을 기며 목숨을 구걸하는 루시안을 사적 복수 대신 역사와 법의 심판대에 넘긴다.",
    "battleReasonKo": "전쟁의 마지막 망령으로 일어난 고대 죽음의 기사에게 참된 기사의 안식을 선사하고 새벽을 완성하라!",
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
        "shortCaption": "전쟁의 마지막 망령으로 일어난 고대 죽음의 기사에게 참된 기사의 안식을 선사하고 새벽을 완성하라!",
        "shortQuote": "카단이 방패를 거두며 고개를 끄덕였다.",
        "narration": "전쟁의 마지막 망령으로 일어난 고대 죽음의 기사에게 참된 기사의 안식을 선사하고 새벽을 완성하라!",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "우리가 지켜낸 세상이에요. 이제 모든 상처를 보듬고 새로운 이야기를 시작해요."
      }
    ],
    "bossHeroClass": "PRIEST",
    "bossNameKo": "최후의 고대 죽음의 기사",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png"
  },
  {
    "episode": 40,
    "actNumber": 5,
    "actTitle": "제5막 · 검은 성채 결전과 새벽의 귀향",
    "titleKo": "영웅이라 불리지 않는 자",
    "locationKo": "재건된 수도 라이트헤븐 & 엘윈 설원 보리밭 오두막",
    "oneLineKo": "대단원의 피날레—바람섬과 북방, 왕도의 모든 전우들과 함께 평화의 시대를 여는 영광의 기념 대련에서 승리하라!",
    "novelEpisodeUrl": "/book?ep=40",
    "webtoonEpisodeUrl": "/webtoon?ep=40",
    "bookMdUrl": "/book/episode_40.md",
    "coverIllustrationUrl": "/images/webtoon/episode_40/scene_05.webp",
    "prevContextKo": "전쟁이 끝나고 한 달 뒤, 평화를 되찾은 수도 라이트헤븐 광장에 수만 명의 백성이 구국의 영웅을 맞이하기 위해 운집한다.",
    "synopsisKo": "황실은 대륙 최고 원수의 직위와 공작 작위, 무수한 황금을 내리려 하지만, 카단과 실리아는 모든 권력과 영예를 조용히 사양한다. 두 사람은 전쟁 전 어머니 엘윈이 차가운 설원에 심었던 밀밭으로 돌아가, 전설의 방패를 오두막 지붕 삼아 흙을 일구고 다친 길손을 맞이하는 따뜻하고 평범한 ‘사람’으로서의 새로운 삶을 시작한다. (40화 완주 시 다음 차원 ‘환생’ 개방!)",
    "battleReasonKo": "대단원의 피날레—바람섬과 북방, 왕도의 모든 전우들과 함께 평화의 시대를 여는 영광의 기념 대련에서 승리하라!",
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
        "shortCaption": "대단원의 피날레—바람섬과 북방, 왕도의 모든 전우들과 함께 평화의 시대를 여는 영광의 기념 대련에서 승리하라!",
        "shortQuote": "스승님, 아버지... 그리고 이그니스. 약속대로 이 땅에 봄을 데려왔습니다.…",
        "narration": "대단원의 피날레—바람섬과 북방, 왕도의 모든 전우들과 함께 평화의 시대를 여는 영광의 기념 대련에서 승리하라!",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "스승님, 아버지... 그리고 이그니스. 약속대로 이 땅에 봄을 데려왔습니다. 이제 이곳에서 흙을 일구고, 다친 길손들의 발을 씻겨주며 살아가겠습니다."
      }
    ],
    "bossHeroClass": "PALADIN",
    "bossNameKo": "전설의 성기사 환영 수련전",
    "bossCutoutUrl": "/anime-character-sheets/cutouts/049_Hercul.png"
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

  // Shuffle all unique owned cards evenly so every owned card across all 11 factions has an equal chance to appear!
  // Put a slight priority mix so cards with combat stats & multipliers are always well-represented alongside others
  const poolIds = ownedCards.map((c) => c.id);
  for (let i = poolIds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [poolIds[i], poolIds[j]] = [poolIds[j], poolIds[i]];
  }

  // Build a balanced 36-card Journey deck drawing evenly across all owned cards (ensuring good mana curve too)
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

  // Fill up to at least 30 cards if collection is somehow tiny
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
 * 회차 및 환생 난이도에 맞춰 적 보스의 덱 또한 점점 고급(희귀·영웅·전설) 하수인 위주로 강화됨
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
  const elitePool = allCards.filter(
    (c) =>
      hasCombatStatsForJourney(c) &&
      (c.cardClass === bossClass || c.cardClass === 'NEUTRAL') &&
      (episode >= 12 || reincarnation > 0
        ? c.rarity === 'RARE' || c.rarity === 'EPIC' || c.rarity === 'LEGENDARY'
        : c.rarity === 'COMMON' || c.rarity === 'RARE' || c.rarity === 'EPIC'),
  );

  if (elitePool.length === 0) return baseDeck;

  const replaceCount = Math.min(22, Math.floor((episode - 1) * 0.55) + reincarnation * 8);
  const upgraded = [...baseDeck];
  for (let i = 0; i < replaceCount; i += 1) {
    const pick = elitePool[(episode * 7 + i * 13 + reincarnation * 19) % elitePool.length];
    upgraded[i % upgraded.length] = pick.id;
  }
  return upgraded;
}
