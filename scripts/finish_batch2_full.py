# -*- coding: utf-8 -*-
import sys, os, re
sys.path.insert(0, ".")

from scripts.make_arc1_batch2_full import ep12_ko, ep12_en, ep13_ko, ep13_en, ep14_ko, ep14_en
from scripts.enrich_batch2_ep15_16 import EP15_KO, ep15_s1_exp, ep15_s2_exp, ep15_s4_exp, ep15_s5_exp
from scripts.make_arc1_batch2_full import ep15_s3

# Ep 15 full English
ep15_en = """SNSHero Novel
Episode 15: Night of the Vipers and the Lion

As midnight deepened, the waves across Mist Lake grew increasingly tumultuous. Violent nocturnal gales sweeping down from the eastern mountain crags battered the cedar shingles of Cloud Return Manor without mercy, while torrents of heavy rain churned the dark waters into foam. Within the manor's great central hearth, logs of seasoned oak crackled and cast fluttering orange flames across the hall, yet the uncanny chill seeping through the drafty corridors defied the fire's warmth. Huddled around the hearthstone, displaced fishermen and war refugees roasted salted lake fish, seeking refuge from the bitter cold. Beside the brazier, Cilia ground lily-of-the-valley extracts and mountain mint leaves in a stone mortar, carefully preparing a restorative tonic for General Leonar's lingering battle wounds.

Stirring the ceramic medicine bowl, Cilia gazed through the rain-streaked window into the tempest.

"Ominous currents are churning beneath the lake surface. The cadence of the waves is distorted, poisoned with deep crimson mana."

Resting his unadorned iron shield against the stone mantle, Kadan nodded solemnly.

"It bears the chilling aura of the imperial secret inquisition we witnessed in the capital. Lucian has surely tracked our scent to this lake."

At that moment, an elderly watchman stationed at the jetty tower hurried into the hall, shaking the driving rain from his oilskin cloak. Clutched tightly against his chest was an unidentified parcel wrapped in sodden burlap.

Panting heavily, the fisherman set the container down atop the heavy trestle table.

"Just moments ago, a black-sailed cutter slipped through the fog, hurled this crate onto the jetty, and vanished into the darkness! General Leonar's honored name is carved distinctly across the lid!"

Resting upon the timber planks was a skull-sized chest carved from translucent black crystal. Atop the lid squatted five masterfully sculpted viper heads coiled in serpentine tension, while from the fine hairline fractures along the seams seeped an ominous violet miasma, pulsing like living capillaries.

Cilia gripped her staff, her voice ringing out in sharp alarm.

"Do not approach it! The runes etched across those crystal facets bear the forbidden necromantic death-curses of Medusa Gorgo! The instant the lid is released, lethal necrotic venom will engulf this room!"

Before her warning could be fully registered, the cunning internal clockwork trigger embedded within the box's base released with a crisp, fatal click. With a violent crystalline detonation, the obsidian chest shattered into shards, and from the billowing purple toxic vapor surged five ethereal phantom vipers with burning crimson eyes. The weightless spirit-serpents lunged with blinding speed toward two young refugee orphans slumbering wrapped in blankets beside the hearthstone.

In that heart-stopping instant, General Leonar launched his massive frame across the floor with the thunderous roar of an enraged lion.

"Vile vermin, dare you bare your fangs against innocent babes!"

It was a split second too brief to evade or brandish his heavy staff. Without a trace of hesitation, Leonar swept his immense arms around the children, shielding their fragile bodies against his breast while presenting his broad back and shoulders to the incoming strike. With a sickening hiss of dissolving flesh, the spectral fangs sank deep into the veteran's nape and collarbone, and a network of blackened, corrosive necrotic venom spread like spiderwebs beneath his graying skin. His massive muscles sizzled as sulfurous fumes filled the air.

Kneeling rigidly with his arms locked around the weeping children, Leonar coughed violently, dark clots of corrupted blood spattering the flagstones.

"Ghk... Little ones, are you harmed...? Speak to me, are you whole...?"

Clinging to the titan's chest in sheer terror, the children cried out in agony.

"Grandfather! Your back... Black blood is pouring from your shoulders!"

Caressing their tear-stained cheeks with his massive, calloused hand, Leonar forced a reassuring grin.

"Lion hide is tougher than dragon scales; the poisoned nibbles of garden snakes cannot bring me down. Fear not, little ones."

Kadan sprang forward with decisive fury, drawing the silver dagger from his belt. Channeling the star rhythm perfected across the frozen northern tundras, a brilliant aura of purifying starlight wrapped around the razor edge like crackling frost.

"Foul spirits shall never desecrate the blood of the righteous!"

With fluid, lightning precision, Kadan cleaved through the air. The sacred anti-fiend sword techniques passed down by Master Aleksandar severed the ethereal spines of the five phantom serpents in consecutive arcs of azure radiance. Wherever the blade passed, the screeching apparitions dissolved into shimmering white ash, snuffed out by the starlight.

Simultaneously, Cilia hoisted her Jade Staff high overhead, invoking the ancient cleansing cantrip of the eastern wind.

"Spirits of the eastern sea, sweep away this defiling shroud and restore the pure breath of life!"

A spiraling vortex of teal wind erupted from beneath Cilia's boots, sweeping the lingering clouds of violet toxic vapor straight up through the open roof vents into the torrential night. Crisp, pristine lake breezes poured into the timber hall, eradicating the last lingering traces of necrotic venom.

Rushing into the hall after hearing the tumult, Ignis froze in horror at the scene of destruction. Amidst the glittering fragments of the shattered crystal chest, a gleam of polished metal caught his eye. It was the golden imperial signet mechanism that had primed the detonation. Stamped into the hardened crimson wax was the personal crest of High Minister Lucian, flanked by the classified cipher runes of the Imperial Secret Inquisition.

Ignis's golden eyes widened in disbelieving agony, his breath catching as blood welled where his teeth bit through his lip.

"The imperial crest... It was Minister Lucian himself who dispatched this cowardly murder weapon? To butcher helpless refugees and an honorable retired general, solely to blame the atrocity upon the Holy Knights... Is this the 'order and justice' to which I pledged my sword and soul!"

In a frenzy of grief and disgust, Ignis violently tore the gilded medal of the White Flame Order from his breastplate, hurling it against the stone floorboards. The gilded emblem clattered across the flags with a hollow, pathetic chime. The grand edifice of imperial righteousness that had anchored his entire existence had collapsed into a cesspool of vile deceit.

Slamming his fist against the timber pillar, Ignis wept in fury.

"For what purpose did I hone my blade all these years! Did my steel defend peace, or merely fatten the corrupt parasites of the imperial court!"

Stepping forward, Kadan placed a firm, steady hand upon Ignis's shuddering shoulder.

"Facing the naked truth is an agonizing wound, Ignis. Yet keeping your eyes open to that darkness is the only way honor can ever be reborn. Uncle Balian prayed every single night that you would one day break free from that hollow shell."

Slumped against a timber stanchion, Leonar wiped dark blood from his lips, his breathing growing shallow and rasping. Though the veil of death was descending swiftly across his features, the old warlord's gaze retained the undaunted majesty of a battlefield titan. With trembling, calloused hands, he lifted his legendary Jade Staff, passing the ancestral weapon into the care of Kadan and Cilia.

"My ember burns down to the wick... But the barrier spires of Whispering Wind Island must never fall. Tell Aeolus... that Leonar never retreated, that he held his ground until his final breath..."

Tears spilled down Cilia's cheeks as her hands closed around the polished jade.

"General, the sacred covenant of the earth bound within this staff shall never be betrayed. We will safeguard the island and illuminate my mother's truth, no matter the cost."

Kadan knelt before the dying lion, clasping the warrior's rough hand in both of his own.

"I swear upon my shield to safeguard the innocent lives and the hearthfire of this manor you defended. May your journey to reunite with Master Aleksandar be filled with eternal peace."

Reaching out with gentle, massive fingers, Leonar patted the heads of the weeping refugee orphans who clung to his knees.

"Weep not, little ones... An old lion is merely closing his eyes for a well-earned slumber..."

The refugees and fishermen gathered in a silent circle around their fallen protector, raising their voices in a sorrowful, ancient mariners' requiem. As the tempest outside gradually waned and the cool blue hues of early dawn settled over Mist Lake, the great warrior breathed his last with a peaceful smile upon his lips. Kneeling before the fallen titan, the three youths forged an unbreakable vow of resolve for the battles that lay ahead. The golden dawn rising over the tranquil waters crowned the old general's departure with transcendent majesty."""

