# -*- coding: utf-8 -*-
import sys, os, re
sys.path.insert(0, ".")

import scripts.assemble_batch2 as ab2

# Ep 12 & Ep 13
ep12_ko = ab2.EP12_KO
ep12_en = ab2.EP12_EN
ep13_ko = ab2.EP13_KO
ep13_en = ab2.EP13_EN

# ==============================================================================
# EPISODE 14 FULL
# ==============================================================================
ep14_s1 = """동해안 어귀에 드넓게 자리 잡은 안개 호수는 사시사철 자욱한 유백색 물안개에 덮여 있어 길손들의 발길을 쉬이 허락하지 않는 신비로운 곳이었다. 호수 수면 위로는 수백 길 높이의 거대한 현무암 석주 일흔두 개가 침묵의 거인처럼 우뚝 솟아 있었고, 맑은 날에도 호수 바닥에 수몰된 고대 도시의 궁전 첨탑과 부서진 아치 석교들이 에메랄드빛 물밑에서 유령처럼 어른거렸다. 물새 한 마리 날지 않는 고요한 호숫가에서, 카단과 실리아는 레오나르 장군의 안내를 받아 호수 중앙의 수상 요새인 ‘구름돌아오는장원’을 향해 조심스럽게 나아갔다. 축축한 갈대밭 사이로 서늘한 호수 바람이 불어올 때마다 갈대꽃 하얀 솜털이 눈송이처럼 허공을 맴돌았다. 바위 틈새마다 푸른 이끼가 융단처럼 깔려 있었고, 물가에 늘어선 수양버들 가지들이 잔잔한 수면에 파문을 그렸다.

실리아가 수면 위로 손을 뻗어 안개의 결을 살피며 말했다.

“수몰된 종탑들이 물속에서 미세한 마나의 파동을 보내고 있어요. 물의 정령들이 여전히 저 아래에서 잠들어 있는 거예요.”

카단이 물가에 멈추어 서서 수면 아래를 내려다보았다.

“호수 밑바닥에 잠겨 있는 저 거대한 석조 건축물들은 무엇인가? 마치 거대한 제국이 통째로 가라앉은 것 같군.”

레오나르가 녹옥 지팡이로 물가를 가리키며 굵직한 목소리로 설명했다.

“천 년 전, 고대 마법 문명이 번영을 누리던 ‘물의 도시 아쿠아리아’의 유적이다. 나인섀도우 코덱스의 금기된 마나가 폭주하면서 하루아침에 호수 밑으로 가라앉았지. 지금 우리가 건너야 할 일흔두 개의 석주는 그 당시 궁전들을 떠받치던 거대한 수호 기둥들이다.”"""

ep14_s2 = """호숫가 나루터의 낡은 계류장에 이르렀을 때, 실리아가 물가에 자란 갈대 풀잎 하나를 뜯어 입술에 대고 고요한 바람의 자장가를 불었다. 청아하고도 애수 어린 피리 소리가 안개 낀 수면을 타고 은은하게 퍼져 나가자, 저 멀리 짙은 안갯속에서 외노를 저으며 삐걱거리는 작은 나룻배 한 척이 모습을 드러냈다. 배 위에는 한쪽 다리를 잃고 무쇠 의족을 찬 늙은 사공이 노를 젓고 있었다. 과거 바람 속삭임 섬의 전설적인 수호자이자 항해사였던 론돌이었다.

론돌의 거친 시선이 실리아의 얼굴과 푸른 비단옷에 머물렀다. 그의 목소리는 물안개처럼 메말라 있었다.

“결국 돌아왔구나, 섬에서 도망쳤던 어린 왕녀여. 섬의 장로들은 너를 배신자라 부르며 저주하고 있는데, 무슨 낯으로 다시 이 바다를 찾았느냐?”

실리아는 흔들림 없는 당당한 눈빛으로 론돌을 바라보며 대답했다.

“어머니 실피드의 죽음에 얽힌 추악한 진실을 덮어두고 섬의 문을 걸어 잠근 것은 장로들이에요. 저는 도망친 게 아니라 어머니의 넋을 기리고 진실을 밝히러 나선 거예요, 론돌 숙부님. 숙부님 역시 그 어둠에 맞서다 다리를 잃고 쫓겨나신 게 아니었나요?”

카단이 한 걸음 앞으로 나서며 무쇠 방패를 가볍게 들어 보였다.

“숙부님의 의족에 새겨진 바람 룬을 보았습니다. 알렉산다르 스승님께서도 바다의 벗 론돌의 충직함을 늘 칭송하셨습니다. 저희를 장원으로 인도해 주십시오.”

론돌은 한참 동안 카단의 단단한 어깨와 실리아의 맑은 눈빛을 번갈아 응시하다가 나지막이 한숨을 내쉬며 뱃전을 두드렸다.

“올라타라. 네 당돌한 고집은 네 어미 실피드를 빼닮았고, 곁에 선 청년의 눈빛은 북방의 늑대처럼 정직하구나.”"""

ep14_s3 = """일행을 태운 나룻배는 일흔두 개의 거대한 석주 미로를 유려하게 헤쳐 나가 마침내 거대한 수상 요새 구름돌아오는장원에 당도했다. 수백 개의 굵은 참나무 기둥으로 호수 위에 세워진 장원은 전쟁 피난민들과 고아, 부상당한 어부들의 따뜻한 안식처였다. 호수에서 건져 올린 살진 잉어를 생강과 산나물에 쪄낸 구수한 냄새가 수상 가옥마다 가득했고, 아이들의 웃음소리가 울려 퍼졌다. 부두 한편에서는 늙은 드워프 대장장이가 화덕을 피우며 부러진 작살과 그물을 손질하고 있었다.

장원의 주민들이 반갑게 다가와 따뜻한 보리차를 건네는 동안, 카단은 장원 중앙 회랑 벽면에 새겨진 고대 수호 마법진을 찬찬히 살펴보았다. 그것은 단순한 벽화가 아니라 적의 공격을 호수의 수압으로 분산시키는 정교한 방어 전술도였다. 발리안 숙부의 수호 진법과 일맥상통하는 원리였다.

카단이 벽화를 가리키며 론돌에게 물었다.

“이 방어 진법은 북방 성기사단의 ‘대지 완충 진’과 형태가 놀라울 정도로 흡사합니다. 두 기예가 본래 하나의 뿌리에서 나온 것입니까?”

론돌이 막걸리 사발을 들이켜며 고개를 끄덕였다.

“날카로운 눈을 가졌구나, 청년. 백 년 전 발리안 경의 선대 성기사들과 우리 바람섬의 장인들이 함께 완성한 수호 진법이다. 방패는 막는 무기가 아니라 대지와 바다의 품으로 충격을 돌려보내는 문이라는 뜻이지.”

실리아가 갓 구워낸 보리빵 한 조각을 건네며 미소를 지었다.

“북방의 추운 툰드라에서는 맛보지 못했던 신선한 민물고기예요. 많이 먹어둬요, 카단.”"""

