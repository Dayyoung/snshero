import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Play, Pause, Square, Volume2, Copy, Sparkles, ChevronLeft, ChevronRight,
  Check, Settings, Moon, Sun, Gift, ArrowLeft, Bookmark, List, ExternalLink, Award, User, Image,
  Maximize2, X, Eye, Film, Layers, RefreshCw, ChevronDown, Search, ListOrdered, CheckCircle2, Clock
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { t } from '../lib/i18n';
import { cn, getAssetUrl, getCardSpriteAsset, getCardSpriteStyle } from '../lib/utils';
import { CARD_DATABASE } from '../cardDatabase';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import { WikiCardDetailModal } from '../components/WikiCardDetailModal';
import { useGameSettings } from '../contexts/GameSettingsContext';
import { useCardSkins } from '../hooks/useCardSkins';
import { getCharacterArtPrompt } from '../content/characterArtPrompts';
import { ENGLISH_NOVEL_MAP } from '../content/englishNovelMapping';

interface NovelViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx?: (url: string) => void;
  currentSeason?: string;
  user?: { uid: string; displayName?: string | null } | null;
  updateSns?: (amount: number, reason?: string) => void;
  showCustomAlert?: (title: string, message: string) => void;
}

interface IndexEpisodeMeta {
  episodeNumber: number;
  titleKo: string;
  sourceRange: string;
  file: string;
  characterCount: number;
}

interface IndexCharacterMeta {
  cardId: number;
  cardName: string;
  image: string;
  episodeNumbers: number[];
  mentionCount: number;
}

interface NovelIndexData {
  seriesId: string;
  titleKo: string;
  episodeCount: number;
  totalCharacters: number;
  characters: IndexCharacterMeta[];
  episodes: IndexEpisodeMeta[];
}

interface SceneNarration {
  sceneNumber: number;
  imageFile: string;
  sourceImageFile: string;
  narrationEn: string;
  narrationKo: string;
  sourceSentenceStart: number;
  sourceSentenceEnd: number;
}

interface EpisodeNarrationData {
  episodeNumber: number;
  episodeTitleEn: string;
  episodeTitleKo: string;
  sourceSentenceCount: number;
  sceneCount: number;
  scenes: SceneNarration[];
}

const TOTAL_EPISODES = 40;

const pad2 = (n: number) => String(n).padStart(2, '0');
const pad3 = (n: number) => String(n).padStart(3, '0');

/**
 * Shortens a scene narration into a crisp single sentence that can be read within 8 seconds (~35-45 Korean chars / ~14-16 English words).
 */
export function get8SecShortNarration(text: string, lang: string = 'ko'): string {
  if (!text) return '';
  const clean = text.replace(/[\r\n]+/g, ' ').trim();
  
  if (lang === 'ko') {
    // Split into sentences by '.', '!', '?'
    const sentences = clean.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const firstSentence = (sentences[0] || clean).trim();
    
    if (firstSentence.length <= 45) {
      return firstSentence;
    }
    
    const commaParts = firstSentence.split(/,\s*/);
    if (commaParts.length > 1 && commaParts[0].length >= 12 && commaParts[0].length <= 40) {
      const secondPartFirstWord = commaParts[1].split(/\s+/)[0] || '';
      return commaParts[0] + (secondPartFirstWord ? ` ${secondPartFirstWord}...` : '...');
    }
    
    return firstSentence.slice(0, 42).trim() + '...';
  } else {
    // English & other languages
    const sentences = clean.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const firstSentence = (sentences[0] || clean).trim();
    const words = firstSentence.split(/\s+/);
    if (words.length <= 16) {
      return firstSentence;
    }
    return words.slice(0, 14).join(' ') + '...';
  }
}

