import React from 'react';
import {
  useSeasonPass,
  SEASON_TIERS,
  EXP_PER_TIER,
  TOTAL_TIERS,
  PassTier
} from '../../utils/seasonPassStore';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

export interface TacticalSeasonPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
}

const PASS_I18N: Record<string, Record<string, string>> = {
  ko: {
    modalTitle: '시즌 01 // 전술 작전 패스 로드맵',
    badge: '30일 주기 전술 시즌 듀얼 트랙',
    boosterActive: '복귀 특무 프로토콜: 2X EXP 캐치업 부스터 가동 중 [48:00:00]',
    standardTrack: 'STANDARD 트랙 [무료]',
    blackOpsTrack: 'BLACK OPS 트랙 [골드]',
    upgradeBops: '블랙옵스 패스 해금',
    bopsUnlocked: '블랙옵스 권한 승인됨',
    claimAll: '획득 가능 보상 일괄 수령',
    tierLabel: 'TIER',
    claimed: '수령 완료',
    claim: '수령',
    locked: '잠김',
    currentProgress: '현재 진행도',
    close: '닫기'
  },
  en: {
    modalTitle: 'SEASON 01 // TACTICAL ROADMAP PASS',
    badge: '30-DAY OPERATIONAL DUAL-TRACK CADENCE',
    boosterActive: 'RETURN PROTOCOL: 2X EXP CATCH-UP BOOSTER ACTIVE [48:00:00]',
    standardTrack: 'STANDARD TRACK [FREE]',
    blackOpsTrack: 'BLACK OPS TRACK [GOLD]',
    upgradeBops: 'UPGRADE TO BLACK OPS PASS',
    bopsUnlocked: 'BLACK OPS CLEARANCE ACTIVE',
    claimAll: 'CLAIM ALL AVAILABLE REWARDS',
    tierLabel: 'TIER',
    claimed: 'CLAIMED',
    claim: 'CLAIM',
    locked: 'LOCKED',
    currentProgress: 'CURRENT EXP PROGRESS',
    close: 'DISMISS'
  },
  ja: {
    modalTitle: 'シーズン01 // 戦術パスロードマップ',
    badge: '30日周期戦術デュアルトラック',
    boosterActive: '復帰プロトコル: 2倍EXPブースター稼働中 [48:00:00]',
    standardTrack: 'STANDARD トラック [無料]',
    blackOpsTrack: 'BLACK OPS トラック [ゴールド]',
    upgradeBops: 'ブラックオプス開放',
    bopsUnlocked: 'ブラックオプス認可済',
    claimAll: '獲得可能な報酬を一括受取',
    tierLabel: 'TIER',
    claimed: '受取済',
    claim: '受取',
    locked: '未達成',
    currentProgress: '現在の進行度',
    close: '閉じる'
  },
  'zh-CN': {
    modalTitle: '第01赛季 // 战术通行证战备路线',
    badge: '30天周期战术双轨推进体系',
    boosterActive: '回归特别协议: 2倍经验快速追赶推进中 [48:00:00]',
    standardTrack: '标准战术轨 [免费]',
    blackOpsTrack: '黑色行动轨 [黄金特权]',
    upgradeBops: '解锁黑色行动特权',
    bopsUnlocked: '黑色行动权限已激活',
    claimAll: '一键领取所有已解锁物资',
    tierLabel: '等级',
    claimed: '已领取',
    claim: '领取',
    locked: '未解锁',
    currentProgress: '当前经验进度',
    close: '关闭'
  },
  'zh-TW': {
    modalTitle: '第01賽季 // 戰術通行證戰備路線',
    badge: '30天週期戰術雙軌推進體系',
    boosterActive: '回歸特別協議: 2倍經驗快速追趕推進中 [48:00:00]',
    standardTrack: '標準戰術軌 [免費]',
    blackOpsTrack: '黑色行動軌 [黃金特權]',
    upgradeBops: '解鎖黑色行動特權',
    bopsUnlocked: '黑色行動權限已啟用',
    claimAll: '一鍵領取所有已解鎖物資',
    tierLabel: '等級',
    claimed: '已領取',
    claim: '領取',
    locked: '未解鎖',
    currentProgress: '當前經驗進度',
    close: '關閉'
  },
  de: {
    modalTitle: 'SAISON 01 // TAKTIK-PASS-ROADMAP',
    badge: '30-TAGE-DUAL-TRACK-SYSTEM',
    boosterActive: 'RÜCKKEHR-PROTOKOLL: 2X EXP-BOOSTER AKTIV [48:00:00]',
    standardTrack: 'STANDARD-TRACK [KOSTENLOS]',
    blackOpsTrack: 'BLACK-OPS-TRACK [GOLD]',
    upgradeBops: 'BLACK OPS FREISCHALTEN',
    bopsUnlocked: 'BLACK OPS FREIGESCHALTET',
    claimAll: 'ALLE VERFÜGBAREN BEANSPRUCHEN',
    tierLabel: 'TIER',
    claimed: 'ERHALTEN',
    claim: 'HOLEN',
    locked: 'GESPERRT',
    currentProgress: 'AKTUELLER EXP-FORTSCHRITT',
    close: 'SCHLIESSEN'
  },
  es: {
    modalTitle: 'TEMPORADA 01 // PASE TÁCTICO',
    badge: 'CADENCIA DE VÍA DOBLE DE 30 DÍAS',
    boosterActive: 'PROTOCOLO DE RETORNO: REFUERZO 2X EXP ACTIVO [48:00:00]',
    standardTrack: 'PISTA ESTÁNDAR [GRATIS]',
    blackOpsTrack: 'PISTA BLACK OPS [ORO]',
    upgradeBops: 'MEJORAR A BLACK OPS',
    bopsUnlocked: 'BLACK OPS ACTIVO',
    claimAll: 'RECLAMAR TODO LO DISPONIBLE',
    tierLabel: 'TIER',
    claimed: 'RECLAMADO',
    claim: 'RECLAMAR',
    locked: 'BLOQUEADO',
    currentProgress: 'PROGRESO DE EXP',
    close: 'CERRAR'
  },
  fr: {
    modalTitle: 'SAISON 01 // PASSE TACTIQUE',
    badge: 'CADENCE DOUBLE PISTE SUR 30 JOURS',
    boosterActive: 'PROTOCOLE RETOUR: BOOSTER EXP 2X ACTIF [48:00:00]',
    standardTrack: 'PISTE STANDARD [GRATUITE]',
    blackOpsTrack: 'PISTE BLACK OPS [OR]',
    upgradeBops: 'DÉBLOQUER BLACK OPS',
    bopsUnlocked: 'BLACK OPS DÉVERROUILLÉ',
    claimAll: 'TOUT RÉCLAMER',
    tierLabel: 'PALIER',
    claimed: 'RÉCUPÉRÉ',
    claim: 'PRENDRE',
    locked: 'VERROUILLÉ',
    currentProgress: 'PROGRESSION D EXP',
    close: 'FERMER'
  },
  id: {
    modalTitle: 'MUSIM 01 // PASS JALUR TAKTIS',
    badge: 'KADENSI JALUR GANDA 30 HARI',
    boosterActive: 'PROTOKOL KEMBALI: 2X EXP BOOSTER AKTIF [48:00:00]',
    standardTrack: 'JALUR STANDAR [GRATIS]',
    blackOpsTrack: 'JALUR BLACK OPS [EMAS]',
    upgradeBops: 'BUKA BLACK OPS PASS',
    bopsUnlocked: 'BLACK OPS AKTIF',
    claimAll: 'KLAIM SEMUA YANG TERSEDIA',
    tierLabel: 'TIER',
    claimed: 'DIKLAIM',
    claim: 'KLAIM',
    locked: 'TERKUNCI',
    currentProgress: 'PROGRESS EXP SAAT INI',
    close: 'TUTUP'
  },
  ru: {
    modalTitle: 'СЕЗОН 01 // ТАКТИЧЕСКИЙ БОЕВОЙ ПРОПУСК',
    badge: '30-ДНЕВНЫЙ ДВУХУРОВНЕВЫЙ ПРОПУСК',
    boosterActive: 'ПРОТОКОЛ ВОЗВРАЩЕНИЯ: 2X EXP УСКОРИТЕЛЬ [48:00:00]',
    standardTrack: 'СТАНДАРТНАЯ ВЕТКА [БЕСПЛАТНО]',
    blackOpsTrack: 'BLACK OPS ВЕТКА [ЗОЛОТО]',
    upgradeBops: 'ОТКРЫТЬ BLACK OPS',
    bopsUnlocked: 'BLACK OPS АКТИВИРОВАН',
    claimAll: 'ЗАБРАТЬ ВСЕ ДОСТУПНОЕ',
    tierLabel: 'ТИР',
    claimed: 'ПОЛУЧЕНО',
    claim: 'ВЗЯТЬ',
    locked: 'ЗАКРЫТО',
    currentProgress: 'ТЕКУЩИЙ ПРОГРЕСС ОПЫТА',
    close: 'ЗАКРЫТЬ'
  },
  th: {
    modalTitle: 'ซีซั่น 01 // แผนงานพาสยุทธวิธี',
    badge: 'ระบบแทร็กคู่ระยะเวลา 30 วัน',
    boosterActive: 'โปรโตคอลการกลับมา: บูสเตอร์ 2X EXP ทำงานอยู่ [48:00:00]',
    standardTrack: 'แทร็กมาตรฐาน [ฟรี]',
    blackOpsTrack: 'แทร็ก BLACK OPS [ทอง]',
    upgradeBops: 'อัปเกรดเป็น BLACK OPS พาส',
    bopsUnlocked: 'สิทธิ์ BLACK OPS เปิดใช้งานแล้ว',
    claimAll: 'รับรางวัลที่มีทั้งหมด',
    tierLabel: 'ระดับ',
    claimed: 'รับแล้ว',
    claim: 'รับ',
    locked: 'ล็อค',
    currentProgress: 'ความคืบหน้า EXP ปัจจุบัน',
    close: 'ปิด'
  },
  vi: {
    modalTitle: 'MÙA 01 // LỘ TRÌNH VÉ CHIẾN THUẬT',
    badge: 'HỆ THỐNG HAI TUYẾN 30 NGÀY',
    boosterActive: 'GIAO THỨC TRỞ LẠI: TĂNG TỐC 2X EXP ĐANG HOẠT ĐỘNG [48:00:00]',
    standardTrack: 'TUYẾN TIÊU CHUẨN [MIỄN PHÍ]',
    blackOpsTrack: 'TUYẾN BLACK OPS [VÀNG]',
    upgradeBops: 'MỞ KHÓA VÉ BLACK OPS',
    bopsUnlocked: 'QUYỀN BLACK OPS HOẠT ĐỘNG',
    claimAll: 'NHẬN TẤT CẢ PHẦN THƯỞNG KHẢ DỤNG',
    tierLabel: 'BẬC',
    claimed: 'ĐÃ NHẬN',
    claim: 'NHẬN',
    locked: 'ĐÃ KHÓA',
    currentProgress: 'TIẾN TRÌNH EXP HIỆN TẠI',
    close: 'ĐÓNG'
  }
};

