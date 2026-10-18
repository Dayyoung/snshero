# -*- coding: utf-8 -*-
import sys, os, re
sys.path.insert(0, ".")

# ==============================================================================
# EPISODE 17: 바람섬의 초대장
# ==============================================================================
ep17_s1 = """동쪽 대해를 가르는 범선 ‘미풍의날개호’의 갑판 위로는 소금기 머금은 거센 해풍이 쉴 새 없이 몰아치고 있었다. 사방을 둘러보아도 끝없이 일렁이는 짙푸른 파도와 아득한 수평선뿐이었고, 뱃머리가 거친 파도를 쪼갤 때마다 하얀 포말이 무지갯빛을 뿜어내며 허공으로 흩어졌다. 돛대에 묶인 굵은 마닐라삼 밧줄들이 삐걱거리는 비명을 질렀고, 젖은 목재 갑판에서는 특유의 갯내음과 타르 향이 뒤섞여 피어올랐다. 출항 이틀째 되던 날 정오, 북쪽 수평선의 먹구름 사이로 거대한 날개짓 소리가 파도 소리를 뚫고 울려 퍼졌다.

키를 잡고 있던 론돌이 외눈 안경을 치켜올리며 하늘을 가리켰다.

“북서쪽 하늘을 보아라! 보통 바다갈매기가 아니다. 왕실의 은빛 깃털을 지닌 바람 그리폰이다!”

론돌의 외침에 카단과 이그니스가 갑판 난간으로 다가갔다. 은빛과 감청색 깃털이 조화를 이룬 거대한 그리폰 한 마리가 선회하더니, 돛대 꼭대기의 망루 활대에 사뿐히 내려앉았다. 그리폰의 오른쪽 발목에는 은빛 원통형 전서구 통이 매달려 있었고, 그 마개에는 바람 속삭임 섬 왕실의 수석 학사이자 실리아의 오랜 스승인 티타니아의 매화 문장이 선명하게 찍혀 있었다.

실리아가 휘파람으로 청아한 바람의 신호를 보내자, 그리폰은 온순하게 활강해 실리아의 가죽 토시 위에 내려앉았다.

실리아가 은빛 원통을 열고 양피지 서신을 꺼내 들며 나지막이 읊조렸다.

“티타니아 스승님의 긴급 전서예요. 섬에 심상치 않은 변고가 일어났어요.”

카단이 방패를 고쳐 쥐며 그리폰의 깃털을 부드럽게 쓰다듬었다.

“수천 리 바다를 건너온 전령이다. 스승님의 충정이 깃들어 있군.”"""

ep17_s2 = """실리아가 펼쳐 든 양피지 위에는 다급하게 휘갈겨 쓴 잉크 자국이 번져 있었다. 서신의 내용은 일행의 가슴을 서늘하게 얼어붙게 만들기에 충분했다.

바람 속삭임 섬의 최고 권력자인 제피르 대장로가 국왕 에올루스를 반쯤 유폐하고 섬 전역에 계엄령을 선포했다는 것이었다. 제피르는 황실의 루시안 재상과 내통하여 ‘나인섀도우 코덱스’의 금지된 마나 제어기를 섬의 심장부인 비취 결계탑에 연결하려 하고 있었다. 섬을 수호해 온 바람의 장막을 황실의 침공 통로로 열어주려는 반역이었다.

실리아가 파리해진 얼굴로 편지를 읽어 내려갔다.

“스승님께서 말씀하시길, 제피르 장로가 이미 섬의 남쪽과 동쪽 항구를 봉쇄하고 황실의 암흑 함대를 섬 안으로 끌어들였다고 해요. 에올루스 아버지는 어머니 실피드의 죽음에 얽힌 환영 마법에 취해 제피르의 꼭두각시가 되어버렸다고...”

이그니스가 주먹을 쥐며 갑판 난간을 내리쳤다.

“결국 루시안의 더러운 손길이 대해의 성역까지 뻗친 것이군. 황궁의 군대를 사병처럼 부려 타국의 왕좌까지 찬탈하려 들다니! 내 두 손으로 그자의 오만한 목을 꺾어버리겠다!”

카단이 실리아의 떨리는 어깨를 묵묵히 짚어주며 침착하게 물었다.

“티타니아 학사님이 제시한 다른 진입로가 있는가? 정규 항구로 접근했다간 해안 마나포의 표적이 될 것이다.”

실리아가 편지 뒷면을 넘기며 고개를 끄덕였다.

“스승님께서 과거 어머니와 론돌 숙부님만이 알고 계시던 비밀 항로를 적어 보내셨어요.”"""

