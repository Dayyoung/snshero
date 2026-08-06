import { db, storage } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, ref, uploadBytes, getDownloadURL } from './firebaseMock';
import { CommunityPost, CommunityComment, CardData, CommunityWritableCategory, PostFlair, PostReport, CommunitySortMode } from '../types';
import { sanitizeForFirestore } from './utils';

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export async function uploadCommunityImage(file: File, isOffline: boolean = false): Promise<string> {
  if (isOffline) {
    return await fileToBase64(file);
  }
  try {
    const storageRef = ref(storage, `community/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.warn('[Storage] Upload failed, falling back to base64:', error);
    return await fileToBase64(file);
  }
}

const LOCAL_STORAGE_KEY = 'snshero_community_posts';

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

// Firestore & LocalStorage Hybrid CRUD
export async function getCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'community_posts'));
    const posts: CommunityPost[] = [];
    querySnapshot.forEach((docSnap) => {
      posts.push({ id: docSnap.id, ...docSnap.data() } as CommunityPost);
    });

    // Firestore에서 정상적으로 데이터를 가져온 경우 (문서가 0개이더라도 성공으로 처리)
    posts.sort((a, b) => b.createdAt - a.createdAt);
    saveLocalPosts(posts);
    return posts;
  } catch (error) {
    console.error('[Firestore] Failed to fetch community posts, falling back to LocalStorage:', error);
  }
  
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
  // 게스트 사용자 방어: Firestore 쓰기 차단
  if (user.uid === 'guest-id') {
    throw new Error('[Security] Guest users cannot create community posts.');
  }
  const newPost: CommunityPost = {
    id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: user.uid,
    userName: user.displayName || 'Anonymous Hunter',
    userAvatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
    userEmoticonKey: user.activeEmoticonKey || undefined,
    userBadgeKey: user.activeBadgeKey || undefined,
    userTitleKey: user.activeTitleKey || undefined,
    imageUrl: imageUrl || undefined,
    imageUrls: imageUrls || undefined,
    content,
    createdAt: Date.now(),
    likes: [],
    comments: [],
    category: category || 'free',
    deckData: deckData || undefined,
    flair: flair || undefined,
    isPinned: isPinned || undefined,
    isWeeklyThread: isWeeklyThread || undefined,
    weeklyThreadDate: weeklyThreadDate || undefined,
  };

  // 1. LocalStorage 저장
  const posts = getLocalPosts();
  posts.unshift(newPost);
  saveLocalPosts(posts);

  // 2. Firestore 저장 (에러가 발생하면 무시하지 않고 throw)
  try {
    const docRef = doc(db, 'community_posts', newPost.id);
    await setDoc(docRef, sanitizeForFirestore(newPost));
  } catch (error) {
    console.error('[Firestore] Failed to create community post in cloud:', error);
    // LocalStorage 롤백 (글 작성 실패했으므로 로컬에서도 제거)
    const filteredPosts = getLocalPosts().filter(p => p.id !== newPost.id);
    saveLocalPosts(filteredPosts);
    throw error;
  }

  return newPost;
}

export async function toggleLikePost(postId: string, userId: string): Promise<CommunityPost> {
  // 게스트 사용자 방어: Firestore 쓰기 차단
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

  // Local Storage 업데이트
  saveLocalPosts(posts);

  // Firestore 업데이트
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
  // 게스트 사용자 방어: Firestore 쓰기 차단
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
  // 게스트 사용자 방어: Firestore 쓰기 차단
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
    // Firestore security rules에 의해 작성자 또는 관리자만 삭제 가능
    await deleteDoc(docRef);
  } catch (error) {
    console.error('[Firestore] Failed to delete community post from cloud:', error);
    // 로컬 상태 복원을 위해 이전 상태 복구는 호출부에서 로딩을 새로고침하여 수행
    throw error;
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
  // 게스트 사용자 방어: Firestore 쓰기 차단
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

// ─── New: Pin / Hide / Report functions (Doc 62) ─────────────────

/** Toggle pinned status on a post (admin only in practice, firebase-level check) */
export async function togglePinPost(postId: string): Promise<CommunityPost> {
  const posts = await getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error('Post not found');

  post.isPinned = !post.isPinned;
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
