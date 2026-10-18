#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/generate_arc1.py
Assembles Arc 1 (Episodes 01 - 10) with complete, verified high-grade prose.
"""

import sys, os
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

from scripts.novel_batch_1 import EP01_KO, EP01_EN
from scripts.novel_batch1_ep01_05 import EP02_KO, EP02_EN
from scripts.build_arc1_episodes import EP03_KO, EP03_EN, EP04_KO, EP04_EN
from scripts.remediate_arc1_ep01_10 import EP05_KO, EP05_EN
from scripts.build_arc1_complete import EP06_KO, EP06_EN

# EPISODE 07 EXPANSION
EP07_KO = """# 눈히어로 7화 - 배신자들의 천막

> 원문 범위: 제13장-제14장

와일드랜드의 대평원을 휘감던 모닥불 연기가 잦아들 무렵, 북방의 하늘은 금방이라도 폭설을 쏟아낼 듯 짙은 잿빛 먹구름으로 뒤덮여 있었다. 남쪽으로 떠나기 전 마지막 밤, 열여덟 살의 건장한 청년으로 자라난 카단은 은둔자 말퓨온과 함께 와일드랜드 외곽의 깎아지른 현무암 능선을 은밀히 가로질렀다. 메두사 고르고의 불길한 마나 흔적을 쫓기 위함이었다. 고르고는 유목 부족의 위대한 패자 펜릴의 본진 숙영지에서 불과 반 리 떨어진 버려진 유황 폐광산 동굴 속에 숨어들어 있었다. 그녀는 스승 에올루스에게서 훔쳐낸 `나인섀도우 코덱스`의 암흑 룬을 바위벽에 음각하며 광기 어린 주술을 연마하고 있었다. 검붉은 사슬채찍이 칠흑의 바위를 내리칠 때마다 돌 속에 잠들어 있던 대지의 마나가 바싹 말라붙으며 은백색 소금 결정으로 부서져 내렸다.

말퓨온과 카단이 차가운 바위 틈새에 몸을 숨기고 숨을 죽인 바로 그 순간, 폐광 입구로 검은 모직 망토를 깊게 뒤집어쓴 의문의 기마대 여덟 필이 말에서 내렸다. 놀랍게도 말에서 내린 사내는 펜릴의 의형제이자 부족의 제2인자인 맹장 바르가스트였다. 더욱 경악스러운 것은 어둠 속에서 그를 마중 나온 자의 화려한 복색이었다. 가슴팍에 진홍빛 화염 문양이 금실로 수놓아진 붉은 유리 궁정의 고위 사절 루시안의 밀사였다.

“약조한 거사일이 바로 내일 밤이다. 펜릴의 저녁 축제 술잔에 약제사 엘리아나의 정화 비방으로도 풀 수 없는 그림자 마비 독을 섞어 둘 것이다. 펜릴이 쓰러지는 즉시 부족 전사들을 모조리 섀도우렐름의 깃발 아래 집결시키겠다.”

바르가스트의 쉰 목소리가 동굴 암벽을 타고 흘러나왔다. 붉은 옷의 사절이 비열한 미소를 지으며 무거운 금화 주머니와 붉은 밀랍으로 봉인된 양피지 서한을 건넸다.

“훌륭하다. 펜릴만 제거된다면 이 광활한 황야는 우리 루시안 경의 손아귀에 떨어질 것이다. 발리안의 아들 이그니스가 황궁의 백색 화염 기사단을 이끌고 북상할 때, 네가 첫 번째 맹주로 추대될 것이다.”

사절의 입에서 발리안과 이그니스의 이름이 흘러나오자 카단의 심장이 거세게 요동쳤다. 더 이상 지체할 수 없었다. 카단은 곧장 숙영지로 달렸다. 그러나 펜릴은 어린 전사의 말만 믿고 십 년 넘게 동고동락한 오랜 의형제를 의심할 수 없었다.

“바르가스트는 나와 함께 북방의 마수들을 토벌하며 피를 나눈 내 아우다! 일개 떠돌이의 혀에 놀아나 내 심장을 바친 형제를 칼로 베란 말이냐?”

