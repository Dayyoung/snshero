import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, BellRing, Check, Gift, X, Sparkles, AlertCircle, ExternalLink, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { useSns } from '../contexts/SnsContext';
import { usePwaInstallGuard } from '../hooks/usePwaInstallGuard';
import { WebPushService, DevicePushStatus } from '../lib/webPushService';
import { PwaRewardService, PWA_INSTALL_REWARD_AMOUNT, PUSH_NOTIFICATION_REWARD_AMOUNT } from '../lib/pwaRewardService';
import { IosPwaInstallGuideModal } from './IosPwaInstallGuideModal';
import { triggerHaptic } from '../lib/haptic';

interface PwaEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  playSfx?: (url: string) => void;
  userDisplayName?: string | null;
}

export const PwaEventModal: React.FC<PwaEventModalProps> = ({
  isOpen,
  onClose,
  language = 'ko',
  playSfx,
  userDisplayName,
}) => {
  const { addSns } = useSns();
  const { isInstallable, isInstalled: pwaInstalledByHook, promptInstall } = usePwaInstallGuard();
  
  const [pushStatus, setPushStatus] = useState<DevicePushStatus>(() => WebPushService.getDeviceStatus());
  const [isPwaClaimed, setIsPwaClaimed] = useState<boolean>(() => PwaRewardService.isPwaRewardClaimed());
  const [isPushClaimed, setIsPushClaimed] = useState<boolean>(() => PwaRewardService.isPushRewardClaimed());
  
  const [doNotShowToday, setDoNotShowToday] = useState(false);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const [pushNotice, setPushNotice] = useState<string | null>(null);
  const [isIosGuideOpen, setIsIosGuideOpen] = useState(false);
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  // 실시간 standalone/PWA 여부 감지
  const isStandalone = typeof window !== 'undefined' && (
    pwaInstalledByHook ||
    pushStatus.isStandalone ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );

  const refreshStatus = useCallback(() => {
    setPushStatus(WebPushService.getDeviceStatus());
    setIsPwaClaimed(PwaRewardService.isPwaRewardClaimed());
    setIsPushClaimed(PwaRewardService.isPushRewardClaimed());
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshStatus();
    }
  }, [isOpen, refreshStatus]);

  useEffect(() => {
    const handleRewardsUpdated = () => refreshStatus();
    window.addEventListener('hero_pwa_rewards_updated', handleRewardsUpdated);
    window.addEventListener('storage', handleRewardsUpdated);
    return () => {
      window.removeEventListener('hero_pwa_rewards_updated', handleRewardsUpdated);
      window.removeEventListener('storage', handleRewardsUpdated);
    };
  }, [refreshStatus]);

  // 보상 획득 시 축하 알림 및 효과음
  const triggerSuccessReward = (amount: number, label: string) => {
    triggerHaptic('success');
    if (playSfx) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
    }
    setRewardToast(`🎉 +${amount} SNS 보상이 지급되었습니다! (${label})`);
    setTimeout(() => {
      setRewardToast(null);
    }, 3500);
  };

  // 1. PWA 설치 보상 받기 처리
  const handleClaimPwaReward = () => {
    if (isPwaClaimed) return;
    if (!isStandalone) {
      if (pushStatus.needsIosPwaInstall) {
        setIsIosGuideOpen(true);
      } else if (isInstallable) {
        handleInstallPwa();
      }
      return;
    }

    const success = PwaRewardService.claimPwaReward(addSns);
    if (success) {
      setIsPwaClaimed(true);
      triggerSuccessReward(PWA_INSTALL_REWARD_AMOUNT, language === 'ko' ? 'PWA 설치' : 'PWA Install');
    }
  };

  // PWA 설치 프롬프트 호출
  const handleInstallPwa = async () => {
    triggerHaptic('light');
    if (playSfx) playSfx('click');

    if (pushStatus.needsIosPwaInstall) {
      setIsIosGuideOpen(true);
      return;
    }

    try {
      const accepted = await promptInstall();
      if (accepted) {
        // 즉시 보상 지급
        const success = PwaRewardService.claimPwaReward(addSns);
        if (success) {
          setIsPwaClaimed(true);
          triggerSuccessReward(PWA_INSTALL_REWARD_AMOUNT, language === 'ko' ? 'PWA 설치' : 'PWA Install');
        }
      }
    } catch {
      // ignore
    }
  };

  // 2. 웹푸시 등록 및 보상 받기 처리
  const handleRegisterOrClaimPush = async () => {
    triggerHaptic('light');
    if (playSfx) playSfx('click');

    // 이미 등록되어 있는데 보상만 미수령인 경우 바로 수령
    if (pushStatus.hasRegisteredToken && !isPushClaimed) {
      const success = PwaRewardService.claimPushReward(addSns);
      if (success) {
        setIsPushClaimed(true);
        triggerSuccessReward(PUSH_NOTIFICATION_REWARD_AMOUNT, language === 'ko' ? '웹푸시 알림' : 'Web Push');
      }
      return;
    }

    // iOS인데 PWA가 아닌 경우 가이드 모달 안내
    if (pushStatus.needsIosPwaInstall) {
      setIsIosGuideOpen(true);
      return;
    }

    setIsRegisteringPush(true);
    setPushNotice(null);

    try {
      const res = await WebPushService.registerWebPush(userDisplayName || undefined);
      refreshStatus();

      if (res.success) {
        // 등록 즉시 보상 수령 처리
        const success = PwaRewardService.claimPushReward(addSns);
        setIsPushClaimed(true);
        triggerSuccessReward(PUSH_NOTIFICATION_REWARD_AMOUNT, language === 'ko' ? '웹푸시 알림' : 'Web Push');
        setPushNotice(language === 'ko' 
          ? '✓ 알림 등록 및 +100 SNS 수령 완료!' 
          : '✓ Web Push registered & +100 SNS claimed!');
      } else if (res.reason === 'ios_pwa_required') {
        setIsIosGuideOpen(true);
      } else {
        setPushNotice(res.message || (language === 'ko' ? '알림 등록에 실패했습니다.' : 'Failed to register notification.'));
      }
    } catch (e: any) {
      setPushNotice(e?.message || (language === 'ko' ? '오류가 발생했습니다.' : 'An error occurred.'));
    } finally {
      setIsRegisteringPush(false);
    }
  };

  // 닫기 핸들러
  const handleCloseModal = () => {
    triggerHaptic('light');
    if (doNotShowToday) {
      PwaRewardService.setEventDismissedToday();
    }
    onClose();
  };

  if (!isOpen) return null;

  const totalClaimedCount = (isPwaClaimed ? 1 : 0) + (isPushClaimed ? 1 : 0);
  const totalEarnedSns = totalClaimedCount * 100;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[10060] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none font-mono">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-[#fdfcfc] border-2 border-[#201d1d] p-4 sm:p-5 rounded-none shadow-[4px_4px_0px_#201d1d] text-[#201d1d] relative flex flex-col gap-4 max-h-[92dvh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* 상단 토스트 알림 */}
            <AnimatePresence>
              {rewardToast && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xs flex items-center gap-2 border border-emerald-700 shadow-sm"
                >
                  <Sparkles size={16} className="shrink-0 text-amber-300" />
                  <span>{rewardToast}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 헤더 */}
            <div className="flex items-start justify-between border-b border-[#201d1d]/15 pb-3">
              <div>
                <div className="flex items-center gap-1.5 text-indigo-600 font-black text-xs uppercase tracking-wider mb-0.5">
                  <Gift size={14} />
                  <span>[ SPECIAL EVENT ]</span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-[#201d1d]">
                  {language === 'ko' ? 'PWA 설치 & 알림 등록 이벤트' : 'PWA Install & Push Notification Event'}
                </h3>
                <p className="text-xs text-[#201d1d]/70 mt-0.5">
                  {language === 'ko' 
                    ? '앱 설치하고 알림 켜면 최대 +200 SNS 즉시 지급!' 
                    : 'Install app & enable alerts to earn up to +200 SNS!'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-[#201d1d]/60 hover:text-[#201d1d] hover:bg-[#201d1d]/10 rounded-xs transition-colors cursor-pointer shrink-0"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* 총 혜택 요약 뱃지 배너 */}
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-none flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-xs bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                  ★
                </span>
                <div>
                  <span className="font-bold text-[#201d1d] block">
                    {language === 'ko' ? '이벤트 총 보상' : 'Total Reward Pool'}
                  </span>
                  <span className="text-[11px] text-[#201d1d]/70">
                    {language === 'ko' 
                      ? `수령 완료: ${totalClaimedCount}/2 미션 (+${totalEarnedSns} SNS)` 
                      : `Claimed: ${totalClaimedCount}/2 (+${totalEarnedSns} SNS)`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 bg-indigo-600 text-white font-black text-xs rounded-xs">
                  +200 SNS
                </span>
              </div>
            </div>

            {/* 미션 1: PWA 앱 설치 */}
            <div className="p-3 bg-white border border-[#201d1d]/20 rounded-none flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xs">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-[#201d1d]">
                        {language === 'ko' ? '1. 홈 화면에 추가 (앱 설치)' : '1. Add to Home (PWA Install)'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#201d1d]/60 block mt-0.5">
                      {language === 'ko' 
                        ? '전체화면 무결점 플레이 & 즉시 실행' 
                        : 'Full-screen app mode & quick launch'}
                    </span>
                  </div>
                </div>

                <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] rounded-xs shrink-0">
                  +{PWA_INSTALL_REWARD_AMOUNT} SNS
                </span>
              </div>

              {/* 상태 식별 바 */}
              <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 border border-slate-200">
                <span className="text-[#201d1d]/70">
                  {language === 'ko' ? '현재 상태:' : 'Current Status:'}
                </span>
                {isStandalone ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Check size={12} /> {language === 'ko' ? '앱 설치/실행 중' : 'Installed / App Mode'}
                  </span>
                ) : (
                  <span className="text-amber-800 font-medium">
                    {pushStatus.isIOS 
                      ? (language === 'ko' ? '웹 브라우저 (iOS 홈화면 추가 필요)' : 'Web Browser (iOS Safari)') 
                      : (language === 'ko' ? '웹 브라우저 (미설치)' : 'Web Browser (Not Installed)')}
                  </span>
                )}
              </div>

              {/* 액션 버튼 */}
              {isPwaClaimed ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2 bg-slate-100 text-slate-500 font-bold text-xs border border-slate-300 rounded-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <Check size={14} className="text-emerald-600" />
                  <span>{language === 'ko' ? '✓ 수령 완료 (+100 SNS)' : '✓ Claimed (+100 SNS)'}</span>
                </button>
              ) : isStandalone ? (
                <button
                  type="button"
                  onClick={handleClaimPwaReward}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Gift size={14} />
                  <span>{language === 'ko' ? '🎁 +100 SNS 보상 받기' : '🎁 Claim +100 SNS'}</span>
                </button>
              ) : pushStatus.needsIosPwaInstall ? (
                <button
                  type="button"
                  onClick={() => setIsIosGuideOpen(true)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Smartphone size={14} />
                  <span>{language === 'ko' ? '📖 iOS 설치 방법 보기' : '📖 View iOS Install Guide'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallPwa}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-xs rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Smartphone size={14} />
                  <span>{language === 'ko' ? '📲 홈 화면에 앱 추가하기 (+100 SNS)' : '📲 Add to Home Screen (+100 SNS)'}</span>
                </button>
              )}
            </div>

            {/* 미션 2: 웹푸시 알림 등록 */}
            <div className="p-3 bg-white border border-[#201d1d]/20 rounded-none flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xs">
                    <BellRing size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-[#201d1d]">
                        {language === 'ko' ? '2. 웹푸시 알림 받기' : '2. Web Push Notifications'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#201d1d]/60 block mt-0.5">
                      {language === 'ko' 
                        ? '이벤트 보상, 리그 시작 알림 수신' 
                        : 'Receive event rewards & league notices'}
                    </span>
                  </div>
                </div>

                <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] rounded-xs shrink-0">
                  +{PUSH_NOTIFICATION_REWARD_AMOUNT} SNS
                </span>
              </div>

              {/* 상태 식별 바 */}
              <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 border border-slate-200">
                <span className="text-[#201d1d]/70">
                  {language === 'ko' ? '현재 상태:' : 'Current Status:'}
                </span>
                {pushStatus.hasRegisteredToken ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Check size={12} /> {language === 'ko' ? '알림 켜짐 (토큰 등록 완료)' : 'Push Enabled'}
                  </span>
                ) : (
                  <span className="text-slate-600 font-medium">
                    {language === 'ko' ? '미등록 (알림 꺼짐)' : 'Not Registered'}
                  </span>
                )}
              </div>

              {/* 알림 메시지 (실패나 안내가 있을 때) */}
              {pushNotice && (
                <div className="p-2 bg-slate-100 border border-slate-300 text-[11px] text-[#201d1d] flex items-start gap-1.5">
                  <AlertCircle size={13} className="shrink-0 text-amber-600 mt-0.5" />
                  <span className="leading-tight">{pushNotice}</span>
                </div>
              )}

              {/* 액션 버튼 */}
              {isPushClaimed ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2 bg-slate-100 text-slate-500 font-bold text-xs border border-slate-300 rounded-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <Check size={14} className="text-emerald-600" />
                  <span>{language === 'ko' ? '✓ 수령 완료 (+100 SNS)' : '✓ Claimed (+100 SNS)'}</span>
                </button>
              ) : pushStatus.hasRegisteredToken ? (
                <button
                  type="button"
                  onClick={handleRegisterOrClaimPush}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Gift size={14} />
                  <span>{language === 'ko' ? '🎁 +100 SNS 보상 받기' : '🎁 Claim +100 SNS'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRegisterOrClaimPush}
                  disabled={isRegisteringPush}
                  className="w-full py-2 bg-[#201d1d] hover:bg-slate-800 active:scale-98 text-[#fdfcfc] font-black text-xs rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <BellRing size={14} />
                  <span>
                    {isRegisteringPush
                      ? (language === 'ko' ? '등록 처리 중...' : 'Registering...')
                      : (language === 'ko' ? '🔔 알림 켜고 +100 SNS 받기' : '🔔 Enable & Claim +100 SNS')}
                  </span>
                </button>
              )}
            </div>

            {/* 하단 옵션: 오늘 하루 보지 않기 & 닫기 */}
            <div className="flex items-center justify-between pt-2 border-t border-[#201d1d]/15 text-xs text-[#201d1d]/80">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={doNotShowToday}
                  onChange={(e) => setDoNotShowToday(e.target.checked)}
                  className="rounded-xs border-[#201d1d]/40 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px] sm:text-xs">
                  {language === 'ko' ? '오늘 하루 보지 않기' : 'Do not show today'}
                </span>
              </label>

              <button
                type="button"
                onClick={handleCloseModal}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-[#201d1d] font-bold text-xs rounded-xs cursor-pointer transition-colors"
              >
                {language === 'ko' ? '닫기' : 'Close'}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* iOS 홈 화면 추가 안내 모달 */}
      <IosPwaInstallGuideModal
        isOpen={isIosGuideOpen}
        onClose={() => setIsIosGuideOpen(false)}
        language={language}
      />
    </>
  );
};