# Ep 16 full Korean (expanded to ~3,850 chars)
from scripts.enrich_batch2_ep15_16 import ep16_s1_exp, ep16_s2_exp, ep16_s3_exp

ep16_s4_exp = """그 감동의 순간, 장원 외곽의 수상 회랑 쪽에서 쉭 하는 불길한 쇠뇌 소리와 함께 경계병의 외마디 비명이 밤공기를 갈랐다. 루시안 재상이 보낸 최정예 암살 부대 ‘홍련의 이빨’ 감찰 기사 스무 명이 장원의 침묵을 찢고 부두를 향해 쇄도해 온 것이었다. 그들의 손에는 피 묻은 갈고리 검과 독화살이 들려 있었고, 출항을 앞둔 피난선들을 불태우기 위한 기름 항아리가 준비되어 있었다.

암살 대장이 흉포한 살기를 뿜어내며 소리쳤다.

“역적 놈들과 황궁의 배신자를 한 놈도 남기지 말고 몰살해라! 저택과 배를 모조리 불태워 증거를 인멸하라!”

카단이 주저 없이 무쇠 방패를 앞으로 내세우며 전열을 막아섰다. 빗발치는 독화살들이 방패 표면에 부딪쳐 요란한 불꽃을 튀기며 튕겨 나갔다.

“내 방패 뒤로는 단 한 발자국도 지나갈 수 없다!”

그 옆으로 이그니스가 뛰쳐나왔다. 무기를 버렸던 이그니스는 바닥에 뒹굴던 굵은 쇠파이프를 집어 들고, 자신의 마나를 극한까지 끌어올렸다. 황궁의 오만함을 벗어던진 순백의 화염이 쇠파이프를 타고 맹렬하게 타올랐다. 그것은 파괴의 불꽃이 아니라, 동료를 지키기 위한 정화의 성화였다.

이그니스의 화염 강타가 암살자들의 갈고리 검을 산산조각 내며 그들을 호수 속으로 쓸어 넣었다. 카단의 견고한 방패와 이그니스의 순백 화염이 완벽한 조화를 이루며, 순식간에 암살 부대의 습격을 완벽하게 분쇄했다. 부러진 칼날들과 꺼진 횃불들이 차가운 호수 수면 위로 흩어졌다.

암살 대장이 호수에 빠진 채 이를 갈며 소리쳤다.

“이그니스! 황궁의 은혜를 배신한 대가를 반드시 치르게 될 것이다!”

이그니스가 호수를 내려다보며 차갑게 대답했다.

“황궁의 은혜 따위는 애초에 존재하지 않았다. 백성들을 짓밟는 권력은 무너져야 마땅하다.”"""

