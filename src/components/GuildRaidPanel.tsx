import React, { useState, useEffect, useCallback } from "react";
import { Sword, Timer, Trophy, Swords, AlertCircle, Zap, Loader2, Gift, Shield } from "lucide-react";
import { Language, GuildRaidState, GuildRaidMemberContribution, RaidParticipationResult, RaidRewardClaimResult } from "../types";
import { t } from "../lib/i18n";
import {
  getGuildRaidState,
  participateInRaid,
  claimRaidRewards,
  getRaidBossForSeason,
  getRaidRanking,
  getRaidProgress,
  getRaidTimeRemaining,
  isRaidActive,
  getRaidCooldownRemaining,
} from "../lib/guildRaidHelper";

interface GuildRaidPanelProps {
  guildId: string;
  guildName: string;
  guildLevel: number;
  season: string;
  language: Language;
  currentUser: { uid: string; displayName: string } | null;
  userTotalPower: number;
  onUpdateSns: (delta: number) => void;
  onUpdateGuildExp: (delta: number) => void;
}

const BOSS_ELEMENTS: Record<string, { emoji: string; color: string; bgColor: string }> = {
  undead: { emoji: "💀", color: "text-purple-700", bgColor: "bg-purple-100" },
  fire: { emoji: "🔥", color: "text-red-700", bgColor: "bg-red-100" },
  water: { emoji: "💧", color: "text-blue-700", bgColor: "bg-blue-100" },
  earth: { emoji: "🌍", color: "text-amber-700", bgColor: "bg-amber-100" },
  dragon: { emoji: "🐉", color: "text-rose-700", bgColor: "bg-rose-100" },
  neutral: { emoji: "⚪", color: "text-slate-700", bgColor: "bg-slate-100" },
};

