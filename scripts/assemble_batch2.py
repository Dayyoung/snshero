import sys, os, re
sys.path.insert(0, ".")

from scripts.test_ep12_depth import s1 as ep12_s1, s2 as ep12_s2, s3 as ep12_s3, s4 as ep12_s4, s5 as ep12_s5

EP12_KO = f"# 눈히어로 12화 - 두 무덤 사이의 봄\n\n> 원문 범위: 제23장-제24장\n\n{ep12_s1}\n\n{ep12_s2}\n\n{ep12_s3}\n\n{ep12_s4}\n\n{ep12_s5}"

EP12_EN = """SNSHero Novel
Episode 12: Spring Between Two Graves

Deep within the ancient oak groves encircling the outer boundaries of the capital, Lighthaven, the forgotten sanctuary of the Arcane Holy Knights lay steeped in heavy silence. Coiling around the fallen columns of the white marble cloister, deep emerald moss and mistletoe tangled like weathered webs, while through fissures in the fractured altar, melting winter snowdrifts dripped with clear, rhythmic drops. Woodland thrushes chirped softly in the twilight mist of early dawn, yet the atmosphere within the flagstone courtyard remained cold and tense as winter ice.

The aged Paladin Balian rested against a crumbling stone wall within the nave, breathing in shallow, labored gasps. The deep wounds sustained while escaping the sulfur fires of the Seventh Labor Camp burned with fever, and the necrotic venom of Medusa Gorgo spread like blackened veins across the scarred expanse of his chest. Parched and pale as ash, the veteran's lips trembled as involuntary tremors passed through his calloused fingers. As cold drafts brushed the stone floor, Balian coughed up dark blood, pressing a hand to his wound.

With trembling hands, Issela blended crushed comfrey leaves with the cooling sap of the Moonlit Herb brought by Kadan from the imperial apothecary, gently applying the poultice over the blackened lacerations upon her husband's breast. Whiffs of pale steam rose as the cooling herbs touched the fevered flesh.

"Bear it just a little longer, Balian. The medicine Kadan secured will soon extinguish the fever in your blood. You must live... to hold our boy, our Ignis, in your arms once more."

Balian reached out with a scarred, calloused hand to brush away the tears gathering upon his wife's cheeks, a faint, weary smile touching his lips.

"Issela... my mortal shell was largely consumed under the inquisitors' fires in the mines. Yet now that you have reclaimed your true memories and sit beside me, the hellish eighteen years of isolation dissolve like spring snow upon the hearth."

That fragile peace was shattered all too soon. Through the oak groves beyond the perimeter walls came the rhythmic thunder of iron-shod hooves and the unmistakable chill of unsheathed steel. High Minister Lucian had arrived, commanding over a hundred elite flame guardsmen to encircle the sanctuary in an iron perimeter. Draped in a mantle of rich crimson silk, Lucian swirled a chalice of silver wine atop his black charger, bellowing in mocking amusement. Behind him, crimson flame wards flared to seal every retreat path.

Lucian's venomous laughter echoed along the sanctuary walls.

"Lord Balian! What a pathetic spectacle, wheezing like a cornered cur among shattered masonry! Surrender Issela and deliver the Throne Seal of the Holy Order, and I might grant you an untroubled demise without further agony!"

At the foot of the narrow stone stairs guarding the entrance, Paladin Walker and Hercul planted two colossal steel tower shields side by side, barring the gateway. Behind them, the Six Masters—Grimli the dwarven smith, Gawain the wind-blade, Eyla the huntress, Kaze the shadow-blade, Rondol the pugilist, and Eliana the herbalist—drew their weapons with grim resolve, forming an unyielding line.

Grimli slammed his massive iron anvil hammer against the stone flagstones, his voice echoing like rolling thunder.

"The bloated curs of the court bark loud when backed by iron! If you wish to set your corrupt boots upon holy ground, prepare to have your skulls cracked over my anvil!"

With a cold gesture from Lucian, the flame lancers leveled their weapons and charged up the stairway in a roaring tide of fire and steel. The ascent became a slaughterhouse of clashing metal and concussive shockwaves. Shattered marble fragments flew as spells detonated, sulfur smoke choking the air. While Walker's azure barrier and Hercul's golden aegis deflected the incoming tempest of flaming quarrels, Cilia swept her teal staff, weaving a protective draft to open a retreat path through the northern defile.

Cilia turned toward Kadan, her voice urgent.

"We must escort the refugees and Lady Issela into the northern gorge! The wind corridor will collapse within ten minutes before the flame circle closes!"

Kadan nodded firmly, remembering the fundamental defensive lessons of Master Aleksandar as he leaped into the center of the stairs. Angling his iron shield to deflect the kinetic momentum of charging lancers into empty air, Kadan snapped spear-shafts with the razor edge of his silver dagger. The youthful warrior's grounded stance was an immovable wall against the imperial host. As charging spearheads glanced off the curved rim, flying sparks lit the unwavering resolve in his eyes.

An imperial officer swung his broadsword furiously against Kadan's guard.

"A vagrant pup dares block the imperial vanguard? I shall cleave your shield in two!"

Breathing through the star rhythm, Kadan pivoted his shield, burying the blade's force into the earth.

"So long as I have people to protect, this shield shall never yield before any flame."

In the courtyard behind them, Balian rose to his feet with Issela's support, stumbling toward an ancient stone cenotaph. It was the empty grave of his sworn brother, Aleksandar, who had fallen eighteen winters ago in Elwin. Weathered by wind and frost, the headstone bore Aleksandar's name and the faded cross emblem of the Holy Order, surrounded by withered stems of wild chrysanthemums sleeping beneath the snow.

With trembling hands, Balian poured sacred water over the lichen-crusted stone, pressing his forehead against the cold granite.

"Brother... As we swore beneath the snow, our sons have grown into stalwart men. Now I shall pass the last remaining embers of my soul to them, and journey to your side."

Drawing an ancient silver dagger inscribed with the vows of the Holy Knights from his breast, Balian pressed the hilt into Kadan's calloused palm. Kadan met the veteran's eyes with solemn depth.

"Uncle, the flame you have guarded shall never be extinguished. I swear to deliver Ignis from the shadows and restore peace to this continent."

Hidden within the deep gloom of the tree line, a solitary warrior watched the scene in breathless silence. It was High Commander Ignis of the White Flame Order. With his own eyes, Ignis beheld the heartfelt tears of his mother Issela, and the sacrificial dignity of his father Balian kneeling in prayer before Aleksandar's cenotaph. Realizing that the entire foundation of justice taught to him in the capital was a fabricated lie, turbulent agony and sorrow tore through Ignis's golden gaze.

Ignis could not bring himself to draw steel, clutching his breastplate as he murmured into the wind.

"Father... Mother... What then was the truth behind the laws of the throne... Was the righteousness I upheld nothing more than a hollow illusion..."

Through the desperate valor of Kadan and the Six Masters, the companions breached the mountain corridor leading toward the eastern coastline. Gawain's gale blinded the pursuit, and Grimli's hammer triggered a rockslide, blocking the gorge. Battered by fierce resistance and hindered by the craggy slopes, Lucian's legions broke off pursuit and fell back toward the citadel.

As they emerged from the blood-stained snowdrifts into the valley, Kadan looked down to see a tiny white flower pushing through the frozen shale. It was the first snowdrop of the season. Overcoming the deep scars of winter, the earth was finally drawing its first breath of spring. A gentle breeze brushed their brows, and the steps of the young wanderers were infused with renewed hope.

Cilia looked upon the snowdrop with a tender smile.

"No matter how bitter the winter, spring arrives without fail."

Kadan sheathed his silver dagger, nodding quietly.

"Our path ahead shall be no different. Let us cross the waves to Whispering Wind Island."

Behind them, the rising sun bathed the mountains in warm gold, illuminating their journey toward the sea."""

