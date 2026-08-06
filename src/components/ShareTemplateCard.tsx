import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import {
  Download,
  Share2,
  Check,
  Copy,
  X,
  Image as ImageIcon,
  LayoutGrid,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from './CardItem';
import { getCharacterIpProfile, getFactionDef } from '../content/characterIpUtils';
import { t } from '../lib/i18n';
import { cn, getFormattedCardName } from '../lib/utils';
import type { Language, CardData, DatabaseCard } from '../types';
import type { ShareTemplateType, ShareAspectRatio } from '../lib/shareTemplates';
import {
  buildCharacterShareCopy,
  buildWebtoonShareCopy,
  buildSeasonShareCopy,
  buildDeckShareCopy,
  buildBattleResultShareCopy,
  buildReferralShareCopy,
} from '../lib/shareTemplates';

export interface ShareTemplateCardProps {
  templateType: ShareTemplateType;
  language: Language;
  /** 카드 ID (character 타입일 때 필수) */
  cardId?: number;
  /** 카드 데이터 (character 타입일 때 표시용) */
  cardData?: DatabaseCard;
  /** 에피소드 제목 (webtoon 타입) */
  episodeTitle?: string;
  /** 에피소드 로그라인 (webtoon 타입) */
  episodeLogline?: string;
  /** 시즌 이름 (webtoon, season 타입) */
  seasonName?: string;
  /** 시즌 타이틀 (season 타입) */
  seasonTitle?: string;
  /** 시즌 서브타이틀 (season 타입) */
  seasonSubtitle?: string;
  /** 시즌 ID (season 타입) */
  seasonId?: string;
  /** 덱 데이터 (deck 타입) */
  deck?: CardData[];
  /** 총 전투력 (deck/battle-result 타입) */
  totalPower?: number;
  /** 전투 결과 (battle-result 타입) */
  battleResult?: 'win' | 'loss' | 'draw';
  /** 상대 전투력 (battle-result 타입) */
  opponentPower?: number;
  /** 리퍼럴 코드/링크 (referral 타입) */
  referralCode?: string;
  referralLink?: string;
  /** 저사양 모드 */
  lowSpecMode?: boolean;
  /** 닫기 */
  onClose?: () => void;
  /** 알림 표시 */
  showToast?: (message: string) => void;
}

const ASPECT_RATIOS: Record<ShareAspectRatio, { className: string; icon: React.ReactNode; labelKey: string }> = {
  '1:1': { className: 'aspect-square', icon: <LayoutGrid size={12} />, labelKey: 'share_aspect_square' },
  '9:16': { className: 'aspect-[9/16]', icon: <Smartphone size={12} />, labelKey: 'share_aspect_story' },
  '16:9': { className: 'aspect-video', icon: <Monitor size={12} />, labelKey: 'share_aspect_banner' },
};

const DEFAULT_ASPECT: ShareAspectRatio = '1:1';

/** 카드명을 안전하게 가져옴 */
const safeCardName = (card: DatabaseCard | undefined, language: Language): string => {
  if (!card) return '';
  return language === 'ko' ? (card.title || card.title_dis) : (card.title_en || card.title_dis);
};

/** SNSHero 브랜드 로고 텍스트 */
const BrandLogo: React.FC = () => (
  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent text-[10px] font-extrabold uppercase tracking-wider">
    SNSHero.com
  </span>
);

/** 템플릿 타입별 적합한 기본 비율 */
const defaultRatioForType = (type: ShareTemplateType): ShareAspectRatio => {
  switch (type) {
    case 'character': return '1:1';
    case 'webtoon': return '9:16';
    case 'season': return '16:9';
    case 'deck': return '1:1';
    case 'battle-result': return '16:9';
    case 'referral': return '9:16';
  }
};

export const ShareTemplateCard: React.FC<ShareTemplateCardProps> = ({
  templateType,
  language,
  cardId,
  cardData,
  episodeTitle,
  episodeLogline,
  seasonName,
  seasonTitle,
  seasonSubtitle,
  seasonId,
  deck,
  totalPower,
  battleResult,
  opponentPower,
  referralCode,
  referralLink,
  lowSpecMode = false,
  onClose,
  showToast,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState<ShareAspectRatio>(() => defaultRatioForType(templateType));
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);

  // Build share copy
  const shareCopy = useCallback(() => {
    switch (templateType) {
      case 'character': {
        const id = cardId ?? cardData?.id ?? 1;
        return buildCharacterShareCopy(id, language);
      }
      case 'webtoon':
        return buildWebtoonShareCopy(
          episodeTitle ?? '',
          episodeLogline ?? '',
          seasonName ?? '',
          language,
        );
      case 'season':
        return buildSeasonShareCopy(
          seasonTitle ?? '',
          seasonSubtitle ?? '',
          seasonId ?? '',
          language,
        );
      case 'deck':
        return buildDeckShareCopy(deck ?? [], language);
      case 'battle-result':
        return buildBattleResultShareCopy(
          battleResult ?? 'draw',
          totalPower ?? 0,
          opponentPower ?? 0,
          language,
        );
      case 'referral':
        return buildReferralShareCopy(
          referralCode ?? '',
          referralLink ?? '',
          t('referral_share_message', language),
          t('referral_share_reward', language),
        );
    }
  }, [templateType, cardId, cardData, episodeTitle, episodeLogline, seasonName, seasonTitle, seasonSubtitle, seasonId, deck, totalPower, battleResult, opponentPower, referralCode, referralLink, language]);

  // Wait for preview DOM to be ready
  useEffect(() => {
    const timer = setTimeout(() => setPreviewReady(true), 300);
    return () => clearTimeout(timer);
  }, [templateType, ratio]);

  // Handle PNG download
  const handleDownload = async () => {
    if (!previewRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await Promise.race([
        toPng(previewRef.current, {
          cacheBust: false,
          skipFonts: true,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        }),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Generate timeout')), 15000),
        ),
      ]);

      const fileName = `SNSHero_${templateType}_${Date.now()}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      showToast?.(t('share_download_success', language));
    } catch (err) {
      console.error('Share template download error:', err);
      showToast?.(t('share_download_fail', language));
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Web Share API
  const handleShareNative = async () => {
    const copy = shareCopy();
    const shareUrl = templateType === 'referral'
      ? (referralLink ?? '')
      : (typeof window !== 'undefined' ? window.location.href : '');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SNSHero',
          text: copy.caption,
          url: shareUrl,
        });
      } catch {
        // User cancelled or API failed
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${copy.caption}\n${shareUrl}`);
        setIsCopied(true);
        showToast?.(t('share_copy_success', language));
        setTimeout(() => setIsCopied(false), 2000);
      } catch {
        showToast?.(t('share_copy_fail', language));
      }
    }
  };

  // Handle copy text
  const handleCopyText = async () => {
    const copy = shareCopy();
    try {
      await navigator.clipboard.writeText(copy.caption);
      setIsCopied(true);
      showToast?.(t('share_copy_success', language));
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast?.(t('share_copy_fail', language));
    }
  };

  // Resolve card data for display
  const resolvedCardData = cardData ?? (cardId ? CARD_DATABASE[cardId] : undefined);
  const resolvedDeck = deck?.slice(0, 5);

  // Build the preview content based on template type
  const renderPreviewContent = () => {
    switch (templateType) {
      case 'character':
        return <CharacterTemplate card={resolvedCardData} language={language} shareCopy={shareCopy()} lowSpecMode={lowSpecMode} />;
      case 'webtoon':
        return <WebtoonTemplate title={episodeTitle ?? ''} logline={episodeLogline ?? ''} seasonName={seasonName ?? ''} shareCopy={shareCopy()} language={language} lowSpecMode={lowSpecMode} />;
      case 'season':
        return <SeasonTemplate title={seasonTitle ?? ''} subtitle={seasonSubtitle ?? ''} shareCopy={shareCopy()} language={language} lowSpecMode={lowSpecMode} />;
      case 'deck':
        return <DeckTemplate deck={resolvedDeck ?? []} totalPower={totalPower} shareCopy={shareCopy()} language={language} lowSpecMode={lowSpecMode} />;
      case 'battle-result':
        return <BattleResultTemplate result={battleResult ?? 'draw'} totalPower={totalPower ?? 0} opponentPower={opponentPower ?? 0} shareCopy={shareCopy()} language={language} lowSpecMode={lowSpecMode} />;
      case 'referral':
        return <ReferralTemplate referralCode={referralCode ?? ''} referralLink={referralLink ?? ''} shareCopy={shareCopy()} language={language} lowSpecMode={lowSpecMode} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: lowSpecMode ? 0 : 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            {t(`share_template_${templateType.replace('-', '_')}`, language)}
          </h3>
          <button
            onClick={onClose}
            aria-label={t('close', language)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Aspect ratio selector */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-slate-50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">
            {t('share_template_ratio', language)}:
          </span>
          {(Object.entries(ASPECT_RATIOS) as [ShareAspectRatio, typeof ASPECT_RATIOS['1:1']][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setRatio(key)}
              aria-pressed={ratio === key}
              aria-label={`${t('share_template_ratio', language)}: ${t(val.labelKey, language)}`}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                ratio === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100',
              )}
            >
              {val.icon}
              {key}
            </button>
          ))}
        </div>

        {/* Preview area */}
        <div className="p-5 flex items-center justify-center bg-slate-50/50">
          <div
            ref={previewRef}
            className={cn(
              'w-full max-w-[320px] bg-white shadow-xl border border-slate-200 overflow-hidden',
              ASPECT_RATIOS[ratio].className,
            )}
            style={{ borderRadius: 12 }}
          >
            {previewReady ? renderPreviewContent() : (
              <div className="w-full h-full flex items-center justify-center">
                <div className={cn('rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent', lowSpecMode ? '' : 'animate-spin')} />
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            {isDownloading ? (
              <span className={cn('rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent', lowSpecMode ? '' : 'animate-spin')} />
            ) : (
              <Download size={14} />
            )}
            {isDownloading
              ? t('share_generating', language)
              : t('share_download_png', language)}
          </button>

          <button
            onClick={handleShareNative}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Share2 size={14} />
            {t('share', language)}
          </button>

          <button
            onClick={handleCopyText}
            aria-label={t('share_copy_text', language)}
            title={t('share_copy_text', language)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
              isCopied
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200',
            )}
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Template Sub-Components                                              */
/* ------------------------------------------------------------------ */

interface TemplateBaseProps {
  language: Language;
  shareCopy: { caption: string; hashtags: string[] };
  lowSpecMode?: boolean;
}

/** 캐릭터 소개 템플릿 (1:1 기본) */
const CharacterTemplate: React.FC<TemplateBaseProps & { card?: DatabaseCard }> = ({ card, language, shareCopy }) => {
  const profile = card ? getCharacterIpProfile(card.id) : undefined;
  const factionDef = profile ? getFactionDef(profile.faction) : undefined;
  const factionLabel = factionDef ? t(factionDef.nameKey, language) : '';

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50/30 relative overflow-hidden">
      {/* Card image area - top 60% */}
      <div className="flex-1 flex items-center justify-center p-3 relative">
        {card && (
          <div className="w-[60%] max-w-[140px]">
            <CardItem
              card={{
                id: `share_${card.id}`,
                title_dis: card.title_dis,
                stats: card.stats,
                rarity: card.rarity,
                power: card.power,
                level: 1,
                title: card.title,
                title_en: card.title_en,
                imageUrl: card.imageUrl,
                imageIndex: card.id,
              }}
              language={language}
              className="w-full"
              isLocked={false}
              lowSpecMode={true}
              ignoreBonuses={true}
            />
          </div>
        )}
      </div>

      {/* Info area - bottom 40% */}
      <div className="px-3 pb-3 flex-shrink-0">
        <BrandLogo />
        <h4 className="text-sm font-extrabold text-slate-800 mt-1 leading-tight line-clamp-1">
          {card ? safeCardName(card, language) : ''}
        </h4>
        {factionLabel && (
          <span className="inline-block text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1">
            {factionLabel}
          </span>
        )}
        <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2 leading-snug">
          {shareCopy.hashtags.slice(0, 4).join(' ')}
        </p>
      </div>
    </div>
  );
};

