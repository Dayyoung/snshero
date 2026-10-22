/**
 * googleNewsSheetService.ts
 * 구글 뉴스(Google News US Edition) 스프레드시트 실시간 연동 및 다국어 번역 서비스
 * 스프레드시트: https://docs.google.com/spreadsheets/d/e/2PACX-1vQkHP5pQDdSMrx3f0GyUz_rK5yqmMj5J12apkSom3JvF-NVk2yD55tFAk_Ka7qKM54dPr1ru3LP15Zu/pubhtml
 */

import { RedditPost } from './redditTypes';
import { RawGoogleNewsItem, INITIAL_GOOGLE_NEWS, convertGoogleNewsToRedditPost } from '../../data/googleNewsSeedData';
import { translateRedditPosts } from './redditTranslationService';
import { extractFirstValidImageUrl } from './googleNewsImageResolver';

export const GOOGLE_NEWS_PUB_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQkHP5pQDdSMrx3f0GyUz_rK5yqmMj5J12apkSom3JvF-NVk2yD55tFAk_Ka7qKM54dPr1ru3LP15Zu/pub?output=csv';
export const GOOGLE_NEWS_PUBHTML_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQkHP5pQDdSMrx3f0GyUz_rK5yqmMj5J12apkSom3JvF-NVk2yD55tFAk_Ka7qKM54dPr1ru3LP15Zu/pubhtml/sheet?headers=false&gid=797674022';
export const GOOGLE_NEWS_SPREADSHEET_ID = '1CT5Yy1-i6kkOfx3d-Yw1osOEYbN7fkk8IDiI8Vm82vM';
export const getPostCacheKey = (lang: string = 'ko') => `hero_reddit_google_news_posts_v13_${lang}`;
const RAW_CACHE_KEY = 'hero_reddit_google_news_raw_v13';
const LAST_FETCH_KEY = 'hero_reddit_google_news_last_fetch_v13';

// AI Studio 및 브라우저 환경에서 이전 구형 캐시(v1~v12) 자동 정리
if (typeof window !== 'undefined') {
  try {
    ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10', 'v11', 'v12'].forEach((ver) => {
      localStorage.removeItem(`hero_reddit_google_news_posts_${ver}`);
      localStorage.removeItem(`hero_reddit_google_news_posts_${ver}_ko`);
      localStorage.removeItem(`hero_reddit_google_news_posts_${ver}_en`);
      localStorage.removeItem(`hero_reddit_google_news_raw_${ver}`);
      localStorage.removeItem(`hero_reddit_google_news_last_fetch_${ver}`);
    });
  } catch {}
}

/**
 * 다양한 날짜/시간 문자열(YYYY-MM-DD H:mm, YYYY-MM-DD HH:mm:ss, ISO 등)을 Unix timestamp(ms)로 정확히 파싱
 * - 1자리 시간(예: "2026-10-22 8:00", "2026-10-22 7:59")도 NaN 없이 100% 일관되게 KST(UTC+9) 기준으로 파싱
 */
export function parseTimestampMillis(raw: string): number {
  if (!raw || !raw.trim()) return 0;
  const clean = raw.trim();

  // 1. YYYY-M-D H:m(:s) 형식 정규식 매칭 (1자리/2자리 월·일·시·분·초 완벽 지원)
  const m = clean.match(
    /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
  );
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);
    const hour = m[4] !== undefined ? parseInt(m[4], 10) : 0;
    const min = m[5] !== undefined ? parseInt(m[5], 10) : 0;
    const sec = m[6] !== undefined ? parseInt(m[6], 10) : 0;
    // 시트의 수집일시는 한국 표준시(KST, UTC+9)이므로 머신 타임존과 무관하게 고정 변환
    return Date.UTC(year, month - 1, day, hour, min, sec) - 9 * 60 * 60 * 1000;
  }

  // 2. 명시적 타임존 오프셋(Z, +09:00 등)이 포함된 ISO 문자열
  if (/Z|[+-]\d{2}(?::?\d{2})?$/i.test(clean)) {
    const p = Date.parse(clean);
    if (!isNaN(p) && p > 0) return p;
  }

  const p = Date.parse(clean);
  return isNaN(p) ? 0 : p;
}

