#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/build_arc1_complete.py
Builds complete, commercial-grade Arc 1 (Episodes 01 - 10) for SNSHero Web Novel.
"""

import sys, os
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

from scripts.novel_batch_1 import EP01_KO, EP01_EN
from scripts.novel_batch1_ep01_05 import EP02_KO, EP02_EN
from scripts.build_arc1_episodes import EP03_KO, EP03_EN, EP04_KO, EP04_EN

# We have EP05_KO (3925 chars, 16 dlgs) and EP05_EN from remediate_arc1_ep01_10
from scripts.remediate_arc1_ep01_10 import EP05_KO, EP05_EN

# Let's define EP06_KO and EP06_EN
EP06_KO = """# 눈히어로 6화 - 별을 호흡하는 법

> 원문 범위: 제11장-제12장

여섯 스승의 가르침은 소년 카단을 매일 서로 다른 극단적인 방향으로 끌어당겼다. 혹한의 와일드랜드 고원 지대를 가로지르는 삭풍 속에서 드워프 대장장이 그림리는 바위처럼 땅에 뿌리를 박고 물러서지 않는 묵직한 하체를 단련하라 호통쳤다. 그의 무쇠 모루 위에서 벌겋게 달아오른 쇳덩이가 튈 때마다 불꽃이 카단의 뺨을 스쳤고, 그림리의 거친 고함이 눈보라를 찢었다.

“도끼와 망치는 잔꾀를 부리지 않아! 쇠를 달군 만큼 단단해지고 부딪친 만큼 불꽃이 튀는 법이다! 발바닥으로 대지를 짓이기고 한 치도 물러서지 마라!”

반면 도박사 카제는 바람의 눈을 속이고 칼끝이 닿기 직전에 몸을 비틀어 달아나는 잔기술을 연마하라 재촉했다. 손가락 사이로 번뜩이는 세 닢의 은화처럼 가볍고 예측할 수 없는 보법을 익히지 못하면 사냥꾼의 덫에 걸린 짐승 꼴을 면치 못하리라는 조롱이었다.

“힘만 쓰는 곰탱이는 결국 덫에 걸려 가죽이 벗겨지는 법이지. 칼끝이 네 목에 닿기 반 치 전에 바람처럼 미끄러져야 진짜 목숨을 건지는 거다.”

마수 사냥꾼 에일라는 활시위를 당길 때 숨을 완전히 멈추어 심장의 고동마저 지워야 한다고 가르쳤다. 차가운 서리 바위 위에 엎드려 반나절 동안 눈꺼풀 하나 깜빡이지 않고 사냥감을 노려보는 고요함이야말로 궁수의 영혼이라는 것이었다. 그러나 뱃사공 론돌은 그 말을 들을 때마다 물결무늬 지팡이로 눈밭을 내리치며 고개를 저었다. 숨이란 대해의 파도처럼 쉼 없이 밀려오고 나가야만 전신의 피가 돌고 스태미나가 마르지 않는 법인데, 어찌 억지로 숨을 멈추어 스스로를 질식시키느냐는 반박이었다.

“숨을 멈추면 피가 굳고 근육이 얼어붙소! 물길을 거스르지 말고 파도에 몸을 맡기듯 자연스럽게 흘려보내야 하오!”

약제사 엘리아나는 살갗을 스치는 미세한 마나의 독기를 혀끝으로 맛보듯 감지하라 일렀고, 맹인 추적자 가웨인은 귀를 닫고 발바닥을 울리는 지맥의 떨림만을 믿으라 경고했다.

