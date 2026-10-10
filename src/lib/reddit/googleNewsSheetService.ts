/**
 * googleNewsSheetService.ts
 * 구글 뉴스(Google News US Edition) 스프레드시트 실시간 연동 및 다국어 번역 서비스
 * 스프레드시트: https://docs.google.com/spreadsheets/d/1CT5Yy1-i6kkOfx3d-Yw1osOEYbN7fkk8IDiI8Vm82vM/edit
 */

import { RedditPost } from './redditTypes';
import { RawGoogleNewsItem, INITIAL_GOOGLE_NEWS, convertGoogleNewsToRedditPost } from '../../data/googleNewsSeedData';
import { translateRedditPosts } from './redditTranslationService';

export const GOOGLE_NEWS_SPREADSHEET_ID = '1CT5Yy1-i6kkOfx3d-Yw1osOEYbN7fkk8IDiI8Vm82vM';
const CACHE_KEY = 'hero_reddit_google_news_posts_v2';
const RAW_CACHE_KEY = 'hero_reddit_google_news_raw_v2';
const LAST_FETCH_KEY = 'hero_reddit_google_news_last_fetch_v2';

export type GoogleNewsSyncStatus = 'idle' | 'syncing' | 'ok' | 'unauthorized' | 'error';

export class GoogleNewsSheetService {
  private static cachedPosts: RedditPost[] = [];
  private static lastLang: string = '';
  private static syncStatus: GoogleNewsSyncStatus = 'idle';
  private static syncErrorMessage: string = '';

  static getSyncStatus(): GoogleNewsSyncStatus {
    return this.syncStatus;
  }

  static getSyncErrorMessage(): string {
    return this.syncErrorMessage;
  }

