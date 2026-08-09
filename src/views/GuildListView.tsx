import React, { useState, useEffect } from "react";
import { Plus, Shield, Swords, Search, X, AlertCircle, Trophy, HelpCircle, ChevronLeft, ChevronRight, RefreshCw, Eye } from "lucide-react";
import { Language } from "../types";
import { t } from "../lib/i18n";
import { PageHeader } from "../components/PageHeader";
import { getGuilds, createGuild, joinGuild, getUserGuild } from "../lib/guildHelper";
import { Guild } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface GuildListViewProps {
  onNavigate: (view: any) => void;
  language: Language;
  currentUser: { uid: string; displayName: string } | null;
  onSelectGuild: (guildId: string, isOpponentMode: boolean) => void;
  userGuild: Guild | null;
  refreshUserGuild: () => void;
}

const EMOJI_MARKS = ["🔥", "🌍", "🛡️", "⚔️", "🏆", "👑", "👾", "🤖", "🛸", "⚡", "🌟", "🍀"];
const LANG_OPTIONS = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ru", label: "Русский" },
  { code: "th", label: "ไทย" },
  { code: "vi", label: "Tiếng Việt" },
];

export const GuildListView: React.FC<GuildListViewProps> = ({
  onNavigate,
  language,
  currentUser,
  onSelectGuild,
  userGuild,
  refreshUserGuild,
}) => {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelp) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelp]);

  const [helpSlide, setHelpSlide] = useState(0);

  // 창립 폼 상태
  const [guildName, setGuildName] = useState("");
  const [selectedMark, setSelectedMark] = useState("🔥");
  const [selectedLang, setSelectedLang] = useState(language);
  const [errorMsg, setErrorMsg] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [showRanking, setShowRanking] = useState(false);

  useEffect(() => {
    loadGuilds();
  }, []);

  // 화면 마운트 시 스크롤 위치를 0으로 리셋
  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollContainers = document.querySelectorAll('.overflow-y-auto');
    scrollContainers.forEach(container => {
      container.scrollTop = 0;
    });
  }, []);

  const loadGuilds = async () => {
    setLoading(true);
    try {
      const list = await getGuilds();
      setGuilds(list);
    } catch (e) {
      console.error("Failed to load guilds", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.uid === 'guest-id') {
      setErrorMsg(t("guild_login_required", language));
      return;
    }
    if (!guildName.trim()) {
      setErrorMsg("Please enter guild name.");
      return;
    }
    if (userGuild) {
      setErrorMsg(t("guild_already_joined", language));
      return;
    }

    try {
      const newGuild = await createGuild(
        guildName.trim(),
        selectedMark,
        selectedLang,
        currentUser.uid,
        currentUser.displayName || "Anonymous Hunter"
      );
      setIsModalOpen(false);
      setGuildName("");
      refreshUserGuild();
      onSelectGuild(newGuild.id, false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create guild.");
    }
  };

  const handleJoinGuild = async (guildId: string) => {
    if (!currentUser || currentUser.uid === 'guest-id') {
      setAlertMsg(t("guild_login_required", language));
      return;
    }
    try {
      await joinGuild(guildId, currentUser.uid, currentUser.displayName || "Anonymous Hunter");
      refreshUserGuild();
      onSelectGuild(guildId, false);
    } catch (err: any) {
      setAlertMsg(err.message || "Failed to join guild.");
    }
  };

  const filteredGuilds = guilds.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const helpSlides = [
    language === 'ko'
      ? '길드를 검색하고 가입하거나, 새 길드를 창립할 수 있습니다. 이미 가입된 길드가 있다면 다른 길드를 공격할 수 있습니다.'
      : 'Search and join guilds, or create a new one. If you already belong to a guild, you can attack other guilds.',
    language === 'ko'
      ? '랭킹 탭에서는 레벨, 경험치, 멤버 수 기준으로 종합 순위를 확인할 수 있습니다. 상위 3개 길드는 시상대에 표시됩니다.'
      : 'The Rankings tab shows overall rankings by level, EXP, and member count. Top 3 guilds appear on the podium.',
    language === 'ko'
      ? '길드 상세 화면에서는 멤버 관리, 길드 레이드, 기여도 등을 확인할 수 있습니다.'
      : 'In the guild detail screen, you can manage members, view guild raids, and check contributions.'
  ];

  return (
    <div className="min-h-screen app-bg text-slate-800 font-sans pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 mt-2">
        <PageHeader
          title={t('guild_management', language)}
          onBack={() => onNavigate('home')}
          rightAction={
            <button
              onClick={() => { setShowHelp(true); setHelpSlide(0); }}
              className="min-h-9 min-w-9 rounded-full border border-slate-300 bg-white/80 text-slate-600 flex items-center justify-center transition-all hover:border-slate-400 hover:bg-white hover:text-slate-800 active:scale-95 cursor-pointer"
              aria-label="Help"
            >
              <HelpCircle size={16} />
            </button>
          }
        />

        {/* Action Buttons - shortcut style */}
        <div className="flex gap-2 my-4">
          {userGuild ? (
            <button
              onClick={() => onSelectGuild(userGuild.id, false)}
              className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
              aria-label={t("view_my_guild", language)}
            >
              <Shield size={16} />
            </button>
          ) : (
            <button
              onClick={() => {
                if (!currentUser || currentUser.uid === 'guest-id') {
                  setAlertMsg(t("guild_login_required", language));
                  return;
                }
                setIsModalOpen(true);
              }}
              className="w-10 h-10 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
              aria-label={t("create_guild", language)}
            >
              <Plus size={16} />
            </button>
          )}
          <button
            onClick={loadGuilds}
            className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer text-slate-600 hover:bg-slate-50"
            aria-label={t("refresh", language)}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Tab Bar: List / Rankings */}
        <div className="flex gap-2 mb-5 bg-slate-100/80 rounded-xl p-1.5">
          <button
            onClick={() => setShowRanking(false)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${
              !showRanking
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Shield size={14} />
            {t('guild_ranking_tab_list', language)}
          </button>
          <button
            onClick={() => setShowRanking(true)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${
              showRanking
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Trophy size={14} />
            {t('guild_ranking_tab_rankings', language)}
          </button>
        </div>

        {showRanking ? (
          /* ===== RANKING VIEW ===== */
          <div>
            {/* Top 3 Podium */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-5 shadow-sm">
              <div className="grid grid-cols-3 gap-2">
                {(() => {
                  const sorted = [...guilds].sort((a, b) => {
                    const scoreA = a.level * 10000 + a.exp + a.members.length * 100;
                    const scoreB = b.level * 10000 + b.exp + b.members.length * 100;
                    return scoreB - scoreA;
                  });
                  const top3 = sorted.slice(0, 3);
                  const medals = ['🥇', '🥈', '🥉'];
                  const podiumOrder = top3.length >= 3 ? [1, 0, 2] : [0, 1, 2];
                  return podiumOrder.map((idx) => {
                    if (idx >= top3.length) return <div key={idx} className="flex-1" />;
                    const g = top3[idx];
                    const isFirst = idx === 0;
                    return (
                      <div
                        key={g.id}
                        className={`flex flex-col items-center p-3 rounded-xl text-center ${
                          isFirst
                            ? 'bg-amber-100/80 border border-amber-300 shadow-md -mt-1'
                            : 'bg-white border border-slate-200/70 shadow-sm'
                        }`}
                      >
                        <span className="text-2xl mb-1">{medals[idx]}</span>
                        <span className="text-xl mb-0.5">{g.mark}</span>
                        <span className="text-[11px] font-extrabold text-slate-800 leading-tight truncate max-w-full">
                          {g.name}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Ranking Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-50">
                {(() => {
                  const ranked = [...guilds].sort((a, b) => {
                    const scoreA = a.level * 10000 + a.exp + a.members.length * 100;
                    const scoreB = b.level * 10000 + b.exp + b.members.length * 100;
                    return scoreB - scoreA;
                  });
                  return ranked.map((g, i) => {
                    const score = g.level * 10000 + g.exp + g.members.length * 100;
                    const isMyGuild = userGuild?.id === g.id;
                    const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                    return (
                      <div
                        key={g.id}
                        onClick={() => onSelectGuild(g.id, false)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-slate-50/80 active:scale-[0.99] ${
                          isMyGuild ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <div className="w-6 text-center shrink-0">
                          {rankIcon ? (
                            <span className="text-lg">{rankIcon}</span>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                          )}
                        </div>
                        <span className="text-lg shrink-0">{g.mark}</span>
                        <span className={`text-sm font-bold truncate flex-1 ${isMyGuild ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {g.name}
                        </span>
                        <span className="text-xs font-extrabold text-amber-700 shrink-0">{score.toLocaleString()}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={t("search_guilds", language)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-lg text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/15 focus:border-indigo-600 shadow-sm"
              />
            </div>

            {/* Guild List */}
            {loading ? (
              <div className="py-20 text-center text-sm font-bold text-slate-400">
                {t("loading", language)}
              </div>
            ) : filteredGuilds.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-lg p-12 text-center shadow-sm">
                <Shield size={40} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  {t("guild_not_found_list", language)}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {t("guild_not_found_desc", language)}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredGuilds.map((guild) => {
                  const isMyGuild = userGuild?.id === guild.id;
                  const hasGuild = !!userGuild;

                  return (
                    <div
                      key={guild.id}
                      className={`bg-white border rounded-lg p-4 flex items-center justify-between gap-3 transition-all shadow-sm ${
                        isMyGuild ? "border-emerald-200 bg-emerald-50/10" : "border-slate-200/70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shrink-0">
                          {guild.mark}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-800 truncate">
                            {guild.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onSelectGuild(guild.id, false)}
                          className="w-8 h-8 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-center transition-all active:scale-95 text-slate-600 cursor-pointer"
                          aria-label={t("details", language)}
                        >
                          <Eye size={14} />
                        </button>

                        {isMyGuild ? null : hasGuild ? (
                          <button
                            onClick={() => onSelectGuild(guild.id, true)}
                            className="w-8 h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
                            aria-label={t("guild_attack", language)}
                          >
                            <Swords size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinGuild(guild.id)}
                            className="w-8 h-8 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                            aria-label={t("guild_join", language)}
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Guild Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2 text-slate-800">
                  <Shield className="text-yellow-500" />
                  {t("create_guild", language)}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrorMsg("");
                  }}
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateGuild} className="space-y-5">
                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs font-bold">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    maxLength={15}
                    value={guildName}
                    onChange={(e) => setGuildName(e.target.value)}
                    placeholder={t("enter_guild_name", language)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-650/15 focus:border-indigo-600 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_MARKS.map((mark) => (
                    <button
                      key={mark}
                      type="button"
                      onClick={() => setSelectedMark(mark)}
                      className={`text-2xl p-2 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                        selectedMark === mark
                          ? "border-indigo-600 bg-indigo-50/50 scale-105 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      {mark}
                    </button>
                  ))}
                </div>

                <div>
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value as Language)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-650/15 focus:border-indigo-600 shadow-sm"
                  >
                    {LANG_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {t(`lang_${opt.code.replace('-', '_')}` as any, language)} ({opt.code.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setErrorMsg("");
                    }}
                    className="flex-1 border border-slate-200 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm text-slate-500 cursor-pointer"
                  >
                    {t("cancel_btn", language)}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-yellow-450 to-amber-500 text-amber-950 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-yellow-200/40 cursor-pointer"
                  >
                    {t("guild_create_btn", language)}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert/Error Toast Popup */}
      <AnimatePresence>
        {alertMsg && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative"
            >
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-rose-500" size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-2">Notification</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">{alertMsg}</p>
              <button
                onClick={() => setAlertMsg(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors active:scale-[0.98] shadow-sm cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative"
            >
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={20} className="text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-800">{t('guild_management', language)}</h3>
              </div>
              <div className="min-h-[80px] flex flex-col justify-center text-sm text-slate-600 leading-relaxed mb-4">
                <p>{helpSlides[helpSlide]}</p>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setHelpSlide((s) => Math.max(0, s - 1))}
                  disabled={helpSlide === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[10px] font-bold text-slate-400">{helpSlide + 1} / {helpSlides.length}</span>
                <button
                  onClick={() => setHelpSlide((s) => Math.min(helpSlides.length - 1, s + 1))}
                  disabled={helpSlide === helpSlides.length - 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
