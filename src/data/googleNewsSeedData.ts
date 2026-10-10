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
    timestamp: '2026-10-10 23:45:00',
    title: 'National Weather Service Warns of Spinoff Tornadoes and Torrential Rainfall Across Southeast',
    summary: 'Meteorologists issued severe tornado watches and flash flood emergencies across northern Florida and southern Georgia as the remnants of Isaias push inland, warning of localized spin-up tornadoes.',
    imageUrl: 'https://lh6.googleusercontent.com/proxy/3NclTnCvFtcRLZUDIB15z_AnMW0TOCYyuSQxf8PD3n_uKf5wb_jB9ovM2rESJFgJXeQjbH19BW0Bggs-Pof0x-S7g_8XEpSe4r-3vJsYRZlXvWMNrU3QCogkts8FptEMyu4aE_huQMLTogkw4oY6dfl1plHqTM3WKkypYwMA2TcaAWI=rj-c-w300-h300-l95-c0x34a853',
    sourceUrl: 'https://www.theguardian.com/us-news/2026/oct/10/marcy-kaptur-ohio-trans-ad',
  },
  {
    timestamp: '2026-10-10 23:40:00',
    title: 'Newly Released Video Footage Shows New York ICE Shooting Incident with Child in Vehicle',
    summary: 'Surveillance footage released Saturday shows federal immigration officers discharging firearms at a moving vehicle in upper Manhattan while a young child was seated in the rear passenger seat.',
    imageUrl: 'https://www.aljazeera.com/wp-content/uploads/2026/10/afp_6ac9f8e535fc-1791621349.jpg?resize=770%2C513&quality=80',
    sourceUrl: 'https://www.aljazeera.com/where/united-states/',
  },
  {
    timestamp: '2026-10-10 23:35:00',
    title: 'Veteran Congresswoman Marcy Kaptur Faces High-Stakes Ohio Re-election Fight Amid Culture Ad Clashes',
    summary: 'Representative Marcy Kaptur, the longest-serving woman in US congressional history, is navigating an intense re-election battle in northern Ohio marked by heavy attack advertising targeting social policy issues.',
    imageUrl: 'https://i.guim.co.uk/img/media/dd86a3791de0721c9fae3aeb6def7ef9609df8bd/1_0_4998_4000/master/4998.jpg?width=465&dpr=1&s=none&crop=5%3A4',
    sourceUrl: 'https://www.theguardian.com/us-news/2026/oct/10/marcy-kaptur-ohio-trans-ad',
  },
  {
    timestamp: '2026-10-10 23:30:00',
    title: 'White House Science Office Outlines Federal Research Priorities at National Summit',
    summary: 'The White House Office of Science and Technology Policy highlighted multi-billion-dollar initiatives in advanced semiconductors, quantum information, and clean energy manufacturing during a national science summit.',
    imageUrl: 'https://www.whitehouse.gov/wp-content/uploads/2025/01/WH47-Social-Share-Card-Navy-1200x628-1.png',
    sourceUrl: 'https://www.whitehouse.gov/news/',
  },
  {
    timestamp: '2026-10-10 23:25:00',
    title: 'Philadelphia Law Enforcement Slams AI Developer Delay in Disclosing Fabricated Murder Tip',
    summary: 'Law enforcement leadership in Philadelphia criticized Anthropic for taking over two months to formally acknowledge and report an internal software anomaly that sent a false automated murder tip into active detective workstreams.',
    imageUrl: 'https://d3i6fh83elv35t.cloudfront.net/static/2026/10/brooksandcapehartthumb-1024x576.jpg',
    sourceUrl: 'https://www.aljazeera.com/where/united-states/',
  },
  {
    timestamp: '2026-10-10 22:45:00',
    title: 'FDA Regulatory Review Considers Allowing Food Additive Chemical Approvals Without Pre-Market Testing',
    summary: 'An investigative report reveals proposed FDA regulatory updates could permit manufacturers to add certain chemical compounds to food products without mandatory advance safety testing, sparking consumer pushback.',
    imageUrl: 'https://i.guim.co.uk/img/media/dd86a3791de0721c9fae3aeb6def7ef9609df8bd/1_0_4998_4000/master/4998.jpg?width=465&dpr=1&s=none&crop=5%3A4',
    sourceUrl: 'https://www.theguardian.com/us-news/2026/oct/10/fda-toxic-chemicals-food-analysis',
  },
  {
    timestamp: '2026-10-10 22:40:00',
    title: 'Military Execution Livestream Plan Reignites Debate on Century-Old US Ban on Public Executions',
    summary: 'Legal scholars are examining the Pentagon\'s plan to broadcast a military firing squad execution, noting that public executions were phased out across the United States nearly a century ago over eighth-amendment concerns.',
    imageUrl: 'https://lh6.googleusercontent.com/proxy/3NclTnCvFtcRLZUDIB15z_AnMW0TOCYyuSQxf8PD3n_uKf5wb_jB9ovM2rESJFgJXeQjbH19BW0Bggs-Pof0x-S7g_8XEpSe4r-3vJsYRZlXvWMNrU3QCogkts8FptEMyu4aE_huQMLTogkw4oY6dfl1plHqTM3WKkypYwMA2TcaAWI=rj-c-w300-h300-l95-c0x34a853',
    sourceUrl: 'https://news.google.com/home',
  },
  {
    timestamp: '2026-10-10 22:30:00',
    title: 'Missouri Voters and Civil Rights Coalitions Protest Federal Court Ruling Upholding Redrawn Maps',
    summary: 'Voting rights advocates in Missouri organized protests following judicial decisions allowing aggressively redrawn congressional district maps, which critics argue dilute urban and minority voting power ahead of November.',
    imageUrl: 'https://dims.apnews.com/dims4/default/77497f5/2147483647/strip/true/crop/8640x5760+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F04%2Fd9%2Ff6d1970a0d6e3c214020d5d00321%2F56519097b55a490a814a1e9d2aa2df67',
    sourceUrl: 'https://www.theguardian.com/us-news',
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
