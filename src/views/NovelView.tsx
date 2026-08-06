import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Play, Pause, Square, Volume2, Copy, Sparkles, ChevronLeft, ChevronRight,
  Check, Settings, Moon, Sun, Gift, ArrowLeft, Bookmark, List, ExternalLink, Award
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { t } from '../lib/i18n';
import { cn, getAssetUrl } from '../lib/utils';
import { CARD_DATABASE } from '../cardDatabase';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import { WikiCardDetailModal } from '../components/WikiCardDetailModal';
import { useGameSettings } from '../contexts/GameSettingsContext';
import { useCardSkins } from '../hooks/useCardSkins';

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

  // 2. Fetch episode markdown and narrations whenever currentEpisodeNum changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    stopTts();

    const epPad = pad2(currentEpisodeNum);

    const loadEpisodeContent = async () => {
      try {
        const [mdRes, narrRes] = await Promise.all([
          fetch(getAssetUrl(`/book/episode_${epPad}.md`)),
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
  }, [currentEpisodeNum]);

  // Parse markdown content into structured title, source range, and paragraphs
  const parsedContent = React.useMemo(() => {
    if (!markdownText) return { title: `제 ${currentEpisodeNum}화`, sourceRange: '', paragraphs: [] };

    const lines = markdownText.split('\n').map(l => l.trim());
    let title = `제 ${currentEpisodeNum}화`;
    let sourceRange = '';
    const bodyParagraphs: string[] = [];

    // Temporary accumulator for multi-line paragraphs
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

    // Replace Korean title if English mode and narrations present
    if (language !== 'ko' && narrationData?.episodeTitleEn) {
      title = `Episode ${currentEpisodeNum} - ${narrationData.episodeTitleEn}`;
    }

    return { title, sourceRange, paragraphs: bodyParagraphs };
  }, [markdownText, currentEpisodeNum, language, narrationData]);

  // Characters appearing in current episode
  const episodeCharacters = React.useMemo(() => {
    if (!indexData?.characters) return [];
    return indexData.characters.filter(c => c.episodeNumbers.includes(currentEpisodeNum));
  }, [indexData, currentEpisodeNum]);

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
                    {meta ? meta.titleKo : `Episode ${epNum}`}
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
                <span className="text-xs font-bold uppercase tracking-widest text-amber-800 px-2 py-0.5 border border-amber-400/50 bg-amber-50/70 rounded-sm">
                  EPISODE {currentEpisodeNum} / {TOTAL_EPISODES}
                </span>
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
                    const cardDbItem = CARD_DATABASE[char.cardId];
                    const paddedId = String(char.cardId).padStart(3, '0');
                    const imgUrl = getAssetUrl(`/character/${paddedId}.png`);

                    return (
                      <button
                        key={char.cardId}
                        onClick={() => setSelectedWikiCardId(char.cardId)}
                        className="flex items-center gap-1 px-2 py-1 border border-stone-300 rounded-sm bg-white/80 hover:bg-amber-100/60 transition-all cursor-pointer text-xs font-bold"
                        title={language === 'ko' ? `${char.cardName} 카드 위키 보기` : `View Card Wiki for ${char.cardName}`}
                      >
                        <img
                          src={imgUrl}
                          alt={char.cardName}
                          className="w-4 h-4 object-cover rounded-full border border-stone-400 shrink-0"
                          onError={(e) => {
                            // Fallback to cardDatabase avatar
                            (e.target as HTMLImageElement).src = getAssetUrl(`/assets/cards/card-${paddedId}.webp`);
                          }}
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
              {/* Story Summary Section */}
              <div className="border border-stone-300 p-5 rounded-sm bg-white/80">
                <div className="flex items-center justify-between mb-4 border-b border-stone-200 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-800 flex items-center gap-2">
                    <Bookmark size={14} />
                    {t('novel_prompt_summary_label', language)}
                  </span>
                  <button
                    onClick={() =>
                      handleCopyText(
                        narrationData.scenes.map(s => (language === 'ko' ? s.narrationKo : s.narrationEn)).join('\n\n'),
                        t('novel_prompt_summary_label', language)
                      )
                    }
                    className="px-2 py-1 text-[11px] font-bold border border-stone-300 rounded-sm bg-stone-50 hover:bg-stone-100 cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={12} /> {t('novel_prompt_copy_narration', language)}
                  </button>
                </div>
                <div className="space-y-3 text-xs leading-relaxed text-stone-800">
                  {narrationData.scenes.map((sc) => (
                    <p key={sc.sceneNumber} className="border-l-2 border-amber-400 pl-3">
                      <span className="font-bold text-amber-900 mr-2">#{sc.sceneNumber}</span>
                      {language === 'ko' ? sc.narrationKo : sc.narrationEn}
                    </p>
                  ))}
                </div>
              </div>

              {/* Video Prompts List */}
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-2">
                  [ {language === 'ko' ? '장면별 AI 동영상 및 캐릭터 생성 프롬프트' : 'Scene AI Video & Character Prompts'} ]
                </h3>

                {narrationData.scenes.map((sc) => {
                  const promptText = `Scene ${sc.sceneNumber}: High quality dark fantasy anime artwork, ${sc.narrationEn}`;

                  return (
                    <div key={sc.sceneNumber} className="border border-stone-200 p-4 rounded-sm bg-stone-50/50 hover:border-amber-400 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-amber-800">
                          {t('novel_prompt_scene_label', language).replace('{sceneNumber}', sc.sceneNumber.toString())}
                        </span>
                        <button
                          onClick={() => handleCopyText(promptText, `Scene ${sc.sceneNumber}`)}
                          className="px-2 py-0.5 text-[10px] font-bold border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-sm cursor-pointer flex items-center gap-1"
                        >
                          <Copy size={10} /> {t('novel_prompt_copy_scene', language)}
                        </button>
                      </div>

                      <div className="text-xs bg-white p-2.5 border border-stone-200 rounded-sm font-mono text-stone-800 mb-2">
                        <span className="text-[10px] text-stone-400 font-bold block mb-1">PROMPT:</span>
                        {promptText}
                      </div>

                      <div className="text-xs text-stone-600 italic border-l-2 border-stone-300 pl-3 py-1">
                        "{language === 'ko' ? sc.narrationKo : sc.narrationEn}"
                      </div>
                    </div>
                  );
                })}
              </div>
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

          <span className="font-bold text-stone-600">
            {currentEpisodeNum} / {TOTAL_EPISODES}
          </span>

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
    </div>
  );
};

export default NovelView;
