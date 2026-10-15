import React, { useState, useEffect } from 'react';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

export interface TacticalQuickStrikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterLobby: () => void;
  language?: string;
}

const STRIKE_I18N: Record<string, Record<string, string>> = {
  ko: {
    modalTitle: '긴급 요격 작전 // 고속 약점 타격',
    callsignPrefix: '임시 군용 콜사인 자동 인가:',
    weaknessInstruction: '적 코어 약점 헥사곤을 터치하여 요격 미사일을 유도하세요!',
    tapToStrike: '약점 집중 타격',
    striking: '약점 관통 타격 중... 9,999 CRITICAL!',
    commissionConfirmed: '임관 승인 // 긴급 작전 완료',
    rewardDesc: '초기 요격 작전 완수 보급품이 계정에 즉시 인가되었습니다.',
    rewardCredits: '500 전술 크레딧',
    rewardDrone: 'SSR 전술 지원 드론 (AERO-X)',
    enterLobbyBtn: '사령부 메인 로비로 진입'
  },
  en: {
    modalTitle: 'EMERGENCY INTERCEPT // QUICK STRIKE PROTOCOL',
    callsignPrefix: 'GUEST MILITARY CALLSIGN ASSIGNED:',
    weaknessInstruction: 'TAP THE FLASHING WEAKNESS HEXAGON TO FIRE KINETIC IMPACT!',
    tapToStrike: 'STRIKE WEAKNESS',
    striking: 'PIERCING WEAKNESS... 9,999 CRITICAL!',
    commissionConfirmed: 'COMMISSION CONFIRMED // REWARD GRANTED',
    rewardDesc: 'Initial intercept mission accomplished. Combat supplies transferred.',
    rewardCredits: '500 TACTICAL CREDITS',
    rewardDrone: 'SSR SUPPORT DRONE (AERO-X)',
    enterLobbyBtn: 'ENTER COMMAND LOBBY'
  },
  ja: {
    modalTitle: '緊急迎撃作戦 // 高速弱点打撃',
    callsignPrefix: '軍用臨時コールサイン自動付与:',
    weaknessInstruction: '点滅するコア弱点ヘキサゴンをタップして迎撃してください！',
    tapToStrike: '弱点集中打撃',
    striking: '弱点貫通攻撃中... 9,999 CRITICAL!',
    commissionConfirmed: '任官承認 // 作戦完了',
    rewardDesc: '初期迎撃任務完了。戦備物資が支給されました。',
    rewardCredits: '500 戦術クレジット',
    rewardDrone: 'SSR 戦術支援ドローン (AERO-X)',
    enterLobbyBtn: '司令部メインロビーへ進出'
  },
  'zh-CN': {
    modalTitle: '紧急拦截作战 // 极速弱点打击',
    callsignPrefix: '自动配发军用战术呼号:',
    weaknessInstruction: '点击闪烁的核心弱点六角靶心，引导动能重击！',
    tapToStrike: '击破致命弱点',
    striking: '弱点贯通打击中... 9,999 CRITICAL!',
    commissionConfirmed: '授命受编完成 // 战备奖励发放完毕',
    rewardDesc: '首战拦截行动圆满达成，战术物资已即时入库。',
    rewardCredits: '500 战术积分',
    rewardDrone: 'SSR 战术支援无人机 (AERO-X)',
    enterLobbyBtn: '进入主指挥大厅'
  },
  'zh-TW': {
    modalTitle: '緊急攔截作戰 // 極速弱點打擊',
    callsignPrefix: '自動配發軍用戰術呼號:',
    weaknessInstruction: '點擊閃爍的核心弱點六角靶心，引導動能重擊！',
    tapToStrike: '擊破致命弱點',
    striking: '弱點貫穿打擊中... 9,999 CRITICAL!',
    commissionConfirmed: '授命受編完成 // 戰備獎勵發放完畢',
    rewardDesc: '首戰攔截行動圓滿達成，戰術物資已即時入庫。',
    rewardCredits: '500 戰術積分',
    rewardDrone: 'SSR 戰術支援無人機 (AERO-X)',
    enterLobbyBtn: '進入主指揮大廳'
  },
  de: {
    modalTitle: 'NOTFALL-ABFANGJAGD // SCHWACHSTELLEN-SCHLAG',
    callsignPrefix: 'MILITÄR-RUFNAME ZUGEWIESEN:',
    weaknessInstruction: 'TIPPEN SIE AUF DAS BLINKENDE SECHSECK FÜR DEN EINSCHLAG!',
    tapToStrike: 'SCHWACHSTELLE TREFFEN',
    striking: 'DURCHDRINGUNG... 9.999 KRITISCHER SCHADEN!',
    commissionConfirmed: 'KOMMISSION BESTÄTIGT // BELOHNUNG GEWÄHRT',
    rewardDesc: 'Erste Abfangmission erfolgreich. Nachschub gutgeschrieben.',
    rewardCredits: '500 TAKTIK-CREDITS',
    rewardDrone: 'SSR-DROHNE (AERO-X)',
    enterLobbyBtn: 'ZUR HAUPTZENTRALE'
  },
  es: {
    modalTitle: 'INTERCEPCIÓN DE EMERGENCIA // ATAQUE RÁPIDO',
    callsignPrefix: 'INDICATIVO MILITAR ASIGNADO:',
    weaknessInstruction: '¡TOCA EL HEXÁGONO PARPADEANTE PARA DISPARAR!',
    tapToStrike: 'GOLPEAR DEBILIDAD',
    striking: 'PERFORANDO DEBILIDAD... 9,999 CRÍTICO!',
    commissionConfirmed: 'COMISIÓN CONFIRMADA // RECOMPENSA OTORGADA',
    rewardDesc: 'Misión cumplida. Suministros transferidos a su cuenta.',
    rewardCredits: '500 CRÉDITOS TÁCTICOS',
    rewardDrone: 'DRON DE APOYO SSR (AERO-X)',
    enterLobbyBtn: 'ENTRAR AL VESTÍBULO DE MANDO'
  },
  fr: {
    modalTitle: 'INTERCEPTION D URGENCE // FRAPPE RAPIDE',
    callsignPrefix: 'INDICATIF MILITAIRE ATTRIBUÉ:',
    weaknessInstruction: 'TOUCHEZ L HEXAGONE CLIGNOTANT POUR DÉCLENCHER LA FRAPPE !',
    tapToStrike: 'FRAPPER LE POINT FAIBLE',
    striking: 'POINT FAIBLE TOUCHÉ... 9 999 CRITIQUE !',
    commissionConfirmed: 'COMMISSION CONFIRMÉE // RÉCOMPENSE ACCORDÉE',
    rewardDesc: 'Interception réussie. Ressources transférées.',
    rewardCredits: '500 CRÉDITS TACTIQUES',
    rewardDrone: 'DRONE DE SOUTIEN SSR (AERO-X)',
    enterLobbyBtn: 'ENTRER DANS LE QG'
  },
  id: {
    modalTitle: 'PENCEGATAN DARURAT // SERANGAN CEPAT',
    callsignPrefix: 'CALLSIGN MILITER DIBERIKAN:',
    weaknessInstruction: 'KETUK HEKSAGON BERKEDIP UNTUK MELUNCURKAN SERANGAN!',
    tapToStrike: 'SERANG TITIK LEMAH',
    striking: 'MENEMBUS TITIK LEMAH... 9.999 KRITIS!',
    commissionConfirmed: 'KOMISI DIKONFIRMASI // HADIAH DIBERIKAN',
    rewardDesc: 'Misi pencegatan awal berhasil. Pasokan telah masuk.',
    rewardCredits: '500 KREDIT TAKTIS',
    rewardDrone: 'DRONE DUKUNGAN SSR (AERO-X)',
    enterLobbyBtn: 'MASUK KE LOBI KOMANDO'
  },
  ru: {
    modalTitle: 'ЭКСТРЕННЫЙ ПЕРЕХВАТ // БЫСТРЫЙ УДАР',
    callsignPrefix: 'ВОЕННЫЙ ПОЗЫВНОЙ ПРИСВОЕН:',
    weaknessInstruction: 'НАЖМИТЕ НА МИГАЮЩУЮ ТОЧКУ УЯЗВИМОСТИ ДЛЯ УДАРА!',
    tapToStrike: 'УДАР ПО УЯЗВИМОСТИ',
    striking: 'ПРОБИТИЕ... 9,999 КРИТИЧЕСКИЙ УРОН!',
    commissionConfirmed: 'ЗАЧИСЛЕНИЕ ПОДТВЕРЖДЕНО // НАГРАДА ВЫДАНА',
    rewardDesc: 'Первая операция завершена успешно. Снабжение начислено.',
    rewardCredits: '500 ТАКТИЧЕСКИХ КРЕДИТОВ',
    rewardDrone: 'SSR ДРОН ПОДДЕРЖКИ (AERO-X)',
    enterLobbyBtn: 'ВОЙТИ В КОМАНДНЫЙ ШТАБ'
  },
  th: {
    modalTitle: 'การสกัดกั้นฉุกเฉิน // โปรโตคอลโจมตีเร็ว',
    callsignPrefix: 'กำหนดสัญญาณเรียกขานทางทหาร:',
    weaknessInstruction: 'แตะที่จุดอ่อนหกเหลี่ยมที่กะพริบเพื่อยิงขีปนาวุธ!',
    tapToStrike: 'โจมตีจุดอ่อน',
    striking: 'กำลังเจาะจุดอ่อน... 9,999 คริติคอล!',
    commissionConfirmed: 'ยืนยันการแต่งตั้ง // มอบรางวัลแล้ว',
    rewardDesc: 'ภารกิจสกัดกั้นเริ่มต้นสำเร็จ มอบเสบียงรบเข้าบัญชีแล้ว',
    rewardCredits: '500 เครดิตยุทธวิธี',
    rewardDrone: 'โดรนสนับสนุน SSR (AERO-X)',
    enterLobbyBtn: 'เข้าสู่ล็อบบี้กองบัญชาการ'
  },
  vi: {
    modalTitle: 'ĐÁNH CHẶN KHẨN CẤP // TẤN CÔNG NHANH',
    callsignPrefix: 'ĐÃ CẤP MẬT DANH QUÂN SỰ:',
    weaknessInstruction: 'CHẠM VÀO ĐIỂM YẾU LỤC GIÁC NHẤP NHÁY ĐỂ KÍCH NỔ!',
    tapToStrike: 'ĐÁNH VÀO ĐIỂM YẾU',
    striking: 'XUYÊN PHÁ ĐIỂM YẾU... 9.999 CHÍ MẠNG!',
    commissionConfirmed: 'XÁC NHẬN BỔ NHIỆM // ĐÃ TRAO THƯỞNG',
    rewardDesc: 'Hoàn thành nhiệm vụ đánh chặn đầu tiên. Tiếp tế đã được gửi.',
    rewardCredits: '500 TÍN DỤNG CHIẾN THUẬT',
    rewardDrone: 'DRONE HỖ TRỢ SSR (AERO-X)',
    enterLobbyBtn: 'TIẾN VÀO SẢNH CHỈ HUY'
  }
};

