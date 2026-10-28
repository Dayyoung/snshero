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
import { getCardSkinThemePromptCount } from '../content/cardSkinThemes';
import type { LocalAiCapabilityStatus } from '../lib/localAi';
import { usePerformanceMode } from '../hooks/usePerformanceMode';
import { BackupRestoreModal } from '../components/BackupRestoreModal';
import { GoogleSheetsSyncModal } from '../components/GoogleSheetsSyncModal';
import { BgmJukeboxModal } from '../components/BgmJukeboxModal';
import { triggerHaptic } from '../lib/haptic';
import { checkAndSyncAppVersion, getLocalAppVersion, forcePurgeAndReload } from '../lib/versionManager';
import { resetAllCaches } from '../lib/cacheManager';
import { Smartphone, Music, RefreshCw, CheckCircle, ShieldCheck, SlidersHorizontal, CalendarCheck, Flame, Gift, ShoppingCart, Award, Sparkles, Bell } from 'lucide-react';
import { HapticVibrationSettingsModal } from '../components/HapticVibrationSettingsModal';
import { DailyMissions } from '../components/DailyMissions';
import { loadDailyMissions, getClaimableCount } from '../lib/dailyMissions';
import { StaminaPacingManager } from '../lib/staminaPacingManager';
import { WebPushService, type DevicePushStatus } from '../lib/webPushService';
import { IosPwaInstallGuideModal } from '../components/IosPwaInstallGuideModal';
import { useSns } from '../contexts/SnsContext';
import { PwaRewardService } from '../lib/pwaRewardService';
import { createAuxWebMcpTools, useWebMcpTools } from '../lib/webMcp/index';

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
  const { addSns } = useSns();
  const { language, setLanguage, lowSpecMode, setLowSpecMode, theme, setTheme, cardSkinTheme, setCardSkinTheme, cardDisplayMode, setCardDisplayMode, targetFps, setTargetFps, batterySaver, setBatterySaver, hapticEnabled, setHapticEnabled } = useGameSettings();
  const [isJukeboxOpen, setIsJukeboxOpen] = useState(false);
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
  const [appCurrentVersion, setAppCurrentVersion] = useState<string>(() => getLocalAppVersion() || '2.1.0');
  const [isHapticModalOpen, setIsHapticModalOpen] = useState(false);
  const [isCheckingVersion, setIsCheckingVersion] = useState(false);
  const [versionCheckMsg, setVersionCheckMsg] = useState<string | null>(null);

  // ─── 웹푸시 상태 및 모달 관리 ───
  const [pushStatus, setPushStatus] = useState<DevicePushStatus>(() => WebPushService.getDeviceStatus());
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const [pushRegisterNotice, setPushRegisterNotice] = useState<string | null>(null);
  const [isIosPwaGuideOpen, setIsIosPwaGuideOpen] = useState(false);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);

  useEffect(() => {
    setPushStatus(WebPushService.getDeviceStatus());
  }, []);

  // WebMCP Screen Tools: Auxiliary Screens (Companion, Skills, SeasonHub, Settings)
  const auxWebMcpTools = React.useMemo(() => {
    return createAuxWebMcpTools({
      onNavigate: (view) => {
        if (onNavigate) onNavigate(view);
      },
      updateSns: (amount, reason) => {
        addSns(amount, reason);
      }
    });
  }, [addSns, onNavigate]);

  useWebMcpTools(auxWebMcpTools);

  const handleRequestWebPush = async () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    const curStatus = WebPushService.getDeviceStatus();

    // iOS인데 PWA가 아닌 경우: PWA 설치 안내 모달 표시
    if (curStatus.needsIosPwaInstall) {
      setIsIosPwaGuideOpen(true);
      return;
    }

    setIsRegisteringPush(true);
    setPushRegisterNotice(null);
    try {
      const res = await WebPushService.registerWebPush(user?.displayName || undefined);
      if (res.success) {
        const bonusClaimed = PwaRewardService.claimPushReward(addSns);
        const bonusMsg = bonusClaimed 
          ? (language === 'ko' ? ' (+100 SNS 이벤트 보너스 지급 완료!)' : ' (+100 SNS bonus claimed!)')
          : '';
        setPushRegisterNotice(language === 'ko'
          ? `✓ 웹푸시 등록 성공! 구글 시트에 토큰이 안전하게 저장되었습니다.${bonusMsg}`
          : `✓ Web push registered! Token safely saved to Google Sheets.${bonusMsg}`);
      } else if (res.reason === 'ios_pwa_required') {
        setIsIosPwaGuideOpen(true);
      } else {
        setPushRegisterNotice(res.message || (language === 'ko' ? '웹푸시 등록 실패' : 'Failed to register'));
      }
    } catch (e: any) {
      setPushRegisterNotice(e.message || (language === 'ko' ? '등록 중 오류 발생' : 'Error occurred'));
    } finally {
      setIsRegisteringPush(false);
      setPushStatus(WebPushService.getDeviceStatus());
    }
  };

  const handleSendTestPush = async () => {
    setIsSendingTestPush(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    try {
      await WebPushService.sendTestPushToSelf();
      setPushRegisterNotice(language === 'ko' ? '🔔 테스트 알림이 발송되었습니다.' : '🔔 Test alert dispatched.');
    } finally {
      setTimeout(() => setIsSendingTestPush(false), 800);
    }
  };

  // SCR-12-01: 3대 통합 서브 탭 ('system' | 'missions' | 'attendance')
  const [activeSubTab, setActiveSubTab] = useState<'system' | 'missions' | 'attendance'>('system');

  // SCR-12-01: 일일 미션 데이터 상태
  const [dailyMissionsData, setDailyMissionsData] = useState(() => loadDailyMissions());
  const claimableMissionCount = getClaimableCount();

  // SCR-12-03: 7일 출석 스트릭 상태 관리
  const ATTENDANCE_STORAGE_KEY = 'hero_attendance_streak_v1';
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [attendanceData, setAttendanceData] = useState<{
    lastCheckDate: string;
    currentStreak: number;
    streakSaverUsedThisMonth: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      lastCheckDate: '',
      currentStreak: 1,
      streakSaverUsedThisMonth: false,
    };
  });

  const isCheckedAttendanceToday = attendanceData.lastCheckDate === todayDateStr;

  const handleClaimDailyAttendance = () => {
    if (isCheckedAttendanceToday) return;
    triggerHaptic('victory');
    const nextStreak = attendanceData.currentStreak >= 7 ? 1 : attendanceData.currentStreak + 1;
    const streakPoints = [50, 60, 70, 80, 90, 100, 150];
    const rewardSns = streakPoints[Math.min(6, (attendanceData.currentStreak - 1) % 7)] || 50;

    const nextState = {
      ...attendanceData,
      lastCheckDate: todayDateStr,
      currentStreak: nextStreak,
    };
    setAttendanceData(nextState);
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(nextState));

    // SNS 포인트 지급
    const curSns = parseInt(localStorage.getItem('hero_sns') || '500', 10);
    localStorage.setItem('hero_sns', String(curSns + rewardSns));
    window.dispatchEvent(new Event('hero_sns_updated'));

    setSystemNotice(
      language === 'ko'
        ? `🎉 [7일 출석 체크 완료] 연속 ${attendanceData.currentStreak}일차 보상 +${rewardSns} SNS가 지급되었습니다!`
        : `🎉 [Attendance Checked] Day ${attendanceData.currentStreak} Streak! Claimed +${rewardSns} SNS!`
    );
  };

  // AP 에너지 소모량 상태
  const [burnedAp, setBurnedAp] = useState(() => {
    try {
      return StaminaPacingManager.getInstance().getState().dailyApBurned || 0;
    } catch {
      return 0;
    }
  });


  const handleCheckVersion = async () => {
    setIsCheckingVersion(true);
    setVersionCheckMsg(language === 'ko' ? '[...] 서버 최신 버전 확인 중...' : '[...] Checking latest version...');
    try {
      const result = await checkAndSyncAppVersion();
      setAppCurrentVersion(result.newVersion);
      if (result.isUpdated) {
        setVersionCheckMsg(
          language === 'ko'
            ? `[업데이트 완료] 최신 버전 v${result.newVersion} 감지! 캐시 ${result.clearedItemsCount}개 초기화 완료.`
            : `[UPDATED] New version v${result.newVersion} detected! Purged ${result.clearedItemsCount} stale caches.`
        );
      } else {
        setVersionCheckMsg(
          language === 'ko'
            ? `[최신 상태] 현재 최신 버전(v${result.newVersion})을 사용 중입니다.`
            : `[UP-TO-DATE] Already on the latest version (v${result.newVersion}).`
        );
      }
    } catch {
      setVersionCheckMsg(
        language === 'ko'
          ? '[오류] 버전 확인 실패. 오프라인 모드 유지.'
          : '[ERROR] Version check failed. Preserving offline cache.'
      );
    } finally {
      setIsCheckingVersion(false);
    }
  };

  const [isPurgingCache, setIsPurgingCache] = useState(false);
  const [cachePurgeSuccess, setCachePurgeSuccess] = useState(false);

  const handlePurgeAllCaches = async () => {
    if (isPurgingCache) return;
    setIsPurgingCache(true);
    triggerHaptic('medium');
    try {
      const res = resetAllCaches();
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch (err) {
          console.warn('Cache Storage delete error:', err);
        }
      }
      try {
        sessionStorage.clear();
      } catch {}

      setCachePurgeSuccess(true);
      setVersionCheckMsg(
        language === 'ko'
          ? `[초기화 완료] 브라우저 리소스 캐시 정리 완료 (${res.clearedCount}개 삭제됨).`
          : `[PURGED] Successfully cleared resource cache (${res.clearedCount} items).`
      );
      setTimeout(() => {
        setCachePurgeSuccess(false);
        setIsPurgingCache(false);
      }, 2500);
    } catch (e) {
      console.error('Cache purge failed:', e);
      setIsPurgingCache(false);
    }
  };
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelp) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelp]);

  const [helpSlide, setHelpSlide] = useState(0);

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

  const handleDbModeChange = (mode: 'local' | 'production') => {
    if (mode === currentDbMode) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    localStorage.setItem('hero_firebase_db_mode', mode);
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

  // Viral Challenge Share State
  const [viralSharedToday, setViralSharedToday] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hero_setting_viral_share_${todayDateStr}`) === 'true';
    } catch {
      return false;
    }
  });

  const handleShareSettingChallenge = () => {
    triggerHaptic('tap');
    const shareUrl = 'https://snshero.com/?challenge=1-11-31-51-101&ref=setting';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    const shareKey = `hero_setting_viral_share_${todayDateStr}`;
    let alreadyShared = false;
    try {
      alreadyShared = localStorage.getItem(shareKey) === 'true';
    } catch {}

    if (!alreadyShared) {
      try {
        localStorage.setItem(shareKey, 'true');
        const cur = parseInt(localStorage.getItem('hero_sns') || '500', 10);
        localStorage.setItem('hero_sns', String(cur + 50));
        window.dispatchEvent(new Event('hero_sns_updated'));
      } catch {}
      setViralSharedToday(true);
      triggerHaptic('victory');
      setSystemNotice(language === 'ko' ? '도전장 링크 복사 완료! 일일 보너스 +50 SNS가 지급되었습니다.' : 'Challenge Link Copied! Claimed +50 SNS bonus.');
      setTimeout(() => setSystemNotice(null), 3000);
    } else {
      setSystemNotice(language === 'ko' ? '도전장 링크가 클립보드에 복사되었습니다.' : 'Challenge Link Copied to clipboard.');
      setTimeout(() => setSystemNotice(null), 2500);
    }
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  return (
    <div id="settings-panel" className="p-4 sm:p-6 md:p-8 pb-32 flex flex-col gap-6 max-w-4xl mx-auto min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono">
      <PageHeader title={t('setting', language)}
        rightAction={
          <button
            onClick={() => { setShowHelp(true); setHelpSlide(0); playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3'); }}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f8f7f7] transition-colors cursor-pointer"
            title="Help"
            aria-label="Help"
          >
            <HelpCircle size={16} />
          </button>
        }
      />



      {/* SCR-12-01: 상단 일일 보상 요약 HUD */}
      <section className="border border-[#201d1d]/12 bg-white p-4 font-mono">
        <div className="flex items-center justify-between border-b border-[#201d1d]/10 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-[#201d1d] uppercase tracking-wider">
              {language === 'ko' ? '[일일 보상 센터 & 스트릭 HUD]' : '[DAILY REWARD & STREAK HUD]'}
            </span>
          </div>
          <span className="text-[10px] text-[#201d1d]/60 font-bold">
            {language === 'ko' ? '매일 00:00 KST 초기화' : 'RESETS DAILY AT 00:00'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* 1. 출석 스트릭 */}
          <div className="border border-[#201d1d]/10 p-2.5 bg-[#fdfcfc] flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] text-[#201d1d]/60 font-bold flex items-center gap-1">
                <CalendarCheck size={12} className="text-indigo-600" />
                {language === 'ko' ? '7일 출석 스트릭' : '7-Day Streak'}
              </p>
              <p className="text-xs font-bold text-[#201d1d]">
                Day {attendanceData.currentStreak} / 7
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setActiveSubTab('attendance'); triggerHaptic('light'); }}
              className={cn(
                "min-h-[44px] px-3 py-1.5 text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center rounded-sm",
                isCheckedAttendanceToday
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-amber-500 bg-amber-50 text-amber-900 animate-pulse"
              )}
            >
              {isCheckedAttendanceToday
                ? (language === 'ko' ? '[✓ 출석 완료]' : '[✓ CHECKED]')
                : (language === 'ko' ? '[!] 오늘 출석하기' : '[!] CHECK-IN')}
            </button>
          </div>

          {/* 2. 일일 미션 수령 현황 */}
          <div className="border border-[#201d1d]/10 p-2.5 bg-[#fdfcfc] flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] text-[#201d1d]/60 font-bold flex items-center gap-1">
                <Gift size={12} className="text-emerald-600" />
                {language === 'ko' ? '일일 미션 보상' : 'Daily Missions'}
              </p>
              <p className="text-xs font-bold text-[#201d1d]">
                {claimableMissionCount > 0
                  ? (language === 'ko' ? `${claimableMissionCount}건 수령 대기!` : `${claimableMissionCount} CLAIMABLE!`)
                  : (language === 'ko' ? '미션 진행 중' : 'IN PROGRESS')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setActiveSubTab('missions'); triggerHaptic('light'); }}
              className={cn(
                "min-h-[44px] px-3 py-1.5 text-[10px] font-bold border transition-all cursor-pointer rounded-sm flex items-center justify-center",
                claimableMissionCount > 0
                  ? "border-rose-500 bg-rose-50 text-rose-700 font-bold"
                  : "border-[#201d1d]/20 bg-white text-[#201d1d]/70 hover:border-[#201d1d]"
              )}
            >
              {claimableMissionCount > 0
                ? (language === 'ko' ? '[보상 받기]' : '[CLAIM]')
                : (language === 'ko' ? '[미션 보기]' : '[VIEW]')}
            </button>
          </div>

          {/* 3. 당일 AP 소모 캐시백 */}
          <div className="border border-[#201d1d]/10 p-2.5 bg-[#fdfcfc] flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] text-[#201d1d]/60 font-bold flex items-center gap-1">
                <Zap size={12} className="text-amber-500" />
                {language === 'ko' ? '당일 AP 에너지' : 'Daily AP Burn'}
              </p>
              <p className="text-xs font-bold text-[#201d1d]">
                {burnedAp} / 150 AP
              </p>
            </div>
            <span className={cn(
              "px-2 py-1 text-[10px] font-bold border",
              burnedAp >= 150
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-[#201d1d]/20 bg-white text-[#201d1d]/60"
            )}>
              {burnedAp >= 150
                ? (language === 'ko' ? '[MAX 환급]' : '[MAX REBATE]')
                : `[${Math.min(100, Math.round((burnedAp / 150) * 100))}%]`}
            </span>
          </div>
        </div>
      </section>

      {/* SCR-12-01: 3대 통합 서브 탭바 */}
      <nav aria-label="Settings sub tabs" className="grid grid-cols-3 gap-1.5 border-b border-[#201d1d]/12 pb-3 font-mono">
        <button
          type="button"
          onClick={() => { setActiveSubTab('system'); triggerHaptic('light'); }}
          className={cn(
            "min-h-[44px] py-2 px-2 text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none",
            activeSubTab === 'system'
              ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
              : "bg-white text-[#201d1d] border-[#201d1d]/20 hover:border-[#201d1d] hover:bg-slate-50"
          )}
        >
          <Sliders size={14} />
          <span>{language === 'ko' ? '시스템 설정' : 'SYSTEM'}</span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveSubTab('missions'); triggerHaptic('light'); }}
          className={cn(
            "min-h-[44px] py-2 px-2 text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer relative select-none",
            activeSubTab === 'missions'
              ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
              : "bg-white text-[#201d1d] border-[#201d1d]/20 hover:border-[#201d1d] hover:bg-slate-50"
          )}
        >
          <Gift size={14} />
          <span>{language === 'ko' ? '일일 미션' : 'MISSIONS'}</span>
          {claimableMissionCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-xs">
              {claimableMissionCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => { setActiveSubTab('attendance'); triggerHaptic('light'); }}
          className={cn(
            "min-h-[44px] py-2 px-2 text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer relative select-none rounded-xs",
            activeSubTab === 'attendance'
              ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
              : "bg-white text-[#201d1d] border-[#201d1d]/20 hover:border-[#201d1d] hover:bg-slate-50"
          )}
        >
          <CalendarCheck size={14} />
          <span>{language === 'ko' ? '7일 출석' : 'STREAK'}</span>
          {!isCheckedAttendanceToday && (
            <span className="ml-0.5 w-2 h-2 rounded-xs bg-amber-500 animate-pulse" />
          )}
        </button>
      </nav>

      {/* TAB 1: 기존 시스템 설정 */}
      {activeSubTab === 'system' && (
        <div className="space-y-8">

        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <Sliders size={18} className="opacity-40" />
             <h3 className="text-sm font-bold tracking-normal text-slate-800">{t('setting', language)}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-0 border border-[rgba(15,0,0,0.12)] rounded-none overflow-hidden bg-white divide-y divide-[rgba(15,0,0,0.08)]">
            {/* 카드 표시 설정 (7등신 / 상반신 / 3등신) — 최상단 배치 */}
            <div className="bg-white p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                  <Sparkles size={24} className="text-slate-700" />
                  <div>
                    <p className="font-bold text-sm tracking-tight uppercase text-slate-800">
                      {language === 'ko' ? '카드 표시 설정 (7등신 / 상반신 / 3등신)' : 'Card Display Mode (7-Head / Bust / 3-Head)'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
                      {language === 'ko'
                        ? '카드 일러스트 비율 선택 · 최초 기본값: 3등신 (카드 클릭 상세 시 상반신 표시)'
                        : 'Select card character illustration mode · Default: 3-Head SD (Bust on card click)'}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border border-[#201d1d] bg-[#201d1d] text-amber-300 rounded-sm">
                  {cardDisplayMode === 'full7'
                    ? (language === 'ko' ? '7등신 적용중' : '7-HEAD')
                    : cardDisplayMode === 'bust'
                      ? (language === 'ko' ? '상반신 적용중' : 'BUST')
                      : (language === 'ko' ? '3등신 적용중' : '3-HEAD')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCardDisplayMode('full7');
                    triggerHaptic('light');
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className={cn(
                    "py-2.5 px-2 min-h-[48px] text-xs font-bold rounded-sm border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5",
                    cardDisplayMode === 'full7'
                      ? "bg-[#201d1d] border-[#201d1d] text-[#fdfcfc]"
                      : "bg-[#f8f7f7] border-[rgba(15,0,0,0.12)] text-[#201d1d] hover:bg-[#f1eeee]"
                  )}
                >
                  <span>{language === 'ko' ? '7등신' : '7-Head'}</span>
                  <span className={cn("text-[9px] font-semibold", cardDisplayMode === 'full7' ? "text-amber-300" : "text-slate-500")}>
                    {language === 'ko' ? '전신 원화' : 'Full Body'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCardDisplayMode('bust');
                    triggerHaptic('light');
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className={cn(
                    "py-2.5 px-2 min-h-[48px] text-xs font-bold rounded-sm border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5",
                    cardDisplayMode === 'bust'
                      ? "bg-[#201d1d] border-[#201d1d] text-[#fdfcfc]"
                      : "bg-[#f8f7f7] border-[rgba(15,0,0,0.12)] text-[#201d1d] hover:bg-[#f1eeee]"
                  )}
                >
                  <span>{language === 'ko' ? '상반신' : 'Upper Body'}</span>
                  <span className={cn("text-[9px] font-semibold", cardDisplayMode === 'bust' ? "text-amber-300" : "text-slate-500")}>
                    {language === 'ko' ? 'HEAD & HAIR' : 'HEAD & HAIR'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCardDisplayMode('chibi3');
                    triggerHaptic('light');
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className={cn(
                    "py-2.5 px-2 min-h-[48px] text-xs font-bold rounded-sm border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5",
                    cardDisplayMode === 'chibi3'
                      ? "bg-[#201d1d] border-[#201d1d] text-[#fdfcfc]"
                      : "bg-[#f8f7f7] border-[rgba(15,0,0,0.12)] text-[#201d1d] hover:bg-[#f1eeee]"
                  )}
                >
                  <span>{language === 'ko' ? '3등신' : '3-Head SD'}</span>
                  <span className={cn("text-[9px] font-semibold", cardDisplayMode === 'chibi3' ? "text-emerald-300" : "text-slate-500")}>
                    {language === 'ko' ? '⚡액션 연출 (기본)' : '⚡Action (Default)'}
                  </span>
                </button>
              </div>

              <div className="p-3 border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[10px] font-bold text-slate-600 flex items-center justify-between gap-2">
                <span>
                  {cardDisplayMode === 'full7' && (language === 'ko'
                    ? '• 7등신 전신 애니메이션 캐릭터 원화로 모든 카드가 표시되며, 카드 클릭(상세 보기) 시에는 상반신 원화로 표시됩니다.'
                    : '• Displays 7-head full-body anime character art on cards, and upper-body bust art when clicking a card.')}
                  {cardDisplayMode === 'bust' && (language === 'ko'
                    ? '• 캐릭터 시트 HEAD & HAIR 상반신 클로즈업 원화로 카드가 표시됩니다. (액션 연출은 3등신만 가능)'
                    : '• Displays HEAD & HAIR upper-body character portrait on all cards. (Action motion in 3-Head only)')}
                  {cardDisplayMode === 'chibi3' && (language === 'ko'
                    ? '• 기본 3등신 SD 캐릭터 및 역동적인 액션 연출로 표시되며, 카드 클릭(상세 보기) 시에는 상반신(HEAD & HAIR) 원화로 표시됩니다!'
                    : '• Displays 3-head SD characters with battle action motion, and upper-body bust art when clicking a card!')}
                </span>
              </div>
            </div>

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
                    "min-w-[44px] min-h-[44px] w-12 h-6 rounded-sm border transition-all relative flex items-center p-0.5 cursor-pointer",
                    bgmEnabled ? 'bg-[#201d1d] border-[#201d1d]' : 'bg-[#f8f7f7] border-[rgba(15,0,0,0.12)]'
                  )}
                  aria-label="Toggle BGM"
                >
                  <div className={cn(
                    "w-5 h-5 rounded-xs transition-all transform",
                    bgmEnabled ? 'translate-x-6 bg-[#fdfcfc]' : 'translate-x-0 bg-[#201d1d]'
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
                      className="w-full h-1 bg-slate-200 rounded-sm appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* BGM Track Selector & Jukebox */}
                  <div className="pt-4 border-t border-dashed border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t('bgm_track_select', language)}</p>
                        <p className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase">{t('bgm_track_desc', language)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsJukeboxOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-sm border border-indigo-600 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                      >
                        <Music size={12} />
                        {language === 'ko' ? '주크박스 열기' : 'Open Jukebox'}
                      </button>
                    </div>
                    {(() => {
                      const currentTrack = BGM_TRACKS.find(t => t.id === bgmTrackId) || BGM_TRACKS[0];
                      return (
                        <div className="w-full rounded-none border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-slate-50">
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
                              onClick={() => setIsJukeboxOpen(true)}
                              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm border border-[#201d1d] bg-[#201d1d] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfcfc] transition-all hover:bg-[#302c2c] active:scale-[0.98] touch-target"
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
                    "min-w-[44px] min-h-[44px] w-12 h-6 rounded-sm border transition-all relative flex items-center p-0.5 cursor-pointer",
                    sfxEnabled ? 'bg-[#201d1d] border-[#201d1d]' : 'bg-[#f8f7f7] border-[rgba(15,0,0,0.12)]'
                  )}
                  aria-label="Toggle SFX"
                >
                  <div className={cn(
                    "w-5 h-5 rounded-xs transition-all transform",
                    sfxEnabled ? 'translate-x-6 bg-[#fdfcfc]' : 'translate-x-0 bg-[#201d1d]'
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
                    className="w-full h-1 bg-slate-200 rounded-none appearance-none cursor-pointer accent-[#201d1d]"
                  />
                </div>
              )}
            </div>

            {/* Haptic Feedback Option (ID 65) */}
            <div className="bg-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Smartphone size={24} className={cn("transition-opacity text-slate-700", hapticEnabled ? "opacity-100" : "opacity-20")} />
                <div>
                  <p className="font-bold text-sm tracking-tight uppercase text-slate-800">
                    {language === 'ko' ? '모바일 햅틱 진동' : 'Haptic Feedback'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
                    {language === 'ko' ? '카드 뒤집기 및 전투 스킬 터치 진동 피드백' : 'Touch vibration response on battle actions'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHapticModalOpen(true)}
                  className="min-h-[44px] px-3 py-1 text-[11px] font-bold border border-[rgba(15,0,0,0.12)] rounded-sm hover:bg-[#f8f7f7] text-[#201d1d] active:scale-95 transition-all flex items-center justify-center"
                >
                  [강도 조절]
                </button>
                <button 
                  onClick={() => {
                    const next = !hapticEnabled;
                    setHapticEnabled(next);
                    if (next) triggerHaptic('medium');
                  }}
                  className={cn(
                    "min-w-[44px] min-h-[44px] w-12 h-6 rounded-sm border transition-all relative flex items-center p-0.5 cursor-pointer",
                    hapticEnabled ? 'bg-[#201d1d] border-[#201d1d]' : 'bg-[#f8f7f7] border-[rgba(15,0,0,0.12)]'
                  )}
                  aria-label="Toggle Haptic"
                >
                  <div className={cn(
                    "w-5 h-5 rounded-xs transition-all transform",
                    hapticEnabled ? 'translate-x-6 bg-[#fdfcfc]' : 'translate-x-0 bg-[#201d1d]'
                  )} />
                </button>
              </div>

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
                  "min-w-[44px] min-h-[44px] w-12 h-6 rounded-sm border transition-all relative flex items-center p-0.5 cursor-pointer",
                  lowSpecMode ? 'bg-[#201d1d] border-[#201d1d]' : 'bg-[#f8f7f7] border-[rgba(15,0,0,0.12)]'
                )}
                aria-label="Toggle Low Spec Mode"
              >
                <div className={cn(
                  "w-5 h-5 rounded-xs transition-all transform",
                  lowSpecMode ? 'translate-x-6 bg-[#fdfcfc]' : 'translate-x-0 bg-[#201d1d]'
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

            {/* Battery Saver & Frame Rate Settings (Item 37) */}
            <div className="bg-white p-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Activity size={24} className={cn("transition-opacity text-slate-700", batterySaver ? "opacity-100 text-emerald-600" : "opacity-30")} />
                <div>
                  <p className="font-bold text-sm tracking-tight uppercase text-slate-800">
                    {language === 'ko' ? '절전 모드 (Battery Saver)' : 'Battery Saver Mode'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
                    {language === 'ko' ? '발열 및 배터리 소모 감소' : 'Reduce Heat & Battery Consumption'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setBatterySaver(!batterySaver);
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                }}
                className={cn(
                  "min-w-[44px] min-h-[44px] w-12 h-6 rounded-sm border transition-all relative flex items-center p-0.5 cursor-pointer",
                  batterySaver ? 'bg-[#201d1d] border-[#201d1d]' : 'bg-[#f8f7f7] border-[rgba(15,0,0,0.12)]'
                )}
                aria-label="Toggle Battery Saver"
              >
                <div className={cn(
                  "w-5 h-5 rounded-xs transition-all transform",
                  batterySaver ? 'translate-x-6 bg-[#fdfcfc]' : 'translate-x-0 bg-[#201d1d]'
                )} />
              </button>
            </div>

            <div className="bg-white p-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BarChart2 size={24} className="text-slate-700 opacity-60" />
                <div>
                  <p className="font-bold text-sm tracking-tight uppercase text-slate-800">
                    {language === 'ko' ? '목표 프레임 (Frame Rate)' : 'Target Frame Rate'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
                    {targetFps === '60' 
                      ? (language === 'ko' ? '60 FPS (고성능 부드러운 연출)' : '60 FPS (Performance)')
                      : (language === 'ko' ? '30 FPS (절전 및 안정적 프레임)' : '30 FPS (Battery Saver)')
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 bg-[#f8f7f7] p-1 rounded-none border border-[rgba(15,0,0,0.12)]">
                <button
                  onClick={() => {
                    setTargetFps('60');
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className={cn(
                    "px-3 py-1.5 min-h-[44px] rounded-sm text-xs font-black uppercase transition-all flex items-center justify-center border",
                    targetFps === '60' ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]" : "text-[#646262] hover:text-[#201d1d] border-transparent"
                  )}
                >
                  60 FPS
                </button>
                <button
                  onClick={() => {
                    setTargetFps('30');
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className={cn(
                    "px-3 py-1.5 min-h-[44px] rounded-sm text-xs font-black uppercase transition-all flex items-center justify-center border",
                    targetFps === '30' ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]" : "text-[#646262] hover:text-[#201d1d] border-transparent"
                  )}
                >
                  30 FPS
                </button>
              </div>
            </div>

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
                  "min-w-[44px] min-h-[44px] w-12 h-6 rounded-sm border transition-all relative flex items-center p-0.5 cursor-pointer",
                  recommendMode ? 'bg-[#201d1d] border-[#201d1d]' : 'bg-[#f8f7f7] border-[rgba(15,0,0,0.12)]'
                )}
                aria-label="Toggle Recommend Mode"
              >
                <div className={cn(
                  "w-5 h-5 rounded-xs transition-all transform",
                  recommendMode ? 'translate-x-6 bg-[#fdfcfc]' : 'translate-x-0 bg-[#201d1d]'
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
                  "min-w-[44px] min-h-[44px] w-12 h-6 rounded-sm border transition-all relative flex items-center p-0.5 cursor-pointer",
                  isAutoBattle ? 'bg-[#201d1d] border-[#201d1d]' : 'bg-[#f8f7f7] border-[rgba(15,0,0,0.12)]'
                )}
                aria-label="Toggle Auto Battle"
              >
                <div className={cn(
                  "w-5 h-5 rounded-xs transition-all transform",
                  isAutoBattle ? 'translate-x-6 bg-[#fdfcfc]' : 'translate-x-0 bg-[#201d1d]'
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
                    "flex-1 py-2.5 min-h-[44px] text-xs sm:text-sm font-bold rounded-sm border transition-all cursor-pointer flex items-center justify-center",
                    theme === 'light'
                      ? "bg-[#201d1d] border-[#201d1d] text-[#fdfcfc]"
                      : "bg-[#f8f7f7] border-[rgba(15,0,0,0.12)] text-[#201d1d] hover:bg-[#f1eeee]"
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
                    "flex-1 py-2.5 min-h-[44px] text-xs sm:text-sm font-bold rounded-sm border transition-all cursor-pointer flex items-center justify-center",
                    theme === 'dark'
                      ? "bg-[#201d1d] border-[#201d1d] text-[#fdfcfc]"
                      : "bg-[#f8f7f7] border-[rgba(15,0,0,0.12)] text-[#201d1d] hover:bg-[#f1eeee]"
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
                    "flex-1 py-2.5 min-h-[44px] text-xs sm:text-sm font-bold rounded-sm border transition-all cursor-pointer flex items-center justify-center",
                    theme === 'metal'
                      ? "bg-[#201d1d] border-[#201d1d] text-[#fdfcfc]"
                      : "bg-[#f8f7f7] border-[rgba(15,0,0,0.12)] text-[#201d1d] hover:bg-[#f1eeee]"
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
          
          <div className="flex gap-2 p-1.5 bg-[#f8f7f7] rounded-none border border-[rgba(15,0,0,0.12)]">
            {(['easy', 'medium', 'hard'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => {
                  setAiDifficulty(diff);
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                }}
                className={cn(
                  "flex-1 py-3 px-2 min-h-[44px] flex flex-col items-center justify-center gap-1.5 transition-all font-bold uppercase tracking-widest text-[10px] rounded-sm active:scale-95 border",
                  aiDifficulty === diff 
                    ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
                    : "bg-transparent text-[#646262] border-transparent hover:text-[#201d1d]"
                )}
              >
                {t(`difficulty_${diff}` as any, language)}
              </button>
            ))}
          </div>
          <div className="bg-[#201d1d] text-[#fdfcfc] p-4 rounded-none border border-[#201d1d] text-[10px] font-bold uppercase tracking-widest flex items-start gap-2 font-mono">
            <Info size={14} className="shrink-0 mt-0.5 animate-pulse" />
            <p className="leading-relaxed text-[#fdfcfc]">
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
                    "border p-5 sm:p-6 rounded-none text-left transition-all relative flex flex-col gap-4 group",
                    isSelected 
                      ? "border-[#201d1d] bg-[#f8f7f7]" 
                      : "border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#646262] hover:border-[#201d1d]"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 border rounded-sm text-[#201d1d] transition-colors", isSelected ? "border-[#201d1d] bg-[#fdfcfc]" : "border-[rgba(15,0,0,0.12)] bg-[#f8f7f7]")}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className={cn("font-bold text-lg uppercase tracking-tighter transition-colors", isSelected ? "text-[#201d1d]" : "text-[#646262] group-hover:text-[#201d1d]")}>{strat.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {isSelected && (
                            <div className="bg-[#201d1d] text-[#fdfcfc] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest leading-none rounded-sm">
                              ACTIVE
                            </div>
                          )}
                          <div className={cn("px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border rounded-sm leading-none transition-colors",
                             isSelected ? "border-[#201d1d] text-[#201d1d] bg-[#fdfcfc]" : "border-[rgba(15,0,0,0.12)] text-[#646262]"
                          )}>
                            {strat.stats}
                          </div>
                        </div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="text-[#201d1d]" size={24} />}
                  </div>

                  <div className={cn("space-y-4 pt-2 transition-all w-full", isSelected ? "opacity-100 block" : "opacity-0 hidden")}>
                    <p className="text-xs leading-relaxed font-bold border-l-2 border-[#201d1d] pl-3 mt-2 text-[#201d1d]">
                      {strat.desc}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 border border-[rgba(15,0,0,0.12)] rounded-none bg-[#f8f7f7] text-[#201d1d]">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1 border-b border-[rgba(15,0,0,0.12)] pb-1 text-[#646262]">
                           {t('pros', language)}
                        </p>
                        <p className="text-[10px] font-semibold leading-relaxed font-mono text-[#201d1d]">{strat.pros}</p>
                      </div>
                      <div className="p-4 border border-[rgba(15,0,0,0.12)] rounded-none bg-[#fdfcfc] text-[#201d1d]">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1 border-b border-[rgba(15,0,0,0.12)] pb-1 text-[#646262]">
                           {t('cons', language)}
                        </p>
                        <p className="text-[10px] font-semibold leading-relaxed font-mono text-[#646262]">{strat.cons}</p>
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
             className="w-full border border-[rgba(15,0,0,0.12)] p-5 rounded-none text-left transition-all relative flex items-center justify-between group bg-[#f8f7f7] hover:bg-[#201d1d] text-[#201d1d] hover:text-[#fdfcfc] active:scale-99 cursor-pointer"
           >
              <div className="flex items-center gap-4">
                <div className="p-2 border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] rounded-sm group-hover:bg-[#302c2c] group-hover:border-[#302c2c] group-hover:text-[#fdfcfc] transition-colors">
                  <BarChart2 size={24} />
                </div>
                <div>
                   <p className="font-bold text-lg uppercase tracking-tighter text-[#201d1d] group-hover:text-[#fdfcfc]">{language === 'ko' ? '매트릭스 연산 테스트' : 'MATRIX COMPUTATION'}</p>
                   <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest text-[#646262] group-hover:text-[#fdfcfc]/60">{language === 'ko' ? '승률 시뮬레이션 열기' : 'OPEN_WINRATE_SIMULATOR'}</p>
                </div>
              </div>
              <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] p-2 rounded-sm group-hover:bg-[#fdfcfc] group-hover:border-[#fdfcfc] transition-transform">
                  <Play size={16} className="ml-0.5" />
              </div>
           </button>
        </section>

        {/* Season Selection */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <Database className="opacity-40" size={18} />
            <h3 className="text-sm font-bold tracking-normal text-slate-800">{t('select_season', language)}</h3>
          </div>

          <div className="relative border border-[rgba(15,0,0,0.12)] rounded-none bg-[#fdfcfc] group overflow-hidden">
            <select 
              value={currentSeason}
              onChange={(e) => {
                const season = e.target.value as 'season1' | 'season2';
                if (currentSeason === season) return;
                playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                setTargetSeason(season);
                setIsSeasonModalOpen(true);
              }}
              className="w-full p-4 pr-12 min-h-[44px] bg-transparent text-sm font-bold tracking-widest uppercase cursor-pointer focus:outline-none appearance-none font-mono"
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
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:translate-x-1 bg-[#201d1d] text-[#fdfcfc] p-1.5 rounded-sm">
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

          <div className="border border-[rgba(15,0,0,0.12)] rounded-none p-5 sm:p-6 bg-[#fdfcfc] space-y-6 relative overflow-hidden font-mono">
            <div className="absolute top-0 right-0 py-1 px-2.5 bg-[#f8f7f7] text-[#201d1d] text-[9px] font-bold uppercase tracking-widest border-l border-b border-[rgba(15,0,0,0.12)]">
              USER_INPUT
            </div>

            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest pt-2 w-3/4 text-[#646262]">
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
                           "flex-1 py-3 px-2 min-h-[44px] text-[10px] font-bold uppercase tracking-widest border transition-all rounded-sm flex items-center justify-center",
                           feedbackType === type 
                            ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]" 
                            : "bg-[#f8f7f7] text-[#646262] border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] hover:text-[#201d1d]"
                         )}
                       >
                         {t(type as any, language)}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="border border-[rgba(15,0,0,0.12)] rounded-none overflow-hidden focus-within:border-[#201d1d] transition-all bg-[#fdfcfc]">
                  <div className="bg-[#201d1d] text-[#fdfcfc] px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase">CONTENT_DATA</div>
                  <textarea
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    placeholder={t('feedback_content_placeholder', language)}
                    className="w-full h-32 p-4 bg-transparent focus:outline-none text-sm resize-none font-mono"
                  />
               </div>

               <button
                 disabled={isSubmittingFeedback || !feedbackContent.trim()}
                 onClick={handleSubmitFeedback}
                 className={cn(
                   "w-full min-h-[44px] py-3.5 flex items-center justify-center gap-2 font-bold uppercase tracking-widest border transition-all rounded-sm active:scale-[0.98] font-mono cursor-pointer",
                   isSubmittingFeedback || !feedbackContent.trim()
                     ? "bg-[#f8f7f7] text-[#646262] border-[rgba(15,0,0,0.12)] cursor-not-allowed opacity-60"
                     : "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] hover:bg-[#302c2c]"
                 )}
               >
                 {isSubmittingFeedback ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                 {t('feedback_submit', language)}
               </button>

               {feedbackSuccess && (
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-sm flex items-center justify-center gap-2"
                 >
                   <CheckCircle2 size={14} />
                   {t('feedback_success', language)}
                 </motion.div>
               )}
            </div>
          </div>
        </section>



        <section className="space-y-4 pt-4 border-t border-[rgba(15,0,0,0.12)] font-mono">
          <div className="flex items-center gap-4 mb-2">
             <Play size={18} className="opacity-40" />
             <h3 className="text-sm font-bold tracking-normal uppercase text-[#201d1d]">{language === 'ko' ? '가이드 및 튜토리얼' : 'GUIDE & TUTORIAL'}</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => {
                playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                onStartTutorial();
              }}
              className="flex items-center justify-between p-5 min-h-[44px] bg-[#f8f7f7] border border-[#201d1d] rounded-none hover:bg-[#201d1d] text-[#201d1d] hover:text-[#fdfcfc] active:scale-[0.98] transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="bg-[#201d1d]/10 p-2 rounded-sm group-hover:bg-[#fdfcfc]/20">
                  <Sword size={20} className="text-[#201d1d] group-hover:text-[#fdfcfc] transition-transform" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold uppercase opacity-60 tracking-widest leading-none">Training</p>
                  <span className="font-bold text-sm uppercase tracking-tight">
                    {language === "ko" ? "튜토리얼" : "TUTORIAL"}
                  </span>
                </div>
              </div>
              <span className="text-xl">⚔️</span>
            </button>

            <button
              onClick={() => {
                playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                onNavigate("wiki");
              }}
              className="flex items-center justify-between p-5 min-h-[44px] bg-[#201d1d] border border-[#201d1d] rounded-none text-[#fdfcfc] hover:bg-[#302c2c] active:scale-[0.98] transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-sm">
                  <HelpCircle size={20} className="text-[#fdfcfc] transition-transform" />
                </div>
                <div className="text-left text-[#fdfcfc]">
                  <p className="text-[9px] font-bold uppercase text-white/60 tracking-widest leading-none">Wiki</p>
                  <span className="font-bold text-sm uppercase tracking-tight">
                    {language === "ko" ? "게임 방법" : "HOW TO PLAY"}
                  </span>
                </div>
              </div>
              <span className="text-xl">📚</span>
            </button>
          </div>
        </section>

        <section className="space-y-4 font-mono">
          {/* ─── 캐싱 초기화 ─── */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handlePurgeAllCaches}
              disabled={isPurgingCache}
              className="w-full min-h-[44px] border border-[rgba(15,0,0,0.12)] rounded-none bg-[#fdfcfc] hover:bg-[#f8f7f7] active:bg-[#f1eeee] text-[#201d1d] py-3.5 px-6 font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-between group active:scale-[0.98] cursor-pointer disabled:opacity-60"
              title={language === 'ko' ? '브라우저 캐시 및 임시 리소스를 초기화합니다' : 'Purges asset cache and resets temporary resources'}
            >
              <div className="flex items-center gap-3">
                <RefreshCw size={16} className={cn("text-[#201d1d] transition-transform", isPurgingCache && "animate-spin text-amber-600")} />
                <span className="text-left font-mono">
                  {isPurgingCache
                    ? (language === 'ko' ? '캐싱 초기화 진행 중...' : 'PURGING CACHES...')
                    : cachePurgeSuccess
                    ? (language === 'ko' ? '캐싱 초기화 완료!' : 'CACHE PURGED!')
                    : (language === 'ko' ? '캐싱 초기화 (CLEAR CACHE)' : 'CLEAR CACHE (RESET ASSETS)')}
                </span>
              </div>
              {cachePurgeSuccess ? (
                <CheckCircle2 size={16} className="text-emerald-600" />
              ) : (
                <span className="text-[10px] font-mono font-bold text-[#646262] uppercase tracking-widest border border-[rgba(15,0,0,0.12)] px-2 py-0.5 rounded-sm">
                  [RESET]
                </span>
              )}
            </button>
            <p className="text-[10px] font-mono text-[#646262] px-2 leading-relaxed">
              {language === 'ko'
                ? '* 게임 데이터(카드/재화/덱/스탯)는 로컬에 100% 안전 보존되며, 이미지/사운드 등 임시 리소스 캐시만 초기화됩니다.'
                : '* Saved game data (cards, SNS, decks) is 100% preserved. Only temporary asset caches are refreshed.'}
            </p>
          </div>
        </section>



          {/* ─── Silhouette Debug (testMode/admin only) ─── */}
          {canAccessThumbnailDiagnostics && (
            <section className="space-y-6 font-mono">
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
                  'w-full min-h-[44px] border p-5 rounded-none text-left transition-all relative flex items-center justify-between group cursor-pointer',
                  isDebugOpen
                    ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                    : 'bg-[#f8f7f7] border-[rgba(15,0,0,0.12)] hover:bg-[#201d1d] hover:text-[#fdfcfc]',
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-2 border rounded-sm transition-colors',
                    isDebugOpen
                      ? 'border-[#302c2c] bg-[#302c2c] text-[#fdfcfc]'
                      : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] group-hover:bg-[#302c2c] group-hover:border-[#302c2c] group-hover:text-[#fdfcfc]',
                  )}>
                    <Eye size={24} />
                  </div>
                  <div>
                    <p className={cn(
                      'font-bold text-lg uppercase tracking-tighter',
                      isDebugOpen ? 'text-[#fdfcfc]' : 'text-[#201d1d] group-hover:text-[#fdfcfc]',
                    )}>
                      {t('thumbnail_diagnostics_title', language)}
                    </p>
                    <p className={cn(
                      'text-[10px] font-bold opacity-60 uppercase tracking-widest',
                      isDebugOpen ? 'text-white/60' : 'text-[#646262] group-hover:text-[#fdfcfc]/60',
                    )}>
                      {t('thumbnail_diagnostics_desc', language)}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  'border rounded-sm p-2 transition-transform',
                  isDebugOpen
                    ? 'border-[#302c2c] bg-[#302c2c] text-[#fdfcfc]'
                    : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] group-hover:bg-[#fdfcfc] group-hover:border-[#fdfcfc]',
                )}>
                  <Eye size={16} />
                </div>
              </button>

              {isDebugOpen && (
                <div className="rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] overflow-hidden">
                  <div className="p-4 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
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
                  <div className="p-4 border-t border-[rgba(15,0,0,0.12)] bg-[#f8f7f7]">
                    <p className="text-[9px] font-bold text-[#646262] uppercase tracking-wider leading-relaxed">
                      {t('thumbnail_diagnostics_note', language)}
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}



        {/* ─── Web Push Notification Settings (Google Sheets Synced) ─── */}
        <section className="space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-[#201d1d]/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#201d1d] text-[#fdfcfc] rounded-xs">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-[#201d1d]">
                  {language === 'ko' ? '[알림] 웹푸시 알림받기 설정' : '[PUSH] WEB PUSH NOTIFICATIONS'}
                </h3>
                <p className="text-[10px] text-[#201d1d]/60 font-medium">
                  {language === 'ko'
                    ? '새로운 이벤트, 시즌 랭킹 대전, 출석 보상을 실시간으로 수신합니다 (Google Sheets 영구 연동)'
                    : 'Receive real-time alerts for events and rank battles (Google Sheets Synced)'}
                </p>
              </div>
            </div>
            {pushStatus.hasRegisteredToken ? (
              <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-500 text-emerald-800 text-[10px] font-bold">
                {language === 'ko' ? '[✓ 등록됨]' : '[✓ REGISTERED]'}
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-amber-100 border border-amber-500 text-amber-800 text-[10px] font-bold">
                {language === 'ko' ? '[미등록]' : '[INACTIVE]'}
              </span>
            )}
          </div>

          <div className="border border-[#201d1d]/15 bg-white p-4 space-y-3">
            {/* 현재 상태 정보 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 bg-[#fdfcfc] border border-[#201d1d]/10">
                <span className="text-[#201d1d]/50 block text-[9px] uppercase">
                  {language === 'ko' ? '디바이스 환경' : 'Platform'}
                </span>
                <span className="font-bold text-[#201d1d]">{pushStatus.platformName}</span>
              </div>
              <div className="p-2 bg-[#fdfcfc] border border-[#201d1d]/10">
                <span className="text-[#201d1d]/50 block text-[9px] uppercase">
                  {language === 'ko' ? '브라우저 권한' : 'Permission'}
                </span>
                <span className={cn(
                  "font-bold uppercase",
                  pushStatus.permission === 'granted' ? "text-emerald-700" : pushStatus.permission === 'denied' ? "text-rose-600" : "text-amber-600"
                )}>
                  {pushStatus.permission}
                </span>
              </div>
              <div className="p-2 bg-[#fdfcfc] border border-[#201d1d]/10 col-span-2 sm:col-span-1">
                <span className="text-[#201d1d]/50 block text-[9px] uppercase">
                  {language === 'ko' ? '시트 저장 상태' : 'Sheet Status'}
                </span>
                <span className="font-bold text-indigo-700 truncate block">
                  {pushStatus.hasRegisteredToken ? '✓ 구글 시트 영구 연동' : '대기 중 (미저장)'}
                </span>
              </div>
            </div>

            {/* 토큰 표시 (있을 때) */}
            {pushStatus.token && (
              <div className="p-2 bg-[#201d1d]/5 border border-[#201d1d]/10 text-[10px] flex items-center justify-between">
                <span className="text-[#201d1d]/60 truncate max-w-[240px]">
                  ID: <span className="text-[#201d1d] font-bold">{pushStatus.token}</span>
                </span>
                <span className="text-[9px] text-[#201d1d]/40">
                  {pushStatus.registeredAt ? new Date(pushStatus.registeredAt).toLocaleDateString() : ''}
                </span>
              </div>
            )}

            {/* 알림 메시지 배너 */}
            {pushRegisterNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                <span>{pushRegisterNotice}</span>
              </div>
            )}

            {/* iOS PWA 미설치 안내 배너 */}
            {pushStatus.needsIosPwaInstall && (
              <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span>{language === 'ko' ? 'iOS PWA 홈 화면 추가 필요' : 'iOS PWA Install Required'}</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-normal">
                  {language === 'ko'
                    ? 'Apple Safari 정책으로 인해, 홈 화면에 앱을 추가(PWA 설치)한 후에만 웹푸시를 수신할 수 있습니다.'
                    : 'Safari policy requires adding this app to your Home Screen before receiving Web Push.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsIosPwaGuideOpen(true)}
                  className="mt-1 min-h-[44px] text-[11px] underline font-bold text-amber-950 cursor-pointer flex items-center"
                >
                  {language === 'ko' ? '[▶ iOS 설치 가이드 확인하기]' : '[▶ View iOS Install Guide]'}
                </button>
              </div>
            )}

            {/* 조작 버튼 그룹 */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleRequestWebPush}
                disabled={isRegisteringPush}
                className={cn(
                  "flex-1 min-h-[44px] py-2.5 px-4 font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer rounded-xs border",
                  pushStatus.hasRegisteredToken
                    ? "bg-white border-[#201d1d]/30 text-[#201d1d] hover:bg-slate-50"
                    : "bg-[#201d1d] hover:bg-[#201d1d]/90 text-[#fdfcfc] border-[#201d1d]"
                )}
              >
                {isRegisteringPush ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{language === 'ko' ? '푸시 등록 및 시트 저장 중...' : 'Registering & Syncing...'}</span>
                  </>
                ) : pushStatus.hasRegisteredToken ? (
                  <>
                    <RefreshCw size={14} />
                    <span>{language === 'ko' ? '[+] 푸시 토큰 갱신 & 재등록' : '[+] Refresh Push Token'}</span>
                  </>
                ) : (
                  <>
                    <Bell size={14} />
                    <span>
                      {language === 'ko' 
                        ? (!PwaRewardService.isPushRewardClaimed() ? '[+] 웹푸시 알림받기 (+100 SNS)' : '[+] 웹푸시 알림받기 신청') 
                        : (!PwaRewardService.isPushRewardClaimed() ? '[+] Opt-in Web Push (+100 SNS)' : '[+] Opt-in Web Push Alerts')}
                    </span>
                  </>
                )}
              </button>

              {pushStatus.hasRegisteredToken && (
                <button
                  type="button"
                  onClick={handleSendTestPush}
                  disabled={isSendingTestPush}
                  className="min-h-[44px] py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 active:scale-[0.99] text-[#fdfcfc] font-bold text-xs uppercase cursor-pointer rounded-xs transition-all flex items-center justify-center gap-2 border border-emerald-800"
                >
                  <Send size={14} className={isSendingTestPush ? "animate-pulse" : ""} />
                  <span>{language === 'ko' ? '[테스트 알림 받기]' : '[Send Test Alert]'}</span>
                </button>
              )}
            </div>

            <p className="text-[10px] text-[#201d1d]/50 leading-relaxed pt-1">
              {language === 'ko'
                ? '* 등록된 푸시 토큰은 Google Sheets(Form Response)에 안전하게 실시간 보관되며, 게임 공지 및 랭킹 대전 전체 푸시 발송 시 사용됩니다.'
                : '* Registered tokens are stored in Google Sheets and utilized for game announcements and rank battle broadcasts.'}
            </p>
          </div>
        </section>

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
            className="w-full min-h-[44px] border border-[rgba(15,0,0,0.12)] rounded-none bg-[#fdfcfc] text-[#201d1d] py-3.5 font-bold tracking-widest uppercase hover:bg-[#201d1d] hover:text-[#fdfcfc] hover:border-[#201d1d] transition-all flex items-center justify-between px-6 group active:scale-[0.98] cursor-pointer"
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

          <div className="border border-[rgba(15,0,0,0.12)] rounded-none p-5 sm:p-6 bg-[#fdfcfc] space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Database size={24} className="text-[#201d1d]" />
                <div>
                  <p className="font-bold text-sm tracking-tight uppercase text-[#201d1d]">
                    {t('backup_data', language)} / {t('restore_data', language)}
                  </p>
                  <p className="text-[10px] text-[#646262] font-semibold tracking-widest uppercase">
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
                className="flex-1 min-h-[44px] py-3 px-4 bg-[#201d1d] text-[#fdfcfc] rounded-sm font-mono text-xs font-bold hover:bg-[#302c2c] transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98 border border-[#201d1d]"
              >
                [+] {t('backup_data', language)}
              </button>
              <button
                type="button"
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                  setBackupRestoreMode('restore');
                }}
                className="flex-1 min-h-[44px] py-3 px-4 bg-[#201d1d] text-[#fdfcfc] rounded-sm font-mono text-xs font-bold hover:bg-[#302c2c] transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98 border border-[#201d1d]"
              >
                [+] {t('restore_data', language)}
              </button>
              <button
                type="button"
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                  setIsGoogleSheetsModalOpen(true);
                }}
                className="flex-1 min-h-[44px] py-3 px-4 bg-[#201d1d] text-[#fdfcfc] rounded-sm font-mono text-xs font-bold hover:bg-[#302c2c] transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98 border border-[#201d1d]"
              >
                [+] {language === 'ko' ? 'Google Sheets 연동 & 동기화' : 'Google Sheets Sync'}
              </button>
            </div>
          </div>
        </section>

        {/* ── 버전 관리 & 스마트 캐시 동기화 시스템 ── */}
        <section className="bg-[#fdfcfc] border border-[#201d1d]/20 rounded-none p-5 text-[#201d1d] font-mono space-y-4">
          <div className="flex items-center justify-between border-b border-[#201d1d]/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#201d1d] inline-block animate-pulse"></span>
              <h3 className="text-sm font-bold tracking-tight">
                {language === 'ko' ? '[시스템] 버전 관리 및 캐시 동기화' : '[SYSTEM] VERSION & CACHE SYNC'}
              </h3>
            </div>
            <span className="text-xs bg-[#201d1d] text-[#fdfcfc] px-2 py-0.5 font-bold">
              v{appCurrentVersion}
            </span>
          </div>

          <p className="text-xs text-[#201d1d]/70 leading-relaxed">
            {language === 'ko'
              ? '서버의 최신 버전(/api/version)을 조회하여 새 버전이 배포된 경우 구버전 캐시를 자동으로 안전하게 초기화합니다. 수동으로도 즉시 확인하거나 캐시를 초기화할 수 있습니다.'
              : 'Verifies /api/version and auto-purges stale browser caches when an update is released. You can also manually check or clear caches here.'
            }
          </p>

          {versionCheckMsg && (
            <div className="p-3 bg-[#201d1d]/5 border border-[#201d1d]/20 text-xs font-mono">
              <span className="font-bold mr-1">&gt;</span> {versionCheckMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCheckVersion}
              disabled={isCheckingVersion}
              className="min-h-[44px] py-2.5 px-4 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:bg-[#201d1d]/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={isCheckingVersion ? "animate-spin" : ""} />
              {isCheckingVersion
                ? (language === 'ko' ? '[...] 버전 확인 중' : '[...] Checking...')
                : (language === 'ko' ? '[+] 최신 버전 확인 (/api/version)' : '[+] Check Latest Version')
              }
            </button>
            <button
              type="button"
              onClick={handlePurgeAllCaches}
              className="min-h-[44px] py-2.5 px-4 bg-[#fdfcfc] border border-[#201d1d] text-[#201d1d] text-xs font-bold rounded-sm hover:bg-[#201d1d] hover:text-[#fdfcfc] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              [x] {language === 'ko' ? '캐시 전면 초기화 (수동)' : 'Clear All Caches (Manual)'}
            </button>
          </div>
        </section>
      </div>
    )}

      {/* TAB 2: 일일 미션 센터 */}
      {activeSubTab === 'missions' && (
        <div className="space-y-6">
          <DailyMissions />
        </div>
      )}

      {/* TAB 3: 7일 출석 스트릭 & 보상 센터 */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6 font-mono">
          {/* 헤더 배너 */}
          <div className="border border-[#201d1d]/12 bg-white p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#201d1d]/10 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarCheck className="text-indigo-600" size={20} />
                  <h3 className="text-sm font-bold text-[#201d1d] uppercase tracking-wider">
                    {language === 'ko' ? '7일 연속 출석 스트릭 (Attendance Streak)' : '7-DAY ATTENDANCE STREAK'}
                  </h3>
                </div>
                <p className="text-xs text-[#201d1d]/70 mt-1">
                  {language === 'ko'
                    ? '매일 출석하여 SNS 보상을 획득하고, 7일 완주 시 최고 등급 SSR 히어로 카드팩 소환 혜택을 획득하세요!'
                    : 'Check in daily to claim SNS rewards, and unlock SSR Hero Pack benefits upon 7-day completion!'}
                </p>
              </div>

              {/* 연속 출석 배지 */}
              <div className="flex items-center gap-2">
                <div className="border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-center">
                  <p className="text-[10px] text-indigo-700 font-bold uppercase">
                    {language === 'ko' ? '현재 스트릭' : 'CURRENT STREAK'}
                  </p>
                  <p className="text-base font-black text-indigo-900">
                    Day {attendanceData.currentStreak}
                  </p>
                </div>
                <div className="border border-amber-200 bg-amber-50 px-3 py-1.5 text-center">
                  <p className="text-[10px] text-amber-700 font-bold uppercase">
                    {language === 'ko' ? '보너스 승수' : 'MULTIPLIER'}
                  </p>
                  <p className="text-base font-black text-amber-900">
                    {attendanceData.currentStreak >= 7 ? '3.0x' : attendanceData.currentStreak >= 5 ? '2.0x' : attendanceData.currentStreak >= 3 ? '1.5x' : '1.0x'}
                  </p>
                </div>
              </div>
            </div>

            {/* 7일 출석 카드 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 mb-5">
              {[
                { day: 1, sns: 50, special: null },
                { day: 2, sns: 60, special: null },
                { day: 3, sns: 70, special: null },
                { day: 4, sns: 80, special: null },
                { day: 5, sns: 90, special: null },
                { day: 6, sns: 100, special: null },
                { day: 7, sns: 150, special: 'SSR_PACK' },
              ].map((item) => {
                const isPast = item.day < attendanceData.currentStreak;
                const isCurrent = item.day === attendanceData.currentStreak;
                const isFuture = item.day > attendanceData.currentStreak;

                return (
                  <div
                    key={item.day}
                    className={cn(
                      "p-3 border flex flex-col items-center justify-between min-h-[110px] text-center transition-all relative",
                      isPast && "border-emerald-500 bg-emerald-50/70 text-emerald-900",
                      isCurrent && !isCheckedAttendanceToday && "border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400",
                      isCurrent && isCheckedAttendanceToday && "border-emerald-500 bg-emerald-50/70 text-emerald-900",
                      isFuture && "border-[#201d1d]/15 bg-slate-50 text-[#201d1d]/40"
                    )}
                  >
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                      DAY 0{item.day}
                    </span>

                    <div className="my-1.5 flex flex-col items-center">
                      {item.special ? (
                        <div className="p-1.5 bg-amber-100 border border-amber-300 text-amber-700 rounded-none mb-1">
                          <Award size={18} />
                        </div>
                      ) : (
                        <Gift size={18} className={isPast || isCurrent ? "text-indigo-600" : "text-slate-400"} />
                      )}
                      <span className="text-xs font-bold mt-0.5">
                        +{item.sns} SNS
                      </span>
                      {item.special && (
                        <span className="text-[9px] font-black text-amber-800 bg-amber-200 px-1 mt-0.5">
                          +SSR 팩!
                        </span>
                      )}
                    </div>

                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 border w-full",
                      (isPast || (isCurrent && isCheckedAttendanceToday))
                        ? "border-emerald-600 bg-emerald-100 text-emerald-800"
                        : isCurrent
                          ? "border-amber-600 bg-amber-100 text-amber-900 animate-pulse"
                          : "border-[#201d1d]/10 bg-white text-[#201d1d]/40"
                    )}>
                      {isPast || (isCurrent && isCheckedAttendanceToday)
                        ? (language === 'ko' ? '[✓ 완]' : '[✓ DONE]')
                        : isCurrent
                          ? (language === 'ko' ? '[오늘]' : '[TODAY]')
                          : (language === 'ko' ? '[대기]' : '[LOCK]')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 1탭 출석 버튼 (44px+ 터치 타깃) */}
            <div className="pt-1">
              {!isCheckedAttendanceToday ? (
                <button
                  type="button"
                  onClick={handleClaimDailyAttendance}
                  className="w-full min-h-[48px] py-3.5 px-4 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold border border-[#201d1d] hover:bg-[#201d1d]/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer rounded-none"
                >
                  <Sparkles size={16} className="text-amber-300 animate-spin" />
                  <span>
                    {language === 'ko'
                      ? `[+] 오늘 ${attendanceData.currentStreak}일차 출석 체크하고 +${[50, 60, 70, 80, 90, 100, 150][Math.min(6, attendanceData.currentStreak - 1)]} SNS 받기`
                      : `[+] Check-in Day ${attendanceData.currentStreak} & Claim +${[50, 60, 70, 80, 90, 100, 150][Math.min(6, attendanceData.currentStreak - 1)]} SNS`}
                  </span>
                </button>
              ) : (
                <div className="w-full min-h-[48px] py-3 px-4 bg-emerald-50 border border-emerald-500 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 rounded-none">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>
                    {language === 'ko'
                      ? `[✓ 오늘 출석 완료] 내일 00:00 KST에 Day ${attendanceData.currentStreak >= 7 ? 1 : attendanceData.currentStreak} 보상이 열립니다!`
                      : `[✓ Today's Check-in Complete] Next Day unlocked tomorrow at 00:00 KST!`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 최하단 고정 배치: 언어 설정 & 로그아웃 ─── */}
      <div className="mt-auto pt-6 border-t border-[rgba(15,0,0,0.12)] space-y-6 font-mono">
        {/* 언어 설정 (Language Selection) */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <Globe className="opacity-40" size={18} />
            <h3 className="text-sm font-bold tracking-normal uppercase text-[#201d1d]">
              {t('language', language)}
            </h3>
          </div>

          <div className="relative border border-[rgba(15,0,0,0.12)] rounded-none bg-[#fdfcfc] group overflow-hidden">
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as Language);
                playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
              }}
              className="w-full p-4 pr-12 min-h-[44px] bg-transparent text-sm font-bold tracking-widest uppercase cursor-pointer focus:outline-none appearance-none font-mono"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-black">
                  {lang.name.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:translate-x-1 bg-[#201d1d] text-[#fdfcfc] p-1.5 rounded-sm">
              <ArrowRight size={14} />
            </div>
          </div>
          <p className="text-xs opacity-40 font-bold tracking-normal italic font-mono">
            * {t('google_translate_notice', language)}
          </p>
        </section>

        {/* 로그아웃 (Logout / Auth Management) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal size={18} className="opacity-40" />
              <h3 className="text-sm font-bold tracking-normal uppercase text-[#201d1d]">
                {t('auth_management', language)}
              </h3>
            </div>
            {!user && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#646262]">
                {language === 'ko' ? '게스트 모드 (로컬 저장)' : 'GUEST MODE (LOCAL)'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full min-h-[44px] border border-[#201d1d] rounded-none bg-[#fdfcfc] text-[#201d1d] py-3.5 font-bold tracking-widest uppercase hover:bg-[#201d1d] hover:text-[#fdfcfc] transition-all flex items-center justify-between px-6 group active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <LogOut size={16} />
              <span>{t('logout', language)} (SIGN OUT)</span>
            </div>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </section>
      </div>

      <footer className="pt-8 text-center">
        <p className="text-sm font-bold tracking-[0.6em] opacity-10">{t('system_version', language)} SNS_HERO_KERNAL v{appCurrentVersion}.Build</p>
      </footer>

      <AnimatePresence>
        {isSimModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-mono"
            onClick={() => setIsSimModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#fdfcfc] w-full max-w-lg rounded-none border border-[#201d1d] overflow-hidden flex flex-col relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-[rgba(15,0,0,0.12)] flex items-center justify-between bg-[#f8f7f7]">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-[#201d1d] text-[#fdfcfc] rounded-sm"><BarChart2 size={20} /></div>
                   <h3 className="font-bold uppercase tracking-tight text-lg text-[#201d1d]">{t('strategy_simulation', language)}</h3>
                </div>
                <button 
                  onClick={() => setIsSimModalOpen(false)}
                  className="min-w-[44px] min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7] transition-all text-[#201d1d] flex items-center justify-center cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto max-h-[70vh] flex flex-col gap-6">
                 <div className="bg-[#f8f7f7] p-5 rounded-none border border-[rgba(15,0,0,0.12)] flex flex-col gap-4 text-center">
                    <div>
                       <p className="font-bold text-sm uppercase text-[#201d1d]">{language === 'ko' ? '엔진 상태' : 'ENGINE STATUS'}: {isSimulating ? 'COMPUTING...' : 'READY'}</p>
                       <p className="text-[10px] text-[#646262] font-semibold uppercase tracking-wider mt-1">200 ITERATIONS PER CONTEXT</p>
                    </div>
                    <button 
                      onClick={handleSimulate}
                      disabled={isSimulating}
                      className={cn(
                        "py-3.5 min-h-[44px] rounded-sm font-bold uppercase tracking-wider text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border",
                        isSimulating 
                          ? "bg-[#f8f7f7] text-[#646262] border-[rgba(15,0,0,0.12)] cursor-not-allowed opacity-60" 
                          : "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] hover:bg-[#302c2c]"
                      )}
                    >
                      {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                      {isSimulating ? t('computing', language) : t('start_test', language)}
                    </button>
                 </div>

                 {simResults.length > 0 && (
                   <div className="space-y-4">
                      {simResults.map((res, i) => (
                        <div key={i} className="border border-[rgba(15,0,0,0.12)] rounded-none p-4 bg-[#fdfcfc] flex flex-col gap-3">
                           <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2.5">
                              <div className="flex items-center gap-2">
                                 <span className={cn("text-[9px] font-bold px-2 py-0.5 text-[#fdfcfc] rounded-xs uppercase", 
                                    aiStrategy === 'aggressive' ? "bg-red-600" :
                                    aiStrategy === 'defensive' ? "bg-emerald-600" : "bg-[#201d1d]"
                                 )}>A: {aiStrategy}</span>
                                <span className="text-[10px] font-bold text-[#646262]">VS</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-[#f8f7f7] text-[#201d1d] rounded-xs uppercase border border-[rgba(15,0,0,0.12)]">B: {res.stratB}</span>
                              </div>
                              <p className="text-[9px] font-bold text-[#646262] uppercase tracking-wider">200 MATCH_DATA</p>
                           </div>
                           
                           <div className="space-y-2.5">
                              <div className="h-2.5 bg-[#f8f7f7] flex rounded-none overflow-hidden border border-[rgba(15,0,0,0.12)]">
                                 <div 
                                    className="bg-[#201d1d] transition-all duration-1000" 
                                    style={{ width: `${(res.winsA / res.total) * 100}%` }} 
                                 />
                                 <div 
                                    className="bg-[#9a9898] transition-all duration-1000" 
                                    style={{ width: `${(res.draws / res.total) * 100}%` }} 
                                 />
                                 <div 
                                    className="bg-rose-500 transition-all duration-1000" 
                                    style={{ width: `${(res.winsB / res.total) * 100}%` }} 
                                 />
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                 <div className="text-[#201d1d] flex flex-col">
                                    <span className="text-[#646262] text-[8px] uppercase tracking-wider">Wins A</span>
                                    {Math.round((res.winsA / res.total) * 100)}%
                                 </div>
                                 <div className="text-[#646262] flex flex-col items-center">
                                    <span className="text-[#646262] text-[8px] uppercase tracking-wider">{t('draws', language)}</span>
                                    {Math.round((res.draws / res.total) * 100)}%
                                 </div>
                                 <div className="text-rose-600 flex flex-col items-end">
                                    <span className="text-[#646262] text-[8px] uppercase tracking-wider">Wins B</span>
                                    {Math.round((res.winsB / res.total) * 100)}%
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                      <div className="text-center space-y-1 pt-2">
                        <p className="text-[10px] font-bold text-[#646262] uppercase tracking-wider leading-tight">
                          {language === 'ko' ? '* 무작위 덱 합성 시뮬레이션 결과입니다.' : '* RESULTS_BASED_ON_RANDOM_SYNTHESIS_MODEL'}
                        </p>
                      </div>
                   </div>
                 )}
              </div>
              <div className="p-5 bg-[#f8f7f7] border-t border-[rgba(15,0,0,0.12)] flex gap-4">
                <button 
                  onClick={() => setIsSimModalOpen(false)}
                  className="w-full min-h-[44px] py-3 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] rounded-sm font-bold uppercase tracking-wider text-xs border border-[#201d1d] active:scale-95 transition-all cursor-pointer font-mono"
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
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-mono"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#fdfcfc] rounded-none p-6 max-w-sm w-full border border-[#201d1d] text-center space-y-6 select-none relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 bg-[#f8f7f7] border border-[#201d1d] rounded-sm mx-auto flex items-center justify-center text-[#201d1d]">
                <AlertTriangle size={28} className="text-[#201d1d]" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold uppercase leading-none text-[#201d1d]">{t('select_season', language)}</h3>
                <p className="text-xs font-semibold text-[#646262] leading-tight">
                  {t('season_change_notice', language)}
                </p>
                <div className="bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-4 rounded-none text-left">
                  <p className="text-[10px] font-bold text-[#646262] leading-normal">
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
                  className="flex-1 min-h-[44px] bg-[#201d1d] text-[#fdfcfc] py-3 rounded-sm font-bold uppercase tracking-wider text-xs hover:bg-[#302c2c] active:scale-95 transition-all cursor-pointer border border-[#201d1d]"
                >
                  {t('yes_accept', language) || 'YES'}
                </button>
                <button
                  onClick={() => {
                    setIsSeasonModalOpen(false);
                    setTargetSeason(null);
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className="flex-1 min-h-[44px] bg-[#f8f7f7] text-[#201d1d] py-3 rounded-sm font-bold uppercase tracking-wider text-xs border border-[rgba(15,0,0,0.12)] active:scale-95 transition-all hover:bg-[#f1eeee] cursor-pointer"
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
            className="fixed inset-0 z-[209] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-mono"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#fdfcfc] rounded-none max-w-sm w-full p-6 border border-[#201d1d] relative"
            >
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 min-w-[44px] min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7] text-[#201d1d] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={20} className="text-[#201d1d]" />
                <h3 className="font-bold text-sm text-[#201d1d]">{t('setting', language)}</h3>
              </div>
              <div className="min-h-[120px] flex flex-col justify-center text-sm text-[#201d1d] leading-relaxed space-y-2 mb-4">
                {helpSlide === 0 && (
                  <p>{language === 'ko' ? '설정 화면에서는 BGM/SFX 음량, 저사양 모드, 추천 모드, 자동 전투 등 게임 환경을 조절할 수 있습니다. 언어와 테마(라이트/다크/메탈)도 변경 가능합니다.' : 'Configure BGM/SFX volume, low-spec mode, recommend mode, auto-battle, and more. Change language and theme (Light/Dark/Metal).'}</p>
                )}
                {helpSlide === 1 && (
                  <p>{language === 'ko' ? 'AI 난이도와 자동 전투 전술(자동/균형/공격적/방어적/무작위)을 선택할 수 있습니다. 전략 시뮬레이션으로 승률을 테스트해보세요.' : 'Choose AI difficulty and auto-battle strategy (Auto/Balanced/Aggressive/Defensive/Random). Test win rates with the strategy simulator.'}</p>
                )}
                {helpSlide === 2 && (
                  <p>{language === 'ko' ? '피드백을 제출하거나 데이터베이스 모드를 전환할 수 있습니다. 튜토리얼, 위키, 정책 센터로 이동할 수 있는 바로가기도 제공됩니다.' : 'Submit feedback, switch database modes, and access tutorials, wiki, and policy center.'}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setHelpSlide((s) => Math.max(0, s - 1))}
                  disabled={helpSlide === 0}
                  className="min-w-[44px] min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] flex items-center justify-center hover:bg-[#f8f7f7] disabled:opacity-30 transition-colors cursor-pointer"
                  type="button"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[10px] font-bold text-[#646262]">{helpSlide + 1} / 3</span>
                <button
                  onClick={() => setHelpSlide((s) => Math.min(2, s + 1))}
                  disabled={helpSlide === 2}
                  className="min-w-[44px] min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] flex items-center justify-center hover:bg-[#f8f7f7] disabled:opacity-30 transition-colors cursor-pointer"
                  type="button"
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

      <BgmJukeboxModal
        isOpen={isJukeboxOpen}
        onClose={() => setIsJukeboxOpen(false)}
        currentTrackId={bgmTrackId}
        onSelectTrack={(trackId) => {
          setBgmTrackId(trackId);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        }}
        language={language}
      />

      <HapticVibrationSettingsModal
        isOpen={isHapticModalOpen}
        onClose={() => setIsHapticModalOpen(false)}
      />

      {/* ─── iOS 웹푸시 PWA 설치 가이드 모달 ─── */}
      <IosPwaInstallGuideModal
        isOpen={isIosPwaGuideOpen}
        onClose={() => setIsIosPwaGuideOpen(false)}
        language={language}
      />
    </div>
  );
};

