import { db, storage } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, ref, uploadBytes, getDownloadURL } from './firebaseMock';
import { CommunityPost, CommunityComment, CardData, CommunityWritableCategory, PostFlair, PostReport, CommunitySortMode } from '../types';
import { sanitizeForFirestore } from './utils';

export const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSer0AqPbpduTxfSJNg3X8Pa1C8h2L5_Skmbt0NDdVZt6bS1GA/formResponse';
export const GOOGLE_SHEET_ID = '1o8rwdG_O_-efkKHgf9oMpFaOUnAAVxMQVfDldFavbjg';
export const GOOGLE_SHEET_GVIZ_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq`;
export const GOOGLE_SHEET_CSV_URL = `${GOOGLE_SHEET_GVIZ_URL}?tqx=out:csv`;

const FORM_ENTRY_CATEGORY = 'entry.971729544';
const FORM_ENTRY_LABEL = 'entry.815360484';
const FORM_ENTRY_TEXT = 'entry.1672381815';
const FORM_ENTRY_IMAGE_1 = 'entry.1335992406';
const FORM_ENTRY_IMAGE_2 = 'entry.1318042058';
const FORM_ENTRY_IMAGE_3 = 'entry.1837775719';
const FORM_ENTRY_IMAGE_4 = 'entry.1372833796';
const FORM_ENTRY_IMAGE_5 = 'entry.1345278852';

/**
 * 일반 File 객체를 Base64 Data URL로 변환
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * 이미지를 Canvas를 통해 리사이즈 및 고압축(JPEG quality: 0.7, max 800px)하여 base64 문자열 반환
 */
export async function compressImageToBase64(file: File, maxDimension: number = 800, quality: number = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      fileToBase64(file).then(resolve).catch(() => resolve(''));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // 백그라운드 화이트 채우기 (투명 PNG JPEG 변환 시 검은 배경 방지)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(src);
        }
      };
      img.onerror = () => {
        resolve(src);
      };
      img.src = src;
    };
    reader.onerror = () => {
      resolve('');
    };
  });
}

/**
 * 여러 이미지를 일괄 Canvas 압축하여 base64 배열로 변환
 */
export async function compressImagesToBase64(files: File[]): Promise<string[]> {
  const promises = files.slice(0, 5).map(file => compressImageToBase64(file));
  return Promise.all(promises);
}

export async function uploadCommunityImage(file: File, isOffline: boolean = false): Promise<string> {
  if (isOffline) {
    return await compressImageToBase64(file);
  }
  try {
    const storageRef = ref(storage, `community/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.warn('[Storage] Upload failed, falling back to compressed base64:', error);
    return await compressImageToBase64(file);
  }
}

/**
 * 이미지 Data URL을 Canvas를 이용해 마이크로 썸네일(최대 160~200px, JPEG 0.45)로 다운스케일링
 * 구글 폼의 30KB 페이로드 제한 내에 맞추기 위해 사용
 */
export async function compressDataUrlToThumbnail(dataUrl: string, maxDimension: number = 180, quality: number = 0.45): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return dataUrl.slice(0, 4000);
  }
  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl.slice(0, 4000));
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const thumb = canvas.toDataURL('image/jpeg', quality);
        resolve(thumb);
      } catch {
        resolve(dataUrl.slice(0, 4000));
      }
    };
    img.onerror = () => {
      resolve(dataUrl.slice(0, 4000));
    };
    img.src = dataUrl;
  });
}

/**
 * 구글 폼에 전송할 이미지 목록을 30KB 페이로드 버짓에 맞춰 최적화
 */
export async function prepareImagesForGoogleForm(images: string[], maxTotalBytes: number = 22000): Promise<string[]> {
  if (!images || images.length === 0) return [];
  const results: string[] = [];
  const count = Math.min(images.length, 5);
  const perImageBudget = Math.floor(maxTotalBytes / count);

  for (let i = 0; i < count; i++) {
    const img = images[i];
    if (!img) continue;

    // HTTP URL은 이미 짧음 (~100자)
    if (img.startsWith('http://') || img.startsWith('https://')) {
      results.push(img);
      continue;
    }

    // Base64인 경우 크기 검사 및 마이크로 썸네일 변환
    if (img.length > perImageBudget) {
      const thumb = await compressDataUrlToThumbnail(img, 160, 0.4);
      if (thumb.length <= perImageBudget + 2000) {
        results.push(thumb);
      } else {
        const microThumb = await compressDataUrlToThumbnail(img, 120, 0.35);
        results.push(microThumb);
      }
    } else {
      results.push(img);
    }
  }

  return results;
}

