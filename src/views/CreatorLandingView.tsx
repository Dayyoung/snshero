import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, CheckCircle, AlertCircle, Copy, HelpCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '../lib/i18n';
import { Language } from '../types';
import {
  setCreatorCode,
  trackCreatorEvent,
  clearCreatorCode,
} from '../lib/referralTracking';
import {
  getCampaignByCode,
  getCampaignAvailability,
} from '../content/creatorCampaigns';

interface CreatorLandingViewProps {
  code: string;
  onNavigate: (view: string) => void;
  language: Language;
  sns: number;
  updateSns: (amount: number) => void;
  showCustomAlert: (title: string, desc: string) => void;
  lowSpecMode: boolean;
}

const helpSlides = (lang: Language) => [
  {
    title: lang === 'ko' ? '크리에이터 캠페인' : 'Creator Campaign',
    content: lang === 'ko'
      ? '크리에이터가 제공하는 특별 코드로 게임을 시작하면 다양한 혜택을 받을 수 있습니다.'
      : 'Start the game with a special code from a creator to receive various benefits.',
  },
  {
    title: lang === 'ko' ? '코드 적용' : 'Code Applied',
    content: lang === 'ko'
      ? '랜딩 페이지 방문 시 자동으로 코드가 적용되며, 코드 복사 버튼으로 친구에게 공유할 수 있습니다.'
      : 'The code is automatically applied when you visit the landing page. Use the copy button to share with friends.',
  },
  {
    title: lang === 'ko' ? '혜택' : 'Benefits',
    content: lang === 'ko'
      ? '적용된 코드에 따라 환영 SNS 코인, 전용 카드, 부스트 팩 등 다양한 혜택이 제공됩니다.'
      : 'Various benefits are provided based on the code, including welcome SNS coins, exclusive cards, and boost packs.',
  },
  {
    title: lang === 'ko' ? '게임 시작' : 'Play Now',
    content: lang === 'ko'
      ? '지금 플레이하기 버튼을 눌러 바로 게임을 시작하세요. 설치가 필요 없습니다.'
      : 'Click the Play Now button to start the game immediately. No installation required.',
  },
];

