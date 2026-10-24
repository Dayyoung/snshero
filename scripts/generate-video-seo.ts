/**
 * generate-video-seo.ts
 * SNSHero 애니메이션 40화(/movie, PLWJoj18KXId0) & 무비 40화(/cinema, PLHiW8jLQ0t2Q)
 * 구글 검색 / 구글 동영상 탭 / AI Overviews (SEO · GEO · AEO) 정적 사전 렌더링 및 비디오 사이트맵 생성기
 *
 * 생성 산출물:
 * 1. public/sitemap-video.xml & dist/sitemap-video.xml (Google Video Sitemap 1.1 공식 규격, 총 82개 비디오 엔트리)
 * 2. public/movie/index.html & public/animation/index.html (애니메이션 40화 시리즈 허브, TVSeries + ItemList + FAQPage JSON-LD)
 * 3. public/cinema/index.html (무비 40화 시리즈 허브, MovieSeries + ItemList + FAQPage JSON-LD)
 * 4. public/movie/ep-1..40/index.html (애니메이션 1~40화 개별 정적 페이지, VideoObject + TVEpisode + BreadcrumbList + FAQPage JSON-LD)
 * 5. public/cinema/ep-1..40/index.html (무비 1~40화 개별 정적 페이지, VideoObject + Movie + BreadcrumbList + FAQPage JSON-LD)
 * 6. public/sitemap.xml & dist/sitemap.xml 내 비디오 허브 및 80개 에피소드 URL 자동 동기화
 */

import fs from 'fs';
import path from 'path';
import { MOVIE_EPISODES, MovieEpisodeMeta } from '../src/content/movieEpisodeMapping';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');

const BASE_URL = 'https://snshero.com';
const ANIME_PLAYLIST_ID = 'PLWJoj18KXId0';
const MOVIE_PLAYLIST_ID = 'PLHiW8jLQ0t2Q';
const ANIME_PLAYLIST_URL = `https://www.youtube.com/watch?v=cbg1iP_7jOo&list=${ANIME_PLAYLIST_ID}`;
const MOVIE_PLAYLIST_URL = `https://www.youtube.com/watch?v=hqgXClTuKmU&list=${MOVIE_PLAYLIST_ID}`;

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

function getEpisodeList(): MovieEpisodeMeta[] {
  return Object.values(MOVIE_EPISODES).sort((a, b) => a.episodeNumber - b.episodeNumber);
}

/**
 * 1. Google Video Sitemap 1.1 (sitemap-video.xml) 생성
 */