/**
 * RawGoogleNewsItem 배열을 수집일시(Timestamp) 기준 최신순(내림차순, 최신글 우선)으로 강제 정렬
 * (시트의 위/아래 어디에 누적 추가되어도 항상 최신 기사가 상단에 오도록 보장)
 */
export function sortNewsItemsLatestFirst(items: RawGoogleNewsItem[]): RawGoogleNewsItem[] {
  return items
    .map((item, idx) => ({ item, idx, time: parseTimestampMillis(item.timestamp) }))
    .sort((a, b) => {
      if (a.time !== b.time) return b.time - a.time; // 최신 시간 우선 (내림차순)
      return a.idx - b.idx; // 동일 시간일 경우 시트 상단 행 우선
    })
    .map((entry) => entry.item);
}

export type GoogleNewsSyncStatus = 'idle' | 'syncing' | 'ok' | 'unauthorized' | 'error';

export class GoogleNewsSheetService {
  private static cachedPosts: RedditPost[] = [];
  private static lastLang: string = '';
  private static syncStatus: GoogleNewsSyncStatus = 'idle';
  private static syncErrorMessage: string = '';
  private static listeners: Array<(status: GoogleNewsSyncStatus, lastFetch: number) => void> = [];

  static getSyncStatus(): GoogleNewsSyncStatus {
    return this.syncStatus;
  }

  static getSyncErrorMessage(): string {
    return this.syncErrorMessage;
  }

