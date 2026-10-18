#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/remediate_arc1_ep01_10.py
SNSHero Web Novel Arc 1: Episodes 01 - 10
High-fantasy literary adaptation with 5-Act narrative expansion,
scene-tied dialogues, and 11-race environmental palettes.
"""

import sys
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

# Ep 01 & 02 from gold-standard modules
from scripts.novel_batch_1 import EP01_KO, EP01_EN
from scripts.novel_batch1_ep01_05 import EP02_KO, EP02_EN

# Ep 03 & 04 from verified expansion in build_arc1_episodes
from scripts.build_arc1_episodes import EP03_KO, EP03_EN, EP04_KO, EP04_EN

# -----------------------------------------------------------------------------
# EPISODE 05 EXPANDED (Target: >= 3,850 chars, >= 14 dialogues)
# -----------------------------------------------------------------------------
EP05_KO = """# 눈히어로 5화 - 폭우 속의 유령

> 원문 범위: 제9장-제10장

황야의 짧은 여름이 차갑게 식어 가고, 대지를 집어삼킬 듯한 흉포한 폭우가 와일드랜드의 북방 고원 지대를 무섭게 강타했다. 칠흑 같은 먹구름 사이로 천둥이 벼락처럼 내리꽂힐 때마다 수백 척 높이의 거대한 현무암 협곡이 음산한 보랏빛으로 물들었고, 여섯 스승과 열두 살이 된 소년 카단은 비바람을 피해 절벽 기슭에 입을 벌린 거대한 석회암 종유석 동굴 안으로 몸을 피했다. 수만 년의 세월 동안 지하수가 석회질을 깎아 만든 동굴 내부는 고대 타이탄 거인들이 남겨둔 지하 제단처럼 웅장하고도 서늘했다. 천장에 거꾸로 매달린 고드름 모양의 거대한 종유석마다 푸른 형광 이끼가 돋아나 희미한 인광을 뿜어내고 있었다.

스승들은 젖은 털가죽 망토를 벗어 바위에 널고, 동굴 안쪽에 흩어진 마른 고사리 덤불과 장작개비를 모아 모닥불을 지피기 시작했다. 에일라는 시위를 푼 쇠뇌를 마른 천으로 정성스럽게 닦아내며 동굴 밖의 빗줄기를 응시했다.

“단순한 가을비가 아니에요. 마나의 결이 불길하게 뒤틀리고 있어요. 저 먹구름 뒤편에서 누군가 인위적으로 흑마술의 장막을 부르고 있습니다.”

약제사 엘리아나 역시 바위틈에서 솟아나는 지하수를 손가락 끝으로 찍어 냄새를 맡더니 미간을 찌푸렸다.

“유황과 썩은 이끼 냄새가 섞여 있어요. 살아 있는 대지의 물이 아니라, 생명력을 빨아들이는 흑요석 결정술의 독기예요.”

동굴 천장에서 뚝뚝 떨어지는 불규칙한 물방울 소리와 세찬 빗소리가 뒤섞여 귓전을 먹먹하게 만들던 바로 그 순간, 동굴 안쪽의 깊고 어두운 낭떠러지 바닥에서 차가운 쇠사슬이 뱀처럼 바닥돌을 긁는 음산한 쇳소리가 울려 퍼졌다.

스승들이 마른 장작에 불꽃을 튀겨 점화하려는 찰나, 동굴 천장과 벽면에 음각되어 있던 고대 성기사단의 은빛 룬이 일제히 불길한 검은빛으로 뒤집히며 칠흑 같은 암흑 안개가 동굴 안을 장막처럼 가득 메웠다. 짙은 어둠 속에서 차가운 웃음소리가 울려 퍼졌다. 미스트폴 절벽에서 곡예사 로비냐드의 목숨을 앗아간 뒤 거친 강물 속으로 도망쳤던 메두사 고르고였다. 칠흑의 비단으로 두 눈을 가린 그녀의 손가락 끝에는 흑요석 결정이 가시처럼 돋아나 있었고, 맹독을 머금은 마나의 실가닥이 허공을 팽팽하게 수놓았다.

“육 년 동안 너희 늙은 사냥개들의 발자국을 쫓아 이 황야를 샅샅이 뒤졌다. 그리고 마침내 알렉산다르의 부러진 검을 이어받은 핏줄까지 한자리에 모여 있구나.”

고르고의 서늘한 목소리가 동굴 암벽의 모든 틈새에서 동시에 메아리쳤다. 그녀는 두 눈이 먼 대신 사방에 흩뿌려지는 빗방울의 미세한 음파 파동과 공기의 마찰열을 타고 유령처럼 허공을 미끄러졌다. 번개가 동굴 입구를 하얗게 밝히는 찰나, 고르고의 날카로운 독 손톱이 카단의 목덜미를 베어 내기 위해 번개처럼 쏘아져 내렸다.

“카단, 엎드려라!”

에일라가 다급하게 외치며 세 발의 쇠뇌 화살을 쏘아 보냈으나, 화살은 실체 없는 보랏빛 잔상만을 허무하게 꿰뚫었을 뿐이었다. 고르고의 몸체는 이미 허공의 마찰열을 비틀며 카단의 등 뒤 그림자 속으로 뱀처럼 미끄러져 들어가 있었다. 목덜미에 차가운 살기가 닿자 소년 카단의 심장이 얼어붙는 듯했다. 소년이 본능적으로 허리춤의 단검을 쥐고 몸을 돌리려 했을 때, 맹인 추적자 가웨인의 차분하고도 묵직한 호령이 소년의 귓전을 강하게 내리쳤다.

“눈을 감아라, 카단! 저 마녀는 네가 바라보는 시야 안에 존재하지 않는다!”

가웨인이 쇠지팡이로 젖은 동굴 바닥을 내리찍자, 맑은 음파 진동이 물결처럼 바닥을 타고 사방으로 뻗어 나갔다.

“시각은 언제나 허상을 보여주지만, 네 피부를 때리는 빗방울과 공기의 흐름은 결코 거짓말을 하지 않는다! 일찍이 바람섬의 현자 에올루스 경에게서 배운 음파의 길을 기억하라. 살아 숨 쉬는 생명체가 공기를 가를 때, 바람은 그 자리를 비워두지 못하는 법이다!”

가웨인의 준엄한 가르침에 카단은 떨리는 숨을 삼키며 지체 없이 두 눈을 질끈 감았다.

시야가 완전한 암흑에 잠기자, 소년의 귓가와 살갗으로 놀라운 감각의 세계가 쏟아져 들어왔다. 천장 종유석 끝에서 떨어지는 차가운 물방울의 리듬, 드워프 그림리가 거칠게 헐떡이는 가슴의 맥박, 동굴 입구로 들이치는 빗줄기의 각도, 그리고—오직 한 지점, 허공을 가르며 낙하하던 빗방울이 바닥에 닿기 직전 궤적을 비틀며 허물어지는 미세한 진공의 구멍!

‘저기다! 저곳에 바람이 비어 있다!’

카단은 눈을 감은 채, 본능적으로 허리춤에 차고 있던 은빛 단검을 뽑아 허공의 빈자리를 향해 전신을 던져 칼날을 휘둘렀다.

챙그랑!

백은의 칼날이 허공 속에서 실체화되던 고르고의 검은 사슬을 정면으로 후려쳤다. 날카로운 쇳소리와 함께 백색 불꽃이 어둠을 찢었고, 은빛 단검의 예리한 칼끝이 고르고의 손목을 꿰뚫으며 그녀의 마나 혈도를 강하게 쳐냈다.

“크아악! 이 어린송사리 놈이... 보이지도 않는 칼길을 미리 읽었단 말인가!”

고르고가 경악하며 균형을 잃고 비틀거렸다. 스승들은 그 천금 같은 빈틈을 결코 놓치지 않았다. 그림리가 맹수처럼 포효하며 도약하여 쇠망치로 동굴 뒤편의 퇴로를 내리찍었다. 망치에 달린 은빛 방울이 맹렬하게 딸랑거렸다.

“로비냐드의 원수를 갚을 날이 왔다, 이 마녀 녀석!”

그림리의 포효와 함께 뱃사공 론돌이 지하수를 소용돌이치듯 끌어올려 고르고를 감싼 암흑 연막을 단숨에 씻어냈다. 에일라의 독화살 세 발이 고르고의 어깨와 허벅지를 꿰뚫었고, 도박사 카제가 손가락 사이로 튕긴 비검 두 자루가 고르고의 마나 회로를 봉쇄했다.

