# Chapters 31 to 40 definitions
from chapters_1_15 import make_choice

CHAPTERS_31_40 = [
    # 31
    (31, [
        {"speaker": "narrator", "name": "제 31화: 모든 것을 건 손", "nameEn": "Episode 31: The Hand That Wagered Everything", "text": "침몰한 작전 지휘소 원탁. 섭정 아르투스의 흑강 드레드노트 함대가 만을 봉쇄한 가운데, 연합군은 남은 모든 전력과 신성한 성물을 걸고 최후의 도박을 준비했다.", "textEn": "The sunken war room strategy table. With Regent Artus's dreadnought fleet blockading the bay, the allied forces prepared a desperate gambit, wagering every reserve and relic."},
        {"speaker": "speaker", "name": "타짜 길버트", "nameEn": "Gilbert the Gambler", "cardId": 1, "text": "“이번 패는 내 목숨까지 얹은 올인이다. 얕은 암초 지대로 적의 기함을 유인할 테니, 카단 그대가 물길을 열어주시오!”", "textEn": "“This hand is an all-in with my life on the table. We will bait their flagship into shallow reefs if you can carve a path, Kadan!”"},
        {"speaker": "speaker", "name": "황자 이그니스", "nameEn": "Prince Ignis", "cardId": 11, "text": "“내 백색 화염과 아케인 함포의 화력을 일제히 집중하겠다! 단 한 번의 기회뿐이다!”", "textEn": "“My white flame and arcane batteries will unleash full firepower at your signal! We only get one shot!”"},
        {
            "speaker": "choice", "name": "모든 것을 건 승부", "nameEn": "The All-In Wager", "cardId": 41,
            "text": "적의 흑요석 기함이 포문을 열며 포위망을 좁혀온다. 카단은 선수에 서서 방패를 들어 올리며 결단을 내린다.",
            "textEn": "The obsidian flagship rolled out broadsides as the cordon tightened. Standing at the prow, Kadan raised his shield.",
            "choices": [
                make_choice("ch31_choice_1", "[결의/돌파]", "[Resolve]", "우리가 미끼가 되겠다. 적의 총공세를 정면으로 유인하자!", "We will be the decoy. Draw their full vanguard straight onto us!", "“선수 갑판에서 방패를 치켜들자 적의 모든 포문이 카단을 향해 쏟아졌다.”", "“Raising the shield at the prow turned every enemy cannon upon Kadan alone.”", "buff", 25, "[불패의 미끼] 어그로 집중 및 방어력 +25%", "[Invincible Decoy] Aggro Focus & +25% DEF", True),
                make_choice("ch31_choice_2", "[신중/통찰]", "[Insight]", "조수 간만의 차를 이용해 적 기함을 갯벌에 좌초시킨다.", "Utilize the tidal ebb to beach their dreadnoughts on sandbars.", "“수심 측정을 정확히 계산해 적의 거함을 암초 지대에 완벽히 고립시켰다.”", "“Precise depth calculation grounded the enemy behemoth hopelessly on jagged reefs.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch31_choice_3", "[성진호흡/공명]", "[Resonance]", "물의 요정들과 결속하여 바다 안개를 일으킨다.", "Commune with water spirits to conjure an impenetrable sea fog.", "“푸른 마나가 수면을 덮으며 짙은 해무가 적의 시야를 완전히 가렸다.”", "“Azure mana rolled over the swells, veiling the entire armada in blinding mist.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "작전의 서막", "nameEn": "Prelude to Battle", "text": "칠흑의 바다 위에 아케인 섬광이 번쩍이며 결전의 닻이 올라갔다.", "textEn": "Arcane lightning flashed across the dark abyss as anchors weighed for the final battle."}
    ]),

    # 32
    (32, [
        {"speaker": "narrator", "name": "제 32화: 첫사랑의 잔향", "nameEn": "Episode 32: Echo of First Love", "text": "황궁 외곽 달빛 정원 테라스. 최후의 결전을 앞둔 고요한 밤, 은빛 나뭇잎 사이로 차가운 밤바람이 스쳐 지나갔다.", "textEn": "The moonlit garden terrace outside the citadel. On the quiet eve of the final assault, a chill night breeze rustled silver leaves."},
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“내일 결전이 시작되면... 우리 중 누군가는 돌아오지 못할지도 몰라. 이 은빛 들꽃 매듭을 네 방패 끈에 묶어둘게.”", "textEn": "“When dawn battle breaks... some of us may never return. Let me bind this wild silver blossom to your shield strap.”"},
        {"speaker": "speaker", "name": "카단", "nameEn": "Kadan", "cardId": 41, "text": "“실리아, 눈보라 치던 날부터 지금까지 내 방패가 향한 곳은 언제나 너와 동료들이었다.”", "textEn": "“Celia, from that blizzard night to now, my shield has always aimed to protect you and our kin.”"},
        {
            "speaker": "choice", "name": "달빛 아래의 서약", "nameEn": "Vow Beneath the Moonlight", "cardId": 62,
            "text": "들꽃의 은은한 향기가 밤공기에 맴돈다. 카단은 실리아의 손을 감싸며 마지막 밤의 맹세를 나눈다.",
            "textEn": "The fragrance of wildflowers lingered in the night air. Gripping Celia's hand, Kadan shared their final pledge.",
            "choices": [
                make_choice("ch32_choice_1", "[결의/돌파]", "[Resolve]", "내일 전투가 끝나면 반드시 함께 살아서 고향으로 돌아가자.", "When tomorrow's battle ends, we will return home alive together.", "“단단한 약속을 가슴에 품자 두려움이 눈 녹듯 사라지고 굳센 투기가 차올랐다.”", "“A resolute promise in heart melted all fear, filling Kadan with steadfast valor.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points", True),
                make_choice("ch32_choice_2", "[신중/통찰]", "[Insight]", "너를 지키는 방패가 되겠다는 약속은 결코 잊지 않아.", "The vow to be the shield protecting you will never waver.", "“방패 손잡이에 묶인 들꽃이 은은한 아케인 보호막을 두르며 빛났다.”", "“The wild flower bound to the handle shimmered with an arcane protective aura.”", "buff", 25, "[들꽃의 맹세] 방어막 +25%", "[Vow of Wildflower] +25% Shield Barrier"),
                make_choice("ch32_choice_3", "[성진호흡/공명]", "[Resonance]", "은은한 바람결 속에 서로의 심장 박동을 포갠다.", "Harmonize heartbeats gently within the whispering night breeze.", "“두 사람의 영혼이 별 호흡으로 이어지며 따스한 온기가 새벽공기를 밝혔다.”", "“Connecting through Star Breathing warmed the dawn with silent serenity.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "달빛 아래의 약속", "nameEn": "Promise Beneath the Moon", "text": "새벽 바람에 들꽃 향기가 번지며, 두 사람의 맹세는 별빛 속에 영원히 아로새겨졌다.", "textEn": "Wildflower fragrance rode the dawn gale, etching their oath into eternity."}
    ]),

    # 33
    (33, [
        {"speaker": "narrator", "name": "제 33화: 검은 늪의 원한", "nameEn": "Episode 33: Grudge of the Black Marsh", "text": "도성 외곽 검은 늪 네크로폴리스. 썩은 안개가 자욱한 진흙 속에서 과거 섭정 아르투스에게 학살당한 수만 전몰자의 원혼이 사령술에 묶여 울부짖었다.", "textEn": "Black Marsh necropolis outside the Citadel. Amidst necrotic mud and mist, tens of thousands of slain martyrs shrieked, bound by Artus's foul necromancy."},
        {"speaker": "speaker", "name": "데스나이트 아르투스", "nameEn": "Death Knight Artus", "cardId": 60, "text": "“어리석은 성기사의 아들아! 이 늪에 묻힌 수만 전몰자의 원혼이 네 살점을 뜯어먹을 것이다!”", "textEn": "“Foolish paladin's whelp! The wailing specters of tens of thousands will tear your flesh!”"},
        {"speaker": "speaker", "name": "카단", "nameEn": "Kadan", "cardId": 41, "text": "“아르투스! 네가 학살한 원혼들의 고통을 더 이상 네 사령술의 노예로 부리지 못한다!”", "textEn": "“Artus! You will no longer enslave the tormented martyrs you butchered!”"},
        {
            "speaker": "choice", "name": "원혼의 늪 정화", "nameEn": "Cleansing the Marsh of Souls", "cardId": 41,
            "text": "사령 마법진이 검은 물결을 일으키며 뼈마디 망령들이 솟구쳐 오른다. 카단은 방패의 룬을 밝히며 성광을 모은다.",
            "textEn": "Necromantic rings churned black mire as skeletal specters clawed upward. Kadan gathered holy light upon his buckler.",
            "choices": [
                make_choice("ch33_choice_1", "[결의/돌파]", "[Resolve]", "원혼들아, 성기사의 빛 아래서 편히 잠들라!", "Tormented souls, rest in peace beneath the sacred paladin light!", "“방패에서 뿜어져 나온 순백의 성광이 늪 전체의 사령 마법진을 단숨에 정화했다.”", "“Pure holy light radiating from the shield instantly vaporized the necrotic circles.”", "buff", 30, "[파사의 빛] 언데드 데미지 +30%", "[Bane of Darkness] +30% vs Undead", True),
                make_choice("ch33_choice_2", "[신중/통찰]", "[Insight]", "늪지대 바닥의 침강 함정을 피해 단단한 암반으로 유도하자.", "Maneuver away from sinking bogs onto solid subterranean bedrock.", "“발판을 선점하여 적의 강습 기병들을 수렁 속으로 밀어 넣었다.”", "“Seizing high rock drove enemy shock lancers floundering into the mire.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch33_choice_3", "[성진호흡/공명]", "[Resonance]", "어둠의 사슬을 자비의 호흡으로 끊어낸다.", "Sever the chains of darkness with compassionate Star Breathing.", "“원혼들의 흐느낌을 보듬으며 흑마법 주술의 매듭을 부드럽게 해체했다.”", "“Embracing the weeping phantoms gently unraveled the curses binding them.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "늪지의 정화", "nameEn": "Cleansing the Mire", "text": "검은 안개가 걷히고 성불한 영혼들이 은빛 나비가 되어 하늘로 날아올랐다.", "textEn": "Dark mists lifted as redeemed souls transformed into silver butterflies, ascending into the dawn sky."}
    ]),

    # 34
    (34, [
        {"speaker": "narrator", "name": "제 34화: 무너진 바람섬", "nameEn": "Episode 34: The Fallen Wind Isle", "text": "붕괴하는 공중 요새 부유석 잔해. 심연 함포의 포격으로 반중력 코어가 파괴되어 섬 전체가 하계 대지 위로 곤두박질치고 있었다.", "textEn": "Collapsing aerial citadel fragments. Abyssal bombardments shattered the anti-gravity core, sending the floating isle hurtling into the abyss below."},
        {"speaker": "speaker", "name": "바람의 정령사", "nameEn": "Wind Elementalist", "cardId": 25, "text": "“공중 요새의 반중력 코어가 파괴되었다! 섬 전체가 하계로 추락하고 있어!”", "textEn": "“The floating citadel's levitation core has ruptured! The entire isle is plunging!”"},
        {"speaker": "speaker", "name": "그림리", "nameEn": "Grimli", "cardId": 74, "text": "“내 대포로 낙석들을 요격하겠다! 카단, 잔해 충돌을 막아다오!”", "textEn": "“I will blast falling rocks with cannonfire! Kadan, catch the shockwaves!”"},
        {
            "speaker": "choice", "name": "추락 속의 탈출로", "nameEn": "Skyway Through the Fall", "cardId": 41,
            "text": "거대한 부유석 파편들이 피난선들의 항로를 가로막으며 쏟아져 내린다. 카단은 공중으로 도약해 방패를 전개한다.",
            "textEn": "Meteoric island slabs plummeted straight across the refugee convoy. Leaping into the void, Kadan braced his buckler.",
            "choices": [
                make_choice("ch34_choice_1", "[결의/돌파]", "[Resolve]", "추락하는 파편을 방패로 쳐내어 피난선을 보호한다!", "Smash through tumbling meteoric rubble with the shield to shield the evacuees!", "“거대한 부유석 파편을 공중에서 두 동강 내며 피난선의 활로를 열었다.”", "“Cleaving falling monoliths mid-air cleared safe skyway for the refugee airships.”", "buff", 25, "[하늘의 방패] 충돌 저항 +25%", "[Aegis of the Sky] +25% Impact RES", True),
                make_choice("ch34_choice_2", "[신중/통찰]", "[Insight]", "부유석의 남은 마나를 활성화해 탈출 궤적을 확보하자.", "Trigger residual levitation mana in the falling runes to stabilize air currents.", "“낙하하는 암석의 중심점을 찔러 완충 지대를 형성시켰다.”", "“Striking kinetic centers formed a stable gliding updraft for the fleet.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch34_choice_3", "[성진호흡/공명]", "[Resonance]", "추락하는 바람의 흐름을 날개처럼 펼쳐 안착시킨다.", "Spread the falling updrafts like wings through Astral Breathing.", "“폭풍의 하강 기류를 거대한 상승 날개로 치환해 모두를 안전하게 연착륙시켰다.”", "“Inverting the violent downdraft safely drifted the airships onto terra firma.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "부서진 섬의 안착", "nameEn": "Landing of the Fallen Isle", "text": "마지막 피난선이 지상에 안전하게 내리쬐는 햇살 속에 착륙했다.", "textEn": "The final refugee skyship touched down gently under rays of morning sunlight."}
    ]),

    # 35
    (35, [
        {"speaker": "narrator", "name": "제 35화: 안개 속의 오인", "nameEn": "Episode 35: Mistaken in the Fog", "text": "신기루 협곡 환영 미궁. 보랏빛 환각 안개가 아군과 적군의 모습을 뒤바꾸어 서로에게 칼을 겨누게 만드는 혼란이 벌어졌다.", "textEn": "The Valley of Mirages misty labyrinth. Purple illusory fog inverted appearances of friend and foe, inciting brothers-in-arms to cross swords."},
        {"speaker": "speaker", "name": "헤르쿨", "nameEn": "Hercul", "cardId": 49, "text": "“카단! 앞을 보아라! 네 모습과 똑같은 흑화 환영들이 칼을 겨누고 있다!”", "textEn": "“Kadan! Look ahead! Shadow doppelgangers bearing your exact visage are brandishing blades!”"},
        {"speaker": "speaker", "name": "루시안", "nameEn": "Lucian", "cardId": 61, "text": "“크하하! 서로가 서로를 베어 넘겨라! 이 안개 속에서는 아군과 적군의 구분이 없다!”", "textEn": "“Bwahaha! Slaughter your own kin! In this mist, ally and foe bleed the same!”"},
        {
            "speaker": "choice", "name": "환영을 깨뜨리는 심안", "nameEn": "Mind's Eye Piercing Illusion", "cardId": 41,
            "text": "사방에서 동료들의 비명과 환영들의 기습이 이어진다. 카단은 눈을 감고 내면의 호흡에 집중한다.",
            "textEn": "Screams of comrades echoed amidst phantom ambushes. Closing his eyes, Kadan focused inward upon pure breathing.",
            "choices": [
                make_choice("ch35_choice_1", "[결의/돌파]", "[Resolve]", "눈을 감아라! 귀와 심장으로 진짜 동료를 느낀다!", "Close your eyes! Sense your true companions through ears and heartbeat!", "“시각을 차단하고 방패의 아케인 파동만으로 가짜 환영들을 모조리 분쇄했다.”", "“Shutting out false sight, sonic shield pulses shattered the phantom doppelgangers.”", "buff", 25, "[심안의 방패] 환각 면역 및 치명타율 상승", "[Mind's Eye Shield] Illusion Immunity & Crit Up", True),
                make_choice("ch35_choice_2", "[신중/통찰]", "[Insight]", "허상의 그림자는 발소리를 내지 못한다. 바닥을 확인해라.", "Phantoms cast no footsteps in the sand. Track the ground vibrations.", "“진짜 적의 발자국 진동만을 감지해 루시안의 분신들을 각개격파했다.”", "“Pinpointing genuine footfalls routed Lucian's decoys in minutes.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch35_choice_3", "[성진호흡/공명]", "[Resonance]", "별 호흡의 파동을 방출해 환영 마법을 한 번에 깨뜨린다.", "Unleash Astral Wave pulses to shatter the illusion matrix at once.", "“맑고 투명한 마나 파동이 협곡 전체의 보랏빛 신기루를 단숨에 흩날렸다.”", "“A pristine astral resonance dispersed every purple mirage lingering in the canyon.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "안개의 소멸", "nameEn": "Dispersal of the Mist", "text": "진실된 마음으로 눈을 뜬 일행 앞에 숨어 있던 루시안의 본진이 적나라하게 드러났다.", "textEn": "Opening eyes with sincere hearts exposed Lucian's hidden redoubt in plain sight."}
    ]),

    # 36
    (36, [
        {"speaker": "narrator", "name": "제 36화: 십자 성흔의 지도", "nameEn": "Episode 36: Map of the Cross-Shaped Scar", "text": "도성 내성 사령부 붉은 암벽. 결전 직전, 고대 용인족의 유적에서 발굴된 십자 성흔 지도가 펼쳐지며 아르투스의 무적 결계에 숨겨진 치명적 결함이 밝혀졌다.", "textEn": "The inner citadel redoubt. Before the final clash, unrolling the ancient Dragonkin's cross-scar map revealed the sole structural flaw in Artus's barrier."},
        {"speaker": "speaker", "name": "길가메시", "nameEn": "Gilgamesh", "cardId": 47, "text": "“보아라, 십자 성흔 지도다. 아르투스의 흑요석 철벽에도 동남쪽 배수로에 결계 교차 균열이 존재한다!”", "textEn": "“Behold the cross-shaped scar map. In Artus's obsidian fortress, only one seam exists: the southeastern sluice!”"},
        {"speaker": "speaker", "name": "대족장 펜리르", "nameEn": "Chieftain Fenrir", "cardId": 81, "text": "“우리 야수 전사들이 전면 성벽을 쳐서 적의 수비대를 유인하겠다!”", "textEn": "“My beast vanguard will storm the main gate to bait their defense reserves!”"},
        {
            "speaker": "choice", "name": "십자 결계의 돌파", "nameEn": "Breaching the Cross-Barrier", "cardId": 41,
            "text": "성벽 위에서 흑마법 방어포가 불을 뿜는다. 카단은 성흔의 교차점을 정조준하며 돌격을 지휘한다.",
            "textEn": "Dark arcane cannons flared along parapets. Aiming straight at the cross-scar nexus, Kadan commanded the breach.",
            "choices": [
                make_choice("ch36_choice_1", "[결의/돌파]", "[Resolve]", "약점이 드러났다! 내가 가장 선봉에서 관문을 뚫겠다!", "The rift is bared! I will lead the spearhead to breach the portal!", "“십자 성흔의 교차점을 방패 모서리로 강타하여 흑요석 결계를 산산조각 냈다.”", "“Striking the cross-scar nexus shattered the obsidian barrier into shards.”", "buff", 30, "[성흔의 돌파] 관통 데미지 +30%", "[Cross-Scar Breach] +30% Penetration", True),
                make_choice("ch36_choice_2", "[신중/통찰]", "[Insight]", "동서남북 4개 타격대를 동시에 진입시켜 방어선을 분산하자.", "Deploy 4 strike teams simultaneously across cardinal gates to disperse their line.", "“완벽한 협동 침투로 적의 기계 경비대 지휘 체계를 마비시켰다.”", "“Synchronized infiltration paralyzed the citadel's mechanical command grid.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch36_choice_3", "[성진호흡/공명]", "[Resonance]", "용의 성흔과 내 마나를 공명시켜 결계를 붕괴시킨다.", "Resonate Astral Mana with the ancient dragon scar to dissolve the barrier.", "“고대 용족의 공명 주파수로 결계의 룬 마법진이 자연스럽게 해체되었다.”", "“Ancient draconic frequencies serenely unraveled the runes without triggering alarms.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "성문이 열리다", "nameEn": "The Citadel Gates Open", "text": "십자 결계가 무너지며, 대륙 연합군의 깃발이 황궁 내성을 향해 물결쳤다.", "textEn": "As the cross-seal collapsed, allied standards surged into the inner citadel."}
    ]),

    # 37
    (37, [
        {"speaker": "narrator", "name": "제 37화: 정복왕의 전쟁", "nameEn": "Episode 37: War of the Conqueror King", "text": "황궁 앞 광활한 평원 결전장. 대륙 전역에서 모여든 자유민 연합군과 섭정의 흑강 철갑 군단이 격돌하는 역사상 최대의 회전이 벌어졌다.", "textEn": "The grand plains before the Imperial Citadel. Allied freemen from across the realm collided with the Regent's black iron legions in a historic pitched battle."},
        {"speaker": "speaker", "name": "정복왕 길가메시", "nameEn": "Conqueror King Gilgamesh", "cardId": 47, "text": "“대륙의 모든 자유민들이여! 오늘 우리는 노예가 아닌 주인으로서 싸운다! 전군, 돌격!”", "textEn": "“Freemen of the realm! Today we fight as sovereigns, not thralls! All units, charge!”"},
        {"speaker": "speaker", "name": "황자 이그니스", "nameEn": "Prince Ignis", "cardId": 11, "text": "“백색 화염포 발사! 아르투스의 기갑 철갑군 전열을 불태워라!”", "textEn": "“Fire the White Flame Batteries! Incinerate Artus's ironclad vanguard!”"},
        {
            "speaker": "choice", "name": "평원의 중앙 방진", "nameEn": "Phalanx of the Plains", "cardId": 41,
            "text": "적의 철갑 기병 돌격대가 연합군 중앙을 뚫으려 쇄도한다. 카단은 방패를 대지에 박아 넣으며 방진을 세운다.",
            "textEn": "Heavy juggernauts charged to cleave the allied center. Ramming his shield into earth, Kadan formed the bulwark.",
            "choices": [
                make_choice("ch37_choice_1", "[결의/돌파]", "[Resolve]", "연합군 전열의 중앙을 맡겠다! 방패는 뚫리지 않는다!", "I hold the center of the allied line! This shield shall not break!", "“수천 기의 적 기병 돌격을 홀로 버텨내며 아군의 절대 방어선을 지켜냈다.”", "“Standing firm against thousands of ironclad charges held the line unbroken.”", "buff", 30, "[불멸의 방진] 아군 전체 방어력 상승", "[Immortal Phalanx] Allied Team DEF Up", True),
                make_choice("ch37_choice_2", "[신중/통찰]", "[Insight]", "적 기갑병의 측면 관절부를 노려 포위망을 좁힌다.", "Target the exposed joints of enemy heavy juggernauts to tighten the vice.", "“적 기갑 전차들의 궤도를 하나씩 끊어내며 진격을 완전히 좌초시켰다.”", "“Crippling war machine treads grounded the imperial vanguard in tracks.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch37_choice_3", "[성진호흡/공명]", "[Resonance]", "전장의 수만 군사들에게 수호의 마나를 불어넣는다.", "Channel protective Astral Mana across tens of thousands of warriors.", "“방패에서 뿜어진 거대한 오라가 연합군 전사들의 검에 황금빛 축복을 실어주었다.”", "“A grand aura from the buckler blessed every allied blade in golden light.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "평원의 승리", "nameEn": "Triumph on the Plains", "text": "적의 철갑 기병대는 패주했고, 황궁 정문으로 통하는 대로가 열렸다.", "textEn": "The imperial juggernauts routed, opening the grand avenue to the Palace gates."}
    ]),

    # 38
    (38, [
        {"speaker": "narrator", "name": "제 38화: 세 개의 비단 봉인", "nameEn": "Episode 38: Three Silk Seals", "text": "황제 알현실 전실 어전. 섭정의 오른팔이자 반역의 주역인 재상 루시안이 황실 혈통의 생명력을 흡수하는 세 개의 비단 봉인을 쥐고 최후의 저항을 벌였다.", "textEn": "The Throne Room ante-chamber. Vizier Lucian, Artus's treacherous right hand, staged a final defense wielding three silk seals draining the imperial bloodline."},
        {"speaker": "speaker", "name": "루시안", "nameEn": "Lucian", "cardId": 61, "text": "“카단! 이그니스! 감히 여기까지 발을 들이다니! 세 개의 비단 봉인이 풀리기 전에 너희 뼈를 갈아버리겠다!”", "textEn": "“Kadan! Ignis! How dare you step here! Before the three silk seals snap, I'll grind your bones!”"},
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“저 비단 봉인들은 황실 혈통의 생명력을 흡수하는 주술이야! 서둘러 풀어야 해!”", "textEn": "“Those silk seals are drain curses sucking royal lifeforce! Break them quickly!”"},
        {
            "speaker": "choice", "name": "간신의 심판", "nameEn": "Judgment of Treason", "cardId": 41,
            "text": "루시안의 어둠 검술이 독기를 뿜어내고 봉인의 마력이 팽창한다. 카단은 방패를 치켜들며 전실로 뛰어든다.",
            "textEn": "Lucian's venomous blades flared as sealing magic surged. Raising his buckler, Kadan charged across the throne hall.",
            "choices": [
                make_choice("ch38_choice_1", "[결의/돌파]", "[Resolve]", "루시안! 네 탐욕의 거짓 옥좌는 오늘로 끝이다!", "Lucian! Your greedy sham throne ends today!", "“루시안의 암흑 검을 방패로 쳐올려 천장에 처박고 거짓된 왕관을 박살 냈다.”", "“Bashing Lucian's dark rapier into the vaulted rafters shattered his gilded crown.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points", True),
                make_choice("ch38_choice_2", "[신중/통찰]", "[Insight]", "세 비단 봉인의 룬 매듭을 역순으로 풀어 마나를 무력화한다.", "Untie the rune knots of the three silk seals in reverse order to discharge the mana.", "“매듭이 풀리자 황실에 걸려 있던 피의 저주가 안개처럼 사라졌다.”", "“Unraveling the knots dissolved the imperial blood hexes into thin air.”", "buff", 25, "[봉인 해제] 상태이상 무효", "[Seal Liberation] Debuff Immunity"),
                make_choice("ch38_choice_3", "[성진호흡/공명]", "[Resonance]", "더 이상의 살육은 무의미하다. 항복하고 죄를 자백하라.", "Further bloodshed is pointless. Yield and confess your crimes.", "“카단의 압도적인 의기 앞에 루시안은 무기를 떨어뜨리고 무릎을 꿇었다.”", "“Overwhelmed by Kadan's dignity, Lucian dropped his blade and knelt in shame.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "정의의 회복", "nameEn": "Restoration of Justice", "text": "비단 봉인이 풀리고 옥좌를 더럽히던 간신 루시안은 포박되어 끌려나갔다.", "textEn": "With the silk seals severed, the treasonous vizier Lucian was shackled and led away."}
    ]),

    # 39
    (39, [
        {"speaker": "narrator", "name": "제 39화: 지켜야 할 세계", "nameEn": "Episode 39: The World Worth Protecting", "text": "황궁 최심부 붉은 유리 궁정 심연 코어. 마신의 힘을 강림시켜 칠흑의 악마 갑주를 두른 섭정 아르투스가 대륙 전체를 삼키려 포효했다.", "textEn": "The Celestial Citadel Throne Core. Clad in abyssal demonic plate infused with hellish power, Regent Artus roared to consume the entire continent."},
        {"speaker": "speaker", "name": "데스나이트 아르투스", "nameEn": "Death Knight Artus", "cardId": 60, "text": "“크하하하! 대륙을 부수고 심연의 마신을 이 땅에 강림시키겠다! 이것이 진정한 파괴와 재창조다!”", "textEn": "“Bwahaha! I will shatter this continent and summon the Abyssal Lord! True rebirth through ruin!”"},
        {"speaker": "speaker", "name": "황자 이그니스", "nameEn": "Prince Ignis", "cardId": 11, "text": "“우리 아버지를 죽이고 어머니의 삶을 짓밟은 네놈의 야망은 여기서 끝이다! 백색 성염, 타올라라!”", "textEn": "“You butchered my father and crushed my mother's life! Your ambition ends here! Flare, Holy Flame!”"},
        {"speaker": "speaker", "name": "카단", "nameEn": "Kadan", "cardId": 41, "text": "“아르투스! 힘은 지배하기 위함이 아니라, 약한 자들을 지키는 방패다!”", "textEn": "“Artus! Power is not for domination, but a shield to protect the innocent!”"},
        {
            "speaker": "choice", "name": "최후의 심연 대결전", "nameEn": "Final Abyssal Clash", "cardId": 41,
            "text": "아르투스의 암흑 대검이 시공간을 가르며 떨어진다. 카단과 이그니스는 모든 생명력을 쥐어짜 방패와 성염을 맞부딪친다.",
            "textEn": "Artus's dark greatsword cleft the very fabric of space. Channeling their entire lifeforce, Kadan and Ignis met the blade.",
            "choices": [
                make_choice("ch39_choice_1", "[결의/돌파]", "[Resolve]", "내 방패는 아버지와 어머니, 그리고 대륙의 모든 백성들의 것이다!", "My shield belongs to father, mother, and every citizen across this realm!", "“방패에서 눈부신 백은빛 아케인 오라가 솟구쳐 아르투스의 암흑 대검을 산산조각 내었다.”", "“A dazzling silver-white aura erupted from the shield, shattering Artus's dark greatsword.”", "buff", 35, "[최후의 아케인 에코] 공격 및 방어력 +35%", "[Final Arcane Echo] +35% ATK & DEF", True),
                make_choice("ch39_choice_2", "[신중/통찰]", "[Insight]", "아르투스의 심장핵이 열리는 찰나를 노려 창끝을 유도한다!", "Guide Ignis's spearpoint to the split second when Artus's heart core opens!", "“방패로 심연의 파동을 쳐내자 노출된 핵으로 이그니스의 백색 화염창이 꽂혔다.”", "“Deflecting abyssal waves opened a flawless path for Ignis's fatal thrust.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points"),
                make_choice("ch39_choice_3", "[성진호흡/공명]", "[Resonance]", "백색 화염과 성진호흡의 합일! 어둠을 태양의 빛으로 씻어낸다!", "Harmonize White Flame and Astral Breathing! Wash away darkness in solar light!", "“두 청년의 영혼이 완벽하게 융합되며 도성 전체를 뒤덮던 칠흑의 어둠이 정화되었다.”", "“A perfect fusion of their souls cleansed the dark miasma smothering the citadel.”", "sns", 35, "+35 SNS 획득", "+35 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "마신의 소멸", "nameEn": "Extinction of the Demon Core", "text": "아르투스의 심연 코어가 부서지며 수십 년 동안 대륙을 옥죄었던 붉은 유리 궁정이 무너져 내렸다.", "textEn": "As the abyssal core shattered, the Red Glass Court that choked the realm for decades crumbled away."}
    ]),

    # 40
    (40, [
        {"speaker": "narrator", "name": "제 40화: 영웅이라 불리지 않는 자", "nameEn": "Episode 40: One Who Is Not Called a Hero", "text": "라이트헤븐 대광장 & 북쪽 고향 엘윈으로 향하는 봄바람 길. 전쟁은 끝났고 제국은 카단과 이그니스에게 대원수의 황금 왕관과 영지를 수여하려 했다.", "textEn": "Lighthaven grand plaza & north road to Elwin. War was ended, and the realm sought to bestow Supreme Marshal crowns and grand domains upon Kadan and Ignis."},
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“황궁의 황금 왕관 따위는 내 갈대 피리보다 무겁고 시시해. 난 북쪽 초원으로 갈 거야.”", "textEn": "“Imperial gold crowns are heavier and duller than my reed flute. I'm heading north to the prairie.”"},
        {"speaker": "speaker", "name": "황자 이그니스", "nameEn": "Prince Ignis", "cardId": 11, "text": "“저 역시 궁정에 머물지 않겠습니다. 성기사단의 깃발을 들고 부흥의 흙을 일구겠습니다.”", "textEn": "“Nor will I linger in palaces. I will take the Paladin banner to till the soil of rebuilding.”"},
        {"speaker": "speaker", "name": "카단", "nameEn": "Kadan", "cardId": 41, "text": "“저를 영웅이라 부르지 마십시오. 저는 그저 눈보라 치던 밤의 서약을 지킨 사람일 뿐입니다.”", "textEn": "“Do not call me a hero. I am merely one who kept the vow made beneath the blizzard.”"},
        {
            "speaker": "choice", "name": "새로운 봄을 향한 발걸음", "nameEn": "Steps Toward a New Spring", "cardId": 41,
            "text": "환호하는 민중들을 뒤로하고 카단은 방패를 짊어지고 북쪽 고향 길을 향해 돌아선다.",
            "textEn": "Turning from cheering crowds, Kadan slung his buckler over his shoulder toward the north road home.",
            "choices": [
                make_choice("ch40_choice_1", "[결의/돌파]", "[Resolve]", "저는 영웅이 아닙니다. 약한 사람들의 곁에 서는 방패일 뿐입니다.", "I am no hero. I am merely a shield standing beside the vulnerable.", "“왕관을 정중히 사양하고 뒤돌아서자 도성 민중들이 눈물과 환호로 박수를 보냈다.”", "“Politely declining the crown, the square erupted into tears and heartfelt ovations.”", "sns", 50, "+50 SNS 획득", "+50 SNS Points", True),
                make_choice("ch40_choice_2", "[신중/통찰]", "[Insight]", "권력은 다시 부패를 낳습니다. 평화는 흙과 땀 속에 있습니다.", "Power breeds corruption anew. True peace abides in earth and honest sweat.", "“화려한 권좌를 내려놓고 방랑자의 배낭을 멘 카단의 눈빛은 맑고 평온했다.”", "“Strapping on the traveler's pack, Kadan's gaze shone clear and tranquil.”", "buff", 30, "[방랑자의 깨달음] 영구 평화 축복", "[Wanderer's Epiphany] Permanent Peace Blessing"),
                make_choice("ch40_choice_3", "[성진호흡/공명]", "[Resonance]", "실리아, 약속을 지켰구나. 정말로 봄이 왔다.", "Celia, we kept our promise. Spring has truly arrived.", "“봄바람에 흩날리는 들꽃 향기 속에서 두 사람은 미소를 지으며 북쪽 길을 걸었다.”", "“Amidst wildflower fragrance dancing on spring breezes, the two smiled and walked north.”", "sns", 50, "+50 SNS 획득", "+50 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "카단 & 아케인 에코즈 완결", "nameEn": "Kadan & Arcane Echoes Finale", "text": "눈보라 아래서 시작되었던 두 남자의 서약은 마침내 온 대륙에 따뜻한 봄빛을 선물하고 전설이 되었다.", "textEn": "The vow of two men begun in blizzard at last gifted warm spring across the land, blossoming into eternal legend."}
    ])
]

print("Loaded Chapters 31 to 40 successfully.")