print("EP12 ready. Length:", len(EP12_KO))

# ==============================================================================
# EPISODE 13
# ==============================================================================
ep13_s1 = """동해안으로 굽이쳐 흐르는 해안 산맥의 험준한 삼나무 숲길은 며칠 동안 내린 이른 봄비로 질척하게 젖어 있었다. 빽빽하게 우거진 침엽수림 사이로는 짙은 바다 안개가 밀려들었고, 젖은 흙바닥과 바위 표면에서는 축축한 이끼 냄새와 솔잎 향이 뒤섞여 피어올랐다. 산새들의 울음소리조차 안개에 먹혀 먹먹하게 울리는 적막 속에서, 카단과 실리아는 동쪽 바다의 거점이자 바람 속삭임 섬으로 향하는 관문인 ‘구름돌아오는장원’으로 발걸음을 재촉하던 중이었다. 길가에는 겨우내 얼어붙었던 실개천이 녹아내리며 맑은 물소리를 냈고, 깎아지른 절벽 틈새로는 연보랏빛 제비꽃들이 수줍게 고개를 내밀고 있었다.

실리아는 걸음을 옮기며 해안 산맥 특유의 기류를 손끝으로 매만졌다.

“바다에서 불어오는 바람이 점점 무거워지고 있어요. 바람 속삭임 섬의 결계탑이 흔들리면서 동해안의 마나 균형이 무너지고 있다는 증거예요.”

카단이 무쇠 방패를 고쳐 쥐며 고개를 끄덕였다.

“수도에서 보았던 루시안의 룬 장치들도 심상치 않았다. 권력을 탐하는 자들이 대지의 질서를 어지럽히고 있어.”

깎아지른 바위 산마루를 넘어서던 무렵, 솔바람을 타고 고소한 기름 냄새와 고기 굽는 자작나무 장작 연기가 훅 끼쳐왔다.

카단이 방패를 비껴 쥐며 발걸음을 멈추었다.

“근처에 인기척이 있다. 아주 묵직하고 거칠게 다듬어지지 않은 마나의 고동이다.”

실리아가 바람의 냄새를 맡으며 콧방귀를 뀌었다.

“멧돼지 기름 냄새네요. 그것도 손재주 없는 요리사가 겉만 까맣게 태워 먹고 있는 냄새예요. 고기 타는 냄새가 이 산골짜기 전체를 채우고 있어요.”"""

ep13_s2 = """바위 언덕 너머의 아늑한 공터에는 사자 갈기처럼 덥수룩한 백발과 수염을 기른 거한 하나가 모닥불 곁에 드러누워 천둥 같은 코를 골고 있었다. 과거 황실 최고의 맹장이자 은퇴한 노장 레오나르였다. 그의 머리맡에는 영롱한 청록색 빛을 은은히 발산하는 전설의 ‘녹옥 지팡이’가 통나무 베개처럼 괴어져 있었다. 모닥불 위 굵은 참나무 꼬챙이에 꿰어진 멧돼지 다리는 겉이 숯덩이처럼 타들어가며 그을음을 뿜고 있었지만, 속살에서는 여전히 핏물이 뚝뚝 떨어지고 있었다.

실리아가 혀를 차며 다가가 소매를 걷어붙였다.

“어휴, 저 귀한 멧돼지 다리 고기를 숯검정으로 만들다니! 비키세요, 노인네!”

실리아는 허리춤 주머니에서 말린 노간주나무 열매와 야생 백리향을 꺼내 고기 표면에 골고루 문질렀다. 그리고 손가락 끝으로 부드러운 바람의 소용돌이를 일으켜 모닥불의 열기를 고기 속살 깊숙한 곳까지 균일하게 침투시켰다. 타버린 검은 겉껍질이 바삭하게 벗겨지고 노릇노릇한 육즙이 자르르 배어 나오자, 코를 골던 레오나르가 코를 킁킁거리며 벌떡 일어났다.

레오나르가 입가에 고인 침을 닦으며 호기심 어린 눈을 번뜩였다.

“허허, 웬 당돌한 계집애와 북방의 나무토막 같은 애송이가 남의 주안상에 참견질이냐!”

말은 호통을 치면서도 레오나르는 실리아가 꼬챙이에서 베어 건넨 노릇노릇한 고기 한 점을 덥석 입에 넣었다. 한 입 씹자마자 노장의 눈이 등잔만 하게 커졌다.

“크으! 겉은 바삭하고 속은 부드럽게 녹아내리는구나! 솔향과 백리향이 어우러져 황궁의 산해진미도 부럽지 않다!”"""