  static getLastFetchTime(): number {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(LAST_FETCH_KEY);
        return stored ? parseInt(stored, 10) : 0;
      }
    } catch {}
    return 0;
  }

  static subscribe(fn: (status: GoogleNewsSyncStatus, lastFetch: number) => void): () => void {
    this.listeners.push(fn);
    fn(this.syncStatus, this.getLastFetchTime());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private static notifyListeners(): void {
    const lastFetch = this.getLastFetchTime();
    this.listeners.forEach((fn) => {
      try {
        fn(this.syncStatus, lastFetch);
      } catch {}
    });
  }

  /**
   * HTML 엔티티 디코딩 헬퍼 (pubhtml/sheet 테이블 파싱용)
   */
  private static decodeHtmlCell(rawHtml: string): string {
    return rawHtml
      .replace(/<[^>]+>/g, '')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .trim();
  }

  /**
   * pubhtml/sheet HTML 테이블을 파싱하여 RawGoogleNewsItem 배열로 변환 (최신순 정렬 보장)
   * - docs.google.com에서 307 리다이렉트 및 5분 캐시 없이 즉시 no-cache 200 OK로 응답하는 엔드포인트용
   */
  static parsePubHtml(htmlText: string): RawGoogleNewsItem[] {
    const trMatches = htmlText.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    if (!trMatches || trMatches.length <= 1) return [];

    const items: RawGoogleNewsItem[] = [];
    let tsIdx = 0;
    let catIdx = 1;
    let kwIdx = 2;
    let titleIdx = 3;
    let summaryIdx = 4;
    let imgIdx = 5;
    let srcIdx = 6;
    let headerParsed = false;

    for (let i = 0; i < trMatches.length; i++) {
      const tdMatches = trMatches[i].match(/<td[^>]*>[\s\S]*?<\/td>/gi);
      if (!tdMatches || tdMatches.length < 4) continue;

      const cols = tdMatches.map((td) => this.decodeHtmlCell(td));
      const firstCol = cols[0] || '';

      if (
        !headerParsed &&
        (firstCol.includes('수집일시') ||
          firstCol.toLowerCase().includes('timestamp') ||
          cols.some((c) => c.includes('기사 제목') || c.toLowerCase().includes('headline')))
      ) {
        headerParsed = true;
        cols.forEach((col, idx) => {
          const low = col.toLowerCase();
          if (low.includes('시간') || low.includes('일시') || low.includes('date') || low.includes('time') || low.includes('timestamp')) tsIdx = idx;
          else if (low.includes('카테고리') || low.includes('category')) catIdx = idx;
          else if (low.includes('키워드') || low.includes('keyword')) kwIdx = idx;
          else if (low.includes('제목') || low.includes('title') || low.includes('headline')) titleIdx = idx;
          else if (low.includes('요약') || low.includes('본문') || low.includes('summary') || low.includes('desc') || low.includes('내용')) summaryIdx = idx;
          else if (low.includes('이미지') || low.includes('image') || low.includes('photo') || low.includes('사진') || low.includes('img')) imgIdx = idx;
          else if (low.includes('링크') || low.includes('url') || low.includes('source') || low.includes('원문') || low.includes('출처')) srcIdx = idx;
        });
        continue;
      }

      const title = cols[titleIdx] || cols[3] || cols[1] || '';
      if (!title || title === '제목' || title === 'Title' || title === '기사 제목 (Headline)') continue;

      const timestamp = cols[tsIdx] || cols[0] || '';
      if (!timestamp || timestamp.includes('수집일시')) continue;

      const category = catIdx >= 0 ? cols[catIdx] : undefined;
      const keywords = kwIdx >= 0 ? cols[kwIdx] : undefined;
      const summary = cols[summaryIdx] || cols[4] || cols[2] || '';
      const imageUrl = extractFirstValidImageUrl(cols[imgIdx] || cols[5] || cols[3] || '');
      const sourceUrl = cols[srcIdx] || cols[6] || cols[4] || '';

      items.push({
        timestamp,
        category,
        keywords,
        title,
        summary,
        imageUrl,
        sourceUrl,
      });
    }

    return sortNewsItemsLatestFirst(items);
  }

  /**
   * CSV 텍스트를 파싱하여 RawGoogleNewsItem 배열로 변환 (스마트 헤더 분석 지원 및 최신순 정렬)
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

    // 줄 파싱 헬퍼
    const parseLineCols = (line: string): string[] => {
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
      return cols.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
    };

    // 헤더 행 분석
    const headerCols = parseLineCols(lines[0]);
    let tsIdx = 0;
    let titleIdx = 3;
    let summaryIdx = 4;
    let imgIdx = 5;
    let srcIdx = 6;
    let catIdx = 1;
    let kwIdx = 2;

    headerCols.forEach((col, idx) => {
      const low = col.toLowerCase();
      if (low.includes('시간') || low.includes('일시') || low.includes('date') || low.includes('time') || low.includes('timestamp') || low.includes('수집일시')) tsIdx = idx;
      else if (low.includes('카테고리') || low.includes('category')) catIdx = idx;
      else if (low.includes('키워드') || low.includes('keyword')) kwIdx = idx;
      else if (low.includes('제목') || low.includes('title') || low.includes('headline')) titleIdx = idx;
      else if (low.includes('요약') || low.includes('본문') || low.includes('summary') || low.includes('desc') || low.includes('내용')) summaryIdx = idx;
      else if (low.includes('이미지') || low.includes('image') || low.includes('photo') || low.includes('사진') || low.includes('img') || low.includes('리스트')) imgIdx = idx;
      else if (low.includes('링크') || low.includes('url') || low.includes('source') || low.includes('원문') || low.includes('출처')) srcIdx = idx;
    });

    const items: RawGoogleNewsItem[] = [];

    for (let r = 1; r < lines.length; r++) {
      const cols = parseLineCols(lines[r]);
      const title = cols[titleIdx] || cols[3] || cols[1] || '';
      if (!title || title === '제목' || title === 'Title' || title === 'Headline') continue;

      const timestamp = cols[tsIdx] || cols[0] || '';
      const category = catIdx >= 0 ? cols[catIdx] : undefined;
      const keywords = kwIdx >= 0 ? cols[kwIdx] : undefined;
      const summary = cols[summaryIdx] || cols[4] || cols[2] || '';
      const imageUrl = extractFirstValidImageUrl(cols[imgIdx] || cols[5] || cols[3] || '');
      const sourceUrl = cols[srcIdx] || cols[6] || cols[4] || '';

      items.push({
        timestamp,
        category,
        keywords,
        title,
        summary,
        imageUrl,
        sourceUrl,
      });
    }

    return sortNewsItemsLatestFirst(items);
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
            return sortNewsItemsLatestFirst(parsed);
          }
        }
      }
    } catch {}
    return sortNewsItemsLatestFirst([...INITIAL_GOOGLE_NEWS]);
  }

  /**
   * 구글 시트에서 최신 구글 뉴스 실시간 fetch
   * - /reddit 진입 시마다 브라우저 캐시(no-store) 및 307 리다이렉트 지연을 우회하여 실시간 시트 데이터를 즉시 가져옴
   */
  static async fetchLatestNewsFromSheet(): Promise<RawGoogleNewsItem[]> {
    this.syncStatus = 'syncing';
    this.syncErrorMessage = '';
    this.notifyListeners();

    const cacheBuster = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    // 실시간 원격 시트 엔드포인트를 최우선 배치하고, 정적 백업 파일(/data/google-news.csv)은 모든 원격 호출이 실패했을 때만 최후 폴백으로 사용
    const endpoints: Array<{ url: string; type: 'html' | 'csv' }> = [
      // 1. Google Sheets pubhtml/sheet 직접 호출 (HTTP/2 200 OK, CORS: *, Cache-Control: no-cache/no-store, 307 리다이렉트 없음!)
      { url: `${GOOGLE_NEWS_PUBHTML_SHEET_URL}&_t=${cacheBuster}`, type: 'html' },
      // 2. Google Sheets 공개 CSV 직접 호출 (gid 명시)
      { url: `${GOOGLE_NEWS_PUB_CSV_URL}&single=true&gid=797674022&_t=${cacheBuster}`, type: 'csv' },
      // 3. Google Sheets 공개 CSV 직접 호출 (기본)
      { url: `${GOOGLE_NEWS_PUB_CSV_URL}&_t=${cacheBuster}`, type: 'csv' },
      // 4. Vite 로컬 프록시 (Dev 환경)
      { url: `/api/reddit/google-news-sheet?_t=${cacheBuster}`, type: 'csv' },
      // 5. CorsProxy.io 실시간 우회 프록시
      { url: `https://corsproxy.io/?url=${encodeURIComponent(`${GOOGLE_NEWS_PUB_CSV_URL}&_t=${cacheBuster}`)}`, type: 'csv' },
      // 6. AllOrigins 실시간 우회 프록시
      { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(`${GOOGLE_NEWS_PUB_CSV_URL}&_t=${cacheBuster}`)}`, type: 'csv' },
      // 7. 최후 로컬 정적 백업 CSV (모든 원격 네트워크가 오프라인일 때만 사용)
      { url: `/data/google-news.csv?_t=${cacheBuster}`, type: 'csv' },
    ];

    let detectedUnauthorized = false;

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const resp = await fetch(ep.url, {
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeoutId);

        if (resp.status === 401 || resp.status === 403) {
          detectedUnauthorized = true;
          continue;
        }

        if (resp.ok) {
          const text = await resp.text();

          // 구글 로그인 리디렉션 HTML 감지
          if (
            text.includes('ServiceLogin') ||
            text.includes('accounts.google.com') ||
            text.includes('Google 계정에 로그인하십시오') ||
            text.includes('"error":"unauthorized"')
          ) {
            detectedUnauthorized = true;
            continue;
          }

          if (ep.type === 'html' || (text.includes('<tr') && text.includes('<td'))) {
            const parsedHtml = this.parsePubHtml(text);
            if (parsedHtml.length > 0) {
              this.syncStatus = 'ok';
              this.persistRawNews(parsedHtml);
              this.notifyListeners();
              return parsedHtml;
            }
            continue;
          }

          // SPA fallback index.html 오탐 방지
          if (text.trim().startsWith('<!DOCTYPE html') || text.trim().startsWith('<html')) {
            continue;
          }

          // 정상적인 CSV 텍스트인지 검증 (2줄 이상 + 쉼표 포함)
          const lines = text.trim().split('\n');
          if (lines.length >= 2 && lines[0].includes(',')) {
            const parsedCsv = this.parseCsv(text);
            if (parsedCsv.length > 0) {
              this.syncStatus = 'ok';
              this.persistRawNews(parsedCsv);
              this.notifyListeners();
              return parsedCsv;
            }
          }
        }
      } catch {
        // 다음 엔드포인트로 즉시 폴백
      }
    }

    if (detectedUnauthorized) {
      this.syncStatus = 'unauthorized';
      this.syncErrorMessage = '구글 스프레드시트가 비공개 상태입니다. 공유 설정을 [링크가 있는 모든 사용자(뷰어)]로 변경해주세요.';
    } else {
      this.syncStatus = 'error';
      this.syncErrorMessage = '구글 뉴스 스프레드시트 데이터를 가져오지 못했습니다. 캐시된 뉴스를 표시합니다.';
    }

    this.notifyListeners();
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
   * 번역된 구글 뉴스 포스트를 인메모리 및 언어별 로컬스토리지 캐시에 즉시 반영
   */
  static updatePostTranslations(translatedList: RedditPost[], targetLang: string = 'ko'): void {
    if (!translatedList || translatedList.length === 0) return;
    const transById = new Map(translatedList.map((p) => [p.id, p]));
    const transBySource = new Map(
      translatedList.filter((p) => p.sourceUrl).map((p) => [`${p.sourceUrl}__${p.createdAt}`, p])
    );
    let hasChange = false;

    if (this.cachedPosts.length > 0) {
      this.cachedPosts = this.cachedPosts.map((post) => {
        const match =
          transById.get(post.id) ||
          (post.sourceUrl ? transBySource.get(`${post.sourceUrl}__${post.createdAt}`) : undefined);
        if (match && (match.title !== post.title || match.body !== post.body || match.isTranslated)) {
          hasChange = true;
          return {
            ...post,
            title: match.title,
            body: match.body,
            originalTitle: match.originalTitle || post.originalTitle || post.title,
            originalBody: match.originalBody || post.originalBody || post.body,
            isTranslated: true,
          };
        }
        return post;
      });
    }

    if (hasChange && typeof window !== 'undefined') {
      try {
        localStorage.setItem(getPostCacheKey(targetLang), JSON.stringify(this.cachedPosts));
      } catch {}
    }
  }

  /**
   * 기존 캐시 및 시드 데이터에서 이미 번역된 한국어 제목/요약 사전 생성
   * (시트 재조회 시 이미 번역된 글들이 영어로 깜빡이거나 초기화되지 않도록 보호)
   */
  private static buildExistingTranslationMap(targetLang: string): Map<string, { title: string; body?: string }> {
    const map = new Map<string, { title: string; body?: string }>();
    if (targetLang === 'en') return map;

    // 1. 시드 데이터(INITIAL_GOOGLE_NEWS)의 사전 번역 매핑 등록
    INITIAL_GOOGLE_NEWS.forEach((seed) => {
      if (seed.sourceUrl && seed.title) {
        map.set(`url:${seed.sourceUrl}__${seed.timestamp}`, { title: seed.title, body: seed.summary });
      }
    });

    // 2. 메모리 및 로컬스토리지 기존 번역본 등록
    const recordPost = (p: RedditPost) => {
      if (!p.isTranslated && p.title === p.originalTitle) return;
      if (p.sourceUrl) {
        map.set(`url_ts:${p.sourceUrl}__${p.createdAt}`, { title: p.title, body: p.body });
      }
      if (p.originalTitle) {
        map.set(`orig:${p.originalTitle}`, { title: p.title, body: p.body });
      }
    };

    this.cachedPosts.forEach(recordPost);
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(getPostCacheKey(targetLang));
        if (stored) {
          const parsed: RedditPost[] = JSON.parse(stored);
          if (Array.isArray(parsed)) parsed.forEach(recordPost);
        }
      }
    } catch {}

    return map;
  }

  /**
   * 구글 뉴스를 RedditPost 목록으로 변환하고 현재 언어로 번역하여 반환
   * - 시트 응답 즉시(번역 대기 전) 최신 뉴스를 화면에 먼저 반영하고, 이어서 번역을 비동기 완료하여 지연/구형 시드 노출을 원천 차단
   */
  static async getGoogleNewsPosts(targetLang: string = 'ko', _forceRefresh: boolean = false): Promise<RedditPost[]> {
    const cacheKey = getPostCacheKey(targetLang);
    const existingTransMap = this.buildExistingTranslationMap(targetLang);

    // 1. 최신 시트 데이터 실시간 fetch 및 수집일시 최신순 강제 정렬
    const rawItems = await this.fetchLatestNewsFromSheet();
    const sortedRawItems = sortNewsItemsLatestFirst(rawItems);

    // 2. RedditPost 변환 + 기존 번역본 즉시 결합
    const urlUsageMap = new Map<string, number>();
    const converted = sortedRawItems
      .map((item, idx) => {
        const post = convertGoogleNewsToRedditPost(item, idx, urlUsageMap);
        if (targetLang !== 'en') {
          const pre =
            existingTransMap.get(`orig:${item.title}`) ||
            existingTransMap.get(`url_ts:${item.sourceUrl}__${post.createdAt}`) ||
            existingTransMap.get(`url:${item.sourceUrl}__${item.timestamp}`);
          if (pre && pre.title) {
            return {
              ...post,
              title: pre.title,
              body: pre.body || post.body,
              originalTitle: item.title,
              originalBody: item.summary,
              isTranslated: true,
            };
          }
        }
        return post;
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    // 3. 번역 완료를 기다리지 않고 최신 시트 포스트를 즉시 캐시 및 UI에 반영! (어제 뉴스나 시드로 롤백되는 현상 원천 차단)
    this.cachedPosts = converted;
    this.lastLang = targetLang;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(converted));
      } catch {}
    }
    this.notifyListeners();

    // 4. 언어 설정에 맞춰 상위 미번역 기사 병렬 번역 후 재반영
    if (targetLang !== 'en') {
      try {
        const translated = await translateRedditPosts(converted, targetLang, 35);
        const sortedTranslated = [...translated].sort((a, b) => b.createdAt - a.createdAt);
        this.cachedPosts = sortedTranslated;
        this.lastLang = targetLang;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(sortedTranslated));
          } catch {}
        }
        this.notifyListeners();
        return sortedTranslated;
      } catch (err) {
        console.warn('[GoogleNewsSheetService] Translation failed, returning converted', err);
      }
    }

    return converted;
  }

  /**
   * 동기식(캐시) 조회 - 초기 렌더링 즉시 표시용 (최신순 정렬 보장)
   */
  static getCachedGoogleNewsPosts(targetLang: string = 'ko'): RedditPost[] {
    if (this.cachedPosts.length > 0 && this.lastLang === targetLang) {
      return [...this.cachedPosts].sort((a, b) => b.createdAt - a.createdAt);
    }

    const cacheKey = getPostCacheKey(targetLang);
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const parsed: RedditPost[] = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sorted = [...parsed].sort((a, b) => b.createdAt - a.createdAt);
            this.cachedPosts = sorted;
            this.lastLang = targetLang;
            return sorted;
          }
        }
      }
    } catch {}

    // 캐시가 없으면 저장된 Raw 뉴스 또는 기본 시드로 즉시 변환 (최신순 정렬)
    const fallbackUsageMap = new Map<string, number>();
    const rawSource = this.getStoredRawNews();
    const sortedSeeds = sortNewsItemsLatestFirst(rawSource);
    const fallback = sortedSeeds
      .map((item, idx) => convertGoogleNewsToRedditPost(item, idx, fallbackUsageMap))
      .sort((a, b) => b.createdAt - a.createdAt);
    this.cachedPosts = fallback;
    this.lastLang = targetLang;
    return fallback;
  }
}
