import { Language } from '../types';

export interface BgmTrack {
  id: string;
  name: Record<Language | string, string>;
  url: string;
  author: string;
}

export const DEFAULT_BGM_TRACK_ID = 'title';

export const BGM_TRACKS: BgmTrack[] = [
  {
    id: 'title',
    name: {
      ko: '타이틀 테마 (Hero Awakening)',
      en: 'Title Theme (Hero Awakening)',
      'en-GB': 'Title Theme (Hero Awakening)',
      ja: 'タイトルテーマ (Hero Awakening)',
      'zh-CN': '主题曲 (Hero Awakening)',
      'zh-TW': '主題曲 (Hero Awakening)',
      de: 'Titelthema (Hero Awakening)',
      es: 'Tema Principal (Hero Awakening)',
      fr: 'Thème Principal (Hero Awakening)',
      id: 'Tema Utama (Hero Awakening)',
      ru: 'Главная тема (Hero Awakening)',
      th: 'ธีมหลัก (Hero Awakening)',
      vi: 'Nhạc chủ đề (Hero Awakening)'
    },
    url: '/bgm/hero-awakening.mp3',
    author: 'SNSHero Sound Engine'
  },
  {
    id: 'peace',
    name: {
      ko: '바람 속삭임 (Whispering Wind)',
      en: 'Whispering Wind (Peaceful)',
      'en-GB': 'Whispering Wind (Peaceful)',
      ja: '囁く風 (Whispering Wind)',
      'zh-CN': '微风轻拂 (Whispering Wind)',
      'zh-TW': '微風輕拂 (Whispering Wind)',
      de: 'Flüsternder Wind (Sanft)',
      es: 'Viento Susurrante (Paz)',
      fr: 'Vent Doux (Paisible)',
      id: 'Angin Berbisik (Tenang)',
      ru: 'Шелест ветра (Спокойствие)',
      th: 'สายลมแผ่วเบา (สงบ)',
      vi: 'Gió thì thầm (Thanh bình)'
    },
    url: '/bgm/whispering-wind.mp3',
    author: 'SNSHero Sound Engine'
  },
  {
    id: 'battle',
    name: {
      ko: '투기장 결투 (Colosseum Battle)',
      en: 'Colosseum Battle (Fast Beat)',
      'en-GB': 'Colosseum Battle (Fast Beat)',
      ja: '闘技場バトル (Colosseum)',
      'zh-CN': '竞技场决斗 (Colosseum)',
      'zh-TW': '競技場決鬥 (Colosseum)',
      de: 'Kolosseum (Schneller Beat)',
      es: 'Batalla en el Coliseo',
      fr: 'Combat du Colisée',
      id: 'Pertarungan Koloseum',
      ru: 'Битва в Колизее (Быстрый бит)',
      th: 'ศึกโคลอสเซียม',
      vi: 'Đấu trường La Mã (Nhịp nhanh)'
    },
    url: '/bgm/colosseum-battle.mp3',
    author: 'SNSHero Sound Engine'
  },
  {
    id: 'lobby',
    name: {
      ko: '영지 로비 (Sanctuary of Kadan)',
      en: 'Sanctuary Lobby (Kadan)',
      'en-GB': 'Sanctuary Lobby (Kadan)',
      ja: '聖域ロビー (Kadan Sanctuary)',
      'zh-CN': '圣域大厅 (Kadan Sanctuary)',
      'zh-TW': '聖域大廳 (Kadan Sanctuary)',
      de: 'Heiligtum (Kadan Sanctuary)',
      es: 'Santuario de Kadan (Lobby)',
      fr: 'Sanctuaire de Kadan (Lobby)',
      id: 'Lobi Santuari (Kadan Sanctuary)',
      ru: 'Святилище Кадана (Лобби)',
      th: 'วิหารคาดาน (Lobby)',
      vi: 'Sảnh Thánh địa (Kadan Sanctuary)'
    },
    url: '/bgm/sanctuary-lobby.mp3',
    author: 'SNSHero Sound Engine'
  }
];
