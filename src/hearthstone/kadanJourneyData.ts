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
  narrationAudioUrl: string;
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
    "coverIllustrationUrl": "/images/webtoon/episode_01/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_01/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep01_cut1.mp3",
        "shortCaption": "패전 후 설원의 엘윈 마을에 숨어 살던 옛 성기사 알렉산다르와 발리안은 곧 태어날 두 아이를 기다리고 있었다.",
        "shortQuote": "섀도우렐름의 사냥개라면 이름을 밝힐 시간조차 아까울 텐데.",
        "narration": "패전 후 설원의 엘윈 마을에 숨어 살던 옛 성기사 알렉산다르와 발리안은 곧 태어날 두 아이를 기다리고 있었다.",
        "speakerName": "발리안",
        "speakerRole": "이그니스의 친아들 아버지 · 아케 창술사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/043_Balian.png",
        "quote": "섀도우렐름의 사냥개라면 이름을 밝힐 시간조차 아까울 텐데."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_01/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep01_cut2.mp3",
        "shortCaption": "순례 성기사 헤르쿨이 주막을 찾아와, 훗날 아이들의 운명을 이어줄 룬 은빛 단검 한 쌍을 선물한다.",
        "shortQuote": "아이들이 태어나면 이 은빛 단검을 하나씩 건네주게.",
        "narration": "순례 성기사 헤르쿨이 주막을 찾아와, 훗날 아이들의 운명을 이어줄 룬 은빛 단검 한 쌍을 선물한다.",
        "speakerName": "헤르쿨",
        "speakerRole": "은빛 단검을 전한 순례 성기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
        "quote": "아이들이 태어나면 이 은빛 단검을 하나씩 건네주게."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_01/scene_26.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep01_cut3.mp3",
        "shortCaption": "그러나 사흘 뒤, 만삭의 엘윈을 탐낸 궁정 귀족 루시안이 마을에 반역 누명을 씌워 토벌대를 이끌고 급습한다.",
        "shortQuote": "알렉산다르! 칼을 버리고 무릎을 꿇어라! 네놈이 반역을 자백한다면 저 계집의…",
        "narration": "그러나 사흘 뒤, 만삭의 엘윈을 탐낸 궁정 귀족 루시안이 마을에 반역 누명을 씌워 토벌대를 이끌고 급습한다.",
        "speakerName": "루시안",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "알렉산다르! 칼을 버리고 무릎을 꿇어라! 네놈이 반역을 자백한다면 저 계집의 목숨만은 살려 두겠다!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_01/scene_37.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep01_cut4.mp3",
        "shortCaption": "불길 속에서 발리안 일행이 쓰러지자, 알렉산다르는 아내 엘윈과 뱃속의 카단을 북방 설원으로 먼저 탈출시킨다.",
        "shortQuote": "이셀라, 살아남아야 해!",
        "narration": "불길 속에서 발리안 일행이 쓰러지자, 알렉산다르는 아내 엘윈과 뱃속의 카단을 북방 설원으로 먼저 탈출시킨다.",
        "speakerName": "발리안",
        "speakerRole": "이그니스의 친아들 아버지 · 아케 창술사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/043_Balian.png",
        "quote": "이셀라, 살아남아야 해!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_01/scene_46.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep01_cut5.mp3",
        "shortCaption": "가족이 무사히 달아날 시간을 벌기 위해, 알렉산다르는 불타는 외나무다리 위에서 홀로 야심가 루시안과 맞선다.",
        "shortQuote": "다만 어떤 불의와 거짓 앞에서도 비겁하게 고개를 숙이지 않는 사람으로 자라다오.",
        "narration": "가족이 무사히 달아날 시간을 벌기 위해, 알렉산다르는 불타는 외나무다리 위에서 홀로 야심가 루시안과 맞선다.",
        "speakerName": "알렉산다르",
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
    "coverIllustrationUrl": "/images/webtoon/episode_02/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_02/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep02_cut1.mp3",
        "shortCaption": "불타버린 엘윈 마을에 뒤늦게 도착한 헤르쿨은 왕실 병기 파편을 단서 삼아 남쪽 세븐브리지 항구로 추적에 나선다.",
        "shortQuote": "이것은 국경을 지키는 라이트헤븐 정예 사령부의 문장...",
        "narration": "불타버린 엘윈 마을에 뒤늦게 도착한 헤르쿨은 왕실 병기 파편을 단서 삼아 남쪽 세븐브리지 항구로 추적에 나선다.",
        "speakerName": "헤르쿨",
        "speakerRole": "은빛 단검을 전한 순례 성기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/049_Hercul.png",
        "quote": "이것은 국경을 지키는 라이트헤븐 정예 사령부의 문장... 외부의 적이 아니라, 왕국 내부의 권력자가 설계를 주도했다는 명백한 증거다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_02/scene_13.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep02_cut2.mp3",
        "shortCaption": "부둣가에서 전쟁고아 노예선을 쫓던 헤르쿨은 변방의 일곱 추적자들과 마주쳐 서로를 궁정의 첩자로 오해한다.",
        "shortQuote": "잠깐, 그림리! 저자의 발소리에는 죄 없는 자를 해치려는 살기가 실려 있지 않다!",
        "narration": "부둣가에서 전쟁고아 노예선을 쫓던 헤르쿨은 변방의 일곱 추적자들과 마주쳐 서로를 궁정의 첩자로 오해한다.",
        "speakerName": "가웨인",
        "speakerRole": "일곱 추적자 수장 · 맹인 음파 무인",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "quote": "잠깐, 그림리! 저자의 발소리에는 죄 없는 자를 해치려는 살기가 실려 있지 않다!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_02/scene_25.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep02_cut3.mp3",
        "shortCaption": "일곱 추적자의 선봉인 드워프 대장장이 그림리가 거대한 무쇠 망치를 휘두르며 헤르쿨의 앞길을 가로막는다.",
        "shortQuote": "기사님, 제발 멈추세요!",
        "narration": "일곱 추적자의 선봉인 드워프 대장장이 그림리가 거대한 무쇠 망치를 휘두르며 헤르쿨의 앞길을 가로막는다.",
        "speakerName": "구출된 아이",
        "speakerRole": "일곱 추적자 수장 · 맹인 음파 무인",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "quote": "우리는 대륙의 그림자 속을 걷는 거친 사냥꾼들이오. 하지만 의로운 영웅의 피가 북풍 속에서 얼어 죽는 꼴은 차마 두고 볼 수 없지."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_02/scene_35.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep02_cut4.mp3",
        "shortCaption": "구출된 소녀의 증언으로 오해를 푼 이들은, 북방의 카단과 남방의 이그니스를 각각 찾아 기르기로 맹세한다.",
        "shortQuote": "좋아요. 우리 일곱 사람이 북방의 유목민 천막들을 샅샅이 뒤져 알렉산다르의…",
        "narration": "구출된 소녀의 증언으로 오해를 푼 이들은, 북방의 카단과 남방의 이그니스를 각각 찾아 기르기로 맹세한다.",
        "speakerName": "에일라",
        "speakerRole": "일곱 추적자 · 동료 위해 산화한 곡예사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/048_Robinyard.png",
        "quote": "대륙의 독초를 가려내고 상처를 싸매는 치유의 지혜도 내가 온전히 전수하겠어요."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_02/scene_44.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep02_cut5.mp3",
        "shortCaption": "18년 뒤의 재회를 약조하기에 앞서, 헤르쿨은 대장장이 그림리와 정정당당한 무예 대결로 성기사의 신의를 증명한다.",
        "shortQuote": "좋소! 승패를 떠나, 두 아이가 부모의 숭고한 뜻을 이어받아 이 썩어빠진 대륙을…",
        "narration": "18년 뒤의 재회를 약조하기에 앞서, 헤르쿨은 대장장이 그림리와 정정당당한 무예 대결로 성기사의 신의를 증명한다.",
        "speakerName": "헤르쿨",
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
    "coverIllustrationUrl": "/images/webtoon/episode_03/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_03/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep03_cut1.mp3",
        "shortCaption": "알렉산다르의 아들을 찾아 북방으로 향하던 일곱 추적자는 칠흑 같은 독안개가 깔린 미스트폴 폐신전에 발이 묶인다.",
        "shortQuote": "살아 있는 생명체에서 억지로 마나를 뽑아내어 시체처럼 결정을 굳히는 금지된 흑마술의 흔적이에요.",
        "narration": "알렉산다르의 아들을 찾아 북방으로 향하던 일곱 추적자는 칠흑 같은 독안개가 깔린 미스트폴 폐신전에 발이 묶인다.",
        "speakerName": "엘리아나",
        "speakerRole": "일곱 추적자 · 약제사 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/063_Eliana.png",
        "quote": "살아 있는 생명체에서 억지로 마나를 뽑아내어 시체처럼 결정을 굳히는 금지된 흑마술의 흔적이에요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_03/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep03_cut2.mp3",
        "shortCaption": "그곳에는 금지된 마도서 나인섀도우 코덱스를 훔쳐 달아난 암흑마녀 고르고와 흑요석 괴인 벨페고르가 도사리고 있었다.",
        "shortQuote": "어떤 놈이든 내 망치 앞에 걸리면 대가리가 모루에 달군 쇳덩이 꼴이 날 게다.",
        "narration": "그곳에는 금지된 마도서 나인섀도우 코덱스를 훔쳐 달아난 암흑마녀 고르고와 흑요석 괴인 벨페고르가 도사리고 있었다.",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "어떤 놈이든 내 망치 앞에 걸리면 대가리가 모루에 달군 쇳덩이 꼴이 날 게다."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_03/scene_27.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep03_cut3.mp3",
        "shortCaption": "천장을 부수고 덮쳐온 벨페고르의 기습과 그림자 봉쇄 속에서 일곱 추적자는 절체절명의 전멸 위기에 몰린다.",
        "shortQuote": "숨을 참아라! 이 독안개는 폐부를 태워 마나를 말려 버린다!",
        "narration": "천장을 부수고 덮쳐온 벨페고르의 기습과 그림자 봉쇄 속에서 일곱 추적자는 절체절명의 전멸 위기에 몰린다.",
        "speakerName": "엘리아나",
        "speakerRole": "일곱 추적자 · 약제사 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/063_Eliana.png",
        "quote": "숨을 참아라! 이 독안개는 폐부를 태워 마나를 말려 버린다!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_03/scene_39.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep03_cut4.mp3",
        "shortCaption": "그 순간 곡예사 로비냐드가 동료를 살리기 위해 스스로 몸을 던져 벨페고르를 붙잡고 장렬히 산화한다.",
        "shortQuote": "형제들이여... 울지 마라. 내 목숨 하나로 괴물을 꺾었으니 남는 장사 아닌가.",
        "narration": "그 순간 곡예사 로비냐드가 동료를 살리기 위해 스스로 몸을 던져 벨페고르를 붙잡고 장렬히 산화한다.",
        "speakerName": "로비냐드",
        "speakerRole": "일곱 추적자 · 동료 위해 산화한 곡예사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/048_Robinyard.png",
        "quote": "형제들이여... 울지 마라. 내 목숨 하나로 괴물을 꺾었으니 남는 장사 아닌가."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_03/scene_48.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep03_cut5.mp3",
        "shortCaption": "수장 가웨인과 남은 여섯 스승은 동료의 희생을 헛되이 하지 않기 위해 분노의 합공으로 벨페고르를 심판한다.",
        "shortQuote": "우리는 이제 일곱이 아니라 여섯이다.",
        "narration": "수장 가웨인과 남은 여섯 스승은 동료의 희생을 헛되이 하지 않기 위해 분노의 합공으로 벨페고르를 심판한다.",
        "speakerName": "그림리",
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
    "coverIllustrationUrl": "/images/webtoon/episode_04/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_04/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep04_cut1.mp3",
        "shortCaption": "여섯 번의 혹한이 흐른 북방 설원에서, 카단은 어머니 엘윈의 품 아래 마나는 더디지만 속 깊은 소년으로 자라났다.",
        "shortQuote": "어머니, 오늘 울타리를 고치다가 눈더미에 갇혀 얼어 죽어가는 새끼 늑대를 보았어요.",
        "narration": "여섯 번의 혹한이 흐른 북방 설원에서, 카단은 어머니 엘윈의 품 아래 마나는 더디지만 속 깊은 소년으로 자라났다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "어머니, 오늘 울타리를 고치다가 눈더미에 갇혀 얼어 죽어가는 새끼 늑대를 보았어요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_04/scene_13.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep04_cut2.mp3",
        "shortCaption": "어느 눈보라 치는 날, 북방 정복왕 펜릴의 어린 아들 길가메시가 흑랑 암살단의 기습을 받아 고립된다.",
        "shortQuote": "착하구나, 카단. 생명을 귀하게 여기는 마음이야말로 그 어떤 마법보다 위대한…",
        "narration": "어느 눈보라 치는 날, 북방 정복왕 펜릴의 어린 아들 길가메시가 흑랑 암살단의 기습을 받아 고립된다.",
        "speakerName": "엘윈",
        "speakerRole": "북방 백은 늑대 부족의 패왕",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/081_Fenrir.png",
        "quote": "그럼, 카단. 굳센 나무는 가장 혹독한 칼바람 속에서 가장 깊은 뿌리를 내리는 법이란다."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_04/scene_24.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep04_cut3.mp3",
        "shortCaption": "무기조차 없던 어린 카단은 주저 없이 눈보라 속으로 뛰어들어 부상당한 길가메시를 등에 업고 살얼음 강을 건넌다.",
        "shortQuote": "어린놈이 어찌 목숨을 버릴 각오로 내 아들을 살려냈느냐? 보물이나 황금을 원하느냐?",
        "narration": "무기조차 없던 어린 카단은 주저 없이 눈보라 속으로 뛰어들어 부상당한 길가메시를 등에 업고 살얼음 강을 건넌다.",
        "speakerName": "정복왕 펜릴",
        "speakerRole": "북방 백은 늑대 부족의 패왕",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/081_Fenrir.png",
        "quote": "어린놈이 어찌 목숨을 버릴 각오로 내 아들을 살려냈느냐? 보물이나 황금을 원하느냐?"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_04/scene_34.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep04_cut4.mp3",
        "shortCaption": "허벅지에 독화살이 스치는 고통 속에서도 끝까지 친구를 놓지 않은 카단 앞에 은빛 단검을 따라온 여섯 스승이 당도한다.",
        "shortQuote": "살아 있었구나, 아이야...",
        "narration": "허벅지에 독화살이 스치는 고통 속에서도 끝까지 친구를 놓지 않은 카단 앞에 은빛 단검을 따라온 여섯 스승이 당도한다.",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "살아 있었구나, 아이야... 알렉산다르의 부러진 검과 이 은빛 단검의 주인을 찾아, 우리가 대륙의 절반을 가로질러 왔단다."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_04/scene_43.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep04_cut5.mp3",
        "shortCaption": "등에 업은 친구 길가메시를 지켜내기 위해, 카단은 살얼음 협곡을 추격해 온 암살대장 카르그에게 맞선다.",
        "shortQuote": "부인, 우리는 로비냐드의 목숨과 바꾼 맹세를 지키러 왔습니다.",
        "narration": "등에 업은 친구 길가메시를 지켜내기 위해, 카단은 살얼음 협곡을 추격해 온 암살대장 카르그에게 맞선다.",
        "speakerName": "가웨인",
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
    "coverIllustrationUrl": "/images/webtoon/episode_05/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_05/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep05_cut1.mp3",
        "shortCaption": "여섯 스승의 제자가 되어 6년간 혹독한 수련을 거친 열두 살 카단은 폭우를 피해 종유석 동굴에 머문다.",
        "shortQuote": "단순한 가을비가 아니에요.",
        "narration": "여섯 스승의 제자가 되어 6년간 혹독한 수련을 거친 열두 살 카단은 폭우를 피해 종유석 동굴에 머문다.",
        "speakerName": "에일라",
        "speakerRole": "일곱 추적자 · 백발백중 석궁 명사수",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/070_Aila.png",
        "quote": "단순한 가을비가 아니에요. 마나의 결이 불길하게 뒤틀리고 있어요. 저 먹구름 뒤편에서 누군가 인위적으로 흑마술의 장막을 부르고 있습니다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_05/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep05_cut2.mp3",
        "shortCaption": "그 밤, 로비냐드의 원수인 암흑마녀 메두사 고르고가 빗소리와 흑암 연막에 숨어 카단의 목덜미를 노리고 침투한다.",
        "shortQuote": "눈을 감아라, 카단! 저 마녀는 네가 바라보는 시야 안에 존재하지 않는다!",
        "narration": "그 밤, 로비냐드의 원수인 암흑마녀 메두사 고르고가 빗소리와 흑암 연막에 숨어 카단의 목덜미를 노리고 침투한다.",
        "speakerName": "에일라",
        "speakerRole": "일곱 추적자 · 백발백중 석궁 명사수",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/070_Aila.png",
        "quote": "눈을 감아라, 카단! 저 마녀는 네가 바라보는 시야 안에 존재하지 않는다!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_05/scene_27.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep05_cut3.mp3",
        "shortCaption": "칠흑 같은 연막에 시야가 완전히 차단되자, 스승들의 포위망마저 흔들리며 보이지 않는 독니가 카단에게 다가온다.",
        "shortQuote": "로비냐드의 원수를 갚을 날이 왔다, 이 마녀 녀석!",
        "narration": "칠흑 같은 연막에 시야가 완전히 차단되자, 스승들의 포위망마저 흔들리며 보이지 않는 독니가 카단에게 다가온다.",
        "speakerName": "메두사 고르고",
        "speakerRole": "나인섀도우 코덱스를 훔친 암흑 마녀",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png",
        "quote": "로비냐드의 원수를 갚을 날이 왔다, 이 마녀 녀석!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_05/scene_38.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep05_cut4.mp3",
        "shortCaption": "맹인 스승 가웨인의 일갈을 들은 카단은 두 눈을 감고 빗방울이 비껴가는 미세한 바람의 결을 온몸으로 읽어낸다.",
        "shortQuote": "입 닥쳐라!” 그림리가 망치를 던졌으나 고르고는 거친 지하 급류 속으로 몸을…",
        "narration": "맹인 스승 가웨인의 일갈을 들은 카단은 두 눈을 감고 빗방울이 비껴가는 미세한 바람의 결을 온몸으로 읽어낸다.",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 백발백중 석궁 명사수",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/070_Aila.png",
        "quote": "그렇다면 네가 더 강해져야 한단다, 카단. 남을 지키는 방패는 그저 기다린다고 주어지는 것이 아니니까. 네 아버지가 남긴 은빛 단검의 진실을 증명하려면 말이다."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_05/scene_47.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep05_cut5.mp3",
        "shortCaption": "어둠 속에서 살기의 궤적을 포착한 카단은 은빛 단검을 뽑아 유령처럼 덮쳐오는 메두사 고르고를 정면으로 받아친다.",
        "shortQuote": "상처를 두려워하지 마라. 아문 상처는 살갗보다 더 단단한 갑옷이 되는 법이란다.",
        "narration": "어둠 속에서 살기의 궤적을 포착한 카단은 은빛 단검을 뽑아 유령처럼 덮쳐오는 메두사 고르고를 정면으로 받아친다.",
        "speakerName": "엘리아나",
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
    "coverIllustrationUrl": "/images/webtoon/episode_06/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_06/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep06_cut1.mp3",
        "shortCaption": "여섯 스승의 각기 다른 비전을 한꺼번에 익히던 카단은 기운들이 몸 안에서 충돌해 성장이 멈추는 벽에 부딪힌다.",
        "shortQuote": "도끼와 망치는 잔꾀를 부리지 않아!",
        "narration": "여섯 스승의 각기 다른 비전을 한꺼번에 익히던 카단은 기운들이 몸 안에서 충돌해 성장이 멈추는 벽에 부딪힌다.",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "도끼와 망치는 잔꾀를 부리지 않아! 쇠를 달군 만큼 단단해지고 부딪친 만큼 불꽃이 튀는 법이다! 발바닥으로 대지를 짓이기고 한 치도 물러서지 마라!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_06/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep06_cut2.mp3",
        "shortCaption": "스승들 몰래 밤마다 깎아지른 별빛 바위 봉우리에 올라 홀로 수련하던 카단 앞에 은둔 대현자 말퓨온이 나타난다.",
        "shortQuote": "너는 오직 팔다리의 근육과 뼈의 힘으로만 절벽을 오르려 하는구나, 아이야.",
        "narration": "스승들 몰래 밤마다 깎아지른 별빛 바위 봉우리에 올라 홀로 수련하던 카단 앞에 은둔 대현자 말퓨온이 나타난다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "너는 오직 팔다리의 근육과 뼈의 힘으로만 절벽을 오르려 하는구나, 아이야. 그러니 산이 너를 밀어내는 것이다."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_06/scene_27.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep06_cut3.mp3",
        "shortCaption": "말퓨온은 억지로 기술을 합치려 하지 말고 밤하늘의 별빛을 마시며 대지로 숨을 내쉬는 성진호흡법의 이치를 일러준다.",
        "shortQuote": "너는 오직 팔다리의 근육과 뼈의 힘으로만 절벽을 오르려 하는구나, 아이야.",
        "narration": "말퓨온은 억지로 기술을 합치려 하지 말고 밤하늘의 별빛을 마시며 대지로 숨을 내쉬는 성진호흡법의 이치를 일러준다.",
        "speakerName": "별빛의 현자",
        "speakerRole": "별을 호흡하는 법을 전수한 현자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/066_Malfuon.png",
        "quote": "앉아라, 카단. 눈을 감고, 숨을 들이쉴 때마다 밤하늘의 샛별 하나를 가슴속에 모아들이고, 숨을 내쉴 때마다 발밑의 대지로 눈송이 하나를 돌려보내라."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_06/scene_39.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep06_cut4.mp3",
        "shortCaption": "고대의 호흡법을 깨우치는 순간, 여섯 갈래로 흩어졌던 스승들의 무예가 카단의 단단한 대지 기운 하나로 융합된다.",
        "shortQuote": "메마른 장작을 태우는 불길은 결국 잿더미만을 남길 뿐이지.",
        "narration": "고대의 호흡법을 깨우치는 순간, 여섯 갈래로 흩어졌던 스승들의 무예가 카단의 단단한 대지 기운 하나로 융합된다.",
        "speakerName": "말퓨온",
        "speakerRole": "별을 호흡하는 법을 전수한 현자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/066_Malfuon.png",
        "quote": "그 마음을 잊지 마라. 그것이야말로 천하를 품는 방패의 참된 본질이다."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_06/scene_48.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep06_cut5.mp3",
        "shortCaption": "새로이 눈뜬 별빛 호흡의 경지를 완성하기 위해, 카단은 대현자 말퓨온이 내리는 영기 대련 시험에 도전한다.",
        "shortQuote": "발소리가 바람 속에 녹아들었구나, 카단.",
        "narration": "새로이 눈뜬 별빛 호흡의 경지를 완성하기 위해, 카단은 대현자 말퓨온이 내리는 영기 대련 시험에 도전한다.",
        "speakerName": "에일라",
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
    "coverIllustrationUrl": "/images/webtoon/episode_07/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_07/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep07_cut1.mp3",
        "shortCaption": "열여덟 살 건장한 청년 무인으로 자란 카단은 스승들의 18년 전 맹세를 이행하러 남쪽 본토로 떠나기 전날 밤을 맞는다.",
        "shortQuote": "약조한 거사일이 바로 내일 밤이오.",
        "narration": "열여덟 살 건장한 청년 무인으로 자란 카단은 스승들의 18년 전 맹세를 이행하러 남쪽 본토로 떠나기 전날 밤을 맞는다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "약조한 거사일이 바로 내일 밤이오. 펜릴의 저녁 축제 술잔에 마비 독을 섞어 둘 것이오. 펜릴이 쓰러지는 즉시 부족 전사들을 모조리 섀도우렐름의 깃발 아래 집결시키시오."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_07/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep07_cut2.mp3",
        "shortCaption": "그러나 궁정 재상 루시안과 내통한 부족 배신자들이 연회 술잔에 마비 독을 타 정복왕 펜릴을 암살하려 반란을 일으킨다.",
        "shortQuote": "발리안의 아들 이그니스가 황궁의 백색 화염 기사단을 이끌고 북상할 것이오.",
        "narration": "그러나 궁정 재상 루시안과 내통한 부족 배신자들이 연회 술잔에 마비 독을 타 정복왕 펜릴을 암살하려 반란을 일으킨다.",
        "speakerName": "황궁 밀사",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "바르가스트는 나와 함께 삼십 년 동안 피를 흘리며 북방의 마수들을 토벌한 내 피붙이 같은 아우다! 일개 떠돌이 전사의 세치 혀에 놀아나 내 심장을 바친 형제를 참소하란 말이냐?"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_07/scene_27.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep07_cut3.mp3",
        "shortCaption": "혼란을 틈타 루시안이 비밀리에 파견한 데스나이트 아르투스의 철갑 부대가 유목 연맹의 본영 막사를 포위한다.",
        "shortQuote": "포로를 베어 공포를 심는 것은 기사의 도리가 아닙니다.",
        "narration": "혼란을 틈타 루시안이 비밀리에 파견한 데스나이트 아르투스의 철갑 부대가 유목 연맹의 본영 막사를 포위한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "포로를 베어 공포를 심는 것은 기사의 도리가 아닙니다. 상처를 꿰매고 돌려보내야 합니다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_07/scene_38.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep07_cut4.mp3",
        "shortCaption": "카단은 의형제 길가메시와 요정 전사 티타니아와 힘을 합쳐 독에 쓰러진 펜릴을 호위하며 적진을 정면 돌파한다.",
        "shortQuote": "전사자 명단에 바르가스트 측의 어린 징집병들 이름까지 빠짐없이 기록해 주십시오.",
        "narration": "카단은 의형제 길가메시와 요정 전사 티타니아와 힘을 합쳐 독에 쓰러진 펜릴을 호위하며 적진을 정면 돌파한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "전사자 명단에 바르가스트 측의 어린 징집병들 이름까지 빠짐없이 기록해 주십시오. 피 흘린 모든 자에게 평등한 안식을 주는 것만이 진정한 평화입니다."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_07/scene_47.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep07_cut5.mp3",
        "shortCaption": "북방의 의리와 은인들을 지켜내기 위해, 카단은 반란군의 배후인 데스나이트 아르투스의 선발대를 진압한다.",
        "shortQuote": "기억하겠다, 티타니아. 네 선택이 부끄럽지 않도록 살아 돌아오마.",
        "narration": "북방의 의리와 은인들을 지켜내기 위해, 카단은 반란군의 배후인 데스나이트 아르투스의 선발대를 진압한다.",
        "speakerName": "카단",
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
    "coverIllustrationUrl": "/images/webtoon/episode_08/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_08/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep08_cut1.mp3",
        "shortCaption": "설원을 넘어 국경 관문 도시 페가수스 밸리에 처음 도착한 카단은 본토 시장의 활기와 권력자들의 횡포를 목격한다.",
        "shortQuote": "단돈 은화 세 닢에 이 미친 괴물을 데려갈 용사 없소?",
        "narration": "설원을 넘어 국경 관문 도시 페가수스 밸리에 처음 도착한 카단은 본토 시장의 활기와 권력자들의 횡포를 목격한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "단돈 은화 세 닢에 이 미친 괴물을 데려갈 용사 없소? 가까이 갔다간 대가리가 깨질 테니 조심들 하시오!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_08/scene_13.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep08_cut2.mp3",
        "shortCaption": "그곳에서 어떤 조련사도 길들이지 못한 전설의 적갈기 야생 명마가 날뛰자, 카단은 평온한 별빛 호흡으로 교감해 주인이 된다.",
        "shortQuote": "멍청하게 헛소리하지 마세요.",
        "narration": "그곳에서 어떤 조련사도 길들이지 못한 전설의 적갈기 야생 명마가 날뛰자, 카단은 평온한 별빛 호흡으로 교감해 주인이 된다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "멍청하게 헛소리하지 마세요. 당신 창고 쥐구멍 근처의 밀가루 바닥을 보면, 내 작은 짚신 자국이 아니라 뒷집 주막 건달의 큼직한 나막신 자국이 선명하게 찍혀 있잖아요. 눈이 있으면 뇌도 좀 쓰시죠!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_08/scene_24.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep08_cut3.mp3",
        "shortCaption": "이어 시장 한복판에서 남루한 소년 차림으로 억울한 상인의 누명을 통쾌하게 풀어내는 천재 지략가 실리아와 처음 만난다.",
        "shortQuote": "...제 이름은 실리아예요. 남쪽의 왕도 아카데미로 가던 길이었죠. 당신은 누구죠?",
        "narration": "이어 시장 한복판에서 남루한 소년 차림으로 억울한 상인의 누명을 통쾌하게 풀어내는 천재 지략가 실리아와 처음 만난다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "...제 이름은 실리아예요. 남쪽의 왕도 아카데미로 가던 길이었죠. 당신은 누구죠?"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_08/scene_34.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep08_cut4.mp3",
        "shortCaption": "하지만 관문을 장악한 탐욕스러운 사병대장 볼튼이 기병대를 끌고 나타나 카단의 적갈기 명마를 강제로 빼앗으려 한다.",
        "shortQuote": "카단이 방패를 세우려 하자, 실리아가 가볍게 손가락을 튕겼다.",
        "narration": "하지만 관문을 장악한 탐욕스러운 사병대장 볼튼이 기병대를 끌고 나타나 카단의 적갈기 명마를 강제로 빼앗으려 한다.",
        "speakerName": "실리아",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "남자의 무식한 힘만으로는 골목 싸움을 해결 못 해요. 바람의 눈을 보세요."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_08/scene_43.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep08_cut5.mp3",
        "shortCaption": "새 동료 실리아와 명마 페가수스를 지키기 위해, 카단은 약탈 기병대를 이끄는 사병대장 볼튼을 혼내준다.",
        "shortQuote": "이겼다면 더 이상 증명할 게 없잖아. 왜 패자를 모욕하지?",
        "narration": "새 동료 실리아와 명마 페가수스를 지키기 위해, 카단은 약탈 기병대를 이끄는 사병대장 볼튼을 혼내준다.",
        "speakerName": "카단",
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
    "coverIllustrationUrl": "/images/webtoon/episode_09/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_09/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep09_cut1.mp3",
        "shortCaption": "왕도 라이트헤븐에 입성한 카단과 실리아는 내성 광장에서 서민 무인들을 무자비하게 짓밟는 비무 대회를 목격한다.",
        "shortQuote": "와일드랜드에서 온 미천한 부랑자가 감히 황실 백색 화염 기사단의 명예에 도전장을 내밀었도다!",
        "narration": "왕도 라이트헤븐에 입성한 카단과 실리아는 내성 광장에서 서민 무인들을 무자비하게 짓밟는 비무 대회를 목격한다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "와일드랜드에서 온 미천한 부랑자가 감히 황실 백색 화염 기사단의 명예에 도전장을 내밀었도다! 기사단장 이그니스 경의 자비 없는 심판을 보라!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_09/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep09_cut2.mp3",
        "shortCaption": "진홍빛 비단 예복을 걸친 오만한 귀공자의 정체는 원수 루시안의 양자로 길러진 발리안의 친아들 이그니스였다.",
        "shortQuote": "누가 네게 그 사악한 손톱을 가르쳤느냐!",
        "narration": "진홍빛 비단 예복을 걸친 오만한 귀공자의 정체는 원수 루시안의 양자로 길러진 발리안의 친아들 이그니스였다.",
        "speakerName": "워커",
        "speakerRole": "왕도 뒷골목의 은둔 무인",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/051_Walker.png",
        "quote": "누가 네게 그 사악한 손톱을 가르쳤느냐! 순결한 성기사의 화염에 암흑의 마수를 섞다니, 부끄러운 줄 알아라!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_09/scene_26.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep09_cut3.mp3",
        "shortCaption": "출생의 진실을 모른 채 권력에 취한 이그니스가 쓰러진 무인에게 암흑 사술이 깃든 화염 검을 내리치려 한다.",
        "shortQuote": "지금 내 옷 걱정할 때예요?",
        "narration": "출생의 진실을 모른 채 권력에 취한 이그니스가 쓰러진 무인에게 암흑 사술이 깃든 화염 검을 내리치려 한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "지금 내 옷 걱정할 때예요? 바보같이 왜 남의 싸움에 끼어들어서 이 꼴이 된 거예요!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_09/scene_37.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep09_cut4.mp3",
        "shortCaption": "참다못한 카단이 거지 옷 차림 그대로 결투장 위로 뛰어오르며, 18년 만에 엇갈린 두 아이의 운명이 격돌한다.",
        "shortQuote": "그리고 이 독을 해독하려면 황궁 직속 비밀 약초원에만 보관되어 있는 고대 엘릭서…",
        "narration": "참다못한 카단이 거지 옷 차림 그대로 결투장 위로 뛰어오르며, 18년 만에 엇갈린 두 아이의 운명이 격돌한다.",
        "speakerName": "워커",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "혼자는 못 가요. 황궁 지하 약초원의 환기구는 바람의 마법사가 아니면 지나갈 수 없어요."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_09/scene_46.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep09_cut5.mp3",
        "shortCaption": "은둔 무인 워커가 지켜보는 가운데, 카단은 무고한 이를 짓밟는 귀공자 이그니스의 오만한 검을 정면으로 꺾는다.",
        "shortQuote": "약초를 달여 워커 님을 치료한 뒤, 곧바로 수용소로 가요.",
        "narration": "은둔 무인 워커가 지켜보는 가운데, 카단은 무고한 이를 짓밟는 귀공자 이그니스의 오만한 검을 정면으로 꺾는다.",
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
    "coverIllustrationUrl": "/images/webtoon/episode_10/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_10/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep10_cut1.mp3",
        "shortCaption": "광장 결투 이후 붉은 유리 궁전을 정찰하던 카단과 실리아는 궁정 깊숙이 감춰진 지하 감옥의 존재를 포착한다.",
        "shortQuote": "보라, 발리안 경의 피를 이어받은 순백의 화염이다!",
        "narration": "광장 결투 이후 붉은 유리 궁전을 정찰하던 카단과 실리아는 궁정 깊숙이 감춰진 지하 감옥의 존재를 포착한다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "보라, 발리안 경의 피를 이어받은 순백의 화염이다! 황실의 가장 순결한 검이 바로 저기에 있도다!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_10/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep10_cut2.mp3",
        "shortCaption": "죽은 줄로만 알았던 이그니스의 친어머니 이셀라와 수많은 양심수들이 18년 동안 루시안에게 유폐되어 있었던 것이다.",
        "shortQuote": "발리안이 숨겨둔 고대 성기사단의 옥좌 문장을 내놓지 않는 한, 그의 고통은 끝나지 않는다.",
        "narration": "죽은 줄로만 알았던 이그니스의 친어머니 이셀라와 수많은 양심수들이 18년 동안 루시안에게 유폐되어 있었던 것이다.",
        "speakerName": "루시안",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "발리안이 숨겨둔 고대 성기사단의 옥좌 문장을 내놓지 않는 한, 그의 고통은 끝나지 않는다. 네가 진정 효자라면 아버지의 입을 열게 하거라."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_10/scene_26.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep10_cut3.mp3",
        "shortCaption": "실리아가 환기구 도면을 해독하며 구출 작전을 세우던 밤, 자객들의 밀고로 일행의 은신처 위치가 발각되고 만다.",
        "shortQuote": "아... 아아... 발리안... 내 남편... 그리고 눈보라 속에서 내 품에서…",
        "narration": "실리아가 환기구 도면을 해독하며 구출 작전을 세우던 밤, 자객들의 밀고로 일행의 은신처 위치가 발각되고 만다.",
        "speakerName": "이셀라",
        "speakerRole": "이그니스의 어머니 · 납치된 성녀",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/034_Ysela.png",
        "quote": "아... 아아... 발리안... 내 남편... 그리고 눈보라 속에서 내 품에서 빼앗겼던 내 아기...!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_10/scene_37.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep10_cut4.mp3",
        "shortCaption": "최고 재상 루시안이 직접 친위 불꽃 기사단을 이끌고 나타나 불바다를 일으키며 은신처를 겹겹이 포위한다.",
        "shortQuote": "돌풍의 장막이여, 길을 열어라!",
        "narration": "최고 재상 루시안이 직접 친위 불꽃 기사단을 이끌고 나타나 불바다를 일으키며 은신처를 겹겹이 포위한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "돌풍의 장막이여, 길을 열어라!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_10/scene_46.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep10_cut5.mp3",
        "shortCaption": "지하 감옥 구출의 희망을 이어가기 위해, 카단과 실리아는 포위망을 조여오는 재상 루시안을 뚫고 돌파구를 연다.",
        "shortQuote": "약속하겠습니다, 아주머니.",
        "narration": "지하 감옥 구출의 희망을 이어가기 위해, 카단과 실리아는 포위망을 조여오는 재상 루시안을 뚫고 돌파구를 연다.",
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
    "coverIllustrationUrl": "/images/webtoon/episode_11/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_11/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep11_cut1.mp3",
        "shortCaption": "포위망을 따돌린 카단과 실리아는 용암 열기가 들끓는 붉은 유리 궁정 제7 지하 감옥 깊숙이 잠입한다.",
        "shortQuote": "순찰 간격은 정확히 삼백 번의 호흡이에요.",
        "narration": "포위망을 따돌린 카단과 실리아는 용암 열기가 들끓는 붉은 유리 궁정 제7 지하 감옥 깊숙이 잠입한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "순찰 간격은 정확히 삼백 번의 호흡이에요. 환기구가 열릴 때 생기는 역풍을 타면 감시탑의 룬 렌즈를 피할 수 있어요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_11/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep11_cut2.mp3",
        "shortCaption": "그곳 강철 사슬 끝에는 18년의 고문 속에서도 꺾이지 않고 살아남은 전설의 창술사 발리안이 갇혀 있었다.",
        "shortQuote": "어디로 도망치려 하느냐. 황궁의 지하를 더럽힌 죄수 놈들아!",
        "narration": "그곳 강철 사슬 끝에는 18년의 고문 속에서도 꺾이지 않고 살아남은 전설의 창술사 발리안이 갇혀 있었다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "어디로 도망치려 하느냐. 황궁의 지하를 더럽힌 죄수 놈들아!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_11/scene_28.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep11_cut3.mp3",
        "shortCaption": "뒤쫓아온 이그니스가 친아버지인 줄도 모른 채 발리안을 공격하지만, 발리안은 살상 대신 아들의 검 궤도만 부드럽게 흘려낸다.",
        "shortQuote": "카단이 방패를 굳건히 세우며 단호하게 소리쳤다.",
        "narration": "뒤쫓아온 이그니스가 친아버지인 줄도 모른 채 발리안을 공격하지만, 발리안은 살상 대신 아들의 검 궤도만 부드럽게 흘려낸다.",
        "speakerName": "카단",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "거짓말이다... 저 자는 흉악한 사형수일 뿐이다! 죄수의 세치 혀와 잔기술 따위는 내 핏줄의 증거가 될 수 없어!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_11/scene_39.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep11_cut4.mp3",
        "shortCaption": "카단의 품속 은빛 단검이 발리안의 기운에 공명하는 순간, 감옥장 메두사 고르고가 사슬 비수를 휘두르며 퇴로를 막아선다.",
        "shortQuote": "거짓이다... 미스트폴 절벽의 거친 급류 속에서 당신의 남편 벨페고르는 마지막…",
        "narration": "카단의 품속 은빛 단검이 발리안의 기운에 공명하는 순간, 감옥장 메두사 고르고가 사슬 비수를 휘두르며 퇴로를 막아선다.",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "벨페고르를 비참하게 죽인 살인마들이 바로 네놈들이었구나!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_11/scene_49.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep11_cut5.mp3",
        "shortCaption": "발리안과 이셀라를 무사히 탈출시키기 위해, 카단은 용암 다리 위에서 감옥장 메두사 고르고의 맹공을 방패로 막아낸다.",
        "shortQuote": "실리아? 너 역시 스승의 죄악에서 결코 자유롭지 못할 것이다.",
        "narration": "발리안과 이셀라를 무사히 탈출시키기 위해, 카단은 용암 다리 위에서 감옥장 메두사 고르고의 맹공을 방패로 막아낸다.",
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
    "coverIllustrationUrl": "/images/webtoon/episode_12/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_12/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep12_cut1.mp3",
        "shortCaption": "지하 감옥을 탈출한 발리안과 이셀라는 왕도 외곽의 옛 성기사단 폐허 성소에서 18년 만에 눈물의 재회를 나눈다.",
        "shortQuote": "발리안, 조금만 더 기운을 내요.",
        "narration": "지하 감옥을 탈출한 발리안과 이셀라는 왕도 외곽의 옛 성기사단 폐허 성소에서 18년 만에 눈물의 재회를 나눈다.",
        "speakerName": "이셀라",
        "speakerRole": "이그니스의 어머니 · 납치된 성녀",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/034_Ysela.png",
        "quote": "발리안, 조금만 더 기운을 내요. 카단이 가져온 치유의 비약이 곧 상처의 불길을 가라앉힐 거예요. 우리 아이를... 이그니스를 다시 품에 안아야 하잖아요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_12/scene_13.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep12_cut2.mp3",
        "shortCaption": "발리안은 카단에게 그날 밤 엘윈 마을이 불탔던 진실과 아버지 알렉산다르의 숭고한 최후를 모두 들려준다.",
        "shortQuote": "궁정의 썩어빠진 개새끼들이 주둥이를 함부로 놀리는구나!",
        "narration": "발리안은 카단에게 그날 밤 엘윈 마을이 불탔던 진실과 아버지 알렉산다르의 숭고한 최후를 모두 들려준다.",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "궁정의 썩어빠진 개새끼들이 주둥이를 함부로 놀리는구나! 성기사의 거룩한 성소에 더러운 발을 들이려거든 네놈들의 해골통부터 모루 위에 쪼갤 각오를 해라!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_12/scene_25.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep12_cut3.mp3",
        "shortCaption": "증오가 아닌 수호의 기사가 되겠다 다짐한 카단에게, 발리안은 자신이 간직해 온 두 번째 은빛 단검을 물려준다.",
        "shortQuote": "지켜야 할 사람이 있는 한, 내 방패는 그 어떤 불길 앞에서도 부서지지 않는다.",
        "narration": "증오가 아닌 수호의 기사가 되겠다 다짐한 카단에게, 발리안은 자신이 간직해 온 두 번째 은빛 단검을 물려준다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "지켜야 할 사람이 있는 한, 내 방패는 그 어떤 불길 앞에서도 부서지지 않는다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_12/scene_35.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep12_cut4.mp3",
        "shortCaption": "그때 루시안이 보낸 거대한 마도 병기 공성거신 아이언포지가 성소 외벽을 부수며 추격해 온다.",
        "shortQuote": "숙부님, 당신이 지켜온 불씨는 결코 꺼지지 않을 것입니다.",
        "narration": "그때 루시안이 보낸 거대한 마도 병기 공성거신 아이언포지가 성소 외벽을 부수며 추격해 온다.",
        "speakerName": "카단",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "아버지... 어머니... 도대체 황궁의 법도는 무엇이었단 말인가... 내가 믿어온 정의는 허상이었단 말인가..."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_12/scene_44.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep12_cut5.mp3",
        "shortCaption": "선대 성기사들의 넋이 잠든 성역을 지켜내기 위해, 카단은 강철 수호병을 거느린 공성거신 아이언포지를 맞받아친다.",
        "shortQuote": "우리가 걸어갈 길도 마찬가지일 거다. 바다 건너 바람섬으로 가자.",
        "narration": "선대 성기사들의 넋이 잠든 성역을 지켜내기 위해, 카단은 강철 수호병을 거느린 공성거신 아이언포지를 맞받아친다.",
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
    "coverIllustrationUrl": "/images/webtoon/episode_13/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_13/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep13_cut1.mp3",
        "shortCaption": "궁정의 수배령을 피해 동해안 삼나무 안개 숲을 지나던 카단과 실리아는 허름한 숲속 주막에서 기이한 노인을 만난다.",
        "shortQuote": "바다에서 불어오는 바람이 점점 무거워지고 있어요.",
        "narration": "궁정의 수배령을 피해 동해안 삼나무 안개 숲을 지나던 카단과 실리아는 허름한 숲속 주막에서 기이한 노인을 만난다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "바다에서 불어오는 바람이 점점 무거워지고 있어요. 바람 속삭임 섬의 결계탑이 흔들리면서 동해안의 마나 균형이 무너지고 있다는 증거예요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_13/scene_13.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep13_cut2.mp3",
        "shortCaption": "거지 행색의 노인은 실리아가 정성껏 대접한 따뜻한 요리에 감탄하며 자신의 진짜 정체가 옛 대장군 레오나르임을 밝힌다.",
        "shortQuote": "어휴, 저 귀한 멧돼지 다리 고기를 숯검정으로 만들다니! 비키세요, 노인네!",
        "narration": "거지 행색의 노인은 실리아가 정성껏 대접한 따뜻한 요리에 감탄하며 자신의 진짜 정체가 옛 대장군 레오나르임을 밝힌다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "어휴, 저 귀한 멧돼지 다리 고기를 숯검정으로 만들다니! 비키세요, 노인네!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_13/scene_24.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep13_cut3.mp3",
        "shortCaption": "출생의 비밀로 혼란에 빠져 홀로 방황하던 이그니스까지 숲길에서 우연히 마주치며 세 청년이 한자리에 모인다.",
        "shortQuote": "좋다! 힘으로 맞서지 않고 자연의 결을 따라 흘려보내는 솜씨가 제법이구나. 옛…",
        "narration": "출생의 비밀로 혼란에 빠져 홀로 방황하던 이그니스까지 숲길에서 우연히 마주치며 세 청년이 한자리에 모인다.",
        "speakerName": "노장 레오나르",
        "speakerRole": "녹옥 지팡이의 주인 · 옛 대장군",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/086_Leonar.png",
        "quote": "좋다! 힘으로 맞서지 않고 자연의 결을 따라 흘려보내는 솜씨가 제법이구나. 옛 성기사단의 수호벽과 바람섬의 유려함이 한 몸에 깃들어 있어. 알렉산다르 형님이 살아서 이 모습을 보았다면 껄껄 웃으며 술잔을 기울였을 게다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_13/scene_34.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep13_cut4.mp3",
        "shortCaption": "레오나르는 실리아의 뛰어난 지략과 백성을 위하는 마음을 알아보고 전설의 지휘봉인 녹옥 지팡이를 물려주려 한다.",
        "shortQuote": "발리안 경이 내 아버지이고, 내 어머니가 그 차가운 정원에서 십팔 년 동안…",
        "narration": "레오나르는 실리아의 뛰어난 지략과 백성을 위하는 마음을 알아보고 전설의 지휘봉인 녹옥 지팡이를 물려주려 한다.",
        "speakerName": "이그니스",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "스스로를 탓하지 마라, 이그니스. 네 검에 깃든 백색 화염은 루시안의 것이 아니라 네 아버지가 물려준 성기사의 영혼이다. 도망치지 않고 진실을 마주하러 온 것만으로도, 너는 이미 진정한 기사의 길에 들어선 거다."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_13/scene_43.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep13_cut5.mp3",
        "shortCaption": "녹옥 지팡이와 비전 진법의 자격을 입증하기 위해, 카단과 실리아는 노장 레오나르가 내리는 실전 대련에 임한다.",
        "shortQuote": "실리아의 눈가가 젖어 들었다.",
        "narration": "녹옥 지팡이와 비전 진법의 자격을 입증하기 위해, 카단과 실리아는 노장 레오나르가 내리는 실전 대련에 임한다.",
        "speakerName": "실리아",
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
    "coverIllustrationUrl": "/images/webtoon/episode_14/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_14/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep14_cut1.mp3",
        "shortCaption": "일흔두 개의 현무암 기둥이 솟은 동해안 안개 호수에서 일행은 전쟁고아와 난민들이 모여 사는 구름돌아오는장원을 찾는다.",
        "shortQuote": "수몰된 종탑들이 물속에서 미세한 마나의 파동을 보내고 있어요.",
        "narration": "일흔두 개의 현무암 기둥이 솟은 동해안 안개 호수에서 일행은 전쟁고아와 난민들이 모여 사는 구름돌아오는장원을 찾는다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "수몰된 종탑들이 물속에서 미세한 마나의 파동을 보내고 있어요. 물의 정령들이 여전히 저 아래에서 잠들어 있는 거예요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_14/scene_13.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep14_cut2.mp3",
        "shortCaption": "그러나 평화도 잠시, 루시안의 비호를 받는 악랄한 수적두목 아쿠아로드가 함선을 몰고 와 장원의 식량과 아이들을 노린다.",
        "shortQuote": "어머니 실피드의 죽음에 얽힌 추악한 진실을 덮어두고 섬의 문을 걸어 잠근 것은 장로들이에요.",
        "narration": "그러나 평화도 잠시, 루시안의 비호를 받는 악랄한 수적두목 아쿠아로드가 함선을 몰고 와 장원의 식량과 아이들을 노린다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "어머니 실피드의 죽음에 얽힌 추악한 진실을 덮어두고 섬의 문을 걸어 잠근 것은 장로들이에요. 저는 도망친 게 아니라 어머니의 넋을 기리고 진실을 밝히러 나선 거예요, 론돌 숙부님. 숙부님 역시 그 어둠에 맞서다 다리를 잃고 쫓겨나신 게 아니었나요?"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_14/scene_25.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep14_cut3.mp3",
        "shortCaption": "실리아는 짙은 물안개와 수로 지형을 이용한 유인책을 세우고, 카단은 선두에서 주민들을 안전지대로 대피시킨다.",
        "shortQuote": "카단이 벽화를 가리키며 론돌에게 물었다.",
        "narration": "실리아는 짙은 물안개와 수로 지형을 이용한 유인책을 세우고, 카단은 선두에서 주민들을 안전지대로 대피시킨다.",
        "speakerName": "카단",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "날카로운 눈을 가졌구나, 청년. 백 년 전 발리안 경의 선대 성기사들과 우리 바람섬의 장인들이 함께 완성한 수호 마법진이다. 방패는 막는 무기가 아니라 대지와 바다의 품으로 충격을 돌려보내는 문이라는 뜻이지."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_14/scene_35.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep14_cut4.mp3",
        "shortCaption": "뒤따라온 이그니스 역시 난민 아이들이 건넨 소박한 산나물 국 한 그릇에 처음으로 황궁 밖 백성들의 온기를 깨닫는다.",
        "shortQuote": "황궁의 도련님치고는 제법 쓸 만한 칼솜씨로군.",
        "narration": "뒤따라온 이그니스 역시 난민 아이들이 건넨 소박한 산나물 국 한 그릇에 처음으로 황궁 밖 백성들의 온기를 깨닫는다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "황궁의 도련님치고는 제법 쓸 만한 칼솜씨로군. 몸이 젖었으니 수건으로 닦고 뜨거운 국물이나 들이켜라."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_14/scene_44.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep14_cut5.mp3",
        "shortCaption": "피난민들의 보금자리를 약탈하려는 수적두목 아쿠아로드의 해적 선단을 안개 호수 한복판에서 격퇴한다.",
        "shortQuote": "불 곁으로 다가와서 몸을 말려라, 이그니스.",
        "narration": "피난민들의 보금자리를 약탈하려는 수적두목 아쿠아로드의 해적 선단을 안개 호수 한복판에서 격퇴한다.",
        "speakerName": "카단",
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
    "coverIllustrationUrl": "/images/webtoon/episode_15/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_15/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep15_cut1.mp3",
        "shortCaption": "폭풍우가 안개 호수를 덮친 자정, 루시안이 비밀리에 보낸 황실 직속 암살단장 독거미 아라크네가 장원에 침투한다.",
        "shortQuote": "호수의 수면 아래에서 불길한 기류가 소용돌이치고 있어요.",
        "narration": "폭풍우가 안개 호수를 덮친 자정, 루시안이 비밀리에 보낸 황실 직속 암살단장 독거미 아라크네가 장원에 침투한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "호수의 수면 아래에서 불길한 기류가 소용돌이치고 있어요. 파도의 결이 평소와 달리 검붉은 마나를 머금고 뒤틀려 있네요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_15/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep15_cut2.mp3",
        "shortCaption": "맹독 단검을 든 자객들이 잠든 난민 아이들의 방을 덮치자, 노장 레오나르가 맨몸으로 문 앞을 가로막아 선다.",
        "shortQuote": "이 더러운 버러지 놈들이 어디서 어린것들을 넘보느냐!",
        "narration": "맹독 단검을 든 자객들이 잠든 난민 아이들의 방을 덮치자, 노장 레오나르가 맨몸으로 문 앞을 가로막아 선다.",
        "speakerName": "노장 레오나르",
        "speakerRole": "녹옥 지팡이의 주인 · 옛 대장군",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/086_Leonar.png",
        "quote": "이 더러운 버러지 놈들이 어디서 어린것들을 넘보느냐!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_15/scene_25.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep15_cut3.mp3",
        "shortCaption": "수십 곳의 독상을 입으면서도 끝까지 아이들을 품에 안고 버텨 낸 레오나르는 사자 같은 포효로 적을 물린 뒤 숨을 거둔다.",
        "shortQuote": "더러운 원혼들이 감히 의로운 자의 피를 더럽히지 못한다!” 카단의 은빛 단검이…",
        "narration": "수십 곳의 독상을 입으면서도 끝까지 아이들을 품에 안고 버텨 낸 레오나르는 사자 같은 포효로 적을 물린 뒤 숨을 거둔다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "더러운 원혼들이 감히 의로운 자의 피를 더럽히지 못한다!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_15/scene_36.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep15_cut4.mp3",
        "shortCaption": "바닥에 떨어진 암살단의 황실 친필 인장을 본 이그니스는 양아버지 루시안이 학살의 원흉이었음을 깨닫고 피눈물을 흘린다.",
        "shortQuote": "이그니스가 주먹을 쥐고 벽을 내리치며 절규했다.",
        "narration": "바닥에 떨어진 암살단의 황실 친필 인장을 본 이그니스는 양아버지 루시안이 학살의 원흉이었음을 깨닫고 피눈물을 흘린다.",
        "speakerName": "이그니스",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "진실을 마주하는 것은 고통스러운 일이다. 하지만 눈을 감지 않는 것만이 그 오명을 씻어낼 수 있는 유일한 시작이다. 발리안 숙부님께서도 네가 그 껍질을 깨고 나오기를 늘 기도하셨다."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_15/scene_45.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep15_cut5.mp3",
        "shortCaption": "노장 레오나르가 목숨 바쳐 지켜낸 아이들의 복수를 위해, 카단과 이그니스는 독거미 아라크네의 암살단을 섬멸한다.",
        "shortQuote": "울지 마라, 얘들아... 늙은 사자는 그저 잠시 눈을 붙이는 것뿐이다...",
        "narration": "노장 레오나르가 목숨 바쳐 지켜낸 아이들의 복수를 위해, 카단과 이그니스는 독거미 아라크네의 암살단을 섬멸한다.",
        "speakerName": "노장 레오나르",
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
    "coverIllustrationUrl": "/images/webtoon/episode_16/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_16/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep16_cut1.mp3",
        "shortCaption": "레오나르의 장례를 치른 밤, 상현달이 뜬 부두에서 카단과 이그니스는 부모 세대가 남긴 편지와 두 자루 은빛 단검을 마주한다.",
        "shortQuote": "황실의 영예가 깃든 검이다. 아깝지 않은가?",
        "narration": "레오나르의 장례를 치른 밤, 상현달이 뜬 부두에서 카단과 이그니스는 부모 세대가 남긴 편지와 두 자루 은빛 단검을 마주한다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "황실의 영예가 깃든 검이다. 아깝지 않은가?"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_16/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep16_cut2.mp3",
        "shortCaption": "친아버지의 원수를 아버지라 부르며 살아온 죄책감에 무너지는 이그니스에게, 카단은 원망 대신 따뜻한 형제의 손을 내민다.",
        "shortQuote": "아버지... 저는 그것도 모르고 아버지를 역적이라 원망하며 궁정의 사냥개 노릇을…",
        "narration": "친아버지의 원수를 아버지라 부르며 살아온 죄책감에 무너지는 이그니스에게, 카단은 원망 대신 따뜻한 형제의 손을 내민다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "아버지... 저는 그것도 모르고 아버지를 역적이라 원망하며 궁정의 사냥개 노릇을 했습니다... 이 불효를 어찌 갚아야 합니까..."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_16/scene_25.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep16_cut3.mp3",
        "shortCaption": "두 청년이 부모의 서약을 이어 진정한 의형제로 거듭난 순간, 증거 인멸을 위해 루시안이 직접 추격 함대를 이끌고 부두를 포위한다.",
        "shortQuote": "방패를 쥐는 손이 무거울수록, 지켜야 할 사람들의 온기가 가슴속에 차오르는 법이다.",
        "narration": "두 청년이 부모의 서약을 이어 진정한 의형제로 거듭난 순간, 증거 인멸을 위해 루시안이 직접 추격 함대를 이끌고 부두를 포위한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "우리는 형제다, 이그니스. 발리안 숙부님과 알렉산다르 스승님이 그러셨듯, 이제는 우리가 서로의 등을 맡길 차례다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_16/scene_36.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep16_cut4.mp3",
        "shortCaption": "이그니스의 백색 화염 검과 카단의 눈꽃 방패가 처음으로 완벽한 하나의 호흡을 이루며 황궁 중갑병들을 가른다.",
        "shortQuote": "이그니스! 황궁의 은혜를 배신한 대가를 반드시 치르게 될 것이다!",
        "narration": "이그니스의 백색 화염 검과 카단의 눈꽃 방패가 처음으로 완벽한 하나의 호흡을 이루며 황궁 중갑병들을 가른다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "이그니스! 황궁의 은혜를 배신한 대가를 반드시 치르게 될 것이다!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_16/scene_45.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep16_cut5.mp3",
        "shortCaption": "실리아의 고향 바람 속삭임 섬으로 출항하기 위해, 두 형제는 부두를 가로막은 추격사령관 루시안을 협공으로 격파한다.",
        "shortQuote": "실리아가 뱃머리에서 손을 흔들며 외쳤다.",
        "narration": "실리아의 고향 바람 속삭임 섬으로 출항하기 위해, 두 형제는 부두를 가로막은 추격사령관 루시안을 협공으로 격파한다.",
        "speakerName": "실리아",
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
    "coverIllustrationUrl": "/images/webtoon/episode_17/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_17/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep17_cut1.mp3",
        "shortCaption": "안개 호수를 떠나 동쪽 망망대해로 나선 미풍의날개호 갑판 위로 바람 속삭임 섬에서 보낸 의문의 초대장이 날아든다.",
        "shortQuote": "북서쪽 하늘을 보아라!",
        "narration": "안개 호수를 떠나 동쪽 망망대해로 나선 미풍의날개호 갑판 위로 바람 속삭임 섬에서 보낸 의문의 초대장이 날아든다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "북서쪽 하늘을 보아라! 보통 바다갈매기가 아니다. 왕실의 은빛 깃털을 지닌 바람 그리폰이다!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_17/scene_13.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep17_cut2.mp3",
        "shortCaption": "실리아는 10년 전 어머니 실피드 여왕이 급사한 뒤 고향 섬이 결계 속에 봉쇄되었다는 아픈 과거를 동료들에게 털어놓는다.",
        "shortQuote": "결국 루시안의 더러운 손길이 대해의 성역까지 뻗친 것이군.",
        "narration": "실리아는 10년 전 어머니 실피드 여왕이 급사한 뒤 고향 섬이 결계 속에 봉쇄되었다는 아픈 과거를 동료들에게 털어놓는다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "결국 루시안의 더러운 손길이 대해의 성역까지 뻗친 것이군. 황궁의 군대를 사병처럼 부려 타국의 왕좌까지 찬탈하려 들다니! 내 두 손으로 그자의 오만한 목을 꺾어버리겠다!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_17/scene_24.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep17_cut3.mp3",
        "shortCaption": "배가 험준한 칼날 산호초 해협에 들어서자, 섬의 권력을 찬탈한 반역파 대장로 제피르의 매복 함대가 기습해 온다.",
        "shortQuote": "정면 돌파보다는 암초가 낫습니다.",
        "narration": "배가 험준한 칼날 산호초 해협에 들어서자, 섬의 권력을 찬탈한 반역파 대장로 제피르의 매복 함대가 기습해 온다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "정면 돌파보다는 암초가 낫습니다. 알렉산다르 스승님께서는 위험한 길일수록 적의 방심이 숨어 있다고 하셨습니다. 밤이 되면 바다의 기류가 잠잠해질 테니, 실리아의 바람과 론돌 숙부님의 키솜씨라면 해협을 통과할 수 있습니다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_17/scene_34.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep17_cut4.mp3",
        "shortCaption": "거센 풍랑 주술로 범선을 침몰시키려는 적들에 맞서 론돌이 키를 잡고 카단과 이그니스가 갑판 위 백병전에 나선다.",
        "shortQuote": "이그니스가 카단과 등을 맞대며 외쳤다.",
        "narration": "거센 풍랑 주술로 범선을 침몰시키려는 적들에 맞서 론돌이 키를 잡고 카단과 이그니스가 갑판 위 백병전에 나선다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "카단! 저놈들의 기함에 마나 증기 기관이 달려 있다! 기관실을 파괴해야 추격을 떨쳐낼 수 있다!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_17/scene_42.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep17_cut5.mp3",
        "shortCaption": "바람 속삭임 섬의 비밀 해저 통로로 진입하기 위해, 해협을 봉쇄한 대장로 제피르의 기습 함대를 돌파한다.",
        "shortQuote": "실리아가 눈시울을 붉히며 고향의 섬을 바라보았다.",
        "narration": "바람 속삭임 섬의 비밀 해저 통로로 진입하기 위해, 해협을 봉쇄한 대장로 제피르의 기습 함대를 돌파한다.",
        "speakerName": "실리아",
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
    "coverIllustrationUrl": "/images/webtoon/episode_18/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_18/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep18_cut1.mp3",
        "shortCaption": "해저 동굴을 통과한 카단과 실리아, 이그니스는 수천 년간 닫혀 있던 섬 지하의 고대 유적 검은 성전에 도달한다.",
        "shortQuote": "이곳은 바람의 정령왕 에올루스의 선조들이 대륙의 모든 진실을 기록해 둔 태초의 아카이브예요.",
        "narration": "해저 동굴을 통과한 카단과 실리아, 이그니스는 수천 년간 닫혀 있던 섬 지하의 고대 유적 검은 성전에 도달한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이곳은 바람의 정령왕 에올루스의 선조들이 대륙의 모든 진실을 기록해 둔 태초의 아카이브예요. 종이나 잉크는 세월의 풍파에 닳아 없어지지만, 대지의 모든 숨결과 거짓 없는 기억은 이 흑요석 수정 속에 영원히 봉인되어 있어요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_18/scene_16.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep18_cut2.mp3",
        "shortCaption": "성전 중앙의 기억 수정구가 빛을 발하며 10년 전 평화 협정 연회 날의 감춰졌던 진실이 허공에 생생히 투영된다.",
        "shortQuote": "두려워 마세요, 이그니스.",
        "narration": "성전 중앙의 기억 수정구가 빛을 발하며 10년 전 평화 협정 연회 날의 감춰졌던 진실이 허공에 생생히 투영된다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "두려워 마세요, 이그니스. 진실이 아무리 쓰라릴지라도, 거짓된 어둠 속에서 헤매는 것보다는 눈부신 빛 속에서 상처를 마주하는 편이 훨씬 존엄한 법이에요."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_18/scene_29.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep18_cut3.mp3",
        "shortCaption": "실피드 여왕의 은잔에 메두사 고르고의 맹독을 탄 범인은 바로 재상 루시안과 내통한 대장로 제피르였던 것이다.",
        "shortQuote": "너의 잘못이 아니다, 이그니스.",
        "narration": "실피드 여왕의 은잔에 메두사 고르고의 맹독을 탄 범인은 바로 재상 루시안과 내통한 대장로 제피르였던 것이다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "너의 잘못이 아니다, 이그니스. 어둠에 눈이 멀었던 권력자들이 우리에게 강요한 잔혹한 비극이었을 뿐이다. 스승님과 숙부님께서는 한 번도 우리를 원망하지 않으셨다. 이제 우리가 그 원통한 진실을 온 세상에 증명해야 한다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_18/scene_41.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep18_cut4.mp3",
        "shortCaption": "어머니의 억울한 죽음 앞에 실리아가 눈물을 삼키는 순간, 침입자를 매장하려는 성전의 흑요석 거신이 깨어난다.",
        "shortQuote": "더 이상 너희 같은 그림자의 괴물들에게 속지 않는다!",
        "narration": "어머니의 억울한 죽음 앞에 실리아가 눈물을 삼키는 순간, 침입자를 매장하려는 성전의 흑요석 거신이 깨어난다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "더 이상 너희 같은 그림자의 괴물들에게 속지 않는다!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_18/scene_51.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep18_cut5.mp3",
        "shortCaption": "진실을 세상에 알리고 성전을 빠져나가기 위해, 세 사람은 깨어난 흑요석 거신 아이언포지를 힘을 합쳐 파괴한다.",
        "shortQuote": "아버지에게 이 기억 수정을 보여드려야 해요.",
        "narration": "진실을 세상에 알리고 성전을 빠져나가기 위해, 세 사람은 깨어난 흑요석 거신 아이언포지를 힘을 합쳐 파괴한다.",
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
    "coverIllustrationUrl": "/images/webtoon/episode_19/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_19/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep19_cut1.mp3",
        "shortCaption": "검은 성전의 진실을 품고 섬 최정상 하늘 제단에 오른 일행 앞을 실리아의 외조부인 국왕 에올루스가 가로막는다.",
        "shortQuote": "누구도 이 다리를 건널 수 없다!",
        "narration": "검은 성전의 진실을 품고 섬 최정상 하늘 제단에 오른 일행 앞을 실리아의 외조부인 국왕 에올루스가 가로막는다.",
        "speakerName": "국왕 에올루스",
        "speakerRole": "바람 속삭임 섬의 왕 · 실리아의 외조부",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/025_Aeolus.png",
        "quote": "누구도 이 다리를 건널 수 없다! 아내 실피드를 비열하게 살해한 성기사단의 후예와, 어미의 원수와 손을 잡은 배신자 왕녀를 결코 결계탑 안으로 들일 수 없다!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_19/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep19_cut2.mp3",
        "shortCaption": "딸을 잃은 상처로 대륙 본토인을 깊이 불신하던 에올루스 국왕은 동맹의 조건으로 무예와 지략, 신념의 세 가지 시험을 내린다.",
        "shortQuote": "조심해라, 카단. 에올루스 왕의 폭풍검은 황궁의 기사단장들조차 일격에 베어…",
        "narration": "딸을 잃은 상처로 대륙 본토인을 깊이 불신하던 에올루스 국왕은 동맹의 조건으로 무예와 지략, 신념의 세 가지 시험을 내린다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "조심해라, 카단. 에올루스 왕의 폭풍검은 황궁의 기사단장들조차 일격에 베어 넘기는 왕국의 전설적인 성물이다."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_19/scene_26.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep19_cut3.mp3",
        "shortCaption": "카단은 살을 에는 폭풍 화살을 대지의 별빛 호흡으로 묵묵히 견뎌내고, 실리아는 흔들림 없는 지혜로 문답을 풀어낸다.",
        "shortQuote": "복수심에 눈이 멀지 않고... 오직 지키려는 마음으로 환영을 부수었단 말인가...",
        "narration": "카단은 살을 에는 폭풍 화살을 대지의 별빛 호흡으로 묵묵히 견뎌내고, 실리아는 흔들림 없는 지혜로 문답을 풀어낸다.",
        "speakerName": "국왕 에올루스",
        "speakerRole": "바람 속삭임 섬의 왕 · 실리아의 외조부",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/025_Aeolus.png",
        "quote": "복수심에 눈이 멀지 않고... 오직 지키려는 마음으로 환영을 부수었단 말인가..."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_19/scene_37.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep19_cut4.mp3",
        "shortCaption": "마지막 시험에서 이그니스가 동료를 대신해 스스로 벌을 받겠다 나서자, 국왕의 얼어붙었던 마음이 마침내 녹아내린다.",
        "shortQuote": "아버지! 진실을 보지 못하는 맹목적인 칼날이라면, 제 심장을 먼저 꿰뚫으세요!",
        "narration": "마지막 시험에서 이그니스가 동료를 대신해 스스로 벌을 받겠다 나서자, 국왕의 얼어붙었던 마음이 마침내 녹아내린다.",
        "speakerName": "실리아",
        "speakerRole": "바람 속삭임 섬의 왕 · 실리아의 외조부",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/025_Aeolus.png",
        "quote": "젊은 기사여, 그대의 방패가 내 어두운 눈을 틔워주었소. 알렉산다르 경의 영혼이 그대 안에서 자랑스럽게 미소 짓고 있을 것이오."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_19/scene_46.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep19_cut5.mp3",
        "shortCaption": "바람섬 군대의 본토 출병 동맹을 최종 성사시키기 위해, 천공의 군주 에올루스 국왕의 마지막 대련 시험을 통과한다.",
        "shortQuote": "에올루스가 비장한 표정으로 결계탑의 문을 가리켰다.",
        "narration": "바람섬 군대의 본토 출병 동맹을 최종 성사시키기 위해, 천공의 군주 에올루스 국왕의 마지막 대련 시험을 통과한다.",
        "speakerName": "에올루스",
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
    "coverIllustrationUrl": "/images/webtoon/episode_20/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_20/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep20_cut1.mp3",
        "shortCaption": "국왕의 승인으로 수백 척의 바람섬 꽃배 선단이 대륙 해방을 위한 역사적인 출항 준비를 마친다.",
        "shortQuote": "어리석은 에올루스와 철없는 왕녀여!",
        "narration": "국왕의 승인으로 수백 척의 바람섬 꽃배 선단이 대륙 해방을 위한 역사적인 출항 준비를 마친다.",
        "speakerName": "대장로 제피르",
        "speakerRole": "바람섬 여왕 독살 반역자",
        "speakerCutoutUrl": "/hs-assets/bosses/boss_zephyr.webp",
        "quote": "어리석은 에올루스와 철없는 왕녀여! 바람 속삭임 섬은 오늘부로 신세계를 열어젖힐 거대한 제물이 될 것이다! 대해의 심연이 모든 것을 삼키고 나면, 황실과 내가 손을 잡고 이 대륙의 새로운 지배자로 군림할 것이다!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_20/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep20_cut2.mp3",
        "shortCaption": "그러나 음모가 발각된 제피르 대장로가 비취 결계탑에 나인섀도우 코덱스의 암흑 핵을 꽂아 바다 밑 고대 괴수를 깨운다.",
        "shortQuote": "바람 속삭임 섬의 백성들이여, 내 목소리를 들으세요!",
        "narration": "그러나 음모가 발각된 제피르 대장로가 비취 결계탑에 나인섀도우 코덱스의 암흑 핵을 꽂아 바다 밑 고대 괴수를 깨운다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "바람 속삭임 섬의 백성들이여, 내 목소리를 들으세요! 나는 실피드 여왕의 딸 실리아입니다! 육지에는 더 이상 도망칠 곳이 없습니다! 항구에 정박한 모든 꽃배에 올라타세요! 축제의 꽃배들이 우리를 살릴 구원의 방주가 될 것입니다!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_20/scene_25.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep20_cut3.mp3",
        "shortCaption": "검붉은 해일이 수평선을 뒤덮으며 타락한 바다의 재앙 심연룡 리바이어던이 거대한 아가리를 벌리고 솟구쳐 오른다.",
        "shortQuote": "서둘러라! 파도가 부두를 집어삼키기 전에 닻줄을 풀고 바다로 나가야 한다!",
        "narration": "검붉은 해일이 수평선을 뒤덮으며 타락한 바다의 재앙 심연룡 리바이어던이 거대한 아가리를 벌리고 솟구쳐 오른다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "서둘러라! 파도가 부두를 집어삼키기 전에 닻줄을 풀고 바다로 나가야 한다!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_20/scene_36.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep20_cut4.mp3",
        "shortCaption": "선단이 수장될 위기의 순간, 카단이 기함 뱃머리 최전선에 우뚝 서서 별빛 방패 결계를 펼쳐 암흑 마나포를 받아낸다.",
        "shortQuote": "사라져라, 심연의 괴물이여!",
        "narration": "선단이 수장될 위기의 순간, 카단이 기함 뱃머리 최전선에 우뚝 서서 별빛 방패 결계를 펼쳐 암흑 마나포를 받아낸다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "사라져라, 심연의 괴물이여!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_20/scene_45.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep20_cut5.mp3",
        "shortCaption": "수백 척 동맹 선단의 바닷길을 열기 위해, 폭풍의 바다 위에서 심연룡 리바이어던과 사투를 벌인다.",
        "shortQuote": "우리가 지켜야 할 것은 과거의 돌무더기가 아니라, 미래를 살아갈 사람들의 온기다.",
        "narration": "수백 척 동맹 선단의 바닷길을 열기 위해, 폭풍의 바다 위에서 심연룡 리바이어던과 사투를 벌인다.",
        "speakerName": "실리아",
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
    "coverIllustrationUrl": "/images/webtoon/episode_21/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_21/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep21_cut1.mp3",
        "shortCaption": "거센 파도를 넘어 마침내 대륙 서남부 세븐브리지 해안에 닿았지만, 일행을 맞이한 것은 불타버린 구호소와 검은 연기였다.",
        "shortQuote": "이 잔인무도한 놈들...",
        "narration": "거센 파도를 넘어 마침내 대륙 서남부 세븐브리지 해안에 닿았지만, 일행을 맞이한 것은 불타버린 구호소와 검은 연기였다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "이 잔인무도한 놈들... 피난민들의 발을 묶기 위해 민간 항구와 어선들까지 모조리 불태워 버렸구나. 십 년 전만 해도 온갖 곡식과 비단이 오가던 번영하던 항구였거늘, 권력에 눈이 먼 자들의 광기가 끝이 없구나."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_21/scene_13.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep21_cut2.mp3",
        "shortCaption": "루시안의 명을 받은 철갑섭정 데스나이트 아르투스가 동맹군의 상륙을 막기 위해 해안 마을을 불태우고 봉쇄한 것이다.",
        "shortQuote": "오오, 빛의 신이시여!",
        "narration": "루시안의 명을 받은 철갑섭정 데스나이트 아르투스가 동맹군의 상륙을 막기 위해 해안 마을을 불태우고 봉쇄한 것이다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "오오, 빛의 신이시여! 성기사의 방패가 돌아왔구나! 루시안의 붉은 늑대 기사단이 항구를 불태우고 젊은이들을 광산으로 끌고 갔지만, 지하 소금 창고에 어린아이 스무 명을 숨겨두었습니다!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_21/scene_24.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep21_cut3.mp3",
        "shortCaption": "불길 속에 고립된 해안 주민들을 향해 아르투스의 중갑 궁수대가 자비 없는 불화살 세례를 퍼붓는다.",
        "shortQuote": "형아... 기사 아저씨들이 우리 집을 불태웠어요... 엄마는 어디로 간 거예요?",
        "narration": "불길 속에 고립된 해안 주민들을 향해 아르투스의 중갑 궁수대가 자비 없는 불화살 세례를 퍼붓는다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "형아... 기사 아저씨들이 우리 집을 불태웠어요... 엄마는 어디로 간 거예요?"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_21/scene_34.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep21_cut4.mp3",
        "shortCaption": "카단은 무쇠 방패를 머리 위로 치켜들고 화염 속으로 뛰어들어 피난민들을 구해내며 이그니스, 실리아와 진열을 갖춘다.",
        "shortQuote": "아이들에게 단 한 발자국도 다가서지 못한다!” 카단은 별의 호흡을 실어 방패를…",
        "narration": "카단은 무쇠 방패를 머리 위로 치켜들고 화염 속으로 뛰어들어 피난민들을 구해내며 이그니스, 실리아와 진열을 갖춘다.",
        "speakerName": "카단",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "이그니스! 네놈이 정녕 황궁의 은혜를 저버리고 반역자들의 하수인이 되었단 말이냐! 루시안 재상 각하께서 네놈의 목에 제국 최고의 현상금을 거셨다!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_21/scene_43.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep21_cut5.mp3",
        "shortCaption": "대륙 본토 진격의 첫 교두보를 탈환하기 위해, 해안을 짓밟는 철갑섭정 아르투스의 봉쇄군을 정면 격파한다.",
        "shortQuote": "이그니스가 주먹을 불끈 쥐며 대답했다.",
        "narration": "대륙 본토 진격의 첫 교두보를 탈환하기 위해, 해안을 짓밟는 철갑섭정 아르투스의 봉쇄군을 정면 격파한다.",
        "speakerName": "이그니스",
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
    "coverIllustrationUrl": "/images/webtoon/episode_22/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_22/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep22_cut1.mp3",
        "shortCaption": "수도로 진격하는 유일한 좁은 수로인 사이렌 해협 양쪽 절벽에는 요새사령관 볼칸의 마도 화포 진지가 도사리고 있었다.",
        "shortQuote": "저 철갑선들의 흘수선이 너무 깊어 우리 꽃배들이 접근하기도 전에 마나포에 수장되고 말겠어.",
        "narration": "수도로 진격하는 유일한 좁은 수로인 사이렌 해협 양쪽 절벽에는 요새사령관 볼칸의 마도 화포 진지가 도사리고 있었다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "저 철갑선들의 흘수선이 너무 깊어 우리 꽃배들이 접근하기도 전에 마나포에 수장되고 말겠어. 암벽 위의 쇠뇌 포탑들을 먼저 침묵시키지 않고는 단 한 척도 해협을 빠져나갈 수 없다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_22/scene_16.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep22_cut2.mp3",
        "shortCaption": "선단이 한 발짝만 들어서도 포화에 전멸할 상황에서, 일행은 해협 입구의 바위 무인도에 은밀히 상륙해 대책을 논의한다.",
        "shortQuote": "정면으로 부딪치면 희생이 너무 크다.",
        "narration": "선단이 한 발짝만 들어서도 포화에 전멸할 상황에서, 일행은 해협 입구의 바위 무인도에 은밀히 상륙해 대책을 논의한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "정면으로 부딪치면 희생이 너무 크다. 소수의 결사대가 먼저 상륙하여 길을 뚫어야 한다."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_22/scene_29.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep22_cut3.mp3",
        "shortCaption": "실리아는 해저 대왕 다시마의 강력한 탄성을 이용한 초거대 투석기를 고안하고, 스승 그림리가 밤새 강철 프레임을 벼려낸다.",
        "shortQuote": "스승님께서는 기술이란 파괴가 아니라, 소중한 이들을 지키기 위한 지혜의 발현이라고 가르치셨습니다.",
        "narration": "실리아는 해저 대왕 다시마의 강력한 탄성을 이용한 초거대 투석기를 고안하고, 스승 그림리가 밤새 강철 프레임을 벼려낸다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "스승님께서는 기술이란 파괴가 아니라, 소중한 이들을 지키기 위한 지혜의 발현이라고 가르치셨습니다. 이 투석기는 길을 막아선 폭력을 부수고 사람들을 살릴 문을 여는 열쇠입니다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_22/scene_42.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep22_cut4.mp3",
        "shortCaption": "새벽안개가 걷히는 순간 카단이 괴력으로 시위를 당겨 바위 탄환을 날리자, 난공불락이던 절벽 화포 진지가 흔들린다.",
        "shortQuote": "발사해라, 애송이!” 쿠우웅!",
        "narration": "새벽안개가 걷히는 순간 카단이 괴력으로 시위를 당겨 바위 탄환을 날리자, 난공불락이던 절벽 화포 진지가 흔들린다.",
        "speakerName": "그림리",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "목표, 전방 삼천 보 거리의 황실 제1철갑선 기관실이다!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_22/scene_52.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep22_cut5.mp3",
        "shortCaption": "사이렌 해협의 해상 봉쇄망을 완전히 무너뜨리기 위해, 무인도 공성전으로 요새사령관 볼칸의 본진을 타격한다.",
        "shortQuote": "잘했다, 아이들아! 첫 번째 관문을 멋지게 뚫어냈구나! 이제 용의 뿔 산맥의…",
        "narration": "사이렌 해협의 해상 봉쇄망을 완전히 무너뜨리기 위해, 무인도 공성전으로 요새사령관 볼칸의 본진을 타격한다.",
        "speakerName": "그림리",
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
    "coverIllustrationUrl": "/images/webtoon/episode_23/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_23/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep23_cut1.mp3",
        "shortCaption": "사이렌 해협을 통과한 동맹군은 수도 외곽 용의 뿔 산맥 기슭에서 옛 아케 성기사단이 남긴 비밀 해안 석굴을 발견한다.",
        "shortQuote": "이곳이 틀림없다. 이십 년 전 발리안 경과 알렉산다르 경이 제국군의 포위망을…",
        "narration": "사이렌 해협을 통과한 동맹군은 수도 외곽 용의 뿔 산맥 기슭에서 옛 아케 성기사단이 남긴 비밀 해안 석굴을 발견한다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "이곳이 틀림없다. 이십 년 전 발리안 경과 알렉산다르 경이 제국군의 포위망을 뚫고 피난민들을 숨겨두었던 비밀 거점이지. 아직도 바위틈에서 성기사단의 결계 마나 냄새가 희미하게 풍겨오는구나."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_23/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep23_cut2.mp3",
        "shortCaption": "석굴 벽면 가득히 제1차 성전 당시 어둠의 군단에 맞섰던 선대 영웅들과 아버지 알렉산다르, 발리안의 기록이 새겨져 있었다.",
        "shortQuote": "스승님의 숭고한 신념이 이 차가운 돌벽 속에 살아남아 우리를 여기까지 인도해 준 거예요.",
        "narration": "석굴 벽면 가득히 제1차 성전 당시 어둠의 군단에 맞섰던 선대 영웅들과 아버지 알렉산다르, 발리안의 기록이 새겨져 있었다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "스승님의 숭고한 신념이 이 차가운 돌벽 속에 살아남아 우리를 여기까지 인도해 준 거예요."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_23/scene_28.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep23_cut3.mp3",
        "shortCaption": "그러나 성스러운 묘역 깊숙한 곳에서 사령술사 간다르가 잠든 성기사들의 유해를 도굴해 암흑 망령으로 되살리고 있었다.",
        "shortQuote": "이 지하 수로를 통하면 황궁 중앙 대성당 지하로 직통할 수 있다.",
        "narration": "그러나 성스러운 묘역 깊숙한 곳에서 사령술사 간다르가 잠든 성기사들의 유해를 도굴해 암흑 망령으로 되살리고 있었다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "이 지하 수로를 통하면 황궁 중앙 대성당 지하로 직통할 수 있다. 루시안의 눈을 피해 수도의 심장부로 침투할 수 있는 유일한 통로다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_23/scene_39.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep23_cut4.mp3",
        "shortCaption": "선배 기사들의 영혼이 고통 속에 울부짖자, 아버지의 뜻을 이은 카단의 은빛 단검이 푸른 성광을 뿜으며 공명한다.",
        "shortQuote": "이것은 석굴 안쪽에 숨겨진 ‘봉인된 무기고’의 열쇠예요.",
        "narration": "선배 기사들의 영혼이 고통 속에 울부짖자, 아버지의 뜻을 이은 카단의 은빛 단검이 푸른 성광을 뿜으며 공명한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이것은 석굴 안쪽에 숨겨진 ‘봉인된 무기고’의 열쇠예요. 선대 영웅들이 최후의 결전을 위해 봉인해 둔 전설의 무구들이 잠들어 있는 곳이에요."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_23/scene_49.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep23_cut5.mp3",
        "shortCaption": "선대 성기사들의 안식처를 더럽히는 사령술사 간다르의 망령 군단을 정화하고 비밀 통로를 확보한다.",
        "shortQuote": "카단이 은빛 단검을 갈무리하며 고개를 끄덕였다.",
        "narration": "선대 성기사들의 안식처를 더럽히는 사령술사 간다르의 망령 군단을 정화하고 비밀 통로를 확보한다.",
        "speakerName": "카단",
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
    "coverIllustrationUrl": "/images/webtoon/episode_24/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_24/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep24_cut1.mp3",
        "shortCaption": "석굴 가장 깊은 곳, 수백 길 높이의 아다만티움 철문 너머에는 제1차 성전 열두 성기사가 봉인한 최후의 성물이 잠들어 있었다.",
        "shortQuote": "이 문은 성기사의 순수한 신념, 바람 왕실의 고결한 혈통, 그리고 순백 화염의…",
        "narration": "석굴 가장 깊은 곳, 수백 길 높이의 아다만티움 철문 너머에는 제1차 성전 열두 성기사가 봉인한 최후의 성물이 잠들어 있었다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이 문은 성기사의 순수한 신념, 바람 왕실의 고결한 혈통, 그리고 순백 화염의 맹세가 한데 모여 공명해야만 열리는 ‘삼위일체의 봉인’이에요. 세 사람의 마나가 단 한 치의 오차도 없이 일치해야 해요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_24/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep24_cut2.mp3",
        "shortCaption": "성물을 지키는 고대의 파수꾼 아다만티움 수호거신이 깨어나 계승자의 용기와 수호 의지를 시험하며 앞을 가로막는다.",
        "shortQuote": "빛과 바람, 불꽃이 하나로 어우러질 때 대륙의 수호자가 깨어날 것이다.",
        "narration": "성물을 지키는 고대의 파수꾼 아다만티움 수호거신이 깨어나 계승자의 용기와 수호 의지를 시험하며 앞을 가로막는다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "빛과 바람, 불꽃이 하나로 어우러질 때 대륙의 수호자가 깨어날 것이다. 알렉산다르 스승님께서 남기신 마지막 예언이다."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_24/scene_26.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep24_cut3.mp3",
        "shortCaption": "카단은 공격 대신 모든 충격을 대지로 흘려보내는 별빛 호흡의 극의를 발휘해 거신의 무거운 철퇴를 정면으로 받아낸다.",
        "shortQuote": "저 방패라면 루시안의 암흑 마도포조차 산산조각 낼 수 있겠군.",
        "narration": "카단은 공격 대신 모든 충격을 대지로 흘려보내는 별빛 호흡의 극의를 발휘해 거신의 무거운 철퇴를 정면으로 받아낸다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "저 방패라면 루시안의 암흑 마도포조차 산산조각 낼 수 있겠군. 네 어깨에 대륙의 미래가 실려 있다, 카단."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_24/scene_37.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep24_cut4.mp3",
        "shortCaption": "마침 수도 라이트헤븐에서 루시안이 황권을 찬탈하기 위해 거짓 혼례식을 강행한다는 긴급 전령이 도착한다.",
        "shortQuote": "이제 모든 준비는 끝났다. 이 비밀 수로를 통해 수도 황궁으로 진입한다.",
        "narration": "마침 수도 라이트헤븐에서 루시안이 황권을 찬탈하기 위해 거짓 혼례식을 강행한다는 긴급 전령이 도착한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "이제 모든 준비는 끝났다. 이 비밀 수로를 통해 수도 황궁으로 진입한다."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_24/scene_46.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep24_cut5.mp3",
        "shortCaption": "전설의 성물 드래곤 브레이커 방패를 계승하고 수도로 달려가기 위해, 아다만티움 수호거신의 시련을 돌파한다.",
        "shortQuote": "수도 대성당에서는 지금 루시안이 황실의 지배권을 확고히 하기 위해 강제로 꾸며낸…",
        "narration": "전설의 성물 드래곤 브레이커 방패를 계승하고 수도로 달려가기 위해, 아다만티움 수호거신의 시련을 돌파한다.",
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
    "coverIllustrationUrl": "/images/webtoon/episode_25/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_25/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep25_cut1.mp3",
        "shortCaption": "수천 개의 촛불이 켜진 수도 백리석 대성당에서 최고 재상 루시안은 왕위를 가로채기 위한 거짓 혼례식을 강행한다.",
        "shortQuote": "제단 중앙에 서 있는 실비아 영애의 손목에 검은 마나 족쇄가 채워져 있어요.",
        "narration": "수천 개의 촛불이 켜진 수도 백리석 대성당에서 최고 재상 루시안은 왕위를 가로채기 위한 거짓 혼례식을 강행한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "제단 중앙에 서 있는 실비아 영애의 손목에 검은 마나 족쇄가 채워져 있어요. 저건 메두사 고르고의 꼭두각시 저주 족쇄예요. 영혼을 마비시켜 강제로 혼인 서약서에 피의 서명을 하게 만들려는 수작이에요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_25/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep25_cut2.mp3",
        "shortCaption": "예식이 절정에 달한 순간, 성당의 거대한 청동문이 열리며 백색 성화를 두른 이그니스와 카단, 실리아가 당당히 걸어 들어온다.",
        "shortQuote": "거짓된 혼례로 백성들을 속이지 마라, 살인마 루시안!",
        "narration": "예식이 절정에 달한 순간, 성당의 거대한 청동문이 열리며 백색 성화를 두른 이그니스와 카단, 실리아가 당당히 걸어 들어온다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "거짓된 혼례로 백성들을 속이지 마라, 살인마 루시안! 백색 화염 기사단의 진정한 불꽃이 네 추악한 죄악을 심판하러 왔다!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_25/scene_27.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep25_cut3.mp3",
        "shortCaption": "이그니스는 운집한 수도 시민들 앞에서 루시안이 저지른 엘윈 마을 학살과 바람섬 여왕 독살의 모든 증거를 만천하에 폭로한다.",
        "shortQuote": "루시안은 제 가문의 고대 영지 증서를 빼앗기 위해 제 부모님을 감옥에 가두었습니다.",
        "narration": "이그니스는 운집한 수도 시민들 앞에서 루시안이 저지른 엘윈 마을 학살과 바람섬 여왕 독살의 모든 증거를 만천하에 폭로한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "루시안은 제 가문의 고대 영지 증서를 빼앗기 위해 제 부모님을 감옥에 가두었습니다. 제발 제 가문과 백성들을 구해주세요!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_25/scene_39.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep25_cut4.mp3",
        "shortCaption": "진실에 분노한 시민들이 일제히 봉기하자, 궁지에 몰린 루시안은 대심판관 말라카이에게 성당 진압을 맡기고 내궁으로 도주한다.",
        "shortQuote": "카단이 무쇠 방패를 굳건히 세우며 아르투스의 앞을 막아섰다.",
        "narration": "진실에 분노한 시민들이 일제히 봉기하자, 궁지에 몰린 루시안은 대심판관 말라카이에게 성당 진압을 맡기고 내궁으로 도주한다.",
        "speakerName": "카단",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "아르투스! 저 버러지 놈들을 모조리 찢어발겨라!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_25/scene_48.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep25_cut5.mp3",
        "shortCaption": "깨어난 수도 시민들을 보호하고 루시안을 추격하기 위해, 위선에 물든 대심판관 말라카이의 근위 사제단을 무너뜨린다.",
        "shortQuote": "보았느냐, 카단. 사람들의 가슴속에 잠들어 있던 빛이 마침내 깨어났다.",
        "narration": "깨어난 수도 시민들을 보호하고 루시안을 추격하기 위해, 위선에 물든 대심판관 말라카이의 근위 사제단을 무너뜨린다.",
        "speakerName": "이그니스",
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
    "coverIllustrationUrl": "/images/webtoon/episode_26/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_26/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep26_cut1.mp3",
        "shortCaption": "대성당의 진실 폭로와 함께 횃불을 든 수도 상인과 노동자들이 합류하며 황궁 제1관문인 태양의 철문 앞에 운집한다.",
        "shortQuote": "철문은 부수었지만 아직 싸움은 끝나지 않았다.",
        "narration": "대성당의 진실 폭로와 함께 횃불을 든 수도 상인과 노동자들이 합류하며 황궁 제1관문인 태양의 철문 앞에 운집한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "철문은 부수었지만 아직 싸움은 끝나지 않았다. 루시안은 내궁 깊숙한 흑요석 탑에 틀어박혀 결사항전을 준비하고 있다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_26/scene_16.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep26_cut2.mp3",
        "shortCaption": "철문 위를 지키는 황궁 수문장 발타자르와 수비병들은 루시안이 새긴 뱀 문신의 세뇌 저주에 조종당해 백성에게 창을 겨눈다.",
        "shortQuote": "물 밑바닥에 메두사 고르고의 산란관들이 흉측하게 얽혀 있어요.",
        "narration": "철문 위를 지키는 황궁 수문장 발타자르와 수비병들은 루시안이 새긴 뱀 문신의 세뇌 저주에 조종당해 백성에게 창을 겨눈다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "물 밑바닥에 메두사 고르고의 산란관들이 흉측하게 얽혀 있어요. 루시안이 황궁을 통째로 마수들의 번식지로 개조하려 했던 거예요."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_26/scene_29.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep26_cut3.mp3",
        "shortCaption": "카단과 이그니스는 무고한 병사들을 베지 않기로 결심하고, 방패와 검등만으로 갑옷 위 저주의 문신 핵만을 정확히 타격한다.",
        "shortQuote": "그 틈을 타 이그니스가 번개처럼 도약했다.",
        "narration": "카단과 이그니스는 무고한 병사들을 베지 않기로 결심하고, 방패와 검등만으로 갑옷 위 저주의 문신 핵만을 정확히 타격한다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "정화의 불꽃이여, 타락한 영혼에 안식을!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_26/scene_41.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep26_cut4.mp3",
        "shortCaption": "두 형제의 헌신적인 비살상 진격에 병사들이 하나둘 제정신을 되찾지만, 저주가 폭주한 발타자르가 최후의 광란을 일으킨다.",
        "shortQuote": "실리아가 안타까운 눈빛으로 백작의 눈을 감겨주었다.",
        "narration": "두 형제의 헌신적인 비살상 진격에 병사들이 하나둘 제정신을 되찾지만, 저주가 폭주한 발타자르가 최후의 광란을 일으킨다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "죄는 미우나 공포에 영혼을 빼앗긴 자의 말로는 비참하군요. 부디 다음 생에는 자유로운 바람으로 태어나기를."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_26/scene_51.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep26_cut5.mp3",
        "shortCaption": "세뇌당한 수문장 발타자르의 저주를 부수어 구원하고 굳게 닫힌 태양의 철문을 활짝 열어젖힌다.",
        "shortQuote": "카단이 은빛 단검의 붉은 매듭을 만지며 대답했다.",
        "narration": "세뇌당한 수문장 발타자르의 저주를 부수어 구원하고 굳게 닫힌 태양의 철문을 활짝 열어젖힌다.",
        "speakerName": "카단",
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
    "coverIllustrationUrl": "/images/webtoon/episode_27/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_27/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep27_cut1.mp3",
        "shortCaption": "황궁 최심부 비취 평의회 결전을 하루 앞둔 자정, 고요한 내궁 정원에서 세 청년은 폭풍 전야의 짧은 휴식을 맞는다.",
        "shortQuote": "실리아가 은잔 하나를 카단에게 건네며 미소를 지었다.",
        "narration": "황궁 최심부 비취 평의회 결전을 하루 앞둔 자정, 고요한 내궁 정원에서 세 청년은 폭풍 전야의 짧은 휴식을 맞는다.",
        "speakerName": "실리아",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "잠이 오지 않나요, 카단? 내일이면 십팔 년간 얽혀 있던 대륙의 오랜 악연이 결판날 텐데, 당신의 등은 여전히 북방의 바위처럼 묵직하네요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_27/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep27_cut2.mp3",
        "shortCaption": "실리아는 전쟁이 끝나면 북방의 봄날 보리밭으로 돌아가 평범하게 함께 살아가자는 오랜 진심을 카단에게 조용히 고백한다.",
        "shortQuote": "따뜻한 모닥불이라...",
        "narration": "실리아는 전쟁이 끝나면 북방의 봄날 보리밭으로 돌아가 평범하게 함께 살아가자는 오랜 진심을 카단에게 조용히 고백한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "따뜻한 모닥불이라... 참으로 카단다운 소망이네요. 그렇다면 전쟁이 끝난 뒤에, 저를 그 북방의 모닥불 곁으로 초대해 주시겠어요? 바람 속삭임 섬의 백합 향유를 가져가서 당신의 오두막을 향긋하게 채워드릴게요."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_27/scene_26.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep27_cut3.mp3",
        "shortCaption": "한편 자신의 과거 업보를 홀로 짊어지려 결심한 이그니스는 카단에게 자신의 순수한 생명 마나가 응축된 유리 불씨를 맡긴다.",
        "shortQuote": "카단이 눈살을 찌푸리며 단호하게 말했다.",
        "narration": "한편 자신의 과거 업보를 홀로 짊어지려 결심한 이그니스는 카단에게 자신의 순수한 생명 마나가 응축된 유리 불씨를 맡긴다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "아니다, 이그니스. 내일 밤 평의회 잠입로를 점검하던 중이었다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_27/scene_37.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep27_cut4.mp3",
        "shortCaption": "그 순간 어둠을 틈타 결전 전야의 지휘부를 암살하려는 독거미 아라크네의 그림자 자객단이 내궁 정원을 급습한다.",
        "shortQuote": "이그니스는 부드러운 미소로 실리아의 말을 받았다.",
        "narration": "그 순간 어둠을 틈타 결전 전야의 지휘부를 암살하려는 독거미 아라크네의 그림자 자객단이 내궁 정원을 급습한다.",
        "speakerName": "이그니스",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "안 돼요, 이그니스! 그런 비장한 희생을 전제로 한 승리는 진정한 구원이 아니에요! 셋이 함께 살아서 돌아가야 해요!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_27/scene_46.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep27_cut5.mp3",
        "shortCaption": "동료들과 나눈 새벽의 약속을 지키기 위해, 카단과 이그니스는 야습해 온 암살단장 아라크네를 물리친다.",
        "shortQuote": "바람의 정령들이 길을 인도하고 있어요. 갑시다, 평의회의 대전각으로.",
        "narration": "동료들과 나눈 새벽의 약속을 지키기 위해, 카단과 이그니스는 야습해 온 암살단장 아라크네를 물리친다.",
        "speakerName": "실리아",
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
    "coverIllustrationUrl": "/images/webtoon/episode_28/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_28/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep28_cut1.mp3",
        "shortCaption": "마침내 돌입한 비취 평의회 대전각에서 루시안과 아르투스는 수도 전체를 증발시킬 금지 유물 심연의 핵을 폭주시키고 있었다.",
        "shortQuote": "신세계의 절대 군주로 군림하리라!",
        "narration": "마침내 돌입한 비취 평의회 대전각에서 루시안과 아르투스는 수도 전체를 증발시킬 금지 유물 심연의 핵을 폭주시키고 있었다.",
        "speakerName": "루시안",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "시간이 되었다! 황제의 피를 바쳐 심연의 차원문을 열고, 신세계의 절대 군주로 군림하리라!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_28/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep28_cut2.mp3",
        "shortCaption": "카단이 드래곤 브레이커 방패로 아르투스의 흑요석 마검을 막아내는 사이, 임계점을 넘은 심연의 핵이 대폭발 직전에 이른다.",
        "shortQuote": "이그니스가 쇠파이프를 꼬나쥐며 루시안을 향해 돌진했다.",
        "narration": "카단이 드래곤 브레이커 방패로 아르투스의 흑요석 마검을 막아내는 사이, 임계점을 넘은 심연의 핵이 대폭발 직전에 이른다.",
        "speakerName": "이그니스",
        "speakerRole": "발리안의 친아들 · 불꽃 궁정의 양자",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/011_Ignis.png",
        "quote": "루시안! 네놈의 더러운 야망은 여기서 끝이다!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_28/scene_28.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep28_cut3.mp3",
        "shortCaption": "누군가 결계 안에서 스스로의 심장 마나로 핵을 태우지 않으면 수도 수십만 백성이 한순간에 소멸할 절체절명의 위기였다.",
        "shortQuote": "차원의 문이 너무 넓게 열렸어요! 결계가 버티지 못해요!",
        "narration": "누군가 결계 안에서 스스로의 심장 마나로 핵을 태우지 않으면 수도 수십만 백성이 한순간에 소멸할 절체절명의 위기였다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "차원의 문이 너무 넓게 열렸어요! 결계가 버티지 못해요!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_28/scene_40.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep28_cut4.mp3",
        "shortCaption": "이그니스는 미소 지으며 형제 카단과 실리아를 결계 밖으로 밀쳐내고, 자신의 생명을 끝까지 불살라 폭주하는 핵을 홀로 봉인한다.",
        "shortQuote": "이그니스————!!",
        "narration": "이그니스는 미소 지으며 형제 카단과 실리아를 결계 밖으로 밀쳐내고, 자신의 생명을 끝까지 불살라 폭주하는 핵을 홀로 봉인한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "이그니스————!!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_28/scene_50.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep28_cut5.mp3",
        "shortCaption": "찬란한 빛으로 산화한 형제 이그니스의 숭고한 희생이 헛되지 않도록, 카단은 눈물을 삼키며 데스나이트 아르투스를 분쇄한다.",
        "shortQuote": "이그니스는 영원히 우리 곁에 있어요.",
        "narration": "찬란한 빛으로 산화한 형제 이그니스의 숭고한 희생이 헛되지 않도록, 카단은 눈물을 삼키며 데스나이트 아르투스를 분쇄한다.",
        "speakerName": "실리아",
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
    "coverIllustrationUrl": "/images/webtoon/episode_29/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_29/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep29_cut1.mp3",
        "shortCaption": "이그니스의 숭고한 희생으로 수도 라이트헤븐은 파멸에서 구원받았으나, 루시안은 혼란을 틈타 북방 검은 늪으로 도주한다.",
        "shortQuote": "실리아가 나지막이 속삭였다.",
        "narration": "이그니스의 숭고한 희생으로 수도 라이트헤븐은 파멸에서 구원받았으나, 루시안은 혼란을 틈타 북방 검은 늪으로 도주한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이 유리 불씨를 쥐고 있으면 이그니스의 정결한 영혼이 손끝으로 고스란히 전해져 와요. 그의 고결한 희생으로 황궁을 구했지만, 곁이 비어버린 슬픔은 쉽게 가시지 않네요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_29/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep29_cut2.mp3",
        "shortCaption": "해방된 수도 광장에 모인 시민들은 지혜와 용기로 나라를 구한 실리아에게 새로운 여왕의 왕관을 바치며 환호한다.",
        "shortQuote": "나를 여왕이라 부르지 마세요. 바람은 결코 왕좌에 앉지 않는 법입니다.",
        "narration": "해방된 수도 광장에 모인 시민들은 지혜와 용기로 나라를 구한 실리아에게 새로운 여왕의 왕관을 바치며 환호한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "나를 여왕이라 부르지 마세요. 바람은 결코 왕좌에 앉지 않는 법입니다."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_29/scene_27.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep29_cut3.mp3",
        "shortCaption": "하지만 실리아는 화려한 옥좌 대신 평생 백성 곁을 걷는 바람의 벗으로 남겠다 선언해 광장 전체를 깊은 감동으로 물들인다.",
        "shortQuote": "네 수문의 결계는 동서남북 네 개의 거대한 수문에서 뿜어져 나오는 지독한 부식성 독기둥이다.",
        "narration": "하지만 실리아는 화려한 옥좌 대신 평생 백성 곁을 걷는 바람의 벗으로 남겠다 선언해 광장 전체를 깊은 감동으로 물들인다.",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "네 수문의 결계는 동서남북 네 개의 거대한 수문에서 뿜어져 나오는 지독한 부식성 독기둥이다. 이 독기를 뚫지 않고는 대군을 진격시킬 수 없어."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_29/scene_39.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep29_cut4.mp3",
        "shortCaption": "선언식이 끝나갈 무렵, 광장 지하 수로에 숨어 있던 맹독여왕 아라크네가 최후의 발악으로 독거미 군단을 몰고 기습한다.",
        "shortQuote": "어리석은 놈들! 이 네 수문의 맹독은 스치기만 해도 뼈까지 녹아내린다! 네놈들의…",
        "narration": "선언식이 끝나갈 무렵, 광장 지하 수로에 숨어 있던 맹독여왕 아라크네가 최후의 발악으로 독거미 군단을 몰고 기습한다.",
        "speakerName": "독거미 아라크네",
        "speakerRole": "루시안 휘하 맹독 암살단장",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/054_Arachne.png",
        "quote": "어리석은 놈들! 이 네 수문의 맹독은 스치기만 해도 뼈까지 녹아내린다! 네놈들의 발걸음은 여기서 끝이다!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_29/scene_48.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep29_cut5.mp3",
        "shortCaption": "이그니스가 남긴 유리 불씨를 가슴에 품은 카단과 실리아는 광장을 습격한 맹독여왕 아라크네를 완전히 처단한다.",
        "shortQuote": "그래. 이 불씨가 꺼지지 않는 한, 우리는 결코 길을 잃지 않는다.",
        "narration": "이그니스가 남긴 유리 불씨를 가슴에 품은 카단과 실리아는 광장을 습격한 맹독여왕 아라크네를 완전히 처단한다.",
        "speakerName": "카단",
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
    "coverIllustrationUrl": "/images/webtoon/episode_30/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_30/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep30_cut1.mp3",
        "shortCaption": "루시안의 최후 본거지 검은 늪으로 북진하는 동맹군 앞을 깎아지른 협곡의 거대 방어선 네 수문 요새가 가로막는다.",
        "shortQuote": "그림리가 도끼자루로 바닥돌을 두드리며 혀를 찼다.",
        "narration": "루시안의 최후 본거지 검은 늪으로 북진하는 동맹군 앞을 깎아지른 협곡의 거대 방어선 네 수문 요새가 가로막는다.",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "고약한 독기로군! 쇠붙이마저 삭혀버리는 산성 독무다. 이 독기를 마시면 아무리 장사라도 십 리를 못 가고 피를 토하며 쓰러질 게야."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_30/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep30_cut2.mp3",
        "shortCaption": "메두사 고르고와 타락수문장 아쿠아로드가 상류 저수지에 치명적인 부식 맹독을 풀어 하류 백성들을 수장시키려 한다.",
        "shortQuote": "이그니스가 열어준 길이다. 지체할 시간 없다. 네 개의 수문 핵을 차례로 파괴한다.",
        "narration": "메두사 고르고와 타락수문장 아쿠아로드가 상류 저수지에 치명적인 부식 맹독을 풀어 하류 백성들을 수장시키려 한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "이그니스가 열어준 길이다. 지체할 시간 없다. 네 개의 수문 핵을 차례로 파괴한다."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_30/scene_26.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep30_cut3.mp3",
        "shortCaption": "수문이 열리기까지 남은 시간은 단 몇 분, 스승 론돌과 약제사 엘리아나가 필사적으로 우회 해독 수로를 개방한다.",
        "shortQuote": "바람 속삭임 섬의 정령들이여! 대지의 독기를 씻어낼 정화의 은빛 폭풍을 내리소서!",
        "narration": "수문이 열리기까지 남은 시간은 단 몇 분, 스승 론돌과 약제사 엘리아나가 필사적으로 우회 해독 수로를 개방한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "바람 속삭임 섬의 정령들이여! 대지의 독기를 씻어낼 정화의 은빛 폭풍을 내리소서!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_30/scene_37.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep30_cut4.mp3",
        "shortCaption": "그사이 카단과 실리아는 폭풍우가 몰아치는 수문 성벽을 수직으로 돌파해 독기 방류 장치가 있는 정상으로 돌격한다.",
        "shortQuote": "우리가 지켜야 할 사람들의 온기가 있는 한, 이 방패는 결코 녹아내리지 않는다!",
        "narration": "그사이 카단과 실리아는 폭풍우가 몰아치는 수문 성벽을 수직으로 돌파해 독기 방류 장치가 있는 정상으로 돌격한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "우리가 지켜야 할 사람들의 온기가 있는 한, 이 방패는 결코 녹아내리지 않는다!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_30/scene_46.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep30_cut5.mp3",
        "shortCaption": "수천 명의 의용군과 피난민을 지켜내기 위해, 네 수문 요새를 장악한 타락수문장 아쿠아로드를 단숨에 제압한다.",
        "shortQuote": "형제가 남겨준 등불을 따라, 최후의 어둠을 심판하러 가자.",
        "narration": "수천 명의 의용군과 피난민을 지켜내기 위해, 네 수문 요새를 장악한 타락수문장 아쿠아로드를 단숨에 제압한다.",
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
    "coverIllustrationUrl": "/images/webtoon/episode_31/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_31/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep31_cut1.mp3",
        "shortCaption": "네 수문을 넘어선 연합군은 바닥 없는 모래 소용돌이가 흐르는 모래강 유일의 다리에서 흑마법 도박사 간다르와 마주친다.",
        "shortQuote": "이 흐르는 모래강은 바다보다.",
        "narration": "네 수문을 넘어선 연합군은 바닥 없는 모래 소용돌이가 흐르는 모래강 유일의 다리에서 흑마법 도박사 간다르와 마주친다.",
        "speakerName": "론돌",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "이 흐르는 모래강은 바다보다 더 고약해. 일반 목재 배는 띄우자마자 진흙의 무게를 못 이기고 가라앉아 버리지. 오직 늪지대 고블린들이 만든 특수 부유선 ‘갈대나룻배’만이 이 강을 건널 수 있다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_31/scene_17.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep31_cut2.mp3",
        "shortCaption": "간다르는 포로로 잡은 민간인들의 목숨을 인질로 삼아, 주사위 두 개를 던져 13을 만들어야만 다리를 내주겠다며 조롱한다.",
        "shortQuote": "키히힉! 황궁을 뒤집어엎었다는 성기사의 애송이와 왕녀님이 내 누추한 소굴을 어쩐…",
        "narration": "간다르는 포로로 잡은 민간인들의 목숨을 인질로 삼아, 주사위 두 개를 던져 13을 만들어야만 다리를 내주겠다며 조롱한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "키히힉! 황궁을 뒤집어엎었다는 성기사의 애송이와 왕녀님이 내 누추한 소굴을 어쩐 일로 찾으셨나? 흐르는 모래강을 건널 갈대나룻배 백 척이 필요하다고? 하지만 이 보가트는 공짜로는 숨도 쉬지 않는 몸이라서 말이지!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_31/scene_31.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep31_cut3.mp3",
        "shortCaption": "정상적인 주사위 두 개로는 결코 12를 넘을 수 없는 비열한 사기극 앞에 모두가 분노하지만 인질 때문에 손쓰지 못한다.",
        "shortQuote": "내가 그 뒤에 던지는 것이다.",
        "narration": "정상적인 주사위 두 개로는 결코 12를 넘을 수 없는 비열한 사기극 앞에 모두가 분노하지만 인질 때문에 손쓰지 못한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "좋다. 내 왼팔을 걸겠다. 대신 규칙은 네가 먼저 주사위를 던지고, 내가 그 뒤에 던지는 것이다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_31/scene_44.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep31_cut4.mp3",
        "shortCaption": "스승 카제의 비검술을 떠올린 카단은 주사위가 멈추는 찰나 은빛 단검의 검기를 날려 주사위 하나를 반으로 쪼개 6, 6, 1로 13을 만든다.",
        "shortQuote": "보가트의 얼굴이 흙빛으로 변하며 턱이 덜덜 떨렸다.",
        "narration": "스승 카제의 비검술을 떠올린 카단은 주사위가 멈추는 찰나 은빛 단검의 검기를 날려 주사위 하나를 반으로 쪼개 6, 6, 1로 13을 만든다.",
        "speakerName": "보가트",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "보가트 두목이 자석 주사위를 쓰고 있었잖아! 우리 돈을 사기로 털어간 거였어!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_31/scene_55.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep31_cut5.mp3",
        "shortCaption": "통쾌한 기지로 사기 도박이 깨지자 본색을 드러낸 도박사 간다르의 흑마술 군단을 모래강 다리 위에서 쓸어버린다.",
        "shortQuote": "실리아가 곁에 서며 미소를 지었다.",
        "narration": "통쾌한 기지로 사기 도박이 깨지자 본색을 드러낸 도박사 간다르의 흑마술 군단을 모래강 다리 위에서 쓸어버린다.",
        "speakerName": "실리아",
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
    "coverIllustrationUrl": "/images/webtoon/episode_32/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_32/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep32_cut1.mp3",
        "shortCaption": "모래강을 건넌 연합군은 천 년 묵은 버드나무들이 안개 속에 도열한 검은 늪의 관문 속삭이는 버드나무 숲으로 들어선다.",
        "shortQuote": "이곳은... 어머니 실피드와 아버지 에올루스가 젊은 시절 처음으로 만나 사랑을…",
        "narration": "모래강을 건넌 연합군은 천 년 묵은 버드나무들이 안개 속에 도열한 검은 늪의 관문 속삭이는 버드나무 숲으로 들어선다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이곳은... 어머니 실피드와 아버지 에올루스가 젊은 시절 처음으로 만나 사랑을 맹세하셨던 ‘은빛 버드나무 정원’이에요. 고향 섬의 옛 노래에 나오는 바로 그곳이에요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_32/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep32_cut2.mp3",
        "shortCaption": "숲을 지배하는 환각마녀 모르가나는 사람의 가장 그리운 기억을 파고드는 주술 안개로 병사들의 전의를 무너뜨린다.",
        "shortQuote": "실리아... 내 가여운 딸아... 거친 칼바람 속에서 얼마나 춥고 외로웠니...…",
        "narration": "숲을 지배하는 환각마녀 모르가나는 사람의 가장 그리운 기억을 파고드는 주술 안개로 병사들의 전의를 무너뜨린다.",
        "speakerName": "여왕 실피드",
        "speakerRole": "독살당한 실리아의 어머니",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/023_Sylphid.png",
        "quote": "실리아... 내 가여운 딸아... 거친 칼바람 속에서 얼마나 춥고 외로웠니... 이제 무거운 지팡이를 내려놓고 이 어머니의 품에 안겨 영원히 쉬렴... 더 이상 싸우지 않아도 된단다..."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_32/scene_26.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep32_cut3.mp3",
        "shortCaption": "실리아의 눈앞에도 10년 전 세상을 떠난 어머니 실피드 여왕의 다정한 환영이 나타나 영원히 숲에 머물라며 손짓한다.",
        "shortQuote": "카단... 내가... 내가 잠시 흔들렸어요...",
        "narration": "실리아의 눈앞에도 10년 전 세상을 떠난 어머니 실피드 여왕의 다정한 환영이 나타나 영원히 숲에 머물라며 손짓한다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "카단... 내가... 내가 잠시 흔들렸어요..."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_32/scene_37.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep32_cut4.mp3",
        "shortCaption": "환각에 잠식될 위기의 순간, 카단이 불어준 맑고 청아한 북방의 피리 소리가 안개를 찢으며 실리아의 정신을 일깨운다.",
        "shortQuote": "스승님과 동료들의 영혼을 모독한 죄, 여기서 끝이다!",
        "narration": "환각에 잠식될 위기의 순간, 카단이 불어준 맑고 청아한 북방의 피리 소리가 안개를 찢으며 실리아의 정신을 일깨운다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "스승님과 동료들의 영혼을 모독한 죄, 여기서 끝이다!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_32/scene_46.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep32_cut5.mp3",
        "shortCaption": "그리움을 이겨내고 봄날 보리밭의 약속을 되새긴 두 사람은 마음을 흔드는 환각마녀 모르가나의 주술진을 파훼한다.",
        "shortQuote": "봄날의 보리밭 약속, 반드시 지켜주셔야 해요.",
        "narration": "그리움을 이겨내고 봄날 보리밭의 약속을 되새긴 두 사람은 마음을 흔드는 환각마녀 모르가나의 주술진을 파훼한다.",
        "speakerName": "실리아",
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
    "coverIllustrationUrl": "/images/webtoon/episode_33/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_33/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep33_cut1.mp3",
        "shortCaption": "환각의 숲을 지나자 유황 진흙과 독안개가 들끓는 모든 비극의 종착지, 검은 늪 성채가 거대한 위용을 드러낸다.",
        "shortQuote": "루시안이 대륙 전역에서 끌어모은 최후의 병력이다.",
        "narration": "환각의 숲을 지나자 유황 진흙과 독안개가 들끓는 모든 비극의 종착지, 검은 늪 성채가 거대한 위용을 드러낸다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "루시안이 대륙 전역에서 끌어모은 최후의 병력이다. 성문 앞의 깊은 해자에는 펄펄 끓는 용암과 독극물이 흐르고 있어 평범한 도하로는 접근조차 불가능하다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_33/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep33_cut2.mp3",
        "shortCaption": "루시안은 신의 힘으로도 부술 수 없다는 흑철 성문을 굳게 닫아걸고 거신마인 벨페고르에게 정문 수비를 맡긴다.",
        "shortQuote": "늙은이들의 마지막 불꽃을 보여줄 때가 왔구나! 젊은이들은 내 등 뒤를 따르라!",
        "narration": "루시안은 신의 힘으로도 부술 수 없다는 흑철 성문을 굳게 닫아걸고 거신마인 벨페고르에게 정문 수비를 맡긴다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "늙은이들의 마지막 불꽃을 보여줄 때가 왔구나! 젊은이들은 내 등 뒤를 따르라!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_33/scene_26.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep33_cut3.mp3",
        "shortCaption": "단단한 심연 결계에 막혀 공성전이 교착된 순간, 북방에서 달려온 여섯 스승이 제자 카단의 곁으로 일제히 집결한다.",
        "shortQuote": "모두 흩어져라!” 카단이 방패를 앞으로 내지르며 첫 번째 본드래곤의 브레스를 정면으로 받아냈다.",
        "narration": "단단한 심연 결계에 막혀 공성전이 교착된 순간, 북방에서 달려온 여섯 스승이 제자 카단의 곁으로 일제히 집결한다.",
        "speakerName": "카단",
        "speakerRole": "일곱 추적자 · 거친 파도의 뱃사공",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/046_Rondol.png",
        "quote": "뼈다귀 도마뱀 놈아, 바다의 짠맛을 보아라!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_33/scene_37.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep33_cut4.mp3",
        "shortCaption": "가웨인의 음파검과 그림리의 망치, 에일라의 신궁 등 여섯 스승의 일생 무예가 하나의 빛줄기가 되어 성문 빗장을 강타한다.",
        "shortQuote": "물러설 곳은 없다! 성문을 부수고 루시안의 멱살을 잡아야 한다!",
        "narration": "가웨인의 음파검과 그림리의 망치, 에일라의 신궁 등 여섯 스승의 일생 무예가 하나의 빛줄기가 되어 성문 빗장을 강타한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "물러설 곳은 없다! 성문을 부수고 루시안의 멱살을 잡아야 한다!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_33/scene_46.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep33_cut5.mp3",
        "shortCaption": "자랑스러운 스승들과 어깨를 나란히 한 카단은 검은 늪 성채 정문을 지키는 거신마인 벨페고르를 정면 돌파한다.",
        "shortQuote": "카단이 칼을 높이 치켜들며 전군에 명령했다.",
        "narration": "자랑스러운 스승들과 어깨를 나란히 한 카단은 검은 늪 성채 정문을 지키는 거신마인 벨페고르를 정면 돌파한다.",
        "speakerName": "카단",
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
    "coverIllustrationUrl": "/images/webtoon/episode_34/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_34/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep34_cut1.mp3",
        "shortCaption": "성문이 열리고 내부로 진입하자, 루시안은 침입자 전원을 생매장하기 위해 성채 지하의 대륙 붕괴 룬을 작동시킨다.",
        "shortQuote": "가웨인이 폭풍의 지팡이로 거대한 낙석 하나를 쳐내며 외쳤다.",
        "narration": "성문이 열리고 내부로 진입하자, 루시안은 침입자 전원을 생매장하기 위해 성채 지하의 대륙 붕괴 룬을 작동시킨다.",
        "speakerName": "가웨인",
        "speakerRole": "일곱 추적자 수장 · 맹인 음파 무인",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/045_Gawain.png",
        "quote": "이곳은 성채가 아니라 거대한 무덤이다! 루시안 놈은 처음부터 살아서 나갈 생각이 없었어! 자신의 파멸에 온 대륙을 끌어들이려는 것이다!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_34/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep34_cut2.mp3",
        "shortCaption": "천장의 거대한 유황 암석들이 쏟아져 내리고 발밑 회랑이 끓어오르는 용암 속으로 무섭게 무너지기 시작한다.",
        "shortQuote": "그림리가 모루를 기둥 밑에 쐐기처럼 박아 넣으며 소리쳤다.",
        "narration": "천장의 거대한 유황 암석들이 쏟아져 내리고 발밑 회랑이 끓어오르는 용암 속으로 무섭게 무너지기 시작한다.",
        "speakerName": "그림리",
        "speakerRole": "일곱 추적자 · 드워프 대장장이 스승",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/074_Grimli.png",
        "quote": "카단, 실리아! 뒤돌아보지 말고 제단으로 달려라! 이 늙은 대장장이가 마지막으로 제자의 길을 위해 하늘을 떠받쳐주마!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_34/scene_27.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep34_cut3.mp3",
        "shortCaption": "모두가 갇힐 위기의 순간, 여섯 스승들이 기꺼이 무너지는 석주 아래에 남아 자신의 어깨와 무기로 천장을 떠받친다.",
        "shortQuote": "스승님들... 제발 함께 가요! 제발!",
        "narration": "모두가 갇힐 위기의 순간, 여섯 스승들이 기꺼이 무너지는 석주 아래에 남아 자신의 어깨와 무기로 천장을 떠받친다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "스승님들... 제발 함께 가요! 제발!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_34/scene_38.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep34_cut4.mp3",
        "shortCaption": "뒤돌아보지 말고 대륙의 새벽을 열어달라는 스승들의 마지막 외침에, 카단은 피눈물을 머금고 상층 통로로 질주한다.",
        "shortQuote": "닫혀버린 석벽 너머에서는 오직 고요한 침묵만이 흘러나왔다.",
        "narration": "뒤돌아보지 말고 대륙의 새벽을 열어달라는 스승들의 마지막 외침에, 카단은 피눈물을 머금고 상층 통로로 질주한다.",
        "speakerName": "실리아",
        "speakerRole": "일곱 추적자 · 백발백중 석궁 명사수",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/070_Aila.png",
        "quote": "대륙의 미래를 부탁한다, 성기사의 후예여!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_34/scene_47.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep34_cut5.mp3",
        "shortCaption": "스승들이 목숨 바쳐 열어준 생명의 길을 끝까지 주파하기 위해, 회랑 끝을 막아선 파멸마인 벨페고르를 일소한다.",
        "shortQuote": "실리아 역시 눈물을 거두고 녹옥 지팡이를 곧게 세웠다.",
        "narration": "스승들이 목숨 바쳐 열어준 생명의 길을 끝까지 주파하기 위해, 회랑 끝을 막아선 파멸마인 벨페고르를 일소한다.",
        "speakerName": "실리아",
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
    "coverIllustrationUrl": "/images/webtoon/episode_35/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_35/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep35_cut1.mp3",
        "shortCaption": "스승들의 숭고한 헌신으로 성채 상층부에 도달한 카단과 실리아 앞에는 기괴한 안개가 자욱한 환영의 회랑이 펼쳐진다.",
        "shortQuote": "귀를 막아라, 실리아.",
        "narration": "스승들의 숭고한 헌신으로 성채 상층부에 도달한 카단과 실리아 앞에는 기괴한 안개가 자욱한 환영의 회랑이 펼쳐진다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "귀를 막아라, 실리아. 안개 속에서 들려오는 목소리는 스승님들이 아니다. 적들이 우리의 슬픔을 파고들기 위해 펼쳐둔 비열한 환청이다."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_35/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep35_cut2.mp3",
        "shortCaption": "회랑의 어둠은 방금 헤어진 스승들의 비명 환청을 만들어내며 카단의 죄책감과 슬픔을 집요하게 파고든다.",
        "shortQuote": "우리의 등 뒤에는 수만 명의 생명이 걸려 있다.",
        "narration": "회랑의 어둠은 방금 헤어진 스승들의 비명 환청을 만들어내며 카단의 죄책감과 슬픔을 집요하게 파고든다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "우리의 등 뒤에는 수만 명의 생명이 걸려 있다. 어떤 악령의 속삭임도 우리를 멈추지 못한다."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_35/scene_27.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep35_cut3.mp3",
        "shortCaption": "마음이 흔들린 찰나, 안개 속에서 다섯 개의 환영 분신으로 나뉜 숙적 데스나이트 아르투스가 동시에 심장을 찌른다.",
        "shortQuote": "찾았다!” 카단이 눈을 번쩍 뜨며 드래곤 브레이커 방패를 오른쪽 45도 각도로 힘차게 회전시켰다.",
        "narration": "마음이 흔들린 찰나, 안개 속에서 다섯 개의 환영 분신으로 나뉜 숙적 데스나이트 아르투스가 동시에 심장을 찌른다.",
        "speakerName": "카단",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "바람의 칼날이여, 망령의 사슬을 끊어내라!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_35/scene_39.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep35_cut4.mp3",
        "shortCaption": "그러나 열두 살 폭우 동굴의 가르침을 떠올린 카단은 두 눈을 감고 네 개의 허상 너머 단 하나의 진짜 살기 무게를 짚어낸다.",
        "shortQuote": "무기를 잃은 아르투스는 부러진 갑주를 쥐어뜯으며 절규했다.",
        "narration": "그러나 열두 살 폭우 동굴의 가르침을 떠올린 카단은 두 눈을 감고 네 개의 허상 너머 단 하나의 진짜 살기 무게를 짚어낸다.",
        "speakerName": "데스나이트 아르투스",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "준비되었는가, 실리아."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_35/scene_48.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep35_cut5.mp3",
        "shortCaption": "긴 악연의 끝에서, 카단은 드래곤 브레이커 방패와 은빛 단검으로 숙적 데스나이트 아르투스와 진검승부를 결판낸다.",
        "shortQuote": "더 이상 도망칠 곳은 없다, 루시안.",
        "narration": "긴 악연의 끝에서, 카단은 드래곤 브레이커 방패와 은빛 단검으로 숙적 데스나이트 아르투스와 진검승부를 결판낸다.",
        "speakerName": "카단",
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
    "coverIllustrationUrl": "/images/webtoon/episode_36/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_36/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep36_cut1.mp3",
        "shortCaption": "환영 회랑을 넘어 도달한 최상층 별빛의 기록실에는 대륙 전체의 마나 지맥이 흐르는 거대한 고대 성도가 떠 있었다.",
        "shortQuote": "이 성도는 단순한 지도가 아니에요.",
        "narration": "환영 회랑을 넘어 도달한 최상층 별빛의 기록실에는 대륙 전체의 마나 지맥이 흐르는 거대한 고대 성도가 떠 있었다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "이 성도는 단순한 지도가 아니에요. 대륙 전역에 흐르는 고대 마나의 맥동과 봉인된 룬의 위치가 실시간으로 빛나고 있어요. 하지만 지도의 중심부마다 검붉은 독기가 핏줄처럼 얽혀 있네요."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_36/scene_13.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep36_cut2.mp3",
        "shortCaption": "실리아는 성도에 남겨진 고대 암호를 해독해 네 원소의 지맥이 교차하는 십자 중심점이 바로 파멸의 제단임을 밝혀낸다.",
        "shortQuote": "이 지도는 대륙의 생명선이에요.",
        "narration": "실리아는 성도에 남겨진 고대 암호를 해독해 네 원소의 지맥이 교차하는 십자 중심점이 바로 파멸의 제단임을 밝혀낸다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "북방의 눈꽃, 대해의 바람, 황실의 성화, 그리고 대지의 방패... 네 가지 힘이 교차하는 중심점이 바로 루시안이 서 있는 파멸의 제단이에요. 스승님께서는 이 날을 위해 마지막 파훼법을 남겨두신 거예요."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_36/scene_25.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep36_cut3.mp3",
        "shortCaption": "같은 시각 성채 아래 협곡에서는 북방의 정복왕 펜릴과 의형제 길가메시가 백은 늑대 기병대를 이끌고 지원군으로 당도한다.",
        "shortQuote": "그 불꽃은 지금도 우리와 함께 호흡하고 있다.",
        "narration": "같은 시각 성채 아래 협곡에서는 북방의 정복왕 펜릴과 의형제 길가메시가 백은 늑대 기병대를 이끌고 지원군으로 당도한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "그 불꽃은 지금도 우리와 함께 호흡하고 있다. 세 개의 불꽃과 방패가 마침내 하나가 되었다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_36/scene_35.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep36_cut4.mp3",
        "shortCaption": "승리의 북방 뿔피리 소리가 성채를 뒤흔드는 가운데, 기록실 출구를 지키던 고위흑술사 간다르가 최후의 마법진을 펼친다.",
        "shortQuote": "실리아가 테라스 난간으로 달려 나가 아래를 내려다보며 환호했다.",
        "narration": "승리의 북방 뿔피리 소리가 성채를 뒤흔드는 가운데, 기록실 출구를 지키던 고위흑술사 간다르가 최후의 마법진을 펼친다.",
        "speakerName": "실리아",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "펜릴 왕의 의리가 우리 등의 짐을 덜어주었다. 이제 우리가 옥좌의 마왕을 벨 차례다."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_36/scene_44.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep36_cut5.mp3",
        "shortCaption": "파멸의 제단으로 향하는 마지막 문을 열기 위해, 카단과 실리아는 고위흑술사 간다르의 마도사단을 격파한다.",
        "shortQuote": "우리의 신념이 대륙의 어둠을 밝힐 거예요.",
        "narration": "파멸의 제단으로 향하는 마지막 문을 열기 위해, 카단과 실리아는 고위흑술사 간다르의 마도사단을 격파한다.",
        "speakerName": "실리아",
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
    "coverIllustrationUrl": "/images/webtoon/episode_37/scene_03.webp",
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
        "illustrationUrl": "/images/webtoon/episode_37/scene_03.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep37_cut1.mp3",
        "shortCaption": "성채 외곽 협곡에서는 펜릴의 백은 늑대 기병대가 마물 군단을 상대로 단 한 마리도 위로 보내지 않겠다며 혈전을 벌인다.",
        "shortQuote": "북방의 사나이들이 피를 두려워할 줄 아느냐!",
        "narration": "성채 외곽 협곡에서는 펜릴의 백은 늑대 기병대가 마물 군단을 상대로 단 한 마리도 위로 보내지 않겠다며 혈전을 벌인다.",
        "speakerName": "정복왕 펜릴",
        "speakerRole": "북방 백은 늑대 부족의 패왕",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/081_Fenrir.png",
        "quote": "북방의 사나이들이 피를 두려워할 줄 아느냐! 알렉산다르의 제자가 성채 꼭대기에서 싸우고 있다! 단 한 놈의 마수도 상층부로 올려보내지 마라!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_37/scene_14.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep37_cut2.mp3",
        "shortCaption": "전우들의 함성을 등지고 최상층 계단을 오르던 카단과 실리아 앞을 루시안의 최후 친위대인 사령 기사단이 가로막는다.",
        "shortQuote": "단순한 바람 마법으로는 뚫을 수 없어요!",
        "narration": "전우들의 함성을 등지고 최상층 계단을 오르던 카단과 실리아 앞을 루시안의 최후 친위대인 사령 기사단이 가로막는다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "단순한 바람 마법으로는 뚫을 수 없어요! 저들의 피가 고르고의 마나로 결속되어 있어요!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_37/scene_25.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep37_cut3.mp3",
        "shortCaption": "그들은 죽어서도 영혼이 구속된 채 조종당하는 옛 성기사들의 유해였기에, 카단은 차마 칼날로 그들을 벨 수 없었다.",
        "shortQuote": "우리의 싸움은 파괴가 아니라 생명의 구원에 있다.",
        "narration": "그들은 죽어서도 영혼이 구속된 채 조종당하는 옛 성기사들의 유해였기에, 카단은 차마 칼날로 그들을 벨 수 없었다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "우리의 싸움은 파괴가 아니라 생명의 구원에 있다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_37/scene_36.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep37_cut4.mp3",
        "shortCaption": "카단은 살상 대신 드래곤 브레이커 방패의 정화 파동과 실리아의 질풍만으로 그들의 사령 구속구를 하나씩 부수어 해방시킨다.",
        "shortQuote": "그대의 참회를 기억하겠다. 이제 무기를 내려놓고 새로운 새벽을 기다려라.",
        "narration": "카단은 살상 대신 드래곤 브레이커 방패의 정화 파동과 실리아의 질풍만으로 그들의 사령 구속구를 하나씩 부수어 해방시킨다.",
        "speakerName": "루시안",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "그대의 참회를 기억하겠다. 이제 무기를 내려놓고 새로운 새벽을 기다려라."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_37/scene_45.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep37_cut5.mp3",
        "shortCaption": "마침내 옥좌 홀 문 앞을 지키는 사령기사단장 아르투스를 정화의 힘으로 돌파하고 최종 결전지로 들어선다.",
        "shortQuote": "어둠의 밤을 끝내고 봄을 맞이할 시간이다.",
        "narration": "마침내 옥좌 홀 문 앞을 지키는 사령기사단장 아르투스를 정화의 힘으로 돌파하고 최종 결전지로 들어선다.",
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
    "coverIllustrationUrl": "/images/webtoon/episode_38/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_38/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep38_cut1.mp3",
        "shortCaption": "최정상 파멸의 제단 옥좌 홀에 도착하자, 루시안은 이미 인간의 모습을 버리고 벨페고르의 심연 마력을 삼켜 괴물로 변이해 있었다.",
        "shortQuote": "크하하하! 기어코 내 옥좌 앞까지 기어 올라왔구나, 애송이 놈들! 하지만 너무…",
        "narration": "최정상 파멸의 제단 옥좌 홀에 도착하자, 루시안은 이미 인간의 모습을 버리고 벨페고르의 심연 마력을 삼켜 괴물로 변이해 있었다.",
        "speakerName": "루시안",
        "speakerRole": "붉은 유리 궁정 재상 · 만악의 근원",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/061_Lucian.png",
        "quote": "크하하하! 기어코 내 옥좌 앞까지 기어 올라왔구나, 애송이 놈들! 하지만 너무 늦었다! 세 개의 명주 봉인이 풀려나면, 대륙 전체가 나인섀도우의 심연 속으로 영원히 가라앉을 것이다!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_38/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep38_cut2.mp3",
        "shortCaption": "대륙 전체를 어둠 속으로 침몰시킬 나인섀도우 코덱스의 세 가지 명주 봉인이 차례차례 풀리며 종말의 폭풍이 몰아친다.",
        "shortQuote": "실리아가 공중으로 도약하며 녹옥 지팡이를 휘둘렀다.",
        "narration": "대륙 전체를 어둠 속으로 침몰시킬 나인섀도우 코덱스의 세 가지 명주 봉인이 차례차례 풀리며 종말의 폭풍이 몰아친다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "바람의 칼날이여, 첫 번째 저주의 사슬을 끊어라!"
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_38/scene_27.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep38_cut3.mp3",
        "shortCaption": "실리아가 녹옥 지팡이의 질풍으로 첫 봉인을 찢고, 카단이 드래곤 브레이커 방패의 대지 파동으로 두 번째 봉인을 박살 낸다.",
        "shortQuote": "거짓된 어둠의 환영은 빛의 진실 앞에서 한 줌의 재로 돌아갈 뿐이다!",
        "narration": "실리아가 녹옥 지팡이의 질풍으로 첫 봉인을 찢고, 카단이 드래곤 브레이커 방패의 대지 파동으로 두 번째 봉인을 박살 낸다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "거짓된 어둠의 환영은 빛의 진실 앞에서 한 줌의 재로 돌아갈 뿐이다!"
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_38/scene_38.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep38_cut4.mp3",
        "shortCaption": "절대 부서지지 않던 마지막 세 번째 암흑 결계 앞에 선 순간, 카단의 품속에서 이그니스가 남긴 유리 불씨가 은빛 단검과 공명해 타오른다.",
        "shortQuote": "실리아가 녹옥 지팡이를 두 손으로 꼭 쥐며 외쳤다.",
        "narration": "절대 부서지지 않던 마지막 세 번째 암흑 결계 앞에 선 순간, 카단의 품속에서 이그니스가 남긴 유리 불씨가 은빛 단검과 공명해 타오른다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "세 번째 봉인이 루시안의 심장과 융합되었어요! 저 핵을 직접 파괴하지 않으면 제단 전체가 차원 붕괴에 휘말려요!"
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_38/scene_47.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep38_cut5.mp3",
        "shortCaption": "부모 세대와 이그니스, 여섯 스승의 모든 염원을 하나로 모아 최종 보스 심연화신 루시안을 영원히 심판한다.",
        "shortQuote": "우리가 지켜낸 생명의 이름으로, 어둠의 심장을 꿰뚫는다!",
        "narration": "부모 세대와 이그니스, 여섯 스승의 모든 염원을 하나로 모아 최종 보스 심연화신 루시안을 영원히 심판한다.",
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
    "coverIllustrationUrl": "/images/webtoon/episode_39/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_39/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep39_cut1.mp3",
        "shortCaption": "세 개의 명주 봉인과 코덱스가 빛의 폭풍 속에 소멸하자, 대륙을 짓누르던 먹구름이 걷히며 동쪽 바다 위로 새벽빛이 밝아온다.",
        "shortQuote": "기사의... 맹세는... 어둠 속에서도... 결코 더럽혀지지... 않았다...",
        "narration": "세 개의 명주 봉인과 코덱스가 빛의 폭풍 속에 소멸하자, 대륙을 짓누르던 먹구름이 걷히며 동쪽 바다 위로 새벽빛이 밝아온다.",
        "speakerName": "데스나이트 아르투스",
        "speakerRole": "섀도우렐름 섭정 · 죽음의 기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
        "quote": "기사의... 맹세는... 어둠 속에서도... 결코 더럽혀지지... 않았다..."
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_39/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep39_cut2.mp3",
        "shortCaption": "모든 힘을 잃고 바닥을 기며 목숨을 구걸하는 루시안에게, 카단은 사적인 복수의 칼을 거두고 역사와 법의 심판대에 넘긴다.",
        "shortQuote": "고맙다... 알렉산다르의 아이여... 내 영혼이... 드디어 빛의 품으로…",
        "narration": "모든 힘을 잃고 바닥을 기며 목숨을 구걸하는 루시안에게, 카단은 사적인 복수의 칼을 거두고 역사와 법의 심판대에 넘긴다.",
        "speakerName": "데스나이트 아르투스",
        "speakerRole": "섀도우렐름 섭정 · 죽음의 기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
        "quote": "고맙다... 알렉산다르의 아이여... 내 영혼이... 드디어 빛의 품으로 돌아가는구나... 이 세상은... 여전히 목숨을 바쳐... 지킬 만한 가치가 있는 곳이었어..."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_39/scene_28.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep39_cut3.mp3",
        "shortCaption": "그러나 무너진 옥좌 잔해 뒤편에서 마지막 잔류 원념에 사로잡힌 고대 죽음기사 아르투스의 망령이 부러진 대검을 들고 일어난다.",
        "shortQuote": "네가 불태운 수많은 마을과, 광산에서 얼어 죽어간 무고한 백성들, 그리고…",
        "narration": "그러나 무너진 옥좌 잔해 뒤편에서 마지막 잔류 원념에 사로잡힌 고대 죽음기사 아르투스의 망령이 부러진 대검을 들고 일어난다.",
        "speakerName": "카단",
        "speakerRole": "섀도우렐름 섭정 · 죽음의 기사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png",
        "quote": "네가 앗아간 수많은 목숨들의 무게를 뼈저리게 느껴라. 죗값은 법과 역사의 엄정한 심판대에서 치러질 것이다."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_39/scene_39.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep39_cut4.mp3",
        "shortCaption": "카단은 증오가 아닌 깊은 연민과 존중을 담아, 평생 어둠에 묶여 싸워야 했던 옛 무인에게 참된 안식의 예를 갖춘다.",
        "shortQuote": "이그니스가 우리를 보며 웃고 있어요.",
        "narration": "카단은 증오가 아닌 깊은 연민과 존중을 담아, 평생 어둠에 묶여 싸워야 했던 옛 무인에게 참된 안식의 예를 갖춘다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "이그니스가 우리를 보며 웃고 있어요."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_39/scene_49.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep39_cut5.mp3",
        "shortCaption": "전쟁의 마지막 그림자를 잠재우고 완전한 새벽을 맞이하기 위해, 망념의 죽음기사 아르투스에게 기사의 안식을 선사한다.",
        "shortQuote": "우리가 지켜낸 세상이에요. 이제 모든 상처를 보듬고 새로운 이야기를 시작해요.",
        "narration": "전쟁의 마지막 그림자를 잠재우고 완전한 새벽을 맞이하기 위해, 망념의 죽음기사 아르투스에게 기사의 안식을 선사한다.",
        "speakerName": "실리아",
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
    "coverIllustrationUrl": "/images/webtoon/episode_40/scene_04.webp",
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
        "illustrationUrl": "/images/webtoon/episode_40/scene_04.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep40_cut1.mp3",
        "shortCaption": "전쟁이 끝나고 한 달 뒤, 재건된 수도 라이트헤븐 광장에는 대륙을 구한 영웅들을 축복하기 위해 수만 백성이 모여든다.",
        "shortQuote": "카단 대원수 만세! 실리아 황후 전하 만세!",
        "narration": "전쟁이 끝나고 한 달 뒤, 재건된 수도 라이트헤븐 광장에는 대륙을 구한 영웅들을 축복하기 위해 수만 백성이 모여든다.",
        "speakerName": "실리아",
        "speakerRole": "바람섬의 왕녀 · 천재 지략가",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/062_Celia.png",
        "quote": "카단 대원수 만세! 실리아 황후 전하 만세!"
      },
      {
        "stageLabel": "2컷 · 전개",
        "illustrationUrl": "/images/webtoon/episode_40/scene_15.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep40_cut2.mp3",
        "shortCaption": "황실은 최고 원수의 지위와 공작 작위, 무수한 황금을 내리려 하지만 카단과 실리아는 모든 권력과 영예를 조용히 사양한다.",
        "shortQuote": "폐하의 과분한 은혜에 감사드립니다. 그러나 저는 공작도 원수도 될 수 없습니다.",
        "narration": "황실은 최고 원수의 지위와 공작 작위, 무수한 황금을 내리려 하지만 카단과 실리아는 모든 권력과 영예를 조용히 사양한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "저 또한 황후의 관을 쓸 수 없습니다. 바람은 왕관을 쓰지 않으며, 궁정의 대리석 회랑에 갇히지 않습니다. 제 자리는 백성들의 삶이 피어나는 대지 위입니다."
      },
      {
        "stageLabel": "3컷 · 전환",
        "illustrationUrl": "/images/webtoon/episode_40/scene_27.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep40_cut3.mp3",
        "shortCaption": "두 사람은 어머니 엘윈이 가꾸던 북방 설원의 봄날 보리밭으로 돌아가, 전설의 방패를 오두막 지붕 삼아 흙을 일구기로 한다.",
        "shortQuote": "펜릴 왕이 카단의 잔을 채워주며 껄껄 웃었다.",
        "narration": "두 사람은 어머니 엘윈이 가꾸던 북방 설원의 봄날 보리밭으로 돌아가, 전설의 방패를 오두막 지붕 삼아 흙을 일구기로 한다.",
        "speakerName": "펜릴",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "바람 속삭임 섬의 꽃배들이 바다를 건너 평화의 무역선이 되었다. 실피드 여왕님께서도 하늘에서 너희를 자랑스러워하실 게다. 언제든 바다가 그리우면 섬으로 찾아오너라."
      },
      {
        "stageLabel": "4컷 · 위기",
        "illustrationUrl": "/images/webtoon/episode_40/scene_38.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep40_cut4.mp3",
        "shortCaption": "떠나는 길목에서 부모 세대의 오랜 벗인 성기사 헤르쿨이 환한 미소로 두 청년을 맞이하며 마지막 기념 대련을 청한다.",
        "shortQuote": "약속을 지켰네요, 카단. 정말로 봄이 왔어요.",
        "narration": "떠나는 길목에서 부모 세대의 오랜 벗인 성기사 헤르쿨이 환한 미소로 두 청년을 맞이하며 마지막 기념 대련을 청한다.",
        "speakerName": "카단",
        "speakerRole": "알렉산다르의 아들 · 눈히어로 수호전사",
        "speakerCutoutUrl": "/anime-character-sheets/cutouts/041_Kadan.png",
        "quote": "약속을 지켰네요, 카단. 정말로 봄이 왔어요."
      },
      {
        "stageLabel": "5컷 · 결전",
        "illustrationUrl": "/images/webtoon/episode_40/scene_47.webp",
        "narrationAudioUrl": "/hs-assets/snshero-audio/story/ep40_cut5.mp3",
        "shortCaption": "평화로운 새벽과 새로운 차원의 환생을 여는 대단원의 피날레로, 성기사 헤르쿨과 영광의 기념 수련전을 펼친다.",
        "shortQuote": "스승님, 아버지... 그리고 이그니스. 약속대로 이 땅에 봄을 데려왔습니다.…",
        "narration": "평화로운 새벽과 새로운 차원의 환생을 여는 대단원의 피날레로, 성기사 헤르쿨과 영광의 기념 수련전을 펼친다.",
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
 * - 제1막(1~8화): 신규 유저가 기본 컬렉션 자동플레이로 막힘 없이 스토리에 몰입하며 4~8화를 쾌적하게 돌파하도록 완만한 성장 곡선 제공
 * - 제2막(9~16화): 적 체력과 스탯 배율이 점진 상승하여 초기 지급 3팩·5화 보상팩·골드팩 및 패배 보강 뽑기를 통한 3장(×3배) 각성이 자연스럽게 빛을 발함
 * - 제3~5막(17~40화) 및 환생 반복 시: 다수의 3배·4배 이상 카드 업그레이드 없이는 돌파할 수 없도록 단계적 상승
 */
export function getJourneyDifficultySpec(
  episode: number,
  reincarnation: number,
): JourneyDifficultySpec {
  const ep = Math.max(1, Math.min(40, Math.floor(episode || 1)));
  const reinc = Math.max(0, Math.floor(reincarnation || 0));

  let baseHp = 15;
  let baseScale = 0.62;

  if (ep <= 6) {
    // 초반 입문 구간 (1~6화): 15HP(×0.62) -> 21HP(×0.77), 기본 덱 자동플레이로 4~6화 막힘 없는 쾌속 돌파 보장
    baseHp = Math.round(15 + (ep - 1) * 1.2);
    baseScale = 0.62 + (ep - 1) * 0.03;
  } else if (ep <= 15) {
    // 제1막 후반~제2막 중반 (7~15화): 22HP(×0.81) -> 34HP(×1.12), 패배 시 골드 카드팩 1개 구매·개봉으로 ×3배 각성 즉시 돌파 구간
    baseHp = Math.round(21 + (ep - 6) * 1.45);
    baseScale = 0.77 + (ep - 6) * 0.039;
  } else if (ep <= 28) {
    // 중후반 성장 구간 (16~28화): 36HP(×1.17) -> 58HP(×1.75), 누적 카드팩 개봉을 통한 다수 카드 ×3배~×4배 각성 구간
    baseHp = Math.round(34 + (ep - 15) * 1.85);
    baseScale = 1.12 + (ep - 15) * 0.048;
  } else {
    // 최종 결전 구간 (29~40화): 60HP(×1.81) -> 88HP(×2.48)
    baseHp = Math.round(58 + (ep - 28) * 2.5);
    baseScale = 1.75 + (ep - 28) * 0.061;
  }

  if (ep % 5 === 0) {
    const hpBump = ep <= 5 ? 1.04 : 1.06;
    const scaleBump = ep <= 5 ? 1.02 : 1.03;
    baseHp = Math.round(baseHp * hpBump);
    baseScale = Number((baseScale * scaleBump).toFixed(2));
  }

  const reincHpFactor = 1 + reinc * 0.55;
  const reincScaleAdd = reinc * 1.25;

  const enemyHeroHealth = Math.round(baseHp * reincHpFactor);
  const enemyStatScale = Number((baseScale + reincScaleAdd).toFixed(2));
  const recommendedMultiplier = Math.max(1, Math.ceil(enemyStatScale * 0.92));

  const themes: BoardThemeId[] = ['STORMWIND', 'ORGRIMMAR', 'PANDARIA'];
  const boardTheme = themes[(ep - 1) % themes.length];
  const expectedWinGold = 40 + ep * 5 + reinc * 35;

  return {
    enemyHeroHealth,
    enemyStatScale,
    recommendedMultiplier,
    aiDifficulty: ep >= 19 || reinc > 0 ? 'EXPERT' : 'NORMAL',
    boardTheme,
    expectedWinGold,
    isBossMilestone: ep % 5 === 0,
  };
}

const JOURNEY_SITUATIONAL_SPELLS = new Set([
  'CS2_074', // 맹독 (무기 필수)
  'CS2_233', // 폭풍의 칼날 (무기 필수)
  'EX1_410', // 방패 밀쳐내기 (방어도 필수)
  'EX1_244', // 토템의 힘 (토템 필수)
  'NEW1_003', // 희생의 서약 (악마 필수)
  'EX1_144', // 그림자 밟기
  'EX1_145', // 마음가짐
  'EX1_332', // 침묵
  'CS2_236', // 천상의 정신
  'CS1_129', // 내면의 열정
  'EX1_549', // 야수의 격노 (야수 필수)
]);

/**
 * 카단의 여정 전용 플레이어 덱 자동 구성 (표준 30장 템포 커브 + 보유 전 종족 균등 출현 + 3배 각성 카드 체감 보장):
 * - 보유한 모든 카드(9종족 + 중립)가 골고루 등장하도록 매 전투 셔플 편성
 * - 무기/특정 종족 토큰 없이는 발동 불가한 함정 주문은 자동 제외하고 전투 하수인·무기 위주로 구성
 * - 초반 패 말림 방지를 위해 저코스트(1~3코스트 17장) · 중코스트(4~5코스트 9장) · 고코스트(6+코스트 4장) 황금 템포 비율 유지
 * - 3장 이상 보유해 ×3배 각성된 카드는 우선 슬롯에 반영(보유 각성 카드가 적을 때는 2장까지 편성)하여 업그레이드 체감을 즉시 제공
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

  const shuffleIds = (arr: string[]): string[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const usableOwned = ownedCards.filter(
    (c) =>
      !JOURNEY_SITUATIONAL_SPELLS.has(c.id) &&
      !(c.type === 'MINION' && (c.attack || 0) === 0 && (c.cost || 0) <= 2),
  );
  const activePool = usableOwned.length >= 25 ? usableOwned : ownedCards;

  const boostedPool: string[] = [];
  const combatBasePool: string[] = [];
  const spellBasePool: string[] = [];
  const boostedCardsSorted = [...activePool]
    .filter((c) => (playerCardMultipliers[c.id] || 1) > 1)
    .sort((a, b) => (playerCardMultipliers[b.id] || 1) - (playerCardMultipliers[a.id] || 1));
  for (const c of boostedCardsSorted) {
    boostedPool.push(c.id);
    if (boostedCardCount <= 22 && c.rarity !== 'LEGENDARY') {
      boostedPool.push(c.id);
    }
  }
  for (const c of activePool) {
    if ((playerCardMultipliers[c.id] || 1) > 1) continue;
    if (hasCombatStatsForJourney(c)) {
      combatBasePool.push(c.id);
    } else {
      spellBasePool.push(c.id);
    }
  }

  const shuffledBoosted = shuffleIds(boostedPool).sort(
    (a, b) => (playerCardMultipliers[b] || 1) - (playerCardMultipliers[a] || 1),
  );
  // 하수인·무기 비중을 80%+ 유지하면서 전 종족 주문도 적정량 혼합
  const shuffledBase = [
    ...shuffleIds(combatBasePool),
    ...shuffleIds(spellBasePool).slice(0, 6),
  ];
  const mixedBase = shuffleIds(shuffledBase);

  const pickBucket = (
    pred: (cost: number) => boolean,
    quota: number,
  ): string[] => {
    const bMatch = shuffledBoosted.filter((id) => pred(cardDb.getCard(id)?.cost ?? 3));
    const nMatch = mixedBase.filter((id) => pred(cardDb.getCard(id)?.cost ?? 3));
    const maxBoostedTake = Math.min(bMatch.length, quota);
    const chosen = bMatch.slice(0, maxBoostedTake);
    for (let i = 0; i < nMatch.length && chosen.length < quota; i += 1) {
      chosen.push(nMatch[i]);
    }
    return chosen;
  };

  const deckCards: string[] = [
    ...pickBucket((cost) => cost >= 1 && cost <= 3, 17),
    ...pickBucket((cost) => cost >= 4 && cost <= 5, 9),
    ...pickBucket((cost) => cost >= 6, 4),
  ];

  const fallbackAll = shuffleIds(ownedCards.map((c) => c.id));
  let safetyIdx = 0;
  while (deckCards.length < 30 && fallbackAll.length > 0) {
    deckCards.push(fallbackAll[safetyIdx % fallbackAll.length]);
    safetyIdx += 1;
  }

  return {
    deckCards: shuffleIds(deckCards.slice(0, 30)),
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

  // 제1막 초반(1~6화, 환생 0)은 무리한 고등급 치환 없이 정통 기본 덱으로 공정하게 대결
  if (episode <= 6 && reincarnation === 0) {
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
      (episode >= 16 || reincarnation > 0
        ? c.rarity === 'RARE' || c.rarity === 'EPIC' || c.rarity === 'LEGENDARY'
        : c.rarity === 'COMMON' || c.rarity === 'RARE'),
  );
  const elitePool = [...classElite, ...classElite, ...neutralElite];

  if (elitePool.length === 0) return baseDeck;

  const replaceCount = Math.min(20, Math.floor(Math.max(0, episode - 6) * 0.5) + reincarnation * 7);
  const upgraded = [...baseDeck];
  for (let i = 0; i < replaceCount; i += 1) {
    const pick = elitePool[(episode * 7 + i * 13 + reincarnation * 19) % elitePool.length];
    upgraded[i % upgraded.length] = pick.id;
  }
  return upgraded;
}
