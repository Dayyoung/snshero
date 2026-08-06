import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ViewType, Language, UserStats, CardData, Item, InventoryRecord } from '../types';
import { PageHeader } from '../components/PageHeader';
import { CardItem } from '../components/CardItem';
import { t } from '../lib/i18n';
import { TestingDashboard } from '../components/TestingDashboard';
import { StatusView } from './StatusView';
import { collection, getDocs, doc, setDoc, query, orderBy, onSnapshot } from '../lib/firebaseMock';
import { db } from '../lib/firebase';
import { getUserCollectionName } from '../lib/utils';
import { CARD_DATABASE } from '../cardDatabase';
import { ITEM_DATABASE } from '../constants/itemDatabase';
import { INITIAL_SKILLS, INITIAL_CARDS, syncCardWithDatabase } from '../constants';
import { Zap, Search, Users, Cpu, BarChart3, LogOut, Save, Play, Calendar, Gauge, TrendingUp, HelpCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ContentCalendarPanel } from '../components/admin/ContentCalendarPanel';
import { ScaleupGateBoard } from '../components/admin/ScaleupGateBoard';
import { AdminAnalyticsDashboard } from '../components/admin/AdminAnalyticsDashboard';

interface AdminViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  setIsAutoBattle: (val: boolean) => void;
  isAutoBattle: boolean;
  isSimulationActive: boolean;
  setIsSimulationActive: (val: boolean) => void;
  isAutoLoop: boolean;
  setIsAutoLoop: (val: boolean) => void;
  lastTestReport: any | null;
  setLastTestReport: (val: any) => void;
  errorHistory: any[];
  setErrorHistory: (history: any[]) => void;
  currentSeason: string;
  lowSpecMode: boolean;
  playSfx: (url: string) => void;
  startSimulation: (uid: string, userData: any) => Promise<void>;
  simulationUser: any | null;
}

const helpSlides = (lang: Language) => [
  {
    title: lang === 'ko' ? '관리자 패널' : 'Admin Panel',
    content: lang === 'ko'
      ? '사용자 데이터 관리, 시뮬레이션 실행, 구매 내역 확인, 콘텐츠 캘린더 등 관리자 전용 기능을 제공합니다.'
      : 'Provides admin-only features including user data management, simulation execution, purchase history, and content calendar.',
  },
  {
    title: lang === 'ko' ? '사용자 관리' : 'User Management',
    content: lang === 'ko'
      ? 'Firestore에서 사용자 목록을 불러와 닉네임, SNS 코인, 전투력 등을 직접 수정하고 저장할 수 있습니다.'
      : 'Load user lists from Firestore to directly edit nicknames, SNS coins, power levels, and save changes.',
  },
  {
    title: lang === 'ko' ? '리소스 편집기' : 'Resource Editor',
    content: lang === 'ko'
      ? '선택한 사용자의 덱을 편집하고, 모든 카드를 최대 레벨로 올리거나 잠금 해제할 수 있습니다.'
      : 'Edit the selected user\'s deck, max out all cards, or unlock all cards.',
  },
  {
    title: lang === 'ko' ? '시뮬레이션' : 'Simulation',
    content: lang === 'ko'
      ? '선택한 사용자로 자동 전투 시뮬레이션을 실행하여 게임 밸런스와 동작을 테스트할 수 있습니다.'
      : 'Run auto-battle simulations as the selected user to test game balance and behavior.',
  },
];