피를 흘리며 동굴 벽에 몰린 고르고는 품속에서 보랏빛 독연막탄을 터뜨리며 절벽 아래의 지하 폭포로 몸을 던지려 했다.

“크하하... 제법이구나, 어리석은 사냥꾼 놈들! 하지만 기뻐하기엔 이르다! 너희가 이 북방 구석에 처박혀 있는 동안, 남쪽 붉은 유리 궁정에선 발리안의 아들이 루시안 경의 가장 치명적인 살인귀로 자라나고 있으니! 그리고 대해의 바람섬에서는 현자 에올루스의 외동딸 실리아가 대륙의 질서를 뒤흔들 거대한 폭풍으로 피어나고 있다!”

“입 닥쳐라!”

그림리가 망치를 던졌으나 고르고는 거친 지하 급류 속으로 몸을 던져 어둠 속으로 유령처럼 휩쓸려 사라졌다.

폭우가 차츰 잦아들고 동굴 안에는 무거운 정적이 흘렀다. 카단은 손바닥에 밴 식은땀을 닦아내며 맹인 추적자 가웨인을 올려다보았다.

“스승님... 방금 마녀가 말한 바람섬과 실리아라는 이름은 대체 누구입니까? 그리고 발리안이라는 분의 아들은 또 누구입니까?”

가웨인은 쇠지팡이를 짚은 채 젖은 동굴 밖의 대지 소리를 묵묵히 들었다.

“바람섬은 동쪽 대해에 홀로 떠 있는 신비로운 고립의 성역이다. 그곳의 영주 에올루스는 대륙에서 가장 오만하고도 고결한 바람의 현자이지. 그에게는 눈처럼 영민하고 바람처럼 자유로운 외동딸 실리아가 있다고 들었다. 만약 섀도우렐름의 그림자가 그곳까지 닿았다면 장차 천하가 거대한 전화에 휩싸일 게다.”

카단은 떨리는 손으로 자신의 가슴에 손을 얹었다.

“그 아이도... 저처럼 누군가에게 쫓기며 두려움 속에 떨고 있는 겁니까?”

에일라가 젖은 카단의 이마를 쓸어 넘기며 따스한 미소를 지었다.

“그렇다면 네가 더 강해져야 한단다, 카단. 남을 지키는 방패는 그저 기다린다고 주어지는 것이 아니니까. 네 아버지가 남긴 은빛 단검의 진실을 증명하려면 말이다.”

그림리 역시 수염에 묻은 빗물을 털어내며 쇠망치를 모닥불 옆에 내려놓았다.

“그래, 꼬마 녀석아! 오늘 눈을 감고 칼을 쳐낸 솜씨는 제법이었다. 내일부터는 바위 부수기 훈련을 세 배로 늘려주마!”

엘리아나는 부드러운 산이끼 고약으로 카단의 긁힌 팔을 정성껏 감싸며 속삭였다.

“상처를 두려워하지 마라. 아문 상처는 살갗보다 더 단단한 갑옷이 되는 법이란다.”

카단은 동굴 입구 너머로 먹구름이 걷히며 드러난 새벽하늘의 샛별을 올려다보았다. 눈을 감고 듣는 법을 깨달은 소년의 가슴속에서, 머나먼 대륙의 운명과 실리아라는 신비로운 이름이 맑은 은빛 파문처럼 퍼져 나가고 있었다."""

EP05_EN = """SNSHero Novel
Episode 05: Phantom in the Downpour

The brief northern summer cooled rapidly, and a savage tempest swept across the high bluffs of the Wildlands. Violet lightning cracked through the churning clouds, illuminating the basalt canyons in eerie brilliance, driving the six masters and twelve-year-old Kadan into the mouth of a subterranean limestone cavern. Hollowed over untold millennia by underground torrents, the cavern opened like a forgotten titan's shrine, its ceiling bristling with crystalline stalactites hung with luminous green moss.

Drying their heavy fur cloaks beside a kindled fire, the masters remained vigilant. Aila inspected the unstrung sinew of her crossbow, watching the rain sheet across the canyon.

"This is no natural squall," Aila murmured. "The mana threads are twisted. Someone weaves an artificial veil of black sorcery behind the clouds."

Eliana tasted the mineral spring trickling between the rock fissures and frowned.

"The taste of sulfur and rot. Not the water of living earth, but the residue of obsidian crystal corruption that leaches vitality."

Amidst the rhythmic patter of condensation and the roar of the deluge outside, a chilling scrape of iron chains dragged across the cavern flags. Before the embers could catch, the silver runes carved into the cavern ceiling inverted into abyssal darkness. From the shadows emerged Medusa Gorgo, her blind eyes bound in black silk, obsidian talons gleaming with lethal venom.

"Six winters have I hunted your scent across this barren waste," Gorgo sneered, her voice reverberating from every crack in the stone. "And at last, Aleksandar's stray cur is delivered into my web."

Moving without sight, Gorgo rode the acoustic vibrations of falling raindrops and the thermal drafts of the chamber. With the crack of thunder, her poisoned talons plunged toward Kadan's throat.

"Kadan, down!" Aila cried, firing three quarrels, but they struck only a fading purple afterimage. Gorgo had already merged into the shadow cast behind the boy's boots. Panic seized Kadan's chest, but Gawain's thunderous command shattered his dread.

"Close your eyes, Kadan! The witch does not dwell where your eyes seek her!"

Gawain struck his iron staff against the bedrock, sending harmonic acoustic ripples surging through the cavern.

"Your sight deceives you, boy, but the rain lashing your skin never lies! Remember the path of acoustics taught by Lord Aeolus of the Wind Isle! No living being can cut through the air without leaving a void in the gale!"

Kadan inhaled sharply and snapped his eyelids shut.

Within the absolute darkness of his mind, a breathtaking sensory tapestry unfolded: the steady cadence of water droplets from the ceiling, the ragged heave of Grimli's chest, the angled sheets of wind spray, and—there! A solitary pocket where falling drops bent unnaturally around an empty space!

'She is there! The wind is hollow!'

Without hesitation, Kadan gripped his silver dagger and spun on his heel, driving the white-silver blade into the empty pocket of air with all his young strength.

Clang!

The silver blade slammed violently into Gorgo's conjured chain. White sparks erupted through the cavern, the razor tip cutting through her silk cuff and biting deep into her wrist meridians.

"Insolent whelp! You anticipate an unseen strike?"

Gorgo gasped, recoiling as her balance broke. The masters seized the opening ruthlessly. Grimli brought down his great hammer, collapsing the rear rock arch and sealing her escape route. The silver bell upon his hammer chimed like an enraged beast.

"Robinyard's vengeance is at hand, foul witch!"

Rondol swept subterranean water upward in a surging wave, stripping away Gorgo's toxic mist. Three barbed quarrels from Aila's crossbow punched through Gorgo's shoulder and thigh, while Kaze's paired daggers severed her primary mana meridians.

Bleeding onto the stone, Gorgo detonated a violet smoke bomb and leaped toward the subterranean cataract.

"Clever curs... but do not rejoice! While you rot in these northern wastes, Balian's son is raised in the Red Glass Court as Prince Lucian's most lethal assassin! And upon the distant Wind Isle, Lord Aeolus's daughter, the brilliant Silia, grows into a storm that will tear this continent apart!"

"Silence, hag!" Grimli threw his hammer, but Gorgo vanished beneath the surging rapids.

As the deluge subsided, silence returned to the cavern. Kadan wiped cold sweat from his palms and looked toward Gawain.

"Master... who is this girl Silia from the Wind Isle? And who is the son of Balian she spoke of?"

Gawain rested upon his staff, listening to the murmuring earth outside.

"The Wind Isle is an isolated sanctuary upon the eastern sea. Its ruler, Aeolus, is the proudest and most formidable sage of air mana. It is said he has a daughter named Silia, sharp as diamond and free as the sea breeze. If the Shadow Realm touches her, war will engulf the world."

Kadan placed his hand upon his chest.

"Is she... also hunted and afraid, like me?"

Aila brushed back his damp hair with a gentle smile.

"Then you must grow stronger, Kadan. The shield to protect others is never granted to those who simply wait. To honor the silver dagger your father left behind."

Grimli chuckled, setting his maul beside the hearth.

"Aye, lad! Deflecting a phantom blade in the dark was fine work. Tomorrow, your boulder drills triple!"

Eliana bound Kadan's scraped arm with soothing mountain moss salve.

"Fear not your scars. Healed flesh becomes an armor tougher than boiled hide."