/**
 * 네이티브 HTML Form 및 히든 iframe을 이용해 구글 폼에 전송 (모든 브라우저 100% 무결점 전송)
 */
export function submitViaHiddenIframe(url: string, fields: Record<string, string>): void {
  if (typeof document === 'undefined') return;

  const iframeName = 'gform_sink_iframe_' + Date.now();
  let iframe = document.getElementById('gform_sink_iframe') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'gform_sink_iframe';
    iframe.name = iframeName;
    iframe.style.display = 'none';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
  } else {
    iframe.name = iframeName;
  }

  const form = document.createElement('form');
  form.action = url;
  form.method = 'POST';
  form.target = iframeName;
  form.style.display = 'none';

  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  try {
    form.submit();
  } catch (e) {
    console.warn('[GoogleForm] Form submit exception:', e);
  } finally {
    setTimeout(() => {
      if (form.parentNode) {
        form.parentNode.removeChild(form);
      }
    }, 1500);
  }
}


const LOCAL_STORAGE_KEY = 'snshero_community_posts';
const LOCAL_INTERACTIONS_KEY = 'hero_community_interactions_v1';

interface StoredInteractions {
  likes: Record<string, string[]>; // postId -> userIds
  comments: Record<string, CommunityComment[]>; // postId -> comments
  hiddenBy: Record<string, string[]>; // postId -> userIds
  reports: Record<string, PostReport[]>; // postId -> reports
  isPinned: Record<string, boolean>; // postId -> boolean
}

function getStoredInteractions(): StoredInteractions {
  if (typeof window === 'undefined') {
    return { likes: {}, comments: {}, hiddenBy: {}, reports: {}, isPinned: {} };
  }
  try {
    const raw = localStorage.getItem(LOCAL_INTERACTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse community interactions:', e);
  }
  return { likes: {}, comments: {}, hiddenBy: {}, reports: {}, isPinned: {} };
}

function saveStoredInteractions(interactions: StoredInteractions) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_INTERACTIONS_KEY, JSON.stringify(interactions));
    } catch (e) {
      console.warn('Failed to save community interactions:', e);
    }
  }
}

// 더미 데이터 초기화용 (최소 3개 이상의 멋진 인스타그램 피드 제공)
const DEFAULT_POSTS: CommunityPost[] = [
  {
    id: 'post_dummy_1',
    userId: 'snshero_official',
    userName: 'SNSHero Official',
    userAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60',
    imageUrl: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=800&auto=format&fit=crop&q=80',
    content: 'Welcome to SNSHero Community! 🚀 Share your legendary battle moments, deck strategies, and custom cards with other hunters. Let the battle begin!',
    createdAt: Date.now() - 3600000 * 24, // 1 day ago
    likes: ['bot_hunter_1', 'bot_hunter_2', 'bot_hunter_3'],
    comments: [
      {
        id: 'comment_dummy_1_1',
        userId: 'bot_hunter_1',
        userName: 'CardMaster',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60',
        content: 'Wow, finally! Love this Instagram-style feed. Time to post my custom card designs! 🎉',
        createdAt: Date.now() - 3600000 * 23,
      },
      {
        id: 'comment_dummy_1_2',
        userId: 'bot_hunter_2',
        userName: 'LootCollector',
        userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=60',
        content: 'Can we share item drops here too?',
        createdAt: Date.now() - 3600000 * 22,
      }
    ]
  },
  {
    id: 'post_dummy_2',
    userId: 'bot_hunter_3',
    userName: 'DeckArchitect',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    content: 'Just customized my main deck skin with this gorgeous anime background. Fits the cyberpunk matrix board perfectly! Rate my style 1-10. 😎💎',
    createdAt: Date.now() - 3600000 * 12, // 12 hours ago
    likes: ['snshero_official', 'bot_hunter_2'],
    comments: [
      {
        id: 'comment_dummy_2_1',
        userId: 'snshero_official',
        userName: 'SNSHero Official',
        userAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60',
        content: 'Absolute 10/10! The neon colors look incredibly sharp. 🔥',
        createdAt: Date.now() - 3600000 * 11,
      }
    ]
  },
  {
    id: 'post_dummy_3',
    userId: 'bot_hunter_2',
    userName: 'LootCollector',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=60',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    content: 'Chilling out at the fishing zone after reaching Rank 5. The ambient music here is so relaxing. Who wants to join me for a duel next to the river? 🎣🤖',
    createdAt: Date.now() - 3600000 * 4, // 4 hours ago
    likes: ['bot_hunter_1'],
    comments: []
  }
];