오히려 함께 온 말퓨온이 남쪽 궁정의 첩자라는 누명을 쓰고 결박되었다. 바르가스트는 기다렸다는 듯 군영의 전사들을 동원해 말퓨온의 천막을 포위했다. 펜릴은 카단에게 확실한 물적 증거를 요구했다. 카단은 폐광에서 들은 대화를 한 글자도 빠짐없이 증언했으나 부족 사람들은 눈에 보이지 않는 기억을 어찌 증거로 삼느냐며 비웃었다.

실마리는 폐광 바닥에서 발견된 살해된 펜릴의 전령의 가죽 장화 굽에 있었다. 그곳에는 와일드랜드의 얼어붙은 진흙이 아니라, 붉은 유리 궁정의 수로에서만 나오는 진홍빛 유황 가루가 선명하게 묻어 있었다. 펜릴의 딸이자 부족의 영민한 전사 티타니아는 같은 붉은 흙이 바르가스트의 말발굽 편자 틈새에도 끼어 있다는 사실을 날카롭게 밝혀냈다.

해가 지자 바르가스트가 수백 명의 반란군을 이끌고 언덕을 포위했다. 그는 펜릴에게 젊은 날 의형제를 맺으며 주고받았던 늑대 송곳니 목걸이를 땅에 던지며 항복을 권했다.

“우리는 조상들이 정한 경계 안에서 가축을 치며 살면 된다. 왜 무모하게 남쪽 황궁과 대적하며 모든 부족을 하나로 묶으려 하나?”

펜릴은 진흙투성이가 된 목걸이를 밟으며 거칠게 포효했다.

“아이들이 해마다 같은 메마른 우물을 놓고 서로 목을 베며 죽어가는 비극을 내 손으로 끝내려는 거다! 조상의 전통이란 이름 뒤에 숨어 무덤 수만 늘리는 겁쟁이의 평화를 어찌 삶이라 부르겠느냐!”

새벽 안개를 가르며 반역자들의 총공격이 시작되었다. 붉은 유리 궁정에서 파견된 룬 기사 넷이 언덕을 기어올랐고, 부족 사수들의 화살은 그들의 마법 방호복을 뚫지 못했다.

전장의 한가운데서 카단은 자신이 연습장에서보다 실전에서 훨씬 무겁고 느리다는 사실에 당혹감을 느꼈다. 발밑에는 쓰러진 전우들이 피를 흘리고 있었고, 등 뒤에서는 티타니아와 궁수들이 활시위를 당기며 카단의 방패에 목숨을 의지하고 있었다. 머릿속의 계산을 지우고 오직 별의 호흡에 의식을 맡긴 순간, 카단의 무쇠 방패가 맹렬한 궤적을 그리며 룬 기사의 가슴을 강타했다.

쾅! 쾅!

카단은 적장 바르가스트의 아들 우르삭을 생포했으나, 그를 인질 방패로 삼지 않고 부상당한 다리를 치료한 뒤 부족 진영으로 돌려보냈다.

“우리는 원수를 갚기 위해 칼을 든 것이 아니라, 무고한 피를 멈추기 위해 싸우는 것이다.”

카단의 고결한 선택에 적군의 어린 전사들이 동요하기 시작했다. 우르삭은 창을 거두고 부하들을 이끌며 물러섰다. 그 틈을 타 길가메시와 티타니아는 어린 기병들을 모아 말꼬리에 마른 고사리 덤불을 매달았다. 수백 기의 군마가 흙먼지를 일으키며 황야를 달리자 지평선 너머로 거대한 지원군이 몰려오는 듯한 착각이 일었다.

“펜릴 님의 대군이다! 퇴로가 막혔다!”

반란군은 공포에 질려 무기를 버리고 흩어졌다. 사흘 밤낮의 격전 끝에 펜릴은 바르가스트의 본진을 기습하여 의형제를 사로잡았다. 펜릴은 눈물을 흘리며 바르가스트를 부족의 율법에 따라 북방의 얼음 동굴로 영구 추방했다.

와일드랜드의 모든 부족은 마침내 펜릴을 북방의 유일한 군주, 정복왕으로 추대했다. 펜릴은 승리의 가장 큰 공을 세운 카단에게 보물 창고의 황금과 고대 드래곤의 뼈로 만든 투구를 하사하려 했다. 그러나 카단은 축하연의 술잔을 마다하고, 전사자들의 명단을 묵묵히 뼈 판에 새기는 일에 몰두했다. 바르가스트 편에서 싸우다 죽은 어린 전사들의 이름도 차별 없이 같은 판에 새겨 넣었다.