ep14_s4 = """그때 호수 깊은 곳에서 거대한 물살이 소용돌이치며 비명과 함께 장원의 경종이 요란하게 울려 퍼졌다. 메두사 고르고의 암흑 마나에 오염된 거대한 심연의 수룡 세 마리가 수상 가옥의 받침 기둥들을 들이받으며 습격해 온 것이었다. 기둥들이 부러져 나가며 부두가 기울어졌다. 거대한 뱀의 비늘 사이로 검붉은 부식액이 뿜어져 나와 참나무 갑판을 녹여 내렸다. 주민들이 비명을 지르며 우왕좌왕 흩어졌다.

론돌이 무쇠 의족을 굴러 호수 표면에 거대한 소용돌이를 일으켰고, 실리아는 허공으로 도약해 날카로운 질풍의 화살들을 퍼부었다. 카단은 기우는 부두 끝으로 달려가 무쇠 방패를 내리찍으며 수면에 거대한 서리의 얼음 다리를 펼쳤다.

“주민들은 얼음 다리를 건너 본채로 대피하십시오! 아이들을 먼저 챙기세요!”

피난민들이 얼음 다리를 타고 안전하게 대피하는 사이, 뒤늦게 비에 젖은 채 부두에 도착한 이그니스가 칼을 뽑아 들었다.

“감히 무고한 이들을 해치는 괴물 놈들이!”

이그니스의 검끝에서 터져 나온 백색 화염이 호수 위를 가르며 수룡의 목을 단숨에 베어 넘겼다. 순백의 화염이 타오르며 호수의 물안개를 하얗게 증발시켰다. 물과 불, 서리와 바람이 처음으로 완벽한 하모니를 이루며 호수의 위기를 막아낸 순간이었다."""

ep14_s5 = """수룡들이 호수 밑바닥으로 가라앉고 잔잔한 물결이 돌아왔을 때, 부두 위에는 거친 숨소리만이 감돌았다. 온몸이 흠뻑 젖은 이그니스는 거친 숨을 몰아쉬며 피 묻은 칼날을 거두었다. 검끝을 타고 흘러내리는 검은 피가 빗물에 씻겨 호수로 떨어졌다.

론돌이 다가와 거친 아마포 수건과 김이 모락모락 피어오르는 뜨거운 잉어 수프 한 그릇을 묵묵히 이그니스에게 내밀었다.

“황궁의 도련님치고는 제법 쓸 만한 칼솜씨로군. 몸이 젖었으니 수건으로 닦고 뜨거운 국물이나 들이켜라.”

이그니스는 당황한 듯 그릇을 바라보며 중얼거렸다.

“나는 황궁의 기사다. 천한 어부들의 보살핌 따위는 필요치 않다.”

론돌이 껄껄 웃으며 이그니스의 어깨를 툭 쳤다.

“사람이 사람에게 따뜻한 밥을 건네는 데 신분이 무슨 상관이냐? 마셔라, 식으면 맛없다.”

카단 역시 은빛 단검으로 숯불을 뒤적이며 마른 장작을 모닥불에 더 얹어 주었다.

“불 곁으로 다가와서 몸을 말려라, 이그니스. 내일 새벽이면 우리 모두 저 거친 대해로 나아가야 한다.”

이그니스는 입술을 깨물며 조용히 그릇을 받아 들고 국물을 들이켰다. 생강과 산나물 향이 어우러진 뜨거운 국물이 목을 타고 넘어가자, 이그니스의 얼어붙었던 어깨와 가슴속 응어리가 서서히 풀리기 시작했다. 부두 너머로 밤하늘의 짙은 먹구름이 걷히며, 차가운 별빛이 호수 수면에 은빛 비늘처럼 반짝이고 있었다. 발리안 숙부가 지키려 했던 생명의 온기가 바로 이 소박한 부두 위에 머물고 있었다. 상처 입은 자들이 모여 서로를 위로하는 밤, 호수의 침묵은 한결 부드러워져 있었다."""

ep14_ko = f"# 눈히어로 14화 - 안개 호수의 손님들\n\n> 원문 범위: 제27장-제28장\n\n{ep14_s1}\n\n{ep14_s2}\n\n{ep14_s3}\n\n{ep14_s4}\n\n{ep14_s5}"