ep17_s3 = """실리아는 양피지 뒷면에 그려진 비밀 해도를 펼쳐 조타실 탁자 위에 올려놓았다. 낡은 나침반과 마나 계측기가 파도의 흔들림에 맞춰 잘각거렸다.

“섬의 서쪽 절벽 아래, 조류가 험난해 배들이 접근하지 못하는 ‘칼날 산호초 해협’이 있어요. 그곳의 해저 동굴을 통하면 결계탑 외곽의 검은 성전 지하로 은밀히 잠입할 수 있어요.”

론돌이 해도 위의 암초 지대를 들여다보며 혀를 찼다.

“칼날 산호초 해협이라니! 수면 아래 날카로운 암초들이 톱니처럼 도사리고 있어 조류를 반 발짝만 잘못 타도 배 밑창이 박살 나는 죽음의 수로다. 바람의 결을 읽는 일류 항해사라도 밤에는 감히 엄두를 못 내는 곳이야. 이 론돌도 십 년 전 저곳에서 배를 잃고 다리 하나를 바다에 바쳤지.”

카단이 은빛 단검의 칼자루를 매만지며 단호하게 말했다.

“정면 돌파보다는 암초가 낫습니다. 알렉산다르 스승님께서는 위험한 길일수록 적의 방심이 숨어 있다고 하셨습니다. 밤이 되면 바다의 기류가 잠잠해질 테니, 실리아의 바람과 론돌 숙부님의 키솜씨라면 해협을 통과할 수 있습니다.”

론돌이 거친 턱수염을 쓰다듬으며 호탕하게 껄껄 웃었다.

“하하! 북방의 늑대 녀석이 늙은 바다표범의 심장에 다시 불을 지르는구나. 좋다! 이 론돌의 외다리가 아직 녹슬지 않았음을 증명해 보이마!”

이그니스 역시 입술을 다물며 결의를 다졌다.

“황궁 함선의 포격각은 내가 잘 안다. 놈들의 사각을 찌르는 침투라면 내 화염이 길을 비출 것이다.”"""

ep17_s4 = """해 질 무렵, 붉은 노을이 바다를 검붉게 물들일 때 돌발적인 위기가 닥쳤다. 짙은 해무(海霧) 속에서 검은 깃발을 단 황실 해군의 기습 쾌속 갤리선 세 척이 미풍의날개호의 좌우를 포위하며 쇄도해 온 것이었다. 갤리선의 쇠뇌 발사대에서 흑철 쇠뇌살과 유황 불화살들이 비 오듯 쏟아져 내렸다.

카단이 지체 없이 무쇠 방패를 들어 올려 날아드는 불화살들을 쳐내며 선원들을 보호했다. 쾅 하는 굉음과 함께 방패 표면에서 화염이 튀었지만, 카단의 견고한 하체는 조금도 흔들리지 않았다. 방패 곡면을 타고 빗나간 화살들이 바닷물 속으로 치익 소리를 내며 꺼져 들어갔다.

“적선이 접근한다! 선상 난전을 준비하라!”

이그니스가 쇠파이프를 비껴 쥐며 갑판 난간 위로 도약했다. 순백의 성화가 허공을 가르며 적선의 마나 닻줄을 단숨에 녹여 끊었다. 적병들이 갈고리를 던지며 갑판으로 기어오르려 하자, 실리아가 녹옥 지팡이를 휘둘러 거대한 역풍의 파도를 일으켰다. 돌풍에 휘말린 적선 한 척이 중심을 잃고 암초에 부딪쳐 좌초되었다.

이그니스가 카단과 등을 맞대며 외쳤다.

“카단! 저놈들의 기함에 마나 증기 기관이 달려 있다! 기관실을 파괴해야 추격을 떨쳐낼 수 있다!”

카단이 고개를 끄덕이며 방패를 내세워 돌진로를 열었다.

“내 방패를 딛고 뛰어라, 이그니스!”

이그니스는 카단의 방패를 딛고 허공으로 솟구쳐 올랐다. 공중에서 회전하며 내리꽂힌 순백 화염의 일격이 적 기함의 마나 기관실을 정통으로 꿰뚫었다. 콰아앙 하는 굉음과 함께 기관실이 폭발하며 적선의 동력이 완전히 마비되었다."""