ep16_s5_exp = """패퇴한 암살자들이 호수 속으로 헤엄쳐 달아나고, 부두 위에는 다시 평온한 침묵이 돌아왔다.

동쪽 수평선 너머로 짙은 남색 밤하늘이 서서히 붉게 물들기 시작했다. 장원의 거대한 범선 ‘미풍의날개호’의 돛이 아침 바람을 받아 펄럭이며 출항을 알리는 고동 소리가 호수 전체에 웅장하게 울려 퍼졌다. 부두에 모인 난민들과 아이들이 손을 흔들며 일행의 무사 항해를 기원했다.

실리아가 뱃머리에서 손을 흔들며 외쳤다.

“카단, 이그니스! 닻이 올라가고 있어요! 바람이 순풍으로 바뀌었어요, 어서 타세요!”

론돌 역시 키를 잡고 우렁찬 목소리로 외쳤다.

“바다의 신이 우리에게 길을 열어주셨다! 젊은 사자들아, 새로운 시대를 향해 돛을 올려라!”

카단과 이그니스는 서로의 팔뚝을 단단히 맞잡으며 굳은 전우애의 눈빛을 나누었다. 두 청년은 나란히 갑판 위로 뛰어올랐고, 배는 일흔두 개의 거대한 석주 미로를 빠져나와 광활한 푸른 대해를 향해 힘차게 미끄러져 나갔다. 아침 햇살이 두 형제의 어깨 위로 찬란한 황금빛 축복을 내리고 있었다. 이제 그들의 앞에는 미지의 대해와 전설의 바람 속삭임 섬이 기다리고 있었다."""

