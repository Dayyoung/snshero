import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, Play, HelpCircle, X, ChevronLeft, ChevronRight, MessageCircle, ExternalLink } from 'lucide-react';
import { t } from '../lib/i18n';
import { Language, ViewType } from '../types';
import { captureWeb3Referrer } from '../lib/web3Tracking';

interface Web3LandingViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  lowSpecMode?: boolean;
}

const helpSlides = (lang: Language) => [
  {
    title: lang === 'ko' ? 'Web3 SNSHero' : 'Web3 SNSHero',
    content: lang === 'ko'
      ? 'SNSHero는 블록체인 기반 카드 배틀 게임입니다. 브라우저에서 바로 플레이할 수 있으며, 별도 지갑 연결 없이 시작할 수 있습니다.'
      : 'SNSHero is a blockchain-based card battle game. Play directly in your browser with no wallet connection required.',
  },
  {
    title: lang === 'ko' ? '암호화폐 결제' : 'Crypto Payments',
    content: lang === 'ko'
      ? 'BTC, ETH, USDC로 굿즈와 카드팩을 구매할 수 있습니다. 모든 거래는 온체인에서 투명하게 관리됩니다.'
      : 'Purchase goods and card packs with BTC, ETH, and USDC. All transactions are transparently managed on-chain.',
  },
  {
    title: lang === 'ko' ? '시작하기' : 'Getting Started',
    content: lang === 'ko'
      ? '코드를 입력하고, 덱을 구성한 뒤 배틀에 참여하세요. 승리할 때마다 SNS 토큰을 획득할 수 있습니다.'
      : 'Enter your code, build your deck, and join battles. Earn SNS tokens with every victory.',
  },
];

export const Web3LandingView: React.FC<Web3LandingViewProps> = ({
  language,
  onNavigate,
  lowSpecMode = false,
}) => {
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
    captureWeb3Referrer();
  }, []);

  const heroAnim = lowSpecMode
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      };

  const handlePlay = () => {
    onNavigate('home');
  };

  const slides = helpSlides(language);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/30 font-sans">
      {/* Header */}
      <header className="h-16 flex items-center justify-between border-b border-slate-100 px-4 md:px-6 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <span className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
            SNSHero
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowHelp(true); setHelpStep(0); }}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors cursor-pointer shrink-0"
          >
            <HelpCircle size={16} />
          </button>
          <button
            onClick={handlePlay}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer text-sm"
          >
            {t('web3_landing_play_now', language)}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative px-4 md:px-6 py-12 md:py-20 max-w-3xl mx-auto text-center">
          <motion.div {...heroAnim}>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-6 leading-tight">
              {t('web3_landing_hero_title', language)}
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handlePlay}
                className="px-6 py-3 bg-white hover:bg-slate-50 text-indigo-700 font-bold rounded-xl shadow-lg shadow-black/10 hover:shadow-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                {t('web3_landing_play_now', language)}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Community Links */}
      <div className="flex items-center justify-center gap-3 py-8 px-4">
        <a
          href="https://reddit.com/r/SNSHero"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors cursor-pointer"
          aria-label="Reddit"
        >
          <MessageCircle size={18} />
        </a>
        <a
          href="https://discord.gg/snshero"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors cursor-pointer"
          aria-label="Discord"
        >
          <ExternalLink size={18} />
        </a>
      </div>

      {/* CTA Footer */}
      <section className="px-4 md:px-6 py-8 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <button
            onClick={handlePlay}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            {t('web3_landing_start_game', language)}
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
};
