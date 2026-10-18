#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SNSHero Web Novel - Batch 1 (Episodes 01 - 05)
Commercial-grade literary expansion meeting all R1 criteria.
"""

import os
import re

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BOOK_DIR = os.path.join(BASE_DIR, "public", "book")
EN_DIR = os.path.join(BOOK_DIR, "image_narrations", "english_txt")

os.makedirs(BOOK_DIR, exist_ok=True)
os.makedirs(EN_DIR, exist_ok=True)

# -------------------------------------------------------------------------
# EPISODE 01
# -------------------------------------------------------------------------
from scripts.novel_batch_1 import EP01_KO, EP01_EN

# -------------------------------------------------------------------------
# EPISODE 02
# -------------------------------------------------------------------------
EP02_KO = """# 눈히어로 2화 - 일곱 추적자의 맹세

> 원문 범위: 제3장-제4장

헤르쿨이 폐허로 변해 버린 엘윈 마을의 잿더미에 당도했을 때, 대지 위에 남은 것은 검게 얼어붙은 서까래와 눈물처럼 얼룩진 핏자국뿐이었다. 사흘 밤낮을 쉬지 않고 말을 달려온 그의 두 발은 진흙과 서릿발로 뒤덮여 무감각해져 있었으나, 헤르쿨은 성스러운 황금 철퇴를 눈 속에 박아 넣은 채 무릎을 꿇고 알렉산다르의 흔적을 수색했다. 무너진 다리 아래 서리꽃이 핀 여울에서 마침내 건져 올린 것은 반 토막 난 쌍검의 칼날이었다. 검면에는 정규 섀도우렐름 병기에는 결코 존재하지 않는 톱니 모양의 잔혹한 홈과 왕실 문장이 깊게 패여 있었다.

“이것은 국경을 지키는 라이트헤븐 정예 사령부의 문장... 외부의 적이 아니라, 왕국 내부의 권력자가 설계를 주도했다는 명백한 증거다.”

헤르쿨의 굳은 턱선이 억누를 수 없는 분노로 파르르 떨렸다. 마을 회관 잿더미 아래에서 억울하게 학살당한 주민들의 유해를 수습하여 정성껏 눈무덤을 쌓은 헤르쿨은, 두 자루의 부러진 검날과 낡은 가죽집을 소중히 챙긴 뒤 흉적들의 냄새를 좇아 남방의 거대한 무역 항구인 세븐브리지로 향했다.

해무가 낮게 깔린 부둣가 시장통은 각지에서 몰려든 상인들과 망명자들의 거친 고함으로 소란스러웠다. 어시장 안쪽, 생선 비린내와 썩은 그물 냄새가 진동하는 낡은 창고 골목을 은밀히 수색하던 헤르쿨은, 뜻밖에도 살기를 뿜어내는 기이한 일곱 사람의 무리와 정면으로 충돌했다.

무리의 앞머리에는 거대한 쇠망치를 어깨에 멘 드워프 대장장이 그림리가 성큼 걸어 나와 버티고 섰고, 그 뒤로 붉은 머리를 길게 땋아 올린 명사수 에일라가 쇠뇌의 장전을 마친 채 서늘한 눈을 가늘게 뜨고 있었다. 약초 주머니를 주렁주렁 매단 노련한 약제사 엘리아나, 쇠지팡이로 바닥의 미세한 진동을 읽는 맹인 추적자 가웨인, 번뜩이는 은화를 손가락 사이로 현란하게 굴리는 도박사 카제, 강나루의 물길을 부리는 뱃사공 론돌, 그리고 지붕 처마 위에서 고양이처럼 날렵하게 균형을 잡는 유랑 곡예사 로비냐드까지. 종족도, 출신도, 무기도 제각각인 변방의 이단아들이었다.

“성기사의 황금 망토를 두른 궁정 똥개가 기어이 여기까지 냄새를 맡고 기어들어 왔군!”

그림리가 거친 가래침을 판석 위에 뱉으며 쇳소리 나는 목소리로 으르렁거렸다. 첫 만남은 최악의 오해로 번져 나갔다. 헤르쿨은 세븐브리지의 전쟁고아들을 암흑가 노예선으로 팔아넘기는 유괴단이 암약한다는 비밀 밀고를 믿고 있었고, 일곱 사람은 헤르쿨의 화려한 성기사 복식을 보고 붉은 유리 궁정에서 증거를 인멸하기 위해 파견한 황실 암살관이라 확신했던 것이다.

“황궁의 충견 놈들에게 넘겨줄 아이는 단 한 놈도 없다! 그 더러운 무기를 버려라!”

에일라의 차가운 일갈과 함께 팽팽하게 당겨진 석궁 시위가 허공을 튕겼다. 은빛 살촉이 헤르쿨의 눈전을 정밀하게 겨누고 쇄도했다. 헤르쿨은 반사적으로 황금빛 방호진을 전개하며 날아오는 화살들을 쳐냈다. 그 충격으로 시장통의 차양 천막이 갈기갈기 찢겨 나가고 생선 상자들이 공중으로 치솟았다. 그림리의 육중한 쇠망치가 방호 결계를 후려칠 때마다 거대한 종소리 같은 성스러운 파문이 멀리 해안 시계탑까지 울려 퍼졌다.

가웨인은 바닥을 울리는 헤르쿨의 호흡에서 순수한 무인의 절제를 감지했다.

“잠깐, 그림리! 저자의 발소리에는 죄 없는 자를 해치려는 살기가 실려 있지 않다!”

그러나 격돌의 소용돌이 속에서 동료들을 제지하기엔 주변의 소음이 너무 거셌다. 카제가 허공으로 뿌린 일곱 개의 은화가 방호진의 결절점에 부딪치며 미세한 균열을 짚어냈고, 론돌이 바닷물을 수로에서 끌어올려 헤르쿨의 발목을 얼어붙은 족쇄로 묶었다. 헤르쿨이 마나를 폭발시켜 얼음을 깨뜨리려 하자, 엘리아나가 던진 매운 최루 독초 가루가 돌풍을 타고 일어났다. 헤르쿨은 기침을 터뜨리면서도 시장 사람들에게 파편이 튀지 않도록 방패의 각도를 필사적으로 돌렸다.

