# -*- coding: utf-8 -*-
import sys, os, re
sys.path.insert(0, ".")

import scripts.enrich_batch6_full as eb6

# Enrich EP35 further (+320 chars) to reach ~3,860 chars
ep35_s1_extra = eb6.ep35_s1_rich + """\n\n공중 회랑의 차가운 난간을 스치는 바람결 속에는 오랜 세월 동안 산화해 간 영웅들의 슬픈 한숨이 배어 있었다. 카단은 드래곤 브레이커 방패의 표면을 쓸어내리며, 북방 설원에서 스승 알렉산다르가 쥐여주었던 은빛 단검의 붉은 매듭을 다시 한번 단단히 묶었다. “우리의 등 뒤에는 수만 명의 생명이 걸려 있다. 어떤 악령의 속삭임도 우리를 멈추지 못한다.”"""

ep35_s3_extra = eb6.ep35_s3_rich + """\n\n방패 표면에서 터져 나온 황금빛 별빛 고리가 공중 회랑 전체를 대낮처럼 환하게 밝혔다. 가짜 환영들이 비명을 지르며 연기처럼 흩어지자, 짙게 깔려 있던 유백색 안개가 순식간에 걷히며 맑은 밤하늘의 차가운 달빛이 두 영웅의 발밑을 비추었다. 시각을 버리고 대지의 맥박을 신뢰한 카단의 심안이 만들어낸 기적이었다."""

EP35_KO_FINAL = f"# 눈히어로 35화 - 안개 속의 착각\n\n> 원문 범위: 제69장-제70장\n\n{ep35_s1_extra}\n\n{eb6.ep35_s2_rich}\n\n{ep35_s3_extra}\n\n{eb6.ep35_s4_rich}\n\n{eb6.ep35_s5_rich}"

EP31_KO = eb6.EP31_KO_EXP
EP32_KO = eb6.EP32_KO_EXP
EP33_KO = eb6.EP33_KO_EXP
EP34_KO = eb6.EP34_KO_EXP
EP35_KO = EP35_KO_FINAL

print("FINAL EP35 KO len:", len(EP35_KO))

