# -*- coding: utf-8 -*-
import sys, os, re
sys.path.insert(0, ".")

# ==============================================================================
# EPISODE 21: 불탄 배의 흔적
# ==============================================================================
ep21_s1 = """미풍의날개호를 선두로 한 수백 척의 꽃배 선단이 대해의 거센 풍랑을 넘어 마침내 대륙의 서남부 해안에 도달했을 때, 일행을 맞이한 것은 환영의 깃발이 아니라 매캐한 기름 냄새와 검붉은 연기 기둥이었다. 과거 북방과 대해를 잇는 평화로운 무역항이었던 세븐브리지 항구의 목재 부두들이 무참히 불타 숯덩이가 되어 있었고, 썰물에 밀려온 검은 잿더미와 부서진 돛대 파편들이 갯벌을 뒤덮고 있었다. 갈매기 한 마리 날지 않는 적막 속에서, 오직 바닷바람에 실려 오는 타는 냄새만이 참극의 규모를 짐작하게 했다.

론돌이 키를 잡고 타버린 부두를 바라보며 굵은 주먹을 떨었다.

“이 잔인무도한 놈들... 피난민들의 발을 묶기 위해 민간 항구와 어선들까지 모조리 불태워 버렸구나. 잿더미 아래에서 여전히 유황 냄새가 진동한다.”

카단이 무쇠 방패를 비껴 쥐며 갯벌 위로 가장 먼저 뛰어내렸다. 바닷물에 젖은 장화 밑으로 부서진 조개껍데기와 숯가루가 버석거렸다.

“루시안의 황실 토벌대가 이미 해안선을 봉쇄하고 초토화 작전을 펼친 것이다. 살아남은 사람들이 있는지 찾아야 한다.”

실리아가 녹옥 지팡이를 들어 해안가의 바람을 모으며 미간을 찌푸렸다.

“서쪽 해안 절벽 아래 소금 창고 쪽에서 미약한 사람들의 숨결이 느껴져요. 하지만 그 주변으로 사나운 마나의 덫들이 촘촘하게 깔려 있어요.”"""

ep21_s2 = """일행은 잿더미와 부러진 선박 잔해를 피해 조심스럽게 서쪽 해안 암벽으로 향했다. 그곳에는 불타 무너진 대형 병원선의 목재 용골(龍骨)이 비스듬히 누워 있었고, 선체 틈새로 검은 핏자국이 어지럽게 번져 있었다. 약초 상자와 붕대 조각들이 진흙탕 속에 짓밟혀 있었고, 부서진 찻잔 사이로 북방 성기사단의 십자 성흔이 희미하게 남아 있었다.

카단이 진흙 속에 파묻혀 있던 은빛 단검의 붉은 매듭을 정돈하며 나지막이 중얼거렸다.

“이곳은 발리안 숙부님과 옛 성기사단이 세운 무료 진료소였다. 부상당한 어부들과 고아들을 치료하던 안식처마저 잿더미로 만들다니...”

그때 바위 절벽 아래 지하 소금 창고 입구에서 낡은 나무 판자가 삐걱거리며 열리더니, 백발이 성성한 노인 하나가 부러진 약초 절구통을 든 채 조심스럽게 고개를 내밀었다. 항구의 늙은 의원 오르도였다.

오르도가 카단의 방패에 새겨진 성기사단의 문장을 보고 눈물을 터뜨렸다.

“오오, 빛의 신이시여! 성기사의 방패가 돌아왔구나! 루시안의 붉은 늑대 기사단이 항구를 불태우고 젊은이들을 광산으로 끌고 갔지만, 지하 창고에 어린아이 스무 명을 숨겨두었습니다!”

이그니스가 다가가 노인의 떨리는 손을 붙잡으며 고개를 숙였다.

“늦게 와서 죄송합니다, 어르신. 황궁의 군대가 저지른 만행에 대해, 기사의 이름을 걸고 사죄드립니다.”"""

ep21_s3 = """소금 창고 안으로 들어서자, 서늘한 소금 가마니 사이에서 추위와 공포에 떨고 있던 스무 명의 난민 아이들과 부상자들이 웅크리고 있었다. 며칠 동안 굶주린 아이들의 얼굴은 흙먼지로 뒤덮여 있었고, 상처 입은 어부들은 썩어 들어가는 다리를 부여잡고 신음하고 있었다.

실리아가 주저 없이 무릎을 꿇고 허리춤 주머니에서 정화의 약초 가루를 꺼내 환자들의 상처에 발랐다.

“두려워하지 마세요. 이제 안전해요. 바람 속삭임 섬에서 가져온 청량한 바람의 약초예요.”

실리아의 녹옥 지팡이에서 뿜어져 나온 은은한 비취빛 마나가 아이들의 이마를 어루만지자, 열병에 들떠 밭은숨을 내쉬던 아이들의 호흡이 차분하게 가라앉았다.

카단은 배낭에서 보리빵과 말린 고기를 꺼내 아이들의 작은 손에 쥐여주며 말했다.

“천천히 씹어 먹어라. 밖의 바다에 너희를 안전하게 태워줄 수백 척의 꽃배가 기다리고 있다.”

한 어린아이가 카단의 무쇠 방패를 작은 손으로 만지며 울먹였다.

“형아... 기사 아저씨들이 우리 집을 불태웠어요... 엄마는 어디로 간 거예요?”

카단은 아이의 머리를 부드럽게 쓰다듬으며 가슴속 깊은 곳에서 차오르는 뜨거운 분노를 다스렸다.

“엄마를 반드시 찾아주마. 그리고 너희들의 집을 짓밟은 자들에게 반드시 죗값을 물을 것이다.”"""