일촉즉발의 유혈 난투를 멈추어 세운 것은 에일라의 망토 뒤에서 뛰쳐나온 어린 피난민 소녀였다. 누더기를 걸친 아이는 헤르쿨의 찢어진 옷자락을 붙잡으며 눈물범벅이 된 얼굴로 소리쳤다.

“기사님, 제발 멈추세요! 이분들은 우리를 팔아넘기는 유괴범이 아니에요! 붉은 유리 궁정의 지하 감옥으로 끌려가던 우리를 목숨 걸고 구해 주신 분들이라고요!”

헤르쿨의 황금 철퇴가 허공에서 우뚝 멎었다. 일곱 추적자 역시 당황한 기색으로 무기를 거두었다. 헤르쿨이 품속에서 꺼내 놓은 노예 상인들의 비밀 장부에는, 놀랍게도 루시안의 친필 서명과 아케 성기사단 말살 지령이 선명하게 찍혀 있었다. 서로 다른 길에서 불의를 쫓던 의인들이 마침내 하나의 진실 앞에서 마주한 순간이었다.

그림리는 헛기침을 삼키며 쇠망치를 바닥에 내려놓았다.

“빌어먹을, 궁정 놈들의 개가 아니라 진짜 뼈대 있는 성기사였단 말인가. 겉모습만 보고 섣불리 화살을 날렸군 그래. 이 부둣가에 궁정 첩자들이 하도 들끓어서 눈이 뒤집혔던 게지.”

헤르쿨은 부러진 검을 높이 들어 올리며 엘윈 마을에서 일어난 비극과, 쌍검사 알렉산다르와 창술사 발리안의 숭고한 희생을 전했다. 그리고 품속의 은빛 단검을 보여 주며 고개를 숙였다.

“알렉산다르의 아내는 만삭의 몸으로 북쪽 얼어붙은 와일드랜드로 탈출했소. 발리안의 아이는 루시안의 궁정으로 끌려갔지. 부디 간청하오. 황야의 사나운 바람 속에서 알렉산다르의 핏줄이 살아남을 수 있도록 찾아내 거두어 주시오.”

가웨인이 쇠지팡이를 짚으며 무겁게 입을 열었다.

“우리는 대륙의 그림자 속을 걷는 거친 사냥꾼들이오. 하지만 의로운 영웅의 피가 북풍 속에서 얼어 죽는 꼴은 차마 두고 볼 수 없지.”

에일라 역시 고개를 끄덕이며 석궁을 등 뒤로 돌렸다.

“좋아요. 우리 일곱 사람이 북방의 유목민 천막들을 샅샅이 뒤져 알렉산다르의 아들을 찾아내겠어요. 황야의 거친 늑대들에게도 찢기지 않는 단단한 무인으로 키워내지요. 활 쏘는 법부터 사냥의 숨결까지 모조리 가르치겠어요.”

카제가 손가락 사이로 은화를 튕기며 씨익 웃었다.

“거기다 세상의 사기꾼들에게 속지 않는 날카로운 눈치와 비검술까지 덤으로 얹어주지.”

헤르쿨이 가슴을 쓸어내리며 답했다.

“고맙소. 그렇다면 나는 남쪽 붉은 유리 궁정의 어둠 속으로 잠입해 발리안의 아이를 찾아내겠소. 섀도우렐름의 사악한 마도사들이 그 아이의 영혼을 타락시키지 못하도록 진실의 룬을 지킬 것이오.”

가웨인이 미소를 지으며 제안했다.

“그렇다면 하나의 맹세를 더합시다, 성기사여. 지금으로부터 정확히 열여덟 해가 흐른 뒤, 대륙 중앙의 별취한 종탑에서 다시 만납시다. 당신이 기른 아이와 우리 일곱 사람이 길러낸 아이를 마주 세워, 누구의 가르침이 더 올곧게 세상의 불의를 갈랐는지 무인의 결투로 확인하는 것이 어떻겠소?”

헤르쿨은 자신의 은빛 단검을 가웨인의 쇠지팡이에 부딪치며 맑은 파열음을 울렸다.

“좋소! 승패를 떠나, 두 아이가 부모의 숭고한 뜻을 이어받아 이 썩어빠진 대륙을 구할 진정한 등불이 되었음을 증명하는 의식이 될 것이오!”

그것이 바로 훗날 대륙의 전설이 된 `일곱 추적자의 맹세`였다. 일곱 사람은 혹한의 칼바람이 부는 북쪽 국경을 향해 말머리를 돌렸고, 헤르쿨은 홀로 핏빛 장막이 드리운 남방 궁정의 심연으로 발걸음을 옮겼다. 두 줄기의 갈라진 운명이 대륙의 지평선 너머로 아득하게 뻗어 나갔다."""

EP02_EN = """SNSHero Novel
Episode 02: Oath of the Seven Pursuers

When Hercul arrived at the smoking ruins of Elwin village, nothing remained upon the desolated earth save for charred rafters and crimson trails frozen like tear-streaked ice. For three days and three nights he had ridden without pause. Though his greaves were caked in mud and freezing slush, the paladin planted his holy warhammer deep into the drift and fell to his knees to search for Aleksandar's traces. From beneath the shattered bridge, amidst the ice-choked shallows, his fingers drew forth the broken blade of a twin sword. Along the jagged fuller lay a cruel serrated groove and imperial seal never found on standard Shadow Realm armaments.

"The royal insignia of Lighthaven's elite frontier high command... This was no barbarian raid. The slaughter was engineered from within the palace walls."

Hercul's jaw hardened with righteous fury. Carefully burying the remains of the slaughtered villagers beneath clean drifts of snow, he wrapped the broken blade alongside Aleksandar's scabbard and followed the scent of the conspirators southward toward Sevenbridge, the bustling port metropolis where sea fog mingled with the shouts of merchants and desperate refugees. Sweeping through the narrow labyrinth of the fishmongers' quarter, Hercul found himself confronted by seven formidable figures bristling with lethal intent.

At their forefront loomed Grimli, a broad-shouldered dwarven blacksmith resting a colossal maul across his scarred pauldrons. Flanking him was Aila the Demon Hunter, her scarlet braids drawn back as she leveled a cocked heavy crossbow with narrowed eyes. Beside them stood Eliana, an apothecary hung with leather herb-pouches, Gawain, a blind tracker tracing subterranean reverberations with an iron staff, Kaze, a flamboyant gambler flicking silver shillings between his knuckles, Rondol, a canal boatman who commanded water currents with runic paddles, and Robinyard, an agile acrobat balancing effortlessly along the eaves. They were frontier outlaws, distinct in race, tongue, and weapon.

