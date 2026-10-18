# -*- coding: utf-8 -*-
import sys, os, re
sys.path.insert(0, ".")

import scripts.enrich_batch5_full as eb5

# Adjust EP29 Cilia dialogue to ensure 100% uniqueness
ep29_s1_fixed = eb5.ep29_s1_rich.replace(
    "“이그니스가 남긴 불씨가 여전히 따스하게 고동치고 있어요. 그의 고결한 희생이 황궁의 어둠을 걷어냈지만, 빈자리가 너무나 크네요.”",
    "“이 유리 불씨를 쥐고 있으면 이그니스의 정결한 영혼이 손끝으로 고스란히 전해져 와요. 그의 고결한 희생으로 황궁을 구했지만, 곁이 비어버린 슬픔은 쉽게 가시지 않네요.”"
)

EP26_KO = eb5.EP26_KO_EXP
EP27_KO = eb5.EP27_KO_EXP
EP28_KO = eb5.EP28_KO_EXP
EP29_KO = f"# 눈히어로 29화 - 바람의 여왕\n\n> 원문 범위: 제57장-제58장\n\n{ep29_s1_fixed}\n\n{eb5.ep29_s2_rich}\n\n{eb5.ep29_s3_rich}\n\n{eb5.ep29_s4_rich}\n\n{eb5.ep29_s5_rich}"
EP30_KO = eb5.EP30_KO_EXP

# ==============================================================================
# ENGLISH TRANSLATIONS FOR BATCH 5 (EP 26 - 30)
# ==============================================================================
EP26_EN = """SNSHero Novel
Episode 26: Open Door, Closed Heart

Word of the grand cathedral's liberation spread like wildfire across the imperial capital of Lighthaven. Merchants and dockworkers who had endured decades under tyranny poured into the avenues bearing blazing pine torches, and amidst the roaring acclamation of the populace, the Sun Gate—the first perimeter portal of the inner citadel—was forced wide open. Yet beyond the shattered iron gates, the inner palaces presented an uncanny, necrotic gloom. Fountains in the grand plaza pooled with foul, bubbling sulfur wastewater instead of clear springs, and from every marble colonnade, flocks of ominous black ravens tainted by the Nine Shadows Codex took flight. Though the physical gates had fallen, the hardened hearts of the imperial aristocracy, steeped in terror and tyranny, remained sealed behind stone walls.

Bracing his Dragon Breaker shield, Kadan surveyed the parapets with sharp eyes.

"The iron gate has fallen, but the battle is far from won. Lucian has entrenched himself within the Obsidian Spire of the inner keep, preparing a fanatical last stand."

Lifting her Jade Staff, Cilia inhaled the chilly night air, her brow furrowing in distaste.

"Scarcely any living mortal aura lingers within these walls. The courtiers and shock guards have been poisoned by Medusa Gorgo's necrotic venom, reduced to mindless marionettes devoid of human sentiment."

Gazing upon the scorched guard barracks where he had once trained, Ignis spoke in solemn grief.

"The palace gardens where I played as a boy have rotted into a festering pit... It tears at my heart that I must shatter the memories of my youth to deliver judgment."

Kadan placed a firm hand upon Ignis's shoulder.

"New flesh can never bloom until the necrotic gangrene is carved away. Forward, Ignis."

Advancing into the central courtyard, a gilded balcony door creaked open, revealing Count Balthazar, commander of the inner palace guard and Lucian's cousin. Black serpentine runes coiled around Balthazar's throat, and his eyes burned with madness.

Clutching the railing, Balthazar laughed maniacally.

"Insolent commoners and turncoat knights! How dare you set foot in the imperial gardens! Tonight, your severed heads shall fertilize my rose beds!"

With a snap of his fingers, the marble flags parted, unleashing three armored Chimeras engineered through Gorgo's forbidden arts. With lion torsos, viper tails, and black-iron scales, the roaring monstrosities charged forward, spitting corrosive acid.

Wielding his iron weapon, Ignis stepped forward.

"Count Balthazar! You, who taught me swordsmanship in my youth, have fallen into this abominable madness! Cast down your steel and defile the empire's honor no longer!"

Balthazar sneered in contempt.

"Honor is merely the excuse of the vanquished! Power alone is the absolute law of this realm!"

The chimeras lunged, their iron-plated claws cleaving through the air with concussive snaps.

Without hesitation, Kadan anchored his Dragon Breaker shield, unleashing star-breathing.

Boom!

The beast's massive claws slammed into the dragonbone plate, only to be pulverized by the shield's golden kinetic backlash. Twisting his guard upward, Kadan struck the lead chimera's jaw, sending the titan tumbling backward.

Vaulting from Kadan's flank, Ignis cleaved through the air.

"Holy flame of purification, grant peace to these corrupted beasts!"

A crescent of pure white fire severed the necks of the chimeras, vaporizing the necrotic corruption into plumes of clean white steam. Simultaneously, Cilia swept her Jade Staff, conjuring a violent whirlwind that collapsed the marble balcony beneath Balthazar's boots.

Crashing onto the flagstones, Balthazar lay mortally wounded, coughing black blood.

Kneeling beside his former mentor, Ignis spoke through clenched teeth.

"Why... Why did you surrender your soul to Lucian's deceit, Count? Did you not teach me that a true knight is a shield for the weak?"

Trembling, Balthazar gasped in ragged breaths.

"Ignis... Minister Lucian is no mere conspirator... Behind him stands the true archduke of the abyss, Belphegor... Tomorrow at midnight... In the Jade Council... The emperor's soul will be offered as a blood sacrifice..."

With those final words, Balthazar expired, the serpent runes dissolving into thin smoke.

Cilia closed the fallen nobleman's eyes with a gentle wind prayer.

"The tragedy of those whose fear locked their hearts in darkness."

Tightening his grip on his shield, Kadan spoke with unwavering resolve.

"Tomorrow at midnight, the council will attempt the dark coronation. We must seize the barrier tower before the blood sacrifice begins."

With the courtyard secured, volunteer militias from the cathedral took up defensive perches along the parapets. Rondol and Grimli arrived with fresh supplies, fortifying the forward breach.

Gathered around a small brazier beneath the shadow of the Obsidian Spire, the three companions studied the palace blueprints.

Touching the scars across his palms, Ignis whispered into the night.

"Tomorrow night, everything concludes. Even if my life is extinguished, I will deliver the emperor and our people from the abyss."

Touching the crimson knot of his silver dagger, Kadan replied.

"We shall live through the storm together, Ignis. When the dawn breaks, we will look upon a realm where children smile without fear."

Clasping hands in an unbreakable vow, the three youths stood ready for the fateful night."""