ep21_s4 = """그 감동의 순간, 소금 창고 밖에서 거친 군화 소리와 함께 쇠뇌 시위가 팽팽하게 당겨지는 소리가 들려왔다. 항구를 순찰하던 루시안의 친위 감찰 기사 서른 명이 연기를 보고 소금 창고를 포위한 것이었다.

감찰대장이 창고 문을 걷어차며 비열한 조소를 흘렸다.

“숨어 있는 쥐새끼들이 감히 살아남아 있었군! 반역자들의 씨를 말려 바다에 던져라!”

카단이 지체 없이 무쇠 방패를 앞세우며 창고 문밖으로 뛰쳐나갔다. 빗발치는 독화살들이 방패에 부딪쳐 튕겨 나가며 요란한 쇳소리를 냈다.

“아이들에게 단 한 발자국도 다가서지 못한다!”

카단은 별의 호흡을 실어 방패를 힘차게 회전시키며 감찰병들의 창날을 부러뜨렸다. 이그니스 역시 쇠파이프를 비껴 쥐며 돌진했다. 순백의 성화가 허공을 가르며 적들의 갑주를 녹여 내렸고, 적병들은 비명을 지르며 갯벌 위로 쓰러졌다. 실리아가 일으킨 거센 모래폭풍이 감찰병들의 시야를 완전히 차단했다.

카단과 이그니스의 완벽한 공수 협격 앞에 서른 명의 감찰대는 불과 몇 분 만에 무기를 버리고 뿔뿔이 패주했다."""

ep21_s5 = """패퇴한 적병들이 달아나고 해안가에 다시 잔잔한 파도 소리가 돌아왔다.

카단과 이그니스는 소금 창고의 난민들을 안전하게 부두로 호위하여 꽃배에 탑승시켰다. 론돌의 선원들이 따뜻한 잉어 수프를 아이들에게 건네며 안도감을 안겨주었다. 수평선 너머로 저물어가는 붉은 저녁노을이 잿더미가 된 항구를 비추고 있었다.

실리아가 불타버린 등대 기둥을 매만지며 결연하게 말했다.

“대륙 전체가 루시안의 공포 정치 아래에서 신음하고 있어요. 우리가 걸어가야 할 길이 얼마나 험난할지 똑똑히 보았어요.”

이그니스가 주먹을 불끈 쥐며 대답했다.

“저들이 불태운 것은 집이지만, 결코 사람들의 희망까지 태우지는 못했다. 수도로 가는 길목마다 고통받는 이들을 구원하겠다.”

카단은 은빛 단검을 쥔 채 서쪽 산맥을 바라보았다.

“알렉산다르 스승님과 발리안 숙부님이 목숨 바쳐 지키려 했던 대륙이다. 이제 우리가 방패를 들고 그 길을 끝까지 걸어가자.”

세 젊은이는 노을빛 아래에서 굳건한 맹세를 나누며, 대륙의 심장부로 향하는 첫 번째 행군을 힘차게 시작했다."""

EP21_KO = f"# 눈히어로 21화 - 불탄 배의 흔적\n\n> 원문 범위: 제41장-제42장\n\n{ep21_s1}\n\n{ep21_s2}\n\n{ep21_s3}\n\n{ep21_s4}\n\n{ep21_s5}"