# Ep 14 English Translation
ep14_en = """SNSHero Novel
Episode 14: Guests of the Mist Lake

Sprawling across the threshold of the eastern seaboard, Mist Lake remained cloaked year-round in a dense, milky-white water fog, a mystical realm that rarely permitted casual travelers to cross its expanse. Rising from the tranquil waters were seventy-two colossal basalt monoliths, standing like silent, primordial giants, while beneath the crystal emerald depths, the sunken palace spires and fractured arched stone bridges of an ancient drowned realm flickered like spectral phantoms even on bright days. In this serene stillness where not even a lone waterbird cried, Kadan and Cilia followed General Leonar's measured guidance, advancing with cautious steps toward Cloud Return Manor—a massive floating sanctuary resting at the heart of the lake. Whenever chilled breezes swept through the damp reed beds, white cotton fluff from blooming cattails drifted through the mist like lingering snowflakes. Lush emerald moss carpeted the rock crevices like rich velvet, and the trailing branches of weeping willows traced delicate ripples across the glass-like water.

Extending her hand above the water, Cilia read the intricate currents of the drifting fog with a thoughtful murmur.

"The submerged bell towers beneath the floor are releasing faint, rhythmic pulses of mana. The ancient water spirits are still slumbering down below."

Kadan halted at the shoreline, gazing downward through the clear, green depths.

"What are those monumental stone complexes resting beneath the lake bed? It appears as though an entire imperial metropolis was swallowed whole."

Resting his Jade Staff against a mossy boulder, Leonar explained in his gravelly, booming timbre.

"A thousand years ago, this was the heart of Aquaria, the glorious capital of an ancient water-magic civilization. When the forbidden mana within the Nine Shadows Codex spiraled out of control, the entire realm sank into the abyss in a single night. Those seventy-two basalt monoliths we must navigate were once the immense pillars supporting the imperial palaces."

Reaching the weathered timber landing of the lakeside ferry, Cilia plucked a tender reed leaf from the water's edge, bringing it to her lips to play a tranquil wind lullaby. As the clear, melancholic melody echoed across the fog-draped surface, the steady creak of a solitary oar drifted through the murk, and a small wooden skiff emerged into view. Rowing upon the deck stood a weathered old boatman with an iron prosthetic leg in place of his left limb. It was Rondol, the legendary guardian and master navigator who had once protected the outer shores of Whispering Wind Island.

Rondol's piercing gaze rested upon Cilia's face and her elegant teal tunic. His voice was dry and raspy, carrying the chill of the morning mist.

"So you have returned at last, headstrong princess who fled the island. The elders brand you a traitor and curse your name to the tides. By what brazen courage do you dare tread upon this sea once more?"

Meeting Rondol's stern eyes without flinching, Cilia spoke with resolute conviction.

"It was the cowardly elders who chose to seal the gates, burying the monstrous truth behind my mother Sylphid's demise. I did not flee; I departed to honor my mother's spirit and illuminate that darkness, Uncle Rondol. Were you not also cast out, losing your leg when you dared defy that very council?"

Kadan stepped forward, lifting his unadorned iron shield in respectful greeting.

"I recognize the wind rune inscribed upon your iron limb. Master Aleksandar always spoke with profound respect of your unwavering loyalty. Please grant us passage to the manor."

Rondol studied Kadan's grounded shoulders and Cilia's unyielding gaze in prolonged silence before letting out a soft sigh and tapping his oar against the gunwale.

"Step aboard. Your stubborn defiance is the spitting image of your mother Sylphid, and this youth beside you possesses the honest eyes of a northern wolf."

Navigating deftly through the labyrinth of the seventy-two towering monoliths, the skiff arrived at last before Cloud Return Manor. Erected upon hundreds of colossal oak pilings driven deep into the lake floor, the timber compound served as a warm haven for war refugees, displaced orphans, and wounded coastal fishermen. The mouthwatering aroma of fat lake carp steamed with wild mountain ginger and forest greens drifted from the timber verandas, accompanied by the bright laughter of children playing along the railings. On one side of the jetty, an elderly dwarven blacksmith hammered away at a small forge, repairing broken harpoons and iron-weighted nets.

As the manor folk approached with welcoming smiles, offering mugs of steaming roasted barley tea, Kadan observed the ancient defensive arrays intricately carved into the walls of the central gallery. It was far more than ornamental art; it was a sophisticated kinetic distribution matrix designed to absorb hostile impacts and diffuse the force through the immense water pressure of the lake. The tactical philosophy mirrored the profound defensive principles taught by Uncle Balian.

Pointing to the carvings, Kadan asked Rondol in quiet admiration.

"This ward configuration shares an extraordinary resemblance with the Earth Cushioning Array of the northern Holy Knights. Did these two traditions spring from a common foundation?"

Rondol took a deep draught of cloud wine from an earthen bowl and nodded with a grin.

"You have a keen eye, lad. A century ago, Lord Balian's ancestral forebears and the master artisans of Whispering Wind Island collaborated to forge this very matrix. A shield is never merely a wall of metal; it is a gateway that redirects violence back into the gentle embrace of earth and sea."

Offering Kadan a warm slice of fresh barley bread, Cilia smiled softly.

"Fresh lake game is something you never tasted on the frozen tundras of the north. Eat heartily, Kadan."

Suddenly, the water erupted into violent whirlpools, and the manor's alarm bell clanged frantically into the mist. Three immense abyssal sea-drakes, their serpent scales tainted by Medusa Gorgo's necrotic miasma, rammed savagely into the supporting timber pylons. The massive oak timbers fractured with groaning tears, tilting the lower pier at an alarming angle. Corrosive crimson acid sprayed from between the drakes' venomous fangs, hissing as it ate through the wooden planks while panicked refugees scattered in terror.

Stamping his iron pegleg onto the deck, Rondol summoned a swirling vortex across the surface, while Cilia leaped into the air, unleashing a gale of razor-sharp wind arrows. Kadan dashed to the fractured edge of the pier, slamming his iron shield against the timbers to crystallize a wide, shimmering frost bridge across the churning waters.

"Everyone cross the frost bridge into the inner hall! Protect the children first!"

While the terrified families scrambled across the ice to safety, Ignis emerged through the pouring rain onto the lower deck, drawing his longsword with a grim roar.

"Vile abominations who dare prey upon the helpless!"

A searing ribbon of immaculate white flame cleaved through the gloom, decapitating the lead sea-drake in a single blinding stroke. The divine fire incinerated the necrotic venom, sending plumes of pure white steam billowing into the rain. For the first time, water and fire, frost and wind moved in flawless tactical harmony, shattering the assault and saving the sanctuary from devastation.

As the remaining serpents sank dead into the lake bed and the disturbed waters smoothed into glass, only ragged breathing echoed along the sodden jetty. Soaked to the skin, Ignis breathed heavily as he wiped the blackened ichor from his longsword, letting the rain wash the steel clean.

Rondol limped over, carrying a coarse linen towel and a steaming bowl of hot carp broth, holding them out to the imperial commander in silence.

"Not half bad for a gilded palace pup. Dry yourself off and drink down this broth before your bones take a chill."

Ignis stared at the earthen bowl in stunned bewilderment, his lips tightening with residual arrogance.

"I am a knight commander of the imperial court. I have no need for the charity of common fishermen."

Rondol barked a hearty laugh, slapping the young noble's shoulder with rough camaraderie.

"When one person passes a warm bowl of soup to another, what does rank matter? Drink it down, lad; cold broth tastes like swamp water."

Kadan stoked the nearby brazier with the tip of his silver dagger, tossing on dry birch logs to coax up a roaring flame.

"Come sit by the fire and dry your mantle, Ignis. Come sunrise, we must venture out onto the perilous high seas together."

Biting his lip, Ignis took the bowl with trembling fingers and drank. As the rich, ginger-scented warmth spread down his throat, the stiff tension in his shoulders finally melted away. Above the floating harbor, the dark storm clouds parted, unveiling a canopy of distant stars that mirrored across the lake like scattering silver scales. The true warmth Uncle Balian had sacrificed his life to defend lingered right here upon this humble wooden pier. In this quiet night where scarred wanderers tended to one another's burdens, the silence of the lake felt deeper and infinitely kinder."""