export const AdminView: React.FC<AdminViewProps> = ({ 
  onNavigate, 
  language,
  setIsAutoBattle,
  isAutoBattle,
  isSimulationActive,
  setIsSimulationActive,
  isAutoLoop,
  setIsAutoLoop,
  lastTestReport,
  setLastTestReport,
  errorHistory,
  setErrorHistory,
  currentSeason,
  lowSpecMode,
  playSfx,
  startSimulation,
  simulationUser
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('hero_admin_authenticated') === 'true' : false;
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'simulation' | 'status' | 'purchases' | 'calendar' | 'gates' | 'analytics'>('users');
  const [showHelp, setShowHelp] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelp) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelp]);

  const [helpStep, setHelpStep] = useState(0);

  // 사용자 관리 상태
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRealUsers, setFilterRealUsers] = useState(false);
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserData, setSelectedUserData] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Deck & Specific Card Editor states in Resource Editor
  const [selectedDeckSlot, setSelectedDeckSlot] = useState<number | null>(null);
  const [selectedCardToEdit, setSelectedCardToEdit] = useState<number | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [purchasesList, setPurchasesList] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'purchases') return;

    const purchasesRef = collection(db, 'purchases');
    const q = query(purchasesRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPurchasesList(list);
    }, (error) => {
      console.error("Error listening to purchases:", error);
    });

    return () => unsubscribe();
  }, [isAuthenticated, activeTab]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123' || password === 'dryudryu') {
      setIsAuthenticated(true);
      localStorage.setItem('hero_admin_authenticated', 'true');
      setError('');
    } else {
      setError(t('admin_login_error', language) || 'Invalid Credentials');
    }
  };

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const colRef = collection(db, getUserCollectionName(currentSeason));
      const snap = await getDocs(colRef);
      const list = snap.docs.map(d => ({
        uid: d.id,
        ...d.data()
      }));
      setUsersList(list);
      return list;
    } catch (err) {
      console.error("Failed to fetch users:", err);
      return [];
    } finally {
      setIsLoadingUsers(false);
    }
  }, [currentSeason]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'users') {
      fetchUsers();
    }
  }, [isAuthenticated, activeTab, fetchUsers]);

  const handleSelectUser = (u: any) => {
    setSelectedUserId(u.uid);
    // Deep clone to avoid direct mutations
    setSelectedUserData(JSON.parse(JSON.stringify(u)));
    setSelectedDeckSlot(null);
    setSelectedCardToEdit(null);
  };

  const handleUpdateField = (field: string, value: any) => {
    setSelectedUserData((prev: any) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleUpdateStatsField = (field: string, value: any) => {
    setSelectedUserData((prev: any) => {
      if (!prev) return prev;
      const prevStats = prev.stats || {};
      return {
        ...prev,
        stats: { ...prevStats, [field]: value }
      };
    });
  };

  const handleSaveUserData = async () => {
    if (!selectedUserId || !selectedUserData) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, getUserCollectionName(currentSeason), selectedUserId);
      const dataToSave = {
        ...selectedUserData,
        lastSync: Date.now()
      };
      delete dataToSave.uid;
      
      await setDoc(docRef, dataToSave, { merge: true });
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      
      const freshList = await fetchUsers();
      
      // Update local state with fresh data from list
      const freshUser = freshList.find(u => u.uid === selectedUserId);
      if (freshUser) {
        setSelectedUserData(JSON.parse(JSON.stringify(freshUser)));
      }
    } catch (err) {
      console.error("Failed to save user:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateUser = async () => {
    if (!selectedUserId || !selectedUserData) return;
    try {
      await startSimulation(selectedUserId, selectedUserData);
      onNavigate('home');
    } catch (err) {
      console.error("Failed to simulate user:", err);
    }
  };

  // --- Resource Editor Helpers ---
  const handleMaxAllCards = () => {
    if (!selectedUserData) return;
    const inv = { ...(selectedUserData.inventory || {}) };
    Object.keys(inv).forEach(key => {
      const id = parseInt(key);
      if (!inv[id]) return;
      inv[id].level = 100;
      inv[id].skills = INITIAL_SKILLS.map(s => ({ ...s, level: 100 }));
      
      const bestItems = Object.fromEntries(
        ['necklace', 'boots', 'ring1', 'ring2'].map(slot => {
          const itemBase = ITEM_DATABASE.find(i => i.slot === slot && i.rarity === 'rare') || ITEM_DATABASE.find(i => i.slot === slot);
          if (!itemBase) return [slot, undefined];
          return [slot, { ...itemBase, id: Math.random().toString(36).substring(2, 11) }];
        })
      );
      inv[id].equipment = bestItems as any;
    });

    const newDeck = (selectedUserData.currentDeck || []).map((card: any) => {
      if (!card) return card;
      const bestItems = Object.fromEntries(
        ['necklace', 'boots', 'ring1', 'ring2'].map(slot => {
          const itemBase = ITEM_DATABASE.find(i => i.slot === slot && i.rarity === 'rare') || ITEM_DATABASE.find(i => i.slot === slot);
          if (!itemBase) return [slot, undefined];
          return [slot, { ...itemBase, id: Math.random().toString(36).substring(2, 11) }];
        })
      );
      return {
        ...card,
        level: 100,
        skills: INITIAL_SKILLS.map(s => ({ ...s, level: 100 })),
        equipment: bestItems as any
      };
    });

    setSelectedUserData((prev: any) => ({
      ...prev,
      inventory: inv,
      currentDeck: newDeck
    }));
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  const handleUnlockAllCards = () => {
    if (!selectedUserData) return;
    const inv = { ...(selectedUserData.inventory || {}) };
    Object.keys(CARD_DATABASE).forEach(key => {
      const dbId = parseInt(key);
      const dbCard = CARD_DATABASE[dbId];
      if (!inv[dbId]) {
        inv[dbId] = {
          cardIndex: dbId,
          quantity: 99,
          rarity: dbCard.rarity || 'bronze',
          level: 1,
          skills: [],
          equipment: {}
        };
      } else {
        inv[dbId].quantity = 99;
      }
    });

    setSelectedUserData((prev: any) => ({
      ...prev,
      inventory: inv
    }));
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleResetAllCards = () => {
    if (!selectedUserData) return;
    if (isConfirmingReset) {
      const emptyDeck = INITIAL_CARDS.slice(0, 5).map(c => syncCardWithDatabase(c, {}));
      setSelectedUserData((prev: any) => ({
        ...prev,
        inventory: {},
        currentDeck: emptyDeck,
        itemInventory: [],
        stats: {
          ...(prev.stats || {}),
          skillPoints: 0,
          skillLevels: {}
        }
      }));
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      setIsConfirmingReset(false);
    } else {
      setIsConfirmingReset(true);
      setTimeout(() => setIsConfirmingReset(false), 3000);
    }
  };

  const handleCardSelectForDeck = (dbId: number) => {
    if (selectedDeckSlot === null || !selectedUserData) return;
    const dbCard = CARD_DATABASE[dbId];
    if (!dbCard) return;

    const inv = { ...(selectedUserData.inventory || {}) };
    if (!inv[dbId]) {
      inv[dbId] = { cardIndex: dbId, quantity: 99, rarity: dbCard.rarity || 'bronze', level: 1, skills: [], equipment: {} };
    }

    const currentDeck = selectedUserData.currentDeck || [];
    const isAlreadyInOtherSlot = currentDeck.some((c: any, idx: number) => idx !== selectedDeckSlot && c && c.imageIndex === dbId);
    if (isAlreadyInOtherSlot) return;

    const newDeck = [...currentDeck];
    newDeck[selectedDeckSlot] = {
      id: `custom-${dbId}-${Date.now()}`,
      imageIndex: dbId,
      title: dbCard.title,
      title_en: dbCard.title_en,
      title_dis: dbCard.title_dis,
      stats: [...dbCard.stats] as [number, number, number, number],
      rarity: dbCard.rarity || 'bronze',
      level: inv[dbId]?.level || 1,
      skills: inv[dbId]?.skills || [],
      equipment: inv[dbId]?.equipment || {}
    };

    setSelectedUserData((prev: any) => ({
      ...prev,
      inventory: inv,
      currentDeck: newDeck
    }));
    setSelectedDeckSlot(null);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  // Filtered users list computation
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      u.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (filterRealUsers) {
      return matchesSearch && u.uid !== 'guest-id' && !u.uid.startsWith('ranking-') && !u.isVirtual;
    }
    return matchesSearch;
  });

  const allDbCards = Object.keys(CARD_DATABASE).map(Number);
  const slides = helpSlides(language);

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 p-6 md:p-8 font-sans relative overflow-hidden flex flex-col justify-start">
      {/* HUD Background Decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="max-w-4xl mx-auto w-full relative z-10 my-auto flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2">
          <PageHeader title="ADMIN" onBack={() => onNavigate('home')} dark />
          <button
            onClick={() => { setShowHelp(true); setHelpStep(0); }}
            className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors cursor-pointer shrink-0 mt-1"
          >
            <HelpCircle size={16} />
          </button>
        </div>
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-800/80 p-8 rounded-3xl shadow-2xl backdrop-blur-md text-center space-y-6 my-auto">
            <div className="w-16 h-16 bg-red-950/40 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <span className="text-red-500 font-bold text-2xl animate-pulse">⚡</span>
            </div>
            
            <h2 className="text-xl font-extrabold tracking-tight uppercase text-red-500">
              ADMINISTRATOR LOGIN
            </h2>

            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2">
              <input
                type="password"
                placeholder="ACCESS_KEY..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/85 border border-slate-800 p-3.5 rounded-2xl text-center text-sm font-semibold outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 text-white tracking-widest placeholder:text-white/20"
                autoFocus
              />
              {error && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                  ⚠️ {error}
                </p>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-650 to-rose-650 hover:from-red-600 hover:to-rose-600 text-white font-bold text-xs py-3.5 rounded-2xl active:scale-[0.98] transition-all uppercase tracking-wider shadow-lg shadow-red-950/20 border border-red-500/10 cursor-pointer"
              >
                SUBMIT_CREDENTIALS
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col xl:flex-row gap-8 min-h-0 mt-6">
            
            {/* Left Sidebar Menu */}
            <div className="w-full xl:w-64 bg-slate-900/60 border border-slate-800/80 p-4 rounded-3xl shrink-0 flex flex-col gap-2 shadow-md backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider rounded-2xl border transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer ${
                  activeTab === 'users'
                    ? 'border-indigo-500/50 text-white bg-indigo-600/10 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users size={14} />
                <span>{language === 'ko' ? '사용자 관리' : 'User Management'}</span>
              </button>
              <button
                onClick={() => setActiveTab('simulation')}
                className={`w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider rounded-2xl border transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer ${
                  activeTab === 'simulation'
                    ? 'border-indigo-500/50 text-white bg-indigo-600/10 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Cpu size={14} />
                <span>{language === 'ko' ? '시뮬레이션 커널' : 'Simulation Kernel'}</span>
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider rounded-2xl border transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer ${
                  activeTab === 'status'
                    ? 'border-indigo-500/50 text-white bg-indigo-600/10 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 size={14} />
                <span>{language === 'ko' ? '실시간 통계' : 'Live Statistics'}</span>
              </button>

              <button
                onClick={() => setActiveTab('purchases')}
                className={`w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider rounded-2xl border transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer ${
                  activeTab === 'purchases'
                    ? 'border-indigo-500/50 text-white bg-indigo-600/10 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap size={14} />
                <span>{t('admin_menu_purchases', language)}</span>
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider rounded-2xl border transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'border-indigo-500/50 text-white bg-indigo-600/10 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar size={14} />
                <span>{t('admin_menu_calendar', language)}</span>
              </button>
              <button
                onClick={() => setActiveTab('gates')}
                className={`w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider rounded-2xl border transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer ${
                  activeTab === 'gates'
                    ? 'border-indigo-500/50 text-white bg-indigo-600/10 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Gauge size={14} />
                <span>{t('admin_menu_gates', language)}</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider rounded-2xl border transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'border-indigo-500/50 text-white bg-indigo-600/10 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp size={14} />
                <span>{t('admin_menu_analytics', language)}</span>
              </button>
              
              <div className="mt-auto pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setIsAuthenticated(false);
                    localStorage.removeItem('hero_admin_authenticated');
                  }}
                  className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider rounded-2xl border border-red-500/30 text-red-400 hover:text-white hover:bg-red-500/10 active:scale-[0.98] transition-all flex items-center gap-3 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>{language === 'ko' ? '관리자 로그아웃' : 'Admin Logout'}</span>
                </button>
              </div>
            </div>

            {/* Right Screen Area */}
            <div className="flex-1 min-h-0 bg-transparent flex flex-col">
              
              {/* Tab: User Management */}
              {activeTab === 'users' && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                  
                  {/* Left Column: Users List & Filters */}
                  <div className={`lg:col-span-1 bg-slate-900/60 border border-slate-800/80 p-4 rounded-3xl flex flex-col min-h-[400px] lg:min-h-0 backdrop-blur-sm shadow-md ${selectedUserId !== null ? 'hidden lg:flex' : 'flex'}`}>
                    
                    {/* Search query input */}
                    <div className="relative mb-3">
                      <input
                        type="text"
                        placeholder={language === 'ko' ? '닉네임/UID 검색...' : 'Search...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 p-2.5 pl-8 rounded-2xl text-xs font-semibold outline-none focus:border-indigo-500 text-slate-200"
                      />
                      <Search size={12} className="absolute left-3 top-3.5 text-white/30" />
                    </div>

                    {/* Filter checkboxes */}
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-4 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={filterRealUsers}
                        onChange={(e) => setFilterRealUsers(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{language === 'ko' ? '실제 사용자만' : 'Real Users Only'}</span>
                    </label>

                    {/* Scrollable list of users */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                      {isLoadingUsers ? (
                        <div className="text-center py-8" />
                      ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8" />
                      ) : (
                        filteredUsers.map(u => (
                          <button
                            key={u.uid}
                            onClick={() => handleSelectUser(u)}
                            className={`w-full p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all active:scale-[0.98] cursor-pointer ${
                              selectedUserId === u.uid
                                ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.15)] text-white'
                                : 'bg-slate-950/40 border-slate-900/60 hover:border-slate-800 text-slate-350'
                            }`}
                          >
                            <span className="text-xs font-bold text-white truncate">
                              {u.displayName || 'Unnamed User'}
                            </span>
                            <span className="text-[8px] text-white/40 font-mono truncate">
                              {u.uid}
                            </span>
                            <div className="flex items-center gap-3 mt-1 text-[8px] text-white/50 font-bold">
                              <span className="text-yellow-450 font-semibold">🪙 {u.sns ?? 1000} SNS</span>
                              <span>⚔️ {u.totalPower ?? 0} TP</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: selected User Resource Editor */}
                  <div className={`lg:col-span-2 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl flex flex-col min-h-0 overflow-y-auto custom-scrollbar backdrop-blur-sm shadow-md ${selectedUserId === null ? 'hidden lg:flex' : 'flex'}`}>
                    {selectedUserData ? (
                      <div className="space-y-6">
                        {/* Mobile back to list button */}
                        <button
                          onClick={() => {
                            setSelectedUserId(null);
                            setSelectedUserData(null);
                          }}
                          className="lg:hidden bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all w-full cursor-pointer border border-slate-800 mb-4"
                        >
                          ← {language === 'ko' ? '목록으로' : 'Back to List'}
                        </button>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                          <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">
                              {selectedUserData.displayName || 'Unnamed User'}
                            </h2>
                          </div>
                          
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={handleSimulateUser}
                              className="flex-1 sm:flex-none bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 border border-transparent rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase shadow-md shadow-indigo-500/10 cursor-pointer"
                            >
                              <Play size={10} fill="currentColor" />
                              <span>{language === 'ko' ? '시뮬레이션' : 'SIM'}</span>
                            </button>
                            <button
                              onClick={handleSaveUserData}
                              disabled={isSaving}
                              className="flex-1 sm:flex-none bg-emerald-650 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 border border-transparent rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase shadow-md shadow-emerald-500/10 cursor-pointer"
                            >
                              <Save size={10} />
                              <span>{isSaving ? '...' : (language === 'ko' ? '저장' : 'SAVE')}</span>
                            </button>
                          </div>
                        </div>

                        {/* Quick God Macros */}
                        <div className="bg-slate-950/40 p-4 border border-slate-800/60 rounded-2xl shadow-inner">
                          <div className="flex flex-wrap gap-2">
                            <button 
                              onClick={handleMaxAllCards}
                              className="bg-indigo-650/15 border border-indigo-500/40 text-indigo-300 font-bold text-[9px] px-3.5 py-1.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all uppercase active:scale-95 cursor-pointer"
                            >
                              MAX ALL CARDS
                            </button>
                            <button 
                              onClick={handleUnlockAllCards}
                              className="bg-purple-650/15 border border-purple-500/40 text-purple-300 font-bold text-[9px] px-3.5 py-1.5 rounded-xl hover:bg-purple-650 hover:text-white transition-all uppercase active:scale-95 cursor-pointer"
                            >
                              UNLOCK ALL CARDS (99x)
                            </button>
                            <button 
                              onClick={handleResetAllCards}
                              className={`border font-bold text-[9px] px-3.5 py-1.5 rounded-xl transition-all uppercase active:scale-95 cursor-pointer ${
                                isConfirmingReset 
                                  ? 'bg-orange-655/20 border-orange-500/40 text-orange-300 hover:bg-orange-500 hover:text-white' 
                                  : 'bg-rose-650/15 border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white'
                              }`}
                            >
                              {isConfirmingReset ? 'CONFIRM RESET?' : 'RESET ALL DATA'}
                            </button>
                          </div>
                        </div>

                        {/* General Form Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Left: General Settings */}
                          <div className="bg-slate-950/20 border border-slate-800/60 p-4 rounded-2xl space-y-4 shadow-sm">
                            <div>
                                <input
                                  type="text"
                                  placeholder="NICKNAME"
                                  value={selectedUserData.displayName || ''}
                                  onChange={(e) => handleUpdateField('displayName', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs font-semibold text-white outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <input
                                  type="number"
                                  placeholder="SNS COINS"
                                  value={selectedUserData.sns ?? 1000}
                                  onChange={(e) => handleUpdateField('sns', parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs font-bold text-yellow-450 outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <input
                                  type="number"
                                  placeholder="TOTAL TP POWER"
                                  value={selectedUserData.totalPower ?? 0}
                                  onChange={(e) => handleUpdateField('totalPower', parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                          </div>

                          {/* Right: Stats Record */}
                          <div className="bg-slate-950/20 border border-slate-800/60 p-4 rounded-2xl space-y-4 shadow-sm">
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <input
                                  type="number"
                                  placeholder="WINS"
                                  value={selectedUserData.stats?.wins ?? 0}
                                  onChange={(e) => handleUpdateStatsField('wins', parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 text-xs font-bold text-emerald-450 outline-none focus:border-indigo-500 transition-colors"
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  placeholder="LOSSES"
                                  value={selectedUserData.stats?.losses ?? 0}
                                  onChange={(e) => handleUpdateStatsField('losses', parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 text-xs font-bold text-rose-450 outline-none focus:border-indigo-500 transition-colors"
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  placeholder="DRAWS"
                                  value={selectedUserData.stats?.draws ?? 0}
                                  onChange={(e) => handleUpdateStatsField('draws', parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 text-xs font-bold text-slate-400 outline-none focus:border-indigo-500 transition-colors"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <input
                                  type="number"
                                  placeholder="STREAK"
                                  value={selectedUserData.stats?.winStreak ?? 0}
                                  onChange={(e) => handleUpdateStatsField('winStreak', parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  placeholder="MAX STREAK"
                                  value={selectedUserData.stats?.longestWinStreak ?? 0}
                                  onChange={(e) => handleUpdateStatsField('longestWinStreak', parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <input
                                  type="number"
                                  placeholder="COMP_LV"
                                  value={selectedUserData.stats?.companionLevel ?? 1}
                                  onChange={(e) => handleUpdateStatsField('companionLevel', parseInt(e.target.value) || 1)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-1.5 text-xs font-bold text-indigo-400 outline-none focus:border-indigo-500 transition-colors"
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  placeholder="HUNGER"
                                  value={selectedUserData.stats?.companionHunger ?? 100}
                                  onChange={(e) => handleUpdateStatsField('companionHunger', parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-1.5 text-xs font-bold text-emerald-400 outline-none focus:border-indigo-500 transition-colors"
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  placeholder="HAPPNESS"
                                  value={selectedUserData.stats?.companionHappiness ?? 100}
                                  onChange={(e) => handleUpdateStatsField('companionHappiness', parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-1.5 text-xs font-bold text-pink-400 outline-none focus:border-indigo-500 transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Deck Editor */}
                        <div className="bg-slate-950/20 border border-slate-800/60 p-4 rounded-2xl shadow-sm">
                          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                            {Array.from({ length: 5 }).map((_, idx) => {
                              const card = (selectedUserData.currentDeck || [])[idx];
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedDeckSlot(idx)}
                                  className={`relative w-20 h-28 border flex items-center justify-center font-bold bg-slate-950 rounded-2xl overflow-hidden active:scale-98 transition-all cursor-pointer ${
                                    selectedDeckSlot === idx ? 'border-yellow-450 ring-2 ring-yellow-450/30 scale-105 shadow-xl' : 'border-slate-850 hover:border-slate-700'
                                  }`}
                                >
                                  {card ? (
                                    <CardItem card={card} className="w-full h-full pointer-events-none scale-105" language={language} lowSpecMode={true} />
                                  ) : (
                                    <span className="opacity-30 text-[9px] uppercase font-bold text-slate-400">Slot {idx + 1}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Deck Card Picker overlay */}
                          {selectedDeckSlot !== null && (
                            <div className="mt-4 bg-slate-950 border border-slate-850 p-4 rounded-2xl">
                              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                {allDbCards.map(dbId => {
                                  const dbCard = CARD_DATABASE[dbId];
                                  if (!dbCard) return null;
                                  const tempCard: CardData = {
                                    id: `temp-${dbId}`,
                                    title: dbCard.title,
                                    title_en: dbCard.title_en,
                                    title_dis: dbCard.title_dis,
                                    stats: [...dbCard.stats] as [number, number, number, number],
                                    rarity: dbCard.rarity || 'bronze',
                                    level: 1,
                                    imageIndex: dbId,
                                    owner: null
                                  };
                                  return (
                                    <button
                                      key={dbId}
                                      onClick={() => handleCardSelectForDeck(dbId)}
                                      className="aspect-[5/7] border border-slate-850 hover:border-yellow-455 relative group overflow-hidden bg-slate-950 rounded-xl cursor-pointer transition-all"
                                    >
                                      <CardItem card={tempCard} className="w-full h-full pointer-events-none scale-105" language={language} lowSpecMode={true} />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/20 select-none border border-dashed border-slate-800 rounded-3xl bg-slate-950/20">
                        <Users size={48} className="opacity-10 mb-4 text-indigo-500" />
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Tab: Simulation Kernel */}
              {activeTab === 'simulation' && (
                <TestingDashboard
                  language={language}
                  onNavigate={onNavigate}
                  setIsAutoBattle={setIsAutoBattle}
                  isAutoBattle={isAutoBattle}
                  isSimulationActive={isSimulationActive}
                  setIsSimulationActive={setIsSimulationActive}
                  isAutoLoop={isAutoLoop}
                  setIsAutoLoop={setIsAutoLoop}
                  lastTestReport={lastTestReport}
                  setLastTestReport={setLastTestReport}
                  errorHistory={errorHistory}
                  setErrorHistory={setErrorHistory}
                />
              )}

              {/* Tab: Live Statistics */}
              {activeTab === 'status' && (
                <div className="bg-slate-900/90 border border-slate-800 text-white p-6 rounded-3xl overflow-hidden shadow-2xl">
                  <StatusView 
                    language={language} 
                    onNavigate={onNavigate} 
                    currentSeason={currentSeason}
                    lowSpecMode={lowSpecMode}
                  />
                </div>
              )}

              {/* Tab: Goods Purchases Dashboard */}
              {activeTab === 'purchases' && (
                <div className="flex-1 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl flex flex-col min-h-0 text-white overflow-hidden backdrop-blur-sm shadow-md">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight uppercase">
                        {t('admin_purchases_title', language)}
                      </h2>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto custom-scrollbar border border-slate-800 rounded-2xl bg-zinc-950/20">
                    {purchasesList.length === 0 ? (
                      <div className="text-center py-20" />
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                        <tbody className="divide-y divide-slate-850 font-semibold">
                          {purchasesList.map((p, idx) => {
                            const dateStr = new Date(p.timestamp).toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            });

                            return (
                              <tr key={p.id || idx} className="hover:bg-slate-900/40 text-slate-300">
                                <td className="p-4 text-[10px] text-white/40 font-mono">{dateStr}</td>
                                <td className="p-4">
                                  <div className="truncate max-w-[120px]" title={p.email}>
                                    {p.buyerName}
                                    <span className="block text-[8px] text-white/40 font-mono">{p.email}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-yellow-450 uppercase tracking-wider font-bold">{p.itemName} (x{p.quantity})</td>
                                <td className="p-4 text-green-400 font-bold font-mono">{p.price}</td>
                                <td className="p-4 text-indigo-400">
                                  <div className="truncate max-w-[120px]" title={p.cardName}>
                                    {p.cardName}
                                    <span className="block text-[8px] text-white/40 font-mono">ID: {p.cardId}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-white/80 max-w-[180px] truncate" title={p.shippingAddress}>
                                  {p.shippingAddress}
                                  <span className="block text-[8px] text-white/40 uppercase font-bold">[{p.country}]</span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                    p.paymentMethod === 'coin' ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-400' :
                                    p.paymentMethod === 'test' ? 'bg-red-950/60 border-red-500/40 text-red-400' :
                                    'bg-green-950/60 border-green-500/40 text-green-400'
                                  }`}>
                                    {p.paymentMethod}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Content Calendar */}
              {activeTab === 'calendar' && (
                <ContentCalendarPanel
                  language={language}
                  currentSeason={currentSeason}
                  lowSpecMode={lowSpecMode}
                />
              )}

              {/* Tab: Scale-up Gates */}
              {activeTab === 'gates' && (
                <ScaleupGateBoard
                  language={language}
                  lowSpecMode={lowSpecMode}
                />
              )}

              {/* Tab: Analytics KPI Dashboard */}
              {activeTab === 'analytics' && (
                <AdminAnalyticsDashboard language={language} />
              )}

            </div>

          </div>
        )}
      </div>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-[209] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowHelp(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10 text-white"
            >
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} className="text-slate-400" />
              </button>
              <h3 className="text-lg font-extrabold text-white mb-4 pr-8">
                {slides[helpStep].title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {slides[helpStep].content}
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setHelpStep(Math.max(0, helpStep - 1))}
                  disabled={helpStep === 0}
                  className="p-2 rounded-full border border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  {helpStep + 1} / {slides.length}
                </span>
                <button
                  onClick={() => setHelpStep(Math.min(slides.length - 1, helpStep + 1))}
                  disabled={helpStep === slides.length - 1}
                  className="p-2 rounded-full border border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
