#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/build_arc1_episodes.py
Authors commercial-grade literary fantasy for Arc 1 (Episodes 01 - 10).
"""

import os
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

from scripts.novel_batch_1 import EP01_KO, EP01_EN
from scripts.novel_batch1_ep01_05 import EP02_KO, EP02_EN

# -----------------------------------------------------------------------------
# EPISODE 03: 안개 절벽의 피 / Blood on the Mist Cliff
# -----------------------------------------------------------------------------
EP03_KO = """# 눈히어로 3화 - 안개 절벽의 피

> 원문 범위: 제5장-제6장

북방을 향해 험준한 산악 지대를 가로지르던 일곱 추적자는 미스트폴 절벽의 기괴한 침묵 속에서 길을 잃었다. 수천 년 전 고대 타이탄 거인족이 맨손으로 깎아 세웠다는 거대한 현무암 암벽들이 안개 너머로 거인의 묘비처럼 불길하게 솟아 있었다. 대낮이었음에도 불구하고 천 길 계곡 깊은 곳에서 기어오른 차가운 흑암 안개는 말들의 발목을 덮더니, 이내 사냥꾼들의 어깨 너머까지 짙은 장막처럼 차올랐다. 절벽의 검붉은 바위벽마다 마른 핏자국을 머금은 낯선 손자국들이 기괴한 나선형으로 찍혀 있었다.

약제사 엘리아나가 말에서 내려 유리병에 든 푸른 감식액을 바위벽에 떨어뜨리자, 치익 하는 날카로운 파열음과 함께 은빛 가루가 허공으로 피어올랐다.

“살아 있는 생명체에서 억지로 마나를 뽑아내어 시체처럼 결정을 굳히는 금지된 흑마술의 흔적이에요.”

엘리아나의 창백한 목소리가 서늘한 안개 속으로 흩어졌다. 일행의 말들이 콧김을 거칠게 뿜으며 뒷걸음질을 쳤다. 말발굽 아래에서 부서지는 자갈 소리가 천 길 낭떠러지 바닥으로 떨어지며 음산한 메아리를 남겼다.

“조심해라, 모두 무기를 쥐어라. 이 안개는 단순한 기후의 조화가 아니다.”

맹인 추적자 가웨인의 서늘한 경고가 떨어지자마자, 바람결을 타고 피비린내 나는 기괴한 휘파람 소리가 절벽 허공을 맴돌았다. 도박사 카제가 손가락 사이로 번뜩이는 은화 세 닢을 허공으로 튕기며 낮게 읊조렸다.

“바람의 흐름이 한 지점으로 뒤틀리고 있어. 돈 냄새 대신 썩은 시체 냄새가 진동하는군.”

뱃사공 론돌 역시 등에 진 물결무늬 지팡이를 잡으며 고개를 저었다.

“강 하류에서 거슬러 올라오는 수증기가 아니오. 이건 원한 맺힌 영혼들의 피 냄새가 섞인 마력의 장벽이오.”

드워프 그림리가 쇠망치를 바닥에 쿵 내려놓으며 수염을 쓸어내렸다.

“어떤 놈이든 내 망치 앞에 걸리면 대가리가 모루에 달군 쇳덩이 꼴이 날 게다.”

곡예사 로비냐드는 가볍게 바위 난간 위로 뛰어올라 안개 너머를 살피며 쓴웃음을 지었다.

“다들 긴장 풀어요. 줄타기에서 발이 얼어붙으면 낭떠러지로 떨어지는 법이니까요.”

그날 밤, 절벽 정상에 자리 잡은 고대 타이탄의 폐신전 돌기둥 사이로 두 개의 불길한 그림자가 소리 없이 스며들었다. 한때 바람섬의 위대한 현자 에올루스의 문하에서 비전 마법을 전수받았던 파문당한 제자들, 메두사 고르고와 결정술사 벨페고르였다. 두 사람은 스승의 서재에서 절대적인 무공 비급인 `나인섀도우 코덱스`의 암흑 편을 훔쳐 달아난 뒤, 무고한 여행자들의 생명력을 강탈하여 금지된 마공을 완성하려 광기를 번뜩이고 있었다. 고르고는 두 눈을 검은 비단으로 가린 채 미세한 음파의 떨림으로 사물을 감지했고, 벨페고르는 온몸의 피부를 뚫고 솟아난 검은 흑요석 결정 갑옷을 번뜩이고 있었다.

가웨인이 묵직한 쇠지팡이 끝으로 신전 바닥의 판석을 둔탁하게 세 번 두드렸다.

탕. 탕. 탕.

그러나 지하 바위틈을 타고 되돌아온 공명음은 일곱 개가 아닌 여덟 개였다. 지팡이를 쥔 가웨인의 핏줄 선 손등이 굳어졌다.

“천장이다! 흩어져라!”

가웨인의 일갈과 동시에 거대한 폭음이 터졌다. 천장의 대들보를 부수며 낙하한 벨페고르가 흑요석 주먹으로 신전 바닥을 내리찍었다. 돌바닥이 거미줄처럼 갈라지며 파편이 사방으로 튀었다. 그림리가 본능적으로 달려들어 육중한 쇠망치로 벨페고르의 팔꿈치를 받아쳐 궤도를 꺾었고, 에일라의 쇠뇌 시위가 연거푸 튕기며 안개를 가르고 세 발의 화살을 쏘아 보냈다.

그러나 눈이 먼 메두사 고르고는 화살이 공기를 가르는 미세한 마찰열을 미리 감지하고 유연하게 허리를 꺾어 피했다.

“어리석은 날파리들이 제 발로 무덤을 찾아왔구나.”

고르고의 가느다란 손톱 끝에서 발사된 칠흑의 마나 실가닥들이 허공을 수놓더니, 신전 벽면에 드리워진 로비냐드의 그림자를 바위에 단단히 꿰매 버렸다. 그림자가 묶이자 로비냐드의 육신 또한 보이지 않는 족쇄에 묶인 듯 제자리에 굳어 버렸다.

일곱 사람은 각자의 영역에서 백전노장의 기량을 지녔으나, 함께 목숨을 건 합을 맞춰 본 경험이 턱없이 부족했다. 카제가 던진 비검은 론돌이 휘두른 거친 물살에 휩쓸려 궤도를 잃었고, 그림리가 일으킨 맹렬한 망치바람은 에일라의 조준선에 모래먼지를 퍼부었다.

“크하하하! 오합지졸 사냥꾼 놈들! 너희의 심장은 나의 흑요석 갑옷을 완성할 훌륭한 제물이 될 것이다!”

벨페고르가 광기 어린 포효를 내지르며 그림리의 어깨를 흑요석 철권으로 강타했다. 그림리가 피를 토하며 바닥을 굴렀다. 설상가상으로 고르고의 손끝에서 퍼져 나온 보랏빛 독안개가 폐신전 내부를 가득 채우자, 일곱 추적자들은 하나둘 무릎을 꺾으며 쓰러져 갔다.

“숨을 참아라! 이 독안개는 폐부를 태워 마나를 말려 버린다!”

엘리아나가 외치며 정화의 약초 가루를 뿌렸으나 역부족이었다. 절체절명의 순간, 가장 먼저 결단을 내린 이는 평소 말수가 가장 적었던 곡예사 로비냐드였다.

“동료들을 건드리지 마라, 괴물 놈!”

로비냐드는 품속에서 예리한 비수를 꺼내 바닥돌을 후벼 파며 자신의 그림자를 꿰맨 흑마술 실을 억지로 찢어 냈다. 그림자가 찢겨 나가며 살갗이 타들어 가는 극심한 영혼의 고통 속에서도, 로비냐드는 번개처럼 몸을 날려 벨페고르의 목덜미에 매달렸다.

