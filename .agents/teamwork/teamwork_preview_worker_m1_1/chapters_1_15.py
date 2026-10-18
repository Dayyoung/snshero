# Chapters 1 to 15 definitions

def make_choice(id_str, att, att_en, lbl_ko, lbl_en, follow_ko, follow_en, b_type, b_val, b_desc_ko, b_desc_en, is_def=False):
    return {
        "id": id_str,
        "attitude": att,
        "attitudeEn": att_en,
        "labelKo": lbl_ko,
        "labelEn": lbl_en,
        "followUpTextKo": follow_ko,
        "followUpTextEn": follow_en,
        "bonusType": b_type,
        "bonusValue": b_val,
        "bonusDescKo": b_desc_ko,
        "bonusDescEn": b_desc_en,
        "isDefault": is_def,
        "badge": att,
        "badgeEn": f"[{att_en.strip('[]')}]",
        "text": lbl_ko,
        "textEn": lbl_en,
        "reward": {
            "snsCoins": b_val if b_type == 'sns' else (50 if b_type == 'buff' else 30),
            "buff": "atk_boost" if att == "[결의/돌파]" else ("def_shield" if att == "[신중/통찰]" else "mana_surge"),
            "buffName": b_desc_ko,
            "buffNameEn": b_desc_en,
        },
        "followUpLine": follow_ko,
        "followUpLineEn": follow_en,
    }