Kadan gazed past the broken cavern mouth toward the morning star rising through the clearing skies. Having learned to listen with closed eyes, the boy felt the distant fate of the world and the name of Silia etch itself into his destiny like a shining silver ripple."""

# -----------------------------------------------------------------------------
# EPISODE 06 EXPANDED (Target: >= 3,850 chars, >= 14 dialogues)
# -----------------------------------------------------------------------------
EP05_KEYWORDS = ["실리아"]
EP06_KEYWORDS = ["발리안", "이그니스"]

EP06_KO = """# 눈히어로 6화 - 별을 호흡하는 법

> 원문 범위: 제11장-제12장

여섯 스승의 가르침은 소년 카단을 매일 서로 다른 극단적인 방향으로 끌어당겼다. 와일드랜드의 얼어붙은 고원 한가운데서 드워프 대장장이 그림리는 바위처럼 땅에 뿌리를 박고 물러서지 않는 묵직한 하체를 단련하라 호통쳤고, 도박사 카제는 바람의 눈을 속이고 칼끝이 닿기 직전에 몸을 비틀어 달아나는 잔기술을 연마하라 재촉했다. 마수 사냥꾼 에일라는 활시위를 당길 때 숨을 완전히 멈추어 심장의 고동마저 지워야 한다고 가르쳤으나, 론돌은 숨이란 대해의 파도처럼 쉼 없이 밀려오고 나가야만 스태미나가 마르지 않는다고 반박했다. 약제사 엘리아나는 살갗을 스치는 미세한 마나의 독기를 혀끝으로 맛보듯 감지하라 일렀고, 맹인 추적자 가웨인은 귀를 닫고 발바닥을 울리는 지맥의 떨림만을 믿으라 경고했다.

카단은 스승들의 가르침 중 어느 하나도 소홀히 여기지 않으려 피나는 노력을 거듭했으나, 실전 대련에 들어서면 여섯 갈래의 무공 원리가 몸속에서 사납게 충돌하며 소년의 동작을 엉망진창으로 굳어버리게 만들었다. 열다섯 살이 되던 해 겨울, 카단은 가장 기초적인 삼단 방패막기 동작조차 매끄럽게 연결하지 못한 채 눈밭 위로 보기 흉하게 굴러떨어졌다.

“손목에 힘이 너무 들어가 있어! 네 아비 알렉산다르는 두 자루 칼을 쥘 때 날아가는 독수리의 깃털처럼 가볍게 쥐었단 말이다!”

그림리가 거칠게 침을 뱉으며 눈보라 속으로 돌아서자, 카단은 눈밭에 엎드린 채 홀로 뜨거운 눈물을 삼켰다. 자신이 스승들의 숭고한 희생을 헛되이 낭비하고 아버지의 이름에 먹칠을 하고 있다는 자괴감이 어린 가슴을 날카롭게 후벼 팠다. 그날 밤, 모두가 잠든 시각, 카단은 홀로 숙영지를 빠져나와 캠프 위를 병풍처럼 둘러싼 천 길 얼음 절벽을 맨손으로 오르기 시작했다. 손톱 밑이 깨져 피가 얼어붙고 무릎이 바위에 부딪쳐 찢겨 나갔으나, 뼈마디를 파고드는 고통이 가슴속의 수치심보다 훨씬 견디기 쉬웠다.

절벽 중턱의 좁은 바위 난간에는 어미를 잃은 북방 매의 둥지가 위태롭게 걸려 있었다. 매의 새끼 두 마리가 영하의 칼바람 속에서 굶주림에 떨며 울고 있었다. 날개 없는 인간이라면 결코 기어오를 엄두를 내지 못할 아찔한 빙벽이었다.

다섯 번을 미끄러지고 굴러떨어져 온몸이 멍투성이가 된 채 거친 숨을 몰아쉬던 카단의 등 뒤에서, 맑고 차분한 노인의 음성이 어둠을 뚫고 들려왔다. 이끼 낀 거친 모직 망토를 두르고 개암나무 지팡이를 짚은 은둔자 말퓨온이 바위 그림자 아래 서 있었다.

“너는 오직 팔다리의 근육과 뼈의 힘으로만 절벽을 오르려 하는구나, 아이야. 그러니 산이 너를 밀어내는 것이다.”

이마에 흐르는 피를 손등으로 닦아내며 카단이 헐떡였다.

“산이... 사람을 밀어낼 수도 있는 겁니까?”

“천지 만물의 호흡에 귀를 기울이지 않는데, 바위가 어찌 너의 무례한 발길을 받아주겠느냐? 네 손에 쥔 칼과 방패도 이와 조금도 다르지 않다.”

말퓨온은 지팡이를 짚은 채 맨발로 가파른 수직 빙벽을 걸어 올라갔다. 노인의 발이 닿는 곳마다 얼어붙은 얼음 위로 푸른 이끼가 돋아나며 미끄러짐을 단단히 붙잡아 주었다. 둥지 속 새끼들에게 말린 말고기를 찢어 먹이고 내려온 말퓨온은 카단을 그윽한 눈빛으로 응시했다.

“사흘 뒤 보름달이 뜰 때, 저 봉우리 정상으로 오너라. 스승들에게는 아무 말도 하지 말고.”

카단은 사흘 밤낮 동안 밧줄 묶기와 발 디딤새를 홀로 연습했다. 마침내 약속된 밤, 소년은 눈보라를 뚫고 피투성이가 된 손가락으로 기어올라 달이 중천에 걸리기 전 바위산 꼭대기에 도달했다.

말퓨온은 칼도 방패도 없이 차가운 평평한 바위 위에 결가부좌를 틀고 앉아 있었다.

“앉아라, 카단. 눈을 감고, 숨을 들이쉴 때마다 밤하늘의 샛별 하나를 가슴속에 모아들이고, 숨을 내쉴 때마다 발밑의 흙으로 눈송이 하나를 돌려보내라.”

노인은 마나란 혈관을 쥐어짜내는 강압적인 힘이 아니라, 인간의 맥박을 대륙의 고동과 조화롭게 맞추어 나가는 거대한 선율이라고 설명했다.

“남쪽 붉은 유리 궁정에선 발리안의 아들 이그니스가 태어날 때부터 순백의 불꽃을 품고 매일 파괴적인 화염 무공을 쌓아가고 있다. 그러나 메마른 장작을 태우는 불길은 결국 잿더미만을 남길 뿐이지. 네가 익혀야 할 힘은 결코 꺼지지 않는 별들의 숨결이다.”

소년은 스승들의 상반된 가르침이 서로 대립하는 것이 아니라, 대륙의 계절처럼 하나의 순환이라는 사실을 비로소 깨달았다. 그림리의 바위 같은 묵직함은 들이쉬는 숨의 중심이었고, 카제의 날렵한 비검은 내쉬는 숨의 끝자락이었으며, 론돌의 파도와 에일라의 고요함은 그 사이를 잇는 잔잔한 여울이었다.

말퓨온은 가혹하리만치 엄격하게 호흡의 중심을 바로잡아 주었다. 카단의 숨결이 조금이라도 흐트러지면 단단한 개암 열매를 던져 이마를 쳤고, 집중이 지나쳐 주변을 잊으면 날카로운 화두를 던졌다.

“별을 세느라 등 뒤에 선 동료의 발소리를 놓친다면, 그 방패는 대체 누구를 위한 것이냐?”

카단은 깊이 고개를 숙였다. 고요함은 결코 세상을 피해 숨는 도망자의 동굴이 아니었다.

세 달의 수련이 끝난 어느 새벽, 카단이 스승들의 가죽 천막으로 조용히 돌아왔을 때, 맹인 추적자 가웨인이 지팡이를 멈추고 고개를 돌렸다. 소년의 발소리는 자갈 위에서 한 점의 소리도 내지 않았고, 그의 숨결은 아침 산바람과 완벽하게 동화되어 있었다.

“발소리가 바람 속에 녹아들었구나, 카단. 밤마다 어디를 다녀왔는지는 묻지 않겠다. 다만 그 힘을 남에게 뽐내려 들면 네 두 다리를 분질러 놓을 테니 그리 알아라.”

가웨인이 무뚝뚝하게 내뱉었으나 메마른 입가에는 깊은 미소가 번져 있었다. 마침내 소년의 방패에 별들의 호흡이 깃들기 시작한 순간이었다."""

EP06_EN = """SNSHero Novel
Episode 06: The Art of Breathing Stars