ep13_s3 = """레오나르는 단숨에 고기 절반을 먹어 치운 뒤, 바위 옆에 놓아두었던 녹옥 지팡이를 번쩍 들어 올렸다. 지팡이 끝에 박힌 거대한 취옥이 공명하며 묵직한 옥빛 파문이 공터 주변의 삼나무들을 흔들었다.

레오나르의 눈빛이 장수 특유의 서슬 퍼런 예기를 되찾았다.

“배를 채웠으니 밥값을 해야지. 애송이, 그 낡은 방패를 들어라. 네놈의 어깨가 대지의 무게를 견딜 수 있는지 시험해 보겠다!”

레오나르의 첫 번째 초식인 ‘지룡파황’이 허공을 갈랐다. 지팡이가 대지를 내려찍자 석판이 파도처럼 솟구쳐 올랐다. 카단은 당황하지 않고 방패를 아래로 비스듬히 깔아 지진의 파동을 빗겨냈다. 연이어 레오나르의 지팡이가 용의 꼬리처럼 회전하며 카단의 옆구리를 후려쳤다. 콰앙 하는 충격음과 함께 카단은 몸을 반 바퀴 회전시키며 타격의 원심력을 허공으로 흩뿌렸다.

마지막으로 레오나르가 공중으로 솟구쳐 오르며 ‘낙천벽’의 궤적으로 지팡이를 내리꽂았다. 단순한 내려치기였지만 거대한 산봉우리가 통째로 쏟아져 내리는 듯한 엄청난 괴력이 실려 있었다. 카단은 주저 없이 무쇠 방패를 45도 각도로 기울이며 별 호흡의 리듬을 탔다. 쾅 하는 굉음과 함께 지팡이의 타격선이 방패 곡면을 타고 허공으로 미끄러져 나갔다. 카단의 발밑 석판이 쩌적 갈라졌지만 카단의 상체는 조금도 흔들리지 않았다.

레오나르가 껄껄 웃으며 지팡이를 거두었다.

“좋다! 힘으로 맞서지 않고 자연의 결을 따라 흘려보내는 솜씨가 제법이구나. 옛 성기사단의 수호벽과 바람섬의 유려함이 한 몸에 깃들어 있어. 알렉산다르 형님이 살아서 이 모습을 보았다면 껄껄 웃으며 술잔을 기울였을 게다.”

카단이 방패를 거두며 정중하게 고개를 숙였다.

“과찬이십니다. 장군님의 지팡이는 산맥의 흐름처럼 묵직하고 정직했습니다.”"""

ep13_s4 = """레오나르는 품에서 큼직한 말린 육포 조각을 꺼내 모닥불 너머 짙은 어둠 속 바위틈을 향해 휙 던졌다.

“숨어서 훔쳐보는 놈치고 배 안 고픈 놈 없다! 나와서 주워 먹어라, 백색 화염의 애송이야!”

숲속 어둠 속에서 하얀 망토를 두른 이그니스가 모습을 드러냈다. 이그니스는 자존심이 상한 듯 입술을 깨물었지만, 며칠 동안 숲속을 방황하며 굶주린 탓에 발밑에 떨어진 육포를 조용히 챙겨 들었다.

이그니스가 떨리는 목소리로 나지막이 털어놓았다.

“황궁의 기사단에서 나는 영웅이라 불렸지만, 사실은 루시안이 조종하는 허수아비에 불과했다. 발리안 경이 내 아버지이고, 내 어머니가 그 차가운 정원에서 십팔 년 동안 물레를 돌리던 죄수였다니... 나는 도대체 무엇을 위해 검을 휘둘러 왔단 말인가.”

카단은 모닥불의 타오르는 장작을 응시하며 조용히 입을 열었다.

“스스로를 탓하지 마라, 이그니스. 네 검에 깃든 백색 화염은 루시안의 것이 아니라 네 아버지가 물려준 성기사의 영혼이다. 도망치지 않고 진실을 마주하러 온 것만으로도, 너는 이미 진정한 기사의 길에 들어선 거다.”

이그니스는 떨리는 손으로 검자루를 쥐며 고개를 떨구었다.

“카단... 너는 왜 나를 원망하지 않지? 결투 무대에서 네 어깨를 벤 것은 바로 나였다.”

카단이 은빛 단검의 붉은 매듭을 만지며 담담히 미소를 지었다.

“어깨의 상처는 아물지만, 거짓 속에 갇힌 영혼은 영원히 썩어가는 법이다. 나는 원수를 갚으러 남쪽으로 온 게 아니다. 부서진 맹세를 다시 잇기 위해 온 거지.”"""

ep13_s5 = """레오나르는 세 젊은이를 번갈아 바라보며 만족스러운 미소를 지었다.

“삼십 년 전, 바람 속삭임 섬은 대륙의 모든 지혜와 마나가 평화롭게 머물던 낙원이었다. 그러나 나인섀도우 코덱스의 어둠에 홀린 장로들이 섬의 수호탑을 장악했고, 에올루스는 딸 실리아를 지키기 위해 눈물을 머금고 섬의 결계를 폐쇄했지. 그 배신의 불씨가 결국 대륙 전체를 전쟁의 소용돌이로 몰아넣은 거다. 안개 호수의 수호자 론돌은 그 당시 장로들의 반란에 맞서다 다리 하나를 잃고 대륙으로 추방당한 충신이지.”

실리아의 눈가가 젖어 들었다.

“론돌 숙부님이... 아버지를 원망하지 않고 홀로 호수를 지키고 계셨던 건가요?”

레오나르가 녹옥 지팡이로 땅을 쿵 찍었다.

“그렇다, 아가씨. 충성스러운 자들은 말이 없는 법이지. 어서 가자, 구름돌아오는장원에서 그 늙은 사공의 술잔을 채워주어야 하지 않겠느냐!”

세 젊은이와 노장의 기묘한 동행이 그렇게 바닷바람 속에서 조용히 시작되었다. 안개 호수로 향하는 길목 위로 서늘한 밤바람이 불어왔지만, 그들의 모닥불은 꺼지지 않고 타올랐다. 새벽안개 너머로 호수의 거대한 석주들이 희미하게 자태를 드러내고 있었다."""