푸욱!

벨페고르의 날카로운 흑요석 결정 가시가 로비냐드의 복부를 무자비하게 꿰뚫었다. 그러나 피를 쏟아내면서도 로비냐드는 두 팔과 두 다리로 괴물의 관절을 부둥켜안은 채 놓지 않았다.

“지금이야... 에일라, 그림리... 이번에는 서로의 숨소리를 듣고 움직여라!”

로비냐드의 마지막 피 끓는 절규가 울려 퍼졌다.

가웨인의 지팡이가 바닥을 한 번 강하게 내리쳤다. 그 맑은 울림을 나침반 삼아 에일라의 쇠뇌가 세 걸음 왼쪽의 허공으로 화살을 쏘았다. 카제가 허공으로 던진 칼날이 화살 깃을 쳐서 궤적을 굴절시켰고, 론돌의 급류 룬이 가속을 더해 벨페고르의 관절 틈새를 뚫었다. 이어 일어선 그림리의 전력 망치질이 흑요석 흉갑의 핵을 산산조각 냈다. 그 파편 틈으로 엘리아나가 던진 성수가 스며들자, 벨페고르는 끔찍한 비명을 지르며 절벽 아래 천 길 낭떠러지로 추락했다.

메두사 고르고는 파트너의 비참한 최후에 이를 갈며 독안개 속으로 모습을 감췄다.

“일곱 추적자 놈들... 오늘의 피는 너희의 목숨으로 반드시 되갚아 주마!”

안개가 걷힌 신전 바닥에서, 로비냐드는 피 묻은 손으로 동료들의 얼굴을 하나씩 어루만졌다. 그의 손끝에서 떨어진 핏방울이 차가운 판석 위에 붉은 꽃송이처럼 맺혔다.

“형제들이여... 울지 마라. 내 목숨 하나로 괴물을 꺾었으니 남는 장사 아닌가.”

로비냐드가 희미하게 웃으며 가쁜 기침을 뱉었다. 그의 허리춤에서 흔들리던 은빛 방울이 가냘프게 짤랑거렸다.

“북쪽으로 가라... 아이를 찾아야 해... 알렉산다르의 맹세를...”

“로비냐드! 눈을 감지 마라! 내가 상처를 꿰맬 수 있다!”

엘리아나가 떨리는 손으로 약초를 짓이기며 비명을 질렀으나, 로비냐드는 조용히 미소를 머금은 채 차가운 절벽 바람 속에서 숨을 거두었다.

여섯 스승은 피눈물을 흘리며 동료의 유해를 바위 봉우리 위에 정성껏 묻었다. 그림리는 자신의 육중한 쇠망치 모서리에 로비냐드가 늘 지니고 다니던 은빛 방울을 단단한 쇠줄로 묶어 고정했다.

“이 방울 소리가 울릴 때마다 네가 우리 곁에서 줄타기를 하고 있다고 믿겠다. 로비냐드... 네 몫까지 다해서 그 아이를 천하제일의 의로운 방패로 길러내겠다.”

그림리가 거친 손으로 돌무덤을 내리치며 피 섞인 맹세를 토해냈다. 가웨인이 지팡이를 짚으며 무거운 침묵을 깼다.

“우리는 이제 일곱이 아니라 여섯이다. 그러나 로비냐드의 영혼은 영원히 우리 호흡 속에 살아 숨 쉴 것이다. 가자, 북쪽 황야로!”

비극적인 피의 대가를 치른 뒤에야, 여섯 사냥꾼은 진정으로 하나의 심장으로 고동치는 불패의 결속을 얻었다. 절벽 너머로 부는 북풍 속에서, 그들의 눈빛에는 슬픔을 넘어선 서릿발 같은 결의가 깃들어 있었다."""

EP03_EN = """SNSHero Novel
Episode 03: Blood on the Mist Cliff

Crossing the jagged mountain ranges toward the northern borderlands, the Seven Pursuers found themselves disoriented within the eerie silence of Mistfall Cliff. Colossal basalt monoliths, carved by ancient titans millenia ago, loomed through the vapors like primeval tombstones. Though it was high noon, icy mist rising from the bottomless abyss swallowed their horses' hooves before thickening into an impenetrable shroud that reached their shoulders. Across the dark volcanic rock faces, sinister spirals of dried blood trailed like claw marks.

Eliana dismounted, uncorking a glass vial of azure reagent to sprinkle upon the stone. With a sharp hiss, silvery powder billowed into the air.

"A forbidden strain of dark necromancy," Eliana warned, her voice trembling in the damp mountain chill. "It drains the living vital mana from travelers, petrifying their flesh into crystallized corpses."

Her grim diagnosis vanished into the swirling fog. The mounts snorted anxiously, backing toward the narrow trail. Loose shale clattered down into the void, echoing faintly against the rock walls below.

"Steady, everyone. Draw your steel," Gawain commanded softly, lifting his heavy iron staff. "This mist is born of malice, not mountain weather."

Kaze flicked three silver coins into the air, listening to their metallic ring as they dropped into his palm.

"The wind twists inward toward a single vortex," Kaze muttered. "I smell rotting blood instead of coin."

Rondol gripped the wave-carved staff upon his back, shaking his head.

"This is no river vapor rising from the lowlands. It is a barrier woven from the blood and malice of tormented souls."

Grimli planted his maul upon the flagstones, smoothing his braided beard.

"Any devil stepping before my hammer will see his skull forged into an anvil."

Robinyard leaped lightly atop the parapet, gazing through the vapors with a wry grin.

"Ease your shoulders, comrades. In tightrope dancing, freezing in fear is what sends you over the brink."

That very night, within the ruined titan shrine perched atop the precipice, two ominous silhouettes emerged silently between the broken colonnades. They were Medusa Gorgo and the crystal-shaper Belphegor—banished apprentices of the wind sage Aeolus from the distant Wind Isle. Having stolen the dark codex of Nine Shadows, they sought to harvest wandering warriors to complete their forbidden techniques. Gorgo, her blind eyes shrouded in black silk, perceived the world through minute acoustic vibrations, while Belphegor was encased from head to heel in jagged obsidian armor that sprouted directly from his flesh.

Gawain struck the flagstones thrice with the heel of his iron staff.

Clang. Clang. Clang.

The reverberation returning through the granite bedrock yielded not seven footsteps, but eight. The veins upon Gawain's knuckles tautened like bowstrings.

"Above us! Scatter!"

A deafening roar split the night. Shattering the ceiling rafters, Belphegor slammed his obsidian fist into the floor, fracturing the flagstones into radial spiderwebs. Grimli surged forward, his heavy maul deflecting Belphegor's crushing blow at the cost of numbing both his arms, while Aila loosed three rapid quarrels into the swirling mist.

Yet the blind Gorgo heard the friction of the feathers whistling through the air and arched her spine with inhuman grace to dodge each shaft.

"Insolent insects marching willfully into their own tomb!"

Black filaments of concentrated shadow mana erupted from Gorgo's talons, impaling Robinyard's shadow upon the stone wall behind him. With his shadow anchored, Robinyard's physical body locked in place as if bound in invisible iron chains.

Though each of the seven pursuers was a master of their craft, they had never fought together under the pressure of mortal peril. Kaze's throwing daggers were swept aside by Rondol's unruly water currents, and the gale from Grimli's hammer threw stone dust directly across Aila's line of sight.

"Fools! Your hearts shall nourish the completion of my obsidian carapace!" Belphegor bellowed, striking Grimli across the chest and sending the dwarf skidding across the stones, vomiting blood. To worsen their plight, Gorgo unleashed a cloud of purple venom that brought the hunters to their knees, gasping for breath.

