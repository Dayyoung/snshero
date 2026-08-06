import { Language } from '../types';

export interface BgmTrack {
  id: string;
  name: Record<Language | string, string>;
  url: string;
  author: string;
}

export const BGM_TRACKS: BgmTrack[] = [
  {
    id: 'helix-1',
    name: {
      ko: '사운드 헬릭스 트랙 1',
      en: 'SoundHelix Song 1',
      'en-GB': 'SoundHelix Song 1',
      ja: 'SoundHelix ソング 1',
      'zh-CN': 'SoundHelix 歌曲 1',
      'zh-TW': 'SoundHelix 歌曲 1',
      de: 'SoundHelix Song 1',
      es: 'SoundHelix Canción 1',
      fr: 'SoundHelix Chanson 1',
      id: 'SoundHelix Lagu 1',
      ru: 'SoundHelix Песня 1',
      th: 'SoundHelix เพลง 1',
      vi: 'SoundHelix Bài hát 1'
    },
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    author: 'SoundHelix'
  },
  {
    id: 'helix-2',
    name: {
      ko: '사운드 헬릭스 트랙 2',
      en: 'SoundHelix Song 2',
      'en-GB': 'SoundHelix Song 2',
      ja: 'SoundHelix ソング 2',
      'zh-CN': 'SoundHelix 歌曲 2',
      'zh-TW': 'SoundHelix 歌曲 2',
      de: 'SoundHelix Song 2',
      es: 'SoundHelix Canción 2',
      fr: 'SoundHelix Chanson 2',
      id: 'SoundHelix Lagu 2',
      ru: 'SoundHelix Песня 2',
      th: 'SoundHelix เพลง 2',
      vi: 'SoundHelix Bài hát 2'
    },
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    author: 'SoundHelix'
  },
  {
    id: 'worldbeat',
    name: {
      ko: '게임 월드비트',
      en: 'Games Worldbeat',
      'en-GB': 'Games Worldbeat',
      ja: 'ゲーム・ワールドビート',
      'zh-CN': '游戏世界节奏',
      'zh-TW': '遊戲世界節奏',
      de: 'Spiele-Worldbeat',
      es: 'Ritmo del Mundo de Juegos',
      fr: 'Worldbeat de Jeu',
      id: 'Ketukan Dunia Game',
      ru: 'Игровой ворлдбит',
      th: '게임เวิลด์บีท',
      vi: 'Nhịp điệu thế giới game'
    },
    url: 'https://assets.mixkit.co/music/466/466.mp3',
    author: 'Bernardo R.'
  }
];