  /**
   * JSONP를 통한 구글 스프레드시트 gviz 실시간 조회 (브라우저 CORS 원천 우회)
   */
  private static fetchViaJsonp(url: string, timeoutMs: number = 7000): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        reject(new Error('JSONP not supported in non-browser environment'));
        return;
      }

      const callbackName = 'gviz_news_jsonp_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
      const script = document.createElement('script');
      const separator = url.includes('?') ? '&' : '?';
      script.src = `${url}${separator}tqx=responseHandler:${callbackName}&_t=${Date.now()}`;
      script.async = true;

      let timer: any = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        try {
          delete (window as any)[callbackName];
        } catch {
          (window as any)[callbackName] = undefined;
        }
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };

      timer = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP request timeout'));
      }, timeoutMs);

      (window as any)[callbackName] = (data: any) => {
        cleanup();
        resolve(data);
      };

      script.onerror = (err) => {
        cleanup();
        reject(err || new Error('JSONP script load error'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * GViz DataTable JSON 구조를 RawGoogleNewsItem 배열로 변환
   */
  private static parseGvizTable(data: any): RawGoogleNewsItem[] {
    if (!data || !data.table || !Array.isArray(data.table.rows)) {
      return [];
    }

    const rows = data.table.rows;
    const items: RawGoogleNewsItem[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !Array.isArray(r.c)) continue;
      const cells = r.c;

      const timestamp = cells[0]?.f || cells[0]?.v ? String(cells[0]?.f || cells[0]?.v).trim() : '';
      const title = cells[1]?.v ? String(cells[1].v).trim() : '';
      const summary = cells[2]?.v ? String(cells[2].v).trim() : '';
      const imageUrl = cells[3]?.v ? String(cells[3].v).trim() : '';
      const sourceUrl = cells[4]?.v ? String(cells[4].v).trim() : '';

      // 헤더 행("제목") 및 빈 제목 제외
      if (title && title !== '제목' && title !== 'Title') {
        items.push({
          timestamp,
          title,
          summary,
          imageUrl,
          sourceUrl,
        });
      }
    }

    return items;
  }

  /**
   * CSV 텍스트를 파싱하여 RawGoogleNewsItem 배열로 변환 (따옴표 및 줄바꿈 지원)
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
        const title = (cols[1] || '').replace(/^"|"$/g, '').replace(/""/g, '"').trim();
        if (title && title !== '제목' && title !== 'Title') {
          items.push({
            timestamp: (cols[0] || '').replace(/^"|"$/g, '').trim(),
            title,
            summary: (cols[2] || '').replace(/^"|"$/g, '').replace(/""/g, '"').trim(),
            imageUrl: (cols[3] || '').replace(/^"|"$/g, '').trim(),
            sourceUrl: (cols[4] || '').replace(/^"|"$/g, '').trim(),
          });
        }
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
   * 구글 시트에서 최신 구글 뉴스 실시간 fetch
   * (JSONP -> Vite Dev Proxy -> CORS Proxy -> Direct CSV 다단계 페일오버)
   */
  static async fetchLatestNewsFromSheet(): Promise<RawGoogleNewsItem[]> {
    this.syncStatus = 'syncing';
    this.syncErrorMessage = '';

    // 1단계: JSONP gviz API (브라우저 CORS 차단 원천 우회)
    if (typeof window !== 'undefined') {
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_NEWS_SPREADSHEET_ID}/gviz/tq`;
        const gvizData = await this.fetchViaJsonp(gvizUrl, 5000);
        const parsed = this.parseGvizTable(gvizData);
        if (parsed.length > 0) {
          this.syncStatus = 'ok';
          this.persistRawNews(parsed);
          return parsed;
        }
      } catch (jsonpErr) {
        console.warn('[GoogleNewsSheetService] JSONP fetch failed, trying proxy fallbacks:', jsonpErr);
      }
    }

    // 2단계: 엔드포인트 풀 시도
    const endpoints = [
      // Vite 로컬 프록시 (Dev 환경)
      `/api/reddit/google-news-sheet?_t=${Date.now()}`,
      // AllOrigins CORS Proxy (배포 프로덕션 환경에서 브라우저 CORS 우회)
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${GOOGLE_NEWS_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&_t=${Date.now()}`)}`,
      // Google Sheets GViz CSV 직접 호출
      `https://docs.google.com/spreadsheets/d/${GOOGLE_NEWS_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&_t=${Date.now()}`,
      // Google Sheets 웹 게시 export CSV
      `https://docs.google.com/spreadsheets/d/${GOOGLE_NEWS_SPREADSHEET_ID}/export?format=csv&_t=${Date.now()}`,
      // 로컬 정적 백업 CSV
      `/data/google-news.csv?_t=${Date.now()}`,
    ];

    let detectedUnauthorized = false;

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (resp.status === 401 || resp.status === 403) {
          detectedUnauthorized = true;
          continue;
        }

        if (resp.ok) {
          const text = await resp.text();

          // 구글 로그인 리디렉션 HTML 감지 (권한 없음 401/302 상태)
          if (text.includes('ServiceLogin') || text.includes('accounts.google.com') || text.includes('Google 계정에 로그인하십시오')) {
            detectedUnauthorized = true;
            continue;
          }

          // 정상적인 CSV 텍스트인지 검증
          if (text.includes('수집일시') || text.includes('원문 링크') || text.includes('http') || text.split('\n').length >= 2) {
            const parsed = this.parseCsv(text);
            if (parsed.length > 0) {
              this.syncStatus = 'ok';
              this.persistRawNews(parsed);
              return parsed;
            }
          }
        }
      } catch {
        // continue
      }
    }

    // 구글 시트 접근 권한이 닫혀있는 경우 상태 알림 설정
    if (detectedUnauthorized) {
      this.syncStatus = 'unauthorized';
      this.syncErrorMessage = '구글 스프레드시트가 비공개 상태입니다. 공유 설정을 [링크가 있는 모든 사용자(뷰어)]로 변경해주세요.';
      console.warn('[GoogleNewsSheetService] Google Sheet is private (401/302). Please set sharing permissions to Anyone with the link.');
    } else {
      this.syncStatus = 'error';
      this.syncErrorMessage = '구글 뉴스 스프레드시트 데이터를 가져오지 못했습니다. 캐시된 뉴스를 표시합니다.';
    }

    // 실패 시 저장된 캐시 또는 기본 시드 반환
    return this.getStoredRawNews();
  }

  private static persistRawNews(items: RawGoogleNewsItem[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(RAW_CACHE_KEY, JSON.stringify(items));
        localStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
      } catch {}
    }
  }

  /**
   * 구글 뉴스를 RedditPost 목록으로 변환하고 현재 언어로 번역하여 반환
   * @param targetLang 현재 언어 설정 (예: 'ko', 'en', 'ja' 등)
   * @param forceRefresh 강제 갱신 여부
   */
  static async getGoogleNewsPosts(targetLang: string = 'ko', forceRefresh: boolean = false): Promise<RedditPost[]> {
    if (forceRefresh) {
      this.cachedPosts = [];
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CACHE_KEY);
      }
    }

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