"Hold your breath! The poison burns the lungs and corrodes mana!" Eliana shouted, casting purifying herbs into the wind, but the toxic haze thickened relentless.

It was Robinyard, the quietest of the band, who seized the decisive moment.

"Keep your filthy claws off my kin!"

Drawing a serrated skinning knife, Robinyard sliced through his own flesh and gouged the enchanted flagstone beneath him, severing the necrotic threads that pinned his shadow. Though the agony of tearing his spiritual tether burned like molten lead, the acrobat launched himself through the air, wrapping both arms and legs around Belphegor's neck.

Thwack!

Jagged crystal spikes erupted from Belphegor's shoulders, piercing clean through Robinyard's torso. Yet even as lifeblood poured from his lips, Robinyard locked his limbs in an unbreakable vise around the monster's joints.

"Now... Aila, Grimli... listen to each other's breath!"

Robinyard's desperate cry tore through the mist.

Gawain's iron staff struck the stone with a clear, bell-like chime. Guided by that acoustic beacon, Aila fired three paces to the left. Kaze's deflection blade clipped the bolt mid-flight to bend its arc, Rondol's rushing tide doubled its velocity, and the projectile drove straight into the vulnerable joint beneath Belphegor's jaw. Roaring with renewed fury, Grimli brought his maul down in a crushing overhead blow that obliterated the crystal core. As Eliana splashed consecrated holy water into the fracture, Belphegor shrieked in agony and plummeted over the cliffside into the abyss.

Gorgo hissed in fury as her partner vanished into the fog.

"Seven Pursuers... you shall repay this blood a thousandfold!" she snarled, dissolving into the swirling vapors.

On the mist-soaked stones, Robinyard touched the faces of his weeping companions one last time.

"Brothers and sisters... do not weep. Trading one rogue life to fell that abomination is a bargain well struck."

Robinyard whispered, coughing faintly as the silver bell at his hip tinkled softly in the gale.

"Go north... find the boy... keep the vow to Aleksandar..."

"Robinyard! Stay awake! I can close the wound!" Eliana cried, but the brave acrobat smiled gently and closed his eyes forever beneath the freezing wind.

With heavy hearts and tear-streaked faces, the six surviving masters interred their brother upon the rocky summit. Grimli bound Robinyard's silver bell firmly to the crown of his heavy warhammer with hardened steel wire.

"Every time this bell chimes in battle, I shall know you are dancing beside us. Robinyard... we shall forge that boy into the realm's greatest shield."

"We are six now, but Robinyard walks forever within our breath," Gawain said softly. "Forward, to the northern wastes!"

Only through this bitter sacrifice had the hunters forged an unbreakable bond of mutual trust, stepping forward as true guardians of the realm."""

# -----------------------------------------------------------------------------
# EPISODE 04: 황야에서 자란 아이 / The Child Raised in the Wastes
# -----------------------------------------------------------------------------
EP04_KO = """# 눈히어로 4화 - 황야에서 자란 아이

> 원문 범위: 제7장-제8장

가혹한 혹한의 계절이 여섯 번이나 지나갔다. 엘윈은 남편 알렉산다르가 목숨으로 지켜낸 아들 카단을 품에 안고, 대륙 북방의 거친 유목 부족들이 모여 사는 와일드랜드의 가죽 천막 사이에서 살아남았다. 영구동토의 차가운 흙바닥 위에 세워진 둥근 천막촌은 밤마다 사나운 늑대 무리의 울음소리와 매서운 북풍으로 뒤흔들렸다. 설원의 혹독한 칼바람을 맞으며 자란 아이는 또래보다 뼈대가 굵고 튼튼했으나, 말문이 더디게 트였고 열 살이 가까워지도록 손끝에 마나 불꽃 한 줌조차 제대로 피워 올리지 못했다.

유목민의 아이들이 다섯 살만 되면 말을 타고 바람 마나를 조종하여 활을 쏠 때, 어린 카단은 묵묵히 무거운 무쇠 양동이로 얼음물을 긷고, 눈보라에 무너진 가축 울타리의 말뚝을 거친 돌망치로 다시 박았다. 손바닥에는 어린 나이에 어울리지 않는 두꺼운 굳은살이 박여 있었고, 귀 끝과 뺨은 늘 얼어터져 붉게 물들어 있었다.

부족 사람들은 과묵하고 우직한 아이를 카단이라 불렀다. 아버지 알렉산다르가 엘윈의 품속에 남긴 마지막 유언, `어떤 시련에도 끝까지 버텨 내는 단단한 방패`라는 이름 그대로였다. 카단은 화려한 칭찬이나 부족 아이들의 놀림에 마음을 쓰지 않았고, 하루의 고된 노동이 끝난 뒤 어머니가 건네주는 따뜻한 보리빵과 말린 양고기 한 조각을 세상에서 가장 귀한 보물로 여겼다.

“어머니, 오늘 울타리를 고치다가 눈더미에 갇혀 얼어 죽어가는 새끼 늑대를 보았어요.”

어느 살얼음 끼는 저녁, 손끝이 튼 카단이 화로가에서 조용히 말했다.

“그래서 어찌 하였느냐?”

엘윈이 낡은 외투를 깁던 바늘을 멈추고 다정하게 물었다.

“아버지의 은빛 단검으로 단단한 얼음 덩어리를 파내어 따뜻한 마구간 구석에 눕혀 주었어요. 살아날 수 있을까요?”

카단이 가죽 외투 안쪽에서 소중히 꺼낸 단검을 보여주었다. 백은의 칼날에 서린 아케 성기사단의 고대 룬이 장작불 빛을 받아 푸르스름하게 숨 쉬듯 반짝였다. 엘윈은 아들의 거칠고 투박한 손을 두 손으로 감싸 쥐었다.

“착하구나, 카단. 생명을 귀하게 여기는 마음이야말로 그 어떤 마법보다 위대한 힘이란다. 네 아버지 알렉산다르 역시 무기를 휘두를 때마다 지켜야 할 생명의 온기를 먼저 생각하셨단다.”

“저도 언젠가는 아버지처럼 등 뒤의 사람들을 지키는 튼튼한 방패가 될 수 있을까요?”

“그럼, 카단. 굳센 나무는 가장 혹독한 칼바람 속에서 가장 깊은 뿌리를 내리는 법이란다.”

어느 살을 에는 듯한 겨울날, 와일드랜드 유목 부족 연맹을 이끄는 정복왕 펜릴의 어린 아들 길가메시가 적대 부족 암살자들의 덫에 걸려 얼어붙은 협곡 한복판에서 포위당하는 사건이 일어났다. 암살자들은 얼음 화살을 쏘아 길가메시의 호위병들을 쓰러뜨렸고, 피를 흘리며 말에서 떨어진 길가메시는 절체절명의 위기에 몰렸다.

그 광경을 가축 떼를 돌보던 어린 카단이 목격했다. 카단의 손에는 번듯한 활이나 쇠칼 한 자루조차 쥐어져 있지 않았다. 그러나 아이는 한 치의 망설임도 없이 눈보라 치는 빙판 위로 몸을 날렸다.

“이곳에서 사람을 해치지 마라!”

카단은 얼어붙은 진흙과 얼음덩어리를 양손 가득 집어던져 사냥개처럼 달려드는 적마들의 눈가를 가렸다. 말이 앞다리를 들고 요동치는 틈을 타, 카단은 쓰러져 신음하는 길가메시를 번쩍 들어 올려 자신의 어린 등에 업었다.

“야! 너 미쳤어? 날 내려놓고 도망쳐! 저놈들은 살인귀들이야!”

