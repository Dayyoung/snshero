import React, { useState, useEffect, useRef } from 'react';
import { Trophy, ArrowUp, ArrowDown, Users, Gift, ShieldAlert, Swords, X, Bell, List, AlertCircle, Wifi, Bluetooth, Compass, Zap, Clock, HelpCircle, ChevronLeft, ChevronRight, Crown, Sparkles, ShoppingBag } from 'lucide-react';
import { RankRewardsModal } from '../components/RankRewardsModal';
import { MatchHistoryModal } from '../components/MatchHistoryModal';
import { Language } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { t } from '../lib/i18n';
import { PageHeader } from '../components/PageHeader';
import { PageSubHeader } from '../components/PageSubHeader';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, onSnapshot, getDoc } from '../lib/firebaseMock';
import { getUserCollectionName } from '../lib/utils';
import axios from 'axios';
import { useGameSettings } from '../contexts/GameSettingsContext';
import { joinMatchmaking, leaveMatchmaking, type MatchmakingState } from '../lib/pvpMatchmaking';
import { getProfileBadgeByKey, getProfileEmoticonByKey, getProfileTitleByKey } from '../content/profileEmoticons';

interface RankingUser {
  id: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  totalPower: number;
  winRate: number;
  sns?: number;
  ipAddress?: string;
  language?: Language;
  activeEmoticonKey?: string;
  activeBadgeKey?: string;
  activeTitleKey?: string;
}

interface RankingViewProps {
  onBack: () => void;
  setView?: (view: string) => void;
  playSfx: (url: string) => void;
  language: Language;
  user?: any;
  onAttackUser?: (opponent: { id: string; name: string; deck: any[]; totalPower?: number; sns?: number; wins?: number; losses?: number; draws?: number }) => void;
  sns?: number;
  onLogin?: (emailOverride?: string) => Promise<void>;
  setIsGlobalLoading?: (loading: boolean, message?: string) => void;
  currentSeason: string;
  isAutoBattle?: boolean;
  autoStartPvp?: boolean;
  onClearAutoStartPvp?: () => void;
}

type SortBy = 'winRate' | 'wins';

type RankingType = 'global' | 'weekly' | 'monthly';

