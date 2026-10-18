# -*- coding: utf-8 -*-
import sys, os, re
sys.path.insert(0, ".")

import scripts.enrich_and_finalize_batch4 as eb4

EP23_EN = """SNSHero Novel
Episode 23: Records of the Grotto

Having safely breached the Siren Strait, the companions reached the foothills of Mount Dragonhorn, a rugged coastal mountain range towering along the continental mainland. Jagged black granite cliffs cleaved into the sky like the spine of an ancient dragon, and each time violent swells crashed against the stone, concussive booms echoed through showers of crystalline sea spray. Accessible only during low tide, the yawning mouth of a submerged sea cave lay concealed beneath dense carpets of black moss and barnacles, entirely invisible to passing imperial patrols. It was the legendary Dragon Grotto—the secret redoubt where the Arcane Holy Knights had established their rear headquarters during the First Crusade two decades ago.

Limping forward on his timber pegleg, Rondol ran his fingers along a fractured crevice at the cavern threshold.

"This is the threshold. Twenty winters ago, Lord Balian and Sir Aleksandar slipped through imperial cordons to shelter thousands of starving refugees in these vaults. The subtle resonance of the Holy Knights' warding mana still lingers amidst the rock."

Bracing his unadorned iron shield, Kadan took the lead into the gloom. The interior was remarkably cool and tranquil, shielded from the coastal tempest. Phosphorescent lichen clinging to the stalactites overhead cast soothing azure luminescence, illuminating an ancient flagstone passage.

Kindling a gentle wind lantern at the head of her Jade Staff, Cilia examined the subterranean architecture.

"Ancient wind wards etched into the stone walls are still active. They function as a screening matrix, neutralizing imperial tracking cantrips."

Touching a weathered emblem of the White Flame Order carved into the stone, Ignis swallowed hard.

"Somewhere in this vault... lie the personal records penned by my father."

Entering the great central rotunda, a colossal round stone table encircled by twelve high-backed chairs greeted the companions. Though fine dust coated the granite, an ornate iron lockbox resting upon the table remained pristine and unblemished, preserved by an ancient kinetic barrier.

Stepping forward, Kadan carefully disengaged the arcane locking mechanism. Within lay thick vellum campaign journals bound in cured leather, accompanied by classified tactical diagrams of the imperial palace's subterranean aqueducts.

With trembling fingers, Kadan opened the first volume. Written across the yellowed parchment in bold, commanding strokes was the familiar hand of Master Aleksandar.

'First Crusade Expedition Log. Chronicler: Aleksandar. May the Light grant that the blades and shields in our hands never become instruments of tyranny, but remain a steadfast bulwark for the vulnerable. High Minister Lucian has surrendered his soul to the shadows of the Nine Shadows Codex; my sworn brother Balian and I bury the untainted truth within this cavern to preserve the final hearthfire of the continent.'

Tears welled in Kadan's eyes as he read his master's words.

"Master Aleksandar foresaw everything from the very beginning. He knew that even if they were branded traitors and driven to their graves, they had to preserve the beacon of truth for the generations to come."

Cilia placed a comforting hand upon his shoulder.

"His noble spirit has survived inside these cold stone walls, guiding our steps to this very threshold."

Meanwhile, Ignis lifted a slender leather ledger resting at the bottom of the chest. It was a secret operational diary kept by his father, Paladin Balian. Detailed within were the security rotation schedules of the capital, the subterranean waterways beneath the cathedral, and the layout of Lucian's subterranean 'Alchemy Dungeons' where innocent citizens were subjected to forbidden mana extraction.

Horror and fury twisted Ignis's features.

"A massive subterranean dungeon was hidden directly beneath the capital cathedral... Lucian imprisoned dissenting nobles and scholars there, injecting them with Medusa Gorgo's necrotic venom to synthesize monstrous abominations! My father was condemned to the sulfur mines because he attempted to demolish that hellish laboratory!"

Ignis slammed his fist into the stone table, unheeding of the blood welling from his knuckles.

"While my father bled in chains, I patrolled those gilded corridors playing the obedient soldier for his torturers... How can I ever wash away such disgraceful blindness!"

Kadan gripped Ignis's arm with unwavering strength.

"Do not torment yourself, Ignis. Uncle Balian left this blueprint not so you would weep over the past, but so your hands could shatter those iron gates. Now we finish the work they began."

Suddenly, a mournful shriek echoed from the ceiling stalactites as violet vapor seeped through the cracks. Twelve necrotic wraiths planted decades ago by Medusa Gorgo to desecrate the sanctuary awakened, their serpent tails and skeletal maws snapping with venomous malice.

Bracing his iron shield, Kadan channeled star-breathing into an impenetrable bulwark.

"Vile apparitions shall never defile this sacred haven!"

A brilliant sheet of celestial starlight erupted from Kadan's shield, blowing back the toxic miasma. Vaulting forward, Ignis channeled his immaculate white flame along his weapon, incinerating the necrotic cores of the apparitions in rapid succession.

"Begone, remnants of the shadow!"

Sweeping her Jade Staff, Cilia conjured vacuum blades that cleanly severed the remaining specters. Confronted by the unified wrath of the three youths, the shadows dissolved into white ash within minutes, returning serene tranquility to the cavern.

As they cleared the dais, Cilia discovered a delicate jade key nestled in the lining of the chest, engraved with the intertwined emblems of the Holy Order and Whispering Wind Island.

"This is the key to the Sealed Arsenal deeper within the grotto, where ancestral relics forged for the final campaign are enshrined."

Adjusting his silver dagger, Kadan nodded with grim focus.

"To shatter Lucian's legions, we must elevate our strength. Let us claim our forebears' legacy."

United in purpose, the companions took up the jade key and marched toward the massive adamantine gates sealed within the deepest recess of the mountain."""