길가메시가 비명을 질렀으나 카단은 대답 대신 이를 악물고 얼어붙은 강바닥을 향해 내달렸다. 쩌적, 쩌저적! 살얼음이 쩍쩍 갈라지는 소리가 귓전을 때렸다. 무게가 집중되면 두 사람 모두 얼음장 밑의 흑암 속으로 빠져 죽을 판이었다. 카단은 아버지의 피에서 물려받은 본능적인 무게 중심 감각으로 몸을 낮추어 엎드린 채, 자신의 넓은 등을 얼음판에 밀착시키며 썰매처럼 빙판을 미끄러져 건넜다.

“활을 쏴라! 저 촌뜨기 놈까지 모조리 강물에 수장시켜라!”

뒤쫓아온 암살자들의 쇠뇌 화살이 얼음판을 강타했다. 한 발의 화살이 카단의 허벅지를 깊게 스치고 지나갔다. 살점이 찢어지는 끔찍한 고통 속에서도 카단은 길가메시의 팔을 놓지 않았다. 붉은 피가 얼음 위에 길고 선명한 궤적을 그렸다.

“조금만 참아라! 저 언덕 너머에 늑대 기병대의 망루가 있다!”

카단이 숨을 헐떡이며 소리쳤다.

강 건너편 절벽 위에서 달려온 정복왕 펜릴의 늑대 기병대가 암살자들을 모조리 포위해 섬멸했을 때, 카단은 이미 피투성이가 된 채 얼음 둑에 길가메시를 눕혀 놓고 있었다.

펜릴이 거대한 은빛 늑대 가죽 망토를 휘날리며 카단의 앞에 말을 멈추어 섰다.

“어린놈이 어찌 목숨을 버릴 각오로 내 아들을 살려냈느냐? 보물이나 황금을 원하느냐?”

카단은 상처를 감싸 쥔 채, 호흡을 고르며 고개를 가로저었다.

“누구의 아들이든, 눈앞에서 피를 흘리는 아이를 버려두고 도망치는 것은 부끄러운 짓이라 어머니께 배웠습니다.”

펜릴은 카단의 흔들림 없는 맑은 눈동자를 내려다보며 호탕하게 웃음을 터뜨렸다.

“좋은 눈빛이다. 사내다운 배짱을 지녔구나! 오늘부터 너를 내 막사의 손님이자 길가메시의 전우로 대우하겠다.”

길가메시 역시 가슴의 청동 늑대 목걸이를 벗어 카단의 손에 쥐여 주며 눈물을 글썽였다.

“내 목숨은 네 것이다, 카단. 앞으로 너를 형제라 부르겠다.”

그날 밤, 와일드랜드의 불타는 장작더미 너머로 누더기를 걸친 여섯 명의 낯선 나그네들이 천막촌 안으로 들어섰다. 험준한 산맥을 넘어 육 년 만에 마침내 북방에 도달한 여섯 스승—가웨인, 그림리, 에일라, 엘리아나, 카제, 론돌이었다.

그들은 천막 뒤편에서 어머니 엘윈의 상처를 치료해 주던 카단의 품에서 익숙한 공명음을 감지했다. 카단의 허리춤에 가죽 끈으로 동여매어진 한 자루 은빛 단검이었다. 손잡이 안쪽에 새겨진 아케 성기사단의 룬이, 가웨인의 지팡이와 그림리의 쇠망치 끝에 매달린 은빛 방울을 향해 백은의 빛을 번쩍이며 울부짖고 있었다.

“찾았다... 드디어 찾았어. 알렉산다르의 아들을!”

그림리가 쇠망치를 바닥에 떨어뜨리며 굵은 눈물을 쏟아냈다. 망치 끝의 방울이 맑게 울렸다. 에일라는 눈밭 위에 무릎을 꿇고 어린 카단의 어깨를 부둥켜안았다.

“살아 있었구나, 아이야... 알렉산다르의 부러진 검과 이 은빛 단검의 주인을 찾아, 우리가 대륙의 절반을 가로질러 왔단다.”

엘윈은 천막 문을 열고 나와 여섯 스승의 얼굴을 바라보았다. 남편의 유품인 단검과 성기사단의 문장을 알아본 그녀의 눈에서 참아왔던 뜨거운 눈물이 쏟아져 내렸다.

“알렉산다르의 약속을 잊지 않고 와 주셨군요...”

가웨인이 쇠지팡이를 짚으며 정중히 예를 표했다.

“부인, 우리는 로비냐드의 목숨과 바꾼 맹세를 지키러 왔습니다. 비록 카단이 말과 마나의 재능이 더딜지라도, 우리는 이 아이를 대륙 최고의 의로운 방패이자 영웅으로 단련시킬 것입니다.”

그림리 역시 주먹을 불끈 쥐며 말했다.

“내 망치와 뼈를 다 갈아서라도 알렉산다르 형제의 이름을 부끄럽지 않게 만들겠소!”

카제 역시 은화를 굴리며 미소를 지었다.

“이 거친 손을 보니 대장장이보다 단단하군. 아주 마음에 들어.”

그 밤, 모닥불의 따스한 온기 아래에서 알렉산다르의 영혼과 일곱 추적자의 맹세가 마침내 하나로 이어졌다. 혹한의 땅에서 자라난 거친 묘목이, 거대한 폭풍을 견뎌 낼 거목으로 뿌리를 내리기 시작한 순간이었다."""

EP04_EN = """SNSHero Novel
Episode 04: The Child Raised in the Wastes

Six cruel winters passed across the northern steppe. Holding fast to her son Kadan—the boy her husband Aleksandar had died to preserve—Elwin managed to survive amidst the smoky leather yurts of the Wildlands, where fierce nomad clans grazed their shaggy herds. Set upon the frozen loam of the permafrost, the circular encampment trembled nightly beneath the howling of tundra wolves and the shrieking arctic gales. Reared in the teeth of arctic blizzards, the boy grew broad-boned and sturdy, yet his speech developed slowly and he failed to kindle even a spark of elemental mana by his tenth year.

While other nomad youths mounted war-ponies at age five and learned to bend arrows with wind currents, young Kadan quietly hauled iron buckets of glacial water and hammered fallen stockade poles back into the frozen soil with heavy river stones. His small hands bore thick, calloused ridges, and his cheeks were perpetually chapped by frostbite.

The clan elders called him Kadan, honoring the name Aleksandar had whispered before the bridge collapsed: the steadfast shield that endures against every tempest. Kadan cared little for boastful words or martial vanity, cherishing instead the coarse barley cakes and dried mutton his mother placed in his rough hands after a long day of toil.

"Mother, while repairing the fence today, I found a wolf pup frozen in the drifts," Kadan spoke softly by the hearth fire one evening.

"And what did you do, my child?" Elwin asked gently, pausing her mending.

"I used father's silver dagger to carve away the ice and carried it into the barn corner. Will it live?"

Kadan drew forth the treasured heirloom from within his tunic. The ancient rune of the holy order engraved along the fuller glimmered softly against the flickering flames. Elwin clasped her son's weathered fingers in both her hands.

"You did well, Kadan. A heart that honors life possesses greater power than any spell. Your father Aleksandar always remembered the warmth of life he swore to protect before ever drawing his blades."

"Will I ever become a steadfast shield like father, protecting those who stand behind me?"

"Of course, my child. The sturdiest trees strike their deepest roots in the harshest northern gales."

One bitterly frigid dawn, Gilgamesh, the young heir of Conqueror King Fenrir who ruled the confederation of northern clans, was ambushed in a frozen gorge by rival raiders. Enchanted frost arrows felled Gilgamesh's escort, leaving the bleeding youth thrown from his horse and surrounded by blades.