/** 웹툰 컷 템플릿 (9:16 기본) */
const WebtoonTemplate: React.FC<TemplateBaseProps & { title: string; logline: string; seasonName: string }> = ({
  title, logline, shareCopy, language, lowSpecMode,
}) => (
  <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-800 via-indigo-900 to-slate-900 relative overflow-hidden">
    {/* Dramatic top area with gradient */}
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
      <div className="relative z-10 text-center">
        <BrandLogo />
        <h4 className="text-white/90 text-sm font-extrabold mt-3 leading-tight line-clamp-2">
          {title}
        </h4>
        <p className="text-white/60 text-[10px] font-medium mt-1.5 line-clamp-2">
          {logline}
        </p>
        <div className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-[9px] font-bold uppercase tracking-wider">
          <span className={cn('w-1.5 h-1.5 rounded-full bg-rose-400', lowSpecMode ? '' : 'animate-pulse')} />
          {t('share_next_episode', language)}
        </div>
      </div>
    </div>

    {/* Bottom tag area */}
    <div className="px-3 pb-3 flex-shrink-0">
      <p className="text-[9px] text-white/50 leading-tight line-clamp-1">
        {shareCopy.hashtags.slice(0, 3).join('  ')}
      </p>
    </div>
  </div>
);

/** 시즌 미션 템플릿 (16:9 기본) */
const SeasonTemplate: React.FC<TemplateBaseProps & { title: string; subtitle: string }> = ({
  title, subtitle, shareCopy, language,
}) => (
  <div className="w-full h-full flex flex-col bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 relative overflow-hidden">
    {/* Decorative elements */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

    <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
      <BrandLogo />
      <div className="inline-block px-2.5 py-1 bg-white/20 rounded-full text-white text-[9px] font-bold uppercase tracking-widest mt-3 mb-2">
        {t('share_season_event_badge', language)}
      </div>
      <h4 className="text-white text-lg font-extrabold text-center leading-tight mt-1 drop-shadow-sm">
        {title}
      </h4>
      <p className="text-white/80 text-[10px] font-medium text-center mt-1.5 line-clamp-2">
        {subtitle}
      </p>
      <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-orange-600 text-[10px] font-extrabold uppercase tracking-wider shadow-lg">
        {t('share_join_now', language)}
      </div>
    </div>

    <div className="px-3 pb-2 flex-shrink-0">
      <p className="text-[8px] text-white/60 leading-tight line-clamp-1 text-center">
        {shareCopy.hashtags.slice(0, 3).join('  ')}
      </p>
    </div>
  </div>
);

/** 덱 자랑 템플릿 */
const DeckTemplate: React.FC<TemplateBaseProps & { deck: CardData[]; totalPower?: number }> = ({
  deck, totalPower, shareCopy, language,
}) => {
  const tp = totalPower ?? deck.reduce((s, c) => s + (CARD_DATABASE[c.imageIndex || 0]?.power || 0), 0);
  const displayDeck = deck.length > 0 ? deck : Array.from({ length: 5 }, (_, i) => ({
    id: `empty-${i}`,
    title_dis: '???',
    stats: [0, 0, 0, 0] as [number, number, number, number],
    rarity: 'common' as const,
    power: 0,
    level: 1,
  }));

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(255,255,255,.03)_50%,_transparent_75%)]" />

      <div className="flex-1 flex flex-col p-3 relative z-10">
        {/* Power badge */}
        <div className="flex items-center gap-2 mb-2">
          <BrandLogo />
          <span className="ml-auto text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            TP {tp.toLocaleString()}
          </span>
        </div>

        {/* Card grid */}
        <div className="flex-1 grid grid-cols-3 gap-1.5 items-center justify-items-center">
          {displayDeck.slice(0, 5).map((card, i) => {
            const dbCard = CARD_DATABASE[card.imageIndex || 0];
            return (
              <div key={card.id || i} className="flex flex-col items-center gap-0.5">
                {dbCard ? (
                  <CardItem
                    card={{
                      id: `share_deck_${dbCard.id}`,
                      title_dis: dbCard.title_dis,
                      stats: dbCard.stats,
                      rarity: dbCard.rarity,
                      power: dbCard.power,
                      level: 1,
                      title: dbCard.title,
                      title_en: dbCard.title_en,
                      imageUrl: dbCard.imageUrl,
                      imageIndex: dbCard.id,
                    }}
                    language={language}
                    className="w-full max-w-[64px]"
                    isLocked={false}
                    lowSpecMode={true}
                    ignoreBonuses={true}
                  />
                ) : (
                  <div className="w-full max-w-[64px] aspect-[5/7] rounded-lg bg-slate-700/50 border border-slate-600/30 flex items-center justify-center">
                    <ImageIcon size={14} className="text-slate-500" />
                  </div>
                )}
                <span className="text-[7px] text-white/40 truncate w-full text-center leading-tight">
                  {dbCard ? getFormattedCardName(dbCard, language) : '???'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Share text */}
        <p className="text-[9px] text-white/70 mt-2 line-clamp-2 leading-snug text-center">
          {shareCopy.caption.split('\n')[0]}
        </p>
      </div>
    </div>
  );
};

/** 전투 결과 템플릿 */
const BattleResultTemplate: React.FC<TemplateBaseProps & {
  result: 'win' | 'loss' | 'draw';
  totalPower: number;
  opponentPower: number;
}> = ({ result, totalPower, opponentPower, shareCopy, language }) => {
  const gradient = result === 'win'
    ? 'from-emerald-500 to-teal-600'
    : result === 'loss'
      ? 'from-red-500 to-rose-600'
      : 'from-amber-500 to-orange-500';

  const emoji = result === 'win' ? '🏆' : result === 'loss' ? '💔' : '🤝';
  const label = t(result === 'win' ? 'victory' : result === 'loss' ? 'defeat' : 'draw', language);

  return (
    <div className={cn('w-full h-full flex flex-col bg-gradient-to-br relative overflow-hidden', gradient)}>
      <div className="absolute inset-0 bg-black/10" />

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        <span className="text-4xl drop-shadow-lg">{emoji}</span>
        <h3 className="text-white text-lg font-extrabold mt-2 drop-shadow-md">{label}</h3>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-white/90 text-sm font-bold">{totalPower.toLocaleString()}</span>
          <span className="text-white/50 text-xs font-bold">VS</span>
          <span className="text-white/90 text-sm font-bold">{opponentPower.toLocaleString()}</span>
        </div>
        <BrandLogo />
        <p className="text-white/70 text-[9px] font-medium mt-2 text-center line-clamp-1">
          {t('share_battle_result_cta', language)}
        </p>
      </div>

      <div className="px-3 pb-2 flex-shrink-0">
        <p className="text-[8px] text-white/50 leading-tight line-clamp-1 text-center">
          {shareCopy.hashtags.join('  ')}
        </p>
      </div>
    </div>
  );
};

const ReferralTemplate: React.FC<TemplateBaseProps & {
  referralCode: string;
  referralLink: string;
}> = ({ referralCode, referralLink, shareCopy, language, lowSpecMode }) => (
  <div className="w-full h-full flex flex-col bg-gradient-to-b from-indigo-700 via-violet-700 to-fuchsia-700 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),_transparent_42%)]" />
    <div className="absolute -right-8 top-8 w-24 h-24 rounded-full bg-white/10 blur-xl" />
    <div className="absolute -left-10 bottom-10 w-28 h-28 rounded-full bg-fuchsia-300/15 blur-xl" />

    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 relative z-10">
      <BrandLogo />
      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/90 text-[10px] font-bold uppercase tracking-[0.25em]">
        <span className={cn('w-1.5 h-1.5 rounded-full bg-emerald-300', lowSpecMode ? '' : 'animate-pulse')} />
        {t('share_template_referral', language)}
      </div>
      <h4 className="mt-4 text-white text-2xl font-black tracking-tight leading-tight">
        {referralCode || 'SNSHERO'}
      </h4>
      <p className="mt-2 text-white/80 text-xs font-medium leading-relaxed max-w-[220px]">
        {shareCopy.caption.split('\n').slice(0, 2).join(' ')}
      </p>
      <div className="mt-4 w-full max-w-[240px] rounded-2xl bg-white/95 px-4 py-3 shadow-2xl shadow-black/15">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {t('referral_copy_link', language)}
        </p>
        <p className="mt-1 text-[10px] font-semibold text-slate-700 break-all line-clamp-3">
          {referralLink}
        </p>
      </div>
    </div>

    <div className="px-3 pb-3 flex-shrink-0 text-center">
      <p className="text-[8px] text-white/65 leading-tight line-clamp-2">
        {shareCopy.hashtags.join('  ')}
      </p>
    </div>
  </div>
);

export default ShareTemplateCard;