ep17_s5 = """혼란에 빠진 적 함대를 뒤로하고, 론돌은 미풍의날개호의 키를 꺾어 칼날 산호초 해협의 좁은 입구로 능숙하게 밀어 넣었다. 실리아의 청아한 바람 마나가 돛을 밀어주었고, 배는 날카로운 바위 암초 사이를 미끄러지듯 빠져나갔다. 성난 파도가 뱃전을 사정없이 때렸지만, 론돌의 노련한 조타술과 카단의 균형 잡힌 마나 지지가 배의 침몰을 막아냈다.

어둠이 완전히 내려앉았을 때, 일행의 눈앞에 에메랄드빛 마나 안개에 휩싸인 전설의 바람 속삭임 섬이 거대한 자태를 드러냈다. 섬 중앙의 거대한 절벽 위로 우뚝 솟은 비취 결계탑에서 은은한 옥빛 파문이 밤하늘을 수놓고 있었다. 천 길 절벽 아래 입을 벌린 고대 석회암 동굴 속으로 배가 조용히 미끄러져 들어갔다.

실리아가 눈시울을 붉히며 고향의 섬을 바라보았다.

“돌아왔어요... 어머니가 잠들어 계신 나의 고향으로. 비취 결계탑의 불빛이 아직 완전히 꺼지지 않았어요.”

카단이 방패를 거두며 굳건한 목소리로 말했다.

“이제 어둠을 걷어내고 바람의 왕국에 진정한 평화를 되찾을 시간이다. 어머니 실피드의 넋도 우리를 지켜보고 계실 것이다.”

이그니스 역시 가슴에 손을 얹으며 맹세했다.

“황실이 저지른 죗값을 내가 앞장서서 갚겠다.”

세 젊은이와 노장은 결연한 각오를 다지며, 어둠 속 검은 성전의 해저 동굴을 향해 조용히 닻을 내렸다. 차가운 동굴 천장에서 떨어지는 물방울 소리가 그들의 비장한 침묵을 어루만지고 있었다."""

EP17_KO = f"# 눈히어로 17화 - 바람섬의 초대장\n\n> 원문 범위: 제33장-제34장\n\n{ep17_s1}\n\n{ep17_s2}\n\n{ep17_s3}\n\n{ep17_s4}\n\n{ep17_s5}"