# ==============================================================================
# ENGLISH TRANSLATIONS FOR BATCH 6 (EP 31 - 35)
# ==============================================================================
EP31_EN = """SNSHero Novel
Episode 31: The Wagered Hand

Advancing across the northern plains after cleansing the Four Gates, the allied host stood before the Quicksand River, a treacherous watery boundary encircling the outer perimeter of the dreaded Black Marsh. Scores of fathoms wide, the torrent churned with thick, viscous sludge and liquefied sand rather than clean water, harboring bottomless quicksand pits that could swallow supply wagons in seconds. Across the opposite bank rose Lucian's dark citadel amidst rolling storm clouds, yet without specialized shallow-draft craft, crossing was impossible.

Probing the riverbank with his timber pegleg, Rondol clicked his tongue in grim assessment.

"This quicksand river is more foul than any stormy sea. Standard timber cutters will founder within minutes under the weight of the mud. Only the buoyant reed-skiffs crafted by the swamp goblins can navigate this slurry."

Bracing his shield, Kadan examined a crude skull-inscribed marker post.

"I understand a solitary overlord monopolizes all the river barges."

Spitting into the sand, Grimli replied in disgust.

"Bogart, the greedy goblin casino king. Colluding with the imperial court, he extorts fortune from fleeing refugees while hoarding the ferry fleet in his subterranean den. We must confront the cur directly."

Cilia swept her Jade Staff, reading the subterranean drafts with a nod.

"Beneath that shale ledge, I hear the clinking of gold coins and smell roasted fat. That is Bogart's lair."

Infiltrating the cavern den behind the reeds, the companions entered a vast subterranean gambling hall. Hundreds of rough brigands and goblins gathered around dice tables and card games amidst thick clouds of sulfuric tallow smoke. Lounging atop a silk divan at the center sat the corpulent goblin king Bogart, festooned in garish gold jewelry and swigging dwarven stout.

Eyeing Kadan's Dragon Breaker shield with a covetous smirk, Bogart sneered.

"Heh-heh! The northern knight who shattered the palace gates graces my humble den! You desire a hundred reed-skiffs to cross the Quicksand River? But Bogart never parts with his property for free!"

Planting his shield onto the table with a heavy thud, Kadan spoke calmly.

"Name your price. We can compensate you generously in imperial gold."

Juggling two gilded dice in his claws, Bogart's yellow eyes gleamed with malice.

"Gold is boring! Let us wager, knight! If you defeat me in a single throw of the dice, I grant you a hundred skiffs without fee. But if you lose... I shall sever your left arm at the shoulder and mount that legendary shield as the grand trophy of my gambling hall! Do you dare accept the wager?"

Cilia leveled her staff, her voice ringing in anger.

"A despicable cheat! We will not gamble human lives upon a table!"

Yet Kadan raised a calm hand to steady her. Reaching into his coat, he touched the White Glass Ember, which pulsed with rhythmic warmth against his palm. The ember's subtle resonance detected the microscopic magnetic core embedded within Bogart's dice.

Sitting before the stone table, Kadan replied evenly.

"I accept the wager. My shield arm against your fleet. You cast first, and I cast after."

Grinning in cruel triumph, Bogart rattled the dice in a golden cup. Weighted with loadstone to react with a magnetic plate concealed beneath the table, the dice were rigged to land invariably upon double sixes.

Clatter-bang!

Bogart lifted the cup, revealing a perfect pair of sixes.

"Heh-heh-heh! Twelve! An immaculate, unbeatable score! At best, you tie; at worst, you lose! Lay your arm upon the anvil, boy!"

The gathered ruffians roared, drawing rusted daggers, while the Six Masters tensed their weapons.

Unperturbed, Kadan took the golden cup, placing the dice within. As he swirled the dice, he channeled a minute pulse of star-breathing into the metal. The celestial mana vibrated the loadstone, inverting its magnetic polarity.

Boom!

Kadan brought the cup down with decisive force. As the cup rose, the first die rolled true, displaying a clear '6'. The second die, unable to endure the concentrated mana shock, split cleanly in half down its center seam, presenting both a '6' and a '1' facing upward.

A total score of thirteen.

Stunned silence fell across the gambling den.

Kadan declared with tranquil authority.

"My score is thirteen. All pips face the ceiling. The wager is mine."

Bogart's greenish skin paled as his jowls quivered in disbelief.

"Im-impossible! The dice split... A score of thirteen is blasphemy! Guards, butcher them all!"

The ruffians lunged forward, but the Six Masters moved in devastating unison. Grimli's hammer pulverized the stone table, Gawain's wind blades disarmed the thugs, and Kadan pinned Bogart against the rock face with the rim of his shield.

"You played with loaded dice, Bogart. I could sever your head for your fraud, but I grant you your life. Deliver two hundred reed-skiffs to the riverbank at once."

Terrified, the goblin king groveled in the dust.

"Mercy, noble knight! Two hundred skiffs... Three hundred skiffs, anything you desire!"

Within an hour, a grand armada of buoyant reed-skiffs lined the shore, ferrying the entire allied host safely across the quicksand without shedding a drop of blood.

Touching the warm glass ember in his pocket, Kadan gazed toward the distant citadel.

"Ignis, the wisdom you left behind has opened another bloodless path."

Smiling beside him, Cilia gripped her staff.

"Now we march into the heart of the Black Marsh to end Lucian's reign forever." """