# Ep 21 English Translation
EP21_EN = """SNSHero Novel
Episode 21: Traces of the Burned Ship

When the armada of hundreds of flower boats led by the flagship 'Breeze Wing' crossed the treacherous ocean swells to reach the southwestern coast of the mainland, what welcomed the companions was not fluttering banners of celebration, but the suffocating stench of burning pitch and towering pillars of blackened smoke. The timber wharves of Seven Bridges Haven, once a tranquil maritime sanctuary connecting the northern tundra with the eastern seas, had been reduced to smoldering ash, while receding tides dragged fractured spars and scorched decking across the mudflats. In this desolate graveyard where not even a solitary gull cried, only the bitter reek of scorched cedar bore testimony to the scale of the atrocity.

Gripping the helm, Rondol surveyed the ruined piers, his broad fists trembling with suppressed rage.

"Merciless curs... To trap the fleeing populace, they incinerated civilian transports and fishing cutters without distinction. The mudflats still reek of imperial sulfur."

Bracing his unadorned iron shield, Kadan leaped first onto the wet mudflats, his leather boots crunching through crushed seashells and charcoal dust.

"Lucian's imperial vanguard has fortified the coastline and initiated a brutal scorched-earth campaign. We must search for survivors amidst the ruins."

Raising her Jade Staff to gather the coastal winds, Cilia knit her brow in deep concentration.

"Beneath the western sea cliffs near the salt cellar, I sense the faint, labored breathing of living souls. But lethal mana snares are woven densely across the approach."

Weaving through heaps of sodden ash and charred timber ribs, the companions advanced cautiously toward the western cliff face. There lay the canted keel of a massive, burned hospital barge, dark bloodstains smeared along the fractured hull. Medicine chests and linen bandages lay trampled into the muck, and upon a broken tea bowl rested the faint, weathered cross-crest of the Arcane Holy Knights.

Smoothing the scarlet ribbon bound to his silver dagger, Kadan spoke in a hushed, reverent murmur.

"This was the charitable clinic established decades ago by Uncle Balian and the Holy Knights. A haven that healed impoverished fishermen and orphans... incinerated into cinder."

Just then, a weathered trapdoor at the base of the granite cliff creaked open, and a white-haired elder brandishing a broken stone pestle peeked out with trembling wariness. It was Ordo, the elderly apothecary of the haven.

Beholding the sacred cross-crest upon Kadan's iron shield, Ordo broke into racking sobs of relief.

"Praise be to the heavens! The sacred shield of the Holy Knights has returned! Lucian's Crimson Wolf vanguard put the harbor to the torch and dragged our able-bodied youths to the labor mines, but I managed to conceal twenty orphaned children beneath these salt vaults!"

Stepping forward, Ignis took the old man's trembling hands, bowing his head in solemn remorse.

"Forgive our tardy arrival, elder. For the atrocities committed by the imperial host, I offer my life in earnest atonement."

Descending into the salt cellar, the companions beheld twenty orphaned refugee children and wounded fishermen huddled together amidst sacks of coarse sea salt. Caked in grime and starving after days without rations, the children shivered, while injured mariners clutched gangrenous limbs in silent agony.

Without a second thought, Cilia knelt upon the damp stone, extracting soothing restorative powders from her satchel to dress their lacerations.

"Do not fear. You are safe now. This is the soothing balm of mountain herbs brought from Whispering Wind Island."

As gentle teal mana radiated from Cilia's staff, stroking the children's fevered brows, their rasping breath smoothed into peaceful cadence.

Kadan drew loaves of barley bread and dried venison from his pack, placing them into the children's fragile hands.

"Eat slowly and take heart. Beyond these shores, hundreds of festive flower boats are waiting to bear you to safety."

A small girl touched Kadan's battered iron shield with her tiny fingers, weeping softly.

"Mister knight... The men in armor set fire to our home... Where has my mother gone?"

Caressing the girl's hair with tender gentleness, Kadan mastered the blazing fury surging in his breast.

"I will find your mother, little one. And those who crushed your hearth shall answer for every drop of sorrow they caused."

In that tender moment, the sharp crunch of armored boots and the rhythmic creak of cocked crossbows echoed outside. Thirty elite inquisitors of Lucian's guard, alerted by the smoke, had cordoned off the cellar entrance.

Kicking down the outer door, the inquisition commander sneered in cruel triumph.

"So the vermin survived beneath the stones! Exterminate the traitors and feed their bones to the sea!"

Without hesitation, Kadan charged through the threshold, raising his iron shield. A volley of poisoned bolts shattered against the curved surface with deafening clangs.

"Not a single foot shall approach these children!"

Channeling star-breathing, Kadan spun his shield, snapping spearheads and shattering the vanguard's formation. Ignis charged beside him, his iron weapon wreathed in roaring white fire. The sanctified heat incinerated the assassins' plate armor, driving them headlong into the muck, while Cilia's blinding sandstorm stripped away their vision.

Confronted by the flawless synergy of shield and flame, the thirty inquisitors broke formation within minutes, casting aside their weapons in panicked retreat.

With the threat vanquished, tranquil surf returned to the shore.

Kadan and Ignis escorted the refugees safely onto the flower boats, where Rondol's crew served steaming carp soup to the shivering children. Beyond the western horizon, the rose-gold dusk cast long, dramatic shadows across the ruined harbor.

Touching the scorched stone of the lighthouse, Cilia spoke with solemn resolve.

"The entire continent groans beneath Lucian's reign of terror. The road ahead will test every fiber of our spirits."

Ignis clenched his fists with unyielding conviction.

"They burned timber and stone, but they could never incinerate the hope of the people. At every crossroads toward the capital, we will deliver the suffering from despair."

Gazing toward the distant western mountain passes, Kadan tightened his grip on his dagger.

"This is the realm Master Aleksandar and Uncle Balian bled to protect. Now we raise our shields and walk that road until the dawn."

Under the dying light of dusk, the three youths sealed their unbreakable oath, taking their first bold strides into the heart of the troubled continent."""

print("EP21 KO length:", len(EP21_KO), "EN length:", len(EP21_EN))
