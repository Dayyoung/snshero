/**
 * Canonical 40-Episode Webnovel Scripts & Interactive Choices for SNSHero RPG Mode (/main)
 * Synchronized with:
 * - English/Korean 40-Episode Novel Mapping (englishNovelMapping.ts)
 * - Public Webnovel Book Index (public/book/index.json)
 * - Story Encounters & Regions (kadanRpgStory.ts)
 */

export interface KadanRpgDialogueChoice {
  id: string;
  attitude: '[결의/돌파]' | '[신중/통찰]' | '[성진호흡/공명]';
  attitudeEn: string;
  labelKo: string;
  labelEn: string;
  followUpTextKo: string;
  followUpTextEn: string;
  bonusType: 'sns' | 'buff' | 'item';
  bonusValue: number;
  bonusDescKo: string;
  bonusDescEn: string;
  isDefault?: boolean;
  // UI and backwards compatibility convenience aliases
  badge?: string;
  badgeEn?: string;
  text?: string;
  textEn?: string;
  reward?: {
    snsCoins?: number;
    buff?: string;
    buffName?: string;
    buffNameEn?: string;
  };
  followUpLine?: string;
  followUpLineEn?: string;
}

export interface KadanRpgNovelScriptLine {
  speaker: 'narrator' | 'quote' | 'kadan' | 'speaker' | 'choice';
  name: string;
  nameEn?: string;
  text: string;
  textEn?: string;
  cardId?: number;
  choices?: KadanRpgDialogueChoice[];
}