EP27_EN = """SNSHero Novel
Episode 27: Between Two Promises

As midnight approached, the gardens of the inner citadel fell into an uncanny, breathless stillness. Though the fires of daytime skirmishes had subsided, the sharp chill seeping through the nocturnal mist prickled the skin like needles. Standing upon the marble terrace overlooking the capital, Kadan gazed up into the northern firmament, where the North Star shone with crystal clarity—the very constellation he had contemplated alongside Master Aleksandar across the snowy wastes of his youth.

Quiet footsteps stirred behind him as Cilia approached, carrying two steaming silver goblets of wild mountain mint tea.

Offering a cup to Kadan, Cilia smiled gently.

"Sleep eludes you, Kadan? Tomorrow night, eighteen winters of bitter vengeance will reach their conclusion, yet your shoulders remain as steadfast as northern granite."

Sipping the warm tea, Kadan replied in a quiet, measured cadence.

"I was thinking of the sacred vows I pledged to Master Aleksandar. That steel is never an instrument of dominion, but a shield to dry the tears of the suffering. And... the fraternal oath I shared with Ignis."

Leaning against the balustrade, Cilia caressed the night air with her fingers.

"You constantly shoulder the covenants of others, Kadan. Where does your own heart's longing reside?"

A faint, tender smile touched Kadan's lips as he looked down upon his battered iron shield.

"My wish is humble. When this war ends, I wish to return to my master's resting place in the northern wildlands, repair the fallen fences, and sow barley in the dormant fields. To kindle a warm hearthfire where weary wanderers shivering from the cold can always find shelter. That is the only peace I desire."

Cilia's eyes softened under the moonlight.

"A warm hearthfire... How wonderfully like you, Kadan. If so, when the peace is won, will you invite me to sit beside that northern hearth? I shall bring the fragrant lily oil of Whispering Wind Island to sweeten the air of your timber cabin."

Meeting her gaze with deep sincerity, Kadan nodded.

"I promise, Cilia. When spring arrives, we will watch the green barley sprout through the snow together."

A tender, sacred silence lingered between them under the silver moon, binding their spirits in quiet trust.

Soon, the heavy scrape of boots broke the reverie as Ignis joined them upon the terrace. Robed in a simple leather arming doublet, he carried the weathered wooden horse toy carved by his father Balian before his imprisonment.

Sitting beside the brazier, Ignis offered a wry, sorrowful smile.

"I trust I am not intruding upon your peace."

Handing him a cup of tea, Kadan shook his head.

"Never, brother. We were reviewing the infiltration route into the council chamber."

Caressing the carved mane of the toy horse, Ignis spoke in solemn resolution.

"Tomorrow night, I will settle the final debt with Lucian. To atone for the infamy forced upon my father and the innocent blood shed by my steel, I will extinguish Lucian's abyssal rites, even at the cost of my very breath."

Kadan frowned, his voice firm with reprimand.

"Speak not of throwing away your life. We fight so that all three of us may walk into the dawn together."

Shaking his head, Ignis withdrew a slender glass phial from his tunic. Suspended within was a miniature ember of pure white fire, pulsing with the gentle rhythm of a living heartbeat.

Ignis pressed the glass ember into Kadan's palm.

"This is the White Glass Ember, bound to my life's mana. Tomorrow, Lucian will prime the Abyssal Core beneath the throne. To shatter that core, it must be neutralized by the sacred bloodline of the White Flame."

When Kadan tried to return the phial, Ignis held his wrist in an unyielding grip.

"Listen to me, Kadan. You are the immovable shield of this continent. Cilia is the wind queen who will guide the new dawn. But I am the last scion of a corrupted court, whose duty is to burn away the sins of the past. If the worst befalls me... hold this ember close, survive, and protect the world in my stead."

Tears welled in Cilia's eyes as she cried out.

"No, Ignis! A victory bought with your martyrdom is no true salvation! We must return together!"

Smiling with profound gentleness, Ignis replied softly.

"My thanks, princess. But a knight knows the hour when he must stand without retreating."

Deep in the night, the three youths shared the dying warmth of the brazier.

Touching the glass ember pulsing against his breast, Kadan bore the staggering weight of three immense covenants: his vow to Master Aleksandar, his promise of spring to Cilia, and the tragic pledge entrusted by his brother.

Embracing the Dragon Breaker shield, Kadan closed his eyes in prayer.

"Whatever destiny awaits, this shield shall never surrender the lives of those I love."

Beyond the horizon, the first faint gray of dawn stirred, heralding the fateful day that would decide the fate of the realm."""

