# -*- coding: utf-8 -*-
import sys, os, re
sys.path.insert(0, ".")

# ==============================================================================
# EPISODE 17 FULL
# ==============================================================================
ep17_s1 = """동쪽 대해를 가르는 범선 ‘미풍의날개호’의 갑판 위로는 소금기 머금은 거센 해풍이 쉴 새 없이 몰아치고 있었다. 사방을 둘러보아도 끝없이 일렁이는 짙푸른 파도와 수평선뿐이었고, 뱃머리가 거친 파도를 쪼갤 때마다 하얀 물보라가 무지갯빛을 뿜어내며 허공으로 흩어졌다. 출항 이틀째 되던 날 정오, 북쪽 수평선의 먹구름 사이로 거대한 날개짓 소리가 파도 소리를 뚫고 울려 퍼졌다.

키를 잡고 있던 론돌이 외눈 안경을 치켜올리며 하늘을 가리켰다.

“북서쪽 하늘을 보아라! 보통 바다갈매기가 아니다. 왕실의 은빛 깃털을 지닌 바람 그리폰이다!”

론돌의 외침에 카단과 이그니스가 갑판 난간으로 다가갔다. 은빛과 감청색 깃털이 조화를 이룬 거대한 그리폰 한 마리가 선회하더니, 돛대 꼭대기의 망루 활대에 사뿐히 내려앉았다. 그리폰의 오른쪽 발목에는 은빛 원통형 전서구 통이 매달려 있었고, 그 마개에는 바람 속삭임 섬 왕실의 수석 학사이자 실리아의 오랜 스승인 티타니아의 매화 문장이 선명하게 찍혀 있었다.

실리아가 휘파람으로 바람의 신호를 보내자, 그리폰은 온순하게 활강해 실리아의 팔뚝 위에 앉았다.

실리아가 은빛 원통을 열고 양피지 서신을 꺼내 들며 나지막이 읊조렸다.

“티타니아 스승님의 긴급 전서예요. 섬에 심상치 않은 변고가 일어났어요.”"""

ep17_s2 = """실리아가 펼쳐 든 양피지 위에는 다급하게 휘갈겨 쓴 잉크 자국이 번져 있었다. 서신의 내용은 일행의 가슴을 서늘하게 얼어붙게 만들기에 충분했다.

바람 속삭임 섬의 최고 권력자인 제피르 대장로가 국왕 에올루스를 반쯤 유폐하고 섬 전역에 계엄령을 선포했다는 것이었다. 제피르는 황실의 루시안 재상과 내통하여 ‘나인섀도우 코덱스’의 금지된 마나 제어기를 섬의 심장부인 비취 결계탑에 연결하려 하고 있었다.

실리아가 파리해진 얼굴로 편지를 읽어 내려갔다.

“스승님께서 말씀하시길, 제피르 장로가 이미 섬의 남쪽과 동쪽 항구를 봉쇄하고 황실의 암흑 함대를 섬 안으로 끌어들였다고 해요. 에올루스 아버지는 어머니 실피드의 죽음에 얽힌 환영 마법에 취해 제피르의 꼭두각시가 되어버렸다고...”

이그니스가 주먹을 쥐며 갑판 난간을 내리쳤다.

“결국 루시안의 더러운 손길이 대해의 성역까지 뻗친 것이군. 황궁의 군대를 사병처럼 부려 타국의 왕좌까지 찬탈하려 들다니!”

카단이 실리아의 어깨를 토닥이며 침착하게 물었다.

“티타니아 학사님이 제시한 진입로가 있는가? 정규 항구로 접근했다간 해안 마나포의 표적이 될 것이다.”"""

