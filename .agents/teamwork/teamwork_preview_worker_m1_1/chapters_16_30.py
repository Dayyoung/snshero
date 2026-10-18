# Chapters 16 to 30 definitions
from chapters_1_15 import make_choice

CHAPTERS_16_30 = [
    # 16
    (16, [
        {"speaker": "narrator", "name": "제 16화: 폐허 앞의 형제", "nameEn": "Episode 16: Brothers Before the Ruins", "text": "풍차 언덕 북문 폐허. 섭정 아르투스의 중장갑 근위대가 도성을 탈출하려는 일행을 포위했고, 발리안은 성기사단의 마지막 창을 고쳐 잡았다.", "textEn": "Ruins of the Windmill Ridge northern gate. Regent Artus's armored vanguard surrounded the escaping party, and Paladin Balian raised his final Arcane spear."},
        {"speaker": "speaker", "name": "발리안", "nameEn": "Balian", "cardId": 43, "text": "“이그니스, 카단! 뒤돌아보지 말고 달려라! 내가 이 풍차 언덕의 좁은 길목을 틀어막겠다!”", "textEn": "“Ignis, Kadan! Run and do not look back! I will hold this narrow defile alone!”"},
        {"speaker": "speaker", "name": "황자 이그니스", "nameEn": "Prince Ignis", "cardId": 11, "text": "“아버지! 겨우 다시 만났는데 또 홀로 남겨두고 갈 수는 없습니다! 함께 싸우겠습니다!”", "textEn": "“Father! We have only just found each other, I cannot abandon you again! I will fight by your side!”"},
        {"speaker": "speaker", "name": "루시안", "nameEn": "Lucian", "cardId": 61, "text": "“크크크, 늙은 성기사와 배신자 황자를 한자리에서 매장해 주마! 전군 돌격하라!”", "textEn": "“Hehehe, bury the old paladin and the turncoat prince in the same trench! All units, charge!”"},
        {
            "speaker": "choice", "name": "풍차 언덕의 마지막 저항", "nameEn": "Last Stand on Windmill Ridge", "cardId": 41,
            "text": "적의 철갑 기병들이 언덕을 메우고 창날이 번뜩인다. 카단과 이그니스는 서로의 눈을 바라보며 형제의 결단을 내린다.",
            "textEn": "Ironclad lancers flooded the ridge. Looking into each other's eyes, Kadan and Ignis made their fraternal stand.",
            "choices": [
                make_choice("ch16_choice_1", "[결의/돌파]", "[Resolve]", "숙부님을 혼자 둘 수 없습니다! 함께 싸우겠습니다!", "We cannot leave Uncle alone! We stand and fight together!", "“창과 방패, 백색 화염이 합쳐져 풍차 언덕 위에 거대한 불멸의 방진을 쳤다.”", "“Spear, shield, and white flame combined into an immortal bulwark on the ridge.”", "buff", 30, "[아케인 창의 맹세] 파워 +30%", "[Oath of the Spear] +30% Power", True),
                make_choice("ch16_choice_2", "[신중/통찰]", "[Insight]", "숙부님의 희생을 헛되이 하지 않으려면 살아남아야 한다.", "To honor his sacrifice, we must survive and carry the truth forward.", "“눈물을 삼키며 피난민들과 함께 북부 산악로 탈출로를 확보했다.”", "“Swallowing tears, they safely escorted the refugees into northern mountain trails.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch16_choice_3", "[성진호흡/공명]", "[Resonance]", "두 아버지의 서약은 우리 가슴속에서 영원히 타오를 것이다.", "The vow of our two fathers will burn eternal within our hearts.", "“발리안의 창끝에서 방출된 마지막 온기가 두 청년의 가슴에 불멸의 룬으로 깃들었다.”", "“The final warmth radiating from Balian's spear sealed an eternal rune in both sons.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "연기와 눈물", "nameEn": "Smoke and Tears", "text": "풍차는 불길에 휩싸여 무너졌으나, 언덕 위에 우뚝 솟은 두 청년의 그림자는 새벽빛을 받아 길게 뻗어나갔다.", "textEn": "The burning windmill crumbled into embers, but the silhouettes of the two youths stretched far into the dawn."}
    ]),

    # 17
    (17, [
        {"speaker": "narrator", "name": "제 17화: 바람섬의 초대장", "nameEn": "Episode 17: Invitation to the Wind Isle", "text": "섀도우 팰리스 해안 항구. 먹구름이 바다를 삼키려는 가운데, 하늘의 전령 그리폰이 은빛 인장이 찍힌 바람섬의 비밀 초대장을 전해왔다.", "textEn": "The coastal harbor of Shadow Palace. Beneath gathering stormclouds, a celestial messenger delivered a sealed invitation to the mythical Wind Isle."},
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“카단, 이건 바람섬의 여왕 실피드의 친필 룬 서한이야! 나인섀도우 코덱스의 마지막 봉인을 풀 유일한 열쇠가 그 섬에 있어!”", "textEn": "“Kadan, this is Queen Sylphid's personal rune decree! The final seal of the Nine-Shadow Codex rests on that isle!”"},
        {"speaker": "speaker", "name": "론돌", "nameEn": "Rondol", "cardId": 46, "text": "“하지만 부두 앞에 폭풍 바다용 와이번들이 둥지를 틀었다! 닻을 올리자마자 습격당할 거야!”", "textEn": "“Yet storm sea wyverns have blockaded the docks! The moment we weigh anchor, they will swarm us!”"},
        {
            "speaker": "choice", "name": "폭풍우를 향한 출항", "nameEn": "Setting Sail into the Squall", "cardId": 41,
            "text": "바다에서 거대한 회오리가 일고 익룡들이 돛대를 부수려 날아든다. 카단은 선수에 서서 방패를 들어 올린다.",
            "textEn": "Waterspouts rose as sea wyverns dived to splinter the masts. Kadan stood at the prow, raising his buckler.",
            "choices": [
                make_choice("ch17_choice_1", "[결의/돌파]", "[Resolve]", "풍랑이 거칠수록 닻을 올리고 폭풍 속으로 나아간다!", "The rougher the tempest, the higher we hoist our sails into the storm!", "“거친 파도를 방패의 아케인 빛으로 가르며 돛대가 순풍을 타고 질주했다.”", "“Parting towering waves with shield-light, the sails caught celestial winds.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points", True),
                make_choice("ch17_choice_2", "[신중/통찰]", "[Insight]", "바람의 각도를 계산해 돛대를 조정하자.", "Calculate the wind vectors and trim the sails accordingly.", "“암초 지대의 파도 결을 정확히 읽어내어 와이번들의 급강하 공격을 따돌렸다.”", "“Threading reef currents cleanly outmaneuvered the wyverns' diving attacks.”", "buff", 20, "[순풍 가속] 스피드 상승", "[Tailwind Surge] Speed & Evasion Up"),
                make_choice("ch17_choice_3", "[성진호흡/공명]", "[Resonance]", "바다의 호흡과 교감하여 거친 파도를 다스린다.", "Commune with the sea's ancient pulse to calm the wild swells.", "“성진호흡의 마나가 바다에 퍼지자 거센 파도가 잔잔한 수로를 열어주었다.”", "“Arcane resonance quieted the raging surges, opening a safe canal through the sea.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "미지의 바다로", "nameEn": "Into the Uncharted Waters", "text": "항구를 벗어난 배는 은빛 궤적을 그리며 전설의 바람섬을 향해 나아갔다.", "textEn": "Clearing the harbor, the ship carved a silver wake toward the legendary Wind Isle."}
    ]),

    # 18
    (18, [
        {"speaker": "narrator", "name": "제 18화: 검은 성전의 비밀", "nameEn": "Episode 18: Secret of the Black Sanctum", "text": "바다 밑에 가라앉았던 고대 침몰 사원 '검은 성전'. 금지된 서고 서판들 사이에 섭정 아르투스가 심연의 마신과 맺은 피의 계약서가 잠들어 있었다.", "textEn": "The sunken subterranean temple of the Black Sanctum. Amidst forbidden archives slept the blood covenant between Regent Artus and Abyssal demons."},
        {"speaker": "speaker", "name": "은둔자 간다르", "nameEn": "Gandar the Hermit", "cardId": 69, "text": "“수백 년 동안 이 사원의 비밀을 지켜왔다. 아르투스는 왕실을 수호한 것이 아니라, 제국 전체를 마신의 제물로 바치려 하고 있어!”", "textEn": "“For centuries I guarded these archives. Artus never guarded the crown—he pledged the entire realm as a blood offering!”"},
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“사원의 석상 골렘들이 깨어나고 있어! 이 서판을 가지고 빠져나가야 해!”", "textEn": "“The temple stone guardians are waking! We must secure these tablets and escape!”"},
        {
            "speaker": "choice", "name": "금단의 기록 회수", "nameEn": "Securing Forbidden Records", "cardId": 41,
            "text": "사원 천장이 무너져 내리고 거대 골렘들의 눈에 붉은 마기가 켜진다. 카단은 서판을 지키기 위해 몸을 던진다.",
            "textEn": "The ceiling cracked as ancient golem archons flared with crimson malice. Kadan threw himself forward.",
            "choices": [
                make_choice("ch18_choice_1", "[결의/돌파]", "[Resolve]", "어둠의 서판을 부수고 진실의 기록만을 취하겠다!", "Shatter the dark wards and claim only the record of truth!", "“방패의 일격으로 사악한 결계석을 박살 내고 핵심 밀서를 회수했다.”", "“A decisive shield slam pulverized the evil seal stone, retrieving the core evidence.”", "sns", 20, "+20 SNS 획득", "+20 SNS Points", True),
                make_choice("ch18_choice_2", "[신중/통찰]", "[Insight]", "고대 룬어의 문맥을 정확히 해독해야 함정을 피한다.", "Decipher the ancient syntax carefully to bypass the pressure traps.", "“바닥의 마법 함정을 안전하게 해제하여 희생 없이 사원을 탈출했다.”", "“Disarming floor pressure runes allowed everyone to traverse the sanctum unscathed.”", "buff", 20, "[룬 해독 통찰] 트랩 무효화", "[Runic Insight] Trap Immunity"),
                make_choice("ch18_choice_3", "[성진호흡/공명]", "[Resonance]", "간다르의 옛 지혜와 감응하여 사원의 결계를 해제한다.", "Resonate with Gandar's primordial wisdom to dissolve the temple seals.", "“사원 기둥마다 잠들어 있던 고대 영혼들이 카단의 빛을 보고 길을 열어주었다.”", "“Dormant spirits within the columns recognized Kadan's pure aura and bowed.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "밝혀진 음모", "nameEn": "The Conspiracy Unveiled", "text": "회수된 피의 계약서에는 섭정 아르투스의 서명과 열한 개 종족의 멸망 계획이 선명히 적혀 있었다.", "textEn": "The blood covenant bore Artus's wax seal, outlining the calculated doom of all eleven Arcane races."}
    ]),

    # 19
    (19, [
        {"speaker": "narrator", "name": "제 19화: 세 가지 시험", "nameEn": "Episode 19: Three Trials", "text": "바람섬 중앙 나인섀도우 성소. 나인섀도우 코덱스를 전수받기 위해, 대현자 에올루스가 주재하는 용기, 지혜, 자비의 3대 시험이 시작되었다.", "textEn": "The Nine-Shadow Sanctuary at the heart of Wind Isle. Archsage Aeolus initiated the three trials of Courage, Wisdom, and Compassion."},
        {"speaker": "speaker", "name": "에올루스", "nameEn": "Aeolus", "cardId": 25, "text": "“성기사의 후예여, 살기를 품지 않은 방패로 이 허상의 칼바람을 버텨낼 수 있겠느냐? 분노는 검을 무디게 만들 뿐이다.”", "textEn": "“Heir of paladins, can a shield unburdened by bloodlust withstand this tempest? Wrath only blunts the edge.”"},
        {"speaker": "speaker", "name": "가웨인", "nameEn": "Gawain", "cardId": 45, "text": "“카단, 환영의 미궁이다! 거울 벽에 비친 것은 네 마음속 두려움이다!”", "textEn": "“Kadan, beware the mirror labyrinth! The reflections represent the fears within your heart!”"},
        {
            "speaker": "choice", "name": "시련의 정점", "nameEn": "Pinnacle of Trials", "cardId": 41,
            "text": "거울 속에서 아버지 알렉산다르의 부러진 검과 마신의 형상이 겹쳐 보인다. 카단은 평정심을 유지하며 방패를 세운다.",
            "textEn": "In the mirror, Aleksandar's shattered blade overlapped with demonic shades. Kadan stood poised.",
            "choices": [
                make_choice("ch19_choice_1", "[결의/돌파]", "[Resolve]", "가장 거센 바람이라도 내 의지를 꺾을 수 없다!", "Not even the fiercest gale can shatter my unbending resolve!", "“폭풍의 눈 한가운데를 방패로 뚫고 나아가 용기의 시험을 통과했다.”", "“Piercing through the tempest eye on foot conquered the trial of Courage.”", "buff", 20, "[시련 통과 위압] 공격력 +20%", "[Trial Overcome] +20% ATK", True),
                make_choice("ch19_choice_2", "[신중/통찰]", "[Insight]", "미궁의 반사벽을 이용해 바람의 역류를 짚어낸다.", "Utilize reflective walls to map the wind's reverse vortices.", "“거울의 굴절 각도를 파악해 숨겨진 출구 룬을 정확히 찾아냈다.”", "“Calculating the reflection angles led directly to the hidden exit rune.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch19_choice_3", "[성진호흡/공명]", "[Resonance]", "시험관의 영혼을 상하게 하지 않고 마나만 부드럽게 흘린다.", "Harm not the examiners' spirits; divert their mana gently.", "“자비의 시험에서 검을 거두자 시험관들이 미소 지으며 코덱스를 건넸다.”", "“Sheathing his blade in the trial of Compassion earned the judges' profound blessing.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "코덱스의 전수", "nameEn": "Inheriting the Codex", "text": "“용기 위에 지혜를 더하고, 힘 위에 자비를 얹었으니, 그대는 진정한 코덱스의 계승자다.”", "textEn": "“You tempered courage with wisdom and crowned power with compassion. You are the true heir.”"}
    ]),

    # 20
    (20, [
        {"speaker": "narrator", "name": "제 20화: 꽃배를 삼킨 파도", "nameEn": "Episode 20: The Wave That Swallowed the Flower Ship", "text": "바람섬 외해를 순항하던 화려한 외교선 '꽃배'. 심연의 거대 잠수함이 소환한 인공 해일이 덮쳐오며 선체가 산산조각 날 위기에 처했다.", "textEn": "Aboard the diplomatic flower yacht offshore. An artificial rogue tidal wave conjured by abyssal dreadnoughts bore down upon the vessel."},
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“거대 해일이야! 꽃배의 돛대가 부러지고 있어! 갑판으로 마수들이 기어오른다!”", "textEn": "“A monstrous rogue wave! The masts are snapping! Abyssal boarders are swarming the deck!”"},
        {"speaker": "speaker", "name": "은둔자 간다르", "nameEn": "Gandar the Hermit", "cardId": 69, "text": "“심연의 어둠 마법사들이 바다 밑에서 해류를 뒤틀고 있다! 배가 전복되면 모두 끝장이야!”", "textEn": "“Abyssal sorcerers are twisting currents from below! If the hull overturns, we are all lost!”"},
        {
            "speaker": "choice", "name": "해일 앞의 방패", "nameEn": "Shield Before the Wave", "cardId": 41,
            "text": "수십 길 높이의 검은 파도가 배를 집어삼키려 한다. 카단은 선수에 방패를 박아 넣으며 일행을 지킨다.",
            "textEn": "A fifty-foot black wall of water threatened to engulf the ship. Kadan wedged his shield into the prow.",
            "choices": [
                make_choice("ch20_choice_1", "[결의/돌파]", "[Resolve]", "선수 갑판에 방패를 박아 침몰을 막아내겠다!", "Anchor the shield into the prow deck to stop the capsizing!", "“방패가 배의 중심을 굳건히 잡으며 덮쳐온 파도를 양 갈래로 갈라놓았다.”", "“Anchoring the shield held the yacht's center, cleaving the cresting wave in two.”", "buff", 20, "[강철 고정] 방어벽 지속", "[Iron Anchor] Persistent Defense", True),
                make_choice("ch20_choice_2", "[신중/통찰]", "[Insight]", "물길 유입구를 차단하고 비상 구명정을 확보하자.", "Seal bilge intake hatches and prepare the emergency skiffs.", "“신속하게 침수 구획을 봉쇄하여 선체의 부력을 유지해 냈다.”", "“Sealing flood compartments preserved hull buoyancy just in the nick of time.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch20_choice_3", "[성진호흡/공명]", "[Resonance]", "바람을 일으켜 꽃배의 선체를 수면 위로 띄운다.", "Summon Arcane upsurges to lift the flower ship above the swell.", "“빛나는 상승기류가 선체를 감싸 안으며 꽃배를 파도 너머로 가볍게 띄웠다.”", "“A radiant updraft cradled the vessel, lifting it cleanly over the foaming crest.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "폭풍 속의 생환", "nameEn": "Survival in the Gale", "text": "해일은 지나갔으나 배는 부서져 외딴 암초 섬을 향해 표류하기 시작했다.", "textEn": "The tidal wave passed, but the battered vessel drifted toward an uncharted volcanic reef."}
    ]),

    # 21
    (21, [
        {"speaker": "narrator", "name": "제 21화: 불타는 배의 배신", "nameEn": "Episode 21: Betrayal Aboard the Burning Ship", "text": "한밤중 불타오르는 기함의 갑판. 루시안 총독이 이끄는 잠입 부대가 화약고를 폭파하며 본색을 드러내었다.", "textEn": "The burning deck of the flagship at midnight. Governor Lucian's infiltrators detonated powder magazines, shedding all disguises."},
        {"speaker": "speaker", "name": "루시안", "nameEn": "Lucian", "cardId": 61, "text": "“하하하! 카단, 이그니스! 이 배는 너희의 관짝이다! 섭정 아르투스 님께서 온 대륙의 황제가 되실 것이다!”", "textEn": "“Hahaha! Kadan, Ignis! This ship is your watery coffin! Regent Artus will rule all eleven realms!”"},
        {"speaker": "speaker", "name": "황자 이그니스", "nameEn": "Prince Ignis", "cardId": 11, "text": "“루시안! 너는 왕실의 신하가 아니라 마신을 섬기는 버러지였구나! 내 불꽃으로 죄를 심판하겠다!”", "textEn": "“Lucian! You were no loyal servant, but vermin worshipping demons! My flames will judge your crimes!”"},
        {
            "speaker": "choice", "name": "화염 갑판의 혈투", "nameEn": "Duel on the Burning Deck", "cardId": 41,
            "text": "불타는 돛대가 쓰러지고 화약 연기가 눈을 찌른다. 카단은 이그니스와 등을 맞대고 배신자들을 향해 돌진한다.",
            "textEn": "Burning rigging crashed across the deck as choking smoke rose. Kadan and Ignis faced the traitors back-to-back.",
            "choices": [
                make_choice("ch21_choice_1", "[결의/돌파]", "[Resolve]", "불타는 돛대를 베어내고 적 지휘관을 직접 친다!", "Cleave the burning mast and strike down the enemy commander!", "“타오르는 기둥을 쳐내며 루시안의 방패를 부수고 일격을 가했다.”", "“Swinging through falling beams, Kadan shattered Lucian's personal guard.”", "buff", 25, "[화염 돌파] 돌파 데미지 +25%", "[Flame Charge] +25% Rush DMG", True),
                make_choice("ch21_choice_2", "[신중/통찰]", "[Insight]", "침수 구역의 균형을 맞춰 폭발 연쇄를 막아낸다.", "Flood secondary compartments to halt chain explosions.", "“화약고 밸브를 신속히 잠가 선체 대폭발을 사전에 차단했다.”", "“Shutting emergency valves prevented a catastrophic magazine detonation.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch21_choice_3", "[성진호흡/공명]", "[Resonance]", "이그니스의 불길과 내 방패를 합쳐 탈출로를 연다.", "Combine Ignis's flame with my shield to blast an exit.", "“화염과 방패의 충격파가 적 포위망을 뚫고 바다로 뛰어들 길을 열었다.”", "“A shockwave of flame and shield blasted open a clear escape route into the sea.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "불타는 바다", "nameEn": "The Burning Sea", "text": "기함은 폭음과 함께 바닷속으로 가라앉았고, 생존자들은 밤바다의 거친 파도에 휩쓸려 흩어졌다.", "textEn": "The flagship plunged into the abyss with a roar, scattering the survivors into the dark surf."}
    ]),

    # 22
    (22, [
        {"speaker": "narrator", "name": "제 22화: 무인도의 네 사람", "nameEn": "Episode 22: Four on a Deserted Island", "text": "이름 모를 화산섬의 검은 모래 해변. 조난당한 카단, 실리아, 그림리, 이그니스 네 사람은 부러진 노와 파편을 짚고 해안에 밀려왔다.", "textEn": "The black volcanic sand of an uncharted reef. Castaways Kadan, Celia, Grimli, and Ignis crawled ashore on floating wreckage."},
        {"speaker": "speaker", "name": "그림리", "nameEn": "Grimli", "cardId": 74, "text": "“어이구 삭신이야... 소금물에 절어 죽는 줄 알았네. 하지만 저 바위틈에서 거대 게 괴수들이 기어 나오고 있어!”", "textEn": "“Ugh, my aching bones... thought I was pickled alive. But look, giant crab chimeras crawl from the reef!”"},
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“담수가 없으면 하루도 못 버텨. 동굴 안쪽의 샘물을 지켜야 해!”", "textEn": "“Without fresh water we won't last a day. We must secure the spring inside the cavern!”"},
        {
            "speaker": "choice", "name": "무인도의 생존 결단", "nameEn": "Survival Pact on the Island", "cardId": 41,
            "text": "야간 만조와 함께 암초 괴수들이 은신처로 몰려든다. 네 사람은 생존을 위해 각자의 역할을 분담한다.",
            "textEn": "With the midnight tide, chimeras swarmed their makeshift shelter. The four castaways took their stations.",
            "choices": [
                make_choice("ch22_choice_1", "[결의/돌파]", "[Resolve]", "밤안개 속에서 습격해 오는 거대 게 괴수를 방패로 내리친다!", "Smash the charging crab chimeras head-on with the shield!", "“단단한 갑각을 방패의 충격파로 박살 내며 해변을 지켜냈다.”", "“A crushing shield slam shattered the chimeras' reinforced carapaces.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points", True),
                make_choice("ch22_choice_2", "[신중/통찰]", "[Insight]", "동굴 안쪽의 담수를 찾고 불씨를 지킨다.", "Locate the fresh spring within the cave and nurture our fire.", "“깨끗한 지하수를 확보하고 젖은 나뭇가지로 따뜻한 모닥불을 피워냈다.”", "“Securing fresh subterranean water and a warm fire restored their vitality.”", "buff", 20, "[생존 본능] 체력 회복력 상승", "[Survival Vigor] HP Regen Up"),
                make_choice("ch22_choice_3", "[성진호흡/공명]", "[Resonance]", "달빛 아래서 네 사람의 호흡을 하나로 모은다.", "Unite the four heartbeats into one beneath the full moon.", "“모닥불 주위에 둘러앉아 상처를 치료하며 둘도 없는 전우애를 다졌다.”", "“Gathered around the fire, shared hardships forged an unbreakable brotherhood.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "화산섬의 모닥불", "nameEn": "Campfire on the Volcanic Reef", "text": "“서로 다른 곳에서 자라났으나, 오늘 밤 우리는 한 핏줄보다 진한 형제가 되었다.”", "textEn": "“Though born in distant lands, tonight we are brothers closer than blood.”"}
    ]),

    # 23
    (23, [
        {"speaker": "narrator", "name": "제 23화: 동굴 속 잠든 기록", "nameEn": "Episode 23: The Record Sleeping in the Cave", "text": "화산섬 지하 용암 동굴 깊은 곳. 이끼 낀 거대한 성기사단 기념비 석벽에 알렉산다르와 발리안 두 아버지의 친필 서약문이 새겨져 있었다.", "textEn": "Deep within the lava grotto of the volcanic isle. An ancient paladin monument preserved the handwritten oath carved by Aleksandar and Balian."},
        {"speaker": "speaker", "name": "황자 이그니스", "nameEn": "Prince Ignis", "cardId": 11, "text": "“아버지의 글씨다... ‘언젠가 우리 아이들이 이 석벽 앞에 서는 날, 대륙에 다시 참된 봄이 찾아오리라’...!”", "textEn": "“It is my father's script... ‘On the day our sons stand before this wall, true spring shall return to the continent’...!”"},
        {"speaker": "speaker", "name": "카단", "nameEn": "Kadan", "cardId": 41, "text": "“아버지들의 희생은 패배가 아니었어. 미래의 우리에게 정의의 씨앗을 남겨주신 거야.”", "textEn": "“Their sacrifice was never defeat. They planted the seeds of justice for our tomorrow.”"},
        {
            "speaker": "choice", "name": "석비 앞의 계승", "nameEn": "Inheritance Before the Stele", "cardId": 41,
            "text": "석벽에 새겨진 고대 룬 문자가 은빛 단검의 마나와 감응하여 빛나기 시작한다.",
            "textEn": "The runic inscriptions on the stele glowed warmly, resonating with the twin silver daggers.",
            "choices": [
                make_choice("ch23_choice_1", "[결의/돌파]", "[Resolve]", "아버지들의 맹세를 내 방패에 영원히 새기겠다!", "Carve our fathers' oath permanently upon my shield!", "“방패의 문장에 황금빛 서약이 각인되며 성기사의 투기가 각성했다.”", "“The golden vow etched itself into the crest, awakening paladin aura.”", "buff", 25, "[영웅의 서약] 전체 스탯 +15%", "[Hero's Vow] +15% All Stats", True),
                make_choice("ch23_choice_2", "[신중/통찰]", "[Insight]", "석판 뒷면에 새겨진 나인섀도우 코덱스 비전을 사경한다.", "Transcribe the Nine-Shadow Codex diagrams engraved on the reverse.", "“석판의 비전 도해를 완벽히 암기하여 아케인 연계 초식을 완성했다.”", "“Memorizing the ancient diagrams perfected their Arcane synergy chain.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch23_choice_3", "[성진호흡/공명]", "[Resonance]", "부모님들의 영혼과 마주하며 눈물을 닦는다.", "Face our parents' spirits in reverence and wipe away our tears.", "“석벽에서 피어난 따스한 빛기둥이 두 청년의 어깨를 감싸 안아주었다.”", "“A pillar of gentle light enveloped both sons in a loving paternal embrace.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "되살아난 맹세", "nameEn": "The Resurrected Oath", "text": "과거의 서약은 이제 두 아들의 손에서 대륙을 구원할 불꽃과 방패로 다시 태어났다.", "textEn": "The covenant of the past was reborn in the hands of two sons as flame and shield."}
    ]),

    # 24
    (24, [
        {"speaker": "narrator", "name": "제 24화: 봉인실의 일곱 밤", "nameEn": "Episode 24: Seven Nights in the Sealed Chamber", "text": "화산섬 붕괴와 함께 닫혀버린 흑요석 봉인실. 공기와 식수가 고갈되어 가는 칠흑의 어둠 속에서 네 사람은 일주일간 사투를 벌였다.", "textEn": "The obsidian vault sealed by collapsing bedrock. With air and water dwindling in pitch darkness, the castaways endured for seven grueling nights."},
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“숨이... 가빠와... 하지만 카단, 네가 곁에 있어서 무섭지 않아...”", "textEn": "“Air is... growing thin... but Kadan, with you beside me, I feel no fear...”"},
        {"speaker": "speaker", "name": "길가메시", "nameEn": "Gilgamesh", "cardId": 47, "text": "“바깥에서 아르투스의 기갑 부대가 섬을 포격하고 있다. 이 문을 부수지 못하면 생매장당한다!”", "textEn": "“Artus's siege engines are bombarding the island outside. If we don't breach this gate, we suffocate!”"},
        {
            "speaker": "choice", "name": "일곱 번째 밤의 돌파", "nameEn": "Breakthrough on the Seventh Night", "cardId": 41,
            "text": "마지막 한 줌의 공기 속에서 카단과 이그니스는 모든 마나를 하나로 모아 흑요석 문을 겨냥한다.",
            "textEn": "In the last pocket of breathable air, Kadan and Ignis pooled all remaining mana against the door.",
            "choices": [
                make_choice("ch24_choice_1", "[결의/돌파]", "[Resolve]", "마지막 마나를 짜내어 문짝을 걷어찬다!", "Pour every drop of mana to smash down the obsidian door!", "“방패와 백색 화염이 결합한 폭발적인 충격으로 육중한 흑요석 문이 산산조각 났다.”", "“The fusion of shield and white fire shattered the massive obsidian gate to pebbles.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points", True),
                make_choice("ch24_choice_2", "[신중/통찰]", "[Insight]", "호흡을 최소화하여 칠흑의 어둠 속에서 빛을 기다린다.", "Conserve breath to the minimum and locate the structural stress flaw.", "“어둠 속에서 미세한 마나 결을 짚어내어 문의 빗장 경첩을 정밀 타격했다.”", "“Targeting the stress fissure precisely unhinged the lock with minimal effort.”", "buff", 20, "[인내의 심장] 상태이상 저항", "[Patient Core] Status Debuff RES"),
                make_choice("ch24_choice_3", "[성진호흡/공명]", "[Resonance]", "성진호흡의 정수로 공기 중의 희박한 마나를 정화한다.", "Filter the stagnant air with the essence of Star Breathing.", "“신선한 마나 기류가 밀폐실을 채우며 전원의 생명력을 온전히 보존했다.”", "“A stream of fresh mana revitalized the vault, preserving everyone's strength.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "태양 아래로", "nameEn": "Out into the Sun", "text": "칠일 만에 터져 나온 햇살 아래, 네 사람은 눈부신 아침 바다를 마주하며 포효했다.", "textEn": "Bursting out into sunlight after seven nights, the four castaways roared before the morning sea."}
    ]),

    # 25
    (25, [
        {"speaker": "narrator", "name": "제 25화: 거짓 혼례의 밤", "nameEn": "Episode 25: Night of the False Wedding", "text": "도성 대성당 주 제단. 루시안은 납치한 실리아를 강제로 옥좌의 제물로 삼아 황실 결속을 조작하려는 거짓 혼례식을 거행하고 있었다.", "textEn": "The high altar of the Imperial Cathedral. Lucian staged a forced wedding with captive Celia to fabricate royal legitimacy."},
        {"speaker": "speaker", "name": "루시안", "nameEn": "Lucian", "cardId": 61, "text": "“실리아, 네가 거부해도 상관없다. 이 반지를 끼는 순간 정보 길드는 황실의 충견이 될 테니까!”", "textEn": "“Refuse all you like, Celia. The moment this ring touches your finger, your guild serves the throne!”"},
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“닥쳐! 내 손은 오직 진실과 자유를 위해 움직여! 카단이 반드시 올 거야!”", "textEn": "“Shut your mouth! My hands work only for truth and liberty! Kadan will come for you!”"},
        {
            "speaker": "choice", "name": "성당 창문의 난입", "nameEn": "Crashing the Cathedral Window", "cardId": 41,
            "text": "주교가 강제로 반지를 끼우려는 순간, 스테인드글라스 창문이 박살 나며 카단이 방패를 들고 공중에서 강착한다.",
            "textEn": "As the priest raised the forced ring, stained glass shattered as Kadan descended shield-first.",
            "choices": [
                make_choice("ch25_choice_1", "[결의/돌파]", "[Resolve]", "거짓된 혼례는 끝났다! 실리아, 내 손을 잡아라!", "The false wedding is over! Celia, take my hand!", "“제단 바닥을 방패로 강타해 루시안의 친위대를 날려버리고 실리아를 품에 안았다.”", "“Slamming the altar shattered the dais, sending guards flying as Kadan caught Celia.”", "buff", 25, "[질풍의 돌격] 공격속도 +25%", "[Tempest Rush] +25% ATK Speed", True),
                make_choice("ch25_choice_2", "[신중/통찰]", "[Insight]", "성당 바닥의 룬 마법진을 먼저 파괴해 결계를 푼다.", "Smash the binding rune circle etched into the cathedral marble.", "“단검을 바닥에 내리꽂아 실리아를 구속하던 마비 주술을 완전히 해제했다.”", "“Planting the dagger into the floor dissolved the paralysis runes binding Celia.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch25_choice_3", "[성진호흡/공명]", "[Resonance]", "바람의 갈대 피리 소리에 공명하여 호위병들을 혼란시킨다.", "Resonate with the reed flute melody to disorient imperial sentries.", "“청아한 풀피리 소리가 대성당 돔을 채우며 호위병들의 마나를 마비시켰다.”", "“Clear flute notes filled the cathedral dome, causing the inquisitors to drop their halberds.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“헤헤... 늦지 않았네, 내 든든한 방패 도련님!”", "textEn": "“Hehe... right on time, my dependable shield master!”"}
    ]),

    # 26
    (26, [
        {"speaker": "narrator", "name": "제 26화: 열린 문, 닫힌 마음", "nameEn": "Episode 26: Open Door, Closed Heart", "text": "철벽 요새 살육의 안뜰. 열려 있던 성문은 섭정군의 함정이었고, 오랜 고문과 불신에 상처 입은 동료들 사이에 긴장감이 감돌았다.", "textEn": "The killing courtyard of the Iron Bastion. The open gate was an ambush; past traumas and distrust threatened ally unity."},
        {"speaker": "speaker", "name": "루시안", "nameEn": "Lucian", "cardId": 61, "text": "“하하! 의심하라! 서로가 배신자라고 믿어라! 너희의 분열이 곧 황실의 승리다!”", "textEn": "“Haha! Suspect each other! Doubt your comrades! Your division guarantees imperial victory!”"},
        {"speaker": "speaker", "name": "이그니스", "nameEn": "Ignis", "cardId": 11, "text": "“카단, 매복병들의 화살이 안뜰 전체를 덮쳤다! 퇴로가 차단당했어!”", "textEn": "“Kadan, arrow volleys cover the entire square! The portcullis slammed shut behind us!”"},
        {
            "speaker": "choice", "name": "안뜰의 진형 형성", "nameEn": "Forming the Phalanx", "cardId": 41,
            "text": "불신과 두려움으로 흔들리는 아군들. 카단은 방패를 높이 치켜들며 전열의 구심점이 된다.",
            "textEn": "Allies wavered amidst suspicion and flying iron. Kadan thrust his shield high, rallying the phalanx.",
            "choices": [
                make_choice("ch26_choice_1", "[결의/돌파]", "[Resolve]", "닫힌 문이라도 내가 앞장서서 부수고 나아가겠다!", "Even if barred, I will lead the charge and break through the gate!", "“방패를 앞세워 성문 빗장을 들이받아 탈출로를 활짝 열어젖혔다.”", "“Ramming the iron bars with his shield tore the heavy gates right off their hinges.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points", True),
                make_choice("ch26_choice_2", "[신중/통찰]", "[Insight]", "매복병들의 화살 사선을 피해 성벽 위로 이동하자.", "Evade the archers' kill-zone and scale the inner parapets.", "“성벽 사각지대를 공략해 궁병 탑을 점령하고 전황을 역전시켰다.”", "“Seizing the archer towers from their blind spot turned the courtyard trap inside out.”", "buff", 20, "[사선 회피] 회피율 +20%", "[Killzone Evade] +20% Evasion"),
                make_choice("ch26_choice_3", "[성진호흡/공명]", "[Resonance]", "상처 입은 동료의 마음에 먼저 방패를 내어준다.", "Extend my shield first to heal the wounded hearts of comrades.", "“불신을 씻어내는 수호의 온기가 퍼지며 일행은 깨지지 않는 원형 방진을 이뤘다.”", "“Gentle protective warmth dissolved lingering doubts, forging an unbreakable circle.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "굳건해진 신뢰", "nameEn": "Hardened Trust", "text": "닫혔던 마음의 문이 열리자, 안뜰의 매복병들은 결속된 방패 앞에 무너져 내렸다.", "textEn": "As closed hearts opened, the ambush collapsed before the united shield line."}
    ]),

    # 27
    (27, [
        {"speaker": "narrator", "name": "제 27화: 두 약속 사이", "nameEn": "Episode 27: Between Two Promises", "text": "적산 협곡 갈림길. 아르투스 섭정의 보급선을 타격할 절호의 기회와, 약탈대에게 쫓기는 수천 명의 피난민 행렬이 갈림길에 놓여 있었다.", "textEn": "The crossroads of Red Mountain Pass. A decisive opportunity to strike Artus's supply lines clashed with the desperate plight of fleeing refugee wagons."},
        {"speaker": "speaker", "name": "길가메시", "nameEn": "Gilgamesh", "cardId": 47, "text": "“보급 기지를 불태우면 아르투스의 군세는 궤멸한다! 이것이 전쟁을 끝낼 가장 빠른 길이다!”", "textEn": "“Torching the supply depot will cripple Artus's armies! It is the fastest path to victory!”"},
        {"speaker": "speaker", "name": "어린 피난민 소녀", "nameEn": "Young Refugee Girl", "cardId": 42, "text": "“기사님... 저 뒤에서 늑대 탄 마적들이 오고 있어요... 엄마가 다쳤어요...”", "textEn": "“Sir knight... wolf riders are coming behind us... my mother is wounded...”"},
        {
            "speaker": "choice", "name": "갈림길의 선택", "nameEn": "Choice at the Crossroads", "cardId": 41,
            "text": "복수와 승리, 그리고 무고한 생명의 수호. 카단은 성기사로서 걸어야 할 참된 길을 마음에 새긴다.",
            "textEn": "Strategic vengeance versus the defense of innocent lives. Kadan weighed the true oath of paladins.",
            "choices": [
                make_choice("ch27_choice_1", "[결의/돌파]", "[Resolve]", "눈앞의 백성을 구하는 것이 성기사의 유일한 길이다!", "Shielding the innocent people before us is the only true oath!", "“피난민 마차 앞에 단신으로 서서 약탈 기병들의 진격을 완벽히 차단했다.”", "“Standing alone before the refugee wagons halted the raiding horde in its tracks.”", "buff", 25, "[수호의 의지] 아군 전체 쉴드", "[Shield of the Weak] Party Shield", True),
                make_choice("ch27_choice_2", "[신중/통찰]", "[Insight]", "적의 추격로에 돌무더기 트랩을 설치해 발을 묶자.", "Rig rockslide traps to block the gorge while leading wagons away.", "“협곡 낙석으로 적의 추격로를 봉쇄하여 사상자 없이 안전하게 철수시켰다.”", "“Collapsing gorge boulders blocked the pursuers, ensuring safe evacuation.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch27_choice_3", "[성진호흡/공명]", "[Resonance]", "피난민들의 공포를 가라앉히는 온기의 마나를 방출한다.", "Radiate calming warmth to soothe the terrified refugees.", "“따뜻한 치유 마나가 전장에 퍼지며 지친 피난민들에게 새로운 희망을 심어주었다.”", "“Healing mana blanketed the trail, instilling courage in the weary families.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "speaker", "name": "길가메시", "nameEn": "Gilgamesh", "cardId": 47, "text": "“...네 말이 맞았다, 카단. 백성을 지키지 못하는 승리는 그저 또 다른 학살일 뿐이지.”", "textEn": "“...You were right, Kadan. A victory that leaves people to bleed is just another slaughter.”"}
    ]),

    # 28
    (28, [
        {"speaker": "narrator", "name": "제 28화: 녹옥 의회의 반란", "nameEn": "Episode 28: Revolt of the Jade Council", "text": "녹옥 의회 대회의실. 아르투스 섭정에게 매수된 부패 귀족 관료들이 군사 쿠데타를 일으켜 숲의 연합 조약을 파기하려 했다.", "textEn": "The Jade Council Chambers. Corrupt nobles bribed by Regent Artus staged a military coup to tear up the forest treaty."},
        {"speaker": "speaker", "name": "부패 의장", "nameEn": "Corrupt Magistrate", "cardId": 61, "text": "“수인족 야만인들과의 조약 따위는 무효다! 의회를 섭정군 친위대에 넘겨라!”", "textEn": "“Treaties with beast savages are void! Hand over the council to the Regent's guard!”"},
        {"speaker": "speaker", "name": "대추장 레오나르", "nameEn": "Grand Chief Leonar", "cardId": 86, "text": "“내 눈에 흙이 들어가기 전까지는 어림없다! 배신자 놈들의 도끼질을 똑똑히 보아라!”", "textEn": "“Not while breath remains in my chest! Traitors will taste the fury of our axes!”"},
        {
            "speaker": "choice", "name": "의회장의 진압", "nameEn": "Quelling the Council Coup", "cardId": 41,
            "text": "의회장 문을 박차고 반역 근위대가 쏟아져 들어온다. 카단과 레오나르는 법정을 수호하기 위해 나선다.",
            "textEn": "Inquisitor shock-troops stormed the floor. Kadan and Leonar stepped up to defend the assembly.",
            "choices": [
                make_choice("ch28_choice_1", "[결의/돌파]", "[Resolve]", "부패한 귀족들의 검극 따위에 정의는 꺾이지 않는다!", "Justice will never bend before corrupt nobles' blades!", "“방패로 반역 사병들의 창벽을 쳐부수며 주동자들을 단숨에 포박했다.”", "“Smashing the conspirators' spear wall subdued the ringleaders in moments.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points", True),
                make_choice("ch28_choice_2", "[신중/통찰]", "[Insight]", "의회의 법령 인장을 회수해 반란의 정당성을 무력화하자.", "Recover the official council seals to strip all legal pretext.", "“위조된 칙령 서류를 압수해 군사들에게 반역의 실체를 폭로했다.”", "“Exposing the forged decrees caused the misled soldiers to ground their arms.”", "buff", 20, "[권능 박탈] 적 버프 제거", "[Disenchant Coup] Purge Enemy Buffs"),
                make_choice("ch28_choice_3", "[성진호흡/공명]", "[Resonance]", "대지 정령들의 분노를 일깨워 회의실 바닥을 진동시킨다.", "Awaken the earth spirits to shake the chamber foundations.", "“진동하는 대지의 마나가 반란군들의 발을 묶어 피 한 방울 없이 제압했다.”", "“Tremors pinned the conspirators' boots to the stone, quelling them bloodlessly.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "확고해진 연합", "nameEn": "The Solidified Alliance", "text": "쿠데타가 진압되자 열한 개 종족 대표들은 카단의 방패 아래 하나로 뭉칠 것을 결의했다.", "textEn": "With the coup crushed, representatives of the eleven races pledged allegiance under Kadan's shield."}
    ]),

    # 29
    (29, [
        {"speaker": "narrator", "name": "제 29화: 바람의 여왕", "nameEn": "Episode 29: Queen of the Wind", "text": "최종 결전의 거점, 천공 첨탑 최상층 테라스. 하늘을 다스리는 바람의 여왕 실피드가 거대한 회오리 옥좌에서 영웅들을 맞이했다.", "textEn": "The Sky Spire pinnacle terrace overlooking the final battlefield. Queen Sylphid awaited the heroes upon a whirling throne."},
        {"speaker": "speaker", "name": "바람의 여왕 실피드", "nameEn": "Queen Sylphid", "cardId": 23, "text": "“아케인 대륙의 운명이 네 손에 달렸다. 하지만 섭정 아르투스의 심연 결계는 폭풍보다 사납다. 네 방패가 그 결계를 찢을 수 있겠는가?”", "textEn": "“The fate of the continent rests in your hands. But Artus's abyssal wards rage fiercer than storms. Can your shield tear them down?”"},
        {"speaker": "speaker", "name": "아쿠아로드", "nameEn": "Aqualord", "cardId": 5, "text": "“여왕이시여, 이 청년의 마나는 정결합니다. 그의 방패는 파괴가 아니라 조화를 담고 있습니다.”", "textEn": "“Your Majesty, this youth's mana is pristine. His shield seeks harmony, never wanton ruin.”"},
        {
            "speaker": "choice", "name": "천공의 가호 시험", "nameEn": "Trial of Celestial Blessing", "cardId": 41,
            "text": "실피드가 소환한 거대한 천공 폭풍이 첨탑을 흔든다. 카단은 여왕의 축복을 얻기 위해 방패를 들어 올린다.",
            "textEn": "Sylphid unleashed a roaring celestial vortex shaking the spire. Kadan raised his shield to receive the mantle.",
            "choices": [
                make_choice("ch29_choice_1", "[결의/돌파]", "[Resolve]", "폭풍우 속에서도 눈을 부릅뜨고 여왕의 시험을 받아내겠다!", "I will keep eyes wide open amidst the squall and embrace the trial!", "“선풍의 중심을 맨몸으로 버텨내며 창공의 깃털 문장을 획득했다.”", "“Enduring the gale head-on earned the Queen's celestial crest upon his shield.”", "buff", 25, "[천공의 가호] 비행/공중 방어", "[Sky Sovereign] Aerial Ward", True),
                make_choice("ch29_choice_2", "[신중/통찰]", "[Insight]", "하늘새들의 날개짓을 관찰해 돌풍의 눈으로 진입하자.", "Observe the sky birds' flight paths to enter the eye of the gale.", "“바람의 회전축을 역이용해 부드럽게 여왕의 옥좌 앞에 당도했다.”", "“Riding the eddy current gently brought Kadan before the Queen's throne unharmed.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch29_choice_3", "[성진호흡/공명]", "[Resonance]", "바람의 여왕과 영혼의 화음을 맞추어 깃털을 받는다.", "Harmonize soul frequencies with the Queen to receive her feather.", "“여왕의 바람 마나와 성진호흡이 융합하며 순백의 날개 형상이 방패에 깃들었다.”", "“Merging breathing with her wind mana bestowed wings of white radiance upon the shield.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "바람의 증표", "nameEn": "Crest of the Wind", "text": "여왕의 깃털이 방패에 깃들자, 대륙의 모든 바람이 일행의 진격을 호위하기 시작했다.", "textEn": "As the feather merged with the shield, every breeze in the realm arose to escort their march."}
    ]),

    # 30
    (30, [
        {"speaker": "narrator", "name": "제 30화: 네 관문의 독", "nameEn": "Episode 30: Poison at the Four Gates", "text": "라이트헤븐 도성 외곽 동서남북 4대 관문. 섭정 아르투스가 최후의 발악으로 도성 상수도 수로에 맹독을 살포해 수십만 민중을 위협하고 있었다.", "textEn": "The four cardinal gates of Lighthaven. In desperate malice, Regent Artus poured lethal poison into city reservoirs, threatening hundreds of thousands."},
        {"speaker": "speaker", "name": "말푸온", "nameEn": "Malfuon", "cardId": 66, "text": "“독기가 정수장 수맥 깊숙이 스며들고 있다! 네 개 수문을 동시에 정화하지 않으면 오늘 밤 도성 전체가 절멸한다!”", "textEn": "“Venom seeps deep into the subterranean aquifers! If four sluices aren't purified at once, the city dies tonight!”"},
        {"speaker": "speaker", "name": "아쿠아로드", "nameEn": "Aqualord", "cardId": 5, "text": "“내가 남쪽과 서쪽 수로를 막겠다! 카단, 너는 가장 오염이 심한 북문 중앙 수맥을 맡아다오!”", "textEn": "“I will stem the southern and western aqueducts! Kadan, take the northern central reservoir!”"},
        {
            "speaker": "choice", "name": "독기 수문의 정화", "nameEn": "Cleansing the Poison Sluice", "cardId": 41,
            "text": "보라색 독안개가 뿜어져 나오는 북문 수문. 적의 독침 저격수들이 수문을 둘러싼 채 조준하고 있다.",
            "textEn": "Purple toxic fumes billowed from the northern sluice as enemy snipers zeroed in.",
            "choices": [
                make_choice("ch30_choice_1", "[결의/돌파]", "[Resolve]", "독구름을 뚫고 수문을 향해 몸을 던진다!", "Dive through the toxic cloud directly toward the sluice lever!", "“방패로 독화살을 쳐내며 뛰어들어 닫혀 있던 정수 수문을 열어젖혔다.”", "“Deflecting poison bolts, Kadan hauled open the emergency purification valve.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points", True),
                make_choice("ch30_choice_2", "[신중/통찰]", "[Insight]", "정화 약초를 수로의 수원지에 집중 투하하자.", "Distribute concentrated antidote herbs at the primary waterhead.", "“수원지의 물길을 정확히 계산해 최소한의 약재로 도성 식수를 모두 구했다.”", "“Calculating the exact flow vectors cleansed the city reservoirs with minimal herbs.”", "buff", 20, "[정화의 샘] 지속 독 저항", "[Purifying Font] Continuous Poison RES"),
                make_choice("ch30_choice_3", "[성진호흡/공명]", "[Resonance]", "대지의 수맥을 호흡으로 감싸 독기를 중화시킨다.", "Envelop the subterranean leylines with Star Breathing to neutralize poison.", "“푸른 마나가 상수도 수맥을 타고 번져나가며 모든 독안개를 맑은 물로 바꿨다.”", "“Pure mana raced through aqueducts, turning caustic poison into crystal spring water.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "도성의 물길", "nameEn": "Waters of the Capital", "text": "수로에 맑은 샘물이 다시 흐르자, 도성 민중들은 환호하며 성문을 열어젖혔다.", "textEn": "As fresh spring water surged through city fountains, citizens cheered and swung open the gates."}
    ])
]

print("Loaded Chapters 16 to 30 successfully.")