# Ep 17 English Translation
EP17_EN = """SNSHero Novel
Episode 17: Invitation to the Wind Isle

Across the deck of the flagship 'Breeze Wing' slicing through the eastern ocean, salty gales whipped in relentless squalls. In every direction stretched the rolling azure swells of the boundless main and the distant horizon, and each time the vessel's timber prow cleaved through a crest, showers of crystalline foam scattered into the air like shimmering rainbows. Thick manila rigging groaned in protest against the mastheads, and from the wet oak decking rose the sharp, briny mingling of sea salt and pine tar. At high noon on the second day of their voyage, the rhythmic thunder of immense wings pierced the roar of the surf from beneath the heavy storm clouds to the north.

Gripping the ship's helm, Rondol adjusted his brass monocular, pointing toward the northern squall line.

"Look to the northwestern heavens! That is no common albatross. It is an imperial wind gryphon bearing the silver plumage of the royal aviary!"

At Rondol's shout, Kadan and Ignis hurried to the weather railing. A magnificent beast adorned in silver and deep indigo feathers circled the rigging before alighting with majestic grace upon the topgallant yardarm. Fastened to the gryphon's right talon was a cylindrical silver courier tube, its wax seal bearing the distinct plum-blossom cipher of Master Titania, high royal scholar of Whispering Wind Island and Cilia's revered mentor.

Whistling a melodious wind greeting, Cilia coaxed the gentle beast to glide down and perch upon her leather arm-guard.

Extracting the parchment scroll from the silver canister, Cilia murmured with growing apprehension.

"An urgent dispatch from Master Titania. Grave calamity has struck the island."

Kadan rested his iron shield, gently stroking the beast's downy feathers.

"A messenger that flew thousands of leagues across open water. It carries your mentor's utmost devotion."

Across the unfurled scroll, ink strokes had been brushed in hurried, frantic haste, conveying news that chilled the companions to their marrow.

High Elder Zephyr, supreme archon of the Wind Isle Council, had placed King Aeolus under de facto house arrest and proclaimed martial law across the entire archipelago. Colluding with Minister Lucian of the imperial court, Zephyr had integrated the forbidden mana siphon of the Nine Shadows Codex into the island's vital core, the Jade Barrier Spire. It was an act of treason designed to open the kingdom's sacred elemental mantle as an invasion corridor for the imperial armada.

Cilia's face paled as her voice trembled.

"Master Titania writes that Elder Zephyr has already locked down the southern and eastern commercial havens, inviting the imperial navy's shadow galleys into our territorial waters. My father Aeolus, ensnared by phantom illusions regarding my mother Sylphid's death, has become Zephyr's helpless puppet..."

Ignis slammed his armored fist against the oak railing in mounting fury.

"Lucian's venomous claws have reached even the sacred havens of the eastern sea! Wielding the empire's legions like private mercenaries to usurp the sovereign throne of an allied realm! I swear to snap that tyrant's neck with my bare hands!"

Placing a steadying hand upon Cilia's shuddering shoulder, Kadan asked in calm tactical focus.

"Did Master Titania provide an alternate approach? Sailing into the fortified harbors will only draw concentrated fire from the coastal mana batteries."

Turning the scroll over, Cilia nodded with renewed hope.

"Master Titania has drawn the secret maritime passage known only to my mother and Uncle Rondol."

Spreading the secret naval chart across the plotting table, Cilia traced an intricate nautical route. The weathered brass compass and arcane mana gauges clicked in rhythm with the rolling deck.

"Beneath the western sea cliffs lies Razor Reef Defile, where violent subterranean currents normally prevent ships from navigating. A flooded subterranean grotto there leads directly into the catacombs beneath the Black Temple at the base of the barrier spire."

Rondol whistled through his teeth as he examined the jagged shoals marked upon the chart.

"Razor Reef Defile! The seabed is bristling with serrated granite ridges like dragon's teeth. Misjudge the current by half a fathom and the keel will be ripped out. Even seasoned elven pilots would never dare attempt that passage under the cover of night. An old sea dog like me lost his ship and left his leg behind in those very waters a decade ago."

Adjusting the scarlet ribbon bound to his silver dagger, Kadan spoke with unwavering resolve.

"A treacherous reef is far better than imperial cannon batteries. Master Aleksandar taught me that danger and opportunity share the same threshold. When night falls, the surface chop will settle; with Cilia's wind weaving and Uncle Rondol's master seamanship, we can navigate the defile."

Rondol stroked his briny gray beard, letting out a booming belly laugh.

"Ha! The northern wolf knows how to stoke the embers in an old sea dog's chest! So be it! This pegleg will prove that an old sailor's blood has not turned to bilge water!"

Ignis tightened his jaw with fierce determination.

"I know the firing angles of imperial siege vessels by heart. If we penetrate their blind spots, my flames will light our path."

At twilight, as blood-red dusk stained the rolling swells, danger struck without warning. Slicing through the ocean fog, three black-hulled imperial attack galleys surged forward, flanking Breeze Wing from port and starboard. From their mounted ballistae erupted a lethal volley of sulfur-tipped fire quarrels and iron grappling anchors.

Stepping swiftly to the windward deck, Kadan angled his unadorned iron shield, deflecting the hail of flaming missiles to shield the crew. Sparks cascaded like fireworks against the iron rim, yet Kadan's grounded stance absorbed the kinetic momentum without yielding an inch. Hissing fiercely, deflected quarrels plunged into the brine.

"Hostile cutters boarding! Prepare for melee on deck!"

Seizing his iron stanchion, Ignis leaped onto the bulwarks. A sweeping ribbon of immaculate white flame cleaved through the air, melting through the approaching grappling hawsers in a blinding flash. As imperial shock troops hurled boarding irons to breach the deck, Cilia swept her Jade Staff, conjuring a crushing gale-force vortex across the waves. Caught in the sudden swell, one enemy galley lost its trim and slammed violently against an outcrop of razor shale, its timber hull buckling in half.

Planting his boots back-to-back with Kadan, Ignis called out over the roar of the gale.

"Kadan! Their flagship is driven by an arcane mana-steam turbine! We must disable their drive furnace to slip their pursuit!"

Bracing his shield with firm balance, Kadan opened the assault vector.

"Spring from my shield, Ignis!"

Launching himself off the face of Kadan's shield, Ignis vaulted across the churning sea. Cleaving downward in a spinning crescent, his pure white flame pierced straight through the armored grates of the enemy's mana furnace. With a concussive roar, the arcane boiler detonated, crippling the flagship's propulsion in clouds of boiling steam.

Leaving the burning imperial galleys adrift in their wake, Rondol wrenched the helm, expertly slipping the timber bow of Breeze Wing into the narrow, swirling waters of Razor Reef Defile. With Cilia's gentle wind mana filling the canvas, the vessel glided gracefully between the menacing granite fangs like a phantom. Though violent swells slammed against the hull, Rondol's seasoned helmsmanship and Kadan's grounded mana stabilization kept the ship upright.

When total darkness enfolded the sea, the legendary Whispering Wind Island rose before them in breathtaking splendor, shrouded in luminous emerald sea mist. High atop the colossal basalt crags at the heart of the island, the majestic Jade Barrier Spire pulsed with ripples of soothing, translucent green light across the starry firmament. The ship glided silently into the gaping mouth of an ancient limestone sea cavern beneath the cliffs.

Tears glistening upon her eyelashes, Cilia gazed upon her ancestral shores.

"I have returned... to the sacred haven where my mother sleeps. The light of the barrier spire has not yet been extinguished."

Lowering his iron shield, Kadan spoke with solemn depth.

"Now is the hour to banish the encroaching shadow and return true freedom to the realm of the wind. Queen Sylphid's spirit watches over our blades."

Ignis touched his breastplate with solemn devotion.

"I shall be the first to pay the debt my empire incurred."

With resolute hearts, the three young champions and the old mariner cast anchor into the dark waters before the submerged cavern of the Black Temple. Rhythmic drops falling from the cavern ceiling echoed their solemn silence."""