Watching from a nearby pasture, Kadan carried neither bow nor iron knife. Yet without a heartbeat's hesitation, the boy vaulted down the icy embankment into the fray.

"Lay no hand upon him!"

Scooping up handfuls of frozen shale and ice chunks, Kadan hurled them with pinpoint force into the eyes of the charging steeds. As the warhorses reared in confusion, Kadan seized the groaning Gilgamesh and threw the boy onto his own back.

"Are you insane? Leave me and run! They will slaughter you!" Gilgamesh screamed through bloodied teeth.

Kadan answered only by clenching his jaw, bolting toward the center of the frozen river. Crrrk! Crack! The ominous spiderwebbing of brittle ice shrieked beneath their weight. If their mass remained concentrated, both boys would plunge into the black, freezing torrent below. Trusting an instinctive balance inherited from his father's blood, Kadan flattened his posture, sliding across the slick surface like an otter across ice to distribute their weight.

"Loose the quarrels! Drown the savage dog and the prince together!" the pursuing leader roared.

A volley of iron crossbow bolts peppered the sheet. One bolt grazed Kadan's thigh, tearing flesh and spilling hot blood onto the frost. Despite the agonizing burn, Kadan never released his grip on Gilgamesh's arms. A crimson line traced their path across the white riverbed.

"Hold fast! The wolfguard watchtower lies just beyond the ridge!" Kadan gasped through ragged breaths.

By the time King Fenrir's wolfguard crested the ridge to encircle and annihilate the ambushers, Kadan had dragged Gilgamesh safely onto the southern bank before collapsing in exhaustion.

Fenrir reined his silver-maned war-steed before the bleeding boy, his eyes flashing beneath a wolfskin cowl.

"Why risk your young life for my son, peasant boy? Do you covet gold, or land within my horde?"

Nursing his torn leg, Kadan shook his head with quiet sincerity.

"My mother taught me that to abandon a bleeding child before one's eyes is a cowardice no man should bear."

Fenrir studied the unclouded clarity in Kadan's eyes and threw his head back in thunderous laughter.

"A lion's heart! From this sunrise forth, you are a guest of my grand pavilion and a shield-brother to Gilgamesh."

Gilgamesh removed the bronze wolf talisman from his neck, pressing it into Kadan's palm with tearful gratitude.

"My life is yours, Kadan. Henceforth, you are my brother."

That night, six dust-caked travelers in threadbare cloaks rode into the encampment. Having crossed savage peaks over six agonizing years, the surviving masters—Gawain, Grimli, Aila, Eliana, Kaze, and Rondol—had finally reached the northern plains.

Near the fringe of the horse lines, they felt a resonant hum vibrating through their souls. At Kadan's hip hung a slender silver dagger bound in leather thongs. Along the fuller, the ancient rune of the Arcane Holy Order flared with brilliant white-silver radiance, chiming in unison with Gawain's staff and the silver bell upon Grimli's hammer.

"We found him... by the heavens, we have found Aleksandar's boy!"

Grimli let his maul strike the earth as thick tears cut through the soot on his beard. The bell tinkled clearly. Aila dropped to her knees in the drift, pulling the bewildered Kadan into a fierce embrace.

"You live, little one... To return your father's broken legacy and this silver dagger, we have journeyed across half the continent."

Elwin emerged from the yurt flap, her eyes widening as she recognized the Holy Order crest and the companions of Hercul. Tears she had held for six winters poured freely down her weathered cheeks.

"You remembered Aleksandar's sacrifice..."

Gawain bowed his head with the solemn dignity of a lifelong tracker.

"Lady Elwin, we carry the oath paid in Robinyard's blood. Though the boy's tongue be slow and his mana dormant, we shall temper him into an unbreakable shield that the world shall revere."

Grimli slammed his fist against his breastplate.

"I will grind my bones and my hammer to dust before Aleksandar's name is ever tarnished!"

Kaze flicked a silver coin, admiring Kadan's calloused hands.

"Hands tougher than an iron anvil. I like him already."

Beneath the blazing yurt fires, Aleksandar's legacy and the Oath of the Seven Pursuers intertwined at last. In the cradle of the northern gale, the young sapling had taken root, ready to grow into a fortress against the coming dark."""