export const KADAN_RPG_NOVEL_SCRIPTS: Record<number, KadanRpgNovelScriptLine[]> = {
  1: [
    {
        "speaker": "narrator",
        "name": "제 1화: 눈보라 아래 두 서약",
        "nameEn": "Episode 1: Two Vows Beneath the Blizzard",
        "text": "라이트헤븐 왕국 남쪽 끝 엘윈 마을. 낮부터 쏟아진 눈발이 성벽과 지붕의 경계를 덮은 밤, 소문처럼 북쪽 섀도우렐름의 기병들이 국경을 넘어오고 있었다.",
        "textEn": "Elwin Village on the southern edge of Lighthaven. As snow blanketed walls and roofs, rumors proved true: northern Shadowrealm riders crossed the frozen frontier."
    },
    {
        "speaker": "speaker",
        "name": "알렉산다르",
        "nameEn": "Aleksandar",
        "cardId": 50,
        "text": "“발리안, 바람 소리에 피 냄새가 섞여 있네. 섀도우렐름의 정찰대인가, 아니면 왕궁의 사냥개인가.”",
        "textEn": "“Balian, the wind carries the scent of blood. Is it Shadowrealm scouts, or hounds sent from the palace?”"
    },
    {
        "speaker": "speaker",
        "name": "발리안",
        "nameEn": "Balian",
        "cardId": 43,
        "text": "“누구든 대장간 문턱을 넘는다면 내 아케인 창이 먼저 대답할 걸세. 아내들의 출산이 임박했으니 패전국의 밤을 더 더럽히게 둘 수 없네.”",
        "textEn": "“Whoever crosses this threshold will answer to my Arcane Spear. Our wives are in labor; we will not let this defeated night be defiled further.”"
    },
    {
        "speaker": "speaker",
        "name": "헤르쿨",
        "nameEn": "Hercul",
        "cardId": 49,
        "text": "“검을 거두게, 동지들! 나는 붉은 유리 궁정 섭정 데스나이트 아르투스의 숙청 명단을 쫓아 도망쳐 온 성기사 헤르쿨이다. 이 은빛 단검 두 자루를 받아다오.”",
        "textEn": "“Lower your blades, comrades! I am Paladin Hercul, fleeing Regent Artus's purge decree. Take these twin silver daggers for the children.”"
    },
    {
        "speaker": "choice",
        "name": "알렉산다르의 결의",
        "nameEn": "Aleksandar's Resolve",
        "cardId": 50,
        "text": "루시안의 암흑 기병들이 다리를 포위했다. 만삭인 아내들을 탈출시키기 위해 알렉산다르는 부서진 검을 쥐며 결단을 내린다.",
        "textEn": "Lucian's shadow riders surrounded the bridge. To buy time for their pregnant wives to flee, Aleksandar gripped his broken blade.",
        "choices": [
            {
                "id": "ch01_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "아버지의 방패는 결코 물러서지 않았다. 내가 다리 위를 지키겠다!",
                "labelEn": "A father's shield never retreats. I will hold this bridge alone!",
                "followUpTextKo": "“방패를 굳게 쥐자 칼바람조차 비껴가는 묵직한 기운이 다리 위에 솟구쳤다.”",
                "followUpTextEn": "“Gripping the shield firmly, an unyielding aura rose over the stone bridge, defying the freezing wind.”",
                "bonusType": "sns",
                "bonusValue": 20,
                "bonusDescKo": "+20 SNS 획득",
                "bonusDescEn": "+20 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "아버지의 방패는 결코 물러서지 않았다. 내가 다리 위를 지키겠다!",
                "textEn": "A father's shield never retreats. I will hold this bridge alone!",
                "reward": {
                    "snsCoins": 20,
                    "buff": "atk_boost",
                    "buffName": "+20 SNS 획득",
                    "buffNameEn": "+20 SNS Points"
                },
                "followUpLine": "“방패를 굳게 쥐자 칼바람조차 비껴가는 묵직한 기운이 다리 위에 솟구쳤다.”",
                "followUpLineEn": "“Gripping the shield firmly, an unyielding aura rose over the stone bridge, defying the freezing wind.”"
            },
            {
                "id": "ch01_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "적 기병들의 말발굽 소리를 헤아려야 한다. 우측 수로로 우회하자.",
                "labelEn": "We must gauge the enemy cavalry's pace. Divert through the right waterway.",
                "followUpTextKo": "“침착하게 지형을 살피자 눈보라 속에 가려졌던 숨겨진 우회로가 드러났다.”",
                "followUpTextEn": "“Observing the terrain calmly, a hidden drainage canal revealed itself beneath the blizzard.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[약점 포착] 첫 턴 데미지 25% 경감",
                "bonusDescEn": "[Tactical Insight] -25% First Turn DMG",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "적 기병들의 말발굽 소리를 헤아려야 한다. 우측 수로로 우회하자.",
                "textEn": "We must gauge the enemy cavalry's pace. Divert through the right waterway.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[약점 포착] 첫 턴 데미지 25% 경감",
                    "buffNameEn": "[Tactical Insight] -25% First Turn DMG"
                },
                "followUpLine": "“침착하게 지형을 살피자 눈보라 속에 가려졌던 숨겨진 우회로가 드러났다.”",
                "followUpLineEn": "“Observing the terrain calmly, a hidden drainage canal revealed itself beneath the blizzard.”"
            },
            {
                "id": "ch01_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "눈보라 속에 깃든 서약을 기억하자. 단검의 룬에 숨결을 맞춘다.",
                "labelEn": "Remember the oath etched in the blizzard. Synchronize breath with the dagger's runes.",
                "followUpTextKo": "“단검의 백은빛 룬이 온기를 품고 공명하며 차가운 밤공기를 녹여냈다.”",
                "followUpTextEn": "“The silver rune on the dagger resonated with warm light, melting the bitter chill of the night.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "눈보라 속에 깃든 서약을 기억하자. 단검의 룬에 숨결을 맞춘다.",
                "textEn": "Remember the oath etched in the blizzard. Synchronize breath with the dagger's runes.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "mana_surge",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“단검의 백은빛 룬이 온기를 품고 공명하며 차가운 밤공기를 녹여냈다.”",
                "followUpLineEn": "“The silver rune on the dagger resonated with warm light, melting the bitter chill of the night.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "두 아버지의 서약",
        "nameEn": "Oath of Two Fathers",
        "text": "“태어날 아이들에게 이 단검을 주게. 복수를 떠넘기라는 뜻이 아니라, 불의와 거짓 앞에서 고개를 숙이지 말라는 뜻이다.”",
        "textEn": "“Give these daggers to our newborn children. Not to burden them with vengeance, but so they never bow before injustice and lies.”"
    },
  ],
  2: [
    {
        "speaker": "narrator",
        "name": "제 2화: 일곱 추적자의 맹세",
        "nameEn": "Episode 2: Oath of the Seven Pursuers",
        "text": "세븐브릿지 항구 물류창고 부두. 부러진 황실 제식 검과 피 묻은 인장들이 어둠 속에서 진실의 조각을 드러내고 있었다.",
        "textEn": "Sevenbridge Harbor warehouse docks. Broken imperial regulation swords and bloodied crests revealed fragments of dark truths in the shadows."
    },
    {
        "speaker": "speaker",
        "name": "헤르쿨",
        "nameEn": "Hercul",
        "cardId": 49,
        "text": "“가웨인, 론돌! 무기를 거두어라! 우리는 서로를 죽이기 위해 이곳에 모인 것이 아니다!”",
        "textEn": "“Gawain, Rondol! Hold your blades! We did not gather here to spill each other's blood!”"
    },
    {
        "speaker": "speaker",
        "name": "가웨인",
        "nameEn": "Gawain",
        "cardId": 45,
        "text": "“알렉산다르의 부고를 들었다. 왕궁의 사냥개들이 그를 배신자로 몰았으나, 우리는 그가 누구보다 고결했음을 안다.”",
        "textEn": "“We heard of Aleksandar's fall. The palace labeled him a traitor, yet we know his honor was pure above all.”"
    },
    {
        "speaker": "speaker",
        "name": "구출된 고아 소녀",
        "nameEn": "Rescued Orphan Girl",
        "cardId": 70,
        "text": "“싸우지 마세요! 성기사 아저씨는 저를 불타는 집에서 구해준 은인이에요!”",
        "textEn": "“Please don't fight! This paladin saved me from the burning rubble!”"
    },
    {
        "speaker": "choice",
        "name": "추적자들의 결단",
        "nameEn": "Pursuers' Decision",
        "cardId": 49,
        "text": "오해가 풀린 창고 안. 일곱 명의 추방된 전사들이 알렉산다르의 남겨진 혈육을 지키기 위한 맹세를 나눈다.",
        "textEn": "Inside the quiet warehouse, seven exiled warriors prepared to take a solemn blood oath to protect Aleksandar's heir.",
        "choices": [
            {
                "id": "ch02_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "불의 앞에서는 황실의 칼날이라도 두려워하지 않겠다!",
                "labelEn": "Before injustice, we shall not fear even the imperial blade!",
                "followUpTextKo": "“일곱 전사의 검극이 부딪치며 타오르는 불꽃 같은 결의가 피어올랐다.”",
                "followUpTextEn": "“The blades of the seven warriors clashed in unison, igniting a resolve fierce as wildfire.”",
                "bonusType": "sns",
                "bonusValue": 20,
                "bonusDescKo": "+20 SNS 획득",
                "bonusDescEn": "+20 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "불의 앞에서는 황실의 칼날이라도 두려워하지 않겠다!",
                "textEn": "Before injustice, we shall not fear even the imperial blade!",
                "reward": {
                    "snsCoins": 20,
                    "buff": "atk_boost",
                    "buffName": "+20 SNS 획득",
                    "buffNameEn": "+20 SNS Points"
                },
                "followUpLine": "“일곱 전사의 검극이 부딪치며 타오르는 불꽃 같은 결의가 피어올랐다.”",
                "followUpLineEn": "“The blades of the seven warriors clashed in unison, igniting a resolve fierce as wildfire.”"
            },
            {
                "id": "ch02_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "무기를 거두고 비밀 장부를 대조해 진실을 밝히자.",
                "labelEn": "Sheathe our weapons and cross-examine the secret ledgers.",
                "followUpTextKo": "“밀서의 서명을 대조하자 붉은 유리 궁정의 위조된 숙청 명령서가 입증되었다.”",
                "followUpTextEn": "“Comparing the signatures verified Regent Artus's forged execution decree beyond doubt.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[약점 포착] 치명타 확률 +15%",
                "bonusDescEn": "[Weakspot Sight] +15% Critical Chance",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "무기를 거두고 비밀 장부를 대조해 진실을 밝히자.",
                "textEn": "Sheathe our weapons and cross-examine the secret ledgers.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[약점 포착] 치명타 확률 +15%",
                    "buffNameEn": "[Weakspot Sight] +15% Critical Chance"
                },
                "followUpLine": "“밀서의 서명을 대조하자 붉은 유리 궁정의 위조된 숙청 명령서가 입증되었다.”",
                "followUpLineEn": "“Comparing the signatures verified Regent Artus's forged execution decree beyond doubt.”"
            },
            {
                "id": "ch02_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "의인들의 심장 고동은 거짓을 말하지 않는다.",
                "labelEn": "The heartbeats of righteous warriors never utter falsehood.",
                "followUpTextKo": "“원소 마나가 부드럽게 감돌며 일곱 전사의 가슴에 신뢰의 징표를 새겼다.”",
                "followUpTextEn": "“Elemental mana swirled gently, sealing unbroken trust in the hearts of the seven warriors.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "의인들의 심장 고동은 거짓을 말하지 않는다.",
                "textEn": "The heartbeats of righteous warriors never utter falsehood.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "mana_surge",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“원소 마나가 부드럽게 감돌며 일곱 전사의 가슴에 신뢰의 징표를 새겼다.”",
                "followUpLineEn": "“Elemental mana swirled gently, sealing unbroken trust in the hearts of the seven warriors.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "일곱 추적자의 서약",
        "nameEn": "Vow of the Seven Pursuers",
        "text": "“대륙의 끝까지 헤매더라도 알렉산다르의 아이를 찾아 방패가 되어 주리라.”",
        "textEn": "“Even if we must scour every corner of the Arcane continent, we shall find his child and be his shield.”"
    },
  ],
  3: [
    {
        "speaker": "narrator",
        "name": "제 3화: 안개 절벽의 피",
        "nameEn": "Episode 3: Blood on the Mist Cliff",
        "text": "레드클리프 미스트폴 절벽의 고대 타이탄 신전. 보라색 독안개가 계곡을 메운 가운데, 나인섀도우 코덱스의 어둠 반쪽을 훔친 마수들이 매복해 있었다.",
        "textEn": "The ancient titan temple atop Mistfall Cliffs. As toxic purple fog choked the canyon, beasts carrying the stolen half of the Nine-Shadow Codex ambushed the hunters."
    },
    {
        "speaker": "speaker",
        "name": "벨페고르",
        "nameEn": "Belphegor",
        "cardId": 13,
        "text": "“크크크... 성기사의 잔당들이 냄새를 맡고 여기까지 기어왔구나! 안개 속에서 네놈들의 피를 전부 들이켜주마!”",
        "textEn": "“Hehehe... the remnants of the paladins crawled all the way here! Your blood will nourish the mist!”"
    },
    {
        "speaker": "speaker",
        "name": "로비냐드",
        "nameEn": "Robinyard",
        "cardId": 48,
        "text": "“가웨인, 코덱스를 챙겨라! 내 강철 와이어로 놈들의 발목을 묶겠다! 뒤돌아보지 마라!”",
        "textEn": "“Gawain, secure the Codex! I will snare their limbs with steel wire! Don't look back!”"
    },
    {
        "speaker": "speaker",
        "name": "메두사 고르고",
        "nameEn": "Medusa Gorgo",
        "cardId": 89,
        "text": "“어리석은 인간! 그 얄팍한 줄타기로 나의 석화 안개를 막을 수 있을 것 같으냐!”",
        "textEn": "“Foolish mortal! Did you think your thin cords could hold back my petrifying mist!”"
    },
    {
        "speaker": "choice",
        "name": "절벽 위의 혈투",
        "nameEn": "Clifftop Bloodshed",
        "cardId": 45,
        "text": "로비냐드가 마수와 함께 절벽 아래 심연으로 추락하려 한다. 동료들을 살리기 위한 마지막 선택이 눈앞에 닥친다.",
        "textEn": "Robinyard prepared to drag the beast into the abyss with him. A split-second choice faced the comrades.",
        "choices": [
            {
                "id": "ch03_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "절벽 난간을 방패로 막아 동료들의 퇴로를 열겠다!",
                "labelEn": "Brace the cliff ledge with our shields to secure the retreat!",
                "followUpTextKo": "“방패의 빛기둥이 절벽 낙하를 가로막으며 가웨인과 동료들을 지켜냈다.”",
                "followUpTextEn": "“A pillar of radiant light braced the collapsing ledge, escorting Gawain and the rest to safety.”",
                "bonusType": "buff",
                "bonusValue": 15,
                "bonusDescKo": "[수호 방벽] 방어력 +15%",
                "bonusDescEn": "[Guardian Bulwark] +15% DEF",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "절벽 난간을 방패로 막아 동료들의 퇴로를 열겠다!",
                "textEn": "Brace the cliff ledge with our shields to secure the retreat!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[수호 방벽] 방어력 +15%",
                    "buffNameEn": "[Guardian Bulwark] +15% DEF"
                },
                "followUpLine": "“방패의 빛기둥이 절벽 낙하를 가로막으며 가웨인과 동료들을 지켜냈다.”",
                "followUpLineEn": "“A pillar of radiant light braced the collapsing ledge, escorting Gawain and the rest to safety.”"
            },
            {
                "id": "ch03_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "음파의 떨림을 읽는 고르고의 사각지대를 노리자.",
                "labelEn": "Exploit Medusa Gorgo's blind spot by dampening sound vibrations.",
                "followUpTextKo": "“소리를 죽인 은밀한 보법으로 뱀머리 괴수의 시선을 분산시켰다.”",
                "followUpTextEn": "“Silencing their footsteps completely threw off the serpentine beast's echolocation.”",
                "bonusType": "sns",
                "bonusValue": 20,
                "bonusDescKo": "+20 SNS 획득",
                "bonusDescEn": "+20 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "음파의 떨림을 읽는 고르고의 사각지대를 노리자.",
                "textEn": "Exploit Medusa Gorgo's blind spot by dampening sound vibrations.",
                "reward": {
                    "snsCoins": 20,
                    "buff": "def_shield",
                    "buffName": "+20 SNS 획득",
                    "buffNameEn": "+20 SNS Points"
                },
                "followUpLine": "“소리를 죽인 은밀한 보법으로 뱀머리 괴수의 시선을 분산시켰다.”",
                "followUpLineEn": "“Silencing their footsteps completely threw off the serpentine beast's echolocation.”"
            },
            {
                "id": "ch03_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "로비냐드의 희생을 헛되이 하지 않겠다. 안개 속 기운을 감지한다.",
                "labelEn": "Robinyard's sacrifice shall not be in vain. Sift the air through Arcane Breath.",
                "followUpTextKo": "“안개 너머로 숨겨진 바위 틈 통로가 선명한 백색 궤적으로 이어졌다.”",
                "followUpTextEn": "“A hidden mountain trail carved through the mist revealed itself in brilliant white trails.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "로비냐드의 희생을 헛되이 하지 않겠다. 안개 속 기운을 감지한다.",
                "textEn": "Robinyard's sacrifice shall not be in vain. Sift the air through Arcane Breath.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "mana_surge",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“안개 너머로 숨겨진 바위 틈 통로가 선명한 백색 궤적으로 이어졌다.”",
                "followUpLineEn": "“A hidden mountain trail carved through the mist revealed itself in brilliant white trails.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "로비냐드의 마지막 미소",
        "nameEn": "Robinyard's Final Smile",
        "text": "“아이를 지켜라... 그것이 우리가 남길 유일한 유산이다.”",
        "textEn": "“Guard the child... that is the only legacy worth leaving behind.”"
    },
  ],
  4: [
    {
        "speaker": "narrator",
        "name": "제 4화: 황야에서 자란 아이",
        "nameEn": "Episode 4: The Child Raised in the Wastes",
        "text": "얼어붙은 황야 와일드랜드의 툰드라. 열 살이 된 카단은 어머니 엘윈의 텐트에서 장작을 패며 북방 늑대들의 울음소리를 듣고 자라났다.",
        "textEn": "The tundra of the frozen Wildlands. Ten-year-old Kadan chopped logs outside his mother's yurt, listening to the lonely howls of northern wolves."
    },
    {
        "speaker": "speaker",
        "name": "어머니 엘윈",
        "nameEn": "Mother Elwin",
        "cardId": 42,
        "text": "“카단, 손에 물집이 다 터졌구나. 아버지는 남을 지키기 위한 방패를 쥐었지, 증오로 칼을 휘두르지 않았단다.”",
        "textEn": "“Kadan, your hands are blistered raw. Your father carried a shield to defend others, never a sword forged in hatred.”"
    },
    {
        "speaker": "speaker",
        "name": "길가메시",
        "nameEn": "Gilgamesh",
        "cardId": 47,
        "text": "“얼음 강이 깨진다! 암살자들이 내 발목을 벴어... 저리 비켜라, 말려들게 하고 싶지 않다!”",
        "textEn": "“The ice is cracking! Assassins sliced my tendon... stay back, don't get dragged into this!”"
    },
    {
        "speaker": "speaker",
        "name": "카단",
        "nameEn": "Kadan",
        "cardId": 41,
        "text": "“내 등에 업혀! 쇄빙선처럼 얼음 위를 미끄러져 건너가면 늑대 무리도 따라오지 못해!”",
        "textEn": "“Climb on my back! If we glide across the sheet ice like a sled, the wolves won't catch us!”"
    },
    {
        "speaker": "choice",
        "name": "얼어붙은 강의 선택",
        "nameEn": "Choice on the Frozen River",
        "cardId": 41,
        "text": "얼음판이 쩍쩍 갈라지고 배후에서 섀도우 궁수들의 화살비가 쏟아진다. 카단은 부상당한 길가메시를 업은 채 속도를 낸다.",
        "textEn": "Fissures raced across the frozen river as shadow archers released a volley. Carrying wounded Gilgamesh, Kadan made his move.",
        "choices": [
            {
                "id": "ch04_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "피 흘리는 아이를 두고 도망치는 것은 부끄러운 일이다!",
                "labelEn": "Abandoning a bleeding child is a coward's deed!",
                "followUpTextKo": "“이를 악물고 등을 대며 썰매처럼 빙판을 질주해 협곡 건너편에 안착했다.”",
                "followUpTextEn": "“Gritting his teeth, Kadan slid across the ice like a sled, clearing the canyon safely.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "피 흘리는 아이를 두고 도망치는 것은 부끄러운 일이다!",
                "textEn": "Abandoning a bleeding child is a coward's deed!",
                "reward": {
                    "snsCoins": 25,
                    "buff": "atk_boost",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“이를 악물고 등을 대며 썰매처럼 빙판을 질주해 협곡 건너편에 안착했다.”",
                "followUpLineEn": "“Gritting his teeth, Kadan slid across the ice like a sled, clearing the canyon safely.”"
            },
            {
                "id": "ch04_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "얼음판의 균열을 피해 무게중심을 낮추고 미끄러지자.",
                "labelEn": "Lower our center of gravity and trace the ice fracture lines.",
                "followUpTextKo": "“균열의 리듬을 타며 미끄러지자 쫓아오던 암살자들이 빙판 속으로 빠졌다.”",
                "followUpTextEn": "“Following the fracture rhythm safely, the pursuers behind them plunged through the thin ice.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[균형 유지] 턴 전환 보너스",
                "bonusDescEn": "[Balance Mastery] Turn Flip Bonus",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "얼음판의 균열을 피해 무게중심을 낮추고 미끄러지자.",
                "textEn": "Lower our center of gravity and trace the ice fracture lines.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[균형 유지] 턴 전환 보너스",
                    "buffNameEn": "[Balance Mastery] Turn Flip Bonus"
                },
                "followUpLine": "“균열의 리듬을 타며 미끄러지자 쫓아오던 암살자들이 빙판 속으로 빠졌다.”",
                "followUpLineEn": "“Following the fracture rhythm safely, the pursuers behind them plunged through the thin ice.”"
            },
            {
                "id": "ch04_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "북풍의 맥박을 느끼며 설원 늑대처럼 달린다.",
                "labelEn": "Feel the pulse of the north wind and run with the tundra wolves.",
                "followUpTextKo": "“설원의 대추장 펜리르가 바위 위에서 카단의 기백을 인정하며 울부짖었다.”",
                "followUpTextEn": "“Tundra Chieftain Fenrir howled atop the bluff, bowing in respect to Kadan's valor.”",
                "bonusType": "sns",
                "bonusValue": 20,
                "bonusDescKo": "+20 SNS 획득",
                "bonusDescEn": "+20 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "북풍의 맥박을 느끼며 설원 늑대처럼 달린다.",
                "textEn": "Feel the pulse of the north wind and run with the tundra wolves.",
                "reward": {
                    "snsCoins": 20,
                    "buff": "mana_surge",
                    "buffName": "+20 SNS 획득",
                    "buffNameEn": "+20 SNS Points"
                },
                "followUpLine": "“설원의 대추장 펜리르가 바위 위에서 카단의 기백을 인정하며 울부짖었다.”",
                "followUpLineEn": "“Tundra Chieftain Fenrir howled atop the bluff, bowing in respect to Kadan's valor.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "길가메시의 약속",
        "nameEn": "Gilgamesh's Promise",
        "text": "“내 목숨을 빚졌다, 카단. 훗날 네가 왕궁의 문을 두드릴 때 내가 네 창이 되어 주겠다.”",
        "textEn": "“I owe you my life, Kadan. When you knock upon the imperial gates, I shall be your spear.”"
    },
  ],
  5: [
    {
        "speaker": "narrator",
        "name": "제 5화: 폭우 속의 유령",
        "nameEn": "Episode 5: Phantom in the Downpour",
        "text": "협곡 초소에 쏟아지는 사나운 폭우. 횃불은 빗물에 꺼지고, 진흙탕 속에서 투명한 살기를 품은 그림자 암살자가 다가오고 있었다.",
        "textEn": "A violent cloudburst assaulted the canyon outpost. Torches sputtered out in the mud, as an invisible phantom assassin closed in."
    },
    {
        "speaker": "speaker",
        "name": "가웨인",
        "nameEn": "Gawain",
        "cardId": 45,
        "text": "“카단, 눈을 감아라! 눈으로 보려 하면 적의 환영에 홀린다! 대지의 진동을 느껴라!”",
        "textEn": "“Kadan, close your eyes! If you rely on sight, illusions will deceive you! Feel the ground!”"
    },
    {
        "speaker": "speaker",
        "name": "그림자 암살자",
        "nameEn": "Phantom Assassin",
        "cardId": 51,
        "text": "“흐흐... 알렉산다르의 혈육을 빗속에서 익사시켜 주마. 아무도 네 비명을 듣지 못할 것이다.”",
        "textEn": "“Heh... Aleksandar's bloodline will drown in this deluge. No one will ever hear your screams.”"
    },
    {
        "speaker": "choice",
        "name": "진흙탕 속의 반격",
        "nameEn": "Riposte in the Mire",
        "cardId": 41,
        "text": "빗방울이 칼날에 부딪쳐 흩어지는 찰나의 순간. 카단은 낡은 가죽 방패를 들어 올려 살기의 궤적을 짚는다.",
        "textEn": "Raindrops shattered against an invisible blade. Kadan raised his battered buckler to meet the lethal vector.",
        "choices": [
            {
                "id": "ch05_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "빗속이라도 내 방패의 각도는 흔들리지 않는다!",
                "labelEn": "Even in blinding downpour, my shield angle never wavers!",
                "followUpTextKo": "“빗줄기를 가르며 날아든 암살자의 비수를 정면에서 쳐내어 튕겨냈다.”",
                "followUpTextEn": "“Deflecting the assassin's thrust head-on sent shockwaves through the curtain of rain.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[빗길 방어] 반격 데미지 +20%",
                "bonusDescEn": "[Rain Parrying] +20% Counter DMG",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "빗속이라도 내 방패의 각도는 흔들리지 않는다!",
                "textEn": "Even in blinding downpour, my shield angle never wavers!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[빗길 방어] 반격 데미지 +20%",
                    "buffNameEn": "[Rain Parrying] +20% Counter DMG"
                },
                "followUpLine": "“빗줄기를 가르며 날아든 암살자의 비수를 정면에서 쳐내어 튕겨냈다.”",
                "followUpLineEn": "“Deflecting the assassin's thrust head-on sent shockwaves through the curtain of rain.”"
            },
            {
                "id": "ch05_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "빗방울이 튀는 궤적을 보고 투명한 적의 위치를 파악한다.",
                "labelEn": "Track water splashes bouncing off the invisible phantom's mantle.",
                "followUpTextKo": "“허공에서 빗방울이 부자연스럽게 꺾이는 지점을 향해 단검을 내질렀다.”",
                "followUpTextEn": "“Striking the empty air where raindrops deflected revealed the cloaked phantom.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "빗방울이 튀는 궤적을 보고 투명한 적의 위치를 파악한다.",
                "textEn": "Track water splashes bouncing off the invisible phantom's mantle.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“허공에서 빗방울이 부자연스럽게 꺾이는 지점을 향해 단검을 내질렀다.”",
                "followUpLineEn": "“Striking the empty air where raindrops deflected revealed the cloaked phantom.”"
            },
            {
                "id": "ch05_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "폭우의 리듬과 호흡을 일치시켜 살기를 흘려보낸다.",
                "labelEn": "Synchronize breath with the thunderous rain to dissolve bloodlust.",
                "followUpTextKo": "“자연의 비바람과 마나가 일치하자 살기 가득했던 적의 검이 빗물처럼 흩어졌다.”",
                "followUpTextEn": "“Harmonizing mana with nature washed the assassin's killing intent harmlessly away.”",
                "bonusType": "sns",
                "bonusValue": 20,
                "bonusDescKo": "+20 SNS 획득",
                "bonusDescEn": "+20 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "폭우의 리듬과 호흡을 일치시켜 살기를 흘려보낸다.",
                "textEn": "Synchronize breath with the thunderous rain to dissolve bloodlust.",
                "reward": {
                    "snsCoins": 20,
                    "buff": "mana_surge",
                    "buffName": "+20 SNS 획득",
                    "buffNameEn": "+20 SNS Points"
                },
                "followUpLine": "“자연의 비바람과 마나가 일치하자 살기 가득했던 적의 검이 빗물처럼 흩어졌다.”",
                "followUpLineEn": "“Harmonizing mana with nature washed the assassin's killing intent harmlessly away.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "폭우가 갠 협곡",
        "nameEn": "Dawn Over the Gorge",
        "text": "진흙탕에 쓰러진 자는 암살자였다. 폭우가 잦아들자 카단의 방패 위로 새벽빛이 스며들었다.",
        "textEn": "It was the assassin who lay motionless in the mud. As clouds parted, morning light kissed Kadan's shield."
    },
  ],
  6: [
    {
        "speaker": "narrator",
        "name": "제 6화: 별을 호흡하는 법",
        "nameEn": "Episode 6: The Art of Breathing Stars",
        "text": "마나 동굴 최정상 설산 빙벽. 보름달 아래 은둔 고수 말푸온이 홀로 앉아 밤하늘의 성운을 호흡하고 있었다.",
        "textEn": "The crystalline peak above the Mana Caves. Beneath a full moon, hermit master Malfuon breathed the shimmering starlight."
    },
    {
        "speaker": "speaker",
        "name": "말푸온",
        "nameEn": "Malfuon",
        "cardId": 66,
        "text": "“여섯 스승에게서 배운 초식들이 네 가슴속에서 서로를 물어뜯고 있구나. 검과 방패, 마나의 호흡이 어긋나면 결국 스스로를 파괴할 뿐이다.”",
        "textEn": "“Forms taught by six masters are tearing at your core. When sword, shield, and breath conflict, ruin follows.”"
    },
    {
        "speaker": "speaker",
        "name": "카단",
        "nameEn": "Kadan",
        "cardId": 41,
        "text": "“가슴이 타는 듯 답답합니다. 방패를 세우면 검이 멈추고, 검을 뻗으면 방패가 비어버립니다.”",
        "textEn": "“My chest burns with friction. When I raise my shield, the sword falters; when I thrust, my flank is bare.”"
    },
    {
        "speaker": "choice",
        "name": "성진호흡법 전수",
        "nameEn": "Passing of Star Breathing",
        "cardId": 41,
        "text": "빙벽 절벽 끝, 칼바람이 살을 에는 곳에서 말푸온이 카단의 가슴에 손을 얹고 성진의 맥박을 일깨운다.",
        "textEn": "At the brink of the frozen abyss, Malfuon placed his hand over Kadan's heart to awaken stellar cadence.",
        "choices": [
            {
                "id": "ch06_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "피투성이가 되더라도 이 절벽을 오르고야 말겠다!",
                "labelEn": "Even if bloodied raw, I will conquer this frozen pinnacle!",
                "followUpTextKo": "“손끝이 터지는 고통을 딛고 절벽 끝에 서자 가슴의 마나 정체가 뚫렸다.”",
                "followUpTextEn": "“Overcoming searing pain to stand atop the crag unblocked all stagnant mana pathways.”",
                "bonusType": "sns",
                "bonusValue": 20,
                "bonusDescKo": "+20 SNS 획득",
                "bonusDescEn": "+20 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "피투성이가 되더라도 이 절벽을 오르고야 말겠다!",
                "textEn": "Even if bloodied raw, I will conquer this frozen pinnacle!",
                "reward": {
                    "snsCoins": 20,
                    "buff": "atk_boost",
                    "buffName": "+20 SNS 획득",
                    "buffNameEn": "+20 SNS Points"
                },
                "followUpLine": "“손끝이 터지는 고통을 딛고 절벽 끝에 서자 가슴의 마나 정체가 뚫렸다.”",
                "followUpLineEn": "“Overcoming searing pain to stand atop the crag unblocked all stagnant mana pathways.”"
            },
            {
                "id": "ch06_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "스승들의 가르침은 대립이 아니라 계절의 순환이었다.",
                "labelEn": "The masters' teachings were not in conflict, but a cycle of seasons.",
                "followUpTextKo": "“여섯 가지 초식이 봄과 겨울처럼 맞물리며 온전한 원을 그리기 시작했다.”",
                "followUpTextEn": "“Six combat doctrines meshed like spring and winter, completing an unbroken circle.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "스승들의 가르침은 대립이 아니라 계절의 순환이었다.",
                "textEn": "The masters' teachings were not in conflict, but a cycle of seasons.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“여섯 가지 초식이 봄과 겨울처럼 맞물리며 온전한 원을 그리기 시작했다.”",
                "followUpLineEn": "“Six combat doctrines meshed like spring and winter, completing an unbroken circle.”"
            },
            {
                "id": "ch06_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "밤하늘의 샛별을 들이쉬고, 대지로 눈송이를 돌려보낸다.",
                "labelEn": "Inhale the morning star from heaven; exhale snowflakes back to earth.",
                "followUpTextKo": "“가슴속 깊은 곳에서 아케인 성진호흡의 백색 파문이 찬란하게 각성했다.”",
                "followUpTextEn": "“A brilliant white wave of Arcane Star Breathing awakened deep within Kadan's core.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[성진 공명] 마나 공격력 +20%",
                "bonusDescEn": "[Astral Resonance] +20% Mana ATK",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "밤하늘의 샛별을 들이쉬고, 대지로 눈송이를 돌려보낸다.",
                "textEn": "Inhale the morning star from heaven; exhale snowflakes back to earth.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "mana_surge",
                    "buffName": "[성진 공명] 마나 공격력 +20%",
                    "buffNameEn": "[Astral Resonance] +20% Mana ATK"
                },
                "followUpLine": "“가슴속 깊은 곳에서 아케인 성진호흡의 백색 파문이 찬란하게 각성했다.”",
                "followUpLineEn": "“A brilliant white wave of Arcane Star Breathing awakened deep within Kadan's core.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "말푸온의 감탄",
        "nameEn": "Malfuon's Wonder",
        "text": "“성진호흡법(Star Breathing)의 완성이다. 이제 네 방패는 대륙의 별들을 품게 될 것이다.”",
        "textEn": "“The Art of Breathing Stars is complete. Henceforth, your shield cradles the constellations.”"
    },
  ],
  7: [
    {
        "speaker": "narrator",
        "name": "제 7화: 배신자들의 천막",
        "nameEn": "Episode 7: The Traitors Camp",
        "text": "남부 국경 인근 반역 부족의 대형 천막 막사. 섭정 아르투스의 밀사와 결탁해 아케인 무기와 피난민들을 노예로 팔아넘기던 배신자들의 소굴이었다.",
        "textEn": "The sprawling pavilions of a rogue clan near the border. Here, turncoats traded Arcane weaponry and innocent refugees to Regent Artus's envoys."
    },
    {
        "speaker": "speaker",
        "name": "반역자 족장",
        "nameEn": "Rebel Chieftain",
        "cardId": 87,
        "text": "“크크, 아르투스 섭정께서 약조하신 황금 삼천 냥만 주신다면 북방 피난민 꼬마들은 모조리 노예로 넘겨드리겠소.”",
        "textEn": "“Heh, so long as Regent Artus delivers the promised gold, all northern refugee youths are yours to bind.”"
    },
    {
        "speaker": "speaker",
        "name": "펜리르",
        "nameEn": "Fenrir",
        "cardId": 81,
        "text": "“더러운 놈들! 늑대의 피를 타고난 자가 동족을 적국의 감옥에 팔아넘기다니!”",
        "textEn": "“Filthy vermin! One born with wolf blood selling his own kind into imperial dungeons!”"
    },
    {
        "speaker": "choice",
        "name": "불타는 천막의 심판",
        "nameEn": "Judgment in the Burning Pavilions",
        "cardId": 41,
        "text": "천막에 불길이 번지고 위조된 황실 칙령이 탁자 위에 놓여 있다. 카단은 방패를 쥐고 배신자들의 수괴를 향해 돌진한다.",
        "textEn": "Flames engulfed the tents, illuminating forged imperial warrants on the table. Shield in hand, Kadan charged.",
        "choices": [
            {
                "id": "ch07_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "배신자들의 불의를 좌시할 수 없다. 정면으로 천막을 부순다!",
                "labelEn": "I will not tolerate traitors' injustice. Smash through the main pavilion!",
                "followUpTextKo": "“방패로 천막 기둥을 박살 내자 배신자들의 진형이 산산조각 났다.”",
                "followUpTextEn": "“Shattering the center tent pole brought the pavilion crashing down onto the conspirators.”",
                "bonusType": "sns",
                "bonusValue": 20,
                "bonusDescKo": "+20 SNS 획득",
                "bonusDescEn": "+20 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "배신자들의 불의를 좌시할 수 없다. 정면으로 천막을 부순다!",
                "textEn": "I will not tolerate traitors' injustice. Smash through the main pavilion!",
                "reward": {
                    "snsCoins": 20,
                    "buff": "atk_boost",
                    "buffName": "+20 SNS 획득",
                    "buffNameEn": "+20 SNS Points"
                },
                "followUpLine": "“방패로 천막 기둥을 박살 내자 배신자들의 진형이 산산조각 났다.”",
                "followUpLineEn": "“Shattering the center tent pole brought the pavilion crashing down onto the conspirators.”"
            },
            {
                "id": "ch07_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "루시안의 밀서를 먼저 확보해 퇴로를 차단하자.",
                "labelEn": "Secure Lucian's forged documents first to seal their escape route.",
                "followUpTextKo": "“금고 속 비밀 서신을 손에 넣으며 배신자들의 모든 음모를 무력화했다.”",
                "followUpTextEn": "“Seizing the ledger from the iron chest dismantled their network in one fell swoop.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[기습 간파] 적 공격력 15% 약화",
                "bonusDescEn": "[Plot Unveiled] -15% Enemy ATK",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "루시안의 밀서를 먼저 확보해 퇴로를 차단하자.",
                "textEn": "Secure Lucian's forged documents first to seal their escape route.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[기습 간파] 적 공격력 15% 약화",
                    "buffNameEn": "[Plot Unveiled] -15% Enemy ATK"
                },
                "followUpLine": "“금고 속 비밀 서신을 손에 넣으며 배신자들의 모든 음모를 무력화했다.”",
                "followUpLineEn": "“Seizing the ledger from the iron chest dismantled their network in one fell swoop.”"
            },
            {
                "id": "ch07_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "바람을 일으켜 불길을 역풍으로 되돌린다.",
                "labelEn": "Summon Arcane gusts to redirect the flames against the traitors.",
                "followUpTextKo": "“성진호흡의 역풍이 불길을 되돌려 갇혀 있던 피난민들을 무사히 구출했다.”",
                "followUpTextEn": "“A gust of Star Breathing turned the fire back, shielding the caged captives safely.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "바람을 일으켜 불길을 역풍으로 되돌린다.",
                "textEn": "Summon Arcane gusts to redirect the flames against the traitors.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "mana_surge",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“성진호흡의 역풍이 불길을 되돌려 갇혀 있던 피난민들을 무사히 구출했다.”",
                "followUpLineEn": "“A gust of Star Breathing turned the fire back, shielding the caged captives safely.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "카단의 일갈",
        "nameEn": "Kadan's Rebuke",
        "text": "“피난민들의 눈물로 산 황금은 결국 네놈들의 무덤 흙이 될 뿐이다.”",
        "textEn": "“The gold bought with refugee tears will serve only as dirt over your graves.”"
    },
  ],
  8: [
    {
        "speaker": "narrator",
        "name": "제 8화: 붉은 갈기의 기수",
        "nameEn": "Episode 8: Rider of the Crimson Mane",
        "text": "페가수스 계곡의 마시장. 난폭하여 누구도 안장을 얹지 못한 야생마 '적갈기'가 쇠사슬에 묶여 날뛰고 있었고, 그 곁에서 곡물 도둑 누명을 쓴 실리아가 끌려가고 있었다.",
        "textEn": "The horse bazaar in Pegasus Valley. An untamable steed named 'Crimson Mane' thrashed against chains, beside young Celia accused of horse theft."
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“놓으라고, 이 악덕 상인 놈들아! 난 저 야생마가 굶어 쓰러지려 하길래 당근 한 자루 건넸을 뿐이야!”",
        "textEn": "“Let go, you swindlers! I only gave the starving horse a basket of carrots!”"
    },
    {
        "speaker": "speaker",
        "name": "마적단 두목",
        "nameEn": "Horse Thief Boss",
        "cardId": 71,
        "text": "“시끄럽다! 적갈기마를 훔치려 한 계집년과 함께 암시장에 팔아치우겠다!”",
        "textEn": "“Quiet! We will auction you off at the black market alongside this untamable brute!”"
    },
    {
        "speaker": "choice",
        "name": "적갈기마와의 교감",
        "nameEn": "Bond with the Crimson Mane",
        "cardId": 41,
        "text": "흥분한 적갈기마가 앞발을 들며 마구간 기둥을 걷어찬다. 카단은 성진호흡의 온기를 손바닥에 품고 군마의 콧등으로 다가선다.",
        "textEn": "The frenzied stallion reared up, kicking wooden beams. Channelling Star Breathing into his palm, Kadan stepped forward.",
        "choices": [
            {
                "id": "ch08_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "쇠사슬을 끊어라! 자유롭게 달릴 자격이 있는 말이다.",
                "labelEn": "Sever the iron chains! This steed deserves to gallop free.",
                "followUpTextKo": "“사슬이 끊어지자 적갈기마가 카단의 곁에서 위엄 있는 울음소리를 터뜨렸다.”",
                "followUpTextEn": "“As chains shattered, Crimson Mane neighed with regal pride at Kadan's side.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[적갈기 돌격] 선공권 및 스피드 +20%",
                "bonusDescEn": "[Crimson Charge] +20% Speed & Priority",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "쇠사슬을 끊어라! 자유롭게 달릴 자격이 있는 말이다.",
                "textEn": "Sever the iron chains! This steed deserves to gallop free.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[적갈기 돌격] 선공권 및 스피드 +20%",
                    "buffNameEn": "[Crimson Charge] +20% Speed & Priority"
                },
                "followUpLine": "“사슬이 끊어지자 적갈기마가 카단의 곁에서 위엄 있는 울음소리를 터뜨렸다.”",
                "followUpLineEn": "“As chains shattered, Crimson Mane neighed with regal pride at Kadan's side.”"
            },
            {
                "id": "ch08_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "소녀의 짚신 자국과 도둑의 나막신 자국을 비교해 보시오.",
                "labelEn": "Compare the girl's straw sandals with the thieves' wooden clogs.",
                "followUpTextKo": "“진짜 마적단의 흙탕물 발자국이 밝혀져 상인들이 고개를 숙였다.”",
                "followUpTextEn": "“Exposing the mud-caked clogs of the actual thieves silenced the corrupt merchants.”",
                "bonusType": "sns",
                "bonusValue": 20,
                "bonusDescKo": "+20 SNS 획득",
                "bonusDescEn": "+20 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "소녀의 짚신 자국과 도둑의 나막신 자국을 비교해 보시오.",
                "textEn": "Compare the girl's straw sandals with the thieves' wooden clogs.",
                "reward": {
                    "snsCoins": 20,
                    "buff": "def_shield",
                    "buffName": "+20 SNS 획득",
                    "buffNameEn": "+20 SNS Points"
                },
                "followUpLine": "“진짜 마적단의 흙탕물 발자국이 밝혀져 상인들이 고개를 숙였다.”",
                "followUpLineEn": "“Exposing the mud-caked clogs of the actual thieves silenced the corrupt merchants.”"
            },
            {
                "id": "ch08_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "군마의 심장박동에 내 숨결을 포갠다.",
                "labelEn": "Blend my heartbeat with the wild pulse of this great stallion.",
                "followUpTextKo": "“적갈기마가 온순하게 고개를 숙이며 카단의 어깨에 콧등을 비볐다.”",
                "followUpTextEn": "“Crimson Mane lowered his proud head gently, nuzzling Kadan's shoulder in kinship.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "군마의 심장박동에 내 숨결을 포갠다.",
                "textEn": "Blend my heartbeat with the wild pulse of this great stallion.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“적갈기마가 온순하게 고개를 숙이며 카단의 어깨에 콧등을 비볐다.”",
                "followUpLineEn": "“Crimson Mane lowered his proud head gently, nuzzling Kadan's shoulder in kinship.”"
            }
        ]
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“헤헤, 시골 무사님치고는 제법인데? 난 도성 최고의 정보원 실리아야. 빚은 꼭 갚을게!”",
        "textEn": "“Hehe, not bad for a wanderer! I'm Celia, the sharpest ears in the capital. I never forget a debt!”"
    },
  ],
  9: [
    {
        "speaker": "narrator",
        "name": "제 9화: 거지 옷의 바람",
        "nameEn": "Episode 9: Wind in Beggars Clothes",
        "text": "남부 제국 국경 관문. 루시안 총독의 철갑 경비병들이 모든 행인의 소지품을 뒤지며 성기사 잔당을 색출하고 있었다.",
        "textEn": "Southern Imperial border checkpoint. Governor Lucian's ironclad guards ransacked travelers' bags, searching for paladin remnants."
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“카단, 그 반짝이는 방패는 볏짚 속에 숨겨! 이 누더기 옷을 걸치고 술 취한 거지 행세를 해야 통과할 수 있어.”",
        "textEn": "“Kadan, bury that shiny shield under straw! Put on these ragged tatters and stumble like a drunk beggar.”"
    },
    {
        "speaker": "speaker",
        "name": "국경 경비대장",
        "nameEn": "Border Guard Captain",
        "cardId": 51,
        "text": "“거지 놈들! 짐수레 속 짚더미를 창으로 찔러 확인해라! 쥐새끼 한 마리도 살려 보내지 마라!”",
        "textEn": "“You beggars! Jam your spears into the hay cart! Let not a single rat slip past!”"
    },
    {
        "speaker": "choice",
        "name": "검문소 통과",
        "nameEn": "Bypassing the Gate",
        "cardId": 41,
        "text": "창끝이 볏짚 속 방패 모서리에 닿기 직전. 억울하게 끌려가는 농민의 어린 딸이 울음을 터뜨린다.",
        "textEn": "The spearpoint reached for the shield hidden in straw, while a farmer's weeping daughter was dragged away.",
        "choices": [
            {
                "id": "ch09_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "억울하게 끌려가는 농민을 보면 방패를 꺼낼 수밖에 없다.",
                "labelEn": "Seeing innocent farmers dragged away, I cannot keep my shield hidden.",
                "followUpTextKo": "“누더기 옷 속에서 뿜어져 나온 기백에 위병들이 기겁하며 길을 비켰다.”",
                "followUpTextEn": "“The blazing spirit erupting from beneath rags made guards recoil in fright.”",
                "bonusType": "sns",
                "bonusValue": 20,
                "bonusDescKo": "+20 SNS 획득",
                "bonusDescEn": "+20 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "억울하게 끌려가는 농민을 보면 방패를 꺼낼 수밖에 없다.",
                "textEn": "Seeing innocent farmers dragged away, I cannot keep my shield hidden.",
                "reward": {
                    "snsCoins": 20,
                    "buff": "atk_boost",
                    "buffName": "+20 SNS 획득",
                    "buffNameEn": "+20 SNS Points"
                },
                "followUpLine": "“누더기 옷 속에서 뿜어져 나온 기백에 위병들이 기겁하며 길을 비켰다.”",
                "followUpLineEn": "“The blazing spirit erupting from beneath rags made guards recoil in fright.”"
            },
            {
                "id": "ch09_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "거지 옷의 냄새와 비틀거리는 걸음으로 의심을 피하자.",
                "labelEn": "Use foul beggar rags and drunken stumbles to divert suspicion.",
                "followUpTextKo": "“능청스러운 연기로 경비병들의 주의를 돌려 검문소를 무사히 빠져나왔다.”",
                "followUpTextEn": "“Flawless street acting distracted the sentries, securing clean passage through the gates.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[은밀 잠입] 첫 턴 피격 회피",
                "bonusDescEn": "[Stealth Infiltration] Evade 1st Turn Attack",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "거지 옷의 냄새와 비틀거리는 걸음으로 의심을 피하자.",
                "textEn": "Use foul beggar rags and drunken stumbles to divert suspicion.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[은밀 잠입] 첫 턴 피격 회피",
                    "buffNameEn": "[Stealth Infiltration] Evade 1st Turn Attack"
                },
                "followUpLine": "“능청스러운 연기로 경비병들의 주의를 돌려 검문소를 무사히 빠져나왔다.”",
                "followUpLineEn": "“Flawless street acting distracted the sentries, securing clean passage through the gates.”"
            },
            {
                "id": "ch09_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "바람 마나로 위병들의 귓가에 헛소문을 흘려보낸다.",
                "labelEn": "Send misleading wind whispers into the sentries' ears.",
                "followUpTextKo": "“동쪽 성문에 밀수선이 나타났다는 귓속말 바람에 경비대가 흩어졌다.”",
                "followUpTextEn": "“A breeze carrying rumors of contraband ships sent the checkpoint guards scattering.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "바람 마나로 위병들의 귓가에 헛소문을 흘려보낸다.",
                "textEn": "Send misleading wind whispers into the sentries' ears.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "mana_surge",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“동쪽 성문에 밀수선이 나타났다는 귓속말 바람에 경비대가 흩어졌다.”",
                "followUpLineEn": "“A breeze carrying rumors of contraband ships sent the checkpoint guards scattering.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "남쪽 제국로의 바람",
        "nameEn": "Breeze of the Southern Road",
        "text": "누더기 옷을 걸쳤으되 그의 눈빛은 누구보다 높고 푸른 하늘을 품고 있었다.",
        "textEn": "Though clad in rags, his gaze carried the unbroken azure of the highest sky."
    },
  ],
  10: [
    {
        "speaker": "narrator",
        "name": "제 10화: 불꽃 궁정의 포로",
        "nameEn": "Episode 10: Prisoner of the Flame Court",
        "text": "도성 붉은 유리 궁정의 지하 연회장. 바닥을 이루는 붉은 유리창 아래로 고문당하는 성기사 발리안이 보이고, 옥좌 앞에서는 황자 이그니스의 순백 불꽃 시험이 벌어지고 있었다.",
        "textEn": "The grand banquet hall of the Red Glass Palace. Beneath the red glass floor lay tortured Paladin Balian, while Prince Ignis demonstrated his pure white flame trial."
    },
    {
        "speaker": "speaker",
        "name": "황자 이그니스",
        "nameEn": "Prince Ignis",
        "cardId": 11,
        "text": "“섭정 아르투스, 어째서 내 불꽃은 당신들의 칠흑 마법과 섞이지 않는 겁니까! 유리 바닥 아래 갇힌 저 포로는 누구입니까!”",
        "textEn": "“Regent Artus, why will my flame not merge with your abyssal magic! Who is that prisoner trapped beneath the glass!”"
    },
    {
        "speaker": "speaker",
        "name": "루시안",
        "nameEn": "Lucian",
        "cardId": 61,
        "text": "“황자님, 반역자의 얼굴 따위는 신경 쓸 필요 없습니다. 내일 투기장에서 승리하여 황실의 무력을 증명하십시오.”",
        "textEn": "“My Prince, pay no heed to a doomed traitor. Tomorrow you will prove the empire's might in the arena.”"
    },
    {
        "speaker": "speaker",
        "name": "이셀라",
        "nameEn": "Ysela",
        "cardId": 107,
        "text": "“머리가... 깨질 듯 아파... 눈보라 치던 밤... 내가 안고 있던 아기는 어디로 간 거지...?”",
        "textEn": "“My head aches so violently... that blizzard night... where did the child in my arms go...?”"
    },
    {
        "speaker": "choice",
        "name": "유리 궁정의 잠입",
        "nameEn": "Infiltration of the Glass Palace",
        "cardId": 41,
        "text": "궁정 하인으로 변장해 진입한 카단. 유리창 밑 발리안 숙부의 부러진 창끝과 기억을 잃은 이셀라 부인이 보인다.",
        "textEn": "Disguised as a palace server, Kadan caught sight of Uncle Balian's broken spear and amnesiac Lady Ysela.",
        "choices": [
            {
                "id": "ch10_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "지금 당장 저 유리 바닥을 깨고 숙부님을 구해야 한다!",
                "labelEn": "Shatter the glass floor right now to save Uncle Balian!",
                "followUpTextKo": "“방패를 쥐며 참을 수 없는 분노의 투기가 솟구쳤으나 실리아가 손을 잡아당겼다.”",
                "followUpTextEn": "“Righteous fury surged through Kadan's knuckles before Celia pulled him back into shadow.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[분노의 일격] 공격력 +25%",
                "bonusDescEn": "[Wrathful Strike] +25% ATK",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "지금 당장 저 유리 바닥을 깨고 숙부님을 구해야 한다!",
                "textEn": "Shatter the glass floor right now to save Uncle Balian!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[분노의 일격] 공격력 +25%",
                    "buffNameEn": "[Wrathful Strike] +25% ATK"
                },
                "followUpLine": "“방패를 쥐며 참을 수 없는 분노의 투기가 솟구쳤으나 실리아가 손을 잡아당겼다.”",
                "followUpLineEn": "“Righteous fury surged through Kadan's knuckles before Celia pulled him back into shadow.”"
            },
            {
                "id": "ch10_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "실리아의 말대로 환기구 구조를 먼저 파악해야 한다.",
                "labelEn": "Heed Celia's advice and map the underground ventilation shafts.",
                "followUpTextKo": "“지하 수로와 연결된 배수 격자 통로를 정확히 파악해 탈출로를 확보했다.”",
                "followUpTextEn": "“Pinpointing the drainage grates connected to city aqueducts secured a covert rescue path.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "실리아의 말대로 환기구 구조를 먼저 파악해야 한다.",
                "textEn": "Heed Celia's advice and map the underground ventilation shafts.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“지하 수로와 연결된 배수 격자 통로를 정확히 파악해 탈출로를 확보했다.”",
                "followUpLineEn": "“Pinpointing the drainage grates connected to city aqueducts secured a covert rescue path.”"
            },
            {
                "id": "ch10_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "아주머니, 눈보라 치던 밤의 서약을 기억하십니까.",
                "labelEn": "My lady, do you remember the vow made beneath the blizzard?",
                "followUpTextKo": "“은빛 단검의 룬 온기가 닿자 이셀라의 눈가에 흐릿한 눈물이 흘러내렸다.”",
                "followUpTextEn": "“Touching the dagger's warm rune brought tears to Lady Ysela's clouded eyes.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "아주머니, 눈보라 치던 밤의 서약을 기억하십니까.",
                "textEn": "My lady, do you remember the vow made beneath the blizzard?",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“은빛 단검의 룬 온기가 닿자 이셀라의 눈가에 흐릿한 눈물이 흘러내렸다.”",
                "followUpLineEn": "“Touching the dagger's warm rune brought tears to Lady Ysela's clouded eyes.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "카단의 다짐",
        "nameEn": "Kadan's Vow",
        "text": "“이그니스, 너는 내 적이 아니다. 내일 투기장에서 너에게 진실을 보여주마.”",
        "textEn": "“Ignis, you are not my enemy. Tomorrow in the arena, I will show you the truth.”"
    },
  ],
  11: [
    {
        "speaker": "narrator",
        "name": "제 11화: 기억을 깨우는 단검",
        "nameEn": "Episode 11: The Dagger That Wakes Memory",
        "text": "도성 황실 콜로세움 원형 투기장. 십만 관중의 환호 속에서 황자 이그니스의 순백 불꽃 창과 방랑 검사 카단의 가죽 방패가 마침내 격돌했다.",
        "textEn": "The Imperial Colosseum arena. Amidst roaring cheers from a hundred thousand spectators, Prince Ignis's white flame spear clashed with Kadan's shield."
    },
    {
        "speaker": "speaker",
        "name": "황자 이그니스",
        "nameEn": "Prince Ignis",
        "cardId": 11,
        "text": "“네 방패는 궁정의 어떤 기사보다 견고하구나! 하지만 내 백색 화염은 모든 거짓을 태워버린다!”",
        "textEn": "“Your shield is sturdier than any royal knight's! But my white fire burns through all falsehood!”"
    },
    {
        "speaker": "speaker",
        "name": "카단",
        "nameEn": "Kadan",
        "cardId": 41,
        "text": "“이그니스! 네 불꽃은 파괴를 위한 것이 아니다! 품속의 은빛 단검을 보아라!”",
        "textEn": "“Ignis! Your flame was never born for slaughter! Look at the silver dagger in your tunic!”"
    },
    {
        "speaker": "choice",
        "name": "투기장의 공명",
        "nameEn": "Resonance in the Arena",
        "cardId": 41,
        "text": "불꽃 창과 방패가 맞부딪치는 순간. 카단은 품속에서 알렉산다르의 단검을 꺼내어 이그니스의 단검과 교차시킨다.",
        "textEn": "As spear struck shield, Kadan drew Aleksandar's twin silver dagger and crossed it against Ignis's blade.",
        "choices": [
            {
                "id": "ch11_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "이그니스! 네 불꽃은 파괴가 아니라 생명을 지키기 위한 것이다!",
                "labelEn": "Ignis! Your fire was meant to defend life, not cause slaughter!",
                "followUpTextKo": "“방패로 백색 화염을 감싸 안으며 이그니스의 창끝을 멈춰 세웠다.”",
                "followUpTextEn": "“Cradling the white flame within the shield brought Ignis's spear to an abrupt halt.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[결의의 방벽] 화염 내성 +25%",
                "bonusDescEn": "[Flame Barrier] +25% Fire RES",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "이그니스! 네 불꽃은 파괴가 아니라 생명을 지키기 위한 것이다!",
                "textEn": "Ignis! Your fire was meant to defend life, not cause slaughter!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[결의의 방벽] 화염 내성 +25%",
                    "buffNameEn": "[Flame Barrier] +25% Fire RES"
                },
                "followUpLine": "“방패로 백색 화염을 감싸 안으며 이그니스의 창끝을 멈춰 세웠다.”",
                "followUpLineEn": "“Cradling the white flame within the shield brought Ignis's spear to an abrupt halt.”"
            },
            {
                "id": "ch11_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "검날이 교차하는 순간 단검의 룬 각인을 보여주겠다.",
                "labelEn": "Show the matching rune engravings as our daggers cross.",
                "followUpTextKo": "“쌍둥이 단검의 룬이 맞물리자 투기장 전체에 순백의 빛이 쏟아져 내렸다.”",
                "followUpTextEn": "“Interlocking the twin runes cast a celestial light across the entire colosseum.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "검날이 교차하는 순간 단검의 룬 각인을 보여주겠다.",
                "textEn": "Show the matching rune engravings as our daggers cross.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“쌍둥이 단검의 룬이 맞물리자 투기장 전체에 순백의 빛이 쏟아져 내렸다.”",
                "followUpLineEn": "“Interlocking the twin runes cast a celestial light across the entire colosseum.”"
            },
            {
                "id": "ch11_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "백색 화염과 아케인 방패의 공명 파문을 일으킨다.",
                "labelEn": "Unleash a resonant shockwave merging white fire and Arcane shield.",
                "followUpTextKo": "“화염과 방패가 하나의 호흡으로 엮이며 이그니스의 닫힌 기억을 일깨웠다.”",
                "followUpTextEn": "“The fusion of fire and shield ignited the dormant memories sealed within Ignis.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "백색 화염과 아케인 방패의 공명 파문을 일으킨다.",
                "textEn": "Unleash a resonant shockwave merging white fire and Arcane shield.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“화염과 방패가 하나의 호흡으로 엮이며 이그니스의 닫힌 기억을 일깨웠다.”",
                "followUpLineEn": "“The fusion of fire and shield ignited the dormant memories sealed within Ignis.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "이그니스의 눈물",
        "nameEn": "Ignis's Tears",
        "text": "“단검의 문양이... 똑같다... 내 진짜 아버지가 저 감옥에 갇힌 성기사 발리안이란 말인가...!”",
        "textEn": "“The dagger's crest... is identical... My true father was Paladin Balian all along...!”"
    },
  ],
  12: [
    {
        "speaker": "narrator",
        "name": "제 12화: 두 무덤 사이의 봄",
        "nameEn": "Episode 12: Spring Between Two Graves",
        "text": "성기사단 추모 예배당 묘원. 부서진 비석들 사이에 들꽃이 피어난 이곳에, 섭정의 비밀 마도 공성 골렘들이 습격해 왔다.",
        "textEn": "The Paladins' Memorial Chapel cemetery. Wildflowers bloomed amidst broken headstones, where the Regent's secret Magitech Golems ambushed the mourning party."
    },
    {
        "speaker": "speaker",
        "name": "발리안",
        "nameEn": "Balian",
        "cardId": 43,
        "text": "“알렉산다르... 자네 곁에 묻힌 전우들의 묘비 앞에서 내 아들과 조카를 다시 만났네. 피눈물 나는 세월이었으나 봄은 결코 오지 않는 법이 없더군.”",
        "textEn": "“Aleksandar... before the graves of our comrades, I meet my son and nephew once more. Bitter years they were, yet spring never fails to arrive.”"
    },
    {
        "speaker": "speaker",
        "name": "헤르쿨",
        "nameEn": "Hercul",
        "cardId": 49,
        "text": "“적의 기갑 골렘들이 묘비를 부수려 한다! 카단, 이그니스! 전우들의 영혼을 지켜라!”",
        "textEn": "“Armored golems are targeting the grave markers! Kadan, Ignis! Protect the resting souls!”"
    },
    {
        "speaker": "choice",
        "name": "묘원의 수호전",
        "nameEn": "Defense of the Cemetery",
        "cardId": 41,
        "text": "거대한 강철 철퇴가 묘비를 향해 떨어진다. 카단은 양손으로 방패를 받치며 선열들의 안식을 지킨다.",
        "textEn": "A massive steel flail hurtled toward the memorial headstone. Kadan braced his buckler with both arms.",
        "choices": [
            {
                "id": "ch12_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "영웅들의 묘비를 더럽히게 두지 않겠다!",
                "labelEn": "I will not let heroes' headstones be desecrated!",
                "followUpTextKo": "“거대 철퇴를 방패로 밀어내며 골렘의 강철 장갑을 박살 냈다.”",
                "followUpTextEn": "“Parrying the giant flail shattered the golem's armored forearms to scrap.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[성지 수호] 파티 방어막 강화",
                "bonusDescEn": "[Sanctuary Defense] Party Shield Up",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "영웅들의 묘비를 더럽히게 두지 않겠다!",
                "textEn": "I will not let heroes' headstones be desecrated!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[성지 수호] 파티 방어막 강화",
                    "buffNameEn": "[Sanctuary Defense] Party Shield Up"
                },
                "followUpLine": "“거대 철퇴를 방패로 밀어내며 골렘의 강철 장갑을 박살 냈다.”",
                "followUpLineEn": "“Parrying the giant flail shattered the golem's armored forearms to scrap.”"
            },
            {
                "id": "ch12_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "골렘의 마나 동력핵 위치를 집중 타격하자.",
                "labelEn": "Focus strikes directly upon the golem's exposed mana core.",
                "followUpTextKo": "“동력선의 결함을 짚어내자 세 대의 골렘이 동시에 동력을 잃고 멈췄다.”",
                "followUpTextEn": "“Severing the exposed conduit line shut down three golems simultaneously.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "골렘의 마나 동력핵 위치를 집중 타격하자.",
                "textEn": "Focus strikes directly upon the golem's exposed mana core.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“동력선의 결함을 짚어내자 세 대의 골렘이 동시에 동력을 잃고 멈췄다.”",
                "followUpLineEn": "“Severing the exposed conduit line shut down three golems simultaneously.”"
            },
            {
                "id": "ch12_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "선열들의 잔향이 깃든 대지에서 기도를 올린다.",
                "labelEn": "Offer silent prayers to the earth holding our forefathers' spirits.",
                "followUpTextKo": "“대지에서 피어난 백은빛 마나가 상처 입은 동료들의 기력을 온화하게 치유했다.”",
                "followUpTextEn": "“Silver mana rising from the soil restored weary bodies with spring vigor.”",
                "bonusType": "sns",
                "bonusValue": 20,
                "bonusDescKo": "+20 SNS 획득",
                "bonusDescEn": "+20 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "선열들의 잔향이 깃든 대지에서 기도를 올린다.",
                "textEn": "Offer silent prayers to the earth holding our forefathers' spirits.",
                "reward": {
                    "snsCoins": 20,
                    "buff": "mana_surge",
                    "buffName": "+20 SNS 획득",
                    "buffNameEn": "+20 SNS Points"
                },
                "followUpLine": "“대지에서 피어난 백은빛 마나가 상처 입은 동료들의 기력을 온화하게 치유했다.”",
                "followUpLineEn": "“Silver mana rising from the soil restored weary bodies with spring vigor.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "묘비 사이의 맹세",
        "nameEn": "Vow Between the Graves",
        "text": "묘비에 튄 적의 기름때를 닦아내자, 두 무덤 사이에 푸른 제비꽃이 고개를 들었다.",
        "textEn": "Wiping machine oil from the stone, a solitary violet raised its head between the two graves."
    },
  ],
  13: [
    {
        "speaker": "narrator",
        "name": "제 13화: 녹옥 지팡이의 주인",
        "nameEn": "Episode 13: Master of the Jade Staff",
        "text": "태호 비스트랜드의 녹옥 의회 성소. 천년 고목 사이로 맹수 부족들의 대추장 레오나르가 녹옥 지팡이를 짚은 채 침입자들을 노려보았다.",
        "textEn": "The Jade Council Grove in Taiho Beastlands. Amidst ancient trees, Great Chief Leonar leaned upon his Jade Staff, studying the travelers."
    },
    {
        "speaker": "speaker",
        "name": "대추장 레오나르",
        "nameEn": "Grand Chief Leonar",
        "cardId": 86,
        "text": "“인간들은 늘 배신과 탐욕으로 숲을 불태웠다. 너희가 붉은 유리 궁정의 간첩이 아니라는 증거가 어디 있느냐!”",
        "textEn": "“Humans always torched our canopies with greed and treachery. What proof proves you are not the Regent's spies!”"
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“레오나르 대추장님, 카단은 북방 피난민들을 지킨 방패예요! 탐욕스러운 귀족들과는 근본부터 달라요!”",
        "textEn": "“Chief Leonar, Kadan is the shield who protected northern refugees! He is nothing like those corrupt nobles!”"
    },
    {
        "speaker": "choice",
        "name": "녹옥 지팡이의 시험",
        "nameEn": "Trial of the Jade Staff",
        "cardId": 41,
        "text": "레오나르가 녹옥 지팡이를 바닥에 내리치자 숲의 정령수들이 포효하며 카단을 시험한다.",
        "textEn": "Leonar struck the earth with the Jade Staff, prompting primordial treants to roar and test Kadan.",
        "choices": [
            {
                "id": "ch13_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "종족의 편견을 넘어 정의의 연합을 이루겠다!",
                "labelEn": "Transcend racial prejudice to forge a grand alliance of justice!",
                "followUpTextKo": "“정면에서 맹수의 돌격을 방패로 받아내며 흔들림 없는 의기를 증명했다.”",
                "followUpTextEn": "“Bracing against the beast charge with unyielding honor won the clan's awe.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "종족의 편견을 넘어 정의의 연합을 이루겠다!",
                "textEn": "Transcend racial prejudice to forge a grand alliance of justice!",
                "reward": {
                    "snsCoins": 25,
                    "buff": "atk_boost",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“정면에서 맹수의 돌격을 방패로 받아내며 흔들림 없는 의기를 증명했다.”",
                "followUpLineEn": "“Bracing against the beast charge with unyielding honor won the clan's awe.”"
            },
            {
                "id": "ch13_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "녹옥 지팡이에 얽힌 고대 결계의 균열을 분석하자.",
                "labelEn": "Analyze the fractures in the ancient barrier bound to the staff.",
                "followUpTextKo": "“지팡이의 마력 흐름을 바로잡아 숲의 침식된 오염을 정화해 주었다.”",
                "followUpTextEn": "“Stabilizing the staff's leyline cleansed the festering blight within the grove.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[마법 간파] 마법 방어력 +20%",
                "bonusDescEn": "[Arcane Sight] +20% Magic DEF",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "녹옥 지팡이에 얽힌 고대 결계의 균열을 분석하자.",
                "textEn": "Analyze the fractures in the ancient barrier bound to the staff.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[마법 간파] 마법 방어력 +20%",
                    "buffNameEn": "[Arcane Sight] +20% Magic DEF"
                },
                "followUpLine": "“지팡이의 마력 흐름을 바로잡아 숲의 침식된 오염을 정화해 주었다.”",
                "followUpLineEn": "“Stabilizing the staff's leyline cleansed the festering blight within the grove.”"
            },
            {
                "id": "ch13_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "비스트 숲의 정령들과 조화로운 교감을 나눈다.",
                "labelEn": "Harmonize in gentle resonance with the beast spirits of the woods.",
                "followUpTextKo": "“풀잎과 바람의 마나가 조화를 이루자 사나운 맹수들이 온순하게 앉았다.”",
                "followUpTextEn": "“As flora and wind joined in harmony, fierce predators sat peacefully around him.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "비스트 숲의 정령들과 조화로운 교감을 나눈다.",
                "textEn": "Harmonize in gentle resonance with the beast spirits of the woods.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“풀잎과 바람의 마나가 조화를 이루자 사나운 맹수들이 온순하게 앉았다.”",
                "followUpLineEn": "“As flora and wind joined in harmony, fierce predators sat peacefully around him.”"
            }
        ]
    },
    {
        "speaker": "speaker",
        "name": "대추장 레오나르",
        "nameEn": "Grand Chief Leonar",
        "cardId": 86,
        "text": "“크하하! 마음에 들었다! 이 손을 잡아라, 성기사의 아들아. 비스트 클랜의 도끼가 네 방패와 함께하겠다!”",
        "textEn": "“Bwahaha! I like your heart! Take my hand, paladin's son. The axes of the Beast Clan stand with your shield!”"
    },
  ],
  14: [
    {
        "speaker": "narrator",
        "name": "제 14화: 안개 호수의 손님들",
        "nameEn": "Episode 14: Guests of the Mist Lake",
        "text": "태호 호수 위 짙은 수무. 론돌의 나룻배 선단이 호수를 건너는 도중, 수로를 장악한 가면 쓴 호수 해적들이 나타났다.",
        "textEn": "Heavy mist over Taiho Lake. As Rondol guided skiffs across calm waters, masked lake corsairs emerged from the fog."
    },
    {
        "speaker": "speaker",
        "name": "론돌",
        "nameEn": "Rondol",
        "cardId": 46,
        "text": "“물살이 심상치 않다! 수중 갈고리가 배 밑바닥을 긁고 있어! 적선 세 척이 안개 속에서 포위해 온다!”",
        "textEn": "“The currents are unnatural! Grappling hooks are tearing our hulls! Three raider skiffs surround us!”"
    },
    {
        "speaker": "speaker",
        "name": "가면 해적선장",
        "nameEn": "Masked Corsair",
        "cardId": 89,
        "text": "“배 위에 실린 보물과 피난민들을 넘겨라! 물에 빠져 물귀신 밥이 되고 싶지 않다면!”",
        "textEn": "“Surrender your cargo and captives, unless you fancy feeding the lake wraiths below!”"
    },
    {
        "speaker": "choice",
        "name": "호수 위의 교전",
        "nameEn": "Battle on the Mist Lake",
        "cardId": 41,
        "text": "나룻배가 기우뚱하고 적의 갈고리 줄이 빗발친다. 카단은 물살의 반동을 이용해 결단을 내린다.",
        "textEn": "The skiff tilted steeply as boarding hooks rattled. Kadan utilized the boat's momentum to retaliate.",
        "choices": [
            {
                "id": "ch14_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "물살을 가르며 적 기함으로 뛰어올라 제압한다!",
                "labelEn": "Leap across the wake straight onto the enemy flagship!",
                "followUpTextKo": "“나룻배에서 적함으로 단숨에 도약해 해적 선장의 칼을 쳐내었다.”",
                "followUpTextEn": "“Vaulting across hulls, Kadan disarmed the corsair captain with one shield blow.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[승선 돌격] 첫 공격 치명타",
                "bonusDescEn": "[Boarding Assault] 1st Strike Crit",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "물살을 가르며 적 기함으로 뛰어올라 제압한다!",
                "textEn": "Leap across the wake straight onto the enemy flagship!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[승선 돌격] 첫 공격 치명타",
                    "buffNameEn": "[Boarding Assault] 1st Strike Crit"
                },
                "followUpLine": "“나룻배에서 적함으로 단숨에 도약해 해적 선장의 칼을 쳐내었다.”",
                "followUpLineEn": "“Vaulting across hulls, Kadan disarmed the corsair captain with one shield blow.”"
            },
            {
                "id": "ch14_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "안개 속 노 젓는 소리로 적선의 위치를 산출하자.",
                "labelEn": "Triangulate the raiders' positions by listening to rhythmic oar splashes.",
                "followUpTextKo": "“소리의 간격을 계산해 적선들을 서로 충돌하게 유도했다.”",
                "followUpTextEn": "“Timing the echoes tricked the corsair boats into colliding in the fog.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "안개 속 노 젓는 소리로 적선의 위치를 산출하자.",
                "textEn": "Triangulate the raiders' positions by listening to rhythmic oar splashes.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“소리의 간격을 계산해 적선들을 서로 충돌하게 유도했다.”",
                "followUpLineEn": "“Timing the echoes tricked the corsair boats into colliding in the fog.”"
            },
            {
                "id": "ch14_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "론돌의 물결 파도에 맞춰 방패의 반발력을 싣는다.",
                "labelEn": "Channel shield repulsion in rhythm with Rondol's tidal waves.",
                "followUpTextKo": "“호수 전체에 잔잔한 수호 파문이 퍼지며 해적들의 배를 밀어냈다.”",
                "followUpTextEn": "“A protective ripple surged across the surface, pushing the raiders back safely.”",
                "bonusType": "sns",
                "bonusValue": 20,
                "bonusDescKo": "+20 SNS 획득",
                "bonusDescEn": "+20 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "론돌의 물결 파도에 맞춰 방패의 반발력을 싣는다.",
                "textEn": "Channel shield repulsion in rhythm with Rondol's tidal waves.",
                "reward": {
                    "snsCoins": 20,
                    "buff": "mana_surge",
                    "buffName": "+20 SNS 획득",
                    "buffNameEn": "+20 SNS Points"
                },
                "followUpLine": "“호수 전체에 잔잔한 수호 파문이 퍼지며 해적들의 배를 밀어냈다.”",
                "followUpLineEn": "“A protective ripple surged across the surface, pushing the raiders back safely.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "태호 호수의 아침",
        "nameEn": "Morning on Taiho Lake",
        "text": "안개가 걷히자 호수 해적들은 무기를 버리고 론돌의 깃발 아래 무릎을 꿇었다.",
        "textEn": "As the mist lifted, the corsairs dropped their weapons, kneeling beneath Rondol's standard."
    },
  ],
  15: [
    {
        "speaker": "narrator",
        "name": "제 15화: 독사와 사자의 밤",
        "nameEn": "Episode 15: Night of Serpent and Lion",
        "text": "비스트 클랜 요새의 대연회장. 화기애애하던 동맹 축하연의 술잔에 벨페고르의 독사 암살단이 은밀히 독을 탔다.",
        "textEn": "The grand feast hall of the Beast Stronghold. Into festive wine cups, Belphegor's Viper assassins secretly dripped lethal poison."
    },
    {
        "speaker": "speaker",
        "name": "대추장 레오나르",
        "nameEn": "Grand Chief Leonar",
        "cardId": 86,
        "text": "“크윽... 술에 사비아 독이... 다리에 힘이 풀린다... 문을 닫아라! 천장에서 암살자들이 쏟아진다!”",
        "textEn": "“Ugh... Sabia venom in the wine... my knees buckle... Bar the gates! Assassins drop from rafters!”"
    },
    {
        "speaker": "speaker",
        "name": "벨페고르",
        "nameEn": "Belphegor",
        "cardId": 13,
        "text": "“크하하! 사자왕도 독침 한 방이면 고깃덩어리에 불과하지! 오늘 밤 이 요새를 피바다로 만들겠다!”",
        "textEn": "“Bwahaha! Even the Lion King is mere meat before venom! This hall will run red tonight!”"
    },
    {
        "speaker": "choice",
        "name": "연회장 문의 결전",
        "nameEn": "Stand at the Hall Doors",
        "cardId": 41,
        "text": "독침이 비 오듯 쏟아지고 중독된 전사들이 쓰러진다. 카단은 레오나르의 등을 맞대고 대연회장 문 앞을 가로막는다.",
        "textEn": "Venomous darts rained down as warriors fell paralyzed. Back-to-back with Leonar, Kadan blocked the doorway.",
        "choices": [
            {
                "id": "ch15_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "사자왕의 뒤는 내가 지킨다! 독침은 방패로 막아내라!",
                "labelEn": "I have the Lion King's back! Deflect every dart with the shield!",
                "followUpTextKo": "“방패의 회전각으로 수백 발의 독침을 모조리 튕겨내며 문을 사수했다.”",
                "followUpTextEn": "“Whirling the buckler deflected hundreds of venomous needles, securing the threshold.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[사자의 포효] 공격력 +25%",
                "bonusDescEn": "[Lion's Roar] +25% ATK",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "사자왕의 뒤는 내가 지킨다! 독침은 방패로 막아내라!",
                "textEn": "I have the Lion King's back! Deflect every dart with the shield!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[사자의 포효] 공격력 +25%",
                    "buffNameEn": "[Lion's Roar] +25% ATK"
                },
                "followUpLine": "“방패의 회전각으로 수백 발의 독침을 모조리 튕겨내며 문을 사수했다.”",
                "followUpLineEn": "“Whirling the buckler deflected hundreds of venomous needles, securing the threshold.”"
            },
            {
                "id": "ch15_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "연회장 기둥에 걸린 해독초 주머니를 먼저 확보하자.",
                "labelEn": "Secure the antidote herb pouches hanging from the stone pillars.",
                "followUpTextKo": "“화로에 해독초를 던져 연기를 피우자 마비된 전사들이 기력을 되찾았다.”",
                "followUpTextEn": "“Tossing herbs onto braziers filled the hall with smoke, neutralizing the paralysis.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "연회장 기둥에 걸린 해독초 주머니를 먼저 확보하자.",
                "textEn": "Secure the antidote herb pouches hanging from the stone pillars.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“화로에 해독초를 던져 연기를 피우자 마비된 전사들이 기력을 되찾았다.”",
                "followUpLineEn": "“Tossing herbs onto braziers filled the hall with smoke, neutralizing the paralysis.”"
            },
            {
                "id": "ch15_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "체내에 스며든 독기를 별 호흡으로 밀어낸다.",
                "labelEn": "Expel the venom seeped into veins using Stellar Arcane Breath.",
                "followUpTextKo": "“정화의 마나가 혈관을 돌며 독소를 손끝으로 배출시켜 몸을 지켰다.”",
                "followUpTextEn": "“Purification mana flushed the toxin out through fingertips, cleansing the body intact.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "체내에 스며든 독기를 별 호흡으로 밀어낸다.",
                "textEn": "Expel the venom seeped into veins using Stellar Arcane Breath.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“정화의 마나가 혈관을 돌며 독소를 손끝으로 배출시켜 몸을 지켰다.”",
                "followUpLineEn": "“Purification mana flushed the toxin out through fingertips, cleansing the body intact.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "사자와 방패의 승리",
        "nameEn": "Triumph of Lion and Shield",
        "text": "동이 틀 무렵 독사 암살단은 전멸했고, 레오나르는 카단의 어깨를 두드리며 영원한 형제의 의를 맺었다.",
        "textEn": "By dawn the Viper assassins lay crushed. Leonar clasped Kadan's arm, swearing an eternal bond of brothers."
    },
  ],
  16: [
    {
        "speaker": "narrator",
        "name": "제 16화: 폐허 앞의 형제",
        "nameEn": "Episode 16: Brothers Before the Ruins",
        "text": "풍차 언덕 북문 폐허. 섭정 아르투스의 중장갑 근위대가 도성을 탈출하려는 일행을 포위했고, 발리안은 성기사단의 마지막 창을 고쳐 잡았다.",
        "textEn": "Ruins of the Windmill Ridge northern gate. Regent Artus's armored vanguard surrounded the escaping party, and Paladin Balian raised his final Arcane spear."
    },
    {
        "speaker": "speaker",
        "name": "발리안",
        "nameEn": "Balian",
        "cardId": 43,
        "text": "“이그니스, 카단! 뒤돌아보지 말고 달려라! 내가 이 풍차 언덕의 좁은 길목을 틀어막겠다!”",
        "textEn": "“Ignis, Kadan! Run and do not look back! I will hold this narrow defile alone!”"
    },
    {
        "speaker": "speaker",
        "name": "황자 이그니스",
        "nameEn": "Prince Ignis",
        "cardId": 11,
        "text": "“아버지! 겨우 다시 만났는데 또 홀로 남겨두고 갈 수는 없습니다! 함께 싸우겠습니다!”",
        "textEn": "“Father! We have only just found each other, I cannot abandon you again! I will fight by your side!”"
    },
    {
        "speaker": "speaker",
        "name": "루시안",
        "nameEn": "Lucian",
        "cardId": 61,
        "text": "“크크크, 늙은 성기사와 배신자 황자를 한자리에서 매장해 주마! 전군 돌격하라!”",
        "textEn": "“Hehehe, bury the old paladin and the turncoat prince in the same trench! All units, charge!”"
    },
    {
        "speaker": "choice",
        "name": "풍차 언덕의 마지막 저항",
        "nameEn": "Last Stand on Windmill Ridge",
        "cardId": 41,
        "text": "적의 철갑 기병들이 언덕을 메우고 창날이 번뜩인다. 카단과 이그니스는 서로의 눈을 바라보며 형제의 결단을 내린다.",
        "textEn": "Ironclad lancers flooded the ridge. Looking into each other's eyes, Kadan and Ignis made their fraternal stand.",
        "choices": [
            {
                "id": "ch16_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "숙부님을 혼자 둘 수 없습니다! 함께 싸우겠습니다!",
                "labelEn": "We cannot leave Uncle alone! We stand and fight together!",
                "followUpTextKo": "“창과 방패, 백색 화염이 합쳐져 풍차 언덕 위에 거대한 불멸의 방진을 쳤다.”",
                "followUpTextEn": "“Spear, shield, and white flame combined into an immortal bulwark on the ridge.”",
                "bonusType": "buff",
                "bonusValue": 30,
                "bonusDescKo": "[아케인 창의 맹세] 파워 +30%",
                "bonusDescEn": "[Oath of the Spear] +30% Power",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "숙부님을 혼자 둘 수 없습니다! 함께 싸우겠습니다!",
                "textEn": "We cannot leave Uncle alone! We stand and fight together!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[아케인 창의 맹세] 파워 +30%",
                    "buffNameEn": "[Oath of the Spear] +30% Power"
                },
                "followUpLine": "“창과 방패, 백색 화염이 합쳐져 풍차 언덕 위에 거대한 불멸의 방진을 쳤다.”",
                "followUpLineEn": "“Spear, shield, and white flame combined into an immortal bulwark on the ridge.”"
            },
            {
                "id": "ch16_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "숙부님의 희생을 헛되이 하지 않으려면 살아남아야 한다.",
                "labelEn": "To honor his sacrifice, we must survive and carry the truth forward.",
                "followUpTextKo": "“눈물을 삼키며 피난민들과 함께 북부 산악로 탈출로를 확보했다.”",
                "followUpTextEn": "“Swallowing tears, they safely escorted the refugees into northern mountain trails.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "숙부님의 희생을 헛되이 하지 않으려면 살아남아야 한다.",
                "textEn": "To honor his sacrifice, we must survive and carry the truth forward.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“눈물을 삼키며 피난민들과 함께 북부 산악로 탈출로를 확보했다.”",
                "followUpLineEn": "“Swallowing tears, they safely escorted the refugees into northern mountain trails.”"
            },
            {
                "id": "ch16_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "두 아버지의 서약은 우리 가슴속에서 영원히 타오를 것이다.",
                "labelEn": "The vow of our two fathers will burn eternal within our hearts.",
                "followUpTextKo": "“발리안의 창끝에서 방출된 마지막 온기가 두 청년의 가슴에 불멸의 룬으로 깃들었다.”",
                "followUpTextEn": "“The final warmth radiating from Balian's spear sealed an eternal rune in both sons.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "두 아버지의 서약은 우리 가슴속에서 영원히 타오를 것이다.",
                "textEn": "The vow of our two fathers will burn eternal within our hearts.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“발리안의 창끝에서 방출된 마지막 온기가 두 청년의 가슴에 불멸의 룬으로 깃들었다.”",
                "followUpLineEn": "“The final warmth radiating from Balian's spear sealed an eternal rune in both sons.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "연기와 눈물",
        "nameEn": "Smoke and Tears",
        "text": "풍차는 불길에 휩싸여 무너졌으나, 언덕 위에 우뚝 솟은 두 청년의 그림자는 새벽빛을 받아 길게 뻗어나갔다.",
        "textEn": "The burning windmill crumbled into embers, but the silhouettes of the two youths stretched far into the dawn."
    },
  ],
  17: [
    {
        "speaker": "narrator",
        "name": "제 17화: 바람섬의 초대장",
        "nameEn": "Episode 17: Invitation to the Wind Isle",
        "text": "섀도우 팰리스 해안 항구. 먹구름이 바다를 삼키려는 가운데, 하늘의 전령 그리폰이 은빛 인장이 찍힌 바람섬의 비밀 초대장을 전해왔다.",
        "textEn": "The coastal harbor of Shadow Palace. Beneath gathering stormclouds, a celestial messenger delivered a sealed invitation to the mythical Wind Isle."
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“카단, 이건 바람섬의 여왕 실피드의 친필 룬 서한이야! 나인섀도우 코덱스의 마지막 봉인을 풀 유일한 열쇠가 그 섬에 있어!”",
        "textEn": "“Kadan, this is Queen Sylphid's personal rune decree! The final seal of the Nine-Shadow Codex rests on that isle!”"
    },
    {
        "speaker": "speaker",
        "name": "론돌",
        "nameEn": "Rondol",
        "cardId": 46,
        "text": "“하지만 부두 앞에 폭풍 바다용 와이번들이 둥지를 틀었다! 닻을 올리자마자 습격당할 거야!”",
        "textEn": "“Yet storm sea wyverns have blockaded the docks! The moment we weigh anchor, they will swarm us!”"
    },
    {
        "speaker": "choice",
        "name": "폭풍우를 향한 출항",
        "nameEn": "Setting Sail into the Squall",
        "cardId": 41,
        "text": "바다에서 거대한 회오리가 일고 익룡들이 돛대를 부수려 날아든다. 카단은 선수에 서서 방패를 들어 올린다.",
        "textEn": "Waterspouts rose as sea wyverns dived to splinter the masts. Kadan stood at the prow, raising his buckler.",
        "choices": [
            {
                "id": "ch17_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "풍랑이 거칠수록 닻을 올리고 폭풍 속으로 나아간다!",
                "labelEn": "The rougher the tempest, the higher we hoist our sails into the storm!",
                "followUpTextKo": "“거친 파도를 방패의 아케인 빛으로 가르며 돛대가 순풍을 타고 질주했다.”",
                "followUpTextEn": "“Parting towering waves with shield-light, the sails caught celestial winds.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "풍랑이 거칠수록 닻을 올리고 폭풍 속으로 나아간다!",
                "textEn": "The rougher the tempest, the higher we hoist our sails into the storm!",
                "reward": {
                    "snsCoins": 25,
                    "buff": "atk_boost",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“거친 파도를 방패의 아케인 빛으로 가르며 돛대가 순풍을 타고 질주했다.”",
                "followUpLineEn": "“Parting towering waves with shield-light, the sails caught celestial winds.”"
            },
            {
                "id": "ch17_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "바람의 각도를 계산해 돛대를 조정하자.",
                "labelEn": "Calculate the wind vectors and trim the sails accordingly.",
                "followUpTextKo": "“암초 지대의 파도 결을 정확히 읽어내어 와이번들의 급강하 공격을 따돌렸다.”",
                "followUpTextEn": "“Threading reef currents cleanly outmaneuvered the wyverns' diving attacks.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[순풍 가속] 스피드 상승",
                "bonusDescEn": "[Tailwind Surge] Speed & Evasion Up",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "바람의 각도를 계산해 돛대를 조정하자.",
                "textEn": "Calculate the wind vectors and trim the sails accordingly.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[순풍 가속] 스피드 상승",
                    "buffNameEn": "[Tailwind Surge] Speed & Evasion Up"
                },
                "followUpLine": "“암초 지대의 파도 결을 정확히 읽어내어 와이번들의 급강하 공격을 따돌렸다.”",
                "followUpLineEn": "“Threading reef currents cleanly outmaneuvered the wyverns' diving attacks.”"
            },
            {
                "id": "ch17_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "바다의 호흡과 교감하여 거친 파도를 다스린다.",
                "labelEn": "Commune with the sea's ancient pulse to calm the wild swells.",
                "followUpTextKo": "“성진호흡의 마나가 바다에 퍼지자 거센 파도가 잔잔한 수로를 열어주었다.”",
                "followUpTextEn": "“Arcane resonance quieted the raging surges, opening a safe canal through the sea.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "바다의 호흡과 교감하여 거친 파도를 다스린다.",
                "textEn": "Commune with the sea's ancient pulse to calm the wild swells.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“성진호흡의 마나가 바다에 퍼지자 거센 파도가 잔잔한 수로를 열어주었다.”",
                "followUpLineEn": "“Arcane resonance quieted the raging surges, opening a safe canal through the sea.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "미지의 바다로",
        "nameEn": "Into the Uncharted Waters",
        "text": "항구를 벗어난 배는 은빛 궤적을 그리며 전설의 바람섬을 향해 나아갔다.",
        "textEn": "Clearing the harbor, the ship carved a silver wake toward the legendary Wind Isle."
    },
  ],
  18: [
    {
        "speaker": "narrator",
        "name": "제 18화: 검은 성전의 비밀",
        "nameEn": "Episode 18: Secret of the Black Sanctum",
        "text": "바다 밑에 가라앉았던 고대 침몰 사원 '검은 성전'. 금지된 서고 서판들 사이에 섭정 아르투스가 심연의 마신과 맺은 피의 계약서가 잠들어 있었다.",
        "textEn": "The sunken subterranean temple of the Black Sanctum. Amidst forbidden archives slept the blood covenant between Regent Artus and Abyssal demons."
    },
    {
        "speaker": "speaker",
        "name": "은둔자 간다르",
        "nameEn": "Gandar the Hermit",
        "cardId": 69,
        "text": "“수백 년 동안 이 사원의 비밀을 지켜왔다. 아르투스는 왕실을 수호한 것이 아니라, 제국 전체를 마신의 제물로 바치려 하고 있어!”",
        "textEn": "“For centuries I guarded these archives. Artus never guarded the crown—he pledged the entire realm as a blood offering!”"
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“사원의 석상 골렘들이 깨어나고 있어! 이 서판을 가지고 빠져나가야 해!”",
        "textEn": "“The temple stone guardians are waking! We must secure these tablets and escape!”"
    },
    {
        "speaker": "choice",
        "name": "금단의 기록 회수",
        "nameEn": "Securing Forbidden Records",
        "cardId": 41,
        "text": "사원 천장이 무너져 내리고 거대 골렘들의 눈에 붉은 마기가 켜진다. 카단은 서판을 지키기 위해 몸을 던진다.",
        "textEn": "The ceiling cracked as ancient golem archons flared with crimson malice. Kadan threw himself forward.",
        "choices": [
            {
                "id": "ch18_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "어둠의 서판을 부수고 진실의 기록만을 취하겠다!",
                "labelEn": "Shatter the dark wards and claim only the record of truth!",
                "followUpTextKo": "“방패의 일격으로 사악한 결계석을 박살 내고 핵심 밀서를 회수했다.”",
                "followUpTextEn": "“A decisive shield slam pulverized the evil seal stone, retrieving the core evidence.”",
                "bonusType": "sns",
                "bonusValue": 20,
                "bonusDescKo": "+20 SNS 획득",
                "bonusDescEn": "+20 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "어둠의 서판을 부수고 진실의 기록만을 취하겠다!",
                "textEn": "Shatter the dark wards and claim only the record of truth!",
                "reward": {
                    "snsCoins": 20,
                    "buff": "atk_boost",
                    "buffName": "+20 SNS 획득",
                    "buffNameEn": "+20 SNS Points"
                },
                "followUpLine": "“방패의 일격으로 사악한 결계석을 박살 내고 핵심 밀서를 회수했다.”",
                "followUpLineEn": "“A decisive shield slam pulverized the evil seal stone, retrieving the core evidence.”"
            },
            {
                "id": "ch18_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "고대 룬어의 문맥을 정확히 해독해야 함정을 피한다.",
                "labelEn": "Decipher the ancient syntax carefully to bypass the pressure traps.",
                "followUpTextKo": "“바닥의 마법 함정을 안전하게 해제하여 희생 없이 사원을 탈출했다.”",
                "followUpTextEn": "“Disarming floor pressure runes allowed everyone to traverse the sanctum unscathed.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[룬 해독 통찰] 트랩 무효화",
                "bonusDescEn": "[Runic Insight] Trap Immunity",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "고대 룬어의 문맥을 정확히 해독해야 함정을 피한다.",
                "textEn": "Decipher the ancient syntax carefully to bypass the pressure traps.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[룬 해독 통찰] 트랩 무효화",
                    "buffNameEn": "[Runic Insight] Trap Immunity"
                },
                "followUpLine": "“바닥의 마법 함정을 안전하게 해제하여 희생 없이 사원을 탈출했다.”",
                "followUpLineEn": "“Disarming floor pressure runes allowed everyone to traverse the sanctum unscathed.”"
            },
            {
                "id": "ch18_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "간다르의 옛 지혜와 감응하여 사원의 결계를 해제한다.",
                "labelEn": "Resonate with Gandar's primordial wisdom to dissolve the temple seals.",
                "followUpTextKo": "“사원 기둥마다 잠들어 있던 고대 영혼들이 카단의 빛을 보고 길을 열어주었다.”",
                "followUpTextEn": "“Dormant spirits within the columns recognized Kadan's pure aura and bowed.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "간다르의 옛 지혜와 감응하여 사원의 결계를 해제한다.",
                "textEn": "Resonate with Gandar's primordial wisdom to dissolve the temple seals.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“사원 기둥마다 잠들어 있던 고대 영혼들이 카단의 빛을 보고 길을 열어주었다.”",
                "followUpLineEn": "“Dormant spirits within the columns recognized Kadan's pure aura and bowed.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "밝혀진 음모",
        "nameEn": "The Conspiracy Unveiled",
        "text": "회수된 피의 계약서에는 섭정 아르투스의 서명과 열한 개 종족의 멸망 계획이 선명히 적혀 있었다.",
        "textEn": "The blood covenant bore Artus's wax seal, outlining the calculated doom of all eleven Arcane races."
    },
  ],
  19: [
    {
        "speaker": "narrator",
        "name": "제 19화: 세 가지 시험",
        "nameEn": "Episode 19: Three Trials",
        "text": "바람섬 중앙 나인섀도우 성소. 나인섀도우 코덱스를 전수받기 위해, 대현자 에올루스가 주재하는 용기, 지혜, 자비의 3대 시험이 시작되었다.",
        "textEn": "The Nine-Shadow Sanctuary at the heart of Wind Isle. Archsage Aeolus initiated the three trials of Courage, Wisdom, and Compassion."
    },
    {
        "speaker": "speaker",
        "name": "에올루스",
        "nameEn": "Aeolus",
        "cardId": 25,
        "text": "“성기사의 후예여, 살기를 품지 않은 방패로 이 허상의 칼바람을 버텨낼 수 있겠느냐? 분노는 검을 무디게 만들 뿐이다.”",
        "textEn": "“Heir of paladins, can a shield unburdened by bloodlust withstand this tempest? Wrath only blunts the edge.”"
    },
    {
        "speaker": "speaker",
        "name": "가웨인",
        "nameEn": "Gawain",
        "cardId": 45,
        "text": "“카단, 환영의 미궁이다! 거울 벽에 비친 것은 네 마음속 두려움이다!”",
        "textEn": "“Kadan, beware the mirror labyrinth! The reflections represent the fears within your heart!”"
    },
    {
        "speaker": "choice",
        "name": "시련의 정점",
        "nameEn": "Pinnacle of Trials",
        "cardId": 41,
        "text": "거울 속에서 아버지 알렉산다르의 부러진 검과 마신의 형상이 겹쳐 보인다. 카단은 평정심을 유지하며 방패를 세운다.",
        "textEn": "In the mirror, Aleksandar's shattered blade overlapped with demonic shades. Kadan stood poised.",
        "choices": [
            {
                "id": "ch19_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "가장 거센 바람이라도 내 의지를 꺾을 수 없다!",
                "labelEn": "Not even the fiercest gale can shatter my unbending resolve!",
                "followUpTextKo": "“폭풍의 눈 한가운데를 방패로 뚫고 나아가 용기의 시험을 통과했다.”",
                "followUpTextEn": "“Piercing through the tempest eye on foot conquered the trial of Courage.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[시련 통과 위압] 공격력 +20%",
                "bonusDescEn": "[Trial Overcome] +20% ATK",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "가장 거센 바람이라도 내 의지를 꺾을 수 없다!",
                "textEn": "Not even the fiercest gale can shatter my unbending resolve!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[시련 통과 위압] 공격력 +20%",
                    "buffNameEn": "[Trial Overcome] +20% ATK"
                },
                "followUpLine": "“폭풍의 눈 한가운데를 방패로 뚫고 나아가 용기의 시험을 통과했다.”",
                "followUpLineEn": "“Piercing through the tempest eye on foot conquered the trial of Courage.”"
            },
            {
                "id": "ch19_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "미궁의 반사벽을 이용해 바람의 역류를 짚어낸다.",
                "labelEn": "Utilize reflective walls to map the wind's reverse vortices.",
                "followUpTextKo": "“거울의 굴절 각도를 파악해 숨겨진 출구 룬을 정확히 찾아냈다.”",
                "followUpTextEn": "“Calculating the reflection angles led directly to the hidden exit rune.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "미궁의 반사벽을 이용해 바람의 역류를 짚어낸다.",
                "textEn": "Utilize reflective walls to map the wind's reverse vortices.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“거울의 굴절 각도를 파악해 숨겨진 출구 룬을 정확히 찾아냈다.”",
                "followUpLineEn": "“Calculating the reflection angles led directly to the hidden exit rune.”"
            },
            {
                "id": "ch19_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "시험관의 영혼을 상하게 하지 않고 마나만 부드럽게 흘린다.",
                "labelEn": "Harm not the examiners' spirits; divert their mana gently.",
                "followUpTextKo": "“자비의 시험에서 검을 거두자 시험관들이 미소 지으며 코덱스를 건넸다.”",
                "followUpTextEn": "“Sheathing his blade in the trial of Compassion earned the judges' profound blessing.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "시험관의 영혼을 상하게 하지 않고 마나만 부드럽게 흘린다.",
                "textEn": "Harm not the examiners' spirits; divert their mana gently.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“자비의 시험에서 검을 거두자 시험관들이 미소 지으며 코덱스를 건넸다.”",
                "followUpLineEn": "“Sheathing his blade in the trial of Compassion earned the judges' profound blessing.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "코덱스의 전수",
        "nameEn": "Inheriting the Codex",
        "text": "“용기 위에 지혜를 더하고, 힘 위에 자비를 얹었으니, 그대는 진정한 코덱스의 계승자다.”",
        "textEn": "“You tempered courage with wisdom and crowned power with compassion. You are the true heir.”"
    },
  ],
  20: [
    {
        "speaker": "narrator",
        "name": "제 20화: 꽃배를 삼킨 파도",
        "nameEn": "Episode 20: The Wave That Swallowed the Flower Ship",
        "text": "바람섬 외해를 순항하던 화려한 외교선 '꽃배'. 심연의 거대 잠수함이 소환한 인공 해일이 덮쳐오며 선체가 산산조각 날 위기에 처했다.",
        "textEn": "Aboard the diplomatic flower yacht offshore. An artificial rogue tidal wave conjured by abyssal dreadnoughts bore down upon the vessel."
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“거대 해일이야! 꽃배의 돛대가 부러지고 있어! 갑판으로 마수들이 기어오른다!”",
        "textEn": "“A monstrous rogue wave! The masts are snapping! Abyssal boarders are swarming the deck!”"
    },
    {
        "speaker": "speaker",
        "name": "은둔자 간다르",
        "nameEn": "Gandar the Hermit",
        "cardId": 69,
        "text": "“심연의 어둠 마법사들이 바다 밑에서 해류를 뒤틀고 있다! 배가 전복되면 모두 끝장이야!”",
        "textEn": "“Abyssal sorcerers are twisting currents from below! If the hull overturns, we are all lost!”"
    },
    {
        "speaker": "choice",
        "name": "해일 앞의 방패",
        "nameEn": "Shield Before the Wave",
        "cardId": 41,
        "text": "수십 길 높이의 검은 파도가 배를 집어삼키려 한다. 카단은 선수에 방패를 박아 넣으며 일행을 지킨다.",
        "textEn": "A fifty-foot black wall of water threatened to engulf the ship. Kadan wedged his shield into the prow.",
        "choices": [
            {
                "id": "ch20_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "선수 갑판에 방패를 박아 침몰을 막아내겠다!",
                "labelEn": "Anchor the shield into the prow deck to stop the capsizing!",
                "followUpTextKo": "“방패가 배의 중심을 굳건히 잡으며 덮쳐온 파도를 양 갈래로 갈라놓았다.”",
                "followUpTextEn": "“Anchoring the shield held the yacht's center, cleaving the cresting wave in two.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[강철 고정] 방어벽 지속",
                "bonusDescEn": "[Iron Anchor] Persistent Defense",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "선수 갑판에 방패를 박아 침몰을 막아내겠다!",
                "textEn": "Anchor the shield into the prow deck to stop the capsizing!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[강철 고정] 방어벽 지속",
                    "buffNameEn": "[Iron Anchor] Persistent Defense"
                },
                "followUpLine": "“방패가 배의 중심을 굳건히 잡으며 덮쳐온 파도를 양 갈래로 갈라놓았다.”",
                "followUpLineEn": "“Anchoring the shield held the yacht's center, cleaving the cresting wave in two.”"
            },
            {
                "id": "ch20_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "물길 유입구를 차단하고 비상 구명정을 확보하자.",
                "labelEn": "Seal bilge intake hatches and prepare the emergency skiffs.",
                "followUpTextKo": "“신속하게 침수 구획을 봉쇄하여 선체의 부력을 유지해 냈다.”",
                "followUpTextEn": "“Sealing flood compartments preserved hull buoyancy just in the nick of time.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "물길 유입구를 차단하고 비상 구명정을 확보하자.",
                "textEn": "Seal bilge intake hatches and prepare the emergency skiffs.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“신속하게 침수 구획을 봉쇄하여 선체의 부력을 유지해 냈다.”",
                "followUpLineEn": "“Sealing flood compartments preserved hull buoyancy just in the nick of time.”"
            },
            {
                "id": "ch20_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "바람을 일으켜 꽃배의 선체를 수면 위로 띄운다.",
                "labelEn": "Summon Arcane upsurges to lift the flower ship above the swell.",
                "followUpTextKo": "“빛나는 상승기류가 선체를 감싸 안으며 꽃배를 파도 너머로 가볍게 띄웠다.”",
                "followUpTextEn": "“A radiant updraft cradled the vessel, lifting it cleanly over the foaming crest.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "바람을 일으켜 꽃배의 선체를 수면 위로 띄운다.",
                "textEn": "Summon Arcane upsurges to lift the flower ship above the swell.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“빛나는 상승기류가 선체를 감싸 안으며 꽃배를 파도 너머로 가볍게 띄웠다.”",
                "followUpLineEn": "“A radiant updraft cradled the vessel, lifting it cleanly over the foaming crest.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "폭풍 속의 생환",
        "nameEn": "Survival in the Gale",
        "text": "해일은 지나갔으나 배는 부서져 외딴 암초 섬을 향해 표류하기 시작했다.",
        "textEn": "The tidal wave passed, but the battered vessel drifted toward an uncharted volcanic reef."
    },
  ],
  21: [
    {
        "speaker": "narrator",
        "name": "제 21화: 불타는 배의 배신",
        "nameEn": "Episode 21: Betrayal Aboard the Burning Ship",
        "text": "한밤중 불타오르는 기함의 갑판. 루시안 총독이 이끄는 잠입 부대가 화약고를 폭파하며 본색을 드러내었다.",
        "textEn": "The burning deck of the flagship at midnight. Governor Lucian's infiltrators detonated powder magazines, shedding all disguises."
    },
    {
        "speaker": "speaker",
        "name": "루시안",
        "nameEn": "Lucian",
        "cardId": 61,
        "text": "“하하하! 카단, 이그니스! 이 배는 너희의 관짝이다! 섭정 아르투스 님께서 온 대륙의 황제가 되실 것이다!”",
        "textEn": "“Hahaha! Kadan, Ignis! This ship is your watery coffin! Regent Artus will rule all eleven realms!”"
    },
    {
        "speaker": "speaker",
        "name": "황자 이그니스",
        "nameEn": "Prince Ignis",
        "cardId": 11,
        "text": "“루시안! 너는 왕실의 신하가 아니라 마신을 섬기는 버러지였구나! 내 불꽃으로 죄를 심판하겠다!”",
        "textEn": "“Lucian! You were no loyal servant, but vermin worshipping demons! My flames will judge your crimes!”"
    },
    {
        "speaker": "choice",
        "name": "화염 갑판의 혈투",
        "nameEn": "Duel on the Burning Deck",
        "cardId": 41,
        "text": "불타는 돛대가 쓰러지고 화약 연기가 눈을 찌른다. 카단은 이그니스와 등을 맞대고 배신자들을 향해 돌진한다.",
        "textEn": "Burning rigging crashed across the deck as choking smoke rose. Kadan and Ignis faced the traitors back-to-back.",
        "choices": [
            {
                "id": "ch21_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "불타는 돛대를 베어내고 적 지휘관을 직접 친다!",
                "labelEn": "Cleave the burning mast and strike down the enemy commander!",
                "followUpTextKo": "“타오르는 기둥을 쳐내며 루시안의 방패를 부수고 일격을 가했다.”",
                "followUpTextEn": "“Swinging through falling beams, Kadan shattered Lucian's personal guard.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[화염 돌파] 돌파 데미지 +25%",
                "bonusDescEn": "[Flame Charge] +25% Rush DMG",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "불타는 돛대를 베어내고 적 지휘관을 직접 친다!",
                "textEn": "Cleave the burning mast and strike down the enemy commander!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[화염 돌파] 돌파 데미지 +25%",
                    "buffNameEn": "[Flame Charge] +25% Rush DMG"
                },
                "followUpLine": "“타오르는 기둥을 쳐내며 루시안의 방패를 부수고 일격을 가했다.”",
                "followUpLineEn": "“Swinging through falling beams, Kadan shattered Lucian's personal guard.”"
            },
            {
                "id": "ch21_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "침수 구역의 균형을 맞춰 폭발 연쇄를 막아낸다.",
                "labelEn": "Flood secondary compartments to halt chain explosions.",
                "followUpTextKo": "“화약고 밸브를 신속히 잠가 선체 대폭발을 사전에 차단했다.”",
                "followUpTextEn": "“Shutting emergency valves prevented a catastrophic magazine detonation.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "침수 구역의 균형을 맞춰 폭발 연쇄를 막아낸다.",
                "textEn": "Flood secondary compartments to halt chain explosions.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“화약고 밸브를 신속히 잠가 선체 대폭발을 사전에 차단했다.”",
                "followUpLineEn": "“Shutting emergency valves prevented a catastrophic magazine detonation.”"
            },
            {
                "id": "ch21_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "이그니스의 불길과 내 방패를 합쳐 탈출로를 연다.",
                "labelEn": "Combine Ignis's flame with my shield to blast an exit.",
                "followUpTextKo": "“화염과 방패의 충격파가 적 포위망을 뚫고 바다로 뛰어들 길을 열었다.”",
                "followUpTextEn": "“A shockwave of flame and shield blasted open a clear escape route into the sea.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "이그니스의 불길과 내 방패를 합쳐 탈출로를 연다.",
                "textEn": "Combine Ignis's flame with my shield to blast an exit.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“화염과 방패의 충격파가 적 포위망을 뚫고 바다로 뛰어들 길을 열었다.”",
                "followUpLineEn": "“A shockwave of flame and shield blasted open a clear escape route into the sea.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "불타는 바다",
        "nameEn": "The Burning Sea",
        "text": "기함은 폭음과 함께 바닷속으로 가라앉았고, 생존자들은 밤바다의 거친 파도에 휩쓸려 흩어졌다.",
        "textEn": "The flagship plunged into the abyss with a roar, scattering the survivors into the dark surf."
    },
  ],
  22: [
    {
        "speaker": "narrator",
        "name": "제 22화: 무인도의 네 사람",
        "nameEn": "Episode 22: Four on a Deserted Island",
        "text": "이름 모를 화산섬의 검은 모래 해변. 조난당한 카단, 실리아, 그림리, 이그니스 네 사람은 부러진 노와 파편을 짚고 해안에 밀려왔다.",
        "textEn": "The black volcanic sand of an uncharted reef. Castaways Kadan, Celia, Grimli, and Ignis crawled ashore on floating wreckage."
    },
    {
        "speaker": "speaker",
        "name": "그림리",
        "nameEn": "Grimli",
        "cardId": 74,
        "text": "“어이구 삭신이야... 소금물에 절어 죽는 줄 알았네. 하지만 저 바위틈에서 거대 게 괴수들이 기어 나오고 있어!”",
        "textEn": "“Ugh, my aching bones... thought I was pickled alive. But look, giant crab chimeras crawl from the reef!”"
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“담수가 없으면 하루도 못 버텨. 동굴 안쪽의 샘물을 지켜야 해!”",
        "textEn": "“Without fresh water we won't last a day. We must secure the spring inside the cavern!”"
    },
    {
        "speaker": "choice",
        "name": "무인도의 생존 결단",
        "nameEn": "Survival Pact on the Island",
        "cardId": 41,
        "text": "야간 만조와 함께 암초 괴수들이 은신처로 몰려든다. 네 사람은 생존을 위해 각자의 역할을 분담한다.",
        "textEn": "With the midnight tide, chimeras swarmed their makeshift shelter. The four castaways took their stations.",
        "choices": [
            {
                "id": "ch22_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "밤안개 속에서 습격해 오는 거대 게 괴수를 방패로 내리친다!",
                "labelEn": "Smash the charging crab chimeras head-on with the shield!",
                "followUpTextKo": "“단단한 갑각을 방패의 충격파로 박살 내며 해변을 지켜냈다.”",
                "followUpTextEn": "“A crushing shield slam shattered the chimeras' reinforced carapaces.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "밤안개 속에서 습격해 오는 거대 게 괴수를 방패로 내리친다!",
                "textEn": "Smash the charging crab chimeras head-on with the shield!",
                "reward": {
                    "snsCoins": 25,
                    "buff": "atk_boost",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“단단한 갑각을 방패의 충격파로 박살 내며 해변을 지켜냈다.”",
                "followUpLineEn": "“A crushing shield slam shattered the chimeras' reinforced carapaces.”"
            },
            {
                "id": "ch22_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "동굴 안쪽의 담수를 찾고 불씨를 지킨다.",
                "labelEn": "Locate the fresh spring within the cave and nurture our fire.",
                "followUpTextKo": "“깨끗한 지하수를 확보하고 젖은 나뭇가지로 따뜻한 모닥불을 피워냈다.”",
                "followUpTextEn": "“Securing fresh subterranean water and a warm fire restored their vitality.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[생존 본능] 체력 회복력 상승",
                "bonusDescEn": "[Survival Vigor] HP Regen Up",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "동굴 안쪽의 담수를 찾고 불씨를 지킨다.",
                "textEn": "Locate the fresh spring within the cave and nurture our fire.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[생존 본능] 체력 회복력 상승",
                    "buffNameEn": "[Survival Vigor] HP Regen Up"
                },
                "followUpLine": "“깨끗한 지하수를 확보하고 젖은 나뭇가지로 따뜻한 모닥불을 피워냈다.”",
                "followUpLineEn": "“Securing fresh subterranean water and a warm fire restored their vitality.”"
            },
            {
                "id": "ch22_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "달빛 아래서 네 사람의 호흡을 하나로 모은다.",
                "labelEn": "Unite the four heartbeats into one beneath the full moon.",
                "followUpTextKo": "“모닥불 주위에 둘러앉아 상처를 치료하며 둘도 없는 전우애를 다졌다.”",
                "followUpTextEn": "“Gathered around the fire, shared hardships forged an unbreakable brotherhood.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "달빛 아래서 네 사람의 호흡을 하나로 모은다.",
                "textEn": "Unite the four heartbeats into one beneath the full moon.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“모닥불 주위에 둘러앉아 상처를 치료하며 둘도 없는 전우애를 다졌다.”",
                "followUpLineEn": "“Gathered around the fire, shared hardships forged an unbreakable brotherhood.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "화산섬의 모닥불",
        "nameEn": "Campfire on the Volcanic Reef",
        "text": "“서로 다른 곳에서 자라났으나, 오늘 밤 우리는 한 핏줄보다 진한 형제가 되었다.”",
        "textEn": "“Though born in distant lands, tonight we are brothers closer than blood.”"
    },
  ],
  23: [
    {
        "speaker": "narrator",
        "name": "제 23화: 동굴 속 잠든 기록",
        "nameEn": "Episode 23: The Record Sleeping in the Cave",
        "text": "화산섬 지하 용암 동굴 깊은 곳. 이끼 낀 거대한 성기사단 기념비 석벽에 알렉산다르와 발리안 두 아버지의 친필 서약문이 새겨져 있었다.",
        "textEn": "Deep within the lava grotto of the volcanic isle. An ancient paladin monument preserved the handwritten oath carved by Aleksandar and Balian."
    },
    {
        "speaker": "speaker",
        "name": "황자 이그니스",
        "nameEn": "Prince Ignis",
        "cardId": 11,
        "text": "“아버지의 글씨다... ‘언젠가 우리 아이들이 이 석벽 앞에 서는 날, 대륙에 다시 참된 봄이 찾아오리라’...!”",
        "textEn": "“It is my father's script... ‘On the day our sons stand before this wall, true spring shall return to the continent’...!”"
    },
    {
        "speaker": "speaker",
        "name": "카단",
        "nameEn": "Kadan",
        "cardId": 41,
        "text": "“아버지들의 희생은 패배가 아니었어. 미래의 우리에게 정의의 씨앗을 남겨주신 거야.”",
        "textEn": "“Their sacrifice was never defeat. They planted the seeds of justice for our tomorrow.”"
    },
    {
        "speaker": "choice",
        "name": "석비 앞의 계승",
        "nameEn": "Inheritance Before the Stele",
        "cardId": 41,
        "text": "석벽에 새겨진 고대 룬 문자가 은빛 단검의 마나와 감응하여 빛나기 시작한다.",
        "textEn": "The runic inscriptions on the stele glowed warmly, resonating with the twin silver daggers.",
        "choices": [
            {
                "id": "ch23_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "아버지들의 맹세를 내 방패에 영원히 새기겠다!",
                "labelEn": "Carve our fathers' oath permanently upon my shield!",
                "followUpTextKo": "“방패의 문장에 황금빛 서약이 각인되며 성기사의 투기가 각성했다.”",
                "followUpTextEn": "“The golden vow etched itself into the crest, awakening paladin aura.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[영웅의 서약] 전체 스탯 +15%",
                "bonusDescEn": "[Hero's Vow] +15% All Stats",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "아버지들의 맹세를 내 방패에 영원히 새기겠다!",
                "textEn": "Carve our fathers' oath permanently upon my shield!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[영웅의 서약] 전체 스탯 +15%",
                    "buffNameEn": "[Hero's Vow] +15% All Stats"
                },
                "followUpLine": "“방패의 문장에 황금빛 서약이 각인되며 성기사의 투기가 각성했다.”",
                "followUpLineEn": "“The golden vow etched itself into the crest, awakening paladin aura.”"
            },
            {
                "id": "ch23_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "석판 뒷면에 새겨진 나인섀도우 코덱스 비전을 사경한다.",
                "labelEn": "Transcribe the Nine-Shadow Codex diagrams engraved on the reverse.",
                "followUpTextKo": "“석판의 비전 도해를 완벽히 암기하여 아케인 연계 초식을 완성했다.”",
                "followUpTextEn": "“Memorizing the ancient diagrams perfected their Arcane synergy chain.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "석판 뒷면에 새겨진 나인섀도우 코덱스 비전을 사경한다.",
                "textEn": "Transcribe the Nine-Shadow Codex diagrams engraved on the reverse.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“석판의 비전 도해를 완벽히 암기하여 아케인 연계 초식을 완성했다.”",
                "followUpLineEn": "“Memorizing the ancient diagrams perfected their Arcane synergy chain.”"
            },
            {
                "id": "ch23_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "부모님들의 영혼과 마주하며 눈물을 닦는다.",
                "labelEn": "Face our parents' spirits in reverence and wipe away our tears.",
                "followUpTextKo": "“석벽에서 피어난 따스한 빛기둥이 두 청년의 어깨를 감싸 안아주었다.”",
                "followUpTextEn": "“A pillar of gentle light enveloped both sons in a loving paternal embrace.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "부모님들의 영혼과 마주하며 눈물을 닦는다.",
                "textEn": "Face our parents' spirits in reverence and wipe away our tears.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“석벽에서 피어난 따스한 빛기둥이 두 청년의 어깨를 감싸 안아주었다.”",
                "followUpLineEn": "“A pillar of gentle light enveloped both sons in a loving paternal embrace.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "되살아난 맹세",
        "nameEn": "The Resurrected Oath",
        "text": "과거의 서약은 이제 두 아들의 손에서 대륙을 구원할 불꽃과 방패로 다시 태어났다.",
        "textEn": "The covenant of the past was reborn in the hands of two sons as flame and shield."
    },
  ],
  24: [
    {
        "speaker": "narrator",
        "name": "제 24화: 봉인실의 일곱 밤",
        "nameEn": "Episode 24: Seven Nights in the Sealed Chamber",
        "text": "화산섬 붕괴와 함께 닫혀버린 흑요석 봉인실. 공기와 식수가 고갈되어 가는 칠흑의 어둠 속에서 네 사람은 일주일간 사투를 벌였다.",
        "textEn": "The obsidian vault sealed by collapsing bedrock. With air and water dwindling in pitch darkness, the castaways endured for seven grueling nights."
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“숨이... 가빠와... 하지만 카단, 네가 곁에 있어서 무섭지 않아...”",
        "textEn": "“Air is... growing thin... but Kadan, with you beside me, I feel no fear...”"
    },
    {
        "speaker": "speaker",
        "name": "길가메시",
        "nameEn": "Gilgamesh",
        "cardId": 47,
        "text": "“바깥에서 아르투스의 기갑 부대가 섬을 포격하고 있다. 이 문을 부수지 못하면 생매장당한다!”",
        "textEn": "“Artus's siege engines are bombarding the island outside. If we don't breach this gate, we suffocate!”"
    },
    {
        "speaker": "choice",
        "name": "일곱 번째 밤의 돌파",
        "nameEn": "Breakthrough on the Seventh Night",
        "cardId": 41,
        "text": "마지막 한 줌의 공기 속에서 카단과 이그니스는 모든 마나를 하나로 모아 흑요석 문을 겨냥한다.",
        "textEn": "In the last pocket of breathable air, Kadan and Ignis pooled all remaining mana against the door.",
        "choices": [
            {
                "id": "ch24_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "마지막 마나를 짜내어 문짝을 걷어찬다!",
                "labelEn": "Pour every drop of mana to smash down the obsidian door!",
                "followUpTextKo": "“방패와 백색 화염이 결합한 폭발적인 충격으로 육중한 흑요석 문이 산산조각 났다.”",
                "followUpTextEn": "“The fusion of shield and white fire shattered the massive obsidian gate to pebbles.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "마지막 마나를 짜내어 문짝을 걷어찬다!",
                "textEn": "Pour every drop of mana to smash down the obsidian door!",
                "reward": {
                    "snsCoins": 25,
                    "buff": "atk_boost",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“방패와 백색 화염이 결합한 폭발적인 충격으로 육중한 흑요석 문이 산산조각 났다.”",
                "followUpLineEn": "“The fusion of shield and white fire shattered the massive obsidian gate to pebbles.”"
            },
            {
                "id": "ch24_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "호흡을 최소화하여 칠흑의 어둠 속에서 빛을 기다린다.",
                "labelEn": "Conserve breath to the minimum and locate the structural stress flaw.",
                "followUpTextKo": "“어둠 속에서 미세한 마나 결을 짚어내어 문의 빗장 경첩을 정밀 타격했다.”",
                "followUpTextEn": "“Targeting the stress fissure precisely unhinged the lock with minimal effort.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[인내의 심장] 상태이상 저항",
                "bonusDescEn": "[Patient Core] Status Debuff RES",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "호흡을 최소화하여 칠흑의 어둠 속에서 빛을 기다린다.",
                "textEn": "Conserve breath to the minimum and locate the structural stress flaw.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[인내의 심장] 상태이상 저항",
                    "buffNameEn": "[Patient Core] Status Debuff RES"
                },
                "followUpLine": "“어둠 속에서 미세한 마나 결을 짚어내어 문의 빗장 경첩을 정밀 타격했다.”",
                "followUpLineEn": "“Targeting the stress fissure precisely unhinged the lock with minimal effort.”"
            },
            {
                "id": "ch24_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "성진호흡의 정수로 공기 중의 희박한 마나를 정화한다.",
                "labelEn": "Filter the stagnant air with the essence of Star Breathing.",
                "followUpTextKo": "“신선한 마나 기류가 밀폐실을 채우며 전원의 생명력을 온전히 보존했다.”",
                "followUpTextEn": "“A stream of fresh mana revitalized the vault, preserving everyone's strength.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "성진호흡의 정수로 공기 중의 희박한 마나를 정화한다.",
                "textEn": "Filter the stagnant air with the essence of Star Breathing.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“신선한 마나 기류가 밀폐실을 채우며 전원의 생명력을 온전히 보존했다.”",
                "followUpLineEn": "“A stream of fresh mana revitalized the vault, preserving everyone's strength.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "태양 아래로",
        "nameEn": "Out into the Sun",
        "text": "칠일 만에 터져 나온 햇살 아래, 네 사람은 눈부신 아침 바다를 마주하며 포효했다.",
        "textEn": "Bursting out into sunlight after seven nights, the four castaways roared before the morning sea."
    },
  ],
  25: [
    {
        "speaker": "narrator",
        "name": "제 25화: 거짓 혼례의 밤",
        "nameEn": "Episode 25: Night of the False Wedding",
        "text": "도성 대성당 주 제단. 루시안은 납치한 실리아를 강제로 옥좌의 제물로 삼아 황실 결속을 조작하려는 거짓 혼례식을 거행하고 있었다.",
        "textEn": "The high altar of the Imperial Cathedral. Lucian staged a forced wedding with captive Celia to fabricate royal legitimacy."
    },
    {
        "speaker": "speaker",
        "name": "루시안",
        "nameEn": "Lucian",
        "cardId": 61,
        "text": "“실리아, 네가 거부해도 상관없다. 이 반지를 끼는 순간 정보 길드는 황실의 충견이 될 테니까!”",
        "textEn": "“Refuse all you like, Celia. The moment this ring touches your finger, your guild serves the throne!”"
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“닥쳐! 내 손은 오직 진실과 자유를 위해 움직여! 카단이 반드시 올 거야!”",
        "textEn": "“Shut your mouth! My hands work only for truth and liberty! Kadan will come for you!”"
    },
    {
        "speaker": "choice",
        "name": "성당 창문의 난입",
        "nameEn": "Crashing the Cathedral Window",
        "cardId": 41,
        "text": "주교가 강제로 반지를 끼우려는 순간, 스테인드글라스 창문이 박살 나며 카단이 방패를 들고 공중에서 강착한다.",
        "textEn": "As the priest raised the forced ring, stained glass shattered as Kadan descended shield-first.",
        "choices": [
            {
                "id": "ch25_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "거짓된 혼례는 끝났다! 실리아, 내 손을 잡아라!",
                "labelEn": "The false wedding is over! Celia, take my hand!",
                "followUpTextKo": "“제단 바닥을 방패로 강타해 루시안의 친위대를 날려버리고 실리아를 품에 안았다.”",
                "followUpTextEn": "“Slamming the altar shattered the dais, sending guards flying as Kadan caught Celia.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[질풍의 돌격] 공격속도 +25%",
                "bonusDescEn": "[Tempest Rush] +25% ATK Speed",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "거짓된 혼례는 끝났다! 실리아, 내 손을 잡아라!",
                "textEn": "The false wedding is over! Celia, take my hand!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[질풍의 돌격] 공격속도 +25%",
                    "buffNameEn": "[Tempest Rush] +25% ATK Speed"
                },
                "followUpLine": "“제단 바닥을 방패로 강타해 루시안의 친위대를 날려버리고 실리아를 품에 안았다.”",
                "followUpLineEn": "“Slamming the altar shattered the dais, sending guards flying as Kadan caught Celia.”"
            },
            {
                "id": "ch25_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "성당 바닥의 룬 마법진을 먼저 파괴해 결계를 푼다.",
                "labelEn": "Smash the binding rune circle etched into the cathedral marble.",
                "followUpTextKo": "“단검을 바닥에 내리꽂아 실리아를 구속하던 마비 주술을 완전히 해제했다.”",
                "followUpTextEn": "“Planting the dagger into the floor dissolved the paralysis runes binding Celia.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "성당 바닥의 룬 마법진을 먼저 파괴해 결계를 푼다.",
                "textEn": "Smash the binding rune circle etched into the cathedral marble.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“단검을 바닥에 내리꽂아 실리아를 구속하던 마비 주술을 완전히 해제했다.”",
                "followUpLineEn": "“Planting the dagger into the floor dissolved the paralysis runes binding Celia.”"
            },
            {
                "id": "ch25_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "바람의 갈대 피리 소리에 공명하여 호위병들을 혼란시킨다.",
                "labelEn": "Resonate with the reed flute melody to disorient imperial sentries.",
                "followUpTextKo": "“청아한 풀피리 소리가 대성당 돔을 채우며 호위병들의 마나를 마비시켰다.”",
                "followUpTextEn": "“Clear flute notes filled the cathedral dome, causing the inquisitors to drop their halberds.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "바람의 갈대 피리 소리에 공명하여 호위병들을 혼란시킨다.",
                "textEn": "Resonate with the reed flute melody to disorient imperial sentries.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“청아한 풀피리 소리가 대성당 돔을 채우며 호위병들의 마나를 마비시켰다.”",
                "followUpLineEn": "“Clear flute notes filled the cathedral dome, causing the inquisitors to drop their halberds.”"
            }
        ]
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“헤헤... 늦지 않았네, 내 든든한 방패 도련님!”",
        "textEn": "“Hehe... right on time, my dependable shield master!”"
    },
  ],
  26: [
    {
        "speaker": "narrator",
        "name": "제 26화: 열린 문, 닫힌 마음",
        "nameEn": "Episode 26: Open Door, Closed Heart",
        "text": "철벽 요새 살육의 안뜰. 열려 있던 성문은 섭정군의 함정이었고, 오랜 고문과 불신에 상처 입은 동료들 사이에 긴장감이 감돌았다.",
        "textEn": "The killing courtyard of the Iron Bastion. The open gate was an ambush; past traumas and distrust threatened ally unity."
    },
    {
        "speaker": "speaker",
        "name": "루시안",
        "nameEn": "Lucian",
        "cardId": 61,
        "text": "“하하! 의심하라! 서로가 배신자라고 믿어라! 너희의 분열이 곧 황실의 승리다!”",
        "textEn": "“Haha! Suspect each other! Doubt your comrades! Your division guarantees imperial victory!”"
    },
    {
        "speaker": "speaker",
        "name": "이그니스",
        "nameEn": "Ignis",
        "cardId": 11,
        "text": "“카단, 매복병들의 화살이 안뜰 전체를 덮쳤다! 퇴로가 차단당했어!”",
        "textEn": "“Kadan, arrow volleys cover the entire square! The portcullis slammed shut behind us!”"
    },
    {
        "speaker": "choice",
        "name": "안뜰의 진형 형성",
        "nameEn": "Forming the Phalanx",
        "cardId": 41,
        "text": "불신과 두려움으로 흔들리는 아군들. 카단은 방패를 높이 치켜들며 전열의 구심점이 된다.",
        "textEn": "Allies wavered amidst suspicion and flying iron. Kadan thrust his shield high, rallying the phalanx.",
        "choices": [
            {
                "id": "ch26_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "닫힌 문이라도 내가 앞장서서 부수고 나아가겠다!",
                "labelEn": "Even if barred, I will lead the charge and break through the gate!",
                "followUpTextKo": "“방패를 앞세워 성문 빗장을 들이받아 탈출로를 활짝 열어젖혔다.”",
                "followUpTextEn": "“Ramming the iron bars with his shield tore the heavy gates right off their hinges.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "닫힌 문이라도 내가 앞장서서 부수고 나아가겠다!",
                "textEn": "Even if barred, I will lead the charge and break through the gate!",
                "reward": {
                    "snsCoins": 25,
                    "buff": "atk_boost",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“방패를 앞세워 성문 빗장을 들이받아 탈출로를 활짝 열어젖혔다.”",
                "followUpLineEn": "“Ramming the iron bars with his shield tore the heavy gates right off their hinges.”"
            },
            {
                "id": "ch26_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "매복병들의 화살 사선을 피해 성벽 위로 이동하자.",
                "labelEn": "Evade the archers' kill-zone and scale the inner parapets.",
                "followUpTextKo": "“성벽 사각지대를 공략해 궁병 탑을 점령하고 전황을 역전시켰다.”",
                "followUpTextEn": "“Seizing the archer towers from their blind spot turned the courtyard trap inside out.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[사선 회피] 회피율 +20%",
                "bonusDescEn": "[Killzone Evade] +20% Evasion",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "매복병들의 화살 사선을 피해 성벽 위로 이동하자.",
                "textEn": "Evade the archers' kill-zone and scale the inner parapets.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[사선 회피] 회피율 +20%",
                    "buffNameEn": "[Killzone Evade] +20% Evasion"
                },
                "followUpLine": "“성벽 사각지대를 공략해 궁병 탑을 점령하고 전황을 역전시켰다.”",
                "followUpLineEn": "“Seizing the archer towers from their blind spot turned the courtyard trap inside out.”"
            },
            {
                "id": "ch26_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "상처 입은 동료의 마음에 먼저 방패를 내어준다.",
                "labelEn": "Extend my shield first to heal the wounded hearts of comrades.",
                "followUpTextKo": "“불신을 씻어내는 수호의 온기가 퍼지며 일행은 깨지지 않는 원형 방진을 이뤘다.”",
                "followUpTextEn": "“Gentle protective warmth dissolved lingering doubts, forging an unbreakable circle.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "상처 입은 동료의 마음에 먼저 방패를 내어준다.",
                "textEn": "Extend my shield first to heal the wounded hearts of comrades.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“불신을 씻어내는 수호의 온기가 퍼지며 일행은 깨지지 않는 원형 방진을 이뤘다.”",
                "followUpLineEn": "“Gentle protective warmth dissolved lingering doubts, forging an unbreakable circle.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "굳건해진 신뢰",
        "nameEn": "Hardened Trust",
        "text": "닫혔던 마음의 문이 열리자, 안뜰의 매복병들은 결속된 방패 앞에 무너져 내렸다.",
        "textEn": "As closed hearts opened, the ambush collapsed before the united shield line."
    },
  ],
  27: [
    {
        "speaker": "narrator",
        "name": "제 27화: 두 약속 사이",
        "nameEn": "Episode 27: Between Two Promises",
        "text": "적산 협곡 갈림길. 아르투스 섭정의 보급선을 타격할 절호의 기회와, 약탈대에게 쫓기는 수천 명의 피난민 행렬이 갈림길에 놓여 있었다.",
        "textEn": "The crossroads of Red Mountain Pass. A decisive opportunity to strike Artus's supply lines clashed with the desperate plight of fleeing refugee wagons."
    },
    {
        "speaker": "speaker",
        "name": "길가메시",
        "nameEn": "Gilgamesh",
        "cardId": 47,
        "text": "“보급 기지를 불태우면 아르투스의 군세는 궤멸한다! 이것이 전쟁을 끝낼 가장 빠른 길이다!”",
        "textEn": "“Torching the supply depot will cripple Artus's armies! It is the fastest path to victory!”"
    },
    {
        "speaker": "speaker",
        "name": "어린 피난민 소녀",
        "nameEn": "Young Refugee Girl",
        "cardId": 42,
        "text": "“기사님... 저 뒤에서 늑대 탄 마적들이 오고 있어요... 엄마가 다쳤어요...”",
        "textEn": "“Sir knight... wolf riders are coming behind us... my mother is wounded...”"
    },
    {
        "speaker": "choice",
        "name": "갈림길의 선택",
        "nameEn": "Choice at the Crossroads",
        "cardId": 41,
        "text": "복수와 승리, 그리고 무고한 생명의 수호. 카단은 성기사로서 걸어야 할 참된 길을 마음에 새긴다.",
        "textEn": "Strategic vengeance versus the defense of innocent lives. Kadan weighed the true oath of paladins.",
        "choices": [
            {
                "id": "ch27_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "눈앞의 백성을 구하는 것이 성기사의 유일한 길이다!",
                "labelEn": "Shielding the innocent people before us is the only true oath!",
                "followUpTextKo": "“피난민 마차 앞에 단신으로 서서 약탈 기병들의 진격을 완벽히 차단했다.”",
                "followUpTextEn": "“Standing alone before the refugee wagons halted the raiding horde in its tracks.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[수호의 의지] 아군 전체 쉴드",
                "bonusDescEn": "[Shield of the Weak] Party Shield",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "눈앞의 백성을 구하는 것이 성기사의 유일한 길이다!",
                "textEn": "Shielding the innocent people before us is the only true oath!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[수호의 의지] 아군 전체 쉴드",
                    "buffNameEn": "[Shield of the Weak] Party Shield"
                },
                "followUpLine": "“피난민 마차 앞에 단신으로 서서 약탈 기병들의 진격을 완벽히 차단했다.”",
                "followUpLineEn": "“Standing alone before the refugee wagons halted the raiding horde in its tracks.”"
            },
            {
                "id": "ch27_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "적의 추격로에 돌무더기 트랩을 설치해 발을 묶자.",
                "labelEn": "Rig rockslide traps to block the gorge while leading wagons away.",
                "followUpTextKo": "“협곡 낙석으로 적의 추격로를 봉쇄하여 사상자 없이 안전하게 철수시켰다.”",
                "followUpTextEn": "“Collapsing gorge boulders blocked the pursuers, ensuring safe evacuation.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "적의 추격로에 돌무더기 트랩을 설치해 발을 묶자.",
                "textEn": "Rig rockslide traps to block the gorge while leading wagons away.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“협곡 낙석으로 적의 추격로를 봉쇄하여 사상자 없이 안전하게 철수시켰다.”",
                "followUpLineEn": "“Collapsing gorge boulders blocked the pursuers, ensuring safe evacuation.”"
            },
            {
                "id": "ch27_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "피난민들의 공포를 가라앉히는 온기의 마나를 방출한다.",
                "labelEn": "Radiate calming warmth to soothe the terrified refugees.",
                "followUpTextKo": "“따뜻한 치유 마나가 전장에 퍼지며 지친 피난민들에게 새로운 희망을 심어주었다.”",
                "followUpTextEn": "“Healing mana blanketed the trail, instilling courage in the weary families.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "피난민들의 공포를 가라앉히는 온기의 마나를 방출한다.",
                "textEn": "Radiate calming warmth to soothe the terrified refugees.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“따뜻한 치유 마나가 전장에 퍼지며 지친 피난민들에게 새로운 희망을 심어주었다.”",
                "followUpLineEn": "“Healing mana blanketed the trail, instilling courage in the weary families.”"
            }
        ]
    },
    {
        "speaker": "speaker",
        "name": "길가메시",
        "nameEn": "Gilgamesh",
        "cardId": 47,
        "text": "“...네 말이 맞았다, 카단. 백성을 지키지 못하는 승리는 그저 또 다른 학살일 뿐이지.”",
        "textEn": "“...You were right, Kadan. A victory that leaves people to bleed is just another slaughter.”"
    },
  ],
  28: [
    {
        "speaker": "narrator",
        "name": "제 28화: 녹옥 의회의 반란",
        "nameEn": "Episode 28: Revolt of the Jade Council",
        "text": "녹옥 의회 대회의실. 아르투스 섭정에게 매수된 부패 귀족 관료들이 군사 쿠데타를 일으켜 숲의 연합 조약을 파기하려 했다.",
        "textEn": "The Jade Council Chambers. Corrupt nobles bribed by Regent Artus staged a military coup to tear up the forest treaty."
    },
    {
        "speaker": "speaker",
        "name": "부패 의장",
        "nameEn": "Corrupt Magistrate",
        "cardId": 61,
        "text": "“수인족 야만인들과의 조약 따위는 무효다! 의회를 섭정군 친위대에 넘겨라!”",
        "textEn": "“Treaties with beast savages are void! Hand over the council to the Regent's guard!”"
    },
    {
        "speaker": "speaker",
        "name": "대추장 레오나르",
        "nameEn": "Grand Chief Leonar",
        "cardId": 86,
        "text": "“내 눈에 흙이 들어가기 전까지는 어림없다! 배신자 놈들의 도끼질을 똑똑히 보아라!”",
        "textEn": "“Not while breath remains in my chest! Traitors will taste the fury of our axes!”"
    },
    {
        "speaker": "choice",
        "name": "의회장의 진압",
        "nameEn": "Quelling the Council Coup",
        "cardId": 41,
        "text": "의회장 문을 박차고 반역 근위대가 쏟아져 들어온다. 카단과 레오나르는 법정을 수호하기 위해 나선다.",
        "textEn": "Inquisitor shock-troops stormed the floor. Kadan and Leonar stepped up to defend the assembly.",
        "choices": [
            {
                "id": "ch28_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "부패한 귀족들의 검극 따위에 정의는 꺾이지 않는다!",
                "labelEn": "Justice will never bend before corrupt nobles' blades!",
                "followUpTextKo": "“방패로 반역 사병들의 창벽을 쳐부수며 주동자들을 단숨에 포박했다.”",
                "followUpTextEn": "“Smashing the conspirators' spear wall subdued the ringleaders in moments.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "부패한 귀족들의 검극 따위에 정의는 꺾이지 않는다!",
                "textEn": "Justice will never bend before corrupt nobles' blades!",
                "reward": {
                    "snsCoins": 25,
                    "buff": "atk_boost",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“방패로 반역 사병들의 창벽을 쳐부수며 주동자들을 단숨에 포박했다.”",
                "followUpLineEn": "“Smashing the conspirators' spear wall subdued the ringleaders in moments.”"
            },
            {
                "id": "ch28_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "의회의 법령 인장을 회수해 반란의 정당성을 무력화하자.",
                "labelEn": "Recover the official council seals to strip all legal pretext.",
                "followUpTextKo": "“위조된 칙령 서류를 압수해 군사들에게 반역의 실체를 폭로했다.”",
                "followUpTextEn": "“Exposing the forged decrees caused the misled soldiers to ground their arms.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[권능 박탈] 적 버프 제거",
                "bonusDescEn": "[Disenchant Coup] Purge Enemy Buffs",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "의회의 법령 인장을 회수해 반란의 정당성을 무력화하자.",
                "textEn": "Recover the official council seals to strip all legal pretext.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[권능 박탈] 적 버프 제거",
                    "buffNameEn": "[Disenchant Coup] Purge Enemy Buffs"
                },
                "followUpLine": "“위조된 칙령 서류를 압수해 군사들에게 반역의 실체를 폭로했다.”",
                "followUpLineEn": "“Exposing the forged decrees caused the misled soldiers to ground their arms.”"
            },
            {
                "id": "ch28_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "대지 정령들의 분노를 일깨워 회의실 바닥을 진동시킨다.",
                "labelEn": "Awaken the earth spirits to shake the chamber foundations.",
                "followUpTextKo": "“진동하는 대지의 마나가 반란군들의 발을 묶어 피 한 방울 없이 제압했다.”",
                "followUpTextEn": "“Tremors pinned the conspirators' boots to the stone, quelling them bloodlessly.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "대지 정령들의 분노를 일깨워 회의실 바닥을 진동시킨다.",
                "textEn": "Awaken the earth spirits to shake the chamber foundations.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“진동하는 대지의 마나가 반란군들의 발을 묶어 피 한 방울 없이 제압했다.”",
                "followUpLineEn": "“Tremors pinned the conspirators' boots to the stone, quelling them bloodlessly.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "확고해진 연합",
        "nameEn": "The Solidified Alliance",
        "text": "쿠데타가 진압되자 열한 개 종족 대표들은 카단의 방패 아래 하나로 뭉칠 것을 결의했다.",
        "textEn": "With the coup crushed, representatives of the eleven races pledged allegiance under Kadan's shield."
    },
  ],
  29: [
    {
        "speaker": "narrator",
        "name": "제 29화: 바람의 여왕",
        "nameEn": "Episode 29: Queen of the Wind",
        "text": "최종 결전의 거점, 천공 첨탑 최상층 테라스. 하늘을 다스리는 바람의 여왕 실피드가 거대한 회오리 옥좌에서 영웅들을 맞이했다.",
        "textEn": "The Sky Spire pinnacle terrace overlooking the final battlefield. Queen Sylphid awaited the heroes upon a whirling throne."
    },
    {
        "speaker": "speaker",
        "name": "바람의 여왕 실피드",
        "nameEn": "Queen Sylphid",
        "cardId": 23,
        "text": "“아케인 대륙의 운명이 네 손에 달렸다. 하지만 섭정 아르투스의 심연 결계는 폭풍보다 사납다. 네 방패가 그 결계를 찢을 수 있겠는가?”",
        "textEn": "“The fate of the continent rests in your hands. But Artus's abyssal wards rage fiercer than storms. Can your shield tear them down?”"
    },
    {
        "speaker": "speaker",
        "name": "아쿠아로드",
        "nameEn": "Aqualord",
        "cardId": 5,
        "text": "“여왕이시여, 이 청년의 마나는 정결합니다. 그의 방패는 파괴가 아니라 조화를 담고 있습니다.”",
        "textEn": "“Your Majesty, this youth's mana is pristine. His shield seeks harmony, never wanton ruin.”"
    },
    {
        "speaker": "choice",
        "name": "천공의 가호 시험",
        "nameEn": "Trial of Celestial Blessing",
        "cardId": 41,
        "text": "실피드가 소환한 거대한 천공 폭풍이 첨탑을 흔든다. 카단은 여왕의 축복을 얻기 위해 방패를 들어 올린다.",
        "textEn": "Sylphid unleashed a roaring celestial vortex shaking the spire. Kadan raised his shield to receive the mantle.",
        "choices": [
            {
                "id": "ch29_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "폭풍우 속에서도 눈을 부릅뜨고 여왕의 시험을 받아내겠다!",
                "labelEn": "I will keep eyes wide open amidst the squall and embrace the trial!",
                "followUpTextKo": "“선풍의 중심을 맨몸으로 버텨내며 창공의 깃털 문장을 획득했다.”",
                "followUpTextEn": "“Enduring the gale head-on earned the Queen's celestial crest upon his shield.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[천공의 가호] 비행/공중 방어",
                "bonusDescEn": "[Sky Sovereign] Aerial Ward",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "폭풍우 속에서도 눈을 부릅뜨고 여왕의 시험을 받아내겠다!",
                "textEn": "I will keep eyes wide open amidst the squall and embrace the trial!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[천공의 가호] 비행/공중 방어",
                    "buffNameEn": "[Sky Sovereign] Aerial Ward"
                },
                "followUpLine": "“선풍의 중심을 맨몸으로 버텨내며 창공의 깃털 문장을 획득했다.”",
                "followUpLineEn": "“Enduring the gale head-on earned the Queen's celestial crest upon his shield.”"
            },
            {
                "id": "ch29_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "하늘새들의 날개짓을 관찰해 돌풍의 눈으로 진입하자.",
                "labelEn": "Observe the sky birds' flight paths to enter the eye of the gale.",
                "followUpTextKo": "“바람의 회전축을 역이용해 부드럽게 여왕의 옥좌 앞에 당도했다.”",
                "followUpTextEn": "“Riding the eddy current gently brought Kadan before the Queen's throne unharmed.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "하늘새들의 날개짓을 관찰해 돌풍의 눈으로 진입하자.",
                "textEn": "Observe the sky birds' flight paths to enter the eye of the gale.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“바람의 회전축을 역이용해 부드럽게 여왕의 옥좌 앞에 당도했다.”",
                "followUpLineEn": "“Riding the eddy current gently brought Kadan before the Queen's throne unharmed.”"
            },
            {
                "id": "ch29_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "바람의 여왕과 영혼의 화음을 맞추어 깃털을 받는다.",
                "labelEn": "Harmonize soul frequencies with the Queen to receive her feather.",
                "followUpTextKo": "“여왕의 바람 마나와 성진호흡이 융합하며 순백의 날개 형상이 방패에 깃들었다.”",
                "followUpTextEn": "“Merging breathing with her wind mana bestowed wings of white radiance upon the shield.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "바람의 여왕과 영혼의 화음을 맞추어 깃털을 받는다.",
                "textEn": "Harmonize soul frequencies with the Queen to receive her feather.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“여왕의 바람 마나와 성진호흡이 융합하며 순백의 날개 형상이 방패에 깃들었다.”",
                "followUpLineEn": "“Merging breathing with her wind mana bestowed wings of white radiance upon the shield.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "바람의 증표",
        "nameEn": "Crest of the Wind",
        "text": "여왕의 깃털이 방패에 깃들자, 대륙의 모든 바람이 일행의 진격을 호위하기 시작했다.",
        "textEn": "As the feather merged with the shield, every breeze in the realm arose to escort their march."
    },
  ],
  30: [
    {
        "speaker": "narrator",
        "name": "제 30화: 네 관문의 독",
        "nameEn": "Episode 30: Poison at the Four Gates",
        "text": "라이트헤븐 도성 외곽 동서남북 4대 관문. 섭정 아르투스가 최후의 발악으로 도성 상수도 수로에 맹독을 살포해 수십만 민중을 위협하고 있었다.",
        "textEn": "The four cardinal gates of Lighthaven. In desperate malice, Regent Artus poured lethal poison into city reservoirs, threatening hundreds of thousands."
    },
    {
        "speaker": "speaker",
        "name": "말푸온",
        "nameEn": "Malfuon",
        "cardId": 66,
        "text": "“독기가 정수장 수맥 깊숙이 스며들고 있다! 네 개 수문을 동시에 정화하지 않으면 오늘 밤 도성 전체가 절멸한다!”",
        "textEn": "“Venom seeps deep into the subterranean aquifers! If four sluices aren't purified at once, the city dies tonight!”"
    },
    {
        "speaker": "speaker",
        "name": "아쿠아로드",
        "nameEn": "Aqualord",
        "cardId": 5,
        "text": "“내가 남쪽과 서쪽 수로를 막겠다! 카단, 너는 가장 오염이 심한 북문 중앙 수맥을 맡아다오!”",
        "textEn": "“I will stem the southern and western aqueducts! Kadan, take the northern central reservoir!”"
    },
    {
        "speaker": "choice",
        "name": "독기 수문의 정화",
        "nameEn": "Cleansing the Poison Sluice",
        "cardId": 41,
        "text": "보라색 독안개가 뿜어져 나오는 북문 수문. 적의 독침 저격수들이 수문을 둘러싼 채 조준하고 있다.",
        "textEn": "Purple toxic fumes billowed from the northern sluice as enemy snipers zeroed in.",
        "choices": [
            {
                "id": "ch30_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "독구름을 뚫고 수문을 향해 몸을 던진다!",
                "labelEn": "Dive through the toxic cloud directly toward the sluice lever!",
                "followUpTextKo": "“방패로 독화살을 쳐내며 뛰어들어 닫혀 있던 정수 수문을 열어젖혔다.”",
                "followUpTextEn": "“Deflecting poison bolts, Kadan hauled open the emergency purification valve.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "독구름을 뚫고 수문을 향해 몸을 던진다!",
                "textEn": "Dive through the toxic cloud directly toward the sluice lever!",
                "reward": {
                    "snsCoins": 25,
                    "buff": "atk_boost",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“방패로 독화살을 쳐내며 뛰어들어 닫혀 있던 정수 수문을 열어젖혔다.”",
                "followUpLineEn": "“Deflecting poison bolts, Kadan hauled open the emergency purification valve.”"
            },
            {
                "id": "ch30_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "정화 약초를 수로의 수원지에 집중 투하하자.",
                "labelEn": "Distribute concentrated antidote herbs at the primary waterhead.",
                "followUpTextKo": "“수원지의 물길을 정확히 계산해 최소한의 약재로 도성 식수를 모두 구했다.”",
                "followUpTextEn": "“Calculating the exact flow vectors cleansed the city reservoirs with minimal herbs.”",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "[정화의 샘] 지속 독 저항",
                "bonusDescEn": "[Purifying Font] Continuous Poison RES",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "정화 약초를 수로의 수원지에 집중 투하하자.",
                "textEn": "Distribute concentrated antidote herbs at the primary waterhead.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[정화의 샘] 지속 독 저항",
                    "buffNameEn": "[Purifying Font] Continuous Poison RES"
                },
                "followUpLine": "“수원지의 물길을 정확히 계산해 최소한의 약재로 도성 식수를 모두 구했다.”",
                "followUpLineEn": "“Calculating the exact flow vectors cleansed the city reservoirs with minimal herbs.”"
            },
            {
                "id": "ch30_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "대지의 수맥을 호흡으로 감싸 독기를 중화시킨다.",
                "labelEn": "Envelop the subterranean leylines with Star Breathing to neutralize poison.",
                "followUpTextKo": "“푸른 마나가 상수도 수맥을 타고 번져나가며 모든 독안개를 맑은 물로 바꿨다.”",
                "followUpTextEn": "“Pure mana raced through aqueducts, turning caustic poison into crystal spring water.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "대지의 수맥을 호흡으로 감싸 독기를 중화시킨다.",
                "textEn": "Envelop the subterranean leylines with Star Breathing to neutralize poison.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“푸른 마나가 상수도 수맥을 타고 번져나가며 모든 독안개를 맑은 물로 바꿨다.”",
                "followUpLineEn": "“Pure mana raced through aqueducts, turning caustic poison into crystal spring water.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "도성의 물길",
        "nameEn": "Waters of the Capital",
        "text": "수로에 맑은 샘물이 다시 흐르자, 도성 민중들은 환호하며 성문을 열어젖혔다.",
        "textEn": "As fresh spring water surged through city fountains, citizens cheered and swung open the gates."
    },
  ],
  31: [
    {
        "speaker": "narrator",
        "name": "제 31화: 모든 것을 건 손",
        "nameEn": "Episode 31: The Hand That Wagered Everything",
        "text": "침몰한 작전 지휘소 원탁. 섭정 아르투스의 흑강 드레드노트 함대가 만을 봉쇄한 가운데, 연합군은 남은 모든 전력과 신성한 성물을 걸고 최후의 도박을 준비했다.",
        "textEn": "The sunken war room strategy table. With Regent Artus's dreadnought fleet blockading the bay, the allied forces prepared a desperate gambit, wagering every reserve and relic."
    },
    {
        "speaker": "speaker",
        "name": "타짜 길버트",
        "nameEn": "Gilbert the Gambler",
        "cardId": 1,
        "text": "“이번 패는 내 목숨까지 얹은 올인이다. 얕은 암초 지대로 적의 기함을 유인할 테니, 카단 그대가 물길을 열어주시오!”",
        "textEn": "“This hand is an all-in with my life on the table. We will bait their flagship into shallow reefs if you can carve a path, Kadan!”"
    },
    {
        "speaker": "speaker",
        "name": "황자 이그니스",
        "nameEn": "Prince Ignis",
        "cardId": 11,
        "text": "“내 백색 화염과 아케인 함포의 화력을 일제히 집중하겠다! 단 한 번의 기회뿐이다!”",
        "textEn": "“My white flame and arcane batteries will unleash full firepower at your signal! We only get one shot!”"
    },
    {
        "speaker": "choice",
        "name": "모든 것을 건 승부",
        "nameEn": "The All-In Wager",
        "cardId": 41,
        "text": "적의 흑요석 기함이 포문을 열며 포위망을 좁혀온다. 카단은 선수에 서서 방패를 들어 올리며 결단을 내린다.",
        "textEn": "The obsidian flagship rolled out broadsides as the cordon tightened. Standing at the prow, Kadan raised his shield.",
        "choices": [
            {
                "id": "ch31_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "우리가 미끼가 되겠다. 적의 총공세를 정면으로 유인하자!",
                "labelEn": "We will be the decoy. Draw their full vanguard straight onto us!",
                "followUpTextKo": "“선수 갑판에서 방패를 치켜들자 적의 모든 포문이 카단을 향해 쏟아졌다.”",
                "followUpTextEn": "“Raising the shield at the prow turned every enemy cannon upon Kadan alone.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[불패의 미끼] 어그로 집중 및 방어력 +25%",
                "bonusDescEn": "[Invincible Decoy] Aggro Focus & +25% DEF",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "우리가 미끼가 되겠다. 적의 총공세를 정면으로 유인하자!",
                "textEn": "We will be the decoy. Draw their full vanguard straight onto us!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[불패의 미끼] 어그로 집중 및 방어력 +25%",
                    "buffNameEn": "[Invincible Decoy] Aggro Focus & +25% DEF"
                },
                "followUpLine": "“선수 갑판에서 방패를 치켜들자 적의 모든 포문이 카단을 향해 쏟아졌다.”",
                "followUpLineEn": "“Raising the shield at the prow turned every enemy cannon upon Kadan alone.”"
            },
            {
                "id": "ch31_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "조수 간만의 차를 이용해 적 기함을 갯벌에 좌초시킨다.",
                "labelEn": "Utilize the tidal ebb to beach their dreadnoughts on sandbars.",
                "followUpTextKo": "“수심 측정을 정확히 계산해 적의 거함을 암초 지대에 완벽히 고립시켰다.”",
                "followUpTextEn": "“Precise depth calculation grounded the enemy behemoth hopelessly on jagged reefs.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "조수 간만의 차를 이용해 적 기함을 갯벌에 좌초시킨다.",
                "textEn": "Utilize the tidal ebb to beach their dreadnoughts on sandbars.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“수심 측정을 정확히 계산해 적의 거함을 암초 지대에 완벽히 고립시켰다.”",
                "followUpLineEn": "“Precise depth calculation grounded the enemy behemoth hopelessly on jagged reefs.”"
            },
            {
                "id": "ch31_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "물의 요정들과 결속하여 바다 안개를 일으킨다.",
                "labelEn": "Commune with water spirits to conjure an impenetrable sea fog.",
                "followUpTextKo": "“푸른 마나가 수면을 덮으며 짙은 해무가 적의 시야를 완전히 가렸다.”",
                "followUpTextEn": "“Azure mana rolled over the swells, veiling the entire armada in blinding mist.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "물의 요정들과 결속하여 바다 안개를 일으킨다.",
                "textEn": "Commune with water spirits to conjure an impenetrable sea fog.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“푸른 마나가 수면을 덮으며 짙은 해무가 적의 시야를 완전히 가렸다.”",
                "followUpLineEn": "“Azure mana rolled over the swells, veiling the entire armada in blinding mist.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "작전의 서막",
        "nameEn": "Prelude to Battle",
        "text": "칠흑의 바다 위에 아케인 섬광이 번쩍이며 결전의 닻이 올라갔다.",
        "textEn": "Arcane lightning flashed across the dark abyss as anchors weighed for the final battle."
    },
  ],
  32: [
    {
        "speaker": "narrator",
        "name": "제 32화: 첫사랑의 잔향",
        "nameEn": "Episode 32: Echo of First Love",
        "text": "황궁 외곽 달빛 정원 테라스. 최후의 결전을 앞둔 고요한 밤, 은빛 나뭇잎 사이로 차가운 밤바람이 스쳐 지나갔다.",
        "textEn": "The moonlit garden terrace outside the citadel. On the quiet eve of the final assault, a chill night breeze rustled silver leaves."
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“내일 결전이 시작되면... 우리 중 누군가는 돌아오지 못할지도 몰라. 이 은빛 들꽃 매듭을 네 방패 끈에 묶어둘게.”",
        "textEn": "“When dawn battle breaks... some of us may never return. Let me bind this wild silver blossom to your shield strap.”"
    },
    {
        "speaker": "speaker",
        "name": "카단",
        "nameEn": "Kadan",
        "cardId": 41,
        "text": "“실리아, 눈보라 치던 날부터 지금까지 내 방패가 향한 곳은 언제나 너와 동료들이었다.”",
        "textEn": "“Celia, from that blizzard night to now, my shield has always aimed to protect you and our kin.”"
    },
    {
        "speaker": "choice",
        "name": "달빛 아래의 서약",
        "nameEn": "Vow Beneath the Moonlight",
        "cardId": 62,
        "text": "들꽃의 은은한 향기가 밤공기에 맴돈다. 카단은 실리아의 손을 감싸며 마지막 밤의 맹세를 나눈다.",
        "textEn": "The fragrance of wildflowers lingered in the night air. Gripping Celia's hand, Kadan shared their final pledge.",
        "choices": [
            {
                "id": "ch32_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "내일 전투가 끝나면 반드시 함께 살아서 고향으로 돌아가자.",
                "labelEn": "When tomorrow's battle ends, we will return home alive together.",
                "followUpTextKo": "“단단한 약속을 가슴에 품자 두려움이 눈 녹듯 사라지고 굳센 투기가 차올랐다.”",
                "followUpTextEn": "“A resolute promise in heart melted all fear, filling Kadan with steadfast valor.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "내일 전투가 끝나면 반드시 함께 살아서 고향으로 돌아가자.",
                "textEn": "When tomorrow's battle ends, we will return home alive together.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "atk_boost",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“단단한 약속을 가슴에 품자 두려움이 눈 녹듯 사라지고 굳센 투기가 차올랐다.”",
                "followUpLineEn": "“A resolute promise in heart melted all fear, filling Kadan with steadfast valor.”"
            },
            {
                "id": "ch32_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "너를 지키는 방패가 되겠다는 약속은 결코 잊지 않아.",
                "labelEn": "The vow to be the shield protecting you will never waver.",
                "followUpTextKo": "“방패 손잡이에 묶인 들꽃이 은은한 아케인 보호막을 두르며 빛났다.”",
                "followUpTextEn": "“The wild flower bound to the handle shimmered with an arcane protective aura.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[들꽃의 맹세] 방어막 +25%",
                "bonusDescEn": "[Vow of Wildflower] +25% Shield Barrier",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "너를 지키는 방패가 되겠다는 약속은 결코 잊지 않아.",
                "textEn": "The vow to be the shield protecting you will never waver.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[들꽃의 맹세] 방어막 +25%",
                    "buffNameEn": "[Vow of Wildflower] +25% Shield Barrier"
                },
                "followUpLine": "“방패 손잡이에 묶인 들꽃이 은은한 아케인 보호막을 두르며 빛났다.”",
                "followUpLineEn": "“The wild flower bound to the handle shimmered with an arcane protective aura.”"
            },
            {
                "id": "ch32_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "은은한 바람결 속에 서로의 심장 박동을 포갠다.",
                "labelEn": "Harmonize heartbeats gently within the whispering night breeze.",
                "followUpTextKo": "“두 사람의 영혼이 별 호흡으로 이어지며 따스한 온기가 새벽공기를 밝혔다.”",
                "followUpTextEn": "“Connecting through Star Breathing warmed the dawn with silent serenity.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "은은한 바람결 속에 서로의 심장 박동을 포갠다.",
                "textEn": "Harmonize heartbeats gently within the whispering night breeze.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "mana_surge",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“두 사람의 영혼이 별 호흡으로 이어지며 따스한 온기가 새벽공기를 밝혔다.”",
                "followUpLineEn": "“Connecting through Star Breathing warmed the dawn with silent serenity.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "달빛 아래의 약속",
        "nameEn": "Promise Beneath the Moon",
        "text": "새벽 바람에 들꽃 향기가 번지며, 두 사람의 맹세는 별빛 속에 영원히 아로새겨졌다.",
        "textEn": "Wildflower fragrance rode the dawn gale, etching their oath into eternity."
    },
  ],
  33: [
    {
        "speaker": "narrator",
        "name": "제 33화: 검은 늪의 원한",
        "nameEn": "Episode 33: Grudge of the Black Marsh",
        "text": "도성 외곽 검은 늪 네크로폴리스. 썩은 안개가 자욱한 진흙 속에서 과거 섭정 아르투스에게 학살당한 수만 전몰자의 원혼이 사령술에 묶여 울부짖었다.",
        "textEn": "Black Marsh necropolis outside the Citadel. Amidst necrotic mud and mist, tens of thousands of slain martyrs shrieked, bound by Artus's foul necromancy."
    },
    {
        "speaker": "speaker",
        "name": "데스나이트 아르투스",
        "nameEn": "Death Knight Artus",
        "cardId": 60,
        "text": "“어리석은 성기사의 아들아! 이 늪에 묻힌 수만 전몰자의 원혼이 네 살점을 뜯어먹을 것이다!”",
        "textEn": "“Foolish paladin's whelp! The wailing specters of tens of thousands will tear your flesh!”"
    },
    {
        "speaker": "speaker",
        "name": "카단",
        "nameEn": "Kadan",
        "cardId": 41,
        "text": "“아르투스! 네가 학살한 원혼들의 고통을 더 이상 네 사령술의 노예로 부리지 못한다!”",
        "textEn": "“Artus! You will no longer enslave the tormented martyrs you butchered!”"
    },
    {
        "speaker": "choice",
        "name": "원혼의 늪 정화",
        "nameEn": "Cleansing the Marsh of Souls",
        "cardId": 41,
        "text": "사령 마법진이 검은 물결을 일으키며 뼈마디 망령들이 솟구쳐 오른다. 카단은 방패의 룬을 밝히며 성광을 모은다.",
        "textEn": "Necromantic rings churned black mire as skeletal specters clawed upward. Kadan gathered holy light upon his buckler.",
        "choices": [
            {
                "id": "ch33_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "원혼들아, 성기사의 빛 아래서 편히 잠들라!",
                "labelEn": "Tormented souls, rest in peace beneath the sacred paladin light!",
                "followUpTextKo": "“방패에서 뿜어져 나온 순백의 성광이 늪 전체의 사령 마법진을 단숨에 정화했다.”",
                "followUpTextEn": "“Pure holy light radiating from the shield instantly vaporized the necrotic circles.”",
                "bonusType": "buff",
                "bonusValue": 30,
                "bonusDescKo": "[파사의 빛] 언데드 데미지 +30%",
                "bonusDescEn": "[Bane of Darkness] +30% vs Undead",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "원혼들아, 성기사의 빛 아래서 편히 잠들라!",
                "textEn": "Tormented souls, rest in peace beneath the sacred paladin light!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[파사의 빛] 언데드 데미지 +30%",
                    "buffNameEn": "[Bane of Darkness] +30% vs Undead"
                },
                "followUpLine": "“방패에서 뿜어져 나온 순백의 성광이 늪 전체의 사령 마법진을 단숨에 정화했다.”",
                "followUpLineEn": "“Pure holy light radiating from the shield instantly vaporized the necrotic circles.”"
            },
            {
                "id": "ch33_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "늪지대 바닥의 침강 함정을 피해 단단한 암반으로 유도하자.",
                "labelEn": "Maneuver away from sinking bogs onto solid subterranean bedrock.",
                "followUpTextKo": "“발판을 선점하여 적의 강습 기병들을 수렁 속으로 밀어 넣었다.”",
                "followUpTextEn": "“Seizing high rock drove enemy shock lancers floundering into the mire.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "늪지대 바닥의 침강 함정을 피해 단단한 암반으로 유도하자.",
                "textEn": "Maneuver away from sinking bogs onto solid subterranean bedrock.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“발판을 선점하여 적의 강습 기병들을 수렁 속으로 밀어 넣었다.”",
                "followUpLineEn": "“Seizing high rock drove enemy shock lancers floundering into the mire.”"
            },
            {
                "id": "ch33_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "어둠의 사슬을 자비의 호흡으로 끊어낸다.",
                "labelEn": "Sever the chains of darkness with compassionate Star Breathing.",
                "followUpTextKo": "“원혼들의 흐느낌을 보듬으며 흑마법 주술의 매듭을 부드럽게 해체했다.”",
                "followUpTextEn": "“Embracing the weeping phantoms gently unraveled the curses binding them.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "어둠의 사슬을 자비의 호흡으로 끊어낸다.",
                "textEn": "Sever the chains of darkness with compassionate Star Breathing.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“원혼들의 흐느낌을 보듬으며 흑마법 주술의 매듭을 부드럽게 해체했다.”",
                "followUpLineEn": "“Embracing the weeping phantoms gently unraveled the curses binding them.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "늪지의 정화",
        "nameEn": "Cleansing the Mire",
        "text": "검은 안개가 걷히고 성불한 영혼들이 은빛 나비가 되어 하늘로 날아올랐다.",
        "textEn": "Dark mists lifted as redeemed souls transformed into silver butterflies, ascending into the dawn sky."
    },
  ],
  34: [
    {
        "speaker": "narrator",
        "name": "제 34화: 무너진 바람섬",
        "nameEn": "Episode 34: The Fallen Wind Isle",
        "text": "붕괴하는 공중 요새 부유석 잔해. 심연 함포의 포격으로 반중력 코어가 파괴되어 섬 전체가 하계 대지 위로 곤두박질치고 있었다.",
        "textEn": "Collapsing aerial citadel fragments. Abyssal bombardments shattered the anti-gravity core, sending the floating isle hurtling into the abyss below."
    },
    {
        "speaker": "speaker",
        "name": "바람의 정령사",
        "nameEn": "Wind Elementalist",
        "cardId": 25,
        "text": "“공중 요새의 반중력 코어가 파괴되었다! 섬 전체가 하계로 추락하고 있어!”",
        "textEn": "“The floating citadel's levitation core has ruptured! The entire isle is plunging!”"
    },
    {
        "speaker": "speaker",
        "name": "그림리",
        "nameEn": "Grimli",
        "cardId": 74,
        "text": "“내 대포로 낙석들을 요격하겠다! 카단, 잔해 충돌을 막아다오!”",
        "textEn": "“I will blast falling rocks with cannonfire! Kadan, catch the shockwaves!”"
    },
    {
        "speaker": "choice",
        "name": "추락 속의 탈출로",
        "nameEn": "Skyway Through the Fall",
        "cardId": 41,
        "text": "거대한 부유석 파편들이 피난선들의 항로를 가로막으며 쏟아져 내린다. 카단은 공중으로 도약해 방패를 전개한다.",
        "textEn": "Meteoric island slabs plummeted straight across the refugee convoy. Leaping into the void, Kadan braced his buckler.",
        "choices": [
            {
                "id": "ch34_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "추락하는 파편을 방패로 쳐내어 피난선을 보호한다!",
                "labelEn": "Smash through tumbling meteoric rubble with the shield to shield the evacuees!",
                "followUpTextKo": "“거대한 부유석 파편을 공중에서 두 동강 내며 피난선의 활로를 열었다.”",
                "followUpTextEn": "“Cleaving falling monoliths mid-air cleared safe skyway for the refugee airships.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[하늘의 방패] 충돌 저항 +25%",
                "bonusDescEn": "[Aegis of the Sky] +25% Impact RES",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "추락하는 파편을 방패로 쳐내어 피난선을 보호한다!",
                "textEn": "Smash through tumbling meteoric rubble with the shield to shield the evacuees!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[하늘의 방패] 충돌 저항 +25%",
                    "buffNameEn": "[Aegis of the Sky] +25% Impact RES"
                },
                "followUpLine": "“거대한 부유석 파편을 공중에서 두 동강 내며 피난선의 활로를 열었다.”",
                "followUpLineEn": "“Cleaving falling monoliths mid-air cleared safe skyway for the refugee airships.”"
            },
            {
                "id": "ch34_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "부유석의 남은 마나를 활성화해 탈출 궤적을 확보하자.",
                "labelEn": "Trigger residual levitation mana in the falling runes to stabilize air currents.",
                "followUpTextKo": "“낙하하는 암석의 중심점을 찔러 완충 지대를 형성시켰다.”",
                "followUpTextEn": "“Striking kinetic centers formed a stable gliding updraft for the fleet.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "부유석의 남은 마나를 활성화해 탈출 궤적을 확보하자.",
                "textEn": "Trigger residual levitation mana in the falling runes to stabilize air currents.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“낙하하는 암석의 중심점을 찔러 완충 지대를 형성시켰다.”",
                "followUpLineEn": "“Striking kinetic centers formed a stable gliding updraft for the fleet.”"
            },
            {
                "id": "ch34_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "추락하는 바람의 흐름을 날개처럼 펼쳐 안착시킨다.",
                "labelEn": "Spread the falling updrafts like wings through Astral Breathing.",
                "followUpTextKo": "“폭풍의 하강 기류를 거대한 상승 날개로 치환해 모두를 안전하게 연착륙시켰다.”",
                "followUpTextEn": "“Inverting the violent downdraft safely drifted the airships onto terra firma.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "추락하는 바람의 흐름을 날개처럼 펼쳐 안착시킨다.",
                "textEn": "Spread the falling updrafts like wings through Astral Breathing.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“폭풍의 하강 기류를 거대한 상승 날개로 치환해 모두를 안전하게 연착륙시켰다.”",
                "followUpLineEn": "“Inverting the violent downdraft safely drifted the airships onto terra firma.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "부서진 섬의 안착",
        "nameEn": "Landing of the Fallen Isle",
        "text": "마지막 피난선이 지상에 안전하게 내리쬐는 햇살 속에 착륙했다.",
        "textEn": "The final refugee skyship touched down gently under rays of morning sunlight."
    },
  ],
  35: [
    {
        "speaker": "narrator",
        "name": "제 35화: 안개 속의 오인",
        "nameEn": "Episode 35: Mistaken in the Fog",
        "text": "신기루 협곡 환영 미궁. 보랏빛 환각 안개가 아군과 적군의 모습을 뒤바꾸어 서로에게 칼을 겨누게 만드는 혼란이 벌어졌다.",
        "textEn": "The Valley of Mirages misty labyrinth. Purple illusory fog inverted appearances of friend and foe, inciting brothers-in-arms to cross swords."
    },
    {
        "speaker": "speaker",
        "name": "헤르쿨",
        "nameEn": "Hercul",
        "cardId": 49,
        "text": "“카단! 앞을 보아라! 네 모습과 똑같은 흑화 환영들이 칼을 겨누고 있다!”",
        "textEn": "“Kadan! Look ahead! Shadow doppelgangers bearing your exact visage are brandishing blades!”"
    },
    {
        "speaker": "speaker",
        "name": "루시안",
        "nameEn": "Lucian",
        "cardId": 61,
        "text": "“크하하! 서로가 서로를 베어 넘겨라! 이 안개 속에서는 아군과 적군의 구분이 없다!”",
        "textEn": "“Bwahaha! Slaughter your own kin! In this mist, ally and foe bleed the same!”"
    },
    {
        "speaker": "choice",
        "name": "환영을 깨뜨리는 심안",
        "nameEn": "Mind's Eye Piercing Illusion",
        "cardId": 41,
        "text": "사방에서 동료들의 비명과 환영들의 기습이 이어진다. 카단은 눈을 감고 내면의 호흡에 집중한다.",
        "textEn": "Screams of comrades echoed amidst phantom ambushes. Closing his eyes, Kadan focused inward upon pure breathing.",
        "choices": [
            {
                "id": "ch35_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "눈을 감아라! 귀와 심장으로 진짜 동료를 느낀다!",
                "labelEn": "Close your eyes! Sense your true companions through ears and heartbeat!",
                "followUpTextKo": "“시각을 차단하고 방패의 아케인 파동만으로 가짜 환영들을 모조리 분쇄했다.”",
                "followUpTextEn": "“Shutting out false sight, sonic shield pulses shattered the phantom doppelgangers.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[심안의 방패] 환각 면역 및 치명타율 상승",
                "bonusDescEn": "[Mind's Eye Shield] Illusion Immunity & Crit Up",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "눈을 감아라! 귀와 심장으로 진짜 동료를 느낀다!",
                "textEn": "Close your eyes! Sense your true companions through ears and heartbeat!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[심안의 방패] 환각 면역 및 치명타율 상승",
                    "buffNameEn": "[Mind's Eye Shield] Illusion Immunity & Crit Up"
                },
                "followUpLine": "“시각을 차단하고 방패의 아케인 파동만으로 가짜 환영들을 모조리 분쇄했다.”",
                "followUpLineEn": "“Shutting out false sight, sonic shield pulses shattered the phantom doppelgangers.”"
            },
            {
                "id": "ch35_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "허상의 그림자는 발소리를 내지 못한다. 바닥을 확인해라.",
                "labelEn": "Phantoms cast no footsteps in the sand. Track the ground vibrations.",
                "followUpTextKo": "“진짜 적의 발자국 진동만을 감지해 루시안의 분신들을 각개격파했다.”",
                "followUpTextEn": "“Pinpointing genuine footfalls routed Lucian's decoys in minutes.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "허상의 그림자는 발소리를 내지 못한다. 바닥을 확인해라.",
                "textEn": "Phantoms cast no footsteps in the sand. Track the ground vibrations.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“진짜 적의 발자국 진동만을 감지해 루시안의 분신들을 각개격파했다.”",
                "followUpLineEn": "“Pinpointing genuine footfalls routed Lucian's decoys in minutes.”"
            },
            {
                "id": "ch35_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "별 호흡의 파동을 방출해 환영 마법을 한 번에 깨뜨린다.",
                "labelEn": "Unleash Astral Wave pulses to shatter the illusion matrix at once.",
                "followUpTextKo": "“맑고 투명한 마나 파동이 협곡 전체의 보랏빛 신기루를 단숨에 흩날렸다.”",
                "followUpTextEn": "“A pristine astral resonance dispersed every purple mirage lingering in the canyon.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "별 호흡의 파동을 방출해 환영 마법을 한 번에 깨뜨린다.",
                "textEn": "Unleash Astral Wave pulses to shatter the illusion matrix at once.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“맑고 투명한 마나 파동이 협곡 전체의 보랏빛 신기루를 단숨에 흩날렸다.”",
                "followUpLineEn": "“A pristine astral resonance dispersed every purple mirage lingering in the canyon.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "안개의 소멸",
        "nameEn": "Dispersal of the Mist",
        "text": "진실된 마음으로 눈을 뜬 일행 앞에 숨어 있던 루시안의 본진이 적나라하게 드러났다.",
        "textEn": "Opening eyes with sincere hearts exposed Lucian's hidden redoubt in plain sight."
    },
  ],
  36: [
    {
        "speaker": "narrator",
        "name": "제 36화: 십자 성흔의 지도",
        "nameEn": "Episode 36: Map of the Cross-Shaped Scar",
        "text": "도성 내성 사령부 붉은 암벽. 결전 직전, 고대 용인족의 유적에서 발굴된 십자 성흔 지도가 펼쳐지며 아르투스의 무적 결계에 숨겨진 치명적 결함이 밝혀졌다.",
        "textEn": "The inner citadel redoubt. Before the final clash, unrolling the ancient Dragonkin's cross-scar map revealed the sole structural flaw in Artus's barrier."
    },
    {
        "speaker": "speaker",
        "name": "길가메시",
        "nameEn": "Gilgamesh",
        "cardId": 47,
        "text": "“보아라, 십자 성흔 지도다. 아르투스의 흑요석 철벽에도 동남쪽 배수로에 결계 교차 균열이 존재한다!”",
        "textEn": "“Behold the cross-shaped scar map. In Artus's obsidian fortress, only one seam exists: the southeastern sluice!”"
    },
    {
        "speaker": "speaker",
        "name": "대족장 펜리르",
        "nameEn": "Chieftain Fenrir",
        "cardId": 81,
        "text": "“우리 야수 전사들이 전면 성벽을 쳐서 적의 수비대를 유인하겠다!”",
        "textEn": "“My beast vanguard will storm the main gate to bait their defense reserves!”"
    },
    {
        "speaker": "choice",
        "name": "십자 결계의 돌파",
        "nameEn": "Breaching the Cross-Barrier",
        "cardId": 41,
        "text": "성벽 위에서 흑마법 방어포가 불을 뿜는다. 카단은 성흔의 교차점을 정조준하며 돌격을 지휘한다.",
        "textEn": "Dark arcane cannons flared along parapets. Aiming straight at the cross-scar nexus, Kadan commanded the breach.",
        "choices": [
            {
                "id": "ch36_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "약점이 드러났다! 내가 가장 선봉에서 관문을 뚫겠다!",
                "labelEn": "The rift is bared! I will lead the spearhead to breach the portal!",
                "followUpTextKo": "“십자 성흔의 교차점을 방패 모서리로 강타하여 흑요석 결계를 산산조각 냈다.”",
                "followUpTextEn": "“Striking the cross-scar nexus shattered the obsidian barrier into shards.”",
                "bonusType": "buff",
                "bonusValue": 30,
                "bonusDescKo": "[성흔의 돌파] 관통 데미지 +30%",
                "bonusDescEn": "[Cross-Scar Breach] +30% Penetration",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "약점이 드러났다! 내가 가장 선봉에서 관문을 뚫겠다!",
                "textEn": "The rift is bared! I will lead the spearhead to breach the portal!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[성흔의 돌파] 관통 데미지 +30%",
                    "buffNameEn": "[Cross-Scar Breach] +30% Penetration"
                },
                "followUpLine": "“십자 성흔의 교차점을 방패 모서리로 강타하여 흑요석 결계를 산산조각 냈다.”",
                "followUpLineEn": "“Striking the cross-scar nexus shattered the obsidian barrier into shards.”"
            },
            {
                "id": "ch36_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "동서남북 4개 타격대를 동시에 진입시켜 방어선을 분산하자.",
                "labelEn": "Deploy 4 strike teams simultaneously across cardinal gates to disperse their line.",
                "followUpTextKo": "“완벽한 협동 침투로 적의 기계 경비대 지휘 체계를 마비시켰다.”",
                "followUpTextEn": "“Synchronized infiltration paralyzed the citadel's mechanical command grid.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "동서남북 4개 타격대를 동시에 진입시켜 방어선을 분산하자.",
                "textEn": "Deploy 4 strike teams simultaneously across cardinal gates to disperse their line.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“완벽한 협동 침투로 적의 기계 경비대 지휘 체계를 마비시켰다.”",
                "followUpLineEn": "“Synchronized infiltration paralyzed the citadel's mechanical command grid.”"
            },
            {
                "id": "ch36_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "용의 성흔과 내 마나를 공명시켜 결계를 붕괴시킨다.",
                "labelEn": "Resonate Astral Mana with the ancient dragon scar to dissolve the barrier.",
                "followUpTextKo": "“고대 용족의 공명 주파수로 결계의 룬 마법진이 자연스럽게 해체되었다.”",
                "followUpTextEn": "“Ancient draconic frequencies serenely unraveled the runes without triggering alarms.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "용의 성흔과 내 마나를 공명시켜 결계를 붕괴시킨다.",
                "textEn": "Resonate Astral Mana with the ancient dragon scar to dissolve the barrier.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“고대 용족의 공명 주파수로 결계의 룬 마법진이 자연스럽게 해체되었다.”",
                "followUpLineEn": "“Ancient draconic frequencies serenely unraveled the runes without triggering alarms.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "성문이 열리다",
        "nameEn": "The Citadel Gates Open",
        "text": "십자 결계가 무너지며, 대륙 연합군의 깃발이 황궁 내성을 향해 물결쳤다.",
        "textEn": "As the cross-seal collapsed, allied standards surged into the inner citadel."
    },
  ],
  37: [
    {
        "speaker": "narrator",
        "name": "제 37화: 정복왕의 전쟁",
        "nameEn": "Episode 37: War of the Conqueror King",
        "text": "황궁 앞 광활한 평원 결전장. 대륙 전역에서 모여든 자유민 연합군과 섭정의 흑강 철갑 군단이 격돌하는 역사상 최대의 회전이 벌어졌다.",
        "textEn": "The grand plains before the Imperial Citadel. Allied freemen from across the realm collided with the Regent's black iron legions in a historic pitched battle."
    },
    {
        "speaker": "speaker",
        "name": "정복왕 길가메시",
        "nameEn": "Conqueror King Gilgamesh",
        "cardId": 47,
        "text": "“대륙의 모든 자유민들이여! 오늘 우리는 노예가 아닌 주인으로서 싸운다! 전군, 돌격!”",
        "textEn": "“Freemen of the realm! Today we fight as sovereigns, not thralls! All units, charge!”"
    },
    {
        "speaker": "speaker",
        "name": "황자 이그니스",
        "nameEn": "Prince Ignis",
        "cardId": 11,
        "text": "“백색 화염포 발사! 아르투스의 기갑 철갑군 전열을 불태워라!”",
        "textEn": "“Fire the White Flame Batteries! Incinerate Artus's ironclad vanguard!”"
    },
    {
        "speaker": "choice",
        "name": "평원의 중앙 방진",
        "nameEn": "Phalanx of the Plains",
        "cardId": 41,
        "text": "적의 철갑 기병 돌격대가 연합군 중앙을 뚫으려 쇄도한다. 카단은 방패를 대지에 박아 넣으며 방진을 세운다.",
        "textEn": "Heavy juggernauts charged to cleave the allied center. Ramming his shield into earth, Kadan formed the bulwark.",
        "choices": [
            {
                "id": "ch37_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "연합군 전열의 중앙을 맡겠다! 방패는 뚫리지 않는다!",
                "labelEn": "I hold the center of the allied line! This shield shall not break!",
                "followUpTextKo": "“수천 기의 적 기병 돌격을 홀로 버텨내며 아군의 절대 방어선을 지켜냈다.”",
                "followUpTextEn": "“Standing firm against thousands of ironclad charges held the line unbroken.”",
                "bonusType": "buff",
                "bonusValue": 30,
                "bonusDescKo": "[불멸의 방진] 아군 전체 방어력 상승",
                "bonusDescEn": "[Immortal Phalanx] Allied Team DEF Up",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "연합군 전열의 중앙을 맡겠다! 방패는 뚫리지 않는다!",
                "textEn": "I hold the center of the allied line! This shield shall not break!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[불멸의 방진] 아군 전체 방어력 상승",
                    "buffNameEn": "[Immortal Phalanx] Allied Team DEF Up"
                },
                "followUpLine": "“수천 기의 적 기병 돌격을 홀로 버텨내며 아군의 절대 방어선을 지켜냈다.”",
                "followUpLineEn": "“Standing firm against thousands of ironclad charges held the line unbroken.”"
            },
            {
                "id": "ch37_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "적 기갑병의 측면 관절부를 노려 포위망을 좁힌다.",
                "labelEn": "Target the exposed joints of enemy heavy juggernauts to tighten the vice.",
                "followUpTextKo": "“적 기갑 전차들의 궤도를 하나씩 끊어내며 진격을 완전히 좌초시켰다.”",
                "followUpTextEn": "“Crippling war machine treads grounded the imperial vanguard in tracks.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "적 기갑병의 측면 관절부를 노려 포위망을 좁힌다.",
                "textEn": "Target the exposed joints of enemy heavy juggernauts to tighten the vice.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "def_shield",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“적 기갑 전차들의 궤도를 하나씩 끊어내며 진격을 완전히 좌초시켰다.”",
                "followUpLineEn": "“Crippling war machine treads grounded the imperial vanguard in tracks.”"
            },
            {
                "id": "ch37_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "전장의 수만 군사들에게 수호의 마나를 불어넣는다.",
                "labelEn": "Channel protective Astral Mana across tens of thousands of warriors.",
                "followUpTextKo": "“방패에서 뿜어진 거대한 오라가 연합군 전사들의 검에 황금빛 축복을 실어주었다.”",
                "followUpTextEn": "“A grand aura from the buckler blessed every allied blade in golden light.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "전장의 수만 군사들에게 수호의 마나를 불어넣는다.",
                "textEn": "Channel protective Astral Mana across tens of thousands of warriors.",
                "reward": {
                    "snsCoins": 30,
                    "buff": "mana_surge",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“방패에서 뿜어진 거대한 오라가 연합군 전사들의 검에 황금빛 축복을 실어주었다.”",
                "followUpLineEn": "“A grand aura from the buckler blessed every allied blade in golden light.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "평원의 승리",
        "nameEn": "Triumph on the Plains",
        "text": "적의 철갑 기병대는 패주했고, 황궁 정문으로 통하는 대로가 열렸다.",
        "textEn": "The imperial juggernauts routed, opening the grand avenue to the Palace gates."
    },
  ],
  38: [
    {
        "speaker": "narrator",
        "name": "제 38화: 세 개의 비단 봉인",
        "nameEn": "Episode 38: Three Silk Seals",
        "text": "황제 알현실 전실 어전. 섭정의 오른팔이자 반역의 주역인 재상 루시안이 황실 혈통의 생명력을 흡수하는 세 개의 비단 봉인을 쥐고 최후의 저항을 벌였다.",
        "textEn": "The Throne Room ante-chamber. Vizier Lucian, Artus's treacherous right hand, staged a final defense wielding three silk seals draining the imperial bloodline."
    },
    {
        "speaker": "speaker",
        "name": "루시안",
        "nameEn": "Lucian",
        "cardId": 61,
        "text": "“카단! 이그니스! 감히 여기까지 발을 들이다니! 세 개의 비단 봉인이 풀리기 전에 너희 뼈를 갈아버리겠다!”",
        "textEn": "“Kadan! Ignis! How dare you step here! Before the three silk seals snap, I'll grind your bones!”"
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“저 비단 봉인들은 황실 혈통의 생명력을 흡수하는 주술이야! 서둘러 풀어야 해!”",
        "textEn": "“Those silk seals are drain curses sucking royal lifeforce! Break them quickly!”"
    },
    {
        "speaker": "choice",
        "name": "간신의 심판",
        "nameEn": "Judgment of Treason",
        "cardId": 41,
        "text": "루시안의 어둠 검술이 독기를 뿜어내고 봉인의 마력이 팽창한다. 카단은 방패를 치켜들며 전실로 뛰어든다.",
        "textEn": "Lucian's venomous blades flared as sealing magic surged. Raising his buckler, Kadan charged across the throne hall.",
        "choices": [
            {
                "id": "ch38_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "루시안! 네 탐욕의 거짓 옥좌는 오늘로 끝이다!",
                "labelEn": "Lucian! Your greedy sham throne ends today!",
                "followUpTextKo": "“루시안의 암흑 검을 방패로 쳐올려 천장에 처박고 거짓된 왕관을 박살 냈다.”",
                "followUpTextEn": "“Bashing Lucian's dark rapier into the vaulted rafters shattered his gilded crown.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "루시안! 네 탐욕의 거짓 옥좌는 오늘로 끝이다!",
                "textEn": "Lucian! Your greedy sham throne ends today!",
                "reward": {
                    "snsCoins": 30,
                    "buff": "atk_boost",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“루시안의 암흑 검을 방패로 쳐올려 천장에 처박고 거짓된 왕관을 박살 냈다.”",
                "followUpLineEn": "“Bashing Lucian's dark rapier into the vaulted rafters shattered his gilded crown.”"
            },
            {
                "id": "ch38_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "세 비단 봉인의 룬 매듭을 역순으로 풀어 마나를 무력화한다.",
                "labelEn": "Untie the rune knots of the three silk seals in reverse order to discharge the mana.",
                "followUpTextKo": "“매듭이 풀리자 황실에 걸려 있던 피의 저주가 안개처럼 사라졌다.”",
                "followUpTextEn": "“Unraveling the knots dissolved the imperial blood hexes into thin air.”",
                "bonusType": "buff",
                "bonusValue": 25,
                "bonusDescKo": "[봉인 해제] 상태이상 무효",
                "bonusDescEn": "[Seal Liberation] Debuff Immunity",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "세 비단 봉인의 룬 매듭을 역순으로 풀어 마나를 무력화한다.",
                "textEn": "Untie the rune knots of the three silk seals in reverse order to discharge the mana.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[봉인 해제] 상태이상 무효",
                    "buffNameEn": "[Seal Liberation] Debuff Immunity"
                },
                "followUpLine": "“매듭이 풀리자 황실에 걸려 있던 피의 저주가 안개처럼 사라졌다.”",
                "followUpLineEn": "“Unraveling the knots dissolved the imperial blood hexes into thin air.”"
            },
            {
                "id": "ch38_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "더 이상의 살육은 무의미하다. 항복하고 죄를 자백하라.",
                "labelEn": "Further bloodshed is pointless. Yield and confess your crimes.",
                "followUpTextKo": "“카단의 압도적인 의기 앞에 루시안은 무기를 떨어뜨리고 무릎을 꿇었다.”",
                "followUpTextEn": "“Overwhelmed by Kadan's dignity, Lucian dropped his blade and knelt in shame.”",
                "bonusType": "sns",
                "bonusValue": 25,
                "bonusDescKo": "+25 SNS 획득",
                "bonusDescEn": "+25 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "더 이상의 살육은 무의미하다. 항복하고 죄를 자백하라.",
                "textEn": "Further bloodshed is pointless. Yield and confess your crimes.",
                "reward": {
                    "snsCoins": 25,
                    "buff": "mana_surge",
                    "buffName": "+25 SNS 획득",
                    "buffNameEn": "+25 SNS Points"
                },
                "followUpLine": "“카단의 압도적인 의기 앞에 루시안은 무기를 떨어뜨리고 무릎을 꿇었다.”",
                "followUpLineEn": "“Overwhelmed by Kadan's dignity, Lucian dropped his blade and knelt in shame.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "정의의 회복",
        "nameEn": "Restoration of Justice",
        "text": "비단 봉인이 풀리고 옥좌를 더럽히던 간신 루시안은 포박되어 끌려나갔다.",
        "textEn": "With the silk seals severed, the treasonous vizier Lucian was shackled and led away."
    },
  ],
  39: [
    {
        "speaker": "narrator",
        "name": "제 39화: 지켜야 할 세계",
        "nameEn": "Episode 39: The World Worth Protecting",
        "text": "황궁 최심부 붉은 유리 궁정 심연 코어. 마신의 힘을 강림시켜 칠흑의 악마 갑주를 두른 섭정 아르투스가 대륙 전체를 삼키려 포효했다.",
        "textEn": "The Celestial Citadel Throne Core. Clad in abyssal demonic plate infused with hellish power, Regent Artus roared to consume the entire continent."
    },
    {
        "speaker": "speaker",
        "name": "데스나이트 아르투스",
        "nameEn": "Death Knight Artus",
        "cardId": 60,
        "text": "“크하하하! 대륙을 부수고 심연의 마신을 이 땅에 강림시키겠다! 이것이 진정한 파괴와 재창조다!”",
        "textEn": "“Bwahaha! I will shatter this continent and summon the Abyssal Lord! True rebirth through ruin!”"
    },
    {
        "speaker": "speaker",
        "name": "황자 이그니스",
        "nameEn": "Prince Ignis",
        "cardId": 11,
        "text": "“우리 아버지를 죽이고 어머니의 삶을 짓밟은 네놈의 야망은 여기서 끝이다! 백색 성염, 타올라라!”",
        "textEn": "“You butchered my father and crushed my mother's life! Your ambition ends here! Flare, Holy Flame!”"
    },
    {
        "speaker": "speaker",
        "name": "카단",
        "nameEn": "Kadan",
        "cardId": 41,
        "text": "“아르투스! 힘은 지배하기 위함이 아니라, 약한 자들을 지키는 방패다!”",
        "textEn": "“Artus! Power is not for domination, but a shield to protect the innocent!”"
    },
    {
        "speaker": "choice",
        "name": "최후의 심연 대결전",
        "nameEn": "Final Abyssal Clash",
        "cardId": 41,
        "text": "아르투스의 암흑 대검이 시공간을 가르며 떨어진다. 카단과 이그니스는 모든 생명력을 쥐어짜 방패와 성염을 맞부딪친다.",
        "textEn": "Artus's dark greatsword cleft the very fabric of space. Channeling their entire lifeforce, Kadan and Ignis met the blade.",
        "choices": [
            {
                "id": "ch39_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "내 방패는 아버지와 어머니, 그리고 대륙의 모든 백성들의 것이다!",
                "labelEn": "My shield belongs to father, mother, and every citizen across this realm!",
                "followUpTextKo": "“방패에서 눈부신 백은빛 아케인 오라가 솟구쳐 아르투스의 암흑 대검을 산산조각 내었다.”",
                "followUpTextEn": "“A dazzling silver-white aura erupted from the shield, shattering Artus's dark greatsword.”",
                "bonusType": "buff",
                "bonusValue": 35,
                "bonusDescKo": "[최후의 아케인 에코] 공격 및 방어력 +35%",
                "bonusDescEn": "[Final Arcane Echo] +35% ATK & DEF",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "내 방패는 아버지와 어머니, 그리고 대륙의 모든 백성들의 것이다!",
                "textEn": "My shield belongs to father, mother, and every citizen across this realm!",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "[최후의 아케인 에코] 공격 및 방어력 +35%",
                    "buffNameEn": "[Final Arcane Echo] +35% ATK & DEF"
                },
                "followUpLine": "“방패에서 눈부신 백은빛 아케인 오라가 솟구쳐 아르투스의 암흑 대검을 산산조각 내었다.”",
                "followUpLineEn": "“A dazzling silver-white aura erupted from the shield, shattering Artus's dark greatsword.”"
            },
            {
                "id": "ch39_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "아르투스의 심장핵이 열리는 찰나를 노려 창끝을 유도한다!",
                "labelEn": "Guide Ignis's spearpoint to the split second when Artus's heart core opens!",
                "followUpTextKo": "“방패로 심연의 파동을 쳐내자 노출된 핵으로 이그니스의 백색 화염창이 꽂혔다.”",
                "followUpTextEn": "“Deflecting abyssal waves opened a flawless path for Ignis's fatal thrust.”",
                "bonusType": "sns",
                "bonusValue": 30,
                "bonusDescKo": "+30 SNS 획득",
                "bonusDescEn": "+30 SNS Points",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "아르투스의 심장핵이 열리는 찰나를 노려 창끝을 유도한다!",
                "textEn": "Guide Ignis's spearpoint to the split second when Artus's heart core opens!",
                "reward": {
                    "snsCoins": 30,
                    "buff": "def_shield",
                    "buffName": "+30 SNS 획득",
                    "buffNameEn": "+30 SNS Points"
                },
                "followUpLine": "“방패로 심연의 파동을 쳐내자 노출된 핵으로 이그니스의 백색 화염창이 꽂혔다.”",
                "followUpLineEn": "“Deflecting abyssal waves opened a flawless path for Ignis's fatal thrust.”"
            },
            {
                "id": "ch39_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "백색 화염과 성진호흡의 합일! 어둠을 태양의 빛으로 씻어낸다!",
                "labelEn": "Harmonize White Flame and Astral Breathing! Wash away darkness in solar light!",
                "followUpTextKo": "“두 청년의 영혼이 완벽하게 융합되며 도성 전체를 뒤덮던 칠흑의 어둠이 정화되었다.”",
                "followUpTextEn": "“A perfect fusion of their souls cleansed the dark miasma smothering the citadel.”",
                "bonusType": "sns",
                "bonusValue": 35,
                "bonusDescKo": "+35 SNS 획득",
                "bonusDescEn": "+35 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "백색 화염과 성진호흡의 합일! 어둠을 태양의 빛으로 씻어낸다!",
                "textEn": "Harmonize White Flame and Astral Breathing! Wash away darkness in solar light!",
                "reward": {
                    "snsCoins": 35,
                    "buff": "mana_surge",
                    "buffName": "+35 SNS 획득",
                    "buffNameEn": "+35 SNS Points"
                },
                "followUpLine": "“두 청년의 영혼이 완벽하게 융합되며 도성 전체를 뒤덮던 칠흑의 어둠이 정화되었다.”",
                "followUpLineEn": "“A perfect fusion of their souls cleansed the dark miasma smothering the citadel.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "마신의 소멸",
        "nameEn": "Extinction of the Demon Core",
        "text": "아르투스의 심연 코어가 부서지며 수십 년 동안 대륙을 옥죄었던 붉은 유리 궁정이 무너져 내렸다.",
        "textEn": "As the abyssal core shattered, the Red Glass Court that choked the realm for decades crumbled away."
    },
  ],
  40: [
    {
        "speaker": "narrator",
        "name": "제 40화: 영웅이라 불리지 않는 자",
        "nameEn": "Episode 40: One Who Is Not Called a Hero",
        "text": "라이트헤븐 대광장 & 북쪽 고향 엘윈으로 향하는 봄바람 길. 전쟁은 끝났고 제국은 카단과 이그니스에게 대원수의 황금 왕관과 영지를 수여하려 했다.",
        "textEn": "Lighthaven grand plaza & north road to Elwin. War was ended, and the realm sought to bestow Supreme Marshal crowns and grand domains upon Kadan and Ignis."
    },
    {
        "speaker": "speaker",
        "name": "실리아",
        "nameEn": "Celia",
        "cardId": 62,
        "text": "“황궁의 황금 왕관 따위는 내 갈대 피리보다 무겁고 시시해. 난 북쪽 초원으로 갈 거야.”",
        "textEn": "“Imperial gold crowns are heavier and duller than my reed flute. I'm heading north to the prairie.”"
    },
    {
        "speaker": "speaker",
        "name": "황자 이그니스",
        "nameEn": "Prince Ignis",
        "cardId": 11,
        "text": "“저 역시 궁정에 머물지 않겠습니다. 성기사단의 깃발을 들고 부흥의 흙을 일구겠습니다.”",
        "textEn": "“Nor will I linger in palaces. I will take the Paladin banner to till the soil of rebuilding.”"
    },
    {
        "speaker": "speaker",
        "name": "카단",
        "nameEn": "Kadan",
        "cardId": 41,
        "text": "“저를 영웅이라 부르지 마십시오. 저는 그저 눈보라 치던 밤의 서약을 지킨 사람일 뿐입니다.”",
        "textEn": "“Do not call me a hero. I am merely one who kept the vow made beneath the blizzard.”"
    },
    {
        "speaker": "choice",
        "name": "새로운 봄을 향한 발걸음",
        "nameEn": "Steps Toward a New Spring",
        "cardId": 41,
        "text": "환호하는 민중들을 뒤로하고 카단은 방패를 짊어지고 북쪽 고향 길을 향해 돌아선다.",
        "textEn": "Turning from cheering crowds, Kadan slung his buckler over his shoulder toward the north road home.",
        "choices": [
            {
                "id": "ch40_choice_1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "저는 영웅이 아닙니다. 약한 사람들의 곁에 서는 방패일 뿐입니다.",
                "labelEn": "I am no hero. I am merely a shield standing beside the vulnerable.",
                "followUpTextKo": "“왕관을 정중히 사양하고 뒤돌아서자 도성 민중들이 눈물과 환호로 박수를 보냈다.”",
                "followUpTextEn": "“Politely declining the crown, the square erupted into tears and heartfelt ovations.”",
                "bonusType": "sns",
                "bonusValue": 50,
                "bonusDescKo": "+50 SNS 획득",
                "bonusDescEn": "+50 SNS Points",
                "isDefault": true,
                "badge": "[결의/돌파]",
                "badgeEn": "[Resolve]",
                "text": "저는 영웅이 아닙니다. 약한 사람들의 곁에 서는 방패일 뿐입니다.",
                "textEn": "I am no hero. I am merely a shield standing beside the vulnerable.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "atk_boost",
                    "buffName": "+50 SNS 획득",
                    "buffNameEn": "+50 SNS Points"
                },
                "followUpLine": "“왕관을 정중히 사양하고 뒤돌아서자 도성 민중들이 눈물과 환호로 박수를 보냈다.”",
                "followUpLineEn": "“Politely declining the crown, the square erupted into tears and heartfelt ovations.”"
            },
            {
                "id": "ch40_choice_2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "권력은 다시 부패를 낳습니다. 평화는 흙과 땀 속에 있습니다.",
                "labelEn": "Power breeds corruption anew. True peace abides in earth and honest sweat.",
                "followUpTextKo": "“화려한 권좌를 내려놓고 방랑자의 배낭을 멘 카단의 눈빛은 맑고 평온했다.”",
                "followUpTextEn": "“Strapping on the traveler's pack, Kadan's gaze shone clear and tranquil.”",
                "bonusType": "buff",
                "bonusValue": 30,
                "bonusDescKo": "[방랑자의 깨달음] 영구 평화 축복",
                "bonusDescEn": "[Wanderer's Epiphany] Permanent Peace Blessing",
                "isDefault": false,
                "badge": "[신중/통찰]",
                "badgeEn": "[Insight]",
                "text": "권력은 다시 부패를 낳습니다. 평화는 흙과 땀 속에 있습니다.",
                "textEn": "Power breeds corruption anew. True peace abides in earth and honest sweat.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "def_shield",
                    "buffName": "[방랑자의 깨달음] 영구 평화 축복",
                    "buffNameEn": "[Wanderer's Epiphany] Permanent Peace Blessing"
                },
                "followUpLine": "“화려한 권좌를 내려놓고 방랑자의 배낭을 멘 카단의 눈빛은 맑고 평온했다.”",
                "followUpLineEn": "“Strapping on the traveler's pack, Kadan's gaze shone clear and tranquil.”"
            },
            {
                "id": "ch40_choice_3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "실리아, 약속을 지켰구나. 정말로 봄이 왔다.",
                "labelEn": "Celia, we kept our promise. Spring has truly arrived.",
                "followUpTextKo": "“봄바람에 흩날리는 들꽃 향기 속에서 두 사람은 미소를 지으며 북쪽 길을 걸었다.”",
                "followUpTextEn": "“Amidst wildflower fragrance dancing on spring breezes, the two smiled and walked north.”",
                "bonusType": "sns",
                "bonusValue": 50,
                "bonusDescKo": "+50 SNS 획득",
                "bonusDescEn": "+50 SNS Points",
                "isDefault": false,
                "badge": "[성진호흡/공명]",
                "badgeEn": "[Resonance]",
                "text": "실리아, 약속을 지켰구나. 정말로 봄이 왔다.",
                "textEn": "Celia, we kept our promise. Spring has truly arrived.",
                "reward": {
                    "snsCoins": 50,
                    "buff": "mana_surge",
                    "buffName": "+50 SNS 획득",
                    "buffNameEn": "+50 SNS Points"
                },
                "followUpLine": "“봄바람에 흩날리는 들꽃 향기 속에서 두 사람은 미소를 지으며 북쪽 길을 걸었다.”",
                "followUpLineEn": "“Amidst wildflower fragrance dancing on spring breezes, the two smiled and walked north.”"
            }
        ]
    },
    {
        "speaker": "quote",
        "name": "카단 & 아케인 에코즈 완결",
        "nameEn": "Kadan & Arcane Echoes Finale",
        "text": "눈보라 아래서 시작되었던 두 남자의 서약은 마침내 온 대륙에 따뜻한 봄빛을 선물하고 전설이 되었다.",
        "textEn": "The vow of two men begun in blizzard at last gifted warm spring across the land, blossoming into eternal legend."
    },
  ],
};