펜릴이 카단의 어깨를 감싸 쥐며 말했다.

“네게 내 보물 창고의 황금보다 더 귀한 것을 주마.”

펜릴은 딸 티타니아의 손을 카단에게 건넸다. 두 사람이 성인이 되면 부족의 법도에 따라 혼인시키겠다는 맹세였다. 천막 안의 전사들이 함성을 질렀으나, 카단은 정중히 고개를 숙이며 사양했다.

“티타니아 님은 누군가에게 하사되는 전리품이 아닙니다. 그녀는 대륙의 바람처럼 스스로의 의지로 살아갈 자유로운 영혼입니다.”

그때 어머니 엘윈이 품속의 양피지를 꺼내며 카단의 죽은 아버지 알렉산다르가 남긴 옛 약조를 털어놓았다. 오래전 성기사단 시절, 알렉산다르와 친구 발리안은 훗날 태어날 자식들의 혼약을 맹세했었다. 비록 발리안의 아이 역시 아들(이그니스)로 태어나 혼약은 무산되었으나, 두 가문 사이에 얽힌 운명의 고리는 여전히 살아 숨 쉬고 있었다.

티타니아는 섭섭함을 감추며 자신의 손목에서 푼 붉은 명주실 끈을 카단의 단검 자루에 단단히 매어 주었다.

“나는 보물이 아니야, 카단. 네가 남쪽의 싸움을 끝내고 무사히 돌아오면, 그때 내 발로 네게 걸어가 선택할 거야.”

카단은 붉은 끈을 쥔 채 맑은 미소를 지었다.

“약속하겠습니다. 그날까지 방패를 잃지 않겠습니다.”

이튿날 아침, 카단은 여섯 스승과 함께 남쪽 세븐브리지를 향해 길을 떠났다. 정복왕 펜릴은 지평선 끝까지 군대를 도열시켜 소년을 배웅하며, 황궁의 찬탈자 루시안에게 진실의 심판을 전하라는 격문을 하늘 높이 쏘아 올렸다."""

EP07_EN = """SNSHero Novel
Episode 07: The Traitors Camp

As the smoke of campfires drifted across the sweeping plains of the Wildlands, the northern sky curdled into slate-grey storm clouds heavy with frost. On their final night before journeying south, the eighteen-year-old warrior Kadan and the hermit Malfurion rode along the jagged basalt cliffs at the territory's edge, tracking the venomous mana spoor of Medusa Gorgo. Half a league from Great Chieftain Fenrir's royal yurt, Gorgo had taken refuge within an abandoned sulfur mine, carving dark runes stolen from the Nine Shadow Codex into the basalt. Whenever her barbed chain struck the rock, vital mana withered into brittle white salt crystals.

Concealed within a rock fissure, Kadan and Malfurion watched as eight cloaked riders dismounted at the shaft entrance. Leading them was Bargast, sworn blood-brother to Fenrir and commander of the horde's vanguard. Waiting within the shadows was a silk-clad courier bearing Prince Lucian's crimson flame crest from the southern Red Glass Court.

"The banquet is set for tomorrow night," Bargast growled. "I have mingled shadow-paralysis poison into Fenrir's mead horn—a draught that even Eliana's secret salves cannot neutralize. Once Fenrir collapses, the entire horde gathers beneath the Shadow Realm's banner."

The court emissary smiled, sliding a heavy coin purse and a sealed parchment across the stones.

"Splendid. With Fenrir slain, the northern wastes fall into Lord Lucian's grasp. When Balian's son Ignis marches north at the head of the White Flame Paladins, you shall be crowned paramount warlord."

Hearing the names of Balian and Ignis, Kadan raced back to the central encampment. Yet Fenrir, seated upon his wolf-skin throne, refused to suspect his sworn brother of ten winters upon the word of an itinerant youth.

"Bargast has bled beside me across a hundred sieges!" Fenrir thundered. "Shall I plunge a spear into my brother's breast upon a wanderer's rumor?"

Instead, suspicion fell upon Malfurion, who was bound in iron chains as a suspected southern agent. Bargast's partisans demanded blood, scorning Kadan's testimony as unproven hearsay.

The crucial clue lay upon the boot heel of a slain courier found in the scrub. Coated on the leather was not the frozen muck of the steppes, but crimson sulfur dust unique to the volcanic waterways of the Red Glass Court. Titania, Fenrir's sharp-eyed warrior daughter, discovered the identical volcanic residue lodged within the horseshoes of Bargast's private stable.

