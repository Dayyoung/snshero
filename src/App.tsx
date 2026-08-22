/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UserStats, ViewType, CardData, InventoryRecord, AiStrategy, AiDifficulty, BotRole, Item, Skill, PlayerPatterns, ItemRarity, Language, EquipmentSlot, Guild, CommunityCategory, CardRarity } from './types';
import { getUserGuild, getGuildBuff, donateToGuild } from './lib/guildHelper';
import { completeBattleRequest } from './lib/friendBattleHelper';
import { generateRandomItem } from './lib/itemGenerator';
import { 
  INITIAL_CARDS, 
  generateCard, 
  syncCardWithDatabase, 
  INITIAL_SKILLS, 
  getSkillPointBonus,
  getPowerMultiplier,
  getCardPower,
  generateUniqueDeck,
  generateAiName
} from './constants';
import { ITEM_DATABASE } from './constants/itemDatabase';
import { CARD_DATABASE } from './cardDatabase';
import { ALL_ACHIEVEMENTS } from './constants/achievements';
import { auth, googleProvider, db, analytics, logEvent, setUserId, setUserProperties, currentDbMode } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc, onSnapshot, query, orderBy, limit, where, writeBatch, getDocs } from './lib/firebaseMock';
import { t, translateText } from './lib/i18n';
import { GameSettingsProvider, useGameSettings } from './contexts/GameSettingsContext';
import { SnsProvider } from './contexts/SnsContext';
import { Navbar } from './components/Navbar';
import { AnimatePresence, motion } from 'motion/react';
import { cn, sanitizeForFirestore, getUserCollectionName, getCardSpriteStyle } from './lib/utils';
import { trackAnalytics, AnalyticsEvent } from './lib/analyticsEvents';
import { buildAdminHelpItems, isAdminSlashInput, parseAdminCommand, type ParsedAdminCommand } from './lib/adminCommands';
import { getSkillResetCost, getSkillUpgradeCost, SNS_ECONOMY_EARNINGS } from './content/snsEconomy';
import {
  DEFAULT_PROFILE_BADGE_KEY,
  DEFAULT_PROFILE_EMOTICON_KEY,
  DEFAULT_PROFILE_TITLE_KEY,
  PROFILE_BADGE_STORAGE_KEY,
  PROFILE_EMOTICON_STORAGE_KEY,
  PROFILE_TITLE_STORAGE_KEY,
} from './content/profileEmoticons';
import { useContextualTutorial } from './hooks/useContextualTutorial';
import { processIncomingReferral, createPendingReferralReward } from './lib/referral';
import { type LocalAiCapabilityStatus, getLocalAiCapabilityStatus, requestLocalAiReply } from './lib/localAi';
import { trackCreatorEvent } from './content/creatorCampaigns';
import { WEBTOON_SEASONS, getWebtoonSeasonById, getWebtoonEpisodesForSeason } from './content/webtoonEpisodes';
import { saveWebtoonProgress, type WebtoonProgressState } from './lib/webtoonProgress';
import { BGM_TRACKS } from './lib/audioConstants';
import { getSeasonItem, setSeasonItem, removeSeasonItem } from './lib/seasonStorage';
import { getDeckUpgradeRecommendation } from './lib/deckUpgrade';
import { incrementMissionProgress } from './lib/dailyMissions';
import { 
  Menu, 
  ChevronLeft, 
  Settings, 
  ShoppingBag, 
  HelpCircle, 
  X, 
  User, 
  ArrowRight, 
  LogOut, 
  Camera, 
  Shield, 
  Gift, 
  Coins, 
  BarChart3, 
  MessageCircle, 
  Bot, 
  Languages, 
  PlusCircle, 
  Zap, 
  Sparkles, 
  Navigation, 
  Swords,
  Volume2,
  VolumeX,
  RotateCw,
  Grid3X3,
  Wrench,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';

import { Meta } from './components/Meta';
import { NativeAd } from './components/NativeAd';
import { CortanaCommandButton } from './components/CortanaCommandButton';
import { TutorialCoachMark } from './components/TutorialCoachMark';
import { AppLoadingGate } from './components/AppLoadingGate';

import { HomeView } from './views/HomeView';
import { KadanRpgView } from './views/KadanRpgView';
import { MyDeckView } from './views/MyDeckView';
import { ShareView } from './views/ShareView';
import { ShopView } from './views/ShopView';
import { EventView } from './views/EventView';
import { SettingView } from './views/SettingView';
import { PlayGameView } from './views/PlayGameView';
import { RankingView } from './views/RankingView';
import { AdminView } from './views/AdminView';
import { StatusView } from './views/StatusView';
import { CompanionView } from './views/CompanionView';
import { ProfileView } from './views/ProfileView';
import { SkillView } from './views/SkillView';
import { StockMarketView } from './views/StockMarketView';
import { CardMarketplaceView } from './views/CardMarketplaceView';
import { PredictionMarketView } from './views/PredictionMarketView';
import { WikiHomeView } from './views/WikiHomeView';
import { WorldCodexView } from './views/WorldCodexView';
import { WikiHowToPlayView } from './views/WikiHowToPlayView';
import { WikiTipView } from './views/WikiTipView';
import { WikiCardView } from './views/WikiCardView';
import { WikiItemView } from './views/WikiItemView';
import { WikiSkillView } from './views/WikiSkillView';
import { GodView } from './views/GodView';
import { GuildListView } from './views/GuildListView';
import { GuildDetailView } from './views/GuildDetailView';
import { CommunityView } from './views/CommunityView';
import { PlaygroundView } from './views/PlaygroundView';
import { BoostView } from './views/BoostView';
import { Web3LandingView } from './views/Web3LandingView';
import { SeasonHubView } from './views/SeasonHubView';
import { ReferralView } from './views/ReferralView';
import { CreatorLandingView } from './views/CreatorLandingView';
import { DeckUpgradeModal } from './components/DeckUpgradeModal';
import { SimulationOverlay } from './components/SimulationOverlay';
import { QrReward } from './components/QrReward';
import { PolicyCenterView } from './views/PolicyCenterView';
import { NovelView } from './views/NovelView';
import { AnimeView } from './views/AnimeView';
import { MovieView } from './views/MovieView';
import { ModooView } from './views/ModooView';
import { GridToolView } from './views/GridToolView';
import { GridCheckerView } from './views/GridCheckerView';

const getCardAvatarStyle = (avatar: string): React.CSSProperties => {
  const cardId = Number(avatar.split(':')[1]) || 1;
  const idx = CARD_DATABASE[cardId] ? cardId : 1;
  return getCardSpriteStyle(idx);
};

const FLAG_MAP: Record<string, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  gb: '🇬🇧',
  ja: '🇯🇵',
  'zh-CN': '🇨🇳',
  'zh-TW': '🇹🇼',
  de: '🇩🇪',
  es: '🇪🇸',
  fr: '🇫🇷',
  id: '🇮🇩',
  ru: '🇷🇺',
  th: '🇹🇭',
  vi: '🇻🇳',
};

const getStoredGuestProfile = () => {
  if (typeof window === 'undefined') {
    return { displayName: 'GUEST', photoURL: 'preset:0', uid: 'guest-id' };
  }

  return {
    displayName: localStorage.getItem('hero_user_name') || 'GUEST',
    photoURL: localStorage.getItem('hero_user_avatar') || 'preset:0',
    activeEmoticonKey: localStorage.getItem(PROFILE_EMOTICON_STORAGE_KEY) || DEFAULT_PROFILE_EMOTICON_KEY,
    activeBadgeKey: localStorage.getItem(PROFILE_BADGE_STORAGE_KEY) || DEFAULT_PROFILE_BADGE_KEY,
    activeTitleKey: localStorage.getItem(PROFILE_TITLE_STORAGE_KEY) || DEFAULT_PROFILE_TITLE_KEY,
    uid: 'guest-id',
  };
};

function getCssSelector(el: HTMLElement): string {
  if (!(el instanceof HTMLElement)) return '';
  const path: string[] = [];
  let current: HTMLElement | null = el;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();
    if (current.id) {
      selector += '#' + current.id;
      path.unshift(selector);
      break;
    } else {
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(/\s+/).filter(c => c && !c.includes(':') && !c.includes('[') && !c.includes(']'));
        if (classes.length > 0) {
          selector += '.' + classes.slice(0, 3).join('.');
        }
      }
      let sibling = current;
      let nth = 1;
      while (sibling.previousElementSibling) {
        sibling = sibling.previousElementSibling as HTMLElement;
        if (sibling.nodeName.toLowerCase() === current.nodeName.toLowerCase()) {
          nth++;
        }
      }
      selector += `:nth-of-type(${nth})`;
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  return path.join(' > ');
}

const createVirtualUser = (index: number) => {
  const name = generateAiName(`virtual-${index}-${Date.now()}`);
  const uid = `virtual-user-${index}-${Math.random().toString(36).substring(2, 7)}`;
  const avatar = `preset:${Math.floor(Math.random() * 8)}`;
  
  // Random deck of 5 unique cards
  const deck = generateUniqueDeck(5);
  deck.forEach(card => {
    card.owner = 'ai';
    card.level = Math.floor(Math.random() * 5) + 1;
    // Upgrade skills randomly
    if (card.skills) {
      card.skills = card.skills.map(s => ({
        ...s,
        level: Math.random() > 0.5 ? Math.floor(Math.random() * 6) : 0
      }));
    }
    // Random equipment
    const itemSlots = ['necklace', 'ring1', 'ring2', 'boots'];
    card.equipment = {};
    itemSlots.forEach(slot => {
      if (Math.random() > 0.6) {
        // Pick a random item from ITEM_DATABASE
        const itemsList = Object.values(ITEM_DATABASE);
        const randomItemTemplate = itemsList[Math.floor(Math.random() * itemsList.length)];
        const itemInstance = {
          ...randomItemTemplate,
          id: `item-${Math.random().toString(36).substring(2, 9)}`,
          equippedToId: card.id
        };
        card.equipment![slot as any] = itemInstance;
      }
    });
    // Calculate final power for the card
    card.power = getCardPower(card);
  });
  
  // Calculate total power
  const totalPower = deck.reduce((sum, c) => sum + (c.power || 0), 0);
  
  // Create inventory record
  const inventory: Record<number, any> = {};
  deck.forEach(c => {
    inventory[c.imageIndex!] = {
      cardIndex: c.imageIndex!,
      quantity: Math.floor(Math.random() * 3) + 1,
      rarity: c.rarity,
      level: c.level,
      skills: c.skills,
      equipment: c.equipment
    };
  });
  
  // Add some extra random cards to inventory too
  const extraCardCount = Math.floor(Math.random() * 5) + 2;
  for (let e = 0; e < extraCardCount; e++) {
    const extraCard = generateCard();
    if (!inventory[extraCard.imageIndex!]) {
      inventory[extraCard.imageIndex!] = {
        cardIndex: extraCard.imageIndex!,
        quantity: Math.floor(Math.random() * 3) + 1,
        rarity: extraCard.rarity,
        level: Math.floor(Math.random() * 3) + 1,
        skills: extraCard.skills || [],
        equipment: {}
      };
    }
  }

  // Random item inventory
  const itemInventory: any[] = [];
  const itemsList = Object.values(ITEM_DATABASE);
  const itemAmt = Math.floor(Math.random() * 4) + 2;
  for (let i = 0; i < itemAmt; i++) {
    const it = itemsList[Math.floor(Math.random() * itemsList.length)];
    itemInventory.push({
      ...it,
      id: `item-inv-${Math.random().toString(36).substring(2, 9)}`,
      equippedToId: null
    });
  }

  // Random stats
  const wins = Math.floor(Math.random() * 80) + 10;
  const losses = Math.floor(Math.random() * 80) + 5;
  const draws = Math.floor(Math.random() * 15);
  
  const totalGames = wins + losses + draws;
  const winRate = totalGames > 0 ? parseFloat(((wins / totalGames) * 100).toFixed(1)) : 0;
  
  const userDoc = {
    uid,
    displayName: name,
    photoURL: avatar,
    sns: Math.floor(Math.random() * 2501) + 500, // 500 to 3000 SNS
    inventory,
    currentDeck: deck,
    itemInventory,
    totalPower,
    stats: {
      wins,
      losses,
      draws,
      winStreak: Math.floor(Math.random() * 5),
      lossStreak: 0,
      unlockedAchievements: [],
      claimedAchievements: [],
      achievementProgress: {}
    },
    winRate,
    isVirtual: true,
    isAutoBattle: true,
    lowSpecMode: false,
    recommendMode: false,
    language: ['ko', 'en', 'ja', 'zh-CN', 'de', 'es', 'fr'][Math.floor(Math.random() * 7)],
    isAdRemoved: Math.random() > 0.7,
    tutorialCompleted: true,
    lastSync: Date.now()
  };
  
  return userDoc;
};

export { getSeasonItem, setSeasonItem, removeSeasonItem } from './lib/seasonStorage';

interface AdminHelpMessageMeta {
  type: 'admin-help';
  items: ReturnType<typeof buildAdminHelpItems>;
}

interface ChatMessage {
  id: string;
  name: string;
  text: string;
  userId?: string;
  isBot?: boolean;
  isAiReply?: boolean;
  isLocalAiReply?: boolean;
  aiBadgeLabel?: string;
  createdAt?: any;
  language?: string;
  meta?: AdminHelpMessageMeta;
}

function getViewFromPathAndUrl(): ViewType {
  if (typeof window === 'undefined') return 'home';
  const params = new URLSearchParams(window.location.search);
  const queryView = params.get('view');
  if (queryView === 'community') return 'community';
  if (queryView === 'webtoon') return 'novel';
  if (queryView === 'anime') return 'anime';
  if (queryView === 'movie') return 'movie';
  if (queryView === 'modoo') return 'modoo';
  if (queryView === 'grid' || queryView === 'tool-grid' || queryView === 'tool/grid' || queryView === 'too/grid' || queryView === 'makegrid' || queryView === 'tool/makegrid' || queryView === 'tool-makegrid') return 'tool-makegrid';
  if (queryView === 'checkgrid' || queryView === 'tool-checkgrid' || queryView === 'tool/checkgrid' || queryView === 'gridcheck') return 'tool-checkgrid';

  const path = window.location.pathname.replace(/\/$/, '').toLowerCase() || '/';
  if (path === '/tool/checkgrid' || path === '/tool/check-grid' || path === '/checkgrid' || path.startsWith('/tool/checkgrid')) return 'tool-checkgrid';
  if (path === '/tool/makegrid' || path === '/tool/make-grid' || path === '/makegrid' || path === '/tool/grid' || path === '/too/grid' || path === '/grid' || path.startsWith('/tool/makegrid') || path.startsWith('/tool/grid') || path.startsWith('/too/grid')) return 'tool-makegrid';
  if (path === '/book' || path === '/novel' || path.startsWith('/novel/s1-')) return 'novel';
  if (path === '/admin') return 'admin';
  if (path === '/status') return 'status';
  if (path === '/wiki') return 'wiki';
  if (path === '/world-codex') return 'world-codex';
  if (path === '/wiki/howtoplay') return 'wiki-howtoplay';
  if (path === '/wiki/tip') return 'wiki-tip';
  if (path === '/wiki/card') return 'wiki-card';
  if (path === '/wiki/item') return 'wiki-item';
  if (path === '/wiki/skill') return 'wiki-skill';
  if (path === '/webtoon' || path === '/cartoonbook') return 'novel';
  if (path === '/home') return 'home';
  if (path === '/main') return 'main';
  if (path === '/deck') return 'mydeck';
  if (path === '/play') return 'play';
  if (path === '/shop') return 'shop';
  if (path === '/event') return 'event';
  if (path === '/setting') return 'setting';
  if (path === '/ranking') return 'ranking';
  if (path === '/companion') return 'companion';
  if (path === '/profile') return 'profile';
  if (path === '/skill') return 'skill';
  if (path === '/guild-list') return 'guild-list';
  if (path === '/playground') return 'playground';
  if (path === '/stock-market') return 'stock-market';
  if (path === '/marketplace') return 'card-marketplace';
  if (path === '/prediction-market') return 'prediction-market';
  if (path === '/reward' || path === '/reward-qr') return 'reward-qr';
  if (path === '/reward-ar') return 'reward-ar';
  if (path === '/share') return 'share';
  if (path === '/boost') return 'boost';
  if (path === '/season-hub' || path === '/mission' || path === '/missions') return 'season-hub';
  if (path === '/policy-center') return 'policy-center';
  if (path === '/web3') return 'web3-landing';
  if (path === '/referral') return 'referral';
  if (path === '/anime') return 'anime';
  if (path === '/movie') return 'movie';
  if (path === '/modoo') return 'modoo';
  if (path.startsWith('/creator/')) return 'creator';
  if (path === '/') return 'home';

  const saved = localStorage.getItem('hero_current_view') as ViewType;
  return saved || 'home';
}