print("EP14 KO len:", len(ep14_ko))
print("EP14 EN len:", len(ep14_en))

# ==============================================================================
# EPISODE 15 FULL
# ==============================================================================
ep15_s1 = """자정이 깊어갈 무렵, 안개 호수의 물결은 한층 더 거칠어지고 있었다. 동해안 산맥에서 불어닥친 사나운 밤바람이 구름돌아오는장원의 삼나무 지붕을 사정없이 흔들었고, 굵은 빗줄기가 호수 수면을 어지럽게 두드렸다. 장원 중앙 홀의 거대한 벽난로에서는 참나무 장작이 타닥거리며 붉은 불꽃을 뿜어내고 있었지만, 복도 구석구석으로 스며드는 음산한 한기는 쉽게 가시지 않았다. 나루터의 망루를 지키던 늙은 어부 하나가 흠뻑 젖은 우비를 털며 급히 홀 안으로 뛰어 들어왔다. 그의 품에는 정체불명의 화물 하나가 안겨 있었다.

어부가 거친 숨을 몰아쉬며 화물을 탁자 위에 내려놓았다.

“방금 안갯속에서 검은 돛을 단 쾌속선 한 척이 다가와 이 상자만 던져두고 쏜살같이 사라졌습니다! 수신인에 분명히 레오나르 장군님의 존함이 적혀 있었습니다.”

탁자 위에 놓인 것은 사람 두개골 크기만 한 투명한 흑수정 상자였다. 상자 뚜껑 위에는 정교하게 세공된 다섯 마리의 독사 머리가 똬리를 튼 형상으로 조각되어 있었고, 상자의 이음매 사이로는 보랏빛 인광을 띤 불길한 독기가 실핏줄처럼 피어오르고 있었다.

실리아가 녹옥 지팡이를 쥐며 다급하게 물러서라고 외쳤다.

“가까이 가지 마세요! 상자 표면에 새겨진 문양은 메두사 고르고의 금지된 사령 저주예요! 뚜껑을 여는 순간 치명적인 사독이 퍼져나갈 거예요!”"""

ep15_s2 = """하지만 주의를 주기도 전에, 상자 바닥에 설치된 교활한 시한식 룬 장치가 딸깍하는 소리와 함께 저절로 풀려나갔다. 쩌적 하는 파열음과 함께 수정 상자가 산산조각 나며, 짙은 암자색의 독안개 속에서 다섯 마리의 거대한 사령 독사들이 붉은 눈을 번뜩이며 솟구쳐 올랐다. 실체 없는 망령 독사들은 벽난로 곁 바닥에서 단잠에 빠져 있던 두 명의 난민 어린아이들을 향해 맹렬한 기세로 쇄도했다.

그 찰나, 모닥불 곁에 앉아 있던 레오나르 장군이 천둥 같은 기합과 함께 자신의 거대한 몸을 날렸다.

“이 더러운 버러지 놈들이 어디서 어린것들을 넘보느냐!”

피할 수도, 지팡이를 휘두를 수도 없는 극히 촉박한 순간이었다. 레오나르는 주저 없이 아이들의 몸을 자신의 품안에 감싸 안으며, 넓은 등과 어깨로 사령 독사들의 독아를 온몸으로 받아냈다. 치이익 하는 끔찍한 파열음과 함께 독사들의 이빨이 늙은 사자의 살갗을 파고들었고, 시커먼 부식성 사독이 레오나르의 목덜미와 어깨를 타고 거미줄처럼 번져나갔다.

아이들을 꼭 껴안은 채 무릎을 꿇은 레오나르의 입에서 짙은 핏덩이가 쏟아져 나왔다.

“크윽... 꼬마들아, 괜찮으냐... 다친 곳은 없지...?”"""

ep15_s3 = """아이들은 울음을 터뜨렸고, 홀 안은 아비규환의 혼란에 휩싸였다. 상처에서 뿜어져 나오는 사독은 레오나르의 전신 마나 회로를 급속도로 태워버리며 피부를 잿빛으로 변색시켰다.

카단이 성큼 앞으로 뛰쳐나가며 허리춤의 은빛 단검을 뽑아 들었다. 북방 혹한의 설원에서 단련된 별 호흡의 마나가 단검의 날카로운 칼날 위로 서릿발처럼 서려 올라왔다.

“더러운 원혼들이 감히 의로운 자의 피를 더럽히지 못한다!”

카단의 은빛 단검이 허공을 가르며 푸른 유성 같은 궤적을 그렸다. 알렉산다르 스승이 전수했던 성기사의 파마 비검이 사령 독사들의 목을 연달아 꿰뚫었다. 빛의 궤적이 지나간 자리마다 독사들이 처절한 비명을 지르며 하얀 재가 되어 흩어졌다.

동시에 실리아가 녹옥 지팡이를 머리 위로 치켜들며 청아한 바람의 축복을 영창했다.

“동쪽 바다의 정령들이여, 이 더러운 장막을 걷어내고 맑은 숨결을 되돌려주소서!”

실리아의 발밑에서 솟구쳐 오른 청록색 바람의 소용돌이가 홀 안을 가득 채우고 있던 보랏빛 독안개를 천장 환기창 밖으로 단숨에 밀어냈다. 서늘하고 맑은 호수의 바람이 들어오며 마침내 맹독의 기운이 완전히 소멸되었다."""

ep15_s4 = """소동을 듣고 복도를 달려온 이그니스가 홀 안의 처참한 광경을 목격하고 굳어버렸다. 산산조각 난 수정 상자의 잔해 속에서 무언가 반짝이는 쇠붙이가 이그니스의 시선에 들어왔다. 그것은 상자의 뇌관에 새겨진 황실 재상의 황금 인장이었다. 붉은 밀랍에는 수도 최고 재상 루시안의 가문 문장과 함께 황실 비밀 감찰대의 극비 지령 코드가 선명하게 찍혀 있었다.

이그니스의 눈동자가 걷잡을 수 없이 흔들렸다. 손끝이 파르르 떨리며 입술에서 피가 배어 나왔다.

“황실의 인장... 루시안 재상이 직접 보낸 암살 도구였단 말인가? 무고한 난민들과 은퇴한 노장을 몰살하고 성기사단의 소행으로 위장하려 한 것이... 내가 충성을 바쳤던 황궁의 정의였단 말인가!”

이그니스는 자신의 가슴에 달려 있던 순백 화염 기사단의 금빛 훈장을 거칠게 뜯어내 바닥에 내던졌다. 금속 훈장이 차가운 석판 위를 구르며 비참한 소리를 냈다. 평생을 믿어왔던 황실의 법과 질서가 한순간에 추악한 시궁창으로 전락해 버린 순간이었다.

카단이 다가와 이그니스의 떨리는 어깨를 묵묵히 짚어주었다.

“진실을 마주하는 것은 고통스러운 일이다. 하지만 눈을 감지 않는 것만이 그 오명을 씻어낼 수 있는 유일한 시작이다.”"""