EP24_EN = """SNSHero Novel
Episode 24: The Sealed Chamber

Reaching the deepest cul-de-sac of the Dragon Grotto, the companions stood before a colossal adamantine portal carved into the living rock face. Towering scores of fathoms into the gloom, the gate was intricately inscribed with the sacred litanies of the Holy Order, the swirling glyphs of the wind, and the roaring sigils of the White Flame. At the portal's center rested three circular indentations radiating celestial starlight, verdant jade, and pure sanctified fire, denoting an ancient elemental seal that no physical crowbar could ever breach.

Cilia rested her staff against the door, sensing the intricate mana conduits.

"This is the Tripartite Seal of the Sworn Brothers. It yields only when the pure faith of the Holy Knights, the noble royal lineage of the winds, and the sanctified flame of redemption resonate in absolute harmony. Our mana frequencies must synchronize to the exact heartbeat."

Unslinging his iron shield, Kadan stepped before the starlight socket.

"The covenant forged between Master Aleksandar, Uncle Balian, and Queen Sylphid lives on in this stone."

Ignis stepped before the flame socket, his head held high.

"With the fire of an unyielding spirit seeking true atonement, I offer my strength."

Exchanging glances of profound trust, the three youths pressed their palms into the three respective sockets.

"Now!"

At Kadan's command, a torrent of mana surged forth. From Kadan's fingertips flowed pristine starlight honed across northern tundras; from Cilia's palms poured life-giving gale mana; and from Ignis's grasp roared molten white fire that purged all impurity.

The three elemental streams raced along the carved circuitry in dazzling brilliance.

Cra-aaack!

Centuries of slumber ended as titanic adamantine gears groaned in thunderous synchrony. The massive gates parted, unleashing a cascade of ancient temple frankincense and pure, revitalizing mana that filled the grotto like a waterfall.

Within lay a magnificent vaulted sanctuary of white marble. Enshrined atop the central altar was an imposing defensive relic carved from the fossilized jaw of an ancient wyrm: the legendary Dragon Breaker shield reinforcement armature. Flanking the relic rested Paladin Balian's sanctified breastplate and Master Gawain's wind cloak.

With reverent steps, Kadan approached the altar, lifting the Dragon Breaker armature and affixing it onto the face of his unadorned iron shield.

Clang!

As if forged together at the dawn of time, the dragonbone armature fused seamlessly with the iron rim, erupting in blinding golden brilliance. Raised relief of dragon scales and the holy cross blossomed across the face, multiplying the shield's kinetic deflection and mana capacity a hundredfold. A profound pulse of celestial mana coursed through Kadan's arms into his spirit.

Ignis breathed in awe.

"Magnificent... Master Aleksandar's shield has reclaimed its legendary glory. No siege cannon in the empire can breach that bulwark."

Smiling, Cilia retrieved a pair of ancient gale-rune earrings that amplified atmospheric resonance.

"The final armaments prepared by our parents are assembled."

Suddenly, the heavy stomp of iron greaves and violent battle cries shattered the peace. Thirty elite shock troopers of Lucian's 'Iron Hounds' burst into the chamber, led by Commander Barto wielding an immense two-handed warhammer.

Barto sneered in feral delight.

"The northern rats unearthed the vault for us! Surrender the relics and offer your necks!"

Leaping into the air, Barto brought his crushing hammer down toward Kadan's skull with world-shattering momentum.

Kadan stood immovable, raising the newly forged Dragon Breaker shield to meet the blow with star-breathing.

Boom!

The moment hammer struck shield, a golden kinetic shockwave detonated across the chamber. Barto's iron hammer shattered into a thousand jagged fragments, and the concussive backlash hurled the commander against the basalt wall, vomiting blood. Caught in the radial shockwave, the thirty shock troopers were swept off their feet like dry leaves.

Ignis and Cilia swept forward, neutralizing the disoriented vanguard in seconds. In a single decisive exchange, the empire's elite heavy infantry was utterly dismantled.

Leaving the broken weapons in their wake, the companions inspected the rear portal. Beyond lay a forgotten aqueduct leading directly into the vaults beneath the grand cathedral of the imperial capital.

Clasping his reinforced shield, Kadan spoke with immovable resolve.

"Our preparations are complete. Through these waterways, we march into the heart of the empire."

Cilia gripped her staff with quiet fury.

"In the cathedral above, Lucian is preparing a coerced wedding to consolidate his tyrannical usurpation. We shall expose his treachery before the eyes of the entire realm."

Ignis clenched his fists, holy fire burning in his gaze.

"I will personally dismantle the empire's hypocrisy. Forward, my brothers!"

Adorned in ancestral relics and bound by sacred oaths, the three companions charged into the subterranean waterway, sounding the overture that would tear open the continent's darkest night."""

