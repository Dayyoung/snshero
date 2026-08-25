import { db, storage } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, ref, uploadBytes, getDownloadURL } from './firebaseMock';
import { CommunityPost, CommunityComment, CardData, CommunityWritableCategory, PostFlair, PostReport, CommunitySortMode } from '../types';
import { sanitizeForFirestore } from './utils';

export const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSer0AqPbpduTxfSJNg3X8Pa1C8h2L5_Skmbt0NDdVZt6bS1GA/formResponse';
export const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1o8rwdG_O_-efkKHgf9oMpFaOUnAAVxMQVfDldFavbjg/gviz/tq?tqx=out:csv';

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
 * 구글 폼에 게시글을 비동기 전송
 */
export async function submitPostToGoogleForm(params: {
  category: string;
  label: string;
  text: string;
  images: string[];
}): Promise<boolean> {
  const formData = new URLSearchParams();
  formData.append(FORM_ENTRY_CATEGORY, params.category || 'free');
  formData.append(FORM_ENTRY_LABEL, params.label || 'Anonymous');
  formData.append(FORM_ENTRY_TEXT, params.text || '');
  formData.append(FORM_ENTRY_IMAGE_1, params.images[0] || '');
  formData.append(FORM_ENTRY_IMAGE_2, params.images[1] || '');
  formData.append(FORM_ENTRY_IMAGE_3, params.images[2] || '');
  formData.append(FORM_ENTRY_IMAGE_4, params.images[3] || '');
  formData.append(FORM_ENTRY_IMAGE_5, params.images[4] || '');

  try {
    // mode: 'no-cors'로 전송하여 브라우저 CORS 제약 우회
    await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    return true;
  } catch (error) {
    console.error('[GoogleForm] Failed to submit post to Google Form:', error);
    return false;
  }
}

/**
 * 구글 스프레드시트 CSV에서 게시글 목록을 조회하여 파싱
 */
export async function fetchPostsFromGoogleSheet(): Promise<CommunityPost[]> {
  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (!response.ok) {
      throw new Error(`Google Sheet HTTP ${response.status}`);
    }
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    if (rows.length <= 1) {
      return [];
    }

    const interactions = getStoredInteractions();
    const posts: CommunityPost[] = [];

    // Header: [타임스탬프, category, label, text, image1, image2, image3, image4, image5]
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 4) continue;

      const rawTimestamp = row[0] || '';
      const category = (row[1] || 'free').trim() as CommunityWritableCategory;
      const rawLabel = (row[2] || '').trim();
      const content = row[3] || '';
      const images: string[] = [];

      for (let imgIdx = 4; imgIdx <= 8; imgIdx++) {
        if (row[imgIdx] && row[imgIdx].trim()) {
          images.push(row[imgIdx].trim());
        }
      }

      // label에서 flair 및 username 분리 파싱 (예: "DeckArchitect [guide]")
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
      // 고유 ID 생성 (행 인덱스 및 타임스탬프 조합)
      const postId = `gsheet_${createdAt}_${i}_${userName.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`;
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

    // 최신 작성글 순으로 정렬
    posts.sort((a, b) => b.createdAt - a.createdAt);
    return posts;
  } catch (error) {
    console.error('[GoogleSheet] Failed to fetch or parse Google Sheet posts:', error);
    throw error;
  }
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
  // 게스트 사용자 방어
  if (user.uid === 'guest-id') {
    throw new Error('[Security] Guest users cannot create community posts.');
  }

  const selectedCategory = category || 'free';
  const authorName = user.displayName || 'Anonymous Hunter';
  const label = flair ? `${authorName} [${flair}]` : authorName;
  const allImages = imageUrls && imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);

  const newPost: CommunityPost = {
    id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: user.uid,
    userName: authorName,
    userAvatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
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

  // 2. 구글 폼에 전송
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
    console.warn('[Firestore] Optional sync failed, post saved to Google Form & LocalStorage:', error);
  }

  return newPost;
}

export async function toggleLikePost(postId: string, userId: string): Promise<CommunityPost> {
  if (userId === 'guest-id') {
    throw new Error('[Security] Guest users cannot toggle likes.');
  }
  const posts = await getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    throw new Error('Post not found');
  }

  const hasLiked = post.likes.includes(userId);
  if (hasLiked) {
    post.likes = post.likes.filter((uid) => uid !== userId);
  } else {
    post.likes.push(userId);
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
  if (user.uid === 'guest-id') {
    throw new Error('[Security] Guest users cannot add comments.');
  }
  const posts = await getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    throw new Error('Post not found');
  }

  const newComment: CommunityComment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: user.uid,
    userName: user.displayName || 'Anonymous Hunter',
    userAvatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
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
  if (userId === 'guest-id') {
    throw new Error('[Security] Guest users cannot delete posts.');
  }
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
  if (user.uid === 'guest-id') {
    throw new Error('[Security] Guest users cannot add replies.');
  }
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
    userId: user.uid,
    userName: user.displayName || 'Anonymous Hunter',
    userAvatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
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
  if (userId === 'guest-id') throw new Error('[Security] Guest users cannot hide posts.');
  
  const posts = await getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error('Post not found');

  if (!post.hiddenBy) post.hiddenBy = [];
  const idx = post.hiddenBy.indexOf(userId);
  if (idx >= 0) {
    post.hiddenBy.splice(idx, 1);
  } else {
    post.hiddenBy.push(userId);
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
  if (userId === 'guest-id') throw new Error('[Security] Guest users cannot report posts.');

  const posts = await getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error('Post not found');

  if (!post.reports) post.reports = [];
  
  // Deduplicate: one report per user per post
  if (post.reports.some((r) => r.userId === userId)) {
    return post; // Already reported
  }

  post.reports.push({ userId, reason, timestamp: Date.now() });
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