// LocalStorage Helper
function getLocalPosts(): CommunityPost[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_POSTS));
    return DEFAULT_POSTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_POSTS;
  }
}

function saveLocalPosts(posts: CommunityPost[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(posts));
  }
}

/**
 * RFC 4180 호환 CSV 파서 (큰따옴표 이스케이프 및 개행문자 지원)
 */
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // 이스케이프된 큰따옴표 건너뜀
        } else {
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * 구글 스프레드시트의 날짜 타임스탬프 파서
 * 예: "2026. 8. 25 오후 3:50:38", "2026-08-25 15:50:38", "8/25/2026 15:50:38"
 */
export function parseGoogleSheetTimestamp(tsStr: string): number {
  if (!tsStr || typeof tsStr !== 'string') return Date.now();
  const trimmed = tsStr.trim();
  if (!trimmed) return Date.now();

  // 1. 한국어 형식: "2026. 8. 25 오후 3:50:38" 또는 "2026. 8. 25 오전 10:15:20"
  const koMatch = trimmed.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\s+(오전|오후)\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (koMatch) {
    const year = parseInt(koMatch[1], 10);
    const month = parseInt(koMatch[2], 10) - 1;
    const day = parseInt(koMatch[3], 10);
    const isPm = koMatch[4] === '오후';
    let hour = parseInt(koMatch[5], 10);
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
    const minute = parseInt(koMatch[6], 10);
    const second = koMatch[7] ? parseInt(koMatch[7], 10) : 0;
    return new Date(year, month, day, hour, minute, second).getTime();
  }

  // 2. 표준 Date.parse 시도
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }

  return Date.now();
}

/**
 * 구글 폼에 게시글을 안전하고 신뢰성 있게 비동기 전송
 * (30KB 페이로드 버짓 관리 + 브라우저 히든 iframe 폼 제출 + fetch no-cors 병렬 전송)
 */
export async function submitPostToGoogleForm(params: {
  category: string;
  label: string;
  text: string;
  images: string[];
}): Promise<boolean> {
  // 1. 구글 폼 30KB 페이로드 제한에 맞춰 이미지 썸네일 준비
  const formImages = await prepareImagesForGoogleForm(params.images || [], 22000);

  const entries: Record<string, string> = {
    [FORM_ENTRY_CATEGORY]: params.category || 'free',
    [FORM_ENTRY_LABEL]: params.label || 'Anonymous Hunter',
    [FORM_ENTRY_TEXT]: params.text || '',
    [FORM_ENTRY_IMAGE_1]: formImages[0] || '',
    [FORM_ENTRY_IMAGE_2]: formImages[1] || '',
    [FORM_ENTRY_IMAGE_3]: formImages[2] || '',
    [FORM_ENTRY_IMAGE_4]: formImages[3] || '',
    [FORM_ENTRY_IMAGE_5]: formImages[4] || '',
  };

  let submitSuccess = false;

  // 2. 브라우저 환경: 네이티브 히든 iframe 폼 제출 (CORS 및 서드파티 보호 100% 우회)
  if (typeof document !== 'undefined') {
    try {
      submitViaHiddenIframe(GOOGLE_FORM_URL, entries);
      submitSuccess = true;
    } catch (err) {
      console.warn('[GoogleForm] Hidden iframe submit failed:', err);
    }
  }

  // 3. fetch(..., { mode: 'no-cors' }) 병렬/대체 전송
  try {
    const formData = new URLSearchParams();
    for (const [k, v] of Object.entries(entries)) {
      formData.append(k, v);
    }
    await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    submitSuccess = true;
  } catch (error) {
    console.warn('[GoogleForm] fetch submit failed:', error);
  }

  return submitSuccess;
}

/**
 * gviz API 날짜 객체 또는 문자열 파싱
 */