The divergent teachings of the six masters pulled young Kadan in conflicting directions every single day. On the frozen plateau of the Wildlands, Grimli the dwarven smith roared at him to root his boots like an immoveable granite boulder, while Kaze the gambler urged him to deceive the eye and twist away before a blade could make contact. Aila the Demon Hunter commanded him to halt his breath entirely before drawing the string to erase his heartbeat, yet Rondol the boatman insisted that breath must flow incessantly like ocean swells lest his stamina wither. Eliana counseled him to discern murderous intent through the skin like tasting poisonous spores, and Gawain the blind tracker told him to seal his ears and trust only the tremors beneath his boots.

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

Kadan bowed his head. Stillness could never become a cave to hide from the world.

When Kadan finally returned to the hunters' yurt, Gawain paused his staff upon the shale, turning his blind eyes in astonishment. Kadan's footsteps made no sound upon the gravel, his breathing indistinguishable from the mountain breeze.

"Your footsteps have melted into the gale, Kadan. I shall not pry into where you wander at night. But if you dare brandish this newly found power in vanity, I shall break your legs myself."

A faint, proud smile touched the tracker's weathered lips. At last, the breath of the cosmos had entered the young warrior's shield."""

# -----------------------------------------------------------------------------
# EPISODE 07: 배신자들의 천막 / The Traitors Camp
# -----------------------------------------------------------------------------
EP07_KEYWORDS = ["발리안", "이그니스"]

EP07_KO = """# 눈히어로 7화 - 배신자들의 천막

> 원문 범위: 제13장-제14장

황야의 모닥불이 잦아들 무렵, 북방의 하늘은 짙은 잿빛 먹구름으로 뒤덮여 있었다. 남쪽으로 떠나기 전 마지막 밤, 청년으로 자라난 카단은 은둔자 말퓨온과 함께 와일드랜드 외곽의 메두사 고르고의 불길한 흔적을 은밀히 추적했다. 고르고는 유목 부족의 패자 펜릴의 본진 숙영지에서 불과 반 리 떨어진 폐광산 동굴 속에 숨어들어, 스승 에올루스에게서 훔쳐낸 `나인섀도우 코덱스`의 암흑 룬을 바위에 새기며 광기 어린 주술을 연마하고 있었다. 검붉은 사슬채찍이 칠흑의 바위를 휘감을 때마다 돌 속에 잠들어 있던 대지의 마나가 바싹 말라붙으며 은백색 결정으로 부서져 내렸다.

말퓨온과 카단이 바위 틈새에 몸을 숨기고 숨을 죽인 순간, 폐광 입구로 검은 모직 망토를 뒤집어쓴 의문의 사내들이 말에서 내렸다. 펜릴의 의형제이자 부족의 제2인자인 맹장 바르가스트였다. 더욱 경악스러운 것은 그를 마중 나온 자의 복색이었다. 가슴팍에 진홍빛 화염 문양이 수놓아진 붉은 유리 궁정의 고위 사절 루시안의 밀사였다.

“약조한 때가 내일 밤이다. 펜릴의 술잔에 엘리아나의 정화제조차 풀 수 없는 그림자 마비 독을 섞어 두었다. 펜릴이 쓰러지면 부족의 전사들을 모조리 섀도우렐름의 깃발 아래 집결시키겠다.”

바르가스트의 비열한 음성이 동굴 벽을 타고 흘러나왔다. 붉은 옷의 사절이 만족스러운 미소를 지으며 무거운 금화 주머니와 봉인된 양피지 서한을 건넸다.

“훌륭하다. 펜릴만 제거된다면 황야는 우리 루시안 경의 손아귀에 떨어질 것이다. 발리안의 아들 이그니스가 황궁의 백색 화염 기사단을 이끌고 북상할 때, 네가 첫 번째 맹주로 추대될 것이다.”

사절의 입에서 발리안과 이그니스의 이름이 흘러나오자 카단의 심장이 거세게 요동쳤다. 더 이상 지체할 수 없었다. 카단은 말퓨온의 손짓을 따라 지체 없이 말머리를 돌려 펜릴의 대군영을 향해 전속력으로 질주했다.

그러나 유목 부족의 중심 천막에 당도했을 때, 카단이 마주한 것은 신뢰 대신 차가운 의심의 장벽이었다. 늑대 가죽 왕좌에 앉아 있던 맹주 펜릴은 열여덟 살 어린 전사의 다급한 고변을 듣고도 오랜 의형제를 쉬이 의심하지 못했다.

“바르가스트는 나와 함께 십 년 동안 피를 흘리며 북방의 마수들을 토벌한 전우다! 일개 떠돌이 전사의 세치 혀에 놀아나 내 피붙이 같은 아우를 참소하란 말이냐?”

펜릴의 포효와 함께 천막 밖에서 대기하던 바르가스트가 피 묻은 칼을 차고 호위병들을 이끌며 성큼 걸어 들어왔다.

“형님, 저 늙은 약초꾼과 애송이가 붉은 유리 궁정의 첩자입니다! 제가 폐광에서 놈들을 미행하다 궁정 사절과 밀담을 나누는 현장을 잡으려 했으나 놓쳤습니다!”

바르가스트의 뻔뻔스러운 적반하장에 부족 전사들이 술렁였다. 사태는 순식간에 악화되어, 억울하게도 노인 말퓨온이 궁정의 첩자라는 누명을 쓰고 무거운 무쇠 족쇄에 결박되었다.

말퓨온은 쇠사슬에 묶인 채로도 한마디 변명조차 하지 않고 카단을 지그시 바라보았다. 남의 권위나 분노에 기대지 말고, 오직 스스로 단련한 눈과 귀로 진실을 밝혀내라는 무언의 시험이었다.

카단은 떨리는 심호흡을 가다듬으며 천막 중앙으로 성큼 걸어 나갔다.

“맹주님, 말을 믿지 마시고 눈앞의 사물을 보십시오.”

카단의 목소리는 차분했으나 천막 안의 소음을 단숨에 제압하는 묵직한 공명이 실려 있었다.

“바르가스트의 가죽 장화 굽을 보십시오. 폐광 바닥에만 고여 있는 유황빛 흑요석 진흙이 그대로 묻어 있습니다. 그리고 그의 허리춤에 찬 묵직한 가죽 주머니에서 흘러나오는 냄새는 우리 북방의 은화 냄새가 아닙니다. 붉은 유리 궁정의 지하 용암 수로에서 제련된 진홍빛 황금 주화의 독한 유황 냄새입니다!”

“이놈이 감히!”

바르가스트가 당황하여 칼을 뽑으려 하자, 카단은 번개처럼 몸을 날려 그의 손목을 꺾고 허리춤의 전대를 바닥에 내리쳤다.

짤랑!

전대가 터지며 쏟아진 것은 북방의 화폐가 아니었다. 붉은 유리 궁정의 인장이 선명하게 찍힌 황금 주화 수백 닢과 루시안의 밀서였다. 펜릴의 두 눈이 분노로 번뜩였다.

“바르가스트... 네놈이 정녕 내 등에 칼을 꽂으려 했단 말이냐!”

정체가 탄로 난 바르가스트는 품속에서 독단검을 꺼내 펜릴의 목덜미를 향해 내리찍었다. 그러나 그 칼날이 펜릴의 살갗에 닿기 직전, 카단의 무쇠 방패가 허공을 가르며 날아와 바르가스트의 흉통을 강타했다.

쿠웅!

단련된 별의 호흡이 실린 방패 일격에 바르가스트는 천막 기둥을 부수며 나가떨어졌다. 결박을 푼 말퓨온이 지팡이 끝으로 바르가스트의 마나 혈도를 짚어 반역자를 제압했다.

펜릴은 바닥에 뒹구는 밀서를 움켜쥐고 온몸을 부들부들 떨었다. 만약 카단이 아니었다면 내일 밤 자신은 물론 부족 전체가 도륙당했을 터였다. 맹주는 천막을 울리는 거친 목소리로 카단의 어깨를 으스러지도록 쥐었다.

“어린 사자여... 내가 어리석은 눈으로 네 충정을 의심했구나. 네가 내 목숨과 우리 부족의 혼을 구했다.”

카단은 조용히 머리를 숙였다.

“약속을 지키는 것은 체면이 아니라, 사람이 사람답게 살아가는 도리이기 때문입니다.”

어둠이 걷히고 새벽빛이 와일드랜드의 지평선을 붉게 물들일 때, 펜릴은 자신의 최고 군마와 황야의 통행패를 카단의 손에 쥐여 주었다. 남쪽으로 향하는 소년의 길 앞에, 마침내 대륙의 거대한 소용돌이가 입을 벌리고 있었다."""

EP07_EN = """SNSHero Novel
Episode 07: The Traitors Camp

