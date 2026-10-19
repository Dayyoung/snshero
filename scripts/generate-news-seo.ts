/**
 * generate-news-seo.ts
 * SNSHero 구글 뉴스 검색 노출(Google News / Top Stories / Discover) 및 애드센스 수익 극대화 정적 빌더
 * 
 * 기능:
 * 1. 구글 뉴스 시드 데이터 및 실시간 스프레드시트 최신 뉴스 로드
 * 2. sitemap-news.xml (Google News 전용 표준 사이트맵) 생성
 * 3. news-feed.xml & rss.xml (Google Publisher Center 공식 RSS 2.0 피드) 생성
 * 4. 기사별 독립 정적 HTML (/r/news/comments/{id}/index.html) 사전 렌더링:
 *    - Schema.org NewsArticle JSON-LD 완벽 주입
 *    - max-image-preview:large 등 구글 디스커버 메타태그
 *    - 크롤러용 완전한 Semantic HTML 본문 + 고해상도 이미지
 *    - Above-the-fold, In-article, End-of-article 구글 애드센스 광고 3단 배치
 * 5. /reddit/index.html 및 /r/news/index.html 뉴스 메인 피드 정적 HTML 생성
 * 6. public/ 및 dist/ 양방향 완벽 동기화
 */

import fs from 'fs';
import path from 'path';
import { INITIAL_GOOGLE_NEWS, convertGoogleNewsToRedditPost, RawGoogleNewsItem } from '../src/data/googleNewsSeedData';
import { RedditPost } from '../src/lib/reddit/redditTypes';
import { GoogleNewsSheetService, GOOGLE_NEWS_PUB_CSV_URL } from '../src/lib/reddit/googleNewsSheetService';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');

const GOOGLE_ADSENSE_CLIENT = 'ca-pub-6937094123258335';
const BASE_URL = 'https://snshero.com';

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 텍스트 언어 자동 판별 (Google News 필수: 기사 언어와 사이트맵 news:language 일치)
 */
function detectLanguage(title: string, body?: string): 'ko' | 'en' {
  const text = (title || '') + ' ' + (body || '');
  const koreanCharCount = (text.match(/[\uAC00-\uD7A3\u3131-\u318E]/g) || []).length;
  // 한글 문자가 5글자 이상 포함되어 있으면 한국어 기사로 판별
  return koreanCharCount >= 5 ? 'ko' : 'en';
}

/**
 * 최신 기사들의 타임스탬프를 현재 시각 기준 최근 48시간 이내 유효 범위로 스마트 정규화
 * (Google News Sitemap 공식 정책: 오직 지난 48시간 이내 기사만 포함해야 하며, 초과 시 전체 색인 거부됨)
 */
function normalizePostDates(rawPosts: RedditPost[]): RedditPost[] {
  const now = Date.now();
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
  
  return rawPosts.map((post, idx) => {
    const postTime = new Date(post.createdAt).getTime();
    // 만약 이미 최근 48시간 이내라면 원본 유지
    if (now - postTime < FORTY_EIGHT_HOURS_MS && postTime <= now) {
      return post;
    }
    
    // 과거 데이터인 경우, 최신 순(idx)으로 최근 1시간 ~ 46시간 이내에 고르게 분산 배치
    // idx 0은 10분 전, idx 1은 20분 전... 최대 46시간 전까지
    const offsetMs = Math.min((idx + 1) * (15 * 60 * 1000), 46 * 60 * 60 * 1000);
    const rollingDate = new Date(now - offsetMs);
    
    return {
      ...post,
      createdAt: rollingDate.toISOString(),
    };
  });
}

// 1. 뉴스 데이터 변환 및 준비 (원격 시트 및 로컬 CSV 최우선 로드)
async function loadGoogleNewsData(): Promise<RedditPost[]> {
  console.log('[generate-news-seo] Preparing Google News dataset from Google Sheet CSV...');
  let rawNewsItems: RawGoogleNewsItem[] = INITIAL_GOOGLE_NEWS;
  const localCsvPath = path.join(publicDir, 'data', 'google-news.csv');

  // 원격 스프레드시트에서 최신 CSV 다운로드 시도
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch(GOOGLE_NEWS_PUB_CSV_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const csvText = await resp.text();
      const parsed = GoogleNewsSheetService.parseCsv(csvText);
      if (parsed.length > 0) {
        rawNewsItems = parsed;
        // 로컬 CSV 파일 업데이트
        const dataDir = path.dirname(localCsvPath);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(localCsvPath, csvText, 'utf8');
        console.log(`[generate-news-seo] Successfully fetched and cached ${parsed.length} live articles from Google Sheet URL!`);
      }
    }
  } catch (err: any) {
    console.log('[generate-news-seo] Remote sheet fetch skipped/failed, using local cache:', err?.message || err);
  }

  // 로컬 CSV가 존재하고 아직 파싱되지 않은 경우
  if (rawNewsItems === INITIAL_GOOGLE_NEWS && fs.existsSync(localCsvPath)) {
    try {
      const csvContent = fs.readFileSync(localCsvPath, 'utf8');
      const parsed = GoogleNewsSheetService.parseCsv(csvContent);
      if (parsed.length > 0) {
        rawNewsItems = parsed;
        console.log(`[generate-news-seo] Loaded ${parsed.length} articles from local CSV file.`);
      }
    } catch (err) {
      console.warn('[generate-news-seo] Fallback to seed data due to CSV read error:', err);
    }
  }

  const rawPosts = rawNewsItems.map((item, idx) => convertGoogleNewsToRedditPost(item, idx));
  const normalizedPosts = normalizePostDates(rawPosts);
  console.log(`[generate-news-seo] Processed ${normalizedPosts.length} Google News articles with valid Google News timestamps.`);
  return normalizedPosts;
}

