import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Film,
  Image as ImageIcon,
  Layers,
  MapPin,
  Maximize2,
  MessageSquare,
  Package,
  Search,
  Sparkles,
  User,
  VolumeX,
  X,
  ArrowUp,
  Globe,
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { cn, getAssetUrl } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import { useGameSettings } from '../contexts/GameSettingsContext';

interface CutsceneLocation {
  code: string;
  nameEn: string;
  nameKo: string;
  artUrl: string;
  sheetUrl: string;
  descriptionEn: string;
  descriptionKo: string;
}

interface CutsceneCharacter {
  id: number;
  code: string;
  nameEn: string;
  nameKo: string;
  cutoutUrl: string;
  cutoutFilePath?: string;
  sheetUrl: string;
  defaultWeaponEn?: string;
  sheetPromptEn?: string;
  hairDesignKo?: string;
  signatureItemKo?: string;
}

interface CutsceneProp {
  code: string;
  nameEn: string;
  nameKo: string;
  artUrl: string;
  sheetUrl: string;
  holderEn: string;
  holderKo: string;
  promptEn: string;
}

interface CutsceneDialogue {
  hasDialogue: boolean;
  hasNarration?: boolean;
  audioType?: string;
  speakerEn: string;
  speakerKo: string;
  originalLineEn?: string;
  summarized6sLineEn: string;
  summarized6sLineKo: string;
  dialoguePromptEn?: string;
  dialoguePromptKo?: string;
}

interface CutsceneItem {
  cutNumber: number;
  cutCode: string;
  durationSeconds: number;
  timecode: string;
  sourceParagraphs: number[];
  novelTextEn: string;
  novelTextKo: string;
  episodeSummaryEn?: string;
  episodeSummaryKo?: string;
  location: CutsceneLocation;
  characters: CutsceneCharacter[];
  props: CutsceneProp[];
  dialogue: CutsceneDialogue;
  noTextRuleEn?: string;
  noTextRuleKo?: string;
  unifiedVideoPromptEn?: string;
  cutsceneAnimationPromptEn?: string;
  cutsceneAnimationPromptKo?: string;
}

interface EpisodeCutsceneData {
  episodeNumber: number;
  episodeTitleEn: string;
  episodeTitleKo: string;
  cutsceneDurationSeconds: number;
  totalCutscenes: number;
  totalDurationSeconds: number;
  episodeSummaryEn: string;
  episodeSummaryKo: string;
  cutscenes: CutsceneItem[];
}

interface ScriptViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx?: (url: string) => void;
  currentSeason?: string;
  showCustomAlert?: (title: string, message: string, autoCloseSeconds?: number) => void;
}

const TOTAL_EPISODES = 40;
const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Extracts quoted original dialogue from Korean novel paragraph if present.
 */
