/**
 * redditSeoManager.ts
 * SNSHero 커뮤니티(레딧 클론) 검색엔진 및 생성형 AI 검색(GEO/AEO/SEO/GA) 최적화 엔진
 */

import { RedditPost, RedditSubreddit } from './redditTypes';

export class RedditSeoManager {
  private static ldJsonScriptElement: HTMLScriptElement | null = null;

  /**
   * GA4 (Google Analytics) 가상 페이지뷰 및 커스텀 이벤트 전송
   */
  static trackPageView(path: string, title: string): void {
    if (typeof window === 'undefined') return;
    try {
      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (typeof gtag === 'function') {
        gtag('event', 'page_view', {
          page_path: path,
          page_title: title,
        });
      }
    } catch {
      // safe catch
    }
  }

  static trackEvent(action: string, params: Record<string, unknown> = {}): void {
    if (typeof window === 'undefined') return;
    try {
      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (typeof gtag === 'function') {
        gtag('event', action, params);
      }
    } catch {
      // safe catch
    }
  }

  /**
   * 피드 및 서브레딧 페이지 메타 태그 & GEO/SEO 업데이트
   */
  static applySubredditSeo(sub: RedditSubreddit, activeSort: string = 'new'): void {
    if (typeof document === 'undefined') return;

    const title = `r/${sub.name}: ${sub.title} - SNSHero`;
    const desc = sub.description.slice(0, 160);
    const url = `https://snshero.com/r/${sub.name}`;

    document.title = title;
    this.setMetaTag('name', 'description', desc);
    this.setMetaTag('property', 'og:title', title);
    this.setMetaTag('property', 'og:description', desc);
    this.setMetaTag('property', 'og:image', sub.bannerUrl || sub.iconUrl);
    this.setMetaTag('property', 'og:url', url);
    this.setMetaTag('name', 'twitter:title', title);
    this.setMetaTag('name', 'twitter:description', desc);
    this.setMetaTag('name', 'twitter:image', sub.bannerUrl || sub.iconUrl);

    // Schema.org CollectionPage / DiscussionForumPosting (GEO)
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `r/${sub.name} - SNSHero Community`,
      description: sub.description,
      url,
      isPartOf: {
        '@type': 'WebSite',
        name: 'SNSHero',
        url: 'https://snshero.com',
      },
      about: {
        '@type': 'Thing',
        name: sub.name,
        description: sub.description,
      },
    };