export function CreatorLandingView({
  code,
  onNavigate,
  language,
  sns,
  updateSns,
  showCustomAlert,
  lowSpecMode,
}: CreatorLandingViewProps) {
  const campaign = useMemo(() => getCampaignByCode(code), [code]);
  const availability = useMemo(
    () => (campaign ? getCampaignAvailability(campaign) : 'inactive'),
    [campaign],
  );
  const active = availability === 'active';
  const upcoming = availability === 'upcoming';

  const [codeApplied, setCodeApplied] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
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

  useEffect(() => {
    if (!campaign || availability !== 'active') {
      setCodeApplied(false);
      return;
    }

    setCreatorCode(campaign.code);
    trackCreatorEvent('landing_visit', campaign.code);
    setCodeApplied(true);
  }, [availability, campaign]);

  const handleCopyCode = () => {
    if (!campaign) return;
    navigator.clipboard.writeText(campaign.code).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handlePlayNow = () => {
    if (campaign && availability === 'active') {
      trackCreatorEvent('first_play', campaign.code);
    }
    onNavigate('main');
  };

  const handleGoHome = () => {
    onNavigate('home');
  };

  const handleClearCode = () => {
    clearCreatorCode();
    setCodeApplied(false);
    showCustomAlert(
      language === 'ko' ? '코드 초기화' : 'Code Cleared',
      language === 'ko'
        ? '적용된 크리에이터 코드가 초기화되었습니다.'
        : 'The applied creator code has been cleared.',
    );
  };

  const slides = helpSlides(language);

  // 존재하지 않는 코드
  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#faf8ff] text-slate-700 font-sans flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">
                {t('creator_not_found_title', language)}
              </h1>
              <button
                onClick={() => { setShowHelp(true); setHelpStep(0); }}
                className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors cursor-pointer shrink-0"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button
                onClick={handleGoHome}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {t('creator_btn_go_home', language)}
              </button>
              <button
                onClick={handlePlayNow}
                className="px-6 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/85 text-slate-700 font-semibold rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {t('play_game', language)}
              </button>
            </div>
          </div>
        </div>
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
                className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10"
              >
                <button
                  onClick={() => setShowHelp(false)}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} className="text-slate-400" />
                </button>
                <h3 className="text-lg font-extrabold text-slate-900 mb-4 pr-8">
                  {slides[helpStep].title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {slides[helpStep].content}
                </p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setHelpStep(Math.max(0, helpStep - 1))}
                    disabled={helpStep === 0}
                    className="p-2 rounded-full border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-xs text-slate-400 font-medium">
                    {helpStep + 1} / {slides.length}
                  </span>
                  <button
                    onClick={() => setHelpStep(Math.min(slides.length - 1, helpStep + 1))}
                    disabled={helpStep === slides.length - 1}
                    className="p-2 rounded-full border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
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
  }

  // 시작 전 / 만료된 코드
  if (!active) {
    return (
      <div className="min-h-screen bg-[#faf8ff] text-slate-700 font-sans flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">
                {upcoming
                  ? t('creator_upcoming_title', language)
                  : t('creator_expired_title', language)}
              </h1>
              <button
                onClick={() => { setShowHelp(true); setHelpStep(0); }}
                className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors cursor-pointer shrink-0"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button
                onClick={handleGoHome}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {t('creator_btn_go_home', language)}
              </button>
              <button
                onClick={handlePlayNow}
                className="px-6 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/85 text-slate-700 font-semibold rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {t('play_game', language)}
              </button>
            </div>
          </div>
        </div>
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
                className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10"
              >
                <button
                  onClick={() => setShowHelp(false)}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} className="text-slate-400" />
                </button>
                <h3 className="text-lg font-extrabold text-slate-900 mb-4 pr-8">
                  {slides[helpStep].title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {slides[helpStep].content}
                </p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setHelpStep(Math.max(0, helpStep - 1))}
                    disabled={helpStep === 0}
                    className="p-2 rounded-full border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-xs text-slate-400 font-medium">
                    {helpStep + 1} / {slides.length}
                  </span>
                  <button
                    onClick={() => setHelpStep(Math.min(slides.length - 1, helpStep + 1))}
                    disabled={helpStep === slides.length - 1}
                    className="p-2 rounded-full border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
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
  }

  // 활성 캠페인 랜딩 - 미니멀
  return (
    <div className="min-h-screen bg-[#faf8ff] text-slate-700 font-sans overflow-x-hidden flex flex-col">
      {/* Hero Section */}
      <header className="relative pt-16 pb-20 px-6 bg-gradient-to-b from-indigo-50/70 to-[#faf8ff] overflow-hidden">
        {!lowSpecMode && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />
          </div>
        )}

        <div className="max-w-lg mx-auto text-center relative z-10 space-y-6">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {t(campaign.landingHighlights.tagline, language)}
            </h1>
            <button
              onClick={() => { setShowHelp(true); setHelpStep(0); }}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors cursor-pointer shrink-0"
            >
              <HelpCircle size={16} />
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={handlePlayNow}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={20} />
              {t('creator_btn_play_now', language)}
            </button>
            <button
              onClick={handleGoHome}
              className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold text-base rounded-2xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              {t('creator_btn_go_home', language)}
            </button>
          </div>
        </div>
      </header>

      {/* Code Applied Status */}
      <section className="px-6 py-4">
        <div className="max-w-lg mx-auto">
          <div
            className={`p-4 rounded-2xl border ${
              codeApplied
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {codeApplied ? (
                  <CheckCircle size={20} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={20} className="text-slate-500" />
                )}
                <span className="text-sm font-bold text-slate-800">
                  {codeApplied
                    ? campaign.code
                    : t('creator_code_pending_title', language)}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
              >
                {copySuccess ? (
                  <CheckCircle size={16} className="text-emerald-500" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
            {codeApplied && (
              <button
                onClick={handleClearCode}
                className="mt-3 text-xs text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                {t('creator_clear_code', language)}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex flex-wrap gap-2">
            {campaign.benefits.map((benefitKey) => (
              <span
                key={benefitKey}
                className="px-3 py-1.5 bg-white rounded-lg border border-slate-100 text-sm font-bold text-slate-700"
              >
                {t(benefitKey, language)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-8 mt-auto">
        <div className="max-w-lg mx-auto text-center">
          <button
            onClick={handlePlayNow}
            className="w-full px-8 py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Play size={22} />
            {t('creator_btn_play_now', language)}
          </button>
        </div>
      </section>

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
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10"
            >
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} className="text-slate-400" />
              </button>
              <h3 className="text-lg font-extrabold text-slate-900 mb-4 pr-8">
                {slides[helpStep].title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {slides[helpStep].content}
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setHelpStep(Math.max(0, helpStep - 1))}
                  disabled={helpStep === 0}
                  className="p-2 rounded-full border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs text-slate-400 font-medium">
                  {helpStep + 1} / {slides.length}
                </span>
                <button
                  onClick={() => setHelpStep(Math.min(slides.length - 1, helpStep + 1))}
                  disabled={helpStep === slides.length - 1}
                  className="p-2 rounded-full border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
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
}
