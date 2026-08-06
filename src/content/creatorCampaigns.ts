/**
 * Creator Campaign Mock Data
 * 관리자용 크리에이터/인플루언서 캠페인 코드 목록
 * 실제 운영 시 Firebase Firestore 또는 별도 관리자 패널로 대체
 */

export interface CreatorCampaign {
  code: string;
  campaignName: string;
  creatorName: string;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitch' | 'blog' | 'other';
  benefits: string[];
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  status: 'active' | 'expired' | 'paused' | 'upcoming';
  maxUses: number;
  currentUses: number;
  landingHighlights: {
    heroCardImageIndex?: number;
    introVideoUrl?: string;
    tagline: string;
  };
}

export const CREATOR_CAMPAIGNS: CreatorCampaign[] = [
  {
    code: 'HERO2026',
    campaignName: 'SNSHero Launch Campaign',
    creatorName: 'SNSHero Official',
    platform: 'other',
    benefits: [
      'creator_benefit_welcome_sns',
      'creator_benefit_exclusive_card',
      'creator_benefit_boost_pack',
    ],
    startDate: '2026-01-01',
    endDate: '2027-12-31',
    status: 'active',
    maxUses: 100000,
    currentUses: 12450,
    landingHighlights: {
      heroCardImageIndex: 1,
      tagline: 'creator_tagline_official',
    },
  },
  {
    code: 'GAMERKING',
    campaignName: 'GamerKing Special Event',
    creatorName: 'GamerKing',
    platform: 'youtube',
    benefits: [
      'creator_benefit_welcome_sns',
      'creator_benefit_rare_card_pack',
      'creator_benefit_exclusive_skin',
    ],
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    status: 'active',
    maxUses: 5000,
    currentUses: 2150,
    landingHighlights: {
      heroCardImageIndex: 42,
      tagline: 'creator_tagline_gamerking',
    },
  },
  {
    code: 'INSTAFAMOUS',
    campaignName: 'InstaFamous x SNSHero',
    creatorName: 'InstaFamous',
    platform: 'instagram',
    benefits: [
      'creator_benefit_welcome_sns_x2',
      'creator_benefit_exclusive_card',
    ],
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    status: 'active',
    maxUses: 3000,
    currentUses: 890,
    landingHighlights: {
      heroCardImageIndex: 55,
      tagline: 'creator_tagline_instafamous',
    },
  },
  {
    code: 'TIKTOKHERO',
    campaignName: 'TikTok Hero Challenge',
    creatorName: 'TikTokHero',
    platform: 'tiktok',
    benefits: [
      'creator_benefit_welcome_sns',
      'creator_benefit_boost_pack',
    ],
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    status: 'upcoming',
    maxUses: 10000,
    currentUses: 0,
    landingHighlights: {
      tagline: 'creator_tagline_tiktokhero',
    },
  },
  {
    code: 'EXPIRED2025',
    campaignName: 'Old Campaign (Expired)',
    creatorName: 'PastCreator',
    platform: 'youtube',
    benefits: [
      'creator_benefit_welcome_sns',
    ],
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'expired',
    maxUses: 1000,
    currentUses: 1000,
    landingHighlights: {
      tagline: 'creator_tagline_expired',
    },
  },
];

export function getCampaignByCode(code: string): CreatorCampaign | undefined {
  const normalized = code.toUpperCase().trim();
  return CREATOR_CAMPAIGNS.find((c) => c.code === normalized);
}

export type CreatorCampaignAvailability = 'active' | 'upcoming' | 'inactive';

export function getCampaignAvailability(
  campaign: CreatorCampaign,
): CreatorCampaignAvailability {
  const now = new Date();
  const startDate = new Date(campaign.startDate);
  const endDate = new Date(campaign.endDate);

  if (campaign.status === 'paused' || campaign.status === 'expired') {
    return 'inactive';
  }

  if (campaign.currentUses >= campaign.maxUses || now > endDate) {
    return 'inactive';
  }

  if (campaign.status === 'upcoming' || now < startDate) {
    return 'upcoming';
  }

  return 'active';
}

export function isCampaignActive(campaign: CreatorCampaign): boolean {
  return getCampaignAvailability(campaign) === 'active';
}

export function trackCreatorEvent(eventName: string, data?: Record<string, unknown>): void {
  try {
    console.debug('[creatorEvent]', eventName, data);
  } catch {
    // Ignore analytics errors
  }
}
