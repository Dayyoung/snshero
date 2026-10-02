/**
 * redditLiveFeedService.ts
 * 실제 reddit.com 실시간 피드(RSS/JSON) 자동 수집 및 정규화 서비스
 * 무비용 정적 아키텍처, 브라우저 직접 파싱, 로컬스토리지 캐시 및 시드 포스트 스마트 병합
 */

import { RedditPost, cleanRedditUrl } from './redditTypes';
import { translateRedditPosts } from './redditTranslationService';

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
   * 실제 reddit.com 실시간 RSS 피드 가져오기 및 파싱
   */
  static async fetchRealtimePosts(subreddit: string = 'popular', targetLang: string = 'ko'): Promise<RedditPost[]> {
    const urlsToTry = [
      `/api/reddit/feed?sub=${encodeURIComponent(subreddit)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.reddit.com/r/${subreddit}/.rss`)}`,
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
        const mediaThumb = entry.querySelector('thumbnail') || entry.querySelector('media\\:thumbnail, thumbnail');
        let imageUrl = mediaThumb ? mediaThumb.getAttribute('url') : null;

        // content 내부 img 추출
        const contentEl = entry.querySelector('content');
        const contentHtml = contentEl ? contentEl.textContent || '' : '';

        if (!imageUrl && contentHtml) {
          const imgMatch = contentHtml.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1].replace(/&amp;/g, '&');
          }
        }

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
            previewUrl: imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
            domain: vRedditMatch ? 'v.redd.it' : (youtubeMatch ? 'youtube.com' : 'reddit.com'),
            aspectRatio: 16 / 9,
          };
        } else if (imageUrl) {
          mediaObj = {
            type: 'image',
            url: imageUrl,
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
   * 피드 하단 도달 시 추가 실시간 서브레딧 글 배치 수집
   */
  static async fetchMoreLiveBatch(currentSubreddit: string = 'popular', targetLang: string = 'ko'): Promise<RedditPost[]> {
    const popularPool = ['gaming', 'technology', 'AskReddit', 'memes', 'todayilearned', 'worldnews', 'pcmasterrace', 'aww', 'mildlyinteresting', 'science'];
    const cached = this.getCachedLivePosts();
    const cachedSubs = new Set(cached.map((p) => p.subreddit.toLowerCase()));
    
    let nextSub = popularPool.find((s) => !cachedSubs.has(s.toLowerCase()));
    if (!nextSub) {
      nextSub = popularPool[Math.floor(Math.random() * popularPool.length)];
    }
    return this.fetchRealtimePosts(nextSub, targetLang);
  }
}
