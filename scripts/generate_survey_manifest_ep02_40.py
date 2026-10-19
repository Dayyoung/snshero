import json
import re
from pathlib import Path

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"
MOVIE_MAPPING_PATH = PROJECT_ROOT / "src/content/movieEpisodeMapping.ts"

with open(MANIFEST_PATH) as f:
    webtoon_manifest = json.load(f)

with open(MOVIE_MAPPING_PATH) as f:
    movie_text = f.read()

movie_meta = {}
for m in re.finditer(r'(\d+):\s*\{\s*episodeNumber:\s*(\d+),\s*titleKo:\s*\"([^\"]+)\",\s*titleJa:[^,]+,\s*titleEn:\s*\"([^\"]+)\",.*?arc:\s*\"([^\"]+)\",\s*arcEn:\s*\"([^\"]+)\",\s*synopsisKo:\s*\"([^\"]+)\",\s*synopsisEn:\s*\"([^\"]+)\",', movie_text, re.DOTALL):
    ep = int(m.group(1))
    movie_meta[ep] = {
        'ep': ep,
        'titleKo': m.group(3),
        'titleEn': m.group(4),
        'arc': m.group(5),
        'arcEn': m.group(6),
        'synopsisKo': m.group(7),
        'synopsisEn': m.group(8),
    }

