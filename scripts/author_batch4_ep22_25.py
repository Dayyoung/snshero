# -*- coding: utf-8 -*-
import sys, os, re
sys.path.insert(0, ".")

from scripts.build_arc3_batch4_full import EP21_KO, EP21_EN

# ==============================================================================
# EPISODE 22: 무인도의 투석기 (Target: ~3,850 chars)
# ==============================================================================
ep22_s1 = """세븐브리지 항구를 벗어난 꽃배 선단이 수도로 진입하기 위한 유일한 해상 관문인 ‘사이렌 해협’ 어귀에 도달했을 때, 바다 위에는 차가운 긴장감이 팽팽하게 감돌았다. 해협의 가장 좁은 목덜미 양쪽 암벽 위에는 루시안의 황실 해군이 구축해 둔 거대한 마나 쇠뇌 포탑 세 개가 시퍼런 살기를 번뜩이고 있었고, 해협 한가운데에는 흑철 장갑을 두른 거대한 황실 철갑선 두 척이 닻을 내린 채 민간 선박의 통행을 철저히 차단하고 있었다. 포탑에서 발사되는 마나 유탄은 사정거리가 천 길에 달해, 목재로 된 꽃배들로는 도저히 정면 돌파가 불가능한 형국이었다.

론돌이 키를 잡은 채 쌍안경으로 해협의 방어선을 살피며 혀를 찼다.

“저 철갑선들의 흘수선이 너무 깊어 우리 꽃배들이 접근하기도 전에 마나포에 수장되고 말겠어. 암벽 위의 쇠뇌 포탑들을 먼저 침묵시키지 않고는 단 한 척도 해협을 빠져나갈 수 없다.”

카단이 뱃머리에서 해협 외곽에 홀로 솟아 있는 거친 암초 바위섬 ‘갈매기바위섬’을 가리켰다.

“저 암초 섬은 포탑들의 사각지대입니다. 저곳에 교두보를 마련하고 적의 방어선을 무너뜨릴 기습 수단을 마련해야 합니다.”

실리아가 녹옥 지팡이로 바람의 흐름을 읽으며 동의했다.

“갈매기바위섬 주변은 조류가 거칠어 적들의 정찰선이 쉽게 접근하지 못해요. 저곳이라면 은밀히 거점을 구축할 수 있어요.”

이그니스 역시 주먹을 쥐며 고개를 끄덕였다.

“황궁 철갑선의 장갑은 두껍지만, 위에서 쏟아지는 낙하 충격에는 취약하다. 높은 곳에서 일격을 가할 수단만 있다면 철갑선의 갑판을 부술 수 있다.”"""

ep22_s2 = """일행은 은밀히 방향을 틀어 파도가 거세게 몰아치는 무인도 갈매기바위섬의 모래톱에 닻을 내렸다. 사방이 깎아지른 절벽으로 둘러싸인 황량한 바위섬이었지만, 해안가에는 수많은 난파선들의 거대한 참나무 목재와 질긴 대왕 다시마 줄기들이 파도에 밀려와 어지럽게 널브러져 있었다.

드워프 대장장이 그림리가 커다란 양손 도끼를 모래사장에 꽂으며 호탕하게 웃음을 터뜨렸다.

“크하하! 바다가 우리에게 최고의 공성 재료들을 선물해 주었구나! 이 굵은 참나무 용골과 탄력 있는 흑철 나무토막들을 보아라! 이 늙은 그림리의 손재주라면 한나절 만에 성벽도 부수는 거대한 ‘삼중 회전식 투석기’를 뚝딱 만들어낼 수 있다!”

카단이 은빛 단검을 뽑아 참나무 목재의 썩은 껍질을 능숙하게 깎아내며 거들었다.

“좋습니다, 그림리 스승님. 제가 목재의 이음새를 다듬고 쐐기를 박겠습니다.”

이그니스는 모래밭에 돌을 모아 간이 화덕을 쌓고, 순백의 화염을 일으켜 부러진 닻과 쇠사슬들을 녹여 투석기의 핵심 회전축을 단련하기 시작했다.

“이 화염으로 쇠사슬을 녹여 단단한 강철 베어링을 주조하겠다. 적의 철갑선을 한 방에 박살 낼 묵직한 놈으로 만들자.”

실리아는 바닷가에 널려 있던 질긴 대왕 다시마와 밧줄을 모아, 바람의 마나를 주입하며 탄력 넘치는 투석용 탄성 로프를 꼬아 나갔다. 세 젊은이와 드워프 장인의 손길이 완벽한 조화를 이루며 모래톱 위에서 거대한 공성 병기가 형태를 갖추어 갔다."""

