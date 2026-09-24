import React, { useState, useEffect } from 'react';
import { ArrowLeft, HelpCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '../lib/i18n';
import { Language } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface BoostViewProps {
  onNavigate: (view: string) => void;
  language: Language;
  sns: number;
  updateSns: (amount: number) => void;
  showCustomAlert: (title: string, desc: string) => void;
}

export function BoostView({ onNavigate, language, sns, updateSns, showCustomAlert }: BoostViewProps) {
  const [activeTab, setActiveTab] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube');
  const [linkInput, setLinkInput] = useState('');
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

  const handleStartBoosting = () => {
    if (!linkInput.trim()) {
      showCustomAlert(
        language === 'ko' ? '알림' : 'Notice',
        language === 'ko' ? '부스팅할 게시물 링크를 입력해 주세요.' : 'Please enter a post link first.'
      );
      return;
    }

    showCustomAlert(
      language === 'ko' ? '부스팅 신청 완료' : 'Boosting Requested',
      language === 'ko'
        ? '부스팅 대기열에 등록되었습니다. 실제 유저 유입에 최대 24시간이 소요될 수 있습니다!'
        : 'Successfully registered in the boosting queue. Actual engagement may take up to 24 hours!'
    );
    setLinkInput('');
  };

  const pricingData = {
    youtube: [
      { type: t('boost_table_row_views', language), price: '₩4,500' },
      { type: t('boost_table_row_likes', language), price: '₩2,900' },
      { type: t('boost_table_row_subscribers', language), price: '₩25,000' }
    ],
    instagram: [
      { type: language === 'ko' ? '인스타그램 실제 팔로워' : 'Instagram Real Followers', price: '₩8,900' },
      { type: language === 'ko' ? '인스타그램 한국인 좋아요' : 'Instagram Korean Likes', price: '₩1,800' },
      { type: language === 'ko' ? '인스타그램 릴스 조회수' : 'Instagram Reels Views', price: '₩900' }
    ],
    tiktok: [
      { type: language === 'ko' ? '틱톡 고품질 조회수' : 'TikTok High-Quality Views', price: '₩700' },
      { type: language === 'ko' ? '틱톡 리얼 팔로워' : 'TikTok Real Followers', price: '₩9,900' },
      { type: language === 'ko' ? '틱톡 영상 하트' : 'TikTok Video Hearts', price: '₩2,200' }
    ]
  };

  const helpSlides = [
    language === 'ko'
      ? '부스팅할 SNS 게시물 링크를 입력하고 "부스팅 시작"을 누르면 등록됩니다. YouTube, Instagram, TikTok 중 원하는 플랫폼을 선택하세요.'
      : 'Enter your SNS post link and click "Start Boosting" to register. Choose YouTube, Instagram, or TikTok.',
    language === 'ko'
      ? '모든 부스팅은 실제 유저 기반으로 안전하게 진행됩니다. 부스팅 완료까지 최대 24시간이 소요될 수 있습니다.'
      : 'All boosting is done with real users safely. Delivery may take up to 24 hours.'
  ];

  return (
    <div className="min-h-screen bg-[#faf8ff] text-slate-700 font-sans overflow-x-hidden flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-indigo-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => onNavigate('home')}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer text-slate-700 hover:bg-slate-100"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-sm font-extrabold uppercase tracking-wide text-center text-slate-800">
          Boost
        </h1>
        <button
          onClick={() => { setShowHelp(true); setHelpSlide(0); }}
          className="w-10 h-10 rounded-full border border-slate-300 bg-white/80 text-slate-600 flex items-center justify-center transition-all hover:border-slate-400 hover:bg-white hover:text-slate-800 active:scale-95 cursor-pointer"
          aria-label="Help"
        >
          <HelpCircle size={16} />
        </button>
      </div>

      {/* Input Section */}
      <div className="max-w-2xl mx-auto w-full px-4 py-10 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-3.5 px-4 text-slate-800 placeholder:text-slate-400 outline-none transition-all text-sm"
            placeholder={t('boost_input_placeholder', language)}
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
          />
          <button
            onClick={handleStartBoosting}
            className="sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] cursor-pointer shadow-sm whitespace-nowrap"
          >
            {t('boost_btn_start', language)}
          </button>
        </div>
      </div>

      {/* Platform Tabs + Pricing */}
      <div className="max-w-4xl mx-auto w-full px-4 pb-16">
        <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm overflow-hidden">
          <div className="p-4 flex justify-center">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveTab('youtube')}
                className={`px-6 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${activeTab === 'youtube' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
              >
                YouTube
              </button>
              <button
                onClick={() => setActiveTab('instagram')}
                className={`px-6 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${activeTab === 'instagram' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
              >
                Instagram
              </button>
              <button
                onClick={() => setActiveTab('tiktok')}
                className={`px-6 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${activeTab === 'tiktok' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
              >
                TikTok
              </button>
            </div>
          </div>

          <div className="px-4 pb-4 space-y-1">
            {pricingData[activeTab].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="text-sm font-bold text-slate-700">{item.type}</span>
                <span className="text-sm font-extrabold text-slate-900">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
                <h3 className="font-bold text-sm text-slate-800">Boost</h3>
              </div>
              <div className="min-h-[80px] flex flex-col justify-center text-sm text-slate-600 leading-relaxed mb-4">
                <p>{helpSlides[helpSlide]}</p>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setHelpSlide((s) => Math.max(0, s - 1))}
                  disabled={helpSlide === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[10px] font-bold text-slate-400">{helpSlide + 1} / {helpSlides.length}</span>
                <button
                  onClick={() => setHelpSlide((s) => Math.min(helpSlides.length - 1, s + 1))}
                  disabled={helpSlide === helpSlides.length - 1}
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
}
