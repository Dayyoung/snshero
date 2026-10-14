import React, { useState, useEffect } from 'react';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showTacticalNotification
} from '../../utils/localNotifications';

export interface SevenDayStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateMinigame?: () => void;
  language?: string;
}

interface StreakDayInfo {
  day: number;
  rewardName: string;
  rewardType: 'credits' | 'key' | 'ap' | 'ssr';
  value: string;
  isSsr?: boolean;
}

const STREAK_DAYS: StreakDayInfo[] = [
  { day: 1, rewardName: '200 Credits', rewardType: 'credits', value: '+200' },
  { day: 2, rewardName: '1x Standard Key', rewardType: 'key', value: 'KEY x1' },
  { day: 3, rewardName: '300 Credits + 50 AP', rewardType: 'ap', value: '+300 / 50AP' },
  { day: 4, rewardName: '1x Upgrade Matrix', rewardType: 'key', value: 'MATRIX x1' },
  { day: 5, rewardName: '500 Credits + 100 AP', rewardType: 'ap', value: '+500 / 100AP' },
  { day: 6, rewardName: '1x Elite Key', rewardType: 'key', value: 'ELITE x1' },
  { day: 7, rewardName: 'GUARANTEED SSR CORE (SH-101)', rewardType: 'ssr', value: 'SSR SOVEREIGN', isSsr: true }
];