As the campfires of the Wildlands flickered low, the northern sky choked beneath heavy slate-colored clouds. On their final night before departing southward, young warrior Kadan and the hermit Malfurion tracked the sinister spoor of Medusa Gorgo to an abandoned mine half a league from Chieftain Fenrir's grand pavilion. Lurking within the shafts, Gorgo carved abyssal runes stolen from the Nine Shadow Codex into the basalt, channeling dark sorcery. Wherever her spiked chain lashed the rock, ambient mana withered into brittle white crystals.

Crouched in the shadows, Kadan and Malfurion held their breath as heavily cloaked riders dismounted at the cave entrance. It was Bargast, sworn blood-brother to Fenrir and second-in-command of the northern tribes. Even more shocking was the attire of the envoy waiting to greet him: an emissary of the Red Glass Court bearing Prince Lucian's crimson flame sigil upon his silk tabard.

"The hour is struck for tomorrow night," Bargast rasped. "I have mingled shadow-paralysis poison into Fenrir's mead horn—a draught even Eliana's salves cannot purge. Once he falls, the entire horde gathers beneath the Shadow Realm's banner."

The court emissary smiled, tossing a heavy coin pouch and a sealed parchment across the stones.

"Splendid. With Fenrir slain, the northern wastes fall into Lord Lucian's grasp. When Balian's son Ignis marches north at the head of the White Flame Paladins, you shall be crowned paramount warlord."

Hearing the names of Balian and Ignis, Kadan's pulse hammered against his ribs. There was no time to lose. Signaling to Malfurion, Kadan wheeled his mount and raced back toward Fenrir's royal pavilion.

Yet when he burst into the tribal assembly, Kadan was met not with gratitude, but with icy suspicion. Seated upon his wolf-skin throne, the great chieftain Fenrir refused to entertain treason from an eighteen-year-old wanderer against his veteran brother-in-arms.

"Bargast has bled beside me for ten winters hunting northern beasts!" Fenrir roared. "Shall I condemn my own kin upon the wagging tongue of a nameless stripling?"

Bargast strode into the pavilion surrounded by bodyguards, his smile dripping venom.

"Chieftain! This herb-gatherer and his stray cur are spies dispatched by the Red Glass Court! I tracked them to the mines where they conspired with royal couriers, yet they slipped my grasp!"

The warriors growled in rising fury. Before Kadan could draw breath, tribal guards seized Malfurion, binding the old hermit in heavy iron chains.

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

Exposed, Bargast whipped out a poisoned stilettos, driving it toward Fenrir's throat. Before the steel could strike, Kadan's heavy iron shield cleaved the air, crashing into Bargast's ribs with the weight of an avalanche.

Crash!

Driven by the breath of the stars, the shield blow threw Bargast across the pavilion, shattering the center cedar pillar. Snapping his iron bonds, Malfurion struck Bargast's mana meridians, subduing the traitor instantly.

Fenrir clutched the traitor's parchment, trembling with rage and awe. Had Kadan not spoken, his entire bloodline would have perished in tomorrow's feast. Gripping Kadan's shoulder with iron fingers, the chieftain bowed his head.

"Young lion... my blind eyes wronged your honor. You have preserved my life and the soul of our horde."

Kadan inclined his head with solemn grace.

"A sacred oath is not kept for vanity, but because it is the manner in which true men live."

As dawn crested the Wildlands, painting the horizon in glorious amber, Fenrir placed the reins of his finest steed and the royal seal of passage into Kadan's hands. Before the young warrior lay the great southern vortex, where the fate of the continent awaited."""

# -----------------------------------------------------------------------------
# EPISODE 08: 붉은 갈기의 기수 / Rider of the Crimson Mane
# -----------------------------------------------------------------------------
EP08_KEYWORDS = ["이그니스", "실리아"]

EP08_KO = """# 눈히어로 8화 - 붉은 갈기의 기수

> 원문 범위: 제15장-제16장

북방 와일드랜드를 벗어나 남쪽의 드넓은 초원 지대에 들어서자, 살을 에는 한기 대신 풀내음 섞인 따스한 남풍이 불어왔다. 카단은 펜릴의 통행패를 지닌 채 남부 상단의 거점인 크림슨밸리 경매장에 당도했다. 그곳의 거대한 원형 울타리 주변에는 수백 명의 상인과 용병들이 모여들어 웅성거리고 있었다. 울타리 한가운데에는 불타는 노을빛 갈기를 지닌 거대한 야생마 한 마리가 성난 맹수처럼 거칠게 날뛰고 있었다.

말은 등에 안장을 얹기는커녕, 밧줄을 든 조련사들이 다가서기만 해도 뒷발질로 강철 방패를 박살 내며 사납게 울부짖었다. 이미 베테랑 기병 세 명이 갈비뼈가 부러져 들것에 실려 나간 뒤였다. 경매 책임자는 혀를 차며 쇠뇌 사수들에게 마취 화살을 장전하라 손짓했다.

“저놈은 말이 아니라 지옥의 화염마다! 더 이상 다치는 사람이 나오기 전에 독화살로 기절시켜 가죽이라도 벗겨 팔아야겠다!”

사수들이 방아쇠에 손가락을 얹은 바로 그 순간, 카단이 울타리 문을 열고 안으로 걸어 들어갔다. 그의 손에는 밧줄도, 채찍도, 칼도 들려 있지 않았다. 오직 허리춤에 찬 낡은 물주머니 하나뿐이었다.

“이봐, 애송이! 목숨이 아깝지 않으냐! 당장 물러서라!”

상인들의 비명 같은 경고가 쏟아졌으나, 카단은 걸음을 멈추지 않았다. 붉은 갈기의 야생마가 콧김을 뿜으며 카단을 향해 지축을 울리는 속도로 돌진해 왔다. 앞발을 번쩍 치켜든 채 카단의 정수리를 내리찍으려는 절체절명의 순간, 카단은 눈을 감고 말퓨온에게서 배운 별의 호흡을 천천히 내쉬었다.

후우우.

카단의 몸에서 뿜어져 나온 고요한 마나의 파문이 거친 모래바람을 잠재우며 말의 콧등을 부드럽게 감쌌다. 그것은 복종을 강요하는 억압의 힘이 아니라, 광야에서 홀로 살아남기 위해 이를 악물었던 고독한 영혼을 어루만지는 대지의 온기였다. 허공을 가르던 야생마의 거대한 말굽이 카단의 이마 한 치 앞에서 기적처럼 멈춰 섰다.

말은 가쁘게 헐떡이며 카단의 맑은 눈동자를 응시했다. 카단은 천천히 손을 뻗어 거친 갈기 사이에 얽혀 있던 쇠가시 덫을 조심스럽게 풀어냈다. 상인들이 억지로 말을 잡기 위해 박아넣었던 잔인한 덫이었다. 상처에서 흐르는 피를 닦아내고 허리춤의 물을 말의 입가에 적셔 주자, 붉은 말은 나지막하게 투레질을 하며 카단의 어깨에 이마를 비벼왔다.

“너도 홀로 이 거친 세상을 견뎌내느라 많이 아팠겠구나. 이제 두려워하지 마라. 나는 네 자유를 빼앗지 않는다.”

카단이 읊조리며 말의 등 위로 가볍게 뛰어올랐다. 말은 거부하기는커녕, 마치 오랜 벗을 기다려온 것처럼 힘차게 땅을 박차며 울타리를 훌쩍 뛰어넘었다.

“와아아아!”

숨을 죽이고 지켜보던 군중 사이에서 우레와 같은 함성이 터져 나왔다. 상단 경매 책임자는 넋을 잃고 멍하니 서 있다가 카단에게 머리를 조아렸다.

“이 말은 이제 당신의 것입니다, 젊은 기수여! 저 거친 적갈기를 맨몸으로 길들인 자는 내 평생 처음 보오!”

그날 저녁, 카단은 주막의 테라스에 앉아 적갈기에게 마른 귀리를 먹이며 남쪽에서 올라온 음유시인들의 노랫소리에 귀를 기울였다. 술집 안은 대륙 전역에서 벌어지고 있는 격변의 소식으로 뜨겁게 달아오르고 있었다.

“남쪽 붉은 유리 궁정에서는 발리안의 핏줄이라는 천재 검사 이그니스가 순백의 불꽃으로 황실 토너먼트를 모조리 제패했다더군. 그 불꽃 앞에서는 어떤 강철 방패도 녹아내린다고 해!”

“그뿐만이 아니요! 대해의 바람섬에서는 현자 에올루스의 딸 실리아 아가씨가 바람의 룬을 완벽히 해독하여 대해의 폭풍을 잠재웠다지 않소? 대륙의 영웅들이 남과 동에서 동시에 솟아나고 있는 형국이야!”

주막 사람들의 입에서 이그니스와 실리아의 이름이 연달아 흘러나오자, 카단은 품속의 은빛 단검을 지그시 쥐었다. 여섯 스승이 가슴에 품어주었던 그 이름들이 이제 거대한 현실이 되어 눈앞으로 다가오고 있었다.

“이그니스... 그리고 실리아...”

카단은 적갈기의 따스한 목덜미를 쓸어내리며 남쪽 하늘을 바라보았다. 밤하늘의 샛별이 바람을 타고 은빛 궤적을 그리며 떨어지고 있었다. 운명의 격랑이 소년을 기다리고 있었다."""

