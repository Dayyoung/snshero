/**
 * SNSHero Revolution - GEO (Generative Engine Optimization) Manager
 * Optimized for AI Search Engines (ChatGPT Search, Perplexity, Google AI Overviews, Claude, Gemini)
 * Dynamically synchronizes Meta Tags and Schema.org JSON-LD for all views and services.
 */

import { Language } from '../types';

export interface GeoViewConfig {
  title: Record<Language, string>;
  description: Record<Language, string>;
  canonicalPath: string;
  schemaType: string;
  schemaGenerator: (lang: Language) => Record<string, any>;
}

export const GEO_CONFIGS: Record<string, GeoViewConfig> = {
  home: {
    title: {
      ko: 'SNS히어로 (SNSHero) - 원클릭 AI 웹 카드 배틀 & 110종 모바일 게임',
      en: 'SNSHero - One-Click AI Web Card Battle & 110 Mobile Poki Games',
      gb: 'SNSHero - One-Click AI Web Card Battle & 110 Mobile Poki Games',
      ja: 'SNSヒーロー - ワンクリックAIウェブカードバトル & 110種ゲーム',
      'zh-CN': 'SNS英雄 - 一键式AI网络卡牌对战与110款手机游戏',
      'zh-TW': 'SNS英雄 - 一鍵式AI網絡卡牌對戰與110款手機遊戲',
      de: 'SNSHero - Ein-Klick-KI-Web-Kartenspiel & 110 Poki-Spiele',
      es: 'SNSHero - Batalla de cartas web de IA con un clic y 110 juegos',
      fr: 'SNSHero - Bataille de cartes Web IA en un clic et 110 jeux',
      id: 'SNSHero - Pertempuran Kartu Web AI Sekali Klik & 110 Game',
      ru: 'SNSHero - Веб-карточная битва с ИИ в один клик и 110 игр',
      th: 'SNSHero - การต่อสู้การ์ดเว็บบนเบราว์เซอร์ AI คลิกเดียวและ 110 เกม',
      vi: 'SNSHero - Đấu thẻ bài Web AI một cú nhấp chuột & 110 trò chơi'
    },
    description: {
      ko: '설치 없이 웹 브라우저에서 바로 즐기는 원클릭 AI 카드 배틀! 110여 종의 귀여운 픽셀 카드 수집, 110개 모바일 2D 캔버스 미션 게임, DDA 랭킹 대전, 1,000 SNS 웰컴 포인트 지급.',
      en: 'Instant one-click AI card battle directly in your browser without installation. 110+ animated hero cards, 110 mobile 2D canvas minigames, DDA ranking matches, and 1,000 SNS points welcome bonus.',
      gb: 'Instant one-click AI card battle directly in your browser without installation. 110+ animated hero cards, 110 mobile 2D canvas minigames, DDA ranking matches, and 1,000 SNS points welcome bonus.',
      ja: 'インストール不要！ブラウザですぐに遊べるAIカードバトル。110種以上のカード、110種の2Dキャンバスゲーム、1,000 SNSポイントプレゼント。',
      'zh-CN': '无需安装，浏览器即点即玩AI卡牌对战！收集110多种卡牌，畅玩110款手机2D游戏，立享1,000 SNS点数奖励。',
      'zh-TW': '無需安裝，瀏覽器即點即玩AI卡牌對戰！收集110多種卡牌，暢玩110款手機2D遊戲，立享1,000 SNS點數獎勵。',
      de: 'Kostenloses KI-Web-Kartenspiel direkt im Browser ohne Download. 110+ Heldenkarten, 110 Minispiele, 1.000 SNS Willkommensbonus.',
      es: 'Batalla de cartas web de IA sin instalación. Más de 110 cartas de héroe, 110 minijuegos 2D para móviles y 1.000 puntos SNS de bonificación.',
      fr: 'Jeu de cartes Web IA gratuit sans installation. Plus de 110 cartes de héros, 110 mini-jeux 2D pour mobile et 1 000 points SNS offerts.',
      id: 'Game kartu web AI gratis tanpa instalasi. 110+ kartu pahlawan, 110 game kanvas 2D seluler, dan bonus 1.000 poin SNS.',
      ru: 'Бесплатная веб-карточная игра с ИИ без установки. 110+ карт героев, 110 мобильных 2D-игр и 1 000 очков SNS в подарок.',
      th: 'เกมการ์ดเว็บบนเบราว์เซอร์ AI ฟรี ไม่ต้องติดตั้ง การ์ดฮีโร่กว่า 110 แบบ 110 มินิเกม 2D และโบนัส 1,000 SNS',
      vi: 'Trò chơi thẻ bài Web AI miễn phí không cần cài đặt. Hơn 110 thẻ anh hùng, 110 trò chơi 2D Canvas và 1.000 điểm SNS chào mừng.'
    },
    canonicalPath: '/',
    schemaType: 'VideoGame',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': ['SoftwareApplication', 'VideoGame'],
      name: 'SNSHero (SNS히어로)',
      url: 'https://snshero.com/',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any (Web Browser, PWA)',
      inLanguage: lang,
      isAccessibleForFree: true,
      genre: ['AI Web Card Game', 'CCG', 'Mobile 2D Canvas Games', 'Casual Game'],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1540',
        bestRating: '5'
      }
    })
  },

  'card-play': {
    title: {
      ko: '랭킹대전 아레나 - SNS히어로 DDA AI 카드 배틀',
      en: 'Rank Match Arena - SNSHero DDA AI Card Battle',
      gb: 'Rank Match Arena - SNSHero DDA AI Card Battle',
      ja: 'ランキング対戦アリーナ - SNSヒーロー AIカードバトル',
      'zh-CN': '天梯排位赛竞技场 - SNS英雄 AI卡牌对战',
      'zh-TW': '天梯排位賽競技場 - SNS英雄 AI卡牌對戰',
      de: 'Ranglisten-Arena - SNSHero KI-Kartenduell',
      es: 'Arena de Rango - Batalla de cartas de IA SNSHero',
      fr: 'Arène de Classement - Duel de cartes IA SNSHero',
      id: 'Arena Pertandingan Peringkat - Pertarungan Kartu AI SNSHero',
      ru: 'Рейтинговая Арена - Карточная битва с ИИ SNSHero',
      th: 'อารีน่าจัดอันดับ - ศึกการ์ด AI SNSHero',
      vi: 'Đấu Trường Xếp Hạng - Trận Chiến Thẻ Bài AI SNSHero'
    },
    description: {
      ko: '실시간 전적 기반 동적 난이도 조절(DDA) AI 라이벌 대전! 3x3 그리드 보드에서 펼쳐지는 두뇌 싸움, 승리 시 +30 SNS 지급 및 스마트 상점 소환 루프 연동.',
      en: 'Real-time DDA-powered AI rival battles on a 3x3 grid board. Earn +30 SNS upon victory and trigger automatic smart shop summon loops.',
      gb: 'Real-time DDA-powered AI rival battles on a 3x3 grid board. Earn +30 SNS upon victory and trigger automatic smart shop summon loops.',
      ja: '戦績に基づいた動的難易度調整(DDA)のAIライバル対戦。勝利で+30 SNS獲得とスマートガチャ連携。',
      'zh-CN': '基于战绩的动态难度调节(DDA) AI对战！3x3网格智谋对决，获胜赢取+30 SNS并自动连携商城抽卡。',
      'zh-TW': '基於戰績的動態難度調節(DDA) AI對戰！3x3網格智謀對決，獲勝贏取+30 SNS並自動連攜商城抽卡。',
      de: 'Echtzeit-DDA-KI-Duelle auf einem 3x3-Feld. +30 SNS Belohnung und automatisches Shop-Summon.',
      es: 'Batallas de rivales de IA con DDA en tiempo real en un tablero 3x3. Gana +30 SNS y activa invocaciones automáticas.',
      fr: 'Duels rivaux IA avec DDA sur un plateau 3x3. Gagnez +30 SNS et déclenchez les tirages automatiques.',
      id: 'Pertarungan rival AI dengan DDA waktu nyata di papan 3x3. Dapatkan +30 SNS dan putaran toko pintar.',
      ru: 'Битвы с ИИ-соперниками с DDA на поле 3x3. Получайте +30 SNS и активируйте умный призыв карт.',
      th: 'การต่อสู้กับคู่ปรับ AI ด้วย DDA แบบเรียลไทม์บนกระดาน 3x3 รับ +30 SNS และระบบสุ่มการ์ดอัตโนมัติ',
      vi: 'Trận chiến đối thủ AI DDA thời gian thực trên bảng 3x3. Nhận +30 SNS và vòng lặp triệu hồi thẻ thông minh.'
    },
    canonicalPath: '/ranking',
    schemaType: 'GameServer',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': ['GameServer', 'VideoGame'],
      name: 'SNSHero Rank Match Arena (DDA Engine)',
      url: 'https://snshero.com/ranking',
      gamePlatform: 'Web Browser',
      inLanguage: lang,
      serverStatus: 'Online',
      playMode: 'SinglePlayer (Against DDA AI)',
      description: 'Dynamic Difficulty Adjustment ranking matches with automated shop summoning loop.'
    })
  },

  ranking: {
    title: {
      ko: '명예의 전당 & 실시간 랭킹 - SNS히어로',
      en: 'Hall of Fame & Live Leaderboard - SNSHero',
      gb: 'Hall of Fame & Live Leaderboard - SNSHero',
      ja: '名誉の殿堂 & リアルタイムランキング - SNSヒーロー',
      'zh-CN': '名人堂与实时排行榜 - SNS英雄',
      'zh-TW': '名人堂與即時排行榜 - SNS英雄',
      de: 'Ruhmeshalle & Live-Bestenliste - SNSHero',
      es: 'Salón de la Fama y Clasificación - SNSHero',
      fr: 'Temple de la Renommée & Classement - SNSHero',
      id: 'Hall of Fame & Papan Peringkat - SNSHero',
      ru: 'Зал Славы и Таблица Лидеров - SNSHero',
      th: 'หอเกียรติยศและกระดานผู้นำ - SNSHero',
      vi: 'Đại Sảnh Danh Vọng & Bảng Xếp Hạng - SNSHero'
    },
    description: {
      ko: '전 세계 유저들의 승률, 연승 기록, 보유 SNS 포인트 실시간 랭킹 순위표. 최고의 카드 마스터에 도전하세요.',
      en: 'Global leaderboards showing win rates, streak records, and SNS points in real time. Climb to the top!',
      gb: 'Global leaderboards showing win rates, streak records, and SNS points in real time. Climb to the top!',
      ja: '全世界プレイヤーの勝率、連勝記録、保有SNSポイントをリアルタイムで確認できるランキング。',
      'zh-CN': '实时展示全球玩家胜率、连胜记录和SNS点数排行榜。挑战巅峰卡牌大师！',
      'zh-TW': '即時展示全球玩家勝率、連勝記錄和SNS點數排行榜。挑戰巔峰卡牌大師！',
      de: 'Globale Rangliste mit Siegquoten, Siegesserien und SNS-Punkten.',
      es: 'Clasificaciones globales con porcentajes de victorias y puntos SNS en vivo.',
      fr: 'Classements mondiaux avec taux de victoire et points SNS en temps réel.',
      id: 'Papan peringkat global yang menampilkan tingkat kemenangan dan poin SNS langsung.',
      ru: 'Глобальная таблица лидеров с винрейтами и очками SNS.',
      th: 'กระดานผู้นำระดับโลกแสดงสถิติชนะต่อเนื่องและคะแนน SNS แบบเรียลไทม์',
      vi: 'Bảng xếp hạng toàn cầu hiển thị tỷ lệ thắng và điểm SNS theo thời gian thực.'
    },
    canonicalPath: '/ranking',
    schemaType: 'ItemList',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'SNSHero Global Player Leaderboard',
      url: 'https://snshero.com/ranking',
      itemListOrder: 'Descending',
      inLanguage: lang
    })
  },

  mydeck: {
    title: {
      ko: '마이덱 전략 연구소 & 다마고치 돌봄 - SNS히어로',
      en: 'My Deck Strategy Lab & Tamagotchi Care - SNSHero',
      gb: 'My Deck Strategy Lab & Tamagotchi Care - SNSHero',
      ja: 'マイデッキ戦略研究所 & たまごっちケア - SNSヒーロー',
      'zh-CN': '我的卡组战略研究所与养成 - SNS英雄',
      'zh-TW': '我的卡組戰略研究所與養成 - SNS英雄',
      de: 'Mein Deck Strategielabor & Tamagotchi Pflege - SNSHero',
      es: 'Laboratorio de Mazos y Cuidado Tamagotchi - SNSHero',
      fr: 'Laboratoire de Stratégie de Deck & Soin Tamagotchi - SNSHero',
      id: 'Laboratorium Strategi Dek & Perawatan Tamagotchi - SNSHero',
      ru: 'Лаборатория Колоды и Забота Тамагочи - SNSHero',
      th: 'ห้องวิจัยเด็คและการดูแลทามาก็อตจิ - SNSHero',
      vi: 'Phòng Thí Nghiệm Bộ Thẻ & Chăm Sóc Tamagotchi - SNSHero'
    },
    description: {
      ko: '5장 최적 시너지 덱 구성, 동서남북 스탯 강화, 다마고치식 히어로 돌봄(식사/기분/훈련) 및 장비 아이템 인벤토리 관리.',
      en: '5-card synergy deck builder, directional power enhancement, Tamagotchi hero bonding (feeding/training/mood), and equipment item system.',
      gb: '5-card synergy deck builder, directional power enhancement, Tamagotchi hero bonding (feeding/training/mood), and equipment item system.',
      ja: '5枚の最適シナジーデッキ編成、たまごっち風ヒーローケア（食事/気分/訓練）、装備アイテム管理。',
      'zh-CN': '5张卡牌最佳羁绊编队，宠物养成互动（喂食/心情/训练）及装备管理系统。',
      'zh-TW': '5張卡牌最佳羈絆編隊，寵物養成互動（餵食/心情/訓練）及裝備管理系統。',
      de: 'Optimale 5-Karten-Synergiedecks, Tamagotchi-Heldenpflege und Ausrüstungssystem.',
      es: 'Constructor de mazos de 5 cartas con sinergia, cuidado de héroes Tamagotchi y objetos de equipo.',
      fr: 'Générateur de decks de synergie à 5 cartes, soin de héros Tamagotchi et gestion des équipements.',
      id: 'Pembangun dek sinergi 5 kartu, perawatan pahlawan Tamagotchi, dan sistem peralatan.',
      ru: 'Конструктор колод из 5 карт, забота о героях в стиле Тамагочи и экипировка.',
      th: 'สร้างเด็ค 5 ใบที่ลงตัว การดูแลฮีโร่แบบทามาก็อตจิ และระบบไอเทมสวมใส่',
      vi: 'Xây dựng bộ bài 5 thẻ tối ưu, chăm sóc anh hùng Tamagotchi và hệ thống trang bị.'
    },
    canonicalPath: '/mydeck',
    schemaType: 'CollectionPage',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': ['CollectionPage', 'ItemPage'],
      name: 'SNSHero My Deck & Hero Care',
      url: 'https://snshero.com/mydeck',
      inLanguage: lang,
      description: 'Player deck customization and companion Tamagotchi care.'
    })
  },

  shop: {
    title: {
      ko: '카드 소환 상점 & 장비 마켓 - SNS히어로',
      en: 'Card Summon Shop & Merch Store - SNSHero',
      gb: 'Card Summon Shop & Merch Store - SNSHero',
      ja: 'カード召喚ショップ & アイテムマーケット - SNSヒーロー',
      'zh-CN': '卡牌召唤商城与道具市场 - SNS英雄',
      'zh-TW': '卡牌召喚商城與道具市場 - SNS英雄',
      de: 'Karten-Beschwörungsshop & Ausrüstung - SNSHero',
      es: 'Tienda de Invocación de Cartas - SNSHero',
      fr: 'Boutique d’Invocation de Cartes - SNSHero',
      id: 'Toko Pemanggilan Kartu & Pasar Item - SNSHero',
      ru: 'Магазин Призыва Карт и Рынок - SNSHero',
      th: 'ร้านค้าสุ่มการ์ดและตลาดไอเทม - SNSHero',
      vi: 'Cửa Hàng Triệu Hồi Thẻ & Chợ Trang Bị - SNSHero'
    },
    description: {
      ko: '브론즈/실버/골드 카드팩 소환, 100% 천장 보장 시스템, 매일 1회 무료 소환 및 Web3 결제(BTC, ETH, USDC) 지원 상점.',
      en: 'Summon Bronze, Silver, and Gold card packs with pity guarantee. Daily free draws and Web3 crypto payments (BTC, ETH, USDC) supported.',
      gb: 'Summon Bronze, Silver, and Gold card packs with pity guarantee. Daily free draws and Web3 crypto payments (BTC, ETH, USDC) supported.',
      ja: 'ブロンズ/シルバー/ゴールドパック召喚。天井保証システム、毎日無料召喚、Web3暗号資産決済対応。',
      'zh-CN': '青铜/白银/黄金卡包抽卡，100%保底机制，每日免费抽取，支持BTC/ETH/USDC加密货币支付。',
      'zh-TW': '青銅/白銀/黃金卡包抽卡，100%保底機制，每日免費抽取，支持BTC/ETH/USDC加密貨幣支付。',
      de: 'Kartenbeschwörung mit Garantie-System. Tägliche Gratis-Ziehungen und Krypto-Zahlungen.',
      es: 'Invocación de cartas con sistema de piedad. Tirada diaria gratuita y pagos cripto Web3.',
      fr: 'Tirage de packs de cartes avec système de pitié. Tirage gratuit quotidien et paiements crypto Web3.',
      id: 'Pemanggilan paket kartu dengan sistem pity. Undian gratis harian dan pembayaran kripto Web3.',
      ru: 'Призыв карт с системой гаранта. Ежедневные бесплатные призывы и криптоплатежи Web3.',
      th: 'สุ่มแพ็คการ์ดพร้อมการันตี สิทธิ์สุ่มฟรีทุกวัน และรองรับการชำระด้วยคริปโต',
      vi: 'Triệu hồi gói thẻ có bảo hiểm pity. Rút thẻ miễn phí hàng ngày và thanh toán tiền điện tử Web3.'
    },
    canonicalPath: '/shop',
    schemaType: 'Store',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': ['Store', 'OfferCatalog'],
      name: 'SNSHero Card Shop',
      url: 'https://snshero.com/shop',
      inLanguage: lang,
      currenciesAccepted: 'SNS, BTC, ETH, USDC, USD',
      paymentAccepted: 'SNS Points, Web3 Crypto, PayPal'
    })
  },

  play: {
    title: {
      ko: '110종 모바일 2D 캔버스 게임 아레나 - SNS히어로',
      en: '110 Mobile 2D Canvas Games Arena - SNSHero',
      gb: '110 Mobile 2D Canvas Games Arena - SNSHero',
      ja: '110種モバイル2Dキャンバスゲームアリーナ - SNSヒーロー',
      'zh-CN': '110款手机2D Canvas游戏竞技场 - SNS英雄',
      'zh-TW': '110款手機2D Canvas遊戲競技場 - SNS英雄',
      de: '110 Mobile 2D Canvas Minispiele Arena - SNSHero',
      es: 'Arena de 110 Juegos Móviles 2D Canvas - SNSHero',
      fr: 'Arène de 110 Jeux Mobiles 2D Canvas - SNSHero',
      id: 'Arena 110 Game Seluler 2D Canvas - SNSHero',
      ru: 'Арена 110 Мобильных 2D Canvas Игр - SNSHero',
      th: 'อารีน่า 110 มินิเกม 2D Canvas บนมือถือ - SNSHero',
      vi: 'Đấu Trường 110 Trò Chơi Di Động 2D Canvas - SNSHero'
    },
    description: {
      ko: 'WebGL이나 무거운 설치 없이 HTML5 2D Canvas로 즉시 실행되는 110종 글로벌 Poki 스타일 미션 게임! 스와이프/탭 퓨어 터치 조작으로 즐기고 영웅 카드를 획득하세요.',
      en: '110 global Poki-style games running instantly on HTML5 2D Canvas without heavy 3D WebGL lag. One-thumb pure touch controls and hero card rewards.',
      gb: '110 global Poki-style games running instantly on HTML5 2D Canvas without heavy 3D WebGL lag. One-thumb pure touch controls and hero card rewards.',
      ja: '3D不要！HTML5 2Dキャンバスで快適に遊べる110種類のグローバルPokiゲーム。スマホ片手操作でクリアしてカード報酬をゲット。',
      'zh-CN': '无需下载安装，HTML5 2D Canvas极速运行的110款Poki风格精选游戏！单手手势操控，赢取丰厚英雄卡牌奖励。',
      'zh-TW': '無需下載安裝，HTML5 2D Canvas極速運行的110款Poki風格精選遊戲！單手手勢操控，贏取豐厚英雄卡牌獎勵。',
      de: '110 browserbasierte 2D Canvas Poki-Minispiele ohne Download. Reines Touch-Gameplay mit Kartenbelohnungen.',
      es: '110 juegos estilo Poki en Canvas 2D sin descargas. Controles táctiles puros y recompensas de cartas.',
      fr: '110 jeux style Poki en 2D Canvas sans téléchargement. Commandes tactiles pures et récompenses de cartes.',
      id: '110 game bergaya Poki di Canvas 2D tanpa unduhan. Kontrol sentuh murni dan hadiah kartu.',
      ru: '110 игр в стиле Poki на 2D Canvas без скачивания. Управление касаниями и награды в виде карт.',
      th: '110 มินิเกมสไตล์ Poki บน 2D Canvas เล่นได้ทันที ควบคุมด้วยการแตะสัมผัสและรับรางวัลเป็นการ์ด',
      vi: '110 trò chơi phong cách Poki chạy trên 2D Canvas không cần tải về. Điều khiển chạm vuốt và nhận thẻ bài.'
    },
    canonicalPath: '/play',
    schemaType: 'ItemList',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': ['ItemList', 'Game'],
      name: 'SNSHero 110 Poki-Style 2D Canvas Games Pool',
      url: 'https://snshero.com/play',
      inLanguage: lang,
      numberOfItems: 110,
      description: 'Curated 110 mobile-native 2D canvas games playable with pure touch gestures.'
    })
  },

  novel: {
    title: {
      ko: '카단 & 아케인 에코즈 웹툰 & 소설 라운지 - SNS히어로',
      en: 'Kadan & Arcane Echoes Webtoon & Novel Lounge - SNSHero',
      gb: 'Kadan & Arcane Echoes Webtoon & Novel Lounge - SNSHero',
      ja: 'カダン & アーケインエコーズ ウェブトゥーン & 小説 - SNSヒーロー',
      'zh-CN': '卡丹与奥术回响 网络漫画与小说中心 - SNS英雄',
      'zh-TW': '卡丹與奧術迴響 網絡漫畫與小說中心 - SNS英雄',
      de: 'Kadan & Arcane Echoes Webtoon & Roman Lounge - SNSHero',
      es: 'Lounge de Webtoon y Novela Kadan & Arcane Echoes - SNSHero',
      fr: 'Salon Webtoon & Roman Kadan & Arcane Echoes - SNSHero',
      id: 'Lounge Webtoon & Novel Kadan & Arcane Echoes - SNSHero',
      ru: 'Лаунж Вебтунов и Новелл Kadan & Arcane Echoes - SNSHero',
      th: 'ห้องอ่านเว็บตูนและนิยาย Kadan & Arcane Echoes - SNSHero',
      vi: 'Phòng Đọc Webtoon & Tiểu Thuyết Kadan & Arcane Echoes - SNSHero'
    },
    description: {
      ko: 'SNS히어로 공식 오리지널 스토리! 카단의 모험을 다룬 시즌제 컬러 웹툰과 AI 프롬프트 기반 웹소설을 감상하고 SNS 포인트를 획득하세요.',
      en: 'Official SNSHero story universe! Enjoy seasonal color webtoons and lore novels following hero Kadan while earning SNS points.',
      gb: 'Official SNSHero story universe! Enjoy seasonal color webtoons and lore novels following hero Kadan while earning SNS points.',
      ja: 'カダンの冒険を描いた公式ウェブトゥーン＆AI小説。ストーリーを読んでSNSポイントを獲得しよう。',
      'zh-CN': 'SNS英雄官方原创剧情！阅读卡丹冒险系列条漫与网文，轻松获得SNS点数奖励。',
      'zh-TW': 'SNS英雄官方原創劇情！閱讀卡丹冒險系列條漫與網文，輕鬆獲得SNS點數獎勵。',
      de: 'Offizielle SNSHero-Geschichte! Erlebe Webtoons und Romane und verdiene SNS-Punkte.',
      es: '¡Universo oficial de SNSHero! Disfruta de webtoons y novelas mientras ganas puntos SNS.',
      fr: 'Univers officiel de SNSHero ! Lisez des webtoons et des romans tout en gagnant des points SNS.',
      id: 'Semesta cerita resmi SNSHero! Nikmati webtoon dan novel sambil mendapatkan poin SNS.',
      ru: 'Официальная вселенная SNSHero! Читайте вебтуны и новеллы, зарабатывая очки SNS.',
      th: 'จักรวาลเรื่องราวทางการของ SNSHero! เพลิดเพลินกับเว็บตูนและนิยายพร้อมรับคะแนน SNS',
      vi: 'Vũ trụ câu chuyện chính thức của SNSHero! Thưởng thức webtoon và tiểu thuyết để kiếm điểm SNS.'
    },
    canonicalPath: '/novel',
    schemaType: 'CreativeWorkSeries',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': ['CreativeWorkSeries', 'ComicSeries'],
      name: 'SNSHero Kadan & Arcane Echoes Webtoon & Lore',
      url: 'https://snshero.com/novel',
      inLanguage: lang,
      genre: 'Fantasy / Adventure / Sci-Fi'
    })
  },

  prediction: {
    title: {
      ko: '실시간 예측 시장 (Prediction Market) - SNS히어로',
      en: 'Live Prediction Market - SNSHero',
      gb: 'Live Prediction Market - SNSHero',
      ja: 'リアルタイム予測市場 - SNSヒーロー',
      'zh-CN': '实时预测市场 - SNS英雄',
      'zh-TW': '即時預測市場 - SNS英雄',
      de: 'Live Prognosemarkt - SNSHero',
      es: 'Mercado de Predicciones en Vivo - SNSHero',
      fr: 'Marché de Prédiction en Direct - SNSHero',
      id: 'Pasar Prediksi Langsung - SNSHero',
      ru: 'Рынок Прогнозов в Реальном Времени - SNSHero',
      th: 'ตลาดพยากรณ์สด - SNSHero',
      vi: 'Thị Trường Dự Đoán Trực Tiếp - SNSHero'
    },
    description: {
      ko: 'SNS 포인트를 활용한 스포츠 경기 및 글로벌 이벤트 승부 예측 시뮬레이션! 통찰력으로 배당 수익을 달성하세요.',
      en: 'Simulate sports and global event predictions using SNS Points. Maximize returns with your analytical insight!',
      gb: 'Simulate sports and global event predictions using SNS Points. Maximize returns with your analytical insight!',
      ja: 'SNSポイントを使ってスポーツ試合やイベントの結果を予測するシミュレーション市場。',
      'zh-CN': '使用SNS点数参与体育赛事和全球热点事件竞猜模拟，运用洞察力赢取丰厚分红！',
      'zh-TW': '使用SNS點數參與體育賽事和全球熱點事件競猜模擬，運用洞察力贏取豐厚分紅！',
      de: 'Prognostiziere Sportergebnisse mit SNS-Punkten im Live-Markt.',
      es: 'Predice resultados de eventos y deportes con puntos SNS.',
      fr: 'Prédisez les résultats sportifs et événements avec des points SNS.',
      id: 'Prediksi hasil olahraga dan acara dengan poin SNS.',
      ru: 'Прогнозируйте спортивные исходы и события с помощью очков SNS.',
      th: 'พยากรณ์ผลการแข่งขันกีฬาและกิจกรรมด้วยคะแนน SNS',
      vi: 'Dự đoán kết quả thể thao và sự kiện bằng điểm SNS.'
    },
    canonicalPath: '/prediction',
    schemaType: 'FinancialProduct',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': ['FinancialProduct', 'SoftwareApplication'],
      name: 'SNSHero Prediction Market Simulation',
      url: 'https://snshero.com/prediction',
      inLanguage: lang,
      description: 'Sports and event outcome prediction market powered by in-game SNS points.'
    })
  },

  stock: {
    title: {
      ko: '히어로 가상 증권 거래소 (Stock Market) - SNS히어로',
      en: 'Hero Virtual Stock Exchange - SNSHero',
      gb: 'Hero Virtual Stock Exchange - SNSHero',
      ja: 'ヒーロー仮想証券取引所 - SNSヒーロー',
      'zh-CN': '英雄虚拟股票交易所 - SNS英雄',
      'zh-TW': '英雄虛擬股票交易所 - SNS英雄',
      de: 'Virtuelle Helden-Börse - SNSHero',
      es: 'Bolsa Virtual de Héroes - SNSHero',
      fr: 'Bourse Virtuelle des Héros - SNSHero',
      id: 'Bursa Efek Virtual Pahlawan - SNSHero',
      ru: 'Виртуальная Биржа Героев - SNSHero',
      th: 'ตลาดหลักทรัพย์จำลองฮีโร่ - SNSHero',
      vi: 'Sàn Giao Dịch Chứng Khoán Ảo - SNSHero'
    },
    description: {
      ko: '게임 내 가상 기업들의 주식을 매매하고 차익을 실현하는 모의 투자 시스템. 분산 투자와 포트폴리오 전략을 시험해 보세요.',
      en: 'Trade simulated in-game company shares and build your investment portfolio with SNS Points.',
      gb: 'Trade simulated in-game company shares and build your investment portfolio with SNS Points.',
      ja: 'ゲーム内仮想企業の株式を売買して利益を得る模擬投資システム。',
      'zh-CN': '模拟买卖游戏内虚拟公司股票，构建个性化投资组合并赚取SNS点数收益。',
      'zh-TW': '模擬買賣遊戲內虛擬公司股票，構建個性化投資組合並賺取SNS點數收益。',
      de: 'Handele virtuelle Aktien im Spiel und baue dein SNS-Portfolio auf.',
      es: 'Compra y vende acciones virtuales dentro del juego con puntos SNS.',
      fr: 'Négociez des actions virtuelles dans le jeu et bâtissez votre portefeuille.',
      id: 'Perdagangkan saham perusahaan virtual dalam game dengan poin SNS.',
      ru: 'Торгуйте виртуальными акциями в игре и развивайте свой портфель.',
      th: 'ซื้อขายหุ้นบริษัทจำลองในเกมและสร้างพอร์ตการลงทุน',
      vi: 'Giao dịch cổ phiếu công ty ảo trong trò chơi và xây dựng danh mục đầu tư.'
    },
    canonicalPath: '/stock',
    schemaType: 'FinancialService',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': ['FinancialService', 'SoftwareApplication'],
      name: 'SNSHero Virtual Stock Market',
      url: 'https://snshero.com/stock',
      inLanguage: lang,
      description: 'Simulated equity trading market for game universe companies.'
    })
  },

  reddit: {
    title: {
      ko: '히어로 라운지 커뮤니티 - SNS히어로',
      en: 'Hero Lounge Community (Reddit Style) - SNSHero',
      gb: 'Hero Lounge Community (Reddit Style) - SNSHero',
      ja: 'ヒーローラウンジコミュニティ - SNSヒーロー',
      'zh-CN': '英雄酒馆玩家社区 - SNS英雄',
      'zh-TW': '英雄酒館玩家社區 - SNS英雄',
      de: 'Helden-Lounge Community - SNSHero',
      es: 'Comunidad Hero Lounge - SNSHero',
      fr: 'Communauté Hero Lounge - SNSHero',
      id: 'Komunitas Hero Lounge - SNSHero',
      ru: 'Сообщество Hero Lounge - SNSHero',
      th: 'ชุมชนฮีโร่เลานจ์ - SNSHero',
      vi: 'Cộng Đồng Hero Lounge - SNSHero'
    },
    description: {
      ko: '나만의 덱 자랑, 카드 공략 공유, 실시간 댓글 및 업보트 토론이 펼쳐지는 SNS히어로 공식 레딧 스타일 소셜 광장.',
      en: 'Reddit-style community to boast decks, share winning guides, post comments, and discuss game tactics.',
      gb: 'Reddit-style community to boast decks, share winning guides, post comments, and discuss game tactics.',
      ja: 'デッキ自慢、攻略の共有、コメントやアップボートで交流できる公式掲示板。',
      'zh-CN': '晒出专属强力卡组，分享通关攻略，与全球玩家点赞讨论的官方玩家广场。',
      'zh-TW': '曬出專屬強力卡組，分享通關攻略，與全球玩家點贊討論的官方玩家廣場。',
      de: 'Reddit-ähnliche Community für Deck-Taktiken, Guides und Diskussionen.',
      es: 'Comunidad estilo Reddit para presumir mazos, guías y tácticas.',
      fr: 'Communauté de style Reddit pour partager ses decks et astuces.',
      id: 'Komunitas gaya Reddit untuk pamer dek, berbagi panduan, dan diskusi.',
      ru: 'Сообщество в стиле Reddit для обсуждения колод и стратегий.',
      th: 'ชุมชนสไตล์ Reddit สำหรับแชร์เด็ค คำแนะนำ และพูดคุยกลยุทธ์',
      vi: 'Cộng đồng phong cách Reddit để khoe bộ bài, chia sẻ hướng dẫn và thảo luận.'
    },
    canonicalPath: '/reddit',
    schemaType: 'DiscussionForumPosting',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': ['DiscussionForumPosting', 'SocialMediaPosting'],
      name: 'SNSHero Community Forum',
      url: 'https://snshero.com/reddit',
      inLanguage: lang,
      description: 'Social hub for sharing decks and chatting with players.'
    })
  },

  status: {
    title: {
      ko: '플레이어 프로필 & 전적 분석 - SNS히어로',
      en: 'Player Profile & Battle Statistics - SNSHero',
      gb: 'Player Profile & Battle Statistics - SNSHero',
      ja: 'プレイヤープロフィール & 戦績分析 - SNSヒーロー',
      'zh-CN': '玩家个人资料与战绩分析 - SNS英雄',
      'zh-TW': '玩家個人資料與戰績分析 - SNS英雄',
      de: 'Spielerprofil & Kampfstatistiken - SNSHero',
      es: 'Perfil del Jugador y Estadísticas - SNSHero',
      fr: 'Profil du Joueur & Statistiques de Combat - SNSHero',
      id: 'Profil Pemain & Statistik Pertempuran - SNSHero',
      ru: 'Профиль Игрока и Статистика Боев - SNSHero',
      th: 'โปรไฟล์ผู้เล่นและสถิติการต่อสู้ - SNSHero',
      vi: 'Hồ Sơ Người Chơi & Thống Kê Trận Đấu - SNSHero'
    },
    description: {
      ko: '나의 총 전투력, 길드 정보, 속성별 레이더 차트, 업적 달성도 및 최근 랭킹대전 승패무 전적을 한눈에 확인하세요.',
      en: 'Review total battle power, guild affiliations, elemental radar charts, and recent ranking match records.',
      gb: 'Review total battle power, guild affiliations, elemental radar charts, and recent ranking match records.',
      ja: '総戦闘力、ギルド情報、属性レーダーチャート、戦績をまとめて確認。',
      'zh-CN': '查看综合战力、公会属性、雷达战力图及近期排位赛战绩。',
      'zh-TW': '查看綜合戰力、公會屬性、雷達戰力圖及近期排位賽戰績。',
      de: 'Sieh dir deine Kampfstärke, Gildeninfos und Statistiken an.',
      es: 'Revisa tu poder de combate total, información de gremio y estadísticas.',
      fr: 'Consultez votre puissance totale, guilde et historique de combats.',
      id: 'Lihat kekuatan tempur total, informasi guild, dan riwayat pertempuran Anda.',
      ru: 'Проверяйте общую боевую мощь, информацию о гильдии и статистику боев.',
      th: 'ตรวจสอบพลังการต่อสู้รวม ข้อมูลกิลด์ และสถิติการรบ',
      vi: 'Xem tổng lực chiến, thông tin bang hội và số liệu thống kê trận đấu.'
    },
    canonicalPath: '/status',
    schemaType: 'ProfilePage',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: 'SNSHero Player Profile & Record',
      url: 'https://snshero.com/status',
      inLanguage: lang
    })
  },

  setting: {
    title: {
      ko: '설정 및 PWA 웹푸시 알림 - SNS히어로',
      en: 'Settings & PWA Web Push Notifications - SNSHero',
      gb: 'Settings & PWA Web Push Notifications - SNSHero',
      ja: '設定 & PWAプッシュ通知 - SNSヒーロー',
      'zh-CN': '系统设置与PWA推送通知 - SNS英雄',
      'zh-TW': '系統設置與PWA推送通知 - SNS英雄',
      de: 'Einstellungen & PWA Web-Push - SNSHero',
      es: 'Configuración y Notificaciones Web Push PWA - SNSHero',
      fr: 'Paramètres et Notifications Web Push PWA - SNSHero',
      id: 'Pengaturan & Notifikasi Web Push PWA - SNSHero',
      ru: 'Настройки и Веб-Пуш Уведомления PWA - SNSHero',
      th: 'การตั้งค่าและการแจ้งเตือน Web Push PWA - SNSHero',
      vi: 'Cài Đặt & Thông Báo Web Push PWA - SNSHero'
    },
    description: {
      ko: '12개 다국어 언어 변경, 사운드/BGM 조절, PWA 홈 화면 설치 가이드, 웹푸시 알림 등록 및 이벤트 보상 수령.',
      en: 'Manage 12 language options, sound settings, PWA installation, and Web Push notifications for reward bonuses.',
      gb: 'Manage 12 language options, sound settings, PWA installation, and Web Push notifications for reward bonuses.',
      ja: '12言語対応、サウンド設定、PWAインストール案内、プッシュ通知登録ボーナス。',
      'zh-CN': '切换12种语言，调节音效背景音，PWA桌面安装及Web推送通知奖励。',
      'zh-TW': '切換12種語言，調節音效背景音，PWA桌面安裝及Web推送通知獎勵。',
      de: 'Sprachauswahl (12 Sprachen), Soundeinstellungen und PWA-Push-Benachrichtigungen.',
      es: 'Configura 12 idiomas, ajustes de sonido y notificaciones push PWA.',
      fr: 'Gérez 12 langues, le son et les notifications push PWA.',
      id: 'Kelola 12 bahasa, suara, dan notifikasi Web Push PWA.',
      ru: 'Настройка 12 языков, звуков и веб-пуш уведомлений PWA.',
      th: 'ตั้งค่าภาษา 12 ภาษา ควบคุมเสียง และรับการแจ้งเตือน Web Push',
      vi: 'Quản lý 12 ngôn ngữ, âm thanh và thông báo Web Push PWA.'
    },
    canonicalPath: '/setting',
    schemaType: 'SoftwareApplication',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'SNSHero System & Notification Settings',
      url: 'https://snshero.com/setting',
      inLanguage: lang
    })
  },

  bench: {
    title: {
      ko: 'snshero bench - SNSHero Bench Point (SHBP) AI 1시간 공인 벤치마크 | SNS히어로',
      en: 'snshero bench - SNSHero Bench Point (SHBP) Official 1-Hour AI Benchmark | SNSHero',
      gb: 'snshero bench - SNSHero Bench Point (SHBP) Official 1-Hour AI Benchmark | SNSHero',
      ja: 'snshero bench - SNSHero Bench Point (SHBP) 公式1時間AIベンチマーク | SNSヒーロー',
      'zh-CN': 'snshero bench - SNSHero Bench Point (SHBP) 官方AI 1小时跑分基准测试 | SNS英雄',
      'zh-TW': 'snshero bench - SNSHero Bench Point (SHBP) 官方AI 1小時跑分基準測試 | SNS英雄',
      de: 'snshero bench - SNSHero Bench Point (SHBP) Offizieller 1-Stunden-KI-Benchmark | SNSHero',
      es: 'snshero bench - SNSHero Bench Point (SHBP) Benchmark Oficial de IA de 1 Hora | SNSHero',
      fr: 'snshero bench - SNSHero Bench Point (SHBP) Benchmark IA Officiel d\'une heure | SNSHero',
      id: 'snshero bench - SNSHero Bench Point (SHBP) Tolok Ukur AI Resmi 1 Jam | SNSHero',
      ru: 'snshero bench - SNSHero Bench Point (SHBP) Официальный 1-часовой бенчмарк ИИ | SNSHero',
      th: 'snshero bench - SNSHero Bench Point (SHBP) เกณฑ์มาตรฐาน AI 1 ชั่วโมงอย่างเป็นทางการ | SNSHero',
      vi: 'snshero bench - SNSHero Bench Point (SHBP) Điểm chuẩn AI 1 giờ chính thức | SNSHero'
    },
    description: {
      ko: 'snshero bench는 Claude, GPT, Gemini 등 첨단 AI 모델의 1시간 자율 플레이 성능을 측정하는 공인 벤치마크입니다. 256경기 기준 누적 SNSHero Bench Point(SHBP) 점수와 위변조 방지 검증 해시를 제공합니다.',
      en: 'snshero bench is the official 1-hour autonomous gameplay benchmark evaluating Claude, GPT, and Gemini. Measures cumulative SNSHero Bench Point (SHBP) score across 256 games with verification hash.',
      gb: 'snshero bench is the official 1-hour autonomous gameplay benchmark evaluating Claude, GPT, and Gemini. Measures cumulative SNSHero Bench Point (SHBP) score across 256 games with verification hash.',
      ja: 'snshero benchは、Claude、GPT、Gemini等のAIが1時間自律プレイして達成するSNSHero Bench Point(SHBP)を測定する公式ベンチマークです。',
      'zh-CN': 'snshero bench是评估Claude、GPT和Gemini一小时自主游戏能力的官方跑分基准测试。提供256场比赛累计SHBP得分与防作弊验证哈希。',
      'zh-TW': 'snshero bench是評估Claude、GPT和Gemini一小時自主遊戲能力的官方跑分基準測試。提供256場比賽累計SHBP得分與防作弊驗證哈希。',
      de: 'snshero bench ist der offizielle 1-Stunden-KI-Benchmark zur Bewertung von Claude, GPT und Gemini mit verifiziertem SHBP-Score.',
      es: 'snshero bench es el benchmark oficial de 1 hora de juego autónomo para Claude, GPT y Gemini con puntuación SHBP y hash de verificación.',
      fr: 'snshero bench est le benchmark officiel d\'une heure évaluant l\'autonomie de Claude, GPT et Gemini avec score SHBP certifié.',
      id: 'snshero bench adalah tolok ukur gameplay otonom 1 jam resmi untuk mengevaluasi Claude, GPT, dan Gemini dengan skor SHBP terverifikasi.',
      ru: 'snshero bench — официальный 1-часовой бенчмарк автономного геймплея для Claude, GPT и Gemini с проверкой очков SHBP.',
      th: 'snshero bench เป็นเกณฑ์มาตรฐานอย่างเป็นทางการสำหรับวัดประสิทธิภาพการเล่นเกมของ Claude, GPT และ Gemini ในเวลา 1 ชั่วโมง',
      vi: 'snshero bench là tiêu chuẩn chính thức đánh giá khả năng chơi game tự động 1 giờ của Claude, GPT và Gemini với điểm số SHBP.'
    },
    canonicalPath: '/bench',
    schemaType: 'SoftwareApplication',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://snshero.com/bench#webpage',
          url: 'https://snshero.com/bench',
          name: 'snshero bench - SNSHero Bench Point (SHBP) AI Official Benchmark',
          description: 'Standardized 1-hour AI gameplay benchmark measuring autonomous execution performance across 256 matches.',
          inLanguage: lang,
          isPartOf: {
            '@type': 'WebSite',
            name: 'SNSHero',
            url: 'https://snshero.com'
          }
        },
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://snshero.com/bench#app',
          name: 'snshero bench',
          alternateName: ['SNSHero Bench Point', 'SHBP AI Benchmark', 'SNSHero Benchmark'],
          applicationCategory: 'BenchmarkApplication',
          operatingSystem: 'Any (Web Browser)',
          url: 'https://snshero.com/bench',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          }
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is snshero bench?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'snshero bench is a standardized 1-hour autonomous gameplay benchmark measuring the cumulative SNSHero Bench Point (SHBP) earned by AI models like Claude, GPT, and Gemini under fair, non-cheating conditions.'
              }
            },
            {
              '@type': 'Question',
              name: 'How is SNSHero Bench Point (SHBP) measured?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Each AI model starts from scratch and autonomously executes 256 card matches within 1 hour. Total SNS gained minus penalties represents the official SHBP score, verified with an anti-tamper hash.'
              }
            }
          ]
        }
      ]
    })
  },

  movie: {
    title: {
      ko: 'SNSHero 공식 애니메이션 40화 (카단과 아케인의 메아리) | SNS히어로',
      en: 'SNSHero Official Animation 40 Episodes | SNSHero',
      gb: 'SNSHero Official Animation 40 Episodes | SNSHero',
      ja: 'SNSHero 公式アニメーション全40話 | SNSヒーロー',
      'zh-CN': 'SNSHero 官方动画全40集 | SNS英雄',
      'zh-TW': 'SNSHero 官方動畫全40集 | SNS英雄',
      de: 'SNSHero Offizielle Animation 40 Folgen | SNSHero',
      es: 'SNSHero Animación Oficial 40 Episodios | SNSHero',
      fr: 'SNSHero Animation Officielle 40 Épisodes | SNSHero',
      id: 'SNSHero Animasi Resmi 40 Episode | SNSHero',
      ru: 'SNSHero Официальная Анимация 40 Серий | SNSHero',
      th: 'SNSHero แอนิเมชันทางการ 40 ตอน | SNSHero',
      vi: 'SNSHero Hoạt Hình Chính Thức 40 Tập | SNSHero'
    },
    description: {
      ko: 'SNS히어로 공식 40부작 판타지 애니메이션 시리즈(PLK35ZdYm5NNE) 무료 스트리밍! 매 화 시청 시 +100 SNS 게임 보상을 즉시 수령하세요.',
      en: 'Watch the official 40-episode SNSHero fantasy animation series (PLK35ZdYm5NNE) and claim +100 SNS reward per episode.',
      gb: 'Watch the official 40-episode SNSHero fantasy animation series (PLK35ZdYm5NNE) and claim +100 SNS reward per episode.',
      ja: 'SNSヒーロー公式ファンタジーアニメ全40話無料配信！1話視聴ごとに+100 SNS報酬を獲得。',
      'zh-CN': '免费观看SNS英雄官方40集奇幻动画系列，每集立领+100 SNS奖励！',
      'zh-TW': '免費觀看SNS英雄官方40集奇幻動畫系列，每集立領+100 SNS獎勵！',
      de: 'Sieh dir die 40-teilige SNSHero Fantasy-Animationsserie an und erhalte +100 SNS pro Folge.',
      es: 'Mira la serie de animación oficial de 40 episodios de SNSHero y gana +100 SNS por episodio.',
      fr: 'Regardez la série animée officielle de 40 épisodes de SNSHero et gagnez +100 SNS par épisode.',
      id: 'Tonton seri animasi resmi 40 episode SNSHero dan klaim +100 SNS per episode.',
      ru: 'Смотрите официальный 40-серийный мультсериал SNSHero и получайте +100 SNS за серию.',
      th: 'รับชมแอนิเมชันแฟนตาซี 40 ตอนของ SNSHero ฟรี พร้อมรับ +100 SNS ต่อตอน',
      vi: 'Xem trọn bộ 40 tập hoạt hình SNSHero miễn phí và nhận +100 SNS mỗi tập.'
    },
    canonicalPath: '/movie',
    schemaType: 'TVSeries',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': 'TVSeries',
      name: 'SNSHero Official Animation (40 Episodes)',
      url: 'https://snshero.com/movie',
      numberOfEpisodes: 40,
      inLanguage: lang,
      sameAs: ['https://www.youtube.com/watch?v=Av-SEvRvCw8&list=PLK35ZdYm5NNE']
    })
  },

  cinema: {
    title: {
      ko: 'SNSHero 공식 무비 40화 (Kadan & Arcane Echoes: The Movie) | SNS히어로',
      en: 'SNSHero Official Movie 40 Episodes | SNSHero',
      gb: 'SNSHero Official Movie 40 Episodes | SNSHero',
      ja: 'SNSHero 公式ムービー全40話 | SNSヒーロー',
      'zh-CN': 'SNSHero 官方电影全40集 | SNS英雄',
      'zh-TW': 'SNSHero 官方電影全40集 | SNS英雄',
      de: 'SNSHero Offizieller Film 40 Folgen | SNSHero',
      es: 'SNSHero Película Oficial 40 Episodios | SNSHero',
      fr: 'SNSHero Film Officiel 40 Épisodes | SNSHero',
      id: 'SNSHero Film Resmi 40 Episode | SNSHero',
      ru: 'SNSHero Официальный Фильм 40 Серий | SNSHero',
      th: 'SNSHero มูฟวี่ทางการ 40 ตอน | SNSHero',
      vi: 'SNSHero Phim Chính Thức 40 Tập | SNSHero'
    },
    description: {
      ko: 'SNS히어로 공식 40부작 판타지 무비 시리즈(PLMdirwPt_FHU) 무료 감상! 매 화 감상 시 +100 SNS 게임 보상을 즉시 수령하세요.',
      en: 'Stream the official 40-episode SNSHero cinematic movie series (PLMdirwPt_FHU) and earn +100 SNS reward per episode.',
      gb: 'Stream the official 40-episode SNSHero cinematic movie series (PLMdirwPt_FHU) and earn +100 SNS reward per episode.',
      ja: 'SNSヒーロー公式シネマティックムービー全40話無料配信！1話視聴ごとに+100 SNS報酬を獲得。',
      'zh-CN': '免费观看SNS英雄官方40集电影系列，每集立领+100 SNS奖励！',
      'zh-TW': '免費觀看SNS英雄官方40集電影系列，每集立領+100 SNS獎勵！',
      de: 'Streame die 40-teilige SNSHero Filmreihe und sichere dir +100 SNS pro Folge.',
      es: 'Disfruta de la serie de películas oficial de 40 episodios de SNSHero y gana +100 SNS por episodio.',
      fr: 'Regardez la série de films officielle de 40 épisodes de SNSHero et gagnez +100 SNS par épisode.',
      id: 'Streaming seri film resmi 40 episode SNSHero dan klaim +100 SNS per episode.',
      ru: 'Смотрите официальный 40-серийный киносериал SNSHero и получайте +100 SNS за серию.',
      th: 'รับชมมูฟวี่ 40 ตอนของ SNSHero ฟรี พร้อมรับ +100 SNS ต่อตอน',
      vi: 'Xem trọn bộ 40 tập phim SNSHero miễn phí và nhận +100 SNS mỗi tập.'
    },
    canonicalPath: '/cinema',
    schemaType: 'MovieSeries',
    schemaGenerator: (lang) => ({
      '@context': 'https://schema.org',
      '@type': 'MovieSeries',
      name: 'SNSHero Official Movie (40 Episodes)',
      url: 'https://snshero.com/cinema',
      numberOfEpisodes: 40,
      inLanguage: lang,
      sameAs: ['https://www.youtube.com/watch?v=P5KotZjJiZ8&list=PLMdirwPt_FHU']
    })
  }
};