const STREAK_I18N: Record<string, Record<string, string>> = {
  ko: {
    modalTitle: '7일 연속 출석 작전 프로토콜',
    subtitle: '매일 보급 작전 수행 시 7일차 SSR 코어 확정 인가',
    dayLabel: 'DAY',
    claimed: '수령 완료',
    claimNow: '오늘 보급품 수령',
    readyToClaim: '수령 대기',
    locked: '잠김',
    repairTitle: '스트릭 복구 프로토콜',
    repairDesc: '놓친 출석일은 미니게임 2회 승리로 무료 복구 가능합니다.',
    repairBtn: '미니게임 플레이로 복구 (0/2)',
    notifBtn: '자정 전 스트릭 방어 알림 설정',
    notifGranted: '스트릭 방어 알림 활성화됨',
    closeBtn: '확인'
  },
  en: {
    modalTitle: '7-DAY STREAK PROTOCOL',
    subtitle: 'DAILY CHECK-IN GRANTS GUARANTEED DAY 7 SSR CORE',
    dayLabel: 'DAY',
    claimed: 'CLAIMED',
    claimNow: 'CLAIM SUPPLIES NOW',
    readyToClaim: 'READY',
    locked: 'LOCKED',
    repairTitle: 'STREAK REPAIR PROTOCOL',
    repairDesc: 'Missed a day? Repair yesterday for free by winning 2 minigames.',
    repairBtn: 'PLAY MINIGAMES TO REPAIR (0/2)',
    notifBtn: 'ENABLE MIDNIGHT DEFENDER ALERTS',
    notifGranted: 'MIDNIGHT DEFENDER ACTIVE',
    closeBtn: 'ACKNOWLEDGE'
  },
  ja: {
    modalTitle: '7日連続出席作戦プロトコル',
    subtitle: 'デイリーログインで7日目にSSRコア確定支給',
    dayLabel: 'DAY',
    claimed: '受取済',
    claimNow: '本日の補給を受取',
    readyToClaim: '受取可能',
    locked: 'ロック',
    repairTitle: 'ストリーク復旧プロトコル',
    repairDesc: '見逃した日はミニゲーム2回勝利で無料復旧できます。',
    repairBtn: 'ミニゲームで復旧 (0/2)',
    notifBtn: '深夜前ストリーク防衛通知を設定',
    notifGranted: 'ストリーク防衛通知が有効です',
    closeBtn: '確認'
  },
  'zh-CN': {
    modalTitle: '7天连续签到作战协议',
    subtitle: '每日补给报到，第7天必定获得SSR战术核心',
    dayLabel: 'DAY',
    claimed: '已领取',
    claimNow: '立即领取今日补给',
    readyToClaim: '可领取',
    locked: '未解锁',
    repairTitle: '签到补签修复协议',
    repairDesc: '漏签时可通过完成2次小游戏胜利免费补签修复。',
    repairBtn: '前往小游戏补签 (0/2)',
    notifBtn: '开启午夜防断签浏览器提醒',
    notifGranted: '防断签提醒已激活',
    closeBtn: '确认'
  },
  'zh-TW': {
    modalTitle: '7天連續簽到作戰協議',
    subtitle: '每日補給報到，第7天必定獲得SSR戰術核心',
    dayLabel: 'DAY',
    claimed: '已領取',
    claimNow: '立即領取今日補給',
    readyToClaim: '可領取',
    locked: '未解鎖',
    repairTitle: '簽到補簽修復協議',
    repairDesc: '漏簽時可透過完成2次小遊戲勝利免費補簽修復。',
    repairBtn: '前往小遊戲補簽 (0/2)',
    notifBtn: '開啟午夜防斷簽瀏覽器提醒',
    notifGranted: '防斷簽提醒已啟用',
    closeBtn: '確認'
  },
  de: {
    modalTitle: '7-TAGE-STREAK-PROTOKOLL',
    subtitle: 'TÄGLICHER LOGIN GARANTIERT AM TAG 7 EINEN SSR-KERN',
    dayLabel: 'TAG',
    claimed: 'ERHALTEN',
    claimNow: 'JETZT BEANSPRUCHEN',
    readyToClaim: 'BEREIT',
    locked: 'GESPERRT',
    repairTitle: 'STREAK-REPARATUR-PROTOKOLL',
    repairDesc: 'Einen Tag verpasst? Mit 2 Minispiel-Siegen kostenlos reparieren.',
    repairBtn: 'MINISPIEL SPIELEN (0/2)',
    notifBtn: 'MITTERNACHTS-BENACHRICHTIGUNG AKTIVIEREN',
    notifGranted: 'BENACHRICHTIGUNG AKTIV',
    closeBtn: 'BESTÄTIGEN'
  },
  es: {
    modalTitle: 'PROTOCOLO DE RACHA DE 7 DÍAS',
    subtitle: 'INICIO DIARIO OTORGA NÚCLEO SSR GARANTIZADO EN DÍA 7',
    dayLabel: 'DÍA',
    claimed: 'RECLAMADO',
    claimNow: 'RECLAMAR SUMINISTROS HOY',
    readyToClaim: 'LISTO',
    locked: 'BLOQUEADO',
    repairTitle: 'PROTOCOLO DE REPARACIÓN DE RACHA',
    repairDesc: '¿Perdiste un día? Repáralo gratis ganando 2 minijuegos.',
    repairBtn: 'JUGAR MINIJUEGOS (0/2)',
    notifBtn: 'ACTIVAR ALERTA DE MEDIANOCHE',
    notifGranted: 'ALERTA DE RACHA ACTIVADA',
    closeBtn: 'ENTENDIDO'
  },
  fr: {
    modalTitle: 'PROTOCOLE DE SÉRIE DE 7 JOURS',
    subtitle: 'CONNEXION QUOTIDIENNE DONNE UN CŒUR SSR AU JOUR 7',
    dayLabel: 'JOUR',
    claimed: 'RÉCUPÉRÉ',
    claimNow: 'RÉCLAMER LES RESSOURCES',
    readyToClaim: 'PRÊT',
    locked: 'VERROUILLÉ',
    repairTitle: 'RÉPARATION DE SÉRIE',
    repairDesc: 'Un jour manqué ? Réparez-le gratuitement en gagnant 2 mini-jeux.',
    repairBtn: 'JOUER AUX MINI-JEUX (0/2)',
    notifBtn: 'ACTIVER RAPPEL DE MINUIT',
    notifGranted: 'RAPPEL DE MINUIT ACTIF',
    closeBtn: 'VALIDER'
  },
  id: {
    modalTitle: 'PROTOKOL STREAK 7-HARI',
    subtitle: 'CHECK-IN HARIAN MENJAMIN INTI SSR DI HARI KE-7',
    dayLabel: 'HARI',
    claimed: 'DIKLAIM',
    claimNow: 'KLAIM PASOKAN HARI INI',
    readyToClaim: 'SIAP',
    locked: 'TERKUNCI',
    repairTitle: 'PROTOKOL PERBAIKAN STREAK',
    repairDesc: 'Ketinggalan sehari? Perbaiki gratis dengan memenangkan 2 minigame.',
    repairBtn: 'MAIN MINIGAME (0/2)',
    notifBtn: 'AKTIFKAN PENGINGAT TENGAH MALAM',
    notifGranted: 'PENGINGAT DIAKTIFKAN',
    closeBtn: 'SELESAI'
  },
  ru: {
    modalTitle: '7-ДНЕВНЫЙ ПРОТОКОЛ СЕРИИ',
    subtitle: 'ЕЖЕДНЕВНЫЙ ВХОД ГАРАНТИРУЕТ SSR ЯДРО НА 7 ДЕНЬ',
    dayLabel: 'ДЕНЬ',
    claimed: 'ПОЛУЧЕНО',
    claimNow: 'ПОЛУЧИТЬ СЕГОДНЯ',
    readyToClaim: 'ГОТОВО',
    locked: 'ЗАКРЫТО',
    repairTitle: 'ПРОТОКОЛ ВОССТАНОВЛЕНИЯ СЕРИИ',
    repairDesc: 'Пропустили день? Восстановите бесплатно за 2 победы в мини-играх.',
    repairBtn: 'ИГРАТЬ В МИНИ-ИГРЫ (0/2)',
    notifBtn: 'ВКЛЮЧИТЬ НАПОМИНАНИЯ В ПОЛНОЧЬ',
    notifGranted: 'НАПОМИНАНИЯ ВКЛЮЧЕНЫ',
    closeBtn: 'ПОНЯТНО'
  },
  th: {
    modalTitle: 'โปรโตคอลการเช็คชื่อต่อเนื่อง 7 วัน',
    subtitle: 'เช็คชื่อทุกวันรับแกน SSR การันตีในวันที่ 7',
    dayLabel: 'วัน',
    claimed: 'รับแล้ว',
    claimNow: 'รับเสบียงวันนี้',
    readyToClaim: 'พร้อมรับ',
    locked: 'ล็อค',
    repairTitle: 'โปรโตคอลซ่อมแซมการเช็คชื่อ',
    repairDesc: 'พลาดไปหนึ่งวัน? ซ่อมแซมได้ฟรีด้วยการชนะมินิเกม 2 ครั้ง',
    repairBtn: 'เล่นมินิเกมเพื่อซ่อม (0/2)',
    notifBtn: 'เปิดการแจ้งเตือนป้องกันก่อนเที่ยงคืน',
    notifGranted: 'เปิดการแจ้งเตือนแล้ว',
    closeBtn: 'รับทราบ'
  },
  vi: {
    modalTitle: 'GIAO THỨC ĐIỂM DANH 7 NGÀY LIÊN TIẾP',
    subtitle: 'ĐIỂM DANH MỖI NGÀY NHẬN LÕI SSR ĐẢM BẢO VÀO NGÀY 7',
    dayLabel: 'NGÀY',
    claimed: 'ĐÃ NHẬN',
    claimNow: 'NHẬN TIẾP TẾ HÔM NAY',
    readyToClaim: 'SẴN SÀNG',
    locked: 'ĐÃ KHÓA',
    repairTitle: 'GIAO THỨC KHÔI PHỤC ĐIỂM DANH',
    repairDesc: 'Bỏ lỡ một ngày? Khôi phục miễn phí bằng cách thắng 2 trận mini-game.',
    repairBtn: 'CHƠI MINI-GAME (0/2)',
    notifBtn: 'BẬT NHẮC NHỞ TRƯỚC NỬA ĐÊM',
    notifGranted: 'ĐÃ BẬT NHẮC NHỞ',
    closeBtn: 'XÁC NHẬN'
  }
};

