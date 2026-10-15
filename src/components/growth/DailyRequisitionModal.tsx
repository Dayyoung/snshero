import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { trackFunnelStep } from '../../utils/analytics';
import { CardData, CardRarity } from '../../types';
import { CARD_DATABASE } from '../../cardDatabase';

export interface DailyRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipAndPlay?: (acquiredCards: CardData[]) => void;
  language?: string;
  className?: string;
}

// ─── Zero-Emoji Inline SVG Icons (strokeWidth="1.75") ─────────────────
const SupplyCrateIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
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

const RadarScanIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
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
    <path d="M12 2a10 10 0 0 1 10 10" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="12" x2="19" y2="5" />
  </svg>
);

const CheckShieldIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
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
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const CrosshairTargetIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
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

const CloseIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── 12-Language i18n Dictionary ───────────────────────────────────────
const I18N_REQUISITION: Record<string, Record<string, string>> = {
  ko: {
    header_badge: '일일 전술 보급 작전 // DAILY REQUISITION',
    title: '일일 무료 10연차 전술 보급품',
    subtitle: '매일 00시 KST 정밀 충전되는 정규 보급 프로토콜입니다.',
    ready_badge: '보급 대기 [10/10]',
    claimed_badge: '금일 수령 완료',
    btn_unpack: '무료 10연차 보급품 개봉',
    btn_equip_and_go: '획득 유닛 덱 편성 & 일일 퀘스트 출격',
    btn_close: '창 닫기',
    scanning_text: '전술 위성 보급 패킷 스캔 중...',
    rarity_ssr: 'SSR 극비 유닛',
    rarity_sr: 'SR 전술 유닛',
    rarity_r: 'R 정규 유닛',
  },
  en: {
    header_badge: 'TACTICAL REQUISITION // DAILY PROTOCOL',
    title: 'FREE DAILY 10X TACTICAL CRATE',
    subtitle: 'Refills daily at 00:00 KST precision military schedule.',
    ready_badge: 'READY [10/10]',
    claimed_badge: 'CLAIMED TODAY',
    btn_unpack: 'UNSEAL FREE 10X REQUISITION',
    btn_equip_and_go: 'EQUIP TO DECK & DEPLOY TO MISSIONS',
    btn_close: 'CLOSE',
    scanning_text: 'Scanning orbital supply packets...',
    rarity_ssr: 'SSR CLASSIFIED',
    rarity_sr: 'SR TACTICAL',
    rarity_r: 'R STANDARD',
  },
  ja: {
    header_badge: 'デイリー戦術補給作戦 // DAILY REQUISITION',
    title: '毎日無料10連戦術補給パック',
    subtitle: '毎日00:00 KSTに自動補給される正規プロトコルです。',
    ready_badge: '補給可能 [10/10]',
    claimed_badge: '本日受取済',
    btn_unpack: '無料10連補給パックを開封',
    btn_equip_and_go: '獲得ユニットをデッキ編成＆任務出撃',
    btn_close: '閉じる',
    scanning_text: '補給パケット暗号解読中...',
    rarity_ssr: 'SSR 極秘ユニット',
    rarity_sr: 'SR 戦術ユニット',
    rarity_r: 'R 正規ユニット',
  },
  'zh-CN': {
    header_badge: '每日战术补给行动 // DAILY REQUISITION',
    title: '每日免费10连战术补给箱',
    subtitle: '每日00:00 KST精准补给的军用物资协议。',
    ready_badge: '补给就绪 [10/10]',
    claimed_badge: '今日已领取',
    btn_unpack: '解密免费10连补给箱',
    btn_equip_and_go: '装配至牌组并立即出击',
    btn_close: '关闭',
    scanning_text: '正在扫描轨道物资包...',
    rarity_ssr: 'SSR 极密机体',
    rarity_sr: 'SR 战术机体',
    rarity_r: 'R 标准机体',
  },
  'zh-TW': {
    header_badge: '每日戰術補給行動 // DAILY REQUISITION',
    title: '每日免費10連戰術補給箱',
    subtitle: '每日00:00 KST精準補給的軍用物資協議。',
    ready_badge: '補給就緒 [10/10]',
    claimed_badge: '今日已領取',
    btn_unpack: '解密免費10連補給箱',
    btn_equip_and_go: '裝配至牌組並立即出擊',
    btn_close: '關閉',
    scanning_text: '正在掃描軌道物資包...',
    rarity_ssr: 'SSR 極密機體',
    rarity_sr: 'SR 戰術機體',
    rarity_r: 'R 標準機體',
  },
  es: {
    header_badge: 'SUMINISTRO TÁCTICO // PROTOCOLO DIARIO',
    title: 'PAQUETE DIARIO 10X GRATIS',
    subtitle: 'Recarga diaria a las 00:00 KST con precisión militar.',
    ready_badge: 'LISTO [10/10]',
    claimed_badge: 'RECLAMADO HOY',
    btn_unpack: 'ABRIR REQUISICIÓN GRATIS',
    btn_equip_and_go: 'EQUIPAR AL MAZO Y SALIR A MISIÓN',
    btn_close: 'CERRAR',
    scanning_text: 'Escaneando paquetes de suministros...',
    rarity_ssr: 'SSR CLASIFICADO',
    rarity_sr: 'SR TÁCTICO',
    rarity_r: 'R ESTÁNDAR',
  },
  fr: {
    header_badge: 'RAVITAILLEMENT TACTIQUE // QUOTIDIEN',
    title: 'PACK TACTIQUE 10X GRATUIT DU JOUR',
    subtitle: 'Réapprovisionné chaque jour à 00:00 KST.',
    ready_badge: 'PRÊT [10/10]',
    claimed_badge: 'RÉCLAMÉ AUJOURD HUI',
    btn_unpack: 'OUVRIR LE PACK 10X GRATUIT',
    btn_equip_and_go: 'ÉQUIPER AU DECK ET DÉPLOYER',
    btn_close: 'FERMER',
    scanning_text: 'Analyse des paquets orbitaux...',
    rarity_ssr: 'SSR CLASSIFIÉ',
    rarity_sr: 'SR TACTIQUE',
    rarity_r: 'R STANDARD',
  },
  de: {
    header_badge: 'TAKTIK-VERSORGUNG // TÄGLICHE MISSION',
    title: 'TÄGLICHES KOSTENLOSES 10X PAKET',
    subtitle: 'Täglich um 00:00 Uhr KST neu verfügbar.',
    ready_badge: 'BEREIT [10/10]',
    claimed_badge: 'HEUTE EINGELÖST',
    btn_unpack: '10X NACHSCHUB ÖFFNEN',
    btn_equip_and_go: 'INS DECK AUSRÜSTEN & STARTEN',
    btn_close: 'SCHLIESSEN',
    scanning_text: 'Scanne orbitale Vorratspakete...',
    rarity_ssr: 'SSR GEHEIM',
    rarity_sr: 'SR TAKTISCH',
    rarity_r: 'R STANDARD',
  },
  vi: {
    header_badge: 'TIẾP TẾ CHIẾN THUẬT // HÀNG NGÀY',
    title: 'GÓI TIẾP TẾ 10X MIỄN PHÍ MỖI NGÀY',
    subtitle: 'Làm mới mỗi ngày lúc 00:00 KST.',
    ready_badge: 'SẴN SÀNG [10/10]',
    claimed_badge: 'HÔM NAY ĐÃ NHẬN',
    btn_unpack: 'MỞ HÒM TIẾP TẾ 10X',
    btn_equip_and_go: 'TRANG BỊ VÀO BỘ BÀI & XUẤT TRẬN',
    btn_close: 'ĐÓNG',
    scanning_text: 'Đang quét dữ liệu tiếp tế...',
    rarity_ssr: 'SSR TỐI MẬT',
    rarity_sr: 'SR CHIẾN THUẬT',
    rarity_r: 'R TIÊU CHUẨN',
  },
  th: {
    header_badge: 'ยุทธการเสบียงยุทธวิธี // ประจำวัน',
    title: 'แพ็กเสบียง 10 สุ่มฟรีประจำวัน',
    subtitle: 'รีเซ็ตทุกวันเวลา 00:00 KST.',
    ready_badge: 'พร้อมรับ [10/10]',
    claimed_badge: 'รับแล้ววันนี้',
    btn_unpack: 'เปิดกล่องเสบียงฟรี 10 สุ่ม',
    btn_equip_and_go: 'ติดตั้งเข้าเด็ค & ออกรบภารกิจ',
    btn_close: 'ปิด',
    scanning_text: 'กำลังสแกนพัสดุเสบียง...',
    rarity_ssr: 'SSR ลับสุดยอด',
    rarity_sr: 'SR ยุทธวิธี',
    rarity_r: 'R มาตรฐาน',
  },
  id: {
    header_badge: 'PASOKAN TAKTIS // PROTOKOL HARIAN',
    title: 'KOTAK TAKTIS 10X GRATIS HARIAN',
    subtitle: 'Isi ulang harian pada 00:00 KST.',
    ready_badge: 'SIAP [10/10]',
    claimed_badge: 'DIKLAIM HARI INI',
    btn_unpack: 'BUKA PASOKAN 10X GRATIS',
    btn_equip_and_go: 'PASANG KE DEK & JALANKAN MISI',
    btn_close: 'TUTUP',
    scanning_text: 'Memindai paket pasokan orbital...',
    rarity_ssr: 'SSR RAHASIA',
    rarity_sr: 'SR TAKTIS',
    rarity_r: 'R STANDAR',
  },
  ru: {
    header_badge: 'ТАКТИЧЕСКОЕ СНАБЖЕНИЕ // ЕЖЕДНЕВНО',
    title: 'БЕСПЛАТНЫЙ ЕЖЕДНЕВНЫЙ НАБОР 10X',
    subtitle: 'Сброс каждый день в 00:00 KST.',
    ready_badge: 'ГОТОВО [10/10]',
    claimed_badge: 'ПОЛУЧЕНО СЕГОДНЯ',
    btn_unpack: 'ОТКРЫТЬ 10X СНАБЖЕНИЕ',
    btn_equip_and_go: 'ЭКИПИРОВАТЬ В КОЛОДУ И В БОЙ',
    btn_close: 'ЗАКРЫТЬ',
    scanning_text: 'Сканирование орбитальных контейнеров...',
    rarity_ssr: 'SSR СЕКРЕТНО',
    rarity_sr: 'SR ТАКТИЧЕСКИЙ',
    rarity_r: 'R СТАНДАРТ',
  },
};

