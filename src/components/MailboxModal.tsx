import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Gift, Trash2, CheckCheck, X, Sparkles, Inbox, BellRing } from 'lucide-react';
import { Language } from '../types';
import { cn } from '../lib/utils';

export interface MailItem {
 id: string;
 title: string;
 content: string;
 sender: string;
 timestamp: number;
 isRead: boolean;
 isClaimed: boolean;
 rewardSns?: number;
 rewardCardPack?: string;
}

interface MailboxModalProps {
 isOpen: boolean;
 onClose: () => void;
 language: Language;
 onClaimReward: (snsAmount: number, packType?: string) => void;
 playSfx: (url: string) => void;
}

const MAILBOX_STORAGE_KEY = 'hero_mailbox_items';

export function getMailboxItems(): MailItem[] {
 if (typeof window === 'undefined') return [];
 try {
 const raw = localStorage.getItem(MAILBOX_STORAGE_KEY);
 if (raw) return JSON.parse(raw);
 } catch (e) {
 console.error("Failed to load mailbox items:", e);
 }

 // Default initial system mail
 const initialMails: MailItem[] = [
 {
 id: 'mail-welcome-01',
 title: '시즌1 그랜드 오픈 기념 선물!',
 content: 'SNSHero Revolution 시즌 1 오픈을 축하합니다! 모험가님을 위해 특별 보상을 준비했습니다.',
 sender: 'SNSHero 운영팀',
 timestamp: Date.now() - 1000 * 60 * 60 * 4,
 isRead: false,
 isClaimed: false,
 rewardSns: 1000,
 rewardCardPack: 'Premium Pack'
 },
 {
 id: 'mail-rank-reward-02',
 title: '일간 정기 점검 감사 보상',
 content: '서버 안정화 작업에 협조해 주셔서 감사합니다. 즐거운 게임 이용 되세요.',
 sender: '시스템 알림',
 timestamp: Date.now() - 1000 * 60 * 60 * 24,
 isRead: false,
 isClaimed: false,
 rewardSns: 500
 },
 {
 id: 'mail-notice-03',
 title: '신규 덱 조합 업데이트 완료 안내',
 content: '덱 시너지 시스템 및 카드 분해 환급 기능이 업데이트되었습니다.',
 sender: '개발팀',
 timestamp: Date.now() - 1000 * 60 * 60 * 48,
 isRead: true,
 isClaimed: true
 }
 ];

 try {
 localStorage.setItem(MAILBOX_STORAGE_KEY, JSON.stringify(initialMails));
 } catch {}

 return initialMails;
}

