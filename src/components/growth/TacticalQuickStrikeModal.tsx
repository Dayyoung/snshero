import React, { useState, useEffect } from 'react';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

export interface TacticalQuickStrikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteStrike?: (reward: number) => void;
  language?: string;
}

const STRIKE_I18N: Record<string, Record<string, string>> = {
  ko: {
    modalTitle: '[엘윈 설원 수련 // 카단의 검술 입문]',
    callsignPrefix: '엘윈 원정대 견습 기사 칭호:',
    weaknessInstruction: '목각 인형의 붉은 표식을 터치하여 눈보라를 가르는 참격을 가하세요!',
    tapToStrike: '[급소 참격 가하기]',
    striking: '눈보라를 가르는 서리 참격! 9,999 CRITICAL!',
    commissionConfirmed: '[수련 완료 // 원정대 정식 임관]',
    rewardDesc: '혹한의 설원 기초 수련을 완수하여 원정 보급품이 지급되었습니다.',
    rewardCredits: '500 SNS 보급품',
    rewardItem: '성기사단 순례자의 룬 단검',
    enterLobbyBtn: '[카단과 함께 엘윈 대륙으로 출격]'
  },
  en: {
    modalTitle: '[ELWIN WILDLAND // KADAN SWORD TRAINING]',
    callsignPrefix: 'NOVICE KNIGHT TITLE ASSIGNED:',
    weaknessInstruction: 'TAP THE MARKED WEAK POINT TO UNLEASH A FROST BLADE SLASH!',
    tapToStrike: '[UNLEASH FROST SLASH]',
    striking: 'PIERCING FROST BLADE... 9,999 CRITICAL!',
    commissionConfirmed: '[TRAINING COMPLETE // KNIGHT COMMISSIONED]',
    rewardDesc: 'Basic expedition training complete. Tactical supply granted.',
    rewardCredits: '500 SNS CREDITS',
    rewardItem: 'PILGRIM RUNE DAGGER',
    enterLobbyBtn: '[DEPART TO ELWIN CONTINENT]'
  },
  ja: {
    modalTitle: '[エルウィン荒野修練 // カダンの剣術入門]',
    callsignPrefix: 'エルウィン遠征隊見習い騎士称号:',
    weaknessInstruction: '標的の急所をタップして吹雪を切り裂く一撃を放ってください！',
    tapToStrike: '[急所斬撃を発動]',
    striking: '吹雪を裂く霜の一撃！ 9,999 CRITICAL!',
    commissionConfirmed: '[修練完了 // 正式騎士任官]',
    rewardDesc: '基礎修練完了。遠征補給物資が支給されました。',
    rewardCredits: '500 SNS 補給物資',
    rewardItem: '巡礼者のルーン短剣',
    enterLobbyBtn: '[カダンと共に大陸へ出撃]'
  },
  'zh-CN': {
    modalTitle: '[艾尔温雪原试炼 // 卡丹剑术入门]',
    callsignPrefix: '艾尔温远征队见习骑士称号:',
    weaknessInstruction: '点击靶心的致命弱点，挥出撕裂暴风雪的寒霜斩击！',
    tapToStrike: '[释放致命斩击]',
    striking: '撕裂风雪的寒霜斩击！ 9,999 暴击！',
    commissionConfirmed: '[试炼完成 // 正式骑士受封]',
    rewardDesc: '雪原基础训练圆满达成，远征补给物资已全额配发。',
    rewardCredits: '500 SNS 补给点数',
    rewardItem: '巡礼者符文短剑',
    enterLobbyBtn: '[与卡丹一同奔赴雪原大陆]'
  }
};

