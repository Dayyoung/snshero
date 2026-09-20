import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Plus, Send, X, ImageIcon, User, AlertCircle, Trash2, Languages, Globe, ChevronLeft, ChevronRight, CornerDownRight, ArrowLeft, Share2, Sparkles, Swords, HelpCircle, Trophy, Navigation, Shield, ExternalLink, CheckCircle2, Vote, Palette, BookOpenCheck, Tag, Copy, Pin, EyeOff, Flag, Flame, Clock, ArrowUp, MessageSquare, MoreHorizontal, RotateCw, Search, Smile, AtSign, Volume2, VolumeX, Zap, Check, ArrowUpCircle, Smartphone } from 'lucide-react';
import { Language, CommunityPost, CommunityComment, CardData, CommunityCategory, CommunityWritableCategory, UserInfo, CommunitySortMode, PostFlair } from '../types';
import { CardItem } from '../components/CardItem';
import { t, translateText } from '../lib/i18n';
import { cn } from '../lib/utils';
import { PageHeader } from '../components/PageHeader';
import { PageSubHeader } from '../components/PageSubHeader';
import {
  getCommunityPosts,
  createCommunityPost,
  toggleLikePost,
  addCommentToPost,
  deleteCommunityPost,
  addReplyToComment,
  deleteCommentFromPost,
  deleteReplyFromComment,
  uploadCommunityImage,
  compressImagesToBase64,
  uploadMultipleImagesToServer,
  normalizeImageUrl,
  toggleHidePost,
  reportPost,
  togglePinPost,
  sortPostsByMode,
  triggerHaptic,
  shareCommunityPost,
  getCommunityPostShareUrl,
  getOfflineQueue,
  enqueueOfflineAction,
  clearOfflineQueue
} from '../lib/communityHelper';
import { getActiveFanEvents, FAN_EVENT_TYPE_META } from '../content/fanEvents';
import { useFanEventVotes } from '../hooks/useFanEventVotes';
import type { FanEvent } from '../content/fanEvents';
import { SNS_ECONOMY_EARNINGS } from '../content/snsEconomy';
import { getProfileBadgeByKey, getProfileEmoticonByKey, getProfileTitleByKey } from '../content/profileEmoticons';
import { MonsterPetBadge } from '../components/MonsterPetBadge';
import { useMonsterPet } from '../hooks/useMonsterPet';
import { parseCardAvatarId } from '../lib/monsterPet';

interface CommunityViewProps {
  onBack: () => void;
  language: Language;
  playSfx: (url: string) => void;
  user: (UserInfo & { isAdmin?: boolean }) | null;
  sns?: number;
  updateSns?: (amount: number, reason?: string) => void;
  initialPostId?: string;
  initialCategory?: CommunityCategory;
  onAttack?: (targetUid: string, targetName: string) => void;
}

const getProfileIdentityMeta = (emoticonKey?: string, badgeKey?: string, titleKey?: string) => ({
  emoticon: emoticonKey ? getProfileEmoticonByKey(emoticonKey) : null,
  badge: badgeKey ? getProfileBadgeByKey(badgeKey) : null,
  title: titleKey ? getProfileTitleByKey(titleKey) : null,
});

// ── Doc 62: Flair metadata ─────────────────────────────────────────
const FLAIR_META: Record<PostFlair, { label: string; color: string; icon: string }> = {
  general: { label: 'General', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: '💬' },
  casual: { label: 'Casual', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: '☕' },
  greeting: { label: 'Greeting', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: '👋' },
  suggestion: { label: 'Suggestion', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: '💡' },
  question: { label: 'Question', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: '❓' },
  answered: { label: 'Answered', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: '✅' },
  'build-help': { label: 'Build Help', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: '🔧' },
  guide: { label: 'Guide', color: 'bg-teal-50 text-teal-600 border-teal-200', icon: '📖' },
  strategy: { label: 'Strategy', color: 'bg-red-50 text-red-600 border-red-200', icon: '🎯' },
  meta: { label: 'Meta', color: 'bg-violet-50 text-violet-600 border-violet-200', icon: '📊' },
  beginner: { label: 'Beginner', color: 'bg-green-50 text-green-600 border-green-200', icon: '🌱' },
  'deck-showcase': { label: 'Deck Show', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: '🃏' },
  'pull-flex': { label: 'Pull Flex', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: '✨' },
  achievement: { label: 'Achievement', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: '🏆' },
  challenge: { label: 'Challenge', color: 'bg-orange-50 text-orange-600 border-orange-200', icon: '⚔️' },
  'battle-report': { label: 'Battle Rpt', color: 'bg-red-50 text-red-600 border-red-200', icon: '📋' },
  'lf-duel': { label: 'LF Duel', color: 'bg-pink-50 text-pink-600 border-pink-200', icon: '🤺' },
  drawing: { label: 'Drawing', color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200', icon: '🎨' },
  'digital-art': { label: 'Digital Art', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: '💻' },
  cosplay: { label: 'Cosplay', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: '👗' },
  music: { label: 'Music', color: 'bg-sky-50 text-sky-600 border-sky-200', icon: '🎵' },
  'episode-discuss': { label: 'Ep Discuss', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: '📺' },
  theory: { label: 'Theory', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: '🔮' },
  'fan-fiction': { label: 'Fan Fiction', color: 'bg-violet-50 text-violet-600 border-violet-200', icon: '✍️' },
  poll: { label: 'Poll', color: 'bg-cyan-50 text-cyan-600 border-cyan-200', icon: '📊' },
  'character-pick': { label: 'Char Pick', color: 'bg-pink-50 text-pink-600 border-pink-200', icon: '⭐' },
  'event-info': { label: 'Event Info', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: '📢' },
  rewards: { label: 'Rewards', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: '🎁' },
  feedback: { label: 'Feedback', color: 'bg-slate-50 text-slate-600 border-slate-200', icon: '📝' },
};

/** Get flairs relevant to a given category */
const getFlairsForCategory = (category: CommunityCategory | 'select'): PostFlair[] => {
  const flairMap: Record<string, PostFlair[]> = {
    news: ['event-info', 'rewards'],
    free: ['general', 'casual', 'greeting', 'suggestion'],
    qa: ['question', 'answered', 'build-help'],
    tip: ['guide', 'strategy', 'meta', 'beginner'],
    boast: ['deck-showcase', 'pull-flex', 'achievement'],
    pvp: ['challenge', 'battle-report', 'lf-duel'],
    fanart: ['drawing', 'digital-art', 'cosplay', 'music'],
    webtoon: ['episode-discuss', 'theory', 'fan-fiction'],
    vote: ['poll', 'character-pick'],
    season: ['event-info', 'rewards', 'feedback'],
    select: ['general', 'question', 'guide', 'achievement', 'deck-showcase', 'drawing', 'episode-discuss', 'poll', 'event-info', 'feedback'],
  };
  return flairMap[category] || flairMap.free;
};

/** Flair badge component for inline use */
const renderFlairBadge = (flair?: PostFlair, extraClass?: string) => {
  if (!flair) return null;
  const meta = FLAIR_META[flair];
  if (!meta) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold leading-none', meta.color, extraClass)}>
      <span className="text-[10px] leading-none">{meta.icon}</span>
      {meta.label}
    </span>
  );
};