# -----------------------------------------------------------------------------
# EPISODE 05: 폭우 속의 유령 / Phantom in the Downpour
# -----------------------------------------------------------------------------
EP05_KO = """# 눈히어로 5화 - 폭우 속의 유령

> 원문 범위: 제9장-제10장

황야의 짧은 여름이 저물고, 대지를 집어삼킬 듯한 흉포한 폭우가 고원 지대를 강타했다. 천둥이 번쩍일 때마다 거대한 암흑의 협곡이 푸른빛으로 물들었고, 여섯 스승과 열두 살이 된 소년 카단은 비바람을 피해 절벽 기슭의 깊은 석회암 종유석 동굴 안으로 몸을 피했다. 수만 년의 세월 동안 지하수가 깎아 만든 동굴 내부는 거대한 지하 신전처럼 서늘했고, 천장에 매달린 고드름 모양의 종유석마다 푸른 이끼가 돋아나 있었다.

동굴 천장에서 떨어지는 불규칙한 물방울 소리와 세찬 빗소리가 뒤섞여 귓전을 먹먹하게 만들던 바로 그 순간, 동굴 안쪽의 깊은 어둠 속에서 차가운 쇠사슬이 뱀처럼 바닥을 긁는 음산한 소리가 울려 퍼졌다.

스승들이 마른 장작에 불을 지피려는 찰나, 천장에 새겨져 있던 고대 은빛 룬이 갑자기 뒤집히며 칠흑 같은 암흑 안개가 동굴 안을 가득 메웠다. 미스트폴 절벽에서 로비냐드를 죽이고 도망쳤던 메두사 고르고였다. 칠흑의 비단으로 두 눈을 가린 그녀의 손톱 끝에는 보랏빛 맹독이 서릿발처럼 번뜩이고 있었다.

“육 년 동안 너희 늙은 사냥개들을 찾아 헤맸다. 그리고 마침내 알렉산다르의 씨앗까지 한자리에 모여 있구나.”

고르고의 서늘한 비웃음이 동굴 벽 전체에서 울려 나왔다. 그녀는 눈이 먼 대신 사방에 흩뿌려진 빗방울의 파동과 공기의 진동을 타고 유령처럼 공간을 넘나들었다. 번개가 번쩍이는 찰나, 고르고의 날카로운 독 손톱이 카단의 목덜미를 베어 내기 위해 허공을 갈랐다.

“카단, 엎드려라!”

에일라가 외치며 쇠뇌를 쏘았으나 화살은 텅 빈 잔상만을 꿰뚫었을 뿐이었다. 고르고의 몸체는 이미 카단의 등 뒤 그림자 속으로 미끄러져 들어가 있었다. 공포에 질린 카단이 단검을 쥐고 몸을 돌리려 했을 때, 맹인 추적자 가웨인의 차분하고 단단한 목소리가 귓전을 때렸다.

“눈을 감아라, 카단! 저 마녀는 네가 바라보는 시야 안에 존재하지 않는다!”

가웨인의 쇠지팡이가 동굴 바닥을 치며 투명한 음파 진동을 쏘아 올렸다.

“시각은 거짓을 보여주지만, 네 피부를 때리는 빗방울과 공기의 흐름은 결코 거짓말을 하지 않는다. 바람섬의 에올루스 경에게서 배운 음파의 길을 기억하라. 저 여자의 발밑에는 바람이 머물지 못한다!”

카단은 떨리는 숨을 들이켜며 지체 없이 두 눈을 질끈 감았다.

시야가 암흑에 잠기자, 믿을 수 없는 세계가 소년의 감각 속으로 쏟아져 들어왔다. 천장에서 떨어지는 불규칙한 물방울 소리, 그림리가 거칠게 헐떡이는 가슴의 고동, 동굴 입구로 들이치는 빗줄기의 각도, 그리고—오직 한 곳, 빗방울이 바닥에 닿기 직전 허공에서 궤적을 비틀며 허물어지는 미세한 진공의 공간!

‘저기다! 저곳에 바람이 비어 있다!’

카단은 눈을 감은 채, 본능적으로 허리춤의 은빛 단검을 쥐고 아무것도 보이지 않는 허공의 빈자리를 향해 전력으로 몸을 회전시켰다.

챙그랑!

은빛 단검의 칼날이 허공 속에서 실체화되던 고르고의 칠흑 사슬을 정면으로 후려쳤다. 맑은 파열음과 함께 불꽃이 튀며 고르고의 비단 소매가 찢겨 나갔다.

“어린놈이... 보이지도 않는 칼길을 읽었단 말인가!”

고르고가 경악하며 뒤로 물러섰다. 스승들은 그 찰나의 틈을 놓치지 않았다. 그림리가 도약하여 쇠망치로 동굴 입구의 낙석을 깨뜨려 퇴로를 막았다. 망치 끝에 달린 은빛 방울이 성난 맹수처럼 요란하게 울렸다.

“이 괴물 년! 로비냐드의 원수를 여기서 갚아주마!”

그림리의 포효와 함께 론돌이 지하수를 끌어올려 고르고를 감싼 암흑 안개를 씻어냈다. 에일라의 독화살 세 발이 고르고의 어깨와 허벅지를 연달아 꿰뚫었다. 카제가 던진 비검 두 자루가 고르고의 마나 혈도를 정확히 틀어막았다.

피를 흘리며 동굴 벽에 몰린 고르고는 품속에서 보랏빛 연막탄을 터뜨리며 몸을 뒤틀었다.

“크큭... 제법이구나, 멍청한 사냥꾼 놈들. 하지만 기뻐하긴 이르다. 너희가 이 북방 구석에 처박혀 있는 동안, 남쪽 붉은 유리 궁정에선 발리안의 아들이 루시안 경의 충성스러운 살인귀로 자라나고 있으니! 그리고 바람섬의 군주 에올루스의 외동딸 실리아 역시 대륙의 질서를 뒤흔들 폭풍으로 자라나고 있다!”

“닥쳐라, 마녀야!”

그림리가 망치를 내리쳤으나, 고르고는 절벽 아래로 몸을 던져 거친 강물 속으로 유령처럼 사라졌다.

폭우가 잦아들 무렵, 동굴 안에는 무거운 침묵이 흘렀다. 카단은 손바닥에 밴 땀을 닦아내며 가웨인을 바라보았다.

“스승님... 방금 고르고가 말한 바람섬과 실리아라는 이름은 대체 누구입니까?”

가웨인은 쇠지팡이를 짚으며 젖은 대지의 소리를 들었다.

“바람섬은 동쪽 대해에 떠 있는 신비로운 고립의 영역이다. 그곳의 군주 에올루스는 대륙에서 가장 오만하고도 지고한 바람의 현자이지. 그에게는 눈처럼 영민하고 바람처럼 자유로운 외동딸 실리아가 있다고 들었다. 만약 섀도우렐름의 마수가 그곳까지 뻗치고 있다면, 장차 대륙 전체가 거대한 전화에 휩싸일 게다.”

카단은 멍하니 자신의 손바닥을 내려다보았다. 방금 전 단검을 쥐었던 손끝이 미세하게 떨리고 있었다.

“그 아이도... 저처럼 누군가의 표적이 되어 위험에 처해 있는 겁니까?”

에일라가 카단의 젖은 머리를 쓸어 넘기며 다정하게 속삭였다.

“그렇다면 네가 더 강해져야 한단다, 카단. 남을 지키는 힘은 그저 기다린다고 주어지는 것이 아니니까. 네 아버지가 남긴 은빛 단검의 진실을 증명하려면 말이다.”

그림리 역시 쇠망치를 어깨에 메며 씩 웃었다.

“그래, 꼬마야. 오늘 눈을 감고 칼을 쳐낸 솜씨는 제법이었다. 내일부터는 바위 깨기 훈련을 두 배로 늘려주마!”

엘리아나는 부드러운 산이끼 고약으로 카단의 긁힌 팔을 정성껏 싸매 주며 말했다.

“상처를 두려워하지 마라. 상처가 아문 자리는 더 단단한 가죽이 되는 법이란다.”

카단은 부러진 동굴 입구 너머로 먹구름이 걷히며 드러난 새벽하늘의 샛별을 올려다보았다. 눈을 감고 듣는 법을 깨달은 소년의 가슴속에서, 머나먼 대륙의 운명과 실리아라는 신비로운 이름이 희미한 은빛 파문처럼 퍼져 나가고 있었다."""

EP05_EN = """SNSHero Novel
Episode 05: Phantom in the Downpour

As the brief summer of the northern wastes receded, a ferocious tempest struck the plateau, threatening to drown the world in torrential fury. Jagged lightning flared across the canyons, painting the churning clouds in ethereal violet, driving the six masters and twelve-year-old Kadan into a subterranean limestone cavern tucked beneath the bluffs. Hollowed over eons by subterranean rivers, the cavern opened like a primeval vault, its ceiling bristling with crystalline stalactites hung with luminous green moss.

Amidst the deafening roar of cascading water and echoing thunder, a sinister metallic scrape slithered across the stone floor—the hiss of iron chains gliding like vipers through the dark.

Before the hunters could kindle dry driftwood, the ancient silver runes carved upon the cavern vault inverted into pitch-black sigils. A freezing shadow mist choked the cavern. Medusa Gorgo had tracked them down. Her blind eyes bound by black silk, she flexed obsidian talons dripping with purple venom.

"Six winters have I hunted your scent, decrepit wolves," Gorgo's mocking laughter reverberated from every stalactite. "And at last, Aleksandar's stray cur is delivered into my web."

Attuned to the acoustic ripple of every falling raindrop and the shifting air currents, Gorgo drifted like a banshee across the chamber. With the crack of thunder, her poisoned talons swept down to sever Kadan's throat.

"Kadan, down!" Aila shouted, releasing a blind bolt that merely passed through an illusory afterimage. Gorgo had already dissolved into the shadow cast behind the boy's boots. Panic seized Kadan's chest, but as he moved to turn, Gawain's thunderous voice anchored his trembling spirit.

"Close your eyes, Kadan! The witch does not dwell where your eyes seek her!"

Gawain struck the bedrock with his iron staff, sending a low harmonic wave vibrating through the wet stone.

"Your sight deceives you, boy, but the rain lashing your skin never lies! Remember the path of acoustics taught by Lord Aeolus of the Wind Isle! No creature can displace the air without disturbing the gale!"

Kadan inhaled sharply, snapping his eyelids shut.

As visual darkness descended, an astonishing sensory landscape bloomed in his consciousness. The erratic drip of condensation from limestone spikes, the ragged thumping of Grimli's broad chest, the angled sheets of spray driving through the cave mouth, and—there! A solitary pocket of warped silence where falling droplets bent out of trajectory just before touching the stone!

'She is there! The wind is hollow!'

Refusing hesitation, Kadan gripped his silver dagger and spun on his heel, driving the blade toward the empty patch of air with every ounce of his young strength.

Clang!

The white-silver blade collided violently against an ethereal iron chain. Sparks cascaded through the shadows as the sheer kinetic force severed Gorgo's silk cuff, biting deep into her wrist.

"Impertinent whelp! You anticipate my unseen strike?"

Gorgo gasped in shock, recoiling as her balance broke. The masters seized the opening with deadly precision. Grimli brought his maul down to collapse the rear cavern arch, sealing her retreat. The silver bell upon his hammer chimed fiercely like a roaring beast.

"Foul witch! You shall pay for Robinyard's blood this day!"

Grimli roared as Rondol summoned groundwater to wash away her concealing mist. Three barbed quarrels from Aila's crossbow punched through Gorgo's shoulder and thigh, while Kaze's paired daggers severed her primary mana meridians.

Bleeding onto the shale, Gorgo hurled a toxic smoke grenade, her silhouette wavering on the lip of the underground waterfall.

"Clever curs... but do not celebrate! While you rot in these northern wastes, Balian's son is raised in the Red Glass Court as Prince Lucian's most lethal assassin! And upon the distant Wind Isle, Lord Aeolus's daughter, the brilliant Silia, grows into a storm that will tear this continent apart!"

"Silence, hag!" Grimli swung his maul, but Gorgo plunged into the subterranean rapids, vanishing beneath the surging foam.

As the deluge slowed to a gentle patter, an uneasy silence settled over the cavern. Kadan wiped the cold sweat from his palms, looking up toward Gawain.

"Master... who is this Lord Aeolus of the Wind Isle, and who is this girl named Silia?"

Gawain rested upon his staff, listening to the murmuring earth.

"The Wind Isle is an isolated realm adrift upon the eastern sea. Its sovereign, Aeolus, is the proudest and most formidable sage of air mana. It is said he has a solitary daughter named Silia, possessor of razor intellect and a spirit as untamable as the sea breeze. If the Shadow Realm extends its claws toward her, war shall consume every kingdom."

Kadan looked down at his trembling palms.

"Is she... in danger as well, like me?"

Aila brushed back his wet hair with sisterly warmth.

"Then you must grow stronger, Kadan. The strength to shield others is never granted to those who simply wait. To honor the silver dagger your father left behind."

Grimli chuckled, shouldering his hammer.

"Aye, lad. Deflecting a blind chain in the dark was fine work. Tomorrow, I double your boulder-cleaving drills!"

Eliana tended his bruised forearm with soothing moss salve.

"Fear not the scars, Kadan. Where wounds mend, the hide grows twice as tough."

Kadan gazed through the cave opening toward the morning star breaking through the receding storm. Having learned to perceive the world with closed eyes, the boy felt the mysterious name of Silia etch itself into his destiny like a shining silver ripple."""