export function parseGvizDate(v: any, f?: string): number {
  if (typeof v === 'string' && v.startsWith('Date(')) {
    const nums = v.replace('Date(', '').replace(')', '').split(',').map(n => parseInt(n.trim(), 10));
    if (nums.length >= 3) {
      return new Date(nums[0], nums[1], nums[2], nums[3] || 0, nums[4] || 0, nums[5] || 0).getTime();
    }
  }
  if (typeof v === 'number' && v > 1000000000) {
    return v;
  }
  if (f) {
    const ts = parseGoogleSheetTimestamp(f);
    if (ts > 0) return ts;
  }
  if (typeof v === 'string') {
    return parseGoogleSheetTimestamp(v);
  }
  return Date.now();
}

/**
 * JSONP를 통한 구글 스프레드시트 gviz 실시간 조회 (브라우저 CORS 차단 원천 해결)
 */
export function fetchSheetViaJsonp(url: string, timeoutMs: number = 7000): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('JSONP is not supported in non-browser environment'));
      return;
    }

    const callbackName = 'gviz_jsonp_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
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
      reject(new Error('JSONP request timed out'));
    }, timeoutMs);

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    script.onerror = (err) => {
      cleanup();
      reject(err || new Error('JSONP script loading error'));
    };

    document.head.appendChild(script);
  });
}

/**
 * gviz JSON 데이터 객체를 CommunityPost 배열로 변환
 */
export function parseGvizDataToPosts(data: any): CommunityPost[] {
  if (!data || !data.table || !Array.isArray(data.table.rows)) {
    return [];
  }

  const interactions = getStoredInteractions();
  const posts: CommunityPost[] = [];
  const rows = data.table.rows;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !Array.isArray(r.c)) continue;
    const cells = r.c;

    const rawTimestampV = cells[0]?.v;
    const rawTimestampF = cells[0]?.f;
    const rawCat = cells[1]?.v ? String(cells[1].v).trim().toLowerCase() : 'free';
    const rawLabel = cells[2]?.v ? String(cells[2].v).trim() : '';
    const content = cells[3]?.v !== null && cells[3]?.v !== undefined ? String(cells[3].v) : (cells[3]?.f || '');

    // Skip completely empty rows
    if (!rawLabel && !content) continue;

    const images: string[] = [];
    for (let imgIdx = 4; imgIdx <= 8; imgIdx++) {
      const cell = cells[imgIdx];
      if (cell && cell.v !== null && cell.v !== undefined) {
        const strVal = String(cell.v).trim();
        if (strVal && strVal !== 'null' && strVal !== 'undefined') {
          images.push(strVal);
        }
      }
    }

    const category = (rawCat || 'free') as CommunityWritableCategory;

    let userName = rawLabel || 'Anonymous Hunter';
    let flair: PostFlair | undefined = undefined;

    const flairMatch = rawLabel.match(/^(.*?)\s*\[([a-z-]+)\]$/i);
    if (flairMatch) {
      userName = flairMatch[1].trim() || 'Anonymous Hunter';
      flair = flairMatch[2].toLowerCase() as PostFlair;
    } else if (rawLabel.startsWith('[') && rawLabel.endsWith(']')) {
      flair = rawLabel.slice(1, -1).toLowerCase() as PostFlair;
      userName = 'Anonymous Hunter';
    }

    const createdAt = parseGvizDate(rawTimestampV, rawTimestampF);
    const safeName = userName.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '') || 'hunter';
    const postId = `gsheet_${createdAt}_${i}_${safeName}`;
    const userId = `user_${userName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'hunter'}`;

    const post: CommunityPost = {
      id: postId,
      userId: userId,
      userName: userName,
      userAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      imageUrl: images[0] || undefined,
      imageUrls: images.length > 0 ? images : undefined,
      content: content,
      createdAt: createdAt,
      likes: interactions.likes[postId] || [],
      comments: interactions.comments[postId] || [],
      category: category,
      flair: flair,
      isPinned: interactions.isPinned[postId] || false,
      hiddenBy: interactions.hiddenBy[postId] || [],
      reports: interactions.reports[postId] || [],
    };

    posts.push(post);
  }

  posts.sort((a, b) => b.createdAt - a.createdAt);
  return posts;
}

/**
 * CSV 파싱 행 배열을 CommunityPost 배열로 변환
 */