function extractKoreanQuotedDialogue(novelTextKo: string): string {
  if (!novelTextKo) return '';
  const matches = novelTextKo.match(/[“"]([^”"]+)[”"]/g);
  if (!matches || matches.length === 0) return '';
  return matches.map((m) => m.replace(/^[“"]|[”"]$/g, '').trim()).join(' ');
}

/**
 * Builds the standardized 6-second cutscene video generation prompt in Korean or English.
 * Strictly enforces:
 * 1) Video length is 6 seconds.
 * 2) The speaking character is the target speaker (대상인물).
 * 3) Any dialogue exceeding 6 seconds must be compressed into <= 6 seconds and spoken by the target speaker.
 */
function buildCutsceneVideoPrompt(epNum: number, cut: CutsceneItem, isKo: boolean): string {
  const epPad = pad2(epNum);
  const cutPad = pad2(cut.cutNumber);
  const flowImgUrl = `/anime-character-sheets/cutscenes_liveaction/ep${epPad}_landscape/images/EP${epPad}_CUT${cutPad}_cutscene.jpg`;
  const hasDialogue = Boolean(cut.dialogue?.hasDialogue);
  const speakerKo = cut.dialogue?.speakerKo || '';
  const speakerEn = cut.dialogue?.speakerEn || '';
  const line6sKo = cut.dialogue?.summarized6sLineKo || '';
  const line6sEn = cut.dialogue?.summarized6sLineEn || '';
  const origKo = extractKoreanQuotedDialogue(cut.novelTextKo);
  const origEn = (cut.dialogue?.originalLineEn || '').trim();

  if (isKo) {
    const charListKo =
      cut.characters && cut.characters.length > 0
        ? cut.characters
            .map(
              (c) =>
                `[${c.code}] ${c.nameKo}(${c.nameEn}) (캐릭터시트: ${c.sheetUrl}, 컷아웃: ${c.cutoutUrl}${
                  c.signatureItemKo ? `, 특징: ${c.signatureItemKo}` : ''
                })`
            )
            .join(' / ')
        : '(등장 캐릭터시트 없음 — 배경 단독 시네마틱 컷)';

    const propListKo =
      cut.props && cut.props.length > 0
        ? cut.props
            .map((p) => `[${p.code}] ${p.nameKo} (소품시트: ${p.sheetUrl}, 소지자 연출: ${p.holderKo})`)
            .join(' / ')
        : '(등장 소품시트 없음)';

    const dialogueDirectiveKo = hasDialogue
      ? [
          `- 대사 인물(대상인물) 및 6초 압축 발화 지침: 본 동영상(6초)에서 대사를 말하는 인물은 오직 대상인물 [${speakerKo}(${speakerEn})] 1명뿐이며, 그 외 화면에 등장하는 모든 인물은 입을 다물고 침묵해야 한다. 전체 대사 길이는 절대 6초를 초과해서는 안 되므로, 6초를 초과하는 원문 대사는 반드시 6초 이내 분량으로 압축하여 대상인물 [${speakerKo}]이(가) 정확한 입 모양(립싱크)과 감정 연기로 직접 말해야 한다.`,
          origKo && origKo !== line6sKo
            ? `- 원문 대사: ${speakerKo} : "${origKo}"`
            : null,
          `- 6초 압축 최종 대사 (대상인물 발화): ${speakerKo} : "${line6sKo}"`,
        ]
          .filter(Boolean)
          .join('\n')
      : [
          `- 대사 인물 지침: (대사없음) — 본 컷씬(6초)에는 대사를 말하는 대상인물이 없다. 화면에 등장하는 모든 인물은 입을 굳게 다물고 어떠한 대사도 발화하지 않으며(립싱크/입 움직임 금지), 6초 동안 호흡·시선·동작 및 현장 환경음만 연출한다.`,
        ].join('\n');

    return [
      `[6초 실사 컷씬 동영상 생성 프롬프트 | ${cut.cutCode} (${cut.timecode})]`,
      `1. 공통 필수 명령어 (6초 길이 & 대상인물 압축 대사 규칙):`,
      `- 동영상 길이: 본 컷씬 동영상의 총 길이는 정확히 6초(6 seconds)이다.`,
      dialogueDirectiveKo,
      `2. 참조 시트 및 시각 에셋 (외형·복장·배경·소품 100% 고정):`,
      `- 기준 Flow 실사 컷씬 이미지: ${flowImgUrl}`,
      `- 배경시트: [${cut.location?.code || 'LOC'}] ${cut.location?.nameKo || ''} (${cut.location?.sheetUrl || ''}) — ${cut.location?.descriptionKo || ''}`,
      `- 캐릭터시트: ${charListKo}`,
      `- 소품시트: ${propListKo}`,
      `3. 6초 장면 액션 및 카메라 연출:`,
      `- ${cut.novelTextKo}`,
      `- 스타일 및 금지사항: 70mm IMAX 실사 다크판타지 시네마 화질(24fps, 16:9), 자연스러운 6초 연속 카메라 모션. 영상 내 자막, 말풍선, 글자, 알파벳, 숫자, 워터마크 포함 절대 금지.`,
    ].join('\n');
  } else {
    const charListEn =
      cut.characters && cut.characters.length > 0
        ? cut.characters
            .map(
              (c) =>
                `[${c.code}] ${c.nameEn} (Character Sheet: ${c.sheetUrl}, Cutout: ${c.cutoutUrl}${
                  c.defaultWeaponEn ? `, Traits: ${c.defaultWeaponEn}` : ''
                })`
            )
            .join(' ; ')
        : '(No Character Sheets — Pure Environment Shot)';

    const propListEn =
      cut.props && cut.props.length > 0
        ? cut.props
            .map((p) => `[${p.code}] ${p.nameEn} (Prop Sheet: ${p.sheetUrl}, Holder: ${p.holderEn})`)
            .join(' ; ')
        : '(No Prop Sheets)';

    const dialogueDirectiveEn = hasDialogue
      ? [
          `- Target Speaker & 6-Second Compressed Dialogue Rule: In this 6-second video, the ONLY character speaking is the target speaker [${speakerEn}]; all other characters on screen MUST keep their mouths closed and remain silent. Because the total dialogue MUST NOT exceed 6 seconds, any dialogue longer than 6 seconds is compressed into a concise <=6-second line spoken directly by the target speaker [${speakerEn}] with accurate live-action lip-sync and emotion.`,
          origEn && origEn !== line6sEn
            ? `- Original Full Dialogue: ${speakerEn} : "${origEn}"`
            : null,
          `- Compressed <=6s Dialogue (Spoken by Target Speaker): ${speakerEn} : "${line6sEn}"`,
        ]
          .filter(Boolean)
          .join('\n')
      : [
          `- Target Speaker Rule: (No Dialogue) — There is no speaking character in this 6-second cutscene. Every appearing character on screen MUST keep their mouth completely closed with zero lip movement, performing only 6-second cinematic live-action movement and ambient sound.`,
        ].join('\n');

    return [
      `[6-SECOND LIVE-ACTION CUTSCENE VIDEO PROMPT | ${cut.cutCode} (${cut.timecode})]`,
      `1. Common Mandatory Directives (6-Second Duration & Target Speaker Compression Rule):`,
      `- Video Duration: The total length of this cutscene video MUST be strictly 6 seconds.`,
      dialogueDirectiveEn,
      `2. Reference Sheets & Visual Assets (100% Visual Consistency):`,
      `- Base Flow Live-Action Cutscene Image: ${flowImgUrl}`,
      `- Background Sheet: [${cut.location?.code || 'LOC'}] ${cut.location?.nameEn || ''} (${cut.location?.sheetUrl || ''}) — ${cut.location?.descriptionEn || ''}`,
      `- Character Sheet: ${charListEn}`,
      `- Prop Sheet: ${propListEn}`,
      `3. 6-Second Scene Action & Camera Direction:`,
      `- ${cut.novelTextEn}`,
      `- Style & Strict No-Text Rule: 70mm IMAX photorealistic dark-fantasy live-action cinema (24fps, 16:9 widescreen), smooth 6-second continuous camera motion. Do NOT render any text, subtitles, captions, speech bubbles, letters, or watermarks in the video.`,
    ].join('\n');
  }
}

export const ScriptView: React.FC<ScriptViewProps> = ({
  language,
  onNavigate,
  playSfx,
  currentSeason = 'season1',
}) => {
  const { setLanguage } = useGameSettings();
  const isKo = language === 'ko';

  const [currentEpisodeNum, setCurrentEpisodeNum] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const epParam = params.get('ep') || params.get('episode');
        if (epParam) {
          const parsed = parseInt(epParam, 10);
          if (!isNaN(parsed)) return Math.max(1, Math.min(TOTAL_EPISODES, parsed));
        }
      }
    } catch {
      // ignore
    }
    const saved = getSeasonItem('hero_script_episode', currentSeason) || getSeasonItem('hero_novel_progress', currentSeason);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 || parsed > TOTAL_EPISODES ? 1 : parsed;
  });

  const [episodeData, setEpisodeData] = useState<EpisodeCutsceneData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'all' | 'dialogue' | 'nodialogue'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showEpisodeModal, setShowEpisodeModal] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Sync URL query param (?ep=) and save episode state
  useEffect(() => {
    setSeasonItem('hero_script_episode', String(currentEpisodeNum), currentSeason);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('ep') !== String(currentEpisodeNum)) {
          url.searchParams.set('ep', String(currentEpisodeNum));
          window.history.replaceState(window.history.state, '', url.pathname + url.search);
        }
      } catch {
        // ignore
      }
    }
  }, [currentEpisodeNum, currentSeason]);

  // Fetch episode_XX_cutscene_prompts.json
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    const epPad = pad2(currentEpisodeNum);

    const fetchScriptData = async () => {
      try {
        const res = await fetch(getAssetUrl(`/anime-character-sheets/cutscene-prompts/episode_${epPad}_cutscene_prompts.json`));
        if (res.ok) {
          const json: EpisodeCutsceneData = await res.json();
          if (isMounted) {
            setEpisodeData(json);
          }
        }
      } catch (err) {
        console.warn('Failed to load episode cutscene script JSON:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchScriptData();
    return () => {
      isMounted = false;
    };
  }, [currentEpisodeNum]);

  const handleCopy = async (text: string, key: string) => {
    triggerHaptic('tap');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      // fallback
    }
  };

  const cutscenes = episodeData?.cutscenes || [];
  const dialogueCutCount = cutscenes.filter((c) => c.dialogue?.hasDialogue).length;
  const noDialogueCutCount = cutscenes.length - dialogueCutCount;

  const filteredCutscenes = cutscenes.filter((cut) => {
    if (filterMode === 'dialogue' && !cut.dialogue?.hasDialogue) return false;
    if (filterMode === 'nodialogue' && cut.dialogue?.hasDialogue) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchCut = cut.cutCode.toLowerCase().includes(q) || String(cut.cutNumber) === q;
      const matchLoc =
        cut.location?.nameKo?.toLowerCase().includes(q) ||
        cut.location?.nameEn?.toLowerCase().includes(q) ||
        cut.location?.code?.toLowerCase().includes(q);
      const matchChar = cut.characters?.some(
        (c) =>
          c.nameKo.toLowerCase().includes(q) ||
          c.nameEn.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      );
      const matchProp = cut.props?.some(
        (p) =>
          p.nameKo.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)
      );
      const matchSpeaker =
        cut.dialogue?.speakerKo?.toLowerCase().includes(q) ||
        cut.dialogue?.speakerEn?.toLowerCase().includes(q) ||
        cut.dialogue?.summarized6sLineKo?.toLowerCase().includes(q) ||
        cut.dialogue?.summarized6sLineEn?.toLowerCase().includes(q);
      const matchNovel =
        cut.novelTextKo?.toLowerCase().includes(q) || cut.novelTextEn?.toLowerCase().includes(q);
      return matchCut || matchLoc || matchChar || matchProp || matchSpeaker || matchNovel;
    }
    return true;
  });

  const handleCopyAllPrompts = () => {
    const allPrompts = filteredCutscenes
      .map((cut) => buildCutsceneVideoPrompt(currentEpisodeNum, cut, isKo))
      .join('\n\n========================================\n\n');
    handleCopy(allPrompts, 'all_prompts');
  };

  const goToPrevEpisode = () => {
    if (currentEpisodeNum > 1) {
      triggerHaptic('tap');
      setCurrentEpisodeNum((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextEpisode = () => {
    if (currentEpisodeNum < TOTAL_EPISODES) {
      triggerHaptic('tap');
      setCurrentEpisodeNum((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const epPad = pad2(currentEpisodeNum);

  return (
    <div className="min-h-screen w-full bg-[#fdfcfc] text-[#201d1d] font-mono pb-24">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#fdfcfc]/95 backdrop-blur-xs border-b border-[#201d1d]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onNavigate('webtoon');
              }}
              className="min-h-[44px] px-3 py-1.5 border border-[#201d1d] bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] rounded-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title={isKo ? '웹툰 화면으로 돌아가기' : 'Back to Webtoon'}
            >
              <ArrowLeft size={15} />
              <span>{isKo ? '웹툰' : 'Webtoon'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onNavigate('home');
              }}
              className="min-h-[44px] px-2.5 py-1.5 border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] rounded-sm text-xs font-bold cursor-pointer transition-colors"
            >
              HOME
            </button>

            <div className="pl-1">
              <div className="flex items-center gap-1.5">
                <span className="bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                  /script
                </span>
                <h1 className="text-xs sm:text-sm font-bold text-[#201d1d] truncate">
                  {isKo
                    ? `Flow 실사 컷씬 대본 & 6초 동영상 프롬프트`
                    : `Flow Live-Action Cutscene Script & 6s Video Prompts`}
                </h1>
              </div>
            </div>
          </div>

          {/* Right: Language Switcher & Episode Selector */}
          <div className="flex items-center gap-2">
            {/* KO / EN Language Switcher */}
            <div className="flex items-center border border-[#201d1d] rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap');
                  setLanguage('ko');
                }}
                className={cn(
                  'min-h-[44px] px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1',
                  isKo ? 'bg-[#201d1d] text-[#fdfcfc]' : 'bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f1eeee]'
                )}
              >
                <span>🇰🇷 한글</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap');
                  setLanguage('en');
                }}
                className={cn(
                  'min-h-[44px] px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 border-l border-[#201d1d]',
                  !isKo ? 'bg-[#201d1d] text-[#fdfcfc]' : 'bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f1eeee]'
                )}
              >
                <span>🇺🇸 ENG</span>
              </button>
            </div>

            {/* Episode Selector Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                setShowEpisodeModal(true);
              }}
              className="min-h-[44px] px-3 py-1.5 border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] hover:bg-[#201d1d]/90 rounded-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <BookOpen size={14} />
              <span>
                EP {epPad} / {TOTAL_EPISODES}
              </span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-5 space-y-6">
        {/* Episode Title & Summary Banner */}
        <section className="border border-[#201d1d] bg-[#f8f7f7] p-4 sm:p-5 rounded-none space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(15,0,0,0.12)] pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#201d1d] text-[#fdfcfc] px-2 py-0.5 text-xs font-bold rounded-sm">
                  EPISODE {epPad}
                </span>
                <span className="text-xs font-bold text-[#646262]">
                  [ {cutscenes.length} CUTS · {cutscenes.length * 6}s ({isKo ? '컷당 6초' : '6s / Cut'}) ]
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#201d1d]">
                {isKo
                  ? `제 ${currentEpisodeNum}화: ${episodeData?.episodeTitleKo || ''}`
                  : `Episode ${currentEpisodeNum}: ${episodeData?.episodeTitleEn || ''}`}
              </h2>
              <p className="text-xs text-[#646262]">
                {isKo ? episodeData?.episodeTitleEn : episodeData?.episodeTitleKo}
              </p>
            </div>

            {/* Copy All Episode Prompts Button */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyAllPrompts}
                className="min-h-[44px] px-3.5 py-2 border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] hover:bg-[#201d1d]/90 rounded-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedKey === 'all_prompts' ? <Check size={14} /> : <Copy size={14} />}
                <span>
                  {copiedKey === 'all_prompts'
                    ? isKo
                      ? '전체 프롬프트 복사됨!'
                      : 'Copied All Prompts!'
                    : isKo
                    ? `전체 컷씬 6초 프롬프트 복사 (${filteredCutscenes.length}컷)`
                    : `Copy All 6s Prompts (${filteredCutscenes.length} Cuts)`}
                </span>
              </button>
            </div>
          </div>

          {/* Episode Synopsis */}
          {episodeData && (
            <p className="text-xs text-[#201d1d] leading-relaxed">
              <span className="font-bold mr-1.5">[{isKo ? '회차 줄거리 요약' : 'EPISODE SUMMARY'}]:</span>
              {isKo ? episodeData.episodeSummaryKo : episodeData.episodeSummaryEn}
            </p>
          )}

          {/* Common 6-Second Video Prompt Rule Notice Box */}
          <div className="bg-[#fdfcfc] border border-[#201d1d] p-3 rounded-none text-xs space-y-1">
            <div className="font-bold text-[#201d1d] flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>
                {isKo
                  ? '[6초 동영상 프롬프트 공통 명령어 규칙]'
                  : '[Common 6-Second Video Generation Prompt Rules]'}
              </span>
            </div>
            <p className="text-[#646262] leading-relaxed">
              {isKo
                ? '1) 모든 컷씬 동영상의 길이는 정확히 6초(6 seconds)입니다. 2) 대사가 있는 컷씬은 지정된 [대상인물]만 대사를 말하며, 전체 대사가 6초를 초과하면 안 되므로 6초 이상의 대사는 6초 이내로 압축하여 대상인물이 말함을 명시합니다. 3) 대사가 없는 컷씬은 (대사없음)으로 표시되며 등장인물 전원 침묵을 유지합니다.'
                : '1) Every cutscene video has a strict duration of 6 seconds. 2) For cutscenes with dialogue, ONLY the designated [Target Speaker] speaks; any dialogue exceeding 6 seconds is compressed to fit within 6 seconds and spoken by the target speaker. 3) Cutscenes without dialogue are marked as (No Dialogue) with all characters silent.'}
            </p>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-y border-[rgba(15,0,0,0.12)] py-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={cn(
                'min-h-[44px] px-3 py-1.5 border rounded-sm text-xs font-bold cursor-pointer transition-colors',
                filterMode === 'all'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#fdfcfc] text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7]'
              )}
            >
              {isKo ? `전체 컷씬 (${cutscenes.length})` : `All Cuts (${cutscenes.length})`}
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('dialogue')}
              className={cn(
                'min-h-[44px] px-3 py-1.5 border rounded-sm text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5',
                filterMode === 'dialogue'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#fdfcfc] text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7]'
              )}
            >
              <MessageSquare size={13} />
              <span>{isKo ? `대사 있는 컷 (${dialogueCutCount})` : `With Dialogue (${dialogueCutCount})`}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('nodialogue')}
              className={cn(
                'min-h-[44px] px-3 py-1.5 border rounded-sm text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5',
                filterMode === 'nodialogue'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#fdfcfc] text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7]'
              )}
            >
              <VolumeX size={13} />
              <span>{isKo ? `대사 없음 (${noDialogueCutCount})` : `No Dialogue (${noDialogueCutCount})`}</span>
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#646262]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isKo
                  ? '컷 번호, 대사인물, 대사, 배경, 소품 검색...'
                  : 'Search cut, speaker, dialogue, location, prop...'
              }
              className="w-full min-h-[44px] pl-9 pr-8 py-2 text-xs bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-sm focus:outline-hidden focus:border-[#201d1d]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#646262] hover:text-[#201d1d] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </section>

        {/* Quick Cut Jump Bar */}
        {cutscenes.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-[11px] font-bold text-[#646262] shrink-0 mr-1">
              [{isKo ? '컷 바로가기' : 'JUMP TO CUT'}]:
            </span>
            {cutscenes.map((c) => {
              const hasDlg = Boolean(c.dialogue?.hasDialogue);
              return (
                <a
                  key={c.cutCode}
                  href={`#script-cut-${c.cutNumber}`}
                  className={cn(
                    'min-h-[38px] px-2.5 py-1 border rounded-sm text-xs font-bold shrink-0 flex items-center gap-1 transition-colors',
                    hasDlg
                      ? 'bg-[#fdfcfc] text-[#201d1d] border-[#201d1d] hover:bg-[#201d1d] hover:text-[#fdfcfc]'
                      : 'bg-[#f8f7f7] text-[#646262] border-[rgba(15,0,0,0.12)] hover:text-[#201d1d]'
                  )}
                  title={
                    hasDlg
                      ? `${isKo ? c.dialogue.speakerKo : c.dialogue.speakerEn}: ${
                          isKo ? c.dialogue.summarized6sLineKo : c.dialogue.summarized6sLineEn
                        }`
                      : isKo
                      ? '(대사없음)'
                      : '(No Dialogue)'
                  }
                >
                  <span>#{pad2(c.cutNumber)}</span>
                  {hasDlg && <MessageSquare size={10} />}
                </a>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 text-center border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] text-xs font-bold text-[#646262]">
            {isKo
              ? `제 ${currentEpisodeNum}화 Flow 실사 컷씬 및 대본 시트를 불러오는 중...`
              : `Loading Episode ${currentEpisodeNum} Flow Live-Action Cutscenes & Script Sheets...`}
          </div>
        ) : filteredCutscenes.length === 0 ? (
          <div className="py-16 text-center border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] text-xs font-bold text-[#646262]">
            {isKo ? '조건에 일치하는 컷씬이 없습니다.' : 'No cutscenes match your filter.'}
          </div>
        ) : (
          /* Cutscenes List */
          <div className="space-y-8">
            {filteredCutscenes.map((cut) => {
              const cutPad = pad2(cut.cutNumber);
              const flowImageUrl = getAssetUrl(
                `/anime-character-sheets/cutscenes_liveaction/ep${epPad}_landscape/images/EP${epPad}_CUT${cutPad}_cutscene.jpg`
              );
              const hasDialogue = Boolean(cut.dialogue?.hasDialogue);
              const speakerName = isKo ? cut.dialogue?.speakerKo : cut.dialogue?.speakerEn;
              const dialogueLine6s = isKo
                ? cut.dialogue?.summarized6sLineKo
                : cut.dialogue?.summarized6sLineEn;
              const origDialogueKo = extractKoreanQuotedDialogue(cut.novelTextKo);
              const origDialogueEn = (cut.dialogue?.originalLineEn || '').trim();
              const origDialogue = isKo ? origDialogueKo : origDialogueEn;
              const isCompressed =
                hasDialogue &&
                Boolean(origDialogue) &&
                origDialogue.replace(/\s+/g, ' ').trim() !==
                  (dialogueLine6s || '').replace(/\s+/g, ' ').trim();

              const videoPromptText = buildCutsceneVideoPrompt(currentEpisodeNum, cut, isKo);
              const promptCopyKey = `prompt_${cut.cutCode}`;
              const dlgCopyKey = `dlg_${cut.cutCode}`;

              return (
                <article
                  key={cut.cutCode}
                  id={`script-cut-${cut.cutNumber}`}
                  className="border border-[#201d1d] bg-[#fdfcfc] rounded-none overflow-hidden scroll-mt-20"
                >
                  {/* Cutscene Top Bar */}
                  <div className="bg-[#201d1d] text-[#fdfcfc] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-[#fdfcfc] text-[#201d1d] px-2 py-0.5 text-xs font-bold rounded-sm">
                        CUT #{cutPad} / {pad2(cutscenes.length)}
                      </span>
                      <span className="text-xs font-bold">{cut.cutCode}</span>
                      <span className="text-xs text-[#fdfcfc]/70">
                        [{cut.timecode} · {cut.durationSeconds || 6}s]
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasDialogue ? (
                        <span className="bg-emerald-400 text-[#201d1d] px-2.5 py-0.5 text-xs font-bold rounded-sm flex items-center gap-1">
                          <MessageSquare size={12} />
                          <span>
                            {isKo ? `대사인물: ${speakerName}` : `Speaker: ${speakerName}`}
                          </span>
                        </span>
                      ) : (
                        <span className="bg-[#fdfcfc]/15 text-[#fdfcfc] border border-[#fdfcfc]/30 px-2.5 py-0.5 text-xs font-bold rounded-sm">
                          {isKo ? '(대사없음)' : '(No Dialogue)'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1. Flow Live-Action Cutscene Image + Novel Context */}
                  <div className="p-4 sm:p-5 border-b border-[rgba(15,0,0,0.12)] space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#201d1d] flex items-center gap-1.5">
                          <Film size={14} />
                          <span>
                            {isKo
                              ? `[1] Flow 실사 컷씬 이미지 (EP${epPad}_CUT${cutPad}_cutscene.jpg)`
                              : `[1] Flow Live-Action Cutscene Image (EP${epPad}_CUT${cutPad}_cutscene.jpg)`}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxImage({
                              url: flowImageUrl,
                              title: `${cut.cutCode} (${cut.timecode})`,
                              subtitle: isKo ? cut.novelTextKo : cut.novelTextEn,
                            })
                          }
                          className="min-h-[38px] px-2.5 py-1 border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] hover:bg-[#f1eeee] text-xs font-bold rounded-sm flex items-center gap-1 cursor-pointer"
                        >
                          <Maximize2 size={12} />
                          <span>{isKo ? '크게 보기' : 'Zoom'}</span>
                        </button>
                      </div>

                      <div
                        onClick={() =>
                          setLightboxImage({
                            url: flowImageUrl,
                            title: `${cut.cutCode} (${cut.timecode})`,
                            subtitle: isKo ? cut.novelTextKo : cut.novelTextEn,
                          })
                        }
                        className="relative w-full bg-[#201d1d] border border-[#201d1d] overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={flowImageUrl}
                          alt={`${cut.cutCode} Flow Live-Action Cutscene`}
                          loading="lazy"
                          decoding="async"
                          className="w-full max-h-[540px] object-contain mx-auto block"
                        />
                      </div>
                    </div>

                    {/* Scene Original Novel Paragraph */}
                    <div className="bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-3 rounded-none text-xs leading-relaxed">
                      <span className="font-bold text-[#646262] block mb-1">
                        [{isKo ? '컷씬 원문 지문 (소설 본문)' : 'Cutscene Novel Action Text'}]:
                      </span>
                      <p className="text-[#201d1d]">{isKo ? cut.novelTextKo : cut.novelTextEn}</p>
                    </div>
                  </div>

                  {/* 2. Reference Sheets: Background Sheet / Character Sheet / Prop Sheet */}
                  <div className="p-4 sm:p-5 border-b border-[rgba(15,0,0,0.12)] bg-[#f8f7f7]/60 space-y-4">
                    <h3 className="text-xs font-bold text-[#201d1d] uppercase flex items-center gap-1.5">
                      <Layers size={14} />
                      <span>
                        {isKo
                          ? '[2] 현재 화면 참조 시트 (배경시트 / 캐릭터시트 / 소품시트)'
                          : '[2] Current Cut Reference Sheets (Background / Character / Prop Sheets)'}
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* 2-A. Background Sheet */}
                      <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-3 rounded-none flex flex-col justify-between space-y-2.5">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-1.5">
                            <span className="text-xs font-bold text-[#201d1d] flex items-center gap-1">
                              <MapPin size={13} />
                              <span>{isKo ? '현재 화면의 배경시트' : 'Background Sheet'}</span>
                            </span>
                            <span className="text-[10px] font-bold bg-[#201d1d] text-[#fdfcfc] px-1.5 py-0.5 rounded-sm">
                              {cut.location?.code || 'LOC'}
                            </span>
                          </div>

                          {cut.location ? (
                            <>
                              <div
                                onClick={() =>
                                  setLightboxImage({
                                    url: getAssetUrl(cut.location.sheetUrl || cut.location.artUrl),
                                    title: `[${cut.location.code}] ${
                                      isKo ? cut.location.nameKo : cut.location.nameEn
                                    }`,
                                    subtitle: isKo
                                      ? cut.location.descriptionKo
                                      : cut.location.descriptionEn,
                                  })
                                }
                                className="cursor-pointer border border-[rgba(15,0,0,0.12)] bg-[#201d1d] overflow-hidden"
                              >
                                <img
                                  src={getAssetUrl(cut.location.sheetUrl || cut.location.artUrl)}
                                  alt={isKo ? cut.location.nameKo : cut.location.nameEn}
                                  loading="lazy"
                                  className="w-full h-40 object-contain mx-auto block"
                                />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#201d1d]">
                                  {isKo
                                    ? `${cut.location.nameKo} (${cut.location.nameEn})`
                                    : `${cut.location.nameEn} (${cut.location.nameKo})`}
                                </p>
                                <p className="text-[11px] text-[#646262] mt-0.5 leading-relaxed">
                                  {isKo ? cut.location.descriptionKo : cut.location.descriptionEn}
                                </p>
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-[#646262] py-6 text-center">
                              {isKo ? '(배경시트 정보 없음)' : '(No Background Sheet)'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 2-B. Character Sheets */}
                      <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-3 rounded-none flex flex-col justify-between space-y-2.5">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-1.5">
                            <span className="text-xs font-bold text-[#201d1d] flex items-center gap-1">
                              <User size={13} />
                              <span>{isKo ? '현재 화면의 캐릭터시트' : 'Character Sheet(s)'}</span>
                            </span>
                            <span className="text-[10px] font-bold bg-[#f1eeee] text-[#201d1d] px-1.5 py-0.5 rounded-sm border border-[rgba(15,0,0,0.12)]">
                              {cut.characters?.length || 0} {isKo ? '명' : 'Chars'}
                            </span>
                          </div>

                          {cut.characters && cut.characters.length > 0 ? (
                            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                              {cut.characters.map((ch) => {
                                const isTargetSpeaker =
                                  hasDialogue &&
                                  (ch.nameKo === cut.dialogue.speakerKo ||
                                    ch.nameEn.toLowerCase() === cut.dialogue.speakerEn.toLowerCase());
                                return (
                                  <div
                                    key={ch.code}
                                    className={cn(
                                      'p-2 border rounded-none space-y-2',
                                      isTargetSpeaker
                                        ? 'border-[#201d1d] bg-emerald-50/50'
                                        : 'border-[rgba(15,0,0,0.12)] bg-[#f8f7f7]'
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-1 flex-wrap">
                                      <span className="text-xs font-bold text-[#201d1d]">
                                        [{ch.code}] {isKo ? `${ch.nameKo} (${ch.nameEn})` : `${ch.nameEn} (${ch.nameKo})`}
                                      </span>
                                      {isTargetSpeaker && (
                                        <span className="text-[10px] font-bold bg-[#201d1d] text-[#fdfcfc] px-1.5 py-0.5 rounded-sm">
                                          {isKo ? '🎤 대상 대사인물' : '🎤 Target Speaker'}
                                        </span>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                      <div
                                        onClick={() =>
                                          setLightboxImage({
                                            url: getAssetUrl(ch.sheetUrl),
                                            title: `[${ch.code}] ${isKo ? ch.nameKo : ch.nameEn} — Character Sheet`,
                                            subtitle: isKo
                                              ? `${ch.hairDesignKo || ''} / ${ch.signatureItemKo || ''}`
                                              : ch.defaultWeaponEn || '',
                                          })
                                        }
                                        className="col-span-2 cursor-pointer border border-[rgba(15,0,0,0.12)] bg-[#201d1d] overflow-hidden"
                                        title={isKo ? '캐릭터시트 확대 보기' : 'Zoom Character Sheet'}
                                      >
                                        <img
                                          src={getAssetUrl(ch.sheetUrl)}
                                          alt={`${ch.nameEn} Sheet`}
                                          loading="lazy"
                                          className="w-full h-24 object-contain mx-auto block"
                                        />
                                      </div>
                                      <div
                                        onClick={() =>
                                          setLightboxImage({
                                            url: getAssetUrl(ch.cutoutUrl),
                                            title: `[${ch.code}] ${isKo ? ch.nameKo : ch.nameEn} — 7-Head Cutout`,
                                            subtitle: isKo
                                              ? `${ch.hairDesignKo || ''} / ${ch.signatureItemKo || ''}`
                                              : ch.defaultWeaponEn || '',
                                          })
                                        }
                                        className="col-span-1 cursor-pointer border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] overflow-hidden"
                                        title={isKo ? '7등신 컷아웃 확대 보기' : 'Zoom 7-Head Cutout'}
                                      >
                                        <img
                                          src={getAssetUrl(ch.cutoutUrl)}
                                          alt={`${ch.nameEn} Cutout`}
                                          loading="lazy"
                                          className="w-full h-24 object-contain mx-auto block"
                                        />
                                      </div>
                                    </div>

                                    <p className="text-[11px] text-[#646262] leading-snug">
                                      {isKo
                                        ? [ch.hairDesignKo, ch.signatureItemKo].filter(Boolean).join(' · ')
                                        : ch.defaultWeaponEn || ''}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-10 text-center text-xs text-[#646262] border border-dashed border-[rgba(15,0,0,0.12)]">
                              {isKo
                                ? '(등장 캐릭터시트 없음 — 배경 중심 컷)'
                                : '(No Character Sheet in this cut — Environment Shot)'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2-C. Prop Sheets */}
                      <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-3 rounded-none flex flex-col justify-between space-y-2.5">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-1.5">
                            <span className="text-xs font-bold text-[#201d1d] flex items-center gap-1">
                              <Package size={13} />
                              <span>{isKo ? '현재 화면의 소품시트' : 'Prop Sheet(s)'}</span>
                            </span>
                            <span className="text-[10px] font-bold bg-[#f1eeee] text-[#201d1d] px-1.5 py-0.5 rounded-sm border border-[rgba(15,0,0,0.12)]">
                              {cut.props?.length || 0} {isKo ? '개' : 'Props'}
                            </span>
                          </div>

                          {cut.props && cut.props.length > 0 ? (
                            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                              {cut.props.map((pr) => (
                                <div
                                  key={pr.code}
                                  className="p-2 border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] rounded-none space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-bold text-[#201d1d]">
                                      [{pr.code}] {isKo ? pr.nameKo : pr.nameEn}
                                    </span>
                                  </div>
                                  <div
                                    onClick={() =>
                                      setLightboxImage({
                                        url: getAssetUrl(pr.sheetUrl || pr.artUrl),
                                        title: `[${pr.code}] ${isKo ? pr.nameKo : pr.nameEn}`,
                                        subtitle: isKo ? pr.holderKo : pr.holderEn,
                                      })
                                    }
                                    className="cursor-pointer border border-[rgba(15,0,0,0.12)] bg-[#201d1d] overflow-hidden"
                                  >
                                    <img
                                      src={getAssetUrl(pr.sheetUrl || pr.artUrl)}
                                      alt={isKo ? pr.nameKo : pr.nameEn}
                                      loading="lazy"
                                      className="w-full h-28 object-contain mx-auto block"
                                    />
                                  </div>
                                  <p className="text-[11px] text-[#646262] leading-snug">
                                    {isKo ? pr.holderKo : pr.holderEn}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-10 text-center text-xs text-[#646262] border border-dashed border-[rgba(15,0,0,0.12)]">
                              {isKo ? '(현재 컷씬 등장 소품시트 없음)' : '(No Prop Sheet in this cut)'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Cutscene Dialogue Section: "대사인물 : 대사" or "(대사없음)" */}
                  <div className="p-4 sm:p-5 border-b border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-[#201d1d] flex items-center gap-1.5">
                        <MessageSquare size={14} />
                        <span>
                          {isKo
                            ? '[3] 현재 컷씬 대사 (대사인물 : 대사 / 6초 이내)'
                            : '[3] Current Cutscene Dialogue (Speaker : Line / <= 6s)'}
                        </span>
                      </span>

                      {hasDialogue && (
                        <button
                          type="button"
                          onClick={() => handleCopy(`${speakerName} : ${dialogueLine6s}`, dlgCopyKey)}
                          className="min-h-[38px] px-2.5 py-1 border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] hover:bg-[#f1eeee] text-xs font-bold rounded-sm flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === dlgCopyKey ? <Check size={12} /> : <Copy size={12} />}
                          <span>
                            {copiedKey === dlgCopyKey
                              ? isKo
                                ? '대사 복사됨'
                                : 'Copied'
                              : isKo
                              ? '대사 복사'
                              : 'Copy Line'}
                          </span>
                        </button>
                      )}
                    </div>

                    {hasDialogue ? (
                      <div className="p-3.5 border-2 border-[#201d1d] bg-[#f8f7f7] rounded-none space-y-2">
                        <p className="text-sm sm:text-base font-bold text-[#201d1d] leading-relaxed">
                          {speakerName} : {dialogueLine6s}
                        </p>
                        {isCompressed && (
                          <div className="pt-2 border-t border-[rgba(15,0,0,0.12)] text-xs text-[#646262] space-y-1">
                            <p>
                              <span className="font-bold text-[#201d1d]">
                                [{isKo ? '원문 전체 대사 (6초 초과분 압축 전)' : 'Original Full Dialogue (Before 6s Compression)'}]:
                              </span>{' '}
                              {speakerName} : &ldquo;{origDialogue}&rdquo;
                            </p>
                            <p className="text-[11px] font-bold text-emerald-800">
                              {isKo
                                ? `✓ 동영상 길이(6초)를 초과하지 않도록 위와 같이 6초 이내 대사로 압축하여 대상인물(${speakerName})이 발화합니다.`
                                : `✓ Compressed to fit strictly within the 6-second video duration and spoken by target speaker (${speakerName}).`}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] rounded-none">
                        <p className="text-sm font-bold text-[#646262]">
                          {isKo ? '(대사없음)' : '(No Dialogue)'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 4. 6-Second Video Generation Prompt Command */}
                  <div className="p-4 sm:p-5 bg-[#f8f7f7] space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-[#201d1d] flex items-center gap-1.5">
                        <Sparkles size={14} />
                        <span>
                          {isKo
                            ? `[4] 현재 컷씬 6초 동영상 생성 프롬프트 명령어 (${cut.cutCode})`
                            : `[4] 6-Second Cutscene Video Generation Prompt Command (${cut.cutCode})`}
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopy(videoPromptText, promptCopyKey)}
                        className="min-h-[44px] px-3.5 py-1.5 border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] hover:bg-[#201d1d]/90 text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {copiedKey === promptCopyKey ? <Check size={14} /> : <Copy size={14} />}
                        <span>
                          {copiedKey === promptCopyKey
                            ? isKo
                              ? '프롬프트 복사 완료!'
                              : 'Prompt Copied!'
                            : isKo
                            ? '6초 동영상 프롬프트 복사'
                            : 'Copy 6s Video Prompt'}
                        </span>
                      </button>
                    </div>

                    <pre className="p-3.5 bg-[#fdfcfc] border border-[#201d1d] rounded-none text-xs text-[#201d1d] whitespace-pre-wrap break-words leading-relaxed font-mono select-all">
                      {videoPromptText}
                    </pre>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Bottom Episode Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-[#201d1d]">
          <button
            type="button"
            onClick={goToPrevEpisode}
            disabled={currentEpisodeNum <= 1}
            className={cn(
              'min-h-[44px] px-4 py-2 border rounded-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors',
              currentEpisodeNum <= 1
                ? 'opacity-40 cursor-not-allowed bg-[#f1eeee] border-[rgba(15,0,0,0.12)]'
                : 'bg-[#fdfcfc] border-[#201d1d] hover:bg-[#f8f7f7]'
            )}
          >
            <ChevronLeft size={16} />
            <span>{isKo ? '이전 회차' : 'Prev Episode'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEpisodeModal(true)}
            className="min-h-[44px] px-4 py-2 border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] rounded-sm text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <BookOpen size={14} />
            <span>
              {currentEpisodeNum} / {TOTAL_EPISODES}
            </span>
          </button>

          <button
            type="button"
            onClick={goToNextEpisode}
            disabled={currentEpisodeNum >= TOTAL_EPISODES}
            className={cn(
              'min-h-[44px] px-4 py-2 border rounded-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors',
              currentEpisodeNum >= TOTAL_EPISODES
                ? 'opacity-40 cursor-not-allowed bg-[#f1eeee] border-[rgba(15,0,0,0.12)]'
                : 'bg-[#fdfcfc] border-[#201d1d] hover:bg-[#f8f7f7]'
            )}
          >
            <span>{isKo ? '다음 회차' : 'Next Episode'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </main>

      {/* Episode Selection Modal */}
      {showEpisodeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 font-mono"
          onClick={() => setShowEpisodeModal(false)}
        >
          <div
            className="bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d] rounded-none w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BookOpen size={16} />
                <span>{isKo ? '[ 회차 선택 (1화 ~ 40화) ]' : '[ Select Episode (EP 01 ~ 40) ]'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEpisodeModal(false)}
                className="min-h-[44px] min-w-[44px] border border-[rgba(15,0,0,0.12)] rounded-sm flex items-center justify-center hover:bg-[#f1eeee] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-4 sm:grid-cols-5 gap-2">
              {Array.from({ length: TOTAL_EPISODES }, (_, i) => i + 1).map((ep) => (
                <button
                  key={ep}
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap');
                    setCurrentEpisodeNum(ep);
                    setShowEpisodeModal(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={cn(
                    'min-h-[44px] p-2 border rounded-sm text-xs font-bold cursor-pointer transition-colors flex items-center justify-center',
                    ep === currentEpisodeNum
                      ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                      : 'bg-[#fdfcfc] text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7]'
                  )}
                >
                  EP {pad2(ep)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Cutscene / Sheet Inspection */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-3 sm:p-6 font-mono"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="w-full max-w-5xl flex items-center justify-between text-[#fdfcfc] border-b border-white/20 pb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs sm:text-sm font-bold truncate">{lightboxImage.title}</span>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="min-h-[44px] px-3 py-1.5 border border-white/30 bg-[#201d1d] text-[#fdfcfc] rounded-sm text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <X size={16} />
              <span>CLOSE</span>
            </button>
          </div>

          <div
            className="my-auto max-w-5xl w-full max-h-[80vh] flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-w-full max-h-[78vh] object-contain border border-white/20"
            />
          </div>

          {lightboxImage.subtitle && (
            <div
              className="w-full max-w-5xl bg-[#201d1d] border border-white/20 p-3 text-xs text-[#fdfcfc] text-center leading-relaxed"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxImage.subtitle}
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Navigation Dock */}
      <aside className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#201d1d] text-[#fdfcfc] p-1.5 border border-[#201d1d] rounded-none flex items-center gap-1.5 font-mono text-xs">
        <button
          type="button"
          onClick={goToPrevEpisode}
          disabled={currentEpisodeNum <= 1}
          className="min-h-[44px] px-3 py-1.5 border border-white/20 rounded-sm font-bold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft size={15} />
          <span>{isKo ? '이전화' : 'Prev'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowEpisodeModal(true)}
          className="min-h-[44px] px-3 py-1.5 border border-white/20 rounded-sm font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <span>
            EP {epPad} / {TOTAL_EPISODES}
          </span>
        </button>

        <button
          type="button"
          onClick={goToNextEpisode}
          disabled={currentEpisodeNum >= TOTAL_EPISODES}
          className="min-h-[44px] px-3 py-1.5 border border-white/20 rounded-sm font-bold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
        >
          <span>{isKo ? '다음화' : 'Next'}</span>
          <ChevronRight size={15} />
        </button>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="min-h-[44px] min-w-[44px] border border-white/20 rounded-sm font-bold flex flex-col items-center justify-center cursor-pointer"
          title="TOP"
        >
          <ArrowUp size={15} />
        </button>
      </aside>
    </div>
  );
};

export default ScriptView;