EP13_KO = f"# 눈히어로 13화 - 녹옥 지팡이의 주인\n\n> 원문 범위: 제25장-제26장\n\n{ep13_s1}\n\n{ep13_s2}\n\n{ep13_s3}\n\n{ep13_s4}\n\n{ep13_s5}"

EP13_EN = """SNSHero Novel
Episode 13: Master of the Jade Staff

The rugged cedar forest track winding through the coastal mountains toward the eastern sea was soaked with several days of persistent early spring rain. Dense ocean mist drifted through the towering evergreen canopy, and from the damp soil and lichen-crusted boulders rose the sharp, earthy scents of decomposing pine needles and moss. In the muffled stillness where even woodland birds fell quiet in the fog, Kadan and Cilia pressed forward toward Cloud Return Manor—the primary haven on the eastern coast and the staging point for the voyage to Whispering Wind Island. Along the verges, thawing brooks chuckled over polished pebbles, while wild mountain violets peeked through rock fissures.

Cilia extended her hand, feeling the coastal thermal drafts with her fingertips.

"The winds rolling off the sea grow increasingly turbulent. It is unmistakable proof that the barrier spires of Whispering Wind Island are fracturing, unsettling the mana balance of the coastline."

Kadan tightened his grip upon his iron shield, nodding.

"The runic devices we observed under Lucian's command in the capital were unnatural. Corrupt men seeking power are tearing the fabric of the earth."

As they crested a steep granite ridge, the scent of sizzling animal fat and the sweet woodsmoke of birch logs drifted upon the breeze.

Kadan checked his stride, shifting his shield into a ready guard.

"There is someone near. A heavy, unrefined pulse of mana radiates from beyond that clearing."

Cilia inhaled the smoke, giving a delicate sniff of disdain.

"Wild boar fat. And an utterly incompetent cook who is incinerating the exterior to charcoal. The burnt grease fills this entire mountain hollow."

In a sheltered hollow beyond the outcrop lay a massive, broad-shouldered warrior with a mane of disheveled white hair and a wild beard, snoring with the volume of rolling thunder beside a crackling fire. It was none other than General Leonar, formerly the fiercest warlord of the imperial vanguard, now living in eccentric retirement. Propped beneath his head like a rough timber pillow was the legendary Jade Staff, its translucent emerald gemstone pulsing with rhythmic ripples of sea-green luminescence. Over the flames, a heavy haunch of boar skewered upon an oak branch was charred into black carbon on the outside, while raw crimson blood dripped steadily from the uncooked center.

Cilia clicked her tongue in dismay, rolling up her sleeves as she approached the pit.

"Sacrificing such magnificent forest game to charcoal! Stand aside, old bear!"

Reaching into her herb satchel, Cilia produced dried juniper berries and wild mountain thyme, rubbing them vigorously across the meat. Conjuring a gentle vortex of warm air with her fingers, she circulated the fire's radiant heat deep into the core of the haunch. As the blackened crust flaked away and savory, amber juices sizzled against the embers, Leonar's nostrils twitched, and he sat bolt upright with a thunderous snort.

Wiping a line of drool from his gray mustache, the veteran glared with sharp, amused eyes.

"Ho! What insolent slip of a girl and her northern wood-hewn pup dare meddle with my dinner!"

Despite his bluster, Leonar snatched the savory slice of roasted pork offered upon Cilia's blade, popping it greedily into his maw. The instant his teeth sank through the crisp skin into the tender meat, his eyes widened like lanterns.

"By the gods! Crisp as winter frost outside and melting like fresh cream within! The subtle juniper cuts the grease like an imperial banquet wine!"

Devouring half the haunch in a dozen bites, Leonar reached down, hoisting the heavy Jade Staff with effortless ease. The giant emerald at its head hummed in deep resonance, sending a heavy emerald shockwave shuddering through the surrounding cedars.

The veteran's jovial expression hardened into the razor-sharp focus of a seasoned general.

"A warrior must earn his supper. Boy, raise that battered lid upon your arm. Let us see if those northern shoulders can endure the weight of the earth!"

Leonar unleashed his first technique, 'Earth Dragon Sundering.' Stamping the staff against the flagstones, the earth surged forward in concussive waves. Unfazed, Kadan angled his shield low, skimming across the seismic shock. In an instant, the Jade Staff spun like a dragon's tail, driving toward Kadan's ribs. With a resounding clash, Kadan rotated his footing, dispersing the centrifugal impact into the air.

Leaping high, Leonar brought down the staff in the crushing arc of 'Heaven Fall.' Though a straightforward downward strike, it carried the terrifying momentum of a collapsing mountain peak. Without hesitation, Kadan angled his iron shield at forty-five degrees, riding the rhythm of star-breathing. With a deafening boom, the strike glanced off the curved rim into empty space. The stone beneath Kadan's boots fractured in spiderweb fissures, yet his upper body remained unyielding.

Leonar burst into a roaring belly laugh, resting the staff across his broad shoulders.

"Splendid! To turn aside brute force along the natural grain rather than meeting it head-on... You bear the steadfast aegis of the Holy Order and the fluid grace of the Wind Isle in a single vessel. Had Brother Aleksandar lived to witness this, he would have emptied his flagon in roaring joy."

Lowering his shield, Kadan bowed with respect.

"Your praise is generous, General. The path of your staff was as honest and imposing as the mountain ridges."

Reaching into his leather tunic, Leonar withdrew a thick strip of cured venison jerky, hurling it toward the shadows of the boulders beyond the firelight.

"None who lurk in the bushes are without hunger! Step forth and eat, gilded pup of the White Flame!"

Silhouetted against the dark pines, Ignis stepped into the firelight, his white cloak spattered with woodland mud. Though his aristocratic pride flared, three days of wandering without rations compelled him to retrieve the dropped meat from the pine needles.

Ignis spoke with a trembling, heavy rasp.

"In the capital I was hailed as an immaculate champion, yet I was merely a puppet dancing on Lucian's strings. Lord Balian is my true father, and my mother was the captive woman spinning flax in that cold garden for eighteen winters... What have I been wielding my sword for all this time?"

Gazing upon the dancing sparks of the hearth, Kadan replied softly.

"Do not condemn yourself, Ignis. The white flame on your blade belongs not to Lucian, but is the noble soul bequeathed by your father. In choosing to confront the truth rather than flee from it, you have already set foot upon the true path of a knight."

Ignis lowered his head, fingers tightening upon his hilt.

"Kadan... Why do you bear no hatred toward me? It was my blade that lacerated your shoulder in the forum."

Touching the crimson ribbon bound to his silver dagger, Kadan offered a calm smile.

"A wound of the flesh mends with time, but a soul trapped in falsehood rots for eternity. I came south not to claim vengeance, but to mend the shattered vow."

Leonar looked between the three youths with a warm, approving smile.

"Thirty winters ago, Whispering Wind Island was a sanctuary of boundless wisdom. Yet Council elders seduced by the Nine Shadow Codex seized the defense spires, and Lord Aeolus wept as he sealed the barrier to protect his daughter Cilia. That betrayal ignited the continental war. The guardian Rondol lost his leg resisting that coup, choosing exile upon Mist Lake."

Tears glistened in Cilia's eyes.

"Uncle Rondol... guarded the waters all these years without holding malice toward father?"

Leonar planted his Jade Staff with a resonant thud.

"Indeed, lass. The truly loyal bear their burdens in silence. Let us march; we have an old boatman's flagon to fill at Cloud Return Manor!"

Thus began the strange fellowship of three young champions and a legendary veteran amidst the ocean gales. Chilly drafts swept the slopes toward Mist Lake, yet their hearthfire burned bright into the twilight. Beyond the morning fog, the colossal basalt pillars of the lake were slowly emerging into view."""