function generateVideoSitemapXml(episodes: MovieEpisodeMeta[]): string {
  const pubDate = '2026-10-12T00:00:00+09:00';
  const urlEntries: string[] = [];

  // 1-A. 애니메이션 40화 메인 허브 (/movie)
  const firstAnimeEp = episodes[0];
  const firstAnimeVid = firstAnimeEp?.videoId || 'cbg1iP_7jOo';
  urlEntries.push(`  <url>
    <loc>${BASE_URL}/movie</loc>
    <video:video>
      <video:thumbnail_loc>https://i.ytimg.com/vi/${escapeXml(firstAnimeVid)}/maxresdefault.jpg</video:thumbnail_loc>
      <video:title>${escapeXml('SNSHero 공식 애니메이션 40화 전편 (카단과 아케인의 메아리) - 무료 시청 & +100 SNS 보상')}</video:title>
      <video:description>${escapeXml('설치 없이 웹에서 바로 즐기는 AI 웹 카드 배틀 SNSHero(SNS히어로)의 공식 40부작 판타지 애니메이션 시리즈. 매 화 시청 시 +100 SNS 포인트를 즉시 지급합니다.')}</video:description>
      <video:player_loc allow_embed="yes">https://www.youtube.com/embed/${escapeXml(firstAnimeVid)}?list=${ANIME_PLAYLIST_ID}</video:player_loc>
      <video:duration>360</video:duration>
      <video:publication_date>${pubDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
      <video:tag>SNSHero</video:tag>
      <video:tag>SNS히어로</video:tag>
      <video:tag>애니메이션</video:tag>
      <video:tag>판타지 애니메이션</video:tag>
      <video:tag>AI 카드 게임</video:tag>
    </video:video>
  </url>`);

  // 1-B. 무비 40화 메인 허브 (/cinema)
  const firstMovieVid = firstAnimeEp?.movieVideoId || 'hqgXClTuKmU';
  urlEntries.push(`  <url>
    <loc>${BASE_URL}/cinema</loc>
    <video:video>
      <video:thumbnail_loc>https://i.ytimg.com/vi/${escapeXml(firstMovieVid)}/maxresdefault.jpg</video:thumbnail_loc>
      <video:title>${escapeXml('SNSHero 공식 무비 40화 전편 (Kadan & Arcane Echoes: The Movie) - 무료 감상 & +100 SNS 보상')}</video:title>
      <video:description>${escapeXml('AI 웹 카드 배틀 SNSHero(SNS히어로)의 공식 40부작 시네마틱 무비 시리즈. 카단과 110여 종 영웅들의 장대한 실사풍 판타지 서사시를 감상하고 회차별 +100 SNS 보상을 획득하세요.')}</video:description>
      <video:player_loc allow_embed="yes">https://www.youtube.com/embed/${escapeXml(firstMovieVid)}?list=${MOVIE_PLAYLIST_ID}</video:player_loc>
      <video:duration>360</video:duration>
      <video:publication_date>${pubDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
      <video:tag>SNSHero</video:tag>
      <video:tag>SNS히어로</video:tag>
      <video:tag>무비</video:tag>
      <video:tag>판타지 영화</video:tag>
      <video:tag>웹 카드 게임</video:tag>
    </video:video>
  </url>`);

  // 1-C. 애니메이션 1~40화 개별 에피소드 (/movie/ep-1 ~ /movie/ep-40)
  for (const ep of episodes) {
    const vid = ep.videoId || firstAnimeVid;
    const durationSec = Math.max(180, Math.min(1800, (ep.durationMinutes || 6) * 60));
    const title = `SNSHero 애니메이션 제${ep.episodeNumber}화: ${ep.titleKo} (${ep.titleEn}) | SNS히어로 공식 애니`;
    const desc = `[SNSHero 공식 애니메이션 ${ep.episodeNumber}화 - ${ep.arc}] ${ep.synopsisKo} (${ep.synopsisEn}) 등장 영웅: ${ep.keyCharacters.join(', ')}. 시청 완료 시 +100 SNS 포인트 즉시 지급!`;
    urlEntries.push(`  <url>
    <loc>${BASE_URL}/movie/ep-${ep.episodeNumber}</loc>
    <video:video>
      <video:thumbnail_loc>https://i.ytimg.com/vi/${escapeXml(vid)}/maxresdefault.jpg</video:thumbnail_loc>
      <video:title>${escapeXml(title)}</video:title>
      <video:description>${escapeXml(desc)}</video:description>
      <video:player_loc allow_embed="yes">https://www.youtube.com/embed/${escapeXml(vid)}?list=${ANIME_PLAYLIST_ID}</video:player_loc>
      <video:duration>${durationSec}</video:duration>
      <video:publication_date>${pubDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
      <video:tag>SNSHero</video:tag>
      <video:tag>SNS히어로 애니메이션</video:tag>
      <video:tag>${escapeXml(ep.titleKo)}</video:tag>
      <video:tag>${escapeXml(ep.titleEn)}</video:tag>
      ${ep.keyCharacters.map((c) => `<video:tag>${escapeXml(c)}</video:tag>`).join('\n      ')}
    </video:video>
  </url>`);
  }

  // 1-D. 무비 1~40화 개별 에피소드 (/cinema/ep-1 ~ /cinema/ep-40)
  for (const ep of episodes) {
    const vid = ep.movieVideoId || firstMovieVid;
    const durationSec = Math.max(180, Math.min(1800, (ep.durationMinutes || 6) * 60));
    const title = `SNSHero 무비 제${ep.episodeNumber}화: ${ep.titleKo} (${ep.titleEn}) | SNS히어로 공식 무비`;
    const desc = `[SNSHero 공식 무비 ${ep.episodeNumber}화 - ${ep.arc}] ${ep.synopsisKo} (${ep.synopsisEn}) 주요 등장인물: ${ep.keyCharacters.join(', ')}. 감상 완료 시 +100 SNS 포인트 즉시 지급!`;
    urlEntries.push(`  <url>
    <loc>${BASE_URL}/cinema/ep-${ep.episodeNumber}</loc>
    <video:video>
      <video:thumbnail_loc>https://i.ytimg.com/vi/${escapeXml(vid)}/maxresdefault.jpg</video:thumbnail_loc>
      <video:title>${escapeXml(title)}</video:title>
      <video:description>${escapeXml(desc)}</video:description>
      <video:player_loc allow_embed="yes">https://www.youtube.com/embed/${escapeXml(vid)}?list=${MOVIE_PLAYLIST_ID}</video:player_loc>
      <video:duration>${durationSec}</video:duration>
      <video:publication_date>${pubDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
      <video:tag>SNSHero</video:tag>
      <video:tag>SNS히어로 무비</video:tag>
      <video:tag>${escapeXml(ep.titleKo)}</video:tag>
      <video:tag>${escapeXml(ep.titleEn)}</video:tag>
      ${ep.keyCharacters.map((c) => `<video:tag>${escapeXml(c)}</video:tag>`).join('\n      ')}
    </video:video>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urlEntries.join('\n')}
</urlset>
`;
}

/**
 * 2. 개별 에피소드 정적 HTML 생성기 (/movie/ep-N 및 /cinema/ep-N)
 */
function buildEpisodeHtml(
  baseHtmlTemplate: string,
  ep: MovieEpisodeMeta,
  mode: 'anime' | 'movie',
  allEpisodes: MovieEpisodeMeta[]
): string {
  const isAnime = mode === 'anime';
  const routePrefix = isAnime ? '/movie' : '/cinema';
  const playlistId = isAnime ? ANIME_PLAYLIST_ID : MOVIE_PLAYLIST_ID;
  const videoId = (isAnime ? ep.videoId : ep.movieVideoId) || (isAnime ? 'cbg1iP_7jOo' : 'hqgXClTuKmU');
  const counterpartRoute = isAnime ? `/cinema/ep-${ep.episodeNumber}` : `/movie/ep-${ep.episodeNumber}`;
  const counterpartLabel = isAnime ? '🎬 같은 회차 무비(Movie) 버전 감상하기' : '📺 같은 회차 애니메이션(Animation) 버전 감상하기';

  const canonicalUrl = `${BASE_URL}${routePrefix}/ep-${ep.episodeNumber}`;
  const youtubeWatchUrl = `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}`;
  const youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}?list=${playlistId}&rel=0`;
  const thumbUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const pubDateIso = '2026-10-12T00:00:00+09:00';
  const durationIso = `PT${ep.durationMinutes || 6}M`;

  const seriesLabelKo = isAnime ? 'SNSHero 공식 애니메이션 40화' : 'SNSHero 공식 무비 40화';
  const seriesLabelEn = isAnime ? 'SNSHero Official Animation (40 Episodes)' : 'SNSHero Official Movie (40 Episodes)';

  const pageTitle = `${isAnime ? '애니메이션' : '무비'} 제${ep.episodeNumber}화: ${ep.titleKo} (${ep.titleEn}) | ${seriesLabelKo} - SNS히어로`;
  const pageDesc = `[${seriesLabelKo} 제${ep.episodeNumber}화 - ${ep.titleKo}] ${ep.synopsisKo} 주요 영웅: ${ep.keyCharacters.join(', ')}. 유튜브 무료 스트리밍 시청 시 +100 SNS 게임 재화 즉시 지급! (${ep.synopsisEn})`;

  const prevEp = ep.episodeNumber > 1 ? allEpisodes[ep.episodeNumber - 2] : null;
  const nextEp = ep.episodeNumber < allEpisodes.length ? allEpisodes[ep.episodeNumber] : null;

  // Schema.org @graph: VideoObject + TVEpisode/Movie + BreadcrumbList + FAQPage
  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'VideoObject',
        '@id': `${canonicalUrl}#video`,
        name: pageTitle,
        alternateName: `${ep.titleEn} - ${seriesLabelEn} EP${ep.episodeNumber}`,
        description: pageDesc,
        thumbnailUrl: [
          thumbUrl,
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        ],
        uploadDate: pubDateIso,
        duration: durationIso,
        contentUrl: youtubeWatchUrl,
        embedUrl: youtubeEmbedUrl,
        inLanguage: ['ko', 'en', 'ja'],
        isAccessibleForFree: true,
        isFamilyFriendly: true,
        publisher: {
          '@type': 'Organization',
          name: 'SNSHero (SNS히어로)',
          url: BASE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/logo.jpg`,
            width: 512,
            height: 512,
          },
        },
        potentialAction: {
          '@type': 'WatchAction',
          target: [canonicalUrl, youtubeWatchUrl],
        },
        hasPart: [
          {
            '@type': 'Clip',
            name: `명장면 하이라이트: ${ep.highlightScene}`,
            startOffset: 0,
            endOffset: 90,
            url: `${youtubeWatchUrl}&t=0s`,
          },
        ],
      },
      {
        '@type': isAnime ? 'TVEpisode' : 'Movie',
        '@id': `${canonicalUrl}#episode`,
        name: `제${ep.episodeNumber}화: ${ep.titleKo} (${ep.titleEn})`,
        episodeNumber: ep.episodeNumber,
        description: ep.synopsisKo,
        url: canonicalUrl,
        image: thumbUrl,
        datePublished: '2026-10-12',
        inLanguage: 'ko',
        partOfSeries: {
          '@type': isAnime ? 'TVSeries' : 'MovieSeries',
          name: seriesLabelKo,
          url: `${BASE_URL}${routePrefix}`,
          numberOfEpisodes: 40,
        },
        video: {
          '@id': `${canonicalUrl}#video`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'SNSHero 홈',
            item: BASE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: seriesLabelKo,
            item: `${BASE_URL}${routePrefix}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: `제${ep.episodeNumber}화: ${ep.titleKo}`,
            item: canonicalUrl,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `${seriesLabelKo} 제${ep.episodeNumber}화 '${ep.titleKo}'의 줄거리는 무엇인가요?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${ep.synopsisKo} (${ep.synopsisEn}) 주요 등장 영웅은 ${ep.keyCharacters.join(', ')}이며, 하이라이트 장면은 "${ep.highlightScene}"입니다.`,
            },
          },
          {
            '@type': 'Question',
            name: `SNSHero ${isAnime ? '애니메이션' : '무비'} 제${ep.episodeNumber}화를 시청하면 어떤 보상을 받나요?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `https://snshero.com${routePrefix}/ep-${ep.episodeNumber} 에서 제${ep.episodeNumber}화를 감상하고 '시청 완료 보상' 버튼을 누르면 즉시 +100 SNS 포인트가 지급되며, 유튜브 전체 플레이리스트 방문 시 +300 SNS 보너스를 추가로 획득하여 AI 웹 카드 배틀의 영웅 카드를 무료로 소환할 수 있습니다.`,
            },
          },
        ],
      },
    ],
  };

  const semanticBodyHtml = `
    <main style="max-width: 960px; margin: 0 auto; padding: 24px 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #201d1d; background: #fdfcfc; line-height: 1.7;">
      <nav aria-label="Breadcrumb" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid rgba(32,29,29,0.2); padding-bottom: 12px; margin-bottom: 20px; font-size: 13px;">
        <div>
          <a href="/" style="color: #201d1d; font-weight: 700; text-decoration: none;">SNSHero 홈</a>
          <span style="margin: 0 6px;">/</span>
          <a href="${routePrefix}" style="color: #201d1d; font-weight: 700; text-decoration: none;">${escapeHtml(seriesLabelKo)}</a>
          <span style="margin: 0 6px;">/</span>
          <span>제${ep.episodeNumber}화: ${escapeHtml(ep.titleKo)}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="${counterpartRoute}" style="padding: 6px 12px; border: 1px solid #201d1d; color: #201d1d; text-decoration: none; font-weight: 700; font-size: 12px;">${counterpartLabel}</a>
          <a href="/" style="padding: 6px 12px; background: #201d1d; color: #fdfcfc; text-decoration: none; font-weight: 700; font-size: 12px;">🎮 1초 원클릭 게임 시작 (+1,000 SNS)</a>
        </div>
      </nav>

      <article itemscope itemtype="https://schema.org/VideoObject">
        <header style="margin-bottom: 18px;">
          <div style="font-size: 12px; font-weight: 700; color: #646262; margin-bottom: 4px;">
            [${escapeHtml(seriesLabelKo)} · EPISODE ${String(ep.episodeNumber).padStart(2, '0')} / 40] · ${escapeHtml(ep.arc)} (${escapeHtml(ep.arcEn)})
          </div>
          <h1 itemprop="name" style="font-size: 26px; font-weight: 900; margin: 0 0 8px 0; color: #201d1d;">
            제${ep.episodeNumber}화. ${escapeHtml(ep.titleKo)} (${escapeHtml(ep.titleEn)} / ${escapeHtml(ep.titleJa)})
          </h1>
          <meta itemprop="uploadDate" content="${pubDateIso}" />
          <meta itemprop="thumbnailUrl" content="${thumbUrl}" />
          <meta itemprop="duration" content="${durationIso}" />
          <meta itemprop="embedUrl" content="${youtubeEmbedUrl}" />
          <meta itemprop="contentUrl" content="${youtubeWatchUrl}" />
        </header>

        <!-- 유튜브 공식 플레이어 임베드 -->
        <section style="position: relative; width: 100%; padding-bottom: 56.25%; background: #090d16; border: 1px solid #201d1d; margin-bottom: 20px;">
          <iframe
            src="${youtubeEmbedUrl}"
            title="${escapeHtml(pageTitle)}"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>
        </section>

        <!-- 회차 줄거리 및 메타데이터 (SEO / GEO / AEO 최적화 텍스트) -->
        <section style="border: 1px solid rgba(32,29,29,0.25); padding: 18px; margin-bottom: 20px; background: #fff;">
          <h2 style="font-size: 16px; font-weight: 800; margin: 0 0 10px 0;">📖 에피소드 공식 줄거리 (Synopsis)</h2>
          <p itemprop="description" style="margin: 0 0 10px 0; font-size: 15px;">
            <strong>[한국어]</strong> ${escapeHtml(ep.synopsisKo)}
          </p>
          <p style="margin: 0 0 14px 0; font-size: 14px; color: #646262;">
            <strong>[English]</strong> ${escapeHtml(ep.synopsisEn)}
          </p>
          <div style="font-size: 13px; border-top: 1px dashed rgba(32,29,29,0.2); padding-top: 10px;">
            <div>• <strong>주요 등장 영웅 카드:</strong> ${escapeHtml(ep.keyCharacters.join(', '))}</div>
            <div>• <strong>명장면 하이라이트:</strong> ${escapeHtml(ep.highlightScene)}</div>
            <div>• <strong>시청 보상 (Watch-to-Earn):</strong> 에피소드 감상 시 <strong>+100 SNS</strong> 즉시 지급 / 전체 플레이리스트 방문 시 <strong>+300 SNS</strong> 추가 지급</div>
            <div>• <strong>공식 유튜브 링크:</strong> <a href="${youtubeWatchUrl}" target="_blank" rel="noopener noreferrer" style="color: #201d1d; font-weight: 700;">${escapeHtml(youtubeWatchUrl)}</a></div>
          </div>
        </section>

        <!-- 이전화 / 다음화 네비게이션 -->
        <nav aria-label="Episode Navigation" style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 28px;">
          ${prevEp ? `<a href="${routePrefix}/ep-${prevEp.episodeNumber}" style="flex: 1; padding: 12px; border: 1px solid #201d1d; text-decoration: none; color: #201d1d; font-weight: 700; font-size: 13px;">← 제${prevEp.episodeNumber}화: ${escapeHtml(prevEp.titleKo)}</a>` : `<span style="flex: 1;"></span>`}
          <a href="${routePrefix}" style="padding: 12px 16px; border: 1px solid #201d1d; background: #201d1d; color: #fdfcfc; text-decoration: none; font-weight: 700; font-size: 13px;">전체 40화 목록</a>
          ${nextEp ? `<a href="${routePrefix}/ep-${nextEp.episodeNumber}" style="flex: 1; padding: 12px; border: 1px solid #201d1d; text-decoration: none; color: #201d1d; font-weight: 700; font-size: 13px; text-align: right;">제${nextEp.episodeNumber}화: ${escapeHtml(nextEp.titleKo)} →</a>` : `<span style="flex: 1;"></span>`}
        </nav>

        <!-- 전체 40화 빠른 인덱스 (크롤러 내부 링크 망) -->
        <section style="border-top: 1px solid rgba(32,29,29,0.2); padding-top: 18px;">
          <h2 style="font-size: 16px; font-weight: 800; margin: 0 0 12px 0;">📚 ${escapeHtml(seriesLabelKo)} 전편 바로가기 (1화 ~ 40화)</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; font-size: 12px;">
            ${allEpisodes
              .map(
                (item) => `
              <a href="${routePrefix}/ep-${item.episodeNumber}" style="display: block; padding: 8px 10px; border: 1px solid ${
                  item.episodeNumber === ep.episodeNumber ? '#201d1d' : 'rgba(32,29,29,0.2)'
                }; background: ${item.episodeNumber === ep.episodeNumber ? '#201d1d' : '#fff'}; color: ${
                  item.episodeNumber === ep.episodeNumber ? '#fdfcfc' : '#201d1d'
                }; text-decoration: none; font-weight: ${item.episodeNumber === ep.episodeNumber ? '800' : '600'};">
                제${item.episodeNumber}화. ${escapeHtml(item.titleKo)}
              </a>`
              )
              .join('')}
          </div>
        </section>
      </article>
    </main>
  `;

  return injectSeoIntoBaseHtml(baseHtmlTemplate, {
    title: pageTitle,
    description: pageDesc,
    canonicalUrl,
    imageUrl: thumbUrl,
    videoEmbedUrl: youtubeEmbedUrl,
    ogType: 'video.episode',
    keywords: [
      'SNSHero',
      'SNS히어로',
      seriesLabelKo,
      `제${ep.episodeNumber}화`,
      ep.titleKo,
      ep.titleEn,
      ep.titleJa,
      ...ep.keyCharacters,
      'AI 웹 카드 게임',
      '판타지 애니메이션',
      '판타지 무비',
    ],
    jsonLd: jsonLdGraph,
    bodyHtml: semanticBodyHtml,
  });
}