카단은 스승들의 가르침 중 어느 하나도 소홀히 여기지 않으려 피나는 노력을 거듭했다. 동이 트기 전부터 시작된 훈련은 밤하늘에 별이 질 때까지 이어졌다. 그러나 실전 대련에 들어서면 여섯 갈래의 무공 원리가 소년의 몸속에서 사납게 충돌하며 사지를 굳어버리게 만들었다. 그림리의 무게를 실으려 하면 카제의 보법이 꼬였고, 에일라의 침묵을 지키려 하면 론돌의 호흡이 막혔다. 열다섯 살이 되던 해 겨울, 카단은 가장 기초적인 삼단 방패막기 동작조차 매끄럽게 연결하지 못한 채 차가운 눈밭 위로 보기 흉하게 굴러떨어졌다.

“손목에 힘이 너무 들어가 있어! 방패는 쇳덩이가 아니라 살아 숨 쉬는 가죽이어야 한단 말이다! 네 아비 알렉산다르는 두 자루 칼을 쥘 때 날아가는 독수리의 깃털처럼 가볍게 쥐었단 말이다!”

그림리가 거칠게 침을 뱉으며 눈보라 속으로 돌아서자, 카단은 얼어붙은 눈밭에 엎드린 채 홀로 뜨거운 눈물을 삼켰다. 여섯 스승이 목숨을 걸고 자신을 지켜준 은혜를 헛되이 낭비하고, 영웅이었던 아버지의 이름에 먹칠을 하고 있다는 자괴감이 어린 가슴을 날카롭게 후벼 팠다.

그날 밤, 숙영지의 모닥불이 잦아들고 모두가 깊은 잠에 빠진 시각, 카단은 홀로 천막을 빠져나왔다. 소년은 캠프 뒤편을 병풍처럼 둘러싸고 있는 천 길 높이의 깎아지른 빙벽 앞에 섰다. 날카로운 고드름과 영구동토의 얼음이 거울처럼 번뜩이는 절벽이었다.

소년은 맨손으로 절벽을 오르기 시작했다. 바위틈에 손가락을 쑤셔 넣을 때마다 손톱 밑이 깨져 피가 흘렀고, 미끄러운 얼음벽에 무릎이 부딪쳐 찢겨 나갔다. 그러나 살점을 에는 육체의 고통이 가슴속을 짓누르는 수치심보다 훨씬 견디기 쉬웠다.

절벽 중턱의 좁은 바위 난간에는 어미를 잃은 북방 매의 둥지가 위태롭게 걸려 있었다. 어미 새가 밀렵꾼의 덫에 걸려 목숨을 잃은 뒤, 갓 태어난 새끼 두 마리가 영하의 칼바람 속에서 굶주림에 떨며 울고 있었다. 날개 없는 인간이라면 결코 기어오를 엄두를 내지 못할 아찔한 낭떠러지였다.

다섯 번을 미끄러지고 바닥으로 굴러떨어져 온몸이 피투성이가 된 채 가쁜 숨을 몰아쉬던 카단의 등 뒤에서, 맑고 차분한 노인의 음성이 어둠을 뚫고 들려왔다.

“너는 오직 팔다리의 근육과 뼈의 힘으로만 절벽을 오르려 하는구나, 아이야. 그러니 산이 너를 밀어내는 것이다.”

카단이 화들짝 놀라 뒤를 돌아보았다. 이끼 낀 낡은 거친 모직 망토를 두르고 개암나무 지팡이를 짚은 노인, 북방 황야의 전설적인 은둔자 말퓨온이 바위 그림자 아래 서 있었다. 카단이 이마에 흐르는 피를 소매로 닦아내며 가쁘게 헐떡였다.

“산이... 사람을 거부할 수도 있는 겁니까?”

“천지 만물의 호흡에 귀를 기울이지 않고 제 고집으로만 부딪치는데, 산인들 어찌 너의 무례한 발길을 너그럽게 받아주겠느냐? 네 손에 쥔 칼과 방패도 이와 조금도 다르지 않다.”

