export type CommunityChannelPlatform = 'discord' | 'kakaotalk' | 'x' | 'youtube';
export type CommunityChannelStatus = 'active' | 'coming-soon';

export interface CommunityChannel {
  id: string;
  platform: CommunityChannelPlatform;
  nameKey: string;
  descKey: string;
  url?: string;
  languages: string[];
  status: CommunityChannelStatus;
  purpose: 'notice' | 'free-chat' | 'bug-report' | 'fan-art' | 'official-update' | 'media';
}

const COMMUNITY_CHANNEL_URLS = {
  discordMain: 'https://discord.gg/snshero',
  discordBugReport: 'https://discord.gg/snshero-bug',
  kakaoOpenChat: 'https://open.kakao.com/o/snshero',
  officialX: 'https://x.com/snshero',
  officialYouTube: 'https://youtube.com/@snshero',
} as const;

export const OFFICIAL_COMMUNITY_CHANNELS: CommunityChannel[] = [
  {
    id: 'discord-announcements',
    platform: 'discord',
    nameKey: 'official_channels_discord_notice_name',
    descKey: 'official_channels_discord_notice_desc',
    url: COMMUNITY_CHANNEL_URLS.discordMain,
    languages: ['ko', 'en'],
    status: 'active',
    purpose: 'notice',
  },
  {
    id: 'discord-official',
    platform: 'discord',
    nameKey: 'official_channels_discord_name',
    descKey: 'official_channels_discord_desc',
    url: COMMUNITY_CHANNEL_URLS.discordMain,
    languages: ['ko', 'en'],
    status: 'active',
    purpose: 'free-chat',
  },
  {
    id: 'discord-bug-report',
    platform: 'discord',
    nameKey: 'official_channels_discord_bug_name',
    descKey: 'official_channels_discord_bug_desc',
    url: COMMUNITY_CHANNEL_URLS.discordBugReport,
    languages: ['ko', 'en'],
    status: 'active',
    purpose: 'bug-report',
  },
  {
    id: 'discord-fan-art',
    platform: 'discord',
    nameKey: 'official_channels_discord_fanart_name',
    descKey: 'official_channels_discord_fanart_desc',
    url: COMMUNITY_CHANNEL_URLS.discordMain,
    languages: ['ko', 'en'],
    status: 'active',
    purpose: 'fan-art',
  },
  {
    id: 'kakao-openchat',
    platform: 'kakaotalk',
    nameKey: 'official_channels_kakao_name',
    descKey: 'official_channels_kakao_desc',
    url: COMMUNITY_CHANNEL_URLS.kakaoOpenChat,
    languages: ['ko'],
    status: 'active',
    purpose: 'free-chat',
  },
  {
    id: 'x-official',
    platform: 'x',
    nameKey: 'official_channels_x_name',
    descKey: 'official_channels_x_desc',
    url: COMMUNITY_CHANNEL_URLS.officialX,
    languages: ['ko', 'en'],
    status: 'active',
    purpose: 'official-update',
  },
  {
    id: 'youtube-official',
    platform: 'youtube',
    nameKey: 'official_channels_youtube_name',
    descKey: 'official_channels_youtube_desc',
    url: COMMUNITY_CHANNEL_URLS.officialYouTube,
    languages: ['ko', 'en'],
    status: 'active',
    purpose: 'media',
  },
];

const PLATFORM_ICON: Record<CommunityChannelPlatform, string> = {
  discord: '💬',
  kakaotalk: '💚',
  x: '𝕏',
  youtube: '▶️',
};

const PURPOSE_LABEL_KEY: Record<string, string> = {
  'notice': 'official_channels_purpose_notice',
  'free-chat': 'official_channels_purpose_free_chat',
  'bug-report': 'official_channels_purpose_bug_report',
  'fan-art': 'official_channels_purpose_fan_art',
  'official-update': 'official_channels_purpose_official_update',
  'media': 'official_channels_purpose_media',
};

export const getChannelIcon = (platform: CommunityChannelPlatform): string => {
  return PLATFORM_ICON[platform] || '🔗';
};

export const getChannelPurposeKey = (purpose: CommunityChannel['purpose']): string => {
  return PURPOSE_LABEL_KEY[purpose] || '';
};

export const isChannelAvailable = (channel: CommunityChannel): boolean => {
  return channel.status === 'active' && Boolean(channel.url);
};

/** 로컬 방문 기록 저장 */
const CLICK_STORAGE_KEY = 'hero_official_channel_clicks';

export interface ChannelClickRecord {
  channelId: string;
  timestamp: number;
  count: number;
}

export const getChannelClicks = (): Record<string, ChannelClickRecord> => {
  try {
    const raw = localStorage.getItem(CLICK_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ChannelClickRecord>;
  } catch {
    return {};
  }
};

export const recordChannelClick = (channelId: string): void => {
  try {
    const records = getChannelClicks();
    const existing = records[channelId];
    records[channelId] = {
      channelId,
      timestamp: Date.now(),
      count: (existing?.count ?? 0) + 1,
    };
    localStorage.setItem(CLICK_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage unavailable – silently ignore
  }
};

export const getChannelClickCount = (channelId: string): number => {
  const records = getChannelClicks();
  return records[channelId]?.count ?? 0;
};