EP32_EN = """SNSHero Novel
Episode 32: Echo of First Love

Crossing the Quicksand River, the allied host entered the Whispering Willows, an ancient elven grove preserved amidst the desolate rot of the Black Marsh. Thousands of years ago, this sanctuary was where the ancient spirits of the wind and the first high elven sovereigns had pledged their sacred covenants. Silver willow boughs cascaded across placid, glass-like ponds, and bioluminescent fireflies drifted between the leaves like falling starlight. Yet beneath this breathtaking beauty lurked the intoxicating, lethal miasma of Lilith, arch-demon of illusions serving Belphegor.

Cilia paused, embracing the Jade Staff against her breast.

"This is the Silver Willow Garden... where my mother Sylphid and father Aeolus first met in their youth and pledged their eternal love. It is the sacred grove praised in our kingdom's oldest lullabies."

Bracing his shield, Kadan scanned the misty shadows with sharp senses.

"Lethal hallucinatory spores are drifting on the breeze. Ignis's glass ember pulses with warning heat. Maintain utmost vigilance."

Tightening their formation, Grimli and Rondol readied their steel.

"Ancient sanctums make prime nesting grounds for foul phantoms. Keep your boots light."

Reaching the central clearing, the mist thickened into an ethereal emerald palace. Beside a pristine crystal pool sat a radiant woman robed in immaculate white silk, bearing the crest of the Wind Kingdom upon her bodice. Smiling with infinite maternal tenderness, she opened her arms toward Cilia. It was Queen Sylphid, preserved in the prime of her youth.

The spectral queen whispered in a melodious, heartbreaking cadence.

"Cilia... my precious child... How cold and lonely you must have been amidst the harsh tempests of the world... Lay down that heavy staff and rest eternally within your mother's embrace... You need fight no longer..."

Tears spilled from Cilia's eyes as her fingers loosened upon her staff. The deep yearning of eighteen motherless years surged forth like an uncontainable tide.

"Mother... Is it truly you...? Please... do not leave me alone again..."

Spellbound, Cilia took a trembling step toward the apparition.

Just as the phantom slipped a poisoned necrotic dagger from behind her back, her features twisting into a cruel sneer, Kadan sprang forward like a thunderbolt, slamming his Dragon Breaker shield between them.

Boom!

A concussive shockwave shattered the phantom pool, revealing the hideous shadow demon beneath. It was no queen, but Lilith, the soul-devouring illusionist of the Nine Shadows.

Grasping Cilia's trembling shoulders, Kadan shook her with desperate conviction.

"Open your eyes, Cilia! That is not your mother! Queen Sylphid was a valiant sovereign who held her ground to her dying breath to shield her people! She would never counsel you to flee into cowardly illusions!"

Cilia gasped, snapping out of the trance as tears streamed down her cheeks.

"Kadan... I... I faltered for a moment..."

Reaching into his tunic, Kadan placed the warm White Glass Ember into her trembling palm.

"We have an unbroken covenant to fulfill. Remember our promise to watch the green barley sprout through the northern snows together."

The pristine warmth of the ember and Kadan's steadfast presence dispelled the lingering poison in Cilia's spirit. Drawing her reed flute, Cilia raised it to her lips and began playing the primordial wind hymn passed down by her mother: the 'Echo of Purification'.

The clear, celestial notes resonated across the weeping willows. Wherever the melody touched, the dark mist melted away like morning frost, shattering Lilith's illusionary web into glass shards.

Exposed in her true demonic visage, Lilith shrieked in rage, only for Kadan's shield and Rondol's axe to smash her physical form into dust within seconds.

Tranquility returned to the ancient grove as starlight broke through the canopy.

Clasping Kadan's hand, Cilia whispered with profound gratitude.

"Thank you, Kadan. Because you stood beside me, I did not lose my mother's true spirit."

Smiling gently, Kadan replied.

"When you stumble, I shall be your shield; when I weary, your wind shall lift my wings. That is why we walk this road together."

Emerging from the willows, the companions beheld the menacing bulk of the Black Citadel looming at the center of the swamp. The final hour had arrived."""