ep22_s3 = """노을이 질 무렵, 마침내 높이 서른 자에 달하는 거대한 참나무 투석기가 갈매기바위섬 정상 절벽 위에 웅장한 자태를 드러냈다. 바위섬의 거대한 현무암 덩어리들이 포탄으로 준비되었고, 실리아는 포탄 표면에 냉기의 서리 룬을 새겨 폭발 시 거대한 빙벽 파편을 비산시키는 특수 탄환을 완성했다.

그림리가 투석기의 권양기 톱니바퀴를 점검하며 카단의 어깨를 툭 쳤다.

“카단, 네 스승 알렉산다르 경도 과거 제1차 성전 때 나와 함께 눈 덮인 협곡에서 이런 투석기를 만들었었지. 그 우직한 친구는 방패만 잘 다루는 게 아니라 나무를 깎고 돌을 쌓는 손재주도 기가 막혔어. 네 망치질 솜씨를 보니 스승의 피가 헛되이 흐르지 않았구나.”

카단이 방패를 짚고 서서 서쪽 바다를 바라보며 엷은 미소를 지었다.

“스승님께서는 기술이란 파괴가 아니라, 소중한 이들을 지키기 위한 지혜의 발현이라고 가르치셨습니다. 이 투석기는 길을 막아선 폭력을 부수고 사람들을 살릴 문을 여는 열쇠입니다.”

이그니스가 투석기 발사대에 불타는 성화를 덧씌우며 나지막이 중얼거렸다.

“발리안 아버지와 알렉산다르 숙부님이 함께 걸으셨던 길을, 이제 우리가 걷고 있군.”"""

ep22_s4 = """그때 해협 저편에서 경종 소리가 울리며, 이상 징후를 감지한 황실 정찰 쾌속선 두 척이 갈매기바위섬을 향해 전속력으로 다가오기 시작했다. 쾌속선의 갑판 위에서 궁수들이 불화살을 메기며 투석기를 향해 조준하고 있었다.

실리아가 녹옥 지팡이를 휘둘러 바다 안개를 짙게 끌어올렸다.

“안개의 장막으로 섬의 정상을 가리겠어요! 적들이 조준하지 못하게 시간을 벌게요!”

자욱한 유백색 안개가 바위섬을 뒤덮는 사이, 카단이 투석기의 격발 레버를 꽉 쥐었다.

“목표, 전방 삼천 보 거리의 황실 제1철갑선 기관실이다!”

그림리가 권양기 쐐기를 내리쳤다.

“발사해라, 애송이!”

쿠우웅!

거대한 투석기 팔이 허공을 가르며 서리 룬이 새겨진 거대한 현무암 암괴를 쏘아 올렸다. 허공을 가르는 포탄은 포효하는 유성처럼 날아가, 해협 중앙에 정박해 있던 황실 제1철갑선의 장갑 갑판을 정통으로 강타했다.

콰아아앙!

철갑선의 두꺼운 장갑판이 종잇장처럼 구겨지며 거대한 얼음 폭풍이 선체를 뒤흔들었다. 동력을 공급하던 마나 증기 보일러가 연쇄 폭발을 일으키며 철갑선이 검은 연기를 뿜으며 옆으로 기울어지기 시작했다."""