export const TacticalQuickStrikeModal: React.FC<TacticalQuickStrikeModalProps> = ({
  isOpen,
  onClose,
  onCompleteStrike,
  language = 'ko'
}) => {
  const { theme } = useGameSettings();
  const [callsign, setCallsign] = useState<string>('');
  const [isStriking, setIsStriking] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const t = STRIKE_I18N[language] || STRIKE_I18N.ko;

  useEffect(() => {
    if (!isOpen) return;
    let savedCallsign = localStorage.getItem('hero_guest_callsign');
    if (!savedCallsign) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      savedCallsign = `KNIGHT-${randomSuffix}`;
      localStorage.setItem('hero_guest_callsign', savedCallsign);
      localStorage.setItem('hero_guest_callsign_granted', 'true');
    }
    setCallsign(savedCallsign);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStrike = () => {
    if (isStriking || isCompleted) return;
    setIsStriking(true);
    triggerHaptic('heavy');

    setTimeout(() => {
      setIsStriking(false);
      setIsCompleted(true);
      triggerHaptic('victory');
      try {
        localStorage.setItem('hero_tactical_quick_strike_done', 'true');
      } catch {
        // storage quota safe
      }
    }, 700);
  };

  const handleFinish = () => {
    triggerHaptic('tap');
    if (onCompleteStrike) {
      onCompleteStrike(500);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 font-mono text-xs animate-fade-in select-none">
      <div className="w-full max-w-sm rounded-none border border-stone-800 bg-[#141212] p-5 text-stone-200 relative">
        {/* 상단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-stone-500 hover:text-white p-1"
          title="Close"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 헤더 */}
        <div className="mb-4">
          <div className="text-[10px] text-amber-400 font-bold tracking-wider uppercase mb-1">
            {t.modalTitle}
          </div>
          <div className="flex items-center gap-1.5 text-white font-bold text-sm">
            <span className="text-stone-400 text-xs font-normal">{t.callsignPrefix}</span>
            <span className="text-amber-300 font-mono tracking-widest">{callsign}</span>
          </div>
        </div>

        {!isCompleted ? (
          <div className="space-y-4">
            <div className="p-3 bg-stone-900/80 border border-stone-800 rounded-none text-stone-300 text-xs leading-relaxed">
              {t.weaknessInstruction}
            </div>

            {/* 수련 목각 인형 타격 타겟 영역 */}
            <div className="relative h-44 bg-stone-950 border border-stone-800 flex items-center justify-center overflow-hidden">
              {/* 목각 인형 실루엣 */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <svg className="w-24 h-24 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z" />
                  <path d="M6 10v6a6 6 0 0 0 12 0v-6" />
                  <line x1="12" y1="16" x2="12" y2="22" />
                  <line x1="9" y1="22" x2="15" y2="22" />
                </svg>
              </div>

              {/* 붉은 약점 표식 버튼: DESIGN.md 4px 사각 타겟 스타일 */}
              <button
                onClick={handleStrike}
                disabled={isStriking}
                className="relative z-10 w-28 h-28 rounded-sm border border-red-500/80 bg-stone-900 hover:bg-red-950/40 flex flex-col items-center justify-center text-red-400 cursor-pointer active:bg-red-950/60 transition-colors"
              >
                <div className="absolute top-1 right-1 text-[8px] text-red-400/80 font-bold">[WEAKNESS]</div>
                <svg className="w-8 h-8 text-red-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="22" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="12" x2="2" y2="12" />
                  <line x1="12" y1="6" x2="12" y2="2" />
                  <line x1="12" y1="22" x2="12" y2="18" />
                </svg>
                <span className="text-[10px] font-bold tracking-tight text-white">{t.tapToStrike}</span>
              </button>

              {isStriking && (
                <div className="absolute inset-0 bg-red-950/70 z-20 flex items-center justify-center font-bold text-amber-300 text-xs px-2 text-center animate-pulse">
                  {t.striking}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-stone-900/80 border border-stone-800 rounded-none space-y-2">
              <div className="text-amber-400 font-bold text-xs">{t.commissionConfirmed}</div>
              <div className="text-stone-300 text-xs leading-relaxed">{t.rewardDesc}</div>
              <div className="pt-2 border-t border-stone-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">[보급 재화]</span>
                  <span className="text-amber-300 font-bold">+{t.rewardCredits}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">[입문 유물]</span>
                  <span className="text-white font-bold">{t.rewardItem}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full min-h-[44px] rounded-sm border border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{t.enterLobbyBtn}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TacticalQuickStrikeModal;
export const GuestAdventurerLicenseModal = TacticalQuickStrikeModal;