말퓨온은 지팡이를 짚은 채 맨발로 가파른 수직 빙벽을 걸어 올라갔다. 놀랍게도 노인의 맨발이 닿는 곳마다 차가운 얼음 위로 푸른 산이끼가 기적처럼 돋아나며 발디딤을 단단히 붙잡아 주었다. 둥지 속 새끼들에게 품속에서 꺼낸 말린 말고기를 찢어 먹이고 내려온 말퓨온은 카단을 그윽한 눈빛으로 응시했다.

“사흘 뒤 보름달이 뜰 때, 저 봉우리 가장 높은 정상 바위로 오너라. 스승들에게는 아무 말도 하지 말고 홀로 오너라.”

카단은 사흘 밤낮 동안 밧줄 묶기와 발 디딤새를 홀로 연마했다. 마침내 약속된 보름달 밤, 소년은 살을 에는 눈보라를 뚫고 피투성이가 된 열 손가락으로 바위를 기어올라 달이 중천에 걸리기 전 바위산 정상에 도달했다.

말퓨온은 칼도 방패도 없이 차가운 평평한 바위 위에 결가부좌를 틀고 앉아 있었다.

“앉아라, 카단. 눈을 감고, 숨을 들이쉴 때마다 밤하늘의 샛별 하나를 가슴속에 모아들이고, 숨을 내쉴 때마다 발밑의 대지로 눈송이 하나를 돌려보내라.”

노인은 마나란 혈관을 억지로 쥐어짜내는 파괴적인 완력이 아니라, 인간의 맥박을 대륙의 고동과 조화롭게 맞추어 나가는 거대한 선율이라고 설명했다.

“남쪽 붉은 유리 궁정에선 발리안의 아들 이그니스가 태어날 때부터 순백의 불꽃을 품고 매일 파괴적인 화염 무공을 쌓아가고 있다. 그러나 메마른 장작을 태우는 불길은 결국 잿더미만을 남길 뿐이지. 네가 익혀야 할 힘은 결코 꺼지지 않는 별들의 숨결이다.”

소년은 스승들의 상반된 가르침이 서로 대립하는 것이 아니라, 대륙의 계절처럼 하나의 순환이라는 사실을 비로소 깨달았다. 그림리의 바위 같은 묵직함은 들이쉬는 숨의 중심이었고, 카제의 날렵한 비검은 내쉬는 숨의 끝자락이었으며, 론돌의 파도와 에일라의 고요함은 그 사이를 잇는 잔잔한 여울이었다.

말퓨온은 가혹하리만치 엄격하게 호흡의 중심을 바로잡아 주었다. 카단의 숨결이 조금이라도 흐트러지면 단단한 개암 열매를 던져 이마를 쳤고, 집중이 지나쳐 주변을 잊으면 날카로운 화두를 던졌다.

“별을 세느라 등 뒤에 선 동료의 발소리를 놓친다면, 그 방패는 대체 누구를 위한 것이냐?”

카단은 깊이 고개를 숙이며 자신의 가슴을 만졌다.

“제 방패는 제 목숨을 지키기 위함이 아니라, 등 뒤에서 추위에 떨고 있는 사람들의 온기를 지키기 위함입니다.”

말퓨온이 빙그레 웃으며 고개를 끄덕였다.

“그 마음을 잊지 마라. 그것이야말로 천하를 품는 방패의 참된 본질이다.”

세 달의 수련이 끝난 어느 새벽, 카단이 스승들의 가죽 천막으로 조용히 돌아왔을 때, 맹인 추적자 가웨인이 지팡이를 멈추고 고개를 돌렸다. 소년의 발소리는 자갈 위에서 한 점의 소리도 내지 않았고, 그의 숨결은 아침 산바람과 완벽하게 동화되어 있었다.

“발소리가 바람 속에 녹아들었구나, 카단. 밤마다 어디를 다녀왔는지는 묻지 않겠다. 다만 그 힘을 남에게 뽐내려 들면 네 두 다리를 분질러 놓을 테니 그리 알아라.”

