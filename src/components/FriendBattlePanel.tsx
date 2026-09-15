import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Swords,
  UserPlus,
  Check,
  X,
  Clock,
  MessageCircle,
  Gift,
  Search,
  AlertCircle,
  Zap,
  Share2,
} from "lucide-react";
import { Language, FriendEntry, FriendBattleRequest, Guild } from "../types";
import { t } from "../lib/i18n";
import {
  getFriends,
  addFriend,
  removeFriend,
  getFriendSuggestionsFromGuild,
  sendFriendBattleRequest,
  getPendingBattleRequests,
  getSentBattleRequests,
  acceptBattleRequest,
  declineBattleRequest,
  claimBattleReward,
} from "../lib/friendBattleHelper";

interface FriendBattlePanelProps {
  language: Language;
  currentUser: { uid: string; displayName: string } | null;
  userGuild: Guild | null;
  onStartBattle: (
    opponentUid: string,
    opponentName: string,
    battleRequestId?: string,
  ) => void;
  onUpdateSns: (delta: number) => void;
}

export const FriendBattlePanel: React.FC<FriendBattlePanelProps> = ({
  language,
  currentUser,
  userGuild,
  onStartBattle,
  onUpdateSns,
}) => {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [suggestions, setSuggestions] = useState<FriendEntry[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendBattleRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendBattleRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "suggestions">("friends");

  // ID 505: 1탭 일괄 우정 포인트(Friendship AP) 선물 & 답례
  const todayStr = new Date().toISOString().slice(0, 10);
  const [apSentToday, setApSentToday] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hero_friend_ap_sent_${todayStr}`) === 'true';
    } catch {
      return false;
    }
  });

  const handleSendAllAp = () => {
    if (friends.length === 0 || apSentToday) return;
    setApSentToday(true);
    try {
      localStorage.setItem(`hero_friend_ap_sent_${todayStr}`, 'true');
      onUpdateSns(friends.length * 5);
    } catch {}
    setAlertMsg(
      language === 'ko'
        ? `[우정 선물 완료] 친구 ${friends.length}명 전원에게 우정 하트를 발송하고, 답례 포인트 +${friends.length * 5} SNS를 획득했습니다!`
        : `Sent Friendship Hearts to all ${friends.length} friends! Earned +${friends.length * 5} SNS!`
    );
  };

  // ID 525: 비동기 도전장(Ghost Battle Request) 링크 복사
  const handleCopyGhostBattleLink = async () => {
    if (!currentUser) return;
    const ghostUrl = `${window.location.origin}${window.location.pathname}?ghost_battle=${encodeURIComponent(currentUser.uid)}&name=${encodeURIComponent(currentUser.displayName)}`;
    try {
      await navigator.clipboard.writeText(ghostUrl);
      setAlertMsg(
        language === 'ko'
          ? `[도전장 링크 복사] 비동기 대전 링크가 클립보드에 복사되었습니다! SNS나 메신저에 공유하세요!`
          : `Ghost Battle link copied to clipboard! Share it on social channels!`
      );
    } catch {
      setAlertMsg(ghostUrl);
    }
  };

  // ID 565: 친구 목록 정렬 (최근 활동순, 이름순, 대전 횟수순)
  const [friendSortBy, setFriendSortBy] = useState<'recent' | 'name' | 'battles'>('recent');

  // ID 530: 친선전 룰셋 커스텀 모달
  const [customRuleModalFriend, setCustomRuleModalFriend] = useState<FriendEntry | null>(null);
  const [ruleTurnTime, setRuleTurnTime] = useState<15 | 30>(30);
  const [ruleNoDupes, setRuleNoDupes] = useState<boolean>(false);
  const [ruleMaxCost, setRuleMaxCost] = useState<20 | 99>(99);

  const loadData = useCallback(() => {
    if (!currentUser || currentUser.uid === "guest-id") {
      setFriends([]);
      setSuggestions([]);
      setPendingRequests([]);
      setSentRequests([]);
      return;
    }

    setFriends(getFriends());

    if (userGuild) {
      setSuggestions(getFriendSuggestionsFromGuild(userGuild.members, currentUser.uid));
    } else {
      setSuggestions([]);
    }

    setPendingRequests(getPendingBattleRequests(currentUser.uid));
    setSentRequests(getSentBattleRequests(currentUser.uid));
  }, [currentUser, userGuild]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentUser && currentUser.uid !== "guest-id") {
        loadData();
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [currentUser, loadData]);

  const handleAddFriend = (entry: FriendEntry) => {
    if (!currentUser) return;
    addFriend({
      uid: entry.uid,
      displayName: entry.displayName,
      photoURL: entry.photoURL,
    });
    setAlertMsg(t("friend_added", language, { name: entry.displayName }));
    loadData();
  };

  const handleRemoveFriend = (uid: string) => {
    removeFriend(uid);
    setAlertMsg(t("friend_removed", language));
    loadData();
  };

  const handleShareInvite = async () => {
    if (!currentUser || typeof window === "undefined") return;

    const inviteUrl = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(currentUser.uid)}`;
    const inviteText = t("friend_share_invite_hint", language, {
      name: currentUser.displayName,
      url: inviteUrl,
    });

    try {
      if (navigator.share) {
        await navigator.share({
          title: t("friend_share_invite", language),
          text: inviteText,
          url: inviteUrl,
        });
        setAlertMsg(t("friend_share_invite_sent", language));
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
        setAlertMsg(t("friend_share_invite_copied", language));
        return;
      }

      setAlertMsg(inviteUrl);
    } catch (err: unknown) {
      setAlertMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSendBattleRequest = (friend: FriendEntry) => {
    if (!currentUser) return;

    try {
      sendFriendBattleRequest(
        currentUser.uid,
        currentUser.displayName,
        friend.uid,
        friend.displayName,
      );
      setAlertMsg(t("friend_battle_request_sent", language, { name: friend.displayName }));
      loadData();
    } catch (err: unknown) {
      setAlertMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAcceptRequest = (request: FriendBattleRequest) => {
    const accepted = acceptBattleRequest(request.id);
    if (!accepted) {
      setAlertMsg(t("friend_battle_request_expired", language));
      loadData();
      return;
    }

    setAlertMsg(t("friend_battle_accepted", language, { name: request.fromName }));
    onStartBattle(request.fromUid, request.fromName, request.id);
    loadData();
  };

  const handleDeclineRequest = (requestId: string) => {
    declineBattleRequest(requestId);
    loadData();
  };

  const handleClaimReward = (requestId: string) => {
    const result = claimBattleReward(requestId);
    if (!result) return;
    onUpdateSns(100);
    setAlertMsg(t("friend_battle_reward_claimed", language));
    loadData();
  };

  const filteredFriends = friends
    .filter((friend) =>
      friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (friendSortBy === 'recent') {
        const timeA = a.lastActiveAt || a.lastBattleAt || 0;
        const timeB = b.lastActiveAt || b.lastBattleAt || 0;
        return timeB - timeA;
      }
      if (friendSortBy === 'battles') {
        return (b.battleCount || 0) - (a.battleCount || 0);
      }
      return a.displayName.localeCompare(b.displayName);
    });

  if (!currentUser || currentUser.uid === "guest-id") {
    return (
      <div className="bg-white border border-slate-200/70 rounded-xl p-8 text-center">
        <Users size={40} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          {t("friend_battle_login_required", language)}
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          {t("friend_battle_login_hint", language)}
        </p>
      </div>
    );
  }

  const pendingCount = pendingRequests.length;
  const pendingSentRequests = sentRequests.filter((request) => request.status === "pending");
  const completedSentRequests = sentRequests.filter((request) => request.status === "completed");

  return (
    <div className="space-y-4 font-mono">
      {alertMsg && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* ID 505 / ID 525: 상단 우정 포인트 일괄 선물 & 비동기 도전장 생성 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={apSentToday || friends.length === 0}
            onClick={handleSendAllAp}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Gift size={13} />
            <span>
              {apSentToday
                ? (language === 'ko' ? '오늘 하트 선물 완료' : 'AP Sent Today')
                : (language === 'ko' ? `[ 🎁 일괄 우정 선물 (+5 AP) ]` : `[ 🎁 Send All AP ]`)}
            </span>
          </button>
          <button
            type="button"
            onClick={handleCopyGhostBattleLink}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title={language === 'ko' ? '비동기 도전장 링크 생성' : 'Ghost Battle Link'}
          >
            <Share2 size={13} className="text-indigo-600" />
            <span className="hidden sm:inline">{language === 'ko' ? '도전장 링크' : 'Ghost Battle'}</span>
          </button>
        </div>

        {/* ID 565: 정렬 필터 */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="text-[10px] text-slate-400 font-bold uppercase">{language === 'ko' ? '정렬' : 'Sort'}:</span>
          <select
            value={friendSortBy}
            onChange={(e) => setFriendSortBy(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
          >
            <option value="recent">{language === 'ko' ? '최근 접속순' : 'Recent'}</option>
            <option value="battles">{language === 'ko' ? '대전 횟수순' : 'Battles'}</option>
            <option value="name">{language === 'ko' ? '이름순' : 'Name'}</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 bg-slate-100/80 rounded-xl p-1.5">
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "friends" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users size={14} />
          {t("friend_tab_list", language)} ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "requests" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Swords size={14} />
          {t("friend_tab_requests", language)}
          {pendingCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "suggestions" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <UserPlus size={14} />
          {t("friend_tab_suggestions", language)}
        </button>
      </div>

      {activeTab === "friends" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t("friend_search", language)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200/80 rounded-lg text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/15 focus:border-indigo-600 shadow-sm"
            />
          </div>

          {friends.length === 0 ? (
            <div className="bg-white border border-slate-200/70 rounded-xl p-8 text-center">
              <Users size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-500">{t("friend_no_friends", language)}</p>
              <p className="text-[10px] text-slate-400 mt-1">{t("friend_no_friends_hint", language)}</p>
              <button
                onClick={handleShareInvite}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm cursor-pointer"
              >
                <Share2 size={14} />
                {t("friend_share_invite", language)}
              </button>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="bg-white border border-slate-200/70 rounded-xl p-8 text-center">
              <p className="text-sm font-bold text-slate-500">{t("friend_search_no_results", language)}</p>
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <FriendCard
                key={friend.uid}
                friend={friend}
                language={language}
                currentUid={currentUser?.uid || ''}
                onBattle={() => handleSendBattleRequest(friend)}
                onPracticeAi={() => {
                  onStartBattle(friend.uid, `${friend.displayName} (AI Practice)`);
                }}
                onOpenRules={() => setCustomRuleModalFriend(friend)}
                onRemove={() => handleRemoveFriend(friend.uid)}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="space-y-3">
          {pendingRequests.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {t("friend_requests_received", language)} ({pendingRequests.length})
              </h4>
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-white border border-amber-200/70 rounded-xl p-4 mb-2 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Swords size={18} className="text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{request.fromName}</p>
                        <p className="text-[9px] text-slate-400">{formatTimeAgo(request.createdAt, language)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(request)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm cursor-pointer flex items-center gap-1"
                      >
                        <Check size={14} />
                        {t("friend_accept", language)}
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request.id)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center gap-1"
                      >
                        <X size={14} />
                        {t("friend_decline", language)}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingSentRequests.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {t("friend_requests_sent", language)}
              </h4>
              {pendingSentRequests.map((request) => (
                <div key={request.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-slate-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{t("friend_battle_waiting", language, { name: request.toName })}</p>
                      <p className="text-[9px] text-slate-400">{formatTimeAgo(request.createdAt, language)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {completedSentRequests.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {t("friend_battle_history", language)}
              </h4>
              {completedSentRequests.map((request) => (
                <div key={request.id} className="bg-white border border-slate-200 rounded-xl p-4 mb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <TrophyBadge winnerId={request.battleResult?.winnerId} currentUid={currentUser.uid} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{request.toName}</p>
                        <p className="text-[9px] text-slate-400">{formatTimeAgo(request.createdAt, language)}</p>
                        <p className="text-[9px] text-slate-400">
                          {request.battleResult?.winnerId === currentUser.uid
                            ? t("friend_battle_won", language)
                            : t("friend_battle_lost", language)}
                        </p>
                      </div>
                    </div>
                    {!request.battleResult?.rewardsClaimed && (
                      <button
                        onClick={() => handleClaimReward(request.id)}
                        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center gap-1"
                      >
                        <Gift size={12} />
                        +100 SNS
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingRequests.length === 0 && pendingSentRequests.length === 0 && completedSentRequests.length === 0 && (
            <div className="bg-white border border-slate-200/70 rounded-xl p-8 text-center">
              <MessageCircle size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-500">{t("friend_no_requests", language)}</p>
              <p className="text-[10px] text-slate-400 mt-1">{t("friend_no_requests_hint", language)}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "suggestions" && (
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="bg-white border border-slate-200/70 rounded-xl p-8 text-center">
              <UserPlus size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-500">{t("friend_no_suggestions", language)}</p>
              <p className="text-[10px] text-slate-400 mt-1">{t("friend_no_suggestions_hint", language)}</p>
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <div key={suggestion.uid} className="bg-white border border-slate-200/70 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-600 shrink-0">
                    {suggestion.displayName.substring(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{suggestion.displayName}</p>
                    <p className="text-[9px] text-slate-400">{t("friend_guild_member", language)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddFriend(suggestion)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <UserPlus size={14} />
                  {t("friend_add", language)}
                </button>
              </div>
            ))
          )}
        </div>
      )}
      {/* ID 530: 친선전 커스텀 룰셋 모달 */}
      {customRuleModalFriend && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in font-mono">
          <div className="w-full max-w-sm bg-white border-2 border-black p-5 space-y-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b border-black pb-2">
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <span>⚙️</span>
                <span>{language === 'ko' ? '친선전 룰셋 커스텀' : 'Custom Battle Rules'}</span>
              </h3>
              <button
                onClick={() => setCustomRuleModalFriend(null)}
                className="text-xs font-bold text-slate-500 hover:text-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-800">
                vs {customRuleModalFriend.displayName}
              </div>

              {/* 타이머 */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  {language === 'ko' ? '턴 제한 시간:' : 'Turn Timer:'}
                </label>
                <div className="flex gap-2">
                  {([15, 30] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setRuleTurnTime(sec)}
                      className={`flex-1 py-1.5 border text-xs font-bold ${
                        ruleTurnTime === sec ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-300'
                      }`}
                    >
                      {sec}s {sec === 15 ? (language === 'ko' ? '(스피드)' : '(Blitz)') : (language === 'ko' ? '(기본)' : '(Standard)')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 중복 카드 금지 토글 */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-slate-700">
                  {language === 'ko' ? '동일 카드 중복 금지:' : 'No Duplicate Cards:'}
                </span>
                <button
                  type="button"
                  onClick={() => setRuleNoDupes((prev) => !prev)}
                  className={`px-2 py-1 text-[10px] font-bold border ${
                    ruleNoDupes ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {ruleNoDupes ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* 코스트 제한 */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  {language === 'ko' ? '덱 파워 제한:' : 'Deck Cost Cap:'}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRuleMaxCost(20)}
                    className={`flex-1 py-1.5 border text-xs font-bold ${
                      ruleMaxCost === 20 ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    20 Cost {language === 'ko' ? '(경량전)' : '(Light)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleMaxCost(99)}
                    className={`flex-1 py-1.5 border text-xs font-bold ${
                      ruleMaxCost === 99 ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    No Limit {language === 'ko' ? '(무제한)' : '(Unlimited)'}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  handleSendBattleRequest(customRuleModalFriend);
                  setCustomRuleModalFriend(null);
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                {language === 'ko' ? '설정된 룰로 대전 신청 발송' : 'Send Challenge with Rules'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface FriendCardProps {
  friend: FriendEntry;
  language: Language;
  currentUid: string;
  onBattle: () => void;
  onPracticeAi: () => void;
  onOpenRules: () => void;
  onRemove: () => void;
}

const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  language,
  currentUid,
  onBattle,
  onPracticeAi,
  onOpenRules,
  onRemove,
}) => {
  const lastActiveTimestamp = friend.lastActiveAt || friend.lastBattleAt || (Date.now() - 2 * 3600 * 1000);

  // ID 575: 상대별 친선전 전적 조회
  const rivalry = React.useMemo(() => {
    try {
      const saved = localStorage.getItem(`hero_friend_rivalry_${currentUid}_${friend.uid}`);
      return saved ? JSON.parse(saved) : { wins: 0, losses: 0, draws: 0 };
    } catch {
      return { wins: 0, losses: 0, draws: 0 };
    }
  }, [currentUid, friend.uid]);

  return (
    <div className="bg-white border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between gap-2 shadow-xs flex-wrap sm:flex-nowrap">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
            {friend.displayName.substring(0, 2)}
          </div>
          {friend.isOnline && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-slate-800 truncate">{friend.displayName}</p>
            {friend.isOnline ? (
              <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                ONLINE
              </span>
            ) : (
              <span className="text-[9px] font-mono text-slate-400">
                • {formatTimeAgo(lastActiveTimestamp, language)}
              </span>
            )}
            {/* ID 575: 상대별 친선전 전적 배지 */}
            <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-xs font-bold">
              {rivalry.wins}W {rivalry.losses}L
            </span>
          </div>
          {friend.battleCount > 0 ? (
            <p className="text-[9px] text-slate-400">{t("friend_battle_count", language, { count: friend.battleCount })}</p>
          ) : (
            <p className="text-[9px] text-slate-300">{t("friend_no_battles", language)}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {/* ID 545: AI 모의 연습 대전 */}
        <button
          type="button"
          onClick={onPracticeAi}
          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
          title={language === 'ko' ? '친구 대표 덱 기반 AI 모의 연습전' : 'AI Practice Match'}
        >
          <span>🤖</span>
          <span className="hidden md:inline">{language === 'ko' ? 'AI 연습' : 'Practice'}</span>
        </button>
        {/* ID 530: 룰셋 커스텀 */}
        <button
          type="button"
          onClick={onOpenRules}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all cursor-pointer"
          title={language === 'ko' ? '친선전 룰셋 설정' : 'Custom Rules'}
        >
          ⚙️
        </button>
        <button
          type="button"
          onClick={onBattle}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-98 shadow-xs cursor-pointer flex items-center gap-1"
        >
          <Swords size={12} />
          {t("friend_battle", language)}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
          title={t("friend_remove", language)}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

interface TrophyBadgeProps {
  winnerId?: string;
  currentUid: string;
}

const TrophyBadge: React.FC<TrophyBadgeProps> = ({ winnerId, currentUid }) => {
  const isWin = winnerId === currentUid;
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isWin ? "bg-emerald-100" : "bg-rose-100"}`}>
      {isWin ? <Zap size={18} className="text-emerald-600" /> : <X size={18} className="text-rose-500" />}
    </div>
  );
};

function formatTimeAgo(timestamp: number, language: Language): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return t("time_just_now", language);
  if (seconds < 60) return `${seconds}${language === "ko" ? "초 전" : "s ago"}`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("time_minutes_ago", language, { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("time_hours_ago", language, { hours });
  const days = Math.floor(hours / 24);
  return t("time_days_ago", language, { days });
}
