import React, { useState, useEffect } from "react";
import { Shield, Gift, Swords, AlertTriangle, AlertCircle, Sword, HelpCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Language, ViewType, Guild } from "../types";
import { t } from "../lib/i18n";
import { PageHeader } from "../components/PageHeader";
import { getGuild, donateToGuild, getGuildBuff, getRequiredExpForNextLevel, joinGuild } from "../lib/guildHelper";
import { AttackResult } from "../lib/guildHelper";
import { GuildRaidPanel } from "../components/GuildRaidPanel";
import { FriendBattlePanel } from "../components/FriendBattlePanel";
import { motion, AnimatePresence } from "motion/react";

interface GuildDetailViewProps {
  onNavigate: (view: ViewType) => void;
  language: Language;
  currentUser: { uid: string; displayName: string } | null;
  guildId: string;
  isOpponentMode: boolean; // true면 공격 모드로 진입
  userGuild: Guild | null;
  sns: number; // 사용자의 현재 보유 SNS 코인
  onUpdateSns: (newSns: number) => void;
  refreshUserGuild: () => void;
  onAttackMember?: (memberUid: string, memberName: string) => void;
  onStartFriendBattle?: (opponentUid: string, opponentName: string, battleRequestId?: string) => void;
  totalPower: number;
  season: string;
}
export const GuildDetailView: React.FC<GuildDetailViewProps> = ({
  onNavigate,
  language,
  currentUser,
  guildId,
  isOpponentMode,
  userGuild,
  sns,
  onUpdateSns,
  refreshUserGuild,
  onAttackMember,
  onStartFriendBattle,
  totalPower,
  season,
}) => {
  const [guild, setGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  
  // 기부 금액 선택 상태
  const [donateAmount, setDonateAmount] = useState<number>(500);
  
  // 전투 결과 상태
  const [battleResult, setBattleResult] = useState<AttackResult | null>(null);
  const [isFighting, setIsFighting] = useState(false);

  // 탭 상태 (info | raid)
  const [activeTab, setActiveTab] = useState<'info' | 'raid'>('info');
  const [showHelp, setShowHelp] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelp) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelp]);

  const [helpStep, setHelpStep] = useState(0);

  useEffect(() => {
    loadGuildDetail();
  }, [guildId]);

  // 길드 ID 변경 시 또는 마운트 시 스크롤 위치를 0으로 리셋
  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollContainers = document.querySelectorAll('.overflow-y-auto');
    scrollContainers.forEach(container => {
      container.scrollTop = 0;
    });
  }, [guildId]);

  useEffect(() => {
    const handleGlobalBack = (e: Event) => {
      e.preventDefault();
      onNavigate('guild-list');
    };
    window.addEventListener('global-back', handleGlobalBack);
    return () => window.removeEventListener('global-back', handleGlobalBack);
  }, [onNavigate]);

  const loadGuildDetail = async () => {
    setLoading(true);
    try {
      const data = await getGuild(guildId);
      setGuild(data);
    } catch (e) {
      console.error("Failed to load guild details", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-650 mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading Guild Database...</p>
        </div>
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center font-sans p-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md text-center shadow-2xl">
          <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold uppercase tracking-tight mb-2 text-slate-800">Guild Not Found</h2>
          <p className="text-xs opacity-60 mb-6 text-slate-500 font-bold">{t("guild_not_found", language)}</p>
          <button
            onClick={() => onNavigate("guild-list")}
            className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            {t("guild_back_to_list", language)}
          </button>
        </div>
      </div>
    );
  }

  const nextExpNeeded = getRequiredExpForNextLevel(guild.level);
  const expPercentage = guild.level >= 10 ? 100 : Math.min(100, Math.round((guild.exp / nextExpNeeded) * 100));
  const currentBuff = getGuildBuff(guild.level);

  // 기부 실행
  const handleDonate = async () => {
    if (!currentUser) {
      setAlertMsg(t("not_logged_in", language));
      return;
    }
    if (sns < donateAmount) {
      setAlertMsg(t("insufficient_sns", language));
      return;
    }

    try {
      // 1. 기부 진행
      const { guild: updatedGuild, leveledUp } = await donateToGuild(guild.id, currentUser.uid, donateAmount);
      
      // 2. 사용자 SNS 포인트 차감
      const newSns = sns - donateAmount;
      onUpdateSns(newSns);

      // 3. UI 업데이트
      setGuild(updatedGuild);
      refreshUserGuild();

      if (leveledUp) {
        setAlertMsg(t("guild_level_up_alert", language, { level: updatedGuild.level }));
      } else {
        setAlertMsg(t("guild_donated_success", language));
      }
    } catch (err: unknown) {
      setAlertMsg(err instanceof Error ? err.message : "Failed to donate.");
    }
  };

  // 길드 가입 실행
  const handleJoinGuild = async () => {
    if (!currentUser || currentUser.uid === 'guest-id') {
      setAlertMsg(t("guild_login_required", language));
      return;
    }
    try {
      const updatedGuild = await joinGuild(guild.id, currentUser.uid, currentUser.displayName || "Anonymous Hunter");
      setGuild(updatedGuild);
      refreshUserGuild();
      setAlertMsg(t("guild_joined_success", language));
    } catch (err: unknown) {
      setAlertMsg(err instanceof Error ? err.message : "Failed to join guild.");
    }
  };

  // 타 길드 공격 실행
  const handleAttack = () => {
    if (!userGuild) {
      setAlertMsg(t("guild_join_required_to_attack", language));
      return;
    }
    if (!guild || userGuild.id === guild.id) {
      setAlertMsg(t("cannot_attack_own_guild", language));
      return;
    }

    const attackableMembers = guild.members.filter(m => m.uid !== currentUser?.uid);
    if (attackableMembers.length === 0) {
      setAlertMsg(t("no_attackable_guild_members", language));
      return;
    }

    const randomMember = attackableMembers[Math.floor(Math.random() * attackableMembers.length)];
    onAttackMember?.(randomMember.uid, randomMember.displayName);
  };

  return (
    <div className="min-h-screen app-bg text-slate-800 font-sans pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 mt-2">
        <div className="flex items-center gap-2">
          <PageHeader title={t('guild_detail', language) || 'Guild Detail'} onBack={() => onNavigate('guild-list')} />
          <button
            onClick={() => { setShowHelp(true); setHelpStep(0); }}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <HelpCircle size={16} className="text-slate-500" />
          </button>
        </div>
        {/* Main Guild Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mt-4">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-6xl shadow-sm">
              {guild.mark}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-2.5 mb-2 justify-center md:justify-start">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 leading-tight">
                  {guild.name}
                </h1>
              </div>

              {/* Progress to next level */}
              {guild.level < 10 && (
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-650 transition-all duration-500"
                    style={{ width: `${expPercentage}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Bar (내 길드일 때만 표시) */}
        {!isOpponentMode && userGuild?.id === guild.id && (
          <div className="flex gap-2 mb-4 bg-slate-100/80 rounded-xl p-1.5">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'info'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Shield size={14} />
              {t("guild_tab_info", language)}
            </button>
            <button
              onClick={() => setActiveTab('raid')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'raid'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sword size={14} />
              {t("guild_tab_raid", language)}
            </button>
          </div>
        )}

        {/* Raid Tab Content */}
        {!isOpponentMode && userGuild?.id === guild.id && activeTab === 'raid' ? (
          <GuildRaidPanel
            guildId={guild.id}
            guildName={guild.name}
            guildLevel={guild.level}
            season={season}
            language={language}
            currentUser={currentUser}
            userTotalPower={totalPower}
            onUpdateSns={(delta) => onUpdateSns(sns + delta)}
            onUpdateGuildExp={(delta) => {
              setGuild((prev) => (prev ? { ...prev, exp: prev.exp + delta } : prev));
              refreshUserGuild();
            }}
          />
        ) : (
          <>
        {/* Battle Effects Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 mb-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-indigo-650">
              {t("guild_current_bonus_value", language, { power: currentBuff.powerPercent, stat: currentBuff.statBonus })}
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/75 flex items-center justify-center text-2xl shadow-md shadow-indigo-100">
              ⚔️
            </div>
          </div>
        </div>

        {/* Member List */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 mb-6 shadow-xl">
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {guild.members.map((member) => (
              <div key={member.uid} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-xs uppercase text-slate-500 shadow-xs">
                    {member.displayName.substring(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      {member.displayName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOpponentMode && currentUser?.uid !== member.uid && (
                    <button
                      onClick={() => onAttackMember?.(member.uid, member.displayName)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-xl active:scale-98 transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-rose-250"
                    >
                      <Swords size={12} />
                      {t("attack", language)}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Section */}
        {isOpponentMode ? (
          // 공격 대상 길드인 경우
          <div className="bg-rose-50/20 border border-rose-200/70 rounded-3xl p-6 text-center shadow-xl">
            <button
              onClick={handleAttack}
              disabled={isFighting}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 shadow-lg shadow-rose-250 cursor-pointer"
            >
              <Swords size={18} />
              {isFighting ? t("guild_attack_in_progress", language) : t("guild_attack_start", language)}
            </button>
          </div>
        ) : (
          // 내 길드이거나 일반 상세 보기인 경우
          userGuild?.id === guild.id ? (
            <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-lg p-5 sm:p-6 shadow-sm">

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                {[500, 1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDonateAmount(amt)}
                    className={`min-h-12 px-3 py-3 rounded-lg border text-sm font-black transition-all active:scale-98 cursor-pointer whitespace-nowrap ${
                      donateAmount === amt
                        ? "border-indigo-700 bg-indigo-600 text-white shadow-sm"
                        : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    {amt.toLocaleString()} SNS
                  </button>
                ))}
              </div>

              <button
                onClick={handleDonate}
                disabled={sns < donateAmount}
                className="w-full min-h-14 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-4 rounded-lg font-black uppercase tracking-wide text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                <Gift size={18} />
                {t("guild_donate_btn", language, { amount: donateAmount.toLocaleString() })}
              </button>
            </div>
          ) : !userGuild ? (
            <div className="bg-amber-50/20 border border-amber-200/70 rounded-3xl p-6 text-center shadow-xl">
              <button
                onClick={handleJoinGuild}
                className="w-full bg-gradient-to-r from-yellow-450 to-amber-500 text-amber-950 py-4 rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-lg shadow-yellow-200/40 cursor-pointer"
              >
                <Shield size={18} />
                {t("guild_join", language)}
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center shadow-md">
              <AlertTriangle className="text-slate-400 mx-auto" size={28} />
            </div>
          )
        )}

      {/* Friend Battle Panel (내 길드에서만 표시) */}
      {!isOpponentMode && userGuild?.id === guild.id && (
        <div className="mt-6 space-y-3">
          <FriendBattlePanel
            language={language}
            currentUser={currentUser}
            userGuild={guild}
            onStartBattle={(opponentUid, opponentName, battleRequestId) => {
              onStartFriendBattle?.(opponentUid, opponentName, battleRequestId);
            }}
            onUpdateSns={(delta) => onUpdateSns(sns + delta)}
          />
        </div>
      )}

      {/* Battle Simulation Overlay Modal */}
      <AnimatePresence>
        {isFighting && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="text-center text-white max-w-md w-full">
              <Swords size={80} className="mx-auto mb-6 text-rose-55 animate-[spin_3s_linear_infinite]" />
              <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-white uppercase">
                {t("guild_invasion_commenced", language)}
              </h2>
              <p className="text-[10px] tracking-wider opacity-60 uppercase mb-8">TACTICAL INTERCEPT IN PROGRESS...</p>
              
              {/* Loading Indicator */}
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 animate-[pulse_1.5s_infinite] w-full" />
              </div>
              <p className="text-xs font-medium mt-3 text-rose-455">
                {t("comparing_combat_power", language)}
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Battle Result Modal */}
      <AnimatePresence>
        {battleResult && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-xl shadow-2xl my-8 relative"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider mb-4 shadow-sm">
                  Combat Result Decided
                </div>

                {battleResult.winnerId === userGuild?.id ? (
                  <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-emerald-600 mb-2 uppercase">
                      VICTORY!
                    </h2>
                    <p className="text-xs font-bold text-emerald-800">
                      {t("invasion_victory_desc", language)}
                    </p>
                    <div className="mt-4 bg-emerald-50/50 border border-emerald-250 rounded-2xl p-4 inline-block shadow-sm">
                      <div className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
                        {t("rewards_claimed", language)}
                      </div>
                      <div className="text-xl font-extrabold text-emerald-900 mt-1">
                        +1,500 SNS{t("victory_loot_plundered", language)}
                      </div>
                      <div className="text-[9px] text-emerald-700 mt-1 font-semibold">
                        {t("guild_exp_granted", language)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-rose-500 mb-2 uppercase">
                      DEFEAT...
                    </h2>
                    <p className="text-xs font-bold text-rose-700">
                      {t("invasion_defeat_desc", language)}
                    </p>
                    <div className="mt-4 bg-rose-50/50 border border-rose-250 rounded-2xl p-4 inline-block shadow-sm">
                      <div className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">
                        {t("consolation_reward", language)}
                      </div>
                      <div className="text-xl font-extrabold text-rose-900 mt-1">
                        +300 SNS
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Combat Log */}
              <div className="bg-slate-950 text-slate-300 p-4.5 rounded-2xl text-[11px] leading-relaxed max-h-60 overflow-y-auto mb-6 border border-slate-800 shadow-inner">
                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider border-b border-slate-800/80 pb-2 mb-2 flex items-center justify-between">
                  <span>COMBAT LOG STREAM</span>
                  <span className="animate-pulse text-emerald-500">● LIVE</span>
                </div>
                <div className="space-y-1">
                  {battleResult.log.map((line: string, idx: number) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setBattleResult(null);
                  onNavigate("guild-list");
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                {t("confirm_return", language)}
              </button>
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
              className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative animate-in"
            >
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-rose-500" size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-2">Notification</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">{alertMsg}</p>
              <button
                onClick={() => setAlertMsg(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors active:scale-98 shadow-sm cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </>
      )}

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
                  {t('guild_detail', language)}
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
                    <p className="text-xs font-bold text-slate-700">{language === 'ko' ? '길드 상세 정보를 확인하세요.' : 'View detailed guild information.'}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ko' ? '길드 레벨, 멤버, 전투 버프를 한눈에 볼 수 있습니다.' : 'See guild level, members, and battle buffs at a glance.'}</p>
                  </div>
                )}
                {helpStep === 1 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">{language === 'ko' ? '기부로 길드를 성장시키세요.' : 'Grow your guild through donations.'}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ko' ? 'SNS 코인을 기부하면 길드 경험치가 올라가고 레벨업 시 전투 버프가 강화됩니다.' : 'Donate SNS coins to increase guild EXP and strengthen battle buffs on level up.'}</p>
                  </div>
                )}
                {helpStep === 2 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">{language === 'ko' ? '레이드와 친구 대전을 즐기세요.' : 'Enjoy raids and friend battles.'}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ko' ? '길드 레이드에 참여하고 친구와 대전하여 더 많은 보상을 획득하세요.' : 'Participate in guild raids and battle friends for more rewards.'}</p>
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
    </div>
  );
};
