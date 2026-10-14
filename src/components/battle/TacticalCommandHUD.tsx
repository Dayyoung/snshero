import React, { useState, useEffect } from 'react';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import {
  canClaimDailyOverridePack,
  claimDailyOverridePack,
  getDailyMinigameCount,
  isDailyOverridePackClaimed
} from '../../utils/tacticalEnergyHelper';

export type OverrideMode = 'ASSAULT' | 'COUNTER' | 'SYNERGY' | null;

export interface TacticalHUDProps {
  currentAp: number;
  maxAp?: number;
  activeOverride: OverrideMode;
  overrideRemainingSeconds?: number;
  onTriggerOverride: (mode: 'ASSAULT' | 'COUNTER' | 'SYNERGY') => void;
  disabled?: boolean;
  language?: string;
  className?: string;
  onOpenMinigameLounge?: () => void;
}

// ─── Zero-Emoji Inline SVG Icons (strokeWidth="1.75") ─────────────────
const LightningBoltIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const HexagonShieldIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polygon points="12 6 16 9 16 14 12 17 8 14 8 9" />
  </svg>
);

const SynergyOrbitIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <circle cx="19" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <path d="M10.4 6.5A8 8 0 0 1 17.5 13.6" />
    <path d="M13.6 17.5A8 8 0 0 1 6.5 10.4" />
  </svg>
);

const BatteryCoreIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
    <line x1="22" y1="11" x2="22" y2="13" />
    <line x1="6" y1="11" x2="6" y2="13" />
    <line x1="10" y1="10" x2="10" y2="14" />
    <line x1="14" y1="11" x2="14" y2="13" />
  </svg>
);

const SupplyCrateIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const CrosshairIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
  </svg>
);