EP25_EN = """SNSHero Novel
Episode 25: The False Wedding

Soaring high above the imperial metropolis of Lighthaven, the Grand Cathedral of White Marble appeared cloaked in dazzling festive grandeur. From every vaulted spire fluttered crimson silk tapestries bearing the imperial crest, while within the nave, thousands of gilded candelabras cast shimmering radiance across the polished marble flags. Yet beneath this extravagant facade lay an atmosphere of suffocating dread. Stationed in every shadowed alcove stood imperial shock guards and black-robed inquisitors, eyeing the gathered aristocracy with predatory vigilance.

The ceremony was a grotesque political farce manufactured by High Minister Lucian. By coercing a forced union between his puppet cousin and the captured elven noblewoman, Lady Sylvia, Lucian intended to legitimize his usurpation of the eastern seaboard and the Whispering Wind alliance.

Slipping through the throng of commoners outside the cathedral doors were two figures robed in rustic northern minstrel tunics: Kadan, his brow concealed beneath a thick fur cowl, and Cilia, veiled in fine northern silk.

Whispering beneath her veil, Cilia noted with sharp eyes.

"Upon Lady Sylvia's wrists are mana shackles inscribed with Medusa Gorgo's puppet curse. They paralyze the spirit, forcing her hands to sign the blood covenant against her will."

Kadan touched the contours of the Dragon Breaker shield beneath his mantle.

"Ignis has infiltrated the belfry to sever the alarm ropes. The instant the ceremony reaches its peak and Lucian's guard slackens, we strike the high altar."

A thunderous overture from the great pipe organ filled the vaulted cathedral as the false wedding commenced. Draped in opulent scarlet clerical vestments and bearing the archiepiscopal staff, Minister Lucian strode onto the high pulpit, an arrogant sneer curling his lips.

"Citizens of the empire! Today, through this sacred bond, all embers of northern sedition are extinguished forever! Let Lady Sylvia sign the blood covenant in humble obedience to the throne!"

Inquisitors seized Sylvia's hands, forcing a poisoned quill into her trembling fingers while silent tears tracked down her pale cheeks.

In that fatal heartbeat, the massive stained-glass rose window high above shattered into a shower of crystalline shards. Having disabled the alarms, Ignis descended upon a severed bell rope, unleashing a barrage of immaculate white firebolts directly into the pulpit.

Boom!

The pulpit exploded into kindling, setting Lucian's vestments ablaze as screams of panic consumed the nave.

Landing gracefully upon the altar rail, Ignis unleashed a lion's roar.

"Deceive the realm no longer with your cowardly lies, butcher Lucian! The true fire of the White Flame Order has arrived to deliver your judgment!"

Clutching his smoldering robes, Lucian shrieked in terror.

"Traitorous dogs! Guards, cut them down! Drown this altar in northern blood!"

As dozens of heavy cataphracts surged toward the dais with drawn broadswords, Kadan cast aside his minstrel disguise, striding forward as the golden cross of the Dragon Breaker shield blazed to life.

Slamming his shield against the marble steps, Kadan anchored his stance.

Boom!

An earthquake of kinetic force buckled the flagstones, blasting the charging cataphracts headlong into the air. Shielding Lady Sylvia behind his immovable frame, Kadan deflected a barrage of throwing spears into the vaulted ceiling.

"Not a single foot shall touch this innocent soul!"

Simultaneously, Cilia swept her Jade Staff, conjuring razor winds that neatly severed the puppet shackles binding Sylvia's wrists with a metallic chime.

Tears spilling down her cheeks, Sylvia looked upon her deliverers in awe.

"Knights of the Light... Princess Cilia... You have come for me..."

The cathedral erupted into a battleground of truth against tyranny. Witnessing the ancient cross of the Holy Order and Ignis's sanctifying flames, the gathered citizens and lesser nobles stirred in turbulent realization.

"That crest... The Arcane Holy Knights have returned!"

"Commander Ignis fights against the court's assassins!"

Terrified by the rising tide of public revolt, Lucian fled toward the private iron sally port behind the altar under heavy escort.

Lucian shrieked over his shoulder into the gloom.

"Artus! Tear those miserable vermin limb from limb!"

From the subterranean crypts beneath the altar radiated the freezing chill of death as a colossal figure clad in cracked obsidian plate emerged: Death Knight Artus. His crimson visor flared with baleful malice, brandishing his broken runic greatsword.

Stepping forward, Kadan braced the Dragon Breaker shield against the undead champion.

"Abandoned by the tyrant you serve like a discarded puppet. But this shield shall never yield before your defiled blade!"

Artus's obsidian blade crashed against Kadan's guard with cataclysmic fury, yet the reinforced dragonbone armor absorbed the death magic without flinching, hurling the death knight backward with concussive force. Ignis unleashed a torrent of holy fire, scorching Artus's pauldrons and forcing the fiend to retreat into the shadows, bolting the iron gate behind him.

Though Lucian had fled into the inner citadel, the cathedral was liberated. Weeping in gratitude, citizens and nobles surrounded the three heroes with thunderous cheers. The false wedding was smashed, and the empire's crimes were laid bare before the realm.

Ascending the altar steps, Cilia raised her Jade Staff before the multitude.

"People of the capital! Kneel no longer before Lucian's falsehoods and terror! Rise with us to reclaim true peace and honor for this continent!"

A roar of thousands echoed through the rafters, shaking the citadel to its foundations.

Kadan clasped Ignis's forearm, their eyes fixed upon the inner palace gates.

"Only one door remains. Let us march into the inner court and end this darkness forever."

The final avenue of liberation lay wide open before them."""

print("Writing scripts/novel_data/arc3_batch4.py...")
with open("scripts/novel_data/arc3_batch4.py", "w", encoding="utf-8") as f:
    f.write(f'''# -*- coding: utf-8 -*-
"""
scripts/novel_data/arc3_batch4.py
Episodes 21, 22, 23, 24, 25
Authentic commercial fantasy literature, 3,750 - 4,200 chars, 12 - 16 dialogues.
"""

EP21_KO = """{eb4.EP21_KO}"""
EP21_EN = """{eb4.EP21_EN}"""

EP22_KO = """{eb4.EP22_KO}"""
EP22_EN = """{eb4.EP22_EN}"""

EP23_KO = """{eb4.EP23_KO}"""
EP23_EN = """{EP23_EN}"""

EP24_KO = """{eb4.EP24_KO}"""
EP24_EN = """{EP24_EN}"""

EP25_KO = """{eb4.EP25_KO}"""
EP25_EN = """{EP25_EN}"""
''')

print("Batch 4 successfully written to scripts/novel_data/arc3_batch4.py!")