EP16_KO = f"# 눈히어로 16화 - 폐허 앞의 형제\n\n> 원문 범위: 제31장-제32장\n\n{ep16_s1_exp}\n\n{ep16_s2_exp}\n\n{ep16_s3_exp}\n\n{ep16_s4_exp}\n\n{ep16_s5_exp}"

ep16_en = """SNSHero Novel
Episode 16: Brothers Before the Ruins

On the eve of their voyage to Whispering Wind Island, the dense, milky-white fog that had weighed upon Mist Lake for days lifted as if by magic. A cool crescent moon rose above the placid waters, bathing the seventy-two colossal basalt monoliths in silver radiance, while the mirror-like surface reflected the vast river of stars overhead in breathtaking clarity. In the dead of night, while the weary refugees slept after preparing the vessels for the morning departure, only the gentle lap of water against pilings and the rustle of blooming reeds stirred the peaceful silence. Walking along the wooden boards, Kadan stepped alone toward the furthest jetty of the floating manor.

Standing silhouetted against the moonlight at the far edge was a solitary, familiar figure. Having cast aside his immaculate white commander's cloak, Ignis wore only a battered leather arming doublet.

Grasping his silver-hilted ceremonial longsword—the ancestral heirloom of his lineage and the proud symbol of the White Flame Order—with both hands, Ignis gazed upon the keen, polished edge gleaming in the moonlight. Without a trace of hesitation, he opened his fingers. The blade sliced through the cool air, vanishing into the black depths of the lake with a heavy splash. Rippling concentric rings spread across the surface, swallowing the weapon's trail into the abyss.

Approaching quietly, Kadan stood beside him.

"That blade carried the highest honor of the imperial court. Do you feel no regret?"

Fixing his gaze upon the dark ripples, Ignis spoke in a hoarse, hollow voice.

"Honor stained in deceit and innocent blood is far better buried beneath the lake mud. Everything I spent my life fighting to protect was nothing more than a shield for corrupt monsters feasting upon the weak."

Looking up into the crystal canopy of northern constellations, Kadan murmured softly.

"Casting aside a blade is never defeat. Only when one empties hands that gripped falsehood can they truly embrace what is worth defending."

The despair and self-loathing in Ignis's tone cut deep into the night air. The crushing burden of guilt for blood shed in service of lies weighed heavily upon the young warrior's spirit.

Reaching inside his woolen coat, Kadan retrieved a weathered parchment scroll from an oiled leather pouch. It was dog-eared and stained with dried blood—the final letter written by Uncle Balian before his passing.

Kadan offered the scroll into Ignis's hands.

"Uncle Balian entrusted this letter to me. He said his soul could only rest in peace once it rested within your own grasp."

With trembling hands, Ignis broke the wax seal. Written upon the parchment in rough, powerful strokes was his father's unmistakable handwriting.

'To my son, Ignis. When you took up the White Flame in the capital, your father's heart ached with sorrow, yet I never held bitterness toward you. I knew the pure integrity of your spirit, yearning only to bring light to the realm. The path brother Aleksandar and I walked was fraught with hardship, but it was never in vain. The point of your sword must never serve the throne of tyrants; it must shield the hands of freezing children. You are loved, my son.'

As Ignis read the words, large tears welled and fell, darkening the ink upon the parchment. The father he had believed had abandoned him had, until his dying breath, held him in his heart as a cherished son. Overwhelmed by grief and redemption, Ignis sank to his knees upon the wooden planks, weeping openly.

Clutching the parchment against his chest, Ignis sobbed into the wind.

"Father... Blind to your suffering, I cursed you as a traitor and danced as a hunting hound for the court... How can I ever atone for this disgraceful blindness..."

Kneeling beside him, Kadan placed a comforting arm around his shoulders.

"Uncle Balian never once faulted you. His only prayer was that you would endure to find the true light."

When the quiet sobs subsided under the silver moonlight, Ignis lifted his tear-streaked face toward Kadan.

"Kadan... How did you endure? Having lost your parents, your master, and with the entire world branding you a criminal... How did you keep from being swallowed whole by the roaring fires of hatred?"

Drawing the silver dagger at his waist, Kadan gazed upon the moonlight gleaming along its spine. The red knot danced gently in the nocturnal lake breeze.

"Master Aleksandar taught me that a weapon is never an instrument to conquer or punish. It must be a sturdy roof that weathers the storm in place of the fragile and defenseless. The heavier the shield in your hand, the warmer the hearts of those you protect will dwell within your breast. Hatred incinerates one's own soul long before it reaches the foe, but the resolve to protect kindles an eternal ember even amidst the bitterest blizzard."

Ignis looked down at his empty, calloused hands. The warrior's scars across his palms no longer felt like badges of shame.

"A roof... Could hands like mine ever serve as a shelter for another?"

Kadan tapped his iron rim with a warm smile.

"We are brothers, Ignis. Just as Uncle Balian and Master Aleksandar stood together, it is our turn to watch each other's back."

Approaching from the jetty gallery, Cilia offered two steaming ceramic cups of herbal tea.

"You two should stop letting the chilly dawn wind bite your cheeks. Drink this and warm your bones; tomorrow we must conquer the open sea."

In that tender moment, a sharp hiss of crossbow quarrels and the frantic cry of a sentry shattered the night air from the outer timber colonnade. Twenty elite inquisitors of the Crimson Fang, dispatched by Minister Lucian to exterminate all living witnesses, charged across the outer piers toward the ships. Hooked blades and poisoned bolts gleamed in their hands, accompanied by jars of flammable pitch meant to incinerate the refugee vessels before departure.

The inquisition commander barked with vicious malice.

"Slaughter the northern rebels and the imperial turncoat without mercy! Burn the manor and every ship to ash to leave zero evidence behind!"

Without an instant's hesitation, Kadan planted his iron shield forward, anchoring the front line. A volley of poisoned bolts slammed into the curved surface, scattering sparks and splintering harmlessly away.

"Not a single foot shall pass behind this shield!"

Beside him, Ignis charged forward. Deprived of his sword, he seized a heavy iron stanchion from the deck, channeling his mana to the absolute limit. Stripped of imperial arrogance, the pure white flame roared to life along the metal. It was no longer a fire of conquest, but a sanctifying hearthfire ignited solely to defend his comrades.

Ignis's sweeping strike shattered the assassins' hooked blades, casting the assailants headlong into the icy lake. Kadan's immovable barrier and Ignis's immaculate white flame moved in seamless harmony, annihilating the ambush within minutes. Broken blades and sputtering torches hissed out in the freezing water.

Spitting lake water, the assassin leader snarled from the waves.

"Ignis! You shall pay dearly for betraying the grace of the throne!"

Looking down from the deck, Ignis replied with cold resolve.

"The grace of the throne never existed. A power that tramples its own people deserves only to be dismantled."

As the surviving assassins scrambled into the dark waters in panic, tranquil silence returned to the pier.

Beyond the eastern horizon, the deep indigo sky blushed with the first rose-gold hues of dawn. The massive sails of the flagship, 'Breeze Wing', unfurled in the morning wind, and the resonant blast of a conch horn echoed across the mist-cleared lake. On the pier, gathered refugees and children waved their hands, blessing the voyagers with heartfelt prayers.

Leaning over the forward railing, Cilia waved eagerly.

"Kadan, Ignis! The anchors are drawn! The wind has turned favorable, come aboard!"

Gripping the helm, Rondol bellowed with hearty triumph.

"The sea gods have opened our passage! Young lions, unfurl the sails toward the new dawn!"

Clasping each other's forearms in an unbreakable pledge of brotherhood, Kadan and Ignis bounded up the gangway. Slipping gracefully between the seventy-two ancient basalt monoliths, the ship glided out toward the boundless expanse of the azure ocean. Morning sunlight washed over the brothers' shoulders, crowning their journey with a golden blessing. Before them lay the uncharted high seas and the legendary shores of Whispering Wind Island."""

print("FINAL EP15 KO:", len(EP15_KO), "EN:", len(ep15_en))
print("FINAL EP16 KO:", len(EP16_KO), "EN:", len(ep16_en))

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

EP15_KO = """{EP15_KO}"""
EP15_EN = """{ep15_en}"""

EP16_KO = """{EP16_KO}"""
EP16_EN = """{ep16_en}"""
''')

print("Batch 2 fully assembled and written!")