export const TacticalSeasonPassModal: React.FC<TacticalSeasonPassModalProps> = ({
  isOpen,
  onClose,
  language: propLang
}) => {
  const { language: contextLang } = useGameSettings();
  const currentLang = propLang || contextLang || 'ko';
  const tr = PASS_I18N[currentLang] || PASS_I18N.ko;

  const {
    passState,
    currentTier,
    isBoosterActive,
    claimTier,
    claimAllAvailable,
    unlockBlackOps
  } = useSeasonPass();

  if (!isOpen) return null;

  const handleClaimAll = () => {
    triggerHaptic('success');
    claimAllAvailable();
  };

  const handleUnlockBops = () => {
    triggerHaptic('medium');
    unlockBlackOps();
  };

  const currentTierExp = passState.currentExp % EXP_PER_TIER;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none font-mono">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#090d16]/95 border border-white/15 rounded-xl p-4 sm:p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-amber-300 tracking-wider uppercase">
                {tr.modalTitle}
              </div>
              <div className="text-[10px] text-gray-400">
                {tr.badge}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Catchup Booster Banner */}
        {isBoosterActive && (
          <div className="mt-2.5 p-2 bg-rose-950/40 border border-rose-500/40 rounded text-rose-300 text-[10px] font-bold flex items-center gap-2 shrink-0 animate-pulse">
            <svg className="w-4 h-4 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>{tr.boosterActive}</span>
          </div>
        )}

        {/* Progress Bar & Actions Bar */}
        <div className="mt-3 p-3 bg-black/60 border border-white/10 rounded-lg shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-amber-400">{tr.tierLabel} {currentTier} / {TOTAL_TIERS}</span>
              <span className="text-[10px] text-gray-400 font-mono">({passState.currentExp} EXP)</span>
            </div>
            <div className="w-full sm:w-64 h-2 bg-black/80 rounded-full overflow-hidden border border-white/15">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${(currentTierExp / EXP_PER_TIER) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!passState.isBlackOpsUnlocked ? (
              <button
                onClick={handleUnlockBops}
                className="flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold rounded text-xs transition-all active:scale-95 shadow-md"
              >
                {tr.upgradeBops}
              </button>
            ) : (
              <span className="text-[10px] px-3 py-1 bg-amber-950/60 border border-amber-500/50 text-amber-300 rounded font-bold">
                {tr.bopsUnlocked}
              </span>
            )}

            <button
              onClick={handleClaimAll}
              className="flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-bold rounded text-xs transition-all active:scale-95"
            >
              {tr.claimAll}
            </button>
          </div>
        </div>

        {/* Dual Track Scrollable Matrix (Horizontal Snap) */}
        <div className="mt-3 flex-1 overflow-x-auto overflow-y-hidden border border-white/10 rounded-lg p-3 bg-black/40">
          <div className="flex items-stretch gap-3 min-w-max pb-2">
            {SEASON_TIERS.map((tierItem) => {
              const isTierReached = currentTier >= tierItem.tier;
              const isFreeClaimed = passState.claimedFreeTiers.includes(tierItem.tier);
              const isBopsClaimed = passState.claimedBlackOpsTiers.includes(tierItem.tier);

              return (
                <div
                  key={tierItem.tier}
                  className={`w-36 rounded-lg border p-2 flex flex-col justify-between select-none ${
                    isTierReached
                      ? 'bg-black/70 border-amber-500/40 shadow-sm'
                      : 'bg-black/30 border-white/5 opacity-60'
                  }`}
                >
                  {/* Tier Number Indicator */}
                  <div className="flex justify-between items-center text-[10px] pb-1 border-b border-white/10">
                    <span className="font-bold text-amber-400">{tr.tierLabel} {tierItem.tier}</span>
                    <span className="text-[9px] text-gray-500">{tierItem.expRequired} EXP</span>
                  </div>

                  {/* Standard Free Track Box */}
                  <div className="my-1.5 p-2 bg-slate-950/60 border border-white/10 rounded text-[10px]">
                    <div className="text-[8px] text-gray-400 font-bold">STANDARD</div>
                    <div className="text-white font-bold truncate mt-0.5">{tierItem.freeReward.title}</div>
                    <div className="mt-1">
                      {isFreeClaimed ? (
                        <span className="text-[8px] text-gray-500 font-bold">{tr.claimed}</span>
                      ) : isTierReached ? (
                        <button
                          onClick={() => {
                            triggerHaptic('tap');
                            claimTier(tierItem.tier, 'free');
                          }}
                          className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded text-[8px] font-bold"
                        >
                          {tr.claim}
                        </button>
                      ) : (
                        <span className="text-[8px] text-gray-600">{tr.locked}</span>
                      )}
                    </div>
                  </div>

                  {/* BlackOps Gold Track Box */}
                  <div className={`p-2 rounded text-[10px] border ${
                    tierItem.blackOpsReward.isHighlight
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                      : 'bg-black/80 border-amber-500/20 text-gray-300'
                  }`}>
                    <div className="text-[8px] text-amber-400 font-bold flex items-center justify-between">
                      <span>BLACK OPS</span>
                      {tierItem.blackOpsReward.isHighlight && <span>⭐</span>}
                    </div>
                    <div className="text-amber-200 font-bold truncate mt-0.5">{tierItem.blackOpsReward.title}</div>
                    <div className="mt-1">
                      {isBopsClaimed ? (
                        <span className="text-[8px] text-gray-500 font-bold">{tr.claimed}</span>
                      ) : isTierReached && passState.isBlackOpsUnlocked ? (
                        <button
                          onClick={() => {
                            triggerHaptic('tap');
                            claimTier(tierItem.tier, 'blackOps');
                          }}
                          className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded text-[8px] font-bold"
                        >
                          {tr.claim}
                        </button>
                      ) : (
                        <span className="text-[8px] text-gray-600">{tr.locked}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="min-h-[44px] px-6 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 rounded-lg text-xs font-bold transition-colors"
          >
            {tr.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TacticalSeasonPassModal;