// ─── 12-Language i18n Dictionary ───────────────────────────────────────
const I18N_TACTICAL: Record<string, Record<string, string>> = {
  ko: {
    hud_title: '전술 지휘 콘솔 // TACTICAL OVERRIDE',
    ap_label: '전술 AP',
    ap_recharge_hint: '미니게임 플레이 시 AP 충전 (+20)',
    assault_name: '돌격 // ASSAULT',
    assault_cost: '30 AP',
    assault_desc: '공격력 +35% · 속도 +20% (5초)',
    counter_name: '요격 // COUNTER',
    counter_cost: '30 AP',
    counter_desc: '피해 감소 40% · 반사 25% (5초)',
    synergy_name: '연계 // SYNERGY',
    synergy_cost: '50 AP',
    synergy_desc: '궁극기 +50% · 디버프 전체 해제',
    active_badge: '작동 중',
    not_enough_ap: 'AP 부족',
    daily_minigames: '일일 미니게임',
    claim_pack: '보급 팩 수령',
    pack_claimed: '보급 완료',
    pack_modal_title: '전술 오버라이드 보급 팩 획득',
    pack_modal_desc: '일일 미니게임 3회 완료 보급품이 도착했습니다.',
    pack_reward_ticket: '프라임 소환 티켓 1장',
    pack_reward_booster: '전술 배틀 부스터 토큰 1개',
    pack_reward_ap: '전술 AP +40 충전',
    pack_claim_btn: '보급품 확인 및 장착',
    close: '닫기',
  },
  en: {
    hud_title: 'TACTICAL COMMAND CONSOLE // OVERRIDE',
    ap_label: 'TACTICAL AP',
    ap_recharge_hint: 'Earn AP via Minigames (+20 AP)',
    assault_name: 'ASSAULT',
    assault_cost: '30 AP',
    assault_desc: 'ATK +35% · Speed +20% (5s)',
    counter_name: 'COUNTER',
    counter_cost: '30 AP',
    counter_desc: 'DMG -40% · Reflect 25% (5s)',
    synergy_name: 'SYNERGY',
    synergy_cost: '50 AP',
    synergy_desc: 'Ult +50% · Cleanse All Debuffs',
    active_badge: 'ACTIVE',
    not_enough_ap: 'LOW AP',
    daily_minigames: 'Daily Games',
    claim_pack: 'CLAIM PACK',
    pack_claimed: 'CLAIMED',
    pack_modal_title: 'TACTICAL OVERRIDE PACK UNLOCKED',
    pack_modal_desc: 'Daily 3x minigame operation supplies have arrived.',
    pack_reward_ticket: '1x Prime Summon Ticket',
    pack_reward_booster: '1x Tactical Battle Booster',
    pack_reward_ap: '+40 AP Refilled',
    pack_claim_btn: 'ACCEPT REQUISITION',
    close: 'CLOSE',
  },
  ja: {
    hud_title: '戦術指揮コンソール // TACTICAL OVERRIDE',
    ap_label: '戦術 AP',
    ap_recharge_hint: 'ミニゲームでAP回復 (+20)',
    assault_name: '突격 // ASSAULT',
    assault_cost: '30 AP',
    assault_desc: '攻撃力 +35% · 速度 +20% (5秒)',
    counter_name: '迎撃 // COUNTER',
    counter_cost: '30 AP',
    counter_desc: '被ダメ -40% · 反射 25% (5秒)',
    synergy_name: '共鳴 // SYNERGY',
    synergy_cost: '50 AP',
    synergy_desc: 'ゲージ +50% · デバフ解除',
    active_badge: '発動中',
    not_enough_ap: 'AP不足',
    daily_minigames: 'デイリーゲーム',
    claim_pack: '補給受取',
    pack_claimed: '受取済',
    pack_modal_title: '戦術オーバーライド補給パック獲得',
    pack_modal_desc: 'デイリーミニゲーム3回達成の補給品が到着しました。',
    pack_reward_ticket: 'プライム召喚チケット 1枚',
    pack_reward_booster: '戦術バトルブースター 1個',
    pack_reward_ap: '戦術 AP +40 回復',
    pack_claim_btn: '受取完了',
    close: '閉じる',
  },
  'zh-CN': {
    hud_title: '战术指挥控制台 // TACTICAL OVERRIDE',
    ap_label: '战术 AP',
    ap_recharge_hint: '游玩小游戏补充 AP (+20)',
    assault_name: '突击 // ASSAULT',
    assault_cost: '30 AP',
    assault_desc: '攻击力 +35% · 攻速 +20% (5秒)',
    counter_name: '反制 // COUNTER',
    counter_cost: '30 AP',
    counter_desc: '减伤 40% · 反弹 25% (5秒)',
    synergy_name: '协力 // SYNERGY',
    synergy_cost: '50 AP',
    synergy_desc: '大招充能 +50% · 净化全部减益',
    active_badge: '已激活',
    not_enough_ap: 'AP不足',
    daily_minigames: '每日小游戏',
    claim_pack: '领取补给',
    pack_claimed: '已领取',
    pack_modal_title: '战术超频补给包解锁',
    pack_modal_desc: '每日完成3次小游戏补给物资已送达。',
    pack_reward_ticket: '特级召唤券 1张',
    pack_reward_booster: '战术战斗强化推进器 1个',
    pack_reward_ap: '补充 40 AP',
    pack_claim_btn: '确认领取',
    close: '关闭',
  },
  'zh-TW': {
    hud_title: '戰術指揮控制台 // TACTICAL OVERRIDE',
    ap_label: '戰術 AP',
    ap_recharge_hint: '遊玩小遊戲補充 AP (+20)',
    assault_name: '突擊 // ASSAULT',
    assault_cost: '30 AP',
    assault_desc: '攻擊力 +35% · 攻速 +20% (5秒)',
    counter_name: '反制 // COUNTER',
    counter_cost: '30 AP',
    counter_desc: '減傷 40% · 反彈 25% (5秒)',
    synergy_name: '協力 // SYNERGY',
    synergy_cost: '50 AP',
    synergy_desc: '大招充能 +50% · 淨化全部減益',
    active_badge: '已激活',
    not_enough_ap: 'AP不足',
    daily_minigames: '每日小遊戲',
    claim_pack: '領取補給',
    pack_claimed: '已領取',
    pack_modal_title: '戰術超頻補給包解鎖',
    pack_modal_desc: '每日完成3次小遊戲補給物資已送達。',
    pack_reward_ticket: '特級召喚券 1張',
    pack_reward_booster: '戰術戰鬥強化推進器 1個',
    pack_reward_ap: '補充 40 AP',
    pack_claim_btn: '確認領取',
    close: '關閉',
  },
  es: {
    hud_title: 'CONSOLA TÁCTICA // OVERRIDE',
    ap_label: 'AP TÁCTICO',
    ap_recharge_hint: 'Gana AP en minijuegos (+20)',
    assault_name: 'ASALTO',
    assault_cost: '30 AP',
    assault_desc: 'ATQ +35% · Vel +20% (5s)',
    counter_name: 'CONTRA',
    counter_cost: '30 AP',
    counter_desc: 'Daño -40% · Reflejo 25% (5s)',
    synergy_name: 'SINERGIA',
    synergy_cost: '50 AP',
    synergy_desc: 'Ult +50% · Limpia Debuffs',
    active_badge: 'ACTIVO',
    not_enough_ap: 'AP BAJO',
    daily_minigames: 'Juegos Diarios',
    claim_pack: 'RECLAMAR PACK',
    pack_claimed: 'RECLAMADO',
    pack_modal_title: 'PAQUETE TÁCTICO DESBLOQUEADO',
    pack_modal_desc: 'Los suministros diarios por 3 minijuegos han llegado.',
    pack_reward_ticket: '1x Ticket de Invocación Prime',
    pack_reward_booster: '1x Potenciador de Batalla',
    pack_reward_ap: '+40 AP Recargado',
    pack_claim_btn: 'ACEPTAR SUMINISTROS',
    close: 'CERRAR',
  },
  fr: {
    hud_title: 'CONSOLE TACTIQUE // OVERRIDE',
    ap_label: 'AP TACTIQUE',
    ap_recharge_hint: 'Gagnez des AP via mini-jeux (+20)',
    assault_name: 'ASSAUT',
    assault_cost: '30 AP',
    assault_desc: 'ATQ +35% · Vit +20% (5s)',
    counter_name: 'CONTRE',
    counter_cost: '30 AP',
    counter_desc: 'Dégâts -40% · Renvoi 25% (5s)',
    synergy_name: 'SYNERGIE',
    synergy_cost: '50 AP',
    synergy_desc: 'Ultime +50% · Purge Débuffs',
    active_badge: 'ACTIF',
    not_enough_ap: 'AP BAS',
    daily_minigames: 'Jeux Quotidiens',
    claim_pack: 'RÉCLAMER PACK',
    pack_claimed: 'RÉCLAMÉ',
    pack_modal_title: 'PACK DE COMMANDE TACTIQUE DÉBLOQUÉ',
    pack_modal_desc: 'Ravitaillement quotidien de 3 mini-jeux arrivé.',
    pack_reward_ticket: '1x Ticket d Invocation Prime',
    pack_reward_booster: '1x Booster de Combat Tactique',
    pack_reward_ap: '+40 AP Rechargés',
    pack_claim_btn: 'ACCEPTER LE PACK',
    close: 'FERMER',
  },
  de: {
    hud_title: 'TAKTIK-KONSOLE // OVERRIDE',
    ap_label: 'TAKTIK-AP',
    ap_recharge_hint: 'AP in Minispielen sammeln (+20)',
    assault_name: 'ANGRIFF',
    assault_cost: '30 AP',
    assault_desc: 'ANG +35% · Tempo +20% (5s)',
    counter_name: 'KONTER',
    counter_cost: '30 AP',
    counter_desc: 'Schaden -40% · Reflexion 25% (5s)',
    synergy_name: 'SYNERGIE',
    synergy_cost: '50 AP',
    synergy_desc: 'Ulti +50% · Debuffs bereinigen',
    active_badge: 'AKTIV',
    not_enough_ap: 'ZU WENIG AP',
    daily_minigames: 'Tages-Spiele',
    claim_pack: 'PAKET HOLEN',
    pack_claimed: 'EINGELÖST',
    pack_modal_title: 'TAKTIK-PAKET FREIGESCHALTET',
    pack_modal_desc: 'Tägliche Vorräte für 3 Minispiele eingetroffen.',
    pack_reward_ticket: '1x Prime-Beschwörungsticket',
    pack_reward_booster: '1x Taktischer Kampf-Booster',
    pack_reward_ap: '+40 AP Aufgeladen',
    pack_claim_btn: 'VORRÄTE ANNEHMEN',
    close: 'SCHLIESSEN',
  },
  vi: {
    hud_title: 'BẢNG CHỈ HUY CHIẾN THUẬT // OVERRIDE',
    ap_label: 'AP CHIẾN THUẬT',
    ap_recharge_hint: 'Nạp AP qua minigame (+20)',
    assault_name: 'TẤN CÔNG',
    assault_cost: '30 AP',
    assault_desc: 'Công +35% · Tốc độ +20% (5s)',
    counter_name: 'PHẢN CÔNG',
    counter_cost: '30 AP',
    counter_desc: 'Giảm sát thương 40% · Phản 25% (5s)',
    synergy_name: 'HIỆP ĐỒNG',
    synergy_cost: '50 AP',
    synergy_desc: 'Nộ +50% · Xóa mọi hiệu ứng xấu',
    active_badge: 'ĐANG KÍCH HOẠT',
    not_enough_ap: 'THIẾU AP',
    daily_minigames: 'Minigame hàng ngày',
    claim_pack: 'NHẬN GÓI TIẾP TẾ',
    pack_claimed: 'ĐÃ NHẬN',
    pack_modal_title: 'MỞ KHÓA GÓI CHIẾN THUẬT',
    pack_modal_desc: 'Tiếp tế hoàn thành 3 minigame hôm nay đã sẵn sàng.',
    pack_reward_ticket: '1 Vé Triệu Hồi Prime',
    pack_reward_booster: '1 Token Tăng Cường Chiến Đấu',
    pack_reward_ap: 'Nạp +40 AP',
    pack_claim_btn: 'XÁC NHẬN NHẬN',
    close: 'ĐÓNG',
  },
  th: {
    hud_title: 'คอนโซลบัญชาการยุทธวิธี // OVERRIDE',
    ap_label: 'AP ยุทธวิธี',
    ap_recharge_hint: 'รับ AP จากมินิเกม (+20)',
    assault_name: 'จู่โจม // ASSAULT',
    assault_cost: '30 AP',
    assault_desc: 'พลังโจมตี +35% · ความเร็ว +20% (5วิ)',
    counter_name: 'สวนกลับ // COUNTER',
    counter_cost: '30 AP',
    counter_desc: 'ลดดาเมจ 40% · สะท้อน 25% (5วิ)',
    synergy_name: 'ผสานพลัง // SYNERGY',
    synergy_cost: '50 AP',
    synergy_desc: 'เกจไม้ตาย +50% · ล้างดีบัฟทั้งหมด',
    active_badge: 'กำลังทำงาน',
    not_enough_ap: 'AP ไม่พอ',
    daily_minigames: 'มินิเกมประจำวัน',
    claim_pack: 'รับแพ็กเสบียง',
    pack_claimed: 'รับแล้ว',
    pack_modal_title: 'ปลดล็อกแพ็กยุทธวิธีประจำวัน',
    pack_modal_desc: 'เสบียงจากการเล่นมินิเกมครบ 3 ครั้งมาถึงแล้ว',
    pack_reward_ticket: 'ตั๋วอัญเชิญไพรม์ 1 ใบ',
    pack_reward_booster: 'โทเคนบูสเตอร์ต่อสู้ 1 ชิ้น',
    pack_reward_ap: 'เติม AP +40',
    pack_claim_btn: 'รับเสบียง',
    close: 'ปิด',
  },
  id: {
    hud_title: 'KONSOL KOMANDO TAKTIS // OVERRIDE',
    ap_label: 'AP TAKTIS',
    ap_recharge_hint: 'Dapatkan AP dari Minigame (+20)',
    assault_name: 'SERANGAN',
    assault_cost: '30 AP',
    assault_desc: 'ATK +35% · Kecepatan +20% (5d)',
    counter_name: 'PENANGKAL',
    counter_cost: '30 AP',
    counter_desc: 'DMG -40% · Pantul 25% (5d)',
    synergy_name: 'SINERGI',
    synergy_cost: '50 AP',
    synergy_desc: 'Ulti +50% · Bersihkan Semua Debuff',
    active_badge: 'AKTIF',
    not_enough_ap: 'AP KURANG',
    daily_minigames: 'Game Harian',
    claim_pack: 'KLAIM PAKET',
    pack_claimed: 'DIKLAIM',
    pack_modal_title: 'PAKET OVERRIDE TAKTIS TERBUKA',
    pack_modal_desc: 'Pasokan harian 3x minigame telah tiba.',
    pack_reward_ticket: '1x Tiket Panggilan Prime',
    pack_reward_booster: '1x Booster Pertempuran Taktis',
    pack_reward_ap: '+40 AP Terisi',
    pack_claim_btn: 'TERIMA PASOKAN',
    close: 'TUTUP',
  },
  ru: {
    hud_title: 'ТАКТИЧЕСКАЯ КОНСОЛЬ // OVERRIDE',
    ap_label: 'ТАКТИЧЕСКИЕ AP',
    ap_recharge_hint: 'Зарабатывайте AP в мини-играх (+20)',
    assault_name: 'ШТУРМ',
    assault_cost: '30 AP',
    assault_desc: 'АТК +35% · Скорость +20% (5с)',
    counter_name: 'КОНТРАТАК',
    counter_cost: '30 AP',
    counter_desc: 'Урон -40% · Отражение 25% (5с)',
    synergy_name: 'СИНЕРГИЯ',
    synergy_cost: '50 AP',
    synergy_desc: 'Ульта +50% · Снятие всех дебаффов',
    active_badge: 'АКТИВНО',
    not_enough_ap: 'МАЛО AP',
    daily_minigames: 'Мини-игры за день',
    claim_pack: 'ЗАБРАТЬ ПАКЕТ',
    pack_claimed: 'ПОЛУЧЕНО',
    pack_modal_title: 'ТАКТИЧЕСКИЙ ПАКЕТ РАЗБЛОКИРОВАН',
    pack_modal_desc: 'Ежедневные припасы за 3 мини-игры прибыли.',
    pack_reward_ticket: '1x Билет Призыва Prime',
    pack_reward_booster: '1x Боевой Усилитель',
    pack_reward_ap: '+40 AP Восстановлено',
    pack_claim_btn: 'ПРИНЯТЬ ПРИПАСЫ',
    close: 'ЗАКРЫТЬ',
  },
};

