/**
 * redditLiveFeedService.ts
 * 실제 reddit.com 실시간 피드(RSS/JSON) 자동 수집 및 정규화 서비스
 * 무비용 정적 아키텍처, 브라우저 직접 파싱, 로컬스토리지 캐시 및 시드 포스트 스마트 병합
 */

import { RedditPost, cleanRedditUrl, HUMOR_SUBREDDITS } from './redditTypes';
import { translateRedditPosts } from './redditTranslationService';

/**
 * 이미지 URL에서 고유 파일 식별자(해시 ID)를 추출하여 동일 사진의 썸네일과 원본 중복을 정확히 감지
 * 예: 
 * - https://preview.redd.it/banl4w6jg4th1.jpeg?width=640... -> 'banl4w6jg4th1'
 * - https://i.redd.it/banl4w6jg4th1.jpeg -> 'banl4w6jg4th1'
 * - https://b.thumbs.redditmedia.com/xyz.jpg -> 'xyz'
 */
export function getImageFingerprint(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const clean = url.replace(/&amp;/g, '&').split('?')[0].trim();
  
  // 1) Reddit 고유 파일 해시 (8자리 이상의 영숫자)
  const redditHashMatch = clean.match(/([a-zA-Z0-9_-]{8,})\.(?:jpe?g|png|webp|gif)/i);
  if (redditHashMatch) {
    return redditHashMatch[1].toLowerCase();
  }

  // 2) 일반 URL의 경우 파일명(확장자 제외)
  try {
    const parsed = new URL(clean, 'http://localhost');
    const segments = parsed.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || '';
    const nameWithoutExt = last.replace(/\.[^/.]+$/, '');
    if (nameWithoutExt.length >= 6) {
      return nameWithoutExt.toLowerCase();
    }
    return (parsed.hostname + parsed.pathname).toLowerCase();
  } catch {
    return clean.toLowerCase();
  }
}

/**
 * 이미지 목록에서 동일 사진의 중복(동일 해시)을 완벽하게 제거하고 고화질 원본(i.redd.it)을 우선 채택
 */
export function deduplicateImageUrls(urls: string[]): string[] {
  if (!urls || !Array.isArray(urls)) return [];
  const map = new Map<string, string>(); // fingerprint -> bestUrl

  for (const rawUrl of urls) {
    if (!rawUrl || typeof rawUrl !== 'string') continue;
    const cleanUrl = rawUrl.replace(/&amp;/g, '&').trim();
    if (!cleanUrl || cleanUrl.includes('award') || cleanUrl.includes('emoji')) continue;

    const fp = getImageFingerprint(cleanUrl);
    if (!fp) continue;

    const existing = map.get(fp);
    if (!existing) {
      map.set(fp, cleanUrl);
    } else {
      // 새 URL이 고화질 원본(i.redd.it 또는 쿼리스트링 없는 원본)이고 기존 것이 썸네일(preview.redd.it, thumbs 등)이면 교체
      const isNewOriginal = cleanUrl.includes('i.redd.it') || (!cleanUrl.includes('thumb') && !cleanUrl.includes('width=140'));
      const isOldThumbnail = existing.includes('thumb') || existing.includes('preview.redd.it') || existing.includes('width=140');
      if (isNewOriginal && isOldThumbnail) {
        map.set(fp, cleanUrl);
      }
    }
  }

  return Array.from(map.values());
}

const LIVE_CACHE_KEY = 'hero_reddit_live_posts_v1';
const LIVE_SYNC_TIME_KEY = 'hero_reddit_live_sync_time';

export interface LiveSyncState {
  isSyncing: boolean;
  lastSyncTime: number | null;
  postCount: number;
  error?: string | null;
}

