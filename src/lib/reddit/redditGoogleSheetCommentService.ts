/**
 * redditGoogleSheetCommentService.ts
 * 레딧 커뮤니티 실제 댓글 구글 스프레드시트 영구 등록 및 실시간 양방향 조회 서비스
 * - 가짜 목업 댓글 100% 완전 배제
 * - 새 댓글 작성 시 구글 폼을 통해 구글 시트에 즉시 등록 (Zero-DB 글로벌 공유)
 * - 구글 시트 gviz / CSV로부터 실시간 실제 댓글 수집 및 포스트별 계층 트리 구성
 */

import { RedditComment } from './redditTypes';

export const GOOGLE_FORM_COMMENT_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSer0AqPbpduTxfSJNg3X8Pa1C8h2L5_Skmbt0NDdVZt6bS1GA/formResponse';
export const GOOGLE_SHEET_COMMENT_ID = '1o8rwdG_O_-efkKHgf9oMpFaOUnAAVxMQVfDldFavbjg';
export const GOOGLE_SHEET_COMMENT_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_COMMENT_ID}/gviz/tq?tqx=out:csv`;

const FORM_ENTRY_CATEGORY = 'entry.971729544';
const FORM_ENTRY_LABEL = 'entry.815360484';
const FORM_ENTRY_TEXT = 'entry.1672381815';
const FORM_ENTRY_IMAGE_1 = 'entry.1335992406';

const LOCAL_STORAGE_SHEET_COMMENTS_KEY = 'hero_reddit_sheet_comments_cache_v2';
const LOCAL_STORAGE_PENDING_COMMENTS_KEY = 'hero_reddit_pending_sheet_comments_v2';

export interface SheetCommentMetadata {
  postId: string;
  author: string;
  parentId?: string | null;
  avatar?: string;
  createdAt: number;
}

export class RedditGoogleSheetCommentService {
  private static memoryCache: RedditComment[] | null = null;
  private static lastFetchTime: number = 0;
  private static fetchPromise: Promise<RedditComment[]> | null = null;

  /**
   * 구글 시트 CSV 파싱 (따옴표 및 줄바꿈 안전 파서)
   */
  private static parseCSV(csvText: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // 이스케이프 따옴표 건너뛰기
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.length > 0 && currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  /**
   * 구글 스프레드시트 타임스탬프 파싱
   */
  private static parseTimestamp(rawDate: string): number {
    if (!rawDate) return Date.now();
    try {
      // 한국어 형식: "2026. 10. 10 오후 1:38:22"
      const match = rawDate.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\s*(오전|오후)?\s*(\d{1,2}):(\d{1,2}):?(\d{1,2})?/);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const isPM = match[4] === '오후';
        let hour = parseInt(match[5], 10);
        if (isPM && hour < 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        const min = parseInt(match[6], 10);
        const sec = match[7] ? parseInt(match[7], 10) : 0;
        return new Date(year, month, day, hour, min, sec).getTime();
      }
      const parsed = Date.parse(rawDate);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    } catch {
      // fallback
    }
    return Date.now();
  }

  /**
   * image1 열에 저장된 메타데이터 쿼리스트링 파싱
   */
  private static parseMetadata(metaStr: string): Partial<SheetCommentMetadata> {
    const meta: Partial<SheetCommentMetadata> = {};
    if (!metaStr) return meta;

    try {
      const params = new URLSearchParams(metaStr);
      if (params.get('postId')) meta.postId = params.get('postId')!;
      if (params.get('author')) meta.author = params.get('author')!;
      if (params.get('parentId')) meta.parentId = params.get('parentId')!;
      if (params.get('avatar')) meta.avatar = params.get('avatar')!;
      if (params.get('createdAt')) meta.createdAt = parseInt(params.get('createdAt')!, 10);
    } catch {
      // fallback
    }
    return meta;
  }

  /**
   * label 열 파싱 (형식: "Author [postId]")
   */
  private static parseLabel(labelStr: string): { author: string; postId?: string } {
    if (!labelStr) return { author: 'SNSHeroHunter' };
    const match = labelStr.match(/^(.*?)\s*\[(.*?)\]$/);
    if (match) {
      return {
        author: match[1].trim() || 'SNSHeroHunter',
        postId: match[2].trim(),
      };
    }
    return { author: labelStr.trim() };
  }

  /**
   * 로컬에 임시 저장된 미반영 댓글 목록 조회
   */
  private static getPendingLocalComments(): RedditComment[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PENDING_COMMENTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * 로컬 임시 저장 댓글 추가
   */
  private static savePendingLocalComment(comment: RedditComment): void {
    if (typeof window === 'undefined') return;
    try {
      const pending = this.getPendingLocalComments();
      pending.unshift(comment);
      // 최근 100개까지만 유지
      localStorage.setItem(LOCAL_STORAGE_PENDING_COMMENTS_KEY, JSON.stringify(pending.slice(0, 100)));
    } catch (e) {
      console.warn('[RedditSheetComments] Failed to save pending comment', e);
    }
  }

  /**
   * 캐시된 구글 시트 댓글 목록 조회
   */
  static getCachedSheetComments(): RedditComment[] {
    if (this.memoryCache && this.memoryCache.length > 0) {
      return this.memoryCache;
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_SHEET_COMMENTS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.memoryCache = parsed;
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return [];
  }

  /**
   * 구글 시트로부터 모든 실제 댓글 최신 동기화
   */
  static async fetchAllSheetComments(force: boolean = false): Promise<RedditComment[]> {
    const now = Date.now();
    // 10초 이내 중복 호출 방지 (강제가 아닌 경우)
    if (!force && this.memoryCache && now - this.lastFetchTime < 10000) {
      return this.memoryCache;
    }

    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      try {
        const url = `${GOOGLE_SHEET_COMMENT_CSV_URL}&_t=${Date.now()}`;
        const resp = await fetch(url, {
          cache: 'no-cache',
          signal: AbortSignal.timeout(8000),
        });

        if (!resp.ok) {
          throw new Error(`HTTP error ${resp.status}`);
        }

        const csvText = await resp.text();
        const rows = this.parseCSV(csvText);
        if (rows.length <= 1) {
          return this.getCachedSheetComments();
        }

        // 헤더: 타임스탬프, category, label, text, image1 ...
        const comments: RedditComment[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 4) continue;

          const rawTimestamp = row[0] || '';
          const category = (row[1] || '').trim().toLowerCase();
          const label = row[2] || '';
          const text = (row[3] || '').trim();
          const metaStr = row[4] || '';

          // 오직 reddit_comment 카테고리만 수집
          if (category !== 'reddit_comment') continue;
          if (!text) continue;

          const meta = this.parseMetadata(metaStr);
          const parsedLabel = this.parseLabel(label);

          const postId = meta.postId || parsedLabel.postId;
          if (!postId) continue;

          const author = meta.author || parsedLabel.author || 'SNSHeroUser';
          const parentId = meta.parentId || null;
          const avatar = meta.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author)}`;
          const createdAt = meta.createdAt || this.parseTimestamp(rawTimestamp);
          const commentId = `gsheet_c_${createdAt}_${i}`;

          comments.push({
            id: commentId,
            postId,
            parentId: parentId || null,
            author,
            authorAvatar: avatar,
            authorKarma: 100,
            body: text,
            createdAt,
            score: 1,
            userVote: null,
            replies: [],
          });
        }

        // 최신 작성 순으로 정렬
        comments.sort((a, b) => b.createdAt - a.createdAt);

        // 로컬 임시 작성 댓글 중 아직 시트에 반영되지 않은 것 병합 (중복 방지)
        const pending = this.getPendingLocalComments();
        const pendingNonDuplicated = pending.filter(
          (p) => !comments.some((c) => c.postId === p.postId && c.body === p.body && Math.abs(c.createdAt - p.createdAt) < 60000)
        );

        const allComments = [...pendingNonDuplicated, ...comments];

        this.memoryCache = allComments;
        this.lastFetchTime = Date.now();

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_STORAGE_SHEET_COMMENTS_KEY, JSON.stringify(allComments));
          } catch {
            // quota limit
          }
        }

        return allComments;
      } catch (err) {
        console.warn('[RedditGoogleSheetCommentService] Failed to fetch comments from Google Sheet:', err);
        return this.getCachedSheetComments();
      } finally {
        this.fetchPromise = null;
      }
    })();

    return this.fetchPromise;
  }

  /**
   * 특정 포스트의 댓글 트리(댓글 + 대댓글) 조회
   */
  static getCommentsTreeForPost(postId: string, allComments?: RedditComment[]): RedditComment[] {
    const pool = allComments || this.getCachedSheetComments();
    const cleanId = postId.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');

    // 해당 포스트의 댓글만 필터링 (원본 ID 및 파생 ID 매칭)
    const postComments = pool.filter(
      (c) => c.postId === postId || c.postId === cleanId || cleanId.includes(c.postId) || c.postId.includes(cleanId)
    );

    // 댓글 트리 구조 생성
    const topLevel: RedditComment[] = [];
    const commentMap = new Map<string, RedditComment>();

    for (const c of postComments) {
      commentMap.set(c.id, { ...c, replies: [] });
    }

    for (const c of postComments) {
      const mapped = commentMap.get(c.id)!;
      if (mapped.parentId && commentMap.has(mapped.parentId)) {
        const parent = commentMap.get(mapped.parentId)!;
        parent.replies = parent.replies || [];
        if (!parent.replies.some((r) => r.id === mapped.id)) {
          parent.replies.push(mapped);
        }
      } else {
        if (!topLevel.some((t) => t.id === mapped.id)) {
          topLevel.push(mapped);
        }
      }
    }

    // 최신 순 정렬
    topLevel.sort((a, b) => b.createdAt - a.createdAt);
    return topLevel;
  }

  /**
   * 특정 포스트의 댓글 개수 조회
   */
  static getCommentCount(postId: string): number {
    const cleanId = postId.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
    const pool = this.getCachedSheetComments();
    return pool.filter(
      (c) => c.postId === postId || c.postId === cleanId || cleanId.includes(c.postId) || c.postId.includes(cleanId)
    ).length;
  }

  /**
   * 새 댓글을 구글 시트 및 로컬에 등록
   */
  static async submitCommentToSheet(params: {
    postId: string;
    text: string;
    author: string;
    avatarUrl?: string;
    parentId?: string | null;
  }): Promise<RedditComment> {
    const { postId, text, author, avatarUrl, parentId } = params;
    const cleanId = postId.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
    const now = Date.now();
    const cleanAuthor = author.trim() || 'SNSHeroUser';
    const cleanAvatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanAuthor)}`;

    const newComment: RedditComment = {
      id: `local_sheet_${now}_${Math.random().toString(36).substring(2, 7)}`,
      postId: cleanId,
      parentId: parentId || null,
      author: cleanAuthor,
      authorAvatar: cleanAvatar,
      authorKarma: 100,
      body: text.trim(),
      createdAt: now,
      score: 1,
      userVote: 'up',
      replies: [],
    };

    // 1. 로컬 캐시 및 Pending 저장소에 즉시 반영 (화면 지연 0초)
    this.savePendingLocalComment(newComment);
    if (this.memoryCache) {
      this.memoryCache.unshift(newComment);
    } else {
      this.memoryCache = [newComment];
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_SHEET_COMMENTS_KEY, JSON.stringify(this.memoryCache));
      } catch {
        // quota
      }
    }

    // 2. 구글 폼 비동기 전송
    const metaString = `postId=${encodeURIComponent(cleanId)}&author=${encodeURIComponent(cleanAuthor)}&parentId=${encodeURIComponent(parentId || '')}&avatar=${encodeURIComponent(cleanAvatar)}&createdAt=${now}`;
    const labelString = `${cleanAuthor} [${cleanId}]`;

    const formData = new URLSearchParams();
    formData.append(FORM_ENTRY_CATEGORY, 'reddit_comment');
    formData.append(FORM_ENTRY_LABEL, labelString);
    formData.append(FORM_ENTRY_TEXT, text.trim());
    formData.append(FORM_ENTRY_IMAGE_1, metaString);

    const formBodyStr = formData.toString();

    // 2-1: Direct fetch fallback (mode: 'no-cors' 백그라운드 비동기)
    if (typeof window !== 'undefined') {
      try {
        fetch(GOOGLE_FORM_COMMENT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBodyStr,
        }).catch((err) => {
          console.warn('[RedditSheetComments] Direct fetch submit warning:', err);
        });
      } catch (err) {
        console.warn('[RedditSheetComments] Failed to trigger fetch to google form', err);
      }
    }

    return newComment;
  }
}
