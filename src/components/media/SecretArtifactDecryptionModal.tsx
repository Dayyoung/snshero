import React, { useState, useEffect } from 'react';
import { Language, ViewType } from '../../types';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

interface SecretArtifactDecryptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType) => void;
  articleId: string;
  sourceTitle?: string;
  language?: Language;
}

const I18N_TEXTS: Record<string, Record<string, string>> = {
  ko: {
    badge: '[카단 연대기 고대 서약 유물 감지]',
    title: '[설원 고대 유적 서약 해독]',
    subtitle: '소설 챕터 완독 영웅 보상',
    readyMsg: '완독한 소설 기록에서 설원의 고대 유물이 반응하기 시작했습니다.',
    decryptBtn: '[고대 유물 룬 봉인 해제]',
    decrypting: '고대 룬 문자 해석 및 마나 정화 중...',
    successTitle: '[봉인 해제 완료: 영웅 소환권 획득!]',
    rewardDesc: '순례자 헤르쿨의 룬 단검이 빛을 발하며 영웅 소환석이 지급되었습니다.',
    rewardItem: '영웅 소환 지령서 x1 (+300 SNS)',
    summonBtn: '[영웅 소환의 제단으로 출격]',
    closeBtn: '[닫기]'
  },
  en: {
    badge: '[KADAN CHRONICLES ANCIENT RELIC DETECTED]',
    title: '[FROST RUIN VOW DECRYPTION]',
    subtitle: 'REWARD FOR READING NOVEL CHAPTER',
    readyMsg: 'Ancient frost relic resonates with the completed chapter lore.',
    decryptBtn: '[UNSEAL ANCIENT RUNE]',
    decrypting: 'DECODING RUNE TEXT & PURIFYING MANA...',
    successTitle: '[RUNE UNSEALED: HERO SUMMON TICKET GRANTED!]',
    rewardDesc: 'Herkul pilgrim dagger resonates, granting hero summoning stone.',
    rewardItem: 'HERO REQUISITION TICKET x1 (+300 SNS)',
    summonBtn: '[DEPLOY TO SUMMON ALTAR]',
    closeBtn: '[CLOSE]'
  }
};

export const SecretArtifactDecryptionModal: React.FC<SecretArtifactDecryptionModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  articleId,
  sourceTitle = '소설 기록',
  language = 'ko'
}) => {
  const { theme } = useGameSettings();
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [isDecrypted, setIsDecrypted] = useState<boolean>(false);

  const t = I18N_TEXTS[language] || I18N_TEXTS.ko;

  useEffect(() => {
    if (!isOpen) {
      setIsDecrypting(false);
      setIsDecrypted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDecrypt = () => {
    setIsDecrypting(true);
    triggerHaptic('heavy');

    setTimeout(() => {
      setIsDecrypting(false);
      setIsDecrypted(true);
      triggerHaptic('victory');

      // 보상 저장 (로컬스토리지)
      try {
        const savedSns = localStorage.getItem('hero_user_sns') || '1000';
        const newSns = parseInt(savedSns, 10) + 300;
        localStorage.setItem('hero_user_sns', String(newSns));
        localStorage.setItem(`hero_artifact_decrypted_${articleId}`, 'true');
        window.dispatchEvent(new CustomEvent('snshero_sns_updated'));
      } catch {
        // ignore
      }
    }, 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] bg-black/85 flex items-center justify-center p-3 font-mono text-xs select-none animate-fade-in"
    >
      <div className="w-full max-w-sm bg-[#141212] border border-stone-800 rounded-none text-stone-200 flex flex-col relative overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between shrink-0 bg-[#181616]">
          <div>
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">
              {t.badge}
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              {t.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 본문 콘텐츠 */}
        <div className="p-4 space-y-4">
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-none space-y-1">
            <div className="text-[10px] text-stone-500 uppercase">{t.subtitle}</div>
            <div className="text-xs font-bold text-amber-300 truncate">[{sourceTitle}]</div>
            <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
              {t.readyMsg}
            </p>
          </div>

          {!isDecrypted ? (
            <div className="space-y-3">
              <div className="h-32 bg-stone-950 border border-stone-800 rounded-none flex flex-col items-center justify-center text-center p-3 relative">
                {/* 유물 룬 아이콘 */}
                <div className={`w-12 h-12 rounded-none border border-amber-500/50 bg-amber-950/20 flex items-center justify-center text-amber-400 mb-2 ${isDecrypting ? 'animate-spin' : ''}`}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <polygon points="12 2 15 8 22 9 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9 9 8 12 2" />
                  </svg>
                </div>
                <div className="text-xs font-bold text-stone-300">
                  {isDecrypting ? t.decrypting : '고대 성기사단 룬 봉인 잠김'}
                </div>
              </div>

              <button
                type="button"
                disabled={isDecrypting}
                onClick={handleDecrypt}
                className="w-full min-h-[44px] rounded-sm border border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs active:scale-95 transition-all"
              >
                {t.decryptBtn}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-none space-y-2 text-center">
                <div className="text-amber-400 font-bold text-sm">
                  {t.successTitle}
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {t.rewardDesc}
                </p>
                <div className="p-2 bg-stone-950 border border-stone-800 text-amber-300 font-bold text-xs">
                  {t.rewardItem}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('shop');
                }}
                className="w-full min-h-[44px] rounded-sm border border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs"
              >
                {t.summonBtn}
              </button>
            </div>
          )}
        </div>

        {/* 닫기 버튼 */}
        <div className="p-3 border-t border-stone-800 bg-[#181616] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 min-h-[44px] rounded-sm border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecretArtifactDecryptionModal;
export const StoryArtifactUnsealModal = SecretArtifactDecryptionModal;