export class RedditLiveFeedService {
  /**
   * 로컬에 캐시된 실시간 포스트 로드 (48시간 초과된 노후 캐시 자동 정리 및 최신순 정렬)
   */
  static getCachedLivePosts(): RedditPost[] {
    try {
      const raw = localStorage.getItem(LIVE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const now = Date.now();
          const maxAge = 1000 * 60 * 60 * 48; // 48시간
          const fresh = parsed
            .filter((p) => {
              const age = now - (p.createdAt || 0);
              return age < maxAge;
            })
            .map((p) => {
              if (p.permalink) p.permalink = cleanRedditUrl(p.permalink);
              if (p.media?.url) p.media.url = cleanRedditUrl(p.media.url);
              if (p.media?.galleryUrls && p.media.galleryUrls.length > 0) {
                const deduped = deduplicateImageUrls(p.media.galleryUrls);
                if (deduped.length <= 1) {
                  if (p.media.type === 'gallery') p.media.type = 'image';
                  p.media.url = deduped[0] || p.media.url;
                  p.media.galleryUrls = undefined;
                } else {
                  p.media.galleryUrls = deduped;
                }
              }
              return p;
            });
          // 최신 시간순 정렬
          return fresh.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
      }
    } catch (e) {
      console.warn('[RedditLiveFeed] Failed to parse cached live posts', e);
    }
    return [];
  }

  /**
   * 마지막 동기화 시각 조회
   */
  static getLastSyncTime(): number | null {
    try {
      const raw = localStorage.getItem(LIVE_SYNC_TIME_KEY);
      return raw ? parseInt(raw, 10) : null;
    } catch {
      return null;
    }
  }

  /**
   * 새로고침마다 다른 유머 서브레딧의 최신 글을 수집할 수 있도록 순환 인덱스 반환
   */
  static getRotatingHumorSubreddit(): string {
    try {
      const key = 'hero_reddit_humor_rotation_idx';
      const current = parseInt(localStorage.getItem(key) || '0', 10);
      const next = (current + 1) % HUMOR_SUBREDDITS.length;
      localStorage.setItem(key, next.toString());
      return HUMOR_SUBREDDITS[current];
    } catch {
      return HUMOR_SUBREDDITS[Math.floor(Math.random() * HUMOR_SUBREDDITS.length)];
    }
  }

