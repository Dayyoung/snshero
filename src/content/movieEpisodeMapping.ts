import { CARD_DATABASE } from '../cardDatabase';

export interface MovieEpisodeMeta {
  episodeNumber: number;
  titleKo: string;
  titleEn: string;
  titleJa: string;
  videoId?: string;
  movieVideoId?: string;
  arc: string;
  arcEn: string;
  synopsisKo: string;
  synopsisEn: string;
  bgmTheme: 'arctic-blizzard' | 'battle-march' | 'arcane-mystery' | 'triumph-fanfare' | 'dark-ominous' | 'sorrow-lament';
  defaultVfx: 'snow' | 'embers' | 'runes' | 'slash' | 'none';
  durationMinutes: number;
  keyCharacters: string[];
  highlightScene: string;
}

export const MOVIE_EPISODES: Record<number, MovieEpisodeMeta> = {
  1: {
    episodeNumber: 1,
    titleKo: "눈보라 아래 두 서약",
    titleJa: "吹雪に誓う二つの契り",
    titleEn: "Two Vows Beneath the Blizzard",
    videoId: "kk-4FB4k8ck",
    movieVideoId: "tX0KRuQ3C0U",
    arc: "설원의 서약과 운명의 탄생",
    arcEn: "Act I: Vows in the Blizzard & Birth of Fate",
    synopsisKo: "라이트헤븐 변방 엘윈 마을의 혹독한 눈보라 속, 몰락한 성기사단의 후예 알렉산다르와 발리안이 피투성이 순례자 헤르쿨과 마주하며 영원한 피의 맹세를 맺는다.",
    synopsisEn: "Amidst a savage blizzard in Elwin village, descendants of the fallen Holy Knights, Aleksandar and Balian, confront the wounded pilgrim Hercul and forge an eternal blood vow.",
    bgmTheme: "arctic-blizzard",
    defaultVfx: "snow",
    durationMinutes: 22,
    keyCharacters: ["카단", "알렉산다르", "발리안", "헤르쿨", "엘윈"],
    highlightScene: "선술집 문을 열고 들어온 피 묻은 순례자의 부서진 성기사 인장"
  },
  2: {
    episodeNumber: 2,
    titleKo: "일곱 추적자의 맹세",
    titleJa: "七人の追跡者の誓い",
    titleEn: "Oath of the Seven Pursuers",
    videoId: "czQylu2iokc",
    movieVideoId: "GpHKGpjHh4s",
    arc: "설원의 서약과 운명의 탄생",
    arcEn: "Act I: Vows in the Blizzard & Birth of Fate",
    synopsisKo: "섀도우렐름의 정예 척살단 일곱 추적자가 눈 덮인 산마루를 포위하고, 알렉산다르의 쌍검과 발리안의 마도창이 설원을 붉게 물들인다.",
    synopsisEn: "Seven elite shadow pursuers encircle the snowbound ridge, testing Aleksandar's dual blades and Balian's arcane spear in a desperate defensive stand.",
    bgmTheme: "battle-march",
    defaultVfx: "slash",
    durationMinutes: 24,
    keyCharacters: ["알렉산다르", "발리안", "카제", "가웨인", "엘리아나"],
    highlightScene: "암흑 궁수들의 일제 사격을 가르는 발리안의 창끝 마력 방벽"
  },
  3: {
    episodeNumber: 3,
    titleKo: "안개 절벽의 피",
    titleJa: "霧の崖の血",
    titleEn: "Blood on the Mist Cliff",
    videoId: "epVLUFsWgBg",
    movieVideoId: "LrCDxIsUd8g",
    arc: "설원의 서약과 운명의 탄생",
    arcEn: "Act I: Vows in the Blizzard & Birth of Fate",
    synopsisKo: "안개 낀 천길 낭떠러지에서 추적자들을 유인한 두 전사. 벼랑 끝에서 펼쳐지는 혈투 속에서 희생과 생존의 갈림길이 열린다.",
    synopsisEn: "Luring their pursuers to the sheer mist-shrouded cliffside, the warriors confront their destiny amidst lethal ambushes and sacrificial valor.",
    bgmTheme: "dark-ominous",
    defaultVfx: "slash",
    durationMinutes: 21,
    keyCharacters: ["알렉산다르", "발리안", "카단", "카제"],
    highlightScene: "낭떠러지로 추락하는 흑마도사와 밧줄 하나로 아이를 건져 올리는 알렉산다르"
  },
  4: {
    episodeNumber: 4,
    titleKo: "황야에서 자란 아이",
    titleJa: "荒野で育った子",
    titleEn: "The Child Raised in the Wastes",
    videoId: "3ZclW4ClaUs",
    movieVideoId: "mJjK5Q2Mls0",
    arc: "설원의 서약과 운명의 탄생",
    arcEn: "Act I: Vows in the Blizzard & Birth of Fate",
    synopsisKo: "황야의 거친 비바람 속에서 자라난 소년 카단. 스스로 은빛 단검을 벼리며 대지의 룬과 교감하는 잠재력을 드러내기 시작한다.",
    synopsisEn: "Growing up in the desolate wilderness, young Kadan tempers his silver dagger and awakens his latent affinity with the primal runes of the earth.",
    bgmTheme: "arcane-mystery",
    defaultVfx: "embers",
    durationMinutes: 20,
    keyCharacters: ["카단", "알렉산다르", "티타니아", "가웨인"],
    highlightScene: "대장간 모루 위에서 번쩍이는 은빛 단검의 룬 각인"
  },
  5: {
    episodeNumber: 5,
    titleKo: "폭우 속의 유령",
    titleJa: "豪雨の中の亡霊",
    titleEn: "Phantom in the Downpour",
    videoId: "brPi3nB0LGg",
    movieVideoId: "-pXOFiz7INo",
    arc: "설원의 서약과 운명의 탄생",
    arcEn: "Act I: Vows in the Blizzard & Birth of Fate",
    synopsisKo: "폭우가 쏟아지는 버려진 요새에서 마주친 유령 기사단. 잊혀진 왕국의 원혼들이 카단의 성흔을 알아보고 시험을 던진다.",
    synopsisEn: "Amidst a torrential downpour inside a ruined stronghold, phantom knights manifest to challenge Kadan's nascent divine mark.",
    bgmTheme: "dark-ominous",
    defaultVfx: "runes",
    durationMinutes: 23,
    keyCharacters: ["카단", "가웨인", "카제", "엘리아나"],
    highlightScene: "빗줄기를 뚫고 허공에 떠오른 반투명 청백색 유령 기사단의 경례"
  },
  6: {
    episodeNumber: 6,
    titleKo: "별을 호흡하는 법",
    titleJa: "星を呼吸する方法",
    titleEn: "The Art of Breathing Stars",
    videoId: "oQrQ7g2E4Eo",
    movieVideoId: "kefLuWtNQ-U",
    arc: "설원의 서약과 운명의 탄생",
    arcEn: "Act I: Vows in the Blizzard & Birth of Fate",
    synopsisKo: "밤하늘의 성좌와 마나 순환을 일치시키는 고대 비전 '성진호흡법(Star Breathing)'. 카단은 가슴 깊은 곳의 마력핵을 개방한다.",
    synopsisEn: "Synchronizing his mana circulation with cosmic constellations, Kadan masters the ancient Star Breathing technique, unlocking his arcane core.",
    bgmTheme: "arcane-mystery",
    defaultVfx: "runes",
    durationMinutes: 25,
    keyCharacters: ["카단", "발리안", "말퓨온", "티타니아"],
    highlightScene: "밤하늘 은하수가 소용돌이치며 카단의 심장으로 쏟아져 들어오는 순간"
  },
  7: {
    episodeNumber: 7,
    titleKo: "배신자들의 천막",
    titleJa: "裏切り者たちの天幕",
    titleEn: "The Traitors Camp",
    videoId: "4Y4fJ3_kQuc",
    movieVideoId: "oQMFO39_m1k",
    arc: "설원의 서약과 운명의 탄생",
    arcEn: "Act I: Vows in the Blizzard & Birth of Fate",
    synopsisKo: "용병단 내부의 밀고자가 적군과 접선하는 사막 천막을 급습한 카단. 믿었던 동료의 배신 뒤에 숨은 잔혹한 진실을 목도한다.",
    synopsisEn: "Infiltrating a desert tent where an inside informant meets shadow agents, Kadan confronts a heartbreaking betrayal that shatters his innocence.",
    bgmTheme: "battle-march",
    defaultVfx: "embers",
    durationMinutes: 22,
    keyCharacters: ["카단", "알렉산다르", "발리안", "말퓨온"],
    highlightScene: "어둠 속에서 반짝이는 은빛 단검의 칼날과 배신자의 떨리는 자백"
  },
  8: {
    episodeNumber: 8,
    titleKo: "붉은 갈기의 기수",
    titleJa: "紅いたてがみの騎手",
    titleEn: "Rider of the Crimson Mane",
    videoId: "xlpshV8YJ_M",
    movieVideoId: "xUjWAxbKHCs",
    arc: "설원의 서약과 운명의 탄생",
    arcEn: "Act I: Vows in the Blizzard & Birth of Fate",
    synopsisKo: "붉은 갈기를 흩날리는 야생의 명마 '적갈기'와 카단의 운명적 교감. 거친 질주 끝에 선공권의 축복을 획득하고 전장으로 내달린다.",
    synopsisEn: "Bonding with the fiery wild steed 'Crimson Mane', Kadan earns the blessing of relentless initiative and charges across the crimson desert.",
    bgmTheme: "triumph-fanfare",
    defaultVfx: "embers",
    durationMinutes: 26,
    keyCharacters: ["카단", "실리아", "엘리아나", "이그니스"],
    highlightScene: "붉은 갈기의 명마가 절벽을 뛰어넘으며 울부짖는 석양의 질주"
  },
  9: {
    episodeNumber: 9,
    titleKo: "거지 옷의 바람",
    titleJa: "乞食の服の風",
    titleEn: "Wind in Beggars Clothes",
    videoId: "lNfopPDr47g",
    movieVideoId: "m0tlwPVpl_0",
    arc: "설원의 서약과 운명의 탄생",
    arcEn: "Act I: Vows in the Blizzard & Birth of Fate",
    synopsisKo: "누더기 옷을 걸치고 대도시 하층가에 숨어든 카단. 바람의 흐름을 읽는 암시장 정보상들과 접촉하며 대륙의 비밀 결사를 추적한다.",
    synopsisEn: "Disguised in ragged garments within the subterranean capital, Kadan tracks secret conspirators through the whispering informants of the wind.",
    bgmTheme: "arcane-mystery",
    defaultVfx: "none",
    durationMinutes: 21,
    keyCharacters: ["카단", "실리아", "엘리아나"],
    highlightScene: "지하 하수구 골목길에서 바람의 속삭임으로 적의 추적 경로를 간파하는 카단"
  },
  10: {
    episodeNumber: 10,
    titleKo: "불꽃 궁정의 포로",
    titleJa: "炎の宮廷の捕虜",
    titleEn: "Prisoner of the Flame Court",
    videoId: "I4Q4MY1jBIQ",
    movieVideoId: "exPR4YVBFSw",
    arc: "설원의 서약과 운명의 탄생",
    arcEn: "Act I: Vows in the Blizzard & Birth of Fate",
    synopsisKo: "불꽃 군주 이그니스의 화염 성채에 포로로 잡힌 카단 일행. 용암 구덩이 위에서 펼쳐지는 생사의 검투 대결이 펼쳐진다.",
    synopsisEn: "Held captive in the obsidian fortress of Ignis, the Flame Monarch, Kadan must duel champions above bubbling magma chambers to secure freedom.",
    bgmTheme: "battle-march",
    defaultVfx: "embers",
    durationMinutes: 25,
    keyCharacters: ["카단", "이그니스", "실리아", "발리안"],
    highlightScene: "용암 웅덩이 위 철창 경기장에서 터져 나오는 이그니스의 거대한 화염권"
  },
  11: {
    episodeNumber: 11,
    titleKo: "기억을 깨우는 단검",
    titleJa: "記憶を呼び覚ます短剣",
    titleEn: "The Dagger That Wakes Memory",
    videoId: "UPps0aITWzs",
    movieVideoId: "EHSp1gw69EM",
    arc: "별의 호흡과 녹옥의 비전",
    arcEn: "Act II: Breathing the Stars & Jade Secrets",
    synopsisKo: "은빛 단검에 새겨진 고대 황금 문양이 반응하며, 카단의 잃어버린 유년기 기억과 왕가 봉인의 시초가 환영처럼 되살아난다.",
    synopsisEn: "Ancient golden glyphs on the silver dagger ignite, projecting long-lost visions of Kadan's royal lineage and the original sealing ritual.",
    bgmTheme: "sorrow-lament",
    defaultVfx: "runes",
    durationMinutes: 23,
    keyCharacters: ["카단", "실리아", "알렉산다르", "가웨인"],
    highlightScene: "단검의 칼날에 비친 아버지의 눈빛과 고대 성채의 무너지는 회상"
  },
  12: {
    episodeNumber: 12,
    titleKo: "두 무덤 사이의 봄",
    titleJa: "二つの墓の間の春",
    titleEn: "Spring Between Two Graves",
    videoId: "7Bc_ZrW_2Bc",
    movieVideoId: "Zg1HT3yJxUc",
    arc: "별의 호흡과 녹옥의 비전",
    arcEn: "Act II: Breathing the Stars & Jade Secrets",
    synopsisKo: "전란에 희생된 전우들의 무덤가에 피어난 푸른 야생화. 슬픔을 딛고 카단과 실리아는 대륙의 평화를 향한 새로운 맹세를 나눈다.",
    synopsisEn: "Blue wildflowers bloom over the solemn graves of fallen comrades. Amidst lingering sorrow, Kadan and Celia make an unbreakable promise of renewal.",
    bgmTheme: "sorrow-lament",
    defaultVfx: "none",
    durationMinutes: 19,
    keyCharacters: ["카단", "실리아", "발리안", "엘윈"],
    highlightScene: "석양빛 묘비 앞에 놓인 두 송이의 설화와 손을 맞잡는 카단과 실리아"
  },
  13: {
    episodeNumber: 13,
    titleKo: "녹옥 지팡이의 주인",
    titleJa: "緑玉の杖の主",
    titleEn: "Master of the Jade Staff",
    videoId: "B_dqohDLN9E",
    movieVideoId: "1UpqRFVTI74",
    arc: "별의 호흡과 녹옥의 비전",
    arcEn: "Act II: Breathing the Stars & Jade Secrets",
    synopsisKo: "녹옥 숲의 은둔 대현자가 쥐고 있는 생명의 비전 지팡이. 카단은 원소의 균형을 되찾기 위한 세 번째 비전을 전수받는다.",
    synopsisEn: "The hermit sage of the Jade Sanctuary unveils the ancestral staff of life, guiding Kadan to harmonize elemental resonance within his soul.",
    bgmTheme: "arcane-mystery",
    defaultVfx: "runes",
    durationMinutes: 24,
    keyCharacters: ["카단", "실리아", "말퓨온"],
    highlightScene: "녹옥 지팡이가 지면에 닿자 메마른 황무지가 푸른 덩굴숲으로 순식간에 개화하는 기적"
  },
  14: {
    episodeNumber: 14,
    titleKo: "안개 호수의 손님들",
    titleJa: "霧の湖の客たち",
    titleEn: "Guests of the Mist Lake",
    videoId: "R-g4y7O_MTo",
    movieVideoId: "2CRDJFfyHTE",
    arc: "별의 호흡과 녹옥의 비전",
    arcEn: "Act II: Breathing the Stars & Jade Secrets",
    synopsisKo: "물안개 짙은 호숫가에 나타난 이계의 정령사들. 수면 위에 비친 미래의 환영은 대륙을 집어삼킬 거대한 심연의 도래를 경고한다.",
    synopsisEn: "Mystic elementalists arrive across the mirror-like waters of the Mist Lake, unveiling harrowing omens of a continent-consuming void.",
    bgmTheme: "dark-ominous",
    defaultVfx: "snow",
    durationMinutes: 22,
    keyCharacters: ["카단", "실리아", "카제", "아쿠아리스"],
    highlightScene: "수면 위에 떠오른 거대한 심연룡의 붉은 눈동자와 얼어붙는 파도"
  },
  15: {
    episodeNumber: 15,
    titleKo: "독사와 사자의 밤",
    titleJa: "毒蛇と獅子の夜",
    titleEn: "Night of Serpent and Lion",
    videoId: "WqEJQ8kEtFA",
    movieVideoId: "7nuzz2KRyI8",
    arc: "별의 호흡과 녹옥의 비전",
    arcEn: "Act II: Breathing the Stars & Jade Secrets",
    synopsisKo: "황실 지하 연회장에서 벌어진 독살 음모와 황금 사자 기사단의 격돌. 카단의 신속한 단검이 배후의 암살자를 제압한다.",
    synopsisEn: "A poisoned banquet triggers a lethal clash between the Golden Lion Order and venomous conspirators, halted only by Kadan's silver flash.",
    bgmTheme: "battle-march",
    defaultVfx: "slash",
    durationMinutes: 26,
    keyCharacters: ["카단", "이그니스", "실리아", "가웨인"],
    highlightScene: "연회장 샹들리에를 베어 떨어뜨리며 독침을 쳐내는 공중 도약 일격"
  },
  16: {
    episodeNumber: 16,
    titleKo: "폐허 앞의 형제",
    titleJa: "廃墟の前の兄弟",
    titleEn: "Brothers Before the Ruins",
    videoId: "GuPzM6EGRKA",
    movieVideoId: "WpkYhCmaZOs",
    arc: "별의 호흡과 녹옥의 비전",
    arcEn: "Act II: Breathing the Stars & Jade Secrets",
    synopsisKo: "어릴 적 갈라선 의형제와의 비극적 재회. 각자 짊어진 가문의 저주와 사명이 폐허의 대성당 앞에서 피할 수 없는 검끝을 마주치게 한다.",
    synopsisEn: "Reuniting before the ruins of their childhood cathedral, sworn foster brothers are forced into a tragic duel dictated by family curses.",
    bgmTheme: "sorrow-lament",
    defaultVfx: "embers",
    durationMinutes: 24,
    keyCharacters: ["카단", "알렉산다르", "발리안"],
    highlightScene: "두 자루의 검이 부딪치며 튀는 불꽃 속에 겹쳐지는 어린 시절의 미소"
  },
  17: {
    episodeNumber: 17,
    titleKo: "바람섬의 초대장",
    titleJa: "風の島の招待状",
    titleEn: "Invitation to the Wind Isle",
    videoId: "ACIZX7kcUVY",
    movieVideoId: "bksmSm-yNpM",
    arc: "별의 호흡과 녹옥의 비전",
    arcEn: "Act II: Breathing the Stars & Jade Secrets",
    synopsisKo: "부유하는 천공의 섬 '바람섬'으로부터 날아든 봉랍 인장 초대장. 폭풍의 장벽을 뚫고 하늘을 나는 비공정을 향한 모험이 시작된다.",
    synopsisEn: "A wax-sealed invitation arrives from the floating Wind Isle, urging the heroes to breach howling squalls aboard an ancient arcane skyship.",
    bgmTheme: "arcane-mystery",
    defaultVfx: "runes",
    durationMinutes: 21,
    keyCharacters: ["카단", "실리아", "티타니아", "엘윈"],
    highlightScene: "구름 바다 위를 가르며 솟구쳐 오르는 비공정의 거대한 돛"
  },
  18: {
    episodeNumber: 18,
    titleKo: "검은 성전의 비밀",
    titleJa: "黒い聖殿の秘密",
    titleEn: "Secret of the Black Sanctum",
    videoId: "k0bbFU_WeYQ",
    movieVideoId: "dXPyIdFU03o",
    arc: "별의 호흡과 녹옥의 비전",
    arcEn: "Act II: Breathing the Stars & Jade Secrets",
    synopsisKo: "바람섬 중심부의 금지된 검은 성전. 11개 종족의 시초와 고대 성물이 봉인된 석판의 문자를 해독하며 숨겨진 세계관이 전모를 드러낸다.",
    synopsisEn: "Within the forbidden Black Sanctum, Kadan deciphers primordial glyphs revealing the origin of all eleven races and the coming cataclysm.",
    bgmTheme: "dark-ominous",
    defaultVfx: "runes",
    durationMinutes: 25,
    keyCharacters: ["카단", "실리아", "간다르", "티타니아"],
    highlightScene: "성전 중앙 제단에서 뿜어져 나오는 칠흑의 마력 소용돌이"
  },
  19: {
    episodeNumber: 19,
    titleKo: "세 가지 시험",
    titleJa: "三つの試練",
    titleEn: "Three Trials",
    videoId: "fkpHE54c-wY",
    movieVideoId: "yVcY4DrWzLY",
    arc: "별의 호흡과 녹옥의 비전",
    arcEn: "Act II: Breathing the Stars & Jade Secrets",
    synopsisKo: "천공 의회가 내린 세 가지 영웅의 시련: 지혜의 거울, 용기의 불꽃, 자비의 바위. 카단은 자신의 내면과 정면으로 마주한다.",
    synopsisEn: "The Celestial Council subjects Kadan to the Three Trials: the Mirror of Truth, the Crucible of Courage, and the Anchor of Mercy.",
    bgmTheme: "triumph-fanfare",
    defaultVfx: "runes",
    durationMinutes: 23,
    keyCharacters: ["카단", "실리아", "가웨인", "간다르"],
    highlightScene: "자신의 그림자 환영을 베지 않고 감싸 안으며 시련을 극복하는 카단"
  },
  20: {
    episodeNumber: 20,
    titleKo: "꽃배를 삼킨 파도",
    titleJa: "花舟を呑み込んだ波",
    titleEn: "The Wave That Swallowed the Flower Ship",
    videoId: "7qFwXq4bHHU",
    movieVideoId: "bA3jUSBQre0",
    arc: "별의 호흡과 녹옥의 비전",
    arcEn: "Act II: Breathing the Stars & Jade Secrets",
    synopsisKo: "축제의 꽃배가 출항하는 순간, 심연의 대해일이 하늘섬 연안을 덮친다. 승객들을 지키기 위한 카단의 한계 초월 결계 마법이 작렬한다.",
    synopsisEn: "As ceremonial flower barges set sail, a colossal abyss tidal wave threatens all shorelines, forcing Kadan to manifest a barrier of pure starlight.",
    bgmTheme: "battle-march",
    defaultVfx: "snow",
    durationMinutes: 27,
    keyCharacters: ["카단", "실리아", "아쿠아로드", "간다르"],
    highlightScene: "거대한 파도벽을 정면으로 받아내며 산산조각 나는 푸른 별빛 방벽"
  },
  21: {
    episodeNumber: 21,
    titleKo: "불타는 배의 배신",
    titleJa: "燃える船の裏切り",
    titleEn: "Betrayal Aboard the Burning Ship",
    videoId: "F_uZJfNZpp0",
    movieVideoId: "cWXwpzvCoS0",
    arc: "불타는 바다와 거짓 혼례",
    arcEn: "Act III: The Burning Sea & Veils of Deceit",
    synopsisKo: "해상 항해 중 일어난 방화와 선장의 은밀한 배반. 불타는 갑판 위에서 바다 괴수들의 습격까지 겹치며 절체절명의 위기가 닥친다.",
    synopsisEn: "Arson erupts aboard the flagship amid treacherous sabotage, leaving the party stranded in predator-infested burning waters.",
    bgmTheme: "battle-march",
    defaultVfx: "embers",
    durationMinutes: 24,
    keyCharacters: ["카단", "실리아", "이그니스", "아쿠아로드"],
    highlightScene: "화염에 휩싸인 돛대에서 바다로 뛰어내리며 심연수를 저격하는 실리아"
  },
  22: {
    episodeNumber: 22,
    titleKo: "무인도의 네 사람",
    titleJa: "無人島の四人",
    titleEn: "Four on a Deserted Island",
    videoId: "TSYha7Ksd84",
    movieVideoId: "UYn274kjl_w",
    arc: "불타는 바다와 거짓 혼례",
    arcEn: "Act III: The Burning Sea & Veils of Deceit",
    synopsisKo: "외딴 암초 섬에 표류한 카단, 실리아, 이그니스, 티타니아. 서로 다른 신념을 가진 네 영웅이 모닥불 앞에서 진솔한 상처를 털어놓는다.",
    synopsisEn: "Shipwrecked upon an isolated reef island, four disparate heroes gather around a beach fire, reconciling their divergent loyalties.",
    bgmTheme: "sorrow-lament",
    defaultVfx: "embers",
    durationMinutes: 20,
    keyCharacters: ["카단", "실리아", "이그니스", "티타니아", "엘윈"],
    highlightScene: "밤바다 파도 소리 속에서 마력 상처를 서로 치유해 주는 카단과 실리아"
  },
  23: {
    episodeNumber: 23,
    titleKo: "동굴 속 잠든 기록",
    titleJa: "洞窟に眠る記録",
    titleEn: "The Record Sleeping in the Cave",
    videoId: "lek2-gXZkAI",
    movieVideoId: "Z4ecERb63P8",
    arc: "불타는 바다와 거짓 혼례",
    arcEn: "Act III: The Burning Sea & Veils of Deceit",
    synopsisKo: "산호 동굴 깊은 곳에서 발견된 천 년 전 1대 성기사단의 항해 일지. 그곳에는 심연의 군주를 봉인했던 충격적인 대가가 적혀 있었다.",
    synopsisEn: "Deep within coral caverns lies the thousand-year-old log of the First Crusade, recording the harrowing sacrifice needed to seal the Void Lord.",
    bgmTheme: "arcane-mystery",
    defaultVfx: "runes",
    durationMinutes: 23,
    keyCharacters: ["카단", "실리아", "발리안", "알렉산다르"],
    highlightScene: "산호 벽에 푸른빛으로 떠오르는 고대어 비문과 카단의 전율"
  },
  24: {
    episodeNumber: 24,
    titleKo: "봉인실의 일곱 밤",
    titleJa: "封印室の七つの夜",
    titleEn: "Seven Nights in the Sealed Chamber",
    videoId: "5WiolZjgGyg",
    movieVideoId: "721DgAN3Urs",
    arc: "불타는 바다와 거짓 혼례",
    arcEn: "Act III: The Burning Sea & Veils of Deceit",
    synopsisKo: "심연의 틈을 일시 봉인하기 위해 일주일 밤낮을 홀로 결계를 유지하는 카단. 정신을 파고드는 악마들의 속삭임과의 사투가 벌어진다.",
    synopsisEn: "Sustaining a temporary seal against abyssal breaches for seven grueling nights, Kadan wages psychological warfare against demonic whispers.",
    bgmTheme: "dark-ominous",
    defaultVfx: "runes",
    durationMinutes: 25,
    keyCharacters: ["카단", "실리아", "발리안", "엘리아나"],
    highlightScene: "일곱 번째 새벽, 룬 마법진의 마지막 매듭을 묶으며 쓰러지는 카단"
  },
  25: {
    episodeNumber: 25,
    titleKo: "거짓 혼례의 밤",
    titleJa: "偽りの婚礼の夜",
    titleEn: "Night of the False Wedding",
    videoId: "q_JK7tJrjOA",
    movieVideoId: "v_LCzJ4TYuM",
    arc: "불타는 바다와 거짓 혼례",
    arcEn: "Act III: The Burning Sea & Veils of Deceit",
    synopsisKo: "정치적 음모를 파헤치기 위해 꾸며진 위장 결혼식. 베일 뒤에 감춰진 단검과 독주 속에서 진짜 배후를 유인하는 위험한 덫이 놓인다.",
    synopsisEn: "A decoy royal wedding orchestrated to expose shadow nobles spirals into lethal intrigue when assassins unveil hidden blades beneath ceremonial silk.",
    bgmTheme: "battle-march",
    defaultVfx: "slash",
    durationMinutes: 26,
    keyCharacters: ["카단", "실리아", "카제", "엘리아나"],
    highlightScene: "웨딩 베일을 걷어내며 암살자의 칼날을 막아내는 실리아의 마법 활"
  },
  26: {
    episodeNumber: 26,
    titleKo: "열린 문, 닫힌 마음",
    titleJa: "開かれた扉、閉ざされた心",
    titleEn: "Open Door, Closed Heart",
    videoId: "BHCrtb7uElE",
    movieVideoId: "poRWIDXCQvk",
    arc: "불타는 바다와 거짓 혼례",
    arcEn: "Act III: The Burning Sea & Veils of Deceit",
    synopsisKo: "차원의 관문이 마침내 열렸으나, 진실을 알게 된 실리아는 카단을 향해 마음의 문을 닫아걸고 침묵의 슬픔에 잠긴다.",
    synopsisEn: "Though the dimensional gate swings wide, Celia recoils from a bitter revelation about her heritage, entombing her grief in cold silence.",
    bgmTheme: "sorrow-lament",
    defaultVfx: "snow",
    durationMinutes: 22,
    keyCharacters: ["카단", "실리아", "이그니스"],
    highlightScene: "닫혀가는 관문 너머로 서로를 응시하는 두 사람의 엇갈린 눈빛"
  },
  27: {
    episodeNumber: 27,
    titleKo: "두 약속 사이",
    titleJa: "二つの約束の間",
    titleEn: "Between Two Promises",
    videoId: "9RWV1yIL9gY",
    movieVideoId: "TJHdYsRWwb8",
    arc: "불타는 바다와 거짓 혼례",
    arcEn: "Act III: The Burning Sea & Veils of Deceit",
    synopsisKo: "왕국을 지키겠다는 대의의 약속과 한 사람을 지키겠다는 개인의 서약. 카단은 둘 중 하나를 포기해야 하는 가혹한 선택에 직면한다.",
    synopsisEn: "Torn between his duty to protect the realm and his private oath to safeguard Celia, Kadan faces an agonising moral crossroads.",
    bgmTheme: "sorrow-lament",
    defaultVfx: "embers",
    durationMinutes: 23,
    keyCharacters: ["카단", "실리아", "티타니아", "알렉산다르"],
    highlightScene: "갈라진 두 갈래 길목에 서서 은빛 단검의 양날을 어루만지는 카단"
  },
  28: {
    episodeNumber: 28,
    titleKo: "녹옥 의회의 반란",
    titleJa: "緑玉評議会の反乱",
    titleEn: "Revolt of the Jade Council",
    videoId: "0MpVW5xHoHQ",
    movieVideoId: "_GiMOzpy1GQ",
    arc: "불타는 바다와 거짓 혼례",
    arcEn: "Act III: The Burning Sea & Veils of Deceit",
    synopsisKo: "녹옥 원로원 내부의 강경파들이 쿠데타를 일으켜 숲의 심장을 점령한다. 카단과 실리아는 자연의 폭주를 막기 위해 급파된다.",
    synopsisEn: "Corrupted elders of the Jade Council seize the arboreal core in a violent coup, threatening to unleash primeval blight across the land.",
    bgmTheme: "battle-march",
    defaultVfx: "runes",
    durationMinutes: 25,
    keyCharacters: ["카단", "실리아", "말퓨온", "이그니스"],
    highlightScene: "폭주하는 고대 나무 정령의 거대한 뿌리 사이를 가르는 화염과 별빛의 협공"
  },
  29: {
    episodeNumber: 29,
    titleKo: "바람의 여왕",
    titleJa: "風の女王",
    titleEn: "Queen of the Wind",
    videoId: "55wTedQ5fG8",
    movieVideoId: "Hh9DhZI7yIY",
    arc: "불타는 바다와 거짓 혼례",
    arcEn: "Act III: The Burning Sea & Veils of Deceit",
    synopsisKo: "전설 속 바람의 여왕이 폭풍의 왕좌에서 깨어난다. 카단 일행의 순수한 결의를 시험하기 위해 대륙 전체를 뒤흔드는 돌풍의 시험이 펼쳐진다.",
    synopsisEn: "Awakening from millennia of slumber upon the Gale Throne, the Wind Queen summons a continental hurricane to test the heroes' resolve.",
    bgmTheme: "triumph-fanfare",
    defaultVfx: "runes",
    durationMinutes: 24,
    keyCharacters: ["카단", "실리아", "아쿠아로드", "티타니아"],
    highlightScene: "폭풍의 눈 한가운데에서 바람의 여왕과 시선을 마주하는 카단의 결의"
  },
  30: {
    episodeNumber: 30,
    titleKo: "네 관문의 독",
    titleJa: "四つの関門の毒",
    titleEn: "Poison at the Four Gates",
    videoId: "6KdFMaPODTE",
    movieVideoId: "bpO2UtQ4cAc",
    arc: "불타는 바다와 거짓 혼례",
    arcEn: "Act III: The Burning Sea & Veils of Deceit",
    synopsisKo: "심연의 흑마술사들이 왕국의 사방 관문에 치명적인 맹독 결계를 살포한다. 카단은 동료들과 팀을 나누어 동시 정화 작전에 돌입한다.",
    synopsisEn: "Void cultists poison the four cardinal gates with necrotic miasma, initiating a synchronized four-pronged counterstrike.",
    bgmTheme: "dark-ominous",
    defaultVfx: "slash",
    durationMinutes: 26,
    keyCharacters: ["카단", "실리아", "실바니아", "말퓨온", "아쿠아로드"],
    highlightScene: "사방에서 동시에 치솟는 4색 정화 광선 기둥과 독안개의 소멸"
  },
  31: {
    episodeNumber: 31,
    titleKo: "모든 것을 건 손",
    titleJa: "すべてを賭けた手",
    titleEn: "The Hand That Wagered Everything",
    videoId: "F_qq8ed9ZYg",
    movieVideoId: "B4n6R7WbeuY",
    arc: "십자 성흔과 세계의 수호",
    arcEn: "Act IV: The Cross-Shaped Scar & World Defense",
    synopsisKo: "최종 결전에 앞서 자신의 모든 생명력과 마나를 걸고 금단의 성흔을 각성시키는 카단. 손바닥에 십자 형태의 성흔이 선명하게 타오른다.",
    synopsisEn: "Wagering his very life force, Kadan activates the forbidden scar upon his palm, transforming it into the blazing Cross-Shaped Crest.",
    bgmTheme: "battle-march",
    defaultVfx: "runes",
    durationMinutes: 26,
    keyCharacters: ["카단", "실리아", "아쿠아리스", "나이아드", "간다르"],
    highlightScene: "카단의 오른손 손바닥에서 황금빛 십자 성흔이 하늘을 향해 뻗어나가는 각성"
  },
  32: {
    episodeNumber: 32,
    titleKo: "첫사랑의 잔향",
    titleJa: "初恋の残香",
    titleEn: "Echo of First Love",
    videoId: "2K-Yj6is060",
    movieVideoId: "Wm8bQoH_sXs",
    arc: "십자 성흔과 세계의 수호",
    arcEn: "Act IV: The Cross-Shaped Scar & World Defense",
    synopsisKo: "결전 전야의 고요한 언덕. 카단과 실리아는 어린 시절 함께 보았던 별자리를 올려다보며 서로를 향한 변치 않는 마음을 고백한다.",
    synopsisEn: "On the tranquil hill before the final campaign, Kadan and Celia gaze upon childhood constellations, reaffirming their eternal bond.",
    bgmTheme: "sorrow-lament",
    defaultVfx: "snow",
    durationMinutes: 21,
    keyCharacters: ["카단", "실리아", "아쿠아리스", "나이아드"],
    highlightScene: "차가운 밤하늘 아래 서로의 어깨를 감싸 안으며 나누는 은밀한 입맞춤"
  },
  33: {
    episodeNumber: 33,
    titleKo: "검은 늪의 원한",
    titleJa: "黒い沼の怨念",
    titleEn: "Grudge of the Black Marsh",
    videoId: "jwBCW0uzqCk",
    movieVideoId: "9GjITXsquCw",
    arc: "십자 성흔과 세계의 수호",
    arcEn: "Act IV: The Cross-Shaped Scar & World Defense",
    synopsisKo: "원혼들이 갇힌 검은 늪지대에서 심연의 전위대가 총공세를 펼친다. 수천의 망령 군세에 맞서 카단의 단검이 성스러운 빛으로 늪을 가른다.",
    synopsisEn: "In the cursed Black Marsh, restless spirits fuse with the Void vanguard, met head-on by Kadan's radiant silver retribution.",
    bgmTheme: "dark-ominous",
    defaultVfx: "slash",
    durationMinutes: 24,
    keyCharacters: ["카단", "실리아", "아쿠아리스", "아쿠아로드", "간다르"],
    highlightScene: "오염된 검은 진흙을 하얗게 정화하며 갈라지는 성광의 참격"
  },
  34: {
    episodeNumber: 34,
    titleKo: "무너진 바람섬",
    titleJa: "崩れゆく風の島",
    titleEn: "The Fallen Wind Isle",
    videoId: "ZtgzDRjG3YI",
    movieVideoId: "bwImceXvXww",
    arc: "십자 성흔과 세계의 수호",
    arcEn: "Act IV: The Cross-Shaped Scar & World Defense",
    synopsisKo: "심연 군주의 타격으로 부유석이 깨어지며 천공의 바람섬이 지상으로 추락하기 시작한다. 영웅들은 추락을 저지하기 위해 목숨을 건다.",
    synopsisEn: "Catastrophic blows from the Void Lord shatter the levitation core, sending the celestial Wind Isle hurtling toward earth.",
    bgmTheme: "battle-march",
    defaultVfx: "embers",
    durationMinutes: 27,
    keyCharacters: ["카단", "실리아", "가웨인", "카제"],
    highlightScene: "추락하는 거대한 암석 기둥을 떠받치는 동료들의 합동 방어 마법"
  },
  35: {
    episodeNumber: 35,
    titleKo: "안개 속의 오인",
    titleJa: "霧の中の誤認",
    titleEn: "Mistaken in the Fog",
    videoId: "Oeh1EMWPvso",
    movieVideoId: "5TiPxwQgGcg",
    arc: "십자 성흔과 세계의 수호",
    arcEn: "Act IV: The Cross-Shaped Scar & World Defense",
    synopsisKo: "환각의 안개 속에서 아군끼리 서로를 적군으로 오인하여 칼을 겨눈다. 카단은 성진호흡으로 안개를 걷어내고 동료들의 의식을 일깨운다.",
    synopsisEn: "Trapped in hallucinatory miasma, allies clash in tragic confusion until Kadan dispels the fog with an incandescent Star Breath shout.",
    bgmTheme: "arcane-mystery",
    defaultVfx: "runes",
    durationMinutes: 23,
    keyCharacters: ["카단", "실리아", "카제", "이그니스"],
    highlightScene: "안개를 찢어발기며 울려 퍼지는 카단의 성진호흡 진언과 맑아지는 전장"
  },
  36: {
    episodeNumber: 36,
    titleKo: "십자 성흔의 지도",
    titleJa: "十字聖痕の地図",
    titleEn: "Map of the Cross-Shaped Scar",
    videoId: "Lm91xj5dHUY",
    movieVideoId: "eh6g0bAQuhY",
    arc: "십자 성흔과 세계의 수호",
    arcEn: "Act IV: The Cross-Shaped Scar & World Defense",
    synopsisKo: "대륙 전역의 고대 신전들이 카단의 십자 성흔과 공명하며 하나의 거대한 입체 마법진 지도를 하늘에 투영한다.",
    synopsisEn: "Temples across Arcane resonate in unison with Kadan's scar, projecting an astral star chart that pinpoints the Void Heart.",
    bgmTheme: "triumph-fanfare",
    defaultVfx: "runes",
    durationMinutes: 25,
    keyCharacters: ["카단", "실리아", "가웨인", "티타니아"],
    highlightScene: "대륙 상공에 거대한 금빛 격자망으로 펼쳐지는 세계 수호 결계의 지도"
  },
  37: {
    episodeNumber: 37,
    titleKo: "정복왕의 전쟁",
    titleJa: "征服王の戦争",
    titleEn: "War of the Conqueror King",
    videoId: "IFR2913-wjI",
    movieVideoId: "yJLKXkDNfaU",
    arc: "십자 성흔과 세계의 수호",
    arcEn: "Act IV: The Cross-Shaped Scar & World Defense",
    synopsisKo: "심연의 힘을 흡수한 과거의 정복왕이 부활하여 대륙 침공군을 이끈다. 11개 종족의 연합군이 총결집하여 세기의 격전을 벌인다.",
    synopsisEn: "The resurrected Conqueror King commands void legions in an apocalyptic offensive, met by the united armies of all eleven races.",
    bgmTheme: "battle-march",
    defaultVfx: "slash",
    durationMinutes: 28,
    keyCharacters: ["카단", "실리아", "이그니스", "티타니아", "엘윈"],
    highlightScene: "수십만의 연합군 함성과 함께 대지를 뒤흔들며 격돌하는 최전선 진격"
  },
  38: {
    episodeNumber: 38,
    titleKo: "세 개의 비단 봉인",
    titleJa: "三つの絹の封印",
    titleEn: "Three Silk Seals",
    videoId: "tFeF-yup4i8",
    movieVideoId: "5BySEnVaKRA",
    arc: "십자 성흔과 세계의 수호",
    arcEn: "Act IV: The Cross-Shaped Scar & World Defense",
    synopsisKo: "고대 여신이 남긴 세 개의 신성 비단 봉인. 카단, 실리아, 이그니스가 각각 하나의 봉인을 쥐고 심연의 삼중 핵을 압박한다.",
    synopsisEn: "Bearing three celestial silk seals bequeathed by the ancient goddess, Kadan, Celia, and Ignis strangle the tripartite core of the void.",
    bgmTheme: "arcane-mystery",
    defaultVfx: "runes",
    durationMinutes: 25,
    keyCharacters: ["카단", "실리아", "이그니스", "가웨인", "카제"],
    highlightScene: "세 방향에서 날아든 비단 봉인이 심연의 핵을 휘감으며 타오르는 섬광"
  },
  39: {
    episodeNumber: 39,
    titleKo: "지켜야 할 세계",
    titleJa: "守るべき世界",
    titleEn: "The World Worth Protecting",
    videoId: "2musDXZp7CI",
    movieVideoId: "x6FqqyVSJbY",
    arc: "십자 성흔과 세계의 수호",
    arcEn: "Act IV: The Cross-Shaped Scar & World Defense",
    synopsisKo: "심연 군주와의 최종 결전. 모든 동료의 마나가 카단의 은빛 단검에 집중되고, 세계를 지키기 위한 마지막 일격이 허공을 가른다.",
    synopsisEn: "The climactic duel against the Void Monarch. The spirits of every companion converge into Kadan's blade for the strike of salvation.",
    bgmTheme: "triumph-fanfare",
    defaultVfx: "slash",
    durationMinutes: 29,
    keyCharacters: ["카단", "실리아", "이그니스", "간다르", "아쿠아로드", "티타니아"],
    highlightScene: "은빛 단검이 태양처럼 폭발하며 심연의 어둠을 완전히 태워버리는 최후의 일격"
  },
  40: {
    episodeNumber: 40,
    titleKo: "영웅이라 불리지 않는 자",
    titleJa: "英雄と呼ばれぬ者",
    titleEn: "One Who Is Not Called a Hero",
    videoId: "v0p1zldiwWY",
    movieVideoId: "dY6NdHLQou4",
    arc: "십자 성흔과 세계의 수호",
    arcEn: "Act IV: The Cross-Shaped Scar & World Defense",
    synopsisKo: "전쟁이 끝나고 평화가 찾아온 대륙. 카단은 왕좌와 영예를 뒤로한 채, 다시 평범한 배낭을 메고 사랑하는 이들과 함께 새로운 방랑길에 오른다.",
    synopsisEn: "Peace returns to the reborn continent. Turning aside royal crowns and worldly praise, Kadan shoulder his pack to walk the horizon with those he loves.",
    bgmTheme: "arctic-blizzard",
    defaultVfx: "snow",
    durationMinutes: 26,
    keyCharacters: ["카단", "실리아", "알렉산다르", "발리안", "엘윈", "간다르"],
    highlightScene: "눈 덮인 엘윈 마을의 언덕길을 걸어가는 카단과 실리아의 평화로운 뒷모습"
  }
};