export function parseCsvRowsToPosts(rows: string[][]): CommunityPost[] {
  if (!rows || rows.length <= 1) return [];
  const interactions = getStoredInteractions();
  const posts: CommunityPost[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;

    const rawTimestamp = row[0] || '';
    const category = (row[1] || 'free').trim() as CommunityWritableCategory;
    const rawLabel = (row[2] || '').trim();
    const content = row[3] || '';
    if (!rawLabel && !content) continue;

    const images: string[] = [];
    for (let imgIdx = 4; imgIdx <= 8; imgIdx++) {
      if (row[imgIdx] && row[imgIdx].trim()) {
        images.push(row[imgIdx].trim());
      }
    }

    let userName = rawLabel || 'Anonymous Hunter';
    let flair: PostFlair | undefined = undefined;

    const flairMatch = rawLabel.match(/^(.*?)\s*\[([a-z-]+)\]$/i);
    if (flairMatch) {
      userName = flairMatch[1].trim() || 'Anonymous Hunter';
      flair = flairMatch[2].toLowerCase() as PostFlair;
    } else if (rawLabel.startsWith('[') && rawLabel.endsWith(']')) {
      flair = rawLabel.slice(1, -1).toLowerCase() as PostFlair;
      userName = 'Anonymous Hunter';
    }

    const createdAt = parseGoogleSheetTimestamp(rawTimestamp);
    const safeName = userName.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '') || 'hunter';
    const postId = `gsheet_${createdAt}_${i}_${safeName}`;
    const userId = `user_${userName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'hunter'}`;

    const post: CommunityPost = {
      id: postId,
      userId: userId,
      userName: userName,
      userAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      imageUrl: images[0] || undefined,
      imageUrls: images.length > 0 ? images : undefined,
      content: content,
      createdAt: createdAt,
      likes: interactions.likes[postId] || [],
      comments: interactions.comments[postId] || [],
      category: category,
      flair: flair,
      isPinned: interactions.isPinned[postId] || false,
      hiddenBy: interactions.hiddenBy[postId] || [],
      reports: interactions.reports[postId] || [],
    };

    posts.push(post);
  }

  posts.sort((a, b) => b.createdAt - a.createdAt);
  return posts;
}

/**
 * 구글 스프레드시트에서 게시글 목록을 실시간 조회
 * (JSONP 우선 시도 -> 브라우저 CORS 문제 원천 차단 -> Direct CSV fallback)
 */