"A gilded hound from the royal holy guard sniffing around our docks!" Grimli spat on the cobbles, his gravelly voice grating like iron on grindstone.

The encounter flared instantly into violent misunderstanding. Hercul had acted on intelligence warning of child slavers operating from the docks, while the Seven Pursuers took one look at Hercul's golden tabard and branded him an imperial inquisitor dispatched by the Red Glass Court to destroy the evidence of their atrocities.

"You will tear not one orphan from this harbor, court lapdog! Drop your steel!" Aila barked, her bowstring snapping with lethal resonance.

A silver-tipped quarrel whistled straight for Hercul's eyes. Reflexively, the knight flared his radiant barrier, deflecting the projectile upward. The kinetic shock tore market awnings to shreds and hurled wooden crates across the quay. Each time Grimli's maul battered the translucent golden dome, harmonious shockwaves rippled out to the distant maritime bell tower.

Gawain tapped his staff, his ears twitching as he parsed the cadence of Hercul's stance.

"Hold your hands, Grimli! His tread bears no bloodlust toward the innocent!"

Yet the roar of battle drowned his counsel. Kaze cast seven silver coins into the air, pinpointing micro-fractures in Hercul's barrier, while Rondol summoned seawater from the canal to freeze around the knight's boots. As Hercul channeled his inner flame to shatter the frost, Eliana hurled a vial of pulverized sun-peppers, raising a blinding, pungent cloud of vapor. Despite his burning eyes, Hercul tilted his shield to keep flying splinters from striking nearby commoners.

The skirmish was halted by a ragged young girl who darted out from behind Aila's cloak, clutching Hercul's torn surcoat with tears streaming down her soot-streaked cheeks.

"Sir Knight, please cease! These people are not slavers! They risked their very lives to drag us from the hold of the slave galleys destined for the Red Glass Court!"

Hercul's warhammer froze mid-swing. The Seven Pursuers lowered their arms in sheepish disbelief. From his travel pouch, Hercul produced the merchant ledger recovered from the burnt wagon. Impressed across its parchment was Prince Lucian's personal wax seal, detailing orders for the total liquidation of the Arcane Holy Order and the trafficking of survivors. On disparate paths of vengeance and justice, these warriors had chased the same monstrous serpent.

Grimli rested his hammer on the flagstones, letting out a rough bellow of laughter.

"Curse my squinting eyes. An honest-to-god holy knight rather than a court lackey. We were too hasty with our bolts, brother."

Raising Aleksandar's broken sword, Hercul recounted the tragic stand at Elwin village, the valor of Aleksandar and Balian, and the grim fate of the two expectant mothers. Then, revealing the gleaming silver dagger, he bowed his head with profound solemnity.

"Aleksandar's wife escaped into the savage frost of the northern Wildlands. Balian's child has been dragged south into the viper's nest of Lucian's court. I implore you, champions of the frontier. Seek out Aleksandar's bloodline in the howling northern plains and shield the child from destruction."

Gawain rested his hands upon his iron staff, nodding with calm dignity.

"We are men and women who dwell within the border shadows. But we will never allow the blood of a hero to freeze unavenged upon the wastes."

Aila slid her crossbow onto her back, her hazel eyes softening with determination.

"Consider it done. We shall comb every nomad encampment until Aleksandar's son is safe in our hands. We will forge him into a warrior whom no northern wolf can break."

Hercul placed a fist over his heart in gratitude.

"Then I shall plunge into the gilded darkness of the Red Glass Court to watch over Balian's child. I swear by my sacred vows that the Shadow Realm shall not corrupt his soul."

Gawain's lips curled into a fierce smile as he offered a parting wager.

"Then let us seal one more compact, Paladin. In eighteen years, on the night of the midwinter solstice, let us convene atop the Star-Drunken Bell Tower in the heart of the continent. Bring forth the boy you have guided, and we shall bring the boy we have tempered in the blizzard. Let an honorable martial duel reveal whose path forged the truer shield for this broken realm."

Hercul brought his silver dagger against Gawain's iron staff, the chime of white metal echoing over the misty bay like a consecrated pledge.

"So be it! Not for vanity or pride, but to prove that the legacy of their fathers lives on to pierce the darkness of this world!"

Thus was born the legend of the Oath of the Seven Pursuers. Turning their steeds toward the howling blizzards of the north, the seven outlaws rode into destiny, while Hercul walked alone into the blood-scented shadows of the southern courts. Two divergent fates set forth across the vast canvas of the Arcane continent."""

# -------------------------------------------------------------------------
# EPISODE 03
# -------------------------------------------------------------------------
EP03_KO = """# 눈히어로 3화 - 안개 절벽의 피

> 원문 범위: 제5장-제6장

북방을 향해 험준한 산악 지대를 가로지르던 일곱 추적자는 미스트폴 절벽의 기괴한 침묵 속에서 길을 잃었다. 대낮이었음에도 불구하고 계곡 깊은 곳에서 솟구쳐 오른 차가운 안개는 말들의 발목을 덮더니, 이내 사냥꾼들의 어깨 너머까지 짙은 장막처럼 차올랐다. 절벽의 검붉은 바위벽마다 마른 핏자국을 머금은 낯선 손자국들이 기괴한 나선형으로 찍혀 있었다. 약제사 엘리아나가 말에서 내려 유리병에 든 푸른 감식액을 바위벽에 떨어뜨리자, 치익 하는 파열음과 함께 은빛 가루가 허공으로 피어올랐다.

“살아 있는 생명체에서 억지로 마나를 뽑아내어 시체처럼 결정을 굳히는 금지된 흑마술의 흔적이에요.”

엘리아나의 창백한 목소리가 서늘한 안개 속으로 흩어졌다. 일행의 말들이 콧김을 뿜으며 뒷걸음질을 쳤다.

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

절체절명의 순간, 가장 먼저 결단을 내린 이는 평소 말수가 가장 적었던 곡예사 로비냐드였다.

“동료들을 건드리지 마라, 괴물 놈!”