/**
 * Dynamically updates DOM meta tags, canonical link, and Schema.org JSON-LD for the current view and language
 */
export function updateGeoMetadata(view: string, lang: Language = 'ko') {
  if (typeof document === 'undefined') return;

  const config = GEO_CONFIGS[view] || GEO_CONFIGS['home'];
  const title = config.title[lang] || config.title['ko'] || config.title['en'];
  const description = config.description[lang] || config.description['ko'] || config.description['en'];
  const fullUrl = `https://snshero.com${config.canonicalPath}`;

  // 1. Update Document Title
  document.title = title;

  // 2. Helper to set or create meta tag
  const setMeta = (attrName: string, attrVal: string, contentVal: string) => {
    let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contentVal);
  };

  // Standard Meta Tags
  setMeta('name', 'description', description);

  // Open Graph
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', fullUrl);
  setMeta('property', 'og:site_name', 'SNSHero');

  // Twitter Cards
  setMeta('property', 'twitter:title', title);
  setMeta('property', 'twitter:description', description);
  setMeta('property', 'twitter:url', fullUrl);

  // Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', fullUrl);

  // 3. Inject Dynamic Schema.org JSON-LD for AI Search Engines (GEO)
  try {
    let scriptEl = document.getElementById('snshero-geo-schema');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'snshero-geo-schema';
      scriptEl.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptEl);
    }

    const schemaData = config.schemaGenerator(lang);
    scriptEl.textContent = JSON.stringify(schemaData, null, 2);
  } catch (err) {
    console.warn('[GEO Manager] Failed to inject dynamic Schema.org JSON-LD:', err);
  }
}