EP28_EN = """SNSHero Novel
Episode 28: The Jade Council Revolt

As midnight descended, the Jade Council Hall of the Imperial Palace was consumed by a tempest of catastrophic black mana. Enshrined atop the high dais where the thrones of past emperors had rested for centuries floated the forbidden relic of the Nine Shadows Codex: the Abyssal Core, pulsing with sickening crimson veins. Bound in dark mana chains, the unconscious elderly emperor hung suspended as a blood sacrifice, while spellbound senators and nobles chanted dissonant, guttural hymns in vacant delirium.

Stepping from the shadows of the dais in flowing crimson vestments, High Minister Lucian raised the desecrated Sovereign Blade bestowed by the demon prince Belphegor.

Lucian bellowed in manic ecstasy.

"The hour has arrived! With the emperor's blood, the gates of the abyss shall open, and I shall reign as the immortal sovereign of the new world!"

In that fatal breath, the massive stained-glass dome high above detonated into a shower of crystalline shards as three figures dropped from the ceiling like thunderbolts.

Slamming his Dragon Breaker shield against the altar steps, Kadan detonated a concussive shockwave of golden starlight.

Boom!

The kinetic backlash rent the dais, snapping the sacrificial chains binding the emperor. Sweeping forward with her Jade Staff, Cilia scooped the monarch into an azure wind gale, depositing him safely behind the front ranks.

Snarling in fury, Lucian brandished his blade.

"Insolent vermin! Death Knight Artus, tear them limb from limb!"

Summoned from the crypts, Artus charged with his broken obsidian greatsword, unleashing cleaves meant to split mountains. Yet Kadan angled the curved dragonbone plate of his shield with star-breathing, redirecting the shearing force into empty air. The deflected shockwave shattered colossal marble pillars, yet Kadan's guard remained impenetrable.

Brandishing his weapon, Ignis charged directly toward Lucian.

"Lucian! Your vile tyranny ends tonight!"

Ignis's pure white fire collided with Lucian's necrotic shields, filling the hall with blinding brilliance and suffocating heat. Cilia swept her staff, systematically severing the ley lines powering the inquisitors' wards.

Driven into a corner, utter madness flared in Lucian's eyes.

"Bwahaha! Do you think you have triumphed? Then let this entire palace burn to ash in the abyss!"

Slashing his palm across the blade, Lucian drove his bloodied steel straight into the heart of the Abyssal Core.

Cra-aaack!

The core went critical, expanding into an apocalyptic black sun that began consuming the hall's pillars. Space warped violently, initiating a cataclysmic dimensional collapse capable of vaporizing every living soul across the metropolis.

Kadan planted his boots forward, shouting over the roar.

"Fall back behind my shield! I will hold the line!"

Yet the scale of the impending detonation defied mortal containment. Unless an elemental champion entered the epicenter to neutralize the mana feedback with his own life essence, tens of thousands of citizens in the plazas outside would be obliterated.

In that heart-stopping instant, Ignis shoved Kadan backward with sudden, desperate strength.

"No, Kadan! Your shield must protect the future! This fire exists to burn away my sins!"

Kadan cried out in sheer agony.

"Ignis! Stop! In the name of our fathers, do not do this!"

Cilia shrieked, reaching out with all her might, but Ignis never looked back. He threw his living body into the raging vortex of the Abyssal Core.

From Ignis's spirit erupted a supernova of pure, immaculate white fire brighter than the sun. The ancient royal bloodline of the White Flame ignited in transcendent sacrifice, systematically neutralizing the necrotic singularity.

Turning his head through the flames, Ignis offered the radiant, innocent smile of his childhood, speaking his final words over the roaring tempest.

"Kadan... my brother... Tell Master Aleksandar and father Balian... that Ignis was never a coward at the end... Cilia... watch over Kadan..."

BOOOOM!

A blinding sheet of pure white starlight engulfed the entire palace. Wrapped in the holy flames of martyrdom, the Abyssal Core shattered into harmless dust, yet the physical vessel of the young hero dissolved into a shower of celestial light, scattering into the heavens.

"IGNIS————!!"

Kadan's grief-stricken roar rent the collapsing hall.

When the brilliance faded and silence settled over the ruins, only a small mound of white ash remained upon the altar.

Stumbling forward, Kadan dropped to his knees. Miraculously intact amidst the embers rested the carved wooden horse toy and the White Glass Ember, glowing with gentle, eternal warmth.

Clutching the relics against his chest, Kadan wept racking sobs, his tears darkening the ash.

Beside him, Cilia sank to the flagstones, biting her lip in agonizing sorrow.

Mortally wounded by the backlash, Lucian had fled through the subterranean conduits, while Artus dissolved into the shadows.

Stepping forward, the rescued emperor laid a trembling hand upon Kadan's shoulder.

"A noble knight's soul... has preserved the realm and its people..."

Gripping his silver dagger, Kadan lifted his face. Through the tears in the young warrior's eyes blazed an unbreakable, eternal resolve of iron.

"Ignis... Your sacrifice shall never be in vain. Upon the world you preserved with your life, I swear to erect an enduring peace."

Before the solemn martyrdom of the young hero, the darkest night of the continent was passing into dawn."""