export const NovelView: React.FC<NovelViewProps> = ({
  language,
  onNavigate,
  playSfx,
  currentSeason = 'season1',
  user,
  updateSns,
  showCustomAlert,
}) => {
  // Reading episode number (saved in hero_novel_progress_{season})
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState<number>(() => {
    const saved = getSeasonItem('hero_novel_progress', currentSeason);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 || parsed > TOTAL_EPISODES ? 1 : parsed;
  });

  // Prompt mode state (saved in hero_novel_prompt_mode_{season})
  const [isPromptMode, setIsPromptMode] = useState<boolean>(() => {
    return getSeasonItem('hero_novel_prompt_mode', currentSeason) === 'true';
  });

  // Reader Tab mode: 'novel' (소설 읽기) | 'cartoon' (카툰 보기) | 'prompt' (프롬프트 모드)
  const [readerTab, setReaderTab] = useState<'novel' | 'cartoon' | 'prompt'>(() => {
    if (typeof window !== 'undefined' && (window.location.pathname.includes('webtoon') || window.location.hash.includes('webtoon'))) {
      return 'cartoon';
    }
    return 'novel';
  });

  // Cartoon scene image load failover tracking
  const [sceneImgAttempts, setSceneImgAttempts] = useState<Record<string, number>>({});

  // Lightbox Modal state for cartoon full-screen image viewing
  const [lightboxSceneIndex, setLightboxSceneIndex] = useState<number | null>(null);

  // Cartoon layout mode: 'scroll' (vertical webtoon strip) or 'slides' (page-by-page carousel)
  const [cartoonDisplayMode, setCartoonDisplayMode] = useState<'scroll' | 'slides'>('scroll');
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(1);

  // Get cartoon scene image URL candidate based on attempt count using external GitHub Pages CDN
  const getCartoonSceneUrl = (epNum: number, sceneIdx: number, attempt = 0): string => {
    const epPad = pad2(epNum);
    const scPad = pad2(sceneIdx);
    const baseUrl = 'https://dayyoung.github.io/image/cartoon';
    switch (attempt) {
      case 0:
        return `${baseUrl}/episode_${epPad}/scene_${scPad}.jpeg`;
      case 1:
        return `${baseUrl}/episode_${epPad}/scene_${scPad}.jpg`;
      case 2:
        return `${baseUrl}/episode_${epPad}/scene_${scPad}.png`;
      case 3:
        return `${baseUrl}/episode_${epNum}/scene_${scPad}.jpeg`;
      default:
        return `${baseUrl}/episode_01/scene_${scPad}.jpeg`;
    }
  };

  // Reader Customization Settings
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [readerTheme, setReaderTheme] = useState<'cream' | 'dark' | 'light'>('cream');
  const [showChapterDrawer, setShowChapterDrawer] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Loaded Index & Episode Data
  const [indexData, setIndexData] = useState<NovelIndexData | null>(null);
  const [markdownText, setMarkdownText] = useState<string>('');
  const [narrationData, setNarrationData] = useState<EpisodeNarrationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // TTS State
  const [isTtsPlaying, setIsTtsPlaying] = useState<boolean>(false);
  const [isTtsPaused, setIsTtsPaused] = useState<boolean>(false);
  const [ttsParagraphIndex, setTtsParagraphIndex] = useState<number | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Card detail modal state
  const [selectedWikiCardId, setSelectedWikiCardId] = useState<number | null>(null);

  // Episode Selection Modal State
  const [showEpisodeModal, setShowEpisodeModal] = useState<boolean>(false);
  const [episodeModalFilter, setEpisodeModalFilter] = useState<'all' | '1-10' | '11-20' | '21-30' | '31-40'>('all');
  const [episodeModalSearch, setEpisodeModalSearch] = useState<string>('');

  const { lowSpecMode } = useGameSettings();
  const {
    getAvailableSkins,
    isSkinUnlocked,
    isSkinActive,
    applySkin,
    removeSkin,
  } = useCardSkins(currentSeason);

  const selectedWikiCard = selectedWikiCardId ? CARD_DATABASE[selectedWikiCardId] : null;

  // Copy toast feedback
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Claimed Rewards state
  const [claimedRewards, setClaimedRewards] = useState<Record<number, boolean>>(() => {
    try {
      const saved = getSeasonItem('hero_novel_claimed_episodes', currentSeason);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save progress on episode change
  useEffect(() => {
    setSeasonItem('hero_novel_progress', currentEpisodeNum.toString(), currentSeason);
  }, [currentEpisodeNum, currentSeason]);

  // Toggle Prompt Mode
  const handleTogglePromptMode = () => {
    const nextVal = !isPromptMode;
    setIsPromptMode(nextVal);
    setSeasonItem('hero_novel_prompt_mode', nextVal ? 'true' : 'false', currentSeason);
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  // 1. Fetch novel index.json once
  useEffect(() => {
    const loadIndex = async () => {
      try {
        const res = await fetch(getAssetUrl('/book/index.json'));
        if (res.ok) {
          const data: NovelIndexData = await res.json();
          setIndexData(data);
        }
      } catch (err) {
        console.warn('Could not load /book/index.json:', err);
      }
    };
    loadIndex();
  }, []);

  // 2. Fetch episode content (Korean markdown or English TXT) whenever currentEpisodeNum or language changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    stopTts();

    const epPad = pad2(currentEpisodeNum);

    const loadEpisodeContent = async () => {
      try {
        const isKorean = language === 'ko';
        const enInfo = ENGLISH_NOVEL_MAP[currentEpisodeNum];
        const textPath = isKorean
          ? `/book/episode_${epPad}.md`
          : (enInfo?.fileName ? `/book/image_narrations/english_txt/${enInfo.fileName}` : `/book/episode_${epPad}.md`);

        const [mdRes, narrRes] = await Promise.all([
          fetch(getAssetUrl(textPath)),
          fetch(getAssetUrl(`/book/image_narrations/episode_${epPad}_narrations.json`)),
        ]);

        if (mdRes.ok && isMounted) {
          const text = await mdRes.text();
          setMarkdownText(text);
        }

        if (narrRes.ok && isMounted) {
          const narr: EpisodeNarrationData = await narrRes.json();
          setNarrationData(narr);
        } else if (isMounted) {
          setNarrationData(null);
        }
      } catch (err) {
        console.error('Error fetching episode files:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadEpisodeContent();

    return () => {
      isMounted = false;
      stopTts();
    };
  }, [currentEpisodeNum, language]);

  // Parse novel content into structured title, source range, and paragraphs
  const parsedContent = React.useMemo(() => {
    if (!markdownText) {
      const defaultTitle = language === 'ko' ? `제 ${currentEpisodeNum}화` : `Episode ${currentEpisodeNum}`;
      return { title: defaultTitle, sourceRange: '', paragraphs: [] };
    }

    if (language === 'ko') {
      const lines = markdownText.split('\n').map(l => l.trim());
      let title = `제 ${currentEpisodeNum}화`;
      let sourceRange = '';
      const bodyParagraphs: string[] = [];

      let currentParagraph = '';

      for (const line of lines) {
        if (!line) {
          if (currentParagraph) {
            bodyParagraphs.push(currentParagraph);
            currentParagraph = '';
          }
          continue;
        }

        if (line.startsWith('# ')) {
          title = line.replace('# ', '').trim();
        } else if (line.startsWith('> ')) {
          sourceRange = line.replace('> ', '').trim();
        } else {
          if (currentParagraph) {
            currentParagraph += ' ' + line;
          } else {
            currentParagraph = line;
          }
        }
      }

      if (currentParagraph) {
        bodyParagraphs.push(currentParagraph);
      }

      return { title, sourceRange, paragraphs: bodyParagraphs };
    } else {
      // English / Non-Korean language handling
      const enInfo = ENGLISH_NOVEL_MAP[currentEpisodeNum];
      const enTitle = narrationData?.episodeTitleEn || enInfo?.titleEn || `Episode ${currentEpisodeNum}`;
      const title = `Episode ${currentEpisodeNum}: ${enTitle}`;

      const rawBlocks = markdownText.split(/\n\s*\n/);
      const bodyParagraphs: string[] = [];

      for (const block of rawBlocks) {
        let clean = block.replace(/\r/g, '').trim();
        if (!clean) continue;

        // Skip title headers inside the English TXT file
        if (clean.startsWith('SNSHero Novel') || clean.startsWith('Episode ')) {
          continue;
        }

        // Clean card image references like (042.png) and brackets
        clean = clean.replace(/\(\d{3}\.png\)/g, '');
        clean = clean.replace(/\[([^\]]+)\]/g, '$1');
        clean = clean.replace(/\s+/g, ' ').trim();

        if (clean) {
          bodyParagraphs.push(clean);
        }
      }

      return { title, sourceRange: `Episode ${currentEpisodeNum}`, paragraphs: bodyParagraphs };
    }
  }, [markdownText, currentEpisodeNum, language, narrationData]);

  // Characters appearing in current episode
  const episodeCharacters = React.useMemo(() => {
    if (!indexData?.characters) return [];
    return indexData.characters.filter(c => c.episodeNumbers.includes(currentEpisodeNum));
  }, [indexData, currentEpisodeNum]);

  // Full character art prompts for prompt mode
  const promptCharacters = React.useMemo(() => {
    if (episodeCharacters.length > 0) {
      return episodeCharacters.map(char => ({
        ...char,
        artPrompt: getCharacterArtPrompt(char.cardId)
      }));
    }
    // Fallback to default protagonists (Kadan: 41, Celia: 62, Ignis: 11)
    const defaultCardIds = [41, 62, 11];
    return defaultCardIds.map(cardId => {
      const card = CARD_DATABASE[cardId];
      return {
        cardId,
        cardName: card ? card.title : `Card #${cardId}`,
        image: getCardSpriteAsset(cardId),
        episodeNumbers: [currentEpisodeNum],
        mentionCount: 1,
        artPrompt: getCharacterArtPrompt(cardId)
      };
    });
  }, [episodeCharacters, currentEpisodeNum]);

  // 20 Continuous Pure English Prompts for Video & Character Image Generation
  const continuous20Prompts = React.useMemo(() => {
    if (!narrationData?.scenes) return [];
    const list: string[] = [];

    narrationData.scenes.slice(0, 10).forEach((sc, idx) => {
      // 1. Scene Video Prompt (EN)
      list.push(`High quality dark fantasy anime video, dynamic camera motion, cinematic lighting, ${sc.narrationEn}`);

      // 2. Scene Image / Webtoon Panel Prompt (EN)
      const char = promptCharacters[idx % promptCharacters.length];
      const charVisual = char ? char.artPrompt.positivePromptEn : 'masterpiece dark fantasy webtoon artwork, epic atmosphere';
      list.push(`Masterpiece webtoon panel artwork, ${charVisual}, detailed background, 8k resolution`);
    });

    // Ensure exactly 20 prompts
    while (list.length < 20) {
      const char = promptCharacters[list.length % promptCharacters.length];
      if (char) {
        list.push(char.artPrompt.positivePromptEn);
      } else {
        list.push(`Dark fantasy anime artwork, epic heroic scene, highly detailed digital painting, episode ${currentEpisodeNum}`);
      }
    }

    return list.slice(0, 20);
  }, [narrationData, promptCharacters, currentEpisodeNum]);

  // TTS Controls
  const startTtsFromParagraph = (index: number) => {
    if (!('speechSynthesis' in window)) {
      if (showCustomAlert) {
        showCustomAlert(
          language === 'ko' ? 'TTS 지원 불가' : 'TTS Unavailable',
          t('novel_tts_unavailable', language)
        );
      }
      return;
    }

    window.speechSynthesis.cancel();
    const paragraphs = parsedContent.paragraphs;
    if (!paragraphs || !paragraphs[index]) return;

    setTtsParagraphIndex(index);
    setIsTtsPlaying(true);
    setIsTtsPaused(false);

    const textToSpeak = paragraphs[index];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'ko' ? 'ko-KR' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => {
      if (index + 1 < paragraphs.length) {
        startTtsFromParagraph(index + 1);
      } else {
        setIsTtsPlaying(false);
        setIsTtsPaused(false);
        setTtsParagraphIndex(null);
      }
    };

    utterance.onerror = () => {
      setIsTtsPlaying(false);
      setIsTtsPaused(false);
      setTtsParagraphIndex(null);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pauseTts = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsTtsPaused(true);
      setIsTtsPlaying(false);
    }
  };

  const resumeTts = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsTtsPaused(false);
      setIsTtsPlaying(true);
    } else if (ttsParagraphIndex !== null) {
      startTtsFromParagraph(ttsParagraphIndex);
    } else {
      startTtsFromParagraph(0);
    }
  };

  const stopTts = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsTtsPlaying(false);
    setIsTtsPaused(false);
    setTtsParagraphIndex(null);
  };

  // Copy text to clipboard
  const handleCopyText = (content: string, label: string) => {
    navigator.clipboard.writeText(content).then(
      () => {
        setCopyToast(label);
        setTimeout(() => setCopyToast(null), 2500);
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      },
      () => {
        if (showCustomAlert) {
          showCustomAlert(
            language === 'ko' ? '복사 실패' : 'Copy Failed',
            t('novel_prompt_copy_failed', language)
          );
        }
      }
    );
  };

  // Claim episode reward (100 SNS)
  const handleClaimEpisodeReward = (epNum: number) => {
    if (claimedRewards[epNum]) {
      if (showCustomAlert) {
        showCustomAlert(
          language === 'ko' ? '알림' : 'Notice',
          t('novel_reward_already_claimed', language)
        );
      }
      return;
    }

    if (updateSns) {
      updateSns(100, `웹소설 제 ${epNum}화 완독 보상`);
    }

    const nextClaimed = { ...claimedRewards, [epNum]: true };
    setClaimedRewards(nextClaimed);
    setSeasonItem('hero_novel_claimed_episodes', JSON.stringify(nextClaimed), currentSeason);

    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    if (showCustomAlert) {
      showCustomAlert(
        language === 'ko' ? '완독 보상 수령!' : 'Chapter Complete Reward!',
        language === 'ko' ? `제 ${epNum}화 완독 보상 100 SNS 포인트가 지급되었습니다!` : `Claimed 100 SNS points for completing Episode ${epNum}!`
      );
    }
  };

  // Theme styling helpers according to OpenCode.ai design guide
  const themeContainerClass =
    readerTheme === 'cream'
      ? 'bg-[#fdfcfc] text-[#201d1d] border-stone-300'
      : readerTheme === 'dark'
      ? 'bg-slate-900 text-slate-100 border-slate-800'
      : 'bg-white text-slate-900 border-slate-200';

  const fontClass =
    fontSize === 'sm'
      ? 'text-sm leading-relaxed'
      : fontSize === 'base'
      ? 'text-base leading-loose'
      : fontSize === 'lg'
      ? 'text-lg leading-loose'
      : 'text-xl leading-loose';

  return (
    <div className="min-h-screen w-full bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col justify-between selection:bg-amber-200">
      {/* Copy Toast Feedback */}
      {copyToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100000] bg-slate-900 text-amber-300 text-xs px-4 py-2 rounded-sm border border-amber-500/40 shadow-xl flex items-center gap-2 font-mono">
          <Check size={14} className="text-amber-400" />
          <span>[{copyToast}] {t('novel_prompt_copy_success', language)}</span>
        </div>
      )}

      {/* Header bar */}
      <header className="w-full border-b border-stone-300 bg-[#fdfcfc] px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              onNavigate('home');
            }}
            className="p-1.5 border border-stone-300 rounded-sm hover:bg-stone-100 text-[#201d1d] active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
            title={language === 'ko' ? '홈으로 돌아가기' : 'Back to Home'}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">[ HOME ]</span>
          </button>
          <div className="h-4 w-[1px] bg-stone-300 mx-1" />
          <span className="font-bold text-xs sm:text-sm tracking-tight text-[#201d1d]">
            [ 📖 {language === 'ko' ? '눈히어로 웹소설: /public/book 40부작' : 'SNSHero Web Novel: 40 Episodes'} ]
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Prompt mode toggle button */}
          <button
            onClick={handleTogglePromptMode}
            className={cn(
              "px-2.5 py-1 text-xs font-bold border rounded-sm transition-all cursor-pointer flex items-center gap-1.5",
              isPromptMode
                ? "bg-amber-100 border-amber-500 text-amber-900"
                : "bg-white border-stone-300 text-stone-700 hover:bg-stone-100"
            )}
            title={t('novel_prompt_mode_toggle', language)}
          >
            <Sparkles size={14} className={isPromptMode ? "text-amber-600 animate-pulse" : "text-stone-400"} />
            <span>{isPromptMode ? t('novel_prompt_on', language) : t('novel_prompt_off', language)}</span>
          </button>

          {/* Chapter Drawer Toggle */}
          <button
            onClick={() => setShowChapterDrawer(!showChapterDrawer)}
            className="p-1.5 border border-stone-300 rounded-sm hover:bg-stone-100 text-[#201d1d] active:scale-95 transition-all cursor-pointer"
            title={language === 'ko' ? '목차' : 'Chapters'}
          >
            <List size={18} />
          </button>

          {/* Reader Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 border border-stone-300 rounded-sm hover:bg-stone-100 text-[#201d1d] active:scale-95 transition-all cursor-pointer"
            title={language === 'ko' ? '설정' : 'Settings'}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Primary Reader View Mode Tabs (Novel Reader / Cartoon Viewer / Prompt Mode) */}
      <div className="w-full bg-[#fdfcfc] border-b border-stone-300 py-2.5 px-4 flex items-center justify-center gap-2 font-mono flex-wrap">
        <button
          onClick={() => {
            setReaderTab('novel');
            setIsPromptMode(false);
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }}
          className={cn(
            "px-3.5 py-1.5 border rounded-sm font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all",
            readerTab === 'novel' && !isPromptMode
              ? "bg-[#201d1d] text-white border-[#201d1d] shadow-xs"
              : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
          )}
        >
          <BookOpen size={15} />
          <span>{language === 'ko' ? '📖 소설 읽기' : '📖 Read Novel'}</span>
        </button>

        <button
          onClick={() => {
            setReaderTab('cartoon');
            setIsPromptMode(false);
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }}
          className={cn(
            "px-3.5 py-1.5 border rounded-sm font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all",
            readerTab === 'cartoon' && !isPromptMode
              ? "bg-amber-600 text-white border-amber-700 shadow-xs"
              : "bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100"
          )}
        >
          <Image size={15} />
          <span>{language === 'ko' ? '🎨 카툰 보기' : '🎨 View Cartoon'}</span>
          <span className="text-[10px] bg-amber-900 text-amber-100 px-1 py-0.2 rounded-xs font-mono ml-0.5">
            WEBTOON
          </span>
        </button>

        <button
          onClick={() => {
            setReaderTab('prompt');
            if (!isPromptMode) handleTogglePromptMode();
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }}
          className={cn(
            "px-3.5 py-1.5 border rounded-sm font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all",
            isPromptMode || readerTab === 'prompt'
              ? "bg-purple-700 text-white border-purple-800 shadow-xs"
              : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
          )}
        >
          <Sparkles size={15} className={isPromptMode ? "text-amber-300 animate-pulse" : "text-purple-600"} />
          <span>{language === 'ko' ? '✨ 프롬프트 모드' : '✨ Prompt Mode'}</span>
        </button>
      </div>

      {/* Reader Settings Dropdown Panel */}
      {showSettings && (
        <div className="w-full border-b border-stone-300 bg-stone-50 p-4 font-mono text-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-600">[ FONT SIZE ]</span>
            {(['sm', 'base', 'lg', 'xl'] as const).map(size => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={cn(
                  "px-2 py-0.5 border rounded-sm font-bold cursor-pointer uppercase",
                  fontSize === size ? "bg-[#201d1d] text-white border-[#201d1d]" : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                )}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-600">[ THEME ]</span>
            <button
              onClick={() => setReaderTheme('cream')}
              className={cn(
                "px-2.5 py-0.5 border rounded-sm font-bold cursor-pointer flex items-center gap-1",
                readerTheme === 'cream' ? "bg-amber-100 text-amber-900 border-amber-400" : "bg-white text-stone-700 border-stone-300"
              )}
            >
              <Sun size={12} /> Cream
            </button>
            <button
              onClick={() => setReaderTheme('light')}
              className={cn(
                "px-2.5 py-0.5 border rounded-sm font-bold cursor-pointer flex items-center gap-1",
                readerTheme === 'light' ? "bg-slate-200 text-slate-900 border-slate-400" : "bg-white text-stone-700 border-stone-300"
              )}
            >
              Light
            </button>
            <button
              onClick={() => setReaderTheme('dark')}
              className={cn(
                "px-2.5 py-0.5 border rounded-sm font-bold cursor-pointer flex items-center gap-1",
                readerTheme === 'dark' ? "bg-slate-900 text-amber-300 border-slate-700" : "bg-white text-stone-700 border-stone-300"
              )}
            >
              <Moon size={12} /> Dark
            </button>
          </div>
        </div>
      )}

      {/* Chapter Selection Drawer */}
      {showChapterDrawer && (
        <div className="w-full border-b border-stone-300 bg-white p-4 font-mono max-h-[360px] overflow-y-auto">
          <div className="flex items-center justify-between mb-3 border-b border-stone-200 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-stone-700">
              [ 📖 {language === 'ko' ? '공식 웹소설 목차 (1 ~ 40화)' : 'Official Web Novel Chapters (1 ~ 40)'} ]
            </span>
            <button
              onClick={() => setShowChapterDrawer(false)}
              className="text-stone-500 hover:text-stone-900 font-bold text-xs cursor-pointer"
            >
              [X]
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 text-xs">
            {Array.from({ length: TOTAL_EPISODES }, (_, i) => i + 1).map(epNum => {
              const meta = indexData?.episodes?.find(e => e.episodeNumber === epNum);
              const isCurrent = epNum === currentEpisodeNum;
              const isClaimed = claimedRewards[epNum];

              return (
                <button
                  key={epNum}
                  onClick={() => {
                    setCurrentEpisodeNum(epNum);
                    setShowChapterDrawer(false);
                    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  }}
                  className={cn(
                    "p-2 border rounded-sm text-left transition-all cursor-pointer flex flex-col justify-between min-h-[52px]",
                    isCurrent
                      ? "bg-[#201d1d] text-white border-[#201d1d]"
                      : isClaimed
                      ? "bg-amber-50/70 text-stone-800 border-amber-300 hover:bg-amber-100"
                      : "bg-white text-stone-800 border-stone-200 hover:bg-stone-50"
                  )}
                >
                  <div className="flex items-center justify-between w-full font-bold">
                    <span>{epNum}{language === 'ko' ? '화' : ' Ep'}</span>
                    {isClaimed && <Check size={12} className="text-amber-600" />}
                  </div>
                  <span className="text-[10px] opacity-75 truncate mt-1">
                    {language === 'ko'
                      ? (meta ? meta.titleKo : `제 ${epNum}화`)
                      : (ENGLISH_NOVEL_MAP[epNum]?.titleEn || (meta ? meta.titleKo : `Episode ${epNum}`))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Reader Canvas */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
        <div className={cn("w-full border p-6 sm:p-10 rounded-sm shadow-xs transition-colors duration-200", themeContainerClass)}>
          
          {/* Episode Header */}
          <div className="border-b border-stone-300/40 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <button
                  onClick={() => {
                    setShowEpisodeModal(true);
                    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  }}
                  className="text-xs font-bold uppercase tracking-widest text-amber-800 px-2 py-0.5 border border-amber-400/50 bg-amber-50/70 hover:bg-amber-100 rounded-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs group"
                  title={t('novel_select_episode_hint', language)}
                >
                  <BookOpen size={11} className="text-amber-700 group-hover:scale-110 transition-transform" />
                  <span>EPISODE {currentEpisodeNum} / {TOTAL_EPISODES}</span>
                  <ChevronDown size={11} className="text-amber-600" />
                </button>
                {parsedContent.sourceRange && (
                  <span className="text-xs font-bold text-stone-600 px-2 py-0.5 border border-stone-300 rounded-sm bg-stone-100">
                    {parsedContent.sourceRange}
                  </span>
                )}
                {claimedRewards[currentEpisodeNum] && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-300 rounded-sm flex items-center gap-1">
                    <Check size={10} /> {language === 'ko' ? '완독 보상 획득' : 'Completed'}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {parsedContent.title}
              </h1>
            </div>

            {/* Featured Characters in this episode */}
            {episodeCharacters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-stone-500 block w-full sm:w-auto">[ 등장 캐릭터 ]</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {episodeCharacters.map(char => {
                    return (
                      <button
                        key={char.cardId}
                        onClick={() => setSelectedWikiCardId(char.cardId)}
                        className="flex items-center gap-1 px-2 py-1 border border-stone-300 rounded-sm bg-white/80 hover:bg-amber-100/60 transition-all cursor-pointer text-xs font-bold"
                        title={language === 'ko' ? `${char.cardName} 카드 위키 보기` : `View Card Wiki for ${char.cardName}`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-stone-400 shrink-0 overflow-hidden"
                          style={getCardSpriteStyle(char.cardId)}
                        />
                        <span>{char.cardName}</span>
                        <ExternalLink size={10} className="text-stone-400 ml-0.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Prompt Mode Information Banner */}
          {isPromptMode && (
            <div className="mb-8 p-4 border border-amber-400 bg-amber-50/90 text-amber-950 rounded-sm text-xs leading-relaxed font-mono">
              <div className="flex items-center gap-2 font-bold mb-1 text-amber-900">
                <Sparkles size={16} className="text-amber-600" />
                <span>[ {t('novel_prompt_mode_toggle', language)} : ACTIVE ]</span>
              </div>
              <p className="text-[11px] opacity-90">{t('novel_prompt_mode_desc', language)}</p>
            </div>
          )}

          {/* TTS Player Bar */}
          <div className="mb-8 p-3 border border-stone-300/60 bg-stone-100/60 rounded-sm flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-stone-600" />
              <span className="font-bold">TTS Voice Reader</span>
              {ttsParagraphIndex !== null && (
                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-sm">
                  {language === 'ko' ? `문단 ${ttsParagraphIndex + 1}` : `Paragraph ${ttsParagraphIndex + 1}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isTtsPlaying && !isTtsPaused && (
                <button
                  onClick={() => startTtsFromParagraph(0)}
                  className="px-3 py-1 bg-[#201d1d] text-white text-xs font-bold rounded-sm hover:bg-stone-800 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Play size={12} /> {t('novel_tts_play', language)}
                </button>
              )}

              {isTtsPlaying && (
                <button
                  onClick={pauseTts}
                  className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-sm hover:bg-amber-700 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Pause size={12} /> {t('novel_tts_pause', language)}
                </button>
              )}

              {isTtsPaused && (
                <button
                  onClick={resumeTts}
                  className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-sm hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Play size={12} /> {language === 'ko' ? '이어서 재생' : 'Resume'}
                </button>
              )}

              {(isTtsPlaying || isTtsPaused) && (
                <button
                  onClick={stopTts}
                  className="px-2.5 py-1 bg-stone-300 text-stone-800 text-xs font-bold rounded-sm hover:bg-stone-400 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Square size={12} /> Stop
                </button>
              )}
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center font-mono">
              <div className="w-8 h-8 border-2 border-stone-300 border-t-[#201d1d] rounded-full animate-spin mb-4" />
              <p className="text-xs text-stone-500 font-bold">[ LOADING NOVEL EPISODE FROM /public/book... ]</p>
            </div>
          ) : isPromptMode && narrationData?.scenes ? (
            /* ── PROMPT MODE: SCENE NARRATIONS & AI VIDEO PROMPTS ── */
            <div className="space-y-8 font-mono">
              {/* 1. 20문장 스토리 요약 (20-Sentence Story Summary) */}
              <div className="border border-stone-300 p-5 rounded-sm bg-white/80 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2 flex-wrap gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-2">
                    <Bookmark size={15} className="text-amber-700" />
                    [ {t('novel_prompt_summary_label', language)} ({narrationData.scenes.length}) ]
                  </span>
                  <button
                    onClick={() =>
                      handleCopyText(
                        narrationData.scenes.map(s => `[#${s.sceneNumber}] ` + (language === 'ko' ? s.narrationKo : s.narrationEn)).join('\n\n'),
                        t('novel_prompt_copy_20_summary', language)
                      )
                    }
                    className="px-2.5 py-1 text-[11px] font-bold border border-amber-300 rounded-sm bg-amber-50 hover:bg-amber-100 text-amber-950 cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                  >
                    <Copy size={12} />
                    <span>{t('novel_prompt_copy_20_summary', language)}</span>
                  </button>
                </div>
                <div className="space-y-3 text-xs leading-relaxed text-stone-800">
                  {narrationData.scenes.map((sc) => (
                    <div key={sc.sceneNumber} className="border-l-2 border-amber-400 pl-3 py-0.5 flex items-start justify-between gap-2 group hover:bg-amber-50/50 transition-colors rounded-r-xs">
                      <p className="flex-1">
                        <span className="font-bold text-amber-900 mr-2">#{sc.sceneNumber}</span>
                        {language === 'ko' ? sc.narrationKo : sc.narrationEn}
                      </p>
                      <button
                        onClick={() =>
                          handleCopyText(
                            language === 'ko' ? sc.narrationKo : sc.narrationEn,
                            `Scene #${sc.sceneNumber} Story Summary`
                          )
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[10px] text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 rounded-xs bg-white cursor-pointer shrink-0"
                        title={language === 'ko' ? '이 문장 복사' : 'Copy line'}
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. 10문장 나레이션 (10-Sentence Narration - 8s Fast Pace 20 Lines) */}
              <div className="border border-stone-300 p-5 rounded-sm bg-white/90 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2 flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-2">
                      <Volume2 size={15} className="text-purple-700" />
                      [ {t('novel_prompt_short_narration_label', language)} ]
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-xs border border-purple-300 font-mono">
                        ⏱️ ~8s / line ({narrationData.scenes.length})
                      </span>
                    </span>
                    <p className="text-[11px] text-stone-500 mt-1 font-sans">
                      {t('novel_prompt_short_narration_desc', language)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const allShort = narrationData.scenes.map(s => {
                        const shortLine = get8SecShortNarration(language === 'ko' ? s.narrationKo : s.narrationEn, language);
                        return `[#${String(s.sceneNumber).padStart(2, '0')}] ${shortLine}`;
                      }).join('\n');
                      handleCopyText(allShort, t('novel_prompt_copy_short_narration', language));
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold border border-purple-300 rounded-sm bg-purple-50 hover:bg-purple-100 text-purple-950 cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                  >
                    <Copy size={12} />
                    <span>{t('novel_prompt_copy_short_narration', language)}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-stone-800">
                  {narrationData.scenes.map((sc) => {
                    const shortNarration = get8SecShortNarration(language === 'ko' ? sc.narrationKo : sc.narrationEn, language);
                    return (
                      <div
                        key={`short-${sc.sceneNumber}`}
                        className="border border-purple-100 bg-purple-50/40 p-2.5 rounded-sm flex flex-col justify-between hover:border-purple-300 hover:bg-purple-50 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1.5 text-[10px] text-purple-800 font-bold border-b border-purple-200/50 pb-1">
                          <span className="flex items-center gap-1">
                            <span className="bg-purple-200 text-purple-900 px-1 py-0.2 rounded-xs font-mono">
                              #{String(sc.sceneNumber).padStart(2, '0')}
                            </span>
                            <span>{language === 'ko' ? '나레이션' : 'Narration'}</span>
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono flex items-center gap-0.5">
                            <Clock size={10} /> ~8s
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-stone-900 font-sans my-1">
                          "{shortNarration}"
                        </p>
                        <div className="mt-2 pt-1 border-t border-purple-200/40 flex items-center justify-end">
                          <button
                            onClick={() => handleCopyText(shortNarration, `Scene #${sc.sceneNumber} 8s Narration`)}
                            className="text-[10px] font-mono text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded-xs hover:bg-purple-100 transition-colors"
                          >
                            <Copy size={10} />
                            <span>[COPY]</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Featured Characters Image Generation Prompts Section */}
              <div className="border border-stone-300 p-5 rounded-sm bg-white/90 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3 flex-wrap gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-2">
                    <User size={15} className="text-amber-700" />
                    [ {language === 'ko' ? '등장 캐릭터 이미지 생성 프롬프트' : 'Featured Characters Image Prompts'} ({promptCharacters.length}) ]
                  </span>
                  <button
                    onClick={() => {
                      const fullPromptText = promptCharacters.map(c => {
                        const p = c.artPrompt;
                        return `[Character: ${p.cardNameKo} (${p.cardNameEn})]\nPositive Prompt (EN): ${p.positivePromptEn}\nPositive Prompt (KO): ${p.positivePromptKo}\nNegative Prompt: ${p.negativePrompt}\nWebtoon Panel: ${p.webtoonPanelPrompt}`;
                      }).join('\n\n---\n\n');
                      handleCopyText(fullPromptText, language === 'ko' ? '전체 캐릭터 프롬프트' : 'All Character Prompts');
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold border border-amber-400 rounded-sm bg-amber-50 hover:bg-amber-100 text-amber-950 cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Copy size={12} />
                    <span>{language === 'ko' ? '모든 캐릭터 프롬프트 복사' : 'Copy All Character Prompts'}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {promptCharacters.map(char => {
                    const p = char.artPrompt;
                    const paddedId = String(char.cardId).padStart(3, '0');

                    return (
                      <div key={char.cardId} className="border border-stone-200 p-4 rounded-sm bg-stone-50/70 hover:border-amber-400 transition-colors">
                        {/* Character Header */}
                        <div className="flex items-center justify-between mb-3 border-b border-stone-200/80 pb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full border border-stone-400 shrink-0 overflow-hidden shadow-xs"
                              style={getCardSpriteStyle(char.cardId)}
                            />
                            <div>
                              <span className="font-bold text-xs text-stone-900 mr-2">
                                {p.cardNameKo} <span className="text-stone-500 font-normal text-[11px]">({p.cardNameEn})</span>
                              </span>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-sm uppercase">
                                #{paddedId} · {p.faction} · {p.rarityTier}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedWikiCardId(char.cardId)}
                              className="px-2 py-0.5 text-[10px] font-bold border border-stone-300 text-stone-700 bg-white hover:bg-stone-100 rounded-sm cursor-pointer flex items-center gap-1"
                              title={language === 'ko' ? '카드 위키' : 'Card Wiki'}
                            >
                              <ExternalLink size={10} />
                              <span>{language === 'ko' ? '위키' : 'Wiki'}</span>
                            </button>
                            <button
                              onClick={() => {
                                const singleText = `[Character Art Prompt: ${p.cardNameKo} / ${p.cardNameEn}]\nPrompt: ${p.positivePromptEn}\nNegative: ${p.negativePrompt}\nWebtoon Panel: ${p.webtoonPanelPrompt}`;
                                handleCopyText(singleText, p.cardNameKo);
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-sm cursor-pointer flex items-center gap-1"
                            >
                              <Copy size={10} />
                              <span>{language === 'ko' ? '프롬프트 복사' : 'Copy Prompt'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Visual Keywords */}
                        {p.visualKeywords.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mb-2">
                            <span className="text-[10px] text-stone-400 font-bold mr-1">[KEYWORDS]:</span>
                            {p.visualKeywords.map((kw, idx) => (
                              <span key={idx} className="text-[10px] font-mono bg-stone-200/70 text-stone-700 px-1.5 py-0.2 rounded-xs">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Prompts Details Box */}
                        <div className="space-y-2 text-xs">
                          {/* Positive Prompt (EN) */}
                          <div className="bg-white p-2.5 border border-stone-200 rounded-sm font-mono text-stone-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-amber-800 font-bold">[POSITIVE IMAGE PROMPT (EN)]:</span>
                              <button
                                onClick={() => handleCopyText(p.positivePromptEn, `${p.cardNameKo} (EN Prompt)`)}
                                className="text-[10px] text-stone-500 hover:text-stone-900 font-bold cursor-pointer"
                              >
                                [COPY]
                              </button>
                            </div>
                            <p className="text-[11px] leading-relaxed text-stone-800 selection:bg-amber-200">{p.positivePromptEn}</p>
                          </div>

                          {/* Positive Prompt (KO) */}
                          <div className="bg-white/80 p-2 border border-stone-200 rounded-sm font-mono text-stone-700">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-stone-500 font-bold">[이미지 생성 프롬프트 설명 (KO)]:</span>
                              <button
                                onClick={() => handleCopyText(p.positivePromptKo, `${p.cardNameKo} (KO Prompt)`)}
                                className="text-[10px] text-stone-500 hover:text-stone-900 font-bold cursor-pointer"
                              >
                                [COPY]
                              </button>
                            </div>
                            <p className="text-[11px] leading-relaxed text-stone-700">{p.positivePromptKo}</p>
                          </div>

                          {/* Webtoon Panel & Negative Prompt Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div className="bg-stone-100/80 p-2 border border-stone-200 rounded-sm">
                              <span className="text-[10px] text-stone-500 font-bold block mb-0.5">[WEBTOON PANEL PROMPT]:</span>
                              <p className="text-stone-700 text-[10px] line-clamp-3">{p.webtoonPanelPrompt}</p>
                            </div>
                            <div className="bg-stone-100/80 p-2 border border-stone-200 rounded-sm">
                              <span className="text-[10px] text-stone-500 font-bold block mb-0.5">[NEGATIVE PROMPT]:</span>
                              <p className="text-stone-500 text-[10px] truncate">{p.negativePrompt}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scene & Character AI Prompts (Pure English 20 Continuous Prompts) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-300 pb-3 flex-wrap gap-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-700" />
                    [ {language === 'ko' ? '장면별 AI 동영상 및 캐릭터 생성 프롬프트' : 'Scene AI Video & Character Prompts'} (20) ]
                  </h3>
                  <button
                    onClick={() => {
                      const full20Text = continuous20Prompts.join('\n\n');
                      handleCopyText(full20Text, language === 'ko' ? '20개 프롬프트 전체 복사' : 'Copy All 20 Prompts');
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold border border-amber-400 rounded-sm bg-amber-50 hover:bg-amber-100 text-amber-950 cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Copy size={12} />
                    <span>{language === 'ko' ? '20개 프롬프트 한 번에 복사' : 'Copy All 20 Prompts'}</span>
                  </button>
                </div>

                {/* Continuous 20 English Prompts Display Box */}
                <div className="bg-white border border-stone-300 p-4 rounded-sm font-mono text-xs text-stone-900 leading-relaxed shadow-2xs space-y-3">
                  {continuous20Prompts.map((promptText, idx) => (
                    <div key={idx} className="pb-3 border-b border-stone-100 last:border-b-0 last:pb-0 flex items-start gap-2.5">
                      <span className="text-[10px] text-amber-800 font-bold shrink-0 pt-0.5 select-none">
                        [{String(idx + 1).padStart(2, '0')}]
                      </span>
                      <p className="grow text-stone-800 text-[11px] leading-relaxed selection:bg-amber-200 select-all">
                        {promptText}
                      </p>
                      <button
                        onClick={() => handleCopyText(promptText, `Prompt #${idx + 1}`)}
                        className="text-[10px] text-stone-400 hover:text-amber-900 font-bold shrink-0 cursor-pointer px-1.5 py-0.5 border border-stone-200 hover:border-amber-300 rounded-xs bg-stone-50 hover:bg-amber-50 transition-colors"
                        title="Copy single prompt"
                      >
                        [COPY]
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : readerTab === 'cartoon' && !isPromptMode ? (
            /* ── CARTOON WEBTOON VIEWER (IMAGE SCENE PANELS) ── */
            <div className="w-full space-y-6 font-mono">
              {/* Cartoon Subheader & Display Mode Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-stone-300 bg-stone-50 rounded-sm text-xs">
                <div className="flex items-center gap-2">
                  <Image size={18} className="text-amber-800" />
                  <span className="font-bold text-stone-900">
                    [ {language === 'ko' ? `제 ${currentEpisodeNum}화 카툰 웹툰` : `Episode ${currentEpisodeNum} Webtoon`} ]
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-[10px] text-stone-500 font-bold hidden sm:inline">[ VIEW MODE ]:</span>
                  <button
                    onClick={() => setCartoonDisplayMode('scroll')}
                    className={cn(
                      "px-2.5 py-1 text-xs font-bold border rounded-sm transition-all cursor-pointer flex items-center gap-1",
                      cartoonDisplayMode === 'scroll'
                        ? "bg-[#201d1d] text-white border-[#201d1d]"
                        : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                    )}
                  >
                    <Layers size={13} />
                    <span>{language === 'ko' ? '세로 스크롤' : 'Scroll'}</span>
                  </button>
                  <button
                    onClick={() => setCartoonDisplayMode('slides')}
                    className={cn(
                      "px-2.5 py-1 text-xs font-bold border rounded-sm transition-all cursor-pointer flex items-center gap-1",
                      cartoonDisplayMode === 'slides'
                        ? "bg-[#201d1d] text-white border-[#201d1d]"
                        : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                    )}
                  >
                    <Film size={13} />
                    <span>{language === 'ko' ? '슬라이드' : 'Slides'}</span>
                  </button>
                </div>
              </div>

              {/* Vertical Scroll Webtoon Strip View */}
              {cartoonDisplayMode === 'scroll' ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((scNum) => {
                    const attempt = sceneImgAttempts[`${currentEpisodeNum}_${scNum}`] || 0;
                    const isFailedAll = attempt > 10;
                    const imgUrl = getCartoonSceneUrl(currentEpisodeNum, scNum, attempt);

                    return (
                      <div key={scNum} className="border border-stone-300 rounded-sm bg-white overflow-hidden shadow-xs hover:border-amber-400 transition-all">
                        {/* Scene Card Header */}
                        <div className="bg-stone-100 border-b border-stone-200 px-4 py-2 flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-amber-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                            SCENE {pad2(scNum)} / 05
                          </span>
                          <button
                            onClick={() => setLightboxSceneIndex(scNum)}
                            className="px-2 py-0.5 border border-stone-300 rounded-xs bg-white hover:bg-amber-50 text-stone-700 text-[11px] font-bold cursor-pointer flex items-center gap-1"
                            title={language === 'ko' ? '크게 보기' : 'Fullscreen'}
                          >
                            <Maximize2 size={12} />
                            <span className="hidden sm:inline">{language === 'ko' ? '확대' : 'Zoom'}</span>
                          </button>
                        </div>

                        {/* Scene Image Area */}
                        <div
                          className="relative w-full bg-stone-900 flex items-center justify-center min-h-[280px] sm:min-h-[420px] group cursor-pointer"
                          onClick={() => setLightboxSceneIndex(scNum)}
                        >
                          {!isFailedAll ? (
                            <img
                              src={imgUrl}
                              alt={`Cartoon Episode ${currentEpisodeNum} Scene ${scNum}`}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={() => {
                                setSceneImgAttempts(prev => ({
                                  ...prev,
                                  [`${currentEpisodeNum}_${scNum}`]: (prev[`${currentEpisodeNum}_${scNum}`] || 0) + 1
                                }));
                              }}
                              className="w-full h-auto max-h-[800px] object-contain transition-transform duration-300 group-hover:scale-[1.005]"
                            />
                          ) : (
                            /* Fallback Character Card Panel */
                            <div className="w-full py-12 px-6 flex flex-col items-center justify-center text-center font-mono bg-stone-900 text-stone-200">
                              <div
                                style={getCardSpriteStyle(((currentEpisodeNum * 5 + scNum) % 110) + 1)}
                                className="w-28 h-28 rounded-lg mb-3 border border-stone-700 bg-stone-950 drop-shadow-md"
                              />
                              <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
                                [ EPISODE {currentEpisodeNum} · SCENE {pad2(scNum)} ]
                              </span>
                            </div>
                          )}

                          {/* Hover Zoom Prompt Badge */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-sm font-bold flex items-center gap-1.5 border border-amber-400/50">
                              <Maximize2 size={14} />
                              {language === 'ko' ? '클릭하여 큰 화면으로 감상' : 'Click to View Lightbox'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Single Slide Mode View */
                <div className="border border-stone-300 rounded-sm bg-white overflow-hidden shadow-xs p-4 sm:p-6 space-y-4">
                  {(() => {
                    const scNum = activeSlideIndex;
                    const attempt = sceneImgAttempts[`${currentEpisodeNum}_${scNum}`] || 0;
                    const isFailedAll = attempt > 10;
                    const imgUrl = getCartoonSceneUrl(currentEpisodeNum, scNum, attempt);

                    return (
                      <div className="space-y-4 font-mono">
                        {/* Slide Navigation Header */}
                        <div className="flex items-center justify-between border-b border-stone-200 pb-3 text-xs">
                          <span className="font-bold text-amber-900">
                            SCENE {pad2(scNum)} / 05
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                              <button
                                key={n}
                                onClick={() => setActiveSlideIndex(n)}
                                className={cn(
                                  "w-6 h-6 rounded-xs text-[10px] font-bold cursor-pointer transition-all border",
                                  activeSlideIndex === n
                                    ? "bg-amber-600 text-white border-amber-700"
                                    : "bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200"
                                )}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Active Slide Image */}
                        <div
                          className="relative w-full bg-stone-900 flex items-center justify-center min-h-[320px] sm:min-h-[480px] cursor-pointer group rounded-sm overflow-hidden"
                          onClick={() => setLightboxSceneIndex(scNum)}
                        >
                          {!isFailedAll ? (
                            <img
                              src={imgUrl}
                              alt={`Cartoon Episode ${currentEpisodeNum} Scene ${scNum}`}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={() => {
                                setSceneImgAttempts(prev => ({
                                  ...prev,
                                  [`${currentEpisodeNum}_${scNum}`]: (prev[`${currentEpisodeNum}_${scNum}`] || 0) + 1
                                }));
                              }}
                              className="w-full h-auto max-h-[720px] object-contain"
                            />
                          ) : (
                            <div className="w-full py-16 px-6 flex flex-col items-center justify-center text-center font-mono bg-stone-900 text-stone-200">
                              <div
                                style={getCardSpriteStyle(((currentEpisodeNum * 5 + scNum) % 110) + 1)}
                                className="w-32 h-32 rounded-lg mb-3 border border-stone-700 bg-stone-950 drop-shadow-md"
                              />
                              <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
                                [ SCENE {pad2(scNum)} ]
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Prev / Next Slide Navigation Buttons */}
                        <div className="flex items-center justify-between pt-2">
                          <button
                            onClick={() => setActiveSlideIndex(prev => Math.max(1, prev - 1))}
                            disabled={activeSlideIndex <= 1}
                            className={cn(
                              "px-3 py-1.5 border rounded-sm font-bold text-xs flex items-center gap-1 cursor-pointer transition-all",
                              activeSlideIndex <= 1 ? "opacity-50 cursor-not-allowed bg-stone-100" : "bg-white hover:bg-stone-100"
                            )}
                          >
                            <ChevronLeft size={14} />
                            <span>{language === 'ko' ? '이전 장면' : 'Prev Scene'}</span>
                          </button>
                          <button
                            onClick={() => setActiveSlideIndex(prev => Math.min(5, prev + 1))}
                            disabled={activeSlideIndex >= 5}
                            className={cn(
                              "px-3 py-1.5 border rounded-sm font-bold text-xs flex items-center gap-1 cursor-pointer transition-all",
                              activeSlideIndex >= 5 ? "opacity-50 cursor-not-allowed bg-stone-100" : "bg-white hover:bg-stone-100"
                            )}
                          >
                            <span>{language === 'ko' ? '다음 장면' : 'Next Scene'}</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            /* ── STANDARD NOVEL READING DISPLAY ── */
            <div className={cn("space-y-6 font-mono text-justify", fontClass)}>
              {parsedContent.paragraphs.map((paragraph, index) => {
                const isSpeaking = ttsParagraphIndex === index && (isTtsPlaying || isTtsPaused);

                return (
                  <p
                    key={index}
                    onClick={() => startTtsFromParagraph(index)}
                    className={cn(
                      "transition-all cursor-pointer p-2 rounded-sm relative group border-l-2",
                      isSpeaking
                        ? "border-amber-500 bg-amber-100/60 font-medium"
                        : "border-transparent hover:border-stone-300 hover:bg-stone-100/40"
                    )}
                    title={t('novel_tts_start_here', language)}
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>
          )}

          {/* Episode Complete Reward Button */}
          <div className="mt-12 pt-6 border-t border-stone-300/60 flex flex-col items-center gap-3">
            {!claimedRewards[currentEpisodeNum] ? (
              <button
                onClick={() => handleClaimEpisodeReward(currentEpisodeNum)}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-amber-600"
              >
                <Gift size={16} />
                <span>{language === 'ko' ? `제 ${currentEpisodeNum}화 완독 보상 (100 SNS) 받기` : `Claim Episode ${currentEpisodeNum} Reward (100 SNS)`}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 border border-emerald-300 rounded-sm">
                <Award size={16} />
                <span>{t('novel_reward_already_claimed', language)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Pagination Controls */}
        <div className="w-full flex items-center justify-between mt-6 font-mono text-xs">
          <button
            onClick={() => {
              if (currentEpisodeNum > 1) {
                setCurrentEpisodeNum(prev => prev - 1);
                if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={currentEpisodeNum <= 1}
            className={cn(
              "px-4 py-2 border rounded-sm font-bold flex items-center gap-2 transition-all cursor-pointer",
              currentEpisodeNum <= 1
                ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                : "bg-white text-stone-800 border-stone-300 hover:bg-stone-100 active:scale-95"
            )}
          >
            <ChevronLeft size={16} />
            <span>[ {language === 'ko' ? '이전 회차' : 'PREV EP'} ]</span>
          </button>

          {/* Middle 1 / 40 Button to open Episode Selection Popup */}
          <button
            id="novel-episode-selector-btn"
            onClick={() => {
              setShowEpisodeModal(true);
              if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }}
            className="px-4 py-2 border border-stone-300 hover:border-[#201d1d] bg-white hover:bg-stone-100 rounded-sm font-bold text-stone-800 flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95 group"
            title={t('novel_select_episode_hint', language)}
          >
            <BookOpen size={14} className="text-amber-700 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-[#201d1d]">{currentEpisodeNum} / {TOTAL_EPISODES}</span>
            <ChevronDown size={13} className="text-stone-400 group-hover:text-stone-700" />
          </button>

          <button
            onClick={() => {
              if (currentEpisodeNum < TOTAL_EPISODES) {
                setCurrentEpisodeNum(prev => prev + 1);
                if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={currentEpisodeNum >= TOTAL_EPISODES}
            className={cn(
              "px-4 py-2 border rounded-sm font-bold flex items-center gap-2 transition-all cursor-pointer",
              currentEpisodeNum >= TOTAL_EPISODES
                ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                : "bg-white text-stone-800 border-stone-300 hover:bg-stone-100 active:scale-95"
            )}
          >
            <span>[ {language === 'ko' ? '다음 회차' : 'NEXT EP'} ]</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full border-t border-stone-300 bg-[#fdfcfc] py-4 text-center font-mono text-[11px] text-stone-500">
        <p>© 2026 SNSHero Revolution — Official Web Novel /public/book (40 Episodes)</p>
      </footer>

      {/* ── EPISODE SELECTOR MODAL ── */}
      {showEpisodeModal && (
        <div
          className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-mono"
          onClick={() => setShowEpisodeModal(false)}
        >
          <div
            className="bg-[#fdfcfc] text-[#201d1d] w-full max-w-2xl max-h-[85vh] rounded-none border border-stone-400 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-300 bg-stone-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-amber-700" />
                <h3 className="font-bold text-sm sm:text-base text-[#201d1d]">
                  [ {t('novel_select_episode_modal_title', language)} ]
                </h3>
              </div>
              <button
                onClick={() => setShowEpisodeModal(false)}
                className="p-1 border border-stone-300 rounded-sm hover:bg-stone-200 text-stone-700 cursor-pointer transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Search & Filter Tabs */}
            <div className="p-3 border-b border-stone-200 bg-white/70 space-y-2 shrink-0">
              {/* Range Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                {[
                  { id: 'all', labelKo: '전체 (1~40)', labelEn: 'All (1~40)' },
                  { id: '1-10', labelKo: '1~10화', labelEn: 'Ep 1~10' },
                  { id: '11-20', labelKo: '11~20화', labelEn: 'Ep 11~20' },
                  { id: '21-30', labelKo: '21~30화', labelEn: 'Ep 21~30' },
                  { id: '31-40', labelKo: '31~40화', labelEn: 'Ep 31~40' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setEpisodeModalFilter(tab.id as any);
                      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    }}
                    className={cn(
                      "px-3 py-1.5 border rounded-sm font-bold whitespace-nowrap cursor-pointer transition-all min-h-[36px] flex items-center justify-center",
                      episodeModalFilter === tab.id
                        ? "bg-[#201d1d] text-white border-[#201d1d] shadow-2xs"
                        : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                    )}
                  >
                    [ {language === 'ko' ? tab.labelKo : tab.labelEn} ]
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={episodeModalSearch}
                  onChange={(e) => setEpisodeModalSearch(e.target.value)}
                  placeholder={language === 'ko' ? '회차 번호 또는 소설 제목 검색 (예: 5, 카단, 각성...)' : 'Search episode number or title...'}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-stone-300 rounded-sm focus:outline-hidden focus:border-[#201d1d]"
                />
                {episodeModalSearch && (
                  <button
                    onClick={() => setEpisodeModalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Episodes List Grid */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 max-h-[55vh] space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.from({ length: TOTAL_EPISODES }, (_, i) => i + 1)
                  .filter((epNum) => {
                    // Range filter
                    if (episodeModalFilter === '1-10' && (epNum < 1 || epNum > 10)) return false;
                    if (episodeModalFilter === '11-20' && (epNum < 11 || epNum > 20)) return false;
                    if (episodeModalFilter === '21-30' && (epNum < 21 || epNum > 30)) return false;
                    if (episodeModalFilter === '31-40' && (epNum < 31 || epNum > 40)) return false;

                    // Search keyword filter
                    if (episodeModalSearch.trim()) {
                      const q = episodeModalSearch.trim().toLowerCase();
                      const meta = indexData?.episodes.find(e => e.episodeNumber === epNum);
                      const titleKo = meta?.titleKo.toLowerCase() || '';
                      const titleEn = ENGLISH_NOVEL_MAP[epNum]?.titleEn.toLowerCase() || '';
                      const numStr = epNum.toString();
                      return numStr.includes(q) || titleKo.includes(q) || titleEn.includes(q);
                    }
                    return true;
                  })
                  .map((epNum) => {
                    const meta = indexData?.episodes.find(e => e.episodeNumber === epNum);
                    const isCurrent = epNum === currentEpisodeNum;
                    const isClaimed = claimedRewards[epNum];
                    const epTitleKo = meta ? meta.titleKo : `제 ${epNum}화`;
                    const epTitleEn = ENGLISH_NOVEL_MAP[epNum]?.titleEn || (meta ? meta.titleKo : `Episode ${epNum}`);

                    return (
                      <button
                        key={`ep-modal-${epNum}`}
                        onClick={() => {
                          setCurrentEpisodeNum(epNum);
                          setShowEpisodeModal(false);
                          stopTts();
                          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={cn(
                          "p-2.5 border rounded-sm text-left transition-all cursor-pointer flex items-center justify-between gap-2 group",
                          isCurrent
                            ? "bg-[#201d1d] text-white border-[#201d1d] shadow-sm ring-1 ring-amber-400"
                            : "bg-white text-stone-800 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className={cn(
                              "text-xs font-mono font-bold px-1.5 py-0.5 rounded-xs shrink-0",
                              isCurrent
                                ? "bg-amber-400 text-stone-900"
                                : "bg-stone-100 text-stone-700 group-hover:bg-amber-100 group-hover:text-amber-900"
                            )}
                          >
                            #{String(epNum).padStart(2, '0')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-xs font-bold truncate", isCurrent ? "text-white" : "text-stone-900")}>
                              {language === 'ko' ? epTitleKo : epTitleEn}
                            </p>
                            <p className={cn("text-[10px] truncate opacity-70", isCurrent ? "text-amber-200" : "text-stone-500")}>
                              {language === 'ko' ? epTitleEn : epTitleKo}
                            </p>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="shrink-0 flex items-center gap-1">
                          {isCurrent ? (
                            <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded-xs">
                              {language === 'ko' ? '읽는 중' : 'Reading'}
                            </span>
                          ) : isClaimed ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-xs flex items-center gap-0.5">
                              <Check size={10} /> 100 SNS
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-400 border border-stone-200 px-1.5 py-0.2 rounded-xs">
                              {language === 'ko' ? '미완독' : 'Unread'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-stone-300 bg-stone-50 flex items-center justify-between text-xs text-stone-500 shrink-0">
              <span>{language === 'ko' ? `총 ${TOTAL_EPISODES}개 회차 중 ${Object.keys(claimedRewards).length}개 완독` : `${Object.keys(claimedRewards).length} / ${TOTAL_EPISODES} Episodes Read`}</span>
              <button
                onClick={() => setShowEpisodeModal(false)}
                className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-sm cursor-pointer transition-colors"
              >
                [ {language === 'ko' ? '닫기' : 'Close'} ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Detail Modal (Wiki) */}
      {selectedWikiCard && (
        <WikiCardDetailModal
          selectedCard={selectedWikiCard}
          language={language}
          lowSpecMode={lowSpecMode}
          initialTab="art"
          onClose={() => setSelectedWikiCardId(null)}
          onNavigate={onNavigate}
          onSelectCard={(card) => setSelectedWikiCardId(card.id)}
          onOpenViewer={() => {
            setSelectedWikiCardId(null);
            onNavigate('wiki-card');
          }}
          onPrintCard={() => {}}
          onDownloadCard={() => {}}
          season={currentSeason}
          availableSkins={selectedWikiCard ? getAvailableSkins(selectedWikiCard.id) : []}
          isSkinUnlocked={isSkinUnlocked}
          isSkinActive={isSkinActive}
          onApplySkin={applySkin}
          onRemoveSkin={removeSkin}
        />
      )}

      {/* Lightbox Fullscreen Cartoon Modal */}
      {lightboxSceneIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-between p-4 sm:p-6 font-mono select-none animate-fadeIn"
          onClick={() => setLightboxSceneIndex(null)}
        >
          {/* Lightbox Header */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white border-b border-stone-800 pb-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 border border-amber-800/80 rounded-sm uppercase">
                EPISODE {currentEpisodeNum} · SCENE {pad2(lightboxSceneIndex)} / 05
              </span>
              <span className="text-xs text-stone-300 font-bold hidden sm:inline">
                {parsedContent.title}
              </span>
            </div>

            <button
              onClick={() => setLightboxSceneIndex(null)}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-sm transition-all cursor-pointer flex items-center gap-1 text-xs font-bold border border-stone-700"
            >
              <X size={18} />
              <span>[ CLOSE ]</span>
            </button>
          </div>

          {/* Lightbox Image Container */}
          <div className="relative my-auto max-w-5xl max-h-[80vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img
              src={getCartoonSceneUrl(currentEpisodeNum, lightboxSceneIndex, sceneImgAttempts[`${currentEpisodeNum}_${lightboxSceneIndex}`] || 0)}
              alt={`Episode ${currentEpisodeNum} Scene ${lightboxSceneIndex}`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain rounded-sm shadow-2xl border border-stone-800"
              onError={() => {
                const key = `${currentEpisodeNum}_${lightboxSceneIndex}`;
                setSceneImgAttempts(prev => ({
                  ...prev,
                  [key]: (prev[key] || 0) + 1
                }));
              }}
            />

            {/* Prev Scene Arrow */}
            <button
              onClick={() => setLightboxSceneIndex(prev => (prev && prev > 1 ? prev - 1 : 5))}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full border border-stone-700 cursor-pointer transition-all hover:scale-105"
              title="Previous Scene"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Next Scene Arrow */}
            <button
              onClick={() => setLightboxSceneIndex(prev => (prev && prev < 5 ? prev + 1 : 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full border border-stone-700 cursor-pointer transition-all hover:scale-105"
              title="Next Scene"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Lightbox Footer Caption */}
          <div className="w-full max-w-3xl bg-stone-900/90 border border-stone-800 p-3 rounded-sm text-center text-xs text-stone-200 leading-relaxed" onClick={e => e.stopPropagation()}>
            {narrationData?.scenes?.[lightboxSceneIndex - 1] ? (
              <p>
                <span className="text-amber-400 font-bold mr-1">#{lightboxSceneIndex}</span>
                {language === 'ko'
                  ? narrationData.scenes[lightboxSceneIndex - 1].narrationKo
                  : narrationData.scenes[lightboxSceneIndex - 1].narrationEn}
              </p>
            ) : (
              <p>{parsedContent.title} — Scene #{lightboxSceneIndex}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NovelView;
