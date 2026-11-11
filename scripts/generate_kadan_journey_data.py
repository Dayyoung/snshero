#!/usr/bin/env python3
"""
Generates src/hearthstone/kadanJourneyData.ts from canonical novelRawEpisodes.ts
and curated 40-episode worldbuilding/cast/boss metadata so every episode of
『눈히어로 - 카단의 여정』 is crystal-clear, emotionally gripping, and faithful to the novel.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NOVEL_TS = ROOT / "src" / "content" / "novelRawEpisodes.ts"
WEBTOON_JSON = ROOT / "src" / "content" / "webtoonEpisodeManifest.json"
OUT_TS = ROOT / "src" / "hearthstone" / "kadanJourneyData.ts"

CHARS = {
    "kadan": ("카단", "알렉산다르의 아들 · 눈히어로 수호전사", "/anime-character-sheets/cutouts/041_Kadan.png"),
    "celia": ("실리아", "바람섬의 왕녀 · 천재 지략가", "/anime-character-sheets/cutouts/062_Celia.png"),
    "ignis": ("이그니스", "발리안의 친아들 · 불꽃 궁정의 양자", "/anime-character-sheets/cutouts/011_Ignis.png"),
    "aleksandar": ("알렉산다르", "카단의 아버지 · 옛 아케 성기사", "/anime-character-sheets/cutouts/050_Aleksandar.png"),
    "elwin": ("엘윈", "카단의 어머니 · 설원의 강인한 여인", "/anime-character-sheets/cutouts/042_Elwin.png"),
    "balian": ("발리안", "이그니스의 친아버지 · 아케 창술사", "/anime-character-sheets/cutouts/043_Balian.png"),
    "ysela": ("이셀라", "이그니스의 어머니 · 납치된 성녀", "/anime-character-sheets/cutouts/034_Ysela.png"),
    "hercul": ("헤르쿨", "은빛 단검을 전한 순례 성기사", "/anime-character-sheets/cutouts/049_Hercul.png"),
    "lucian": ("루시안", "붉은 유리 궁정 재상 · 만악의 근원", "/anime-character-sheets/cutouts/061_Lucian.png"),
    "artus": ("데스나이트 아르투스", "섀도우렐름 섭정 · 죽음의 기사", "/anime-character-sheets/cutouts/060_Death_Knight_Artus.png"),
    "gorgo": ("메두사 고르고", "나인섀도우 코덱스를 훔친 암흑 마녀", "/anime-character-sheets/cutouts/089_Medusa_Gorgo.png"),
    "belphegor": ("벨페고르", "흑요석 결정술사 · 심연의 마인", "/anime-character-sheets/cutouts/013_Belphegor.png"),
    "gawain": ("가웨인", "일곱 추적자 수장 · 맹인 음파 무인", "/anime-character-sheets/cutouts/045_Gawain.png"),
    "grimli": ("그림리", "일곱 추적자 · 드워프 대장장이 스승", "/anime-character-sheets/cutouts/074_Grimli.png"),
    "aila": ("에일라", "일곱 추적자 · 백발백중 석궁 명사수", "/anime-character-sheets/cutouts/070_Aila.png"),
    "eliana": ("엘리아나", "일곱 추적자 · 약제사 스승", "/anime-character-sheets/cutouts/063_Eliana.png"),
    "kaze": ("카제", "일곱 추적자 · 은화 비검술사", "/anime-character-sheets/cutouts/044_Kaze.png"),
    "rondol": ("론돌", "일곱 추적자 · 거친 파도의 뱃사공", "/anime-character-sheets/cutouts/046_Rondol.png"),
    "robinyard": ("로비냐드", "일곱 추적자 · 동료 위해 산화한 곡예사", "/anime-character-sheets/cutouts/048_Robinyard.png"),
    "fenrir": ("정복왕 펜릴", "북방 백은 늑대 부족의 패왕", "/anime-character-sheets/cutouts/081_Fenrir.png"),
    "gilgamesh": ("길가메시", "펜릴의 아들 · 카단의 의형제", "/anime-character-sheets/cutouts/047_Gilgamesh.png"),
    "malfuon": ("대현자 말퓨온", "별을 호흡하는 법을 전수한 현자", "/anime-character-sheets/cutouts/066_Malfuon.png"),
    "titania": ("티타니아", "북방 초원의 요정 전사", "/anime-character-sheets/cutouts/064_Titania.png"),
    "pegasus": ("적갈기 페가수스", "카단과 교감한 전설의 명마", "/anime-character-sheets/cutouts/090_Pegasus.png"),
    "walker": ("워커", "왕도 뒷골목의 은둔 무인", "/anime-character-sheets/cutouts/051_Walker.png"),
    "leonar": ("노장 레오나르", "녹옥 지팡이의 주인 · 옛 대장군", "/anime-character-sheets/cutouts/086_Leonar.png"),
    "aeolus": ("국왕 에올루스", "바람 속삭임 섬의 왕 · 실리아의 외조부", "/anime-character-sheets/cutouts/025_Aeolus.png"),
    "sylphid": ("여왕 실피드", "독살당한 실리아의 어머니", "/anime-character-sheets/cutouts/023_Sylphid.png"),
    "leviathan": ("심연룡 리바이어던", "코덱스의 어둠에 잠식된 대해의 괴수", "/anime-character-sheets/cutouts/006_Leviathan.png"),
    "ironforge": ("장인 아이언포지", "봉인 석실의 수호 거신병", "/anime-character-sheets/cutouts/080_Ironforge.png"),
    "arachne": ("독거미 아라크네", "루시안 휘하 맹독 암살단장", "/anime-character-sheets/cutouts/054_Arachne.png"),
    "aqualord": ("수문장 아쿠아로드", "네 수문 요새를 막아선 심연 군주", "/anime-character-sheets/cutouts/005_Aqualord.png"),
    "gandar": ("주술사 간다르", "검은 늪의 저주와 도박장 지배자", "/anime-character-sheets/cutouts/069_Gandar.png"),
}

ACTS = [
    (1, 8, 1, "제1막 · 눈보라의 서약과 북방의 성장"),
    (9, 16, 2, "제2막 · 붉은 유리 궁정과 엇갈린 두 형제"),
    (17, 24, 3, "제3막 · 바람섬의 진실과 선대 영웅의 유산"),
    (25, 32, 4, "제4막 · 수도 해방전과 형제의 숭고한 불씨"),
    (33, 40, 5, "제5막 · 검은 성채 결전과 새벽의 귀향"),
]

# (ep, titleKo, locationKo, prevContextKo, synopsisKo, battleReasonKo, allyKeys, enemyKeys, bossClass, bossNameKo, bossPortraitKey)
EP_META = [
    (
        1, "눈보라 아래 두 서약", "엘윈 마을 통나무 주막 & 외나무다리",
        "패전국의 변방 설원 엘윈 마을에서 옛 성기사 알렉산다르와 발리안은 신분을 숨긴 채 새 생명의 탄생을 기다린다.",
        "순례 성기사 헤르쿨이 찾아와 곧 태어날 두 아이(카단·이그니스)를 위한 은빛 단검을 건넨다. 그러나 사흘 뒤 궁정 귀족 루시안이 만삭의 엘윈을 탐내 마을을 반역죄로 모함하여 토벌대를 이끌고 습격한다. 알렉산다르는 아내와 뱃속의 카단을 피신시키기 위해 외나무다리 위에서 홀로 최후의 결전을 벌인다.",
        "만삭의 아내 엘윈이 북방 설원으로 무사히 탈출할 수 있도록, 불타는 외나무다리 위에서 루시안의 궁정 토벌대를 막아내야 한다!",
        ["aleksandar", "balian", "hercul", "elwin"], ["lucian"], "ROGUE", "야심가 루시안의 토벌대", "lucian"
    ),
    (
        2, "일곱 추적자의 맹세", "세븐브리지 항구 어시장 골목",
        "엘윈 마을이 불타고 알렉산다르가 산화한 뒤, 뒤늦게 잿더미에 도착한 헤르쿨은 루시안의 왕실 병기 파편을 수습해 남쪽 항구로 향한다.",
        "노예선에 끌려가던 전쟁고아들을 추적하던 헤르쿨은 부둣가에서 변방의 일곱 의인(가웨인·그림리·에일라·엘리아나·카제·론돌·로비냐드)과 궁정 첩자로 서로 오해해 격돌한다. 소녀의 증언으로 오해를 푼 뒤, 일곱 추적자는 북방에서 카단을, 헤르쿨은 남방에서 이그니스를 찾아 기르고 18년 뒤 별취한 종탑에서 재회하기로 피의 맹세를 맺는다.",
        "오해로 부딪친 세븐브리지의 일곱 추적자들과 정정당당히 무예를 겨루어 진정한 성기사의 신의를 증명하라!",
        ["hercul", "gawain", "aila"], ["grimli", "kaze"], "WARLOCK", "세븐브리지 일곱 추적자", "grimli"
    ),
    (
        3, "안개 절벽의 피", "미스트폴 절벽 고대 타이탄 폐신전",
        "알렉산다르의 아들을 찾아 북방으로 떠난 일곱 추적자는 칠흑 같은 흑암 안개가 깔린 미스트폴 절벽에 발이 묶인다.",
        "금지된 마도서 『나인섀도우 코덱스』를 훔쳐 달아난 파문 마도사 메두사 고르고와 흑요석 괴인 벨페고르가 폐신전 천장을 부수고 일행을 기습한다. 독안개와 그림자 봉쇄 속 절체절명의 위기에서 곡예사 로비냐드가 몸을 던져 벨페고르를 붙잡고 산화하며, 남은 여섯 스승은 눈물 속에 하나의 심장으로 합을 맞춰 괴물을 격퇴한다.",
        "동료 로비냐드의 숭고한 희생을 헛되이 하지 않기 위해, 흑요석 결정 괴인 벨페고르와 암흑 마녀 고르고를 처단하라!",
        ["robinyard", "gawain", "grimli", "aila"], ["belphegor", "gorgo"], "WARRIOR", "결정술사 벨페고르", "belphegor"
    ),
    (
        4, "황야에서 자란 아이", "북방 와일드랜드 영구동토 빙판 협곡",
        "여섯 번의 혹한이 흐른 북방 설원에서 카단은 마나 재능은 더디지만 어머니 엘윈의 가르침 아래 누구보다 우직하고 따뜻한 아이로 자라난다.",
        "정복왕 펜릴의 어린 아들 길가메시가 적대 부족 암살자들에게 포위되자, 맨손의 소년 카단이 눈보라 속으로 뛰어들어 화살에 허벅지를 찢기면서도 길가메시를 등에 업고 살얼음 강을 건너 구해낸다. 그날 밤 은빛 단검의 공명을 따라 도착한 여섯 스승이 드디어 카단을 찾아내 제자로 맞이한다.",
        "등에 업은 친구 길가메시를 끝까지 지켜내기 위해, 살얼음 협곡을 추격해 오는 북방 암살자 부대를 물리쳐라!",
        ["kadan", "elwin", "gilgamesh", "fenrir"], ["lucian"], "HUNTER", "설원 협곡 암살단", "aila"
    ),
    (
        5, "폭우 속의 유령", "북방 고원 석회암 종유석 동굴",
        "여섯 스승 밑에서 6년간 혹독한 수련을 쌓아 열두 살이 된 카단은 폭우를 피해 스승들과 고대 종유석 동굴로 몸을 숨긴다.",
        "로비냐드의 원수인 암흑 마녀 메두사 고르고가 폭우의 음파와 흑암 연막을 타고 유령처럼 스며들어 카단의 목덜미를 노린다. 시야가 차단된 순간, 맹인 스승 가웨인의 일갈을 들은 카단이 두 눈을 감고 빗방울이 비껴가는 진공의 틈을 감지해 은빛 단검으로 보이지 않는 고르고의 손목을 베어낸다.",
        "시야를 가리는 흑암 연막 속에서 눈을 감고 바람의 결을 읽어, 유령처럼 덮쳐오는 암흑 마녀 메두사 고르고를 격퇴하라!",
        ["kadan", "gawain", "grimli", "aila"], ["gorgo"], "ROGUE", "암흑 마녀 메두사 고르고", "gorgo"
    ),
    (
        6, "별을 호흡하는 법", "와일드랜드 별빛 바위 봉우리",
        "여섯 스승의 제각기 다른 무예를 한꺼번에 배우던 카단은 기술들이 몸 안에서 충돌하며 성장이 멈추는 한계에 부딪힌다.",
        "스승들 몰래 밤마다 깎아지른 별빛 바위 봉우리에 오른 카단 앞에 대자연의 은둔 현자 말퓨온이 나타난다. 말퓨온은 밤하늘의 별빛을 들이쉬고 발밑 대지로 숨을 내쉬는 고대 내공 『별을 호흡하는 법(성진호흡법)』을 전수하고, 흩어졌던 여섯 스승의 무예가 마침내 카단의 단단한 대지 호흡 하나로 융합된다.",
        "여섯 갈래로 흩어진 무예를 하나의 별빛 호흡으로 융합하기 위해, 대현자 말퓨온의 영기 수련 시험을 통과하라!",
        ["kadan", "malfuon", "grimli"], ["malfuon"], "DRUID", "대자연의 현자 말퓨온", "malfuon"
    ),
    (
        7, "배신자들의 천막", "와일드랜드 대평원 유목 연맹 본영",
        "열여덟 살 건장한 청년 무인으로 성장한 카단은 스승들의 18년 맹세를 지키러 남쪽으로 떠나기 전 마지막 밤을 맞이한다.",
        "붉은 유리 궁정의 루시안과 은밀히 내통한 북방 부족의 배신자들이 축제 술잔에 마비 독을 타 정복왕 펜릴을 암살하려는 반란을 일으킨다. 카단은 의형제 길가메시·요정 전사 티타니아와 함께 포위망을 뚫고 반란군을 제압하면서도 항복한 포로의 목숨을 살려 기사의 도리를 세운 뒤, 본토를 향한 대장정에 오른다.",
        "정복왕 펜릴의 막사를 기습한 섀도우렐름 내통 배신자 부대를 진압하고 북방의 의리를 지켜내라!",
        ["kadan", "fenrir", "gilgamesh", "titania"], ["artus"], "WARRIOR", "섀도우렐름 내통 반란군", "artus"
    ),
    (
        8, "붉은 갈기의 기수", "국경 관문 도시 페가수스 밸리",
        "북방 설원을 넘어 처음으로 남쪽 번화가 페가수스 밸리에 발을 디딘 카단은 대륙 본토의 활기와 위선을 동시에 마주한다.",
        "어떤 조련사도 태우지 못한 전설의 적갈기 야생 명마가 난동을 부리자, 카단은 채찍 대신 별빛 호흡의 평온함으로 교감해 명마의 진정한 주인이 된다. 이어 시장에서 남루한 거지 소년 차림으로 탐욕스러운 상인의 누명을 통쾌한 추리로 깨부수는 천재 소녀 지략가 ‘실리아’와 운명적인 첫 동행을 시작한다.",
        "순수한 카단의 적갈기 명마를 강탈하려는 국경 관문의 사병 대장과 건달 무리를 혼내 주어라!",
        ["kadan", "celia", "pegasus"], ["walker"], "HUNTER", "관문 약탈 기병대장", "walker"
    ),
    (
        9, "거지 옷의 바람", "왕도 라이트헤븐 내성 결투 광장",
        "카단과 실리아가 당도한 왕도 라이트헤븐 광장에서는 거만한 귀족 공자가 비무 초빙을 빙자해 서민 무인들을 짓밟고 있었다.",
        "붉은 비단 예복을 입은 소년 귀족의 정체는 원수 루시안의 양자로 길러진 발리안의 친아들 ‘이그니스’였다! 출생의 비밀을 모른 채 권력과 오만에 취해 암흑 사술까지 섞어 쓰는 이그니스 앞에 카단이 나서 정면으로 격돌하고, 은둔 무인 워커의 조력 속에 첫 숙명의 라이벌전을 펼친다.",
        "원수의 양자로 자라 무고한 이들을 짓밟는 화염의 귀공자 이그니스의 오만한 검을 정면으로 꺾어라!",
        ["kadan", "celia", "walker"], ["ignis"], "WARRIOR", "불꽃 궁정의 귀공자 이그니스", "ignis"
    ),
    (
        10, "불꽃 궁정의 포로", "라이트헤븐 붉은 유리 궁전 외곽",
        "광장 결투 이후 루시안의 본거지인 붉은 유리 궁전을 정찰하던 카단과 실리아는 궁정 깊숙한 곳에 숨겨진 충격적인 비밀을 감지한다.",
        "죽은 줄 알았던 이그니스의 친어머니 이셀라가 18년 동안 루시안의 감시 아래 유폐되어 있었고, 지하 감옥에는 반역자로 낙인찍힌 양심수들이 신음하고 있었다. 실리아의 치밀한 환기구 분석으로 잠입 작전을 세우던 밤, 진홍빛 예복의 재상 루시안이 친위 불꽃 기사단을 이끌고 은신처를 급습한다.",
        "은신처를 포위한 루시안의 불꽃 궁정 친위 기사단을 돌파하고 지하 감옥 구출로를 확보하라!",
        ["kadan", "celia", "ysela"], ["lucian", "ignis"], "MAGE", "붉은 유리 궁정 친위대", "lucian"
    ),
    (
        11, "기억을 깨우는 단검", "붉은 유리 궁정 제7 지하 용암 감옥",
        "용암 열기가 들끓는 지하 폐광 감옥 깊숙이 잠입한 카단과 실리아는 쇠사슬에 묶인 채 18년을 버텨온 창술사 발리안을 발견한다.",
        "추격해 온 이그니스가 친아버지인 줄도 모른 채 발리안에게 화염 검을 겨누자, 발리안은 살상 대신 아들의 검 궤도만을 쳐내는 아케 가문 비전 창술을 보여준다. 동시에 카단이 꺼낸 은빛 단검 한 쌍이 공명하며 출생의 진실이 흔들리고, 뒤따라온 메두사 고르고의 사슬 채찍을 카단이 방패로 막아내며 발리안과 이셀라의 탈출을 성공시킨다.",
        "발리안과 이셀라의 탈출로를 가로막는 지하 감옥 수호장 메두사 고르고의 맹공을 방패로 막아내라!",
        ["kadan", "balian", "celia", "ysela"], ["gorgo"], "ROGUE", "지하 감옥의 메두사 고르고", "gorgo"
    ),
    (
        12, "두 무덤 사이의 봄", "왕도 외곽 잊힌 옛 성기사단 성소",
        "18년 만에 해후한 발리안과 이셀라는 옛 성기사단의 폐허 성소에서 눈물로 재회하며 카단에게 지난날 엘윈 마을의 모든 진실을 들려준다.",
        "부모 세대의 숭고한 희생을 알게 된 카단은 증오가 아닌 수호의 길을 다시금 다짐한다. 그러나 성소까지 추격해 온 궁정 마도 골렘 부대가 성역을 짓밟으려 들자, 발리안은 카단에게 두 번째 은빛 단검을 맡기며 성소의 결계를 함께 지켜낸다.",
        "선대 성기사들의 넋이 잠든 옛 성소를 파괴하려는 궁정 마도 골렘 토벌대를 물리쳐라!",
        ["kadan", "balian", "hercul", "celia"], ["ironforge"], "PALADIN", "궁정 마도 공성 골렘", "ironforge"
    ),
    (
        13, "녹옥 지팡이의 주인", "동해안 삼나무 안개 숲길",
        "루시안의 추적을 피해 동해안 안개 호수로 향하던 카단과 실리아는 숲속 주막에서 호방한 거지 차림의 기이한 노인과 마주친다.",
        "실리아가 정성껏 차려낸 요리로 노인의 마음을 사로잡자, 노인은 자신이 한때 대륙의 의인 연맹을 이끌었던 전설의 대장군 ‘레오나르’임을 밝힌다. 홀로 방황하던 이그니스까지 우연히 합류하며, 레오나르는 실리아의 총명함과 의협심을 인정해 지휘관의 증표인 ‘녹옥 지팡이’와 비전 타격술을 전수한다.",
        "녹옥 지팡이를 물려받을 자격을 증명하기 위해, 전설의 노장 레오나르가 내리는 실전 대련 시험을 이겨내라!",
        ["kadan", "celia", "leonar"], ["leonar"], "SHAMAN", "전설의 노장 레오나르", "leonar"
    ),
    (
        14, "안개 호수의 손님들", "동해안 안개 호수 ‘구름돌아오는장원’",
        "일흔두 개의 거대한 현무암 석주가 솟은 안개 호수에서 카단은 스승 론돌의 옛 전우들이 지키는 피난민 장원을 방문한다.",
        "전쟁고아와 난민들을 돌보는 장원에 궁정의 앞잡이 수적단이 들이닥쳐 약탈을 시도한다. 카단과 실리아는 물안개 지형과 얼음 다리를 활용해 주민들을 먼저 대피시키고 수적단을 격파하며, 뒤따라온 이그니스는 난민들이 내민 따뜻한 산나물 국 한 그릇에 처음으로 황실 바깥 민중의 온기를 느낀다.",
        "피난민 아이들이 머무는 안개 호수 장원을 약탈하려는 해안 수적단을 수장시켜라!",
        ["kadan", "celia", "rondol", "ignis"], ["aqualord"], "MAGE", "안개 호수 약탈 수적단", "aqualord"
    ),
    (
        15, "독사와 사자의 밤", "폭풍우 치는 구름돌아오는장원 본채",
        "자정의 폭풍우가 안개 호수를 덮친 밤, 루시안이 비밀리에 파견한 황실 직속 독사 암살단이 장원 전체를 몰살하기 위해 침투한다.",
        "맹독 단검에 찔리면서도 어린 난민 아이들을 품에 안고 버텨 선 노장 레오나르는 사자 같은 마지막 포효로 적들을 쓸어낸 뒤 평온히 눈을 감는다. 현장에 떨어진 암살단의 황실 친필 인장을 직접 확인한 이그니스는 자신이 믿었던 양아버지 루시안이 무고한 백성을 학살하는 원흉이었음을 깨닫고 피눈물을 흘린다.",
        "노장 레오나르가 목숨 바쳐 지켜낸 아이들을 수호하기 위해, 루시안이 보낸 황실 독사 암살단을 섬멸하라!",
        ["kadan", "leonar", "ignis", "celia"], ["gorgo", "arachne"], "ROGUE", "황실 직속 독사 암살단", "arachne"
    ),
    (
        16, "폐허 앞의 형제", "상현달이 뜬 안개 호수 출항 부두",
        "레오나르의 장례를 치른 다음 날 밤, 상현달 아래 마주 선 카단과 이그니스는 부모 세대가 남긴 편지와 두 자루 은빛 단검을 마주한다.",
        "친아버지 발리안의 원수인 루시안을 아비라 부르며 살아온 죄책감에 무너져 내리던 이그니스에게, 카단은 원망 대신 굳센 손을 내밀어 의형제의 맹세를 다시 잇는다. 증거 인멸을 위해 들이닥친 황궁 추격 함대를 두 형제가 완벽한 협공으로 격파하고, 실리아의 고향 ‘바람 속삭임 섬’을 향해 돛을 올린다.",
        "진정한 형제로 거듭난 카단과 이그니스의 첫 협공으로, 부두를 포위한 황궁 화염 추격대를 격파하라!",
        ["kadan", "ignis", "celia", "rondol"], ["lucian"], "WARRIOR", "황궁 추격 함대 사령관", "lucian"
    ),
    (
        17, "바람섬의 초대장", "동쪽 대해 범선 ‘미풍의날개호’ 갑판",
        "일흔두 석주 미로를 빠져나와 망망대해로 나선 일행에게 바람 속삭임 섬에서 날아온 의문의 초대장이 도착한다.",
        "실리아는 어머니 실피드 여왕이 10년 전 의문의 죽음을 맞은 뒤 고향 섬이 외부와 단절되었다는 아픈 과거를 털어놓는다. 칼날 산호초 해협에 들어서자 섬의 반역파인 제피르 대장로가 보낸 해상 기습선이 접근하고, 일행은 거센 파도 위 선상 난전을 돌파해 비밀 해저 동굴로 진입한다.",
        "바람 속삭임 섬 진입을 막아서는 제피르 대장로의 해협 매복 함대를 선상 결투로 돌파하라!",
        ["kadan", "celia", "ignis", "rondol"], ["aqualord"], "SHAMAN", "칼날 해협 매복 함대", "aqualord"
    ),
    (
        18, "검은 성전의 비밀", "바람 속삭임 섬 지하 ‘검은 성전’",
        "해저 동굴을 지나 수천 년간 봉인되어 있던 지하 흑요석 유적 ‘검은 성전’에 발을 디딘 카단, 실리아, 이그니스.",
        "성전 중앙의 고대 기억 수정구가 작동하며 10년 전 연회의 충격적인 진상이 투영된다. 평화 협정 자리에서 루시안 재상과 내통한 제피르 대장로가 실피드 여왕의 은잔에 메두사 고르고의 맹독을 탔던 것이다! 진실을 목격한 이들을 매장하려는 성전 수호 골렘이 깨어나자 세 사람은 분노와 정의의 불꽃으로 맞선다.",
        "실피드 여왕 독살의 진실을 묻어버리려 가동된 지하 검은 성전의 고대 흑요석 수호자를 파괴하라!",
        ["celia", "kadan", "ignis"], ["ironforge", "gandar"], "WARLOCK", "검은 성전 흑요석 수호자", "ironforge"
    ),
    (
        19, "세 가지 시험", "해발 수천 길 상공 ‘하늘 제단’",
        "지하 성전을 빠져나와 섬 최정상 하늘 제단에 오른 일행 앞을 실리아의 외조부이자 바람섬의 국왕 에올루스가 가로막는다.",
        "외부인을 불신하던 에올루스 국왕은 세 가지 무예·지략·신념의 시험을 내린다. 카단은 대지의 무게로 폭풍을 품는 별빛 호흡으로 바람의 칼날을 견뎌내고, 이그니스는 형제를 대신해 기꺼이 벌을 받겠다는 헌신을 보이며 국왕의 얼어붙은 마음을 녹인다. 에올루스는 실리아에게 어머니의 푸른 깃털 망토를 물려준다.",
        "대륙 본토 구원 동맹을 맺기 위해, 천공의 군주 에올루스 국왕이 내리는 하늘 제단 세 가지 시험을 통과하라!",
        ["kadan", "celia", "ignis", "aeolus"], ["aeolus"], "HUNTER", "바람섬 국왕 에올루스", "aeolus"
    ),
    (
        20, "꽃배를 삼킨 파도", "바람섬 비취 결계탑 & 출항 대해",
        "음모가 탄로 난 제피르 대장로가 비취 결계탑 코어를 『나인섀도우 코덱스』의 암흑 장치와 연결해 바다 밑 심연 괴수를 깨운다.",
        "출항 준비를 마친 수백 척의 꽃배 선단 앞으로 칠흑의 해일과 함께 타락한 바다의 재앙 ‘심연룡 리바이어던’이 솟구친다! 론돌이 선단을 지휘하는 사이, 카단은 뱃머리 최전선에 우뚝 서 별빛 장벽을 전개해 리바이어던의 암흑 마나포를 정면으로 받아치며 본토 상륙의 바닷길을 열어젖힌다.",
        "수백 척의 꽃배 선단을 집어삼키려는 타락한 바다 괴수 심연룡 리바이어던의 검은 해일을 막아내라!",
        ["kadan", "celia", "aeolus", "rondol"], ["leviathan"], "MAGE", "심연룡 리바이어던", "leviathan"
    ),
    (
        21, "불탄 배의 흔적", "불타는 본토 서남부 세븐브리지 해안",
        "거센 대해를 건너 마침내 대륙 본토 해안에 상륙한 꽃배 선단 앞에는 환영 대신 검붉은 연기와 불타버린 구호소가 펼쳐져 있었다.",
        "루시안의 직속 철갑 추격대가 선단의 상륙을 막기 위해 해안 성역과 피난민 창고에 불을 지르고 독화살 세례를 퍼붓는다. 카단은 무쇠 방패를 앞세워 불길 속 주민들을 구출하고, 실리아·이그니스와 함께 해안 교두보를 탈환하며 대륙 심장부로의 진격을 시작한다.",
        "해안 구호소에 불을 지르고 독화살을 퍼붓는 루시안의 서남부 철갑 봉쇄군을 격파하라!",
        ["kadan", "celia", "ignis"], ["artus"], "WARRIOR", "해안 방화 철갑 추격대", "artus"
    ),
    (
        22, "무인도의 투석기", "수도 해상 관문 ‘사이렌 해협’ 무인도",
        "수도로 향하는 유일한 좁은 물길 사이렌 해협 양쪽 절벽에는 루시안의 마도 화포 진지가 선단의 진입을 원천 봉쇄하고 있었다.",
        "정면 돌파가 불가능한 상황에서 무인도에 상륙한 일행은 스승 그림리의 대장장이 기술, 실리아의 대왕 다시마 탄성 로프 설계, 카단의 괴력을 합쳐 하룻밤 만에 초거대 공성 투석기를 완성한다! 절벽 위 화포 진지를 정확히 타격해 해협 봉쇄망을 통쾌하게 무너뜨린다.",
        "무인도에서 완성한 협동 공성 투석기로 사이렌 해협 절벽의 마도 화포 수비대를 격파하라!",
        ["kadan", "celia", "grimli"], ["ironforge"], "PALADIN", "사이렌 해협 화포 요새장", "ironforge"
    ),
    (
        23, "석굴의 기록", "용의 뿔 산맥 고대 해안 석굴",
        "사이렌 해협을 돌파한 일행은 수도 외곽 ‘용의 뿔 산맥’ 기슭에서 옛 아케 성기사단이 남긴 비밀 석굴 통로를 발견한다.",
        "석굴 벽면에는 제1차 성전 당시 어둠의 군단에 맞섰던 선대 성기사들과 알렉산다르·발리안의 젊은 날 기록이 새겨져 있었다. 그때 성기사들의 유해를 모독하며 망령으로 되살리려던 사령술사 부대가 침입하고, 카단은 아버지와 선배 영웅들의 안식처를 지키기 위해 분연히 방패를 든다.",
        "선대 성기사들의 유해가 잠든 용의 석굴을 더럽히는 섀도우렐름 사령술사 부대를 정화하라!",
        ["kadan", "celia", "balian", "aleksandar"], ["gandar", "artus"], "WARLOCK", "석굴 침입 사령술사", "gandar"
    ),
    (
        24, "봉인된 석실", "용의 석굴 최심부 아다만티움 석실",
        "석굴 가장 깊은 곳, 수백 길 높이의 아다만티움 철문 너머에서 제1차 성전 열두 성기사의 전설적인 유산이 일행을 기다린다.",
        "고대 성기사단의 시련 수호자를 정정당당히 넘어선 카단은 부서지지 않는 전설의 성물 『드래곤 브레이커 방패』를 계승하고 별빛 호흡의 극의를 깨우친다. 마침 수도 라이트헤븐에서 루시안이 황권을 찬탈하기 위해 거짓 혼례식을 연다는 급보가 날아들고, 세 청년은 비밀 지하 수로를 통해 수도 한복판으로 질주한다.",
        "전설의 성물 『드래곤 브레이커 방패』의 주인으로 인정받기 위해 봉인 석실의 황금 수호 거신을 돌파하라!",
        ["kadan", "celia", "ignis", "ironforge"], ["ironforge"], "PALADIN", "석실의 아다만티움 수호신", "ironforge"
    ),
    (
        25, "거짓된 혼례", "수도 라이트헤븐 백리석 대성당",
        "수천 개의 촛불로 치장된 수도 대성당에서 최고 재상 루시안은 황실의 정통성을 날조하기 위한 거짓 혼례식을 강행한다.",
        "성당의 거대한 문이 열리며 백색 화염을 두른 이그니스와 카단, 실리아가 당당히 걸어 들어온다! 이그니스는 만천하의 시민들 앞에서 루시안의 엘윈 마을 학살과 여왕 독살 죄상을 낱낱이 폭로하고, 진실에 눈뜬 수도 시민들이 일제히 봉기하자 당황한 루시안은 내궁 비밀 철문 뒤로 도주한다.",
        "거짓 혼례식장을 지키는 루시안의 대성당 근위 사제단과 심판관들을 무너뜨리고 민중에게 진실을 밝혀라!",
        ["ignis", "kadan", "celia"], ["lucian"], "PRIEST", "대성당 타락 심판관단", "lucian"
    ),
    (
        26, "열린 문, 닫힌 마음", "황궁 삼중 방어벽 제1관문 ‘태양의 철문’",
        "대성당 해방과 함께 횃불을 든 수도 상인·노동자들이 합류하며 황궁 외곽 ‘태양의 철문’ 앞에서 대격돌이 벌어진다.",
        "루시안의 세뇌 저주인 뱀 문신에 묶여 백성들에게 칼을 겨누던 황궁 수문장 발타자르와 맞선 카단과 이그니스. 두 청년은 병사들의 목숨을 빼앗는 대신 방패와 검등으로 저주의 핵만을 타격해 철문을 개방하고, 죽어가던 발타자르 역시 마침내 세뇌에서 풀려나 내궁의 함정을 경고하고 눈을 감는다.",
        "뱀 문신의 저주에 조종당하는 태양의 철문 중장갑 수비대를 제압하고 황궁 진입로를 열어라!",
        ["kadan", "ignis", "celia"], ["artus"], "WARRIOR", "태양의 철문 저주 수문장", "artus"
    ),
    (
        27, "두 개의 약속 사이에서", "결전 전야 황궁 내궁 정원",
        "비취 평의회 최후의 결전을 하루 앞둔 자정, 고요한 내궁 정원에서 세 사람은 저마다 가슴속 깊은 약속을 나눈다.",
        "실리아는 전쟁이 끝나면 북방의 봄날 보리밭에서 평범하게 함께 살자는 소박한 소망을 카단에게 고백한다. 한편 홀로 과거의 죄책감을 짊어진 이그니스는 카단에게 자신의 순수한 마나가 담긴 ‘유리 불씨’를 건네며, 무슨 일이 생겨도 대륙과 실리아를 지켜 달라는 비장한 다짐을 남긴 채 야습해 온 암살단과 맞선다.",
        "결전 전야 내궁 정원으로 스며든 섀도우렐름 그림자 자객단을 물리치고 내일 새벽의 깃발을 지켜라!",
        ["kadan", "celia", "ignis"], ["arachne"], "ROGUE", "내궁 그림자 자객단", "arachne"
    ),
    (
        28, "비취 평의회의 반란", "황궁 최고 회의장 ‘비취 평의회’ 대전각",
        "자정의 비취 평의회 대전각—루시안과 데스나이트 아르투스는 수도 전체를 날려버릴 금지된 유물 ‘심연의 핵’을 폭주시키고 있었다!",
        "아르투스의 흑요석 대검 맹공을 카단이 드래곤 브레이커 방패로 한 치의 물러섬 없이 받아내는 사이, 임계점에 달한 심연의 핵이 대폭발을 일으키려 한다. 그 순간 이그니스가 형제 카단과 백성들을 결계 밖으로 밀쳐내고 자신의 심장 불꽃을 끝까지 불살라 폭주하는 심연의 핵을 홀로 봉인하며 찬란한 빛 속으로 산화한다.",
        "형제 이그니스의 숭고한 불꽃이 헛되지 않도록, 대전각을 가로막은 데스나이트 아르투스의 맹공을 분쇄하라!",
        ["kadan", "ignis", "celia"], ["artus", "lucian"], "ROGUE", "데스나이트 아르투스", "artus"
    ),
    (
        29, "바람의 여왕", "잿빛 새벽의 라이트헤븐 중앙 광장",
        "이그니스의 희생으로 수도 라이트헤븐은 파멸을 면했지만, 형제를 잃은 슬픔이 채 가시기도 전에 북방으로 도주한 루시안의 독니가 다시 덮쳐온다.",
        "해방된 시민들이 실리아를 새로운 여왕으로 추대하려 하지만, 실리아는 화려한 왕관을 사양하고 민중과 함께 걷는 ‘바람의 벗’으로 남겠다고 선언해 광장을 감동시킨다. 직후 광장 지하에서 기습해 온 루시안 휘하 맹독 암살단장 아라크네를 제압한 카단과 실리아는 이그니스의 유리 불씨를 품고 북방 최후 결전지로 출진한다.",
        "수도 해방 선언식을 피로 물들이려 기습한 맹독 거미 여왕 아라크네를 광장에서 처단하라!",
        ["celia", "kadan"], ["arachne"], "WARLOCK", "맹독 여왕 아라크네", "arachne"
    ),
    (
        30, "네 수문의 맹독", "북방 방어선 ‘네 수문 요새’",
        "루시안의 본거지 검은 늪으로 진격하는 연합군 앞을 절벽 사이 네 개의 거대한 흑철 수문 요새가 가로막는다.",
        "메두사 고르고가 수문 상류에 풀어놓은 치명적인 부식 맹독이 강물을 타고 수천 명의 의용군과 피난민을 덮치려 한다! 스승 론돌과 약제사 엘리아나가 해독 수로를 여는 동안, 카단과 실리아는 폭풍우를 가르고 수문 꼭대기로 돌격해 수문장 아쿠아로드와 고르고의 독기 장치를 단숨에 박살 낸다.",
        "하류 백성들에게 맹독 강물을 방류하려는 네 수문 요새의 타락 수문장 아쿠아로드를 제압하라!",
        ["kadan", "celia", "rondol", "eliana"], ["aqualord", "gorgo"], "SHAMAN", "타락 수문장 아쿠아로드", "aqualord"
    ),
    (
        31, "내기에 건 손", "검은 늪 외곽 ‘흐르는 모래강’ 도박 요새",
        "네 수문을 넘어선 연합군은 바닥 없는 유사(流砂)가 흐르는 모래강 도하 다리를 점거한 흑마법 도박사 간다르와 마주한다.",
        "간다르는 포로로 잡은 민간인들의 목숨을 담보로 주사위 두 개로 ‘13’을 만들어야만 다리를 내주겠다는 불가능한 사기 도박을 강요한다. 스승 카제의 눈썰미를 떠올린 카단은 주사위가 멈추는 찰나 은빛 단검의 검기만으로 주사위 하나를 반으로 쪼개 ‘6 + 6 + 1 = 13’을 만들어내는 통쾌한 기지로 적의 사기극을 박살 내고 인질들을 구출한다!",
        "비열한 인질 사기 도박이 깨지자 본색을 드러낸 모래강 흑마술사 간다르의 군단을 쓸어버려라!",
        ["kadan", "celia", "grimli", "kaze"], ["gandar"], "WARLOCK", "모래강 지배자 간다르", "gandar"
    ),
    (
        32, "첫사랑의 메아리", "검은 늪 안개림 ‘속삭이는 버드나무 숲’",
        "모래강을 건넌 연합군은 천 년 된 고대 버드나무들이 안개 속에 도열한 환각의 숲으로 진입한다.",
        "숲을 지배하는 환각 마녀의 주술이 실리아 앞에 돌아가신 어머니 실피드 여왕의 따뜻한 환영을 피워 올려 마음의 빈틈을 파고든다. 환각에 잠식될 위기의 순간, 카단이 불어준 맑고 청아한 북방의 피리 소리가 안개를 산산조각 내고, 두 사람은 봄날 보리밭의 약속을 다시 새기며 심연의 본진 앞으로 나아간다.",
        "그리운 이의 환영으로 마음을 무너뜨리는 속삭이는 버드나무 숲의 환각 결계 수호자를 파훼하라!",
        ["celia", "kadan", "sylphid"], ["gorgo"], "PRIEST", "안개숲의 환각 마녀", "gorgo"
    ),
    (
        33, "검은 늪", "심연의 심장부 ‘검은 늪 성채’ 정문",
        "유황 진흙과 산성 안개가 들끓는 대륙 모든 부패의 종착지, 루시안의 최후 거점 ‘검은 늪 성채’가 마침내 모습을 드러낸다.",
        "루시안은 신의 힘으로도 열 수 없다는 거대 흑철 성문을 걸어 잠그고 지하 붕괴 마법진을 가동해 연합군을 생매장하려 한다. 그때 북방에서 달려온 여섯 스승(가웨인·그림리·에일라·엘리아나·카제·론돌)이 제자 카단의 곁에 집결하여 완벽한 6인의 합공으로 난공불락의 성문 빗장을 부수고 돌격로를 연다!",
        "여섯 스승과 힘을 합쳐 난공불락의 검은 늪 성채 정문 수비군단을 돌파하라!",
        ["kadan", "celia", "gawain", "grimli"], ["lucian", "belphegor"], "WARRIOR", "검은 늪 성문 거신병단", "belphegor"
    ),
    (
        34, "쓰러진 바람섬", "붕괴하는 검은 성채 지하 용암 회랑",
        "성채 내부로 진입하자 루시안이 가동한 ‘대륙 붕괴의 룬’으로 천장의 유황 암석이 쏟아지고 바닥이 용암 속으로 무너져 내린다.",
        "제자 카단과 실리아를 최상층 파멸의 제단으로 올려보내기 위해, 여섯 스승들이 기꺼이 무너지는 거대 석주 아래에 남아 어깨와 무기로 천장을 떠받친다! ‘대륙의 미래를 부탁한다, 우리의 자랑스러운 제자여!’ 스승들의 숭고한 외침을 등 뒤로 삼킨 채 카단은 피눈물을 머금고 나선 계단 끝으로 질주한다.",
        "무너지는 용암 회랑에서 스승들이 열어준 생명의 통로를 가로막는 심연 파멸군을 일소하라!",
        ["kadan", "celia", "rondol", "aila"], ["artus"], "SHAMAN", "용암 회랑 파멸 수호대", "artus"
    ),
    (
        35, "안개 속의 착각", "검은 성채 상층 ‘환영의 안개 회랑’",
        "스승들의 헌신으로 상층부에 도달한 카단과 실리아를 기다리는 것은 스승들의 비명 환청으로 정신을 흔드는 ‘환영의 안개 회랑’이었다.",
        "슬픔의 틈을 노리고 안개 속에서 다섯 개의 분신으로 나뉜 데스나이트 아르투스의 흑요석 대검이 동시에 카단의 심장을 찌른다! 그러나 12살 폭우 동굴에서 배운 가웨인의 가르침을 기억한 카단은 환청을 차단하고 진짜 살기의 무게중심 단 하나를 간파해 아르투스의 마검을 두 동강 낸다.",
        "다섯 개의 환영 분신 뒤에서 심장을 노리는 숙적 데스나이트 아르투스와 최후의 진검승부를 결판내라!",
        ["kadan", "celia", "gawain"], ["artus"], "ROGUE", "숙적 데스나이트 아르투스", "artus"
    ),
    (
        36, "십자 흉터의 지도", "검은 성채 최상층 ‘별빛의 기록실’",
        "환영 회랑을 넘어 도달한 별빛의 기록실 천장 아래에는 대륙 전체의 마나 맥동이 실시간으로 흐르는 거대한 고대 성도가 펼쳐져 있었다.",
        "실리아는 성도 위에 새겨진 선대 스승들의 암호를 해독해 북방의 눈꽃·대해의 바람·황실의 성화·대지의 방패 네 힘이 교차하는 십자 중심점이 바로 루시안의 파멸 제단임을 밝혀낸다! 같은 시각 성채 하층부에서는 북방의 정복왕 펜릴과 길가메시가 이끄는 백은 늑대 기병대가 당도해 승리의 뿔피리를 울린다.",
        "별빛의 기록실 제단 통로를 봉쇄한 나인섀도우 고위 비전 마도사단을 격파하라!",
        ["kadan", "celia", "fenrir", "gilgamesh"], ["gandar"], "MAGE", "별빛 기록실 암흑 마도사단", "gandar"
    ),
    (
        37, "패왕의 전쟁", "검은 성채 외곽 협곡 & 최상층 계단",
        "성채 아래 협곡에서는 북방 패왕 펜릴의 백은 늑대 기병대가 루시안의 최후 친위대 ‘사령 기사단’을 상대로 장엄한 전면전을 벌인다.",
        "‘알렉산다르의 아들이 꼭대기에서 싸우고 있다, 단 한 마리의 마수도 올려보내지 마라!’ 펜릴의 포효 속에 상층 계단을 오른 카단과 실리아는 이성을 잃고 조종당하는 기사들을 단 한 명의 부당한 살상도 없이 방패와 질풍만으로 무장 해체시키며 마침내 옥좌 홀 문 앞에 당도한다.",
        "파멸의 제단 옥좌 홀 직전을 가로막는 루시안의 불사 ‘사령 기사단’ 정예를 돌파하라!",
        ["kadan", "celia", "fenrir"], ["artus"], "PALADIN", "루시안 친위 사령 기사단", "artus"
    ),
    (
        38, "세 개의 명주 봉인", "파멸의 제단 최정상 흑요석 옥좌 홀",
        "마침내 마주한 최정상 옥좌 홀—최고 재상 루시안은 인간의 형상을 완전히 버리고 심연의 군주 벨페고르의 마력을 삼켜 괴물로 변이해 있었다!",
        "대륙 전체를 심연으로 침몰시킬 ‘세 개의 명주 봉인’이 풀려나는 절체절명의 순간! 실리아의 녹옥 질풍이 첫 봉인을 찢고, 카단의 드래곤 브레이커 방패가 두 번째 봉인을 부수며, 마지막 세 번째 암흑 결계는 카단의 품속에서 타오른 이그니스의 ‘유리 불씨’가 은빛 단검과 공명해 찬란한 빛의 폭풍으로 『나인섀도우 코덱스』를 영원히 소멸시킨다!",
        "부모 세대와 이그니스, 스승들의 모든 염원을 담아 심연의 괴물로 타락한 원흉 루시안·벨페고르 융합체를 심판하라!",
        ["kadan", "celia", "ignis"], ["lucian", "belphegor"], "WARLOCK", "심연화신 루시안 & 벨페고르", "lucian"
    ),
    (
        39, "지킬 만한 가치가 있는 세상", "새벽빛이 내리는 파멸의 제단 정상",
        "세 개의 명주 봉인이 박살 나고 칠흑 같던 먹구름이 걷히며 동쪽 대해 수평선 너머로 황금빛 새벽 햇살이 대륙을 비추기 시작한다.",
        "그러나 무너진 옥좌 뒤편에서 마지막 망념에 사로잡힌 고대 죽음의 기사가 부러진 대검을 끌며 일어난다. 카단은 증오 대신 기사의 안식을 빌어주는 정결한 방패술로 마지막 어둠을 잠재워 무릎 꿇리고, 바닥을 기며 목숨을 구걸하는 루시안을 사적 복수 대신 역사와 법의 심판대에 넘긴다.",
        "전쟁의 마지막 망령으로 일어난 고대 죽음의 기사에게 참된 기사의 안식을 선사하고 새벽을 완성하라!",
        ["kadan", "celia"], ["artus"], "PRIEST", "최후의 고대 죽음의 기사", "artus"
    ),
    (
        40, "영웅이라 불리지 않는 자", "재건된 수도 라이트헤븐 & 엘윈 설원 보리밭 오두막",
        "전쟁이 끝나고 한 달 뒤, 평화를 되찾은 수도 라이트헤븐 광장에 수만 명의 백성이 구국의 영웅을 맞이하기 위해 운집한다.",
        "황실은 대륙 최고 원수의 직위와 공작 작위, 무수한 황금을 내리려 하지만, 카단과 실리아는 모든 권력과 영예를 조용히 사양한다. 두 사람은 전쟁 전 어머니 엘윈이 차가운 설원에 심었던 밀밭으로 돌아가, 전설의 방패를 오두막 지붕 삼아 흙을 일구고 다친 길손을 맞이하는 따뜻하고 평범한 ‘사람’으로서의 새로운 삶을 시작한다. (40화 완주 시 다음 차원 ‘환생’ 개방!)",
        "대단원의 피날레—바람섬과 북방, 왕도의 모든 전우들과 함께 평화의 시대를 여는 영광의 기념 대련에서 승리하라!",
        ["kadan", "celia", "aeolus", "fenrir"], ["hercul", "aleksandar"], "PALADIN", "전설의 성기사 환영 수련전", "hercul"
    ),
]


def clean_novel_text(s: str) -> str:
    s = re.sub(r"`([^`]+)`", r"‘\1’", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


SPEECH_VERBS = r"(?:말했|말을|소리쳤|으르렁|외쳤|속삭였|답했|물었|읊조렸|일갈|호령|조소|외치|목소리|웃으며|부르짖|선언했|경고했|중얼)"


def detect_speaker_key(raw_p: str, prev_p: str, next_p: str, default_key: str) -> str:
    non_quote_self = re.sub(r"“[^”]*”", " ", raw_p)
    speech_zones = []
    other_zones = []

    for z in (non_quote_self, prev_p, next_p):
        if not z or z.startswith("“"):
            continue
        if re.search(SPEECH_VERBS, z):
            speech_zones.append(z)
        else:
            other_zones.append(z)

    for zone in speech_zones + [non_quote_self] + other_zones:
        if not zone:
            continue
        best_pos = 999999
        best_key = None
        for ck, (full_name, _, _) in CHARS.items():
            short_name = full_name.split()[-1]
            m = re.search(rf"{re.escape(short_name)}(?:은|는|이|가|도|의|께서)", zone)
            if m and m.start() < best_pos:
                best_pos = m.start()
                best_key = ck
        if best_key:
            return best_key

    return default_key


def summarize_narration(text: str, fallback: str) -> str:
    cleaned = clean_novel_text(re.sub(r"“[^”]*”", "", text))
    if len(cleaned) < 28:
        cleaned = clean_novel_text(fallback)
    if len(cleaned) > 145:
        cut = cleaned[:142]
        dot = max(cut.rfind("다."), cut.rfind("요."), cut.rfind("다!"))
        cleaned = cut[: dot + 2] if dot > 45 else cut + "..."
    return cleaned


def extract_quote_and_narration(
    paras: list[str],
    ally_keys: list[str],
    enemy_keys: list[str],
    prev_context_ko: str,
    synopsis_ko: str,
    battle_reason_ko: str,
):
    n = len(paras)
    quotes_in_ep = []
    for idx, p in enumerate(paras):
        m = re.search(r"“([^”]{10,145})”", p)
        if m:
            quotes_in_ep.append((idx, m.group(1).strip(), p))

    # Pick 4 well-spaced dramatic quotes across the chapter
    chosen_quotes = []
    if len(quotes_in_ep) >= 4:
        q_len = len(quotes_in_ep)
        chosen_quotes = [
            quotes_in_ep[0],
            quotes_in_ep[max(1, q_len // 3)],
            quotes_in_ep[max(2, (2 * q_len) // 3)],
            quotes_in_ep[-1],
        ]
    else:
        for i in range(4):
            if i < len(quotes_in_ep):
                chosen_quotes.append(quotes_in_ep[i])
            else:
                p_i = min(n - 1, (i * n) // 4)
                chosen_quotes.append((p_i, "", paras[p_i]))

    stage_labels = ["1장 · 발단", "2장 · 전개", "3장 · 절정", "4장 · 결투 개막"]
    page_nums = ["01", "04", "07", "10"]
    fallback_speakers = [
        ally_keys[0],
        ally_keys[1] if len(ally_keys) > 1 else ally_keys[0],
        enemy_keys[0],
        ally_keys[0],
    ]

    syn_sentences = [s.strip() for s in re.split(r"(?<=[다요!])\.\s+|(?<=!)\s+", synopsis_ko) if s.strip()]

    beats = []
    for b_idx in range(4):
        p_idx, q_text, raw_p = chosen_quotes[b_idx]
        prev_p = paras[p_idx - 1] if p_idx > 0 else ""
        next_p = paras[p_idx + 1] if p_idx + 1 < n else ""

        sp_key = detect_speaker_key(raw_p, prev_p, next_p, fallback_speakers[b_idx])
        sp_name, sp_role, sp_cutout = CHARS[sp_key]

        # Build crystal-clear contextual narration for each of the 4 stages
        if b_idx == 0:
            narr = summarize_narration(paras[0], prev_context_ko)
        elif b_idx == 3:
            # Final stage always bridges clearly into why the card battle starts right now!
            narr = battle_reason_ko
        else:
            candidate = prev_p if (raw_p.startswith("“") and len(prev_p) >= 32 and not prev_p.startswith("“")) else raw_p
            fb = syn_sentences[min(b_idx, len(syn_sentences) - 1)] if syn_sentences else synopsis_ko
            narr = summarize_narration(candidate, fb)

        if not q_text:
            q_text = "물러설 곳은 없다. 우리의 맹세와 방패로 이 어둠을 돌파한다!"

        beats.append({
            "stageLabel": stage_labels[b_idx],
            "pageNum": page_nums[b_idx],
            "narration": narr,
            "speakerName": sp_name,
            "speakerRole": sp_role,
            "speakerCutoutUrl": sp_cutout,
            "quote": clean_novel_text(q_text),
        })
    return beats


def shorten_comic_line(text: str, limit: int = 68) -> str:
    s = clean_novel_text(text).strip(' "“”\'')
    # Strip parenthetical notes to keep comic captions punchy & complete
    s = re.sub(r"\([^)]*\)", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    # Strip leading conjunctions
    s = re.sub(r"^(그러나 사흘 뒤|그러나|하지만|이어|동시에|그날 밤)\s+", "", s)
    if len(s) <= limit:
        if not s.endswith((".", "!", "?")):
            s += "."
        return s
    # Prefer complete first sentence if available
    first_sent = re.split(r"(?<=[다요!?.])\s+", s)[0].strip()
    if 12 <= len(first_sent) <= limit + 8:
        if not first_sent.endswith((".", "!", "?")):
            first_sent += "."
        return first_sent
    # Otherwise trim cleanly after comma and finish naturally or keep concise
    if "," in s:
        after_comma = s.split(",", 1)[1].strip()
        if 14 <= len(after_comma) <= limit + 6:
            if not after_comma.endswith((".", "!", "?")):
                after_comma += "."
            return after_comma
    cut = s[: limit - 1]
    sp = cut.rfind(" ")
    return (cut[:sp].strip() if sp >= limit // 2 else cut.strip()) + "…"


def main():
    raw_ts = NOVEL_TS.read_text(encoding="utf-8")
    m = re.search(r"NOVEL_RAW_EPISODES:\s*Record<number,\s*string>\s*=\s*(\{.*\});", raw_ts, re.S)
    assert m, "Could not parse NOVEL_RAW_EPISODES"
    novel_map: dict[str, str] = json.loads(m.group(1))
    webtoon_manifest: dict[str, dict] = json.loads(WEBTOON_JSON.read_text(encoding="utf-8"))

    episodes_out = []
    for meta in EP_META:
        (
            ep,
            title_ko,
            location_ko,
            prev_context_ko,
            synopsis_ko,
            battle_reason_ko,
            ally_keys,
            enemy_keys,
            boss_class,
            boss_name_ko,
            boss_portrait_key,
        ) = meta

        act_num = 1
        act_title = ACTS[0][3]
        for s_ep, e_ep, a_no, a_ti in ACTS:
            if s_ep <= ep <= e_ep:
                act_num = a_no
                act_title = a_ti
                break

        ep_text = novel_map[str(ep)]
        paras = [
            p.strip()
            for p in ep_text.split("\n\n")
            if p.strip()
            and not p.strip().startswith("#")
            and not p.strip().startswith(">")
            and "===" not in p
            and "SNSHero.com" not in p
            and "소설 관련" not in p
        ]

        beats = extract_quote_and_narration(
            paras,
            ally_keys,
            enemy_keys,
            prev_context_ko,
            synopsis_ko,
            battle_reason_ko,
        )
        pad = f"{ep:02d}"

        wt_imgs = [
            x
            for x in webtoon_manifest.get(str(ep), {}).get("images", [])
            if x.get("type") != "title_card"
        ]
        wt_ratios = [0.08, 0.36, 0.66, 0.88]
        cut_tags = ["1컷 · 발단", "2컷 · 전개", "3컷 · 위기", "4컷 · 결전"]

        syn_parts = [
            s.strip()
            for s in re.split(r"(?<=[다요!])\.\s+|(?<=!)\s+", synopsis_ko)
            if s.strip()
        ]
        one_line_ko = shorten_comic_line(battle_reason_ko, 66)

        scenes = []
        for idx_b, b in enumerate(beats):
            wt_url = f"/images/storybook/ep_{pad}/page_{b['pageNum']}.webp"
            wt_quote = b["quote"]
            wt_speaker = b["speakerName"]
            if wt_imgs:
                pick = wt_imgs[min(len(wt_imgs) - 1, int(len(wt_imgs) * wt_ratios[idx_b]))]
                wt_url = pick.get("localArtUrl") or pick.get("imageUrl") or wt_url
                dlgs = [
                    d
                    for d in pick.get("dialogues", [])
                    if d.get("speakerKo") and d.get("speakerKo") != "내레이션"
                ]
                if dlgs:
                    wt_speaker = dlgs[0]["speakerKo"]
                    wt_quote = dlgs[0]["textKo"]

            if idx_b == 0:
                base_cap = syn_parts[0] if syn_parts else prev_context_ko
            elif idx_b == 1:
                base_cap = syn_parts[min(1, len(syn_parts) - 1)] if syn_parts else b["narration"]
            elif idx_b == 2:
                base_cap = syn_parts[-1] if syn_parts else b["narration"]
            else:
                base_cap = battle_reason_ko

            scenes.append({
                "stageLabel": cut_tags[idx_b],
                "illustrationUrl": wt_url,
                "shortCaption": shorten_comic_line(base_cap, 64),
                "shortQuote": shorten_comic_line(wt_quote, 46),
                "narration": b["narration"],
                "speakerName": wt_speaker,
                "speakerRole": b["speakerRole"],
                "speakerCutoutUrl": b["speakerCutoutUrl"],
                "quote": b["quote"],
            })

        cast = []
        for ak in ally_keys:
            nm, rl, cu = CHARS[ak]
            cast.append({"name": nm, "role": rl, "cutoutUrl": cu, "side": "ALLY"})
        for ek in enemy_keys:
            if any(c["name"] == CHARS[ek][0] for c in cast):
                continue
            nm, rl, cu = CHARS[ek]
            cast.append({"name": nm, "role": rl, "cutoutUrl": cu, "side": "ENEMY"})

        episodes_out.append({
            "episode": ep,
            "actNumber": act_num,
            "actTitle": act_title,
            "titleKo": title_ko,
            "locationKo": location_ko,
            "oneLineKo": one_line_ko,
            "novelEpisodeUrl": f"/book?ep={ep}",
            "webtoonEpisodeUrl": f"/webtoon?ep={ep}",
            "bookMdUrl": f"/book/episode_{pad}.md",
            "coverIllustrationUrl": scenes[0]["illustrationUrl"],
            "prevContextKo": prev_context_ko,
            "synopsisKo": synopsis_ko,
            "battleReasonKo": battle_reason_ko,
            "cast": cast,
            "scenes": scenes,
            "bossHeroClass": boss_class,
            "bossNameKo": boss_name_ko,
            "bossCutoutUrl": CHARS[boss_portrait_key][2],
        })

    ts_code = f"""import {{ CLASSIC_PRESET_DECKS, cardDb }} from './cardDb';