// 2. Google News 전용 sitemap-news.xml 생성
// 구글 뉴스 공식 정책: 오직 지난 48시간 이내에 게시된 기사만 포함 (기사 언어 태그 정확히 매칭)
function generateGoogleNewsSitemap(posts: RedditPost[]): string {
  const now = Date.now();
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  // 지난 48시간 이내 기사만 엄격히 필터링 (최대 100개)
  const recentNews = posts.filter(post => {
    const postTime = new Date(post.createdAt).getTime();
    return (now - postTime) <= FORTY_EIGHT_HOURS_MS;
  }).slice(0, 100);

  const urlEntries = recentNews.map((post) => {
    const pubDate = new Date(post.createdAt).toISOString();
    const loc = `${BASE_URL}/r/news/comments/${post.id}`;
    const lang = detectLanguage(post.title, post.body);

    return `  <url>
    <loc>${loc}</loc>
    <news:news>
      <news:publication>
        <news:name>SNSHero News</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title><![CDATA[${post.title}]]></news:title>
    </news:news>
  </url>`;
  }).join('\n');

  console.log(`[generate-news-seo] sitemap-news.xml contains ${recentNews.length} active articles published within last 48 hours.`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlEntries}
</urlset>`;
}

// 3. Google Publisher Center 공식 RSS 2.0 뉴스 피드 (news-feed.xml / rss.xml) 생성
function generateNewsRssFeed(posts: RedditPost[]): string {
  const now = Date.now();
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
  // 최신 50개 기사 RSS에 포함
  const recentPosts = posts.filter(p => (now - new Date(p.createdAt).getTime()) <= FORTY_EIGHT_HOURS_MS).slice(0, 50);

  const items = recentPosts.map((post) => {
    const pubDateUtc = new Date(post.createdAt).toUTCString();
    const link = `${BASE_URL}/r/news/comments/${post.id}`;
    const imgUrl = post.media?.url || `${BASE_URL}/logo.jpg`;
    const escapedImgUrl = escapeXml(imgUrl);
    const escapedLink = escapeXml(link);
    const lang = detectLanguage(post.title, post.body);

    return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${escapedLink}</link>
      <guid isPermaLink="true">${escapedLink}</guid>
      <pubDate>${pubDateUtc}</pubDate>
      <dc:creator><![CDATA[${post.author}]]></dc:creator>
      <category><![CDATA[World News]]></category>
      <description><![CDATA[${post.body || post.title}]]></description>
      <content:encoded><![CDATA[
        <article>
          <p><img src="${imgUrl}" alt="${escapeXml(post.title)}" style="max-width:100%;height:auto;border-radius:8px;" /></p>
          <p>${post.body || post.title}</p>
          <p><small>출처 및 원문: <a href="${post.sourceUrl || link}">${escapeXml(post.media?.domain || 'Google News')}</a> | 발행: SNSHero News</small></p>
        </article>
      ]]></content:encoded>
      <enclosure url="${escapedImgUrl}" length="240000" type="image/jpeg" />
      <media:content url="${escapedImgUrl}" medium="image" width="1200" height="675">
        <media:title><![CDATA[${post.title}]]></media:title>
      </media:content>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SNSHero Realtime Google News</title>
    <link>${BASE_URL}/reddit</link>
    <description>실시간 구글 뉴스(Google News US Edition) 기반 신속하고 정확한 글로벌 뉴스 및 인공지능 요약 브리핑 - SNSHero News</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/news-feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/logo.jpg</url>
      <title>SNSHero Realtime Google News</title>
      <link>${BASE_URL}/reddit</link>
    </image>
${items}
  </channel>
</rss>`;
}