/**
 * 3. 시리즈 메인 허브 정적 HTML 생성기 (/movie 및 /cinema)
 */
function buildSeriesHubHtml(
  baseHtmlTemplate: string,
  mode: 'anime' | 'movie',
  episodes: MovieEpisodeMeta[]
): string {
  const isAnime = mode === 'anime';
  const routePrefix = isAnime ? '/movie' : '/cinema';
  const playlistId = isAnime ? ANIME_PLAYLIST_ID : MOVIE_PLAYLIST_ID;
  const playlistUrl = isAnime ? ANIME_PLAYLIST_URL : MOVIE_PLAYLIST_URL;
  const firstVid = (isAnime ? episodes[0]?.videoId : episodes[0]?.movieVideoId) || (isAnime ? 'cbg1iP_7jOo' : 'hqgXClTuKmU');
  const canonicalUrl = `${BASE_URL}${routePrefix}`;
  const thumbUrl = `https://i.ytimg.com/vi/${firstVid}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${firstVid}?list=${playlistId}&rel=0`;

  const title = isAnime
    ? 'SNSHero 공식 애니메이션 40화 전편 스트리밍 (카단과 아케인의 메아리) | SNS히어로'
    : 'SNSHero 공식 무비 40화 전편 스트리밍 (Kadan & Arcane Echoes: The Movie) | SNS히어로';

  const description = isAnime
    ? 'SNSHero(SNS히어로) 공식 40부작 판타지 애니메이션 전편 무료 감상! 카단과 110여 종 영웅들의 서사시를 유튜브 플레이리스트(PLWJoj18KXId0)로 시청하고 매 화 +100 SNS 게임 보상을 즉시 수령하세요.'
    : 'SNSHero(SNS히어로) 공식 40부작 시네마틱 무비 전편 무료 감상! 카단과 아케인 대륙의 블록버스터 판타지 무비 시리즈(PLHiW8jLQ0t2Q)를 시청하고 회차별 +100 SNS 보상을 즉시 획득하세요.';

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': isAnime ? 'TVSeries' : 'MovieSeries',
        '@id': `${canonicalUrl}#series`,
        name: title,
        description,
        url: canonicalUrl,
        image: thumbUrl,
        inLanguage: ['ko', 'en', 'ja'],
        numberOfEpisodes: 40,
        isAccessibleForFree: true,
        genre: ['Fantasy', 'Action', 'Adventure', 'Animation', 'Game Lore'],
        publisher: {
          '@type': 'Organization',
          name: 'SNSHero (SNS히어로)',
          url: BASE_URL,
        },
        sameAs: [playlistUrl],
      },
      {
        '@type': 'ItemList',
        name: isAnime ? 'SNSHero 공식 애니메이션 40화 전체 에피소드 목록' : 'SNSHero 공식 무비 40화 전체 에피소드 목록',
        numberOfItems: episodes.length,
        itemListElement: episodes.map((ep, idx) => {
          const vid = (isAnime ? ep.videoId : ep.movieVideoId) || firstVid;
          return {
            '@type': 'ListItem',
            position: idx + 1,
            url: `${BASE_URL}${routePrefix}/ep-${ep.episodeNumber}`,
            item: {
              '@type': 'VideoObject',
              name: `제${ep.episodeNumber}화: ${ep.titleKo} (${ep.titleEn})`,
              description: ep.synopsisKo,
              thumbnailUrl: `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`,
              uploadDate: '2026-10-12T00:00:00+09:00',
              duration: `PT${ep.durationMinutes || 6}M`,
              contentUrl: `https://www.youtube.com/watch?v=${vid}&list=${playlistId}`,
              embedUrl: `https://www.youtube.com/embed/${vid}?list=${playlistId}`,
            },
          };
        }),
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: isAnime
              ? 'SNSHero 공식 애니메이션 40화는 어디서 무료로 볼 수 있나요?'
              : 'SNSHero 공식 무비 40화는 어디서 무료로 볼 수 있나요?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: isAnime
                ? `SNSHero 공식 웹사이트(https://snshero.com/movie)와 공식 유튜브 플레이리스트(${ANIME_PLAYLIST_URL})에서 1화부터 40화까지 전편 무료로 시청할 수 있습니다.`
                : `SNSHero 공식 웹사이트(https://snshero.com/cinema)와 공식 유튜브 플레이리스트(${MOVIE_PLAYLIST_URL})에서 1화부터 40화까지 전편 무료로 감상할 수 있습니다.`,
            },
          },
          {
            '@type': 'Question',
            name: '애니메이션과 무비를 시청하면 게임에서 어떤 혜택을 받나요?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '각 에피소드(1화~40화)를 시청할 때마다 회차당 +100 SNS 포인트(40화 완주 시 총 +4,000 SNS, 애니메이션+무비 합산 최대 +8,000 SNS)를 즉시 지급받으며, 공식 유튜브 플레이리스트 방문 시 +300 SNS 추가 보너스를 받아 상점에서 전설 영웅 카드를 소환할 수 있습니다.',
            },
          },
        ],
      },
    ],
  };

  const bodyHtml = `
    <main style="max-width: 980px; margin: 0 auto; padding: 24px 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #201d1d; background: #fdfcfc; line-height: 1.7;">
      <header style="border-bottom: 2px solid #201d1d; padding-bottom: 16px; margin-bottom: 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;">
        <div>
          <div style="font-size: 12px; font-weight: 800; color: #646262;">SNSHero Official Transmedia Universe</div>
          <h1 style="font-size: 26px; font-weight: 900; margin: 4px 0 6px 0;">
            ${isAnime ? '📺 SNSHero 공식 애니메이션 40화 전편 (Animation Series)' : '🎬 SNSHero 공식 무비 40화 전편 (Official Movie Series)'}
          </h1>
          <p style="font-size: 14px; color: #646262; margin: 0;">
            ${escapeHtml(description)}
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="${isAnime ? '/cinema' : '/movie'}" style="padding: 8px 14px; border: 1px solid #201d1d; color: #201d1d; text-decoration: none; font-weight: 800; font-size: 13px;">
            ${isAnime ? '🎬 공식 무비 40화 보러가기' : '📺 공식 애니메이션 40화 보러가기'}
          </a>
          <a href="/" style="padding: 8px 14px; background: #201d1d; color: #fdfcfc; text-decoration: none; font-weight: 800; font-size: 13px;">
            🎮 원클릭 게임 시작 (+1,000 SNS)
          </a>
        </div>
      </header>

      <!-- 대표 플레이리스트 임베드 -->
      <section style="position: relative; width: 100%; padding-bottom: 56.25%; background: #090d16; border: 1px solid #201d1d; margin-bottom: 24px;">
        <iframe
          src="${embedUrl}"
          title="${escapeHtml(title)}"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      </section>

      <!-- 전체 40화 에피소드 카드 그리드 -->
      <section>
        <h2 style="font-size: 18px; font-weight: 900; margin: 0 0 14px 0;">
          전체 40부작 에피소드 아카이브 (회차별 시청 보상 +100 SNS)
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px;">
          ${episodes
            .map((ep) => {
              const vid = (isAnime ? ep.videoId : ep.movieVideoId) || firstVid;
              const epUrl = `${routePrefix}/ep-${ep.episodeNumber}`;
              const ytUrl = `https://www.youtube.com/watch?v=${vid}&list=${playlistId}`;
              return `
            <article style="border: 1px solid rgba(32,29,29,0.25); background: #fff; padding: 14px;">
              <a href="${epUrl}" style="display: block; text-decoration: none; color: inherit;">
                <img src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="제${ep.episodeNumber}화 ${escapeHtml(ep.titleKo)}" loading="lazy" style="width: 100%; height: 156px; object-fit: cover; border: 1px solid #201d1d; margin-bottom: 10px;" />
                <div style="font-size: 11px; font-weight: 800; color: #646262;">EPISODE ${String(ep.episodeNumber).padStart(2, '0')} · ${escapeHtml(ep.arc)}</div>
                <h3 style="font-size: 16px; font-weight: 800; margin: 4px 0 6px 0; color: #201d1d;">제${ep.episodeNumber}화. ${escapeHtml(ep.titleKo)} (${escapeHtml(ep.titleEn)})</h3>
                <p style="font-size: 13px; color: #4b5563; margin: 0 0 10px 0;">${escapeHtml(ep.synopsisKo)}</p>
              </a>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; border-top: 1px dashed rgba(32,29,29,0.15); padding-top: 8px;">
                <a href="${epUrl}" style="font-weight: 800; color: #201d1d; text-decoration: underline;">에피소드 상세 & 보상 (+100 SNS)</a>
                <a href="${ytUrl}" target="_blank" rel="noopener noreferrer" style="color: #646262; text-decoration: none;">YouTube ↗</a>
              </div>
            </article>`;
            })
            .join('\n')}
        </div>
      </section>
    </main>
  `;

  return injectSeoIntoBaseHtml(baseHtmlTemplate, {
    title,
    description,
    canonicalUrl,
    imageUrl: thumbUrl,
    videoEmbedUrl: embedUrl,
    ogType: 'video.tv_show',
    keywords: [
      'SNSHero',
      'SNS히어로',
      isAnime ? 'SNSHero 애니메이션 40화' : 'SNSHero 무비 40화',
      '카단과 아케인의 메아리',
      'AI 웹 카드 배틀',
      '판타지 애니메이션',
      '판타지 무비',
      'Watch to Earn',
    ],
    jsonLd: jsonLdGraph,
    bodyHtml,
  });
}

function injectSeoIntoBaseHtml(
  baseHtmlTemplate: string,
  opts: {
    title: string;
    description: string;
    canonicalUrl: string;
    imageUrl: string;
    videoEmbedUrl: string;
    ogType: string;
    keywords: string[];
    jsonLd: Record<string, any>;
    bodyHtml: string;
  }
): string {
  const videoMetaTags = `
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta property="og:video" content="${opts.videoEmbedUrl}" />
  <meta property="og:video:url" content="${opts.videoEmbedUrl}" />
  <meta property="og:video:secure_url" content="${opts.videoEmbedUrl}" />
  <meta property="og:video:type" content="text/html" />
  <meta property="og:video:width" content="1280" />
  <meta property="og:video:height" content="720" />
  <meta name="twitter:card" content="player" />
  <meta name="twitter:player" content="${opts.videoEmbedUrl}" />
  <meta name="twitter:player:width" content="1280" />
  <meta name="twitter:player:height" content="720" />`;

  let html = baseHtmlTemplate
    .replace(/<html(\s+[^>]*)?>/, `<html lang="ko">`)
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(opts.title)}</title>`)
    .replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/, `<meta name="description" content="${escapeHtml(opts.description)}" />`)
    .replace(/<meta\s+name="keywords"\s+content=".*?"\s*\/?>/, `<meta name="keywords" content="${escapeHtml(opts.keywords.join(', '))}" />`)
    .replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/, `<link rel="canonical" href="${opts.canonicalUrl}" />`)
    .replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(opts.title)}" />`)
    .replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(opts.description)}" />`)
    .replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/, `<meta property="og:image" content="${opts.imageUrl}" />`)
    .replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/, `<meta property="og:url" content="${opts.canonicalUrl}" />`)
    .replace(/<meta\s+property="og:type"\s+content=".*?"\s*\/?>/, `<meta property="og:type" content="${opts.ogType}" />`)
    .replace(/<meta\s+property="twitter:title"\s+content=".*?"\s*\/?>/, `<meta property="twitter:title" content="${escapeHtml(opts.title)}" />`)
    .replace(/<meta\s+property="twitter:description"\s+content=".*?"\s*\/?>/, `<meta property="twitter:description" content="${escapeHtml(opts.description)}" />`)
    .replace(/<meta\s+property="twitter:image"\s+content=".*?"\s*\/?>/, `<meta property="twitter:image" content="${opts.imageUrl}" />`);

  if (!html.includes('<link rel="canonical"')) {
    html = html.replace('</head>', `  <link rel="canonical" href="${opts.canonicalUrl}" />\n</head>`);
  }

  const jsonLdScript = `  <script type="application/ld+json">\n${JSON.stringify(opts.jsonLd, null, 2)}\n  </script>`;
  html = html.replace('</head>', `${videoMetaTags}\n${jsonLdScript}\n</head>`);

  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', `<div id="root">\n${opts.bodyHtml}\n</div>`);
  }

  html = html
    .replace(/(src|href)=["']\.\/assets\//g, '$1="/assets/')
    .replace(/(src|href)=["']assets\//g, '$1="/assets/');

  return html;
}

function writeHtmlToPublicAndDist(relDir: string, html: string) {
  const targets = [path.join(publicDir, relDir)];
  if (fs.existsSync(distDir)) {
    targets.push(path.join(distDir, relDir));
  }
  for (const dir of targets) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  }
}

export async function runGenerateVideoSeo() {
  console.log('[generate-video-seo] Starting Google Video SEO/GEO/AEO static build for 40 Animation & 40 Movie episodes...');
  const episodes = getEpisodeList();

  // 1. sitemap-video.xml 생성
  const videoSitemapXml = generateVideoSitemapXml(episodes);
  fs.writeFileSync(path.join(publicDir, 'sitemap-video.xml'), videoSitemapXml, 'utf8');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap-video.xml'), videoSitemapXml, 'utf8');
  }
  console.log(`[generate-video-seo] Generated sitemap-video.xml with ${episodes.length * 2 + 2} video entries.`);

  // 2. 베이스 HTML 템플릿 로드 (dist/index.html 우선, 없으면 index.html)
  const distIndexPath = path.join(distDir, 'index.html');
  const rootIndexPath = path.join(rootDir, 'index.html');
  const baseHtml = fs.existsSync(distIndexPath)
    ? fs.readFileSync(distIndexPath, 'utf8')
    : fs.readFileSync(rootIndexPath, 'utf8');

  // 3. 시리즈 메인 허브 (/movie, /animation, /cinema) 정적 HTML 생성
  const animeHubHtml = buildSeriesHubHtml(baseHtml, 'anime', episodes);
  const movieHubHtml = buildSeriesHubHtml(baseHtml, 'movie', episodes);

  writeHtmlToPublicAndDist('movie', animeHubHtml);
  writeHtmlToPublicAndDist('animation', animeHubHtml);
  writeHtmlToPublicAndDist('cinema', movieHubHtml);

  // 4. 에피소드별 개별 정적 HTML (/movie/ep-1..40 & /cinema/ep-1..40) 생성
  for (const ep of episodes) {
    const animeEpHtml = buildEpisodeHtml(baseHtml, ep, 'anime', episodes);
    const movieEpHtml = buildEpisodeHtml(baseHtml, ep, 'movie', episodes);

    writeHtmlToPublicAndDist(path.join('movie', `ep-${ep.episodeNumber}`), animeEpHtml);
    writeHtmlToPublicAndDist(path.join('cinema', `ep-${ep.episodeNumber}`), movieEpHtml);
  }
  console.log(`[generate-video-seo] Pre-rendered 80 individual episode HTML pages (/movie/ep-1..40 & /cinema/ep-1..40) + 3 hub pages.`);

  // 5. 일반 sitemap.xml 에도 /movie, /cinema, 80개 에피소드 URL 동기화
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    let sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const markerStart = '  <!-- [Google Video Series & Episodes Prerendered] -->';
    const markerEnd = '  <!-- [/Google Video Series & Episodes Prerendered] -->';

    if (sitemapContent.includes(markerStart) && sitemapContent.includes(markerEnd)) {
      const startIdx = sitemapContent.indexOf(markerStart);
      const endIdx = sitemapContent.indexOf(markerEnd) + markerEnd.length;
      sitemapContent = sitemapContent.slice(0, startIdx) + sitemapContent.slice(endIdx);
    }

    const today = '2026-10-12';
    const urlLines: string[] = [
      `  <url>\n    <loc>${BASE_URL}/movie</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.95</priority>\n  </url>`,
      `  <url>\n    <loc>${BASE_URL}/cinema</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.95</priority>\n  </url>`,
    ];

    for (const ep of episodes) {
      urlLines.push(
        `  <url>\n    <loc>${BASE_URL}/movie/ep-${ep.episodeNumber}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.88</priority>\n  </url>`,
        `  <url>\n    <loc>${BASE_URL}/cinema/ep-${ep.episodeNumber}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.88</priority>\n  </url>`
      );
    }

    const videoBlock = `\n${markerStart}\n${urlLines.join('\n')}\n${markerEnd}\n`;
    sitemapContent = sitemapContent.replace('</urlset>', `${videoBlock}</urlset>`);

    fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent, 'utf8');
    }
    console.log('[generate-video-seo] Synced 82 video URLs into sitemap.xml');
  }

  console.log('[generate-video-seo] ✅ Google Video SEO/GEO/AEO build complete!');
}

if (process.argv[1]?.endsWith('generate-video-seo.ts') || process.argv[1]?.endsWith('generate-video-seo.js')) {
  runGenerateVideoSeo().catch((err) => {
    console.error('[generate-video-seo] Fatal error:', err);
    process.exit(1);
  });
}