에일라 역시 모닥불 옆에서 쇠뇌 손잡이를 닦으며 부드럽게 미소를 지었다.

“눈빛이 달라졌구나, 카단. 이제야 네 눈에 대륙의 새벽빛이 담겼어.”

그림리도 무쇠 망치를 어깨에 얹으며 껄껄 웃었다.

“그래, 꼬마야! 뼈마디가 조금 단단해진 것 같군! 내일부터 다시 모루 앞으로 나와라!”

스승들의 칭찬 속에서 카단은 조용히 미소 지었다. 마침내 소년의 방패에 별들의 호흡이 깃들기 시작한 순간이었다."""

EP06_EN = """SNSHero Novel
Episode 06: The Art of Breathing Stars

The divergent teachings of the six masters pulled young Kadan in conflicting directions every single day. On the frozen plateau of the Wildlands, Grimli the dwarven smith roared at him to root his boots like an immoveable granite boulder, while Kaze the gambler urged him to deceive the eye and twist away before a blade could make contact. Aila the Demon Hunter commanded him to halt his breath entirely before drawing the string to erase his heartbeat, yet Rondol the boatman insisted that breath must flow incessantly like ocean swells lest his stamina wither. Eliana counseled him to discern poisonous spores, and Gawain the blind tracker told him to seal his ears and trust only the tremors beneath his boots.

"Axes and hammers know no deception!" Grimli roared across the gale. "Tough as iron forged upon the anvil, yield not an inch of loam!"

"A clumsy bear gets skinned in a pit-trap," Kaze mocked, spinning three silver marks between his scarred knuckles. "Slip past the blade half an inch before it bites your neck!"

"Hold your breath till the pulse fades," Aila whispered with glacial precision. "Only unbroken stillness pierces the shadows."

"Nay, stillness breeds stagnant blood!" Rondol argued, striking his wave-carved staff upon the drift. "Ride the surges as an oarsman rides the breakers!"

Kadan strove desperately to master each doctrine, yet in practice, the disparate disciplines collided, reducing his swordcraft to clumsy chaos. Even upon turning fifteen, the youth could not execute a basic three-step shield parry without tumbling into the snow.

"Your wrist is clenched like an iron bar! Your father Aleksandar held his twin blades as light as eagle down!"

When Grimli cursed and stalked away into the swirling snow one winter night, Kadan swallowed his bitter tears alone. The agonizing shame that he was squandering his masters' sacrifices and dishonoring his father's memory clawed at his chest. Venturing into the freezing darkness, Kadan began scaling the sheer ice-crusted bluffs above the camp. Freezing rime tore beneath his fingernails and blood welled from his scraped knees, yet the physical sting was far gentler than the shame in his soul.

Upon a narrow limestone ledge halfway up the cliff rested the aerie of a northern mountain hawk. Its mother having perished in a trapper's snare, two newly hatched chicks were whimpering in starvation against the frost. It was a dizzying precipice that no wingless mortal could hope to scale.

After slipping and tumbling from the rock face five times, battered and gasping for air, Kadan heard a calm voice speaking from the rock shadow below. An old hermit cloaked in moss-green wool stood leaning upon a crooked hazel staff. It was Malfurion.

"You climb with brute muscle alone, child. That is why the mountain rejects you."

Wiping blood from his forehead, Kadan rasped.

"Can a cliff... truly reject a man?"

"If you refuse to listen to the breath of the world, why should the mountain heed your clumsy struggles? The same is true of the steel in your hand."

Without touching the rock with his hands, Malfurion walked lightly up the sheer vertical wall. Wherever his bare boots stepped, vibrant green moss bloomed from the ice, anchoring his tread upon the slick glaze. Gently gathering the starving chicks into his cowl and feeding them dried venison, the hermit descended and fixed Kadan with an unblinking gaze.

"Three nights hence, when the full moon crests the ridge, meet me at the summit. Speak of this to no one."

