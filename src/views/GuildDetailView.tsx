import React, { useState, useEffect } from "react";
import { Shield, Gift, Swords, AlertTriangle, AlertCircle, Sword, HelpCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Language, ViewType, Guild } from "../types";
import { t } from "../lib/i18n";
import { PageHeader } from "../components/PageHeader";
import { getGuild, donateToGuild, getGuildBuff, getRequiredExpForNextLevel, joinGuild } from "../lib/guildHelper";
import { AttackResult } from "../lib/guildHelper";
import { GuildRaidPanel } from "../components/GuildRaidPanel";
import { FriendBattlePanel } from "../components/FriendBattlePanel";
import { GuildContributionTrack } from "../components/GuildContributionTrack";
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

  // ID 500: 길드전 일일 승부 예측
  const todayStr = new Date().toISOString().slice(0, 10);
  const [guildBets, setGuildBets] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem(`hero_guild_war_bets_${todayStr}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // ID 510: 길드원 용병 일일 1회 대여
  const [borrowedMercenary, setBorrowedMercenary] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`hero_guild_mercenary_borrowed_${todayStr}`);
    } catch {
      return null;
    }
  });

  // ID 570: 카드 조각 요청 목록
  const [shardRequests, setShardRequests] = useState<Array<{ id: string; cardId: number; requesterName: string; count: number }>>(() => {
    try {
      const saved = localStorage.getItem(`hero_guild_piece_requests_${guildId}`);
      return saved ? JSON.parse(saved) : [
        { id: 'req-1', cardId: 10, requesterName: 'Hunter_Ace', count: 3 },
        { id: 'req-2', cardId: 25, requesterName: 'ShadowBlade', count: 1 }
      ];
    } catch {
      return [];
    }
  });

  // ID 580: 연속 출석 버프
  const [attendanceStreak, setAttendanceStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`hero_guild_attendance_streak_${guildId}`);
      return saved ? Number(saved) : 5;
    } catch {
      return 5;
    }
  });
  const [attendedToday, setAttendedToday] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hero_guild_attended_${todayStr}_${guildId}`) === 'true';
    } catch {
      return false;
    }
  });

  const handleAttendGuild = () => {
    if (attendedToday) return;
    setAttendedToday(true);
    const nextStreak = attendanceStreak + 1;
    setAttendanceStreak(nextStreak);
    try {
      localStorage.setItem(`hero_guild_attended_${todayStr}_${guildId}`, 'true');
      localStorage.setItem(`hero_guild_attendance_streak_${guildId}`, String(nextStreak));
      onUpdateSns(sns + 50);
    } catch {}
    setAlertMsg(
      language === 'ko'
        ? `[길드 일일 출석 완료] 연속 ${nextStreak}일 출석 달성! +50 SNS 지급 및 전체 길드원 AP 자연 회복 +10% 버프가 활성화되었습니다!`
        : `Guild Attendance Checked! ${nextStreak}-day streak! +50 SNS and +10% AP Regen buff active!`
    );
  };

  const handleBorrowMercenary = (memberUid: string, memberName: string) => {
    if (borrowedMercenary) {
      setAlertMsg(
        language === 'ko'
          ? `이미 오늘 용병(${borrowedMercenary})을 대여했습니다. (일일 1회 제한)`
          : `You have already hired a mercenary today.`
      );
      return;
    }
    setBorrowedMercenary(memberName);
    try {
      localStorage.setItem(`hero_guild_mercenary_borrowed_${todayStr}`, memberName);
      onUpdateSns(sns - 20);
    } catch {}
    setAlertMsg(
      language === 'ko'
        ? `[용병 대여 완료] ${memberName}님의 시그니처 카드를 오늘 하루 배틀에서 자유롭게 사용할 수 있습니다!`
        : `Hired ${memberName}'s signature card for battle today!`
    );
  };

  const handleDonateShard = (reqId: string, cardId: number) => {
    setShardRequests((prev) => {
      const next = prev.map((item) => (item.id === reqId ? { ...item, count: item.count + 1 } : item));
      try {
        localStorage.setItem(`hero_guild_piece_requests_${guildId}`, JSON.stringify(next));
        onUpdateSns(sns + 25);
      } catch {}
      return next;
    });
    setAlertMsg(
      language === 'ko'
        ? `[조각 지원 완료] 길드원에게 카드 조각을 지원하고 보상 +25 SNS를 획득했습니다!`
        : `Donated card shard to guild member! Earned +25 SNS!`
    );
  };

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

    // ID 585: 24시간 재가입 쿨다운 체크
    try {
      const cooldownStr = localStorage.getItem('hero_guild_leave_cooldown');
      if (cooldownStr) {
        const cd = Number(cooldownStr);
        if (Date.now() < cd) {
          const remainingHours = Math.ceil((cd - Date.now()) / (3600 * 1000));
          setAlertMsg(
            language === 'ko'
              ? `[가입 제한] 길드 탈퇴 후 24시간 동안 재가입이 제한됩니다. (잔여 시간: 약 ${remainingHours}시간)`
              : `Cooldown active: you must wait 24h after leaving a guild. (${remainingHours}h remaining)`
          );
          return;
        }
      }
    } catch {}

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

        {/* ID 580: 길드 출석 보너스 & 연속 출석 버프 HUD */}
        {!isOpponentMode && userGuild?.id === guild.id && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 mb-4 bg-emerald-50 border border-emerald-300 rounded-2xl font-mono text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <div>
                <div className="font-black text-emerald-900">
                  {language === 'ko' ? `[길드 출석 버프] 연속 ${attendanceStreak}일 출석 중!` : `Guild Streak: Day ${attendanceStreak}`}
                </div>
                <div className="text-[10px] text-emerald-700">
                  {language === 'ko' ? '⚡ 전체 길드원 AP 자연 회복 속도 +10% 가속 적용 중' : '⚡ +10% Guild-wide AP Natural Recovery Active'}
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={attendedToday}
              onClick={handleAttendGuild}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {attendedToday
                ? (language === 'ko' ? '오늘 출석 완료' : 'Attended Today')
                : (language === 'ko' ? '[ 일일 출석체크 (+50 SNS) ]' : '[ Check Attendance (+50 SNS) ]')}
            </button>
          </div>
        )}

        {/* ID 550: 길드 명예의 전당 시즌 MVP 3인 뱃지 배너 */}
        <div className="grid grid-cols-3 gap-2 mb-4 font-mono text-xs">
          {[
            { role: language === 'ko' ? '👑 공격왕' : '👑 War MVP', name: guild.members[0]?.displayName || 'Ace Hunter', score: '38W 4L' },
            { role: language === 'ko' ? '💰 기부왕' : '💰 Top Donor', name: guild.members[1]?.displayName || 'Gold Dragon', score: '25,000 SNS' },
            { role: language === 'ko' ? '⚔️ 레이드왕' : '⚔️ Raid Titan', name: guild.members[2]?.displayName || 'Raid Slayer', score: '184K DMG' },
          ].map((mvp, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-2.5 text-center shadow-sm">
              <div className="text-[10px] font-bold text-amber-600 uppercase">{mvp.role}</div>
              <div className="font-black text-slate-800 truncate text-xs mt-0.5">{mvp.name}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{mvp.score}</div>
            </div>
          ))}
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
        {/* ID 455: 주간 길드 기여도 마일스톤 트랙 */}
        {!isOpponentMode && userGuild?.id === guild.id && (
          <div className="mb-6">
            <GuildContributionTrack
              language={language}
              onClaimReward={(_tier, type, amt) => {
                if (type === 'sns') onUpdateSns(sns + amt);
              }}
            />
          </div>
        )}

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
                  {/* ID 510: 길드원 용병 일일 1회 대여 */}
                  {!isOpponentMode && userGuild?.id === guild.id && currentUser?.uid !== member.uid && (
                    <button
                      type="button"
                      disabled={borrowedMercenary === member.displayName}
                      onClick={() => handleBorrowMercenary(member.uid, member.displayName)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 disabled:opacity-40"
                      title={language === 'ko' ? '일일 1회 용병 시그니처 카드 대여 (20 SNS)' : 'Hire Mercenary Card (20 SNS)'}
                    >
                      <span>🤝</span>
                      <span>{borrowedMercenary === member.displayName ? (language === 'ko' ? '대여중' : 'Hired') : (language === 'ko' ? '용병 대여' : 'Hire')}</span>
                    </button>
                  )}
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
            <>
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

            {/* ID 570: 길드 카드 조각 상호 기부 & 요청 시스템 */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mt-4 font-mono text-xs shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-1.5 font-black text-slate-800">
                  <span>🧩</span>
                  <span>{language === 'ko' ? '길드 카드 조각 교환소 (Piece Request)' : 'Card Shard Exchange'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newReq = {
                      id: `req-${Date.now()}`,
                      cardId: Math.floor(Math.random() * 50) + 1,
                      requesterName: currentUser?.displayName || 'Me',
                      count: 0,
                    };
                    setShardRequests((prev) => [newReq, ...prev]);
                    setAlertMsg(
                      language === 'ko'
                        ? '[조각 요청 등록] 길드원들에게 카드 조각 요청을 등록했습니다!'
                        : 'Card shard request posted to guild!'
                    );
                  }}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                >
                  {language === 'ko' ? '+ 새 조각 요청' : '+ Request Shard'}
                </button>
              </div>

              <div className="space-y-2">
                {shardRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center rounded text-[11px]">
                        #{req.cardId}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{req.requesterName}</div>
                        <div className="text-[10px] text-slate-400">
                          {language === 'ko' ? `지원 현황: ${req.count}/5개` : `Progress: ${req.count}/5`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDonateShard(req.id, req.cardId)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] cursor-pointer transition-colors"
                    >
                      {language === 'ko' ? '조각 지원 (+25 SNS)' : 'Donate (+25 SNS)'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ID 500: 길드전 일일 3개 매치업 실시간 승부 예측 & 배당금 */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mt-4 font-mono text-xs shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-1.5 font-black text-slate-800">
                  <span>⚔️</span>
                  <span>{language === 'ko' ? '길드전 일일 승부 예측 & 적중 배당 (Guild War Matchups)' : 'Guild War Predictions'}</span>
                </div>
                <span className="text-[10px] text-amber-600 font-bold">
                  {language === 'ko' ? '적중 시 2.5배 배당' : '2.5x Payout'}
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { matchId: 1, teamA: 'Dragon_Slayers', teamB: 'Shadow_Legion', oddsA: 1.8, oddsB: 2.1 },
                  { matchId: 2, teamA: 'Titan_Alliance', teamB: 'Phoenix_Reborn', oddsA: 2.4, oddsB: 1.6 },
                  { matchId: 3, teamA: 'Cyber_Knights', teamB: 'Mystic_Echo', oddsA: 1.9, oddsB: 1.9 },
                ].map((match) => {
                  const myPick = guildBets[match.matchId];
                  return (
                    <div key={match.matchId} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>MATCH #{match.matchId}</span>
                        <span>{myPick ? (language === 'ko' ? `예측 완료: [${myPick}]` : `Picked: [${myPick}]`) : (language === 'ko' ? '예측 투표 가능' : 'Open')}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const next = { ...guildBets, [match.matchId]: match.teamA };
                            setGuildBets(next);
                            try {
                              localStorage.setItem(`hero_guild_war_bets_${todayStr}`, JSON.stringify(next));
                              onUpdateSns(sns + 10);
                            } catch {}
                            setAlertMsg(
                              language === 'ko'
                                ? `[승부 예측 완료] ${match.teamA} 승리에 50 SNS 베팅 완료! (적중 시 배당 지급)`
                                : `Predicted ${match.teamA} victory! (+10 SNS participation bonus)`
                            );
                          }}
                          className={`flex-1 py-1.5 px-2 rounded border text-[11px] font-bold transition-all cursor-pointer flex justify-between items-center ${
                            myPick === match.teamA ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{match.teamA}</span>
                          <span className="text-[10px] opacity-80">{match.oddsA}x</span>
                        </button>
                        <span className="self-center text-slate-400 font-black text-xs">VS</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = { ...guildBets, [match.matchId]: match.teamB };
                            setGuildBets(next);
                            try {
                              localStorage.setItem(`hero_guild_war_bets_${todayStr}`, JSON.stringify(next));
                              onUpdateSns(sns + 10);
                            } catch {}
                            setAlertMsg(
                              language === 'ko'
                                ? `[승부 예측 완료] ${match.teamB} 승리에 50 SNS 베팅 완료! (적중 시 배당 지급)`
                                : `Predicted ${match.teamB} victory! (+10 SNS participation bonus)`
                            );
                          }}
                          className={`flex-1 py-1.5 px-2 rounded border text-[11px] font-bold transition-all cursor-pointer flex justify-between items-center ${
                            myPick === match.teamB ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{match.teamB}</span>
                          <span className="text-[10px] opacity-80">{match.oddsB}x</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </>
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