import {{ CollectionMap, getJourneyCardMultiplier, hasCombatStatsForJourney }} from './storage';
import {{ BoardThemeId, HeroClass, JourneyBattleMeta }} from './types';

export interface JourneyCastMember {{
  name: string;
  role: string;
  cutoutUrl: string;
  side: 'ALLY' | 'ENEMY';
}}

export interface JourneyStoryScene {{
  stageLabel: string;
  illustrationUrl: string;
  shortCaption: string;
  shortQuote: string;
  narration: string;
  speakerName: string;
  speakerRole: string;
  speakerCutoutUrl: string;
  quote: string;
}}

export interface KadanJourneyEpisodeDef {{
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
}}

export const KADAN_JOURNEY_EPISODES: KadanJourneyEpisodeDef[] = {json.dumps(episodes_out, ensure_ascii=False, indent=2)};

export function getJourneyEpisodeDef(episode: number): KadanJourneyEpisodeDef {{
  const safeIdx = Math.max(1, Math.min(40, Math.floor(episode || 1))) - 1;
  return KADAN_JOURNEY_EPISODES[safeIdx] || KADAN_JOURNEY_EPISODES[0];
}}

export interface JourneyDifficultySpec {{
  enemyHeroHealth: number;
  enemyStatScale: number;
  recommendedMultiplier: number;
  aiDifficulty: 'NORMAL' | 'EXPERT';
  boardTheme: BoardThemeId;
  expectedWinGold: number;
  isBossMilestone: boolean;
}}

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
): JourneyDifficultySpec {{
  const ep = Math.max(1, Math.min(40, Math.floor(episode || 1)));
  const reinc = Math.max(0, Math.floor(reincarnation || 0));

  let baseHp = 20;
  let baseScale = 0.85;

  if (ep === 1) {{
    baseHp = 20;
    baseScale = 0.85;
  }} else if (ep === 2) {{
    baseHp = 26;
    baseScale = 1.05;
  }} else if (ep === 3) {{
    baseHp = 38;
    baseScale = 1.65;
  }} else if (ep <= 10) {{
    baseHp = 38 + (ep - 3) * 5; // 38 -> 73
    baseScale = 1.65 + (ep - 3) * 0.22; // 1.65 -> 3.19
  }} else if (ep <= 25) {{
    baseHp = 73 + (ep - 10) * 4; // 73 -> 133
    baseScale = 3.2 + (ep - 10) * 0.16; // 3.2 -> 5.6
  }} else {{
    baseHp = 133 + (ep - 25) * 5; // 133 -> 208
    baseScale = 5.6 + (ep - 25) * 0.22; // 5.6 -> 8.9
  }}

  if (ep % 5 === 0) {{
    baseHp = Math.round(baseHp * 1.15);
    baseScale = Number((baseScale * 1.12).toFixed(2));
  }}

  const reincHpFactor = 1 + reinc * 0.9;
  const reincScaleAdd = reinc * 2.6;

  const enemyHeroHealth = Math.round(baseHp * reincHpFactor);
  const enemyStatScale = Number((baseScale + reincScaleAdd).toFixed(2));
  const recommendedMultiplier = Math.max(1, Math.ceil(enemyStatScale * 0.9));

  const themes: BoardThemeId[] = ['STORMWIND', 'ORGRIMMAR', 'PANDARIA'];
  const boardTheme = themes[(ep - 1) % themes.length];
  const expectedWinGold = 40 + ep * 5 + reinc * 35;

  return {{
    enemyHeroHealth,
    enemyStatScale,
    recommendedMultiplier,
    aiDifficulty: ep >= 3 || reinc > 0 ? 'EXPERT' : 'NORMAL',
    boardTheme,
    expectedWinGold,
    isBossMilestone: ep % 5 === 0,
  }};
}}