export const TacticalQuickStrikeModal: React.FC<TacticalQuickStrikeModalProps> = ({
  isOpen,
  onClose,
  onEnterLobby,
  language: propLang
}) => {
  const { language: contextLang } = useGameSettings();
  const currentLang = propLang || contextLang || 'ko';
  const tr = STRIKE_I18N[currentLang] || STRIKE_I18N.ko;

  const [callsign, setCallsign] = useState('OPERATOR #7429');
  const [phase, setPhase] = useState<'AIMING' | 'STRIKING' | 'CONFIRMED'>('AIMING');

  useEffect(() => {
    if (isOpen) {
      try {
        let savedProfile = localStorage.getItem('snshero_guest_profile');
        if (!savedProfile) {
          const randNum = Math.floor(1000 + Math.random() * 9000);
          const generated = `OPERATOR #${randNum}`;
          savedProfile = generated;
          localStorage.setItem('snshero_guest_profile', generated);
          localStorage.setItem('hero_user_name', generated);

          if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
            (window as unknown as { gtag: Function }).gtag('event', 'guest_callsign_assigned', { callsign: generated });
          }
        }
        setCallsign(savedProfile);
      } catch {}
      setPhase('AIMING');
    }
  }, [isOpen]);

  const handleStrikeTap = () => {
    triggerHaptic('heavy');
    setPhase('STRIKING');

    if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
      (window as unknown as { gtag: Function }).gtag('event', 'quick_strike_tap', { callsign });
    }

    setTimeout(() => {
      setPhase('CONFIRMED');
      triggerHaptic('victory');

      try {
        const curCredits = parseInt(localStorage.getItem('hero_user_credits') || '0', 10);
        localStorage.setItem('hero_user_credits', (curCredits + 500).toString());
        localStorage.setItem('hero_support_drone_unlocked', 'true');
        localStorage.setItem('snshero_quick_strike_completed', 'true');
      } catch {}

      if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
        (window as unknown as { gtag: Function }).gtag('event', 'first_combat_cleared', { callsign });
      }
    }, 2200);
  };

  const handleFinish = () => {
    triggerHaptic('tap');
    onClose();
    onEnterLobby();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none font-mono">
      <div className="relative w-full max-w-lg bg-[#090d16]/95 border border-white/15 rounded-xl p-5 sm:p-6 text-white shadow-2xl space-y-4">
        {/* Header with Callsign */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
            <span className="text-[11px] font-bold text-cyan-300 tracking-wider uppercase">
              {tr.modalTitle}
            </span>
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

        {/* Callsign Auto-Granted Banner */}
        <div className="p-2.5 bg-black/60 border border-cyan-500/30 rounded flex justify-between items-center text-xs">
          <span className="text-gray-400 text-[10px]">{tr.callsignPrefix}</span>
          <span className="text-cyan-400 font-bold tracking-wider">{callsign}</span>
        </div>

        {/* PHASE 1: AIMING TARGET */}
        {phase === 'AIMING' && (
          <div className="flex flex-col items-center py-4 space-y-4">
            <p className="text-xs text-center text-gray-300 max-w-xs">
              {tr.weaknessInstruction}
            </p>

            {/* Target Reticle with 64x64 Pulsating Hexagon */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-spin" style={{ animationDuration: '8s' }} />
              <div className="absolute inset-4 rounded-full border border-dashed border-cyan-500/40" />

              {/* Pulsating Hexagon Weakness Button (min 64x64px touch target) */}
              <button
                onClick={handleStrikeTap}
                className="w-20 h-20 bg-rose-500/20 hover:bg-rose-500/40 border-2 border-rose-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 animate-pulse shadow-lg shadow-rose-950/80 z-10"
              >
                <svg className="w-8 h-8 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                </svg>
                <span className="text-[9px] font-bold text-rose-300 mt-0.5">WEAKNESS</span>
              </button>
            </div>

            <button
              onClick={handleStrikeTap}
              className="w-full min-h-[48px] bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              {tr.tapToStrike}
            </button>
          </div>
        )}

        {/* PHASE 2: CRITICAL EXPLOSION ANIMATION */}
        {phase === 'STRIKING' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center animate-ping">
              <span className="text-xl font-black text-rose-400">9,999</span>
            </div>
            <div className="text-sm font-bold text-rose-400 tracking-wider">
              {tr.striking}
            </div>
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-rose-500/40">
              <div className="h-full bg-rose-500 animate-pulse w-full" />
            </div>
          </div>
        )}

        {/* PHASE 3: COMMISSION CONFIRMED & REWARDS */}
        {phase === 'CONFIRMED' && (
          <div className="space-y-4 py-2 animate-fadeIn">
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-900/60 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-300">{tr.commissionConfirmed}</div>
                <div className="text-[10px] text-gray-400">{tr.rewardDesc}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-black/60 border border-white/10 rounded-lg">
                <div className="text-[10px] text-gray-400 uppercase">REWARD 01</div>
                <div className="text-emerald-400 font-bold mt-0.5">{tr.rewardCredits}</div>
              </div>
              <div className="p-3 bg-black/60 border border-cyan-500/30 rounded-lg">
                <div className="text-[10px] text-gray-400 uppercase">REWARD 02</div>
                <div className="text-cyan-300 font-bold mt-0.5">{tr.rewardDrone}</div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full min-h-[48px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
                <line x1="13" y1="19" x2="19" y2="13" />
                <line x1="16" y1="16" x2="20" y2="20" />
                <line x1="19" y1="21" x2="21" y2="19" />
              </svg>
              {tr.enterLobbyBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TacticalQuickStrikeModal;