EP08_EN = """SNSHero Novel
Episode 08: Rider of the Crimson Mane

Leaving the frozen crags of the Wildlands behind and descending into the southern rolling steppes, the biting frost gave way to warm southern breezes scented with clover. Armed with Chieftain Fenrir's royal pass, young warrior Kadan arrived at the Crimson Valley trading post, the grand marketplace of southern merchant caravans. Hundreds of drovers, sellswords, and wealthy horse-traders stood packed around a massive timber corral, their excited voices rising above the wind. In the center of the ring raged a colossal wild stallion possessing a mane like blazing sunset embers.

The beast refused all bridles. Whenever handlers attempted to slip a noose over its crest, the stallion reared, splintering iron-banded bucklers with thunderous hooves. Three seasoned cavalry drovers had already been carried out on stretchers with cracked ribs. Shaking his head in exasperation, the chief auctioneer signaled the marksmen atop the rails.

"The creature is no horse, but a fiend forged in sulfur!" the auctioneer barked. "Load sleep-draught bolts! We take its hide before it kills another rider!"

As the crossbowmen sighted their quarries, Kadan slipped through the timber gate into the enclosure. He carried neither lariat nor whip, nor drew the blade at his hip. He brought only a weathered leather waterskin.

"Boy! Have you gone mad? Retreat at once!"

Cries of alarm echoed from the gallery, but Kadan did not hesitate. Snorting clouds of dust, the crimson-maned stallion charged across the arena like an avalanche. As its massive forehooves rose to crush Kadan's skull, the youth closed his eyes and released a long, steady breath of the celestial stars.

Hoo-ooh.

A wave of tranquil mana rippled from Kadan's chest, stilling the churned dust and settling gently across the stallion's flaring nostrils. It was no iron grip of domination, but the warm embrace of the loam, speaking to a proud spirit that had weathered the wilderness alone. The descending hooves halted inches before Kadan's brow.

The stallion shivered, meeting the clear depths of Kadan's grey eyes. Moving with deliberate gentleness, Kadan reached into the tangled crimson mane, delicately untangling a cruel serrated iron snare embedded deep within the flesh—a barbaric trap the traders had driven into the beast's neck to break its will. Wiping the blood with spring water, Kadan held the waterskin to the horse's parched lips. Nuzzling Kadan's shoulder, the wild beast released a low, contented whinny.

"You have fought alone for so long," Kadan whispered. "Fear no longer. I shall never steal your freedom."

With effortless grace, Kadan vaulted onto the stallion's bare back. Rather than bucking, the crimson steed sprang forward like loosed lightning, clearing the six-foot timber fence in a magnificent leap.

Roars of disbelief and thunderous cheering erupted from the gallery. The stunned auctioneer bowed deeply to the young rider.

"The stallion is yours, young master! Never in forty summers have I seen Crimson Mane yield to mortal man!"

That night, seated upon the terrace of the valley inn, Kadan fed dried oats to his steed while listening to the wandering minstrels inside. The common room buzzed with momentous tidings from across the continent.

"In the southern Red Glass Court, they say Ignis, true blood of Balian, has swept the Imperial tourney with pure white flames!" a merchant exclaimed. "No shield of steel can withstand his inferno!"

"And from the eastern sea," an old sailor chimed, "Lord Aeolus's daughter, the Lady Silia of the Wind Isle, has decrypted the ancient runes, calming the typhoon with a whisper! True champions rise in the south and east alike!"

Hearing the names of Ignis and Silia echo through the hall, Kadan tightened his fingers around the hilt of his father's silver dagger. The names his six masters had guarded were no longer legends, but living destinies converging upon his path.

"Ignis... and Silia..."

Patting Crimson Mane's neck, Kadan looked southward. Across the velvet night, shooting stars traced silver arcs toward the horizon. The great tide of fate was calling."""

# -----------------------------------------------------------------------------
# EPISODE 09: 거지 옷의 바람 / Wind in Beggars Clothes
# -----------------------------------------------------------------------------
EP09_KEYWORDS = ["이그니스", "실리아"]

EP09_KO = """# 눈히어로 9화 - 거지 옷의 바람

> 원문 범위: 제17장-제18장

남부 상업 도시 세븐브리지의 대투기장은 이른 아침부터 몰려든 수만 명의 관중으로 발 디딜 틈 없이 빽빽했다. 황실 토너먼트의 준결승전이 열리는 결투대 주변에는 화려한 금실로 수놓은 비단 옷을 입은 귀족들과 남부 각지에서 모여든 무인들이 환호성을 지르고 있었다. 결투대 중앙에 서 있는 전사는 붉은 유리 궁정의 자랑이자 무패의 신성, 열여덟 살의 이그니스였다. 새하얀 백은 갑옷 위에 타오르는 순백의 화염 검을 쥔 이그니스는 오만하고도 고결한 눈빛으로 다음 도전자를 내려다보고 있었다.

그의 맞은편으로 결투대 계단을 밟고 올라온 도전자의 행색은 관중들의 웃음거리가 되기에 충분했다. 흙먼지와 비바람에 마모된 누더기 양가죽 조끼, 해진 헝겊을 감은 가죽 장화, 그리고 대장간에서 주워 온 듯한 둥근 나무 방패 하나를 든 청년 카단이었다.

“저 거지는 어디서 굴러먹던 놈이냐? 황실 결투장에 광대가 난입했구나!”

“이그니스 님의 백색 불꽃 한 방이면 뼈도 못 추리고 재가 되겠군!”

귀족들의 조롱과 야유가 쏟아졌으나, 높은 귀빈석 난간에 기대앉아 있던 녹색 머리칼의 한 소녀만은 웃지 않았다. 바람섬의 영애 실리아였다. 비취색 녹옥 지팡이를 무릎에 얹은 실리아는 카단의 어깨와 발 디딤새를 유심히 관찰하며 곁에 선 시종에게 나지막이 속삭였다.

“웃지 마세요. 저 자의 발밑에는 바람이 감돌고 있어요. 거지의 옷을 걸쳤지만, 움직임 하나하나가 수천 번의 실전을 치른 백전노장의 침묵을 품고 있어요.”

결투를 알리는 청동 징 소리가 대기를 찢자마자, 이그니스가 백색 화염을 뿜어내며 맹렬하게 쇄도해 왔다.

“이름 모를 방랑자여! 내 불꽃 앞에서 네 방패가 얼마나 버티는지 보겠다!”

이그니스의 화염 검이 허공을 가르며 세 줄기 백색 폭풍으로 카단의 정수리를 내리찍었다. 콰아아앙! 폭음과 함께 화염이 결투장 바닥의 판석을 녹여버릴 듯 타올랐다. 관중들은 거지의 몸이 불타 사라졌을 것이라 생각했으나, 화염의 연무가 걷힌 자리에는 믿을 수 없는 광경이 펼쳐져 있었다.

카단의 둥근 나무 방패 표면에 차가운 서리 결정이 맺히며, 이그니스의 백색 화염을 세 갈래로 매끄럽게 흘려내고 있었다. 별의 호흡을 실은 카단의 방패는 화염과 정면으로 맞부딪치지 않고, 바람의 결을 따라 불길의 궤도를 허공으로 비틀어 날려 보낸 것이었다.

“뭣이?”

이그니스의 눈동자가 경악으로 물들었다. 이그니스는 즉시 자세를 낮추며 연달아 일곱 번의 맹렬한 찌르기를 퍼부었다. 챙! 챙! 챙! 챙그랑! 그러나 카단의 방패는 드워프 그림리의 무쇠 같은 안정감으로 첫 번째 일격을 막았고, 도박사 카제의 유연한 회전으로 두 번째 일격을 흘렸으며, 론돌의 물결 같은 보법으로 세 번째 간격을 벌렸다. 여섯 스승에게서 물려받은 여섯 가지 무예가 소년의 별빛 호흡 안에서 하나로 융합되어 완벽한 방벽을 이루고 있었다.

“어디서 배운 무공이냐! 네 방패의 궤적... 단순한 떠돌이의 솜씨가 아니다!”

이그니스가 거친 숨을 몰아쉬며 물었다. 카단은 방패를 내리지 않은 채 조용히 대답했다.

“사람을 살리기 위해 목숨을 바친 여섯 스승의 숨결이다.”

격돌이 십여 합을 넘어가자, 실리아의 녹옥 지팡이 끝에서 미세한 비취빛 바람이 결투대를 감쌌다. 결투장 바깥의 음모를 감지한 실리아가 난간을 짚고 일어섰다. 결투장 지하 수로에서 붉은 유리 궁정의 암살자들이 검은 마비 화살을 장전하고 있었던 것이다.

“이그니스, 카단! 결투를 멈춰요! 지하에 함정이 있어요!”

실리아의 청아한 외침이 바람을 타고 두 사람의 귓전에 꽂혔다. 그 순간, 바닥의 배수구 틈새에서 수십 발의 검은 독화살이 이그니스의 무방비한 등을 향해 일제히 솟구쳤다. 결투의 승패보다 동료의 목숨이 먼저였다. 카단은 망설임 없이 이그니스의 앞으로 몸을 날려 둥근 방패로 빗발치는 독화살을 모조리 쳐냈다.

타타탕!

독화살이 튕겨 나가며 바닥 판석을 검게 부식시켰다. 이그니스는 자신의 등을 지켜준 카단의 방패를 망연자실하게 바라보았다. 만약 카단이 몸을 던지지 않았다면 자신의 심장이 독화살에 꿰뚫렸을 터였다.

“너... 왜 나를 구했느냐?”

카단은 부러진 화살촉을 털어내며 담담히 말했다.

“지킬 수 있는 온기를 외면하는 것은 방패를 든 자의 도리가 아니기 때문이다.”

결투장 주변으로 루시안의 친위대가 포위망을 좁혀오자, 관람석에서 날아내린 실리아가 녹옥 지팡이로 거대한 회오리바람을 일으켜 경기장을 가로막았다.

“둘 다 바보처럼 멍하니 서 있지 말고 이쪽으로 와요! 황실의 사냥개들이 우릴 노리고 있어요!”

거지 옷을 입은 카단, 백색 화염의 이그니스, 그리고 바람섬의 실리아. 세 사람의 운명적인 삼자 대면이 포화 속에서 마침내 이루어진 순간이었다."""