ep22_s5 = """연이어 장전된 두 번째, 세 번째 포탄이 해협 양쪽 암벽의 쇠뇌 포탑들을 차례로 강타했다. 수백 톤의 바위 파편이 쏟아져 내리며 황실 해군의 포탑들이 산산조각 나 해협 바닥으로 무너져 내렸다.

해협을 가로막고 있던 철갑선이 침몰하고 포탑들이 침묵하자, 사이렌 해협의 거친 물길이 활짝 열렸다.

바다 위에서 대기하고 있던 수백 척의 꽃배 선단에서 우레와 같은 함성이 터져 나왔다. 론돌이 기함의 돛을 높이 올리며 고동을 길게 불어 승리를 알렸다.

카단과 이그니스, 실리아는 투석기 곁에 서서 열린 해협을 통과하는 꽃배들을 바라보며 안도의 숨을 내쉬었다.

그림리가 호리병에 든 독한 드워프 에일을 카단에게 건네며 껄껄 웃었다.

“잘했다, 아이들아! 첫 번째 관문을 멋지게 뚫어냈구나! 이제 용의 뿔 산맥의 비밀 석굴로 가서 선대 영웅들이 남긴 유산을 확인할 차례다!”

카단이 에일을 한 모금 들이켜며 고개를 끄덕였다.

“가자, 동료들이여. 대륙의 새벽이 머지않았다.”

일행은 갈매기바위섬을 뒤로하고, 용의 뿔 산맥 기슭을 향해 힘찬 항해를 재개했다."""

EP22_KO = f"# 눈히어로 22화 - 무인도의 투석기\n\n> 원문 범위: 제43장-제44장\n\n{ep22_s1}\n\n{ep22_s2}\n\n{ep22_s3}\n\n{ep22_s4}\n\n{ep22_s5}"

