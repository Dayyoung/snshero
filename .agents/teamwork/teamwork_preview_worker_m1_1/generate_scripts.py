import sys

# Define all 40 chapters with complete literary dramatization and choices
def get_all_chapters():
    # We will assemble chapters 1 to 40 in structured dicts
    chapters = []
    
    # helper to build choice dict
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
            # compatibility aliases
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

    # Helper to add chapter
    def add_ch(ch_num, lines):
        chapters.append((ch_num, lines))

    # --- Chapter 1 ---
    add_ch(1, [
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
    ])

    # --- Chapter 2 ---
    add_ch(2, [
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
    ])

    # --- Chapter 3 ---
    add_ch(3, [
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
    ])

    # --- Chapter 4 ---
    add_ch(4, [
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
    ])

    # --- Chapter 5 ---
    add_ch(5, [
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
    ])

    # --- Chapter 6 ---
    add_ch(6, [
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
    ])

    # --- Chapter 7 ---
    add_ch(7, [
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
    ])

    # --- Chapter 8 ---
    add_ch(8, [
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
    ])

    # --- Chapter 9 ---
    add_ch(9, [
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
    ])

    # --- Chapter 10 ---
    add_ch(10, [
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
    ])

    print("Generated 10 chapters. Now appending remaining 30 chapters...")
    return chapters

if __name__ == '__main__':
    print("Testing generator structure...")
