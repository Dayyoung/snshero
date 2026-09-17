import React, { useState, useEffect } from "react";
import { Shield, Gift, Swords, AlertTriangle, AlertCircle, Sword, HelpCircle, X, ChevronLeft, ChevronRight, Zap, Share2 } from "lucide-react";
import { Language, ViewType, Guild } from "../types";
import { t } from "../lib/i18n";
import { PageHeader } from "../components/PageHeader";
import { getGuild, donateToGuild, getGuildBuff, getRequiredExpForNextLevel, joinGuild } from "../lib/guildHelper";
import { AttackResult } from "../lib/guildHelper";
import { GuildRaidPanel } from "../components/GuildRaidPanel";
import { FriendBattlePanel } from "../components/FriendBattlePanel";
import { GuildContributionTrack } from "../components/GuildContributionTrack";
import { motion, AnimatePresence } from "motion/react";
import { triggerHaptic } from "../lib/haptic";
import { StaminaPacingManager } from "../lib/staminaPacingManager";
import { cn } from "../lib/utils";
import { GuildDailyQuickHub } from "../components/GuildDailyQuickHub";
import { GuildMercenaryModal } from "../components/GuildMercenaryModal";

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

  // SCR-10-01: 일일 길드 미션 진행도 (출석체크, 조각지원, 친선/레이드) & 올클리어 보상 (+50 SNS)
  const [dailyMissionsClaimed, setDailyMissionsClaimed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hero_guild_daily_mission_claimed_${todayStr}_${guildId}`) === 'true';
    } catch {
      return false;
    }
  });
  const [isMercenaryModalOpen, setIsMercenaryModalOpen] = useState(false);
  const [donatedShardToday, setDonatedShardToday] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hero_guild_shard_donated_${todayStr}_${guildId}`) === 'true';
    } catch {
      return false;
    }
  });
  const [friendBattlePlayedToday, setFriendBattlePlayedToday] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hero_guild_friend_battle_${todayStr}`) === 'true';
    } catch {
      return false;
    }
  });

  const missionCompletedCount = (attendedToday ? 1 : 0) + (donatedShardToday ? 1 : 0) + (friendBattlePlayedToday ? 1 : 0);
  const isAllMissionsDone = missionCompletedCount >= 3;

  const handleClaimDailyMissions = () => {
    if (!isAllMissionsDone || dailyMissionsClaimed) return;
    setDailyMissionsClaimed(true);
    try {
      localStorage.setItem(`hero_guild_daily_mission_claimed_${todayStr}_${guildId}`, 'true');
      onUpdateSns(sns + 50);
      triggerHaptic('victory');
    } catch {}
    setAlertMsg(
      language === 'ko'
        ? '🏆 [일일 길드 미션 올클리어] 3개 미션을 완수하여 보너스 +50 SNS를 획득했습니다!'
        : '🏆 Daily Guild Missions All Clear! Earned +50 SNS bonus!'
    );
  };

  const handleAttendGuild = () => {
    if (attendedToday) return;
    setAttendedToday(true);
    const nextStreak = attendanceStreak + 1;
    setAttendanceStreak(nextStreak);
    triggerHaptic('success');
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
    triggerHaptic('victory');
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
        localStorage.setItem(`hero_guild_shard_donated_${todayStr}_${guildId}`, 'true');
        setDonatedShardToday(true);
        onUpdateSns(sns + 25);
      } catch {}
      return next;
    });
    triggerHaptic('success');
    setAlertMsg(
      language === 'ko'
        ? `[조각 지원 완료] 길드원에게 카드 조각을 지원하고 보상 +25 SNS를 획득했습니다!`
        : `Donated card shard to guild member! Earned +25 SNS!`
    );
  };

  // SCR-10-03: 길드 특가 보급소 (25 SNS로 50 AP 즉시 충전)
  const handleBuyGuildApPotion = () => {
    triggerHaptic('tap');
    if (sns < 25) {
      setAlertMsg(
        language === 'ko'
          ? 'SNS 포인트가 부족합니다. 상점으로 이동합니다.'
          : 'Not enough SNS points. Moving to Shop.'
      );
      onNavigate('shop');
      return;
    }
    onUpdateSns(sns - 25);
    try {
      const staminaMgr = StaminaPacingManager.getInstance();
      staminaMgr.gainAp(50);
    } catch {}
    triggerHaptic('victory');
    setAlertMsg(
      language === 'ko'
        ? '🧪 [길드 특가 보급소] 25 SNS로 50 AP를 즉시 충전했습니다!'
        : '🧪 Purchased AP Potion (50 AP) for 25 SNS at Guild Supply!'
    );
  };

  // SCR-10-01: 비동기 친선전 링크 복사 & 친구 초대
  const handleCopyGhostLink = async () => {
    if (!currentUser) return;
    const ghostUrl = `${window.location.origin}${window.location.pathname}?ghost_battle=${encodeURIComponent(currentUser.uid)}&name=${encodeURIComponent(currentUser.displayName)}`;
    try {
      await navigator.clipboard.writeText(ghostUrl);
      triggerHaptic('success');
      setAlertMsg(
        language === 'ko'
          ? '🔗 [비동기 도전장 링크 복사 완료] 내 덱과 1:1 대결할 수 있는 링크가 복사되었습니다! SNS나 메신저에 공유하세요!'
          : '🔗 Ghost Battle link copied to clipboard! Share with friends to challenge your deck!'
      );
    } catch {
      setAlertMsg(ghostUrl);
    }
  };

  // 4대 서브 탭 상태: info(길드정보/기부/멤버), raid(레이드), exchange(조각/승부예측/보급소), friends(친구 친선전)
  const [activeTab, setActiveTab] = useState<'info' | 'raid' | 'exchange' | 'friends'>('info');
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
        <div className="bg-white border border-slate-200/80 rounded-none p-5 mb-4 shadow-sm relative overflow-hidden font-mono">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="w-20 h-20 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-center text-5xl shadow-xs shrink-0">
              {guild.mark}
            </div>

            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row items-center gap-2 mb-1.5 justify-center md:justify-start flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-slate-800">
                  {guild.name}
                </h1>
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black rounded-none">
                  LV.{guild.level}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  ({guild.members.length} MEMBERS)
                </span>
              </div>

              {/* Progress to next level */}
              {guild.level < 10 && (
                <div className="w-full h-2 bg-slate-100 rounded-none overflow-hidden border border-slate-200 mt-2">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${expPercentage}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SCR-10-01: 상단 비동기 도전장 링크 복사 & 친구 초대 배너 */}
        {!isOpponentMode && userGuild?.id === guild.id && (
          <div className="w-full flex flex-col gap-2.5 mb-4 font-mono">
            {/* 1. 비동기 친선 대전 링크 복사 & 친구 초대 1탭 배너 */}
            <div className="w-full rounded-none border-2 border-indigo-500/70 bg-gradient-to-r from-stone-950 via-[#121624] to-indigo-950/70 p-3.5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/30 border border-indigo-400 text-indigo-300 flex items-center justify-center text-xl shrink-0">
                  <Share2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase text-indigo-300 bg-indigo-900/60 border border-indigo-500/40 px-1 py-0.2">
                      GHOST BATTLE
                    </span>
                    <span className="text-xs text-white font-black">
                      {language === 'ko' ? '비동기 친선전 & 친구 초대 링크' : 'Ghost Battle & Friend Invite Link'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300 mt-0.5">
                    {language === 'ko' ? '내 덱과 1:1 대결 가능한 링크 복사! 친구 초대 시 상호 +100 SNS 보너스' : 'Copy link to challenge your deck! Both get +100 SNS bonus'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyGhostLink}
                className="w-full sm:w-auto min-h-[44px] px-3.5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 rounded-none shadow-sm"
              >
                <span>🔗</span>
                <span>{language === 'ko' ? '[도전장 링크 복사]' : '[Copy Battle Link]'}</span>
              </button>
            </div>

            {/* 2. 일일 길드 미션 HUD: 3개 미션 실시간 게이지 */}
            <div className="w-full rounded-none border border-slate-200 bg-white p-3 text-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-indigo-600">📋 {language === 'ko' ? '일일 길드 미션 HUD' : 'Daily Guild Missions'}</span>
                    <span className="text-[11px] text-slate-500 font-bold">
                      {missionCompletedCount}/3 {language === 'ko' ? '완료' : 'Done'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    <span className={attendedToday ? "text-emerald-600" : "text-slate-400"}>
                      {attendedToday ? "✓ 출석" : "○ 출석"}
                    </span>
                    <span>·</span>
                    <span className={donatedShardToday ? "text-emerald-600" : "text-slate-400"}>
                      {donatedShardToday ? "✓ 조각지원" : "○ 조각지원"}
                    </span>
                    <span>·</span>
                    <span className={friendBattlePlayedToday ? "text-emerald-600" : "text-slate-400"}>
                      {friendBattlePlayedToday ? "✓ 친선전" : "○ 친선전"}
                    </span>
                  </div>
                </div>
                {/* Gauge */}
                <div className="w-full h-2 bg-slate-100 rounded-none overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${(missionCompletedCount / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* 올클리어 보너스 수령 버튼 */}
              <button
                type="button"
                disabled={!isAllMissionsDone || dailyMissionsClaimed}
                onClick={handleClaimDailyMissions}
                className={cn(
                  "w-full sm:w-auto min-h-[44px] px-3 py-2 rounded-none font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 border",
                  dailyMissionsClaimed
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : isAllMissionsDone
                    ? "bg-amber-400 hover:bg-amber-300 text-stone-950 border-amber-500 shadow-sm animate-pulse"
                    : "bg-slate-50 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed"
                )}
              >
                <span>🏆</span>
                <span>
                  {dailyMissionsClaimed
                    ? (language === 'ko' ? '[수령 완료]' : '[Claimed]')
                    : (language === 'ko' ? '[올클리어 보너스 +50 SNS]' : '[All Clear +50 SNS]')}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* SCR-10-02: 4대 모바일 서브 탭바 (내 길드일 때 표시) */}
        {!isOpponentMode && userGuild?.id === guild.id && (
          <div className="grid grid-cols-4 gap-1 mb-4 bg-slate-100 p-1 rounded-none border border-slate-200 font-mono text-xs">
            {[
              { id: 'info', icon: '🛡️', labelKo: '길드 정보', labelEn: 'Info' },
              { id: 'raid', icon: '⚔️', labelKo: '길드 레이드', labelEn: 'Raid' },
              { id: 'exchange', icon: '🧩', labelKo: '조각·승부', labelEn: 'Exchange' },
              { id: 'friends', icon: '👥', labelKo: '친구 친선전', labelEn: 'Friends' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic('tap');
                    setActiveTab(tab.id as any);
                  }}
                  className={cn(
                    "min-h-[44px] py-2 px-1 rounded-none font-bold text-[11px] sm:text-xs transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer",
                    active
                      ? "bg-slate-900 text-white font-black shadow-xs"
                      : "bg-transparent text-slate-600 hover:bg-slate-200/70"
                  )}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span className="truncate">{language === 'ko' ? tab.labelKo : tab.labelEn}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 1: 길드 정보 (info) */}
        {(!userGuild || isOpponentMode || activeTab === 'info') && (
          <div className="space-y-4 font-mono">
            {/* SCR-10-05: 길드 올인원 원터치 스마트 허브 */}
            {!isOpponentMode && userGuild?.id === guild.id && (
              <GuildDailyQuickHub
                language={language}
                attendedToday={attendedToday}
                onAttend={handleAttendGuild}
                onDonate={handleDonate}
                snsBalance={sns}
              />
            )}

            {/* SCR-10-06: 길드 에이스 카드 용병 대여소 배너 버튼 */}
            {!isOpponentMode && userGuild?.id === guild.id && (
              <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/40 rounded-none text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚔️</span>
                  <div>
                    <span className="font-bold text-amber-900 dark:text-amber-300">
                      {language === 'ko' ? '[길드 에이스 카드 용병 대여소]' : '[Guild Ace Mercenary Post]'}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {language === 'ko' ? '길드원 대표 에이스 카드를 대여하여 타워/던전 전투력 +15% 증폭' : 'Rent top guildmate\'s ace card for +15% combat power'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsMercenaryModalOpen(true);
                  }}
                  className="min-h-[44px] px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-wider rounded-none cursor-pointer shadow-xs active:scale-95"
                >
                  {language === 'ko' ? '[용병 고용하기]' : '[Hire Mercenary]'}
                </button>
              </div>
            )}

            {/* ID 580: 길드 출석 보너스 & 연속 출석 버프 HUD */}
            {!isOpponentMode && userGuild?.id === guild.id && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-300 rounded-none text-xs shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">📅</span>
                  <div>
                    <div className="font-black text-emerald-900">
                      {language === 'ko' ? `[길드 출석 버프] 연속 ${attendanceStreak}일 출석 중!` : `Guild Streak: Day ${attendanceStreak}`}
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      {language === 'ko' ? '⚡ 전체 길드원 AP 자연 회복 속도 +10% 가속 적용 중' : '⚡ +10% Guild-wide AP Recovery Active'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={attendedToday}
                  onClick={handleAttendGuild}
                  className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-black transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {attendedToday
                    ? (language === 'ko' ? '오늘 출석 완료' : 'Attended Today')
                    : (language === 'ko' ? '[ 일일 출석체크 (+50 SNS) ]' : '[ Check Attendance (+50 SNS) ]')}
                </button>
              </div>
            )}

            {/* ID 550: 길드 명예의 전당 시즌 MVP 3인 뱃지 배너 */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { role: language === 'ko' ? '👑 공격왕' : '👑 War MVP', name: guild.members[0]?.displayName || 'Ace Hunter', score: '38W 4L' },
                { role: language === 'ko' ? '💰 기부왕' : '💰 Top Donor', name: guild.members[1]?.displayName || 'Gold Dragon', score: '25,000 SNS' },
                { role: language === 'ko' ? '⚔️ 레이드왕' : '⚔️ Raid Titan', name: guild.members[2]?.displayName || 'Raid Slayer', score: '184K DMG' },
              ].map((mvp, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-none p-2.5 text-center shadow-xs">
                  <div className="text-[10px] font-black text-amber-600 uppercase">{mvp.role}</div>
                  <div className="font-bold text-slate-800 truncate text-xs mt-0.5">{mvp.name}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{mvp.score}</div>
                </div>
              ))}
            </div>

            {/* Battle Effects Card */}
            <div className="bg-white border border-slate-200 rounded-none p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GUILD BUFF STATUS</span>
                  <div className="text-sm font-black text-indigo-700 mt-0.5">
                    {t("guild_current_bonus_value", language, { power: currentBuff.powerPercent, stat: currentBuff.statBonus })}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-none bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xl">
                  ⚔️
                </div>
              </div>
            </div>

            {/* Actions Section: 기부 또는 공격 */}
            {isOpponentMode ? (
              <div className="bg-rose-50/40 border border-rose-200 rounded-none p-5 text-center shadow-sm">
                <button
                  onClick={handleAttack}
                  disabled={isFighting}
                  className="w-full min-h-[48px] bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-none font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  <Swords size={18} />
                  {isFighting ? t("guild_attack_in_progress", language) : t("guild_attack_start", language)}
                </button>
              </div>
            ) : userGuild?.id === guild.id ? (
              <div className="bg-white border border-slate-200 rounded-none p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 font-black text-xs text-slate-800">
                    <Gift size={15} className="text-indigo-600" />
                    <span>{language === 'ko' ? '길드 기부 & 경험치 기여' : 'Guild Donation'}</span>
                  </div>
                  {/* 상점 바로가기 숏컷 */}
                  <button
                    type="button"
                    onClick={() => onNavigate('shop')}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    🛒 {language === 'ko' ? 'SNS 코인 충전' : 'Get SNS Coins'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[500, 1000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDonateAmount(amt)}
                      className={cn(
                        "min-h-[44px] px-2 py-2 rounded-none border text-xs font-black transition-all cursor-pointer whitespace-nowrap",
                        donateAmount === amt
                          ? "border-indigo-700 bg-indigo-600 text-white shadow-xs"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                      )}
                    >
                      {amt.toLocaleString()} SNS
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleDonate}
                  disabled={sns < donateAmount}
                  className="w-full min-h-[46px] bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-none font-black uppercase tracking-wide text-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                >
                  <Gift size={16} />
                  {t("guild_donate_btn", language, { amount: donateAmount.toLocaleString() })}
                </button>
              </div>
            ) : !userGuild ? (
              <div className="bg-amber-50 border border-amber-200 rounded-none p-5 text-center shadow-sm">
                <button
                  onClick={handleJoinGuild}
                  className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-stone-950 py-3.5 rounded-none font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm cursor-pointer"
                >
                  <Shield size={18} />
                  {t("guild_join", language)}
                </button>
              </div>
            ) : null}

            {/* Member List & 용병 대여 */}
            <div className="bg-white border border-slate-200 rounded-none p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="font-black text-xs text-slate-800">
                  {language === 'ko' ? `길드원 목록 (${guild.members.length}명)` : `Guild Members (${guild.members.length})`}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {language === 'ko' ? '시그니처 카드 용병 대여 (20 SNS)' : 'Mercenary Card Hire (20 SNS)'}
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                {guild.members.map((member) => (
                  <div key={member.uid} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-none bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs uppercase text-slate-600">
                        {member.displayName.substring(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800">
                          {member.displayName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {currentUser?.uid === member.uid ? (language === 'ko' ? '[나]' : '[You]') : 'Level 10+'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!isOpponentMode && userGuild?.id === guild.id && currentUser?.uid !== member.uid && (
                        <button
                          type="button"
                          disabled={borrowedMercenary === member.displayName}
                          onClick={() => handleBorrowMercenary(member.uid, member.displayName)}
                          className="min-h-[36px] px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-bold rounded-none transition-all cursor-pointer flex items-center gap-1 disabled:opacity-40"
                          title="일일 1회 용병 시그니처 카드 대여 (20 SNS)"
                        >
                          <span>🤝</span>
                          <span>{borrowedMercenary === member.displayName ? (language === 'ko' ? '대여중' : 'Hired') : (language === 'ko' ? '용병 대여' : 'Hire')}</span>
                        </button>
                      )}
                      {isOpponentMode && currentUser?.uid !== member.uid && (
                        <button
                          onClick={() => onAttackMember?.(member.uid, member.displayName)}
                          className="min-h-[36px] px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-none active:scale-98 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
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

            {/* ID 455: 주간 길드 기여도 마일스톤 트랙 */}
            {!isOpponentMode && userGuild?.id === guild.id && (
              <GuildContributionTrack
                language={language}
                onClaimReward={(_tier, type, amt) => {
                  if (type === 'sns') onUpdateSns(sns + amt);
                }}
              />
            )}
          </div>
        )}

        {/* TAB 2: 길드 레이드 (raid) */}
        {!isOpponentMode && userGuild?.id === guild.id && activeTab === 'raid' && (
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
        )}

        {/* TAB 3: 조각 & 승부예측 & 보급소 (exchange) */}
        {!isOpponentMode && userGuild?.id === guild.id && activeTab === 'exchange' && (
          <div className="space-y-4 font-mono">
            {/* SCR-10-03: 길드 특가 보급소 (Guild Supply Depot) */}
            <div className="bg-[#111827] border border-slate-800 p-4 rounded-none text-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <h3 className="text-xs font-black text-amber-400">
                      {language === 'ko' ? '길드 특가 보급소 (Guild Supply Depot)' : 'Guild Supply Depot'}
                    </h3>
                    <p className="text-[10px] text-stone-400">
                      {language === 'ko' ? '길드원 전용 50% 할인 AP 물약 & 보급품' : '50% Off AP Potions & Guild Supplies'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 border border-emerald-500/40 px-1.5 py-0.5">
                  50% SALE
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-xl text-emerald-400">
                    <Zap size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">
                      {language === 'ko' ? '길드 전술 AP 물약 (+50 AP)' : 'Guild Tactical AP Potion (+50 AP)'}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {language === 'ko' ? '레이드 & 친선전 즉시 투입 가능' : 'Immediate replenishment for battle'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBuyGuildApPotion}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                >
                  <span className="text-sm">🧪</span>
                  <span>{language === 'ko' ? '25 SNS로 충전 (+50 AP)' : 'Buy for 25 SNS (+50 AP)'}</span>
                </button>
              </div>
            </div>

            {/* ID 570: 길드 카드 조각 상호 기부 & 요청 시스템 */}
            <div className="bg-white border border-slate-200 rounded-none p-4 text-xs shadow-xs">
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
                    triggerHaptic('tap');
                    setAlertMsg(
                      language === 'ko'
                        ? '[조각 요청 등록] 길드원들에게 카드 조각 요청을 등록했습니다!'
                        : 'Card shard request posted to guild!'
                    );
                  }}
                  className="min-h-[36px] px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-none text-[11px] font-black cursor-pointer transition-colors"
                >
                  {language === 'ko' ? '+ 새 조각 요청' : '+ Request Shard'}
                </button>
              </div>

              <div className="space-y-2">
                {shardRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-none">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-700 font-black flex items-center justify-center rounded-none text-xs">
                        #{req.cardId}
                      </div>
                      <div>
                        <div className="font-black text-slate-800">{req.requesterName}</div>
                        <div className="text-[10px] text-slate-400">
                          {language === 'ko' ? `지원 현황: ${req.count}/5개` : `Progress: ${req.count}/5`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDonateShard(req.id, req.cardId)}
                      className="min-h-[36px] px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-none text-xs cursor-pointer transition-colors"
                    >
                      {language === 'ko' ? '조각 지원 (+25 SNS)' : 'Donate (+25 SNS)'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ID 500: 길드전 일일 3개 매치업 실시간 승부 예측 & 배당금 */}
            <div className="bg-white border border-slate-200 rounded-none p-4 text-xs shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-1.5 font-black text-slate-800">
                  <span>⚔️</span>
                  <span>{language === 'ko' ? '길드전 일일 승부 예측 & 적중 배당' : 'Guild War Matchups'}</span>
                </div>
                <span className="text-[10px] text-amber-600 font-black bg-amber-50 border border-amber-200 px-1.5 py-0.5">
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
                    <div key={match.matchId} className="p-2.5 bg-slate-50 border border-slate-200 rounded-none space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-400 font-black">
                        <span>MATCH #{match.matchId}</span>
                        <span>{myPick ? (language === 'ko' ? `예측 완료: [${myPick}]` : `Picked: [${myPick}]`) : (language === 'ko' ? '예측 가능' : 'Open')}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const next = { ...guildBets, [match.matchId]: match.teamA };
                            setGuildBets(next);
                            triggerHaptic('success');
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
                          className={cn(
                            "flex-1 min-h-[40px] py-1.5 px-2.5 rounded-none border text-xs font-black transition-all cursor-pointer flex justify-between items-center",
                            myPick === match.teamA
                              ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                          )}
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
                            triggerHaptic('success');
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
                          className={cn(
                            "flex-1 min-h-[40px] py-1.5 px-2.5 rounded-none border text-xs font-black transition-all cursor-pointer flex justify-between items-center",
                            myPick === match.teamB
                              ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                          )}
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
          </div>
        )}

        {/* TAB 4: 친구 친선전 (friends) */}
        {!isOpponentMode && userGuild?.id === guild.id && activeTab === 'friends' && (
          <div className="font-mono">
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

      {/* SCR-10-06: Guild Ace Mercenary Modal */}
      <GuildMercenaryModal
        isOpen={isMercenaryModalOpen}
        onClose={() => setIsMercenaryModalOpen(false)}
        language={language}
        onRentMercenary={(owner, card) => {
          setIsMercenaryModalOpen(false);
          setAlertMsg(
            language === 'ko'
              ? `⚔️ ${owner} 길드원의 '${card}' 카드를 용병으로 영입했습니다! (타워/던전 전투력 +15% 버프 적용)`
              : `⚔️ Hired ${owner}'s '${card}' as a mercenary! (+15% combat boost)`
          );
        }}
      />
      </div>
    </div>
  );
};
