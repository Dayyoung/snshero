/**
 * redditTrendingService.ts
 * 실제 reddit.com 첫 화면 상단 "Trending Today" 4개 대형 캐러셀 카드를
 * 매일 및 실시간으로 자동 갱신하고 큐레이션하는 동적 트렌드 엔진
 */

import { RedditPost, RedditTrendingItem } from './redditTypes';
import { RedditLiveFeedService } from './redditLiveFeedService';
import { GoogleNewsSheetService } from './googleNewsSheetService';
import { SEED_POSTS, SEED_TRENDING, SEED_SUBREDDITS } from '../../data/redditSeedData';

const TRENDING_DATE_KEY = 'hero_reddit_trending_date';
const TRENDING_CACHE_KEY = 'hero_reddit_trending_cache';

export class RedditTrendingService {
  /**
   * 오늘 날짜 문자열 반환 (YYYY-MM-DD)
   */
  static getTodayKey(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 서브레딧 대표 아이콘 조회
   */
  static getSubredditIcon(subName: string): string {
    const lower = subName.toLowerCase();
    const found = Object.values(SEED_SUBREDDITS).find((s) => s.name.toLowerCase() === lower);
    if (found && found.iconUrl) return found.iconUrl;

    // 대표 서브레딧별 기본 프리셋 아이콘
    const iconPresets: Record<string, string> = {
      popular: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
      gaming: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=128&q=80',
      technology: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=128&q=80',
      hanguk: 'https://images.unsplash.com/photo-1546874177-9e664107314e?auto=format&fit=crop&w=128&q=80',
      askreddit: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=128&q=80',
      memes: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=128&q=80',
      worldnews: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=128&q=80',
      pcmasterrace: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=128&q=80',
      science: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=128&q=80',
      mildlyinteresting: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=128&q=80',
    };

    return iconPresets[lower] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80';
  }

  /**
   * 실시간 피드 및 최신 게시물들로부터 오늘의 트렌드 4개 카드 추출
   */
  static getDailyTrendingItems(
    currentPosts: RedditPost[] = [],
    language: 'ko' | 'en' = 'ko',
    forceRefresh: boolean = false
  ): RedditTrendingItem[] {
    const today = this.getTodayKey();
    const isKo = language !== 'en';

    // 1. 오늘 날짜 캐시 확인 (강제 갱신이 아닌 경우)
    if (!forceRefresh) {
      try {
        const cachedDate = localStorage.getItem(TRENDING_DATE_KEY);
        const cachedJson = localStorage.getItem(TRENDING_CACHE_KEY);

        if (cachedDate === today && cachedJson) {
          const parsed: RedditTrendingItem[] = JSON.parse(cachedJson);
          if (Array.isArray(parsed) && parsed.length >= 4) {
            // 캐시된 트렌드 아이템의 최신 번역 타이틀 동기화
            const postMap = new Map<string, RedditPost>();
            currentPosts.forEach((p) => postMap.set(p.id, p));
            RedditLiveFeedService.getCachedLivePosts().forEach((p) => postMap.set(p.id, p));

            return parsed.map((item) => {
              if (item.postId && postMap.has(item.postId)) {
                const freshPost = postMap.get(item.postId)!;
                return {
                  ...item,
                  title: freshPost.title || item.title,
                };
              }
              return item;
            });
          }
        }
      } catch (e) {
        console.warn('[RedditTrending] Failed to read cached trending items', e);
      }
    }

    // 2. 구글 뉴스 기사 풀 로드 (실시간 구글 뉴스로 100% 트렌딩 구성)
    const googleNewsPosts = GoogleNewsSheetService.getCachedGoogleNewsPosts(language);
    const candidates = googleNewsPosts.length > 0 ? googleNewsPosts : currentPosts;

    // 3. 고화질 이미지/미디어가 있는 포스트 필터링 (트렌드 카드는 큰 썸네일 필수)
    const visualPosts = candidates.filter((p) => {
      if (!p.media) return false;
      const url = p.media.previewUrl || p.media.url;
      if (!url) return false;
      // 너무 작은 아이콘이나 링크 형태 제외
      return p.media.type === 'image' || p.media.type === 'video' || p.media.type === 'gallery';
    });

    const now = Date.now();

    // 4. 트렌딩 점수 계산 및 서브레딧별 다양성 확보 정렬
    // 트렌드 점수 공식: (추천수 * 1.2 + 댓글수 * 8 + 실시간가중치) / (경과시간_시간단위 + 2)^1.1
    const scoredPosts = visualPosts.map((p) => {
      const ageHours = Math.max(0.1, (now - (p.createdAt || now)) / 3600000);
      const isLive = p.id.startsWith('live_');
      const liveBonus = isLive ? 15000 : 0;
      const rawScore = (p.score || 0) * 1.2 + (p.commentCount || 0) * 8 + liveBonus;
      const decay = Math.pow(ageHours + 2, 1.15);
      const trendScore = rawScore / decay;

      return { post: p, score: trendScore };
    });

    // 점수 내림차순 정렬
    scoredPosts.sort((a, b) => b.score - a.score);

    // 5. 서브레딧 다양성 보장: 서로 다른 서브레딧에서 최상위 4개 선정
    const selectedPosts: RedditPost[] = [];
    const usedSubreddits = new Set<string>();

    for (const item of scoredPosts) {
      const sub = item.post.subreddit.toLowerCase();
      if (!usedSubreddits.has(sub)) {
        selectedPosts.push(item.post);
        usedSubreddits.add(sub);
      }
      if (selectedPosts.length >= 4) break;
    }

    // 만약 서로 다른 서브레딧으로 4개가 안 채워진 경우, 남은 고득점 글로 보충
    if (selectedPosts.length < 4) {
      for (const item of scoredPosts) {
        if (!selectedPosts.some((p) => p.id === item.post.id)) {
          selectedPosts.push(item.post);
        }
        if (selectedPosts.length >= 4) break;
      }
    }

    // 6. RedditTrendingItem 형태로 변환
    let trendingItems: RedditTrendingItem[] = selectedPosts.map((post, idx) => {
      const imageUrl = post.media?.previewUrl || post.media?.url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80';
      const cleanSub = post.subreddit;
      const iconUrl = this.getSubredditIcon(cleanSub);

      let desc = '';
      if (post.body && post.body.trim().length > 10) {
        desc = post.body.replace(/[#*`_\[\]()]/g, '').trim().slice(0, 75);
        if (post.body.length > 75) desc += '...';
      } else {
        const upvotes = (post.score || 1000).toLocaleString();
        const comments = (post.commentCount || 100).toLocaleString();
        desc = isKo 
          ? `🔥 추천 ${upvotes}개 • 댓글 ${comments}개로 r/${cleanSub} 실시간 화제`
          : `🔥 ${upvotes} upvotes • ${comments} comments trending in r/${cleanSub}`;
      }

      return {
        id: `trend_daily_${today}_${post.id || idx}`,
        title: post.title,
        description: desc,
        subreddit: cleanSub,
        subredditIcon: iconUrl,
        imageUrl,
        postId: post.id,
      };
    });

    // 만약 후보 글이 부족하여 4개 미만인 경우, SEED_TRENDING에서 보충
    if (trendingItems.length < 4) {
      const seedPool = [...SEED_TRENDING];
      for (const seed of seedPool) {
        if (!trendingItems.some((t) => t.subreddit.toLowerCase() === seed.subreddit.toLowerCase())) {
          trendingItems.push({
            ...seed,
            id: `trend_daily_${today}_${seed.id}`,
          });
        }
        if (trendingItems.length >= 4) break;
      }
    }

    // 최종 4개로 슬라이스
    trendingItems = trendingItems.slice(0, 4);

    // 7. 오늘 날짜로 캐싱
    try {
      localStorage.setItem(TRENDING_DATE_KEY, today);
      localStorage.setItem(TRENDING_CACHE_KEY, JSON.stringify(trendingItems));
    } catch (saveErr) {
      console.warn('[RedditTrending] Failed to cache daily trending items', saveErr);
    }

    return trendingItems;
  }
}