print("EP17 KO length:", len(EP17_KO), "EN length:", len(EP17_EN))

# ==============================================================================
# EPISODE 18: 검은 성전의 비밀
# ==============================================================================
ep18_s1 = """칼날 산호초 해협의 해저 동굴을 빠져나온 일행은 바람 속삭임 섬 지하 깊은 곳에 자리 잡은 ‘검은 성전’의 폐허에 발을 디뎠다. 수천 년 동안 세상과 격리되어 있던 지하 성전은 거대한 흑요석 기둥들이 끝없이 늘어서 있는 고대 도서관의 형태를 띠고 있었다. 그러나 종이로 된 책이나 양피지 두루마리는 어디에도 보이지 않았다. 높이 수십 길에 달하는 매끄러운 흑요석 벽면 전체가 푸른 인광을 내뿜는 거대한 기억 저장 수정체였던 것이다. 천장에 매달린 종유석 틈새로는 차가운 물방울이 떨어지며 고요한 수면에 규칙적인 파문을 일으키고 있었다.

실리아가 흑요석 벽면을 손끝으로 쓰다듬으며 경외 어린 목소리로 속삭였다.

“이곳은 바람의 정령왕 에올루스의 선조들이 대륙의 모든 진실을 기록해 둔 태초의 아카이브예요. 대지의 모든 숨결과 거짓 없는 기억이 이 흑요석 수정 속에 고스란히 봉인되어 있어요.”

카단이 무쇠 방패를 비껴 쥐며 성전 중앙의 제단을 바라보았다.

“종이로 된 역사는 권력자의 붓끝에 의해 왜곡되지만, 대지의 돌은 결코 거짓을 말하지 않는 법이다. 스승님께서도 이곳에 진실이 잠들어 있다고 말씀하셨지.”

이그니스는 흑요석 벽면에 비친 자신의 초라한 그림자를 응시하며 마른침을 삼켰다.

“십팔 년 전의 그날... 내 아버지가 역적으로 몰리고 알렉산다르 숙부가 전사했던 그 피비린내 나는 밤의 진실도 여기에 기록되어 있단 말인가?”"""