로비냐드는 품속에서 예리한 비수를 꺼내 바닥돌을 후벼 파며 자신의 그림자를 꿰맨 흑마술 실을 억지로 찢어 냈다. 그림자가 찢겨 나가며 살갗이 타들어 가는 극심한 영혼의 고통 속에서도, 로비냐드는 번개처럼 몸을 날려 벨페고르의 목덜미에 매달렸다.

푸욱!

벨페고르의 날카로운 흑요석 결정 가시가 로비냐드의 복부를 무자비하게 꿰뚫었다. 그러나 피를 쏟아내면서도 로비냐드는 두 팔로 괴물의 관절을 부둥켜안은 채 놓지 않았다.

“지금이야... 에일라, 그림리... 이번에는 서로의 숨소리를 듣고 움직여라!”

로비냐드의 마지막 피 끓는 절규가 울려 퍼졌다.

가웨인의 지팡이가 바닥을 한 번 강하게 내리쳤다. 그 맑은 울림을 나침반 삼아 에일라의 쇠뇌가 세 걸음 왼쪽의 허공으로 화살을 쏘았다. 카제가 허공으로 던진 칼날이 화살 깃을 쳐서 궤적을 굴절시켰고, 론돌의 급류 룬이 가속을 더해 벨페고르의 관절 틈새를 뚫었다. 이어 일어선 그림리의 전력 망치질이 흑요석 흉갑의 핵을 산산조각 냈다. 그 파편 틈으로 엘리아나가 던진 성수가 스며들자, 벨페고르는 끔찍한 비명을 지르며 절벽 아래 천 길 낭떠러지로 추락했다.

메두사 고르고는 파트너의 비참한 최후에 이를 갈며 독안개 속으로 모습을 감췄다.

“일곱 추적자 놈들... 오늘의 피는 너희의 목숨으로 반드시 되갚아 주마!”

안개가 걷힌 신전 바닥에서, 로비냐드는 피 묻은 손으로 동료들의 얼굴을 하나씩 어루만졌다.

“북쪽으로 가라... 아이를 찾아야 해... 알렉산다르의 맹세를...”

로비냐드는 차가운 절벽 바람 속에서 조용히 눈을 감았다. 여섯 스승은 피눈물을 흘리며 동료의 유해를 바위 봉우리 위에 묻었다. 무덤 앞에는 로비냐드가 쓰던 단검과 부러진 쇠뇌 화살이 비석 대신 세워졌다. 비극적인 피의 대가를 치른 뒤에야, 여섯 사냥꾼은 진정으로 하나의 심장으로 고동치는 불패의 결속을 얻게 되었다."""

EP03_EN = """SNSHero Novel
Episode 03: Blood on the Mist Cliff

Crossing the jagged mountain ranges toward the northern borderlands, the Seven Pursuers found themselves disoriented in the uncanny silence of Mistfall Cliff. Though it was high noon, icy vapors welling up from the gorge swallowed their horses' hooves before thickening into an impenetrable shroud that reached their shoulders. Across the dark volcanic rock faces, peculiar spirals of dried blood trailed like claw marks. Eliana dismounted, uncorking a vial of azure reagent to sprinkle upon the stone. With a sharp hiss, silvery powder billowed into the air.

"A forbidden strain of necromancy," Eliana warned, her voice trembling in the damp air. "It forcefully drains the vital mana from living victims, petrifying their flesh into necrotic crystals."

That very night, within the crumbling titan shrine perched atop the precipice, two sinister silhouettes emerged silently between the colonnades. They were Medusa Gorgo and the crystal-shaper Belphegor—renegade apprentices banished from the sanctum of the wind sage Aeolus. Having stolen the dark codex of the Nine Shadows, they sought to harvest the life force of wandering travelers to fuel their forbidden techniques. Gorgo, her eyes bound by heavy black silk, navigated through subtle acoustic vibrations, while Belphegor was encased from head to heel in jagged obsidian armor that sprouted directly from his flesh.

Gawain struck the flagstones thrice with the heel of his iron staff.

Clang. Clang. Clang.

The reverberation returning through the granite bedrock yielded not seven footsteps, but eight. The veins upon Gawain's knuckles tautened.

"Above us! Scatter!"

A deafening shockwave shattered the rafters. Dropping like an iron anvil, Belphegor slammed his obsidian fist into the floor, fracturing the stones in radial spiderwebs. Grimli surged forward instinctively, his heavy maul deflecting Belphegor's crushing blow at the cost of numbing both his arms, while Aila loosed three rapid quarrels into the swirling mist.

Yet the blind Gorgo heard the friction of the feathers whistling through the air and arched her spine with inhuman grace to dodge each shaft.

"Insolent insects marching willfully into their own tomb!"

Black filaments of concentrated shadow mana erupted from Gorgo's talons, impaling Robinyard's shadow upon the stone wall behind him. With his shadow anchored, Robinyard's physical body locked in place as if bound in invisible chains.

Though each of the seven pursuers was a master of their trade, they had never fought together under the pressure of mortal peril. Kaze's throwing daggers were swept aside by Rondol's unruly water currents, and the gale from Grimli's hammer threw dust directly across Aila's line of sight.

"Fools! Your hearts shall nourish the completion of my obsidian carapace!" Belphegor bellowed, striking Grimli across the chest and sending the dwarf skidding across the stones, vomiting blood. To worsen their plight, Gorgo unleashed a cloud of purple venom that brought the hunters to their knees, gasping for breath.

It was Robinyard, the quietest of the band, who seized the decisive moment.

"Keep your filthy claws off my kin!"

Drawing a serrated skinning knife, Robinyard sliced through his own flesh and carved the enchanted stone beneath him, severing the necrotic threads that pinned his shadow. Though the agony of tearing his spiritual tether burned like molten lead, the acrobat launched himself through the air, wrapping both arms and legs around Belphegor's neck.

Thwack!

Jagged crystal spikes erupted from Belphegor's shoulders, piercing clean through Robinyard's torso. Yet even as lifeblood poured from his lips, Robinyard locked his limbs in an unbreakable vise around the monster's joints.

"Now... Aila, Grimli... listen to each other's breath!"

