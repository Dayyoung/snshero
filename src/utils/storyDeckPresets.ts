export interface StoryDuelPreset {
  id: string;
  episodeNumber: number;
  titleKo: string;
  titleEn: string;
  rivalNameKo: string;
  rivalNameEn: string;
  rivalSubtitleKo: string;
  rivalSubtitleEn: string;
  quoteKo: string;
  quoteEn: string;
  backgroundTheme: 'snow' | 'wasteland' | 'fortress' | 'shadow';
  rivalCardIds: number[];
  playerRecommendCardIds: number[];
  rewardGold: number;
  rewardTicketCount: number;
}

export const STORY_DUEL_PRESETS: Record<string, StoryDuelPreset> = {
  ep08: {
    id: 'ep08',
    episodeNumber: 8,
    titleKo: '적갈기의 기수 vs 일곱 추적자',
    titleEn: 'Redmane Rider vs The Seven Pursuers',
    rivalNameKo: '추적자 바르가스',
    rivalNameEn: 'Pursuer Vargas',
    rivalSubtitleKo: '일곱 추적자의 선봉장',
    rivalSubtitleEn: 'Vanguard of Seven Pursuers',
    quoteKo: '붉은 갈기 황야를 건너는 자, 일곱 추적자의 맹세를 꺾지 못하리라.',
    quoteEn: 'None who cross the Redmane Waste shall break the oath of the Seven Pursuers.',
    backgroundTheme: 'wasteland',
    rivalCardIds: [48, 49, 44, 45, 42],
    playerRecommendCardIds: [41, 50, 43, 62, 90],
    rewardGold: 500,
    rewardTicketCount: 1,
  },
  ep01: {
    id: 'ep01',
    episodeNumber: 1,
    titleKo: '눈보라 아래 두 개의 맹세',
    titleEn: 'Two Oaths Beneath the Blizzard',
    rivalNameKo: '데스나이트 아르투스',
    rivalNameEn: 'Death Knight Artus',
    rivalSubtitleKo: '엘윈 설원의 망령 군주',
    rivalSubtitleEn: 'Wraith Lord of Elwyn Snowfield',
    quoteKo: '눈보라가 그치기 전에 결투를 받아들여라. 물러서는 순간 얼어붙을 뿐이다.',
    quoteEn: 'Accept the duel before the blizzard clears. Retreatment means instant freezing.',
    backgroundTheme: 'snow',
    rivalCardIds: [60, 58, 59, 55, 56],
    playerRecommendCardIds: [41, 50, 11, 1, 31],
    rewardGold: 500,
    rewardTicketCount: 1,
  },
  ep15: {
    id: 'ep15',
    episodeNumber: 15,
    titleKo: '서리 요새의 혈투',
    titleEn: 'Bloodline at Frost Citadel',
    rivalNameKo: '빙룡 발라카스',
    rivalNameEn: 'Frost Dragon Valakas',
    rivalSubtitleKo: '절대영도의 수호수',
    rivalSubtitleEn: 'Guardian of Absolute Zero',
    quoteKo: '서리 궁전의 성벽은 무너지지 않는다. 그대의 불꽃을 영원히 꺼뜨려 주마.',
    quoteEn: 'The citadel walls shall not fall. Thy flame shall be extinguished for eternity.',
    backgroundTheme: 'fortress',
    rivalCardIds: [10, 6, 7, 8, 9],
    playerRecommendCardIds: [20, 19, 43, 80, 41],
    rewardGold: 700,
    rewardTicketCount: 2,
  },
  ep24: {
    id: 'ep24',
    episodeNumber: 24,
    titleKo: '별빛 숲의 그림자',
    titleEn: 'Shadows in the Starlit Forest',
    rivalNameKo: '섀도우로드 말로크',
    rivalNameEn: 'Shadowlord Malok',
    rivalSubtitleKo: '심연의 잠식자',
    rivalSubtitleEn: 'Devourer of Abyss',
    quoteKo: '그림자에 삼켜진 자는 별빛의 서약을 보지 못하는 법.',
    quoteEn: 'Those consumed by the shadows can never perceive the covenant of stars.',
    backgroundTheme: 'shadow',
    rivalCardIds: [70, 68, 65, 66, 67],
    playerRecommendCardIds: [90, 62, 43, 41, 30],
    rewardGold: 600,
    rewardTicketCount: 1,
  },
};

export const getStoryDuelPreset = (id: string): StoryDuelPreset => {
  return STORY_DUEL_PRESETS[id] || STORY_DUEL_PRESETS.ep08;
};

export const getStoryDuelShareUrl = (presetId: string): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://snshero.com';
  return `${origin}/card-play?story_duel=${presetId}`;
};