EP33_EN = """SNSHero Novel
Episode 33: The Black Marsh

Clearing the willows, the allied army arrived before the ultimate bastion of imperial corruption: the central fortress of the Black Marsh. Stretching to the horizon lay putrid quagmires and boiling sulfur pools, under skies choked by the necrotic squalls of the Nine Shadows Codex. At the heart of the mire upon a volcanic crag rose the Black Citadel, a titanic obsidian fortress erected by primordial shadow warlords, bristling with legions of undead cataphracts and iron-plated golems.

Bracing his Dragon Breaker shield, Kadan surveyed the formidable ramparts.

"Lucian has marshaled every remaining reserve in the realm. The moat before the gates is a boiling abyss of magma and concentrated venom; a conventional crossing is impossible."

Reading the atmospheric conduits with her staff, Cilia noted with grave urgency.

"Catastrophic mana inversions are building within the foundations. Lucian intends to detonate the continental ley lines, incinerating the land in hellfire."

Grimli honed his twin battleaxes, gritting his teeth in fury.

"No time to dally! We Six Masters will spearhead the assault to bridge that infernal moat!"

Stamping his pegleg, Rondol bellowed with hearty resolve.

"Time for old dogs to blaze their final embers! Follow our charge, young lions!"

The battle horns of the allied host tore through the marsh.

As thousands of volunteers charged across the mud, the citadel's black-iron ballistae and mana cannons opened fire, raining fiery sulfur boulders across the approaches.

Standing at the vanguard, Kadan held his Dragon Breaker shield high, anchoring an impenetrable dome of starlight that deflected the falling siege shot into the swamp.

Behind his bulwark, the Six Masters demonstrated the peerless artistry of seasoned veterans. Grimli pulverized boulders to anchor an ice bridge across the moat, Gawain's wind scythes cleared the battlement gunners, and Eyla and Eliana neutralized the ballista crews with pinpoint frost arrows.

Reaching the iron drawbridge, the massive gates parted, unleashing two gargantuan Bone Drakes animated by the Nine Shadows Codex. The skeletal horrors plunged from the towers, vomiting torrents of caustic dragonfire.

"Scatter!"

Kadan leaped forward, catching the direct blast upon his shield. Molten flames split around the dragonbone plate, scorching his gauntlets, yet his stance held firm.

Seizing the opening, Rondol raised a massive mud spout with his pegleg, throwing the lead drake off balance, while Gawain vaulted overhead to decapitate the beast with an azure wind stroke. Simultaneously, Cilia swept her staff, conjuring a vacuum vortex that smashed the second drake against the granite ramparts.

Breaching the outer lines, the companions stood before the great obsidian gates of the inner keep. Standing atop the parapet, Minister Lucian appeared in flowing crimson vestments, his body warping under demonic possession.

Lucian shrieked in maniacal frenzy.

"Insolent insects! Even gods cannot force these adamantine gates! You shall be entombed alive beneath the mountain!"

Pulling the master lever, Lucian initiated the fortress self-destruct sequence. The foundations groaned as titanic stalactites began crashing from the vaulted ceiling.

Cilia cried out in horror.

"He is bringing down the entire mountain to bury our army!"

In that fatal breath, Kadan raised the White Glass Ember high into the gloom.

The ember resonated with his heart's resolve, firing a beam of pure celestial starlight directly into the gate's runic core. Corrupted by holy fire, the necrotic wards shrieked and dissolved.

Driving his silver dagger into the keystone, Kadan slammed his Dragon Breaker shield into the timbers.

BOOM!

The ancient gates shattered inward with concussive force.

Raising his blade high, Kadan bellowed to the host.

"The gate is broken! Forward, to the heart of the citadel!"

With a roar that shook the swamp, the army poured into the breach, launching the final assault upon the seat of darkness."""