ep17_s3 = """실리아는 양피지 뒷면에 그려진 비밀 해도를 펼쳐 조타실 탁자 위에 올려놓았다.

“섬의 서쪽 절벽 아래, 조류가 험난해 배들이 접근하지 못하는 ‘칼날 산호초 해협’이 있어요. 그곳의 해저 동굴을 통하면 결계탑 외곽의 검은 성전 지하로 은밀히 잠입할 수 있어요.”

론돌이 해도 위의 암초 지대를 들여다보며 혀를 찼다.

“칼날 산호초 해협이라니! 수면 아래 날카로운 암초들이 톱니처럼 도사리고 있어 조류를 반 발짝만 잘못 타도 배 밑창이 박살 나는 죽음의 수로다. 바람의 결을 읽는 일류 항해사라도 밤에는 감히 엄두를 못 내는 곳이야.”

카단이 은빛 단검의 칼자루를 매만지며 단호하게 말했다.

“정면 돌파보다는 암초가 낫습니다. 알렉산다르 스승님께서는 위험한 길일수록 적의 방심이 숨어 있다고 하셨습니다. 밤이 되면 바다의 기류가 잠잠해질 테니, 실리아의 바람과 론돌 숙부님의 키솜씨라면 해협을 통과할 수 있습니다.”

론돌이 거친 수염을 쓰다듬으며 껄껄 웃었다.

“하하! 북방의 늑대 녀석이 늙은 바다표범의 심장에 불을 지르는구나. 좋다! 이 론돌의 외다리가 아직 녹슬지 않았음을 증명해 보이마!”"""

ep17_s4 = """해 질 무렵, 붉은 노을이 바다를 검붉게 물들일 때 돌발적인 위기가 닥쳤다. 해무(海霧) 속에서 검은 깃발을 단 황실 해군의 기습 쾌속 갤리선 세 척이 미풍의날개호의 좌우를 포위하며 쇄도해 온 것이었다. 갤리선의 쇠뇌 발사대에서 유황 불화살과 마나 닻들이 비 오듯 쏟아져 내렸다.

카단이 지체 없이 무쇠 방패를 들어 올려 날아드는 불화살들을 쳐내며 선원들을 보호했다. 쾅 하는 굉음과 함께 방패 표면에서 화염이 튀었지만, 카단의 견고한 하체는 조금도 흔들리지 않았다.

“적선이 접근한다! 선상 난전을 준비하라!”

이그니스가 쇠파이프를 비껴 쥐며 갑판 위로 도약했다. 순백의 성화가 허공을 가르며 적선의 마나 닻줄을 단숨에 녹여 끊었다. 적병들이 갈고리를 던지며 갑판으로 기어오르려 하자, 실리아가 녹옥 지팡이를 휘둘러 거대한 역풍의 파도를 일으켰다. 돌풍에 휘말린 적선 한 척이 중심을 잃고 암초에 부딪쳐 좌초되었다.

이그니스가 카단과 등을 맞대며 외쳤다.

“카단! 저놈들의 기함에 마나 증기 기관이 달려 있다! 기관실을 파괴해야 추격을 떨쳐낼 수 있다!”

카단이 고개를 끄덕이며 방패를 내세워 돌진로를 열었다.

“내 방패를 딛고 뛰어라, 이그니스!”"""

ep17_s5 = """이그니스는 카단의 방패를 딛고 허공으로 솟구쳐 올랐다. 공중에서 회전하며 내리꽂힌 순백 화염의 일격이 적 기함의 마나 기관실을 정통으로 꿰뚫었다. 콰아앙 하는 굉음과 함께 기관실이 폭발하며 적선의 동력이 완전히 마비되었다.

혼란에 빠진 적 함대를 뒤로하고, 론돌은 미풍의날개호의 키를 꺾어 칼날 산호초 해협의 좁은 입구로 능숙하게 밀어 넣었다. 실리아의 청아한 바람 마나가 돛을 밀어주었고, 배는 날카로운 바위 암초 사이를 미끄러지듯 빠져나갔다.

어둠이 완전히 내려앉았을 때, 일행의 눈앞에 에메랄드빛 마나 안개에 휩싸인 전설의 바람 속삭임 섬이 거대한 자태를 드러냈다. 섬 중앙의 거대한 절벽 위로 우뚝 솟은 비취 결계탑에서 은은한 옥빛 파문이 밤하늘을 수놓고 있었다.

실리아가 눈시울을 붉히며 고향의 섬을 바라보았다.

“돌아왔어요... 어머니가 잠들어 계신 나의 고향으로.”

카단이 방패를 거두며 굳건한 목소리로 말했다.

“이제 어둠을 걷어내고 바람의 왕국에 진정한 평화를 되찾을 시간이다.”

세 젊은이와 노장은 결연한 각오를 다지며, 어둠 속 검은 성전의 해저 동굴을 향해 조용히 닻을 내렸다."""

