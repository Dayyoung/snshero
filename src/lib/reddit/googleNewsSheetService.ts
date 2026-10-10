/**
 * googleNewsSheetService.ts
 * 구글 뉴스(Google News US Edition) 스프레드시트 실시간 연동 및 다국어 번역 서비스
 * 스프레드시트: https://docs.google.com/spreadsheets/d/1CT5Yy1-i6kkOfx3d-Yw1osOEYbN7fkk8IDiI8Vm82vM/edit
 */

import { RedditPost } from './redditTypes';
import { RawGoogleNewsItem, INITIAL_GOOGLE_NEWS, convertGoogleNewsToRedditPost } from '../../data/googleNewsSeedData';
import { translateRedditPosts } from './redditTranslationService';

const SPREADSHEET_ID = '1CT5Yy1-i6kkOfx3d-Yw1osOEYbN7fkk8IDiI8Vm82vM';
const CACHE_KEY = 'hero_reddit_google_news_posts_v1';
const RAW_CACHE_KEY = 'hero_reddit_google_news_raw_v1';
const LAST_FETCH_KEY = 'hero_reddit_google_news_last_fetch';

export class GoogleNewsSheetService {
  private static cachedPosts: RedditPost[] = [];
  private static lastLang: string = '';

  /**
   * CSV 텍스트를 파싱하여 RawGoogleNewsItem 배열로 변환 (따옴표 및 줄바꿈 지원 표준 파서)
   */
  static parseCsv(csvText: string): RawGoogleNewsItem[] {
    const lines: string[] = [];
    let currentLine = '';
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
        currentLine += char;
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    if (lines.length <= 1) return [];

    const items: RawGoogleNewsItem[] = [];

    // 1행(헤더: 수집일시,제목,본문 요약,이미지 리스트,원문 링크) 제외하고 파싱
    for (let r = 1; r < lines.length; r++) {
      const line = lines[r];
      const cols: string[] = [];
      let curCol = '';
      let inQuote = false;

      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '"') {
          inQuote = !inQuote;
        } else if (ch === ',' && !inQuote) {
          cols.push(curCol.trim());
          curCol = '';
        } else {
          curCol += ch;
        }
      }
      cols.push(curCol.trim());

      if (cols.length >= 2 && cols[1]) {
        items.push({
          timestamp: (cols[0] || '').replace(/^"|"$/g, ''),
          title: (cols[1] || '').replace(/^"|"$/g, '').replace(/""/g, '"'),
          summary: (cols[2] || '').replace(/^"|"$/g, '').replace(/""/g, '"'),
          imageUrl: (cols[3] || '').replace(/^"|"$/g, ''),
          sourceUrl: (cols[4] || '').replace(/^"|"$/g, ''),
        });
      }
    }

    return items;
  }

  /**
   * 로컬스토리지 및 초기 시드에서 Raw 뉴스 아이템 로드
   */
  static getStoredRawNews(): RawGoogleNewsItem[] {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(RAW_CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch {}
    return [...INITIAL_GOOGLE_NEWS];
  }

  /**
   * 구글 시트에서 최신 구글 뉴스 실시간 fetch (Vite 프록시 및 Google direct fallback)
   */
  static async fetchLatestNewsFromSheet(): Promise<RawGoogleNewsItem[]> {
    const endpoints = [
      // 1) Vite dev 프록시 엔드포인트
      `/api/reddit/google-news-sheet?_t=${Date.now()}`,
      // 2) 정적 데이터 fallback 엔드포인트
      `/data/google-news.csv?_t=${Date.now()}`,
      // 3) Google Sheets GViz CSV 엔드포인트
      `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&_t=${Date.now()}`,
      // 4) Google Sheets export CSV 엔드포인트
      `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&_t=${Date.now()}`,
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const text = await resp.text();
          // 로그인 HTML이 아닌 정상적인 CSV 텍스트인지 검증
          if (text.includes('수집일시') || text.includes('원문 링크') || text.split('\n').length >= 2) {
            const parsed = this.parseCsv(text);
            if (parsed.length > 0) {
              if (typeof window !== 'undefined') {
                localStorage.setItem(RAW_CACHE_KEY, JSON.stringify(parsed));
                localStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
              }
              return parsed;
            }
          }
        }
      } catch {
        // continue to next endpoint
      }
    }

    // 실패 시 저장된 캐시 또는 기본 시드 반환
    return this.getStoredRawNews();
  }

  /**
   * 구글 뉴스를 RedditPost 목록으로 변환하고 현재 언어로 번역하여 반환
   * @param targetLang 현재 언어 설정 (예: 'ko', 'en', 'ja' 등)
   */
  static async getGoogleNewsPosts(targetLang: string = 'ko'): Promise<RedditPost[]> {
    // 1. 최신 시트 데이터 가져오기 (실시간 fetch)
    const rawItems = await this.fetchLatestNewsFromSheet();

    // 2. RedditPost 객체로 변환
    const converted = rawItems.map((item, idx) => convertGoogleNewsToRedditPost(item, idx));

    // 3. 언어 설정에 맞춰 번역 (targetLang이 'en'이 아니면 번역 수행)
    if (targetLang !== 'en') {
      try {
        const translated = await translateRedditPosts(converted, targetLang);
        this.cachedPosts = translated;
        this.lastLang = targetLang;
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(translated));
        }
        return translated;
      } catch (err) {
        console.warn('[GoogleNewsSheetService] Translation failed, returning converted', err);
      }
    }

    this.cachedPosts = converted;
    this.lastLang = targetLang;
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(converted));
    }
    return converted;
  }

  /**
   * 동기식(캐시) 조회 - 초기 렌더링 즉시 표시용
   */
  static getCachedGoogleNewsPosts(targetLang: string = 'ko'): RedditPost[] {
    if (this.cachedPosts.length > 0 && this.lastLang === targetLang) {
      return this.cachedPosts;
    }

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsed: RedditPost[] = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cachedPosts = parsed;
            this.lastLang = targetLang;
            return parsed;
          }
        }
      }
    } catch {}

    // 캐시가 없으면 기본 시드로 즉시 변환
    const fallback = INITIAL_GOOGLE_NEWS.map((item, idx) => convertGoogleNewsToRedditPost(item, idx));
    this.cachedPosts = fallback;
    return fallback;
  }
}