At nightfall, Bargast surrounded the council knoll with hundreds of rebel horsemen. Casting the sacred wolf-fang necklace he had once exchanged with Fenrir into the mire, Bargast urged surrender.

"We need only graze our herds within the ancestral boundaries! Why unite every tribe in mad defiance against the southern throne?"

Fenrir ground the fang into the mud beneath his boot.

"To end the tragedy of our children butchering one another over the same dried wells each winter! I will not buy coward's peace at the price of our souls!"

At dawn, the assault commenced. Four runic shock-troopers dispatched by Prince Lucian scaled the slope, their arcane armor deflecting normal arrows.

Thrust into the maelstrom, Kadan discovered that battlefield combat moved with brutal heaviness compared to the training ground. Fallen comrades bled beneath his boots, while Titania and the archers leaned upon the protection of his wooden shield. Breathing the cadence of the stars, Kadan met the leading shock-trooper with an avalanche shield strike.

Boom! Crack!

Kadan captured Bargast's son Ursak, yet rather than using the youth as a living buckler, he bound the young warrior's wounds and released him back to his clan.

"We wield our shields not for retribution, but to halt the shedding of innocent blood."

Moved by Kadan's nobility, Ursak withdrew his riders. Seizing the opening, Gilgamesh and Titania tied dried brush to the tails of young cavalry ponies. Charging across the flats, they raised a colossal dust cloud that deceived the rebels into believing an immense northern relief host had encircled their flanks.

"Fenrir's reserve armies! We are encircled!"

Panic shattered the rebel lines. After three days of skirmishes, Fenrir stormed Bargast's redoubt, capturing his brother. Weeping bitter tears, Fenrir chose exile over execution, casting Bargast into the perpetual ice wastes.

The united tribes acclaimed Fenrir as the Conqueror King of the North. Fenrir offered Kadan gold and a legendary dragon-bone helm, but the youth declined, spending the night carving the names of the fallen onto bone tablets, including the rebel youths who had perished under Bargast's banner.

Fenrir placed a heavy arm over Kadan's shoulder.

"I offer you a treasure greater than the hoard of any king."

Fenrir placed Titania's hand into Kadan's palm, proposing a betrothal once they reached full adulthood. As the warriors cheered, Kadan bowed with deep humility.

"Lady Titania is no trophy to be granted by another's hand. She is a free spirit, entitled to walk her own path beneath the heavens."

Elwin then revealed the ancient pledge Aleksandar and Balian had sworn before the blizzard war: a vow to unite their bloodlines through their offspring. Though both had fathered sons—Kadan and Ignis—the sacred weight of that ancient brotherhood still guided their steps.

Titania tied a scarlet braided silk cord around the hilt of Kadan's dagger.

"I am no prize, Kadan. When you return from the southern war, I shall cross the threshold upon my own feet."

Kadan smiled, tightening his grip on the cord.

"I swear it. Until that hour, my shield shall never falter."

At sunrise, Kadan rode south alongside his six masters, guided by the fiery dawn."""

print("EP07 built. KO len:", len(EP07_KO), "EN len:", len(EP07_EN))

EP08_KO = """# 눈히어로 8화 - 붉은 갈기의 기수

> 원문 범위: 제15장-제16장

북방 와일드랜드를 벗어나 남쪽의 드넓은 초원 지대에 들어서자, 살을 에는 북풍 대신 풀내음 머금은 따스한 남풍이 불어왔다. 카단은 펜릴의 통행패와 여섯 스승의 배웅을 등에 업고 남부 상단의 거점인 크림슨밸리 가축 시장에 당도했다. 그곳의 거대한 원형 목책 주변에는 수백 명의 상인과 용병들이 모여들어 웅성거리고 있었다. 울타리 한가운데에는 붉은 노을빛 갈기를 지닌 거대한 야생마 한 마리가 성난 맹수처럼 거칠게 날뛰고 있었다.

말은 등에 사람을 태우기는커녕, 다가오는 조련사들의 강철 흉갑을 뒷발질로 걷어차 우그러뜨렸다. 이미 베테랑 기마병 셋이 갈비뼈가 부러져 들것에 실려 나간 뒤였다. 경매상들은 마취 화살을 든 사수들에게 사격 신호를 보냈다.

