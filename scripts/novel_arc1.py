#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/novel_arc1.py
SNSHero Web Novel Arc 1: Episodes 01 - 10
High-fantasy literary adaptation with 5-Act narrative expansion,
scene-tied dialogues, and 11-race environmental palettes.
"""

import sys, os
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

from scripts.novel_batch_1 import EP01_KO, EP01_EN
from scripts.novel_batch1_ep01_05 import EP02_KO, EP02_EN
from scripts.build_arc1_episodes import EP03_KO, EP03_EN, EP04_KO, EP04_EN
from scripts.remediate_arc1_ep01_10 import EP05_KO, EP05_EN
from scripts.build_arc1_complete import EP06_KO, EP06_EN, EP07_KO, EP07_EN
from scripts.finish_arc1 import EP08_KO, EP08_EN
from scripts.test_ep09_10_full import EP09_KO as EP09_KO_BASE, EP10_KO as EP10_KO_BASE
from scripts.generate_arc1 import EP09_EN, EP10_EN

# Polish EP09 to >= 3,800 chars
EP09_KO = EP09_KO_BASE + """

경기장 밖으로 빠져나온 두 사람은 세븐브리지의 복잡한 뒷골목으로 스며들었다. 실리아는 녹옥 지팡이 끝으로 골목길의 바람을 일으켜 바닥에 떨어진 카단의 핏자국을 깨끗이 지워냈다. 붉은 유리 궁정의 추적 룬이 반응하지 못하도록 마나의 흔적을 흩어버리는 고대 엘프의 은밀술이었다.

“루시안의 사냥개들이 벌써 냄새를 맡고 몰려오고 있어요. 오늘 밤 궁정 약제고에 잠입하지 못하면 워커 기사님은 내일 정오를 넘기지 못할 거예요.”

카단은 허리춤의 둥근 나무 방패를 등 뒤에 메며 고개를 끄덕였다.

“약초를 구하고, 이그니스의 검에 얽힌 진실도 알아내야 한다. 그 아이의 검에서 풍기던 고르고의 흑마술 냄새는 결코 평범한 기사의 것이 아니었어.”

두 사람의 결연한 속삭임 위로, 도성의 차가운 밤하늘에 샛별이 차갑게 번뜩이고 있었다."""

# Polish EP10 to >= 3,800 chars
EP10_KO = EP10_KO_BASE + """

차가운 급류를 타고 궁정 지하 외곽의 비밀 수로로 빠져나온 일행은 세븐브리지 항구의 인적이 끊긴 낡은 폐선박 안으로 이셀라를 피신시켰다. 실리아는 녹옥 지팡이로 배 주변에 은은한 바람의 결계를 쳐서 황실 추격대의 마나 탐지를 차단했다. 카단은 젖은 옷을 털어내며 이셀라의 손을 따스하게 감싸 쥐었다.

“이셀라 숙모님... 이제 안심하십시오. 스승님들이 계신 안전한 은신처로 모시겠습니다.”

이셀라는 눈물 고인 눈으로 카단의 가슴에 품어진 은빛 단검과, 밤하늘 너머로 사라진 아들 이그니스가 남긴 백색 화염의 잔향을 번갈아 바라보았다.

“알렉산다르 형님의 칼... 그리고 내 아들의 불꽃... 열여덟 해 동안 멈춰 있던 시간의 수레바퀴가 다시 돌아가기 시작했구나.”

이그니스는 비록 함께 오지 못하고 어둠 속으로 물러섰으나, 소년의 눈빛은 이미 루시안의 기만에서 벗어나 진실의 갈망으로 타오르고 있었다. 카단은 둥근 방패를 품에 안고 남쪽 하늘을 응시했다. 마침내 흩어졌던 성기사의 자손들이 진실을 마주하기 시작한 역사적인 밤이었다."""

ARC1_EPISODES = {
    1: (EP01_KO, EP01_EN),
    2: (EP02_KO, EP02_EN),
    3: (EP03_KO, EP03_EN),
    4: (EP04_KO, EP04_EN),
    5: (EP05_KO, EP05_EN),
    6: (EP06_KO, EP06_EN),
    7: (EP07_KO, EP07_EN),
    8: (EP08_KO, EP08_EN),
    9: (EP09_KO, EP09_EN),
    10: (EP10_KO, EP10_EN),
}

if __name__ == "__main__":
    print("Testing Arc 1 Episodes:")
    for ep in range(1, 11):
        ko, en = ARC1_EPISODES[ep]
        lines = [l.strip() for l in ko.split("\n") if l.strip()]
        dlgs = [l for l in lines if ('“' in l and '”' in l) or l.startswith('“')]
        print(f"Ep {ep:02d}: Chars={len(ko)}, Dialogues={len(dlgs)}, EnChars={len(en)}")
        assert len(ko) >= 3500, f"Ep {ep} failed len: {len(ko)}"
        assert len(dlgs) >= 8, f"Ep {ep} failed dlgs: {len(dlgs)}"
    print("All Arc 1 episodes passed assertions!")
