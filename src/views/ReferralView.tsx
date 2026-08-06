import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Link,
  Copy,
  Share2,
  UserPlus,
  Users,
  Clock,
  CheckCircle,
  CopyCheck,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { t } from '../lib/i18n';
import type { Language } from '../types';
import {
  initMyReferralCode,
  generateReferralLink,
  getReferralStatus,
  buildReferralShareCopy,
  type ReferralStatus,
} from '../lib/referral';
import { cn } from '../lib/utils';
import { ShareTemplateCard } from '../components/ShareTemplateCard';

interface ReferralViewProps {
  language: Language;
  playSfx: (url: string) => void;
  user: { uid: string; displayName?: string | null } | null;
  lowSpecMode?: boolean;
  showCustomAlert?: (title: string, message: string) => void;
}

// Help steps for Referral
const HELP_STEPS = (language: Language) => [
  {
    title: language === 'ko' ? '초대 방법' : 'How to Invite',
    body: language === 'ko'
      ? '내 초대 코드 또는 링크를 복사해 친구에게 공유하세요.\n공유 템플릿을 사용하면 더 쉽게 초대할 수 있습니다.'
      : 'Copy your referral code or link and share it with friends.\nUse the share template for easier invites.',
  },
  {
    title: language === 'ko' ? '보상 지급' : 'Rewards',
    body: language === 'ko'
      ? '친구가 가입 후 튜토리얼을 완료하면 보상이 준비됩니다.\n서버 검증 후 SNS 포인트와 특별 카드가 지급됩니다.\n부정 행위는 무효 처리됩니다.'
      : 'Rewards are prepared when a friend signs up and completes the tutorial.\nSNS Points + Special Card are granted after server verification.\nFraudulent activity will be invalidated.',
  },
  {
    title: language === 'ko' ? '초대 현황' : 'Status',
    body: language === 'ko'
      ? '초대한 친구: 링크로 유입된 총 친구 수\n완료 대기: 튜토리얼 진행 중인 친구\n지급 완료: 보상이 지급된 친구'
      : 'Invited: total friends who joined via your link\nPending: friends still in tutorial\nCompleted: friends whose rewards have been granted',
  },
];