const getDeterministicOffset = (uid: string, seed: string) => {
  let hash = 0;
  const str = uid + seed;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
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

const generateMockOpponent = (myPower: number) => {
  const mockNames = [
    'SNS_Master', 'Card_Hero', 'AlphaZero', 'Neon_Blade', 
    'Cyber_Ghost', 'Shadow_Striker', 'Pixel_Hunter', 'Bit_Conqueror'
  ];
  const randName = mockNames[Math.floor(Math.random() * mockNames.length)] + '_' + Math.floor(Math.random() * 900 + 100);
  const botPower = Math.ceil(myPower * (0.85 + Math.random() * 0.3)); // 85% ~ 115% of my power
  
  return {
    id: `bot-optimal-${Date.now()}`,
    name: `[AI] ${randName}`,
    deck: [],
    totalPower: botPower,
    sns: Math.floor(botPower * (0.2 + Math.random() * 0.8)),
    wins: Math.floor(Math.random() * 30),
    losses: Math.floor(Math.random() * 20),
    draws: Math.floor(Math.random() * 5)
  };
};

const DEFAULT_DUMMY_RANKING_USERS: (RankingUser & { deck?: any[] })[] = [
  { id: 'rank-bot-1', name: 'SNS_Hero_Master', wins: 154, losses: 12, draws: 3, totalPower: 14800, winRate: 91.1, sns: 25000, language: 'ko', activeBadgeKey: 'badge_first_place', activeTitleKey: 'title_legend' },
  { id: 'rank-bot-2', name: 'CyberBlade99', wins: 138, losses: 21, draws: 2, totalPower: 13200, winRate: 85.7, sns: 18400, language: 'en', activeBadgeKey: 'badge_top_ranker', activeTitleKey: 'title_master' },
  { id: 'rank-bot-3', name: 'CardSorcerer_KR', wins: 121, losses: 28, draws: 4, totalPower: 11800, winRate: 79.2, sns: 14200, language: 'ko', activeTitleKey: 'title_challenger' },
  { id: 'rank-bot-4', name: 'ShadowStriker', wins: 105, losses: 32, draws: 1, totalPower: 10200, winRate: 75.5, sns: 11000, language: 'ja', activeTitleKey: 'title_expert' },
  { id: 'rank-bot-5', name: 'PixelHunter', wins: 94, losses: 36, draws: 3, totalPower: 9100, winRate: 70.7, sns: 9200, language: 'ko' },
  { id: 'rank-bot-6', name: 'AlphaZero_Bot', wins: 88, losses: 40, draws: 2, totalPower: 8400, winRate: 67.2, sns: 8100, language: 'en' },
  { id: 'rank-bot-7', name: 'ArcaneEchoes', wins: 81, losses: 43, draws: 3, totalPower: 7600, winRate: 63.8, sns: 7300, language: 'de' },
  { id: 'rank-bot-8', name: 'MechaCommander', wins: 73, losses: 46, draws: 1, totalPower: 6900, winRate: 60.3, sns: 6200, language: 'fr' },
  { id: 'rank-bot-9', name: 'DragonSlayer77', wins: 66, losses: 48, draws: 2, totalPower: 6100, winRate: 56.9, sns: 5400, language: 'ko' },
  { id: 'rank-bot-10', name: 'NeonViper_Global', wins: 59, losses: 51, draws: 0, totalPower: 5400, winRate: 53.6, sns: 4600, language: 'es' },
  { id: 'rank-bot-11', name: 'ZeroKadan', wins: 52, losses: 53, draws: 2, totalPower: 4800, winRate: 48.6, sns: 3900, language: 'ko' },
  { id: 'rank-bot-12', name: 'BitConqueror', wins: 45, losses: 55, draws: 1, totalPower: 4100, winRate: 44.6, sns: 3100, language: 'en' },
];

export const RankingView: React.FC<RankingViewProps> = ({ onBack, setView, playSfx, language, user, onAttackUser, sns, onLogin, setIsGlobalLoading, currentSeason, isAutoBattle, autoStartPvp, onClearAutoStartPvp }) => {
  const { theme } = useGameSettings();
  const [rawUsers, setRawUsers] = useState<(RankingUser & { deck?: any[] })[]>([]);
  
  // Matchmaking State
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(5);
  const [currentTip, setCurrentTip] = useState('');
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoMatchedRef = useRef(false);

  // PvP Real-time Matchmaking State
  const [isPvpSearching, setIsPvpSearching] = useState(false);
  const [pvpQueuePos, setPvpQueuePos] = useState(0);
  const [pvpError, setPvpError] = useState('');
  const pvpCleanupRef = useRef<(() => void) | null>(null);

  const [autoBattleCountdown, setAutoBattleCountdown] = useState<number | null>(null);
  const [selectedLangFilter, setSelectedLangFilter] = useState<Language | null>(() => {
    const saved = localStorage.getItem('hero_ranking_lang_filter');
    return saved ? (saved as Language) : null;
  });
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('winRate');
  const [rankingType, setRankingType] = useState<RankingType>('global');
  const [showInsufficientPopup, setShowInsufficientPopup] = useState(false);
  const [showNoOptimalPopup, setShowNoOptimalPopup] = useState(false);
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);
  const [myIp, setMyIp] = useState<string>('');
  
  // Battle history state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [localHistory, setLocalHistory] = useState<any[]>([]);

  // PWA Alert Modal state
  const [showPwaAlert, setShowPwaAlert] = useState(false);
  const [pwaAlertMode, setPwaAlertMode] = useState<'info' | 'success'>('info');

  const [customAlert, setCustomAlert] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [showNearbyTypeModal, setShowNearbyTypeModal] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [showBluetoothPermissionModal, setShowBluetoothPermissionModal] = useState(false);
  const [showBluetoothModal, setShowBluetoothModal] = useState(false);
  const [isNearbySearching, setIsNearbySearching] = useState(false);
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
  const [nearbyList, setNearbyList] = useState<any[]>([]);

  const users = React.useMemo(() => {
    let fetchedUsers = [...rawUsers];
    if (selectedLangFilter) {
      fetchedUsers = fetchedUsers.filter(u => u.language === selectedLangFilter);
    }
    
    if (sortBy === 'winRate') {
      fetchedUsers.sort((a, b) => b.winRate - a.winRate);
    } else {
      fetchedUsers.sort((a, b) => {
        const sortField = sortBy === 'wins' ? 'wins' : 'totalPower';
        return b[sortField] - a[sortField];
      });
    }

    fetchedUsers = fetchedUsers.slice(0, 50);

    if (rankingType === 'weekly') {
      fetchedUsers.sort((a, b) => {
        const aOffset = getDeterministicOffset(a.id, 'weekly') % 20;
        const bOffset = getDeterministicOffset(b.id, 'weekly') % 20;
        const sortField = sortBy === 'wins' ? 'wins' : 'totalPower';
        const aVal = a[sortField] + aOffset;
        const bVal = b[sortField] + bOffset;
        return bVal - aVal;
      });
    } else if (rankingType === 'monthly') {
      fetchedUsers.sort((a, b) => {
        const aOffset = getDeterministicOffset(a.id, 'monthly') % 40;
        const bOffset = getDeterministicOffset(b.id, 'monthly') % 40;
        const sortField = sortBy === 'wins' ? 'wins' : 'totalPower';
        const aVal = a[sortField] + aOffset;
        const bVal = b[sortField] + bOffset;
        return bVal - aVal;
      });
    }
    return fetchedUsers;
  }, [rawUsers, rankingType, sortBy, selectedLangFilter]);

  const [showRankRewardsModal, setShowRankRewardsModal] = useState(false);
  const [showMatchHistoryModal, setShowMatchHistoryModal] = useState(false);

  // Live Season Countdown Calculation
  const [timeLeft, setTimeLeft] = useState({ days: 14, hours: 8, minutes: 32, seconds: 45 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const myRanks = React.useMemo(() => {
    if (!user || user.uid === 'guest-id' || rawUsers.length === 0) {
      return { global: null, weekly: null, monthly: null, currentUserData: null };
    }

    const sortField = sortBy === 'wins' ? 'wins' : 'totalPower';
    
    let basePool = [...rawUsers];
    if (selectedLangFilter) {
      basePool = basePool.filter(u => u.language === selectedLangFilter);
    }
    if (sortBy === 'winRate') {
      basePool.sort((a, b) => b.winRate - a.winRate);
    } else {
      basePool.sort((a, b) => b[sortField] - a[sortField]);
    }
    basePool = basePool.slice(0, 50);

    const globalIdx = basePool.findIndex(u => u.id === user.uid);
    const global = globalIdx !== -1 ? globalIdx + 1 : null;

    let weeklySorted = [...basePool].sort((a, b) => {
      const aOffset = getDeterministicOffset(a.id, 'weekly') % 20;
      const bOffset = getDeterministicOffset(b.id, 'weekly') % 20;
      const aVal = a[sortField] + aOffset;
      const bVal = b[sortField] + bOffset;
      return bVal - aVal;
    });
    const weeklyIdx = weeklySorted.findIndex(u => u.id === user.uid);
    const weekly = weeklyIdx !== -1 ? weeklyIdx + 1 : null;

    let monthlySorted = [...basePool].sort((a, b) => {
      const aOffset = getDeterministicOffset(a.id, 'monthly') % 40;
      const bOffset = getDeterministicOffset(b.id, 'monthly') % 40;
      const aVal = a[sortField] + aOffset;
      const bVal = b[sortField] + bOffset;
      return bVal - aVal;
    });
    const monthlyIdx = monthlySorted.findIndex(u => u.id === user.uid);
    const monthly = monthlyIdx !== -1 ? monthlyIdx + 1 : null;

    const myIdx = basePool.findIndex(u => u.id === user.uid);
    const myData = myIdx !== -1 ? basePool[myIdx] : null;

    return { global, weekly, monthly, currentUserData: myData };
  }, [rawUsers, user, sortBy, selectedLangFilter]);

  const { global: myGlobalRank, weekly: myWeeklyRank, monthly: myMonthlyRank, currentUserData } = myRanks;

  // Auto-Battle Countdown
  useEffect(() => {
    if (!isAutoBattle || loading) {
      setAutoBattleCountdown(null);
      return;
    }

    setAutoBattleCountdown(3);

    const interval = setInterval(() => {
      setAutoBattleCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          handleOptimalBattle();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      setAutoBattleCountdown(null);
    };
  }, [isAutoBattle, loading, users, sns, currentUserData, user, onBack]);

  useEffect(() => {
    if (selectedLangFilter) {
      localStorage.setItem('hero_ranking_lang_filter', selectedLangFilter);
    } else {
      localStorage.removeItem('hero_ranking_lang_filter');
    }
  }, [selectedLangFilter]);

  useEffect(() => {
    const fetchAndSaveIp = async () => {
      if (!user || user.uid === 'guest-id') return;
      try {
        const res = await axios.get('https://api.ipify.org?format=json');
        const ip = res.data.ip;
        setMyIp(ip);
        const userCollection = currentSeason === 'season1' ? 'users' : `users_${currentSeason}`;
        const userRef = doc(db, userCollection, user.uid);
        await updateDoc(userRef, {
          ipAddress: ip
        });
      } catch (err) {
        console.error("Failed to fetch/save IP address:", err);
      }
    };
    fetchAndSaveIp();
  }, [user, currentSeason]);

  // Load local battle history
  const loadHistory = () => {
    try {
      const historyStr = localStorage.getItem('hero_match_history');
      if (historyStr) {
        const parsed = JSON.parse(historyStr);
        setLocalHistory(parsed.slice(0, 50));
      }
    } catch (e) {
      console.error("Failed to load match history:", e);
    }
  };

  const handlePushOptIn = async () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    
    const hasPushToken = localStorage.getItem('hero_push_token');
    if (hasPushToken) {
      setPwaAlertMode('success');
      setShowPwaAlert(true);
      return;
    }

    // Check PWA mode
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && !isPwa) {
      setPwaAlertMode('info');
      setShowPwaAlert(true);
      return;
    }

    try {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          // Simulate push token creation
          const mockToken = 'mock_webpush_token_' + Math.random().toString(36).substring(2, 10);
          localStorage.setItem('hero_push_token', mockToken);
          
          if (user && user.uid !== 'guest-id') {
            const userCollection = currentSeason === 'season1' ? 'users' : `users_${currentSeason}`;
            const userRef = doc(db, userCollection, user.uid);
            await updateDoc(userRef, {
              pushToken: mockToken
            });
          }

          setPwaAlertMode('success');
          setShowPwaAlert(true);
        } else {
          setPwaAlertMode('info');
          setShowPwaAlert(true);
        }
      } else {
        setPwaAlertMode('info');
        setShowPwaAlert(true);
      }
    } catch (err) {
      console.error("Notification opt-in failed:", err);
      setPwaAlertMode('info');
      setShowPwaAlert(true);
    }
  };

  const handleNearbyBattle = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    if (!user || user.uid === 'guest-id') {
      setShowLoginRequiredModal(true);
      return;
    }
    setShowNearbyTypeModal(true);
  };

  const handleWifiSearch = async () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setShowNearbyTypeModal(false);
    setShowWifiModal(true);
    setIsNearbySearching(true);
    setNearbyList([]);

    let ipToUse = myIp;
    if (!ipToUse) {
      try {
        const res = await axios.get('https://api.ipify.org?format=json');
        ipToUse = res.data.ip;
        setMyIp(ipToUse);
        const userCollection = currentSeason === 'season1' ? 'users' : `users_${currentSeason}`;
        const userRef = doc(db, userCollection, user.uid);
        await updateDoc(userRef, { ipAddress: ipToUse });
      } catch (err) {
        setIsNearbySearching(false);
        setCustomAlert({
          isOpen: true,
          title: language === 'ko' ? '오류' : 'ERROR',
          message: language === 'ko' ? "위치(IP) 정보를 가져올 수 없습니다." : "Cannot fetch location(IP) info."
        });
        return;
      }
    }

    const ipParts = ipToUse.split('.');
    if (ipParts.length < 3) {
      setIsNearbySearching(false);
      setCustomAlert({
        isOpen: true,
        title: language === 'ko' ? '오류' : 'ERROR',
        message: language === 'ko' ? "올바르지 않은 IP 형식입니다." : "Invalid IP format."
      });
      return;
    }
    const mySubnet = ipParts.slice(0, 3).join('.');

    setTimeout(() => {
      let filtered = rawUsers.filter(u => {
        if (u.id === user.uid) return false;
        if (!u.ipAddress) return false;
        const parts = u.ipAddress.split('.');
        if (parts.length < 3) return false;
        const subnet = parts.slice(0, 3).join('.');
        return subnet === mySubnet;
      });

      // Show mock Wi-Fi bots if no real subnet users found
      if (filtered.length < 2) {
        const otherUsers = rawUsers.filter(u => u.id !== user.uid);
        const shuffled = [...otherUsers].sort(() => 0.5 - Math.random()).slice(0, 3 - filtered.length);
        const fakeWifiList = shuffled.map((u, i) => ({
          ...u,
          name: `[Wi-Fi] ${u.name || u.displayName || `User_${i + 1}`}`,
          isVirtualNearby: true
        }));
        filtered = [...filtered, ...fakeWifiList];
      }

      setNearbyList(filtered);
      setIsNearbySearching(false);
    }, 1200);
  };

  const handleBluetoothSearch = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setShowNearbyTypeModal(false);
    setShowBluetoothPermissionModal(true);
  };

  const handleBluetoothPermissionGrant = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setShowBluetoothPermissionModal(false);
    setShowBluetoothModal(true);
    setIsNearbySearching(true);
    setNearbyList([]);

    setTimeout(() => {
      const otherUsers = rawUsers.filter(u => u.id !== user.uid);
      const shuffled = [...otherUsers].sort(() => 0.5 - Math.random()).slice(0, 3);
      const btDevices = ['iPhone 15 Pro', 'Galaxy S24 Ultra', 'iPad Air'];
      const fakeBtList = shuffled.map((u, idx) => ({
        ...u,
        name: `[BT] ${btDevices[idx] || 'BT_Device'} - ${u.name || u.displayName || 'User'}`,
        isVirtualNearby: true
      }));

      setNearbyList(fakeBtList);
      setIsNearbySearching(false);
    }, 1500);
  };

  const handleSelectNearbyOpponent = (opp: any) => {
    if (opp.id === user?.uid) {
      setCustomAlert({
        isOpen: true,
        title: language === 'ko' ? '알림' : 'NOTICE',
        message: language === 'ko' ? '자기 자신과는 대전할 수 없습니다.' : 'You cannot battle yourself.'
      });
      return;
    }

    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setShowWifiModal(false);
    setShowBluetoothModal(false);
    
    onAttackUser?.({
      id: opp.id,
      name: opp.name,
      deck: opp.deck || [],
      totalPower: opp.totalPower,
      sns: opp.sns,
      wins: opp.wins,
      losses: opp.losses,
      draws: opp.draws
    });
  };

  useEffect(() => {
    setLoading(true);
    setIsGlobalLoading?.(true, t('loading_ranking', language));
    const usersCollection = currentSeason === 'season1' ? 'users' : `users_${currentSeason}`;
    const usersRef = collection(db, usersCollection);
    const q = query(
      usersRef, 
      orderBy(
        sortBy === 'winRate' 
          ? 'winRate' 
          : (sortBy === 'wins' ? 'stats.wins' : 'totalPower'), 
        'desc'
      ),
      limit(500)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let fetchedUsers: (RankingUser & { deck?: any[] })[] = [];
      if (querySnapshot && querySnapshot.docs) {
        fetchedUsers = querySnapshot.docs
          .map(doc => {
            const data = doc.data ? doc.data() : null;
            if (!data) return null;
            const displayName = data.displayName?.trim();
            if (!displayName || displayName === 'Unknown Hunter') {
              return null;
            }
            const stats = data.stats || { wins: 0, losses: 0, draws: 0 };
            const totalGames = stats.wins + stats.losses + (stats.draws || 0);
            const winRate = data.winRate !== undefined 
              ? data.winRate 
              : (totalGames > 0 ? (stats.wins / totalGames) * 100 : 0);
            
            return {
              id: doc.id,
              name: displayName,
              wins: stats.wins,
              losses: stats.losses,
              draws: stats.draws || 0,
              totalPower: data.totalPower || 0,
              winRate: parseFloat(winRate.toFixed(1)),
              deck: data.currentDeck || [],
              sns: data.sns !== undefined ? data.sns : 0,
              ipAddress: data.ipAddress || '',
              language: data.language || 'en',
              activeEmoticonKey: data.activeEmoticonKey || undefined,
              activeBadgeKey: data.activeBadgeKey || undefined,
              activeTitleKey: data.activeTitleKey || undefined,
            } as RankingUser & { deck?: any[] };
          })
          .filter((u): u is RankingUser & { deck?: any[] } => u !== null);
      }

      const finalUsers = fetchedUsers.length > 0 ? fetchedUsers : DEFAULT_DUMMY_RANKING_USERS;
      setRawUsers(finalUsers);
      
      const isFromCache = querySnapshot?.metadata?.fromCache ?? false;
      if (!isFromCache || finalUsers.length > 0) {
        setLoading(false);
        setIsGlobalLoading?.(false);
      }
    }, (error) => {
      console.error("Error subscribing to ranking real-time snapshot:", error);
      setRawUsers(DEFAULT_DUMMY_RANKING_USERS);
      setLoading(false);
      setIsGlobalLoading?.(false);
    });

    return () => {
      unsubscribe();
    };
  }, [sortBy, currentSeason]);

  const handleSortChange = (newSort: SortBy) => {
    if (newSort === sortBy) return;
    setSortBy(newSort);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  const handleTypeChange = (newType: RankingType) => {
    if (newType === rankingType) return;
    setRankingType(newType);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  const cancelMatchmaking = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setIsSearching(false);
  };

  useEffect(() => {
    if (!hasAutoMatchedRef.current) {
      hasAutoMatchedRef.current = true;
      handleOptimalBattle();
    }
  }, []);

  // Safe matchmaking timer effect
  useEffect(() => {
    if (!isSearching) return;

    if (searchTimer <= 0) {
      setIsSearching(false);

      const myPower = currentUserData?.totalPower || 0;
      
      // 1순위: 자기 자신 제외 + SNS 보유
      let candidates = users.filter(u => u.id !== user?.uid && u.sns !== undefined && u.sns > 0);
      
      // 2순위: 1순위 후보가 없을 시 자기 자신 제외 (SNS 무관)
      if (candidates.length === 0) {
        candidates = users.filter(u => u.id !== user?.uid);
      }

      let optimal: any = null;
      if (candidates.length === 0) {
        // 3순위: 그마저도 없을 시 가상 AI 봇 생성
        optimal = generateMockOpponent(myPower);
      } else {
        optimal = candidates.reduce((prev, curr) => {
          const diffCurr = Math.abs(curr.totalPower - myPower);
          const diffPrev = Math.abs(prev.totalPower - myPower);
          return diffCurr < diffPrev ? curr : prev;
        });
      }

      playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
      onAttackUser?.({
        id: optimal.id,
        name: optimal.name,
        deck: optimal.deck || [],
        totalPower: optimal.totalPower,
        sns: optimal.sns,
        wins: optimal.wins,
        losses: optimal.losses,
        draws: optimal.draws
      });
      return;
    }

    const timerId = setTimeout(() => {
      setSearchTimer(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [isSearching, searchTimer, users, currentUserData, user, onAttackUser, playSfx]);

  const handleOptimalBattle = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    setIsSearching(true);
    setSearchTimer(5);

    // Select random tip
    const tipKeys = ['game_tip_1', 'game_tip_2', 'game_tip_3', 'game_tip_4', 'game_tip_5'];
    const randomKey = tipKeys[Math.floor(Math.random() * tipKeys.length)];
    setCurrentTip(t(randomKey as any, language));
  };

  // 홈화면 등에서 랭킹대전 바로 시작 요청(autoStartPvp)이 있을 시 처리
  useEffect(() => {
    if (autoStartPvp) {
      handleOptimalBattle();
      onClearAutoStartPvp?.();
    }
  }, [autoStartPvp]);

  // ========== PvP 실시간 매치메이킹 ==========

  /** 컴포넌트 언마운트 시 PvP 큐 정리 */
  useEffect(() => {
    return () => {
      pvpCleanupRef.current?.();
    };
  }, []);

  /** 실시간 PvP 대전 시작 */
  const handleRealTimePvp = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    if (!user || user.uid === 'guest-id') {
      setShowLoginRequiredModal(true);
      return;
    }
    // 재진입 방지: 이미 검색 중이면 무시
    if (isPvpSearching) return;

    const myName = user.displayName || currentUserData?.name || 'Unknown Hunter';
    const myPower = currentUserData?.totalPower || 0;
    const myWins = currentUserData?.wins || 0;
    const myLosses = currentUserData?.losses || 0;

    setIsPvpSearching(true);
    setPvpQueuePos(0);
    setPvpError('');

    const cleanup = joinMatchmaking(
      {
        uid: user.uid,
        name: myName,
        totalPower: myPower,
        wins: myWins,
        losses: myLosses,
      },
      {
        onStateChange: (state: MatchmakingState) => {
          if (state === 'idle') {
            setIsPvpSearching(false);
            pvpCleanupRef.current = null;
          }
        },
        onMatchFound: async (match) => {
          setIsPvpSearching(false);
          pvpCleanupRef.current = null;
          // 상대방 찾기 (자신이 아닌 플레이어)
          const opponent = match.players.find(p => p.uid !== user.uid);
          if (!opponent) {
            setPvpError(t('pvp_matchmaking_error', language));
            return;
          }

          // Firestore에서 상대방의 전체 덱 정보 조회
          setIsGlobalLoading?.(true, t('loading_opponent', language));
          try {
            const oppCollection = currentSeason === 'season1' ? 'users' : `users_${currentSeason}`;
            const oppSnap = await getDoc(doc(db, oppCollection, opponent.uid));
            if (oppSnap.exists()) {
              const data = oppSnap.data();
              onAttackUser?.({
                id: opponent.uid,
                name: opponent.name,
                deck: data.currentDeck || [],
                totalPower: data.totalPower || opponent.totalPower,
                sns: data.sns || 0,
                wins: data.stats?.wins || opponent.wins,
                losses: data.stats?.losses || opponent.losses,
                draws: data.stats?.draws || 0
              });
            } else {
              onAttackUser?.({
                id: opponent.uid,
                name: opponent.name,
                deck: [],
                totalPower: opponent.totalPower,
                sns: 0,
                wins: opponent.wins,
                losses: opponent.losses,
                draws: 0
              });
            }
          } catch (e) {
            console.error('Failed to fetch opponent deck:', e);
            onAttackUser?.({
              id: opponent.uid,
              name: opponent.name,
              deck: [],
              totalPower: opponent.totalPower,
              sns: 0,
              wins: opponent.wins,
              losses: opponent.losses,
              draws: 0
            });
          } finally {
            setIsGlobalLoading?.(false);
          }
        },
        onError: (error: string) => {
          setPvpError(error);
          setIsPvpSearching(false);
          pvpCleanupRef.current = null;
        },
        onQueuePosition: (position: number) => {
          setPvpQueuePos(position);
        },
      }
    );

    pvpCleanupRef.current = cleanup;
  };

  /** 실시간 PvP 매칭 취소 */
  const cancelRealTimePvp = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    pvpCleanupRef.current?.();
    pvpCleanupRef.current = null;
    setIsPvpSearching(false);
    setPvpQueuePos(0);
    setPvpError('');
  };

  // Direct target attack logic
  const handleDirectAttack = async (targetId: string, targetName: string) => {
    if (!user || user.uid === 'guest-id') {
      setShowLoginRequiredModal(true);
      return;
    }

    const oppId = targetId.startsWith('ranking-') ? targetId.substring(8) : targetId;
    if (oppId === user.uid) {
      setCustomAlert({
        isOpen: true,
        title: language === 'ko' ? '알림' : 'NOTICE',
        message: language === 'ko' ? '자기 자신과는 대전할 수 없습니다.' : 'You cannot battle yourself.'
      });
      return;
    }

    setIsGlobalLoading?.(true, t('loading_opponent', language));
    try {
      const oppCollection = currentSeason === 'season1' ? 'users' : `users_${currentSeason}`;
      const oppSnap = await getDoc(doc(db, oppCollection, oppId));

      if (oppSnap.exists()) {
        const oppData = oppSnap.data();
        onAttackUser?.({
          id: oppId,
          name: oppData.displayName || targetName,
          deck: oppData.currentDeck || [],
          totalPower: oppData.totalPower || 0,
          sns: oppData.sns || 0,
          wins: oppData.stats?.wins || 0,
          losses: oppData.stats?.losses || 0,
          draws: oppData.stats?.draws || 0
        });
        setShowHistoryModal(false);
      } else {
        setCustomAlert({
          isOpen: true,
          title: language === 'ko' ? '오류' : 'ERROR',
          message: language === 'ko' ? '상대방의 덱 정보를 가져올 수 없습니다.' : 'Failed to fetch opponent deck data.'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGlobalLoading?.(false);
    }
  };

  const isTop10 = false;
  
  const canClaim = () => {
    return false;
  };

  const handleClaimReward = async () => {
    // No remote backend
  };

  return (
    <div id="leaderboard" className={cn(
      "min-h-screen p-4 pb-[220px]",
      (theme === 'dark' || theme === 'metal')
        ? "text-slate-100 bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black"
        : "app-bg text-slate-800 font-sans"
    )}>
      <div className="max-w-4xl mx-auto w-full px-4">
        <PageHeader title={t('ranking', language)}
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
        badge="HUNTER CP LEADERBOARD"
        title={t('ranking', language)}
        description=""
        actionButton={
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              loadHistory();
              setShowHistoryModal(true);
            }}
            className={cn(
              "min-h-11 w-full sm:w-auto px-3.5 py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 border touch-target",
              (theme === 'dark' || theme === 'metal')
                ? "bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border-indigo-400/40"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200 font-extrabold"
            )}
            title="Battle Records"
          >
            <List size={15} className="shrink-0 text-indigo-500" />
            <span className="min-w-0 truncate text-xs font-black uppercase">{t('battle_record', language)}</span>
          </button>
        }
      />

      {/* Season 1 Leaderboard Countdown & Rank Rewards Banner (Item 28) */}
      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-400/30 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
            <Clock size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-amber-500 tracking-wider">
                {language === 'ko' ? '시즌 1 라이브 랭킹' : 'SEASON 1 LIVE LEADERBOARD'}
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 border border-amber-400/30">
                OFFICIAL
              </span>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-amber-100 flex items-center gap-1.5 mt-0.5">
              <span>{language === 'ko' ? '시즌 종료까지:' : 'Season Ends In:'}</span>
              <span className="font-mono text-amber-600 dark:text-amber-300 tracking-tight">
                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            setShowRankRewardsModal(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Crown size={15} />
          <span>{language === 'ko' ? '시즌 보상 안내' : 'Rank Rewards'}</span>
        </button>
      </div>

      {/* Matching Controls */}
      <div className="mb-6 font-sans space-y-3">
        {/* 실시간 PvP 대전 — 메인 CTA */}
        <button
          onClick={handleRealTimePvp}
          className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer hover:from-red-500 hover:to-rose-500 text-sm border border-red-500/30 touch-target"
        >
          <Zap size={18} className="shrink-0" />
          <span>{t('pvp_matchmaking_title', language)}</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleOptimalBattle}
            className="bg-indigo-600 text-white font-bold py-3.5 rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-indigo-500 text-xs sm:text-sm border border-indigo-500/20 touch-target"
          >
            <Swords size={16} />
            <span>{t('optimal_battle', language)}</span>
          </button>
          <button
            onClick={handleNearbyBattle}
            className="bg-emerald-600 text-white font-bold py-3.5 rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-500 text-xs sm:text-sm border border-emerald-500/20 touch-target"
          >
            <Wifi size={16} />
            <span>{t('nearby_battle', language)}</span>
          </button>
        </div>
      </div>

      {/* 내 순위 요약 헤더 */}
      {user && user.uid !== 'guest-id' && (
        <div className="grid grid-cols-3 gap-3 mb-6 font-sans">
          <div className={cn(
            "p-4 rounded-2xl shadow-md text-center hover:border-indigo-500/20 transition-all border",
            (theme === 'dark' || theme === 'metal') 
              ? "bg-slate-800 border-white/10" 
              : "bg-white border-slate-200/80"
          )}>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{t('global', language)}</div>
            <div className={cn("text-2xl font-extrabold mt-1", (theme === 'dark' || theme === 'metal') ? "text-white" : "text-slate-800")}>
              {myGlobalRank ? `#${myGlobalRank}` : t('out_of_50', language)}
            </div>
          </div>
          <div className={cn(
            "p-4 rounded-2xl shadow-md text-center hover:border-indigo-500/20 transition-all border",
            (theme === 'dark' || theme === 'metal') 
              ? "bg-slate-800 border-white/10" 
              : "bg-white border-slate-200/80"
          )}>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{t('weekly', language)}</div>
            <div className="text-2xl font-extrabold text-blue-400 mt-1 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">
              {myWeeklyRank ? `#${myWeeklyRank}` : t('out_of_50', language)}
            </div>
          </div>
          <div className={cn(
            "p-4 rounded-2xl shadow-md text-center hover:border-indigo-500/20 transition-all border",
            (theme === 'dark' || theme === 'metal') 
              ? "bg-slate-800 border-white/10" 
              : "bg-white border-slate-200/80"
          )}>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{t('monthly', language)}</div>
            <div className="text-2xl font-extrabold text-purple-400 mt-1 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]">
              {myMonthlyRank ? `#${myMonthlyRank}` : t('out_of_50', language)}
            </div>
          </div>
        </div>
      )}

      {/* Tabs for Ranking Type */}
      <div className={cn(
        "flex gap-1 mb-4 p-1 border rounded-xl font-sans",
        (theme === 'dark' || theme === 'metal') ? "bg-slate-950 border-white/5" : "bg-slate-100 border-slate-200"
      )}>
        {(['global', 'weekly', 'monthly'] as RankingType[]).map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={cn(
              "flex-1 min-h-11 px-2 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer border touch-target",
              rankingType === type 
                ? ((theme === 'dark' || theme === 'metal') ? "bg-slate-800 text-white border-white/10 shadow-md" : "bg-white text-slate-850 border-slate-250/80 shadow-xs")
                : ((theme === 'dark' || theme === 'metal') ? "text-slate-400 hover:bg-white/5 border-transparent" : "text-slate-500 hover:bg-white/50 border-transparent")
            )}
          >
            {type === 'global' ? t('global', language) : (type === 'weekly' ? t('weekly', language) : t('monthly', language))}
          </button>
        ))}
      </div>

      <div className={cn(
        "ollama-panel mb-6 font-sans border",
        (theme === 'dark' || theme === 'metal') ? "bg-slate-900 text-white border-none shadow-md" : "bg-white text-slate-800 border-slate-150 shadow-xs"
      )}>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-blue-400" />
          <h2 className={cn("text-xs sm:text-sm font-bold tracking-normal", (theme === 'dark' || theme === 'metal') ? "text-white" : "text-slate-800")}>{t('sort_criteria', language)}</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleSortChange('winRate')}
            className={cn(
              "flex-1 min-h-11 px-2 py-2.5 text-xs sm:text-sm font-bold rounded-lg border transition-all cursor-pointer touch-target",
              sortBy === 'winRate' 
                ? "bg-blue-600 border-blue-500 text-white shadow-sm" 
                : ((theme === 'dark' || theme === 'metal') ? "bg-slate-950 border-white/5 text-slate-400 hover:opacity-75" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100")
            )}
          >
            {t('win_rate', language)}
          </button>
          <button 
            onClick={() => handleSortChange('wins')}
            className={cn(
              "flex-1 min-h-11 px-2 py-2.5 text-xs sm:text-sm font-bold rounded-xl border transition-all cursor-pointer touch-target",
              sortBy === 'wins' 
                ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" 
                : ((theme === 'dark' || theme === 'metal') ? "bg-slate-950 border-white/5 text-slate-400 hover:opacity-75" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100")
            )}
          >
            {t('most_wins', language)}
          </button>
        </div>
        <p className="text-[10px] mt-3 opacity-40 italic">
          {t('guest_excluded', language)}
        </p>
      </div>

      {/* Selected Language Filter State Bar */}
      {selectedLangFilter && (
        <div className={cn(
          "mb-4 flex items-center justify-between p-3 rounded-lg shadow-sm text-xs font-semibold font-sans border",
          (theme === 'dark' || theme === 'metal') 
            ? "bg-amber-950/20 border-amber-500/30 text-amber-200" 
            : "bg-amber-50 border-amber-200 text-amber-800"
        )}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{FLAG_MAP[selectedLangFilter] || '🇺🇸'}</span>
            <span>
              {t('filter_by_lang', language).replace('{lang}', selectedLangFilter.toUpperCase())}
            </span>
          </div>
          <button 
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
              setSelectedLangFilter(null);
            }}
            className={cn(
              "p-1.5 rounded-lg active:scale-95 transition-all shrink-0 flex items-center justify-center cursor-pointer border",
              (theme === 'dark' || theme === 'metal')
                ? "border-amber-500/20 bg-amber-900/60 hover:bg-amber-800 text-amber-100"
                : "border-amber-200 bg-white hover:bg-slate-50 text-amber-800"
            )}
            title={t('clear_filter', language)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
          <p className="text-sm font-bold tracking-normal animate-pulse text-indigo-400">{t('ranking_accessing', language)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((rankUser, idx) => {
            const isMe = user && user.uid === rankUser.id;
            const profileEmoticon = rankUser.activeEmoticonKey ? getProfileEmoticonByKey(rankUser.activeEmoticonKey) : null;
            const profileBadge = rankUser.activeBadgeKey ? getProfileBadgeByKey(rankUser.activeBadgeKey) : null;
            const profileTitle = rankUser.activeTitleKey ? getProfileTitleByKey(rankUser.activeTitleKey) : null;
            return (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={rankUser.id}
                className={cn(
                  "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 transition-all p-3.5 rounded-lg border font-sans",
                  isMe 
                    ? (theme === 'dark' || theme === 'metal'
                        ? "bg-blue-950/70 border-blue-500/80 ring-1 ring-blue-400/30 text-white" 
                        : "bg-indigo-50 border-blue-300 shadow-sm text-slate-800")
                    : (theme === 'dark' || theme === 'metal'
                        ? "bg-slate-900/60 border-slate-800/80 text-slate-200 hover:border-slate-700/80"
                        : "bg-white border-slate-150 text-slate-700 hover:border-slate-300 hover:shadow-xs"),
                  idx === 0 && !isMe ? "border-l-4 border-l-yellow-400" :
                  idx === 1 && !isMe ? "border-l-4 border-l-slate-400" :
                  idx === 2 && !isMe ? "border-l-4 border-l-orange-550" : ""
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 font-sans">
                  <div className={cn(
                    "w-10 h-10 flex items-center justify-center shrink-0 rounded-lg border font-bold shadow-xs",
                    idx === 0 ? "bg-amber-300 border-amber-200 text-slate-900" :
                    idx === 1 ? "bg-slate-200 border-slate-300 text-slate-800" :
                    idx === 2 ? "bg-orange-500 border-orange-400 text-white" :
                    (theme === 'dark' || theme === 'metal' ? "border-slate-800 bg-slate-950 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-500")
                  )}>
                     <span className="text-sm">
                       #{idx + 1}
                     </span>
                  </div>
 
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          setSelectedLangFilter(rankUser.language || 'en');
                        }}
                        className="text-lg cursor-pointer hover:scale-120 transition-transform select-none shrink-0"
                        title={rankUser.language ? rankUser.language.toUpperCase() : 'EN'}
                      >
                        {FLAG_MAP[rankUser.language || 'en'] || '🇺🇸'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={cn("text-sm font-bold truncate tracking-tight flex items-center gap-1.5", theme === 'dark' || theme === 'metal' ? "text-white" : "text-slate-800")}>
                          <span className="truncate">{rankUser.name}</span>
                          {profileEmoticon ? <span className="text-sm leading-none shrink-0">{profileEmoticon.symbol}</span> : null}
                          {profileBadge ? (
                            <span className="rounded-full border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 shrink-0">
                              {profileBadge.symbol}
                            </span>
                          ) : null}
                          {isMe && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                              {t('you', language)}
                            </span>
                          )}
                        </div>
                        {profileTitle ? (
                          <p className={cn("mt-1 text-[10px] font-semibold truncate", theme === 'dark' || theme === 'metal' ? "text-slate-400" : "text-slate-500")}>
                            {t(profileTitle.labelKey, language)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap font-sans">
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 border", theme === 'dark' || theme === 'metal' ? "bg-slate-950 text-slate-400 border-white/5" : "bg-slate-100 text-slate-500 border-slate-200")}>CP</span>
                      <span className="text-xs font-bold text-blue-400 shrink-0">{rankUser.totalPower.toLocaleString()}</span>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md ml-1 shrink-0 border", theme === 'dark' || theme === 'metal' ? "bg-slate-950 text-slate-400 border-white/5" : "bg-slate-100 text-slate-500 border-slate-200")}>SNS</span>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5 shrink-0">
                        🪙 {rankUser.sns !== undefined ? rankUser.sns.toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>
                </div>
 
                <div className={cn("flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 shrink-0", theme === 'dark' || theme === 'metal' ? "border-slate-800" : "border-slate-150")}>
                   <div className="text-left sm:text-right font-sans">
                     <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 flex-wrap">
                        <div className="flex items-center gap-1">
                           <span className="text-[10px] font-black opacity-45 text-slate-400">{t('win_rate', language)}</span>
                           <span className={cn("text-xs font-black", theme === 'dark' || theme === 'metal' ? "text-slate-100" : "text-slate-800")}>{rankUser.winRate}%</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 sm:mt-0.5">
                           <span className="text-[10px] font-bold text-green-400">{rankUser.wins}W</span>
                           <span className="text-[10px] font-bold text-rose-400">{rankUser.losses}L</span>
                           <span className="text-[10px] font-bold text-slate-400">{rankUser.draws}D</span>
                        </div>
                     </div>
                   </div>

                   {user && user.uid !== rankUser.id && (
                     <button
                       onClick={() => {
                         playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                         if (user.uid === 'guest-id') {
                           setShowLoginRequiredModal(true);
                           return;
                         }
                         onAttackUser?.({
                           id: rankUser.id,
                           name: rankUser.name,
                           deck: rankUser.deck || [],
                           totalPower: rankUser.totalPower,
                           sns: rankUser.sns,
                           wins: rankUser.wins,
                           losses: rankUser.losses,
                           draws: rankUser.draws
                         });
                       }}
                       className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase rounded-lg shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer border border-rose-500/20"
                     >
                       {t('attack', language)}
                     </button>
                   )}
                </div>
              </motion.div>
            );
          })}

          {users.length === 0 && (
            <div className="text-center py-20 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 mx-4 font-sans text-slate-300">
              <div className="mb-4 flex flex-col items-center">
                <Users size={40} className="text-slate-600 mb-2" />
                <p className="text-sm font-bold uppercase opacity-45 tracking-widest text-slate-400">{t('insufficient_data', language)}</p>
              </div>
              <div className="space-y-2 px-8">
                <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                  {language === 'ko' 
                    ? '데이터베이스에 등록된 헌터가 없습니다. 에뮬레이터를 재시작했거나 아직 동기화된 데이터가 없을 수 있습니다.' 
                    : 'No hunters found in database. The emulator might have reset or no data has been synced yet.'}
                </p>
                <div className="pt-4">
                  <button 
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                      window.location.reload(); 
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 text-xs font-bold uppercase rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    {language === 'ko' ? '데이터 다시 불러오기' : 'RELOAD DATABANK'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Battle Records History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10 font-sans flex flex-col max-h-[80vh] text-white"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <List size={18} className="text-yellow-400" />
                  <span className="font-bold uppercase tracking-wider text-sm">
                    {t('battle_record', language)} (RECENT 50)
                  </span>
                </div>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="text-white hover:text-red-400 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Records List Body */}
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                {/* Push Alert Opt-In Button moved here */}
                <div className="flex justify-center mb-3">
                  <button
                    onClick={handlePushOptIn}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-bold text-xs uppercase rounded-xl shadow-md hover:from-amber-500 hover:to-yellow-600 active:scale-95 transition-all cursor-pointer"
                  >
                    <Bell size={14} className="animate-bounce" />
                    <span>{t('push_alert_opt_in', language)}</span>
                  </button>
                </div>

                {localHistory.map((item, idx) => {
                  const isWin = item.winner === 'player';
                  const isDraw = item.winner === 'draw';
                  
                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        if (item.player2Id && item.player2Id !== 'SYSTEM_BOT') {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          handleDirectAttack(item.player2Id, item.player2Id);
                        }
                      }}
                      className={cn(
                        "p-3.5 rounded-2xl border flex items-center justify-between shadow-xs cursor-pointer hover:shadow-sm transition-all",
                        isWin ? "bg-emerald-950/20 border-emerald-800/40" : isDraw ? "bg-slate-900/60 border-slate-800/40" : "bg-rose-950/20 border-rose-800/40"
                      )}
                    >
                      <div className="min-w-0 flex-1 font-sans">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shadow-xs",
                            isWin ? "bg-emerald-600 text-white" : isDraw ? "bg-slate-700 text-slate-300" : "bg-rose-605 text-white"
                          )}>
                            {isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'}
                          </span>
                          <span className="font-black text-xs text-slate-200 truncate">
                            VS {item.player2Id === 'SYSTEM_BOT' ? 'AI ROBOT' : item.player2Id}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0 font-sans">
                        <div className="font-black text-xs text-slate-100">
                          SCORE: {item.score || 'N/A'}
                        </div>
                        <div className="text-[10px] font-black text-yellow-400 mt-0.5">
                          🪙 {item.rewardSns >= 0 ? `+${item.rewardSns}` : item.rewardSns} SNS
                        </div>
                      </div>
                    </div>
                  );
                })}

                {localHistory.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    {language === 'ko' ? '기록된 전투 내역이 없습니다.' : 'No recorded battle history.'}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Alert Modal */}
      <AnimatePresence>
        {showPwaAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 rounded-3xl p-6 max-w-sm w-full border border-slate-800 shadow-2xl text-center space-y-6 font-sans text-white"
            >
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-300 to-yellow-400 border border-amber-200 rounded-full mx-auto flex items-center justify-center shadow-md">
                {pwaAlertMode === 'success' ? <Bell size={28} className="text-slate-900" /> : <AlertCircle size={28} className="text-slate-900" />}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase leading-none text-slate-100">
                  {pwaAlertMode === 'success' ? (language === 'ko' ? '알림 설정 완료' : 'NOTIFICATION ACTIVE') : (language === 'ko' ? 'PWA 안내' : 'PWA INSTALL GUIDE')}
                </h3>
                <p className="text-sm font-semibold text-slate-400 leading-tight">
                  {pwaAlertMode === 'success' 
                    ? t('notification_granted_success', language)
                    : t('pwa_install_guide', language)
                  }
                </p>
              </div>

              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  setShowPwaAlert(false);
                  setShowHistoryModal(true);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all cursor-pointer border border-white/5"
              >
                {language === 'ko' ? '확인' : 'OK'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insufficient SNS Popup Modal */}
      <AnimatePresence>
        {showInsufficientPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 rounded-3xl p-6 max-w-sm w-full border border-slate-800 shadow-2xl text-center space-y-6 font-sans text-white"
            >
              <div className="w-16 h-16 bg-red-950/30 rounded-full mx-auto flex items-center justify-center border border-red-500/30 mb-4 shadow-md">
                <ShieldAlert size={32} className="text-red-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold uppercase text-slate-100">ACCESS DENIED</h3>
                <p className="text-sm font-semibold text-slate-400">
                  {t('not_enough_sns', language)}
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    setShowInsufficientPopup(false);
                    setView?.('shop');
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black py-3.5 uppercase tracking-wider text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} />
                  {language === 'ko' ? '상점/충전소 이동 (Go to Shop)' : 'Go to Shop / Top-Up'}
                </button>
                <button 
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    setShowInsufficientPopup(false);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 py-2.5 font-bold uppercase tracking-wider text-xs rounded-xl cursor-pointer border border-white/5"
                >
                  {t('yes_accept', language) || "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {autoBattleCountdown !== null && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-4 select-none">
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-950 rounded-3xl p-8 max-w-sm w-full border border-slate-800 shadow-2xl text-center space-y-6 font-sans text-white"
            >
              <div className="w-16 h-16 bg-blue-950/30 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-800/30 shadow-md animate-pulse">
                <Swords size={28} className="animate-bounce text-slate-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold uppercase tracking-tight text-slate-100">{language === 'ko' ? '자동 매칭' : 'AUTO MATCHING'}</h3>
                <p className="text-sm font-semibold text-slate-400 leading-tight">
                  {language === 'ko' ? '최적의 상대를 탐색하고 있습니다...' : 'Finding the optimal opponent...'}
                </p>
              </div>
              <div className="text-5xl font-black text-blue-400 animate-pulse drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">
                {autoBattleCountdown}
              </div>
              <button 
                onClick={onBack}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 text-sm font-bold uppercase transition-colors shadow-sm active:scale-95 cursor-pointer border border-red-500/20"
              >
                {language === 'ko' ? '취소 및 로비로' : 'Cancel & Lobby'}
              </button>
            </motion.div>
          </div>
        )}

        {showNoOptimalPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 rounded-3xl p-7 max-w-sm w-full border border-slate-800 shadow-2xl text-center space-y-6 select-none relative text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 bg-yellow-950/30 border border-yellow-800/30 rounded-full mx-auto flex items-center justify-center shadow-md animate-pulse">
                <ShieldAlert size={26} className="text-yellow-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold tracking-tight text-slate-100 uppercase leading-none">{language === 'ko' ? '매칭 상대 없음' : 'NO TARGET FOUND'}</h3>
                <p className="text-sm font-semibold text-slate-400 leading-tight">
                  {t('no_optimal_opponent', language)}
                </p>
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl text-left">
                  <p className="text-[10px] font-semibold text-slate-400 leading-normal">
                    {t('optimal_battle_condition_desc', language)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  setShowNoOptimalPopup(false);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer border border-white/5"
              >
                {language === 'ko' ? '확인' : 'OK'}
              </button>
            </motion.div>
          </motion.div>
        )}

        {showLoginRequiredModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 rounded-3xl p-7 max-w-sm w-full border border-slate-800 shadow-2xl text-center space-y-6 select-none relative overflow-hidden text-white"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  setShowLoginRequiredModal(false);
                }}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
              >
                <X size={14} />
              </button>

              <div className="w-14 h-14 bg-blue-950/30 border border-blue-800/30 rounded-full mx-auto flex items-center justify-center shadow-md">
                <Users size={26} className="text-blue-400" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-bold tracking-tight text-slate-100 uppercase leading-none">{language === 'ko' ? '로그인 필요' : 'LOGIN REQUIRED'}</h3>
                <p className="text-sm font-semibold text-slate-400 leading-tight">
                  {t('login_required_ranking', language)}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={async () => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
                    if (onLogin) {
                      try {
                        await onLogin();
                        setShowLoginRequiredModal(false);
                      } catch (err) {
                        console.error("Login failed:", err);
                      }
                    }
                  }}
                  className="w-full h-14 bg-slate-900 border border-slate-800 hover:bg-slate-850 p-4 flex items-center justify-center gap-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all group cursor-pointer text-white"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 group-hover:scale-105 transition-transform">
                    <path
                      fill="#EA4335"
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.36-2.12 4.36-1.12.88-2.6 1.48-5.72 1.48-4.8 0-8.72-3.88-8.72-8.72s3.92-8.72 8.72-8.72c2.6 0 4.56 1.04 5.96 2.32l2.32-2.32c-2.12-2.04-4.92-3.2-8.28-3.2C5.36 0 0 5.36 0 12s5.36 12 12 12c3.56 0 6.24-1.16 8.36-3.32 2.12-2.12 2.84-5.2 2.84-7.76 0-.56-.04-1.12-.12-1.64h-10.6z"
                    />
                  </svg>
                  <span className="font-bold text-sm uppercase tracking-wider text-white">
                    {language === 'ko' ? 'Google 로그인' : 'Google Login'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    setShowLoginRequiredModal(false);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-855 text-slate-300 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs border border-slate-800 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  {language === 'ko' ? '취소' : 'CANCEL'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Alert Modal */}
      <AnimatePresence>
        {customAlert.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 rounded-3xl p-7 max-w-sm w-full border border-slate-800 shadow-2xl text-center space-y-6 select-none relative overflow-hidden text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 bg-amber-950/30 border border-amber-800/30 rounded-full mx-auto flex items-center justify-center shadow-md">
                <ShieldAlert size={26} className="text-amber-400" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-bold tracking-tight text-slate-100 uppercase leading-none">{customAlert.title}</h3>
                <p className="text-sm font-semibold text-slate-400 leading-tight">
                  {customAlert.message}
                </p>
              </div>

              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  setCustomAlert(prev => ({ ...prev, isOpen: false }));
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer border border-white/5"
              >
                {language === 'ko' ? '확인' : 'OK'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PvP 실시간 매치메이킹 오버레이 */}
      <AnimatePresence>
        {isPvpSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-slate-900 border-4 border-red-600 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_60px_rgba(220,38,38,0.25)] text-center space-y-6 select-none relative overflow-hidden text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-rose-400 to-red-500" />
              
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-red-500/30 animate-spin-slow" />
                <div className="absolute inset-2 rounded-full border border-rose-500/20" />
                <div className="w-20 h-20 rounded-full bg-slate-950/60 border-2 border-red-500 flex items-center justify-center shadow-lg shadow-red-500/10">
                  <Zap size={40} className="text-yellow-400" />
                </div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-400 animate-ping delay-300" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-200 to-red-300 uppercase">
                  {t('pvp_matchmaking_title', language)}
                </h3>
                <p className="text-slate-400 text-[11px] font-bold tracking-widest uppercase">
                  {t('pvp_matchmaking_searching', language)}
                </p>
              </div>

              {/* 대기열 위치 */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4.5 text-center min-h-[90px] flex flex-col justify-center items-center">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {t('pvp_matchmaking_queue_position', language, { position: pvpQueuePos })}
                  </span>
                </div>
              </div>

              {/* 에러 메시지 */}
              {pvpError && (
                <div className="bg-red-950/50 border border-red-900/50 rounded-xl p-3 text-center">
                  <p className="text-xs font-semibold text-red-400">{pvpError}</p>
                </div>
              )}

              <button
                onClick={cancelRealTimePvp}
                className="w-full bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 hover:from-red-950 hover:to-red-900 hover:border-red-900 hover:text-red-300 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer touch-target"
              >
                {t('pvp_matchmaking_cancel', language)}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hearthstone-style Matchmaking Modal */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white border-2 border-amber-100 rounded-3xl p-8 max-w-sm w-full shadow-[0_20px_50px_rgba(217,119,6,0.15)] text-center space-y-6 select-none relative overflow-hidden text-slate-800"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
              
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-400/20 animate-spin-slow" />
                <div className="absolute inset-2 rounded-full border border-yellow-400/20" />
                <div className="w-20 h-20 rounded-full bg-amber-50/80 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-200/20">
                  <Compass size={40} className="text-amber-500 animate-spin-slow" />
                </div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-500 animate-ping delay-300" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 uppercase animate-pulse">
                  {t('searching_optimal', language)}
                </h3>
                <div className="flex justify-center items-center gap-1 text-slate-500 text-[11px] font-bold tracking-widest uppercase">
                  <span>ESTIMATED TIME:</span>
                  <span className="text-amber-600 font-black text-sm">{searchTimer}s</span>
                </div>
              </div>

              <div className="bg-amber-50/30 border border-amber-100/70 rounded-2xl p-4.5 text-left relative overflow-hidden shadow-sm min-h-[90px] flex flex-col justify-center">
                <div className="absolute top-0 left-0 bg-amber-500 text-white font-black uppercase text-[8px] tracking-wider px-2 py-0.5 rounded-br-lg">
                  {t('matching_tip', language)}
                </div>
                <p className="text-xs font-semibold leading-relaxed text-slate-600 pt-2 text-center italic">
                  "{currentTip}"
                </p>
              </div>

              <button
                onClick={cancelMatchmaking}
                className="w-full bg-slate-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 border border-slate-200 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-sm active:scale-[0.98] transition-all cursor-pointer touch-target"
              >
                {language === 'ko' ? '취소' : 'CANCEL'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Nearby Search Type Modal */}
      <AnimatePresence>
        {showNearbyTypeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 rounded-3xl p-5.5 max-w-sm w-full border border-slate-800 shadow-2xl text-center space-y-5 select-none relative overflow-hidden text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-md font-bold tracking-tight text-slate-100 uppercase leading-none">
                  {t('nearby_select_method', language)}
                </h3>
                <button
                  onClick={() => setShowNearbyTypeModal(false)}
                  className="p-1 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3.5 pt-1">
                <button
                  onClick={handleWifiSearch}
                  className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white p-4.5 rounded-2xl shadow-md active:scale-[0.98] transition-all flex flex-col items-center gap-2 font-bold tracking-wider uppercase text-xs cursor-pointer"
                >
                  <Wifi size={22} className="text-blue-400" />
                  <span>Wi-Fi (IP)</span>
                </button>

                <button
                  onClick={handleBluetoothSearch}
                  className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white p-4.5 rounded-2xl shadow-md active:scale-[0.98] transition-all flex flex-col items-center gap-2 font-bold tracking-wider uppercase text-xs cursor-pointer"
                >
                  <Bluetooth size={22} className="text-purple-400" />
                  <span>Bluetooth</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Bluetooth Permission Simulation Modal */}
      <AnimatePresence>
        {showBluetoothPermissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 rounded-3xl p-6.5 max-w-sm w-full border border-slate-800 shadow-2xl text-center space-y-6 select-none relative overflow-hidden text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-purple-950/30 border border-purple-800/30 rounded-full mx-auto flex items-center justify-center shadow-md">
                <Bluetooth size={28} className="text-purple-400 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight text-slate-100 uppercase leading-none">
                  {t('bt_permission_title', language)}
                </h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                  {t('bt_permission_desc', language)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => setShowBluetoothPermissionModal(false)}
                  className="w-full bg-slate-50 text-slate-650 hover:text-slate-800 hover:bg-slate-100 py-3 rounded-xl font-bold uppercase tracking-wider text-xs border border-slate-200/50 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  {t('deny', language)}
                </button>
                <button
                  onClick={handleBluetoothPermissionGrant}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-purple-650/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {t('allow', language)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Wi-Fi Search and List Modal */}
      <AnimatePresence>
        {showWifiModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 rounded-3xl p-5.5 max-w-sm w-full border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden select-none max-h-[80vh] text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Wifi size={18} className="text-blue-400" />
                  <h3 className="text-md font-bold tracking-tight text-slate-100 uppercase leading-none">
                    Wi-Fi (IP) Players
                  </h3>
                </div>
                <button
                  onClick={() => setShowWifiModal(false)}
                  className="p-1 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 min-h-[200px] flex flex-col justify-center">
                {isNearbySearching ? (
                  <div className="text-center space-y-4 py-8">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t('searching', language)}
                    </p>
                  </div>
                ) : nearbyList.length === 0 ? (
                  <div className="text-center text-xs font-semibold text-slate-400 py-8">
                    No players found.
                  </div>
                ) : (
                  <div className="space-y-2 shrink-0 my-auto">
                    {nearbyList.map(opp => (
                      <button
                        key={opp.id}
                        onClick={() => handleSelectNearbyOpponent(opp)}
                        className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 p-4.5 rounded-xl flex flex-col gap-1.5 text-left active:scale-[0.98] transition-all cursor-pointer shadow-md text-white"
                      >
                        <span className="text-xs font-bold text-slate-200 truncate">{opp.name}</span>
                        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                          <span>⚔️ TP: {opp.totalPower}</span>
                          <span>🪙 SNS: {opp.sns}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Bluetooth Search and List Modal */}
      <AnimatePresence>
        {showBluetoothModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 rounded-3xl p-5.5 max-w-sm w-full border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden select-none max-h-[80vh] text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Bluetooth size={18} className="text-purple-400" />
                  <h3 className="text-md font-bold tracking-tight text-slate-100 uppercase leading-none">
                    Bluetooth Devices
                  </h3>
                </div>
                <button
                  onClick={() => setShowBluetoothModal(false)}
                  className="p-1 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 min-h-[200px] flex flex-col justify-center">
                {isNearbySearching ? (
                  <div className="text-center space-y-4 py-8">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t('searching', language)}
                    </p>
                  </div>
                ) : nearbyList.length === 0 ? (
                  <div className="text-center text-xs font-semibold text-slate-400 py-8">
                    No devices found.
                  </div>
                ) : (
                  <div className="space-y-2 shrink-0 my-auto">
                    {nearbyList.map(opp => (
                      <button
                        key={opp.id}
                        onClick={() => handleSelectNearbyOpponent(opp)}
                        className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 p-4.5 rounded-xl flex flex-col gap-1.5 text-left active:scale-[0.98] transition-all cursor-pointer shadow-md text-white"
                      >
                        <span className="text-xs font-bold text-slate-200 truncate">{opp.name}</span>
                        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                          <span>⚔️ TP: {opp.totalPower}</span>
                          <span>🪙 SNS: {opp.sns}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
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
                <h3 className="font-bold text-sm text-slate-800">{t('ranking', language)}</h3>
              </div>
              <div className="min-h-[120px] flex flex-col justify-center text-sm text-slate-600 leading-relaxed space-y-2 mb-4">
                {helpSlide === 0 && (
                  <p>{language === 'ko' ? '전 세계 헌터들의 전투력(CP)과 승률을 기준으로 한 리더보드입니다. 실시간 Firestore 데이터를 기반으로 순위가 집계됩니다.' : 'Global leaderboard ranked by Combat Power (CP) and win rate. Rankings are aggregated from real-time Firestore data.'}</p>
                )}
                {helpSlide === 1 && (
                  <p>{language === 'ko' ? '글로벌 / 주간 / 월간 탭으로 다양한 기간의 순위를 확인할 수 있습니다. 승률 또는 승리 횟수 기준으로 정렬할 수 있습니다.' : 'Switch between Global, Weekly, and Monthly tabs. Sort by win rate or total wins.'}</p>
                )}
                {helpSlide === 2 && (
                  <p>{language === 'ko' ? '실시간 PvP 매치메이킹으로 동시 접속 중인 상대와 대결하거나, 최적 상대 찾기로 자동 매칭할 수 있습니다. 근거리 Wi-Fi/Bluetooth 대전도 지원합니다.' : 'Real-time PvP matchmaking, optimal auto-matching, and nearby Wi-Fi/Bluetooth battles are available.'}</p>
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
      {/* Rank Rewards Preview Modal (Item 28) */}
      <RankRewardsModal
        isOpen={showRankRewardsModal}
        onClose={() => setShowRankRewardsModal(false)}
        language={language}
      />

      {/* Match History Modal (Item 35) */}
      <MatchHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        language={language}
      />

    </div>
  );
};
