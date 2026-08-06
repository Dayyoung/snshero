import React, { useState, useEffect } from 'react';
import { Volume2, LogOut, Terminal, Activity, Sliders, BarChart2, User, Play, Loader2, Database, AlertTriangle, CheckCircle2, CloudOff, Info, ArrowRight, Save, X, MessageSquare, Send, Sword, HelpCircle, Palette, Eye, ExternalLink, Copy, ShieldAlert, ChevronLeft, ChevronRight, FileSpreadsheet, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { t, LANGUAGES } from '../lib/i18n';
import { cn, sanitizeForFirestore } from '../lib/utils';
import { PageHeader } from '../components/PageHeader';
import { PageSubHeader } from '../components/PageSubHeader';
import { Brain, Shield, Zap, Target, Globe, AlertCircle, Cpu } from 'lucide-react';
import { TranslatedText } from '../components/TranslatedText';
import { runSimulation } from '../lib/simulation';
import { compressImage } from '../lib/imageProcessor';
import { ViewType, AiStrategy, AiDifficulty, Language } from '../types';
import { db, databaseId, currentDbMode } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, initializeApp } from '../lib/firebaseMock';
import { BGM_TRACKS } from '../lib/audioConstants';
import { useGameSettings } from '../contexts/GameSettingsContext';
import { CardThumbnailDebugGrid } from '../components/CardThumbnailDebugGrid';
import { OFFICIAL_COMMUNITY_CHANNELS, getChannelIcon, getChannelPurposeKey, getChannelClickCount, recordChannelClick, isChannelAvailable } from '../content/communityChannels';
import { getCardSkinThemePromptCount } from '../content/cardSkinThemes';
import type { LocalAiCapabilityStatus } from '../lib/localAi';
import { usePerformanceMode } from '../hooks/usePerformanceMode';
import { BackupRestoreModal } from '../components/BackupRestoreModal';
import { GoogleSheetsSyncModal } from '../components/GoogleSheetsSyncModal';

interface SettingViewProps {
  bgmEnabled: boolean;
  setBgmEnabled: (val: boolean) => void;
  bgmVolume: number;
  setBgmVolume: (val: number) => void;
  bgmTrackId: string;
  setBgmTrackId: (id: string) => void;
  sfxEnabled: boolean;
  setSfxEnabled: (val: boolean) => void;
  sfxVolume: number;
  setSfxVolume: (val: number) => void;
  playSfx: (url: string) => void;
  user: any | null;
  onLogout: () => void;
  aiStrategy: AiStrategy;
  setAiStrategy: (strategy: AiStrategy) => void;
  botAiStrategy: AiStrategy;
  setBotAiStrategy: (strategy: AiStrategy) => void;
  aiDifficulty: AiDifficulty;
  setAiDifficulty: (difficulty: AiDifficulty) => void;
  customCardImage: string | null;
  setCustomCardImage: (img: string | null) => void;
  isAutoBattle: boolean;
  setIsAutoBattle: (val: boolean) => void;
  recommendMode: boolean;
  setRecommendMode: (val: boolean) => void;
  offlineMode?: boolean;
  setOfflineMode?: (val: boolean) => void;
  onNavigate: (view: any) => void;
  onStartTutorial: () => void;
  currentSeason: string;
  setCurrentSeason: (season: string) => void;
  testMode?: boolean;
  localAiStatus?: LocalAiCapabilityStatus;
}

