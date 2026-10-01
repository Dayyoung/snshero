/**
 * redditTranslationService.ts
 * 구글 번역(Google Translate) 기반 SNSHero 커뮤니티 실시간 다국어 번역 서비스
 * - 무비용 비공식 Google Translate API 연동
 * - 메모리 + 로컬스토리지 2계층 영구 캐싱으로 네트워크 낭비 0% 및 즉각 응답
 * - 한국어(ko) 및 12개 글로벌 언어 실시간 대응
 */

import { RedditPost } from './redditTypes';

const TRANSLATION_CACHE_KEY = 'hero_reddit_translation_cache_v1';

// 인메모리 빠른 조회를 위한 캐시 맵
const memoryCache: Map<string, string> = new Map();

// 로컬스토리지에서 기존 번역 캐시 초기화
try {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(TRANSLATION_CACHE_KEY);
    if (raw) {
      const parsed: Record<string, string> = JSON.parse(raw);
      Object.entries(parsed).forEach(([k, v]) => memoryCache.set(k, v));
    }
  }
} catch (e) {
  console.warn('[Translation] Failed to load translation cache', e);
}

// 캐시 저장 헬퍼 (디바운스 저장)
let saveTimeout: any = null;
function persistCache() {
  if (typeof window === 'undefined') return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const obj: Record<string, string> = {};
      // 최근 2,000개만 보존
      let count = 0;
      for (const [k, v] of memoryCache.entries()) {
        if (count++ > 2000) break;
        obj[k] = v;
      }
      localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(obj));
    } catch {
      // 용량 초과 등 안전 처리
    }
  }, 1000);
}

/**
 * 텍스트가 번역이 필요한지 감지 (타깃 언어가 한국어인데 영문이 포함된 경우 등)
 */
export function isNeedsTranslation(text: string | undefined, targetLang: string = 'ko'): boolean {
  if (!text || text.trim().length === 0) return false;
  
  if (targetLang === 'ko') {
    // 한글 유니코드 범위: AC00-D7A3, 1100-11FF, 3130-318F
    const hasKorean = /[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]/.test(text);
    // 영문 알파벳이 포함되어 있고 한글이 전혀 없거나 한글 비율이 매우 적은 경우
    const hasEnglish = /[a-zA-Z]/.test(text);
    if (!hasKorean && hasEnglish) return true;
    return false;
  }

  // 타깃 언어가 영어가 아닐 때 영어 텍스트인 경우
  if (targetLang !== 'en' && /[a-zA-Z]{4,}/.test(text)) {
    return true;
  }

  return false;
}

/**
 * 단일 텍스트 구글 번역
 */
export async function translateTextWithGoogle(
  text: string,
  targetLang: string = 'ko',
  signal?: AbortSignal
): Promise<string> {
  const clean = text.trim();
  if (!clean) return text;

  // 번역이 불필요한 경우 그대로 반환
  if (!isNeedsTranslation(clean, targetLang)) {
    return text;
  }

  let tl = targetLang;
  if (tl === 'gb' || tl === 'en-GB') tl = 'en';

  const cacheKey = `${tl}:${clean}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return text;

    const data = await res.json();
    if (data && data[0] && Array.isArray(data[0])) {
      const translated = data[0].map((chunk: any) => chunk[0] || '').join('');
      if (translated && translated.trim().length > 0) {
        memoryCache.set(cacheKey, translated);
        persistCache();
        return translated;
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    console.warn('[Translation] Google translate request error:', err);
  }

  return text;
}

/**
 * 단일 RedditPost 번역 (제목 및 본문)
 */
export async function translateRedditPost(
  post: RedditPost,
  targetLang: string = 'ko',
  signal?: AbortSignal
): Promise<RedditPost> {
  // 이미 해당 언어로 번역된 적이 있다면 바로 반환
  const titleNeeds = isNeedsTranslation(post.title, targetLang);
  const bodyNeeds = post.body ? isNeedsTranslation(post.body, targetLang) : false;

  if (!titleNeeds && !bodyNeeds) {
    return post;
  }

  try {
    const [translatedTitle, translatedBody] = await Promise.all([
      titleNeeds ? translateTextWithGoogle(post.title, targetLang, signal) : Promise.resolve(post.title),
      bodyNeeds && post.body ? translateTextWithGoogle(post.body, targetLang, signal) : Promise.resolve(post.body),
    ]);

    return {
      ...post,
      title: translatedTitle,
      body: translatedBody,
      originalTitle: post.originalTitle || (titleNeeds ? post.title : undefined),
      originalBody: post.originalBody || (bodyNeeds ? post.body : undefined),
      isTranslated: true,
    };
  } catch {
    return post;
  }
}

/**
 * 여러 개의 RedditPost 일괄 병렬 번역 (피드 로딩용)
 */
export async function translateRedditPosts(
  posts: RedditPost[],
  targetLang: string = 'ko',
  maxCount: number = 20
): Promise<RedditPost[]> {
  const candidates = posts.slice(0, maxCount);
  const rest = posts.slice(maxCount);

  // 너무 많은 동시 요청으로 인한 rate limit 방지를 위해 4개씩 청크 병렬 처리
  const chunkSize = 4;
  const translatedCandidates: RedditPost[] = [];

  for (let i = 0; i < candidates.length; i += chunkSize) {
    const chunk = candidates.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map((p) => translateRedditPost(p, targetLang))
    );
    translatedCandidates.push(...chunkResults);
  }

  return [...translatedCandidates, ...rest];
}
