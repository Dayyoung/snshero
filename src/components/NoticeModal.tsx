import React, { useState, useEffect } from 'react';
import { Sparkles, X, Megaphone, BellRing, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { t } from '../lib/i18n';
import { triggerHaptic } from '../lib/haptic';

interface NoticeModalProps {
  language: Language;
  onNavigate?: (view: any) => void;
  onClose?: () => void;
}

const NOTICE_DISMISSED_KEY = 'snshero_notice_dismissed_at';

export const NoticeModal: React.FC<NoticeModalProps> = ({ language, onNavigate, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [doNotShowToday, setDoNotShowToday] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(NOTICE_DISMISSED_KEY);
    if (dismissedAt) {
      const timePassed = Date.now() - parseInt(dismissedAt, 10);
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      if (timePassed < TWENTY_FOUR_HOURS) {
        onClose?.();
        return; // Suppress notice for 24 hours
      }
    }
    // Auto trigger on initial load if not dismissed
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    triggerHaptic('light');
    if (doNotShowToday) {
      localStorage.setItem(NOTICE_DISMISSED_KEY, Date.now().toString());
    }
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md rounded-2xl border-2 border-amber-500/30 bg-slate-900 p-5 text-white shadow-2xl overflow-hidden"
        >
          {/* Top Banner Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

          {/* Header */}
          <div className="flex items-center justify-between pt-1 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Megaphone size={18} className="animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  {language === 'ko' ? '시즌 1 라이브 공지' : 'SEASON 1 NOTICE'}
                </span>
                <h3 className="font-mono text-base font-extrabold text-white">
                  {language === 'ko' ? 'SNS히어로 신규 업데이트' : 'SNSHero Major Update'}
                </h3>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="py-4 space-y-3 font-mono text-xs text-slate-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Sparkles size={14} />
                <span>{language === 'ko' ? '시즌 1 랭킹전 오픈!' : 'Season 1 Ranked Match Open!'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'ko'
                  ? '최대 50,000 SNS 포인트와 시즌 한정 트로피 배지에 도전하세요. 신규 AFK 방치 탐색 및 스토리 소탕 기능이 추가되었습니다.'
                  : 'Compete for up to 50,000 SNS Points and exclusive trophy badges. New AFK Patrol and Stage Sweep features added!'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span>🎁 {language === 'ko' ? '출석 보상' : 'Daily Login Gift'}</span>
                <span className="text-emerald-400">+1,000 SNS</span>
              </div>
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span>⚔️ {language === 'ko' ? '초보자 미션' : 'Beginner Roadmap'}</span>
                <span className="text-amber-400">{language === 'ko' ? 'SSR 카드팩' : 'SSR Pack'}</span>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={doNotShowToday}
                onChange={(e) => setDoNotShowToday(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-[11px] font-mono text-slate-400 font-semibold">
                {language === 'ko' ? '오늘 하루 다시 보지 않기' : 'Do not show again today'}
              </span>
            </label>

            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-mono text-xs font-bold shadow-md transition-all active:scale-95"
            >
              {language === 'ko' ? '확인' : 'Confirm'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