const STORAGE_KEY_DAILY_REQUISITION = 'snshero_daily_requisition_date';

/** Helper to get current KST date key (YYYY-MM-DD) */
export function getKstDateKey(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 3600000);
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const d = String(kst.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Check if today's requisition has been claimed */
export function isDailyRequisitionClaimedToday(): boolean {
  try {
    const claimedDate = localStorage.getItem(STORAGE_KEY_DAILY_REQUISITION);
    return claimedDate === getKstDateKey();
  } catch {
    return false;
  }
}

/** Mark today's requisition as claimed */
export function setDailyRequisitionClaimed(): void {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY_REQUISITION, getKstDateKey());
  } catch {}
}

export const DailyRequisitionModal: React.FC<DailyRequisitionModalProps> = ({
  isOpen,
  onClose,
  onEquipAndPlay,
  language: propLang,
  className = '',
}) => {
  const { language: ctxLang } = useGameSettings();
  const rawLang = propLang || ctxLang || 'ko';
  const langKey = I18N_REQUISITION[rawLang] ? rawLang : 'en';
  const t = (k: string) => I18N_REQUISITION[langKey]?.[k] || I18N_REQUISITION['en']?.[k] || k;

  const [step, setStep] = useState<'READY' | 'OPENING' | 'REVEALED'>('READY');
  const [cards, setCards] = useState<CardData[]>([]);

  // Check initial claim state
  const isClaimedToday = useMemo(() => isDailyRequisitionClaimedToday(), []);

  useEffect(() => {
    if (isOpen) {
      trackFunnelStep('daily_supply_view', { is_claimed_today: isClaimedToday });
    }
  }, [isOpen, isClaimedToday]);

  const handleUnseal = () => {
    trackFunnelStep('daily_gacha_trigger');
    setStep('OPENING');

    // Generate 10 cards with at least 1 guaranteed SSR/SR
    const generated: CardData[] = [];
    const pool = Object.values(CARD_DATABASE);

    for (let i = 0; i < 10; i++) {
      let pick: any;
      // Guaranteed high rarity on 10th card
      if (i === 9) {
        const highTier = pool.filter(c => c.rarity === 'legendary' || c.rarity === 'gold');
        pick = highTier[Math.floor(Math.random() * highTier.length)];
      } else {
        const rand = Math.random();
        if (rand < 0.15) {
          const ssr = pool.filter(c => c.rarity === 'legendary');
          pick = ssr[Math.floor(Math.random() * ssr.length)];
        } else if (rand < 0.45) {
          const sr = pool.filter(c => c.rarity === 'gold');
          pick = sr[Math.floor(Math.random() * sr.length)];
        } else {
          const normal = pool.filter(c => c.rarity === 'silver' || c.rarity === 'bronze');
          pick = normal[Math.floor(Math.random() * normal.length)];
        }
      }

      if (!pick && pool.length > 0) {
        pick = pool[i % pool.length];
      }

      if (pick) {
        generated.push({
          id: String(pick.id || (1000 + i)),
          title_dis: pick.title || 'Tactical Unit',
          title: pick.title || 'Tactical Unit',
          title_en: pick.title_en || pick.title || 'Tactical Unit',
          power: pick.power || 120,
          rarity: (pick.rarity || 'bronze') as CardRarity,
          stats: pick.stats || [5, 5, 5, 5],
          element: pick.element || 'water',
          level: 1,
        });
      }
    }

    setTimeout(() => {
      setCards(generated);
      setStep('REVEALED');
      setDailyRequisitionClaimed();
      trackFunnelStep('daily_gacha_complete', { count: generated.length });
    }, 1200);
  };

  const handleEquipAndDeploy = () => {
    trackFunnelStep('deck_equip_quick', { card_count: cards.length });
    if (onEquipAndPlay) {
      onEquipAndPlay(cards);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none touch-none font-mono"
    >
      <div
        className={`w-full max-w-lg bg-[#090d16] border border-[#646262]/40 rounded-none p-4 sm:p-5 text-white flex flex-col shadow-2xl relative max-h-[92dvh] overflow-y-auto ${className}`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors p-1 rounded-sm border border-white/10 hover:border-white/30"
          aria-label={t('btn_close')}
        >
          <CloseIcon size={16} />
        </button>

        {/* Top Header */}
        <div className="flex items-center gap-2 mb-2">
          <SupplyCrateIcon size={16} className="text-stone-400 shrink-0" />
          <span className="text-[10px] tracking-wider text-amber-400 font-bold uppercase">
            [{t('header_badge')}]
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-white mb-1">
          {t('title')}
        </h2>
        <p className="text-xs text-stone-400 mb-4">
          {t('subtitle')}
        </p>

        {/* Status Badge */}
        <div className="flex items-center justify-between bg-stone-950 border border-stone-800 rounded-none p-2.5 mb-4 text-xs">
          <div className="flex items-center gap-2 text-stone-400">
            <CheckShieldIcon size={16} className="text-stone-300" />
            <span>KST 00:00 - 23:59</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-sm font-bold text-[10px] border ${
              isClaimedToday && step === 'READY'
                ? 'bg-stone-900 text-stone-500 border-stone-800'
                : 'bg-stone-900 text-amber-300 border-amber-500/50'
            }`}
          >
            {isClaimedToday && step === 'READY' ? t('claimed_badge') : t('ready_badge')}
          </span>
        </div>

        {/* Content Stages */}
        {step === 'READY' && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 rounded-none bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-400 mb-4">
              <SupplyCrateIcon size={32} />
            </div>
            <p className="text-xs text-stone-300 max-w-xs mb-5">
              10개의 암호화 전술 보급 팩이 도킹되었습니다. 개봉 시 최소 1장 이상의 고위 전술 유닛이 보장됩니다.
            </p>
            <button
              type="button"
              disabled={isClaimedToday}
              onClick={handleUnseal}
              className={`w-full py-3.5 rounded-sm font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors min-h-[48px] ${
                isClaimedToday
                  ? 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
                  : 'bg-[#201d1d] hover:bg-stone-800 border border-amber-500/60 text-amber-300'
              }`}
            >
              <SupplyCrateIcon size={16} />
              <span>{isClaimedToday ? t('claimed_badge') : t('btn_unpack')}</span>
            </button>
          </div>
        )}

        {step === 'OPENING' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-none bg-stone-900 border border-amber-400 flex items-center justify-center text-amber-300 mb-4 animate-spin">
              <RadarScanIcon size={32} />
            </div>
            <span className="text-xs font-bold text-amber-400">
              {t('scanning_text')}
            </span>
          </div>
        )}

        {step === 'REVEALED' && (
          <div className="flex flex-col flex-1">
            {/* 2x5 Card Grid */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-4">
              {cards.map((c, idx) => {
                const isSsr = c.rarity === 'legendary' || c.rarity === 'mythic';
                const isSr = c.rarity === 'gold';
                return (
                  <div
                    key={`${c.id}-${idx}`}
                    className={`aspect-[3/4] rounded-none p-1.5 flex flex-col justify-between border text-[9px] relative overflow-hidden transition-colors ${
                      isSsr
                        ? 'bg-stone-900 border-amber-400 text-amber-300'
                        : isSr
                        ? 'bg-stone-900 border-stone-600 text-stone-200'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[8px] font-bold">
                      <span className={isSsr ? 'text-amber-300 font-extrabold' : isSr ? 'text-stone-300' : 'text-stone-500'}>
                        {isSsr ? 'SSR' : isSr ? 'SR' : 'R'}
                      </span>
                      <CrosshairTargetIcon size={9} className="opacity-60" />
                    </div>

                    <div className="text-center my-auto">
                      <div className="text-[10px] font-bold truncate">
                        {rawLang === 'ko' ? c.title : c.title_en || c.title}
                      </div>
                      <div className="text-[8px] opacity-70">
                        PWR {c.power || 120}
                      </div>
                    </div>

                    <div className="text-[7.5px] opacity-50 text-right">
                      #{c.id}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Action CTA */}
            <button
              type="button"
              onClick={handleEquipAndDeploy}
              className="w-full py-3.5 bg-[#201d1d] hover:bg-stone-800 border border-stone-700 text-stone-100 font-bold rounded-sm text-xs cursor-pointer min-h-[48px] flex items-center justify-center gap-2 uppercase tracking-wider transition-colors"
            >
              <CheckShieldIcon size={16} />
              <span>{t('btn_equip_and_go')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRequisitionModal;