export const GuildRaidPanel: React.FC<GuildRaidPanelProps> = ({
  guildId,
  guildName,
  guildLevel,
  season,
  language,
  currentUser,
  userTotalPower,
  onUpdateSns,
  onUpdateGuildExp,
}) => {
  const [raidState, setRaidState] = useState<GuildRaidState | null>(null);
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<RaidParticipationResult | null>(null);
  const [claimResult, setClaimResult] = useState<RaidRewardClaimResult | null>(null);
  const [cooldownMs, setCooldownMs] = useState(0);

  const boss = getRaidBossForSeason(season);

  const loadRaidState = useCallback(async () => {
    if (!boss) return;
    setLoading(true);
    try {
      const state = await getGuildRaidState(guildId, season);
      setRaidState(state);
      if (currentUser) {
        setCooldownMs(getRaidCooldownRemaining(state, currentUser.uid));
      }
    } catch (e) {
      console.error("Failed to load raid state", e);
    } finally {
      setLoading(false);
    }
  }, [guildId, season, boss, currentUser]);

  useEffect(() => {
    loadRaidState();
  }, [loadRaidState]);

  // 쿨다운 타이머
  useEffect(() => {
    if (cooldownMs <= 0) return;
    const timer = setInterval(() => {
      setCooldownMs(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownMs]);

  const handleAttack = async () => {
    if (!currentUser || currentUser.uid === "guest-id") {
      setAlertMsg(t("guild_login_required", language));
      return;
    }
    if (!boss || !raidState) return;
    if (cooldownMs > 0) return;

    setAttacking(true);
    setLastResult(null);
    try {
      const baseDamage = Math.max(100, userTotalPower * 2);
      const result = await participateInRaid(
        guildId, season, currentUser.uid, currentUser.displayName,
        baseDamage, guildLevel
      );
      setLastResult(result);
      setRaidState(prev => {
        if (!prev) return prev;
        const hasExistingContribution = prev.contributions.some(c => c.uid === currentUser.uid);
        return {
          ...prev,
          cumulativeDamage: result.cumulativeDamage,
          bossHp: result.bossHpRemaining,
          isDefeated: result.isDefeated,
          defeatedAt: result.isDefeated ? Date.now() : prev.defeatedAt,
          updatedAt: Date.now(),
          contributions: hasExistingContribution
            ? prev.contributions.map(c =>
                c.uid === currentUser.uid ? result.personalContribution : c
              )
            : [...prev.contributions, result.personalContribution],
        };
      });
      setCooldownMs(10 * 60 * 1000);
      setAlertMsg(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setAlertMsg(message);
    } finally {
      setAttacking(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!currentUser || currentUser.uid === "guest-id") return;

    setClaiming(true);
    setClaimResult(null);
    try {
      const result = await claimRaidRewards(guildId, season, currentUser.uid);
      setClaimResult(result);
      if (result.claimed && result.reward) {
        onUpdateSns(result.reward.sns);
        onUpdateGuildExp(result.reward.guildExp);
        setAlertMsg(t("raid_reward_claimed", language));
        loadRaidState();
      } else {
        setAlertMsg(result.reason || t("raid_reward_already_claimed", language));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setAlertMsg(message);
    } finally {
      setClaiming(false);
    }
  };

  if (!boss) {
    return (
      <div className="bg-white border border-slate-200/70 rounded-xl p-6 text-center">
        <AlertCircle size={32} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-bold text-slate-500">{t("raid_no_boss", language)}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/70 rounded-xl p-6 text-center">
        <Loader2 size={24} className="mx-auto animate-spin text-indigo-600 mb-2" />
        <p className="text-sm font-bold text-slate-500">{t("loading", language)}</p>
      </div>
    );
  }

  if (!raidState) return null;

  const progress = getRaidProgress(raidState);
  const ranking = getRaidRanking(raidState);
  const isActive = isRaidActive(boss);
  const timeRemaining = getRaidTimeRemaining(boss);
  const bossElement = BOSS_ELEMENTS[boss.element] || BOSS_ELEMENTS.neutral;
  const myContribution = currentUser
    ? raidState.contributions.find(c => c.uid === currentUser.uid)
    : null;
  const canClaim = myContribution && !myContribution.rewardsClaimed;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{t("raid_panel_title", language)}</p>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{guildName}</h3>
          <p className="text-[10px] text-slate-500 mt-1">{t("raid_panel_desc", language)}</p>
        </div>
        <div className="rounded-xl bg-slate-100 px-3 py-2 text-right">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{t("raid_boss_hp", language)}</p>
          <p className="text-sm font-extrabold text-slate-900">{Math.max(0, raidState?.bossHp ?? 0)}</p>
        </div>
      </div>

      {/* Alert message */}
      {alertMsg && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-bold flex items-start gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {alertMsg}
        </div>
      )}

      {/* Boss Info Card */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${raidState.isDefeated ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-slate-200/70'}`}>
        {/* Boss Header */}
        <div className={`p-4 flex items-center gap-4 ${raidState.isDefeated ? 'bg-emerald-500/10' : 'bg-slate-950'}`}>
          <div className={`w-16 h-16 rounded-xl ${bossElement.bgColor} border flex items-center justify-center text-3xl shrink-0`}>
            <span className={bossElement.color}>{bossElement.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-lg font-extrabold ${raidState.isDefeated ? 'text-emerald-800' : 'text-white'} tracking-tight`}>
                {t(boss.nameKey, language)}
              </h3>
              {raidState.isDefeated && (
                <span className="bg-emerald-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-md">
                  {t("raid_defeated", language)}
                </span>
              )}
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${raidState.isDefeated ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isActive ? t("raid_active", language) : t("raid_ended", language)}
            </p>
          </div>
          {timeRemaining > 0 && !raidState.isDefeated && (
            <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
              <Timer size={14} className="mx-auto text-amber-400 mb-0.5" />
              <span className="text-[9px] font-bold text-white uppercase">
                {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Boss HP Bar */}
        <div className="p-4 space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className="text-slate-500">{t("raid_boss_hp", language)}</span>
            <span className="text-slate-700">
              {raidState.isDefeated ? "0" : raidState.bossHp.toLocaleString()} / {raidState.bossMaxHp.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                raidState.isDefeated
                  ? "bg-emerald-500"
                  : progress > 75
                  ? "bg-rose-500"
                  : progress > 40
                  ? "bg-amber-500"
                  : "bg-indigo-500"
              }`}
              style={{ width: `${raidState.isDefeated ? 100 : progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase">
              {t("raid_cumulative_damage", language)}: {raidState.cumulativeDamage.toLocaleString()}
            </span>
            <span className="text-[10px] font-extrabold text-slate-600">
              {progress}%
            </span>
          </div>
        </div>

        {/* Attack Section */}
        {!raidState.isDefeated && isActive && (
          <div className="px-4 pb-4 border-t border-slate-100 pt-4">
            <button
              onClick={handleAttack}
              disabled={attacking || cooldownMs > 0 || !currentUser || currentUser.uid === 'guest-id'}
              className="w-full min-h-12 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md shadow-rose-600/20 cursor-pointer"
            >
              {attacking ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("raid_attacking", language)}
                </>
              ) : cooldownMs > 0 ? (
                <>
                  <Timer size={18} />
                  {t("raid_cooldown", language)} {formatTimeRemaining(cooldownMs)}
                </>
              ) : (
                <>
                  <Swords size={18} />
                  {t("raid_attack_btn", language, { power: userTotalPower * 2 })}
                </>
              )}
            </button>
            <p className="text-[9px] text-slate-400 text-center mt-2 font-medium">
              {t("raid_attack_hint", language)}
            </p>
          </div>
        )}

        {/* Last attack result */}
        {lastResult && (
          <div className="mx-4 mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-800">
              <Zap size={14} className="text-indigo-600" />
              {lastResult.isDefeated
                ? t("raid_boss_defeated_msg", language)
                : t("raid_damage_dealt", language, { damage: lastResult.damageDealt.toLocaleString() })}
            </div>
            {lastResult.isDefeated && (
              <p className="text-[10px] text-indigo-600 mt-1 font-medium">
                {t("raid_victory_desc", language)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Defeated / Reward Section */}
      {raidState.isDefeated && canClaim && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Trophy size={20} className="text-amber-600" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-amber-800">{t("raid_claim_title", language)}</h4>
              <p className="text-[10px] font-medium text-amber-600">{t("raid_claim_desc", language)}</p>
            </div>
          </div>
          <button
            onClick={handleClaimRewards}
            disabled={claiming}
            className="w-full min-h-12 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-amber-950 px-4 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md cursor-pointer"
          >
            {claiming ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Gift size={18} />
            )}
            {t("raid_claim_btn", language)}
          </button>
          {claimResult?.claimed && claimResult.reward && (
            <div className="mt-3 bg-white border border-emerald-200 rounded-lg p-3 text-center">
              <p className="text-xs font-bold text-emerald-700">
                +{claimResult.reward.sns.toLocaleString()} SNS {t("raid_reward_sns", language)}
              </p>
              {claimResult.tierNameKey && (
                <p className="text-[9px] text-emerald-600 font-medium mt-0.5">
                  {t(claimResult.tierNameKey, language)} {t("raid_reward_tier", language)}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contribution Ranking */}
      {ranking.length > 0 && (
        <div className="bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">
              {t("raid_ranking_title", language)}
            </h4>
            <span className="text-[9px] text-slate-400 ml-auto">
              {t("raid_ranking_total_damage", language)}
            </span>
          </div>
          <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
            {ranking.map((contrib, idx) => {
              const isMe = currentUser?.uid === contrib.uid;
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={contrib.uid}
                  className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-indigo-50/40" : ""}`}
                >
                  <div className="w-6 text-center">
                    {idx < 3 ? (
                      <span className="text-sm">{medals[idx]}</span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold truncate ${isMe ? "text-indigo-700" : "text-slate-700"}`}>
                        {contrib.displayName}
                      </span>
                      {isMe && (
                        <span className="bg-indigo-600 text-white text-[7px] font-bold uppercase px-1 py-0.5 rounded">
                          {t("raid_me", language)}
                        </span>
                      )}
                      {contrib.rewardsClaimed && (
                        <Gift size={10} className="text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {t("raid_attacks_count", language, { count: contrib.attackCount })}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-700">
                    {contrib.damage.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
