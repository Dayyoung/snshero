import React, { useMemo, useState } from 'react';
import { EyeOff, Tag, Users, Star, AlertTriangle, CheckCircle2, Search, RotateCcw } from 'lucide-react';
import { getCharacterAssetManifestEntry } from '../content/characterAssetManifest';
import { getCharacterArtPrompt, validateCharacterArtPrompts } from '../content/characterArtPrompts';
import { getCharacterIpProfile, getFactionDef, getRarityRule } from '../content/characterIpUtils';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import type { Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CardSilhouettePreview } from './CardSilhouettePreview';

export type ThumbnailSize = 64 | 96 | 128;

interface CardLabelVisibility {
  rarity: boolean;
  faction: boolean;
  name: boolean;
}

interface CardThumbnailDebugGridProps {
  language?: Language;
  lowSpecMode?: boolean;
  className?: string;
}

/**
 * Admin debug grid for thumbnail silhouette review.
 * Shows all 110 cards at configurable sizes with toggleable labels.
 * Only accessible in testMode or admin mode.
 */
export const CardThumbnailDebugGrid: React.FC<CardThumbnailDebugGridProps> = ({
  language = 'ko',
  lowSpecMode = false,
  className,
}) => {
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSize>(64);
  const [labels, setLabels] = useState<CardLabelVisibility>({
    rarity: true,
    faction: true,
    name: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const cardIds = useMemo(() => {
    const allIds = Array.from({ length: 110 }, (_, i) => i + 1);
    if (!searchQuery.trim()) return allIds;
    const query = searchQuery.toLowerCase();
    return allIds.filter((id) => {
      const card = CARD_DATABASE[id];
      if (!card) return false;
      const name = (card.title_dis ?? '').toLowerCase();
      const nameEn = (card.title_en ?? '').toLowerCase();
      const nameKo = (card.title ?? '').toLowerCase();
      return name.includes(query) || nameEn.includes(query) || nameKo.includes(query);
    });
  }, [searchQuery]);

  const validation = useMemo(() => validateCharacterArtPrompts(), []);
  const missingFieldLabels = useMemo(() => ({
    visualKeywords: t('thumbnail_diagnostics_visual_keywords', language),
    signatureShape: t('thumbnail_diagnostics_signature_shape', language),
    thumbnailPrompt: t('thumbnail_diagnostics_thumbnail_prompt', language),
  }), [language]);

  const toggleLabel = (key: keyof CardLabelVisibility) => {
    setLabels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sizes: ThumbnailSize[] = [64, 96, 128];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-700">
        {/* Size selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{t('thumbnail_diagnostics_size', language)}</span>
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setThumbnailSize(s)}
              className={cn(
                'px-2.5 py-1 text-[10px] font-bold rounded-md border transition-all',
                thumbnailSize === s
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-500',
              )}
            >
              {s}px
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-slate-600" />

        {/* Label toggles */}
        <button
          onClick={() => toggleLabel('rarity')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border transition-all',
            labels.rarity
              ? 'bg-amber-600/20 text-amber-400 border-amber-600/40'
              : 'bg-slate-800 text-slate-500 border-slate-600',
          )}
        >
          {labels.rarity ? <Star size={10} /> : <EyeOff size={10} />}
          {t('thumbnail_diagnostics_label_rarity', language)}
        </button>

        <button
          onClick={() => toggleLabel('faction')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border transition-all',
            labels.faction
              ? 'bg-blue-600/20 text-blue-400 border-blue-600/40'
              : 'bg-slate-800 text-slate-500 border-slate-600',
          )}
        >
          {labels.faction ? <Users size={10} /> : <EyeOff size={10} />}
          {t('thumbnail_diagnostics_label_faction', language)}
        </button>

        <button
          onClick={() => toggleLabel('name')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border transition-all',
            labels.name
              ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/40'
              : 'bg-slate-800 text-slate-500 border-slate-600',
          )}
        >
          {labels.name ? <Tag size={10} /> : <EyeOff size={10} />}
          {t('thumbnail_diagnostics_label_name', language)}
        </button>

        <button
          onClick={() => setShowValidation((v) => !v)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border transition-all',
            showValidation
              ? 'bg-purple-600/20 text-purple-400 border-purple-600/40'
              : 'bg-slate-800 text-slate-500 border-slate-600',
          )}
        >
          <AlertTriangle size={10} />
          {t('thumbnail_diagnostics_validation', language)}
        </button>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('thumbnail_diagnostics_search_placeholder', language)}
            className="w-32 pl-6 pr-2 py-1 text-[10px] bg-slate-800 border border-slate-600 rounded-md text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <RotateCcw size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Validation Summary */}
      {showValidation && (
        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2">
          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <CheckCircle2 size={14} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={14} className="text-amber-400" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
              {t('thumbnail_diagnostics_validation_status', language)}: {validation.isValid
                ? t('thumbnail_diagnostics_validation_ok', language)
                : t('thumbnail_diagnostics_validation_issues', language)}
            </span>
          </div>
          {!validation.isValid && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {validation.missingCardIds.length > 0 && (
                <div className="p-2 rounded-lg bg-red-900/30 border border-red-800/40">
                  <span className="text-[8px] font-bold text-red-400 block">{t('thumbnail_diagnostics_missing', language)}</span>
                  <span className="text-[10px] font-bold text-red-300">{validation.missingCardIds.length} {t('thumbnail_diagnostics_cards_unit', language)}</span>
                </div>
              )}
              {validation.emptyPromptCardIds.length > 0 && (
                <div className="p-2 rounded-lg bg-amber-900/30 border border-amber-800/40">
                  <span className="text-[8px] font-bold text-amber-400 block">{t('thumbnail_diagnostics_empty_prompts', language)}</span>
                  <span className="text-[10px] font-bold text-amber-300">{validation.emptyPromptCardIds.length} {t('thumbnail_diagnostics_cards_unit', language)}</span>
                </div>
              )}
              {validation.missingFallbackCardIds.length > 0 && (
                <div className="p-2 rounded-lg bg-amber-900/30 border border-amber-800/40">
                  <span className="text-[8px] font-bold text-amber-400 block">{t('thumbnail_diagnostics_no_fallback', language)}</span>
                  <span className="text-[10px] font-bold text-amber-300">{validation.missingFallbackCardIds.length} {t('thumbnail_diagnostics_cards_unit', language)}</span>
                </div>
              )}
              {validation.manifestMismatchCardIds.length > 0 && (
                <div className="p-2 rounded-lg bg-purple-900/30 border border-purple-800/40">
                  <span className="text-[8px] font-bold text-purple-400 block">{t('thumbnail_diagnostics_manifest_mismatch', language)}</span>
                  <span className="text-[10px] font-bold text-purple-300">{validation.manifestMismatchCardIds.length} {t('thumbnail_diagnostics_cards_unit', language)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Card Grid */}
      <div
        className="grid gap-1 p-2 rounded-xl bg-slate-950 border border-slate-800 overflow-auto"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize + 40}px, 1fr))`,
          maxHeight: 600,
        }}
      >
        {cardIds.map((cardId) => {
          const ipProfile = getCharacterIpProfile(cardId);
          const assetEntry = getCharacterAssetManifestEntry(cardId);
          const artPrompt = getCharacterArtPrompt(cardId);
          const card = CARD_DATABASE[cardId];
          const factionDef = ipProfile ? getFactionDef(ipProfile.faction) : undefined;
          const rarityRule = ipProfile ? getRarityRule(ipProfile.rarityTier) : undefined;
          const cardName = language === 'ko' ? (card?.title ?? card?.title_dis ?? `#${cardId}`) : (card?.title_dis ?? card?.title_en ?? `#${cardId}`);

          // Check for missing art prompt data from doc 02
          const missingFields: Array<keyof typeof missingFieldLabels> = [];
          if (!artPrompt || artPrompt.visualKeywords.length === 0) {
            missingFields.push('visualKeywords');
          }
          if (!artPrompt || artPrompt.signatureShape.trim().length === 0) {
            missingFields.push('signatureShape');
          }
          if (!artPrompt || !artPrompt.thumbnailPrompt || artPrompt.thumbnailPrompt.trim().length === 0) {
            missingFields.push('thumbnailPrompt');
          }

          return (
            <div
              key={cardId}
              className={cn(
                'flex flex-col items-center gap-0.5 p-1 rounded-lg border transition-colors',
                missingFields.length > 0
                  ? 'border-red-800/40 bg-red-950/15'
                  : 'border-transparent hover:border-slate-700 bg-transparent',
              )}
              title={
                missingFields.length > 0
                  ? `${t('thumbnail_diagnostics_missing_fields', language)}: ${missingFields.map((field) => missingFieldLabels[field]).join(', ')}`
                  : cardName
              }
            >
              <CardSilhouettePreview
                cardId={cardId}
                cardName={cardName}
                imageUrl={assetEntry?.frontAssetPath ?? assetEntry?.fallbackAssetPath}
                size={thumbnailSize}
                lowSpecMode={lowSpecMode}
              />

              {/* Labels */}
              <div className="flex flex-col items-center gap-0.5 mt-0.5">
                {labels.rarity && rarityRule && (
                  <span
                    className="text-[7px] font-bold uppercase tracking-wider px-1 rounded"
                    style={{
                      color: rarityRule.frameMaterial === 'prismatic' ? '#c4b5fd'
                        : rarityRule.frameMaterial === 'gold' ? '#fbbf24'
                        : rarityRule.frameMaterial === 'silver' ? '#94a3b8'
                        : '#b45309',
                    }}
                  >
                    {ipProfile?.rarityTier ?? 'bronze'}
                  </span>
                )}
                {labels.faction && factionDef && (
                  <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    {ipProfile?.faction}
                  </span>
                )}
                {labels.name && (
                  <span className="text-[7px] font-medium truncate max-w-full text-slate-500 px-1 text-center leading-tight">
                    {cardName.length > 10 ? cardName.slice(0, 10) + '…' : cardName}
                  </span>
                )}
              </div>

              {/* Missing field indicator */}
              {missingFields.length > 0 && (
                <div className="mt-0.5">
                  <AlertTriangle size={8} className="text-red-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-1">
        <span>
          {t('thumbnail_diagnostics_showing', language, { count: cardIds.length, total: 110 })}
          {searchQuery ? ` (${t('thumbnail_diagnostics_filtered', language)})` : ''}
        </span>
        <span>
          {t('thumbnail_diagnostics_size', language)}: {thumbnailSize}px | {t('thumbnail_diagnostics_labels', language)}: {[
            labels.rarity && 'R',
            labels.faction && 'F',
            labels.name && 'N',
          ].filter(Boolean).join(', ') || t('thumbnail_diagnostics_none', language)}
        </span>
      </div>
    </div>
  );
};