EP22_EN = """SNSHero Novel
Episode 22: Catapult of the Deserted Isle

When the flotilla of flower boats clearing Seven Bridges Haven reached the threshold of the Siren Strait—the solitary maritime gateway into the continental capital—chilled tension solidified across the water like winter ice. Atop the jagged cliffs flanking the narrowest defile of the strait, three colossal mana-ballista batteries erected by Lucian's imperial navy gleamed with lethal menace, while anchored directly in the mid-channel sat two titanic black-iron ironclads, enforcing an airtight maritime blockade. The siege engines possessed an effective range of a thousand paces, rendering any frontal assault by the frail wooden flower boats an act of suicidal folly.

Gripping the helm, Rondol studied the imperial fortifications through his brass telescope, clicking his tongue in frustration.

"Those ironclads draw too much water for our craft to board them, and their battery arcs overlap completely. Unless those cliffside ballista towers are silenced first, not a single flower barge will slip through alive."

Standing upon the timber prow, Kadan pointed his unadorned iron shield toward a solitary, wind-scoured reef rising outside the channel—Gull Crag.

"That rocky islet lies in the battery blind spot. If we establish a beachhead upon those cliffs, we can construct a counter-siege weapon to break the blockade."

Cilia swept her Jade Staff, reading the coastal squalls with a nod of approval.

"Violent undertows around Gull Crag deter imperial patrol cutters from venturing near. We can establish an encampment there under total concealment."

Ignis clenched his fists, examining the enemy ships with tactical precision.

"Imperial ironclads boast impenetrable belt armor, but their top decking is notoriously vulnerable to plunging kinetic fire. If we strike them from the heights, we can cave in their boiler rooms."

Altering their trim under the cover of sea mist, the companions dropped anchor upon the gravel sandbar of Gull Crag. Though an arid, forbidding rock shelf battered by howling surf, the shoreline was littered with colossal oak timbers, shattered keels, and heaps of massive bull kelp washed ashore from centuries of shipwrecks.

Slamming his massive double-bitted battleaxe into the sand, Grimli the dwarven smith burst into a roaring laugh.

"Bwahaha! The sea gods have delivered the finest siege timber right to our doorsteps! Look at these seasoned oak ribs and dense ironwood spars! Give this old dwarf half a day, and I shall erect a triple-torsion counterweight catapult capable of cracking a citadel wall!"

Drawing his silver dagger to strip the briny bark from the timbers, Kadan joined the work.

"Lead the way, Master Grimli. I will shape the mortises and drive the locking wedges."

Ignis gathered granite stones to construct a makeshift forge, kindling his immaculate white flame to smelt discarded anchor chains into heavy iron axle bearings.

"I will fuse these iron links into balanced rotating spindles. We will give those imperial tin cans an iron greeting they will never forget."

Weaving the thick, fibrous bull kelp into high-tensile torsion cords, Cilia infused the fibers with elasticity through wind mana. Under the unified labor of the three youths and the master dwarven smith, the colossal siege engine rapidly took form upon the cliffs.

By the time the crimson sun dipped toward the waves, a magnificent thirty-foot counterweight catapult stood poised upon the highest precipice of Gull Crag. Massive basalt boulders were quarried as ammunition, upon which Cilia carved frost runes designed to shatter into concussive shards of razor ice upon detonation.

Checking the ratchet gears of the winch, Grimli clapped Kadan's broad shoulder.

"Kadan, lad, your master Aleksandar and I built just such a siege thrower amidst the blizzards of the First Crusade twenty winters ago. That stubborn knight not only wielded a shield like a mountain, but he also had the finest hands for timber and stonework I ever saw. Watching your hammer work today, I know his craft lives proudly in your blood."

Resting against his shield, Kadan gazed across the sunset swells with a serene smile.

"Master Aleksandar taught me that craft is never about senseless destruction, but the manifestation of wisdom to protect the vulnerable. This catapult is not a weapon of slaughter, but the key to open a path of life for our people."

Coating the throwing basket with sanctifying fire, Ignis spoke in quiet reverence.

"The road once walked by father Balian and uncle Aleksandar... is now ours to complete."

Just then, alarm klaxons blared across the strait as two swift imperial scouting pinnaces detected the activity upon the crag, surging forward with archers nocking fire arrows.

Sweeping her Jade Staff, Cilia conjured dense oceanic fog around the heights.

"I will shroud the peak in mist to blind their bowmen! Stand ready!"

As milky-white fog swallowed the rock shelf, Kadan gripped the release lever with steady nerves.

"Target: imperial flagship engine bay, three thousand paces ahead!"

Grimli hammered down the locking dog.

"Loose the stone, lad!"

Boom!

With a concussive crack of bending timber, the catapult arm cleaved through the air, hurling the frost-inscribed basalt monolith into the twilight sky. Like a roaring meteor, the projectile arced over the channel, crashing dead-center through the armored deck of the lead imperial ironclad.

Crr-aaash!

The thick iron plate buckled like parchment as the frost runes detonated in an apocalyptic freezing blast. The arcane steam boilers ruptured in cascading detonations, vomiting black smoke as the flagship tilted violently onto its beam ends.

In rapid succession, the second and third projectiles slammed squarely into the cliffside ballista towers. Hundreds of tons of pulverized granite cascaded into the sea, burying the imperial artillery beneath landslides.

With the ironclads crippled and the gun towers silenced, the passage through the Siren Strait lay wide open.

From the hundreds of flower boats holding position offshore erupted a deafening roar of triumph. Hoisting his sails, Rondol sounded the conch horn to signal the general advance.

Standing beside the timber catapult, Kadan, Ignis, and Cilia watched the refugee flotilla glide safely through the gap, letting out long breaths of relief.

Passing a leather flask of potent dwarven ale to Kadan, Grimli barked a hearty chuckle.

"Magnificently done, children! The first iron gate is shattered! Now let us march to the secret grottos of Mount Dragonhorn and reclaim the ancestral heritage left by our forebears!"

Taking a deep draught, Kadan nodded firmly.

"Forward, companions. The dawn of the continent is at hand."

Leaving Gull Crag in their wake, the companions resumed their resolute voyage toward the foothills of Mount Dragonhorn."""

print("EP22 KO length:", len(EP22_KO), "EN length:", len(EP22_EN))