CHAR_DB = {
    'Aeolus': {'id': 25, 'nameKo': '에올루스', 'element': 'air', 'costume': 'Emerald and gold aeromancer vestments', 'weapon': 'Swirling gale vortex', 'hair': 'Wild teal windblown hair', 'palette': 'Cyan, emerald green, gold', 'props': 'Wind crest rune'},
    'Aila': {'id': 70, 'nameKo': '에일라', 'element': 'elf', 'costume': 'Dark lavender and gold shadow silk robes', 'weapon': 'Dual dark cosmic vortex orbs and wrist crossbow', 'hair': 'Long flowing violet-black hair with golden wing ornaments', 'palette': 'Deep purple, gold, shadow black', 'props': 'Shadow seal scroll'},
    'Aleksandar': {'id': 50, 'nameKo': '알렉산다르', 'element': 'human', 'costume': 'Ornate gold plate armor with royal blue velvet cape', 'weapon': 'Glowing blue-purple rune greatsword', 'hair': 'Short noble dark brown hair and golden crown with sapphires', 'palette': 'Royal gold, deep navy blue, sapphire', 'props': 'Golden crown, royal signet ring'},
    'Balbo': {'id': 71, 'nameKo': '발보', 'element': 'dwarf', 'costume': 'Heavy furnace-forged bronze and iron plate armor', 'weapon': 'Heavy dwarven mining mattock and forge hammer', 'hair': 'Auburn beard braided with gold rings', 'palette': 'Bronze, iron grey, molten orange', 'props': 'Anvil pendant, bellows'},
    'Balian': {'id': 43, 'nameKo': '발리안', 'element': 'human', 'costume': 'White and gold cross knight plate armor with scarlet cape', 'weapon': 'Masterwork silver broadsword and large golden-cross shield', 'hair': 'Silver winged helm with gold trim over dark blonde hair', 'palette': 'Silver, gold, crimson red, pure white', 'props': 'Holy Knight emblem, prayer phylactery'},
    'Barghest': {'id': 87, 'nameKo': '바르가스트', 'element': 'monster', 'costume': 'Shadow pelt with spirit-wisp shroud', 'weapon': 'Ghostly spirit fangs and shadow claws', 'hair': 'Dark midnight-blue fur wreathed in cyan spirit fire', 'palette': 'Midnight blue, spectral cyan, obsidian', 'props': 'Broken iron collar'},
    'Belphegor': {'id': 13, 'nameKo': '벨페고르', 'element': 'fire', 'costume': 'Molten obsidian chest carapace and spiked iron girdles', 'weapon': 'Colossal blazing hellfire battleaxe', 'hair': 'Curved massive black ram horns, scarlet skin', 'palette': 'Infernal scarlet, obsidian black, burning orange', 'props': 'Hellfire brand'},
    'Celia': {'id': 62, 'nameKo': '실리아', 'element': 'elf', 'costume': 'Flowing leaf-green and petal-white elven silk dress', 'weapon': 'Carved silver vine staff crowned with cherry blossoms', 'hair': 'Vibrant bright emerald hair with pink flower ornament', 'palette': 'Emerald green, blossom pink, silver', 'props': 'Seed pouch, healing nectar vial'},
    'Death Knight Artus': {'id': 60, 'nameKo': '데스나이트 아르투스', 'element': 'undead', 'costume': 'Spiked dark steel plate armor draped in ragged burial shrouds', 'weapon': 'Massive notched greatsword wreathed in pale cyan soulfire', 'hair': 'Towering horned skull helm with piercing white eye-flames', 'palette': 'Obsidian steel, bone white, ghostly cyan', 'props': 'Forged royal treason warrant, blackened skull chalice'},
    'Eliana': {'id': 63, 'nameKo': '엘리아나', 'element': 'elf', 'costume': 'Pastel blossom-pink gown layered with flower petal lace', 'weapon': 'Floral ward scepter', 'hair': 'Soft curled blonde hair with rose-gold tiara', 'palette': 'Petal pink, soft gold, cream white', 'props': 'Herb salve satchel, dried lotus amulet'},
    'Elwin': {'id': 42, 'nameKo': '엘윈', 'element': 'human', 'costume': 'Silver valkyrie breastplate, blue tunic, and red-and-blue half-cape', 'weapon': 'Gold-hilted steel broadsword and round buckler', 'hair': 'Long golden-blonde hair tied in a warrior braid', 'palette': 'Steel silver, royal azure, scarlet, gold', 'props': 'Golden wheat pouch, leather canteen'},
    'Fenrir': {'id': 81, 'nameKo': '펜릴', 'element': 'monster', 'costume': 'Arctic wolf harness with silver fur trim', 'weapon': 'Glacial frost claws and razor maw', 'hair': 'Bristling thick silver-white and ice-blue dire fur', 'palette': 'Glacier white, ice blue, silver', 'props': 'Frostfang tooth pendant'},
    'Gawain': {'id': 45, 'nameKo': '가웨인', 'element': 'human', 'costume': 'Gilded silver knight plate armor with solar sunburst engravings', 'weapon': 'Colossal two-handed grand silver greatsword', 'hair': 'Sunlight-blonde wavy hair, noble clean-shaven face', 'palette': 'Gleaming silver, radiant gold, solar amber', 'props': 'Solar oath parchment'},
    'Gilgamesh': {'id': 47, 'nameKo': '길가메시', 'element': 'human', 'costume': 'Crimson and ornate gold royal breastplate with lion pauldrons', 'weapon': 'Twin blazing golden flame scimitars', 'hair': 'Spiky flame-red hair held by a golden circlet', 'palette': 'Imperial gold, ruby crimson, flame yellow', 'props': 'Ancient royal treasury key'},
    'Griffon': {'id': 84, 'nameKo': '그리폰', 'element': 'monster', 'costume': 'Ornate leather harness with bronze studs', 'weapon': 'Sharp curved golden beak and steel talons', 'hair': 'Golden-feathered raptor head and sleek tawny lion pelt', 'palette': 'Tawny gold, feather brown, bronze', 'props': 'Feathered courier pouch'},
    'Grimli': {'id': 74, 'nameKo': '그림리', 'element': 'dwarf', 'costume': 'Heavy dwarven iron-ring mail and thick boiled leather cuirass', 'weapon': 'Double-headed war hammer with chiming silver bell', 'hair': 'Thick braided copper-red beard and bushy brows', 'palette': 'Copper red, cast iron, deep umber', 'props': 'Chiming silver bell, whetstone'},
    'Hercul': {'id': 49, 'nameKo': '헤르쿨', 'element': 'human', 'costume': 'Weathered battle-scarred leather harness and wolf-fur mantle', 'weapon': 'Blazing yellow-flame curved scimitar', 'hair': 'Wild lion-mane brown hair and thick scarred beard', 'palette': 'Earthy brown, amber flame, wolf grey', 'props': 'Cracked Holy Knight seal, twin silver daggers'},
    'Ignis': {'id': 11, 'nameKo': '이그니스', 'element': 'fire', 'costume': 'Reinforced charcoal battle tunic with red fire-silk lining', 'weapon': 'Blazing runic gauntlets trailing vortex embers', 'hair': 'Spiky bright flame-orange hair and pointed ears', 'palette': 'Blaze orange, charcoal black, ember red', 'props': 'Star-breathing mana focus crystal'},
    'Kadan': {'id': 41, 'nameKo': '카단', 'element': 'human', 'costume': 'Rugged dark-blue travel leathers, steel vambraces, and iconic crimson scarf', 'weapon': 'Gleaming twin silver daggers glowing with blue celestial runes', 'hair': 'Spiky chestnut-brown hair and determined hazel eyes', 'palette': 'Crimson red, deep travel navy, weathered leather, silver', 'props': 'Crimson scarf, silver rune dagger, Star-Breathing seal'},
    'Kaze': {'id': 44, 'nameKo': '카제', 'element': 'human', 'costume': 'Form-fitting dark charcoal shinobi garb with leather armor plates', 'weapon': 'Dual concealed throwing daggers and smoke canisters', 'hair': 'Dark purple hair tied back, black lower-face cloth mask', 'palette': 'Shadow black, muted purple, steel grey', 'props': 'Shadow cipher scroll, grappling cord'},
    'Leonar': {'id': 86, 'nameKo': '레오나르', 'element': 'monster', 'costume': 'High paladin silver plate barding adorned with sapphire crests', 'weapon': 'Frost-rimmed ceremonial claymore', 'hair': 'Pure white lion mane embedded with shimmering frost crystals', 'palette': 'Snow white, sapphire blue, polished silver', 'props': 'Pride-crest medallion'},
    'Lucian': {'id': 61, 'nameKo': '루시안', 'element': 'elf', 'costume': 'Dark forest-green ranger tunic with leaf-weave shoulder guards', 'weapon': 'Yew recurve composite bow with glowing emerald wind arrows', 'hair': 'Long silky emerald-green hair and pointed elf ears', 'palette': 'Deep forest green, moss brown, emerald neon', 'props': 'Forged royal cipher, falconer glove'},
    'Magitech Golem': {'id': 99, 'nameKo': '마기테크 골렘', 'element': 'robot', 'costume': 'Chiseled dark-slate monolith frame with brass hydraulic pistons', 'weapon': 'Massive stone-crushing pneumatic fist and beam emitter', 'hair': 'Faceless rune-carved visage with glowing purple visor slit', 'palette': 'Dark slate, brass gold, pulsating violet', 'props': 'Rune core power cell'},
    'Malfuon': {'id': 66, 'nameKo': '말퓨온', 'element': 'elf', 'costume': 'Ancient emerald archmage robes with constellation starlight embroidery', 'weapon': 'Living ironwood staff with hovering azure mana orb', 'hair': 'Flowing sea-teal hair and wise silver eyebrows', 'palette': 'Deep jade, starlight silver, ocean teal', 'props': 'Constellation astrolabe, ancient star codex'},
    'Medusa Gorgo': {'id': 89, 'nameKo': '메두사 고르고', 'element': 'monster', 'costume': 'Gilded serpent jewelry and dark green scaled corslet', 'weapon': 'Petrifying gaze and poison-tipped bone javelins', 'hair': 'Crown of writhing living emerald vipers with glowing amber eyes', 'palette': 'Venom green, antique brass, viper yellow', 'props': 'Stone-gaze mirror, venom vial'},
    'Pegasus': {'id': 90, 'nameKo': '페가수스', 'element': 'monster', 'costume': 'Silver ceremonial headstall and royal purple saddle blanket', 'weapon': 'Gale-force wing buffets and divine hooves', 'hair': 'Pristine white coat with flowing lavender-tinted mane and tail', 'palette': 'Pearlescent white, lavender, sky silver', 'props': 'Silver wing spurs'},
    'Robinyard': {'id': 48, 'nameKo': '로비냐드', 'element': 'human', 'costume': 'Deep forest-green leather jerkin with scarlet-lined hood', 'weapon': 'Mastercrafted recurve longbow and silver-tipped bodkin arrows', 'hair': 'Auburn hair tucked under a crimson feathered hood', 'palette': 'Hunter green, autumn crimson, dark fawn', 'props': 'Acrobat grapple hook, silver bell'},
    'Rondol': {'id': 46, 'nameKo': '론돌', 'element': 'human', 'costume': 'Enclosed blue-plumed barbute helm, midnight-blue steel plate armor', 'weapon': 'Runic broadsword and heavy tower shield bearing lion crest', 'hair': 'Hidden beneath enclosed visor, piercing steel-blue gaze', 'palette': 'Midnight blue, blackened steel, burnished gold', 'props': 'Lion vanguard banner'},
    'Sylphid': {'id': 23, 'nameKo': '실피드', 'element': 'air', 'costume': 'Gossamer dandelion-silk tunic woven with dew pearls', 'weapon': 'Swirling miniature zephyr cyclone', 'hair': 'Spiraling mint-green pixie locks and dragonfly wings', 'palette': 'Mint green, pale cyan, sparkling pearl', 'props': 'Zephyr flute'},
    'Titania': {'id': 64, 'nameKo': '티타니아', 'element': 'elf', 'costume': 'Ethereal translucent gossamer gown woven of starlight and morning mist', 'weapon': 'Scepter of blooming summer boughs', 'hair': 'Luminescent spun-gold hair crowned with living lotus blossoms', 'palette': 'Dawn gold, mist white, lotus pink', 'props': 'Fairy dust vial, summer queen ring'},
    'Ursoc': {'id': 88, 'nameKo': '우르삭', 'element': 'monster', 'costume': 'Heavy banded iron pauldrons across massive shoulders', 'weapon': 'Crushing earthshaker paws and serrated claws', 'hair': 'Thick golden-brown grizzly fur matted with mountain soil', 'palette': 'Grizzly brown, ochre gold, rusted iron', 'props': 'Mountain pine totem'},
    'Walker': {'id': 51, 'nameKo': '워커', 'element': 'undead', 'costume': 'Rusted chainmail hauberk and shredded battle tabard', 'weapon': 'Notched iron bastard sword and bone-rimmed round shield', 'hair': 'Bleached skull crowned with flickering violet soul-embers', 'palette': 'Bone white, rusted iron, necromantic violet', 'props': 'Ancient burial coin'},
    'Ysela': {'id': 107, 'nameKo': '이셀라', 'element': 'dragon', 'costume': 'Flowing midnight-blue silk traveling robes with starlight embroidery', 'weapon': 'Hidden celestial starlight daggers and dragon barrier magic', 'hair': 'Long shimmering violet-lavender hair with silver star pins', 'palette': 'Deep starlight violet, celestial indigo, silver', 'props': 'Dragon-crest pendant, sealed royal birth-scroll'}
}

print("Loaded character specifications successfully.")