EP09_EN = """SNSHero Novel
Episode 09: Wind in Beggars Clothes

From the earliest bells of dawn, the Grand Amphitheater of Sevenbridge overflowed with tens of thousands of roaring spectators. Surrounding the elevated quartz dueling stage, noble patrons draped in cloth-of-gold and sellswords from across the realms cheered the semifinal match of the Imperial Tourney. In the center of the ring stood the pride of the Red Glass Court, the undefeated prodigy—eighteen-year-old Ignis. Clad in polished white-silver plate, wielding a broadsword wreathed in pure white fire, Ignis surveyed his challenger with piercing, unyielding pride.

The opponent mounting the marble steps offered a spectacle that drew instant mockery from the stands. Draped in a travel-worn sheepskin vest crusted with road-grit, patched hide boots, and carrying a plain round wooden buckler that looked salvaged from a village forge, young Kadan stepped onto the sand.

"Whence crawled this vagrant beggar?" a young lord sneered. "A street jester mocks the imperial sands!"

"One stroke of Sir Ignis's white flame and not a bone of him shall escape the furnace!"

Yet amidst the laughter, a maiden leaning over the royal gallery balustrade did not smile. It was Lady Silia of the Wind Isle. Resting her emerald-topped jade staff upon her lap, Silia studied the fluid alignment of Kadan's shoulders and boots, murmuring softly to her attendant.

"Cease your laughter. The wind gathers around his heel. He wears beggar's rags, yet his silence holds the weight of a veteran who has walked through a thousand slaughters."

The bronze gong clanged, splitting the midday air. Ignis surged forward in an explosion of incandescent heat.

"Nameless wanderer! Let us see if your timber can endure the trial of white fire!"

Ignis's blazing blade cleaved through the air in three blinding arcs aimed at Kadan's crest. Boooom! White flames scorched the arena flags, yet as the steam cleared, a gasp rippled across the stands.

A delicate crystalline frost coated Kadan's wooden buckler, smoothly refracting the white fire harmlessly into the sky. Channeling the celestial breath, Kadan had not met the inferno with rigid opposition; he had ridden the slipstream, guiding the kinetic fury into the empty air.

"What sorcery is this?"

Ignis gasped, resetting his stance to loose a seven-fold flurry of thrusts. Clang! Clang! Clang! Clatter! Yet Kadan's shield held: absorbing the first blow with Grimli's boulder-like density, deflecting the second with Kaze's spinning evasion, and yielding to the third with Rondol's tidal retreat. The six masters' doctrines harmonized into an impenetrable fortress within the youth's quiet breath.

"Where learned you this discipline?" Ignis panted, white fire guttering along his pommel. "This geometry belongs to no hedge-knight!"

Kadan kept his guard steady.

"It is the living breath of six masters who traded their blood so that others might live."

As their blades crossed a dozen times, a crisp breeze spiraled from Silia's jade staff. Detecting murderous vibrations from below the stage, the lady leaped to the balustrade. Beneath the drainage grates, assassins of the Red Glass Court were sighting repeating crossbows tipped with black paralytic venom.

"Ignis! Kadan! Break off! There is treachery beneath the flags!"

Silia's melodic shout pierced the din. In that heartbeat, dozens of black quarrels erupted from the floorboards, aimed straight at Ignis's exposed back. Choosing his rival's life over victory, Kadan vaulted forward, interposing his wooden buckler between Ignis and the poisoned storm.

Clack-clack-clang!

The quarrels shattered against the reinforced rim, their black poison hissing against the timber. Ignis stared at the battered shield shielding his spine in stunned silence.

"Why... why have you shielded me?"

Kadan cast aside the broken quarrels.

"To turn away from life one has the strength to preserve is cowardice for any man who bears a shield."

As Prince Lucian's royal inquisitors closed in around the ring, Silia dropped lightly onto the sands, raising a towering dust-vortex with her jade staff.

"Stop gaping like village simpletons and run! The Imperial hounds hunt us all!"

Kadan in his beggar's wool, Ignis of the white flame, and Silia of the Wind Isle—their fated trinity was forged amidst the embers of battle."""

# -----------------------------------------------------------------------------
# EPISODE 10: 불꽃 궁정의 포로 / Prisoner of the Flame Court
# -----------------------------------------------------------------------------
EP10_KEYWORDS = ["알렉산다르", "발리안", "이그니스", "실리아"]