    this.injectJsonLd(jsonLd);
    this.trackPageView(`/r/${sub.name}?sort=${activeSort}`, title);
  }

  /**
   * 포스트 상세 페이지 메타 태그 & AEO/GEO/SEO 업데이트
   */
  static applyPostDetailSeo(post: RedditPost): void {
    if (typeof document === 'undefined') return;

    const title = `${post.title} : r/${post.subreddit} - SNSHero`;
    const desc = post.body ? post.body.slice(0, 160) : `${post.title} on r/${post.subreddit} - Discussed by u/${post.author}`;
    const url = `https://snshero.com/r/${post.subreddit}/comments/${post.id}`;
    const imageUrl = post.media?.url || 'https://snshero.com/logo.jpg';

    document.title = title;
    this.setMetaTag('name', 'description', desc);
    this.setMetaTag('property', 'og:title', title);
    this.setMetaTag('property', 'og:description', desc);
    this.setMetaTag('property', 'og:image', imageUrl);
    this.setMetaTag('property', 'og:url', url);
    this.setMetaTag('property', 'og:type', 'article');
    this.setMetaTag('name', 'twitter:title', title);
    this.setMetaTag('name', 'twitter:description', desc);
    this.setMetaTag('name', 'twitter:image', imageUrl);

    // 1) Q&A 형태(AskReddit 등 질문형) 포스트는 AEO(Answer Engine Optimization) QAPage 적용
    const isQnA = post.subreddit.toLowerCase() === 'askreddit' || post.title.trim().endsWith('?');
    // 2) 유튜브 등 비디오 포스트는 VideoObject 및 미디어 메타데이터 추가
    const isVideo = post.media?.type === 'video' && Boolean(post.media?.url);

    if (isVideo && post.media?.url) {
      this.setMetaTag('property', 'og:video', post.media.url);
      this.setMetaTag('property', 'og:video:type', 'text/html');
      this.setMetaTag('name', 'twitter:card', 'player');
    } else {
      this.setMetaTag('name', 'twitter:card', 'summary_large_image');
    }

    let jsonLd: Record<string, unknown>;

    if (isQnA) {
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'QAPage',
        mainEntity: {
          '@type': 'Question',
          name: post.title,
          text: post.body || post.title,
          answerCount: post.commentCount,
          upvoteCount: post.score,
          dateCreated: new Date(post.createdAt).toISOString(),
          author: {
            '@type': 'Person',
            name: post.author,
          },
        },
      };
    } else if (isVideo && post.media?.url) {
      // 비디오 포스트: Google Video Search & GEO 동영상 리치 스니펫 (VideoObject)
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: post.title,
        description: post.body ? post.body.slice(0, 300) : post.title,
        thumbnailUrl: [post.media.previewUrl || imageUrl],
        uploadDate: new Date(post.createdAt).toISOString(),
        contentUrl: post.media.url,
        embedUrl: post.media.url.includes('watch?v=')
          ? post.media.url.replace('watch?v=', 'embed/')
          : post.media.url,
        interactionStatistic: [
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/WatchAction',
            userInteractionCount: post.score,
          },
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/CommentAction',
            userInteractionCount: post.commentCount,
          },
        ],
        author: {
          '@type': 'Person',
          name: post.author,
        },
        publisher: {
          '@type': 'Organization',
          name: 'SNSHero',
          logo: {
            '@type': 'ImageObject',
            url: 'https://snshero.com/logo.jpg',
          },
        },
      };
    } else {
      // GEO: DiscussionForumPosting 구조화 데이터
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'DiscussionForumPosting',
        headline: post.title,
        articleBody: post.body || post.title,
        datePublished: new Date(post.createdAt).toISOString(),
        url,
        author: {
          '@type': 'Person',
          name: post.author,
        },
        interactionStatistic: [
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/LikeAction',
            userInteractionCount: post.score,
          },
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/CommentAction',
            userInteractionCount: post.commentCount,
          },
        ],
        publisher: {
          '@type': 'Organization',
          name: 'SNSHero',
          logo: {
            '@type': 'ImageObject',
            url: 'https://snshero.com/logo.jpg',
          },
        },
      };
    }

    this.injectJsonLd(jsonLd);
    this.trackPageView(`/r/${post.subreddit}/comments/${post.id}`, title);
  }

  /**
   * 기본 홈 피드 메타 복원
   */
  static applyHomeSeo(): void {
    if (typeof document === 'undefined') return;

    const title = 'SNSHero - Dive into anything: The Heart of the Internet';
    const desc = 'Reddit-style vibrant discussions, breaking trends, gaming news, memes, and communities with zero latency.';
    const url = 'https://snshero.com/';

    document.title = title;
    this.setMetaTag('name', 'description', desc);
    this.setMetaTag('property', 'og:title', title);
    this.setMetaTag('property', 'og:description', desc);
    this.setMetaTag('property', 'og:url', url);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'SNSHero Community',
      url: 'https://snshero.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://snshero.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    };

    this.injectJsonLd(jsonLd);
    this.trackPageView('/', title);
  }

  private static setMetaTag(attrName: string, attrValue: string, content: string): void {
    let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  private static injectJsonLd(data: Record<string, unknown>): void {
    if (!this.ldJsonScriptElement) {
      this.ldJsonScriptElement = document.getElementById('reddit-jsonld-tag') as HTMLScriptElement | null;
      if (!this.ldJsonScriptElement) {
        this.ldJsonScriptElement = document.createElement('script');
        this.ldJsonScriptElement.id = 'reddit-jsonld-tag';
        this.ldJsonScriptElement.type = 'application/ld+json';
        document.head.appendChild(this.ldJsonScriptElement);
      }
    }
    this.ldJsonScriptElement.textContent = JSON.stringify(data);
  }
}