Gawain's iron staff struck the stone with a clear, bell-like ring. Guided by that acoustic beacon, Aila fired three paces to the left. Kaze's deflection blade clipped the bolt mid-flight to bend its arc, Rondol's rushing tide doubled its velocity, and the projectile drove straight into the vulnerable joint beneath Belphegor's jaw. Roaring with renewed fury, Grimli brought his maul down in a crushing overhead blow that obliterated the crystal core. As Eliana splashed consecrated holy water into the fracture, Belphegor shrieked in agony and plummeted over the cliffside into the abyss.

Gorgo hissed in fury as her partner vanished into the fog.

"Seven Pursuers... you shall repay this blood a thousandfold!" she snarled, dissolving into the swirling vapors.

On the mist-soaked stones, Robinyard touched the faces of his weeping companions one last time.

"Go north... find the boy... keep the vow to Aleksandar..."

The brave acrobat closed his eyes as the mountain wind howled across the peak. With heavy hearts and tear-streaked faces, the six surviving masters interred their brother upon the rocky summit, planting his dagger and a broken quarrel as an enduring headstone. Only through this bitter sacrifice had the hunters forged an unbreakable bond of mutual trust, stepping forward as true guardians of the realm."""

# -------------------------------------------------------------------------
# EPISODE 04
# -------------------------------------------------------------------------
EP04_KO = """# 눈히어로 4화 - 황야에서 자란 아이

> 원문 범위: 제7장-제8장

가혹한 혹한의 계절이 여섯 번이나 지나갔다. 엘윈은 남편 알렉산다르가 목숨으로 지켜낸 아들 카단을 품에 안고, 대륙 북방의 거친 유목 부족들이 모여 사는 와일드랜드의 가죽 천막 사이에서 살아남았다. 설원의 혹독한 칼바람을 맞으며 자란 아이는 또래보다 뼈대가 굵고 튼튼했으나, 말문이 더디게 트였고 열 살이 가까워지도록 손끝에 마나 불꽃 한 줌조차 제대로 피워 올리지 못했다. 유목민의 아이들이 다섯 살만 되면 말을 타고 바람 마나를 조종하여 활을 쏠 때, 어린 카단은 묵묵히 무거운 물양동이를 나르고 눈보라에 무너진 가축 울타리의 말뚝을 다시 박았다.

부족 사람들은 과묵하고 우직한 아이를 카단이라 불렀다. 아버지 알렉산다르가 엘윈의 품속에 남긴 마지막 유언, `어떤 시련에도 끝까지 버텨 내는 단단한 방패`라는 이름 그대로였다. 카단은 화려한 칭찬이나 명예보다, 어머니가 건네는 거친 보리빵과 말린 양고기 한 조각을 더 소중히 여겼다.

어느 살을 에는 듯한 겨울날, 와일드랜드 유목 부족 연맹을 이끄는 정복왕 펜릴의 어린 아들 길가메시가 적대 부족 암살자들의 덫에 걸려 얼어붙은 협곡 한복판에서 포위당하는 사건이 일어났다. 암살자들은 얼음 화살을 쏘아 길가메시의 호위병들을 쓰러뜨렸고, 피를 흘리며 말에서 떨어진 길가메시는 절체절명의 위기에 몰렸다.

그 광경을 가축 떼를 돌보던 어린 카단이 목격했다. 카단의 손에는 번듯한 활이나 쇠칼 한 자루조차 쥐어져 있지 않았다. 그러나 아이는 한 치의 망설임도 없이 눈보라 치는 빙판 위로 몸을 날렸다.

“이곳에서 사람을 해치지 마라!”

카단은 얼어붙은 진흙과 얼음덩어리를 양손 가득 집어던져 사냥개처럼 달려드는 적마들의 눈가를 가렸다. 말이 앞다리를 들고 요동치는 틈을 타, 카단은 쓰러져 신음하는 길가메시를 번쩍 들어 올려 자신의 어린 등에 업었다.

“야! 너 미쳤어? 날 내려놓고 도망쳐! 저놈들은 살인귀들이야!”

길가메시가 비명을 질렀으나 카단은 대답 대신 이를 악물고 얼어붙은 강바닥을 향해 내달렸다. 쩌적, 쩌저적! 살얼음이 쩍쩍 갈라지는 소리가 귓전을 때렸다. 무게가 집중되면 두 사람 모두 얼음장 밑의 흑암 속으로 빠져 죽을 판이었다. 카단은 아버지의 피에서 물려받은 본능적인 무게 중심 감각으로 몸을 낮추어 엎드린 채, 자신의 넓은 등을 얼음판에 밀착시키며 썰매처럼 빙판을 미끄러져 건넜다.

“활을 쏴라! 저 촌뜨기 놈까지 모조리 강물에 수장시켜라!”

뒤쫓아온 암살자들의 쇠뇌 화살이 얼음판을 강타했다. 한 발의 화살이 카단의 허벅지를 깊게 스치고 지나갔다. 살점이 찢어지는 끔찍한 고통 속에서도 카단은 길가메시의 팔을 놓지 않았다. 붉은 피가 얼음 위에 길고 선명한 궤적을 그렸다.

강 건너편 절벽 위에서 달려온 정복왕 펜릴의 늑대 기병대가 암살자들을 모조리 포위해 섬멸했을 때, 카단은 이미 피투성이가 된 채 얼음 둑에 길가메시를 눕혀 놓고 있었다.

펜릴이 거대한 은빛 늑대 가죽 망토를 휘날리며 카단의 앞에 말을 멈추어 섰다.

“어린놈이 어찌 목숨을 버릴 각오로 내 아들을 살려냈느냐? 보물이나 황금을 원하느냐?”

카단은 상처를 감싸 쥔 채, 호흡을 고르며 고개를 가로저었다.

“누구의 아들이든, 눈앞에서 피를 흘리는 아이를 버려두고 도망치는 것은 부끄러운 짓이라 어머니께 배웠습니다.”

펜릴은 카단의 흔들림 없는 맑은 눈동자를 내려다보며 호탕하게 웃음을 터뜨렸다.

“좋은 눈빛이다. 사내다운 배짱을 지녔구나! 오늘부터 너를 내 막사의 손님이자 길가메시의 전우로 대우하겠다.”

그날 밤, 와일드랜드의 불타는 장작더미 너머로 누더기를 걸친 여섯 명의 낯선 나그네들이 천막촌 안으로 들어섰다. 험준한 산맥을 넘어 육 년 만에 마침내 북방에 도달한 여섯 스승—가웨인, 그림리, 에일라, 엘리아나, 카제, 론돌이었다.