export const ReferralView: React.FC<ReferralViewProps> = ({
  language,
  playSfx,
  user,
  lowSpecMode = false,
  showCustomAlert,
}) => {
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [status, setStatus] = useState<ReferralStatus>({
    invitedCount: 0,
    pendingCount: 0,
    completedCount: 0,
    invitees: [],
  });
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [isShareTemplateOpen, setIsShareTemplateOpen] = useState(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelpPopup) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelpPopup]);

  const [helpStep, setHelpStep] = useState(0);

  // Initialize referral code from user uid
  useEffect(() => {
    if (!user?.uid) return;
    const code = initMyReferralCode(user.uid);
    setReferralCode(code);
    setReferralLink(generateReferralLink(code));
  }, [user]);

  // Load referral status
  useEffect(() => {
    setStatus(getReferralStatus());
  }, []);

  const handleCopy = useCallback(
    (type: 'code' | 'link') => {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      const text = type === 'code' ? referralCode : referralLink;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(type);
          setTimeout(() => setCopied(null), 2000);
          if (showCustomAlert) {
            showCustomAlert(
              t('referral_copied_title', language),
              t('referral_copied_desc', language),
            );
          }
        }).catch(() => {
          // fallback copy
          fallbackCopy(text, type);
        });
      } else {
        fallbackCopy(text, type);
      }
    },
    [referralCode, referralLink, language, playSfx, showCustomAlert],
  );

  const fallbackCopy = (text: string, type: 'code' | 'link') => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
    document.body.removeChild(textarea);
  };

  const handleShare = useCallback(() => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    const shareData = buildReferralShareCopy(referralCode, language);
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: shareData.intro,
        text: shareData.caption,
        url: referralLink,
      }).catch(() => {});
    } else if (showCustomAlert) {
      showCustomAlert(
        t('referral_share_title', language),
        shareData.caption,
      );
    }
  }, [referralCode, referralLink, language, playSfx, showCustomAlert]);

  const helpSteps = HELP_STEPS(language);

  if (!user || !user.uid || user.uid === 'guest-id') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <UserPlus size={36} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">
          {t('referral_login_required', language)}
        </h2>
        <p className="text-sm text-slate-500 max-w-xs">
          {t('referral_login_desc', language)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pb-6 font-sans">
      {/* Header — minimal: title + ? help button */}
      <div className="px-4 pt-6 pb-3 flex items-center gap-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('referral_title', language)}
          </h1>
        </motion.div>
        <button
          type="button"
          onClick={() => { setShowHelpPopup(true); setHelpStep(0); }}
          className="min-h-11 min-w-11 flex items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:border-slate-900 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all touch-target cursor-pointer"
          aria-label={language === 'ko' ? '도움말' : 'Help'}
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Referral Code Section — minimal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mx-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100"
      >
        {/* Code Display */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-white rounded-lg border border-indigo-200 px-4 py-3 font-mono text-lg font-bold tracking-widest text-slate-800 text-center select-all">
            {referralCode}
          </div>
          <button
            onClick={() => handleCopy('code')}
            className={cn(
              'p-3 rounded-lg transition-all active:scale-95 cursor-pointer touch-target',
              copied === 'code'
                ? 'bg-green-500 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700',
            )}
            title={t('referral_copy_code', language)}
          >
            {copied === 'code' ? <CopyCheck size={20} /> : <Copy size={20} />}
          </button>
        </div>

        {/* Link Display */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-white rounded-lg border border-indigo-200 px-3 py-2.5 text-xs text-slate-600 truncate select-all">
            {referralLink}
          </div>
          <button
            onClick={() => handleCopy('link')}
            className={cn(
              'p-3 rounded-lg transition-all active:scale-95 cursor-pointer touch-target',
              copied === 'link'
                ? 'bg-green-500 text-white'
                : 'bg-slate-700 text-white hover:bg-slate-800',
            )}
            title={t('referral_copy_link', language)}
          >
            {copied === 'link' ? <CopyCheck size={20} /> : <Copy size={20} />}
          </button>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={handleShare}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 touch-target"
          >
            <Share2 size={18} />
            <span>{t('referral_share_btn', language)}</span>
          </button>
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setIsShareTemplateOpen(true);
            }}
            className="w-full py-3 bg-white text-indigo-700 font-bold rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-all active:scale-[0.98] cursor-pointer shadow-sm flex items-center justify-center gap-2 touch-target"
          >
            <Link size={18} />
            <span>{t('share_template_referral', language)}</span>
          </button>
        </div>
      </motion.div>

      {/* Referral Status — minimal: icons + numbers only */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mx-4 mt-4 p-4 bg-white rounded-xl border border-slate-200"
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
            <UserPlus size={20} className="mx-auto text-indigo-500 mb-1" />
            <div className="text-xl font-black text-slate-800">{status.invitedCount}</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
            <Clock size={20} className="mx-auto text-amber-500 mb-1" />
            <div className="text-xl font-black text-slate-800">{status.pendingCount}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
            <CheckCircle size={20} className="mx-auto text-green-500 mb-1" />
            <div className="text-xl font-black text-slate-800">{status.completedCount}</div>
          </div>
        </div>
      </motion.div>

      {/* Invitees List */}
      {status.invitees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mx-4 mt-4 p-4 bg-white rounded-xl border border-slate-200"
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {status.invitees.map((invitee) => (
              <div
                key={`${invitee.name}-${invitee.timestamp}`}
                className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                    {invitee.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {invitee.name}
                  </span>
                </div>
                <span className="text-sm shrink-0">
                  {invitee.status === 'completed' ? '✓' : '⏳'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {isShareTemplateOpen && (
          <ShareTemplateCard
            templateType="referral"
            language={language}
            referralCode={referralCode}
            referralLink={referralLink}
            lowSpecMode={lowSpecMode}
            onClose={() => setIsShareTemplateOpen(false)}
            showToast={(msg) => {
              if (showCustomAlert) {
                showCustomAlert(language === 'ko' ? '알림' : 'Notice', msg);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelpPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowHelpPopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 sticky top-0 z-10 bg-white pt-2">
                <div className="space-y-2">
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    {t('referral_title', language)}
                  </span>
                  <h3 className="text-lg font-black tracking-tight text-slate-900">
                    {helpSteps[helpStep].title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpPopup(false)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 touch-target"
                  aria-label={language === 'ko' ? '닫기' : 'Close'}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                <p className="text-sm font-semibold leading-relaxed whitespace-pre-line text-slate-700">
                  {helpSteps[helpStep].body}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                <span>{helpStep + 1} / {helpSteps.length}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setHelpStep((prev) => Math.max(prev - 1, 0))}
                  disabled={helpStep === 0}
                  className={cn(
                    'min-h-11 rounded-2xl border px-3 py-2 text-sm font-bold transition touch-target',
                    helpStep === 0
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
                  )}
                >
                  <ChevronLeft size={16} className="mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowHelpPopup(false)}
                  className="min-h-11 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 touch-target"
                >
                  {language === 'ko' ? '닫기' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (helpStep === helpSteps.length - 1) {
                      setShowHelpPopup(false);
                      return;
                    }
                    setHelpStep((prev) => Math.min(prev + 1, helpSteps.length - 1));
                  }}
                  className="min-h-11 rounded-2xl border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95 touch-target"
                >
                  {helpStep === helpSteps.length - 1
                    ? (language === 'ko' ? '완료' : 'Done')
                    : <ChevronRight size={16} className="mx-auto" />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom spacer for navbar */}
      <div className="h-6 shrink-0" />
    </div>
  );
};
