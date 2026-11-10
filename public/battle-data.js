/**
 * 백화영웅전: 마스터 검희 크로니클즈 (Hyakka Heroes: Master Chronicles)
 * G123 《백화요란 마스터 사무라이 크로니클즈》 클린룸(Clean-Room) 역설계 마스터 테이블 & 12개국 다국어 팩
 * 100% SNSHero 자체 에셋 및 LocalStorage 단일 진실 공급원 기반
 */
window.RYORAN_DATA = (() => {
  const I18N = {
    ko: {
      gameTitle: '백화영웅전: 마스터 검희 크로니클즈',
      subTitle: 'G123 스타일 클린룸 방치형 검희 액션 RPG',
      tapHint: '전장을 터치하여 마스터 「진·검기 일섬」 방출!',
      wave: '웨이브',
      bossBattle: '보스 결전',
      challengeBoss: '보스 도전',
      autoBoss: '보스 자동',
      speed: '배속',
      autoUlt: '자동 오의',
      afkChest: '방치 보물함',
      quickSweep: '2시간 고속소탕',
      towerBtn: '천수각 무한탑',
      tabBattle: '전장',
      tabMaidens: '검희·편성',
      tabSwords: '명검·천수각',
      tabBonds: '인연·교감',
      tabSummon: '백화소환',
      gold: '금화',
      gems: '홍옥',
      scrolls: '소환부',
      combatPower: '총 전투력',
      masterTitle: '마스터 검기 수련 · 카단',
      masterDesc: '마스터 레벨 상승 시 터치 검기 피해량 증폭 및 모든 검희의 최대 레벨 상한 해방!',
      lvUp: '수련 +1',
      lvUp10: '연속 +10',
      deployed: '출진중',
      deploy: '출진 편성',
      remove: '편성 해제',
      starUp: '★각성',
      skinBtn: '의상 각성',
      forgeBtn: '명검 단조',
      equipBtn: '장착',
      equipped: '장착중',
      bondGiftTea: '명차 진상',
      bondGiftFlower: '백화 선물',
      bondTouch: '교감 대화',
      summonFree: '일일 무료 소환',
      summon1: '1회 소환',
      summon10: '10연속 백화소환',
      pityLabel: '신화(SSR) 확정 천장까지',
      claim: '수령하기',
      close: '닫기',
      resonance: '오행 검진 공명',
      dpsLabel: '실시간 화력',
      towerChallenge: '층 돌파 도전',
      saveSafe: 'LocalStorage 실시간 영구 보존중'
    },
    en: {
      gameTitle: 'Hyakka Heroes: Master Samurai',
      subTitle: 'Clean-Room HTML5 Idle Action RPG',
      tapHint: 'Tap battlefield to unleash Master Spirit Slash!',
      wave: 'WAVE',
      bossBattle: 'BOSS DUEL',
      challengeBoss: 'BOSS FIGHT',
      autoBoss: 'AUTO BOSS',
      speed: 'SPD',
      autoUlt: 'AUTO ULT',
      afkChest: 'AFK Chest',
      quickSweep: '2h Quick Sweep',
      towerBtn: 'Infinity Pagoda',
      tabBattle: 'Battle',
      tabMaidens: 'Maidens',
      tabSwords: 'Blades·Tower',
      tabBonds: 'Bonds',
      tabSummon: 'Summon',
      gold: 'Gold',
      gems: 'Rubies',
      scrolls: 'Scrolls',
      combatPower: 'Squad CP',
      masterTitle: 'Master Spirit Arts · Kadan',
      masterDesc: 'Leveling up Master boosts Tap Slash DMG & raises Level Cap of all Sword Maidens!',
      lvUp: 'Train +1',
      lvUp10: 'Train +10',
      deployed: 'Deployed',
      deploy: 'Deploy',
      remove: 'Bench',
      starUp: '★Awaken',
      skinBtn: 'Costume',
      forgeBtn: 'Forge',
      equipBtn: 'Equip',
      equipped: 'Equipped',
      bondGiftTea: 'Gift Tea',
      bondGiftFlower: 'Gift Blossom',
      bondTouch: 'Interact',
      summonFree: 'Daily Free Pull',
      summon1: 'Summon x1',
      summon10: 'Summon x10',
      pityLabel: 'Until Guaranteed SSR',
      claim: 'Claim Rewards',
      close: 'Close',
      resonance: 'Elemental Resonance',
      dpsLabel: 'Live DPS',
      towerChallenge: 'Challenge Floor',
      saveSafe: '100% LocalStorage Synced'
    },
    ja: {
      gameTitle: '百花英雄伝：マスター剣姫クロニクル',
      subTitle: 'G123風クリーンルーム放置系剣姫RPG',
      tapHint: '画面タップでマスター「真・剣気一閃」発動！',
      wave: 'WAVE',
      bossBattle: 'ボス決戦',
      challengeBoss: 'ボス挑戦',
      autoBoss: '自動挑戦',
      speed: '倍速',
      autoUlt: '自動奥義',
      afkChest: '放置宝箱',
      quickSweep: '2時間高速掃討',
      towerBtn: '天守閣無限塔',
      tabBattle: '戦場',
      tabMaidens: '剣姫・編成',
      tabSwords: '名刀・無限塔',
      tabBonds: '絆・交流',
      tabSummon: '百花召喚',
      gold: '金貨',
      gems: '紅玉',
      scrolls: '召喚符',
      combatPower: '総戦力',
      masterTitle: 'マスター剣気修練・カダン',
      masterDesc: 'マスターLv上昇でタップ剣気威力増加＆全剣姫のレベル上限解放！',
      lvUp: '修練 +1',
      lvUp10: '連続 +10',
      deployed: '出陣中',
      deploy: '出陣編成',
      remove: '編成解除',
      starUp: '★覚醒',
      skinBtn: '衣装覚醒',
      forgeBtn: '名刀鍛造',
      equipBtn: '装備',
      equipped: '装備中',
      bondGiftTea: '銘茶を贈る',
      bondGiftFlower: '百花を贈る',
      bondTouch: '触れ合い',
      summonFree: '毎日無料召喚',
      summon1: '1回召喚',
      summon10: '10連百花召喚',
      pityLabel: '神話(SSR)確定天井まで',
      claim: '受け取る',
      close: '閉じる',
      resonance: '五行陣形共鳴',
      dpsLabel: '秒間ダメージ',
      towerChallenge: '階層突破挑戦',
      saveSafe: 'LocalStorage自動保存中'
    },
    'zh-CN': {
      gameTitle: '百花英雄传：剑姬编年史',
      subTitle: 'G123风格放置剑姬动作RPG',
      tapHint: '点击战场释放宗师「真·剑气一闪」！',
      wave: '波次', bossBattle: '首领决战', challengeBoss: '挑战首领', autoBoss: '自动首领',
      speed: '倍速', autoUlt: '自动奥义', afkChest: '挂机宝箱', quickSweep: '2小时扫荡', towerBtn: '千守阁无限塔',
      tabBattle: '战场', tabMaidens: '剑姬·编队', tabSwords: '名刀·无限塔', tabBonds: '羁绊·互动', tabSummon: '百花召唤',
      gold: '金币', gems: '红玉', scrolls: '召唤符', combatPower: '总战力',
      masterTitle: '宗师剑气修炼 · 卡丹', masterDesc: '提升宗师等级可增强点击剑气伤害并解锁全体剑姬等级上限！',
      lvUp: '升级 +1', lvUp10: '连升 +10', deployed: '出战中', deploy: '编入队伍', remove: '卸下',
      starUp: '★觉醒', skinBtn: '衣装觉醒', forgeBtn: '名刀锻造', equipBtn: '装备', equipped: '已装备',
      bondGiftTea: '赠予名茶', bondGiftFlower: '赠予百花', bondTouch: '互动交谈',
      summonFree: '每日免费召唤', summon1: '召唤1次', summon10: '10连百花召唤', pityLabel: '距离SSR保底',
      claim: '领取奖励', close: '关闭', resonance: '五行剑阵共鸣', dpsLabel: '实时秒伤', towerChallenge: '挑战本层', saveSafe: '本地存储实时同步'
    },
    'zh-TW': {
      gameTitle: '百花英雄傳：劍姬編年史',
      subTitle: 'G123風格放置劍姬動作RPG',
      tapHint: '點擊戰場釋放宗師「真·劍氣一閃」！',
      wave: '波次', bossBattle: '首領決戰', challengeBoss: '挑戰首領', autoBoss: '自動首領',
      speed: '倍速', autoUlt: '自動奧義', afkChest: '放置寶箱', quickSweep: '2小時掃蕩', towerBtn: '千守閣無限塔',
      tabBattle: '戰場', tabMaidens: '劍姬·編隊', tabSwords: '名刀·無限塔', tabBonds: '羈絆·互動', tabSummon: '百花召喚',
      gold: '金幣', gems: '紅玉', scrolls: '召喚符', combatPower: '總戰力',
      masterTitle: '宗師劍氣修煉 · 卡丹', masterDesc: '提升宗師等級可增強點擊劍氣傷害並解鎖全體劍姬等級上限！',
      lvUp: '升級 +1', lvUp10: '連升 +10', deployed: '出戰中', deploy: '編入隊伍', remove: '卸下',
      starUp: '★覺醒', skinBtn: '衣裝覺醒', forgeBtn: '名刀鍛造', equipBtn: '裝備', equipped: '已裝備',
      bondGiftTea: '贈予名茶', bondGiftFlower: '贈予百花', bondTouch: '互動交談',
      summonFree: '每日免費召喚', summon1: '召喚1次', summon10: '10連百花召喚', pityLabel: '距離SSR保底',
      claim: '領取獎勵', close: '關閉', resonance: '五行劍陣共鳴', dpsLabel: '即時秒傷', towerChallenge: '挑戰本層', saveSafe: '本地儲存即時同步'
    },
    de: {
      gameTitle: 'Hyakka Heroes: Schwertmaiden', subTitle: 'Clean-Room HTML5 Idle Action RPG',
      tapHint: 'Tippe aufs Schlachtfeld für Meister-Geisterschnitt!', wave: 'WELLE', bossBattle: 'BOSSKAMPF', challengeBoss: 'BOSS', autoBoss: 'AUTO-BOSS',
      speed: 'TEMPO', autoUlt: 'AUTO-ULT', afkChest: 'Idle-Truhe', quickSweep: '2h Blitzbeute', towerBtn: 'Endlosturm',
      tabBattle: 'Kampf', tabMaidens: 'Maiden', tabSwords: 'Klingen', tabBonds: 'Bande', tabSummon: 'Ruf',
      gold: 'Gold', gems: 'Rubine', scrolls: 'Rollen', combatPower: 'Kampfkraft',
      masterTitle: 'Meister-Schwertkunst · Kadan', masterDesc: 'Meister-Stufe erhöht Tipp-Schaden & das Level-Limit aller Schwertmaiden!',
      lvUp: 'Lv +1', lvUp10: 'Lv +10', deployed: 'Aktiv', deploy: 'Einsetzen', remove: 'Ablegen',
      starUp: '★Erwecken', skinBtn: 'Kostüm', forgeBtn: 'Schmieden', equipBtn: 'Anlegen', equipped: 'Angelegt',
      bondGiftTea: 'Tee schenken', bondGiftFlower: 'Blüte schenken', bondTouch: 'Dialog',
      summonFree: 'Gratis-Ruf', summon1: '1x Ruf', summon10: '10x Ruf', pityLabel: 'Bis SSR-Garantie',
      claim: 'Abholen', close: 'Schließen', resonance: 'Element-Resonanz', dpsLabel: 'DPS', towerChallenge: 'Etage starten', saveSafe: 'LocalStorage aktiv'
    },
    es: {
      gameTitle: 'Hyakka Heroes: Crónicas Samurai', subTitle: 'RPG Idle de Acción HTML5',
      tapHint: '¡Toca el campo para lanzar Corte Espiritual!', wave: 'OLEADA', bossBattle: 'JEFE', challengeBoss: 'RETAR JEFE', autoBoss: 'AUTO JEFE',
      speed: 'VEL', autoUlt: 'AUTO ULT', afkChest: 'Cofre AFK', quickSweep: 'Barrido 2h', towerBtn: 'Pagoda Infinita',
      tabBattle: 'Batalla', tabMaidens: 'Doncellas', tabSwords: 'Espadas', tabBonds: 'Vínculos', tabSummon: 'Invocar',
      gold: 'Oro', gems: 'Rubíes', scrolls: 'Pergaminos', combatPower: 'Poder Total',
      masterTitle: 'Arte Maestro · Kadan', masterDesc: '¡Subir al Maestro aumenta el Corte táctil y el límite de nivel del escuadrón!',
      lvUp: 'Nv +1', lvUp10: 'Nv +10', deployed: 'En grupo', deploy: 'Desplegar', remove: 'Quitar',
      starUp: '★Despertar', skinBtn: 'Atuendo', forgeBtn: 'Forjar', equipBtn: 'Equipar', equipped: 'Equipado',
      bondGiftTea: 'Dar Té', bondGiftFlower: 'Dar Flor', bondTouch: 'Charlar',
      summonFree: 'Invocación Gratis', summon1: 'Invocar x1', summon10: 'Invocar x10', pityLabel: 'Para SSR Seguro',
      claim: 'Reclamar', close: 'Cerrar', resonance: 'Resonancia Elemental', dpsLabel: 'DPS', towerChallenge: 'Retar Piso', saveSafe: 'LocalStorage Guardado'
    },
    fr: {
      gameTitle: 'Hyakka Heroes: Chroniques Samouraï', subTitle: 'RPG Idle Action HTML5',
      tapHint: 'Touchez le champ de bataille pour Tranchant Spirituel !', wave: 'VAGUE', bossBattle: 'DUEL BOSS', challengeBoss: 'DÉFI BOSS', autoBoss: 'AUTO BOSS',
      speed: 'VIT', autoUlt: 'AUTO ULT', afkChest: 'Coffre AFK', quickSweep: 'Butin 2h', towerBtn: 'Pagode Infinie',
      tabBattle: 'Combat', tabMaidens: 'Guerrières', tabSwords: 'Lames', tabBonds: 'Liens', tabSummon: 'Invoquer',
      gold: 'Or', gems: 'Rubis', scrolls: 'Parchemins', combatPower: 'Puissance',
      masterTitle: 'Maître Sabreur · Kadan', masterDesc: 'Monter le Maître augmente la frappe tactile et le niveau max des guerrières !',
      lvUp: 'Niv +1', lvUp10: 'Niv +10', deployed: 'Déployée', deploy: 'Déployer', remove: 'Retirer',
      starUp: '★Éveil', skinBtn: 'Tenue', forgeBtn: 'Forger', equipBtn: 'Équiper', equipped: 'Équipé',
      bondGiftTea: 'Offrir Thé', bondGiftFlower: 'Offrir Fleur', bondTouch: 'Dialoguer',
      summonFree: 'Tirage Gratuit', summon1: 'Invoquer x1', summon10: 'Invoquer x10', pityLabel: 'Avant SSR Garanti',
      claim: 'Récupérer', close: 'Fermer', resonance: 'Résonance Élémentaire', dpsLabel: 'DPS', towerChallenge: 'Défier Étage', saveSafe: 'LocalStorage Synchronisé'
    },
    id: {
      gameTitle: 'Hyakka Heroes: Kronik Samurai', subTitle: 'HTML5 Idle Action RPG',
      tapHint: 'Ketuk medan perang untuk Tebasan Roh Master!', wave: 'GELOMBANG', bossBattle: 'DUEL BOS', challengeBoss: 'LAWAN BOS', autoBoss: 'AUTO BOS',
      speed: 'KEC', autoUlt: 'AUTO ULT', afkChest: 'Peti AFK', quickSweep: 'Sapu 2 Jam', towerBtn: 'Pagoda Abadi',
      tabBattle: 'Tempur', tabMaidens: 'Pendekar', tabSwords: 'Pedang', tabBonds: 'Ikatan', tabSummon: 'Panggil',
      gold: 'Emas', gems: 'Rubi', scrolls: 'Gulungan', combatPower: 'Total CP',
      masterTitle: 'Latihan Master · Kadan', masterDesc: 'Level Master meningkatkan Tebasan Ketuk & batas level semua Pendekar!',
      lvUp: 'Lv +1', lvUp10: 'Lv +10', deployed: 'Aktif', deploy: 'Turunkan', remove: 'Lepas',
      starUp: '★Bangkit', skinBtn: 'Kostum', forgeBtn: 'Tempa', equipBtn: 'Pakai', equipped: 'Dipakai',
      bondGiftTea: 'Beri Teh', bondGiftFlower: 'Beri Bunga', bondTouch: 'Sapa',
      summonFree: 'Panggil Gratis', summon1: 'Panggil x1', summon10: 'Panggil x10', pityLabel: 'Menuju Jaminan SSR',
      claim: 'Klaim', close: 'Tutup', resonance: 'Resonansi Elemen', dpsLabel: 'DPS', towerChallenge: 'Tantang Lantai', saveSafe: 'Tersimpan di LocalStorage'
    },
    ru: {
      gameTitle: 'Хякка Герои: Хроники Самураев', subTitle: 'HTML5 Idle Экшен-RPG',
      tapHint: 'Нажимайте на поле боя для Духовного Рассечения!', wave: 'ВОЛНА', bossBattle: 'БОСС', challengeBoss: 'ВЫЗОВ БОССА', autoBoss: 'АВТО-БОСС',
      speed: 'СКОР', autoUlt: 'АВТО-УЛЬТ', afkChest: 'AFK Сундук', quickSweep: 'Зачистка 2ч', towerBtn: 'Пагода',
      tabBattle: 'Бой', tabMaidens: 'Девы меча', tabSwords: 'Клинки', tabBonds: 'Узы', tabSummon: 'Призыв',
      gold: 'Золото', gems: 'Рубины', scrolls: 'Свитки', combatPower: 'Мощь отряда',
      masterTitle: 'Мастер клинка · Кадан', masterDesc: 'Уровень Мастера усиливает удар касанием и повышает лимит уровней дев!',
      lvUp: 'Ур +1', lvUp10: 'Ур +10', deployed: 'В строю', deploy: 'В отряд', remove: 'Убрать',
      starUp: '★Пробудить', skinBtn: 'Наряд', forgeBtn: 'Ковать', equipBtn: 'Надеть', equipped: 'Надето',
      bondGiftTea: 'Подарить чай', bondGiftFlower: 'Подарить цветок', bondTouch: 'Беседа',
      summonFree: 'Бесплатный призыв', summon1: 'Призыв x1', summon10: 'Призыв x10', pityLabel: 'До гаранта SSR',
      claim: 'Забрать', close: 'Закрыть', resonance: 'Резонанс стихий', dpsLabel: 'УВС', towerChallenge: 'Штурм этажа', saveSafe: 'LocalStorage сохранен'
    },
    th: {
      gameTitle: 'ฮยัคคะฮีโร่ส์: ตำนานสาวน้อยซามูไร', subTitle: 'เกมเว็บ Idle Action RPG',
      tapHint: 'แตะสนามรบเพื่อปล่อยคลื่นดาบจิตวิญญาณ!', wave: 'เวฟ', bossBattle: 'ศึกบอส', challengeBoss: 'ท้าดวลบอส', autoBoss: 'บอสออโต้',
      speed: 'ความเร็ว', autoUlt: 'ออโต้อัลติ', afkChest: 'หีบบอท', quickSweep: 'กวาดล้าง 2 ชม.', towerBtn: 'หอคอยไร้สิ้นสุด',
      tabBattle: 'สนามรบ', tabMaidens: 'จัดทัพ', tabSwords: 'ศาสตรา', tabBonds: 'สายสัมพันธ์', tabSummon: 'อัญเชิญ',
      gold: 'ทอง', gems: 'ทับทิม', scrolls: 'ยันต์อัญเชิญ', combatPower: 'พลังรบรวม',
      masterTitle: 'ฝึกวิชาปรมาจารย์ · คาดัน', masterDesc: 'อัปเลเวลมาสเตอร์เพื่อเพิ่มพลังดาบแตะจอและปลดเพดานเลเวลสาวนักดาบ!',
      lvUp: 'อัป +1', lvUp10: 'อัป +10', deployed: 'ออกรบ', deploy: 'จัดลงทีม', remove: 'ถอดออก',
      starUp: '★ปลุกพลัง', skinBtn: 'คอสตูม', forgeBtn: 'ตีดาบ', equipBtn: 'สวมใส่', equipped: 'สวมใส่แล้ว',
      bondGiftTea: 'มอบชาชั้นเลิศ', bondGiftFlower: 'มอบบุปผา', bondTouch: 'พูดคุย',
      summonFree: 'อัญเชิญฟรีรายวัน', summon1: 'อัญเชิญ x1', summon10: 'อัญเชิญ x10', pityLabel: 'การันตี SSR ในอีก',
      claim: 'รับรางวัล', close: 'ปิด', resonance: 'เรโซแนนซ์ธาตุ', dpsLabel: 'DPS', towerChallenge: 'ท้าทายชั้นนี้', saveSafe: 'บันทึก LocalStorage อัตโนมัติ'
    },
    vi: {
      gameTitle: 'Bách Hoa Anh Hùng: Kiếm Cơ Biên Niên Sử', subTitle: 'Webgame Nhập Vai Nhàn Rỗi HTML5',
      tapHint: 'Chạm chiến trường để tung Chân·Kiếm Khí Nhất Thiểm!', wave: 'ĐỢT', bossBattle: 'QUYẾT ĐẤU BOSS', challengeBoss: 'KHIÊU CHIẾN', autoBoss: 'TỰ ĐÁNH BOSS',
      speed: 'TỐC ĐỘ', autoUlt: 'TỰ NỘ', afkChest: 'Rương AFK', quickSweep: 'Càn Quét 2h', towerBtn: 'Thiên Thủ Các',
      tabBattle: 'Chiến Trường', tabMaidens: 'Kiếm Cơ', tabSwords: 'Danh Kiếm', tabBonds: 'Duyên Phận', tabSummon: 'Triệu Hồi',
      gold: 'Vàng', gems: 'Hồng Ngọc', scrolls: 'Bùa Triệu', combatPower: 'Tổng Lực Chiến',
      masterTitle: 'Tu Luyện Tông Sư · Kadan', masterDesc: 'Tăng cấp Tông Sư giúp tăng sát thương chạm và mở giới hạn cấp mọi Kiếm Cơ!',
      lvUp: 'Cấp +1', lvUp10: 'Cấp +10', deployed: 'Xuất trận', deploy: 'Ra trận', remove: 'Rút lui',
      starUp: '★Thức Tỉnh', skinBtn: 'Y Phục', forgeBtn: 'Rèn Kiếm', equipBtn: 'Trang Bị', equipped: 'Đang Dùng',
      bondGiftTea: 'Tặng Trà Quý', bondGiftFlower: 'Tặng Bách Hoa', bondTouch: 'Trò Chuyện',
      summonFree: 'Triệu Hồi Miễn Phí', summon1: 'Triệu Hồi x1', summon10: 'Triệu Hồi x10', pityLabel: 'Đến Mốc SSR Chắc Chắn',
      claim: 'Nhận Thưởng', close: 'Đóng', resonance: 'Cộng Hưởng Ngũ Hành', dpsLabel: 'DPS', towerChallenge: 'Khiêu Chiến Tầng', saveSafe: 'Đã lưu LocalStorage'
    }
  };

  const ELEMENTS = {
    water: { id: 'water', ko: '수(水)', en: 'Water', color: '#38bdf8', glow: 'rgba(56,189,248,0.45)' },
    fire:  { id: 'fire',  ko: '화(火)', en: 'Fire',  color: '#fb7185', glow: 'rgba(251,113,133,0.45)' },
    wind:  { id: 'wind',  ko: '풍(風)', en: 'Wind',  color: '#34d399', glow: 'rgba(52,211,153,0.45)' },
    earth: { id: 'earth', ko: '지(地)', en: 'Earth', color: '#fbbf24', glow: 'rgba(251,191,36,0.45)' },
    light: { id: 'light', ko: '성(聖)', en: 'Light', color: '#fde047', glow: 'rgba(253,224,71,0.5)' },
    dark:  { id: 'dark',  ko: '암(闇)', en: 'Dark',  color: '#c084fc', glow: 'rgba(192,132,252,0.45)' }
  };

  const SKINS = [
    { id: 0, ko: '기본 검희복', en: 'Master Standard', bonusAtk: 0,    costGems: 0,   tint: 'none', badge: '기본' },
    { id: 1, ko: '백화 연회복', en: 'Sakura Banquet',  bonusAtk: 0.15, costGems: 300, tint: 'drop-shadow(0 0 8px #f472b6)', badge: 'ATK +15%' },
    { id: 2, ko: '홍련 결전장복', en: 'Crimson War',   bonusAtk: 0.35, costGems: 650, tint: 'drop-shadow(0 0 10px #fb7185) saturate(1.18)', badge: 'ATK +35%' },
    { id: 3, ko: '월하 신화예복', en: 'Moonlight Myth', bonusAtk: 0.70, costGems: 1200, tint: 'drop-shadow(0 0 12px #facc15) saturate(1.25)', badge: 'ATK +70%' }
  ];

  const MAIDENS = [
    // SSR (6)
    {
      id: 'celia', rarity: 'SSR', elem: 'wind', row: 'front',
      nameKo: '실리아', nameEn: 'Celia', titleKo: '천풍의 백화검성',
      skillKo: '천풍백화·신검일섬', skillEn: 'Celestial Gale Blossom',
      skillMult: 6.2, atkBase: 165, hpBase: 1350, spd: 1.25,
      cutout: '/anime-character-sheets/cutouts/062_Celia.png',
      seat: '/seat/Celia.png', atkSprite: '/seat_attack/Celia.png', bust: '/anime-character-sheets/busts/062_bust.jpg',
      lines: [
        '마스터의 검기가 부르는 곳이라면, 폭풍 끝까지 함께하겠어요.',
        '바람섬에 피어난 백화의 검무… 당신께만 보여드릴게요.',
        '우리의 호흡이 포개지는 순간, 베지 못할 운명은 없답니다!'
      ]
    },
    {
      id: 'aila', rarity: 'SSR', elem: 'light', row: 'back',
      nameKo: '에일라', nameEn: 'Aila', titleKo: '성진 비전 대검희',
      skillKo: '성진파천·아케인노바', skillEn: 'Astral Rune Severance',
      skillMult: 6.8, atkBase: 185, hpBase: 1180, spd: 1.15,
      cutout: '/anime-character-sheets/cutouts/070_Aila.png',
      seat: '/seat/Aila.png', atkSprite: '/seat_attack/Aila.png', bust: '/anime-character-sheets/busts/070_bust.jpg',
      lines: [
        '고대 룬이 속삭이고 있어요. 마스터야말로 진정한 계약자라고.',
        '별빛의 호흡을 제 마력에 포개어 보세요… 눈부신 일격이 될 거예요.',
        '천 년의 비전서보다 당신과 나눈 차 한 잔이 더 따뜻하네요.'
      ]
    },
    {
      id: 'ysela', rarity: 'SSR', elem: 'fire', row: 'front',
      nameKo: '이셀라', nameEn: 'Ysela', titleKo: '홍련의 진룡검희',
      skillKo: '진홍용염·천화요란', skillEn: 'Crimson Dragon Ryoran',
      skillMult: 6.5, atkBase: 178, hpBase: 1420, spd: 1.18,
      cutout: '/anime-character-sheets/cutouts/107_Ysela.png',
      seat: '/seat/Ysela.png', atkSprite: '/seat_attack/Ysela.png', bust: '/anime-character-sheets/busts/107_bust.jpg',
      lines: [
        '꺼지지 않는 홍련의 불꽃으로 마스터의 앞길을 정화하겠어요!',
        '용의 심장은 오직 신뢰하는 주군 앞에서만 이렇게 뜨겁게 뛴답니다.',
        '모두 비켜서세요! 진홍빛 백화가 전장에 만개합니다!'
      ]
    },
    {
      id: 'kaeltor', rarity: 'SSR', elem: 'light', row: 'front',
      nameKo: '캘토르', nameEn: 'Kaeltor', titleKo: '백은의 천공발키리',
      skillKo: '은익성창·천공심판', skillEn: 'Silver Wing Judgment',
      skillMult: 6.0, atkBase: 158, hpBase: 1580, spd: 1.20,
      cutout: '/anime-character-sheets/cutouts/068_Kaeltor.png',
      seat: '/seat/Kaeltor.png', atkSprite: '/seat_attack/Kaeltor.png', bust: '/anime-character-sheets/busts/068_bust.jpg',
      lines: [
        '실반 은빛 기사단의 명예를 걸고 마스터의 방패이자 창이 되겠습니다.',
        '전열은 제게 맡기십시오. 단 한 걸음의 침범도 허락지 않습니다!',
        '투구를 벗은 제 모습은… 오직 마스터의 막사에서만 허락하겠어요.'
      ]
    },
    {
      id: 'medusa', rarity: 'SSR', elem: 'dark', row: 'back',
      nameKo: '메두사 고르고', nameEn: 'Medusa', titleKo: '심연 매혹의 요희',
      skillKo: '심연석화·사안멸절', skillEn: 'Abyssal Serpent Gaze',
      skillMult: 6.6, atkBase: 182, hpBase: 1150, spd: 1.22,
      cutout: '/anime-character-sheets/cutouts/089_Medusa_Gorgo.png',
      seat: '/seat/Medusa_Gorgo.png', atkSprite: '/seat_attack/Medusa_Gorgo.png', bust: '/anime-character-sheets/busts/089_bust.jpg',
      lines: [
        '후훗, 제 눈을 똑바로 바라보고도 돌이 되지 않는 건 당신뿐이군요.',
        '적들에게는 영원한 침묵을, 마스터에게는 달콤한 계약을 드리지요.',
        '조금 더 가까이 오세요… 제 맹독조차 당신께는 축복이 될 테니까요.'
      ]
    },
    {
      id: 'cardis', rarity: 'SSR', elem: 'dark', row: 'back',
      nameKo: '카르디스', nameEn: 'Cardis', titleKo: '명화의 그림자 마녀',
      skillKo: '영혼연옥·명화만개', skillEn: 'Soul Purgatory Bloom',
      skillMult: 6.4, atkBase: 176, hpBase: 1200, spd: 1.16,
      cutout: '/anime-character-sheets/cutouts/056_Cardis.png',
      seat: '/seat/Cardis.png', atkSprite: '/seat_attack/Cardis.png', bust: '/anime-character-sheets/busts/056_bust.jpg',
      lines: [
        '푸른 영혼의 등불이 오늘 밤 마스터의 승리를 비추고 있어요.',
        '어둠을 두려워 마세요. 그 어둠마저 제가 당신의 검에 바칠게요.',
        '당신의 손길은 차가운 명화조차 봄꽃처럼 피어나게 만드는군요.'
      ]
    },

    // SR (6)
    {
      id: 'kaze', rarity: 'SR', elem: 'dark', row: 'front',
      nameKo: '카제', nameEn: 'Kaze', titleKo: '구영의 그림자 인희',
      skillKo: '구영절영·순보참', skillEn: 'Nine-Shadow Flash',
      skillMult: 4.8, atkBase: 132, hpBase: 1020, spd: 1.42,
      cutout: '/anime-character-sheets/cutouts/044_Kaze.png',
      seat: '/seat/Kaze.png', atkSprite: '/seat_attack/Kaze.png', bust: '/anime-character-sheets/busts/044_bust.jpg',
      lines: [
        '그림자 자객 카제, 명령만 내리시면 소리 없이 베겠습니다.',
        '마스터의 그림자 속이 제게는 가장 편안한 안식처예요.',
        '쌍단검의 끝이 흔들리지 않는 건 당신의 등이 믿음직하기 때문이죠.'
      ]
    },
    {
      id: 'elwin', rarity: 'SR', elem: 'water', row: 'front',
      nameKo: '엘윈', nameEn: 'Elwin', titleKo: '북방 설원의 쌍검희',
      skillKo: '설화쌍인·빙아참', skillEn: 'Frostpetal Twin Slash',
      skillMult: 4.7, atkBase: 128, hpBase: 1160, spd: 1.25,
      cutout: '/anime-character-sheets/cutouts/042_Elwin.png',
      seat: '/seat/Elwin.png', atkSprite: '/seat_attack/Elwin.png', bust: '/anime-character-sheets/busts/042_bust.jpg',
      lines: [
        '눈보라 속에서 단련한 아케 쌍검술, 한 치의 오차도 없습니다!',
        '마스터가 지치지 않도록 제가 언제나 곁에서 호위하겠습니다.',
        '설원의 첫눈이 내리는 날, 함께 따뜻한 차를 나누고 싶군요.'
      ]
    },
    {
      id: 'robinyard', rarity: 'SR', elem: 'wind', row: 'back',
      nameKo: '로비냐드', nameEn: 'Robinyard', titleKo: '취풍의 백발백중 궁희',
      skillKo: '백보천양·취풍유성우', skillEn: 'Emerald Meteor Volley',
      skillMult: 4.9, atkBase: 136, hpBase: 960, spd: 1.32,
      cutout: '/anime-character-sheets/cutouts/048_Robinyard.png',
      seat: '/seat/Robinyard.png', atkSprite: '/seat_attack/Robinyard.png', bust: '/anime-character-sheets/busts/048_bust.jpg',
      lines: [
        '바람의 결이 읽혔어요! 마스터의 검기와 동시에 시위를 놓습니다!',
        '천 리 밖의 표적도 놓치지 않지만… 당신의 마음은 맞추기 어렵네요.',
        '후열 지원은 걱정 마세요! 화살비로 길을 열어드릴게요!'
      ]
    },
    {
      id: 'cascade', rarity: 'SR', elem: 'water', row: 'back',
      nameKo: '캐스케이드', nameEn: 'Cascade', titleKo: '창해 수경의 여제',
      skillKo: '심해수경·해일만파', skillEn: 'Tidal Mirror Surge',
      skillMult: 4.8, atkBase: 130, hpBase: 1080, spd: 1.18,
      cutout: '/anime-character-sheets/cutouts/008_Cascade.png',
      seat: '/seat/Cascade.png', atkSprite: '/seat_attack/Cascade.png', bust: '/anime-character-sheets/busts/008_bust.jpg',
      lines: [
        '고요한 바다일수록 깊고 거센 해일을 품고 있는 법이지요.',
        '진주 수구들이 마스터의 파동에 공명하며 춤추고 있어요.',
        '지치셨다면 잠시 제 물결 결계 안에서 쉬어가세요.'
      ]
    },
    {
      id: 'zeusphere', rarity: 'SR', elem: 'wind', row: 'front',
      nameKo: '제우스피어', nameEn: 'Zeusphere', titleKo: '자전일섬의 뇌전희',
      skillKo: '자전일섬·뇌신강림', skillEn: 'Thunderbolt Descent',
      skillMult: 5.0, atkBase: 138, hpBase: 1050, spd: 1.30,
      cutout: '/anime-character-sheets/cutouts/028_Zeusphere.png',
      seat: '/seat/Zeusphere.png', atkSprite: '/seat_attack/Zeusphere.png', bust: '/anime-character-sheets/busts/028_bust.jpg',
      lines: [
        '번개보다 빠르게 적진을 양단한다! 따라오십시오, 마스터!',
        '짜릿한 전율이 검 끝에서 솟구치는군요. 최고의 지휘입니다!',
        '천둥 구름 너머의 맑은 하늘을 당신과 함께 보고 싶습니다.'
      ]
    },
    {
      id: 'vezax', rarity: 'SR', elem: 'dark', row: 'back',
      nameKo: '베작스', nameEn: 'Vezax', titleKo: '별빛 공허의 마희',
      skillKo: '차원균열·공허성운', skillEn: 'Void Rift Singularity',
      skillMult: 5.1, atkBase: 140, hpBase: 950, spd: 1.15,
      cutout: '/anime-character-sheets/cutouts/067_Vezax.png',
      seat: '/seat/Vezax.png', atkSprite: '/seat_attack/Vezax.png', bust: '/anime-character-sheets/busts/067_bust.jpg',
      lines: [
        '수만 개의 평행 차원 중에서도 당신이 있는 이 세계가 가장 빛나요.',
        '차원의 틈새를 열어 적들을 별먼지로 되돌려 보내드리죠.',
        '공허 속에서 찾아낸 유일한 온기… 절대 놓치지 않을 거예요.'
      ]
    },

    // R (6)
    {
      id: 'aquaris', rarity: 'R', elem: 'water', row: 'back',
      nameKo: '아쿠아리스', nameEn: 'Aquaris', titleKo: '태초 물방울의 정령소녀',
      skillKo: '청류방울·수월참', skillEn: 'Aqua Moon Bubble',
      skillMult: 3.8, atkBase: 96, hpBase: 860, spd: 1.22,
      cutout: '/anime-character-sheets/cutouts/001_Aquaris.png',
      seat: '/seat/Aquaris.png', atkSprite: '/seat_attack/Aquaris.png', bust: '/anime-character-sheets/busts/001_bust.jpg',
      lines: [
        '마스터! 오늘도 맑은 물방울처럼 힘차게 출진해요!',
        '반짝이는 아쿠아 코어가 마스터를 응원하고 있어요!',
        '헤헤, 칭찬해 주시면 수구가 두 배로 커진답니다!'
      ]
    },
    {
      id: 'undine', rarity: 'R', elem: 'water', row: 'front',
      nameKo: '운디네', nameEn: 'Undine', titleKo: '해류 쌍륜의 무희',
      skillKo: '쌍륜해류·원무참', skillEn: 'Twin Chakra Vortex',
      skillMult: 3.9, atkBase: 102, hpBase: 880, spd: 1.28,
      cutout: '/anime-character-sheets/cutouts/003_Undine.png',
      seat: '/seat/Undine.png', atkSprite: '/seat_attack/Undine.png', bust: '/anime-character-sheets/busts/003_bust.jpg',
      lines: [
        '파도를 타듯 가볍게! 워터 차크람의 춤을 보세요!',
        '마스터의 박자에 맞추면 어떤 강적도 두렵지 않아요!',
        '전투가 끝나면 해변에서 제 새 연무를 감상해 주실 거죠?'
      ]
    },
    {
      id: 'pyro', rarity: 'R', elem: 'fire', row: 'front',
      nameKo: '파이로', nameEn: 'Pyro', titleKo: '홍염 불꽃의 검소녀',
      skillKo: '홍염폭쇄·화련무', skillEn: 'Blazing Lotus Dance',
      skillMult: 4.1, atkBase: 108, hpBase: 840, spd: 1.26,
      cutout: '/anime-character-sheets/cutouts/014_Pyro.png',
      seat: '/seat/Pyro.png', atkSprite: '/seat_attack/Pyro.png', bust: '/anime-character-sheets/busts/014_bust.jpg',
      lines: [
        '타올라라 홍염! 제가 선봉에서 적들을 싹 쓸어버릴게요!',
        '마스터의 검기와 제 불꽃이 합쳐지면 백 배는 더 뜨겁다고요!',
        '앗, 손이 차가우시네요? 제가 따뜻하게 데워드릴게요!'
      ]
    },
    {
      id: 'sylph', rarity: 'R', elem: 'wind', row: 'back',
      nameKo: '실프', nameEn: 'Sylph', titleKo: '구름 산들바람 정령희',
      skillKo: '춘풍화우·산들연무', skillEn: 'Spring Breeze Petal',
      skillMult: 3.8, atkBase: 98, hpBase: 850, spd: 1.34,
      cutout: '/anime-character-sheets/cutouts/022_Sylph.png',
      seat: '/seat/Sylph.png', atkSprite: '/seat_attack/Sylph.png', bust: '/anime-character-sheets/busts/022_bust.jpg',
      lines: [
        '봄바람에 흩날리는 꽃잎처럼 사뿐하게 승리를 실어 올게요~',
        '마스터 곁에서는 늘 기분 좋은 산들바람 향기가 나요.',
        '구름 위 산책, 저랑 단둘이 가보실래요?'
      ]
    },
    {
      id: 'gaia', rarity: 'R', elem: 'earth', row: 'front',
      nameKo: '가이아', nameEn: 'Gaia', titleKo: '태고 신록의 수호소녀',
      skillKo: '만화개화·대지축복', skillEn: 'Verdant Sanctuary',
      skillMult: 3.7, atkBase: 94, hpBase: 980, spd: 1.18,
      cutout: '/anime-character-sheets/cutouts/031_Gaia.png',
      seat: '/seat/Gaia.png', atkSprite: '/seat_attack/Gaia.png', bust: '/anime-character-sheets/busts/031_bust.jpg',
      lines: [
        '숲과 대지의 축복이 우리 파티를 단단히 지켜줄 거예요!',
        '새싹이 자라나듯 저희도 마스터와 함께 매일 강해지고 있어요!',
        '이 꽃화관은 마스터만을 위해 정성껏 엮었답니다!'
      ]
    },
    {
      id: 'titania', rarity: 'R', elem: 'earth', row: 'front',
      nameKo: '티타니아', nameEn: 'Titania', titleKo: '북방 초원의 유목공주',
      skillKo: '북방질풍·왕가의검무', skillEn: 'Royal Steppe Blade',
      skillMult: 4.0, atkBase: 105, hpBase: 920, spd: 1.24,
      cutout: '/anime-character-sheets/cutouts/064_Titania.png',
      seat: '/seat/Titania.png', atkSprite: '/seat_attack/Titania.png', bust: '/anime-character-sheets/busts/064_bust.jpg',
      lines: [
        '대초원의 공주 티타니아, 마스터와 어깨를 나란히 해 영광이에요!',
        '어릴 적 함께 달렸던 설원처럼 거침없이 돌파하자고요!',
        '언제까지나 당신의 가장 든든한 단짝이자 검이 되어줄게요!'
      ]
    }
  ];

  const SWORDS = [
    { id: 'sw1', ko: '기억의 은빛 룬 단검', en: 'Silver Rune Dagger', img: '/anime-character-sheets/props/art/PROP_001_Silver_Dagger.jpg', tapMult: 0.25, squadAtk: 0.10, crit: 3, baseCost: 120 },
    { id: 'sw2', ko: '북방 수호 용파괴 방패검', en: 'Dragonbreaker Aegis', img: '/anime-character-sheets/props/art/PROP_002_Dragon_Breaker_Shield.jpg', tapMult: 0.35, squadAtk: 0.16, crit: 4, baseCost: 360 },
    { id: 'sw3', ko: '구영 비전 암살비급', en: 'Nine Shadows Codex', img: '/anime-character-sheets/props/art/PROP_004_Nine_Shadows_Codex.jpg', tapMult: 0.50, squadAtk: 0.22, crit: 6, baseCost: 950 },
    { id: 'sw4', ko: '녹옥회의 비취 신장', en: 'Jade Sovereign Staff', img: '/anime-character-sheets/props/art/PROP_005_Jade_Staff.jpg', tapMult: 0.70, squadAtk: 0.32, crit: 7, baseCost: 2400 },
    { id: 'sw5', ko: '백유리 태양의 불씨', en: 'White Glass Ember', img: '/anime-character-sheets/props/art/PROP_006_White_Glass_Ember.jpg', tapMult: 0.95, squadAtk: 0.45, crit: 9, baseCost: 6200 },
    { id: 'sw6', ko: '칠흑의 흑요석 대검', en: 'Obsidian Greatsword', img: '/anime-character-sheets/props/art/PROP_014_Obsidian_Greatsword.jpg', tapMult: 1.35, squadAtk: 0.65, crit: 12, baseCost: 15000 },
    { id: 'sw7', ko: '성진호흡 천문 비전서', en: 'Star Breathing Scroll', img: '/anime-character-sheets/props/art/PROP_016_Star_Breathing_Astral_Scroll.jpg', tapMult: 1.85, squadAtk: 0.90, crit: 15, baseCost: 38000 },
    { id: 'sw8', ko: '태고 심연의 진명 코어', en: 'Abyssal Sovereign Core', img: '/anime-character-sheets/props/art/PROP_011_Abyssal_Core.jpg', tapMult: 2.60, squadAtk: 1.35, crit: 20, baseCost: 95000 }
  ];

  const LOCATIONS = [
    { ko: '제1장 · 엘윈 설원 마을', img: '/anime-character-sheets/locations/art/LOC_001_Elwin_Village.jpg' },
    { ko: '제2장 · 취종루 고대 종탑', img: '/anime-character-sheets/locations/art/LOC_002_Drunken_Bell_Tower.jpg' },
    { ko: '제3장 · 안개 절벽 검수련장', img: '/anime-character-sheets/locations/art/LOC_003_Mistfall_Cliff.jpg' },
    { ko: '제4장 · 황야의 대평원', img: '/anime-character-sheets/locations/art/LOC_004_Great_Plains_of_the_Wildlands.jpg' },
    { ko: '제5장 · 천마 페가수스 계곡', img: '/anime-character-sheets/locations/art/LOC_005_Pegasus_Valley.jpg' },
    { ko: '제6장 · 라이트헤븐 내성 광장', img: '/anime-character-sheets/locations/art/LOC_006_Lighthaven_Inner_Forum.jpg' },
    { ko: '제7장 · 붉은 유리 궁정', img: '/anime-character-sheets/locations/art/LOC_007_Red_Glass_Palace.jpg' },
    { ko: '제8장 · 제7지하 마석 갱도', img: '/anime-character-sheets/locations/art/LOC_008_Seventh_Subterranean_Labor_Camp.jpg' },
    { ko: '제9장 · 운귀장 안개 호수', img: '/anime-character-sheets/locations/art/LOC_009_Cloud_Return_Manor_Mist_Lake.jpg' },
    { ko: '제10장 · 속삭이는 바람섬', img: '/anime-character-sheets/locations/art/LOC_010_Whispering_Wind_Island.jpg' },
    { ko: '제11장 · 흑성전 비취 첨탑', img: '/anime-character-sheets/locations/art/LOC_011_Black_Temple_Jade_Barrier_Spire.jpg' },
    { ko: '제12장 · 천공의 제단', img: '/anime-character-sheets/locations/art/LOC_012_Sky_Altar.jpg' },
    { ko: '제13장 · 세이렌 해협 화선', img: '/anime-character-sheets/locations/art/LOC_013_Flower_Ship_Siren_Strait.jpg' },
    { ko: '제14장 · 용각산 진룡굴', img: '/anime-character-sheets/locations/art/LOC_014_Mount_Dragonhorn_Dragon_Grotto.jpg' },
    { ko: '제15장 · 고대 봉인의 석실', img: '/anime-character-sheets/locations/art/LOC_015_The_Sealed_Chamber.jpg' },
    { ko: '제16장 · 녹옥 원로 의사당', img: '/anime-character-sheets/locations/art/LOC_016_Jade_Council_Hall.jpg' },
    { ko: '제17장 · 사문 성채 결전장', img: '/anime-character-sheets/locations/art/LOC_017_Citadel_of_the_Four_Gates.jpg' },
    { ko: '제18장 · 유사강 흑늪지대', img: '/anime-character-sheets/locations/art/LOC_018_Quicksand_River_Black_Marsh.jpg' },
    { ko: '제19장 · 흑성채 별빛 서고', img: '/anime-character-sheets/locations/art/LOC_019_Black_Citadel_Starlight_Archive.jpg' },
    { ko: '제20장 · 종언과 맹세의 제단', img: '/anime-character-sheets/locations/art/LOC_020_Altar_of_Ruin_Two_Graves.jpg' }
  ];

  const MOBS = [
    { ko: '설원 빙결랑 펜릴', sprite: 'Fenrir.png' },
    { ko: '염옥 투사 미노타우로스', sprite: 'Minotaur.png' },
    { ko: '원혼 흑랑 바르가스트', sprite: 'Barghest.png' },
    { ko: '황금숲 거웅 우르삭', sprite: 'Ursoc.png' },
    { ko: '마공학 척후기 스파이더봇', sprite: 'Spiderbot.png' },
    { ko: '철갑 수호기 센티넬', sprite: 'Sentinel.png' },
    { ko: '중장갑 분쇄기 디바스터', sprite: 'Devastator.png' },
    { ko: '기동 화력병 골리앗', sprite: 'Goliath.png' },
    { ko: '심연 화염마신 발록', sprite: 'Balrog.png' }
  ];

  const BOSSES = [
    { ko: '붉은 궁정 데스나이트 아르투스', sprite: 'Death_Knight_Artus.png', elem: 'dark' },
    { ko: '금기 대리치 군주 켈투스', sprite: 'Keltus.png', elem: 'dark' },
    { ko: '고대 결전병기 마기테크 골렘', sprite: 'Magitech_Golem.png', elem: 'earth' },
    { ko: '종말 기갑신 오메가 웨폰', sprite: 'Omega_Weapon.png', elem: 'fire' },
    { ko: '창공 백금용왕 바하무트', sprite: 'Bahamut.png', elem: 'water' },
    { ko: '심연 재앙룡 드레드윙', sprite: 'Dreadwing.png', elem: 'dark' }
  ];

  return { I18N, ELEMENTS, SKINS, MAIDENS, SWORDS, LOCATIONS, MOBS, BOSSES };
})();
