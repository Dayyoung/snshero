/**
 * googleNewsSeedData.ts
 * 구글 뉴스(Google News US Edition) 스프레드시트 기반 실시간 뉴스 시드 데이터
 * 스프레드시트: https://docs.google.com/spreadsheets/d/1CT5Yy1-i6kkOfx3d-Yw1osOEYbN7fkk8IDiI8Vm82vM/edit
 */

import { RedditPost } from '../lib/reddit/redditTypes';

export interface RawGoogleNewsItem {
  timestamp: string;      // 수집일시 (e.g. 2026-10-10 10:45)
  title: string;          // 제목 (영어 원문)
  summary: string;        // 본문 요약 (영어 원문)
  imageUrl: string;       // 이미지 리스트
  sourceUrl: string;      // 원문 링크
}

export const INITIAL_GOOGLE_NEWS: RawGoogleNewsItem[] = [
  {
    timestamp: '2026-10-10 10:45',
    title: 'Hurricane Isaias lashes the US Gulf Coast with wind and rain as it nears the Florida Panhandle',
    summary: 'Hurricane Isaias closes in on the US Gulf Coast as a dangerous Category 3 hurricane, bringing severe wind and rain conditions to the Gulf Coast and Florida Panhandle.',
    imageUrl: 'https://lh6.googleusercontent.com/proxy/3NclTnCvFtcRLZUDIB15z_AnMW0TOCYyuSQxf8PD3n_uKf5wb_jB9ovM2rESJFgJXeQjbH19BW0Bggs-Pof0x-S7g_8XEpSe4r-3vJsYRZlXvWMNrU3QCogkts8FptEMyu4aE_huQMLTogkw4oY6dfl1plHqTM3WKkypYwMA2TcaAWI=rj-c-w300-h300-l95-c0x34a853',
    sourceUrl: 'https://apnews.com/us-news',
  },
  {
    timestamp: '2026-10-10 10:30',
    title: 'US Imposes New Sanctions on International Criminal Court (ICC)',
    summary: 'The United States has hit the International Criminal Court with severe sanctions hours after a former ICC judge was awarded the Nobel Peace Prize, pledging to dismantle it brick by brick without reforms.',
    imageUrl: 'https://lh3.googleusercontent.com//J6_coFbogxhRI9iM864NL_liGXvsQp2AupsKei7z0cNNfDvGUmWUy20nuUhkREQyrpY4bEeIBuc=rj-w300-h300-l95-c0xffffff',
    sourceUrl: 'https://www.cbsnews.com/us/',
  },
  {
    timestamp: '2026-10-10 09:45',
    title: 'Trump Announces Deal with Russia for Diesel Supply in Sharp Policy Reversal',
    summary: 'President Donald Trump announced an agreement with Russia to increase the supply of diesel fuel to US and global markets ahead of midterms, drawing sharp criticism from Ukraine and domestic lawmakers.',
    imageUrl: 'https://www.aljazeera.com/wp-content/uploads/2026/10/2026-10-09T213346Z_1147429410_RC2XZNAB7AFX_RTRMADP_3_USA-TRUMP-1791584205.jpg?resize=770%2C513&quality=80',
    sourceUrl: 'https://www.theguardian.com/us-news',
  },
  {
    timestamp: '2026-10-10 09:00',
    title: 'State Department Watchdog Probing Kimberly Guilfoyle Over Alleged Demand',
    summary: 'The State Department Inspector General is investigating Kimberly Guilfoyle following reports of an alleged $100,000 demand.',
    imageUrl: 'https://dims.apnews.com/dims4/default/87092ed/2147483647/strip/true/crop/8256x5504+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F8f%2F3a%2Fdea4a56f3c4839de5f8a787c32b0%2Facf009ec20d54628b1aca4cf9caa1479',
    sourceUrl: 'https://news.google.com/home',
  },
  {
    timestamp: '2026-10-10 08:30',
    title: 'Katie Zacharia Picked as New White House Press Secretary',
    summary: 'President Trump has announced Katie Zacharia as his pick to serve as the new White House press secretary.',
    imageUrl: 'https://a57.foxnews.com/static.foxnews.com/foxnews.com/content/uploads/2026/10/720/405/minnesota-state-capitol.jpg?tl=1&ve=1',
    sourceUrl: 'https://news.google.com/home',
  },
  {
    timestamp: '2026-10-10 07:15',
    title: 'Strong Panama Earthquake Rocks Region Disrupting Power and Air Travel',
    summary: 'A major earthquake struck Panama, causing damage to buildings and disruptions to electrical power grids and international flight traffic.',
    imageUrl: 'https://images.axios.com/pG6IM2wfGMgB7IBTumCz3grRDgQ=/0x0:5109x2874/1024x576/2026/10/09/1791578842045.jpeg',
    sourceUrl: 'https://www.axios.com/',
  },
];

/**
 * 도메인 추출 헬퍼
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'news.google.com';
  }
}

/**
 * 다양한 날짜/시간 문자열(ISO, YYYY-MM-DD HH:mm, 점/슬래시 구분자 등)을 안전하게 Unix timestamp(ms)로 파싱
 */
function parseTimestampSafe(raw: string, fallbackIdx: number): number {
  if (!raw || !raw.trim()) {
    return Date.now() - (fallbackIdx + 1) * 1000 * 60 * 30;
  }
  const clean = raw.trim();

  // 1. 표준 ISO / Date.parse 시도
  let parsed = Date.parse(clean);
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // 2. 공백을 'T'로 치환한 ISO 형식 시도 (예: "2026-10-10 10:45")
  parsed = Date.parse(clean.replace(' ', 'T'));
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // 3. 점/슬래시 구분자 정규화 후 시도 (예: "2026. 10. 10. 10:45")
  const normalized = clean.replace(/\./g, '-').replace(/\//g, '-').replace(/\s+/g, ' ');
  parsed = Date.parse(normalized);
  if (!isNaN(parsed) && parsed > 0) return parsed;

  parsed = Date.parse(normalized.replace(' ', 'T'));
  if (!isNaN(parsed) && parsed > 0) return parsed;

  return Date.now() - (fallbackIdx + 1) * 1000 * 60 * 30;
}

/**
 * RawGoogleNewsItem을 정규 RedditPost 모델로 변환
 */
export function convertGoogleNewsToRedditPost(item: RawGoogleNewsItem, idx: number): RedditPost {
  const domain = extractDomain(item.sourceUrl);
  
  // 타임스탬프 파싱 (최신순 정렬의 기준)
  const createdAt = parseTimestampSafe(item.timestamp, idx);
  const id = `gnews_${createdAt}_${idx}`;

  return {
    id,
    subreddit: 'news',
    subredditIcon: 'https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_48dp.png',
    title: item.title,
    originalTitle: item.title,
    body: item.summary,
    originalBody: item.summary,
    author: `GoogleNews_${domain.split('.')[0] || 'Bot'}`,
    authorAvatar: 'https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_48dp.png',
    createdAt,
    score: 8400 - idx * 650,
    commentCount: 320 - idx * 25,
    flair: { text: '구글뉴스 / Breaking', bgColor: '#DC2626', textColor: '#FFFFFF' },
    isOriginalContent: false,
    upvoteRatio: 0.94,
    media: item.imageUrl ? {
      type: 'image',
      url: item.imageUrl,
      domain,
    } : {
      type: 'link',
      url: item.sourceUrl,
      domain,
    },
    permalink: `/r/news/comments/${id}`,
  };
}