ep18_s2 = """성전 중앙에 다다른 실리아는 제단 위에 놓인 비취색 수정구 앞에 섰다. 수정구 표면에는 고대 룬 문자로 ‘진실을 바라는 자, 가장 순수한 눈물을 바쳐라’라는 문구가 음각되어 있었다.

실리아는 허리춤에서 어머니 실피드의 유품이었던 녹옥 지팡이를 들어 제단 홈에 조심스럽게 맞추어 꽂았다. 그리고 눈을 감고, 어머니를 향한 오랜 그리움과 슬픔이 담긴 한 방울의 눈물을 수정구 위에 떨어뜨렸다.

순간, 흑요석 성전 전체가 눈이 멀 것 같은 푸른빛으로 진동하기 시작했다. 벽면을 채우고 있던 수만 개의 흑요석 수정들이 공명하며, 허공에 십팔 년 전의 참극이 거대한 환영 영상으로 생생하게 투사되었다.

그것은 황실의 역사서에 기록된 것과는 완전히 다른 충격적인 진실이었다.

황궁의 루시안 재상과 결탁한 바람섬의 제피르 대장로가, 당시 평화 협정을 위해 섬을 찾았던 실피드 여왕의 찻잔에 메두사 고르고의 맹독을 은밀히 타는 장면이 허공에 펼쳐졌다. 실피드 여왕이 피를 토하며 쓰러지자, 제피르는 성전 밖에 대기하고 있던 성기사단에게 죄를 뒤집어씌우기 위해 비명을 질렀던 것이다."""

ep18_s3 = """환영 속에서 알렉산다르와 발리안 두 성기사는 불타는 성전 안으로 뛰어들었다. 알렉산다르는 자신의 은빛 단검과 방패로 여왕을 독살하려던 제피르의 암살자들을 베어 넘기며 여왕의 시신을 지키려 필사적으로 저항하고 있었다. 발리안 역시 온몸에 화살을 맞아가며 어린 실리아와 피난민들을 탈출시키기 위해 퇴로를 열고 있었다.

그러나 황실의 비밀 감찰대와 제피르의 부하들은 오히려 두 성기사를 여왕 살해범으로 몰아붙이며 대륙 전역에 수배령을 내렸다.

그 처절한 진실을 목격한 이그니스는 무릎을 꿇고 바닥을 주먹으로 내리쳤다. 그의 눈에서 피눈물이 흘러내렸다.

“아버지... 발리안 아버지... 아버지께서는 배신자가 아니라, 마지막 순간까지 여왕을 지키려 했던 가장 고결한 기사였어... 그런데 나는... 나는 그 추악한 살인마들의 손을 잡고 아버지를 증오하며 살아왔단 말인가!”

카단이 이그니스의 어깨를 감싸 안으며 단단한 목소리로 위로했다.

“너의 탓이 아니다, 이그니스. 어둠에 눈이 멀었던 세상이 우리에게 강요한 비극이었을 뿐이다. 이제 우리가 그 원통한 진실을 온 세상에 밝혀내야 한다.”

실리아 역시 눈물을 닦으며 제단에서 녹옥 지팡이를 뽑아 들었다.

“어머니의 죽음이 성기사단의 탓이 아니었음을, 제피르와 루시안의 추악한 반역이었음을 제 목숨을 걸고 증명하겠어요.”"""

ep18_s4 = """그때, 성전 천장의 거대한 흑요석 틈새에서 쇳소리와 함께 불길한 마나의 파동이 솟구쳐 올랐다. 제피르 대장로가 보낸 암흑 골렘들과 그림자 추적자 서른 명이 성전 안으로 쏟아져 들어온 것이었다. 진실이 밝혀지는 것을 막기 위해 침입자들을 성전 통째로 매장하려는 음모였다.

골렘들의 거대한 바위 주먹이 제단을 향해 내리꽂히자, 카단이 번개처럼 뛰쳐나가 무쇠 방패를 비스듬히 받쳐 들었다.

콰아앙!

산봉우리가 무너져 내리는 듯한 충격이 방패를 강타했지만, 카단은 별의 호흡을 발끝으로 뿜어내며 충격파를 성전 바닥의 수맥으로 흘려보냈다. 성전 바닥이 쩌적 갈라지며 지하수가 솟구쳤지만, 카단의 상체는 바위처럼 요지부동이었다.

“실리아, 이그니스! 증거가 담긴 기억 수정을 지켜라!”

이그니스가 부러진 쇠파이프를 꼬나쥐며 백색 화염을 폭발시켰다. 죄책감을 씻어내듯 맹렬하게 타오른 화염이 그림자 추적자들의 심장을 꿰뚫었다. 실리아는 녹옥 지팡이를 휘둘러 성전에 솟구친 지하수를 거대한 물의 칼날로 바꾸어 골렘들의 관절을 단숨에 절단해 버렸다. 세 젊은이의 분노와 결의가 담긴 협격 앞에 서른 명의 암살 부대는 순식간에 괴멸되었다."""