# -----------------------------------------------------------------------------
# EPISODE 06: 별을 호흡하는 법 / The Art of Breathing Stars
# -----------------------------------------------------------------------------
EP06_KO = """# 눈히어로 6화 - 별을 호흡하는 법

> 원문 범위: 제11장-제12장

여섯 스승의 가르침은 소년 카단을 매일 다른 방향으로 끌어당겼다. 와일드랜드의 얼어붙은 고원 훈련장에서 그림리는 거대한 바위처럼 대지에 뿌리를 박고 버티라 호통쳤고, 도박사 카제는 바람보다 먼저 상대를 속이고 칼끝을 비틀라 가르쳤다. 명사수 에일라는 시위를 당길 때 숨을 완전히 멈추라 다그쳤지만, 뱃사공 론돌은 숨을 거친 파도처럼 끊임없이 흘려보내야 지치지 않는다고 타일렀다. 엘리아나는 약초의 독기를 분별하듯 상대의 살기를 피부로 읽으라 했고, 맹인 추적자 가웨인은 귀를 닫고 발바닥의 맥박만을 믿으라 했다.

카단은 스승들의 가르침 중 그 어느 하나도 버리지 않으려 애썼으나, 정작 실전에 들어서면 기술들이 서로 부딪쳐 모든 동작을 망치기 일쑤였다. 열다섯 살이 되었을 때에도 그는 가장 기초적인 연속 검식조차 매끄럽게 이어가지 못하고 제자리에서 허우적거렸다. 스승들은 아이의 우직한 성실함을 누구보다 잘 알았기에 더욱 안타까워했고, 때로는 답답함에 혀를 찼다.

“단검을 쥔 손목에 힘만 잔뜩 들어가 있구나! 네 아비 알렉산다르는 검을 쥘 때 깃털처럼 가볍게 쥐었단 말이다!”

그림리가 화를 내며 쇠망치를 거두고 돌아서 버린 어느 겨울밤, 카단은 홀로 눈물을 삼키며 어둠 속으로 나섰다. 자신이 스승들의 헌신과 아버지의 이름을 헛되게 만들고 있다는 자괴감이 소년의 가슴을 난도질했다. 카단은 밤이 깊도록 혼자 천 길 얼음 절벽을 기어올랐다. 살얼음이 손톱 밑을 파고들고 무릎이 터져 피가 흘렀지만, 육신의 고통이 마음의 부끄러움보다 덜 아팠다.

절벽 중턱의 좁은 바위턱에는 사나운 북방 그리폰의 둥지가 있었다. 어미가 사냥꾼의 덫에 걸려 돌아오지 못한 둥지 안에서, 태어난 지 얼마 되지 않은 새끼 두 마리가 추위와 굶주림에 지쳐 가냘프게 울부짖고 있었다. 날개 없는 인간은 결코 오를 수 없는 깎아지른 단애였다.

카단이 밧줄을 매고 바위벽에 매달렸다가 미끄러져 떨어지기를 대여섯 번, 피투성이가 된 채 헐떡이는 소년의 모습을 이끼색 외투를 입은 낯선 노인이 절벽 아래 바위 그늘에서 가만히 지켜보고 있었다. 은둔자 말퓨온이었다.

“팔힘으로만 오르려 드니 절벽이 너를 밀어내는 거다, 아이야.”

말퓨온이 지팡이를 짚으며 걸어 나와 낮게 말했다. 카단이 헐떡이며 물었다.

“절벽이... 사람을 밀어낼 수도 있습니까?”

“네가 세상의 호흡을 듣지 못한다면, 세상 역시 네 사정을 들어줄 이유가 없지. 무기를 쥐는 법도 그와 같다.”

말퓨온은 손가락 하나 바위에 대지 않고 사뿐사뿐 절벽을 걸어 올라갔다. 그가 발을 딛는 빙판마다 푸른 이끼가 싹을 틔우며 미끄러운 얼음을 꽉 움켜쥐었다. 말퓨온은 새끼 그리폰 두 마리를 품에 안고 내려와 마른 육포를 씹어 먹여 준 뒤, 카단을 응시했다.

“사흘 뒤 보름달이 뜰 때 이 절벽 정상으로 오너라. 스승들에게는 비밀로 해야 한다.”

사흘 밤 동안 카단은 밧줄 매듭과 발디딤을 수없이 연습했다. 몰래 나가는 것이 두려워서가 아니라, 또다시 절벽에서 굴러떨어져 스승들에게 구출되는 치욕을 겪고 싶지 않아서였다. 약속된 보름날 밤, 카단은 밤의 절반을 소모하며 손톱이 다 빠져나갈 듯한 고투 끝에 마침내 절벽 정상에 도달했다.

달빛이 쏟아지는 정상 바위 위에서 말퓨온은 검도 몽둥이도 들지 않은 채 가부좌를 틀고 앉아 있었다.

“앉거라, 카단. 눈을 감고 들숨마다 머리 위의 샛별 하나를 품에 담고, 날숨마다 발아래 쌓인 눈송이 하나를 대지에 돌려주어라.”

말퓨온은 마나란 근육으로 쥐어짜는 무력이 아니라, 몸과 대륙의 맥박 사이에서 박자를 맞추는 조화라고 가르쳤다.

“남쪽 붉은 유리 궁정에 있는 발리안의 아들 이그니스는 태어날 때부터 거센 불꽃의 축복을 받아 하루가 다르게 파괴적인 마도를 쌓고 있다 들었다. 그러나 불꽃은 마른 장작이 다하면 재만 남길 뿐이지. 네가 배워야 할 것은 꺼지지 않는 별의 호흡이다.”

첫 달에는 아무런 변화도 일어나지 않았다. 그러나 둘째 달이 되자 카단이 숨을 내쉴 때마다 차가운 입김이 허공에서 작은 눈결정 원을 그리기 시작했다. 반년이 흐른 뒤, 카단이 절벽을 오르는 동안 발밑의 살얼음은 단 한 번도 갈라지거나 깨지지 않았다.

카단은 비로소 깨달았다. 그림리의 바위 같은 묵직함도, 카제의 번개 같은 회피도, 에일라의 고요한 조준도 모두 모순되는 기술이 아니라, 서로 다른 별들의 박자였다는 사실을.

말퓨온은 결코 칭찬하지 않았다. 카단의 호흡이 조금이라도 흐트러지면 단단한 나무열매를 이마에 던져 경책했고, 집중이 지나쳐 주변을 잊으면 엉뚱한 질문을 던졌다.

“머리 위 별을 세느라 등 뒤 동료의 발소리를 놓친다면, 그 검은 대체 누구를 지키기 위한 것이냐?”

카단은 고개를 숙였다. 고요함 역시 세상을 외면하기 위한 도피처가 되어서는 안 된다는 깊은 깨달음이었다.

하산한 카단이 숙영지로 돌아왔을 때, 맹인 추적자 가웨인이 가장 먼저 쇠지팡이를 멈추고 고개를 돌렸다. 카단의 발소리가 자갈밭 위에서 완전히 지워져 있었고, 그의 호흡은 북풍의 너울과 완벽히 겹쳐져 있었기 때문이다.

“발소리가 바람에 녹아들었구나, 카단. 밤마다 어디를 다녀왔는지는 묻지 않겠다. 다만 그 힘을 남에게 뽐내려 들면 네 두 다리를 분질러 놓을 테니 그리 알아라.”

가웨인이 무뚝뚝하게 내뱉었으나 입가에는 옅은 미소가 번져 있었다. 드디어 소년의 방패에 영혼의 숨결이 깃들기 시작한 순간이었다."""