print("EP13 assembled. Length:", len(EP13_KO))

# ==============================================================================
# EPISODE 14
# ==============================================================================
ep14_s1 = """동해안 어귀에 드넓게 자리 잡은 안개 호수는 사시사철 자욱한 유백색 물안개에 덮여 있어 길손들의 발길을 쉬이 허락하지 않는 신비로운 곳이었다. 호수 수면 위로는 수백 길 높이의 거대한 현무암 석주 일흔두 개가 침묵의 거인처럼 우뚝 솟아 있었고, 맑은 날에도 호수 바닥에 수몰된 고대 도시의 궁전 첨탑과 부서진 아치 석교들이 에메랄드빛 물밑에서 유령처럼 어른거렸다. 물새 한 마리 날지 않는 고요한 호숫가에서, 카단과 실리아는 레오나르 장군의 안내를 받아 호수 중앙의 수상 요새인 ‘구름돌아오는장원’을 향해 조심스럽게 나아갔다. 축축한 갈대밭 사이로 서늘한 호수 바람이 불어올 때마다 갈대꽃 하얀 솜털이 눈송이처럼 허공을 맴돌았다.

카단이 물가에 멈추어 서서 수면 아래를 내려다보았다.

“호수 밑바닥에 잠겨 있는 저 거대한 석조 건축물들은 무엇인가? 마치 거대한 제국이 통째로 가라앉은 것 같군.”

레오나르가 녹옥 지팡이로 물가를 가리키며 굵직한 목소리로 설명했다.

“천 년 전, 고대 마법 문명이 번영을 누리던 ‘물의 도시 아쿠아리아’의 유적이다. 나인섀도우 코덱스의 금기된 마나가 폭주하면서 하루아침에 호수 밑으로 가라앉았지. 지금 우리가 건너야 할 일흔두 개의 석주는 그 당시 궁전들을 떠받치던 거대한 수호 기둥들이다.”"""

ep14_s2 = """호숫가 나루터의 낡은 계류장에 이르렀을 때, 실리아가 물가에 자란 갈대 풀잎 하나를 뜯어 입술에 대고 고요한 바람의 자장가를 불었다. 청아하고도 애수 어린 피리 소리가 안개 낀 수면을 타고 은은하게 퍼져 나가자, 저 멀리 짙은 안갯속에서 외노를 저으며 삐걱거리는 작은 나룻배 한 척이 모습을 드러냈다. 배 위에는 한쪽 다리를 잃고 무쇠 의족을 찬 늙은 사공이 노를 젓고 있었다. 과거 바람 속삭임 섬의 전설적인 수호자이자 항해사였던 론돌이었다.

론돌의 거친 시선이 실리아의 얼굴과 푸른 비단옷에 머물렀다. 그의 목소리는 물안개처럼 메말라 있었다.

“결국 돌아왔구나, 섬에서 도망쳤던 어린 왕녀여. 섬의 장로들은 너를 배신자라 부르며 저주하고 있는데, 무슨 낯으로 다시 이 바다를 찾았느냐?”

실리아는 흔들림 없는 당당한 눈빛으로 론돌을 바라보며 대답했다.

“어머니 실피드의 죽음에 얽힌 추악한 진실을 덮어두고 섬의 문을 걸어 잠근 것은 장로들이에요. 저는 도망친 게 아니라 어머니의 넋을 기리고 진실을 밝히러 나선 거예요, 론돌 숙부님. 숙부님 역시 그 어둠에 맞서다 다리를 잃고 쫓겨나신 게 아니었나요?”

론돌은 한참 동안 실리아의 얼굴을 말없이 응시하다가 나지막이 한숨을 내쉬며 뱃전을 두드렸다.

“올라타라. 네 당돌한 고집과 맑은 눈빛은 네 어미 실피드를 꼭 빼닮았구나.”"""