ep18_s5 = """전투가 끝나고 정적을 되찾은 성전 안에서, 실리아는 제단에서 추출한 푸른 ‘진실의 기억 수정체’를 비단 손수건에 소중히 감쌌다. 십팔 년간 묻혀 있던 어머니의 마지막 숨결과 두 성기사의 명예가 담긴 무구한 증거였다.

카단이 방패의 그을음을 털어내며 성전 위쪽으로 이어지는 나선형 계단을 가리켰다.

“이 계단은 비취 결계탑 아래 ‘하늘 제단’으로 이어진다. 그곳에 에올루스 국왕이 유폐되어 있을 것이다.”

실리아가 결연한 눈빛으로 고개를 끄덕였다.

“아버지에게 이 기억 수정을 보여드려야 해요. 제피르의 환영에 사로잡힌 아버지의 눈을 뜨게 하고, 결계탑의 폭주를 막아야 해요.”

이그니스 역시 불타는 눈빛으로 앞장섰다.

“제피르의 목은 내가 베겠다. 그것만이 내 아버지 발리안과 알렉산다르 숙부님 앞에 속죄할 수 있는 유일한 길이다.”

세 사람은 서로를 향해 굳은 신뢰의 미소를 보내며, 성전의 어둠을 뒤로하고 지상을 향해 힘찬 발걸음을 옮겼다. 계단 끝에서 불어오는 바람은 서늘했지만, 그들의 가슴속에 타오른 정의의 불꽃은 그 어떤 폭풍보다 뜨거웠다."""

EP18_KO = f"# 눈히어로 18화 - 검은 성전의 비밀\n\n> 원문 범위: 제35장-제36장\n\n{ep18_s1}\n\n{ep18_s2}\n\n{ep18_s3}\n\n{ep18_s4}\n\n{ep18_s5}"