ep15_s5 = """레오나르는 기둥에 등을 기대고 앉아 거친 숨을 몰아쉬며 피 묻은 입가를 닦아냈다. 그의 얼굴에는 이미 죽음의 그림자가 짙게 깔려 있었지만, 노장의 눈빛만은 사자의 위엄을 잃지 않고 있었다. 레오나르는 떨리는 손으로 자신의 상징이었던 거대한 녹옥 지팡이를 들어 올려 카단과 실리아에게 건넸다.

“내 목숨의 불씨는 여기까지다... 하지만 바람 속삭임 섬의 결계탑은 반드시 지켜내야 한다. 에올루스에게 전해라... 레오나르는 마지막 순간까지 도망치지 않고 제자리를 지켰노라고...”

실리아가 눈물을 글썽이며 지팡이를 받아 들었다.

“장군님, 이 지팡이에 깃든 대지의 맹세를 결코 헛되이 하지 않겠어요. 반드시 섬을 구하고 어머니의 진실을 밝혀내겠어요.”

레오나르는 곁에서 고개를 숙이고 흐느끼는 난민 아이들의 머리를 커다란 손으로 부드럽게 쓰다듬었다.

“울지 마라, 얘들아... 늙은 사자는 그저 잠시 눈을 붙이는 것뿐이다...”

장원의 난민들과 어부들이 하나둘 모여들어 노장을 둘러싸고 고요한 바다의 진혼곡을 부르기 시작했다. 거센 폭풍우가 잦아들고 새벽의 푸른빛이 호수 위로 내려앉을 때, 노장은 평온한 미소를 머금은 채 영원한 안식에 들었다. 세 젊은이는 거인의 죽음 앞에 무릎을 꿇고, 다가올 결전을 향한 결의를 가슴 깊이 새겼다."""

ep15_ko = f"# 눈히어로 15화 - 독사와 사자의 밤\n\n> 원문 범위: 제29장-제30장\n\n{ep15_s1}\n\n{ep15_s2}\n\n{ep15_s3}\n\n{ep15_s4}\n\n{ep15_s5}"

ep15_en = """SNSHero Novel
Episode 15: Night of the Vipers and the Lion

As midnight deepened, the waves across Mist Lake grew increasingly tumultuous. Violent nocturnal gales sweeping down from the eastern mountain crags battered the cedar shingles of Cloud Return Manor without mercy, while torrents of heavy rain churned the dark waters into foam. Within the manor's great central hearth, logs of seasoned oak crackled and cast fluttering orange flames across the hall, yet the uncanny chill seeping through the drafty corridors defied the fire's warmth. An elderly watchman stationed at the jetty tower hurried into the hall, shaking the driving rain from his oilskin cloak. Clutched tightly against his chest was an unidentified parcel wrapped in sodden burlap.

Panting heavily, the fisherman set the container down atop the heavy trestle table.

"Just moments ago, a black-sailed cutter slipped through the fog, hurled this crate onto the jetty, and vanished into the darkness! General Leonar's honored name is carved distinctly across the lid!"

Resting upon the timber planks was a skull-sized chest carved from translucent black crystal. Atop the lid squatted five masterfully sculpted viper heads coiled in serpentine tension, while from the fine hairline fractures along the seams seeped an ominous violet miasma, pulsing like living capillaries.

Cilia gripped her staff, her voice ringing out in sharp alarm.

"Do not approach it! The runes etched across those crystal facets bear the forbidden necromantic death-curses of Medusa Gorgo! The instant the lid is released, lethal necrotic venom will engulf this room!"

Before her warning could be fully registered, the cunning internal clockwork trigger embedded within the box's base released with a crisp, fatal click. With a violent crystalline detonation, the obsidian chest shattered into shards, and from the billowing purple toxic vapor surged five ethereal phantom vipers with burning crimson eyes. The weightless spirit-serpents lunged with blinding speed toward two young refugee orphans slumbering wrapped in blankets beside the hearthstone.

In that heart-stopping instant, General Leonar launched his massive frame across the floor with the thunderous roar of an enraged lion.

"Vile vermin, dare you bare your fangs against innocent babes!"

It was a split second too brief to evade or brandish his heavy staff. Without a trace of hesitation, Leonar swept his immense arms around the children, shielding their fragile bodies against his breast while presenting his broad back and shoulders to the incoming strike. With a sickening hiss of dissolving flesh, the spectral fangs sank deep into the veteran's nape and collarbone, and a network of blackened, corrosive necrotic venom spread like spiderwebs beneath his graying skin.

Kneeling rigidly with his arms locked around the weeping children, Leonar coughed violently, dark clots of corrupted blood spattering the flagstones.

"Ghk... Little ones, are you harmed...? Speak to me, are you whole...?"

Wailing in terror, the children clung to his tunic as pandemonium erupted through the hall. The lethal curse surging through Leonar's bloodstream rapidly incinerated his mana conduits, bleaching his weathered bronze skin into an ash-pale gray.

Kadan sprang forward with decisive fury, drawing the silver dagger from his belt. Channeling the star rhythm perfected across the frozen northern tundras, a brilliant aura of purifying starlight wrapped around the razor edge like crackling frost.

"Foul spirits shall never desecrate the blood of the righteous!"

With fluid, lightning precision, Kadan cleaved through the air. The sacred anti-fiend sword techniques passed down by Master Aleksandar severed the ethereal spines of the five phantom serpents in consecutive arcs of azure radiance. Wherever the blade passed, the screeching apparitions dissolved into shimmering white ash, snuffed out by the starlight.

Simultaneously, Cilia hoisted her Jade Staff high overhead, invoking the ancient cleansing cantrip of the eastern wind.

"Spirits of the eastern sea, sweep away this defiling shroud and restore the pure breath of life!"

A spiraling vortex of teal wind erupted from beneath Cilia's boots, sweeping the lingering clouds of violet毒 vapor straight up through the open roof vents into the torrential night. Crisp, pristine lake breezes poured into the timber hall, eradicating the last lingering traces of necrotic venom.

Rushing into the hall after hearing the tumult, Ignis froze in horror at the scene of destruction. Amidst the glittering fragments of the shattered crystal chest, a gleam of polished metal caught his eye. It was the golden imperial signet mechanism that had primed the detonation. Stamped into the hardened crimson wax was the personal crest of High Minister Lucian, flanked by the classified cipher runes of the Imperial Secret Inquisition.

Ignis's golden eyes widened in disbelieving agony, his breath catching as blood welled where his teeth bit through his lip.

"The imperial crest... It was Minister Lucian himself who dispatched this cowardly murder weapon? To butcher helpless refugees and an honorable retired general, solely to blame the atrocity upon the Holy Knights... Is this the 'order and justice' to which I pledged my sword and soul!"

In a frenzy of grief and disgust, Ignis violently tore the gilded medal of the White Flame Order from his breastplate, hurling it against the stone floorboards. The gilded emblem clattered across the flags with a hollow, pathetic chime. The grand edifice of imperial righteousness that had anchored his entire existence had collapsed into a cesspool of vile deceit.

Stepping forward, Kadan placed a firm, steady hand upon Ignis's shuddering shoulder.

"Facing the naked truth is an agonizing wound, Ignis. Yet keeping your eyes open to that darkness is the only way honor can ever be reborn."

Slumped against a timber stanchion, Leonar wiped dark blood from his lips, his breathing growing shallow and rasping. Though the veil of death was descending swiftly across his features, the old warlord's gaze retained the undaunted majesty of a battlefield titan. With trembling, calloused hands, he lifted his legendary Jade Staff, passing the ancestral weapon into the care of Kadan and Cilia.

"My ember burns down to the wick... But the barrier spires of Whispering Wind Island must never fall. Tell Aeolus... that Leonar never retreated, that he held his ground until his final breath..."

Tears spilled down Cilia's cheeks as her hands closed around the polished jade.

"General, the sacred covenant of the earth bound within this staff shall never be betrayed. We will safeguard the island and illuminate my mother's truth, no matter the cost."

Reaching out with gentle, massive fingers, Leonar patted the heads of the weeping refugee orphans who clung to his knees.

"Weep not, little ones... An old lion is merely closing his eyes for a well-earned slumber..."

The refugees and fishermen gathered in a silent circle around their fallen protector, raising their voices in a sorrowful, ancient mariners' requiem. As the tempest outside gradually waned and the cool blue hues of early dawn settled over Mist Lake, the great warrior breathed his last with a peaceful smile upon his lips. Kneeling before the fallen titan, the three youths forged an unbreakable vow of resolve for the battles that lay ahead."""