For three days Kadan drilled knotcraft and foot placement obsessively. On the appointed night, Kadan spent half the hours of darkness clawing through the blizzard until he dragged his frozen limbs onto the windy peak before the moon could set.

Malfurion sat cross-legged on the summit stone, carrying neither sword nor cudgel.

"Sit, Kadan. Close your eyes. With each inhalation, gather a solitary star into your heart. With each exhalation, return a snowflake to the loam."

Malfurion explained that mana was not an internal fuel to be squeezed from strained sinews, but an acoustic cadence harmonizing the body with the pulse of the continent.

"In the southern Red Glass Court, Balian's son Ignis was born blessed with fierce white flame, amassing destructive arts with every sunrise. Yet raw fire leaves only ash when the fuel burns out. What you must cultivate is the unquenchable breath of the stars."

Kadan finally understood: Grimli's boulder-like weight, Kaze's lightning feints, and Aila's quiet stillness were not contradictory doctrines, but different tempos of the celestial sphere.

Malfurion offered no flattery. If Kadan's breath wavered, he flicked a hardened hazelnut against the youth's brow. When concentration drifted into isolation, he posed abrupt riddles.

"If you count the stars so intently that you miss the tread of your comrade behind you, whom does that shield protect?"

Kadan bowed his head, placing a palm over his breast.

"My shield exists not to preserve my own breath, but to shield the warmth of those trembling behind me from the bitter gale."

Malfurion nodded with a serene smile.

"Hold fast to that truth. Therein lies the true soul of an unbreakable shield."

When Kadan finally returned to the hunters' yurt, Gawain paused his staff upon the shale, turning his blind eyes in astonishment. Kadan's footsteps made no sound upon the gravel, his breathing indistinguishable from the mountain breeze.

"Your footsteps have melted into the gale, Kadan. I shall not pry into where you wander at night. But if you dare brandish this newly found power in vanity, I shall break your legs myself."

Aila wiped her crossbow by the hearth, her lips softening with sisterly warmth.

"Your gaze has deepened, Kadan. The light of the morning star shines in your eyes."

Grimli hoisted his maul with a booming chuckle.

"Aye, lad! Your bones have found their iron. Return to my anvil tomorrow!"

At last, the breath of the cosmos had entered the young warrior's shield."""

print("EP06 KO len:", len(EP06_KO))
print("EP06 EN len:", len(EP06_EN))