EP18_EN = """SNSHero Novel
Episode 18: Secret of the Black Temple

Emerging from the submerged sea cavern beneath Razor Reef Defile, the companions set foot upon the ancient ruins of the Black Temple, buried deep in the subterranean foundations of Whispering Wind Island. Isolated from mortal eyes for millennia, the sunken sanctum resembled an immense obsidian hall flanked by towering basalt columns. Yet nowhere were paper codices or vellum scrolls to be found. The entirety of the colossal obsidian walls, stretching scores of fathoms toward the ceiling, functioned as living memory crystals pulsing with faint azure phosphorescence. From between the stalactites clinging to the vaulted roof, cool droplets fell in rhythmic intervals, tracing concentric ripples across the mirrored surface of the subterranean lake.

Tracing the glossy basalt with trembling fingers, Cilia spoke in a hushed, reverent whisper.

"This is the primordial archive established by the ancestors of Aeolus, Spirit King of the Winds, to preserve the unblemished truths of the continent. Every breath of the earth and every true memory is eternally sealed within this living obsidian matrix."

Resting his unadorned iron shield, Kadan gazed toward the solitary dais at the sanctum's center.

"The histories penned on parchment are easily corrupted by the brushes of tyrants, but the stone of the earth never speaks falsehood. Master Aleksandar always spoke of this place as the wellspring of untainted memory."

Staring at his own shadowed reflection in the dark stone, Ignis swallowed hard.

"Eighteen winters ago... The fateful night when my father was branded a traitor and Master Aleksandar fell in ash... Is the blood-stained truth of that tragedy recorded here as well?"

Reaching the center of the hall, Cilia stood before the jade-veined crystal sphere resting upon the altar. Etched into the polished crystal in archaic glyphs was the inscription: 'Let he who seeks truth offer the purest tear.'

With reverent care, Cilia drew the legendary Jade Staff—her mother Sylphid's heirloom—and seated the ferrule into the altar's socket. Closing her eyes, she let fall a single crystalline tear born of long years of yearning and sorrow upon the sphere.

Instantly, the entire temple shuddered with blinding azure brilliance. Tens of thousands of obsidian crystals resonated in thunderous harmony, projecting a colossal, lifelike phantom memory across the vaulted ceiling.

It revealed a reality utterly antithetical to the imperial histories taught in the capital.

High Elder Zephyr, colluding with Minister Lucian of the imperial court, was seen secretly pouring the lethal venom of Medusa Gorgo into the ceremonial chalice of Queen Sylphid during the peace banquet eighteen winters ago. When Sylphid collapsed coughing blackened blood, Zephyr had shrieked in feigned horror, maliciously framing the Holy Knights stationed outside as regicides.

Within the projected memory, Aleksandar and Balian charged through the flaming colonnades. Drawing his silver dagger and bracing his shield, Aleksandar fought desperately against Zephyr's shadow assassins, striving to defend the queen's dying breath. Balian, riddled with crossbow bolts, anchored the rear guard to clear an escape corridor for the infant Cilia and weeping refugees.

Yet the Imperial Secret Inquisition and Zephyr's faction buried the truth, declaring the two knights traitors and unleashing bounty hunters across the continent.

Witnessing the agonizing truth, Ignis dropped to his knees, slamming his fists into the basalt flags as tears of blood spilled from his eyes.

"Father... Father Balian... You were no traitor; you were the noblest knight who fought to your dying breath to protect the queen... Yet I... I held hands with those vile murderers, poisoning my heart with hatred toward you all these years!"

Kadan knelt beside him, placing a firm, steadying arm across his brother's shoulders.

"The fault does not lie with you, Ignis. It was a tragedy manufactured by a corrupt world blinded by shadows. Now it falls to our steel to illuminate that truth before all living souls."

Wiping her tears, Cilia drew the Jade Staff from the altar with burning resolve.

"I swear upon my life to prove that my mother's demise was not the crime of the Holy Knights, but the vile treason of Zephyr and Lucian."

At that moment, the screech of shearing stone echoed from the ceiling as an ominous pulse of mana erupted from the shadows. Thirty shadow stalkers and abyssal obsidian golems, dispatched by High Elder Zephyr to bury the truth forever, plunged into the hall.

As the titan golems brought their colossal fists down toward the altar, Kadan bounded forward, angling his iron shield to catch the crushing impact.

Boom!

The concussive shockwave felt as though an entire mountain peak had collapsed upon his guard. Yet drawing upon star-breathing, Kadan channeled the kinetic fury through his boots and into the subterranean water conduits. The stone floor fractured as pressurized springs geysered upward, yet Kadan's upper body remained as unyielding as granite.

"Cilia, Ignis! Protect the memory crystal!"

Wielding his iron pipe, Ignis unleashed his immaculate white flame with volcanic ferocity. Burning away his agonizing guilt, his holy fire pierced straight through the hearts of the shadow stalkers. Sweeping her Jade Staff, Cilia transformed the geysering subterranean waters into razor-sharp hydro-blades, cleanly severing the golems' limbs. In the face of the three youths' furious coordination, the ambush was annihilated within moments.

As silence settled once more over the hall, Cilia wrapped the glowing azure Memory Shard in a fine silk mantle. It was the undeniable proof containing her mother's dying breath and the vindication of the two holy knights.

Pointing his shield toward the spiraling stone stairway ascending into the heights, Kadan spoke with determination.

"This stairway ascends directly beneath the Sky Altar of the Barrier Spire. King Aeolus must be held captive there."

Cilia nodded with unyielding resolve.

"We must present this memory crystal to my father. We must shatter the illusions blinding his eyes and stop the barrier spire from collapsing."

Ignis stepped into the lead, his golden eyes blazing with righteous fire.

"I will take Zephyr's head with my own hands. That is the only atonement I can offer to my father Balian and Master Aleksandar."

Exchanging solemn smiles of brotherhood, the three young wanderers left the dark sanctuary behind, climbing boldly toward the light above. The wind rushing down the staircase was freezing, yet the fire of justice burning within their breasts was hotter than any tempest."""

print("EP18 KO length:", len(EP18_KO), "EN length:", len(EP18_EN))