# ==============================================================================
# EPISODE 16 FULL
# ==============================================================================
ep16_s1 = """바람 속삭임 섬으로 출항하기 전날 밤, 며칠 동안 안개 호수를 무겁게 짓누르던 짙은 유백색 물안개가 한순간 거짓말처럼 걷혀 나갔다. 호수 위로 차가운 상현달이 떠오르며 거대한 일흔두 개의 현무암 석주를 은빛으로 물들였고, 잔잔해진 수면은 마치 거대한 거울처럼 밤하늘의 은하수를 고스란히 비춰내고 있었다. 장원의 피난민들이 슬픔을 딛고 내일의 출항 준비로 잠든 야심한 시각, 카단은 홀로 부두 끝으로 걸어 나갔다.

부두의 가장 외진 돌출부 끝에 익숙한 뒷모습이 서 있었다. 순백의 망토를 벗어 던진 채 낡은 가죽 갑주만을 걸친 이그니스였다.

이그니스는 황실 기사단의 상징이자 가문의 보검이었던 은장 장검을 양손으로 쥐고 있었다. 달빛 아래에서 서슬 퍼런 칼날이 시리도록 번뜩였다. 이그니스는 일말의 망설임도 없이 손을 놓았고, 보검은 허공을 가르며 깊고 검은 호수 속으로 풍덩 소리를 내며 가라앉았다. 수면 위로 동심원의 파문이 퍼져나가며 검의 자취를 지워버렸다.

카단이 천천히 다가가 곁에 섰다.

“황실의 영예가 깃든 검이다. 아깝지 않은가?”

이그니스는 호수 밑바닥으로 사라진 검의 궤적을 응시하며 메마른 목소리로 대답했다.

“거짓과 피로 얼룩진 명예 따위는 차라리 호수 바닥의 진흙 속에 묻히는 편이 낫다. 내 손으로 지켜왔다고 믿었던 모든 것들이, 실은 무고한 사람들의 피를 빨아먹는 괴물들의 방패막이에 불과했어.”"""

ep16_s2 = """이그니스의 목소리에는 깊은 자괴감과 절망이 짙게 배어 있었다. 자신의 손에 묻은 피와 속아 살아온 세월의 무게가 젊은 기사의 영혼을 짓누르고 있었다.

카단은 묵묵히 품속을 뒤져 가죽 주머니에서 양피지 서신 한 통을 꺼냈다. 모서리가 닳고 피 얼룩이 묻어 있는 편지였다. 칠흑 노동수용소를 탈출한 뒤 숨을 거두기 전, 발리안 숙부가 남긴 마지막 친필 서신이었다.

카단이 편지를 이그니스에게 건넸다.

“발리안 숙부님께서 내게 맡기신 편지다. 네 손에 직접 쥐여주어야 비로소 그분의 넋이 편히 쉴 수 있을 것이다.”

이그니스는 떨리는 손으로 편지를 펼쳤다. 양피지 위에는 거칠고 투박하지만 한 자 한 자 피를 토하듯 써 내려간 아버지 발리안의 필체가 적혀 있었다.

‘나의 아들 이그니스에게. 네가 황궁의 백색 화염을 쥐었을 때, 아비는 슬펐으나 너를 원망하지 않았다. 빛을 갈망하는 네 순수한 영혼을 알기 때문이었다. 알렉산다르 형님과 내가 걸었던 길은 고난이었으나 결코 헛되지 않았다. 네 검이 향해야 할 곳은 권력의 왕좌가 아니라, 추위에 떠는 어린아이들의 손이어야 한다. 너를 사랑한다, 나의 아들아.’

편지를 읽어 내려가던 이그니스의 눈에서 굵은 눈물방울이 뚝뚝 떨어져 양피지 위를 적셨다. 평생 자신을 버렸다고 원망했던 아버지가, 실은 마지막 순간까지 자신을 자랑스러운 아들로 품고 있었다는 진실 앞에 이그니스는 무릎을 꿇고 오열했다."""