ep14_s3 = """일행을 태운 나룻배는 일흔두 개의 거대한 석주 미로를 유려하게 헤쳐 나가 마침내 거대한 수상 요새 구름돌아오는장원에 당도했다. 수백 개의 굵은 참나무 기둥으로 호수 위에 세워진 장원은 전쟁 피난민들과 고아, 부상당한 어부들의 따뜻한 안식처였다. 호수에서 건져 올린 살진 잉어를 생강과 산나물에 쪄낸 구수한 냄새가 수상 가옥마다 가득했고, 아이들의 웃음소리가 울려 퍼졌다.

장원의 주민들이 반갑게 다가와 따뜻한 보리차를 건네는 동안, 카단은 장원 중앙 회랑 벽면에 새겨진 고대 수호 마법진을 찬찬히 살펴보았다. 그것은 단순한 벽화가 아니라 적의 공격을 호수의 수압으로 분산시키는 정교한 방어 전술도였다. 발리안 숙부의 수호 진법과 일맥상통하는 원리였다.

카단이 벽화를 가리키며 론돌에게 물었다.

“이 방어 진법은 북방 성기사단의 ‘대지 완충 진’과 형태가 놀라울 정도로 흡사합니다. 두 기예가 본래 하나의 뿌리에서 나온 것입니까?”

론돌이 막걸리 사발을 들이켜며 고개를 끄덕였다.

“날카로운 눈을 가졌구나, 청년. 백 년 전 발리안 경의 선대 성기사들과 우리 바람섬의 장인들이 함께 완성한 수호 진법이다. 방패는 막는 무기가 아니라 대지와 바다의 품으로 충격을 돌려보내는 문이라는 뜻이지.”"""

ep14_s4 = """그때 호수 깊은 곳에서 거대한 물살이 소용돌이치며 비명과 함께 장원의 경종이 요란하게 울려 퍼졌다. 메두사 고르고의 암흑 마나에 오염된 거대한 심연의 수룡 세 마리가 수상 가옥의 받침 기둥들을 들이받으며 습격해 온 것이었다. 기둥들이 부러져 나가며 부두가 기울어졌다. 거대한 뱀의 비늘 사이로 검붉은 부식액이 뿜어져 나와 참나무 갑판을 녹여 내렸다.

론돌이 무쇠 의족을 굴러 호수 표면에 거대한 소용돌이를 일으켰고, 실리아는 허공으로 도약해 날카로운 질풍의 화살들을 퍼부었다. 카단은 기우는 부두 끝으로 달려가 무쇠 방패를 내리찍으며 수면에 거대한 서리의 얼음 다리를 펼쳤다.

“주민들은 얼음 다리를 건너 본채로 대피하십시오! 아이들을 먼저 챙기세요!”

피난민들이 얼음 다리를 타고 안전하게 대피하는 사이, 뒤늦게 비에 젖은 채 부두에 도착한 이그니스가 칼을 뽑아 들었다.

이그니스의 검끝에서 터져 나온 백색 화염이 호수 위를 가르며 수룡의 목을 단숨에 베어 넘겼다. 순백의 화염이 타오르며 호수의 물안개를 하얗게 증발시켰다. 물과 불, 서리와 바람이 처음으로 완벽한 하모니를 이루며 호수의 위기를 막아낸 순간이었다."""

ep14_s5 = """수룡들이 호수 밑바닥으로 가라앉고 잔잔한 물결이 돌아왔을 때, 부두 위에는 거친 숨소리만이 감돌았다. 온몸이 흠뻑 젖은 이그니스는 거친 숨을 몰아쉬며 피 묻은 칼날을 거두었다.

론돌이 다가와 거친 아마포 수건과 김이 모락모락 피어오르는 뜨거운 잉어 수프 한 그릇을 묵묵히 이그니스에게 내밀었다.

“황궁의 도련님치고는 제법 쓸 만한 칼솜씨로군. 몸이 젖었으니 수건으로 닦고 뜨거운 국물이나 들이켜라.”

이그니스는 당황한 듯 그릇을 바라보며 중얼거렸다.

“나는 황궁의 기사다. 천한 어부들의 보살핌 따위는...”

론돌이 껄껄 웃으며 이그니스의 어깨를 툭 쳤다.

“사람이 사람에게 따뜻한 밥을 건네는 데 신분이 무슨 상관이냐? 마셔라, 식으면 맛없다.”

이그니스는 조용히 그릇을 받아 들고 국물을 들이켰다. 생강 향이 어우러진 뜨거운 국물이 목을 타고 넘어가자, 이그니스의 얼어붙었던 어깨가 서서히 풀리기 시작했다. 부두 너머로 밤하늘의 별빛이 호수 수면에 은빛 비늘처럼 반짝이고 있었다."""

ep14_ko = f"# 눈히어로 14화 - 안개 호수의 손님들\n\n> 원문 범위: 제27장-제28장\n\n{ep14_s1}\n\n{ep14_s2}\n\n{ep14_s3}\n\n{ep14_s4}\n\n{ep14_s5}"