export async function fetchPostsFromGoogleSheet(): Promise<CommunityPost[]> {
  // 1. JSONP 방식 시도 (브라우저 CORS 완전 우회)
  if (typeof window !== 'undefined') {
    try {
      const gvizData = await fetchSheetViaJsonp(GOOGLE_SHEET_GVIZ_URL, 6000);
      const parsedPosts = parseGvizDataToPosts(gvizData);
      if (parsedPosts.length > 0) {
        return parsedPosts;
      }
    } catch (jsonpError) {
      console.warn('[GoogleSheet] JSONP failed, attempting direct fetch fallback:', jsonpError);
    }
  }

  // 2. Direct CSV fetch fallback (Node 환경 또는 프록시 지원 환경)
  try {
    const response = await fetch(`${GOOGLE_SHEET_CSV_URL}&_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (response.ok) {
      const csvText = await response.text();
      const rows = parseCSV(csvText);
      const parsed = parseCsvRowsToPosts(rows);
      if (parsed.length > 0) {
        return parsed;
      }
    }
  } catch (fetchError) {
    console.warn('[GoogleSheet] Direct CSV fetch failed:', fetchError);
  }

  return [];
}

// 구글 스프레드시트 & 로컬스토리지 하이브리드 CRUD
export async function getCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const sheetPosts = await fetchPostsFromGoogleSheet();
    if (sheetPosts && sheetPosts.length > 0) {
      // 로컬 전용 추가 글(새로 작성한 로컬 글 중 아직 시트에 반영되지 않은 것들) 병합
      const localPosts = getLocalPosts();
      const nonSheetLocalPosts = localPosts.filter(p => !p.id.startsWith('gsheet_') && !sheetPosts.some(sp => sp.content === p.content && Math.abs(sp.createdAt - p.createdAt) < 60000));
      
      const merged = [...nonSheetLocalPosts, ...sheetPosts];
      merged.sort((a, b) => b.createdAt - a.createdAt);
      saveLocalPosts(merged);
      return merged;
    }
  } catch (error) {
    console.warn('[GoogleSheet] Failed to fetch community posts, falling back to LocalStorage:', error);
  }

  // 구글 시트 조회가 실패하거나 비어있는 경우 로컬스토리지 fallback
  const localPosts = getLocalPosts();
  return localPosts.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createCommunityPost(
  content: string,
  imageUrl: string | undefined,
  user: {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    activeEmoticonKey?: string | null;
    activeBadgeKey?: string | null;
    activeTitleKey?: string | null;
  },
  category?: CommunityWritableCategory,
  imageUrls?: string[],
  deckData?: CardData[],
  flair?: PostFlair,
  isPinned?: boolean,
  isWeeklyThread?: boolean,
  weeklyThreadDate?: string,
): Promise<CommunityPost> {
  const selectedCategory = category || 'free';
  const authorName = user.displayName || (typeof window !== 'undefined' ? (localStorage.getItem('hero_user_name') || 'Anonymous Hunter') : 'Anonymous Hunter');
  
  // 게스트/로컬 플레이어 안정적 UID 할당 (예외 발생 차단)
  let authorUid = user.uid;
  if (!authorUid || authorUid === 'guest-id') {
    if (typeof window !== 'undefined') {
      const storedUid = localStorage.getItem('hero_player_uid');
      if (storedUid) {
        authorUid = storedUid;
      } else {
        authorUid = `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        localStorage.setItem('hero_player_uid', authorUid);
      }
    } else {
      authorUid = 'player_local';
    }
  }

  const label = flair ? `${authorName} [${flair}]` : authorName;
  const allImages = imageUrls && imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);

  const newPost: CommunityPost = {
    id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: authorUid,
    userName: authorName,
    userAvatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${authorUid}`,
    userEmoticonKey: user.activeEmoticonKey || undefined,
    userBadgeKey: user.activeBadgeKey || undefined,
    userTitleKey: user.activeTitleKey || undefined,
    imageUrl: allImages[0] || undefined,
    imageUrls: allImages.length > 0 ? allImages : undefined,
    content,
    createdAt: Date.now(),
    likes: [],
    comments: [],
    category: selectedCategory,
    deckData: deckData || undefined,
    flair: flair || undefined,
    isPinned: isPinned || undefined,
    isWeeklyThread: isWeeklyThread || undefined,
    weeklyThreadDate: weeklyThreadDate || undefined,
  };

  // 1. LocalStorage 즉시 저장 (Optimistic UI)
  const posts = getLocalPosts();
  posts.unshift(newPost);
  saveLocalPosts(posts);

  // 2. 구글 폼에 안전하게 전송 (30KB 페이로드 버짓 제어 및 이중 전송)
  try {
    await submitPostToGoogleForm({
      category: selectedCategory,
      label: label,
      text: content,
      images: allImages,
    });
  } catch (err) {
    console.warn('[GoogleForm] Submit error occurred:', err);
  }

  // 3. Firestore 백그라운드 시도 (호환성 유지)
  try {
    const docRef = doc(db, 'community_posts', newPost.id);
    await setDoc(docRef, sanitizeForFirestore(newPost));
  } catch (error) {
    // Optional sync
  }

  return newPost;
}

export async function toggleLikePost(postId: string, userId: string): Promise<CommunityPost> {
  const effectiveUserId = (userId && userId !== 'guest-id')
    ? userId
    : (typeof window !== 'undefined' ? (localStorage.getItem('hero_player_uid') || 'player_local') : 'player_local');

  const posts = await getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    throw new Error('Post not found');
  }

  const hasLiked = post.likes.includes(effectiveUserId);
  if (hasLiked) {
    post.likes = post.likes.filter((uid) => uid !== effectiveUserId);
  } else {
    post.likes.push(effectiveUserId);
  }

  // 영구 인터랙션 저장소 업데이트
  const interactions = getStoredInteractions();
  interactions.likes[postId] = post.likes;
  saveStoredInteractions(interactions);

  // Local Storage 업데이트
  saveLocalPosts(posts);

  // Firestore 업데이트 (비동기)
  try {
    const docRef = doc(db, 'community_posts', postId);
    await updateDoc(docRef, { likes: post.likes });
  } catch (error) {
    console.warn('[Firestore] Failed to toggle like in cloud, saved locally:', error);
  }

  return post;
}

export async function addCommentToPost(
  postId: string,
  commentContent: string,
  user: {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    activeEmoticonKey?: string | null;
    activeBadgeKey?: string | null;
    activeTitleKey?: string | null;
  }
): Promise<CommunityPost> {
  const authorUid = (user.uid && user.uid !== 'guest-id')
    ? user.uid
    : (typeof window !== 'undefined' ? (localStorage.getItem('hero_player_uid') || 'player_local') : 'player_local');
  const authorName = user.displayName || (typeof window !== 'undefined' ? (localStorage.getItem('hero_user_name') || 'Anonymous Hunter') : 'Anonymous Hunter');

  const posts = await getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    throw new Error('Post not found');
  }

  const newComment: CommunityComment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: authorUid,
    userName: authorName,
    userAvatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${authorUid}`,
    userEmoticonKey: user.activeEmoticonKey || undefined,
    userBadgeKey: user.activeBadgeKey || undefined,
    userTitleKey: user.activeTitleKey || undefined,
    content: commentContent,
    createdAt: Date.now()
  };

  post.comments.push(newComment);

  // 영구 인터랙션 저장소 업데이트
  const interactions = getStoredInteractions();
  interactions.comments[postId] = post.comments;
  saveStoredInteractions(interactions);

  // Local Storage 업데이트
  saveLocalPosts(posts);

  // Firestore 업데이트
  try {
    const docRef = doc(db, 'community_posts', postId);
    await updateDoc(docRef, { comments: sanitizeForFirestore(post.comments) });
  } catch (error) {
    console.warn('[Firestore] Failed to add comment in cloud, saved locally:', error);
  }

  return post;
}