ep16_s3 = """달빛 아래에서 오랜 흐느낌이 잦아들었을 때, 이그니스는 눈물 젖은 얼굴을 들어 카단을 올려다보았다.

“카단... 너는 어떻게 견뎠지? 부모를 잃고, 스승을 잃고, 온 세상이 너를 거짓으로 몰아세우는데 어떻게 그 거대한 증오에 집어삼켜지지 않고 버틸 수 있었던 거냐?”

카단은 허리춤의 은빛 단검을 뽑아 칼날에 비친 달빛을 바라보았다. 붉은 매듭이 밤바람에 부드럽게 나부꼈다.

“알렉산다르 스승님께서는 무기는 상대를 베기 위한 도구가 아니라, 약한 자들을 위해 폭풍을 대신 맞아주는 지붕이어야 한다고 가르치셨다. 방패를 쥐는 손이 무거울수록, 지켜야 할 사람들의 온기가 가슴속에 차오르는 법이다. 증오는 상대를 파괴하기 전에 내 영혼을 먼저 태워버리지만, 지키고자 하는 마음은 혹한 속에서도 불씨를 피워낸다.”

이그니스는 자신의 비어 있는 두 손을 내려다보았다. 칼자루를 쥐었던 손바닥의 굳은살이 부끄럽게 느껴지지 않았다.

“지붕이라... 나 역시 누군가의 지붕이 될 수 있을까.”

카단이 방패를 두드리며 미소 지었다.

“우리는 형제다, 이그니스. 발리안 숙부님과 알렉산다르 스승님이 그러셨듯, 이제는 우리가 서로의 등을 맡길 차례다.”"""

ep16_s4 = """그 감동의 순간, 장원 외곽의 수상 회랑 쪽에서 쉭 하는 불길한 쇠뇌 소리와 함께 경계병의 외마디 비명이 밤공기를 갈랐다. 루시안 재상이 보낸 최정예 암살 부대 ‘홍련의 이빨’ 감찰 기사 스무 명이 장원의 침묵을 찢고 부두를 향해 쇄도해 온 것이었다. 그들의 손에는 피 묻은 갈고리 검과 독화살이 들려 있었고, 출항을 앞둔 피난선들을 불태우기 위한 기름 항아리가 준비되어 있었다.

암살 대장이 흉포한 살기를 뿜어내며 소리쳤다.

“역적 놈들과 황궁의 배신자를 한 놈도 남기지 말고 몰살해라! 저택과 배를 모조리 불태워 증거를 인멸하라!”

카단이 주저 없이 무쇠 방패를 앞으로 내세우며 전열을 막아섰다. 빗발치는 독화살들이 방패 표면에 부딪쳐 요란한 불꽃을 튀기며 튕겨 나갔다.

“내 방패 뒤로는 단 한 발자국도 지나갈 수 없다!”

그 옆으로 이그니스가 뛰쳐나왔다. 무기를 버렸던 이그니스는 바닥에 뒹굴던 쇠파이프를 집어 들고, 자신의 마나를 끌어올렸다. 황궁의 오만함을 벗어던진 순백의 화염이 쇠파이프를 타고 타올랐다. 그것은 파괴의 불꽃이 아니라, 동료를 지키기 위한 정화의 성화였다.

이그니스의 화염 강타가 암살자들의 무기를 산산조각 내며 그들을 호수 속으로 쓸어 넣었다. 카단의 견고한 방패와 이그니스의 순백 화염이 완벽한 조화를 이루며, 순식간에 암살 부대의 습격을 완벽하게 분쇄했다."""

ep16_s5 = """패퇴한 암살자들이 호수 속으로 뛰어들어 도망치고, 부두 위에는 다시 평온한 침묵이 돌아왔다.

동쪽 수평선 너머로 짙은 남색 밤하늘이 서서히 붉게 물들기 시작했다. 장원의 거대한 범선 ‘미풍의날개호’의 돛이 펄럭이며 출항을 알리는 고동 소리가 호수 전체에 웅장하게 울려 퍼졌다.

실리아가 뱃머리에서 손을 흔들며 외쳤다.

“카단, 이그니스! 닻이 올라가고 있어요! 바람이 순풍으로 바뀌었어요, 어서 타세요!”

론돌 역시 키를 잡고 우렁찬 목소리로 외쳤다.

“바다의 신이 우리에게 길을 열어주셨다! 젊은 사자들아, 새로운 시대를 향해 돛을 올려라!”

카단과 이그니스는 서로의 팔뚝을 단단히 맞잡으며 굳은 전우애의 눈빛을 나누었다. 두 청년은 나란히 갑판 위로 뛰어올랐고, 배는 일흔두 개의 거대한 석주 미로를 빠져나와 광활한 푸른 대해를 향해 힘차게 미끄러져 나갔다. 아침 햇살이 두 형제의 어깨 위로 찬란한 황금빛 축복을 내리고 있었다."""

ep16_ko = f"# 눈히어로 16화 - 폐허 앞의 형제\n\n> 원문 범위: 제31장-제32장\n\n{ep16_s1}\n\n{ep16_s2}\n\n{ep16_s3}\n\n{ep16_s4}\n\n{ep16_s5}"

