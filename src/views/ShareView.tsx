import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CardData, Language, ViewType } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from '../components/CardItem';
import { t } from '../lib/i18n';
import { Share2, Play, Home, Sparkles, Camera, HelpCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { createCommunityPost } from '../lib/communityHelper';
import { trackAnalytics, AnalyticsEvent } from '../lib/analyticsEvents';
import { ArDeckViewer } from '../components/ArDeckViewer';
import { ShareTemplateCard } from '../components/ShareTemplateCard';
import type { ShareTemplateType } from '../lib/shareTemplates';
import { getCurrentSeasonConfig } from '../content/seasons';
import { SNS_ECONOMY_EARNINGS } from '../content/snsEconomy';
import { getCurrentWebtoonEpisode } from '../content/webtoonEpisodes';

interface ShareViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx: (url: string) => void;
  currentDeck: CardData[];
  user?: any | null;
  onAttackUser: (opp: { id: string; name: string; deck: CardData[]; totalPower?: number; sns?: number }) => void;
  showCustomAlert?: (title: string, message: string) => void;
  updateSns?: (amount: number, reason?: string) => void;
}

export const ShareView: React.FC<ShareViewProps> = ({
  language,
  onNavigate,
  playSfx,
  currentDeck,
  user,
  onAttackUser,
  showCustomAlert,
  updateSns,
}) => {
  const [is3DDeckViewerOpen, setIs3DDeckViewerOpen] = React.useState(false);
  const [isBoasting, setIsBoasting] = React.useState(false);
  const [shareTemplateType, setShareTemplateType] = React.useState<ShareTemplateType | null>(null);
  const [showHelp, setShowHelp] = React.useState(false);
  const [helpStep, setHelpStep] = React.useState(0);

  useEffect(() => {
    if (showHelp) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelp]);

  const currentSeason = useMemo(() => {
    if (typeof window === 'undefined') return 'season1';
    return window.localStorage.getItem('hero_current_season') || 'season1';
  }, []);

  const currentSeasonConfig = useMemo(
    () => getCurrentSeasonConfig(currentSeason),
    [currentSeason],
  );

  const currentWebtoonEpisode = useMemo(() => {
    const seasonSuffix = currentSeason.replace('season', '');
    const webtoonSeasonId = seasonSuffix ? `s${seasonSuffix}` : 's1';
    return getCurrentWebtoonEpisode(new Date(), webtoonSeasonId)
      ?? getCurrentWebtoonEpisode(new Date(), 's1');
  }, [currentSeason]);
  
  // Query parameters parsing
  const params = useMemo(() => {
    if (typeof window === 'undefined') return { id: 'SNSMaster', cards: [] };
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id') || 'SNSMaster';
    const cards: number[] = [];
    for (let i = 1; i <= 5; i++) {
      const cVal = searchParams.get(`card${i}`);
      if (cVal) {
        const num = parseInt(cVal, 10);
        if (!isNaN(num) && CARD_DATABASE[num]) {
          cards.push(num);
        }
      }
    }
    
    // Default fallback deck if no valid cards in URL
    if (cards.length === 0) {
      cards.push(1, 11, 21, 31, 41);
    } else {
      while (cards.length < 5) {
        cards.push(cards[0]); // Fill up to 5 cards
      }
    }
    
    return { id, cards };
  }, []);

  // Map database cards to CardData format
  const sharedDeck = useMemo<CardData[]>(() => {
    return params.cards.map((cardId, index) => {
      const dbCard = CARD_DATABASE[cardId];
      return {
        id: `shared-${cardId}-${index}`,
        title_dis: dbCard.title_dis,
        stats: [...dbCard.stats],
        owner: null,
        rarity: dbCard.rarity,
        element: dbCard.element,
        power: dbCard.power,
        level: dbCard.level,
        title: dbCard.title,
        title_en: dbCard.title_en,
        ability: dbCard.ability,
        imageUrl: dbCard.imageUrl,
        imageIndex: dbCard.id,
      };
    });
  }, [params.cards]);

  const handlePlayVsShared = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    
    // Total Power calculation
    const totalPower = sharedDeck.reduce((sum, c) => sum + (CARD_DATABASE[c.imageIndex || 0]?.power || 0), 0);
    
    onAttackUser({
      id: `shared-${params.id}`,
      name: params.id,
      deck: sharedDeck,
      totalPower,
      sns: 1000
    });
  };

  const handleShareLink = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    trackAnalytics({ event: AnalyticsEvent.SHARE, payload: { contentType: 'deck', contentId: params.id } });
    const shareUrl = window.location.href;
    const shareTitle = 'SNSHero';
    const shareText = language === 'ko' 
      ? `[${params.id}] 헌터님의 최강 카드 덱을 확인해보세요!` 
      : `Check out ${params.id}'s ultimate card deck!`;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      }).catch(err => {
        console.warn('Share API failed, falling back to clipboard copy:', err);
        fallbackCopyLink(shareUrl);
      });
    } else {
      fallbackCopyLink(shareUrl);
    }
  };

  const fallbackCopyLink = (shareUrl: string) => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      if (showCustomAlert) {
        showCustomAlert(
          language === 'ko' ? '링크 복사 완료' : 'Link Copied',
          language === 'ko' ? '공유 링크가 클립보드에 복사되었습니다!' : 'Share link copied to clipboard!'
        );
      }
    }).catch(err => {
      console.error('Failed to copy share link: ', err);
    });
  };

  const handleBoastDeck = async () => {
    if (!user || user.uid === 'guest-id') {
      if (showCustomAlert) {
        showCustomAlert(
          language === 'ko' ? '오류' : 'Error',
          language === 'ko' ? '자랑하기 글을 올리려면 로그인이 필요합니다.' : 'Login is required to boast your deck.'
        );
      }
      return;
    }
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setIsBoasting(true);

    // 1. 하루 1번 자랑 제한 체크
    const lastBoast = Number(localStorage.getItem('hero_boast_last_time') || 0);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - lastBoast < oneDay) {
      if (showCustomAlert) {
        showCustomAlert(
          language === 'ko' ? '오늘의 자랑 완료' : 'Already Boasted Today',
          language === 'ko' ? '덱 자랑은 하루에 한 번만 가능합니다!' : 'You can only boast your deck once a day!'
        );
      }
      return;
    }

    // 2. 자랑글 작성
    const boasterName = user?.displayName || 'Anonymous Hunter';
    const cardNames = sharedDeck.map((c, i) => {
      if (!c) return '';
      const cardTitle = language === 'ko' ? c.title_dis : (c.title_en || c.title_dis);
      return `${i + 1}. ${cardTitle} (Lv.${c.level || 1}, Power:${CARD_DATABASE[c.imageIndex || 0]?.power || 0})`;
    }).filter(Boolean).join('\n');
    
    const totalPower = sharedDeck.reduce((acc, c) => acc + (CARD_DATABASE[c.imageIndex || 0]?.power || 0), 0);
    const boastContent = `🔥 [${boasterName}] 헌터님이 소개하는 최강 카드 덱! 🔥\n\n💪 덱 총 전투력(TP): ${totalPower.toLocaleString()}\n\n📋 덱 리스트:\n${cardNames}\n\n#SNSHero #SNS히어로 #카드게임 #덱뽐내기`;

    const boastedImageUrls = sharedDeck.map(c => {
      if (!c) return '';
      if (c.imageUrl) return c.imageUrl;
      return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Hero-${c.imageIndex || 1}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    }).filter(Boolean);

    try {
      // 자랑글 작성 API 호출 (deckData에 sharedDeck도 전달)
      const newPost = await createCommunityPost(boastContent, undefined, user, 'boast', boastedImageUrls, sharedDeck);
      
      // 3. 뽐내기 성공 시 로컬스토리지 타임스탬프 갱신
      localStorage.setItem('hero_boast_last_time', now.toString());

      // 4. 부지런의 나무 보상 확인 및 수령
      let claimedTreeReward = false;
      if (updateSns) {
        const storedTree = localStorage.getItem('hero_last_diligence_time');
        const lastTreeTime = storedTree ? parseInt(storedTree) || 0 : 0;
        const treeCooldown = SNS_ECONOMY_EARNINGS.repeatable.treeOfDiligence.cooldownHours * 60 * 60 * 1000;
        if (now - lastTreeTime >= treeCooldown) {
          localStorage.setItem('hero_last_diligence_time', now.toString());
          updateSns(SNS_ECONOMY_EARNINGS.repeatable.treeOfDiligence.reward, t('tree_of_diligence', language));
          claimedTreeReward = true;
        }
      }

      // 5. 완료 알림 및 상세글 보기로 이동
      if (showCustomAlert) {
        showCustomAlert(
          language === 'ko' ? '뽐내기 완료!' : 'Boast Success!',
          language === 'ko' 
            ? `커뮤니티에 카드 덱이 뽐내기 되었습니다!${claimedTreeReward ? ' (부지런의 나무 보상 1,000 SNS 획득)' : ''}` 
            : `Deck posted to community!${claimedTreeReward ? ' (+1,000 SNS Diligence Tree reward)' : ''}`
        );
      }

      // 상세 게시글 보기로 URL 히스토리 갱신 후, 라우트 이동
      window.history.pushState({}, '', `?view=community&postId=${newPost.id}`);
      onNavigate('community');
    } catch (error) {
      console.error('Failed to create boast post:', error);
      if (showCustomAlert) {
        showCustomAlert(
          language === 'ko' ? '오류' : 'Error',
          language === 'ko' ? '뽐내기 작성에 실패했습니다.' : 'Failed to post your deck.'
        );
      }
    } finally {
      setIsBoasting(false);
    }
  };

  React.useEffect(() => {
    const handleGlobalBack = (e: Event) => {
      e.preventDefault();
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      onNavigate('home');
    };
    window.addEventListener('global-back', handleGlobalBack);
    return () => window.removeEventListener('global-back', handleGlobalBack);
  }, [onNavigate, playSfx]);

  return (
    <div className="p-4 sm:p-6 md:p-8 pb-32 flex flex-col gap-6 md:gap-8 max-w-4xl mx-auto min-h-screen app-bg text-slate-800 font-sans">
      {/* Header - SNSHero.com Header */}
      <header className="border border-slate-100 bg-white/90 backdrop-blur-md p-4 flex justify-between items-center shadow-sm rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10" />
          <span 
            onClick={() => onNavigate('home')} 
            className="text-xl sm:text-2xl font-extrabold tracking-tight cursor-pointer uppercase bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent transition-colors"
          >
            SNSHero.com
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowHelp(true); setHelpStep(0); }}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <HelpCircle size={16} className="text-slate-500" />
          </button>
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              onNavigate('home');
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all touch-target"
          >
            <Home size={14} />
            <span>{t('home', language)}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col gap-6 sm:gap-8">
        
        {/* Section 1: Shared Deck */}
        <section className="border border-slate-100 bg-white p-5 sm:p-6 shadow-sm rounded-lg flex flex-col gap-4">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 justify-items-center">
            {sharedDeck.map((card, idx) => (
              <div key={card.id} className="w-full flex flex-col items-center">
                <CardItem card={card} language={language} className="w-full max-w-[120px] aspect-[3/4]" />
              </div>
            ))}
          </div>
        </section>
        {/* Section 3: Share Template Selector */}
        <section className="border border-slate-100 bg-white p-5 sm:p-6 shadow-sm rounded-lg flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['character', 'webtoon', 'season', 'deck'] as ShareTemplateType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setShareTemplateType(type);
                }}
                aria-label={t(`share_template_${type}`, language)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 active:scale-[0.98] transition-all touch-target cursor-pointer"
              >
                <span className="text-xl">
                  {type === 'character' ? '🃏' : type === 'webtoon' ? '📖' : type === 'season' ? '🏆' : '⚔️'}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-700">
                  {t(`share_template_${type}`, language)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Section 4: Call to Action Buttons */}
        <div className="grid grid-cols-2 md:flex md:flex-row gap-3 items-stretch justify-center mt-4">
          <button
            onClick={handleShareLink}
            className="flex-1 px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-lg text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all touch-target cursor-pointer whitespace-nowrap"
          >
            <Share2 size={16} />
            {t('share_link_web', language)}
          </button>
          
          <div className="flex-1 relative min-w-0">
            {isBoasting && (
              <div className="absolute -top-0.5 left-0 right-0 h-1 bg-emerald-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 30, ease: 'linear' }}
                />
              </div>
            )}
            <button
              onClick={handleBoastDeck}
              disabled={isBoasting}
              className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white rounded-lg text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 hover:shadow-lg transition-all touch-target cursor-pointer whitespace-nowrap"
            >
              {isBoasting ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Sparkles size={16} />
              )}
              {isBoasting ? (language === 'ko' ? '저장 중...' : 'Saving...') : t('community_cat_boast', language)}
            </button>
          </div>

          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setIs3DDeckViewerOpen(true);
            }}
            className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-teal-500/10 hover:shadow-lg transition-all touch-target cursor-pointer whitespace-nowrap"
            title={language === 'ko' ? '덱 3D 감상' : '3D DECK VIEW'}
          >
            <Camera size={16} />
            {language === 'ko' ? '3D 감상' : '3D VIEW'}
          </button>
          
          <button
            onClick={handlePlayVsShared}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-indigo-500/15 hover:shadow-lg transition-all touch-target cursor-pointer whitespace-nowrap"
          >
            <Play size={16} fill="white" />
            {t('play_game', language)}
          </button>
        </div>

      </main>

      {is3DDeckViewerOpen && (
        <ArDeckViewer
          isOpen={is3DDeckViewerOpen}
          onClose={() => setIs3DDeckViewerOpen(false)}
          language={language}
          deckCards={sharedDeck}
          inventory={{}}
        />
      )}

      {/* Share Template Modal */}
      <AnimatePresence>
        {shareTemplateType && (
          <ShareTemplateCard
            templateType={shareTemplateType}
            language={language}
            cardId={sharedDeck[0]?.imageIndex}
            episodeTitle={currentWebtoonEpisode ? t(currentWebtoonEpisode.titleKey, language) : undefined}
            episodeLogline={currentWebtoonEpisode ? t(currentWebtoonEpisode.loglineKey, language) : undefined}
            seasonName={t(currentSeasonConfig.titleKey, language)}
            seasonTitle={t(currentSeasonConfig.titleKey, language)}
            seasonSubtitle={t(currentSeasonConfig.storyArcKey, language)}
            seasonId={currentSeason}
            deck={sharedDeck}
            totalPower={sharedDeck.reduce((acc, c) => acc + (CARD_DATABASE[c.imageIndex || 0]?.power || 0), 0)}
            onClose={() => setShareTemplateType(null)}
            showToast={(msg) => {
              if (showCustomAlert) showCustomAlert(
                language === 'ko' ? '알림' : 'Notice',
                msg,
              );
            }}
          />
        )}
      </AnimatePresence>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-white pt-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {language === 'ko' ? '덱 공유' : 'Deck Share'}
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <div className="min-h-[120px] flex flex-col justify-center text-center py-4">
                {helpStep === 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">{language === 'ko' ? '공유된 덱을 확인하세요.' : 'View the shared deck.'}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ko' ? '5장의 카드로 구성된 덱을 확인하고 상대방과 대전할 수 있습니다.' : 'Check out the 5-card deck and battle against it.'}</p>
                  </div>
                )}
                {helpStep === 1 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">{language === 'ko' ? '이미지 템플릿으로 공유하세요.' : 'Share with image templates.'}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ko' ? '캐릭터, 웹툰, 시즌, 덱 스타일의 이미지 템플릿을 선택하여 SNS에 공유할 수 있습니다.' : 'Choose from character, webtoon, season, or deck style templates to share on social media.'}</p>
                  </div>
                )}
                {helpStep === 2 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">{language === 'ko' ? '덱을 자랑하고 3D로 감상하세요.' : 'Boast your deck and view in 3D.'}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ko' ? '커뮤니티에 덱을 자랑하고 3D 뷰어로 카드들을 감상할 수 있습니다.' : 'Boast your deck to the community and view cards in the 3D viewer.'}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setHelpStep(prev => Math.max(0, prev - 1))}
                  disabled={helpStep === 0}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                >
                  <ChevronLeft size={18} className="text-slate-600" />
                </button>
                <span className="text-[10px] font-bold text-slate-400">{helpStep + 1} / 3</span>
                <button
                  onClick={() => setHelpStep(prev => Math.min(2, prev + 1))}
                  disabled={helpStep === 2}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                >
                  <ChevronRight size={18} className="text-slate-600" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