그들은 천막 뒤편에서 어머니 엘윈의 상처를 치료해 주던 카단의 품에서 익숙한 공명음을 감지했다. 카단의 허리춤에 가죽 끈으로 동여매어진 한 자루 은빛 단검이었다. 손잡이 안쪽에 새겨진 아케 성기사단의 룬이, 가웨인의 지팡이와 그림리의 쇠망치를 향해 백은의 빛을 번쩍이며 울부짖고 있었다.

“찾았다... 드디어 찾았어. 알렉산다르의 아들을!”

그림리가 쇠망치를 바닥에 떨어뜨리며 굵은 눈물을 쏟아냈다. 에일라는 눈밭 위에 무릎을 꿇고 어린 카단의 어깨를 부둥켜안았다.

“살아 있었구나, 아이야... 알렉산다르의 부러진 검과 이 은빛 단검의 주인을 찾아, 우리가 대륙의 절반을 가로질러 왔단다.”

엘윈은 천막 문을 열고 나와 여섯 스승의 얼굴을 바라보았다. 남편의 유품인 단검과 성기사단의 문장을 알아본 그녀의 눈에서 참아왔던 뜨거운 눈물이 쏟아져 내렸다.

“알렉산다르의 약속을 잊지 않고 와 주셨군요...”

가웨인이 쇠지팡이를 짚으며 정중히 예를 표했다.

“부인, 우리는 로비냐드의 목숨과 바꾼 맹세를 지키러 왔습니다. 비록 카단이 말과 마나의 재능이 더딜지라도, 우리는 이 아이를 대륙 최고의 의로운 방패이자 영웅으로 단련시킬 것입니다.”

그 밤, 모닥불의 따스한 온기 아래에서 알렉산다르의 영혼과 일곱 추적자의 맹세가 마침내 하나로 이어졌다. 혹한의 땅에서 자라난 거친 묘목이, 거대한 폭풍을 견뎌 낼 거목으로 뿌리를 내리기 시작한 순간이었다."""

EP04_EN = """SNSHero Novel
Episode 04: The Child Raised in the Wastes

Six cruel winters passed across the northern steppe. Holding fast to her son Kadan—the boy her husband Aleksandar had died to preserve—Elwin managed to survive amidst the smoky leather yurts of the Wildlands, where fierce nomad clans grazed their shaggy herds. Reared in the teeth of howling arctic blizzards, the boy grew broad-boned and sturdy, yet his speech developed slowly and he failed to kindle even a spark of elemental mana by his tenth year. While other nomad youths mounted war-ponies and learned to guide arrows with wind currents, young Kadan quietly hauled wooden water buckets and hammered fallen stockade poles back into the frozen permafrost.

The clan elders called him Kadan, honoring the name Aleksandar had whispered before the bridge collapsed: the steadfast shield that endures against every tempest. Kadan cared little for boastful words or martial vanity, cherishing instead the coarse barley cakes and dried mutton his mother placed in his rough hands.

One bitterly frigid dawn, Gilgamesh, the young heir of Conqueror King Fenrir who ruled the confederation of northern clans, was ambushed in a frozen gorge by rival raiders. Enchanted frost arrows felled Gilgamesh's escort, leaving the bleeding youth thrown from his horse and surrounded by blades.

Watching from a nearby pasture, Kadan carried neither bow nor iron knife. Yet without a heartbeat's hesitation, the boy vaulted down the icy embankment into the fray.

"Lay no hand upon him!"

Scooping up handfuls of frozen shale and ice chunks, Kadan hurled them with pinpoint force into the eyes of the charging steeds. As the warhorses reared in confusion, Kadan seized the groaning Gilgamesh and threw the boy onto his own back.

"Are you insane? Leave me and run! They will slaughter you!" Gilgamesh screamed through bloodied teeth.

Kadan answered only by clenching his jaw, bolting toward the center of the frozen river. Crrrk! Crack! The ominous spiderwebbing of brittle ice shrieked beneath their weight. If their mass remained concentrated, both boys would plunge into the black, freezing torrent below. Trusting an instinctive balance inherited from his father's blood, Kadan flattened his posture, sliding across the slick surface like an otter across ice to distribute their weight.

"Loose the quarrels! Drown the savage dog and the prince together!" the pursuing leader roared.

A volley of iron crossbow bolts peppered the sheet. One bolt grazed Kadan's thigh, tearing flesh and spilling hot blood onto the frost. Despite the agonizing burn, Kadan never released his grip on Gilgamesh's arms. A crimson line traced their path across the white riverbed.

By the time King Fenrir's wolfguard crested the ridge to encircle and annihilate the ambushers, Kadan had dragged Gilgamesh safely onto the southern bank before collapsing in exhaustion.

Fenrir reigned his silver-maned war-steed before the bleeding boy, his eyes flashing beneath a wolfskin cowl.

"Why risk your young life for my son, peasant boy? Do you covet gold, or land within my horde?"

Nursing his torn leg, Kadan shook his head with quiet sincerity.

"My mother taught me that to abandon a bleeding child before one's eyes is a cowardice no man should bear."

Fenrir studied the unclouded clarity in Kadan's eyes and threw his head back in thunderous laughter.

"A lion's heart! From this sunrise forth, you are a guest of my grand pavilion and a shield-brother to Gilgamesh."

That night, six dust-caked travelers in threadbare cloaks rode into the encampment. Having crossed savage peaks over six agonizing years, the surviving masters—Gawain, Grimli, Aila, Eliana, Kaze, and Rondol—had finally reached the northern plains.

Near the fringe of the horse lines, they felt a resonant hum vibrating through their souls. At Kadan's hip hung a slender silver dagger bound in leather thongs. Along the fuller, the ancient rune of the Arcane Holy Order flared with brilliant white-silver radiance, chiming in unison with Gawain's staff and Grimli's hammer.

"We found him... by the heavens, we have found Aleksandar's boy!"

Grimli let his maul strike the earth as thick tears cut through the soot on his beard. Aila dropped to her knees in the drift, pulling the bewildered Kadan into a fierce embrace.

"You live, little one... To return your father's broken legacy and this silver dagger, we have journeyed across half the continent."