function AppContent() {
  const [showInitialGate, setShowInitialGate] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        if (sessionStorage.getItem('hero_boot_gate_shown') === 'true' || localStorage.getItem('hero_boot_gate_shown') === 'true') {
          return false;
        }
        const initialView = getViewFromPathAndUrl();
        // If directly landing on specific feature subpages, bypass full-screen blocking gate
        if (initialView && initialView !== 'home' && initialView !== 'main') {
          sessionStorage.setItem('hero_boot_gate_shown', 'true');
          return false;
        }
        return sessionStorage.getItem('hero_boot_gate_shown') !== 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const [currentSeason, setCurrentSeason] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hero_current_season') || 'season1';
    }
    return 'season1';
  });
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState('');
  const [randomPlayTrigger, setRandomPlayTrigger] = useState(0);
  const [diceState, setDiceState] = useState<'idle' | 'rolling' | 'reveal'>('idle');
  const [diceGameTitle, setDiceGameTitle] = useState('');
  const [preselectedGameId, setPreselectedGameId] = useState<string | null>(null);
  const diceTimeoutRef = useRef<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUtilityOpen, setIsUtilityOpen] = useState(false);
  const adBannerRef = React.useRef<HTMLDivElement>(null);
  const [adBannerHeight, setAdBannerHeight] = useState(0);
  const [autoStartPvp, setAutoStartPvp] = useState(false);
  const [view, setView] = useState<ViewType>(() => getViewFromPathAndUrl());
  const [creatorCode, setCreatorCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/creator/')) {
        const code = path.split('/creator/')[1]?.split('/')[0] || '';
        return code;
      }
    }
    return '';
  });
  const [playGameState, setPlayGameState] = useState<string>('lobby');
  const [playInitialMode, setPlayInitialMode] = useState<string>('modeSelect');
  const [isAutoBattle, setIsAutoBattle] = useState(() => {
    const setting = localStorage.getItem('hero_auto_battle_setting');
    if (setting !== null) return JSON.parse(setting) === true;
    return false; // 기본값: 수동 전투 (유저가 직접 플레이)
  });
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | null>(null);
  const [showGpsPermissionModal, setShowGpsPermissionModal] = useState(false);

  useEffect(() => {
    processIncomingReferral();
  }, []);

  const [initialPostId, setInitialPostId] = useState<string | undefined>(undefined);
  const [initialCategory, setInitialCategory] = useState<CommunityCategory | undefined>(undefined);

  // URL 및 브라우저 뒤로가기/직접접속 감지
  useEffect(() => {
    const handleUrlParams = () => {
      const detectedView = getViewFromPathAndUrl();
      setView(detectedView);

      const params = new URLSearchParams(window.location.search);
      const postIdParam = params.get('id') || params.get('postId');
      const categoryParam = params.get('category');

      if (detectedView === 'community') {
        if (postIdParam) {
          setInitialPostId(postIdParam);
        } else {
          setInitialPostId(undefined);
        }
        if (categoryParam) {
          setInitialCategory(categoryParam as CommunityCategory);
        } else {
          setInitialCategory(undefined);
        }
      }
    };

    handleUrlParams();
    window.addEventListener('popstate', handleUrlParams);
    return () => window.removeEventListener('popstate', handleUrlParams);
  }, []);

  // view가 변할 때 URL 동기화 및 localStorage 저장
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('hero_current_view', view);

    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');

    if (view === 'modoo') {
      if (window.location.pathname !== '/modoo') {
        window.history.pushState({}, '', '/modoo');
      }
    } else if (view === 'tool-makegrid' || view === 'tool-grid') {
      const p = window.location.pathname.toLowerCase();
      if (p !== '/tool/makegrid' && p !== '/tool/grid') {
        window.history.pushState({}, '', '/tool/makegrid');
      }
    } else if (view === 'tool-checkgrid') {
      const p = window.location.pathname.toLowerCase();
      if (p !== '/tool/checkgrid') {
        window.history.pushState({}, '', '/tool/checkgrid');
      }
    } else if (view !== 'community') {
      if (viewParam === 'community' || params.has('category') || params.has('postId') || params.has('id')) {
        const url = new URL(window.location.href);
        url.searchParams.delete('view');
        url.searchParams.delete('category');
        url.searchParams.delete('postId');
        url.searchParams.delete('id');
        window.history.pushState({}, '', url.pathname + url.search);
      }
    }
  }, [view]);

  const { language, setLanguage, lowSpecMode, setLowSpecMode, theme, setTheme } = useGameSettings();
  const [recommendMode, setRecommendMode] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('hero_recommend_mode') !== 'false' : true;
  });
  const [offlineMode, setOfflineMode] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('hero_offline_mode') === 'true' : false;
  });
  const [testMode, setTestMode] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('hero_test_mode') === 'true' : false;
  });

  const [isAdRemoved, setIsAdRemoved] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hero_ad_removed');
      return saved === 'true';
    }
    return false;
  });

  const [upgradeDeckPrompt, setUpgradeDeckPrompt] = useState<{
    upgradedCardsToApply: { idx: number; imgIdx: number }[];
  } | null>(null);

  const [customPopup, setCustomPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'alert';
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const showCustomAlert = (title: string, message: string) => {
    setCustomPopup({
      isOpen: true,
      title,
      message,
      type: 'alert'
    });
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomPopup({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm
    });
  };

  useEffect(() => {
    localStorage.setItem('hero_ad_removed', String(isAdRemoved));
  }, [isAdRemoved]);

  // 광고 배너 높이 동적 측정 (ResizeObserver)
  // 광고가 비동기로 로드되거나 화면 크기가 변해도 항상 정확한 위치 유지
  useEffect(() => {
    const el = adBannerRef.current;
    if (!el || isAdRemoved) {
      setAdBannerHeight(0);
      return;
    }

    const update = () => {
      const rect = el.getBoundingClientRect();
      // 버튼을 광고 배너 바로 아래에 배치하기 위해 광고의 bottom 위치 사용
      setAdBannerHeight(rect.bottom);
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    // scroll 시에도 위치 갱신
    window.addEventListener('scroll', update, { passive: true });
    update(); // 초기값 즉시 설정

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
    };
  }, [isAdRemoved]);

  const [user, setUser] = useState<any | null>(() => getStoredGuestProfile());
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authProgress, setAuthProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(10);
  const loadStartTimeRef = useRef(Date.now());

  useEffect(() => {
    let timer: any;
    const updateProgress = () => {
      setAuthProgress((prev) => {
        if (prev < targetProgress) {
          const step = Math.max(2, Math.ceil((targetProgress - prev) * 0.25));
          const next = prev + step;
          return next >= targetProgress ? targetProgress : next;
        }
        return prev;
      });
      timer = setTimeout(updateProgress, 16);
    };
    timer = setTimeout(updateProgress, 16);
    return () => clearTimeout(timer);
  }, [targetProgress]);

  useEffect(() => {
    if (authProgress === 100) {
      const elapsed = Date.now() - loadStartTimeRef.current;
      const minDisplayTime = 100; // Fast loading: transition as soon as assets are ready
      const remainingTime = Math.max(50, minDisplayTime - elapsed);

      const t = setTimeout(() => {
        setAuthInitialized(true);
      }, remainingTime);
      return () => clearTimeout(t);
    }
  }, [authProgress]);
  const [simulationUser, setSimulationUser] = useState<any | null>(null);
  const effectiveUser = simulationUser || user;
  const [userGuild, setUserGuild] = useState<Guild | null>(null);
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [isOpponentGuildMode, setIsOpponentGuildMode] = useState<boolean>(false);

  const refreshUserGuild = useCallback(async () => {
    if (!effectiveUser?.uid) return;
    try {
      const g = await getUserGuild(effectiveUser.uid);
      setUserGuild(g);
      if (g) {
        localStorage.setItem('hero_user_guild_level', String(g.level));
      } else {
        localStorage.removeItem('hero_user_guild_level');
      }
    } catch (e) {
      console.error("Failed to refresh user guild:", e);
    }
  }, [effectiveUser?.uid]);

  useEffect(() => {
    refreshUserGuild();
  }, [effectiveUser?.uid, refreshUserGuild]);

  const [guestDataLoaded, setGuestDataLoaded] = useState(true);
  const [isTutorialMode, setIsTutorialMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      return !getSeasonItem('hero_tutorial_completed', season);
    }
    return true;
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const isPrimaryTutorialActive = isTutorialMode && tutorialStep > 0;
  const {
    activeStep: activeContextualTutorial,
    placement: contextualTutorialPlacement,
    stepIndex: contextualTutorialStepIndex,
    totalSteps: contextualTutorialTotalSteps,
    visible: isContextualTutorialVisible,
    completeStep: completeContextualTutorialStep,
    snoozeTutorial: snoozeContextualTutorial,
    dismissTutorial: dismissContextualTutorial,
  } = useContextualTutorial({
    currentSeason,
    view,
    suppressed: isPrimaryTutorialActive || view === 'home',
  });

  // Analytics & Page Views
  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'screen_view', {
        firebase_screen: view,
        firebase_screen_class: 'AppView'
      });
    }
  }, [view]);

  // Macro-style Tutorial Logic
  useEffect(() => {
    if (!isTutorialMode) return;

    // Ensure Step 1 on Home if tutorial mode is active
    if (view === 'home' && tutorialStep !== 1) {
      setTutorialStep(1);
    }

    // Dismiss Home tutorial if navigated to other tabs
    if (view !== 'home' && view !== 'play' && view !== 'main' && (tutorialStep === 1 || tutorialStep === 2)) {
      setTutorialStep(0);
      setIsTutorialMode(false);
    }

    // Automatically transition from Step 1/2 to 3 if already on Play or Main view
    if ((view === 'play' || view === 'main') && (tutorialStep === 1 || tutorialStep === 2)) {
      setTutorialStep(3);
    }

    // Step 1 to 2 to 3 Auto-transition: Home to Map
    if (tutorialStep === 1 && view === 'home') {
      const timer = setTimeout(() => {
        if (tutorialStep === 1 && view === 'home') {
          setTutorialStep(2);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Step 2 Action: Move to Map
    if (tutorialStep === 2 && view === 'home') {
      const timer = setTimeout(() => {
        if (tutorialStep === 2 && view === 'home') {
          setView('play');
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    // Step 2 Confirmation: Move to Step 3 ONLY when Map is visible
    if (tutorialStep === 2 && view === 'play') {
      setTutorialStep(3);
    }

    // Step 7 Action: Move to Shop after match
    if (tutorialStep === 7 && view === 'play' && playGameState === 'gameOver') {
      const timer = setTimeout(() => {
        if (tutorialStep === 7) setView('shop');
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Step 7 Confirmation: Move to Step 11 (Skip Gift/Draw) if already completed once
    if (tutorialStep === 7 && view === 'shop') {
      const alreadyCompleted = getSeasonItem('hero_tutorial_completed', currentSeason) === 'true';
      if (alreadyCompleted) {
        setView('mydeck');
        setTutorialStep(11);
      } else {
        setTutorialStep(8);
      }
    }



    // Dismiss step 1 home guide if navigated away from home
    if (tutorialStep === 1 && view !== 'home') {
      setTutorialStep(0);
      setIsTutorialMode(false);
    }

    // Step 10 Confirmation: Move to Step 11 ONLY when MyDeck is visible
    if (tutorialStep === 10 && view === 'mydeck') {
      setTutorialStep(11);
    }
  }, [isTutorialMode, tutorialStep, view, playGameState]);

  const isSyncingRef = useRef(false);
  const syncStartTimeRef = useRef(0);



  // Core Game States (Moved to top to fix initialization order)
  // Core Game States (Moved to top to fix initialization order)
  const [purchasedSns, setPurchasedSns] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hero_purchased_sns');
      if (saved) return parseInt(saved, 10) || 0;
    }
    return 0;
  });

  const [earnedSns, setEarnedSns] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hero_earned_sns');
      if (saved) return parseInt(saved, 10) || 0;
    }
    // 최초 1,000 SNS 정착금은 획득한 SNS로 취급
    return 1000;
  });

  const [sns, setSns] = useState<number>(purchasedSns + earnedSns);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hero_purchased_sns', purchasedSns.toString());
      localStorage.setItem('hero_earned_sns', earnedSns.toString());
    }
    setSns(purchasedSns + earnedSns);
  }, [purchasedSns, earnedSns]);

  const [inventory, setInventory] = useState<Record<number, InventoryRecord>>(() => {
    const inv: Record<number, InventoryRecord> = {};
    INITIAL_CARDS.forEach(c => {
      if (c.imageIndex !== undefined) {
        inv[c.imageIndex] = { 
          cardIndex: c.imageIndex, 
          quantity: 1, 
          rarity: c.rarity || 'bronze' 
        };
      }
    });

    if (typeof window !== 'undefined') {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const savedGuest = getSeasonItem('hero_inventory_guest', season);
      const savedStandard = getSeasonItem('hero_inventory', season);
      const rawStandard = localStorage.getItem('hero_inventory');
      
      let parsedGuest = {};
      let parsedStandard = {};
      let parsedRaw = {};
      
      if (savedGuest) {
        try { parsedGuest = JSON.parse(savedGuest); } catch (e) {}
      }
      if (savedStandard) {
        try { parsedStandard = JSON.parse(savedStandard); } catch (e) {}
      }
      if (rawStandard) {
        try { parsedRaw = JSON.parse(rawStandard); } catch (e) {}
      }
      
      const merged = { ...inv, ...parsedRaw, ...parsedStandard, ...parsedGuest };
      if (savedGuest || savedStandard || rawStandard) return merged;
    }
    return inv;
  });

  const [totalPower, setTotalPower] = useState(() => {
    if (typeof window !== 'undefined') {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const saved = getSeasonItem('hero_totalPower_guest', season) || getSeasonItem('hero_totalPower', season) || localStorage.getItem('hero_totalPower');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return INITIAL_CARDS.reduce((acc, c) => acc + (CARD_DATABASE[c.imageIndex || 0]?.power || 0), 0);
  });

  const [itemInventory, setItemInventory] = useState<Item[]>(() => {
    if (typeof window !== 'undefined') {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const savedGuest = getSeasonItem('hero_itemInventory_guest', season);
      const savedStandard = getSeasonItem('hero_itemInventory', season);
      const rawStandard = localStorage.getItem('hero_itemInventory');
      
      if (savedGuest && savedGuest !== '[]') {
        try { return JSON.parse(savedGuest); } catch (e) {}
      }
      if (savedStandard && savedStandard !== '[]') {
        try { return JSON.parse(savedStandard); } catch (e) {}
      }
      if (rawStandard && rawStandard !== '[]') {
        try { return JSON.parse(rawStandard); } catch (e) {}
      }
    }
    return [];
  });

  const [stats, setStats] = useState<UserStats>(() => {
    if (typeof window !== 'undefined') {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const saved = getSeasonItem('hero_stats_guest', season) || getSeasonItem('hero_stats', season) || localStorage.getItem('hero_stats');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return { 
      wins: 0, 
      losses: 0, 
      draws: 0, 
      skillPoints: 0, 
      winStreak: 0, 
      lossStreak: 0, 
      unlockedAchievements: [], 
      claimedAchievements: [],
      achievementProgress: {} 
    };
  });

  const [currentDeck, setCurrentDeck] = useState<CardData[]>(() => {
    if (typeof window !== 'undefined') {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const savedGuest = getSeasonItem('hero_deck_guest', season);
      const savedStandard = getSeasonItem('hero_deck', season);
      const rawStandard = localStorage.getItem('hero_deck');
      const saved = savedGuest || savedStandard || rawStandard;
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const inv: Record<number, InventoryRecord> = {};
          INITIAL_CARDS.forEach(c => {
            if (c.imageIndex !== undefined) {
              inv[c.imageIndex] = { cardIndex: c.imageIndex, quantity: 1, rarity: c.rarity || 'bronze' };
            }
          });
          const savedInvGuest = getSeasonItem('hero_inventory_guest', season);
          const savedInvStandard = getSeasonItem('hero_inventory', season);
          const rawInv = localStorage.getItem('hero_inventory');
          let parsedInvGuest = {};
          let parsedInvStandard = {};
          let parsedRawInv = {};
          if (savedInvGuest) try { parsedInvGuest = JSON.parse(savedInvGuest); } catch (e) {}
          if (savedInvStandard) try { parsedInvStandard = JSON.parse(savedInvStandard); } catch (e) {}
          if (rawInv) try { parsedRawInv = JSON.parse(rawInv); } catch (e) {}
          const finalInv = { ...inv, ...parsedRawInv, ...parsedInvStandard, ...parsedInvGuest };
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((c: any) => syncCardWithDatabase(c, finalInv));
          }
        } catch (e) {
          console.error("Failed to parse deck", e);
        }
      }
    }
    const inv: Record<number, InventoryRecord> = {};
    INITIAL_CARDS.forEach(c => {
      if (c.imageIndex !== undefined) {
        inv[c.imageIndex] = { cardIndex: c.imageIndex, quantity: 1, rarity: c.rarity || 'bronze' };
      }
    });
    let finalInv = inv;
    if (typeof window !== 'undefined') {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const savedInvGuest = getSeasonItem('hero_inventory_guest', season);
      const savedInvStandard = getSeasonItem('hero_inventory', season);
      const rawInv = localStorage.getItem('hero_inventory');
      let parsedInvGuest = {};
      let parsedInvStandard = {};
      let parsedRawInv = {};
      if (savedInvGuest) try { parsedInvGuest = JSON.parse(savedInvGuest); } catch (e) {}
      if (savedInvStandard) try { parsedInvStandard = JSON.parse(savedInvStandard); } catch (e) {}
      if (rawInv) try { parsedRawInv = JSON.parse(rawInv); } catch (e) {}
      finalInv = { ...inv, ...parsedRawInv, ...parsedInvStandard, ...parsedInvGuest };
    }
    return INITIAL_CARDS.slice(0, 5).map(c => syncCardWithDatabase(c, finalInv));
  });

  const [isPlaygroundMode, setIsPlaygroundMode] = useState(false);
  const [playgroundDeck, setPlaygroundDeck] = useState<CardData[]>([]);

  const [isGuildAttackActive, setIsGuildAttackActive] = useState(false);
  const [targetGuildId, setTargetGuildId] = useState<string>('');

  const cloudDataLoadedRef = useRef(false);

  const syncUserData = useCallback(async (overwriteData?: any) => {
    // 1. Synchronize React states immediately
    if (overwriteData) {
      if (overwriteData.sns !== undefined) setSns(overwriteData.sns);
      if (overwriteData.stats !== undefined) setStats(overwriteData.stats);
      if (overwriteData.inventory !== undefined) setInventory(overwriteData.inventory);
      if (overwriteData.currentDeck !== undefined) setCurrentDeck(overwriteData.currentDeck);
      if (overwriteData.itemInventory !== undefined) setItemInventory(overwriteData.itemInventory);
      if (overwriteData.totalPower !== undefined) setTotalPower(overwriteData.totalPower);
      if (overwriteData.isAutoBattle !== undefined) setIsAutoBattle(overwriteData.isAutoBattle);
      if (overwriteData.lowSpecMode !== undefined) setLowSpecMode(overwriteData.lowSpecMode);
      if (overwriteData.recommendMode !== undefined) setRecommendMode(overwriteData.recommendMode);
      if (overwriteData.language !== undefined) setLanguage(overwriteData.language);
      if (overwriteData.theme !== undefined) setTheme(overwriteData.theme);
      if (overwriteData.isAdRemoved !== undefined) setIsAdRemoved(overwriteData.isAdRemoved);
    }

    if (typeof window === 'undefined') return;
    const season = localStorage.getItem('hero_current_season') || currentSeason || 'season1';

    // 2. Persist directly to LocalStorage (Single Source of Truth)
    if (overwriteData?.inventory !== undefined) {
      setSeasonItem('hero_inventory', season, JSON.stringify(overwriteData.inventory));
      setSeasonItem('hero_inventory_guest', season, JSON.stringify(overwriteData.inventory));
      localStorage.setItem('hero_inventory', JSON.stringify(overwriteData.inventory));
    }
    if (overwriteData?.currentDeck !== undefined) {
      setSeasonItem('hero_deck', season, JSON.stringify(overwriteData.currentDeck));
      setSeasonItem('hero_deck_guest', season, JSON.stringify(overwriteData.currentDeck));
      localStorage.setItem('hero_deck', JSON.stringify(overwriteData.currentDeck));
    }
    if (overwriteData?.stats !== undefined) {
      setSeasonItem('hero_stats', season, JSON.stringify(overwriteData.stats));
      setSeasonItem('hero_stats_guest', season, JSON.stringify(overwriteData.stats));
      localStorage.setItem('hero_stats', JSON.stringify(overwriteData.stats));
    }
    if (overwriteData?.sns !== undefined) {
      setSeasonItem('hero_sns', season, overwriteData.sns.toString());
      setSeasonItem('hero_sns_guest', season, overwriteData.sns.toString());
      localStorage.setItem('hero_sns', overwriteData.sns.toString());
    }
    if (overwriteData?.itemInventory !== undefined) {
      setSeasonItem('hero_itemInventory', season, JSON.stringify(overwriteData.itemInventory));
      setSeasonItem('hero_itemInventory_guest', season, JSON.stringify(overwriteData.itemInventory));
      localStorage.setItem('hero_itemInventory', JSON.stringify(overwriteData.itemInventory));
    }
    if (overwriteData?.totalPower !== undefined) {
      setSeasonItem('hero_totalPower', season, overwriteData.totalPower.toString());
      setSeasonItem('hero_totalPower_guest', season, overwriteData.totalPower.toString());
      localStorage.setItem('hero_totalPower', overwriteData.totalPower.toString());
    }
    if (overwriteData?.displayName !== undefined) {
      localStorage.setItem('hero_user_name', overwriteData.displayName);
    }
    if (overwriteData?.photoURL !== undefined) {
      localStorage.setItem('hero_user_avatar', overwriteData.photoURL);
    }
  }, [currentSeason]);

  const startSimulation = useCallback(async (selectedUserUid: string, selectedUserData: any) => {
    setIsGlobalLoading(true);
    setGlobalLoadingMessage(language === 'ko' ? '시뮬레이션 데이터 로드 중...' : 'Loading simulation data...');
    
    const simUser = {
      uid: selectedUserUid,
      displayName: selectedUserData.displayName || 'Simulated User',
      photoURL: selectedUserData.photoURL || '',
      email: selectedUserData.email || '',
    };
    
    setSimulationUser(simUser);
    
    try {
      if (selectedUserData.inventory) setInventory(selectedUserData.inventory);
      if (selectedUserData.sns !== undefined) setSns(selectedUserData.sns);
      if (selectedUserData.stats) setStats(selectedUserData.stats);
      if (selectedUserData.currentDeck) setCurrentDeck(selectedUserData.currentDeck);
    } catch (err) {
      console.error("Simulation load error:", err);
    } finally {
      setIsGlobalLoading(false);
      setGlobalLoadingMessage('');
    }
  }, [language]);

  const endSimulation = useCallback(async () => {
    setIsGlobalLoading(true);
    setGlobalLoadingMessage(language === 'ko' ? '시뮬레이션 종료 중...' : 'Ending simulation...');
    
    setSimulationUser(null);
    
    try {
      const storedProfile = localStorage.getItem('hero_user_profile');
      if (storedProfile) {
        try { setUser(JSON.parse(storedProfile)); } catch (e) { setUser(getStoredGuestProfile()); }
      } else {
        setUser(getStoredGuestProfile());
      }
      
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const savedSns = getSeasonItem('hero_sns_guest', season) || getSeasonItem('hero_sns', season) || localStorage.getItem('hero_sns');
      setSns(savedSns ? parseInt(savedSns, 10) : 1000);

      const defaultInv: Record<number, InventoryRecord> = {};
      INITIAL_CARDS.forEach(c => {
        if (c.imageIndex !== undefined) {
          defaultInv[c.imageIndex] = { cardIndex: c.imageIndex, quantity: 1, rarity: c.rarity || 'bronze' };
        }
      });
      const savedInvGuest = getSeasonItem('hero_inventory_guest', season);
      const savedInvStandard = getSeasonItem('hero_inventory', season);
      const rawStandard = localStorage.getItem('hero_inventory');
      let parsedInvGuest = {};
      let parsedInvStandard = {};
      let parsedRaw = {};
      if (savedInvGuest) try { parsedInvGuest = JSON.parse(savedInvGuest); } catch (e) {}
      if (savedInvStandard) try { parsedInvStandard = JSON.parse(savedInvStandard); } catch (e) {}
      if (rawStandard) try { parsedRaw = JSON.parse(rawStandard); } catch (e) {}
      const finalInv = { ...defaultInv, ...parsedRaw, ...parsedInvStandard, ...parsedInvGuest };
      setInventory(finalInv);

      const savedPower = getSeasonItem('hero_totalPower_guest', season) || getSeasonItem('hero_totalPower', season) || localStorage.getItem('hero_totalPower');
      setTotalPower(savedPower ? parseInt(savedPower, 10) : INITIAL_CARDS.reduce((acc, c) => acc + (CARD_DATABASE[c.imageIndex || 0]?.power || 0), 0));

      const savedItemGuest = getSeasonItem('hero_itemInventory_guest', season);
      const savedItemStandard = getSeasonItem('hero_itemInventory', season);
      let parsedItems = [];
      if (savedItemGuest) try { parsedItems = JSON.parse(savedItemGuest); } catch (e) {}
      else if (savedItemStandard) try { parsedItems = JSON.parse(savedItemStandard); } catch (e) {}
      setItemInventory(parsedItems);
      
      const savedDeckGuest = getSeasonItem('hero_deck_guest', season) || getSeasonItem('hero_currentDeck_guest', season);
      const savedDeckStandard = getSeasonItem('hero_deck', season) || getSeasonItem('hero_currentDeck', season);
      const rawDeck = localStorage.getItem('hero_deck');
      let parsedDeck = [];
      if (savedDeckGuest) try { parsedDeck = JSON.parse(savedDeckGuest); } catch (e) {}
      else if (savedDeckStandard) try { parsedDeck = JSON.parse(savedDeckStandard); } catch (e) {}
      else if (rawDeck) try { parsedDeck = JSON.parse(rawDeck); } catch (e) {}
      if (parsedDeck && parsedDeck.length > 0) {
        setCurrentDeck(parsedDeck.map((c: any) => syncCardWithDatabase(c, finalInv)));
      } else {
        setCurrentDeck(INITIAL_CARDS.slice(0, 5).map(c => syncCardWithDatabase(c, finalInv)));
      }

      const savedStatsGuest = getSeasonItem('hero_stats_guest', season);
      const savedStatsStandard = getSeasonItem('hero_stats', season);
      let parsedStats = null;
      if (savedStatsGuest) try { parsedStats = JSON.parse(savedStatsGuest); } catch (e) {}
      else if (savedStatsStandard) try { parsedStats = JSON.parse(savedStatsStandard); } catch (e) {}
      setStats(parsedStats || { wins: 0, losses: 0, draws: 0, winStreak: 0, lossStreak: 0, longestWinStreak: 0, companionLevel: 1, companionExp: 0, companionMaxExp: 100, companionHunger: 100, companionHappiness: 100, companionLastCareTime: Date.now() });
    } catch (err) {
      console.error("Simulation end error:", err);
    } finally {
      setIsGlobalLoading(false);
      setGlobalLoadingMessage('');
      setView('admin');
    }
  }, [language, getStoredGuestProfile]);

  // Initialize App Data & User Profile directly from LocalStorage
  useEffect(() => {
    setTargetProgress(10);
    const storedProfile = localStorage.getItem('hero_user_profile');
    if (storedProfile) {
      try {
        setUser(JSON.parse(storedProfile));
      } catch (e) {
        setUser(getStoredGuestProfile());
      }
    } else {
      setUser(getStoredGuestProfile());
    }

    const season = localStorage.getItem('hero_current_season') || 'season1';
    setTargetProgress(30);

    // 1. sns
    const savedSns = getSeasonItem('hero_sns_guest', season) || getSeasonItem('hero_sns', season) || localStorage.getItem('hero_sns');
    if (savedSns) {
      const parsed = parseInt(savedSns, 10);
      if (!isNaN(parsed)) setSns(parsed);
    } else {
      setSns(1000);
    }
    setTargetProgress(50);

    // 2. inventory
    const defaultInv: Record<number, InventoryRecord> = {};
    INITIAL_CARDS.forEach(c => {
      if (c.imageIndex !== undefined) {
        defaultInv[c.imageIndex] = { cardIndex: c.imageIndex, quantity: 1, rarity: c.rarity || 'bronze' };
      }
    });
    const savedInvGuest = getSeasonItem('hero_inventory_guest', season);
    const savedInvStandard = getSeasonItem('hero_inventory', season);
    const rawStandard = localStorage.getItem('hero_inventory');
    let parsedInvGuest = {};
    let parsedInvStandard = {};
    let parsedRaw = {};
    if (savedInvGuest) try { parsedInvGuest = JSON.parse(savedInvGuest); } catch (e) {}
    if (savedInvStandard) try { parsedInvStandard = JSON.parse(savedInvStandard); } catch (e) {}
    if (rawStandard) try { parsedRaw = JSON.parse(rawStandard); } catch (e) {}
    const finalInv = { ...defaultInv, ...parsedRaw, ...parsedInvStandard, ...parsedInvGuest };
    setInventory(finalInv);
    setTargetProgress(65);

    // 3. totalPower
    const savedPower = getSeasonItem('hero_totalPower_guest', season) || getSeasonItem('hero_totalPower', season) || localStorage.getItem('hero_totalPower');
    if (savedPower) {
      const parsed = parseInt(savedPower, 10);
      if (!isNaN(parsed)) setTotalPower(parsed);
    } else {
      const defaultPower = INITIAL_CARDS.reduce((acc, c) => acc + (CARD_DATABASE[c.imageIndex || 0]?.power || 0), 0);
      setTotalPower(defaultPower);
    }
    setTargetProgress(75);

    // 4. itemInventory
    const savedItemGuest = getSeasonItem('hero_itemInventory_guest', season);
    const savedItemStandard = getSeasonItem('hero_itemInventory', season);
    let parsedItems = [];
    if (savedItemGuest && savedItemGuest !== '[]') {
      try { parsedItems = JSON.parse(savedItemGuest); } catch (e) {}
    } else if (savedItemStandard && savedItemStandard !== '[]') {
      try { parsedItems = JSON.parse(savedItemStandard); } catch (e) {}
    }
    if (parsedItems.length > 0) setItemInventory(parsedItems);
    setTargetProgress(85);

    // 5. stats
    const savedStats = getSeasonItem('hero_stats_guest', season) || getSeasonItem('hero_stats', season) || localStorage.getItem('hero_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {}
    } else {
      setStats({ 
        wins: 0, losses: 0, draws: 0, skillPoints: 0, winStreak: 0, lossStreak: 0, 
        unlockedAchievements: [], claimedAchievements: [], achievementProgress: {} 
      });
    }

    // 6. currentDeck
    const savedDeck = getSeasonItem('hero_deck_guest', season) || getSeasonItem('hero_deck', season) || getSeasonItem('hero_currentDeck_guest', season) || getSeasonItem('hero_currentDeck', season) || localStorage.getItem('hero_deck');
    if (savedDeck) {
      try {
        const parsed = JSON.parse(savedDeck);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCurrentDeck(parsed.map((c: any) => syncCardWithDatabase(c, finalInv)));
        } else {
          setCurrentDeck(INITIAL_CARDS.slice(0, 5).map(c => syncCardWithDatabase(c, finalInv)));
        }
      } catch (e) {
        setCurrentDeck(INITIAL_CARDS.slice(0, 5).map(c => syncCardWithDatabase(c, finalInv)));
      }
    } else {
      setCurrentDeck(INITIAL_CARDS.slice(0, 5).map(c => syncCardWithDatabase(c, finalInv)));
    }
    setTargetProgress(100);
  }, []);

  // Version Log
  useEffect(() => {
    if (testMode) {
      console.log(`%c [SYSTEM] VERSION: ${(__BUILD_TIME__)} `, 'background: #000; color: #00ff00; font-weight: bold;');
      console.log(`%c [SYSTEM] LANGUAGE: ${language.toUpperCase()} `, 'background: #000; color: #00ff00; font-weight: bold;');
      console.log(`%c [SYSTEM] TEST MODE: ${testMode ? 'ENABLED' : 'DISABLED'} `, 'background: #000; color: #00ff00; font-weight: bold;');
    }
  }, [language, testMode]);

  // Sync isAutoBattle to localStorage
  useEffect(() => {
    localStorage.setItem('hero_auto_battle', JSON.stringify(isAutoBattle));
  }, [isAutoBattle]);

  // Sync recommendMode to localStorage
  useEffect(() => {
    localStorage.setItem('hero_recommend_mode', JSON.stringify(recommendMode));
  }, [recommendMode]);

  const requestGpsPermission = () => {
    if (!navigator.geolocation) {
      showCustomAlert(language === 'ko' ? '오류' : 'ERROR', "This browser does not support Geolocation.");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsGpsActive(true);
        setShowGpsPermissionModal(false);
      },
      (error) => {
        console.error("GPS Permission error:", error);
        setShowGpsPermissionModal(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleGpsToggle = () => {
    if (isGpsActive) {
      setIsGpsActive(false);
      setGpsCoords(null);
    } else {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'granted') {
            requestGpsPermission();
          } else {
            setShowGpsPermissionModal(true);
          }
        }).catch(() => {
          requestGpsPermission();
        });
      } else {
        requestGpsPermission();
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('hero_offline_mode', JSON.stringify(offlineMode));
  }, [offlineMode]);

  // Sync view to localStorage
  useEffect(() => {
    localStorage.setItem('hero_current_view', view);
  }, [view]);

  // Handle global errors and redirect to /logout if something crashes during boot
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      // If the app hasn't fully loaded or is in a broken state, offer a way out
      // We don't automatically redirect to avoid loops, but we can if the user wants.
      // The user specifically asked to go to /logout if white screen happens.
      // A white screen is often the result of a React crash.
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      // Intentionally suppressed certain benign unhandled rejections (e.g., Clipboard policy)
      if (event.reason) {
        console.warn("Handled promise rejection gracefully:", event.reason);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Handle URL Routing for /, /admin & /logout
  useEffect(() => {
    const handleUrlRouting = async () => {
      const path = window.location.pathname;
      if (path === '/book' || path === '/novel' || path.startsWith('/novel/s1-')) {
        setView('novel');
      } else if (path === '/admin') {
        setView('admin');
      } else if (path === '/wiki') {
        setView('wiki');
      } else if (path === '/world-codex') {
        setView('world-codex');
      } else if (path === '/wiki/howtoplay') {
        setView('wiki-howtoplay');
      } else if (path === '/wiki/tip') {
        setView('wiki-tip');
      } else if (path === '/wiki/card') {
        setView('wiki-card');
      } else if (path === '/wiki/item') {
        setView('wiki-item');
      } else if (path === '/wiki/skill') {
        setView('wiki-skill');
      } else if (path === '/webtoon') {
        setView('webtoon');
      } else if (path === '/logout') {
        try {
          await signOut(auth);
        } catch (err) {
          console.error("Firebase signOut failed:", err);
        }
        localStorage.clear();
        setUser(null);
        setView('home');
        window.history.replaceState({}, '', '/home');
      } else if (path === '/home') {
        setView('home');
      } else if (path === '/main') {
        setView('main');
      } else if (path === '/deck') {
        setView('mydeck');
      } else if (path === '/play') {
        const savedView = localStorage.getItem('hero_current_view');
        if (!savedView) {
          setView('home');
        } else {
          setView('play');
          const autoSetting = localStorage.getItem('hero_auto_battle_setting');
          const autoEnabled = autoSetting === null ? true : JSON.parse(autoSetting) === true;
          if (autoEnabled) {
            setIsAutoBattle(true);
            localStorage.setItem('hero_auto_battle', 'true');
          }
        }
      } else if (path === '/shop') {
        setView('shop');
      } else if (path === '/event') {
        setView('event');
      } else if (path === '/setting') {
        setView('setting');
      } else if (path === '/ranking') {
        setView('ranking');
      } else if (path === '/companion') {
        setView('companion');
      } else if (path === '/profile') {
        setView('profile');
      } else if (path === '/skill') {
        setView('skill');
      } else if (path === '/guild-list') {
        setView('guild-list');
      } else if (path === '/playground') {
        setView('playground');
      } else if (path === '/stock-market') {
        setView('stock-market');
      } else if (path === '/marketplace') {
        setView('card-marketplace');
      } else if (path === '/prediction-market') {
        setView('prediction-market');
      } else if (path === '/share') {
        setView('share');
      } else if (path === '/season-hub') {
        setView('season-hub');
      } else if (path === '/web3') {
        setView('web3-landing');
      } else if (path === '/referral') {
        setView('referral');
      } else if (path === '/boost') {
        setView('boost');
      } else if (path === '/policy-center') {
        setView('policy-center');
      } else if (path === '/tool/checkgrid' || path === '/tool/check-grid' || path === '/checkgrid' || path.startsWith('/tool/checkgrid')) {
        setView('tool-checkgrid');
      } else if (path === '/tool/makegrid' || path === '/tool/make-grid' || path === '/makegrid' || path === '/tool/grid' || path === '/too/grid' || path === '/grid' || path.startsWith('/tool/makegrid') || path.startsWith('/tool/grid') || path.startsWith('/too/grid')) {
        setView('tool-makegrid');
      } else if (path.startsWith('/creator/')) {
        const code = path.split('/creator/')[1]?.split('/')[0] || '';
        setCreatorCode(code);
        setView('creator');
      } else {
        const params = new URLSearchParams(window.location.search);
        const queryView = params.get('view');
        
        if (queryView === 'community') {
          setView('community');
        } else {
          setView('home');
        }
      }
    };
    
    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, []);

  useEffect(() => {
    if (view !== 'play' && playGameState !== 'lobby') {
      setPlayGameState('lobby');
      setPlayInitialMode('modeSelect');
    }
  }, [view, playGameState]);

  // Sync state view to URL and update SEO title/meta-description
  useEffect(() => {
    const currentPath = window.location.pathname;
    let targetPath = '/';
    let title = 'SNS히어로 (SNSHero) - 원클릭 AI 웹 카드 게임';
    let description = "복잡한 클라이언트 설치나 가입 절차 없이 클릭 한 번으로 즐기는 인공지능(AI) 웹 카드 게임 'SNS히어로'를 만나보세요! 구글 계정 연동만으로 즉시 로비에 접속하고, 1,000 SNS 포인트 지급 및 최대 100회 무료 뽑기 혜택을 통해 110여 종의 귀여운 카드를 편안히 수집해 보세요. BTC, ETH, USDC 결제도 지원합니다!";

    if (view === 'home') {
      targetPath = '/home';
      title = 'SNS히어로 (SNSHero) - 원클릭 AI 웹 카드 게임';
      description = '복잡한 가입 없이 클릭 한 번으로 시작하는 AI 웹 카드 게임 SNS히어로 로비입니다. 1,000 SNS 무료 포인트 혜택을 받고 110여 종의 일러스트 카드를 수집해 보세요.';
    } else if (view === 'main') {
      targetPath = '/main';
      title = t('kadan_rpg_title', language) || 'Kadan & Arcane Echoes - SNSHero Main RPG';
      description = '카단이 소설 속 지도를 자동으로 이동하며 대화, 카드 전투, 보상 획득, 엔딩 스토리까지 진행하는 SNSHero 메인 RPG 모드입니다.';
    } else if (view === 'mydeck') {
      targetPath = '/deck';
      title = '마이덱 (My Deck) - SNS히어로 카드 컬렉션';
      description = '수집한 영웅 카드 덱을 구성하고 강력한 장비를 장착하여 나만의 최강 시너지 조합을 설계해 보세요. SNS히어로 마이덱 관리 화면입니다.';
    } else if (view === 'play') {
      targetPath = '/play';
      title = '배틀 대전 (Play Battle) - SNS히어로 실시간 카드 배틀';
      description = '인공지능(AI) 라이벌과 대적하여 실시간 자동 전투를 벌이고 랭킹 포인트와 명예를 획득해 보세요. SNS히어로 배틀 로비입니다.';
    } else if (view === 'shop') {
      targetPath = '/shop';
      title = '카드 상점 (Shop) - SNS히어로 카드 및 스킨 뽑기';
      description = 'SNS 포인트를 사용하여 등급별 강력한 카드를 뽑고 수집을 완성해 보세요. BTC, ETH, USDC 암호화폐 결제도 안전하게 지원합니다.';
    } else if (view === 'event') {
      targetPath = '/event';
      title = t('seo_title_event', language) || '특별 이벤트 홀 (Event) - SNS히어로';
      description = t('seo_desc_event', language) || '시간의 나무 무료 충전과 럭키 룰렛, 크레인 인형뽑기 등 SNS히어로의 특별 이벤트를 즐기고 풍성한 보상을 획득하세요!';
    } else if (view === 'setting') {
      targetPath = '/setting';
      title = '설정 (Settings) - SNS히어로 게임 환경설정';
      description = '배경음악, 효과음 볼륨 조절 및 게스트 데이터 영구 연동, 다국어 설정을 손쉽게 변경할 수 있는 SNS히어로 설정 화면입니다.';
    } else if (view === 'ranking') {
      targetPath = '/ranking';
      title = '랭킹대전 (Ranking) - SNS히어로';
      description = 'SNS히어로 랭킹 경쟁에서 다른 헌터의 덱과 전투력을 비교하고 도전하세요.';
    } else if (view === 'companion') {
      targetPath = '/companion';
      title = '히어로 육성 (Companion) - SNS히어로';
      description = '동료 히어로를 성장시키고 장비를 관리하여 덱 전투력을 강화하세요.';
    } else if (view === 'profile') {
      targetPath = '/profile';
      title = '프로필 (Profile) - SNS히어로';
      description = '닉네임과 아바타를 설정하고 나만의 헌터 프로필을 관리하세요.';
    } else if (view === 'skill') {
      targetPath = '/skill';
      title = '스킬 강화 (Skills) - SNS히어로';
      description = '스킬 포인트를 투자해 카드 능력을 강화하고 전술 효율을 높이세요.';
    } else if (view === 'guild-list') {
      targetPath = '/guild-list';
      title = '길드 (Guild) - SNS히어로';
      description = '길드를 만들거나 가입해 보상을 공유하고 길드 전투를 준비하세요.';
    } else if (view === 'playground') {
      targetPath = '/playground';
      title = '플레이그라운드 (Playground) - SNS히어로';
      description = '카드 조합과 전술을 자유롭게 시험할 수 있는 실험 공간입니다.';
    } else if (view === 'stock-market') {
      targetPath = '/stock-market';
      title = '카드 거래소 (Market) - SNS히어로';
      description = '카드와 SNS 경제 흐름을 확인하고 컬렉션 가치를 비교하세요.';
    } else if (view === 'card-marketplace') {
      targetPath = '/marketplace';
      title = '카드 P2P 거래소 (Marketplace) - SNS히어로';
      description = '안전한 목록·구매 요청·에스크로 상태 중심으로 카드 P2P 거래를 검토하는 SNSHero 마켓플레이스입니다.';
    } else if (view === 'prediction-market') {
      targetPath = '/prediction-market' + window.location.search;
      title = '예측시장 (Prediction Market) - SNS히어로';
      description = '스포츠 경기와 이벤트 결과를 예측하고 SNS 보상을 노려보세요.';
    } else if (view === 'admin') {
      targetPath = '/admin';
      title = '관리자 도구 (Admin Console) - SNS히어로';
      description = 'SNS히어로 시스템 모니터링 및 게임 밸런스 조정 콘솔입니다.';
    } else if (view === 'status') {
      targetPath = '/status';
      title = '관리자 통계 (Status Dashboard) - SNS히어로';
      description = 'SNS히어로의 실시간 사용자 통계, 게임 승률, 인기 카드 및 언어 분포를 확인할 수 있는 관리자 전용 대시보드입니다.';
    } else if (view === 'wiki') {
      targetPath = '/wiki';
      title = '게임 가이드 (Wiki) - SNS히어로 백과사전';
      description = 'SNS히어로의 기본 플레이 규칙, 카드 육성 팁, 110여 종의 전체 카드 데이터베이스 및 장비 도감을 망라한 통합 백과사전입니다.';
    } else if (view === 'world-codex') {
      targetPath = '/world-codex';
      title = '세계관 도감 (World Codex) - SNS히어로';
      description = 'SNSHero 세계의 세력, 갈등, 관계망, 추천 캐릭터와 웹툰 진입점을 한눈에 살펴보는 세계관 허브입니다.';
    } else if (view === 'season-hub') {
      targetPath = '/season-hub';
      title = t('seo_title_season_hub', language) || '시즌 허브 (Season Hub) - SNS히어로';
      description = t('seo_desc_season_hub', language) || 'SNSHero 시즌별 스토리, 이벤트 미션, 보상 트랙, 웹툰 및 커뮤니티 콘텐츠를 한 곳에서 확인하는 라이브 운영 대시보드입니다.';
    } else if (view === 'wiki-howtoplay') {
      targetPath = '/wiki/howtoplay';
      title = '플레이 방법 (How to Play) - SNS히어로 가이드';
      description = '기본 카드 배틀 흐름, 속성 상성, 스킬 효과 조작법 등 초보자를 위한 상세 플레이 가이드입니다.';
    } else if (view === 'wiki-tip') {
      targetPath = '/wiki/tip';
      title = '공략 팁 (Strategy & Tips) - SNS히어로 가이드';
      description = '효율적인 카드 레벨업, 장비 획득 순서, 고등급 카드 덱 조합 등 랭킹 상승을 위한 팁을 수록했습니다.';
    } else if (view === 'wiki-card') {
      targetPath = '/wiki/card';
      title = '카드 도감 (Hero Library) - SNS히어로 가이드';
      description = '110여 종에 달하는 SNS히어로 전체 영웅 카드의 속성, 베이스 능력치, 전용 스킬을 상세히 조회할 수 있는 카드 백과사전입니다.';
    } else if (view === 'wiki-item') {
      targetPath = '/wiki/item';
      title = '장비 도감 (Equipment Library) - SNS히어로 가이드';
      description = '반지, 목걸이, 부츠 등 히어로의 능력을 극한으로 끌어올리는 장비 아이템 등급과 세부 옵션을 조회합니다.';
    } else if (view === 'wiki-skill') {
      targetPath = '/wiki/skill';
      title = '스킬 도감 (Skill Library) - SNS히어로 가이드';
      description = '히어로 카드가 사용할 수 있는 각종 공격, 방어, 유틸 스킬 효과와 쿨타임 가이드입니다.';
    } else if (view === 'webtoon') {
      targetPath = '/webtoon' + window.location.search;
      title = `${t('webtoon_reader_title', language)} - SNS히어로`;
      description = t('webtoon_hub_subtitle', language);
    } else if (view === 'god') {
      targetPath = currentPath;
      title = '디버그 센터 (God Mode) - SNS히어로';
      description = '개발자 테스트를 위한 전용 샌드박스 화면입니다.';
    } else if (view === 'share') {
      targetPath = '/share' + window.location.search;
      title = '덱 공유 (Share Deck) - SNS히어로';
      description = '다른 사용자가 공유한 카드 덱을 확인하고 AI 대전을 진행해보세요!';
    } else if (view === 'boost') {
      targetPath = '/boost';
      title = t('boost_seo_title', language) || '소셜 부스팅 (Social Boost) - SNS히어로';
      description = t('boost_seo_desc', language) || '안전하고 합법적인 방식으로 당신의 채널을 성장시키세요. 전 세계 120만 명의 인플루언서가 이미 SNSHero와 함께하고 있습니다.';
    } else if (view === 'policy-center') {
      targetPath = '/policy-center';
      title = t('policy_center_title', language) || 'Trust Center - SNSHero';
      description = t('policy_disclaimer_body', language) || 'SNSHero의 정책, 확률, 환불, 개인정보 처리 기준을 한 곳에서 확인하세요.';
    } else if (view === 'web3-landing') {
      targetPath = '/web3';
      title = t('web3_landing_hero_title', language) || 'SNSHero — Play Instantly, No Install, No Wallet';
      description = t('web3_landing_hero_subtitle', language) || '브라우저에서 바로 즐기는 카드 배틀 게임. 지갑 없이 시작하고 BTC, ETH, USDC 결제를 선택할 수 있습니다.';
    } else if (view === 'referral') {
      targetPath = '/referral';
      title = t('referral_seo_title', language) || '친구 초대 프로그램 (Referral) - SNS히어로';
      description = t('referral_seo_desc', language) || '친구를 초대하고 SNS 포인트와 특별 카드를 받으세요!';
    } else if (view === 'creator') {
      targetPath = '/creator/' + (creatorCode || '');
      title = t('creator_seo_title', language) || 'SNSHero — Play Now, No Install!';
      description = t('creator_seo_desc', language) || 'Jump into the AI card battle instantly. Use your creator code for exclusive rewards!';
    } else if (view === 'anime') {
      targetPath = '/anime';
      title = `${t('anime_title', language)} - SNS히어로`;
      description = t('anime_subtitle', language);
    } else if (view === 'movie') {
      targetPath = '/movie';
      title = `${t('movie_title', language)} - SNS히어로`;
      description = t('movie_subtitle', language);
    } else if (view === 'novel' || view === 'book') {
      targetPath = '/book';
      title = '눈히어로 40부작 웹소설 - 카단과 아케인의 메아리 (/public/book)';
      description = '40부작 공식 웹소설. 주인공 카단과 11개 종족의 거대한 서사시.';
    } else if (view === 'cartoonBook') {
      targetPath = '/cartoonbook';
      title = 'SNS히어로 카툰북 (CartoonBook) - SNSHero';
      description = 'AI로 그려낸 판타지 RPG 웹툰. SNS히어로의 매력적인 캐릭터들과 세계관을 아름다운 웹툰으로 감상하세요.';
    } else if (view === 'tool-checkgrid') {
      targetPath = '/tool/checkgrid';
      title = '그리드 검수기 (Grid Checker 10x10) - SNS히어로';
      description = '10x10 기본 그리드 이미지 로드 & 정밀 검수 도구. 파일 업로드 또는 이미지 URL을 입력하여 격자선 오버레이 정합성, 셀 슬라이스 좌표를 검수하세요.';
    } else if (view === 'tool-makegrid' || view === 'tool-grid') {
      targetPath = '/tool/makegrid';
      title = 'CSS 그리드 생성기 (Grid Generator) - SNS히어로';
      description = 'CSS Grid 레이아웃을 시각적으로 설계하고 코드를 실시간 추출하는 도구입니다.';
    }

    if (currentPath !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }

    // Update browser title
    document.title = title;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }

    // Update Open Graph tags for better social snippet previews
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', `https://snshero.com${targetPath}`);

    // Update og:image tag
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', 'https://snshero.com/logo.jpg');

    // Update twitter:image tag
    let twitterImage = document.querySelector('meta[property="twitter:image"]');
    if (!twitterImage) {
      twitterImage = document.createElement('meta');
      twitterImage.setAttribute('property', 'twitter:image');
      document.head.appendChild(twitterImage);
    }
    twitterImage.setAttribute('content', 'https://snshero.com/logo.jpg');
  }, [view]);

  // Security & Routing: Redirect to home if not logged in and trying to access protected views
  useEffect(() => {
    if (!authInitialized) return;
    
    const protectedViews: ViewType[] = [];
    if (!effectiveUser && protectedViews.includes(view)) {
      if (testMode) console.log("Protecting view: redirecting to home because no user is active");
      setView('home');
    }
  }, [authInitialized, effectiveUser, view]);

  // Presence logic (Removed)
  useEffect(() => {
    // Standalone mode: no presence needed
  }, [user]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [botMessages, setBotMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showDefenseTestConsole, setShowDefenseTestConsole] = useState(false);
  const [showAllChats, setShowAllChats] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [localAiStatus, setLocalAiStatus] = useState<LocalAiCapabilityStatus>({
    supported: false,
    state: 'unavailable',
    provider: null,
    availability: 'unavailable',
  });
  const lastMessageIdRef = React.useRef<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

  const handleAttackFromChat = async (opponentId: string) => {
    if (!effectiveUser || effectiveUser.uid === 'guest-id') {
      showCustomAlert(
        language === 'ko' ? '로그인 필요' : 'LOGIN REQUIRED',
        t('login_required_ranking', language)
      );
      return;
    }

    setIsGlobalLoading(true);
    setGlobalLoadingMessage(t('loading_opponent', language));

    try {
      const opponentRef = doc(db, getUserCollectionName(currentSeason), opponentId);
      const opponentSnap = await getDoc(opponentRef);

      if (!opponentSnap.exists()) {
        showCustomAlert(
          language === 'ko' ? '오류' : 'ERROR',
          t('failed_load_opponent', language)
        );
        return;
      }

      const oppData = opponentSnap.data();
      const oppSns = oppData.sns || 0;

      // Allow attack regardless of opponent's SNS or my SNS size comparison in ranking mode
      const opp = {
        id: opponentId,
        name: oppData.name || oppData.displayName || 'Unknown',
        deck: oppData.currentDeck || [],
        totalPower: oppData.totalPower || 0,
        sns: oppSns,
        wins: oppData.stats?.wins || 0,
        losses: oppData.stats?.losses || 0,
        draws: oppData.stats?.draws || 0
      };

      setIsPvpActive(true);
      setPvpOpponent(opp);
      setView('play');
      setIsChatOpen(false);
    } catch (error) {
      console.error('Failed to load opponent for attack from chat:', error);
      showCustomAlert(
        language === 'ko' ? '오류' : 'ERROR',
        t('failed_load_opponent', language)
      );
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleCommunityUserAttack = async (opponentId: string, opponentName: string) => {
    if (!effectiveUser || effectiveUser.uid === 'guest-id') {
      showCustomAlert(
        language === 'ko' ? '로그인 필요' : 'LOGIN REQUIRED',
        t('login_required_ranking', language)
      );
      return;
    }

    setIsGlobalLoading(true);
    setGlobalLoadingMessage(t('loading_opponent', language));

    try {
      const opponentRef = doc(db, getUserCollectionName(currentSeason), opponentId);
      const opponentSnap = await getDoc(opponentRef);

      if (!opponentSnap.exists()) {
        showCustomAlert(
          language === 'ko' ? '오류' : 'ERROR',
          t('failed_load_opponent', language)
        );
        return;
      }

      const oppData = opponentSnap.data();
      const oppSns = oppData.sns || 0;

      const opp = {
        id: `ranking-${opponentId}`, // ranking- prefix to ensure it's tracked as a ranking PVP game
        name: oppData.name || oppData.displayName || opponentName || 'Unknown',
        deck: oppData.currentDeck || [],
        totalPower: oppData.totalPower || 0,
        sns: oppSns,
        wins: oppData.stats?.wins || 0,
        losses: oppData.stats?.losses || 0,
        draws: oppData.stats?.draws || 0
      };

      setIsPvpActive(true);
      setIsPvpBoardAttackActive(true);
      setPvpOpponent(opp);
      setView('play');
      setIsChatOpen(false);
    } catch (error) {
      console.error('Failed to load opponent for PVP board attack:', error);
      showCustomAlert(
        language === 'ko' ? '오류' : 'ERROR',
        t('failed_load_opponent', language)
      );
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleTranslateChat = async (msgId: string, text: string) => {
    if (!msgId) return;
    if (translatedTexts[msgId]) {
      setTranslatedTexts(prev => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
      return;
    }

    setTranslatingIds(prev => {
      const next = new Set(prev);
      next.add(msgId);
      return next;
    });

    try {
      const translated = await translateText(text, language);
      setTranslatedTexts(prev => ({
        ...prev,
        [msgId]: translated
      }));
    } catch (error) {
      console.error("Chat translation failed:", error);
    } finally {
      setTranslatingIds(prev => {
        const next = new Set(prev);
        next.delete(msgId);
        return next;
      });
    }
  };

  // =========================================================================
  // [IN-GAME MACRO RECORDER & PLAYBACK STATE]
  // =========================================================================
  const [showRecordBtn, setShowRecordBtn] = useState(false);
  const [isBootGateActive, setIsBootGateActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingActions, setRecordingActions] = useState<{
    x: number;
    y: number;
    scrollX: number;
    scrollY: number;
    tagName?: string;
    elementId?: string;
    classHint?: string;
    textHint?: string;
    selectorPath?: string;
    offsetXPercent?: number;
    offsetYPercent?: number;
    parents?: { tagName: string; elementId?: string; classHint?: string; textHint?: string }[];
    windowWidth: number;
    windowHeight: number;
    timestamp: number;
    time?: number;
  }[]>([]);
  const recordingActionsRef = React.useRef<{
    x: number;
    y: number;
    scrollX: number;
    scrollY: number;
    tagName?: string;
    elementId?: string;
    classHint?: string;
    textHint?: string;
    selectorPath?: string;
    offsetXPercent?: number;
    offsetYPercent?: number;
    parents?: { tagName: string; elementId?: string; classHint?: string; textHint?: string }[];
    windowWidth: number;
    windowHeight: number;
    timestamp: number;
    time?: number;
  }[]>([]);
  const recordingStartTimeRef = React.useRef<number>(0);
  const [showRecordResultModal, setShowRecordResultModal] = useState(false);
  const [showPlaybackPopup, setShowPlaybackPopup] = useState(false);
  const [playbackJson, setPlaybackJson] = useState("");
  const [isLoopPlayback, setIsLoopPlayback] = useState(false);
  const [isPlayingback, setIsPlayingback] = useState(false);
  const [playbackCurrentStep, setPlaybackCurrentStep] = useState(0);
  const [playbackTotalSteps, setPlaybackTotalSteps] = useState(0);
  const [playbackLogActions, setPlaybackLogActions] = useState<any[]>([]);
  const abortPlaybackRef = React.useRef(false);

  // Global mouse click listener for macro recording
  useEffect(() => {
    if (!isRecording) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Skip actions on the macro HUD itself to avoid recording panel click operations
      if (typeof target.className === 'string' && target.closest('.macro-ui')) return;
      if (target.closest && target.closest('.macro-ui')) return;

      // Extract telemetry locator hints for nested scroll-containers alignment
      const elemText = target.textContent?.trim().substring(0, 30) || "";
      const elemTagName = target.tagName.toLowerCase();
      const elemId = target.id ? `#${target.id}` : "";
      
      let classHint = "";
      if (target.className && typeof target.className === 'string') {
        const classes = target.className.split(/\s+/).filter(c => c && !c.includes(':') && !c.startsWith('hover') && !c.includes('[') && !c.includes(']') && c.length > 2);
        if (classes.length > 0) classHint = `.${classes[0]}`;
      }

      // Calculate relative click offset percentages
      const rect = target.getBoundingClientRect();
      const offsetXPercent = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0.5;
      const offsetYPercent = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.5;

      // Capture parent hierarchies
      const parents: { tagName: string; elementId?: string; classHint?: string; textHint?: string }[] = [];
      let parent = target.parentElement;
      for (let i = 0; i < 4 && parent; i++) {
        let pClassHint = "";
        if (parent.className && typeof parent.className === 'string') {
          const classes = parent.className.split(/\s+/).filter(c => c && !c.includes(':') && c.length > 2);
          if (classes.length > 0) pClassHint = `.${classes[0]}`;
        }
        parents.push({
          tagName: parent.tagName.toLowerCase(),
          elementId: parent.id ? `#${parent.id}` : undefined,
          classHint: pClassHint || undefined,
          textHint: parent.textContent?.trim().substring(0, 20) || undefined
        });
        parent = parent.parentElement;
      }

      const selectorPath = getCssSelector(target);

      const action = {
        x: e.clientX,
        y: e.clientY,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        tagName: elemTagName,
        elementId: elemId,
        classHint: classHint,
        textHint: elemText,
        selectorPath: selectorPath,
        offsetXPercent: offsetXPercent,
        offsetYPercent: offsetYPercent,
        parents: parents,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        timestamp: Date.now(),
        time: Date.now() - recordingStartTimeRef.current
      };
      
      recordingActionsRef.current.push(action);
      setRecordingActions([...recordingActionsRef.current]);
      console.log("%c [MACRO RECORD] Click Logged with Scroll & Hints: ", "background: #dc2626; color: #fff; font-weight: bold;", action);
    };

    // Use mousedown to capture triggers instantly before any components get unmounted
    window.addEventListener('mousedown', handleGlobalClick, true);
    return () => window.removeEventListener('mousedown', handleGlobalClick, true);
  }, [isRecording]);

  // Click pulse/ripple HUD feedback for playback accuracy
  const createVisualRipple = (x: number, y: number) => {
    const ripple = document.createElement('div');
    ripple.className = 'macro-ui fixed rounded-full border-4 border-yellow-400 pointer-events-none z-[9999]';
    ripple.style.left = `${x - 20}px`;
    ripple.style.top = `${y - 20}px`;
    ripple.style.width = '40px';
    ripple.style.height = '40px';
    ripple.style.transform = 'scale(0)';
    ripple.style.opacity = '0.9';
    ripple.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
    
    document.body.appendChild(ripple);
    ripple.getBoundingClientRect(); // force DOM reflow
    
    ripple.style.transform = 'scale(2.5)';
    ripple.style.opacity = '0';
    
    setTimeout(() => ripple.remove(), 500);
  };

  // Macro Playback Execution Loop
  const runMacroPlayback = async (actions: any[], isLoop: boolean) => {
    if (isPlayingback) return;
    setIsPlayingback(true); // 플레이백 상태 전격 활성화 (HUD 로깅 표출 시작!)
    setPlaybackTotalSteps(actions.length);
    setPlaybackCurrentStep(0);
    setPlaybackLogActions([]); // 재생 로그 초기화
    abortPlaybackRef.current = false;

    const executeSeq = async () => {
      let lastTime = actions[0]?.timestamp || 0;
      
        for (let i = 0; i < actions.length; i++) {
          // Halt sequence immediately on abort trigger
          if (abortPlaybackRef.current) {
            console.log("[MACRO PLAYBACK] Aborted in action loop!");
            break;
          }
          setPlaybackCurrentStep(i + 1);

          const act = actions[i];
          
          // Wait for recorded delay (1x Standard Playback Mode)
          if (i > 0) {
            // 병합 경계선(15초 이상 타임스탬프 갭 또는 역행 갭) 감지 시 딜레이를 1.5초(1500ms)의 안전 시간으로 스마트하게 스무딩!
            const timeGap = act.timestamp - lastTime;
            let delay = (timeGap > 15000 || timeGap < 0)
              ? 1500
              : Math.max(100, Math.min(8000, timeGap));
              
            // 1배속 정속 플레이 (안전 하한선 50ms 적용)
            delay = Math.max(50, delay);
              
            const startDelay = Date.now();
            while (Date.now() - startDelay < delay) {
              if (abortPlaybackRef.current) break;
              await new Promise(resolve => setTimeout(resolve, 30)); // 30ms 단위 서브 틱
            }
          }
          if (abortPlaybackRef.current) break;
          lastTime = act.timestamp;

          // 1. Locate the precise target element with Intelligent Telemetry Settle Delay
          let targetElem: HTMLElement | null = null;
          
          const findElement = (): HTMLElement | null => {
            const hasId = !!act.elementId;
            const hasValidText = act.textHint && act.textHint.trim().length > 0;
            const hasSelector = !!act.selectorPath;
            const isHighConfidence = hasId || hasValidText || hasSelector;

            if (!isHighConfidence) {
              return null;
            }

            // 1. Try ID query
            if (act.elementId) {
              try {
                const el = document.querySelector(act.elementId) as HTMLElement;
                if (el) {
                  const rect = el.getBoundingClientRect();
                  if (rect.width > 0 && rect.height > 0) return el;
                }
              } catch (e) {}
            }

            // 2. Try CSS selector path
            if (act.selectorPath) {
              try {
                const el = document.querySelector(act.selectorPath) as HTMLElement;
                if (el) {
                  const textMatch = !act.textHint || el.textContent?.trim().includes(act.textHint);
                  const rect = el.getBoundingClientRect();
                  if (textMatch && rect.width > 0 && rect.height > 0) return el;
                }
              } catch (e) {}
            }

            // 3. Fallback to Semantic Scoring Matcher scanning candidates
            let bestElem: HTMLElement | null = null;
            let bestScore = -99999;
            const queryTag = act.tagName || "*";
            let candidates: HTMLElement[] = [];
            try {
              candidates = Array.from(document.querySelectorAll(queryTag)) as HTMLElement[];
            } catch {
              try {
                candidates = Array.from(document.querySelectorAll("*")) as HTMLElement[];
              } catch {}
            }

            candidates = candidates.filter(el => {
              if (el.closest('.macro-ui') || el.classList.contains('macro-ui')) return false;
              const rect = el.getBoundingClientRect();
              if (rect.width === 0 && rect.height === 0) return false;
              return true;
            });

            for (const el of candidates) {
              let score = 0;

              // Tag match
              if (act.tagName && el.tagName.toLowerCase() === act.tagName.toLowerCase()) {
                score += 15;
              }

              // ID match
              if (act.elementId && el.id && `#${el.id}` === act.elementId) {
                score += 80;
              }

              // Class match
              if (act.classHint && el.className && typeof el.className === 'string') {
                if (el.className.includes(act.classHint.replace('.', ''))) {
                  score += 25;
                }
              }

              // Text match
              if (act.textHint) {
                const elText = el.textContent?.trim() || "";
                const actText = act.textHint.trim();
                if (elText === actText) {
                  score += 85;
                } else if (elText.includes(actText)) {
                  score += 40;
                  const lengthDiff = Math.abs(elText.length - actText.length);
                  score -= Math.min(30, Math.floor(lengthDiff / 4));
                } else {
                  // Do not penalize if the recorded hint looks like a dynamic numeric/stats string
                  const isDynamicOrNumeric = (text: string): boolean => {
                    const cleaned = text.trim();
                    if (!cleaned) return true;
                    return /^[0-9\s\+\-\*\/%,.:₩$€¥LvlNESW]+$/i.test(cleaned);
                  };
                  if (!isDynamicOrNumeric(actText)) {
                    score -= 50;
                  }
                }
              }

              // Parents hierarchy match
              if (act.parents && Array.isArray(act.parents)) {
                let pEl = el.parentElement;
                for (let depth = 0; depth < act.parents.length && pEl; depth++) {
                  const actParent = act.parents[depth];
                  if (!actParent) break;

                  if (pEl.tagName.toLowerCase() === actParent.tagName.toLowerCase()) {
                    score += 5;
                  }
                  if (actParent.elementId && pEl.id && `#${pEl.id}` === actParent.elementId) {
                    score += 10;
                  }
                  if (actParent.classHint && pEl.className && typeof pEl.className === 'string') {
                    if (pEl.className.includes(actParent.classHint.replace('.', ''))) {
                      score += 8;
                    }
                  }
                  if (actParent.textHint && pEl.textContent?.trim().includes(actParent.textHint)) {
                    score += 5;
                  }
                  pEl = pEl.parentElement;
                }
              }

              if (score > bestScore) {
                bestScore = score;
                bestElem = el;
              }
            }

            if (bestElem && bestScore >= 30) {
              return bestElem;
            }

            return null;
          };

          // 지능형 DOM 안착 폴링 대기 루프
          // 고신뢰 타겟 요소가 있는 경우, 해당 엘리먼트가 렌더링될 때까지 충분한 시간(최대 30초) 동안 폴링 대기합니다.
          const hasId = !!act.elementId;
          const hasValidText = act.textHint && act.textHint.trim().length > 0;
          const hasSelector = !!act.selectorPath;
          const isHighConfidence = hasId || hasValidText || hasSelector;
          
          const timeGap = i > 0 ? (act.timestamp - actions[i - 1].timestamp) : 0;
          const maxWaitDuration = isHighConfidence ? Math.max(8000, Math.min(30000, timeGap * 1.5)) : 1000;

          const startWait = Date.now();
          while (Date.now() - startWait < maxWaitDuration) {
            targetElem = findElement();
            if (targetElem) break;
            if (abortPlaybackRef.current) break;
            await new Promise(resolve => setTimeout(resolve, 80));
          }

          // 2. Perform intelligent scroll alignment
          if (targetElem) {
            console.log("[MACRO PLAYBACK] Match element found, scrolling into view:", targetElem);
            targetElem.scrollIntoView({
              block: 'center',
              inline: 'nearest',
              behavior: 'auto'
            });
            // 3배 속도 가속화에 맞춰 레이아웃 안착 대기시간을 500ms에서 150ms로 가속 단축!
            await new Promise(resolve => setTimeout(resolve, 150));
          } else {
            // Fallback to legacy window scrollTo if element was not queried
            if ((act.scrollX && act.scrollX !== 0) || (act.scrollY && act.scrollY !== 0)) {
              console.log(`[MACRO PLAYBACK] Element fallback, restoring window scroll to (${act.scrollX}, ${act.scrollY})`);
              window.scrollTo({
                left: act.scrollX || 0,
                top: act.scrollY || 0,
                behavior: 'auto'
              });
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          // 3. Compute final scaling resolution click target
          let clickX = Math.round(act.x * (window.innerWidth / act.windowWidth));
          let clickY = Math.round(act.y * (window.innerHeight / act.windowHeight));

          // Remap coordinates to the dynamically aligned element center or relative offset
          if (targetElem) {
            const rect = targetElem.getBoundingClientRect();
            if (act.offsetXPercent !== undefined && act.offsetYPercent !== undefined) {
              clickX = Math.round(rect.left + rect.width * act.offsetXPercent);
              clickY = Math.round(rect.top + rect.height * act.offsetYPercent);
            } else {
              clickX = Math.round(rect.left + rect.width / 2);
              clickY = Math.round(rect.top + rect.height / 2);
            }
          }

          // [CRITICAL FIX] 매크로 조작 UI(macro-ui) 자체를 가상 마우스가 타격하여 자가 격발 취소/중지시키는 현상 원천 차단!
          // elementFromPoint를 구할 때 macro-ui 내의 요소가 관통 잡히면, 임시로 pointerEvents = 'none' 처리하여 배후의 진짜 게임 요소를 투사 캡처합니다.
          let elem = document.elementFromPoint(clickX, clickY) as HTMLElement;
          const temporarilyDisabledElems: HTMLElement[] = [];
          
          while (elem && (elem.closest('.macro-ui') || elem.classList.contains('macro-ui'))) {
            const macroContainer = (elem.closest('.macro-ui') || elem) as HTMLElement;
            temporarilyDisabledElems.push(macroContainer);
            macroContainer.style.pointerEvents = 'none'; // 임시 패스스루 활성화
            elem = document.elementFromPoint(clickX, clickY) as HTMLElement;
          }
          
          // 투사 캡처가 모두 끝나면 임시 해제했던 pointer-events 상태를 원래대로 복구!
          temporarilyDisabledElems.forEach(el => {
            el.style.pointerEvents = 'auto';
          });

          if (elem) {
            createVisualRipple(clickX, clickY);
            
            const dispatchSingleClick = () => {
              const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: clickX, clientY: clickY });
              const mouseup = new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: clickX, clientY: clickY });
              const click = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: clickX, clientY: clickY });
              elem.dispatchEvent(mousedown);
              elem.dispatchEvent(mouseup);
              elem.dispatchEvent(click);
              if (elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement) {
                elem.focus();
              }
            };

            // [CRITICAL FEAT] 스마트 클릭 자가 재시도 검증 오라클 (Smart Click Verification & Auto-Retry Loop)
            // 1배속 정규 속도 환경에서 클릭 이벤트가 씹혀서 매크로가 헛도는 것을 방지하기 위해 다음 스텝 요소의 마운트 유무를 관찰!
            const nextAct = actions[i + 1];
            const nextTimeGap = nextAct ? (nextAct.timestamp - act.timestamp) : 0;
            if (nextAct) {
              const checkNextElementPresent = (): boolean => {
                // 다음 액션과의 간격이 3초를 초과하면 로딩/애니메이션 등으로 간주하여 즉시 존재 여부 검사를 통과 처리(재시도 방지)
                if (nextTimeGap > 3000) return true;

                const hasId = !!nextAct.elementId;
                const hasValidText = nextAct.textHint && nextAct.textHint.trim().length > 0;
                const hasSelector = !!nextAct.selectorPath;
                const isHighConfidence = hasId || hasValidText || hasSelector;
                
                if (!isHighConfidence) return true; // 검증 스킵 (성공으로 취급)

                if (nextAct.elementId) {
                  try {
                    if (document.querySelector(nextAct.elementId)) return true;
                  } catch (e) {}
                }
                if (nextAct.selectorPath) {
                  try {
                    if (document.querySelector(nextAct.selectorPath)) return true;
                  } catch (e) {}
                }
                if (nextAct.tagName) {
                  const query = `${nextAct.tagName}${nextAct.classHint || ""}`;
                  try {
                    const candidates = Array.from(document.querySelectorAll(query)) as HTMLElement[];
                    if (nextAct.textHint && nextAct.textHint.trim().length > 0) {
                      return candidates.some(c => c.textContent?.trim().includes(nextAct.textHint));
                    }
                  } catch {
                    return false;
                  }
                }
                return false;
              };

            let clickSuccess = false;
            // 최대 3회까지 영리한 재시도 클릭 사출
            for (let retry = 1; retry <= 3; retry++) {
              if (abortPlaybackRef.current) break;
              console.log(`[MACRO PLAYBACK] Step ${i + 1} - Dispatching click (Attempt ${retry}/3) on target:`, elem);
              dispatchSingleClick();

              // 다음 고신뢰 요소가 출현하는지 최대 1.5초(1500ms) 동안 150ms 간격으로 여유 있게 검사!
              const startCheck = Date.now();
              while (Date.now() - startCheck < 1500) {
                if (checkNextElementPresent()) {
                  console.log(`[MACRO PLAYBACK] Step ${i + 1} - Click confirmed active! Next element detected/bypassed.`);
                  clickSuccess = true;
                  break;
                }
                if (abortPlaybackRef.current) break;
                await new Promise(resolve => setTimeout(resolve, 150));
              }

              if (clickSuccess) break;
              if (retry < 3) {
                console.warn(`[MACRO PLAYBACK] Step ${i + 1} - Next target element missing. Retrying click...`);
              }
            }
          } else {
            // 시나리오의 마지막 액션인 경우 단발 클릭 격발 후 안전 대기
            console.log(`[MACRO PLAYBACK] Final Step ${i + 1} - Dispatching single click:`, elem);
            dispatchSingleClick();
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // 실시간 재생 완료 액션 로그 적립
          setPlaybackLogActions(prev => [...prev, act]);
        }
      }
    };

    try {
      let continueLoop = true;
      while (continueLoop && !abortPlaybackRef.current) {
        await executeSeq();
        // Break instantly if loop setting was toggled OFF or playback popup closed
        if (isLoop && !abortPlaybackRef.current) {
          // Delay next cycle using sub-tick abort checks
          const startLoopDelay = Date.now();
          while (Date.now() - startLoopDelay < 2000) {
            if (abortPlaybackRef.current) break;
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          continueLoop = false;
        }
      }
    } catch (err) {
      console.error("Playback error:", err);
    } finally {
      setIsPlayingback(false);
      setPlaybackCurrentStep(0);
      setPlaybackTotalSteps(0);
      
      // 메크로 종료 시 콘솔창(웹 개발자 도구) 및 화면 재생 팝업창 엔트리에 종료 알림 출력
      const statusMsg = abortPlaybackRef.current ? "메크로 재생 중지 완료" : "메크로 재생 완료";
      console.log(`[MACRO PLAYBACK] ${statusMsg}! Total actions: ${actions.length}`);
      
      setPlaybackLogActions(prev => [
        ...prev,
        {
          x: 0,
          y: 0,
          scrollY: 0,
          isSystemLog: true,
          systemMsg: abortPlaybackRef.current ? "⚡ [SYSTEM] PLAYBACK ABORTED" : "⚡ [SYSTEM] PLAYBACK COMPLETED"
        }
      ]);
      
      // [CRITICAL FEAT] 매크로 재생이 종료(성공 완주 또는 중지)되면 재생창(플로팅 HUD)도 자동으로 즉시 닫습니다!
      setShowPlaybackPopup(false);
      abortPlaybackRef.current = false;

      // 1.5초 후 실시간 로그 HUD 창도 자동으로 닫히도록 조치
      setTimeout(() => {
        setPlaybackLogActions([]);
      }, 1500);
    }
  };

  const allMessages = React.useMemo(() => {
    return [...messages, ...botMessages].sort((a, b) => {
      const getT = (val: any) => {
        if (!val) return 0;
        if (val.toDate) return val.toDate().getTime();
        return new Date(val).getTime();
      };
      return getT(a.createdAt) - getT(b.createdAt);
    }).slice(-50);
  }, [messages, botMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const appendBotMessage = useCallback((message: Omit<ChatMessage, 'id' | 'createdAt'> & Partial<Pick<ChatMessage, 'id' | 'createdAt'>>) => {
    const nextMessage: ChatMessage = {
      id: message.id ?? `bot-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: message.createdAt ?? new Date().toISOString(),
      ...message,
    };

    setBotMessages((prev) => [...prev.slice(-49), nextMessage]);
  }, []);

      useEffect(() => {
        if (allMessages.length > 0) {
          const latestMsg = allMessages[allMessages.length - 1];
          if (lastMessageIdRef.current !== latestMsg.id) {
            // New message arrived
            if (!isChatOpen && lastMessageIdRef.current !== null && (!latestMsg.isBot || (latestMsg as any).isAiReply)) {
              setUnreadCount(prev => prev + 1);
              // Play a subtle sound or trigger a more intense visual pulse here if desired
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); 
            }
            if (isChatOpen) {
              setTimeout(scrollToBottom, 50);
            }
            lastMessageIdRef.current = latestMsg.id;
          }
        }
      }, [allMessages, isChatOpen]);

  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
      setTimeout(scrollToBottom, 50);
    }
  }, [isChatOpen]);

  useEffect(() => {
    // Standalone mode: no quota needed
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncLocalAiStatus = async () => {
      const nextStatus = await getLocalAiCapabilityStatus();
      if (!cancelled) {
        setLocalAiStatus(nextStatus);
      }
    };

    void syncLocalAiStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Real-time chat listener
    const chatQuery = query(collection(db, 'chats'), orderBy('serverTime', 'desc'), limit(50));

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      let newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Filter out feedback messages for non-admin users
      const isAdmin = user?.email === 'dryudryu@gmail.com';
      newMessages = newMessages.filter(msg => {
        const isMsgFeedback = msg.isFeedback === true || (msg.name && msg.name.includes('[FEEDBACK]'));
        if (isMsgFeedback) {
          return isAdmin;
        }
        return true;
      });

      // Client-side filtering to avoid needing composite indexes
      if (!showAllChats) {
        newMessages = newMessages.filter(msg => !msg.language || msg.language === language);
      }
      
      setMessages(newMessages.reverse());
    });

    return () => unsubscribe();
  }, [showAllChats, language, user]);

  const finalizeTutorialCompletion = useCallback(() => {
    setIsTutorialMode(false);
    setTutorialStep(0);
    setIsAutoBattle(true);
    setSeasonItem('hero_tutorial_completed', currentSeason, 'true');
    trackCreatorEvent('tutorial_completed');
    createPendingReferralReward();

    // Grant Welcome Card (ID 1)
    setInventory(prev => {
      const newInv = {
        ...prev,
        1: {
          cardIndex: 1,
          quantity: Math.max(1, (prev[1]?.quantity || 0) + 1),
          rarity: 'gold'
        }
      };
      setSeasonItem('hero_inventory', currentSeason, JSON.stringify(newInv));
      setSeasonItem('hero_inventory_guest', currentSeason, JSON.stringify(newInv));
      return newInv;
    });
  }, [currentSeason]);

  const handleSkipTutorial = useCallback(() => {
    finalizeTutorialCompletion();
  }, [finalizeTutorialCompletion]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const text = chatInput.trim();
    setChatInput("");

    // Append to scrollable terminal-like command history if unique from the last sent entry
    setChatHistory(prev => {
      if (prev.length === 0 || prev[prev.length - 1] !== text) {
        return [...prev, text];
      }
      return prev;
    });
    setHistoryIndex(-1);

    // 슬래시(/) 명령어 처리: 채팅창 및 Firestore에 기록되지 않아야 함
    if (text.startsWith('/')) {
      const parsedAdminCommand = parseAdminCommand(text);
      if (parsedAdminCommand) {
        const isLocalAdminEnvironment = typeof window !== 'undefined'
          && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const isAdminAuthenticated = typeof window !== 'undefined'
          && localStorage.getItem('hero_admin_authenticated') === 'true';
        const isPrivilegedAccount = effectiveUser?.email === 'dryudryu@gmail.com' || effectiveUser?.uid === 'dryudryu';
        const canRunAdminSlash = isLocalAdminEnvironment || ((isAdminAuthenticated || isPrivilegedAccount) && testMode);

        if (!canRunAdminSlash) {
          appendBotMessage({
            userId: 'bot-admin-guard',
            name: t('admin_slash_bot_name', language),
            text: t('admin_slash_access_denied', language),
            isBot: true,
            language,
          });
          return;
        }

        if (parsedAdminCommand.ok === false) {
          appendBotMessage({
            userId: 'bot-admin-error',
            name: t('admin_slash_bot_name', language),
            text: t(parsedAdminCommand.errorKey, language),
            isBot: true,
            language,
          });
          return;
        }

        const adminCommand = parsedAdminCommand.command;

        switch (adminCommand.key) {
          case 'help': {
            appendBotMessage({
              userId: 'bot-admin-help',
              name: t('admin_slash_bot_name', language),
              text: t('admin_slash_help_intro', language),
              isBot: true,
              language,
              meta: {
                type: 'admin-help',
                items: buildAdminHelpItems(language, t),
              },
            });
            return;
          }
          case 'give-sns': {
            const command = adminCommand as Extract<ParsedAdminCommand, { key: 'give-sns' }>;
            await updateSns(command.amount, 'admin-slash-give-sns', 'earned');
            appendBotMessage({
              userId: 'bot-admin-give-sns',
              name: t('admin_slash_bot_name', language),
              text: t('admin_slash_result_give_sns', language, { amount: command.amount }),
              isBot: true,
              language,
            });
            return;
          }
          case 'give-card': {
            const command = adminCommand as Extract<ParsedAdminCommand, { key: 'give-card' }>;
            const dbCard = CARD_DATABASE[command.cardId];
            if (!dbCard) {
              appendBotMessage({
                userId: 'bot-admin-card-missing',
                name: t('admin_slash_bot_name', language),
                text: t('admin_slash_error_unknown_card', language, { cardId: command.cardId }),
                isBot: true,
                language,
              });
              return;
            }

            const nextInventory: Record<number, InventoryRecord> = { ...inventory };
            const existingRecord = nextInventory[command.cardId];
            nextInventory[command.cardId] = existingRecord
              ? {
                  ...existingRecord,
                  quantity: (existingRecord.quantity || 0) + command.quantity,
                }
              : {
                  cardIndex: command.cardId,
                  quantity: command.quantity,
                  rarity: (dbCard.rarity as InventoryRecord['rarity']) || 'bronze',
                  level: 1,
                  skills: [],
                  equipment: {},
                };

            setInventory(nextInventory);
            if (effectiveUser && effectiveUser.uid !== 'guest-id') {
              syncUserData({ inventory: nextInventory, lastSync: Date.now() });
            }

            appendBotMessage({
              userId: 'bot-admin-give-card',
              name: t('admin_slash_bot_name', language),
              text: t('admin_slash_result_give_card', language, {
                cardId: command.cardId,
                quantity: command.quantity,
                cardName: language === 'ko' ? dbCard.title : dbCard.title_en,
              }),
              isBot: true,
              language,
            });
            return;
          }
          case 'set-season': {
            const command = adminCommand as Extract<ParsedAdminCommand, { key: 'set-season' }>;
            if (command.season === currentSeason) {
              appendBotMessage({
                userId: 'bot-admin-season-same',
                name: t('admin_slash_bot_name', language),
                text: t('admin_slash_result_same_season', language, { season: command.season }),
                isBot: true,
                language,
              });
              return;
            }

            appendBotMessage({
              userId: 'bot-admin-season-confirm',
              name: t('admin_slash_bot_name', language),
              text: t('admin_slash_confirm_opened', language),
              isBot: true,
              language,
            });
            showCustomConfirm(
              t('admin_slash_confirm_title', language),
              t('admin_slash_confirm_set_season', language, { season: command.season }),
              () => {
                localStorage.setItem('hero_current_season', command.season);
                window.location.reload();
              },
            );
            return;
          }
          case 'clear-cache': {
            const protectedKeys = new Set([
              'hero_admin_authenticated',
              'hero_test_mode',
              'hero_current_season',
              'hero_language',
              'hero_theme',
            ]);
            const removableKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
              .filter((key): key is string => Boolean(key))
              .filter((key) => key.startsWith('hero_') && !protectedKeys.has(key));

            appendBotMessage({
              userId: 'bot-admin-cache-confirm',
              name: t('admin_slash_bot_name', language),
              text: t('admin_slash_confirm_opened', language),
              isBot: true,
              language,
            });
            showCustomConfirm(
              t('admin_slash_confirm_title', language),
              t('admin_slash_confirm_clear_cache', language, { count: removableKeys.length }),
              () => {
                removableKeys.forEach((key) => localStorage.removeItem(key));
                window.location.reload();
              },
            );
            return;
          }
          case 'mock-webtoon': {
            const seasonConfig = getWebtoonSeasonById(currentSeason) ?? WEBTOON_SEASONS[0];
            const releasedEpisodes = getWebtoonEpisodesForSeason(new Date(), seasonConfig)
              .filter((episode) => episode.releaseStatus !== 'upcoming');

            if (releasedEpisodes.length === 0) {
              appendBotMessage({
                userId: 'bot-admin-webtoon-empty',
                name: t('admin_slash_bot_name', language),
                text: t('admin_slash_result_mock_webtoon_empty', language),
                isBot: true,
                language,
              });
              return;
            }

            const lastEpisode = releasedEpisodes[releasedEpisodes.length - 1];
            const mockedProgress: WebtoonProgressState = {
              readEpisodeIds: releasedEpisodes.map((episode) => episode.id),
              lastEpisodeId: lastEpisode.id,
              lastPanelIndex: Math.max(0, lastEpisode.panels.length - 1),
              claimedRewardEpisodeIds: [],
              updatedAt: Date.now(),
            };
            saveWebtoonProgress(currentSeason, mockedProgress);
            setView('webtoon');
            setIsChatOpen(false);
            appendBotMessage({
              userId: 'bot-admin-webtoon',
              name: t('admin_slash_bot_name', language),
              text: t('admin_slash_result_mock_webtoon', language, { count: releasedEpisodes.length }),
              isBot: true,
              language,
            });
            return;
          }
          case 'low-spec': {
            const command = adminCommand as Extract<ParsedAdminCommand, { key: 'low-spec' }>;
            setLowSpecMode(command.enabled);
            if (effectiveUser && effectiveUser.uid !== 'guest-id') {
              syncUserData({ lowSpecMode: command.enabled, lastSync: Date.now() });
            }
            appendBotMessage({
              userId: 'bot-admin-low-spec',
              name: t('admin_slash_bot_name', language),
              text: t('admin_slash_result_low_spec', language, {
                status: command.enabled
                  ? t('admin_slash_low_spec_on', language)
                  : t('admin_slash_low_spec_off', language),
              }),
              isBot: true,
              language,
            });
            return;
          }
        }
      }

      if (isAdminSlashInput(text)) {
        return;
      }

      if (text === '/test') {
        const isAdmin = effectiveUser && (
          effectiveUser.email?.includes('dryudryu') || 
          effectiveUser.displayName?.includes('dryudryu') || 
          effectiveUser.uid === 'dryudryu'
        );
        if (isAdmin) {
          setIsChatOpen(false);
          setShowDefenseTestConsole(prev => !prev);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          return;
        }
      }

      if (text === '/rank') {
        setView('ranking');
        setIsChatOpen(false);
        return;
      }

      if (text === '/mec' || text === '/test mec' || text === '/rec' || text === '/test rec') {
        setIsChatOpen(false);
        if (text === '/mec' || text === '/rec') {
          setShowRecordBtn(true);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          return;
        }
        if (text === '/test mec' || text === '/test rec') {
          setShowPlaybackPopup(true);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          return;
        }
      }

      if (text.startsWith('/test ')) {
        const parts = text.split(' ');
        const subCommand = parts[1];
        if (subCommand !== 'mec' && subCommand !== 'rec') {
          const filename = text.substring(6).trim();
          if (filename) {
            setIsChatOpen(false);
            
            try {
              // First attempt: try /test/{filename}.js
              let fetchPath = `/test/${filename}`;
              if (!fetchPath.endsWith('.js')) {
                fetchPath += '.js';
              }
              console.log(`[MACRO FETCH] Trying ${fetchPath}`);
              let response = await fetch(`${fetchPath}?cb=${Date.now()}`);
              let fileContent = '';
              let contentType = response.headers.get('content-type') || '';
              
              let isValid = response.ok && !contentType.includes('text/html');
              if (isValid) {
                fileContent = await response.text();
                if (fileContent.trim().startsWith('<!') || fileContent.trim().startsWith('<html')) {
                  isValid = false;
                }
              }
              
              // Second attempt: try /{filename}.js if first failed
              if (!isValid) {
                let altPath = `/${filename}`;
                if (!altPath.endsWith('.js')) {
                  altPath += '.js';
                }
                console.log(`[MACRO FETCH] Trying fallback ${altPath}`);
                response = await fetch(`${altPath}?cb=${Date.now()}`);
                contentType = response.headers.get('content-type') || '';
                isValid = response.ok && !contentType.includes('text/html');
                if (isValid) {
                  fileContent = await response.text();
                  if (fileContent.trim().startsWith('<!') || fileContent.trim().startsWith('<html')) {
                    isValid = false;
                  }
                }
              }
              
              if (!isValid) {
                throw new Error(`Failed to fetch macro file (Tried /test/${filename}.js and /${filename}.js). Please make sure the file exists and is valid.`);
              }
              
              // Clean content to extract JSON array
              const firstBracket = fileContent.indexOf('[');
              const lastBracket = fileContent.lastIndexOf(']');
              if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                fileContent = fileContent.substring(firstBracket, lastBracket + 1);
              }
              
              const parsed = JSON.parse(fileContent);
              if (Array.isArray(parsed) && parsed.length > 0) {
                runMacroPlayback(parsed, false);
              } else {
                showCustomAlert(language === 'ko' ? '오류' : 'ERROR', `Error: Macro file does not contain a valid array.`);
              }
            } catch (err) {
              console.error(err);
              showCustomAlert(language === 'ko' ? '오류' : 'ERROR', `Failed to execute macro: ${(err as Error).message}`);
            }
            return;
          }
        }
      }

      if (text.startsWith('/testuser')) {
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const isAdmin = user?.email === 'dryudryu@gmail.com' || isLocalhost;
        if (isAdmin) {
          const parts = text.split(' ');
          const subCommand = parts[1];
          
          if (subCommand === 'setup') {
            setIsChatOpen(false);
            try {
              const q = query(collection(db, getUserCollectionName(currentSeason)), where('isVirtual', '==', true));
              const snap = await getDocs(q);
              if (snap.empty) {
                showCustomAlert(language === 'ko' ? '오류' : 'ERROR', 'No virtual users found. Run "/testuser 100" first.');
                return;
              }
              
              let batch = writeBatch(db);
              let writeCount = 0;
              for (const userDoc of snap.docs) {
                const userRef = doc(db, getUserCollectionName(currentSeason), userDoc.id);
                const randSns = Math.floor(Math.random() * 2501) + 500;
                batch.update(userRef, { sns: randSns });
                writeCount++;
                
                if (writeCount === 500) {
                  await batch.commit();
                  batch = writeBatch(db);
                  writeCount = 0;
                }
              }
              if (writeCount > 0) {
                await batch.commit();
              }
              showCustomAlert(language === 'ko' ? '성공' : 'SUCCESS', 'Successfully recovered SNS for all virtual users in Firestore!');
            } catch (e: any) {
              console.error(e);
              showCustomAlert(language === 'ko' ? '오류' : 'ERROR', `Failed to restore virtual users: ${e.message}`);
            }
            return;
          } else {
            const count = parseInt(subCommand) || 100;
            setIsChatOpen(false);
            try {
              const batchSize = Math.min(count, 200);
              let batch = writeBatch(db);
              let writeCount = 0;
              
              for (let i = 0; i < batchSize; i++) {
                const mockUser = createVirtualUser(i + 1);
                const userRef = doc(db, getUserCollectionName(currentSeason), mockUser.uid);
                batch.set(userRef, sanitizeForFirestore(mockUser));
                writeCount++;
                
                if (writeCount === 500) {
                  await batch.commit();
                  batch = writeBatch(db);
                  writeCount = 0;
                }
              }
              if (writeCount > 0) {
                await batch.commit();
              }
              showCustomAlert(language === 'ko' ? '성공' : 'SUCCESS', `Successfully generated ${batchSize} virtual users in Firestore!`);
            } catch (e: any) {
              console.error(e);
              showCustomAlert(language === 'ko' ? '오류' : 'ERROR', `Failed to generate virtual users: ${e.message}`);
            }
            return;
          }
        }
      }

      if (text === '/god' || text === '/test mode') {
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const isAdmin = user?.email === 'dryudryu@gmail.com' || isLocalhost;
        if (isAdmin) {
          if (text === '/god') {
            setView('god');
            setIsChatOpen(false);
            return;
          }
          if (text === '/test mode') {
            setTestMode(prev => {
              const next = !prev;
              localStorage.setItem('hero_test_mode', String(next));
              return next;
            });
            return;
          }
        }
      }

      // /로 시작하는 알 수 없는 명령어이거나 어드민 권한이 없는 경우에도 채팅창에 노출하지 않고 return
      return;
    }

    const chatId = `chat-${Date.now()}`;
    const newMsg = {
      id: chatId,
      userId: effectiveUser?.uid || 'guest',
      name: effectiveUser?.displayName || "Guest",
      text: text,
      createdAt: new Date().toISOString(),
      isBot: false,
      language: language
    };

    setMessages(prev => [...prev.slice(-49), newMsg]);

    // Firestore Sync for Chat
    try {
      await addDoc(collection(db, 'chats'), sanitizeForFirestore({
        ...newMsg,
        serverTime: serverTimestamp()
      }));
      if (testMode) {
        console.log("%c [FIRESTORE] Chat Sync: SUCCESS ", 'background: #065f46; color: #fff; font-weight: bold;');
      }
    } catch (e) {
      if (testMode) {
        console.error("%c [FIRESTORE] Chat Sync: FAILED ", 'background: #991b1b; color: #fff; font-weight: bold;', e);
      } else {
        console.error("Chat sync failed:", e);
      }
    }

    window.setTimeout(() => {
      void (async () => {
        const localAiReply = await requestLocalAiReply({ prompt: text, language });

        if (localAiReply.capability.availability !== localAiStatus.availability || localAiReply.capability.state !== localAiStatus.state) {
          setLocalAiStatus(localAiReply.capability);
        }

        if (localAiReply.ok && localAiReply.provider === 'chrome-built-in-ai') {
          appendBotMessage({
            id: `bot-local-ai-${Date.now()}`,
            userId: 'bot-chrome-local-ai',
            name: t('local_ai_bot_name', language),
            text: localAiReply.text,
            isBot: true,
            isAiReply: true,
            isLocalAiReply: true,
            aiBadgeLabel: t('local_ai_badge', language),
            createdAt: new Date().toISOString(),
            language,
          });
          return;
        }

        const aiNames = ['Google AI', 'DeepMind AI', 'Antigravity AI', 'Gemini Bot', 'SNSHero Bot'];
        const randomAiName = aiNames[Math.floor(Math.random() * aiNames.length)];
        appendBotMessage({
          id: `bot-res-${Date.now()}`,
          userId: `bot-${randomAiName.replace(/\s+/g, '_')}`,
          name: randomAiName,
          text: t('ai_reply_msg', language),
          isBot: true,
          isAiReply: true,
          createdAt: new Date().toISOString(),
          language,
        });
      })();
    }, 1000);
  };

  // Robot Taunts Logic (Persistent too)
  useEffect(() => {
    const tauntsKo = ["패배를 계산 중...", "오류 404: 당신의 실력을 찾을 수 없음", "삐리 빕.", "당신의 덱 구성은 열등합니다.", "데이터화될 준비를 하십시오.", "끝이다, 인간.", "저항은 무의미하다.", "당신의 약점을 분석 완료.", "나의 승률은 100%로 예측됩니다."];
    const tauntsEn = ["Calculating defeat...", "Error 404: Skill not found", "Beep boop.", "Your deck composition is inferior.", "Prepare to be digitized.", "It's over, human.", "Resistance is futile.", "Weakness analysis complete.", "Victory probability: 100%"];
    const interval = setInterval(async () => {
       if (Math.random() > 0.3) return; // Rare bot chats
       const robotName = `REPLICANT_0x${Math.floor(Math.random() * 255).toString(16).toUpperCase()}`;
       const baseText = tauntsKo[Math.floor(Math.random() * tauntsKo.length)];
       const text = language === 'ko' ? baseText : tauntsEn[tauntsKo.indexOf(baseText)];

       const newBotMsg = {
           id: `botchat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
           userId: `bot-${robotName}`,
           name: robotName,
           text: text,
           isBot: true,
           createdAt: new Date().toISOString(),
           language: language === 'ko' ? 'ko' : 'en'
       };

       setBotMessages(prev => [...prev.slice(-49), newBotMsg]);
    }, 60000); 
    return () => clearInterval(interval);
  }, [language]);

  const [challengeTargetId, setChallengeTargetId] = useState<string | null>(null);
  const [pvpOpponent, setPvpOpponent] = useState<{ id: string; name: string; deck: CardData[]; totalPower?: number; sns?: number; wins?: number; losses?: number; draws?: number } | null>(null);
  const [activeFriendBattleRequestId, setActiveFriendBattleRequestId] = useState<string | null>(null);
  const [isPvpActive, setIsPvpActive] = useState<boolean>(false);
  const [isPvpBoardAttackActive, setIsPvpBoardAttackActive] = useState<boolean>(false);









  // Collection of cards owned by the user (memoized from inventory)
  const ownedCards = useMemo(() => {
    // Start with initial cards but synced with actual inventory
    const baseCards = INITIAL_CARDS.map(c => syncCardWithDatabase(c, inventory));
    
    // Add any other cards present in inventory that aren't in baseCards
    const otherCardsIndices = Object.keys(inventory)
      .map(Number)
      .filter(idx => !isNaN(idx) && (inventory[idx]?.quantity || 0) > 0 && !INITIAL_CARDS.some(c => c.imageIndex === idx));
      
    const otherCards = otherCardsIndices.map(idx => {
      const dbCard = CARD_DATABASE[idx];
      if (!dbCard) return null;
      return syncCardWithDatabase({
        id: `inv-${idx}`,
        imageIndex: idx,
        title: dbCard.title,
        title_dis: dbCard.title_dis,
        title_en: dbCard.title_en,
        stats: [...dbCard.stats],
        rarity: dbCard.rarity,
        owner: null,
        level: inventory[idx]?.level || 1,
        skills: []
      }, inventory);
    }).filter(Boolean) as CardData[];

    return [...baseCards, ...otherCards];
  }, [inventory]);

  // State for test mode and auto-battle

  // Sound Settings
  const [bgmEnabled, setBgmEnabled] = useState(() => {
    const saved = localStorage.getItem('hero_bgm');
    return saved === null ? true : saved === 'true';
  });
  const [sfxEnabled, setSfxEnabled] = useState(() => {
    const saved = localStorage.getItem('hero_sfx');
    return saved === null ? true : saved === 'true';
  });

  const [bgmVolume, setBgmVolume] = useState(() => {
    const saved = localStorage.getItem('hero_bgm_volume');
    const parsed = saved ? parseFloat(saved) : NaN;
    return isNaN(parsed) ? 0.15 : parsed;
  });

  const [sfxVolume, setSfxVolume] = useState(() => {
    const saved = localStorage.getItem('hero_sfx_volume');
    const parsed = saved ? parseFloat(saved) : NaN;
    return isNaN(parsed) ? 0.4 : parsed;
  });

  const [bgmTrackId, setBgmTrackId] = useState(() => {
    const saved = localStorage.getItem('hero_bgm_track');
    return saved || 'helix-1';
  });

  const [bgmAudio] = useState(() => {
    const savedTrackId = localStorage.getItem('hero_bgm_track') || 'helix-1';
    const track = BGM_TRACKS.find(t => t.id === savedTrackId) || BGM_TRACKS[0];
    const audio = new Audio(track.url);
    audio.loop = true;
    audio.onerror = () => {
      console.warn("BGM audio load error, falling back to default track");
      if (audio.src !== BGM_TRACKS[0].url) {
        audio.src = BGM_TRACKS[0].url;
        audio.load();
      }
    };
    return audio;
  });

  useEffect(() => {
    if (bgmAudio) {
      bgmAudio.volume = bgmVolume;
      bgmAudio.muted = !bgmEnabled || bgmVolume === 0;
    }
  }, [bgmVolume, bgmEnabled, bgmAudio]);

  const [audioStarted, setAudioStarted] = useState(false);

  useEffect(() => {
    localStorage.setItem('hero_bgm_track', bgmTrackId);
    const track = BGM_TRACKS.find(t => t.id === bgmTrackId);
    if (track && bgmAudio) {
      const isPlaying = bgmEnabled && audioStarted && !bgmAudio.paused;
      bgmAudio.src = track.url;
      bgmAudio.volume = bgmVolume;
      bgmAudio.muted = !bgmEnabled || bgmVolume === 0;
      bgmAudio.load();
      bgmAudio.volume = bgmVolume;
      bgmAudio.muted = !bgmEnabled || bgmVolume === 0;
      if (isPlaying) {
        bgmAudio.play().catch(e => console.warn("Audio play blocked", e));
      }
    }
  }, [bgmTrackId, bgmAudio, bgmEnabled, audioStarted, bgmVolume]);

  const startAudio = useCallback(() => {
    if (audioStarted) return;
    setAudioStarted(true);
    if (bgmEnabled) {
      bgmAudio.play().catch(e => console.warn("Audio play blocked", e));
    }
  }, [audioStarted, bgmEnabled, bgmAudio]);

  const playSfx = useCallback((url: string) => {
    if (!sfxEnabled || !url) return;
    
    try {
      const audio = new Audio();
      audio.src = url;
      audio.volume = sfxVolume;
      
      // Attempt to play and handle promise
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          // Log only in test mode to reduce noise
          if (testMode) {
            console.warn("[SFX] Playback failed:", url, e.name);
          }
        });
      }
    } catch (err) {
      if (testMode) {
        console.warn("[SFX] Initialization failed:", err);
      }
    }
  }, [sfxEnabled, testMode]);

  const updateSns = useCallback(async (amount: number, reason?: string, typeOrTarget?: 'earned' | 'purchased' | string, targetName?: string) => {
    let nextPurchased = purchasedSns;
    let nextEarned = earnedSns;

    let actualType: 'earned' | 'purchased' = 'earned';
    let actualTargetName = targetName;
    if (typeOrTarget === 'earned' || typeOrTarget === 'purchased') {
      actualType = typeOrTarget;
    } else if (typeof typeOrTarget === 'string') {
      actualTargetName = typeOrTarget;
    }

    if (amount > 0) {
      // 획득 시: 타입 구분 적용 (지정이 없으면 기본 'earned' 획득)
      if (actualType === 'purchased') {
        nextPurchased += amount;
      } else {
        nextEarned += amount;
      }
    } else if (amount < 0) {
      // 소비/차감 시: 획득한 SNS(earnedSns) 선 차감 후, 부족할 경우 구매한 SNS(purchasedSns) 차감
      const cost = Math.abs(amount);
      if (nextEarned >= cost) {
        nextEarned -= cost;
      } else {
        const remainder = cost - nextEarned;
        nextEarned = 0;
        nextPurchased = Math.max(0, nextPurchased - remainder);
      }
    }

    const newSns = nextPurchased + nextEarned;
    setPurchasedSns(nextPurchased);
    setEarnedSns(nextEarned);
    setSns(newSns);

    // Save to localStorage immediately and notify listeners
    const season = currentSeason || localStorage.getItem('hero_current_season') || 'season1';
    try {
      localStorage.setItem(`hero_sns_${season}`, String(newSns));
      localStorage.setItem('hero_sns', String(newSns));
      localStorage.setItem('hero_purchased_sns', String(nextPurchased));
      localStorage.setItem('hero_earned_sns', String(nextEarned));
      window.dispatchEvent(new Event('snshero_sns_updated'));
      window.dispatchEvent(new Event('sns_updated'));
    } catch (e) {
      console.error("Failed to update local SNS storage:", e);
    }
    
    // Write SNS History
    const now = Date.now();
    const historyItem = {
      reason: reason || 'system',
      amount,
      timestamp: now,
      targetName: actualTargetName || ''
    };

    // 로컬스토리지에 저장
    try {
      const saved = localStorage.getItem('hero_sns_history');
      const list = saved ? JSON.parse(saved) : [];
      const newList = [historyItem, ...list].slice(0, 50);
      localStorage.setItem('hero_sns_history', JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to save local SNS history:", e);
    }

    // Firestore에 저장 (로그인 시)
    if (effectiveUser && effectiveUser.uid !== 'guest-id') {
      try {
        const currentSeason = localStorage.getItem('hero_current_season') || 'season1';
        const historyRef = collection(db, getUserCollectionName(currentSeason), effectiveUser.uid, 'snsHistory');
        await addDoc(historyRef, historyItem);
      } catch (e) {
        console.error("Failed to save Firestore SNS history:", e);
      }
    }

    // Immediate sync if logged in
    if (effectiveUser && effectiveUser.uid !== 'guest-id') {
      syncUserData({
        sns: newSns,
        purchasedSns: nextPurchased,
        earnedSns: nextEarned,
        inventory,
        stats,
        currentDeck,
        itemInventory,
        totalPower,
        displayName: effectiveUser.displayName || null,
        photoURL: effectiveUser.photoURL || null,
        isAutoBattle,
        lowSpecMode,
        language,
        lastSync: Date.now()
      });
    }
  }, [purchasedSns, earnedSns, effectiveUser, inventory, stats, currentDeck, itemInventory, totalPower, isAutoBattle, lowSpecMode, language, syncUserData]);

  const applyDeckUpgrade = useCallback((upgradedCardsToApply: { idx: number; imgIdx: number }[]) => {
    setCurrentDeck(prevDeck => {
      const newDeck = [...prevDeck];
      upgradedCardsToApply.forEach(({ idx, imgIdx }) => {
        const dbCard = CARD_DATABASE[imgIdx];
        if (!dbCard) return;
        
        const invData = inventory[imgIdx] || {};
        const newCard = syncCardWithDatabase({
          ...dbCard,
          id: `card-${imgIdx}-${Date.now()}`,
          imageIndex: imgIdx,
          owner: null,
          growth: invData.growth || 0,
          hunger: invData.hunger || 100,
          happiness: invData.happiness || 100,
          lastInteraction: invData.lastInteraction,
        }, inventory);
        newDeck[idx] = newCard;
      });

      // Play success SFX and Sync to Firestore
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      
      if (effectiveUser && effectiveUser.uid !== 'guest-id') {
        syncUserData({
          currentDeck: newDeck,
          lastSync: Date.now()
        });
      }
      return newDeck;
    });
    setUpgradeDeckPrompt(null);
  }, [inventory, effectiveUser, syncUserData, playSfx]);

  const checkAndRecommendDeckUpgrade = useCallback((newCardImageIndexes: number[], isSilent = false) => {
    if (!recommendMode) return [];
    if (!newCardImageIndexes || newCardImageIndexes.length === 0) return [];

    const upgradedCardsToApply = getDeckUpgradeRecommendation(currentDeck, newCardImageIndexes);

    if (upgradedCardsToApply.length > 0) {
      if (isSilent) {
        return upgradedCardsToApply;
      }
      
      setUpgradeDeckPrompt({ upgradedCardsToApply });
    }
    return [];
  }, [recommendMode, currentDeck, inventory, effectiveUser, syncUserData, playSfx]);

  const triggerDeckUpgradeCheck = useCallback((newCardImageIndexes: number[]) => {
    if (!recommendMode) return false;
    const upgradedCardsToApply = getDeckUpgradeRecommendation(currentDeck, newCardImageIndexes);
    if (upgradedCardsToApply.length > 0) {
      setUpgradeDeckPrompt({ upgradedCardsToApply });
      return true;
    }
    return false;
  }, [recommendMode, currentDeck]);



  // Achievement helper
  const triggerAchievement = useCallback((id: string, value: number) => {
    setStats(prev => {
      const currentProgress = prev.achievementProgress || {};
      const isAlreadyUnlocked = (prev.unlockedAchievements || []).includes(id);
      const isProgressSame = currentProgress[id] === value;

      if (isProgressSame && isAlreadyUnlocked) return prev;

      const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
      if (!achievement) return prev;

      const newProgress = { ...currentProgress, [id]: value };
      const newUnlocked = [...(prev.unlockedAchievements || [])];
      
      let newlyUnlocked = false;
      if (value >= achievement.targetValue && !isAlreadyUnlocked) {
        newUnlocked.push(id);
        newlyUnlocked = true;
        
        // Notify unlock (don't award yet)
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
      
      if (!newlyUnlocked && isProgressSame) return prev;

      return { 
        ...prev, 
        achievementProgress: newProgress,
        unlockedAchievements: newUnlocked 
      };
    });
  }, [playSfx]);

  const claimAchievementReward = useCallback((id: string) => {
    const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return;

    setStats(prev => {
      const isUnlocked = (prev.unlockedAchievements || []).includes(id);
      const isAlreadyClaimed = (prev.claimedAchievements || []).includes(id);

      if (!isUnlocked || isAlreadyClaimed) return prev;

      const newClaimed = [...(prev.claimedAchievements || []), id];
      
      // Award reward
      if (achievement.rewardType === 'coins') {
        updateSns(achievement.rewardAmount);
      }
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

      return {
        ...prev,
        claimedAchievements: newClaimed
      };
    });
  }, [updateSns, playSfx]);



  // Achievement Trackers
  useEffect(() => {
    // Battle
    triggerAchievement('battle_wins_1', stats.wins);
    triggerAchievement('battle_wins_10', stats.wins);
    triggerAchievement('battle_wins_50', stats.wins);
    triggerAchievement('battle_wins_100', stats.wins);
    triggerAchievement('battle_wins_500', stats.wins);
    
    triggerAchievement('battle_streak_3', stats.winStreak);
    triggerAchievement('battle_streak_5', stats.winStreak);
    triggerAchievement('battle_streak_10', stats.winStreak);

    // Collection
    const uniqueCount = Object.keys(inventory).length;
    const totalCount = Object.values(inventory).reduce((acc, r: any) => acc + r.quantity, 0);
    triggerAchievement('coll_total_10', totalCount);
    triggerAchievement('coll_total_50', totalCount);
    triggerAchievement('coll_total_100', totalCount);
    triggerAchievement('coll_unique_10', uniqueCount);
    triggerAchievement('coll_unique_50', uniqueCount);

    // SNS Spent (we don't have totalSpent yet, but we could add it)
  }, [stats.wins, stats.winStreak, inventory, triggerAchievement]);

  // Selected Companion index (0-4)
  const [selectedCompanionIndex, setSelectedCompanionIndex] = useState(0);

  const selectedCompanion = useMemo(() => {
    const comp = currentDeck[selectedCompanionIndex];
    return comp ? syncCardWithDatabase(comp, inventory) : null;
  }, [currentDeck, selectedCompanionIndex, inventory]);

  const [itemDropNotification, setItemDropNotification] = useState<Item | null>(null);

  // Auto-close item drop notification during auto-battle
  useEffect(() => {
    if (isAutoBattle && itemDropNotification) {
      const timer = setTimeout(() => {
        setItemDropNotification(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAutoBattle, itemDropNotification]);

  // AI Strategy
  const [aiStrategy, setAiStrategy] = useState<AiStrategy>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hero_ai_strategy');
      if (saved) return saved as AiStrategy;
    }
    return 'balanced';
  });
  const [botAiStrategy, setBotAiStrategy] = useState<AiStrategy>(() => {
    const saved = localStorage.getItem('hero_bot_ai_strategy');
    return (saved as AiStrategy) || 'balanced';
  });
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hero_ai_difficulty');
      if (saved) return saved as AiDifficulty;
    }
    return 'medium';
  });
  const [botRole, setBotRole] = useState<BotRole>('helpful');
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const [isSimulationActive, setIsSimulationActive] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('hero_simulation_active') === 'true' : false;
  });
  const [isAutoLoop, setIsAutoLoop] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('hero_simulation_autoloop') === 'true' : false;
  });
  const [lastTestReport, setLastTestReport] = useState<any | null>(null);

  // Idle Detection for Auto-Battle removed

  // Sync simulation states to localStorage
  useEffect(() => {
    localStorage.setItem('hero_simulation_active', JSON.stringify(isSimulationActive));
  }, [isSimulationActive]);

  useEffect(() => {
    localStorage.setItem('hero_simulation_autoloop', JSON.stringify(isAutoLoop));
  }, [isAutoLoop]);
  const [testErrorHistory, setTestErrorHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!guestDataLoaded) return;
    localStorage.setItem('hero_ai_strategy', aiStrategy);
  }, [aiStrategy, guestDataLoaded]);

  useEffect(() => {
    if (!guestDataLoaded) return;
    localStorage.setItem('hero_bot_ai_strategy', botAiStrategy);
  }, [botAiStrategy, guestDataLoaded]);

  useEffect(() => {
    if (!guestDataLoaded) return;
    localStorage.setItem('hero_ai_difficulty', aiDifficulty);
  }, [aiDifficulty, guestDataLoaded]);

  // Global stats decay for deck companions (Hunger & Happiness)
  // 100% over 24 hours = ~0.0694% per minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDeck(prevDeck => {
        let changed = false;
        const newDeck = prevDeck.map(card => {
          if (!card) return card;
          const currentHunger = card.hunger ?? 100;
          const currentHappiness = card.happiness ?? 100;
          
          if (currentHunger <= 0 && currentHappiness <= 0) return card;
          
          changed = true;
          return {
            ...card,
            hunger: Math.max(0, currentHunger - 0.0694),
            happiness: Math.max(0, currentHappiness - 0.0694)
          };
        });
        return changed ? newDeck : prevDeck;
      });
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);
  const isUpdatingSkill = useRef(false);
  // Use refs to track latest state for async callbacks (avoids stale closures in updateInventoryInSupabase etc.)
  const inventoryRef = useRef<Record<number, InventoryRecord>>(inventory);
  const itemInventoryRef = useRef<Item[]>(itemInventory);
  
  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);

  useEffect(() => {
    itemInventoryRef.current = itemInventory;
  }, [itemInventory]);

  const updateInventoryInSupabase = useCallback(async (cardIndex: number, updates: Partial<InventoryRecord>) => {
    // Standalone mode: sync to localStorage if needed, or already handled by setInventory
  }, []);

  const handleUpgradeSkill = useCallback((skillId: string) => {
    if (isUpdatingSkill.current) return;
    
    const companionForCost = currentDeck[selectedCompanionIndex];
    if (!companionForCost) return;
    const skillsForCost = companionForCost.skills || [...INITIAL_SKILLS.map(s => ({ ...s }))];
    const skillForCost = skillsForCost.find(s => s.id === skillId);
    if (!skillForCost) return;
    
    const cost = getSkillUpgradeCost(skillForCost.level);
    if (sns < cost) {
      showCustomAlert(language === 'ko' ? '포인트 부족' : 'INSUFFICIENT SNS', language === 'ko' ? 'SNS 포인트가 부족합니다.' : 'Not enough SNS Points.');
      return;
    }

    isUpdatingSkill.current = true;
    setTimeout(() => { isUpdatingSkill.current = false; }, 500);

    const isFree = false;
    
    const updatedDeck = [...currentDeck];
    const activeCompanion = updatedDeck[selectedCompanionIndex];
    if (!activeCompanion) return;
    
    const compSkills = activeCompanion.skills || [...INITIAL_SKILLS.map(s => ({ ...s }))];
    const skillIndex = compSkills.findIndex(s => s.id === skillId);
    const skill = compSkills[skillIndex];
    if (!skill) return;
    
    const nextSkills = [...compSkills];
    const nextLevel = (activeCompanion.level || 1) + 1;
    nextSkills[skillIndex] = { ...skill, level: skill.level + 1 };
    
    const updatedComp = { ...activeCompanion, skills: nextSkills, level: nextLevel };
    updatedComp.power = getCardPower(updatedComp);
    updatedDeck[selectedCompanionIndex] = updatedComp;

    const updatedInventory = { ...inventory };
    if (activeCompanion.imageIndex !== undefined) {
      const activeCompRecord = updatedInventory[activeCompanion.imageIndex];
      if (activeCompRecord) {
        updatedInventory[activeCompanion.imageIndex] = {
          ...activeCompRecord,
          skills: nextSkills,
          level: nextLevel
        };
      }
    }

    setCurrentDeck(updatedDeck);
    setInventory(updatedInventory);
    updateSns(-cost);

    // Immediate sync if logged in
    if (effectiveUser && effectiveUser.uid !== 'guest-id') {
      syncUserData({
        sns: sns - cost,
        inventory: updatedInventory,
        stats,
        currentDeck: updatedDeck,
        itemInventory,
        totalPower,
        displayName: effectiveUser.displayName || null,
        photoURL: effectiveUser.photoURL || null,
        isAutoBattle,
        lowSpecMode,
        language,
        lastSync: Date.now()
      });
    }
  }, [sns, selectedCompanionIndex, language, updateSns, inventory, currentDeck, effectiveUser, stats, itemInventory, totalPower, isAutoBattle, lowSpecMode, syncUserData]);

  const [customCardImage, setCustomCardImage] = useState<string | null>(() => {
    return localStorage.getItem('hero_custom_card_image');
  });

  // Sync totalPower when inventory changes or deck changes
  useEffect(() => {
    const basePowerContribution = Object.entries(inventory).reduce((acc, [idx, record]) => {
      const cardIdx = Number(idx);
      const quantity = (record as any).quantity || 0;
      const dbBasePower = CARD_DATABASE[cardIdx]?.power || 0;
      
      // If this card is in the deck, it might have point bonuses and multipliers
      const deckCard = currentDeck.find(c => c?.imageIndex === cardIdx);
      if (deckCard) {
        const pointBonus = getSkillPointBonus(deckCard);
        const multiplier = getPowerMultiplier(deckCard);
        const unitPower = (dbBasePower + pointBonus) * multiplier;
        return acc + (unitPower * quantity);
      }
      
      return acc + (dbBasePower * quantity);
    }, 0);
    
    // Any other global bonus power (like from items or hero AI)
    const extraBonusPower = currentDeck.reduce((acc, card) => {
      if (!card) return acc;
      const equipmentPower = Object.values(card.equipment || {}).reduce((sum: number, item) => sum + ((item as Item)?.stats?.reduce((a,b)=>a+b, 0) || 0) * 10, 0);
      const multiplier = getPowerMultiplier(card);
      return acc + ((card.bonusPower || 0) + equipmentPower) * multiplier;
    }, 0);

    const calculated = Math.round(basePowerContribution + extraBonusPower);
    
    if (calculated !== totalPower) {
      setTotalPower(calculated);
    }
  }, [inventory, currentDeck, totalPower]);

  // Sync customCardImage
  useEffect(() => {
    if (customCardImage) {
      try {
        localStorage.setItem('hero_custom_card_image', customCardImage);
      } catch (err) {
        console.error('LocalStorage sync error:', err);
      }
    } else {
      localStorage.removeItem('hero_custom_card_image');
    }
  }, [customCardImage]);

  // Image processing logic removed to rely purely on CSS sprite sheeting
  useEffect(() => {
    // No-op
  }, [customCardImage]);

  const [shopConfig, setShopConfig] = useState<any>({
    bronzePack: { gold: 0.1, silver: 1.1 },
    silverPack: { gold: 0.3, bronze: 50.3 },
    goldPack: { gold: 1.0, silver: 69.0 }
  });

  // Shop Config (Local)
  useEffect(() => {
    // Standalone mode: use default shop config
  }, []);

  const getDeckFingerprint = useCallback((deck: (CardData | null)[]) => {
    return JSON.stringify(deck.map(c => ({
      imageIndex: c?.imageIndex,
      skills: c?.skills,
      equipment: c?.equipment,
      level: c?.level,
      exp: c?.exp,
      customName: c?.customName,
      notes: c?.notes
    })));
  }, []);

  // Refs to track sync state and avoid write loops
  const lastDeckSyncRef = React.useRef<string>(getDeckFingerprint(INITIAL_CARDS.slice(0, 5).map(c => syncCardWithDatabase(c, {}))));
  const lastAiStrategySyncRef = React.useRef<AiStrategy>(aiStrategy);
  const lastAiDifficultySyncRef = React.useRef<AiDifficulty>(aiDifficulty);

  const updateDeck = useCallback((newDeck: CardData[]) => {
    const syncedDeck = newDeck.map(c => syncCardWithDatabase(c, inventory));
    setCurrentDeck(syncedDeck);
    if (typeof window !== 'undefined') {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      setSeasonItem('hero_deck', season, JSON.stringify(syncedDeck));
      setSeasonItem('hero_deck_guest', season, JSON.stringify(syncedDeck));
      localStorage.setItem('hero_deck', JSON.stringify(syncedDeck));
    }
  }, [inventory]);

  // Sync AI Strategy
  useEffect(() => {
    if (!guestDataLoaded) return;
    localStorage.setItem('hero_ai_strategy', aiStrategy);
    lastAiStrategySyncRef.current = aiStrategy;
  }, [aiStrategy, guestDataLoaded]);

  // Sync AI Difficulty
  useEffect(() => {
    if (!guestDataLoaded) return;
    localStorage.setItem('hero_ai_difficulty', aiDifficulty);
    lastAiDifficultySyncRef.current = aiDifficulty;
  }, [aiDifficulty, guestDataLoaded]);

  // Sync currentDeck locally if needed or remove sync logic
  useEffect(() => {
    if (!guestDataLoaded) return;
    setSeasonItem('hero_deck_guest', currentSeason, JSON.stringify(currentDeck));
  }, [currentDeck, guestDataLoaded, currentSeason]);

  // Load from Supabase (Removed)
  useEffect(() => {
    // Standalone mode: no remote loading
  }, []);

  useEffect(() => {
    if (!guestDataLoaded) {
      setGuestDataLoaded(true);
    }
  }, [guestDataLoaded]);

  // Real-time listener for user data (Removed)
  useEffect(() => {
    // Standalone mode: no remote listener
  }, [effectiveUser]);

  // Sync deck and detailed inventory
  useEffect(() => {
    if (!guestDataLoaded) return;
    setSeasonItem('hero_deck', currentSeason, JSON.stringify(currentDeck));
    setSeasonItem('hero_itemInventory', currentSeason, JSON.stringify(itemInventory));
    setSeasonItem('hero_sns', currentSeason, sns.toString());
    setSeasonItem('hero_stats', currentSeason, JSON.stringify(stats));
    setSeasonItem('hero_totalPower', currentSeason, totalPower.toString());
    setSeasonItem('hero_inventory', currentSeason, JSON.stringify(inventory));
    
    if (cloudDataLoadedRef.current) {
      setSeasonItem('hero_lastSync', currentSeason, Date.now().toString());
    }
  }, [currentDeck, itemInventory, sns, totalPower, stats, inventory, guestDataLoaded, currentSeason]);

  // Persistent localStorage
  useEffect(() => {
    if (!guestDataLoaded) return;
    setSeasonItem('hero_sns_guest', currentSeason, sns.toString());
    setSeasonItem('hero_stats_guest', currentSeason, JSON.stringify(stats));
    setSeasonItem('hero_totalPower_guest', currentSeason, totalPower.toString());
    setSeasonItem('hero_inventory_guest', currentSeason, JSON.stringify(inventory));
    setSeasonItem('hero_itemInventory_guest', currentSeason, JSON.stringify(itemInventory));
  }, [sns, stats, totalPower, inventory, itemInventory, user, effectiveUser, guestDataLoaded, currentSeason]);


  const updateCompanion = useCallback((updates: Partial<CardData>) => {
    setCurrentDeck(prev => {
      const newDeck = [...prev];
      if (newDeck[selectedCompanionIndex]) {
        newDeck[selectedCompanionIndex] = syncCardWithDatabase({ ...newDeck[selectedCompanionIndex], ...updates }, inventory);
      }
      return newDeck;
    });
  }, [selectedCompanionIndex, inventory]);

  const equipItem = useCallback((itemId: string, deckIndex: number, forcedSlot?: EquipmentSlot) => {
    setItemInventory(prev => {
      let isNewSimItem = false;
      let item = prev.find(i => i.id === itemId);
      
      if (!item && itemId.startsWith('sim-item-')) {
        const dbIdxStr = itemId.replace('sim-item-', '');
        const dbIdx = parseInt(dbIdxStr);
        const dbItem = ITEM_DATABASE[dbIdx];
        if (dbItem) {
          // Grant the sim item to the impersonated user as a REAL item
          item = {
            ...dbItem,
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            equippedToId: deckIndex.toString(),
            ownerId: effectiveUser?.uid || effectiveUser?.id || null
          };
          isNewSimItem = true;
          // Play a special sound for granting item in SIM mode
          playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        }
      }

      if (!item) return prev;

      const slot = forcedSlot || item.slot;
      
      // Update item to show which card it's equipped to
      const nextInv = prev.map(i => {
        // If another item was equipped in this slot on this card, unequip it
        const currentEquippedId = currentDeck[deckIndex]?.equipment?.[slot]?.id;
        if (currentEquippedId && i.id === currentEquippedId) {
          return { ...i, equippedToId: null };
        }
        if (!isNewSimItem && i.id === itemId) {
          return { ...i, equippedToId: deckIndex.toString() };
        }
        return i;
      });

      if (isNewSimItem && item) {
        nextInv.push(item);
      }

      // Update card's equipment
      const equippedItemForDeck = item; // Capture the bound item reference
      
      setInventory(inv => {
        const cardInDeck = currentDeck[deckIndex];
        if (cardInDeck && cardInDeck.imageIndex !== undefined) {
          const nextInv = { ...inv };
          const record = nextInv[cardInDeck.imageIndex] || { 
            cardIndex: cardInDeck.imageIndex, 
            quantity: 1, 
            rarity: cardInDeck.rarity 
          };
          const nextEquipment = {
            ...(record.equipment || {}),
            [slot]: equippedItemForDeck
          };
          
          // Remote sync removed
          nextInv[cardInDeck.imageIndex] = {
            ...record,
            equipment: nextEquipment
          };
          return nextInv;
        }
        return inv;
      });

      setCurrentDeck(deck => {
        const newDeck = [...deck];
        const card = newDeck[deckIndex];
        if (card) {
          const nextEquipment = {
            ...(card.equipment || {}),
            [slot]: equippedItemForDeck
          };
          const updatedCard = { ...card, equipment: nextEquipment };
          updatedCard.power = getCardPower(updatedCard);
          newDeck[deckIndex] = updatedCard;
        }
        return newDeck;
      });

      // Immediate sync if logged in
      if (effectiveUser && effectiveUser.uid !== 'guest-id') {
        syncUserData({
          sns,
          inventory,
          stats,
          currentDeck: currentDeck.map((c, i) => {
            if (i !== deckIndex) return c;
            const nextEq = { ...(c.equipment || {}), [slot]: equippedItemForDeck };
            const uCard = { ...c, equipment: nextEq };
            uCard.power = getCardPower(uCard);
            return uCard;
          }),
          itemInventory: nextInv,
          totalPower,
          displayName: effectiveUser.displayName || null,
          photoURL: effectiveUser.photoURL || null,
          isAutoBattle,
          lowSpecMode,
          language,
          lastSync: Date.now()
        });
      }

      return nextInv;
    });
  }, [effectiveUser, sns, inventory, stats, currentDeck, itemInventory, totalPower, isAutoBattle, lowSpecMode, language, syncUserData]);

  const unequipItem = useCallback((itemId: string, deckIndex: number, forcedSlot?: EquipmentSlot) => {
    setItemInventory(prev => {
      let item = prev.find(i => i.id === itemId);
      
      // If not in item bag, try to find it in the card's equipment itself (important for SIM items)
      if (!item) {
        const cardInDeck = currentDeck[deckIndex];
        if (cardInDeck && cardInDeck.equipment) {
          const found = Object.values(cardInDeck.equipment).find((it: any) => it.id === itemId) as Item | undefined;
          if (found) item = found;
        }
      }

      if (!item) return prev;

      const slot = forcedSlot || item.slot;
      const nextInvList = prev.map(i => i.id === itemId ? { ...i, equippedToId: null } : i);

      setInventory(inv => {
        const cardInDeck = currentDeck[deckIndex];
        if (cardInDeck && cardInDeck.imageIndex !== undefined) {
          const nextInvState = { ...inv };
          const record = nextInvState[cardInDeck.imageIndex] || {
            cardIndex: cardInDeck.imageIndex,
            quantity: 1,
            rarity: cardInDeck.rarity
          };
          
          const nextEquip = { ...(record.equipment || {}) };
          delete nextEquip[slot];
          
          // Remote sync removed
          nextInvState[cardInDeck.imageIndex] = { ...record, equipment: nextEquip };
          return nextInvState;
        }
        return inv;
      });

      setCurrentDeck(deck => {
        const newDeck = [...deck];
        const card = newDeck[deckIndex];
        if (card) {
          const nextEquip = { ...(card.equipment || {}) };
          delete nextEquip[slot];
          const updatedCard = { ...card, equipment: nextEquip };
          updatedCard.power = getCardPower(updatedCard);
          newDeck[deckIndex] = updatedCard;
        }
        return newDeck;
      });

      // Immediate sync if logged in
      if (effectiveUser && effectiveUser.uid !== 'guest-id') {
        syncUserData({
          sns,
          inventory,
          stats,
          currentDeck: currentDeck.map((c, i) => {
            if (i !== deckIndex) return c;
            const nextEq = { ...(c.equipment || {}) };
            delete nextEq[slot];
            const uCard = { ...c, equipment: nextEq };
            uCard.power = getCardPower(uCard);
            return uCard;
          }),
          itemInventory: nextInvList,
          totalPower,
          displayName: effectiveUser.displayName || null,
          photoURL: effectiveUser.photoURL || null,
          isAutoBattle,
          lowSpecMode,
          language,
          lastSync: Date.now()
        });
      }

      return nextInvList;
    });
  }, [effectiveUser, sns, inventory, stats, currentDeck, itemInventory, totalPower, isAutoBattle, lowSpecMode, language, syncUserData]);

  // Time-based stat decay for all active companions in deck
  useEffect(() => {
    // Standalone decay removed or implemented locally
  }, []);

  const getSkillEffect = (type: string, cardSkills?: Skill[]) => {
    if (!cardSkills) return 0;
    return cardSkills.filter(s => s.effect.type === type).reduce((acc, s) => {
      const completedTiers = Math.floor((s.level + 1) / 6);
      return acc + (s.effect.value * completedTiers);
    }, 0);
  };

  const totalSkillEffect = useCallback((type: string) => {
    return currentDeck.reduce((acc, card) => {
      if (!card) return acc;
      return acc + getSkillEffect(type, card.skills);
    }, 0);
  }, [currentDeck]);

  const totalMagicChance = useMemo(() => {
    return currentDeck.reduce((acc, card) => {
      if (!card || !card.equipment) return acc;
      return acc + Object.values(card.equipment).reduce((itemAcc, item: any) => {
        return itemAcc + (item?.magicChance || 0);
      }, 0);
    }, 0);
  }, [currentDeck]);

  const addItem = useCallback((rarity?: ItemRarity, idOverride?: string) => {
    if (testMode) {
      console.log(`%c [DEBUG] addItem Triggered: Rarity=${rarity || 'AUTO'}, ID=${idOverride || 'RANDOM'} `, 'color: #9333ea; font-weight: bold;');
    }
    // Determine rarity based on acquisition rates if not provided
    let selectedRarity: ItemRarity = rarity || 'normal';
    if (!rarity) {
      const bonus = (totalMagicChance || 0) / 100; // 100 magicChance = +100% relative bonus
      const rand = Math.random();
      
      const rareTarget = 0.1 * (1 + bonus);
      const magicTarget = 0.3 * (1 + bonus);

      if (rand < rareTarget) selectedRarity = 'rare';
      else if (rand < rareTarget + magicTarget) selectedRarity = 'magic';
      else selectedRarity = 'normal';
    }

    let baseItem: any;
    if (idOverride) {
      baseItem = ITEM_DATABASE.find(i => i.name_en === idOverride);
    }
    if (!baseItem) {
      const possibleItems = ITEM_DATABASE.filter(i => i.rarity === selectedRarity);
      baseItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    }
    
    const newItem: Item = {
      ...baseItem,
      id: Math.random().toString(36).substring(2, 11),
      equippedToId: null
    };

    setItemInventory(prev => {
      const next = [...prev, newItem];
      
      // Immediate sync if logged in
      if (effectiveUser && effectiveUser.uid !== 'guest-id') {
        if (testMode) console.log("%c [DEBUG] Requesting Firestore Sync for Item... ", 'color: #8b5cf6;');
        syncUserData({
          sns,
          inventory,
          stats,
          currentDeck,
          itemInventory: next,
          totalPower,
          displayName: effectiveUser.displayName || null,
          photoURL: effectiveUser.photoURL || null,
          isAutoBattle,
          lowSpecMode,
          language,
          lastSync: Date.now()
        });
      } else if (testMode) {
        console.log("%c [DEBUG] Local Item Save (Guest/Offline) ", 'color: #6b7280;');
      }
      
      return next;
    });

    return newItem;
  }, [effectiveUser, sns, inventory, stats, currentDeck, totalPower, isAutoBattle, lowSpecMode, language, syncUserData]);

  const recordMatchResult = useCallback(async (
    result: 'win' | 'loss' | 'draw', 
    rewardOverride?: number, 
    sessionPatterns?: Partial<PlayerPatterns>, 
    battleType?: 'robot' | 'user' | 'pvp_attack',
    opponentInfo?: { id: string; name: string; sns?: number; wins?: number; losses?: number; draws?: number }
  ) => {
    if (isPlaygroundMode) {
      return;
    }
    // 일일 미션 진행도 업데이트 (AI/PVP 전투 및 승리)
    if (battleType === 'robot' || !battleType) {
      incrementMissionProgress('play_ai_battle', 1);
      if (result === 'win') {
        incrementMissionProgress('win_ai_battle', 1);
      }
    } else if (battleType === 'user' || battleType === 'pvp_attack') {
      incrementMissionProgress('play_pvp_battle', 1);
      if (result === 'win') {
        incrementMissionProgress('win_ai_battle', 1);
      }
    }
    // Current Period IDs
    const getCurrentWeek = () => {
      const d = new Date();
      const year = d.getUTCFullYear();
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${year}-W${weekNo}`;
    };
    const getCurrentMonth = () => {
      const d = new Date();
      return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
    };

    const reward = rewardOverride !== undefined ? rewardOverride : (result === 'win' ? 50 : (result === 'draw' ? 20 : 10));
    const newSns = sns + reward;
    if (reward > 0) {
      incrementMissionProgress('earn_sns', reward);
    }

    let newStats: any = null;
    setStats(prev => {
      const isRobot = battleType === 'robot';
      const existingPatterns = prev.patterns || { placements: Array(9).fill(0), aggressionScore: 0.5, totalMovesTracked: 0, lastTenResults: [] };
      const newPlacements = existingPatterns.placements.map((v, i) => v + (sessionPatterns?.placements?.[i] || 0));
      const newAggression = sessionPatterns?.aggressionScore !== undefined 
        ? (existingPatterns.aggressionScore * 0.7 + sessionPatterns.aggressionScore * 0.3)
        : existingPatterns.aggressionScore;

      const newStatsObj = {
        ...prev,
        wins: !isRobot && result === 'win' ? prev.wins + 1 : prev.wins,
        losses: !isRobot && result === 'loss' ? prev.losses + 1 : prev.losses,
        draws: !isRobot && result === 'draw' ? prev.draws + 1 : prev.draws,
        winStreak: !isRobot && result === 'win' ? (prev.winStreak || 0) + 1 : 0,
        lossStreak: !isRobot && result === 'loss' ? (prev.lossStreak || 0) + 1 : 0,
        patterns: {
          placements: newPlacements,
          aggressionScore: newAggression,
          totalMovesTracked: existingPatterns.totalMovesTracked + (sessionPatterns?.totalMovesTracked || 0),
          lastTenResults: [result, ...existingPatterns.lastTenResults].slice(0, 10)
        }
      };
      newStats = newStatsObj;
      return newStatsObj;
    });

    // Update local SNS state immediately
    setSns(newSns);

    // Immediate sync if logged in (Awaiting Promise to ensure complete database write before exit)
    if (effectiveUser && effectiveUser.uid !== 'guest-id') {
      try {
        await syncUserData({
          sns: newSns,
          inventory,
          stats: newStats || stats,
          currentDeck,
          itemInventory,
          totalPower,
          displayName: effectiveUser.displayName || null,
          photoURL: effectiveUser.photoURL || null,
          isAutoBattle,
          lowSpecMode,
          language,
          lastSync: Date.now()
        });
      } catch (err) {
        console.error("Failed to sync my user data in recordMatchResult:", err);
      }
    }

    // Item Drop Logic
    if (result === 'win') {
       const luckyDrawBonus = totalSkillEffect('special');
       const dropChance = 0.2 + luckyDrawBonus;
       
       if (Math.random() < dropChance) {
         const droppedItem = addItem();
         if (droppedItem) {
           setItemDropNotification(droppedItem);
         }
       }
    }

    // PvP 랭킹전 상대방 정보 업데이트 (DB 즉시 반영 및 완료 대기)
    const targetOpponent = opponentInfo || pvpOpponent;
    if (battleType === 'pvp_attack' && targetOpponent) {
      const oppFinalReward = -reward;
      const newOppSns = Math.max(0, (targetOpponent.sns || 0) + oppFinalReward);
      const newOppWins = (targetOpponent.wins || 0) + (result === 'loss' ? 1 : 0);
      const newOppLosses = (targetOpponent.losses || 0) + (result === 'win' ? 1 : 0);
      const newOppDraws = (targetOpponent.draws || 0) + (result === 'draw' ? 1 : 0);
      const newOppTotal = newOppWins + newOppLosses + newOppDraws;
      const newOppWinRate = newOppTotal > 0 ? parseFloat(((newOppWins / newOppTotal) * 100).toFixed(1)) : 0;

      const oppId = targetOpponent.id.startsWith('ranking-') 
        ? targetOpponent.id.substring(8) 
        : targetOpponent.id;
      const oppDocRef = doc(db, getUserCollectionName(currentSeason), oppId);
      try {
        await updateDoc(oppDocRef, {
          sns: newOppSns,
          'stats.wins': newOppWins,
          'stats.losses': newOppLosses,
          'stats.draws': newOppDraws,
          winRate: newOppWinRate
        });
      } catch (err) {
        console.error("Failed to update opponent stats in Firestore:", err);
      }

      if (battleType === 'pvp_attack' && activeFriendBattleRequestId && effectiveUser && targetOpponent) {
        const winnerId = result === 'loss' ? targetOpponent.id : effectiveUser.uid;
        const loserId = result === 'loss' ? effectiveUser.uid : targetOpponent.id;
        try {
          completeBattleRequest(activeFriendBattleRequestId, winnerId, loserId, [
            `battle result: ${result}`,
            `reward: ${reward}`,
          ]);
        } catch (err) {
          console.warn('Failed to complete friend battle request', err);
        } finally {
          setActiveFriendBattleRequestId(null);
        }
      }

      // Guild Attack Victory Bonus
      if (isGuildAttackActive && result === 'win' && effectiveUser && effectiveUser.uid !== 'guest-id' && userGuild) {
        try {
          await donateToGuild(userGuild.id, effectiveUser.uid, 500);
          refreshUserGuild();
          console.log("[GUILD ATTACK] Guild victory exp bonus 500 applied.");
        } catch (e) {
          console.warn("Failed to apply guild victory exp bonus", e);
        }
      }
    }

    // Tutorial progression: After battle, go to shop and disable auto-battle
    if (tutorialStep === 3) {
      setIsAutoBattle(false);
      setTutorialStep(4);
      setView('shop');
    }
  }, [sns, effectiveUser, inventory, stats, currentDeck, itemInventory, totalPower, isAutoBattle, lowSpecMode, language, syncUserData, addItem, totalSkillEffect, tutorialStep, setIsAutoBattle, setTutorialStep, setView, pvpOpponent, activeFriendBattleRequestId, isPlaygroundMode, isGuildAttackActive, targetGuildId, userGuild, refreshUserGuild]);

  const grantSpecificCard = useCallback((dbCard: any, isSilent = false) => {
    if (!dbCard || dbCard.id === undefined) return;
    const cardIndex = dbCard.id;
    const rarity = dbCard.rarity || 'bronze';

    // Always update local state & immediately persist to localStorage
    setInventory(prev => {
      const current = prev[cardIndex] || { cardIndex, quantity: 0, rarity };
      const next = {
        ...prev,
        [cardIndex]: { ...current, quantity: (current.quantity || 0) + 1 }
      };
      if (typeof window !== 'undefined') {
        const season = localStorage.getItem('hero_current_season') || 'season1';
        setSeasonItem('hero_inventory', season, JSON.stringify(next));
        setSeasonItem('hero_inventory_guest', season, JSON.stringify(next));
        localStorage.setItem('hero_inventory', JSON.stringify(next));
      }
      return next;
    });
    setTotalPower(prev => {
      const nextPower = prev + (dbCard.power || 0);
      if (typeof window !== 'undefined') {
        const season = localStorage.getItem('hero_current_season') || 'season1';
        setSeasonItem('hero_totalPower', season, nextPower.toString());
        setSeasonItem('hero_totalPower_guest', season, nextPower.toString());
        localStorage.setItem('hero_totalPower', nextPower.toString());
      }
      return nextPower;
    });

    // Recommend upgrade if the card is better
    checkAndRecommendDeckUpgrade([cardIndex], isSilent);
  }, [checkAndRecommendDeckUpgrade]);

  const handleClawPlay = useCallback(() => {
    setSns(prev => Math.max(0, prev - 5));
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  }, [playSfx]);

  const handleClawReward = useCallback((card: CardData) => {
    const dbId = card.imageIndex !== undefined ? card.imageIndex : parseInt(card.id.split('-')[1]);
    const dbCard = CARD_DATABASE[dbId];
    if (dbCard) {
      grantSpecificCard(dbCard, false);
    }
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'); // Victory/Success sound
  }, [grantSpecificCard, playSfx]);

  const addCard = useCallback((rarity: CardRarity, indexOverride?: number, isSilent = false) => {
    incrementMissionProgress('collect_cards', 1);
    if (testMode) {
      console.log(`%c [DEBUG] addCard Triggered: Rarity=${rarity}, Index=${indexOverride ?? 'AUTO'} `, 'color: #9333ea; font-weight: bold;');
    }
    let newCard = syncCardWithDatabase(generateCard(rarity));
    
    if (indexOverride !== undefined) {
      const dbCard = CARD_DATABASE[indexOverride];
      if (dbCard) {
        newCard.imageIndex = indexOverride;
        newCard.rarity = dbCard.rarity;
        newCard = syncCardWithDatabase(newCard);
      }
    }

    // Update local state and immediately persist to localStorage
    if (newCard.imageIndex !== undefined) {
      const cardIndex = newCard.imageIndex;
      const dbCard = CARD_DATABASE[cardIndex];
      if (dbCard) {
        setInventory(prev => {
          const current = prev[cardIndex] || { cardIndex, quantity: 0, rarity: newCard.rarity };
          const next = {
            ...prev,
            [cardIndex]: { ...current, quantity: (current.quantity || 0) + 1 }
          };
          if (typeof window !== 'undefined') {
            const season = localStorage.getItem('hero_current_season') || 'season1';
            setSeasonItem('hero_inventory', season, JSON.stringify(next));
            setSeasonItem('hero_inventory_guest', season, JSON.stringify(next));
            localStorage.setItem('hero_inventory', JSON.stringify(next));
          }
          return next;
        });
        
        setTotalPower(prev => {
          const nextPower = prev + (dbCard.power || 0);
          if (typeof window !== 'undefined') {
            const season = localStorage.getItem('hero_current_season') || 'season1';
            setSeasonItem('hero_totalPower', season, nextPower.toString());
            setSeasonItem('hero_totalPower_guest', season, nextPower.toString());
            localStorage.setItem('hero_totalPower', nextPower.toString());
          }
          return nextPower;
        });

        if (testMode) {
          console.log(`%c [DEBUG] Card Added to Inventory: #${cardIndex} (${dbCard.title}) `, 'color: #10b981;');
        }

        // Recommend upgrade if the card is better
        checkAndRecommendDeckUpgrade([cardIndex], isSilent);
      }
    }
  }, [testMode, checkAndRecommendDeckUpgrade]);

  const [isGlobalPopupOpen, setIsGlobalPopupOpen] = useState(false);

  // Listen for help popup events from any view to hide bottom nav
  useEffect(() => {
    const handleHelpOpen = () => setIsGlobalPopupOpen(true);
    const handleHelpClose = () => setIsGlobalPopupOpen(false);
    window.addEventListener('snshero-help-popup-open', handleHelpOpen);
    window.addEventListener('snshero-help-popup-close', handleHelpClose);
    return () => {
      window.removeEventListener('snshero-help-popup-open', handleHelpOpen);
      window.removeEventListener('snshero-help-popup-close', handleHelpClose);
    };
  }, []);

  // Listen for global SNS update events
  useEffect(() => {
    const handleSnsSync = () => {
      const season = currentSeason || localStorage.getItem('hero_current_season') || 'season1';
      const savedPurchased = Number(localStorage.getItem('hero_purchased_sns') || '0');
      const savedEarned = Number(localStorage.getItem('hero_earned_sns') || '1000');
      const savedSnsStr = localStorage.getItem(`hero_sns_${season}`) || localStorage.getItem('hero_sns');
      const savedSns = savedSnsStr ? Number(savedSnsStr) : (savedPurchased + savedEarned);
      
      if (!isNaN(savedEarned) && savedEarned !== earnedSns) setEarnedSns(savedEarned);
      if (!isNaN(savedPurchased) && savedPurchased !== purchasedSns) setPurchasedSns(savedPurchased);
      if (!isNaN(savedSns) && savedSns !== sns) setSns(savedSns);
    };

    window.addEventListener('snshero_sns_updated', handleSnsSync);
    window.addEventListener('sns_updated', handleSnsSync);
    return () => {
      window.removeEventListener('snshero_sns_updated', handleSnsSync);
      window.removeEventListener('sns_updated', handleSnsSync);
    };
  }, [currentSeason, earnedSns, purchasedSns, sns]);


  useEffect(() => {
    if (bgmEnabled && audioStarted) {
      bgmAudio.volume = bgmVolume;
      bgmAudio.muted = bgmVolume === 0;
      bgmAudio.play().catch(() => {});
    } else {
      bgmAudio.pause();
    }
  }, [bgmEnabled, bgmAudio, audioStarted, bgmVolume]);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (!audioStarted) {
        startAudio();
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [audioStarted, startAudio]);

  useEffect(() => {
    localStorage.setItem('hero_bgm', bgmEnabled.toString());
    localStorage.setItem('hero_sfx', sfxEnabled.toString());
    localStorage.setItem('hero_bgm_volume', bgmVolume.toString());
    localStorage.setItem('hero_sfx_volume', sfxVolume.toString());
  }, [bgmEnabled, sfxEnabled, bgmVolume, sfxVolume]);

  const isAudioMuted = !bgmEnabled && !sfxEnabled;

  const toggleAudioMute = useCallback(() => {
    const nextMuteState = !isAudioMuted;
    setBgmEnabled(!nextMuteState);
    setSfxEnabled(!nextMuteState);
    if (!nextMuteState) {
      if (!audioStarted) {
        startAudio();
      }
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  }, [isAudioMuted, audioStarted, startAudio, playSfx]);


  const handleResetSkills = useCallback(() => {
    const isFree = true;
    const cost = getSkillResetCost();

    if (sns < cost) {
      showCustomAlert(language === 'ko' ? '포인트 부족' : 'INSUFFICIENT SNS', language === 'ko' ? 'SNS 포인트가 부족합니다.' : 'Not enough SNS Points.');
      return;
    }

    setCurrentDeck(prevDeck => {
      const activeCompanion = prevDeck[selectedCompanionIndex];
      if (!activeCompanion) return prevDeck;

      const compSkills = activeCompanion.skills || [];
      
      let refundedSns = 0;
      compSkills.forEach(s => {
        const lv = s.level || 0;
        for (let i = 0; i < lv; i++) {
          refundedSns += getSkillUpgradeCost(i);
        }
      });

      if (refundedSns === 0) {
        showCustomAlert(language === 'ko' ? '알림' : 'NOTICE', language === 'ko' ? '초기화할 스킬이 없습니다.' : 'No skills to reset.');
        return prevDeck;
      }

      // Reset all skills to level 0
      const resetSkills = compSkills.map(s => ({ ...s, level: 0 }));

      const updatedCompanion = {
        ...activeCompanion,
        level: 1,
        skills: resetSkills
      };

      // Update DB and stats
      updateCompanion(updatedCompanion);
      setSns(prev => prev - cost + refundedSns);

      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      return prevDeck.map((c, i) => i === selectedCompanionIndex ? updatedCompanion : c);
    });
  }, [selectedCompanionIndex, effectiveUser, updateCompanion, playSfx, language, sns]);



  const onBackFromGame = useCallback(() => {
    setIsAutoBattle(false);
    if (isPlaygroundMode) {
      setView('playground');
    } else if (isGuildAttackActive) {
      setIsGuildAttackActive(false);
      setView('guild-detail');
    } else if (isPvpBoardAttackActive) {
      setIsPvpBoardAttackActive(false);
      setIsPvpActive(false);
      setView('community');
    } else if (isPvpActive) {
      setIsPvpActive(false);
      setView('ranking');
    } else {
      setView('home');
    }
  }, [isPvpActive, isPlaygroundMode, isGuildAttackActive, isPvpBoardAttackActive]);

  const handleGlobalBack = useCallback(() => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    
    // Dispatch custom event for child views to intercept
    const event = new CustomEvent('global-back', { cancelable: true });
    const defaultPrevented = !window.dispatchEvent(event);
    
    // If not intercepted, run default back behavior
    if (!defaultPrevented) {
      if (view === 'play') {
        onBackFromGame();
      } else if (view === 'playground') {
        setIsPlaygroundMode(false);
        setView('home');
      } else if (view === 'companion' || view === 'skill') {
        setView('mydeck');
      } else if (view === 'guild-detail') {
        setView('guild-list');
      } else {
        setView('home');
      }
    }
  }, [view, onBackFromGame, playSfx]);

  const startExternalBattle = useCallback(async ({
    opponentUid,
    opponentName,
    guildId,
    battleRequestId,
  }: {
    opponentUid: string;
    opponentName: string;
    guildId?: string;
    battleRequestId?: string;
  }) => {
    setIsGlobalLoading(true);
    try {
      let opponentDeck: CardData[] = [];
      let oppSns = 1000;
      let oppWins = 0;
      let oppLosses = 0;
      let oppDraws = 0;

      const oppRef = doc(db, getUserCollectionName(currentSeason), opponentUid);
      const oppSnap = await getDoc(oppRef);

      if (oppSnap.exists()) {
        const oppData = oppSnap.data();
        oppSns = oppData.sns ?? 1000;
        oppWins = oppData.stats?.wins ?? 0;
        oppLosses = oppData.stats?.losses ?? 0;
        oppDraws = oppData.stats?.draws ?? 0;

        if (oppData.currentDeck && Array.isArray(oppData.currentDeck) && oppData.currentDeck.length > 0) {
          opponentDeck = (oppData.currentDeck as CardData[]).map((c) => syncCardWithDatabase(c, oppData.inventory || {}));
        }
      }

      if (opponentDeck.length === 0) {
        opponentDeck = generateUniqueDeck(5);
      }

      setPvpOpponent({
        id: opponentUid,
        name: opponentName,
        deck: opponentDeck,
        sns: oppSns,
        wins: oppWins,
        losses: oppLosses,
        draws: oppDraws,
      });
      setActiveFriendBattleRequestId(battleRequestId ?? null);
      setIsGuildAttackActive(Boolean(guildId));
      setTargetGuildId(guildId ?? null);
      setView('play');
    } catch (e) {
      console.error("Failed to fetch opponent deck:", e);
      showCustomAlert(
        language === 'ko' ? '알림' : 'NOTICE',
        language === 'ko'
          ? "상대방 덱 정보를 가져오지 못했습니다. 임시 덱으로 대체하여 대전을 개시합니다."
          : "Failed to load opponent deck. Starting battle with a temporary deck."
      );

      setPvpOpponent({
        id: opponentUid,
        name: opponentName,
        deck: generateUniqueDeck(5),
        sns: 1000,
        wins: 0,
        losses: 0,
        draws: 0,
      });
      setActiveFriendBattleRequestId(battleRequestId ?? null);
      setIsGuildAttackActive(Boolean(guildId));
      setTargetGuildId(guildId ?? null);
      setView('play');
    } finally {
      setIsGlobalLoading(false);
    }
  }, [currentSeason, language, setIsGlobalLoading, setIsGuildAttackActive, setTargetGuildId, setView]);

  const handleGuildMemberAttack = useCallback((memberUid: string, memberName: string, guildId: string) => {
    void startExternalBattle({ opponentUid: memberUid, opponentName: memberName, guildId });
  }, [startExternalBattle]);

  const handleStartFriendBattle = useCallback((opponentUid: string, opponentName: string, battleRequestId?: string) => {
    void startExternalBattle({ opponentUid, opponentName, battleRequestId });
  }, [startExternalBattle]);

  const getAggregatedSkills = useCallback(() => {
    return INITIAL_SKILLS.map(baseSkill => {
      const totalLevel = currentDeck.reduce((acc, card) => {
        const skill = card?.skills?.find(s => s.id === baseSkill.id);
        return acc + (skill?.level || 0);
      }, 0);
      return { ...baseSkill, level: totalLevel };
    });
  }, [currentDeck]);

  const effectiveTotalPower = useMemo(() => {
    // Total Power already includes individual Power Boost bonuses from the deck cards themselves 
    // in the useEffect above via bonusPowerFromDeck.
    // No need to apply totalSkillEffect('power') multiplier here to avoid double-counting.
    const buff = getGuildBuff(userGuild?.level || 0);
    return Math.ceil(totalPower * (1 + buff.powerPercent / 100));
  }, [totalPower, userGuild]);

  const handleImpersonate = useCallback((user: any) => {
  }, []);

  const handleStopSim = useCallback(() => {
    setIsSimulationActive(false);
    setIsAutoLoop(false);
    setView('admin');
  }, []);

  const handleLogin = async (emailOverride?: string) => {
    setIsGlobalLoading(true);
    setGlobalLoadingMessage(t('logging_in', language));
    try {
      const targetName = emailOverride ? emailOverride.split('@')[0] : 'Hero';
      const localProfile = {
        uid: 'local-hero-user',
        displayName: targetName,
        email: emailOverride || 'hero@snshero.local',
        photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + targetName,
        isAnonymous: false,
        activeEmoticonKey: DEFAULT_PROFILE_EMOTICON_KEY,
        activeBadgeKey: DEFAULT_PROFILE_BADGE_KEY,
        activeTitleKey: DEFAULT_PROFILE_TITLE_KEY,
      };
      localStorage.setItem('hero_user_profile', JSON.stringify(localProfile));
      localStorage.setItem('hero_user_name', localProfile.displayName);
      localStorage.setItem('hero_user_avatar', localProfile.photoURL);
      setUser(localProfile);
      trackAnalytics({ event: AnalyticsEvent.LOGIN, payload: { method: 'demo', uid: localProfile.uid } });
      showCustomAlert(
        language === 'ko' ? '로그인 완료' : 'Login Success',
        language === 'ko' ? `${localProfile.displayName}님 환영합니다!` : `Welcome, ${localProfile.displayName}!`
      );
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsGlobalLoading(false);
      setGlobalLoadingMessage('');
    }
  };

  const handleLogout = useCallback(async () => {
    setIsGlobalLoading(true);
    setGlobalLoadingMessage(t('logging_out', language));
    try {
      localStorage.removeItem('hero_user_profile');
      localStorage.setItem('hero_user_name', 'GUEST');
      localStorage.setItem('hero_user_avatar', 'preset:0');
      localStorage.setItem(PROFILE_EMOTICON_STORAGE_KEY, DEFAULT_PROFILE_EMOTICON_KEY);
      localStorage.setItem(PROFILE_BADGE_STORAGE_KEY, DEFAULT_PROFILE_BADGE_KEY);
      localStorage.setItem(PROFILE_TITLE_STORAGE_KEY, DEFAULT_PROFILE_TITLE_KEY);
      setUser(getStoredGuestProfile());
      showCustomAlert(
        language === 'ko' ? '로그아웃' : 'Logout',
        language === 'ko' ? '게스트 모드로 전환되었습니다.' : 'Switched to guest mode.'
      );
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsGlobalLoading(false);
      setGlobalLoadingMessage('');
    }
  }, [language, getStoredGuestProfile, showCustomAlert]);

  const calculatedBattlePower = useMemo(() => {
    const basePowerWithBonus = Object.entries(inventory).reduce((acc, [idx, record]) => {
      const inventoryRecord = record as InventoryRecord;
      const power = CARD_DATABASE[Number(idx)]?.power || 0;
      return acc + (power * (inventoryRecord.quantity || 0));
    }, 0) + currentDeck.reduce((acc, card) => acc + (card?.bonusPower || 0), 0);

    const buff = getGuildBuff(userGuild?.level || 0);
    return Math.ceil(basePowerWithBonus * (1 + buff.powerPercent / 100));
  }, [inventory, currentDeck, userGuild]);

  const renderView = () => {
    switch (view) {
      case 'home':
        return (
          <HomeView 
            playSfx={playSfx} 
            bgmStarted={audioStarted} 
            startAudio={startAudio} 
            totalPower={effectiveTotalPower} 
            currentDeck={currentDeck}
            currentSeason={currentSeason}
            onNavigate={(targetView) => {
              if (targetView === 'ranking') {
                setAutoStartPvp(true);
              }
              setView(targetView);
            }} 
            language={language} 
            user={effectiveUser}
            handleLogin={handleLogin}
            handleLogout={handleLogout}
            onStartTutorial={() => {
              setIsTutorialMode(true);
              setTutorialStep(1);
              setView('home'); // Ensure we are on home for Step 1
            }}
            isTutorialCompleted={getSeasonItem('hero_tutorial_completed', currentSeason) === 'true'}
            isTutorialMode={isTutorialMode}
            tutorialStep={tutorialStep}
            onStartPlayNow={() => {
              setSeasonItem('hero_kadan_rpg_auto_mode', currentSeason, 'true');
              setView('main');
            }}
          />
        );
      case 'main':
        return (
          <KadanRpgView
            language={language}
            currentSeason={currentSeason}
            currentDeck={currentDeck}
            totalPower={effectiveTotalPower}
            sns={sns}
            lowSpecMode={lowSpecMode}
            onNavigate={setView}
            updateSns={updateSns}
            addCard={addCard}
            addItem={addItem}
            showCustomAlert={showCustomAlert}
          />
        );
      case 'mydeck':
        return (
          <MyDeckView 
            currentDeck={currentDeck} 
            ownedCards={ownedCards} 
            updateDeck={updateDeck} 
            selectedCompanionIndex={selectedCompanionIndex}
            setSelectedCompanionIndex={setSelectedCompanionIndex}
            stats={stats}
            inventory={inventory}
            globalTotalPower={totalPower}
            language={language}
            onNavigate={setView}
            customCardImage={customCardImage}
            equipItem={equipItem}
            unequipItem={unequipItem}
            itemInventory={itemInventory}
            playSfx={playSfx}
            setGlobalPopupOpen={setIsGlobalPopupOpen}
            user={effectiveUser}
            unlockedAchievements={stats.unlockedAchievements || []}
            claimedAchievements={stats.claimedAchievements || []}
            claimAchievementReward={claimAchievementReward}
            achievementProgress={stats.achievementProgress || {}}
            aiStrategy={aiStrategy}
            onAiStrategyChange={setAiStrategy}
            isImpersonating={false}
            itemMagicChanceBonus={totalMagicChance}
            setInventory={setInventory}
            updateSns={updateSns}
            syncUserData={syncUserData}
            currentSeason={currentSeason}
            isAutoBattle={isAutoBattle}
            lowSpecMode={lowSpecMode}
            sns={sns}
            showCustomAlert={showCustomAlert}
          />
        );
      case 'boost':
        return (
          <BoostView 
            onNavigate={setView}
            language={language}
            sns={sns}
            updateSns={updateSns}
            showCustomAlert={showCustomAlert}
          />
        );
      case 'creator':
        return (
          <CreatorLandingView
            code={creatorCode}
            onNavigate={setView}
            language={language}
            sns={sns}
            updateSns={updateSns}
            showCustomAlert={showCustomAlert}
            lowSpecMode={lowSpecMode}
          />
        );
      case 'season-hub':
        return (
          <SeasonHubView
            onNavigate={setView}
            language={language}
            currentSeason={currentSeason}
            lowSpecMode={lowSpecMode}
            playSfx={playSfx}
            sns={sns}
            updateSns={updateSns}
          />
        );
      case 'policy-center':
        return (
          <PolicyCenterView
            language={language}
            onNavigate={setView}
            lowSpecMode={lowSpecMode}
          />
        );
      case 'web3-landing':
        return (
          <Web3LandingView
            language={language}
            onNavigate={setView}
            lowSpecMode={lowSpecMode}
          />
        );
      case 'referral':
        return (
          <ReferralView
            language={language}
            playSfx={playSfx}
            user={effectiveUser}
            lowSpecMode={lowSpecMode}
            showCustomAlert={showCustomAlert}
          />
        );
      case 'share':
        return (
          <ShareView
            language={language}
            onNavigate={setView}
            playSfx={playSfx}
            currentDeck={currentDeck}
            user={effectiveUser}
            onAttackUser={(opp) => {
              setIsAutoBattle(true);
              setIsPvpActive(true);
              setPvpOpponent(opp);
              setView('play');
            }}
            showCustomAlert={showCustomAlert}
            updateSns={updateSns}
          />
        );
      case 'companion':
        return (
          <CompanionView 
            companion={currentDeck[selectedCompanionIndex]}
            sns={sns}
            updateSns={updateSns}
            updateCompanion={updateCompanion}
            onBack={() => setView('mydeck')}
            onNavigate={setView}
            language={language}
            playSfx={playSfx}
            customCardImage={customCardImage}
            selectedCompanionIndex={selectedCompanionIndex}
            setSelectedCompanionIndex={setSelectedCompanionIndex}
            currentDeck={currentDeck}
            itemList={itemInventory}
            equipItem={equipItem}
            unequipItem={unequipItem}
            updateStats={(newStats) => setStats(prev => ({ 
              ...prev, 
              ...newStats,
              skillPoints: newStats.skillPoints !== undefined ? (prev.skillPoints || 0) + newStats.skillPoints : prev.skillPoints
            }))}
            skillPoints={stats.skillPoints || 0}
            isImpersonating={false}
            setGlobalPopupOpen={setIsGlobalPopupOpen}
            onUpgradeSkill={handleUpgradeSkill}
            onResetSkills={handleResetSkills}
          />
        );
      case 'profile':
        return (
          <ProfileView 
            user={user}
            onBack={() => setView('home')}
            language={language}
            playSfx={playSfx}
            stats={stats}
            inventory={inventory}
            onUpdateUser={(name, avatar, activeEmoticonKey, activeBadgeKey, activeTitleKey) => {
              const updatedUser = {
                ...user,
                displayName: name,
                photoURL: avatar,
                activeEmoticonKey,
                activeBadgeKey,
                activeTitleKey,
              };
              setUser(updatedUser);
              if (updatedUser?.uid && updatedUser.uid !== 'guest-id') {
                syncUserData({
                  displayName: name,
                  photoURL: avatar,
                  activeEmoticonKey,
                  activeBadgeKey,
                  activeTitleKey,
                  lastSync: Date.now(),
                });
              }
            }}
            showCustomAlert={showCustomAlert}
          />
        );
      case 'skill':
        return (
          <SkillView 
            skills={selectedCompanion?.skills || INITIAL_SKILLS}
            language={language}
            onNavigate={setView}
            onUpgradeSkill={handleUpgradeSkill}
            onResetSkills={handleResetSkills}
            companionLevel={selectedCompanion?.level || 1}
            skillPoints={stats.skillPoints || 0}
            sns={sns}
            isImpersonating={false}
          />
        );
      case 'shop':
        return (
          <ShopView 
            sns={sns} 
            addCard={addCard} 
            addItem={addItem}
            updateSns={updateSns} 
            playSfx={playSfx}
            testMode={testMode}
            setTestMode={setTestMode}
            config={shopConfig}
            language={language}
            customCardImage={customCardImage}
            isImpersonating={false}
            onClawReward={handleClawReward}
            onClawPlay={handleClawPlay}
            setGlobalPopupOpen={setIsGlobalPopupOpen}
            tutorialStep={tutorialStep}
            setTutorialStep={setTutorialStep}
            onNavigate={setView}
            isAdRemoved={isAdRemoved}
            setIsAdRemoved={setIsAdRemoved}
            triggerDeckUpgradeCheck={triggerDeckUpgradeCheck}
            isPlayingback={isPlayingback}
            user={user}
            userStats={stats}
            syncUserData={syncUserData}
            currentSeason={currentSeason}
            ownedCards={ownedCards}
          />
        );
      case 'event':
        return (
          <EventView
            language={language}
            sns={sns}
            updateSns={updateSns}
            playSfx={playSfx}
            user={effectiveUser}
            userStats={stats}
            syncUserData={syncUserData}
            currentSeason={currentSeason}
            addCard={addCard}
            addItem={addItem}
            onClawReward={handleClawReward}
            onClawPlay={handleClawPlay}
            setView={setView}
            ownedCards={ownedCards}
            inventory={inventory}
          />
        );
      case 'stock-market':
        return (
          <StockMarketView
            language={language}
            sns={sns}
            updateSns={updateSns}
            playSfx={playSfx}
            inventory={inventory}
            addCard={addCard}
            setView={setView}
            user={user}
            syncUserData={syncUserData}
            currentSeason={currentSeason}
          />
        );
      case 'card-marketplace':
        return (
          <CardMarketplaceView
            language={language}
            setView={setView}
            inventory={inventory}
            user={effectiveUser}
            currentSeason={currentSeason}
            lowSpecMode={lowSpecMode}
          />
        );
      case 'prediction-market':
        return (
          <PredictionMarketView
            language={language}
            sns={sns}
            updateSns={updateSns}
            playSfx={playSfx}
            setView={setView}
            showCustomAlert={showCustomAlert}
            user={user}
            syncUserData={syncUserData}
            currentSeason={currentSeason}
          />
        );
      case 'setting':
        return (
          <SettingView 
            bgmEnabled={bgmEnabled} 
            setBgmEnabled={setBgmEnabled}
            bgmVolume={bgmVolume}
            setBgmVolume={setBgmVolume}
            bgmTrackId={bgmTrackId}
            setBgmTrackId={setBgmTrackId}
            sfxEnabled={sfxEnabled}
            setSfxEnabled={setSfxEnabled}
            sfxVolume={sfxVolume}
            setSfxVolume={setSfxVolume}
            playSfx={playSfx}
            user={user}
            onLogout={handleLogout}
            aiStrategy={aiStrategy}
            setAiStrategy={setAiStrategy}
            botAiStrategy={botAiStrategy}
            setBotAiStrategy={setBotAiStrategy}
            aiDifficulty={aiDifficulty}
            setAiDifficulty={setAiDifficulty}
            customCardImage={customCardImage}
            setCustomCardImage={setCustomCardImage}
            isAutoBattle={isAutoBattle}
            setIsAutoBattle={setIsAutoBattle}
            recommendMode={recommendMode}
            setRecommendMode={setRecommendMode}
            offlineMode={offlineMode}
            setOfflineMode={setOfflineMode}
            onNavigate={setView}
            onStartTutorial={() => {
              setIsTutorialMode(true);
              setTutorialStep(1);
              setView('home'); // Ensure we are on home for Step 1
            }}
            currentSeason={currentSeason}
            setCurrentSeason={setCurrentSeason}
            testMode={testMode}
            localAiStatus={localAiStatus}
          />
        );
      case 'play':
        return (
          <PlayGameView 
            initialMode={playInitialMode}
            calculatedTotalPower={calculatedBattlePower}
            playerDeck={isPlaygroundMode ? playgroundDeck : currentDeck} 
            onBack={onBackFromGame} 
            playSfx={playSfx}
            recordMatchResult={recordMatchResult}
            isAutoBattle={tutorialStep === 1 ? false : isAutoBattle}
            aiStrategy={aiStrategy}
            onAiStrategyChange={setAiStrategy}
            botAiStrategy={botAiStrategy}
            aiDifficulty={aiDifficulty}
            onAiDifficultyChange={setAiDifficulty}
            patterns={stats.patterns}
            userStats={stats}
            initialChallengeTarget={challengeTargetId}
            onChallengeHandled={() => setChallengeTargetId(null)}
            customCardImage={customCardImage}
            isChatOpen={isChatOpen}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            onToggleAutoBattle={() => setIsAutoBattle(!isAutoBattle)}
            setIsAutoBattle={setIsAutoBattle}
            isGpsActive={isGpsActive}
            setIsGpsActive={setIsGpsActive}
            gpsCoords={gpsCoords}
            setGpsCoords={setGpsCoords}
            onGameStateChange={setPlayGameState}
            onClawReward={handleClawReward}
            onClawPlay={handleClawPlay}
            skills={getAggregatedSkills()} 
            effectiveUser={effectiveUser}
            setGlobalPopupOpen={setIsGlobalPopupOpen}
            tutorialStep={tutorialStep}
            setTutorialStep={setTutorialStep}
            isTutorialMode={isTutorialMode}
            onTutorialComplete={() => setTutorialStep(3)}
            pvpOpponent={pvpOpponent}
            onClearPvpOpponent={() => setPvpOpponent(null)}
            isPvpBoardAttack={isPvpBoardAttackActive}
            onClearPvpBoardAttack={() => setIsPvpBoardAttackActive(false)}
            sns={sns}
            updateSns={updateSns}
            setView={setView}
            isPlayground={isPlaygroundMode}
            isGuildAttack={isGuildAttackActive}
            updateStats={(newStats) => setStats(prev => ({ ...prev, ...newStats }))}
            addItem={addItem}
            onEarnXp={(amount: number) => {
              setCurrentDeck(prev => {
                const newDeck = [...prev];
                const idx = selectedCompanionIndex;
                if (newDeck[idx]) {
                  newDeck[idx] = {
                    ...newDeck[idx],
                    xp: (newDeck[idx].xp || 0) + amount
                  };
                }
                return newDeck;
              });
            }}
            showDefenseTestConsole={showDefenseTestConsole}
            setShowDefenseTestConsole={setShowDefenseTestConsole}
            randomPlayTrigger={randomPlayTrigger}
            preselectedGameId={preselectedGameId}
            currentSeason={currentSeason}
          />
        );
      case 'playground':
        return (
          <PlaygroundView 
            currentDeck={currentDeck}
            onPlay={(deck) => {
              setPlaygroundDeck(deck);
              setIsPlaygroundMode(true);
              setView('play');
            }}
            language={language}
            onBack={() => {
              setIsPlaygroundMode(false);
              setView('home');
            }}
            playSfx={playSfx}
          />
        );
      case 'ranking':
        return (
          <RankingView 
            onBack={() => setView('home')} 
            playSfx={playSfx} 
            language={language}
            user={effectiveUser}
            sns={sns}
            onAttackUser={(opp) => {
              setIsAutoBattle(true);
              setIsPvpActive(true);
              setPvpOpponent(opp);
              setView('play');
            }}
            onLogin={handleLogin}
            setIsGlobalLoading={(loading: boolean, message?: string) => {
              setIsGlobalLoading(loading);
              if (message !== undefined) {
                setGlobalLoadingMessage(message);
              }
            }}
            currentSeason={currentSeason}
            isAutoBattle={isAutoBattle}
            autoStartPvp={autoStartPvp}
            onClearAutoStartPvp={() => setAutoStartPvp(false)}
          />
        );
      case 'admin':
        return (
          <AdminView 
            language={language} 
            onNavigate={setView} 
            setIsAutoBattle={setIsAutoBattle}
            isAutoBattle={isAutoBattle}
            isSimulationActive={isSimulationActive}
            setIsSimulationActive={setIsSimulationActive}
            isAutoLoop={isAutoLoop}
            setIsAutoLoop={setIsAutoLoop}
            lastTestReport={lastTestReport}
            setLastTestReport={setLastTestReport}
            errorHistory={testErrorHistory}
            setErrorHistory={setTestErrorHistory}
            currentSeason={currentSeason}
            lowSpecMode={lowSpecMode}
            playSfx={playSfx}
            stats={stats}
            setStats={setStats}
            sns={sns}
            setSns={setSns}
            currentDeck={currentDeck}
            setCurrentDeck={setCurrentDeck}
            inventory={inventory}
            setInventory={setInventory}
            itemInventory={itemInventory}
            setItemInventory={setItemInventory}
            ownedCards={ownedCards}
            startSimulation={startSimulation}
            simulationUser={simulationUser}
          />
        );
      case 'status':
        return (
          <StatusView 
            language={language} 
            onNavigate={setView} 
            currentSeason={currentSeason}
            lowSpecMode={lowSpecMode}
          />
        );
      case 'wiki':
        return <WikiHomeView onNavigate={setView} language={language} />;
      case 'world-codex':
        return <WorldCodexView onNavigate={setView} language={language} currentSeason={currentSeason} lowSpecMode={lowSpecMode} />;
      case 'wiki-howtoplay':
        return <WikiHowToPlayView onNavigate={setView} language={language} />;
      case 'wiki-tip':
        return <WikiTipView onNavigate={setView} language={language} />;
      case 'wiki-card':
        return (
          <WikiCardView 
            onNavigate={setView} 
            language={language} 
            ownedCards={ownedCards}
            inventory={inventory}
          />
        );
      case 'wiki-item':
        return <WikiItemView onNavigate={setView} language={language} />;
      case 'wiki-skill':
        return <WikiSkillView onNavigate={setView} language={language} />;
      case 'god':
        return (
          <GodView
            language={language}
            onNavigate={setView}
            playSfx={playSfx}
            stats={stats}
            setStats={setStats}
            sns={sns}
            setSns={setSns}
            currentDeck={currentDeck}
            setCurrentDeck={setCurrentDeck}
            inventory={inventory}
            setInventory={setInventory}
            itemInventory={itemInventory}
            setItemInventory={setItemInventory}
            ownedCards={ownedCards}
            user={user}
            syncUserData={syncUserData}
          />
        );
      case 'community':
        return (
          <CommunityView
            onBack={() => {
              window.history.pushState({}, '', window.location.pathname);
              setView('home');
            }}
            language={language}
            playSfx={playSfx}
            user={effectiveUser}
            sns={sns}
            updateSns={updateSns}
            initialPostId={initialPostId}
            initialCategory={initialCategory}
            onAttack={handleCommunityUserAttack}
          />
        );
      case 'guild-list':
        return (
          <GuildListView 
            onNavigate={setView}
            language={language}
            currentUser={effectiveUser ? { uid: effectiveUser.uid, displayName: effectiveUser.displayName } : null}
            userGuild={userGuild}
            refreshUserGuild={refreshUserGuild}
            onSelectGuild={(guildId, isOpponentMode) => {
              setSelectedGuildId(guildId);
              setIsOpponentGuildMode(isOpponentMode);
              setView('guild-detail');
            }}
          />
        );
      case 'guild-detail':
        return (
          <GuildDetailView 
            onNavigate={setView}
            language={language}
            currentUser={effectiveUser ? { uid: effectiveUser.uid, displayName: effectiveUser.displayName } : null}
            guildId={selectedGuildId || ''}
            isOpponentMode={isOpponentGuildMode}
            userGuild={userGuild}
            sns={sns}
            onUpdateSns={updateSns}
            refreshUserGuild={refreshUserGuild}
            onAttackMember={(memberUid, memberName) => handleGuildMemberAttack(memberUid, memberName, selectedGuildId || '')}
            onStartFriendBattle={handleStartFriendBattle}
            totalPower={totalPower}
            season={currentSeason}
          />
        );
      case 'reward-qr':
        return (
          <QrReward
            isOpen={true}
            onClose={() => setView('home')}
            language={language}
            todayArCardId={1}
            todayQrCardId={1}
            onSuccess={(scannedText) => {
              if (scannedText) {
                // If QR code is https://snshero.com/reward1000 -> earn 10000 SNS
                // If QR code is https://snshero.com/reward3000 -> earn 30000 SNS
                const cleanText = scannedText.trim();
                if (cleanText === 'https://snshero.com/reward1000') {
                  updateSns(10000, t('qr_code_scanned_success', language));
                  showCustomAlert(
                    language === 'ko' ? '지급 완료!' : 'REWARD CLAIMED!',
                    language === 'ko' ? '10000SNS 획득에 성공했습니다!' : 'Successfully claimed 10,000 SNS!'
                  );
                  setView('home');
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                } else if (cleanText === 'https://snshero.com/reward3000') {
                  updateSns(30000, t('qr_code_scanned_success', language));
                  showCustomAlert(
                    language === 'ko' ? '지급 완료!' : 'REWARD CLAIMED!',
                    language === 'ko' ? '30000SNS 획득에 성공했습니다!' : 'Successfully claimed 30,000 SNS!'
                  );
                  setView('home');
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                } else if (cleanText === 'https://snshero.com/reward4000') {
                  updateSns(40000, t('qr_code_scanned_success', language));
                  showCustomAlert(
                    language === 'ko' ? '지급 완료!' : 'REWARD CLAIMED!',
                    language === 'ko' ? '40000SNS 획득에 성공했습니다!' : 'Successfully claimed 40,000 SNS!'
                  );
                  setView('home');
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                } else if (cleanText === 'https://snshero.com/reward5000') {
                  updateSns(50000, t('qr_code_scanned_success', language));
                  showCustomAlert(
                    language === 'ko' ? '지급 완료!' : 'REWARD CLAIMED!',
                    language === 'ko' ? '50000SNS 획득에 성공했습니다!' : 'Successfully claimed 50,000 SNS!'
                  );
                  setView('home');
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                } else {
                  showCustomAlert(
                    language === 'ko' ? '인식 실패' : 'SCAN FAILED',
                    language === 'ko' 
                      ? '올바르지 않은 보상 QR코드입니다.' 
                      : 'This is not a valid reward QR code.'
                  );
                  setView('home');
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                }
              }
            }}
          />
        );
      case 'reward-ar':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-white font-sans text-center">
            <h1 className="text-xl font-bold mb-4 uppercase tracking-wider text-purple-400">AR CARD TARGET (id1)</h1>
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-purple-500/35 mb-6 max-w-xs shadow-2xl shadow-purple-500/10">
              <div className="border border-slate-700/50 p-4 bg-gradient-to-br from-indigo-950/40 to-slate-900/40 rounded-2xl text-slate-100 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase bg-indigo-650 text-indigo-500 px-2 py-0.5 rounded-full text-[8px] border border-indigo-550/30">WATER</span>
                  <span className="text-xs font-bold text-indigo-450 text-indigo-400">ID: 1</span>
                </div>
                {/* Character preview */}
                <div className="w-32 h-32 mx-auto bg-slate-950/85 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden mb-3 shadow-md">
                  <div 
                    className="w-24 h-24 scale-[1.3] translate-y-[5%]"
                    style={{
                      backgroundImage: `url('${customCardImage || '/cards1.png'}')`,
                      backgroundSize: `1000% 1000%`,
                      backgroundPosition: '0% 0%',
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated'
                    }}
                  />
                </div>
                <h3 className="font-bold text-sm mb-1 text-center">물조각 (Water Fragments)</h3>
                <div className="grid grid-cols-4 gap-1 text-[9px] font-semibold text-center bg-slate-950/60 p-1.5 rounded-xl border border-slate-850 border-slate-800 text-indigo-350 text-indigo-300">
                  <div>T: 1</div>
                  <div>R: 4</div>
                  <div>B: 1</div>
                  <div>L: 5</div>
                </div>
              </div>
            </div>
            <p className="text-xs max-w-xs leading-relaxed text-slate-400 mb-6">
              이 화면은 <span className="text-purple-400 font-semibold">"물조각 (ID: 1)"</span> 카드의 단독 상세 렌더링 화면입니다. 카메라로 감지해주시거나 스캔해주세요.
            </p>
            <button
              onClick={() => setView('event')}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold uppercase text-xs rounded-xl shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-750 hover:to-purple-700 transition-all cursor-pointer border-0"
            >
              이벤트 홀로 복귀
            </button>
          </div>
        );
      case 'anime':
        return (
          <AnimeView
            language={language}
            onNavigate={setView}
            playSfx={playSfx}
            currentSeason={currentSeason}
            updateSns={updateSns}
            showCustomAlert={showCustomAlert}
          />
        );
      case 'movie':
        return (
          <MovieView
            language={language}
            onNavigate={setView}
            playSfx={playSfx}
            currentSeason={currentSeason}
            updateSns={updateSns}
            showCustomAlert={showCustomAlert}
          />
        );
      case 'modoo':
        return (
          <ModooView
            language={language}
            onNavigate={setView}
          />
        );
      case 'tool-makegrid':
      case 'tool-grid':
        return (
          <GridToolView
            language={language}
            onNavigate={setView}
          />
        );
      case 'tool-checkgrid':
        return (
          <GridCheckerView
            language={language}
            onNavigate={setView}
          />
        );
      case 'novel':
      case 'webtoon':
      case 'cartoonBook' as any:
        return (
          <NovelView
            language={language}
            onNavigate={setView}
            playSfx={playSfx}
            currentSeason={currentSeason}
            user={effectiveUser}
            updateSns={updateSns}
            showCustomAlert={showCustomAlert}
          />
        );
      default:
        return (
          <HomeView 
            user={effectiveUser} 
            totalPower={effectiveTotalPower} 
            currentDeck={currentDeck} 
            currentSeason={currentSeason}
            language={language} 
            onNavigate={(targetView) => {
              if (targetView === 'ranking') {
                setAutoStartPvp(true);
              }
              setView(targetView);
            }} 
            playSfx={playSfx} 
            bgmStarted={audioStarted} 
            startAudio={startAudio}
            handleLogin={handleLogin}
            handleLogout={handleLogout}
            isTutorialMode={isTutorialMode}
            tutorialStep={tutorialStep}
            onStartPlayNow={() => {
              setSeasonItem('hero_kadan_rpg_auto_mode', currentSeason, 'true');
              setView('main');
            }}
          />
        );
    }
  };

  if (!authInitialized) {
    const stageMessage = authProgress < 25
      ? (language === 'ko' ? '[01/04] 게임 엔진 및 세션 동기화 중...' : '[01/04] Initializing engine & session...')
      : authProgress < 55
      ? (language === 'ko' ? '[02/04] 시즌 데이터 & 카드 정보 로드 중...' : '[02/04] Loading season data & cards...')
      : authProgress < 85
      ? (language === 'ko' ? '[03/04] 사용자 프로필 & 클라우드 상태 확인 중...' : '[03/04] Checking user profile & cloud state...')
      : authProgress < 100
      ? (language === 'ko' ? '[04/04] 로비 인터페이스 & 리소스 세팅 중...' : '[04/04] Finalizing UI & assets...')
      : (language === 'ko' ? '[100%] 준비 완료! 게임 화면으로 진입합니다.' : '[100%] Game Ready! Entering game...');

    return (
      <div className="fixed inset-0 z-[999999] bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-full max-w-sm bg-white border border-[#201d1d]/15 rounded-sm p-6 sm:p-8 shadow-sm">
          {/* Header Badge */}
          <div className="inline-block text-[11px] font-bold tracking-widest uppercase bg-[#201d1d] text-[#fdfcfc] px-2.5 py-1 rounded-sm mb-4">
            [FAST LAUNCH]
          </div>
          
          <h1 className="text-base sm:text-lg font-black tracking-tight text-[#201d1d] mb-1">
            SNSHERO REVOLUTION
          </h1>
          <p className="text-xs text-[#201d1d]/60 mb-6 font-sans">
            {language === 'ko' ? '원클릭 AI 카드 게임 시스템' : 'One-Click AI Card Game System'}
          </p>

          {/* Progress Bar Container */}
          <div className="w-full bg-[#f0eded] h-3 rounded-sm border border-[#201d1d]/12 overflow-hidden mb-3 relative">
            <div 
              className="bg-[#201d1d] h-full rounded-none transition-all duration-150 ease-out" 
              style={{ width: `${Math.max(5, authProgress)}%` }}
            />
          </div>

          {/* Progress Percent & Stage text */}
          <div className="flex items-center justify-between text-xs font-bold text-[#201d1d] mb-4">
            <span className="text-[11px] text-[#201d1d]/70 font-mono tracking-tight">{stageMessage}</span>
            <span className="font-mono font-black text-sm">{authProgress}%</span>
          </div>

          {/* Notice & Force Reset */}
          <div className="mt-4 pt-4 border-t border-[#201d1d]/10 flex flex-col items-center gap-2">
            <p className="text-[10px] text-[#201d1d]/50 leading-relaxed max-w-xs">
              {t('session_corrupted_notice', language)}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 bg-[#201d1d] hover:bg-black text-[#fdfcfc] text-[11px] font-bold rounded-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCw size={12} className="animate-spin-slow" />
                {language === 'ko' ? '새로고침' : 'Refresh'}
              </button>
              <button
                onClick={() => window.location.href = '/logout'}
                className="px-3 py-1.5 bg-white text-[#201d1d] hover:bg-[#f0eded] text-[11px] font-bold rounded-sm border border-[#201d1d]/20 transition-all cursor-pointer"
              >
                {t('force_reset_session', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

    const showNavbar = (view !== 'admin' && view !== 'landing' && view !== 'cartoonBook' && view !== 'novel' && view !== 'webtoon' && view !== 'anime' && view !== 'movie') && (view !== 'play' || playGameState === 'modeSelect') && !isGlobalPopupOpen;
    
    return (
      <div className={cn(
        "w-full app-bg text-slate-800 font-sans selection:bg-indigo-500 selection:text-white flex flex-col xl:flex-row min-h-screen",
        view === 'play' ? "bg-[#060a14] text-slate-100" : "bg-slate-50/30",
        (view === 'play' && playGameState === 'playing') ? "min-h-screen overflow-y-auto" : "min-h-screen",
        simulationUser ? "pt-[36px]" : "",
        theme === 'dark' ? "theme-dark" : "",
        theme === 'metal' ? "theme-metal" : ""
      )}>
        {simulationUser && (
          <div className="fixed top-0 left-0 right-0 z-[99999] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-sans px-4 py-1.5 flex items-center justify-between text-[11px] md:text-xs font-bold shadow-md border-b border-white/10 select-none">
            <div className="flex items-center gap-2">
              <span className="animate-pulse text-yellow-300">⚡ SIMULATOR RUNNING</span>
              <span className="opacity-30">|</span>
              <span>USER: {simulationUser.displayName} ({simulationUser.uid})</span>
            </div>
            <button 
              onClick={endSimulation} 
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-0.5 rounded-lg border border-white/10 active:scale-95 transition-all text-[10px]"
            >
              END SIMULATION
            </button>
          </div>
        )}
        <Meta view={view} language={language} />

        {/* Desktop Fixed Left Sidebar Ad (xl screens only) — sticky, doesn't scroll away */}
        {!isAdRemoved && (
          <div className="hidden xl:block fixed left-0 top-0 h-screen w-[184px] z-40 pointer-events-none">
            <div className="h-full bg-slate-950 border-r border-slate-800 p-3 pointer-events-auto overflow-y-auto flex flex-col gap-3">
              <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
                <span className="text-[10px] font-black text-cyan-400 tracking-widest">{t('ad_notice', language)}</span>
                <span className="text-[8px] text-slate-600">AD</span>
              </div>
              <NativeAd
                language={language}
                variant="card"
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={cn(
          "flex-1 w-full max-w-[1024px] mx-auto relative flex flex-col shadow-2xl border-x transition-colors duration-200",
          view === 'play'
            ? "bg-[#060a14] border-slate-800/80"
            : (theme === 'dark' || theme === 'metal'
                ? "bg-slate-900 border-slate-800/80"
                : "bg-slate-50/30 border-slate-200/80"),
          (view === 'play' && playGameState === 'playing') ? "min-h-screen overflow-y-auto" : "min-h-screen"
        )}>
          {view !== 'landing' && (
            <>
              {/* Dedicated HUD Quick Audio Mute / Unmute Button */}
              <button
                onClick={toggleAudioMute}
                id="hud-audio-toggle"
                className={cn(
                  "fixed right-[3.75rem] min-[1024px]:right-[calc(50vw-444px)] z-[9999] min-h-11 min-w-11 backdrop-blur-xl rounded-lg shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center touch-target",
                  isAudioMuted
                    ? "bg-rose-500/10 border border-rose-500/50 text-rose-500 hover:bg-rose-500/20"
                    : (theme === 'dark' || theme === 'metal')
                    ? "bg-slate-900/90 border border-slate-800 text-white hover:bg-slate-850 hover:text-indigo-400"
                    : "bg-white/90 border border-slate-200/80 text-slate-700 hover:text-indigo-600 hover:bg-white"
                )}
                style={{
                  top: adBannerHeight > 0
                    ? `${adBannerHeight + 4}px`
                    : '10px'
                }}
                title={isAudioMuted ? t('hud_audio_unmute', language) : t('hud_audio_mute', language)}
                aria-label={isAudioMuted ? t('hud_audio_unmute', language) : t('hud_audio_mute', language)}
              >
                {isAudioMuted ? (
                  <VolumeX size={20} className="text-rose-500 animate-pulse" />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>

              {/* HUD Main Hamburger Menu Button */}
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setIsMenuOpen(true);
                }}
                className={cn(
                  "fixed right-4 min-[1024px]:right-[calc(50vw-496px)] z-[9999] min-h-11 min-w-11 backdrop-blur-xl rounded-lg shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center touch-target",
                  (theme === 'dark' || theme === 'metal')
                    ? "bg-slate-900/90 border border-slate-800 text-white hover:bg-slate-850 hover:text-indigo-400"
                    : "bg-white/90 border border-slate-200/80 text-slate-700 hover:text-indigo-600 hover:bg-white"
                )}
                style={{
                  // 광고 배너 바로 아래에 버튼 배치
                  top: adBannerHeight > 0
                    ? `${adBannerHeight + 4}px`
                    : '10px'
                }}
                title={t('menu_title', language)}
              >
                <Menu size={20} />
              </button>
            </>
          )}

          {view !== 'landing' && view !== 'home' && (
            <button
              onClick={handleGlobalBack}
              className={cn(
                "fixed left-4 min-[1024px]:left-[calc(50vw-496px)] z-[9999] min-h-11 min-w-11 backdrop-blur-xl rounded-lg shadow-md flex items-center justify-center active:scale-95 transition-all cursor-pointer touch-target",
                (theme === 'dark' || theme === 'metal')
                  ? "bg-slate-900/90 border border-slate-800 text-white hover:bg-slate-850 hover:text-indigo-400"
                  : "bg-white/90 border border-slate-200/80 text-slate-700 hover:text-indigo-600 hover:bg-white"
              )}
              style={{
                top: adBannerHeight > 0
                  ? `${adBannerHeight + 4}px`
                  : '10px'
              }}
              title={language === 'ko' ? '뒤로가기' : 'Back'}
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Hamburger slide menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                {/* Back backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    setIsMenuOpen(false);
                  }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[10000] cursor-pointer"
                />
                {/* Menu content panel */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                  className="fixed top-0 right-0 h-full w-[280px] sm:w-[320px] bg-white/96 backdrop-blur-xl border-l border-slate-200/80 z-[10001] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.08)] font-sans text-slate-800 p-5 select-none overflow-y-auto"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0 mb-6">
                    <span className="text-lg font-bold tracking-tight uppercase text-slate-800">
                      {t('menu_title', language)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          setIsMenuOpen(false);
                          setView('setting');
                        }}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 active:scale-95 transition-all cursor-pointer bg-white flex items-center justify-center text-slate-600 shadow-sm"
                        title={t('setting', language)}
                      >
                        <Settings size={18} />
                      </button>
                      <a
                        href="https://shop.snshero.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          setIsMenuOpen(false);
                        }}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 active:scale-95 transition-all cursor-pointer bg-white flex items-center justify-center text-slate-600 shadow-sm"
                        title={language === 'ko' ? '공식 기념품 샵' : 'Souvenir Shop'}
                      >
                        <ShoppingBag size={18} />
                      </a>
                      <button
                        onClick={() => {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          setIsMenuOpen(false);
                          setView('wiki');
                        }}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 active:scale-95 transition-all cursor-pointer bg-white flex items-center justify-center text-slate-600 font-bold text-sm w-9 h-9 shadow-sm"
                        title={language === 'ko' ? '위키 가이드' : 'Wiki Guide'}
                      >
                        <HelpCircle size={18} />
                      </button>
                      <button
                        onClick={() => {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                          setIsMenuOpen(false);
                        }}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-red-500 active:scale-95 transition-all cursor-pointer bg-white text-slate-600 shadow-sm"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Menu items list (Scrollable with layout container) */}
                  <div className="flex-1 flex flex-col space-y-3.5 mb-6 min-h-0">
                    {/* 1. Login status area */}
                    {(!effectiveUser || effectiveUser.uid === 'guest-id') ? (
                      <button
                        onClick={async () => {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
                          setIsMenuOpen(false);
                          try {
                            await handleLogin();
                          } catch (err) {
                            console.error("Login failed:", err);
                          }
                        }}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-4 text-left transition-all relative flex items-center justify-between font-sans shadow-md shadow-orange-500/10 hover:shadow-lg active:scale-[0.98] cursor-pointer rounded-xl group"
                      >
                        <div className="flex items-center gap-3">
                          <User size={20} className="text-white" />
                          <span className="font-bold text-sm uppercase tracking-tight">
                            {t('menu_login', language)}
                          </span>
                        </div>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-white" />
                      </button>
                    ) : (
                      <div className="flex gap-2.5 w-full">
                        <button
                          onClick={() => {
                            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                            setIsMenuOpen(false);
                            setView('profile');
                          }}
                          className="flex-1 border border-slate-100 p-3.5 text-left transition-all relative flex items-center justify-between font-sans bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-100 active:scale-[0.98] shadow-sm cursor-pointer rounded-xl group min-w-0"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-white shrink-0 flex items-center justify-center">
                              {effectiveUser.photoURL && effectiveUser.photoURL.startsWith('card:') ? (
                                <div className="w-full h-full scale-125" style={getCardAvatarStyle(effectiveUser.photoURL)} />
                              ) : effectiveUser.photoURL && effectiveUser.photoURL.startsWith('preset:') ? (
                                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${effectiveUser.photoURL.split(':')[1]}`} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <img src={effectiveUser.photoURL || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=guest'} alt="avatar" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider leading-none">SIGNED_IN</span>
                              <span className="font-bold text-sm truncate text-slate-800 mt-1">
                                {effectiveUser.displayName || 'HUNTER'}
                              </span>
                            </div>
                          </div>
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform shrink-0 text-indigo-500" />
                        </button>
                        <button
                          onClick={async () => {
                            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                            setIsMenuOpen(false);
                            try {
                              await handleLogout();
                            } catch (err) {
                              console.error("Logout failed:", err);
                            }
                          }}
                          className="p-3.5 border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-100 active:scale-[0.98] shadow-sm cursor-pointer bg-white flex items-center justify-center text-slate-600 hover:text-red-500 shrink-0"
                          title={language === 'ko' ? '로그아웃' : 'Logout'}
                        >
                          <LogOut size={20} />
                        </button>
                      </div>
                    )}

                    {/* Community (Instagram style social feed) */}
                    <button
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setIsMenuOpen(false);
                        setView('community');
                      }}
                      className="w-full border border-slate-100 p-3.5 text-left transition-all relative flex items-center justify-between font-sans bg-white hover:bg-slate-50/80 active:scale-[0.98] shadow-xs hover:border-slate-200 cursor-pointer rounded-xl group"
                    >
                      <div className="flex items-center gap-3">
                        <Camera size={20} className="text-slate-700 group-hover:text-indigo-600 transition-colors" />
                        <span className="font-bold text-sm uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500">
                          {t('community', language)}
                        </span>
                      </div>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-pink-500 animate-pulse" />
                    </button>

                    {/* Guild Management */}
                    <button
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setIsMenuOpen(false);
                        setView('guild-list');
                      }}
                      className="w-full border border-slate-100 p-3.5 text-left transition-all relative flex items-center justify-between font-sans bg-white hover:bg-slate-50/80 active:scale-[0.98] shadow-xs hover:border-slate-200 cursor-pointer rounded-xl group"
                    >
                      <div className="flex items-center gap-3">
                        <Shield size={20} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                        <span className="font-bold text-sm uppercase tracking-tight text-slate-700 group-hover:text-slate-900 transition-colors">
                          {t('guild_management', language)}
                        </span>
                      </div>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-slate-600" />
                    </button>

                    {/* Event */}
                    <button
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setIsMenuOpen(false);
                        setView('event');
                      }}
                      className="w-full border border-slate-100 p-3.5 text-left transition-all relative flex items-center justify-between font-sans bg-white hover:bg-slate-50/80 active:scale-[0.98] shadow-xs hover:border-slate-200 cursor-pointer rounded-xl group"
                    >
                      <div className="flex items-center gap-3">
                        <Gift size={20} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                        <span className="font-bold text-sm uppercase tracking-tight text-slate-700 group-hover:text-slate-900 transition-colors">
                          {t('event', language)}
                        </span>
                      </div>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-slate-600" />
                    </button>

                    {/* Stock Market */}
                    <button
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setIsMenuOpen(false);
                        setView('stock-market');
                      }}
                      className="w-full border border-slate-100 p-3.5 text-left transition-all relative flex items-center justify-between font-sans bg-white hover:bg-slate-50/80 active:scale-[0.98] shadow-xs hover:border-slate-200 cursor-pointer rounded-xl group"
                    >
                      <div className="flex items-center gap-3">
                        <Coins size={20} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                        <span className="font-bold text-sm uppercase tracking-tight text-slate-700 group-hover:text-slate-900 transition-colors">
                          {t('stock_market', language)}
                        </span>
                      </div>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-slate-600" />
                    </button>

                    {/* Prediction Market */}
                    <button
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setIsMenuOpen(false);
                        setView('prediction-market');
                      }}
                      className="w-full border border-slate-100 p-3.5 text-left transition-all relative flex items-center justify-between font-sans bg-white hover:bg-slate-50/80 active:scale-[0.98] shadow-xs hover:border-slate-200 cursor-pointer rounded-xl group"
                    >
                      <div className="flex items-center gap-3">
                        <BarChart3 size={20} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                        <span className="font-bold text-sm uppercase tracking-tight text-slate-700 group-hover:text-slate-900 transition-colors">
                          {t('prediction_market', language)}
                        </span>
                      </div>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-slate-600" />
                    </button>
                    {/* Utility Tools Accordion (그리드 생성기 / 그리드 검수기) */}
                    <div className="w-full flex flex-col border border-slate-200 bg-slate-50/70 rounded-xl overflow-hidden shadow-xs transition-all">
                      <button
                        onClick={() => {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          setIsUtilityOpen(prev => !prev);
                        }}
                        className="w-full p-3.5 text-left transition-all flex items-center justify-between font-sans bg-white hover:bg-slate-50 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <Wrench size={20} className="text-amber-600 group-hover:rotate-12 transition-transform" />
                          <div className="flex flex-col">
                            <span className="font-bold text-sm uppercase tracking-tight text-slate-800 flex items-center gap-1.5">
                              <span>{language === 'ko' ? '유틸리티' : 'Utility'}</span>
                              <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xs">TOOLS</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {language === 'ko' ? '개발 & 레이아웃 도구 모음' : 'Dev & Layout Toolset'}
                            </span>
                          </div>
                        </div>
                        <ChevronDown 
                          size={18} 
                          className={`text-slate-400 transition-transform duration-200 ${isUtilityOpen ? 'rotate-180 text-slate-700' : ''}`} 
                        />
                      </button>

                      {/* Accordion Content */}
                      <AnimatePresence>
                        {isUtilityOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t border-slate-200/80 bg-slate-50/50 p-2 space-y-1.5"
                          >
                            {/* [1] Grid Generator (/tool/makegrid) */}
                            <button
                              onClick={() => {
                                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                                setIsMenuOpen(false);
                                setView('tool-makegrid');
                              }}
                              className="w-full p-2.5 bg-white hover:bg-emerald-50 text-left border border-slate-200 hover:border-emerald-300 rounded-lg flex items-center justify-between transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5">
                                <Grid3X3 size={17} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-900 flex items-center gap-1.5">
                                    <span>{language === 'ko' ? '그리드 생성기' : 'Grid Generator'}</span>
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono">/tool/makegrid</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-xs">
                                [→]
                              </span>
                            </button>

                            {/* [2] Grid Checker (/tool/checkgrid) */}
                            <button
                              onClick={() => {
                                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                                setIsMenuOpen(false);
                                setView('tool-checkgrid');
                              }}
                              className="w-full p-2.5 bg-white hover:bg-indigo-50 text-left border border-slate-200 hover:border-indigo-300 rounded-lg flex items-center justify-between transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5">
                                <CheckCircle2 size={17} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-900 flex items-center gap-1.5">
                                    <span>{language === 'ko' ? '그리드 검수기' : 'Grid Checker'}</span>
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono">/tool/checkgrid</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-xs">
                                [→]
                              </span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Bottom area (Settings & Footer) */}
                  <div className="mt-auto pt-4 border-t border-slate-100 shrink-0 flex flex-col space-y-4">
                    {/* Footer / Info */}
                    <div className="text-center pt-2">
                      <button
                        onClick={() => {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          setIsMenuOpen(false);
                          setView('modoo');
                        }}
                        className="text-[10px] font-bold text-slate-400 hover:text-[#201d1d] tracking-wider uppercase transition-colors cursor-pointer py-1 px-2 rounded-sm hover:bg-slate-100"
                        title={language === 'ko' ? '내부 개발팀 전용 모니터링 (클릭하여 이동)' : 'Internal Dev Team Monitor'}
                      >
                        SNS_HERO v2.1.0
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Mobile/Tablet Native Ad (Top-side) — P2-2: 인피드 네이티브 광고로 교체 */}
          {!isAdRemoved && (
            <div ref={adBannerRef} className="block xl:hidden w-full bg-white/80 backdrop-blur-sm border-b border-slate-200 p-2 shrink-0 select-none">
              <NativeAd 
                language={language}
                variant="banner"
                className="w-full max-w-[468px] mx-auto"
              />
            </div>
          )}
          {/* Simulation Mode Floating Stop Button (Removed) */}

          {/* Simulation Indicator (Removed) */}

          <div className={cn(
            "flex-1 flex flex-col",
            view === 'play' ? "h-full overflow-hidden" : "overflow-x-hidden",
            (view !== 'play' && view !== 'home') && "pt-4",
            (showNavbar && view !== 'play') ? "pb-20" : "pb-0"
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="flex-1 flex flex-col"
              >
                <Suspense
                  fallback={
                    <div className="flex min-h-[40vh] flex-1 items-center justify-center p-6 text-center font-mono">
                      <div className="flex flex-col items-center gap-2.5 bg-white/80 border border-[#201d1d]/12 px-6 py-5 rounded-sm shadow-xs max-w-xs w-full">
                        <div className="w-full bg-[#f0eded] h-2 rounded-none border border-[#201d1d]/10 overflow-hidden relative">
                          <div className="bg-[#201d1d] h-full w-2/3 animate-pulse" />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#201d1d]">
                          [{t('loading', language)}]
                        </span>
                      </div>
                    </div>
                  }
                >
                  <SnsProvider sns={sns} updateSns={updateSns} setCurrentDeck={setCurrentDeck} selectedCompanionIndex={selectedCompanionIndex}>
                  {renderView()}
                </SnsProvider>
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {showNavbar && (
            <Navbar 
              currentView={view} 
              setView={(target) => {
                if (tutorialStep === 1 && target === 'play') {
                  setTutorialStep(2);
                }
                setView(target);
                setIsChatOpen(false);
              }} 
               setIsAutoBattle={(val) => setIsAutoBattle(val)}
              playSfx={playSfx} 
              language={language}
              onRandomPlay={() => {
                setRandomPlayTrigger(prev => prev + 1);
                setView('play');
              }}
            />
          )}

          <CortanaCommandButton
            language={language}
            onNavigate={(target) => {
              setView(target);
              setIsChatOpen(false);
            }}
            playSfx={playSfx}
            showCustomAlert={showCustomAlert}
            setIsAutoBattle={setIsAutoBattle}
            isAlignedWithLowChatButton={view === 'play' && playGameState !== 'lobby' && playGameState !== 'modeSelect'}
            hidden={true}
            lowSpecMode={lowSpecMode}
          />

        {/* Global Chat Floating Button */}
        {view !== 'landing' && view !== 'cartoonBook' && view !== 'novel' && view !== 'webtoon' && (
          <>
          <div className="fixed left-0 right-0 w-full max-w-[1024px] mx-auto z-[10000] pointer-events-none bottom-[calc(env(safe-area-inset-bottom)+5rem)]">
                 {/* Random Play Button — left side */}
                 <div className="absolute left-4 bottom-0 pointer-events-auto">
                   <button
                     onClick={() => {
                       if (diceState !== 'idle') return;
                       playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                       setDiceState('rolling');
                       setDiceGameTitle('');
                       // Roll for 2 seconds then reveal
                       diceTimeoutRef.current = window.setTimeout(() => {
                         const games: { id: string; title: string }[] = [
                           { id: 'tictactoe', title: '틱택토' },
                           { id: 'gomoku', title: '오목' },
                           { id: 'slide2048', title: '2048 퍼즐' },
                           { id: 'minesweeper', title: '지뢰찾기' },
                           { id: 'pacman', title: '팩맨' },
                           { id: 'breakout', title: '벽돌깨기' },
                           { id: 'snake', title: '스네이크대전' },
                           { id: 'shooting', title: '슈팅대전' },
                           { id: 'trex', title: '티렉스러너' },
                           { id: 'memorymatch', title: '메모리매치' },
                         ];
                         const picked = games[Math.floor(Math.random() * games.length)];
                         setDiceState('reveal');
                         setDiceGameTitle(picked.title);
                         setPreselectedGameId(picked.id);
                         playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
                         // Navigate after 1.5s reveal
                         diceTimeoutRef.current = window.setTimeout(() => {
                           setDiceState('idle');
                           setView('play');
                           // Reset after navigation
                           setTimeout(() => setPreselectedGameId(null), 500);
                         }, 1500);
                       }, 2000);
                     }}
                     className="w-12 h-12 border border-slate-200 rounded-xl flex items-center justify-center transition-all bg-white active:scale-95 relative shadow-xl hover:scale-105 hover:text-indigo-600 text-slate-700"
                     title="랜덤 플레이"
                   >
                     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <rect x="3" y="3" width="18" height="18" rx="3" />
                       <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                       <circle cx="16" cy="8" r="1.5" fill="currentColor" />
                       <circle cx="8" cy="16" r="1.5" fill="currentColor" />
                       <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                     </svg>
                   </button>
                 </div>
                 {/* Chat + Auto Battle Buttons — right side */}
                 <div className="absolute right-4 bottom-0 flex flex-col items-center pointer-events-auto gap-2">
                   {/* Chat Toggle */}
                   <button
                     id="global-chat-toggle-btn"
                    onClick={() => {
                      setIsChatOpen(!isChatOpen);
                      if (!isChatOpen) setUnreadCount(0);
                    }}
                    className={cn(
                      "w-12 h-12 border border-slate-200 rounded-lg flex items-center justify-center transition-all bg-white active:scale-95 relative shadow-xl hover:scale-105",
                      isChatOpen ? "bg-black text-white" : "hover:bg-gray-800 hover:text-white",
                      (!isChatOpen && unreadCount > 0) && "ring-4 ring-yellow-400 ring-offset-2 animate-bounce"
                    )}
                  >
                    {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
                    <AnimatePresence>
                      {!isChatOpen && unreadCount > 0 && (
                        <motion.span 
                          key="unread-badge"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black min-w-[22px] h-5.5 rounded-full flex items-center justify-center border-2 border-white px-1 shadow-lg animate-pulse z-10"
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    
                    {/* Visual glow when new messages are pending */}
                    {!isChatOpen && unreadCount > 0 && (
                      <div className="absolute inset-0 rounded-full animate-ping bg-yellow-400 opacity-20 pointer-events-none" />
                    )}
                  </button>
                </div>
             </div>

          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: view === 'play' ? 0 : 50, x: view === 'play' ? 60 : 0, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                exit={{ opacity: 0, y: view === 'play' ? 0 : 50, x: view === 'play' ? 60 : 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                  view === 'play'
                    ? "fixed right-2 sm:right-4 md:right-6 lg:right-8 top-12 sm:top-14 bottom-24 sm:bottom-28 md:bottom-20 w-[92vw] sm:w-[320px] md:w-[340px] lg:w-[380px] max-h-[calc(100dvh-120px)] md:max-h-[560px] bg-[#090d16]/95 backdrop-blur-md text-white z-[10000] flex flex-col overflow-hidden rounded-xl border border-slate-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.8)] font-mono"
                    : "fixed inset-0 w-full h-full max-h-none border-0 rounded-none shadow-none md:inset-auto md:bottom-36 md:right-4 md:left-auto md:w-[360px] md:h-auto md:max-h-[500px] bg-white z-[10000] flex flex-col overflow-hidden md:rounded-3xl md:border md:border-slate-200/80 md:shadow-2xl"
                )}
              >
              <div className={cn(
                "p-3.5 flex items-center justify-between border-b shrink-0 select-none",
                view === 'play'
                  ? "bg-slate-950/90 text-white border-slate-800"
                  : "bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-700/10"
              )}>
                 <div className="flex items-center gap-2">
                    <MessageCircle size={18} className={view === 'play' ? "text-indigo-400" : "text-white"} />
                    <span className="text-xs sm:text-sm font-bold tracking-wider uppercase font-mono">
                      {view === 'play' ? (language === 'ko' ? '전투 통신망' : 'BATTLE COMMS') : t('global_network_persistent', language)}
                    </span>
                 </div>
                 <div className="flex items-center gap-1.5 sm:gap-2">
                   <label className="flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer hover:text-yellow-400 select-none text-slate-300 shrink-0 mr-1">
                     <input 
                       type="checkbox" 
                       checked={showAllChats} 
                       onChange={(e) => {
                         setShowAllChats(e.target.checked);
                         playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                       }}
                       className={cn("w-3 h-3 cursor-pointer", view === 'play' ? "accent-indigo-500" : "accent-yellow-400")}
                     />
                     <span>{t('all_chats', language)}</span>
                   </label>
                   <button 
                     onClick={() => {
                       setUnreadCount(0);
                       scrollToBottom();
                     }}
                     className={cn(
                       "text-[9px] font-bold uppercase px-2 py-0.5 rounded transition-colors",
                       view === 'play'
                         ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                         : "bg-white text-black hover:bg-yellow-400"
                     )}
                   >
                     {t('read_all', language)}
                   </button>
                   <button 
                     onClick={() => setIsChatOpen(false)} 
                     className={cn("transition-colors p-1", view === 'play' ? "text-slate-400 hover:text-red-400" : "hover:text-red-400")}
                     title="Close Chat"
                   >
                      <X size={20} />
                   </button>
                 </div>
              </div>

              {/* AI Persona Selector */}
              <div className={cn(
                "p-1.5 flex gap-1 overflow-x-auto scrollbar-hide shrink-0 border-b",
                view === 'play'
                  ? "bg-slate-950 border-slate-800"
                  : "bg-gray-50 border-b-2 border-black"
              )}>
                <div className="flex items-center px-1 mr-1">
                  <Bot size={12} className={view === 'play' ? "text-indigo-400" : "text-black/30"} />
                </div>
                {(['helpful', 'aggressive', 'sarcastic', 'mysterious'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      setBotRole(role);
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    }}
                    className={cn(
                      "px-2 py-0.5 text-[9px] font-bold font-mono uppercase tracking-tighter truncate rounded border transition-all shrink-0 cursor-pointer",
                      botRole === role 
                        ? (view === 'play' ? "bg-indigo-600 text-white border-indigo-500 shadow-xs" : "bg-black text-white border-black shadow-sm")
                        : (view === 'play' ? "bg-slate-900 text-slate-400 border-slate-800 hover:text-white" : "bg-white text-black/40 border-black/10 hover:border-black/30")
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
              
              <div className={cn(
                "flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 flex flex-col text-[12px] sm:text-[13px] font-mono",
                view === 'play' ? "bg-[#060a14]/90 text-slate-200" : "bg-white text-slate-900"
              )}>
                 {allMessages.map((msg, idx) => {
                    const isMe = msg.userId === (effectiveUser?.uid || effectiveUser?.id);
                    const msgDate = msg.createdAt ? (msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt)) : new Date();
                    const timeStr = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateStr = msgDate.toLocaleDateString([], { month: 'numeric', day: 'numeric' });

                    return (
                      <div key={msg.id || `chat-msg-${idx}`} className={cn(
                        "flex flex-col max-w-[85%]",
                        isMe ? "self-end items-end text-right" : "self-start items-start text-left"
                      )}>
                        <button 
                         onClick={() => {
                           if (!isMe && !msg.isBot && msg.userId) {
                             showCustomConfirm(
                               language === 'ko' ? '전투 도전' : 'CHALLENGE',
                               t('confirm_attack_user', language),
                               () => handleAttackFromChat(msg.userId!)
                             );
                           }
                         }}
                          className={cn(
                            "text-[10px] mb-0.5 px-1 font-bold flex items-center gap-1 flex-wrap",
                            isMe 
                              ? (view === 'play' ? "text-indigo-400" : "text-blue-600") 
                              : msg.isBot 
                              ? (view === 'play' ? "text-rose-400" : "text-red-600") 
                              : (view === 'play' ? "text-slate-400 hover:underline" : "text-gray-500 hover:underline")
                          )}
                        >
                          <span>{msg.name}</span>
                          {msg.isLocalAiReply && msg.aiBadgeLabel && (
                            <span className={cn(
                              "inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide",
                              view === 'play'
                                ? "border border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
                                : "border border-emerald-300 bg-emerald-50 text-emerald-700"
                            )}>
                              {msg.aiBadgeLabel}
                            </span>
                          )}
                          <span className="text-[11px]" title={msg.language?.toUpperCase() || 'EN'}>
                            {FLAG_MAP[msg.language || 'en'] || '🇺🇸'}
                          </span>
                        </button>
                        
                        <div className={cn(
                          "flex items-center gap-1.5 w-full",
                          isMe ? "flex-row-reverse" : "flex-row"
                        )}>
                          <div className={cn(
                            "px-3 py-1.5 rounded-2xl text-[12px] sm:text-[13px] break-words shadow-sm border max-w-full leading-relaxed",
                            view === 'play'
                              ? (isMe ? "bg-indigo-600/90 text-white border-indigo-500 rounded-tr-none" : 
                                 msg.isBot ? "bg-rose-950/70 text-rose-200 border-rose-800/80 rounded-tl-none" :
                                 "bg-slate-800/90 text-slate-100 border-slate-700 rounded-tl-none")
                              : (isMe ? "bg-blue-600 text-white border-blue-700 rounded-tr-none" : 
                                 msg.isBot ? "bg-red-50 text-red-900 border-red-200 rounded-tl-none" :
                                 "bg-gray-100 text-gray-800 border-gray-200 rounded-tl-none")
                          )}>
                            {translatedTexts[msg.id] ? (
                              <div>
                                <span className="italic">{translatedTexts[msg.id]}</span>
                                <span className="text-[9px] opacity-60 block mt-1 border-t border-black/10 pt-1 text-left">
                                  🌐 {t('translated', language)}
                                </span>
                              </div>
                            ) : msg.meta?.type === 'admin-help' ? (
                              <div className="space-y-3 min-w-[260px]">
                                <p className="text-[12px] font-semibold">{msg.text}</p>
                                <div className="space-y-2">
                                  {msg.meta.items.map((item) => (
                                    <div key={item.key} className={cn(
                                      "rounded-2xl border px-3 py-3 text-left shadow-sm",
                                      view === 'play' ? "border-red-500/30 bg-slate-900/80 text-slate-200" : "border-red-200/80 bg-white text-slate-900"
                                    )}>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                                          {item.command}
                                        </span>
                                        <span className={cn(
                                          "rounded-full border px-2.5 py-1 text-[10px] font-bold",
                                          view === 'play' ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"
                                        )}>
                                          {item.risk === 'confirm' ? t('admin_slash_risk_confirm', language) : t('admin_slash_risk_safe', language)}
                                        </span>
                                      </div>
                                      <p className="mt-2 text-[12px] font-medium leading-5">{item.description}</p>
                                      <div className="mt-2 space-y-1 text-[11px] leading-5 opacity-75">
                                        <p>
                                          <span className="font-bold">{t('admin_slash_help_example_label', language)}</span> {item.example}
                                        </p>
                                        <p>
                                          <span className="font-bold">{t('admin_slash_help_permission_label', language)}</span> {item.permission}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              msg.text
                            )}
                          </div>
                          
                          {!msg.meta && (
                            <button
                              onClick={() => handleTranslateChat(msg.id, msg.text)}
                              className={cn(
                                "p-1.5 border rounded-lg shrink-0 flex items-center justify-center cursor-pointer transition-all",
                                view === 'play'
                                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                  : "border border-black bg-white hover:bg-yellow-100 active:translate-y-0.5 active:shadow-none shadow-[1px_1px_0px_rgba(0,0,0,1)] text-black",
                                translatedTexts[msg.id] && (view === 'play' ? "bg-indigo-700 text-white" : "bg-yellow-400")
                              )}
                              title={t('translate', language)}
                            >
                              <Languages size={11} className={translatingIds.has(msg.id) ? "animate-spin" : ""} />
                            </button>
                          )}
                        </div>
                        
                        <div className="text-[9px] text-gray-400 mt-0.5 flex gap-1 opacity-70">
                          <span>{dateStr}</span>
                          <span>{timeStr}</span>
                        </div>
                      </div>
                    );
                 })}
                 <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendChat} className={cn(
                "flex gap-1.5 shrink-0 border-t",
                view === 'play' ? "p-2 sm:p-2.5 bg-slate-950 border-slate-800" : "p-3 border-t-4 border-black flex gap-2 bg-white pb-3"
              )}>
                 <input 
                  id="global-chat-input"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (chatHistory.length === 0) return;
                      let nextIdx = historyIndex;
                      if (historyIndex === -1) {
                        nextIdx = chatHistory.length - 1;
                      } else if (historyIndex > 0) {
                        nextIdx = historyIndex - 1;
                      }
                      setHistoryIndex(nextIdx);
                      setChatInput(chatHistory[nextIdx]);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (chatHistory.length === 0) return;
                      if (historyIndex === -1) return;
                      let nextIdx = historyIndex + 1;
                      if (nextIdx < chatHistory.length) {
                        setHistoryIndex(nextIdx);
                        setChatInput(chatHistory[nextIdx]);
                      } else {
                        setHistoryIndex(-1);
                        setChatInput("");
                      }
                    }
                  }}
                  className={cn(
                    "flex-1 p-2 sm:p-2.5 text-xs sm:text-sm font-mono font-bold outline-none rounded-lg",
                    view === 'play'
                      ? "bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                      : "border-2 border-black p-3 text-sm font-bold outline-none focus:bg-yellow-100 placeholder:text-gray-400"
                  )}
                  placeholder={localAiStatus.state === 'ready'
                    ? t('local_ai_chat_placeholder_ready', language)
                    : t('local_ai_chat_placeholder_fallback', language)}
                  maxLength={100}
                 />
                 <button 
                   type="submit" 
                   className={cn(
                     "px-3.5 flex items-center justify-center transition-colors rounded-lg cursor-pointer",
                     view === 'play'
                       ? "bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-500 shadow-sm"
                       : "bg-black text-white px-4 border-2 border-black hover:bg-white hover:text-black"
                   )}
                 >
                    <PlusCircle size={20} />
                 </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )}
    
    {/* Item Drop Notification */}
      <AnimatePresence>
        {itemDropNotification && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="bg-white border-4 border-black p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center">
               <div className="text-4xl mb-4 animate-bounce">🎁</div>
               <h2 className="text-xl font-black uppercase italic tracking-tighter mb-1">{t('item_dropped', language)}</h2>
               <div className={cn(
                 "p-4 border-2 rounded-xl mb-6 shadow-inner",
                 itemDropNotification.rarity === 'rare' ? "border-yellow-400 bg-yellow-50" : 
                 itemDropNotification.rarity === 'magic' ? "border-blue-400 bg-blue-50" : "border-gray-100 bg-gray-50"
               )}>
                 <p className="font-black text-lg leading-none mb-1 text-black">{(language === 'ko' ? itemDropNotification.name_ko : itemDropNotification.name_en)}</p>
                 <p className="text-[10px] opacity-60 mb-2 font-bold uppercase tracking-widest">{t(`slot_${itemDropNotification.slot}` as any, language)}</p>
                 <p className="text-[11px] font-medium text-gray-600 mb-4 leading-tight px-2">
                    {language === 'ko' ? itemDropNotification.description_ko : itemDropNotification.description_en}
                 </p>
                 <div className="flex justify-center gap-4 text-[10px] font-black border-t border-black/5 pt-3">
                    <span className="text-blue-600 font-black uppercase bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                      {itemDropNotification.stats?.map((s: number) => s >= 0 ? '+' + s : s).join(', ') || 'N/A'}
                    </span>
                 </div>
               </div>
               <button 
                 onClick={() => setItemDropNotification(null)}
                 className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-900 active:scale-95 transition-all shadow-lg"
               >
                 {t('close', language) || "DONE"}
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        {/* Tutorial Overlays */}

      {isSimulationActive && (
        <Suspense fallback={null}>
          <SimulationOverlay
            key={`sim-${isSimulationActive}`}
            language={language}
            isActive={isSimulationActive}
            setIsActive={setIsSimulationActive}
            isAutoLoop={isAutoLoop}
            setIsAutoLoop={setIsAutoLoop}
            currentView={view}
            onNavigate={setView}
            setIsAutoBattle={setIsAutoBattle}
            isAutoBattle={isAutoBattle}
            sns={sns}
            onError={(err) => {
              setTestErrorHistory(prev => [...prev, { ...err, timestamp: Date.now() }]);
            }}
            onComplete={(report) => {
              setLastTestReport(report);
              setView('admin');
            }}
          />
        </Suspense>
      )}
      {/* Tutorial Overlay System */}
      <AnimatePresence>
        {isTutorialMode && (
          <>
            {/* Always accessible top/bottom skip button layer */}
            <div className="fixed top-3 right-3 z-[9999999] pointer-events-auto">
              <button
                type="button"
                id="skip-tutorial-main-btn"
                onClick={handleSkipTutorial}
                aria-label="SKIP TUTORIAL"
                data-testid="skip-tutorial-btn"
                className="bg-slate-900/95 hover:bg-slate-900 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl font-black uppercase tracking-wider text-xs border border-slate-700 shadow-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                SKIP TUTORIAL
              </button>
            </div>

            {((tutorialStep === 1 && view === 'home') || (tutorialStep === 8 && view === 'shop') || (tutorialStep === 11 && view === 'mydeck') || tutorialStep === 12) && (
              <div className="fixed inset-0 z-[1000] pointer-events-none bg-slate-950/45 backdrop-blur-[1px]">
                {/* Step 1: Home Guide */}
                {tutorialStep === 1 && view === 'home' && (
                  <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-sm p-6 pointer-events-auto">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(59,130,246,0.15)] space-y-4 text-white"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                          <Zap size={22} className="animate-pulse" />
                        </div>
                        <h3 className="font-black italic uppercase tracking-wider text-xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-blue-400">
                          {t('tutorial_start_title', language)}
                        </h3>
                      </div>
                      <button 
                        onClick={() => {
                          setView('play');
                          setTutorialStep(3);
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(59,130,246,0.3)] active:scale-[0.98] border border-blue-500/30 cursor-pointer"
                      >
                        {t('tutorial_start_btn', language)}
                      </button>
                      <button 
                        onClick={handleSkipTutorial}
                        aria-label="Skip tutorial step"
                        data-testid="skip-tutorial-card-btn"
                        className="w-full bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-slate-800 hover:border-slate-700 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        {t('skip_tutorial', language)}
                      </button>
                    </motion.div>
                  </div>
                )}


            {/* Step 8: Shop Guide */}
            {tutorialStep === 8 && view === 'shop' && (
              <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm pointer-events-auto">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  className="bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl p-10 rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(234,179,8,0.15)] max-w-sm w-full text-center space-y-8 relative overflow-hidden text-white"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500" />
                  <div className="w-20 h-20 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(234,179,8,0.25)]">
                    <Sparkles size={40} className="text-yellow-400" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 font-black italic uppercase tracking-wider text-3xl leading-none">
                      {t('tutorial_collect_title', language)}
                    </h3>
                    <p className="text-base font-semibold leading-relaxed text-slate-300 px-2">
                      {t('tutorial_collect_desc', language)}
                    </p>
                  </div>
                  <button 
                    onClick={() => setTutorialStep(9)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black py-4.5 rounded-[20px] font-black uppercase tracking-widest text-lg border border-yellow-450/40 shadow-[0_4px_25px_rgba(234,179,8,0.3)] hover:from-yellow-400 hover:to-amber-400 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {t('tutorial_open_pack_btn', language)}
                  </button>
                </motion.div>
              </div>
            )}

            {/* Step 11: MyDeck Guide */}
            {tutorialStep === 11 && view === 'mydeck' && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-6 pointer-events-auto">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl p-8 rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(99,102,241,0.15)] max-w-md w-full space-y-6 text-white"
                >
                  <h3 className="text-2xl font-black italic uppercase tracking-wider border-b border-slate-800 pb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                    {t('guide_my_deck_title', language)}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-center">
                      <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1 text-xs font-black rounded-lg shadow-[0_0_10px_rgba(99,102,241,0.2)]">01</div>
                      <p className="text-sm font-semibold text-slate-300">{t('guide_my_deck_step1', language)}</p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1 text-xs font-black rounded-lg shadow-[0_0_10px_rgba(99,102,241,0.2)]">02</div>
                      <p className="text-sm font-semibold text-slate-300">{t('guide_my_deck_step2', language)}</p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1 text-xs font-black rounded-lg shadow-[0_0_10px_rgba(99,102,241,0.2)]">03</div>
                      <p className="text-sm font-semibold text-slate-300">{t('guide_my_deck_step3', language)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTutorialStep(12)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-650 hover:from-indigo-500 hover:to-violet-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(99,102,241,0.3)] active:scale-[0.98] border border-indigo-500/30 cursor-pointer"
                  >
                    {language === 'ko' ? '확인' : 'CONFIRM'}
                  </button>
                </motion.div>
              </div>
            )}

            {/* Step 12: Welcome Message */}
            {tutorialStep === 12 && (
              <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto bg-slate-950/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl p-8 rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(59,130,246,0.2)] max-w-sm text-center space-y-6 relative overflow-hidden text-white"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500" />
                  <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto text-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.25)] animate-pulse">
                    <Bot size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-4xl font-black italic uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">WELCOME!</h3>
                    <p className="text-sm font-semibold opacity-80 leading-relaxed text-slate-300">
                      {t('tutorial_welcome_desc', language)}
                    </p>
                  </div>
                  <button 
                    onClick={finalizeTutorialCompletion}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-650 text-white py-4.5 rounded-[20px] font-black uppercase tracking-widest hover:from-blue-500 hover:to-purple-600 transition-all border border-blue-500/30 shadow-[0_4px_25px_rgba(168,85,247,0.3)] active:scale-[0.98] cursor-pointer"
                  >
                    {t('tutorial_start_now_btn', language)}
                  </button>
                </motion.div>
              </div>
            )}
          </div>
        )}
      </>
    )}
      </AnimatePresence>
      <TutorialCoachMark
        open={isContextualTutorialVisible && Boolean(activeContextualTutorial)}
        language={language}
        title={activeContextualTutorial ? t(activeContextualTutorial.titleKey, language) : ''}
        body={activeContextualTutorial ? t(activeContextualTutorial.bodyKey, language) : ''}
        placement={contextualTutorialPlacement}
        stepIndex={contextualTutorialStepIndex}
        totalSteps={contextualTutorialTotalSteps}
        lowSpecMode={lowSpecMode}
        onNext={completeContextualTutorialStep}
        onLater={snoozeContextualTutorial}
        onNeverShow={dismissContextualTutorial}
      />
      <nav id="seo-links" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }} aria-hidden="true">
        <a href="/home">{t('home', language)}</a>
        <a href="/deck">{t('mydeck', language)}</a>
        <a href="/play">{t('play', language)}</a>
        <a href="/shop">{t('shop', language)}</a>
        <a href="/setting">{t('setting', language)}</a>
        <a href="/wiki">Wiki</a>
      </nav>

      {/* ========================================================================= */}
      {/* [IN-GAME MACRO RECORDING & PLAYBACK INTERFACE] */}
      {/* ========================================================================= */}
      {(isPlayingback || playbackLogActions.length > 0) && (
        <div className="macro-ui fixed bottom-48 right-6 z-[999] flex flex-col items-end gap-2 pointer-events-auto">
          {isPlayingback && (
            <div className="bg-black text-green-400 font-mono text-[11px] font-black px-4 py-2 border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
              <span>RUNNING: {playbackCurrentStep} / {playbackTotalSteps} STEPS</span>
            </div>
          )}
          
          {isPlayingback && (
            <button
              onClick={() => {
                abortPlaybackRef.current = true;
                setIsPlayingback(false);
                setIsLoopPlayback(false);
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }}
              className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all flex items-center gap-2"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span>메크로 테스트 중지</span>
            </button>
          )}

          {/* 실시간 메크로 재생 로그 콘솔 HUD (User Specified Macro Realtime Log style) */}
          {playbackLogActions.length > 0 && (
            <div className="w-64 max-h-40 overflow-y-auto bg-black/90 text-[10px] text-green-400 font-mono p-3 border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1 text-left mt-2 select-none animate-fade-in relative">
              {/* 재생 종료 후 로그를 여유롭게 정독한 뒤 수동으로 창을 닫을 수 있도록 CLOSE 버튼 마련! */}
              {!isPlayingback && (
                <button
                  onClick={() => {
                    setPlaybackLogActions([]);
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  }}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-400 font-black text-[9px] uppercase tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20"
                >
                  CLOSE
                </button>
              )}
              
              <div className="border-b border-green-800 pb-1 mb-1 text-[9px] font-black uppercase text-green-500 tracking-widest flex justify-between">
                <span>⚡ MACRO REALTIME LOG</span>
                <span className="animate-pulse">{isPlayingback ? "PLAY..." : "END"}</span>
              </div>
              {playbackLogActions.map((act, idx) => (
                <div key={idx} className="truncate">
                  {act.isSystemLog ? (
                    <span className="text-yellow-400 font-black animate-pulse">{act.systemMsg}</span>
                  ) : (
                    <>
                      <span className="text-yellow-400 font-black mr-1">[{idx + 1}]</span>
                      X:{Math.round(act.x)} Y:{Math.round(act.y)} (ScrollY:{act.scrollY !== undefined ? act.scrollY : 0}) (time: {act.time !== undefined ? (act.time / 1000).toFixed(1) + 's' : '0.0s'})
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showRecordBtn && (
        <div className="macro-ui fixed bottom-28 right-6 z-[999] flex flex-col items-end gap-2 pointer-events-auto">
          <button
            onClick={() => {
              if (isRecording) {
                setIsRecording(false);
                setShowRecordBtn(false);
                setRecordingActions([...recordingActionsRef.current]);
                // Launch modal instantly in next event loop tick to bypass layout locks
                setTimeout(() => {
                  setShowRecordResultModal(true);
                }, 0);
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              } else {
                recordingActionsRef.current = [];
                setRecordingActions([]);
                recordingStartTimeRef.current = Date.now(); // 기준 상대시간 T0 앵커링
                setIsRecording(true);
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }
            }}
            className={cn(
              "px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-xs border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all flex items-center gap-2",
              isRecording 
                ? "bg-red-500 text-white animate-pulse" 
                : "bg-yellow-400 text-black hover:bg-yellow-300"
            )}
          >
            <div className={cn("w-3 h-3 rounded-full", isRecording ? "bg-white" : "bg-red-600 animate-ping")} />
            {isRecording ? t('macro_stop_record', language) : t('macro_start_record', language)}
          </button>
          <button
            onClick={() => {
              setShowRecordBtn(false);
              setIsRecording(false);
            }}
            className="px-3 py-1 bg-black text-white rounded-lg text-[9px] font-bold uppercase tracking-widest border-2 border-black"
          >
            {t('macro_close_recorder', language)}
          </button>

          {/* 실시간 메크로 로깅 콘솔 HUD */}
          {isRecording && recordingActions.length > 0 && (
            <div className="w-64 max-h-40 overflow-y-auto bg-black/90 text-[10px] text-green-400 font-mono p-3 border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1 text-left mt-2 select-none">
              <div className="border-b border-green-800 pb-1 mb-1 text-[9px] font-black uppercase text-green-500 tracking-widest flex justify-between">
                <span>{t('macro_realtime_log', language)}</span>
                <span className="animate-pulse">{t('macro_rec_status', language)}</span>
              </div>
              {recordingActions.map((act, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-yellow-400 font-black mr-1">[{idx + 1}]</span>
                  X:{Math.round(act.x)} Y:{Math.round(act.y)} (ScrollY:{act.scrollY}) (time: {act.time !== undefined ? (act.time / 1000).toFixed(1) + 's' : '0.0s'})
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Record Results JSON Modal */}
      {showRecordResultModal && (
        <div className="macro-ui fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white border-4 border-black p-8 rounded-[32px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full space-y-6">
            <div className="flex justify-between items-center border-b-4 border-black pb-3">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <span className="w-4 h-4 bg-red-600 rounded-full animate-ping animate-duration-1000" />
                {t('macro_recording_data', language)}
              </h3>
              <span className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase">
                {t('macro_clicks', language).replace('{count}', String(recordingActions.length))}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500 leading-tight">
              {t('macro_desc', language).replace('{width}', String(window.innerWidth)).replace('{height}', String(window.innerHeight))}
            </p>
            <textarea
              readOnly
              value={JSON.stringify(recordingActions, null, 2)}
              className="w-full h-48 p-4 font-mono text-[11px] bg-gray-900 text-green-400 border-4 border-black rounded-2xl resize-none focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(recordingActions, null, 2));
                  // Silently close the modal immediately without any alert popups
                  setShowRecordResultModal(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-wider text-xs border-b-8 border-blue-900 active:border-b-0 active:translate-y-2 transition-all"
              >
                {t('macro_copy_json', language)}
              </button>
              <button
                onClick={() => setShowRecordResultModal(false)}
                className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-2xl font-black uppercase tracking-wider text-xs border-b-8 border-gray-900 active:border-b-0 active:translate-y-2 transition-all"
              >
                {t('close', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playback Configuration Popup */}
      {showPlaybackPopup && (
        <div className="macro-ui fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white border-[6px] border-black p-8 rounded-[40px] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full space-y-6">
            <div className="flex justify-between items-center border-b-4 border-black pb-3">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2 text-blue-600">
                {t('macro_console', language)}
              </h3>
              {isPlayingback && (
                <span className="bg-blue-600 text-white px-2 py-1 text-[10px] font-black uppercase animate-bounce">
                  {t('macro_playback_in_progress', language)}
                </span>
              )}
            </div>
            <div className="space-y-2 flex flex-col align-start text-left">
              <label className="text-xs font-black uppercase tracking-wider text-left">{t('macro_paste_json_label', language)}</label>
              <textarea
                placeholder='[ { "x": 100, "y": 200, "windowWidth": 1440, "windowHeight": 900, "timestamp": 171600000000 } ]'
                value={playbackJson}
                onChange={(e) => setPlaybackJson(e.target.value)}
                className="w-full h-40 p-4 text-[11px] bg-gray-50 border-4 border-black rounded-2xl resize-none focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 border-4 border-black rounded-2xl">
              <span className="text-xs font-black uppercase tracking-wider">{t('macro_loop_playback_label', language)}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLoopPlayback}
                  onChange={(e) => setIsLoopPlayback(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={isPlayingback}
                onClick={() => {
                  try {
                    let parsed: any[] = [];
                    let jsonText = playbackJson.trim();
                    const firstBracket = jsonText.indexOf('[');
                    const lastBracket = jsonText.lastIndexOf(']');
                    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                      jsonText = jsonText.substring(firstBracket, lastBracket + 1);
                    }
                    if (jsonText) {
                      const block = JSON.parse(jsonText);
                      if (Array.isArray(block)) {
                        parsed = block;
                      }
                    }

                    if (parsed.length === 0) {
                      showCustomAlert(language === 'ko' ? '오류' : 'ERROR', t('macro_invalid_json_arr', language));
                      return;
                    }

                    setShowPlaybackPopup(false); // 재생 시작 시 팝업창 즉시 닫기!
                    runMacroPlayback(parsed, isLoopPlayback);
                  } catch (e) {
                    showCustomAlert(language === 'ko' ? '오류' : 'ERROR', t('macro_invalid_json_format', language));
                  }
                }}
                className={cn(
                  "w-full py-4 rounded-2xl font-black uppercase tracking-wider text-xs transition-all border-b-8 border-blue-900 active:border-b-0 active:translate-y-2",
                  isPlayingback
                    ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                )}
              >
                {isLoopPlayback ? t('macro_loop_play', language) : t('macro_single_play', language)}
              </button>
              <button
                onClick={() => {
                  setShowPlaybackPopup(false);
                  setIsLoopPlayback(false);
                }}
                className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-2xl font-black uppercase tracking-wider text-xs border-b-8 border-gray-900 active:border-b-0 active:translate-y-2 transition-all"
              >
                {t('macro_close_console', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {upgradeDeckPrompt && (
        <Suspense fallback={null}>
          <DeckUpgradeModal
            isOpen={upgradeDeckPrompt !== null}
            onClose={() => {
              setUpgradeDeckPrompt(null);
              if (isTutorialMode && tutorialStep === 10) {
                setTutorialStep(11);
                setView('mydeck');
              }
            }}
            onConfirm={() => {
              if (upgradeDeckPrompt) {
                applyDeckUpgrade(upgradeDeckPrompt.upgradedCardsToApply);
              }
              if (isTutorialMode && tutorialStep === 10) {
                setTutorialStep(11);
                setView('mydeck');
              }
            }}
            language={language}
            upgradedCards={upgradeDeckPrompt.upgradedCardsToApply}
            currentDeck={currentDeck}
          />
        </Suspense>
      )}

      {/* GPS Permission Explanation Modal */}
      <AnimatePresence>
        {showGpsPermissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white text-black w-full max-w-md rounded-[32px] border-[6px] border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative flex flex-col space-y-6"
            >
              <div className="flex items-center justify-between border-b-4 border-black pb-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Navigation size={24} className="animate-bounce" />
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">
                    {t('gps_perm_title', language)}
                  </h3>
                </div>
                <button
                  onClick={() => setShowGpsPermissionModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full border-2 border-black transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="text-sm font-bold opacity-75 leading-relaxed py-2 whitespace-pre-line">
                {t('gps_perm_desc', language)}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={requestGpsPermission}
                  className="w-full py-4 bg-green-600 text-white rounded-2xl border-4 border-black font-black uppercase italic tracking-wider hover:bg-green-500 transition-all active:scale-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  {t('gps_accept', language)}
                </button>
                <button
                  onClick={() => setShowGpsPermissionModal(false)}
                  className="w-full py-3 bg-gray-200 text-black rounded-2xl border-4 border-black font-black uppercase italic tracking-wider hover:bg-gray-300 transition-all active:scale-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  {t('close', language)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 커스텀 디자인 팝업 모달 */}
      <AnimatePresence>
        {customPopup.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white border-4 border-black p-6 max-w-sm w-full rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black"
            >
              <h3 className="text-lg font-black uppercase tracking-wider mb-2 border-b-2 border-black pb-2 flex items-center gap-2">
                <Swords size={20} className="text-red-600 animate-bounce" />
                {customPopup.title}
              </h3>
              <p className="text-sm font-bold text-gray-700 my-4 whitespace-pre-wrap leading-relaxed">
                {customPopup.message}
              </p>
              <div className="flex gap-3 mt-6">
                {customPopup.type === 'confirm' ? (
                  <>
                    <button
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setCustomPopup(prev => ({ ...prev, isOpen: false }));
                        customPopup.onConfirm?.();
                      }}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase rounded-xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer text-center"
                    >
                      {language === 'ko' ? '예' : 'YES'}
                    </button>
                    <button
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setCustomPopup(prev => ({ ...prev, isOpen: false }));
                        customPopup.onCancel?.();
                      }}
                      className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-100 text-black font-black uppercase rounded-xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer text-center"
                    >
                      {language === 'ko' ? '아니요' : 'NO'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      setCustomPopup(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase rounded-xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer text-center"
                  >
                    {language === 'ko' ? '확인' : 'OK'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isGlobalLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto animate-fade-in">
          <div className="bg-slate-900/90 border border-slate-700/50 backdrop-blur-xl p-8 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.3)] max-w-sm w-full flex flex-col items-center space-y-6 relative text-white">
            <button
              onClick={() => {
                setIsGlobalLoading(false);
                setGlobalLoadingMessage('');
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer z-10 border border-slate-800/80 bg-slate-950/90 shadow-md"
              title={language === 'ko' ? '닫기' : 'Close'}
            >
              <X size={16} />
            </button>
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-blue-500 border-r-transparent animate-spin"></div>
              <div className="absolute w-10 h-10 rounded-full border-4 border-slate-800 border-b-purple-500 border-l-transparent animate-spin [animation-direction:reverse]"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black italic uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                {globalLoadingMessage || t('processing', language)}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* ── Dice Animation Overlay ── */}
      {diceState !== 'idle' && (
        <div className="fixed inset-0 z-[11000] flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg pointer-events-auto animate-fade-in">
          {/* Cancel Button */}
          <button
            onClick={() => {
              if (diceTimeoutRef.current) { clearTimeout(diceTimeoutRef.current); diceTimeoutRef.current = null; }
              setDiceState('idle');
              setDiceGameTitle('');
              setPreselectedGameId(null);
            }}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer z-10"
            aria-label="취소"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center gap-8">
            {/* 3D Dice Cube */}
            <div className="relative w-24 h-24 perspective-[600px]">
              <div className={cn(
                "w-full h-full relative preserve-3d",
                diceState === 'rolling' && "animate-dice-roll",
                diceState === 'reveal' && "animate-dice-stop"
              )}>
                {/* Face 1 */}
                <div className="absolute inset-0 bg-white rounded-2xl border-2 border-slate-200 shadow-2xl flex items-center justify-center text-3xl font-black text-indigo-600 backface-hidden"
                  style={{ transform: 'rotateY(0deg) translateZ(48px)' }}>?</div>
                {/* Face 2 */}
                <div className="absolute inset-0 bg-white rounded-2xl border-2 border-slate-200 shadow-2xl flex items-center justify-center text-3xl font-black text-indigo-600 backface-hidden"
                  style={{ transform: 'rotateY(90deg) translateZ(48px)' }}>?</div>
                {/* Face 3 */}
                <div className="absolute inset-0 bg-white rounded-2xl border-2 border-slate-200 shadow-2xl flex items-center justify-center text-3xl font-black text-indigo-600 backface-hidden"
                  style={{ transform: 'rotateY(180deg) translateZ(48px)' }}>?</div>
                {/* Face 4 */}
                <div className="absolute inset-0 bg-white rounded-2xl border-2 border-slate-200 shadow-2xl flex items-center justify-center text-3xl font-black text-indigo-600 backface-hidden"
                  style={{ transform: 'rotateY(270deg) translateZ(48px)' }}>?</div>
                {/* Face 5 - top */}
                <div className="absolute inset-0 bg-white rounded-2xl border-2 border-slate-200 shadow-2xl flex items-center justify-center text-3xl font-black text-indigo-600 backface-hidden"
                  style={{ transform: 'rotateX(90deg) translateZ(48px)' }}>?</div>
                {/* Face 6 - bottom */}
                <div className="absolute inset-0 bg-white rounded-2xl border-2 border-slate-200 shadow-2xl flex items-center justify-center text-3xl font-black text-indigo-600 backface-hidden"
                  style={{ transform: 'rotateX(-90deg) translateZ(48px)' }}>?</div>
              </div>
            </div>

            {/* Status text */}
            <p className="text-white/80 text-lg font-bold animate-pulse">
              {diceState === 'rolling' 
                ? (language === 'ko' ? '🎲 게임을 고르는 중...' : '🎲 Picking a game...')
                : ''}
            </p>

            {/* Reveal result */}
            {diceState === 'reveal' && diceGameTitle && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl shadow-indigo-600/40 text-center"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">
                  {language === 'ko' ? '선택된 게임' : 'SELECTED'}
                </p>
                <p className="text-2xl font-black">{diceGameTitle}</p>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ── Dice CSS Keyframes ── */}
      {diceState !== 'idle' && (
        <style>{`
          .perspective-\\[600px\\] { perspective: 600px; }
          .preserve-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; }
          @keyframes dice-roll {
            0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
            25% { transform: rotateX(180deg) rotateY(90deg) rotateZ(45deg); }
            50% { transform: rotateX(360deg) rotateY(270deg) rotateZ(135deg); }
            75% { transform: rotateX(540deg) rotateY(450deg) rotateZ(225deg); }
            100% { transform: rotateX(720deg) rotateY(630deg) rotateZ(315deg); }
          }
          .animate-dice-roll {
            animation: dice-roll 0.8s linear infinite;
          }
          @keyframes dice-stop {
            0% { transform: rotateX(720deg) rotateY(630deg) rotateZ(315deg); }
            100% { transform: rotateX(720deg) rotateY(720deg) rotateZ(360deg); }
          }
          .animate-dice-stop {
            animation: dice-stop 0.6s ease-out forwards;
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}</style>
      )}

      {showInitialGate && (
        <AppLoadingGate
          language={language}
          currentView={view}
          onComplete={() => setShowInitialGate(false)}
        />
      )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GameSettingsProvider>
      <AppContent />
    </GameSettingsProvider>
  );
}