CHAPTERS_1_15 = [
    # 1
    (1, [
        {"speaker": "narrator", "name": "제 1화: 눈보라 아래 두 서약", "nameEn": "Episode 1: Two Vows Beneath the Blizzard", "text": "라이트헤븐 왕국 남쪽 끝 엘윈 마을. 낮부터 쏟아진 눈발이 성벽과 지붕의 경계를 덮은 밤, 소문처럼 북쪽 섀도우렐름의 기병들이 국경을 넘어오고 있었다.", "textEn": "Elwin Village on the southern edge of Lighthaven. As snow blanketed walls and roofs, rumors proved true: northern Shadowrealm riders crossed the frozen frontier."},
        {"speaker": "speaker", "name": "알렉산다르", "nameEn": "Aleksandar", "cardId": 50, "text": "“발리안, 바람 소리에 피 냄새가 섞여 있네. 섀도우렐름의 정찰대인가, 아니면 왕궁의 사냥개인가.”", "textEn": "“Balian, the wind carries the scent of blood. Is it Shadowrealm scouts, or hounds sent from the palace?”"},
        {"speaker": "speaker", "name": "발리안", "nameEn": "Balian", "cardId": 43, "text": "“누구든 대장간 문턱을 넘는다면 내 아케인 창이 먼저 대답할 걸세. 아내들의 출산이 임박했으니 패전국의 밤을 더 더럽히게 둘 수 없네.”", "textEn": "“Whoever crosses this threshold will answer to my Arcane Spear. Our wives are in labor; we will not let this defeated night be defiled further.”"},
        {"speaker": "speaker", "name": "헤르쿨", "nameEn": "Hercul", "cardId": 49, "text": "“검을 거두게, 동지들! 나는 붉은 유리 궁정 섭정 데스나이트 아르투스의 숙청 명단을 쫓아 도망쳐 온 성기사 헤르쿨이다. 이 은빛 단검 두 자루를 받아다오.”", "textEn": "“Lower your blades, comrades! I am Paladin Hercul, fleeing Regent Artus's purge decree. Take these twin silver daggers for the children.”"},
        {
            "speaker": "choice", "name": "알렉산다르의 결의", "nameEn": "Aleksandar's Resolve", "cardId": 50,
            "text": "루시안의 암흑 기병들이 다리를 포위했다. 만삭인 아내들을 탈출시키기 위해 알렉산다르는 부서진 검을 쥐며 결단을 내린다.",
            "textEn": "Lucian's shadow riders surrounded the bridge. To buy time for their pregnant wives to flee, Aleksandar gripped his broken blade.",
            "choices": [
                make_choice("ch01_choice_1", "[결의/돌파]", "[Resolve]", "아버지의 방패는 결코 물러서지 않았다. 내가 다리 위를 지키겠다!", "A father's shield never retreats. I will hold this bridge alone!", "“방패를 굳게 쥐자 칼바람조차 비껴가는 묵직한 기운이 다리 위에 솟구쳤다.”", "“Gripping the shield firmly, an unyielding aura rose over the stone bridge, defying the freezing wind.”", "sns", 20, "+20 SNS 획득", "+20 SNS Points", True),
                make_choice("ch01_choice_2", "[신중/통찰]", "[Insight]", "적 기병들의 말발굽 소리를 헤아려야 한다. 우측 수로로 우회하자.", "We must gauge the enemy cavalry's pace. Divert through the right waterway.", "“침착하게 지형을 살피자 눈보라 속에 가려졌던 숨겨진 우회로가 드러났다.”", "“Observing the terrain calmly, a hidden drainage canal revealed itself beneath the blizzard.”", "buff", 25, "[약점 포착] 첫 턴 데미지 25% 경감", "[Tactical Insight] -25% First Turn DMG"),
                make_choice("ch01_choice_3", "[성진호흡/공명]", "[Resonance]", "눈보라 속에 깃든 서약을 기억하자. 단검의 룬에 숨결을 맞춘다.", "Remember the oath etched in the blizzard. Synchronize breath with the dagger's runes.", "“단검의 백은빛 룬이 온기를 품고 공명하며 차가운 밤공기를 녹여냈다.”", "“The silver rune on the dagger resonated with warm light, melting the bitter chill of the night.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "두 아버지의 서약", "nameEn": "Oath of Two Fathers", "text": "“태어날 아이들에게 이 단검을 주게. 복수를 떠넘기라는 뜻이 아니라, 불의와 거짓 앞에서 고개를 숙이지 말라는 뜻이다.”", "textEn": "“Give these daggers to our newborn children. Not to burden them with vengeance, but so they never bow before injustice and lies.”"}
    ]),

    # 2
    (2, [
        {"speaker": "narrator", "name": "제 2화: 일곱 추적자의 맹세", "nameEn": "Episode 2: Oath of the Seven Pursuers", "text": "세븐브릿지 항구 물류창고 부두. 부러진 황실 제식 검과 피 묻은 인장들이 어둠 속에서 진실의 조각을 드러내고 있었다.", "textEn": "Sevenbridge Harbor warehouse docks. Broken imperial regulation swords and bloodied crests revealed fragments of dark truths in the shadows."},
        {"speaker": "speaker", "name": "헤르쿨", "nameEn": "Hercul", "cardId": 49, "text": "“가웨인, 론돌! 무기를 거두어라! 우리는 서로를 죽이기 위해 이곳에 모인 것이 아니다!”", "textEn": "“Gawain, Rondol! Hold your blades! We did not gather here to spill each other's blood!”"},
        {"speaker": "speaker", "name": "가웨인", "nameEn": "Gawain", "cardId": 45, "text": "“알렉산다르의 부고를 들었다. 왕궁의 사냥개들이 그를 배신자로 몰았으나, 우리는 그가 누구보다 고결했음을 안다.”", "textEn": "“We heard of Aleksandar's fall. The palace labeled him a traitor, yet we know his honor was pure above all.”"},
        {"speaker": "speaker", "name": "구출된 고아 소녀", "nameEn": "Rescued Orphan Girl", "cardId": 70, "text": "“싸우지 마세요! 성기사 아저씨는 저를 불타는 집에서 구해준 은인이에요!”", "textEn": "“Please don't fight! This paladin saved me from the burning rubble!”"},
        {
            "speaker": "choice", "name": "추적자들의 결단", "nameEn": "Pursuers' Decision", "cardId": 49,
            "text": "오해가 풀린 창고 안. 일곱 명의 추방된 전사들이 알렉산다르의 남겨진 혈육을 지키기 위한 맹세를 나눈다.",
            "textEn": "Inside the quiet warehouse, seven exiled warriors prepared to take a solemn blood oath to protect Aleksandar's heir.",
            "choices": [
                make_choice("ch02_choice_1", "[결의/돌파]", "[Resolve]", "불의 앞에서는 황실의 칼날이라도 두려워하지 않겠다!", "Before injustice, we shall not fear even the imperial blade!", "“일곱 전사의 검극이 부딪치며 타오르는 불꽃 같은 결의가 피어올랐다.”", "“The blades of the seven warriors clashed in unison, igniting a resolve fierce as wildfire.”", "sns", 20, "+20 SNS 획득", "+20 SNS Points", True),
                make_choice("ch02_choice_2", "[신중/통찰]", "[Insight]", "무기를 거두고 비밀 장부를 대조해 진실을 밝히자.", "Sheathe our weapons and cross-examine the secret ledgers.", "“밀서의 서명을 대조하자 붉은 유리 궁정의 위조된 숙청 명령서가 입증되었다.”", "“Comparing the signatures verified Regent Artus's forged execution decree beyond doubt.”", "buff", 20, "[약점 포착] 치명타 확률 +15%", "[Weakspot Sight] +15% Critical Chance"),
                make_choice("ch02_choice_3", "[성진호흡/공명]", "[Resonance]", "의인들의 심장 고동은 거짓을 말하지 않는다.", "The heartbeats of righteous warriors never utter falsehood.", "“원소 마나가 부드럽게 감돌며 일곱 전사의 가슴에 신뢰의 징표를 새겼다.”", "“Elemental mana swirled gently, sealing unbroken trust in the hearts of the seven warriors.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "일곱 추적자의 서약", "nameEn": "Vow of the Seven Pursuers", "text": "“대륙의 끝까지 헤매더라도 알렉산다르의 아이를 찾아 방패가 되어 주리라.”", "textEn": "“Even if we must scour every corner of the Arcane continent, we shall find his child and be his shield.”"}
    ]),

    # 3
    (3, [
        {"speaker": "narrator", "name": "제 3화: 안개 절벽의 피", "nameEn": "Episode 3: Blood on the Mist Cliff", "text": "레드클리프 미스트폴 절벽의 고대 타이탄 신전. 보라색 독안개가 계곡을 메운 가운데, 나인섀도우 코덱스의 어둠 반쪽을 훔친 마수들이 매복해 있었다.", "textEn": "The ancient titan temple atop Mistfall Cliffs. As toxic purple fog choked the canyon, beasts carrying the stolen half of the Nine-Shadow Codex ambushed the hunters."},
        {"speaker": "speaker", "name": "벨페고르", "nameEn": "Belphegor", "cardId": 13, "text": "“크크크... 성기사의 잔당들이 냄새를 맡고 여기까지 기어왔구나! 안개 속에서 네놈들의 피를 전부 들이켜주마!”", "textEn": "“Hehehe... the remnants of the paladins crawled all the way here! Your blood will nourish the mist!”"},
        {"speaker": "speaker", "name": "로비냐드", "nameEn": "Robinyard", "cardId": 48, "text": "“가웨인, 코덱스를 챙겨라! 내 강철 와이어로 놈들의 발목을 묶겠다! 뒤돌아보지 마라!”", "textEn": "“Gawain, secure the Codex! I will snare their limbs with steel wire! Don't look back!”"},
        {"speaker": "speaker", "name": "메두사 고르고", "nameEn": "Medusa Gorgo", "cardId": 89, "text": "“어리석은 인간! 그 얄팍한 줄타기로 나의 석화 안개를 막을 수 있을 것 같으냐!”", "textEn": "“Foolish mortal! Did you think your thin cords could hold back my petrifying mist!”"},
        {
            "speaker": "choice", "name": "절벽 위의 혈투", "nameEn": "Clifftop Bloodshed", "cardId": 45,
            "text": "로비냐드가 마수와 함께 절벽 아래 심연으로 추락하려 한다. 동료들을 살리기 위한 마지막 선택이 눈앞에 닥친다.",
            "textEn": "Robinyard prepared to drag the beast into the abyss with him. A split-second choice faced the comrades.",
            "choices": [
                make_choice("ch03_choice_1", "[결의/돌파]", "[Resolve]", "절벽 난간을 방패로 막아 동료들의 퇴로를 열겠다!", "Brace the cliff ledge with our shields to secure the retreat!", "“방패의 빛기둥이 절벽 낙하를 가로막으며 가웨인과 동료들을 지켜냈다.”", "“A pillar of radiant light braced the collapsing ledge, escorting Gawain and the rest to safety.”", "buff", 15, "[수호 방벽] 방어력 +15%", "[Guardian Bulwark] +15% DEF", True),
                make_choice("ch03_choice_2", "[신중/통찰]", "[Insight]", "음파의 떨림을 읽는 고르고의 사각지대를 노리자.", "Exploit Medusa Gorgo's blind spot by dampening sound vibrations.", "“소리를 죽인 은밀한 보법으로 뱀머리 괴수의 시선을 분산시켰다.”", "“Silencing their footsteps completely threw off the serpentine beast's echolocation.”", "sns", 20, "+20 SNS 획득", "+20 SNS Points"),
                make_choice("ch03_choice_3", "[성진호흡/공명]", "[Resonance]", "로비냐드의 희생을 헛되이 하지 않겠다. 안개 속 기운을 감지한다.", "Robinyard's sacrifice shall not be in vain. Sift the air through Arcane Breath.", "“안개 너머로 숨겨진 바위 틈 통로가 선명한 백색 궤적으로 이어졌다.”", "“A hidden mountain trail carved through the mist revealed itself in brilliant white trails.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "로비냐드의 마지막 미소", "nameEn": "Robinyard's Final Smile", "text": "“아이를 지켜라... 그것이 우리가 남길 유일한 유산이다.”", "textEn": "“Guard the child... that is the only legacy worth leaving behind.”"}
    ]),

    # 4
    (4, [
        {"speaker": "narrator", "name": "제 4화: 황야에서 자란 아이", "nameEn": "Episode 4: The Child Raised in the Wastes", "text": "얼어붙은 황야 와일드랜드의 툰드라. 열 살이 된 카단은 어머니 엘윈의 텐트에서 장작을 패며 북방 늑대들의 울음소리를 듣고 자라났다.", "textEn": "The tundra of the frozen Wildlands. Ten-year-old Kadan chopped logs outside his mother's yurt, listening to the lonely howls of northern wolves."},
        {"speaker": "speaker", "name": "어머니 엘윈", "nameEn": "Mother Elwin", "cardId": 42, "text": "“카단, 손에 물집이 다 터졌구나. 아버지는 남을 지키기 위한 방패를 쥐었지, 증오로 칼을 휘두르지 않았단다.”", "textEn": "“Kadan, your hands are blistered raw. Your father carried a shield to defend others, never a sword forged in hatred.”"},
        {"speaker": "speaker", "name": "길가메시", "nameEn": "Gilgamesh", "cardId": 47, "text": "“얼음 강이 깨진다! 암살자들이 내 발목을 벴어... 저리 비켜라, 말려들게 하고 싶지 않다!”", "textEn": "“The ice is cracking! Assassins sliced my tendon... stay back, don't get dragged into this!”"},
        {"speaker": "speaker", "name": "카단", "nameEn": "Kadan", "cardId": 41, "text": "“내 등에 업혀! 쇄빙선처럼 얼음 위를 미끄러져 건너가면 늑대 무리도 따라오지 못해!”", "textEn": "“Climb on my back! If we glide across the sheet ice like a sled, the wolves won't catch us!”"},
        {
            "speaker": "choice", "name": "얼어붙은 강의 선택", "nameEn": "Choice on the Frozen River", "cardId": 41,
            "text": "얼음판이 쩍쩍 갈라지고 배후에서 섀도우 궁수들의 화살비가 쏟아진다. 카단은 부상당한 길가메시를 업은 채 속도를 낸다.",
            "textEn": "Fissures raced across the frozen river as shadow archers released a volley. Carrying wounded Gilgamesh, Kadan made his move.",
            "choices": [
                make_choice("ch04_choice_1", "[결의/돌파]", "[Resolve]", "피 흘리는 아이를 두고 도망치는 것은 부끄러운 일이다!", "Abandoning a bleeding child is a coward's deed!", "“이를 악물고 등을 대며 썰매처럼 빙판을 질주해 협곡 건너편에 안착했다.”", "“Gritting his teeth, Kadan slid across the ice like a sled, clearing the canyon safely.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points", True),
                make_choice("ch04_choice_2", "[신중/통찰]", "[Insight]", "얼음판의 균열을 피해 무게중심을 낮추고 미끄러지자.", "Lower our center of gravity and trace the ice fracture lines.", "“균열의 리듬을 타며 미끄러지자 쫓아오던 암살자들이 빙판 속으로 빠졌다.”", "“Following the fracture rhythm safely, the pursuers behind them plunged through the thin ice.”", "buff", 20, "[균형 유지] 턴 전환 보너스", "[Balance Mastery] Turn Flip Bonus"),
                make_choice("ch04_choice_3", "[성진호흡/공명]", "[Resonance]", "북풍의 맥박을 느끼며 설원 늑대처럼 달린다.", "Feel the pulse of the north wind and run with the tundra wolves.", "“설원의 대추장 펜리르가 바위 위에서 카단의 기백을 인정하며 울부짖었다.”", "“Tundra Chieftain Fenrir howled atop the bluff, bowing in respect to Kadan's valor.”", "sns", 20, "+20 SNS 획득", "+20 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "길가메시의 약속", "nameEn": "Gilgamesh's Promise", "text": "“내 목숨을 빚졌다, 카단. 훗날 네가 왕궁의 문을 두드릴 때 내가 네 창이 되어 주겠다.”", "textEn": "“I owe you my life, Kadan. When you knock upon the imperial gates, I shall be your spear.”"}
    ]),

    # 5
    (5, [
        {"speaker": "narrator", "name": "제 5화: 폭우 속의 유령", "nameEn": "Episode 5: Phantom in the Downpour", "text": "협곡 초소에 쏟아지는 사나운 폭우. 횃불은 빗물에 꺼지고, 진흙탕 속에서 투명한 살기를 품은 그림자 암살자가 다가오고 있었다.", "textEn": "A violent cloudburst assaulted the canyon outpost. Torches sputtered out in the mud, as an invisible phantom assassin closed in."},
        {"speaker": "speaker", "name": "가웨인", "nameEn": "Gawain", "cardId": 45, "text": "“카단, 눈을 감아라! 눈으로 보려 하면 적의 환영에 홀린다! 대지의 진동을 느껴라!”", "textEn": "“Kadan, close your eyes! If you rely on sight, illusions will deceive you! Feel the ground!”"},
        {"speaker": "speaker", "name": "그림자 암살자", "nameEn": "Phantom Assassin", "cardId": 51, "text": "“흐흐... 알렉산다르의 혈육을 빗속에서 익사시켜 주마. 아무도 네 비명을 듣지 못할 것이다.”", "textEn": "“Heh... Aleksandar's bloodline will drown in this deluge. No one will ever hear your screams.”"},
        {
            "speaker": "choice", "name": "진흙탕 속의 반격", "nameEn": "Riposte in the Mire", "cardId": 41,
            "text": "빗방울이 칼날에 부딪쳐 흩어지는 찰나의 순간. 카단은 낡은 가죽 방패를 들어 올려 살기의 궤적을 짚는다.",
            "textEn": "Raindrops shattered against an invisible blade. Kadan raised his battered buckler to meet the lethal vector.",
            "choices": [
                make_choice("ch05_choice_1", "[결의/돌파]", "[Resolve]", "빗속이라도 내 방패의 각도는 흔들리지 않는다!", "Even in blinding downpour, my shield angle never wavers!", "“빗줄기를 가르며 날아든 암살자의 비수를 정면에서 쳐내어 튕겨냈다.”", "“Deflecting the assassin's thrust head-on sent shockwaves through the curtain of rain.”", "buff", 20, "[빗길 방어] 반격 데미지 +20%", "[Rain Parrying] +20% Counter DMG", True),
                make_choice("ch05_choice_2", "[신중/통찰]", "[Insight]", "빗방울이 튀는 궤적을 보고 투명한 적의 위치를 파악한다.", "Track water splashes bouncing off the invisible phantom's mantle.", "“허공에서 빗방울이 부자연스럽게 꺾이는 지점을 향해 단검을 내질렀다.”", "“Striking the empty air where raindrops deflected revealed the cloaked phantom.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch05_choice_3", "[성진호흡/공명]", "[Resonance]", "폭우의 리듬과 호흡을 일치시켜 살기를 흘려보낸다.", "Synchronize breath with the thunderous rain to dissolve bloodlust.", "“자연의 비바람과 마나가 일치하자 살기 가득했던 적의 검이 빗물처럼 흩어졌다.”", "“Harmonizing mana with nature washed the assassin's killing intent harmlessly away.”", "sns", 20, "+20 SNS 획득", "+20 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "폭우가 갠 협곡", "nameEn": "Dawn Over the Gorge", "text": "진흙탕에 쓰러진 자는 암살자였다. 폭우가 잦아들자 카단의 방패 위로 새벽빛이 스며들었다.", "textEn": "It was the assassin who lay motionless in the mud. As clouds parted, morning light kissed Kadan's shield."}
    ]),

    # 6
    (6, [
        {"speaker": "narrator", "name": "제 6화: 별을 호흡하는 법", "nameEn": "Episode 6: The Art of Breathing Stars", "text": "마나 동굴 최정상 설산 빙벽. 보름달 아래 은둔 고수 말푸온이 홀로 앉아 밤하늘의 성운을 호흡하고 있었다.", "textEn": "The crystalline peak above the Mana Caves. Beneath a full moon, hermit master Malfuon breathed the shimmering starlight."},
        {"speaker": "speaker", "name": "말푸온", "nameEn": "Malfuon", "cardId": 66, "text": "“여섯 스승에게서 배운 초식들이 네 가슴속에서 서로를 물어뜯고 있구나. 검과 방패, 마나의 호흡이 어긋나면 결국 스스로를 파괴할 뿐이다.”", "textEn": "“Forms taught by six masters are tearing at your core. When sword, shield, and breath conflict, ruin follows.”"},
        {"speaker": "speaker", "name": "카단", "nameEn": "Kadan", "cardId": 41, "text": "“가슴이 타는 듯 답답합니다. 방패를 세우면 검이 멈추고, 검을 뻗으면 방패가 비어버립니다.”", "textEn": "“My chest burns with friction. When I raise my shield, the sword falters; when I thrust, my flank is bare.”"},
        {
            "speaker": "choice", "name": "성진호흡법 전수", "nameEn": "Passing of Star Breathing", "cardId": 41,
            "text": "빙벽 절벽 끝, 칼바람이 살을 에는 곳에서 말푸온이 카단의 가슴에 손을 얹고 성진의 맥박을 일깨운다.",
            "textEn": "At the brink of the frozen abyss, Malfuon placed his hand over Kadan's heart to awaken stellar cadence.",
            "choices": [
                make_choice("ch06_choice_1", "[결의/돌파]", "[Resolve]", "피투성이가 되더라도 이 절벽을 오르고야 말겠다!", "Even if bloodied raw, I will conquer this frozen pinnacle!", "“손끝이 터지는 고통을 딛고 절벽 끝에 서자 가슴의 마나 정체가 뚫렸다.”", "“Overcoming searing pain to stand atop the crag unblocked all stagnant mana pathways.”", "sns", 20, "+20 SNS 획득", "+20 SNS Points", True),
                make_choice("ch06_choice_2", "[신중/통찰]", "[Insight]", "스승들의 가르침은 대립이 아니라 계절의 순환이었다.", "The masters' teachings were not in conflict, but a cycle of seasons.", "“여섯 가지 초식이 봄과 겨울처럼 맞물리며 온전한 원을 그리기 시작했다.”", "“Six combat doctrines meshed like spring and winter, completing an unbroken circle.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch06_choice_3", "[성진호흡/공명]", "[Resonance]", "밤하늘의 샛별을 들이쉬고, 대지로 눈송이를 돌려보낸다.", "Inhale the morning star from heaven; exhale snowflakes back to earth.", "“가슴속 깊은 곳에서 아케인 성진호흡의 백색 파문이 찬란하게 각성했다.”", "“A brilliant white wave of Arcane Star Breathing awakened deep within Kadan's core.”", "buff", 20, "[성진 공명] 마나 공격력 +20%", "[Astral Resonance] +20% Mana ATK")
            ]
        },
        {"speaker": "quote", "name": "말푸온의 감탄", "nameEn": "Malfuon's Wonder", "text": "“성진호흡법(Star Breathing)의 완성이다. 이제 네 방패는 대륙의 별들을 품게 될 것이다.”", "textEn": "“The Art of Breathing Stars is complete. Henceforth, your shield cradles the constellations.”"}
    ]),

    # 7
    (7, [
        {"speaker": "narrator", "name": "제 7화: 배신자들의 천막", "nameEn": "Episode 7: The Traitors Camp", "text": "남부 국경 인근 반역 부족의 대형 천막 막사. 섭정 아르투스의 밀사와 결탁해 아케인 무기와 피난민들을 노예로 팔아넘기던 배신자들의 소굴이었다.", "textEn": "The sprawling pavilions of a rogue clan near the border. Here, turncoats traded Arcane weaponry and innocent refugees to Regent Artus's envoys."},
        {"speaker": "speaker", "name": "반역자 족장", "nameEn": "Rebel Chieftain", "cardId": 87, "text": "“크크, 아르투스 섭정께서 약조하신 황금 삼천 냥만 주신다면 북방 피난민 꼬마들은 모조리 노예로 넘겨드리겠소.”", "textEn": "“Heh, so long as Regent Artus delivers the promised gold, all northern refugee youths are yours to bind.”"},
        {"speaker": "speaker", "name": "펜리르", "nameEn": "Fenrir", "cardId": 81, "text": "“더러운 놈들! 늑대의 피를 타고난 자가 동족을 적국의 감옥에 팔아넘기다니!”", "textEn": "“Filthy vermin! One born with wolf blood selling his own kind into imperial dungeons!”"},
        {
            "speaker": "choice", "name": "불타는 천막의 심판", "nameEn": "Judgment in the Burning Pavilions", "cardId": 41,
            "text": "천막에 불길이 번지고 위조된 황실 칙령이 탁자 위에 놓여 있다. 카단은 방패를 쥐고 배신자들의 수괴를 향해 돌진한다.",
            "textEn": "Flames engulfed the tents, illuminating forged imperial warrants on the table. Shield in hand, Kadan charged.",
            "choices": [
                make_choice("ch07_choice_1", "[결의/돌파]", "[Resolve]", "배신자들의 불의를 좌시할 수 없다. 정면으로 천막을 부순다!", "I will not tolerate traitors' injustice. Smash through the main pavilion!", "“방패로 천막 기둥을 박살 내자 배신자들의 진형이 산산조각 났다.”", "“Shattering the center tent pole brought the pavilion crashing down onto the conspirators.”", "sns", 20, "+20 SNS 획득", "+20 SNS Points", True),
                make_choice("ch07_choice_2", "[신중/통찰]", "[Insight]", "루시안의 밀서를 먼저 확보해 퇴로를 차단하자.", "Secure Lucian's forged documents first to seal their escape route.", "“금고 속 비밀 서신을 손에 넣으며 배신자들의 모든 음모를 무력화했다.”", "“Seizing the ledger from the iron chest dismantled their network in one fell swoop.”", "buff", 20, "[기습 간파] 적 공격력 15% 약화", "[Plot Unveiled] -15% Enemy ATK"),
                make_choice("ch07_choice_3", "[성진호흡/공명]", "[Resonance]", "바람을 일으켜 불길을 역풍으로 되돌린다.", "Summon Arcane gusts to redirect the flames against the traitors.", "“성진호흡의 역풍이 불길을 되돌려 갇혀 있던 피난민들을 무사히 구출했다.”", "“A gust of Star Breathing turned the fire back, shielding the caged captives safely.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "카단의 일갈", "nameEn": "Kadan's Rebuke", "text": "“피난민들의 눈물로 산 황금은 결국 네놈들의 무덤 흙이 될 뿐이다.”", "textEn": "“The gold bought with refugee tears will serve only as dirt over your graves.”"}
    ]),

    # 8
    (8, [
        {"speaker": "narrator", "name": "제 8화: 붉은 갈기의 기수", "nameEn": "Episode 8: Rider of the Crimson Mane", "text": "페가수스 계곡의 마시장. 난폭하여 누구도 안장을 얹지 못한 야생마 '적갈기'가 쇠사슬에 묶여 날뛰고 있었고, 그 곁에서 곡물 도둑 누명을 쓴 실리아가 끌려가고 있었다.", "textEn": "The horse bazaar in Pegasus Valley. An untamable steed named 'Crimson Mane' thrashed against chains, beside young Celia accused of horse theft."},
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“놓으라고, 이 악덕 상인 놈들아! 난 저 야생마가 굶어 쓰러지려 하길래 당근 한 자루 건넸을 뿐이야!”", "textEn": "“Let go, you swindlers! I only gave the starving horse a basket of carrots!”"},
        {"speaker": "speaker", "name": "마적단 두목", "nameEn": "Horse Thief Boss", "cardId": 71, "text": "“시끄럽다! 적갈기마를 훔치려 한 계집년과 함께 암시장에 팔아치우겠다!”", "textEn": "“Quiet! We will auction you off at the black market alongside this untamable brute!”"},
        {
            "speaker": "choice", "name": "적갈기마와의 교감", "nameEn": "Bond with the Crimson Mane", "cardId": 41,
            "text": "흥분한 적갈기마가 앞발을 들며 마구간 기둥을 걷어찬다. 카단은 성진호흡의 온기를 손바닥에 품고 군마의 콧등으로 다가선다.",
            "textEn": "The frenzied stallion reared up, kicking wooden beams. Channelling Star Breathing into his palm, Kadan stepped forward.",
            "choices": [
                make_choice("ch08_choice_1", "[결의/돌파]", "[Resolve]", "쇠사슬을 끊어라! 자유롭게 달릴 자격이 있는 말이다.", "Sever the iron chains! This steed deserves to gallop free.", "“사슬이 끊어지자 적갈기마가 카단의 곁에서 위엄 있는 울음소리를 터뜨렸다.”", "“As chains shattered, Crimson Mane neighed with regal pride at Kadan's side.”", "buff", 20, "[적갈기 돌격] 선공권 및 스피드 +20%", "[Crimson Charge] +20% Speed & Priority", True),
                make_choice("ch08_choice_2", "[신중/통찰]", "[Insight]", "소녀의 짚신 자국과 도둑의 나막신 자국을 비교해 보시오.", "Compare the girl's straw sandals with the thieves' wooden clogs.", "“진짜 마적단의 흙탕물 발자국이 밝혀져 상인들이 고개를 숙였다.”", "“Exposing the mud-caked clogs of the actual thieves silenced the corrupt merchants.”", "sns", 20, "+20 SNS 획득", "+20 SNS Points"),
                make_choice("ch08_choice_3", "[성진호흡/공명]", "[Resonance]", "군마의 심장박동에 내 숨결을 포갠다.", "Blend my heartbeat with the wild pulse of this great stallion.", "“적갈기마가 온순하게 고개를 숙이며 카단의 어깨에 콧등을 비볐다.”", "“Crimson Mane lowered his proud head gently, nuzzling Kadan's shoulder in kinship.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“헤헤, 시골 무사님치고는 제법인데? 난 도성 최고의 정보원 실리아야. 빚은 꼭 갚을게!”", "textEn": "“Hehe, not bad for a wanderer! I'm Celia, the sharpest ears in the capital. I never forget a debt!”"}
    ]),

    # 9
    (9, [
        {"speaker": "narrator", "name": "제 9화: 거지 옷의 바람", "nameEn": "Episode 9: Wind in Beggars Clothes", "text": "남부 제국 국경 관문. 루시안 총독의 철갑 경비병들이 모든 행인의 소지품을 뒤지며 성기사 잔당을 색출하고 있었다.", "textEn": "Southern Imperial border checkpoint. Governor Lucian's ironclad guards ransacked travelers' bags, searching for paladin remnants."},
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“카단, 그 반짝이는 방패는 볏짚 속에 숨겨! 이 누더기 옷을 걸치고 술 취한 거지 행세를 해야 통과할 수 있어.”", "textEn": "“Kadan, bury that shiny shield under straw! Put on these ragged tatters and stumble like a drunk beggar.”"},
        {"speaker": "speaker", "name": "국경 경비대장", "nameEn": "Border Guard Captain", "cardId": 51, "text": "“거지 놈들! 짐수레 속 짚더미를 창으로 찔러 확인해라! 쥐새끼 한 마리도 살려 보내지 마라!”", "textEn": "“You beggars! Jam your spears into the hay cart! Let not a single rat slip past!”"},
        {
            "speaker": "choice", "name": "검문소 통과", "nameEn": "Bypassing the Gate", "cardId": 41,
            "text": "창끝이 볏짚 속 방패 모서리에 닿기 직전. 억울하게 끌려가는 농민의 어린 딸이 울음을 터뜨린다.",
            "textEn": "The spearpoint reached for the shield hidden in straw, while a farmer's weeping daughter was dragged away.",
            "choices": [
                make_choice("ch09_choice_1", "[결의/돌파]", "[Resolve]", "억울하게 끌려가는 농민을 보면 방패를 꺼낼 수밖에 없다.", "Seeing innocent farmers dragged away, I cannot keep my shield hidden.", "“누더기 옷 속에서 뿜어져 나온 기백에 위병들이 기겁하며 길을 비켰다.”", "“The blazing spirit erupting from beneath rags made guards recoil in fright.”", "sns", 20, "+20 SNS 획득", "+20 SNS Points", True),
                make_choice("ch09_choice_2", "[신중/통찰]", "[Insight]", "거지 옷의 냄새와 비틀거리는 걸음으로 의심을 피하자.", "Use foul beggar rags and drunken stumbles to divert suspicion.", "“능청스러운 연기로 경비병들의 주의를 돌려 검문소를 무사히 빠져나왔다.”", "“Flawless street acting distracted the sentries, securing clean passage through the gates.”", "buff", 20, "[은밀 잠입] 첫 턴 피격 회피", "[Stealth Infiltration] Evade 1st Turn Attack"),
                make_choice("ch09_choice_3", "[성진호흡/공명]", "[Resonance]", "바람 마나로 위병들의 귓가에 헛소문을 흘려보낸다.", "Send misleading wind whispers into the sentries' ears.", "“동쪽 성문에 밀수선이 나타났다는 귓속말 바람에 경비대가 흩어졌다.”", "“A breeze carrying rumors of contraband ships sent the checkpoint guards scattering.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "남쪽 제국로의 바람", "nameEn": "Breeze of the Southern Road", "text": "누더기 옷을 걸쳤으되 그의 눈빛은 누구보다 높고 푸른 하늘을 품고 있었다.", "textEn": "Though clad in rags, his gaze carried the unbroken azure of the highest sky."}
    ]),

    # 10
    (10, [
        {"speaker": "narrator", "name": "제 10화: 불꽃 궁정의 포로", "nameEn": "Episode 10: Prisoner of the Flame Court", "text": "도성 붉은 유리 궁정의 지하 연회장. 바닥을 이루는 붉은 유리창 아래로 고문당하는 성기사 발리안이 보이고, 옥좌 앞에서는 황자 이그니스의 순백 불꽃 시험이 벌어지고 있었다.", "textEn": "The grand banquet hall of the Red Glass Palace. Beneath the red glass floor lay tortured Paladin Balian, while Prince Ignis demonstrated his pure white flame trial."},
        {"speaker": "speaker", "name": "황자 이그니스", "nameEn": "Prince Ignis", "cardId": 11, "text": "“섭정 아르투스, 어째서 내 불꽃은 당신들의 칠흑 마법과 섞이지 않는 겁니까! 유리 바닥 아래 갇힌 저 포로는 누구입니까!”", "textEn": "“Regent Artus, why will my flame not merge with your abyssal magic! Who is that prisoner trapped beneath the glass!”"},
        {"speaker": "speaker", "name": "루시안", "nameEn": "Lucian", "cardId": 61, "text": "“황자님, 반역자의 얼굴 따위는 신경 쓸 필요 없습니다. 내일 투기장에서 승리하여 황실의 무력을 증명하십시오.”", "textEn": "“My Prince, pay no heed to a doomed traitor. Tomorrow you will prove the empire's might in the arena.”"},
        {"speaker": "speaker", "name": "이셀라", "nameEn": "Ysela", "cardId": 107, "text": "“머리가... 깨질 듯 아파... 눈보라 치던 밤... 내가 안고 있던 아기는 어디로 간 거지...?”", "textEn": "“My head aches so violently... that blizzard night... where did the child in my arms go...?”"},
        {
            "speaker": "choice", "name": "유리 궁정의 잠입", "nameEn": "Infiltration of the Glass Palace", "cardId": 41,
            "text": "궁정 하인으로 변장해 진입한 카단. 유리창 밑 발리안 숙부의 부러진 창끝과 기억을 잃은 이셀라 부인이 보인다.",
            "textEn": "Disguised as a palace server, Kadan caught sight of Uncle Balian's broken spear and amnesiac Lady Ysela.",
            "choices": [
                make_choice("ch10_choice_1", "[결의/돌파]", "[Resolve]", "지금 당장 저 유리 바닥을 깨고 숙부님을 구해야 한다!", "Shatter the glass floor right now to save Uncle Balian!", "“방패를 쥐며 참을 수 없는 분노의 투기가 솟구쳤으나 실리아가 손을 잡아당겼다.”", "“Righteous fury surged through Kadan's knuckles before Celia pulled him back into shadow.”", "buff", 25, "[분노의 일격] 공격력 +25%", "[Wrathful Strike] +25% ATK", True),
                make_choice("ch10_choice_2", "[신중/통찰]", "[Insight]", "실리아의 말대로 환기구 구조를 먼저 파악해야 한다.", "Heed Celia's advice and map the underground ventilation shafts.", "“지하 수로와 연결된 배수 격자 통로를 정확히 파악해 탈출로를 확보했다.”", "“Pinpointing the drainage grates connected to city aqueducts secured a covert rescue path.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch10_choice_3", "[성진호흡/공명]", "[Resonance]", "아주머니, 눈보라 치던 밤의 서약을 기억하십니까.", "My lady, do you remember the vow made beneath the blizzard?", "“은빛 단검의 룬 온기가 닿자 이셀라의 눈가에 흐릿한 눈물이 흘러내렸다.”", "“Touching the dagger's warm rune brought tears to Lady Ysela's clouded eyes.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "카단의 다짐", "nameEn": "Kadan's Vow", "text": "“이그니스, 너는 내 적이 아니다. 내일 투기장에서 너에게 진실을 보여주마.”", "textEn": "“Ignis, you are not my enemy. Tomorrow in the arena, I will show you the truth.”"}
    ]),

    # 11
    (11, [
        {"speaker": "narrator", "name": "제 11화: 기억을 깨우는 단검", "nameEn": "Episode 11: The Dagger That Wakes Memory", "text": "도성 황실 콜로세움 원형 투기장. 십만 관중의 환호 속에서 황자 이그니스의 순백 불꽃 창과 방랑 검사 카단의 가죽 방패가 마침내 격돌했다.", "textEn": "The Imperial Colosseum arena. Amidst roaring cheers from a hundred thousand spectators, Prince Ignis's white flame spear clashed with Kadan's shield."},
        {"speaker": "speaker", "name": "황자 이그니스", "nameEn": "Prince Ignis", "cardId": 11, "text": "“네 방패는 궁정의 어떤 기사보다 견고하구나! 하지만 내 백색 화염은 모든 거짓을 태워버린다!”", "textEn": "“Your shield is sturdier than any royal knight's! But my white fire burns through all falsehood!”"},
        {"speaker": "speaker", "name": "카단", "nameEn": "Kadan", "cardId": 41, "text": "“이그니스! 네 불꽃은 파괴를 위한 것이 아니다! 품속의 은빛 단검을 보아라!”", "textEn": "“Ignis! Your flame was never born for slaughter! Look at the silver dagger in your tunic!”"},
        {
            "speaker": "choice", "name": "투기장의 공명", "nameEn": "Resonance in the Arena", "cardId": 41,
            "text": "불꽃 창과 방패가 맞부딪치는 순간. 카단은 품속에서 알렉산다르의 단검을 꺼내어 이그니스의 단검과 교차시킨다.",
            "textEn": "As spear struck shield, Kadan drew Aleksandar's twin silver dagger and crossed it against Ignis's blade.",
            "choices": [
                make_choice("ch11_choice_1", "[결의/돌파]", "[Resolve]", "이그니스! 네 불꽃은 파괴가 아니라 생명을 지키기 위한 것이다!", "Ignis! Your fire was meant to defend life, not cause slaughter!", "“방패로 백색 화염을 감싸 안으며 이그니스의 창끝을 멈춰 세웠다.”", "“Cradling the white flame within the shield brought Ignis's spear to an abrupt halt.”", "buff", 25, "[결의의 방벽] 화염 내성 +25%", "[Flame Barrier] +25% Fire RES", True),
                make_choice("ch11_choice_2", "[신중/통찰]", "[Insight]", "검날이 교차하는 순간 단검의 룬 각인을 보여주겠다.", "Show the matching rune engravings as our daggers cross.", "“쌍둥이 단검의 룬이 맞물리자 투기장 전체에 순백의 빛이 쏟아져 내렸다.”", "“Interlocking the twin runes cast a celestial light across the entire colosseum.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch11_choice_3", "[성진호흡/공명]", "[Resonance]", "백색 화염과 아케인 방패의 공명 파문을 일으킨다.", "Unleash a resonant shockwave merging white fire and Arcane shield.", "“화염과 방패가 하나의 호흡으로 엮이며 이그니스의 닫힌 기억을 일깨웠다.”", "“The fusion of fire and shield ignited the dormant memories sealed within Ignis.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "이그니스의 눈물", "nameEn": "Ignis's Tears", "text": "“단검의 문양이... 똑같다... 내 진짜 아버지가 저 감옥에 갇힌 성기사 발리안이란 말인가...!”", "textEn": "“The dagger's crest... is identical... My true father was Paladin Balian all along...!”"}
    ]),

    # 12
    (12, [
        {"speaker": "narrator", "name": "제 12화: 두 무덤 사이의 봄", "nameEn": "Episode 12: Spring Between Two Graves", "text": "성기사단 추모 예배당 묘원. 부서진 비석들 사이에 들꽃이 피어난 이곳에, 섭정의 비밀 마도 공성 골렘들이 습격해 왔다.", "textEn": "The Paladins' Memorial Chapel cemetery. Wildflowers bloomed amidst broken headstones, where the Regent's secret Magitech Golems ambushed the mourning party."},
        {"speaker": "speaker", "name": "발리안", "nameEn": "Balian", "cardId": 43, "text": "“알렉산다르... 자네 곁에 묻힌 전우들의 묘비 앞에서 내 아들과 조카를 다시 만났네. 피눈물 나는 세월이었으나 봄은 결코 오지 않는 법이 없더군.”", "textEn": "“Aleksandar... before the graves of our comrades, I meet my son and nephew once more. Bitter years they were, yet spring never fails to arrive.”"},
        {"speaker": "speaker", "name": "헤르쿨", "nameEn": "Hercul", "cardId": 49, "text": "“적의 기갑 골렘들이 묘비를 부수려 한다! 카단, 이그니스! 전우들의 영혼을 지켜라!”", "textEn": "“Armored golems are targeting the grave markers! Kadan, Ignis! Protect the resting souls!”"},
        {
            "speaker": "choice", "name": "묘원의 수호전", "nameEn": "Defense of the Cemetery", "cardId": 41,
            "text": "거대한 강철 철퇴가 묘비를 향해 떨어진다. 카단은 양손으로 방패를 받치며 선열들의 안식을 지킨다.",
            "textEn": "A massive steel flail hurtled toward the memorial headstone. Kadan braced his buckler with both arms.",
            "choices": [
                make_choice("ch12_choice_1", "[결의/돌파]", "[Resolve]", "영웅들의 묘비를 더럽히게 두지 않겠다!", "I will not let heroes' headstones be desecrated!", "“거대 철퇴를 방패로 밀어내며 골렘의 강철 장갑을 박살 냈다.”", "“Parrying the giant flail shattered the golem's armored forearms to scrap.”", "buff", 20, "[성지 수호] 파티 방어막 강화", "[Sanctuary Defense] Party Shield Up", True),
                make_choice("ch12_choice_2", "[신중/통찰]", "[Insight]", "골렘의 마나 동력핵 위치를 집중 타격하자.", "Focus strikes directly upon the golem's exposed mana core.", "“동력선의 결함을 짚어내자 세 대의 골렘이 동시에 동력을 잃고 멈췄다.”", "“Severing the exposed conduit line shut down three golems simultaneously.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch12_choice_3", "[성진호흡/공명]", "[Resonance]", "선열들의 잔향이 깃든 대지에서 기도를 올린다.", "Offer silent prayers to the earth holding our forefathers' spirits.", "“대지에서 피어난 백은빛 마나가 상처 입은 동료들의 기력을 온화하게 치유했다.”", "“Silver mana rising from the soil restored weary bodies with spring vigor.”", "sns", 20, "+20 SNS 획득", "+20 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "묘비 사이의 맹세", "nameEn": "Vow Between the Graves", "text": "묘비에 튄 적의 기름때를 닦아내자, 두 무덤 사이에 푸른 제비꽃이 고개를 들었다.", "textEn": "Wiping machine oil from the stone, a solitary violet raised its head between the two graves."}
    ]),

    # 13
    (13, [
        {"speaker": "narrator", "name": "제 13화: 녹옥 지팡이의 주인", "nameEn": "Episode 13: Master of the Jade Staff", "text": "태호 비스트랜드의 녹옥 의회 성소. 천년 고목 사이로 맹수 부족들의 대추장 레오나르가 녹옥 지팡이를 짚은 채 침입자들을 노려보았다.", "textEn": "The Jade Council Grove in Taiho Beastlands. Amidst ancient trees, Great Chief Leonar leaned upon his Jade Staff, studying the travelers."},
        {"speaker": "speaker", "name": "대추장 레오나르", "nameEn": "Grand Chief Leonar", "cardId": 86, "text": "“인간들은 늘 배신과 탐욕으로 숲을 불태웠다. 너희가 붉은 유리 궁정의 간첩이 아니라는 증거가 어디 있느냐!”", "textEn": "“Humans always torched our canopies with greed and treachery. What proof proves you are not the Regent's spies!”"},
        {"speaker": "speaker", "name": "실리아", "nameEn": "Celia", "cardId": 62, "text": "“레오나르 대추장님, 카단은 북방 피난민들을 지킨 방패예요! 탐욕스러운 귀족들과는 근본부터 달라요!”", "textEn": "“Chief Leonar, Kadan is the shield who protected northern refugees! He is nothing like those corrupt nobles!”"},
        {
            "speaker": "choice", "name": "녹옥 지팡이의 시험", "nameEn": "Trial of the Jade Staff", "cardId": 41,
            "text": "레오나르가 녹옥 지팡이를 바닥에 내리치자 숲의 정령수들이 포효하며 카단을 시험한다.",
            "textEn": "Leonar struck the earth with the Jade Staff, prompting primordial treants to roar and test Kadan.",
            "choices": [
                make_choice("ch13_choice_1", "[결의/돌파]", "[Resolve]", "종족의 편견을 넘어 정의의 연합을 이루겠다!", "Transcend racial prejudice to forge a grand alliance of justice!", "“정면에서 맹수의 돌격을 방패로 받아내며 흔들림 없는 의기를 증명했다.”", "“Bracing against the beast charge with unyielding honor won the clan's awe.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points", True),
                make_choice("ch13_choice_2", "[신중/통찰]", "[Insight]", "녹옥 지팡이에 얽힌 고대 결계의 균열을 분석하자.", "Analyze the fractures in the ancient barrier bound to the staff.", "“지팡이의 마력 흐름을 바로잡아 숲의 침식된 오염을 정화해 주었다.”", "“Stabilizing the staff's leyline cleansed the festering blight within the grove.”", "buff", 20, "[마법 간파] 마법 방어력 +20%", "[Arcane Sight] +20% Magic DEF"),
                make_choice("ch13_choice_3", "[성진호흡/공명]", "[Resonance]", "비스트 숲의 정령들과 조화로운 교감을 나눈다.", "Harmonize in gentle resonance with the beast spirits of the woods.", "“풀잎과 바람의 마나가 조화를 이루자 사나운 맹수들이 온순하게 앉았다.”", "“As flora and wind joined in harmony, fierce predators sat peacefully around him.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "speaker", "name": "대추장 레오나르", "nameEn": "Grand Chief Leonar", "cardId": 86, "text": "“크하하! 마음에 들었다! 이 손을 잡아라, 성기사의 아들아. 비스트 클랜의 도끼가 네 방패와 함께하겠다!”", "textEn": "“Bwahaha! I like your heart! Take my hand, paladin's son. The axes of the Beast Clan stand with your shield!”"}
    ]),

    # 14
    (14, [
        {"speaker": "narrator", "name": "제 14화: 안개 호수의 손님들", "nameEn": "Episode 14: Guests of the Mist Lake", "text": "태호 호수 위 짙은 수무. 론돌의 나룻배 선단이 호수를 건너는 도중, 수로를 장악한 가면 쓴 호수 해적들이 나타났다.", "textEn": "Heavy mist over Taiho Lake. As Rondol guided skiffs across calm waters, masked lake corsairs emerged from the fog."},
        {"speaker": "speaker", "name": "론돌", "nameEn": "Rondol", "cardId": 46, "text": "“물살이 심상치 않다! 수중 갈고리가 배 밑바닥을 긁고 있어! 적선 세 척이 안개 속에서 포위해 온다!”", "textEn": "“The currents are unnatural! Grappling hooks are tearing our hulls! Three raider skiffs surround us!”"},
        {"speaker": "speaker", "name": "가면 해적선장", "nameEn": "Masked Corsair", "cardId": 89, "text": "“배 위에 실린 보물과 피난민들을 넘겨라! 물에 빠져 물귀신 밥이 되고 싶지 않다면!”", "textEn": "“Surrender your cargo and captives, unless you fancy feeding the lake wraiths below!”"},
        {
            "speaker": "choice", "name": "호수 위의 교전", "nameEn": "Battle on the Mist Lake", "cardId": 41,
            "text": "나룻배가 기우뚱하고 적의 갈고리 줄이 빗발친다. 카단은 물살의 반동을 이용해 결단을 내린다.",
            "textEn": "The skiff tilted steeply as boarding hooks rattled. Kadan utilized the boat's momentum to retaliate.",
            "choices": [
                make_choice("ch14_choice_1", "[결의/돌파]", "[Resolve]", "물살을 가르며 적 기함으로 뛰어올라 제압한다!", "Leap across the wake straight onto the enemy flagship!", "“나룻배에서 적함으로 단숨에 도약해 해적 선장의 칼을 쳐내었다.”", "“Vaulting across hulls, Kadan disarmed the corsair captain with one shield blow.”", "buff", 20, "[승선 돌격] 첫 공격 치명타", "[Boarding Assault] 1st Strike Crit", True),
                make_choice("ch14_choice_2", "[신중/통찰]", "[Insight]", "안개 속 노 젓는 소리로 적선의 위치를 산출하자.", "Triangulate the raiders' positions by listening to rhythmic oar splashes.", "“소리의 간격을 계산해 적선들을 서로 충돌하게 유도했다.”", "“Timing the echoes tricked the corsair boats into colliding in the fog.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch14_choice_3", "[성진호흡/공명]", "[Resonance]", "론돌의 물결 파도에 맞춰 방패의 반발력을 싣는다.", "Channel shield repulsion in rhythm with Rondol's tidal waves.", "“호수 전체에 잔잔한 수호 파문이 퍼지며 해적들의 배를 밀어냈다.”", "“A protective ripple surged across the surface, pushing the raiders back safely.”", "sns", 20, "+20 SNS 획득", "+20 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "태호 호수의 아침", "nameEn": "Morning on Taiho Lake", "text": "안개가 걷히자 호수 해적들은 무기를 버리고 론돌의 깃발 아래 무릎을 꿇었다.", "textEn": "As the mist lifted, the corsairs dropped their weapons, kneeling beneath Rondol's standard."}
    ]),

    # 15
    (15, [
        {"speaker": "narrator", "name": "제 15화: 독사와 사자의 밤", "nameEn": "Episode 15: Night of Serpent and Lion", "text": "비스트 클랜 요새의 대연회장. 화기애애하던 동맹 축하연의 술잔에 벨페고르의 독사 암살단이 은밀히 독을 탔다.", "textEn": "The grand feast hall of the Beast Stronghold. Into festive wine cups, Belphegor's Viper assassins secretly dripped lethal poison."},
        {"speaker": "speaker", "name": "대추장 레오나르", "nameEn": "Grand Chief Leonar", "cardId": 86, "text": "“크윽... 술에 사비아 독이... 다리에 힘이 풀린다... 문을 닫아라! 천장에서 암살자들이 쏟아진다!”", "textEn": "“Ugh... Sabia venom in the wine... my knees buckle... Bar the gates! Assassins drop from rafters!”"},
        {"speaker": "speaker", "name": "벨페고르", "nameEn": "Belphegor", "cardId": 13, "text": "“크하하! 사자왕도 독침 한 방이면 고깃덩어리에 불과하지! 오늘 밤 이 요새를 피바다로 만들겠다!”", "textEn": "“Bwahaha! Even the Lion King is mere meat before venom! This hall will run red tonight!”"},
        {
            "speaker": "choice", "name": "연회장 문의 결전", "nameEn": "Stand at the Hall Doors", "cardId": 41,
            "text": "독침이 비 오듯 쏟아지고 중독된 전사들이 쓰러진다. 카단은 레오나르의 등을 맞대고 대연회장 문 앞을 가로막는다.",
            "textEn": "Venomous darts rained down as warriors fell paralyzed. Back-to-back with Leonar, Kadan blocked the doorway.",
            "choices": [
                make_choice("ch15_choice_1", "[결의/돌파]", "[Resolve]", "사자왕의 뒤는 내가 지킨다! 독침은 방패로 막아내라!", "I have the Lion King's back! Deflect every dart with the shield!", "“방패의 회전각으로 수백 발의 독침을 모조리 튕겨내며 문을 사수했다.”", "“Whirling the buckler deflected hundreds of venomous needles, securing the threshold.”", "buff", 25, "[사자의 포효] 공격력 +25%", "[Lion's Roar] +25% ATK", True),
                make_choice("ch15_choice_2", "[신중/통찰]", "[Insight]", "연회장 기둥에 걸린 해독초 주머니를 먼저 확보하자.", "Secure the antidote herb pouches hanging from the stone pillars.", "“화로에 해독초를 던져 연기를 피우자 마비된 전사들이 기력을 되찾았다.”", "“Tossing herbs onto braziers filled the hall with smoke, neutralizing the paralysis.”", "sns", 25, "+25 SNS 획득", "+25 SNS Points"),
                make_choice("ch15_choice_3", "[성진호흡/공명]", "[Resonance]", "체내에 스며든 독기를 별 호흡으로 밀어낸다.", "Expel the venom seeped into veins using Stellar Arcane Breath.", "“정화의 마나가 혈관을 돌며 독소를 손끝으로 배출시켜 몸을 지켰다.”", "“Purification mana flushed the toxin out through fingertips, cleansing the body intact.”", "sns", 30, "+30 SNS 획득", "+30 SNS Points")
            ]
        },
        {"speaker": "quote", "name": "사자와 방패의 승리", "nameEn": "Triumph of Lion and Shield", "text": "동이 틀 무렵 독사 암살단은 전멸했고, 레오나르는 카단의 어깨를 두드리며 영원한 형제의 의를 맺었다.", "textEn": "By dawn the Viper assassins lay crushed. Leonar clasped Kadan's arm, swearing an eternal bond of brothers."}
    ])
]

print("Loaded Chapters 1 to 15 successfully.")
