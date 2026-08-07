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

  const filteredFriends = friends.filter((friend) =>
    friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
    <div className="space-y-4">
      {alertMsg && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-bold flex items-start gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{alertMsg}</span>
        </div>
      )}

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
                onBattle={() => handleSendBattleRequest(friend)}
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
    </div>
  );
};

interface FriendCardProps {
  friend: FriendEntry;
  language: Language;
  onBattle: () => void;
  onRemove: () => void;
}

const FriendCard: React.FC<FriendCardProps> = ({ friend, language, onBattle, onRemove }) => {
  const lastActiveTimestamp = friend.lastActiveAt || friend.lastBattleAt || (Date.now() - 2 * 3600 * 1000);

  return (
    <div className="bg-white border border-slate-200/70 rounded-xl p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
            {friend.displayName.substring(0, 2)}
          </div>
          {friend.isOnline && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
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
          </div>
          {friend.battleCount > 0 ? (
            <p className="text-[9px] text-slate-400">{t("friend_battle_count", language, { count: friend.battleCount })}</p>
          ) : (
            <p className="text-[9px] text-slate-300">{t("friend_no_battles", language)}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onBattle}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm cursor-pointer flex items-center gap-1.5"
        >
          <Swords size={14} />
          {t("friend_battle", language)}
        </button>
        <button
          onClick={onRemove}
          className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
          title={t("friend_remove", language)}
        >
          <X size={16} />
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