EP34_EN = """SNSHero Novel
Episode 34: Fallen Wind Isle

The inner colonnades of the Black Citadel resembled the bowels of the underworld. Burning sulfur boulders rained from the collapsing ceiling, and the flagstones split apart, disgorging geysers of molten magma. Lucian's doomsday runes had destabilized the mountain roots, threatening to entomb the citadel and the allied host beneath millions of tons of granite.

Deflecting a falling boulder with his wind staff, Gawain coughed against the sulfur smoke.

"This is no fortress; it is a mass grave! The madman never intended to survive; he seeks to drag the entire continent into his pyre!"

Channeling her Jade Staff, Cilia strained to hold back the fracturing vault, blood seeping from her lips under the crushing mana strain.

"The subterranean ley lines are snapping like thread... The ceiling cannot endure!"

Kadan raised his Dragon Breaker shield over Cilia and the wounded vanguard.

"Do not despair! Reach the high altar and shatter Lucian's master rune, and the collapse will halt!"

Reaching the central junction, disaster struck: three of the four colossal adamantine support pillars holding the cavern roof fractured in cascading detonations. If the final central pillar collapsed, the entire mountain peak would crush every soul within the citadel.

In that fatal instant, Grimli the dwarven smith burst into a hearty laugh, shouldering his great anvil as he strode toward the buckling pillar.

Driving the anvil beneath the fractured base as a locking wedge, Grimli bellowed.

"Kadan, Cilia! Run to the altar and do not look back! An old blacksmith shall hold up the heavens for his disciples!"

Horrified, Kadan lunged to drag him back.

"Master Grimli, no! If the pillar snaps, there is no escape!"

Eyla the huntress, Rondol the pugilist, Kaze the shadow, and Eliana the herbalist stepped beside Grimli, their weathered faces serene with transcendent peace.

Bracing his pegleg against the shale, Rondol thrust his broad shoulder against the stone.

"For eighteen winters we lived on borrowed time, honoring the fallen Aleksandar and Balian! The hour has come to pass the dawn to our children! Run, Kadan!"

Channeling their life essence into the adamantine stone, the Six Masters wove an impenetrable bulwark of five-element mana, miraculously halting the ceiling's collapse.

Weeping bitterly, Cilia reached out in agony.

"Masters... please come with us! Please!"

Eliana offered a tender, radiant smile.

"Weep not, little princess. Our souls shall dance forever amidst the lilies of the Wind Kingdom... Our reunion with Sir Aleksandar shall be joyous."

Just then, hundreds of abyssal golems breached the rear walls, lunging to slaughter the masters holding the pillar.

Planting his staff into the earth, Gawain turned to Kadan with fierce pride.

"Behold Gawain's final tempest, boy! Leap to the altar!"

Igniting his very soul, Gawain unleashed the forbidden mystery: the 'Divine Gale Gyre'.

A colossal hurricane tore through the hall, pulverizing the golem horde and carving an open passage directly toward the high altar. Stepping into the center of the vortex, Gawain linked hands with Grimli and the other masters, holding the failing pillar firm.

Bloodied but smiling proudly, the masters nodded to Kadan and Cilia.

"We entrust the future to your shield, heir of the Holy Order!"

CRRR-AAASH!

The mountain peak collapsed in an apocalyptic avalanche, burying the central hall beneath hundreds of thousands of tons of granite. The heroic champions passed into legend, shielding their disciples' retreat with their very flesh.

"MASTERS————!!"

Kadan's agonized roar echoed through the stone, yet from beyond the fallen rock wall came only solemn, eternal silence.

At the summit of the cleared stairway stood the Altar of Ruin.

Atop the high throne waited Minister Lucian, his eyes burning with demonic madness as he clutched the blood-stained Nine Shadows Codex.

Drawing his silver dagger, Kadan wiped the tears from his eyes, ascending the altar steps with footsteps heavy as destiny. The sacrifice of the Six Masters and the memory of Ignis ignited within his breast in an eternal flame of iron resolve.

Leveling his Dragon Breaker shield, Kadan proclaimed his judgment.

"The blood of the Six Masters carved this road. Lucian, you shall answer for every crime to the final drop of your blood."

Raising her Jade Staff, Cilia stood beside him.

"In the name of Whispering Wind Island and the Holy Order, your darkness ends tonight."

The final battle for the soul of the continent commenced upon the summit of ruin."""

