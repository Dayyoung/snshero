import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCheck, Trash2, Gift, Users, ShoppingBag, ShieldAlert, Sparkles } from 'lucide-react';
import { Language } from '../types';
import {
  SystemNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} from '../lib/notificationHelper';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'reward' | 'social' | 'trade'>('all');

  useEffect(() => {
    if (isOpen) {
      setNotifications(getNotifications());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => {
    const updated = markAsRead(id);
    setNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = markAllAsRead();
    setNotifications(updated);
  };

  const handleClearAll = () => {
    const updated = clearAllNotifications();
    setNotifications(updated);
  };

  const formatRelativeTime = (ts: number) => {
    const diffMin = Math.floor((Date.now() - ts) / 60000);
    if (diffMin < 1) return language === 'ko' ? '방금 전' : 'Just now';
    if (diffMin < 60) return `${diffMin}${language === 'ko' ? '분 전' : 'm ago'}`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}${language === 'ko' ? '시간 전' : 'h ago'}`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}${language === 'ko' ? '일 전' : 'd ago'}`;
  };

  const getCategoryIcon = (category: SystemNotification['category']) => {
    switch (category) {
      case 'reward':
        return <Gift size={16} className="text-amber-500" />;
      case 'social':
        return <Users size={16} className="text-indigo-500" />;
      case 'trade':
        return <ShoppingBag size={16} className="text-emerald-500" />;
      default:
        return <Sparkles size={16} className="text-cyan-500" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800">
                  {language === 'ko' ? '통합 알림 센터' : 'Notification Center'}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  {language === 'ko' ? `읽지 않은 알림 ${unreadCount}개` : `${unreadCount} unread notifications`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Action Row & Tabs */}
          <div className="px-5 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {language === 'ko' ? '전체' : 'All'}
              </button>
              <button
                onClick={() => setActiveTab('reward')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'reward' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {language === 'ko' ? '보상' : 'Rewards'}
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'social' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {language === 'ko' ? '소셜' : 'Social'}
              </button>
              <button
                onClick={() => setActiveTab('trade')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'trade' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {language === 'ko' ? '거래' : 'Trade'}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
              >
                <CheckCheck size={14} />
                {language === 'ko' ? '모두 읽음' : 'Read All'}
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                {language === 'ko' ? '삭제' : 'Clear'}
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">
                  {language === 'ko' ? '새로운 알림 내역이 없습니다.' : 'No notification logs found.'}
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkRead(item.id)}
                  className={`pt-2.5 first:pt-0 p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                    !item.read
                      ? 'bg-indigo-50/50 border border-indigo-100/80 shadow-xs'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{item.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">{item.message}</p>
                  </div>

                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5 animate-pulse" />
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
