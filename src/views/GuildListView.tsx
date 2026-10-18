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
    <div className="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 mt-2">
        <PageHeader
          title={t('guild_management', language)}
          onBack={() => onNavigate('home')}
          rightAction={
            <button
              type="button"
              onClick={() => { setShowHelp(true); setHelpSlide(0); }}
              className="min-h-[44px] min-w-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#646262] hover:text-[#201d1d] hover:bg-[#f8f7f7] flex items-center justify-center transition-colors cursor-pointer"
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
              type="button"
              onClick={() => onSelectGuild(userGuild.id, false)}
              className="min-h-[44px] min-w-[44px] px-3 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] rounded-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#201d1d]"
              aria-label={t("view_my_guild", language)}
            >
              <Shield size={16} />
              <span className="text-xs font-bold font-mono">[{t("view_my_guild", language)}]</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!currentUser || currentUser.uid === 'guest-id') {
                  setAlertMsg(t("guild_login_required", language));
                  return;
                }
                setIsModalOpen(true);
              }}
              className="min-h-[44px] min-w-[44px] px-3 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] rounded-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#201d1d]"
              aria-label={t("create_guild", language)}
            >
              <Plus size={16} />
              <span className="text-xs font-bold font-mono">[{t("create_guild", language)}]</span>
            </button>
          )}
          <button
            type="button"
            onClick={loadGuilds}
            className="min-h-[44px] min-w-[44px] bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-sm flex items-center justify-center transition-colors cursor-pointer text-[#201d1d] hover:bg-[#f8f7f7]"
            aria-label={t("refresh", language)}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Tab Bar: List / Rankings */}
        <div className="flex gap-2 mb-5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none p-1 font-mono">
          <button
            type="button"
            onClick={() => setShowRanking(false)}
            className={`flex-1 min-h-[44px] rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 border ${
              !showRanking
                ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                : 'bg-transparent text-[#646262] border-transparent hover:text-[#201d1d]'
            }`}
          >
            <Shield size={14} />
            [{t('guild_ranking_tab_list', language)}]
          </button>
          <button
            type="button"
            onClick={() => setShowRanking(true)}
            className={`flex-1 min-h-[44px] rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 border ${
              showRanking
                ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                : 'bg-transparent text-[#646262] border-transparent hover:text-[#201d1d]'
            }`}
          >
            <Trophy size={14} />
            [{t('guild_ranking_tab_rankings', language)}]
          </button>
        </div>

        {showRanking ? (
          /* ===== RANKING VIEW ===== */
          <div>
            {/* Top 3 Podium */}
            <div className="bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-none p-4 mb-4">
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
                        className={`flex flex-col items-center p-3 rounded-none text-center border ${
                          isFirst
                            ? 'bg-[#f8f7f7] border-[#201d1d]'
                            : 'bg-[#fdfcfc] border-[rgba(15,0,0,0.12)]'
                        }`}
                      >
                        <span className="text-xl mb-1">{medals[idx]}</span>
                        <span className="text-xl mb-0.5">{g.mark}</span>
                        <span className="text-[11px] font-bold text-[#201d1d] leading-tight truncate max-w-full">
                          {g.name}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Ranking Table */}
            <div className="bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-none overflow-hidden">
              <div className="divide-y divide-[rgba(15,0,0,0.08)]">
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
                        className={`flex items-center gap-3 px-4 py-3 min-h-[44px] cursor-pointer transition-colors hover:bg-[#f8f7f7] ${
                          isMyGuild ? 'bg-[#f8f7f7] border-l-2 border-[#201d1d]' : ''
                        }`}
                      >
                        <div className="w-6 text-center shrink-0">
                          {rankIcon ? (
                            <span className="text-lg">{rankIcon}</span>
                          ) : (
                            <span className="text-xs font-bold text-[#646262]">{i + 1}</span>
                          )}
                        </div>
                        <span className="text-lg shrink-0">{g.mark}</span>
                        <span className={`text-sm font-bold truncate flex-1 ${isMyGuild ? 'text-[#201d1d]' : 'text-[#424245]'}`}>
                          {g.name}
                        </span>
                        <span className="text-xs font-bold text-[#201d1d] shrink-0">{score.toLocaleString()}</span>
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#646262]" size={16} />
              <input
                type="text"
                placeholder={t("search_guilds", language)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-sm text-xs font-mono text-[#201d1d] placeholder:text-[#646262] focus:outline-none focus:border-[#201d1d]"
              />
            </div>

            {/* Guild List */}
            {loading ? (
              <div className="py-20 text-center text-sm font-bold text-[#646262]">
                [{t("loading", language)}]
              </div>
            ) : filteredGuilds.length === 0 ? (
              <div className="bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-none p-10 text-center">
                <Shield size={36} className="mx-auto mb-3 text-[#646262]" />
                <h3 className="text-sm font-bold text-[#201d1d] mb-1">
                  [{t("guild_not_found_list", language)}]
                </h3>
                <p className="text-xs text-[#646262]">
                  {t("guild_not_found_desc", language)}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredGuilds.map((guild) => {
                  const isMyGuild = userGuild?.id === guild.id;
                  const hasGuild = !!userGuild;

                  return (
                    <div
                      key={guild.id}
                      className={`bg-[#fdfcfc] border rounded-none p-3.5 flex items-center justify-between gap-3 transition-colors ${
                        isMyGuild ? "border-[#201d1d] bg-[#f8f7f7]" : "border-[rgba(15,0,0,0.12)]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-none bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] flex items-center justify-center text-2xl shrink-0">
                          {guild.mark}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-[#201d1d] truncate">
                            {guild.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onSelectGuild(guild.id, false)}
                          className="min-h-[44px] min-w-[44px] bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm flex items-center justify-center text-[#201d1d] cursor-pointer transition-colors"
                          aria-label={t("details", language)}
                        >
                          <Eye size={16} />
                        </button>

                        {isMyGuild ? null : hasGuild ? (
                          <button
                            type="button"
                            onClick={() => onSelectGuild(guild.id, true)}
                            className="min-h-[44px] min-w-[44px] px-3 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] rounded-sm flex items-center justify-center gap-1 cursor-pointer transition-colors border border-[#201d1d]"
                            aria-label={t("guild_attack", language)}
                          >
                            <Swords size={16} />
                            <span className="text-[11px] font-bold">[{t("guild_attack", language)}]</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleJoinGuild(guild.id)}
                            className="min-h-[44px] min-w-[44px] px-3 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] rounded-sm flex items-center justify-center gap-1 cursor-pointer transition-colors border border-[#201d1d]"
                            aria-label={t("guild_join", language)}
                          >
                            <Plus size={16} />
                            <span className="text-[11px] font-bold">[{t("guild_join", language)}]</span>
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
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 font-mono">
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#fdfcfc] border border-[#201d1d] rounded-none p-5 w-full max-w-md relative text-[#201d1d]"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[rgba(15,0,0,0.12)] pb-2">
                <h2 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2 text-[#201d1d]">
                  <Shield size={16} />
                  [{t("create_guild", language)}]
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrorMsg("");
                  }}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#646262] hover:text-[#201d1d] cursor-pointer"
                >
                  [x]
                </button>
              </div>

              <form onSubmit={handleCreateGuild} className="space-y-4">
                {errorMsg && (
                  <div className="bg-[#f8f7f7] border border-rose-600 text-rose-700 p-3 rounded-none text-xs font-bold font-mono">
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
                    className="w-full min-h-[44px] p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm text-xs font-mono font-semibold text-[#201d1d] focus:outline-none focus:border-[#201d1d]"
                  />
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_MARKS.map((mark) => (
                    <button
                      key={mark}
                      type="button"
                      onClick={() => setSelectedMark(mark)}
                      className={`min-h-[44px] text-xl p-1 rounded-sm border transition-colors cursor-pointer flex items-center justify-center ${
                        selectedMark === mark
                          ? "border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]"
                          : "border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7] bg-[#fdfcfc]"
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
                    className="w-full min-h-[44px] p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm text-xs font-mono font-semibold text-[#201d1d] focus:outline-none focus:border-[#201d1d]"
                  >
                    {LANG_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {t(`lang_${opt.code.replace('-', '_')}` as any, language)} ({opt.code.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setErrorMsg("");
                    }}
                    className="flex-1 min-h-[44px] border border-[rgba(15,0,0,0.12)] rounded-sm text-xs font-bold uppercase tracking-wider bg-[#fdfcfc] hover:bg-[#f8f7f7] text-[#201d1d] transition-colors cursor-pointer"
                  >
                    [{t("cancel_btn", language)}]
                  </button>
                  <button
                    type="submit"
                    className="flex-1 min-h-[44px] bg-[#201d1d] text-[#fdfcfc] rounded-sm text-xs font-bold uppercase tracking-wider transition-colors border border-[#201d1d] hover:bg-[#302c2c] cursor-pointer"
                  >
                    [{t("guild_create_btn", language)}]
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
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 font-mono">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#fdfcfc] border border-[#201d1d] rounded-none p-5 w-full max-w-sm text-center relative"
            >
              <div className="w-10 h-10 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="text-rose-600" size={20} />
              </div>
              <h4 className="text-xs font-bold text-[#201d1d] mb-1.5 uppercase">[NOTIFICATION]</h4>
              <p className="text-xs text-[#646262] leading-relaxed mb-4">{alertMsg}</p>
              <button
                type="button"
                onClick={() => setAlertMsg(null)}
                className="w-full min-h-[44px] bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] font-bold text-xs rounded-sm transition-colors cursor-pointer border border-[#201d1d]"
              >
                [{language === 'ko' ? '닫기' : 'Close'}]
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
            className="fixed inset-0 z-[209] flex items-center justify-center p-4 bg-black/60 font-mono"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#fdfcfc] rounded-none max-w-sm w-full p-5 border border-[#201d1d] relative text-[#201d1d]"
            >
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#646262] hover:text-[#201d1d] cursor-pointer"
              >
                [x]
              </button>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle size={18} className="text-[#201d1d]" />
                <h3 className="font-bold text-xs text-[#201d1d]">[{t('guild_management', language)}]</h3>
              </div>
              <div className="min-h-[70px] flex flex-col justify-center text-xs text-[#646262] leading-relaxed mb-4">
                <p>{helpSlides[helpSlide]}</p>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setHelpSlide((s) => Math.max(0, s - 1))}
                  disabled={helpSlide === 0}
                  className="min-h-[44px] min-w-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] flex items-center justify-center hover:bg-[#f8f7f7] disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] font-bold text-[#646262]">{helpSlide + 1} / {helpSlides.length}</span>
                <button
                  type="button"
                  onClick={() => setHelpSlide((s) => Math.min(helpSlides.length - 1, s + 1))}
                  disabled={helpSlide === helpSlides.length - 1}
                  className="min-h-[44px] min-w-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] flex items-center justify-center hover:bg-[#f8f7f7] disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