  /**
   * 실제 reddit.com 실시간 RSS 피드 가져오기 및 파싱 (메인 피드는 인기 유머 서브레딧 전담 수집)
   */
  static async fetchRealtimePosts(subreddit: string = 'popular', targetLang: string = 'ko'): Promise<RedditPost[]> {
    const isFront = ['popular', 'all', 'home'].includes(subreddit.toLowerCase());
    // 메인 피드 요청 시 레딧 글로벌 인기 유머글만 수집되도록 유머 풀에서 순환 선택
    const targetSub = isFront ? this.getRotatingHumorSubreddit() : subreddit;

    const urlsToTry = [
      `/api/reddit/feed?sub=${encodeURIComponent(targetSub)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.reddit.com/r/${targetSub}/.rss`)}`,
    ];

    let xmlText = '';

    for (const url of urlsToTry) {
      try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (resp.ok) {
          const text = await resp.text();
          if (text.includes('<entry>') || text.includes('<item>')) {
            xmlText = text;
            break;
          }
        }
      } catch (err) {
        // try next endpoint
      }
    }

    if (!xmlText) {
      // 실시간 피드 응답이 지연되거나 차단된 경우 기존 캐시 반환
      return this.getCachedLivePosts();
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const entries = Array.from(xmlDoc.querySelectorAll('entry'));

      const livePosts: RedditPost[] = [];

      entries.forEach((entry, idx) => {
        const titleEl = entry.querySelector('title');
        const title = titleEl ? titleEl.textContent?.trim() || '' : '';
        if (!title || title.toLowerCase().includes('links')) return;

        const authorNameEl = entry.querySelector('author name');
        let author = authorNameEl ? authorNameEl.textContent?.replace('/u/', '').trim() || 'reddit_user' : 'reddit_user';

        const categoryEl = entry.querySelector('category');
        const subName = categoryEl ? (categoryEl.getAttribute('term') || subreddit) : subreddit;

        const idEl = entry.querySelector('id');
        const origId = idEl ? idEl.textContent?.replace('t3_', '').trim() : `live_${idx}`;
        const postId = `live_${subName}_${origId}`;

        const updatedEl = entry.querySelector('updated') || entry.querySelector('published');
        const createdAt = updatedEl?.textContent ? new Date(updatedEl.textContent).getTime() : (Date.now() - idx * 1000 * 60 * 15);

        // 썸네일 이미지 추출
        // 썸네일 및 본문 내 전체 이미지 URL 전수 추출 (갤러리 글 다중 사진 지원)
        const contentEl = entry.querySelector('content');
        const contentHtml = contentEl ? contentEl.textContent || '' : '';

        const mediaThumb = entry.querySelector('thumbnail') || entry.querySelector('media\\:thumbnail, thumbnail');
        let initialThumbUrl = mediaThumb ? mediaThumb.getAttribute('url') : null;

        const candidateImages: string[] = [];
        if (initialThumbUrl) {
          candidateImages.push(initialThumbUrl.replace(/&amp;/g, '&'));
        }

        if (contentHtml) {
          // 1) <img src="..."> 전체 추출
          const imgMatches = contentHtml.matchAll(/<img[^>]+src="([^">]+)"/gi);
          for (const m of imgMatches) {
            if (m && m[1]) {
              candidateImages.push(m[1].replace(/&amp;/g, '&'));
            }
          }

          // 2) <a href="..."> 원본 고화질 이미지 링크 추출 (i.redd.it, preview.redd.it)
          const linkMatches = contentHtml.matchAll(/href="(https?:\/\/(?:i|preview)\.redd\.it\/[^\s"'>]+)"/gi);
          for (const m of linkMatches) {
            if (m && m[1]) {
              candidateImages.push(m[1].replace(/&amp;/g, '&'));
            }
          }
        }

        // 동일 사진(해시 중복) 완전 제거 및 고화질 원본(i.redd.it) 우선 채택
        const extractedImages = deduplicateImageUrls(candidateImages);

        // HTML 태그 제거된 텍스트 요약
        let body = '';
        if (contentHtml) {
          const div = document.createElement('div');
          div.innerHTML = contentHtml;
          body = div.textContent?.trim() || '';
          if (body.length > 500) body = body.substring(0, 500) + '...';
        }

        const score = Math.floor(22000 + (entries.length - idx) * 1600 + Math.random() * 800);
        const commentCount = Math.floor(450 + (entries.length - idx) * 60 + Math.random() * 50);

        // 원본 Reddit 포스트 링크 추출 (t3_ 접두사 없는 순수 공식 링크)
        const linkEl = entry.querySelector('link');
        const cleanPermalink = linkEl ? linkEl.getAttribute('href') || '' : '';
        const redditDirectUrl = cleanPermalink || `https://www.reddit.com/r/${subName}/comments/${origId}/`;