export const SettingView: React.FC<SettingViewProps> = ({ 
  bgmEnabled, 
  setBgmEnabled, 
  bgmVolume,
  setBgmVolume,
  bgmTrackId,
  setBgmTrackId,
  sfxEnabled, 
  setSfxEnabled, 
  sfxVolume,
  setSfxVolume,
  playSfx, 
  user,
  onLogout,
  aiStrategy,
  setAiStrategy,
  botAiStrategy,
  setBotAiStrategy,
  aiDifficulty,
  setAiDifficulty,
  customCardImage,
  setCustomCardImage,
  isAutoBattle,
  setIsAutoBattle,
  recommendMode,
  setRecommendMode,
  offlineMode,
  setOfflineMode,
  onNavigate,
  onStartTutorial,
  currentSeason,
  setCurrentSeason,
  testMode = false,
  localAiStatus
}) => {
  const { language, setLanguage, lowSpecMode, setLowSpecMode, theme, setTheme, cardSkinTheme, setCardSkinTheme } = useGameSettings();
  const perf = usePerformanceMode();
  const [simResults, setSimResults] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [targetSeason, setTargetSeason] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'bug_report' | 'improvement' | 'refund_request'>('refund_request');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [systemNotice, setSystemNotice] = useState<string | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [backupRestoreMode, setBackupRestoreMode] = useState<'backup' | 'restore' | null>(null);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelp) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelp]);

  const [helpSlide, setHelpSlide] = useState(0);
  const [channelClickCounts, setChannelClickCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(OFFICIAL_COMMUNITY_CHANNELS.map((channel) => [channel.id, getChannelClickCount(channel.id)]))
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncAdminAuth = () => {
      setIsAdminAuthenticated(localStorage.getItem('hero_admin_authenticated') === 'true');
    };

    syncAdminAuth();
    window.addEventListener('storage', syncAdminAuth);

    return () => {
      window.removeEventListener('storage', syncAdminAuth);
    };
  }, []);

  const canAccessThumbnailDiagnostics = testMode || isAdminAuthenticated;

  const pushChannelFeedback = (message: string) => {
    setSystemNotice(message);
    window.setTimeout(() => {
      setSystemNotice((current) => (current === message ? null : current));
    }, 1800);
  };

  const markChannelClick = (channelId: string) => {
    recordChannelClick(channelId);
    setChannelClickCounts((prev) => ({
      ...prev,
      [channelId]: getChannelClickCount(channelId),
    }));
  };

  const handleOpenChannel = (channel: (typeof OFFICIAL_COMMUNITY_CHANNELS)[number]) => {
    if (!isChannelAvailable(channel) || !channel.url) return;
    markChannelClick(channel.id);
    window.open(channel.url, '_blank', 'noopener,noreferrer');
    pushChannelFeedback(t('official_channels_click_tracked', language));
  };

  const handleCopyChannelLink = async (channel: (typeof OFFICIAL_COMMUNITY_CHANNELS)[number]) => {
    if (!isChannelAvailable(channel) || !channel.url || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(channel.url);
      markChannelClick(channel.id);
      pushChannelFeedback(t('official_channels_copied', language));
    } catch {
      pushChannelFeedback(t('official_channels_notice', language));
    }
  };

  const handleDbModeChange = (mode: 'local' | 'production') => {
    if (mode === currentDbMode) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    localStorage.setItem('firebase_db_mode', mode);
    setSystemNotice(t('db_mode_change_notice', language));
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim()) return;
    setIsSubmittingFeedback(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    try {
      // Sync Feedback to Firestore
      await addDoc(collection(db, 'feedback'), sanitizeForFirestore({
        type: feedbackType,
        content: feedbackContent,
        userId: user?.uid || 'guest',
        displayName: user?.displayName || 'Guest',
        createdAt: serverTimestamp(),
        localTime: new Date().toISOString()
      }));

      // Also send to 'chats' collection so Admin can see it in real-time
      await addDoc(collection(db, 'chats'), sanitizeForFirestore({
        id: `feedback-${Date.now()}`,
        userId: user?.uid || 'guest',
        name: `[FEEDBACK] ${user?.displayName || 'Guest'}`,
        text: `[${feedbackType}] ${feedbackContent}`,
        createdAt: new Date().toISOString(),
        isBot: false,
        isFeedback: true,
        language: language,
        serverTime: serverTimestamp()
      }));
      
      setFeedbackSuccess(true);
      setFeedbackContent('');
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (error: any) {
      console.error('Feedback Error:', error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Supabase check removed
  useEffect(() => {
    // Standalone mode: no remote check
  }, []);

  const handleSimulate = async () => {
    setIsSimulating(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    
    setTimeout(() => {
      const results = [
        runSimulation(aiStrategy, 'balanced', 200),
        runSimulation(aiStrategy, 'aggressive', 200),
        runSimulation(aiStrategy, 'defensive', 200),
      ];
      setSimResults(results);
      setIsSimulating(false);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }, 1500);
  };

  const strategies = [
    {
      id: 'auto' as AiStrategy,
      name: t('strategy_auto', language),
      desc: t('strategy_auto_desc', language),
      stats: `${t('strategy_win_rate_expect', language)}: ${language === 'ko' ? '가변적(최적화)' : 'Variable (Optimized)'}`,
      icon: Cpu,
      color: 'bg-yellow-500',
      pros: t('strategy_auto_pros', language),
      cons: t('strategy_auto_cons', language)
    },
    {
      id: 'balanced' as AiStrategy,
      name: t('strategy_balanced', language),
      desc: t('strategy_balanced_desc', language),
      stats: `${t('strategy_win_rate_expect', language)}: 50%`,
      icon: Brain,
      color: 'bg-blue-500',
      pros: t('strategy_balanced_pros', language),
      cons: t('strategy_balanced_cons', language)
    },
    {
      id: 'aggressive' as AiStrategy,
      name: t('strategy_aggressive', language),
      desc: t('strategy_aggressive_desc', language),
      stats: `${t('strategy_win_rate_expect', language)}: 45~55%`,
      icon: Zap,
      color: 'bg-red-500',
      pros: t('strategy_aggressive_pros', language),
      cons: t('strategy_aggressive_cons', language)
    },
    {
      id: 'defensive' as AiStrategy,
      name: t('strategy_defensive', language),
      desc: t('strategy_defensive_desc', language),
      stats: `${t('strategy_win_rate_expect', language)}: 52%`,
      icon: Shield,
      color: 'bg-green-500',
      pros: t('strategy_defensive_pros', language),
      cons: t('strategy_defensive_cons', language)
    },
    {
      id: 'random' as AiStrategy,
      name: t('strategy_random', language),
      desc: t('strategy_random_desc', language),
      stats: `${t('strategy_win_rate_expect', language)}: ???`,
      icon: AlertCircle,
      color: 'bg-purple-500',
      pros: t('strategy_random_pros', language),
      cons: t('strategy_random_cons', language)
    }
  ];

  const localAiStateLabel = (() => {
    switch (localAiStatus?.state) {
      case 'ready':
        return t('local_ai_status_ready', language);
      case 'downloadable':
        return t('local_ai_status_downloadable', language);
      case 'downloading':
        return t('local_ai_status_downloading', language);
      case 'error':
        return t('local_ai_status_error', language);
      default:
        return t('local_ai_status_unavailable', language);
    }
  })();

  const localAiStatusTone = localAiStatus?.state === 'ready'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : localAiStatus?.state === 'downloadable' || localAiStatus?.state === 'downloading'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-slate-200 bg-slate-100 text-slate-600';

  return (
    <div id="settings-panel" className="p-4 sm:p-6 md:p-8 pb-32 flex flex-col gap-6 max-w-4xl mx-auto min-h-screen bg-slate-50/50 text-slate-800 font-sans">
      <PageHeader title={t('setting', language)}
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
        badge={t('setting', language)}
        title={t('setting', language)}
        description=""
        actionButton={
          <button
            onClick={onStartTutorial}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-sm transition-all hover:border-white/30 hover:bg-white/20 active:scale-95 touch-target"
            title={t('menu_tutorial', language)}
            aria-label={t('menu_tutorial', language)}
          >
            <HelpCircle size={16} className="shrink-0" />
          </button>
        }
      />

      <AnimatePresence>
        {systemNotice && (
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            className="border border-amber-200 bg-amber-50 text-amber-900 rounded-lg p-4 text-xs font-bold leading-relaxed shadow-sm"
          >
            {systemNotice}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">

        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <Sliders size={18} className="opacity-40" />
             <h3 className="text-sm font-bold tracking-normal text-slate-800">{t('setting', language)}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-0 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm divide-y divide-slate-100">
            <div className="bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Volume2 size={24} className={cn("transition-opacity text-slate-700", bgmEnabled ? "opacity-100" : "opacity-20")} />
                  <div>
                    <p className="font-bold text-sm tracking-tight uppercase text-slate-800">{t('bgm', language)}</p>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">{t('ambient_protocol', language)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setBgmEnabled(!bgmEnabled);
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className={cn(
                    "min-w-[44px] min-h-[44px] w-12 h-6 rounded-full transition-all relative flex items-center p-0.5",
                    bgmEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full transition-all transform bg-white shadow-sm",
                    bgmEnabled ? 'translate-x-6' : 'translate-x-0'
                  )} />
                </button>
              </div>
              
              {bgmEnabled && (
                <div className="pt-2 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest opacity-40">
                      <span>{language === 'ko' ? '볼륨' : 'VOLUME'}</span>
                      <span>{Math.round(bgmVolume * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={bgmVolume} 
                      onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* BGM Track Selector */}
                  <div className="pt-4 border-t border-dashed border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t('bgm_track_select', language)}</p>
                        <p className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase">{t('bgm_track_desc', language)}</p>
                      </div>
                    </div>
                    {(() => {
                      const currentTrack = BGM_TRACKS.find(t => t.id === bgmTrackId) || BGM_TRACKS[0];
                      const handleCycleBgm = () => {
                        const currentIndex = BGM_TRACKS.findIndex(t => t.id === bgmTrackId);
                        const nextIndex = (currentIndex + 1) % BGM_TRACKS.length;
                        setBgmTrackId(BGM_TRACKS[nextIndex].id);
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                      };
                      return (
                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-slate-50">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex flex-col">
                              <span className="font-bold text-xs uppercase tracking-tight text-slate-800">
                                {currentTrack.name[language] || currentTrack.name['en'] || currentTrack.name['ko']}
                              </span>
                              <span className="mt-1 text-[8px] font-semibold opacity-40">
                                BY {currentTrack.author.toUpperCase()}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleCycleBgm}
                              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] touch-target"
                            >
                              {t('change', language)}
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Activity size={24} className={cn("transition-opacity text-slate-700", sfxEnabled ? "opacity-100" : "opacity-20")} />
                  <div>
                    <p className="font-bold text-sm tracking-tight uppercase text-slate-800">{t('sfx', language)}</p>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">{t('tactical_notification', language)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSfxEnabled(!sfxEnabled);
                    if (!sfxEnabled) {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    }
                  }}
                  className={cn(
                    "min-w-[44px] min-h-[44px] w-12 h-6 rounded-full transition-all relative flex items-center p-0.5",
                    sfxEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full transition-all transform bg-white shadow-sm",
                    sfxEnabled ? 'translate-x-6' : 'translate-x-0'
                  )} />
                </button>
              </div>

              {sfxEnabled && (
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest opacity-40">
                    <span>{language === 'ko' ? '볼륨' : 'VOLUME'}</span>
                    <span>{Math.round(sfxVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={sfxVolume} 
                    onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              )}
            </div>

            <div className="bg-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Cpu size={24} className={cn("transition-opacity text-slate-700", lowSpecMode ? "opacity-100" : "opacity-20")} />
                <div>
                  <p className="font-bold text-sm tracking-tight uppercase text-slate-800">{t('low_spec_mode', language)}</p>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">{t('visual_performance_protocol', language)}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setLowSpecMode(!lowSpecMode);
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                }}
                className={cn(
                  "min-w-[44px] min-h-[44px] w-12 h-6 rounded-full transition-all relative flex items-center p-0.5",
                  lowSpecMode ? 'bg-indigo-600' : 'bg-slate-200'
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full transition-all transform bg-white shadow-sm",
                  lowSpecMode ? 'translate-x-6' : 'translate-x-0'
                )} />
              </button>
            </div>
            
            {lowSpecMode && (
              <div className="bg-amber-50/90 p-5 border-t border-slate-100 space-y-3">
                <div className="flex items-start gap-2">
                  <Zap size={14} className="mt-0.5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-amber-900 leading-relaxed uppercase tracking-widest">
                      {t('low_spec_mode_desc', language)}
                    </p>
                    <ul className="mt-2 space-y-1.5 text-[9px] font-semibold text-amber-800/80 leading-relaxed list-disc pl-4">
                      <li>{language === 'ko' ? '애니메이션 비활성화 (카드 플립, 호버, 펄스)' : 'Disables animations (card flip, hover, pulse)'}</li>
                      <li>{language === 'ko' ? '그라디언트 → 단색 전환' : 'Gradients → solid colors'}</li>
                      <li>{language === 'ko' ? '저해상도 이미지 우선 로딩' : 'Prioritizes low-res image fallbacks'}</li>
                      <li>{language === 'ko' ? '게임 로그 최대 10개 제한' : 'Limits game logs to 10 entries'}</li>
                      <li>{language === 'ko' ? '미니게임 프레임 간격 조정 (~20fps)' : 'Throttles minigame frame loop (~20fps)'}</li>
                      <li>{language === 'ko' ? '파티클/블러/그림자 효과 제거' : 'Removes particles, blurs, and shadow effects'}</li>
                      <li>{language === 'ko' ? 'hover 스케일 효과 비활성화' : 'Disables card hover scaling'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Brain size={24} className={cn("transition-opacity text-slate-700", recommendMode ? "opacity-100" : "opacity-20")} />
                <div>
                  <p className="font-bold text-sm tracking-tight uppercase text-slate-800">{t('recommend_mode', language)}</p>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">{t('recommend_mode_desc', language)}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setRecommendMode(!recommendMode);
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                }}
                className={cn(
                  "min-w-[44px] min-h-[44px] w-12 h-6 rounded-full transition-all relative flex items-center p-0.5",
                  recommendMode ? 'bg-indigo-600' : 'bg-slate-200'
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full transition-all transform bg-white shadow-sm",
                  recommendMode ? 'translate-x-6' : 'translate-x-0'
                )} />
              </button>
            </div>

            <div className="bg-white p-6 flex items-center justify-between border-t border-slate-50">
              <div className="flex items-center gap-4">
                <Cpu size={24} className={cn("transition-opacity text-slate-700", isAutoBattle ? "opacity-100" : "opacity-20")} />
                <div>
                  <p className="font-bold text-sm tracking-tight uppercase text-slate-800">{t('auto_battle', language)}</p>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">{t('auto_battle_sys_running', language)}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsAutoBattle(!isAutoBattle);
                  localStorage.setItem('hero_auto_battle_setting', JSON.stringify(!isAutoBattle));
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                }}
                className={cn(
                  "min-w-[44px] min-h-[44px] w-12 h-6 rounded-full transition-all relative flex items-center p-0.5",
                  isAutoBattle ? 'bg-indigo-600' : 'bg-slate-200'
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full transition-all transform bg-white shadow-sm",
                  isAutoBattle ? 'translate-x-6' : 'translate-x-0'
                )} />
              </button>
            </div>

            <div className="bg-white p-6 border-t border-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Palette size={24} className="text-slate-700" />
                  <div>
                    <p className="font-bold text-sm tracking-tight uppercase text-slate-800">{t('design_theme', language)}</p>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">{t('theme_desc', language)}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setTheme('light');
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className={cn(
                    "flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl border transition-all cursor-pointer",
                    theme === 'light'
                      ? "bg-slate-900 border-slate-900 text-white shadow-md"
                      : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-650"
                  )}
                >
                  {t('theme_light', language)}
                </button>
                <button
                  onClick={() => {
                    setTheme('dark');
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className={cn(
                    "flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl border transition-all cursor-pointer",
                    theme === 'dark'
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                      : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-650"
                  )}
                >
                  {t('theme_dark', language)}
                </button>
                <button
                  onClick={() => {
                    setTheme('metal');
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className={cn(
                    "flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl border transition-all cursor-pointer",
                    theme === 'metal'
                      ? "bg-gradient-to-br from-slate-500 to-slate-600 border-slate-400 text-white shadow-[0_0_15px_rgba(100,100,120,0.4)]"
                      : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-650"
                  )}
                >
                  ⚙️ {language === 'ko' ? '메탈' : 'Metal'}
                </button>
              </div>
            </div>
          </div>
        </section>



        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <Brain size={18} className="opacity-40" />
             <h3 className="text-sm font-bold tracking-normal text-slate-800">{t('ai_difficulty', language)}</h3>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-lg">
            {(['easy', 'medium', 'hard'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => {
                  setAiDifficulty(diff);
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                }}
                className={cn(
                  "flex-1 py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all font-bold uppercase tracking-widest text-[10px] rounded-md active:scale-95",
                  aiDifficulty === diff 
                    ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                    : "bg-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                {t(`difficulty_${diff}` as any, language)}
              </button>
            ))}
          </div>
          <div className="bg-slate-900 text-white p-4 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-start gap-2 shadow-sm">
            <Info size={14} className="shrink-0 mt-0.5 animate-pulse" />
            <p className="leading-relaxed text-slate-200">
              {t(`difficulty_${aiDifficulty}_desc` as any, language)}
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <Target size={18} className="opacity-40" />
             <h3 className="text-sm font-bold tracking-normal text-slate-800">{t('auto_battle_tactics', language)}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {strategies.map((strat) => {
              const Icon = strat.icon;
              const isSelected = aiStrategy === strat.id;

              return (
                <button
                  key={strat.id}
                  onClick={() => {
                    setAiStrategy(strat.id);
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className={cn(
                    "border p-5 sm:p-6 rounded-lg text-left transition-all relative flex flex-col gap-4 group",
                    isSelected 
                      ? "border-slate-900 bg-white shadow-md" 
                      : "border-slate-200 bg-white/60 text-slate-500 hover:border-slate-350 hover:bg-white"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 border rounded-lg text-slate-800 transition-colors", isSelected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white")}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className={cn("font-bold text-lg uppercase tracking-tighter transition-colors", isSelected ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700")}>{strat.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {isSelected && (
                            <div className="bg-indigo-600 text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest leading-none rounded-md shadow-xs">
                              ACTIVE
                            </div>
                          )}
                          <div className={cn("px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border rounded-md leading-none transition-colors",
                             isSelected ? "border-slate-900 text-slate-900 bg-slate-50" : "border-slate-200 text-slate-400"
                          )}>
                            {strat.stats}
                          </div>
                        </div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="text-indigo-650" size={24} />}
                  </div>

                  <div className={cn("space-y-4 pt-2 transition-all w-full", isSelected ? "opacity-100 block" : "opacity-0 hidden")}>
                    <p className="text-xs leading-relaxed font-bold border-l-2 border-indigo-600 pl-3 mt-2 text-slate-700">
                      {strat.desc}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1 border-b border-slate-200 pb-1 text-slate-400">
                           {t('pros', language)}
                        </p>
                        <p className="text-[10px] font-semibold leading-relaxed font-sans text-slate-650">{strat.pros}</p>
                      </div>
                      <div className="p-4 border border-slate-200 rounded-lg bg-white text-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1 border-b border-slate-200 pb-1 text-slate-400">
                           {t('cons', language)}
                        </p>
                        <p className="text-[10px] font-semibold leading-relaxed font-sans text-slate-650">{strat.cons}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
           <div className="flex items-center gap-4">
              <Activity size={18} className="opacity-40" />
               <h3 className="text-sm font-bold tracking-normal text-slate-800">{t('strategy_simulation', language)}</h3>
           </div>
           
           <button 
             onClick={() => {
               setIsSimModalOpen(true);
               playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
             }}
             className="w-full border border-slate-200 p-6 rounded-3xl text-left transition-all relative flex items-center justify-between group bg-slate-50 hover:bg-slate-900 hover:text-white active:scale-99 shadow-xs"
           >
              <div className="flex items-center gap-4">
                <div className="p-2 border border-slate-200 bg-white text-slate-700 rounded-2xl group-hover:bg-slate-800 group-hover:border-slate-700 group-hover:text-white transition-colors">
                  <BarChart2 size={24} />
                </div>
                <div>
                   <p className="font-bold text-lg uppercase tracking-tighter text-slate-800 group-hover:text-white">{language === 'ko' ? '매트릭스 연산 테스트' : 'MATRIX COMPUTATION'}</p>
                   <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest text-slate-400 group-hover:text-white/60">{language === 'ko' ? '승률 시뮬레이션 열기' : 'OPEN_WINRATE_SIMULATOR'}</p>
                </div>
              </div>
              <div className="border border-slate-200 bg-white text-slate-700 p-2 rounded-xl group-hover:bg-white group-hover:border-white transition-transform">
                  <Play size={16} className="ml-0.5" />
              </div>
           </button>
        </section>

        {/* Language Selection */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <Globe className="opacity-40" size={18} />
            <h3 className="text-sm font-bold tracking-normal text-slate-800">{t('language', language)}</h3>
          </div>

          <div className="relative border border-slate-200 rounded-2xl bg-white group overflow-hidden shadow-xs">
            <select 
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as Language);
                playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
              }}
              className="w-full p-4 pr-12 bg-transparent text-sm font-bold tracking-widest uppercase cursor-pointer focus:outline-none appearance-none"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-black">
                  {lang.name.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:translate-x-1 bg-slate-900 text-white p-1.5 rounded-xl shadow-xs">
              <ArrowRight size={14} />
            </div>
          </div>
          <p className="text-sm opacity-40 font-bold tracking-normal italic pt-2">
            * {t('google_translate_notice', language)}
          </p>
        </section>

        {/* Season Selection */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <Database className="opacity-40" size={18} />
            <h3 className="text-sm font-bold tracking-normal text-slate-800">{t('select_season', language)}</h3>
          </div>

          <div className="relative border border-slate-200 rounded-2xl bg-white group overflow-hidden shadow-xs">
            <select 
              value={currentSeason}
              onChange={(e) => {
                const season = e.target.value as 'season1' | 'season2';
                if (currentSeason === season) return;
                playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                setTargetSeason(season);
                setIsSeasonModalOpen(true);
              }}
              className="w-full p-4 pr-12 bg-transparent text-sm font-bold tracking-widest uppercase cursor-pointer focus:outline-none appearance-none"
            >
              {(['season1', 'season2'] as const).map((season) => (
                <option 
                  key={season} 
                  value={season} 
                  className="text-black font-mono"
                  disabled={season === 'season2'}
                >
                  {t(season as any, language).toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:translate-x-1 bg-slate-900 text-white p-1.5 rounded-xl shadow-xs">
              <ArrowRight size={14} />
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <MessageSquare size={18} className="opacity-40" />
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">{t('feedback_section_title', language)}</h3>
          </div>

          <div className="border border-slate-200 rounded-3xl p-6 bg-white space-y-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 py-1.5 px-3 bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase tracking-widest rounded-bl-xl border-l border-b border-indigo-100">
              USER_INPUT
            </div>

            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest pt-2 w-3/4 text-slate-500">
               {t('feedback_desc', language)}
            </p>

            <div className="space-y-6">
               <div>
                  <div className="flex gap-2">
                     {(['refund_request', 'bug_report', 'improvement'] as const).map(type => (
                       <button
                         key={type}
                         onClick={() => setFeedbackType(type)}
                         className={cn(
                           "flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-widest border transition-all rounded-xl",
                           feedbackType === type 
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                            : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-350 hover:text-slate-700"
                         )}
                       >
                         {t(type as any, language)}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 transition-all bg-white">
                  <div className="bg-slate-900 text-white px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase">CONTENT_DATA</div>
                  <textarea
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    placeholder={t('feedback_content_placeholder', language)}
                    className="w-full h-32 p-4 bg-transparent focus:outline-none text-sm resize-none"
                  />
               </div>

               <button
                 disabled={isSubmittingFeedback || !feedbackContent.trim()}
                 onClick={handleSubmitFeedback}
                 className={cn(
                   "w-full py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest border transition-all rounded-2xl active:scale-[0.98] shadow-sm",
                   isSubmittingFeedback || !feedbackContent.trim()
                     ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                     : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                 )}
               >
                 {isSubmittingFeedback ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                 {t('feedback_submit', language)}
               </button>

               {feedbackSuccess && (
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg flex items-center justify-center gap-2"
                 >
                   <CheckCircle2 size={14} />
                   {t('feedback_success', language)}
                 </motion.div>
               )}
            </div>
          </div>
        </section>



        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-4 mb-2">
             <Play size={18} className="opacity-40" />
             <h3 className="text-sm font-bold tracking-normal uppercase text-slate-800">{language === 'ko' ? '가이드 및 튜토리얼' : 'GUIDE & TUTORIAL'}</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => {
                playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                onStartTutorial();
              }}
              className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-400 to-orange-500 border border-transparent rounded-3xl shadow-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-slate-900/10 p-2 rounded-xl">
                  <Sword size={20} className="text-slate-900 group-hover:rotate-12 transition-transform" />
                </div>
                <div className="text-left text-slate-900">
                  <p className="text-[9px] font-bold uppercase text-slate-900/60 tracking-widest leading-none">Training</p>
                  <span className="font-bold text-sm uppercase tracking-tight">
                    {language === "ko" ? "튜토리얼" : "TUTORIAL"}
                  </span>
                </div>
              </div>
              <span className="text-xl animate-bounce">⚔️</span>
            </button>

            <button
              onClick={() => {
                playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                onNavigate("wiki");
              }}
              className="flex items-center justify-between p-5 bg-gradient-to-r from-cyan-500 to-indigo-600 border border-transparent rounded-3xl shadow-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-xl">
                  <HelpCircle size={20} className="text-white group-hover:rotate-12 transition-transform" />
                </div>
                <div className="text-left text-white">
                  <p className="text-[9px] font-bold uppercase text-white/60 tracking-widest leading-none">Wiki</p>
                  <span className="font-bold text-sm uppercase tracking-tight">
                    {language === "ko" ? "게임 방법" : "HOW TO PLAY"}
                  </span>
                </div>
              </div>
              <span className="text-xl animate-pulse">📚</span>
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <Terminal size={18} className="opacity-40" />
             <h3 className="text-sm font-bold tracking-normal uppercase text-slate-800">{t('auth_management', language)}</h3>
          </div>
          {user ? (
            <button 
              onClick={onLogout}
              className="w-full border border-slate-200 rounded-2xl bg-white text-slate-800 py-4 font-bold tracking-widest uppercase hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-between px-6 group active:scale-[0.98] shadow-sm"
            >
              <div className="flex items-center gap-3">
                <LogOut size={16} />
                <span>{t('logout', language)} (SIGN OUT)</span>
              </div>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <div className="border border-dashed border-slate-350 rounded-3xl p-6 text-left bg-slate-50/50 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-slate-200/40 rounded-2xl">
               <User size={24} className="opacity-40" />
              </div>
              <div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{language === 'ko' ? '현재 비인증 모드입니다.' : 'PRESENTLY IN GUEST_MODE.'}</p>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mt-1">{language === 'ko' ? '데이터가 클라우드에 백업되지 않습니다.' : 'DATA_NOT_BACKED_UP_TO_CLOUD.'}</p>
              </div>
            </div>
          )}

          </section>



          {/* ─── Silhouette Debug (testMode/admin only) ─── */}
          {canAccessThumbnailDiagnostics && (
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <Eye size={18} className="opacity-40" />
                <h3 className="text-sm font-bold tracking-normal text-slate-800">
                  {language === 'ko' ? '썸네일 실루엣 진단' : 'THUMBNAIL SILHOUETTE DIAGNOSTICS'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsDebugOpen(!isDebugOpen);
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                }}
                className={cn(
                  'w-full border p-6 rounded-3xl text-left transition-all relative flex items-center justify-between group shadow-xs',
                  isDebugOpen
                    ? 'bg-slate-900 text-white border-slate-800'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-900 hover:text-white',
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-2 border rounded-2xl transition-colors',
                    isDebugOpen
                      ? 'border-slate-700 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-700 group-hover:bg-slate-800 group-hover:border-slate-700 group-hover:text-white',
                  )}>
                    <Eye size={24} />
                  </div>
                  <div>
                    <p className={cn(
                      'font-bold text-lg uppercase tracking-tighter',
                      isDebugOpen ? 'text-white' : 'text-slate-800 group-hover:text-white',
                    )}>
                      {t('thumbnail_diagnostics_title', language)}
                    </p>
                    <p className={cn(
                      'text-[10px] font-bold opacity-60 uppercase tracking-widest',
                      isDebugOpen ? 'text-white/60' : 'text-slate-400 group-hover:text-white/60',
                    )}>
                      {t('thumbnail_diagnostics_desc', language)}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  'border rounded-xl p-2 transition-transform',
                  isDebugOpen
                    ? 'border-slate-700 bg-slate-800 text-white'
                    : 'border-slate-200 bg-white text-slate-700 group-hover:bg-white group-hover:border-white',
                )}>
                  <Eye size={16} />
                </div>
              </button>

              {isDebugOpen && (
                <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <Eye size={12} />
                    <span>{t('thumbnail_diagnostics_mode', language)}</span>
                    <span className="ml-auto text-[8px] opacity-60">
                      {t('thumbnail_diagnostics_hidden', language)}
                    </span>
                  </div>
                  <div className="p-4">
                    <CardThumbnailDebugGrid
                      language={language}
                      lowSpecMode={lowSpecMode}
                    />
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                      {t('thumbnail_diagnostics_note', language)}
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}



        {/* ─── Policy & Trust Center (doc/29) ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <ShieldAlert size={18} className="opacity-40" />
            <h3 className="text-sm font-bold tracking-normal text-slate-800">{t('policy_center_title', language)}</h3>
          </div>

          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              onNavigate('policy-center');
            }}
            className="w-full border border-slate-200 rounded-2xl bg-white text-slate-800 py-4 font-bold tracking-widest uppercase hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-between px-6 group active:scale-[0.98] shadow-sm"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert size={16} />
              <span>{t('policy_center_subtitle', language)}</span>
            </div>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </section>

        {/* ─── Account Data Backup & Restore (Bottom) ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <Database size={18} className="opacity-40" />
            <h3 className="text-sm font-bold tracking-normal uppercase text-slate-800">
              {language === 'ko' ? '계정 데이터 백업 / 복원' : 'ACCOUNT DATA BACKUP & RESTORE'}
            </h3>
          </div>

          <div className="border border-slate-200 rounded-3xl p-6 bg-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Database size={24} className="text-slate-700" />
                <div>
                  <p className="font-bold text-sm tracking-tight uppercase text-slate-800">
                    {t('backup_data', language)} / {t('restore_data', language)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
                    Save Data Backup (QR) & Camera Restore (Scan)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                  setBackupRestoreMode('backup');
                }}
                className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-mono text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-sm"
              >
                [+] {t('backup_data', language)} (QR코드)
              </button>
              <button
                type="button"
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                  setBackupRestoreMode('restore');
                }}
                className="flex-1 py-3 px-4 bg-emerald-700 text-white rounded-xl font-mono text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-sm"
              >
                [+] {t('restore_data', language)} (카메라 스캔)
              </button>
            </div>
          </div>
        </section>

          </div>

          <footer className="pt-20 text-center">
        <p className="text-sm font-bold tracking-[0.6em] opacity-10">{t('system_version', language)} SNS_HERO_KERNAL v1.0.5.Build</p>
      </footer>

      <AnimatePresence>
        {isSimModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsSimModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-650 text-white rounded-xl shadow-md shadow-indigo-500/10"><BarChart2 size={20} /></div>
                   <h3 className="font-bold uppercase tracking-tight text-lg text-slate-800">{t('strategy_simulation', language)}</h3>
                </div>
                <button 
                  onClick={() => setIsSimModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-6">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4 text-center">
                    <div>
                       <p className="font-bold text-sm uppercase text-slate-800">{language === 'ko' ? '엔진 상태' : 'ENGINE STATUS'}: {isSimulating ? 'COMPUTING...' : 'READY'}</p>
                       <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">200 ITERATIONS PER CONTEXT</p>
                    </div>
                    <button 
                      onClick={handleSimulate}
                      disabled={isSimulating}
                      className={cn(
                        "py-3.5 rounded-2xl font-bold uppercase tracking-wider text-sm transition-all active:scale-95 flex items-center justify-center gap-2",
                        isSimulating 
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                          : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/10"
                      )}
                    >
                      {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                      {isSimulating ? t('computing', language) : t('start_test', language)}
                    </button>
                 </div>

                 {simResults.length > 0 && (
                   <div className="space-y-4">
                      {simResults.map((res, i) => (
                        <div key={i} className="border border-slate-100 rounded-3xl p-5 bg-white shadow-md flex flex-col gap-3">
                           <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                              <div className="flex items-center gap-2">
                                 <span className={cn("text-[9px] font-bold px-2 py-0.5 text-white rounded-lg uppercase", 
                                    aiStrategy === 'aggressive' ? "bg-red-500" :
                                    aiStrategy === 'defensive' ? "bg-emerald-500" : "bg-indigo-650"
                                 )}>A: {aiStrategy}</span>
                                <span className="text-[10px] font-bold text-slate-300">VS</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg uppercase border border-slate-200/60">B: {res.stratB}</span>
                              </div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">200 MATCH_DATA</p>
                           </div>
                           
                           <div className="space-y-2.5">
                              <div className="h-2.5 bg-slate-100 flex rounded-full overflow-hidden">
                                 <div 
                                    className="bg-indigo-650 transition-all duration-1000" 
                                    style={{ width: `${(res.winsA / res.total) * 100}%` }} 
                                 />
                                 <div 
                                    className="bg-slate-300 transition-all duration-1000" 
                                    style={{ width: `${(res.draws / res.total) * 100}%` }} 
                                 />
                                 <div 
                                    className="bg-rose-500 transition-all duration-1000" 
                                    style={{ width: `${(res.winsB / res.total) * 100}%` }} 
                                 />
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                 <div className="text-indigo-600 flex flex-col">
                                    <span className="text-slate-400 text-[8px] uppercase tracking-wider">Wins A</span>
                                    {Math.round((res.winsA / res.total) * 100)}%
                                 </div>
                                 <div className="text-slate-400 flex flex-col items-center">
                                    <span className="text-slate-400 text-[8px] uppercase tracking-wider">{t('draws', language)}</span>
                                    {Math.round((res.draws / res.total) * 100)}%
                                 </div>
                                 <div className="text-rose-500 flex flex-col items-end">
                                    <span className="text-slate-400 text-[8px] uppercase tracking-wider">Wins B</span>
                                    {Math.round((res.winsB / res.total) * 100)}%
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                      <div className="text-center space-y-1 pt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
                          {language === 'ko' ? '* 무작위 덱 합성 시뮬레이션 결과입니다.' : '* RESULTS_BASED_ON_RANDOM_SYNTHESIS_MODEL'}
                        </p>
                      </div>
                   </div>
                 )}
              </div>
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setIsSimModalOpen(false)}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all"
                >
                  {t('close', language) || 'CLOSE_ENGINE'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isSeasonModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl text-center space-y-6 select-none relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-orange-500/10">
                <AlertTriangle size={28} className="text-white animate-bounce" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold uppercase leading-none text-slate-800">{t('select_season', language)}</h3>
                <p className="text-sm font-semibold text-slate-500 leading-tight">
                  {t('season_change_notice', language)}
                </p>
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-left">
                  <p className="text-[10px] font-bold text-slate-500 leading-normal">
                    {language === 'ko' 
                      ? '시즌 데이터를 변경하면 이전 시즌의 게임 정보는 그대로 보존되며, 새로운 시즌 정보가 로드됩니다.'
                      : 'Changing seasons preserves your progress in the previous season and loads the selected season\'s data.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    if (targetSeason) {
                      localStorage.setItem('hero_current_season', targetSeason);
                    }
                    setIsSeasonModalOpen(false);
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    window.location.reload();
                  }}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-bold uppercase tracking-wider text-xs hover:bg-slate-850 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  {t('yes_accept', language) || 'YES'}
                </button>
                <button
                  onClick={() => {
                    setIsSeasonModalOpen(false);
                    setTargetSeason(null);
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className="flex-1 bg-white text-slate-850 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs border border-slate-200 active:scale-95 transition-all hover:bg-slate-50 cursor-pointer shadow-xs"
                >
                  {language === 'ko' ? '취소' : 'CANCEL'}
                </button>
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
                <h3 className="font-bold text-sm text-slate-800">{t('setting', language)}</h3>
              </div>
              <div className="min-h-[120px] flex flex-col justify-center text-sm text-slate-600 leading-relaxed space-y-2 mb-4">
                {helpSlide === 0 && (
                  <p>{language === 'ko' ? '설정 화면에서는 BGM/SFX 음량, 저사양 모드, 추천 모드, 자동 전투 등 게임 환경을 조절할 수 있습니다. 언어와 테마(라이트/다크/메탈)도 변경 가능합니다.' : 'Configure BGM/SFX volume, low-spec mode, recommend mode, auto-battle, and more. Change language and theme (Light/Dark/Metal).'}</p>
                )}
                {helpSlide === 1 && (
                  <p>{language === 'ko' ? 'AI 난이도와 자동 전투 전술(자동/균형/공격적/방어적/무작위)을 선택할 수 있습니다. 전략 시뮬레이션으로 승률을 테스트해보세요.' : 'Choose AI difficulty and auto-battle strategy (Auto/Balanced/Aggressive/Defensive/Random). Test win rates with the strategy simulator.'}</p>
                )}
                {helpSlide === 2 && (
                  <p>{language === 'ko' ? '피드백을 제출하거나 데이터베이스 모드를 전환할 수 있습니다. 공식 커뮤니티 채널, 튜토리얼, 위키, 정책 센터로 이동할 수 있는 바로가기도 제공됩니다.' : 'Submit feedback, switch database modes, and access official community channels, tutorials, wiki, and policy center.'}</p>
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

      <BackupRestoreModal
        mode={backupRestoreMode}
        onClose={() => setBackupRestoreMode(null)}
        lang={language}
      />

      <GoogleSheetsSyncModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        language={language}
        season={currentSeason}
      />
    </div>
  );
};