ep16_en = """SNSHero Novel
Episode 16: Brothers Before the Ruins

On the eve of their voyage to Whispering Wind Island, the dense, milky-white fog that had weighed upon Mist Lake for days lifted as if by magic. A cool crescent moon rose above the placid waters, bathing the seventy-two colossal basalt monoliths in silver radiance, while the mirror-like surface reflected the vast river of stars overhead in breathtaking clarity. In the dead of night, while the weary refugees slept after preparing the vessels for the morning departure, Kadan walked alone toward the furthest jetty of the floating manor.

Standing silhouetted against the moonlight at the far edge was a solitary, familiar figure. Having cast aside his immaculate white commander's cloak, Ignis wore only a battered leather arming doublet.

Grasping his silver-hilted ceremonial longsword—the ancestral heirloom of his lineage and the proud symbol of the White Flame Order—with both hands, Ignis gazed upon the keen, polished edge gleaming in the moonlight. Without a trace of hesitation, he opened his fingers. The blade sliced through the cool air, vanishing into the black depths of the lake with a heavy splash. Rippling concentric rings spread across the surface, swallowing the weapon's trail into the abyss.

Approaching quietly, Kadan stood beside him.

"That blade carried the highest honor of the imperial court. Do you feel no regret?"

Fixing his gaze upon the dark ripples, Ignis spoke in a hoarse, hollow voice.

"Honor stained in deceit and innocent blood is far better buried beneath the lake mud. Everything I spent my life fighting to protect was nothing more than a shield for corrupt monsters feasting upon the weak."

The despair and self-loathing in Ignis's tone cut deep into the night air. The crushing burden of guilt for blood shed in service of lies weighed heavily upon the young warrior's spirit.

Reaching inside his woolen coat, Kadan retrieved a weathered parchment scroll from an oiled leather pouch. It was dog-eared and stained with dried blood—the final letter written by Uncle Balian before his passing.

Kadan offered the scroll into Ignis's hands.

"Uncle Balian entrusted this letter to me. He said his soul could only rest in peace once it rested within your own grasp."

With trembling hands, Ignis broke the wax seal. Written upon the parchment in rough, powerful strokes was his father's unmistakable handwriting.

'To my son, Ignis. When you took up the White Flame in the capital, your father's heart ached with sorrow, yet I never held bitterness toward you. I knew the pure integrity of your spirit, yearning only to bring light to the realm. The path brother Aleksandar and I walked was fraught with hardship, but it was never in vain. The point of your sword must never serve the throne of tyrants; it must shield the hands of freezing children. You are loved, my son.'

As Ignis read the words, large tears welled and fell, darkening the ink upon the parchment. The father he had believed had abandoned him had, until his dying breath, held him in his heart as a cherished son. Overwhelmed by grief and redemption, Ignis sank to his knees upon the wooden planks, weeping openly.

When the quiet sobs subsided under the silver moonlight, Ignis lifted his tear-streaked face toward Kadan.

"Kadan... How did you endure? Having lost your parents, your master, and with the entire world branding you a criminal... How did you keep from being swallowed whole by the roaring fires of hatred?"

Drawing the silver dagger at his waist, Kadan gazed upon the moonlight gleaming along its spine. The red knot danced gently in the nocturnal lake breeze.

"Master Aleksandar taught me that a weapon is never an instrument to conquer or punish. It must be a sturdy roof that weathers the storm in place of the fragile and defenseless. The heavier the shield in your hand, the warmer the hearts of those you protect will dwell within your breast. Hatred incinerates one's own soul long before it reaches the foe, but the resolve to protect kindles an eternal ember even amidst the bitterest blizzard."

Ignis looked down at his empty, calloused hands. The warrior's scars across his palms no longer felt like badges of shame.

"A roof... Could hands like mine ever serve as a shelter for another?"

Kadan tapped his iron rim with a warm smile.

"We are brothers, Ignis. Just as Uncle Balian and Master Aleksandar stood together, it is our turn to watch each other's back."

In that tender moment, a sharp hiss of crossbow quarrels and the frantic cry of a sentry shattered the night air from the outer timber colonnade. Twenty elite inquisitors of the Crimson Fang, dispatched by Minister Lucian to exterminate all living witnesses, charged across the outer piers toward the ships. Hooked blades and poisoned bolts gleamed in their hands, accompanied by jars of flammable pitch meant to incinerate the refugee vessels before departure.

The inquisition commander barked with vicious malice.

"Slaughter the northern rebels and the imperial turncoat without mercy! Burn the manor and every ship to ash to leave zero evidence behind!"

Without an instant's hesitation, Kadan planted his iron shield forward, anchoring the front line. A volley of poisoned bolts slammed into the curved surface, scattering sparks and splintering harmlessly away.

"Not a single foot shall pass behind this shield!"

Beside him, Ignis charged forward. Deprived of his sword, he seized an iron stanchion from the deck, channeling his mana to the absolute limit. Stripped of imperial arrogance, the pure white flame roared to life along the metal. It was no longer a fire of conquest, but a sanctifying hearthfire ignited solely to defend his comrades.

Ignis's sweeping strike shattered the assassins' weapons, casting the assailants headlong into the icy lake. Kadan's immovable barrier and Ignis's immaculate white flame moved in seamless harmony, annihilating the ambush within minutes.

As the surviving assassins scrambled into the dark waters in panic, tranquil silence returned to the pier.

Beyond the eastern horizon, the deep indigo sky blushed with the first rose-gold hues of dawn. The massive sails of the flagship, 'Breeze Wing', unfurled in the morning wind, and the resonant blast of a conch horn echoed across the mist-cleared lake.

Leaning over the forward railing, Cilia waved eagerly.

"Kadan, Ignis! The anchors are drawn! The wind has turned favorable, come aboard!"

Gripping the helm, Rondol bellowed with hearty triumph.

"The sea gods have opened our passage! Young lions, unfurl the sails toward the new dawn!"

Clasping each other's forearms in an unbreakable pledge of brotherhood, Kadan and Ignis bounded up the gangway. Slipping gracefully between the seventy-two ancient basalt monoliths, the ship glided out toward the boundless expanse of the azure ocean. Morning sunlight washed over the brothers' shoulders, crowning their journey with a golden blessing."""

print("EP15 KO len:", len(ep15_ko), "EN len:", len(ep15_en))
print("EP16 KO len:", len(ep16_ko), "EN len:", len(ep16_en))

# Write out arc1_batch2.py
with open("scripts/novel_data/arc1_batch2.py", "w", encoding="utf-8") as f:
    f.write(f'''# -*- coding: utf-8 -*-
"""
scripts/novel_data/arc1_batch2.py
Episodes 12, 13, 14, 15, 16
Authentic commercial fantasy literature, 3,750 - 4,100 chars, 12 - 16 dialogues.
"""

EP12_KO = """{ep12_ko}"""
EP12_EN = """{ep12_en}"""

EP13_KO = """{ep13_ko}"""
EP13_EN = """{ep13_en}"""

EP14_KO = """{ep14_ko}"""
EP14_EN = """{ep14_en}"""

EP15_KO = """{ep15_ko}"""
EP15_EN = """{ep15_en}"""

EP16_KO = """{ep16_ko}"""
EP16_EN = """{ep16_en}"""
''')

print("Successfully written scripts/novel_data/arc1_batch2.py")