        // 동영상 링크 및 비디오 타입 정밀 감지 (v.redd.it, mp4, youtube 등)
        const vRedditMatch = contentHtml.match(/https?:\/\/(?:v\.redd\.it|www\.reddit\.com\/r\/[^\/]+\/comments\/[^\/]+\/video\/)[^\s"'>]+/i);
        const youtubeMatch = contentHtml.match(/https?:\/\/(?:www\.youtube\.com\/watch\?v=|youtu\.be\/)[^\s"'>]+/i);
        const videoExtMatch = contentHtml.match(/https?:\/\/[^\s"'>]+\.(?:mp4|webm)[^\s"'>]*/i);

        const isVideoPost = Boolean(
          vRedditMatch ||
          youtubeMatch ||
          videoExtMatch ||
          contentHtml.includes('v.redd.it') ||
          contentHtml.includes('<video') ||
          /\[video\]|\[영상\]|\(video\)|\(영상\)|video taken by|gameplay|clip|animation/i.test(title + ' ' + body)
        );

        let mediaObj: RedditPost['media'] = undefined;
        if (isVideoPost) {
          // 해당 게시물 고유의 원본 비디오 링크 (순수 ID 기반 공식 링크로 직결)
          const rawVideoLink = vRedditMatch 
            ? vRedditMatch[0] 
            : (youtubeMatch 
                ? youtubeMatch[0] 
                : (videoExtMatch 
                    ? videoExtMatch[0] 
                    : redditDirectUrl));
          const originalVideoLink = cleanRedditUrl(rawVideoLink);

          mediaObj = {
            type: 'video',
            url: originalVideoLink,
            previewUrl: extractedImages[0] || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
            domain: vRedditMatch ? 'v.redd.it' : (youtubeMatch ? 'youtube.com' : 'reddit.com'),
            aspectRatio: 16 / 9,
          };
        } else if (extractedImages.length > 1) {
          // 사진이 여러 장인 글: 갤러리(Gallery) 타입으로 등록 및 전체 이미지 보존
          mediaObj = {
            type: 'gallery',
            url: extractedImages[0],
            previewUrl: extractedImages[0],
            galleryUrls: extractedImages,
            aspectRatio: 4 / 3,
          };
        } else if (extractedImages.length === 1) {
          mediaObj = {
            type: 'image',
            url: extractedImages[0],
            aspectRatio: 16 / 9,
          };
        }

        livePosts.push({
          id: postId,
          subreddit: subName,
          title,
          author,
          authorAvatar: `https://images.unsplash.com/photo-${1534528741775 + (idx % 10) * 1000}?auto=format&fit=crop&w=64&q=80`,
          createdAt,
          score,
          commentCount,
          body: body || undefined,
          media: mediaObj,
          permalink: cleanRedditUrl(cleanPermalink || redditDirectUrl),
          flair: isVideoPost
            ? { text: '동영상 / Video', bgColor: '#FF4500', textColor: '#FFFFFF' }
            : { text: '실시간 Hot / Live', bgColor: '#FF4500', textColor: '#FFFFFF' },
          upvoteRatio: 0.96,
        });
      });

      if (livePosts.length > 0) {
        // 구글 번역을 통해 현재 설정된 언어로 실시간 자동 번역 적용
        let finalPosts = livePosts;
        try {
          finalPosts = await translateRedditPosts(livePosts, targetLang, 15);
        } catch {
          // 번역 실패 시 원문 유지
        }
        
        // 기존 캐시와 중복 방지 및 최신 글 우선 upsert 병합
        const existing = this.getCachedLivePosts();
        const postMap = new Map<string, RedditPost>();

        // 1. 기존 캐시 등록
        existing.forEach((p) => postMap.set(p.id, p));

        // 2. 새로 수집된 최신 글 upsert (최신 정보로 덮어쓰기)
        finalPosts.forEach((p) => postMap.set(p.id, p));

        // 3. 최신 시간순(createdAt 내림차순)으로 정렬하여 최대 200개 유지
        const merged = Array.from(postMap.values())
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .slice(0, 200);

        localStorage.setItem(LIVE_CACHE_KEY, JSON.stringify(merged));
        localStorage.setItem(LIVE_SYNC_TIME_KEY, Date.now().toString());
        // 새로운 실시간 피드가 수집되었으므로 트렌드 캐시 자동 갱신 트리거
        try {
          localStorage.removeItem('hero_reddit_trending_date');
        } catch {
          // ignore
        }
        return merged;
      }
    } catch (parseErr) {
      console.warn('[RedditLiveFeed] XML parsing failed', parseErr);
    }

    return this.getCachedLivePosts();
  }

  /**
   * 피드 하단 도달 시 추가 실시간 서브레딧 글 배치 수집 (메인 피드는 유머 풀 순환)
   */
  static async fetchMoreLiveBatch(currentSubreddit: string = 'popular', targetLang: string = 'ko'): Promise<RedditPost[]> {
    const isFront = ['popular', 'all', 'home'].includes(currentSubreddit.toLowerCase());
    const popularPool = isFront ? [...HUMOR_SUBREDDITS] : [currentSubreddit];
    const cached = this.getCachedLivePosts();
    const cachedSubs = new Set(cached.map((p) => p.subreddit.toLowerCase()));
    
    let nextSub = popularPool.find((s) => !cachedSubs.has(s.toLowerCase()));
    if (!nextSub) {
      nextSub = popularPool[Math.floor(Math.random() * popularPool.length)];
    }
    return this.fetchRealtimePosts(nextSub, targetLang);
  }
}