export const MailboxModal: React.FC<MailboxModalProps> = ({
 isOpen,
 onClose,
 language,
 onClaimReward,
 playSfx,
}) => {
 const [mails, setMails] = useState<MailItem[]>([]);
 const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
 const [autoClaimNotice, setAutoClaimNotice] = useState<string | null>(null);

 useEffect(() => {
 if (isOpen) {
 const currentMails = getMailboxItems();
 setMails(currentMails);

 // 자동 일괄 보상 수령 로직
 let totalSns = 0;
 let hasReward = false;
 const updated = currentMails.map(m => {
 if ((m.rewardSns || m.rewardCardPack) && !m.isClaimed) {
 hasReward = true;
 if (m.rewardSns) totalSns += m.rewardSns;
 return { ...m, isRead: true, isClaimed: true };
 }
 return m;
 });

 if (hasReward) {
 setMails(updated);
 try {
 localStorage.setItem(MAILBOX_STORAGE_KEY, JSON.stringify(updated));
 window.dispatchEvent(new Event('hero_mailbox_changed'));
 } catch (e) {
 console.error("Failed to save mailbox items:", e);
 }
 if (totalSns > 0) {
 onClaimReward(totalSns);
 }
 playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
 setAutoClaimNotice(
 language === 'ko'
 ? `🎁 우편함 보상 +${totalSns.toLocaleString()} SNS 포인트가 자동으로 지급되었습니다!`
 : `🎁 Mailbox rewards +${totalSns.toLocaleString()} SNS points automatically claimed!`
 );
 } else {
 setAutoClaimNotice(null);
 }
 }
 }, [isOpen]);

 const saveMails = (nextMails: MailItem[]) => {
 setMails(nextMails);
 try {
 localStorage.setItem(MAILBOX_STORAGE_KEY, JSON.stringify(nextMails));
 window.dispatchEvent(new Event('hero_mailbox_changed'));
 } catch (e) {
 console.error("Failed to save mailbox items:", e);
 }
 };

 const unreadCount = useMemo(() => mails.filter(m => !m.isRead).length, [mails]);
 const unclaimedCount = useMemo(() => mails.filter(m => (m.rewardSns || m.rewardCardPack) && !m.isClaimed).length, [mails]);

 // Delete Read Messages (Item 29)
 const handleDeleteRead = () => {
 playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
 // Keep unread or unclaimed reward mails
 const filtered = mails.filter(m => !m.isRead || ((m.rewardSns || m.rewardCardPack) && !m.isClaimed));
 saveMails(filtered);
 };

 const handleSelectMail = (mail: MailItem) => {
 playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
 setSelectedMail(mail);
 if (!mail.isRead) {
 const updated = mails.map(m => m.id === mail.id ? { ...m, isRead: true } : m);
 saveMails(updated);
 }
 };

 if (!isOpen) return null;

 return (
 <AnimatePresence>
 <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 15 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 15 }}
 className="bg-white rounded-none max-w-2xl w-full border border-slate-200 shadow-none overflow-hidden flex flex-col max-h-[85vh]"
 >
 {/* Header */}
 <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-none bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center relative">
 <Mail size={20} />
 {unreadCount > 0 && (
 <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
 {unreadCount}
 </span>
 )}
 </div>
 <div>
 <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
 {language === 'ko' ? '시스템 우편함 (Mailbox)' : 'In-Game Mailbox'}
 </h2>
 <p className="text-xs text-slate-500 font-medium">
 {language === 'ko' ? '공지사항 및 시즌 보상이 자동으로 안전하게 입금됩니다.' : 'Daily rewards and system announcements auto-claimed.'}
 </p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="min-h-[44px] p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
 >
 <X size={20} />
 </button>
 </div>

 {/* Auto Claim Notice Banner */}
 {autoClaimNotice && (
 <motion.div
 initial={{ opacity: 0, y: -8 }}
 animate={{ opacity: 1, y: 0 }}
 className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-none text-xs font-bold flex items-center gap-2 shadow-xs"
 >
 <Sparkles size={16} className="text-emerald-600 shrink-0" />
 <span className="flex-1">{autoClaimNotice}</span>
 </motion.div>
 )}

 {/* Controls Bar (Item 29) */}
 <div className="p-3 bg-slate-100/60 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
 <div className="text-slate-500 font-bold px-2 flex items-center gap-2">
 <span>{language === 'ko' ? `보관함 메일 ${mails.length}건` : `Total Mail: ${mails.length}`}</span>
 <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
 {language === 'ko' ? '✓ 자동 보상 활성' : '✓ Auto-Reward Active'}
 </span>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={handleDeleteRead}
 className="min-h-[44px] px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-sm font-bold transition-all text-xs flex items-center gap-1 cursor-pointer"
 >
 <Trash2 size={13} className="text-rose-500" />
 <span>{language === 'ko' ? '읽은 우편 정리' : 'Delete Read'}</span>
 </button>
 </div>
 </div>

 {/* Mail Items List */}
 <div className="p-4 overflow-y-auto space-y-2.5 flex-1 min-h-[260px]">
 {mails.length === 0 ? (
 <div className="py-16 text-center text-slate-400 space-y-2">
 <Inbox size={40} className="mx-auto opacity-30" />
 <p className="text-xs font-bold">
 {language === 'ko' ? '우편함이 비어있습니다.' : 'Mailbox is empty.'}
 </p>
 </div>
 ) : (
 mails.map(item => {
 const hasReward = Boolean(item.rewardSns || item.rewardCardPack);
 const dateStr = new Date(item.timestamp).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
 month: 'short',
 day: 'numeric'
 });

 return (
 <div
 key={item.id}
 onClick={() => handleSelectMail(item)}
 className={cn(
 "p-3.5 rounded-none border transition-all cursor-pointer flex items-center justify-between gap-3 select-none",
 !item.isRead
 ? "bg-indigo-50/70 border-indigo-200 shadow-xs hover:bg-indigo-100/80"
 : "bg-white border-slate-200 opacity-80 hover:opacity-100 hover:bg-slate-50"
 )}
 >
 <div className="flex items-center gap-3 min-w-0">
 <div className={cn(
 "w-9 h-9 rounded-none flex items-center justify-center shrink-0 border",
 hasReward && !item.isClaimed
 ? "bg-amber-100 border-amber-300 text-amber-600 transition-transform duration-300"
 : item.isRead
 ? "bg-slate-100 border-slate-200 text-slate-400"
 : "bg-indigo-600 border-indigo-700 text-white"
 )}>
 {hasReward ? <Gift size={18} /> : <Mail size={18} />}
 </div>

 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <h4 className={cn(
 "text-xs sm:text-sm truncate",
 !item.isRead ? "font-black text-slate-900" : "font-bold text-slate-600"
 )}>
 {item.title}
 </h4>
 {!item.isRead && (
 <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
 )}
 </div>
 <p className="text-[10px] text-slate-400 font-medium">
 {item.sender} • {dateStr}
 </p>
 </div>
 </div>

 {/* Reward Badge */}
 {hasReward && (
 <div className="shrink-0 text-right">
 <span className="px-2.5 py-1 rounded-none bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
 <span>✓</span>
 <span>+{item.rewardSns} SNS {language === 'ko' ? '(자동 지급됨)' : '(Auto Claimed)'}</span>
 </span>
 </div>
 )}
 </div>
 );
 })
 )}
 </div>

 {/* Footer */}
 <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
 <button
 onClick={onClose}
 className="min-h-[44px] px-5 py-2 rounded-sm bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
 >
 {language === 'ko' ? '닫기' : 'Close'}
 </button>
 </div>
 </motion.div>

 {/* Selected Mail Detail Modal */}
 <AnimatePresence>
 {selectedMail && (
 <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-950/80">
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.9 }}
 className="bg-white rounded-none max-w-md w-full border border-slate-200 shadow-none p-5 space-y-4"
 >
 <div className="flex items-center justify-between border-b pb-3 border-slate-100">
 <div>
 <h3 className="text-base font-black text-slate-900">
 {selectedMail.title}
 </h3>
 <p className="text-xs text-slate-400">
 From: {selectedMail.sender}
 </p>
 </div>
 <button
 onClick={() => setSelectedMail(null)}
 className="min-h-[44px] p-1.5 text-slate-400 hover:text-slate-700 rounded-sm"
 >
 <X size={18} />
 </button>
 </div>

 <div className="text-xs text-slate-700 leading-relaxed min-h-[80px] whitespace-pre-line bg-slate-50 p-3.5 rounded-none border border-slate-100">
 {selectedMail.content}
 </div>

 {(selectedMail.rewardSns || selectedMail.rewardCardPack) && (
 <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-none flex items-center justify-between">
 <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
 <Gift size={16} className="text-emerald-600" />
 <span>첨부 보상: +{selectedMail.rewardSns} SNS Points</span>
 </div>
 <span className="text-xs font-bold text-emerald-700 px-2.5 py-1 bg-white rounded-none border border-emerald-200">
 {language === 'ko' ? '✓ 자동 지급 완료' : '✓ Auto Claimed'}
 </span>
 </div>
 )}

 <button
 onClick={() => setSelectedMail(null)}
 className="min-h-[44px] w-full py-2.5 bg-slate-900 text-white rounded-sm font-bold text-xs hover:bg-slate-800 transition-all"
 >
 {language === 'ko' ? '확인' : 'OK'}
 </button>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 </AnimatePresence>
 );
};
