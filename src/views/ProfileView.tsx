import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Lock, Flame, CloudRain, HelpCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language, UserInfo, UserStats } from '../types';
import { t } from '../lib/i18n';
import { cn, getAssetUrl } from '../lib/utils';
import { CARD_DATABASE } from '../cardDatabase';
import {
  DEFAULT_PROFILE_BADGE_KEY,
  DEFAULT_PROFILE_EMOTICON_KEY,
  DEFAULT_PROFILE_TITLE_KEY,
  PROFILE_BADGES,
  PROFILE_BADGE_STORAGE_KEY,
  PROFILE_EMOTICONS,
  PROFILE_EMOTICON_STORAGE_KEY,
  PROFILE_TITLES,
  PROFILE_TITLE_STORAGE_KEY,
  type ProfileUnlockRule,
  getProfileBadgeByKey,
  getProfileEmoticonByKey,
  getProfileTitleByKey,
  getSafeProfileSelection,
  getUnlockRequirementKey,
  isProfileUnlockSatisfied,
} from '../content/profileEmoticons';
import { PageHeader } from '../components/PageHeader';
import { MonsterPetBadge } from '../components/MonsterPetBadge';
import { useMonsterPet } from '../hooks/useMonsterPet';
import { parseCardAvatarId } from '../lib/monsterPet';

interface InventoryEntry {
  quantity?: number;
}

interface ProfileViewProps {
  onBack: () => void;
  language: Language;
  playSfx: (url: string) => void;
  user: UserInfo | null;
  stats: UserStats;
  inventory: Record<string, InventoryEntry> | Record<number, InventoryEntry>;
  onUpdateUser: (name: string, avatar: string, activeEmoticonKey: string, activeBadgeKey: string, activeTitleKey: string) => void;
  showCustomAlert?: (title: string, message: string) => void;
}

const TOTAL_AVATARS = 110;

const getProfileUnlockText = (
  unlock: ProfileUnlockRule,
  language: Language,
) => {
  if (unlock.type === 'default') {
    return t('profile_unlock_requirement_default', language);
  }

  if (unlock.type === 'season') {
    return t(getUnlockRequirementKey(unlock), language, { season: String(unlock.value || '') });
  }

  return t(getUnlockRequirementKey(unlock), language, { value: String(unlock.value || '') });
};

const getCardAvatarStyle = (cardId: number): React.CSSProperties => {
  const idx = CARD_DATABASE[cardId] ? cardId : 1;
  const x = ((idx - 1) % 10) * (100 / 9);
  const y = Math.floor((idx - 1) / 10) * (100 / 10);
  return {
    backgroundImage: `url('${getAssetUrl('/card100.png')}')`,
    backgroundSize: '1000% 1100%',
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
  };
};