Elwin emerged from the yurt flap, her eyes widening as she recognized the Holy Order crest and the companions of Hercul. Tears she had held for six winters poured freely down her weathered cheeks.

"You remembered Aleksandar's sacrifice..."

Gawain bowed his head with the solemn dignity of a lifelong tracker.

"Lady Elwin, we carry the oath paid in Robinyard's blood. Though the boy's tongue be slow and his mana dormant, we shall temper him into an unbreakable shield that the world shall revere."

Beneath the blazing yurt fires, Aleksandar's legacy and the Oath of the Seven Pursuers intertwined at last. In the cradle of the northern gale, the young sapling had taken root, ready to grow into a fortress against the coming dark."""

# -------------------------------------------------------------------------
# EPISODE 05
# -------------------------------------------------------------------------
EP05_KO = """# 눈히어로 5화 - 폭우 속의 유령

> 원문 범위: 제9장-제10장

황야의 짧은 여름이 저물고, 대지를 집어삼킬 듯한 흉포한 폭우가 고원 지대를 강타했다. 천둥이 번쩍일 때마다 거대한 암흑의 협곡이 푸른빛으로 물들었고, 여섯 스승과 소년 카단은 비바람을 피해 절벽 기슭의 깊은 종유석 동굴 안으로 몸을 피했다. 동굴 천장에서 떨어지는 물방울 소리와 세찬 빗소리가 뒤섞여 귀를 먹먹하게 만들던 바로 그 순간, 동굴 안쪽의 어둠 속에서 차가운 쇠사슬이 뱀처럼 바닥을 긁는 음산한 소리가 울려 퍼졌다.

스승들이 마른 장작에 불을 지피려는 찰나, 천장에 새겨져 있던 은빛 룬이 갑자기 뒤집히며 칠흑 같은 암흑 안개가 동굴 안을 가득 메웠다. 미스트폴 절벽에서 로비냐드를 죽이고 도망쳤던 메두사 고르고였다.

“육 년 동안 너희 늙은 사냥개들을 찾아 헤맸다. 그리고 마침내 알렉산다르의 씨앗까지 한자리에 모여 있구나.”

고르고의 서늘한 비웃음이 동굴 벽 전체에서 울려 나왔다. 그녀는 눈이 먼 대신 사방에 흩뿌려진 빗방울의 파동을 타고 유령처럼 공간을 넘나들었다. 번개가 번쩍이는 찰나, 고르고의 날카로운 독 손톱이 카단의 목덜미를 베어 내기 위해 허공을 갈랐다.

“카단, 엎드려라!”

에일라가 외치며 쇠뇌를 쏘았으나 화살은 텅 빈 잔상만을 꿰뚫었을 뿐이었다. 고르고의 몸체는 이미 카단의 등 뒤 그림자 속으로 미끄러져 들어가 있었다. 공포에 질린 카단이 단검을 쥐고 몸을 돌리려 했을 때, 맹인 추적자 가웨인의 차분한 목소리가 귓전을 때렸다.

“눈을 감아라, 카단! 저 마녀는 네가 바라보는 시야 안에 존재하지 않는다!”

가웨인의 쇠지팡이가 동굴 바닥을 치며 투명한 진동파를 쏘아 올렸다.

“시각은 거짓을 보여주지만, 네 피부를 때리는 빗방울과 공기의 흐름은 결코 거짓말을 하지 않는다. 바람섬의 에올루스 경에게서 배운 음파의 길을 기억하라. 저 여자의 발밑에는 바람이 머물지 못한다!”

카단은 떨리는 숨을 들이켜며 지체 없이 두 눈을 질끈 감았다.

시야가 암흑에 잠기자, 믿을 수 없는 세계가 소년의 감각 속으로 쏟아져 들어왔다. 천장에서 떨어지는 불규칙한 물방울 소리, 그림리가 거칠게 헐떡이는 가슴의 고동, 동굴 입구로 들이치는 빗줄기의 각도, 그리고—오직 한 곳, 빗방울이 바닥에 닿기 직전 허공에서 궤적을 비틀며 허물어지는 미세한 진공의 공간!

‘저기다!’

카단은 눈을 감은 채, 본능적으로 허리춤의 은빛 단검을 쥐고 아무것도 보이지 않는 허공의 빈자리를 향해 전력으로 몸을 회전시켰다.

챙그랑!

은빛 단검의 칼날이 허공 속에서 실체화되던 고르고의 칠흑 사슬을 정면으로 후려쳤다. 맑은 파열음과 함께 불꽃이 튀며 고르고의 비단 소매가 찢겨 나갔다.

“어린놈이... 보이지도 않는 칼길을 읽었단 말인가!”

고르고가 경악하며 뒤로 물러섰다. 스승들은 그 찰나의 틈을 놓치지 않았다. 그림리가 도약하여 쇠망치로 동굴 입구의 낙석을 깨뜨려 퇴로를 막았고, 론돌이 지하수를 끌어올려 고르고를 감싼 암흑 안개를 씻어냈다. 에일라의 독화살 세 발이 고르고의 어깨와 허벅지를 연달아 꿰뚫었다.

피를 흘리며 동굴 벽에 몰린 고르고는 품속에서 보랏빛 연막탄을 터뜨리며 몸을 뒤틀었다.

“크큭... 제법이구나, 멍청한 사냥꾼 놈들. 하지만 기뻐하긴 이르다. 너희가 이 북방 구석에 처박혀 있는 동안, 남쪽 붉은 유리 궁정에선 발리안의 아들이 루시안 경의 충성스러운 살인귀로 자라나고 있으니! 그리고 바람섬의 군주 에올루스의 외동딸 실리아 역시 대륙의 질서를 뒤흔들 폭풍으로 자라나고 있다!”

고르고는 절벽 아래로 몸을 던져 거친 강물 속으로 유령처럼 사라졌다.

폭우가 잦아들 무렵, 동굴 안에는 무거운 침묵이 흘렀다. 카단은 손바닥에 밴 땀을 닦아내며 가웨인을 바라보았다.

“스승님... 방금 고르고가 말한 바람섬과 실리아라는 이름은 대체 누구입니까?”

가웨인은 쇠지팡이를 짚으며 북풍의 소리를 들었다.

“바람섬은 동쪽 대해에 떠 있는 신비로운 고립의 영역이다. 그곳의 군주 에올루스는 대륙에서 가장 오만하고도 지고한 바람의 현자이지. 그에게는 눈처럼 영민하고 바람처럼 자유로운 외동딸 실리아가 있다고 들었다. 만약 섀도우렐름의 마수가 그곳까지 뻗치고 있다면, 장차 대륙 전체가 거대한 전화에 휩싸일 게다.”

카단은 부러진 동굴 입구 너머로 먹구름이 걷히며 드러난 새벽하늘의 샛별을 올려다보았다. 눈을 감고 듣는 법을 깨달은 소년의 가슴속에서, 머나먼 대륙의 운명과 실리아라는 신비로운 이름이 희미한 은빛 파문처럼 퍼져 나가고 있었다."""