EP35_EN = """SNSHero Novel
Episode 35: Mistaken in the Fog

Breaching the final threshold through the sacrifice of the Six Masters, Kadan and Cilia emerged upon the Phantasm Colonnade encircling the Altar of Ruin. Open to the storm-swept heavens, freezing northern winds howled through the fractured pillars above dizzying chasms plunging thousands of fathoms into the abyss. Choking the suspended flagstone spans was a dense, milky-white fog woven from Medusa Gorgo's necrotic hallucinations and Belphegor's dark sorcery. From the drifting mists echoed the phantom laughter of Grimli, the warm counsel of Gawain, and the familiar cadence of Ignis, testing the young champions' grief.

Touching the White Glass Ember pulsing against his breast, Kadan steadied his breathing.

"Cover your ears, Cilia. Those voices in the fog are not our masters. They are vile phantoms engineered to exploit our sorrow."

Gripping her Jade Staff with both hands, Cilia swallowed her tears.

"I know, Kadan. The spirits of our forebears do not tempt us into weakness; they blow strength into our wings from beyond the veil."

Back to back, the two companions advanced across the fog-shrouded stone bridge.

From the gloom strode a massive, armored figure clad in cracked obsidian plate: Death Knight Artus. Yet within the mist, his shadow fractured into five identical replicas, each bearing the same terrifying mana signature and brandishing broken obsidian greatswords.

Artus's hollow voice echoed simultaneously from every direction.

"Miserable orphans who buried your masters in the stone... The living cannot navigate the labyrinth of the dead. Your hollow convictions shall rot within this fog!"

Five obsidian broadswords slashed downward in unison, targeting Kadan and Cilia from every angle.

Defending against five simultaneous strikes with mortal sight was impossible; vision alone could not distinguish phantom blade from solid steel.

Without hesitation, Kadan closed his eyes.

"Discard visual deception. Master Aleksandar taught me that when the eyes are shuttered, the ear perceives the true pulse of the earth."

Focusing entirely upon star-breathing and the ground beneath his boots, Kadan read the subtle micro-vibrations in the flagstones. Four of the descending blades cleaved only air, but one strike bore the crushing kinetic mass of living stone.

"Found you!"

Snapping his eyes open, Kadan spun his Dragon Breaker shield upward at a forty-five-degree angle.

Boom!

The moment the true blade struck the dragonbone rim, a radial shockwave of golden starlight detonated across the span. The four shadow clones dissolved into wisps of smoke, and the real Artus was hurled backward, vomiting black blood.

Stumbling, the death knight lost his balance.

Seizing the opening, Cilia vaulted overhead with her Jade Staff.

"Blade of the gale, sever the chains of the damned!"

A crescent of pressurized vacuum severed Artus's right arm at the elbow, sending the obsidian greatsword clattering into the chasm below.

Robbed of his weapon, Artus clutched his shattered armor, groaning in human torment as Lucian's controlling curse fractured.

"Lord Lucian... I have failed to breach the knight's shield..."

Retreating through the fog, Artus sealed the inner bronze gates of the sanctum behind him, retreating into the final chamber.

With the phantom fog dispelled, the starlit night sky illuminated the stone bridge.

Before the shattered portal lay the inner sanctuary of the Altar of Ruin, where Lucian channeled the final pages of the Nine Shadows Codex.

Checking the edge of his silver dagger, Kadan turned to Cilia.

"Are you ready, Cilia?"

Wiping the dust from her brow, Cilia smiled with unbreakable resolve.

"Yes, Kadan. Our masters and Ignis march beside us. I fear nothing."

Slamming his Dragon Breaker shield into the bronze gates, Kadan shattered the final locking bar.

Boom!

The doors swung wide, and the two young champions crossed the threshold to face the architect of the realm's long nightmare."""

print("Writing scripts/novel_data/arc4_batch6.py...")
with open("scripts/novel_data/arc4_batch6.py", "w", encoding="utf-8") as f:
    f.write(f'''# -*- coding: utf-8 -*-
"""
scripts/novel_data/arc4_batch6.py
Episodes 31, 32, 33, 34, 35
Authentic commercial fantasy literature, 3,750 - 4,200 chars, 12 - 16 dialogues.
Enforces character lifecycles:
- Ignis: DEAD (STRICTLY ZERO spoken lines in Ep 31-35)
- Six Masters: Perish heroically in Ep 34; ZERO spoken lines in Ep 35-40!
"""

EP31_KO = """{EP31_KO}"""
EP31_EN = """{EP31_EN}"""

EP32_KO = """{EP32_KO}"""
EP32_EN = """{EP32_EN}"""

EP33_KO = """{EP33_KO}"""
EP33_EN = """{EP33_EN}"""

EP34_KO = """{EP34_KO}"""
EP34_EN = """{EP34_EN}"""

EP35_KO = """{EP35_KO}"""
EP35_EN = """{EP35_EN}"""
''')

print("Batch 6 successfully written to scripts/novel_data/arc4_batch6.py!")