const HELP_SLIDES = [
  {
    titleKey: 'profile_help_slide1_title',
    descKey: 'profile_help_slide1_desc',
  },
  {
    titleKey: 'profile_help_slide2_title',
    descKey: 'profile_help_slide2_desc',
  },
  {
    titleKey: 'profile_help_slide3_title',
    descKey: 'profile_help_slide3_desc',
  },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  onBack,
  language,
  playSfx,
  user,
  stats,
  inventory,
  onUpdateUser,
  showCustomAlert,
}) => {
  const uniqueCardCount = Object.keys(inventory || {}).length;
  const firstOwnedCardId = Number(Object.keys(inventory || {}).find((cardId) => (inventory?.[cardId]?.quantity || 0) > 0)) || 1;
  const currentSeason = typeof window !== 'undefined'
    ? localStorage.getItem('hero_current_season') || 'season1'
    : 'season1';

  const profileUnlockContext = useMemo(
    () => ({
      stats,
      uniqueCardCount,
      currentSeason,
    }),
    [stats, uniqueCardCount, currentSeason],
  );

  const [nickname, setNickname] = useState(user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(
    typeof user?.photoURL === 'string' && user.photoURL.startsWith('card:')
      ? user.photoURL
      : `card:${firstOwnedCardId}`,
  );
  const [selectedEmoticonKey, setSelectedEmoticonKey] = useState(
    getSafeProfileSelection(PROFILE_EMOTICONS, user?.activeEmoticonKey || DEFAULT_PROFILE_EMOTICON_KEY, profileUnlockContext),
  );
  const [selectedBadgeKey, setSelectedBadgeKey] = useState(
    getSafeProfileSelection(PROFILE_BADGES, user?.activeBadgeKey || DEFAULT_PROFILE_BADGE_KEY, profileUnlockContext),
  );
  const [selectedTitleKey, setSelectedTitleKey] = useState(
    getSafeProfileSelection(PROFILE_TITLES, user?.activeTitleKey || DEFAULT_PROFILE_TITLE_KEY, profileUnlockContext),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
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

  const selectedEmoticon = getProfileEmoticonByKey(selectedEmoticonKey);
  const selectedBadge = getProfileBadgeByKey(selectedBadgeKey);
  const selectedTitle = getProfileTitleByKey(selectedTitleKey);

  const isUnlocked = (cardId: number) => (inventory?.[cardId]?.quantity || inventory?.[String(cardId)]?.quantity || 0) > 0;

  const handleLockedSelection = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  const { getPetIdForRepresentativeCard } = useMonsterPet({ season: currentSeason });
  const previewCardId = useMemo(() => parseCardAvatarId(selectedAvatar), [selectedAvatar]);
  const previewPetCardId = previewCardId ? getPetIdForRepresentativeCard(previewCardId) : null;

  const handleSave = async () => {
    if (!user) return;

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 10) {
      setMessage({ text: t('nickname_hint', language), type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      localStorage.setItem('hero_user_name', trimmedNickname);
      localStorage.setItem('hero_user_avatar', selectedAvatar);
      localStorage.setItem(PROFILE_EMOTICON_STORAGE_KEY, selectedEmoticonKey);
      localStorage.setItem(PROFILE_BADGE_STORAGE_KEY, selectedBadgeKey);
      localStorage.setItem(PROFILE_TITLE_STORAGE_KEY, selectedTitleKey);

      onUpdateUser(trimmedNickname, selectedAvatar, selectedEmoticonKey, selectedBadgeKey, selectedTitleKey);

      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      if (showCustomAlert) {
        showCustomAlert(
          t('profile_changes_saved_title', language),
          t('profile_changes_saved_desc', language),
        );
      }
      setMessage({ text: t('profile_changes_saved_desc', language), type: 'success' });
      setTimeout(() => setMessage(null), 2500);
    } catch (error) {
      console.error(error);
      if (showCustomAlert) {
        showCustomAlert(
          t('community_error', language),
          t('profile_save_error_desc', language),
        );
      }
      setMessage({ text: t('profile_save_error_desc', language), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const helpTitle = t(HELP_SLIDES[helpStep]?.titleKey ?? 'profile_help_slide1_title', language);
  const helpDesc = t(HELP_SLIDES[helpStep]?.descKey ?? 'profile_help_slide1_desc', language);

  return (
    <div id="profile-info" className="p-4 md:p-8 pb-32 flex flex-col gap-6 max-w-4xl mx-auto min-h-screen bg-slate-50/30 text-slate-800 font-sans">
      <PageHeader
        title={t('profile_title', language)}
        onBack={onBack}
        rightAction={
          <button
            onClick={() => { setHelpOpen(true); setHelpStep(0); }}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
            aria-label="Help"
            type="button"
          >
            <HelpCircle size={16} className="text-slate-500" />
          </button>
        }
      />

      <div id="profile-card" className="bg-white border border-slate-100 rounded-lg p-5 sm:p-6 space-y-8 shadow-sm">
        {/* Profile preview card */}
        <section className="space-y-4 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0 overflow-visible rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
              <div className="h-full w-full scale-[1.25] overflow-hidden rounded-2xl" style={getCardAvatarStyle(Number(selectedAvatar.split(':')[1]) || 1)} />
              <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-indigo-600 text-sm text-white shadow-md">
                {selectedEmoticon.symbol}
              </div>
              {previewPetCardId ? (
                <MonsterPetBadge
                  cardId={previewPetCardId}
                  className="absolute -bottom-2 -right-2 z-10 border-emerald-200 bg-white px-1 py-1"
                  imageClassName="h-6 w-6"
                  label={t('monster_pet_badge', language)}
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate text-xl font-black tracking-tight text-slate-900">
                  {nickname.trim() || user?.displayName || 'GUEST'}
                </h4>
                <span className="text-xl">{selectedEmoticon.symbol}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Avatar grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2 sm:gap-3 max-h-[460px] overflow-y-auto pr-1">
            {Array.from({ length: TOTAL_AVATARS }).map((_, idx) => {
              const cardId = idx + 1;
              const card = CARD_DATABASE[cardId];
              const unlocked = isUnlocked(cardId);
              const isSelected = selectedAvatar === `card:${cardId}`;

              return (
                <button
                  key={cardId}
                  onClick={() => {
                    if (!unlocked) {
                      handleLockedSelection();
                      return;
                    }
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                    setSelectedAvatar(`card:${cardId}`);
                  }}
                  disabled={!unlocked}
                  title={card ? (language === 'ko' ? card.title : (card.title_dis || card.title_en)) : `Card ${cardId}`}
                  className={cn(
                    'relative group aspect-square rounded-xl overflow-hidden border transition-all bg-slate-50 flex items-center justify-center',
                    isSelected ? 'border-indigo-600 ring-2 ring-indigo-600/20 scale-[1.02] shadow-sm' : 'border-slate-100',
                    !unlocked ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:border-slate-300',
                  )}
                >
                  <div className="w-[135%] h-[135%] shrink-0" style={getCardAvatarStyle(cardId)} />

                  {isSelected && (
                    <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                      <div className="bg-indigo-600 p-1.5 rounded-full shadow-md">
                        <Check className="text-white" size={18} />
                      </div>
                    </div>
                  )}

                  {!unlocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 text-white p-1">
                      <Lock size={14} className="mb-1" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nickname */}
        <div className="space-y-2">
          <input
            type="text"
            id="nickname-field"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={user?.displayName || t('profile_nickname_placeholder', language)}
            className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
          />
        </div>

        {/* Title selection */}
        <section className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {PROFILE_TITLES.map((titleOption) => {
              const unlocked = isProfileUnlockSatisfied(titleOption.unlock, profileUnlockContext);
              const isSelected = selectedTitleKey === titleOption.key;
              return (
                <button
                  key={titleOption.key}
                  type="button"
                  onClick={() => {
                    if (!unlocked) {
                      handleLockedSelection();
                      return;
                    }
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                    setSelectedTitleKey(titleOption.key);
                  }}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition-all',
                    isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-slate-50',
                    unlocked ? 'hover:border-slate-300' : 'opacity-60 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black tracking-tight text-slate-900">{t(titleOption.labelKey, language)}</p>
                    {isSelected && unlocked ? <Check size={16} className="text-indigo-600 shrink-0" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Emoticon selection */}
        <section className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROFILE_EMOTICONS.map((emoticon) => {
              const unlocked = isProfileUnlockSatisfied(emoticon.unlock, profileUnlockContext);
              const isSelected = selectedEmoticonKey === emoticon.key;
              return (
                <button
                  key={emoticon.key}
                  type="button"
                  onClick={() => {
                    if (!unlocked) {
                      handleLockedSelection();
                      return;
                    }
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                    setSelectedEmoticonKey(emoticon.key);
                  }}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition-all',
                    isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-slate-50',
                    unlocked ? 'hover:border-slate-300' : 'opacity-60 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white bg-white text-2xl shadow-sm">{emoticon.symbol}</span>
                      <p className="text-sm font-black tracking-tight text-slate-900">{t(emoticon.labelKey, language)}</p>
                    </div>
                    {isSelected && unlocked ? <Check size={16} className="text-indigo-600 shrink-0" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Badge selection */}
        <section className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {PROFILE_BADGES.map((badgeOption) => {
              const unlocked = isProfileUnlockSatisfied(badgeOption.unlock, profileUnlockContext);
              const isSelected = selectedBadgeKey === badgeOption.key;
              return (
                <button
                  key={badgeOption.key}
                  type="button"
                  onClick={() => {
                    if (!unlocked) {
                      handleLockedSelection();
                      return;
                    }
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
                    setSelectedBadgeKey(badgeOption.key);
                  }}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition-all',
                    isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-slate-50',
                    unlocked ? 'hover:border-slate-300' : 'opacity-60 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 min-w-11 items-center justify-center rounded-2xl border border-white bg-white text-xl shadow-sm">{badgeOption.symbol}</span>
                      <p className="text-sm font-black tracking-tight text-slate-900">{t(badgeOption.labelKey, language)}</p>
                    </div>
                    {isSelected && unlocked ? <Check size={16} className="text-indigo-600 shrink-0" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          id="profile-save-btn"
          className={cn(
            'w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wide rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer',
            isSaving && 'animate-pulse',
          )}
        >
          {isSaving ? t('processing', language) : t('save_changes', language)}
        </button>

        {/* Battle stats */}
        <div className="pt-8 border-t border-slate-100 space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 truncate">
            <div className="bg-slate-50 p-2 sm:p-4 rounded-lg border border-slate-100 flex flex-col items-center min-w-0 shadow-xs">
              <span className="text-lg sm:text-xl font-bold text-slate-800 truncate max-w-full">{stats.wins}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase truncate w-full text-center">{language === 'ko' ? '승리' : 'Wins'}</span>
            </div>
            <div className="bg-slate-50 p-2 sm:p-4 rounded-lg border border-slate-100 flex flex-col items-center min-w-0 shadow-xs">
              <span className="text-lg sm:text-xl font-bold text-slate-800 truncate max-w-full">{stats.losses}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase truncate w-full text-center">{language === 'ko' ? '패배' : 'Losses'}</span>
            </div>
            <div className="bg-slate-50 p-2 sm:p-4 rounded-lg border border-slate-100 flex flex-col items-center min-w-0 shadow-xs">
              <span className="text-lg sm:text-xl font-bold text-slate-800 truncate max-w-full">{stats.draws}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase truncate w-full text-center">{language === 'ko' ? '무승부' : 'Draws'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={cn(
              'p-5 sm:p-6 rounded-lg border transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden',
              stats.winStreak > 0
                ? 'bg-orange-50 border-orange-200 shadow-sm'
                : 'bg-slate-50 border-slate-100 opacity-50',
            )}>
              {stats.winStreak > 0 && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute top-1 right-1 text-orange-500 opacity-20"
                >
                  <Flame size={48} />
                </motion.div>
              )}
              <div className="flex items-center gap-2 relative z-10">
                <Flame className={cn(stats.winStreak > 0 ? 'text-orange-500' : 'text-slate-300')} size={24} />
                <span className={cn('text-3xl font-bold', stats.winStreak > 0 ? 'text-orange-600' : 'text-slate-400')}>
                  {stats.winStreak || 0}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 relative z-10">
                {language === 'ko' ? '현재 연승' : 'WIN STREAK'}
              </span>
            </div>

            <div className={cn(
              'p-5 sm:p-6 rounded-lg border transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden',
              stats.lossStreak > 0
                ? 'bg-blue-50 border-blue-100 shadow-sm'
                : 'bg-slate-50 border-slate-100 opacity-50',
            )}>
              {stats.lossStreak > 0 && (
                <motion.div
                  initial={{ y: -5 }}
                  animate={{ y: 5 }}
                  transition={{ repeat: Infinity, duration: 3, repeatType: 'reverse' }}
                  className="absolute top-1 right-1 text-blue-400 opacity-20"
                >
                  <CloudRain size={48} />
                </motion.div>
              )}
              <div className="flex items-center gap-2 relative z-10">
                <CloudRain className={cn(stats.lossStreak > 0 ? 'text-blue-500' : 'text-slate-300')} size={24} />
                <span className={cn('text-3xl font-bold', stats.lossStreak > 0 ? 'text-blue-600' : 'text-slate-400')}>
                  {stats.lossStreak || 0}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 relative z-10">
                {language === 'ko' ? '현재 연패' : 'LOSS STREAK'}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 shadow-xs">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              {language === 'ko' ? '승률' : 'Win Rate'}
            </span>
            <span className="text-xl font-bold text-indigo-900">
              {(() => {
                const total = stats.wins + stats.losses + stats.draws;
                if (total === 0) return '0%';
                return Math.round((stats.wins / total) * 100) + '%';
              })()}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={cn(
                'p-4 border rounded-lg text-center shadow-xs',
                message.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700',
              )}
            >
              <p className="text-sm font-bold">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Help popup */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-indigo-500" />
                  <h3 className="text-sm font-black text-slate-800">{helpTitle}</h3>
                </div>
                <button
                  onClick={() => setHelpOpen(false)}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                  type="button"
                >
                  <X size={14} className="text-slate-500" />
                </button>
              </div>
              <div className="p-5 min-h-[100px]">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{helpDesc}</p>
              </div>
              <div className="flex items-center justify-between px-4 pb-4">
                <button
                  onClick={() => setHelpStep((s) => Math.max(0, s - 1))}
                  disabled={helpStep === 0}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 transition-colors"
                  type="button"
                >
                  <ChevronLeft size={16} className="text-slate-600" />
                </button>
                <span className="text-[10px] font-bold text-slate-400">
                  {helpStep + 1} / {HELP_SLIDES.length}
                </span>
                <button
                  onClick={() => setHelpStep((s) => Math.min(HELP_SLIDES.length - 1, s + 1))}
                  disabled={helpStep === HELP_SLIDES.length - 1}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 transition-colors"
                  type="button"
                >
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