ep14_en = """SNSHero Novel
Episode 14: Guests of Mist Lake

Sprawling broad and tranquil at the estuary of the eastern coast, Mist Lake remained cloaked year-round in dense, milk-white vapor, seldom granting passage to wandering strangers. Above the mirrored surface rose seventy-two colossal basalt pillars like silent stone titans, their summits vanishing into the low-hanging clouds. Even on fair days, the sunken spires, flooded palaces, and fractured stone bridges of an ancient drowned city flickered like ghosts beneath the emerald depths. Guided by General Leonar, Kadan and Cilia navigated the reed banks toward the floating stilt citadel at the lake's core: Cloud Return Manor. As chilly drafts brushed the reeds, fluffy white tufts drifted into the air like winter flurries.

Kadan paused at the water's edge, gazing down through the clear surface.

"What are those monumental stone complexes resting beneath the lakebed? It appears as though an entire imperial city was drowned whole."

Leonar indicated the flooded ruins with his Jade Staff, explaining with deep resonance.

"A thousand winters ago, that was Aquaria, jewel of the ancient water mages. When forbidden sorceries of the Nine Shadow Codex ran wild, it vanished beneath the waves in a single night. The seventy-two basalt pillars we must cross today were the great foundation piers supporting those ancient palaces."

Reaching a weathered timber jetty at the water's edge, Cilia plucked a slender reed, resting it against her lips to play a tranquil wind lullaby. As the pure, mournful notes drifted across the fog-bound waters, a lone wooden skiff creaked out from the vapor, propelled by the steady rhythm of a single oar. Standing at the helm was an aged boatman with a weathered visage, balancing upon an iron peg-leg. It was Rondol, the legendary navigator and former guardian of Whispering Wind Island.

Rondol's stern gaze settled upon Cilia's face and her teal silk traveling robes. His voice was dry as autumn reeds.

"So the stray bird finally returns to the ocean shores. The elders of the Council brand you a traitor and a curse; with what face do you seek passage to the sea?"

Meeting his gaze without shrinking, Cilia replied with unwavering clarity.

"It was the elders who locked the gates and buried the truth behind my mother Silphid's death. I did not flee from duty; I ventured forth to unearth the truth and honor her soul, Uncle Rondol. Did you not also sacrifice your leg resisting that shadow coup before being driven into exile?"

Rondol searched her eyes in silence for several heartbeats, then let out a low, weary sigh, tapping the gunwale with his oar.

"Step aboard. That fierce resolve and piercing honesty are the spitting image of your mother Silphid."

Carrying the travelers, the skiff wound effortlessly through the labyrinth of the seventy-two basalt pillars, arriving at the sprawling palisades of Cloud Return Manor. Built upon hundreds of massive oak piles driven into the lakebed, the manor served as a sanctuary for displaced war refugees, orphans, and crippled fishermen. From the cooking sheds rose the savory aroma of lake carp steamed with ginger and wild scallions, mingling with the laughter of children playing on the timber boardwalks.

While welcoming villagers offered bowls of steaming barley tea, Kadan studied the intricate defensive diagrams carved into the manor's central hall walls. They were not mere ornamental frescoes, but precise tactical blueprints detailing how incoming kinetic impacts could be dispersed across the lake's hydraulic pressure—a principle identical to the defensive treatises of Uncle Balian.

Kadan pointed toward the diagrams, speaking to Rondol.

"These barrier circuits bear an astonishing resemblance to the Earth Dispersion formations of the Northern Holy Knights. Did both martial traditions originate from a common root?"

Rondol took a hearty sip of fermented rice wine, nodding slowly.

"You possess keen eyes, lad. A century ago, Lord Balian's ancestral forebears and our master artisans forged these arts together. A shield is not merely an iron door to stop blows, but an open gate redirecting force back into the embrace of earth and sea."

Suddenly, violent currents roiled from the depths, and alarm bells began to chime frantically across the boardwalks. Corrupted by the necrotic mana of Medusa Gorgo, three massive abyssal water serpents surged from the sunken city, smashing their horned snouts against the manor's foundation pilings. Oak posts groaned and splintered, tilting the outer pier into the surging foam as corrosive black slime sizzled across the timber decks.

Rondol stamped his iron peg-leg against the decking, summoning a defensive vortex in the water, while Cilia leaped onto a watchpost, unleashing volleys of gale-force mana arrows. Kadan sprinted to the tilting edge, driving his iron shield into the timber to project a broad causeway of reinforced frost across the churning water.

"Follow the ice path and evacuate to the central hall! Guard the children first!"

As the villagers fled across the frosty bridge to safety, Ignis strode onto the pier, drenched by the spray with blade drawn.

Arcs of pure white sanctifying flame erupted from Ignis's sword, cleaving the lead serpent's neck in a single dazzling flash. Pure white fire consumed the fiend, evaporating the lake mist into clouds of pale steam. Water, flame, frost, and gale resonated in flawless harmony for the first time, shattering the fiends and preserving the sanctuary.

As the slain beasts sank into the murky depths and the lake regained its calm, only ragged breathing echoed upon the drenched jetty. Drenched from head to foot, Ignis wiped his blade clean, his shoulders heaving with exhaustion.

Rondol stepped forward, holding out a rough linen towel and a steaming bowl of carp broth.

"For a gilded courtling, your steel carries respectable weight. Dry your skin and warm your belly with this hot broth."

Ignis blinked in confusion, murmuring awkwardly.

"I am a knight of the imperial host. I have no need for charity from common fishermen..."

Rondol roared with laughter, clapping a heavy hand upon Ignis's pauldron.

"What does station matter when one mortal passes warm bread to another? Drink it down before it turns cold."

Ignis accepted the bowl, sipping the fragrant, ginger-laced broth. As the soothing warmth coursed through his chilled limbs, the rigid tension in his shoulders finally began to soften. Beyond the pier, the midnight stars shimmered across the lake's surface like scattered silver scales."""

print("EP14 assembled. Length:", len(ep14_ko))