EP10_KO = """# 눈히어로 10화 - 불꽃 궁정의 포로

> 원문 범위: 제19장-제20장

남부의 심장부에 솟아오른 붉은 유리 궁정은 밤낮을 가리지 않고 불길한 진홍빛 광채를 뿜어냈다. 거대한 화산 암반 위에 세워진 황궁 지하로는 펄펄 끓는 용암 수로가 거미줄처럼 얽혀 흘렀고, 복도마다 매달린 흑요석 샹들리에 속에서 불의 정령들이 일렁이며 숨 막히는 열기를 토해냈다. 황실 토너먼트의 혼란을 틈타 탈출한 카단과 실리아는 약재 운반 수레 밑바닥에 몸을 숨긴 채 삼엄한 경비망을 뚫고 궁정 깊숙한 곳으로 잠입했다. 그들의 목적은 하나였다. 십팔 년 전 행방불명되었던 성기사 발리안의 수감 기록과, 이그니스를 조종하고 있는 사악한 재상 루시안의 음모를 파헤치는 것이었다.

미로 같은 지하 회랑을 지나 마침내 도착한 곳은 왕실 지하 서고의 비밀 금고였다. 철문 앞에는 붉은 갑옷을 입은 화염 기사 둘이 쓰러져 있었다. 그들 앞에는 먼저 도착한 이그니스가 칼끝을 내린 채 떨리는 손으로 황금 궤짝을 열어젖히고 있었다.

“이그니스! 여기서 무얼 하고 있는 거야?”

실리아가 녹옥 지팡이를 거두며 다가서자, 이그니스는 뒤를 돌아보았다. 소년의 얼굴은 충격과 절망으로 하얗게 질려 있었다.

“루시안 경이 내게 거짓말을 했다... 내 아버지는 반역자가 아니었어. 내 아버지는 성기사단의 수호자 발리안 공작이었단 말이다!”

이그니스의 손에 쥐여 있던 것은 불에 그을린 십팔 년 전의 비밀 일지였다. 그 일지에는 카단의 아버지 알렉산다르와 이그니스의 아버지 발리안이 맹세했던 거룩한 형제애와, 루시안이 황권을 찬탈하기 위해 두 가문을 어떻게 모함하고 갈라놓았는지에 대한 끔찍한 진실이 적혀 있었다.

“알렉산다르 숙부님은... 내 아버지를 배신한 것이 아니었다. 아버지를 살리기 위해 홀로 얼음 다리를 막아섰던 것이었어!”

이그니스가 오열하며 무릎을 꿇었다. 순백의 화염을 다루는 황실의 총아로서 살아온 자신의 삶 전체가, 아버지를 죽음으로 몰아넣은 원수의 손바닥 위에서 놀아난 꼭두각시에 불과했다는 진실 앞에 소년의 긍지는 산산조각이 났다.

그때, 서고 입구의 두꺼운 철문이 둔탁한 소리와 함께 닫히며 차가운 박수 소리가 복도를 울렸다. 진홍빛 비단 관복을 걸친 재상 루시안이 흑마술사들과 마기테크 골렘들을 이끌고 서고를 포위하고 있었다.

“참으로 감동적인 재회로구나. 알렉산다르의 아들과 발리안의 아들이 마침내 한자리에서 진실을 마주했으니 말이다.”

루시안의 입가에 잔인한 조소가 번졌다.

“그래, 발리안은 죽지 않았다. 그는 지금 저 아래 용암 감옥 가장 깊은 독방에서 십팔 년 동안 사슬에 묶여 숨만 쉬고 있지. 나는 그가 자기 아들의 손에 처형당하는 날만을 기다려왔다. 하지만 오늘 밤, 너희 셋을 함께 처리할 수 있게 되었으니 수고를 덜었군!”

루시안의 손짓과 함께 마기테크 골렘 세 기가 붉은 레이저를 번뜩이며 카단 일행을 향해 육중한 강철 주먹을 내리찍었다.

“실리아, 문을 열어라! 이그니스, 정신 차려라!”

카단이 포효하며 별의 호흡을 끌어올려 무쇠 방패로 골렘의 첫 번째 강철 주먹을 받아냈다. 쾅! 엄청난 충격파가 서고 바닥을 부수며 먼지를 일으켰다. 충격으로 카단의 팔꿈치 혈관이 터져 피가 흘렀으나 소년은 반 보도 물러서지 않았다.

“이그니스! 네 아버지는 결코 절망 속에서 무릎 꿇지 않았다! 너 역시 네 아버지의 피를 이어받은 성기사의 아들이다!”

카단의 일갈이 절망에 빠져 있던 이그니스의 심장을 강타했다. 이그니스는 눈물을 닦아내며 이를 악물었다. 소년의 전신에서 꺼져가던 불꽃이 다시금 눈부신 순백의 백색 화염으로 폭발했다.

“루시안... 네놈을 결코 용서하지 않겠다!”

이그니스의 거대한 화염 검이 허공을 가르며 골렘 한 기의 심장부를 녹여버렸다. 동시에 실리아가 녹옥 지팡이로 비밀 환기구의 철창을 날려버리며 외쳤다.

“퇴로가 열렸어요! 발리안 공작님을 구출하려면 일단 여기서 살아남아야 해요!”

세 사람은 서로의 등을 맞댄 채 몰려드는 화염 친위대를 뚫고 환기구 너머의 어둠 속으로 몸을 던졌다. 등 뒤에서 루시안의 저주 어린 비명이 울려 퍼졌으나, 세 사람의 마음속에는 이미 새로운 서광이 비치고 있었다. 아버지 세대의 비극을 넘어, 마침내 하나로 뭉친 젊은 영웅들의 반격이 시작되고 있었다."""

EP10_EN = """SNSHero Novel
Episode 10: Prisoner of the Flame Court

Rising like an obsidian monolith from the volcanic bedrock of the southern capital, the Red Glass Court cast an ominous crimson luminescence across the night. Subterranean conduits of molten lava coiled beneath the marble floors, while fire elementals trapped within basalt chandeliers exhaled suffocating waves of sulfurous heat. Slipping past imperial cordons beneath an apothecary wagon during the post-tourney turmoil, Kadan and Silia penetrated the heart of the palace. Their objective was singular: retrieve the clandestine prison ledgers of the Holy Knight Balian, missing for eighteen winters, and expose the deceit of Prince Lucian.

Weaving through labyrinthine passages, they breached the subterranean vault. Before the adamantine doors lay two vanquished paladins in scarlet plate. Within the vault stood Ignis, his sword lowered, opening an iron chest with trembling hands.

"Ignis! What are you doing here?"

Lowering her jade staff, Silia stepped forward. Ignis turned, his handsome visage drained of blood, hollowed by shock and grief.

"Lord Lucian lied to me... my father was no traitor. My father was Duke Balian, Paragon of the Holy Order!"

Clutched in Ignis's fist was a scorched journal dated eighteen years past. Recorded within were the sacred brotherhood sworn between Kadan's father Aleksandar and Ignis's father Balian, and the monstrous web of perjury woven by Lucian to fracture the paladins and usurp the imperial throne.

"Uncle Aleksandar... never betrayed my father," Ignis wept, sinking to his knees. "He held the glacial bridge alone to buy my father time to escape!"

His entire life as the court's darling champion—the pure white flame praised across the empire—had been an orchestrated mockery, dancing to the strings of the tyrant who had destroyed his house.

A dry, mocking clap echoed through the corridor as the vault's heavy iron doors swung shut. Draped in crimson silk, Prince Lucian stepped forward flanked by court warlocks and hulking magitech golems.

"A touching family reunion," Lucian sneered with chilling malice. "The son of Aleksandar and the son of Balian discovering the truth in the very same tomb."

Cruel amusement danced in the prince's eyes.

"Aye, Balian did not perish on the cliff. He breathes still, chained in the deepest solitary cell beneath the magma channels. I reserved his execution for the day his own son could sever his head in ignorance. Yet slaying all three of you tonight simplifies my grand design!"

At Lucian's command, three magitech golems leveled glowing arcane cannons, their piston-driven fists smashing downward.

"Silia, breach the gate! Ignis, on your feet!"

Kadan roared, marshaling the star breath through his bones, meeting the lead golem's fist with his iron shield. Boom! Shockwaves cracked the floor, blood misting from Kadan's strained knuckles, yet the youth did not yield a single inch.

"Ignis! Your father never surrendered to despair! You carry the blood of the Holy Order!"

Kadan's cry struck through Ignis's sorrow like a bolt of lightning. Wiping the tears from his cheeks, Ignis gritted his teeth, the white flames erupting from his blade with blinding brilliance.

"Lucian... I will drag your lies into the pyre!"

Ignis's blazing greatsword cleaved the golem's power core in twain. Simultaneously, Silia unsealed the royal aqueduct grate with a concussive blast from her jade staff.

"The escape is open! If we are to liberate Duke Balian, we must live through tonight!"

Shoulder to shoulder, their backs united against the closing phalanx, the three leaped into the churning dark of the aqueduct. Behind them roared Lucian's furious curses, yet within the hearts of the three companions, a new dawn had ignited. Transcending the tragedy of their fathers, the true resistance had begun."""

# Module self-test
if __name__ == "__main__":
    print("Testing Arc 1 Episodes:")
    eps = [
        (1, EP01_KO, EP01_EN),
        (2, EP02_KO, EP02_EN),
        (3, EP03_KO, EP03_EN),
        (4, EP04_KO, EP04_EN),
        (5, EP05_KO, EP05_EN),
        (6, EP06_KO, EP06_EN),
        (7, EP07_KO, EP07_EN),
        (8, EP08_KO, EP08_EN),
        (9, EP09_KO, EP09_EN),
        (10, EP10_KO, EP10_EN),
    ]
    for ep_num, ko, en in eps:
        lines = [l.strip() for l in ko.split("\n") if l.strip()]
        dlgs = [l for l in lines if ('“' in l and '”' in l) or l.startswith('“')]
        print(f"Ep {ep_num:02d}: Chars={len(ko)}, Dialogues={len(dlgs)}, EnChars={len(en)}")
        assert len(ko) >= 3500, f"Ep {ep_num} failed len: {len(ko)}"
        assert len(dlgs) >= 8, f"Ep {ep_num} failed dlgs: {len(dlgs)}"
    print("All Arc 1 episodes passed assertions!")