/** [Round 4] 검색 키워드 실시간 하이라이팅 컴포넌트 */
const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;
  const escaped = trimmed.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark key={i} className="bg-amber-200 text-[#201d1d] font-bold px-0.5 rounded-xs">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export const CommunityView: React.FC<CommunityViewProps> = ({
  onBack,
  language,
  playSfx,
  user,
  sns,
  updateSns,
  initialPostId,
  initialCategory,
  onAttack,
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 카테고리 선택 상태 ('select' | CategoryType)
  const [selectedCategory, setSelectedCategory] = useState<'select' | CommunityCategory>('select');
  // 상세 보기 포스트 객체
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [content, setContent] = useState('');
  const [uploadCategory, setUploadCategory] = useState<CommunityWritableCategory>('free');
  
  // Doc 62: Flair selection for new post
  const [uploadFlair, setUploadFlair] = useState<PostFlair | ''>('');
  
  // 다중 이미지 파일 첨부 상태
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 댓글 입력 창 및 대댓글 입력 창 상태
  const [commentInput, setCommentInput] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({}); // commentId -> replyText
  const [activeReplyBox, setActiveReplyBox] = useState<string | null>(null); // commentId
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({}); // commentId -> boolean
  const [allRepliesExpanded, setAllRepliesExpanded] = useState(false); // [Round 5] 대댓글 전체 접기/펼치기
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // [Round 5] 이모지 퀵 픽커 토글
  const [showMentionPicker, setShowMentionPicker] = useState(false); // [Round 5] 멘션 퀵 픽커 토글

  // 이미지 캐러셀 슬라이더 인덱스
  const [carouselIndex, setCarouselIndex] = useState(0);

  // [Round 2] 이미지 전체화면 라이트박스(Lightbox) 및 레이지 로딩/에러 상태
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    index: number;
    images: string[];
  } | null>(null);
  const [imageLoadedMap, setImageLoadedMap] = useState<Record<string, boolean>>({});
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

  // [Round 3] Draft 임시저장 및 덱 첨부 상태
  const [hasDraftRestored, setHasDraftRestored] = useState(false);
  const [attachDeckToPost, setAttachDeckToPost] = useState(true);

  // 모달이 열릴 때 임시저장된 draft 복원
  useEffect(() => {
    if (showUploadModal) {
      try {
        const savedDraft = localStorage.getItem('hero_community_draft');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.content && !content) {
            setContent(parsed.content);
            if (parsed.category) setUploadCategory(parsed.category);
            if (parsed.flair) setUploadFlair(parsed.flair);
            setHasDraftRestored(true);
          }
        }
      } catch (e) {
        console.warn('Failed to parse community draft:', e);
      }
    }
  }, [showUploadModal]);

  // 내용 변경 시 실시간 임시저장
  useEffect(() => {
    if (content.trim()) {
      const draftData = {
        content,
        category: uploadCategory,
        flair: uploadFlair,
        updatedAt: Date.now()
      };
      localStorage.setItem('hero_community_draft', JSON.stringify(draftData));
    }
  }, [content, uploadCategory, uploadFlair]);

  const handleClearDraft = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    localStorage.removeItem('hero_community_draft');
    setContent('');
    setHasDraftRestored(false);
  };

  // 라이트박스 ESC 키 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightbox?.isOpen) {
        setLightbox(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox]);

  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'error';
    onConfirm?: () => void;
  } | null>(null);

  // ── [Round 6] 사운드 음소거 토글 & 햅틱 마이크로 파티클 ──
  const [soundMuted, setSoundMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_community_sound_muted') === 'true';
    } catch {
      return false;
    }
  });
  const [likeParticles, setLikeParticles] = useState<Array<{ id: string; x: number; y: number; emoji: string }>>([]);

  const playCustomSfx = (url: string) => {
    if (soundMuted) return;
    try {
      playSfx(url);
    } catch {
      // 무시
    }
  };

  const handleToggleSound = () => {
    triggerHaptic('light');
    setSoundMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hero_community_sound_muted', String(next));
      } catch {
        // 무시
      }
      return next;
    });
  };

  // ── [Round 7] 소셜 공유 & 딥링크 토스트 ──
  const [shareToast, setShareToast] = useState<string | null>(null);

  const showShareToastMessage = (msg: string) => {
    setShareToast(msg);
    setTimeout(() => {
      setShareToast(null);
    }, 2800);
  };

  // ── [Round 8] 오프라인 상태 감지 & 큐 동기화 ──
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true
  );
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => getOfflineQueue().length);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerHaptic('success');
      showShareToastMessage(language === 'ko' ? '[온라인 재연결: 오프라인 데이터 자동 동기화됨]' : '[Online Reconnected: Syncing offline data]');
      const q = getOfflineQueue();
      if (q.length > 0) {
        clearOfflineQueue();
        setOfflineQueueCount(0);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerHaptic('heavy');
      showShareToastMessage(language === 'ko' ? '[오프라인 모드: 로컬 캐시에 안전하게 보관됩니다]' : '[Offline Mode: Saved to LocalStorage]');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language]);

  // ── [Round 10] 가상 배치 렌더링 & 무한 스크롤 페이지 카운트 ──
  const [visiblePostsCount, setVisiblePostsCount] = useState<number>(15);

  // ── Doc 62: Sort / Flair / Hide / Report state ──────────────────
  const [sortMode, setSortMode] = useState<CommunitySortMode>('hot');
  const [showHiddenPosts, setShowHiddenPosts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlairFilter, setSelectedFlairFilter] = useState<PostFlair | 'all'>('all');
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    postId: string;
    postTitle: string;
  } | null>(null);
  const [postMenuOpen, setPostMenuOpen] = useState<string | null>(null); // postId of open menu
  const [showHelp, setShowHelp] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelp) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelp]);

  const [helpSlide, setHelpSlide] = useState(0);

  const [translatedContents, setTranslatedContents] = useState<Record<string, {
    translated: string;
    isOriginal: boolean;
    isLoading: boolean;
  }>>({});

  // 안정적인 로컬 플레이어 UID 및 프로필 획득
  const activeUser = React.useMemo<UserInfo & { isAdmin?: boolean }>(() => {
    if (user && user.uid && user.uid !== 'guest-id') {
      return user;
    }
    const localName = (typeof window !== 'undefined' ? localStorage.getItem('hero_user_name') : '') || 'Hunter';
    const localAvatar = (typeof window !== 'undefined' ? localStorage.getItem('hero_user_avatar') : '') || 'preset:0';
    let localUid = typeof window !== 'undefined' ? localStorage.getItem('hero_player_uid') : null;
    if (!localUid && typeof window !== 'undefined') {
      localUid = `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      localStorage.setItem('hero_player_uid', localUid);
    }
    const isAdmin = typeof window !== 'undefined' ? localStorage.getItem('hero_admin_authenticated') === 'true' : false;
    return {
      uid: localUid || 'player_local',
      displayName: localName,
      photoURL: localAvatar,
      isAdmin,
    };
  }, [user]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fan Events ─────────────────────────────────────────
  const currentSeason = (() => {
    try { return localStorage.getItem('hero_current_season') || 'season3'; }
    catch { return 'season3'; }
  })();
  const activeFanEvents = getActiveFanEvents(currentSeason);
  const { votes: fanEventVotes, hasVoted, castVote } = useFanEventVotes(currentSeason);
  const { getPetIdForRepresentativeCard } = useMonsterPet({ season: currentSeason });

  const getLocalMonsterPetId = (authorId: string, avatar: string): number | null => {
    if (!activeUser || authorId !== activeUser.uid) {
      return null;
    }
    const representativeCardId = parseCardAvatarId(avatar);
    return representativeCardId ? getPetIdForRepresentativeCard(representativeCardId) : null;
  };

  // 부지런의 나무 보상 지급 판정
  const checkAndGrantDiligenceReward = () => {
    if (!activeUser || !updateSns) return;
    
    const now = Date.now();
    const stored = localStorage.getItem('hero_last_diligence_time');
    const lastTime = stored ? parseInt(stored) || 0 : 0;
    const cooldown = SNS_ECONOMY_EARNINGS.repeatable.treeOfDiligence.cooldownHours * 60 * 60 * 1000;
    
    if (now - lastTime >= cooldown) {
      localStorage.setItem('hero_last_diligence_time', now.toString());
      updateSns(SNS_ECONOMY_EARNINGS.repeatable.treeOfDiligence.reward, t('tree_of_diligence', language));
      
      setCustomModal({
        isOpen: true,
        title: t('tree_of_diligence_reward_title', language),
        message: t('tree_of_diligence_reward_desc', language),
        type: 'alert'
      });
    }
  };

  // 1. 초기 게시물 로딩
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await getCommunityPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Failed to load community posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. 딥링크 URL 파라미터 감지 및 자동 라우팅
  useEffect(() => {
    if (loading || posts.length === 0) return;

    if (initialPostId) {
      const target = posts.find((p) => p.id === initialPostId);
      if (target) {
        setSelectedPost(target);
        if (target.category) {
          setSelectedCategory(target.category);
        }
      }
    } else if (initialCategory) {
      setSelectedCategory(initialCategory);
      setSelectedPost(null);
    }
  }, [initialPostId, initialCategory, posts, loading]);

  // 3. SEO / GEO / AEO 동적 메타 데이터 & 구조화 데이터(JSON-LD) 주입
  useEffect(() => {
    const defaultTitle = t('seo_title_home', language) || 'SNSHero - AI Card Battle';
    const defaultDesc = t('seo_desc_home', language) || 'Generative AI web card battle game.';

    if (selectedPost) {
      // 3-1. 상세 보기 진입 시 메타 변경
      const catText = t(`community_cat_${selectedPost.category || 'free'}` as any, language);
      const postTitle = `[${catText}] ${selectedPost.userName} - SNSHero Community`;
      const postDesc = selectedPost.content.substring(0, 150).replace(/\n/g, ' ');

      document.title = postTitle;

      // Meta Description
      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.setAttribute('name', 'description');
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute('content', postDesc);

      // Open Graph Tags
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', postTitle);

      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', postDesc);

      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      if (selectedPost.imageUrls && selectedPost.imageUrls.length > 0) {
        ogImage.setAttribute('content', selectedPost.imageUrls[0]);
      } else if (selectedPost.imageUrl) {
        ogImage.setAttribute('content', selectedPost.imageUrl);
      } else {
        ogImage.setAttribute('content', 'https://snshero.com/logo.jpg');
      }

      let twitterImage = document.querySelector('meta[property="twitter:image"]');
      if (!twitterImage) {
        twitterImage = document.createElement('meta');
        twitterImage.setAttribute('property', 'twitter:image');
        document.head.appendChild(twitterImage);
      }
      if (selectedPost.imageUrls && selectedPost.imageUrls.length > 0) {
        twitterImage.setAttribute('content', selectedPost.imageUrls[0]);
      } else if (selectedPost.imageUrl) {
        twitterImage.setAttribute('content', selectedPost.imageUrl);
      } else {
        twitterImage.setAttribute('content', 'https://snshero.com/logo.jpg');
      }

      // JSON-LD 주입 (AEO/GEO/SEO 크롤러 타겟팅)
      let scriptLd = document.getElementById('community-jsonld') as HTMLScriptElement | null;
      if (!scriptLd) {
        scriptLd = document.createElement('script');
        scriptLd.id = 'community-jsonld';
        scriptLd.type = 'application/ld+json';
        document.head.appendChild(scriptLd);
      }
      scriptLd.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SocialMediaPosting",
        "headline": t('community_post_headline_jsonld', language).replace('{username}', selectedPost.userName),
        "articleBody": selectedPost.content,
        "author": {
          "@type": "Person",
          "name": selectedPost.userName,
          "image": formatAvatarUrl(selectedPost.userAvatar, selectedPost.userId)
        },
        "datePublished": new Date(selectedPost.createdAt).toISOString(),
        "image": selectedPost.imageUrls || (selectedPost.imageUrl ? [selectedPost.imageUrl] : []),
        "publisher": {
          "@type": "Organization",
          "name": "SNSHero",
          "logo": "https://snshero.com/logo.png"
        }
      });
    } else {
      // 3-2. 목록/카테고리 화면인 경우 기본 메타로 원복
      document.title = selectedCategory !== 'select'
        ? `${t(`community_cat_${selectedCategory}` as any, language)} | SNSHero Community`
        : `Community | SNSHero`;

      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.setAttribute('name', 'description');
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute('content', defaultDesc);

      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', defaultTitle);

      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', defaultDesc);

      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', 'https://snshero.com/logo.jpg');

      let twitterImage = document.querySelector('meta[property="twitter:image"]');
      if (!twitterImage) {
        twitterImage = document.createElement('meta');
        twitterImage.setAttribute('property', 'twitter:image');
        document.head.appendChild(twitterImage);
      }
      twitterImage.setAttribute('content', 'https://snshero.com/logo.jpg');

      // JSON-LD 스크립트 삭제
      const scriptLd = document.getElementById('community-jsonld');
      if (scriptLd) scriptLd.remove();
    }
  }, [selectedPost, selectedCategory, language]);

  // Check for pending PvP battle result comments
  useEffect(() => {
    const checkPendingResult = async () => {
      const resultStr = localStorage.getItem('hero_pvp_battle_result');
      if (!resultStr || !activeUser) return;
      try {
        const result = JSON.parse(resultStr);
        const comment = language === 'ko'
          ? `⚔️ ${activeUser.displayName || 'You'} vs ${result.opponentName} — ${result.result} (${result.score})`
          : `⚔️ ${activeUser.displayName || 'You'} vs ${result.opponentName} — ${result.result} (${result.score})`;
        localStorage.removeItem('hero_pvp_battle_result');
        setCommentInput(comment);
        setTimeout(() => {
          handleAddComment(result.postId);
        }, 100);
      } catch (e) {
        localStorage.removeItem('hero_pvp_battle_result');
      }
    };
    const timer = setTimeout(checkPendingResult, 500);
    return () => clearTimeout(timer);
  }, []);

  // 카테고리 또는 게시물이 변경될 때 스크롤 오프셋을 0으로 리셋
  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollContainers = document.querySelectorAll('.overflow-y-auto');
    scrollContainers.forEach(container => {
      container.scrollTop = 0;
    });
  }, [selectedCategory, selectedPost]);

  // 최상단 공용 뒤로가기 버튼 처리 이벤트 리스너 연동
  useEffect(() => {
    const handleGlobalBack = (e: Event) => {
      e.preventDefault();
      if (selectedPost) {
        // 상세글 읽고 있으면 목록으로 복귀
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        setSelectedPost(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('postId');
        window.history.replaceState({}, '', url.toString());
      } else if (selectedCategory !== 'select') {
        // 카테고리 상세 글목록에 있으면 카테고리 선택으로 복귀
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        setSelectedCategory('select');
        window.history.pushState({}, '', '?view=community');
      } else {
        // 완전 홈으로 복귀
        onBack();
      }
    };
    window.addEventListener('global-back', handleGlobalBack);
    return () => window.removeEventListener('global-back', handleGlobalBack);
  }, [selectedPost, selectedCategory, onBack, playSfx]);

  // 이미지 파일 다중 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      
      // 이미지 파일 크기 제한 검사 (최대 5MB)
      const MAX_SIZE = 5 * 1024 * 1024;
      const hasLargeFile = files.some(file => file.size > MAX_SIZE);
      if (hasLargeFile) {
        setCustomModal({
          isOpen: true,
          title: t('community_error', language),
          message: t('image_size_limit_exceeded', language),
          type: 'error'
        });
        return;
      }

      if (imageFiles.length + files.length > 5) {
        setCustomModal({
          isOpen: true,
          title: t('community_error', language),
          message: t('community_image_limit_warn', language),
          type: 'error'
        });
        return;
      }

      setImageFiles(prev => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // 이미지 개별 삭제 핸들러
  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 글 작성 API 연동
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setCustomModal({
        isOpen: true,
        title: t('community_error', language),
        message: t('community_post_content', language),
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    try {
      // 1. 다중 이미지 Canvas 고압축 Base64 변환 (최대 5장)
      const compressedBase64Images = imageFiles.length > 0
        ? await compressImagesToBase64(imageFiles)
        : [];

      // 1-1. 서버에 이미지 업로드하여 모든 사용자가 공유 가능한 고유 HTTP URL 획득
      let uploadedImageUrls = compressedBase64Images;
      if (compressedBase64Images.length > 0) {
        try {
          uploadedImageUrls = await uploadMultipleImagesToServer(compressedBase64Images);
        } catch (uploadErr) {
          console.warn('Server upload failed, falling back to base64:', uploadErr);
        }
      }

      // [Round 3] 덱 자랑(boast) 카테고리이거나 덱 첨부 활성화 시 대표 덱 로드
      let attachedDeck = undefined;
      if ((uploadCategory === 'boast' || attachDeckToPost)) {
        try {
          const storedDeck = localStorage.getItem('hero_user_deck');
          if (storedDeck) {
            const parsedDeck = JSON.parse(storedDeck);
            if (Array.isArray(parsedDeck) && parsedDeck.length > 0) {
              attachedDeck = parsedDeck;
            }
          }
        } catch (deckErr) {
          console.warn('Failed to load user deck for post:', deckErr);
        }
      }

      // 2. 포스트 생성 및 구글 폼 제출 호출
      const newPost = await createCommunityPost(
        content.trim(),
        uploadedImageUrls[0] || undefined,
        activeUser,
        uploadCategory,
        uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
        attachedDeck, // deckData
        uploadFlair || undefined, // Doc 62: flair
      );

      // 성공 시 draft 초기화
      localStorage.removeItem('hero_community_draft');
      setHasDraftRestored(false);

      setPosts((prev) => [newPost, ...prev.filter(p => p.id !== newPost.id)]);
      setContent('');
      setImageFiles([]);
      setImagePreviews([]);
      setUploadFlair(''); // Doc 62: reset flair
      setShowUploadModal(false);

      // 업로드 후 작성한 카테고리로 필터 이동
      setSelectedCategory(uploadCategory);
      setSelectedPost(newPost); // 작성한 글 상세 페이지로 바로 이동

      // 브라우저 쿼리 주소 업데이트
      window.history.pushState({}, '', `?view=community&postId=${newPost.id}`);

      // 부지런의 나무 보상 판정
      checkAndGrantDiligenceReward();

      // 백그라운드에서 구글 시트 데이터 동기화 재시도
      setTimeout(() => {
        loadPosts();
      }, 1500);
      setTimeout(() => {
        loadPosts();
      }, 4000);
    } catch (error) {
      console.error(error);
      setCustomModal({
        isOpen: true,
        title: t('community_error', language),
        message: t('community_post_failed', language),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 좋아요 처리
  const handleLikeToggle = async (postId: string) => {
    playCustomSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');

    // Optimistic UI Update & Haptic / Particle Trigger
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const hasLiked = post.likes.includes(activeUser.uid);
          if (!hasLiked) {
            triggerHaptic('double');
            const particleId = `part_${Date.now()}_${Math.random()}`;
            setLikeParticles((p) => [...p, { id: particleId, x: (Math.random() - 0.5) * 60, y: -20, emoji: '❤️' }]);
            setTimeout(() => {
              setLikeParticles((p) => p.filter((item) => item.id !== particleId));
            }, 900);
          } else {
            triggerHaptic('light');
          }

          const nextLikes = hasLiked
            ? post.likes.filter((id) => id !== activeUser.uid)
            : [...post.likes, activeUser.uid];
          
          const updated = { ...post, likes: nextLikes };
          if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(updated);
          }
          return updated;
        }
        return post;
      })
    );

    try {
      await toggleLikePost(postId, activeUser.uid);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      loadPosts();
    }
  };

  // 댓글 작성
  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    const textToSend = commentInput.trim();
    setCommentInput('');

    try {
      const updatedPost = await addCommentToPost(postId, textToSend, activeUser);
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? updatedPost : post))
      );
      setSelectedPost(updatedPost);
      checkAndGrantDiligenceReward();
    } catch (error) {
      console.error('Failed to add comment:', error);
      setCustomModal({
        isOpen: true,
        title: t('community_error', language),
        message: 'Failed to add comment',
        type: 'error'
      });
    }
  };

  // 대댓글 작성
  const handleAddReply = async (postId: string, commentId: string) => {
    const replyText = replyInputs[commentId] || '';
    if (!replyText.trim()) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    // Clear input
    setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
    setActiveReplyBox(null);

    try {
      const updatedPost = await addReplyToComment(postId, commentId, replyText.trim(), activeUser);
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? updatedPost : post))
      );
      setSelectedPost(updatedPost);

      // 대댓글 리스트 자동 오픈
      setOpenReplies(prev => ({ ...prev, [commentId]: true }));
      checkAndGrantDiligenceReward();
    } catch (error) {
      console.error('Failed to add reply:', error);
      setCustomModal({
        isOpen: true,
        title: t('community_error', language),
        message: 'Failed to add reply',
        type: 'error'
      });
    }
  };

  // [Round 5] 댓글 삭제
  const handleDeleteComment = async (postId: string, commentId: string) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    try {
      const updatedPost = await deleteCommentFromPost(postId, commentId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
      setSelectedPost(updatedPost);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  // [Round 5] 대댓글 삭제
  const handleDeleteReply = async (postId: string, commentId: string, replyId: string) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    try {
      const updatedPost = await deleteReplyFromComment(postId, commentId, replyId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
      setSelectedPost(updatedPost);
    } catch (error) {
      console.error('Failed to delete reply:', error);
    }
  };

  // [Round 5] 모든 대댓글 일괄 접기/펼치기 토글
  const handleToggleAllReplies = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
    if (!selectedPost) return;
    const nextState = !allRepliesExpanded;
    setAllRepliesExpanded(nextState);
    const newMap: Record<string, boolean> = {};
    selectedPost.comments.forEach(c => {
      if (c.replies && c.replies.length > 0) {
        newMap[c.id] = nextState;
      }
    });
    setOpenReplies(newMap);
  };

  // 글 삭제
  const handleDeletePost = async (postId: string) => {
    try {
      await deleteCommunityPost(postId, activeUser.uid);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setSelectedPost(null);
      // 삭제 후 목록으로 복원
      window.history.pushState({}, '', `?view=community&category=${selectedCategory}`);
      setCustomModal({
        isOpen: true,
        title: t('community_post_success_title', language),
        message: t('community_delete_post_success', language),
        type: 'alert'
      });
    } catch (error) {
      console.error(error);
      setCustomModal({
        isOpen: true,
        title: t('community_error', language),
        message: t('community_delete_post_failed', language),
        type: 'error'
      });
      loadPosts();
    }
  };

  // ── Doc 62: Hide / Report / Pin handlers ──────────────────────────
  const handleHidePost = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setPostMenuOpen(null);
    try {
      const updatedPost = await toggleHidePost(postId, activeUser.uid);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(updatedPost);
      }
    } catch (error) {
      console.error('Failed to toggle hide:', error);
      loadPosts();
    }
  };

  const handleReportPost = async (postId: string, reason: 'spam' | 'harassment' | 'inappropriate' | 'other') => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    try {
      const updatedPost = await reportPost(postId, activeUser.uid, reason);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
      setReportModal(null);
      setPostMenuOpen(null);
      setCustomModal({
        isOpen: true,
        title: t('report_submitted_title', language),
        message: t('report_submitted_desc', language),
        type: 'alert'
      });
    } catch (error) {
      console.error('Failed to report post:', error);
    }
  };

  const handlePinPost = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeUser.isAdmin) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setPostMenuOpen(null);
    try {
      const updatedPost = await togglePinPost(postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  // 번역 처리
  const handleTranslate = async (postId: string, text: string, isSilent: boolean = false) => {
    const current = translatedContents[postId];
    if (current) {
      setTranslatedContents((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], isOriginal: !prev[postId].isOriginal }
      }));
      return;
    }

    setTranslatedContents((prev) => ({
      ...prev,
      [postId]: { translated: '', isOriginal: true, isLoading: true }
    }));

    try {
      const translated = await translateText(text, language);
      setTranslatedContents((prev) => ({
        ...prev,
        [postId]: { translated, isOriginal: false, isLoading: false }
      }));
    } catch (error) {
      console.error("Translation failed:", error);
      setTranslatedContents((prev) => {
        const copy = { ...prev };
        delete copy[postId];
        return copy;
      });
      if (!isSilent) {
        setCustomModal({
          isOpen: true,
          title: t('community_error', language),
          message: 'Translation failed. Please try again.',
          type: 'error'
        });
      }
    }
  };

  const getOriginalUrl = (post: CommunityPost): string | null => {
    const urlMatch = post.content.match(/(?:Original Link|원본 링크)\s*:\s*(https?:\/\/\S+)/i);
    return post.videoUrl || (urlMatch ? urlMatch[1].replace(/[)\].,]+$/, '') : null);
  };

  const openOriginalUrl = (url: string, event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getRelativeTimeString = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return t('time_just_now', language);
    }
    if (minutes < 60) {
      return t('time_minutes_ago', language).replace('{minutes}', minutes.toString());
    }
    if (hours < 24) {
      return t('time_hours_ago', language).replace('{hours}', hours.toString());
    }
    return t('time_days_ago', language).replace('{days}', days.toString());
  };

  const formatAvatarUrl = (avatar: string, userId: string) => {
    if (avatar.startsWith('preset:')) {
      const idx = parseInt(avatar.split(':')[1]) || 0;
      return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Hero-${idx}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    }
    if (avatar.startsWith('http')) {
      return avatar;
    }
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`;
  };

  // [Round 4] 선택한 카테고리 + 플레어 태그 + 검색어(본문/작성자/태그) + 정렬 + 히든 필터 (useMemo 60fps 최적화)
  const filteredPosts = React.useMemo(() => {
    let result = posts.filter(
      (post) => selectedCategory === 'select' 
        ? post.category !== 'news'
        : (post.category || 'free') === selectedCategory
    );
    // 1. Filter hidden posts unless showing them
    if (!showHiddenPosts && activeUser) {
      result = result.filter((post) => !post.hiddenBy?.includes(activeUser.uid));
    }
    // 2. Flair Tag Filter
    if (selectedFlairFilter !== 'all') {
      result = result.filter((post) => post.flair === selectedFlairFilter);
    }
    // 3. Search Query Filter (본문, 작성자, 태그)
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((post) => {
        const matchContent = post.content?.toLowerCase().includes(query);
        const matchAuthor = post.userName?.toLowerCase().includes(query);
        const matchFlair = post.flair && FLAIR_META[post.flair]?.label.toLowerCase().includes(query);
        return Boolean(matchContent || matchAuthor || matchFlair);
      });
    }
    // 4. Sort by selected mode
    return sortPostsByMode(result, sortMode);
  }, [posts, selectedCategory, showHiddenPosts, activeUser, selectedFlairFilter, searchQuery, sortMode]);

  // 자동 번역 효과 추가
  useEffect(() => {
    filteredPosts.forEach((post) => {
      if (!translatedContents[post.id]) {
        handleTranslate(post.id, post.content, true);
      }
    });
  }, [filteredPosts, language]);

  useEffect(() => {
    if (selectedPost && !translatedContents[selectedPost.id]) {
      handleTranslate(selectedPost.id, selectedPost.content, true);
    }
  }, [selectedPost, language]);

  // 동적 헤더 타이틀 결정
  let currentTitle = t('community', language);
  if (selectedPost) {
    currentTitle = t(`community_cat_${selectedPost.category || 'free'}` as any, language);
  } else if (selectedCategory !== 'select') {
    currentTitle = t(`community_cat_${selectedCategory}` as any, language);
  }

  return (
    <div id="community-section" className="flex-1 flex flex-col w-full bg-[#fdfcfc] text-[#201d1d] font-mono tracking-tight overflow-y-auto pb-32">
      <div className="max-w-4xl mx-auto w-full px-4 flex flex-col gap-6">
        <PageHeader 
        title={currentTitle} 
        onBack={() => {
          if (selectedPost) {
            setSelectedPost(null);
            const url = new URL(window.location.href);
            url.searchParams.delete('postId');
            window.history.replaceState({}, '', url.toString());
          } else if (selectedCategory !== 'select') {
            setSelectedCategory('select');
            window.history.pushState({}, '', '?view=community');
          } else {
            onBack();
          }
        }}
        rightAction={
          <div className="flex items-center gap-1.5">
            {!isOnline && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-amber-300 bg-amber-50 text-amber-900 text-[10px] font-mono font-bold"
                title={language === 'ko' ? '오프라인 모드 (로컬 캐시 보관)' : 'Offline Mode (Saved to cache)'}
              >
                [OFFLINE]
              </span>
            )}
            <button
              onClick={handleToggleSound}
              className={cn(
                "inline-flex min-h-9 min-w-9 items-center justify-center rounded-sm border transition-all active:scale-95 cursor-pointer touch-target font-mono text-xs",
                soundMuted
                  ? "bg-[#eae5e5] text-[#888] border-[rgba(15,0,0,0.2)]"
                  : "bg-white text-[#201d1d] border-[rgba(15,0,0,0.15)] hover:border-[#201d1d]"
              )}
              title={soundMuted ? (language === 'ko' ? '사운드 켜기' : 'Unmute sound') : (language === 'ko' ? '사운드 끄기' : 'Mute sound')}
              aria-label={soundMuted ? "Unmute sound" : "Mute sound"}
            >
              {soundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button
              onClick={() => {
                playCustomSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                if (selectedCategory !== 'select') {
                  setUploadCategory(selectedCategory);
                }
                setShowUploadModal(true);
              }}
              className="inline-flex min-h-9 items-center gap-1 px-3 py-1.5 rounded-sm border border-[#201d1d] bg-[#201d1d] hover:bg-[#383333] text-white text-xs font-bold transition-all active:scale-95 cursor-pointer touch-target"
              title={language === 'ko' ? '새 글 작성' : 'Write post'}
              aria-label="Write post"
            >
              <span className="font-mono text-sm leading-none">[+]</span>
              <span>{language === 'ko' ? '글쓰기' : 'Write'}</span>
            </button>
            <button
              onClick={() => {
                playCustomSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                loadPosts();
              }}
              className={cn(
                "inline-flex min-h-9 min-w-9 items-center justify-center rounded-sm border border-[rgba(15,0,0,0.15)] bg-white text-[#201d1d] transition-all hover:border-[#201d1d] hover:bg-[#f5f2f2] active:scale-95 cursor-pointer touch-target",
                loading && "animate-spin text-[#201d1d]"
              )}
              title={language === 'ko' ? '글 목록 새로고침 (구글 시트)' : 'Refresh posts (Google Sheet)'}
              aria-label="Refresh posts"
            >
              <RotateCw size={14} />
            </button>
            <button
              onClick={() => { setShowHelp(true); setHelpSlide(0); playCustomSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3'); }}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-sm border border-[rgba(15,0,0,0.15)] bg-white text-[#201d1d] transition-all hover:border-[#201d1d] hover:bg-[#f5f2f2] active:scale-95 cursor-pointer touch-target font-mono font-bold text-xs"
              title="Help"
              aria-label="Help"
            >
              [?]
            </button>
          </div>
        }
      />

      <PageSubHeader
        badge="HUNTER DECENTRALIZED FORUM"
        title={currentTitle}
        description=""
      />



      {/* ── Fan Events Section ── */}
      {activeFanEvents.length > 0 && (
        <div className="mt-2 mb-1">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />
            {t('fan_events_title', language)}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {activeFanEvents.map((event) => {
              const meta = FAN_EVENT_TYPE_META[event.type];
              const userVoted = hasVoted(event.id);
              const userVote = fanEventVotes[event.id];
              return (
                <div
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    setSelectedPost(null);
                    setSelectedCategory(event.categoryType);
                    window.history.pushState({}, '', `?view=community&category=${event.categoryType}`);
                  }}
                  onKeyDown={(eventKey) => {
                    if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                      eventKey.preventDefault();
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      setSelectedPost(null);
                      setSelectedCategory(event.categoryType);
                      window.history.pushState({}, '', `?view=community&category=${event.categoryType}`);
                    }
                  }}
                  className="flex-shrink-0 w-56 rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition-all shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {/* Event type badge */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-xs', meta.bgClass)}>
                      {meta.iconKey}
                    </span>
                    <span className="text-[9px] font-black uppercase text-slate-400">
                      {t(`fan_event_type_${event.type}`, language)}
                    </span>
                    {event.type === 'vote' && userVoted && (
                      <span className="ml-auto text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        ✓ {t('fan_event_voted', language)}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-xs font-bold text-slate-800 mb-1">
                    {t(event.titleKey, language)}
                  </p>
                  <p className="text-[10px] text-slate-500 mb-2 line-clamp-2">
                    {t(event.descKey, language)}
                  </p>

                  {/* Vote options & Result Graph */}
                  {event.type === 'vote' && event.voteOptions && (
                    <div className="mb-2.5 space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {event.voteOptions.map((opt) => {
                          const isSelected = userVote === opt.id;
                          const optVoteCount = (opt.id.charCodeAt(opt.id.length - 1) % 40) + (isSelected ? 25 : 10);
                          const totalVotes = event.voteOptions!.reduce(
                            (acc, o) => acc + (o.id.charCodeAt(o.id.length - 1) % 40) + (userVote === o.id ? 25 : 10),
                            0
                          );
                          const pct = totalVotes > 0 ? Math.round((optVoteCount / totalVotes) * 100) : 0;

                          return (
                            <button
                              key={opt.id}
                              onClick={(clickEvent) => {
                                clickEvent.stopPropagation();
                                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                                const isFirstVote = !userVoted;
                                castVote(event.id, opt.id);
                                if (isFirstVote && updateSns) {
                                  updateSns(event.rewardSns, t('fan_event_reward', language));
                                }
                              }}
                              className={cn(
                                'relative flex-1 min-w-[100px] overflow-hidden flex flex-col p-2 rounded-lg border text-[10px] font-bold transition-all touch-target',
                                isSelected
                                  ? 'border-indigo-400 bg-indigo-50/70 text-indigo-700 shadow-sm'
                                  : 'border-slate-200 bg-slate-50 hover:bg-rose-50/50 hover:border-rose-200 text-slate-700'
                              )}
                            >
                              {/* Graph bar fill */}
                              <div
                                className={cn(
                                  'absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-500',
                                  isSelected ? 'bg-indigo-500' : 'bg-slate-400'
                                )}
                                style={{ width: `${pct}%` }}
                              />
                              <div className="relative z-10 flex items-center justify-between gap-1 w-full">
                                <span className="flex items-center gap-1 truncate">
                                  {opt.emoji && <span>{opt.emoji}</span>}
                                  {t(opt.labelKey, language)}
                                </span>
                                <span className="text-[9px] font-black shrink-0">{pct}%</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {userVoted && (
                        <div className="flex items-center justify-between px-1 text-[9px] text-slate-500">
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <CheckCircle2 size={11} />
                            {t('fan_event_voted_notice', language) || '투표 완료 (다시 선택하여 변경 가능)'}
                          </span>
                          <span className="font-semibold text-slate-400">
                            {t('fan_event_expires', language) || '마감'}: {event.endDate} 23:59
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reward + action */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-amber-600">
                      +{event.rewardSns.toLocaleString()} SNS
                    </span>
                    <button
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setUploadCategory(event.categoryType);
                        setContent(event.hashtag + ' ');
                        // Doc 62: Auto-set flair based on fan event type
                        const eventFlairMap: Record<string, PostFlair> = {
                          fanart: 'drawing',
                          webtoon: 'episode-discuss',
                          deck_showcase: 'deck-showcase',
                          vote: 'character-pick',
                          season: 'event-info',
                        };
                        if (event.type in eventFlairMap) {
                          setUploadFlair(eventFlairMap[event.type]);
                        }
                        setShowUploadModal(true);
                      }}
                      className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 active:scale-95 transition-all touch-target flex items-center gap-1"
                    >
                      <Tag size={12} />
                      {t('fan_event_join', language)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Google Sheets Realtime Sync Status Banner (DESIGN.md Flat Hairline) */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-50/60 border border-emerald-300/80 rounded-none text-[11px] font-mono font-semibold text-emerald-900">
        <div className="flex items-center gap-2">
          <span className="font-mono text-emerald-700 font-bold">[SYNC]</span>
          <span>
            {language === 'ko'
              ? `구글 스프레드시트 실시간 연동 (${posts.filter(p => p.isFromSheet).length}개 동기화)`
              : `Google Sheet Live Synced (${posts.filter(p => p.isFromSheet).length} synced)`}
          </span>
        </div>
        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
            loadPosts();
          }}
          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer bg-transparent border-none p-0 touch-target"
        >
          <RotateCw size={11} className={loading ? "animate-spin" : ""} />
          <span>{language === 'ko' ? '[새로고침]' : '[Refresh]'}</span>
        </button>
      </div>

      {/* [Round 4] Search & Filter Control Hub (DESIGN.md Monospace Flat) */}
      {!selectedPost && (
        <div className="flex flex-col gap-2.5 border-b border-[rgba(15,0,0,0.12)] pb-3 px-1 mt-2">
          {/* 실시간 검색창 */}
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-[#777] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ko' ? '글 내용, 작성자, 태그 실시간 검색...' : 'Search posts, authors, tags...'}
              className="w-full pl-8 pr-16 py-2 bg-white border border-[rgba(15,0,0,0.15)] focus:border-[#201d1d] rounded-sm font-mono text-xs text-[#201d1d] outline-none transition-colors shadow-xs"
            />
            {searchQuery && (
              <div className="absolute right-2.5 flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-[#888]">
                  [{filteredPosts.length}건]
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    setSearchQuery('');
                  }}
                  className="px-1.5 py-0.5 bg-[#eae5e5] hover:bg-[#d8d2d2] text-[#201d1d] text-[10px] font-mono font-bold rounded-xs cursor-pointer border-none"
                  title="Clear search"
                >
                  [✕]
                </button>
              </div>
            )}
          </div>

          {/* Sort & Hidden Posts Bar */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              {([
                { mode: 'hot' as CommunitySortMode, icon: Flame, label: 'Hot' },
                { mode: 'new' as CommunitySortMode, icon: Clock, label: 'New' },
                { mode: 'top' as CommunitySortMode, icon: ArrowUp, label: 'Top' },
                { mode: 'comments' as CommunitySortMode, icon: MessageSquare, label: 'Comments' },
              ]).map(({ mode, icon: IconComp, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                    setSortMode(mode);
                  }}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold transition-all cursor-pointer border touch-target',
                    sortMode === mode
                      ? 'bg-[#201d1d] text-white border-[#201d1d]'
                      : 'bg-[#fdfcfc] text-[#554f4f] border-[rgba(15,0,0,0.15)] hover:border-[#201d1d]'
                  )}
                >
                  <IconComp size={11} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeUser && posts.some(p => p.hiddenBy?.includes(activeUser.uid)) && (
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                    setShowHiddenPosts(!showHiddenPosts);
                  }}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-mono font-bold transition-all cursor-pointer border touch-target',
                    showHiddenPosts
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-[#fdfcfc] text-[#554f4f] border-[rgba(15,0,0,0.15)] hover:border-[#201d1d]'
                  )}
                >
                  <EyeOff size={11} />
                  <span>{showHiddenPosts ? '[Hidden]' : '[Show Hidden]'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 원터치 플레어(태그) 토글 칩 바 */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
            <span className="text-[10px] font-mono font-bold text-[#888] shrink-0">
              [TAG]:
            </span>
            <button
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                setSelectedFlairFilter('all');
              }}
              className={cn(
                'px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold transition-all cursor-pointer border touch-target shrink-0',
                selectedFlairFilter === 'all'
                  ? 'bg-[#201d1d] text-white border-[#201d1d]'
                  : 'bg-white text-[#666] border-[rgba(15,0,0,0.12)] hover:border-[#201d1d]'
              )}
            >
              [전체]
            </button>
            {getFlairsForCategory(selectedCategory).map((flair) => {
              const meta = FLAIR_META[flair];
              const isSelected = selectedFlairFilter === flair;
              return (
                <button
                  key={flair}
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                    setSelectedFlairFilter(isSelected ? 'all' : flair);
                  }}
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold transition-all cursor-pointer border touch-target shrink-0',
                    isSelected
                      ? 'bg-[#201d1d] text-white border-[#201d1d]'
                      : 'bg-white text-[#444] border-[rgba(15,0,0,0.12)] hover:border-[#201d1d]'
                  )}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Main Views router */}
      {selectedPost ? (
        // 3A. 자세히 보기 화면 (Semantic HTML5, DESIGN.md Monospace Flat)
        <article className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] rounded-none overflow-hidden flex flex-col text-[#201d1d] font-mono">
          {/* Header */}
          <header className="p-4 border-b border-[rgba(15,0,0,0.10)] flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  setSelectedPost(null);
                  const url = new URL(window.location.href);
                  url.searchParams.delete('postId');
                  window.history.replaceState({}, '', url.toString());
                }}
                className="p-1.5 border border-[rgba(15,0,0,0.15)] hover:border-[#201d1d] hover:bg-[#f5f2f2] rounded-sm transition-colors cursor-pointer text-[#201d1d] shrink-0 font-mono font-bold text-xs"
                title="Back"
              >
                [←]
              </button>
              <div className="relative">
                <img
                  src={formatAvatarUrl(selectedPost.userAvatar, selectedPost.userId)}
                  alt={selectedPost.userName}
                  className="w-10 h-10 border border-slate-150 rounded-full object-cover bg-white"
                />
                {(() => {
                  const petCardId = getLocalMonsterPetId(selectedPost.userId, selectedPost.userAvatar);
                  return petCardId ? (
                    <MonsterPetBadge
                      cardId={petCardId}
                      className="absolute -bottom-1 -right-1 z-10 border-emerald-200 bg-white px-1 py-1"
                      imageClassName="h-4 w-4"
                      label={t('monster_pet_badge', language)}
                    />
                  ) : null;
                })()}
              </div>
              <div>
                {(() => {
                  const identity = getProfileIdentityMeta(selectedPost.userEmoticonKey, selectedPost.userBadgeKey, selectedPost.userTitleKey);
                  return (
                    <>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-bold text-sm tracking-tight text-slate-800">
                          <HighlightText text={selectedPost.userName} query={searchQuery} />
                        </h4>
                        {identity.emoticon ? <span className="text-sm leading-none">{identity.emoticon.symbol}</span> : null}
                        {identity.badge ? (
                          <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                            {identity.badge.symbol} {t(identity.badge.labelKey, language)}
                          </span>
                        ) : null}
                      </div>
                      {identity.title ? (
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{t(identity.title.labelKey, language)}</p>
                      ) : null}
                    </>
                  );
                })()}
                <time className="text-[10px] text-slate-400 font-semibold block mt-0.5" dateTime={new Date(selectedPost.createdAt).toISOString()}>
                  {getRelativeTimeString(selectedPost.createdAt)}
                </time>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-650 px-2.5 py-1 rounded-md">
                {t(`community_cat_${selectedPost.category || 'free'}` as any, language)}
              </span>

              {/* Doc 62: Flair badge */}
              {renderFlairBadge(selectedPost.flair)}

              {selectedPost.isFromSheet && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                  📊 G-Sheet
                </span>
              )}

              {/* Doc 62: Pinned indicator */}
              {selectedPost.isPinned && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                  <Pin size={10} /> Pinned
                </span>
              )}

              {/* Doc 62: Weekly thread indicator */}
              {selectedPost.isWeeklyThread && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                  📅 Weekly
                </span>
              )}

              {/* Doc 62: Three-dot post menu (hide / report / pin) */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                    setPostMenuOpen(postMenuOpen === selectedPost.id ? null : selectedPost.id);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-slate-500 border-none"
                  title="Post menu"
                >
                  <MoreHorizontal size={16} />
                </button>
                {postMenuOpen === selectedPost.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-[11px] font-semibold">
                    {activeUser && (
                      <>
                        <button
                          onClick={(e) => {
                            const isHidden = selectedPost.hiddenBy?.includes(activeUser.uid);
                            handleHidePost(selectedPost.id, e);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-slate-700 border-none bg-transparent"
                        >
                          <EyeOff size={13} />
                          {selectedPost.hiddenBy?.includes(activeUser.uid) ? 'Unhide' : 'Hide'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPostMenuOpen(null);
                            setReportModal({
                              isOpen: true,
                              postId: selectedPost.id,
                              postTitle: selectedPost.content.substring(0, 50)
                            });
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-rose-50 cursor-pointer flex items-center gap-2 text-rose-600 border-none bg-transparent"
                        >
                          <Flag size={13} />
                          Report
                        </button>
                      </>
                    )}
                    {activeUser?.isAdmin && (
                      <button
                        onClick={(e) => handlePinPost(selectedPost.id, e)}
                        className="w-full text-left px-3 py-2 hover:bg-amber-50 cursor-pointer flex items-center gap-2 text-amber-700 border-none bg-transparent"
                      >
                        <Pin size={13} />
                        {selectedPost.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Delete Button (If author or admin) */}
              {activeUser && (selectedPost.userId === activeUser.uid || activeUser.isAdmin === true) && (
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    setCustomModal({
                      isOpen: true,
                      title: t('community_confirm', language),
                      message: t('community_delete_post_confirm', language),
                      type: 'confirm',
                      onConfirm: () => handleDeletePost(selectedPost.id)
                    });
                  }}
                  className="p-1.5 text-rose-500 hover:text-rose-650 hover:bg-rose-50/50 rounded-lg transition-colors cursor-pointer border-none"
                  title="Delete Post"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </header>

          {/* 뽐내기(boast) 카드 덱 표시 또는 캐러셀 다중 이미지 슬라이더 */}
          {selectedPost.category === 'boast' && selectedPost.deckData && selectedPost.deckData.length > 0 ? (
            <div className="border-b border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center gap-4">
              <div className="text-center">
                <span className="text-amber-300 font-bold tracking-wider uppercase text-[10px] bg-white/10 px-3 py-1 rounded-md">{t('community_cat_boast', language)}</span>
              </div>
              <div className="flex flex-wrap gap-3.5 justify-center items-center py-2 w-full">
                {selectedPost.deckData.map((card, idx) => (
                  <div key={card.id || idx} className="w-[100px] sm:w-[125px] aspect-[3/4] flex flex-col items-center gap-1 shadow-lg rounded-lg hover:scale-[1.02] transition-all">
                    <CardItem card={card} language={language} className="w-full h-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : selectedPost.videoUrl ? (
            <div className="border-b border-slate-100 bg-slate-950 flex flex-col items-center justify-center overflow-hidden max-h-[500px] relative">
              <video
                src={`${selectedPost.videoUrl}/DASH_480.mp4?source=fallback`}
                controls
                playsInline
                className="w-full h-auto max-h-[450px] object-contain"
                poster={selectedPost.imageUrls && selectedPost.imageUrls.length > 0 ? selectedPost.imageUrls[0] : (selectedPost.imageUrl || undefined)}
              />
              <div className="bg-slate-900 text-white w-full py-2 px-4 text-center text-[10px] font-bold border-t border-white/5 uppercase tracking-wider flex items-center justify-center gap-2">
                <span className="animate-pulse text-indigo-400">● Live Video</span>
                <a
                  href={selectedPost.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => openOriginalUrl(selectedPost.videoUrl!, event)}
                  className="text-slate-350 hover:text-white underline"
                >
                  Original Reddit link
                </a>
              </div>
            </div>
          ) : (
            ((selectedPost.imageUrls && selectedPost.imageUrls.length > 0) || selectedPost.imageUrl) && (
              <div className="border-b border-[rgba(15,0,0,0.12)] bg-[#121010] flex items-center justify-center overflow-hidden max-h-[520px] relative group/carousel font-mono">
                {/* 이미지 목록 */}
                {(() => {
                  const imgUrls = selectedPost.imageUrls || (selectedPost.imageUrl ? [selectedPost.imageUrl] : []);
                  const currentRawUrl = imgUrls[carouselIndex];
                  const currentUrl = normalizeImageUrl(currentRawUrl);
                  const isLoaded = imageLoadedMap[currentUrl];
                  const hasError = imageErrorMap[currentUrl];
                  
                  return (
                    <div className="w-full flex items-center justify-center relative min-h-[300px]">
                      {/* 스켈레톤 로딩 플레이스홀더 */}
                      {!isLoaded && !hasError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1818] animate-pulse text-[#888] text-xs font-mono">
                          <span className="mb-2">[LOADING IMAGE...]</span>
                          <span className="text-[10px] text-[#666]">{carouselIndex + 1} / {imgUrls.length}</span>
                        </div>
                      )}

                      {/* 이미지 로딩 에러 플레이스홀더 */}
                      {hasError ? (
                        <div className="p-8 text-center text-[#999] font-mono text-xs flex flex-col items-center gap-2">
                          <span className="text-xl">[!]</span>
                          <span>{language === 'ko' ? '이미지를 불러올 수 없습니다' : 'Failed to load image'}</span>
                        </div>
                      ) : (
                        <img
                          src={currentUrl}
                          alt={`Post content ${carouselIndex + 1}`}
                          className={cn(
                            "w-full h-auto max-h-[500px] object-contain transition-all duration-300 cursor-zoom-in",
                            !isLoaded && "opacity-0"
                          )}
                          loading="lazy"
                          onLoad={() => setImageLoadedMap((prev) => ({ ...prev, [currentUrl]: true }))}
                          onError={() => setImageErrorMap((prev) => ({ ...prev, [currentUrl]: true }))}
                          onClick={() => {
                            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                            setLightbox({
                              isOpen: true,
                              index: carouselIndex,
                              images: imgUrls.map(normalizeImageUrl),
                            });
                          }}
                        />
                      )}

                      {/* 상단 줌 안내 및 카운터 배지 */}
                      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                        <span className="bg-black/75 border border-white/20 text-white px-2 py-0.5 text-[9px] font-mono rounded-sm">
                          [ZOOM: 🔍 클릭하여 확대]
                        </span>
                        {imgUrls.length > 1 && (
                          <span className="bg-black/75 border border-white/20 text-white px-2 py-0.5 text-[9px] font-mono rounded-sm">
                            [{carouselIndex + 1} / {imgUrls.length}]
                          </span>
                        )}
                      </div>

                      {/* 좌우 화살표 */}
                      {imgUrls.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                              setCarouselIndex((prev) => (prev === 0 ? imgUrls.length - 1 : prev - 1));
                            }}
                            className="absolute left-3 p-2 bg-[#201d1d]/85 hover:bg-[#201d1d] text-white rounded-sm border border-white/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center font-mono font-bold text-xs touch-target"
                            title="Previous image"
                            aria-label="Previous image"
                          >
                            [&lt;]
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                              setCarouselIndex((prev) => (prev === imgUrls.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-3 p-2 bg-[#201d1d]/85 hover:bg-[#201d1d] text-white rounded-sm border border-white/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center font-mono font-bold text-xs touch-target"
                            title="Next image"
                            aria-label="Next image"
                          >
                            [&gt;]
                          </button>
                        </>
                      )}

                      {/* 슬라이드 도트 인디케이터 */}
                      {imgUrls.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/60 px-2 py-1 rounded-sm border border-white/10">
                          {imgUrls.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                                setCarouselIndex(dotIdx);
                              }}
                              className={cn(
                                "w-4 h-1 rounded-none transition-all cursor-pointer border-none",
                                carouselIndex === dotIdx ? "bg-white" : "bg-white/40 hover:bg-white/70"
                              )}
                              title={`Image ${dotIdx + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )
          )}

          {/* Content / Body */}
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {selectedPost.title && (
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  <HighlightText text={selectedPost.title} query={searchQuery} />
                </h3>
              )}
              <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap text-slate-700">
                <HighlightText
                  text={
                    translatedContents[selectedPost.id] && !translatedContents[selectedPost.id].isOriginal
                      ? translatedContents[selectedPost.id].translated
                      : selectedPost.content
                  }
                  query={searchQuery}
                />
              </p>
              
              {/* Translation Button */}
              <div className="flex flex-wrap justify-start gap-2">
                <button
                  onClick={() => handleTranslate(selectedPost.id, selectedPost.content)}
                  disabled={translatedContents[selectedPost.id]?.isLoading}
                  className={cn(
                    "flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 border border-slate-200/80 rounded-lg bg-slate-50 hover:bg-slate-100/80 active:scale-98 transition-all disabled:opacity-50 cursor-pointer text-slate-550 shadow-xs",
                    translatedContents[selectedPost.id] && !translatedContents[selectedPost.id].isOriginal && "bg-indigo-50 text-indigo-750 border-indigo-150/50"
                  )}
                >
                  {translatedContents[selectedPost.id]?.isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      <span>{t('community_translating', language)}</span>
                    </>
                  ) : translatedContents[selectedPost.id] && !translatedContents[selectedPost.id].isOriginal ? (
                    <>
                      <Globe size={11} />
                      <span>{t('community_show_original', language)}</span>
                    </>
                  ) : (
                    <>
                      <Languages size={11} />
                      <span>{t('community_translate', language)}</span>
                    </>
                  )}
                </button>
                {getOriginalUrl(selectedPost) && (
                  <button
                    onClick={(event) => openOriginalUrl(getOriginalUrl(selectedPost)!, event)}
                    className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 border border-slate-200/80 rounded-lg bg-white hover:bg-slate-50 active:scale-98 transition-all cursor-pointer text-slate-650 shadow-xs"
                  >
                    <ExternalLink size={11} />
                    <span>{t('community_open_original', language)}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Actions (Like / Comment count / Share) */}
            <div className="flex items-center gap-3.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleLikeToggle(selectedPost.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 border border-slate-200/80 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-98",
                  activeUser && selectedPost.likes.includes(activeUser.uid) ? "bg-rose-600 hover:bg-rose-700 text-white border-none shadow-md shadow-rose-200/30" : "bg-white hover:bg-slate-50 text-slate-700"
                )}
              >
                <Heart size={15} fill={activeUser && selectedPost.likes.includes(activeUser.uid) ? "currentColor" : "none"} />
                <span>{selectedPost.likes.length}</span>
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200/85 rounded-lg font-bold text-xs bg-slate-50 text-slate-600">
                <MessageCircle size={15} />
                <span>{selectedPost.comments.length}</span>
              </div>

              <button
                onClick={async () => {
                  playCustomSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  triggerHaptic('success');
                  const result = await shareCommunityPost(selectedPost, () => {
                    showShareToastMessage(t('link_copied_desc', language));
                  });
                  if (result.success && result.method === 'clipboard') {
                    showShareToastMessage(t('link_copied_desc', language));
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200/80 rounded-lg font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer ml-auto hover:shadow-sm active:scale-98 transition-all touch-target"
                title="Share Post Link"
              >
                <Share2 size={15} />
                <span>{t('share', language)}</span>
              </button>
            </div>

            {/* 대결하기 버튼 (본인 글 제외 및 PVP 대전 카테고리 한정) */}
            {activeUser && selectedPost.userId !== activeUser.uid && selectedPost.category === 'pvp' && (
              <div className="pt-3 border-t border-slate-100 flex">
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    setCustomModal({
                      isOpen: true,
                      title: t('pvp_challenge_title', language),
                      message: t('pvp_challenge_desc', language).replace('{username}', selectedPost.userName),
                      type: 'confirm',
                      onConfirm: () => {
                        localStorage.setItem('hero_community_pvp_post_id', selectedPost.id);
                        onAttack?.(selectedPost.userId, selectedPost.userName);
                      }
                    });
                  }}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wider text-xs rounded-lg flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer shadow-sm border-none"
                >
                  <Swords size={14} />
                  {t('pvp_challenge_btn', language)}
                </button>
              </div>
            )}
          </div>

          {/* [Round 5] Comments and Nested Comments (Replies) Section - Monospace Flat Styling */}
          <footer className="border-t border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] flex flex-col font-mono">
            <div className="p-3.5 border-b border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-tight text-[#201d1d]">
                  [COMMENTS: {selectedPost.comments.length}]
                </span>
              </div>
              {selectedPost.comments.some(c => c.replies && c.replies.length > 0) && (
                <button
                  onClick={handleToggleAllReplies}
                  className="px-2.5 py-1 text-[10px] font-bold font-mono text-[#201d1d] hover:bg-[#eae8e8] border border-[rgba(15,0,0,0.15)] rounded-sm active:scale-95 transition-all cursor-pointer"
                >
                  {allRepliesExpanded
                    ? (language === 'ko' ? '[▲ 전체 대댓글 접기]' : '[▲ Collapse All]')
                    : (language === 'ko' ? '[▼ 전체 대댓글 펼치기]' : '[▼ Expand All]')}
                </button>
              )}
            </div>

            {/* Comments List */}
            {selectedPost.comments.length > 0 ? (
              <div className="p-3.5 flex flex-col gap-3.5 max-h-[420px] overflow-y-auto border-b border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] custom-scrollbar">
                {selectedPost.comments.map((comment) => {
                  const isCommentOwner = activeUser && (comment.userId === activeUser.uid || activeUser.isAdmin);
                  return (
                    <div key={comment.id} className="flex flex-col gap-2">
                      {/* 부모 댓글 */}
                      <div className="flex gap-2.5 items-start text-xs">
                        <img
                          src={formatAvatarUrl(comment.userAvatar, comment.userId)}
                          alt={comment.userName}
                          className="w-7 h-7 border border-[rgba(15,0,0,0.12)] rounded-full object-cover shrink-0 bg-white"
                        />
                        <div className="bg-[#f8f7f7] p-3 rounded-none border border-[rgba(15,0,0,0.12)] flex-1 relative text-[#201d1d]">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <div className="min-w-0">
                              {(() => {
                                const identity = getProfileIdentityMeta(comment.userEmoticonKey, comment.userBadgeKey, comment.userTitleKey);
                                return (
                                  <>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-bold tracking-tight text-[#201d1d]">{comment.userName}</span>
                                      {identity.emoticon ? <span className="text-xs leading-none">{identity.emoticon.symbol}</span> : null}
                                      {identity.badge ? (
                                        <span className="rounded-sm border border-amber-300 bg-amber-50 px-1 py-0.5 text-[8px] font-bold text-amber-800">
                                          {identity.badge.symbol}
                                        </span>
                                      ) : null}
                                    </div>
                                    {identity.title ? (
                                      <p className="mt-0.5 text-[8px] font-semibold text-[#666060]">{t(identity.title.labelKey, language)}</p>
                                    ) : null}
                                  </>
                                );
                              })()}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] text-[#888282] font-semibold">
                                {getRelativeTimeString(comment.createdAt)}
                              </span>
                              {isCommentOwner && (
                                <button
                                  onClick={() => handleDeleteComment(selectedPost.id, comment.id)}
                                  className="text-[9px] text-rose-600 hover:text-rose-800 font-bold px-1 py-0.5 border border-rose-200 hover:bg-rose-50 rounded-sm cursor-pointer transition-all"
                                  title="Delete Comment"
                                >
                                  [✕]
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="font-semibold leading-relaxed whitespace-pre-wrap text-xs text-[#332e2e]">
                            {translatedContents[comment.id] && !translatedContents[comment.id].isOriginal
                              ? translatedContents[comment.id].translated
                              : comment.content}
                          </p>
                          
                          {/* 액션 버튼 바 (답글 달기, 번역, 대댓글 개수 토글) */}
                          <div className="flex flex-wrap gap-2.5 mt-2.5 pt-2 border-t border-[rgba(15,0,0,0.08)] items-center">
                            <button
                              onClick={() => {
                                playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                                const nextBox = activeReplyBox === comment.id ? null : comment.id;
                                setActiveReplyBox(nextBox);
                                if (nextBox && !replyInputs[comment.id]) {
                                  setReplyInputs(prev => ({ ...prev, [comment.id]: `@${comment.userName} ` }));
                                }
                              }}
                              className="text-[10px] font-bold font-mono text-[#201d1d] hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <CornerDownRight size={11} />
                              {t('community_comment_reply', language)}
                            </button>
                            <button
                              onClick={() => handleTranslate(comment.id, comment.content)}
                              disabled={translatedContents[comment.id]?.isLoading}
                              className={cn(
                                "text-[9px] font-bold font-mono ml-auto flex items-center gap-1 cursor-pointer px-1.5 py-0.5 border border-[rgba(15,0,0,0.12)] rounded-sm bg-white",
                                translatedContents[comment.id] && !translatedContents[comment.id].isOriginal ? "text-indigo-700 bg-indigo-50" : "text-[#666060] hover:text-[#201d1d]"
                              )}
                            >
                              <Languages size={10} />
                              {translatedContents[comment.id]?.isLoading ? '...' : translatedContents[comment.id] && !translatedContents[comment.id].isOriginal ? 'ORIGINAL' : 'A'}
                            </button>

                            {/* 대댓글 갯수 토글 아코디언 */}
                            {comment.replies && comment.replies.length > 0 && (
                              <button
                                onClick={() => {
                                  playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                                  setOpenReplies(prev => ({ ...prev, [comment.id]: !prev[comment.id] }));
                                }}
                                className="text-[10px] font-bold font-mono px-2 py-0.5 border border-[rgba(15,0,0,0.15)] rounded-sm bg-white hover:bg-[#eae8e8] text-[#201d1d] cursor-pointer"
                              >
                                {openReplies[comment.id] ? '▲' : '▼'} {comment.replies.length} {language === 'ko' ? '답글' : 'Replies'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 대댓글 리스트 (들여쓰기 적용) */}
                      {comment.replies && comment.replies.length > 0 && openReplies[comment.id] && (
                        <div className="pl-6 ml-3.5 flex flex-col gap-2 border-l-2 border-[#201d1d]/30 mt-1">
                          {comment.replies.map((reply) => {
                            const isReplyOwner = activeUser && (reply.userId === activeUser.uid || activeUser.isAdmin);
                            return (
                              <div key={reply.id} className="flex gap-2 items-start text-[11px]">
                                <img
                                  src={formatAvatarUrl(reply.userAvatar, reply.userId)}
                                  alt={reply.userName}
                                  className="w-5 h-5 border border-[rgba(15,0,0,0.12)] rounded-full object-cover shrink-0 bg-white"
                                />
                                <div className="bg-[#f0eeee] p-2 rounded-none border border-[rgba(15,0,0,0.1)] flex-1 text-[#201d1d]">
                                  <div className="flex justify-between items-start gap-2 mb-0.5">
                                    <div className="min-w-0">
                                      {(() => {
                                        const identity = getProfileIdentityMeta(reply.userEmoticonKey, reply.userBadgeKey, reply.userTitleKey);
                                        return (
                                          <>
                                            <div className="flex flex-wrap items-center gap-1">
                                              <span className="font-bold tracking-tight text-[#201d1d]">{reply.userName}</span>
                                              {identity.emoticon ? <span className="text-[10px] leading-none">{identity.emoticon.symbol}</span> : null}
                                              {identity.badge ? (
                                                <span className="rounded-sm border border-amber-300 bg-amber-50 px-1 py-0.2 text-[7px] font-bold text-amber-800">
                                                  {identity.badge.symbol}
                                                </span>
                                              ) : null}
                                            </div>
                                            {identity.title ? (
                                              <p className="mt-0.5 text-[8px] font-semibold text-[#666060]">{t(identity.title.labelKey, language)}</p>
                                            ) : null}
                                          </>
                                        );
                                      })()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[8px] text-[#888282] font-semibold">
                                        {getRelativeTimeString(reply.createdAt)}
                                      </span>
                                      {isReplyOwner && (
                                        <button
                                          onClick={() => handleDeleteReply(selectedPost.id, comment.id, reply.id)}
                                          className="text-[8px] text-rose-600 hover:text-rose-800 font-bold px-1 py-0.2 border border-rose-200 hover:bg-rose-50 rounded-sm cursor-pointer transition-all"
                                          title="Delete Reply"
                                        >
                                          [✕]
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="font-semibold leading-relaxed whitespace-pre-wrap text-xs text-[#332e2e]">{reply.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 대댓글 작성 박스 */}
                      {activeReplyBox === comment.id && (
                        <div className="pl-6 ml-3.5 mt-1 flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder={t('community_comment_reply_placeholder', language)}
                            value={replyInputs[comment.id] || ''}
                            onChange={(e) =>
                              setReplyInputs((prev) => ({
                                ...prev,
                                [comment.id]: e.target.value
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddReply(selectedPost.id, comment.id);
                            }}
                            className="flex-1 p-2 bg-white border border-[rgba(15,0,0,0.18)] focus:border-[#201d1d] rounded-sm font-mono font-semibold text-xs focus:outline-none transition-all"
                          />
                          <button
                            onClick={() => handleAddReply(selectedPost.id, comment.id)}
                            disabled={!(replyInputs[comment.id] || '').trim()}
                            className="px-3 py-2 bg-[#201d1d] hover:bg-[#3d3838] text-white transition-all rounded-sm disabled:opacity-30 shrink-0 cursor-pointer text-xs font-mono font-bold active:scale-95 border-none flex items-center justify-center gap-1"
                          >
                            <Send size={11} />
                            <span>{language === 'ko' ? '등록' : 'Reply'}</span>
                          </button>
                          <button
                            onClick={() => setActiveReplyBox(null)}
                            className="p-2 text-[#666060] hover:text-[#201d1d] border border-[rgba(15,0,0,0.15)] rounded-sm hover:bg-[#eae8e8] text-xs font-mono cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs font-bold text-[#888282] border-b border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]">
                {t('no_comments_yet', language)}
              </div>
            )}

            {/* [Round 5] 댓글 작성 도구 바: 이모지 픽커 & 멘션(@) 원터치 칩 */}
            <div className="px-3.5 pt-2.5 bg-[#f8f7f7] border-t border-[rgba(15,0,0,0.08)] flex flex-col gap-2">
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 border text-[10px] font-bold font-mono rounded-sm cursor-pointer transition-all active:scale-95 shrink-0",
                    showEmojiPicker
                      ? "bg-[#201d1d] text-white border-[#201d1d]"
                      : "bg-white text-[#201d1d] border-[rgba(15,0,0,0.15)] hover:bg-[#eae8e8]"
                  )}
                >
                  <Smile size={11} />
                  <span>{language === 'ko' ? '이모티콘' : 'Emoji'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMentionPicker(!showMentionPicker)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 border text-[10px] font-bold font-mono rounded-sm cursor-pointer transition-all active:scale-95 shrink-0",
                    showMentionPicker
                      ? "bg-[#201d1d] text-white border-[#201d1d]"
                      : "bg-white text-[#201d1d] border-[rgba(15,0,0,0.15)] hover:bg-[#eae8e8]"
                  )}
                >
                  <AtSign size={11} />
                  <span>{language === 'ko' ? '멘션' : 'Mention'}</span>
                </button>

                {/* 포스트 작성자 빠른 멘션 칩 */}
                <button
                  type="button"
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                    setCommentInput(prev => `${prev.trim()} @${selectedPost.userName} `.trimStart());
                  }}
                  className="px-2 py-1 bg-white hover:bg-[#eae8e8] border border-[rgba(15,0,0,0.15)] rounded-sm text-[10px] font-bold font-mono text-[#201d1d] cursor-pointer shrink-0 active:scale-95 transition-all"
                >
                  @{selectedPost.userName}
                </button>
              </div>

              {/* 빠른 이모티콘 선택 칩 트레이 */}
              {showEmojiPicker && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white border border-[rgba(15,0,0,0.12)] rounded-sm">
                  {['👍', '🔥', '❤️', '🎉', '😂', '🎴', '⚡', '👏', '🏆', '💎'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                        setCommentInput(prev => prev + emoji);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-sm border border-[rgba(15,0,0,0.1)] rounded-sm bg-[#fdfcfc] hover:bg-[#eae8e8] cursor-pointer active:scale-90 transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* 빠른 멘션 대상 칩 트레이 */}
              {showMentionPicker && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white border border-[rgba(15,0,0,0.12)] rounded-sm">
                  {Array.from(new Set([selectedPost.userName, ...selectedPost.comments.map(c => c.userName)])).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                        setCommentInput(prev => `${prev.trim()} @${name} `.trimStart());
                        setShowMentionPicker(false);
                      }}
                      className="px-2 py-1 bg-[#fdfcfc] hover:bg-[#eae8e8] border border-[rgba(15,0,0,0.12)] rounded-sm text-[10px] font-bold font-mono text-[#201d1d] cursor-pointer active:scale-95 transition-all"
                    >
                      @{name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 댓글 작성 창 */}
            <div className="p-3.5 bg-[#f8f7f7] flex items-center gap-2">
              <div className="relative shrink-0">
                <img
                  src={formatAvatarUrl(activeUser.photoURL || '', activeUser.uid)}
                  alt="Me"
                  className="w-7 h-7 border border-[rgba(15,0,0,0.12)] rounded-full object-cover shrink-0 bg-white"
                />
                {activeUser ? (() => {
                  const petCardId = getLocalMonsterPetId(activeUser.uid, activeUser.photoURL || '');
                  return petCardId ? (
                    <MonsterPetBadge
                      cardId={petCardId}
                      className="absolute -bottom-1 -right-1 z-10 border-emerald-300 bg-white px-0.5 py-0.5"
                      imageClassName="h-3.5 w-3.5"
                      label={t('monster_pet_badge', language)}
                    />
                  ) : null;
                })() : null}
              </div>
              <div className="flex-1 flex gap-2 border border-[rgba(15,0,0,0.18)] rounded-sm overflow-hidden px-3 py-2 bg-white focus-within:border-[#201d1d] transition-all items-center">
                <input
                  type="text"
                  placeholder={t('community_add_comment', language)}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment(selectedPost.id);
                  }}
                  className="bg-transparent focus:outline-none flex-1 font-mono font-semibold text-xs text-[#201d1d]"
                />
                <button
                  onClick={() => handleAddComment(selectedPost.id)}
                  disabled={!commentInput.trim()}
                  className="px-3 py-1 bg-[#201d1d] text-white hover:bg-[#3d3838] disabled:opacity-30 transition-all shrink-0 cursor-pointer rounded-sm text-xs font-mono font-bold flex items-center gap-1 active:scale-95"
                >
                  <Send size={11} />
                  <span>{language === 'ko' ? '작성' : 'Post'}</span>
                </button>
              </div>
            </div>
          </footer>
        </article>
      ) : selectedCategory === 'select' ? (
        // 3B. 커뮤니티 카테고리 선택 대시보드
        <div className="flex flex-col gap-3 sm:gap-6" id="community-dashboard">
          <div className="border border-indigo-100 p-3 sm:p-5 bg-indigo-50/30 rounded-2xl shadow-sm">
            <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-indigo-905">
              💡 {t('community_category_select', language)}
            </h4>
            <p className="text-[10px] sm:text-xs font-semibold text-indigo-755 leading-relaxed line-clamp-2">
              {t('community_category_select_desc', language)}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 md:gap-6 items-stretch">
            {(() => {
              const categoriesList = [
                {
                  id: 'news' as CommunityCategory,
                  title: t('community_cat_news', language),
                  desc: t('community_cat_news_desc', language),
                  icon: Globe,
                  color: 'from-slate-500 to-slate-650',
                  badge: 'NEWS',
                  badgeColor: 'bg-slate-100 text-slate-500 font-bold',
                  colSpan: ''
                },
                {
                  id: 'free' as CommunityCategory,
                  title: t('community_cat_free', language),
                  desc: t('community_cat_free_desc', language),
                  icon: MessageCircle,
                  color: 'from-amber-400 to-orange-500',
                  badge: 'TALK',
                  badgeColor: 'bg-amber-500 text-white font-bold animate-pulse',
                  colSpan: ''
                },
                {
                  id: 'qa' as CommunityCategory,
                  title: t('community_cat_qa', language),
                  desc: t('community_cat_qa_desc', language),
                  icon: HelpCircle,
                  color: 'from-blue-400 to-indigo-500',
                  badge: 'Q&A',
                  badgeColor: 'bg-indigo-600 text-white font-bold',
                  colSpan: ''
                },
                {
                  id: 'tip' as CommunityCategory,
                  title: t('community_cat_tip', language),
                  desc: t('community_cat_tip_desc', language),
                  icon: Sparkles,
                  color: 'from-emerald-450 to-teal-500',
                  badge: 'TIP',
                  badgeColor: 'bg-emerald-500 text-white font-bold animate-bounce',
                  colSpan: ''
                },
                {
                  id: 'boast' as CommunityCategory,
                  title: t('community_cat_boast', language),
                  desc: t('community_cat_boast_desc', language),
                  icon: Trophy,
                  color: 'from-pink-500 to-rose-500',
                  badge: 'DECK',
                  badgeColor: 'bg-rose-500 text-white font-bold animate-pulse',
                  colSpan: ''
                },
                {
                  id: 'running' as CommunityCategory,
                  title: t('community_cat_running', language),
                  desc: t('community_cat_running_desc', language),
                  icon: Navigation,
                  color: 'from-violet-500 to-purple-600',
                  badge: 'GPS',
                  badgeColor: 'bg-purple-600 text-white font-bold',
                  colSpan: ''
                },
                {
                  id: 'guild' as CommunityCategory,
                  title: t('community_cat_guild', language),
                  desc: t('community_cat_guild_desc', language),
                  icon: Shield,
                  color: 'from-indigo-500 to-blue-600',
                  badge: 'GUILD',
                  badgeColor: 'bg-blue-600 text-white font-bold',
                  colSpan: ''
                },
                {
                  id: 'pvp' as CommunityCategory,
                  title: t('community_cat_pvp', language),
                  desc: t('community_cat_pvp_desc', language),
                  icon: Swords,
                  color: 'from-rose-500 to-red-600',
                  badge: 'PVP',
                  badgeColor: 'bg-rose-500 text-white font-bold animate-pulse',
                  colSpan: ''
                },
                {
                  id: 'fanart' as CommunityCategory,
                  title: t('community_cat_fanart', language),
                  desc: t('fan_event_fanart_desc', language),
                  icon: Palette,
                  color: 'from-fuchsia-500 to-purple-600',
                  badge: 'ART',
                  badgeColor: 'bg-fuchsia-500 text-white font-bold',
                  colSpan: ''
                },
                {
                  id: 'vote' as CommunityCategory,
                  title: t('community_cat_vote', language),
                  desc: t('fan_event_vote_desc', language),
                  icon: Vote,
                  color: 'from-rose-500 to-orange-500',
                  badge: 'VOTE',
                  badgeColor: 'bg-rose-500 text-white font-bold',
                  colSpan: ''
                },
                {
                  id: 'webtoon' as CommunityCategory,
                  title: t('community_cat_webtoon', language),
                  desc: t('fan_event_webtoon_desc', language),
                  icon: BookOpenCheck,
                  color: 'from-amber-500 to-yellow-500',
                  badge: 'CUT',
                  badgeColor: 'bg-amber-500 text-white font-bold',
                  colSpan: ''
                },
                {
                  id: 'season' as CommunityCategory,
                  title: t('community_cat_season', language),
                  desc: t('fan_event_deck_desc', language),
                  icon: Tag,
                  color: 'from-emerald-500 to-teal-600',
                  badge: 'EVENT',
                  badgeColor: 'bg-emerald-500 text-white font-bold',
                  colSpan: ''
                }
              ];

              return categoriesList.map((cat, idx) => {
                const IconComp = cat.icon;
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className={cn(
                      "border border-slate-200/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md sm:shadow-xl hover:shadow-2xl transition-all flex flex-col bg-white",
                      cat.colSpan
                    )}
                  >
                    {/* Card top accent */}
                    <div className={cn('h-1 sm:h-1.5 bg-gradient-to-r', cat.color)} />

                    <div className="p-3 sm:p-4 md:p-6 flex flex-col flex-1 justify-between">
                      {/* Content Area */}
                      <div className="flex-1 flex flex-col mb-2.5 sm:mb-4">
                        {/* Icon + Badge */}
                        <div className="flex items-start justify-between mb-2.5 sm:mb-4">
                          <div className={cn(
                            'w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md shadow-indigo-100/50',
                            `bg-gradient-to-br ${cat.color}`
                          )}>
                            <IconComp size={18} className="text-white sm:w-[22px] sm:h-[22px]" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              'text-[8px] md:text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs',
                              cat.badgeColor
                            )}>
                              {cat.badge}
                            </span>
                            {(() => {
                              const postCount = posts.filter(p => (p.category || 'free') === cat.id).length;
                              return postCount > 0 ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  {postCount}
                                </span>
                              ) : null;
                            })()}
                          </div>
                        </div>

                        {/* Text */}
                        <h3 className="font-extrabold text-sm md:text-base tracking-tight text-slate-800 mb-1.5 sm:mb-2 font-sans">
                          {cat.title}
                        </h3>
                        <p className="text-[10px] md:text-[11px] text-slate-450 font-semibold leading-relaxed font-sans line-clamp-1 sm:line-clamp-none">
                          {cat.desc}
                        </p>
                      </div>

                      {/* Action button */}
                      <button
                        onClick={() => {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          setSelectedCategory(cat.id);
                          window.history.pushState({}, '', `?view=community&category=${cat.id}`);
                        }}
                        className={cn(
                          'w-full min-h-11 px-4 py-3 font-extrabold uppercase text-[10px] md:text-[11px] tracking-wider rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-1.5 mt-auto shadow-sm cursor-pointer text-white touch-target',
                          `bg-gradient-to-r ${cat.color} hover:opacity-95 shadow-lg shadow-indigo-200/40`
                        )}
                      >
                        <Plus size={12} className="shrink-0 fill-current" />
                        <span className="min-w-0 truncate">{t('enter_board', language)}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      ) : (
        // 3C. 미리보기 요약 리스트
        <div className="flex flex-col gap-6">
          {/* 카테고리 정보 및 글쓰기 액션 바 (DESIGN.md Monospace Flat) */}
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                setUploadCategory(selectedCategory);
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-[#201d1d] hover:bg-[#383333] text-white px-3.5 py-2 rounded-sm border border-[#201d1d] transition-all active:scale-95 cursor-pointer touch-target"
            >
              <span className="font-mono text-sm">[+]</span>
              <span>{language === 'ko' ? '게시판 글쓰기' : 'Write Post'}</span>
            </button>
            <span className="text-xs font-mono font-bold tracking-tight bg-white text-[#201d1d] px-3.5 py-2 rounded-none border border-[rgba(15,0,0,0.15)]">
              [{t(`community_cat_${selectedCategory}` as any, language)}]
            </span>
          </div>

          {/* Grid Preview List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 border border-[rgba(15,0,0,0.10)] bg-white rounded-none">
              <div className="w-8 h-8 border-2 border-[#201d1d] border-t-transparent rounded-full animate-spin" />
              <span className="font-mono font-bold text-xs text-[#666060] tracking-wider">[LOADING POSTS...]</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="border border-[rgba(15,0,0,0.12)] bg-white p-10 text-center rounded-none font-mono flex flex-col items-center justify-center gap-2.5">
              <span className="text-3xl block font-mono">[Ø]</span>
              <p className="font-bold text-sm text-[#504a4a]">
                {searchQuery.trim()
                  ? language === 'ko'
                    ? `[ "${searchQuery}" 검색 결과가 없습니다 ]`
                    : `[ No results found for "${searchQuery}" ]`
                  : selectedFlairFilter !== 'all'
                  ? language === 'ko'
                    ? `[ "${FLAIR_META[selectedFlairFilter]?.label}" 태그 글이 없습니다 ]`
                    : `[ No posts found for tag "${FLAIR_META[selectedFlairFilter]?.label}" ]`
                  : t('community_empty', language)}
              </p>
              {(searchQuery || selectedFlairFilter !== 'all') && (
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    setSearchQuery('');
                    setSelectedFlairFilter('all');
                  }}
                  className="mt-2 px-3 py-1.5 bg-[#201d1d] hover:bg-[#3d3838] text-white text-xs font-mono font-bold rounded-sm border border-[#201d1d] cursor-pointer touch-target active:scale-95 transition-all"
                >
                  {language === 'ko' ? '[검색/필터 초기화]' : '[Reset Filters]'}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredPosts.slice(0, visiblePostsCount).map((post) => {
                const imgUrls = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
                const hasLiked = activeUser && post.likes.includes(activeUser.uid);
                
                return (
                  <div
                    key={post.id}
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      setCarouselIndex(0);
                      setSelectedPost(post);
                      window.history.pushState({}, '', `?view=community&postId=${post.id}`);
                    }}
                    className="border border-[rgba(15,0,0,0.12)] bg-white rounded-none overflow-hidden transition-all flex flex-col cursor-pointer hover:border-[#201d1d] font-mono"
                  >
                    {/* 뽐내기(boast) 카드 덱 표시 또는 썸네일 이미지 */}
                    {post.category === 'boast' && post.deckData && post.deckData.length > 0 ? (
                      <div className="border-b border-slate-100 bg-slate-950 aspect-video p-3 flex items-center justify-center gap-1.5 overflow-hidden">
                        {post.deckData.map((card, idx) => (
                          <div key={card.id || idx} className="w-[18%] max-w-[55px] aspect-[3/4] flex items-center justify-center scale-95 shadow-sm rounded">
                            <CardItem card={card} language={language} className="w-full h-full pointer-events-none" />
                          </div>
                        ))}
                      </div>
                    ) : post.videoUrl ? (
                      <div className="border-b border-[rgba(15,0,0,0.12)] bg-[#151313] aspect-video relative flex items-center justify-center overflow-hidden">
                        {imgUrls.length > 0 && (
                          <img
                            src={imgUrls[0]}
                            alt="video thumb"
                            className="w-full h-full object-contain opacity-80"
                            loading="lazy"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="px-3 py-1.5 bg-[#201d1d] text-white rounded-sm border border-white/20 active:scale-95 transition-all text-xs font-mono font-bold">
                            [▶ VIDEO PLAY]
                          </span>
                        </div>
                        <div className="absolute top-2 right-2 bg-[#201d1d] px-2 py-0.5 rounded-sm text-[8px] font-mono font-bold text-white border border-white/20 uppercase tracking-widest">
                          [VIDEO]
                        </div>
                      </div>
                    ) : (
                      imgUrls.length > 0 && (
                        <div className="border-b border-[rgba(15,0,0,0.12)] bg-[#151313] aspect-video relative flex items-center justify-center overflow-hidden">
                          <img
                            src={normalizeImageUrl(imgUrls[0])}
                            alt="post thumb"
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget.parentElement as HTMLElement)?.classList.add('hidden');
                            }}
                          />
                          {imgUrls.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded-sm text-[8px] font-mono font-bold text-white border border-white/20">
                              [+{imgUrls.length - 1} IMGS]
                            </div>
                          )}
                        </div>
                      )
                    )}

                    {/* Author & Time */}
                    <div className="p-3 border-b border-slate-100/50 bg-slate-50/50 flex items-center gap-2">
                      <div className="relative">
                      <img
                        src={formatAvatarUrl(post.userAvatar, post.userId)}
                        alt={post.userName}
                        className="w-6 h-6 border border-slate-100 rounded-full object-cover bg-white"
                      />
                      {(() => {
                        const petCardId = getLocalMonsterPetId(post.userId, post.userAvatar);
                        return petCardId ? (
                          <MonsterPetBadge
                            cardId={petCardId}
                            className="absolute -bottom-1 -right-1 z-10 border-emerald-200 bg-white px-0.5 py-0.5"
                            imageClassName="h-3.5 w-3.5"
                            label={t('monster_pet_badge', language)}
                          />
                        ) : null;
                      })()}
                    </div>
                      <div className="min-w-0 flex-1">
                        {(() => {
                          const identity = getProfileIdentityMeta(post.userEmoticonKey, post.userBadgeKey, post.userTitleKey);
                          return (
                            <>
                              <div className="flex flex-wrap items-center gap-1">
                                <h5 className="font-bold text-[10px] text-slate-800 truncate leading-none mb-0.5">
                                  <HighlightText text={post.userName} query={searchQuery} />
                                </h5>
                                {identity.emoticon ? <span className="text-[10px] leading-none">{identity.emoticon.symbol}</span> : null}
                                {identity.badge ? (
                                  <span className="rounded-full border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[7px] font-bold text-amber-700">
                                    {identity.badge.symbol}
                                  </span>
                                ) : null}
                              </div>
                              {identity.title ? (
                                <span className="text-[8px] text-slate-500 font-semibold block mt-0.5">{t(identity.title.labelKey, language)}</span>
                              ) : null}
                            </>
                          );
                        })()}
                        <span className="text-[8px] text-slate-400 font-semibold block">{getRelativeTimeString(post.createdAt)}</span>
                      </div>
                    </div>

                    {/* Doc 62: Flair + Pinned/Weekly indicators in grid */}
                    <div className="px-3 pb-1 flex flex-wrap items-center gap-1.5">
                      {renderFlairBadge(post.flair)}
                      {post.isFromSheet && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 text-[8px] font-bold">
                          📊 G-Sheet
                        </span>
                      )}
                      {post.isPinned && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200 text-[8px] font-bold">
                          <Pin size={9} /> Pinned
                        </span>
                      )}
                      {post.isWeeklyThread && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 text-[8px] font-bold">
                          📅 Weekly
                        </span>
                      )}
                    </div>

                      <div className="flex-1 flex flex-col justify-between gap-1.5">
                        <div>
                          {post.title && (
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                              <HighlightText text={post.title} query={searchQuery} />
                            </h4>
                          )}
                          <p className="text-xs font-semibold leading-relaxed line-clamp-3 text-slate-550 whitespace-pre-wrap">
                            <HighlightText
                              text={
                                translatedContents[post.id] && !translatedContents[post.id].isOriginal
                                  ? translatedContents[post.id].translated
                                  : post.content
                              }
                              query={searchQuery}
                            />
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {translatedContents[post.id] && !translatedContents[post.id].isOriginal && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTranslate(post.id, post.content);
                                }}
                                className="text-[9px] font-bold text-indigo-650 hover:text-indigo-850 cursor-pointer border-none bg-transparent p-0"
                              >
                                {t('community_show_original', language)}
                              </button>
                            )}
                            {getOriginalUrl(post) && (
                              <button
                                onClick={(event) => openOriginalUrl(getOriginalUrl(post)!, event)}
                                className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer border-none bg-transparent p-0"
                              >
                                <ExternalLink size={10} />
                                {t('community_open_original', language)}
                              </button>
                            )}
                          </div>
                        </div>

                      {/* Footer 배지 (DESIGN.md Flat Hairline) */}
                      <div className="flex gap-2 items-center justify-between text-[10px] font-mono font-bold mt-1 w-full">
                        <div className="flex gap-2 items-center">
                          <span className={cn(
                            "flex items-center gap-1 px-2.5 py-1 border border-[rgba(15,0,0,0.12)] rounded-sm bg-white text-[#504a4a]",
                            hasLiked && "bg-rose-50 text-rose-700 border-rose-300"
                          )}>
                            <Heart size={12} fill={hasLiked ? "currentColor" : "none"} /> {post.likes.length}
                          </span>
                          <span className="flex items-center gap-1 px-2.5 py-1 border border-[rgba(15,0,0,0.12)] rounded-sm bg-white text-[#504a4a]">
                            <MessageCircle size={12} /> {post.comments.length}
                          </span>
                        </div>

                        {post.category === 'pvp' && activeUser && post.userId !== activeUser.uid && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                              setCustomModal({
                                isOpen: true,
                                title: t('confirm_pvp_attack', language),
                                message: t('pvp_attack_confirm_desc', language).replace('{username}', post.userName),
                                type: 'confirm',
                                onConfirm: () => {
                                  onAttack?.(post.userId, post.userName);
                                }
                              });
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-sm text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border border-red-700 active:scale-95 transition-all cursor-pointer z-10 touch-target"
                          >
                            [⚔️ ATTACK]
                          </button>
                        )}

                        {/* Doc 62: Three-dot menu for grid cards */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                              setPostMenuOpen(postMenuOpen === post.id ? null : post.id);
                            }}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-slate-400 border-none"
                            title="Post menu"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          {postMenuOpen === post.id && (
                            <div className="absolute right-0 bottom-full mb-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-[10px] font-semibold">
                              {activeUser && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      const isHidden = post.hiddenBy?.includes(activeUser.uid);
                                      handleHidePost(post.id, e);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-slate-700 border-none bg-transparent"
                                  >
                                    <EyeOff size={12} />
                                    {post.hiddenBy?.includes(activeUser.uid) ? 'Unhide' : 'Hide'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPostMenuOpen(null);
                                      setReportModal({
                                        isOpen: true,
                                        postId: post.id,
                                        postTitle: post.content.substring(0, 50)
                                      });
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 cursor-pointer flex items-center gap-2 text-rose-600 border-none bg-transparent"
                                  >
                                    <Flag size={12} />
                                    Report
                                  </button>
                                </>
                              )}
                              {activeUser?.isAdmin && (
                                <button
                                  onClick={(e) => handlePinPost(post.id, e)}
                                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 cursor-pointer flex items-center gap-2 text-amber-700 border-none bg-transparent"
                                >
                                  <Pin size={12} />
                                  {post.isPinned ? 'Unpin' : 'Pin'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
              {/* [Round 10] 배치 렌더링 & 더보기 버튼 */}
              {filteredPosts.length > visiblePostsCount && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-[rgba(15,0,0,0.12)] rounded-none font-mono">
                  <span className="text-xs text-[#504a4a]">
                    [{language === 'ko' ? '표시 중' : 'Showing'} {Math.min(visiblePostsCount, filteredPosts.length)} / {filteredPosts.length}건]
                  </span>
                  <button
                    onClick={() => {
                      playCustomSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      triggerHaptic('medium');
                      setVisiblePostsCount((prev) => prev + 15);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-[#201d1d] hover:bg-[#383333] text-white text-xs font-bold rounded-sm border border-[#201d1d] active:scale-95 transition-all cursor-pointer touch-target"
                  >
                    {language === 'ko' ? `[더 보기 (+15건)]` : `[Load More (+15)]`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>

      {/* 4. Upload Dialog Modal (DESIGN.md Flat Monospace) */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] z-[20000] font-mono">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md max-h-[85dvh] sm:max-h-[88dvh] bg-[#fdfcfc] border border-[rgba(15,0,0,0.2)] rounded-none overflow-hidden shadow-2xl relative flex flex-col text-[#201d1d]"
            >
              {/* Modal Header */}
              <div className="shrink-0 p-3.5 sm:p-4 bg-white border-b border-[rgba(15,0,0,0.12)] flex justify-between items-center">
                <h3 className="font-mono font-bold text-sm tracking-tight flex items-center gap-2 text-[#201d1d]">
                  <span>[✍️ {t('community_new_post', language)}]</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    setShowUploadModal(false);
                    setImageFiles([]);
                    setImagePreviews([]);
                    setUploadFlair('');
                  }}
                  className="px-2 py-1 border border-[rgba(15,0,0,0.15)] hover:border-[#201d1d] text-[#201d1d] text-xs font-mono font-bold rounded-sm cursor-pointer transition-colors"
                  title="Close"
                >
                  [✕]
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleCreatePost} className="flex-1 min-h-0 flex flex-col overflow-hidden font-mono">
                <div className="flex-1 min-h-0 p-4 sm:p-5 flex flex-col gap-3.5 overflow-y-auto custom-scrollbar">
                  {/* Draft Restored Banner */}
                  {hasDraftRestored && (
                    <div className="bg-amber-50 border border-amber-200 p-2.5 flex items-center justify-between text-xs font-mono text-amber-900 rounded-sm">
                      <span>[💾 임시저장된 글이 복원되었습니다]</span>
                      <button
                        type="button"
                        onClick={handleClearDraft}
                        className="px-2 py-0.5 bg-amber-200/80 hover:bg-amber-300 text-amber-950 text-[10px] font-mono rounded-sm border border-amber-400 cursor-pointer"
                      >
                        [초기화]
                      </button>
                    </div>
                  )}

                  {/* Category Select */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666]">
                      [CATEGORY]
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as CommunityWritableCategory)}
                      className="w-full p-2.5 bg-white border border-[rgba(15,0,0,0.15)] rounded-sm font-mono text-xs focus:outline-none focus:border-[#201d1d] transition-all text-[#201d1d]"
                    >
                      <option value="free">{t('community_cat_free', language)}</option>
                      <option value="qa">{t('community_cat_qa', language)}</option>
                      <option value="tip">{t('community_cat_tip', language)}</option>
                      <option value="boast">{t('community_cat_boast', language)}</option>
                      <option value="running">{t('community_cat_running', language)}</option>
                      <option value="guild">{t('community_cat_guild', language)}</option>
                      <option value="pvp">{t('community_cat_pvp', language)}</option>
                      <option value="fanart">{t('community_cat_fanart', language)}</option>
                      <option value="vote">{t('community_cat_vote', language)}</option>
                      <option value="webtoon">{t('community_cat_webtoon', language)}</option>
                      <option value="season">{t('community_cat_season', language)}</option>
                    </select>
                  </div>

                  {/* Flair Select */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666]">
                      [FLAIR TAG]
                    </label>
                    <select
                      value={uploadFlair}
                      onChange={(e) => setUploadFlair(e.target.value as PostFlair | '')}
                      className="w-full p-2.5 bg-white border border-[rgba(15,0,0,0.15)] rounded-sm font-mono text-xs focus:outline-none focus:border-[#201d1d] transition-all text-[#201d1d]"
                    >
                      <option value="">{t('community_no_flair', language) || 'No flair'}</option>
                      {getFlairsForCategory(uploadCategory).map((flair) => (
                        <option key={flair} value={flair}>
                          {FLAIR_META[flair].icon} {FLAIR_META[flair].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Deck Attachment Toggle */}
                  <label className="flex items-center gap-2 p-2 border border-[rgba(15,0,0,0.12)] bg-white rounded-sm cursor-pointer text-xs font-mono select-none">
                    <input
                      type="checkbox"
                      checked={attachDeckToPost}
                      onChange={(e) => setAttachDeckToPost(e.target.checked)}
                      className="accent-[#201d1d] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-[#201d1d]">
                      [🎴 {language === 'ko' ? '내 대표 덱 함께 첨부하기' : 'Attach My Battle Deck'}]
                    </span>
                  </label>

                  {/* Content Area with Live Character Counter */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666]">
                        [CONTENT]
                      </label>
                      <span className={cn(
                        "text-[10px] font-mono",
                        content.length >= 280 ? "text-red-600 font-bold" : "text-[#888]"
                      )}>
                        [{content.length} / 300]
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={t('community_post_placeholder', language)}
                      className="w-full p-3 bg-white border border-[rgba(15,0,0,0.15)] rounded-sm font-mono text-xs focus:outline-none focus:border-[#201d1d] resize-none transition-all text-[#201d1d]"
                      maxLength={300}
                      required
                    />
                  </div>

                  {/* 다중 파일 업로드 버튼 및 이미지 카운터 */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666]">
                        [IMAGES]
                      </label>
                      {imageFiles.length > 0 && (
                        <span className="text-[10px] font-mono text-[#666]">
                          [{imageFiles.length}장 / {(imageFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(1)}MB]
                        </span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-3 bg-white hover:bg-[#f5f2f2] border border-dashed border-[rgba(15,0,0,0.25)] rounded-sm font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all text-[#444] touch-target"
                    >
                      <ImageIcon size={14} />
                      <span>[{t('choose_images_label', language)} (최대 5장)]</span>
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                  </div>

                  {/* 선택한 이미지 미리보기 썸네일 그리드 */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mt-1">
                      {imagePreviews.map((previewUrl, index) => (
                        <div key={index} className="aspect-square border border-[rgba(15,0,0,0.15)] rounded-none overflow-hidden relative bg-[#121010] flex items-center justify-center">
                          <img
                            src={previewUrl}
                            alt={`preview-${index}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-0 right-0 bg-black/80 hover:bg-red-600 px-1 py-0.5 text-white text-[9px] font-mono font-bold cursor-pointer border-none flex items-center justify-center"
                            title="Remove image"
                          >
                            [✕]
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pinned Submit Action Footer */}
                <div className="shrink-0 p-3.5 border-t border-[rgba(15,0,0,0.12)] bg-white">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "w-full py-3 bg-[#201d1d] hover:bg-[#383333] text-white font-mono font-bold tracking-wider rounded-sm transition-all border border-[#201d1d] disabled:opacity-50 cursor-pointer active:scale-98 text-xs uppercase touch-target",
                      isSubmitting && "animate-pulse"
                    )}
                  >
                    {isSubmitting ? `[⏳ ${t('community_uploading_images', language)}]` : `[✓ ${t('community_upload', language)}]`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Dialog Modal */}
      <AnimatePresence>
        {customModal && customModal.isOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[20050]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col font-sans text-slate-800"
            >
              {/* Header */}
              <div className={cn(
                "p-4 border-b flex justify-between items-center",
                customModal.type === 'error' 
                  ? "bg-rose-50 border-rose-100 text-rose-800" 
                  : customModal.type === 'confirm' 
                  ? "bg-amber-50 border-amber-100 text-amber-800" 
                  : "bg-emerald-50 border-emerald-100 text-emerald-800"
              )}>
                <h3 className="font-bold text-sm uppercase tracking-tight flex items-center gap-1.5">
                  {customModal.type === 'error' ? '❌' : customModal.type === 'confirm' ? '❓' : '🔔'} {customModal.title}
                </h3>
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    setCustomModal(null);
                  }}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Message */}
              <div className="p-5.5 bg-white flex flex-col gap-4">
                <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap text-slate-500">{customModal.message}</p>
                
                {/* Actions */}
                <div className="flex gap-2 justify-end mt-2">
                  {customModal.type === 'confirm' ? (
                    <>
                      <button
                        onClick={() => {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                          setCustomModal(null);
                        }}
                        className="px-4 py-2 border border-slate-200/80 rounded-xl text-xs font-bold bg-white text-slate-500 hover:bg-slate-50 active:scale-98 transition-all cursor-pointer shadow-xs"
                      >
                        {t('cancel_btn', language)}
                      </button>
                      <button
                        onClick={() => {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          if (customModal.onConfirm) customModal.onConfirm();
                          setCustomModal(null);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white active:scale-98 transition-all cursor-pointer shadow-md shadow-rose-200 border-none"
                      >
                        {t('community_confirm', language)}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        if (customModal.onConfirm) customModal.onConfirm();
                        setCustomModal(null);
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 active:scale-98 transition-all cursor-pointer shadow-md border-none"
                    >
                      {t('community_confirm', language)}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Doc 62: Report Modal */}
      <AnimatePresence>
        {reportModal && reportModal.isOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[20050]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col font-sans text-slate-800"
            >
              <div className="p-4 bg-rose-50 border-b border-rose-100 flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase tracking-tight flex items-center gap-1.5 text-rose-800">
                  <Flag size={16} /> Report Post
                </h3>
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    setReportModal(null);
                  }}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 bg-white flex flex-col gap-3">
                <p className="text-[10px] font-semibold text-slate-500 line-clamp-1">
                  "{reportModal.postTitle}..."
                </p>
                <div className="flex flex-col gap-2">
                  {([
                    { reason: 'spam' as const, icon: '📢', label: 'Spam' },
                    { reason: 'harassment' as const, icon: '😡', label: 'Harassment' },
                    { reason: 'inappropriate' as const, icon: '🔞', label: 'Inappropriate' },
                    { reason: 'other' as const, icon: '📝', label: 'Other' },
                  ]).map(({ reason, icon, label }) => (
                    <button
                      key={reason}
                      onClick={() => handleReportPost(reportModal.postId, reason)}
                      className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-98 transition-all cursor-pointer text-left border-none"
                    >
                      <span className="text-base">{icon}</span>
                      <span className="text-xs font-bold text-slate-700">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Write Post Button (DESIGN.md Flat Monospace) */}
      <button
        onClick={() => {
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          if (selectedCategory !== 'select') {
            setUploadCategory(selectedCategory);
          }
          setShowUploadModal(true);
        }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] right-4 sm:right-6 z-[10010] px-3.5 py-2.5 bg-[#201d1d] hover:bg-[#332f2f] text-white font-mono font-bold rounded-sm shadow-xl active:scale-95 transition-all cursor-pointer border border-[rgba(255,255,255,0.2)] flex items-center gap-1.5 touch-target"
        aria-label={t('community_new_post', language)}
      >
        <span className="font-mono text-base leading-none">[+]</span>
        <span className="text-xs tracking-wider">{language === 'ko' ? '글쓰기' : 'Write'}</span>
      </button>

      {/* [Round 2] Full-screen Image Lightbox Modal */}
      <AnimatePresence>
        {lightbox && lightbox.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[20060] bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 font-mono text-white select-none"
            onClick={() => setLightbox(null)}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between z-10 w-full max-w-5xl mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-white/10 border border-white/20 rounded-sm text-xs font-mono">
                  [IMAGE {lightbox.index + 1} / {lightbox.images.length}]
                </span>
                <a
                  href={lightbox.images[lightbox.index]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-sm text-xs font-mono text-white/80 hover:text-white transition-colors"
                >
                  [🔗 {language === 'ko' ? '원본 보기' : 'Open Raw'}]
                </a>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-sm border border-red-400 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95"
                title="Close (Esc)"
              >
                [✕ {language === 'ko' ? '닫기' : 'CLOSE'}]
              </button>
            </div>

            {/* Center Image Container with Prev/Next Controls */}
            <div className="relative flex-1 flex items-center justify-center p-2 my-2 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {lightbox.images.length > 1 && (
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                    setLightbox((prev) => prev ? ({
                      ...prev,
                      index: (prev.index === 0 ? prev.images.length - 1 : prev.index - 1)
                    }) : null);
                  }}
                  className="absolute left-2 sm:left-4 z-20 p-3 bg-black/75 hover:bg-black text-white border border-white/30 rounded-sm active:scale-95 transition-all cursor-pointer font-mono font-bold text-sm touch-target"
                  title="Previous image"
                >
                  [&lt;]
                </button>
              )}

              <motion.img
                key={lightbox.index}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.15 }}
                src={lightbox.images[lightbox.index]}
                alt={`Expanded view ${lightbox.index + 1}`}
                className="max-h-[72vh] max-w-full object-contain rounded-none border border-white/20 shadow-2xl"
              />

              {lightbox.images.length > 1 && (
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                    setLightbox((prev) => prev ? ({
                      ...prev,
                      index: (prev.index === prev.images.length - 1 ? 0 : prev.index + 1)
                    }) : null);
                  }}
                  className="absolute right-2 sm:right-4 z-20 p-3 bg-black/75 hover:bg-black text-white border border-white/30 rounded-sm active:scale-95 transition-all cursor-pointer font-mono font-bold text-sm touch-target"
                  title="Next image"
                >
                  [&gt;]
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Strip */}
            {lightbox.images.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10 max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
                {lightbox.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                      setLightbox((prev) => prev ? ({ ...prev, index: idx }) : null);
                    }}
                    className={cn(
                      "w-12 h-12 rounded-none overflow-hidden border transition-all cursor-pointer shrink-0 bg-black",
                      lightbox.index === idx ? "border-2 border-white scale-105" : "border-white/30 opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[20050] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative"
            >
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={20} className="text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-800">{t('community', language)}</h3>
              </div>
              <div className="min-h-[120px] flex flex-col justify-center text-sm text-slate-600 leading-relaxed space-y-2 mb-4">
                {helpSlide === 0 && (
                  <p>{language === 'ko' ? '커뮤니티는 자유게시판, Q&A, 팁, 덱 자랑 등 다양한 카테고리로 구성된 헌터들의 소통 공간입니다. 게시글 작성, 좋아요, 댓글 및 대댓글을 통해 소통할 수 있습니다.' : 'The community is a hub for hunters with categories like Free Board, Q&A, Tips, Deck Showcase, and more. Write posts, like, comment, and reply.'}</p>
                )}
                {helpSlide === 1 && (
                  <p>{language === 'ko' ? '카테고리를 선택하면 해당 주제의 게시글만 필터링됩니다. Hot/New/Top/Comments 정렬 모드와 Flair 태그로 원하는 글을 빠르게 찾을 수 있습니다.' : 'Select a category to filter posts by topic. Use Hot/New/Top/Comments sort modes and Flair tags to quickly find what you need.'}</p>
                )}
                {helpSlide === 2 && (
                  <p>{language === 'ko' ? 'PVP 카테고리에서는 다른 헌터에게 대결을 신청할 수 있습니다. 게시글 하단의 공유 버튼으로 링크를 복사하거나, 신고/숨기기 메뉴로 게시글을 관리할 수 있습니다.' : 'In the PVP category, challenge other hunters to battle. Share post links, or use the report/hide menu to manage content.'}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setHelpSlide((s) => Math.max(0, s - 1))}
                  disabled={helpSlide === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[10px] font-bold text-slate-400">{helpSlide + 1} / 3</span>
                <button
                  onClick={() => setHelpSlide((s) => Math.min(2, s + 1))}
                  disabled={helpSlide === 2}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── [Round 6] 좋아요 마이크로 파티클 ── */}
      {likeParticles.map((particle) => (
        <span
          key={particle.id}
          className="fixed z-50 pointer-events-none text-2xl animate-ping"
          style={{
            left: `calc(50% + ${particle.x}px)`,
            top: '40%'
          }}
        >
          {particle.emoji}
        </span>
      ))}

      {/* ── [Round 7] 소셜 공유 / 딥링크 클립보드 토스트 ── */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#201d1d] text-white px-4 py-2.5 rounded-sm border border-white/20 text-xs font-mono font-bold shadow-xl flex items-center gap-2"
          >
            <Check size={14} className="text-emerald-400" />
            <span>{shareToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
