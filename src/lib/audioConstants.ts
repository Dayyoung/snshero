import { Language } from '../types';

export interface BgmTrack {
  id: string;
  name: Record<Language | string, string>;
  url: string;
  author: string;
}

export const DEFAULT_BGM_TRACK_ID = 'worldbeat';

export const BGM_TRACKS: BgmTrack[] = [
  {
    id: 'worldbeat',
    name: {
      ko: '게임 월드비트 (공식 테마 BGM)',
      en: 'Games Worldbeat (Official Theme BGM)',
      'en-GB': 'Games Worldbeat (Official Theme BGM)',
      ja: 'ゲーム・ワールドビート (公式テーマ BGM)',
      'zh-CN': '游戏世界节奏 (官方主题 BGM)',
      'zh-TW': '遊戲世界節奏 (官方主題 BGM)',
      de: 'Spiele-Worldbeat (Offizieller Theme BGM)',
      es: 'Ritmo del Mundo de Juegos (BGM Tema Oficial)',
      fr: 'Worldbeat de Jeu (BGM Thème Officiel)',
      id: 'Ketukan Dunia Game (BGM Tema Resmi)',
      ru: 'Игровой ворлдбит (Официальный BGM)',
      th: 'เกมเวิลด์บีท (BGM ธีมทางการ)',
      vi: 'Nhịp điệu thế giới game (BGM chủ đề chính thức)'
    },
    url: '/mixkit-games-worldbeat-466.mp3',
    author: 'Bernardo R.'
  }
];