/**
 * 카단의 여정 전용 플레이어 덱 자동 구성:
 * - 보유한 모든 카드(종족 제한 없음)가 골고루 등장하도록 보유 카드 전체 풀에서 균등 셔플 편성
 * - 3장 이상 보유한 하수인·무기 카드는 보유 장수 배수(3장=3배, N장=N배)를 메타데이터에 기록
 */
export function buildJourneyPlayerDeckAndMultipliers(col: CollectionMap): {{
  deckCards: string[];
  playerCardMultipliers: Record<string, number>;
  boostedCardCount: number;
  maxMultiplier: number;
  totalOwnedUnique: number;
}} {{
  const allCollectible = cardDb.getAllCollectible();
  const ownedCards = allCollectible.filter((c) => (col[c.id] || 0) > 0);
  const playerCardMultipliers: Record<string, number> = {{}};
  let boostedCardCount = 0;
  let maxMultiplier = 1;

  for (const card of ownedCards) {{
    const cnt = col[card.id] || 0;
    const mult = getJourneyCardMultiplier(card, cnt);
    if (mult > 1) {{
      playerCardMultipliers[card.id] = mult;
      boostedCardCount += 1;
      if (mult > maxMultiplier) maxMultiplier = mult;
    }}
  }}

  // Shuffle all unique owned cards evenly so every owned card across all 11 factions has an equal chance to appear!
  // Put a slight priority mix so cards with combat stats & multipliers are always well-represented alongside others
  const poolIds = ownedCards.map((c) => c.id);
  for (let i = poolIds.length - 1; i > 0; i -= 1) {{
    const j = Math.floor(Math.random() * (i + 1));
    [poolIds[i], poolIds[j]] = [poolIds[j], poolIds[i]];
  }}

  // Build a balanced 36-card Journey deck drawing evenly across all owned cards (ensuring good mana curve too)
  const lowCurve = poolIds.filter((id) => (cardDb.getCard(id)?.cost ?? 3) <= 3);
  const midCurve = poolIds.filter((id) => {{
    const cost = cardDb.getCard(id)?.cost ?? 3;
    return cost >= 4 && cost <= 5;
  }});
  const highCurve = poolIds.filter((id) => (cardDb.getCard(id)?.cost ?? 3) >= 6);

  const deckCards: string[] = [];
  const takeEvenly = (arr: string[], target: number) => {{
    for (let i = 0; i < arr.length && deckCards.length < target; i += 1) {{
      deckCards.push(arr[i]);
    }}
  }};

  takeEvenly(lowCurve, 16);
  takeEvenly(midCurve, 28);
  takeEvenly(highCurve, 36);

  // Fill up to at least 30 cards if collection is somehow tiny
  let safetyIdx = 0;
  while (deckCards.length < 30 && poolIds.length > 0) {{
    deckCards.push(poolIds[safetyIdx % poolIds.length]);
    safetyIdx += 1;
  }}

  return {{
    deckCards,
    playerCardMultipliers,
    boostedCardCount,
    maxMultiplier,
    totalOwnedUnique: ownedCards.length,
  }};
}}

/**
 * 회차 및 환생 난이도에 맞춰 적 보스의 덱 또한 점점 고급(희귀·영웅·전설) 하수인 위주로 강화됨
 */
export function buildJourneyBossDeck(
  bossClass: HeroClass,
  episode: number,
  reincarnation: number,
): string[] {{
  const preset = CLASSIC_PRESET_DECKS.find((d) => d.heroClass === bossClass);
  const baseDeck = preset ? [...preset.cards] : [...CLASSIC_PRESET_DECKS[0].cards];

  if (episode <= 2 && reincarnation === 0) {{
    return baseDeck;
  }}

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
  for (let i = 0; i < replaceCount; i += 1) {{
    const pick = elitePool[(episode * 7 + i * 13 + reincarnation * 19) % elitePool.length];
    upgraded[i % upgraded.length] = pick.id;
  }}
  return upgraded;
}}
"""

    OUT_TS.write_text(ts_code, encoding="utf-8")
    print(f"Successfully generated {OUT_TS} with {len(episodes_out)} canonical episodes!")


if __name__ == "__main__":
    main()