EP29_EN = """SNSHero Novel
Episode 29: Queen of the Wind

On the morning following the tragedy at the Jade Council, the skies above Lighthaven hung heavy with gray storm clouds. Though the fires had been extinguished, the crushing sorrow of losing Ignis weighed upon every stone of the grand cathedral and the imperial palace. Standing beside the fountain in the palace courtyard, Kadan held the White Glass Ember, which pulsed with gentle, living warmth against his palm like the steady heartbeat of his fallen brother.

Approaching with her Jade Staff, Cilia stood silently beside him, tears drying upon her pale cheeks.

Cilia whispered softly into the morning draft.

"Holding this glass ember, Ignis's pure spirit speaks clearly to my fingertips. Though his noble sacrifice delivered the capital, the hollow void beside us aches with bitter sorrow."

Adjusting his shield, Kadan nodded with solemn depth.

"Ignis is not dead. The oath he left behind breathes eternally within this ember and within the chambers of our hearts."

At that moment, the high council of senators and the captain of the imperial guard approached, sinking to their knees before Cilia.

Holding aloft an imperial parchment decree, the senate chancellor proclaimed with deep reverence.

"Princess of Whispering Wind Island! By decree of His Imperial Majesty, we humbly petition you to ascend as Regent of the Empire and the Eastern Alliance—the Sovereign Queen of the Winds!"

Across the plaza, thousands of assembled citizens broke into thunderous acclamation, dropping to their knees in tearful entreaty. It was the offer of supreme dominion over the entire continent.

Yet Cilia shook her head gently, extending her hand to raise the chancellor to his feet.

Her voice rang out across the square with crystal clarity.

"Do not address me as Queen. The wind never seats itself upon a throne of stone."

A breathless silence fell upon the multitude.

Raising her Jade Staff, Cilia declared her covenant to the people.

"I seek no gilded crown. A world where every soul draws breath in freedom without the terror of tyrants—that was the true path of the wind envisioned by my mother Sylphid. I shall stand not as an empress above you, but as a sister of the wind who binds up your wounds and marches beside you to the very end."

A roar of tears, cheers, and heartfelt reverence erupted across the metropolis. To reject the imperial crown in favor of walking beside the common folk was the hallmark of true sovereignty.

Kadan looked upon her with profound pride.

"Master Aleksandar and Queen Sylphid smile upon your wisdom from the heavens."

Retiring to the war chamber, Kadan and Cilia convened with Rondol, Grimli, and the Six Masters around the regional charts.

Pointing to the northern passes, Rondol spoke in grim assessment.

"The wounded serpent Lucian has retreated to his final necromantic fortress in the Black Marsh, rallying the remaining legions of Belphegor. But to pursue him, our armies must breach the Four Gates Fortress, where four colossal sluices spew lethal venom."

Grimli slammed his fist onto the oak table.

"A hellish barrier! Acidic mist that dissolves steel plate within minutes. No army can march through that defile."

Taking the White Glass Ember from his coat, Kadan placed it upon the map. Miraculously, the ember cast a slender needle of pure white light pointing toward the northern sluice.

Kadan's eyes sharpened with certainty.

"Ignis is showing us the path. This is the structural flaw in their necrotic conduit."

Leading an elite vanguard, Kadan and Cilia advanced to the northern water gates. Sulfuric fog choked the rocky canyon, and the waterways boiled with violet poison inscribed with Gorgo's necrotic runes.

Surfacing from the venomous swamp, the venom-mistress Arachne sneered with spider-like fangs.

"Fools! A single breath of this miasma dissolves mortal flesh to bone! Your journey ends in this mire!"

A storm of poisoned quills rained from the heights.

Bracing his Dragon Breaker shield, Kadan unleashed the full power of star-breathing.

"This shield shall never yield before any poison!"

The golden aegis deflected the volley harmlessly into the stone. Sweeping her Jade Staff, Cilia conjured an azure gale that purged the violet fog into the upper atmosphere.

With Kadan shattering the central runic conduit with his silver dagger, the boiling toxins neutralized into crystal springs. The first gate swung wide open, revealing the path to the Black Marsh.

Standing beside Kadan, Cilia looked toward the northern horizon.

"Where Ignis's light guides our steps, we walk together until the dawn."

Grasping the warm ember in his pocket, Kadan nodded.

"So long as this fire burns, we shall never lose our way."

United in grief and unwavering resolve, the companions marched toward the final abyss."""