ep17_ko = f"# 눈히어로 17화 - 바람섬의 초대장\n\n> 원문 범위: 제33장-제34장\n\n{ep17_s1}\n\n{ep17_s2}\n\n{ep17_s3}\n\n{ep17_s4}\n\n{ep17_s5}"

ep17_en = """SNSHero Novel
Episode 17: Invitation to the Wind Isle

Across the deck of the flagship 'Breeze Wing' slicing through the eastern ocean, salty gales whipped in relentless squalls. In every direction stretched the rolling azure swells of the boundless main, and each time the vessel's timber prow cleaved through a crest, showers of crystalline foam scattered into the air like shimmering rainbows. At high noon on the second day of their voyage, the rhythmic thunder of immense wings pierced the roar of the surf from beneath the heavy storm clouds to the north.

Gripping the ship's helm, Rondol adjusted his brass monocular, pointing toward the northern squall line.

"Look to the northwestern heavens! That is no common albatross. It is an imperial wind gryphon bearing the silver plumage of the royal aviary!"

At Rondol's shout, Kadan and Ignis hurried to the weather railing. A magnificent beast adorned in silver and deep indigo feathers circled the rigging before alighting with majestic grace upon the topgallant yardarm. Fastened to the gryphon's right talon was a cylindrical silver courier tube, its wax seal bearing the distinct plum-blossom cipher of Master Titania, high royal scholar of Whispering Wind Island and Cilia's revered mentor.

Whistling a melodious wind greeting, Cilia coaxed the gentle beast to glide down and perch upon her forearm.

Extracting the parchment scroll from the silver canister, Cilia murmured with growing apprehension.

"An urgent dispatch from Master Titania. Grave calamity has struck the island."

Across the unfurled scroll, ink strokes had been brushed in hurried, frantic haste, conveying news that chilled the companions to their marrow.

High Elder Zephyr, supreme archon of the Wind Isle Council, had placed King Aeolus under de facto house arrest and proclaimed martial law across the entire archipelago. Colluding with Minister Lucian of the imperial court, Zephyr had integrated the forbidden mana siphon of the Nine Shadows Codex into the island's vital core, the Jade Barrier Spire.

Cilia's face paled as her voice trembled.

"Master Titania writes that Elder Zephyr has already locked down the southern and eastern commercial havens, inviting the imperial navy's shadow galleys into our territorial waters. My father Aeolus, ensnared by phantom illusions regarding my mother Sylphid's death, has become Zephyr's helpless puppet..."

Ignis slammed his armored fist against the oak railing in mounting fury.

"Lucian's venomous claws have reached even the sacred havens of the eastern sea! Wielding the empire's legions like private mercenaries to usurp the sovereign throne of an allied realm!"

Placing a steadying hand upon Cilia's shoulder, Kadan asked in calm tactical focus.

"Did Master Titania provide an alternate approach? Sailing into the fortified harbors will only draw concentrated fire from the coastal mana batteries."

Spreading a secret naval chart across the plotting table, Cilia traced an intricate nautical route.

"Beneath the western sea cliffs lies Razor Reef Defile, where violent subterranean currents normally prevent ships from navigating. A flooded subterranean grotto there leads directly into the catacombs beneath the Black Temple at the base of the barrier spire."

Rondol whistled through his teeth as he examined the jagged shoals marked upon the chart.

"Razor Reef Defile! The seabed is bristling with serrated granite ridges like dragon's teeth. Misjudge the current by half a fathom and the keel will be ripped out. Even seasoned elven pilots would never dare attempt that passage under the cover of night."

Adjusting the scarlet ribbon bound to his silver dagger, Kadan spoke with unwavering resolve.

"A treacherous reef is far better than imperial cannon batteries. Master Aleksandar taught me that danger and opportunity share the same threshold. When night falls, the surface chop will settle; with Cilia's wind weaving and Uncle Rondol's master seamanship, we can navigate the defile."

Rondol stroked his briny gray beard, letting out a booming belly laugh.

"Ha! The northern wolf knows how to stoke the embers in an old sea dog's chest! So be it! This pegleg will prove that an old sailor's blood has not turned to bilge water!"

At twilight, as blood-red dusk stained the rolling swells, danger struck without warning. Slicing through the ocean fog, three black-hulled imperial attack galleys surged forward, flanking Breeze Wing from port and starboard. From their mounted ballistae erupted a lethal volley of sulfur-tipped fire quarrels and iron grappling anchors.

Stepping swiftly to the windward deck, Kadan angled his unadorned iron shield, deflecting the hail of flaming missiles to shield the crew. Sparks cascaded like fireworks against the iron rim, yet Kadan's grounded stance absorbed the kinetic momentum without yielding an inch.

"Hostile cutters boarding! Prepare for melee on deck!"

Seizing his iron stanchion, Ignis leaped onto the bulwarks. A sweeping ribbon of immaculate white flame cleaved through the air, melting through the approaching grappling hawsers in a blinding flash. As imperial shock troops hurled boarding irons to breach the deck, Cilia swept her Jade Staff, conjuring a crushing gale-force vortex across the waves. Caught in the sudden swell, one enemy galley lost its trim and slammed violently against an outcrop of razor shale, its timber hull buckling in half.

Planting his boots back-to-back with Kadan, Ignis called out over the roar of the gale.

"Kadan! Their flagship is driven by an arcane mana-steam turbine! We must disable their drive furnace to slip their pursuit!"

Bracing his shield with firm balance, Kadan opened the assault vector.

"Spring from my shield, Ignis!"

Launching himself off the face of Kadan's shield, Ignis vaulted across the churning sea. Cleaving downward in a spinning crescent, his pure white flame pierced straight through the armored grates of the enemy's mana furnace. With a concussive roar, the arcane boiler detonated, crippling the flagship's propulsion in clouds of boiling steam.

Leaving the burning imperial galleys adrift in their wake, Rondol wrenched the helm, expertly slipping the timber bow of Breeze Wing into the narrow, swirling waters of Razor Reef Defile. With Cilia's gentle wind mana filling the canvas, the vessel glided gracefully between the menacing granite fangs like a phantom.

When total darkness enfolded the sea, the legendary Whispering Wind Island rose before them in breathtaking splendor, shrouded in luminous emerald sea mist. High atop the colossal basalt crags at the heart of the island, the majestic Jade Barrier Spire pulsed with ripples of soothing, translucent green light across the starry firmament.

Tears glistening upon her eyelashes, Cilia gazed upon her ancestral shores.

"I have returned... to the sacred haven where my mother sleeps."

Lowering his iron shield, Kadan spoke with solemn depth.

"Now is the hour to banish the encroaching shadow and return true freedom to the realm of the wind."

With resolute hearts, the three young champions and the old mariner cast anchor into the dark waters before the submerged cavern of the Black Temple."""

print("EP17 KO len:", len(ep17_ko), "EN len:", len(ep17_en))

# Write temporary progress check
with open("scripts/novel_data/test_ep17.txt", "w", encoding="utf-8") as f:
    f.write(ep17_ko)
