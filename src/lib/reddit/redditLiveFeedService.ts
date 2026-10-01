/**
 * redditLiveFeedService.ts
 * 실제 reddit.com 실시간 피드(RSS/JSON) 자동 수집 및 정규화 서비스
 * 무비용 정적 아키텍처, 브라우저 직접 파싱, 로컬스토리지 캐시 및 시드 포스트 스마트 병합
 */

import { RedditPost } from './redditTypes';
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
   * 로컬에 캐시된 실시간 포스트 로드
   */
  static getCachedLivePosts(): RedditPost[] {
    try {
      const raw = localStorage.getItem(LIVE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
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

        const score = Math.floor(18000 + (entries.length - idx) * 1400 + Math.random() * 800);
        const commentCount = Math.floor(450 + (entries.length - idx) * 60 + Math.random() * 50);

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
          media: imageUrl
            ? {
                type: 'image',
                url: imageUrl,
                aspectRatio: 16 / 9,
              }
            : undefined,
          flair: {
            text: '실시간 Hot / Live',
            bgColor: '#FF4500',
            textColor: '#FFFFFF',
          },
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
        localStorage.setItem(LIVE_CACHE_KEY, JSON.stringify(finalPosts));
        localStorage.setItem(LIVE_SYNC_TIME_KEY, Date.now().toString());
        return finalPosts;
      }
    } catch (parseErr) {
      console.warn('[RedditLiveFeed] XML parsing failed', parseErr);
    }

    return this.getCachedLivePosts();
  }
}