EP06_EN = """SNSHero Novel
Episode 06: The Art of Breathing Stars

The teachings of the six masters pulled young Kadan in conflicting directions every single day. On the frozen plateau of the Wildlands, Grimli the dwarven smith roared at him to root his heels like a granite boulder, while Kaze the gambler urged him to deceive the eye before the wind could turn. Aila the Demon Hunter commanded him to halt his breath entirely before drawing the string, yet Rondol the boatman insisted that breath must flow incessantly like ocean swells lest his stamina wither. Eliana counseled him to discern murderous intent through the skin like tasting poisonous spores, and Gawain the blind tracker told him to seal his ears and trust only the tremors beneath his boots.

Kadan strove desperately to discard none of their lessons, yet in practice, the disparate disciplines collided, reducing his swordcraft to clumsy chaos. Even upon turning fifteen, the youth could not execute the simplest combination form without losing his balance. Knowing the boy's earnest devotion, the masters felt only growing anguish, occasionally groaning in sheer frustration.

"Your wrist is clenched like iron! Your father Aleksandar held his twin blades as light as eagle down!"

When Grimli cursed and stalked away into the swirling snow one winter night, Kadan swallowed his bitter tears alone. The agonizing shame that he was squandering his masters' sacrifices and dishonoring his father's memory clawed at his chest. Venturing into the freezing darkness, Kadan began scaling the sheer ice-crusted bluffs above the camp. Freezing rime tore beneath his fingernails and blood welled from his scraped knees, yet the physical sting was far gentler than the shame in his soul.

Upon a narrow limestone ledge halfway up the cliff rested the aerie of a northern mountain griffon. Its mother having perished in a trapper's snare, two newly hatched chicks were whimpering in starvation against the frost. It was a dizzying precipice that no wingless mortal could hope to scale.

After slipping and tumbling from the rock face five times, battered and gasping for air, Kadan heard a calm voice speaking from the rock shadow below. An old hermit cloaked in moss-green wool stood leaning upon a crooked hazel staff. It was Malfurion.

"You climb with brute muscle alone, child. That is why the mountain rejects you."

Wiping blood from his forehead, Kadan rasped.

"Can a cliff... truly reject a man?"

"If you refuse to listen to the breath of the world, why should the mountain heed your clumsy struggles? The same is true of the steel in your hand."

Without touching the rock with his hands, Malfurion walked lightly up the sheer vertical wall. Wherever his bare boots stepped, vibrant green moss bloomed from the ice, anchoring his tread upon the slick glaze. Gently gathering the starving chicks into his cowl and feeding them dried venison, the hermit descended and fixed Kadan with an unblinking gaze.

"Three nights hence, when the full moon crests the ridge, meet me at the summit. Speak of this to no one."

For three days Kadan drilled knotcraft and foot placement obsessively. Not out of fear of punishment, but out of dread that he might plunge into the abyss and suffer the humiliation of being rescued by his masters. On the appointed night, Kadan spent half the hours of darkness clawing through the blizzard until he dragged his frozen limbs onto the windy peak before the moon could set.

Malfurion sat cross-legged on the summit stone, carrying neither sword nor cudgel.

"Sit, Kadan. Close your eyes. With each inhalation, gather a solitary star into your heart. With each exhalation, return a snowflake to the loam."

Malfurion explained that mana was not an internal fuel to be squeezed from strained sinews, but an acoustic cadence harmonizing the body with the pulse of the continent.

"In the southern Red Glass Court, Balian's son Ignis was born blessed with fierce white flame, amassing destructive arts with every sunrise. Yet raw fire leaves only ash when the fuel burns out. What you must cultivate is the unquenchable breath of the stars."

During the first month, nothing stirred. Yet by the second, each breath Kadan released formed subtle geometric circles of crystalline frost in the air. Six months later, as the boy scaled the frozen cliff, the brittle rime beneath his boots never cracked.

Kadan finally understood: Grimli's boulder-like weight, Kaze's lightning feints, and Aila's quiet stillness were not contradictory doctrines, but different tempos of the celestial sphere.

Malfurion offered no flattery. If Kadan's breath wavered, he flicked a hardened hazelnut against the youth's brow. When concentration drifted into isolation, he posed abrupt riddles.

"If you count the stars so intently that you miss the tread of your comrade behind you, whom does that shield protect?"

Kadan bowed his head. Stillness could never become a cave to hide from the world.

When Kadan finally returned to the hunters' yurt, Gawain paused his staff upon the shale, turning his blind eyes in astonishment. Kadan's footsteps made no sound upon the gravel, his breathing indistinguishable from the mountain breeze.

"Your footsteps have melted into the gale, Kadan. I shall not pry into where you wander at night. But if you dare brandish this newly found power in vanity, I shall break your legs myself."

A faint, proud smile touched the tracker's weathered lips. At last, the breath of the cosmos had entered the young warrior's shield."""

# Let's verify EP03, 04, 05, 06 lengths
print("EP03 length:", len(EP03_KO))
print("EP04 length:", len(EP04_KO))
print("EP05 length:", len(EP05_KO))
print("EP06 length:", len(EP06_KO))
