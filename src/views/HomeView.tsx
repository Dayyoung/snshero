import React, { useState, useEffect } from 'react';
import { LogOut, Trophy, User, HelpCircle, BookOpen, Play, Newspaper, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { t } from "../lib/i18n";
import { cn } from "../lib/utils";
import { CardData, Language, ViewType, EquipmentSlot } from "../types";
import { CARD_DATABASE } from "../cardDatabase";
import { CardItem } from "../components/CardItem";
import { INITIAL_SKILLS } from "../constants";
import { useGameSettings } from "../contexts/GameSettingsContext";
import { usePerformanceMode } from "../hooks/usePerformanceMode";

const getCardAvatarStyle = (avatar: string): React.CSSProperties => {
  const cardId = Number(avatar.split(':')[1]) || 1;
  const idx = CARD_DATABASE[cardId] ? cardId : 1;
  const x = ((idx - 1) % 10) * (100 / 9);
  const y = Math.floor((idx - 1) / 10) * (100 / 10);
  return {
    backgroundImage: `url('/card100.png')`,
    backgroundSize: '1000% 1100%',
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated'
  };
};

interface HomeViewProps {
  playSfx: (url: string) => void;
  bgmStarted: boolean;
  startAudio: () => void;
  totalPower: number;
  currentDeck: CardData[];
  currentSeason?: string;
  onNavigate: (view: ViewType) => void;
  language: Language;
  user: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  handleLogin: (email?: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  showRulesBtn?: boolean;
  onStartTutorial?: () => void;
  isTutorialCompleted?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  playSfx,
  totalPower,
  currentDeck,
  onNavigate,
  language,
  user,
  handleLogin,
  handleLogout,
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const { lowSpecMode } = useGameSettings();
  const perf = usePerformanceMode();

  // Help popup state
  const [helpOpen, setHelpOpen] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (helpOpen) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [helpOpen]);

  const [helpStep, setHelpStep] = useState(0);

  const helpSlides = React.useMemo(() => [
    {
      title: language === 'ko' ? '덱 미리보기' : 'Deck Preview',
      body: language === 'ko'
        ? '현재 선택된 5장의 대표 카드가 중앙에 표시됩니다. 각 카드의 N/E/S/W 스탯, 장비 장착 여부(목걸이·반지·신발), 보유 스킬을 작은 아이콘으로 확인할 수 있습니다.'
        : 'Your 5 representative cards are displayed in the center. Check each card\'s N/E/S/W stats, equipment status (necklace, rings, boots), and owned skills via small icons.',
    },
    {
      title: language === 'ko' ? '공식 웹소설' : 'Official Web Novel',
      body: language === 'ko'
        ? '눈히어로: 카단과 아케인의 메아리 — 평범하고 우직한 청년 카단이 아케인 대륙의 11개 종족을 모험하며 힘을 일깨우고 위대한 영웅으로 거듭나는 정통 모험 판타지입니다. 매주 새로운 회차가 연재됩니다.'
        : 'SNSHero: Kadan & Arcane Echoes — a classic adventure fantasy following the simple yet determined youth Kadan as he explores 11 races across the Arcane continent, awakening his power to become a legendary hero. New chapters weekly.',
    },
    {
      title: language === 'ko' ? '신원 확인 및 로그인' : 'Identity & Login',
      body: language === 'ko'
        ? 'Google 계정으로 로그인하면 데이터가 클라우드에 안전하게 백업됩니다. 게스트 모드로도 업적과 프로필을 확인할 수 있으며, 로그인 후에는 프로필 편집과 기기 간 데이터 동기화가 가능합니다.'
        : 'Sign in with Google to safely back up your data to the cloud. You can also browse achievements and profile in guest mode. After logging in, you can edit your profile and sync data across devices.',
    },
  ], [language]);

  const deckPreview = currentDeck.length > 0 ? currentDeck : [1, 11, 31, 51, 101];

  const clickCountRef = React.useRef(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const onLoginClick = () => {
    if (isLoggingIn) return;
    
    playSfx(
      "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    );
    
    clickCountRef.current += 1;
    
    if (!timerRef.current) {
      timerRef.current = setTimeout(async () => {
        const finalCount = clickCountRef.current;
        clickCountRef.current = 0;
        timerRef.current = null;
        
        setIsLoggingIn(true);
        try {
          let email: string | undefined = undefined;
          if (finalCount === 2) email = 'dryudryu2@gmail.com';
          else if (finalCount >= 3) email = 'dryudryu3@gmail.com';
          
          await handleLogin(email);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoggingIn(false);
        }
      }, 1000);
    }
  };

  const sectionMotionProps = perf.reducedMotion
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
  const buttonMotionProps = perf.reducedMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };


  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-6 md:p-8 pb-32 max-w-6xl mx-auto min-h-screen app-bg justify-start text-slate-800 font-sans">
      {/* ── Header: Card Display + Title ── */}
      <header className="grid grid-cols-1 gap-4 sm:gap-6 items-stretch w-full pt-2">
        <div className="relative min-h-[310px] sm:min-h-[360px] overflow-hidden rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#201d1d]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(15,0,0,0.02)_1px,transparent_1px)] bg-[size:28px_28px]" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 py-8 sm:p-8">
            <div className="relative h-44 sm:h-56 md:h-64 w-full flex items-center justify-center overflow-visible pointer-events-none select-none">
              {deckPreview.map((item, index) => {
              const isDatabaseId = typeof item === 'number';
              const id = isDatabaseId ? item : (item as CardData).imageIndex;
              const cardData = isDatabaseId ? CARD_DATABASE[id] : item;
              const rotation = (index - 2) * 5;
              const xOffset = (index - 2) * (typeof window !== 'undefined' && window.innerWidth < 640 ? 24 : 35);
              const yOffset = Math.abs(index - 2) * (typeof window !== 'undefined' && window.innerWidth < 640 ? 5 : 8);

              if (!cardData) return null;

              const displayCard = isDatabaseId ? {
                id: `home-card-${id}`,
                title_dis: (cardData as any).title_dis,
                stats: (cardData as any).stats,
                imageIndex: id,
                rarity: (cardData as any).rarity,
                level: (cardData as any).level,
                owner: null,
              } : item;

              return (
                <motion.div
                  key={isDatabaseId ? id : (item as CardData).id}
                  className="absolute flex flex-col items-center gap-1"
                  style={{
                    transform: `translateX(${xOffset}px) translateY(${yOffset}px) rotate(${rotation}deg)`,
                    zIndex: index + 10,
                  }}
                >
                  <div className="relative overflow-hidden rounded-lg">
                    <CardItem
                      card={displayCard as CardData}
                      className="w-20 h-28 sm:w-28 sm:h-40 md:w-32 md:h-44 shadow-2xl rounded-lg"
                    />
                    
                    {/* Stats Summary Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-1 rounded-b-lg border-t border-slate-200 opacity-100">
                      <div className="grid grid-cols-4 gap-0.5">
                        {(['N', 'E', 'S', 'W'] as const).map((dir, statIdx) => (
                          <div key={dir} className="flex flex-col items-center rounded bg-slate-50 px-0.5 py-0.5 ring-1 ring-slate-200">
                            <span className="text-[5px] font-black text-slate-500 leading-none">{dir}</span>
                            <span className="text-[8px] font-black text-slate-950 leading-none mt-0.5">{(displayCard as CardData).stats[statIdx]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Indicators */}
                  <div className="flex flex-col items-center gap-0.5 mt-1 transition-opacity translate-y-0 text-center">
                    <div className="flex gap-0.5">
                      {['necklace', 'ring1', 'ring2', 'boots'].map(slot => (
                        <div 
                          key={slot}
                          className={cn(
                            "w-1 h-1 rounded-full",
                            (displayCard as CardData).equipment?.[slot as EquipmentSlot]
                              ? cn("bg-yellow-400", lowSpecMode ? "" : "animate-pulse")
                              : "bg-slate-200"
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap justify-center gap-0.5 max-w-[40px]">
                      {INITIAL_SKILLS.filter(baseSkill => {
                         const skill = (displayCard as CardData).skills?.find(s => s.id === baseSkill.id);
                         return (skill?.level || 0) > 0;
                      }).map(baseSkill => (
                        <div
                          key={baseSkill.id}
                          className={cn(
                            "w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_2px_rgba(34,211,238,0.5)]",
                            lowSpecMode ? "" : "animate-pulse"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
              })}
            </div>

            <div className="text-center overflow-visible px-2">
              <h1 id="main-logo" className="text-3xl sm:text-4xl md:text-5xl font-extrabold italic tracking-tight flex items-baseline justify-center mx-auto select-none font-sans whitespace-nowrap">
                <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent pr-1">
                  S&amp;SHERO
                </span>
                <span className="text-slate-900 text-base sm:text-xl not-italic">.com</span>
                <button
                  onClick={() => { setHelpOpen(true); setHelpStep(0); }}
                  className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 transition shrink-0"
                  aria-label={language === 'ko' ? '도움말' : 'Help'}
                >
                  <HelpCircle size={14} />
                </button>
              </h1>
            </div>
          </div>
        </div>

        {/* ── Quick Play CTA ── */}
        <motion.button
          {...buttonMotionProps}
          onClick={() => {
            playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
            onNavigate("ranking");
          }}
          className="w-full h-14 sm:h-16 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold text-base sm:text-lg rounded-sm hover:from-indigo-700 hover:to-fuchsia-700 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-3 touch-target"
        >
          <Play size={22} className="shrink-0" />
          <span>{t("home_play_now", language)}</span>
          <ArrowRight size={18} className="shrink-0 opacity-60" />
        </motion.button>

        {/* ── Official Web Novel (big CTA) ── */}
        <motion.button
          {...buttonMotionProps}
          onClick={() => {
            playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
            onNavigate("novel");
          }}
          className="w-full h-14 sm:h-16 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base sm:text-lg rounded-sm hover:from-blue-700 hover:to-blue-600 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-3 touch-target"
        >
          <BookOpen size={22} className="shrink-0" />
          <span>{language === 'ko' ? "소설 읽기" : "Read Novel"}</span>
          <ArrowRight size={18} className="shrink-0 opacity-60" />
        </motion.button>
      </header>



      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {(!user || user.uid === 'guest-id') ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Google Login Button */}
              <button
                onClick={onLoginClick}
                disabled={isLoggingIn}
                className={cn(
                  "w-full h-14 sm:h-16 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-3 sm:p-4 flex items-center justify-center gap-3 sm:gap-4 active:scale-[0.98] transition-all group touch-target rounded-sm cursor-pointer",
                  isLoggingIn && "opacity-50 cursor-not-allowed"
                )}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform shrink-0">
                  <path
                    fill="#EA4335"
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.36-2.12 4.36-1.12.88-2.6 1.48-5.72 1.48-4.8 0-8.72-3.88-8.72-8.72s3.92-8.72 8.72-8.72c2.6 0 4.56 1.04 5.96 2.32l2.32-2.32c-2.12-2.04-4.92-3.2-8.28-3.2C5.36 0 0 5.36 0 12s5.36 12 12 12c3.56 0 6.24-1.16 8.36-3.32 2.12-2.12 2.84-5.2 2.84-7.76 0-.56-.04-1.12-.12-1.64h-10.6z"
                  />
                </svg>
                <span className="font-bold text-[#201d1d] text-base sm:text-lg uppercase tracking-tight font-mono">
                  {language === 'ko' ? 'Google 로그인' : 'Google Login'}
                </span>
              </button>

              <button
                onClick={() => {
                  playSfx(
                    "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
                  );
                  onNavigate("profile");
                }}
                className="w-full bg-[#201d1d] text-[#fdfcfc] p-4.5 flex items-center justify-between active:scale-[0.98] transition-all border border-[rgba(15,0,0,0.12)] group touch-target rounded-sm cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Trophy size={20} className="text-amber-400 shrink-0" />
                  <div className="text-left font-mono">
                    <p className="text-xs sm:text-sm font-bold uppercase">
                      {language === "ko"
                        ? "업적 및 프로필"
                        : "Achievements & Profile"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400">
                    {totalPower.toLocaleString()} P
                  </span>
                  <span className="text-lg sm:text-xl opacity-60">➔</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="!p-4 border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] flex items-center justify-between gap-3 rounded-none">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-sm p-1 text-left transition-all group touch-target hover:bg-[#f8f7f7] active:scale-[0.99]"
                  onClick={() => {
                    playSfx(
                      "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
                    );
                    onNavigate("profile");
                  }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/10 bg-slate-800 flex-shrink-0">
                      {user.photoURL?.startsWith('card:') ? (
                        <div className="w-full h-full scale-125" style={getCardAvatarStyle(user.photoURL)} />
                      ) : user.photoURL?.startsWith('preset:') ? (
                        <img 
                          src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Hero-${user.photoURL.split(':')[1]}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      ) : user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-30">
                          <User size={16} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 font-mono">
                      <p className="text-xs sm:text-sm font-bold truncate">
                        {user.displayName || user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between pr-2 font-mono">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-xs sm:text-sm font-bold tracking-tight text-amber-400 truncate"
                        title={totalPower.toLocaleString()}
                      >
                        {totalPower.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2.5 hover:bg-[#f8f7f7] text-[#646262] hover:text-[#201d1d] transition-colors border border-[rgba(15,0,0,0.12)] rounded-sm shrink-0 touch-target cursor-pointer"
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {showPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-0 md:p-6 animate-in fade-in duration-200">
          <div className="relative w-full h-full md:max-w-6xl md:max-h-[92vh] bg-slate-950 md:rounded-2xl overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            {/* iframe */}
            <iframe
              src="/snshero_part1.pdf"
              title="SNSHero Part 1 PDF"
              className="w-full h-full border-none"
            />
            
            {/* 우측 하단 닫기 버튼 */}
            <div className="absolute bottom-6 right-6 z-10">
              <button
                onClick={() => {
                  playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                  setShowPdf(false);
                }}
                className="px-5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg border border-slate-700 cursor-pointer transition-all active:scale-95 touch-target flex items-center gap-1.5 backdrop-blur-sm"
              >
                ✕ {language === 'ko' ? "닫기" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Popup */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setHelpOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setHelpOpen(false)}
                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 transition shrink-0"
              >
                <X size={18} />
              </button>
              <div className="flex items-start gap-3 mb-4">
                <h3 className="text-lg font-black text-slate-900">{helpSlides[helpStep].title}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4 whitespace-pre-line">{helpSlides[helpStep].body}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{helpStep + 1}/{helpSlides.length}</span>
                <div className="flex gap-2">
                  <button
                    disabled={helpStep === 0}
                    onClick={() => setHelpStep(s => s - 1)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold transition",
                      helpStep === 0
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-slate-600 hover:bg-slate-50 active:scale-95"
                    )}
                  >
                    <ChevronLeft size={14} />
                    {language === 'ko' ? '이전' : 'Prev'}
                  </button>
                  {helpStep < helpSlides.length - 1 ? (
                    <button
                      onClick={() => setHelpStep(s => s + 1)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition"
                    >
                      {language === 'ko' ? '다음' : 'Next'}
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setHelpOpen(false)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition"
                    >
                      {language === 'ko' ? '닫기' : 'Close'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