“저놈은 말이 아니라 지옥의 괴물이다! 더 이상 피해가 나기 전에 독화살로 기절시켜 가죽이라도 벗겨야겠다!”

사수들이 활시위를 당기려는 찰나, 카단은 빈손으로 울타리 안으로 걸어 들어갔다.

그는 고삐를 억지로 잡으려 하지 않았다. 말이 지칠 때까지 일정한 거리를 두고 나란히 달렸고, 말이 멈추면 자신도 멈춰 섰다. 별의 호흡을 실어 거친 콧김을 어루만지자, 해가 기울 무렵 야생마가 먼저 다가와 코끝을 카단의 어깨에 부드럽게 비볐다. 카단은 그 말을 `페가수스`라 이름 붙였다.

경매상은 뻔뻔스럽게 계약서를 내밀며 거액의 말값을 요구했다. 카단은 야생마를 덫으로 가둬 둔 자가 어째서 주인이냐고 차분히 따져 물었다. 실랑이를 지켜보던 페가수스가 앞발을 구르며 경매상의 탁자를 부수자 상인들은 비명을 지르며 달아났다.

말을 몰고 도성 외곽의 장가구 시장에 들어섰을 때, 카단은 남루한 털망토를 뒤집어쓴 작은 거지를 보았다. 빵을 훔쳤다는 누명을 쓰고 험상궂은 상인들에게 둘러싸여 매질을 당하기 직전이었다. 카단은 망설임 없이 은화를 던져 상인들을 물리고, 거지에게 따뜻한 감자 수프와 갓 구운 호밀빵을 사주었다. 여섯 스승이 노잣돈을 아껴 쓰라 신신당부했으나, 카단은 떨고 있는 아이에게 자신이 걸치고 있던 모피 외투까지 벗어 덮어주었다.

거지는 수프를 허겁지겁 먹지 않았다. 먼저 그릇을 들어 향을 맡고 숟가락으로 바닥을 가볍게 한 번 저었다. 값싼 국물에 수면초를 넣어 손님의 돈을 빼앗으려는 사기꾼 식당의 수작을 단숨에 간파한 것이었다.

“낯선 사람을 너무 믿는 거 아니야?”

거지가 톡 쏘아붙였다. 카단이 싱긋 웃으며 대답했다.

“너는 세상 그 누구도 믿지 않는 것 같은데.”

두 사람은 잠시 서로의 눈을 빤히 바라보다가 동시에 푸하하 웃음을 터뜨렸다. 같은 아픔을 정반대 방향에서 안고 살아온 두 청춘의 첫인사였다.

“남쪽 사람들은 전부 너처럼 쉽게 속아 넘어가는 바보들이야?”

거지가 고개를 갸웃거리며 물었다.

“배고픈 척까지 하면서 수프 한 그릇을 얻으려는 사람이라면, 정말로 배가 몹시 고픈 사람이겠지.”

거지는 어이가 없다는 듯 고개를 저었다. 자신을 `실리아`라고 소개한 그녀는 카단이 어디로 가는지, 누구를 찾는지 꼬치꼬치 캐물었다. 카단은 숨김없이 여섯 스승의 가르침과 아버지의 유언을 전했다.

두 사람이 시장 골목을 빠져나오자, 페가수스를 노리던 마수 사냥꾼 여덟 명이 길을 가로막았다. 카단이 검을 뽑기도 전에 실리아가 가볍게 손가락을 튕겼다. 맑은 돌풍이 허공을 가르며 사냥꾼들의 올가미 밧줄을 모조리 베어버렸고, 골목길의 과일 상자들이 와르르 무너지며 적들을 덮쳤다.

“너, 평범한 거지가 아니구나.”

카단이 놀라 묻자 실리아가 턱을 치켜들며 쏘아붙였다.

“너도 평범한 바보는 아니네.”

두 사람은 함께 도성 남문으로 향했다. 성문 앞 거대한 광장에는 높다란 결투대가 세워져 수천 명의 인파가 모여 있었다. 떠돌이 기사 발보가 양녀 엘리아나의 배필을 찾는다며 무투 대회를 연 자리였다. 그러나 엘리아나는 남에게 떠넘겨지는 나약한 상품이 아니었다. 그녀는 수정 활과 덩굴 룬을 자유자재로 다루며 오만한 도전자들을 단숨에 무대 밖으로 걷어찼다.

