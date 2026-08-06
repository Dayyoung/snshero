import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Hash,
  Link2,
  Image,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  Sparkles,
  Gift,
  Calendar,
  ChevronRight,
  Users,
  Share2,
  ImageOff,
} from 'lucide-react';
import { Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { ShareTemplateCard } from './ShareTemplateCard';
import { getCurrentSeasonConfig } from '../content/seasons';
import {
  getActiveSnsChallenges,
  MOCK_CHALLENGE_GALLERY,
  type SnsChallenge,
  type SnsChallengeSubmission,
  type SnsChallengeSubmissionsState,
  type ChallengeGalleryEntry,
} from '../content/snsChallenges';

interface ChallengeEventSectionProps {
  language: Language;
  currentSeason?: string;
  playSfx: (url: string) => void;
  setView?: (view: string) => void;
}

interface ChallengeSubmissionDraft {
  snsLink: string;
  screenshotUrl: string;
}

function loadSubmissions(season: string): SnsChallengeSubmissionsState {
  try {
    const raw = localStorage.getItem(`hero_sns_challenge_submissions_${season}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSubmissions(season: string, state: SnsChallengeSubmissionsState): void {
  localStorage.setItem(`hero_sns_challenge_submissions_${season}`, JSON.stringify(state));
}

export const ChallengeEventSection: React.FC<ChallengeEventSectionProps> = ({
  language,
  currentSeason = 'season3',
  playSfx,
  setView,
}) => {
  const activeChallenges = getActiveSnsChallenges(currentSeason);
  const seasonConfig = getCurrentSeasonConfig(currentSeason);
  const [submissions, setSubmissions] = useState<SnsChallengeSubmissionsState>({});
  const [drafts, setDrafts] = useState<Record<string, ChallengeSubmissionDraft>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [galleryImageErrors, setGalleryImageErrors] = useState<Record<string, boolean>>({});
  const [shareTemplateChallengeId, setShareTemplateChallengeId] = useState<string | null>(null);

  useEffect(() => {
    setSubmissions(loadSubmissions(currentSeason));
    setDrafts({});
    setGalleryImageErrors({});
    setShareTemplateChallengeId(null);
  }, [currentSeason]);

  const updateDraft = (challengeId: string, next: Partial<ChallengeSubmissionDraft>) => {
    setDrafts(prev => ({
      ...prev,
      [challengeId]: {
        snsLink: prev[challengeId]?.snsLink ?? '',
        screenshotUrl: prev[challengeId]?.screenshotUrl ?? '',
        ...next,
      },
    }));
  };

  const handleCopyHashtag = (hashtag: string) => {
    navigator.clipboard.writeText(hashtag).then(() => {
      setCopiedTag(hashtag);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      setTimeout(() => setCopiedTag(null), 2000);
    }).catch(() => {});
  };

  const handleSubmit = (challenge: SnsChallenge) => {
    const draft = drafts[challenge.id];
    const snsLink = draft?.snsLink ?? '';
    const screenshotUrl = draft?.screenshotUrl ?? '';

    if (!snsLink.trim()) return;

    const submission: SnsChallengeSubmission = {
      challengeId: challenge.id,
      snsLink: snsLink.trim(),
      screenshotUrl: screenshotUrl.trim(),
      status: 'pendingReview',
      submittedAt: Date.now(),
    };

    const updated = { ...submissions, [challenge.id]: submission };
    setSubmissions(updated);
    saveSubmissions(currentSeason, updated);
    updateDraft(challenge.id, { snsLink: '', screenshotUrl: '' });
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  const getGalleryForChallenge = (challengeId: string): ChallengeGalleryEntry[] => {
    return MOCK_CHALLENGE_GALLERY.filter(entry => entry.challengeId === challengeId);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (language === 'ko') {
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const shareTemplateChallenge = shareTemplateChallengeId
    ? activeChallenges.find(challenge => challenge.id === shareTemplateChallengeId) ?? null
    : null;

  if (activeChallenges.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-amber-50/90 p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
          <Hash size={16} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">
            {t('sns_challenge_section_title', language)}
          </h3>
          <p className="text-[10px] font-semibold text-slate-500">
            {t('sns_challenge_section_desc', language)}
          </p>
        </div>
        <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-800">
          {t('sns_challenge_open_count', language, { count: activeChallenges.length })}
        </span>
      </div>

      <div className="space-y-3">
        {activeChallenges.map((challenge) => {
          const isExpanded = expandedId === challenge.id;
          const submission = submissions[challenge.id];
          const isSubmitted = submission !== undefined;
          const galleryEntries = getGalleryForChallenge(challenge.id);
          const draft = drafts[challenge.id] ?? { snsLink: '', screenshotUrl: '' };

          return (
            <div
              key={challenge.id}
              className="overflow-hidden rounded-xl border border-amber-200/50 bg-white/80"
            >
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setExpandedId(isExpanded ? null : challenge.id);
                }}
                className="touch-target flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-amber-50/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                  <Hash size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-xs font-bold text-slate-800">
                    {t(challenge.titleKey, language)}
                  </h4>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-500">
                      <Calendar size={10} />
                      {formatDate(challenge.endDate)}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-amber-700">
                      <Gift size={10} />
                      +{challenge.rewardSns.toLocaleString()} SNS
                    </span>
                  </div>
                </div>
                {isSubmitted && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-bold text-amber-700">
                    <Clock size={10} />
                    {t('sns_challenge_status_pending', language)}
                  </span>
                )}
                <ChevronRight
                  size={16}
                  className={cn(
                    'shrink-0 text-slate-400 transition-transform',
                    isExpanded && 'rotate-90',
                  )}
                />
              </button>

              {isExpanded && (
                <div className="space-y-4 border-t border-amber-100/60 px-4 pb-4 pt-3">
                  <p className="text-[10px] font-semibold leading-relaxed text-slate-600">
                    {t(challenge.descKey, language)}
                  </p>

                  <div className="rounded-lg border border-amber-100/50 bg-amber-50/60 p-3">
                    <p className="mb-1 text-[9px] font-bold uppercase text-amber-700">
                      {t('sns_challenge_howto_label', language)}
                    </p>
                    <p className="whitespace-pre-line text-[10px] font-semibold text-slate-600">
                      {t(challenge.howToKey, language)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <code className="break-all text-[11px] font-bold text-indigo-600">
                        {challenge.hashtag}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopyHashtag(challenge.hashtag)}
                      className="touch-target flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[10px] font-bold uppercase text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
                    >
                      {copiedTag === challenge.hashtag ? (
                        <>
                          <CheckCircle2 size={12} />
                          {t('sns_challenge_copied', language)}
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          {t('sns_challenge_copy_tag', language)}
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setShareTemplateChallengeId(challenge.id);
                      }}
                      className="touch-target flex items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[10px] font-bold uppercase text-violet-700 transition-all hover:border-violet-300 hover:bg-violet-100 active:scale-[0.98]"
                    >
                      <Share2 size={12} />
                      {t('sns_challenge_open_template', language)}
                    </button>
                    {setView && (
                      <button
                        onClick={() => {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          setView('share');
                        }}
                        className="touch-target flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                      >
                        <ExternalLink size={12} />
                        {t('sns_challenge_share_hub', language)}
                      </button>
                    )}
                  </div>

                  {!isSubmitted ? (
                    <div className="space-y-2">
                      <label className="block text-[9px] font-bold uppercase text-slate-500">
                        <Link2 size={10} className="mr-1 inline" />
                        {t('sns_challenge_link_label', language)}
                      </label>
                      <input
                        type="url"
                        value={draft.snsLink}
                        onChange={(event) => updateDraft(challenge.id, { snsLink: event.target.value })}
                        placeholder={t('sns_challenge_link_placeholder', language)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                      <label className="mt-2 block text-[9px] font-bold uppercase text-slate-500">
                        <Image size={10} className="mr-1 inline" />
                        {t('sns_challenge_screenshot_label', language)}
                      </label>
                      <input
                        type="url"
                        value={draft.screenshotUrl}
                        onChange={(event) => updateDraft(challenge.id, { screenshotUrl: event.target.value })}
                        placeholder={t('sns_challenge_screenshot_placeholder', language)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                      <button
                        onClick={() => handleSubmit(challenge)}
                        disabled={!draft.snsLink.trim()}
                        className={cn(
                          'touch-target flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]',
                          draft.snsLink.trim()
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/10 hover:from-amber-600 hover:to-orange-600'
                            : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400',
                        )}
                      >
                        <Send size={12} />
                        {t('sns_challenge_submit_btn', language)}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3">
                      <Clock size={14} className="shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-[10px] font-bold text-emerald-700">
                          {t('sns_challenge_submitted_title', language)}
                        </p>
                        <p className="text-[9px] font-semibold text-emerald-600">
                          {t('sns_challenge_submitted_desc', language)}
                        </p>
                      </div>
                    </div>
                  )}

                  {galleryEntries.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center gap-1.5">
                        <Users size={12} className="text-amber-600" />
                        <span className="text-[9px] font-bold uppercase text-amber-700">
                          {t('sns_challenge_gallery_title', language)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {galleryEntries.map((entry) => (
                          <a
                            key={entry.id}
                            href={entry.snsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block overflow-hidden rounded-lg border border-slate-200 bg-white transition-all hover:border-amber-300 hover:shadow-sm"
                          >
                            <div className="relative aspect-square overflow-hidden bg-slate-100">
                              {galleryImageErrors[entry.id] ? (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-100 to-slate-200 px-2 text-center text-slate-500">
                                  <ImageOff size={18} className="text-slate-400" />
                                  <span className="text-[8px] font-bold uppercase">
                                    {t('sns_challenge_gallery_fallback', language)}
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <img
                                    src={entry.imageUrl}
                                    alt={entry.userName}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                    onError={() => setGalleryImageErrors(prev => ({ ...prev, [entry.id]: true }))}
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                                    <span className="text-[8px] font-bold text-white">
                                      @{entry.userName}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <AlertCircle size={12} className="mt-0.5 shrink-0 text-slate-400" />
                    <p className="text-[9px] font-semibold leading-relaxed text-slate-500">
                      {t('sns_challenge_reward_notice', language)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-100/50 bg-amber-50/60 p-3">
        <Sparkles size={12} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-[9px] font-semibold leading-relaxed text-slate-600">
          {t('sns_challenge_footer_note', language)}
        </p>
      </div>

      <AnimatePresence>
        {shareTemplateChallenge && (
          <ShareTemplateCard
            templateType="season"
            language={language}
            seasonTitle={t(shareTemplateChallenge.titleKey, language)}
            seasonSubtitle={`${t(shareTemplateChallenge.descKey, language)}\n${shareTemplateChallenge.hashtag}`}
            seasonId={seasonConfig.id}
            seasonName={t(seasonConfig.titleKey, language)}
            onClose={() => setShareTemplateChallengeId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
