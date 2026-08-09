import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Plus, Send, X, ImageIcon, User, AlertCircle, Trash2, Languages, Globe, ChevronLeft, ChevronRight, CornerDownRight, ArrowLeft, Share2, Sparkles, Swords, HelpCircle, Trophy, Navigation, Shield, ExternalLink, CheckCircle2, Vote, Palette, BookOpenCheck, Tag, Copy, Pin, EyeOff, Flag, Flame, Clock, ArrowUp, MessageSquare, MoreHorizontal } from 'lucide-react';
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
  uploadCommunityImage,
  toggleHidePost,
  reportPost,
  togglePinPost,
  sortPostsByMode
} from '../lib/communityHelper';
import { getActiveFanEvents, FAN_EVENT_TYPE_META } from '../content/fanEvents';
import { useFanEventVotes } from '../hooks/useFanEventVotes';
import type { FanEvent } from '../content/fanEvents';
import { OFFICIAL_COMMUNITY_CHANNELS, getChannelIcon, getChannelPurposeKey, getChannelClickCount, recordChannelClick, isChannelAvailable } from '../content/communityChannels';
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

  // 이미지 캐러셀 슬라이더 인덱스
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'error';
    onConfirm?: () => void;
  } | null>(null);
  const [channelClickCounts, setChannelClickCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(OFFICIAL_COMMUNITY_CHANNELS.map((channel) => [channel.id, getChannelClickCount(channel.id)]))
  );

  // ── Doc 62: Sort / Flair / Hide / Report state ──────────────────
  const [sortMode, setSortMode] = useState<CommunitySortMode>('hot');
  const [showHiddenPosts, setShowHiddenPosts] = useState(false);
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

  const isGuest = !user || user.uid === 'guest-id';
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
    if (!user || authorId !== user.uid) {
      return null;
    }
    const representativeCardId = parseCardAvatarId(avatar);
    return representativeCardId ? getPetIdForRepresentativeCard(representativeCardId) : null;
  };

  const markChannelClick = (channelId: string) => {
    recordChannelClick(channelId);
    setChannelClickCounts((prev) => ({
      ...prev,
      [channelId]: getChannelClickCount(channelId),
    }));
  };

  const showChannelFeedback = (message: string) => {
    setCustomModal({
      isOpen: true,
      title: t('official_channels_title', language),
      message,
      type: 'alert'
    });
  };

  const handleOpenOfficialChannel = (channel: (typeof OFFICIAL_COMMUNITY_CHANNELS)[number]) => {
    if (!isChannelAvailable(channel) || !channel.url) return;
    markChannelClick(channel.id);
    window.open(channel.url, '_blank', 'noopener,noreferrer');
    showChannelFeedback(t('official_channels_click_tracked', language));
  };

  const handleCopyOfficialChannel = async (channel: (typeof OFFICIAL_COMMUNITY_CHANNELS)[number]) => {
    if (!isChannelAvailable(channel) || !channel.url || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(channel.url);
      markChannelClick(channel.id);
      showChannelFeedback(t('official_channels_copied', language));
    } catch {
      showChannelFeedback(t('official_channels_notice', language));
    }
  };

  // 부지런의 나무 보상 지급 판정
  const checkAndGrantDiligenceReward = () => {
    if (!user || user.uid === 'guest-id' || !updateSns) return;
    
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
      if (!resultStr || !user || user.uid === 'guest-id') return;
      try {
        const result = JSON.parse(resultStr);
        const comment = language === 'ko'
          ? `⚔️ ${user.displayName || 'You'} vs ${result.opponentName} — ${result.result} (${result.score})`
          : `⚔️ ${user.displayName || 'You'} vs ${result.opponentName} — ${result.result} (${result.score})`;
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
    if (isGuest) {
      setCustomModal({
        isOpen: true,
        title: t('community_error', language),
        message: t('community_login_required', language),
        type: 'error'
      });
      return;
    }

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
      // 1. 다중 이미지 업로드 순차 실행
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadCommunityImage(file, isGuest);
        uploadedUrls.push(url);
      }

      // 2. 포스트 생성 호출
      const newPost = await createCommunityPost(
        content.trim(),
        uploadedUrls[0] || undefined, // 하위 호환성용 첫번째 이미지
        user,
        uploadCategory,
        uploadedUrls.length > 0 ? uploadedUrls : undefined,
        undefined, // deckData
        uploadFlair || undefined, // Doc 62: flair
      );

      setPosts((prev) => [newPost, ...prev]);
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
    if (isGuest) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setCustomModal({
        isOpen: true,
        title: t('community_error', language),
        message: t('community_login_required', language),
        type: 'error'
      });
      return;
    }

    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');

    // Optimistic UI Update
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const hasLiked = post.likes.includes(user.uid);
          const nextLikes = hasLiked
            ? post.likes.filter((id) => id !== user.uid)
            : [...post.likes, user.uid];
          
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
      await toggleLikePost(postId, user.uid);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      loadPosts();
    }
  };

  // 댓글 작성
  const handleAddComment = async (postId: string) => {
    if (isGuest) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setCustomModal({
        isOpen: true,
        title: t('community_error', language),
        message: t('community_login_required', language),
        type: 'error'
      });
      return;
    }

    if (!commentInput.trim()) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    const textToSend = commentInput.trim();
    setCommentInput('');

    try {
      const updatedPost = await addCommentToPost(postId, textToSend, user);
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
    if (isGuest) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setCustomModal({
        isOpen: true,
        title: t('community_error', language),
        message: t('community_login_required', language),
        type: 'error'
      });
      return;
    }

    const replyText = replyInputs[commentId] || '';
    if (!replyText.trim()) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    // Clear input
    setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
    setActiveReplyBox(null);

    try {
      const updatedPost = await addReplyToComment(postId, commentId, replyText.trim(), user);
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

  // 글 삭제
  const handleDeletePost = async (postId: string) => {
    if (isGuest) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setCustomModal({
        isOpen: true,
        title: t('community_error', language),
        message: t('community_login_required', language),
        type: 'error'
      });
      return;
    }
    try {
      await deleteCommunityPost(postId, user.uid);
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
    if (isGuest) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setPostMenuOpen(null);
    try {
      const updatedPost = await toggleHidePost(postId, user.uid);
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
    if (isGuest) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    try {
      const updatedPost = await reportPost(postId, user.uid, reason);
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
    if (isGuest || !user?.isAdmin) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setPostMenuOpen(null);
    try {
      const updatedPost = await togglePinPost(postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      loadPosts();
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

  // 선택한 카테고리에 속한 글 목록 필터 + 정렬 + 히든 필터
  const filteredPosts = (() => {
    let result = posts.filter(
      (post) => selectedCategory === 'select' 
        ? post.category !== 'news'
        : post.category === selectedCategory
    );
    // Filter hidden posts unless showing them
    if (!showHiddenPosts && user) {
      result = result.filter((post) => !post.hiddenBy?.includes(user.uid));
    }
    // Sort by selected mode
    return sortPostsByMode(result, sortMode);
  })();

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
    <div id="community-section" className="flex-1 flex flex-col w-full bg-slate-50/50 text-slate-800 font-sans overflow-y-auto pb-32">
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
          <button
            onClick={() => { setShowHelp(true); setHelpSlide(0); playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3'); }}
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-slate-300 bg-white/80 text-slate-600 transition-all hover:border-slate-400 hover:bg-white hover:text-slate-800 active:scale-95"
            title="Help"
            aria-label="Help"
          >
            <HelpCircle size={16} />
          </button>
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

      {/* Sort & Filter Bar (Doc 62) */}
      {selectedCategory !== 'select' && (
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 px-1 mt-4">
          <div className="flex items-center gap-1">
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
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-none',
                  sortMode === mode
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                <IconComp size={12} />
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {user && filteredPosts.some(p => p.hiddenBy?.includes(user.uid)) && (
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                  setShowHiddenPosts(!showHiddenPosts);
                }}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-none',
                  showHiddenPosts
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                <EyeOff size={12} />
                {showHiddenPosts ? 'Hidden' : 'Show Hidden'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Guest Mode Warning Banner */}
      {isGuest && (
        <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl shadow-xs flex items-start gap-3">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-xs font-semibold text-rose-700 leading-relaxed">
              {t('community_login_required', language)}
            </p>
          </div>
        </div>
      )}

      {/* 3. Main Views router */}
      {selectedPost ? (
        // 3A. 자세히 보기 화면 (Semantic HTML5)
        <article className="border border-slate-200/80 bg-white rounded-lg overflow-hidden shadow-sm flex flex-col text-slate-800">
          {/* Header */}
          <header className="p-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  setSelectedPost(null);
                  const url = new URL(window.location.href);
                  url.searchParams.delete('postId');
                  window.history.replaceState({}, '', url.toString());
                }}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-slate-500 shrink-0"
                title="Back"
              >
                <ChevronLeft size={20} />
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
                        <h4 className="font-bold text-sm tracking-tight text-slate-800">{selectedPost.userName}</h4>
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
                    {user && !isGuest && (
                      <>
                        <button
                          onClick={(e) => {
                            const isHidden = selectedPost.hiddenBy?.includes(user.uid);
                            handleHidePost(selectedPost.id, e);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-slate-700 border-none bg-transparent"
                        >
                          <EyeOff size={13} />
                          {selectedPost.hiddenBy?.includes(user.uid) ? 'Unhide' : 'Hide'}
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
                    {user?.isAdmin && (
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
              {user && (selectedPost.userId === user.uid || user.isAdmin === true) && (
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
              <div className="border-b border-slate-100 bg-slate-950 flex items-center justify-center overflow-hidden max-h-[500px] relative group/carousel">
                {/* 이미지 목록 */}
                {(() => {
                  const imgUrls = selectedPost.imageUrls || (selectedPost.imageUrl ? [selectedPost.imageUrl] : []);
                  const currentUrl = imgUrls[carouselIndex];
                  
                  return (
                    <div className="w-full flex items-center justify-center relative min-h-[300px]">
                      <img
                        src={currentUrl}
                        alt={`Post content ${carouselIndex + 1}`}
                        className="w-full h-auto max-h-[500px] object-contain transition-all duration-300"
                        loading="lazy"
                      />

                      {/* 좌우 화살표 */}
                      {imgUrls.length > 1 && (
                        <>
                          <button
                            onClick={() => {
                              playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                              setCarouselIndex((prev) => (prev === 0 ? imgUrls.length - 1 : prev - 1));
                            }}
                            className="absolute left-3 p-2.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg border border-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            onClick={() => {
                              playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                              setCarouselIndex((prev) => (prev === imgUrls.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-3 p-2.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg border border-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </>
                      )}

                      {/* 슬라이드 도트 인디케이터 */}
                      {imgUrls.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                          {imgUrls.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              onClick={() => {
                                playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                                setCarouselIndex(dotIdx);
                              }}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full border border-slate-900/40 transition-all cursor-pointer",
                                carouselIndex === dotIdx ? "bg-indigo-500 scale-125" : "bg-white/60"
                              )}
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
              <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap text-slate-700">
                {translatedContents[selectedPost.id] && !translatedContents[selectedPost.id].isOriginal
                  ? translatedContents[selectedPost.id].translated
                  : selectedPost.content}
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
                  user && selectedPost.likes.includes(user.uid) ? "bg-rose-600 hover:bg-rose-700 text-white border-none shadow-md shadow-rose-200/30" : "bg-white hover:bg-slate-50 text-slate-700"
                )}
              >
                <Heart size={15} fill={user && selectedPost.likes.includes(user.uid) ? "currentColor" : "none"} />
                <span>{selectedPost.likes.length}</span>
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200/85 rounded-lg font-bold text-xs bg-slate-50 text-slate-600">
                <MessageCircle size={15} />
                <span>{selectedPost.comments.length}</span>
              </div>

              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  const shareUrl = `${window.location.origin}/?view=community&postId=${selectedPost.id}`;
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    setCustomModal({
                      isOpen: true,
                      title: t('link_copied_title', language),
                      message: t('link_copied_desc', language),
                      type: 'alert'
                    });
                  }).catch(err => {
                    console.error('Failed to copy post link: ', err);
                  });
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200/80 rounded-lg font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer ml-auto hover:shadow-sm active:scale-98 transition-all"
                title="Share Post Link"
              >
                <Share2 size={15} />
                <span>{t('share', language)}</span>
              </button>
            </div>

            {/* 대결하기 버튼 (본인 글 제외 및 PVP 대전 카테고리 한정) */}
            {user && selectedPost.userId !== user.uid && selectedPost.category === 'pvp' && (
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

          {/* Comments and Nested Comments (Replies) Section */}
          <footer className="border-t border-slate-100 bg-slate-50/20 flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                {t('community_comments', language).replace('{count}', selectedPost.comments.length.toString())}
              </h5>
            </div>

            {/* Comments List */}
            {selectedPost.comments.length > 0 ? (
              <div className="p-4 flex flex-col gap-4.5 max-h-[400px] overflow-y-auto border-b border-slate-100 bg-white custom-scrollbar">
                {selectedPost.comments.map((comment) => (
                  <div key={comment.id} className="flex flex-col gap-2">
                    {/* 부모 댓글 */}
                    <div className="flex gap-3 items-start text-xs">
                      <img
                        src={formatAvatarUrl(comment.userAvatar, comment.userId)}
                        alt={comment.userName}
                        className="w-8 h-8 border border-slate-100 rounded-full object-cover shrink-0 bg-white"
                      />
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-150/70 flex-1 relative text-slate-700">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="min-w-0">
                            {(() => {
                              const identity = getProfileIdentityMeta(comment.userEmoticonKey, comment.userBadgeKey, comment.userTitleKey);
                              return (
                                <>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold tracking-tight text-slate-900">{comment.userName}</span>
                                    {identity.emoticon ? <span className="text-xs leading-none">{identity.emoticon.symbol}</span> : null}
                                    {identity.badge ? (
                                      <span className="rounded-full border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-700">
                                        {identity.badge.symbol}
                                      </span>
                                    ) : null}
                                  </div>
                                  {identity.title ? (
                                    <p className="mt-0.5 text-[9px] font-semibold text-slate-500">{t(identity.title.labelKey, language)}</p>
                                  ) : null}
                                </>
                              );
                            })()}
                          </div>
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {getRelativeTimeString(comment.createdAt)}
                          </span>
                        </div>
                        <p className="font-semibold leading-relaxed whitespace-pre-wrap">
                          {translatedContents[comment.id] && !translatedContents[comment.id].isOriginal
                            ? translatedContents[comment.id].translated
                            : comment.content}
                        </p>
                        
                        {/* 답글 달기 버튼 */}
                        <div className="flex gap-3.5 mt-2 items-center">
                          <button
                            onClick={() => {
                              playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                              setActiveReplyBox(activeReplyBox === comment.id ? null : comment.id);
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
                          >
                            <CornerDownRight size={12} />
                            {t('community_comment_reply', language)}
                          </button>
                          <button
                            onClick={() => handleTranslate(comment.id, comment.content)}
                            disabled={translatedContents[comment.id]?.isLoading}
                            className={cn(
                              "text-[10px] font-bold ml-auto flex items-center gap-1 cursor-pointer",
                              translatedContents[comment.id] && !translatedContents[comment.id].isOriginal ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                            )}
                          >
                            <Languages size={11} />
                            {translatedContents[comment.id]?.isLoading ? '...' : translatedContents[comment.id] && !translatedContents[comment.id].isOriginal ? 'ORIGINAL' : 'A'}
                          </button>

                          {/* 대댓글 갯수 토글 아코디언 */}
                          {comment.replies && comment.replies.length > 0 && (
                            <button
                              onClick={() => {
                                playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                                setOpenReplies(prev => ({ ...prev, [comment.id]: !prev[comment.id] }));
                              }}
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-655 cursor-pointer"
                            >
                              {t('community_comment_reply_count', language).replace('{count}', comment.replies.length.toString())} {openReplies[comment.id] ? '▲' : '▼'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 대댓글 리스트 (들여쓰기 적용) */}
                    {comment.replies && comment.replies.length > 0 && openReplies[comment.id] && (
                      <div className="pl-8 flex flex-col gap-2.5 border-l-2 border-slate-205 ml-4 mt-1">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2.5 items-start text-[11px]">
                            <img
                              src={formatAvatarUrl(reply.userAvatar, reply.userId)}
                              alt={reply.userName}
                              className="w-6 h-6 border border-slate-100 rounded-full object-cover shrink-0 bg-white"
                            />
                            <div className="bg-slate-100/40 p-2.5 rounded-xl border border-slate-150/70 flex-1 text-slate-700">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <div className="min-w-0">
                                  {(() => {
                                    const identity = getProfileIdentityMeta(reply.userEmoticonKey, reply.userBadgeKey, reply.userTitleKey);
                                    return (
                                      <>
                                        <div className="flex flex-wrap items-center gap-1">
                                          <span className="font-bold tracking-tight text-slate-900">{reply.userName}</span>
                                          {identity.emoticon ? <span className="text-[10px] leading-none">{identity.emoticon.symbol}</span> : null}
                                          {identity.badge ? (
                                            <span className="rounded-full border border-amber-100 bg-amber-50 px-1 py-0.5 text-[7px] font-bold text-amber-700">
                                              {identity.badge.symbol}
                                            </span>
                                          ) : null}
                                        </div>
                                        {identity.title ? (
                                          <p className="mt-0.5 text-[8px] font-semibold text-slate-500">{t(identity.title.labelKey, language)}</p>
                                        ) : null}
                                      </>
                                    );
                                  })()}
                                </div>
                                <span className="text-[8px] text-slate-400 font-semibold">
                                  {getRelativeTimeString(reply.createdAt)}
                                </span>
                              </div>
                              <p className="font-semibold leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 대댓글 작성 박스 */}
                    {activeReplyBox === comment.id && (
                      <div className="pl-8 ml-4 mt-1 flex gap-2 items-center">
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
                          className="flex-1 p-2.5 bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-indigo-500 rounded-xl font-semibold text-xs focus:outline-none transition-all"
                        />
                        <button
                          onClick={() => handleAddReply(selectedPost.id, comment.id)}
                          disabled={!(replyInputs[comment.id] || '').trim()}
                          className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 transition-all rounded-xl disabled:opacity-20 shrink-0 cursor-pointer shadow-xs active:scale-98 border-none flex items-center justify-center"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs font-bold text-slate-400 border-b border-slate-100 bg-white">
                {t('no_comments_yet', language)}
              </div>
            )}

            {/* 댓글 작성 창 */}
            <div className="p-3 bg-white flex items-center gap-2 border-t border-slate-100">
              <div className="relative shrink-0">
                <img
                  src={user ? formatAvatarUrl(user.photoURL || '', user.uid) : 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'}
                  alt="Me"
                  className="w-8 h-8 border border-slate-100 rounded-full object-cover shrink-0 bg-white"
                />
                {user ? (() => {
                  const petCardId = getLocalMonsterPetId(user.uid, user.photoURL || '');
                  return petCardId ? (
                    <MonsterPetBadge
                      cardId={petCardId}
                      className="absolute -bottom-1 -right-1 z-10 border-emerald-200 bg-white px-0.5 py-0.5"
                      imageClassName="h-4 w-4"
                      label={t('monster_pet_badge', language)}
                    />
                  ) : null;
                })() : null}
              </div>
              <div className="flex-1 flex gap-2 border border-slate-200/80 rounded-2xl overflow-hidden px-3.5 py-2.5 bg-slate-50 focus-within:bg-white focus-within:border-indigo-550 transition-all items-center">
                <input
                  type="text"
                  placeholder={t('community_add_comment', language)}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment(selectedPost.id);
                  }}
                  className="bg-transparent focus:outline-none flex-1 font-semibold text-xs text-slate-800"
                />
                <button
                  onClick={() => handleAddComment(selectedPost.id)}
                  disabled={!commentInput.trim()}
                  className="text-slate-600 hover:text-indigo-600 hover:scale-105 active:scale-95 disabled:opacity-20 transition-all shrink-0 cursor-pointer"
                >
                  <Send size={16} />
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
                          <span className={cn(
                            'text-[8px] md:text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs',
                            cat.badgeColor
                          )}>
                            {cat.badge}
                          </span>
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
          {/* 카테고리 정보 및 되돌아가기 헤더 */}
          <div className="flex items-center justify-end px-1">
            <span className="text-xs font-bold tracking-tight bg-indigo-50/50 text-indigo-650 px-3.5 py-2 rounded-xl border border-indigo-100 shadow-xs">
              🎯 {t(`community_cat_${selectedCategory}` as any, language)}
            </span>
          </div>

          {/* Grid Preview List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="font-bold text-xs text-slate-400 tracking-wider">LOADING POSTS...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="border border-slate-200/80 bg-white p-12 text-center rounded-3xl shadow-xl">
              <span className="text-4xl block mb-4">📭</span>
              <p className="font-bold text-sm text-slate-500">{t('community_empty', language)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredPosts.map((post) => {
                const imgUrls = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
                const hasLiked = user && post.likes.includes(user.uid);
                
                return (
                  <div
                    key={post.id}
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      setCarouselIndex(0);
                      setSelectedPost(post);
                      window.history.pushState({}, '', `?view=community&postId=${post.id}`);
                    }}
                    className="border border-slate-200/80 bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all flex flex-col cursor-pointer hover:-translate-y-0.5"
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
                      <div className="border-b border-slate-100 bg-slate-950 aspect-video relative flex items-center justify-center overflow-hidden">
                        {imgUrls.length > 0 && (
                          <img
                            src={imgUrls[0]}
                            alt="video thumb"
                            className="w-full h-full object-contain opacity-80"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <span className="p-3 bg-indigo-600/90 text-white rounded-full shadow-lg border border-white/20 active:scale-95 transition-all text-xs">
                            🎬 VIDEO PLAY
                          </span>
                        </div>
                        <div className="absolute top-2 right-2 bg-indigo-600 px-2 py-1 rounded-lg text-[8px] font-black text-white border border-white/10 uppercase tracking-widest">
                          VIDEO
                        </div>
                      </div>
                    ) : (
                      imgUrls.length > 0 && (
                        <div className="border-b border-slate-100 bg-slate-950 aspect-video relative flex items-center justify-center overflow-hidden">
                          <img
                            src={imgUrls[0]}
                            alt="post thumb"
                            className="w-full h-full object-contain"
                          />
                          {imgUrls.length > 1 && (
                            <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-1 rounded-lg text-[8px] font-bold text-white border border-white/10">
                              +{imgUrls.length - 1} IMGS
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
                                <h5 className="font-bold text-[10px] text-slate-800 truncate leading-none mb-0.5">{post.userName}</h5>
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
                          <p className="text-xs font-semibold leading-relaxed line-clamp-3 text-slate-550 whitespace-pre-wrap">
                            {translatedContents[post.id] && !translatedContents[post.id].isOriginal
                              ? translatedContents[post.id].translated
                              : post.content}
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

                      {/* Footer 배지 */}
                      <div className="flex gap-2 items-center justify-between text-[10px] font-bold mt-1 w-full">
                        <div className="flex gap-2 items-center">
                          <span className={cn(
                            "flex items-center gap-1 px-2.5 py-1 border border-slate-150 rounded-lg bg-slate-50/50 text-slate-500",
                            hasLiked && "bg-rose-50 text-rose-605 border-rose-200"
                          )}>
                            <Heart size={12} fill={hasLiked ? "currentColor" : "none"} /> {post.likes.length}
                          </span>
                          <span className="flex items-center gap-1 px-2.5 py-1 border border-slate-150 rounded-lg bg-slate-50/50 text-slate-500">
                            <MessageCircle size={12} /> {post.comments.length}
                          </span>
                        </div>

                        {post.category === 'pvp' && user && post.userId !== user.uid && (
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
                            className="px-3 py-1 bg-red-650 hover:bg-red-750 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border-none shadow-sm shadow-red-200/50 active:scale-95 transition-all cursor-pointer z-10"
                          >
                            ⚔️ ATTACK
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
                              {user && !isGuest && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      const isHidden = post.hiddenBy?.includes(user.uid);
                                      handleHidePost(post.id, e);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-slate-700 border-none bg-transparent"
                                  >
                                    <EyeOff size={12} />
                                    {post.hiddenBy?.includes(user.uid) ? 'Unhide' : 'Hide'}
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
                              {user?.isAdmin && (
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
          )}
        </div>
      )}
      {/* ─── Official Community Channels Banner (doc/26) ─── */}
      <div className="border border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 rounded-2xl p-4 shadow-sm mt-6 mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <ExternalLink size={14} className="text-indigo-500" />
          <h3 className="text-[11px] font-black text-indigo-700 uppercase tracking-wider">
            {t('official_channels_community_banner_title', language)}
          </h3>
        </div>
        <p className="text-[10px] font-semibold text-slate-600 leading-relaxed">
          {t('official_channels_community_banner_desc', language)}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {OFFICIAL_COMMUNITY_CHANNELS.map((channel) => {
            const icon = getChannelIcon(channel.platform);
            const purposeKey = getChannelPurposeKey(channel.purpose);
            const isAvailable = isChannelAvailable(channel);
            const hasClicked = (channelClickCounts[channel.id] ?? 0) > 0;

            return (
              <div
                key={channel.id}
                className="rounded-xl border border-indigo-100 bg-white/90 p-3 shadow-sm space-y-2"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-sm">{icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-800 truncate">
                        {t(channel.nameKey, language)}
                      </span>
                      {purposeKey && (
                        <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[8px] font-bold uppercase tracking-wider">
                          {t(purposeKey, language)}
                        </span>
                      )}
                      {hasClicked && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[8px] font-bold uppercase tracking-wider">
                          {t('official_channels_visited', language)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[9px] font-medium text-slate-500 leading-relaxed">
                      {t(channel.descKey, language)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenOfficialChannel(channel)}
                    disabled={!isAvailable}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 transition-all active:scale-95 cursor-pointer text-[10px] font-bold text-indigo-700 shadow-sm touch-target disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                  >
                    <ExternalLink size={10} className="text-indigo-400" />
                    <span>{t('official_channels_open_link', language)}</span>
                  </button>
                  <button
                    onClick={() => {
                      void handleCopyOfficialChannel(channel);
                    }}
                    disabled={!isAvailable || !navigator.clipboard}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-95 cursor-pointer text-[10px] font-bold text-slate-700 shadow-sm touch-target disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                  >
                    <Copy size={10} className="text-slate-400" />
                    <span>{t('official_channels_copy_link', language)}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600">
          <AlertCircle size={10} />
          <span>{t('official_channels_reward_pending', language)}</span>
        </div>
      </div>
    </div>

      {/* 4. Upload Dialog Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col text-slate-800 font-sans"
            >
              {/* Modal Header */}
              <div className="p-4.5 bg-slate-50/50 border-b border-slate-150/70 flex justify-between items-center">
                <h3 className="font-bold text-base uppercase tracking-tight flex items-center gap-2 text-slate-800">
                  ✍️ {t('community_new_post', language)}
                </h3>
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    setShowUploadModal(false);
                    setImageFiles([]);
                    setImagePreviews([]);
                    setUploadFlair('');
                  }}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-full cursor-pointer border-none"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleCreatePost} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {/* Category Select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('category', language)}
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as CommunityWritableCategory)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
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

                {/* Doc 62: Flair Select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    🏷️ Flair
                  </label>
                  <select
                    value={uploadFlair}
                    onChange={(e) => setUploadFlair(e.target.value as PostFlair | '')}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
                  >
                    <option value="">{t('community_no_flair', language) || 'No flair'}</option>
                    {getFlairsForCategory(uploadCategory).map((flair) => (
                      <option key={flair} value={flair}>
                        {FLAIR_META[flair].icon} {FLAIR_META[flair].label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content Area */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('community_post_content', language)}
                  </label>
                  <textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('community_post_placeholder', language)}
                    className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-sm focus:outline-none focus:border-indigo-500 focus:bg-white resize-none transition-all text-slate-700"
                    maxLength={300}
                    required
                  />
                </div>

                {/* 다중 파일 업로드 버튼 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    🏞️ {t('community_add_images', language)}
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 border border-dashed border-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all text-slate-500"
                  >
                    <ImageIcon size={16} />
                    <span>{t('choose_images_label', language)}</span>
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
                      <div key={index} className="aspect-square border border-slate-150 rounded-xl overflow-hidden relative bg-slate-950 flex items-center justify-center">
                        <img
                          src={previewUrl}
                          alt={`preview-${index}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-1 -right-1 bg-rose-600 p-0.5 rounded-full text-white cursor-pointer hover:bg-rose-500 scale-90 border-none flex items-center justify-center"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full py-4 bg-slate-900 text-white font-bold tracking-wider rounded-xl transition-all shadow-md hover:bg-slate-800 disabled:opacity-50 mt-2 cursor-pointer active:scale-98 text-xs uppercase",
                    isSubmitting && "animate-pulse"
                  )}
                >
                  {isSubmitting ? t('community_uploading_images', language) : t('community_upload', language)}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Dialog Modal */}
      <AnimatePresence>
        {customModal && customModal.isOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
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
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[65]">
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

      {/* Floating Write Post Button */}
      <button
        onClick={() => {
          if (isGuest) {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            setCustomModal({
              isOpen: true,
              title: t('community_error', language),
              message: t('community_login_required', language),
              type: 'error'
            });
            return;
          }
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          if (selectedCategory !== 'select') {
            setUploadCategory(selectedCategory);
          }
          setShowUploadModal(true);
        }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 p-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/40 active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center"
      >
        <Plus size={24} />
      </button>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
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
    </div>
  );
};