EP07_KO = """# 눈히어로 7화 - 배신자들의 천막

> 원문 범위: 제13장-제14장

와일드랜드의 대평원을 휘감던 모닥불 연기가 잦아들 무렵, 북방의 하늘은 금방이라도 폭설을 쏟아낼 듯 짙은 잿빛 먹구름으로 뒤덮여 있었다. 남쪽으로 떠나기 전 마지막 밤, 열여덟 살의 건장한 청년으로 자라난 카단은 은둔자 말퓨온과 함께 와일드랜드 외곽의 깎아지른 현무암 능선을 은밀히 가로질렀다. 메두사 고르고의 불길한 마나 흔적을 쫓기 위함이었다. 고르고는 유목 부족의 위대한 패자 펜릴의 본진 숙영지에서 불과 반 리 떨어진 버려진 유황 폐광산 동굴 속에 숨어들어 있었다. 그녀는 스승 에올루스에게서 훔쳐낸 `나인섀도우 코덱스`의 암흑 룬을 바위벽에 음각하며 광기 어린 주술을 연마하고 있었다. 검붉은 사슬채찍이 칠흑의 바위를 내리칠 때마다 돌 속에 잠들어 있던 대지의 마나가 바싹 말라붙으며 은백색 소금 결정으로 부서져 내렸다.

말퓨온과 카단이 차가운 바위 틈새에 몸을 숨기고 숨을 죽인 바로 그 순간, 폐광 입구로 검은 모직 망토를 깊게 뒤집어쓴 의문의 기마대 여덟 필이 말에서 내렸다. 놀랍게도 말에서 내린 사내는 펜릴의 의형제이자 부족의 제2인자인 맹장 바르가스트였다. 더욱 경악스러운 것은 어둠 속에서 그를 마중 나온 자의 화려한 복색이었다. 가슴팍에 진홍빛 화염 문양이 금실로 수놓아진 붉은 유리 궁정의 고위 사절 루시안의 밀사였다.

“약조한 거사일이 바로 내일 밤이다. 펜릴의 저녁 축제 술잔에 약제사 엘리아나의 정화 비방으로도 풀 수 없는 그림자 마비 독을 섞어 둘 것이다. 펜릴이 쓰러지는 즉시 부족 전사들을 모조리 섀도우렐름의 깃발 아래 집결시키겠다.”

바르가스트의 쉰 목소리가 동굴 암벽을 타고 흘러나왔다. 붉은 옷의 사절이 비열한 미소를 지으며 무거운 금화 주머니와 붉은 밀랍으로 봉인된 양피지 서한을 건넸다.

“훌륭하다. 펜릴만 제거된다면 이 광활한 황야는 우리 루시안 경의 손아귀에 떨어질 것이다. 발리안의 아들 이그니스가 황궁의 백색 화염 기사단을 이끌고 북상할 때, 네가 첫 번째 맹주로 추대될 것이다.”

사절의 입에서 발리안과 이그니스의 이름이 흘러나오자 카단의 심장이 거세게 요동쳤다. 더 이상 지체할 수 없었다. 카단은 말퓨온의 눈짓을 따라 바위틈을 빠져나와 펜릴의 대군영을 향해 말머리를 돌렸다.

그러나 유목 부족의 중심 대천막에 당도했을 때, 카단이 마주한 것은 신뢰 대신 차가운 의심의 장벽이었다. 거대한 백은 늑대 가죽 왕좌에 앉아 있던 맹주 펜릴은 열여덟 살 어린 방랑 전사의 다급한 고변을 듣고도 오랜 의형제를 쉬이 의심하지 못했다.

“바르가스트는 나와 함께 십 년 동안 피를 흘리며 북방의 마수들을 토벌한 내 피붙이 같은 아우다! 일개 떠돌이 전사의 세치 혀에 놀아나 내 심장을 바친 형제를 참소하란 말이냐?”

펜릴의 포효가 천막을 뒤흔드는 찰나, 천막 장막을 젖히며 바르가스트가 피 묻은 칼을 차고 호위병들을 이끌며 성큼 걸어 들어왔다.

“맹주 형님! 저 늙은 약초꾼과 애송이가 바로 남쪽 붉은 유리 궁정에서 보낸 간악한 첩자들입니다! 제가 폐광에서 놈들을 미행하다 궁정 사절과 밀담을 나누는 현장을 덮쳤으나 아쉽게도 놈들이 먼저 달아났습니다!”

바르가스트의 뻔뻔스러운 적반하장에 천막 안의 부족 족장들이 술렁였다. 사태는 걷잡을 수 없이 악화되어, 억울하게도 노인 말퓨온이 궁정의 첩자라는 누명을 쓰고 무거운 무쇠 족쇄에 결박되었다.

말퓨온은 쇠사슬에 묶인 채로도 한마디 변명조차 하지 않고 카단을 지그시 응시했다. 남의 권위나 분노에 기대지 말고, 오직 스스로 단련한 눈과 귀로 진실을 밝혀내라는 무언의 시험이었다.

카단은 떨리는 심호흡을 가다듬으며 천막 중앙으로 성큼 걸어 나갔다.

“맹주님, 사람의 입에서 나오는 거짓말을 믿지 마시고, 눈앞에 놓인 대지의 증거를 보십시오.”

카단의 목소리는 차분했으나 별의 호흡이 실린 묵직한 공명이 천막 안의 소음을 단숨에 제압했다.

“바르가스트의 가죽 장화 굽을 보십시오. 폐광 바닥에만 고여 있는 유황빛 흑요석 진흙이 그대로 묻어 있습니다. 그리고 그의 허리춤에 찬 묵직한 가죽 주머니에서 흘러나오는 냄새를 맡아보십시오. 그것은 우리 북방의 은화 냄새가 아닙니다. 붉은 유리 궁정의 지하 용암 수로에서 제련된 진홍빛 황금 주화의 독한 유황 냄새입니다!”

“이 미천한 놈이 감히!”

바르가스트가 당황하여 칼을 뽑아 카단의 목을 베려 쇄도했다. 그러나 카단은 번개처럼 몸을 날려 그의 손목을 꺾고 허리춤의 전대를 바닥에 내리쳤다.

짤랑!

전대가 터지며 쏟아진 것은 북방의 화폐가 아니었다. 붉은 유리 궁정의 인장이 선명하게 찍힌 황금 주화 수백 닢과 루시안의 밀서였다. 펜릴의 두 눈이 분노로 이글거렸다.

“바르가스트... 네놈이 정녕 내 등에 비수를 꽂으려 했단 말이냐!”

정체가 탄로 난 바르가스트는 품속에서 독단검을 꺼내 펜릴의 목덜미를 향해 내리찍었다. 그러나 그 칼날이 펜릴의 살갗에 닿기 직전, 카단의 무쇠 방패가 허공을 가르며 날아와 바르가스트의 흉통을 강타했다.

쿠웅!

단련된 별의 호흡이 실린 방패 일격에 바르가스트는 천막 기둥을 부수며 나가떨어졌다. 결박을 푼 말퓨온이 지팡이 끝으로 바르가스트의 마나 혈도를 짚어 반역자를 완벽히 제압했다.

펜릴은 바닥에 뒹구는 밀서를 움켜쥐고 온몸을 부들부들 떨었다. 만약 카단이 아니었다면 내일 밤 자신은 물론 부족 전체가 도륙당했을 터였다. 맹주는 천막을 울리는 거친 목소리로 카단의 어깨를 으스러지도록 쥐었다.

“어린 사자여... 내가 어리석은 눈으로 네 충정을 의심했구나. 네가 내 목숨과 우리 부족의 혼을 구했다.”

카단은 조용히 머리를 숙였다.

“약속을 지키는 것은 체면이 아니라, 사람이 사람답게 살아가는 도리이기 때문입니다.”

어둠이 걷히고 새벽빛이 와일드랜드의 지평선을 붉게 물들일 때, 펜릴은 자신의 최고 군마와 황야의 통행패를 카단의 손에 쥐여 주었다. 남쪽으로 향하는 소년의 길 앞에, 마침내 대륙의 거대한 소용돌이가 입을 벌리고 있었다."""