EP05_EN = """SNSHero Novel
Episode 05: Phantom in the Downpour

As the brief summer of the northern wastes receded, a ferocious tempest struck the plateau, threatening to drown the world in torrential fury. Jagged lightning flared across the canyons, painting the churning clouds in ethereal violet, driving the six masters and young Kadan into a subterranean cavern tucked beneath the bluffs. Amidst the deafening roar of cascading water and echoing thunder, a sinister metallic scrape slithered across the stone floor—the hiss of iron chains gliding like vipers through the dark.

Before the hunters could kindle dry driftwood, the ancient silver runes carved upon the cavern vault inverted into pitch-black sigils. A freezing shadow mist choked the cavern. Medusa Gorgo had tracked them down.

"Six winters have I hunted your scent, decrepit wolves," Gorgo's mocking laughter reverberated from every stalactite. "And at last, Aleksandar's stray cur is delivered into my web."

Blind yet attuned to the acoustic ripple of every falling raindrop, Gorgo drifted like a banshee across the chamber. With the crack of thunder, her poisoned obsidian talons swept down to sever Kadan's throat.

"Kadan, down!" Aila shouted, releasing a blind bolt that merely passed through an illusory afterimage. Gorgo had already dissolved into the shadow cast behind the boy's boots. Panic seized Kadan's chest, but as he moved to turn, Gawain's thunderous voice anchored his trembling spirit.

"Close your eyes, Kadan! The witch does not dwell where your eyes seek her!"

Gawain struck the bedrock with his iron staff, sending a low harmonic wave vibrating through the wet stone.

"Your sight deceives you, boy, but the rain lashing your skin never lies! Remember the path of acoustics taught by Lord Aeolus of the Wind Isle! No creature can displace the air without disturbing the gale!"

Kadan inhaled sharply, snapping his eyelids shut.

As visual darkness descended, an astonishing sensory landscape bloomed in his consciousness. The erratic drip of condensation from limestone spikes, the ragged thumping of Grimli's broad chest, the angled sheets of spray driving through the cave mouth, and—there! A solitary pocket of warped silence where falling droplets bent out of trajectory just before touching the stone!

'She is there!'

Refusing hesitation, Kadan gripped his silver dagger and spun on his heel, driving the blade toward the empty patch of air with every ounce of his young strength.

Clang!

The white-silver blade collided violently against an ethereal iron chain. Sparks cascaded through the shadows as the sheer kinetic force severed Gorgo's silk cuff, biting deep into her wrist.

"Impertinent whelp! You anticipate my unseen strike?"

Gorgo gasped in shock, recoiling as her balance broke. The masters seized the opening with deadly precision. Grimli brought his maul down to collapse the rear cavern arch, sealing her retreat, while Rondol summoned groundwater to wash away her concealing mist. Three barbed quarrels from Aila's crossbow punched through Gorgo's shoulder and thigh.

Bleeding onto the shale, Gorgo hurled a toxic smoke grenade, her silhouette wavering on the lip of the underground waterfall.

"Clever curs... but do not celebrate! While you rot in these northern wastes, Balian's son is raised in the Red Glass Court as Prince Lucian's most lethal assassin! And upon the distant Wind Isle, Lord Aeolus's daughter, the brilliant Silia, grows into a storm that will tear this continent apart!"

With a venomous shriek, Gorgo plunged into the subterranean rapids, vanishing beneath the surge.

As the deluge slowed to a gentle patter, an uneasy silence settled over the cavern. Kadan wiped the cold sweat from his palms, looking up toward Gawain.

"Master... who is this Lord Aeolus of the Wind Isle, and who is this girl named Silia?"

Gawain rested upon his staff, listening to the whispering wind.

"The Wind Isle is an isolated realm adrift upon the eastern sea. Its sovereign, Aeolus, is the proudest and most formidable sage of air mana. It is said he has a solitary daughter named Silia, possessor of razor intellect and a spirit as untamable as the sea breeze. If the Shadow Realm extends its claws toward her, war shall consume every kingdom."

Kadan gazed through the cave opening toward the morning star breaking through the receding storm. Having learned to perceive the world with closed eyes, the boy felt the mysterious name of Silia etch itself into his destiny like a shining silver ripple."""

def generate_episodes():
    episodes = [
        (1, EP01_KO, EP01_EN, "SNSHero_Novel_Episode_01_Two_Vows_Beneath_the_Blizzard_EN.txt"),
        (2, EP02_KO, EP02_EN, "SNSHero_Novel_Episode_02_Oath_of_the_Seven_Pursuers_EN.txt"),
        (3, EP03_KO, EP03_EN, "SNSHero_Novel_Episode_03_Blood_on_the_Mist_Cliff_EN.txt"),
        (4, EP04_KO, EP04_EN, "SNSHero_Novel_Episode_04_The_Child_Raised_in_the_Wastes_EN.txt"),
        (5, EP05_KO, EP05_EN, "SNSHero_Novel_Episode_05_Phantom_in_the_Downpour_EN.txt"),
    ]
    for num, ko, en, fn in episodes:
        with open(os.path.join(BOOK_DIR, f"episode_{num:02d}.md"), "w", encoding="utf-8") as f:
            f.write(ko)
        with open(os.path.join(EN_DIR, fn), "w", encoding="utf-8") as f:
            f.write(en)
        print(f"Generated Ep {num:02d}: KO={len(ko)} chars, dialogues={len([l for l in ko.splitlines() if '“' in l])}, EN words={len(en.split())}")

if __name__ == "__main__":
    generate_episodes()