바로 그때, 눈이 멀 것 같은 찬란한 금빛 갑옷을 입은 청년 무사가 호위대를 거느리고 나타났다. 붉은 유리 궁정의 황자이자 백색 화염의 검객, 이그니스였다.

이그니스는 결투대에 오르기 전 관중들의 열광적인 환호를 오만하게 즐겼다. 그가 손을 한 번 들 때마다 황실 문장이 수놓아진 붉은 깃발들이 일제히 나부꼈다. 이그니스는 엘리아나와의 혼인 따위에는 관심이 없었다. 단지 자신이 대륙에서 가장 강하다는 사실을 만천하에 과시하고 싶을 뿐이었다.

엘리아나는 맹렬한 불길을 피해 도약하며 연달아 세 발의 화살을 쏘아 보냈다. 이그니스는 첫 화살을 검기로 태우고 둘째 화살을 맨손으로 낚아챘으나, 셋째 화살이 그의 화려한 왕관 장식을 꿰뚫어 바닥에 떨어뜨렸다. 순간 이그니스의 눈빛이 차갑게 가라앉았다. 이그니스의 대검에서 뿜어져 나온 거대한 백색 불기둥이 결투대 바닥을 녹이며 엘리아나를 집어삼켰다.

“붉은 유리 궁정의 황자 이그니스다.”

실리아의 목소리가 서늘하게 가라앉았다. 결투에서 승리한 이그니스는 쓰러진 엘리아나의 손을 잡아 일으키기는커녕, 혼인은 천민들의 저열한 소꿉놀이에 불과하다며 차가운 발길질로 그녀의 비단신을 결투대 아래 진흙탕으로 걷어차 버렸다.

군중들이 숨을 죽인 그 순간, 카단이 결투대 위로 성큼 걸어 올라갔다. 스승들은 남의 싸움에 함부로 끼어들지 말라고 경고했으나, 카단은 이그니스의 발밑에 떨어진 엘리아나의 신발을 주워 소매로 정성껏 흙을 닦아냈다.

“이겼다면 더 이상 네 힘을 증명할 필요가 없을 텐데. 패자를 어찌하여 모욕하는가?”

카단의 조용한 음성이 결투장 전체에 무겁게 내려앉았다. 이그니스는 카단의 허리춤에 걸린 단검 자루의 붉은 끈과 고대 성기사단의 룬 문양을 노려보았다. 이유를 알 수 없는 격렬한 분노와 위화감이 이그니스의 가슴속에서 치밀어 올랐다. 두 아버지 알렉산다르와 발리안이 맹세했던 피의 약속이, 마침내 두 아들의 운명적인 시선 속에서 불꽃을 튀기기 시작한 순간이었다."""

EP08_EN = """SNSHero Novel
Episode 08: Rider of the Crimson Mane

Leaving behind the barren bluffs of the Wildlands and riding into the undulating southern plains, the biting northern frost yielded to a warm southern wind scented with lush clover. Carrying Fenrir's royal transit seal and guided by the silent blessings of his six masters, young Kadan arrived at the Crimson Valley livestock market, the bustling trade hub of southern horse caravans. Surrounding a colossal timber corral, hundreds of drovers, armor-mongers, and mercenaries shouted in excitement. In the middle of the enclosure raged a wild stallion possessing a mane like blazing sunset embers.

The beast refused all bridles, kicking seasoned cavalrymen with such ferocious force that their steel breastplates caved in like hammered tin. Three drovers had already been carried out on stretchers with cracked ribs. Shaking his head, the chief auctioneer raised his hand to signal marksmen armed with heavy sleep-draught crossbows.

"The creature is no horse, but a fiend born of sulfur!" the auctioneer barked. "Shoot it down before it breaks another spine! We take its hide to recoup the loss!"

Before the marksmen could release their triggers, Kadan slipped through the corral gate alone and empty-handed.

He made no violent attempt to seize the halter. Matching the stallion's gait, Kadan ran alongside the beast at an unvarying distance, slowing when the horse slowed, stopping when it turned. Breathing the tranquil cadence of the celestial stars, Kadan exhaled gently toward the stallion's flaring nostrils. As dusk painted the prairie gold, the wild steed stepped forward of its own accord, resting its velvet muzzle softly against Kadan's shoulder. Kadan named the stallion Pegasus.