EP07_EN = """SNSHero Novel
Episode 07: The Traitors Camp

As the campfires across the Wildlands burned low, the northern sky choked beneath slate-colored storm clouds heavy with impending snow. On their final night before departing southward, the eighteen-year-old warrior Kadan and the hermit Malfurion stealthily traversed the basalt ridges beyond the encampment. They tracked the venomous mana spoor of Medusa Gorgo. Lurking within an abandoned sulfur mine half a league from Great Chieftain Fenrir's royal pavilion, Gorgo carved forbidden runes stolen from the Nine Shadow Codex into the bedrock. Wherever her barbed chain lashed the stone, the vital mana of the earth withered into brittle salt-frost.

Concealed within a rock fissure, Kadan and Malfurion held their breath as eight cloaked riders dismounted at the shaft entrance. It was Bargast, sworn blood-brother to Fenrir and second-in-command of the northern tribes. Even more startling was the attire of the courier greeting him from the cavern dark: an envoy of Prince Lucian from the southern Red Glass Court, his scarlet tabard embroidered with gold flames.

"The hour is struck for tomorrow night's feast," Bargast rasped. "I have mingled shadow-paralysis poison into Fenrir's mead horn—a draught even Eliana's secret salves cannot purge. Once Fenrir collapses, the entire horde gathers beneath the Shadow Realm's banner."

The court emissary smiled thinly, passing a heavy coin purse and a parchment sealed in crimson wax across the flags.

"Splendid. With Fenrir slain, the northern wastes fall into Lord Lucian's grasp. When Balian's son Ignis marches north at the head of the White Flame Paladins, you shall be crowned paramount warlord."

Hearing the names of Balian and Ignis, Kadan's pulse hammered against his ribs. Signaling to Malfurion, Kadan slipped from the shadows and raced back toward Fenrir's grand pavilion.

Yet when he burst into the council, Kadan was met not with gratitude, but with icy suspicion. Seated upon his silver-wolf throne, Fenrir refused to entertain betrayal from an eighteen-year-old wanderer against his veteran brother-in-arms.

"Bargast has bled beside me for ten winters hunting northern beasts!" Fenrir roared. "Shall I condemn my own brother upon the wagging tongue of a nameless stripling?"

Bargast strode into the pavilion surrounded by bodyguards, his blade still wet with horse blood.

"Chieftain! This herb-gatherer and his stray cur are spies dispatched by the Red Glass Court! I tracked them to the mines where they conspired with royal couriers, yet they slipped my grasp!"

The chieftains growled in rising fury. Before Kadan could speak, tribal guards seized Malfurion, binding the old hermit in heavy iron chains.

Malfurion made no protest, offering only a steady, piercing gaze toward Kadan. It was a silent trial: prove the truth not through bluster, but through unclouded observation and tempered steel.

Kadan inhaled deeply, stepping into the center of the ring.

"Great Chieftain, trust not words, but the witness of the earth beneath your feet."

Kadan's voice carried the deep harmonic resonance of the celestial breath, silencing the clamor.

"Look upon Bargast's boots. The yellow obsidian clay clinging to his heels exists only upon the floor of the abandoned sulfur mines. And smell the purse at his hip—that is not the grease of northern silver, but the pungent sulfur stench of gold minted in the volcanic canals of the Red Glass Court!"

"Insolent dog!"

Bargast lunged for his blade, but Kadan moved like lightning, twisting the traitor's wrist and smashing the concealed purse against the flags.

Clatter!

Hundreds of crimson gold coins bearing Lucian's personal crest spilled across the rugs, accompanied by the signed pact of betrayal. Fenrir's eyes flared with savage fury.

"Bargast... you would plunge a dagger into my spine?"

Exposed, Bargast whipped out a poisoned stiletto, driving it toward Fenrir's throat. Before the steel could strike, Kadan's heavy iron shield cleaved the air, crashing into Bargast's ribs with the weight of an avalanche.

Crash!

Driven by the breath of the stars, the shield blow threw Bargast across the pavilion, shattering the center cedar pillar. Snapping his iron bonds, Malfurion struck Bargast's mana meridians, subduing the traitor instantly.

Fenrir clutched the traitor's parchment, trembling with rage and awe. Had Kadan not spoken, his entire bloodline would have perished in tomorrow's feast. Gripping Kadan's shoulder with iron fingers, the chieftain bowed his head.

"Young lion... my blind eyes wronged your honor. You have preserved my life and the soul of our horde."

Kadan inclined his head with solemn grace.

"A sacred oath is not kept for vanity, but because it is the manner in which true men live."

As dawn crested the Wildlands, painting the horizon in glorious amber, Fenrir placed the reins of his finest steed and the royal seal of passage into Kadan's hands. Before the young warrior lay the great southern vortex, where the fate of the continent awaited."""

print("EP07 KO len:", len(EP07_KO))
print("EP07 EN len:", len(EP07_EN))