export async function deleteCommunityPost(postId: string, userId: string): Promise<void> {
  // 1. LocalStorage에서 해당 게시물 제거
  const posts = getLocalPosts();
  const filteredPosts = posts.filter((p) => p.id !== postId);
  saveLocalPosts(filteredPosts);

  // 2. Firestore에서 해당 문서 삭제 (비동기 시도)
  try {
    const docRef = doc(db, 'community_posts', postId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('[Firestore] Failed to delete community post from cloud:', error);
  }
}

export async function addReplyToComment(
  postId: string,
  commentId: string,
  replyContent: string,
  user: {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    activeEmoticonKey?: string | null;
    activeBadgeKey?: string | null;
    activeTitleKey?: string | null;
  }
): Promise<CommunityPost> {
  const authorUid = (user.uid && user.uid !== 'guest-id')
    ? user.uid
    : (typeof window !== 'undefined' ? (localStorage.getItem('hero_player_uid') || 'player_local') : 'player_local');
  const authorName = user.displayName || (typeof window !== 'undefined' ? (localStorage.getItem('hero_user_name') || 'Anonymous Hunter') : 'Anonymous Hunter');

  const posts = await getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    throw new Error('Post not found');
  }

  const comment = post.comments.find((c) => c.id === commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }

  const newReply: CommunityComment = {
    id: `reply_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: authorUid,
    userName: authorName,
    userAvatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${authorUid}`,
    userEmoticonKey: user.activeEmoticonKey || undefined,
    userBadgeKey: user.activeBadgeKey || undefined,
    userTitleKey: user.activeTitleKey || undefined,
    content: replyContent,
    createdAt: Date.now()
  };

  if (!comment.replies) {
    comment.replies = [];
  }
  comment.replies.push(newReply);

  // 영구 인터랙션 저장소 업데이트
  const interactions = getStoredInteractions();
  interactions.comments[postId] = post.comments;
  saveStoredInteractions(interactions);

  // Local Storage 업데이트
  saveLocalPosts(posts);

  // Firestore 업데이트
  try {
    const docRef = doc(db, 'community_posts', postId);
    await updateDoc(docRef, { comments: sanitizeForFirestore(post.comments) });
  } catch (error) {
    console.warn('[Firestore] Failed to add reply in cloud, saved locally:', error);
  }

  return post;
}

// ─── Pin / Hide / Report functions ─────────────────

/** Toggle pinned status on a post */
export async function togglePinPost(postId: string): Promise<CommunityPost> {
  const posts = await getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error('Post not found');

  post.isPinned = !post.isPinned;
  const interactions = getStoredInteractions();
  interactions.isPinned[postId] = post.isPinned;
  saveStoredInteractions(interactions);

  saveLocalPosts(posts);

  try {
    const docRef = doc(db, 'community_posts', postId);
    await updateDoc(docRef, { isPinned: post.isPinned });
  } catch (error) {
    console.warn('[Firestore] Failed to toggle pin in cloud:', error);
  }
  return post;
}