export const SevenDayStreakModal: React.FC<SevenDayStreakModalProps> = ({
  isOpen,
  onClose,
  onNavigateMinigame,
  language: propLang
}) => {
  const { language: contextLang } = useGameSettings();
  const currentLang = propLang || contextLang || 'ko';
  const tr = STREAK_I18N[currentLang] || STREAK_I18N.ko;

  const [currentStreak, setCurrentStreak] = useState(1);
  const [claimedDays, setClaimedDays] = useState<number[]>([]);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        const savedStreak = parseInt(localStorage.getItem('hero_streak_days') || '1', 10);
        setCurrentStreak(Math.min(7, Math.max(1, savedStreak)));

        const savedClaimed = JSON.parse(localStorage.getItem('hero_streak_claimed_days') || '[]');
        setClaimedDays(Array.isArray(savedClaimed) ? savedClaimed : []);

        setNotifGranted(getNotificationPermission() === 'granted');
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  const handleClaimToday = () => {
    triggerHaptic('success');
    const newClaimed = [...claimedDays, currentStreak];
    setClaimedDays(newClaimed);

    try {
      localStorage.setItem('hero_streak_claimed_days', JSON.stringify(newClaimed));
      // Give credits
      const curCredits = parseInt(localStorage.getItem('hero_user_credits') || '0', 10);
      localStorage.setItem('hero_user_credits', (curCredits + 300).toString());

      if (currentStreak === 7) {
        localStorage.setItem('hero_ssr_core_guaranteed_claimed', 'true');
      }
    } catch {
      // ignore
    }
  };

  const handleEnableNotif = async () => {
    triggerHaptic('tap');
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      setNotifGranted(true);
      showTacticalNotification('SNSHero Tactical Defender', 'Daily 7-Day Streak reminder enabled! Report daily before midnight.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none font-mono">
      <div className="relative w-full max-w-lg bg-[#090d16]/95 border border-white/15 rounded-xl p-5 sm:p-6 text-white shadow-2xl space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
              {tr.modalTitle}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded border border-transparent hover:border-white/10"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-300">
          {tr.subtitle}
        </p>

        {/* 7-Day Matrix Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
          {STREAK_DAYS.map((item) => {
            const isClaimed = claimedDays.includes(item.day);
            const isToday = item.day === currentStreak;
            const isLocked = item.day > currentStreak;

            return (
              <div
                key={item.day}
                className={`p-2 rounded-lg border flex flex-col items-center justify-between text-center relative ${
                  item.isSsr
                    ? 'col-span-2 sm:col-span-1 bg-amber-950/40 border-amber-500/60 text-amber-300 shadow-md shadow-amber-950/30'
                    : isToday
                    ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 shadow-sm'
                    : isClaimed
                    ? 'bg-black/60 border-emerald-500/30 text-gray-400'
                    : 'bg-black/40 border-white/10 text-gray-500'
                }`}
              >
                <span className="text-[9px] font-bold">{tr.dayLabel} 0{item.day}</span>
                <div className="my-1.5">
                  {item.isSsr ? (
                    <svg className="w-5 h-5 text-amber-400 mx-auto animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ) : isClaimed ? (
                    <svg className="w-5 h-5 text-emerald-400 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  )}
                </div>
                <span className="text-[9px] font-bold leading-tight">{item.value}</span>
                <span className="text-[8px] uppercase mt-1">
                  {isClaimed ? tr.claimed : isToday ? tr.readyToClaim : tr.locked}
                </span>
              </div>
            );
          })}
        </div>

        {/* Claim Today CTA */}
        {!claimedDays.includes(currentStreak) ? (
          <button
            onClick={handleClaimToday}
            className="w-full min-h-[48px] bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {tr.claimNow} (DAY 0{currentStreak})
          </button>
        ) : (
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-center text-xs text-emerald-300 font-bold">
            {tr.claimed} - DAY 0{currentStreak}
          </div>
        )}

        {/* Streak Repair Hook & Notification Banner */}
        <div className="p-3 bg-black/60 border border-white/10 rounded-lg space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-300">{tr.repairTitle}</span>
            <button
              onClick={() => {
                onClose();
                if (onNavigateMinigame) onNavigateMinigame();
              }}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
            >
              {tr.repairBtn}
            </button>
          </div>
          <p className="text-[10px] text-gray-400">
            {tr.repairDesc}
          </p>

          {isNotificationSupported() && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                {notifGranted ? tr.notifGranted : tr.notifBtn}
              </span>
              {!notifGranted ? (
                <button
                  onClick={handleEnableNotif}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-emerald-500/40 text-emerald-300 rounded text-[10px] font-bold"
                >
                  ENABLE
                </button>
              ) : (
                <span className="text-[10px] text-emerald-400 font-bold">ACTIVE</span>
              )}
            </div>
          )}
        </div>

        {/* Footer Close */}
        <button
          onClick={onClose}
          className="w-full min-h-[44px] bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 rounded-lg text-xs font-bold transition-colors"
        >
          {tr.closeBtn}
        </button>
      </div>
    </div>
  );
};

export default SevenDayStreakModal;