export const TacticalCommandHUD: React.FC<TacticalHUDProps> = ({
  currentAp,
  maxAp = 100,
  activeOverride,
  overrideRemainingSeconds = 0,
  onTriggerOverride,
  disabled = false,
  language: propLang,
  className = '',
  onOpenMinigameLounge,
}) => {
  const { language: ctxLang } = useGameSettings();
  const rawLang = propLang || ctxLang || 'ko';
  const langKey = I18N_TACTICAL[rawLang] ? rawLang : 'en';
  const t = (k: string) => I18N_TACTICAL[langKey]?.[k] || I18N_TACTICAL['en']?.[k] || k;

  const [dailyCount, setDailyCount] = useState<number>(() => getDailyMinigameCount());
  const [packClaimed, setPackClaimed] = useState<boolean>(() => isDailyOverridePackClaimed());
  const [showPackModal, setShowPackModal] = useState<boolean>(false);

  // Sync minigame count and pack events
  useEffect(() => {
    const handleMinigameUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ count: number; packUnlocked: boolean }>;
      if (custom.detail) {
        setDailyCount(custom.detail.count);
        if (custom.detail.packUnlocked && !isDailyOverridePackClaimed()) {
          setShowPackModal(true);
        }
      }
    };

    const handlePackClaimed = () => {
      setPackClaimed(true);
    };

    window.addEventListener('snshero_daily_minigame_updated', handleMinigameUpdate);
    window.addEventListener('snshero_daily_pack_claimed', handlePackClaimed);

    return () => {
      window.removeEventListener('snshero_daily_minigame_updated', handleMinigameUpdate);
      window.removeEventListener('snshero_daily_pack_claimed', handlePackClaimed);
    };
  }, []);

  const handleClaimPack = () => {
    const res = claimDailyOverridePack();
    if (res.success) {
      setPackClaimed(true);
      setShowPackModal(false);
    }
  };

  const apPercentage = Math.min(100, Math.max(0, Math.round((currentAp / maxAp) * 100)));

  return (
    <>
      <div
        className={`w-full bg-[#090d16]/95 border-t border-white/15 backdrop-blur-md p-3 font-mono text-xs select-none ${className}`}
      >
        {/* HUD Top Bar: AP Gauge & Daily Minigame Progress */}
        <div className="flex items-center justify-between mb-2 gap-2 text-[11px]">
          {/* AP Battery Gauge */}
          <div className="flex items-center gap-1.5 min-w-0">
            <BatteryCoreIcon className="text-cyan-400 shrink-0" size={14} />
            <span className="text-white/60 uppercase tracking-wider text-[10px] hidden sm:inline">
              {t('ap_label')}
            </span>
            <div className="w-24 sm:w-32 h-2.5 bg-black/60 border border-white/15 rounded-xs overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                style={{ width: `${apPercentage}%` }}
              />
            </div>
            <span className="text-cyan-300 font-bold text-[10px] tracking-tight">
              {currentAp}/{maxAp}
            </span>
          </div>

          {/* Daily Retention Minigame Hook */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-white/40 text-[10px]">
              {t('daily_minigames')}:
            </span>
            <span
              className={`font-bold text-[10px] px-1 py-0.2 rounded-xs border ${
                dailyCount >= 3
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                  : 'bg-white/5 text-white/70 border-white/10'
              }`}
            >
              [{Math.min(3, dailyCount)}/3]
            </span>

            {canClaimDailyOverridePack() && (
              <button
                type="button"
                onClick={() => setShowPackModal(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-xs text-[10px] font-bold animate-pulse cursor-pointer"
                title={t('claim_pack')}
              >
                <SupplyCrateIcon size={12} />
                <span>{t('claim_pack')}</span>
              </button>
            )}

            {onOpenMinigameLounge && (
              <button
                type="button"
                onClick={onOpenMinigameLounge}
                className="text-[10px] text-white/50 hover:text-white/90 underline cursor-pointer hidden md:inline"
                title={t('ap_recharge_hint')}
              >
                [+] AP
              </button>
            )}
          </div>
        </div>

        {/* 3-Part Command Grid (ASSAULT, COUNTER, SYNERGY) */}
        <div className="grid grid-cols-3 gap-2">
          {/* 1. ASSAULT BUTTON */}
          <button
            type="button"
            disabled={disabled || currentAp < 30 || activeOverride !== null}
            onClick={() => onTriggerOverride('ASSAULT')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border font-mono min-h-[48px] transition-all cursor-pointer select-none text-left relative overflow-hidden ${
              activeOverride === 'ASSAULT'
                ? 'bg-red-950/50 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.5)] ring-1 ring-red-400'
                : currentAp < 30 || disabled
                ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed opacity-60'
                : 'bg-white/5 hover:bg-red-950/20 border-red-500/30 hover:border-red-500/60 text-red-400'
            }`}
          >
            {activeOverride === 'ASSAULT' && (
              <span className="absolute top-1 right-1 text-[9px] font-bold px-1 bg-red-600 text-white rounded-xs animate-pulse">
                {overrideRemainingSeconds}s
              </span>
            )}
            <div className="flex items-center gap-1 w-full justify-between">
              <div className="flex items-center gap-1 font-bold text-xs truncate">
                <LightningBoltIcon size={14} className={activeOverride === 'ASSAULT' ? 'text-red-400 animate-bounce' : 'text-red-400'} />
                <span className="truncate">{t('assault_name')}</span>
              </div>
              <span className="text-[10px] opacity-80 shrink-0 font-normal">
                {t('assault_cost')}
              </span>
            </div>
            <p className="text-[9.5px] opacity-75 mt-0.5 line-clamp-1 w-full text-white/70">
              {t('assault_desc')}
            </p>
          </button>

          {/* 2. COUNTER BUTTON */}
          <button
            type="button"
            disabled={disabled || currentAp < 30 || activeOverride !== null}
            onClick={() => onTriggerOverride('COUNTER')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border font-mono min-h-[48px] transition-all cursor-pointer select-none text-left relative overflow-hidden ${
              activeOverride === 'COUNTER'
                ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)] ring-1 ring-cyan-300'
                : currentAp < 30 || disabled
                ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed opacity-60'
                : 'bg-white/5 hover:bg-cyan-950/20 border-cyan-500/30 hover:border-cyan-500/60 text-cyan-400'
            }`}
          >
            {activeOverride === 'COUNTER' && (
              <span className="absolute top-1 right-1 text-[9px] font-bold px-1 bg-cyan-600 text-white rounded-xs animate-pulse">
                {overrideRemainingSeconds}s
              </span>
            )}
            <div className="flex items-center gap-1 w-full justify-between">
              <div className="flex items-center gap-1 font-bold text-xs truncate">
                <HexagonShieldIcon size={14} className={activeOverride === 'COUNTER' ? 'text-cyan-400 animate-pulse' : 'text-cyan-400'} />
                <span className="truncate">{t('counter_name')}</span>
              </div>
              <span className="text-[10px] opacity-80 shrink-0 font-normal">
                {t('counter_cost')}
              </span>
            </div>
            <p className="text-[9.5px] opacity-75 mt-0.5 line-clamp-1 w-full text-white/70">
              {t('counter_desc')}
            </p>
          </button>

          {/* 3. SYNERGY BUTTON */}
          <button
            type="button"
            disabled={disabled || currentAp < 50 || activeOverride !== null}
            onClick={() => onTriggerOverride('SYNERGY')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border font-mono min-h-[48px] transition-all cursor-pointer select-none text-left relative overflow-hidden ${
              activeOverride === 'SYNERGY'
                ? 'bg-purple-950/50 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(192,132,252,0.5)] ring-1 ring-purple-300'
                : currentAp < 50 || disabled
                ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed opacity-60'
                : 'bg-white/5 hover:bg-purple-950/20 border-purple-500/30 hover:border-purple-500/60 text-purple-400'
            }`}
          >
            {activeOverride === 'SYNERGY' && (
              <span className="absolute top-1 right-1 text-[9px] font-bold px-1 bg-purple-600 text-white rounded-xs animate-pulse">
                {overrideRemainingSeconds}s
              </span>
            )}
            <div className="flex items-center gap-1 w-full justify-between">
              <div className="flex items-center gap-1 font-bold text-xs truncate">
                <SynergyOrbitIcon size={14} className={activeOverride === 'SYNERGY' ? 'text-purple-400 animate-spin' : 'text-purple-400'} />
                <span className="truncate">{t('synergy_name')}</span>
              </div>
              <span className="text-[10px] opacity-80 shrink-0 font-normal">
                {t('synergy_cost')}
              </span>
            </div>
            <p className="text-[9.5px] opacity-75 mt-0.5 line-clamp-1 w-full text-white/70">
              {t('synergy_desc')}
            </p>
          </button>
        </div>
      </div>

      {/* ─── Retention Hook: Tactical Override Pack Modal ──────────────── */}
      {showPackModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[260] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none"
        >
          <div className="w-full max-w-sm bg-[#090d16] border border-amber-500/40 rounded-xl p-5 text-white flex flex-col items-center text-center shadow-2xl relative">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-3">
              <SupplyCrateIcon size={24} />
            </div>

            <div className="text-[10px] text-amber-400 uppercase tracking-widest font-bold mb-1">
              [TACTICAL LOGISTICS // MISSION COMPLETE]
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              {t('pack_modal_title')}
            </h3>
            <p className="text-xs text-white/70 mb-4 leading-relaxed">
              {t('pack_modal_desc')}
            </p>

            {/* Reward Requisition List */}
            <div className="w-full bg-white/5 border border-white/10 rounded-lg p-3 mb-4 flex flex-col gap-2 text-left text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <CrosshairIcon size={14} />
                <span>{t('pack_reward_ticket')}</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <CrosshairIcon size={14} />
                <span>{t('pack_reward_booster')}</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400">
                <BatteryCoreIcon size={14} />
                <span>{t('pack_reward_ap')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClaimPack}
              className="w-full py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 font-bold rounded-lg text-xs cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
            >
              <SupplyCrateIcon size={16} />
              <span>{t('pack_claim_btn')}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TacticalCommandHUD;