# Expand EP14 to reach ~3,850
ep14_s1_exp = """동해안 어귀에 드넓게 자리 잡은 안개 호수는 사시사철 자욱한 유백색 물안개에 덮여 있어 길손들의 발길을 쉬이 허락하지 않는 신비로운 곳이었다. 호수 수면 위로는 수백 길 높이의 거대한 현무암 석주 일흔두 개가 침묵의 거인처럼 우뚝 솟아 있었고, 맑은 날에도 호수 바닥에 수몰된 고대 도시의 궁전 첨탑과 부서진 아치 석교들이 에메랄드빛 물밑에서 유령처럼 어른거렸다. 물새 한 마리 날지 않는 고요한 호숫가에서, 카단과 실리아는 레오나르 장군의 안내를 받아 호수 중앙의 수상 요새인 ‘구름돌아오는장원’을 향해 조심스럽게 나아갔다. 축축한 갈대밭 사이로 서늘한 호수 바람이 불어올 때마다 갈대꽃 하얀 솜털이 눈송이처럼 허공을 맴돌았다.

카단이 물가에 멈추어 서서 수면 아래를 내려다보았다.

“호수 밑바닥에 잠겨 있는 저 거대한 석조 건축물들은 무엇인가? 마치 거대한 제국이 통째로 가라앉은 것 같군.”

실리아가 수면에 손을 담그며 나지막이 속삭였다.

“수몰된 종탑들이 물속에서 미세한 마나의 파동을 보내고 있어요. 물의 정령들이 여전히 저 아래에서 잠들어 있는 거예요.”

레오나르가 녹옥 지팡이로 물가를 가리키며 굵직한 목소리로 설명했다.

“천 년 전, 고대 마법 문명이 번영을 누리던 ‘물의 도시 아쿠아리아’의 유적이다. 나인섀도우 코덱스의 금기된 마나가 폭주하면서 하루아침에 호수 밑으로 가라앉았지. 지금 우리가 건너야 할 일흔두 개의 석주는 그 당시 궁전들을 떠받치던 거대한 수호 기둥들이다.”"""

ep14_s3_exp = """일행을 태운 나룻배는 일흔두 개의 거대한 석주 미로를 유려하게 헤쳐 나가 마침내 거대한 수상 요새 구름돌아오는장원에 당도했다. 수백 개의 굵은 참나무 기둥으로 호수 위에 세워진 장원은 전쟁 피난민들과 고아, 부상당한 어부들의 따뜻한 안식처였다. 호수에서 건져 올린 살진 잉어를 생강과 산나물에 쪄낸 구수한 냄새가 수상 가옥마다 가득했고, 아이들의 웃음소리가 울려 퍼졌다. 부두 한편에서는 늙은 드워프 대장장이가 화덕을 피우며 부러진 작살과 그물을 손질하고 있었다.

장원의 주민들이 반갑게 다가와 따뜻한 보리차와 찐 감자를 건네는 동안, 카단은 장원 중앙 회랑 벽면에 새겨진 고대 수호 마법진을 찬찬히 살펴보았다. 그것은 단순한 벽화가 아니라 적의 공격을 호수의 수압으로 분산시키는 정교한 방어 전술도였다. 발리안 숙부의 수호 진법과 일맥상통하는 원리였다.

카단이 벽화를 가리키며 론돌에게 물었다.

“이 방어 진법은 북방 성기사단의 ‘대지 완충 진’과 형태가 놀라울 정도로 흡사합니다. 두 기예가 본래 하나의 뿌리에서 나온 것입니까?”

론돌이 막걸리 사발을 들이켜며 고개를 끄덕였다.

“날카로운 눈을 가졌구나, 청년. 백 년 전 발리안 경의 선대 성기사들과 우리 바람섬의 장인들이 함께 완성한 수호 진법이다. 방패는 막는 무기가 아니라 대지와 바다의 품으로 충격을 돌려보내는 문이라는 뜻이지.”

실리아가 따뜻한 잉어 찜을 접시에 담아 카단에게 건넸다.

“북방의 추운 툰드라에서는 맛보지 못했던 신선한 민물고기예요. 많이 먹어둬요, 카단.”"""

ep14_s4_exp = """그때 호수 깊은 곳에서 거대한 물살이 소용돌이치며 비명과 함께 장원의 경종이 요란하게 울려 퍼졌다. 메두사 고르고의 암흑 마나에 오염된 거대한 심연의 수룡 세 마리가 수상 가옥의 받침 기둥들을 들이받으며 습격해 온 것이었다. 기둥들이 부러져 나가며 부두가 기울어졌다. 거대한 뱀의 비늘 사이로 검붉은 부식액이 뿜어져 나와 참나무 갑판을 녹여 내렸다. 주민들이 비명을 지르며 우왕좌왕 흩어졌다.

론돌이 무쇠 의족을 굴러 호수 표면에 거대한 소용돌이를 일으켰고, 실리아는 허공으로 도약해 날카로운 질풍의 화살들을 퍼부었다. 질풍 화살이 수룡의 비늘 틈새를 꿰뚫자 괴물이 거대한 꼬리를 휘둘러 부두 본채를 부수려 했다.

카단은 기우는 부두 끝으로 달려가 무쇠 방패를 내리찍으며 수면에 거대한 서리의 얼음 다리를 펼쳤다.

“주민들은 얼음 다리를 건너 본채로 대피하십시오! 아이들을 먼저 챙기세요!”

피난민들이 얼음 다리를 타고 안전하게 대피하는 사이, 뒤늦게 비에 젖은 채 부두에 도착한 이그니스가 칼을 뽑아 들었다.

이그니스의 검끝에서 터져 나온 백색 화염이 호수 위를 가르며 수룡의 목을 단숨에 베어 넘겼다. 순백의 화염이 타오르며 호수의 물안개를 하얗게 증발시켰다. 물과 불, 서리와 바람이 처음으로 완벽한 하모니를 이루며 호수의 위기를 막아낸 순간이었다."""

EP14_KO = f"# 눈히어로 14화 - 안개 호수의 손님들\n\n> 원문 범위: 제27장-제28장\n\n{ep14_s1_exp}\n\n{ep14_s2}\n\n{ep14_s3_exp}\n\n{ep14_s4_exp}\n\n{ep14_s5}"

print("EP14 expanded length:", len(EP14_KO))