/** Toggle hide status for a specific user */
export async function toggleHidePost(postId: string, userId: string): Promise<CommunityPost> {
  const effectiveUserId = (userId && userId !== 'guest-id')
    ? userId
    : (typeof window !== 'undefined' ? (localStorage.getItem('hero_player_uid') || 'player_local') : 'player_local');
  
  const posts = await getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error('Post not found');

  if (!post.hiddenBy) post.hiddenBy = [];
  const idx = post.hiddenBy.indexOf(effectiveUserId);
  if (idx >= 0) {
    post.hiddenBy.splice(idx, 1);
  } else {
    post.hiddenBy.push(effectiveUserId);
  }

  const interactions = getStoredInteractions();
  interactions.hiddenBy[postId] = post.hiddenBy;
  saveStoredInteractions(interactions);

  saveLocalPosts(posts);
  try {
    const docRef = doc(db, 'community_posts', postId);
    await updateDoc(docRef, { hiddenBy: post.hiddenBy });
  } catch (error) {
    console.warn('[Firestore] Failed to toggle hide in cloud:', error);
  }
  return post;
}

/** Report a post with a reason */
export async function reportPost(
  postId: string,
  userId: string,
  reason: PostReport['reason'],
): Promise<CommunityPost> {
  const effectiveUserId = (userId && userId !== 'guest-id')
    ? userId
    : (typeof window !== 'undefined' ? (localStorage.getItem('hero_player_uid') || 'player_local') : 'player_local');

  const posts = await getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error('Post not found');

  if (!post.reports) post.reports = [];
  
  // Deduplicate: one report per user per post
  if (post.reports.some((r) => r.userId === effectiveUserId)) {
    return post; // Already reported
  }

  post.reports.push({ userId: effectiveUserId, reason, timestamp: Date.now() });
  const interactions = getStoredInteractions();
  interactions.reports[postId] = post.reports;
  saveStoredInteractions(interactions);

  saveLocalPosts(posts);

  try {
    const docRef = doc(db, 'community_posts', postId);
    await updateDoc(docRef, { reports: sanitizeForFirestore(post.reports) });
  } catch (error) {
    console.warn('[Firestore] Failed to save report in cloud:', error);
  }
  return post;
}


/** Sort posts by the given sort mode */
export function sortPostsByMode(posts: CommunityPost[], mode: CommunitySortMode): CommunityPost[] {
  const now = Date.now();
  const sorted = [...posts];

  switch (mode) {
    case 'hot': {
      // Hot = weighted engagement / recency
      sorted.sort((a, b) => {
        const scoreA = a.likes.length * 2 + a.comments.length;
        const scoreB = b.likes.length * 2 + b.comments.length;
        const hoursA = Math.max((now - a.createdAt) / 3600000, 1);
        const hoursB = Math.max((now - b.createdAt) / 3600000, 1);
        return (scoreB / hoursB) - (scoreA / hoursA);
      });
      break;
    }
    case 'new':
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'top':
      sorted.sort((a, b) => b.likes.length - a.likes.length);
      break;
    case 'comments':
      sorted.sort((a, b) => {
        const totalA = a.comments.length + a.comments.reduce((sum, c) => sum + (c.replies?.length ?? 0), 0);
        const totalB = b.comments.length + b.comments.reduce((sum, c) => sum + (c.replies?.length ?? 0), 0);
        return totalB - totalA;
      });
      break;
  }

  // Pinned posts always float to top
  const pinned = sorted.filter((p) => p.isPinned);
  const unpinned = sorted.filter((p) => !p.isPinned);
  return [...pinned, ...unpinned];
}

/** Generate a default weekly discussion thread post (for auto-creation) */
export function generateWeeklyThread(
  category: CommunityWritableCategory,
  titleKey: string,
  contentTemplate: string,
  flair?: PostFlair,
): Omit<CommunityPost, 'id'> {
  const weekDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return {
    userId: 'snshero_official',
    userName: 'SNSHero Official',
    userAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60',
    content: contentTemplate,
    createdAt: Date.now(),
    category: category,
    likes: [],
    comments: [],
    isPinned: true,
    isWeeklyThread: true,
    weeklyThreadDate: weekDate,
    flair: flair || undefined,
  };
}
