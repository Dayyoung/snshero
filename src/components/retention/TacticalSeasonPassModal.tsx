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
    modalTitle: '[눈히어로 시즌 1 // 혹한의 성전 로드맵]',
    badge: '30일 엘윈 설원 순찰 성전 듀얼 트랙',
    boosterActive: '[성전의 축복: 2X EXP 복귀 부스터 가동 중 48:00:00]',
    standardTrack: '[견습 기사단 트랙 (무료)]',
    blackOpsTrack: '[성기사단 특무 트랙 (골드)]',
    upgradeBops: '[성기사단 패스 해금]',
    bopsUnlocked: '[성기사단 권한 활성]',
    claimAll: '[성전 보상 일괄 수령]',
    tierLabel: '성전 등급',
    claimed: '[수령 완료]',
    claim: '[수령]',
    locked: '[잠김]',
    currentProgress: '성전 경험치 진행도',
    close: '[닫기]'
  },
  en: {
    modalTitle: '[SNOW HERO SEASON 01 // FROST CRUSADE PASS]',
    badge: '30-DAY ELWIN EXPEDITION DUAL-TRACK',
    boosterActive: '[CRUSADE BLESSING: 2X EXP CATCH-UP BOOSTER ACTIVE]',
    standardTrack: '[NOVICE KNIGHT TRACK (FREE)]',
    blackOpsTrack: '[HOLY PALADIN TRACK (GOLD)]',
    upgradeBops: '[UNLOCK PALADIN PASS]',
    bopsUnlocked: '[PALADIN CLEARANCE ACTIVE]',
    claimAll: '[CLAIM ALL REWARDS]',
    tierLabel: 'TIER',
    claimed: '[CLAIMED]',
    claim: '[CLAIM]',
    locked: '[LOCKED]',
    currentProgress: 'CRUSADE EXP PROGRESS',
    close: '[CLOSE]'
  },
  ja: {
    modalTitle: '[スノーヒーロー シーズン01 // 酷寒の聖戦パス]',
    badge: '30日エルウィン遠征デュアルトラック',
    boosterActive: '[聖戦の加護: 2倍EXPブースター稼働中]',
    standardTrack: '[見習い騎士トラック (無料)]',
    blackOpsTrack: '[聖騎士団特務トラック (ゴールド)]',
    upgradeBops: '[聖騎士団パス開放]',
    bopsUnlocked: '[聖騎士団認可済]',
    claimAll: '[全報酬一括受取]',
    tierLabel: '等級',
    claimed: '[受取済]',
    claim: '[受取]',
    locked: '[施錠]',
    currentProgress: '聖戦経験値進行度',
    close: '[閉じる]'
  },
  'zh-CN': {
    modalTitle: '[雪原英雄 第一季 // 极寒圣战通行证]',
    badge: '30天艾尔温远征双轨战令',
    boosterActive: '[圣战祝福: 双倍EXP追赶加速生效中]',
    standardTrack: '[见习骑士战轨 (免费)]',
    blackOpsTrack: '[圣骑士特务战轨 (黄金)]',
    upgradeBops: '[解锁圣骑士特务战令]',
    bopsUnlocked: '[圣骑士特务特权已激活]',
    claimAll: '[一键领取圣战战利品]',
    tierLabel: '阶位',
    claimed: '[已领取]',
    claim: '[领取]',
    locked: '[未解锁]',
    currentProgress: '圣战经验推进度',
    close: '[关闭]'
  }
};