EP30_EN = """SNSHero Novel
Episode 30: Poison of the Four Gates

Breaching the outer perimeter, the companions stood before the formidable citadel of the Four Gates—the ancient northern rampart of the empire. Spanning the narrow chasm between sheer granite precipices, four massive black-iron sluice gates vomited waterfalls of corrosive serpentine bile engineered by Medusa Gorgo. Muck rose to the warriors' knees, threatening to swallow their boots, while the stench of burning sulfur and putrefaction filled the air.

Tapping the stone with his hammer, Grimli grimaced in disgust.

"Vile filth! An acidic miasma capable of melting tempered dwarven steel. Breathe a lungful of this vapor, and the strongest warrior will vomit black blood within a mile."

Kadan withdrew the White Glass Ember, holding it in his open palm. Even amidst the toxic murk, the ember radiated pure, immaculate white brilliance, wrapping his skin in soothing warmth.

Fastening fresh comfrey leaves to her staff, Cilia observed with wonder.

"The toxic fumes dare not approach the ember's light. Ignis's sanctified mana encloses us in an invisible sanctuary of pure air."

Bracing his shield, Kadan took the lead.

"Ignis has carved our path. We have no time to delay; we must demolish the four sluice cores in succession."

Reaching the eastern sluice, fifty undead cataphracts clad in rusted plate erupted from the mire, brandishing corroded broadswords in suicidal charges.

Kadan lowered his center of gravity, meeting the charge with the Dragon Breaker shield.

Boom!

The impact shattered the undead blades against the dragonbone rim. Spinning his shield with star-breathing, Kadan pulverized the front ranks in a single concussive sweep. Simultaneously, Rondol brought down a geyser of pressurized water with his iron pegleg, and Gawain sheared the primary control valve with wind blades.

With a dying hiss, the corrosive effluent of the eastern gate ceased.

Rondol barked a hearty laugh.

"Ha! The northern wolf scatters bone-men like autumn leaves! On to the western portal!"

The western sluice was defended by twenty venomous wyverns circling overhead, raining clouds of caustic spores upon the defile.

Hoisting her Jade Staff, Cilia sang an ancient wind hymn to the heavens.

"Spirits of the eastern sea! Cleanse this blight with the silver tempest of the dawn!"

A towering whirlwind erupted from Cilia's boots, reversing the falling spore clouds straight into the wyverns' maws. Paralyzed by their own venom, the beasts tumbled from the sky, where Eliana and Eyla dispatched them with frost arrows.

Kadan leaped onto the parapet, driving his silver dagger into the obsidian mana core, silencing the western sluice in a shower of azure sparks.

At last, the companions arrived before the central northern gate, where General Bargast, Lucian's chief fortress commander, stood atop the iron catwalk. Covered in venomous serpent tattoos, the brute leveled a massive sulfur flamethrower.

Bargast sneered in sadistic triumph.

"Insolent pups! This Four Gates Hellfire melts living stone! Burn to ash and feed the swamp!"

A torrent of liquid hellfire and concentrated venom engulfed the narrow defile.

Kadan braced the Dragon Breaker shield with both hands. Resonating with his heart's resolve, the White Glass Ember within his coat blazed to life, weaving a double aegis of white fire and celestial gold across the shield's face.

BOOM!

The inferno crashed against the bulwark, splitting in two and melting the canyon walls into slag, yet Kadan's boots remained anchored like iron pilings, yielding not a single fraction of an inch.

Roaring with righteous fury, Kadan stepped through the flames.

"So long as we have living warmth to defend, this shield shall never melt!"

Slamming his shield into the machinery, Kadan's strike pulverized the flamethrower and hurled Bargast from the parapet into the chasm below. With a final thrust of his silver dagger, Kadan severed the master chains.

With groaning thunder, all four iron sluices rose, unleashing the pristine mountain reservoirs behind the fortress. A flood of crystalline water rushed through the defile, washing away the corrosive slime and cleansing the putrid swamp into a clear, living lake.

Cheering wildly, thousands of volunteer troops and refugees surged through the liberated gates.

Cilia stepped to Kadan's side, her eyes fixed upon the northern peaks.

"The poison of the Four Gates is cleansed. The final road to the heart of the Black Marsh is open."

Holding the warm ember in his hand, Kadan nodded with unbreakable resolve.

"Following the beacon left by our brother, we march to deliver the final judgment."

Bearing the memories of their forebears and the sacrifice of their comrade, the companions marched forward into the final campaign."""

print("Writing scripts/novel_data/arc3_batch5.py...")
with open("scripts/novel_data/arc3_batch5.py", "w", encoding="utf-8") as f:
    f.write(f'''# -*- coding: utf-8 -*-
"""
scripts/novel_data/arc3_batch5.py
Episodes 26, 27, 28, 29, 30
Authentic commercial fantasy literature, 3,750 - 4,200 chars, 12 - 16 dialogues.
Enforces character lifecycle: Ignis perishes in Ep 28; STRICTLY ZERO spoken lines in Ep 29 and Ep 30.
"""

EP26_KO = """{EP26_KO}"""
EP26_EN = """{EP26_EN}"""

EP27_KO = """{EP27_KO}"""
EP27_EN = """{EP27_EN}"""

EP28_KO = """{EP28_KO}"""
EP28_EN = """{EP28_EN}"""

EP29_KO = """{EP29_KO}"""
EP29_EN = """{EP29_EN}"""

EP30_KO = """{EP30_KO}"""
EP30_EN = """{EP30_EN}"""
''')

print("Batch 5 successfully written to scripts/novel_data/arc3_batch5.py!")