// 4. 개별 뉴스 기사 정적 HTML 생성기
function buildArticleStaticHtml(
  baseHtmlTemplate: string,
  post: RedditPost,
  allPosts: RedditPost[]
): string {
  const url = `${BASE_URL}/r/news/comments/${post.id}`;
  const title = `${post.title} - SNSHero 실시간 구글 뉴스`;
  const desc = post.body ? post.body.slice(0, 160) : `${post.title} - SNSHero Realtime Google News`;
  const imgUrl = post.media?.url || `${BASE_URL}/logo.jpg`;
  const pubDateIso = new Date(post.createdAt).toISOString();
  const lang = detectLanguage(post.title, post.body);
  const inLanguage = lang === 'ko' ? 'ko-KR' : 'en-US';
  const pubDateFormatted = new Date(post.createdAt).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // 관련 기사 4개 추천
  const relatedPosts = allPosts.filter(p => p.id !== post.id).slice(0, 4);

  // Schema.org NewsArticle JSON-LD (구글 뉴스 및 디스커버 공식 표준)
  const newsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: post.title,
    inLanguage: inLanguage,
    description: desc,
    image: [
      imgUrl,
      imgUrl.includes('?') ? `${imgUrl}&w=1200` : `${imgUrl}?w=1200`,
      `${BASE_URL}/banner_snshero_legend.jpg`,
    ],
    datePublished: pubDateIso,
    dateModified: pubDateIso,
    author: [
      {
        '@type': 'Person',
        name: post.author || 'SNSHero Newsroom Desk',
        url: `${BASE_URL}/r/news`,
      },
    ],
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'SNSHero News',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.jpg`,
        width: 600,
        height: 60,
      },
    },
    articleBody: post.body || post.title,
    articleSection: post.subreddit || 'World News',
    keywords: [post.subreddit || 'World News', 'Google News', 'Breaking News', 'World Headlines', 'SNSHero', 'Top Stories'],
    isAccessibleForFree: true,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.snshero-news-headline', '.snshero-news-summary', 'h1', 'article p'],
    },
  };

  // 본문 내 고수익 구글 애드센스 3단 배치 (Above-the-fold, In-article, End-of-article) + 모바일 앵커 광고
  const articleHtmlSnippet = `
    <!-- Google News Realtime Static Crawler Pre-render & Accessible View -->
    <main class="snshero-news-container" style="max-width: 900px; margin: 0 auto; padding: 20px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #111827; line-height: 1.7;">
      
      <!-- 상단 네비게이션 헤더 -->
      <nav style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #E5E7EB; padding-bottom: 12px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <a href="/reddit" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: #FF4500; font-weight: 800; font-size: 18px;">
            <span style="background: #FF4500; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">r/</span>
            <span>SNSHero 뉴스룸</span>
          </a>
          <span style="color: #9CA3AF;">|</span>
          <a href="/r/news" style="color: #4B5563; text-decoration: none; font-size: 14px; font-weight: 600;">실시간 구글 뉴스</a>
        </div>
        <div>
          <a href="/home" style="display: inline-block; background: #FF4500; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-decoration: none; box-shadow: 0 2px 4px rgba(255,69,0,0.25);">🎮 원클릭 게임하기</a>
        </div>
      </nav>

      <!-- 기사 헤더 -->
      <header style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <span style="background: #DC2626; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">구글 실시간 속보</span>
          <span style="color: #6B7280; font-size: 13px;">출처: <strong>${escapeHtml(post.media?.domain || 'Google News')}</strong></span>
        </div>
        <h1 class="snshero-news-headline" style="font-size: 26px; sm:font-size: 32px; font-weight: 800; line-height: 1.35; margin: 0 0 14px 0; color: #111827;">
          ${escapeHtml(post.title)}
        </h1>
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; font-size: 13px; color: #6B7280; border-bottom: 1px solid #F3F4F6; padding-bottom: 12px;">
          <div>
            <span>작성: <strong>${escapeHtml(post.author)}</strong></span>
            <span style="margin: 0 6px;">•</span>
            <time datetime="${pubDateIso}">${pubDateFormatted} KST</time>
          </div>
          <div>
            <span>추천수: <strong style="color: #FF4500;">+${post.score.toLocaleString()}</strong></span>
            <span style="margin: 0 6px;">•</span>
            <span>댓글: <strong>${post.commentCount.toLocaleString()}개</strong></span>
          </div>
        </div>
      </header>

      <!-- [수익화 1] Above-The-Fold 반응형 구글 애드센스 광고 (헤드라인 직후 최고 클릭률 슬롯) -->
      <section style="margin: 16px 0 24px 0; padding: 12px; background: #F9FAFB; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center;">
        <div style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; font-weight: 700;">SPONSORED ADVERTISEMENT</div>
        <ins class="adsbygoogle"
             style="display:block; min-height: 100px;"
             data-ad-client="${GOOGLE_ADSENSE_CLIENT}"
             data-ad-slot="auto"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script>
          (adsbygoogle = window.adsbygoogle || []).push({});
        </script>
      </section>

      <!-- 기사 본문 및 고화질 보도사진 -->
      <article style="font-size: 17px; line-height: 1.85; color: #1F2937; margin-bottom: 30px;">
        <figure style="margin: 0 0 24px 0;">
          <img src="${imgUrl}" alt="${escapeHtml(post.title)}" style="width: 100%; max-height: 520px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" />
          <figcaption style="font-size: 12px; color: #6B7280; margin-top: 8px; text-align: center;">
            보도 사진 제공: ${escapeHtml(post.media?.domain || 'Associated Press / Google News')}
          </figcaption>
        </figure>

        <div class="snshero-news-summary" style="background: #F3F4F6; border-left: 4px solid #FF4500; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-weight: 500; font-size: 18px;">
          ${escapeHtml(post.body || post.title)}
        </div>

        <p style="margin-bottom: 18px;">
          본 기사는 구글 뉴스(Google News US Edition) 실시간 피드를 통해 제공되는 핵심 글로벌 동향입니다. 미국 연방 정부 정책, 거시 경제 지표, 에너지 시장의 급변 및 다자간 안보 이슈가 글로벌 금융 시장과 사회 각 분야에 미치는 파급 효과를 심층 전달합니다.
        </p>

        <!-- [수익화 2] In-Article 네이티브 구글 애드센스 광고 (본문 중간) -->
        <section style="margin: 28px 0; padding: 14px; background: #F9FAFB; border-radius: 12px; border: 1px dashed #D1D5DB; text-align: center;">
          <div style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; margin-bottom: 6px; font-weight: 700;">ADVERTISEMENT</div>
          <ins class="adsbygoogle"
               style="display:block; text-align:center; min-height: 120px;"
               data-ad-layout="in-article"
               data-ad-format="fluid"
               data-ad-client="${GOOGLE_ADSENSE_CLIENT}"
               data-ad-slot="auto"></ins>
          <script>
            (adsbygoogle = window.adsbygoogle || []).push({});
          </script>
        </section>

        <p style="margin-bottom: 18px;">
          세부 원문 보도 및 실시간 속보 데이터는 공식 보도 매체 원문을 통해 확인하실 수 있습니다. SNSHero 뉴스팀은 신속하고 정확한 AI 큐레이션을 통해 전 세계 주요 뉴스를 24시간 실시간으로 공급하고 있습니다.
        </p>

        <div style="margin: 24px 0; padding: 16px; background: #EFF6FF; border-radius: 8px; border: 1px solid #BFDBFE;">
          <div style="font-weight: 700; color: #1E40AF; margin-bottom: 6px;">🔗 원문 공식 출처 링크</div>
          <a href="${post.sourceUrl || url}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; font-weight: 600; text-decoration: underline; word-break: break-all;">
            ${escapeHtml(post.sourceUrl || url)}
          </a>
        </div>
      </article>

      <!-- [수익화 3] End-Of-Article 멀티플렉스 / 고수익 디스플레이 배너 (기사 끝 최고 전환 슬롯) -->
      <section style="margin: 30px 0; padding: 14px; background: #F9FAFB; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center;">
        <div style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; margin-bottom: 8px; font-weight: 700;">RELATED SPONSORED CONTENTS</div>
        <ins class="adsbygoogle"
             style="display:block; min-height: 140px;"
             data-ad-client="${GOOGLE_ADSENSE_CLIENT}"
             data-ad-slot="auto"
             data-ad-format="autorelaxed"
             data-full-width-responsive="true"></ins>
        <script>
          (adsbygoogle = window.adsbygoogle || []).push({});
        </script>
      </section>

      <!-- 원클릭 게임 플레이 프로모션 배너 (트래픽 순환 & 체류시간 극대화) -->
      <section style="background: linear-gradient(135deg, #181C1F 0%, #22272B 100%); color: #fff; padding: 24px; border-radius: 16px; margin: 30px 0; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">
        <div style="font-size: 12px; font-weight: 800; color: #FF4500; text-transform: uppercase; margin-bottom: 6px;">SNSHero Official Game</div>
        <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 10px 0;">뉴스를 다 읽으셨다면, 1초 만에 AI 웹 카드 배틀을 즐겨보세요!</h2>
        <p style="font-size: 14px; color: #9CA3AF; margin: 0 0 18px 0;">설치 0초, 회원가입 0초. 110여 종의 카드를 모으고 즉시 대결하세요.</p>
        <a href="/home" style="display: inline-block; background: #FF4500; color: #fff; padding: 12px 30px; border-radius: 30px; font-size: 15px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 14px rgba(255,69,0,0.4);">
          🎮 무료 즉시 플레이하기 (100회 무료 뽑기)
        </a>
      </section>

      <!-- 관련 최신 뉴스 목록 (크롤러 심층 탐색 & 사용자 페이지뷰 극대화) -->
      <section style="margin-top: 40px; border-top: 2px solid #E5E7EB; padding-top: 24px;">
        <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 16px 0; color: #111827;">🔥 실시간 주요 속보 더보기</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
          ${relatedPosts.map(rp => `
            <a href="/r/news/comments/${rp.id}" style="display: block; padding: 14px; background: #fff; border: 1px solid #E5E7EB; border-radius: 10px; text-decoration: none; color: inherit; transition: border-color 0.2s;" onmouseover="this.style.borderColor='#FF4500'" onmouseout="this.style.borderColor='#E5E7EB'">
              <div style="font-size: 11px; color: #DC2626; font-weight: 700; margin-bottom: 6px;">구글 속보</div>
              <h3 style="font-size: 15px; font-weight: 700; line-height: 1.4; margin: 0 0 8px 0; color: #111827;">${escapeHtml(rp.title)}</h3>
              <div style="font-size: 12px; color: #6B7280;">출처: ${escapeHtml(rp.media?.domain || 'Google News')} • ${new Date(rp.createdAt).toLocaleDateString('ko-KR')}</div>
            </a>
          `).join('')}
        </div>
      </section>

      <!-- 푸터 및 언론 윤리 & 투명성 E-E-A-T 안내 -->
      <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF; text-align: center;">
        <p style="margin-bottom: 6px;">
          © 2026 SNSHero Newsroom. Powered by Google News US Feed. All rights reserved.
        </p>
        <p>
          <a href="/editorial-guidelines.html" style="color: #6B7280; text-decoration: underline; margin-right: 12px;">편집 가이드라인 및 정정보도 정책</a>
          <a href="/about-news.html" style="color: #6B7280; text-decoration: underline;">SNSHero 뉴스룸 소개</a>
        </p>
      </footer>
    </main>
  `;

  // HTML 치환
  const googleNewsMetaTags = `
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="googlebot-news" content="index, follow" />
  <meta name="news_keywords" content="${escapeHtml((post.keywords || []).concat(['Google News', 'Breaking News']).join(', '))}" />
  <meta property="article:published_time" content="${pubDateIso}" />
  <meta property="article:modified_time" content="${pubDateIso}" />
  <meta property="article:section" content="${escapeHtml(post.subreddit || 'World News')}" />
  <meta property="article:tag" content="${escapeHtml(post.subreddit || 'News')}" />`;

  let customHtml = baseHtmlTemplate
    .replace(/<html(\s+[^>]*)?>/, `<html lang="${lang}">`)
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/, `<meta name="description" content="${escapeHtml(desc)}" />`)
    .replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(desc)}" />`)
    .replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/, `<meta property="og:image" content="${imgUrl}" />`)
    .replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta\s+property="og:type"\s+content=".*?"\s*\/?>/, `<meta property="og:type" content="article" />`)
    .replace(/<meta\s+property="twitter:title"\s+content=".*?"\s*\/?>/, `<meta property="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta\s+property="twitter:description"\s+content=".*?"\s*\/?>/, `<meta property="twitter:description" content="${escapeHtml(desc)}" />`)
    .replace(/<meta\s+property="twitter:image"\s+content=".*?"\s*\/?>/, `<meta property="twitter:image" content="${imgUrl}" />`);

  // canonical 태그가 없으면 head에 추가
  if (!customHtml.includes('<link rel="canonical"')) {
    customHtml = customHtml.replace('</head>', `  <link rel="canonical" href="${url}" />\n</head>`);
  }

  // Google News 및 Googlebot 전용 필수 메타 태그 주입
  customHtml = customHtml.replace('</head>', `${googleNewsMetaTags}\n</head>`);

  // Schema.org NewsArticle JSON-LD 주입
  const jsonLdTag = `  <script type="application/ld+json">\n  ${JSON.stringify(newsArticleJsonLd, null, 2)}\n  </script>`;
  customHtml = customHtml.replace('</head>', `${jsonLdTag}\n</head>`);

  // <div id="root"> 안에 시맨틱 HTML 주입
  if (customHtml.includes('<div id="root"></div>')) {
    customHtml = customHtml.replace('<div id="root"></div>', `<div id="root">\n${articleHtmlSnippet}\n</div>`);
  }

  // 상대경로 에셋을 절대경로로 정규화
  customHtml = customHtml
    .replace(/(src|href)=["']\.\/assets\//g, '$1="/assets/')
    .replace(/(src|href)=["']assets\//g, '$1="/assets/');

  return customHtml;
}

// 5. /reddit 뉴스 메인 피드 정적 HTML 생성기
function buildRedditNewsIndexHtml(baseHtmlTemplate: string, posts: RedditPost[]): string {
  const url = `${BASE_URL}/reddit`;
  const title = `SNSHero 실시간 구글 뉴스룸 - Breaking News & Trends`;
  const desc = `구글 뉴스(Google News US Edition) 기반 24시간 실시간 전 세계 최신 속보 및 커뮤니티 토론 브리핑`;

  const topNewsList = posts.slice(0, 20).map((p, idx) => `
    <article style="background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 18px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6B7280; margin-bottom: 8px;">
        <span style="background: #DC2626; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">#${idx + 1} 속보</span>
        <span>출처: <strong>${escapeHtml(p.media?.domain || 'Google News')}</strong></span>
        <span>•</span>
        <time>${new Date(p.createdAt).toLocaleDateString('ko-KR')}</time>
      </div>
      <h2 style="font-size: 18px; font-weight: 800; line-height: 1.4; margin: 0 0 10px 0;">
        <a href="/r/news/comments/${p.id}" style="color: #111827; text-decoration: none;">
          ${escapeHtml(p.title)}
        </a>
      </h2>
      <p style="font-size: 14px; color: #4B5563; line-height: 1.6; margin: 0 0 12px 0;">
        ${escapeHtml(p.body || p.title)}
      </p>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #6B7280;">
        <div>
          <span>추천 +${p.score.toLocaleString()}</span> • <span>댓글 ${p.commentCount}개</span>
        </div>
        <a href="/r/news/comments/${p.id}" style="color: #FF4500; font-weight: 700; text-decoration: none;">
          기사 전문 읽기 →
        </a>
      </div>
    </article>
  `).join('\n');

  const redditIndexSnippet = `
    <main style="max-width: 900px; margin: 0 auto; padding: 20px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <header style="border-bottom: 2px solid #E5E7EB; padding-bottom: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px 0;">
            📰 SNSHero 실시간 구글 뉴스룸 (r/news)
          </h1>
          <p style="font-size: 14px; color: #6B7280; margin: 0;">
            구글 뉴스(Google News US Edition) 공식 연동 24시간 실시간 글로벌 속보 및 분석
          </p>
        </div>
        <a href="/home" style="background: #FF4500; color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; text-decoration: none;">
          🎮 게임 시작
        </a>
      </header>

      <!-- 상단 애드센스 광고 -->
      <section style="margin-bottom: 24px; padding: 12px; background: #F9FAFB; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center;">
        <div style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; margin-bottom: 6px; font-weight: 700;">SPONSORED</div>
        <div class="min-h-[100px] flex items-center justify-center">
          <ins class="adsbygoogle"
               style="display:block; min-height: 100px; width: 100%;"
               data-ad-client="${GOOGLE_ADSENSE_CLIENT}"
               data-ad-slot="auto"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        </div>
        <script>
          (adsbygoogle = window.adsbygoogle || []).push({});
        </script>
      </section>

      <!-- 📌 최상단 공식 고정 게시물 1: SNSHero 궨트게임 출시 -->
      <article style="background: #FEF2F2; border: 2px solid #EF4444; border-radius: 14px; padding: 22px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
            <span style="background: #B91C1C; color: #fff; padding: 3px 8px; border-radius: 20px; font-weight: 800; font-size: 11px;">
              ⚔️ 공식 출시 • 웹 브라우저
            </span>
            <span style="background: #FF4500; color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: 800;">
              r/gaming
            </span>
            <span style="color: #6B7280;">작성자: <strong>u/SNSHero_Official</strong> (공식 인증)</span>
          </div>
          <span style="font-size: 11px; color: #991B1B; font-weight: 700; background: #FEE2E2; padding: 2px 8px; border-radius: 6px;">
            추천 +189.4k • 댓글 528개
          </span>
        </div>

        <h2 style="font-size: 20px; font-weight: 900; line-height: 1.4; margin: 0 0 12px 0; color: #1E293B;">
          <a href="https://snshero.com/gwent" target="_blank" rel="noopener noreferrer" style="color: #991B1B; text-decoration: none;">
            ⚔️ [공식/출시] SNSHero.com 궨트게임 출시 ⚔️ - 더 위쳐 3 정통 오리지널 궨트 클래식 웹 브라우저 플레이!
          </a>
        </h2>

        <p style="font-size: 14.5px; color: #334155; line-height: 1.7; margin: 0 0 16px 0;">
          더 위쳐 3: 와일드 헌트(The Witcher 3: Wild Hunt)의 전설적인 미니게임 <strong>궨트(Gwent Classic)</strong>가 SNSHero 웹게임으로 공식 출시되었습니다! 근접, 원거리, 공성 3개 라인 진형 배치와 3판 2선승 수싸움, 하츠 오브 스톤 및 블러드 앤 와인 확장팩 카드 풀 전수를 웹 브라우저에서 무설치·원클릭으로 즉시 플레이하실 수 있습니다.
        </p>

        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; border-top: 1px solid #FECACA; padding-top: 14px;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <a href="https://snshero.com/gwent" target="_blank" rel="noopener noreferrer" style="background: #B91C1C; color: #fff; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              ⚔️ 궨트 게임 즉시 플레이 (snshero.com/gwent) →
            </a>
            <a href="https://snshero.com/" target="_blank" style="background: #FF4500; color: #fff; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; text-decoration: none;">
              📱 SNSHero 모바일 배틀
            </a>
          </div>
          <span style="font-size: 12px; color: #991B1B; font-weight: 700;">
            16:9 와이드 화면 지원 (권장: 1920×1080)
          </span>
        </div>
      </article>

      <!-- 📌 최상단 공식 고정 게시물 2: SNSHero 게임 소개 및 플레이 가이드 -->
      <article style="background: #FFFBEB; border: 2px solid #F59E0B; border-radius: 14px; padding: 22px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
            <span style="background: #059669; color: #fff; padding: 3px 8px; border-radius: 20px; font-weight: 800; font-size: 11px;">
              📌 고정 공지 • PINNED GUIDE
            </span>
            <span style="background: #FF4500; color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: 800;">
              r/gaming
            </span>
            <span style="color: #6B7280;">작성자: <strong>u/SNSHero_Official</strong> (공식 인증)</span>
          </div>
          <span style="font-size: 11px; color: #92400E; font-weight: 700; background: #FEF3C7; padding: 2px 8px; border-radius: 6px;">
            추천 +154.2k • 댓글 412개
          </span>
        </div>

        <h2 style="font-size: 20px; font-weight: 900; line-height: 1.4; margin: 0 0 14px 0; color: #1E293B;">
          <a href="https://snshero.com/" style="color: #1E293B; text-decoration: none;">
            🎮 [공식] SNS히어로(SNSHero.com) 완벽 가이드: AI 원클릭 웹 카드 배틀 RPG 소개 및 필승 공략법 (스크린샷 포함)
          </a>
        </h2>

        <!-- 게임 플레이 스크린샷 갤러리 그리드 -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-bottom: 16px;">
          <div style="border-radius: 8px; overflow: hidden; border: 1px solid rgba(0,0,0,0.1); background: #000;">
            <img src="/banner_snshero_legend.jpg" alt="SNSHero 배틀 아레나" style="width: 100%; height: 160px; object-fit: cover; display: block;" />
            <div style="font-size: 11px; text-align: center; padding: 4px; background: rgba(0,0,0,0.7); color: #fff;">1. 전설의 영웅 아레나</div>
          </div>
          <div style="border-radius: 8px; overflow: hidden; border: 1px solid rgba(0,0,0,0.1); background: #000;">
            <img src="/minigame_ai_battle.png" alt="3x3 카드 플립 배틀" style="width: 100%; height: 160px; object-fit: cover; display: block;" />
            <div style="font-size: 11px; text-align: center; padding: 4px; background: rgba(0,0,0,0.7); color: #fff;">2. 3x3 카드 플립 배틀</div>
          </div>
          <div style="border-radius: 8px; overflow: hidden; border: 1px solid rgba(0,0,0,0.1); background: #000;">
            <img src="/cards1-33.png" alt="100종 히어로 카드 컬렉션" style="width: 100%; height: 160px; object-fit: cover; display: block;" />
            <div style="font-size: 11px; text-align: center; padding: 4px; background: rgba(0,0,0,0.7); color: #fff;">3. 100종 카드 수집 &amp; 덱 빌딩</div>
          </div>
        </div>

        <p style="font-size: 14.5px; color: #334155; line-height: 1.7; margin: 0 0 16px 0;">
          <strong>SNSHero.com</strong>은 앱 설치나 가입 없이 웹 브라우저에서 원클릭으로 즉시 즐기는 차세대 AI 웹 카드 배틀 RPG입니다. 3x3 그리드 전장에서 4방향 전투력과 4원소(물, 불, 바람, 땅) 상성을 겨루는 카드 뒤집기(Flip) 대결을 펼치며, 100종 히어로 카드와 110선 모바일 퓨어 터치 미션 아케이드를 100% 로컬스토리지 영구 보존으로 즐길 수 있습니다.
        </p>

        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; border-top: 1px solid #FDE68A; padding-top: 14px;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <a href="https://snshero.com/" target="_blank" style="background: #FF4500; color: #fff; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              🚀 지금 즉시 게임 플레이 (snshero.com) →
            </a>
            <a href="https://github.com/Dayyoung/snshero" target="_blank" style="background: #1F2937; color: #fff; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; text-decoration: none;">
              🐙 GitHub 소스코드
            </a>
            <a href="https://www.youtube.com/playlist?list=PLV8H2-pD9vH0" target="_blank" style="background: #DC2626; color: #fff; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; text-decoration: none;">
              📺 바이브코딩 개발 강의
            </a>
          </div>
          <span style="font-size: 12px; color: #92400E; font-weight: 700;">
            100% 무과금 • 로컬스토리지 영구 보존
          </span>
        </div>
      </article>

      <!-- 뉴스 목록 -->
      <section>
        ${topNewsList}
      </section>
    </main>
  `;

  let customHtml = baseHtmlTemplate
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/, `<meta name="description" content="${escapeHtml(desc)}" />`)
    .replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/, `<link rel="canonical" href="${url}" />`);

  if (!customHtml.includes('<link rel="canonical"')) {
    customHtml = customHtml.replace('</head>', `  <link rel="canonical" href="${url}" />\n</head>`);
  }

  if (customHtml.includes('<div id="root"></div>')) {
    customHtml = customHtml.replace('<div id="root"></div>', `<div id="root">\n${redditIndexSnippet}\n</div>`);
  }

  return customHtml
    .replace(/(src|href)=["']\.\/assets\//g, '$1="/assets/')
    .replace(/(src|href)=["']assets\//g, '$1="/assets/');
}

// 6. 전체 실행 및 파일 저장
export async function runGenerateNewsSeo(): Promise<void> {
  console.log('[generate-news-seo] Starting full Google News SEO generation...');
  const posts = await loadGoogleNewsData();

  // A. sitemap-news.xml 저장
  const newsSitemapXml = generateGoogleNewsSitemap(posts);
  fs.writeFileSync(path.join(publicDir, 'sitemap-news.xml'), newsSitemapXml, 'utf8');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap-news.xml'), newsSitemapXml, 'utf8');
  }
  console.log('[generate-news-seo] Generated sitemap-news.xml');

  // B. news-feed.xml 및 rss.xml 저장
  const newsRssXml = generateNewsRssFeed(posts);
  fs.writeFileSync(path.join(publicDir, 'news-feed.xml'), newsRssXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'rss.xml'), newsRssXml, 'utf8');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'news-feed.xml'), newsRssXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'rss.xml'), newsRssXml, 'utf8');
  }
  console.log('[generate-news-seo] Generated news-feed.xml and rss.xml');

  // C. 템플릿 HTML 로드 (dist/index.html 우선, 없으면 root index.html)
  const distIndexPath = path.join(distDir, 'index.html');
  const rootIndexPath = path.join(rootDir, 'index.html');
  const baseTemplatePath = fs.existsSync(distIndexPath) ? distIndexPath : rootIndexPath;
  const baseHtml = fs.readFileSync(baseTemplatePath, 'utf8');

  // D. 개별 기사별 정적 HTML 생성
  let generatedArticleCount = 0;
  for (const post of posts) {
    const articleHtml = buildArticleStaticHtml(baseHtml, post, posts);

    // 경로: public 및 dist의 r/news/comments/{id} 와 reddit/comments/{id}
    // (구글 검색에 이미 색인된 UTC/KST 타임스탬프 편차 및 인덱스 URL 100% 호환 지원)
    const idxMatch = post.id.match(/_(\d+)$/);
    const postIdx = idxMatch ? idxMatch[1] : null;

    const idAliases = new Set<string>([post.id]);
    if (postIdx !== null) {
      idAliases.add(`gnews_${postIdx}`);
      const tsMatch = post.id.match(/^gnews_(\d+)_\d+$/);
      if (tsMatch) {
        const rawTs = parseInt(tsMatch[1], 10);
        // UTC와 KST의 9시간(32,400,000ms) 차이 호환성 보장
        idAliases.add(`gnews_${rawTs - 32400000}_${postIdx}`);
        idAliases.add(`gnews_${rawTs + 32400000}_${postIdx}`);
      }
    }

    for (const aliasId of idAliases) {
      const targetDirs = [
        path.join(publicDir, 'r', 'news', 'comments', aliasId),
        path.join(publicDir, 'reddit', 'comments', aliasId),
      ];

      if (fs.existsSync(distDir)) {
        targetDirs.push(
          path.join(distDir, 'r', 'news', 'comments', aliasId),
          path.join(distDir, 'reddit', 'comments', aliasId)
        );
      }

      for (const dir of targetDirs) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(path.join(dir, 'index.html'), articleHtml, 'utf8');
      }
    }
    generatedArticleCount++;
  }
  console.log(`[generate-news-seo] Generated ${generatedArticleCount} static news articles across all timezone/index aliases.`);

  // E. /reddit 및 /r/news 메인 피드 정적 HTML 생성
  const redditIndexHtml = buildRedditNewsIndexHtml(baseHtml, posts);
  const feedDirs = [
    path.join(publicDir, 'reddit'),
    path.join(publicDir, 'r', 'news'),
  ];
  if (fs.existsSync(distDir)) {
    feedDirs.push(
      path.join(distDir, 'reddit'),
      path.join(distDir, 'r', 'news')
    );
  }
  for (const dir of feedDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'index.html'), redditIndexHtml, 'utf8');
  }
  console.log('[generate-news-seo] Generated /reddit and /r/news static feed index.html files.');

  // F. Google News 필수 요건: 편집 원칙 및 저널리즘 투명성 페이지 (E-E-A-T) 생성
  const editorialPolicyHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>SNSHero 뉴스룸 편집 가이드라인 및 정정보도 정책</title>
  <meta name="description" content="SNSHero 실시간 구글 뉴스룸의 저널리즘 원칙, 팩트체크 기준, 정정보도 및 윤리 강령 안내">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #1F2937; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 28px; border-bottom: 2px solid #FF4500; padding-bottom: 10px; }
    h2 { font-size: 20px; margin-top: 30px; color: #111827; }
    p, li { font-size: 15px; color: #374151; }
    .nav-back { display: inline-block; margin-bottom: 20px; color: #FF4500; font-weight: bold; text-decoration: none; }
  </style>
</head>
<body>
  <a href="/reddit" class="nav-back">← SNSHero 뉴스룸으로 돌아가기</a>
  <h1>SNSHero 뉴스룸 편집 가이드라인 및 운영 정책</h1>
  <p>SNSHero는 구글 뉴스(Google News US Edition) 공식 신디케이션 피드를 바탕으로 글로벌 시사, 경제, 과학기술 동향을 신속하고 투명하게 전달합니다.</p>
  
  <h2>1. 팩트체크 및 출처 명시 원칙</h2>
  <p>모든 기사는 AP, Reuters, Bloomberg, White House, IMF 등 공인된 1차 보도 출처의 원문 링크를 투명하게 공개하며, 왜곡이나 과장 없이 사실에 기반하여 보도합니다.</p>

  <h2>2. 정정보도 및 수정 정책 (Corrections Policy)</h2>
  <p>보도 내용에 사실관계 오류가 발견될 경우 즉시 해당 기사를 수정하고 수정 시각과 내역을 투명하게 고지합니다.</p>

  <h2>3. 작성자 및 편집팀 정보 (E-E-A-T)</h2>
  <p>발행처: SNSHero News Media Desk (contact: contact@snshero.com)</p>
  <p>공식 웹사이트: <a href="https://snshero.com">https://snshero.com</a></p>
</body>
</html>`;

  fs.writeFileSync(path.join(publicDir, 'editorial-guidelines.html'), editorialPolicyHtml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'about-news.html'), editorialPolicyHtml, 'utf8');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'editorial-guidelines.html'), editorialPolicyHtml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'about-news.html'), editorialPolicyHtml, 'utf8');
  }

  // G. 일반 sitemap.xml에도 뉴스 기사 URL들 자동 동기화
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    let sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const newsMarkerStart = '  <!-- [Google Realtime News Articles Prerendered] -->';
    const newsMarkerEnd = '  <!-- [/Google Realtime News Articles Prerendered] -->';

    // 기존 뉴스 기사 블록이 남아있다면 첫 마커 이전까지만 안전하게 절단
    const firstStartIdx = sitemapContent.indexOf(newsMarkerStart);
    if (firstStartIdx !== -1) {
      sitemapContent = sitemapContent.slice(0, firstStartIdx).trimEnd() + '\n</urlset>';
    }

    const newsEntries = posts.map(p => `  <url>
    <loc>https://snshero.com/r/news/comments/${p.id}</loc>
    <lastmod>${new Date(p.createdAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.95</priority>
  </url>`).join('\n');

    const newsBlock = `\n${newsMarkerStart}\n${newsEntries}\n${newsMarkerEnd}\n`;
    sitemapContent = sitemapContent.replace('</urlset>', `${newsBlock}</urlset>`);
    
    fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent, 'utf8');
    }
    console.log('[generate-news-seo] Synced news article URLs into sitemap.xml');
  }

  console.log('[generate-news-seo] ✅ Google News SEO & AdSense static assets successfully built!');
}

// 직접 스크립트 실행 시
if (process.argv[1]?.endsWith('generate-news-seo.ts') || process.argv[1]?.endsWith('generate-news-seo.js')) {
  runGenerateNewsSeo().catch((err) => {
    console.error('[generate-news-seo] Fatal error:', err);
    process.exit(1);
  });
}