// Speaker and character name lookup cache
const SPEAKER_TO_PORTRAIT_MAP: Record<string, string> = {};
if (typeof CARD_DATABASE !== 'undefined') {
  Object.values(CARD_DATABASE).forEach((card) => {
    if (card?.title_en) {
      const fn = `/seat/${card.title_en.replace(/ /g, '_')}.png`;
      SPEAKER_TO_PORTRAIT_MAP[card.title_en.toLowerCase()] = fn;
      if (card.title) {
        SPEAKER_TO_PORTRAIT_MAP[card.title.toLowerCase()] = fn;
      }
    }
  });
}

/**
 * Returns deterministic portrait asset path from public/seat/*.png
 * mapped by characterCardId, English speaker name, or Korean speaker name.
 */
export function getCharacterPortraitUrl(cardId?: number, speakerEn?: string, speakerKo?: string): string {
  if (cardId && CARD_DATABASE[cardId]?.title_en) {
    return `/seat/${CARD_DATABASE[cardId].title_en.replace(/ /g, '_')}.png`;
  }
  if (speakerEn && speakerEn !== 'Narration' && speakerEn !== '내레이션') {
    const key = speakerEn.toLowerCase().trim();
    if (SPEAKER_TO_PORTRAIT_MAP[key]) return SPEAKER_TO_PORTRAIT_MAP[key];
    return `/seat/${speakerEn.replace(/ /g, '_')}.png`;
  }
  if (speakerKo && speakerKo !== '내레이션' && speakerKo !== 'Narration') {
    const key = speakerKo.toLowerCase().trim();
    if (SPEAKER_TO_PORTRAIT_MAP[key]) return SPEAKER_TO_PORTRAIT_MAP[key];
  }
  return '/seat/Kadan.png';
}

/**
 * Returns the standardized animation MP4 filename (`SNSHero.com_E{epNum}_{titleEn}.mp4`)
 */
export function getAnimationVideoFilename(epNum: number): string {
  const meta = MOVIE_EPISODES[epNum];
  const titleEn = meta?.titleEn || `Episode ${epNum}`;
  return `SNSHero.com_E${epNum}_${titleEn}.mp4`;
}

/**
 * Returns the standardized animation MP4 streaming/download path (`/video/animation/SNSHero.com_E{epNum}_{titleEn}.mp4?v=conquest2009_v9`)
 */
export function getAnimationVideoUrl(epNum: number): string {
  return `/video/animation/${getAnimationVideoFilename(epNum)}?v=conquest2009_v9`;
}

/**
 * Returns the standardized live-action cinema MP4 streaming/download path (`/videos/cinema/episode_{epNum}.mp4?v=conquest2009_v9`)
 */
export function getCinemaVideoUrl(epNum: number): string {
  const pad = String(Math.max(1, Math.min(40, epNum))).padStart(2, '0');
  return `/videos/cinema/episode_${pad}.mp4?v=conquest2009_v9`;
}