The auctioneer stepped forward, waving a deed and demanding an exorbitant sum of gold. Kadan asked calmly how a man who merely ensnared a wild creature in an iron trap could claim true ownership of its soul. Hearing the dispute, Pegasus stamped a mighty forehoof, crushing the auctioneer's timber desk to splinters and sending the traders scattering in panic.

Entering the bustling markets on the capital's perimeter, Kadan observed a small beggar child clad in a frayed wool mantle, cornered by shouting merchants and accused of stealing bread. Drawing three silver coins from his purse, Kadan settled the dispute, purchasing a piping bowl of potato soup and fresh rye loaves for the child. Though his six masters had counseled him to hoard his copper coins, Kadan removed his own warm sheepskin mantle, wrapping it around the shivering youngster's shoulders.

The beggar did not gulp the soup down blindly. Lifting the earthenware bowl, the child inhaled the steam and stirred the bottom with a wooden spoon, instantly identifying the trace of sleeping-weed added by crooked tapsters to drug wealthy travelers.

"You trust strangers far too readily, hedge-knight," the beggar remarked sharply.

Kadan smiled, resting his knuckles upon the bench.

"And you seem to trust no living soul beneath the heavens."

The two studied each other's gaze in silence before bursting into shared, bright laughter—a meeting of two spirits who carried the scars of the world from opposite extremes.

"Are all southern folk such gullible simpletons?" the beggar asked, tilting her head.

"If a soul goes to the lengths of feigning starvation to win a bowl of soup, then surely that soul is genuinely hungry."

The beggar shook her head in wry amusement. Introducing herself as Silia, she questioned Kadan relentlessly on his origin, his masters, and the path he walked. Kadan concealed nothing, speaking of his father's broken legacy and the vow of his masters.

As they emerged into the alleyway, eight horse-thieves lunged from the shadows to seize Pegasus. Before Kadan could bare his steel, Silia snapped her fingers. A sharp gale sliced through the twilight, severing the thieves' hemp ropes like cobwebs and toppling fruit crates across the ambushers.

"You are no ordinary beggar," Kadan observed in wonder.

Silia tilted her chin with a mischievous grin.

"And you are no ordinary fool."

Together they walked toward the southern gate of Sevenbridge. Upon the paved plaza stood a raised wooden tourney platform surrounded by thousands of cheering citizens. The wandering knight Balbo was hosting an open duel to find a suitor for his adopted ward Eliana. Yet Eliana was no helpless prize; wielding a crystal bow and vine runes, she hurled boastful knights off the sands with effortless grace.

Suddenly, an armored prodigy clad in blinding gilded plate arrived beneath the banners of the royal guard. It was Ignis, champion of the Red Glass Court and wielder of pure white flame.

Ascending the steps, Ignis basked in the roaring adoration of the nobility. With a wave of his hand, crimson tapestries unfurled across the galleries. He had no desire for marriage; he sought only to prove his absolute supremacy beneath the southern sun.

Evading his white inferno, Eliana loosed three enchanted arrows. Ignis incinerated the first with his sword-aura and caught the second bare-handed, but the third arrow severed his golden crown ornament, sending it clattering across the boards. Ignis's eyes turned to cold fury. A colossal pillar of white fire erupted from his greatsword, melting the timber floor and sweeping Eliana into the sand.

"Behold Ignis, Crown Prince of the Red Glass Court!"

Silia's whisper turned frigid. Standing victorious, Ignis offered no hand to help the fallen maiden, declaring marriage a vulgar pastime of peasants before kicking Eliana's embroidered silk slippers into the mire.

Amidst the stunned silence of the spectators, Kadan vaulted onto the stage. Though his masters had warned him against unnecessary strife, Kadan knelt, picking up Eliana's slipper and gently wiping the mire with his sleeve before returning it to the weeping girl.

"If you have triumphed, your strength requires no further proof. Why dishonor the vanquished?"

Kadan's calm voice echoed across the arena. Ignis glared at the scarlet silk cord tied around the hilt of Kadan's silver dagger and the ancient holy order runes carved upon the fuller. An unexplainable fury seized Ignis's chest. The ancient oath sworn between Aleksandar and Balian had collided at last, igniting the spark of an inevitable destiny."""

print("EP08 built. KO len:", len(EP08_KO), "EN len:", len(EP08_EN))