export const TacticalSeasonPassModal: React.FC<TacticalSeasonPassModalProps> = ({
  isOpen,
  onClose,
  language = 'ko'
}) => {
  const { theme } = useGameSettings();
  const {
    passState,
    currentTier,
    isBoosterActive,
    claimTier,
    claimAllAvailable,
    unlockBlackOps
  } = useSeasonPass();

  const progressInTier = passState.currentExp % EXP_PER_TIER;
  const hasClaimableRewards = true;

  const t = PASS_I18N[language] || PASS_I18N.ko;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] bg-black/85 flex items-center justify-center p-3 font-mono text-xs select-none animate-fade-in"
    >
      <div className="w-full max-w-2xl max-h-[92dvh] bg-[#141212] border border-stone-800 rounded-none text-stone-200 flex flex-col relative overflow-hidden">
        {/* 모달 상단 헤더 */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between shrink-0 bg-[#181616]">
          <div>
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">
              {t.badge}
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              {t.modalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-white transition-colors"
            title={t.close}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 2X 복귀 부스터 인디케이터 */}
        {isBoosterActive && (
          <div className="bg-amber-950/30 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-[11px] text-amber-300">
            <div className="flex items-center gap-2">
              <span className="font-bold">{t.boosterActive}</span>
            </div>
            <span className="text-amber-400 font-bold tracking-widest">[2X BOOST]</span>
          </div>
        )}

        {/* 경험치 진행도 바 및 상단 액션 */}
        <div className="p-4 bg-stone-900/60 border-b border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-stone-400 font-bold">
                {t.tierLabel} <span className="text-amber-300 text-sm">{currentTier}</span> / {TOTAL_TIERS}
              </span>
              <span className="text-stone-400">
                {progressInTier} / {EXP_PER_TIER} EXP
              </span>
            </div>
            <div className="w-full h-2 bg-stone-950 border border-stone-800 rounded-none overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (progressInTier / EXP_PER_TIER) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {!passState.isBlackOpsUnlocked ? (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('heavy');
                  unlockBlackOps();
                }}
                className="flex-1 sm:flex-none px-3 min-h-[36px] bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500 text-amber-300 font-bold rounded-sm text-xs transition-all active:scale-95"
              >
                {t.upgradeBops}
              </button>
            ) : (
              <span className="px-2.5 py-1.5 bg-stone-900 border border-amber-500/40 text-amber-300 rounded-none text-[11px] font-bold">
                {t.bopsUnlocked}
              </span>
            )}

            {hasClaimableRewards && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('victory');
                  claimAllAvailable();
                }}
                className="flex-1 sm:flex-none px-3 min-h-[36px] bg-stone-800 hover:bg-stone-700 border border-stone-600 text-white font-bold rounded-sm text-xs transition-all active:scale-95"
              >
                {t.claimAll}
              </button>
            )}
          </div>
        </div>

        {/* 30개 티어 로드맵 스크롤 목록 (OpenCode.ai 모노스페이스 플랫) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {SEASON_TIERS.map((tierData: PassTier) => {
            const isUnlocked = currentTier >= tierData.tier;
            const isStdClaimed = passState.claimedFreeTiers.includes(tierData.tier);
            const isBopsClaimed = passState.claimedBlackOpsTiers.includes(tierData.tier);

            return (
              <div
                key={tierData.tier}
                className={`p-3 border rounded-none transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  isUnlocked
                    ? 'bg-stone-900/80 border-stone-700 text-white'
                    : 'bg-stone-950/40 border-stone-800/80 text-stone-500'
                }`}
              >
                {/* 티어 번호 */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-none border flex items-center justify-center font-bold text-xs shrink-0 ${
                      isUnlocked
                        ? 'border-amber-500 bg-amber-950/30 text-amber-300'
                        : 'border-stone-800 bg-stone-900 text-stone-600'
                    }`}
                  >
                    {tierData.tier}
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wide">
                      {t.tierLabel} {tierData.tier} // {tierData.expRequired} EXP
                    </div>
                  </div>
                </div>

                {/* 듀얼 트랙 보상 (무료 vs 골드) */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  {/* 일반 트랙 */}
                  <div className="p-2 border border-stone-800 bg-stone-950/60 rounded-none flex items-center justify-between gap-2 text-xs">
                    <div className="truncate">
                      <span className="text-[10px] text-stone-500 block uppercase">[일반 보급]</span>
                      <span className={isUnlocked ? 'text-stone-300 font-bold' : 'text-stone-600'}>
                        {tierData.freeReward.title}
                      </span>
                    </div>
                    {isUnlocked && !isStdClaimed && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap');
                          claimTier(tierData.tier, 'free');
                        }}
                        className="px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-white font-bold rounded-sm text-[10px]"
                      >
                        {t.claim}
                      </button>
                    )}
                    {isStdClaimed && (
                      <span className="text-stone-500 text-[10px] font-bold">{t.claimed}</span>
                    )}
                    {!isUnlocked && (
                      <span className="text-stone-700 text-[10px]">{t.locked}</span>
                    )}
                  </div>

                  {/* 특무 트랙 */}
                  <div className="p-2 border border-amber-900/30 bg-amber-950/10 rounded-none flex items-center justify-between gap-2 text-xs">
                    <div className="truncate">
                      <span className="text-[10px] text-amber-500/70 block uppercase">[성기사단 보급]</span>
                      <span className={isUnlocked && passState.isBlackOpsUnlocked ? 'text-amber-300 font-bold' : 'text-stone-600'}>
                        {tierData.blackOpsReward.title}
                      </span>
                    </div>
                    {isUnlocked && passState.isBlackOpsUnlocked && !isBopsClaimed && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap');
                          claimTier(tierData.tier, 'blackops');
                        }}
                        className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500 text-amber-300 font-bold rounded-sm text-[10px]"
                      >
                        {t.claim}
                      </button>
                    )}
                    {isBopsClaimed && (
                      <span className="text-amber-500/80 text-[10px] font-bold">{t.claimed}</span>
                    )}
                    {(!isUnlocked || !passState.isBlackOpsUnlocked) && (
                      <span className="text-stone-700 text-[10px]">{t.locked}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 닫기 버튼 */}
        <div className="p-3 border-t border-stone-800 bg-[#181616] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 min-h-[44px] rounded-sm border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TacticalSeasonPassModal;
